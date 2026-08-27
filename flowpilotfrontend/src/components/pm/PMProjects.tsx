import React, { useEffect, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

interface BackendProject {
  id: number;
  projectCode: string;
  projectName: string;
  sprint: string;
  budget: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  teamMemberIds: number[];
}

interface SuperAdminUser {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  status: string;
  lastLogin: string;
  initials: string;
}

export interface Project {
  backendId: number;
  id: string;
  name: string;
  status: string;
  statusColor: "green" | "yellow" | "red";
  sprint: string;
  teamMemberIds: number[];
  budget: string;
  startDate: string;
  endDate: string;
  progress: number;
}

/* =========================================================
   API
========================================================= */

const API_URL =
  "http://localhost:8080/api/pm/projects";

const SUPERADMIN_USERS_URL =
  "http://localhost:8080/api/superadmin/users";

/* =========================================================
   AUTH TOKEN
========================================================= */

function getAuthToken(): string | null {
  const keys = [
    "token",
    "accessToken",
    "jwtToken",
    "authToken",
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

/* =========================================================
   STATUS STYLES
========================================================= */

const statusStyles = {
  green: {
    badge:
      "border-green-200 bg-green-50 text-green-500",
    bar: "bg-green-400",
    percentage: "text-green-500",
    border: "border-green-100",
  },

  yellow: {
    badge:
      "border-orange-200 bg-orange-50 text-orange-500",
    bar: "bg-orange-400",
    percentage: "text-orange-500",
    border: "border-orange-100",
  },

  red: {
    badge:
      "border-red-200 bg-red-50 text-red-500",
    bar: "bg-red-400",
    percentage: "text-red-500",
    border: "border-red-100",
  },
} as const;

/* =========================================================
   STATUS COLOR
========================================================= */

function getStatusColor(
  status: string
): Project["statusColor"] {
  if (status === "At Risk") {
    return "yellow";
  }

  if (status === "Delayed") {
    return "red";
  }

  return "green";
}

/* =========================================================
   MAP BACKEND PROJECT
========================================================= */

function mapBackendProject(
  project: BackendProject
): Project {
  return {
    backendId: project.id,
    id: project.projectCode,
    name: project.projectName,
    status: project.status,
    statusColor: getStatusColor(
      project.status
    ),
    sprint: project.sprint,
    teamMemberIds:
      project.teamMemberIds || [],
    budget: project.budget,
    startDate: project.startDate,
    endDate: project.endDate,
    progress: project.progress ?? 0,
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export function PMProjects() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [
    superAdminMembers,
    setSuperAdminMembers,
  ] = useState<SuperAdminUser[]>([]);

  const [membersLoading, setMembersLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     FORM DATA
  ======================================================= */

  const [formData, setFormData] =
    useState({
      projectCode: "",
      projectName: "",
      sprint: "Sprint 1",
      teamMemberIds: [] as number[],
      budget: "",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      status: "On Track",
      progress: "0",
    });

  /* =======================================================
     LOAD SUPERADMIN USERS
  ======================================================= */

  const loadSuperAdminMembers =
    async () => {
      try {
        setMembersLoading(true);

        const token = getAuthToken();

        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }

        const response =
          await fetch(
            SUPERADMIN_USERS_URL,
            {
              method: "GET",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "Access denied while loading SuperAdmin users."
          );
        }

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            errorText ||
              `Failed to load SuperAdmin users (${response.status})`
          );
        }

        const users:
          SuperAdminUser[] =
          await response.json();

        /*
         * Only ACTIVE SuperAdmin users are
         * available for project assignment.
         */
        const activeUsers =
          users.filter(
            (user) =>
              user.status?.toUpperCase() ===
              "ACTIVE"
          );

        activeUsers.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        );

        setSuperAdminMembers(
          activeUsers
        );

        console.log(
          "SuperAdmin users loaded:",
          activeUsers
        );
      } catch (err) {
        console.error(
          "Error loading SuperAdmin users:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load SuperAdmin users"
        );
      } finally {
        setMembersLoading(false);
      }
    };

  /* =======================================================
     LOAD PROJECTS
  ======================================================= */

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please log in again."
        );
      }

      const response =
        await fetch(API_URL, {
          method: "GET",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        });

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          "Access denied (403). Please log in again."
        );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            `Failed to load projects (${response.status})`
        );
      }

      const data:
        BackendProject[] =
        await response.json();

      setProjects(
        data.map(
          mapBackendProject
        )
      );
    } catch (err) {
      console.error(
        "Error loading projects:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadProjects();
    loadSuperAdminMembers();
  }, []);

  /* =======================================================
     OPEN MODAL
  ======================================================= */

  const handleOpenModal = (
    project?: Project
  ) => {
    setError("");

    if (project) {
      setEditingId(
        project.backendId
      );

      setFormData({
        projectCode:
          project.id,

        projectName:
          project.name,

        sprint:
          project.sprint,

        teamMemberIds:
          project.teamMemberIds || [],

        budget:
          project.budget,

        startDate:
          project.startDate ||
          "2026-01-01",

        endDate:
          project.endDate ||
          "2026-06-30",

        status:
          project.status,

        progress:
          String(
            project.progress
          ),
      });
    } else {
      setEditingId(null);

      const nextNumber =
        projects.length + 1;

      setFormData({
        projectCode:
          `PRJ-${String(
            nextNumber
          ).padStart(3, "0")}`,

        projectName: "",

        sprint:
          "Sprint 1",

        teamMemberIds: [],

        budget: "",

        startDate:
          "2026-01-01",

        endDate:
          "2026-06-30",

        status:
          "On Track",

        progress:
          "0",
      });
    }

    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingId(null);
    setError("");
  };

  /* =======================================================
     NORMAL INPUT CHANGE
  ======================================================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );
  };

  /* =======================================================
     TOGGLE TEAM MEMBER
  ======================================================= */

  const handleMemberToggle = (
    employeeId: number
  ) => {
    setFormData(
      (prev) => {

        const alreadySelected =
          prev.teamMemberIds.includes(
            employeeId
          );

        if (alreadySelected) {
          return {
            ...prev,

            teamMemberIds:
              prev.teamMemberIds.filter(
                (id) =>
                  id !== employeeId
              ),
          };
        }

        return {
          ...prev,

          teamMemberIds: [
            ...prev.teamMemberIds,
            employeeId,
          ],
        };
      }
    );
  };

  /* =======================================================
     REMOVE SELECTED MEMBER
  ======================================================= */

  const removeMember = (
    employeeId: number
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        teamMemberIds:
          prev.teamMemberIds.filter(
            (id) =>
              id !== employeeId
          ),
      })
    );
  };

  /* =======================================================
     SAVE PROJECT
  ======================================================= */

  const handleSaveProject =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setError("");

      /* =========================================
         VALIDATION
      ========================================= */

      if (
        !formData.projectCode.trim()
      ) {
        setError(
          "Project Code is required."
        );
        return;
      }

      if (
        !formData.projectName.trim()
      ) {
        setError(
          "Project Name is required."
        );
        return;
      }

      if (
        formData.teamMemberIds
          .length === 0
      ) {
        setError(
          "Please select at least one team member."
        );
        return;
      }

      if (
        formData.budget.trim()
          .length === 0
      ) {
        setError(
          "Budget is required."
        );
        return;
      }

      if (!formData.startDate) {
        setError(
          "Start Date is required."
        );
        return;
      }

      if (!formData.endDate) {
        setError(
          "End Date is required."
        );
        return;
      }

      const token =
        getAuthToken();

      if (!token) {
        setError(
          "Authentication token not found. Please log in again."
        );
        return;
      }

      /* =========================================
         BACKEND DTO
      ========================================= */

      const projectData = {
        projectCode:
          formData.projectCode.trim(),

        projectName:
          formData.projectName.trim(),

        sprint:
          formData.sprint,

        budget:
          formData.budget.trim(),

        startDate:
          formData.startDate,

        endDate:
          formData.endDate,

        status:
          formData.status,

        progress:
          Math.min(
            100,
            Math.max(
              0,
              Number(
                formData.progress
              ) || 0
            )
          ),

        teamMemberIds:
          formData.teamMemberIds,
      };

      console.log(
        "Saving project:",
        projectData
      );

      try {
        setSaving(true);

        let response: Response;

        if (
          editingId !== null
        ) {
          response =
            await fetch(
              `${API_URL}/${editingId}`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                body:
                  JSON.stringify(
                    projectData
                  ),
              }
            );
        } else {
          response =
            await fetch(
              API_URL,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                body:
                  JSON.stringify(
                    projectData
                  ),
              }
            );
        }

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "Access denied (403). Please log in again."
          );
        }

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            errorText ||
              `Request failed (${response.status})`
          );
        }

        await loadProjects();

        setShowModal(false);
        setEditingId(null);

        setFormData({
          projectCode: "",
          projectName: "",
          sprint:
            "Sprint 1",
          teamMemberIds: [],
          budget: "",
          startDate:
            "2026-01-01",
          endDate:
            "2026-06-30",
          status:
            "On Track",
          progress:
            "0",
        });
      } catch (err) {
        console.error(
          "Error saving project:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to save project"
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     DELETE PROJECT
  ======================================================= */

  const handleDeleteProject =
    async () => {

      if (
        editingId === null
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this project?"
        );

      if (!confirmed) {
        return;
      }

      const token =
        getAuthToken();

      if (!token) {
        setError(
          "Authentication token not found. Please log in again."
        );
        return;
      }

      try {
        setSaving(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/${editingId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "Access denied (403). Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            `Failed to delete project (${response.status})`
          );
        }

        await loadProjects();

        setShowModal(false);
        setEditingId(null);
      } catch (err) {
        console.error(
          "Error deleting project:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete project"
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ERROR */}

      {error && (
        <div
          className="
            rounded-lg
            border border-red-200
            bg-red-50
            px-4 py-3
            text-sm font-medium
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {/* ADD BUTTON */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            handleOpenModal()
          }
          className="
            rounded-lg
            bg-red-400
            px-3 py-2
            text-sm font-bold
            text-white
            shadow-sm
            transition
            hover:bg-red-600
            active:scale-95
          "
        >
          + Add Project
        </button>
      </div>

      {/* LOADING */}

      {loading && (
        <div
          className="
            rounded-2xl
            border border-slate-100
            bg-white
            p-10
            text-center
            text-sm
            text-slate-400
          "
        >
          Loading projects...
        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        projects.length === 0 && (
          <div
            className="
              rounded-2xl
              border border-slate-100
              bg-white
              p-10
              text-center
              shadow-sm
            "
          >
            <p className="text-sm text-slate-400">
              No projects found.
            </p>

            <p className="mt-1 text-xs text-slate-300">
              Click "Add Project" to
              create a new project.
            </p>
          </div>
        )}

      {/* PROJECT GRID */}

      {!loading &&
        projects.length > 0 && (
          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
              sm:gap-5
              lg:gap-6
            "
          >
            {projects.map(
              (project) => (
                <ProjectCard
                  key={
                    project.backendId
                  }
                  project={project}
                  superAdminMembers={
                    superAdminMembers
                  }
                  onEdit={() =>
                    handleOpenModal(
                      project
                    )
                  }
                />
              )
            )}
          </div>
        )}

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center
            justify-center
            bg-slate-900/40
            p-4
          "
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="
              max-h-[95vh]
              w-full
              max-w-[500px]
              overflow-y-auto
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >

            {/* HEADER */}

            <div
              className="
                flex
                items-start
                justify-between
                px-7 pt-7
              "
            >
              <h2
                className="
                  text-[23px]
                  font-bold
                  text-slate-800
                "
              >
                {editingId !== null
                  ? "Edit Project"
                  : "Add New Project"}
              </h2>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={saving}
                className="
                  text-2xl
                  font-light
                  leading-none
                  text-slate-400
                  hover:text-slate-700
                  disabled:opacity-50
                "
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSaveProject
              }
            >
              <div
                className="
                  px-7
                  pb-1
                  pt-6
                "
              >

                {/* CODE + NAME */}

                <div
                  className="
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                  "
                >
                  <FormField label="Project Code">
                    <input
                      name="projectCode"
                      value={
                        formData.projectCode
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="PRJ-006"
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Project Name">
                    <input
                      name="projectName"
                      value={
                        formData.projectName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Project name"
                      className="form-input"
                    />
                  </FormField>
                </div>

                {/* SPRINT */}

                <div className="mt-4">
                  <FormField label="Sprint">
                    <select
                      name="sprint"
                      value={
                        formData.sprint
                      }
                      onChange={
                        handleChange
                      }
                      className="
                        form-input
                        cursor-pointer
                      "
                    >
                      {Array.from(
                        {
                          length: 12,
                        },
                        (_, i) => (
                          <option
                            key={i}
                            value={`Sprint ${
                              i + 1
                            }`}
                          >
                            Sprint{" "}
                            {i + 1}
                          </option>
                        )
                      )}
                    </select>
                  </FormField>
                </div>

                {/* =================================================
                    TEAM MEMBERS
                ================================================= */}

                <div className="mt-4">

                  <FormField label="Team Members">

                    {/* SELECTED MEMBERS */}

                    {formData.teamMemberIds
                      .length > 0 && (
                      <div
                        className="
                          mb-3
                          flex
                          flex-wrap
                          gap-2
                        "
                      >
                        {formData.teamMemberIds.map(
                          (employeeId) => {

                            const member =
                              superAdminMembers.find(
                                (item) =>
                                  item.employeeId ===
                                  employeeId
                              );

                            if (!member) {
                              return null;
                            }

                            return (
                              <div
                                key={
                                  member.employeeId
                                }
                                className="
                                  flex
                                  items-center
                                  gap-2
                                  rounded-lg
                                  border
                                  border-red-200
                                  bg-red-50
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-bold
                                  text-red-500
                                "
                              >
                                <span>
                                  {
                                    member.name
                                  }
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeMember(
                                      member.employeeId
                                    )
                                  }
                                  className="
                                    text-sm
                                    font-bold
                                    text-red-400
                                    hover:text-red-700
                                  "
                                >
                                  ×
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* MEMBER LIST */}

                    <div
                      className="
                        max-h-48
                        overflow-y-auto
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                      "
                    >
                      {membersLoading ? (
                        <div
                          className="
                            px-4
                            py-4
                            text-sm
                            text-slate-400
                          "
                        >
                          Loading SuperAdmin
                          users...
                        </div>
                      ) : superAdminMembers.length ===
                        0 ? (
                        <div
                          className="
                            px-4
                            py-4
                            text-sm
                            text-slate-400
                          "
                        >
                          No active SuperAdmin
                          users found.
                        </div>
                      ) : (
                        superAdminMembers.map(
                          (member) => {

                            const selected =
                              formData.teamMemberIds.includes(
                                member.employeeId
                              );

                            return (
                              <label
                                key={
                                  member.employeeId
                                }
                                className={`
                                  flex
                                  cursor-pointer
                                  items-center
                                  gap-3
                                  border-b
                                  border-slate-100
                                  px-4
                                  py-3
                                  last:border-b-0
                                  hover:bg-slate-50
                                  ${
                                    selected
                                      ? "bg-red-50"
                                      : ""
                                  }
                                `}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    selected
                                  }
                                  onChange={() =>
                                    handleMemberToggle(
                                      member.employeeId
                                    )
                                  }
                                  className="
                                    h-4
                                    w-4
                                    rounded
                                    border-slate-300
                                    text-red-500
                                    focus:ring-red-400
                                  "
                                />

                                <div className="min-w-0">
                                  <p
                                    className="
                                      truncate
                                      text-sm
                                      font-bold
                                      text-slate-700
                                    "
                                  >
                                    {
                                      member.name
                                    }
                                  </p>

                                  <p
                                    className="
                                      truncate
                                      text-xs
                                      text-slate-400
                                    "
                                  >
                                    {
                                      member.designation ||
                                      "No designation"
                                    }
                                    {" • "}
                                    EMP-
                                    {
                                      member.employeeId
                                    }
                                  </p>
                                </div>
                              </label>
                            );
                          }
                        )
                      )}
                    </div>

                    {formData.teamMemberIds
                      .length > 0 && (
                      <p
                        className="
                          mt-2
                          text-xs
                          font-medium
                          text-slate-400
                        "
                      >
                        {
                          formData.teamMemberIds
                            .length
                        }{" "}
                        member
                        {formData.teamMemberIds
                          .length !== 1
                          ? "s"
                          : ""}{" "}
                        selected
                      </p>
                    )}

                  </FormField>
                </div>

                {/* BUDGET + START */}

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                  "
                >
                  <FormField label="Budget">
                    <input
                      name="budget"
                      value={
                        formData.budget
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. ₹24L / ₹40L"
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Start Date">
                    <input
                      type="date"
                      name="startDate"
                      value={
                        formData.startDate
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                    />
                  </FormField>
                </div>

                {/* END + STATUS */}

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                  "
                >
                  <FormField label="End Date">
                    <input
                      type="date"
                      name="endDate"
                      value={
                        formData.endDate
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Status">
                    <select
                      name="status"
                      value={
                        formData.status
                      }
                      onChange={
                        handleChange
                      }
                      className="
                        form-input
                        cursor-pointer
                      "
                    >
                      <option value="On Track">
                        On Track
                      </option>

                      <option value="At Risk">
                        At Risk
                      </option>

                      <option value="Delayed">
                        Delayed
                      </option>
                    </select>
                  </FormField>
                </div>

                {/* PROGRESS */}

                <div className="mt-4">
                  <FormField label="Progress %">
                    <input
                      type="number"
                      name="progress"
                      min="0"
                      max="100"
                      value={
                        formData.progress
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                    />
                  </FormField>
                </div>
              </div>

              {/* FOOTER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  px-7
                  py-6
                "
              >

                {editingId !== null ? (
                  <button
                    type="button"
                    onClick={
                      handleDeleteProject
                    }
                    disabled={saving}
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-5 py-3
                      text-sm
                      font-bold
                      text-red-500
                      hover:bg-red-100
                      disabled:opacity-50
                    "
                  >
                    Delete Project
                  </button>
                ) : (
                  <div />
                )}

                <div
                  className="
                    flex
                    gap-3
                  "
                >
                  <button
                    type="button"
                    onClick={
                      handleCloseModal
                    }
                    disabled={saving}
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-5 py-3
                      text-sm
                      font-bold
                      text-slate-500
                      hover:bg-slate-50
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      rounded-xl
                      bg-red-500
                      px-5 py-3
                      text-sm
                      font-bold
                      text-white
                      shadow-sm
                      hover:bg-red-600
                      active:scale-95
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {saving
                      ? "Saving..."
                      : editingId !==
                        null
                      ? "Save Changes"
                      : "Add Project"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-slate-500
        "
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   PROJECT CARD
========================================================= */

function ProjectCard({
  project,
  superAdminMembers,
  onEdit,
}: {
  project: Project;
  superAdminMembers: SuperAdminUser[];
  onEdit: () => void;
}) {
  const style =
    statusStyles[
      project.statusColor
    ];

  const teamNames =
    project.teamMemberIds
      .map(
        (employeeId) =>
          superAdminMembers.find(
            (member) =>
              member.employeeId ===
              employeeId
          )?.name
      )
      .filter(Boolean) as string[];

  return (
    <article
      className={`
        rounded-2xl
        border
        ${style.border}
        bg-white
        p-5
        shadow-sm
        transition
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
        sm:p-6
      `}
    >

      {/* TOP */}

      <div
        className="
          flex
          flex-wrap
          items-start
          justify-between
          gap-2
        "
      >
        <div
          className="
            min-w-0
            flex-1
          "
        >
          <p
            className="
              text-xs
              font-medium
              tracking-wide
              text-slate-400
            "
          >
            {project.id}
          </p>

          <h3
            className="
              mt-1
              truncate
              text-lg
              font-bold
              text-slate-800
              sm:text-xl
            "
          >
            {project.name}
          </h3>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <span
            className={`
              shrink-0
              rounded-lg
              border
              px-3 py-1.5
              text-xs
              font-bold
              ${style.badge}
            `}
          >
            {project.status}
          </span>

          <button
            type="button"
            onClick={onEdit}
            className="
              rounded-lg
              border
              border-slate-200
              px-3 py-1.5
              text-xs
              font-bold
              text-slate-500
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-500
            "
          >
            Edit
          </button>
        </div>
      </div>

      {/* DETAILS */}

      <div
        className="
          mt-1
          grid
          grid-cols-2
          gap-x-2
          gap-y-1
          sm:grid-cols-3
        "
      >
        <InfoBox
          label="Sprint"
          value={
            project.sprint
          }
        />

        <InfoBox
          label="Team"
          value={
            teamNames.length > 0
              ? teamNames.join(", ")
              : "No members"
          }
        />

        <InfoBox
          label="Budget"
          value={
            project.budget
          }
        />
      </div>

      {/* PROGRESS */}

      <div className="mt-4">

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
              text-sm
              text-slate-400
            "
          >
            Overall Progress
          </span>

          <span
            className={`
              text-sm
              font-bold
              ${style.percentage}
            `}
          >
            {project.progress}%
          </span>
        </div>

        <div
          className="
            h-2
            w-full
            overflow-hidden
            rounded-full
            bg-slate-200
          "
        >
          <div
            className={`
              h-full
              rounded-full
              ${style.bar}
              transition-all
              duration-500
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
    </article>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-xl
        px-2 py-2
        sm:px-3.5
      "
    >
      <p
        className="
          mt-2
          text-xs
          font-normal
          text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-sm
          font-bold
          text-slate-700
        "
        title={value}
      >
        {value}
      </p>
    </div>
  );
}