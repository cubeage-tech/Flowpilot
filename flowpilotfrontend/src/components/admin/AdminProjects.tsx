import React, { useEffect, useMemo, useState } from "react";

interface AdminProject {
  id: number;
  projectCode: string;
  projectName: string;
  sprint?: string | null;
  team?: string | null;
  budget?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  progress?: number | null;
}

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem('token');

const response = await fetch(
  'http://localhost:8080/api/admin/projects',
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
            `Failed to load projects. Server returned ${response.status}.`
          );
        }

        const data: AdminProject[] = await response.json();

        setProjects(data);
      } catch (err) {
        console.error("Error loading admin projects:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load projects."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  /* ============================================================
     PROJECT STATUS
  ============================================================ */

  const getStatus = (status?: string | null) => {
    if (!status) {
      return "On Track";
    }

    const value = status.toLowerCase().trim();

    if (
      value.includes("risk") ||
      value.includes("blocked") ||
      value.includes("at risk")
    ) {
      return "At Risk";
    }

    if (
      value.includes("delay") ||
      value.includes("delayed")
    ) {
      return "Delayed";
    }

    return "On Track";
  };

  /* ============================================================
     SUMMARY COUNTS
  ============================================================ */

  const totalProjects = projects.length;

  const inProgressProjects = useMemo(() => {
    return projects.filter((project) => {
      const status = project.status?.toLowerCase().trim();

      return (
        status === "in progress" ||
        status === "in-progress" ||
        status === "active" ||
        status === "ongoing"
      );
    }).length;
  }, [projects]);

  const atRiskProjects = useMemo(() => {
    return projects.filter((project) => {
      const status = project.status?.toLowerCase().trim();

      return (
        status?.includes("risk") ||
        status?.includes("blocked")
      );
    }).length;
  }, [projects]);

  /* ============================================================
     HELPERS
  ============================================================ */

  const getProgress = (progress?: number | null) => {
    if (progress === null || progress === undefined) {
      return 0;
    }

    return Math.min(100, Math.max(0, Number(progress)));
  };

  const getStatusClasses = (status?: string | null) => {
    const currentStatus = getStatus(status);

    if (currentStatus === "At Risk") {
      return {
        badge: "bg-[#fff1f1] text-[#ff4d4d]",
        dot: "bg-[#ff4d4d]",
      };
    }

    if (currentStatus === "Delayed") {
      return {
        badge: "bg-[#fff7e8] text-[#e99a00]",
        dot: "bg-[#e99a00]",
      };
    }

    return {
      badge: "bg-[#eafaf2] text-[#20c978]",
      dot: "bg-[#20c978]",
    };
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="w-full bg-[#f5f6f8] px-6 py-5">
        <div className="mb-6">
          <h1 className="text-[17px] font-bold leading-[20px] text-[#111827]">
            Projects
          </h1>

          <p className="mt-[2px] text-[10px] leading-[14px] text-[#9aa1ad]">
            Projects created by Project Managers
          </p>
        </div>

        <div className="rounded-xl border border-[#eeeeee] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center py-10">
            <p className="text-[11px] text-[#9aa1ad]">
              Loading projects...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (error) {
    return (
      <div className="w-full bg-[#f5f6f8] px-6 py-5">
        <div className="mb-6">
          <h1 className="text-[17px] font-bold leading-[20px] text-[#111827]">
            Projects
          </h1>

          <p className="mt-[2px] text-[10px] leading-[14px] text-[#9aa1ad]">
            Projects created by Project Managers
          </p>
        </div>

        <div className="rounded-xl border border-[#eeeeee] bg-white p-6 shadow-sm">
          <div className="rounded-lg border border-[#ffd4d4] bg-[#fff5f5] px-4 py-3">
            <p className="text-[11px] font-semibold text-[#ff4d4d]">
              Unable to load projects
            </p>

            <p className="mt-1 text-[10px] text-[#9a6b6b]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-md bg-[#20c978] px-3 py-1.5 text-[10px] font-semibold text-white transition hover:opacity-90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN PAGE
  ============================================================ */

  return (
    <div className="w-full bg-[#f5f6f8] px-6 py-5">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="mb-6">
        <h1 className="text-[17px] font-bold leading-[20px] text-[#111827]">
          Projects
        </h1>

        <p className="mt-[2px] text-[10px] leading-[14px] text-[#9aa1ad]">
          Projects created by Project Managers
        </p>
      </div>

      {/* ========================================================
          SUMMARY CARDS
      ======================================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

        {/* TOTAL PROJECTS */}

        <div className="rounded-xl border border-[#eeeeee] bg-white px-5 py-4 shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7c8796]">
            Total Projects
          </p>

          <p className="mt-3 text-[25px] font-semibold leading-none text-[#111827]">
            {totalProjects}
          </p>

          <p className="mt-3 text-[10px] font-medium text-[#32d583]">
            All PM projects
          </p>
        </div>

        {/* IN PROGRESS */}

        <div className="rounded-xl border border-[#eeeeee] bg-white px-5 py-4 shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7c8796]">
            In Progress
          </p>

          <p className="mt-3 text-[25px] font-semibold leading-none text-[#111827]">
            {inProgressProjects}
          </p>

          <p className="mt-3 text-[10px] font-medium text-[#32d583]">
            Active projects
          </p>
        </div>

        {/* BLOCKED / AT RISK */}

        <div className="rounded-xl border border-[#eeeeee] bg-white px-5 py-4 shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7c8796]">
            Blocked / At Risk
          </p>

          <p className="mt-3 text-[25px] font-semibold leading-none text-[#111827]">
            {atRiskProjects}
          </p>

          <p className="mt-3 text-[10px] font-medium text-[#ff3b3b]">
            Requires attention
          </p>
        </div>
      </div>

      {/* ========================================================
          PROJECT LIST
      ======================================================== */}

      <div className="mt-5 overflow-hidden rounded-xl border border-[#eeeeee] bg-white shadow-sm">

        {/* HEADER */}

        <div className="px-5 pb-3 pt-5">
          <h2 className="text-[12px] font-semibold text-[#111827]">
            Project List
          </h2>
        </div>

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {projects.length === 0 ? (
          <div className="border-t border-[#eeeeee] px-5 py-12 text-center">
            <p className="text-[11px] font-semibold text-[#111827]">
              No projects found
            </p>

            <p className="mt-1 text-[9px] text-[#a1a8b3]">
              Projects created by Project Managers will appear here
              automatically.
            </p>
          </div>
        ) : (
          <>
            {/* ==================================================
                DESKTOP / TABLET LIST
            ================================================== */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-t border-b border-[#eeeeee]">
                    <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9aa1ad]">
                      Project
                    </th>

                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9aa1ad]">
                      Code
                    </th>

                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9aa1ad]">
                      Sprint
                    </th>

                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9aa1ad]">
                      Team
                    </th>

                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9aa1ad]">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9aa1ad]">
                      Progress
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {projects.map((project) => {
                    const progress = getProgress(project.progress);
                    const statusClasses = getStatusClasses(
                      project.status
                    );

                    return (
                      <tr
                        key={project.id}
                        className="border-b border-[#eeeeee] last:border-b-0"
                      >
                        {/* PROJECT */}

                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-[11px] font-semibold text-[#111827]">
                            {project.projectName}
                          </p>
                        </td>

                        {/* CODE */}

                        <td className="px-4 py-4">
                          <span className="text-[9px] font-medium text-[#7c8796]">
                            {project.projectCode || "—"}
                          </span>
                        </td>

                        {/* SPRINT */}

                        <td className="px-4 py-4">
                          <span className="text-[9px] text-[#7c8796]">
                            {project.sprint || "—"}
                          </span>
                        </td>

                        {/* TEAM */}

                        <td className="px-4 py-4">
                          <span className="text-[9px] text-[#7c8796]">
                            {project.team || "—"}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-[5px] rounded-md px-2 py-[4px] text-[9px] font-medium ${statusClasses.badge}`}
                          >
                            <span
                              className={`h-[5px] w-[5px] rounded-full ${statusClasses.dot}`}
                            />

                            {getStatus(project.status)}
                          </span>
                        </td>

                        {/* PROGRESS */}

                        <td className="min-w-[130px] px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-[#edf0f2]">
                              <div
                                className="h-full rounded-full bg-[#32d583] transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>

                            <span className="w-[28px] text-right text-[9px] font-semibold text-[#7c8796]">
                              {progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ==================================================
                MOBILE LIST
            ================================================== */}

            <div className="divide-y divide-[#eeeeee] md:hidden">
              {projects.map((project) => {
                const progress = getProgress(project.progress);
                const statusClasses = getStatusClasses(
                  project.status
                );

                return (
                  <div
                    key={project.id}
                    className="px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-[#111827]">
                          {project.projectName}
                        </p>

                        <p className="mt-1 text-[9px] text-[#9aa1ad]">
                          {project.projectCode || "No code"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-[5px] rounded-md px-2 py-[4px] text-[9px] font-medium ${statusClasses.badge}`}
                      >
                        <span
                          className={`h-[5px] w-[5px] rounded-full ${statusClasses.dot}`}
                        />

                        {getStatus(project.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.06em] text-[#a1a8b3]">
                          Sprint
                        </p>

                        <p className="mt-1 text-[9px] text-[#7c8796]">
                          {project.sprint || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] uppercase tracking-[0.06em] text-[#a1a8b3]">
                          Team
                        </p>

                        <p className="mt-1 text-[9px] text-[#7c8796]">
                          {project.team || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-[8px] uppercase tracking-[0.06em] text-[#a1a8b3]">
                          Progress
                        </p>

                        <p className="text-[9px] font-semibold text-[#7c8796]">
                          {progress}%
                        </p>
                      </div>

                      <div className="h-[5px] overflow-hidden rounded-full bg-[#edf0f2]">
                        <div
                          className="h-full rounded-full bg-[#32d583] transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProjects;