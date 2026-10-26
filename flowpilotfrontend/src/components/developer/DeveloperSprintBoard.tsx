import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheck,
  FiLayers,
  FiMove,
  FiRefreshCw,
  FiSearch,
  FiUser
} from "react-icons/fi";

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

interface SprintBoardResponse {
  sprintId?: number;
  sprintName?: string;
  projectId?: number;
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

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:8080"
}/api/developer/sprint-board`;

const COLUMNS_LIST = ["To Do", "In Progress", "Code Review", "Testing", "Done"] as const;

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
};

export const DeveloperSprintBoard: React.FC = () => {
  const [boardData, setBoardData] = useState<SprintBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "myTasks">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drag-and-drop state
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchSprintBoard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      const projectId = localStorage.getItem("projectId");
      const developerName =
        localStorage.getItem("name") ||
        localStorage.getItem("developerName") ||
        "";

      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (developerName) params.append("developerName", developerName);

      const queryString = params.toString();
      const response = await fetch(
        `${API_URL}${queryString ? `?${queryString}` : ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Failed to load sprint board (${response.status})`);
      }

      const data: SprintBoardResponse = await response.json();
      setBoardData(data);
    } catch (err) {
      console.error("Error loading sprint board:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load sprint board."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintBoard();
  }, []);

  // Handle task status change (via Drag-and-Drop or direct selection)
  const handleMoveTask = async (taskId: number, targetStatus: string) => {
    if (!boardData) return;

    // Find the task across all columns
    let foundCard: SprintCard | null = null;
    let sourceColumnTitle = "";

    for (const col of boardData.columns) {
      const c = col.cards.find((card) => card.databaseId === taskId);
      if (c) {
        foundCard = c;
        sourceColumnTitle = col.title;
        break;
      }
    }

    if (!foundCard || sourceColumnTitle === targetStatus) {
      return;
    }

    // Permission check: developer can only move their own tasks
    if (!foundCard.isMyTask) {
      setError("You can only change the status of tasks assigned to you.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const previousBoard = boardData;

    // 1. Optimistic update
    const updatedColumns = boardData.columns.map((col) => {
      if (col.title === sourceColumnTitle) {
        const remainingCards = col.cards.filter(
          (c) => c.databaseId !== taskId
        );
        return {
          ...col,
          count: remainingCards.length,
          cards: remainingCards
        };
      }
      if (col.title === targetStatus) {
        const updatedCard: SprintCard = {
          ...foundCard!,
          status: targetStatus,
          completed: targetStatus === "Done"
        };
        const newCards = [...col.cards, updatedCard];
        return {
          ...col,
          count: newCards.length,
          cards: newCards
        };
      }
      return col;
    });

    // Recompute developer's progress metrics
    let myTasksTotal = 0;
    let myTasksCompleted = 0;
    let myTasksInProgress = 0;
    let myTasksToDo = 0;
    let myTasksPoints = 0;
    let myTasksCompletedPoints = 0;

    for (const col of updatedColumns) {
      for (const card of col.cards) {
        if (card.isMyTask) {
          myTasksTotal++;
          const pts = card.points || 0;
          myTasksPoints += pts;

          if (col.title === "Done") {
            myTasksCompleted++;
            myTasksCompletedPoints += pts;
          } else if (
            col.title === "In Progress" ||
            col.title === "Code Review" ||
            col.title === "Testing"
          ) {
            myTasksInProgress++;
          } else {
            myTasksToDo++;
          }
        }
      }
    }

    const myProgressPercent =
      myTasksTotal > 0
        ? Math.round((myTasksCompleted / myTasksTotal) * 100)
        : 0;

    setBoardData({
      ...boardData,
      myTasksTotal,
      myTasksCompleted,
      myTasksInProgress,
      myTasksToDo,
      myTasksPoints,
      myTasksCompletedPoints,
      myProgressPercent,
      columns: updatedColumns
    });

    setMovingTaskId(taskId);
    setStatusMessage(`Moved ${foundCard.id} to ${targetStatus}`);
    setTimeout(() => setStatusMessage(null), 3000);

    // 2. Persist to backend
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: targetStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status on server (${response.status})`);
      }
    } catch (err) {
      console.error("Failed to move task:", err);
      // Revert optimistic update
      setBoardData(previousBoard);
      setError("Failed to update task status. Reverting changes.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setMovingTaskId(null);
    }
  };

  // Drag event handlers - only permit drag for my tasks
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    card: SprintCard
  ) => {
    if (!card.isMyTask) {
      e.preventDefault();
      return;
    }
    setDraggingCardId(card.databaseId);
    e.dataTransfer.setData("text/plain", String(card.databaseId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingCardId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    columnTitle: string
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnTitle) {
      setDragOverColumn(columnTitle);
    }
  };

  const handleDragLeave = (
    e: React.DragEvent<HTMLDivElement>,
    columnTitle: string
  ) => {
    // Only clear if actually leaving this column container
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      if (dragOverColumn === columnTitle) {
        setDragOverColumn(null);
      }
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetStatus: string
  ) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskIdStr = e.dataTransfer.getData("text/plain");
    const taskId = Number(taskIdStr) || draggingCardId;

    if (taskId) {
      handleMoveTask(taskId, targetStatus);
    }
    setDraggingCardId(null);
  };

  const totalSprintCards = useMemo(() => {
    if (!boardData?.columns) return 0;
    return boardData.columns.reduce(
      (sum, col) => sum + (col.cards?.length || 0),
      0
    );
  }, [boardData]);

  const myTasksCount = useMemo(() => {
    if (boardData?.myTasksTotal !== undefined) return boardData.myTasksTotal;
    if (!boardData?.columns) return 0;
    return boardData.columns.reduce(
      (sum, col) =>
        sum + (col.cards?.filter((c) => c.isMyTask).length || 0),
      0
    );
  }, [boardData]);

  // Filter columns and cards based on filterMode and searchQuery
  const displayedColumns = useMemo(() => {
    if (!boardData?.columns) return [];

    return boardData.columns.map((col) => {
      let filteredCards = col.cards || [];

      if (filterMode === "myTasks") {
        filteredCards = filteredCards.filter((card) => card.isMyTask);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filteredCards = filteredCards.filter(
          (card) =>
            card.title.toLowerCase().includes(q) ||
            card.id.toLowerCase().includes(q) ||
            (card.assigneeName && card.assigneeName.toLowerCase().includes(q))
        );
      }

      return {
        ...col,
        count: filteredCards.length,
        cards: filteredCards
      };
    });
  }, [boardData, filterMode, searchQuery]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">
            Loading your task board from Scrum Master...
          </p>
        </div>
      </div>
    );
  }

  if (error && !boardData) {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchSprintBoard}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <FiRefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const myTasksTotal = boardData?.myTasksTotal ?? 0;
  const myTasksCompleted = boardData?.myTasksCompleted ?? 0;
  const myTasksInProgress = boardData?.myTasksInProgress ?? 0;
  const myTasksToDo = boardData?.myTasksToDo ?? 0;
  const myTasksPoints = boardData?.myTasksPoints ?? 0;
  const myTasksCompletedPoints = boardData?.myTasksCompletedPoints ?? 0;
  const myProgressPercent = boardData?.myProgressPercent ?? 0;

  return (
    <div className="w-full space-y-4">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-teal-300 shadow-xl border border-teal-500/30 animate-bounce">
          <FiCheck className="h-4 w-4 text-teal-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ========================================================
          MY TASKS PROGRESS HERO BANNER
          ======================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
                <FiLayers className="h-3 w-3" />
                {boardData?.sprintName || "Active Sprint"}
              </span>
              {boardData?.projectName && (
                <span className="text-xs font-medium text-slate-300">
                  • {boardData.projectName}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Interactive Sprint Board
            </h2>
            <p className="text-xs text-slate-400">
              Drag and drop your tasks across columns to update their progress live.
            </p>
          </div>

          {/* Dedicated My Tasks Progress Card */}
          <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3.5 border border-white/10 sm:min-w-[350px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                My Tasks Progress
              </span>
              <span className="font-bold text-teal-400">
                {myProgressPercent}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, myProgressPercent)}%` }}
              />
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-5 gap-1.5 pt-1 text-center">
              <div className="rounded-lg bg-white/5 py-1 px-1">
                <div className="text-[10px] uppercase text-slate-400">Total</div>
                <div className="text-xs font-bold text-white">{myTasksTotal}</div>
              </div>
              <div className="rounded-lg bg-white/5 py-1 px-1">
                <div className="text-[10px] uppercase text-emerald-400">Done</div>
                <div className="text-xs font-bold text-emerald-400">{myTasksCompleted}</div>
              </div>
              <div className="rounded-lg bg-white/5 py-1 px-1">
                <div className="text-[10px] uppercase text-amber-400">Active</div>
                <div className="text-xs font-bold text-amber-400">{myTasksInProgress}</div>
              </div>
              <div className="rounded-lg bg-white/5 py-1 px-1">
                <div className="text-[10px] uppercase text-slate-300">To Do</div>
                <div className="text-xs font-bold text-slate-200">{myTasksToDo}</div>
              </div>
              <div className="rounded-lg bg-white/5 py-1 px-1">
                <div className="text-[10px] uppercase text-cyan-400">SP</div>
                <div className="text-xs font-bold text-cyan-300">
                  {myTasksCompletedPoints}/{myTasksPoints}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          TOOLBAR: FILTER TOGGLE + SEARCH + REFRESH
          ======================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle All vs My Tasks */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiLayers className="h-3.5 w-3.5" />
              All Team Tasks ({totalSprintCards})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("myTasks")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterMode === "myTasks"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiUser className="h-3.5 w-3.5" />
              Only My Tasks ({myTasksCount})
            </button>
          </div>

          <span className="hidden text-xs text-slate-400 md:inline">
            ✋ Drag cards to change status
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={fetchSprintBoard}
            title="Refresh Board"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-teal-300 hover:text-teal-600"
          >
            <FiRefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================
          KANBAN SPRINT BOARD COLUMNS WITH DRAG AND DROP
          ======================================================== */}
      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {displayedColumns.map((column) => {
            const isDropTarget = dragOverColumn === column.title;
            const columnTheme =
              column.title === "In Progress"
                ? "border-amber-200 bg-amber-50/30 text-amber-600"
                : column.title === "Code Review"
                ? "border-violet-200 bg-violet-50/30 text-violet-600"
                : column.title === "Testing"
                ? "border-cyan-200 bg-cyan-50/30 text-cyan-600"
                : column.title === "Done"
                ? "border-emerald-200 bg-emerald-50/30 text-emerald-600"
                : "border-slate-200 bg-slate-50/50 text-slate-700";

            return (
              <div
                key={column.title}
                onDragOver={(e) => handleDragOver(e, column.title)}
                onDragLeave={(e) => handleDragLeave(e, column.title)}
                onDrop={(e) => handleDrop(e, column.title)}
                className={`flex flex-col min-h-[480px] rounded-2xl border p-3 transition-all duration-200 ${
                  isDropTarget
                    ? "border-2 border-dashed border-teal-500 bg-teal-50/40 ring-4 ring-teal-500/15"
                    : "border-slate-200/80 bg-slate-50/40"
                }`}
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">
                      {column.title}
                    </h3>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${columnTheme}`}
                    >
                      {column.count}
                    </span>
                  </div>

                  {isDropTarget && (
                    <span className="text-[10px] font-bold text-teal-600 animate-pulse">
                      Drop here
                    </span>
                  )}
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1">
                  {column.cards.length === 0 && (
                    <div
                      className={`flex h-36 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors ${
                        isDropTarget
                          ? "border-teal-400 bg-teal-50/60"
                          : "border-slate-200 bg-white/70"
                      }`}
                    >
                      <p className="text-xs text-slate-400 font-medium">
                        {isDropTarget
                          ? `Drop task here to set ${column.title}`
                          : filterMode === "myTasks"
                          ? "No assigned tasks here"
                          : "No tasks in this column"}
                      </p>
                    </div>
                  )}

                  {column.cards.map((card) => {
                    const isMyTask = card.isMyTask === true;
                    const isDone =
                      card.completed === true || column.title === "Done";
                    const isBeingDragged =
                      draggingCardId === card.databaseId;
                    const isSaving = movingTaskId === card.databaseId;

                    return (
                      <div
                        key={card.databaseId ?? card.id}
                        draggable={isMyTask}
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                        className={`group relative rounded-xl bg-white p-3.5 transition-all duration-200 ${
                          isMyTask
                            ? `cursor-grab active:cursor-grabbing hover:-translate-y-[1px] hover:shadow-md ${
                                isDone
                                  ? "border-2 border-emerald-400 ring-2 ring-emerald-400/10 shadow-sm"
                                  : "border-2 border-teal-500 ring-2 ring-teal-500/15 shadow-sm"
                              }`
                            : "cursor-default border border-slate-200/80 bg-slate-50/30 opacity-80"
                        } ${isBeingDragged ? "opacity-40 scale-95" : ""} ${
                          isSaving ? "animate-pulse border-teal-400" : ""
                        }`}
                      >
                        {/* Drag Handle & MY TASK Pill & Task Code */}
                        <div className="mb-1.5 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            {isMyTask ? (
                              <span
                                title="Drag to change status"
                                className="cursor-grab text-teal-400 group-hover:text-teal-600 transition-colors"
                              >
                                <FiMove className="h-3 w-3" />
                              </span>
                            ) : null}
                            <span className="font-mono text-[11px] font-semibold text-slate-500">
                              {card.id}
                            </span>
                          </div>

                          {isMyTask ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                isDone
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                  : "bg-teal-100 text-teal-700 border border-teal-300"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                              MY TASK
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                              {card.priority || "Teammate"}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          className={`text-xs leading-snug ${
                            isMyTask
                              ? "font-bold text-slate-900"
                              : "font-medium text-slate-600"
                          }`}
                        >
                          {card.title}
                        </h4>

                        {/* Bottom Metadata & Move Selector */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                          {/* Assignee */}
                          <div
                            className="flex items-center gap-1.5 text-slate-500"
                            title={card.assigneeName || "Unassigned"}
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                                isMyTask
                                  ? "bg-teal-500 text-white shadow-sm"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {card.member || "??"}
                            </span>
                            <span className="truncate max-w-[75px] text-[10px]">
                              {isMyTask ? "You" : card.assigneeName || card.member}
                            </span>
                          </div>

                          {/* Move Controls / Read-only label + Story Points */}
                          <div className="flex items-center gap-1.5">
                            {isMyTask ? (
                              <select
                                value={column.title}
                                onChange={(e) =>
                                  handleMoveTask(card.databaseId, e.target.value)
                                }
                                title="Change status"
                                className="rounded border border-teal-200 bg-teal-50/50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 focus:border-teal-500 focus:outline-none cursor-pointer"
                              >
                                {COLUMNS_LIST.map((target) => (
                                  <option key={target} value={target}>
                                    {target === column.title
                                      ? `• ${target}`
                                      : `→ ${target}`}
                                  </option>
                                ))}
                              </select>
                            ) : null}

                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                isMyTask
                                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {card.points ?? 0} SP
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DeveloperSprintBoard;