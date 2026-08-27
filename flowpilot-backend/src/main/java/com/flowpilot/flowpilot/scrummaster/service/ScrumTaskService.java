package com.flowpilot.flowpilot.scrummaster.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumTaskDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/**
 * Task management, SRS Module 4.
 *
 * This service also owns the two conversions every other scrum service needs —
 * ScrumTask to Card, and the comma-separated label column to and from a list —
 * so the board, sprint and analytics services stay consistent with it instead
 * of each re-deriving "stuck", initials or label parsing slightly differently.
 */
@Service
public class ScrumTaskService {

    /** A card is stuck once it has sat this many whole days in one column. */
    private static final int STUCK_DAYS = 3;

    private static final int MAX_STORY_POINTS = 100;

    private static final int MAX_TITLE_LENGTH = 255;

    private static final int MAX_LABELS_LENGTH = 255;

    private static final int MAX_BLOCKED_REASON_LENGTH = 500;

    /** Keys read as T-001, T-002 … zero padded so they sort lexically. */
    private static final String TASK_KEY_FORMAT = "T-%03d";

    private final ScrumTaskRepository taskRepository;
    private final ScrumSprintRepository sprintRepository;
    private final UserRepository userRepository;


    public ScrumTaskService(
            ScrumTaskRepository taskRepository,
            ScrumSprintRepository sprintRepository,
            UserRepository userRepository
    ) {
        this.taskRepository = taskRepository;
        this.sprintRepository = sprintRepository;
        this.userRepository = userRepository;
    }


    // ============================================
    // ASSIGNABLE MEMBERS
    // ============================================
    public List<ScrumTaskDto.Member> listMembers() {

        List<User> users = new ArrayList<>(userRepository.findAll());

        users.sort(
                Comparator.comparing(
                        User::getName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                )
        );

        List<ScrumTaskDto.Member> members = new ArrayList<>(users.size());

        for (User user : users) {

            members.add(
                    new ScrumTaskDto.Member(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            user.getRole(),
                            initialsOf(user.getName())
                    )
            );
        }

        return members;
    }


    // ============================================
    // LIST ALL
    // Every task, whether or not it is in a sprint
    // ============================================

    /**
     * All tasks in key order.
     *
     * Sorted here rather than through a new repository method: the keys are
     * zero padded (T-001), so plain string ordering is already numeric, and a
     * hand-edited row with no key must not decide where its card lands.
     */
    // toCard reads the lazily fetched sprint, so the mapping has to run inside
    // an open session no matter how open-in-view is configured
    @Transactional(readOnly = true)
    public List<ScrumTaskDto.Card> listTasks() {

        List<ScrumTask> tasks = new ArrayList<>(taskRepository.findAll());

        tasks.sort(
                Comparator.comparing(
                        ScrumTask::getTaskKey,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                )
        );

        List<ScrumTaskDto.Card> cards = new ArrayList<>(tasks.size());

        for (ScrumTask task : tasks) {
            cards.add(toCard(task));
        }

        return cards;
    }


    // ============================================
    // BACKLOG
    // Tasks not yet pulled into any sprint
    // ============================================
    public List<ScrumTaskDto.Card> listBacklog() {

        List<ScrumTask> tasks =
                taskRepository.findBySprintIsNullOrderByTaskKeyAsc();

        List<ScrumTaskDto.Card> cards = new ArrayList<>(tasks.size());

        for (ScrumTask task : tasks) {
            cards.add(toCard(task));
        }

        return cards;
    }


    // ============================================
    // CREATE
    // ============================================
    @Transactional
    public ScrumTaskDto.Card createTask(ScrumTaskDto.CreateRequest request) {

        if (request == null) {
            throw new ScrumValidationException("Task data is required");
        }

        ScrumTask task = new ScrumTask();

        task.setTaskKey(nextTaskKey());
        task.setTitle(requireTitle(request.title()));
        task.setDescription(trimToNull(request.description()));

        task.setPriority(
                request.priority() == null
                        ? ScrumTask.Priority.MEDIUM
                        : parsePriority(request.priority())
        );

        task.setStoryPoints(
                request.storyPoints() == null
                        ? 0
                        : validStoryPoints(request.storyPoints())
        );

        task.setEstimatedHours(
                validHours(request.estimatedHours(), "estimatedHours")
        );

        task.setActualHours(
                validHours(request.actualHours(), "actualHours")
        );

        task.setDueDate(request.dueDate());
        task.setLabels(joinLabels(request.labels()));

        if (request.assigneeId() != null) {
            task.setAssignee(requireUser(request.assigneeId(), "Assignee"));
        }

        if (request.reporterId() != null) {
            task.setReporter(requireUser(request.reporterId(), "Reporter"));
        }

        if (request.sprintId() != null) {
            task.setSprint(requireSprint(request.sprintId()));
        }

        // moveTo rather than setStatus even on a fresh row, so enteredStatusAt
        // and completedAt are seeded by the same rules that maintain them later
        task.moveTo(
                request.status() == null
                        ? ScrumTask.Status.BACKLOG
                        : parseStatus(request.status())
        );

        return toCard(taskRepository.save(task));
    }


