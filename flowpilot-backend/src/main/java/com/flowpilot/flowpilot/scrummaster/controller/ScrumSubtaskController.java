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

import com.flowpilot.flowpilot.scrummaster.dto.ScrumSubtaskDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumSubtaskService;

@RestController
@RequestMapping("/api/scrummaster/subtasks")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumSubtaskController {

    private final ScrumSubtaskService subtaskService;

    public ScrumSubtaskController(ScrumSubtaskService subtaskService) {
        this.subtaskService = subtaskService;
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<ScrumSubtaskDto.Item>> getSubtasks(@PathVariable Long taskId) {
        return ResponseEntity.ok(subtaskService.listSubtasks(taskId));
    }

    @PostMapping("/task/{taskId}")
    public ResponseEntity<ScrumSubtaskDto.Item> createSubtask(
            @PathVariable Long taskId,
            @RequestBody ScrumSubtaskDto.CreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subtaskService.createSubtask(taskId, request));
    }

    @PatchMapping("/{subtaskId}")
    public ResponseEntity<ScrumSubtaskDto.Item> updateSubtask(
            @PathVariable Long subtaskId,
            @RequestBody ScrumSubtaskDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(subtaskService.updateSubtask(subtaskId, request));
    }

    @PatchMapping("/{subtaskId}/toggle")
    public ResponseEntity<ScrumSubtaskDto.Item> toggleSubtask(@PathVariable Long subtaskId) {
        return ResponseEntity.ok(subtaskService.toggleSubtask(subtaskId));
    }

    @DeleteMapping("/{subtaskId}")
    public ResponseEntity<Map<String, Object>> deleteSubtask(@PathVariable Long subtaskId) {
        ScrumSubtaskDto.Item deleted = subtaskService.deleteSubtask(subtaskId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("message", "Subtask " + deleted.id() + " deleted");
        return ResponseEntity.ok(body);
    }
}
