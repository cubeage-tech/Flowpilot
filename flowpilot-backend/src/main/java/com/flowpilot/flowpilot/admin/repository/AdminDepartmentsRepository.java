package com.flowpilot.flowpilot.admin.repository;

import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminDepartmentsRepository
        extends JpaRepository<AdminDepartment, Long> {

    boolean existsByNameIgnoreCase(String name);

    Optional<AdminDepartment> findByNameIgnoreCase(String name);
}