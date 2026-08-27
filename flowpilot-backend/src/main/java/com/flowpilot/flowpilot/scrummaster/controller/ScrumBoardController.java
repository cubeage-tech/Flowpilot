package com.flowpilot.flowpilot.scrummaster.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumBoardDto;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumTaskDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumBoardService;

/**
 * Scrum board endpoints (SRS Module 5).
 *
 * Errors are left to ScrumExceptionHandler: it already maps validation to 400
 * and missing rows to 404, so catching here would only flatten that back out.
 */
@RestController
@RequestMapping("/api/scrummaster/board")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumBoardController {

    private final ScrumBoardService boardService;


    public ScrumBoardController(ScrumBoardService boardService) {
        this.boardService = boardService;
    }


    // ============================================
    // GET
    // The board for the active sprint, or for the
    // sprint chosen in the sprint selector.
    //
    // GET /api/scrummaster/board
    // GET /api/scrummaster/board?sprintId=3
    //     &assigneeId=&priority=&label=&search=&unassigned=
    // ============================================
    @GetMapping
    public ResponseEntity<ScrumBoardDto.Response> getBoard(
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String label,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean unassigned
    ) {

        ScrumBoardService.BoardFilter filter =
                new ScrumBoardService.BoardFilter(
                        assigneeId,
                        priority,
                        label,
                        search,
                        unassigned
                );

        return ResponseEntity.ok(
                boardService.getBoard(sprintId, filter)
        );
    }


    // ============================================
    // PATCH
    // Move one card to another column.
    //
    // PATCH /api/scrummaster/board/tasks/{taskId}/status
    // ============================================
    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<ScrumTaskDto.Card> moveTask(
            @PathVariable Long taskId,
            @RequestBody ScrumBoardDto.MoveRequest request
    ) {

        return ResponseEntity.ok(
                boardService.moveTask(taskId, request)
        );
    }


    // ============================================
    // PUT
    // Set or clear one column's WIP limit and return
    // the board it applies to, so the client repaints
    // from a single round trip.
    //
    // PUT /api/scrummaster/board/wip-limits
    // ============================================
    @PutMapping("/wip-limits")
    public ResponseEntity<ScrumBoardDto.Response> setWipLimit(
            @RequestBody ScrumBoardDto.WipLimitRequest request,
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String label,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean unassigned
    ) {

        // The same filters are accepted here so the refreshed board comes back
        // showing what the user was already looking at
        ScrumBoardService.BoardFilter filter =
                new ScrumBoardService.BoardFilter(
                        assigneeId,
                        priority,
                        label,
                        search,
                        unassigned
                );

        return ResponseEntity.ok(
                boardService.setWipLimit(request, sprintId, filter)
        );
    }


    // ============================================
    // GET
    // Current WIP limits, keyed by column. Columns
    // without a limit are absent.
    //
    // GET /api/scrummaster/board/wip-limits
    // ============================================
    @GetMapping("/wip-limits")
    public ResponseEntity<Map<String, Integer>> getWipLimits() {

        return ResponseEntity.ok(
                boardService.getWipLimits()
        );
    }
}
