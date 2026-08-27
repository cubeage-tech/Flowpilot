package com.flowpilot.flowpilot.scrummaster.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.flowpilot.flowpilot.scrummaster.service.ScrumWorkingDays;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * A sprint: the unit of work a scrum team commits to for a fixed period.
 *
 * Only one sprint per project may be ACTIVE at a time. Committed points are
 * frozen when the sprint starts, so mid-sprint scope changes are visible as
 * the gap between committed and current points rather than silently absorbed.
 */
@Entity
@Table(name = "scrum_sprints")
public class ScrumSprint {

    public enum Status {
        PLANNED,
        ACTIVE,
        COMPLETED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sprint_number", nullable = false)
    private Integer sprintNumber;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String goal;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    /** Story points in the sprint at the moment it started. Null until then. */
    @Column(name = "committed_points")
    private Integer committedPoints;

    /**
     * Team capacity in story points for this sprint (SRS Module 6). Planning
     * beyond capacity is allowed but surfaced as over-commitment.
     */
    @Column(name = "capacity_points")
    private Integer capacityPoints;

    /**
     * Owning project (SRS section 14: sprints.project_id). Kept as a plain id
     * rather than a JPA relation because the PM module owns that table and we
     * must not couple the two mappings together.
     */
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ScrumSprint() {
    }

    @PrePersist
    public void beforeSave() {

        if (this.status == null) {
            this.status = Status.PLANNED;
        }

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    /**
     * Working days in the sprint window, inclusive of both ends.
     *
     * All three of these delegate to ScrumWorkingDays so the sprint header and
     * the burndown ideal line are measured in the same unit. Counting calendar
     * days here understates the required daily burn by roughly a quarter on a
     * two-week sprint, which makes a slipping sprint look healthy.
     */
    public int getTotalDays() {
        return ScrumWorkingDays.durationOf(this.startDate, this.endDate);
    }

    /**
     * Working days already spent.
     *
     * Status decides which window to measure, because a sprint is not a
     * calendar. A COMPLETED sprint is history: its elapsed count is the whole
     * window even when it was closed early, since measuring against today
     * kept it climbing for months after the sprint stopped existing. A PLANNED
     * sprint has not started, so nothing is spent yet however long ago its
     * nominal start date was.
     */
    public int getDaysElapsed() {

        if (this.status == Status.COMPLETED) {
            return getTotalDays();
        }

        if (this.status == Status.PLANNED) {
            return 0;
        }

        return ScrumWorkingDays.elapsed(this.startDate, this.endDate);
    }

    /**
     * Working days left before the sprint ends.
     *
     * The mirror of getDaysElapsed: nothing is left in a COMPLETED sprint, and
     * a PLANNED one still has its whole window ahead of it. Counting from
     * today in either case made a sprint closed early look like it was still
     * running, and drained a planned sprint before anyone started it.
     */
    public int getDaysRemaining() {

        if (this.status == Status.COMPLETED) {
            return 0;
        }

        if (this.status == Status.PLANNED) {
            return getTotalDays();
        }

        return ScrumWorkingDays.remaining(this.startDate, this.endDate);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getSprintNumber() {
        return sprintNumber;
    }

    public void setSprintNumber(Integer sprintNumber) {
        this.sprintNumber = sprintNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getCapacityPoints() {
        return capacityPoints;
    }

    public void setCapacityPoints(Integer capacityPoints) {
        this.capacityPoints = capacityPoints;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Integer getCommittedPoints() {
        return committedPoints;
    }

    public void setCommittedPoints(Integer committedPoints) {
        this.committedPoints = committedPoints;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
