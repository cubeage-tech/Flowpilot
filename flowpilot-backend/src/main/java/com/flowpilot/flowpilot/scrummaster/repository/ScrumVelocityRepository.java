package com.flowpilot.flowpilot.scrummaster.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumVelocity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScrumVelocityRepository extends JpaRepository<ScrumVelocity, Long> {
}
