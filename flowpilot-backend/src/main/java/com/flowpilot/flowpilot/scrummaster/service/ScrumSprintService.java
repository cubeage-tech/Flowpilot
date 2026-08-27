package com.flowpilot.flowpilot.scrummaster.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumSprintDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumBurndownSnapshotRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumRetrospectiveRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumStandupRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/**
 * Sprint lifecycle and sprint planning, SRS Module 6.
 *
 * Two invariants are enforced here rather than in the database, because both
 * need a readable explanation when they are violated: at most one sprint is
 * ACTIVE, and committed points are frozen at the moment a sprint starts. The
 * second is what makes scope creep measurable — without a frozen baseline,
 * work added mid-sprint is indistinguishable from work that was planned.
 */
@Service
public class ScrumSprintService {

    private static final int MAX_NAME_LENGTH = 255;

    /** Guards a typo like 3650 turning into a ten-year sprint. */
    private static final int MAX_DURATION_DAYS = 365;

    private static final int MAX_CAPACITY_POINTS = 1000;

    private final ScrumSprintRepository sprintRepository;
    private final ScrumTaskRepository taskRepository;
    private final ScrumBurndownSnapshotRepository snapshotRepository;
    private final ScrumStandupRepository standupRepository;
    private final ScrumRetrospectiveRepository retrospectiveRepository;
    private final ScrumSnapshotService snapshotService;


    public ScrumSprintService(
            ScrumSprintRepository sprintRepository,
            ScrumTaskRepository taskRepository,
            ScrumBurndownSnapshotRepository snapshotRepository,
            ScrumStandupRepository standupRepository,
            ScrumRetrospectiveRepository retrospectiveRepository,
            ScrumSnapshotService snapshotService
    ) {
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.snapshotRepository = snapshotRepository;
        this.standupRepository = standupRepository;
        this.retrospectiveRepository = retrospectiveRepository;
        this.snapshotService = snapshotService;
    }


    // ============================================
    // LIST
    // Newest sprint first
    // ============================================
    public List<ScrumSprintDto.Response> listSprints() {

        List<ScrumSprint> sprints = new ArrayList<>(sprintRepository.findAll());

        sprints.sort(
                Comparator.comparing(
                        ScrumSprint::getSprintNumber,
                        Comparator.nullsLast(Comparator.<Integer>reverseOrder())
                )
        );

        List<ScrumSprintDto.Response> responses = new ArrayList<>(sprints.size());

        for (ScrumSprint sprint : sprints) {
            responses.add(toResponse(sprint));
        }

        return responses;
    }


    // ============================================
    // ACTIVE SPRINT
    // Empty is a normal state, not a failure
    // ============================================

    /**
     * Optional rather than an exception: between completing one sprint and
     * starting the next there genuinely is no active sprint, and a dashboard
     * polling this endpoint should not be told the server lost something.
     */
    public Optional<ScrumSprintDto.Response> findActiveSprint() {

        return sprintRepository
                .findFirstByStatus(ScrumSprint.Status.ACTIVE)
                .map(this::toResponse);
    }


    // ============================================
    // READ ONE
    // ============================================
    public ScrumSprintDto.Response getSprint(Long sprintId) {

        return toResponse(requireSprint(sprintId));
    }


