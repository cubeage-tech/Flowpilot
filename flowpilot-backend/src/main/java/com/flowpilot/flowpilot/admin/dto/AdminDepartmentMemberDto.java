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
public class AdminDepartmentMemberDto {
    private Long departmentId;
    private Long employeeId;
    private String fullName;
    private String email;
    private String designation;
}