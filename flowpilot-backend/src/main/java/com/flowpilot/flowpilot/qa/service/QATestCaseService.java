package com.flowpilot.flowpilot.qa.service;

import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.qa.model.QATestCase;
import com.flowpilot.flowpilot.qa.repository.QATestCaseRepository;
import com.flowpilot.flowpilot.scrummaster.model.ScrumBoardTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumBoardTaskRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QATestCaseService {

    private final QATestCaseRepository testCaseRepository;
    private final ScrumBoardTaskRepository scrumBoardTaskRepository;
    private final PMProjectsRepository pmProjectsRepository;

    public QATestCaseService(
            QATestCaseRepository testCaseRepository,
            ScrumBoardTaskRepository scrumBoardTaskRepository,
            PMProjectsRepository pmProjectsRepository) {

        this.testCaseRepository = testCaseRepository;
        this.scrumBoardTaskRepository = scrumBoardTaskRepository;
        this.pmProjectsRepository = pmProjectsRepository;
    }

    /*
     * =========================================================
     * GET ALL TEST CASES
     *
     * Synchronize Scrum Master tasks first so that QA always
     * receives the latest assignment/details.
     * =========================================================
     */
    @Transactional
    public List<QATestCase> getAllTestCases() {

        syncScrumMasterTasks();

        return testCaseRepository.findAll();
    }

    /*
     * =========================================================
     * GET ONE TEST CASE
     * =========================================================
     */
    @Transactional(readOnly = true)
    public QATestCase getTestCase(Long id) {

        return testCaseRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Test case not found: " + id
                        )
                );
    }

    /*
     * =========================================================
     * CREATE TEST CASE
     * =========================================================
     */
    @Transactional
    public QATestCase createTestCase(
            QATestCase testCase) {

        if (testCase == null) {
            throw new IllegalArgumentException(
                    "Test case cannot be null"
            );
        }

        if (testCase.getTestId() == null ||
                testCase.getTestId().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Test ID is required"
            );
        }

        if (testCase.getTitle() == null ||
                testCase.getTitle().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Test title is required"
            );
        }

        String cleanTestId =
                testCase.getTestId().trim();

        if (testCaseRepository.existsByTestId(
                cleanTestId)) {

            throw new IllegalArgumentException(
                    "Test ID already exists: "
                            + cleanTestId
            );
        }

        testCase.setId(null);

        testCase.setTestId(
                cleanTestId
        );

        testCase.setTitle(
                testCase.getTitle().trim()
        );

        if (testCase.getStatus() == null ||
                testCase.getStatus().isBlank()) {

            testCase.setStatus("Pending");

        } else {

            testCase.setStatus(
                    testCase.getStatus().trim()
            );
        }

        if (testCase.getAssignedTo() != null) {

            testCase.setAssignedTo(
                    testCase.getAssignedTo().trim()
            );
        }

        if (testCase.getProject() != null) {

            testCase.setProject(
                    testCase.getProject().trim()
            );
        }

        if (testCase.getType() != null) {

            testCase.setType(
                    testCase.getType().trim()
            );
        }

        if (testCase.getLinkedTask() != null) {

            testCase.setLinkedTask(
                    testCase.getLinkedTask().trim()
            );
        }

        if (testCase.getPriority() != null) {

            testCase.setPriority(
                    testCase.getPriority().trim()
            );
        }

        return testCaseRepository.save(
                testCase
        );
    }

    /*
     * =========================================================
     * UPDATE STATUS
     *
     * QA can change only the QA execution status.
     * =========================================================
     */
    @Transactional
    public QATestCase updateStatus(
            Long id,
            String status) {

        if (status == null ||
                status.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Status is required"
            );
        }

        String cleanStatus =
                status.trim();

        if (!cleanStatus.equalsIgnoreCase("Passed") &&
                !cleanStatus.equalsIgnoreCase("Failed") &&
                !cleanStatus.equalsIgnoreCase("Pending") &&
                !cleanStatus.equalsIgnoreCase("In Testing") &&
                !cleanStatus.equalsIgnoreCase("Blocked")) {

            throw new IllegalArgumentException(
                    "Invalid status: " + status
            );
        }

        QATestCase existing =
                testCaseRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Test case not found: " + id
                                )
                        );

        existing.setStatus(
                cleanStatus
        );

        return testCaseRepository.save(
                existing
        );
    }

    /*
     * =========================================================
     * SYNCHRONIZE SCRUM MASTER TASKS TO QA
     *
     * Source:
     *
     * scrum_board_tasks
     *
     * Destination:
     *
     * qa_test_cases
     *
     * Important behavior:
     *
     * 1. New Scrum task -> create QA test case.
     *
     * 2. Existing Scrum task -> update assignment/details.
     *
     * 3. Existing QA status is NOT reset.
     *
     * This means:
     *
     * Scrum Master changes:
     * Priya -> Rahul
     *
     * QA automatically changes:
     * Priya -> Rahul
     *
     * while preserving:
     * Passed / Failed / Pending.
     * =========================================================
     */
    @Transactional
    public int syncScrumMasterTasks() {

        List<ScrumBoardTask> scrumTasks =
                scrumBoardTaskRepository.findAll();

        int changedCount = 0;

        for (ScrumBoardTask task : scrumTasks) {

            if (task == null ||
                    task.getId() == null) {

                continue;
            }

            if (task.getTaskCode() == null ||
                    task.getTaskCode().isBlank()) {

                continue;
            }

            if (task.getTitle() == null ||
                    task.getTitle().isBlank()) {

                continue;
            }

            /*
             * =================================================
             * RESOLVE PM PROJECT
             * =================================================
             */

            String projectName = null;

            if (task.getProjectId() != null) {

                PMProject project =
                        pmProjectsRepository
                                .findById(
                                        task.getProjectId()
                                )
                                .orElse(null);

                if (project != null) {

                    if (project.getProjectCode() != null &&
                            !project.getProjectCode().isBlank()) {

                        projectName =
                                project.getProjectCode()
                                        + " - "
                                        + project.getProjectName();

                    } else {

                        projectName =
                                project.getProjectName();
                    }
                }
            }

            /*
             * =================================================
             * FIND EXISTING QA RECORD
             * =================================================
             */

            QATestCase existing =
                    testCaseRepository
                            .findByScrumTaskId(
                                    task.getId()
                            )
                            .orElse(null);

            /*
             * =================================================
             * CREATE NEW QA RECORD
             * =================================================
             */

            if (existing == null) {

                String generatedTestId =
                        task.getTaskCode()
                                .trim()
                                + "-QA";

                /*
                 * Protect unique test ID.
                 */
                if (testCaseRepository.existsByTestId(
                        generatedTestId)) {

                    int suffix = 2;

                    String baseId =
                            generatedTestId;

                    while (
                            testCaseRepository
                                    .existsByTestId(
                                            generatedTestId
                                                    + "-"
                                                    + suffix
                                    )
                    ) {

                        suffix++;
                    }

                    generatedTestId =
                            baseId
                                    + "-"
                                    + suffix;
                }

                QATestCase qaTestCase =
                        new QATestCase();

                /*
                 * Link the QA record to the
                 * actual Scrum Master task.
                 */
                qaTestCase.setScrumTaskId(
                        task.getId()
                );

                qaTestCase.setProjectId(
                        task.getProjectId()
                );

                qaTestCase.setTestId(
                        generatedTestId
                );

                qaTestCase.setTitle(
                        task.getTitle().trim()
                );

                qaTestCase.setType(
                        "Task"
                );

                qaTestCase.setLinkedTask(
                        task.getTaskCode().trim()
                );

                /*
                 * Priority derived from story points.
                 */
                Integer points =
                        task.getPoints();

                if (points != null &&
                        points >= 8) {

                    qaTestCase.setPriority(
                            "High"
                    );

                } else if (points != null &&
                        points >= 5) {

                    qaTestCase.setPriority(
                            "Medium"
                    );

                } else {

                    qaTestCase.setPriority(
                            "Low"
                    );
                }

                /*
                 * New QA task starts as Pending.
                 */
                qaTestCase.setStatus(
                        "Pending"
                );

                /*
                 * Scrum Master assignee.
                 */
                if (task.getAssigneeName() != null &&
                        !task.getAssigneeName().isBlank()) {

                    qaTestCase.setAssignedTo(
                            task.getAssigneeName().trim()
                    );
                }

                qaTestCase.setProject(
                        projectName
                );

                /*
                 * Save new QA record.
                 */
                testCaseRepository.save(
                        qaTestCase
                );

                changedCount++;

                continue;
            }

            /*
             * =================================================
             * UPDATE EXISTING QA RECORD
             *
             * DO NOT CHANGE QA STATUS.
             * =================================================
             */

            boolean changed = false;

            /*
             * Scrum task title.
             */
            String newTitle =
                    task.getTitle().trim();

            if (!newTitle.equals(
                    existing.getTitle())) {

                existing.setTitle(
                        newTitle
                );

                changed = true;
            }

            /*
             * Linked task code.
             */
            String newLinkedTask =
                    task.getTaskCode().trim();

            if (!newLinkedTask.equals(
                    safe(existing.getLinkedTask()))) {

                existing.setLinkedTask(
                        newLinkedTask
                );

                changed = true;
            }

            /*
             * Project ID.
             */
            if (!equalsLong(
                    existing.getProjectId(),
                    task.getProjectId()
            )) {

                existing.setProjectId(
                        task.getProjectId()
                );

                changed = true;
            }

            /*
             * Project name/code.
             */
            if (!equalsString(
                    existing.getProject(),
                    projectName
            )) {

                existing.setProject(
                        projectName
                );

                changed = true;
            }

            /*
             * Scrum Master assignee.
             *
             * This is the important part for:
             *
             * "each QA user sees their own tasks".
             */
            String newAssignee =
                    task.getAssigneeName() == null
                            ? null
                            : task.getAssigneeName().trim();

            if (!equalsString(
                    existing.getAssignedTo(),
                    newAssignee
            )) {

                existing.setAssignedTo(
                        newAssignee
                );

                changed = true;
            }

            /*
             * Update priority if story points changed.
             */
            String newPriority =
                    calculatePriority(
                            task.getPoints()
                    );

            if (!equalsString(
                    existing.getPriority(),
                    newPriority
            )) {

                existing.setPriority(
                        newPriority
                );

                changed = true;
            }

            /*
             * We intentionally DO NOT copy Scrum
             * columnStatus to QA status.
             *
             * Scrum status:
             * Backlog
             * To do
             * In progress
             * Code review
             * Testing
             * Done
             *
             * QA status:
             * Pending
             * In Testing
             * Passed
             * Failed
             * Blocked
             *
             * They are different concepts.
             */

            if (changed) {

                testCaseRepository.save(
                        existing
                );

                changedCount++;
            }
        }

        return changedCount;
    }

    /*
     * =========================================================
     * GET QA TEST CASE BY SCRUM TASK ID
     * =========================================================
     */
    @Transactional(readOnly = true)
    public QATestCase getByScrumTaskId(
            Long scrumTaskId) {

        return testCaseRepository
                .findByScrumTaskId(
                        scrumTaskId
                )
                .orElse(null);
    }

    /*
     * =========================================================
     * PRIORITY CALCULATION
     * =========================================================
     */
    private String calculatePriority(
            Integer points) {

        if (points != null &&
                points >= 8) {

            return "High";
        }

        if (points != null &&
                points >= 5) {

            return "Medium";
        }

        return "Low";
    }

    /*
     * =========================================================
     * STRING COMPARISON
     * =========================================================
     */
    private boolean equalsString(
            String first,
            String second) {

        if (first == null &&
                second == null) {

            return true;
        }

        if (first == null ||
                second == null) {

            return false;
        }

        return first.equals(second);
    }

    /*
     * =========================================================
     * LONG COMPARISON
     * =========================================================
     */
    private boolean equalsLong(
            Long first,
            Long second) {

        if (first == null &&
                second == null) {

            return true;
        }

        if (first == null ||
                second == null) {

            return false;
        }

        return first.equals(second);
    }

    /*
     * =========================================================
     * NULL-SAFE STRING
     * =========================================================
     */
    private String safe(
            String value) {

        return value == null
                ? ""
                : value;
    }
}