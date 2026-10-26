import React, { useState } from 'react';
import { Crown, Shield, FolderKanban, UserCheck, Laptop, PenTool, Eye, ArrowRight, Check } from 'lucide-react';

export const RolesSection: React.FC = () => {
  const [activeRoleId, setActiveRoleId] = useState('admin');

  const roles = [
    {
      id: 'super-admin',
      name: 'Super Admin',
      icon: <Crown className="text-amber-500" size={18} />,
      color: 'amber',
      accentBorder: 'border-t-amber-500',
      activeBg: 'bg-amber-50/70 border-amber-200 text-amber-900',
      pillBg: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
      desc: 'Complete organization-wide control. Full read, write, delete, and billing access across all modules.',
      permissions: [
        'Full system access',
        'Manage billing & subscription',
        'Delete organization / projects',
        'Configure system settings',
        'Override all permissions',
        'Access audit logs'
      ]
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: <Shield className="text-amber-600" size={18} />,
      color: 'amber',
      accentBorder: 'border-t-amber-500',
      activeBg: 'bg-amber-50/70 border-amber-200 text-amber-900',
      pillBg: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
      desc: 'Administrative control without permanent deletion rights. Manages the organizational structure.',
      permissions: [
        'Manage users',
        'Create & edit projects',
        'Assign roles',
        'View all reports',
        'Manage departments',
        'Configure notifications'
      ]
    },
    {
      id: 'project-manager',
      name: 'Project Manager',
      icon: <FolderKanban className="text-purple-500" size={18} />,
      color: 'purple',
      accentBorder: 'border-t-purple-500',
      activeBg: 'bg-purple-50/70 border-purple-200 text-purple-900',
      pillBg: 'bg-purple-50/80 text-purple-800 border-purple-200/60',
      desc: 'Owns project delivery. Plans sprints, assigns work, and tracks project health from the PM dashboard.',
      permissions: [
        'Create & manage projects',
        'Sprint planning',
        'Assign tasks to team',
        'View full analytics',
        'Export reports',
        'Manage team members'
      ]
    },
    {
      id: 'scrum-master',
      name: 'Scrum Master',
      icon: <UserCheck className="text-emerald-500" size={18} />,
      color: 'emerald',
      accentBorder: 'border-t-emerald-500',
      activeBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      pillBg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/60',
      desc: 'Facilitates the Scrum process. Removes blockers, manages sprint ceremonies, and tracks team velocity.',
      permissions: [
        'Manage sprints',
        'Scrum board admin',
        'Run retrospectives',
        'View velocity charts',
        'Manage blockers',
        'Facilitate ceremonies'
      ]
    },
    {
      id: 'developer',
      name: 'Developer',
      icon: <Laptop className="text-cyan-500" size={18} />,
      color: 'cyan',
      accentBorder: 'border-t-cyan-400',
      activeBg: 'bg-cyan-50/70 border-cyan-200 text-cyan-900',
      pillBg: 'bg-cyan-50/80 text-cyan-800 border-cyan-200/60',
      desc: 'Executes development tasks. Moves cards, logs effort, comments on requirements, and attaches code references.',
      permissions: [
        'View assigned tasks',
        'Update task status',
        'Add comments',
        'Upload attachments',
        'Log actual hours',
        'View sprint board'
      ]
    },
    {
      id: 'qa-engineer',
      name: 'QA Engineer',
      icon: <PenTool className="text-emerald-500" size={18} />,
      color: 'emerald',
      accentBorder: 'border-t-emerald-400',
      activeBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      pillBg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/60',
      desc: 'Validates feature delivery. Files bugs, links them to tasks, and signs off on completion criteria.',
      permissions: [
        'View all tasks',
        'File bug reports',
        'Update test status',
        'Comment on tasks',
        'View project reports',
        'Access test history'
      ]
    },
    {
      id: 'viewer',
      name: 'Viewer',
      icon: <Eye className="text-slate-500" size={18} />,
      color: 'slate',
      accentBorder: 'border-t-slate-300',
      activeBg: 'bg-slate-100/70 border-slate-200 text-slate-900',
      pillBg: 'bg-slate-50 text-slate-700 border-slate-200/60',
      desc: 'Client or stakeholder access. Can see progress and reports without being able to modify any data.',
      permissions: [
        'Read-only dashboard',
        'View sprint board',
        'Read reports',
        'No task editing',
        'No project changes',
        'No export access'
      ]
    }
  ];

  const currentRole = roles.find(r => r.id === activeRoleId) || roles[1];

  return (
    <section className="py-24 px-6 max-w-[1240px] mx-auto">
      {/* Header */}
      <div className="text-center max-w-[750px] mx-auto mb-16">
        <span className="inline-block text-xs font-extrabold tracking-widest text-emerald-600 uppercase mb-3">
          ROLE-BASED ACCESS CONTROL
        </span>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-5">
          7 roles. Granular permissions.
        </h2>
        <p className="text-base text-slate-500 leading-relaxed font-medium">
          Every action gated by role. Super Admin to Viewer — everyone sees exactly what they should.
        </p>
      </div>

      {/* Main Roles Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

        {/* Left Roles Sidebar Selector */}
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-1.5">
          {roles.map(role => {
            const isSelected = role.id === activeRoleId;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRoleId(role.id)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${isSelected
                    ? `${role.activeBg} border shadow-xs`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span>{role.icon}</span>
                  <span>{role.name}</span>
                </div>
                {isSelected && <ArrowRight size={14} className="text-current" />}
              </button>
            );
          })}
        </div>

        {/* Right Active Role Granular Details Card matching Figma Screenshots */}
        <div className={`bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-900/5 overflow-hidden border-t-4 ${currentRole.accentBorder}`}>

          {/* Card Main Info */}
          <div className="p-8 sm:p-10 border-b border-slate-100">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                {React.cloneElement(currentRole.icon, { size: 32 })}
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{currentRole.name}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[540px]">
                  {currentRole.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Granted Area */}
          <div className="p-8 sm:p-10 bg-slate-50/40">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-5">
              PERMISSIONS GRANTED
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {currentRole.permissions.map((perm, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition-all ${currentRole.pillBg}`}
                >
                  <Check size={14} className="shrink-0 text-current opacity-80" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
