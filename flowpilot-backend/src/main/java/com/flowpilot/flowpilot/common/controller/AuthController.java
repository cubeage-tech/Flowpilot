package com.flowpilot.flowpilot.common.controller;

import com.flowpilot.flowpilot.common.dto.LoginRequestDto;
import com.flowpilot.flowpilot.common.dto.LoginResponseDto;
import com.flowpilot.flowpilot.common.service.AuthService;
import com.flowpilot.flowpilot.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@RequestBody LoginRequestDto request) {
        LoginResponseDto response = authService.login(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
    }
}
