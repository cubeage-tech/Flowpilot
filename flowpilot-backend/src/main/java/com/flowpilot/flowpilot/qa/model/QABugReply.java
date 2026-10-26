package com.flowpilot.flowpilot.qa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "qa_bug_replies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QABugReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bug_id")
    private String bugId;

    @Column(name = "qa_bug_report_id")
    private Long qaBugReportId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "sender_role")
    private String senderRole; // DEVELOPER, QA_ENGINEER, etc.

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
