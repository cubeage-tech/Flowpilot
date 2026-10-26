import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Pencil,
  UserCheck,
  UserX,
  AlertTriangle,
  X,
  Save,
  Plus,
  Search,
  CheckCircle2,
  Key,
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
  designation: string;
}

interface AddEmployeeForm {
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  password: string;
}

const ROLE_OPTIONS = [
  'Super Admin',
  'Administrator',
  'Project Manager',
  'Scrum Master',
  'Developer',
  'QA Engineer',
  'Viewer',
];

const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Quality Assurance',
  'Product Management',
  'Human Resources',
  'Finance',
  'Marketing',
  'Operations',
];

const DESIGNATION_OPTIONS = [
  'Team Lead',
  'Software Developer',
  'QA Engineer',
  'Scrum Master',
  'Project Manager',
  'Administrator',
  'UI/UX Designer',
  'Business Analyst',
  'HR Manager',
  'Finance Manager',
  'Marketing Manager',
  'Viewer',
];

const API_BASE_URL = 'http://localhost:8080/api/admin/users';

const initialAddForm: AddEmployeeForm = {
  name: '',
  email: '',
  role: 'Developer',
  department: 'Engineering',
  designation: 'Team Lead',
  password: '',
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    email: '',
    role: '',
    department: '',
    designation: '',
  });
  const [saving, setSaving] = useState(false);

  // Add Employee State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddEmployeeForm>(initialAddForm);
  const [adding, setAdding] = useState(false);

  // Reset Password State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const getToken = (): string | null => {
    return localStorage.getItem('token') || localStorage.getItem('jwt');
  };

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
        setError('You do not have permission to access admin users.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch users. Status: ${response.status}`);
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError('Unable to load users from backend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isUserActive = (status: User['status']) => {
    return status === 'ACTIVE' || status === 'Active';
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query) ||
        user.designation?.toLowerCase().includes(query);

      const active = isUserActive(user.status);
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && active) ||
        (statusFilter === 'Inactive' && !active);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  // Edit Handlers
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'Developer',
      department: user.department || 'Engineering',
      designation: user.designation || 'Team Lead',
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.role.trim() || !editForm.department.trim()) {
      alert('Please fill all required fields.');
      return;
    }

    const token = getToken();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/${editingUser.employeeId}`, {
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
          designation: editForm.designation.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user (${response.status})`);
      }

      const updatedUser: User = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.employeeId === editingUser.employeeId ? updatedUser : u))
      );
      setEditingUser(null);
      setSuccessMsg(`Successfully updated ${updatedUser.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Unable to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Add Employee Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      alert('Name, Email, and Password are required.');
      return;
    }

    const token = getToken();
    setAdding(true);
    setError('');

    try {
      let response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          role: addForm.role,
          department: addForm.department,
          designation: addForm.designation,
          password: addForm.password,
          status: 'ACTIVE',
        }),
      });

      if (!response.ok && response.status === 404) {
        // Fallback to superadmin endpoint if admin post not yet picked up
        response = await fetch('http://localhost:8080/api/superadmin/users', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: addForm.name.trim(),
            email: addForm.email.trim(),
            role: addForm.role,
            department: addForm.department,
            designation: addForm.designation,
            password: addForm.password,
            status: 'ACTIVE',
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create employee (${response.status})`);
      }

      const created: User = await response.json();
      setUsers((prev) => [created, ...prev]);
      setShowAddModal(false);
      setAddForm(initialAddForm);
      setSuccessMsg(`Employee ${created.name} added successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setError(err.message || 'Failed to add employee. Please check email/credentials.');
    } finally {
      setAdding(false);
    }
  };

  // Toggle Status
  const toggleUserStatus = async (user: User) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${user.employeeId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to change status (${response.status})`);
      }

      const updatedUser: User = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.employeeId === user.employeeId ? updatedUser : u))
      );
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Unable to change status.');
    }
  };

  // Reset User Password
  const handleResetPassword = async () => {
    if (!resetModalUser) return;

    setResettingPassword(true);
    setError('');
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found.');

      const response = await fetch(`${API_BASE_URL}/${resetModalUser.employeeId}/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: customResetPassword.trim() || undefined,
        }),
      });

      const responseText = await response.text();
      let data: any = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || responseText || 'Failed to reset password.'
        );
      }

      setSuccessMsg(
        `Password for ${resetModalUser.name} (${resetModalUser.email}) reset and emailed!`
      );
      setTimeout(() => setSuccessMsg(''), 5000);
      setResetModalUser(null);
      setCustomResetPassword('');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password.');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Top Banner Warning */}
      <div className="-mt-1 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
        <span>System Admin: Add and manage team members, designations, and permissions across departments.</span>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 shadow-sm animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              Employees & Users
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {users.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">Manage employee accounts, roles, and designations.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-amber-400"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* ADD EMPLOYEE BUTTON */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-95"
          >
            <Plus size={15} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Add New Employee</h3>
                <p className="text-[11px] text-slate-500">Create login credentials and assign role & designation.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="r.sharma@flowpilot.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">System Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Department</label>
                  <select
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400"
                  >
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Designation - with Team Lead */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    Designation (includes Team Lead) *
                  </label>
                  <select
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-400"
                  >
                    {DESIGNATION_OPTIONS.map((desig) => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters (Aa1@)"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  {adding ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER FORM */}
      {editingUser && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Edit Employee: {editingUser.name}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Update employee role, designation, and department.</p>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">Department</label>
              <select
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-400"
              >
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">Designation (with Team Lead)</label>
              <select
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-400"
              >
                {DESIGNATION_OPTIONS.map((desig) => (
                  <option key={desig} value={desig}>{desig}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60"
            >
              <Save size={13} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Employee ID', 'Name', 'Email', 'Role', 'Designation', 'Department', 'Status', 'Actions'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-3.5 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.05em] text-slate-500"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">
                    No employees matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const active = isUserActive(user.status);
                  return (
                    <tr
                      key={user.employeeId}
                      className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-3.5 py-2.5 text-xs font-semibold text-slate-600">
                        EMP-{String(user.employeeId).padStart(3, '0')}
                      </td>
                      <td className="px-3.5 py-2.5 text-xs font-bold text-slate-900">
                        {user.name}
                      </td>
                      <td className="px-3.5 py-2.5 text-xs font-medium text-slate-600">
                        {user.email}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex whitespace-nowrap rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/60">
                          {user.designation || 'Team Member'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-xs font-medium text-slate-700">
                        {user.department}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                            active
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            <Pencil size={11} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(user);
                              setCustomResetPassword('');
                            }}
                            title="Reset Password & Email to User"
                            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            <Key size={11} />
                            Reset Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="space-y-3 p-3 md:hidden">
          {filteredUsers.map((user) => {
            const active = isUserActive(user.status);
            return (
              <div key={user.employeeId} className="rounded-lg border border-slate-200 p-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{user.name}</h4>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                    <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      {user.designation || 'Team Member'}
                    </span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(user);
                      setCustomResetPassword('');
                    }}
                    className="rounded bg-amber-50 border border-amber-300 px-2 py-1 text-[11px] font-bold text-amber-700 inline-flex items-center gap-1"
                  >
                    <Key size={11} />
                    Reset Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleUserStatus(user)}
                    className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600"
                  >
                    {active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Reset User Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {resetModalUser.name} ({resetModalUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetModalUser(null);
                  setCustomResetPassword('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Resetting password will generate credentials and immediately email them to{' '}
                <span className="font-semibold text-slate-900">{resetModalUser.email}</span>.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Custom Password (Optional)
                </label>
                <input
                  type="text"
                  value={customResetPassword}
                  onChange={(e) => setCustomResetPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate (FlowPilot@XXXX)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  If left blank, a secure temporary password will be randomly generated.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setResetModalUser(null);
                  setCustomResetPassword('');
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resettingPassword}
                onClick={handleResetPassword}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition disabled:opacity-50"
              >
                <Key size={13} />
                {resettingPassword ? 'Resetting & Emailing...' : 'Reset & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