    // ============================================
    // CREATE
    // A new sprint always starts life PLANNED
    // ============================================
    @Transactional
    public ScrumSprintDto.Response createSprint(
            ScrumSprintDto.CreateRequest request
    ) {

        if (request == null) {
            throw new ScrumValidationException("Sprint data is required");
        }

        LocalDate startDate = request.startDate();
        LocalDate endDate = request.endDate();

        // endDate and durationDays are two ways of saying the same thing, so an
        // explicit end date wins and the duration is only used to derive one
        if (endDate == null && request.durationDays() != null) {

            int duration = validDuration(request.durationDays());

            // With no start date there is nothing to add the days to; the
            // sprint stays open-ended until someone schedules it
            if (startDate != null) {

                // durationDays is working days, the unit every read path in
                // this module reports. Adding calendar days here made a
                // 14-day sprint read back as 11 working days and stretched
                // the burndown ideal line over a window nobody planned.
                endDate = ScrumWorkingDays.plusWorkingDays(startDate, duration);
            }
        }

        requireOrderedDates(startDate, endDate);

        ScrumSprint sprint = new ScrumSprint();

        sprint.setSprintNumber(nextSprintNumber());
        sprint.setName(requireName(request.name()));
        sprint.setGoal(trimToNull(request.goal()));
        sprint.setStartDate(startDate);
        sprint.setEndDate(endDate);
        sprint.setCapacityPoints(validCapacity(request.capacityPoints()));
        sprint.setProjectId(request.projectId());
        sprint.setStatus(ScrumSprint.Status.PLANNED);

        // committedPoints stays null until the sprint starts: there is no
        // commitment to report while the plan is still being edited
        ScrumSprint saved = sprintRepository.save(sprint);

        attachTasks(saved, request.backlogTaskIds());

        return toResponse(saved);
    }


    // ============================================
    // UPDATE
    // Only the fields present in the body change
    // ============================================
    @Transactional
    public ScrumSprintDto.Response updateSprint(
            Long sprintId,
            ScrumSprintDto.UpdateRequest request
    ) {

        if (request == null) {
            throw new ScrumValidationException("Update data is required");
        }

        ScrumSprint sprint = requireSprint(sprintId);

        if (request.name() != null) {
            sprint.setName(requireName(request.name()));
        }

        // clearGoal is the explicit erase, so it beats any goal sent alongside
        // it — otherwise "clear" and "rewrite" would race
        if (Boolean.TRUE.equals(request.clearGoal())) {
            sprint.setGoal(null);
        } else if (request.goal() != null) {
            sprint.setGoal(trimToNull(request.goal()));
        }

        // Both dates are resolved before either is stored, so moving one end of
        // the window is checked against the value the other will actually have
        LocalDate startDate =
                request.startDate() == null
                        ? sprint.getStartDate()
                        : request.startDate();

        // Same precedence for the end date: clearing reopens the window, which
        // is how a sprint whose dates were entered wrongly gets rescheduled
        LocalDate endDate;

        if (Boolean.TRUE.equals(request.clearEndDate())) {
            endDate = null;
        } else if (request.endDate() != null) {
            endDate = request.endDate();
        } else {
            endDate = sprint.getEndDate();
        }

        requireOrderedDates(startDate, endDate);

        sprint.setStartDate(startDate);
        sprint.setEndDate(endDate);

        if (Boolean.TRUE.equals(request.clearCapacity())) {
            sprint.setCapacityPoints(null);
        } else if (request.capacityPoints() != null) {
            sprint.setCapacityPoints(validCapacity(request.capacityPoints()));
        }

        if (request.projectId() != null) {
            sprint.setProjectId(request.projectId());
        }

        return toResponse(sprintRepository.save(sprint));
    }


    // ============================================
    // START
    // Freezes the commitment
    // ============================================
    @Transactional
    public ScrumSprintDto.Response startSprint(Long sprintId) {

        ScrumSprint sprint = requireSprint(sprintId);

        if (sprint.getStatus() == ScrumSprint.Status.ACTIVE) {
            throw new ScrumValidationException(
                    label(sprint) + " is already active");
        }

        if (sprint.getStatus() == ScrumSprint.Status.COMPLETED) {
            throw new ScrumValidationException(
                    label(sprint) + " has already been completed"
                            + " and cannot be started again");
        }

        // The friendly pre-check: it names the sprint standing in the way. It
        // is check-then-act though, so requireSoleActiveSprint re-reads after
        // the write to catch a rival start that slipped past this point.
        Optional<ScrumSprint> running =
                sprintRepository.findFirstByStatus(ScrumSprint.Status.ACTIVE);

        if (running.isPresent()) {
            throw new ScrumValidationException(
                    label(running.get()) + " is already active."
                            + " Complete it before starting "
                            + midLabel(sprint));
        }

        if (sprint.getStartDate() == null) {
            sprint.setStartDate(LocalDate.now());
        }

        // An active sprint with no end date has no window: durationOf and
        // remaining both return 0, the burndown ideal line collapses onto the
        // axis and the header reads "0 days left" on day one. Two working
        // weeks is the module's default cadence, so start day plus ten
        // working days gives a real window to burn down against.
        if (sprint.getEndDate() == null) {
            sprint.setEndDate(
                    ScrumWorkingDays.plusWorkingDays(sprint.getStartDate(), 10));
        }

        // The commitment is whatever is in the sprint right now. Frozen here so
        // anything added later shows up as added scope rather than vanishing
        // into a total that quietly grew to match.
        sprint.setCommittedPoints(pointsInSprint(sprint.getId()));
        sprint.setStatus(ScrumSprint.Status.ACTIVE);

        ScrumSprint started = sprintRepository.saveAndFlush(sprint);

        requireSoleActiveSprint(started);

        // Day-zero point, so the burndown has a real starting height instead of
        // beginning at whatever the first nightly cron run happened to catch
        snapshotService.captureToday(started.getId());

        return toResponse(started);
    }


