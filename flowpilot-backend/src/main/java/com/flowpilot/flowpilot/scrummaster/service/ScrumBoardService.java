package com.flowpilot.flowpilot.scrummaster.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumBoardDto;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumProjectDto;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumTaskDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.model.ScrumWipLimit;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumWipLimitRepository;

/**
 * The scrum board (SRS Module 5): one sprint's tasks grouped into flow columns,
 * with WIP limits, filtering and search.
 *
 * The board is scoped to a single sprint. Tasks that sit in the product backlog
 * (no sprint) are deliberately left out even though BACKLOG is a column here:
 * pulling them in would make the header totals disagree with the sprint's own
 * committed and remaining points, which is the number the team is judged on.
 */
@Service
public class ScrumBoardService {

    /**
     * Columns in flow order with their display labels. A LinkedHashMap is the
     * single source of both the order and the labels, so the two cannot drift.
     */
    private static final Map<ScrumTask.Status, String> COLUMN_LABELS;

    static {

        Map<ScrumTask.Status, String> labels = new LinkedHashMap<>();

        labels.put(ScrumTask.Status.BACKLOG, "Backlog");
        labels.put(ScrumTask.Status.SPRINT_READY, "Sprint ready");
        labels.put(ScrumTask.Status.TODO, "To do");
        labels.put(ScrumTask.Status.IN_PROGRESS, "In progress");
        labels.put(ScrumTask.Status.CODE_REVIEW, "Review");
        labels.put(ScrumTask.Status.TESTING, "Testing");
        labels.put(ScrumTask.Status.DONE, "Done");
        labels.put(ScrumTask.Status.BLOCKED, "Blocked");

        COLUMN_LABELS = Collections.unmodifiableMap(labels);
    }

    /**
     * The optional board filters, carried together so the board and the
     * WIP-limit update can both honour whatever the user has selected.
     */
    public record BoardFilter(
            Long assigneeId,
            String priority,
            String label,
            String search,
            Boolean unassigned
    ) {}

    private final ScrumTaskRepository taskRepository;
    private final ScrumSprintRepository sprintRepository;
    private final ScrumWipLimitRepository wipLimitRepository;
    private final UserRepository userRepository;
    private final ScrumTaskService taskService;
    private final ScrumProjectService projectService;
    private final com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository superAdminUserRepository;


    public ScrumBoardService(
            ScrumTaskRepository taskRepository,
            ScrumSprintRepository sprintRepository,
            ScrumWipLimitRepository wipLimitRepository,
            UserRepository userRepository,
            ScrumTaskService taskService,
            ScrumProjectService projectService,
            com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository superAdminUserRepository
    ) {
        this.taskRepository = taskRepository;
        this.sprintRepository = sprintRepository;
        this.wipLimitRepository = wipLimitRepository;
        this.userRepository = userRepository;
        this.taskService = taskService;
        this.projectService = projectService;
        this.superAdminUserRepository = superAdminUserRepository;
    }


    // ============================================
    // READ THE BOARD
    // ============================================

