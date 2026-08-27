package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.admin.model.AdminDepartmentMember;
import com.flowpilot.flowpilot.admin.service.AdminDepartmentMemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/departments")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminDepartmentMemberController {

    private final AdminDepartmentMemberService service;

    public AdminDepartmentMemberController(
            AdminDepartmentMemberService service) {

        this.service = service;
    }

    @GetMapping("/{departmentId}/members")
    public ResponseEntity<List<AdminDepartmentMember>> getMembers(
            @PathVariable Long departmentId) {

        return ResponseEntity.ok(
                service.getMembers(departmentId)
        );
    }

    @PostMapping("/{departmentId}/members")
    public ResponseEntity<AdminDepartmentMember> addMember(
            @PathVariable Long departmentId,
            @RequestBody AdminDepartmentMember member) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.addMember(departmentId, member));
    }

    @PutMapping("/{departmentId}/members/{memberId}")
    public ResponseEntity<AdminDepartmentMember> updateMember(
            @PathVariable Long departmentId,
            @PathVariable Long memberId,
            @RequestBody AdminDepartmentMember member) {

        return ResponseEntity.ok(
                service.updateMember(
                        departmentId,
                        memberId,
                        member
                )
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>>
    handleIllegalArgumentException(
            IllegalArgumentException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }
}