    // ============================================
    // COMPLETE
    // Unfinished work carries forward or goes back
    // ============================================
    @Transactional
    public ScrumSprintDto.CompleteResult completeSprint(
            Long sprintId,
            Long carryTo
    ) {

        ScrumSprint sprint = requireSprint(sprintId);

        if (sprint.getStatus() != ScrumSprint.Status.ACTIVE) {
            throw new ScrumValidationException(
                    "Only an active sprint can be completed, but "
                            + midLabel(sprint)
                            + " is " + sprint.getStatus());
        }

        ScrumSprint target = null;

        if (carryTo != null) {

            if (Objects.equals(carryTo, sprint.getId())) {
                throw new ScrumValidationException(
                        "A sprint cannot carry unfinished work into itself");
            }

            target = requireSprint(carryTo);

            if (target.getStatus() == ScrumSprint.Status.COMPLETED) {
                throw new ScrumValidationException(
                        label(target) + " has already been completed"
                                + " and cannot receive carried-over work");
            }
        }

        int completedPoints = donePointsInSprint(sprint.getId());

        // Captured before anything moves. Once the unfinished cards leave, this
        // sprint's totals collapse to the completed work only, which would make
        // the last point on the burndown claim the scope shrank overnight.
        snapshotService.captureToday(sprint.getId());

        List<ScrumTask> tasks =
                taskRepository.findBySprintIdOrderByStatusAscTaskKeyAsc(
                        sprint.getId());

        int carriedTaskCount = 0;
        int carriedPoints = 0;

        for (ScrumTask task : tasks) {

            if (task.isDone()) {
                // Finished work stays where it was finished; that is what makes
                // the sprint's velocity readable afterwards
                continue;
            }

            carriedTaskCount++;
            carriedPoints += task.getStoryPoints() == null
                    ? 0
                    : task.getStoryPoints();

            if (target == null) {
                detachToBacklog(task);
            } else {
                // Status and enteredStatusAt are left alone on a carry-over: a
                // card that has been in progress for a week is still a week
                // old, and resetting it would hide exactly that
                task.setSprint(target);
                taskRepository.save(task);
            }
        }

        sprint.setStatus(ScrumSprint.Status.COMPLETED);
        sprintRepository.save(sprint);

        // The receiving sprint's scope just changed; if it is the one being
        // worked on, today's snapshot must say so
        if (target != null && target.getStatus() == ScrumSprint.Status.ACTIVE) {
            snapshotService.captureToday(target.getId());
        }

        return new ScrumSprintDto.CompleteResult(
                sprint.getId(),
                completedPoints,
                carriedTaskCount,
                carriedPoints,
                target == null ? null : target.getId(),
                target == null ? null : target.getName()
        );
    }


    // ============================================
    // SPRINT PLANNING
    // Pull backlog items in
    // ============================================
    @Transactional
    public ScrumSprintDto.Response addBacklogTasks(
            Long sprintId,
            ScrumSprintDto.BacklogSelection selection
    ) {

        ScrumSprint sprint = requireSprint(sprintId);

        attachTasks(sprint, requireSelection(selection));

        return toResponse(sprint);
    }


