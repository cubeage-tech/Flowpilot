package com.flowpilot.flowpilot.admin.repository;

import com.flowpilot.flowpilot.admin.model.AdminSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminSettingsRepository extends JpaRepository<AdminSettings, Long> {
}
