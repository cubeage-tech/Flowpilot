package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.admin.dto.AdminDepartmentMemberDto;
import com.flowpilot.flowpilot.admin.model.AdminDepartmentMember;
import com.flowpilot.flowpilot.admin.service.AdminDepartmentMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDepartmentMemberController {

    private final AdminDepartmentMemberService service;

    @GetMapping("/{departmentId}/members")
    public ResponseEntity<List<AdminDepartmentMember>> getMembers(@PathVariable Long departmentId) {
        return ResponseEntity.ok(service.getMembers(departmentId));
    }

    @PostMapping("/{departmentId}/members")
    public ResponseEntity<AdminDepartmentMember> addMember(
            @PathVariable Long departmentId,
            @RequestBody AdminDepartmentMemberDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addMember(departmentId, dto));
    }

    @DeleteMapping("/{departmentId}/members/{memberId}")
    public ResponseEntity<Map<String, String>> removeMember(
            @PathVariable Long departmentId,
            @PathVariable Long memberId) {
        service.removeMember(departmentId, memberId);
        return ResponseEntity.ok(Map.of("message", "Member removed from department successfully"));
    }
}