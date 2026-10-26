package com.flowpilot.flowpilot.pm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowpilot.flowpilot.pm.model.PMSprint;

public interface PMSprintRepository
        extends JpaRepository<PMSprint, Long> {

    List<PMSprint> findByProjectId(Long projectId);
}
