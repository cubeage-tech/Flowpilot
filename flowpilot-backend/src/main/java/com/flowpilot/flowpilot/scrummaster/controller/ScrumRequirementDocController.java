package com.flowpilot.flowpilot.scrummaster.controller;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumRequirementDocDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumRequirementDocService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scrummaster/requirements")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ScrumRequirementDocController {

    private final ScrumRequirementDocService docService;

    @GetMapping
    public ResponseEntity<List<ScrumRequirementDocDto>> getDocuments(
            @RequestParam(required = false) Long projectId
    ) {
        return ResponseEntity.ok(docService.getDocuments(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScrumRequirementDocDto> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(docService.getDocumentById(id));
    }

    @PostMapping
    public ResponseEntity<ScrumRequirementDocDto> createDocument(
            @RequestBody ScrumRequirementDocDto dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(docService.createDocument(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScrumRequirementDocDto> updateDocument(
            @PathVariable Long id,
            @RequestBody ScrumRequirementDocDto dto
    ) {
        return ResponseEntity.ok(docService.updateDocument(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        docService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
