package com.flowpilot.flowpilot.scrummaster.dto;

import java.time.LocalDateTime;

/** Task comment payloads (SRS Module 4). */
public class ScrumCommentDto {

    public record Comment(
            Long id,
            Long taskId,
            Long authorId,
            String authorName,
            String authorInitials,
            String body,
            LocalDateTime createdAt,
            LocalDateTime editedAt,
            boolean edited
    ) {}

    public record CreateRequest(
            Long authorId,
            String body
    ) {}

    public record UpdateRequest(
            String body
    ) {}
}
