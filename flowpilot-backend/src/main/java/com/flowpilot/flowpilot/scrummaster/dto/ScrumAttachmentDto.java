package com.flowpilot.flowpilot.scrummaster.dto;

import java.time.LocalDateTime;

/** Task attachment payloads (SRS Module 4). */
public class ScrumAttachmentDto {

    /**
     * Field for field the frontend's `Attachment` interface in scrumApi.ts,
     * in the same order. `downloadUrl` is relative so the client decides which
     * host to hang it off.
     */
    public record Attachment(
            Long id,
            Long taskId,
            String fileName,
            String contentType,
            Long sizeBytes,
            Long uploadedById,
            String uploadedByName,
            String uploadedByInitials,
            LocalDateTime uploadedAt,
            String downloadUrl
    ) {}
}
