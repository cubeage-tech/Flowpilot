package com.flowpilot.flowpilot.scrummaster.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumBlocker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScrumBlockerRepository extends JpaRepository<ScrumBlocker, Long> {
    List<ScrumBlocker> findByStatus(String status);
}
