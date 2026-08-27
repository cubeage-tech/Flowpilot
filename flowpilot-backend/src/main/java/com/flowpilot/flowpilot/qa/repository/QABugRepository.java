package com.flowpilot.flowpilot.qa.repository;

import com.flowpilot.flowpilot.qa.model.QABugReport;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QABugRepository
        extends JpaRepository<QABugReport, Long> {
}