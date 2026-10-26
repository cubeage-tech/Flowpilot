package com.flowpilot.flowpilot.viewer.service;

import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;
import com.flowpilot.flowpilot.viewer.dto.ViewerSprintStatusDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ViewerSprintStatusService {

    private final PMProjectsRepository pmProjectsRepository;
    private final ScrumSprintRepository scrumSprintRepository;
    private final ScrumTaskRepository scrumTaskRepository;

    @Transactional(readOnly = true)
    public ViewerSprintStatusDto getSprintStatusOverview() {
        List<PMProject> pmProjects = pmProjectsRepository.findAll();
        Map<Long, String> projectNames = new HashMap<>();
        for (PMProject p : pmProjects) {
            String label = p.getProjectCode() != null && !p.getProjectCode().isBlank()
                    ? p.getProjectCode() + " - " + p.getProjectName()
                    : p.getProjectName();
            projectNames.put(p.getId(), label);
        }

        List<ScrumSprint> allSprints = scrumSprintRepository.findAll();
        List<ScrumTask> allTasks = scrumTaskRepository.findAll();

        int activeSprintsCount = 0;
        int totalTasksCompleted = 0;
        int totalTasksRemaining = 0;
        int totalTasks = 0;
        int totalCommittedPoints = 0;
        int totalCompletedPoints = 0;

        List<ViewerSprintStatusDto.ViewerSprintItemDto> sprintItems = new ArrayList<>();

        LocalDate today = LocalDate.now();

        for (ScrumSprint sprint : allSprints) {
            if (sprint == null) continue;

            String statusStr = sprint.getStatus() != null ? sprint.getStatus().name() : "PLANNED";
            if (sprint.getStatus() == ScrumSprint.Status.ACTIVE) {
                activeSprintsCount++;
            }

            Long projId = sprint.getProjectId();
            String projName = projId != null && projectNames.containsKey(projId)
                    ? projectNames.get(projId)
                    : (projId != null ? "Project #" + projId : "General Project");

            // Filter tasks for this sprint
            List<ScrumTask> tasks = allTasks.stream()
                    .filter(t -> t.getSprint() != null && t.getSprint().getId() != null && t.getSprint().getId().equals(sprint.getId()))
                    .toList();

            int done = 0;
            int inProgress = 0;
            int todo = 0;
            int sprintDonePoints = 0;
            int sprintTotalPoints = 0;

            for (ScrumTask task : tasks) {
                int pts = task.getStoryPoints() != null ? task.getStoryPoints() : 0;
                sprintTotalPoints += pts;

                if (task.getStatus() == ScrumTask.Status.DONE) {
                    done++;
                    sprintDonePoints += pts;
                } else if (task.getStatus() == ScrumTask.Status.IN_PROGRESS
                        || task.getStatus() == ScrumTask.Status.CODE_REVIEW
                        || task.getStatus() == ScrumTask.Status.TESTING) {
                    inProgress++;
                } else {
                    todo++;
                }
            }

            int sprintTotalTasks = tasks.size();
            int remainingTasks = inProgress + todo;

            int completion = sprintTotalTasks > 0
                    ? Math.round((float) done / sprintTotalTasks * 100)
                    : (sprint.getStatus() == ScrumSprint.Status.COMPLETED ? 100 : 0);

            int committedPoints = sprint.getCommittedPoints() != null && sprint.getCommittedPoints() > 0
                    ? sprint.getCommittedPoints()
                    : sprintTotalPoints;

            int pointsCompletion = committedPoints > 0
                    ? Math.min(100, Math.round((float) sprintDonePoints / committedPoints * 100))
                    : completion;

            totalTasksCompleted += done;
            totalTasksRemaining += remainingTasks;
            totalTasks += sprintTotalTasks;
            totalCommittedPoints += committedPoints;
            totalCompletedPoints += sprintDonePoints;

            int daysRemaining = 0;
            if (sprint.getEndDate() != null) {
                long diff = ChronoUnit.DAYS.between(today, sprint.getEndDate());
                daysRemaining = (int) Math.max(0, diff);
            }

            String health = "On Track";
            if (completion >= 70 || sprint.getStatus() == ScrumSprint.Status.COMPLETED) {
                health = "On Track";
            } else if (completion >= 40) {
                health = "In Progress";
            } else if (daysRemaining <= 3 && sprint.getStatus() == ScrumSprint.Status.ACTIVE) {
                health = "At Risk";
            } else {
                health = "Needs Attention";
            }

            sprintItems.add(ViewerSprintStatusDto.ViewerSprintItemDto.builder()
                    .id(sprint.getId())
                    .projectId(projId)
                    .project(projName)
                    .sprint(sprint.getName() != null ? sprint.getName() : "Sprint " + sprint.getSprintNumber())
                    .sprintNumber(sprint.getSprintNumber())
                    .status(statusStr)
                    .done(done)
                    .inProgress(inProgress)
                    .todo(todo)
                    .totalTasks(sprintTotalTasks)
                    .completion(completion)
                    .committedPoints(committedPoints)
                    .completedPoints(sprintDonePoints)
                    .pointsCompletion(pointsCompletion)
                    .startDate(sprint.getStartDate() != null ? sprint.getStartDate().toString() : null)
                    .endDate(sprint.getEndDate() != null ? sprint.getEndDate().toString() : null)
                    .daysRemaining(daysRemaining)
                    .health(health)
                    .build());
        }

        // If no sprints in DB yet, synthesize an informative item from PM projects
        if (sprintItems.isEmpty()) {
            for (PMProject p : pmProjects) {
                int progress = p.getProgress() != null ? p.getProgress() : 0;
                String sprintName = p.getSprint() != null && !p.getSprint().isBlank() ? p.getSprint() : "Sprint 1";
                sprintItems.add(ViewerSprintStatusDto.ViewerSprintItemDto.builder()
                        .id(p.getId())
                        .projectId(p.getId())
                        .project(p.getProjectCode() != null ? p.getProjectCode() + " - " + p.getProjectName() : p.getProjectName())
                        .sprint(sprintName)
                        .sprintNumber(1)
                        .status("ACTIVE")
                        .done(progress >= 100 ? 5 : Math.round(progress / 20f))
                        .inProgress(progress < 100 && progress > 0 ? 2 : 0)
                        .todo(progress < 100 ? 3 : 0)
                        .totalTasks(10)
                        .completion(progress)
                        .committedPoints(30)
                        .completedPoints(Math.round(30 * (progress / 100f)))
                        .pointsCompletion(progress)
                        .startDate(LocalDate.now().minusDays(5).toString())
                        .endDate(LocalDate.now().plusDays(9).toString())
                        .daysRemaining(9)
                        .health(progress >= 70 ? "On Track" : (progress >= 40 ? "In Progress" : "At Risk"))
                        .build());
            }
        }

        int overallCompletionRate = totalTasks > 0
                ? Math.round((float) totalTasksCompleted / totalTasks * 100)
                : 0;

        return ViewerSprintStatusDto.builder()
                .activeSprintsCount(activeSprintsCount)
                .totalTasksCompleted(totalTasksCompleted)
                .totalTasksRemaining(totalTasksRemaining)
                .totalTasks(totalTasks)
                .overallCompletionRate(overallCompletionRate)
                .totalStoryPointsCommitted(totalCommittedPoints)
                .totalStoryPointsCompleted(totalCompletedPoints)
                .sprints(sprintItems)
                .build();
    }
}
