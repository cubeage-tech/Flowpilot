package com.flowpilot.flowpilot.viewer.controller;

import com.flowpilot.flowpilot.pm.dto.PMProjectDto;
import com.flowpilot.flowpilot.pm.service.PMProjectsService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/viewer")
@CrossOrigin(origins = "http://localhost:5173")
public class ViewerDashboardController {

    private final PMProjectsService projectService;

    public ViewerDashboardController(
            PMProjectsService projectService) {

        this.projectService = projectService;
    }

    @GetMapping("/projects")
    public ResponseEntity<List<PMProjectDto>> getProjects() {

        return ResponseEntity.ok(
                projectService.getAllProjects()
        );
    }
}