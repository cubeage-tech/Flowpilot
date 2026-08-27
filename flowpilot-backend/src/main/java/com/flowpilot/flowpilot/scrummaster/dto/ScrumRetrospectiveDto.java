package com.flowpilot.flowpilot.scrummaster.dto;

import java.time.LocalDate;
import java.util.List;

/** Retrospective payloads. */
public class ScrumRetrospectiveDto {

    public record Item(
            Long id,
            String kind,
            String text,
            Long ownerId,
            String ownerName,
            String ownerInitials,
            String dueLabel,
            LocalDate dueDate,
            boolean completed
    ) {}

    public record Response(
            Long sprintId,
            String sprintName,
            String sprintStatus,
            LocalDate heldOn,
            List<Item> wentWell,
            List<Item> toChange,
            List<Item> actions,
            List<ScrumTaskDto.Member> members
    ) {}

    public record CreateRequest(
            String kind,
            String text,
            Long ownerId,
            String dueLabel,
            LocalDate dueDate
    ) {}

    public record UpdateRequest(
            String text,
            Long ownerId,
            Boolean clearOwner,
            String dueLabel,
            LocalDate dueDate,
            Boolean completed
    ) {}
}
