import React from "react";

import DeveloperTasks from "./DeveloperTasks";
import DeveloperSprintBoard from "./DeveloperSprintBoard";
import DeveloperTimeLog from "./DeveloperTimeLog";
import DeveloperMentions from "./DeveloperMentions";

interface DeveloperDashboardViewProps {
  activePage?: string;
}

export const DeveloperDashboardView: React.FC<
  DeveloperDashboardViewProps
> = ({ activePage = "dashboard" }) => {
  /* =========================================================
     PAGE SWITCHING
     ========================================================= */

  if (activePage === "tasks") {
    return <DeveloperTasks />;
  }

  if (activePage === "sprint-board") {
    return <DeveloperSprintBoard />;
  }

  if (activePage === "time-log") {
    return <DeveloperTimeLog />;
  }

  if (activePage === "mentions") {
    return <DeveloperMentions />;
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  return (
    <div className="w-full">
      {/* =====================================================
          TOP STAT CARDS
          ===================================================== */}

      {/* =====================================================
    TOP STAT CARDS
    ===================================================== */}

<div className="grid grid-cols-2 gap-3 sm:gap-3 lg:grid-cols-4">

  {/* Card 1 */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
      TASKS THIS SPRINT
    </div>

    <div className="mb-2 text-[25px] font-black leading-none text-slate-800">
      4
    </div>

    <div className="text-[12px] font-medium text-cyan-300">
      1 done · 2 in progress
    </div>
  </div>

  {/* Card 2 */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
      STORY POINTS
    </div>

    <div className="mb-2 text-[25px] font-bold leading-none text-slate-800">
      23 SP
    </div>

    <div className="text-[12px] font-medium text-cyan-300">
      10 SP completed
    </div>
  </div>

  {/* Card 3 */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
      HOURS THIS WEEK
    </div>

    <div className="mb-2 text-[25px] font-bold leading-none text-slate-900">
      18h
    </div>

    <div className="text-[12px] font-medium text-emerald-500">
      across 5 tasks
    </div>
  </div>

  {/* Card 4 */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
      UNREAD MENTIONS
    </div>

    <div className="mb-2 text-[25px] font-bold leading-none text-slate-800">
      2
    </div>

    <div className="text-[12px] font-medium text-purple-400">
      Need your attention
    </div>
  </div>

</div>

      {/* =====================================================
          LOWER CONTENT
          ===================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* ===================================================
            MY SPRINT TASKS
            =================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <h3 className="mb-4 text-[14px] font-bold text-slate-900">
            My Sprint Tasks
          </h3>

          <div className="space-y-3">
            {/* Task 1 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-slate-200">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-900">
                    Design system component library
                  </div>

                  <div className="text-[11px] font-medium text-slate-400">
                    T-040 · 8 SP · Due Aug 8
                  </div>
                </div>
              </div>

              <span className="ml-3 shrink-0 rounded-lg bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-500">
                In Progress
              </span>
            </div>

            {/* Task 2 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-slate-200">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-900">
                    Mobile responsive layout
                  </div>

                  <div className="text-[11px] font-medium text-slate-400">
                    T-044 · 5 SP · Due Aug 7
                  </div>
                </div>
              </div>

              <span className="ml-3 shrink-0 rounded-lg bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-500">
                In Progress
              </span>
            </div>

            {/* Task 3 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-slate-200">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-900">
                    JWT token refresh logic
                  </div>

                  <div className="text-[11px] font-medium text-slate-400">
                    T-046 · 2 SP · Due Aug 3
                  </div>
                </div>
              </div>

              <span className="ml-3 shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-500">
                Done
              </span>
            </div>

            {/* Task 4 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-slate-200">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />

                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-900">
                    Kanban drag & drop
                  </div>

                  <div className="text-[11px] font-medium text-slate-400">
                    T-049 · 8 SP · Due Aug 12
                  </div>
                </div>
              </div>

              <span className="ml-3 shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                To Do
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            DAILY HOURS
            =================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <h3 className="mb-3 text-[14px] font-bold text-slate-900">
            Daily Hours (This Week)
          </h3>

          {/* Chart */}
          <div className="flex h-[160px] items-end justify-center">
            <div className="flex h-[155px] w-full max-w-[330px] items-end justify-between gap-2 px-5">
              {/* Monday */}
              <div className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-2 text-[10px] font-medium text-slate-500">
                  3.5h
                </span>

                <div
                  className="w-full max-w-[38px] rounded-t-lg bg-teal-100"
                  style={{ height: "55px" }}
                />

                <span className="mt-2 text-[10px] font-medium text-slate-400">
                  Mon
                </span>
              </div>

              {/* Tuesday */}
              <div className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-2 text-[10px] font-medium text-slate-500">
                  5h
                </span>

                <div
                  className="w-full max-w-[38px] rounded-t-lg bg-teal-100"
                  style={{ height: "78px" }}
                />

                <span className="mt-2 text-[10px] font-medium text-slate-400">
                  Tue
                </span>
              </div>

              {/* Wednesday */}
              <div className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-2 text-[10px] font-medium text-slate-500">
                  4.5h
                </span>

                <div
                  className="w-full max-w-[38px] rounded-t-lg bg-teal-100"
                  style={{ height: "68px" }}
                />

                <span className="mt-2 text-[10px] font-medium text-slate-400">
                  Wed
                </span>
              </div>

              {/* Thursday */}
              <div className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-2 text-[10px] font-medium text-slate-500">
                  6.5h
                </span>

                <div
                  className="w-full max-w-[38px] rounded-t-lg bg-teal-100"
                  style={{ height: "100px" }}
                />

                <span className="mt-2 text-[10px] font-medium text-slate-400">
                  Thu
                </span>
              </div>

              {/* Friday */}
              <div className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-2 text-[10px] font-medium text-slate-500">
                  6h
                </span>

                <div
                  className="w-full max-w-[38px] rounded-t-lg bg-teal-300"
                  style={{ height: "92px" }}
                />

                <span className="mt-2 text-[10px] font-medium text-slate-400">
                  Fri
                </span>
              </div>
            </div>
          </div>

          {/* Week Total */}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
            <span className="text-[12px] font-medium text-slate-400">
              Week Total
            </span>

            <span className="text-[17px] font-semibold text-teal-500">
              18h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboardView;