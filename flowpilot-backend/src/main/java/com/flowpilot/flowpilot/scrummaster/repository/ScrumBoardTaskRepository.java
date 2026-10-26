package com.flowpilot.flowpilot.scrummaster.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumBoardTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScrumBoardTaskRepository extends JpaRepository<ScrumBoardTask, Long> {
    List<ScrumBoardTask> findByColumnStatus(String columnStatus);
    List<ScrumBoardTask> findByProjectId(Long projectId);
    Optional<ScrumBoardTask> findByTaskCode(String taskCode);
}
