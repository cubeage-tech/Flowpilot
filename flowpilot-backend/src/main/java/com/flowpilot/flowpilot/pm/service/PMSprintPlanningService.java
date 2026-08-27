package com.flowpilot.flowpilot.pm.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.pm.dto.PMSprintDto;
import com.flowpilot.flowpilot.pm.model.PMSprint;
import com.flowpilot.flowpilot.pm.repository.PMSprintRepository;

@Service
public class PMSprintPlanningService {

    private final PMSprintRepository sprintRepository;

    public PMSprintPlanningService(
            PMSprintRepository sprintRepository) {

        this.sprintRepository = sprintRepository;
    }


    /*
     * =========================================================
     * GET ALL SPRINTS
     * =========================================================
     */

    @Transactional(readOnly = true)
    public List<PMSprintDto> getAllSprints() {

        List<PMSprint> sprints =
                sprintRepository.findAll();

        List<PMSprintDto> result =
                new ArrayList<>();

        for (PMSprint sprint : sprints) {
            result.add(toDto(sprint));
        }

        return result;
    }


    /*
     * =========================================================
     * GET SPRINT BY ID
     * =========================================================
     */

    @Transactional(readOnly = true)
    public PMSprintDto getSprint(Long id) {

        PMSprint sprint =
                sprintRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Sprint not found: " + id
                                )
                        );

        return toDto(sprint);
    }


    /*
     * =========================================================
     * GET SPRINTS BY PROJECT
     * =========================================================
     */

    @Transactional(readOnly = true)
    public List<PMSprintDto> getSprintsByProject(
            Long projectId) {

        List<PMSprint> sprints =
                sprintRepository
                        .findByProjectId(projectId);

        List<PMSprintDto> result =
                new ArrayList<>();

        for (PMSprint sprint : sprints) {
            result.add(toDto(sprint));
        }

        return result;
    }


    /*
     * =========================================================
     * ENTITY -> DTO
     * =========================================================
     */

    private PMSprintDto toDto(
            PMSprint sprint) {

        PMSprintDto dto =
                new PMSprintDto();


        dto.setId(
                sprint.getId()
        );


        /*
         * PROJECT
         */

        if (sprint.getProject() != null) {

            dto.setProjectId(
                    sprint.getProject().getId()
            );

            dto.setProjectCode(
                    sprint.getProject().getProjectCode()
            );

            dto.setProjectName(
                    sprint.getProject().getProjectName()
            );
        }


        /*
         * SPRINT
         */

        dto.setSprint(
                sprint.getSprint()
        );


        /*
         * DATES
         */

        dto.setStartDate(
                sprint.getStartDate()
        );

        dto.setEndDate(
                sprint.getEndDate()
        );


        /*
         * STATUS
         */

        dto.setStatus(
                sprint.getStatus()
        );


        /*
         * PROGRESS
         */

        dto.setProgress(
                sprint.getProgress() == null
                        ? 0
                        : sprint.getProgress()
        );


        /*
         * STORY POINTS
         */

        dto.setCompletedStoryPoints(
                sprint.getCompletedStoryPoints() == null
                        ? 0
                        : sprint.getCompletedStoryPoints()
        );

        dto.setPlannedStoryPoints(
                sprint.getPlannedStoryPoints() == null
                        ? 0
                        : sprint.getPlannedStoryPoints()
        );


        /*
         * TASKS
         */

        dto.setTotalTasks(
                sprint.getTotalTasks() == null
                        ? 0
                        : sprint.getTotalTasks()
        );

        dto.setCompletedTasks(
                sprint.getCompletedTasks() == null
                        ? 0
                        : sprint.getCompletedTasks()
        );


        /*
         * VELOCITY
         */

        dto.setVelocity(
                sprint.getVelocity() == null
                        ? 0
                        : sprint.getVelocity()
        );


        /*
         * DAYS LEFT
         */

        dto.setDaysLeft(
                calculateDaysLeft(
                        sprint.getEndDate()
                )
        );


        return dto;
    }


    /*
     * =========================================================
     * CALCULATE DAYS LEFT
     * =========================================================
     */

    private Long calculateDaysLeft(
            LocalDate endDate) {

        if (endDate == null) {
            return null;
        }

        return ChronoUnit.DAYS.between(
                LocalDate.now(),
                endDate
        );
    }
}