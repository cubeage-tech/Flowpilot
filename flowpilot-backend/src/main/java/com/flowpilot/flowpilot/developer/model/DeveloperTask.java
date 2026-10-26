package com.flowpilot.flowpilot.developer.model;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "developer_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeveloperTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "task_id",
            nullable = false,
            unique = true
    )
    private String taskId;

    @Column(nullable = false)
    private String priority;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private String status;

    @Column(name = "story_points")
    private Integer storyPoints;
}