package com.flowpilot.flowpilot.pm.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pm_sprints")
public class PMSprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private PMProject project;

    @Column(nullable = false)
    private String sprint;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;

    private Integer progress;

    private Integer completedStoryPoints;

    private Integer plannedStoryPoints;

    private Integer totalTasks;

    private Integer completedTasks;

    private Integer velocity;

    public PMSprint() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PMProject getProject() {
        return project;
    }

    public void setProject(PMProject project) {
        this.project = project;
    }

    public String getSprint() {
        return sprint;
    }

    public void setSprint(String sprint) {
        this.sprint = sprint;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public Integer getCompletedStoryPoints() {
        return completedStoryPoints;
    }

    public void setCompletedStoryPoints(
            Integer completedStoryPoints) {
        this.completedStoryPoints = completedStoryPoints;
    }

    public Integer getPlannedStoryPoints() {
        return plannedStoryPoints;
    }

    public void setPlannedStoryPoints(
            Integer plannedStoryPoints) {
        this.plannedStoryPoints = plannedStoryPoints;
    }

    public Integer getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(Integer totalTasks) {
        this.totalTasks = totalTasks;
    }

    public Integer getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(
            Integer completedTasks) {
        this.completedTasks = completedTasks;
    }

    public Integer getVelocity() {
        return velocity;
    }

    public void setVelocity(Integer velocity) {
        this.velocity = velocity;
    }
}