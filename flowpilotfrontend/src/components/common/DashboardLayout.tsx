import React, { useState } from 'react';

import {
  LayoutGrid,
  Users,
  FolderKanban,
  Shield,
  FileText,
  Bell,
  Settings,
  LogOut,
  Search,
  Clock,
  AlertTriangle,
  Activity,
  Flame,
  Calendar,
  Layers,
  CheckSquare
} from 'lucide-react';

import { SuperAdminDashboard } from '../superadmin/SuperAdminDashboard';
import { AdminDashboardView } from '../admin/AdminDashboardView';
import { PMDashboardView } from '../pm/PMDashboardView';
import { ScrumMasterDashboardView } from '../scrummaster/ScrumMasterDashboardView';
import { DeveloperDashboardView } from '../developer/DeveloperDashboardView';
import { QADashboardView } from '../qa/QADashboardView';

import { ViewerDashboardView } from '../viewer/ViewerDashboardView';
import { ViewerReports } from '../viewer/ViewerReports';
import { ViewerSprintStatus } from '../viewer/ViewerSprintStatus';


interface DashboardLayoutProps {
  userRole?: string;
  onLogout?: () => void;
}


export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  userRole = 'Super Admin',
  onLogout
}) => {

  const [activeTab, setActiveTab] = useState(
    userRole === 'Viewer' ? 'Projects' : 'Overview'
  );

  const currentDate = 'Friday, 7 August 2026';


  const getRoleConfig = (role: string) => {

    switch (role) {

      case 'Super Admin':
        return {
          label: 'SUPER ADMINISTRATOR',
          color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
          name: 'Rajeev Kumar',
          dept: 'Leadership',
          avatar: 'RK',
          avatarBg: 'bg-rose-500'
        };

      case 'Admin':
        return {
          label: 'SYSTEM ADMINISTRATOR',
          color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
          name: 'Nisha Agarwal',
          dept: 'Operations',
          avatar: 'NA',
          avatarBg: 'bg-amber-500'
        };

      case 'Project Manager':
        return {
          label: 'SENIOR PROJECT MANAGER',
          color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
          name: 'Arjun Shah',
          dept: 'Product',
          avatar: 'AS',
          avatarBg: 'bg-purple-500'
        };

      case 'Scrum Master':
        return {
          label: 'SCRUM MASTER',
          color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
          name: 'Aryan Kapoor',
          dept: 'Engineering',
          avatar: 'AK',
          avatarBg: 'bg-emerald-500'
        };

      case 'QA Engineer':
        return {
          label: 'QA ENGINEER',
          color: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
          name: 'Priya Rajan',
          dept: 'Quality',
          avatar: 'PR',
          avatarBg: 'bg-teal-500'
        };

      case 'Viewer':
        return {
          label: 'EXECUTIVE VIEWER',
          color: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
          name: 'Vikram Jain',
          dept: 'Management',
          avatar: 'VJ',
          avatarBg: 'bg-slate-600'
        };

      case 'Developer':
      default:
        return {
          label: 'SENIOR FRONTEND DEVELOPER',
          color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
          name: 'Sneha Rao',
          dept: 'Engineering',
          avatar: 'SR',
          avatarBg: 'bg-teal-500'
        };
    }
  };


  const roleConfig = getRoleConfig(userRole);


  const getNavItems = (role: string) => {

    switch (role) {

      case 'Super Admin':
        return [
          { name: 'Overview', icon: <LayoutGrid size={18} /> },
          { name: 'User Management', icon: <Users size={18} /> },
          { name: 'Departments', icon: <FolderKanban size={18} /> },
          { name: 'Roles & Permissions', icon: <Shield size={18} /> },
          { name: 'All Projects', icon: <Layers size={18} /> },
          { name: 'Audit Logs', icon: <FileText size={18} /> },
          { name: 'System Settings', icon: <Settings size={18} /> }
        ];

      case 'Admin':
        return [
          { name: 'Dashboard', icon: <LayoutGrid size={18} /> },
          { name: 'Users', icon: <Users size={18} /> },
          { name: 'Departments', icon: <FolderKanban size={18} /> },
          { name: 'Projects', icon: <Layers size={18} /> },
          { name: 'Reports', icon: <FileText size={18} /> },
          { name: 'Notifications', icon: <Bell size={18} /> }
        ];

      case 'Project Manager':
        return [
          { name: 'Dashboard', icon: <LayoutGrid size={18} /> },
          { name: 'My Projects', icon: <Layers size={18} /> },
          { name: 'Sprint Planning', icon: <Flame size={18} /> },
          { name: 'Task Board', icon: <CheckSquare size={18} /> },
          { name: 'Team Workload', icon: <Users size={18} /> },
          { name: 'Analytics & Reports', icon: <Activity size={18} /> }
        ];

      case 'Scrum Master':
        return [
          { name: 'Sprint Overview', icon: <LayoutGrid size={18} /> },
          { name: 'Scrum Board', icon: <CheckSquare size={18} /> },
          { name: 'Burndown & Velocity', icon: <Activity size={18} /> },
          { name: 'Team & Standups', icon: <Users size={18} /> },
          { name: 'Retrospective', icon: <Calendar size={18} /> }
        ];

      case 'QA Engineer':
        return [
          { name: 'QA Dashboard', icon: <LayoutGrid size={18} /> },
          { name: 'My Test Tasks', icon: <CheckSquare size={18} /> },
          { name: 'Bug Reports', icon: <AlertTriangle size={18} /> },
          { name: 'Test Coverage', icon: <Activity size={18} /> },
          { name: 'Quality Reports', icon: <FileText size={18} /> }
        ];

      case 'Viewer':
        return [
          { name: 'Projects', icon: <Layers size={18} /> },
          { name: 'Sprint Status', icon: <Flame size={18} /> },
          { name: 'Reports', icon: <FileText size={18} /> }
        ];

      case 'Developer':
      default:
        return [
          { name: 'My Dashboard', icon: <LayoutGrid size={18} /> },
          { name: 'My Tasks', icon: <CheckSquare size={18} /> },
          { name: 'Sprint Board', icon: <Layers size={18} /> },
          { name: 'Time Log', icon: <Clock size={18} /> },
          { name: 'Mentions', icon: <Bell size={18} /> }
        ];
    }
  };


  const navItems = getNavItems(userRole);


  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">

      {/* ================= FIXED SIDEBAR ================= */}

      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#090d16] text-white flex flex-col justify-between p-5 border-r border-slate-800/60 z-50">

        <div>

          {/* Logo */}

          <div className="flex items-center gap-2.5 mb-6 px-2">

            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <LayoutGrid size={18} />
            </div>

            <div>

              <div className="font-extrabold text-base tracking-tight leading-none text-white">
                Flowpilot
              </div>

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                PLATFORM V2.0
              </div>

            </div>

          </div>


          {/* Role Badge */}

          <div className="mb-6 px-2">

            <span
              className={`inline-block w-full text-center text-[10px] font-black tracking-wider px-3 py-1.5 rounded-lg border ${roleConfig.color}`}
            >
              ● {roleConfig.label}
            </span>

          </div>


          {/* Navigation */}

          <nav className="flex flex-col gap-1">

            {navItems.map((item) => {

              const isActive = activeTab === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white shadow-xs border border-white/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >

                  <span
                    className={
                      isActive
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {item.icon}
                  </span>

                  <span>
                    {item.name}
                  </span>

                </button>
              );

            })}

          </nav>

        </div>


        {/* User / Logout */}

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between px-2">

          <div className="flex items-center gap-2.5 min-w-0">

            <div
              className={`w-8 h-8 rounded-full ${roleConfig.avatarBg} text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm`}
            >
              {roleConfig.avatar}
            </div>

            <div className="min-w-0">

              <div className="text-xs font-bold text-white truncate">
                {roleConfig.name}
              </div>

              <div className="text-[10px] text-slate-400 truncate">
                {roleConfig.dept}
              </div>

            </div>

          </div>


          <button
            onClick={onLogout}
            title="Log out"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <LogOut size={14} />
          </button>

        </div>

      </aside>


      {/* ================= MAIN CONTENT ================= */}

      <main className="ml-64 min-h-screen flex flex-col min-w-0">

        {/* Sticky Header */}

        <header className="bg-white border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">

          <div>

            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">

              {userRole === 'Super Admin' && 'System Overview'}

              {userRole === 'Admin' && 'Admin Dashboard'}

              {userRole === 'Project Manager' && 'PM Dashboard'}

              {userRole === 'Scrum Master' && 'Sprint Overview'}

              {userRole === 'QA Engineer' && 'QA Dashboard'}

              {userRole === 'Viewer' &&
                activeTab === 'Projects' &&
                'Projects Overview'}

              {userRole === 'Viewer' &&
                activeTab === 'Sprint Status' &&
                'Sprint Status'}

              {userRole === 'Viewer' &&
                activeTab === 'Reports' &&
                'Reports'}

              {userRole === 'Developer' && 'My Dashboard'}

            </h1>


            <div className="text-xs text-slate-400 font-medium">
              {currentDate}
            </div>

          </div>


          {/* Header Actions */}

          <div className="flex items-center gap-4">

            <div className="relative w-64 hidden sm:block">

              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
              />

            </div>


            <div className="relative">

              <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
                <Bell size={16} />
              </button>

              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>

            </div>


            <div
              className={`w-9 h-9 rounded-full ${roleConfig.avatarBg} text-white flex items-center justify-center font-extrabold text-xs shadow-sm cursor-pointer`}
            >
              {roleConfig.avatar}
            </div>

          </div>

        </header>


        {/* ================= SCROLLABLE CONTENT ================= */}

        <div className="p-8 max-w-[1400px] w-full mx-auto flex-1 space-y-8">

          {/* Other Roles */}

          {userRole === 'Super Admin' && (
            <SuperAdminDashboard />
          )}

          {userRole === 'Admin' && (
            <AdminDashboardView />
          )}

          {userRole === 'Project Manager' && (
            <PMDashboardView />
          )}

          {userRole === 'Scrum Master' && (
            <ScrumMasterDashboardView />
          )}

          {userRole === 'Developer' && (
            <DeveloperDashboardView />
          )}

          {userRole === 'QA Engineer' && (
            <QADashboardView />
          )}


          {/* Viewer */}

          {userRole === 'Viewer' &&
            activeTab === 'Projects' && (
              <ViewerDashboardView />
            )}

          {userRole === 'Viewer' &&
            activeTab === 'Sprint Status' && (
              <ViewerSprintStatus />
            )}

          {userRole === 'Viewer' &&
            activeTab === 'Reports' && (
              <ViewerReports />
            )}

        </div>

      </main>

    </div>
  );
};