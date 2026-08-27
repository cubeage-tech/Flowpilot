import React, { useState } from 'react';
import { LayoutGrid, CheckSquare, Layers, Clock, Bell } from 'lucide-react';
import { DashboardLayout } from '../common/DashboardLayout';
import { DeveloperDashboardView } from './DeveloperDashboardView';
import { DeveloperTasks } from './DeveloperTasks';
import { DeveloperSprintBoard } from './DeveloperSprintBoard';
import { DeveloperTimeLog } from './DeveloperTimeLog';
import { DeveloperMentions } from './DeveloperMentions';
                                                                                                          
const roleConfig = {
  label: 'SENIOR FRONTEND DEVELOPER',
  color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  name: 'Sneha Rao',
  dept: 'Engineering',
  avatar: 'SR',
  avatarBg: 'bg-teal-500',
};
                                                                                        
const navItems = [
  { name: 'My Dashboard', icon: <LayoutGrid size={18} /> },
  { name: 'My Tasks', icon: <CheckSquare size={18} /> },
  { name: 'Sprint Board', icon: <Layers size={18} /> },
  { name: 'Time Log', icon: <Clock size={18} /> },
  { name: 'Mentions', icon: <Bell size={18} /> },
];
                          
const pageTitles: Record<string, string> = {
  'My Dashboard': 'My Dashboard',
  'My Tasks': 'My Tasks',
  'Sprint Board': 'Sprint Board',
  'Time Log': 'Time Log',
  'Mentions': 'Mentions',
};

const notifications = [
  { id: 1, title: 'PR approved', message: 'Your latest PR has been approved by the reviewer.', time: '5 min ago', unread: true, color: 'bg-cyan-500' },
  { id: 2, title: 'Sprint review', message: 'Sprint review meeting starts in 30 minutes.', time: '1 hour ago', unread: true, color: 'bg-emerald-500' },
  { id: 3, title: 'Build passed', message: 'Production build completed successfully.', time: '3 hours ago', unread: false, color: 'bg-slate-300' },
  { id: 4, title: 'Mention received', message: 'A teammate mentioned you in a comment thread.', time: 'Today', unread: true, color: 'bg-violet-500' },
];

const profileConfig = {
  name: 'Sneha Rao',
  email: 'sneha.rao@flowpilot.com',
  roleLabel: 'Senior Frontend Developer',
  roleBadgeColor: 'bg-cyan-100 text-cyan-600',
};

interface Props {
  onLogout?: () => void;
}

export const DeveloperLayout: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('My Dashboard');

  return (
    <DashboardLayout
      navItems={navItems}
      roleConfig={roleConfig}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageTitles[activeTab] ?? 'My Dashboard'}
      onLogout={onLogout}
      notifications={notifications}
      profileConfig={profileConfig}
    >
      {activeTab === 'My Dashboard' && <DeveloperDashboardView />}
      {activeTab === 'My Tasks' && <DeveloperTasks />}
      {activeTab === 'Sprint Board' && <DeveloperSprintBoard />}
      {activeTab === 'Time Log' && <DeveloperTimeLog />}
      {activeTab === 'Mentions' && <DeveloperMentions />}
    </DashboardLayout>
  );
};
                               
export default DeveloperLayout;