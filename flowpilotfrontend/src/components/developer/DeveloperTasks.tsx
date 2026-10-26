import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiList,
  FiRefreshCw,
  FiSearch
} from "react-icons/fi";

type TaskStatus = "To Do" | "In Progress" | "Done";
type TaskPriority = "High" | "Medium" | "Low";

interface Task {
  id: number;
  taskId: string;
  priority: TaskPriority;
  title: string;
  details: string;
  status: TaskStatus;
  storyPoints: number;
  projectId: number | null;
  projectName: string;
}

const filterOptions = ["All", "To Do", "In Progress", "Done"] as const;

export const DeveloperTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof filterOptions)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8080/api/developer/tasks",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch tasks. Status: ${response.status}`
        );
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Compute progress metrics
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const todoCount = tasks.filter((t) => t.status === "To Do").length;

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = tasks
    .filter((t) => t.status === "Done")
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Filter tasks by active tab and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter =
        activeFilter === "All" || task.status === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.taskId.toLowerCase().includes(q) ||
        (task.projectName && task.projectName.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [tasks, activeFilter, searchQuery]);

  return (
    <div className="w-full space-y-4">
      {/* ========================================================
          MY TASKS PROGRESS SUMMARY CARD
          ======================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
              <FiList className="h-3 w-3" />
              Assigned Work Queue
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              My Assigned Tasks & Progress
            </h2>
            <p className="text-xs text-slate-400">
              Real-time progress of tasks assigned to you by your Scrum Master.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3.5 border border-white/10 sm:min-w-[340px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Personal Completion
              </span>
              <span className="font-bold text-teal-400">
                {progressPercent}% Done
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <div className="rounded-lg bg-white/5 py-1 px-1.5">
                <div className="text-[10px] uppercase text-slate-400">Total</div>
                <div className="text-xs font-bold text-white">{totalCount}</div>
              </div>
              <div className="rounded-lg bg-white/5 py-1 px-1.5">
                <div className="text-[10px] uppercase text-emerald-400">Done</div>
                <div className="text-xs font-bold text-emerald-400">{doneCount}</div>
              </div>
              <div className="rounded-lg bg-white/5 py-1 px-1.5">
                <div className="text-[10px] uppercase text-amber-400">In Progress</div>
                <div className="text-xs font-bold text-amber-400">{inProgressCount}</div>
              </div>
              <div className="rounded-lg bg-white/5 py-1 px-1.5">
                <div className="text-[10px] uppercase text-cyan-400">Story Pts</div>
                <div className="text-xs font-bold text-cyan-300">
                  {donePoints}/{totalPoints}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          TOOLBAR: FILTER TABS + SEARCH + REFRESH
          ======================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterOptions.map((filter) => {
            const active = activeFilter === filter;
            const count =
              filter === "All"
                ? totalCount
                : filter === "To Do"
                ? todoCount
                : filter === "In Progress"
                ? inProgressCount
                : doneCount;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{filter}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    active ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search your tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={fetchTasks}
            title="Refresh Tasks"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-teal-300 hover:text-teal-600"
          >
            <FiRefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================
          LOADING / ERROR / TASK LIST
          ======================================================== */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">
            Fetching assigned tasks...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchTasks}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
          >
            <FiRefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isDone = task.status === "Done";
            const isInProgress = task.status === "In Progress";

            return (
              <div
                key={task.id}
                className={`group rounded-xl bg-white p-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md ${
                  isDone
                    ? "border-2 border-emerald-400/80 ring-1 ring-emerald-400/10"
                    : isInProgress
                    ? "border-2 border-teal-500 ring-1 ring-teal-500/15"
                    : "border border-slate-200/90"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Indicator Icon */}
                  <div
                    className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${
                      isDone
                        ? "bg-emerald-50 text-emerald-600"
                        : isInProgress
                        ? "bg-teal-50 text-teal-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isDone ? (
                      <FiCheckCircle className="h-5 w-5" />
                    ) : isInProgress ? (
                      <FiClock className="h-5 w-5 animate-pulse" />
                    ) : (
                      <FiList className="h-5 w-5" />
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {task.taskId}
                      </span>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          task.priority === "High"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {task.priority}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-700 border border-teal-200">
                        MY TASK
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {task.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {task.details}
                    </p>
                  </div>

                  {/* Right Side Status & Points */}
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                        isDone
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : isInProgress
                          ? "border-teal-200 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {task.status}
                    </span>

                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {task.storyPoints} SP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-400">
              No tasks match your current filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeveloperTasks;