package com.flowpilot.flowpilot.qa.controller;

import com.flowpilot.flowpilot.qa.model.QABugReport;
import com.flowpilot.flowpilot.qa.service.QABugReportsService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/qa/bugs")
@CrossOrigin(origins = "http://localhost:5173")
public class QABugReportsController {

    private final QABugReportsService bugReportsService;

    public QABugReportsController(
            QABugReportsService bugReportsService) {

        this.bugReportsService =
                bugReportsService;
    }

    /*
     * =========================================================
     * GET ALL BUGS
     *
     * Kept for existing QA functionality.
     * =========================================================
     */
    @GetMapping
    public ResponseEntity<List<QABugReport>>
    getAllBugs() {

        return ResponseEntity.ok(
                bugReportsService.getAllBugs()
        );
    }

    /*
     * =========================================================
     * GET BUGS CREATED BY USER
     *
     * Example:
     *
     * /api/qa/bugs/by-creator?createdBy=Nishad%20Fulzele
     *
     * =========================================================
     */
    @GetMapping("/by-creator")
    public ResponseEntity<List<QABugReport>>
    getBugsCreatedBy(
            @RequestParam String createdBy) {

        return ResponseEntity.ok(
                bugReportsService
                        .getBugsCreatedBy(
                                createdBy
                        )
        );
    }

    /*
     * =========================================================
     * CREATE BUG
     * =========================================================
     */
    @PostMapping
    public ResponseEntity<QABugReport>
    createBug(
            @RequestBody QABugReport bug) {

        QABugReport savedBug =
                bugReportsService.createBug(
                        bug
                );

        return ResponseEntity.ok(
                savedBug
        );
    }

    /*
     * =========================================================
     * GET REPLIES FOR BUG
     * =========================================================
     */
    @GetMapping("/{id}/replies")
    public ResponseEntity<List<com.flowpilot.flowpilot.qa.dto.QABugReplyDto>>
    getReplies(@PathVariable Long id) {

        return ResponseEntity.ok(
                bugReportsService.getReplies(id)
        );
    }

    /*
     * =========================================================
     * ADD REPLY TO BUG (QA OR DEVELOPER)
     * =========================================================
     */
    @PostMapping("/{id}/replies")
    public ResponseEntity<com.flowpilot.flowpilot.qa.dto.QABugReplyDto>
    addReply(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload
    ) {
        String senderName = payload.getOrDefault("senderName", "QA Engineer");
        String senderRole = payload.getOrDefault("senderRole", "QA_ENGINEER");
        String message = payload.getOrDefault("message", "");

        return ResponseEntity.ok(
                bugReportsService.addReply(id, senderName, senderRole, message)
        );
    }
}