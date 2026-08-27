package com.flowpilot.flowpilot.scrummaster.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumBurndownSnapshot;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumBurndownSnapshotRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/**
 * Records the daily burndown history that current state cannot reproduce.
 *
 * A burndown chart is a time series, but the tasks table only knows where the
 * work stands right now: the moment a card is marked done, yesterday's
 * remaining total is unrecoverable. So one row per sprint per day is written
 * here, and every chart is drawn from those rows rather than recomputed.
 *
 * Total points are stored next to remaining points on purpose — that pair is
 * what makes mid-sprint scope changes visible instead of looking like slower
 * progress.
 */
@Service
public class ScrumSnapshotService {

    private final ScrumSprintRepository sprintRepository;
    private final ScrumTaskRepository taskRepository;
    private final ScrumBurndownSnapshotRepository snapshotRepository;


    public ScrumSnapshotService(
            ScrumSprintRepository sprintRepository,
            ScrumTaskRepository taskRepository,
            ScrumBurndownSnapshotRepository snapshotRepository
    ) {
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.snapshotRepository = snapshotRepository;
    }


    // ============================================
    // CAPTURE TODAY
    // Upsert: one row per sprint per day
    // ============================================

    /**
     * Writes, or overwrites, today's snapshot for one sprint.
     *
     * Overwriting rather than appending is required by the table's unique
     * (sprint_id, snapshot_date) constraint, and it is also the behaviour we
     * want: a second call later the same day should correct the day's figure,
     * not add a competing point to the chart.
     */
    @Transactional
    public void captureToday(Long sprintId) {
        captureOn(requireSprint(sprintId), ScrumWorkingDays.today());
    }


    /**
     * Records a sprint's position as it stands right now, stamped with the
     * given date.
     *
     * The date is a parameter rather than always "today" because a backfill has
     * to place its one point inside the sprint it describes; every live capture
     * passes ScrumWorkingDays.today().
     */
    private void captureOn(ScrumSprint sprint, LocalDate date) {

        int total = pointsInSprint(sprint.getId());
        int completed = donePointsInSprint(sprint.getId());

        // Guarded rather than trusted: a task edited down after being finished
        // could otherwise drive remaining below zero and bend the chart
        int remaining = Math.max(0, total - completed);

        ScrumBurndownSnapshot snapshot = snapshotRepository
                .findBySprintIdAndSnapshotDate(sprint.getId(), date)
                .orElseGet(ScrumBurndownSnapshot::new);

        snapshot.setSprintId(sprint.getId());
        snapshot.setSnapshotDate(date);
        snapshot.setRemainingPoints(remaining);
        snapshot.setCompletedPoints(completed);
        snapshot.setTotalPoints(total);

        snapshotRepository.save(snapshot);
    }


    // ============================================
    // NIGHTLY CAPTURE
    // Every active sprint, just before midnight
    // ============================================

    /**
     * Snapshots every active sprint at 23:55, so each stored row is the true
     * end-of-day position instead of whatever the board looked like at the
     * arbitrary moment someone opened a page.
     *
     * Scheduling has to be switched on for this to fire; that is done by
     * ScrumSchedulingConfig in this module's config package, not by the shared
     * application class.
     *
     * Deliberately one transaction: the whole nightly run is a handful of tiny
     * upserts, and because that transaction starts here the inner captureToday
     * calls simply join it — which is just as well, since a self-invocation
     * would bypass the proxy and get no transaction of its own.
     */
    // The zone must stay equal to ScrumWorkingDays.ZONE. The trigger fires at
    // 23:55 in the zone given here, while the row it writes is dated with
    // ScrumWorkingDays.today(); on a host running in any other zone those two
    // disagree, so the nightly row lands on the neighbouring day — or a second
    // time on a day already recorded, overwriting it. @Scheduled needs a
    // constant expression, so the ZoneId cannot be read from ScrumWorkingDays
    // directly: if that zone ever moves, this string moves with it.
    @Scheduled(cron = "0 55 23 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void captureAllActive() {

        // findByStatus rather than findFirstByStatus: exactly one sprint should
        // be active, but if a database ever holds two we would rather record
        // both than silently lose a day of one sprint's history
        List<ScrumSprint> active = sprintRepository
                .findByStatusOrderBySprintNumberDesc(ScrumSprint.Status.ACTIVE);

        for (ScrumSprint sprint : active) {
            captureToday(sprint.getId());
        }
    }


    // ============================================
    // BACKFILL
    // Give a brand new sprint one real data point
    // ============================================

    /**
     * Writes one snapshot only when a sprint has none at all.
     *
     * A sprint started after tonight's cron run has no history yet, and a chart
     * with zero points renders as an empty box that reads like a bug. One
     * genuine measured point is both honest and enough to draw.
     *
     * The point is dated today clamped into the sprint's own window rather than
     * today unconditionally: a sprint that closed last month would otherwise
     * gain a measurement dated weeks after it ended, which the burndown's
     * working-day scale cannot place and which claims the sprint was still
     * being tracked after it stopped existing.
     *
     * Only write flows call this. The analytics read path must not write at
     * all, so it no longer asks for a backfill.
     */
    @Transactional
    public void backfillIfEmpty(Long sprintId) {

        ScrumSprint sprint = requireSprint(sprintId);

        boolean hasHistory = !snapshotRepository
                .findBySprintIdOrderBySnapshotDateAsc(sprint.getId())
                .isEmpty();

        if (hasHistory) {
            return;
        }

        captureOn(sprint, withinWindow(ScrumWorkingDays.today(), sprint));
    }


    /**
     * `date` pulled inside a sprint's window: earlier than the start becomes
     * the start, later than the end becomes the end. An unset bound is open, so
     * a sprint with no dates yet keeps the date it was given.
     */
    private LocalDate withinWindow(LocalDate date, ScrumSprint sprint) {

        LocalDate start = sprint.getStartDate();
        LocalDate end = sprint.getEndDate();

        if (start != null && date.isBefore(start)) {
            return start;
        }

        if (end != null && date.isAfter(end)) {
            return end;
        }

        return date;
    }


    // ============================================
    // INTERNAL HELPERS
    // ============================================

    private ScrumSprint requireSprint(Long sprintId) {

        if (sprintId == null) {
            throw new ScrumValidationException("Sprint id is required");
        }

        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Sprint " + sprintId + " was not found"));
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

    /** The sum queries coalesce to 0, but an empty sprint must never NPE here. */
    private int zeroIfNull(Integer value) {
        return value == null ? 0 : value;
    }
}
