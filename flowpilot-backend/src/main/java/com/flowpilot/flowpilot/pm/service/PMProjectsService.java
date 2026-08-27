package com.flowpilot.flowpilot.pm.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.pm.dto.PMProjectDto;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;

@Service
public class PMProjectsService {

    private final PMProjectsRepository projectRepository;

    private final SuperAdminUserRepository memberRepository;

    public PMProjectsService(
            PMProjectsRepository projectRepository,
            SuperAdminUserRepository memberRepository) {

        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    /* =========================================================
       GET ALL PROJECTS
    ========================================================= */

    @Transactional(readOnly = true)
    public List<PMProjectDto> getAllProjects() {

        List<PMProject> projects =
                projectRepository.findAll();

        List<PMProjectDto> result =
                new ArrayList<>();

        for (PMProject project : projects) {
            result.add(toDto(project));
        }

        return result;
    }

    /* =========================================================
       GET ONE PROJECT
    ========================================================= */

    @Transactional(readOnly = true)
    public PMProjectDto getProject(Long id) {

        PMProject project =
                projectRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Project not found: " + id
                                )
                        );

        return toDto(project);
    }

    /* =========================================================
       GET PROJECT TEAM MEMBERS
    ========================================================= */

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProjectTeamMembers() {

        List<PMProject> projects =
                projectRepository.findAll();

        Map<Long, Map<String, Object>> uniqueMembers =
                new LinkedHashMap<>();

        for (PMProject project : projects) {

            if (project.getTeamMembers() == null) {
                continue;
            }

            for (SuperAdminUser member :
                    project.getTeamMembers()) {

                if (member == null || member.getEmployeeId() == null) {
                    continue;
                }

                Map<String, Object> memberData =
                        new LinkedHashMap<>();

                /*
                 * IMPORTANT:
                 * Use database ID here.
                 */
                memberData.put(
                        "id",
                       member.getEmployeeId()
                );

                memberData.put(
                        "employeeId",
                        member.getEmployeeId()
                );

                memberData.put(
                        "name",
                        member.getName()
                );

                memberData.put(
                        "email",
                        member.getEmail()
                );

                memberData.put(
                        "role",
                        member.getRole()
                );

                memberData.put(
                        "department",
                        member.getDepartment()
                );

                memberData.put(
                        "designation",
                        member.getDesignation()
                );

                memberData.put(
                        "status",
                        member.getStatus()
                );

                uniqueMembers.put(
                       member.getEmployeeId(),
                        memberData
                );
            }
        }

        return new ArrayList<>(
                uniqueMembers.values()
        );
    }

    /* =========================================================
       CREATE PROJECT
    ========================================================= */

    @Transactional
    public PMProjectDto createProject(
            PMProjectDto dto) {

        validateProject(dto);

        String projectCode =
                dto.getProjectCode().trim();

        if (projectRepository.existsByProjectCode(projectCode)) {

            throw new RuntimeException(
                    "Project code already exists: " + projectCode
            );
        }

        PMProject project =
                new PMProject();

        project.setProjectCode(projectCode);

        project.setProjectName(
                dto.getProjectName().trim()
        );

        project.setSprint(dto.getSprint());

        project.setBudget(dto.getBudget());

        project.setStartDate(dto.getStartDate());

        project.setEndDate(dto.getEndDate());

        project.setStatus(dto.getStatus());

        project.setProgress(
                dto.getProgress() == null
                        ? 0
                        : Math.min(
                                100,
                                Math.max(
                                        0,
                                        dto.getProgress()
                                )
                        )
        );

        /*
         * Get SuperAdmin users using their database IDs.
         */
        List<SuperAdminUser> members =
                getMembersByIds(
                        dto.getTeamMemberIds()
                );

        project.setTeamMembers(members);

        PMProject savedProject =
                projectRepository.save(project);

        return toDto(savedProject);
    }

    /* =========================================================
       UPDATE PROJECT
    ========================================================= */

    @Transactional
    public PMProjectDto updateProject(
            Long id,
            PMProjectDto dto) {

        validateProject(dto);

        PMProject existingProject =
                projectRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Project not found: " + id
                                )
                        );

        String newProjectCode =
                dto.getProjectCode().trim();

        /*
         * PROJECT CODE
         */

        if (!existingProject
                .getProjectCode()
                .equals(newProjectCode)) {

            if (projectRepository
                    .existsByProjectCode(newProjectCode)) {

                throw new RuntimeException(
                        "Project code already exists: "
                                + newProjectCode
                );
            }

            existingProject.setProjectCode(
                    newProjectCode
            );
        }

        /*
         * BASIC DETAILS
         */

        existingProject.setProjectName(
                dto.getProjectName().trim()
        );

        existingProject.setSprint(
                dto.getSprint()
        );

        existingProject.setBudget(
                dto.getBudget()
        );

        existingProject.setStartDate(
                dto.getStartDate()
        );

        existingProject.setEndDate(
                dto.getEndDate()
        );

        existingProject.setStatus(
                dto.getStatus()
        );

        if (dto.getProgress() != null) {

            existingProject.setProgress(
                    Math.min(
                            100,
                            Math.max(
                                    0,
                                    dto.getProgress()
                            )
                    )
            );
        }

        /*
         * UPDATE TEAM MEMBERS
         */

        List<SuperAdminUser> members =
                getMembersByIds(
                        dto.getTeamMemberIds()
                );

        existingProject.setTeamMembers(members);

        PMProject savedProject =
                projectRepository.save(existingProject);

        return toDto(savedProject);
    }

    /* =========================================================
       DELETE PROJECT
    ========================================================= */

    @Transactional
    public void deleteProject(Long id) {

        if (!projectRepository.existsById(id)) {

            throw new RuntimeException(
                    "Project not found: " + id
            );
        }

        projectRepository.deleteById(id);
    }

    /* =========================================================
       GET SUPERADMIN USERS BY DATABASE IDs
    ========================================================= */

    private List<SuperAdminUser> getMembersByIds(
            List<Long> memberIds) {

        List<SuperAdminUser> members =
                new ArrayList<>();

        if (memberIds == null ||
                memberIds.isEmpty()) {

            return members;
        }

        for (Long memberId : memberIds) {

            if (memberId == null) {
                continue;
            }

            SuperAdminUser member =
                    memberRepository
                            .findById(memberId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "SuperAdmin user not found: "
                                                    + memberId
                                    )
                            );

            /*
             * Check inactive users.
             */
            if (member.getStatus() != null &&
                    member.getStatus()
                            .equalsIgnoreCase("inactive")) {

                throw new RuntimeException(
                        "SuperAdmin user is inactive: "
                                + memberId
                );
            }

            members.add(member);
        }

        return members;
    }

    /* =========================================================
       VALIDATION
    ========================================================= */

    private void validateProject(
            PMProjectDto dto) {

        if (dto == null) {
            throw new RuntimeException(
                    "Project data cannot be null"
            );
        }

        if (dto.getProjectCode() == null ||
                dto.getProjectCode().trim().isEmpty()) {

            throw new RuntimeException(
                    "Project code is required"
            );
        }

        if (dto.getProjectName() == null ||
                dto.getProjectName().trim().isEmpty()) {

            throw new RuntimeException(
                    "Project name is required"
            );
        }

        if (dto.getStartDate() != null &&
                dto.getEndDate() != null &&
                dto.getEndDate()
                        .isBefore(dto.getStartDate())) {

            throw new RuntimeException(
                    "End date cannot be before start date"
            );
        }
    }

    /* =========================================================
       ENTITY -> DTO
    ========================================================= */

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
         * Return SuperAdminUser DATABASE IDs.
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