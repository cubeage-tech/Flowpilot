package com.flowpilot.flowpilot.qa.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "qa_test_cases")
public class QATestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "test_id",
            nullable = false,
            unique = true
    )
    private String testId;

    @Column(nullable = false)
    private String title;

    private String type;

    @Column(name = "linked_task")
    private String linkedTask;

    private String priority;

    private String status;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "project")
    private String project;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /*
     * =========================================================
     * SCRUM MASTER TASK CONNECTION
     *
     * Stores the ID of the original Scrum Master task.
     *
     * Example:
     *
     * Scrum task:
     * T-044
     *
     * scrumTaskId:
     * 15
     *
     * This allows QA to know exactly which Scrum Master
     * task this test case belongs to.
     * =========================================================
     */
    @Column(name = "scrum_task_id")
    private Long scrumTaskId;

    /*
     * =========================================================
     * PM PROJECT CONNECTION
     *
     * Stores the ID of the PM project associated with
     * the Scrum Master task / QA test case.
     *
     * Example:
     *
     * projectId = 3
     * =========================================================
     */
    @Column(name = "project_id")
    private Long projectId;

    public QATestCase() {
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

            status = "Pending";
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
     * TEST ID
     * =========================================================
     */

    public String getTestId() {
        return testId;
    }

    public void setTestId(String testId) {
        this.testId = testId;
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
     * TYPE
     * =========================================================
     */

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    /*
     * =========================================================
     * LINKED TASK
     * =========================================================
     */

    public String getLinkedTask() {
        return linkedTask;
    }

    public void setLinkedTask(String linkedTask) {
        this.linkedTask = linkedTask;
    }

    /*
     * =========================================================
     * PRIORITY
     * =========================================================
     */

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
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
     * PROJECT
     * =========================================================
     */

    public String getProject() {
        return project;
    }

    public void setProject(String project) {
        this.project = project;
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

        this.createdAt = createdAt;
    }

    /*
     * =========================================================
     * SCRUM MASTER TASK ID
     * =========================================================
     */

    public Long getScrumTaskId() {
        return scrumTaskId;
    }

    public void setScrumTaskId(
            Long scrumTaskId) {

        this.scrumTaskId = scrumTaskId;
    }

    /*
     * =========================================================
     * PM PROJECT ID
     * =========================================================
     */

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(
            Long projectId) {

        this.projectId = projectId;
    }
}