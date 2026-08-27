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
 * A file attached to a task (SRS Module 4: the "Attachments" field and the
 * "Attach Files" action).
 *
 * Only metadata lives here; the bytes belong to ScrumFileStore. `storageKey`
 * is deliberately opaque to this entity, so swapping local disk for S3 or
 * MinIO changes no column and no row.
 *
 * The task is referenced by plain id rather than a JPA relation, matching how
 * comments and standups reference their parent in this module: attachments are
 * only ever fetched for a known task.
 */
@Entity
@Table(name = "scrum_attachments")
public class ScrumAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    /** The name the uploader saw. Display only — never used as a path. */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", length = 128)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    /** The handle ScrumFileStore understands, generated server-side. */
    @Column(name = "storage_key", nullable = false, unique = true, length = 255)
    private String storageKey;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    public ScrumAttachment() {
    }

    @PrePersist
    public void beforeSave() {

        if (this.uploadedAt == null) {
            this.uploadedAt = LocalDateTime.now();
        }

        if (this.sizeBytes == null) {
            this.sizeBytes = 0L;
        }
    }

    public String getUploadedByName() {
        return this.uploadedBy == null ? null : this.uploadedBy.getName();
    }

    public String getUploadedByInitials() {
        return ScrumTask.initialsOf(getUploadedByName());
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

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public User getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(User uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
