package com.flowpilot.flowpilot.scrummaster.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumBlocker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScrumBlockerRepository extends JpaRepository<ScrumBlocker, Long> {
    List<ScrumBlocker> findByStatus(String status);
}
