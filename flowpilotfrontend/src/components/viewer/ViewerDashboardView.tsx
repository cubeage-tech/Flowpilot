import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  pm: string;
  sprint: string;
  pct: number;
  status: string;
  barColor: string;
  textColor: string;
  badgeColor: string;
}

interface PMProject {
  id: number;
  projectCode: string;
  projectName: string;
  sprint: string;
  status: string;
  progress: number;
  teamMemberIds?: number[];
}

/* =========================================================
   API
========================================================= */

const API_URL = 'http://localhost:8080/api/pm/projects';

/* =========================================================
   AUTH TOKEN
========================================================= */

function getAuthToken(): string | null {
  const keys = [
    'token',
    'accessToken',
    'jwtToken',
    'authToken',
  ];

  for (const key of keys) {
    const localToken = localStorage.getItem(key);

    if (localToken) {
      return localToken;
    }

    const sessionToken = sessionStorage.getItem(key);

    if (sessionToken) {
      return sessionToken;
    }
  }

  return null;
}

export const ViewerDashboardView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();

        if (!token) {
          throw new Error(
            'Authentication token not found. Please log in again.'
          );
        }

        /*
         * Fetch projects from the existing Project Manager API.
         * The same JWT authentication pattern is used by PMProjects.tsx.
         */
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Access denied (403). Please log in again.'
          );
        }

        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(
            errorText ||
              `Failed to load projects (${response.status})`
          );
        }

        const data: PMProject[] = await response.json();

        const formattedProjects: Project[] = data.map((project) => {
          const status = project.status || 'Unknown';

          const progress = Math.min(
            100,
            Math.max(0, project.progress ?? 0)
          );

          let barColor = 'bg-emerald-500';
          let textColor = 'text-emerald-500';
          let badgeColor =
            'border-emerald-200 bg-emerald-50 text-emerald-600';

          const statusLower = status.toLowerCase();

          if (statusLower.includes('risk')) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-500';
            badgeColor =
              'border-amber-200 bg-amber-50 text-amber-600';
          } else if (statusLower.includes('delay')) {
            barColor = 'bg-rose-500';
            textColor = 'text-rose-500';
            badgeColor =
              'border-rose-200 bg-rose-50 text-rose-600';
          }

          return {
            id: project.projectCode,
            name: project.projectName,

            /*
             * PM name is not part of the current PMProjectDto,
             * so keep the existing display format.
             */
            pm: `— · ${project.teamMemberIds?.length ?? 0} members`,

            sprint: project.sprint || 'No Sprint',
            pct: progress,
            status,
            barColor,
            textColor,
            badgeColor,
          };
        });

        setProjects(formattedProjects);
      } catch (err) {
        console.error('Error fetching projects:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load projects'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <p className="text-sm font-semibold text-slate-500">
          Loading projects...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <p className="text-sm font-semibold text-rose-500">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5 max-sm:space-y-3">

      {/* READ-ONLY ACCESS BANNER */}
      <section
        className="
          w-full
          rounded-2xl
          border border-slate-200
          bg-slate-100/70
          px-4 py-4
          sm:px-5
          max-sm:rounded-xl
          max-sm:px-3
          max-sm:py-2.5
        "
      >
        <div
          className="
            flex flex-col gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
            max-sm:gap-2
          "
        >
          <div
            className="
              flex min-w-0 items-start gap-3
              text-xs font-semibold leading-5
              text-slate-600
              sm:items-center
              max-sm:gap-2
              max-sm:text-[10px]
              max-sm:leading-4
            "
          >
            <Eye
              size={17}
              strokeWidth={2}
              className="
                mt-0.5 shrink-0
                text-slate-500
                sm:mt-0
                max-sm:h-3.5
                max-sm:w-3.5
              "
            />

            <span>
              You have read-only access. To request additional
              permissions, contact your Admin.
            </span>
          </div>

          <button
            type="button"
            className="
              w-full shrink-0
              rounded-xl
              border border-slate-200
              bg-slate-200/70
              px-4 py-2
              text-xs font-bold
              text-slate-700
              transition-colors duration-200
              hover:bg-slate-300
              focus:outline-none
              focus:ring-2
              focus:ring-slate-300
              sm:w-auto
              max-sm:rounded-lg
              max-sm:px-3
              max-sm:py-1.5
              max-sm:text-[10px]
            "
          >
            Request Access
          </button>
        </div>
      </section>

      {/* STATISTICS CARDS */}
      <section
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-3
          max-sm:grid-cols-3
          max-sm:gap-2
        "
      >
        {/* Total Projects */}
        <div
          className="
            min-w-0
            rounded-2xl
            border border-slate-200/80
            bg-white
            p-5
            shadow-sm
            max-sm:rounded-xl
            max-sm:p-2.5
          "
        >
          <div
            className="
              mb-2
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.12em]
              text-slate-400
              sm:text-[11px]
              max-sm:mb-1
              max-sm:text-[7px]
              max-sm:tracking-[0.05em]
            "
          >
            Total
          </div>

          <div
            className="
              text-3xl
              font-black
              leading-none
              text-slate-900
              sm:text-[30px]
              max-sm:text-[20px]
            "
          >
            {projects.length}
          </div>
        </div>

        {/* Active / In Progress */}
        <div
          className="
            min-w-0
            rounded-2xl
            border border-slate-200/80
            bg-white
            p-5
            shadow-sm
            max-sm:rounded-xl
            max-sm:p-2.5
          "
        >
          <div
            className="
              mb-2
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.12em]
              text-slate-400
              sm:text-[11px]
              max-sm:mb-1
              max-sm:text-[7px]
              max-sm:tracking-[0.03em]
            "
          >
            Active
          </div>

          <div
            className="
              text-3xl
              font-black
              leading-none
              text-emerald-500
              sm:text-[30px]
              max-sm:text-[20px]
            "
          >
            {
              projects.filter(
                (project) =>
                  !['completed', 'done'].includes(
                    project.status.toLowerCase()
                  )
              ).length
            }
          </div>
        </div>

        {/* Teams Involved */}
        <div
          className="
            min-w-0
            rounded-2xl
            border border-slate-200/80
            bg-white
            p-5
            shadow-sm
            sm:col-span-2
            xl:col-span-1
            max-sm:col-span-1
            max-sm:rounded-xl
            max-sm:p-2.5
          "
        >
          <div
            className="
              mb-2
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.12em]
              text-slate-400
              sm:text-[11px]
              max-sm:mb-1
              max-sm:text-[7px]
              max-sm:tracking-[0.05em]
            "
          >
            Teams
          </div>

          <div
            className="
              text-3xl
              font-black
              leading-none
              text-slate-900
              sm:text-[30px]
              max-sm:text-[20px]
            "
          >
            {
              new Set(
                projects.flatMap(() => [])
              ).size
            }
          </div>
        </div>
      </section>

      {/* PROJECT LIST */}
      <section className="space-y-4 max-sm:space-y-2.5">

        {projects.map((project) => (
          <article
            key={project.id}
            className="
              w-full
              overflow-hidden
              rounded-2xl
              border border-slate-200/80
              bg-white
              p-4
              shadow-sm
              transition-all duration-200
              hover:shadow-md
              sm:p-5
              max-sm:rounded-xl
              max-sm:p-3
            "
          >
            {/* PROJECT INFORMATION */}
            <div
              className="
                flex
                flex-col
                gap-4
                xl:flex-row
                xl:items-center
                xl:justify-between
                max-sm:gap-2.5
              "
            >

              {/* Project Details */}
              <div className="min-w-0 flex-1">

                <div
                  className="
                    mb-1
                    text-[9px]
                    font-extrabold
                    uppercase
                    tracking-[0.12em]
                    text-slate-400
                    sm:text-[10px]
                    max-sm:mb-0.5
                    max-sm:text-[8px]
                  "
                >
                  {project.id}
                </div>

                <h3
                  className="
                    truncate
                    text-[15px]
                    font-extrabold
                    leading-6
                    text-slate-900
                    sm:text-[16px]
                    max-sm:text-[13px]
                    max-sm:leading-5
                  "
                >
                  {project.name}
                </h3>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-xs
                    text-slate-400
                    max-sm:mt-0
                    max-sm:text-[9px]
                  "
                >
                  PM: {project.pm}
                </p>
              </div>

              {/* PROGRESS + STATUS */}
              <div
                className="
                  flex
                  w-full
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:gap-5
                  xl:w-[420px]
                  xl:shrink-0
                  max-sm:flex-row
                  max-sm:items-center
                  max-sm:gap-2
                "
              >

                {/* Progress */}
                <div className="min-w-0 flex-1">

                  <div
                    className="
                      mb-1.5
                      flex
                      items-center
                      justify-between
                      text-xs
                      font-bold
                      max-sm:mb-1
                      max-sm:text-[9px]
                    "
                  >
                    <span className="text-slate-400">
                      {project.sprint}
                    </span>

                    <span className={project.textColor}>
                      {project.pct}%
                    </span>
                  </div>

                  <div
                    className="
                      h-2
                      w-full
                      overflow-hidden
                      rounded-full
                      bg-slate-100
                      max-sm:h-1.5
                    "
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${project.barColor}`}
                      style={{
                        width: `${project.pct}%`,
                      }}
                    />
                  </div>

                </div>

                {/* Status */}
                <div className="flex shrink-0 sm:justify-end">
                  <span
                    className={`
                      inline-flex
                      items-center
                      justify-center
                      rounded-full
                      border
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      sm:text-[11px]
                      max-sm:px-2
                      max-sm:py-1
                      max-sm:text-[8px]
                      ${project.badgeColor}
                    `}
                  >
                    {project.status}
                  </span>
                </div>

              </div>
            </div>
          </article>
        ))}

      </section>
    </div>
  );
};

export default ViewerDashboardView;