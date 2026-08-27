import React, { useEffect, useState } from "react";

interface TimeEntry {
  id: number;
  date: string;
  task: string;
  hours: number;
  notes: string;
}
const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/developer/time-logs`;

interface BackendTimeEntry {
  id: number;
  task: string;
  hours: number;
  notes: string;
  logDate: string;
}

interface TimeLogHistoryResponse {
  entries: BackendTimeEntry[];
  weeklyTotal: number;
}

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
};

const getAuthHeaders = (includeContentType = false): HeadersInit => {
  const token = getToken();
  return {
    ...(includeContentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit,
  attempts = 2
) => {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) {
        throw lastError;
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastError;
};

const DeveloperTimeLog: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState(
    "T-040 — Design system component library"
  );

  const [hours, setHours] = useState("2.5");
  const [notes, setNotes] = useState("");

  const [entries, setEntries] = useState<TimeEntry[]>([]);
const [weeklyTotal, setWeeklyTotal] = useState(0);
const [success, setSuccess] = useState("");
const [loading, setLoading] = useState(false);
const formatDate = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
const fetchTimeLogs = async () => {
  try {
    const response = await fetchWithRetry(API_URL, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        throw new Error("Session expired. Please log in again.");
      }

      throw new Error(`Failed to load time logs (${response.status})`);
    }

    const data: TimeLogHistoryResponse =
      await response.json();

    const rawEntries = Array.isArray(data?.entries) ? data.entries : [];

    const formattedEntries: TimeEntry[] =
      rawEntries.map((entry) => ({
        id: entry.id,
        date: formatDate(entry.logDate),
        task: entry.task,
        hours: Number(entry.hours),
        notes: entry.notes,
      }));

    setEntries(formattedEntries);

    setWeeklyTotal(
      Number(data?.weeklyTotal ?? 0)
    );

  } catch (error) {
    console.error(
      "Error loading time logs:",
      error
    );

    setSuccess(error instanceof Error && error.name === "AbortError"
      ? "Time log service timed out. Please try again."
      : error instanceof TypeError
        ? "Unable to reach time log service. Please check that the backend is running."
        : error instanceof Error
          ? error.message
          : "Failed to load time log history.");
  }
};
useEffect(() => {
  fetchTimeLogs();
}, []);
  const handleLogTime = async (
  event: React.FormEvent
) => {
  event.preventDefault();

  const numericHours = Number(hours);

  if (!selectedTask) {
    setSuccess("Please select a task.");
    return;
  }

  if (!numericHours || numericHours <= 0) {
    setSuccess("Please enter valid hours.");
    return;
  }

  if (!notes.trim()) {
    setSuccess("Please enter notes.");
    return;
  }

  try {
    setLoading(true);
    setSuccess("");

    const response = await fetchWithRetry(API_URL, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        task: selectedTask,
        hours: numericHours,
        notes: notes.trim(),
      }),
    });

    if (!response.ok) {
  let errorMessage = "Failed to save time log";

  const responseText = await response.text();

  if (responseText) {
    try {
      const errorData = JSON.parse(responseText);

      errorMessage =
        errorData.message ||
        errorMessage;

    } catch {
      errorMessage = responseText;
    }
  }

  throw new Error(errorMessage);
}

    await fetchTimeLogs();

    setNotes("");
    setHours("2.5");

    setSuccess("Time logged successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 2500);

  } catch (error: any) {

    console.error(
      "Error saving time log:",
      error
    );

    setSuccess(
      error.message ||
      "Failed to save time log."
    );

  } finally {
    setLoading(false);
  }
};
  return (
    <div className="w-full space-y-1">
      {/* Log Time Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.04)]">
        <h2 className="text-[13.5px] font-bold text-gray-1000">
          Log Time for Today
        </h2>

        <form onSubmit={handleLogTime} className="mt-1">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_130px]">
            {/* Task */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Task
              </label>

              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              >
                <option>
                  T-040 — Design system component library
                </option>
                <option>
                  T-044 — Mobile responsive layout
                </option>
                <option>T-046 — JWT token refresh logic</option>
                <option>T-049 — Kanban drag & drop</option>
              </select>
            </div>

            {/* Hours */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
                Hours
              </label>

              <input
                type="number"
                min="0.5"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-700 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-3">
            <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-gray-400">
              Notes
            </label>

            <input
              type="text"
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Bottom */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
       <button
  type="submit"
  disabled={loading}
  className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-[1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? "Saving..." : "Log Time"}
</button>
            {success && (
              <span
                className={`text-sm ${
                  success.includes("successfully")
                    ? "text-emerald-500"
                    : "text-red-400"
                }`}
              >
                {success}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* History */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_3px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[13px] font-bold text-gray-900">
            Time Log History
          </h2>

          <span className="text-sm font-bold text-teal-400">
            {weeklyTotal}h this week
          </span>
        </div>

        {/* History table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[850px] w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
                <th className="px-4 py-3 text-[10.5px] font-bold text-gray-400">
                  DATE
                </th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-gray-400">
                  TASK
                </th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-gray-400">
                  HOURS
                </th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-gray-400">
                  NOTES
                </th>
              </tr>
            </thead>

            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-4 text-[12px] text-gray-400">
                    {entry.date}
                  </td>

                  <td className="px-4 py-4 text-[12.5px] text-gray-600">
                    {entry.task}
                  </td>

                  <td className="px-4 py-4 text-[14px] font-bold text-teal-400">
                    {entry.hours}h
                  </td>

                  <td className="px-4 py-4 text-[12px] text-gray-400">
                    {entry.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* History cards — mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {entries.map((entry) => (
            <div key={entry.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-teal-400">{entry.hours}h</span>
                <span className="text-xs text-gray-400">{entry.date}</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{entry.task}</p>
              <p className="text-xs text-gray-400">{entry.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { DeveloperTimeLog };
export default DeveloperTimeLog;