package com.flowpilot.flowpilot.scrummaster.dto;

import java.time.LocalDate;
import java.util.List;

/** Daily standup payloads. */
public class ScrumStandupDto {

    public record Entry(
            Long id,
            Long memberId,
            String memberName,
            String memberInitials,
            String memberRole,
            LocalDate standupDate,
            String yesterday,
            String today,
            String blocker,
            boolean blocked
    ) {}

    public record Response(
            Long sprintId,
            String sprintName,
            LocalDate date,
            Integer attending,
            Integer blockedCount,
            /** Dates that already have entries, for the date picker. */
            List<LocalDate> recordedDates,
            List<ScrumTaskDto.Member> members,
            List<Entry> entries
    ) {}

    /** Creates or replaces one member's entry for a date. */
    public record SaveRequest(
            Long memberId,
            LocalDate standupDate,
            String yesterday,
            String today,
            String blocker
    ) {}
}
