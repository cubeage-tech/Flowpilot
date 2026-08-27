package com.flowpilot.flowpilot.scrummaster.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Work-in-progress limit for one board column (SRS Module 5).
 *
 * A limit is advisory: exceeding it flags the column rather than refusing the
 * move, because blocking a developer mid-flow is worse than showing them the
 * queue is too long.
 */
@Entity
@Table(name = "scrum_wip_limits")
public class ScrumWipLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private ScrumTask.Status status;

    /** Maximum cards before the column is flagged. Null or 0 means unlimited. */
    @Column(name = "limit_value")
    private Integer limitValue;

    public ScrumWipLimit() {
    }

    public ScrumWipLimit(ScrumTask.Status status, Integer limitValue) {
        this.status = status;
        this.limitValue = limitValue;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ScrumTask.Status getStatus() {
        return status;
    }

    public void setStatus(ScrumTask.Status status) {
        this.status = status;
    }

    public Integer getLimitValue() {
        return limitValue;
    }

    public void setLimitValue(Integer limitValue) {
        this.limitValue = limitValue;
    }
}
