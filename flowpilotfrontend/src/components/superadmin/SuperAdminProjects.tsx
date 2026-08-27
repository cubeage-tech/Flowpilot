import React, { useEffect, useState } from 'react';

interface Project {
  code: string;
  name: string;
  manager: string;
  status: 'In Progress' | 'Planning' | 'On Hold';
  sprint: string;
  startDate: string;
  endDate: string;
  progress: number;
  health: 'On Track' | 'At Risk' | 'Delayed' | 'On Hold';
}

/*
 * This is the exact structure returned by the Spring Boot backend.
 *
 * Backend:
 * PMProject
 */
interface BackendProject {
  id: number;
  projectCode: string;
  projectName: string;
  sprint: string | null;
  team: string | null;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  progress: number | null;
}

/*
 * Convert backend PMProject into the structure
 * already used by the SuperAdmin UI.
 */
const convertBackendProject = (
  project: BackendProject
): Project => {
  const backendStatus = project.status || 'Planning';

  let status: Project['status'];

  if (backendStatus === 'In Progress') {
    status = 'In Progress';
  } else if (backendStatus === 'On Hold') {
    status = 'On Hold';
  } else {
    status = 'Planning';
  }

  /*
   * Health is not currently stored in PMProject.
   * Therefore we derive it from status/progress.
   */
  let health: Project['health'] = 'On Track';

  const progress = project.progress ?? 0;

  if (status === 'On Hold') {
    health = 'On Hold';
  } else if (progress < 30) {
    health = 'At Risk';
  } else if (progress < 50) {
    health = 'At Risk';
  } else {
    health = 'On Track';
  }

  return {
    code: project.projectCode,
    name: project.projectName,
    manager: project.team || '—',
    status,
    sprint: project.sprint || '—',
    startDate: project.startDate || '',
    endDate: project.endDate || '',
    progress,
    health,
  };
};

const statusClasses: Record<Project['status'], string> = {
  'In Progress': 'bg-slate-100 text-slate-600',
  Planning: 'bg-slate-100 text-slate-600',
  'On Hold': 'bg-slate-100 text-slate-600',
};

const healthClasses: Record<Project['health'], string> = {
  'On Track':
    'border border-emerald-100 bg-emerald-50 text-emerald-600',

  'At Risk':
    'border border-amber-100 bg-amber-50 text-amber-600',

  Delayed:
    'border border-rose-100 bg-rose-50 text-rose-500',

  'On Hold':
    'border border-slate-200 bg-slate-50 text-slate-500',
};

