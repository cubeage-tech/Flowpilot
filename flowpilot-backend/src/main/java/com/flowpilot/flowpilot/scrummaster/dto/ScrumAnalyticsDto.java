package com.flowpilot.flowpilot.scrummaster.dto;

import java.time.LocalDate;
import java.util.List;

/** Progress-tracking payloads (SRS Module 7). */
public class ScrumAnalyticsDto {

    /** One day on the burndown / burnup series. */
    public record DayPoint(
            LocalDate date,
            Integer dayNumber,
            Integer remainingPoints,
            Integer completedPoints,
            Integer totalPoints,
            /** Where a perfect sprint would be on this day. */
            Integer idealRemaining
    ) {}

    public record Burndown(
            Long sprintId,
            String sprintName,
            LocalDate startDate,
            LocalDate endDate,
            Integer committedPoints,
            Integer totalPoints,
            Integer remainingPoints,
            Integer durationDays,
            /** Positive means behind the ideal line. */
            Integer pointsBehindIdeal,
            String trend,
            List<DayPoint> series
    ) {}

    public record VelocitySprint(
            Long sprintId,
            Integer sprintNumber,
            String name,
            Integer committedPoints,
            Integer completedPoints,
            boolean current
    ) {}

    public record Velocity(
            Double average,
            Double rollingAverage,
            Integer sprintsCounted,
            List<VelocitySprint> sprints
    ) {}

    public record Slice(
            String label,
            Integer count,
            Integer points
    ) {}

    public record MemberProductivity(
            Long memberId,
            String name,
            String initials,
            Integer assigned,
            Integer completed,
            Integer points,
            Integer completionPercent
    ) {}

    public record Kpis(
            Integer tasksCompleted,
            Integer tasksTotal,
            Integer overdueTasks,
            Double averageCompletionHours,
            /** Share of closed sprints that met their commitment. */
            Integer sprintSuccessRatePercent,
            Integer sprintsAssessed
    ) {}

    public record Response(
            Burndown burndown,
            Velocity velocity,
            Kpis kpis,
            List<Slice> byPriority,
            List<Slice> byStatus,
            List<MemberProductivity> byMember
    ) {}
}
