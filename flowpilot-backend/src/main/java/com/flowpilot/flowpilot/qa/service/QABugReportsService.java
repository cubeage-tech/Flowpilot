package com.flowpilot.flowpilot.qa.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.qa.model.QABugReport;
import com.flowpilot.flowpilot.qa.repository.QABugRepository;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;

@Service
public class QABugReportsService {

    private final QABugRepository bugRepository;

    private final PMProjectsRepository pmProjectsRepository;

    public QABugReportsService(
            QABugRepository bugRepository,
            PMProjectsRepository pmProjectsRepository) {

        this.bugRepository = bugRepository;
        this.pmProjectsRepository = pmProjectsRepository;
    }

    public List<QABugReport> getAllBugs() {
        return bugRepository.findAll();
    }

    public QABugReport createBug(QABugReport bug) {
        return bugRepository.save(bug);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getQAAssignees() {

        List<PMProject> projects =
                pmProjectsRepository.findAll();

        Map<Long, Map<String, Object>> uniqueMembers =
                new LinkedHashMap<>();

        for (PMProject project : projects) {

            if (project.getTeamMembers() == null) {
                continue;
            }

            for (SuperAdminUser member :
                    project.getTeamMembers()) {

                if (member == null ||
                       member.getEmployeeId() == null) {

                    continue;
                }

                Map<String, Object> memberData =
                        new LinkedHashMap<>();

                /*
                 * Database ID.
                 */
                memberData.put(
                        "id",
                      member.getEmployeeId()
                );

                /*
                 * Employee ID is kept separately
                 * for display/reference.
                 */
                memberData.put(
                        "employeeId",
                        member.getEmployeeId()
                );

                memberData.put(
                        "fullName",
                        member.getName()
                );

                memberData.put(
                        "email",
                        member.getEmail()
                );

                memberData.put(
                        "designation",
                        member.getDesignation()
                );

                uniqueMembers.putIfAbsent(
                      member.getEmployeeId(),
                        memberData
                );
            }
        }

        return new ArrayList<>(
                uniqueMembers.values()
        );
    }
}