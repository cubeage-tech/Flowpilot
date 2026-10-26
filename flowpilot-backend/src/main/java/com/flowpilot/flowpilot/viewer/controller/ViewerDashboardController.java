package com.flowpilot.flowpilot.viewer.controller;

import com.flowpilot.flowpilot.pm.dto.PMProjectDto;
import com.flowpilot.flowpilot.pm.service.PMProjectsService;
import com.flowpilot.flowpilot.viewer.dto.ViewerDashboardDto;
import com.flowpilot.flowpilot.viewer.service.ViewerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/viewer")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ViewerDashboardController {

    private final PMProjectsService projectService;
    private final ViewerDashboardService viewerDashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<ViewerDashboardDto> getDashboardOverview() {
        return ResponseEntity.ok(viewerDashboardService.getDashboardOverview());
    }

    @GetMapping("/projects")
    public ResponseEntity<List<PMProjectDto>> getProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }
}