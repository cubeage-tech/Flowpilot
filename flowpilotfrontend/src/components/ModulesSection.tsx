import React from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Columns3, 
  Flame, 
  TrendingUp, 
  Bell, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';

export const ModulesSection: React.FC = () => {
  const modules = [
    {
      num: 3,
      icon: <FolderKanban className="text-amber-600" size={24} />,
      title: 'Project Management',
      desc: 'Centralized repo — project health, budget status, timeline, active sprint, pending tasks, completion % per project.',
      bgClass: 'bg-amber-100'
    },
    {
      num: 4,
      icon: <CheckSquare className="text-emerald-600" size={24} />,
      title: 'Task Management',
      desc: '15+ task fields: story points, estimated/actual hours, dependencies, labels, priority, assignee, attachments, comments.',
      bgClass: 'bg-emerald-100'
    },
    {
      num: 5,
      icon: <Columns3 className="text-sky-600" size={24} />,
      title: 'Scrum Board',
      desc: '8-column Kanban with drag-and-drop, WIP limits, sprint selector, quick edit, search, color labels, and priority badges.',
      bgClass: 'bg-sky-100'
    },
    {
      num: 6,
      icon: <Flame className="text-purple-600" size={24} />,
      title: 'Sprint Management',
      desc: 'Sprint creation with goals, duration, capacity, and backlog selection. Auto velocity calculation and burndown chart.',
      bgClass: 'bg-purple-100'
    },
    {
      num: 7,
      icon: <TrendingUp className="text-indigo-600" size={24} />,
      title: 'Progress Tracking',
      desc: 'Burndown, burnup, velocity, completion %, task distribution analytics by epic and team member.',
      bgClass: 'bg-indigo-100'
    },
    {
      num: 8,
      icon: <Bell className="text-amber-600" size={24} />,
      title: 'Notifications',
      desc: 'Email, browser push, and in-app alerts for task assignment, status updates, and deadline reminders.',
      bgClass: 'bg-amber-50'
    },
    {
      num: 9,
      icon: <FileText className="text-teal-600" size={24} />,
      title: 'Reports',
      desc: '7 report types: project, sprint, employee, department, workload, deadline audit, and export to PDF/Excel.',
      bgClass: 'bg-teal-100'
    },
    {
      num: 10,
      icon: <ShieldCheck className="text-slate-600" size={24} />,
      title: 'Administration',
      desc: 'Full control over users, departments, roles, permissions, system logs, backups, and audit trail.',
      bgClass: 'bg-slate-100'
    }
  ];

  return (
    <section className="py-24 px-6 max-w-[1240px] mx-auto">
      <div className="text-center max-w-[850px] mx-auto mb-14">
        <span className="inline-block text-xs font-extrabold tracking-[0.2em] text-emerald-500 uppercase mb-4">
          PLATFORM FEATURES
        </span>
        <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
          10 modules. Zero compromises.
        </h2>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed font-medium max-w-[620px] mx-auto">
          Every module built from the SRS — not bolted on. All integrated, all real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        {modules.map((m) => (
          <div key={m.num} className="bg-white/85 backdrop-blur-md border border-white/90 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.bgClass}`}>
                  {m.icon}
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                  Module {m.num}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-2">{m.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
