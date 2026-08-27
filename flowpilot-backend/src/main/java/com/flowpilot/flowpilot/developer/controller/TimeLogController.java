package com.flowpilot.flowpilot.developer.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.developer.dto.DeveloperTimeLogDto;
import com.flowpilot.flowpilot.developer.service.TimeLogService;

@RestController
@RequestMapping("/api/developer/time-logs")
@CrossOrigin(origins = "http://localhost:5173")
public class TimeLogController {

    private final TimeLogService timeLogService;


    public TimeLogController(TimeLogService timeLogService) {
        this.timeLogService = timeLogService;
    }


    // ============================================
    // POST
    // Save a new time log
    //
    // POST /api/developer/time-logs
    // ============================================
    @PostMapping
    public ResponseEntity<?> createTimeLog(
            @RequestBody DeveloperTimeLogDto.CreateRequest request
    ) {

        try {

            DeveloperTimeLogDto.Response response =
                    timeLogService.createTimeLog(request);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            new ErrorResponse(
                                    exception.getMessage()
                            )
                    );
        }
    }


    // ============================================
    // GET
    // Get all time log history
    // + this week's total hours
    //
    // GET /api/developer/time-logs
    // ============================================
    @GetMapping
    public ResponseEntity<?> 
    getTimeLogHistory() {

        try {
            DeveloperTimeLogDto.HistoryResponse response =
                    timeLogService.getTimeLogHistory();

            return ResponseEntity.ok(response);
        } catch (RuntimeException exception) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse(
                            "Time log history is temporarily unavailable"
                    ));
        }
    }


    // ============================================
    // ERROR RESPONSE
    // ============================================
    private static class ErrorResponse {

        private final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}