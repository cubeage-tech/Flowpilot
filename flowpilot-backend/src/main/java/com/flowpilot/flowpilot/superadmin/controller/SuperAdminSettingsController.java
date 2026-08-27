package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminSettingsDto;
import com.flowpilot.flowpilot.superadmin.service.SuperAdminSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/superadmin/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SuperAdminSettingsController {

    private final SuperAdminSettingsService settingsService;


    /*
     * GET CURRENT SETTINGS
     */
    @GetMapping
    public ResponseEntity<SuperAdminSettingsDto> getSettings() {

        SuperAdminSettingsDto settings =
                new SuperAdminSettingsDto(
                        settingsService.isAutomaticSessionTimeout(),
                        settingsService.getSessionTimeoutMinutes(),
                        settingsService.getMaximumLoginAttempts(),
                        settingsService.isEmailNotifications(),
                        settingsService.isSecurityAlerts(),
                        settingsService.getNotificationEmail()
                );

        return ResponseEntity.ok(settings);
    }


    /*
     * UPDATE SETTINGS
     */
    @PutMapping
    public ResponseEntity<SuperAdminSettingsDto> updateSettings(
            @RequestBody SuperAdminSettingsDto dto
    ) {

        settingsService.updateSettings(
                dto.isAutomaticSessionTimeout(),
                dto.getSessionTimeoutMinutes(),
                dto.getMaximumLoginAttempts(),
                dto.isEmailNotifications(),
                dto.isSecurityAlerts(),
                dto.getNotificationEmail()
        );

        return getSettings();
    }
}