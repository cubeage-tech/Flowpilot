package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;

@Repository
public interface ScrumSprintRepository
        extends JpaRepository<ScrumSprint, Long> {

    // The one sprint currently being worked on
    Optional<ScrumSprint> findFirstByStatus(ScrumSprint.Status status);

    // Closed sprints, newest first — the source for velocity history
    List<ScrumSprint> findByStatusOrderBySprintNumberDesc(ScrumSprint.Status status);

    // Highest sprint number so far, used when creating the next one
    Optional<ScrumSprint> findFirstByOrderBySprintNumberDesc();
}
