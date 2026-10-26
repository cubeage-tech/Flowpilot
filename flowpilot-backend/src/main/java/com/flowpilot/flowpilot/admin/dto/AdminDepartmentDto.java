package com.flowpilot.flowpilot.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDepartmentDto {
    private String name;
    private String head;
    private Integer members;
    private Integer progress;
}