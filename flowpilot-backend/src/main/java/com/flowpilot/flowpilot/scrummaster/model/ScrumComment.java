package com.flowpilot.flowpilot.scrummaster.model;

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

/**
 * A comment on a task (SRS Module 4: task field "Comments", action "Comment").
 *
 * The task is referenced by plain id rather than a JPA relation, matching how
 * standups and retro notes reference their sprint in this module: comments are
 * always fetched for a known task, so a mapped association would only add
 * lazy-loading surprises for no gain.
 */
@Entity
@Table(name = "scrum_comments")
public class ScrumComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Set only when the text has been changed, so "edited" can be shown. */
    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    public ScrumComment() {
    }

    @PrePersist
    public void beforeSave() {

        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public String getAuthorName() {
        return this.author == null ? null : this.author.getName();
    }

    public String getAuthorInitials() {
        return ScrumTask.initialsOf(getAuthorName());
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

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(LocalDateTime editedAt) {
        this.editedAt = editedAt;
    }
}
