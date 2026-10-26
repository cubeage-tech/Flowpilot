package com.flowpilot.flowpilot.admin.service;

import com.flowpilot.flowpilot.admin.dto.AdminDepartmentMemberDto;
import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import com.flowpilot.flowpilot.admin.model.AdminDepartmentMember;
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
public class AdminDepartmentMemberService {

    private final AdminDepartmentMemberRepository memberRepository;
    private final AdminDepartmentsRepository departmentRepository;
    private final SuperAdminUserRepository superAdminUserRepository;

    @Transactional(readOnly = true)
    public List<AdminDepartmentMember> getMembers(Long departmentId) {
        if (departmentId == null) {
            throw new IllegalArgumentException("Department ID is required.");
        }

        AdminDepartment department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        return memberRepository.findByDepartment(department);
    }

    public AdminDepartmentMember addMember(Long departmentId, AdminDepartmentMemberDto dto) {
        if (departmentId == null) {
            throw new IllegalArgumentException("Department ID is required.");
        }
        if (dto == null) {
            throw new IllegalArgumentException("Member data is required.");
        }

        AdminDepartment department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        // Locate corresponding user from superadmin pool if available
        SuperAdminUser user = null;
        if (dto.getEmployeeId() != null) {
            user = superAdminUserRepository.findById(dto.getEmployeeId()).orElse(null);
        }
        if (user == null && dto.getEmail() != null && !dto.getEmail().isBlank()) {
            user = superAdminUserRepository.findByEmail(dto.getEmail().trim()).orElse(null);
        }

        String employeeId = dto.getEmployeeId() != null ? String.valueOf(dto.getEmployeeId()) : null;
        String fullName = dto.getFullName();
        String email = dto.getEmail();
        String designation = dto.getDesignation();

        if (user != null) {
            employeeId = String.valueOf(user.getEmployeeId());
            if (fullName == null || fullName.isBlank()) {
                fullName = user.getName();
            }
            if (email == null || email.isBlank()) {
                email = user.getEmail();
            }
            if (designation == null || designation.isBlank()) {
                designation = user.getDesignation() != null ? user.getDesignation() : user.getRole();
            }
        }

        if (employeeId == null || employeeId.isBlank()) {
            throw new IllegalArgumentException("Employee ID is required.");
        }

        if (memberRepository.existsByDepartmentAndEmployeeId(department, employeeId)) {
            throw new IllegalArgumentException("This user is already a member of " + department.getName() + ".");
        }

        AdminDepartmentMember member = AdminDepartmentMember.builder()
                .department(department)
                .employeeId(employeeId)
                .fullName(fullName != null ? fullName.trim() : "Team Member")
                .email(email != null ? email.trim() : "")
                .designation(designation != null && !designation.isBlank() ? designation.trim() : "Member")
                .build();

        AdminDepartmentMember saved = memberRepository.save(member);

        // Keep department member count synchronized
        int count = memberRepository.findByDepartment(department).size();
        department.setMembers(count);
        departmentRepository.save(department);

        return saved;
    }

    public void removeMember(Long departmentId, Long memberId) {
        if (departmentId == null || memberId == null) {
            throw new IllegalArgumentException("Department ID and Member ID are required.");
        }

        AdminDepartment department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + departmentId));

        AdminDepartmentMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + memberId));

        if (!member.getDepartment().getId().equals(department.getId())) {
            throw new IllegalArgumentException("Member does not belong to this department.");
        }

        memberRepository.delete(member);

        int count = memberRepository.findByDepartment(department).size();
        department.setMembers(count);
        departmentRepository.save(department);
    }
}
