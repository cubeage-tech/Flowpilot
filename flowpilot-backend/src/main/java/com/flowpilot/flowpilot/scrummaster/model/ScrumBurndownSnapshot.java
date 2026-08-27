package com.flowpilot.flowpilot.scrummaster.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * One row per sprint per day, recording how much work was outstanding.
 *
 * This exists because burndown history cannot be reconstructed from current
 * state: once a task is marked done, yesterday's remaining total is gone.
 * `totalPoints` is stored alongside `remainingPoints` so scope changes are
 * visible, which is what turns a burndown into a burnup.
 */
@Entity
@Table(
    name = "scrum_burndown_snapshots",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_scrum_snapshot_sprint_day",
        columnNames = { "sprint_id", "snapshot_date" }
    )
)
public class ScrumBurndownSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sprint_id", nullable = false)
    private Long sprintId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    /** Points not yet done at the moment of capture. */
    @Column(name = "remaining_points", nullable = false)
    private Integer remainingPoints;

    /** Points completed so far — the burnup line. */
    @Column(name = "completed_points", nullable = false)
    private Integer completedPoints;

    /** Total points in the sprint, which grows if scope is added. */
    @Column(name = "total_points", nullable = false)
    private Integer totalPoints;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ScrumBurndownSnapshot() {
    }

    @PrePersist
    public void beforeSave() {

        if (this.snapshotDate == null) {
            this.snapshotDate = LocalDate.now();
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

    public Long getSprintId() {
        return sprintId;
    }

    public void setSprintId(Long sprintId) {
        this.sprintId = sprintId;
    }

    public LocalDate getSnapshotDate() {
        return snapshotDate;
    }

    public void setSnapshotDate(LocalDate snapshotDate) {
        this.snapshotDate = snapshotDate;
    }

    public Integer getRemainingPoints() {
        return remainingPoints;
    }

    public void setRemainingPoints(Integer remainingPoints) {
        this.remainingPoints = remainingPoints;
    }

    public Integer getCompletedPoints() {
        return completedPoints;
    }

    public void setCompletedPoints(Integer completedPoints) {
        this.completedPoints = completedPoints;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
