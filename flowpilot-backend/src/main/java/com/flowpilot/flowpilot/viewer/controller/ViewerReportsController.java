package com.flowpilot.flowpilot.viewer.controller;

import com.flowpilot.flowpilot.viewer.dto.ViewerReportDto;
import com.flowpilot.flowpilot.viewer.service.ViewerReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/viewer")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ViewerReportsController {

    private final ViewerReportsService viewerReportsService;

    @GetMapping("/reports")
    public ResponseEntity<ViewerReportDto> getReports() {
        return ResponseEntity.ok(viewerReportsService.getReportsOverview());
    }
}
