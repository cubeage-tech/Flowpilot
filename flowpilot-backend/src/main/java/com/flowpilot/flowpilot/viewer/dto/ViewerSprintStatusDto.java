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
public class ViewerSprintStatusDto {
    private int activeSprintsCount;
    private int totalTasksCompleted;
    private int totalTasksRemaining;
    private int totalTasks;
    private int overallCompletionRate;
    private int totalStoryPointsCommitted;
    private int totalStoryPointsCompleted;
    private List<ViewerSprintItemDto> sprints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViewerSprintItemDto {
        private Long id;
        private Long projectId;
        private String project;
        private String sprint;
        private Integer sprintNumber;
        private String status;
        private int done;
        private int inProgress;
        private int todo;
        private int totalTasks;
        private int completion;
        private int committedPoints;
        private int completedPoints;
        private int pointsCompletion;
        private String startDate;
        private String endDate;
        private int daysRemaining;
        private String health;
    }
}
