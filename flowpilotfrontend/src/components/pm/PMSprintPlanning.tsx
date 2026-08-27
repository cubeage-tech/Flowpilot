import { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* =========================================================
   TYPES
========================================================= */

interface Project {
  id: number;
  projectCode: string;
  projectName: string;
  sprint: string | null;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  progress: number | null;
}

/* =========================================================
   API
========================================================= */

const API_URL = "http://localhost:8080/api/pm/projects";

/* =========================================================
   BACKLOG
========================================================= */

interface BacklogItem {
  id: number;
  title: string;
  category: string;
  points: number;
  priority: "Low" | "Medium" | "High";
}

const backlogItems: BacklogItem[] = [
  {
    id: 1,
    title: "AI-powered task suggestions",
    category: "Automation",
    points: 13,
    priority: "Low",
  },
  {
    id: 2,
    title: "Bi-directional Jira sync",
    category: "Integrations",
    points: 8,
    priority: "Medium",
  },
  {
    id: 3,
    title: "OKR tracking module",
    category: "Analytics",
    points: 21,
    priority: "Medium",
  },
  {
    id: 4,
    title: "SSO / LDAP integration",
    category: "Auth",
    points: 13,
    priority: "High",
  },
  {
    id: 5,
    title: "Custom fields on tasks",
    category: "Core",
    points: 5,
    priority: "Medium",
  },
];

/* =========================================================
   PRIORITY STYLES
========================================================= */

const priorityStyles = {
  Low: "bg-emerald-100 text-emerald-600",
  Medium: "bg-amber-100 text-amber-600",
  High: "bg-rose-100 text-rose-600",
};

/* =========================================================
   AUTH TOKEN
========================================================= */

function getAuthToken(): string | null {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwtToken") ||
    localStorage.getItem("authToken")
  );
}

/* =========================================================
   DAYS LEFT
========================================================= */

function calculateDaysLeft(
  endDate: string | null
): string {
  if (!endDate) {
    return "N/A";
  }

  const today = new Date();

  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const end = new Date(
    `${endDate}T00:00:00`
  );

  if (Number.isNaN(end.getTime())) {
    return "N/A";
  }

  const difference =
    end.getTime() - todayOnly.getTime();

  const days = Math.ceil(
    difference /
      (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return `${Math.abs(days)} overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "1 day";
  }

  return `${days} days`;
}

/* =========================================================
   STATUS STYLE
========================================================= */

function getStatusStyle(
  status: string | null
): string {
  const normalized =
    status?.toLowerCase();

  if (normalized === "delayed") {
    return "border-red-200 bg-red-50 text-red-500";
  }

  if (normalized === "at risk") {
    return "border-amber-200 bg-amber-50 text-amber-600";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-600";
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3">

      <p className="text-sm font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold leading-tight text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   ACTIVE SPRINT CARD
========================================================= */

function ActiveSprintCard({
  project,
}: {
  project: Project | null;
}) {
  if (!project) {
    return (
      <div className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <h2 className="text-lg font-bold text-slate-900">
          No Project Selected
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Select a project to view sprint planning details.
        </p>

      </div>
    );
  }

  const daysLeft =
    calculateDaysLeft(
      project.endDate
    );

  const progress = Math.min(
    100,
    Math.max(
      0,
      project.progress ?? 0
    )
  );

  return (
    <div className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      {/* ===================================================
          PROJECT HEADER
      =================================================== */}

      <div className="mb-4 flex items-center justify-between gap-3">

        <div className="min-w-0">

          <p className="text-xs font-medium text-slate-400">
            {project.projectCode}
          </p>

          <h2 className="mt-0.5 truncate text-xl font-bold text-slate-900">
            {project.projectName}
          </h2>

        </div>

        <span
          className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold ${getStatusStyle(
            project.status
          )}`}
        >
          {project.status || "Active"}
        </span>

      </div>

      {/* ===================================================
          ACTIVE SPRINT
      =================================================== */}

      <h2 className="mb-3 text-xl font-bold text-slate-900">
        Active Sprint —{" "}
        {project.sprint || "No Sprint"}
      </h2>

      {/* ===================================================
          STAT CARDS
      =================================================== */}

      <div className="grid grid-cols-2 gap-2.5">

        <StatCard
          label="Story Points"
          value="86 / 120 SP"
        />

        <StatCard
          label="Tasks"
          value="18 tasks"
        />

        <StatCard
          label="Days Left"
          value={daysLeft}
        />

        <StatCard
          label="Velocity"
          value="41 SP/sprint"
        />

      </div>

      {/* ===================================================
          PROJECT PROGRESS
      =================================================== */}

      <div className="mt-4">

        <div className="mb-1.5 flex items-center justify-between">

          <p className="text-sm font-medium text-slate-400">
            Project Progress
          </p>

          <p className="text-sm font-bold text-violet-600">
            {progress}%
          </p>

        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">

          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* ===================================================
          CLOSE SPRINT
      =================================================== */}

      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-rose-500 transition hover:bg-red-100"
      >
        Close{" "}
        {project.sprint || "Sprint"}
      </button>

    </div>
  );
}

