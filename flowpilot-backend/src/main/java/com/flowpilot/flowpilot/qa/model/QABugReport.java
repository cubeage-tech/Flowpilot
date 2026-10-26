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

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "linked_task_id")
    private String linkedTaskId;

    private String environment;

    @Column(nullable = false)
    private String severity;

    @Column(name = "assigned_to")
    private String assignedTo;

    /*
     * =========================================================
     * CREATED BY
     *
     * This is the QA user who FILED the bug.
     *
     * It is different from assignedTo.
     *
     * Example:
     *
     * createdBy = Nishad Fulzele
     * assignedTo = Om Marathe
     *
     * The bug must appear in Nishad's Bug Reports because
     * Nishad created/filed it.
     * =========================================================
     */
    @Column(name = "created_by")
    private String createdBy;

    @Column(
            name = "steps_to_reproduce",
            columnDefinition = "TEXT"
    )
    private String stepsToReproduce;

    @Column(
            name = "screenshot",
            columnDefinition = "TEXT"
    )
    private String screenshot;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public QABugReport() {
    }

    /*
     * =========================================================
     * CREATE DEFAULT VALUES
     * =========================================================
     */

    @PrePersist
    public void onCreate() {

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (status == null ||
                status.isBlank()) {

            status = "Open";
        }
    }

    /*
     * =========================================================
     * ID
     * =========================================================
     */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    /*
     * =========================================================
     * BUG ID
     * =========================================================
     */

    public String getBugId() {
        return bugId;
    }

    public void setBugId(String bugId) {
        this.bugId = bugId;
    }

    /*
     * =========================================================
     * TITLE
     * =========================================================
     */

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    /*
     * =========================================================
     * PROJECT
     * =========================================================
     */

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    /*
     * =========================================================
     * LINKED TASK
     * =========================================================
     */

    public String getLinkedTaskId() {
        return linkedTaskId;
    }

    public void setLinkedTaskId(String linkedTaskId) {
        this.linkedTaskId = linkedTaskId;
    }

    /*
     * =========================================================
     * ENVIRONMENT
     * =========================================================
     */

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    /*
     * =========================================================
     * SEVERITY
     * =========================================================
     */

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    /*
     * =========================================================
     * ASSIGNED TO
     * =========================================================
     */

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    /*
     * =========================================================
     * CREATED BY
     * =========================================================
     */

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    /*
     * =========================================================
     * STEPS TO REPRODUCE
     * =========================================================
     */

    public String getStepsToReproduce() {
        return stepsToReproduce;
    }

    public void setStepsToReproduce(
            String stepsToReproduce) {

        this.stepsToReproduce =
                stepsToReproduce;
    }

    /*
     * =========================================================
     * STATUS
     * =========================================================
     */

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    /*
     * =========================================================
     * CREATED AT
     * =========================================================
     */

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {

        this.createdAt =
                createdAt;
    }

    public String getScreenshot() {
        return screenshot;
    }

    public void setScreenshot(String screenshot) {
        this.screenshot = screenshot;
    }
}