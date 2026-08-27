package com.flowpilot.flowpilot.scrummaster.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumStandupDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumStandupService;

/**
 * Daily standup endpoints.
 *
 * Errors are left to ScrumExceptionHandler, which already maps validation to
 * 400 and a missing row to 404; catching here would flatten that back out.
 */
@RestController
@RequestMapping("/api/scrummaster/standups")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumStandupController {

    private final ScrumStandupService standupService;


    public ScrumStandupController(ScrumStandupService standupService) {
        this.standupService = standupService;
    }


    // ============================================
    // GET
    // One day of standup. Defaults to the active
    // sprint and to today.
    //
    // GET /api/scrummaster/standups
    // GET /api/scrummaster/standups?date=2026-08-25
    // GET /api/scrummaster/standups?sprintId=3&date=2026-08-25
    // ============================================
    @GetMapping
    public ResponseEntity<ScrumStandupDto.Response> getStandup(
            @RequestParam(required = false) Long sprintId,
            // Pinned to ISO so the query string reads YYYY-MM-DD whatever the
            // server's locale happens to be
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {

        return ResponseEntity.ok(
                standupService.getStandup(sprintId, date)
        );
    }


    // ============================================
    // POST
    // Create or replace one member's entry for a day
    //
    // POST /api/scrummaster/standups
    // POST /api/scrummaster/standups?sprintId=3
    // ============================================
    @PostMapping
    public ResponseEntity<ScrumStandupDto.Entry> saveStandup(
            @RequestBody ScrumStandupDto.SaveRequest request,
            @RequestParam(required = false) Long sprintId
    ) {

        ScrumStandupService.SaveResult result =
                standupService.saveStandup(sprintId, request);

        // 201 only when the entry did not exist before; correcting what was
        // already said is an update, not a new resource
        return ResponseEntity
                .status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(result.entry());
    }


    // ============================================
    // DELETE
    // Remove one entry
    //
    // DELETE /api/scrummaster/standups/{standupId}
    // ============================================
    @DeleteMapping("/{standupId}")
    public ResponseEntity<Map<String, Object>> deleteStandup(
            @PathVariable Long standupId
    ) {

        ScrumStandupDto.Entry removed = standupService.deleteStandup(standupId);

        // User.name is nullable, so fall back to the id rather than telling
        // the user their entry for "null" was deleted
        String who = removed.memberName() == null
                ? "member " + removed.memberId()
                : removed.memberName();

        // LinkedHashMap keeps success ahead of message in the JSON, matching
        // the shape ScrumExceptionHandler returns on the failure path
        Map<String, Object> body = new LinkedHashMap<>();

        body.put("success", true);
        body.put(
                "message",
                "Standup entry for " + who
                        + " on " + removed.standupDate() + " was deleted"
        );

        return ResponseEntity.ok(body);
    }
}
