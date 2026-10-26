package com.flowpilot.flowpilot.qa.repository;

import com.flowpilot.flowpilot.qa.model.QATestCase;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QATestCaseRepository
        extends JpaRepository<QATestCase, Long> {

    boolean existsByTestId(String testId);

    Optional<QATestCase> findByScrumTaskId(
            Long scrumTaskId
    );

    Optional<QATestCase> findByLinkedTask(
            String linkedTask
    );

    List<QATestCase> findByAssignedToIgnoreCase(
            String assignedTo
    );

    List<QATestCase> findByProjectId(
            Long projectId
    );
}
