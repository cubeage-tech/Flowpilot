package com.flowpilot.flowpilot.viewer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViewerReportDto {

    private ProjectOverviewReport projectOverview;
    private SprintSummaryReport sprintSummary;
    private TeamProductivityReport teamProductivity;
    private QualityReport qualityMetrics;
    private ResourceAllocationReport resourceAllocation;
    private ReleaseReadinessReport releaseReadiness;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectOverviewReport {
        private int totalProjects;
        private int activeProjects;
        private int delayedProjects;
        private int overallProgress;
        private int averageHealthScore;
        private List<Map<String, Object>> projectBreakdown;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintSummaryReport {
        private int activeSprints;
        private int completedSprints;
        private int totalPlannedPoints;
        private int totalCompletedPoints;
        private int sprintCompletionRate;
        private List<Map<String, Object>> sprintList;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamProductivityReport {
        private int totalPointsDelivered;
        private int totalTasksCompleted;
        private int activeContributors;
        private double averageVelocity;
        private List<Map<String, Object>> departmentProductivity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityReport {
        private int totalTestCases;
        private int passedTests;
        private int failedTests;
        private int pendingTests;
        private int testPassRate;
        private int openBugs;
        private int resolvedBugs;
        private int bugResolutionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceAllocationReport {
        private int totalMembers;
        private Map<String, Integer> departmentDistribution;
        private List<Map<String, Object>> projectAllocations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReleaseReadinessReport {
        private int readinessScore;
        private int totalFeatures;
        private int completedFeatures;
        private int openBlockers;
        private int passedVerificationRate;
        private String releaseStatus;
    }
}
