import React, { useEffect, useState } from 'react';
import {
  Settings,
  Package,
  ShieldCheck,
  Palette,
  Briefcase,
  Crown,
  Users,
  FolderKanban,
  X,
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  head: string;
  members: number;
  progress: number;
}

interface DepartmentMember {
  id: number;
  fullName: string;
  email: string;
  employeeId: string;
  designation: string;
}

export const SuperAdminDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const [departmentMembers, setDepartmentMembers] =
    useState<DepartmentMember[]>([]);

  const [loadingMembers, setLoadingMembers] = useState(false);

  const [showMembers, setShowMembers] = useState(false);

  /*
   * Fetch departments
   */
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);

        const token = localStorage.getItem('token');

        const response = await fetch(
          'http://localhost:8080/api/admin/departments',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }

        const data: Department[] = await response.json();

        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  /*
   * Fetch members from adminmember table
   *
   * Backend endpoint:
   * GET /api/admin/departments/{departmentId}/members
   */
  const handleManageMembers = async (department: Department) => {
    try {
      setSelectedDepartment(department);
      setDepartmentMembers([]);
      setShowMembers(true);
      setLoadingMembers(true);

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:8080/api/admin/departments/${department.id}/members`,
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
          `Failed to fetch members: ${response.status}`
        );
      }

      /*
       * These records come from the backend.
       * Backend should fetch them from adminmember table.
       */
      const data: DepartmentMember[] = await response.json();

      setDepartmentMembers(data);
    } catch (error) {
      console.error(
        'Error fetching department members:',
        error
      );

      setDepartmentMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  /*
   * Close members modal
   */
  const handleCloseMembers = () => {
    setShowMembers(false);
    setSelectedDepartment(null);
    setDepartmentMembers([]);
  };

  /*
   * Existing department styles
   */
  const getDepartmentStyle = (name: string) => {
    switch (name.toLowerCase()) {
      case 'engineering':
        return {
          icon: <Settings size={18} />,
          iconBg: 'bg-cyan-50',
          iconColor: 'text-slate-400',
          buttonBg: 'bg-cyan-50',
          buttonColor: 'text-cyan-400',
          borderColor: 'border-cyan-100',
          memberColor: 'text-slate-900',
          projectColor: 'text-cyan-400',
          projects: 8,
        };

      case 'product':
        return {
          icon: <Package size={18} />,
          iconBg: 'bg-purple-50',
          iconColor: 'text-purple-400',
          buttonBg: 'bg-purple-50',
          buttonColor: 'text-purple-400',
          borderColor: 'border-purple-100',
          memberColor: 'text-slate-900',
          projectColor: 'text-purple-400',
          projects: 5,
        };

      case 'quality assurance':
        return {
          icon: <ShieldCheck size={18} />,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-400',
          buttonBg: 'bg-emerald-50',
          buttonColor: 'text-emerald-500',
          borderColor: 'border-emerald-100',
          memberColor: 'text-slate-900',
          projectColor: 'text-emerald-500',
          projects: 6,
        };

      case 'design':
        return {
          icon: <Palette size={18} />,
          iconBg: 'bg-orange-50',
          iconColor: 'text-pink-400',
          buttonBg: 'bg-orange-50',
          buttonColor: 'text-orange-500',
          borderColor: 'border-orange-100',
          memberColor: 'text-slate-900',
          projectColor: 'text-orange-500',
          projects: 4,
        };

      case 'operations':
        return {
          icon: <Briefcase size={18} />,
          iconBg: 'bg-rose-50',
          iconColor: 'text-blue-400',
          buttonBg: 'bg-rose-50',
          buttonColor: 'text-rose-500',
          borderColor: 'border-rose-100',
          memberColor: 'text-slate-900',
          projectColor: 'text-red-500',
          projects: 3,
        };

      case 'leadership':
        return {
          icon: <Crown size={18} />,
          iconBg: 'bg-slate-50',
          iconColor: 'text-orange-400',
          buttonBg: 'bg-slate-50',
          buttonColor: 'text-slate-400',
          borderColor: 'border-slate-100',
          memberColor: 'text-slate-900',
          projectColor: 'text-slate-400',
          projects: 24,
        };

      default:
        return {
          icon: <Briefcase size={18} />,
          iconBg: 'bg-slate-50',
          iconColor: 'text-slate-400',
          buttonBg: 'bg-slate-50',
          buttonColor: 'text-slate-400',
          borderColor: 'border-slate-100',
          memberColor: 'text-slate-900',
          projectColor: 'text-slate-400',
          projects: 0,
        };
    }
  };

  return (
    <div className="w-full overflow-x-hidden">

      {/* ================================
          DEPARTMENTS
          Existing UI kept unchanged
          ================================ */}

      {loadingDepartments ? (
        <div className="w-full text-center py-10 text-slate-400 text-sm">
          Loading departments...
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-[18px]
            w-full
          "
        >
          {departments.map((department) => {
            const style = getDepartmentStyle(department.name);

            return (
              <div
                key={department.id}
                className={`
                  w-full
                  h-[240px]
                  bg-white
                  border
                  ${style.borderColor}
                  rounded-[16px]
                  px-[24px]
                  py-[20px]
                  shadow-[0_2px_8px_rgba(15,23,42,0.05)]
                  transition-all
                  duration-200
                  hover:shadow-[0_5px_15px_rgba(15,23,42,0.08)]

                  max-md:h-auto
                  max-md:min-h-[240px]
                  max-md:px-[20px]
                  max-md:py-[18px]

                  max-sm:px-[16px]
                  max-sm:py-[16px]
                  max-sm:rounded-[14px]
                `}
              >

                {/* TOP SECTION */}

                <div className="flex items-center gap-[12px] min-w-0">
                  <div
                    className={`
                      w-[48px]
                      h-[48px]
                      min-w-[48px]
                      rounded-[14px]
                      flex
                      items-center
                      justify-center
                      shrink-0
                      ${style.iconBg}
                      ${style.iconColor}

                      max-sm:w-[44px]
                      max-sm:h-[44px]
                      max-sm:min-w-[44px]
                      max-sm:rounded-[12px]
                    `}
                  >
                    {style.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="
                        text-[15px]
                        leading-[19px]
                        font-extrabold
                        text-slate-900
                        truncate

                        max-sm:text-[14px]
                        max-sm:leading-[18px]
                      "
                    >
                      {department.name}
                    </h3>

                    <p
                      className="
                        text-[12px]
                        leading-[17px]
                        text-slate-400
                        mt-[2px]
                        truncate

                        max-sm:text-[11px]
                        max-sm:leading-[16px]
                      "
                    >
                      Head: {department.head}
                    </p>
                  </div>
                </div>

                {/* STAT BOXES */}

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-[10px]
                    mt-[17px]

                    max-sm:mt-[15px]
                    max-sm:gap-[8px]
                  "
                >

                  {/* MEMBERS */}

                  <div
                    className="
                      h-[70px]
                      rounded-[11px]
                      bg-slate-50
                      px-[14px]
                      py-[10px]

                      max-sm:h-[66px]
                      max-sm:px-[11px]
                      max-sm:py-[9px]
                    "
                  >
                    <div className="flex items-center gap-[7px]">
                      <Users
                        size={14}
                        strokeWidth={1.8}
                        className="text-slate-400 shrink-0"
                      />

                      <span
                        className="
                          text-[11px]
                          leading-[15px]
                          text-slate-400
                          font-medium

                          max-sm:text-[10px]
                        "
                      >
                        Members
                      </span>
                    </div>

                    <div
                      className={`
                        mt-[4px]
                        text-[22px]
                        leading-[25px]
                        font-extrabold
                        ${style.memberColor}

                        max-sm:text-[20px]
                        max-sm:leading-[23px]
                      `}
                    >
                      {department.members}
                    </div>
                  </div>

                  {/* PROJECTS */}

                  <div
                    className="
                      h-[70px]
                      rounded-[11px]
                      bg-slate-50
                      px-[14px]
                      py-[10px]

                      max-sm:h-[66px]
                      max-sm:px-[11px]
                      max-sm:py-[9px]
                    "
                  >
                    <div className="flex items-center gap-[7px]">
                      <FolderKanban
                        size={14}
                        strokeWidth={1.8}
                        className="text-slate-400 shrink-0"
                      />

                      <span
                        className="
                          text-[11px]
                          leading-[15px]
                          text-slate-400
                          font-medium

                          max-sm:text-[10px]
                        "
                      >
                        Projects
                      </span>
                    </div>

                    <div
                      className={`
                        mt-[4px]
                        text-[22px]
                        leading-[25px]
                        font-extrabold
                        ${style.projectColor}

                        max-sm:text-[20px]
                        max-sm:leading-[23px]
                      `}
                    >
                      {style.projects}
                    </div>
                  </div>
                </div>

                {/* MANAGE BUTTON */}

                <button
                  type="button"
                  onClick={() => handleManageMembers(department)}
                  className={`
                    w-full
                    h-[42px]
                    mt-[15px]
                    rounded-[10px]
                    border
                    ${style.borderColor}
                    ${style.buttonBg}
                    ${style.buttonColor}
                    text-[13px]
                    leading-[17px]
                    font-extrabold
                    cursor-pointer
                    transition-all
                    duration-150
                    hover:brightness-[0.98]

                    max-sm:h-[40px]
                    max-sm:mt-[14px]
                    max-sm:text-[12px]
                  `}
                >
                  Manage Members
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================
          MANAGE MEMBERS MODAL
          ================================================== */}

      {showMembers && selectedDepartment && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-900/40
            px-4
            py-6
          "
          onClick={handleCloseMembers}
        >
          <div
            className="
              relative
              w-full
              max-w-[900px]
              max-h-[90vh]
              overflow-hidden
              rounded-[16px]
              bg-white
              shadow-[0_20px_50px_rgba(15,23,42,0.18)]
            "
            onClick={(event) => event.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-[24px]
                py-[18px]

                max-sm:px-[18px]
                max-sm:py-[15px]
              "
            >
              <div className="min-w-0">
                <h2
                  className="
                    text-[17px]
                    leading-[22px]
                    font-extrabold
                    text-slate-900

                    max-sm:text-[15px]
                    max-sm:leading-[20px]
                  "
                >
                  {selectedDepartment.name}
                </h2>

                <p
                  className="
                    mt-[2px]
                    text-[12px]
                    leading-[17px]
                    text-slate-400
                  "
                >
                  Department Members
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseMembers}
                className="
                  flex
                  h-[34px]
                  w-[34px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-slate-400
                  transition-colors
                  hover:bg-slate-50
                  hover:text-slate-700
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div
              className="
                max-h-[calc(90vh-80px)]
                overflow-y-auto
                p-[24px]

                max-sm:p-[16px]
              "
            >

              {loadingMembers ? (
                <div
                  className="
                    py-12
                    text-center
                    text-[13px]
                    text-slate-400
                  "
                >
                  Loading members...
                </div>
              ) : departmentMembers.length === 0 ? (
                <div
                  className="
                    rounded-[12px]
                    bg-slate-50
                    px-4
                    py-10
                    text-center
                  "
                >
                  <Users
                    size={28}
                    className="
                      mx-auto
                      mb-2
                      text-slate-300
                    "
                  />

                  <p
                    className="
                      text-[13px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    No members found
                  </p>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      text-slate-400
                    "
                  >
                    No members are currently assigned to this
                    department.
                  </p>
                </div>
              ) : (
                <div
                  className="
                    w-full
                    overflow-x-auto
                    rounded-[12px]
                    border
                    border-slate-100
                  "
                >
                  <table
                    className="
                      w-full
                      min-w-[700px]
                      border-collapse
                    "
                  >
                    <thead>
                      <tr
                        className="
                          border-b
                          border-slate-100
                          bg-slate-50
                        "
                      >
                        <th
                          className="
                            px-4
                            py-3
                            text-left
                            text-[11px]
                            font-extrabold
                            text-slate-500
                          "
                        >
                          Member
                        </th>

                        <th
                          className="
                            px-4
                            py-3
                            text-left
                            text-[11px]
                            font-extrabold
                            text-slate-500
                          "
                        >
                          Employee ID
                        </th>

                        <th
                          className="
                            px-4
                            py-3
                            text-left
                            text-[11px]
                            font-extrabold
                            text-slate-500
                          "
                        >
                          Designation
                        </th>

                        <th
                          className="
                            px-4
                            py-3
                            text-left
                            text-[11px]
                            font-extrabold
                            text-slate-500
                          "
                        >
                          Email
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {departmentMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="
                            border-b
                            border-slate-50
                            last:border-b-0
                            hover:bg-slate-50/50
                          "
                        >

                          {/* MEMBER */}

                          <td className="px-4 py-3.5">
                            <div
                              className="
                                flex
                                items-center
                                gap-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-[34px]
                                  w-[34px]
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-slate-100
                                  text-[11px]
                                  font-bold
                                  text-slate-500
                                "
                              >
                                {member.fullName
                                  ? member.fullName
                                      .charAt(0)
                                      .toUpperCase()
                                  : '?'}
                              </div>

                              <span
                                className="
                                  text-[12px]
                                  font-bold
                                  text-slate-800
                                "
                              >
                                {member.fullName}
                              </span>
                            </div>
                          </td>

                          {/* EMPLOYEE ID */}

                          <td className="px-4 py-3.5">
                            <span
                              className="
                                text-[12px]
                                font-medium
                                text-slate-600
                              "
                            >
                              {member.employeeId || '-'}
                            </span>
                          </td>

                          {/* DESIGNATION */}

                          <td className="px-4 py-3.5">
                            <span
                              className="
                                text-[12px]
                                font-medium
                                text-slate-600
                              "
                            >
                              {member.designation || '-'}
                            </span>
                          </td>

                          {/* EMAIL */}

                          <td className="px-4 py-3.5">
                            <span
                              className="
                                text-[12px]
                                font-medium
                                text-slate-500
                              "
                            >
                              {member.email}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDepartments;