package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumTaskDependency;

@Repository
public interface ScrumTaskDependencyRepository
        extends JpaRepository<ScrumTaskDependency, Long> {

    /** What this task is waiting on. */
    List<ScrumTaskDependency> findByTaskId(Long taskId);

    /** What is waiting on this task. */
    List<ScrumTaskDependency> findByDependsOnTaskId(Long dependsOnTaskId);

    boolean existsByTaskIdAndDependsOnTaskId(Long taskId, Long dependsOnTaskId);

    boolean existsByTaskIdAndDependsOnTaskIdAndKind(
            Long taskId, Long dependsOnTaskId,
            com.flowpilot.flowpilot.scrummaster.model.ScrumTaskDependency.Kind kind);

    void deleteByTaskId(Long taskId);

    void deleteByDependsOnTaskId(Long dependsOnTaskId);
}
