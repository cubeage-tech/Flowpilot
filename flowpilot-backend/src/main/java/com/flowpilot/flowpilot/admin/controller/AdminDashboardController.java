package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.admin.dto.AdminDashboardDto;
import com.flowpilot.flowpilot.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping
    public ResponseEntity<AdminDashboardDto> getDashboardData() {
        return ResponseEntity.ok(adminDashboardService.getDashboardData());
    }
}