    // ============================================
    // PARTIAL UPDATE
    // Only the fields present in the body change
    // ============================================
    @Transactional
    public ScrumTaskDto.Card updateTask(
            Long taskId,
            ScrumTaskDto.UpdateRequest request
    ) {

        if (request == null) {
            throw new ScrumValidationException("Update data is required");
        }

        ScrumTask task = requireTask(taskId);

        // Resolved up front: the blocked reason is only legal against the
        // status the task will end up with, not the one it currently has
        ScrumTask.Status targetStatus =
                request.status() == null
                        ? task.getStatus()
                        : parseStatus(request.status());

        // The same invariant the board's drag-and-drop move enforces, so a
        // PATCH cannot open a hole the board endpoint keeps closed
        String blockedReason =
                resolveBlockedReason(task, targetStatus, request.blockedReason());

        if (request.title() != null) {
            task.setTitle(requireTitle(request.title()));
        }

        if (Boolean.TRUE.equals(request.clearDescription())) {
            task.setDescription(null);
        } else if (request.description() != null) {
            task.setDescription(trimToNull(request.description()));
        }

        if (request.priority() != null) {
            task.setPriority(parsePriority(request.priority()));
        }

        if (request.storyPoints() != null) {
            task.setStoryPoints(validStoryPoints(request.storyPoints()));
        }

        if (Boolean.TRUE.equals(request.clearEstimatedHours())) {
            task.setEstimatedHours(null);
        } else if (request.estimatedHours() != null) {
            task.setEstimatedHours(
                    validHours(request.estimatedHours(), "estimatedHours")
            );
        }

        if (Boolean.TRUE.equals(request.clearActualHours())) {
            task.setActualHours(null);
        } else if (request.actualHours() != null) {
            task.setActualHours(
                    validHours(request.actualHours(), "actualHours")
            );
        }

        if (Boolean.TRUE.equals(request.clearDueDate())) {
            task.setDueDate(null);
        } else if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }

        if (Boolean.TRUE.equals(request.clearLabels())) {
            task.setLabels(null);
        } else if (request.labels() != null) {
            task.setLabels(joinLabels(request.labels()));
        }

        // unassign is the explicit clear, so it beats any assigneeId sent
        // alongside it — otherwise "clear" and "reassign" would race
        if (Boolean.TRUE.equals(request.unassign())) {
            task.setAssignee(null);
        } else if (request.assigneeId() != null) {
            task.setAssignee(requireUser(request.assigneeId(), "Assignee"));
        }

        if (request.reporterId() != null) {
            task.setReporter(requireUser(request.reporterId(), "Reporter"));
        }

        // Same precedence for the sprint link: the detach wins over the move
        if (Boolean.TRUE.equals(request.removeFromSprint())) {
            task.setSprint(null);
        } else if (request.sprintId() != null) {
            task.setSprint(requireSprint(request.sprintId()));
        }

        // Last, because moveTo clears blockedReason when leaving BLOCKED and
        // the reason below must survive that
        task.moveTo(targetStatus);

        if (blockedReason != null) {
            task.setBlockedReason(blockedReason);
        }

