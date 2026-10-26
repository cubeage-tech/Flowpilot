package com.flowpilot.flowpilot.admin.repository;

import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import com.flowpilot.flowpilot.admin.model.AdminDepartmentMember;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminDepartmentMemberRepository
        extends JpaRepository<AdminDepartmentMember, Long> {

    List<AdminDepartmentMember> findByDepartment(
            AdminDepartment department
    );

    boolean existsByDepartmentAndEmployeeId(
            AdminDepartment department,
            String employeeId
    );

    void deleteByDepartment(
            AdminDepartment department
    );
}
