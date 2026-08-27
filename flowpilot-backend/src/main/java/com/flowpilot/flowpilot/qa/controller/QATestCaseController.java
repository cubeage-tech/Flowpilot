package com.flowpilot.flowpilot.qa.controller;

import com.flowpilot.flowpilot.qa.model.QATestCase;
import com.flowpilot.flowpilot.qa.service.QATestCaseService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qa/test-cases")
@CrossOrigin(origins = "http://localhost:5173")
public class QATestCaseController {

    private final QATestCaseService testCaseService;

    public QATestCaseController(
            QATestCaseService testCaseService) {

        this.testCaseService = testCaseService;
    }

    /*
     * =========================================================
     * GET ALL TEST CASES
     *
     * Automatically synchronizes new Scrum Master tasks
     * into QA before returning the QA test cases.
     * =========================================================
     */
    @GetMapping
    public ResponseEntity<List<QATestCase>>
    getAllTestCases() {

        return ResponseEntity.ok(
                testCaseService.getAllTestCases()
        );
    }

    /*
     * =========================================================
     * MANUAL SCRUM MASTER → QA SYNC
     *
     * GET:
     * /api/qa/test-cases/sync
     *
     * This does NOT modify Scrum Master tasks.
     * It only creates missing QA test cases.
     * =========================================================
     */
    @GetMapping("/sync")
    public ResponseEntity<Map<String, Object>>
    syncScrumMasterTasks() {

        int created =
                testCaseService.syncScrumMasterTasks();

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "created", created,
                        "message",
                                created +
                                " Scrum Master task(s) synchronized to QA."
                )
        );
    }

    /*
     * =========================================================
     * GET ONE TEST CASE
     *
     * IMPORTANT:
     * This mapping stays after /sync so that
     * /sync is handled correctly.
     * =========================================================
     */
    @GetMapping("/{id}")
    public ResponseEntity<QATestCase>
    getTestCase(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                testCaseService.getTestCase(id)
        );
    }

    /*
     * =========================================================
     * CREATE TEST CASE
     * =========================================================
     */
    @PostMapping
    public ResponseEntity<QATestCase>
    createTestCase(
            @RequestBody QATestCase testCase) {

        QATestCase saved =
                testCaseService.createTestCase(
                        testCase
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    /*
     * =========================================================
     * UPDATE STATUS
     *
     * PUT:
     *
     * /api/qa/test-cases/{id}/status
     *
     * Body:
     *
     * {
     *     "status": "Passed"
     * }
     * =========================================================
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<QATestCase>
    updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (body == null ||
                body.get("status") == null ||
                body.get("status").trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }

        String status =
                body.get("status").trim();

        return ResponseEntity.ok(
                testCaseService.updateStatus(
                        id,
                        status
                )
        );
    }
}