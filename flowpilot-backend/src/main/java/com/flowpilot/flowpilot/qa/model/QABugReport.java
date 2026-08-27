package com.flowpilot.flowpilot.qa.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "qa_bug_reports")
public class QABugReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bug_id", nullable = false, unique = true)
    private String bugId;

    @Column(nullable = false)
    private String title;

    /* =========================================================
       PROJECT
       Stores the ID of the PM project selected in QA.
    ========================================================= */

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "linked_task_id")
    private String linkedTaskId;

    private String environment;

    @Column(nullable = false)
    private String severity;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "steps_to_reproduce", columnDefinition = "TEXT")
    private String stepsToReproduce;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public QABugReport() {
    }

    /* =========================================================
       CREATE DATE + DEFAULT STATUS
    ========================================================= */

    @PrePersist
    public void onCreate() {

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (status == null || status.isBlank()) {
            status = "Open";
        }
    }

    /* =========================================================
       GETTERS / SETTERS
    ========================================================= */

    public Long getId() {
        return id;
    }

    public String getBugId() {
        return bugId;
    }

    public void setBugId(String bugId) {
        this.bugId = bugId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    /* =========================================================
       PROJECT ID
    ========================================================= */

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getLinkedTaskId() {
        return linkedTaskId;
    }

    public void setLinkedTaskId(String linkedTaskId) {
        this.linkedTaskId = linkedTaskId;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getStepsToReproduce() {
        return stepsToReproduce;
    }

    public void setStepsToReproduce(String stepsToReproduce) {
        this.stepsToReproduce = stepsToReproduce;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}