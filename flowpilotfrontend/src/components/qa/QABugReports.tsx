import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

type BugReport = {
  id?: number;
  bugId: string;
  title: string;
  projectId?: number;
  linkedTaskId: string;
  environment: string;
  severity: string;
  assignedTo: string;
  createdBy?: string;
  stepsToReproduce: string;
  screenshot?: string;
  status?: string;
  createdAt?: string;
  filedDate?: string;
};

type BugForm = {
  bugId: string;
  bugTitle: string;
  projectId: string;
  linkedTaskId: string;
  environment: string;
  severity: string;
  assignedTo: string;
  stepsToReproduce: string;
  screenshot?: string;
};

type BugReply = {
  id: number;
  bugId?: string;
  qaBugReportId?: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt?: string;
  time?: string;
};

type Project = {
  id: number;
  projectCode: string;
  projectName: string;
  teamMemberIds?: Array<number | string>;
};

type Member = {
  employeeId: number | string;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  status: string;
  lastLogin: string;
  initials: string;
};

type StoredUser = {
  id?: string | number;
  userId?: string | number;
  employeeId?: string | number;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
};

const BUG_API_URL =
  "http://localhost:8080/api/qa/bugs";

const PROJECT_API_URL =
  "http://localhost:8080/api/pm/projects";

const SUPERADMIN_USERS_URL =
  "http://localhost:8080/api/superadmin/users";

