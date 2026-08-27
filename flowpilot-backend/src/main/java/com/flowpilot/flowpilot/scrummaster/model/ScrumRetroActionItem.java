package com.flowpilot.flowpilot.scrummaster.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scrum_retro_action_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrumRetroActionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_order")
    private Integer itemOrder;

    @Column(nullable = false)
    private String title;

    private String owner;
    private String due;
    private String sprintName;
}
