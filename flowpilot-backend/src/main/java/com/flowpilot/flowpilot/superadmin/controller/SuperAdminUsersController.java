package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminUserDto;
import com.flowpilot.flowpilot.superadmin.service.SuperAdminUsersService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/superadmin/users")
@RequiredArgsConstructor
public class SuperAdminUsersController {

    private final SuperAdminUsersService usersService;


    // =========================================================
    // GET ALL USERS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<SuperAdminUserDto>>
    getAllUsers() {

        return ResponseEntity.ok(
                usersService.getAllUsers()
        );
    }


    // =========================================================
    // GET USER
    // =========================================================

    @GetMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto>
    getUserByEmployeeId(
            @PathVariable Long employeeId
    ) {

        return ResponseEntity.ok(
                usersService.getUserByEmployeeId(
                        employeeId
                )
        );
    }


    // =========================================================
    // CREATE USER
    // =========================================================

    @PostMapping
    public ResponseEntity<SuperAdminUserDto>
    createUser(
            @RequestBody SuperAdminUserDto dto
    ) {

        SuperAdminUserDto created =
                usersService.createUser(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }


    // =========================================================
    // UPDATE USER
    // =========================================================

    @PutMapping("/{employeeId}")
    public ResponseEntity<SuperAdminUserDto>
    updateUser(
            @PathVariable Long employeeId,
            @RequestBody SuperAdminUserDto dto
    ) {

        return ResponseEntity.ok(
                usersService.updateUser(
                        employeeId,
                        dto
                )
        );
    }


    // =========================================================
    // ENABLE / DISABLE
    // =========================================================

    @PatchMapping("/{employeeId}/status")
    public ResponseEntity<SuperAdminUserDto>
    toggleStatus(
            @PathVariable Long employeeId
    ) {

        return ResponseEntity.ok(
                usersService.toggleStatus(
                        employeeId
                )
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void>
    deleteUser(
            @PathVariable Long employeeId
    ) {

        usersService.deleteUser(
                employeeId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}