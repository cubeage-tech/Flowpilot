package com.flowpilot.flowpilot.scrummaster.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumRetroActionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScrumRetroActionItemRepository extends JpaRepository<ScrumRetroActionItem, Long> {
    List<ScrumRetroActionItem> findBySprintNameOrderByItemOrderAsc(String sprintName);
}
