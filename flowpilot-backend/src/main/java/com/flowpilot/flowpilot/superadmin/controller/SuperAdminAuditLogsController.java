package com.flowpilot.flowpilot.superadmin.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminAuditLogDto;
import com.flowpilot.flowpilot.superadmin.service.SuperAdminAuditLogsService;

@RestController
@RequestMapping("/api/superadmin/audit-logs")
@CrossOrigin(origins = "http://localhost:5173")
public class SuperAdminAuditLogsController {

    private final SuperAdminAuditLogsService auditLogsService;

    public SuperAdminAuditLogsController(
            SuperAdminAuditLogsService auditLogsService
    ) {
        this.auditLogsService = auditLogsService;
    }

    @GetMapping
    public ResponseEntity<List<SuperAdminAuditLogDto>> getAuditLogs(
            @RequestParam(defaultValue = "All") String filter,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(
                auditLogsService.getAuditLogs(filter, search)
        );
    }

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter streamAuditLogs() {
        return auditLogsService.subscribe();
    }
}
