import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

interface Sprint {
  project: string;
  sprint: string;
  done: number;
  inProgress: number;
  todo: number;
  completion: number;
  barColor: string;
  textColor: string;
}

interface ScrumDashboardResponse {
  sprintName: string;
  projectName: string;
  tasksCompleted: number;
  totalTasks: number;
  completionPercentage: number;
}

const API_URL =
  'http://localhost:8080/api/viewer/sprint-status';


// =====================================================
// GET AUTH TOKEN
// =====================================================

function getAuthToken(): string | null {
  const keys = [
    'token',
    'accessToken',
    'jwtToken',
    'authToken',
  ];

  for (const key of keys) {

    const localToken =
      localStorage.getItem(key);

    if (localToken) {
      return localToken;
    }

    const sessionToken =
      sessionStorage.getItem(key);

    if (sessionToken) {
      return sessionToken;
    }
  }

  return null;
}


// =====================================================
// GET BAR COLOR
// =====================================================

function getBarColor(
  completion: number
): string {

  if (completion >= 70) {
    return 'bg-emerald-500';
  }

  if (completion >= 40) {
    return 'bg-amber-500';
  }

  return 'bg-purple-400';
}


// =====================================================
// GET TEXT COLOR
// =====================================================

function getTextColor(
  completion: number
): string {

  if (completion >= 70) {
    return 'text-emerald-500';
  }

  if (completion >= 40) {
    return 'text-amber-500';
  }

  return 'text-purple-400';
}


// =====================================================
// COMPONENT
// =====================================================

