package com.flowpilot.flowpilot.scrummaster.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scrum_ceremonies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumCeremony {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "when_time", nullable = false)
    private String whenTime;

    private String tone;
    private String status;
}
