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
} from "lucide-react";

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
   GET USER
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
        // Continue.
      }
    }

    return {
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
        undefined,

      fullName:
        localStorage.getItem(
          "fullName"
        ) ||
        undefined,

      username:
        localStorage.getItem(
          "username"
        ) ||
        undefined,

      email:
        localStorage.getItem(
          "email"
        ) ||
        undefined,
    };
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
   USER MATCH
========================================================= */

const matchesUser = (
  assignedTo: unknown,
  user: StoredUser | null
) => {

  if (
    !user ||
    assignedTo === undefined ||
    assignedTo === null
  ) {
    return false;
  }

  const assigned =
    normalize(
      assignedTo
    );

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
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    )
    .map(normalize);

  return userValues.includes(
    assigned
  );
};

/* =========================================================
   ARRAY EXTRACTION
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
   CSV HELPERS
========================================================= */

const csvEscape = (
  value: unknown
) => {

  return `"${String(
    value ?? ""
  ).replace(
    /"/g,
    '""'
  )}"`;
};

const makeCsv = (
  headers: string[],
  rows: unknown[][]
) => {

  return [
    headers
      .map(csvEscape)
      .join(","),

    ...rows.map(
      (row) =>
        row
          .map(csvEscape)
          .join(",")
    ),
  ].join("\n");
};