export const ViewerSprintStatus: React.FC = () => {

  const [sprints, setSprints] =
    useState<Sprint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


// =====================================================
// LOAD SPRINT STATUS
// =====================================================

  const loadSprintStatus = async () => {

    try {

      setError('');

      const token =
        getAuthToken();

      if (!token) {
        throw new Error(
          'Authentication token not found. Please log in again.'
        );
      }


      const response =
        await fetch(
          API_URL,
          {
            method: 'GET',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      // -----------------------------------------------
      // AUTH ERROR
      // -----------------------------------------------

      if (
        response.status === 401 ||
        response.status === 403
      ) {

        throw new Error(
          'Access denied. Please log in again.'
        );
      }


      // -----------------------------------------------
      // OTHER ERROR
      // -----------------------------------------------

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          errorText ||
          `Failed to load sprint status (${response.status})`
        );
      }


      // -----------------------------------------------
      // READ BACKEND DATA
      // -----------------------------------------------

      const data:
        ScrumDashboardResponse =
        await response.json();


      console.log(
        'Viewer Sprint Status:',
        data
      );


      // -----------------------------------------------
      // CALCULATE REMAINING TASKS
      // -----------------------------------------------

      const remainingTasks =
        Math.max(
          0,
          (data.totalTasks || 0) -
          (data.tasksCompleted || 0)
        );


      // -----------------------------------------------
      // CREATE VIEWER SPRINT
      // -----------------------------------------------

      const sprint: Sprint = {

        project:
          data.projectName,

        sprint:
          data.sprintName,

        done:
          data.tasksCompleted || 0,

        /*
         * The current ScrumDashboardDto does not provide
         * a separate In Progress count.
         *
         * Therefore we do not invent a value here.
         */
        inProgress: 0,

        /*
         * Remaining tasks are shown as To Do because
         * the existing Scrum Master DTO only provides
         * completed and total task counts.
         */
        todo:
          remainingTasks,

        completion:
          data.completionPercentage || 0,

        barColor:
          getBarColor(
            data.completionPercentage || 0
          ),

        textColor:
          getTextColor(
            data.completionPercentage || 0
          ),
      };


      setSprints([sprint]);

    } catch (err) {

      console.error(
        'Error loading sprint status:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load sprint status'
      );

    } finally {

      setLoading(false);
    }
  };


// =====================================================
// INITIAL LOAD + REAL-TIME REFRESH
// =====================================================

  useEffect(() => {

    loadSprintStatus();


    // Refresh every 5 seconds
    const interval =
      setInterval(
        loadSprintStatus,
        5000
      );


    return () => {
      clearInterval(interval);
    };

  }, []);


// =====================================================
// UI
// =====================================================

  return (
    <div className="w-full min-w-0 space-y-5">


      {/* =====================================================
          READ-ONLY ACCESS BANNER
          ===================================================== */}

      <section className="w-full rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-3.5 sm:px-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-start gap-3 text-xs font-semibold leading-5 text-slate-600 sm:items-center">

            <Eye
              size={16}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-slate-500 sm:mt-0"
            />

            <span>
              You have read-only access. To request additional permissions,
              contact your Admin.
            </span>

          </div>


          <button
            type="button"
            className="w-full shrink-0 rounded-xl border border-slate-200 bg-slate-200/70 px-4 py-2 text-xs font-bold text-slate-700 transition-colors duration-200 hover:bg-slate-300 sm:w-auto"
          >
            Request Access
          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">

          <p className="text-sm font-medium text-red-500">
            {error}
          </p>

        </section>

      )}


      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (

        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

          <p className="text-sm font-medium text-slate-400">
            Loading sprint status...
          </p>

        </section>

      )}


      {/* =====================================================
          SPRINT CARDS
          ===================================================== */}

      {!loading && !error && (

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          {sprints.map((sprint) => (

            <article
              key={`${sprint.project}-${sprint.sprint}`}
              className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6"
            >

              {/* Project name */}

              <div className="mb-5">

                <p className="mb-1 text-xs font-medium text-slate-400">
                  {sprint.project}
                </p>

                <h2 className="text-[17px] font-extrabold leading-tight text-slate-900 sm:text-[18px]">
                  {sprint.sprint}
                </h2>

              </div>


              {/* =================================================
                  TASK COUNTS
                  ================================================= */}

              <div className="grid grid-cols-3 gap-2 sm:gap-3">


                {/* Done */}

                <div className="flex min-h-[60px] flex-col items-center justify-center rounded-xl bg-slate-50 px-2 py-3">

                  <span className="text-xl font-black leading-none text-emerald-500">
                    {sprint.done}
                  </span>

                  <span className="mt-1 text-[10px] font-medium text-slate-400 sm:text-[11px]">
                    Done
                  </span>

                </div>


                {/* In Progress */}

                <div className="flex min-h-[60px] flex-col items-center justify-center rounded-xl bg-slate-50 px-2 py-3">

                  <span className="text-xl font-black leading-none text-amber-500">
                    {sprint.inProgress}
                  </span>

                  <span className="mt-1 text-[10px] font-medium text-slate-400 sm:text-[11px]">
                    In Progress
                  </span>

                </div>


                {/* To Do */}

                <div className="flex min-h-[60px] flex-col items-center justify-center rounded-xl bg-slate-50 px-2 py-3">

                  <span className="text-xl font-black leading-none text-slate-400">
                    {sprint.todo}
                  </span>

                  <span className="mt-1 text-[10px] font-medium text-slate-400 sm:text-[11px]">
                    To Do
                  </span>

                </div>

              </div>


              {/* =================================================
                  SPRINT COMPLETION
                  ================================================= */}

              <div className="mt-5">

                <div className="mb-2 flex items-center justify-between gap-3">

                  <span className="text-xs font-medium text-slate-500">
                    Sprint Completion
                  </span>

                  <span
                    className={`shrink-0 text-sm font-extrabold ${sprint.textColor}`}
                  >
                    {sprint.completion}%
                  </span>

                </div>


                {/* Progress Bar */}

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">

                  <div
                    className={`h-full rounded-full transition-all duration-500 ${sprint.barColor}`}
                    style={{
                      width:
                        `${Math.min(
                          100,
                          Math.max(
                            0,
                            sprint.completion
                          )
                        )}%`,
                    }}
                  />

                </div>

              </div>

            </article>

          ))}

        </section>

      )}

    </div>
  );
};


export default ViewerSprintStatus;