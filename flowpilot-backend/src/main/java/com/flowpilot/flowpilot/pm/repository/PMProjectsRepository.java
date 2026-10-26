package com.flowpilot.flowpilot.pm.repository;

import com.flowpilot.flowpilot.pm.model.PMProject;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PMProjectsRepository
        extends JpaRepository<PMProject, Long> {

    Optional<PMProject> findByProjectCode(
            String projectCode
    );

    boolean existsByProjectCode(
            String projectCode
    );
}
