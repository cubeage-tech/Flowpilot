package com.flowpilot.flowpilot.superadmin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SuperAdminAuditLogDto {

    private Long id;

    private String time;

    @JsonProperty("user")
    private String userName;

    private String action;

    private String entity;

    private String entityId;

    private String ip;

    private String day;

    public SuperAdminAuditLogDto() {
    }

    public SuperAdminAuditLogDto(
            Long id,
            String time,
            String userName,
            String action,
            String entity,
            String entityId,
            String ip,
            String day
    ) {
        this.id = id;
        this.time = time;
        this.userName = userName;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.ip = ip;
        this.day = day;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    @JsonProperty("user")
    public String getUserName() {
        return userName;
    }

    @JsonProperty("user")
    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntity() {
        return entity;
    }

    public void setEntity(String entity) {
        this.entity = entity;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }
}
