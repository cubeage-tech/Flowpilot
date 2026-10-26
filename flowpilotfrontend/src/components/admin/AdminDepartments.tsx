import React, { useEffect, useState } from 'react';
import {
  Plus,
  ChevronDown,
  Check,
  X,
  Users,
  Pencil,
  Trash2,
} from 'lucide-react';

/* ============================================================
   TYPES
============================================================ */

interface Department {
  id: number;
  name: string;
  head: string;
  members: number;
  progress: number;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
}

interface BackendUser {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'Active' | 'Inactive';
  lastLogin?: string;
  designation?: string;
}

interface Member {
  id: number;
  fullName: string;
  email: string;
  employeeId: string;
  designation: string;
}

interface DepartmentFormErrors {
  departmentName?: string;
  departmentHead?: string;
  members?: string;
  progress?: string;
}

/* ============================================================
   API
============================================================ */

const API_BASE_URL = 'http://localhost:8080/api/admin';

/* ============================================================
   DEPARTMENT COLORS
============================================================ */

const departmentColors = [
  {
    color: 'bg-[#69E8D0]',
    bgColor: 'bg-[#F4FEFC]',
    textColor: 'text-[#5DD9C3]',
    borderColor: 'border-[#D8F5EF]',
  },
  {
    color: 'bg-purple-400',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-500',
    borderColor: 'border-purple-100',
  },
  {
    color: 'bg-emerald-400',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-500',
    borderColor: 'border-emerald-100',
  },
  {
    color: 'bg-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-100',
  },
  {
    color: 'bg-rose-400',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-500',
    borderColor: 'border-rose-100',
  },
  {
    color: 'bg-slate-400',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-500',
    borderColor: 'border-slate-100',
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export const AdminDepartments: React.FC = () => {
  /* ==========================================================
     DEPARTMENTS
  ========================================================== */

  const [departments, setDepartments] = useState<Department[]>([]);

  /* ==========================================================
     USERS
  ========================================================== */

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  /* ==========================================================
     ALL EXISTING DEPARTMENT MEMBERS
  ========================================================== */

  const [departmentMembers, setDepartmentMembers] = useState<
    Record<number, Member[]>
  >({});

  /* ==========================================================
     ADD / EDIT DEPARTMENT
  ========================================================== */

  const [showForm, setShowForm] = useState(false);

  const [departmentName, setDepartmentName] = useState('');

  const [departmentHeadId, setDepartmentHeadId] =
    useState<number | null>(null);

  const [selectedUsers, setSelectedUsers] =
    useState<BackendUser[]>([]);

  const [showUserDropdown, setShowUserDropdown] =
    useState(false);

  const [memberSearchTerm, setMemberSearchTerm] =
    useState('');

  const [memberDropdownInitialSelection, setMemberDropdownInitialSelection] =
    useState<number[]>([]);

  const [showHeadDropdown, setShowHeadDropdown] =
    useState(false);

  const [progress, setProgress] = useState('');

  const [departmentErrors, setDepartmentErrors] =
    useState<DepartmentFormErrors>({});

  /* ==========================================================
     EDIT MODE
  ========================================================== */

  const [editingDepartmentId, setEditingDepartmentId] =
    useState<number | null>(null);

  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);

  const [savingDepartment, setSavingDepartment] =
    useState(false);

  /* ==========================================================
     DELETE
  ========================================================== */

  const [deletingDepartmentId, setDeletingDepartmentId] =
    useState<number | null>(null);

  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);

  const [departmentToDelete, setDepartmentToDelete] =
    useState<Department | null>(null);

  const [deletingDepartment, setDeletingDepartment] =
    useState(false);

  /* ==========================================================
     VIEW MEMBERS
  ========================================================== */

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const [showMembers, setShowMembers] = useState(false);

  const [membersLoading, setMembersLoading] =
    useState(false);

  /* ==========================================================
     ADD MEMBER TO EXISTING DEPARTMENT
  ========================================================== */

  const [showAddMemberDropdown, setShowAddMemberDropdown] =
    useState(false);

  const [selectedNewMemberIds, setSelectedNewMemberIds] =
    useState<number[]>([]);

  const [memberChecklistSearch, setMemberChecklistSearch] =
    useState('');

  const [addMemberDropdownInitialSelection, setAddMemberDropdownInitialSelection] =
    useState<number[]>([]);

  const [addingMembers, setAddingMembers] =
    useState(false);

  /* ==========================================================
     TOAST
  ========================================================== */

  const [toastMessage, setToastMessage] = useState('');

  /* ==========================================================
     TOKEN
  ========================================================== */

  const getToken = () => {
    return localStorage.getItem('token');
  };

  /* ==========================================================
     TOAST
  ========================================================== */

  const showToast = (message: string) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const isValidName = (value: string) => {
    return /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(
      value.trim()
    );
  };

  /* ==========================================================
     FETCH DEPARTMENT MEMBERS
  ========================================================== */

  const fetchAllDepartmentMembers = async (
    departmentList: Department[]
  ) => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const results = await Promise.all(
        departmentList.map(async (department) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/departments/${department.id}/members`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!response.ok) {
              return {
                id: department.id,
                members: [],
              };
            }

            const data: Member[] =
              await response.json();

            return {
              id: department.id,
              members: data,
            };
          } catch (error) {
            console.error(
              `Failed to fetch members for department ${department.id}:`,
              error
            );

            return {
              id: department.id,
              members: [],
            };
          }
        })
      );

      const memberMap: Record<number, Member[]> = {};

      results.forEach((item) => {
        memberMap[item.id] = item.members;
      });

      setDepartmentMembers(memberMap);

      console.log(
        'All department members:',
        memberMap
      );
    } catch (error) {
      console.error(
        'Error fetching all department members:',
        error
      );
    }
  };

  /* ==========================================================
     FETCH DEPARTMENTS
  ========================================================== */

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error(
            'Authentication token not found. Please login again.'
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/departments`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch departments. Status: ${response.status}`
          );
        }

        const data = await response.json();

        const formattedDepartments: Department[] =
          data.map(
            (department: any, index: number) => {
              const style =
                departmentColors[
                  index % departmentColors.length
                ];

              return {
                id: department.id,
                name: department.name,
                head: department.head,
                members:
                  department.members ?? 0,
                progress:
                  department.progress ?? 0,

                color: style.color,
                bgColor: style.bgColor,
                textColor: style.textColor,
                borderColor:
                  style.borderColor,

                shadowColor:
                  'shadow-[0_2px_8px_rgba(15,23,42,0.06)]',
              };
            }
          );

        setDepartments(
          formattedDepartments
        );

        await fetchAllDepartmentMembers(
          formattedDepartments
        );
      } catch (error) {
        console.error(
          'Error fetching departments:',
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : 'Failed to fetch departments.'
        );
      }
    };

    fetchDepartments();
  }, []);

  /* ==========================================================
     FETCH USERS
  ========================================================== */

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);

        const token = getToken();

        if (!token) {
          throw new Error(
            'Authentication token not found. Please login again.'
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/users`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 401) {
          throw new Error(
            'Your session has expired. Please login again.'
          );
        }

        if (response.status === 403) {
          throw new Error(
            'You do not have permission to access users.'
          );
        }

        if (!response.ok) {
          throw new Error(
            `Failed to fetch users. Status: ${response.status}`
          );
        }

        const data: BackendUser[] =
          await response.json();

        const activeUsers = data.filter(
          (user) =>
            user.status === 'ACTIVE' ||
            user.status === 'Active'
        );

        setUsers(activeUsers);

        console.log(
          'Active users loaded:',
          activeUsers
        );
      } catch (error) {
        console.error(
          'Error fetching users:',
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : 'Failed to fetch users.'
        );
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  /* ==========================================================
     GET EMPLOYEE IDS ALREADY ASSIGNED
  ========================================================== */

  const getAssignedEmployeeIds = (
    excludeDepartmentId?: number
  ): number[] => {
    const assignedIds: number[] = [];

    Object.entries(departmentMembers).forEach(
      ([departmentId, members]) => {
        const id = Number(departmentId);

        if (
          excludeDepartmentId !== undefined &&
          id === excludeDepartmentId
        ) {
          return;
        }

        members.forEach((member) => {
          const employeeId =
            Number(member.employeeId);

          if (!Number.isNaN(employeeId)) {
            assignedIds.push(employeeId);
          }
        });
      }
    );

    return assignedIds;
  };

  /* ==========================================================
     GET DEPARTMENT HEAD NAMES
  ========================================================== */

  const getDepartmentHeadNames = (
    excludeDepartmentId?: number
  ): string[] => {
    return departments
      .filter(
        (department) =>
          department.id !==
          excludeDepartmentId
      )
      .map((department) =>
        department.head
          ?.trim()
          .toLowerCase()
      )
      .filter(Boolean) as string[];
  };

  /* ==========================================================
     CHECK WHETHER USER IS ALREADY MEMBER
  ========================================================== */

  const isUserAlreadyAssigned = (
    employeeId: number,
    excludeDepartmentId?: number
  ) => {
    const assignedIds =
      getAssignedEmployeeIds(
        excludeDepartmentId
      );

    return assignedIds.includes(
      employeeId
    );
  };

  /* ==========================================================
     CHECK WHETHER USER IS DEPARTMENT HEAD
  ========================================================== */

  const isUserAlreadyHead = (
    user: BackendUser,
    excludeDepartmentId?: number
  ) => {
    const headNames =
      getDepartmentHeadNames(
        excludeDepartmentId
      );

    return headNames.includes(
      user.name.trim().toLowerCase()
    );
  };

  /* ==========================================================
     DEPARTMENT HEAD OPTIONS
  ========================================================== */

  const availableHeadUsers =
    users.filter((user) => {
      // When editing a department, only show members belonging to that department
      if (editingDepartment) {
        const deptName = editingDepartment.name.trim().toLowerCase();
        if (!user.department || !user.department.trim()) return false;
        const uDept = user.department.trim().toLowerCase();
        const belongsToDept =
          uDept === deptName ||
          (deptName.includes('quality') && uDept.includes('quality'));
        if (!belongsToDept) return false;
      }

      if (
        isUserAlreadyHead(
          user,
          editingDepartmentId ?? undefined
        )
      ) {
        return false;
      }

      return true;
    });

  /* ==========================================================
     CURRENT SELECTED HEAD USER
  ========================================================== */

  const selectedHeadUser =
    users.find(
      (user) =>
        user.employeeId ===
        departmentHeadId
    ) || null;

  /* ==========================================================
     MEMBER OPTIONS FOR NEW DEPARTMENT
  ========================================================== */

  const availableUsersForNewDepartment =
    users.filter((user) => {
      if (
        departmentHeadId !== null &&
        user.employeeId ===
          departmentHeadId
      ) {
        return false;
      }

      if (
        isUserAlreadyAssigned(
          user.employeeId
        )
      ) {
        return false;
      }

      if (
        isUserAlreadyHead(
          user
        )
      ) {
        return false;
      }

      return true;
    });

  /* ==========================================================
     CREATE DEPARTMENT MEMBER SELECTION
  ========================================================== */

  const isUserSelected = (
    employeeId: number
  ) => {
    return selectedUsers.some(
      (user) =>
        user.employeeId ===
        employeeId
    );
  };

  const toggleUserSelection = (
    user: BackendUser
  ) => {
    if (
      departmentHeadId !== null &&
      user.employeeId ===
        departmentHeadId
    ) {
      return;
    }

    setSelectedUsers(
      (previous) => {
        const alreadySelected =
          previous.some(
            (item) =>
              item.employeeId ===
              user.employeeId
          );

        if (alreadySelected) {
          return previous.filter(
            (item) =>
              item.employeeId !==
              user.employeeId
          );
        }

        return [...previous, user];
      }
    );

    setDepartmentErrors(
      (previous) => ({
        ...previous,
        members: undefined,
      })
    );
  };

  const removeSelectedUser = (
    employeeId: number
  ) => {
    setSelectedUsers(
      (previous) =>
        previous.filter(
          (user) =>
            user.employeeId !==
            employeeId
        )
    );
  };

  /* ==========================================================
     OPEN CREATE MEMBER DROPDOWN
  ========================================================== */

  const handleOpenUserDropdown = () => {
    setMemberDropdownInitialSelection(
      selectedUsers.map(
        (user) => user.employeeId
      )
    );

    setShowUserDropdown(
      (previous) => !previous
    );

    setShowHeadDropdown(false);
  };

  /* ==========================================================
     ADD / CONFIRM CREATE MEMBER SELECTION
  ========================================================== */

  const handleAddSelectedDepartmentMembers = () => {
    if (selectedUsers.length === 0) {
      setDepartmentErrors(
        (previous) => ({
          ...previous,
          members:
            'Please select at least one member.',
        })
      );
    }

    setShowUserDropdown(false);
  };

  /* ==========================================================
     CANCEL CREATE MEMBER SELECTION
  ========================================================== */

  const handleCancelDepartmentMemberSelection = () => {
    const restoredUsers =
      users.filter((user) =>
        memberDropdownInitialSelection.includes(
          user.employeeId
        )
      );

    setSelectedUsers(
      restoredUsers
    );

    if (restoredUsers.length > 0) {
      setDepartmentErrors(
        (previous) => ({
          ...previous,
          members: undefined,
        })
      );
    }

    setShowUserDropdown(false);
  };

  /* ==========================================================
     DEPARTMENT HEAD CHANGE
  ========================================================== */

  const handleDepartmentHeadChange = (
    user: BackendUser
  ) => {
    setDepartmentHeadId(
      user.employeeId
    );

    setSelectedUsers(
      (previous) =>
        previous.filter(
          (member) =>
            member.employeeId !==
            user.employeeId
        )
    );

    setShowHeadDropdown(false);

    setDepartmentErrors(
      (previous) => ({
        ...previous,
        departmentHead:
          undefined,
        members:
          undefined,
      })
    );
  };

  /* ==========================================================
     DEPARTMENT VALIDATION
  ========================================================== */

  const validateDepartmentForm = () => {
    const errors: DepartmentFormErrors =
      {};

    const name =
      departmentName.trim();

    if (!name) {
      errors.departmentName =
        'Department name is required.';
    } else if (name.length < 2) {
      errors.departmentName =
        'Department name must contain at least 2 characters.';
    } else if (!isValidName(name)) {
      errors.departmentName =
        'Department name can contain only letters, spaces, apostrophes or hyphens.';
    }

    if (
      departmentHeadId === null
    ) {
      errors.departmentHead =
        'Please select a department head.';
    }

    /*
     * Members are required only while creating.
     * During edit, existing members are preserved.
     */
    if (
      editingDepartmentId === null &&
      selectedUsers.length === 0
    ) {
      errors.members =
        'Please select at least one member.';
    }

    if (!progress.trim()) {
      errors.progress =
        'Progress is required.';
    } else if (
      !/^\d+$/.test(
        progress.trim()
      )
    ) {
      errors.progress =
        'Progress must be a whole number.';
    } else if (
      Number(progress) < 0 ||
      Number(progress) > 100
    ) {
      errors.progress =
        'Progress must be between 0 and 100.';
    }

    setDepartmentErrors(
      errors
    );

    return (
      Object.keys(errors)
        .length === 0
    );
  };

  /* ==========================================================
     RESET DEPARTMENT FORM
  ========================================================== */

  const resetDepartmentForm = () => {
    setDepartmentName('');
    setDepartmentHeadId(null);
    setSelectedUsers([]);
    setProgress('');

    setDepartmentErrors({});

    setShowUserDropdown(false);
    setShowHeadDropdown(false);

    setMemberDropdownInitialSelection([]);

    setEditingDepartmentId(null);
    setEditingDepartment(null);
    setSavingDepartment(false);
  };

  /* ==========================================================
     ADD DEPARTMENT
  ========================================================== */

  const handleAddDepartment =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !validateDepartmentForm()
      ) {
        return;
      }

      try {
        const token =
          getToken();

        if (!token) {
          throw new Error(
            'Authentication token not found. Please login again.'
          );
        }

        if (
          !selectedHeadUser
        ) {
          throw new Error(
            'Please select a department head.'
          );
        }

        /* ====================================================
           EDIT DEPARTMENT
        ==================================================== */

        if (editingDepartmentId !== null) {
          setSavingDepartment(true);

          const departmentPayload = {
            name:
              departmentName.trim(),

            head:
              selectedHeadUser.name,

            progress:
              Number(progress),
          };

          const response =
            await fetch(
              `${API_BASE_URL}/departments/${editingDepartmentId}`,
              {
                method: 'PUT',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  'Content-Type':
                    'application/json',
                },

                body:
                  JSON.stringify(
                    departmentPayload
                  ),
              }
            );

          if (!response.ok) {
            let message =
              'Failed to update department.';

            try {
              const errorData =
                await response.json();

              if (
                errorData?.message
              ) {
                message =
                  errorData.message;
              }
            } catch {
              // Ignore parsing error
            }

            throw new Error(
              message
            );
          }

          let updatedDepartmentData: any =
            null;

          try {
            updatedDepartmentData =
              await response.json();
          } catch {
            updatedDepartmentData = null;
          }

          const existingDepartment =
            departments.find(
              (department) =>
                department.id ===
                editingDepartmentId
            );

          if (!existingDepartment) {
            throw new Error(
              'Department not found in the current list.'
            );
          }

          const updatedDepartment: Department = {
            ...existingDepartment,

            name:
              updatedDepartmentData?.name ??
              departmentName.trim(),

            head:
              updatedDepartmentData?.head ??
              selectedHeadUser.name,

            progress:
              updatedDepartmentData?.progress ??
              Number(progress),
          };

          setDepartments(
            (previous) =>
              previous.map(
                (department) =>
                  department.id ===
                  editingDepartmentId
                    ? updatedDepartment
                    : department
              )
          );

          if (
            selectedDepartment?.id ===
            editingDepartmentId
          ) {
            setSelectedDepartment(
              updatedDepartment
            );
          }

          resetDepartmentForm();
          setShowForm(false);

          showToast(
            'Department updated successfully.'
          );

          return;
        }

        /* ====================================================
           CREATE DEPARTMENT
        ==================================================== */

        const departmentPayload = {
          name:
            departmentName.trim(),

          head:
            selectedHeadUser.name,

          members:
            selectedUsers.length,

          progress:
            Number(progress),
        };

        const response =
          await fetch(
            `${API_BASE_URL}/departments`,
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  departmentPayload
                ),
            }
          );

        if (!response.ok) {
          let message =
            'Failed to create department.';

          try {
            const errorData =
              await response.json();

            if (
              errorData?.message
            ) {
              message =
                errorData.message;
            }
          } catch {
            // Ignore parsing error
          }

          throw new Error(
            message
          );
        }

        const savedDepartment =
          await response.json();

        /* ====================================================
           ADD SELECTED MEMBERS
        ==================================================== */

        const savedMembers: Member[] =
          [];

        let failedMembers = 0;

        for (
          const user of selectedUsers
        ) {
          try {
            const memberResponse =
              await fetch(
                `${API_BASE_URL}/departments/${savedDepartment.id}/members`,
                {
                  method:
                    'POST',

                  headers: {
                    Authorization:
                      `Bearer ${token}`,

                    'Content-Type':
                      'application/json',
                  },

                  body:
                    JSON.stringify(
                      {
                        fullName:
                          user.name,

                        email:
                          user.email,

                        employeeId:
                          String(
                            user.employeeId
                          ),

                        designation:
                          user.designation ||
                          user.role ||
                          'Member',
                      }
                    ),
                }
              );

            if (
              !memberResponse.ok
            ) {
              failedMembers++;
              continue;
            }

            const savedMember =
              await memberResponse.json();

            savedMembers.push(
              savedMember
            );
          } catch (error) {
            console.error(
              'Failed to add member:',
              user,
              error
            );

            failedMembers++;
          }
        }

        /* ====================================================
           ADD DEPARTMENT TO UI
        ==================================================== */

        const index =
          departments.length %
          departmentColors.length;

        const style =
          departmentColors[
            index
          ];

        const newDepartment:
          Department = {
          id:
            savedDepartment.id,

          name:
            savedDepartment.name,

          head:
            savedDepartment.head,

          members:
            savedMembers.length,

          progress:
            savedDepartment.progress ??
            Number(progress),

          color:
            style.color,

          bgColor:
            style.bgColor,

          textColor:
            style.textColor,

          borderColor:
            style.borderColor,

          shadowColor:
            'shadow-[0_2px_8px_rgba(15,23,42,0.06)]',
        };

        setDepartments(
          (previous) => [
            ...previous,
            newDepartment,
          ]
        );

        setDepartmentMembers(
          (previous) => ({
            ...previous,

            [savedDepartment.id]:
              savedMembers,
          })
        );

        resetDepartmentForm();
        setShowForm(false);

        if (
          failedMembers > 0
        ) {
          showToast(
            `Department created, but ${failedMembers} member(s) could not be assigned.`
          );
        } else {
          showToast(
            'Department and members added successfully.'
          );
        }
      } catch (error) {
        console.error(
          'Error creating/updating department:',
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : 'Failed to save department.'
        );
      } finally {
        setSavingDepartment(false);
      }
    };

  /* ==========================================================
     EDIT DEPARTMENT
  ========================================================== */

  const handleEditDepartment = (
    department: Department
  ) => {
    const headUser =
      users.find(
        (user) =>
          user.name.trim().toLowerCase() ===
          department.head.trim().toLowerCase()
      );

    setEditingDepartmentId(
      department.id
    );

    setEditingDepartment(
      department
    );

    setDepartmentName(
      department.name
    );

    setDepartmentHeadId(
      headUser?.employeeId ?? null
    );

    /*
     * Existing members are preserved.
     * We don't change the existing member functionality.
     */
    setSelectedUsers([]);

    setProgress(
      String(department.progress)
    );

    setDepartmentErrors({});

    setShowUserDropdown(false);
    setShowHeadDropdown(false);

    setShowForm(true);
  };

  /* ==========================================================
     DELETE DEPARTMENT - OPEN CONFIRMATION
  ========================================================== */

  const handleDeleteDepartment = (
    department: Department
  ) => {
    setDepartmentToDelete(
      department
    );

    setDeletingDepartmentId(
      department.id
    );

    setShowDeleteConfirmation(
      true
    );
  };

  /* ==========================================================
     CANCEL DELETE
  ========================================================== */

  const handleCancelDelete = () => {
    if (deletingDepartment) {
      return;
    }

    setShowDeleteConfirmation(
      false
    );

    setDepartmentToDelete(null);
    setDeletingDepartmentId(null);
  };

  /* ==========================================================
     CONFIRM DELETE
  ========================================================== */

  const handleConfirmDelete =
    async () => {
      if (
        !departmentToDelete
      ) {
        return;
      }

      try {
        const token =
          getToken();

        if (!token) {
          throw new Error(
            'Authentication token not found. Please login again.'
          );
        }

        setDeletingDepartment(
          true
        );

        const response =
          await fetch(
            `${API_BASE_URL}/departments/${departmentToDelete.id}`,
            {
              method: 'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                'Content-Type':
                  'application/json',
              },
            }
          );

        if (!response.ok) {
          let message =
            'Failed to delete department.';

          try {
            const errorData =
              await response.json();

            if (
              errorData?.message
            ) {
              message =
                errorData.message;
            }
          } catch {
            // Ignore parsing error
          }

          throw new Error(
            message
          );
        }

        /*
         * Remove department from UI
         */
        setDepartments(
          (previous) =>
            previous.filter(
              (department) =>
                department.id !==
                departmentToDelete.id
            )
        );

        /*
         * Remove its members from local state
         */
        setDepartmentMembers(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[
              departmentToDelete.id
            ];

            return updated;
          }
        );

        /*
         * Close members modal if the deleted
         * department was open.
         */
        if (
          selectedDepartment?.id ===
          departmentToDelete.id
        ) {
          setShowMembers(false);
          setSelectedDepartment(null);
        }

        setShowDeleteConfirmation(
          false
        );

        setDepartmentToDelete(
          null
        );

        setDeletingDepartmentId(
          null
        );

        showToast(
          'Department deleted successfully.'
        );
      } catch (error) {
        console.error(
          'Error deleting department:',
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : 'Failed to delete department.'
        );
      } finally {
        setDeletingDepartment(
          false
        );
      }
    };

  /* ==========================================================
     CANCEL DEPARTMENT FORM
  ========================================================== */

  const handleCancel = () => {
    resetDepartmentForm();
    setShowForm(false);
  };

  /* ==========================================================
     VIEW MEMBERS
  ========================================================== */

  const handleViewMembers =
    async (
      department: Department
    ) => {
      setSelectedDepartment(
        department
      );

      setShowMembers(true);

      setShowAddMemberDropdown(
        false
      );

      setSelectedNewMemberIds([]);

      setAddMemberDropdownInitialSelection([]);

      try {
        const token =
          getToken();

        if (!token) {
          throw new Error(
            'Authentication token not found.'
          );
        }

        setMembersLoading(
          true
        );

        // Fetch real system users from backend users table
        const usersRes =
          await fetch(
            `${API_BASE_URL}/users`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

        if (!usersRes.ok) {
          throw new Error(
            'Failed to fetch department members.'
          );
        }

        const allUsers: BackendUser[] = await usersRes.json();
        const deptName = department.name.trim().toLowerCase();

        const filteredMembers: Member[] = allUsers
          .filter((u) => {
            if (!u.department || !u.department.trim()) return false;
            const uDept = u.department.trim().toLowerCase();
            return (
              uDept === deptName ||
              (deptName.includes('quality') && uDept.includes('quality'))
            );
          })
          .map((u) => ({
            id: u.employeeId,
            fullName: u.name,
            email: u.email,
            employeeId: String(u.employeeId),
            designation: u.designation || u.role || 'Member',
          }));

        setDepartmentMembers(
          (previous) => ({
            ...previous,

            [department.id]:
              filteredMembers,
          })
        );

        setDepartments(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                department.id
                  ? {
                      ...item,
                      members:
                        filteredMembers.length,
                    }
                  : item
            )
        );

        setSelectedDepartment(
          (previous) =>
            previous
              ? {
                  ...previous,
                  members:
                    filteredMembers.length,
                }
              : previous
        );
      } catch (error) {
        console.error(
          'Error fetching members:',
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : 'Failed to fetch members.'
        );
      } finally {
        setMembersLoading(
          false
        );
      }
    };

  /* ==========================================================
     CURRENT DEPARTMENT MEMBERS
  ========================================================== */

  const currentDepartmentMembers =
    selectedDepartment
      ? departmentMembers[
          selectedDepartment.id
        ] || []
      : [];

  /* ==========================================================
     CHECK CURRENT MEMBER
  ========================================================== */

  const isCurrentDepartmentMember =
    (employeeId: number) => {
      return currentDepartmentMembers.some(
        (member) =>
          Number(
            member.employeeId
          ) === employeeId
      );
    };

  /* ==========================================================
     AVAILABLE USERS FOR ADD MEMBER
  ========================================================== */

  const availableUsersForAddMember =
    selectedDepartment
      ? users.filter((user) => {
          /*
           * Existing members remain visible.
           */
          if (
            isCurrentDepartmentMember(
              user.employeeId
            )
          ) {
            return true;
          }

          /*
           * Department head cannot be a member.
           */
          if (
            selectedDepartment.head
              ?.trim()
              .toLowerCase() ===
            user.name
              .trim()
              .toLowerCase()
          ) {
            return false;
          }

          /*
           * Already belongs to another department.
           */
          if (
            isUserAlreadyAssigned(
              user.employeeId,
              selectedDepartment.id
            )
          ) {
            return false;
          }

          /*
           * Already head of another department.
           */
          if (
            isUserAlreadyHead(
              user,
              selectedDepartment.id
            )
          ) {
            return false;
          }

          return true;
        })
      : [];

  /* ==========================================================
     OPEN ADD MEMBER DROPDOWN
  ========================================================== */

  const handleOpenAddMemberDropdown = () => {
    setAddMemberDropdownInitialSelection(
      [...selectedNewMemberIds]
    );

    setShowAddMemberDropdown(
      (previous) => !previous
    );
  };

  /* ==========================================================
     TOGGLE ADD MEMBER SELECTION
  ========================================================== */

  const toggleNewMemberSelection =
    (user: BackendUser) => {
      /*
       * Existing member cannot be changed.
       */
      if (
        isCurrentDepartmentMember(
          user.employeeId
        )
      ) {
        return;
      }

      /*
       * Department head cannot be selected.
       */
      if (
        selectedDepartment &&
        selectedDepartment.head
          ?.trim()
          .toLowerCase() ===
          user.name
            .trim()
            .toLowerCase()
      ) {
        return;
      }

      setSelectedNewMemberIds(
        (previous) => {
          if (
            previous.includes(
              user.employeeId
            )
          ) {
            return previous.filter(
              (id) =>
                id !==
                user.employeeId
            );
          }

          return [
            ...previous,
            user.employeeId,
          ];
        }
      );
    };

  /* ==========================================================
     CANCEL ADD MEMBER DROPDOWN
  ========================================================== */

  const handleCancelAddMemberSelection = () => {
    setSelectedNewMemberIds(
      [...addMemberDropdownInitialSelection]
    );

    setShowAddMemberDropdown(false);
  };

  /* ==========================================================
     ADD SELECTED MEMBERS TO EXISTING DEPARTMENT
  ========================================================== */

  const handleAddMembersToDepartment =
    async () => {
      if (
        !selectedDepartment
      ) {
        return;
      }

      if (
        selectedNewMemberIds.length ===
        0
      ) {
        showToast(
          'Please select at least one new member.'
        );

        return;
      }

      try {
        const token =
          getToken();

        if (!token) {
          throw new Error(
            'Authentication token not found.'
          );
        }

        setAddingMembers(
          true
        );

        let failedMembers = 0;

        const newlyAddedMembers:
          Member[] = [];

        for (
          const employeeId of selectedNewMemberIds
        ) {
          const user =
            users.find(
              (item) =>
                item.employeeId ===
                employeeId
            );

          if (!user) {
            failedMembers++;
            continue;
          }

          /*
           * Don't add if already assigned elsewhere.
           */
          if (
            isUserAlreadyAssigned(
              employeeId,
              selectedDepartment.id
            )
          ) {
            failedMembers++;
            continue;
          }

          /*
           * Don't add department head.
           */
          if (
            selectedDepartment.head
              ?.trim()
              .toLowerCase() ===
            user.name
              .trim()
              .toLowerCase()
          ) {
            failedMembers++;
            continue;
          }

          try {
            const response =
              await fetch(
                `${API_BASE_URL}/departments/${selectedDepartment.id}/members`,
                {
                  method:
                    'POST',

                  headers: {
                    Authorization:
                      `Bearer ${token}`,

                    'Content-Type':
                      'application/json',
                  },

                  body:
                    JSON.stringify(
                      {
                        fullName:
                          user.name,

                        email:
                          user.email,

                        employeeId:
                          String(
                            user.employeeId
                          ),

                        designation:
                          user.designation ||
                          user.role ||
                          'Member',
                      }
                    ),
                }
              );

            if (
              !response.ok
            ) {
              failedMembers++;
              continue;
            }

            const savedMember:
              Member =
              await response.json();

            newlyAddedMembers.push(
              savedMember
            );
          } catch (error) {
            console.error(
              'Failed to add member:',
              user,
              error
            );

            failedMembers++;
          }
        }

        /* ====================================================
           UPDATE MEMBER MAP
        ==================================================== */

        if (
          newlyAddedMembers.length >
          0
        ) {
          const currentMembers =
            departmentMembers[
              selectedDepartment.id
            ] || [];

          const updatedMembers = [
            ...currentMembers,
            ...newlyAddedMembers,
          ];

          setDepartmentMembers(
            (previous) => ({
              ...previous,

              [selectedDepartment.id]:
                updatedMembers,
            })
          );

          const newCount =
            updatedMembers.length;

          setDepartments(
            (previous) =>
              previous.map(
                (department) =>
                  department.id ===
                  selectedDepartment.id
                    ? {
                        ...department,
                        members:
                          newCount,
                      }
                    : department
              )
          );

          setSelectedDepartment(
            (previous) =>
              previous
                ? {
                    ...previous,
                    members:
                      newCount,
                  }
                : previous
          );
        }

        /* ====================================================
           RESET ADD MEMBER DROPDOWN
        ==================================================== */

        setSelectedNewMemberIds([]);

        setAddMemberDropdownInitialSelection([]);

        setShowAddMemberDropdown(
          false
        );

        if (
          failedMembers > 0
        ) {
          showToast(
            `${newlyAddedMembers.length} member(s) added, but ${failedMembers} member(s) could not be added.`
          );
        } else {
          showToast(
            'Member(s) added successfully.'
          );
        }
      } catch (error) {
        console.error(
          'Error adding members:',
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : 'Failed to add members.'
        );
      } finally {
        setAddingMembers(
          false
        );
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="w-full">

      {/* ======================================================
          TOAST
      ====================================================== */}

      {toastMessage && (
        <div
          className="
            fixed
            right-5
            top-5
            z-[300]
            rounded-lg
            border
            border-slate-200
            bg-white
            px-4
            py-3
            text-[13px]
            font-semibold
            text-slate-700
            shadow-[0_8px_24px_rgba(15,23,42,0.15)]
          "
        >
          {toastMessage}
        </div>
      )}

      {/* ======================================================
          ADD DEPARTMENT BUTTON
      ====================================================== */}

      <div className="mb-4 flex justify-end">

        <button
          type="button"
          onClick={() => {
            resetDepartmentForm();
            setShowForm(true);
          }}
          className="
            inline-flex
            items-center
            justify-center
            gap-1.5
            rounded-xl
            bg-slate-900
            px-4
            py-2.5
            text-[13px]
            font-extrabold
            text-white
            transition
            hover:bg-slate-800
          "
        >
          <Plus size={16} />
          Department
        </button>

      </div>

      {/* ======================================================
          DEPARTMENT GRID
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >

        {departments.map(
          (department) => (
            <div
              key={department.id}
              className={`
                w-full
                min-h-[96px]
                rounded-xl
                border
                ${department.borderColor}
                bg-white
                px-5
                py-5
                ${department.shadowColor}
              `}
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-2
                "
              >

                <div className="min-w-0">

                  <h2
                    className="
                      text-[17px]
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {department.name}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[12.5px]
                      font-medium
                      text-slate-500
                    "
                  >
                    Head:{' '}
                    {department.head}
                  </p>

                </div>

                <div
                  className={`
                    flex
                    h-9
                    min-w-9
                    items-center
                    justify-center
                    rounded-xl
                    px-2
                    text-[13px]
                    font-extrabold
                    ${department.bgColor}
                    ${department.textColor}
                  `}
                >
                  {department.members}
                </div>

              </div>

              {/* PROGRESS */}

              <div className="mt-4">

                <div
                  className="
                    h-[4px]
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
                      ${department.color}
                    `}
                    style={{
                      width:
                        `${department.progress}%`,
                    }}
                  />

                </div>

              </div>

              {/* ==================================================
                  EDIT + DELETE BUTTONS
              ================================================== */}

              <div className="mt-3 flex gap-2">

                {/* EDIT */}

                <button
                  type="button"
                  onClick={() =>
                    handleEditDepartment(
                      department
                    )
                  }
                  className="
                    flex
                    h-8
                    flex-1
                    items-center
                    justify-center
                    gap-1.5
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    text-[12px]
                    font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  <Pencil size={13} />
                  Edit
                </button>

                {/* DELETE */}

                <button
                  type="button"
                  disabled={
                    deletingDepartmentId ===
                    department.id &&
                    deletingDepartment
                  }
                  onClick={() =>
                    handleDeleteDepartment(
                      department
                    )
                  }
                  className="
                    flex
                    h-8
                    flex-1
                    items-center
                    justify-center
                    gap-1.5
                    rounded-md
                    border
                    border-red-100
                    bg-white
                    text-[12px]
                    font-bold
                    text-red-500
                    transition
                    hover:bg-red-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <Trash2 size={13} />
                  Delete
                </button>

              </div>

              {/* VIEW MEMBERS */}

              <button
                type="button"
                onClick={() =>
                  handleViewMembers(
                    department
                  )
                }
                className={`
                  mt-2
                  flex
                  h-8
                  w-full
                  items-center
                  justify-center
                  rounded-md
                  border
                  ${department.borderColor}
                  ${department.bgColor}
                  ${department.textColor}
                  text-[12px]
                  font-bold
                  hover:brightness-95
                `}
              >
                View Members
              </button>

            </div>
          )
        )}

      </div>

      {/* ======================================================
          ADD / EDIT DEPARTMENT MODAL
      ====================================================== */}

      {showForm && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-900/30
            px-4
            backdrop-blur-[2px]
          "
        >

          <div
            className="
              relative
              w-full
              max-w-[460px]
              max-h-[90vh]
              overflow-visible
              rounded-xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-[0_12px_40px_rgba(15,23,42,0.15)]
            "
          >

            {/* HEADER */}

            <div className="mb-5">

              <h2
                className="
                  text-[18px]
                  font-extrabold
                  text-slate-900
                "
              >
                {editingDepartmentId !== null
                  ? 'Edit Department'
                  : 'Add Department'}
              </h2>

              <p
                className="
                  mt-1
                  text-[12.5px]
                  font-medium
                  text-slate-500
                "
              >
                {editingDepartmentId !== null
                  ? 'Update the department details below.'
                  : 'Enter the department details below.'}
              </p>

            </div>

            <form
              onSubmit={
                handleAddDepartment
              }
              className="space-y-4"
            >

              {/* ==================================================
                  DEPARTMENT NAME
              ================================================== */}

              <div>

                <label
                  className="
                    mb-1.5
                    block
                    text-[12px]
                    font-bold
                    text-slate-700
                  "
                >
                  Department Name
                </label>

                <input
                  type="text"
                  value={
                    departmentName
                  }
                  onChange={(e) => {
                    setDepartmentName(
                      e.target.value
                    );

                    setDepartmentErrors(
                      (previous) => ({
                        ...previous,
                        departmentName:
                          undefined,
                      })
                    );
                  }}
                  placeholder="Enter department name"
                  className="
                    h-10
                    w-full
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-3
                    text-[13px]
                    text-slate-800
                    outline-none
                    focus:border-slate-400
                    focus:ring-2
                    focus:ring-slate-100
                  "
                />

                {departmentErrors.departmentName && (
                  <p className="mt-1.5 text-[11px] text-red-500">
                    {
                      departmentErrors.departmentName
                    }
                  </p>
                )}

              </div>

              {/* ==================================================
                  DEPARTMENT HEAD DROPDOWN
              ================================================== */}

              <div className="relative">

                <label
                  className="
                    mb-1.5
                    block
                    text-[12px]
                    font-bold
                    text-slate-700
                  "
                >
                  Department Head
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowHeadDropdown(
                      (previous) =>
                        !previous
                    );

                    setShowUserDropdown(false);
                  }}
                  className={`
                    flex
                    h-10
                    w-full
                    items-center
                    justify-between
                    rounded-md
                    border
                    ${
                      departmentErrors.departmentHead
                        ? 'border-red-300'
                        : 'border-slate-200'
                    }
                    bg-white
                    px-3
                    text-left
                    text-[13px]
                    font-medium
                    text-slate-700
                    outline-none
                    focus:border-slate-400
                    focus:ring-2
                    focus:ring-slate-100
                  `}
                >

                  <span className="truncate">
                    {usersLoading
                      ? 'Loading users...'
                      : selectedHeadUser
                      ? selectedHeadUser.name
                      : editingDepartment?.head
                      ? editingDepartment.head
                      : 'Select department head'}
                  </span>

                  <ChevronDown
                    size={15}
                    className={`
                      shrink-0
                      text-slate-400
                      transition-transform
                      ${
                        showHeadDropdown
                          ? 'rotate-180'
                          : ''
                      }
                    `}
                  />

                </button>

                {showHeadDropdown && (
                  <div
                    className="
                      absolute
                      left-0
                      right-0
                      top-[70px]
                      z-[1000]
                      max-h-[220px]
                      overflow-y-auto
                      rounded-md
                      border
                      border-slate-200
                      bg-white
                      p-1
                      shadow-[0_10px_30px_rgba(15,23,42,0.18)]
                    "
                  >

                    {usersLoading ? (
                      <div
                        className="
                          px-3
                          py-5
                          text-center
                          text-[12px]
                          text-slate-500
                        "
                      >
                        Loading users...
                      </div>
                    ) : availableHeadUsers.length === 0 ? (
                      <div
                        className="
                          px-3
                          py-5
                          text-center
                          text-[12px]
                          text-slate-500
                        "
                      >
                        No available users for department head.
                      </div>
                    ) : (
                      availableHeadUsers.map(
                        (user) => (
                          <button
                            key={
                              user.employeeId
                            }
                            type="button"
                            onClick={() =>
                              handleDepartmentHeadChange(
                                user
                              )
                            }
                            className="
                              flex
                              w-full
                              items-center
                              gap-2.5
                              rounded-md
                              px-2.5
                              py-2.5
                              text-left
                              hover:bg-slate-50
                            "
                          >

                            <div
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-slate-100
                                text-[11px]
                                font-extrabold
                                text-slate-600
                              "
                            >
                              {user.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">

                              <div
                                className="
                                  truncate
                                  text-[12px]
                                  font-bold
                                  text-slate-800
                                "
                              >
                                {user.name}
                              </div>

                              <div
                                className="
                                  truncate
                                  text-[10px]
                                  text-slate-500
                                "
                              >
                                {user.email}
                              </div>

                            </div>

                            {departmentHeadId ===
                              user.employeeId && (
                              <Check
                                size={15}
                                className="text-slate-900"
                              />
                            )}

                          </button>
                        )
                      )
                    )}

                  </div>
                )}

                {departmentErrors.departmentHead && (
                  <p className="mt-1.5 text-[11px] text-red-500">
                    {
                      departmentErrors.departmentHead
                    }
                  </p>
                )}

              </div>

              {/* ==================================================
                  MEMBERS MULTI SELECT
              ================================================== */}

              {editingDepartmentId === null && (
                <div className="relative">

                  <label
                    className="
                      mb-1.5
                      block
                      text-[12px]
                      font-bold
                      text-slate-700
                    "
                  >
                    Members
                  </label>

                  {/* SELECTED USER CHIPS */}

                  {selectedUsers.length >
                    0 && (
                    <div
                      className="
                        mb-2
                        flex
                        max-h-[70px]
                        flex-wrap
                        gap-1.5
                        overflow-y-auto
                      "
                    >

                      {selectedUsers.map(
                        (user) => (
                          <div
                            key={
                              user.employeeId
                            }
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-md
                              bg-slate-100
                              px-2
                              py-1.5
                              text-[11px]
                              font-semibold
                              text-slate-700
                            "
                          >

                            <span>
                              {user.name}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeSelectedUser(
                                  user.employeeId
                                )
                              }
                              className="
                                text-slate-400
                                hover:text-red-500
                              "
                            >
                              <X size={12} />
                            </button>

                          </div>
                        )
                      )}

                    </div>
                  )}

                  {/* DROPDOWN BUTTON */}

                  <button
                    type="button"
                    onClick={
                      handleOpenUserDropdown
                    }
                    className={`
                      flex
                      h-10
                      w-full
                      items-center
                      justify-between
                      rounded-md
                      border
                      ${
                        departmentErrors.members
                          ? 'border-red-300'
                          : 'border-slate-200'
                      }
                      bg-white
                      px-3
                      text-left
                      text-[13px]
                      font-medium
                      text-slate-700
                      outline-none
                      focus:border-slate-400
                      focus:ring-2
                      focus:ring-slate-100
                    `}
                  >

                    <span>
                      {usersLoading
                        ? 'Loading users...'
                        : selectedUsers.length >
                          0
                        ? `${selectedUsers.length} user${
                            selectedUsers.length !==
                            1
                              ? 's'
                              : ''
                          } selected`
                        : 'Select members'}
                    </span>

                    <ChevronDown
                      size={15}
                      className={`
                        text-slate-400
                        transition-transform
                        ${
                          showUserDropdown
                            ? 'rotate-180'
                            : ''
                        }
                      `}
                    />

                  </button>

                  {/* CREATE DEPARTMENT MEMBERS DROPDOWN */}

                  {showUserDropdown && (
                    <div
                      className="
                        absolute
                        left-0
                        right-0
                        top-[70px]
                        z-[999]
                        overflow-hidden
                        rounded-md
                        border
                        border-slate-200
                        bg-white
                        shadow-[0_10px_30px_rgba(15,23,42,0.18)]
                      "
                    >

                      {/* SEARCH BAR FOR EMPLOYEES */}
                      <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 p-2">
                        <input
                          type="text"
                          placeholder="Search employees by name, role, email..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
                        />
                      </div>

                      <div
                        className="
                          max-h-[200px]
                          overflow-y-auto
                          p-1
                        "
                      >

                        {usersLoading ? (
                          <div
                            className="
                              px-3
                              py-5
                              text-center
                              text-[12px]
                              text-slate-500
                            "
                          >
                            Loading users...
                          </div>
                        ) : availableUsersForNewDepartment.filter((user) => {
                            if (!memberSearchTerm.trim()) return true;
                            const q = memberSearchTerm.toLowerCase();
                            return (
                              user.name.toLowerCase().includes(q) ||
                              user.email.toLowerCase().includes(q) ||
                              String(user.employeeId).includes(q) ||
                              (user.role && user.role.toLowerCase().includes(q)) ||
                              (user.designation && user.designation.toLowerCase().includes(q))
                            );
                          }).length === 0 ? (
                          <div
                            className="
                              px-3
                              py-5
                              text-center
                              text-[12px]
                              text-slate-500
                            "
                          >
                            {memberSearchTerm.trim()
                              ? "No matching employees found."
                              : "No available users."}
                          </div>
                        ) : (
                          availableUsersForNewDepartment
                            .filter((user) => {
                              if (!memberSearchTerm.trim()) return true;
                              const q = memberSearchTerm.toLowerCase();
                              return (
                                user.name.toLowerCase().includes(q) ||
                                user.email.toLowerCase().includes(q) ||
                                String(user.employeeId).includes(q) ||
                                (user.role && user.role.toLowerCase().includes(q)) ||
                                (user.designation && user.designation.toLowerCase().includes(q))
                              );
                            })
                            .map((user) => {
                              const selected =
                                isUserSelected(
                                  user.employeeId
                                );

                              return (
                                <button
                                  key={
                                    user.employeeId
                                  }
                                  type="button"
                                  onClick={() =>
                                    toggleUserSelection(
                                      user
                                    )
                                  }
                                  className={`
                                    flex
                                    w-full
                                    items-center
                                    gap-2.5
                                    rounded-md
                                    px-2.5
                                    py-2.5
                                    text-left
                                    transition
                                    hover:bg-slate-50
                                    ${
                                      selected
                                        ? 'bg-slate-50'
                                        : ''
                                    }
                                  `}
                                >

                                  <div
                                    className={`
                                      flex
                                      h-4
                                      w-4
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded
                                      border
                                      ${
                                        selected
                                          ? 'border-slate-900 bg-slate-900'
                                          : 'border-slate-300 bg-white'
                                      }
                                    `}
                                  >
                                    {selected && (
                                      <Check
                                        size={11}
                                        className="text-white"
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">

                                    <div
                                      className="
                                        truncate
                                        text-[12px]
                                        font-bold
                                        text-slate-800
                                      "
                                    >
                                      {user.name}
                                    </div>

                                    <div
                                      className="
                                        truncate
                                        text-[10px]
                                        font-medium
                                        text-slate-500
                                      "
                                    >
                                      EMP-
                                      {String(
                                        user.employeeId
                                      ).padStart(
                                        3,
                                        '0'
                                      )}
                                      {' • '}
                                      {user.email}
                                    </div>

                                  </div>

                                  <span
                                    className="
                                      shrink-0
                                      text-[10px]
                                      font-semibold
                                      text-slate-400
                                    "
                                  >
                                    {user.role}
                                  </span>

                                </button>
                              );
                            }
                          )
                        )}

                      </div>

                      <div
                        className="
                          border-t
                          border-slate-100
                          bg-slate-50
                          px-3
                          py-2
                        "
                      >
                        <span
                          className="
                            text-[11px]
                            font-semibold
                            text-slate-500
                          "
                        >
                          Selected members:{' '}
                        </span>

                        <span
                          className="
                            text-[11px]
                            font-extrabold
                            text-slate-800
                          "
                        >
                          {selectedUsers.length}
                        </span>
                      </div>

                      <div
                        className="
                          flex
                          gap-2
                          border-t
                          border-slate-100
                          bg-white
                          p-2
                        "
                      >

                        <button
                          type="button"
                          onClick={
                            handleCancelDepartmentMemberSelection
                          }
                          className="
                            flex
                            h-9
                            flex-1
                            items-center
                            justify-center
                            rounded-md
                            border
                            border-slate-300
                            bg-white
                            text-[12px]
                            font-bold
                            text-slate-700
                            transition
                            hover:bg-slate-50
                          "
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleAddSelectedDepartmentMembers
                          }
                          className="
                            flex
                            h-9
                            flex-1
                            items-center
                            justify-center
                            gap-1.5
                            rounded-md
                            bg-slate-900
                            text-[12px]
                            font-bold
                            text-white
                            transition
                            hover:bg-slate-800
                          "
                        >
                          <Plus size={13} />
                          Add
                        </button>

                      </div>

                    </div>
                  )}

                  {departmentErrors.members && (
                    <p className="mt-1.5 text-[11px] text-red-500">
                      {
                        departmentErrors.members
                      }
                    </p>
                  )}

                  <div
                    className="
                      mt-2
                      rounded-md
                      border
                      border-slate-100
                      bg-slate-50
                      px-3
                      py-2
                      text-[11px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    Selected members:{' '}
                    <span className="font-extrabold text-slate-800">
                      {
                        selectedUsers.length
                      }
                    </span>
                  </div>

                </div>
              )}

              {/* ==================================================
                  PROGRESS
              ================================================== */}

              <div>

                <label
                  className="
                    mb-1.5
                    block
                    text-[12px]
                    font-bold
                    text-slate-700
                  "
                >
                  Progress (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    progress
                  }
                  onChange={(e) => {
                    setProgress(
                      e.target.value
                    );

                    setDepartmentErrors(
                      (previous) => ({
                        ...previous,
                        progress:
                          undefined,
                      })
                    );
                  }}
                  placeholder="0"
                  className="
                    h-10
                    w-full
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-3
                    text-[13px]
                    text-slate-800
                    outline-none
                    focus:border-slate-400
                    focus:ring-2
                    focus:ring-slate-100
                  "
                />

                {departmentErrors.progress && (
                  <p className="mt-1.5 text-[11px] text-red-500">
                    {
                      departmentErrors.progress
                    }
                  </p>
                )}

              </div>

              {/* ==================================================
                  BUTTONS
              ================================================== */}

              <div
                className="
                  flex
                  flex-col-reverse
                  gap-2
                  border-t
                  border-slate-100
                  pt-4
                  sm:flex-row
                  sm:justify-end
                "
              >

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  disabled={savingDepartment}
                  className="
                    h-9
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-[12px]
                    font-bold
                    text-slate-600
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingDepartment}
                  className="
                    h-9
                    rounded-md
                    bg-slate-900
                    px-5
                    text-[12px]
                    font-bold
                    text-white
                    hover:bg-slate-800
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {savingDepartment
                    ? 'Saving...'
                    : editingDepartmentId !== null
                    ? 'Save Changes'
                    : 'Add Department'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteConfirmation &&
        departmentToDelete && (
          <div
            className="
              fixed
              inset-0
              z-[200]
              flex
              items-center
              justify-center
              bg-slate-900/30
              px-4
              backdrop-blur-[2px]
            "
          >

            <div
              className="
                w-full
                max-w-[400px]
                rounded-xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-[0_12px_40px_rgba(15,23,42,0.18)]
              "
            >

              <div className="flex items-start gap-3">

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-red-50
                    text-red-500
                  "
                >
                  <Trash2 size={18} />
                </div>

                <div className="min-w-0">

                  <h2
                    className="
                      text-[17px]
                      font-extrabold
                      text-slate-900
                    "
                  >
                    Delete Department
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[12.5px]
                      leading-5
                      text-slate-500
                    "
                  >
                    Are you sure you want to delete{' '}
                    <span className="font-bold text-slate-700">
                      {departmentToDelete.name}
                    </span>
                    ? This action cannot be undone.
                  </p>

                </div>

              </div>

              <div
                className="
                  mt-6
                  flex
                  justify-end
                  gap-2
                "
              >

                <button
                  type="button"
                  disabled={
                    deletingDepartment
                  }
                  onClick={
                    handleCancelDelete
                  }
                  className="
                    h-9
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-[12px]
                    font-bold
                    text-slate-600
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    deletingDepartment
                  }
                  onClick={
                    handleConfirmDelete
                  }
                  className="
                    h-9
                    rounded-md
                    bg-red-500
                    px-4
                    text-[12px]
                    font-bold
                    text-white
                    hover:bg-red-600
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {deletingDepartment
                    ? 'Deleting...'
                    : 'Delete'}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ======================================================
          VIEW MEMBERS MODAL
      ====================================================== */}

      {showMembers &&
        selectedDepartment && (
          <div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-slate-900/30
              px-4
              backdrop-blur-[2px]
            "
          >

            <div
              className="
                w-full
                max-w-[760px]
                overflow-visible
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow-[0_12px_40px_rgba(15,23,42,0.15)]
              "
            >

              {/* HEADER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-100
                  px-5
                  py-4
                "
              >

                <div>

                  <h2
                    className="
                      text-[17px]
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {selectedDepartment.name}{' '}
                    Members
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[12px]
                      text-slate-500
                    "
                  >
                    Department Head:{' '}
                    {
                      selectedDepartment.head
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowMembers(false);

                    setShowAddMemberDropdown(
                      false
                    );

                    setSelectedNewMemberIds(
                      []
                    );

                    setAddMemberDropdownInitialSelection(
                      []
                    );
                  }}
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-md
                    text-slate-500
                    hover:bg-slate-100
                  "
                >
                  <X size={17} />
                </button>

              </div>

              {/* ADD MEMBER SECTION */}

              <div
                className="
                  relative
                  border-b
                  border-slate-100
                  px-5
                  py-3
                "
              >

                <div className="flex justify-end">

                  <button
                    type="button"
                    onClick={
                      handleOpenAddMemberDropdown
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-md
                      bg-slate-900
                      px-3
                      py-2
                      text-[12px]
                      font-bold
                      text-white
                      hover:bg-slate-800
                    "
                  >

                    <Plus size={14} />

                    Add Member

                    <ChevronDown
                      size={13}
                      className={`
                        transition-transform
                        ${
                          showAddMemberDropdown
                            ? 'rotate-180'
                            : ''
                        }
                      `}
                    />

                  </button>

                </div>

                {/* ADD MEMBER DROPDOWN */}

                {showAddMemberDropdown && (
                  <div
                    className="
                      absolute
                      right-5
                      top-[58px]
                      z-[120]
                      w-[360px]
                      overflow-hidden
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      shadow-[0_12px_30px_rgba(15,23,42,0.18)]
                    "
                  >

                    <div
                      className="
                        border-b
                        border-slate-100
                        px-3
                        py-2.5
                      "
                    >

                      <p
                        className="
                          text-[12px]
                          font-extrabold
                          text-slate-800
                        "
                      >
                        Select Members
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[10px]
                          text-slate-500
                        "
                      >
                        Existing members are already selected.
                      </p>

                      <input
                        type="text"
                        placeholder="Search employee by name, email..."
                        value={memberChecklistSearch}
                        onChange={(e) => setMemberChecklistSearch(e.target.value)}
                        className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none focus:bg-white focus:border-slate-400"
                      />

                    </div>

                    <div
                      className="
                        max-h-[260px]
                        overflow-y-auto
                        p-1
                      "
                    >

                      {membersLoading ? (
                        <div
                          className="
                            px-3
                            py-6
                            text-center
                            text-[12px]
                            text-slate-500
                          "
                        >
                          Loading members...
                        </div>
                      ) : (
                        availableUsersForAddMember.filter((u) => {
                          if (!memberChecklistSearch.trim()) return true;
                          const q = memberChecklistSearch.toLowerCase();
                          return (
                            u.name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            String(u.employeeId).includes(q)
                          );
                        }).length === 0 ? (
                          <div
                            className="
                              px-3
                              py-6
                              text-center
                              text-[12px]
                              text-slate-500
                            "
                          >
                            No matching users found.
                          </div>
                        ) : (
                          availableUsersForAddMember
                            .filter((u) => {
                              if (!memberChecklistSearch.trim()) return true;
                              const q = memberChecklistSearch.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                String(u.employeeId).includes(q)
                              );
                            })
                            .map(
                            (user) => {
                              const existing =
                                isCurrentDepartmentMember(
                                  user.employeeId
                                );

                              const selected =
                                existing ||
                                selectedNewMemberIds.includes(
                                  user.employeeId
                                );

                              return (
                                <button
                                  key={
                                    user.employeeId
                                  }
                                  type="button"
                                  disabled={
                                    existing
                                  }
                                  onClick={() =>
                                    toggleNewMemberSelection(
                                      user
                                    )
                                  }
                                  className={`
                                    flex
                                    w-full
                                    items-center
                                    gap-2.5
                                    rounded-md
                                    px-2.5
                                    py-2.5
                                    text-left
                                    ${
                                      existing
                                        ? 'cursor-not-allowed bg-slate-50 opacity-70'
                                        : selected
                                        ? 'bg-slate-50 hover:bg-slate-100'
                                        : 'hover:bg-slate-50'
                                    }
                                  `}
                                >

                                  <div
                                    className={`
                                      flex
                                      h-4
                                      w-4
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded
                                      border
                                      ${
                                        selected
                                          ? 'border-slate-900 bg-slate-900'
                                          : 'border-slate-300 bg-white'
                                      }
                                    `}
                                  >
                                    {selected && (
                                      <Check
                                        size={11}
                                        className="text-white"
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">

                                    <div
                                      className="
                                        truncate
                                        text-[12px]
                                        font-bold
                                        text-slate-800
                                      "
                                    >
                                      {user.name}
                                    </div>

                                    <div
                                      className="
                                        truncate
                                        text-[10px]
                                        text-slate-500
                                      "
                                    >
                                      EMP-
                                      {String(
                                        user.employeeId
                                      ).padStart(
                                        3,
                                        '0'
                                      )}
                                      {' • '}
                                      {user.email}
                                    </div>

                                  </div>

                                  {existing ? (
                                    <span
                                      className="
                                        shrink-0
                                        text-[9px]
                                        font-bold
                                        text-emerald-600
                                      "
                                    >
                                      Already member
                                    </span>
                                  ) : (
                                    <span
                                      className="
                                        shrink-0
                                        text-[9px]
                                        font-semibold
                                        text-slate-400
                                      "
                                    >
                                      Available
                                    </span>
                                  )}

                                </button>
                              );
                            }
                          )
                        )
                      )}

                    </div>

                    <div
                      className="
                        border-t
                        border-slate-100
                        bg-slate-50
                        px-3
                        py-2
                      "
                    >

                      <span
                        className="
                          text-[11px]
                          font-semibold
                          text-slate-500
                        "
                      >
                        New members selected:{' '}
                      </span>

                      <span
                        className="
                          text-[11px]
                          font-extrabold
                          text-slate-800
                        "
                      >
                        {
                          selectedNewMemberIds.length
                        }
                      </span>

                    </div>

                    <div
                      className="
                        flex
                        gap-2
                        border-t
                        border-slate-100
                        bg-white
                        p-2
                      "
                    >

                      <button
                        type="button"
                        disabled={
                          addingMembers
                        }
                        onClick={
                          handleCancelAddMemberSelection
                        }
                        className="
                          flex
                          h-9
                          flex-1
                          items-center
                          justify-center
                          rounded-md
                          border
                          border-slate-300
                          bg-white
                          text-[12px]
                          font-bold
                          text-slate-700
                          transition
                          hover:bg-slate-50
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={
                          addingMembers ||
                          selectedNewMemberIds.length ===
                            0
                        }
                        onClick={
                          handleAddMembersToDepartment
                        }
                        className="
                          flex
                          h-9
                          flex-1
                          items-center
                          justify-center
                          gap-1.5
                          rounded-md
                          bg-slate-900
                          text-[12px]
                          font-bold
                          text-white
                          transition
                          hover:bg-slate-800
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >

                        <Plus size={13} />

                        {addingMembers
                          ? 'Adding...'
                          : 'Add'}

                      </button>

                    </div>

                  </div>
                )}

              </div>

              {/* MEMBERS TABLE */}

              <div
                className="
                  max-h-[55vh]
                  overflow-x-auto
                  overflow-y-auto
                "
              >

                {membersLoading ? (
                  <div
                    className="
                      py-12
                      text-center
                      text-[12px]
                      text-slate-500
                    "
                  >
                    Loading members...
                  </div>
                ) : currentDepartmentMembers.length ===
                  0 ? (
                  <div
                    className="
                      py-12
                      text-center
                    "
                  >

                    <Users
                      size={30}
                      className="
                        mx-auto
                        text-slate-300
                      "
                    />

                    <p
                      className="
                        mt-3
                        text-[13px]
                        font-bold
                        text-slate-600
                      "
                    >
                      No members found
                    </p>

                  </div>
                ) : (
                  <table
                    className="
                      w-full
                      min-w-[650px]
                    "
                  >

                    <thead
                      className="
                        sticky
                        top-0
                        bg-slate-50
                      "
                    >

                      <tr
                        className="
                          border-b
                          border-slate-200
                          text-left
                        "
                      >

                        <th
                          className="
                            px-5
                            py-3
                            text-[11px]
                            font-extrabold
                            uppercase
                            text-slate-500
                          "
                        >
                          Member
                        </th>

                        <th
                          className="
                            px-4
                            py-3
                            text-[11px]
                            font-extrabold
                            uppercase
                            text-slate-500
                          "
                        >
                          Employee ID
                        </th>

                        <th
                          className="
                            px-4
                            py-3
                            text-[11px]
                            font-extrabold
                            uppercase
                            text-slate-500
                          "
                        >
                          Email
                        </th>

                        <th
                          className="
                            px-4
                            py-3
                            text-[11px]
                            font-extrabold
                            uppercase
                            text-slate-500
                          "
                        >
                          Designation
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {currentDepartmentMembers.map(
                        (member) => (
                          <tr
                            key={
                              member.id
                            }
                            className="
                              border-b
                              border-slate-100
                            "
                          >

                            <td
                              className="
                                px-5
                                py-3
                                text-[12px]
                                font-bold
                                text-slate-800
                              "
                            >
                              {
                                member.fullName
                              }
                            </td>

                            <td
                              className="
                                px-4
                                py-3
                                text-[12px]
                                text-slate-600
                              "
                            >
                              {
                                member.employeeId
                              }
                            </td>

                            <td
                              className="
                                px-4
                                py-3
                                text-[12px]
                                text-slate-600
                              "
                            >
                              {
                                member.email
                              }
                            </td>

                            <td
                              className="
                                px-4
                                py-3
                                text-[12px]
                                text-slate-600
                              "
                            >
                              {
                                member.designation
                              }
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>
                )}

              </div>

            </div>

          </div>
        )}

    </div>
  );
};

export default AdminDepartments;