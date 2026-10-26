import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Building2,
  UserX,
  KeyRound,
  Users,
} from 'lucide-react';

/* ============================================================
   TYPES
============================================================ */

interface Activity {
  text: string;
  time: string;
  type?: string;
}

interface RoleDistribution {
  role: string;
  count: number;
}

interface DashboardData {
  activeUsers: number;
  departments: number;
  openTickets: number;
  pendingApprovals: number;
  activities: Activity[];
  roleDistribution: RoleDistribution[];
}

/* ============================================================
   API
============================================================ */

const API_BASE_URL = 'http://localhost:8080';

const DASHBOARD_API =
  `${API_BASE_URL}/api/admin/dashboard`;

/* ============================================================
   ROLE COLORS
============================================================ */

const roleColors: Record<string, string> = {
  Developer: 'bg-teal-400',
  'QA Engineer': 'bg-emerald-400',
  'Project Manager': 'bg-purple-400',
  'Scrum Master': 'bg-emerald-500',
  Admin: 'bg-amber-400',
  Viewer: 'bg-indigo-400',
  'Super Admin': 'bg-blue-400',
  Others: 'bg-slate-300',
};

/* ============================================================
   ACTIVITY ICON
============================================================ */

const getActivityIcon = (type?: string) => {
  switch (type) {
    case 'USER':
      return UserPlus;

    case 'DEPARTMENT':
      return Building2;

    case 'DISABLE':
      return UserX;

    case 'PASSWORD':
      return KeyRound;

    default:
      return Users;
  }
};

/* ============================================================
   COMPONENT
============================================================ */

