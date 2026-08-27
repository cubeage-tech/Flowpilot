package com.flowpilot.flowpilot.pm.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "pm_projects")
public class PMProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String projectCode;

    @Column(nullable = false)
    private String projectName;

    private String sprint;

    private String budget;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;

    private Integer progress;

    /*
     * =========================================================
     * PROJECT TEAM MEMBERS
     *
     * PM projects reference SuperAdminUser.
     *
     * pm_project_members.member_id
     *              ↓
     * superadmin_users.id
     * =========================================================
     */

    @ManyToMany
    @JoinTable(
            name = "pm_project_members",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(
                    name = "member_id",
                    foreignKey = @jakarta.persistence.ForeignKey(jakarta.persistence.ConstraintMode.NO_CONSTRAINT)
            )
    )
    private List<SuperAdminUser> teamMembers = new ArrayList<>();

    public PMProject() {
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

    public List<SuperAdminUser> getTeamMembers() {
        return teamMembers;
    }

    public void setTeamMembers(List<SuperAdminUser> teamMembers) {
        this.teamMembers = teamMembers;
    }
}