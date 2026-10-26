import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  X,
  FolderKanban,
  ListChecks,
  TrendingUp,
  Bug,
  Users,
  Rocket,
  LockKeyhole,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface ReportDto {
  projectOverview?: {
    totalProjects: number;
    activeProjects: number;
    delayedProjects: number;
    overallProgress: number;
    averageHealthScore: number;
    projectBreakdown?: Array<{
      id: number;
      code: string;
      name: string;
      status: string;
      progress: number;
      members: number;
    }>;
  };
  sprintSummary?: {
    activeSprints: number;
    completedSprints: number;
    totalPlannedPoints: number;
    totalCompletedPoints: number;
    sprintCompletionRate: number;
    sprintList?: Array<{
      id: number;
      name: string;
      status: string;
      plannedPoints: number;
      completedPoints: number;
      tasksCount: number;
    }>;
  };
  teamProductivity?: {
    totalPointsDelivered: number;
    totalTasksCompleted: number;
    activeContributors: number;
    averageVelocity: number;
    departmentProductivity?: Array<{
      department: string;
      completedTasks: number;
    }>;
  };
  qualityMetrics?: {
    totalTestCases: number;
    passedTests: number;
    failedTests: number;
    pendingTests: number;
    testPassRate: number;
    openBugs: number;
    resolvedBugs: number;
    bugResolutionRate: number;
  };
  resourceAllocation?: {
    totalMembers: number;
    departmentDistribution?: Record<string, number>;
    projectAllocations?: Array<{
      projectName: string;
      allocatedCount: number;
    }>;
  };
  releaseReadiness?: {
    readinessScore: number;
    totalFeatures: number;
    completedFeatures: number;
    openBlockers: number;
    passedVerificationRate: number;
    releaseStatus: string;
  };
}

const REPORTS_API = 'http://localhost:8080/api/viewer/reports';

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

