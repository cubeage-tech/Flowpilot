import React, { useState } from 'react';
import { LayoutGrid, Users, FolderKanban, Layers, FileText, Bell, Settings } from 'lucide-react';
import { DashboardLayout } from '../common/DashboardLayout';
import { AdminDashboardView } from './AdminDashboardView';
import { AdminUsers } from './AdminUsers';
import { AdminDepartments } from './AdminDepartments';
import  AdminProjects  from './AdminProjects';
import { AdminReports } from './AdminReports';
import { AdminNotifications } from './AdminNotifications';
import { AdminSettings } from './AdminSettings';

const roleConfig = {
  label: 'SYSTEM ADMINISTRATOR',
  color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  name: 'Nisha Agarwal',
  dept: 'Operations',
  avatar: 'NA',
  avatarBg: 'bg-amber-500',
};

const navItems = [
  { name: 'Dashboard', icon: <LayoutGrid size={18} /> },
  { name: 'Users', icon: <Users size={18} /> },
  { name: 'Departments', icon: <FolderKanban size={18} /> },
  { name: 'Projects', icon: <Layers size={18} /> },
  { name: 'Reports', icon: <FileText size={18} /> },
  { name: 'Notifications', icon: <Bell size={18} /> },
  { name: 'Settings', icon: <Settings size={18} /> },
];

const pageTitles: Record<string, string> = {
  'Dashboard': 'Admin Dashboard',
  'Users': 'User Management',
  'Departments': 'Departments',
  'Projects': 'Projects',
  'Reports': 'Reports',
  'Notifications': 'Notifications',
  'Settings': 'Settings',
};

interface Props {
  onLogout?: () => void;
}

const notifications = [
  { id: 1, title: 'User account created', message: '3 new users added this month.', time: '5 min ago', unread: true, color: 'bg-amber-500' },
  { id: 2, title: 'Department updated', message: 'Engineering dept headcount changed.', time: '30 min ago', unread: true, color: 'bg-blue-400' },
  { id: 3, title: 'System backup complete', message: 'Daily backup completed successfully.', time: '2 hours ago', unread: false, color: 'bg-slate-300' },
  { id: 4, title: 'Open ticket escalated', message: 'Ticket #089 marked urgent.', time: '3 hours ago', unread: true, color: 'bg-rose-500' },
];

const profileConfig = {
  name: 'Nisha Agarwal',
  email: 'n.agarwal@ipmt.com',
  roleLabel: 'System Administrator',
  roleBadgeColor: 'bg-amber-100 text-amber-600',
};

export const AdminLayout: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'Users': return <AdminUsers />;
      case 'Departments': return <AdminDepartments />;
      case 'Projects': return <AdminProjects />;
      case 'Reports': return <AdminReports />;
      case 'Notifications': return <AdminNotifications />;
      case 'Settings': return <AdminSettings />;
      default: return <AdminDashboardView />;
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      roleConfig={roleConfig}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageTitles[activeTab] ?? 'Admin Dashboard'}
      onLogout={onLogout}
      notifications={notifications}
      profileConfig={profileConfig}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminLayout;
