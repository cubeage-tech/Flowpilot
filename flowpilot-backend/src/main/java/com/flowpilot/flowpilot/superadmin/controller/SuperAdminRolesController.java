package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminRoleDto;
import com.flowpilot.flowpilot.superadmin.service.SuperAdminRolesService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/superadmin/roles")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://localhost:3000"
        }
)
public class SuperAdminRolesController {

    private final SuperAdminRolesService rolesService;

    /*
     * GET
     *
     * http://localhost:8080/api/superadmin/roles
     */
    @GetMapping
    public ResponseEntity<List<SuperAdminRoleDto>>
    getAllRoles() {

        return ResponseEntity.ok(
                rolesService.getAllRoles()
        );
    }

    /*
     * GET ONE ROLE
     *
     * /api/superadmin/roles/1
     */
    @GetMapping("/{id}")
    public ResponseEntity<SuperAdminRoleDto>
    getRoleById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                rolesService.getRoleById(id)
        );
    }

    /*
     * UPDATE ROLE
     *
     * /api/superadmin/roles/1
     */
    @PutMapping("/{id}")
    public ResponseEntity<SuperAdminRoleDto>
    updateRole(
            @PathVariable Long id,
            @RequestBody SuperAdminRoleDto dto
    ) {

        return ResponseEntity.ok(
                rolesService.updateRole(id, dto)
        );
    }
}