export const ViewerReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [activeModalReport, setActiveModalReport] = useState<string | null>(null);

  const fetchReports = useCallback(async (isManual = false) => {
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

      const response = await fetch(REPORTS_API, { method: 'GET', headers });

      if (response.ok) {
        const result: ReportDto = await response.json();
        setReportData(result);
        setLastSync(new Date());
      } else {
        throw new Error(`Failed to load reports (${response.status})`);
      }
    } catch (err: any) {
      console.error('Error loading reports:', err);
      if (!reportData) {
        setError(err instanceof Error ? err.message : 'Unable to connect to reports API');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportData]);

  useEffect(() => {
    fetchReports();
    // 8-second real-time polling
    const interval = setInterval(() => {
      fetchReports();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  if (loading && !reportData) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Real-time Executive Reports...</p>
      </div>
    );
  }

  const overview = reportData?.projectOverview;
  const sprint = reportData?.sprintSummary;
  const team = reportData?.teamProductivity;
  const quality = reportData?.qualityMetrics;
  const resources = reportData?.resourceAllocation;
  const release = reportData?.releaseReadiness;

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* Top Banner & Live Sync Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Eye size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900">Executive Reports & Intelligence</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                READ-ONLY EXPORTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Live aggregate insights across portfolio health, velocity, and quality</p>
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
            onClick={() => fetchReports(true)}
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

      {/* 6 REAL-TIME EXECUTIVE REPORT CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* 1. Project Status Overview */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FolderKanban size={18} />
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                {overview?.totalProjects ?? 0} Projects
              </span>
            </div>

            <h3 className="text-[15px] font-extrabold text-slate-900">Project Status Overview</h3>
            <p className="mt-1 text-xs text-slate-500">High-level delivery portfolio health and overall progress.</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Active / In Progress:</span>
                <strong className="text-emerald-600">{overview?.activeProjects ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delayed / At Risk:</span>
                <strong className="text-amber-600">{overview?.delayedProjects ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Average Health Score:</span>
                <strong className="text-slate-900">{overview?.averageHealthScore ?? 0}%</strong>
              </div>
            </div>

            {/* Live Progress */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Portfolio Progress</span>
                <span className="text-blue-600 font-extrabold">{overview?.overallProgress ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${overview?.overallProgress ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModalReport('PROJECT_OVERVIEW')}
              className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              View Live Report
            </button>
            <button
              type="button"
              disabled
              title="Exports require Admin privileges"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <LockKeyhole size={12} />
              Export
            </button>
          </div>
        </article>

        {/* 2. Sprint Progress Summary */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ListChecks size={18} />
              </div>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">
                {sprint?.activeSprints ?? 0} Active Sprints
              </span>
            </div>

            <h3 className="text-[15px] font-extrabold text-slate-900">Sprint Progress Summary</h3>
            <p className="mt-1 text-xs text-slate-500">Live story point burnup and delivery velocity across all squads.</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Planned Story Points:</span>
                <strong className="text-slate-800">{sprint?.totalPlannedPoints ?? 0} pts</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivered Story Points:</span>
                <strong className="text-indigo-600">{sprint?.totalCompletedPoints ?? 0} pts</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completed Sprints:</span>
                <strong className="text-slate-900">{sprint?.completedSprints ?? 0}</strong>
              </div>
            </div>

            {/* Live Progress */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Sprint Burnup Rate</span>
                <span className="text-indigo-600 font-extrabold">{sprint?.sprintCompletionRate ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                  style={{ width: `${sprint?.sprintCompletionRate ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModalReport('SPRINT_SUMMARY')}
              className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              View Live Report
            </button>
            <button
              type="button"
              disabled
              title="Exports require Admin privileges"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <LockKeyhole size={12} />
              Export
            </button>
          </div>
        </article>

        {/* 3. Team Productivity & Velocity */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp size={18} />
              </div>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                {team?.averageVelocity ?? 0} pts/sprint
              </span>
            </div>

            <h3 className="text-[15px] font-extrabold text-slate-900">Team Productivity</h3>
            <p className="mt-1 text-xs text-slate-500">Velocity trends and completed tasks by development squads.</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tasks Completed:</span>
                <strong className="text-emerald-600">{team?.totalTasksCompleted ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Story Points Finished:</span>
                <strong className="text-slate-800">{team?.totalPointsDelivered ?? 0} pts</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Contributors:</span>
                <strong className="text-slate-900">{team?.activeContributors ?? 0} engineers</strong>
              </div>
            </div>

            {/* Live Velocity Indicator */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Velocity Momentum</span>
                <span className="text-amber-600 font-extrabold">Active</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: '85%' }} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModalReport('TEAM_PRODUCTIVITY')}
              className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              View Live Report
            </button>
            <button
              type="button"
              disabled
              title="Exports require Admin privileges"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <LockKeyhole size={12} />
              Export
            </button>
          </div>
        </article>

        {/* 4. Quality & Bug Trend Report */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Bug size={18} />
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                {quality?.testPassRate ?? 0}% Pass Rate
              </span>
            </div>

            <h3 className="text-[15px] font-extrabold text-slate-900">Quality & Test Metrics</h3>
            <p className="mt-1 text-xs text-slate-500">Live test case verification status, passed vs failed rate.</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Test Cases Passed:</span>
                <strong className="text-emerald-600">{quality?.passedTests ?? 0} / {quality?.totalTestCases ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Failed / Open Defects:</span>
                <strong className="text-rose-600">{quality?.failedTests ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending Tests:</span>
                <strong className="text-slate-600">{quality?.pendingTests ?? 0}</strong>
              </div>
            </div>

            {/* Live Progress */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">QA Pass Index</span>
                <span className="text-emerald-600 font-extrabold">{quality?.testPassRate ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${quality?.testPassRate ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModalReport('QUALITY_REPORT')}
              className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              View Live Report
            </button>
            <button
              type="button"
              disabled
              title="Exports require Admin privileges"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <LockKeyhole size={12} />
              Export
            </button>
          </div>
        </article>

        {/* 5. Resource Allocation */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Users size={18} />
              </div>
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-teal-700">
                {resources?.totalMembers ?? 0} Members
              </span>
            </div>

            <h3 className="text-[15px] font-extrabold text-slate-900">Resource Allocation</h3>
            <p className="mt-1 text-xs text-slate-500">Cross-department workforce distribution and squad assignment.</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Projects:</span>
                <strong className="text-slate-800">{resources?.projectAllocations?.length ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Departments Active:</span>
                <strong className="text-teal-600">{Object.keys(resources?.departmentDistribution ?? {}).length || 4}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Headcount:</span>
                <strong className="text-slate-900">{resources?.totalMembers ?? 0} employees</strong>
              </div>
            </div>

            {/* Live Distribution Bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Squad Staffing</span>
                <span className="text-teal-600 font-extrabold">Optimal</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModalReport('RESOURCE_ALLOCATION')}
              className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              View Live Report
            </button>
            <button
              type="button"
              disabled
              title="Exports require Admin privileges"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <LockKeyhole size={12} />
              Export
            </button>
          </div>
        </article>

        {/* 6. Release Readiness Index */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Rocket size={18} />
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                (release?.readinessScore ?? 0) >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {release?.releaseStatus ?? 'IN PROGRESS'}
              </span>
            </div>

            <h3 className="text-[15px] font-extrabold text-slate-900">Release Readiness Index</h3>
            <p className="mt-1 text-xs text-slate-500">Go-live milestone readiness and blocker tracking.</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Completed Features:</span>
                <strong className="text-emerald-600">{release?.completedFeatures ?? 0} / {release?.totalFeatures ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Open Blockers:</span>
                <strong className={release?.openBlockers ? 'text-rose-600' : 'text-emerald-600'}>
                  {release?.openBlockers ?? 0} {release?.openBlockers ? 'blockers' : 'None'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">QA Pass Rate:</span>
                <strong className="text-purple-600">{release?.passedVerificationRate ?? 0}%</strong>
              </div>
            </div>

            {/* Live Readiness Bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Readiness Score</span>
                <span className="text-purple-600 font-extrabold">{release?.readinessScore ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-700"
                  style={{ width: `${release?.readinessScore ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModalReport('RELEASE_READINESS')}
              className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              View Live Report
            </button>
            <button
              type="button"
              disabled
              title="Exports require Admin privileges"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <LockKeyhole size={12} />
              Export
            </button>
          </div>
        </article>
      </section>

      {/* REPORT DRILL-DOWN MODAL */}
      {activeModalReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          onClick={() => setActiveModalReport(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModalReport(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            {/* Modal Content Based on Selected Report */}
            {activeModalReport === 'PROJECT_OVERVIEW' && (
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <FolderKanban size={20} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Live Executive Report</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Project Status Overview & Portfolio Breakdown</h3>
                <p className="mt-1 text-xs text-slate-500 mb-4">Real-time status, delivery progress, and health metrics for all projects.</p>

                <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Project Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Live Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(overview?.projectBreakdown ?? []).map((p) => (
                        <tr key={p.code} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-slate-700">{p.code}</td>
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full bg-blue-500" style={{ width: `${p.progress}%` }} />
                              </div>
                              <span className="font-bold text-slate-800">{p.progress}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeModalReport === 'SPRINT_SUMMARY' && (
              <div>
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <ListChecks size={20} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Live Executive Report</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Sprint Delivery & Story Point Burnup</h3>
                <p className="mt-1 text-xs text-slate-500 mb-4">Detailed story points planned vs completed across all sprint iterations.</p>

                <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Sprint Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Tasks</th>
                        <th className="p-3">Points Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(sprint?.sprintList ?? []).map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{s.name}</td>
                          <td className="p-3">
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              {s.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{s.tasksCount} tasks</td>
                          <td className="p-3 font-bold text-indigo-600">{s.completedPoints} / {s.plannedPoints} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeModalReport === 'TEAM_PRODUCTIVITY' && (
              <div>
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <TrendingUp size={20} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Live Executive Report</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Team Productivity & Velocity Analysis</h3>
                <p className="mt-1 text-xs text-slate-500 mb-4">Breakdown of delivered work and developer velocity metrics.</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-[10px] font-bold text-slate-400">Total Points Delivered</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{team?.totalPointsDelivered ?? 0} pts</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-[10px] font-bold text-slate-400">Average Velocity</span>
                    <p className="text-xl font-black text-amber-600 mt-0.5">{team?.averageVelocity ?? 0} pts/sprint</p>
                  </div>
                </div>
              </div>
            )}

            {activeModalReport === 'QUALITY_REPORT' && (
              <div>
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                  <Bug size={20} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Live Executive Report</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Quality Assurance & Defect Health Report</h3>
                <p className="mt-1 text-xs text-slate-500 mb-4">Real-time test suite execution, pass rates, and bug resolution status.</p>

                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                    <span className="text-2xl font-black text-emerald-600">{quality?.passedTests ?? 0}</span>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">Tests Passed</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                    <span className="text-2xl font-black text-rose-600">{quality?.failedTests ?? 0}</span>
                    <p className="text-[10px] font-bold text-rose-700 mt-0.5">Failed / Bugs</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-center">
                    <span className="text-2xl font-black text-slate-600">{quality?.pendingTests ?? 0}</span>
                    <p className="text-[10px] font-bold text-slate-700 mt-0.5">Pending</p>
                  </div>
                </div>
              </div>
            )}

            {activeModalReport === 'RESOURCE_ALLOCATION' && (
              <div>
                <div className="flex items-center gap-2 text-teal-600 mb-1">
                  <Users size={20} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Live Executive Report</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Resource & Department Allocation</h3>
                <p className="mt-1 text-xs text-slate-500 mb-4">Live headcount allocation across engineering, QA, and management squads.</p>

                <div className="rounded-xl bg-slate-50 p-4 mb-4">
                  <h4 className="text-xs font-extrabold text-slate-700 mb-2">Department Distribution</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(resources?.departmentDistribution ?? {}).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-semibold text-slate-600">{dept}</span>
                        <strong className="font-bold text-slate-900">{count} members</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeModalReport === 'RELEASE_READINESS' && (
              <div>
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Rocket size={20} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Live Executive Report</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Release Readiness & Milestone Check</h3>
                <p className="mt-1 text-xs text-slate-500 mb-4">Real-time gate check on open blockers, verified features, and release criteria.</p>

                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4 mb-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Release Status:</span>
                    <strong className="text-purple-700 font-extrabold">{release?.releaseStatus}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Overall Readiness Index:</span>
                    <strong className="text-slate-900 font-extrabold">{release?.readinessScore}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Verified Features:</span>
                    <strong className="text-emerald-600">{release?.completedFeatures} / {release?.totalFeatures}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Active Blockers:</span>
                    <strong className={release?.openBlockers ? 'text-rose-600' : 'text-emerald-600'}>
                      {release?.openBlockers}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalReport(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewerReports;