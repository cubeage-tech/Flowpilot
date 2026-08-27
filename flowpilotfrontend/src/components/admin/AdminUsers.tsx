import React, { useEffect, useState } from 'react';
import {
  Users,
  Pencil,
  UserCheck,
  UserX,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react';

interface User {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'Active' | 'Inactive';
  lastLogin?: string;
  designation?: string;
}

interface EditForm {
  name: string;
  email: string;
  role: string;
  department: string;
}

const API_BASE_URL = 'http://localhost:8080/api/admin/users';

export const AdminUsers: React.FC = () => {
  // =========================================================
  // USERS
  // =========================================================

  const [users, setUsers] = useState<User[]>([]);

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  const [_search] = useState('');
  const [_statusFilter] =
    useState<'All' | 'Active' | 'Inactive'>('All');

  // =========================================================
  // EDIT STATE
  // =========================================================

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    email: '',
    role: '',
    department: '',
  });

  const [saving, setSaving] = useState(false);

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = (): string | null => {
    return localStorage.getItem('token');
  };

  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();

      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setError('Your session has expired. Please login again.');
        setLoading(false);
        return;
      }

      if (response.status === 403) {
        setError(
          'You do not have permission to access admin users.'
        );
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch users. Status: ${response.status}`
        );
      }

      const data: User[] = await response.json();

      setUsers(data);
    } catch (err) {
      console.error('Error fetching admin users:', err);

      setError(
        'Unable to load users from backend. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH USERS WHEN PAGE LOADS
  // =========================================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================================================
  // NORMALIZE STATUS
  // =========================================================

  const isUserActive = (status: User['status']) => {
    return status === 'ACTIVE' || status === 'Active';
  };

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = users.filter((user) => {
    const searchText = _search.toLowerCase();

    const matchesSearch =
      user.name?.toLowerCase().includes(searchText) ||
      user.email?.toLowerCase().includes(searchText) ||
      user.role?.toLowerCase().includes(searchText) ||
      user.department?.toLowerCase().includes(searchText);

    const active = isUserActive(user.status);

    const matchesStatus =
      _statusFilter === 'All' ||
      (_statusFilter === 'Active' && active) ||
      (_statusFilter === 'Inactive' && !active);

    return matchesSearch && matchesStatus;
  });

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const handleEdit = (user: User) => {
    setEditingUser(user);

    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      department: user.department || '',
    });
  };

  // =========================================================
  // CLOSE EDIT FORM
  // =========================================================

  const handleCancelEdit = () => {
    setEditingUser(null);

    setEditForm({
      name: '',
      email: '',
      role: '',
      department: '',
    });
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleEditChange = (
    field: keyof EditForm,
    value: string
  ) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // SAVE EDITED USER
  // =========================================================

  const handleSaveEdit = async () => {
    if (!editingUser) {
      return;
    }

    if (
      !editForm.name.trim() ||
      !editForm.email.trim() ||
      !editForm.role.trim() ||
      !editForm.department.trim()
    ) {
      alert('Please fill all fields.');
      return;
    }

    const token = getToken();

    if (!token) {
      alert('Authentication token not found. Please login again.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/${editingUser.employeeId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: editingUser.employeeId,
            name: editForm.name.trim(),
            email: editForm.email.trim(),
            role: editForm.role.trim(),
            department: editForm.department.trim(),
          }),
        }
      );

      if (response.status === 401) {
        setError('Your session has expired. Please login again.');
        return;
      }

      if (response.status === 403) {
        setError(
          'You do not have permission to edit users.'
        );
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          'Backend update error:',
          errorText
        );

        throw new Error(
          `Failed to update user. Status: ${response.status}`
        );
      }

      const updatedUser: User = await response.json();

      // Update local UI immediately
      setUsers((previous) =>
        previous.map((user) =>
          user.employeeId === editingUser.employeeId
            ? updatedUser
            : user
        )
      );

      setEditingUser(null);

      setEditForm({
        name: '',
        email: '',
        role: '',
        department: '',
      });
    } catch (err) {
      console.error('Error updating user:', err);

      setError(
        'Unable to update user. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // ENABLE / DISABLE USER
  // =========================================================

  const toggleUserStatus = async (user: User) => {
    const token = getToken();

    if (!token) {
      alert('Authentication token not found. Please login again.');
      return;
    }

    try {
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/${user.employeeId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        setError(
          'Your session has expired. Please login again.'
        );
        return;
      }

      if (response.status === 403) {
        setError(
          'You do not have permission to change user status.'
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to change user status. Status: ${response.status}`
        );
      }

      const updatedUser: User = await response.json();

      // Update UI with backend response
      setUsers((previous) =>
        previous.map((existingUser) =>
          existingUser.employeeId === user.employeeId
            ? updatedUser
            : existingUser
        )
      );
    } catch (err) {
      console.error(
        'Error changing user status:',
        err
      );

      setError(
        'Unable to change user status. Please try again.'
      );
    }
  };

  // =========================================================
  // LOADING UI
  // =========================================================

  if (loading) {
    return (
      <div className="space-y-2 pb-2">

        <div
          className="
            flex
            min-h-[180px]
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200/80
            bg-white
            shadow-[0_4px_18px_rgba(15,23,42,0.05)]
          "
        >
          <div className="text-center">

            <div
              className="
                mx-auto
                h-7
                w-7
                animate-spin
                rounded-full
                border-2
                border-slate-200
                border-t-amber-500
              "
            />

            <p className="mt-3 text-[13px] font-semibold text-slate-500">
              Loading users...
            </p>

          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-2 pb-2">

      {/* =====================================================
          ADMIN WARNING
      ===================================================== */}

      <div
        className="
          -mt-1
          flex
          items-start
          gap-2.5
          rounded-lg
          border
          border-amber-200
          bg-amber-50
          px-3
          py-2
          text-[11px]
          font-medium
          text-amber-700
          sm:text-[12px]
        "
      >

        <AlertTriangle
          size={14}
          className="mt-0.5 shrink-0 text-amber-600"
        />

        <span>
          Admin can edit or disable users. Permanent deletion
          requires Super Admin access.
        </span>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-3
            py-2
            text-[12px]
            font-medium
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {/* =====================================================
          EDIT FORM
      ===================================================== */}

      {editingUser && (
        <div
          className="
            rounded-xl
            border
            border-slate-200/80
            bg-white
            p-4
            shadow-[0_4px_18px_rgba(15,23,42,0.05)]
            sm:p-5
          "
        >

          {/* FORM HEADER */}

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h2 className="text-[15px] font-extrabold text-slate-900">
                Edit User
              </h2>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Update the user's information below.
              </p>

            </div>

            <button
              type="button"
              onClick={handleCancelEdit}
              className="
                rounded-md
                p-1.5
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-600
              "
            >
              <X size={17} />
            </button>

          </div>

          {/* FORM */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* NAME */}

            <div>

              <label
                className="
                  mb-1
                  block
                  text-[11px]
                  font-bold
                  text-slate-600
                "
              >
                Name
              </label>

              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  handleEditChange(
                    'name',
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-md
                  border
                  border-slate-200
                  px-3
                  py-2
                  text-[12px]
                  text-slate-700
                  outline-none
                  transition
                  focus:border-amber-400
                  focus:ring-2
                  focus:ring-amber-100
                "
              />

            </div>

            {/* EMAIL */}

            <div>

              <label
                className="
                  mb-1
                  block
                  text-[11px]
                  font-bold
                  text-slate-600
                "
              >
                Email
              </label>

              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  handleEditChange(
                    'email',
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-md
                  border
                  border-slate-200
                  px-3
                  py-2
                  text-[12px]
                  text-slate-700
                  outline-none
                  transition
                  focus:border-amber-400
                  focus:ring-2
                  focus:ring-amber-100
                "
              />

            </div>

            {/* ROLE */}

            <div>

              <label
                className="
                  mb-1
                  block
                  text-[11px]
                  font-bold
                  text-slate-600
                "
              >
                Role
              </label>

              <input
                type="text"
                value={editForm.role}
                onChange={(e) =>
                  handleEditChange(
                    'role',
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-md
                  border
                  border-slate-200
                  px-3
                  py-2
                  text-[12px]
                  text-slate-700
                  outline-none
                  transition
                  focus:border-amber-400
                  focus:ring-2
                  focus:ring-amber-100
                "
              />

            </div>

            {/* DEPARTMENT */}

            <div>

              <label
                className="
                  mb-1
                  block
                  text-[11px]
                  font-bold
                  text-slate-600
                "
              >
                Department
              </label>

              <input
                type="text"
                value={editForm.department}
                onChange={(e) =>
                  handleEditChange(
                    'department',
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-md
                  border
                  border-slate-200
                  px-3
                  py-2
                  text-[12px]
                  text-slate-700
                  outline-none
                  transition
                  focus:border-amber-400
                  focus:ring-2
                  focus:ring-amber-100
                "
              />

            </div>

          </div>

          {/* FORM ACTIONS */}

          <div
            className="
              mt-4
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
              onClick={handleCancelEdit}
              disabled={saving}
              className="
                inline-flex
                items-center
                justify-center
                gap-1.5
                rounded-md
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-[11px]
                font-bold
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <X size={12} />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="
                inline-flex
                items-center
                justify-center
                gap-1.5
                rounded-md
                bg-amber-500
                px-3
                py-2
                text-[11px]
                font-bold
                text-white
                transition
                hover:bg-amber-600
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              <Save size={12} />

              {saving
                ? 'Saving...'
                : 'Save Changes'}

            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          USERS TABLE CARD
      ===================================================== */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-200/80
          bg-white
          shadow-[0_4px_18px_rgba(15,23,42,0.05)]
        "
      >

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40">
                {['Employee ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-3 py-2.5 text-left text-[12px] font-extrabold uppercase tracking-[0.05em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => {
                const active = isUserActive(user.status);

                return (
                  <tr
                    key={user.employeeId}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-3 py-2.5 text-[13px] font-medium text-slate-600">
                      EMP-{String(user.employeeId).padStart(3, '0')}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-bold text-slate-900">
                      {user.name}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-medium text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-[13px] font-semibold text-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-medium text-slate-700">
                      {user.department}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-[13px] font-bold ${
                          active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          <Pencil size={11} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-bold text-slate-600 transition hover:bg-slate-100"
                        >
                          {active ? (
                            <>
                              <UserX size={12} />
                              Disable
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} />
                              Enable
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* =================================================
            MOBILE USER CARDS
        ================================================= */}

        <div className="space-y-3 p-3 md:hidden">

          {filteredUsers.map((user) => {

            const active = isUserActive(user.status);

            return (
              <div
                key={user.employeeId}
                className="
                  rounded-lg
                  border
                  border-slate-200
                  p-4
                "
              >

                {/* NAME + STATUS */}

                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  "
                >

                  <div>

                    <div className="text-[13px] font-bold text-slate-900">
                      {user.name}
                    </div>

                    <div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                        Role
                      </div>

                      <div className="mt-1 text-[11px] font-semibold text-slate-700">
                        {user.role}
                      </div>
                    </div>

                  </div>

                  <span
                    className={`
                      shrink-0
                      rounded-md
                      px-2
                      py-1
                      text-[10px]
                      font-bold
                      ${
                        active
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }
                    `}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </span>

                </div>

                {/* DETAILS */}

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-2
                    gap-3
                  "
                >

                  <div>

                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                      Employee ID
                    </div>

                    <div className="mt-1 text-[11px] font-medium text-slate-700">
                      EMP-{String(user.employeeId).padStart(3, '0')}
                    </div>

                  </div>

                  <div>

                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                      Role
                    </div>

                    <div className="mt-1 text-[11px] font-semibold text-slate-700">
                      {user.role}
                    </div>

                  </div>

                  <div>

                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                      Department
                    </div>

                    <div className="mt-1 text-[11px] font-semibold text-slate-700">
                      {user.department}
                    </div>

                  </div>

                  <div>

                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                      Last Active
                    </div>

                    <div className="mt-1 text-[11px] font-medium text-slate-500">
                      {user.lastLogin || 'Never'}
                    </div>

                  </div>

                </div>

                {/* MOBILE ACTIONS */}

                <div
                  className="
                    mt-4
                    flex
                    gap-2
                    border-t
                    border-slate-100
                    pt-3
                  "
                >

                  <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-md
                      border
                      border-amber-200
                      bg-amber-50
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      text-amber-700
                    "
                  >
                    <Pencil size={11} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleUserStatus(user)
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-md
                      border
                      border-slate-200
                      bg-slate-50
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      text-slate-600
                    "
                  >

                    {active ? (
                      <>
                        <UserX size={11} />
                        Disable
                      </>
                    ) : (
                      <>
                        <UserCheck size={11} />
                        Enable
                      </>
                    )}

                  </button>

                </div>

              </div>
            );
          })}

        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {filteredUsers.length === 0 && !loading && (
          <div className="py-12 text-center">

            <Users
              size={30}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-[14px] font-bold text-slate-600">
              No users found
            </p>

            <p className="mt-1 text-[12px] font-medium text-slate-400">
              No users are currently available from the backend.
            </p>

          </div>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          !error &&
          filteredUsers.length === 0 && (
            <div className="py-12 text-center">

              <Users
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-[14px] font-bold text-slate-600">
                No users found
              </p>

              <p className="mt-1 text-[12px] font-medium text-slate-400">
                Try changing your search or status filter.
              </p>

            </div>
          )}

      </div>

    </div>
  );
};

export default AdminUsers;
