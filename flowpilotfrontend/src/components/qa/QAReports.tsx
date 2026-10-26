import React, {
  useState,
} from "react";

import {
  ClipboardList,
  Bug,
  BarChart3,
  RefreshCw,
  Clock3,
  Trophy,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
}

interface TestCase {
  id: number;
  testId: string;
  title: string;
  type: string;
  linkedTask: string;
  priority: string;
  status: string;
  assignedTo?: string | number;
  project?: string;
  projectId?: number;
  createdAt?: string;
}

interface BugReport {
  id?: number;
  bugId: string;
  title: string;
  projectId?: number;
  linkedTaskId: string;
  environment: string;
  severity: string;
  assignedTo?: string | number;
  createdBy?: string;
  stepsToReproduce: string;
  status?: string;
  createdAt?: string;
  filedDate?: string;
}

interface StoredUser {
  id?: string | number;
  userId?: string | number;
  employeeId?: string | number;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
}

/* =========================================================
   API
========================================================= */

const TEST_API =
  "http://localhost:8080/api/qa/test-cases";

const BUG_API =
  "http://localhost:8080/api/qa/bugs";

/* =========================================================
   NORMALIZE
========================================================= */

const normalize = (
  value: unknown
): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

/* =========================================================
   CURRENT USER
========================================================= */

const getCurrentUser =
  (): StoredUser | null => {

    const keys = [
      "currentUser",
      "user",
      "auth",
      "userData",
      "loggedInUser",
    ];

    for (const key of keys) {

      const value =
        localStorage.getItem(key) ||
        sessionStorage.getItem(key);

      if (!value) {
        continue;
      }

      try {

        const parsed =
          JSON.parse(value);

        const user =
          parsed?.user ??
          parsed?.data?.user ??
          parsed?.data ??
          parsed;

        if (
          user?.id ||
          user?.userId ||
          user?.employeeId ||
          user?.name ||
          user?.fullName ||
          user?.username ||
          user?.email
        ) {
          return user;
        }

      } catch {
        // Continue searching.
      }
    }

    const fallback: StoredUser = {
      id:
        localStorage.getItem(
          "userId"
        ) ||
        localStorage.getItem(
          "id"
        ) ||
        sessionStorage.getItem(
          "userId"
        ) ||
        sessionStorage.getItem(
          "id"
        ) ||
        undefined,

      userId:
        localStorage.getItem(
          "userId"
        ) ||
        sessionStorage.getItem(
          "userId"
        ) ||
        undefined,

      employeeId:
        localStorage.getItem(
          "employeeId"
        ) ||
        sessionStorage.getItem(
          "employeeId"
        ) ||
        undefined,

      name:
        localStorage.getItem(
          "name"
        ) ||
        localStorage.getItem(
          "fullName"
        ) ||
        sessionStorage.getItem(
          "name"
        ) ||
        sessionStorage.getItem(
          "fullName"
        ) ||
        undefined,

      fullName:
        localStorage.getItem(
          "fullName"
        ) ||
        sessionStorage.getItem(
          "fullName"
        ) ||
        undefined,

      username:
        localStorage.getItem(
          "username"
        ) ||
        sessionStorage.getItem(
          "username"
        ) ||
        undefined,

      email:
        localStorage.getItem(
          "email"
        ) ||
        sessionStorage.getItem(
          "email"
        ) ||
        undefined,
    };

    const hasUser =
      Object.values(
        fallback
      ).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
      );

    return hasUser
      ? fallback
      : null;
  };

/* =========================================================
   USER NAME
========================================================= */

const getUserName = (
  user: StoredUser | null
) => {

  return (
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    ""
  ).trim();
};

/* =========================================================
   TOKEN
========================================================= */

const getToken = (): string => {

  const keys = [
    "token",
    "jwt",
    "accessToken",
    "authToken",
    "access_token",
    "jwtToken",
  ];

  for (const key of keys) {

    const value =
      localStorage.getItem(key) ||
      sessionStorage.getItem(key);

    if (value) {

      return value.replace(
        /^Bearer\s+/i,
        ""
      );
    }
  }

  const objectKeys = [
    "currentUser",
    "user",
    "auth",
    "userData",
    "loggedInUser",
  ];

  for (const key of objectKeys) {

    const value =
      localStorage.getItem(key) ||
      sessionStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {

      const parsed =
        JSON.parse(value);

      const token =
        parsed?.token ||
        parsed?.jwt ||
        parsed?.accessToken ||
        parsed?.access_token ||
        parsed?.jwtToken ||
        parsed?.user?.token;

      if (token) {

        return String(token).replace(
          /^Bearer\s+/i,
          ""
        );
      }

    } catch {
      // Continue.
    }
  }

  return "";
};

