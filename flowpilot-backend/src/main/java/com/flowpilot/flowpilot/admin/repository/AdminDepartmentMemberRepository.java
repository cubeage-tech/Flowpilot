package com.flowpilot.flowpilot.admin.repository;

import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import com.flowpilot.flowpilot.admin.model.AdminDepartmentMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminDepartmentMemberRepository
        extends JpaRepository<AdminDepartmentMember, Long> {

    List<AdminDepartmentMember> findByDepartment(AdminDepartment department);

    AdminDepartmentMember findTopByOrderByEmployeeIdDesc();
}