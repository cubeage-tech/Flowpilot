package com.flowpilot.flowpilot.developer.controller;

import com.flowpilot.flowpilot.developer.dto.DeveloperMentionDto;
import com.flowpilot.flowpilot.developer.service.DeveloperMentionsService;
import com.flowpilot.flowpilot.qa.dto.QABugReplyDto;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/developer/mentions")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://localhost:3000"
        }
)
public class DeveloperMentionsController {

    private final DeveloperMentionsService developerMentionsService;

    @GetMapping
    public ResponseEntity<List<DeveloperMentionDto>> getAllMentions() {

        return ResponseEntity.ok(
                developerMentionsService.getAllMentions()
        );
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<QABugReplyDto> addReply(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload
    ) {
        String senderName = payload.getOrDefault("senderName", "Developer");
        String senderRole = payload.getOrDefault("senderRole", "DEVELOPER");
        String message = payload.getOrDefault("message", "");

        return ResponseEntity.ok(
                developerMentionsService.addReply(id, senderName, senderRole, message)
        );
    }

    @GetMapping("/{id}/replies")
    public ResponseEntity<List<QABugReplyDto>> getReplies(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                developerMentionsService.getRepliesForBug(id)
        );
    }
}