const emptyForm: BugForm = {
  bugId: "",
  bugTitle: "",
  projectId: "",
  linkedTaskId: "",
  environment: "Dev",
  severity: "Medium",
  assignedTo: "",
  stepsToReproduce: "",
  screenshot: "",
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

  const fallback: StoredUser = {
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
      localStorage.getItem("username") ||
      sessionStorage.getItem("name") ||
      sessionStorage.getItem("fullName") ||
      sessionStorage.getItem("username") ||
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

  const hasUser = Object.values(fallback).some(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );

  return hasUser ? fallback : null;
};

/* =========================================================
   USER NAME
========================================================= */

const getUserName = (
  user: StoredUser | null
): string => {
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
    "accessToken",
    "jwtToken",
    "authToken",
    "jwt",
    "access_token",
  ];

  for (const key of keys) {
    const localToken =
      localStorage.getItem(key);

    if (localToken) {
      return localToken.replace(
        /^Bearer\s+/i,
        ""
      );
    }

    const sessionToken =
      sessionStorage.getItem(key);

    if (sessionToken) {
      return sessionToken.replace(
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
        parsed?.jwtToken ||
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

  return "";
};

/* =========================================================
   COMMON HEADERS
========================================================= */

const getHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

/* =========================================================
   GLOBAL QA SEARCH
========================================================= */

const QABugReports: React.FC = () => {
  const [bugs, setBugs] =
    useState<BugReport[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [members, setMembers] =
    useState<Member[]>([]);

  const [memberSearch, setMemberSearch] =
    useState("");

  const [showMemberDropdown, setShowMemberDropdown] =
    useState(false);

  const [form, setForm] =
    useState<BugForm>(emptyForm);

  const [showForm, setShowForm] =
    useState(false);

  const [selectedBug, setSelectedBug] =
    useState<BugReport | null>(null);

  const [replies, setReplies] =
    useState<BugReply[]>([]);

  const [loadingReplies, setLoadingReplies] =
    useState(false);

  const [replyText, setReplyText] =
    useState("");

  const [submittingReply, setSubmittingReply] =
    useState(false);

  const [previewImage, setPreviewImage] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [loadingProjects, setLoadingProjects] =
    useState(false);

  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [globalSearch, setGlobalSearch] =
    useState("");

  /* =========================================================
     GLOBAL SEARCH LISTENER
  ========================================================= */

  useEffect(() => {
    const handleGlobalSearch = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<string>;

      setGlobalSearch(
        customEvent.detail || ""
      );
    };

    window.addEventListener(
      "qa-global-search",
      handleGlobalSearch
    );

    return () => {
      window.removeEventListener(
        "qa-global-search",
        handleGlobalSearch
      );
    };
  }, []);

  /* =========================================================
     SUCCESS MESSAGE
  ========================================================= */

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSuccess("");
      }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  /* =========================================================
     LOAD ONLY CURRENT USER'S BUGS
========================================================= */

  const loadBugs = async () => {
    try {
      setLoading(true);
      setError("");

      const user =
        getCurrentUser();

      const createdBy =
        getUserName(user);

      /*
       * No logged-in user = no personal bugs.
       */
      if (!createdBy) {
        setBugs([]);
        return;
      }

      /*
       * IMPORTANT:
       *
       * We use CREATED BY, not ASSIGNED TO.
       *
       * Therefore a bug filed by Nishad appears
       * in Nishad's Bug Reports even when it is
       * assigned to another person.
       */
      const response =
        await fetch(
          `${BUG_API_URL}/by-creator?createdBy=${encodeURIComponent(
            createdBy
          )}`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            `Failed to load bug reports (${response.status})`
        );
      }

      const result =
        await response.json();

      const data: BugReport[] =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];

      const sortedData =
        [...data].sort(
          (a, b) => {
            const dateA =
              new Date(
                a.createdAt ||
                  a.filedDate ||
                  0
              ).getTime();

            const dateB =
              new Date(
                b.createdAt ||
                  b.filedDate ||
                  0
              ).getTime();

            return dateB - dateA;
          }
        );

      setBugs(sortedData);
    } catch (err) {
      console.error(
        "Error loading bugs:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load bug reports"
      );

      setBugs([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD PROJECTS
  ========================================================= */

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);

      const response =
        await fetch(
          PROJECT_API_URL,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            `Failed to load projects (${response.status})`
        );
      }

      const result =
        await response.json();

      const data: Project[] =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];

      setProjects(data);
    } catch (err) {
      console.error(
        "Error loading projects:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects"
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadBugs();
    loadProjects();
  }, []);

  /* =========================================================
     LOAD MEMBERS FOR PROJECT
  ========================================================= */

  const loadMembersForProject =
    async (
      project: Project
    ) => {
      try {
        setLoadingMembers(true);
        setError("");
        setMembers([]);

        const projectMemberIds =
          (
            project.teamMemberIds ||
            []
          )
            .map(
              (id) =>
                String(id).trim()
            )
            .filter(Boolean);

        if (
          projectMemberIds.length ===
          0
        ) {
          setMembers([]);
          return;
        }

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }

        const response =
          await fetch(
            SUPERADMIN_USERS_URL,
            {
              method: "GET",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "Access denied while loading PM members. Please log in again."
          );
        }

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            errorText ||
              `Failed to load PM members (${response.status})`
          );
        }

        const result =
          await response.json();

        const allMembers: Member[] =
          Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.users)
            ? result.users
            : [];

        const activeMembers =
          allMembers.filter(
            (member) =>
              member.status
                ?.toUpperCase() ===
              "ACTIVE"
          );

        const projectMembers =
          activeMembers.filter(
            (member) =>
              projectMemberIds.includes(
                String(
                  member.employeeId
                ).trim()
              )
          );

        const uniqueMembers =
          Array.from(
            new Map(
              projectMembers.map(
                (member) => [
                  String(
                    member.employeeId
                  ),
                  member,
                ]
              )
            ).values()
          );

        setMembers(
          uniqueMembers
        );
      } catch (err) {
        console.error(
          "Error loading PM project members:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load PM project members"
        );

        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /* =========================================================
     PROJECT CHANGE
  ========================================================= */

  const handleProjectChange =
    async (
      event: React.ChangeEvent<
        HTMLSelectElement
      >
    ) => {
      const projectId =
        event.target.value;

      setForm(
        (previous) => ({
          ...previous,
          projectId,
          assignedTo: "",
        })
      );

      setMemberSearch("");
      setShowMemberDropdown(false);
      setMembers([]);

      if (!projectId) {
        return;
      }

      const selectedProject =
        projects.find(
          (project) =>
            String(project.id) ===
            String(projectId)
        );

      if (!selectedProject) {
        return;
      }

      await loadMembersForProject(
        selectedProject
      );
    };

  /* =========================================================
     FILTER MEMBERS
  ========================================================= */

  const filteredMembers =
    useMemo(() => {
      const search =
        memberSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return members;
      }

      return members.filter(
        (member) =>
          member.name
            ?.toLowerCase()
            .includes(search) ||
          String(
            member.employeeId
          )
            .toLowerCase()
            .includes(search) ||
          member.designation
            ?.toLowerCase()
            .includes(search) ||
          member.email
            ?.toLowerCase()
            .includes(search)
      );
    }, [
      members,
      memberSearch,
    ]);

  /* =========================================================
     SELECT MEMBER
  ========================================================= */

  const selectMember = (
    member: Member
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        assignedTo:
          member.name,
      })
    );

    setMemberSearch(
      member.name
    );

    setShowMemberDropdown(
      false
    );
  };

  /* =========================================================
     OPEN FORM
  ========================================================= */

  const openForm = () => {
    setError("");
    setSuccess("");

    setForm({
      ...emptyForm,
      bugId:
        `BUG-${String(
          bugs.length + 1
        ).padStart(
          3,
          "0"
        )}`,
    });

    setMembers([]);
    setMemberSearch("");
    setShowMemberDropdown(false);
    setShowForm(true);
  };

  /* =========================================================
     HANDLE SCREENSHOT FILE UPLOAD
  ========================================================= */

  const handleScreenshotChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot image size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        screenshot: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  /* =========================================================
     CLOSE FORM
  ========================================================= */

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setMembers([]);
    setMemberSearch("");
    setShowMemberDropdown(false);
    setError("");
  };

  /* =========================================================
     BUG DETAILS & REPLIES
  ========================================================= */

  const openBugDetails = async (bug: BugReport) => {
    setSelectedBug(bug);
    setReplies([]);
    setReplyText("");

    if (!bug.id) return;

    try {
      setLoadingReplies(true);
      const response = await fetch(`${BUG_API_URL}/${bug.id}/replies`, {
        method: "GET",
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setReplies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading bug replies:", err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const closeBugDetails = () => {
    setSelectedBug(null);
    setReplies([]);
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!selectedBug?.id || !replyText.trim()) return;

    const user = getCurrentUser();
    const currentName = getUserName(user) || "QA Engineer";

    try {
      setSubmittingReply(true);
      const response = await fetch(
        `${BUG_API_URL}/${selectedBug.id}/replies`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            senderName: currentName,
            senderRole: "QA_ENGINEER",
            message: replyText.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post reply");
      }

      const savedReply = await response.json();
      setReplies((prev) => [...prev, savedReply]);
      setReplyText("");
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  /* =========================================================
     SUBMIT BUG
  ========================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.bugId.trim() ||
      !form.bugTitle.trim() ||
      !form.projectId ||
      !form.linkedTaskId.trim() ||
      !form.assignedTo.trim() ||
      !form.stepsToReproduce.trim()
    ) {
      setError(
        "Please fill all required fields."
      );

      return;
    }

    const user =
      getCurrentUser();

    /*
     * This is the person who FILED the bug.
     */
    const createdBy =
      getUserName(user);

    if (!createdBy) {
      setError(
        "Unable to identify the logged-in user. Please login again."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          BUG_API_URL,
          {
            method: "POST",

            headers:
              getHeaders(),

            body:
              JSON.stringify({
                bugId:
                  form.bugId.trim(),

                title:
                  form.bugTitle.trim(),

                projectId:
                  Number(
                    form.projectId
                  ),

                linkedTaskId:
                  form.linkedTaskId.trim(),

                environment:
                  form.environment,

                severity:
                  form.severity,

                assignedTo:
                  form.assignedTo.trim(),

                /*
                 * CRITICAL:
                 * Store the current logged-in
                 * QA user as the bug creator.
                 */
                createdBy:
                  createdBy,

                stepsToReproduce:
                  form.stepsToReproduce.trim(),

                screenshot:
                  form.screenshot || null,

                status:
                  "Open",
              }),
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            `Failed to save bug report (${response.status})`
        );
      }

      setSuccess(
        "Bug successfully added."
      );

      setShowForm(false);
      setForm(emptyForm);
      setMembers([]);
      setMemberSearch("");
      setShowMemberDropdown(false);

      /*
       * Reload only the current user's bugs.
       */
      await loadBugs();
    } catch (err) {
      console.error(
        "Error saving bug:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save bug report"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     SEARCH CURRENT USER'S BUGS
  ========================================================= */

  const filteredBugs =
    useMemo(() => {
      const search =
        globalSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return bugs;
      }

      return bugs.filter(
        (bug) => {
          const values = [
            bug.bugId,
            bug.title,
            bug.linkedTaskId,
            bug.environment,
            bug.severity,
            bug.assignedTo,
            bug.createdBy,
            bug.status,
            bug.stepsToReproduce,
          ];

          return values.some(
            (value) =>
              String(
                value ?? ""
              )
                .toLowerCase()
                .includes(search)
          );
        }
      );
    }, [
      bugs,
      globalSearch,
    ]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const openCount =
    bugs.filter(
      (bug) =>
        (
          bug.status ||
          "Open"
        )
          .toLowerCase() ===
        "open"
    ).length;

  const fixedCount =
    bugs.filter(
      (bug) =>
        (
          bug.status ||
          ""
        )
          .toLowerCase() ===
        "fixed"
    ).length;

  const closedCount =
    bugs.filter(
      (bug) =>
        (
          bug.status ||
          ""
        )
          .toLowerCase() ===
        "closed"
    ).length;

  /* =========================================================
     DATE
  ========================================================= */

  const formatDateTime = (
    bug: BugReport
  ) => {
    const value =
      bug.createdAt ||
      bug.filedDate;

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  /* =========================================================
     PROJECT NAME
  ========================================================= */

  const getProjectName = (
    projectId?: number
  ) => {
    if (!projectId) {
      return "—";
    }

    const project =
      projects.find(
        (item) =>
          item.id ===
          projectId
      );

    if (!project) {
      return `Project ${projectId}`;
    }

    return `${project.projectCode} - ${project.projectName}`;
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="w-full">

      {/* FILE BUG BUTTON */}

      <div className="flex justify-center mb-6">

        <button
          type="button"
          onClick={
            openForm
          }
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-lg font-medium transition-colors"
        >
          + File Bug
        </button>

      </div>

      {/* SUCCESS */}

      {success && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">

          <div className="flex items-center gap-2">

            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">
              ✓
            </span>

            <span>
              {success}
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="text-green-500 hover:text-green-700 text-lg leading-none"
          >
            ×
          </button>

        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* NEW BUG FORM */}

      {showForm && (
        <div className="mb-6 rounded-xl border border-red-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between mb-5">

            <div>

              <h2 className="text-lg font-semibold text-slate-900">
                New Bug Report
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Enter the details of the bug
              </p>

            </div>

            <button
              type="button"
              onClick={
                closeForm
              }
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>

          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* BUG ID */}

              <div>

                <label className="block mb-2 text-xs font-medium text-slate-600">
                  BUG ID
                </label>

                <input
                  name="bugId"
                  value={
                    form.bugId
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  placeholder="BUG-090"
                />

              </div>

              {/* BUG TITLE */}

              <div>

                <label className="block mb-2 text-xs font-medium text-slate-600">
                  BUG TITLE
                </label>

                <input
                  name="bugTitle"
                  value={
                    form.bugTitle
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  placeholder="Bug title"
                />

              </div>

              {/* PROJECT */}

              <div>

                <label className="block mb-2 text-xs font-medium text-slate-600">
                  PROJECT
                </label>

                <select
                  name="projectId"
                  value={
                    form.projectId
                  }
                  onChange={
                    handleProjectChange
                  }
                  disabled={
                    loadingProjects
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 bg-white disabled:bg-slate-50"
                >

                  <option value="">
                    {loadingProjects
                      ? "Loading projects..."
                      : "Select Project"}
                  </option>

                  {projects.map(
                    (project) => (
                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                      >
                        {
                          project.projectCode
                        }{" "}
                        -{" "}
                        {
                          project.projectName
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* LINKED TASK */}

              <div>

                <label className="block mb-2 text-xs font-medium text-slate-600">
                  LINKED TASK ID
                </label>

                <input
                  name="linkedTaskId"
                  value={
                    form.linkedTaskId
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  placeholder="T-044"
                />

              </div>

              {/* ENVIRONMENT */}

              <div>

                <label className="block mb-2 text-xs font-medium text-slate-600">
                  ENVIRONMENT
                </label>

                <select
                  name="environment"
                  value={
                    form.environment
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 bg-white"
                >

                  <option value="Dev">
                    Dev
                  </option>

                  <option value="Staging">
                    Staging
                  </option>

                  <option value="Production">
                    Production
                  </option>

                </select>

              </div>

              {/* SEVERITY */}

              <div>

                <label className="block mb-2 text-xs font-medium text-slate-600">
                  SEVERITY
                </label>

                <select
                  name="severity"
                  value={
                    form.severity
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 bg-white"
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Critical">
                    Critical
                  </option>

                </select>

              </div>

              {/* ASSIGN TO */}

              <div className="relative">

                <label className="block mb-2 text-xs font-medium text-slate-600">
                  ASSIGN TO
                </label>

                <input
                  type="text"
                  value={
                    memberSearch
                  }
                  disabled={
                    !form.projectId
                  }
                  onChange={(
                    event
                  ) => {

                    setMemberSearch(
                      event.target.value
                    );

                    setForm(
                      (previous) => ({
                        ...previous,
                        assignedTo:
                          "",
                      })
                    );

                    setShowMemberDropdown(
                      true
                    );
                  }}
                  onFocus={() => {

                    if (
                      form.projectId
                    ) {
                      setShowMemberDropdown(
                        true
                      );
                    }
                  }}
                  placeholder={
                    !form.projectId
                      ? "Select project first"
                      : loadingMembers
                      ? "Loading members..."
                      : "Search member..."
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 disabled:bg-slate-50"
                />

                {showMemberDropdown &&
                  form.projectId && (
                    <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">

                      {loadingMembers ? (

                        <div className="px-3 py-3 text-sm text-slate-400">
                          Loading members...
                        </div>

                      ) : filteredMembers.length ===
                        0 ? (

                        <div className="px-3 py-3 text-sm text-slate-400">

                          {members.length ===
                          0
                            ? "No PM members assigned to this project"
                            : "No matching members found"}

                        </div>

                      ) : (

                        filteredMembers.map(
                          (member) => (

                            <button
                              type="button"
                              key={String(
                                member.employeeId
                              )}
                              onClick={() =>
                                selectMember(
                                  member
                                )
                              }
                              className="w-full px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                            >

                              <div className="text-sm font-medium text-slate-700">
                                {
                                  member.name
                                }
                              </div>

                              <div className="text-xs text-slate-400">
                                {
                                  member.employeeId
                                }{" "}
                                ·{" "}
                                {
                                  member.designation
                                }
                              </div>

                            </button>

                          )
                        )

                      )}

                    </div>
                  )}

              </div>

            </div>

            {/* STEPS */}

            <div className="mt-4">

              <label className="block mb-2 text-xs font-medium text-slate-600">
                STEPS TO REPRODUCE
              </label>

              <textarea
                name="stepsToReproduce"
                value={
                  form.stepsToReproduce
                }
                onChange={
                  handleChange
                }
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none resize-none focus:border-red-400"
                placeholder="Enter steps to reproduce the bug..."
              />

            </div>

            {/* SCREENSHOT ATTACHMENT */}
            <div className="mt-4">
              <label className="block mb-2 text-xs font-medium text-slate-600">
                ATTACH SCREENSHOT (OPTIONAL)
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm border-dashed">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{form.screenshot ? "Change Screenshot..." : "Upload Screenshot (PNG, JPG)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>

                {form.screenshot && (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <img
                      src={form.screenshot}
                      alt="Screenshot Preview"
                      className="h-12 w-16 object-cover rounded border border-slate-200 cursor-pointer shadow-sm hover:opacity-90"
                      onClick={() => setPreviewImage(form.screenshot || null)}
                      title="Click to preview full screenshot"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-700">Screenshot Attached</p>
                      <button
                        type="button"
                        onClick={() => setPreviewImage(form.screenshot || null)}
                        className="text-blue-500 hover:underline"
                      >
                        Preview full size
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, screenshot: "" }))}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BUTTONS */}

            <div className="flex gap-2 mt-5">

              <button
                type="submit"
                disabled={
                  saving
                }
                className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                {saving
                  ? "Saving..."
                  : "Submit Bug Report"}
              </button>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-5 py-2.5 rounded-lg text-sm"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* COUNT ROW */}

      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">

        <span>
          {openCount} open ·{" "}
          {fixedCount} in fix ·{" "}
          {closedCount} closed
        </span>

        <button
          type="button"
          onClick={
            loadBugs
          }
          className="hover:text-slate-600"
        >
          Refresh
        </button>

      </div>

      {/* TABLE */}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

        {loading ? (

          <div className="py-16 text-center text-sm text-slate-400">
            Loading bug reports...
          </div>

        ) : filteredBugs.length ===
          0 ? (

          <div className="py-16 text-center">

            <div className="text-slate-400 text-3xl mb-3">
              🐞
            </div>

            <p className="text-sm font-medium text-slate-700">
              {globalSearch
                ? "No matching bug reports found"
                : "No bug reports found"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {globalSearch
                ? `No bugs match "${globalSearch}"`
                : 'Click "File Bug" to create a new bug report.'}
            </p>

          </div>

        ) : (

          <table className="w-full min-w-[1100px] text-sm">

            <thead>

              <tr className="border-b border-slate-200">

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  BUG ID
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  TITLE
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  PROJECT
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  SEVERITY
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  STATUS
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  LINKED TASK
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  ASSIGNEE
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  ENVIRONMENT
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  CREATED
                </th>

                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">
                  SCREENSHOT / DISCUSSION
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredBugs.map(
                (
                  bug,
                  index
                ) => {

                  const status =
                    bug.status ||
                    "Open";

                  return (

                    <tr
                      key={
                        bug.id ??
                        `${bug.bugId}-${index}`
                      }
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >

                      {/* BUG ID */}

                      <td className="px-3 py-4 text-sm text-slate-600">
                        {
                          bug.bugId
                        }
                      </td>

                      {/* TITLE */}

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-2">

                          <span className="text-emerald-500">
                            🐞
                          </span>

                          <span className="text-sm text-slate-700">
                            {
                              bug.title
                            }
                          </span>

                        </div>

                      </td>

                      {/* PROJECT */}

                      <td className="px-3 py-4 text-sm text-slate-600">
                        {
                          getProjectName(
                            bug.projectId
                          )
                        }
                      </td>

                      {/* SEVERITY */}

                      <td className="px-3 py-4">

                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs ${
                            bug.severity
                              ?.toLowerCase() ===
                            "critical"
                              ? "bg-red-50 text-red-500"
                              : bug.severity
                                  ?.toLowerCase() ===
                                "high"
                              ? "bg-red-50 text-red-500"
                              : bug.severity
                                  ?.toLowerCase() ===
                                "medium"
                              ? "bg-orange-50 text-orange-500"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {
                            bug.severity
                          }
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-3 py-4">

                        <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-xs text-red-500">
                          {
                            status
                          }
                        </span>

                      </td>

                      {/* LINKED TASK */}

                      <td className="px-3 py-4 text-sm text-slate-600">
                        {
                          bug.linkedTaskId
                        }
                      </td>

                      {/* ASSIGNEE */}

                      <td className="px-3 py-4 text-sm text-slate-600">
                        {
                          bug.assignedTo
                        }
                      </td>

                      {/* ENVIRONMENT */}

                      <td className="px-3 py-4 text-sm text-slate-600">
                        {
                          bug.environment
                        }
                      </td>

                      {/* CREATED */}

                      <td className="px-3 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {
                          formatDateTime(
                            bug
                          )
                        }
                      </td>

                      {/* SCREENSHOT & DISCUSSION */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {bug.screenshot ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(bug.screenshot || null)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium border border-blue-200 transition"
                              title="Click to view full screenshot"
                            >
                              <span>🖼️</span> Screenshot
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No image</span>
                          )}

                          <button
                            type="button"
                            onClick={() => openBugDetails(bug)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium border border-indigo-200 transition"
                          >
                            <span>💬</span> Discussion
                          </button>
                        </div>
                      </td>

                    </tr>

                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* =========================================================
         BUG DETAILS & DISCUSSION MODAL
      ========================================================= */}
      {selectedBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                    {selectedBug.bugId}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {selectedBug.environment}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      selectedBug.severity?.toLowerCase() === "critical"
                        ? "bg-red-100 text-red-700"
                        : selectedBug.severity?.toLowerCase() === "high"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {selectedBug.severity}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedBug.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Project: {getProjectName(selectedBug.projectId)} · Task: {selectedBug.linkedTaskId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBugDetails}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Metadata details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-500 font-medium">Assigned Developer:</span>
                  <p className="text-slate-800 font-semibold mt-0.5">{selectedBug.assignedTo || "Unassigned"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Reported by QA:</span>
                  <p className="text-slate-800 font-semibold mt-0.5">{selectedBug.createdBy || "QA"}</p>
                </div>
              </div>

              {/* Steps to Reproduce */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>📋</span> Steps to Reproduce
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedBug.stepsToReproduce}
                </div>
              </div>

              {/* Screenshot preview */}
              {selectedBug.screenshot && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span>🖼️</span> Attached Screenshot
                  </h4>
                  <div
                    onClick={() => setPreviewImage(selectedBug.screenshot || null)}
                    className="cursor-pointer group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900 inline-block max-w-full"
                  >
                    <img
                      src={selectedBug.screenshot}
                      alt="Bug Screenshot"
                      className="max-h-56 rounded-xl object-contain hover:opacity-90 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-medium">
                      🔍 Click to enlarge
                    </div>
                  </div>
                </div>
              )}

              {/* Discussion Thread */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💬</span> Bug Discussion & Developer Collaboration
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {replies.length} message{replies.length === 1 ? "" : "s"}
                  </span>
                </div>

                {loadingReplies ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Loading conversation...
                  </div>
                ) : replies.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
                    No developer replies yet. You can post a message or clarification below.
                  </div>
                ) : (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                    {replies.map((reply) => {
                      const isDev =
                        reply.senderRole?.toUpperCase().includes("DEV");

                      return (
                        <div
                          key={reply.id}
                          className={`p-3 rounded-xl border text-xs ${
                            isDev
                              ? "bg-indigo-50/60 border-indigo-200/80 ml-4"
                              : "bg-emerald-50/60 border-emerald-200/80 mr-4"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-semibold ${
                                  isDev ? "text-indigo-900" : "text-emerald-900"
                                }`}
                              >
                                {reply.senderName}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  isDev
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {isDev ? "DEVELOPER" : "QA ENGINEER"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {reply.time || (reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "")}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Box */}
                <div className="mt-3">
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a message to the developer..."
                      rows={2}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none resize-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      disabled={submittingReply || !replyText.trim()}
                      onClick={handleSendReply}
                      className="self-end bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      {submittingReply ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={closeBugDetails}
                className="border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-medium shadow-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         FULLSCREEN SCREENSHOT LIGHTBOX
      ========================================================= */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Screenshot Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-white text-slate-800 rounded-full p-2 shadow-lg hover:bg-slate-100 transition"
              title="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default QABugReports;