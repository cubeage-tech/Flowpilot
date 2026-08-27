import { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* =========================================================
   TYPES
========================================================= */

interface PMProject {
  id: number;
  projectCode: string;
  projectName: string;
  sprint: string | null;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  progress: number | null;
  teamMemberIds?: number[];
}

interface BoardTask {
  id: number;
  projectId: number | null;
  taskCode: string;
  title: string;
  who: string | null;
  assigneeName: string | null;
  points: number | null;
  columnStatus: string;
  ageDays: number | null;
  isStuck: boolean;
}

interface BoardColumn {
  name: string;
  tone: string;
  taskCount: number;
  pointsCount: number;
  tasks: BoardTask[];
}

interface ScrumBoard {
  projectId: number | null;
  sprintName: string;
  sprintGoal: string;
  totalTasks: number;
  totalPoints: number;
  columns: BoardColumn[];
}

/* =========================================================
   API
========================================================= */

const PROJECTS_API =
  "http://localhost:8080/api/pm/projects";

const BOARD_API =
  "http://localhost:8080/api/scrummaster/board";

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
   AXIOS CONFIG
========================================================= */

function getHeaders() {
  const token = getAuthToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

/* =========================================================
   COLUMN STYLE
========================================================= */

function getColumnStyle(columnName: string) {
  switch (columnName.toLowerCase()) {
    case "backlog":
      return {
        dot: "bg-slate-300",
        text: "text-slate-500",
      };

    case "to do":
      return {
        dot: "bg-slate-300",
        text: "text-slate-500",
      };

    case "in progress":
      return {
        dot: "bg-orange-400",
        text: "text-orange-600",
      };

    case "code review":
      return {
        dot: "bg-violet-500",
        text: "text-violet-600",
      };

    case "testing":
      return {
        dot: "bg-teal-500",
        text: "text-teal-600",
      };

    case "done":
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-600",
      };

    default:
      return {
        dot: "bg-slate-300",
        text: "text-slate-500",
      };
  }
}

/* =========================================================
   TASK CARD
========================================================= */

function TaskCard({
  task,
}: {
  task: BoardTask;
}) {
  return (
    <div
      className={`rounded-lg border bg-white px-2.5 py-2 shadow-sm ${
        task.isStuck
          ? "border-orange-200"
          : "border-slate-200"
      }`}
    >
      {/* TOP */}

      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] text-slate-400">
          {task.taskCode}
        </p>

        <p className="shrink-0 text-[11px] text-slate-500">
          {task.points ?? 0}p
        </p>
      </div>

      {/* TITLE */}

      <p className="mt-1 line-clamp-2 text-[12px] leading-4 text-slate-800">
        {task.title}
      </p>

      {/* BOTTOM */}

      <div className="mt-2 flex items-center justify-between gap-2">
        {/* ASSIGNEE */}

        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-semibold text-emerald-600">
            {task.who || "?"}
          </div>

          <p className="truncate text-[9px] text-slate-400">
            {task.assigneeName || "Unassigned"}
          </p>
        </div>

        {/* AGE */}

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[10px] text-slate-400">
            ◷
          </span>

          <span
            className={`text-[9px] ${
              task.isStuck
                ? "font-semibold text-orange-500"
                : "text-slate-400"
            }`}
          >
            {task.ageDays ?? 0}d
          </span>
        </div>
      </div>

      {/* STUCK */}

      {task.isStuck && (
        <div className="mt-1">
          <span className="text-[8px] font-medium text-orange-500">
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
}: {
  column: BoardColumn;
}) {
  const style = getColumnStyle(column.name);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
      {/* COLUMN HEADER */}

      <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-200 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
          />

          <span
            className={`truncate text-[10px] font-medium uppercase tracking-wider ${style.text}`}
          >
            {column.name}
          </span>
        </div>

        <span className="shrink-0 text-[9px] text-slate-400">
          {column.taskCount} · {column.pointsCount}p
        </span>
      </div>

      {/* TASKS */}

      <div className="min-h-0 flex-1 overflow-hidden p-2">
        {column.tasks.length === 0 ? (
          <div className="flex h-full items-start justify-center pt-5">
            <span className="text-[9px] text-slate-300">
              No tasks
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function PMTaskBoard() {
  const [projects, setProjects] = useState<PMProject[]>([]);

  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [board, setBoard] =
    useState<ScrumBoard | null>(null);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingBoard, setLoadingBoard] =
    useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     FETCH PM PROJECTS
  ======================================================= */

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");

      const response = await axios.get(
        PROJECTS_API,
        {
          headers: getHeaders(),
        }
      );

      console.log(
        "PM Projects:",
        response.data
      );

      let data: PMProject[] = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (
        Array.isArray(response.data?.data)
      ) {
        data = response.data.data;
      }

      setProjects(data);

      /*
       * Automatically select first project.
       */

      if (
        data.length > 0 &&
        selectedProjectId === null
      ) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err: any) {
      console.error(
        "Error fetching PM projects:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Failed to load PM projects."
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  /* =======================================================
     FETCH SCRUM BOARD
  ======================================================= */

  const fetchBoard = async (
    projectId: number
  ) => {
    try {
      setLoadingBoard(true);
      setError("");

      const response = await axios.get(
        BOARD_API,
        {
          params: {
            projectId,
          },
          headers: getHeaders(),
        }
      );

      console.log(
        "Scrum Master Board:",
        response.data
      );

      setBoard(response.data);
    } catch (err: any) {
      console.error(
        "Error fetching Scrum Board:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setBoard(null);

      setError(
        err.response?.data?.message ||
          "Failed to load Scrum Master board."
      );
    } finally {
      setLoadingBoard(false);
    }
  };

  /* =======================================================
     INITIAL PROJECT FETCH
  ======================================================= */

  useEffect(() => {
    fetchProjects();
  }, []);

  /* =======================================================
     FETCH BOARD WHEN PROJECT CHANGES
  ======================================================= */

  useEffect(() => {
    if (selectedProjectId !== null) {
      fetchBoard(selectedProjectId);
    } else {
      setBoard(null);
    }
  }, [selectedProjectId]);

  /* =======================================================
     SELECTED PROJECT
  ======================================================= */

  const selectedProject = useMemo(() => {
    if (selectedProjectId === null) {
      return null;
    }

    return (
      projects.find(
        (project) =>
          project.id === selectedProjectId
      ) || null
    );
  }, [projects, selectedProjectId]);

  /* =======================================================
     LOADING PROJECTS
  ======================================================= */

  if (loadingProjects) {
    return (
      <div className="w-full overflow-hidden">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm text-slate-400">
            Loading PM projects...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     NO PROJECTS
  ======================================================= */

  if (projects.length === 0) {
    return (
      <div className="w-full overflow-hidden">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-5">
          <p className="text-sm text-slate-500">
            No PM projects found.
          </p>

          <button
            type="button"
            onClick={fetchProjects}
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="w-full overflow-hidden">
      {/* ===================================================
          PROJECT SELECTOR
      =================================================== */}

      <div className="mb-3 flex h-14 items-center justify-between rounded-xl border border-slate-200 bg-white px-4">
        {/* LEFT */}

        <div className="flex min-w-0 items-center gap-3">
          {/* FOLDER */}

          <div className="flex h-7 w-7 shrink-0 items-center justify-center text-emerald-600">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2h7A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              PM Project
            </p>

            <select
              value={selectedProjectId ?? ""}
              onChange={(event) => {
                const value =
                  event.target.value;

                setSelectedProjectId(
                  value
                    ? Number(value)
                    : null
                );
              }}
              className="mt-0.5 max-w-[300px] truncate rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.projectName}
                  {project.projectCode
                    ? ` (${project.projectCode})`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RIGHT */}

        <div className="hidden text-right sm:block">
          {selectedProject && (
            <>
              <p className="text-[10px] text-slate-400">
                {selectedProject.projectCode}
              </p>

              <p className="text-[10px] text-slate-500">
                {selectedProject.sprint ||
                  "No Sprint"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-500">
            {error}
          </p>
        </div>
      )}

      {/* ===================================================
          PROJECT / SPRINT HEADER
      =================================================== */}

      <div className="mb-2 flex h-12 items-center justify-between px-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {board?.sprintName ||
              selectedProject?.sprint ||
              "Sprint"}
          </p>

          <p className="truncate text-[10px] text-slate-400">
            Goal:{" "}
            {board?.sprintGoal ||
              "No sprint goal available"}
          </p>
        </div>

        <div className="shrink-0 text-[10px] text-slate-400">
          {board?.totalTasks ?? 0} tasks
          {" · "}
          {board?.totalPoints ?? 0} points
        </div>
      </div>

      {/* ===================================================
          BOARD
      =================================================== */}

      <div className="h-[390px] w-full">
        {loadingBoard ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white">
            <p className="text-xs text-slate-400">
              Loading team board...
            </p>
          </div>
        ) : !board ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white">
            <p className="text-xs text-slate-400">
              No board data available.
            </p>
          </div>
        ) : (
          <div className="flex h-full w-full gap-2.5 overflow-hidden">
            {board.columns.map(
              (column) => (
                <BoardColumn
                  key={column.name}
                  column={column}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PMTaskBoard;