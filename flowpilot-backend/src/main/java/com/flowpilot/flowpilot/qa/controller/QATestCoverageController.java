package com.flowpilot.flowpilot.qa.controller;

import com.flowpilot.flowpilot.qa.dto.QATestCoverageDto;
import com.flowpilot.flowpilot.qa.service.QATestCoverageService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qa/coverage")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class QATestCoverageController {

    private final QATestCoverageService coverageService;

    @GetMapping
    public ResponseEntity<QATestCoverageDto> getCoverage() {

        return ResponseEntity.ok(
                coverageService.getCoverage()
        );
    }
}