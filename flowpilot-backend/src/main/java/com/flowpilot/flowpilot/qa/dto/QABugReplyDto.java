package com.flowpilot.flowpilot.qa.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QABugReplyDto {

    private Long id;
    private String bugId;
    private Long qaBugReportId;
    private String senderName;
    private String senderRole;
    private String message;
    private LocalDateTime createdAt;
    private String time;
}
