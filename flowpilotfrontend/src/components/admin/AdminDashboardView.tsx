import React from 'react';
import {
  UserPlus,
  Building2,
  UserX,
  KeyRound,
  Users,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const stats = [
    {
      title: 'ACTIVE USERS',
      value: '46',
      subtitle: '+3 this month',
      subtitleColor: 'text-amber-500',
    },
    {
      title: 'DEPARTMENTS',
      value: '6',
      subtitle: 'All operational',
      subtitleColor: 'text-emerald-500',
    },
    {
      title: 'OPEN TICKETS',
      value: '12',
      subtitle: '3 urgent',
      subtitleColor: 'text-rose-500',
    },
    {
      title: 'PENDING APPROVALS',
      value: '5',
      subtitle: 'Role changes',
      subtitleColor: 'text-purple-500',
    },
  ];

  const activities = [
    {
      text: 'Role assigned to Rohit Varma: Business Analyst',
      time: '2h ago',
      icon: UserPlus,
    },
    {
      text: 'New department "DevOps" created',
      time: '5h ago',
      icon: Building2,
    },
    {
      text: 'User Divya Mehta disabled — inactive 30 days',
      time: 'Yesterday',
      icon: UserX,
    },
    {
      text: 'Password reset for Vikram Jain',
      time: '2 days ago',
      icon: KeyRound,
    },
    {
      text: '12 users onboarded to IPMT Platform v2',
      time: 'Last week',
      icon: Users,
    },
  ];

  const roles = [
    {
      role: 'Developer',
      count: 18,
      width: '75%',
      color: 'bg-teal-400',
    },
    {
      role: 'QA Engineer',
      count: 7,
      width: '30%',
      color: 'bg-emerald-400',
    },
    {
      role: 'Project Manager',
      count: 4,
      width: '18%',
      color: 'bg-purple-400',
    },
    {
      role: 'Scrum Master',
      count: 3,
      width: '14%',
      color: 'bg-emerald-500',
    },
    {
      role: 'Admin',
      count: 2,
      width: '10%',
      color: 'bg-amber-400',
    },
    {
      role: 'Viewer',
      count: 8,
      width: '35%',
      color: 'bg-indigo-400',
    },
    {
      role: 'Others',
      count: 6,
      width: '25%',
      color: 'bg-slate-300',
    },
  ];

  return (
    <div className="w-full space-y-5">

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="
              bg-white
              border border-slate-200/70
              rounded-xl
              px-3 md:px-5
              py-3 md:py-4
              shadow-[0_4px_18px_rgba(15,23,42,0.05)]
            "
          >
            <div className="text-[9px] md:text-[11px] font-bold tracking-[0.04em] text-slate-500 uppercase mb-1 md:mb-2">
              {stat.title}
            </div>

            <div className="text-[22px] md:text-[28px] leading-none font-bold text-[#111111] mb-1 md:mb-2">
              {stat.value}
            </div>

            <div
              className={`text-[9px] md:text-[11px] leading-none font-semibold ${stat.subtitleColor}`}
            >
              {stat.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">

        {/* Recent Activity */}
        <div
          className="
            bg-white
            border border-slate-200/70
            rounded-xl
            px-5
            py-5
            shadow-[0_4px_18px_rgba(15,23,42,0.05)]
          "
        >
          <h3 className="text-[15px] font-bold text-[#111111] mb-4">
            Recent Activity
          </h3>

          <div>
            {activities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.text}
                  className={`
                    flex
                    items-start
                    gap-3
                    py-2.5
                    ${
                      index !== activities.length - 1
                        ? 'border-b border-slate-100'
                        : ''
                    }
                  `}
                >
                  <div
                    className="
                    w-8
                    h-8
                    rounded-lg
                    bg-slate-100
                    flex
                    items-center
                    justify-center
                    shrink-0
                    "
                  >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    className="text-slate-500"
                  />
                </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-[14px] leading-[19px] font-semibold text-[#111111]">
                      {activity.text}
                    </div>

                    <div className="text-[11px] leading-[15px] font-medium text-[#666666] mt-0.5">
                      {activity.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Role Distribution */}
        <div
          className="
          bg-white
          border border-slate-200/70
          rounded-xl
          px-5
          py-5
          shadow-[0_4px_18px_rgba(15,23,42,0.05)]
  "
>
  <h3 className="text-[15px] font-bold text-[#111111] mb-4">
    User Role Distribution
  </h3>

  <div className="space-y-3">
    {roles.map((item) => (
      <div key={item.role}>
        {/* Role + Number */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] leading-[16px] font-medium text-[#111111]">
            {item.role}
          </span>

          <span className="text-[12px] leading-[16px] font-bold text-[#111111]">
            {item.count}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${item.color}`}
            style={{ width: item.width }}
          />
        </div>
      </div>
    ))}
  </div>
</div>
      </div>
    </div>
  );
};