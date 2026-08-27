package com.flowpilot.flowpilot.qa.repository;

import com.flowpilot.flowpilot.qa.model.QATestCase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QATestCaseRepository
        extends JpaRepository<QATestCase, Long> {

    boolean existsByTestId(String testId);

    Optional<QATestCase> findByScrumTaskId(
            Long scrumTaskId
    );

    List<QATestCase> findByAssignedToIgnoreCase(
            String assignedTo
    );

    List<QATestCase> findByProjectId(
            Long projectId
    );
}