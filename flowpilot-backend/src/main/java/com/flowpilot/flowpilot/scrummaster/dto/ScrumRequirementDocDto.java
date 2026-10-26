package com.flowpilot.flowpilot.scrummaster.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumRequirementDocDto {

    private Long id;
    private Long projectId;
    private String projectName;
    private String title;
    private String docType;
    private String content;
    private String fileUrl;
    private String version;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
