package com.flowpilot.flowpilot.common.service;

import com.flowpilot.flowpilot.admin.repository.AdminDepartmentsRepository;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SuperAdminUserRepository superAdminUserRepository;
    private final AdminDepartmentsRepository departmentRepository;
    private final PMProjectsRepository projectRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getSuperAdminDashboard() {
        List<SuperAdminUser> users = superAdminUserRepository.findAll();
        long totalUsers = users.size();

        long deptCount = departmentRepository.count();
        if (deptCount == 0) {
            deptCount = users.stream()
                    .map(SuperAdminUser::getDepartment)
                    .filter(dept -> dept != null && !dept.isBlank())
                    .map(String::trim)
                    .distinct()
                    .count();
        }

        long activeProjects = projectRepository.count();

        List<Map<String, Object>> recentUsers = users.stream()
                .filter(user -> user.getCreatedAt() != null)
                .sorted(Comparator.comparing(SuperAdminUser::getCreatedAt).reversed())
                .limit(5)
                .map(this::convertRecentUser)
                .toList();

        boolean databaseHealthy;
        try {
            superAdminUserRepository.count();
            databaseHealthy = true;
        } catch (Exception ex) {
            databaseHealthy = false;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalUsers", totalUsers);
        response.put("departments", deptCount);
        response.put("activeProjects", activeProjects);
        response.put("systemUptime", "99.98%");
        response.put("recentUsers", recentUsers);
        response.put("systemHealth", List.of(Map.of("name", "Database", "status", databaseHealthy ? "UP" : "DOWN")));

        return response;
    }

    private Map<String, Object> convertRecentUser(SuperAdminUser user) {
        Map<String, Object> recentUser = new LinkedHashMap<>();
        recentUser.put("name", user.getName() != null ? user.getName() : "User");
        recentUser.put("role", user.getRole() != null ? user.getRole() : "Member");
        recentUser.put("department", user.getDepartment() != null ? user.getDepartment() : "General");
        recentUser.put("createdAt", user.getCreatedAt());
        return recentUser;
    }
}
