package com.flowpilot.flowpilot.developer.repository;

import com.flowpilot.flowpilot.developer.model.DeveloperSprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeveloperSprintRepository
        extends JpaRepository<DeveloperSprint, Long> {

    List<DeveloperSprint> findByStatus(String status);

    List<DeveloperSprint> findByIsMyTaskTrue();

    List<DeveloperSprint> findByMember(String member);
}
