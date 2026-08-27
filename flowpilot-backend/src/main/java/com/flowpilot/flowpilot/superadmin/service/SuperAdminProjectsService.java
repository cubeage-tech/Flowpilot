package com.flowpilot.flowpilot.superadmin.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.pm.dto.PMProjectDto;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;

@Service
public class SuperAdminProjectsService {

    private final PMProjectsRepository pmProjectsRepository;

    public SuperAdminProjectsService(
            PMProjectsRepository pmProjectsRepository) {

        this.pmProjectsRepository = pmProjectsRepository;
    }

    @Transactional(readOnly = true)
    public List<PMProjectDto> getAllProjects() {

        List<PMProject> projects =
                pmProjectsRepository.findAll();

        List<PMProjectDto> result =
                new ArrayList<>();

        for (PMProject project : projects) {
            result.add(toDto(project));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public PMProjectDto getProject(Long id) {

        PMProject project =
                pmProjectsRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Project not found: " + id
                                )
                        );

        return toDto(project);
    }

    private PMProjectDto toDto(
            PMProject project) {

        PMProjectDto dto =
                new PMProjectDto();

        dto.setId(project.getId());

        dto.setProjectCode(
                project.getProjectCode()
        );

        dto.setProjectName(
                project.getProjectName()
        );

        dto.setSprint(
                project.getSprint()
        );

        dto.setBudget(
                project.getBudget()
        );

        dto.setStartDate(
                project.getStartDate()
        );

        dto.setEndDate(
                project.getEndDate()
        );

        dto.setStatus(
                project.getStatus()
        );

        dto.setProgress(
                project.getProgress()
        );

        /*
         * SuperAdminUser.id is Long.
         *
         * Do NOT use:
         *
         * member.getEmployeeId()
         *
         * because employeeId is String.
         */
        List<Long> memberIds =
                new ArrayList<>();

        if (project.getTeamMembers() != null) {

            for (SuperAdminUser member :
                    project.getTeamMembers()) {

                if (member != null &&
                       member.getEmployeeId() != null) {

                    memberIds.add(
                         member.getEmployeeId()
                    );
                }
            }
        }

        dto.setTeamMemberIds(memberIds);

        return dto;
    }
}