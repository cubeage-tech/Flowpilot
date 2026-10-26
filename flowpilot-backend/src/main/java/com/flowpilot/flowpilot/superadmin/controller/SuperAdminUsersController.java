package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminUserDto;
import com.flowpilot.flowpilot.superadmin.service.SuperAdminUsersService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/superadmin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperAdminUsersController {

    private final SuperAdminUsersService usersService;

    @GetMapping
    public ResponseEntity<List<SuperAdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(usersService.getAllUsers());
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto> getUserByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(usersService.getUserByEmployeeId(employeeId));
    }

    @PostMapping
    public ResponseEntity<SuperAdminUserDto> createUser(@RequestBody SuperAdminUserDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usersService.createUser(dto));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto> updateUser(
            @PathVariable Long employeeId,
            @RequestBody SuperAdminUserDto dto) {
        return ResponseEntity.ok(usersService.updateUser(employeeId, dto));
    }

    @PatchMapping("/{employeeId}/status")
    public ResponseEntity<SuperAdminUserDto> toggleStatus(@PathVariable Long employeeId) {
        return ResponseEntity.ok(usersService.toggleStatus(employeeId));
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long employeeId) {
        usersService.deleteUser(employeeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{employeeId}/reset-password")
    public ResponseEntity<java.util.Map<String, Object>> resetPassword(
            @PathVariable Long employeeId,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String customPassword = body != null ? body.get("newPassword") : null;
        String newPassword = usersService.resetPassword(employeeId, customPassword);
        return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Password reset successfully and emailed to user",
                "newPassword", newPassword
        ));
    }
}