const downloadCsv = (
  fileName: string,
  content: string
) => {

  const blob =
    new Blob(
      [content],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    fileName;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(
    url
  );
};

/* =========================================================
   GET REAL QA DATA
========================================================= */

const loadMyData =
  async () => {

    const user =
      getCurrentUser();

    const [
      testsResponse,
      bugsResponse,
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
      !testsResponse.ok
    ) {

      throw new Error(
        `Failed to load test cases (${testsResponse.status})`
      );
    }

    if (
      !bugsResponse.ok
    ) {

      throw new Error(
        `Failed to load bug reports (${bugsResponse.status})`
      );
    }

    const testsResult =
      await testsResponse.json();

    const bugsResult =
      await bugsResponse.json();

    const allTests =
      extractArray<TestCase>(
        testsResult
      );

    const allBugs =
      extractArray<BugReport>(
        bugsResult
      );

    const myTests =
      allTests.filter(
        (test) =>
          matchesUser(
            test.assignedTo,
            user
          )
      );

    const myBugs =
      allBugs.filter(
        (bug) =>
          matchesUser(
            bug.assignedTo,
            user
          )
      );

    return {
      tests: myTests,
      bugs: myBugs,
    };
  };

/* =========================================================
   REPORT COMPONENT
========================================================= */

const QAReports: React.FC =
  () => {

    const [
      generatedReport,
      setGeneratedReport,
    ] =
      useState<string | null>(
        null
      );

    const [
      generatingReport,
      setGeneratingReport,
    ] =
      useState<string | null>(
        null
      );

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

    /* =======================================================
       GENERATE REPORT
    ======================================================= */

    const handleGenerate =
      async (
        title: string
      ) => {

        try {

          setGeneratingReport(
            title
          );

          setGeneratedReport(
            null
          );

          const {
            tests,
            bugs,
          } =
            await loadMyData();

          const today =
            new Date()
              .toISOString()
              .split("T")[0];

          /* =================================================
             SPRINT TEST SUMMARY
          ================================================= */

          if (
            title ===
            "Sprint Test Summary"
          ) {

            const passed =
              tests.filter(
                (test) =>
                  normalize(
                    test.status
                  ) ===
                  "passed"
              ).length;

            const failed =
              tests.filter(
                (test) =>
                  normalize(
                    test.status
                  ) ===
                  "failed"
              ).length;

            const blocked =
              tests.filter(
                (test) =>
                  normalize(
                    test.status
                  ) ===
                  "blocked"
              ).length;

            const inTesting =
              tests.filter(
                (test) =>
                  normalize(
                    test.status
                  ) ===
                  "in testing"
              ).length;

            downloadCsv(
              `sprint-test-summary-${today}.csv`,

              makeCsv(

                [
                  "Test ID",
                  "Test Title",
                  "Linked Task",
                  "Project",
                  "Priority",
                  "Status",
                  "Assigned To",
                ],

                tests.map(
                  (test) => [
                    test.testId,
                    test.title,
                    test.linkedTask,
                    test.project,
                    test.priority,
                    test.status,
                    test.assignedTo,
                  ]
                )
              ) +

              "\n" +

              makeCsv(
                [
                  "Metric",
                  "Value",
                ],
                [
                  [
                    "Total Tests",
                    tests.length,
                  ],
                  [
                    "Passed",
                    passed,
                  ],
                  [
                    "Failed",
                    failed,
                  ],
                  [
                    "Blocked",
                    blocked,
                  ],
                  [
                    "In Testing",
                    inTesting,
                  ],
                ]
              )
            );
          }

          /* =================================================
             BUG DENSITY REPORT
          ================================================= */

          if (
            title ===
            "Bug Density Report"
          ) {

            const bugMap =
              new Map<
                string,
                number
              >();

            bugs.forEach(
              (bug) => {

                const key =
                  String(
                    bug.assignedTo ||
                    "Unassigned"
                  );

                bugMap.set(
                  key,
                  (
                    bugMap.get(
                      key
                    ) || 0
                  ) + 1
                );
              }
            );

            downloadCsv(
              `bug-density-report-${today}.csv`,

              makeCsv(
                [
                  "Developer / Assignee",
                  "Bug Count",
                ],

                Array.from(
                  bugMap.entries()
                )
              )
            );
          }

          /* =================================================
             COVERAGE REPORT
          ================================================= */

          if (
            title ===
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

            tests.forEach(
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

                const status =
                  normalize(
                    test.status
                  );

                if (
                  [
                    "passed",
                    "failed",
                    "blocked",
                    "in testing",
                  ].includes(
                    status
                  )
                ) {
                  current.executed++;
                }

                if (
                  status ===
                  "passed"
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
                  data,
                ]) => [

                  project,

                  data.total,

                  data.executed,

                  data.passed,

                  data.total ===
                  0
                    ? 0
                    : Math.round(
                        (
                          data.executed /
                          data.total
                        ) * 100
                      ),
                ]
              );

            downloadCsv(
              `coverage-report-${today}.csv`,

              makeCsv(
                [
                  "Project / Module",
                  "Total Cases",
                  "Executed",
                  "Passed",
                  "Coverage %",
                ],
                rows
              )
            );
          }

          /* =================================================
             REGRESSION REPORT
          ================================================= */

          if (
            title ===
            "Regression Report"
          ) {

            const failedTests =
              tests.filter(
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

            const activeBugs =
              bugs.filter(
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
              );

            downloadCsv(
              `regression-report-${today}.csv`,

              makeCsv(
                [
                  "Source",
                  "ID",
                  "Title",
                  "Linked Task",
                  "Status",
                ],

                [
                  ...failedTests.map(
                    (
                      test
                    ) => [
                      "Test",
                      test.testId,
                      test.title,
                      test.linkedTask,
                      test.status,
                    ]
                  ),

                  ...activeBugs.map(
                    (
                      bug
                    ) => [
                      "Bug",
                      bug.bugId,
                      bug.title,
                      bug.linkedTaskId,
                      bug.status ||
                        "Open",
                    ]
                  ),
                ]
              )
            );
          }

          /* =================================================
             TEST EXECUTION LOG
          ================================================= */

          if (
            title ===
            "Test Execution Log"
          ) {

            downloadCsv(
              `test-execution-log-${today}.csv`,

              makeCsv(
                [
                  "Test ID",
                  "Title",
                  "Type",
                  "Linked Task",
                  "Priority",
                  "Status",
                  "Assigned To",
                  "Project",
                  "Created At",
                ],

                tests.map(
                  (test) => [
                    test.testId,
                    test.title,
                    test.type,
                    test.linkedTask,
                    test.priority,
                    test.status,
                    test.assignedTo,
                    test.project,
                    test.createdAt,
                  ]
                )
              )
            );
          }

          /* =================================================
             QUALITY SCORECARD
          ================================================= */

          if (
            title ===
            "Quality Scorecard"
          ) {

            const total =
              tests.length;

            const executed =
              tests.filter(
                (test) =>
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
              ).length;

            const passed =
              tests.filter(
                (test) =>
                  normalize(
                    test.status
                  ) ===
                  "passed"
              ).length;

            const failed =
              tests.filter(
                (test) =>
                  normalize(
                    test.status
                  ) ===
                  "failed"
              ).length;

            const blocked =
              tests.filter(
                (test) =>
                  normalize(
                    test.status
                  ) ===
                  "blocked"
              ).length;

            const coverage =
              total > 0
                ? (
                    (executed /
                      total) *
                    100
                  ).toFixed(2)
                : "0.00";

            const passRate =
              total > 0
                ? (
                    (passed /
                      total) *
                    100
                  ).toFixed(2)
                : "0.00";

            const executionRate =
              total > 0
                ? (
                    (executed /
                      total) *
                    100
                  ).toFixed(2)
                : "0.00";

            downloadCsv(
              `quality-scorecard-${today}.csv`,

              makeCsv(
                [
                  "Metric",
                  "Value",
                ],

                [
                  [
                    "Total Test Cases",
                    total,
                  ],
                  [
                    "Executed",
                    executed,
                  ],
                  [
                    "Passed",
                    passed,
                  ],
                  [
                    "Failed",
                    failed,
                  ],
                  [
                    "Blocked",
                    blocked,
                  ],
                  [
                    "Coverage %",
                    coverage,
                  ],
                  [
                    "Pass Rate %",
                    passRate,
                  ],
                  [
                    "Execution Rate %",
                    executionRate,
                  ],
                  [
                    "Assigned Bugs",
                    bugs.length,
                  ],
                ]
              )
            );
          }

          setGeneratedReport(
            title
          );

          window.setTimeout(
            () => {
              setGeneratedReport(
                null
              );
            },
            1800
          );

        } catch (error) {

          console.error(
            "Failed to generate QA report:",
            error
          );

          window.alert(
            error instanceof Error
              ? error.message
              : "Failed to generate report."
          );

        } finally {

          setGeneratingReport(
            null
          );
        }
      };

    return (
      <div
        className="w-full"
        style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >

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
                    : generatedReport ===
                      report.title
                    ? "Generated"
                    : "Generate Report"}
                </button>

              </div>

            )
          )}

        </div>

      </div>
    );
  };

export default QAReports;