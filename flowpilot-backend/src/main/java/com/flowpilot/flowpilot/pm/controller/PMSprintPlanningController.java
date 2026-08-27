package com.flowpilot.flowpilot.pm.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.pm.dto.PMSprintDto;
import com.flowpilot.flowpilot.pm.service.PMSprintPlanningService;

@RestController
@RequestMapping("/api/pm/sprints")
@CrossOrigin(origins = "http://localhost:5173")
public class PMSprintPlanningController {

    private final PMSprintPlanningService sprintService;


    public PMSprintPlanningController(
            PMSprintPlanningService sprintService) {

        this.sprintService =
                sprintService;
    }


    /*
     * =========================================================
     * GET ALL SPRINTS
     *
     * GET /api/pm/sprints
     * =========================================================
     */

    @GetMapping
    public ResponseEntity<List<PMSprintDto>>
    getAllSprints() {

        return ResponseEntity.ok(
                sprintService.getAllSprints()
        );
    }


    /*
     * =========================================================
     * GET SPRINT BY ID
     *
     * GET /api/pm/sprints/{id}
     * =========================================================
     */

    @GetMapping("/{id}")
    public ResponseEntity<PMSprintDto>
    getSprint(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                sprintService.getSprint(id)
        );
    }


    /*
     * =========================================================
     * GET SPRINTS BY PROJECT
     *
     * GET /api/pm/sprints/project/{projectId}
     * =========================================================
     */

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<PMSprintDto>>
    getSprintsByProject(
            @PathVariable Long projectId) {

        return ResponseEntity.ok(
                sprintService
                        .getSprintsByProject(
                                projectId
                        )
        );
    }
}