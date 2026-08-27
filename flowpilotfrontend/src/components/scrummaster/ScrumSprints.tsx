import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import { TYPE, SURFACE, STATUS, PRIORITY_STYLE, FIELD } from './scrumUI';
import {
  addToSprint,
  completeSprint,
  fetchBoard,
  fetchProjects,
  createSprint,
  deleteSprint,
  fetchBacklog,
  fetchSprints,
  removeFromSprint,
  startSprint,
  updateSprint,
  type Card,
  type Project,
  type Sprint,
  type SprintStatus
} from './scrumApi';

const TONE: Record<SprintStatus, (typeof STATUS)[keyof typeof STATUS]> = {
  PLANNED: STATUS.idle,
  ACTIVE: STATUS.active,
  COMPLETED: STATUS.done
};

const STATUS_LABEL: Record<SprintStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Running',
  COMPLETED: 'Closed'
};

const todayIso = (): string => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** Date-only strings are parsed by parts to avoid a UTC-midnight day shift. */
const formatDate = (iso: string | null): string => {
  if (!iso) return '—';

  const [y, m, d] = iso.split('-');
  const parsed = new Date(Number(y), Number(m) - 1, Number(d));

  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

interface SprintDraft {
  name: string;
  goal: string;
  startDate: string;
  /** Either an end date or a length; the form makes the choice explicit. */
  endMode: 'duration' | 'date';
  durationDays: string;
  endDate: string;
  capacityPoints: string;
  projectId: string;
}

const emptyDraft = (): SprintDraft => ({
  name: '',
  goal: '',
  startDate: todayIso(),
  endMode: 'duration',
  durationDays: '14',
  endDate: '',
  capacityPoints: '',
  projectId: ''
});

export const ScrumSprints: React.FC = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<Card[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<SprintDraft>(emptyDraft());
  const [picked, setPicked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<SprintDraft>(emptyDraft());

  const load = useCallback(async () => {
    setError('');

    try {
      const [sprintList, backlogList, projectList] = await Promise.all([
        fetchSprints(),
        fetchBacklog(),
        // A sprint belongs to a project (SRS section 14). The list is the PM
        // module's, read-only, so a renamed project renames here too.
        fetchProjects().catch(() => [])
      ]);
      setSprints(sprintList);
      setBacklog(backlogList);
      setProjects(projectList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sprints');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Planning only makes sense against a capacity, so the total is always live. */
  const pickedPoints = useMemo(
    () =>
      backlog
        .filter((task) => picked.includes(task.id))
        .reduce((sum, task) => sum + task.storyPoints, 0),
    [backlog, picked]
  );

  /** Shown under the picker so the roster consequence is visible up front. */
  const selectedProject = projects.find((p) => String(p.id) === draft.projectId) ?? null;

  /** Sprints carry a project id; the name lives in the PM module. */
  const projectNameOf = (projectId: number | null): string | null => {
    if (projectId === null) return null;

    const found = projects.find((p) => p.id === projectId);
    return found ? (found.name ?? found.code ?? `Project ${projectId}`) : `Project ${projectId}`;
  };

  const capacity = Number(draft.capacityPoints) || 0;
  const overCapacity = capacity > 0 && pickedPoints > capacity;

  const run = async (id: number, action: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    setError('');
    setNotice('');

    try {
      await action();
      setNotice(message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!draft.name.trim()) {
      setFormError('Sprint name is required');
      return;
    }

    setSaving(true);
    setFormError('');
    setNotice('');

    try {
      const created = await createSprint({
        name: draft.name.trim(),
        goal: draft.goal.trim() || null,
        startDate: draft.startDate || null,
        endDate: draft.endMode === 'date' ? draft.endDate || null : null,
        durationDays: draft.endMode === 'duration' ? Number(draft.durationDays) || null : null,
        capacityPoints: draft.capacityPoints === '' ? null : Number(draft.capacityPoints),
        projectId: draft.projectId === '' ? null : Number(draft.projectId),
        backlogTaskIds: picked
      });

      setDraft(emptyDraft());
      setPicked([]);
      setShowForm(false);
      setNotice(
        `${created.name} planned with ${created.taskCount} task${created.taskCount === 1 ? '' : 's'}. Start it when the team is ready.`
      );
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the sprint');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (sprint: Sprint) => {
    const targets = sprints.filter((s) => s.status === 'PLANNED' && s.id !== sprint.id);

    // Unfinished work has to go somewhere, and dumping it into an arbitrary
    // sprint loses it from view, so the destination is always chosen out loud.
    const choice = targets.length
      ? window.prompt(
          `Complete ${sprint.name}. Where should unfinished work go?\n\n` +
            targets.map((s) => `  ${s.id} — ${s.name}`).join('\n') +
            `\n\nEnter a sprint id, or leave empty to return it to the backlog.`,
          String(targets[0].id)
        )
      : window.confirm(
          `Complete ${sprint.name}? Unfinished work returns to the backlog.`
        )
        ? ''
        : null;

    if (choice === null) {
      return;
    }

    const carryTo = choice.trim() === '' ? undefined : Number(choice.trim());

    if (carryTo !== undefined && !targets.some((s) => s.id === carryTo)) {
      setError(`Sprint ${carryTo} is not a planned sprint that work can carry into.`);
      return;
    }

    setBusyId(sprint.id);
    setError('');
    setNotice('');

    try {
      const result = await completeSprint(sprint.id, carryTo);

      setNotice(
        `${sprint.name} closed: ${result.completedPoints}p delivered` +
          (result.carriedTaskCount > 0
            ? `, ${result.carriedTaskCount} task${result.carriedTaskCount === 1 ? '' : 's'} (${result.carriedPoints}p) carried to ${result.carriedToSprintName ?? 'the backlog'}.`
            : ', nothing left over.')
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete the sprint');
    } finally {
      setBusyId(null);
    }
  };

  const beginEdit = (sprint: Sprint) => {
    setEditingId(sprint.id);
    setEditDraft({
      name: sprint.name,
      goal: sprint.goal ?? '',
      startDate: sprint.startDate ?? '',
      endMode: 'date',
      durationDays: '',
      endDate: sprint.endDate ?? '',
      capacityPoints: sprint.capacityPoints === null ? '' : String(sprint.capacityPoints),
      projectId: sprint.projectId === null ? '' : String(sprint.projectId)
    });
  };

  const handleEdit = async (sprint: Sprint) => {
    await run(
      sprint.id,
      () =>
        updateSprint(sprint.id, {
          name: editDraft.name.trim(),
          goal: editDraft.goal.trim() || null,
          startDate: editDraft.startDate || null,
          endDate: editDraft.endDate || null,
          capacityPoints: editDraft.capacityPoints === '' ? null : Number(editDraft.capacityPoints),
          projectId: editDraft.projectId === '' ? null : Number(editDraft.projectId)
        }),
      `${sprint.name} updated.`
    );
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} ${TYPE.body} text-slate-500`}>
        Loading sprints…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`${TYPE.title} text-slate-900`}>Sprint cycles</h2>
          <p className={`${TYPE.meta} text-slate-500`}>
            {sprints.length} sprint{sprints.length === 1 ? '' : 's'} ·{' '}
            {backlog.length} task{backlog.length === 1 ? '' : 's'} in the backlog
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
          >
            <FiRefreshCw size={13} aria-hidden="true" /> Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
          >
            {showForm ? <FiX size={13} aria-hidden="true" /> : <FiPlus size={13} aria-hidden="true" />}
            {showForm ? 'Cancel' : 'Plan a sprint'}
          </button>
        </div>
      </div>

      {notice && (
        <p className={`${TYPE.meta} ${STATUS.done.text} font-medium`} aria-live="polite">
          {notice}
        </p>
      )}
      {error && (
        <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium`} role="alert">
          {error}
        </p>
      )}

      {/* Planning: the sprint and the work it commits to, decided together */}
      {showForm && (
        <form onSubmit={handleCreate} className={`${SURFACE.card} ${SURFACE.pad} space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-name">
                Name
              </label>
              <input
                id="sprint-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Sprint 3"
                className={`${TYPE.body} ${FIELD.input}`}
              />
            </div>

            <div>
              <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-capacity">
                Capacity in points
              </label>
              <input
                id="sprint-capacity"
                type="number"
                min={0}
                value={draft.capacityPoints}
                onChange={(event) => setDraft({ ...draft, capacityPoints: event.target.value })}
                placeholder="How much the team can take on"
                className={`${TYPE.body} ${FIELD.input}`}
              />
            </div>
          </div>

          <div>
            <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-project">
              Project
            </label>
            <select
              id="sprint-project"
              value={draft.projectId}
              onChange={(event) => setDraft({ ...draft, projectId: event.target.value })}
              className={`${TYPE.body} ${FIELD.input} cursor-pointer`}
            >
              <option value="">Not linked to a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code ? `${project.code} — ` : ''}{project.name ?? 'Unnamed'}
                  {project.status ? ` (${project.status})` : ''}
                </option>
              ))}
            </select>
            {selectedProject && (
              <p className={`${TYPE.meta} text-slate-500 mt-1.5`}>
                {selectedProject.memberCount === 0
                  ? 'This project has no team members recorded yet, so the sprint roster will be empty.'
                  : `Sprint roster comes from this project's team: ${selectedProject.members
                      .map((member) => member.name ?? member.email)
                      .filter(Boolean)
                      .join(', ')}`}
              </p>
            )}
          </div>

          <div>
            <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-goal">
              Goal
            </label>
            <textarea
              id="sprint-goal"
              rows={2}
              value={draft.goal}
              onChange={(event) => setDraft({ ...draft, goal: event.target.value })}
              placeholder="One sentence the team can hold itself to"
              className={`${TYPE.body} ${FIELD.input}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-start">
                Starts
              </label>
              <input
                id="sprint-start"
                type="date"
                value={draft.startDate}
                onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
                className={`${TYPE.body} ${FIELD.input}`}
              />
            </div>

            <div>
              <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-endmode">
                Ends by
              </label>
              <select
                id="sprint-endmode"
                value={draft.endMode}
                onChange={(event) =>
                  setDraft({ ...draft, endMode: event.target.value as 'duration' | 'date' })
                }
                className={`${TYPE.body} ${FIELD.input} cursor-pointer`}
              >
                <option value="duration">A length</option>
                <option value="date">A fixed date</option>
              </select>
            </div>

            <div>
              {draft.endMode === 'duration' ? (
                <>
                  <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-days">
                    Calendar days
                  </label>
                  <input
                    id="sprint-days"
                    type="number"
                    min={1}
                    value={draft.durationDays}
                    onChange={(event) => setDraft({ ...draft, durationDays: event.target.value })}
                    className={`${TYPE.body} ${FIELD.input}`}
                  />
                </>
              ) : (
                <>
                  <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="sprint-end">
                    End date
                  </label>
                  <input
                    id="sprint-end"
                    type="date"
                    value={draft.endDate}
                    onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
                    className={`${TYPE.body} ${FIELD.input}`}
                  />
                </>
              )}
            </div>
          </div>

          {/* Backlog selection with a running total — the point of planning */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <span className={`${TYPE.eyebrow} text-slate-400`}>
                Pull in from the backlog
              </span>
              <span
                className={`${TYPE.meta} font-semibold tabular-nums
                  ${overCapacity ? STATUS.blocked.text : 'text-slate-600'}`}
              >
                {picked.length} selected · {pickedPoints}p
                {capacity > 0 && ` of ${capacity}p capacity`}
              </span>
            </div>

            {overCapacity && (
              <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium mb-2`}>
                <FiAlertTriangle size={11} className="inline mr-1" aria-hidden="true" />
                {pickedPoints - capacity}p over capacity — the team is unlikely to finish this.
              </p>
            )}

            {backlog.length === 0 ? (
              <p className={`${TYPE.body} text-slate-500`}>
                The backlog is empty. Add tasks on the board first.
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {backlog.map((task) => (
                  <li key={task.id}>
                    <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={picked.includes(task.id)}
                        onChange={(event) =>
                          setPicked((current) =>
                            event.target.checked
                              ? [...current, task.id]
                              : current.filter((id) => id !== task.id)
                          )
                        }
                        className="shrink-0"
                      />
                      <span className={`${TYPE.code} text-slate-400 shrink-0`}>{task.taskKey}</span>
                      <span
                        className={`${TYPE.meta} font-semibold px-1.5 py-0.5 rounded border shrink-0
                          ${PRIORITY_STYLE[task.priority].chip}`}
                      >
                        {PRIORITY_STYLE[task.priority].mark}
                      </span>
                      <span className={`${TYPE.body} text-slate-800 truncate flex-1`}>
                        {task.title}
                      </span>
                      <span className={`${TYPE.meta} text-slate-500 tabular-nums shrink-0`}>
                        {task.storyPoints}p
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && (
            <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium`} role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
          >
            {saving ? 'Planning…' : 'Create sprint'}
          </button>
        </form>
      )}

      {/* Sprint list */}
      {sprints.length === 0 ? (
        <div className={`${SURFACE.card} ${SURFACE.pad}`}>
          <p className={`${TYPE.body} text-slate-600`}>
            No sprints yet. Plan one to start tracking work.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sprints.map((sprint) => {
            const tone = TONE[sprint.status];
            const busy = busyId === sprint.id;
            const editing = editingId === sprint.id;

            return (
              <li key={sprint.id}>
                <article
                  className={`${SURFACE.card} ${SURFACE.pad} relative overflow-hidden
                    ${busy ? 'opacity-50' : ''}`}
                >
                  <span className={`absolute inset-y-0 left-0 w-[3px] ${tone.rail}`} aria-hidden="true" />

                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor={`edit-name-${sprint.id}`}>
                            Name
                          </label>
                          <input
                            id={`edit-name-${sprint.id}`}
                            value={editDraft.name}
                            onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                            className={`${TYPE.body} ${FIELD.input}`}
                          />
                        </div>
                        <div>
                          <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor={`edit-cap-${sprint.id}`}>
                            Capacity
                          </label>
                          <input
                            id={`edit-cap-${sprint.id}`}
                            type="number"
                            min={0}
                            value={editDraft.capacityPoints}
                            onChange={(event) => setEditDraft({ ...editDraft, capacityPoints: event.target.value })}
                            className={`${TYPE.body} ${FIELD.input}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor={`edit-goal-${sprint.id}`}>
                          Goal
                        </label>
                        <textarea
                          id={`edit-goal-${sprint.id}`}
                          rows={2}
                          value={editDraft.goal}
                          onChange={(event) => setEditDraft({ ...editDraft, goal: event.target.value })}
                          className={`${TYPE.body} ${FIELD.input}`}
                        />
                      </div>

                      <div>
                        <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor={`edit-project-${sprint.id}`}>
                          Project
                        </label>
                        <select
                          id={`edit-project-${sprint.id}`}
                          value={editDraft.projectId}
                          onChange={(event) => setEditDraft({ ...editDraft, projectId: event.target.value })}
                          className={`${TYPE.body} ${FIELD.input} cursor-pointer`}
                        >
                          <option value="">Not linked to a project</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.code ? `${project.code} — ` : ''}{project.name ?? 'Unnamed'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor={`edit-start-${sprint.id}`}>
                            Starts
                          </label>
                          <input
                            id={`edit-start-${sprint.id}`}
                            type="date"
                            value={editDraft.startDate}
                            onChange={(event) => setEditDraft({ ...editDraft, startDate: event.target.value })}
                            className={`${TYPE.body} ${FIELD.input}`}
                          />
                        </div>
                        <div>
                          <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor={`edit-end-${sprint.id}`}>
                            Ends
                          </label>
                          <input
                            id={`edit-end-${sprint.id}`}
                            type="date"
                            value={editDraft.endDate}
                            onChange={(event) => setEditDraft({ ...editDraft, endDate: event.target.value })}
                            className={`${TYPE.body} ${FIELD.input}`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleEdit(sprint)}
                          className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`${TYPE.title} text-slate-900`}>{sprint.name}</h3>
                          <span className={`${TYPE.eyebrow} px-2 py-0.5 rounded-md ${tone.soft} ${tone.text}`}>
                            {STATUS_LABEL[sprint.status]}
                          </span>
                        </div>

                        {sprint.goal && (
                          <p className={`${TYPE.body} text-slate-600 mt-1.5`}>{sprint.goal}</p>
                        )}

                        <p className={`${TYPE.meta} text-slate-400 mt-1.5 tabular-nums`}>
                          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                          {sprint.durationDays !== null && ` · ${sprint.durationDays} working days`}
                          {' · '}{sprint.taskCount} task{sprint.taskCount === 1 ? '' : 's'}
                          {' · '}{sprint.totalPoints}p
                          {sprint.capacityPoints !== null && ` of ${sprint.capacityPoints}p capacity`}
                          {sprint.committedPoints !== null && ` · committed ${sprint.committedPoints}p`}
                        </p>

                        {projectNameOf(sprint.projectId) !== null && (
                          <p className={`${TYPE.meta} ${STATUS.plan.text} font-medium mt-1`}>
                            {projectNameOf(sprint.projectId)}
                          </p>
                        )}

                        {sprint.overCapacity && (
                          <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium mt-1`}>
                            Planned beyond capacity by{' '}
                            {sprint.totalPoints - (sprint.capacityPoints ?? 0)}p
                          </p>
                        )}

                        {sprint.scopeAddedPoints > 0 && (
                          <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium mt-1`}>
                            Scope grew {sprint.scopeAddedPoints}p since the sprint started
                          </p>
                        )}

                        {sprint.status !== 'COMPLETED' && sprint.taskCount > 0 && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              // The sprint's tasks are not on this page, so they
                              // are fetched on demand rather than held in state
                              // that would go stale after every board change.
                              void (async () => {
                                setError('');

                                try {
                                  const board = await fetchBoard({ sprintId: sprint.id });
                                  const inSprint = board.columns.flatMap((column) => column.cards);

                                  if (inSprint.length === 0) {
                                    setError(`${sprint.name} has no tasks to return.`);
                                    return;
                                  }

                                  const raw = window.prompt(
                                    `Return work from ${sprint.name} to the backlog. Enter task ids separated by commas.\n\n` +
                                      inSprint
                                        .map((t) => `  ${t.id} — ${t.taskKey} ${t.title} (${t.storyPoints}p)`)
                                        .join('\n')
                                  );
                                  if (!raw) return;

                                  const ids = raw
                                    .split(',')
                                    .map((part) => Number(part.trim()))
                                    .filter((id) => inSprint.some((t) => t.id === id));

                                  if (ids.length === 0) {
                                    setError('No matching task ids in that sprint.');
                                    return;
                                  }

                                  await run(
                                    sprint.id,
                                    () => removeFromSprint(sprint.id, ids),
                                    `${ids.length} task${ids.length === 1 ? '' : 's'} returned to the backlog.`
                                  );
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : 'Could not read that sprint');
                                }
                              })();
                            }}
                            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} mt-2 ml-2`}
                          >
                            <FiX size={13} aria-hidden="true" /> Return work to backlog
                          </button>
                        )}

                        {sprint.status === 'ACTIVE' && backlog.length > 0 && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              const raw = window.prompt(
                                `Add backlog tasks to ${sprint.name}. Enter task ids separated by commas.\n\n` +
                                  backlog.map((t) => `  ${t.id} — ${t.taskKey} ${t.title} (${t.storyPoints}p)`).join('\n')
                              );
                              if (!raw) return;

                              const ids = raw
                                .split(',')
                                .map((part) => Number(part.trim()))
                                .filter((id) => backlog.some((t) => t.id === id));

                              if (ids.length === 0) {
                                setError('No matching backlog task ids.');
                                return;
                              }

                              void run(sprint.id, () => addToSprint(sprint.id, ids),
                                `${ids.length} task${ids.length === 1 ? '' : 's'} added to ${sprint.name}.`);
                            }}
                            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} mt-2`}
                          >
                            <FiPlus size={13} aria-hidden="true" /> Pull in backlog work
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 shrink-0">
                        {sprint.status === 'PLANNED' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void run(sprint.id, () => startSprint(sprint.id),
                                `${sprint.name} started — commitment frozen at ${sprint.totalPoints}p.`)
                            }
                            className={`${TYPE.meta} ${FIELD.button} bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/15 focus-visible:outline-emerald-500`}
                          >
                            <FiPlay size={13} aria-hidden="true" /> Start
                          </button>
                        )}

                        {sprint.status === 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleComplete(sprint)}
                            className={`${TYPE.meta} ${FIELD.button} bg-violet-500/10 text-violet-700 border border-violet-500/20 hover:bg-violet-500/15 focus-visible:outline-violet-500`}
                          >
                            <FiCheckCircle size={13} aria-hidden="true" /> Complete
                          </button>
                        )}

                        {sprint.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => beginEdit(sprint)}
                            aria-label={`Edit ${sprint.name}`}
                            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
                          >
                            <FiEdit2 size={13} aria-hidden="true" />
                          </button>
                        )}

                        {/* An active sprint cannot be deleted, so the action is not offered */}
                        {sprint.status !== 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (!window.confirm(
                                `Delete ${sprint.name}? Its tasks return to the backlog.`
                              )) return;

                              void run(sprint.id, () => deleteSprint(sprint.id), `${sprint.name} deleted.`);
                            }}
                            aria-label={`Delete ${sprint.name}`}
                            className={`${TYPE.meta} ${FIELD.button} ${FIELD.danger}`}
                          >
                            <FiTrash2 size={13} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {/* Backlog overview, so removing work does not need the board */}
      {backlog.length > 0 && (
        <section className={`${SURFACE.card} ${SURFACE.pad}`}>
          <h3 className={`${TYPE.title} text-slate-900 mb-3`}>
            Backlog · {backlog.length} task{backlog.length === 1 ? '' : 's'} ·{' '}
            {backlog.reduce((sum, t) => sum + t.storyPoints, 0)}p
          </h3>
          <ul className="divide-y divide-slate-100">
            {backlog.map((task) => (
              <li key={task.id} className="flex items-center gap-3 py-2">
                <span className={`${TYPE.code} text-slate-400 shrink-0`}>{task.taskKey}</span>
                <span
                  className={`${TYPE.meta} font-semibold px-1.5 py-0.5 rounded border shrink-0
                    ${PRIORITY_STYLE[task.priority].chip}`}
                >
                  {PRIORITY_STYLE[task.priority].mark}
                </span>
                <span className={`${TYPE.body} text-slate-800 truncate flex-1`}>{task.title}</span>
                <span className={`${TYPE.meta} text-slate-500 tabular-nums shrink-0`}>
                  {task.storyPoints}p
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
