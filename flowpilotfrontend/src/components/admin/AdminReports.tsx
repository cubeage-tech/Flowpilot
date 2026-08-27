import React from 'react';
import {
  Users,
  Building2,
  Folder,
  GraduationCap,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

interface Report {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  buttonBg: string;
  buttonText: string;
  cardBorder: string;
  cardShadow: string;
}

const reports: Report[] = [
  {
    id: 1,
    title: 'User Activity Report',
    description: 'Login history, session times, feature usage per user',
    icon: <Users size={18} />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-purple-700',
    buttonBg: 'bg-amber-50 border-amber-100',
    buttonText: 'text-amber-500',
    cardBorder: 'border-amber-100',
    cardShadow: 'shadow-[0_3px_12px_rgba(245,158,11,0.06)]',
  },
  {
    id: 2,
    title: 'Department Summary',
    description: 'Members, projects, workload per department',
    icon: <Building2 size={18} />,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    buttonBg: 'bg-purple-50 border-purple-100',
    buttonText: 'text-purple-400',
    cardBorder: 'border-purple-100',
    cardShadow: 'shadow-[0_3px_12px_rgba(168,85,247,0.06)]',
  },
  {
    id: 3,
    title: 'Project Status Report',
    description: 'All projects, health, sprint progress, risk flags',
    icon: <Folder size={18} />,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    buttonBg: 'bg-emerald-50 border-emerald-100',
    buttonText: 'text-emerald-500',
    cardBorder: 'border-emerald-100',
    cardShadow: 'shadow-[0_3px_12px_rgba(16,185,129,0.06)]',
  },
  {
    id: 4,
    title: 'Onboarding Report',
    description: 'New users, pending setups, license usage',
    icon: <GraduationCap size={18} />,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-slate-700',
    buttonBg: 'bg-cyan-50 border-cyan-100',
    buttonText: 'text-cyan-400',
    cardBorder: 'border-cyan-100',
    cardShadow: 'shadow-[0_3px_12px_rgba(6,182,212,0.06)]',
  },
  {
    id: 5,
    title: 'Compliance & Audit',
    description: 'System events, permission changes, admin actions',
    icon: <ClipboardList size={18} />,
    iconBg: 'bg-rose-50',
    iconColor: 'text-orange-400',
    buttonBg: 'bg-rose-50 border-rose-100',
    buttonText: 'text-rose-500',
    cardBorder: 'border-rose-100',
    cardShadow: 'shadow-[0_3px_12px_rgba(244,63,94,0.06)]',
  },
  {
    id: 6,
    title: 'System Usage Report',
    description: 'Feature adoption, API calls, storage consumption',
    icon: <BarChart3 size={18} />,
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-500',
    buttonBg: 'bg-slate-100 border-slate-200',
    buttonText: 'text-slate-400',
    cardBorder: 'border-slate-200',
    cardShadow: 'shadow-[0_3px_12px_rgba(100,116,139,0.05)]',
  },
];

export const AdminReports: React.FC = () => {
  const handleGenerateReport = (reportTitle: string) => {
    console.log(`Generate report: ${reportTitle}`);
  };

  return (
    <div className="w-full space-y-5 font-sans">


      {/* ==================== REPORT GRID ==================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          md:grid-cols-2
          lg:grid-cols-3
        "
      >

        {reports.map((report) => (

          <div
            key={report.id}
            className={`
            w-full
            min-h-[166px]
            rounded-xl
            border
            ${report.cardBorder}
            bg-white
            pl-5
            px-4
            py-6
            ${report.cardShadow}
            transition-all
            duration-200
            hover:-translate-y-[1px]
            hover:shadow-md
            `}
          >

            {/* ==================== ICON ==================== */}

            <div
              className={`
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                ${report.iconBg}
                ${report.iconColor}
              `}
            >
              {report.icon}
            </div>

            {/* ==================== TITLE ==================== */}

            <h2
              className="
                mt-3
                text-[15px]
                font-extrabold
                leading-tight
                text-slate-800
              "
            >
              {report.title}
            </h2>

            {/* ==================== DESCRIPTION ==================== */}

            <p
              className="
                mt-1
                text-[13px]
                font-medium
                leading-relaxed
                text-slate-400
              "
            >
              {report.description}
            </p>

            {/* ==================== BUTTON ==================== */}

            <button
              type="button"
              onClick={() => handleGenerateReport(report.title)}
              className={`
                mt-3
                inline-flex
                items-center
                justify-center
                rounded-lg
                border
                px-3
                py-2
                text-[10px]
                sm:text-[11px]
                font-extrabold
                transition-all
                hover:brightness-95
                active:scale-[0.98]
                ${report.buttonBg}
                ${report.buttonText}
              `}
            >
              Generate Report
            </button>

          </div>

        ))}

      </div>

    </div>
  );
};

export default AdminReports;