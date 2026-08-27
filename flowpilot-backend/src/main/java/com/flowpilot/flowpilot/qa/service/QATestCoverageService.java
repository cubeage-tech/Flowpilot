package com.flowpilot.flowpilot.qa.service;

import com.flowpilot.flowpilot.qa.dto.QATestCoverageDto;
import com.flowpilot.flowpilot.qa.dto.QATestCoverageDto.ModuleCoverageDto;
import com.flowpilot.flowpilot.qa.model.QATestCase;
import com.flowpilot.flowpilot.qa.repository.QATestCaseRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QATestCoverageService {

    private final QATestCaseRepository testCaseRepository;

    @Transactional(readOnly = true)
    public QATestCoverageDto getCoverage() {

        List<QATestCase> testCases =
                testCaseRepository.findAll();

        int totalTestCases =
                testCases.size();

        int executed = 0;
        int passed = 0;
        int failedBlocked = 0;

        Map<String, ModuleStats> moduleMap =
                new LinkedHashMap<>();

        for (QATestCase testCase : testCases) {

            if (testCase == null) {
                continue;
            }

            String status =
                    normalize(
                            testCase.getStatus()
                    );

            if (isExecuted(status)) {
                executed++;
            }

            if ("passed".equals(status)) {
                passed++;
            }

            if ("failed".equals(status)
                    || "blocked".equals(status)) {

                failedBlocked++;
            }

            /*
             * We use the existing project field as the
             * current module/group value.
             */
            String module =
                    testCase.getProject();

            if (module == null ||
                    module.trim().isEmpty()) {

                module = "Unassigned";
            } else {
                module = module.trim();
            }

            ModuleStats stats =
                    moduleMap.computeIfAbsent(
                            module,
                            key -> new ModuleStats()
                    );

            stats.totalCases++;

            if (isExecuted(status)) {
                stats.executed++;
            }
        }

        List<ModuleCoverageDto> modules =
                new ArrayList<>();

        for (Map.Entry<String, ModuleStats> entry :
                moduleMap.entrySet()) {

            ModuleStats stats =
                    entry.getValue();

            int percentage = 0;

            if (stats.totalCases > 0) {

                percentage =
                        (int) Math.round(
                                stats.executed *
                                        100.0 /
                                        stats.totalCases
                        );
            }

            modules.add(
                    new ModuleCoverageDto(
                            entry.getKey(),
                            stats.totalCases,
                            stats.executed,
                            percentage
                    )
            );
        }

        return new QATestCoverageDto(
                totalTestCases,
                executed,
                passed,
                failedBlocked,
                modules
        );
    }

    private boolean isExecuted(
            String status) {

        return "passed".equals(status)
                || "failed".equals(status)
                || "blocked".equals(status)
                || "in testing".equals(status);
    }

    private String normalize(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .trim()
                .toLowerCase();
    }

    private static class ModuleStats {

        private int totalCases;
        private int executed;
    }
}