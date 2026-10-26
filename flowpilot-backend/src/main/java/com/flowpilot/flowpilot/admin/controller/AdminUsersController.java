package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.admin.service.AdminUsersService;
import com.flowpilot.flowpilot.superadmin.dto.SuperAdminUserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminUsersController {

    private final AdminUsersService adminUsersService;

    @GetMapping
    public ResponseEntity<List<SuperAdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(adminUsersService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<SuperAdminUserDto> createUser(@RequestBody SuperAdminUserDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUsersService.createUser(dto));
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto> getUserByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(adminUsersService.getUserByEmployeeId(employeeId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SuperAdminUserDto>> searchUsers(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(adminUsersService.searchUsers(keyword));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto> updateUser(
            @PathVariable Long employeeId,
            @RequestBody SuperAdminUserDto dto) {
        return ResponseEntity.ok(adminUsersService.updateUser(employeeId, dto));
    }

    @PatchMapping("/{employeeId}/status")
    public ResponseEntity<SuperAdminUserDto> toggleStatus(@PathVariable Long employeeId) {
        return ResponseEntity.ok(adminUsersService.toggleStatus(employeeId));
    }

    @PostMapping("/{employeeId}/reset-password")
    public ResponseEntity<java.util.Map<String, Object>> resetPassword(
            @PathVariable Long employeeId,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String customPassword = body != null ? body.get("newPassword") : null;
        String newPassword = adminUsersService.resetPassword(employeeId, customPassword);
        return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Password reset successfully and emailed to user",
                "newPassword", newPassword
        ));
    }
}