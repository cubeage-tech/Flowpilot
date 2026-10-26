package com.flowpilot.flowpilot.admin.service;

import com.flowpilot.flowpilot.admin.dto.AdminDashboardDto;
import com.flowpilot.flowpilot.admin.repository.AdminDepartmentsRepository;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final SuperAdminUserRepository userRepository;
    private final AdminDepartmentsRepository departmentRepository;

    public AdminDashboardDto getDashboardData() {
        List<SuperAdminUser> users = userRepository.findAll();

        long activeUsers = users.stream()
                .filter(user -> Boolean.TRUE.equals(user.getActive()) || "ACTIVE".equalsIgnoreCase(user.getStatus()))
                .count();

        long departments = departmentRepository.count();
        long openTickets = 0;
        long pendingApprovals = 0;

        Map<String, Long> roleCounts = new LinkedHashMap<>();
        for (SuperAdminUser user : users) {
            String role = (user.getRole() == null || user.getRole().isBlank())
                    ? "Others"
                    : normalizeRole(user.getRole());
            roleCounts.put(role, roleCounts.getOrDefault(role, 0L) + 1);
        }

        List<AdminDashboardDto.RoleDistributionDto> roleDistribution = new ArrayList<>();
        String[] roleOrder = {
                "Developer", "QA Engineer", "Project Manager", "Scrum Master",
                "Admin", "Viewer", "Super Admin", "Others"
        };

        for (String role : roleOrder) {
            long count = roleCounts.getOrDefault(role, 0L);
            if (count > 0) {
                roleDistribution.add(AdminDashboardDto.RoleDistributionDto.builder()
                        .role(role)
                        .count(count)
                        .build());
            }
        }

        List<AdminDashboardDto.ActivityDto> activities = buildRecentActivities(users);

        return AdminDashboardDto.builder()
                .activeUsers(activeUsers)
                .departments(departments)
                .openTickets(openTickets)
                .pendingApprovals(pendingApprovals)
                .activities(activities)
                .roleDistribution(roleDistribution)
                .build();
    }

    private List<AdminDashboardDto.ActivityDto> buildRecentActivities(List<SuperAdminUser> users) {
        List<AdminDashboardDto.ActivityDto> activities = new ArrayList<>();

        users.stream()
                .filter(user -> user.getCreatedAt() != null)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .forEach(user -> {
                    String userName = (user.getName() != null && !user.getName().isBlank()) ? user.getName() : "User";
                    String role = (user.getRole() != null && !user.getRole().isBlank()) ? user.getRole() : "User";
                    activities.add(AdminDashboardDto.ActivityDto.builder()
                            .text("New user " + userName + " added as " + role)
                            .time(formatRelativeTime(user.getCreatedAt()))
                            .type("USER")
                            .build());
                });

        return activities;
    }

    private String formatRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        Duration duration = Duration.between(dateTime, LocalDateTime.now());
        long minutes = duration.toMinutes();
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + "m ago";

        long hours = duration.toHours();
        if (hours < 24) return hours + "h ago";

        long days = duration.toDays();
        if (days == 1) return "Yesterday";
        if (days < 7) return days + " days ago";

        return (days / 7) + " weeks ago";
    }

    private String normalizeRole(String role) {
        String normalized = role.trim().toLowerCase().replace("_", " ").replace("-", " ");
        return switch (normalized) {
            case "developer" -> "Developer";
            case "qa", "qa engineer", "quality assurance", "quality assurance engineer" -> "QA Engineer";
            case "project manager", "pm" -> "Project Manager";
            case "scrum master", "scrum" -> "Scrum Master";
            case "admin" -> "Admin";
            case "viewer" -> "Viewer";
            case "super admin", "superadmin" -> "Super Admin";
            default -> "Others";
        };
    }
}
