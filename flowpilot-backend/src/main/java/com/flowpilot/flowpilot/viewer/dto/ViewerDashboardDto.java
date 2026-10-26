package com.flowpilot.flowpilot.viewer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViewerDashboardDto {
    private int totalProjects;
    private int activeProjects;
    private int atRiskProjects;
    private int completedProjects;
    private int totalSprints;
    private int activeSprints;
    private int totalStoryPoints;
    private int completedStoryPoints;
    private int totalTasks;
    private int completedTasks;
    private int overallProgress;
    private int totalTeamMembers;
    private List<ViewerProjectCardDto> projects;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViewerProjectCardDto {
        private Long id;
        private String projectCode;
        private String projectName;
        private String pm;
        private String sprint;
        private int progress;
        private String status;
        private int tasksTotal;
        private int tasksCompleted;
        private int storyPointsTotal;
        private int storyPointsCompleted;
        private int memberCount;
        private List<String> memberNames;
    }
}
