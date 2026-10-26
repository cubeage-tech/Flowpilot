package com.flowpilot.flowpilot.developer.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumBoardTask;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeveloperTasksRepository
        extends JpaRepository<ScrumBoardTask, Long> {

    List<ScrumBoardTask> findByAssigneeNameIgnoreCase(
            String assigneeName
    );
}
