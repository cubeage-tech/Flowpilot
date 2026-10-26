import React, { useState, useEffect } from 'react';
import { Layers, Flame, FileText } from 'lucide-react';
import { DashboardLayout } from '../common/DashboardLayout';
import { ViewerDashboardView } from './ViewerDashboardView';
import { ViewerSprintStatus } from './ViewerSprintStatus';
import { ViewerReports } from './ViewerReports';

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
  { id: 1, title: 'Project report ready', message: 'Live sprint progress report updated.', time: 'Just now', unread: true, color: 'bg-emerald-500' },
  { id: 2, title: 'Sprint iteration synchronized', message: 'Scrum sprint data real-time sync active.', time: '2 min ago', unread: false, color: 'bg-indigo-400' },
  { id: 3, title: 'Quality Assurance status', message: 'All active QA test suites passed.', time: '1 hour ago', unread: true, color: 'bg-blue-400' },
];

export const ViewerLayout: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Projects');
  const [userName, setUserName] = useState('Executive Viewer');
  const [userEmail, setUserEmail] = useState('viewer@flowpilot.com');
  const [userDept, setUserDept] = useState('Management');
  const [userAvatar, setUserAvatar] = useState('EV');

  useEffect(() => {
    try {
      const storedName = localStorage.getItem('name');
      const storedEmail = localStorage.getItem('email');
      const storedDept = localStorage.getItem('department');
      const rawUser = localStorage.getItem('currentUser');

      if (storedName) setUserName(storedName);
      if (storedEmail) setUserEmail(storedEmail);
      if (storedDept) setUserDept(storedDept);

      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.email) setUserEmail(parsed.email);
        if (parsed.department) setUserDept(parsed.department);
      }

      const nameToUse = storedName || (rawUser ? JSON.parse(rawUser).name : 'Viewer');
      const initials = nameToUse
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      setUserAvatar(initials || 'EV');
    } catch (e) {
      console.warn('Failed to parse logged in user for viewer:', e);
    }
  }, []);

  const roleConfig = {
    label: 'EXECUTIVE VIEWER',
    color: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    name: userName,
    dept: userDept,
    avatar: userAvatar,
    avatarBg: 'bg-slate-700',
  };

  const profileConfig = {
    name: userName,
    email: userEmail,
    roleLabel: 'Executive Viewer',
    roleBadgeColor: 'bg-slate-100 text-slate-700',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Sprint Status':
        return <ViewerSprintStatus />;
      case 'Reports':
        return <ViewerReports />;
      default:
        return <ViewerDashboardView />;
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
