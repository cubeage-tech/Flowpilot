import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiTrendingDown, FiTrendingUp,
  FiCalendar
} from 'react-icons/fi';
import { TYPE, SURFACE, STATUS, FIELD } from './scrumUI';
import {
  fetchAnalytics,
  fetchSprints,
  type Analytics,
  type DayPoint,
  type Sprint
} from './scrumApi';

/**
 * Charts are hand-rolled SVG on a unitless viewBox: every coordinate is
 * derived from the data, so a sprint of any length or size renders correctly.
 * Nothing here is a fixed pixel position.
 */
const PLOT = { width: 640, height: 240, padLeft: 34, padRight: 12, padTop: 12, padBottom: 26 };

const innerWidth = PLOT.width - PLOT.padLeft - PLOT.padRight;
const innerHeight = PLOT.height - PLOT.padTop - PLOT.padBottom;

/** Rounds an axis maximum up to something a human would choose. */
const niceCeiling = (value: number): number => {
  if (value <= 5) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
};

type Mode = 'burndown' | 'burnup';


/**
 * The API client throws the backend's message rather than a status code, so the
 * "no active sprint" 404 is recognised by its text. It is the normal state for
 * a new team, not a fault, so it must not render as an error.
 */
const isNoActiveSprint = (message: string): boolean =>
  message.toLowerCase().includes('no active sprint');

