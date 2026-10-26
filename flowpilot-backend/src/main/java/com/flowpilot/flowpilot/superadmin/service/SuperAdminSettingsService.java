package com.flowpilot.flowpilot.superadmin.service;

import org.springframework.stereotype.Service;

@Service
public class SuperAdminSettingsService {

    /*
     * TESTING MODE
     *
     * Keep this at 1 minute while testing.
     *
     * After testing, change it back to:
     * 30 minutes
     */
    private int sessionTimeoutMinutes = 1;

    /*
     * Automatic session timeout enabled/disabled
     */
    private boolean automaticSessionTimeout = true;

    /*
     * Maximum failed login attempts before security alert
     */
    private int maximumLoginAttempts = 3;

    /*
     * Email notifications
     */
    private boolean emailNotifications = true;

    /*
     * Security alerts
     */
    private boolean securityAlerts = true;

    /*
     * Email address that receives security alerts
     */
    private String notificationEmail = "admin@flowpilot.com";


    public int getSessionTimeoutMinutes() {
        return sessionTimeoutMinutes;
    }

    public void setSessionTimeoutMinutes(int sessionTimeoutMinutes) {
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }


    public boolean isAutomaticSessionTimeout() {
        return automaticSessionTimeout;
    }

    public void setAutomaticSessionTimeout(boolean automaticSessionTimeout) {
        this.automaticSessionTimeout = automaticSessionTimeout;
    }


    public int getMaximumLoginAttempts() {
        return maximumLoginAttempts;
    }

    public void setMaximumLoginAttempts(int maximumLoginAttempts) {
        this.maximumLoginAttempts = maximumLoginAttempts;
    }


    public boolean isEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }


    public boolean isSecurityAlerts() {
        return securityAlerts;
    }

    public void setSecurityAlerts(boolean securityAlerts) {
        this.securityAlerts = securityAlerts;
    }


    public String getNotificationEmail() {
        return notificationEmail;
    }

    public void setNotificationEmail(String notificationEmail) {
        this.notificationEmail = notificationEmail;
    }


    /*
     * Update all settings
     */
    public void updateSettings(
            Boolean automaticSessionTimeout,
            Integer sessionTimeoutMinutes,
            Integer maximumLoginAttempts,
            Boolean emailNotifications,
            Boolean securityAlerts,
            String notificationEmail
    ) {

        if (automaticSessionTimeout != null) {
            this.automaticSessionTimeout = automaticSessionTimeout;
        }

        if (sessionTimeoutMinutes != null) {
            this.sessionTimeoutMinutes = sessionTimeoutMinutes;
        }

        if (maximumLoginAttempts != null) {
            this.maximumLoginAttempts = maximumLoginAttempts;
        }

        if (emailNotifications != null) {
            this.emailNotifications = emailNotifications;
        }

        if (securityAlerts != null) {
            this.securityAlerts = securityAlerts;
        }

        if (notificationEmail != null && !notificationEmail.isBlank()) {
            this.notificationEmail = notificationEmail;
        }
    }
}
