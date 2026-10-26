package com.flowpilot.flowpilot.scrummaster.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "scrum_requirement_docs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumRequirementDoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(nullable = false)
    private String title;

    @Column(name = "doc_type")
    private String docType; // PRD, BRD, Tech Spec, Architecture, User Stories

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    private String version;

    private String status; // Draft, In Review, Approved

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null || status.isBlank()) {
            status = "Draft";
        }
        if (version == null || version.isBlank()) {
            version = "v1.0";
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
