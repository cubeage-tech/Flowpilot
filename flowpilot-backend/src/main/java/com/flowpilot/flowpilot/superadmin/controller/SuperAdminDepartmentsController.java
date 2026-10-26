package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.admin.dto.AdminDepartmentDto;
import com.flowpilot.flowpilot.admin.dto.AdminDepartmentMemberDto;
import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import com.flowpilot.flowpilot.admin.model.AdminDepartmentMember;
import com.flowpilot.flowpilot.admin.service.AdminDepartmentMemberService;
import com.flowpilot.flowpilot.admin.service.AdminDepartmentsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperAdminDepartmentsController {

    private final AdminDepartmentsService departmentService;
    private final AdminDepartmentMemberService memberService;

    // ==========================================
    // DEPARTMENT CRUD
    // ==========================================

    @GetMapping
    public ResponseEntity<List<AdminDepartment>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{departmentId}")
    public ResponseEntity<AdminDepartment> getDepartmentById(@PathVariable Long departmentId) {
        return ResponseEntity.ok(departmentService.getDepartmentById(departmentId));
    }

    @PostMapping
    public ResponseEntity<AdminDepartment> createDepartment(@RequestBody AdminDepartmentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentService.addDepartment(dto));
    }

    @PutMapping("/{departmentId}")
    public ResponseEntity<AdminDepartment> updateDepartment(
            @PathVariable Long departmentId,
            @RequestBody AdminDepartmentDto dto) {
        return ResponseEntity.ok(departmentService.updateDepartment(departmentId, dto));
    }

    @DeleteMapping("/{departmentId}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable Long departmentId) {
        departmentService.deleteDepartment(departmentId);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
    }

    // ==========================================
    // DEPARTMENT MEMBERS MANAGEMENT
    // ==========================================

    @GetMapping("/{departmentId}/members")
    public ResponseEntity<List<AdminDepartmentMember>> getDepartmentMembers(@PathVariable Long departmentId) {
        return ResponseEntity.ok(memberService.getMembers(departmentId));
    }

    @PostMapping("/{departmentId}/members")
    public ResponseEntity<AdminDepartmentMember> addDepartmentMember(
            @PathVariable Long departmentId,
            @RequestBody AdminDepartmentMemberDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.addMember(departmentId, dto));
    }

    @DeleteMapping("/{departmentId}/members/{memberId}")
    public ResponseEntity<Map<String, String>> removeDepartmentMember(
            @PathVariable Long departmentId,
            @PathVariable Long memberId) {
        memberService.removeMember(departmentId, memberId);
        return ResponseEntity.ok(Map.of("message", "Member removed from department successfully"));
    }
}