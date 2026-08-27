package com.flowpilot.flowpilot.superadmin.repository;

import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SuperAdminUserRepository
        extends JpaRepository<SuperAdminUser, Long> {

    Optional<SuperAdminUser> findByEmail(String email);

    boolean existsByEmail(String email);
}