package com.flowpilot.flowpilot.scrummaster.dto;

import java.util.List;

/** Board payloads. The backend groups and orders columns so clients agree. */
public class ScrumBoardDto {

    /**
     * One board column. The counts describe the column itself and ignore the
     * viewer's filter, while `cards` holds only what the filter lets through:
     * a WIP breach belongs to the column, so it must not disappear because
     * somebody searched for something else.
     */
    public record Column(
            String status,
            String label,
            /** Cards in this column, filter or no filter. */
            Integer taskCount,
            /** Story points of every card in the column, filter or no filter. */
            Integer totalPoints,
            /** WIP limit for this column, or null when unlimited. */
            Integer wipLimit,
            /** True when taskCount exceeds the limit — the board flags it. */
            boolean wipExceeded,
            /** How many of this column's cards the filter hides; 0 when unfiltered. */
            Integer hiddenCount,
            /** The cards to render: filtered, so taskCount - hiddenCount of them. */
            List<ScrumTaskDto.Card> cards
    ) {}

    public record Response(
            /** The project this board is scoped to, null when unscoped. */
            Long projectId,
            /** The project's name, so the client need not join it back itself. */
            String projectName,
            Long sprintId,
            String sprintName,
            String sprintStatus,
            /** Tasks in the sprint, unfiltered, so it agrees with the sprint screens. */
            Integer totalTasks,
            /** Story points in the sprint, unfiltered, for the same reason. */
            Integer totalPoints,
            /** Distinct labels present in this sprint, for the filter control. */
            List<String> availableLabels,
            List<ScrumTaskDto.Member> members,
            List<Column> columns
    ) {}

    /** Moving one card. */
    public record MoveRequest(
            String status,
            String blockedReason
    ) {}

    /** Setting a column's WIP limit. */
    public record WipLimitRequest(
            String status,
            /**
             * Null or 0 clears the limit (the column becomes unlimited), a
             * positive number sets it, and a negative number is rejected.
             */
            Integer limit
    ) {}
}