    /**
     * Builds the board for one project's sprint.
     *
     * A scrum master picks the project first and works inside it, so projectId
     * is the outer scope: it decides which sprint is shown when no sprint is
     * named, and it narrows the assignee list to that project's team. Both ids
     * stay optional so an unscoped call still returns the active sprint, which
     * is what the sprint selector's "current" default asks for.
     */
    // Read-only transaction: ScrumTask.sprint is lazy, so card mapping must
    // stay inside an open session no matter how open-in-view is configured
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public ScrumBoardDto.Response getBoard(
            Long projectId,
            Long sprintId,
            BoardFilter filter
    ) {

        Optional<ScrumSprint> sprintOpt = findSprint(projectId, sprintId);

        if (sprintOpt.isEmpty()) {
            if (sprintId != null) {
                throw new ScrumNotFoundException("Sprint " + sprintId + " not found.");
            }
            List<ScrumBoardDto.Column> emptyColumns = new ArrayList<>();
            Map<ScrumTask.Status, Integer> limits = loadWipLimits();
            for (Map.Entry<ScrumTask.Status, String> column : COLUMN_LABELS.entrySet()) {
                ScrumTask.Status status = column.getKey();
                Integer wipLimit = limits.get(status);
                emptyColumns.add(new ScrumBoardDto.Column(
                        status.name(),
                        column.getValue(),
                        0, 0, wipLimit, false, 0, List.of()
                ));
            }
            return new ScrumBoardDto.Response(
                    projectId,
                    projectNameOf(projectId),
                    null,
                    "No Sprints",
                    null,
                    0,
                    0,
                    List.of(),
                    loadMembers(projectId),
                    emptyColumns
            );
        }

        ScrumSprint sprint = sprintOpt.get();

        // The sprint is the authority on the project, not the request: asking
        // for no project and landing on a sprint still tells the client which
        // project it is looking at.
        Long scopeProjectId = sprint.getProjectId();

        List<ScrumTask> tasks =
                taskRepository.findBySprintIdOrderByStatusAscTaskKeyAsc(sprint.getId());

        // Map in batch with single-query subtask counts
        List<ScrumTaskDto.Card> allCards = taskService.toCards(tasks);

        // Labels come from the unfiltered set: filtering by a label must not
        // remove that label from the control the user just used
        List<String> availableLabels = allCards.stream()
                .map(ScrumTaskDto.Card::labels)
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .toList();

        List<ScrumTaskDto.Card> visibleCards = applyFilters(allCards, filter);

        Map<ScrumTask.Status, Integer> limits = loadWipLimits();

        List<ScrumBoardDto.Column> columns = new ArrayList<>();

        int totalTasks = 0;
        int totalPoints = 0;

        for (Map.Entry<ScrumTask.Status, String> column : COLUMN_LABELS.entrySet()) {

            ScrumTask.Status status = column.getKey();

            // The column's real contents, before any filter is applied. A WIP
            // limit is a property of the column, not of who is looking at it,
            // so a breach must not vanish the moment someone filters
            List<ScrumTaskDto.Card> columnCards = allCards.stream()
                    .filter(card -> status.name().equals(card.status()))
                    .toList();

            // Every column is always emitted, even when a filter empties it —
            // a column that vanishes cannot be dropped onto
            List<ScrumTaskDto.Card> cards = visibleCards.stream()
                    .filter(card -> status.name().equals(card.status()))
                    .toList();

            int columnPoints = columnCards.stream()
                    .mapToInt(card -> card.storyPoints() == null ? 0 : card.storyPoints())
                    .sum();

            Integer wipLimit = limits.get(status);

            columns.add(
                    new ScrumBoardDto.Column(
                            status.name(),
                            column.getValue(),
                            columnCards.size(),
                            columnPoints,
                            wipLimit,
                            wipLimit != null && columnCards.size() > wipLimit,
                            // visibleCards is a subset of allCards, so the
                            // difference is exactly what the filter is hiding
                            columnCards.size() - cards.size(),
                            cards
                    )
            );

            totalTasks += columnCards.size();
            totalPoints += columnPoints;
        }

        return new ScrumBoardDto.Response(
                scopeProjectId,
                projectNameOf(scopeProjectId),
                sprint.getId(),
                sprint.getName(),
                sprint.getStatus() == null ? null : sprint.getStatus().name(),
                // Unfiltered, so the sprint's task and point counts read the
                // same here as they do on the sprint and analytics screens
                totalTasks,
                totalPoints,
                availableLabels,
                loadMembers(scopeProjectId),
                columns
        );
    }


    // ============================================
    // MOVE A CARD
    // ============================================

    /** Applies a drag-and-drop move and returns the card in its new column. */
    @Transactional
    public ScrumTaskDto.Card moveTask(Long taskId, ScrumBoardDto.MoveRequest request) {

        if (taskId == null) {
            throw new ScrumValidationException("Task id is required.");
        }

        if (request == null) {
            throw new ScrumValidationException("Move details are required.");
        }

        ScrumTask.Status target = parseEnum(
                ScrumTask.Status.class, request.status(), "board column");

        ScrumTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Task " + taskId + " not found."));

        // One rule, one implementation: ScrumTaskService owns the BLOCKED
        // invariant, so a drag on the board and a PATCH on the task cannot end
        // up enforcing different things about the same column
        String blockedReason = taskService.resolveBlockedReason(
                task, target, request.blockedReason());

        // moveTo maintains enteredStatusAt and completedAt, and clears the
        // stale reason when the card leaves BLOCKED
        task.moveTo(target);

        // Set after the move: moveTo wipes the reason for non-blocked columns,
        // and re-blocking an already blocked card must still refresh the text
        if (target == ScrumTask.Status.BLOCKED) {
            task.setBlockedReason(blockedReason);
        }

        return taskService.toCard(taskRepository.save(task));
    }


    // ============================================
    // WIP LIMITS
    // ============================================

    /**
     * Columns that actually carry a limit, in flow order. Unlimited columns are
     * absent rather than null, so the client has one rule: no entry, no limit.
     */
    public Map<String, Integer> getWipLimits() {

        Map<ScrumTask.Status, Integer> limits = loadWipLimits();

        Map<String, Integer> response = new LinkedHashMap<>();

        for (ScrumTask.Status status : COLUMN_LABELS.keySet()) {

            Integer limit = limits.get(status);

            if (limit != null) {
                response.put(status.name(), limit);
            }
        }

        return response;
    }


