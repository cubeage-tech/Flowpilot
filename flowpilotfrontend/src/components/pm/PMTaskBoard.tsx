import { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* =========================================================
   TYPES
========================================================= */

interface PMProject {
  id?: number | null;
  projectId?: number | null;

  name?: string | null;
  projectName?: string | null;

  description?: string | null;
  status?: string | null;
}

interface ScrumCard {
  id: number | null;
  projectId?: number | null;

  taskKey?: string | null;
  taskCode?: string | null;

  title?: string | null;
  description?: string | null;

  who?: string | null;
  assigneeName?: string | null;
  assigneeId?: number | null;

  priority?: string | null;

  storyPoints?: number | null;
  points?: number | null;

  status?: string | null;
  columnStatus?: string | null;

  labels?: string[] | null;

  ageDays?: number | null;
  daysInColumn?: number | null;

  isStuck?: boolean;
  stuck?: boolean;
}

interface ScrumColumn {
  status?: string | null;
  label?: string | null;

  taskCount?: number | null;
  totalPoints?: number | null;

  wipLimit?: number | null;
  wipExceeded?: boolean;

  hiddenCount?: number | null;

  cards?: ScrumCard[] | null;
}

interface ScrumMember {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  initials?: string | null;
}

interface ScrumBoardResponse {
  projectId?: number | null;
  projectName?: string | null;

  sprintId?: number | null;
  sprintName?: string | null;
  sprintStatus?: string | null;

  totalTasks?: number | null;
  totalPoints?: number | null;

  availableLabels?: string[] | null;

  members?: ScrumMember[] | null;

  columns?: ScrumColumn[] | null;
}

/* =========================================================
   API
========================================================= */

const BOARD_API_URL =
  "http://localhost:8080/api/scrummaster/board";

const PROJECTS_API_URL =
  "http://localhost:8080/api/pm/projects";

/* =========================================================
   AUTH
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
   PROJECT HELPERS
========================================================= */

function getProjectId(project: PMProject): number | null {
  if (
    typeof project.id === "number" &&
    !Number.isNaN(project.id)
  ) {
    return project.id;
  }

  if (
    typeof project.projectId === "number" &&
    !Number.isNaN(project.projectId)
  ) {
    return project.projectId;
  }

  return null;
}

function getProjectName(project: PMProject): string {
  return (
    project.name ||
    project.projectName ||
    `Project ${getProjectId(project) ?? ""}`
  );
}

/* =========================================================
   COLUMN ORDER
========================================================= */

const COLUMN_ORDER = [
  "BACKLOG",
  "SPRINT_READY",
  "TODO",
  "IN_PROGRESS",
  "CODE_REVIEW",
  "TESTING",
  "DONE",
  "BLOCKED",
];

/* =========================================================
   FILTER
========================================================= */

const FILTERS = ["All", "Blocked"];

/* =========================================================
   COLUMN STYLE
========================================================= */

function getColumnStyle(
  status: string | null | undefined
) {
  /*
   * IMPORTANT:
   * String(status || "") prevents:
   * Cannot read properties of undefined
   * (reading 'toLowerCase')
   */

  const value = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  switch (value) {
    case "BACKLOG":
      return {
        text: "text-slate-500",
        badge: "bg-slate-200 text-slate-600",
        dot: "bg-slate-400",
      };

    case "SPRINT_READY":
      return {
        text: "text-blue-500",
        badge: "bg-blue-100 text-blue-600",
        dot: "bg-blue-400",
      };

    case "TODO":
      return {
        text: "text-slate-500",
        badge: "bg-slate-200 text-slate-600",
        dot: "bg-slate-400",
      };

    case "IN_PROGRESS":
      return {
        text: "text-amber-500",
        badge: "bg-amber-100 text-amber-600",
        dot: "bg-amber-400",
      };

    case "CODE_REVIEW":
      return {
        text: "text-violet-500",
        badge: "bg-violet-100 text-violet-600",
        dot: "bg-violet-400",
      };

    case "TESTING":
      return {
        text: "text-cyan-500",
        badge: "bg-cyan-100 text-cyan-600",
        dot: "bg-cyan-400",
      };

    case "DONE":
      return {
        text: "text-emerald-500",
        badge: "bg-emerald-100 text-emerald-600",
        dot: "bg-emerald-400",
      };

    case "BLOCKED":
      return {
        text: "text-rose-500",
        badge: "bg-rose-100 text-rose-600",
        dot: "bg-rose-400",
      };

    default:
      return {
        text: "text-slate-500",
        badge: "bg-slate-200 text-slate-600",
        dot: "bg-slate-400",
      };
  }
}

/* =========================================================
   PRIORITY STYLE
========================================================= */

function getPriorityStyle(
  priority?: string | null
) {
  switch (
    String(priority || "")
      .trim()
      .toUpperCase()
  ) {
    case "HIGH":
      return "bg-rose-50 text-rose-500";

    case "MEDIUM":
      return "bg-amber-50 text-amber-500";

    case "LOW":
      return "bg-emerald-50 text-emerald-500";

    default:
      return "bg-slate-100 text-slate-500";
  }
}

/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(
  status?: string | null
): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/* =========================================================
   NORMALIZE COLUMN LABEL
========================================================= */

function normalizeColumnLabel(
  status?: string | null,
  label?: string | null
): string {
  if (label && label.trim()) {
    return label;
  }

  const value = normalizeStatus(status);

  const labels: Record<string, string> = {
    BACKLOG: "Backlog",
    SPRINT_READY: "Sprint ready",
    TODO: "To do",
    IN_PROGRESS: "In progress",
    CODE_REVIEW: "Review",
    TESTING: "Testing",
    DONE: "Done",
    BLOCKED: "Blocked",
  };

  return (
    labels[value] ||
    label ||
    status ||
    "Unknown"
  );
}

/* =========================================================
   TASK KEY
========================================================= */

function getTaskKey(task: ScrumCard): string {
  if (task.taskKey) {
    return task.taskKey;
  }

  if (task.taskCode) {
    return task.taskCode;
  }

  if (
    task.id !== null &&
    task.id !== undefined
  ) {
    return `T-${String(task.id).padStart(3, "0")}`;
  }

  return "TASK";
}

/* =========================================================
   STORY POINTS
========================================================= */

function getPoints(task: ScrumCard): number {
  if (
    typeof task.storyPoints === "number" &&
    !Number.isNaN(task.storyPoints)
  ) {
    return task.storyPoints;
  }

  if (
    typeof task.points === "number" &&
    !Number.isNaN(task.points)
  ) {
    return task.points;
  }

  return 0;
}

/* =========================================================
   TASK CARD
========================================================= */

function TaskCard({
  task,
}: {
  task: ScrumCard;
}) {
  const priority = task.priority || "";

  const owner =
    task.assigneeName ||
    task.who ||
    "Unassigned";

  const points = getPoints(task);

  const stuck =
    task.isStuck === true ||
    task.stuck === true;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">

      {/* TASK CODE */}

      <p className="mb-1 text-[10px] text-slate-400">
        {getTaskKey(task)}
      </p>

      {/* TITLE */}

      <p className="mb-2 text-xs font-semibold leading-snug text-slate-800">
        {task.title || "Untitled task"}
      </p>

      {/* DESCRIPTION */}

      {task.description && (
        <p className="mb-2 line-clamp-2 text-[10px] text-slate-400">
          {task.description}
        </p>
      )}

      {/* FOOTER */}

      <div className="flex items-center justify-between gap-2">

        <span className="truncate text-[10px] text-slate-400">
          {owner}
        </span>

        <div className="flex shrink-0 items-center gap-1">

          {priority && (
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${getPriorityStyle(
                priority
              )}`}
            >
              {priority}
            </span>
          )}

          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
            {points} SP
          </span>

        </div>
      </div>

      {/* LABELS */}

      {Array.isArray(task.labels) &&
        task.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.labels
              .slice(0, 3)
              .map((label, index) => (
                <span
                  key={`${getTaskKey(task)}-label-${String(
                    label
                  )}-${index}`}
                  className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-400"
                >
                  {label}
                </span>
              ))}
          </div>
        )}

      {/* STUCK */}

      {stuck && (
        <div className="mt-2">
          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-500">
            Stuck
          </span>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   BOARD COLUMN
========================================================= */

function BoardColumn({
  column,
  columnIndex,
}: {
  column: ScrumColumn;
  columnIndex: number;
}) {
  const style = getColumnStyle(
    column.status
  );

  const cards = Array.isArray(column.cards)
    ? column.cards
    : [];

  const title = normalizeColumnLabel(
    column.status,
    column.label
  );

  const taskCount =
    typeof column.taskCount === "number"
      ? column.taskCount
      : cards.length;

  return (
    <div
      className="flex min-w-0 flex-col rounded-xl bg-slate-50 p-2"
      key={`board-column-${normalizeStatus(
        column.status
      )}-${columnIndex}`}
    >

      {/* COLUMN HEADER */}

      <div className="mb-2 flex items-center justify-between px-1">

        <div className="flex min-w-0 items-center gap-1.5">

          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
          />

          <h3
            className={`truncate text-[11px] font-semibold ${style.text}`}
          >
            {title}
          </h3>

        </div>

        <span
          className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-semibold ${style.badge}`}
        >
          {taskCount}
        </span>

      </div>

      {/* WIP */}

      {column.wipLimit !== null &&
        column.wipLimit !== undefined && (
          <div className="mb-2 px-1">

            <p
              className={`text-[9px] ${
                column.wipExceeded
                  ? "font-medium text-rose-500"
                  : "text-slate-400"
              }`}
            >
              WIP {taskCount}/{column.wipLimit}
            </p>

          </div>
        )}

      {/* CARDS */}

      <div className="flex min-h-0 flex-col gap-2">

        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-2 py-4 text-center">
            <p className="text-[9px] text-slate-400">
              No tasks
            </p>
          </div>
        ) : (
          cards.map((task, taskIndex) => {

            /*
             * Always generate a unique fallback key.
             * This removes React's:
             * "Each child in a list should have a unique key prop"
             */

            const taskKey =
              task.id !== null &&
              task.id !== undefined
                ? `task-${task.id}`
                : task.taskKey
                ? `task-key-${task.taskKey}`
                : task.taskCode
                ? `task-code-${task.taskCode}`
                : `task-${columnIndex}-${taskIndex}`;

            return (
              <TaskCard
                key={taskKey}
                task={task}
              />
            );
          })
        )}

      </div>

      {/* POINTS */}

      <div className="mt-2 border-t border-slate-200 px-1 pt-1.5">

        <p className="text-[9px] text-slate-400">
          {column.totalPoints ?? 0} SP
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   FILTER TABS
========================================================= */

function FilterTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">

      {FILTERS.map((filter) => {

        const activeFilter =
          active === filter;

        return (
          <button
            key={`filter-${filter}`}
            type="button"
            onClick={() => onChange(filter)}
            className={`rounded-md border px-2.5 py-1 text-[10px] font-medium transition ${
              activeFilter
                ? "border-violet-200 bg-violet-100 text-violet-600"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {filter}
          </button>
        );
      })}

    </div>
  );
}

/* =========================================================
   PROJECT SELECTOR
========================================================= */

function ProjectSelector({
  projects,
  selectedProjectId,
  onChange,
  loading,
}: {
  projects: PMProject[];
  selectedProjectId: number | null;
  onChange: (projectId: number) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2">

      <label
        htmlFor="pm-task-board-project"
        className="whitespace-nowrap text-[10px] font-medium text-slate-500"
      >
        Project
      </label>

      <select
        id="pm-task-board-project"
        value={
          selectedProjectId !== null
            ? String(selectedProjectId)
            : ""
        }
        onChange={(event) => {

          const value = Number(
            event.target.value
          );

          if (!Number.isNaN(value)) {
            onChange(value);
          }
        }}
        disabled={
          loading ||
          projects.length === 0
        }
        className="min-w-[180px] rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      >

        {projects.length === 0 ? (
          <option value="">
            No projects available
          </option>
        ) : (
          projects.map((project, index) => {

            const projectId =
              getProjectId(project);

            if (projectId === null) {
              return null;
            }

            return (
              <option
                key={`project-${projectId}-${index}`}
                value={String(projectId)}
              >
                {getProjectName(project)}
              </option>
            );
          })
        )}

      </select>

    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function PMTaskBoard() {

  /* =======================================================
     STATE
  ======================================================= */

  const [projects, setProjects] =
    useState<PMProject[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState<number | null>(null);

  const [projectsLoading, setProjectsLoading] =
    useState(true);

  const [board, setBoard] =
    useState<ScrumBoardResponse | null>(null);

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH PROJECTS
  ======================================================= */

  const fetchProjects = async () => {

    try {

      setProjectsLoading(true);
      setError("");

      const token =
        getAuthToken();

      const response =
        await axios.get<PMProject[]>(
          PROJECTS_API_URL,
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

      const receivedProjects =
        Array.isArray(response.data)
          ? response.data
          : [];

      /*
       * Keep only projects that actually
       * have an ID.
       */

      const validProjects =
        receivedProjects.filter(
          (project) =>
            getProjectId(project) !== null
        );

      setProjects(validProjects);

      /*
       * If no project has been selected,
       * automatically select the first one.
       */

      if (
        validProjects.length > 0 &&
        selectedProjectId === null
      ) {
        const firstProjectId =
          getProjectId(validProjects[0]);

        if (firstProjectId !== null) {
          setSelectedProjectId(
            firstProjectId
          );
        }
      }

      /*
       * If the currently selected project
       * was deleted/removed, select first.
       */

      if (
        selectedProjectId !== null &&
        !validProjects.some(
          (project) =>
            getProjectId(project) ===
            selectedProjectId
        )
      ) {
        const firstProjectId =
          getProjectId(validProjects[0]);

        setSelectedProjectId(
          firstProjectId
        );
      }

    } catch (err: any) {

      console.error(
        "Failed to load PM projects:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load PM projects."
      );

    } finally {

      setProjectsLoading(false);

    }
  };

  /* =======================================================
     FETCH BOARD
  ======================================================= */

  const fetchScrumBoard = async (
    projectId: number
  ) => {

    try {

      setLoading(true);
      setError("");

      const token =
        getAuthToken();

      const response =
        await axios.get<ScrumBoardResponse>(
          BOARD_API_URL,
          {
            params: {
              projectId,
            },

            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      console.log(
        "PM Task Board - Project:",
        projectId
      );

      console.log(
        "Scrum Master Board:",
        response.data
      );

      setBoard(response.data);

    } catch (err: any) {

      console.error(
        "Failed to load Scrum Master board:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setBoard(null);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load Scrum Master task board."
      );

    } finally {

      setLoading(false);

    }
  };

  /* =======================================================
     INITIAL PROJECT LOAD
  ======================================================= */

  useEffect(() => {
    fetchProjects();
  }, []);

  /* =======================================================
     LOAD BOARD WHEN PROJECT CHANGES
  ======================================================= */

  useEffect(() => {

    if (selectedProjectId === null) {
      return;
    }

    fetchScrumBoard(
      selectedProjectId
    );

  }, [selectedProjectId]);

  /* =======================================================
     HANDLE PROJECT CHANGE
  ======================================================= */

  const handleProjectChange = (
    projectId: number
  ) => {

    setSelectedProjectId(
      projectId
    );

    setActiveFilter("All");

  };

  /* =======================================================
     SELECTED PROJECT NAME
  ======================================================= */

  const selectedProjectName =
    useMemo(() => {

      if (
        selectedProjectId === null
      ) {
        return "";
      }

      const project =
        projects.find(
          (item) =>
            getProjectId(item) ===
            selectedProjectId
        );

      if (project) {
        return getProjectName(project);
      }

      return (
        board?.projectName ||
        `Project ${selectedProjectId}`
      );

    }, [
      projects,
      selectedProjectId,
      board?.projectName,
    ]);

  /* =======================================================
     FILTER COLUMNS
  ======================================================= */

  const columns = useMemo(() => {

    if (!board?.columns) {
      return [];
    }

    const sortedColumns =
      [...board.columns].sort(
        (a, b) => {

          const aStatus =
            normalizeStatus(
              a.status
            );

          const bStatus =
            normalizeStatus(
              b.status
            );

          const aIndex =
            COLUMN_ORDER.indexOf(
              aStatus
            );

          const bIndex =
            COLUMN_ORDER.indexOf(
              bStatus
            );

          return (
            (aIndex === -1
              ? 999
              : aIndex) -
            (bIndex === -1
              ? 999
              : bIndex)
          );
        }
      );

    if (
      activeFilter ===
      "Blocked"
    ) {

      return sortedColumns.filter(
        (column) =>
          normalizeStatus(
            column.status
          ) === "BLOCKED"
      );

    }

    return sortedColumns;

  }, [
    board,
    activeFilter,
  ]);

  /* =======================================================
     PROJECT LOADING
  ======================================================= */

  if (projectsLoading) {

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">

        <p className="text-xs text-slate-500">
          Loading projects...
        </p>

      </div>
    );
  }

  /* =======================================================
     NO PROJECT
  ======================================================= */

  if (
    !projectsLoading &&
    projects.length === 0
  ) {

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">

        <p className="text-sm font-semibold text-slate-800">
          No projects available
        </p>

        <p className="mt-1 text-[11px] text-slate-400">
          Create a project from PM Projects first.
        </p>

        {error && (
          <p className="mt-2 text-[11px] text-red-500">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={fetchProjects}
          className="mt-3 rounded-md bg-violet-500 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-violet-600"
        >
          Retry
        </button>

      </div>
    );
  }

  /* =======================================================
     BOARD LOADING
  ======================================================= */

  if (loading && !board) {

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">

        {/* PROJECT DROPDOWN */}

        <div className="mb-4">
          <ProjectSelector
            projects={projects}
            selectedProjectId={
              selectedProjectId
            }
            onChange={
              handleProjectChange
            }
            loading={
              projectsLoading
            }
          />
        </div>

        <p className="text-xs text-slate-500">
          Loading task board for{" "}
          <span className="font-semibold">
            {selectedProjectName}
          </span>
          ...
        </p>

      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !board) {

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">

        {/* PROJECT DROPDOWN */}

        <div className="mb-4">
          <ProjectSelector
            projects={projects}
            selectedProjectId={
              selectedProjectId
            }
            onChange={
              handleProjectChange
            }
            loading={
              projectsLoading
            }
          />
        </div>

        <p className="text-xs font-semibold text-red-600">
          Failed to load Task Board
        </p>

        <p className="mt-1 text-[11px] text-red-500">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {

            if (
              selectedProjectId !== null
            ) {
              fetchScrumBoard(
                selectedProjectId
              );
            }

          }}
          className="mt-3 rounded-md bg-red-500 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-red-600"
        >
          Retry
        </button>

      </div>
    );
  }

  /* =======================================================
     NO BOARD
  ======================================================= */

  if (!board) {

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">

        <div className="mb-4">
          <ProjectSelector
            projects={projects}
            selectedProjectId={
              selectedProjectId
            }
            onChange={
              handleProjectChange
            }
            loading={
              projectsLoading
            }
          />
        </div>

        <p className="text-xs text-slate-400">
          No Scrum Master board data available.
        </p>

      </div>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div className="w-full overflow-hidden">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* TITLE */}

        <div>

          <h2 className="text-sm font-bold text-slate-900">
            Team Task Board
          </h2>

          <p className="mt-0.5 text-[10px] text-slate-400">
            Scrum Master task board · View only
          </p>

        </div>

        {/* PROJECT + FILTER */}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

          <ProjectSelector
            projects={projects}
            selectedProjectId={
              selectedProjectId
            }
            onChange={
              handleProjectChange
            }
            loading={
              projectsLoading ||
              loading
            }
          />

          <FilterTabs
            active={activeFilter}
            onChange={setActiveFilter}
          />

        </div>

      </div>

      {/* ===================================================
          CURRENT PROJECT
      =================================================== */}

      <div className="mb-3 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">

        <div className="flex flex-wrap items-center justify-between gap-2">

          <div>

            <p className="text-[9px] text-violet-400">
              Selected Project
            </p>

            <p className="text-[12px] font-bold text-violet-700">
              {selectedProjectName ||
                board.projectName ||
                "Project"}
            </p>

          </div>

          {loading && (
            <span className="rounded bg-white px-2 py-1 text-[9px] font-medium text-violet-500">
              Loading...
            </span>
          )}

        </div>

      </div>

      {/* ===================================================
          SPRINT SUMMARY
      =================================================== */}

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">

        <div>

          <p className="text-[9px] text-slate-400">
            Sprint
          </p>

          <p className="text-[11px] font-semibold text-slate-800">
            {board.sprintName ||
              "Current Sprint"}
          </p>

        </div>

        {board.sprintStatus && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[9px] font-medium text-emerald-500">
            {board.sprintStatus}
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">

          <div>
            <span className="text-[9px] text-slate-400">
              Tasks{" "}
            </span>

            <span className="text-[10px] font-semibold text-slate-700">
              {board.totalTasks ?? 0}
            </span>
          </div>

          <div>
            <span className="text-[9px] text-slate-400">
              Points{" "}
            </span>

            <span className="text-[10px] font-semibold text-slate-700">
              {board.totalPoints ?? 0} SP
            </span>
          </div>

        </div>

      </div>

      {/* ===================================================
          BOARD
      =================================================== */}

      <div className="w-full overflow-hidden">

        <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">

          {columns.map(
            (column, index) => {

              /*
               * Unique key even when
               * backend status is missing.
               */

              const columnKey =
                `column-${normalizeStatus(
                  column.status
                ) || "unknown"}-${index}`;

              return (
                <BoardColumn
                  key={columnKey}
                  column={column}
                  columnIndex={index}
                />
              );
            }
          )}

        </div>

      </div>

      {/* ===================================================
          EMPTY FILTER
      =================================================== */}

      {columns.length === 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-5 text-center">

          <p className="text-xs text-slate-400">
            No columns available.
          </p>

        </div>
      )}

      {/* ===================================================
          AVAILABLE LABELS
      =================================================== */}

      {Array.isArray(
        board.availableLabels
      ) &&
        board.availableLabels.length >
          0 && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">

            <p className="mb-1 text-[9px] font-medium text-slate-400">
              Labels
            </p>

            <div className="flex flex-wrap gap-1">

              {board.availableLabels.map(
                (label, index) => (
                  <span
                    key={`available-label-${String(
                      label
                    )}-${index}`}
                    className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-500"
                  >
                    {label}
                  </span>
                )
              )}

            </div>

          </div>
        )}
    </div>
  );
}