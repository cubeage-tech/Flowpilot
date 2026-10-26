package com.flowpilot.flowpilot.developer.controller;

import com.flowpilot.flowpilot.developer.dto.DeveloperTaskDto;
import com.flowpilot.flowpilot.developer.service.DeveloperTasksService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/developer/tasks")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://localhost:3000"
        }
)
public class DeveloperTasksController {

    private final DeveloperTasksService developerTasksService;


    /*
     * ==========================================
     * GET CURRENT DEVELOPER'S REAL TASKS
     *
     * GET /api/developer/tasks
     * ==========================================
     */
    @GetMapping
    public ResponseEntity<List<DeveloperTaskDto>>
            getMyTasks() {

        return ResponseEntity.ok(
                developerTasksService.getMyTasks()
        );
    }
}