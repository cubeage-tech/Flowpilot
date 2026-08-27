package com.flowpilot.flowpilot.scrummaster.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumDependencyDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumDependencyService;

/** Task dependencies (SRS Module 4: "Dependencies"). */
@RestController
@RequestMapping("/api/scrummaster/dependencies")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumDependencyController {

    private final ScrumDependencyService service;

    public ScrumDependencyController(ScrumDependencyService service) {
        this.service = service;
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<ScrumDependencyDto.Response> forTask(@PathVariable Long taskId) {

        return ResponseEntity.ok(service.forTask(taskId));
    }

    /**
     * Records a new edge and answers with the card's refreshed dependencies, so
     * the client repaints both directions from one round trip.
     */
    @PostMapping("/task/{taskId}")
    public ResponseEntity<ScrumDependencyDto.Response> link(
            @PathVariable Long taskId,
            @RequestBody ScrumDependencyDto.CreateRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.link(taskId, request));
    }

    /** The link id alone identifies the edge, so either end can remove it. */
    @DeleteMapping("/{linkId}")
    public ResponseEntity<Map<String, Object>> unlink(@PathVariable Long linkId) {

        service.unlink(linkId);

        return ResponseEntity.ok(Map.of("success", true, "message", "Dependency removed"));
    }

    /**
     * Same removal, from the card the caller is looking at: naming the task
     * catches a link id that belongs elsewhere and lets the response carry the
     * card's remaining dependencies, so the client repaints without a refetch.
     */
    @DeleteMapping("/task/{taskId}/{linkId}")
    public ResponseEntity<ScrumDependencyDto.Response> unlinkFromTask(
            @PathVariable Long taskId,
            @PathVariable Long linkId
    ) {

        return ResponseEntity.ok(service.unlink(taskId, linkId));
    }
}
