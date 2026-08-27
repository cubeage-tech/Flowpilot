package com.flowpilot.flowpilot.scrummaster.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * "This task cannot start until that one is done" (SRS Module 4:
 * "Dependencies").
 *
 * Stored as a directed edge in its own table rather than a column on the task,
 * because a task can wait on several others and be waited on by several more.
 * The unique constraint keeps the same edge from being recorded twice.
 */
@Entity
@Table(
    name = "scrum_task_dependencies",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_scrum_dependency_edge",
        columnNames = { "task_id", "depends_on_task_id", "kind" }
    )
)
public class ScrumTaskDependency {

    /**
     * Why the two tasks are linked. Only BLOCKED_BY stops work: a RELATES_TO
     * edge is context for a reader, and treating it as a blocker would flag
     * cards that are perfectly free to proceed.
     */
    public enum Kind {
        BLOCKED_BY,
        RELATES_TO,
        DUPLICATES
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The task that is waiting. */
    @Column(name = "task_id", nullable = false)
    private Long taskId;

    /** The task it is waiting on. */
    @Column(name = "depends_on_task_id", nullable = false)
    private Long dependsOnTaskId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Kind kind;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ScrumTaskDependency() {
    }

    public ScrumTaskDependency(Long taskId, Long dependsOnTaskId) {
        this.taskId = taskId;
        this.dependsOnTaskId = dependsOnTaskId;
    }

    @PrePersist
    public void beforeSave() {

        if (this.kind == null) {
            this.kind = Kind.BLOCKED_BY;
        }

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public Long getDependsOnTaskId() {
        return dependsOnTaskId;
    }

    public void setDependsOnTaskId(Long dependsOnTaskId) {
        this.dependsOnTaskId = dependsOnTaskId;
    }

    public Kind getKind() {
        return kind;
    }

    public void setKind(Kind kind) {
        this.kind = kind;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
