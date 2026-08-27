import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Users,
  FolderKanban,
  Shield,
  FileText,
  Settings,
  Layers,
} from 'lucide-react';

import { DashboardLayout } from '../common/DashboardLayout';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import SuperAdminUsers from './SuperAdminUsers';
import SuperAdminAuditLogs from './SuperAdminAuditLogs';
import SuperAdminSettings from './SuperAdminSettings';
import * as SuperAdminDepartmentsModule from './SuperAdminDepartments';
import * as SuperAdminRolesModule from './SuperAdminRoles';
import * as SuperAdminProjectsModule from './SuperAdminProjects';

const SuperAdminDepartments =
  (SuperAdminDepartmentsModule as any).default ??
  (SuperAdminDepartmentsModule as any).SuperAdminDepartments;

const SuperAdminRoles =
  (SuperAdminRolesModule as any).default ??
  (SuperAdminRolesModule as any).SuperAdminRoles;

const SuperAdminProjects =
  (SuperAdminProjectsModule as any).default ??
  (SuperAdminProjectsModule as any).SuperAdminProjects;

// Get logged-in user's name from localStorage
const loggedInName = localStorage.getItem('name') || 'User';

// Generate initials from logged-in user's name
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const loggedInAvatar = getInitials(loggedInName);

const roleConfig = {
  label: 'SUPER ADMINISTRATOR',
  color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  name: loggedInName,
  dept: 'Leadership',
  avatar: loggedInAvatar,
  avatarBg: 'bg-rose-500',
};

const navItems = [
  {
    name: 'Overview',
    icon: <LayoutGrid size={18} />,
  },
  {
    name: 'User Management',
    icon: <Users size={18} />,
  },
  {
    name: 'Departments',
    icon: <FolderKanban size={18} />,
  },
  {
    name: 'Roles & Permissions',
    icon: <Shield size={18} />,
  },
  {
    name: 'All Projects',
    icon: <Layers size={18} />,
  },
  {
    name: 'Audit Logs',
    icon: <FileText size={18} />,
  },
  {
    name: 'System Settings',
    icon: <Settings size={18} />,
  },
];

const pageTitles: Record<string, string> = {
  Overview: 'System Overview',
  'User Management': 'User Management',
  Departments: 'Departments',
  'Roles & Permissions': 'Roles & Permissions',
  'All Projects': 'All Projects',
  'Audit Logs': 'Audit Logs',
  'System Settings': 'System Settings',
};

interface Props {
  onLogout?: () => void;
}

const notifications = [
  {
    id: 1,
    title: 'New user registered',
    message: 'Rohit Varma added to Leadership.',
    time: '2 min ago',
    unread: true,
    color: 'bg-emerald-500',
  },
  {
    id: 2,
    title: 'Role assigned',
    message: 'Business Analyst role assigned to Rohit Varma.',
    time: '18 min ago',
    unread: true,
    color: 'bg-purple-400',
  },
  {
    id: 3,
    title: 'System health check',
    message: 'All services running normally.',
    time: '1 hour ago',
    unread: false,
    color: 'bg-slate-300',
  },
  {
    id: 4,
    title: 'Audit log alert',
    message: 'Unusual login attempt detected.',
    time: '2 hours ago',
    unread: true,
    color: 'bg-rose-500',
  },
];

const profileConfig = {
  name: loggedInName,
  email: 'ra.kumar@ipmt.com',
  roleLabel: 'Super Administrator',
  roleBadgeColor: 'bg-rose-100 text-rose-600',
};

// ============================================================
// SESSION SETTINGS
// ============================================================

const SUPERADMIN_SETTINGS_KEY =
  'flowpilot_superadmin_settings';

interface SuperAdminSettingsData {
  automaticSessionTimeout: boolean;
  sessionTimeout: string;
}

const DEFAULT_SESSION_SETTINGS: SuperAdminSettingsData = {
  automaticSessionTimeout: true,
  sessionTimeout: '30',
};

