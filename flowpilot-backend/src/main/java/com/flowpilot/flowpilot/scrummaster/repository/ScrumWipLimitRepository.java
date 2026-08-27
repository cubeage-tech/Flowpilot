package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.model.ScrumWipLimit;

@Repository
public interface ScrumWipLimitRepository
        extends JpaRepository<ScrumWipLimit, Long> {

    Optional<ScrumWipLimit> findByStatus(ScrumTask.Status status);

    @Override
    List<ScrumWipLimit> findAll();
}
