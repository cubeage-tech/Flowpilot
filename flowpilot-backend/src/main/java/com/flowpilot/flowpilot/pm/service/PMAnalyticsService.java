package com.flowpilot.flowpilot.pm.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.pm.model.PMTask;
import com.flowpilot.flowpilot.pm.repository.PMTaskRepository;

@Service
public class PMAnalyticsService {

    private final PMTaskRepository taskRepository;
    private final UserRepository userRepository;

    public PMAnalyticsService(
            PMTaskRepository taskRepository,
            UserRepository userRepository) {

        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public List<PMTask> getAnalyticsTasks() {

        List<PMTask> tasks =
                taskRepository.findAllByOrderByCreatedAtDesc();

        for (PMTask task : tasks) {

            if (task.getAssigneeId() != null) {

                userRepository.findById(task.getAssigneeId())
                        .ifPresent(user -> {
                            task.setAssigneeName(user.getName());
                            task.setAssigneeRole(user.getRole());
                        });
            }
        }

        return tasks;
    }
}