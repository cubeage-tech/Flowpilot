package com.flowpilot.flowpilot.pm.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.pm.model.PMTask;
import com.flowpilot.flowpilot.pm.service.PMAnalyticsService;

@RestController
@RequestMapping("/api/pm/analytics")
@CrossOrigin
public class PMAnalyticsController {

    private final PMAnalyticsService analyticsService;

    public PMAnalyticsController(PMAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/tasks")
    public List<PMTask> getAnalyticsTasks() {
        return analyticsService.getAnalyticsTasks();
    }
}