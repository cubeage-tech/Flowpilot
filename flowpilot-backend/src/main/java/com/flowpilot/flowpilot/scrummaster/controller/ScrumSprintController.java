package com.flowpilot.flowpilot.scrummaster.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumSprintDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumSprintService;

/**
 * Sprint lifecycle and planning endpoints, SRS Module 6.
 *
 * Validation and lifecycle rules live in the service; this class only maps
 * HTTP onto it. ScrumExceptionHandler turns the module's two exceptions into
 * 400 and 404, so there is deliberately no try/catch here — catching would
 * collapse every distinct refusal back into one status code.
 */
@RestController
@RequestMapping("/api/scrummaster/sprints")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumSprintController {

    private final ScrumSprintService sprintService;


    public ScrumSprintController(ScrumSprintService sprintService) {
        this.sprintService = sprintService;
    }


    // ============================================
    // GET
    // All sprints, newest first
    //
    // GET /api/scrummaster/sprints
    // ============================================
    @GetMapping
    public ResponseEntity<List<ScrumSprintDto.Response>> getSprints() {

        return ResponseEntity.ok(sprintService.listSprints());
    }


    // ============================================
    // GET
    // The sprint currently being worked on
    //
    // GET /api/scrummaster/sprints/active
    // ============================================

    /**
     * 204 rather than 404 when nothing is active: between two sprints there is
     * legitimately no active sprint, and that is not a missing resource the
     * caller should treat as an error.
     */
    @GetMapping("/active")
    public ResponseEntity<ScrumSprintDto.Response> getActiveSprint() {

        return sprintService.findActiveSprint()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }


    // ============================================
    // GET
    // One sprint
    //
    // GET /api/scrummaster/sprints/{sprintId}
    // ============================================
    @GetMapping("/{sprintId}")
    public ResponseEntity<ScrumSprintDto.Response> getSprint(
            @PathVariable Long sprintId
    ) {

        return ResponseEntity.ok(sprintService.getSprint(sprintId));
    }


    // ============================================
    // POST
    // Create a sprint in PLANNED state
    //
    // POST /api/scrummaster/sprints
    // ============================================
    @PostMapping
    public ResponseEntity<ScrumSprintDto.Response> createSprint(
            @RequestBody ScrumSprintDto.CreateRequest request
    ) {

        ScrumSprintDto.Response created = sprintService.createSprint(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }


    // ============================================
    // PATCH
    // Update only the fields that were sent
    //
    // PATCH /api/scrummaster/sprints/{sprintId}
    // ============================================
    @PatchMapping("/{sprintId}")
    public ResponseEntity<ScrumSprintDto.Response> updateSprint(
            @PathVariable Long sprintId,
            @RequestBody ScrumSprintDto.UpdateRequest request
    ) {

        return ResponseEntity.ok(
                sprintService.updateSprint(sprintId, request)
        );
    }


    // ============================================
    // POST
    // Start the sprint and freeze its commitment
    //
    // POST /api/scrummaster/sprints/{sprintId}/start
    // ============================================
    @PostMapping("/{sprintId}/start")
    public ResponseEntity<ScrumSprintDto.Response> startSprint(
            @PathVariable Long sprintId
    ) {

        return ResponseEntity.ok(sprintService.startSprint(sprintId));
    }


    // ============================================
    // POST
    // Close the sprint; carryTo receives unfinished
    // work, otherwise it returns to the backlog
    //
    // POST /api/scrummaster/sprints/{sprintId}/complete
    // ============================================
    @PostMapping("/{sprintId}/complete")
    public ResponseEntity<ScrumSprintDto.CompleteResult> completeSprint(
            @PathVariable Long sprintId,
            @RequestParam(name = "carryTo", required = false) Long carryTo
    ) {

        return ResponseEntity.ok(
                sprintService.completeSprint(sprintId, carryTo)
        );
    }


    // ============================================
    // POST
    // Sprint planning — pull backlog items in
    //
    // POST /api/scrummaster/sprints/{sprintId}/backlog
    // ============================================
    @PostMapping("/{sprintId}/backlog")
    public ResponseEntity<ScrumSprintDto.Response> addBacklogTasks(
            @PathVariable Long sprintId,
            @RequestBody ScrumSprintDto.BacklogSelection selection
    ) {

        // The refreshed sprint comes back rather than 204, so the planning
        // screen can re-render its point totals from one round trip
        return ResponseEntity.ok(
                sprintService.addBacklogTasks(sprintId, selection)
        );
    }


    // ============================================
    // DELETE
    // Sprint planning — push items back out
    //
    // DELETE /api/scrummaster/sprints/{sprintId}/backlog
    // ============================================
    @DeleteMapping("/{sprintId}/backlog")
    public ResponseEntity<ScrumSprintDto.Response> removeBacklogTasks(
            @PathVariable Long sprintId,
            @RequestBody ScrumSprintDto.BacklogSelection selection
    ) {

        return ResponseEntity.ok(
                sprintService.removeBacklogTasks(sprintId, selection)
        );
    }


    // ============================================
    // DELETE
    // Remove a sprint; its tasks return to the backlog
    //
    // DELETE /api/scrummaster/sprints/{sprintId}
    // ============================================
    @DeleteMapping("/{sprintId}")
    public ResponseEntity<Map<String, Object>> deleteSprint(
            @PathVariable Long sprintId
    ) {

        ScrumSprintDto.Response deleted = sprintService.deleteSprint(sprintId);

        // LinkedHashMap keeps success ahead of message in the JSON, matching
        // the shape ScrumExceptionHandler returns on the failure path
        Map<String, Object> body = new LinkedHashMap<>();

        body.put("success", true);
        body.put(
                "message",
                "Sprint " + deleted.sprintNumber()
                        + " (" + deleted.name() + ") was deleted"
        );
        body.put("releasedTaskCount", deleted.taskCount());

        return ResponseEntity.ok(body);
    }
}
