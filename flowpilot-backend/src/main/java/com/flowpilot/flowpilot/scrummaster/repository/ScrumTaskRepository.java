package com.flowpilot.flowpilot.scrummaster.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;

@Repository
public interface ScrumTaskRepository
        extends JpaRepository<ScrumTask, Long> {

    List<ScrumTask> findBySprintIdOrderByStatusAscTaskKeyAsc(Long sprintId);

    /** Backlog: everything not attached to a sprint. */
    List<ScrumTask> findBySprintIsNullOrderByTaskKeyAsc();

    long countBySprintIdAndStatus(Long sprintId, ScrumTask.Status status);

    long countBySprintId(Long sprintId);

    boolean existsByTaskKey(String taskKey);

    @Query("""
        SELECT COALESCE(SUM(t.storyPoints), 0)
        FROM ScrumTask t
        WHERE t.sprint.id = :sprintId
    """)
    Integer sumStoryPointsForSprint(@Param("sprintId") Long sprintId);

    @Query("""
        SELECT COALESCE(SUM(t.storyPoints), 0)
        FROM ScrumTask t
        WHERE t.sprint.id = :sprintId
          AND t.status = :status
    """)
    Integer sumStoryPointsForSprintByStatus(
            @Param("sprintId") Long sprintId,
            @Param("status") ScrumTask.Status status
    );

    /** Overdue: past the due date and not finished (SRS Module 7 KPI). */
    @Query("""
        SELECT COUNT(t)
        FROM ScrumTask t
        WHERE t.sprint.id = :sprintId
          AND t.dueDate IS NOT NULL
          AND t.dueDate < :today
          AND t.status <> com.flowpilot.flowpilot.scrummaster.model.ScrumTask$Status.DONE
    """)
    long countOverdue(@Param("sprintId") Long sprintId, @Param("today") LocalDate today);

    /** Mean hours from creation to completion across finished work. */
    @Query("""
        SELECT AVG(
            (CAST(EXTRACT(EPOCH FROM t.completedAt) AS double)
             - CAST(EXTRACT(EPOCH FROM t.createdAt) AS double)) / 3600.0
        )
        FROM ScrumTask t
        WHERE t.sprint.id = :sprintId
          AND t.completedAt IS NOT NULL
    """)
    Double averageCompletionHours(@Param("sprintId") Long sprintId);

    /** Task counts grouped by assignee — SRS Module 7 employee productivity. */
    @Query("""
        SELECT t.assignee.id, t.assignee.name,
               COUNT(t),
               SUM(CASE WHEN t.status = com.flowpilot.flowpilot.scrummaster.model.ScrumTask$Status.DONE THEN 1 ELSE 0 END),
               COALESCE(SUM(t.storyPoints), 0)
        FROM ScrumTask t
        WHERE t.sprint.id = :sprintId
          AND t.assignee IS NOT NULL
        GROUP BY t.assignee.id, t.assignee.name
        ORDER BY t.assignee.name
    """)
    List<Object[]> productivityBySprint(@Param("sprintId") Long sprintId);

    /** Task counts grouped by priority — SRS Module 7 task distribution. */
    @Query("""
        SELECT t.priority, COUNT(t), COALESCE(SUM(t.storyPoints), 0)
        FROM ScrumTask t
        WHERE t.sprint.id = :sprintId
        GROUP BY t.priority
    """)
    List<Object[]> distributionByPriority(@Param("sprintId") Long sprintId);
}
