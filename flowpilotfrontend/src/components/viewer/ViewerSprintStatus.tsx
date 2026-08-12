import React from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  Users,
  Flag,
  Circle,
  MoreHorizontal,
} from 'lucide-react';

export const ViewerSprintStatus: React.FC = () => {
  const tasks = [
    {
      name: 'Authentication flow',
      owner: 'AK',
      priority: 'High',
      status: 'Completed',
      statusColor:
        'bg-emerald-50 text-emerald-600 border-emerald-200',
      priorityColor:
        'bg-rose-50 text-rose-600 border-rose-200',
    },
    {
      name: 'Dashboard UI implementation',
      owner: 'VP',
      priority: 'High',
      status: 'In Progress',
      statusColor:
        'bg-blue-50 text-blue-600 border-blue-200',
      priorityColor:
        'bg-rose-50 text-rose-600 border-rose-200',
    },
    {
      name: 'API integration',
      owner: 'RS',
      priority: 'Medium',
      status: 'In Progress',
      statusColor:
        'bg-blue-50 text-blue-600 border-blue-200',
      priorityColor:
        'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      name: 'Testing and bug fixes',
      owner: 'NK',
      priority: 'Medium',
      status: 'Pending',
      statusColor:
        'bg-slate-50 text-slate-500 border-slate-200',
      priorityColor:
        'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      name: 'Documentation',
      owner: 'SM',
      priority: 'Low',
      status: 'Pending',
      statusColor:
        'bg-slate-50 text-slate-500 border-slate-200',
      priorityColor:
        'bg-slate-50 text-slate-500 border-slate-200',
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">
            VIEWER
          </div>

          <div className="text-2xl font-black text-slate-900">
            Sprint Status
          </div>

          <div className="text-sm text-slate-400 mt-1">
            Track sprint progress, delivery and current tasks.
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />

          <span className="text-xs font-bold text-slate-700">
            Sprint 12
          </span>

          <span className="text-xs text-slate-400">
            · 8 days remaining
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <Flame size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            SPRINT PROGRESS
          </div>

          <div className="text-3xl font-black text-slate-900">
            72%
          </div>

          <div className="text-xs text-slate-400 mt-2">
            18 of 25 tasks completed
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle2 size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            COMPLETED
          </div>

          <div className="text-3xl font-black text-emerald-500">
            18
          </div>

          <div className="text-xs text-slate-400 mt-2">
            Tasks completed
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
            <Clock size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            IN PROGRESS
          </div>

          <div className="text-3xl font-black text-slate-900">
            05
          </div>

          <div className="text-xs text-slate-400 mt-2">
            Currently active
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <Flag size={18} />
          </div>

          <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
            SPRINT HEALTH
          </div>

          <div className="text-3xl font-black text-emerald-500">
            Good
          </div>

          <div className="text-xs text-slate-400 mt-2">
            On track for delivery
          </div>
        </div>
      </div>

      {/* Sprint Progress + Team */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Progress */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                CURRENT SPRINT
              </div>

              <div className="text-lg font-extrabold text-slate-900 mt-1">
                Sprint 12 Progress
              </div>
            </div>

            <span className="text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
              On Track
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-5xl font-black text-slate-900">
                72%
              </div>

              <div className="text-xs text-slate-400 mt-2">
                Overall completion
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-extrabold text-slate-900">
                18 / 25
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Tasks completed
              </div>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-7">
            <div
              className="h-full bg-emerald-500"
              style={{ width: '72%' }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
            <span>START · AUG 04</span>
            <span>END · AUG 15</span>
          </div>

          {/* Milestones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900">
                  Planning
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5">
                  Aug 04
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900">
                  Development
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5">
                  Aug 10
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Circle size={17} />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900">
                  Review
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5">
                  Aug 15
                </div>
              </div>
            </div>

          </div>
        </div>


        {/* Team */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                TEAM
              </div>

              <div className="text-lg font-extrabold text-slate-900 mt-1">
                Sprint Team
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>

          <div className="space-y-5">

            {[
              {
                initials: 'AK',
                name: 'Aarav Kulkarni',
                role: 'Frontend Developer',
              },
              {
                initials: 'VP',
                name: 'Vedant Patil',
                role: 'Frontend Developer',
              },
              {
                initials: 'RS',
                name: 'Rohan Sharma',
                role: 'Backend Developer',
              },
              {
                initials: 'NK',
                name: 'Neha Kulkarni',
                role: 'UI / UX Designer',
              },
              {
                initials: 'SM',
                name: 'Sahil Mehta',
                role: 'QA Engineer',
              },
            ].map((member) => (
              <div
                key={member.initials}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-extrabold">
                  {member.initials}
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {member.name}
                  </div>

                  <div className="text-xs text-slate-400 mt-0.5">
                    {member.role}
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>


      {/* Tasks */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">

        <div className="p-5 border-b border-slate-100 flex items-center justify-between">

          <div>
            <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              SPRINT TASKS
            </div>

            <div className="text-lg font-extrabold text-slate-900 mt-1">
              Task Progress
            </div>
          </div>

          <button className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100">
            <MoreHorizontal size={16} />
          </button>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">

                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Task
                </th>

                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Owner
                </th>

                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Priority
                </th>

                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Status
                </th>

              </tr>
            </thead>


            <tbody>

              {tasks.map((task) => (
                <tr
                  key={task.name}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >

                  <td className="px-5 py-4">

                    <div className="flex items-center gap-3">

                      {task.status === 'Completed' ? (
                        <CheckCircle2
                          size={18}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <Circle
                          size={18}
                          className="text-slate-300 shrink-0"
                        />
                      )}

                      <span className="text-sm font-bold text-slate-900">
                        {task.name}
                      </span>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-extrabold">
                      {task.owner}
                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <span
                      className={`text-[10px] font-bold border px-3 py-1 rounded-full ${task.priorityColor}`}
                    >
                      {task.priority}
                    </span>

                  </td>


                  <td className="px-5 py-4">

                    <span
                      className={`text-[10px] font-bold border px-3 py-1 rounded-full ${task.statusColor}`}
                    >
                      {task.status}
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