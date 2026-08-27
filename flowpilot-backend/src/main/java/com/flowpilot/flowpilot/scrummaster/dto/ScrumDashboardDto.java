package com.flowpilot.flowpilot.scrummaster.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrumDashboardDto {
    private String sprintName;
    private String projectName;
    private Integer daysRemaining;
    private Integer totalDays;
    private Integer tasksCompleted;
    private Integer totalTasks;
    private Integer completionPercentage;
    private Integer activeBlockersCount;
    private String sprintGoal;

    private List<BlockerDto> activeBlockers;
    private List<CeremonyDto> ceremonies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlockerDto {
        private Long id;
        private String raisedBy;
        private String title;
        private String details;
        private String status;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CeremonyDto {
        private Long id;
        private String name;
        private String when;
        private String tone;
        private String status;
    }
}
