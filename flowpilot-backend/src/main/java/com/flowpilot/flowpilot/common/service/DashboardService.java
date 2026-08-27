package com.flowpilot.flowpilot.common.service;

import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SuperAdminUserRepository superAdminUserRepository;

    // =========================================================
    // SUPER ADMIN DASHBOARD
    // =========================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getSuperAdminDashboard() {

        List<SuperAdminUser> users =
                superAdminUserRepository.findAll();

        // -----------------------------------------------------
        // TOTAL USERS
        // -----------------------------------------------------

        long totalUsers = users.size();

        // -----------------------------------------------------
        // DEPARTMENTS
        // -----------------------------------------------------
        // Departments are currently not implemented as a
        // separate model, so we count unique departments
        // assigned to Super Admin users.

        long departments = users.stream()
                .map(SuperAdminUser::getDepartment)
                .filter(department ->
                        department != null &&
                        !department.isBlank()
                )
                .map(String::trim)
                .distinct()
                .count();

        // -----------------------------------------------------
        // ACTIVE PROJECTS
        // -----------------------------------------------------
        // Project model/repository is currently empty.
        // Therefore we do not invent project data.

        long activeProjects = 0;

        // -----------------------------------------------------
        // RECENT USER REGISTRATIONS
        // -----------------------------------------------------

        List<Map<String, Object>> recentUsers =
                users.stream()
                        .filter(user ->
                                user.getCreatedAt() != null
                        )
                        .sorted(
                                Comparator.comparing(
                                        SuperAdminUser::getCreatedAt
                                ).reversed()
                        )
                        .limit(5)
                        .map(this::convertRecentUser)
                        .toList();

        // -----------------------------------------------------
        // SYSTEM UPTIME
        // -----------------------------------------------------
        // There is currently no uptime monitoring system in
        // the project, so we return "N/A" instead of inventing
        // a percentage.

        String systemUptime = "N/A";

        // -----------------------------------------------------
        // DATABASE HEALTH
        // -----------------------------------------------------

        boolean databaseHealthy;

        try {
            superAdminUserRepository.count();
            databaseHealthy = true;
        } catch (Exception exception) {
            databaseHealthy = false;
        }

        Map<String, Object> databaseHealth =
                createHealth(
                        "Database",
                        databaseHealthy
                );

        // -----------------------------------------------------
        // RESPONSE
        // -----------------------------------------------------

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "totalUsers",
                totalUsers
        );

        response.put(
                "departments",
                departments
        );

        response.put(
                "activeProjects",
                activeProjects
        );

        response.put(
                "systemUptime",
                systemUptime
        );

        response.put(
                "recentUsers",
                recentUsers
        );

        response.put(
                "systemHealth",
                List.of(databaseHealth)
        );

        return response;
    }

    // =========================================================
    // RECENT USER CONVERSION
    // =========================================================

    private Map<String, Object> convertRecentUser(
            SuperAdminUser user
    ) {

        Map<String, Object> recentUser =
                new LinkedHashMap<>();

        recentUser.put(
                "name",
                user.getName()
        );

        recentUser.put(
                "role",
                user.getRole()
        );

        recentUser.put(
                "department",
                user.getDepartment()
        );

        recentUser.put(
                "createdAt",
                user.getCreatedAt()
        );

        return recentUser;
    }

    // =========================================================
    // HEALTH RESPONSE
    // =========================================================

    private Map<String, Object> createHealth(
            String name,
            boolean healthy
    ) {

        Map<String, Object> health =
                new LinkedHashMap<>();

        health.put(
                "name",
                name
        );

        health.put(
                "status",
                healthy ? "UP" : "DOWN"
        );

        return health;
    }
}