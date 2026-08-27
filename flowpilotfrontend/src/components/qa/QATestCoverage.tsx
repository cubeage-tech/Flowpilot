import React, {
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
  projectId?: number;
  createdAt?: string;
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

const API_URL =
  "http://localhost:8080/api/qa/test-cases";

const normalize = (
  value: unknown
): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

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
        localStorage.getItem("id") ||
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
        localStorage.getItem("name") ||
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
        localStorage.getItem("email") ||
        sessionStorage.getItem(
          "email"
        ) ||
        undefined,
    };
  };

const getToken = () => {

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

const belongsToUser = (
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
    normalize(assignedTo);

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

const QATestCoverage: React.FC =
  () => {

    const [testCases, setTestCases] =
      useState<TestCase[]>([]);

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState("");

    const loadCoverage =
      useCallback(async () => {

        try {

          setLoading(true);
          setError("");

          const user =
            getCurrentUser();

          const token =
            getToken();

          const response =
            await axios.get(
              API_URL,
              token
                ? {
                    headers: {
                      Authorization:
                        `Bearer ${token}`,
                      "Content-Type":
                        "application/json",
                    },
                  }
                : {}
            );

          const result =
            response.data;

          const allTests: TestCase[] =
            Array.isArray(result)
              ? result
              : Array.isArray(
                  result?.data
                )
              ? result.data
              : Array.isArray(
                  result?.testCases
                )
              ? result.testCases
              : [];

          /*
           * ONLY CURRENT USER
           */
          const mine =
            allTests.filter(
              (test) =>
                belongsToUser(
                  test.assignedTo,
                  user
                )
            );

          setTestCases(mine);

        } catch (err: any) {

          console.error(
            "Failed to load test coverage:",
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
              "Failed to load test coverage."
            );
          }

        } finally {

          setLoading(false);
        }

      }, []);

    useEffect(() => {
      loadCoverage();
    }, [loadCoverage]);

    /*
     * =======================================================
     * REAL SUMMARY COUNTS
     * =======================================================
     */

    const total =
      testCases.length;

    const executed =
      testCases.filter(
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
      testCases.filter(
        (test) =>
          normalize(
            test.status
          ) === "passed"
      ).length;

    const failedBlocked =
      testCases.filter(
        (test) =>
          [
            "failed",
            "blocked",
          ].includes(
            normalize(
              test.status
            )
          )
      ).length;

    /*
     * =======================================================
     * REAL MODULE / PROJECT COVERAGE
     *
     * Your current QATestCase has "project".
     * So we use the actual project value as the module
     * grouping instead of inventing module names.
     * =======================================================
     */

    const moduleMap =
      new Map<
        string,
        {
          cases: number;
          executed: number;
        }
      >();

    testCases.forEach(
      (test) => {

        const module =
          test.project?.trim() ||
          "Unassigned";

        const current =
          moduleMap.get(
            module
          ) || {
            cases: 0,
            executed: 0,
          };

        current.cases++;

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

        moduleMap.set(
          module,
          current
        );
      }
    );

    const coverageData =
      Array.from(
        moduleMap.entries()
      ).map(
        ([name, values]) => {

          const percentage =
            values.cases === 0
              ? 0
              : Math.round(
                  (values.executed /
                    values.cases) *
                  100
                );

          return {
            name,
            cases:
              values.cases,
            percentage,
          };
        }
      );

    /*
     * =======================================================
     * COVERAGE COLORS
     * =======================================================
     */

    const getBarColor = (
      percentage: number
    ) => {

      if (percentage >= 80) {
        return "bg-emerald-400";
      }

      if (percentage >= 70) {
        return "bg-amber-500";
      }

      if (percentage >= 60) {
        return "bg-orange-500";
      }

      return "bg-red-500";
    };

    const getTextColor = (
      percentage: number
    ) => {

      if (percentage >= 80) {
        return "text-emerald-500";
      }

      if (percentage >= 70) {
        return "text-amber-500";
      }

      if (percentage >= 60) {
        return "text-orange-500";
      }

      return "text-red-500";
    };

    return (
      <div className="w-full min-h-full bg-[#f8fafc] text-slate-800">

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-5">

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

          {/* =========================================================
              COVERAGE SUMMARY
          ========================================================= */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">

            {/* Total Test Cases */}

            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm min-w-0">

              <div className="text-[9px] sm:text-[10px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                Total Test Cases
              </div>

              <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-500">
                {loading
                  ? "..."
                  : total}
              </div>

            </div>

            {/* Executed */}

            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm min-w-0">

              <div className="text-[9px] sm:text-[10px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                Executed
              </div>

              <div className="mt-2 text-2xl sm:text-3xl font-bold text-green-600">
                {loading
                  ? "..."
                  : executed}
              </div>

            </div>

            {/* Passed */}

            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm min-w-0">

              <div className="text-[9px] sm:text-[10px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                Passed
              </div>

              <div className="mt-2 text-2xl sm:text-3xl font-bold text-green-600">
                {loading
                  ? "..."
                  : passed}
              </div>

            </div>

            {/* Failed / Blocked */}

            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm min-w-0">

              <div className="text-[9px] sm:text-[10px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                Failed / Blocked
              </div>

              <div className="mt-2 text-2xl sm:text-3xl font-bold text-red-500">
                {loading
                  ? "..."
                  : failedBlocked}
              </div>

            </div>

          </div>

          {/* =========================================================
              COVERAGE BY MODULE
          ========================================================= */}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5">

            <div className="mb-4">

              <h2 className="text-sm sm:text-[15px] font-semibold text-slate-900">
                Coverage by Module
              </h2>

            </div>

            <div className="space-y-4">

              {coverageData.map(
                (item) => (
                  <div
                    key={
                      item.name
                    }
                    className="w-full"
                  >

                    <div className="flex items-center justify-between gap-3 mb-1.5">

                      <div className="flex items-center min-w-0 flex-1">

                        <span className="text-[11px] sm:text-xs font-medium text-slate-700 truncate">
                          {item.name}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 shrink-0">

                        <span className="text-[9px] sm:text-[10px] text-slate-400">
                          {item.cases}{" "}
                          {item.cases === 1
                            ? "case"
                            : "cases"}
                        </span>

                        <span
                          className={`text-[10px] sm:text-[11px] font-semibold ${getTextColor(
                            item.percentage
                          )}`}
                        >
                          {item.percentage}%
                        </span>

                      </div>

                    </div>

                    <div className="w-full h-[5px] sm:h-[6px] bg-slate-100 rounded-full overflow-hidden">

                      <div
                        className={`h-full rounded-full ${getBarColor(
                          item.percentage
                        )}`}
                        style={{
                          width:
                            `${Math.min(
                              100,
                              Math.max(
                                0,
                                item.percentage
                              )
                            )}%`,
                        }}
                      />

                    </div>

                  </div>
                )
              )}

              {!loading &&
                coverageData.length ===
                  0 && (

                  <div className="py-8 text-center text-[10px] text-slate-400">
                    No test coverage data available.
                  </div>

                )}

            </div>

          </div>

        </div>
      </div>
    );
  };

export default QATestCoverage;