    // ============================================
    // SPRINT PLANNING
    // Push items back out
    // ============================================
    @Transactional
    public ScrumSprintDto.Response removeBacklogTasks(
            Long sprintId,
            ScrumSprintDto.BacklogSelection selection
    ) {

        ScrumSprint sprint = requireSprint(sprintId);

        for (Long taskId : distinctIds(requireSelection(selection))) {

            ScrumTask task = requireTask(taskId);

            if (!Objects.equals(sprintIdOf(task), sprint.getId())) {
                throw new ScrumValidationException(
                        "Task " + task.getTaskKey() + " is not in "
                                + midLabel(sprint));
            }

            detachToBacklog(task);
        }

        if (sprint.getStatus() == ScrumSprint.Status.ACTIVE) {
            snapshotService.captureToday(sprint.getId());
        }

        return toResponse(sprint);
    }


    // ============================================
    // DELETE
    // Tasks survive; sprint-scoped ceremony rows do not
    // ============================================
    @Transactional
    public ScrumSprintDto.Response deleteSprint(Long sprintId) {

        ScrumSprint sprint = requireSprint(sprintId);

        if (sprint.getStatus() == ScrumSprint.Status.ACTIVE) {
            throw new ScrumValidationException(
                    label(sprint) + " is active."
                            + " Complete it before deleting it");
        }

        // A completed sprint is the delivery record, and deleting one corrupts
        // it twice over: its DONE cards land back in the product backlog still
        // marked DONE, where planning can pull them into a new sprint and count
        // them as delivered a second time, and its snapshots, standups and
        // retro notes — the velocity history — are erased with it.
        if (sprint.getStatus() == ScrumSprint.Status.COMPLETED) {
            throw new ScrumValidationException(
                    label(sprint) + " has been completed and is the delivery"
                            + " record for that work: its finished cards,"
                            + " burndown history, standups and retrospective"
                            + " notes are what velocity is measured from."
                            + " Only a planned sprint can be deleted");
        }

        ScrumSprintDto.Response deleted = toResponse(sprint);

        // Tasks outlive the sprint — they are the work, not a detail of the
        // plan — so they are detached rather than deleted with it
        List<ScrumTask> tasks =
                taskRepository.findBySprintIdOrderByStatusAscTaskKeyAsc(
                        sprint.getId());

        for (ScrumTask task : tasks) {
            detachToBacklog(task);
        }

        // These three are meaningless without their sprint, and their tables
        // hold a raw sprint_id with no cascade, so they are cleared explicitly
        snapshotRepository.deleteBySprintId(sprint.getId());
        standupRepository.deleteBySprintId(sprint.getId());
        retrospectiveRepository.deleteBySprintId(sprint.getId());

        sprintRepository.delete(sprint);

        return deleted;
    }


    // ============================================
    // PROJECTION
    // ============================================

    /** Sprint plus the derived planning figures the UI reads. */
    public ScrumSprintDto.Response toResponse(ScrumSprint sprint) {

        if (sprint == null) {
            throw new ScrumValidationException("Cannot render a null sprint");
        }

        int totalPoints = pointsInSprint(sprint.getId());
        int donePoints = donePointsInSprint(sprint.getId());

        Integer committed = sprint.getCommittedPoints();

        // Only meaningful against a frozen baseline: before the sprint starts
        // every point is planned scope, so nothing has been "added"
        int scopeAddedPoints =
                committed == null
                        ? 0
                        : Math.max(0, totalPoints - committed);

        Integer capacity = sprint.getCapacityPoints();

        boolean overCapacity =
                capacity != null
                        && capacity > 0
                        && totalPoints > capacity;

        return new ScrumSprintDto.Response(
                sprint.getId(),
                sprint.getSprintNumber(),
                sprint.getName(),
                sprint.getGoal(),
                sprint.getStartDate(),
                sprint.getEndDate(),
                sprint.getStatus() == null ? null : sprint.getStatus().name(),
                // Working days, the same unit createSprint reads durationDays
                // in, so a sprint planned as 14 days reads back as 14
                sprint.getTotalDays(),
                sprint.getDaysRemaining(),
                sprint.getDaysElapsed(),
                capacity,
                committed,
                sprint.getProjectId(),
                (int) taskRepository.countBySprintId(sprint.getId()),
                totalPoints,
                donePoints,
                scopeAddedPoints,
                overCapacity
        );
    }


