package com.flowpilot.flowpilot.scrummaster.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumStandup;

public interface ScrumStandupRepository
        extends JpaRepository<ScrumStandup, Long> {

    List<ScrumStandup> findBySprintIdAndStandupDateOrderByIdAsc(
            Long sprintId, LocalDate standupDate);

    Optional<ScrumStandup> findBySprintIdAndMemberIdAndStandupDate(
            Long sprintId, Long memberId, LocalDate standupDate);

    /** Distinct dates a standup was recorded, newest first. */
    @org.springframework.data.jpa.repository.Query("""
        SELECT DISTINCT s.standupDate
        FROM ScrumStandup s
        WHERE s.sprintId = :sprintId
        ORDER BY s.standupDate DESC
    """)
    List<LocalDate> findDatesForSprint(
            @org.springframework.data.repository.query.Param("sprintId") Long sprintId);

    void deleteBySprintId(Long sprintId);
}
