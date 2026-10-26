package com.flowpilot.flowpilot.developer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeveloperTaskDto {

    private Long id;

    private String taskId;

    private String priority;

    private String title;

    private String details;

    private String status;

    private Integer storyPoints;

    private Long projectId;

    private String projectName;
}