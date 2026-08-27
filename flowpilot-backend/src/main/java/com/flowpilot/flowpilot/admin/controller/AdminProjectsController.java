package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.admin.service.AdminProjectsService;
import com.flowpilot.flowpilot.pm.dto.PMProjectDto;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/projects")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminProjectsController {

    private final AdminProjectsService projectService;

    public AdminProjectsController(
            AdminProjectsService projectService) {

        this.projectService = projectService;
    }

    /**
     * Get all projects created by Project Managers.
     *
     * Returns PMProjectDto instead of PMProject entity
     * to prevent Hibernate proxy serialization errors.
     */
    @GetMapping
    public ResponseEntity<List<PMProjectDto>> getAllProjects() {

        return ResponseEntity.ok(
                projectService.getAllProjects()
        );
    }

    /**
     * Get a single project by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PMProjectDto> getProject(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                projectService.getProject(id)
        );
    }
}