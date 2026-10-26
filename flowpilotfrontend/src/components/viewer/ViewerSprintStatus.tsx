import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, Search, Layers, CheckCircle2, Clock, Zap, AlertTriangle, Calendar } from 'lucide-react';

interface SprintItem {
  id: number;
  projectId?: number;
  project: string;
  sprint: string;
  sprintNumber?: number;
  status: string;
  done: number;
  inProgress: number;
  todo: number;
  totalTasks: number;
  completion: number;
  committedPoints: number;
  completedPoints: number;
  pointsCompletion: number;
  startDate?: string | null;
  endDate?: string | null;
  daysRemaining: number;
  health: string;
}

interface SprintStatusOverview {
  activeSprintsCount: number;
  totalTasksCompleted: number;
  totalTasksRemaining: number;
  totalTasks: number;
  overallCompletionRate: number;
  totalStoryPointsCommitted: number;
  totalStoryPointsCompleted: number;
  sprints: SprintItem[];
}

const API_URL = 'http://localhost:8080/api/viewer/sprint-status';

function getAuthToken(): string | null {
  const keys = ['token', 'accessToken', 'jwtToken', 'authToken'];
  for (const key of keys) {
    const local = localStorage.getItem(key);
    if (local) return local;
    const session = sessionStorage.getItem(key);
    if (session) return session;
  }
  return null;
}

