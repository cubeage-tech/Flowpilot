package com.flowpilot.flowpilot.developer.service;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.developer.dto.DeveloperSprintDto;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.scrummaster.model.ScrumBoardTask;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumBoardTaskRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeveloperSprintBoardService {

    private final ScrumTaskRepository scrumTaskRepository;
    private final ScrumSprintRepository scrumSprintRepository;
    private final ScrumBoardTaskRepository scrumBoardTaskRepository;
    private final UserRepository userRepository;
    private final PMProjectsRepository pmProjectsRepository;

    @Transactional(readOnly = true)
    public DeveloperSprintDto getSprintBoard(Long projectId, Long sprintId, String developerName) {

        // 1. Identify logged-in user
        User currentUser = getAuthenticatedUser();
        String currentDevName = developerName;
        if ((currentDevName == null || currentDevName.isBlank()) && currentUser != null) {
            currentDevName = currentUser.getName();
        }

        // 2. Resolve target sprint
        ScrumSprint sprint = resolveSprint(projectId, sprintId);

        String sprintName = sprint != null ? sprint.getName() : "Current Sprint";
        Long activeProjectId = sprint != null ? sprint.getProjectId() : projectId;
        String projectName = getProjectName(activeProjectId);

        // 3. Initialize column map
        Map<String, List<DeveloperSprintDto.SprintCardDto>> board = new LinkedHashMap<>();
        board.put("To Do", new ArrayList<>());
        board.put("In Progress", new ArrayList<>());
        board.put("Code Review", new ArrayList<>());
        board.put("Testing", new ArrayList<>());
        board.put("Done", new ArrayList<>());

        int myTasksTotal = 0;
        int myTasksCompleted = 0;
        int myTasksInProgress = 0;
        int myTasksToDo = 0;
        int myTasksPoints = 0;
        int myTasksCompletedPoints = 0;

        // 4. Fetch tasks from ScrumTaskRepository (created by Scrum Master)
        List<ScrumTask> scrumTasks = List.of();
        if (sprint != null) {
            scrumTasks = scrumTaskRepository.findBySprintIdOrderByStatusAscTaskKeyAsc(sprint.getId());
        } else if (projectId != null) {
            List<ScrumSprint> projectSprints = scrumSprintRepository.findByProjectId(projectId);
            if (!projectSprints.isEmpty()) {
                scrumTasks = scrumTaskRepository.findBySprintIdOrderByStatusAscTaskKeyAsc(projectSprints.get(0).getId());
            }
        }

        if (scrumTasks.isEmpty()) {
            scrumTasks = scrumTaskRepository.findAll();
        }

        if (!scrumTasks.isEmpty()) {
            for (ScrumTask task : scrumTasks) {
                String status = mapScrumTaskStatus(task.getStatus());
                if (status == null) {
                    continue;
                }

                boolean isMyTask = isTaskAssignedToDeveloper(task, currentUser, currentDevName);
                int points = task.getStoryPoints() != null ? task.getStoryPoints() : 0;
                boolean completed = "Done".equalsIgnoreCase(status);

                if (isMyTask) {
                    myTasksTotal++;
                    myTasksPoints += points;
                    if (completed) {
                        myTasksCompleted++;
                        myTasksCompletedPoints += points;
                    } else if ("In Progress".equalsIgnoreCase(status)
                            || "Code Review".equalsIgnoreCase(status)
                            || "Testing".equalsIgnoreCase(status)) {
                        myTasksInProgress++;
                    } else {
                        myTasksToDo++;
                    }
                }

                String memberInitials = "";
                String assigneeName = "";
                if (task.getAssignee() != null) {
                    assigneeName = task.getAssignee().getName() != null ? task.getAssignee().getName() : "";
                    memberInitials = getInitials(assigneeName);
                }

                DeveloperSprintDto.SprintCardDto card =
                        DeveloperSprintDto.SprintCardDto.builder()
                                .databaseId(task.getId())
                                .id(task.getTaskKey())
                                .title(task.getTitle())
                                .member(memberInitials)
                                .assigneeName(assigneeName)
                                .points(points)
                                .status(status)
                                .priority(task.getPriority() != null ? task.getPriority().name() : "MEDIUM")
                                .isMyTask(isMyTask)
                                .completed(completed)
                                .build();

                board.get(status).add(card);
            }
        } else {
            // Fallback to legacy ScrumBoardTask if scrum_tasks has no data
            List<ScrumBoardTask> legacyTasks = scrumBoardTaskRepository.findAll();
            for (ScrumBoardTask task : legacyTasks) {
                String status = mapLegacyStatus(task.getColumnStatus());
                if (status == null) {
                    continue;
                }

                boolean isMyTask = isLegacyTaskAssigned(task, currentUser, currentDevName);
                int points = task.getPoints() != null ? task.getPoints() : 0;
                boolean completed = "Done".equalsIgnoreCase(status);

                if (isMyTask) {
                    myTasksTotal++;
                    myTasksPoints += points;
                    if (completed) {
                        myTasksCompleted++;
                        myTasksCompletedPoints += points;
                    } else if ("In Progress".equalsIgnoreCase(status)
                            || "Code Review".equalsIgnoreCase(status)
                            || "Testing".equalsIgnoreCase(status)) {
                        myTasksInProgress++;
                    } else {
                        myTasksToDo++;
                    }
                }

                DeveloperSprintDto.SprintCardDto card =
                        DeveloperSprintDto.SprintCardDto.builder()
                                .databaseId(task.getId())
                                .id(task.getTaskCode())
                                .title(task.getTitle())
                                .member(task.getAssigneeInitials())
                                .assigneeName(task.getAssigneeName())
                                .points(points)
                                .status(status)
                                .priority("Medium")
                                .isMyTask(isMyTask)
                                .completed(completed)
                                .build();

                board.get(status).add(card);
            }
        }

        int myProgressPercent = myTasksTotal > 0
                ? (int) Math.round(((double) myTasksCompleted / myTasksTotal) * 100)
                : 0;

        List<DeveloperSprintDto.SprintColumnDto> columns = new ArrayList<>();
        for (Map.Entry<String, List<DeveloperSprintDto.SprintCardDto>> entry : board.entrySet()) {
            columns.add(
                    DeveloperSprintDto.SprintColumnDto.builder()
                            .title(entry.getKey())
                            .count(entry.getValue().size())
                            .cards(entry.getValue())
                            .build()
            );
        }

        return DeveloperSprintDto.builder()
                .sprintId(sprint != null ? sprint.getId() : null)
                .sprintName(sprintName)
                .projectId(activeProjectId)
                .projectName(projectName)
                .myTasksTotal(myTasksTotal)
                .myTasksCompleted(myTasksCompleted)
                .myTasksInProgress(myTasksInProgress)
                .myTasksToDo(myTasksToDo)
                .myTasksPoints(myTasksPoints)
                .myTasksCompletedPoints(myTasksCompletedPoints)
                .myProgressPercent(myProgressPercent)
                .columns(columns)
                .build();
    }

    public DeveloperSprintDto getSprintBoard() {
        return getSprintBoard(null, null, null);
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String email = auth.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private ScrumSprint resolveSprint(Long projectId, Long sprintId) {
        if (sprintId != null) {
            return scrumSprintRepository.findById(sprintId).orElse(null);
        }
        if (projectId != null) {
            return scrumSprintRepository.findFirstByProjectIdAndStatus(projectId, ScrumSprint.Status.ACTIVE)
                    .or(() -> scrumSprintRepository.findFirstByProjectIdOrderBySprintNumberDesc(projectId))
                    .orElse(null);
        }
        return scrumSprintRepository.findCurrentOrLatest().orElse(null);
    }

    private boolean isTaskAssignedToDeveloper(ScrumTask task, User currentUser, String developerName) {
        if (task.getAssignee() == null) {
            return false;
        }

        if (currentUser != null) {
            if (currentUser.getId() != null && task.getAssignee().getId() != null) {
                return currentUser.getId().equals(task.getAssignee().getId());
            }
            if (currentUser.getEmail() != null && task.getAssignee().getEmail() != null) {
                return currentUser.getEmail().equalsIgnoreCase(task.getAssignee().getEmail().trim());
            }
        }

        return false;
    }

    private boolean isLegacyTaskAssigned(ScrumBoardTask task, User currentUser, String developerName) {
        if (task.getAssigneeName() == null) {
            return false;
        }

        if (currentUser != null && currentUser.getName() != null) {
            if (currentUser.getName().equalsIgnoreCase(task.getAssigneeName())) {
                return true;
            }
        }

        if (developerName != null && !developerName.isBlank()) {
            return task.getAssigneeName().equalsIgnoreCase(developerName.trim());
        }

        return false;
    }

    private String getProjectName(Long projectId) {
        if (projectId == null) {
            return "General Project";
        }
        return pmProjectsRepository.findById(projectId)
                .map(PMProject::getProjectName)
                .orElse("Project #" + projectId);
    }

    private String getInitials(String name) {
        if (name == null || name.isBlank()) {
            return "??";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }

    private String mapScrumTaskStatus(ScrumTask.Status status) {
        if (status == null) {
            return "To Do";
        }
        return switch (status) {
            case BACKLOG, SPRINT_READY, TODO, BLOCKED -> "To Do";
            case IN_PROGRESS -> "In Progress";
            case CODE_REVIEW -> "Code Review";
            case TESTING -> "Testing";
            case DONE -> "Done";
        };
    }

    private String mapLegacyStatus(String status) {
        if (status == null) {
            return null;
        }
        return switch (status.trim().toLowerCase()) {
            case "backlog", "to do", "todo" -> "To Do";
            case "in progress", "inprogress" -> "In Progress";
            case "code review", "codereview" -> "Code Review";
            case "testing" -> "Testing";
            case "done" -> "Done";
            default -> "To Do";
        };
    }

    @Transactional
    public void moveTask(Long taskId, String statusName) {
        if (taskId == null || statusName == null || statusName.isBlank()) {
            return;
        }

        User currentUser = getAuthenticatedUser();
        ScrumTask.Status targetStatus = parseTargetStatus(statusName);

        Optional<ScrumTask> optTask = scrumTaskRepository.findById(taskId);
        if (optTask.isPresent()) {
            ScrumTask task = optTask.get();
            if (!isTaskAssignedToDeveloper(task, currentUser, null)) {
                throw new RuntimeException("Permission denied: Developers can only change the status of tasks assigned to them.");
            }
            task.moveTo(targetStatus);
            scrumTaskRepository.save(task);
            return;
        }

        // Fallback to legacy ScrumBoardTask if exists
        Optional<ScrumBoardTask> optLegacy = scrumBoardTaskRepository.findById(taskId);
        if (optLegacy.isPresent()) {
            ScrumBoardTask task = optLegacy.get();
            if (!isLegacyTaskAssigned(task, currentUser, null)) {
                throw new RuntimeException("Permission denied: Developers can only change the status of tasks assigned to them.");
            }
            task.setColumnStatus(statusName);
            scrumBoardTaskRepository.save(task);
        }
    }

    private ScrumTask.Status parseTargetStatus(String statusName) {
        if (statusName == null) {
            return ScrumTask.Status.TODO;
        }
        return switch (statusName.trim().toUpperCase()) {
            case "TO DO", "TODO", "BACKLOG" -> ScrumTask.Status.TODO;
            case "IN PROGRESS", "IN_PROGRESS", "INPROGRESS" -> ScrumTask.Status.IN_PROGRESS;
            case "CODE REVIEW", "CODE_REVIEW", "CODEREVIEW", "REVIEW" -> ScrumTask.Status.CODE_REVIEW;
            case "TESTING" -> ScrumTask.Status.TESTING;
            case "DONE" -> ScrumTask.Status.DONE;
            case "BLOCKED" -> ScrumTask.Status.BLOCKED;
            default -> ScrumTask.Status.TODO;
        };
    }
}