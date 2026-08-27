package com.flowpilot.flowpilot.scrummaster.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "scrum_blockers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumBlocker {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "raised_by", nullable = false)
    private String raisedBy;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private String status; // ACTIVE, RESOLVED, ESCALATED

    private LocalDateTime createdAt;
}
