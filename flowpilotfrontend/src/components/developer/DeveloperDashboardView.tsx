import React, { useEffect, useMemo, useState } from "react";
import {
  FiClock,
  FiLayers,
  FiMessageSquare,
  FiRefreshCw,
  FiZap
} from "react-icons/fi";

import DeveloperSprintBoard from "./DeveloperSprintBoard";
import DeveloperTimeLog from "./DeveloperTimeLog";
import DeveloperMentions from "./DeveloperMentions";

interface DeveloperDashboardViewProps {
  activePage?: string;
}

interface SprintCard {
  databaseId: number;
  id: string;
  title: string;
  member: string;
  assigneeName?: string;
  points: number;
  status?: string;
  priority?: string;
  isMyTask?: boolean;
  completed?: boolean;
}

interface SprintColumn {
  title: string;
  count: number;
  cards: SprintCard[];
}

interface SprintBoardData {
  sprintName?: string;
  projectName?: string;
  myTasksTotal?: number;
  myTasksCompleted?: number;
  myTasksInProgress?: number;
  myTasksToDo?: number;
  myTasksPoints?: number;
  myTasksCompletedPoints?: number;
  myProgressPercent?: number;
  columns: SprintColumn[];
}

interface TimeLogEntry {
  id: number;
  task: string;
  hours: number;
  notes: string;
  logDate: string;
}

interface TimeLogResponse {
  entries: TimeLogEntry[];
  weeklyTotal: number;
}

interface Mention {
  id: number;
  unread: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
};

