package com.flowpilot.flowpilot.scrummaster.repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumRetroActionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScrumRetroActionItemRepository extends JpaRepository<ScrumRetroActionItem, Long> {
    List<ScrumRetroActionItem> findBySprintNameOrderByItemOrderAsc(String sprintName);
}
