package com.flowpilot.flowpilot.scrummaster.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumAnalyticsDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumAnalyticsService;

@RestController
@RequestMapping("/api/scrummaster/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumAnalyticsController {

    private final ScrumAnalyticsService service;

    public ScrumAnalyticsController(ScrumAnalyticsService service) {
        this.service = service;
    }

    /** Omit sprintId for the sprint currently in flight. */
    @GetMapping
    public ResponseEntity<ScrumAnalyticsDto.Response> getAnalytics(
            @RequestParam(required = false) Long sprintId) {

        return ResponseEntity.ok(service.getAnalytics(sprintId));
    }
}
