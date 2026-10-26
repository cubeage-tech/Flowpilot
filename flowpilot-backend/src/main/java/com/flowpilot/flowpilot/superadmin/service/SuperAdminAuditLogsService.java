package com.flowpilot.flowpilot.superadmin.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminAuditLogDto;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminAuditLog;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminAuditLogRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class SuperAdminAuditLogsService {

    private final SuperAdminAuditLogRepository repository;
    private final List<SseEmitter> subscribers = new CopyOnWriteArrayList<>();

    private final DateTimeFormatter timeFormatter =
            DateTimeFormatter.ofPattern("hh:mm a", Locale.US);

    public SuperAdminAuditLogsService(
            SuperAdminAuditLogRepository repository
    ) {
        this.repository = repository;
    }

    public SuperAdminAuditLogDto createAuditLog(
            String userName,
            String action,
            String entityName,
            String entityId,
            String ipAddress
    ) {
        SuperAdminAuditLog auditLog = new SuperAdminAuditLog();
        auditLog.setUserName(blankToDash(userName));
        auditLog.setAction(blankToDash(action));
        auditLog.setEntityName(blankToDash(entityName));
        auditLog.setEntityId(entityId);
        auditLog.setIpAddress(ipAddress);

        SuperAdminAuditLogDto response = convertToDto(repository.save(auditLog));
        notifySubscribers(response);
        return response;
    }

    public void recordLoginQuietly(String userName, String entityId) {
        try {
            createAuditLog(
                    userName,
                    "USER_LOGIN",
                    "User",
                    entityId,
                    currentIpAddress()
            );
        } catch (Exception ignored) {
            // Login must still succeed if audit recording is unavailable.
        }
    }

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        subscribers.add(emitter);
        emitter.onCompletion(() -> subscribers.remove(emitter));
        emitter.onTimeout(() -> subscribers.remove(emitter));
        emitter.onError(error -> subscribers.remove(emitter));
        return emitter;
    }

    private void notifySubscribers(SuperAdminAuditLogDto auditLog) {
        for (SseEmitter emitter : subscribers) {
            try {
                emitter.send(SseEmitter.event()
                        .name("audit-log")
                    .data(Objects.requireNonNull(auditLog)));
            } catch (Exception exception) {
                subscribers.remove(emitter);
                emitter.completeWithError(exception);
            }
        }
    }

    public void recordQuietly(
            String action,
            String entityName,
            String entityId
    ) {
        try {
            createAuditLog(
                    currentUserName(),
                    action,
                    entityName,
                    entityId,
                    currentIpAddress()
            );
        } catch (Exception ignored) {
            // Time log / user action should still succeed if audit write fails.
        }
    }

    public List<SuperAdminAuditLogDto> getAuditLogs(
            String filter,
            String search
    ) {
        LocalDateTime startDate = LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        String action = "";
        String searchTerm = search != null ? search.trim() : "";

        LocalDate today = LocalDate.now();

        if ("Today".equalsIgnoreCase(filter)) {
            startDate = today.atStartOfDay();
            endDate = today.plusDays(1).atStartOfDay();
        } else if ("This Week".equalsIgnoreCase(filter)) {
            LocalDate weekStart = today.with(DayOfWeek.MONDAY);
            startDate = weekStart.atStartOfDay();
            endDate = weekStart.plusDays(7).atStartOfDay();
        } else if (
                filter != null
                        && !filter.isBlank()
                        && !"All".equalsIgnoreCase(filter)
        ) {
            action = filter;
        }

        final String actionFilter = action;
        final LocalDateTime rangeStart = startDate;
        final LocalDateTime rangeEnd = endDate;
        final String searchQuery = searchTerm;

        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(log -> actionFilter.isBlank()
                        || actionFilter.equalsIgnoreCase(log.getAction()))
                .filter(log -> log.getCreatedAt() != null
                        && !log.getCreatedAt().isBefore(rangeStart)
                        && log.getCreatedAt().isBefore(rangeEnd))
                .filter(log -> matchesSearch(log, searchQuery))
                .map(this::convertToDto)
                .toList();
    }

    private boolean matchesSearch(SuperAdminAuditLog log, String searchTerm) {
        if (searchTerm.isBlank()) {
            return true;
        }

        String query = searchTerm.toLowerCase(Locale.ROOT);

        return containsIgnoreCase(log.getUserName(), query)
                || containsIgnoreCase(log.getAction(), query)
                || containsIgnoreCase(log.getEntityName(), query)
                || containsIgnoreCase(log.getEntityId(), query)
                || containsIgnoreCase(log.getIpAddress(), query);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private SuperAdminAuditLogDto convertToDto(SuperAdminAuditLog log) {
        LocalDateTime createdAt = log.getCreatedAt() != null
                ? log.getCreatedAt()
                : LocalDateTime.now();

        String day;
        LocalDate logDate = createdAt.toLocalDate();
        LocalDate today = LocalDate.now();

        if (logDate.equals(today)) {
            day = "Today";
        } else if (logDate.equals(today.minusDays(1))) {
            day = "Yesterday";
        } else {
            day = logDate.toString();
        }

        return new SuperAdminAuditLogDto(
                log.getId(),
                createdAt.format(timeFormatter),
                log.getUserName(),
                log.getAction(),
                log.getEntityName(),
                log.getEntityId() != null ? log.getEntityId() : "",
                log.getIpAddress() != null ? log.getIpAddress() : "",
                day
        );
    }

    private String currentUserName() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return "Unknown";
        }

        return authentication.getName();
    }

    private String currentIpAddress() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attributes == null) {
                return "";
            }

            HttpServletRequest request = attributes.getRequest();
            String ip = request.getHeader("X-Forwarded-For");

            if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("X-Real-IP");
            }

            if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("Forwarded");
                if (ip != null && ip.toLowerCase(Locale.ROOT).contains("for=")) {
                    ip = ip.substring(ip.toLowerCase(Locale.ROOT).indexOf("for=") + 4);
                    int separator = ip.indexOf(';');
                    if (separator >= 0) {
                        ip = ip.substring(0, separator);
                    }
                    ip = ip.replace("\"", "").trim();
                }
            }

            if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            }

            if (ip != null && ip.contains(",")) {
                ip = ip.split(",")[0].trim();
            }

            if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
                return "127.0.0.1";
            }

            return ip != null ? ip : "";
        } catch (Exception exception) {
            return "";
        }
    }

    private String blankToDash(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value.trim();
    }
}
