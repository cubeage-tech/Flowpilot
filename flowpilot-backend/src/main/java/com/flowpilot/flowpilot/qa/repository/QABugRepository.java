package com.flowpilot.flowpilot.qa.repository;

import com.flowpilot.flowpilot.qa.model.QABugReport;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QABugRepository
        extends JpaRepository<QABugReport, Long> {

    boolean existsByBugId(
            String bugId
    );

    List<QABugReport> findByCreatedByIgnoreCase(
            String createdBy
    );
}
