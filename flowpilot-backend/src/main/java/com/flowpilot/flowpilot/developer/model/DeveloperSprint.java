package com.flowpilot.flowpilot.developer.model;

import jakarta.persistence.*;

@Entity
@Table(name = "developer_sprints")
public class DeveloperSprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false, unique = true)
    private String taskId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String member;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private String status;

    @Column(name = "is_my_task", nullable = false)
    private Boolean isMyTask = false;

    @Column(nullable = false)
    private Boolean completed = false;

    public DeveloperSprint() {
    }

    public DeveloperSprint(
            String taskId,
            String title,
            String member,
            Integer points,
            String status,
            Boolean isMyTask,
            Boolean completed
    ) {
        this.taskId = taskId;
        this.title = title;
        this.member = member;
        this.points = points;
        this.status = status;
        this.isMyTask = isMyTask;
        this.completed = completed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMember() {
        return member;
    }

    public void setMember(String member) {
        this.member = member;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsMyTask() {
        return isMyTask;
    }

    public void setIsMyTask(Boolean isMyTask) {
        this.isMyTask = isMyTask;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }
}