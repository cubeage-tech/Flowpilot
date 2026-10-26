package com.flowpilot.flowpilot.developer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "developer_mentions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeveloperMention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String initials;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String task;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private String time;

    @Column(nullable = false)
    @Builder.Default
    private Boolean unread = true;
}
