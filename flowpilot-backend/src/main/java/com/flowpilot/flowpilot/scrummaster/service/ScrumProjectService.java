package com.flowpilot.flowpilot.scrummaster.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumProjectDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;

/**
 * Bridges the Project Manager module into the Scrum Master section.
 *
 * Deliberately read-only: projects are the PM module's to create and own, and
 * a sprint only needs to point at one. Reading their repository rather than
 * copying project rows means a renamed project is renamed everywhere at once.
 */
@Service
public class ScrumProjectService {

    private final PMProjectsRepository projectsRepository;

    public ScrumProjectService(PMProjectsRepository projectsRepository) {
        this.projectsRepository = projectsRepository;
    }


    /** Every project a sprint could be attached to, newest name order. */
    public List<ScrumProjectDto.Project> listProjects() {

        List<ScrumProjectDto.Project> projects = new ArrayList<>();

        for (PMProject project : projectsRepository.findAll()) {
            projects.add(toDto(project));
        }

        projects.sort((a, b) -> {
            String left = a.name() == null ? "" : a.name();
            String right = b.name() == null ? "" : b.name();
            return left.compareToIgnoreCase(right);
        });

        return projects;
    }


    public ScrumProjectDto.Project getProject(Long projectId) {

        return toDto(projectsRepository
                .findById(projectId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Project not found: " + projectId)));
    }


    /**
     * The sprint roster, taken from the owning project's team. A sprint has no
     * members of its own: the people are already recorded against the project,
     * and a second list would immediately drift from it.
     */
    public List<ScrumProjectDto.TeamMember> membersOfProject(Long projectId) {

        if (projectId == null) {
            return List.of();
        }

        return getProject(projectId).members();
    }


    private ScrumProjectDto.Project toDto(PMProject project) {

        List<ScrumProjectDto.TeamMember> members = new ArrayList<>();

        // The PM module owns this join and recently moved it from the Admin
        // module's people to SuperAdminUser, so the mapping follows their type.
        // A project with no team is normal early on, not an error.
        List<SuperAdminUser> team = project.getTeamMembers();

        if (team != null) {
            for (SuperAdminUser member : team) {
                members.add(new ScrumProjectDto.TeamMember(
                        member.getEmployeeId(),
                        member.getName(),
                        member.getEmail(),
                        // Their id doubles as the employee identifier
                        member.getEmployeeId() == null
                                ? null
                                : String.valueOf(member.getEmployeeId()),
                        member.getDesignation(),
                        ScrumTask.initialsOf(member.getName())
                ));
            }
        }

        return new ScrumProjectDto.Project(
                project.getId(),
                project.getProjectCode(),
                project.getProjectName(),
                project.getStatus(),
                project.getProgress(),
                project.getStartDate(),
                project.getEndDate(),
                members.size(),
                members
        );
    }
}
