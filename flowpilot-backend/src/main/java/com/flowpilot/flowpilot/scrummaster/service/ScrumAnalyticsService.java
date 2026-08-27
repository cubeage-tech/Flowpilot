package com.flowpilot.flowpilot.scrummaster.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumAnalyticsDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumBurndownSnapshot;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumBurndownSnapshotRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/**
 * Progress tracking (SRS Module 7): burndown, burnup, velocity and KPIs.
 *
 * Everything here is computed from stored history rather than from current
 * state. That distinction is the whole point of the snapshot table: once a
 * task is marked done, yesterday's remaining total no longer exists anywhere
 * else, so a chart derived from live rows can only ever show today.
 */
@Service
public class ScrumAnalyticsService {

    /** Sprints are judged a success at this share of their commitment. */
    private static final int SUCCESS_THRESHOLD_PERCENT = 80;

    /** Rolling velocity window. Three sprints is the usual planning horizon. */
    private static final int ROLLING_WINDOW = 3;

    private final ScrumSprintRepository sprintRepository;
    private final ScrumTaskRepository taskRepository;
    private final ScrumBurndownSnapshotRepository snapshotRepository;
    private final ScrumSnapshotService snapshotService;

    public ScrumAnalyticsService(
            ScrumSprintRepository sprintRepository,
            ScrumTaskRepository taskRepository,
            ScrumBurndownSnapshotRepository snapshotRepository,
            ScrumSnapshotService snapshotService
    ) {
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.snapshotRepository = snapshotRepository;
        this.snapshotService = snapshotService;
    }


    public ScrumAnalyticsDto.Response getAnalytics(Long sprintId) {

        ScrumSprint sprint = resolveSprint(sprintId);

        return new ScrumAnalyticsDto.Response(
                buildBurndown(sprint),
                buildVelocity(sprint),
                buildKpis(sprint),
                distributionByPriority(sprint),
                distributionByStatus(sprint),
                productivity(sprint)
        );
    }


    // ============================================
    // BURNDOWN / BURNUP
    // ============================================
    ScrumAnalyticsDto.Burndown buildBurndown(ScrumSprint sprint) {

        boolean closed = sprint.getStatus() == ScrumSprint.Status.COMPLETED;

        // A running sprint's last point must agree with the live KPI row, so
        // today is re-captured on read. That is a correction, not an addition:
        // captureToday upserts, and today is inside a running sprint's window.
        //
        // Nothing else is written from here. A PLANNED or COMPLETED sprint has
        // no "today" of its own to record, so a write would invent a point
        // outside the sprint window — dated now for a sprint that ended months
        // ago — from a request that only asked to read. Whatever history exists
        // is reported as it stands; an empty series is honest.
        if (sprint.getStatus() == ScrumSprint.Status.ACTIVE) {
            snapshotService.captureToday(sprint.getId());
        }

        List<ScrumBurndownSnapshot> snapshots =
                snapshotRepository.findBySprintIdOrderBySnapshotDateAsc(sprint.getId());

        int duration = Math.max(
                1,
                ScrumWorkingDays.durationOf(sprint.getStartDate(), sprint.getEndDate())
        );

        // The ideal line descends from what the team committed to, not from
        // current scope: that is what makes added work visible as a gap.
        int committed = sprint.getCommittedPoints() == null
                ? nullSafe(taskRepository.sumStoryPointsForSprint(sprint.getId()))
                : sprint.getCommittedPoints();

        List<ScrumAnalyticsDto.DayPoint> series = new ArrayList<>();

        for (ScrumBurndownSnapshot snapshot : snapshots) {

            int dayNumber = plotDay(sprint, snapshot.getSnapshotDate(), series.size());

            // A snapshot the sprint's working-day scale cannot place is left
            // out rather than pulled to day 1. Clamping stacked a row recorded
            // before the sprint began — a legacy backfill, or a start date
            // edited afterwards — on top of the genuine first day, so the chart
            // opened with two different heights claiming to be day 1.
            if (dayNumber < 1) {
                continue;
            }

            series.add(new ScrumAnalyticsDto.DayPoint(
                    snapshot.getSnapshotDate(),
                    dayNumber,
                    snapshot.getRemainingPoints(),
                    snapshot.getCompletedPoints(),
                    snapshot.getTotalPoints(),
                    idealRemaining(committed, dayNumber, duration)
            ));
        }

        int totalPoints = nullSafe(taskRepository.sumStoryPointsForSprint(sprint.getId()));
        int donePoints = nullSafe(taskRepository.sumStoryPointsForSprintByStatus(
                sprint.getId(), ScrumTask.Status.DONE));

        // For a sprint still in flight, remaining is scope minus completed.
        // Deriving it from the commitment instead would hide mid-sprint
        // additions entirely.
        int liveRemaining = Math.max(0, totalPoints - donePoints);

        // The last row in the history, which for a closed sprint is the
        // position captured as it was closed. It is taken from the full history
        // rather than from the plotted series on purpose: a sprint completed
        // after its nominal end date has its truest final measurement just
        // outside the window, where the chart cannot draw it.
        ScrumBurndownSnapshot closing = snapshots.isEmpty()
                ? null
                : snapshots.get(snapshots.size() - 1);

        // A closed sprint's outcome is what was recorded on its last day, which
        // live rows can no longer reproduce: completing a sprint carries the
        // unfinished cards out of it, so total minus done collapses to zero and
        // a sprint that delivered half its commitment reported nothing left to
        // do.
        int remaining = closed && closing != null
                ? Math.max(0, nullSafe(closing.getRemainingPoints()))
                : liveRemaining;

        // A closed sprint is judged at its own final day. Judging it against
        // today compares it to an ideal line that bottomed out at zero the
        // moment the sprint ended, so any sprint whose leftovers were tidied
        // away afterwards read as "on track".
        int evaluationDay = closed
                ? duration
                : todayNumber(sprint, series.size());

        int behind = remaining - idealRemaining(committed, evaluationDay, duration);

        return new ScrumAnalyticsDto.Burndown(
                sprint.getId(),
                sprint.getName(),
                sprint.getStartDate(),
                sprint.getEndDate(),
                sprint.getCommittedPoints(),
                totalPoints,
                remaining,
                duration,
                behind,
                behind > 0 ? "behind" : behind < 0 ? "ahead" : "on track",
                series
        );
    }

