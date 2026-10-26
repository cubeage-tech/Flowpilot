package com.flowpilot.flowpilot.admin.controller;

import com.flowpilot.flowpilot.admin.dto.AdminDepartmentDto;
import com.flowpilot.flowpilot.admin.model.AdminDepartment;
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
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDepartmentsController {

    private final AdminDepartmentsService service;

    @GetMapping
    public ResponseEntity<List<AdminDepartment>> getAllDepartments() {
        return ResponseEntity.ok(service.getAllDepartments());
    }

    @GetMapping("/{departmentId}")
    public ResponseEntity<AdminDepartment> getDepartmentById(@PathVariable Long departmentId) {
        return ResponseEntity.ok(service.getDepartmentById(departmentId));
    }

    @PostMapping
    public ResponseEntity<AdminDepartment> addDepartment(@RequestBody AdminDepartmentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addDepartment(dto));
    }

    @PutMapping("/{departmentId}")
    public ResponseEntity<AdminDepartment> updateDepartment(
            @PathVariable Long departmentId,
            @RequestBody AdminDepartmentDto dto) {
        return ResponseEntity.ok(service.updateDepartment(departmentId, dto));
    }

    @DeleteMapping("/{departmentId}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable Long departmentId) {
        service.deleteDepartment(departmentId);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
    }
}