export const ScrumBurndown: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintId, setSprintId] = useState<number | ''>('');
  const [mode, setMode] = useState<Mode>('burndown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (id?: number) => {
    setError('');

    try {
      const [analytics, sprintList] = await Promise.all([
        fetchAnalytics(id),
        fetchSprints()
      ]);
      setData(analytics);
      setSprints(sprintList);
      setSprintId(analytics.burndown.sprintId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Memoised so the scale below is not recomputed on every render.
  const series: DayPoint[] = useMemo(() => data?.burndown.series ?? [], [data]);

  const scale = useMemo(() => {
    const peak = Math.max(
      1,
      ...series.map((p) => Math.max(p.totalPoints, p.remainingPoints, p.idealRemaining)),
      data?.burndown.committedPoints ?? 0
    );

    const maxY = niceCeiling(peak);
    const lastDay = Math.max(1, data?.burndown.durationDays ?? series.length, series.length);

    return {
      maxY,
      lastDay,
      x: (day: number) => PLOT.padLeft + ((day - 1) / Math.max(1, lastDay - 1)) * innerWidth,
      y: (points: number) => PLOT.padTop + innerHeight - (points / maxY) * innerHeight
    };
  }, [series, data]);

  if (loading) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} ${TYPE.body} text-slate-500`}>
        Loading analytics…
      </div>
    );
  }

  // No running sprint is the expected state for a new team, not a failure
  if (error && isNoActiveSprint(error)) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} max-w-2xl`}>
        <div className="flex items-center gap-2">
          <FiCalendar size={16} className="text-slate-400 shrink-0" aria-hidden="true" />
          <h2 className={`${TYPE.title} text-slate-900`}>No sprint is running</h2>
        </div>
        <p className={`${TYPE.body} text-slate-600 mt-3 leading-relaxed`}>
          Burndown, velocity and the sprint KPIs all measure a sprint in flight. Start one under <span className="font-medium text-slate-900">Sprint Cycles</span>, or pick a past sprint to read its history.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} mt-4`}
        >
          <FiRefreshCw size={13} aria-hidden="true" /> Check again
        </button>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} border-rose-500/20`}>
        <p className={`${TYPE.body} text-rose-600`} role="alert">
          {error || 'No analytics available'}
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

  const { burndown, velocity, kpis } = data;

  const trendTone =
    burndown.trend === 'behind' ? STATUS.blocked
      : burndown.trend === 'ahead' ? STATUS.done
      : STATUS.active;

  const line = (pick: (p: DayPoint) => number) =>
    series.map((p) => `${scale.x(p.dayNumber)},${scale.y(pick(p))}`).join(' ');

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(scale.maxY * f));

  return (
    <div className="space-y-4">
      {/* Sprint selector and mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`${TYPE.title} text-slate-900`}>{burndown.sprintName} progress</h2>
          <p className={`${TYPE.meta} ${trendTone.text} font-medium`}>
            {burndown.trend === 'behind'
              ? `${burndown.pointsBehindIdeal} points behind the ideal line`
              : burndown.trend === 'ahead'
                ? `${Math.abs(burndown.pointsBehindIdeal)} points ahead of the ideal line`
                : 'Tracking on the ideal line'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="sprint-pick">Sprint</label>
          <select
            id="sprint-pick"
            value={sprintId}
            onChange={(event) => {
              const next = Number(event.target.value);
              setSprintId(next);
              void load(next);
            }}
            className={`${TYPE.meta} ${FIELD.select}`}
          >
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} · {sprint.status.toLowerCase()}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            {(['burndown', 'burnup'] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                aria-pressed={mode === option}
                className={`${TYPE.meta} font-semibold px-3 py-2 cursor-pointer transition-colors
                  ${mode === option
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {option === 'burndown' ? 'Burndown' : 'Burnup'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip — SRS Module 7 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Completed',
            value: `${kpis.tasksCompleted} / ${kpis.tasksTotal}`,
            note: `${burndown.totalPoints - burndown.remainingPoints} of ${burndown.totalPoints} points`,
            tone: STATUS.done
          },
          {
            label: 'Overdue',
            value: String(kpis.overdueTasks),
            note: kpis.overdueTasks === 0 ? 'Nothing late' : 'Past due date',
            tone: kpis.overdueTasks === 0 ? STATUS.done : STATUS.blocked
          },
          {
            label: 'Avg lead time',
            value: kpis.averageCompletionHours === null
              ? '—'
              : `${kpis.averageCompletionHours}h`,
            note: 'Created to done',
            tone: STATUS.active
          },
          {
            label: 'Sprint success',
            value: kpis.sprintSuccessRatePercent === null
              ? '—'
              : `${kpis.sprintSuccessRatePercent}%`,
            note: kpis.sprintsAssessed === 0
              ? 'No closed sprints yet'
              : `Across ${kpis.sprintsAssessed} closed`,
            tone: STATUS.plan
          }
        ].map((kpi) => (
          <div key={kpi.label} className={`${SURFACE.card} ${SURFACE.pad} relative overflow-hidden`}>
            <span className={`absolute inset-y-0 left-0 w-[3px] ${kpi.tone.rail}`} aria-hidden="true" />
            <div className={`${TYPE.eyebrow} text-slate-400`}>{kpi.label}</div>
            <div className={`${TYPE.metric} text-slate-900 mt-2`}>{kpi.value}</div>
            <div className={`${TYPE.meta} font-medium mt-1 ${kpi.tone.text}`}>{kpi.note}</div>
          </div>
        ))}
      </div>

      {/* Burndown / burnup */}
      <section className={`${SURFACE.card} ${SURFACE.pad}`}>
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
          <h3 className={`${TYPE.title} text-slate-900`}>
            {mode === 'burndown' ? 'Work remaining' : 'Work completed against scope'}
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {mode === 'burndown' ? (
              <>
                <Legend swatch="bg-emerald-500" label="Remaining" />
                <Legend dashed label="Ideal" />
                <Legend swatch="bg-slate-300" label="Scope" />
              </>
            ) : (
              <>
                <Legend swatch="bg-emerald-500" label="Completed" />
                <Legend swatch="bg-slate-300" label="Scope" />
              </>
            )}
          </div>
        </header>

        {series.length === 1 && (
          <p className={`${TYPE.meta} text-slate-500 mb-3`}>
            One snapshot so far — the trend line appears from the second day of the sprint.
          </p>
        )}

        {series.length === 0 ? (
          <p className={`${TYPE.body} text-slate-500`}>
            No snapshots yet. A daily snapshot is recorded once the sprint is running.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
            preserveAspectRatio="xMidYMid meet"
            className="block w-full h-[260px]"
            role="img"
            aria-label={
              mode === 'burndown'
                ? `Burndown for ${burndown.sprintName}: ${burndown.remainingPoints} of ${burndown.totalPoints} points remaining, ${burndown.trend}.`
                : `Burnup for ${burndown.sprintName}: ${burndown.totalPoints - burndown.remainingPoints} points completed against a scope of ${burndown.totalPoints}.`
            }
          >
            <defs>
              {/* Scoped id — a global one would collide with any other chart on the page */}
              <linearGradient id="scrumProgressFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
              </linearGradient>
            </defs>

            {gridValues.map((value) => (
              <g key={value}>
                <line
                  x1={PLOT.padLeft}
                  y1={scale.y(value)}
                  x2={PLOT.width - PLOT.padRight}
                  y2={scale.y(value)}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={PLOT.padLeft - 8}
                  y={scale.y(value) + 3}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  {value}
                </text>
              </g>
            ))}

            {/* Scope line — visible in both modes so added work is never hidden */}
            <polyline
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="1.5"
              points={line((p) => p.totalPoints)}
            />

            {mode === 'burndown' && (
              <polyline
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                points={line((p) => p.idealRemaining)}
              />
            )}

            <polygon
              fill="url(#scrumProgressFill)"
              points={`${line((p) => (mode === 'burndown' ? p.remainingPoints : p.completedPoints))} ${scale.x(series[series.length - 1].dayNumber)},${scale.y(0)} ${scale.x(series[0].dayNumber)},${scale.y(0)}`}
            />
            <polyline
              fill="none"
              stroke="#22C55E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={line((p) => (mode === 'burndown' ? p.remainingPoints : p.completedPoints))}
            />

            {series.map((point) => (
              <circle
                key={point.date}
                cx={scale.x(point.dayNumber)}
                cy={scale.y(mode === 'burndown' ? point.remainingPoints : point.completedPoints)}
                r="3"
                fill="#22C55E"
                stroke="#fff"
                strokeWidth="1.5"
              />
            ))}

            {series
              .filter((_, index) => index % Math.ceil(series.length / 7) === 0)
              .map((point) => (
                <text
                  key={`label-${point.date}`}
                  x={scale.x(point.dayNumber)}
                  y={PLOT.height - 8}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="middle"
                >
                  D{point.dayNumber}
                </text>
              ))}
          </svg>
        )}
      </section>

      {/* Velocity */}
      <section className={`${SURFACE.card} ${SURFACE.pad}`}>
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
          <h3 className={`${TYPE.title} text-slate-900`}>Velocity</h3>
          <div className="flex items-center gap-4">
            <span className={`${TYPE.meta} text-slate-500`}>
              {velocity.average === null ? (
                'No closed sprints yet'
              ) : (
                <>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {velocity.average.toFixed(1)}
                  </span>{' '}
                  avg over {velocity.sprintsCounted}
                </>
              )}
            </span>
            {velocity.rollingAverage !== null && (
              <span className={`${TYPE.meta} ${STATUS.done.text} font-semibold tabular-nums`}>
                {velocity.rollingAverage.toFixed(1)} last 3
              </span>
            )}
          </div>
        </header>

        {velocity.sprints.length === 0 ? (
          <p className={`${TYPE.body} text-slate-500`}>
            Velocity appears once a sprint has been completed.
          </p>
        ) : (
          <VelocityBars velocity={velocity} />
        )}
      </section>

      {/* Distribution and productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionCard title="By priority" slices={data.byPriority} icon="priority" />
        <DistributionCard title="By column" slices={data.byStatus} icon="status" />
      </div>

      {data.byMember.length > 0 && (
        <section className={`${SURFACE.card} ${SURFACE.pad}`}>
          <h3 className={`${TYPE.title} text-slate-900 mb-4`}>Workload by member</h3>
          <ul className="space-y-3">
            {data.byMember.map((member) => (
              <li key={member.memberId} className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-full shrink-0 grid place-items-center ${TYPE.meta}
                    font-semibold bg-slate-100 text-slate-600`}
                >
                  {member.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={`${TYPE.body} font-medium text-slate-900 truncate`}>
                      {member.name ?? 'Unknown'}
                    </span>
                    <span className={`${TYPE.meta} text-slate-500 tabular-nums shrink-0`}>
                      {member.completed}/{member.assigned} · {member.points}p
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${STATUS.done.rail}`}
                      style={{ width: `${member.completionPercent}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const Legend: React.FC<{ swatch?: string; dashed?: boolean; label: string }> = ({
  swatch,
  dashed,
  label
}) => (
  <span className={`${TYPE.meta} inline-flex items-center gap-1.5 text-slate-500`}>
    {dashed ? (
      <span className="w-3 border-t-[1.5px] border-dashed border-slate-300" aria-hidden="true" />
    ) : (
      <span className={`w-3 h-0.5 rounded-full ${swatch}`} aria-hidden="true" />
    )}
    {label}
  </span>
);

const VelocityBars: React.FC<{ velocity: Analytics['velocity'] }> = ({ velocity }) => {
  const peak = Math.max(
    1,
    ...velocity.sprints.map((s) => Math.max(s.completedPoints, s.committedPoints ?? 0))
  );
  const maxY = niceCeiling(peak);
  const slot = innerWidth / velocity.sprints.length;
  const barWidth = Math.min(40, slot * 0.55);
  const avgY = velocity.average === null
    ? null
    : PLOT.padTop + innerHeight - (velocity.average / maxY) * innerHeight;

  return (
    <svg
      viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-[240px]"
      role="img"
      aria-label={`Velocity across ${velocity.sprints.length} sprints, averaging ${velocity.average?.toFixed(1) ?? 'no'} points.`}
    >
      {velocity.sprints.map((sprint, index) => {
        const height = (sprint.completedPoints / maxY) * innerHeight;
        const x = PLOT.padLeft + index * slot + (slot - barWidth) / 2;
        const y = PLOT.padTop + innerHeight - height;

        return (
          <g key={sprint.sprintId}>
            {/* Commitment shown as an outline so under-delivery is visible */}
            {sprint.committedPoints !== null && sprint.committedPoints > 0 && (
              <rect
                x={x}
                y={PLOT.padTop + innerHeight - (sprint.committedPoints / maxY) * innerHeight}
                width={barWidth}
                height={(sprint.committedPoints / maxY) * innerHeight}
                rx="4"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
            )}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(height, 1)}
              rx="4"
              fill="#22C55E"
              fillOpacity={sprint.current ? 0.35 : 1}
            />
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="10"
              fill={sprint.current ? '#94A3B8' : '#16A34A'}
              fontWeight={600}
            >
              {sprint.completedPoints}
            </text>
            <text
              x={x + barWidth / 2}
              y={PLOT.height - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#94A3B8"
            >
              S{sprint.sprintNumber}
              {sprint.current ? '*' : ''}
            </text>
          </g>
        );
      })}

      {avgY !== null && (
        <line
          x1={PLOT.padLeft}
          y1={avgY}
          x2={PLOT.width - PLOT.padRight}
          y2={avgY}
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      )}
    </svg>
  );
};

const DistributionCard: React.FC<{
  title: string;
  slices: Analytics['byPriority'];
  icon: 'priority' | 'status';
}> = ({ title, slices, icon }) => {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <section className={`${SURFACE.card} ${SURFACE.pad}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon === 'priority'
          ? <FiTrendingUp size={14} className="text-slate-400" aria-hidden="true" />
          : <FiTrendingDown size={14} className="text-slate-400" aria-hidden="true" />}
        <h3 className={`${TYPE.title} text-slate-900`}>{title}</h3>
      </div>

      {total === 0 ? (
        <p className={`${TYPE.body} text-slate-500`}>Nothing to show yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {slices.map((slice) => (
            <li key={slice.label} className="flex items-center gap-3">
              <span className={`${TYPE.meta} text-slate-600 w-24 shrink-0 truncate`}>
                {slice.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-400"
                  style={{ width: `${total === 0 ? 0 : (slice.count / total) * 100}%` }}
                />
              </div>
              <span className={`${TYPE.meta} text-slate-500 tabular-nums shrink-0 w-16 text-right`}>
                {slice.count} · {slice.points}p
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
