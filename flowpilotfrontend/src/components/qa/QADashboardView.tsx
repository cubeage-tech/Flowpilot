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

const belongsToCurrentUser = (
  item: {
    assignedTo?: unknown;
    assignedUserId?: unknown;
    assignedToId?: unknown;
    assignedToEmail?: unknown;
    createdBy?: unknown;
  },
  user: StoredUser | null
): boolean => {
  if (!user) return false;

  const currentUserId = user.id ?? user.userId ?? user.employeeId;
  const currentUserEmail = user.email ? normalize(user.email) : "";
  const currentUserName = user.name || user.fullName || user.username || "";

  const targetUserId = item.assignedUserId ?? item.assignedToId;
  const targetEmail = item.assignedToEmail ? normalize(item.assignedToEmail) : "";

  // 1. By ID match
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

  // 2. By Email match
  if (targetEmail && currentUserEmail && targetEmail === currentUserEmail) {
    return true;
  }

  // 3. If assignedTo or createdBy is an email address
  if (item.assignedTo && String(item.assignedTo).includes("@") && currentUserEmail) {
    if (normalize(item.assignedTo) === currentUserEmail) return true;
  }
  if (item.createdBy && String(item.createdBy).includes("@") && currentUserEmail) {
    if (normalize(item.createdBy) === currentUserEmail) return true;
  }

  // 4. By Name match
  if (item.assignedTo && currentUserName) {
    if (normalize(item.assignedTo) === normalize(currentUserName)) return true;
  }
  if (item.createdBy && currentUserName) {
    if (normalize(item.createdBy) === normalize(currentUserName)) return true;
  }

  return false;
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
         * GET TEST CASES & BUGS
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
         * CURRENT USER'S TESTS (Fallback to all active tests if none assigned specifically yet)
         */
        const myTests =
          allTests.filter(
            (test) =>
              belongsToCurrentUser(
                test,
                user
              )
          );

        const effectiveTests =
          myTests.length > 0 ? myTests : allTests;

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
         * CURRENT USER'S OPEN BUGS (Filed by QA or assigned to user, fallback to all open bugs)
         */
        const userBugs =
          allBugs.filter(
            (bug) =>
              belongsToCurrentUser(
                bug,
                user
              )
          );

        const effectiveBugs =
          userBugs.length > 0 ? userBugs : allBugs;

        const myOpenBugs =
          effectiveBugs.filter(
            (bug) => {
              const status = normalize(bug.status || "open");
              return status === "open" || status === "in progress" || status === "reopened";
            }
          ).length;

        setTestTasks(
          effectiveTests
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

  // Active testing tasks: Tasks in testing, in progress, or pending execution
  const testsInProgress =
    testTasks.filter(
      (task) => {
        const s = normalize(task.status);
        return (
          s === "in testing" ||
          s === "testing" ||
          s === "in progress" ||
          s === "pending" ||
          s === ""
        );
      }
    ).length;

  // Completed tests that passed
  const testsPassed =
    testTasks.filter(
      (task) =>
        normalize(
          task.status
        ) === "passed"
    ).length;

  const totalTests =
    testTasks.length;

  // Real Pass Rate: percentage of passed tests out of total tests
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
                            normalize(task.status) === "passed"
                              ? "bg-[#20c978]"
                              : normalize(task.status) === "in testing" || normalize(task.status) === "in progress"
                              ? "bg-[#f5a000]"
                              : normalize(task.status) === "pending"
                              ? "bg-[#3b82f6]"
                              : normalize(task.status) === "failed" || normalize(task.status) === "blocked"
                              ? "bg-[#ff3b3b]"
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
                          normalize(task.status) === "passed"
                            ? "bg-[#eafaf2] text-[#25c979]"
                            : normalize(task.status) === "in testing" || normalize(task.status) === "in progress"
                            ? "bg-[#fff6e7] text-[#e99a00]"
                            : normalize(task.status) === "pending"
                            ? "bg-[#eff6ff] text-[#2563eb]"
                            : normalize(task.status) === "failed" || normalize(task.status) === "blocked"
                            ? "bg-[#fff0f0] text-[#ff3b3b]"
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
                        In Progress
                      </p>

                      <p className="mt-1 text-[18px] font-semibold text-[#f59e0b]">
                        {testsInProgress}
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

                    <div className="rounded-[8px] bg-[#f8fafc] p-3">

                      <p className="text-[9px] text-[#8d98a8]">
                        Pass Rate
                      </p>

                      <p className="mt-1 text-[18px] font-semibold text-[#10b981]">
                        {passRate}%
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