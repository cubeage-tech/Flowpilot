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
  Plus,
  Pencil,
  Trash2,
  UserPlus,
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

interface SystemUser {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
}

export const SuperAdminDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Members modal
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  // Available users to add as members
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [addingMember, setAddingMember] = useState(false);

  // Department Add/Edit Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', head: '', progress: 0 });
  const [savingDept, setSavingDept] = useState(false);
  const [deptError, setDeptError] = useState('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState(false);

  const API_BASE = 'http://localhost:8080/api/superadmin/departments';

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [deptRes, projRes, usersRes] = await Promise.all([
        fetch(API_BASE, { headers }),
        fetch('http://localhost:8080/api/pm/projects', { headers }),
        fetch('http://localhost:8080/api/superadmin/users', { headers }),
      ]);

      if (!deptRes.ok) throw new Error('Failed to fetch departments');
      const data: Department[] = await deptRes.json();

      let projects: any[] = [];
      if (projRes.ok) projects = await projRes.json();

      let usersList: SystemUser[] = [];
      let usersMap: Record<number, string> = {};
      if (usersRes.ok) {
        usersList = await usersRes.json();
        setAllUsers(usersList);
        usersList.forEach((u: any) => {
          if (u.employeeId && u.department) {
            usersMap[u.employeeId] = u.department.trim().toLowerCase();
          }
        });
      }

      const updatedDepartments = data.map((dept) => {
        const deptNameLower = dept.name ? dept.name.trim().toLowerCase() : '';
        const count = projects.filter((p) => {
          if (!p.teamMemberIds || !Array.isArray(p.teamMemberIds)) return false;
          return p.teamMemberIds.some((empId: number) => {
            const uDept = usersMap[empId];
            return (
              uDept &&
              (uDept === deptNameLower ||
                uDept.includes(deptNameLower) ||
                deptNameLower.includes(uDept) ||
                (deptNameLower.includes('quality') && uDept.includes('quality')))
            );
          });
        }).length;

        return {
          ...dept,
          progress: count > 0 ? count : (dept.progress ?? 0),
        };
      });

      setDepartments(updatedDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Open Add modal
  const handleOpenAddModal = () => {
    setDeptForm({ name: '', head: '', progress: 0 });
    setIsEditingDept(false);
    setEditingDeptId(null);
    setDeptError('');
    setShowDeptModal(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeptForm({ name: dept.name, head: dept.head || '', progress: dept.progress || 0 });
    setIsEditingDept(true);
    setEditingDeptId(dept.id);
    setDeptError('');
    setShowDeptModal(true);
  };

  // Submit Add or Edit
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      setDeptError('Department name is required');
      return;
    }

    try {
      setSavingDept(true);
      setDeptError('');
      const token = localStorage.getItem('token');
      const url = isEditingDept && editingDeptId
        ? `${API_BASE}/${editingDeptId}`
        : API_BASE;
      const method = isEditingDept ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deptForm),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to save department');
      }

      setShowDeptModal(false);
      await fetchDepartments();
    } catch (err: any) {
      setDeptError(err.message || 'Something went wrong');
    } finally {
      setSavingDept(false);
    }
  };

  // Open Delete modal
  const handleOpenDeleteModal = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeptToDelete(dept);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      setDeletingDept(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${deptToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete department');
      setShowDeleteModal(false);
      setDeptToDelete(null);
      await fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
    } finally {
      setDeletingDept(false);
    }
  };

  // Load members for a department
  const loadDepartmentMembers = async (deptId: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/${deptId}/members`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data: DepartmentMember[] = await res.json();
      setDepartmentMembers(data);
    } else {
      setDepartmentMembers([]);
    }
  };

  const handleManageMembers = async (department: Department) => {
    try {
      setSelectedDepartment(department);
      setShowMembers(true);
      setLoadingMembers(true);
      await loadDepartmentMembers(department.id);
    } catch (error) {
      console.error('Error fetching department members:', error);
      setDepartmentMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Add member to department
  const handleAddMember = async () => {
    if (!selectedDepartment || !selectedUserToAdd) return;
    const user = allUsers.find((u) => String(u.employeeId) === selectedUserToAdd);
    if (!user) return;

    try {
      setAddingMember(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${selectedDepartment.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: user.employeeId,
          fullName: user.name,
          email: user.email,
          designation: user.designation || user.role || 'Member',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Failed to add member to department');
        return;
      }

      setSelectedUserToAdd('');
      await loadDepartmentMembers(selectedDepartment.id);
      await fetchDepartments();
    } catch (err) {
      console.error('Failed to add member:', err);
    } finally {
      setAddingMember(false);
    }
  };

  // Remove member from department
  const handleRemoveMember = async (memberId: number) => {
    if (!selectedDepartment) return;
    if (!window.confirm('Are you sure you want to remove this member from the department?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${selectedDepartment.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await loadDepartmentMembers(selectedDepartment.id);
        await fetchDepartments();
      } else {
        alert('Failed to remove member');
      }
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const handleCloseMembers = () => {
    setShowMembers(false);
    setSelectedDepartment(null);
    setDepartmentMembers([]);
    setSelectedUserToAdd('');
    setUserSearchTerm('');
  };

  const getDepartmentStyle = (name: string) => {
    const lower = (name || '').toLowerCase();
    let icon = <Briefcase size={18} />;
    let iconBg = 'bg-slate-50';
    let iconColor = 'text-slate-400';
    let buttonBg = 'bg-slate-50';
    let buttonColor = 'text-slate-500';
    let borderColor = 'border-slate-100';
    let memberColor = 'text-slate-900';
    let projectColor = 'text-slate-500';

    if (lower.includes('engineering')) {
      icon = <Settings size={18} />;
      iconBg = 'bg-cyan-50';
      iconColor = 'text-cyan-600';
      buttonBg = 'bg-cyan-50';
      buttonColor = 'text-cyan-600';
      borderColor = 'border-cyan-100';
      projectColor = 'text-cyan-600';
    } else if (lower.includes('product')) {
      icon = <Package size={18} />;
      iconBg = 'bg-purple-50';
      iconColor = 'text-purple-600';
      buttonBg = 'bg-purple-50';
      buttonColor = 'text-purple-600';
      borderColor = 'border-purple-100';
      projectColor = 'text-purple-600';
    } else if (lower.includes('quality')) {
      icon = <ShieldCheck size={18} />;
      iconBg = 'bg-emerald-50';
      iconColor = 'text-emerald-600';
      buttonBg = 'bg-emerald-50';
      buttonColor = 'text-emerald-600';
      borderColor = 'border-emerald-100';
      projectColor = 'text-emerald-600';
    } else if (lower.includes('design')) {
      icon = <Palette size={18} />;
      iconBg = 'bg-orange-50';
      iconColor = 'text-orange-600';
      buttonBg = 'bg-orange-50';
      buttonColor = 'text-orange-600';
      borderColor = 'border-orange-100';
      projectColor = 'text-orange-600';
    } else if (lower.includes('operations')) {
      icon = <Briefcase size={18} />;
      iconBg = 'bg-rose-50';
      iconColor = 'text-rose-600';
      buttonBg = 'bg-rose-50';
      buttonColor = 'text-rose-600';
      borderColor = 'border-rose-100';
      projectColor = 'text-rose-600';
    } else if (lower.includes('leadership')) {
      icon = <Crown size={18} />;
      iconBg = 'bg-amber-50';
      iconColor = 'text-amber-600';
      buttonBg = 'bg-amber-50';
      buttonColor = 'text-amber-600';
      borderColor = 'border-amber-100';
      projectColor = 'text-amber-600';
    }

    return {
      icon,
      iconBg,
      iconColor,
      buttonBg,
      buttonColor,
      borderColor,
      memberColor,
      projectColor,
    };
  };

  // Filter users not already in selected department
  const availableUsers = allUsers.filter(
    (u) => !departmentMembers.some((m) => m.employeeId === String(u.employeeId) || m.email === u.email)
  );

  return (
    <div className="w-full overflow-x-hidden">
      {/* HEADER WITH ADD BUTTON */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Departments Management</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Full superadmin control over department creation, configurations, and squad members.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Department
        </button>
      </div>

      {/* DEPARTMENTS GRID */}
      {loadingDepartments ? (
        <div className="w-full text-center py-12 text-slate-400 text-sm">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="w-full text-center py-16 bg-white border border-slate-100 rounded-2xl">
          <Briefcase size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600">No departments found</p>
          <p className="text-xs text-slate-400 mt-1">Get started by creating your first department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[18px] w-full">
          {departments.map((department) => {
            const style = getDepartmentStyle(department.name);

            return (
              <div
                key={department.id}
                className={`w-full min-h-[240px] bg-white border ${style.borderColor} rounded-[16px] px-[24px] py-[20px] shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all duration-200 hover:shadow-[0_5px_15px_rgba(15,23,42,0.08)] flex flex-col justify-between`}
              >
                {/* TOP SECTION */}
                <div>
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-[48px] h-[48px] min-w-[48px] rounded-[14px] flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconColor}`}
                      >
                        {style.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] leading-[19px] font-extrabold text-slate-900 truncate">
                          {department.name}
                        </h3>
                        <p className="text-[12px] leading-[17px] text-slate-400 mt-[2px] truncate">
                          Head: {department.head || 'Not Assigned'}
                        </p>
                      </div>
                    </div>

                    {/* EDIT & DELETE ACTION BUTTONS */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(department, e)}
                        title="Edit Department"
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDeleteModal(department, e)}
                        title="Delete Department"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* STAT BOXES */}
                  <div className="grid grid-cols-2 gap-[10px] mt-[17px]">
                    <div className="h-[70px] rounded-[11px] bg-slate-50 px-[14px] py-[10px]">
                      <div className="flex items-center gap-[7px]">
                        <Users size={14} strokeWidth={1.8} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] leading-[15px] text-slate-400 font-medium">Members</span>
                      </div>
                      <div className={`mt-[4px] text-[22px] leading-[25px] font-extrabold ${style.memberColor}`}>
                        {department.members}
                      </div>
                    </div>

                    <div className="h-[70px] rounded-[11px] bg-slate-50 px-[14px] py-[10px]">
                      <div className="flex items-center gap-[7px]">
                        <FolderKanban size={14} strokeWidth={1.8} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] leading-[15px] text-slate-400 font-medium">Projects</span>
                      </div>
                      <div className={`mt-[4px] text-[22px] leading-[25px] font-extrabold ${style.projectColor}`}>
                        {department.progress ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MANAGE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleManageMembers(department)}
                  className={`w-full h-[42px] mt-[15px] rounded-[10px] border ${style.borderColor} ${style.buttonBg} ${style.buttonColor} text-[13px] leading-[17px] font-extrabold cursor-pointer transition-all duration-150 hover:brightness-[0.98]`}
                >
                  Manage Members ({department.members})
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {isEditingDept ? 'Edit Department' : 'Create New Department'}
              </h3>
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="mt-4 space-y-4">
              {deptError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100">
                  {deptError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Product, Design"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Head</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={deptForm.head}
                  onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
                >
                  {savingDept ? 'Saving...' : isEditingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Delete Department</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <strong className="text-slate-800">{deptToDelete.name}</strong>? All
              member associations will be removed.
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingDept}
                className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                {deletingDept ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {showMembers && selectedDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6"
          onClick={handleCloseMembers}
        >
          <div
            className="relative w-full max-w-[900px] max-h-[90vh] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-[24px] py-[18px]">
              <div>
                <h2 className="text-[17px] leading-[22px] font-extrabold text-slate-900">
                  {selectedDepartment.name}
                </h2>
                <p className="mt-[2px] text-[12px] leading-[17px] text-slate-400">
                  Manage department squad members & assignments
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseMembers}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* ADD MEMBER BAR */}
            <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-3 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
                <UserPlus size={15} className="text-teal-600" />
                Assign Member:
              </div>
              <input
                type="text"
                placeholder="Search user..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-500 w-36"
              />
              <select
                value={selectedUserToAdd}
                onChange={(e) => setSelectedUserToAdd(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-500 max-w-xs flex-1"
              >
                <option value="">Select user to add...</option>
                {availableUsers
                  .filter((u) => {
                    if (!userSearchTerm.trim()) return true;
                    const q = userSearchTerm.toLowerCase();
                    return (
                      u.name.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      (u.role && u.role.toLowerCase().includes(q)) ||
                      String(u.employeeId).includes(q)
                    );
                  })
                  .map((u) => (
                    <option key={u.employeeId} value={String(u.employeeId)}>
                      {u.name} ({u.role || 'Member'}) — {u.email}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!selectedUserToAdd || addingMember}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shrink-0"
              >
                {addingMember ? 'Adding...' : 'Add to Department'}
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-[24px]">
              {loadingMembers ? (
                <div className="py-12 text-center text-[13px] text-slate-400">Loading members...</div>
              ) : departmentMembers.length === 0 ? (
                <div className="rounded-[12px] bg-slate-50 px-4 py-10 text-center">
                  <Users size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-[13px] font-semibold text-slate-500">No members found</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Use the selector above to assign users to this department.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-[12px] border border-slate-100">
                  <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-500">Member</th>
                        <th className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-500">Employee ID</th>
                        <th className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-500">Designation</th>
                        <th className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-500">Email</th>
                        <th className="px-4 py-3 text-right text-[11px] font-extrabold text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                                {member.fullName ? member.fullName.charAt(0).toUpperCase() : '?'}
                              </div>
                              <span className="text-[12px] font-bold text-slate-800">{member.fullName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[12px] font-medium text-slate-600">{member.employeeId || '-'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[12px] font-medium text-slate-600">{member.designation || '-'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[12px] font-medium text-slate-500">{member.email}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 size={15} />
                            </button>
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