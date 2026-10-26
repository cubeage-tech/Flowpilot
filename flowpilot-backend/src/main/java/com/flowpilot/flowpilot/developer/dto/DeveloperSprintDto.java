package com.flowpilot.flowpilot.developer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeveloperSprintDto {

    private Long sprintId;
    private String sprintName;
    private Long projectId;
    private String projectName;

    // Progress metrics specifically for the authenticated developer's highlighted tasks:
    private Integer myTasksTotal;
    private Integer myTasksCompleted;
    private Integer myTasksInProgress;
    private Integer myTasksToDo;
    private Integer myTasksPoints;
    private Integer myTasksCompletedPoints;
    private Integer myProgressPercent;

    private List<SprintColumnDto> columns;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintColumnDto {

        private String title;
        private Integer count;
        private List<SprintCardDto> cards;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintCardDto {

        private Long databaseId;
        private String id;
        private String title;
        private String member;
        private String assigneeName;
        private Integer points;
        private String status;
        private String priority;
        private Boolean isMyTask;
        private Boolean completed;
    }
}