    /**
     * The working-day ordinal a snapshot is drawn at, or 0 when it cannot be
     * drawn at all.
     *
     * Zero means "not on this sprint's chart": either the date falls outside
     * the sprint window, or the window holds it but the working-day scale does
     * not (a sprint whose start date is itself a weekend). With no start date
     * there is no scale, so stored order is the only ordering available.
     */
    private int plotDay(ScrumSprint sprint, LocalDate date, int alreadyPlotted) {

        if (sprint.getStartDate() == null) {
            return alreadyPlotted + 1;
        }

        if (!isWithin(date, sprint.getStartDate(), sprint.getEndDate())) {
            return 0;
        }

        return ScrumWorkingDays.dayNumber(sprint.getStartDate(), date);
    }

    /** The sprint's own count of today, for a sprint not yet closed. */
    private int todayNumber(ScrumSprint sprint, int plotted) {

        if (sprint.getStartDate() == null) {
            return Math.max(1, plotted);
        }

        return Math.max(1, ScrumWorkingDays.dayNumber(
                sprint.getStartDate(), ScrumWorkingDays.today()));
    }

    /**
     * Where a perfectly paced sprint would be at the end of a given day.
     * Day 1 starts at the full commitment; the final day lands on zero.
     */
    private int idealRemaining(Integer committed, int dayNumber, int duration) {

        int total = committed == null ? 0 : Math.max(0, committed);

        if (total == 0) {
            return 0;
        }

        // A one-day sprint has no descent to draw: all of its work is due on
        // the single day it has, so the ideal at the end of that day is zero.
        // Returning the full commitment held the ideal line flat at the top,
        // and a one-day sprint that delivered everything was reported as ahead
        // of a target it had in fact exactly met.
        if (duration <= 1) {
            return 0;
        }

        double fraction = (double) (dayNumber - 1) / (duration - 1);
        int ideal = (int) Math.round(total * (1.0 - fraction));

        return Math.max(0, Math.min(total, ideal));
    }


