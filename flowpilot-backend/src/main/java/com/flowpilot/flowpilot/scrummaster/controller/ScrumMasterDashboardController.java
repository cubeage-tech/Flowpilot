package com.flowpilot.flowpilot.scrummaster.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.service.ScrumMasterDashboardService;

@RestController
@RequestMapping("/api/scrummaster/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumMasterDashboardController {

    private final ScrumMasterDashboardService service;

    public ScrumMasterDashboardController(ScrumMasterDashboardService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard() {

        return ResponseEntity.ok(service.getDashboard());
    }
}