const formatProjectDate = (date: string) => {
  if (!date) return '—';

  const [year, month, day] = date.split('-').map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const SuperAdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  /*
   * LOAD PROJECTS FROM BACKEND
   *
   * This is the important change.
   *
   * PM creates:
   * POST /api/pm/projects
   *
   * SuperAdmin reads:
   * GET /api/superadmin/projects
   */
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

const response = await fetch(
  'http://localhost:8080/api/superadmin/projects',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
);

      if (!response.ok) {
        throw new Error(
          `Failed to load projects (${response.status})`
        );
      }

      const data: BackendProject[] = await response.json();

      const convertedProjects = data.map(
        (project: BackendProject) =>
          convertBackendProject(project)
      );

      setProjects(convertedProjects);
    } catch (err) {
      console.error('Error loading projects:', err);

      setError(
        'Unable to load projects from the server.'
      );

      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load projects when SuperAdmin Projects page opens.
   */
  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <style>{`
        .projects-scroll {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .projects-scroll::-webkit-scrollbar {
          height: 6px;
        }

        .projects-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .projects-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }
      `}</style>

      <div className="w-full">

        {/* HEADER / REFRESH */}
        <div className="mb-[14px] flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">
              Projects
            </h2>

            <p className="mt-[3px] text-[11px] text-slate-400">
              Projects created by Project Managers
            </p>
          </div>

          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="
              h-[40px]
              rounded-[9px]
              border
              border-slate-200
              bg-white
              px-[15px]
              text-[11px]
              font-bold
              text-slate-600
              shadow-sm
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div
            className="
              mb-[14px]
              rounded-[10px]
              border
              border-rose-100
              bg-rose-50
              px-[14px]
              py-[12px]
              text-[12px]
              font-medium
              text-rose-600
            "
          >
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div
            className="
              rounded-[16px]
              border
              border-slate-200/80
              bg-white
              px-[20px]
              py-[55px]
              text-center
              shadow-[0_2px_7px_rgba(15,23,42,0.04)]
            "
          >
            <p className="text-[13px] font-bold text-slate-600">
              Loading projects...
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Fetching projects from the server.
            </p>
          </div>
        )}

        {/* DESKTOP TABLE */}
        {!loading && (
          <div
            className="
              hidden
              md:block
              w-full
              overflow-hidden
              rounded-[16px]
              border
              border-slate-200/80
              bg-white
              shadow-[0_2px_7px_rgba(15,23,42,0.04)]
            "
          >
            <div className="projects-scroll w-full overflow-x-auto">

              <table className="w-full min-w-[1260px] border-collapse">

                <colgroup>
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '7%' }} />
                </colgroup>

                <thead>
                  <tr className="border-b border-slate-100">

                    {[
                      'CODE',
                      'PROJECT NAME',
                      'PROJECT MANAGER',
                      'STATUS',
                      'ACTIVE SPRINT',
                      'START DATE',
                      'END DATE',
                      'PROGRESS',
                      'HEALTH',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="
                          h-[50px]
                          px-[20px]
                          text-left
                          align-middle
                          text-[10px]
                          font-bold
                          tracking-[0.04em]
                          text-slate-500
                          whitespace-nowrap
                        "
                      >
                        {heading}
                      </th>
                    ))}

                  </tr>
                </thead>

                <tbody>

                  {projects.map((project) => (
                    <tr
                      key={project.code}
                      className="
                        border-b
                        border-slate-100
                        last:border-b-0
                        transition-colors
                        hover:bg-slate-50/40
                      "
                    >

                      {/* CODE */}
                      <td
                        className="
                          h-[61px]
                          px-[20px]
                          align-middle
                          text-[13px]
                          font-medium
                          text-slate-400
                          whitespace-nowrap
                        "
                      >
                        {project.code}
                      </td>

                      {/* PROJECT NAME */}
                      <td
                        className="
                          h-[61px]
                          px-[20px]
                          align-middle
                          text-[13px]
                          font-bold
                          text-slate-900
                          whitespace-nowrap
                        "
                      >
                        {project.name}
                      </td>

                      {/* MANAGER / TEAM */}
                      <td
                        className="
                          h-[61px]
                          px-[20px]
                          align-middle
                          text-[13px]
                          font-medium
                          text-slate-500
                          whitespace-nowrap
                        "
                      >
                        {project.manager}
                      </td>

                      {/* STATUS */}
                      <td className="h-[61px] px-[20px] align-middle">
                        <span
                          className={`
                            inline-flex
                            items-center
                            rounded-[8px]
                            px-[10px]
                            py-[4px]
                            text-[10px]
                            font-bold
                            leading-[15px]
                            whitespace-nowrap
                            ${statusClasses[project.status]}
                          `}
                        >
                          {project.status}
                        </span>
                      </td>

                      {/* SPRINT */}
                      <td
                        className="
                          h-[61px]
                          px-[20px]
                          align-middle
                          text-[13px]
                          font-medium
                          text-slate-500
                          whitespace-nowrap
                        "
                      >
                        {project.sprint}
                      </td>

                      {/* START DATE */}
                      <td
                        className="
                          h-[61px]
                          px-[20px]
                          align-middle
                          text-[13px]
                          font-medium
                          text-slate-400
                          whitespace-nowrap
                        "
                      >
                        {formatProjectDate(
                          project.startDate
                        )}
                      </td>

                      {/* END DATE */}
                      <td
                        className="
                          h-[61px]
                          px-[20px]
                          align-middle
                          text-[13px]
                          font-medium
                          text-slate-400
                          whitespace-nowrap
                        "
                      >
                        {formatProjectDate(
                          project.endDate
                        )}
                      </td>

                      {/* PROGRESS */}
                      <td className="h-[61px] px-[20px] align-middle">

                        <div className="w-[120px]">

                          <div
                            className="
                              mb-[5px]
                              text-[10px]
                              font-medium
                              text-slate-500
                            "
                          >
                            {project.progress}%
                          </div>

                          <div
                            className="
                              h-[5px]
                              w-full
                              overflow-hidden
                              rounded-full
                              bg-slate-100
                            "
                          >
                            <div
                              className={`
                                h-full
                                rounded-full
                                transition-all
                                ${
                                  project.health ===
                                  'At Risk'
                                    ? 'bg-amber-500'
                                    : project.health ===
                                        'Delayed'
                                      ? 'bg-rose-500'
                                      : 'bg-emerald-500'
                                }
                              `}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    project.progress
                                  )
                                )}%`,
                              }}
                            />
                          </div>

                        </div>

                      </td>

                      {/* HEALTH */}
                      <td className="h-[61px] px-[20px] align-middle">

                        <span
                          className={`
                            inline-flex
                            items-center
                            rounded-[8px]
                            px-[10px]
                            py-[4px]
                            text-[10px]
                            font-bold
                            leading-[15px]
                            whitespace-nowrap
                            ${healthClasses[project.health]}
                          `}
                        >
                          {project.health}
                        </span>

                      </td>

                    </tr>
                  ))}

                  {/* EMPTY */}
                  {projects.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-[55px] text-center"
                      >
                        <p
                          className="
                            text-[13px]
                            font-bold
                            text-slate-600
                          "
                        >
                          No projects found
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            text-slate-400
                          "
                        >
                          Projects created by Project
                          Managers will appear here.
                        </p>
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          </div>
        )}

        {/* MOBILE CARDS */}
        {!loading && (
          <div className="md:hidden space-y-3">

            {projects.length === 0 ? (
              <div
                className="
                  rounded-[14px]
                  border
                  border-dashed
                  border-slate-200
                  bg-white
                  p-8
                  text-center
                "
              >
                <p className="text-[13px] font-bold text-slate-600">
                  No projects found
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  Projects created by Project Managers
                  will appear here.
                </p>
              </div>
            ) : (
              projects.map((project) => (

                <div
                  key={project.code}
                  className="
                    rounded-[14px]
                    border
                    border-slate-200/80
                    bg-white
                    p-4
                    shadow-sm
                  "
                >

                  <div
                    className="
                      mb-3
                      flex
                      items-start
                      justify-between
                      gap-2
                    "
                  >

                    <div className="min-w-0">

                      <p
                        className="
                          mb-0.5
                          font-mono
                          text-[10px]
                          text-slate-400
                        "
                      >
                        {project.code}
                      </p>

                      <p
                        className="
                          text-[13px]
                          font-bold
                          leading-tight
                          text-slate-900
                        "
                      >
                        {project.name}
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[11px]
                          text-slate-500
                        "
                      >
                        {project.manager}
                      </p>

                    </div>

                    <span
                      className={`
                        inline-flex
                        shrink-0
                        items-center
                        rounded-[8px]
                        px-[10px]
                        py-[4px]
                        text-[10px]
                        font-bold
                        whitespace-nowrap
                        ${healthClasses[project.health]}
                      `}
                    >
                      {project.health}
                    </span>

                  </div>

                  <div
                    className="
                      mb-3
                      grid
                      grid-cols-2
                      gap-2
                      text-[11px]
                      text-slate-500
                    "
                  >

                    <div>
                      <span className="text-slate-400">
                        Sprint:{' '}
                      </span>
                      {project.sprint}
                    </div>

                    <div>
                      <span className="text-slate-400">
                        Status:{' '}
                      </span>
                      {project.status}
                    </div>

                    <div>
                      <span className="text-slate-400">
                        Start:{' '}
                      </span>
                      {formatProjectDate(
                        project.startDate
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400">
                        End:{' '}
                      </span>
                      {formatProjectDate(
                        project.endDate
                      )}
                    </div>

                  </div>

                  <div>

                    <div
                      className="
                        mb-1
                        flex
                        items-center
                        justify-between
                      "
                    >
                      <span
                        className="
                          text-[10px]
                          text-slate-400
                        "
                      >
                        Progress
                      </span>

                      <span
                        className="
                          text-[10px]
                          font-semibold
                          text-slate-600
                        "
                      >
                        {project.progress}%
                      </span>
                    </div>

                    <div
                      className="
                        h-[5px]
                        w-full
                        overflow-hidden
                        rounded-full
                        bg-slate-100
                      "
                    >
                      <div
                        className={`
                          h-full
                          rounded-full
                          ${
                            project.health ===
                            'At Risk'
                              ? 'bg-amber-500'
                              : project.health ===
                                  'Delayed'
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                          }
                        `}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              project.progress
                            )
                          )}%`,
                        }}
                      />
                    </div>

                  </div>

                </div>

              ))
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default SuperAdminProjects;