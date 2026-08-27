import { useCallback, useEffect, useState } from "react";
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

/* =========================================================
   GET LOGGED-IN USER
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
    const value = localStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsed = JSON.parse(value);

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

  const id =
    localStorage.getItem("userId") ||
    localStorage.getItem("id") ||
    undefined;

  const employeeId =
    localStorage.getItem("employeeId") ||
    undefined;

  const name =
    localStorage.getItem("name") ||
    localStorage.getItem("fullName") ||
    localStorage.getItem("username") ||
    undefined;

  const username =
    localStorage.getItem("username") ||
    undefined;

  const email =
    localStorage.getItem("email") ||
    undefined;

  if (
    id ||
    employeeId ||
    name ||
    username ||
    email
  ) {
    return {
      id,
      employeeId,
      name,
      username,
      email,
    };
  }

  return null;
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
      const parsed = JSON.parse(value);

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
      // Continue searching.
    }
  }

  return null;
};

/* =========================================================
   AXIOS CONFIG
========================================================= */

const getAxiosConfig = () => {
  const token = getAuthToken();

  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

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
   CHECK CURRENT USER OWNERSHIP
========================================================= */

const belongsToCurrentUser = (
  testCase: TestCase,
  user: StoredUser | null
): boolean => {
  if (!user) {
    return false;
  }

  const assignedValues = [
    testCase.assignedTo,
    testCase.assignedToId,
    testCase.assignedUserId,
  ]
    .filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    )
    .map(normalize);

  if (assignedValues.length === 0) {
    return false;
  }

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

  return assignedValues.some(
    (assignedValue) =>
      userValues.includes(
        assignedValue
      )
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const QATestCases = () => {
  const [
    testCases,
    setTestCases,
  ] = useState<TestCase[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(null);

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    const user =
      getCurrentUser();

    setCurrentUser(user);
  }, []);

  /* =======================================================
     LOAD TEST CASES
  ======================================================= */

  const loadTestCases =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const user =
          getCurrentUser();

        setCurrentUser(user);

        /*
         * Calling this endpoint causes the backend to:
         *
         * Scrum Master tasks
         *        ↓
         * QA synchronization
         *        ↓
         * qa_test_cases
         *
         * before returning the QA data.
         */
        const response =
          await axios.get(
            API_URL,
            getAxiosConfig()
          );

        const result =
          response.data;

        const allTestCases: TestCase[] =
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
         * Only show records assigned to
         * the currently logged-in QA user.
         */
        const myTestCases =
          allTestCases.filter(
            (testCase) =>
              belongsToCurrentUser(
                testCase,
                user
              )
          );

        setTestCases(
          myTestCases
        );
      } catch (err: any) {
        console.error(
          "Failed to load test cases:",
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
            "Failed to load test cases."
          );
        }

        setTestCases([]);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadTestCases();
  }, [loadTestCases]);

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const updateStatus = async (
    id: number,
    status:
      | "Passed"
      | "Failed"
  ) => {
    try {
      setUpdatingId(id);
      setError("");

      const response =
        await axios.put(
          `${API_URL}/${id}/status`,
          {
            status,
          },
          getAxiosConfig()
        );

      const updated =
        response.data as TestCase;

      setTestCases(
        (current) =>
          current.map(
            (testCase) =>
              testCase.id === id
                ? {
                    ...testCase,
                    status:
                      updated?.status ||
                      status,
                  }
                : testCase
          )
      );
    } catch (err: any) {
      console.error(
        "Failed to update status:",
        err
      );

      if (
        err?.response?.status === 401
      ) {
        setError(
          "Authentication required. Please login again."
        );
      } else if (
        err?.response?.status === 403
      ) {
        setError(
          "Access denied. You cannot update this test case."
        );
      } else {
        setError(
          "Failed to update test case status."
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  /* =======================================================
     PRIORITY
  ======================================================= */

  const getPriorityClass = (
    priority: string
  ) => {
    switch (priority) {
      case "High":
        return "bg-[#fff0f0] text-[#ff3b3b]";

      case "Medium":
        return "bg-[#fff7e8] text-[#e99a00]";

      case "Low":
        return "bg-[#eef7ff] text-[#4388d8]";

      default:
        return "bg-[#f4f6f8] text-[#657184]";
    }
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "Passed":
        return "bg-[#eafaf2] text-[#20c978]";

      case "In Testing":
        return "bg-[#fff6e7] text-[#e99a00]";

      case "Failed":
        return "bg-[#fff0f0] text-[#ff3b3b]";

      case "Blocked":
        return "bg-[#fff0f0] text-[#ff3b3b]";

      default:
        return "bg-[#f4f6f8] text-[#9aa8bb]";
    }
  };

  /* =======================================================
     DATE
  ======================================================= */

  const formatDate = (
    createdAt?: string
  ) => {
    if (!createdAt) {
      return "-";
    }

    const date =
      new Date(createdAt);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  };

  /* =======================================================
     UI
  ======================================================= */

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
            font-medium
            text-[#ff4b4b]
          "
        >
          {error}
        </div>
      )}

      {currentUser && (
        <div
          className="
            mb-3
            text-[10px]
            text-[#8d98a8]
          "
        >
          Showing tasks assigned to{" "}
          <span className="font-semibold text-[#111827]">
            {currentUser.name ||
              currentUser.fullName ||
              currentUser.username ||
              currentUser.email}
          </span>
        </div>
      )}

      {/* DESKTOP */}

      <div className="hidden md:block w-full overflow-x-auto">

        <div
          className="
            min-w-[1050px]
            bg-white
            border
            border-[#e5e7eb]
            rounded-[12px]
            overflow-hidden
            shadow-[0_2px_8px_rgba(17,24,39,0.05)]
          "
        >

          <div
            className="
              grid
              grid-cols-[110px_minmax(300px,1fr)_120px_130px_110px_120px_100px_95px]
              items-center
              h-[40px]
              px-3
              border-b
              border-[#e5e7eb]
            "
          >

            {[
              "TEST ID",
              "TEST TITLE",
              "TYPE",
              "LINKED TASK",
              "PRIORITY",
              "STATUS",
              "DATE",
              "ACTION",
            ].map((heading) => (
              <div
                key={heading}
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.06em]
                  text-[#7c8796]
                "
              >
                {heading}
              </div>
            ))}

          </div>

          {loading && (
            <div className="py-10 text-center text-[10px] text-[#9aa8bb]">
              Loading test cases...
            </div>
          )}

          {!loading &&
            testCases.length === 0 &&
            !error && (
              <div className="py-10 text-center text-[10px] text-[#9aa8bb]">
                No test cases assigned to you.
              </div>
            )}

          {!loading &&
            testCases.map(
              (
                testCase,
                index
              ) => (
                <div
                  key={testCase.id}
                  className={`
                    grid
                    grid-cols-[110px_minmax(300px,1fr)_120px_130px_110px_120px_100px_95px]
                    items-center
                    h-[50px]
                    px-3
                    bg-white
                    ${
                      index !==
                      testCases.length - 1
                        ? "border-b border-[#eeeeee]"
                        : ""
                    }
                  `}
                >

                  <div className="text-[9px] text-[#8d98a8]">
                    {testCase.testId}
                  </div>

                  <div className="min-w-0 pr-3">
                    <p className="text-[11px] font-semibold text-[#111827] truncate">
                      {testCase.title}
                    </p>
                  </div>

                  <div>

                    <span className="rounded-[6px] bg-[#f4f6f8] px-2 py-1 text-[9px] text-[#657184]">
                      {testCase.type || "-"}
                    </span>

                  </div>

                  <div className="text-[9px] text-[#8d98a8]">
                    {testCase.linkedTask || "-"}
                  </div>

                  <div>

                    <span
                      className={`
                        rounded-[6px]
                        px-2
                        py-1
                        text-[9px]
                        font-semibold
                        ${getPriorityClass(
                          testCase.priority
                        )}
                      `}
                    >
                      {testCase.priority || "-"}
                    </span>

                  </div>

                  <div>

                    <span
                      className={`
                        rounded-[6px]
                        px-2
                        py-1
                        text-[9px]
                        font-semibold
                        ${getStatusClass(
                          testCase.status
                        )}
                      `}
                    >
                      {testCase.status ||
                        "Pending"}
                    </span>

                  </div>

                  <div className="text-[9px] text-[#8d98a8]">
                    {formatDate(
                      testCase.createdAt
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">

                    {testCase.status !==
                      "Passed" && (
                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          testCase.id
                        }
                        onClick={() =>
                          updateStatus(
                            testCase.id,
                            "Passed"
                          )
                        }
                        className="
                          h-6
                          rounded-[6px]
                          border
                          border-[#b9ead4]
                          bg-[#f0fbf6]
                          px-2
                          text-[9px]
                          font-semibold
                          text-[#20b978]
                        "
                      >
                        {updatingId ===
                        testCase.id
                          ? "..."
                          : "Pass"}
                      </button>
                    )}

                    {testCase.status !==
                      "Failed" && (
                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          testCase.id
                        }
                        onClick={() =>
                          updateStatus(
                            testCase.id,
                            "Failed"
                          )
                        }
                        className="
                          h-6
                          rounded-[6px]
                          border
                          border-[#ffc9c9]
                          bg-[#fff4f4]
                          px-2
                          text-[9px]
                          font-semibold
                          text-[#ff4b4b]
                        "
                      >
                        {updatingId ===
                        testCase.id
                          ? "..."
                          : "Fail"}
                      </button>
                    )}

                  </div>

                </div>
              )
            )}

        </div>

      </div>

      {/* MOBILE */}

      <div className="md:hidden space-y-3">

        {loading && (
          <div className="py-8 text-center text-[10px] text-[#9aa8bb]">
            Loading test cases...
          </div>
        )}

        {!loading &&
          testCases.length === 0 &&
          !error && (
            <div className="py-8 text-center text-[10px] text-[#9aa8bb]">
              No test cases assigned to you.
            </div>
          )}

        {!loading &&
          testCases.map(
            (testCase) => (
              <div
                key={testCase.id}
                className="
                  rounded-[12px]
                  border
                  border-[#e5e7eb]
                  bg-white
                  p-4
                  shadow-sm
                "
              >

                <div className="flex items-start justify-between gap-2 mb-3">

                  <div>

                    <p className="text-[9px] text-[#8d98a8]">
                      {testCase.testId}
                    </p>

                    <p className="text-[11px] font-semibold text-[#111827]">
                      {testCase.title}
                    </p>

                  </div>

                  <span
                    className={`
                      rounded-[6px]
                      px-2
                      py-1
                      text-[9px]
                      font-semibold
                      ${getStatusClass(
                        testCase.status
                      )}
                    `}
                  >
                    {testCase.status ||
                      "Pending"}
                  </span>

                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px]">

                  <div>

                    <span className="text-[#9aa8bb]">
                      Type:
                    </span>{" "}

                    {testCase.type ||
                      "-"}

                  </div>

                  <div>

                    <span className="text-[#9aa8bb]">
                      Task:
                    </span>{" "}

                    {testCase.linkedTask ||
                      "-"}

                  </div>

                  <div>

                    <span className="text-[#9aa8bb]">
                      Priority:
                    </span>{" "}

                    {testCase.priority ||
                      "-"}

                  </div>

                  <div>

                    <span className="text-[#9aa8bb]">
                      Date:
                    </span>{" "}

                    {formatDate(
                      testCase.createdAt
                    )}

                  </div>

                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-[#eeeeee]">

                  {testCase.status !==
                    "Passed" && (
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        testCase.id
                      }
                      onClick={() =>
                        updateStatus(
                          testCase.id,
                          "Passed"
                        )
                      }
                      className="
                        h-[26px]
                        rounded-[6px]
                        border
                        border-[#b9ead4]
                        bg-[#f0fbf6]
                        px-3
                        text-[9px]
                        font-semibold
                        text-[#20b978]
                      "
                    >
                      {updatingId ===
                      testCase.id
                        ? "..."
                        : "Pass"}
                    </button>
                  )}

                  {testCase.status !==
                    "Failed" && (
                    <button
                      type="button"
                      disabled={
                        updatingId ===
                        testCase.id
                      }
                      onClick={() =>
                        updateStatus(
                          testCase.id,
                          "Failed"
                        )
                      }
                      className="
                        h-[26px]
                        rounded-[6px]
                        border
                        border-[#ffc9c9]
                        bg-[#fff4f4]
                        px-3
                        text-[9px]
                        font-semibold
                        text-[#ff4b4b]
                      "
                    >
                      {updatingId ===
                      testCase.id
                        ? "..."
                        : "Fail"}
                    </button>
                  )}

                </div>

              </div>
            )
          )}

      </div>

    </div>
  );
};

export default QATestCases;