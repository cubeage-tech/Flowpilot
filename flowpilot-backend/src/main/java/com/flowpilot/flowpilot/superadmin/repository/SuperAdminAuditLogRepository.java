package com.flowpilot.flowpilot.superadmin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowpilot.flowpilot.superadmin.model.SuperAdminAuditLog;

public interface SuperAdminAuditLogRepository
        extends JpaRepository<SuperAdminAuditLog, Long> {

    List<SuperAdminAuditLog> findAllByOrderByCreatedAtDesc();
}
