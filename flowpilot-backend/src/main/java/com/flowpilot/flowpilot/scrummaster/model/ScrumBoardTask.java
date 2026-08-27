package com.flowpilot.flowpilot.scrummaster.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scrum_board_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumBoardTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_code", nullable = false, unique = true)
    private String taskCode; // e.g. T-043

    @Column(nullable = false)
    private String title;

    private String assigneeInitials;
    private String assigneeName;
    private Integer points;

    @Column(name = "column_status", nullable = false)
    private String columnStatus; // Backlog, To do, In progress, Code review, Testing, Done

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "age_days")
    private Integer ageDays;
}
