package com.flowpilot.flowpilot.scrummaster.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumBurndownSnapshot;

@Repository
public interface ScrumBurndownSnapshotRepository
        extends JpaRepository<ScrumBurndownSnapshot, Long> {

    List<ScrumBurndownSnapshot> findBySprintIdOrderBySnapshotDateAsc(Long sprintId);

    Optional<ScrumBurndownSnapshot> findBySprintIdAndSnapshotDate(
            Long sprintId, LocalDate snapshotDate);

    void deleteBySprintId(Long sprintId);
}