    // ============================================
    // VELOCITY
    // ============================================
    ScrumAnalyticsDto.Velocity buildVelocity(ScrumSprint current) {

        List<ScrumSprint> completed = sprintRepository
                .findByStatusOrderBySprintNumberDesc(ScrumSprint.Status.COMPLETED);

        List<ScrumAnalyticsDto.VelocitySprint> series = new ArrayList<>();
        List<Integer> closedPoints = new ArrayList<>();

        // Oldest first so the chart reads left to right
        for (int i = completed.size() - 1; i >= 0; i--) {

            ScrumSprint sprint = completed.get(i);
            int done = nullSafe(taskRepository.sumStoryPointsForSprintByStatus(
                    sprint.getId(), ScrumTask.Status.DONE));

            closedPoints.add(done);

            series.add(new ScrumAnalyticsDto.VelocitySprint(
                    sprint.getId(),
                    sprint.getSprintNumber(),
                    sprint.getName(),
                    sprint.getCommittedPoints(),
                    done,
                    false
            ));
        }

        // The running sprint is shown for context but excluded from the
        // averages: counting unfinished work would drag velocity down.
        if (current != null && current.getStatus() == ScrumSprint.Status.ACTIVE) {

            series.add(new ScrumAnalyticsDto.VelocitySprint(
                    current.getId(),
                    current.getSprintNumber(),
                    current.getName(),
                    current.getCommittedPoints(),
                    nullSafe(taskRepository.sumStoryPointsForSprintByStatus(
                            current.getId(), ScrumTask.Status.DONE)),
                    true
            ));
        }

        Double average = mean(closedPoints, closedPoints.size());
        Double rolling = mean(
                closedPoints.subList(
                        Math.max(0, closedPoints.size() - ROLLING_WINDOW),
                        closedPoints.size()),
                ROLLING_WINDOW
        );

        return new ScrumAnalyticsDto.Velocity(
                average,
                rolling,
                closedPoints.size(),
                series
        );
    }

    /** Null rather than zero when there is nothing to average. */
    private Double mean(List<Integer> values, int limit) {

        if (values.isEmpty() || limit <= 0) {
            return null;
        }

        double sum = 0;

        for (Integer value : values) {
            sum += value == null ? 0 : value;
        }

        return Math.round((sum / values.size()) * 10.0) / 10.0;
    }


    // ============================================
    // KPIs
    // ============================================
    ScrumAnalyticsDto.Kpis buildKpis(ScrumSprint sprint) {

        long total = taskRepository.countBySprintId(sprint.getId());
        long done = taskRepository.countBySprintIdAndStatus(
                sprint.getId(), ScrumTask.Status.DONE);

        long overdue = taskRepository.countOverdue(sprint.getId(), ScrumWorkingDays.today());

        Double leadHours = taskRepository.averageCompletionHours(sprint.getId());

        List<ScrumSprint> closed = sprintRepository
                .findByStatusOrderBySprintNumberDesc(ScrumSprint.Status.COMPLETED);

        int assessed = 0;
        int met = 0;

        for (ScrumSprint past : closed) {

            Integer commitment = past.getCommittedPoints();

            // A sprint with no commitment recorded cannot be judged against
            // one, so it is left out of the rate on both sides. Counting it as
            // met while still counting it in the denominator handed it a free
            // success and pulled the rate towards 100% — a team whose sprints
            // were never given a commitment scored perfectly.
            if (commitment == null || commitment <= 0) {
                continue;
            }

            assessed++;

            int achieved = nullSafe(taskRepository.sumStoryPointsForSprintByStatus(
                    past.getId(), ScrumTask.Status.DONE));

            if ((achieved * 100) >= (commitment * SUCCESS_THRESHOLD_PERCENT)) {
                met++;
            }
        }

        // Null rather than zero: nothing judgeable is not a 0% record
        Integer successRate = assessed == 0
                ? null
                : (int) Math.round((met * 100.0) / assessed);

        return new ScrumAnalyticsDto.Kpis(
                (int) done,
                (int) total,
                (int) overdue,
                leadHours == null ? null : Math.round(leadHours * 10.0) / 10.0,
                successRate,
                // What the rate is actually a share of. Reporting every closed
                // sprint here overstated the sample the percentage came from.
                assessed
        );
    }


