package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;

public interface ScrumSprintRepository
        extends JpaRepository<ScrumSprint, Long> {

    // The one sprint currently being worked on, highest sprint number first
    Optional<ScrumSprint> findFirstByStatusOrderBySprintNumberDesc(ScrumSprint.Status status);

    Optional<ScrumSprint> findFirstByStatusOrderByIdDesc(ScrumSprint.Status status);

    Optional<ScrumSprint> findFirstByStatus(ScrumSprint.Status status);

    // Closed sprints, newest first — the source for velocity history
    List<ScrumSprint> findByStatusOrderBySprintNumberDesc(ScrumSprint.Status status);

    // Highest sprint number so far, used when creating the next one
    Optional<ScrumSprint> findFirstByOrderBySprintNumberDesc();

    Optional<ScrumSprint> findFirstByOrderByIdDesc();

    // Every sprint of one PM project. The board and the sprint list are scoped
    // to a project, so a sprint from another project must never appear.
    List<ScrumSprint> findByProjectId(Long projectId);

    // The sprint being worked on inside one project
    Optional<ScrumSprint> findFirstByProjectIdAndStatusOrderBySprintNumberDesc(
            Long projectId, ScrumSprint.Status status);

    Optional<ScrumSprint> findFirstByProjectIdAndStatusOrderByIdDesc(
            Long projectId, ScrumSprint.Status status);

    Optional<ScrumSprint> findFirstByProjectIdAndStatus(
            Long projectId, ScrumSprint.Status status);

    List<ScrumSprint> findByProjectIdAndStatus(
            Long projectId, ScrumSprint.Status status);

    // Fallback when a project has no active sprint: show its most recent one
    // rather than an error, so selecting a project always lands on a board.
    Optional<ScrumSprint> findFirstByProjectIdOrderBySprintNumberDesc(Long projectId);

    Optional<ScrumSprint> findFirstByProjectIdOrderByIdDesc(Long projectId);

    @org.springframework.data.jpa.repository.Query("""
        SELECT s FROM ScrumSprint s
        ORDER BY CASE
            WHEN s.status = com.flowpilot.flowpilot.scrummaster.model.ScrumSprint$Status.ACTIVE THEN 1
            WHEN s.status = com.flowpilot.flowpilot.scrummaster.model.ScrumSprint$Status.PLANNED THEN 2
            ELSE 3
        END ASC, s.sprintNumber DESC, s.id DESC
    """)
    List<ScrumSprint> findPrioritizedSprints();

    /**
     * The sprint the screens should default to.
     * Executes in a single fast indexed query.
     */
    default Optional<ScrumSprint> findCurrentOrLatest() {
        List<ScrumSprint> sprints = findPrioritizedSprints();
        return sprints.isEmpty() ? Optional.empty() : Optional.of(sprints.get(0));
    }
}
