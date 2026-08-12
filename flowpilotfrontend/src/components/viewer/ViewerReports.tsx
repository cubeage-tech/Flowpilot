import React from 'react';
import {
  FileText,
  FolderKanban,
  CheckCircle2,
  Users,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

export const ViewerReports: React.FC = () => {
  const projects = [
    {
      id: 'PRJ-001',
      name: 'Flowpilot Platform v2',
      team: 'Product Team',
      progress: '72%',
      status: 'On Track',
      barColor: 'bg-emerald-500',
      badgeColor:
        'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'PRJ-002',
      name: 'E-Commerce Relaunch',
      team: 'Operations Team',
      progress: '45%',
      status: 'At Risk',
      barColor: 'bg-amber-500',
      badgeColor:
        'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'PRJ-003',
      name: 'Mobile App Development',
      team: 'Mobile Team',
      progress: '22%',
      status: 'On Track',
      barColor: 'bg-emerald-500',
      badgeColor:
        'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'PRJ-004',
      name: 'API Gateway Migration',
      team: 'Engineering Team',
      progress: '58%',
      status: 'Delayed',
      barColor: 'bg-rose-500',
      badgeColor:
        'bg-rose-50 text-rose-600 border-rose-200',
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">
            VIEWER REPORTS
          </div>

          <div className="text-2xl font-black text-slate-900">
            Reports & Analytics
          </div>

          <div className="text-sm text-slate-400 mt-1">
            Overview of project performance and delivery progress.
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">
          <FileText size={15} />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <FolderKanban size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            TOTAL PROJECTS
          </div>

          <div className="text-3xl font-black text-slate-900 leading-none">
            24
          </div>

          <div className="text-xs text-slate-400 mt-2">
            Projects being monitored
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle2 size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            COMPLETED
          </div>

          <div className="text-3xl font-black text-emerald-500 leading-none">
            16
          </div>

          <div className="text-xs text-slate-400 mt-2">
            Projects completed
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
            <Users size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            ACTIVE TEAMS
          </div>

          <div className="text-3xl font-black text-slate-900 leading-none">
            6
          </div>

          <div className="text-xs text-slate-400 mt-2">
            Teams currently involved
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <TrendingUp size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            OVERALL PROGRESS
          </div>

          <div className="text-3xl font-black text-slate-900 leading-none">
            76%
          </div>

          <div className="text-xs text-emerald-500 font-bold mt-2">
            +8.4% this sprint
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Project Health */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                PROJECT HEALTH
              </div>

              <div className="text-lg font-extrabold text-slate-900 mt-1">
                Overall Project Status
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="flex items-center justify-center py-6">
            <div className="w-40 h-40 rounded-full border-[14px] border-emerald-100 flex items-center justify-center relative">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900">
                  76%
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  HEALTH
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">
                  On Track
                </span>

                <span className="text-slate-900">
                  75%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: '75%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">
                  At Risk
                </span>

                <span className="text-slate-900">
                  17%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: '17%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">
                  Delayed
                </span>

                <span className="text-slate-900">
                  8%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: '8%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                PERFORMANCE
              </div>

              <div className="text-lg font-extrabold text-slate-900 mt-1">
                Weekly Progress
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <TrendingUp size={14} />
              +14.8%
            </div>
          </div>

          <div className="h-64 flex items-end gap-3">
            {[
              { day: 'MON', value: 55 },
              { day: 'TUE', value: 70 },
              { day: 'WED', value: 60 },
              { day: 'THU', value: 82 },
              { day: 'FRI', value: 72 },
              { day: 'SAT', value: 48 },
              { day: 'SUN', value: 66 },
            ].map((item) => (
              <div
                key={item.day}
                className="flex-1 h-full flex flex-col items-center justify-end gap-2"
              >
                <div className="w-full flex items-end h-full">
                  <div
                    className="w-full bg-emerald-500 rounded-t-lg"
                    style={{ height: `${item.value}%` }}
                  />
                </div>

                <span className="text-[9px] font-bold text-slate-400">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Report Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">

        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              PROJECT REPORT
            </div>

            <div className="text-lg font-extrabold text-slate-900 mt-1">
              Project Performance
            </div>
          </div>

          <button className="flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-600">
            View Details
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Project
                </th>

                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Team
                </th>

                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Progress
                </th>

                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {projects.map((prj) => (
                <tr
                  key={prj.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                      {prj.id}
                    </div>

                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {prj.name}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                    {prj.team}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${prj.barColor}`}
                          style={{ width: prj.progress }}
                        />
                      </div>

                      <span className="text-xs font-bold text-slate-900">
                        {prj.progress}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] font-bold border px-3 py-1 rounded-full ${prj.badgeColor}`}
                    >
                      {prj.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};