package com.flowpilot.flowpilot.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {

    private long activeUsers;

    private long departments;

    private long openTickets;

    private long pendingApprovals;

    private List<ActivityDto> activities;

    private List<RoleDistributionDto> roleDistribution;


    // =========================================================
    // RECENT ACTIVITY
    // =========================================================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDto {

        private String text;

        private String time;

        private String type;
    }


    // =========================================================
    // ROLE DISTRIBUTION
    // =========================================================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDistributionDto {

        private String role;

        private long count;
    }
}