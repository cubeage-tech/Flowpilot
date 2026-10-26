package com.flowpilot.flowpilot.scrummaster.dto;

public class ScrumSubtaskDto {

    public record Item(
            Long id,
            Long taskId,
            String title,
            boolean completed,
            Long assigneeId,
            String assigneeName,
            String assigneeInitials
    ) {}

    public record CreateRequest(
            String title,
            Long assigneeId
    ) {}

    public record UpdateRequest(
            String title,
            Boolean completed,
            Long assigneeId,
            Boolean unassign
    ) {}
}
