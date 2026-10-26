package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumRetrospective;

public interface ScrumRetrospectiveRepository
        extends JpaRepository<ScrumRetrospective, Long> {

    List<ScrumRetrospective> findBySprintIdOrderByKindAscIdAsc(Long sprintId);

    List<ScrumRetrospective> findBySprintIdAndKindOrderByIdAsc(
            Long sprintId, ScrumRetrospective.Kind kind);

    void deleteBySprintId(Long sprintId);
}