export const SuperAdminLayout: React.FC<Props> = ({
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState('Overview');

  // ============================================================
  // AUTOMATIC FIXED SESSION TIMEOUT
  // ============================================================

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // ----------------------------------------------------------
    // LOGOUT FUNCTION
    // ----------------------------------------------------------

    const logoutSuperAdmin = () => {
      console.log(
        'Super Admin session timeout reached. Logging out...'
      );

      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');

      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    };

    // ----------------------------------------------------------
    // START TIMER
    // ----------------------------------------------------------

    const startTimer = () => {
      // Clear previous timer first
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      try {
        const storedSettings =
          localStorage.getItem(
            SUPERADMIN_SETTINGS_KEY
          );

        let settings: SuperAdminSettingsData =
          DEFAULT_SESSION_SETTINGS;

        if (storedSettings) {
          const parsedSettings = JSON.parse(
            storedSettings
          );

          settings = {
            automaticSessionTimeout:
              parsedSettings.automaticSessionTimeout ??
              DEFAULT_SESSION_SETTINGS.automaticSessionTimeout,

            sessionTimeout:
              parsedSettings.sessionTimeout ??
              DEFAULT_SESSION_SETTINGS.sessionTimeout,
          };
        }

        // ------------------------------------------------------
        // TIMEOUT OFF
        // ------------------------------------------------------

        if (!settings.automaticSessionTimeout) {
          console.log(
            'Super Admin automatic session timeout is OFF.'
          );

          return;
        }

        // ------------------------------------------------------
        // GET TIMEOUT
        // ------------------------------------------------------

        const timeoutMinutes = Number(
          settings.sessionTimeout
        );

        if (
          !timeoutMinutes ||
          timeoutMinutes <= 0
        ) {
          console.error(
            'Invalid Super Admin session timeout:',
            settings.sessionTimeout
          );

          return;
        }

        const timeoutMilliseconds =
          timeoutMinutes * 60 * 1000;

        console.log(
          `Super Admin logout timer started: ${timeoutMinutes} minute(s)`
        );

        // ------------------------------------------------------
        // IMPORTANT:
        // NO USER ACTIVITY IS TRACKED.
        //
        // Mouse movement
        // Keyboard
        // Clicking
        // Scrolling
        //
        // NONE OF THESE RESET THE TIMER.
        // ------------------------------------------------------

        timeoutId = setTimeout(() => {
          logoutSuperAdmin();
        }, timeoutMilliseconds);
      } catch (error) {
        console.error(
          'Error reading Super Admin session timeout settings:',
          error
        );
      }
    };

    // Start timer when SuperAdminLayout loads
    startTimer();

    // ----------------------------------------------------------
    // LISTEN FOR SETTINGS CHANGES
    // ----------------------------------------------------------

    const handleSettingsUpdated = () => {
      console.log(
        'Super Admin settings changed. Restarting session timer...'
      );

      startTimer();
    };

    window.addEventListener(
      'superadmin-settings-updated',
      handleSettingsUpdated
    );

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      window.removeEventListener(
        'superadmin-settings-updated',
        handleSettingsUpdated
      );
    };
  }, [onLogout]);

  // ============================================================
  // PAGE CONTENT
  // ============================================================

  const renderContent = () => {
    switch (activeTab) {
      case 'User Management':
        return <SuperAdminUsers />;

      case 'Departments':
        return SuperAdminDepartments
          ? <SuperAdminDepartments />
          : null;

      case 'Roles & Permissions':
        return SuperAdminRoles
          ? <SuperAdminRoles />
          : null;

      case 'All Projects':
        return SuperAdminProjects
          ? <SuperAdminProjects />
          : null;

      case 'Audit Logs':
        return <SuperAdminAuditLogs />;

      case 'System Settings':
        return <SuperAdminSettings />;

      case 'Overview':
      default:
        return (
          <SuperAdminDashboard
            onNavigate={(tab) =>
              setActiveTab(tab)
            }
          />
        );
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      roleConfig={roleConfig}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={
        pageTitles[activeTab] ??
        'System Overview'
      }
      onLogout={onLogout}
      notifications={notifications}
      profileConfig={profileConfig}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default SuperAdminLayout;