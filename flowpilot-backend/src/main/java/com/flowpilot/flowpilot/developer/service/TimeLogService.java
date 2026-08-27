package com.flowpilot.flowpilot.developer.service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.flowpilot.flowpilot.developer.dto.DeveloperTimeLogDto;
import com.flowpilot.flowpilot.developer.model.DeveloperTimeLog;
import com.flowpilot.flowpilot.developer.repository.TimeLogRepository;
import com.flowpilot.flowpilot.superadmin.service.SuperAdminAuditLogsService;

@Service
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final SuperAdminAuditLogsService auditLogsService;


    public TimeLogService(
            TimeLogRepository timeLogRepository,
            SuperAdminAuditLogsService auditLogsService
    ) {
        this.timeLogRepository = timeLogRepository;
        this.auditLogsService = auditLogsService;
    }


    // ============================================
    // CREATE NEW TIME LOG
    // ============================================
    public DeveloperTimeLogDto.Response createTimeLog(
            DeveloperTimeLogDto.CreateRequest request
    ) {

        // Validate request
        if (request == null) {
            throw new RuntimeException("Time log data is required");
        }

        if (
                request.getTask() == null ||
                request.getTask().trim().isEmpty()
        ) {
            throw new RuntimeException("Task is required");
        }

        if (
                request.getHours() == null ||
                request.getHours().compareTo(BigDecimal.ZERO) <= 0
        ) {
            throw new RuntimeException(
                    "Hours must be greater than 0"
            );
        }

        if (
                request.getNotes() == null ||
                request.getNotes().trim().isEmpty()
        ) {
            throw new RuntimeException("Notes are required");
        }


        // Create entity
        DeveloperTimeLog timeLog = new DeveloperTimeLog();

        timeLog.setTask(
                request.getTask().trim()
        );

        timeLog.setHours(
                request.getHours()
        );

        timeLog.setNotes(
                request.getNotes().trim()
        );

        timeLog.setLogDate(
                LocalDate.now()
        );


        // Save to PostgreSQL
        DeveloperTimeLog savedTimeLog =
                timeLogRepository.save(timeLog);

        auditLogsService.recordQuietly(
                "TIME_LOGGED",
                "TimeLog",
                savedTimeLog.getId() != null
                        ? String.valueOf(savedTimeLog.getId())
                        : savedTimeLog.getTask()
        );

        return convertToResponse(savedTimeLog);
    }


    // ============================================
    // GET ALL TIME LOG HISTORY
    // + GET CURRENT WEEK TOTAL
    // ============================================
    public DeveloperTimeLogDto.HistoryResponse getTimeLogHistory() {

        List<DeveloperTimeLog> timeLogs =
                timeLogRepository.findAllByOrderByLogDateDescCreatedAtDesc();


        List<DeveloperTimeLogDto.Response> entries =
                timeLogs.stream()
                        .map(this::convertToResponse)
                        .toList();


        // Current date
        LocalDate today = LocalDate.now();


        // Week starts Monday
        LocalDate startOfWeek =
                today.with(DayOfWeek.MONDAY);


        // Next Monday
        LocalDate endOfWeek =
                startOfWeek.plusWeeks(1);


        // Get weekly hours
        BigDecimal weeklyTotal =
                timeLogRepository.getTotalHoursForWeek(
                        startOfWeek,
                        endOfWeek
                );


        if (weeklyTotal == null) {
            weeklyTotal = BigDecimal.ZERO;
        }


        return new DeveloperTimeLogDto.HistoryResponse(
                entries,
                weeklyTotal
        );
    }


    // ============================================
    // CONVERT ENTITY TO DTO
    // ============================================
    private DeveloperTimeLogDto.Response convertToResponse(
            DeveloperTimeLog timeLog
    ) {

        return new DeveloperTimeLogDto.Response(
                timeLog.getId(),
                timeLog.getTask(),
                timeLog.getHours(),
                timeLog.getNotes(),
                timeLog.getLogDate()
        );
    }
}