/* =========================================================
   BACKLOG ROW
========================================================= */

function BacklogRow({
  item,
}: {
  item: BacklogItem;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-none">

      <div className="min-w-0">

        <p className="truncate text-sm font-semibold text-slate-900">
          {item.title}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {item.category} ·{" "}
          {item.points} SP
        </p>

      </div>

      <div className="flex shrink-0 items-center gap-1.5">

        <span
          className={`rounded-md px-2 py-1 text-xs font-bold ${
            priorityStyles[item.priority]
          }`}
        >
          {item.priority}
        </span>

        <button
          type="button"
          className="rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-600 transition hover:bg-violet-100"
        >
          Add to Sprint
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   PRODUCT BACKLOG
========================================================= */

function ProductBacklogCard() {
  return (
    <div className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <h2 className="mb-1 text-xl font-bold text-slate-900">
        Product Backlog
      </h2>

      <div>

        {backlogItems.map(
          (item) => (
            <BacklogRow
              key={item.id}
              item={item}
            />
          )
        )}

      </div>

    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function PMSprintPlanning() {

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState<number | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH PM PROJECTS
  ======================================================= */

  const fetchProjects = async () => {

    try {

      setLoading(true);
      setError("");

      const token =
        getAuthToken();

      const response =
        await axios.get(
          API_URL,
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      console.log(
        "PM Projects:",
        response.data
      );

      let projectData: Project[] =
        [];

      if (
        Array.isArray(
          response.data
        )
      ) {

        projectData =
          response.data;

      } else if (
        Array.isArray(
          response.data?.data
        )
      ) {

        projectData =
          response.data.data;

      }

      setProjects(
        projectData
      );

      if (
        projectData.length > 0
      ) {

        setSelectedProjectId(
          projectData[0].id
        );

      }

    } catch (err: any) {

      console.error(
        "Failed to fetch PM Projects:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Failed to load PM project data."
      );

    } finally {

      setLoading(false);

    }

  };

  /* =======================================================
     INITIAL FETCH
  ======================================================= */

  useEffect(() => {

    fetchProjects();

  }, []);

  /* =======================================================
     SELECTED PROJECT
  ======================================================= */

  const selectedProject =
    useMemo(() => {

      if (
        selectedProjectId ===
        null
      ) {
        return null;
      }

      return (
        projects.find(
          (project) =>
            project.id ===
            selectedProjectId
        ) || null
      );

    }, [
      projects,
      selectedProjectId,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <div className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-4">

          <p className="text-sm text-slate-500">
            Loading PM project...
          </p>

        </div>

        <div className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-4">

          <p className="text-sm text-slate-500">
            Loading product backlog...
          </p>

        </div>

      </div>
    );

  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">

        <h2 className="text-base font-bold text-red-600">
          Failed to load Sprint Planning
        </h2>

        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>

        <button
          type="button"
          onClick={fetchProjects}
          className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
        >
          Retry
        </button>

      </div>
    );

  }

  /* =======================================================
     NO PROJECTS
  ======================================================= */

  if (
    projects.length === 0
  ) {

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">

        <h2 className="text-lg font-bold text-slate-900">
          No PM Projects Found
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Create a project in PM Project first.
        </p>

      </div>
    );

  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="space-y-4">

      {/* ===================================================
          PROJECT SELECTOR
      =================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-base font-bold text-slate-900">
              Select Project
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Select a project to view its sprint planning record.
            </p>

          </div>

          <div className="w-full sm:w-[340px]">

            <select
              value={
                selectedProjectId ??
                ""
              }
              onChange={(event) => {

                const value =
                  event.target.value;

                setSelectedProjectId(
                  value
                    ? Number(value)
                    : null
                );

              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >

              <option value="">
                Select Project
              </option>

              {projects.map(
                (project) => (

                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.projectName}
                    {project.projectCode
                      ? ` (${project.projectCode})`
                      : ""}
                  </option>

                )
              )}

            </select>

          </div>

        </div>

      </div>

      {/* ===================================================
          SPRINT PLANNING
      =================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <ActiveSprintCard
          project={
            selectedProject
          }
        />

        <ProductBacklogCard />

      </div>

    </div>
  );
}

export default PMSprintPlanning;