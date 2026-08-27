import React, { useState } from 'react';
import { Layers, Flame, FileText } from 'lucide-react';
import { DashboardLayout } from '../common/DashboardLayout';
import { ViewerDashboardView } from './ViewerDashboardView';
import { ViewerSprintStatus } from './ViewerSprintStatus';
import { ViewerReports } from './ViewerReports';

const roleConfig = {
  label: 'EXECUTIVE VIEWER',
  color: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  name: 'Vikram Jain',
  dept: 'Management',
  avatar: 'VJ',
  avatarBg: 'bg-slate-600',
};

const navItems = [
  { name: 'Projects', icon: <Layers size={18} /> },
  { name: 'Sprint Status', icon: <Flame size={18} /> },
  { name: 'Reports', icon: <FileText size={18} /> },
];

const pageTitles: Record<string, string> = {
  'Projects': 'Projects Overview',
  'Sprint Status': 'Sprint Status',
  'Reports': 'Reports',
};

interface Props {
  onLogout?: () => void;
}

const notifications = [
  { id: 1, title: 'Project report ready', message: 'Q3 project summary is available.', time: '1 hour ago', unread: true, color: 'bg-slate-500' },
  { id: 2, title: 'Sprint 12 completed', message: 'IPMT Platform v2 sprint closed.', time: '3 hours ago', unread: false, color: 'bg-slate-300' },
  { id: 3, title: 'New milestone added', message: 'Product launch set for Sep 1.', time: 'Yesterday', unread: true, color: 'bg-blue-400' },
];

const profileConfig = {
  name: 'Vikram Jain',
  email: 'v.jain@ipmt.com',
  roleLabel: 'Executive Viewer',
  roleBadgeColor: 'bg-slate-100 text-slate-600',
};

export const ViewerLayout: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Projects');

  const renderContent = () => {
    switch (activeTab) {
      case 'Sprint Status': return <ViewerSprintStatus />;
      case 'Reports': return <ViewerReports />;
      default: return <ViewerDashboardView />;
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      roleConfig={roleConfig}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageTitles[activeTab] ?? 'Projects Overview'}
      onLogout={onLogout}
      notifications={notifications}
      profileConfig={profileConfig}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default ViewerLayout;
