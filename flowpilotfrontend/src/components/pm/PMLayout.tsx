import React, { useState } from 'react';
import { LayoutGrid, Layers, Flame, CheckSquare, Users, Activity } from 'lucide-react';
import { DashboardLayout } from '../common/DashboardLayout';
import { PMDashboardView } from './PMDashboardView';
import { PMProjects } from './PMProjects';
import { PMSprintPlanning } from './PMSprintPlanning';
import { PMTaskBoard } from './PMTaskBoard';
import { PMWorkload } from './PMWorkload';
import { PMAnalytics } from './PMAnalytics';

const roleConfig = {
  label: 'SENIOR PROJECT MANAGER',
  color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  name: 'Arjun Shah',
  dept: 'Product',
  avatar: 'AS',
  avatarBg: 'bg-purple-500',
};

const navItems = [
  { name: 'Dashboard', icon: <LayoutGrid size={18} /> },
  { name: 'My Projects', icon: <Layers size={18} /> },
  { name: 'Sprint Planning', icon: <Flame size={18} /> },
  { name: 'Task Board', icon: <CheckSquare size={18} /> },
  { name: 'Team Workload', icon: <Users size={18} /> },
  { name: 'Analytics & Reports', icon: <Activity size={18} /> },
];

const pageTitles: Record<string, string> = {
  'Dashboard': 'PM Dashboard',
  'My Projects': 'My Projects',
  'Sprint Planning': 'Sprint Planning',
  'Task Board': 'Task Board',
  'Team Workload': 'Team Workload',
  'Analytics & Reports': 'Analytics & Reports',
};

interface Props {
  onLogout?: () => void;
}

const notifications = [
  { id: 1, title: 'Sprint 12 planning', message: 'Planning meeting in 30 mins.', time: '5 min ago', unread: true, color: 'bg-purple-500' },
  { id: 2, title: 'Task T-042 done', message: 'Priya Rajan marked T-042 as Done.', time: '18 min ago', unread: true, color: 'bg-violet-400' },
  { id: 3, title: 'Velocity updated', message: 'Sprint 12 velocity: 41 SP.', time: '1 hour ago', unread: false, color: 'bg-slate-300' },
  { id: 4, title: 'Milestone approaching', message: 'Sprint 12 Demo on Aug 8.', time: '2 hours ago', unread: true, color: 'bg-emerald-500' },
];

const profileConfig = {
  name: 'Arjun Shah',
  email: 'a.shah@ipmt.com',
  roleLabel: 'Senior Project Manager',
  roleBadgeColor: 'bg-purple-100 text-purple-600',
};

export const PMLayout: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <DashboardLayout
      navItems={navItems}
      roleConfig={roleConfig}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageTitles[activeTab] ?? 'PM Dashboard'}
      onLogout={onLogout}
      notifications={notifications}
      profileConfig={profileConfig}
    >
      {activeTab === 'Dashboard' && <PMDashboardView />}
      {activeTab === 'My Projects' && <PMProjects />}
      {activeTab === 'Sprint Planning' && <PMSprintPlanning />}
      {activeTab === 'Task Board' && <PMTaskBoard />}
      {activeTab === 'Team Workload' && <PMWorkload />}
      {activeTab === 'Analytics & Reports' && <PMAnalytics />}
    </DashboardLayout>
  );
};

export default PMLayout;
