package com.flowpilot.flowpilot.scrummaster.controller;

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

import com.flowpilot.flowpilot.scrummaster.dto.ScrumCommentDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumCommentService;

@RestController
@RequestMapping("/api/scrummaster/comments")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumCommentController {

    private final ScrumCommentService service;

    public ScrumCommentController(ScrumCommentService service) {
        this.service = service;
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<ScrumCommentDto.Comment>> listForTask(
            @PathVariable Long taskId) {

        return ResponseEntity.ok(service.listForTask(taskId));
    }

    @PostMapping("/task/{taskId}")
    public ResponseEntity<ScrumCommentDto.Comment> add(
            @PathVariable Long taskId,
            @RequestBody ScrumCommentDto.CreateRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.add(taskId, request));
    }

    @PatchMapping("/{commentId}")
    public ResponseEntity<ScrumCommentDto.Comment> edit(
            @PathVariable Long commentId,
            @RequestBody ScrumCommentDto.UpdateRequest request
    ) {

        return ResponseEntity.ok(service.edit(commentId, request));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long commentId) {

        service.delete(commentId);

        return ResponseEntity.ok(Map.of("success", true, "message", "Comment deleted"));
    }
}
