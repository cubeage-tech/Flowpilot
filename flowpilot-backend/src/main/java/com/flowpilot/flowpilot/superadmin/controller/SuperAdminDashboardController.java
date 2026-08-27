package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.common.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/superadmin/dashboard")
@RequiredArgsConstructor
public class SuperAdminDashboardController {

    private final DashboardService dashboardService;

    // =========================================================
    // GET SUPER ADMIN DASHBOARD
    // =========================================================

    @GetMapping
    public ResponseEntity<Map<String, Object>>
    getDashboard() {

        return ResponseEntity.ok(
                dashboardService.getSuperAdminDashboard()
        );
    }
}