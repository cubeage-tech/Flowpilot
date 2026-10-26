package com.flowpilot.flowpilot.admin.service;

import com.flowpilot.flowpilot.admin.dto.AdminDepartmentDto;
import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import com.flowpilot.flowpilot.admin.repository.AdminDepartmentMemberRepository;
import com.flowpilot.flowpilot.admin.repository.AdminDepartmentsRepository;
import com.flowpilot.flowpilot.exception.ResourceNotFoundException;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminDepartmentsService {

    private final AdminDepartmentsRepository repository;
    private final AdminDepartmentMemberRepository memberRepository;
    private final SuperAdminUserRepository superAdminUserRepository;

    @Transactional(readOnly = true)
    public List<AdminDepartment> getAllDepartments() {
        List<AdminDepartment> departments = repository.findAll();
        List<SuperAdminUser> allUsers = superAdminUserRepository.findAll();

        for (AdminDepartment department : departments) {
            String deptName = department.getName() != null ? department.getName().trim().toLowerCase() : "";

            int registeredMembers = memberRepository.findByDepartment(department).size();
            long assignedUsers = allUsers.stream()
                    .filter(u -> {
                        if (u.getDepartment() == null || u.getDepartment().isBlank()) return false;
                        String uDept = u.getDepartment().trim().toLowerCase();
                        return uDept.equals(deptName)
                                || (deptName.contains("quality") && uDept.contains("quality"));
                    })
                    .count();

            department.setMembers((int) Math.max(registeredMembers, assignedUsers));
        }

        return departments;
    }

    @Transactional(readOnly = true)
    public AdminDepartment getDepartmentById(Long departmentId) {
        if (departmentId == null) {
            throw new IllegalArgumentException("Department ID is required");
        }

        AdminDepartment department = repository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        int memberCount = memberRepository.findByDepartment(department).size();
        department.setMembers(memberCount);
        return department;
    }

    public AdminDepartment addDepartment(AdminDepartmentDto dto) {
        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Department name is required");
        }

        String departmentName = dto.getName().trim();
        if (repository.existsByNameIgnoreCase(departmentName)) {
            throw new IllegalArgumentException("A department named '" + departmentName + "' already exists");
        }

        AdminDepartment department = AdminDepartment.builder()
                .name(departmentName)
                .head(dto.getHead() != null ? dto.getHead().trim() : "")
                .members(dto.getMembers() != null ? dto.getMembers() : 0)
                .progress(dto.getProgress() != null ? dto.getProgress() : 0)
                .build();

        return repository.save(department);
    }

    public AdminDepartment updateDepartment(Long departmentId, AdminDepartmentDto dto) {
        if (departmentId == null) {
            throw new IllegalArgumentException("Department ID is required");
        }
        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Department name is required");
        }

        AdminDepartment department = repository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        String newName = dto.getName().trim();
        repository.findByNameIgnoreCase(newName).ifPresent(existing -> {
            if (!existing.getId().equals(departmentId)) {
                throw new IllegalArgumentException("A department named '" + newName + "' already exists");
            }
        });

        department.setName(newName);
        if (dto.getHead() != null) {
            department.setHead(dto.getHead().trim());
        }
        if (dto.getProgress() != null) {
            department.setProgress(dto.getProgress());
        }

        int memberCount = memberRepository.findByDepartment(department).size();
        department.setMembers(memberCount);

        return repository.save(department);
    }

    public void deleteDepartment(Long departmentId) {
        if (departmentId == null) {
            throw new IllegalArgumentException("Department ID is required");
        }

        AdminDepartment department = repository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        memberRepository.deleteByDepartment(department);
        repository.delete(department);
    }
}
