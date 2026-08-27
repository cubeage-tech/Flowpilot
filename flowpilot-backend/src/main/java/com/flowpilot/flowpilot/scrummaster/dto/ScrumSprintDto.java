package com.flowpilot.flowpilot.scrummaster.dto;

import java.time.LocalDate;
import java.util.List;

/** Sprint lifecycle payloads (SRS Module 6). */
public class ScrumSprintDto {

    public record Response(
            Long id,
            Integer sprintNumber,
            String name,
            String goal,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            Integer durationDays,
            Integer daysRemaining,
            Integer daysElapsed,
            Integer capacityPoints,
            Integer committedPoints,
            Long projectId,
            Integer taskCount,
            Integer totalPoints,
            Integer donePoints,
            /** Points added since the sprint started; 0 when none. */
            Integer scopeAddedPoints,
            /** True when planned points exceed team capacity. */
            boolean overCapacity
    ) {}

    public record CreateRequest(
            String name,
            String goal,
            LocalDate startDate,
            LocalDate endDate,
            Integer durationDays,
            Integer capacityPoints,
            Long projectId,
            /** Backlog task ids to pull into the sprint on creation. */
            List<Long> backlogTaskIds
    ) {}

    /**
     * A PATCH body, so a null field means "leave this alone" — which on its own
     * makes clearing a field impossible to express: an emptied goal, end date
     * or capacity arrives as null and would be silently discarded while the
     * request still reported success. The clear flags say "make this null" out
     * loud, and each one wins over the value sent beside it.
     */
    public record UpdateRequest(
            String name,
            String goal,
            LocalDate startDate,
            LocalDate endDate,
            Integer capacityPoints,
            Long projectId,
            Boolean clearGoal,
            Boolean clearEndDate,
            Boolean clearCapacity
    ) {}

    public record CompleteResult(
            Long completedSprintId,
            Integer completedPoints,
            Integer carriedTaskCount,
            Integer carriedPoints,
            Long carriedToSprintId,
            String carriedToSprintName
    ) {}

    /** Adding or removing backlog items during planning. */
    public record BacklogSelection(
            List<Long> taskIds
    ) {}
}
