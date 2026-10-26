package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumSubtask;

@Repository
public interface ScrumSubtaskRepository extends JpaRepository<ScrumSubtask, Long> {

    List<ScrumSubtask> findByTaskIdOrderByIdAsc(Long taskId);

    int countByTaskId(Long taskId);

    int countByTaskIdAndCompletedTrue(Long taskId);

    @org.springframework.data.jpa.repository.Query("""
        SELECT s.task.id, COUNT(s), SUM(CASE WHEN s.completed = true THEN 1 ELSE 0 END)
        FROM ScrumSubtask s
        WHERE s.task.id IN :taskIds
        GROUP BY s.task.id
    """)
    List<Object[]> countSubtasksGroupedByTaskId(
            @org.springframework.data.repository.query.Param("taskIds") java.util.Collection<Long> taskIds
    );

    void deleteByTaskId(Long taskId);
}
