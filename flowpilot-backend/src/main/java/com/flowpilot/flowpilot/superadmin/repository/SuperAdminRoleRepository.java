package com.flowpilot.flowpilot.superadmin.repository;

import com.flowpilot.flowpilot.superadmin.model.SuperAdminRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SuperAdminRoleRepository
        extends JpaRepository<SuperAdminRole, Long> {

    Optional<SuperAdminRole> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}