    // ============================================
    // DISTRIBUTIONS
    // ============================================
    List<ScrumAnalyticsDto.Slice> distributionByPriority(ScrumSprint sprint) {

        // Seeded with every enum value so the chart keeps a stable shape even
        // when a priority is unused
        Map<String, int[]> buckets = new LinkedHashMap<>();

        for (ScrumTask.Priority priority : ScrumTask.Priority.values()) {
            buckets.put(label(priority.name()), new int[] { 0, 0 });
        }

        for (Object[] row : taskRepository.distributionByPriority(sprint.getId())) {

            ScrumTask.Priority priority = (ScrumTask.Priority) row[0];
            int count = ((Number) row[1]).intValue();
            int points = ((Number) row[2]).intValue();

            buckets.put(label(priority.name()), new int[] { count, points });
        }

        return toSlices(buckets);
    }

    List<ScrumAnalyticsDto.Slice> distributionByStatus(ScrumSprint sprint) {

        Map<String, int[]> buckets = new LinkedHashMap<>();

        for (ScrumTask.Status status : ScrumTask.Status.values()) {
            buckets.put(label(status.name()), new int[] { 0, 0 });
        }

        for (ScrumTask task : taskRepository
                .findBySprintIdOrderByStatusAscTaskKeyAsc(sprint.getId())) {

            int[] bucket = buckets.get(label(task.getStatus().name()));
            bucket[0]++;
            bucket[1] += task.getStoryPoints() == null ? 0 : task.getStoryPoints();
        }

        return toSlices(buckets);
    }

    private List<ScrumAnalyticsDto.Slice> toSlices(Map<String, int[]> buckets) {

        List<ScrumAnalyticsDto.Slice> slices = new ArrayList<>();

        for (Map.Entry<String, int[]> entry : buckets.entrySet()) {
            slices.add(new ScrumAnalyticsDto.Slice(
                    entry.getKey(),
                    entry.getValue()[0],
                    entry.getValue()[1]
            ));
        }

        return slices;
    }

    List<ScrumAnalyticsDto.MemberProductivity> productivity(ScrumSprint sprint) {

        List<ScrumAnalyticsDto.MemberProductivity> members = new ArrayList<>();

        for (Object[] row : taskRepository.productivityBySprint(sprint.getId())) {

            Long memberId = row[0] == null ? null : ((Number) row[0]).longValue();
            String name = (String) row[1];
            int assigned = ((Number) row[2]).intValue();
            int completed = row[3] == null ? 0 : ((Number) row[3]).intValue();
            int points = row[4] == null ? 0 : ((Number) row[4]).intValue();

            members.add(new ScrumAnalyticsDto.MemberProductivity(
                    memberId,
                    name,
                    ScrumTask.initialsOf(name),
                    assigned,
                    completed,
                    points,
                    assigned == 0 ? 0 : (int) Math.round((completed * 100.0) / assigned)
            ));
        }

        return members;
    }


    // ============================================
    // HELPERS
    // ============================================

    /** Resolves an explicit sprint, else the one in flight. */
    ScrumSprint resolveSprint(Long sprintId) {

        if (sprintId != null) {
            return sprintRepository
                    .findById(sprintId)
                    .orElseThrow(() -> new ScrumNotFoundException("Sprint not found: " + sprintId));
        }

        return sprintRepository
                .findFirstByStatus(ScrumSprint.Status.ACTIVE)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "No active sprint. Create one and start it."));
    }

    private int nullSafe(Integer value) {
        return value == null ? 0 : value;
    }

    /** BLOCKED -> "Blocked", IN_PROGRESS -> "In progress". */
    private String label(String enumName) {

        String spaced = enumName.replace('_', ' ').toLowerCase();

        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }

    /**
     * Whether a date sits inside a sprint window, an unset bound being open.
     * The burndown uses it to drop snapshots it cannot place on the sprint's
     * working-day scale.
     */
    static boolean isWithin(LocalDate date, LocalDate start, LocalDate end) {

        return date != null
                && (start == null || !date.isBefore(start))
                && (end == null || !date.isAfter(end));
    }
}
