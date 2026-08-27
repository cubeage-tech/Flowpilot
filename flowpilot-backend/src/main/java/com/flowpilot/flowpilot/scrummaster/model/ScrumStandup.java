package com.flowpilot.flowpilot.scrummaster.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.flowpilot.flowpilot.common.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * One team member's daily standup entry: what they did, what they will do, and
 * what is in their way. One entry per person per day per sprint.
 *
 * Table name is scrum_standup_entries rather than scrum_standups: another
 * module already owns a scrum_standups table on the shared database with a
 * denormalised, non-null name/initials design. Renaming here keeps both
 * schemas working instead of one team altering the other's columns.
 */
@Entity
@Table(
    name = "scrum_standups",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_scrum_standup_member_day",
        columnNames = { "sprint_id", "member_id", "standup_date" }
    )
)
public class ScrumStandup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sprint_id", nullable = false)
    private Long sprintId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @Column(name = "standup_date", nullable = false)
    private LocalDate standupDate;

    @Column(columnDefinition = "TEXT")
    private String yesterday;

    @Column(columnDefinition = "TEXT")
    private String today;

    /** Null or blank means the member is not blocked. */
    @Column(columnDefinition = "TEXT")
    private String blocker;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ScrumStandup() {
    }

    @PrePersist
    public void beforeSave() {

        if (this.standupDate == null) {
            this.standupDate = LocalDate.now();
        }

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public boolean isBlocked() {
        return this.blocker != null && !this.blocker.isBlank();
    }

    public String getMemberName() {
        return this.member == null ? null : this.member.getName();
    }

    public String getMemberInitials() {
        return ScrumTask.initialsOf(getMemberName());
    }

    public String getMemberRole() {
        return this.member == null ? null : this.member.getRole();
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

    public User getMember() {
        return member;
    }

    public void setMember(User member) {
        this.member = member;
    }

    public LocalDate getStandupDate() {
        return standupDate;
    }

    public void setStandupDate(LocalDate standupDate) {
        this.standupDate = standupDate;
    }

    public String getYesterday() {
        return yesterday;
    }

    public void setYesterday(String yesterday) {
        this.yesterday = yesterday;
    }

    public String getToday() {
        return today;
    }

    public void setToday(String today) {
        this.today = today;
    }

    public String getBlocker() {
        return blocker;
    }

    public void setBlocker(String blocker) {
        this.blocker = blocker;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
