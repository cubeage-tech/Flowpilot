package com.flowpilot.flowpilot.scrummaster.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Task payloads. Records are used across this module's DTOs: they are the wire
 * contract, so being immutable and declarative beats hand-written getters.
 */
public class ScrumTaskDto {

    /** A card as the board renders it. */
    public record Card(
            Long id,
            String taskKey,
            String title,
            String description,
            String priority,
            String status,
            Integer storyPoints,
            BigDecimal estimatedHours,
            BigDecimal actualHours,
            LocalDate dueDate,
            List<String> labels,
            String blockedReason,
            Long assigneeId,
            String assigneeName,
            String assigneeInitials,
            Long reporterId,
            String reporterName,
            Long sprintId,
            Integer daysInColumn,
            boolean stuck,
            boolean overdue
    ) {}

    public record CreateRequest(
            String title,
            String description,
            String priority,
            String status,
            Integer storyPoints,
            BigDecimal estimatedHours,
            BigDecimal actualHours,
            LocalDate dueDate,
            List<String> labels,
            Long assigneeId,
            Long reporterId,
            Long sprintId
    ) {}

    /**
     * Every field optional — only what is sent gets changed.
     *
     * A null therefore means "leave alone", which makes clearing a field
     * impossible to express. The explicit clear flags exist for exactly that:
     * without them an emptied due date would be silently discarded and the
     * request would still report success.
     */
    public record UpdateRequest(
            String title,
            String description,
            String priority,
            String status,
            Integer storyPoints,
            BigDecimal estimatedHours,
            BigDecimal actualHours,
            LocalDate dueDate,
            List<String> labels,
            String blockedReason,
            Long assigneeId,
            Boolean unassign,
            Long reporterId,
            Long sprintId,
            Boolean removeFromSprint,
            Boolean clearDescription,
            Boolean clearDueDate,
            Boolean clearEstimatedHours,
            Boolean clearActualHours,
            Boolean clearLabels
    ) {}

    /** A person a task can be assigned to. */
    public record Member(
            Long id,
            String name,
            String email,
            String role,
            String initials
    ) {}
}
