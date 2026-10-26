package com.flowpilot.flowpilot.developer.service;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.developer.dto.DeveloperTaskDto;
import com.flowpilot.flowpilot.developer.repository.DeveloperTasksRepository;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.scrummaster.model.ScrumBoardTask;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeveloperTasksService {

    private final ScrumTaskRepository scrumTaskRepository;
    private final DeveloperTasksRepository developerTasksRepository;
    private final UserRepository userRepository;
    private final PMProjectsRepository pmProjectsRepository;

    @Transactional(readOnly = true)
    public List<DeveloperTaskDto> getMyTasks() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            throw new RuntimeException("User is not authenticated");
        }

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));

        // 1. Query Scrum tasks assigned to this user
        List<ScrumTask> scrumTasks = scrumTaskRepository.findByAssigneeIdOrderByStatusAscTaskKeyAsc(currentUser.getId());
        if (scrumTasks.isEmpty() && currentUser.getEmail() != null) {
            scrumTasks = scrumTaskRepository.findByAssigneeEmailIgnoreCase(currentUser.getEmail());
        }

        if (!scrumTasks.isEmpty()) {
            return scrumTasks.stream()
                    .map(this::convertScrumTaskToDto)
                    .toList();
        }

        // 2. Fallback to legacy ScrumBoardTask if no ScrumTasks found
        String developerName = currentUser.getName();
        List<ScrumBoardTask> legacyTasks =
                developerTasksRepository.findByAssigneeNameIgnoreCase(developerName);

        return legacyTasks.stream()
                .map(this::convertToDto)
                .toList();
    }

    private DeveloperTaskDto convertScrumTaskToDto(ScrumTask task) {
        Long projectId = null;
        String projectName = "General Project";

        if (task.getSprint() != null && task.getSprint().getProjectId() != null) {
            projectId = task.getSprint().getProjectId();
            projectName = getProjectName(projectId);
        }

        String priority = task.getPriority() != null ? formatPriority(task.getPriority().name()) : "Medium";
        String status = mapScrumStatus(task.getStatus());
        String details = buildScrumTaskDetails(task, projectName);

        return DeveloperTaskDto.builder()
                .id(task.getId())
                .taskId(task.getTaskKey())
                .priority(priority)
                .title(task.getTitle())
                .details(details)
                .status(status)
                .storyPoints(task.getStoryPoints() != null ? task.getStoryPoints() : 0)
                .projectId(projectId)
                .projectName(projectName)
                .build();
    }

    private DeveloperTaskDto convertToDto(ScrumBoardTask task) {
        String projectName = getProjectName(task.getProjectId());

        return DeveloperTaskDto.builder()
                .id(task.getId())
                .taskId(task.getTaskCode())
                .priority(getPriority(task))
                .title(task.getTitle())
                .details(buildDetails(task, projectName))
                .status(mapStatus(task.getColumnStatus()))
                .storyPoints(task.getPoints() != null ? task.getPoints() : 0)
                .projectId(task.getProjectId())
                .projectName(projectName)
                .build();
    }

    private String getProjectName(Long projectId) {
        if (projectId == null) {
            return "No Project";
        }

        return pmProjectsRepository.findById(projectId)
                .map(PMProject::getProjectName)
                .orElse("Project #" + projectId);
    }

    private String buildScrumTaskDetails(ScrumTask task, String projectName) {
        StringBuilder details = new StringBuilder();
        details.append(projectName);

        if (task.getSprint() != null && task.getSprint().getName() != null) {
            details.append(" · ").append(task.getSprint().getName());
        }

        if (task.getDueDate() != null) {
            details.append(" · Due: ").append(task.getDueDate());
        }

        return details.toString();
    }

    private String buildDetails(ScrumBoardTask task, String projectName) {
        StringBuilder details = new StringBuilder();
        details.append(projectName);

        if (task.getAgeDays() != null) {
            details.append(" · ")
                    .append(task.getAgeDays())
                    .append(task.getAgeDays() == 1 ? " day old" : " days old");
        }

        return details.toString();
    }

    private String mapScrumStatus(ScrumTask.Status status) {
        if (status == null) {
            return "To Do";
        }

        return switch (status) {
            case BACKLOG, SPRINT_READY, TODO, BLOCKED -> "To Do";
            case IN_PROGRESS, CODE_REVIEW, TESTING -> "In Progress";
            case DONE -> "Done";
        };
    }

    private String mapStatus(String columnStatus) {
        if (columnStatus == null) {
            return "To Do";
        }

        return switch (columnStatus.trim().toLowerCase()) {
            case "to do", "todo", "backlog" -> "To Do";
            case "in progress", "code review", "testing" -> "In Progress";
            case "done" -> "Done";
            default -> "To Do";
        };
    }

    private String formatPriority(String priority) {
        if (priority == null) {
            return "Medium";
        }
        return switch (priority.toUpperCase()) {
            case "HIGHEST", "HIGH" -> "High";
            case "LOWEST", "LOW" -> "Low";
            default -> "Medium";
        };
    }

    private String getPriority(ScrumBoardTask task) {
        if (task.getPoints() != null && task.getPoints() >= 8) {
            return "High";
        }
        return "Medium";
    }
}
