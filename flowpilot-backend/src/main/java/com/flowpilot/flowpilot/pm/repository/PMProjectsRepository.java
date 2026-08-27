package com.flowpilot.flowpilot.pm.repository;

import com.flowpilot.flowpilot.pm.model.PMProject;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PMProjectsRepository
        extends JpaRepository<PMProject, Long> {

    Optional<PMProject> findByProjectCode(
            String projectCode
    );

    boolean existsByProjectCode(
            String projectCode
    );
}