    /**
     * Upserts one column's limit and hands back the board it applies to.
     *
     * The limit reads exactly three ways, as WipLimitRequest documents: null or
     * 0 clears the limit and is stored as null, so the read path never has to
     * tell the two apart; a positive number sets it; a negative number is a
     * ScrumValidationException rather than a silent "unlimited".
     */
    @Transactional
    public ScrumBoardDto.Response setWipLimit(
            ScrumBoardDto.WipLimitRequest request,
            Long projectId,
            Long sprintId,
            BoardFilter filter
    ) {

        if (request == null) {
            throw new ScrumValidationException("WIP limit details are required.");
        }

        ScrumTask.Status status = parseEnum(
                ScrumTask.Status.class, request.status(), "board column");

        Integer limit = request.limit();

        if (limit != null && limit < 0) {
            throw new ScrumValidationException(
                    "WIP limit cannot be negative: " + limit);
        }

        Integer stored = (limit == null || limit == 0) ? null : limit;

        ScrumWipLimit wipLimit = wipLimitRepository.findByStatus(status)
                .orElseGet(() -> new ScrumWipLimit(status, null));

        wipLimit.setLimitValue(stored);

        wipLimitRepository.save(wipLimit);

        return getBoard(projectId, sprintId, filter);
    }


    // ============================================
    // HELPERS
    // ============================================

    private Optional<ScrumSprint> findSprint(Long projectId, Long sprintId) {

        if (sprintId != null) {

            Optional<ScrumSprint> sprintOpt = sprintRepository.findById(sprintId);

            if (sprintOpt.isPresent()) {
                ScrumSprint sprint = sprintOpt.get();
                if (projectId != null && !projectId.equals(sprint.getProjectId())) {

                    throw new ScrumValidationException(
                            "Sprint " + sprintId + " belongs to "
                                    + (sprint.getProjectId() == null
                                            ? "no project"
                                            : "project " + sprint.getProjectId())
                                    + ", not project " + projectId + ".");
                }
            }

            return sprintOpt;
        }

        if (projectId != null) {

            return sprintRepository
                    .findFirstByProjectIdAndStatusOrderBySprintNumberDesc(projectId, ScrumSprint.Status.ACTIVE)
                    .or(() -> sprintRepository
                            .findFirstByProjectIdAndStatusOrderByIdDesc(projectId, ScrumSprint.Status.ACTIVE))
                    .or(() -> sprintRepository
                            .findFirstByProjectIdAndStatusOrderBySprintNumberDesc(projectId, ScrumSprint.Status.PLANNED))
                    .or(() -> sprintRepository
                            .findFirstByProjectIdOrderBySprintNumberDesc(projectId))
                    .or(() -> sprintRepository
                            .findFirstByProjectIdOrderByIdDesc(projectId));
        }

        return sprintRepository.findCurrentOrLatest();
    }


    private String projectNameOf(Long projectId) {

        if (projectId == null) {
            return null;
        }

        return projectService.findProject(projectId)
                .map(ScrumProjectDto.Project::name)
                .orElse(null);
    }


    private List<ScrumTaskDto.Card> applyFilters(
            List<ScrumTaskDto.Card> cards,
            BoardFilter filter
    ) {

        if (filter == null) {
            return cards;
        }

        boolean unassignedOnly = Boolean.TRUE.equals(filter.unassigned());

        // Reject the contradiction instead of silently returning nothing
        if (unassignedOnly && filter.assigneeId() != null) {
            throw new ScrumValidationException(
                    "assigneeId cannot be combined with unassigned=true.");
        }

        boolean assignedOnly = Boolean.FALSE.equals(filter.unassigned());

        // Parsed and normalised up front so a bad priority is reported even
        // when the sprint has no cards to test it against
        String priority = trimToNull(filter.priority()) == null
                ? null
                : parseEnum(ScrumTask.Priority.class, filter.priority(), "priority").name();

        String label = trimToNull(filter.label());

        String search = trimToNull(filter.search()) == null
                ? null
                : trimToNull(filter.search()).toLowerCase(Locale.ROOT);

        List<ScrumTaskDto.Card> result = new ArrayList<>();

        for (ScrumTaskDto.Card card : cards) {

            if (filter.assigneeId() != null
                    && !filter.assigneeId().equals(card.assigneeId())) {
                continue;
            }

            if (unassignedOnly && card.assigneeId() != null) {
                continue;
            }

            if (assignedOnly && card.assigneeId() == null) {
                continue;
            }

            if (priority != null && !priority.equals(card.priority())) {
                continue;
            }

            if (label != null && !hasLabel(card, label)) {
                continue;
            }

            if (search != null && !matchesSearch(card, search)) {
                continue;
            }

            result.add(card);
        }

        return result;
    }


