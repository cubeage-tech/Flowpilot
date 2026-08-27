package com.flowpilot.flowpilot.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuperAdminRoleDto {

    private Long id;

    private String name;

    private String description;

    private Boolean active;

    private LocalDateTime createdAt;

    @Builder.Default
    private Map<String, Boolean> permissions = new HashMap<>();
}