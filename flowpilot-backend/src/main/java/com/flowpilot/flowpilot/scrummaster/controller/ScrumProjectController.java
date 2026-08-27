package com.flowpilot.flowpilot.scrummaster.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumProjectDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumProjectService;

/** Read-only project lookup for attaching sprints to real project work. */
@RestController
@RequestMapping("/api/scrummaster/projects")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumProjectController {

    private final ScrumProjectService service;

    public ScrumProjectController(ScrumProjectService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ScrumProjectDto.Project>> listProjects() {

        return ResponseEntity.ok(service.listProjects());
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ScrumProjectDto.Project> getProject(
            @PathVariable Long projectId) {

        return ResponseEntity.ok(service.getProject(projectId));
    }

    /** The sprint roster: the owning project's team (SRS Module 6 "Members"). */
    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ScrumProjectDto.TeamMember>> members(
            @PathVariable Long projectId) {

        return ResponseEntity.ok(service.membersOfProject(projectId));
    }
}
