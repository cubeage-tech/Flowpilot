import React, { useMemo, useState } from "react";

type TaskStatus = "To Do" | "In Progress" | "Done";
type TaskPriority = "High" | "Medium";

interface Task {
  id: string;
  priority: TaskPriority;
  title: string;
  details: string;
  status: TaskStatus;
  storyPoints: number;
}

const tasks: Task[] = [
  {
    id: "T-040",
    priority: "High",
    title: "Design system component library",
    details: "IPMT Platform v2 · Sprint 12 · Due Aug 8 · 3/7 done",
    status: "In Progress",
    storyPoints: 8,
  },
  {
    id: "T-044",
    priority: "Medium",
    title: "Mobile responsive layout",
    details: "IPMT Platform v2 · Sprint 12 · Due Aug 7 · 4/5 done",
    status: "In Progress",
    storyPoints: 5,
  },
  {
    id: "T-046",
    priority: "High",
    title: "JWT token refresh logic",
    details: "IPMT Platform v2 · Sprint 12 · Due Aug 3 · 2/2 done",
    status: "Done",
    storyPoints: 2,
  },
  {
    id: "T-049",
    priority: "Medium",
    title: "Kanban drag & drop",
    details: "IPMT Platform v2 · Sprint 12 · Due Aug 12 · 0/6 done",
    status: "To Do",
    storyPoints: 8,
  },
];

const filterOptions = ["All", "To Do", "In Progress", "Done"] as const;

const DeveloperTasks: React.FC = () => {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filterOptions)[number]>("All");

  const filteredTasks = useMemo(() => {
    if (activeFilter === "All") return tasks;

    return tasks.filter((task) => task.status === activeFilter);
  }, [activeFilter]);

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {filterOptions.map((filter) => {
          const active = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border-teal-100 bg-teal-50 text-teal-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-teal-200 hover:bg-teal-50"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="group rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-[0_3px_15px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              {/* Left Icon - hidden on mobile */}
              <div
                className={`hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  task.status === "Done" ? "bg-emerald-50" : task.status === "To Do" ? "bg-gray-50" : "bg-orange-50"
                }`}
              >
                {task.status === "Done" ? (
                  <span className="text-lg text-emerald-500">✓</span>
                ) : task.status === "To Do" ? (
                  <span className="text-lg text-orange-500">▤</span>
                ) : (
                  <span className="text-lg text-orange-500">ϟ</span>
                )}
              </div>

              {/* Main Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{task.id}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    task.priority === "High" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
                  }`}>{task.priority}</span>
                </div>
                <h3 className="text-[14px] sm:text-[16px] font-bold text-gray-900">{task.title}</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">{task.details}</p>
              </div>

              {/* Right Content */}
              <div className="flex shrink-0 flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-5">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  task.status === "In Progress"
                    ? "border border-orange-100 bg-orange-50 text-orange-500"
                    : task.status === "Done"
                    ? "border border-emerald-100 bg-emerald-50 text-emerald-500"
                    : "border border-gray-100 bg-gray-50 text-slate-400"
                }`}>{task.status}</span>
                <span className="text-xs sm:text-sm font-semibold text-teal-400">{task.storyPoints} SP</span>
              </div>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            No tasks found.
          </div>
        )}
      </div>
    </div>
  );
};

export { DeveloperTasks };
export default DeveloperTasks;