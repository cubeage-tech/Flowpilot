package com.flowpilot.flowpilot.scrummaster.model;

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
 * One retrospective note. The three retro columns and the action list are the
 * same shape, so a single table with a `kind` discriminator keeps it simple.
 *
 * Action items are the only kind that carry an owner and a due date, because
 * they are the only kind that must actually happen.

 * Shares the scrum_retrospectives table with the earlier schema built for this
 * module. Its category/content columns are left in place but unmapped, since
 * kind/text carry the same meaning with an enum behind them.
 */
@Entity
@Table(name = "scrum_retrospectives")
public class ScrumRetrospective {

    public enum Kind {
        WENT_WELL,
        TO_CHANGE,
        ACTION
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sprint_id", nullable = false)
    private Long sprintId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Kind kind;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "due_label", length = 60)
    private String dueLabel;

    @Column(name = "due_date")
    private LocalDate dueDate;

    /** Action items can be ticked off once done. */
    @Column(nullable = false)
    private Boolean completed;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ScrumRetrospective() {
    }

    @PrePersist
    public void beforeSave() {

        if (this.completed == null) {
            this.completed = Boolean.FALSE;
        }

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public String getOwnerName() {
        return this.owner == null ? null : this.owner.getName();
    }

    public String getOwnerInitials() {
        return ScrumTask.initialsOf(getOwnerName());
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

    public Kind getKind() {
        return kind;
    }

    public void setKind(Kind kind) {
        this.kind = kind;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public String getDueLabel() {
        return dueLabel;
    }

    public void setDueLabel(String dueLabel) {
        this.dueLabel = dueLabel;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