        return toCard(taskRepository.save(task));
    }


    // ============================================
    // CLONE
    // ============================================
    @Transactional
    public ScrumTaskDto.Card cloneTask(Long taskId) {

        ScrumTask source = requireTask(taskId);

        ScrumTask copy = new ScrumTask();

        copy.setTaskKey(nextTaskKey());
        copy.setTitle(source.getTitle());
        copy.setDescription(source.getDescription());
        copy.setPriority(source.getPriority());
        copy.setStoryPoints(source.getStoryPoints());
        copy.setEstimatedHours(source.getEstimatedHours());
        copy.setDueDate(source.getDueDate());
        copy.setLabels(source.getLabels());
        copy.setAssignee(source.getAssignee());
        copy.setReporter(source.getReporter());

        // actualHours is deliberately not copied: no work has been logged
        // against the clone yet, and carrying it over would inflate the
        // estimate-versus-actual figures for the same effort twice
        copy.setActualHours(null);

        // A clone starts life as unplanned backlog work
        copy.setSprint(null);
        copy.moveTo(ScrumTask.Status.BACKLOG);

        return toCard(taskRepository.save(copy));
    }


    // ============================================
    // DELETE
    // Returns the removed card so callers can name it
    // ============================================
    @Transactional
    public ScrumTaskDto.Card deleteTask(Long taskId) {

        ScrumTask task = requireTask(taskId);

        ScrumTaskDto.Card deleted = toCard(task);

        taskRepository.delete(task);

        return deleted;
    }


    // ============================================
    // SHARED RULES
    // Public: the board service enforces these too
    // ============================================

    /**
     * The module's single BLOCKED invariant, applied by both this service's
     * update and the board's drag-and-drop move so the two cannot drift.
     *
     * A card that ends up BLOCKED must carry a reason — a blocker nobody can
     * read is a blocker nobody can clear — and a reason offered against any
     * other column is rejected rather than accepted and then dropped, because
     * moveTo wipes it on the way out and the caller would otherwise be told
     * text was saved that no longer exists.
     *
     * @param task         the task being changed, for the reason it already carries
     * @param targetStatus the status the task will hold once the change applies
     * @param rawReason    the reason supplied with this change; may be null or blank
     * @return the reason to store after the move: the trimmed new text, the
     *         standing reason of an already blocked card, or null when the
     *         target column is not BLOCKED
     */
    public String resolveBlockedReason(
            ScrumTask task,
            ScrumTask.Status targetStatus,
            String rawReason
    ) {

        String reason = trimToNull(rawReason);

        if (targetStatus != ScrumTask.Status.BLOCKED) {

            if (reason != null) {

                throw new ScrumValidationException(
                        "blockedReason can only be set while the task is BLOCKED,"
                                + " but this task would be " + targetStatus
                );
            }

            return null;
        }

        if (reason == null) {

            // A card already sitting in BLOCKED still explains itself, so an
            // edit that leaves the status alone need not restate the reason
            String standing =
                    task != null && task.getStatus() == ScrumTask.Status.BLOCKED
                            ? trimToNull(task.getBlockedReason())
                            : null;

            if (standing == null) {
                throw new ScrumValidationException(
                        "A reason is required when blocking a task.");
            }

            return standing;
        }

        if (reason.length() > MAX_BLOCKED_REASON_LENGTH) {

            throw new ScrumValidationException(
                    "Blocked reason must be "
                            + MAX_BLOCKED_REASON_LENGTH + " characters or fewer"
            );
        }

        return reason;
    }


    // ============================================
    // SHARED CONVERSIONS
    // Public: the board and sprint services reuse these
    // ============================================

    /** Full card projection, including the derived stuck and overdue flags. */
    public ScrumTaskDto.Card toCard(ScrumTask task) {

        if (task == null) {
            throw new ScrumValidationException("Cannot render a null task");
        }

        User assignee = task.getAssignee();
        User reporter = task.getReporter();
        ScrumSprint sprint = task.getSprint();

        return new ScrumTaskDto.Card(
                task.getId(),
                task.getTaskKey(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority() == null ? null : task.getPriority().name(),
                task.getStatus() == null ? null : task.getStatus().name(),
                task.getStoryPoints(),
                task.getEstimatedHours(),
                task.getActualHours(),
                task.getDueDate(),
                parseLabels(task.getLabels()),
                task.getBlockedReason(),
                assignee == null ? null : assignee.getId(),
                assignee == null ? null : assignee.getName(),
                // Left null rather than the entity's "?" so a client can tell
                // an unassigned card from a member with a missing name
                assignee == null ? null : task.getAssigneeInitials(),
                reporter == null ? null : reporter.getId(),
                reporter == null ? null : reporter.getName(),
                // Reading the id off the lazy proxy does not load the sprint
                sprint == null ? null : sprint.getId(),
                task.getDaysInColumn(),
                isStuck(task),
                task.isOverdue()
        );
    }

    /** Splits the stored label column: trimmed, blanks dropped, de-duplicated. */
    public List<String> parseLabels(String raw) {

        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        // LinkedHashSet keeps the author's ordering while removing repeats
        LinkedHashSet<String> unique = new LinkedHashSet<>();

        for (String part : raw.split(",")) {

            String label = part.trim();

            if (!label.isEmpty()) {
                unique.add(label);
            }
        }

        return new ArrayList<>(unique);
    }

    /** Inverse of parseLabels; null when nothing survives, never "". */
    public String joinLabels(List<String> labels) {

        if (labels == null || labels.isEmpty()) {
            return null;
        }

        LinkedHashSet<String> unique = new LinkedHashSet<>();

        for (String raw : labels) {

            if (raw == null) {
                continue;
            }

            String label = raw.trim();

            if (!label.isEmpty()) {
                unique.add(label);
            }
        }

        if (unique.isEmpty()) {
            return null;
        }

        String joined = String.join(",", unique);

        if (joined.length() > MAX_LABELS_LENGTH) {
            throw new ScrumValidationException(
                    "Labels must be "
                            + MAX_LABELS_LENGTH + " characters or fewer in total"
            );
        }

        return joined;
    }


    // ============================================
    // INTERNAL HELPERS
    // ============================================

    /**
     * Next free key, continuing from the highest suffix ever issued.
     *
     * count() cannot be used: after any deletion it would hand back a key an
     * older task already owns. existsByTaskKey is the final guard for the case
     * where two creates race for the same number.
     */
    private String nextTaskKey() {

        int highest = 0;

        for (ScrumTask task : taskRepository.findAll()) {

            Integer suffix = numericSuffix(task.getTaskKey());

            if (suffix != null && suffix > highest) {
                highest = suffix;
            }
        }

        int next = highest + 1;
        String candidate = String.format(TASK_KEY_FORMAT, next);

        while (taskRepository.existsByTaskKey(candidate)) {
            next++;
            candidate = String.format(TASK_KEY_FORMAT, next);
        }

        return candidate;
    }

    private Integer numericSuffix(String taskKey) {

        if (taskKey == null) {
            return null;
        }

        int dash = taskKey.lastIndexOf('-');

        if (dash < 0 || dash == taskKey.length() - 1) {
            return null;
        }

        try {
            return Integer.parseInt(taskKey.substring(dash + 1));
        } catch (NumberFormatException ignored) {
            // A hand-edited key that is not numbered simply does not take part
            return null;
        }
    }

    private ScrumTask requireTask(Long taskId) {

        if (taskId == null) {
            throw new ScrumValidationException("Task id is required");
        }

        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Task " + taskId + " was not found"));
    }

    private User requireUser(Long userId, String role) {

        return userRepository.findById(userId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        role + " " + userId + " was not found"));
    }

    private ScrumSprint requireSprint(Long sprintId) {

        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Sprint " + sprintId + " was not found"));
    }

    private String requireTitle(String raw) {

        String title = raw == null ? "" : raw.trim();

        if (title.isEmpty()) {
            throw new ScrumValidationException("Task title is required");
        }

        if (title.length() > MAX_TITLE_LENGTH) {
            throw new ScrumValidationException(
                    "Task title must be "
                            + MAX_TITLE_LENGTH + " characters or fewer"
            );
        }

        return title;
    }

    private Integer validStoryPoints(Integer storyPoints) {

        if (storyPoints < 0) {
            throw new ScrumValidationException(
                    "Story points cannot be negative: " + storyPoints);
        }

        if (storyPoints > MAX_STORY_POINTS) {
            throw new ScrumValidationException(
                    "Story points cannot exceed "
                            + MAX_STORY_POINTS + ": " + storyPoints);
        }

        return storyPoints;
    }

    private BigDecimal validHours(BigDecimal hours, String field) {

        if (hours == null) {
            return null;
        }

        if (hours.compareTo(BigDecimal.ZERO) < 0) {
            throw new ScrumValidationException(
                    field + " cannot be negative: " + hours);
        }

        return hours;
    }

    private ScrumTask.Status parseStatus(String raw) {

        String value = raw == null ? "" : raw.trim();

        for (ScrumTask.Status status : ScrumTask.Status.values()) {

            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }

        throw new ScrumValidationException("Unknown task status: " + raw);
    }

    private ScrumTask.Priority parsePriority(String raw) {

        String value = raw == null ? "" : raw.trim();

        for (ScrumTask.Priority priority : ScrumTask.Priority.values()) {

            if (priority.name().equalsIgnoreCase(value)) {
                return priority;
            }
        }

        throw new ScrumValidationException("Unknown task priority: " + raw);
    }

    /**
     * Ageing indicator. DONE work has stopped moving on purpose and BACKLOG
     * work has not been committed to yet, so neither counts as stuck.
     */
    private boolean isStuck(ScrumTask task) {

        ScrumTask.Status status = task.getStatus();

        if (status == null
                || status == ScrumTask.Status.DONE
                || status == ScrumTask.Status.BACKLOG) {

            return false;
        }

        return task.getDaysInColumn() >= STUCK_DAYS;
    }

    private String trimToNull(String raw) {

        if (raw == null) {
            return null;
        }

        String value = raw.trim();

        return value.isEmpty() ? null : value;
    }

    /**
     * First and last initial. Mirrors the entity's own rule so a member in the
     * picker and the same person on a card show identical initials.
     */
    private static String initialsOf(String name) {

        if (name == null || name.isBlank()) {
            return "?";
        }

        String[] parts = name.trim().split("\\s+");

        if (parts.length == 1) {
            return parts[0].substring(0, 1).toUpperCase();
        }

        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1))
                .toUpperCase();
    }
}
