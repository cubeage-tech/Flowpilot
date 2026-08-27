package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminUserDto;
import com.flowpilot.flowpilot.admin.service.AdminUsersService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUsersController {

    private final AdminUsersService adminUsersService;

    // =========================================================
    // GET ALL USERS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<SuperAdminUserDto>> getAllUsers() {

        return ResponseEntity.ok(
                adminUsersService.getAllUsers()
        );
    }


    // =========================================================
    // GET USER BY EMPLOYEE ID
    // =========================================================

    @GetMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto> getUserByEmployeeId(
            @PathVariable Long employeeId
    ) {

        return ResponseEntity.ok(
                adminUsersService.getUserByEmployeeId(employeeId)
        );
    }


    // =========================================================
    // SEARCH USERS
    // =========================================================

    @GetMapping("/search")
    public ResponseEntity<List<SuperAdminUserDto>> searchUsers(
            @RequestParam(required = false) String keyword
    ) {

        return ResponseEntity.ok(
                adminUsersService.searchUsers(keyword)
        );
    }


    // =========================================================
    // UPDATE USER
    // =========================================================
    /*
     * Admin can update:
     * - name
     * - email
     * - role
     * - department
     *
     * Status is intentionally NOT handled here.
     * Admin uses the separate status endpoint.
     */

    @PutMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto> updateUser(
            @PathVariable Long employeeId,
            @RequestBody SuperAdminUserDto dto
    ) {

        return ResponseEntity.ok(
                adminUsersService.updateUser(
                        employeeId,
                        dto
                )
        );
    }


    // =========================================================
    // ENABLE / DISABLE USER
    // =========================================================

    @PatchMapping("/{employeeId}/status")
    public ResponseEntity<SuperAdminUserDto> toggleStatus(
            @PathVariable Long employeeId
    ) {

        return ResponseEntity.ok(
                adminUsersService.toggleStatus(
                        employeeId
                )
        );
    }
}