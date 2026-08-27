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
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumTaskDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumTaskService;

/**
 * Task management endpoints, SRS Module 4.
 *
 * No try/catch here on purpose: ScrumExceptionHandler turns the module's two
 * exceptions into 400 and 404, so swallowing them locally would only flatten
 * every failure back into one status code.
 */
@RestController
@RequestMapping("/api/scrummaster/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumTaskController {

    private final ScrumTaskService taskService;


    public ScrumTaskController(ScrumTaskService taskService) {
        this.taskService = taskService;
    }


    // ============================================
    // GET
    // Every task, in key order
    //
    // GET /api/scrummaster/tasks
    // ============================================
    @GetMapping
    public ResponseEntity<List<ScrumTaskDto.Card>> getTasks() {

        return ResponseEntity.ok(taskService.listTasks());
    }


    // ============================================
    // GET
    // People a task can be assigned to
    //
    // GET /api/scrummaster/tasks/members
    // ============================================
    @GetMapping("/members")
    public ResponseEntity<List<ScrumTaskDto.Member>> getMembers() {

        return ResponseEntity.ok(taskService.listMembers());
    }


    // ============================================
    // GET
    // Backlog — tasks not in any sprint
    //
    // GET /api/scrummaster/tasks/backlog
    // ============================================
    @GetMapping("/backlog")
    public ResponseEntity<List<ScrumTaskDto.Card>> getBacklog() {

        return ResponseEntity.ok(taskService.listBacklog());
    }


    // ============================================
    // POST
    // Create a task
    //
    // POST /api/scrummaster/tasks
    // ============================================
    @PostMapping
    public ResponseEntity<ScrumTaskDto.Card> createTask(
            @RequestBody ScrumTaskDto.CreateRequest request
    ) {

        ScrumTaskDto.Card created = taskService.createTask(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }


    // ============================================
    // PATCH
    // Update only the fields that were sent
    //
    // PATCH /api/scrummaster/tasks/{taskId}
    // ============================================
    @PatchMapping("/{taskId}")
    public ResponseEntity<ScrumTaskDto.Card> updateTask(
            @PathVariable Long taskId,
            @RequestBody ScrumTaskDto.UpdateRequest request
    ) {

        return ResponseEntity.ok(
                taskService.updateTask(taskId, request)
        );
    }


    // ============================================
    // POST
    // Duplicate a task into the backlog
    //
    // POST /api/scrummaster/tasks/{taskId}/clone
    // ============================================
    @PostMapping("/{taskId}/clone")
    public ResponseEntity<ScrumTaskDto.Card> cloneTask(
            @PathVariable Long taskId
    ) {

        ScrumTaskDto.Card clone = taskService.cloneTask(taskId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(clone);
    }


    // ============================================
    // DELETE
    // Remove a task
    //
    // DELETE /api/scrummaster/tasks/{taskId}
    // ============================================
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Map<String, Object>> deleteTask(
            @PathVariable Long taskId
    ) {

        ScrumTaskDto.Card deleted = taskService.deleteTask(taskId);

        // LinkedHashMap keeps success ahead of message in the JSON, matching
        // the shape ScrumExceptionHandler returns on the failure path
        Map<String, Object> body = new LinkedHashMap<>();

        body.put("success", true);
        body.put(
                "message",
                "Task " + deleted.taskKey() + " was deleted"
        );

        return ResponseEntity.ok(body);
    }
}
