import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Settings,
  Check,
  X,
} from 'lucide-react';

type RoleKey =
  | 'superAdmin'
  | 'admin'
  | 'pm'
  | 'scrum'
  | 'developer'
  | 'qa'
  | 'viewer';

interface Role {
  key: RoleKey;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

const roles: Role[] = [
  {
    key: 'superAdmin',
    name: 'SUPER ADMIN',
    description: 'Full system access',
    icon: <ShieldCheck size={15} />,
  },
  {
    key: 'admin',
    name: 'ADMIN',
    description: 'Organization management',
    icon: <Users size={15} />,
  },
  {
    key: 'pm',
    name: 'PM',
    description: 'Project management',
    icon: <FolderKanban size={15} />,
  },
  {
    key: 'scrum',
    name: 'SCRUM',
    description: 'Sprint management',
    icon: <Users size={15} />,
  },
  {
    key: 'developer',
    name: 'DEVELOPER',
    description: 'Development access',
    icon: <Users size={15} />,
  },
  {
    key: 'qa',
    name: 'QA',
    description: 'Testing and quality',
    icon: <CheckSquare size={15} />,
  },
  {
    key: 'viewer',
    name: 'VIEWER',
    description: 'Read-only access',
    icon: <Users size={15} />,
  },
];

const permissionsByRole: Record<RoleKey, Permission[]> = {
  superAdmin: [
    {
      id: 'create-users',
      name: 'Create Users',
      description: 'Create new user accounts',
      read: true,
      create: true,
      edit: true,
      delete: true,
    },
    {
      id: 'delete-users',
      name: 'Delete Users',
      description: 'Permanently remove user accounts',
      read: true,
      create: false,
      edit: false,
      delete: true,
    },
    {
      id: 'manage-departments',
      name: 'Manage Departments',
      description: 'Create and manage departments',
      read: true,
      create: true,
      edit: true,
      delete: true,
    },
    {
      id: 'manage-settings',
      name: 'Manage System Settings',
      description: 'Configure global system settings',
      read: true,
      create: false,
      edit: true,
      delete: false,
    },
    {
      id: 'create-projects',
      name: 'Create Projects',
      description: 'Create new projects',
      read: true,
      create: true,
      edit: true,
      delete: true,
    },
    {
      id: 'manage-sprints',
      name: 'Manage Sprints',
      description: 'Create and manage project sprints',
      read: true,
      create: true,
      edit: true,
      delete: true,
    },
    {
      id: 'assign-tasks',
      name: 'Assign Tasks',
      description: 'Assign tasks to team members',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'update-status',
      name: 'Update Task Status',
      description: 'Change task status',
      read: true,
      create: false,
      edit: true,
      delete: false,
    },
    {
      id: 'log-time',
      name: 'Log Time',
      description: 'Record working hours',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'bug-reports',
      name: 'File Bug Reports',
      description: 'Create and manage bug reports',
      read: true,
      create: true,
      edit: true,
      delete: true,
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View system reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Export report data',
      read: true,
      create: true,
      edit: false,
      delete: false,
    },
  ],

  admin: [
    {
      id: 'create-users',
      name: 'Create Users',
      description: 'Create new user accounts',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'delete-users',
      name: 'Delete Users',
      description: 'Permanently remove user accounts',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-departments',
      name: 'Manage Departments',
      description: 'Create and manage departments',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'manage-settings',
      name: 'Manage System Settings',
      description: 'Configure global system settings',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'create-projects',
      name: 'Create Projects',
      description: 'Create new projects',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'manage-sprints',
      name: 'Manage Sprints',
      description: 'Create and manage project sprints',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'assign-tasks',
      name: 'Assign Tasks',
      description: 'Assign tasks to team members',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'update-status',
      name: 'Update Task Status',
      description: 'Change task status',
      read: true,
      create: false,
      edit: true,
      delete: false,
    },
    {
      id: 'log-time',
      name: 'Log Time',
      description: 'Record working hours',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'bug-reports',
      name: 'File Bug Reports',
      description: 'Create and manage bug reports',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View system reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Export report data',
      read: true,
      create: true,
      edit: false,
      delete: false,
    },
  ],

  pm: [
    {
      id: 'create-users',
      name: 'Create Users',
      description: 'Create new user accounts',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'delete-users',
      name: 'Delete Users',
      description: 'Permanently remove user accounts',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-departments',
      name: 'Manage Departments',
      description: 'Manage department information',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-settings',
      name: 'Manage System Settings',
      description: 'Configure global settings',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'create-projects',
      name: 'Create Projects',
      description: 'Create new projects',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'manage-sprints',
      name: 'Manage Sprints',
      description: 'Create and manage sprints',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'assign-tasks',
      name: 'Assign Tasks',
      description: 'Assign tasks to team members',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'update-status',
      name: 'Update Task Status',
      description: 'Change task status',
      read: true,
      create: false,
      edit: true,
      delete: false,
    },
    {
      id: 'log-time',
      name: 'Log Time',
      description: 'Record working hours',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'bug-reports',
      name: 'File Bug Reports',
      description: 'Create and manage bug reports',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View project reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Export project reports',
      read: true,
      create: true,
      edit: false,
      delete: false,
    },
  ],

  scrum: [
    {
      id: 'create-users',
      name: 'Create Users',
      description: 'Create new user accounts',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'delete-users',
      name: 'Delete Users',
      description: 'Permanently remove user accounts',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-departments',
      name: 'Manage Departments',
      description: 'Manage departments',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-settings',
      name: 'Manage System Settings',
      description: 'Configure global settings',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'create-projects',
      name: 'Create Projects',
      description: 'Create new projects',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-sprints',
      name: 'Manage Sprints',
      description: 'Create and manage sprints',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'assign-tasks',
      name: 'Assign Tasks',
      description: 'Assign tasks to team members',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'update-status',
      name: 'Update Task Status',
      description: 'Change task status',
      read: true,
      create: false,
      edit: true,
      delete: false,
    },
    {
      id: 'log-time',
      name: 'Log Time',
      description: 'Record working hours',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'bug-reports',
      name: 'File Bug Reports',
      description: 'Create and manage bug reports',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View system reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Export reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
  ],

  developer: [
    {
      id: 'create-users',
      name: 'Create Users',
      description: 'Create new user accounts',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'delete-users',
      name: 'Delete Users',
      description: 'Permanently remove user accounts',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-departments',
      name: 'Manage Departments',
      description: 'Manage departments',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-settings',
      name: 'Manage System Settings',
      description: 'Configure global settings',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'create-projects',
      name: 'Create Projects',
      description: 'Create new projects',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-sprints',
      name: 'Manage Sprints',
      description: 'Manage project sprints',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'assign-tasks',
      name: 'Assign Tasks',
      description: 'Assign tasks',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'update-status',
      name: 'Update Task Status',
      description: 'Change task status',
      read: true,
      create: false,
      edit: true,
      delete: false,
    },
    {
      id: 'log-time',
      name: 'Log Time',
      description: 'Record working hours',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'bug-reports',
      name: 'File Bug Reports',
      description: 'Create bug reports',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View system reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Export reports',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
  ],

  qa: [
    {
      id: 'create-users',
      name: 'Create Users',
      description: 'Create new user accounts',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'delete-users',
      name: 'Delete Users',
      description: 'Permanently remove user accounts',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-departments',
      name: 'Manage Departments',
      description: 'Manage departments',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-settings',
      name: 'Manage System Settings',
      description: 'Configure global settings',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'create-projects',
      name: 'Create Projects',
      description: 'Create new projects',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-sprints',
      name: 'Manage Sprints',
      description: 'Manage sprints',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'assign-tasks',
      name: 'Assign Tasks',
      description: 'Assign tasks',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'update-status',
      name: 'Update Task Status',
      description: 'Change task status',
      read: true,
      create: false,
      edit: true,
      delete: false,
    },
    {
      id: 'log-time',
      name: 'Log Time',
      description: 'Record working hours',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'bug-reports',
      name: 'File Bug Reports',
      description: 'Create and manage bug reports',
      read: true,
      create: true,
      edit: true,
      delete: false,
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View system reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Export reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
  ],

  viewer: [
    {
      id: 'create-users',
      name: 'Create Users',
      description: 'Create new user accounts',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'delete-users',
      name: 'Delete Users',
      description: 'Permanently remove user accounts',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-departments',
      name: 'Manage Departments',
      description: 'View departments',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-settings',
      name: 'Manage System Settings',
      description: 'View system settings',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'create-projects',
      name: 'Create Projects',
      description: 'Create new projects',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'manage-sprints',
      name: 'Manage Sprints',
      description: 'View sprint information',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'assign-tasks',
      name: 'Assign Tasks',
      description: 'View task assignments',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'update-status',
      name: 'Update Task Status',
      description: 'Change task status',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'log-time',
      name: 'Log Time',
      description: 'View logged time',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'bug-reports',
      name: 'File Bug Reports',
      description: 'View bug reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View system reports',
      read: true,
      create: false,
      edit: false,
      delete: false,
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Export reports',
      read: false,
      create: false,
      edit: false,
      delete: false,
    },
  ],
};

const PermissionToggle: React.FC<{
  enabled: boolean;
  onClick: () => void;
}> = ({ enabled, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-auto flex h-5 w-9 items-center rounded-full p-[2px] transition-all ${
        enabled
          ? 'justify-end bg-emerald-500'
          : 'justify-start bg-slate-200'
      }`}
      title={enabled ? 'Turn OFF' : 'Turn ON'}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
        {enabled ? (
          <Check size={9} className="text-emerald-500" strokeWidth={3} />
        ) : (
          <X size={8} className="text-slate-300" />
        )}
      </span>
    </button>
  );
};

export const SuperAdminRoles: React.FC = () => {
  const [selectedRole, setSelectedRole] =
    useState<RoleKey>('superAdmin');

  const [permissions, setPermissions] =
    useState<Record<RoleKey, Permission[]>>(permissionsByRole);

  const [saved, setSaved] = useState(false);

  const activeRole = roles.find(
    (role) => role.key === selectedRole
  )!;

  const activePermissions = permissions[selectedRole];

  const togglePermission = (
    permissionId: string,
    type: 'read' | 'create' | 'edit' | 'delete'
  ) => {
    setPermissions((current) => ({
      ...current,
      [selectedRole]: current[selectedRole].map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              [type]: !permission[type],
            }
          : permission
      ),
    }));

    setSaved(false);
  };

  const savePermissions = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-[19px] font-extrabold tracking-tight text-slate-900">
          Permission Matrix
        </h1>

        <p className="mt-1 text-[11px] font-medium text-slate-400">
          Configure access controls for each role
        </p>
      </div>

      {/* ROLE SELECTOR */}
      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm">
        <div className="flex gap-1 min-w-max lg:grid lg:min-w-0 lg:grid-cols-7">

          {roles.map((role) => {
            const active = selectedRole === role.key;

            return (
              <button
                key={role.key}
                type="button"
                onClick={() => {
                  setSelectedRole(role.key);
                  setSaved(false);
                }}
                className={`group flex min-h-[62px] flex-col items-center justify-center rounded-lg px-2 py-2 transition-all ${
                  active
                    ? 'bg-rose-50 text-rose-500'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    active
                      ? 'bg-white text-rose-500 shadow-sm'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {role.icon}
                </span>

                <span
                  className={`mt-1.5 text-[8px] font-extrabold tracking-wide ${
                    active
                      ? 'text-rose-500'
                      : 'text-slate-400'
                  }`}
                >
                  {role.name}
                </span>
              </button>
            );
          })}

        </div>
      </div>

      {/* PERMISSION CARD */}
      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-4 sm:px-5">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <ShieldCheck size={17} />
            </div>

            <div>
              <h2 className="text-[13px] font-extrabold text-slate-900">
                {activeRole.name}
              </h2>

              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                {activeRole.description}
              </p>
            </div>

          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-slate-500">
              Active role
            </span>
          </div>

        </div>

        {/* PERMISSION MATRIX — desktop */}
        <div className="hidden sm:block w-full min-w-0 overflow-x-auto overscroll-x-contain">

          <table className="w-full min-w-[700px] border-collapse">

            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">

                <th className="w-[45%] px-5 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Permission
                </th>

                <th className="w-[13.75%] px-2 py-3 text-center text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Read
                </th>

                <th className="w-[13.75%] px-2 py-3 text-center text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Create
                </th>

                <th className="w-[13.75%] px-2 py-3 text-center text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Edit
                </th>

                <th className="w-[13.75%] px-2 py-3 text-center text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Delete
                </th>

              </tr>
            </thead>

            <tbody>

              {activePermissions.map((permission) => (
                <tr
                  key={permission.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40"
                >

                  <td className="px-5 py-3">

                    <div className="flex items-center gap-2.5">

                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">

                        {permission.id.includes('users') ? (
                          <Users size={13} />
                        ) : permission.id.includes('projects') ? (
                          <FolderKanban size={13} />
                        ) : permission.id.includes('reports') ? (
                          <BarChart3 size={13} />
                        ) : permission.id.includes('sprints') ? (
                          <Settings size={13} />
                        ) : (
                          <CheckSquare size={13} />
                        )}

                      </div>

                      <div>

                        <p className="text-[10px] font-bold text-slate-700">
                          {permission.name}
                        </p>

                        <p className="mt-0.5 text-[8px] font-medium text-slate-400">
                          {permission.description}
                        </p>

                      </div>

                    </div>

                  </td>

                  <td className="px-2 py-3 text-center">
                    <PermissionToggle
                      enabled={permission.read}
                      onClick={() =>
                        togglePermission(permission.id, 'read')
                      }
                    />
                  </td>

                  <td className="px-2 py-3 text-center">
                    <PermissionToggle
                      enabled={permission.create}
                      onClick={() =>
                        togglePermission(permission.id, 'create')
                      }
                    />
                  </td>

                  <td className="px-2 py-3 text-center">
                    <PermissionToggle
                      enabled={permission.edit}
                      onClick={() =>
                        togglePermission(permission.id, 'edit')
                      }
                    />
                  </td>

                  <td className="px-2 py-3 text-center">
                    <PermissionToggle
                      enabled={permission.delete}
                      onClick={() =>
                        togglePermission(permission.id, 'delete')
                      }
                    />
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {/* PERMISSION MATRIX — mobile */}
        <div className="sm:hidden divide-y divide-slate-100">
          {activePermissions.map((permission) => (
            <div key={permission.id} className="px-4 py-3">
              <p className="text-[11px] font-bold text-slate-700 mb-0.5">{permission.name}</p>
              <p className="text-[9px] text-slate-400 mb-2">{permission.description}</p>
              <div className="grid grid-cols-4 gap-2">
                {(['read', 'create', 'edit', 'delete'] as const).map((type) => (
                  <div key={type} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-extrabold uppercase tracking-wide text-slate-400">{type}</span>
                    <PermissionToggle
                      enabled={permission[type]}
                      onClick={() => togglePermission(permission.id, type)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <div className="flex flex-wrap items-center gap-2 text-[9px] font-medium text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ON = Allowed

            <span className="ml-2 h-2 w-2 rounded-full bg-slate-300" />
            OFF = Restricted
          </div>

          <button
            type="button"
            onClick={savePermissions}
            className="w-full rounded-lg bg-[#101827] px-4 py-2 text-[10px] font-bold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            {saved ? 'Saved ✓' : 'Save Permissions'}
          </button>

        </div>

      </section>

    </div>
  );
};

export default SuperAdminRoles;