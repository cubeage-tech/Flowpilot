import React from 'react';

export const PMDashboardView: React.FC = () => {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-[12px] font-bold tracking-wider text-slate-500 uppercase mb-3">MY PROJECTS</div>
          <div className="text-2xl font-bold font-black text-slate-900 leading-none mb-2">4</div>
          <div className="text-xs font-semibold text-purple-300">2 on schedule</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="text-[12px] font-bold tracking-wider text-slate-500 uppercase mb-3">ACTIVE SPRINT</div>
          <div className="text-2xl font-bold font-black text-slate-900 leading-none mb-2">Sprint 12</div>
          <div className="text-xs font-semibold text-emerald-400">18 tasks · 14 days left</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="text-[12px] font-bold tracking-wider text-slate-500 uppercase mb-3">COMPLETED TASKS</div>
          <div className="text-2xl font-bold font-black text-slate-900 leading-none mb-2">68%</div>
          <div className="text-xs font-semibold text-emerald-400">Sprint 12 progress</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="text-[12px] font-bold tracking-wider text-slate-500 uppercase mb-3">TEAM VELOCITY</div>
          <div className="text-2xl font-bold font-black text-slate-900 leading-none mb-2">41 SP</div>
          <div className="text-xs font-semibold text-emerald-300">↑ 12% vs last sprint</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Sprint 12 Progress</h3>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-1 rounded-full uppercase">On Track</span>
          </div>
          <div className="relative pt-1 pb-1">
            <svg viewBox="0 0 150 150" className="w-40 h-44 overflow-visible">
              <line x1="0" y1="20" x2="500" y2="130" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth="2" />
              <line x1="320" y1="0" x2="320" y2="150" stroke="#afa6b7" strokeDasharray="3 3" strokeWidth="1.5" />
              <text x="320" y="-5" fill="#a598b0" fontSize="10" fontWeight="bold" textAnchor="middle">Today</text>
              <path d="M0 20 L 100 45 L 200 55 L 320 90 L 400 115" fill="none" stroke="#a855f7" strokeWidth="3" />
              <path d="M0 20 L 100 45 L 200 55 L 320 90 L 400 115 L 400 150 L 0 150 Z" fill="url(#gradPurple)" opacity="0.15" />
              <defs>
                <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#413b47" />
                  <stop offset="100%" stopColor="#b4a0c6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex items-center gap-80 mt-1 text-xs font-semibold text-slate-500 justify-right">
              <div className="flex items-center gap-2">
                <span className="w-2 h-0.5 bg-slate-200"></span> Ideal
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-gray-200 "></span> Actual
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-5">Upcoming Milestones</h3>
          <div className="space-y-4">
            {[
              { title: 'Sprint 12 Demo', date: 'Aug 8, 2026', days: '4d', color: 'text-purple-400' },
              { title: 'Design Review', date: 'Aug 12, 2026', days: '8d', color: 'text-teal-400' },
              { title: 'Sprint 13 Planning', date: 'Aug 18, 2026', days: '14d', color: 'text-emerald-500' },
              { title: 'Q3 Release Freeze', date: 'Sep 1, 2026', days: '28d', color: 'text-rose-500' }
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${m.color.replace('text-', 'bg-')}`}></span>
                  <div>
                    <div className="text-[14px] font-semibold text-slate-900">{m.title}</div>
                    <div className="text-[12px] text-slate-400">{m.date}</div>
                  </div>
                </div>
                <span className={`text-xs font-bold ${m.color}`}>{m.days}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
