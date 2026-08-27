package com.flowpilot.flowpilot.developer.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.developer.model.DeveloperTimeLog;

@Repository
public interface TimeLogRepository
        extends JpaRepository<DeveloperTimeLog, Long> {

    // Get all time logs, newest first
    List<DeveloperTimeLog> findAllByOrderByLogDateDescCreatedAtDesc();


    // Calculate total hours between two dates
    @Query("""
        SELECT COALESCE(SUM(t.hours), 0)
        FROM DeveloperTimeLog t
        WHERE t.logDate >= :startDate
          AND t.logDate < :endDate
    """)
    BigDecimal getTotalHoursForWeek(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}