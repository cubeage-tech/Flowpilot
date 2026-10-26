package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.admin.model.AdminSettings;
import com.flowpilot.flowpilot.admin.service.AdminSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
@CrossOrigin(origins = "*")
public class AdminSettingsController {

    private final AdminSettingsService adminSettingsService;

    public AdminSettingsController(AdminSettingsService adminSettingsService) {
        this.adminSettingsService = adminSettingsService;
    }

    @GetMapping
    public ResponseEntity<AdminSettings> getSettings() {
        return ResponseEntity.ok(
                adminSettingsService.getSettings()
        );
    }

    @PutMapping
    public ResponseEntity<AdminSettings> updateSettings(
            @RequestBody AdminSettings settings) {

        return ResponseEntity.ok(
                adminSettingsService.updateSettings(settings)
        );
    }
}