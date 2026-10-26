package com.flowpilot.flowpilot.developer.dto;

import com.flowpilot.flowpilot.qa.dto.QABugReplyDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeveloperMentionDto {

    private Long id;
    private String initials;
    private String name;
    private String task;
    private String message;
    private String time;
    private Boolean unread;

    // Rich bug details added by QA
    private String bugId;
    private String title;
    private Long projectId;
    private String projectName;
    private String linkedTaskId;
    private String environment;
    private String severity;
    private String assignedTo;
    private String createdBy;
    private String stepsToReproduce;
    private String screenshot;
    private String status;
    private LocalDateTime createdAt;
    private List<QABugReplyDto> replies;
}