package com.flowpilot.flowpilot.viewer.service;

import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;
import com.flowpilot.flowpilot.viewer.dto.ViewerDashboardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ViewerDashboardService {

    private final PMProjectsRepository pmProjectsRepository;
    private final ScrumSprintRepository scrumSprintRepository;
    private final ScrumTaskRepository scrumTaskRepository;
    private final SuperAdminUserRepository superAdminUserRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ViewerDashboardDto getDashboardOverview() {
        List<PMProject> pmProjects = pmProjectsRepository.findAll();
        List<ScrumSprint> allSprints = scrumSprintRepository.findAll();
        List<ScrumTask> allTasks = scrumTaskRepository.findAll();

        int totalProjects = pmProjects.size();
        int activeProjects = 0;
        int atRiskProjects = 0;
        int completedProjects = 0;

        int totalStoryPoints = 0;
        int completedStoryPoints = 0;
        int totalTasksCount = 0;
        int completedTasksCount = 0;

        Set<Long> uniqueMemberIds = new HashSet<>();
        List<ViewerDashboardDto.ViewerProjectCardDto> projectCards = new ArrayList<>();

        for (PMProject project : pmProjects) {
            String status = project.getStatus() != null ? project.getStatus() : "Active";
            String statusLower = status.toLowerCase();

            boolean isCompleted = statusLower.contains("completed") || statusLower.contains("done");
            boolean isRisk = statusLower.contains("risk");
            boolean isDelayed = statusLower.contains("delay");

            if (isCompleted) {
                completedProjects++;
            } else {
                activeProjects++;
            }

            if (isRisk || isDelayed) {
                atRiskProjects++;
            }

            // Find project sprints & tasks
            List<ScrumSprint> projectSprints = allSprints.stream()
                    .filter(s -> s.getProjectId() != null && s.getProjectId().equals(project.getId()))
                    .toList();

            ScrumSprint activeSprint = projectSprints.stream()
                    .filter(s -> s.getStatus() == ScrumSprint.Status.ACTIVE)
                    .findFirst()
                    .orElse(projectSprints.isEmpty() ? null : projectSprints.get(0));

            String sprintName = activeSprint != null ? activeSprint.getName()
                    : (project.getSprint() != null && !project.getSprint().isBlank() ? project.getSprint() : "No Active Sprint");

            List<ScrumTask> projectTasks = allTasks.stream()
                    .filter(t -> t.getSprint() != null && t.getSprint().getProjectId() != null && t.getSprint().getProjectId().equals(project.getId()))
                    .toList();

            int projectTasksTotal = projectTasks.size();
            int projectTasksCompleted = (int) projectTasks.stream()
                    .filter(t -> t.getStatus() == ScrumTask.Status.DONE)
                    .count();

            int projectPointsTotal = projectTasks.stream()
                    .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                    .sum();

            int projectPointsCompleted = projectTasks.stream()
                    .filter(t -> t.getStatus() == ScrumTask.Status.DONE)
                    .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                    .sum();

            totalTasksCount += projectTasksTotal;
            completedTasksCount += projectTasksCompleted;
            totalStoryPoints += projectPointsTotal;
            completedStoryPoints += projectPointsCompleted;

            // Calculate real-time progress
            int calculatedProgress;
            if (projectTasksTotal > 0) {
                calculatedProgress = Math.min(100, Math.round((float) projectTasksCompleted / projectTasksTotal * 100));
            } else if (project.getProgress() != null) {
                calculatedProgress = Math.min(100, Math.max(0, project.getProgress()));
            } else {
                calculatedProgress = isCompleted ? 100 : 0;
            }

            // Collect team members
            List<String> memberNames = new ArrayList<>();
            if (project.getTeamMembers() != null && !project.getTeamMembers().isEmpty()) {
                for (SuperAdminUser member : project.getTeamMembers()) {
                    if (member != null) {
                        if (member.getEmployeeId() != null) {
                            uniqueMemberIds.add(member.getEmployeeId());
                        }
                        memberNames.add(member.getName() != null ? member.getName() : member.getEmail());
                    }
                }
            }

            String pmDisplay = memberNames.isEmpty() ? "—" : memberNames.get(0);

            projectCards.add(ViewerDashboardDto.ViewerProjectCardDto.builder()
                    .id(project.getId())
                    .projectCode(project.getProjectCode() != null ? project.getProjectCode() : "PRJ-" + project.getId())
                    .projectName(project.getProjectName())
                    .pm(pmDisplay)
                    .sprint(sprintName)
                    .progress(calculatedProgress)
                    .status(status)
                    .tasksTotal(projectTasksTotal)
                    .tasksCompleted(projectTasksCompleted)
                    .storyPointsTotal(projectPointsTotal)
                    .storyPointsCompleted(projectPointsCompleted)
                    .memberCount(memberNames.size())
                    .memberNames(memberNames)
                    .build());
        }

        int activeSprintsCount = (int) allSprints.stream()
                .filter(s -> s.getStatus() == ScrumSprint.Status.ACTIVE)
                .count();

        int overallProgress = totalProjects > 0
                ? Math.round((float) projectCards.stream().mapToInt(ViewerDashboardDto.ViewerProjectCardDto::getProgress).sum() / totalProjects)
                : 0;

        int totalTeamMembers = uniqueMemberIds.isEmpty() ? (int) userRepository.count() : uniqueMemberIds.size();

        return ViewerDashboardDto.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .atRiskProjects(atRiskProjects)
                .completedProjects(completedProjects)
                .totalSprints(allSprints.size())
                .activeSprints(activeSprintsCount)
                .totalStoryPoints(totalStoryPoints)
                .completedStoryPoints(completedStoryPoints)
                .totalTasks(totalTasksCount)
                .completedTasks(completedTasksCount)
                .overallProgress(overallProgress)
                .totalTeamMembers(totalTeamMembers)
                .projects(projectCards)
                .build();
    }
}
