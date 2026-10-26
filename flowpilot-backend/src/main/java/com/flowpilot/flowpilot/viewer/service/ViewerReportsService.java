package com.flowpilot.flowpilot.viewer.service;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.qa.model.QATestCase;
import com.flowpilot.flowpilot.qa.repository.QABugRepository;
import com.flowpilot.flowpilot.qa.repository.QATestCaseRepository;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;
import com.flowpilot.flowpilot.viewer.dto.ViewerReportDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ViewerReportsService {

    private final PMProjectsRepository pmProjectsRepository;
    private final ScrumSprintRepository scrumSprintRepository;
    private final ScrumTaskRepository scrumTaskRepository;
    private final QATestCaseRepository qaTestCaseRepository;
    private final QABugRepository qaBugRepository;
    private final SuperAdminUserRepository superAdminUserRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ViewerReportDto getReportsOverview() {
        List<PMProject> pmProjects = pmProjectsRepository.findAll();
        List<ScrumSprint> sprints = scrumSprintRepository.findAll();
        List<ScrumTask> tasks = scrumTaskRepository.findAll();
        List<QATestCase> testCases = qaTestCaseRepository.findAll();
        List<User> users = userRepository.findAll();
        List<SuperAdminUser> superUsers = superAdminUserRepository.findAll();

        // 1. Project Overview Report
        int totalProjects = pmProjects.size();
        int activeProjects = 0;
        int delayedProjects = 0;
        int totalProgress = 0;
        List<Map<String, Object>> projectBreakdown = new ArrayList<>();

        for (PMProject p : pmProjects) {
            String status = p.getStatus() != null ? p.getStatus() : "Active";
            int progress = p.getProgress() != null ? Math.min(100, Math.max(0, p.getProgress())) : 0;
            totalProgress += progress;

            if (status.toLowerCase().contains("delay") || status.toLowerCase().contains("risk")) {
                delayedProjects++;
            }
            if (!status.toLowerCase().contains("completed") && !status.toLowerCase().contains("done")) {
                activeProjects++;
            }

            Map<String, Object> pMap = new HashMap<>();
            pMap.put("id", p.getId());
            pMap.put("code", p.getProjectCode() != null ? p.getProjectCode() : "PRJ-" + p.getId());
            pMap.put("name", p.getProjectName());
            pMap.put("status", status);
            pMap.put("progress", progress);
            pMap.put("members", p.getTeamMembers() != null ? p.getTeamMembers().size() : 0);
            projectBreakdown.add(pMap);
        }

        int avgProgress = totalProjects > 0 ? Math.round((float) totalProgress / totalProjects) : 0;
        int healthScore = totalProjects > 0 ? Math.max(0, 100 - (delayedProjects * 100 / totalProjects)) : 100;

        ViewerReportDto.ProjectOverviewReport projectOverview = ViewerReportDto.ProjectOverviewReport.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .delayedProjects(delayedProjects)
                .overallProgress(avgProgress)
                .averageHealthScore(healthScore)
                .projectBreakdown(projectBreakdown)
                .build();

        // 2. Sprint Summary Report
        int activeSprints = 0;
        int completedSprints = 0;
        int plannedPoints = 0;
        int completedPoints = 0;
        List<Map<String, Object>> sprintList = new ArrayList<>();

        for (ScrumSprint s : sprints) {
            if (s.getStatus() == ScrumSprint.Status.ACTIVE) activeSprints++;
            if (s.getStatus() == ScrumSprint.Status.COMPLETED) completedSprints++;

            int pts = s.getCommittedPoints() != null ? s.getCommittedPoints() : 0;
            plannedPoints += pts;

            List<ScrumTask> sprintTasks = tasks.stream()
                    .filter(t -> t.getSprint() != null && t.getSprint().getId() != null && t.getSprint().getId().equals(s.getId()))
                    .toList();

            int donePts = sprintTasks.stream()
                    .filter(t -> t.getStatus() == ScrumTask.Status.DONE)
                    .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                    .sum();

            completedPoints += donePts;

            Map<String, Object> sMap = new HashMap<>();
            sMap.put("id", s.getId());
            sMap.put("name", s.getName() != null ? s.getName() : "Sprint " + s.getSprintNumber());
            sMap.put("status", s.getStatus() != null ? s.getStatus().name() : "PLANNED");
            sMap.put("plannedPoints", pts);
            sMap.put("completedPoints", donePts);
            sMap.put("tasksCount", sprintTasks.size());
            sprintList.add(sMap);
        }

        int sprintCompletionRate = plannedPoints > 0 ? Math.round((float) completedPoints / plannedPoints * 100) : 0;

        ViewerReportDto.SprintSummaryReport sprintSummary = ViewerReportDto.SprintSummaryReport.builder()
                .activeSprints(activeSprints)
                .completedSprints(completedSprints)
                .totalPlannedPoints(plannedPoints)
                .totalCompletedPoints(completedPoints)
                .sprintCompletionRate(sprintCompletionRate)
                .sprintList(sprintList)
                .build();

        // 3. Team Productivity Report
        int totalDoneTasks = (int) tasks.stream().filter(t -> t.getStatus() == ScrumTask.Status.DONE).count();
        int activeContributors = (int) tasks.stream()
                .filter(t -> t.getAssignee() != null)
                .map(t -> t.getAssignee().getId())
                .distinct()
                .count();

        if (activeContributors == 0) {
            activeContributors = Math.max(1, users.size());
        }

        double velocity = sprints.isEmpty() ? completedPoints : (double) completedPoints / Math.max(1, sprints.size());

        List<Map<String, Object>> deptProductivity = new ArrayList<>();
        Map<String, Integer> deptDoneCounts = new HashMap<>();
        for (ScrumTask t : tasks) {
            if (t.getStatus() == ScrumTask.Status.DONE && t.getAssignee() != null) {
                String dept = t.getAssignee().getRole() != null ? t.getAssignee().getRole() : "Engineering";
                deptDoneCounts.put(dept, deptDoneCounts.getOrDefault(dept, 0) + 1);
            }
        }
        for (Map.Entry<String, Integer> entry : deptDoneCounts.entrySet()) {
            Map<String, Object> dMap = new HashMap<>();
            dMap.put("department", entry.getKey());
            dMap.put("completedTasks", entry.getValue());
            deptProductivity.add(dMap);
        }

        ViewerReportDto.TeamProductivityReport teamProductivity = ViewerReportDto.TeamProductivityReport.builder()
                .totalPointsDelivered(completedPoints)
                .totalTasksCompleted(totalDoneTasks)
                .activeContributors(activeContributors)
                .averageVelocity(Math.round(velocity * 10.0) / 10.0)
                .departmentProductivity(deptProductivity)
                .build();

        // 4. Quality Report
        int totalTests = testCases.size();
        int passedTests = (int) testCases.stream().filter(tc -> "Passed".equalsIgnoreCase(tc.getStatus())).count();
        int failedTests = (int) testCases.stream().filter(tc -> "Failed".equalsIgnoreCase(tc.getStatus())).count();
        int pendingTests = totalTests - (passedTests + failedTests);
        int passRate = totalTests > 0 ? Math.round((float) passedTests / totalTests * 100) : 100;

        int totalBugs = 0;
        int resolvedBugs = 0;
        try {
            var bugs = qaBugRepository.findAll();
            totalBugs = bugs.size();
            resolvedBugs = (int) bugs.stream().filter(b -> b.getStatus() != null && (b.getStatus().equalsIgnoreCase("Resolved") || b.getStatus().equalsIgnoreCase("Closed"))).count();
        } catch (Exception ignored) {}

        int bugResolutionRate = totalBugs > 0 ? Math.round((float) resolvedBugs / totalBugs * 100) : 100;

        ViewerReportDto.QualityReport qualityMetrics = ViewerReportDto.QualityReport.builder()
                .totalTestCases(totalTests)
                .passedTests(passedTests)
                .failedTests(failedTests)
                .pendingTests(pendingTests)
                .testPassRate(passRate)
                .openBugs(totalBugs - resolvedBugs)
                .resolvedBugs(resolvedBugs)
                .bugResolutionRate(bugResolutionRate)
                .build();

        // 5. Resource Allocation Report
        Map<String, Integer> deptDistribution = new LinkedHashMap<>();
        for (SuperAdminUser su : superUsers) {
            String dept = su.getDepartment() != null && !su.getDepartment().isBlank() ? su.getDepartment() : "Engineering";
            deptDistribution.put(dept, deptDistribution.getOrDefault(dept, 0) + 1);
        }
        if (deptDistribution.isEmpty()) {
            for (User u : users) {
                String role = u.getRole() != null ? u.getRole() : "Member";
                deptDistribution.put(role, deptDistribution.getOrDefault(role, 0) + 1);
            }
        }

        List<Map<String, Object>> projectAllocations = new ArrayList<>();
        for (PMProject p : pmProjects) {
            Map<String, Object> pa = new HashMap<>();
            pa.put("projectName", p.getProjectName());
            pa.put("allocatedCount", p.getTeamMembers() != null ? p.getTeamMembers().size() : 0);
            projectAllocations.add(pa);
        }

        ViewerReportDto.ResourceAllocationReport resourceAllocation = ViewerReportDto.ResourceAllocationReport.builder()
                .totalMembers(users.size())
                .departmentDistribution(deptDistribution)
                .projectAllocations(projectAllocations)
                .build();

        // 6. Release Readiness Report
        int totalFeatures = tasks.size();
        int completedFeatures = totalDoneTasks;
        int blockersCount = (int) tasks.stream().filter(t -> t.getBlockedReason() != null && !t.getBlockedReason().isBlank()).count();
        int passedRate = totalFeatures > 0 ? Math.round((float) completedFeatures / totalFeatures * 100) : 85;
        int readinessScore = Math.min(100, Math.max(0, passedRate - (blockersCount * 5)));

        String releaseStatus = readinessScore >= 80 ? "READY FOR DEPLOYMENT" : (readinessScore >= 50 ? "IN PROGRESS" : "NEEDS ACTION");

        ViewerReportDto.ReleaseReadinessReport releaseReadiness = ViewerReportDto.ReleaseReadinessReport.builder()
                .readinessScore(readinessScore)
                .totalFeatures(totalFeatures)
                .completedFeatures(completedFeatures)
                .openBlockers(blockersCount)
                .passedVerificationRate(passRate)
                .releaseStatus(releaseStatus)
                .build();

        return ViewerReportDto.builder()
                .projectOverview(projectOverview)
                .sprintSummary(sprintSummary)
                .teamProductivity(teamProductivity)
                .qualityMetrics(qualityMetrics)
                .resourceAllocation(resourceAllocation)
                .releaseReadiness(releaseReadiness)
                .build();
    }
}
