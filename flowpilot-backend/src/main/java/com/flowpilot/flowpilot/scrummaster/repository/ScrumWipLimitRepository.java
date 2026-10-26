package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.model.ScrumWipLimit;

public interface ScrumWipLimitRepository
        extends JpaRepository<ScrumWipLimit, Long> {

    Optional<ScrumWipLimit> findByStatus(ScrumTask.Status status);

}
