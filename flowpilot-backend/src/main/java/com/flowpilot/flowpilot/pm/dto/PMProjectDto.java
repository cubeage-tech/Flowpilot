package com.flowpilot.flowpilot.pm.dto;

import java.time.LocalDate;
import java.util.List;

public class PMProjectDto {

    private Long id;

    private String projectCode;

    private String projectName;

    private String sprint;

    private String budget;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;

    private Integer progress;

    /*
     * IDs of SuperAdmin users assigned to this project.
     *
     * IMPORTANT:
     * These are SuperAdminUser.id values, NOT employeeId.
     */
    private List<Long> teamMemberIds;

    public PMProjectDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getBudget() {
        return budget;
    }

    public void setBudget(String budget) {
        this.budget = budget;
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

    public List<Long> getTeamMemberIds() {
        return teamMemberIds;
    }

    public void setTeamMemberIds(List<Long> teamMemberIds) {
        this.teamMemberIds = teamMemberIds;
    }
}