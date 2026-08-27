package com.flowpilot.flowpilot.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDto {
    private String token;
    private String role;
    private String email;
    private String name;
}
