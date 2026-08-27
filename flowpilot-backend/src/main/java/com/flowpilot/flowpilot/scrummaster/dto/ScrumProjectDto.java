package com.flowpilot.flowpilot.scrummaster.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * A read-only view of the Project Manager module's projects, so a sprint can
 * be attached to real work (SRS section 14: sprints.project_id) and so the
 * project's team can stand in as the sprint roster (SRS Module 6: "Members")
 * without duplicating people into a second table.
 */
public class ScrumProjectDto {

    public record TeamMember(
            Long id,
            String name,
            String email,
            String employeeId,
            String designation,
            String initials
    ) {}

    public record Project(
            Long id,
            String code,
            String name,
            String status,
            Integer progress,
            LocalDate startDate,
            LocalDate endDate,
            Integer memberCount,
            List<TeamMember> members
    ) {}
}
