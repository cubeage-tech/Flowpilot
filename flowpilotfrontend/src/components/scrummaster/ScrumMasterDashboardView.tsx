import React, { useCallback, useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiTarget
} from 'react-icons/fi';
import {
  TYPE,
  SURFACE,
  STATUS,
  COLUMN_TONE,
  PRIORITY_STYLE,
  FIELD,
  type StatusKey
} from './scrumUI';
import {
  fetchDashboard,
  STATUS_LABEL,
  PRIORITY_LABEL,
  type Card,
  type Dashboard,
  type SprintStatus
} from './scrumApi';

const SPRINT_TONE: Record<SprintStatus, StatusKey> = {
  PLANNED: 'idle',
  ACTIVE: 'active',
  COMPLETED: 'done'
};

const SPRINT_LABEL: Record<SprintStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Running',
  COMPLETED: 'Completed'
};

/** Ceremony tones arrive from the API as free text; fall back to idle. */
const toneFor = (tone: string): StatusKey => (tone in STATUS ? (tone as StatusKey) : 'idle');

const percentOf = (part: number, whole: number): number =>
  whole <= 0 ? 0 : Math.min(100, Math.round((part / whole) * 100));

const formatDay = (iso: string | null): string => {
  if (!iso) return '—';

  // Parsed at local midnight on purpose: `new Date('2026-08-25')` is read as UTC
  // and renders as the previous day for anyone west of Greenwich.
  const date = new Date(`${iso}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/**
 * The API client throws the backend's message rather than the status code, so
 * the "no sprint yet" 404 is recognised by its message. It is the expected
 * state for a new team rather than a failure, so it must not render as an error.
 */
const isNoActiveSprint = (message: string): boolean =>
  message.toLowerCase().includes('no active sprint');

export const ScrumMasterDashboardView: React.FC = () => {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setRefreshing(true);

    try {
      setData(await fetchDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the sprint');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} ${TYPE.body} text-slate-500`}>
        Loading the sprint…
      </div>
    );
  }

  // Checked before the error branch: no active sprint is a state, not a fault
  if (error && isNoActiveSprint(error)) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} max-w-2xl`}>
        <div className="flex items-center gap-2">
          <FiCalendar size={16} className="text-slate-400 shrink-0" aria-hidden="true" />
          <h2 className={`${TYPE.title} text-slate-900`}>No sprint is running</h2>
        </div>

        <p className={`${TYPE.body} text-slate-600 mt-3 leading-relaxed`}>
          Sprint Overview reports on the sprint that is currently in flight. Open
          <span className="font-medium text-slate-900"> Sprint Cycles</span>, create a sprint
          with a goal and a date range, pull in the backlog items the team is committing to,
          then press <span className="font-medium text-slate-900">Start</span>. Progress,
          ceremonies and stuck work all appear here from that moment.
        </p>

        <button
          type="button"
          onClick={() => void load()}
          disabled={refreshing}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} mt-4`}
        >
          <FiRefreshCw
            size={13}
            className={refreshing ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          Check again
        </button>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} border-rose-500/20`}>
        <p className={`${TYPE.body} text-rose-600`} role="alert">
          {error || 'No sprint data'}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} mt-3`}
        >
          <FiRefreshCw size={13} aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  const { sprint, kpis, ceremonies, stuckTasks } = data;

  // Longest-idle first: that is the order these get worked down in a standup
  const stuck = [...stuckTasks].sort((a, b) => b.daysInColumn - a.daysInColumn);

  const scheduled = sprint.startDate !== null && sprint.endDate !== null;
  const duration = sprint.durationDays;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`${TYPE.title} text-slate-900`}>Sprint {sprint.sprintNumber}</h2>
          <p className={`${TYPE.meta} text-slate-500`}>
            {scheduled
              ? `${formatDay(sprint.startDate)} – ${formatDay(sprint.endDate)}`
              : 'No dates set'}
            {duration !== null && duration > 0 && ` · ${duration} working days`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={refreshing}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
        >
          <FiRefreshCw
            size={13}
            className={refreshing ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* KPI row — where the sprint stands right now */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile
          label="Sprint"
          note={SPRINT_LABEL[sprint.status]}
          tone={SPRINT_TONE[sprint.status]}
        >
          {/* Title rather than metric: a sprint name is prose and would wrap badly at 30px */}
          <span className={`${TYPE.title} text-slate-900 block leading-snug break-words`}>
            {sprint.name}
          </span>
        </KpiTile>

        <KpiTile
          label="Days remaining"
          note={
            duration === null || duration === 0
              ? 'No end date set'
              : `of ${duration} working days`
          }
          tone={
            duration === null || duration === 0
              ? 'idle'
              : sprint.daysRemaining <= 3
                ? 'blocked'
                : 'active'
          }
        >
          <span className={`${TYPE.metric} text-slate-900`}>{sprint.daysRemaining}</span>
        </KpiTile>

        <KpiTile
          label="Tasks done"
          note={
            kpis.tasksTotal === 0
              ? 'No tasks in the sprint'
              : `${percentOf(kpis.tasksCompleted, kpis.tasksTotal)}% complete`
          }
          tone={kpis.tasksTotal === 0 ? 'idle' : 'done'}
        >
          <span className={`${TYPE.metric} text-slate-900`}>
            {kpis.tasksCompleted} / {kpis.tasksTotal}
          </span>
        </KpiTile>

        <KpiTile
          label="Stuck tasks"
          note={stuck.length === 0 ? 'Everything moving' : 'Idle three days or more'}
          tone={stuck.length === 0 ? 'done' : 'blocked'}
        >
          <span className={`${TYPE.metric} text-slate-900`}>{stuck.length}</span>
        </KpiTile>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        {/* Goal and progress */}
        <section className={`${SURFACE.card} ${SURFACE.pad} flex flex-col`}>
          <div className="flex items-center gap-2">
            <FiTarget size={14} className={`shrink-0 ${STATUS.done.text}`} aria-hidden="true" />
            <h3 className={`${TYPE.eyebrow} text-emerald-600`}>Sprint goal</h3>
          </div>

          {sprint.goal ? (
            <p className={`${TYPE.title} text-slate-900 mt-3 leading-relaxed`}>{sprint.goal}</p>
          ) : (
            <p className={`${TYPE.body} text-slate-500 mt-3`}>
              No goal recorded. A sprint without a stated goal gives the team nothing to
              prioritise against — add one in Sprint Cycles.
            </p>
          )}

          <div className="mt-auto pt-5 space-y-3">
            <ProgressBar
              label="Points completed"
              value={`${sprint.donePoints} of ${sprint.totalPoints}`}
              percent={percentOf(sprint.donePoints, sprint.totalPoints)}
              tone="done"
            />
            <ProgressBar
              label="Sprint elapsed"
              value={
                duration === null || duration === 0
                  ? `Day ${sprint.daysElapsed}`
                  : `Day ${sprint.daysElapsed} of ${duration}`
              }
              percent={duration === null ? 0 : percentOf(sprint.daysElapsed, duration)}
              tone="active"
            />

            {sprint.overCapacity && (
              <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium flex items-start gap-1.5`}>
                <FiAlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
                {sprint.capacityPoints === null
                  ? 'Committed work is over the team’s capacity for this sprint'
                  : `Over capacity: ${sprint.totalPoints} points in scope against a capacity of ${sprint.capacityPoints}`}
              </p>
            )}

            {sprint.scopeAddedPoints > 0 && (
              <p className={`${TYPE.meta} ${STATUS.active.text} font-medium`}>
                Scope grew by {sprint.scopeAddedPoints} point
                {sprint.scopeAddedPoints === 1 ? '' : 's'} since the sprint started
              </p>
            )}
          </div>
        </section>

        {/* What happens next */}
        <section className={`${SURFACE.card} ${SURFACE.pad}`}>
          <div className="flex items-center gap-2">
            <FiClock size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
            <h3 className={`${TYPE.title} text-slate-900`}>Ceremony schedule</h3>
          </div>

          {ceremonies.length === 0 ? (
            <p className={`${TYPE.body} text-slate-500 mt-4`}>
              Set the sprint’s start and end dates to schedule the review, retrospective and
              next planning session.
            </p>
          ) : (
            <ul className="mt-4 space-y-1">
              {ceremonies.map((ceremony) => (
                <li
                  key={ceremony.name}
                  className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS[toneFor(ceremony.tone)].rail}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`${TYPE.body} font-medium text-slate-900 truncate`}>
                      {ceremony.name}
                    </div>
                    <div className={`${TYPE.meta} text-slate-400`}>{ceremony.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Stuck work — named cards, because a count alone is not actionable */}
      {stuck.length === 0 ? (
        <div
          className={`${SURFACE.card} ${SURFACE.padTight} border-emerald-500/20 flex items-start gap-2.5`}
        >
          <FiCheckCircle
            size={15}
            className={`shrink-0 mt-0.5 ${STATUS.done.text}`}
            aria-hidden="true"
          />
          <p className={`${TYPE.body} text-slate-700`}>
            Nothing is stuck. Every unfinished card in the sprint has moved column within the
            last three days.
          </p>
        </div>
      ) : (
        <section className={`${SURFACE.card} border-rose-500/20 overflow-hidden`}>
          <header className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-rose-500/15 bg-rose-500/5">
            <FiAlertTriangle className="text-rose-600 shrink-0" size={14} aria-hidden="true" />
            <h3 className={`${TYPE.eyebrow} text-rose-600`}>Needs unblocking · {stuck.length}</h3>
          </header>

          <div className={SURFACE.pad}>
            <p className={`${TYPE.meta} text-slate-500`}>
              Each card below has sat in the same column for three days or more, longest first.
            </p>

            <ul className="mt-2">
              {stuck.map((card) => (
                <StuckRow key={card.id} card={card} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
};

const KpiTile: React.FC<{
  label: string;
  note: string;
  tone: StatusKey;
  children: React.ReactNode;
}> = ({ label, note, tone, children }) => (
  <div className={`${SURFACE.card} ${SURFACE.pad} relative overflow-hidden`}>
    <span
      className={`absolute inset-y-0 left-0 w-[3px] ${STATUS[tone].rail}`}
      aria-hidden="true"
    />
    <div className={`${TYPE.eyebrow} text-slate-400`}>{label}</div>
    <div className="mt-2">{children}</div>
    <div className={`${TYPE.meta} font-medium mt-1 ${STATUS[tone].text}`}>{note}</div>
  </div>
);

const ProgressBar: React.FC<{
  label: string;
  value: string;
  percent: number;
  tone: StatusKey;
}> = ({ label, value, percent, tone }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3 mb-1.5">
      <span className={`${TYPE.meta} font-medium text-slate-500`}>{label}</span>
      <span className={`${TYPE.meta} font-semibold text-slate-900 tabular-nums`}>{value}</span>
    </div>
    <div
      className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${value} · ${percent}%`}
    >
      <div
        className={`h-full rounded-full ${STATUS[tone].rail}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const StuckRow: React.FC<{ card: Card }> = ({ card }) => {
  const tone = STATUS[COLUMN_TONE[card.status]];

  return (
    <li className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-baseline gap-2">
        <span className={`${TYPE.code} text-slate-400 shrink-0`}>{card.taskKey}</span>
        <span className={`${TYPE.body} font-medium text-slate-900 min-w-0 flex-1`}>
          {card.title}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
        <span className={`${TYPE.meta} inline-flex items-center gap-1.5 font-medium ${tone.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.rail}`} aria-hidden="true" />
          {STATUS_LABEL[card.status]} · {card.daysInColumn} day
          {card.daysInColumn === 1 ? '' : 's'}
        </span>

        <span className={`${TYPE.meta} inline-flex items-center gap-1.5 text-slate-500`}>
          {card.assigneeName === null ? (
            'Unassigned'
          ) : (
            <>
              <span
                className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${TYPE.code}
                  font-semibold bg-slate-100 text-slate-600`}
                aria-hidden="true"
              >
                {card.assigneeInitials}
              </span>
              {card.assigneeName}
            </>
          )}
        </span>

        <span
          className={`${TYPE.meta} border rounded px-1.5 py-0.5 ${PRIORITY_STYLE[card.priority].chip}`}
        >
          {PRIORITY_LABEL[card.priority]}
        </span>

        {card.overdue && (
          <span className={`${TYPE.meta} font-semibold ${STATUS.blocked.text}`}>Overdue</span>
        )}
      </div>

      {card.blockedReason && (
        <p className={`${TYPE.meta} text-slate-500 mt-1.5`}>Blocked: {card.blockedReason}</p>
      )}
    </li>
  );
};
