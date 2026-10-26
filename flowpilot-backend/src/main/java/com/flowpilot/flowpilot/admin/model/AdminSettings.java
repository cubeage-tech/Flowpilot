package com.flowpilot.flowpilot.admin.model;

import jakarta.persistence.*;

@Entity
@Table(name = "admin_settings")
public class AdminSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // General Settings
    @Column(nullable = false)
    private String platformName;

    @Column(nullable = false)
    private String timezone;

    @Column(nullable = false)
    private String dateFormat;

    @Column(nullable = false)
    private String language;

    // Security Settings
    @Column(nullable = false)
    private boolean twoFactorAuth;

    @Column(nullable = false)
    private boolean passwordExpiry;

    @Column(nullable = false)
    private boolean sessionTimeout;

    // User Management Settings
    @Column(nullable = false)
    private boolean allowRegistration;

    @Column(nullable = false)
    private boolean requireApproval;

    @Column(nullable = false)
    private boolean allowProfileChanges;

    public AdminSettings() {
    }

    public Long getId() {
        return id;
    }

    public String getPlatformName() {
        return platformName;
    }

    public void setPlatformName(String platformName) {
        this.platformName = platformName;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public boolean isTwoFactorAuth() {
        return twoFactorAuth;
    }

    public void setTwoFactorAuth(boolean twoFactorAuth) {
        this.twoFactorAuth = twoFactorAuth;
    }

    public boolean isPasswordExpiry() {
        return passwordExpiry;
    }

    public void setPasswordExpiry(boolean passwordExpiry) {
        this.passwordExpiry = passwordExpiry;
    }

    public boolean isSessionTimeout() {
        return sessionTimeout;
    }

    public void setSessionTimeout(boolean sessionTimeout) {
        this.sessionTimeout = sessionTimeout;
    }

    public boolean isAllowRegistration() {
        return allowRegistration;
    }

    public void setAllowRegistration(boolean allowRegistration) {
        this.allowRegistration = allowRegistration;
    }

    public boolean isRequireApproval() {
        return requireApproval;
    }

    public void setRequireApproval(boolean requireApproval) {
        this.requireApproval = requireApproval;
    }

    public boolean isAllowProfileChanges() {
        return allowProfileChanges;
    }

    public void setAllowProfileChanges(boolean allowProfileChanges) {
        this.allowProfileChanges = allowProfileChanges;
    }
}