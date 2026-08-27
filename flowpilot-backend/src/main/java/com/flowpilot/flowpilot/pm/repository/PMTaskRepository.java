package com.flowpilot.flowpilot.pm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.flowpilot.flowpilot.pm.model.PMTask;

public interface PMTaskRepository extends JpaRepository<PMTask, Long> {

    List<PMTask> findAllByOrderByCreatedAtDesc();
}