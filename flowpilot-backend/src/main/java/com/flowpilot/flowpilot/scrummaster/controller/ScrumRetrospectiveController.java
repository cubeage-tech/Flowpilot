package com.flowpilot.flowpilot.scrummaster.controller;

import java.util.LinkedHashMap;
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

import com.flowpilot.flowpilot.scrummaster.dto.ScrumRetrospectiveDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumRetrospectiveService;

/**
 * Sprint retrospective endpoints.
 *
 * Errors are left to ScrumExceptionHandler, which already maps validation to
 * 400 and a missing row to 404; catching here would flatten that back out.
 */
@RestController
@RequestMapping("/api/scrummaster/retrospective")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumRetrospectiveController {

    private final ScrumRetrospectiveService retrospectiveService;


    public ScrumRetrospectiveController(
            ScrumRetrospectiveService retrospectiveService
    ) {
        this.retrospectiveService = retrospectiveService;
    }


    // ============================================
    // GET
    // The retro board for the active sprint, or for
    // any sprint chosen in the selector — including
    // a completed one, which is the usual case.
    //
    // GET /api/scrummaster/retrospective
    // GET /api/scrummaster/retrospective?sprintId=3
    // ============================================
    @GetMapping
    public ResponseEntity<ScrumRetrospectiveDto.Response> getRetrospective(
            @RequestParam(required = false) Long sprintId
    ) {

        return ResponseEntity.ok(
                retrospectiveService.getRetrospective(sprintId)
        );
    }


    // ============================================
    // POST
    // Add one note or action item
    //
    // POST /api/scrummaster/retrospective
    // POST /api/scrummaster/retrospective?sprintId=3
    // ============================================
    @PostMapping
    public ResponseEntity<ScrumRetrospectiveDto.Item> createItem(
            @RequestBody ScrumRetrospectiveDto.CreateRequest request,
            @RequestParam(required = false) Long sprintId
    ) {

        ScrumRetrospectiveDto.Item created =
                retrospectiveService.createItem(sprintId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }


    // ============================================
    // PATCH
    // Update only the fields that were sent
    //
    // PATCH /api/scrummaster/retrospective/{itemId}
    // ============================================
    @PatchMapping("/{itemId}")
    public ResponseEntity<ScrumRetrospectiveDto.Item> updateItem(
            @PathVariable Long itemId,
            @RequestBody ScrumRetrospectiveDto.UpdateRequest request
    ) {

        return ResponseEntity.ok(
                retrospectiveService.updateItem(itemId, request)
        );
    }


    // ============================================
    // DELETE
    // Remove one item
    //
    // DELETE /api/scrummaster/retrospective/{itemId}
    // ============================================
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> deleteItem(
            @PathVariable Long itemId
    ) {

        ScrumRetrospectiveDto.Item removed =
                retrospectiveService.deleteItem(itemId);

        // LinkedHashMap keeps success ahead of message in the JSON, matching
        // the shape ScrumExceptionHandler returns on the failure path
        Map<String, Object> body = new LinkedHashMap<>();

        body.put("success", true);
        body.put(
                "message",
                "Retrospective item " + removed.id() + " was deleted"
        );

        return ResponseEntity.ok(body);
    }
}
