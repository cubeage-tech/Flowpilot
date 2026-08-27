package com.flowpilot.flowpilot.scrummaster.model;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.flowpilot.flowpilot.common.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * A work item on the scrum board. Fields follow SRS Module 4 (Task Management).
 *
 * Two timestamps carry the metrics the SRS asks for and cannot be recovered
 * later: `enteredStatusAt` powers the ageing / stuck indicator, and
 * `completedAt` is the only way to compute average completion time.
 */
@Entity
@Table(name = "scrum_tasks")
public class ScrumTask {

    /**
     * Board columns, in flow order. SRS Module 5 lists Backlog, Sprint Ready,
     * To Do, In Progress, Testing, Review, Done and Blocked; Module 4 names the
     * review stage "Code Review". CODE_REVIEW is kept as the stored value and
     * displayed as "Review", so both readings of the SRS are satisfied.
     */
    public enum Status {
        BACKLOG,
        SPRINT_READY,
        TODO,
        IN_PROGRESS,
        CODE_REVIEW,
        TESTING,
        DONE,
        BLOCKED
    }

    /** SRS Module 4 task field: Priority. */
    public enum Priority {
        LOWEST,
        LOW,
        MEDIUM,
        HIGH,
        HIGHEST
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_key", nullable = false, unique = true, length = 20)
    private String taskKey;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "story_points", nullable = false)
    private Integer storyPoints;

    @Column(name = "estimated_hours", precision = 8, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "actual_hours", precision = 8, scale = 2)
    private BigDecimal actualHours;

    @Column(name = "due_date")
    private LocalDate dueDate;

    /** Comma-separated labels. A join table is overkill for free-form tags. */
    @Column(length = 255)
    private String labels;

    /** Why the card is blocked. Only meaningful while status is BLOCKED. */
    @Column(name = "blocked_reason", length = 500)
    private String blockedReason;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    /** SRS Module 4: who raised the task, as distinct from who works on it. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    private ScrumSprint sprint;

    @Column(name = "entered_status_at", nullable = false)
    private LocalDateTime enteredStatusAt;

    /**
     * Set the first time the task reaches DONE and never cleared afterwards.
     * See moveTo: this timestamp is the only record of when the work was
     * actually finished, so a reopen is recorded in reopenCount instead.
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * How many times the card has left DONE. Because completedAt keeps the
     * first completion, this counter is the only trace a reopen leaves, and it
     * is what tells a clean first-time close apart from work that bounced.
     */
    @Column(name = "reopen_count", nullable = false, columnDefinition = "integer default 0")
    private int reopenCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ScrumTask() {
    }

    @PrePersist
    public void beforeSave() {

        if (this.status == null) {
            this.status = Status.BACKLOG;
        }

        if (this.priority == null) {
            this.priority = Priority.MEDIUM;
        }

        if (this.storyPoints == null) {
            this.storyPoints = 0;
        }

        if (this.enteredStatusAt == null) {
            this.enteredStatusAt = LocalDateTime.now();
        }

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }

        if (this.status == Status.DONE && this.completedAt == null) {
            this.completedAt = LocalDateTime.now();
        }

        // reopen_count is NOT NULL and starts at zero. A primitive is already
        // zero, so the only thing left to normalise is a negative value
        // arriving through the setter
        if (this.reopenCount < 0) {
            this.reopenCount = 0;
        }
    }

    /**
     * Moves the card, restarts its ageing clock, and maintains the completion
     * trail. Always use this instead of setStatus so the metrics stay truthful.
     *
     * completedAt records the first time the card reached DONE and is never
     * cleared. Wiping it on a reopen made the next close look like the work
     * had run from creation to that day, and because velocity re-derives a
     * closed sprint from live rows, reopening one card inside a COMPLETED
     * sprint rewrote that sprint's bar and could flip its success verdict.
     * Leaving DONE bumps reopenCount instead, so the bounce is still visible.
     */
    public void moveTo(Status newStatus) {

        if (newStatus == null || newStatus == this.status) {
            return;
        }

        Status previous = this.status;

        this.status = newStatus;
        this.enteredStatusAt = LocalDateTime.now();

        if (newStatus == Status.DONE) {

            // First completion wins, so reopened-then-closed work is not
            // double counted in completion time
            if (this.completedAt == null) {
                this.completedAt = LocalDateTime.now();
            }

        } else if (previous == Status.DONE) {
            this.reopenCount++;
        }

        if (newStatus != Status.BLOCKED) {
            this.blockedReason = null;
        }
    }

    public boolean isDone() {
        return this.status == Status.DONE;
    }

    /** Whole days the card has sat in its current column. */
    public int getDaysInColumn() {

        if (this.enteredStatusAt == null) {
            return 0;
        }

        return (int) (Duration.between(this.enteredStatusAt, LocalDateTime.now()).toHours() / 24);
    }

    /** Past its due date and not finished. */
    public boolean isOverdue() {

        return this.dueDate != null
                && !isDone()
                && this.dueDate.isBefore(LocalDate.now());
    }

    /**
     * Hours from creation to the first completion, or null while unfinished.
     * A card that reopened and closed again still reports that first run.
     */
    public Double getCompletionHours() {

        if (this.completedAt == null || this.createdAt == null) {
            return null;
        }

        return Duration.between(this.createdAt, this.completedAt).toMinutes() / 60.0;
    }

    public String getAssigneeName() {
        return this.assignee == null ? null : this.assignee.getName();
    }

    public String getReporterName() {
        return this.reporter == null ? null : this.reporter.getName();
    }

    public String getAssigneeInitials() {
        return initialsOf(getAssigneeName());
    }

    public static String initialsOf(String name) {

        if (name == null || name.isBlank()) {
            return "?";
        }

        String[] parts = name.trim().split("\\s+");

        if (parts.length == 1) {
            return parts[0].substring(0, 1).toUpperCase();
        }

        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1))
                .toUpperCase();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTaskKey() {
        return taskKey;
    }

    public void setTaskKey(String taskKey) {
        this.taskKey = taskKey;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getStoryPoints() {
        return storyPoints;
    }

    public void setStoryPoints(Integer storyPoints) {
        this.storyPoints = storyPoints;
    }

    public BigDecimal getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(BigDecimal estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public BigDecimal getActualHours() {
        return actualHours;
    }

    public void setActualHours(BigDecimal actualHours) {
        this.actualHours = actualHours;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getLabels() {
        return labels;
    }

    public void setLabels(String labels) {
        this.labels = labels;
    }

    public String getBlockedReason() {
        return blockedReason;
    }

    public void setBlockedReason(String blockedReason) {
        this.blockedReason = blockedReason;
    }

    public User getAssignee() {
        return assignee;
    }

    public void setAssignee(User assignee) {
        this.assignee = assignee;
    }

    public User getReporter() {
        return reporter;
    }

    public void setReporter(User reporter) {
        this.reporter = reporter;
    }

    public ScrumSprint getSprint() {
        return sprint;
    }

    public void setSprint(ScrumSprint sprint) {
        this.sprint = sprint;
    }

    public LocalDateTime getEnteredStatusAt() {
        return enteredStatusAt;
    }

    public void setEnteredStatusAt(LocalDateTime enteredStatusAt) {
        this.enteredStatusAt = enteredStatusAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public int getReopenCount() {
        return reopenCount;
    }

    public void setReopenCount(int reopenCount) {
        this.reopenCount = reopenCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
