package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import com.flowpilot.flowpilot.admin.repository.AdminDepartmentsRepository;
import com.flowpilot.flowpilot.admin.repository.AdminDepartmentMemberRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/superadmin/departments")
@CrossOrigin(origins = "http://localhost:5173")
public class SuperAdminDepartmentsController {

    private final AdminDepartmentsRepository departmentRepository;
    private final AdminDepartmentMemberRepository memberRepository;

    public SuperAdminDepartmentsController(
            AdminDepartmentsRepository departmentRepository,
            AdminDepartmentMemberRepository memberRepository) {

        this.departmentRepository = departmentRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping
    public ResponseEntity<List<AdminDepartment>> getAllDepartments() {

        List<AdminDepartment> departments =
                departmentRepository.findAll();

        for (AdminDepartment department : departments) {

            int memberCount =
                    memberRepository
                            .findByDepartment(department)
                            .size();

            department.setMembers(memberCount);
        }

        return ResponseEntity.ok(departments);
    }
}