    // ============================================
    // INTERNAL HELPERS
    // ============================================

    /**
     * Pulls tasks into a sprint. A card sitting in BACKLOG is promoted to
     * SPRINT_READY, because "in a sprint but still in the backlog column" is a
     * state the board has no sensible place for.
     */
    private void attachTasks(ScrumSprint sprint, List<Long> taskIds) {

        for (Long taskId : distinctIds(taskIds)) {

            ScrumTask task = requireTask(taskId);

            Long currentSprintId = sprintIdOf(task);

            // Re-sending an id the sprint already owns is a harmless no-op, so
            // a retried planning request does not fail half way through
            if (Objects.equals(currentSprintId, sprint.getId())) {
                continue;
            }

            if (currentSprintId != null) {
                throw new ScrumValidationException(
                        "Task " + task.getTaskKey() + " already belongs to "
                                + midLabel(task.getSprint())
                                + ". Remove it from that sprint first");
            }

            task.setSprint(sprint);

            if (task.getStatus() == ScrumTask.Status.BACKLOG) {
                task.moveTo(ScrumTask.Status.SPRINT_READY);
            }

            taskRepository.save(task);
        }

        if (sprint.getStatus() == ScrumSprint.Status.ACTIVE) {
            snapshotService.captureToday(sprint.getId());
        }
    }

    /**
     * Sends a task back to the unplanned pool.
     *
     * Finished work keeps its DONE status: moveTo would clear completedAt, and
     * that timestamp is the only record of when the work was actually finished,
     * so cycle-time and velocity history would be falsified to tidy a column.
     */
    private void detachToBacklog(ScrumTask task) {

        task.setSprint(null);

        if (!task.isDone()) {
            task.moveTo(ScrumTask.Status.BACKLOG);
        }

        taskRepository.save(task);
    }

    /**
     * Verifies, after this sprint has been written as ACTIVE, that it is the
     * only ACTIVE sprint — and stands down if it is not.
     *
     * The guard in startSprint reads before it writes, so two starts arriving
     * together can both find no active sprint and both write one. Five other
     * services then ask findFirstByStatus which sprint is active, with no
     * ordering to make them agree, so each can answer with a different one:
     * the board, the burndown and the dashboard describe different sprints,
     * which is a worse outcome than refusing one of the two starts.
     *
     * The real fix is a partial unique index on status where status = 'ACTIVE',
     * which the database can enforce without a race. This only narrows the
     * window — a competing transaction that has not committed yet is invisible
     * here — so it is a safety net under that index, not a substitute for it.
     */
    private void requireSoleActiveSprint(ScrumSprint started) {

        List<ScrumSprint> active = sprintRepository
                .findByStatusOrderBySprintNumberDesc(ScrumSprint.Status.ACTIVE);

        if (active.size() <= 1) {
            return;
        }

        // Reverted explicitly rather than left to the rollback this exception
        // triggers, so the in-memory entity matches what the caller is told
        started.setStatus(ScrumSprint.Status.PLANNED);
        started.setCommittedPoints(null);
        sprintRepository.save(started);

        throw new ScrumValidationException(
                "Another sprint was started at the same moment and won,"
                        + " so " + midLabel(started) + " stays planned."
                        + " Reload to see which sprint is active");
    }

    /** Reads the id off the lazy proxy without loading the sprint. */
    private Long sprintIdOf(ScrumTask task) {

        return task.getSprint() == null ? null : task.getSprint().getId();
    }

    /**
     * Continues from the highest number ever issued rather than from count(),
     * which would reuse a deleted sprint's number and make velocity history
     * refer to two different sprints under one label.
     */
    private int nextSprintNumber() {

        return sprintRepository.findFirstByOrderBySprintNumberDesc()
                .map(ScrumSprint::getSprintNumber)
                .map(number -> number + 1)
                .orElse(1);
    }