/* =========================================================
   HEADERS
========================================================= */

const getHeaders = () => {

  const token =
    getToken();

  return {
    "Content-Type":
      "application/json",

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),
  };
};

/* =========================================================
   MATCH CURRENT USER
========================================================= */

const matchesUser = (
  value: any,
  user: StoredUser | null
): boolean => {

  if (
    !user ||
    value === undefined ||
    value === null
  ) {
    return false;
  }

  const currentUserId = user.id ?? user.userId ?? user.employeeId;
  const currentUserEmail = user.email ? normalize(user.email) : "";

  // If value is an object (e.g. TestCase or BugReport)
  if (typeof value === "object") {
    const targetUserId = value.assignedUserId ?? value.assignedToId;
    const targetEmail = value.assignedToEmail ? normalize(value.assignedToEmail) : "";

    if (
      targetUserId !== undefined &&
      targetUserId !== null &&
      String(targetUserId).trim() !== "" &&
      currentUserId !== undefined &&
      currentUserId !== null &&
      String(currentUserId).trim() !== ""
    ) {
      if (String(targetUserId).trim() === String(currentUserId).trim()) {
        return true;
      }
    }

    if (targetEmail && currentUserEmail && targetEmail === currentUserEmail) {
      return true;
    }

    if (value.assignedTo && matchesUser(value.assignedTo, user)) {
      return true;
    }
    if (value.createdBy && matchesUser(value.createdBy, user)) {
      return true;
    }
    return false;
  }

  const assigned =
    normalize(value);

  const userValues = [
    user.id,
    user.userId,
    user.employeeId,
    user.name,
    user.fullName,
    user.username,
    user.email,
  ]
    .filter(
      (item) =>
        item !== undefined &&
        item !== null &&
        String(item).trim() !== ""
    )
    .map(normalize);

  return userValues.includes(
    assigned
  );
};

/* =========================================================
   EXTRACT ARRAY
========================================================= */

const extractArray = <T,>(
  value: any
): T[] => {

  if (Array.isArray(value)) {
    return value;
  }

  if (
    Array.isArray(
      value?.data
    )
  ) {
    return value.data;
  }

  if (
    Array.isArray(
      value?.testCases
    )
  ) {
    return value.testCases;
  }

  if (
    Array.isArray(
      value?.bugs
    )
  ) {
    return value.bugs;
  }

  return [];
};

/* =========================================================
   REPORT DATA
========================================================= */

interface GeneratedReport {
  title: string;
  generatedFor: string;
  generatedAt: string;
  summary: string;
  metrics: Array<{
    label: string;
    value: string | number;
  }>;
  rows: string[][];
}

/* =========================================================
   COMPONENT
========================================================= */

