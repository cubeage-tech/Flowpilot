package com.flowpilot.flowpilot.developer.controller;

import com.flowpilot.flowpilot.developer.dto.DeveloperSprintDto;
import com.flowpilot.flowpilot.developer.service.DeveloperSprintBoardService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/developer/sprint-board")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DeveloperSprintBoardController {

    private final DeveloperSprintBoardService developerSprintBoardService;

    public record MoveStatusRequest(String status) {}

    @GetMapping
    public ResponseEntity<DeveloperSprintDto> getSprintBoard(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) String developerName
    ) {

        return ResponseEntity.ok(
                developerSprintBoardService.getSprintBoard(projectId, sprintId, developerName)
        );
    }

    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<Void> moveTask(
            @PathVariable Long taskId,
            @RequestBody MoveStatusRequest request
    ) {
        developerSprintBoardService.moveTask(taskId, request.status());
        return ResponseEntity.ok().build();
    }
}