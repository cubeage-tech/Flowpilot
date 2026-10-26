package com.flowpilot.flowpilot.scrummaster.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
@Transactional(readOnly = true)
public class ScrumProjectService {

    private final PMProjectsRepository projectsRepository;

    public ScrumProjectService(PMProjectsRepository projectsRepository) {
        this.projectsRepository = projectsRepository;
    }


    /** Every project a sprint could be attached to, newest name order. */
    public List<ScrumProjectDto.Project> listProjects() {

        List<ScrumProjectDto.Project> projects = new ArrayList<>();

        for (PMProject project : projectsRepository.findAll()) {
            if (project != null) {
                projects.add(toDto(project));
            }
        }

        projects.sort((a, b) -> {
            String left = a.name() == null ? "" : a.name();
            String right = b.name() == null ? "" : b.name();
            return left.compareToIgnoreCase(right);
        });

        return projects;
    }


    @SuppressWarnings("null")
    public java.util.Optional<ScrumProjectDto.Project> findProject(Long projectId) {

        if (projectId == null) {
            return java.util.Optional.empty();
        }

        return projectsRepository.findById(projectId).map(this::toDto);
    }


    @SuppressWarnings("null")
    public ScrumProjectDto.Project getProject(Long projectId) {

        return findProject(projectId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Project not found: " + projectId));
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

        return findProject(projectId)
                .map(ScrumProjectDto.Project::members)
                .orElseGet(List::of);
    }


    private ScrumProjectDto.Project toDto(PMProject project) {

        List<ScrumProjectDto.TeamMember> members = new ArrayList<>();

        if (project == null) {
            return new ScrumProjectDto.Project(null, null, null, null, null, null, null, 0, members);
        }

        // The PM module owns this join and recently moved it from the Admin
        // module's people to SuperAdminUser, so the mapping follows their type.
        // A project with no team is normal early on, not an error.
        List<SuperAdminUser> team = project.getTeamMembers();

        if (team != null) {
            for (SuperAdminUser member : team) {
                if (member == null) continue;
                String memberName = member.getName() != null ? member.getName() : "Team Member";
                members.add(new ScrumProjectDto.TeamMember(
                        member.getEmployeeId(),
                        memberName,
                        member.getEmail(),
                        member.getEmployeeId() == null
                                ? null
                                : String.valueOf(member.getEmployeeId()),
                        member.getDesignation(),
                        ScrumTask.initialsOf(memberName)
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
