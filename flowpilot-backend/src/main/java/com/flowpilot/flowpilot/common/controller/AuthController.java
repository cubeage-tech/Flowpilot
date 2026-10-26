package com.flowpilot.flowpilot.common.controller;

import com.flowpilot.flowpilot.common.dto.ChangePasswordRequestDto;
import com.flowpilot.flowpilot.common.dto.LoginRequestDto;
import com.flowpilot.flowpilot.common.dto.LoginResponseDto;
import com.flowpilot.flowpilot.common.service.AuthService;
import com.flowpilot.flowpilot.security.JwtTokenProvider;
import com.flowpilot.flowpilot.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@RequestBody LoginRequestDto request) {
        LoginResponseDto response = authService.login(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String email = null;
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            email = auth.getName();
        }
        if ((email == null || email.isBlank()) && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            email = jwtTokenProvider.getEmailFromToken(token);
        }
        authService.changePassword(email, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(new ApiResponse<>(true, "Password changed successfully", null));
    }
}
