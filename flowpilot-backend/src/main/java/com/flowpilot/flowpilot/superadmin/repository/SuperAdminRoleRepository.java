package com.flowpilot.flowpilot.superadmin.repository;

import com.flowpilot.flowpilot.superadmin.model.SuperAdminRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SuperAdminRoleRepository
        extends JpaRepository<SuperAdminRole, Long> {

    Optional<SuperAdminRole> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