export const AdminDashboardView: React.FC = () => {

  /* ==========================================================
     STATE
  ========================================================== */

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>('');


  /* ==========================================================
     FETCH DASHBOARD DATA
  ========================================================== */

  const fetchDashboardData = async () => {

    try {

      setLoading(true);
      setError('');


      // ======================================================
      // GET JWT TOKEN
      // ======================================================

      const token =
        localStorage.getItem('token');


      if (!token) {

        throw new Error(
          'Authentication token not found. Please login again.'
        );
      }


      // ======================================================
      // API REQUEST
      // ======================================================

      const response =
        await fetch(
          DASHBOARD_API,
          {
            method: 'GET',

            headers: {
              'Content-Type': 'application/json',

              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      // ======================================================
      // ERROR HANDLING
      // ======================================================

      if (!response.ok) {

        if (response.status === 401) {

          throw new Error(
            'Your session has expired. Please login again.'
          );
        }


        if (response.status === 403) {

          throw new Error(
            'You do not have permission to access the Admin Dashboard.'
          );
        }


        throw new Error(
          `Failed to fetch dashboard data. Status: ${response.status}`
        );
      }


      // ======================================================
      // READ RESPONSE
      // ======================================================

      const data: DashboardData =
        await response.json();


      setDashboard(data);

    } catch (err) {

      console.error(
        'Dashboard API Error:',
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard data.'
      );

    } finally {

      setLoading(false);
    }
  };


  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  useEffect(() => {

    fetchDashboardData();

  }, []);


  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {

    return (
      <div className="w-full space-y-5">

        {/* Statistics Skeleton */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

          {[1, 2, 3, 4].map((item) => (

            <div
              key={item}
              className="
                bg-white
                border border-slate-200/70
                rounded-xl
                px-3 md:px-5
                py-3 md:py-4
                shadow-[0_4px_18px_rgba(15,23,42,0.05)]
                animate-pulse
              "
            >

              <div
                className="
                  h-3
                  w-20
                  bg-slate-200
                  rounded
                  mb-3
                "
              />

              <div
                className="
                  h-7
                  w-12
                  bg-slate-200
                  rounded
                  mb-2
                "
              />

              <div
                className="
                  h-3
                  w-24
                  bg-slate-200
                  rounded
                "
              />

            </div>

          ))}

        </div>


        {/* Bottom Skeleton */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-[1.2fr_0.8fr]
            gap-4
          "
        >

          {/* Activity Skeleton */}

          <div
            className="
              bg-white
              border border-slate-200/70
              rounded-xl
              px-5
              py-5
              shadow-[0_4px_18px_rgba(15,23,42,0.05)]
              animate-pulse
            "
          >

            <div
              className="
                h-5
                w-32
                bg-slate-200
                rounded
                mb-5
              "
            />

            {[1, 2, 3, 4, 5].map((item) => (

              <div
                key={item}
                className="
                  flex
                  items-start
                  gap-3
                  py-2.5
                "
              >

                <div
                  className="
                    w-8
                    h-8
                    bg-slate-200
                    rounded-lg
                    shrink-0
                  "
                />

                <div className="flex-1">

                  <div
                    className="
                      h-4
                      w-3/4
                      bg-slate-200
                      rounded
                      mb-2
                    "
                  />

                  <div
                    className="
                      h-3
                      w-16
                      bg-slate-200
                      rounded
                    "
                  />

                </div>

              </div>

            ))}

          </div>


          {/* Role Skeleton */}

          <div
            className="
              bg-white
              border border-slate-200/70
              rounded-xl
              px-5
              py-5
              shadow-[0_4px_18px_rgba(15,23,42,0.05)]
              animate-pulse
            "
          >

            <div
              className="
                h-5
                w-40
                bg-slate-200
                rounded
                mb-5
              "
            />

            {[1, 2, 3, 4, 5].map((item) => (

              <div
                key={item}
                className="mb-4"
              >

                <div
                  className="
                    flex
                    justify-between
                    mb-2
                  "
                >

                  <div
                    className="
                      h-3
                      w-24
                      bg-slate-200
                      rounded
                    "
                  />

                  <div
                    className="
                      h-3
                      w-5
                      bg-slate-200
                      rounded
                    "
                  />

                </div>

                <div
                  className="
                    w-full
                    h-[6px]
                    bg-slate-100
                    rounded-full
                  "
                />

              </div>

            ))}

          </div>

        </div>

      </div>
    );
  }


  /* ==========================================================
     ERROR STATE
  ========================================================== */

  if (error || !dashboard) {

    return (
      <div className="w-full">

        <div
          className="
            bg-white
            border border-slate-200/70
            rounded-xl
            px-5
            py-8
            shadow-[0_4px_18px_rgba(15,23,42,0.05)]
            text-center
          "
        >

          <div
            className="
              text-[14px]
              font-semibold
              text-rose-500
              mb-2
            "
          >
            {error ||
              'Unable to load dashboard data.'}
          </div>


          <button
            onClick={fetchDashboardData}
            className="
              text-[12px]
              font-semibold
              text-slate-700
              border
              border-slate-200
              rounded-lg
              px-4
              py-2
              hover:bg-slate-50
              transition
            "
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  /* ==========================================================
     STATISTICS
  ========================================================== */

  const stats = [
    {
      title: 'ACTIVE USERS',
      value:
        dashboard.activeUsers.toString(),
      subtitle: 'Currently active',
      subtitleColor: 'text-amber-500',
    },

    {
      title: 'DEPARTMENTS',
      value:
        dashboard.departments.toString(),
      subtitle: 'All operational',
      subtitleColor: 'text-emerald-500',
    },

    {
      title: 'OPEN TICKETS',
      value:
        dashboard.openTickets.toString(),
      subtitle:
        dashboard.openTickets > 0
          ? 'Requires attention'
          : 'No open tickets',
      subtitleColor: 'text-rose-500',
    },

    {
      title: 'PENDING APPROVALS',
      value:
        dashboard.pendingApprovals.toString(),
      subtitle:
        dashboard.pendingApprovals > 0
          ? 'Requires approval'
          : 'No pending approvals',
      subtitleColor: 'text-purple-500',
    },
  ];


  /* ==========================================================
     TOTAL USERS FOR ROLE DISTRIBUTION
  ========================================================== */

  const totalUsers =
    dashboard.roleDistribution.reduce(
      (total, item) =>
        total + item.count,
      0
    );


  /* ==========================================================
     RETURN
  ========================================================== */

  return (
    <div className="w-full space-y-5">


      {/* ======================================================
          Statistics Cards
      ====================================================== */}

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

            <div
              className="
                text-[9px]
                md:text-[11px]
                font-bold
                tracking-[0.04em]
                text-slate-500
                uppercase
                mb-1
                md:mb-2
              "
            >
              {stat.title}
            </div>


            <div
              className="
                text-[22px]
                md:text-[28px]
                leading-none
                font-bold
                text-[#111111]
                mb-1
                md:mb-2
              "
            >
              {stat.value}
            </div>


            <div
              className={`
                text-[9px]
                md:text-[11px]
                leading-none
                font-semibold
                ${stat.subtitleColor}
              `}
            >
              {stat.subtitle}
            </div>

          </div>

        ))}

      </div>


      {/* ======================================================
          Bottom Section
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[1.2fr_0.8fr]
          gap-4
        "
      >


        {/* ====================================================
            Recent Activity
        ==================================================== */}

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

          <h3
            className="
              text-[15px]
              font-bold
              text-[#111111]
              mb-4
            "
          >
            Recent Activity
          </h3>


          <div>

            {dashboard.activities.length === 0 ? (

              <div className="py-8 text-center">

                <div
                  className="
                    text-[13px]
                    font-medium
                    text-slate-400
                  "
                >
                  No recent activity
                </div>

              </div>

            ) : (

              dashboard.activities.map(
                (activity, index) => {

                  const Icon =
                    getActivityIcon(
                      activity.type
                    );


                  return (
                    <div
                      key={`${activity.text}-${index}`}
                      className={`
                        flex
                        items-start
                        gap-3
                        py-2.5
                        ${
                          index !==
                          dashboard.activities.length - 1
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


                      <div
                        className="
                          min-w-0
                          flex-1
                          pt-0.5
                        "
                      >

                        <div
                          className="
                            text-[14px]
                            leading-[19px]
                            font-semibold
                            text-[#111111]
                          "
                        >
                          {activity.text}
                        </div>


                        <div
                          className="
                            text-[11px]
                            leading-[15px]
                            font-medium
                            text-[#666666]
                            mt-0.5
                          "
                        >
                          {activity.time}
                        </div>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>


        {/* ====================================================
            User Role Distribution
        ==================================================== */}

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

          <h3
            className="
              text-[15px]
              font-bold
              text-[#111111]
              mb-4
            "
          >
            User Role Distribution
          </h3>


          <div className="space-y-3">

            {dashboard.roleDistribution.length === 0 ? (

              <div className="py-8 text-center">

                <div
                  className="
                    text-[13px]
                    font-medium
                    text-slate-400
                  "
                >
                  No role data available
                </div>

              </div>

            ) : (

              dashboard.roleDistribution.map(
                (item) => {

                  /* ==========================================
                     CALCULATE ROLE PERCENTAGE
                  ========================================== */

                  const percentage =
                    totalUsers > 0
                      ? (
                          item.count /
                          totalUsers
                        ) * 100
                      : 0;


                  const width =
                    `${Math.min(
                      percentage,
                      100
                    )}%`;


                  const color =
                    roleColors[item.role] ||
                    'bg-slate-300';


                  return (
                    <div key={item.role}>

                      {/* Role + Number */}

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          mb-1.5
                        "
                      >

                        <span
                          className="
                            text-[12px]
                            leading-[16px]
                            font-medium
                            text-[#111111]
                          "
                        >
                          {item.role}
                        </span>


                        <span
                          className="
                            text-[12px]
                            leading-[16px]
                            font-bold
                            text-[#111111]
                          "
                        >
                          {item.count}
                        </span>

                      </div>


                      {/* Progress Bar */}

                      <div
                        className="
                          w-full
                          h-[6px]
                          bg-slate-100
                          rounded-full
                          overflow-hidden
                        "
                      >

                        <div
                          className={`
                            h-full
                            rounded-full
                            ${color}
                          `}
                          style={{
                            width,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

      </div>

    </div>
  );
};