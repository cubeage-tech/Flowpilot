package com.flowpilot.flowpilot.pm.dto;

import java.time.LocalDate;

public class PMSprintDto {

    private Long id;

    private Long projectId;

    private String projectCode;

    private String projectName;

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

    private Long daysLeft;

    public PMSprintDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
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

    public Long getDaysLeft() {
        return daysLeft;
    }

    public void setDaysLeft(Long daysLeft) {
        this.daysLeft = daysLeft;
    }
}