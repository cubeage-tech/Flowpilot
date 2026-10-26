package com.flowpilot.flowpilot.viewer.controller;

import com.flowpilot.flowpilot.viewer.dto.ViewerSprintStatusDto;
import com.flowpilot.flowpilot.viewer.service.ViewerSprintStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/viewer")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ViewerSprintStatusController {

    private final ViewerSprintStatusService viewerSprintStatusService;

    @GetMapping("/sprint-status")
    public ResponseEntity<ViewerSprintStatusDto> getSprintStatus() {
        return ResponseEntity.ok(viewerSprintStatusService.getSprintStatusOverview());
    }

    @GetMapping("/sprints")
    public ResponseEntity<List<ViewerSprintStatusDto.ViewerSprintItemDto>> getSprints() {
        return ResponseEntity.ok(viewerSprintStatusService.getSprintStatusOverview().getSprints());
    }
}
