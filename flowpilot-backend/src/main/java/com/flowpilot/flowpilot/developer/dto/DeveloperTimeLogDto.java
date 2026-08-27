package com.flowpilot.flowpilot.developer.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DeveloperTimeLogDto {

    // ============================================
    // REQUEST DTO
    // Used when frontend creates a new time log
    // ============================================
    public static class CreateRequest {

        private String task;
        private BigDecimal hours;
        private String notes;

        public CreateRequest() {
        }

        public String getTask() {
            return task;
        }

        public void setTask(String task) {
            this.task = task;
        }

        public BigDecimal getHours() {
            return hours;
        }

        public void setHours(BigDecimal hours) {
            this.hours = hours;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }


    // ============================================
    // SINGLE TIME LOG RESPONSE DTO
    // ============================================
    public static class Response {

        private Long id;
        private String task;
        private BigDecimal hours;
        private String notes;
        private LocalDate logDate;

        public Response() {
        }

        public Response(
                Long id,
                String task,
                BigDecimal hours,
                String notes,
                LocalDate logDate
        ) {
            this.id = id;
            this.task = task;
            this.hours = hours;
            this.notes = notes;
            this.logDate = logDate;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTask() {
            return task;
        }

        public void setTask(String task) {
            this.task = task;
        }

        public BigDecimal getHours() {
            return hours;
        }

        public void setHours(BigDecimal hours) {
            this.hours = hours;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }

        public LocalDate getLogDate() {
            return logDate;
        }

        public void setLogDate(LocalDate logDate) {
            this.logDate = logDate;
        }
    }


    // ============================================
    // HISTORY RESPONSE DTO
    // Returns all history + this week's total
    // ============================================
    public static class HistoryResponse {

        private List<Response> entries;
        private BigDecimal weeklyTotal;

        public HistoryResponse() {
        }

        public HistoryResponse(
                List<Response> entries,
                BigDecimal weeklyTotal
        ) {
            this.entries = entries;
            this.weeklyTotal = weeklyTotal;
        }

        public List<Response> getEntries() {
            return entries;
        }

        public void setEntries(List<Response> entries) {
            this.entries = entries;
        }

        public BigDecimal getWeeklyTotal() {
            return weeklyTotal;
        }

        public void setWeeklyTotal(BigDecimal weeklyTotal) {
            this.weeklyTotal = weeklyTotal;
        }
    }
}