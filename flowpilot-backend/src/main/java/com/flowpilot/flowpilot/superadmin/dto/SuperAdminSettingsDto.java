package com.flowpilot.flowpilot.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminSettingsDto {

    private boolean automaticSessionTimeout;

    private int sessionTimeoutMinutes;

    private int maximumLoginAttempts;

    private boolean emailNotifications;

    private boolean securityAlerts;

    private String notificationEmail;
}