export const DeveloperDashboardView: React.FC<DeveloperDashboardViewProps> = ({
  activePage = "dashboard"
}) => {


  /* =========================================================
     REAL-TIME DASHBOARD STATE
     ========================================================= */
  const [boardData, setBoardData] = useState<SprintBoardData | null>(null);
  const [timeLogData, setTimeLogData] = useState<TimeLogResponse | null>(null);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      const token = getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const developerName =
        localStorage.getItem("name") ||
        localStorage.getItem("developerName") ||
        "";
      const projectId = localStorage.getItem("projectId");

      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (developerName) params.append("developerName", developerName);

      // Fetch sprint board, time logs, and mentions concurrently
      const [boardRes, timeRes, mentionRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/developer/sprint-board?${params.toString()}`, { headers }),
        fetch(`${API_BASE}/api/developer/time-logs`, { headers }),
        fetch(`${API_BASE}/api/developer/mentions`, { headers })
      ]);

      if (boardRes.status === "fulfilled" && boardRes.value.ok) {
        const bData: SprintBoardData = await boardRes.value.json();
        setBoardData(bData);
      }

      if (timeRes.status === "fulfilled" && timeRes.value.ok) {
        const tData: TimeLogResponse = await timeRes.value.json();
        setTimeLogData(tData);
      }

      if (mentionRes.status === "fulfilled" && mentionRes.value.ok) {
        const mData: Mention[] = await mentionRes.value.json();
        setMentions(Array.isArray(mData) ? mData : []);
      }

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Dashboard real-time sync failed:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time background sync interval (every 8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Compute developer's assigned tasks list
  const myAssignedTasks = useMemo(() => {
    if (!boardData?.columns) return [];
    const list: SprintCard[] = [];
    for (const col of boardData.columns) {
      for (const card of col.cards) {
        if (card.isMyTask) {
          list.push({ ...card, status: col.title });
        }
      }
    }
    return list;
  }, [boardData]);

  // Compute daily hours breakdown from real time logs
  const dailyHours = useMemo(() => {
    const days = [
      { name: "Mon", hours: 0 },
      { name: "Tue", hours: 0 },
      { name: "Wed", hours: 0 },
      { name: "Thu", hours: 0 },
      { name: "Fri", hours: 0 }
    ];

    if (!timeLogData?.entries) {
      return days;
    }

    // Accumulate hours by weekday
    for (const entry of timeLogData.entries) {
      if (!entry.logDate) continue;
      const date = new Date(entry.logDate);
      const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
      if (dayIndex >= 1 && dayIndex <= 5) {
        days[dayIndex - 1].hours += Number(entry.hours) || 0;
      }
    }

    return days;
  }, [timeLogData]);

  const maxDailyHour = useMemo(() => {
    const max = Math.max(...dailyHours.map((d) => d.hours), 8);
    return max;
  }, [dailyHours]);

  const unreadMentionsCount = useMemo(() => {
    return mentions.filter((m) => m.unread).length;
  }, [mentions]);

  const myTasksTotal = boardData?.myTasksTotal ?? myAssignedTasks.length;
  const myTasksCompleted = boardData?.myTasksCompleted ?? myAssignedTasks.filter((t) => t.status === "Done").length;
  const myTasksInProgress = boardData?.myTasksInProgress ?? myAssignedTasks.filter((t) => t.status === "In Progress" || t.status === "Code Review" || t.status === "Testing").length;
  const myTasksPoints = boardData?.myTasksPoints ?? myAssignedTasks.reduce((s, t) => s + (t.points || 0), 0);
  const myTasksCompletedPoints = boardData?.myTasksCompletedPoints ?? myAssignedTasks.filter((t) => t.status === "Done").reduce((s, t) => s + (t.points || 0), 0);
  const weeklyHoursTotal = Number(timeLogData?.weeklyTotal) || dailyHours.reduce((s, d) => s + d.hours, 0);

  /* =========================================================
     PAGE SWITCHING (AFTER ALL HOOKS)
     ========================================================= */
  if (activePage === "sprint-board") {
    return <DeveloperSprintBoard />;
  }

  if (activePage === "time-log") {
    return <DeveloperTimeLog />;
  }

  if (activePage === "mentions") {
    return <DeveloperMentions />;
  }

  return (
    <div className="w-full space-y-5">
      {/* Real-Time Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">
            Real-Time Sync Active
          </span>
          {lastSyncTime && (
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              • Last updated {lastSyncTime}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          <FiRefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Sync Now"}</span>
        </button>
      </div>

      {/* =====================================================
          TOP STAT CARDS (REAL-TIME DATA)
          ===================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Tasks This Sprint */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
              TASKS THIS SPRINT
            </span>
            <span className="rounded-md bg-teal-50 p-1 text-teal-600">
              <FiLayers className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mb-2 text-[26px] font-black leading-none text-slate-900">
            {loading ? "..." : myTasksTotal}
          </div>

          <div className="text-[12px] font-medium text-teal-600">
            {myTasksCompleted} done · {myTasksInProgress} in progress
          </div>
        </div>

        {/* Card 2: Story Points */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
              STORY POINTS
            </span>
            <span className="rounded-md bg-cyan-50 p-1 text-cyan-600">
              <FiZap className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mb-2 text-[26px] font-bold leading-none text-slate-900">
            {loading ? "..." : `${myTasksPoints} SP`}
          </div>

          <div className="text-[12px] font-medium text-cyan-600">
            {myTasksCompletedPoints} SP completed
          </div>
        </div>

        {/* Card 3: Hours This Week */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
              HOURS THIS WEEK
            </span>
            <span className="rounded-md bg-emerald-50 p-1 text-emerald-600">
              <FiClock className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mb-2 text-[26px] font-bold leading-none text-slate-900">
            {loading ? "..." : `${weeklyHoursTotal.toFixed(1)}h`}
          </div>

          <div className="text-[12px] font-medium text-emerald-600">
            across {timeLogData?.entries?.length || 0} time entries
          </div>
        </div>

        {/* Card 4: Unread Mentions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
              UNREAD MENTIONS
            </span>
            <span className="rounded-md bg-violet-50 p-1 text-violet-600">
              <FiMessageSquare className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mb-2 text-[26px] font-bold leading-none text-slate-900">
            {loading ? "..." : unreadMentionsCount}
          </div>

          <div className="text-[12px] font-medium text-violet-500">
            {unreadMentionsCount > 0 ? "Needs your attention" : "All caught up"}
          </div>
        </div>
      </div>

      {/* =====================================================
          LOWER CONTENT: REAL SPRINT TASKS + DAILY HOURS CHART
          ===================================================== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* ===================================================
            MY SPRINT TASKS (REAL-TIME FROM SCRUM MASTER)
            =================================================== */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-slate-900">
                My Sprint Tasks
              </h3>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200">
                {myAssignedTasks.length} Assigned
              </span>
            </div>

            {boardData?.sprintName && (
              <span className="text-[11px] font-semibold text-slate-400">
                {boardData.sprintName}
              </span>
            )}
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
            {myAssignedTasks.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  {loading ? "Loading tasks..." : "No tasks assigned to you in this sprint."}
                </p>
              </div>
            )}

            {myAssignedTasks.map((task) => {
              const isDone = task.status === "Done";
              const isInProgress =
                task.status === "In Progress" ||
                task.status === "Code Review" ||
                task.status === "Testing";

              return (
                <div
                  key={task.databaseId ?? task.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isDone
                          ? "bg-emerald-500"
                          : isInProgress
                          ? "bg-amber-500"
                          : "bg-slate-300"
                      }`}
                    />

                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-slate-900">
                        {task.title}
                      </div>

                      <div className="text-[11px] font-medium text-slate-400">
                        {task.id} · {task.points ?? 0} SP
                        {task.priority && ` · ${task.priority}`}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`ml-3 shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold border ${
                      isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : isInProgress
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* ===================================================
            DAILY HOURS (REAL-TIME FROM TIME LOGS)
            =================================================== */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-900">
                Daily Hours (This Week)
              </h3>
              <span className="text-xs font-semibold text-teal-600">
                Total: {weeklyHoursTotal.toFixed(1)}h
              </span>
            </div>

            {/* Dynamic Chart */}
            <div className="flex h-[160px] items-end justify-center pt-3">
              <div className="flex h-[155px] w-full max-w-[330px] items-end justify-between gap-2 px-3">
                {dailyHours.map((day) => {
                  const barHeight =
                    maxDailyHour > 0
                      ? Math.max(12, Math.round((day.hours / maxDailyHour) * 110))
                      : 12;

                  return (
                    <div
                      key={day.name}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <span className="mb-1.5 text-[10px] font-bold text-slate-600">
                        {day.hours > 0 ? `${day.hours}h` : "0h"}
                      </span>

                      <div
                        className={`w-full max-w-[38px] rounded-t-lg transition-all duration-500 ${
                          day.hours > 0
                            ? "bg-gradient-to-t from-teal-500 to-teal-400 shadow-sm"
                            : "bg-slate-100"
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />

                      <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase">
                        {day.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Week Total Footer */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
            <span className="text-[12px] font-semibold text-slate-500">
              Week Total Logged
            </span>

            <span className="text-[16px] font-extrabold text-teal-600">
              {weeklyHoursTotal.toFixed(1)}h
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};

export default DeveloperDashboardView;