package com.flowpilot.flowpilot.admin.service;

import com.flowpilot.flowpilot.admin.model.AdminSettings;
import com.flowpilot.flowpilot.admin.repository.AdminSettingsRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminSettingsService {

    private final AdminSettingsRepository adminSettingsRepository;

    public AdminSettingsService(AdminSettingsRepository adminSettingsRepository) {
        this.adminSettingsRepository = adminSettingsRepository;
    }

    public AdminSettings getSettings() {

        return adminSettingsRepository.findAll()
                .stream()
                .findFirst()
                .orElseGet(this::createDefaultSettings);
    }

    public AdminSettings updateSettings(AdminSettings settings) {

        AdminSettings existingSettings = adminSettingsRepository.findAll()
                .stream()
                .findFirst()
                .orElse(new AdminSettings());

        existingSettings.setPlatformName(settings.getPlatformName());
        existingSettings.setTimezone(settings.getTimezone());
        existingSettings.setDateFormat(settings.getDateFormat());
        existingSettings.setLanguage(settings.getLanguage());

        existingSettings.setTwoFactorAuth(settings.isTwoFactorAuth());
        existingSettings.setPasswordExpiry(settings.isPasswordExpiry());
        existingSettings.setSessionTimeout(settings.isSessionTimeout());

        existingSettings.setAllowRegistration(settings.isAllowRegistration());
        existingSettings.setRequireApproval(settings.isRequireApproval());
        existingSettings.setAllowProfileChanges(settings.isAllowProfileChanges());

        return adminSettingsRepository.save(existingSettings);
    }

    private AdminSettings createDefaultSettings() {

        AdminSettings settings = new AdminSettings();

        settings.setPlatformName("IPMT Platform");
        settings.setTimezone("Asia/Kolkata");
        settings.setDateFormat("DD/MM/YYYY");
        settings.setLanguage("English");

        settings.setTwoFactorAuth(true);
        settings.setPasswordExpiry(true);
        settings.setSessionTimeout(true);

        settings.setAllowRegistration(false);
        settings.setRequireApproval(true);
        settings.setAllowProfileChanges(true);

        return adminSettingsRepository.save(settings);
    }
}