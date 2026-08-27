package com.flowpilot.flowpilot.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminUserDto {

    private Long employeeId;

    private String name;

    private String email;

    private String role;

    private String department;

    private String designation;

    private String password;

    private String status;

    private String lastLogin;

    private String initials;
}