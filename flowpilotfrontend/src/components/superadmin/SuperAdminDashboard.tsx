import React, { useEffect, useState } from 'react';
import { Plus, FileText, Settings } from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

interface DashboardRecentUser {
  name: string;
  role: string;
  department: string;
  createdAt: string;
  initials?: string;
}

interface DashboardHealth {
  name: string;
  value?: number;
  status?: string;
}

interface DashboardData {
  totalUsers: number;
  departments: number;
  activeProjects: number;
  systemUptime: string;
  recentUsers: DashboardRecentUser[];
  systemHealth: DashboardHealth[];
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
}) => {
  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);

  const [dashboardError, setDashboardError] =
    useState<string>('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(
          'http://localhost:8080/api/superadmin/dashboard',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data: DashboardData =
          await response.json();

        setDashboardData(data);
        setDashboardError('');
      } catch (error) {
        console.error(
          'Error loading Super Admin dashboard:',
          error
        );

        setDashboardError(
          'Unable to load dashboard data'
        );
      }
    };

    fetchDashboard();
  }, []);

  const getInitials = (name: string): string => {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) => part.charAt(0).toUpperCase()
      )
      .join('');
  };

  const formatRelativeTime = (
    createdAt: string
  ): string => {
    const createdDate =
      new Date(createdAt);

    const now = new Date();

    const differenceInSeconds = Math.floor(
      (now.getTime() -
        createdDate.getTime()) /
        1000
    );

    if (differenceInSeconds < 60) {
      return `${Math.max(
        0,
        differenceInSeconds
      )} sec ago`;
    }

    const differenceInMinutes = Math.floor(
      differenceInSeconds / 60
    );

    if (differenceInMinutes < 60) {
      return `${differenceInMinutes} min ago`;
    }

    const differenceInHours = Math.floor(
      differenceInMinutes / 60
    );

    if (differenceInHours < 24) {
      return `${differenceInHours}h ago`;
    }

    const differenceInDays = Math.floor(
      differenceInHours / 24
    );

    return `${differenceInDays}d ago`;
  };

  const recentUsers =
    dashboardData?.recentUsers ?? [];

  const systemHealth =
    dashboardData?.systemHealth ?? [];

  const statistics = [
    {
      title: 'TOTAL USERS',
      value:
        dashboardData?.totalUsers?.toString() ?? '—',
      footer: dashboardError
        ? 'Unavailable'
        : 'Live data',
      footerColor: '#10b981',
    },
    {
      title: 'DEPARTMENTS',
      value:
        dashboardData?.departments?.toString() ?? '—',
      footer: dashboardError
        ? 'Unavailable'
        : 'All active',
      footerColor: '#10b981',
    },
    {
      title: 'ACTIVE PROJECTS',
      value:
        dashboardData?.activeProjects?.toString() ?? '—',
      footer: dashboardError
        ? 'Unavailable'
        : 'Live data',
      footerColor: '#10b981',
    },
    {
      title: 'SYSTEM UPTIME',
      value:
        dashboardData?.systemUptime ?? '—',
      footer: dashboardError
        ? 'Unavailable'
        : 'Current status',
      footerColor: '#10b981',
    },
  ];

  return (
    <div className="w-full min-w-0 font-['Plus_Jakarta_Sans',sans-serif]">

      {/* STATISTICS */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statistics.map((stat) => (
          <div
            key={stat.title}
            className="min-w-0 rounded-[18px] border border-[#efefef] bg-white px-4 py-4 md:px-6 md:py-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
          >
            <div className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.05em] text-[#8c94a0]">
              {stat.title}
            </div>
            <div className="text-[26px] md:text-[34px] font-extrabold leading-none tracking-tight text-[#0a0a0a] my-2">
              {stat.value}
            </div>
            <div className="text-[11px] md:text-[12px] font-semibold" style={{ color: stat.footerColor }}>
              {stat.footer}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN TWO-COLUMN SECTION */}

      <div
        className="
          mt-7
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-2
        "
      >

        {/* RECENT USERS */}

        <div
          className="
            min-w-0
            h-auto
            rounded-[18px]
            border
            border-[#efefef]
            bg-white
            px-6
            py-5
            shadow-[0_2px_8px_rgba(0,0,0,0.02)]
          "
        >
          <h3
            className="
              mb-3
              text-[16px]
              font-bold
              text-[#0a0a0a]
            "
          >
            Recent User Registrations
          </h3>

          <div className="divide-y divide-[#f2f2f2]">

            {recentUsers.map((user) => (
              <div
                key={`${user.name}-${user.createdAt}`}
                className="
                  flex
                  min-w-0
                  items-center
                  justify-between
                  gap-3
                  py-[11px]
                "
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#3cd19c]
                      text-[12px]
                      font-bold
                      text-white
                    "
                  >
                    {user.initials || getInitials(user.name)}
                  </div>

                  <div className="min-w-0">

                    <div
                      className="
                        truncate
                        text-[13px]
                        font-bold
                        text-[#0a0a0a]
                      "
                    >
                      {user.name}
                    </div>

                    <div
                      className="
                        mt-0.5
                        truncate
                        text-[11px]
                        font-medium
                        text-[#8c94a0]
                      "
                    >
                      {user.role} · {user.department}
                    </div>

                  </div>

                </div>

                <span
                  className="
                    shrink-0
                    whitespace-nowrap
                    text-[11px]
                    font-medium
                    text-[#8c94a0]
                  "
                >
                  {formatRelativeTime(user.createdAt)}
                </span>

              </div>
            ))}

          </div>
        </div>

        {/* SYSTEM HEALTH */}

        <div
          className="
            min-w-0
            rounded-[18px]
            border
            border-[#efefef]
            bg-white
            px-6
            py-5
            shadow-[0_2px_8px_rgba(0,0,0,0.02)]
          "
        >
          <h3
            className="
              mb-5
              text-[16px]
              font-bold
              text-[#0a0a0a]
            "
          >
            System Health
          </h3>

          <div className="space-y-[14px]">

            {systemHealth.map((service) => (
              <div
                key={service.name}
                className="min-w-0"
              >

                <div
                  className="
                    mb-[6px]
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <span
                    className="
                      truncate
                      text-[13px]
                      font-medium
                      text-[#333b48]
                    "
                  >
                    {service.name}
                  </span>

                  <span
                    className="
                      shrink-0
                      text-[13px]
                      font-bold
                    "
                    style={{
                      color:
                        service.status === 'DOWN'
                          ? '#ef4444'
                          : '#10b981',
                    }}
                  >
                    {typeof service.value === 'number'
                      ? `${service.value}%`
                      : service.status === 'UP'
                        ? '100%'
                        : service.status === 'DOWN'
                          ? '0%'
                          : 'N/A'}
                  </span>
                </div>

                <div
                  className="
                    h-[5px]
                    w-full
                    overflow-hidden
                    rounded-full
                    bg-[#f1f5f9]
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      transition-all
                      duration-300
                    "
                    style={{
                      width: `${
                        typeof service.value === 'number'
                          ? service.value
                          : service.status === 'UP'
                            ? 100
                            : 0
                      }%`,
                      backgroundColor:
                        service.status === 'DOWN'
                          ? '#ef4444'
                          : '#10b981',
                    }}
                  />
                </div>

              </div>
            ))}

          </div>
        </div>

      </div>

      {/* QUICK ACTIONS */}

      <div
        className="
          mt-5
          min-w-0
          rounded-[18px]
          border
          border-[#efefef]
          bg-white
          px-6
          py-5
          shadow-[0_2px_8px_rgba(0,0,0,0.02)]
        "
      >

        <h3
          className="
            mb-4
            text-[16px]
            font-bold
            text-[#0a0a0a]
          "
        >
          Quick Actions
        </h3>

        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            lg:flex
            lg:flex-wrap
          "
        >

          {/* ADD USER */}

          <button
            type="button"
            onClick={() => onNavigate?.('User Management')}
            className="
              flex
              h-[44px]
              w-full
              cursor-pointer
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[#bbf7d0]
              bg-[#f0fdf4]
              px-5
              text-[12px]
              font-bold
              text-[#16a34a]
              transition-colors
              hover:bg-[#dcfce7]
              lg:w-auto
            "
          >
            <Plus size={16} strokeWidth={2.5} />
            Add User
          </button>

          {/* NEW DEPARTMENT */}

          <button
            type="button"
            onClick={() => onNavigate?.('Departments')}
            className="
              flex
              h-[44px]
              w-full
              cursor-pointer
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[#e9d5ff]
              bg-[#faf5ff]
              px-5
              text-[12px]
              font-bold
              text-[#9333ea]
              transition-colors
              hover:bg-[#f3e8ff]
              lg:w-auto
            "
          >
            <Plus size={16} strokeWidth={2.5} />
            New Department
          </button>

          {/* AUDIT LOGS */}

          <button
            type="button"
            onClick={() => onNavigate?.('Audit Logs')}
            className="
              flex
              h-[44px]
              w-full
              cursor-pointer
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[#fecdd3]
              bg-[#fff1f2]
              px-5
              text-[12px]
              font-bold
              text-[#e11d48]
              transition-colors
              hover:bg-[#ffe4e6]
              lg:w-auto
            "
          >
            <FileText size={16} strokeWidth={2.5} />
            View Audit Logs
          </button>

          {/* SYSTEM SETTINGS */}

          <button
            type="button"
            onClick={() => onNavigate?.('System Settings')}
            className="
              flex
              h-[44px]
              w-full
              cursor-pointer
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[#e2e8f0]
              bg-white
              px-5
              text-[12px]
              font-bold
              text-[#475569]
              transition-colors
              hover:bg-[#f8fafc]
              lg:w-auto
            "
          >
            <Settings size={16} strokeWidth={2.5} />
            System Settings
          </button>

        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;