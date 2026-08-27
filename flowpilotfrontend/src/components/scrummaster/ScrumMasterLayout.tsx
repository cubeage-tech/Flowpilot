import React, { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, CheckSquare, Activity, Users, Calendar, Repeat } from 'lucide-react';
import { DashboardLayout } from '../common/DashboardLayout';
import { ScrumMasterDashboardView } from './ScrumMasterDashboardView';
import { ScrumBoard } from './ScrumBoard';
import { ScrumSprints } from './ScrumSprints';
import { ScrumBurndown } from './ScrumBurndown';
import { ScrumStandups } from './ScrumStandups';
import { ScrumRetrospective } from './ScrumRetrospective';
import { fetchDashboard, STATUS_LABEL, type Dashboard } from './scrumApi';

const roleConfig = {
  label: 'SCRUM MASTER',
  color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  name: 'Aryan Kapoor',
  dept: 'Engineering',
  avatar: 'AK',
  avatarBg: 'bg-emerald-500',
};

const navItems = [
  { name: 'Sprint Overview',      icon: <LayoutGrid size={18} /> },
  { name: 'Sprint Cycles',        icon: <Repeat size={18} /> },
  { name: 'Scrum Board',          icon: <CheckSquare size={18} /> },
  { name: 'Burndown & Velocity',  icon: <Activity size={18} /> },
  { name: 'Team & Standups',      icon: <Users size={18} /> },
  { name: 'Retrospective',        icon: <Calendar size={18} /> },
];

const pageTitles: Record<string, string> = {
  'Sprint Overview':     'Sprint Overview',
  'Sprint Cycles':       'Sprint Cycles',
  'Scrum Board':         'Scrum Board',
  'Burndown & Velocity': 'Burndown & Velocity',
  'Team & Standups':     'Team & Standups',
  'Retrospective':       'Retrospective',
};

interface Props {
  onLogout?: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  color: string;
}

/**
 * Notifications are derived from the sprint that is actually running.
 *
 * They were previously four hardcoded lines naming a Sprint 12 and a T-048
 * that may not exist — invented data shown to the user as fact. Anything that
 * cannot be read from the dashboard is now simply not shown: an empty bell is
 * honest, a fabricated one is not.
 */
const buildNotifications = (data: Dashboard): Notification[] => {
  const items: Notification[] = [];

  // Longest-idle first: that is the order a scrum master works them down
  const stuck = [...data.stuckTasks].sort((a, b) => b.daysInColumn - a.daysInColumn);

  stuck.slice(0, 4).forEach((task, index) => {
    items.push({
      id: index + 1,
      title: `${task.taskKey} is stuck`,
      message: `${task.title} has sat in ${STATUS_LABEL[task.status]} for ${task.daysInColumn} day${
        task.daysInColumn === 1 ? '' : 's'
      }.`,
      time: `${task.daysInColumn}d`,
      unread: true,
      color: 'bg-rose-500'
    });
  });

  if (data.kpis.overdueTasks > 0) {
    items.push({
      id: items.length + 1,
      title: 'Work is past its due date',
      message: `${data.kpis.overdueTasks} task${
        data.kpis.overdueTasks === 1 ? ' is' : 's are'
      } overdue in ${data.sprint.name}.`,
      time: 'now',
      unread: true,
      color: 'bg-amber-500'
    });
  }

  // Three working days is the point at which the end of a sprint is worth a nudge
  if (data.sprint.daysRemaining > 0 && data.sprint.daysRemaining <= 3) {
    items.push({
      id: items.length + 1,
      title: `${data.sprint.name} ends soon`,
      message: `${data.sprint.daysRemaining} working day${
        data.sprint.daysRemaining === 1 ? '' : 's'
      } left, with ${data.kpis.tasksTotal - data.kpis.tasksCompleted} task${
        data.kpis.tasksTotal - data.kpis.tasksCompleted === 1 ? '' : 's'
      } still open.`,
      time: `${data.sprint.daysRemaining}d`,
      unread: true,
      color: 'bg-violet-500'
    });
  }

  if (data.sprint.scopeAddedPoints > 0) {
    items.push({
      id: items.length + 1,
      title: 'Scope grew mid-sprint',
      message: `${data.sprint.scopeAddedPoints} points were added to ${data.sprint.name} after it started.`,
      time: 'this sprint',
      unread: false,
      color: 'bg-amber-500'
    });
  }

  return items;
};

const profileConfig = {
  name:           'Aryan Kapoor',
  email:          'a.kapoor@ipmt.com',
  roleLabel:      'Scrum Master',
  roleBadgeColor: 'bg-emerald-100 text-emerald-600',
};

export const ScrumMasterLayout: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Sprint Overview');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(buildNotifications(await fetchDashboard()));
    } catch {
      // No running sprint, or the API is unreachable. Showing nothing is
      // correct here — a bell full of guesses would be worse than an empty one.
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Sprint Cycles':       return <ScrumSprints />;
      case 'Scrum Board':         return <ScrumBoard />;
      case 'Burndown & Velocity': return <ScrumBurndown />;
      case 'Team & Standups':     return <ScrumStandups />;
      case 'Retrospective':       return <ScrumRetrospective />;
      default:                    return <ScrumMasterDashboardView />;
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      roleConfig={roleConfig}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageTitles[activeTab] ?? 'Sprint Overview'}
      onLogout={onLogout}
      notifications={notifications}
      profileConfig={profileConfig}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default ScrumMasterLayout;
