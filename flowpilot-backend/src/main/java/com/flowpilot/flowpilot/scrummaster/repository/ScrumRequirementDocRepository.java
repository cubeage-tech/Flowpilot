package com.flowpilot.flowpilot.scrummaster.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumRequirementDoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScrumRequirementDocRepository extends JpaRepository<ScrumRequirementDoc, Long> {

    List<ScrumRequirementDoc> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<ScrumRequirementDoc> findAllByOrderByCreatedAtDesc();
}