    private static boolean hasLabel(ScrumTaskDto.Card card, String label) {

        if (card.labels() == null) {
            return false;
        }

        return card.labels().stream().anyMatch(label::equalsIgnoreCase);
    }


    /**
     * Substring match on key, title or description — the three fields the
     * board's search box promises, so the placeholder and the query agree.
     */
    private static boolean matchesSearch(ScrumTaskDto.Card card, String lowerSearch) {

        return containsIgnoreCase(card.taskKey(), lowerSearch)
                || containsIgnoreCase(card.title(), lowerSearch)
                || containsIgnoreCase(card.description(), lowerSearch);
    }


    /** Null-safe, case-insensitive containment; the search term arrives lowered. */
    private static boolean containsIgnoreCase(String value, String lowerSearch) {

        return value != null
                && value.toLowerCase(Locale.ROOT).contains(lowerSearch);
    }


    /** Only positive limits are kept: 0 and null are stored forms of "no limit". */
    private Map<ScrumTask.Status, Integer> loadWipLimits() {

        Map<ScrumTask.Status, Integer> limits = new LinkedHashMap<>();

        for (ScrumWipLimit wipLimit : wipLimitRepository.findAll()) {

            if (wipLimit.getStatus() == null) {
                continue;
            }

            Integer value = wipLimit.getLimitValue();

            if (value != null && value > 0) {
                limits.put(wipLimit.getStatus(), value);
            }
        }

        return limits;
    }


    /**
     * Who a card can be assigned to.
     *
     * Scoped to the project's team when a project is in play, so a scrum master
     * assigns work to people who are actually on the project. The join has to
     * go through email: a task's assignee is a `users` row, while the PM
     * module's team is made of `superadmin_users` rows, and email is the only
     * key the two tables share.
     */
    @SuppressWarnings("null")
    private List<ScrumTaskDto.Member> loadMembers(Long projectId) {

        Comparator<User> byName = Comparator.comparing(
                User::getName,
                Comparator.nullsLast(String::compareToIgnoreCase));

        List<User> candidates = userRepository.findAll();

        if (projectId != null) {

            Set<String> teamEmails = projectService.membersOfProject(projectId)
                    .stream()
                    .map(ScrumProjectDto.TeamMember::email)
                    .filter(Objects::nonNull)
                    .map(email -> email.trim().toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());

            List<User> team = candidates.stream()
                    .filter(user -> user.getEmail() != null
                            && teamEmails.contains(
                                    user.getEmail().trim().toLowerCase(Locale.ROOT)))
                    .toList();

            // Deliberately not narrowing to an empty list. A project with no
            // matched team would leave the board unable to assign anything,
            // which reads as a broken screen rather than an unstaffed project.
            if (!team.isEmpty()) {
                candidates = team;
            }
        }

        return candidates.stream()
                .sorted(byName)
                .map(user -> new ScrumTaskDto.Member(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole(),
                        initialsOf(user.getName()),
                        resolveDepartment(user.getEmail(), user.getRole())
                ))
                .toList();
    }

    private String resolveDepartment(String email, String role) {
        return taskService.resolveDepartment(email, role);
    }


    /**
     * Mirrors ScrumTask.initialsOf so a member's avatar in the filter control
     * reads the same as the initials on their cards. Kept as a local copy
     * rather than a call to it because this one uppercases with Locale.ROOT:
     * the member list is shared data, so it must not change shape with the
     * server's locale.
     */
    private static String initialsOf(String name) {

        if (name == null || name.isBlank()) {
            return "?";
        }

        String[] parts = name.trim().split("\\s+");

        if (parts.length == 1) {
            return parts[0].substring(0, 1).toUpperCase(Locale.ROOT);
        }

        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1))
                .toUpperCase(Locale.ROOT);
    }


    /** Case-insensitive enum parsing with the bad value echoed back. */
    private static <E extends Enum<E>> E parseEnum(
            Class<E> type, String raw, String what) {

        String value = trimToNull(raw);

        if (value == null) {
            throw new ScrumValidationException(what + " is required.");
        }

        try {
            return Enum.valueOf(type, value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ScrumValidationException("Unknown " + what + ": " + raw);
        }
    }


    private static String trimToNull(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
