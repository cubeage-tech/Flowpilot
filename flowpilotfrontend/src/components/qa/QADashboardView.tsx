import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";

interface TestCase {
  id: number;
  testId: string;
  title: string;
  type: string;
  linkedTask: string;
  priority: string;
  status: string;
  assignedTo?: string | number;
  assignedToId?: string | number;
  assignedUserId?: string | number;
  project?: string;
  createdAt?: string;
  scrumTaskId?: number;
  projectId?: number;
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

const TEST_CASE_API =
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
   GET CURRENT USER
========================================================= */

const getCurrentUser = (): StoredUser | null => {
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

  const user: StoredUser = {
    id:
      localStorage.getItem("userId") ||
      localStorage.getItem("id") ||
      sessionStorage.getItem("userId") ||
      sessionStorage.getItem("id") ||
      undefined,

    userId:
      localStorage.getItem("userId") ||
      sessionStorage.getItem("userId") ||
      undefined,

    employeeId:
      localStorage.getItem("employeeId") ||
      sessionStorage.getItem("employeeId") ||
      undefined,

    name:
      localStorage.getItem("name") ||
      localStorage.getItem("fullName") ||
      sessionStorage.getItem("name") ||
      sessionStorage.getItem("fullName") ||
      undefined,

    fullName:
      localStorage.getItem("fullName") ||
      sessionStorage.getItem("fullName") ||
      undefined,

    username:
      localStorage.getItem("username") ||
      sessionStorage.getItem("username") ||
      undefined,

    email:
      localStorage.getItem("email") ||
      sessionStorage.getItem("email") ||
      undefined,
  };

  const hasUser =
    Object.values(user).some(
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    );

  return hasUser ? user : null;
};

/* =========================================================
   TOKEN
========================================================= */

const getAuthToken = (): string | null => {
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

  return null;
};

/* =========================================================
   AXIOS CONFIG
========================================================= */

const getAxiosConfig = () => {
  const token =
    getAuthToken();

  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization:
        `Bearer ${token}`,
      "Content-Type":
        "application/json",
    },
  };
};

/* =========================================================
   USER MATCH
========================================================= */