    private List<Long> requireSelection(ScrumSprintDto.BacklogSelection selection) {

        if (selection == null || selection.taskIds() == null
                || selection.taskIds().isEmpty()) {

            throw new ScrumValidationException(
                    "At least one task id is required");
        }

        return selection.taskIds();
    }

    /** Order preserved so failures name tasks in the order they were sent. */
    private List<Long> distinctIds(List<Long> taskIds) {

        if (taskIds == null || taskIds.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<Long> unique = new LinkedHashSet<>();

        for (Long taskId : taskIds) {

            if (taskId == null) {
                throw new ScrumValidationException(
                        "Task id list contains a null id");
            }

            unique.add(taskId);
        }

        return new ArrayList<>(unique);
    }

    private ScrumSprint requireSprint(Long sprintId) {

        if (sprintId == null) {
            throw new ScrumValidationException("Sprint id is required");
        }

        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Sprint " + sprintId + " was not found"));
    }

    private ScrumTask requireTask(Long taskId) {

        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Task " + taskId + " was not found"));
    }

    private String requireName(String raw) {

        String name = raw == null ? "" : raw.trim();

        if (name.isEmpty()) {
            throw new ScrumValidationException("Sprint name is required");
        }

        if (name.length() > MAX_NAME_LENGTH) {
            throw new ScrumValidationException(
                    "Sprint name must be "
                            + MAX_NAME_LENGTH + " characters or fewer");
        }

        return name;
    }

    private void requireOrderedDates(LocalDate startDate, LocalDate endDate) {

        if (startDate == null || endDate == null) {
            return;
        }

        if (endDate.isBefore(startDate)) {
            throw new ScrumValidationException(
                    "Sprint end date " + endDate
                            + " cannot be before the start date " + startDate);
        }
    }

    private int validDuration(Integer durationDays) {

        if (durationDays <= 0) {
            throw new ScrumValidationException(
                    "Sprint duration must be at least one day: "
                            + durationDays);
        }

        if (durationDays > MAX_DURATION_DAYS) {
            throw new ScrumValidationException(
                    "Sprint duration cannot exceed "
                            + MAX_DURATION_DAYS + " days: " + durationDays);
        }

        return durationDays;
    }

    private Integer validCapacity(Integer capacityPoints) {

        if (capacityPoints == null) {
            return null;
        }

        if (capacityPoints < 0) {
            throw new ScrumValidationException(
                    "Capacity points cannot be negative: " + capacityPoints);
        }

        if (capacityPoints > MAX_CAPACITY_POINTS) {
            throw new ScrumValidationException(
                    "Capacity points cannot exceed "
                            + MAX_CAPACITY_POINTS + ": " + capacityPoints);
        }

        return capacityPoints;
    }

    private int pointsInSprint(Long sprintId) {
        return zeroIfNull(taskRepository.sumStoryPointsForSprint(sprintId));
    }

    private int donePointsInSprint(Long sprintId) {

        return zeroIfNull(
                taskRepository.sumStoryPointsForSprintByStatus(
                        sprintId, ScrumTask.Status.DONE)
        );
    }

    private int zeroIfNull(Integer value) {
        return value == null ? 0 : value;
    }

    /** "Sprint 4 (Checkout polish)" — enough for a message to be actionable. */
    private String label(ScrumSprint sprint) {
        return "Sprint " + identity(sprint);
    }

    /**
     * The same label for mid-sentence use. A separate method rather than
     * lower-casing label(), which would also flatten the sprint's own name.
     */
    private String midLabel(ScrumSprint sprint) {
        return "sprint " + identity(sprint);
    }

    private String identity(ScrumSprint sprint) {

        StringBuilder text = new StringBuilder();

        // Falls back to the id only for a row saved before numbering, so a
        // message never reads "Sprint null"
        text.append(sprint.getSprintNumber() == null
                ? String.valueOf(sprint.getId())
                : String.valueOf(sprint.getSprintNumber()));

        if (sprint.getName() != null && !sprint.getName().isBlank()) {
            text.append(" (").append(sprint.getName().trim()).append(")");
        }

        return text.toString();
    }

    private String trimToNull(String raw) {

        if (raw == null) {
            return null;
        }

        String value = raw.trim();

        return value.isEmpty() ? null : value;
    }
}