const QAReports: React.FC =
  () => {

    const [
      generatedReport,
      setGeneratedReport,
    ] =
      useState<GeneratedReport | null>(
        null
      );

    const [
      generatingReport,
      setGeneratingReport,
    ] =
      useState<string | null>(
        null
      );

    const [
      error,
      setError,
    ] =
      useState("");

    /* =====================================================
       REPORT CARDS
    ===================================================== */

    const reports: ReportCard[] = [
      {
        title:
          "Sprint Test Summary",

        description:
          "Pass/fail/blocked breakdown for Sprint 12, organized by module",

        icon:
          <ClipboardList
            size={20}
            strokeWidth={1.7}
          />,

        iconBg:
          "bg-[#EFFAF5]",

        iconColor:
          "text-[#61D6A1]",

        buttonBg:
          "bg-[#F7FCF9]",

        buttonText:
          "text-[#61CFA0]",

        buttonBorder:
          "border-[#D7F2E5]",
      },

      {
        title:
          "Bug Density Report",

        description:
          "Number of bugs per feature module and developer",

        icon:
          <Bug
            size={20}
            strokeWidth={1.7}
          />,

        iconBg:
          "bg-[#FFF1F2]",

        iconColor:
          "text-[#69D5A5]",

        buttonBg:
          "bg-[#FFF8F8]",

        buttonText:
          "text-[#F15B5C]",

        buttonBorder:
          "border-[#FFD8D9]",
      },

      {
        title:
          "Coverage Report",

        description:
          "Test case coverage % per module with trends",

        icon:
          <BarChart3
            size={20}
            strokeWidth={1.7}
          />,

        iconBg:
          "bg-[#EFFAF5]",

        iconColor:
          "text-[#61D2A0]",

        buttonBg:
          "bg-[#F7FCF9]",

        buttonText:
          "text-[#4FC58D]",

        buttonBorder:
          "border-[#D7F0E2]",
      },

      {
        title:
          "Regression Report",

        description:
          "Which old bugs re-appeared this sprint and why",

        icon:
          <RefreshCw
            size={20}
            strokeWidth={1.7}
          />,

        iconBg:
          "bg-[#F6F0FF]",

        iconColor:
          "text-[#A786F7]",

        buttonBg:
          "bg-[#FBF8FF]",

        buttonText:
          "text-[#A785F3]",

        buttonBorder:
          "border-[#E9DCFF]",
      },

      {
        title:
          "Test Execution Log",

        description:
          "Detailed log of all test runs with timestamps and testers",

        icon:
          <Clock3
            size={20}
            strokeWidth={1.7}
          />,

        iconBg:
          "bg-[#FFF7EA]",

        iconColor:
          "text-[#6B7280]",

        buttonBg:
          "bg-[#FFFBF4]",

        buttonText:
          "text-[#F59E0B]",

        buttonBorder:
          "border-[#FCE6B8]",
      },

      {
        title:
          "Quality Scorecard",

        description:
          "Overall sprint quality score: defect escape rate, coverage, velocity",

        icon:
          <Trophy
            size={20}
            strokeWidth={1.7}
          />,

        iconBg:
          "bg-[#EFFBFB]",

        iconColor:
          "text-[#F59E0B]",

        buttonBg:
          "bg-[#F6FCFC]",

        buttonText:
          "text-[#4FCFC3]",

        buttonBorder:
          "border-[#D6F1EE]",
      },
    ];

    /* =====================================================
       LOAD CURRENT USER'S REAL DATA
    ===================================================== */

    const loadMyData =
      async () => {

        const user =
          getCurrentUser();

        if (!user) {
          throw new Error(
            "Logged-in user could not be identified."
          );
        }

        const createdBy =
          getUserName(user);

        if (!createdBy) {
          throw new Error(
            "Logged-in user name could not be identified."
          );
        }

        const [
          testResponse,
          bugResponse,
        ] =
          await Promise.all([
            fetch(
              TEST_API,
              {
                method: "GET",
                headers:
                  getHeaders(),
              }
            ),

            fetch(
              BUG_API,
              {
                method: "GET",
                headers:
                  getHeaders(),
              }
            ),
          ]);

        if (
          !testResponse.ok
        ) {

          throw new Error(
            `Failed to load test cases (${testResponse.status}).`
          );
        }

        if (
          !bugResponse.ok
        ) {

          throw new Error(
            `Failed to load bug reports (${bugResponse.status}).`
          );
        }

        const testResult =
          await testResponse.json();

        const bugResult =
          await bugResponse.json();

        const allTests =
          extractArray<TestCase>(
            testResult
          );

        const allBugs =
          extractArray<BugReport>(
            bugResult
          );

        /*
         * Test cases are assigned to the current QA user (fallback to all tests if none specifically assigned)
         */
        const myTests =
          allTests.filter(
            (test) =>
              matchesUser(
                test,
                user
              )
          );

        const effectiveTests =
          myTests.length > 0 ? myTests : allTests;

        /*
         * Bugs are filed by or assigned to the current QA user (fallback to all bugs)
         */
        const myBugs =
          allBugs.filter(
            (bug) =>
              matchesUser(
                bug,
                user
              )
          );

        const effectiveBugs =
          myBugs.length > 0 ? myBugs : allBugs;

        return {
          user,
          myTests: effectiveTests,
          myBugs: effectiveBugs,
        };
      };

    /* =====================================================
       GENERATE REPORT
    ===================================================== */

    const handleGenerate =
      async (
        reportTitle: string
      ) => {

        try {

          setError("");
          setGeneratingReport(
            reportTitle
          );

          const {
            user,
            myTests,
            myBugs,
          } =
            await loadMyData();

          const userName =
            getUserName(user);

          const generatedAt =
            new Date().toLocaleString(
              "en-US",
              {
                dateStyle:
                  "medium",
                timeStyle:
                  "short",
              }
            );

          /* =================================================
             COMMON TEST COUNTS
          ================================================= */

          const totalTests =
            myTests.length;

          const passed =
            myTests.filter(
              (test) =>
                normalize(
                  test.status
                ) === "passed"
            ).length;

          const failed =
            myTests.filter(
              (test) =>
                normalize(
                  test.status
                ) === "failed"
            ).length;

          const blocked =
            myTests.filter(
              (test) =>
                normalize(
                  test.status
                ) === "blocked"
            ).length;

          const inTesting =
            myTests.filter(
              (test) =>
                normalize(
                  test.status
                ) === "in testing"
            ).length;

          const pending =
            myTests.filter(
              (test) =>
                normalize(
                  test.status
                ) === "pending" ||
                normalize(
                  test.status
                ) === ""
            ).length;

          const executed =
            passed +
            failed +
            blocked +
            inTesting;

          /* =================================================
             SPRINT TEST SUMMARY
          ================================================= */

          if (
            reportTitle ===
            "Sprint Test Summary"
          ) {

            const projectMap =
              new Map<
                string,
                {
                  total: number;
                  passed: number;
                  failed: number;
                  blocked: number;
                  inTesting: number;
                  pending: number;
                }
              >();

            myTests.forEach(
              (test) => {

                const project =
                  test.project ||
                  "Unassigned";

                const current =
                  projectMap.get(
                    project
                  ) || {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    blocked: 0,
                    inTesting: 0,
                    pending: 0,
                  };

                current.total++;

                switch (
                  normalize(
                    test.status
                  )
                ) {

                  case "passed":
                    current.passed++;
                    break;

                  case "failed":
                    current.failed++;
                    break;

                  case "blocked":
                    current.blocked++;
                    break;

                  case "in testing":
                    current.inTesting++;
                    break;

                  default:
                    current.pending++;
                }

                projectMap.set(
                  project,
                  current
                );
              }
            );

            const passRate =
              totalTests === 0
                ? 0
                : Math.round(
                    (passed / totalTests) * 100
                  );

            const rows =
              Array.from(
                projectMap.entries()
              ).map(
                ([
                  project,
                  stats,
                ]) => {
                  const projectPassRate =
                    stats.total === 0
                      ? 0
                      : Math.round((stats.passed / stats.total) * 100);
                  return [
                    project,
                    String(stats.total),
                    String(stats.passed),
                    String(stats.failed),
                    String(stats.blocked),
                    String(stats.inTesting),
                    String(stats.pending),
                    `${projectPassRate}%`,
                  ];
                }
              );

            setGeneratedReport({
              title:
                reportTitle,

              generatedFor:
                userName,

              generatedAt,

              summary:
                "Real-time summary of the test cases currently assigned to you.",

              metrics: [
                {
                  label:
                    "Total Tests",
                  value:
                    totalTests,
                },
                {
                  label:
                    "Executed",
                  value:
                    executed,
                },
                {
                  label:
                    "Passed",
                  value:
                    passed,
                },
                {
                  label:
                    "Pass Rate",
                  value:
                    `${passRate}%`,
                },
                {
                  label:
                    "Failed",
                  value:
                    failed,
                },
                {
                  label:
                    "Blocked",
                  value:
                    blocked,
                },
                {
                  label:
                    "Pending",
                  value:
                    pending,
                },
              ],

              rows: [
                [
                  "Project / Module",
                  "Total",
                  "Passed",
                  "Failed",
                  "Blocked",
                  "In Testing",
                  "Pending",
                  "Pass Rate",
                ],
                ...rows,
              ],
            });
          }

          /* =================================================
             BUG DENSITY REPORT
          ================================================= */

          else if (
            reportTitle ===
            "Bug Density Report"
          ) {

            const projectMap =
              new Map<
                string,
                number
              >();

            const severityMap =
              new Map<
                string,
                number
              >();

            myBugs.forEach(
              (bug) => {

                const project =
                  bug.projectId
                    ? `Project ${bug.projectId}`
                    : "Unassigned";

                projectMap.set(
                  project,
                  (
                    projectMap.get(
                      project
                    ) || 0
                  ) + 1
                );

                const severity =
                  bug.severity ||
                  "Unknown";

                severityMap.set(
                  severity,
                  (
                    severityMap.get(
                      severity
                    ) || 0
                  ) + 1
                );
              }
            );

            const projectRows =
              Array.from(
                projectMap.entries()
              ).map(
                ([
                  project,
                  count,
                ]) => [
                  project,
                  String(count),
                ]
              );

            const severityRows =
              Array.from(
                severityMap.entries()
              ).map(
                ([
                  severity,
                  count,
                ]) => [
                  severity,
                  String(count),
                ]
              );

            setGeneratedReport({
              title:
                reportTitle,

              generatedFor:
                userName,

              generatedAt,

              summary:
                "Bug report generated from bugs filed by the logged-in QA user.",

              metrics: [
                {
                  label:
                    "Total Bugs Filed",
                  value:
                    myBugs.length,
                },
                {
                  label:
                    "Open Bugs",
                  value:
                    myBugs.filter(
                      (bug) =>
                        normalize(
                          bug.status ||
                          "Open"
                        ) ===
                        "open"
                    ).length,
                },
                {
                  label:
                    "High / Critical",
                  value:
                    myBugs.filter(
                      (bug) =>
                        [
                          "high",
                          "critical",
                        ].includes(
                          normalize(
                            bug.severity
                          )
                        )
                    ).length,
                },
              ],

              rows: [
                [
                  "Project",
                  "Bug Count",
                ],
                ...projectRows,

                [
                  "",
                  "",
                ],

                [
                  "Severity",
                  "Bug Count",
                ],
                ...severityRows,
              ],
            });
          }

          /* =================================================
             COVERAGE REPORT
          ================================================= */

          else if (
            reportTitle ===
            "Coverage Report"
          ) {

            const projectMap =
              new Map<
                string,
                {
                  total: number;
                  executed: number;
                  passed: number;
                }
              >();

            myTests.forEach(
              (test) => {

                const project =
                  test.project ||
                  "Unassigned";

                const current =
                  projectMap.get(
                    project
                  ) || {
                    total: 0,
                    executed: 0,
                    passed: 0,
                  };

                current.total++;

                if (
                  [
                    "passed",
                    "failed",
                    "blocked",
                    "in testing",
                  ].includes(
                    normalize(
                      test.status
                    )
                  )
                ) {
                  current.executed++;
                }

                if (
                  normalize(
                    test.status
                  ) === "passed"
                ) {
                  current.passed++;
                }

                projectMap.set(
                  project,
                  current
                );
              }
            );

            const rows =
              Array.from(
                projectMap.entries()
              ).map(
                ([
                  project,
                  stats,
                ]) => {

                  const coverage =
                    stats.total ===
                    0
                      ? 0
                      : Math.round(
                          (
                            stats.executed /
                            stats.total
                          ) *
                          100
                        );

                  const projectPassRate =
                    stats.total ===
                    0
                      ? 0
                      : Math.round(
                          (
                            stats.passed /
                            stats.total
                          ) *
                          100
                        );

                  return [
                    project,
                    String(
                      stats.total
                    ),
                    String(
                      stats.executed
                    ),
                    String(
                      stats.passed
                    ),
                    `${coverage}%`,
                    `${projectPassRate}%`,
                  ];
                }
              );

            const overallCoverage =
              totalTests === 0
                ? 0
                : Math.round(
                    (
                      executed /
                      totalTests
                    ) *
                    100
                  );

            const overallPassRate =
              totalTests === 0
                ? 0
                : Math.round(
                    (
                      passed /
                      totalTests
                    ) *
                    100
                  );

            setGeneratedReport({
              title:
                reportTitle,

              generatedFor:
                userName,

              generatedAt,

              summary:
                "Coverage is calculated from the real QA test cases assigned to you.",

              metrics: [
                {
                  label:
                    "Total Cases",
                  value:
                    totalTests,
                },
                {
                  label:
                    "Executed",
                  value:
                    executed,
                },
                {
                  label:
                    "Passed",
                  value:
                    passed,
                },
                {
                  label:
                    "Pass Rate",
                  value:
                    `${overallPassRate}%`,
                },
                {
                  label:
                    "Overall Coverage",
                  value:
                    `${overallCoverage}%`,
                },
              ],

              rows: [
                [
                  "Project / Module",
                  "Total",
                  "Executed",
                  "Passed",
                  "Coverage",
                  "Pass Rate",
                ],
                ...rows,
              ],
            });
          }

          /* =================================================
             REGRESSION REPORT
          ================================================= */

          else if (
            reportTitle ===
            "Regression Report"
          ) {

            const candidates =
              myTests.filter(
                (test) =>
                  [
                    "failed",
                    "blocked",
                  ].includes(
                    normalize(
                      test.status
                    )
                  )
              );

            setGeneratedReport({
              title:
                reportTitle,

              generatedFor:
                userName,

              generatedAt,

              summary:
                "Potential regression candidates based on failed or blocked tests and active bugs. Historical reappearance cannot be confirmed without test history.",

              metrics: [
                {
                  label:
                    "Pass Rate",
                  value:
                    `${totalTests === 0 ? 0 : Math.round((passed / totalTests) * 100)}%`,
                },
                {
                  label:
                    "Failed Tests",
                  value:
                    failed,
                },
                {
                  label:
                    "Blocked Tests",
                  value:
                    blocked,
                },
                {
                  label:
                    "Active Bugs",
                  value:
                    myBugs.filter(
                      (bug) =>
                        [
                          "open",
                          "in progress",
                        ].includes(
                          normalize(
                            bug.status ||
                            "open"
                          )
                        )
                    ).length,
                },
                {
                  label:
                    "Potential Candidates",
                  value:
                    candidates.length,
                },
              ],

              rows: [
                [
                  "Test ID",
                  "Title",
                  "Linked Task",
                  "Status",
                  "Project",
                ],
                ...candidates.map(
                  (test) => [
                    test.testId,
                    test.title,
                    test.linkedTask,
                    test.status,
                    test.project ||
                      "Unassigned",
                  ]
                ),
              ],
            });
          }

          /* =================================================
             TEST EXECUTION LOG
          ================================================= */

          else if (
            reportTitle ===
            "Test Execution Log"
          ) {

            const passRate =
              totalTests === 0
                ? 0
                : Math.round((passed / totalTests) * 100);

            setGeneratedReport({
              title:
                reportTitle,

              generatedFor:
                userName,

              generatedAt,

              summary:
                "Detailed execution log of the test cases assigned to you.",

              metrics: [
                {
                  label:
                    "Total Tests",
                  value:
                    totalTests,
                },
                {
                  label:
                    "Executed",
                  value:
                    executed,
                },
                {
                  label:
                    "Passed",
                  value:
                    passed,
                },
                {
                  label:
                    "Pass Rate",
                  value:
                    `${passRate}%`,
                },
                {
                  label:
                    "Failed",
                  value:
                    failed,
                },
              ],

              rows: [
                [
                  "Test ID",
                  "Title",
                  "Type",
                  "Linked Task",
                  "Priority",
                  "Status",
                  "Project",
                  "Created",
                ],
                ...myTests.map(
                  (test) => [
                    test.testId,
                    test.title,
                    test.type,
                    test.linkedTask,
                    test.priority,
                    test.status,
                    test.project ||
                      "Unassigned",
                    test.createdAt
                      ? new Date(
                          test.createdAt
                        ).toLocaleString()
                      : "-",
                  ]
                ),
              ],
            });
          }

          /* =================================================
             QUALITY SCORECARD
          ================================================= */

          else if (
            reportTitle ===
            "Quality Scorecard"
          ) {

            const coverage =
              totalTests === 0
                ? 0
                : Math.round(
                    (
                      executed /
                      totalTests
                    ) *
                    100
                  );

            const passRate =
              totalTests === 0
                ? 0
                : Math.round(
                    (
                      passed /
                      totalTests
                    ) *
                    100
                  );

            const executionRate =
              totalTests === 0
                ? 0
                : Math.round(
                    (
                      executed /
                      totalTests
                    ) *
                    100
                  );

            const qualityScore =
              totalTests === 0
                ? 0
                : Math.round(
                    (
                      (
                        coverage +
                        passRate +
                        executionRate
                      ) /
                      3
                    )
                  );

            setGeneratedReport({
              title:
                reportTitle,

              generatedFor:
                userName,

              generatedAt,

              summary:
                "Overall QA score calculated from your current test execution and bug data.",

              metrics: [
                {
                  label:
                    "Quality Score",
                  value:
                    `${qualityScore}%`,
                },
                {
                  label:
                    "Coverage",
                  value:
                    `${coverage}%`,
                },
                {
                  label:
                    "Pass Rate",
                  value:
                    `${passRate}%`,
                },
                {
                  label:
                    "Execution Rate",
                  value:
                    `${executionRate}%`,
                },
                {
                  label:
                    "Tests",
                  value:
                    totalTests,
                },
                {
                  label:
                    "Bugs Filed",
                  value:
                    myBugs.length,
                },
              ],

              rows: [
                [
                  "Metric",
                  "Value",
                ],
                [
                  "Total Tests",
                  String(
                    totalTests
                  ),
                ],
                [
                  "Executed",
                  String(
                    executed
                  ),
                ],
                [
                  "Passed",
                  String(
                    passed
                  ),
                ],
                [
                  "Failed",
                  String(
                    failed
                  ),
                ],
                [
                  "Blocked",
                  String(
                    blocked
                  ),
                ],
                [
                  "Coverage",
                  `${coverage}%`,
                ],
                [
                  "Pass Rate",
                  `${passRate}%`,
                ],
                [
                  "Execution Rate",
                  `${executionRate}%`,
                ],
                [
                  "Bugs Filed",
                  String(
                    myBugs.length
                  ),
                ],
              ],
            });
          }

        } catch (err) {

          console.error(
            "Failed to generate QA report:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Failed to generate report."
          );

        } finally {

          setGeneratingReport(
            null
          );
        }
      };

    /* =====================================================
       CLOSE REPORT
    ===================================================== */

    const closeReport = () => {
      setGeneratedReport(null);
    };

    return (
      <div
        className="w-full"
        style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >

        {/* ERROR */}

        {error && (
          <div
            className="
              mb-[14px]
              rounded-[8px]
              border
              border-[#FFD1D1]
              bg-[#FFF5F5]
              px-4
              py-3
              text-[10px]
              text-[#E05252]
            "
          >
            {error}
          </div>
        )}

        {/* REPORT GRID */}

        <div
          className="
            grid
            w-full
            grid-cols-1
            gap-[14px]
            sm:grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {reports.map(
            (report) => (

              <div
                key={
                  report.title
                }
                className="
                  box-border
                  h-[173px]
                  w-full
                  rounded-[14px]
                  border
                  border-[#E8EDF0]
                  bg-white
                  px-[19px]
                  py-[19px]
                  shadow-[0_2px_8px_rgba(0,0,0,0.035)]
                  transition-all
                  duration-200
                  hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]
                "
              >

                {/* ICON */}

                <div
                  className={`
                    flex
                    h-[38px]
                    w-[38px]
                    items-center
                    justify-center
                    rounded-[11px]
                    ${report.iconBg}
                    ${report.iconColor}
                  `}
                >
                  {report.icon}
                </div>

                {/* TITLE */}

                <h2
                  className="
                    m-0
                    mt-[13px]
                    text-[12px]
                    font-[700]
                    leading-[15px]
                    tracking-[-0.05px]
                    text-[#111827]
                  "
                >
                  {report.title}
                </h2>

                {/* DESCRIPTION */}

                <p
                  className="
                    m-0
                    mt-[5px]
                    text-[10px]
                    font-[400]
                    leading-[14px]
                    tracking-[0]
                    text-[#9CA3AF]
                  "
                >
                  {report.description}
                </p>

                {/* BUTTON */}

                <button
                  type="button"
                  disabled={
                    generatingReport ===
                    report.title
                  }
                  onClick={() =>
                    handleGenerate(
                      report.title
                    )
                  }
                  className={`
                    mt-[14px]
                    inline-flex
                    h-[32px]
                    items-center
                    justify-center
                    rounded-[8px]
                    border
                    px-[13px]
                    py-0
                    text-[10px]
                    font-[600]
                    leading-[12px]
                    tracking-[0]
                    outline-none
                    transition-all
                    duration-200
                    hover:opacity-80
                    active:scale-[0.98]
                    focus:outline-none
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    ${report.buttonBg}
                    ${report.buttonText}
                    ${report.buttonBorder}
                  `}
                >
                  {generatingReport ===
                  report.title
                    ? "Generating..."
                    : "Generate Report"}
                </button>

              </div>
            )
          )}

        </div>

        {/* =====================================================
            GENERATED REPORT MODAL
        ===================================================== */}

        {generatedReport && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-slate-900/40
              p-4
            "
            onClick={closeReport}
          >

            <div
              className="
                w-full
                max-w-4xl
                max-h-[85vh]
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-2xl
              "
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* REPORT HEADER */}

              <div
                className="
                  flex
                  items-start
                  justify-between
                  border-b
                  border-slate-200
                  px-5
                  py-4
                "
              >

                <div>

                  <h2 className="text-base font-bold text-slate-900">
                    {generatedReport.title}
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Generated for{" "}
                    <span className="font-semibold text-slate-600">
                      {generatedReport.generatedFor}
                    </span>
                    {" · "}
                    {generatedReport.generatedAt}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeReport
                  }
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                >
                  <X
                    size={17}
                  />
                </button>

              </div>

              {/* REPORT BODY */}

              <div
                className="
                  max-h-[calc(85vh-76px)]
                  overflow-y-auto
                  p-5
                "
              >

                {/* SUMMARY */}

                <div
                  className="
                    mb-5
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                  "
                >

                  <p className="text-[11px] leading-5 text-slate-600">
                    {generatedReport.summary}
                  </p>

                </div>

                {/* METRICS */}

                <div
                  className="
                    mb-5
                    grid
                    grid-cols-2
                    gap-3
                    md:grid-cols-3
                    xl:grid-cols-6
                  "
                >

                  {generatedReport.metrics.map(
                    (
                      metric
                    ) => (

                      <div
                        key={
                          metric.label
                        }
                        className="
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          p-3
                        "
                      >

                        <p className="text-[9px] uppercase tracking-[0.06em] text-slate-400">
                          {
                            metric.label
                          }
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {
                            metric.value
                          }
                        </p>

                      </div>

                    )
                  )}

                </div>

                {/* DETAIL TABLE */}

                {generatedReport.rows.length >
                  0 && (

                  <div className="overflow-x-auto rounded-xl border border-slate-200">

                    <table className="w-full min-w-[650px] border-collapse">

                      <tbody>

                        {generatedReport.rows.map(
                          (
                            row,
                            rowIndex
                          ) => (

                            <tr
                              key={
                                rowIndex
                              }
                              className={
                                rowIndex ===
                                0
                                  ? "bg-slate-50"
                                  : "bg-white"
                              }
                            >

                              {row.map(
                                (
                                  cell,
                                  cellIndex
                                ) => (

                                  <td
                                    key={
                                      cellIndex
                                    }
                                    className={`
                                      border-b
                                      border-slate-100
                                      px-3
                                      py-2.5
                                      text-left
                                      text-[10px]
                                      ${
                                        rowIndex ===
                                        0
                                          ? "font-semibold text-slate-600"
                                          : "text-slate-700"
                                      }
                                    `}
                                  >
                                    {
                                      cell
                                    }
                                  </td>

                                )
                              )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

                {/* NO DATA */}

                {generatedReport.metrics.every(
                  (metric) =>
                    Number(
                      metric.value
                    ) === 0
                ) && (
                  <div
                    className="
                      mt-4
                      rounded-xl
                      border
                      border-amber-200
                      bg-amber-50
                      px-4
                      py-3
                      text-[10px]
                      text-amber-700
                    "
                  >
                    There is currently no data for this
                    report for the logged-in QA user.
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    );
  };

export default QAReports;