const belongsToUser = (
  assignedTo: unknown,
  user: StoredUser | null
): boolean => {
  if (!user || assignedTo == null) {
    return false;
  }

  const assigned =
    normalize(assignedTo);

  const values = [
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

  return values.includes(
    assigned
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const QADashboardView = () => {
  const [testTasks, setTestTasks] =
    useState<TestCase[]>([]);

  const [openBugs, setOpenBugs] =
    useState(0);

  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const user =
          getCurrentUser();

        setCurrentUser(user);

        /*
         * GET TEST CASES
         *
         * QATestCaseService automatically synchronizes
         * Scrum Master tasks before returning the records.
         */
        const [
          testResponse,
          bugResponse,
        ] = await Promise.all([
          axios.get(
            TEST_CASE_API,
            getAxiosConfig()
          ),

          axios.get(
            BUG_API,
            getAxiosConfig()
          ),
        ]);

        /* =================================================
           TEST CASE DATA
        ================================================= */

        const testResult =
          testResponse.data;

        const allTests: TestCase[] =
          Array.isArray(testResult)
            ? testResult
            : Array.isArray(
                testResult?.data
              )
            ? testResult.data
            : Array.isArray(
                testResult?.testCases
              )
            ? testResult.testCases
            : [];

        /*
         * ONLY CURRENT USER'S TESTS
         */
        const myTests =
          allTests.filter(
            (test) =>
              belongsToUser(
                test.assignedTo,
                user
              )
          );

        /* =================================================
           BUG DATA
        ================================================= */

        const bugResult =
          bugResponse.data;

        const allBugs: BugReport[] =
          Array.isArray(bugResult)
            ? bugResult
            : Array.isArray(
                bugResult?.data
              )
            ? bugResult.data
            : [];

        /*
         * ONLY CURRENT USER'S OPEN BUGS
         */
        const myOpenBugs =
          allBugs.filter(
            (bug) =>
              belongsToUser(
                bug.assignedTo,
                user
              ) &&
              normalize(
                bug.status ||
                "Open"
              ) === "open"
          ).length;

        setTestTasks(
          myTests
        );

        setOpenBugs(
          myOpenBugs
        );
      } catch (err: any) {
        console.error(
          "Failed to load QA dashboard:",
          err
        );

        if (
          err?.response?.status ===
          401
        ) {
          setError(
            "Authentication required. Please login again."
          );
        } else if (
          err?.response?.status ===
          403
        ) {
          setError(
            "Access denied. Please login again."
          );
        } else {
          setError(
            "Failed to load dashboard data."
          );
        }

        setTestTasks([]);
        setOpenBugs(0);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const testsInProgress =
    testTasks.filter(
      (task) =>
        normalize(
          task.status
        ) === "in testing"
    ).length;

  const testsPassed =
    testTasks.filter(
      (task) =>
        normalize(
          task.status
        ) === "passed"
    ).length;

  const totalTests =
    testTasks.length;

  const passRate =
    totalTests > 0
      ? Math.round(
          (testsPassed /
            totalTests) *
          100
        )
      : 0;

  return (
    <div className="w-full">

      {error && (
        <div
          className="
            mb-3
            rounded-[6px]
            border
            border-[#ffc9c9]
            bg-[#fff4f4]
            px-3
            py-2
            text-[9px]
            text-[#ff4b4b]
          "
        >
          {error}
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-2 gap-[10px] xl:grid-cols-4">

        {[
          {
            label:
              "Tests in Progress",
            value:
              String(
                testsInProgress
              ),
            sub:
              "Active testing tasks",
            subColor:
              "text-[#32d583]",
          },

          {
            label:
              "Tests Passed",
            value:
              String(
                testsPassed
              ),
            sub:
              "Your completed tests",
            subColor:
              "text-[#32d583]",
          },

          {
            label:
              "Open Bugs",
            value:
              String(
                openBugs
              ),
            sub:
              "Assigned to you",
            subColor:
              "text-[#ff3b3b]",
          },

          {
            label:
              "Pass Rate",
            value:
              `${passRate}%`,
            sub:
              "Your test pass rate",
            subColor:
              "text-[#32d583]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="
              rounded-[12px]
              border
              border-[#ededed]
              bg-white
              px-3
              py-3
              md:px-[18px]
              md:py-[17px]
              shadow-[0_2px_8px_rgba(17,24,39,0.05)]
            "
          >
            <p
              className="
                text-[9px]
                md:text-[10px]
                font-semibold
                uppercase
                tracking-[0.09em]
                text-[#7c8796]
              "
            >
              {stat.label}
            </p>

            <p
              className="
                mt-2
                text-[20px]
                md:text-[25px]
                font-semibold
                leading-none
                text-[#111827]
              "
            >
              {loading
                ? "..."
                : stat.value}
            </p>

            <p
              className={`
                mt-1.5
                text-[9px]
                md:text-[10px]
                font-medium
                ${stat.subColor}
              `}
            >
              {stat.sub}
            </p>
          </div>
        ))}

      </div>

      {/* =====================================================
          LOWER
      ===================================================== */}

      <div
        className="
          mt-[14px]
          grid
          grid-cols-1
          gap-[14px]
          xl:grid-cols-[1.03fr_0.97fr]
        "
      >

        {/* ===================================================
            MY TEST TASK STATUS
        =================================================== */}

        <div
          className="
            min-h-[306px]
            overflow-hidden
            rounded-[12px]
            border
            border-[#ededed]
            bg-white
            shadow-[0_2px_8px_rgba(17,24,39,0.05)]
          "
        >

          <div className="px-[20px] pt-[20px]">

            <h2
              className="
                text-[12px]
                font-semibold
                text-[#111827]
              "
            >
              My Test Task Status
            </h2>

          </div>

          <div className="mt-[5px] px-[20px] pb-[5px]">

            {loading && (
              <div className="py-10 text-center text-[10px] text-[#9aa8bb]">
                Loading your tasks...
              </div>
            )}

            {!loading &&
              testTasks.length === 0 && (
                <div className="py-10 text-center text-[10px] text-[#9aa8bb]">
                  No test tasks assigned to you.
                </div>
              )}

            {!loading &&
              testTasks.map(
                (task, index) => (
                  <div
                    key={
                      task.id
                    }
                    className={`
                      flex
                      h-[59px]
                      items-center
                      justify-between
                      ${
                        index !==
                        testTasks.length - 1
                          ? "border-b border-[#eeeeee]"
                          : ""
                      }
                    `}
                  >

                    <div className="flex min-w-0 items-center">

                      <span
                        className={`
                          mr-[11px]
                          h-[7px]
                          w-[7px]
                          shrink-0
                          rounded-full
                          ${
                            normalize(
                              task.status
                            ) === "passed"
                              ? "bg-[#20c978]"
                              : normalize(
                                  task.status
                                ) ===
                                "in testing"
                              ? "bg-[#f5a000]"
                              : "bg-[#9aa8bb]"
                          }
                        `}
                      />

                      <div className="min-w-0">

                        <p
                          className="
                            truncate
                            text-[11px]
                            font-semibold
                            text-[#111827]
                          "
                        >
                          {task.title}
                        </p>

                        <p
                          className="
                            mt-[2px]
                            text-[9px]
                            text-[#a1a8b3]
                          "
                        >
                          {task.type} ·{" "}
                          {task.linkedTask}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`
                        ml-3
                        shrink-0
                        rounded-[6px]
                        px-[8px]
                        py-[3px]
                        text-[9px]
                        font-medium
                        ${
                          normalize(
                            task.status
                          ) === "passed"
                            ? "bg-[#eafaf2] text-[#25c979]"
                            : normalize(
                                task.status
                              ) ===
                              "in testing"
                            ? "bg-[#fff6e7] text-[#e99a00]"
                            : "bg-[#f4f6f8] text-[#9aa8bb]"
                        }
                      `}
                    >
                      {task.status ||
                        "Pending"}
                    </span>

                  </div>
                )
              )}

          </div>

        </div>

        {/* ===================================================
            QA SUMMARY
        =================================================== */}

        <div
          className="
            min-h-[306px]
            overflow-hidden
            rounded-[12px]
            border
            border-[#ededed]
            bg-white
            shadow-[0_2px_8px_rgba(17,24,39,0.05)]
          "
        >

          <div className="px-[20px] pt-[20px]">

            <h2
              className="
                text-[12px]
                font-semibold
                text-[#111827]
              "
            >
              QA Summary
            </h2>

          </div>

          <div className="px-[20px] pt-[15px]">

            {(() => {
              const user =
                currentUser ||
                getCurrentUser();

              const userName =
                user?.name ||
                user?.fullName ||
                user?.username ||
                user?.email ||
                "QA User";

              const initials =
                userName
                  .split(" ")
                  .filter(Boolean)
                  .map(
                    (part) =>
                      part.charAt(
                        0
                      )
                  )
                  .join("")
                  .substring(
                    0,
                    2
                  )
                  .toUpperCase();

              return (
                <>
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      pb-4
                      border-b
                      border-[#eeeeee]
                    "
                  >

                    <div
                      className="
                        h-10
                        w-10
                        rounded-full
                        bg-[#24cfa0]
                        flex
                        items-center
                        justify-center
                        text-[12px]
                        font-bold
                        text-white
                      "
                    >
                      {initials}
                    </div>

                    <div>

                      <p className="text-[12px] font-semibold text-[#111827]">
                        {userName}
                      </p>

                      <p className="text-[9px] text-[#a1a8b3]">
                        QA Engineer
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">

                    <div className="rounded-[8px] bg-[#f8fafc] p-3">

                      <p className="text-[9px] text-[#8d98a8]">
                        Total Tasks
                      </p>

                      <p className="mt-1 text-[18px] font-semibold text-[#111827]">
                        {totalTests}
                      </p>

                    </div>

                    <div className="rounded-[8px] bg-[#f8fafc] p-3">

                      <p className="text-[9px] text-[#8d98a8]">
                        Passed
                      </p>

                      <p className="mt-1 text-[18px] font-semibold text-[#20c978]">
                        {testsPassed}
                      </p>

                    </div>

                  </div>
                </>
              );
            })()}

          </div>

        </div>

      </div>
    </div>
  );
};

export default QADashboardView;