export const ViewerSprintStatus: React.FC = () => {
  const [data, setData] = useState<SprintStatusOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PLANNED' | 'COMPLETED'>('ALL');

  const loadSprintStatus = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setError('');
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(API_URL, { method: 'GET', headers });

      if (response.ok) {
        const result: SprintStatusOverview = await response.json();
        setData(result);
        setLastSync(new Date());
      } else {
        throw new Error(`Failed to load sprint status (${response.status})`);
      }
    } catch (err) {
      console.error('Error loading sprint status:', err);
      if (!data) {
        setError(err instanceof Error ? err.message : 'Failed to load sprint status');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    loadSprintStatus();
    // 8-second real-time polling
    const interval = setInterval(() => {
      loadSprintStatus();
    }, 8000);
    return () => clearInterval(interval);
  }, [loadSprintStatus]);

  const filteredSprints = useMemo(() => {
    if (!data?.sprints) return [];
    return data.sprints.filter((s) => {
      const matchQuery =
        s.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sprint.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;

      const sLower = s.status.toLowerCase();
      if (statusFilter === 'ACTIVE') return sLower.includes('active');
      if (statusFilter === 'PLANNED') return sLower.includes('plan');
      if (statusFilter === 'COMPLETED') return sLower.includes('complete') || sLower.includes('done');
      return true;
    });
  }, [data?.sprints, searchQuery, statusFilter]);

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('active')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('complete') || s.includes('done')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getHealthBadgeClass = (health: string) => {
    const h = health.toLowerCase();
    if (h.includes('track') || h.includes('complete')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (h.includes('progress')) return 'bg-teal-50 text-teal-600 border-teal-200';
    if (h.includes('risk') || h.includes('attention')) return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getProgressBarColor = (completion: number) => {
    if (completion >= 70) return 'bg-emerald-500';
    if (completion >= 40) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  if (loading && !data) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Real-time Sprint Analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* Top Banner & Live Sync Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900">Sprint Delivery & Health Tracker</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                EXECUTIVE VIEW
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Real-time sprint progress, task burnup, and delivery velocity</p>
          </div>
        </div>

        {/* Real-time Indicator & Refresh */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Live Sync • {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          <button
            type="button"
            onClick={() => loadSprintStatus(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {/* Active Sprints */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Sprints</span>
            <Layers size={17} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">{data?.activeSprintsCount ?? 0}</span>
            <span className="text-[11px] font-medium text-slate-400">/ {data?.sprints.length ?? 0} total</span>
          </div>
          <p className="mt-3 text-[10px] font-medium text-slate-500">Live development iterations</p>
        </div>

        {/* Tasks Completed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Tasks Delivered</span>
            <CheckCircle2 size={17} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{data?.totalTasksCompleted ?? 0}</span>
            <span className="text-[11px] font-medium text-slate-400">/ {data?.totalTasks ?? 0}</span>
          </div>
          <p className="mt-3 text-[10px] font-medium text-slate-500">{data?.totalTasksRemaining ?? 0} tasks remaining in progress</p>
        </div>

        {/* Story Points Burned */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Points Burned</span>
            <Zap size={17} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{data?.totalStoryPointsCompleted ?? 0}</span>
            <span className="text-[11px] font-medium text-slate-400">/ {data?.totalStoryPointsCommitted ?? 0} pts</span>
          </div>
          <p className="mt-3 text-[10px] font-medium text-slate-500">Sprint capacity utilization</p>
        </div>

        {/* Overall Completion */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Overall Rate</span>
            <Clock size={17} className="text-teal-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-teal-600">{data?.overallCompletionRate ?? 0}%</span>
            <span className="text-[11px] font-bold text-slate-500">Iteration Velocity</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, data?.overallCompletionRate ?? 0))}%` }}
            />
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(['ALL', 'ACTIVE', 'PLANNED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' && `All Sprints (${data?.sprints.length ?? 0})`}
              {tab === 'ACTIVE' && `Active (${data?.sprints.filter((s) => s.status.toLowerCase().includes('active')).length ?? 0})`}
              {tab === 'PLANNED' && `Planned (${data?.sprints.filter((s) => s.status.toLowerCase().includes('plan')).length ?? 0})`}
              {tab === 'COMPLETED' && `Completed (${data?.sprints.filter((s) => s.status.toLowerCase().includes('complete') || s.status.toLowerCase().includes('done')).length ?? 0})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sprint, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </section>

      {/* SPRINT CARDS GRID */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredSprints.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <Layers size={32} className="text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No sprints match current filter</p>
            <p className="text-xs text-slate-400 max-w-sm mt-0.5">Try selecting "All Sprints" or modifying your search</p>
          </div>
        ) : (
          filteredSprints.map((sprint) => (
            <article
              key={`${sprint.project}-${sprint.sprint}-${sprint.id}`}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:p-6"
            >
              {/* Sprint Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-xs font-semibold text-slate-400 truncate">
                    {sprint.project}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {sprint.sprint}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-extrabold ${getStatusBadgeClass(sprint.status)}`}>
                    {sprint.status}
                  </span>
                  <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getHealthBadgeClass(sprint.health)}`}>
                    {sprint.health}
                  </span>
                </div>
              </div>

              {/* Task Breakdown Grid */}
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mb-5">
                {/* Done */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50/60 border border-emerald-100 py-2.5 px-1">
                  <span className="text-xl font-black text-emerald-600">{sprint.done}</span>
                  <span className="text-[10px] font-bold text-emerald-700 mt-0.5">Done</span>
                </div>

                {/* In Progress */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50/60 border border-amber-100 py-2.5 px-1">
                  <span className="text-xl font-black text-amber-600">{sprint.inProgress}</span>
                  <span className="text-[10px] font-bold text-amber-700 mt-0.5">In Progress</span>
                </div>

                {/* To Do */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 py-2.5 px-1">
                  <span className="text-xl font-black text-slate-500">{sprint.todo}</span>
                  <span className="text-[10px] font-bold text-slate-600 mt-0.5">To Do</span>
                </div>

                {/* Total Points */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50/60 border border-indigo-100 py-2.5 px-1">
                  <span className="text-xl font-black text-indigo-600">{sprint.completedPoints}</span>
                  <span className="text-[10px] font-bold text-indigo-700 mt-0.5">/ {sprint.committedPoints} pts</span>
                </div>
              </div>

              {/* REAL-TIME PROGRESS BAR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Live Task Completion</span>
                  <span className="font-black text-slate-900">{sprint.completion}%</span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(sprint.completion)}`}
                    style={{ width: `${Math.min(100, Math.max(0, sprint.completion))}%` }}
                  />
                </div>
              </div>

              {/* Sprint Footer: Dates & Countdown */}
              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>
                    {sprint.startDate && sprint.endDate
                      ? `${sprint.startDate} → ${sprint.endDate}`
                      : 'Sprint Iteration Active'}
                  </span>
                </div>

                <div>
                  {sprint.status.toLowerCase().includes('complete') ? (
                    <span className="font-bold text-blue-600">Iteration Completed</span>
                  ) : sprint.daysRemaining > 0 ? (
                    <span className="font-bold text-slate-700">⏳ {sprint.daysRemaining} days remaining</span>
                  ) : (
                    <span className="font-bold text-amber-600">Sprint ending soon</span>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default ViewerSprintStatus;