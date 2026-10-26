import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiClock,
  FiCopy,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiTrash2,
  FiX,
  FiCalendar,
  FiChevronDown,
  FiCheckSquare
} from 'react-icons/fi';
import { TYPE, SURFACE, STATUS, COLUMN_TONE, PRIORITY_STYLE, labelChip, FIELD } from './scrumUI';
import { ScrumTaskDetail } from './ScrumTaskDetail';
import {
  fetchBoard,
  fetchSprints,
  fetchProjects,
  isNoActiveSprint,
  moveTask,
  setWipLimit,
  createTask,
  updateTask,
  cloneTask,
  deleteTask,
  TASK_STATUSES,
  BOARD_COLUMNS,
  PRIORITIES,
  STATUS_LABEL,
  PRIORITY_LABEL,
  type Board,
  type BoardColumn,
  type BoardFilters,
  type Card,
  type Member,
  type Priority,
  type Project,
  type Sprint,
  type TaskInput,
  type TaskStatus
} from './scrumApi';

/**
 * Where the chosen project is remembered. Per-viewer convenience only: the
 * board is always correct without it, it just opens on "All projects".
 */
const PROJECT_KEY = 'scrum.board.projectId';
const COLUMN_NAMES_KEY = 'scrum.board.customColumnLabels';

/**
 * HTML5 drag and drop has no touch implementation, and a card that cannot be
 * picked up reads as a broken board. So dragging is offered only to a real
 * pointer on a wide screen, and the per-card move <select> stays visible
 * everywhere — it is the only path keyboard and touch users have.
 */
const POINTER_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 1024px)';

const useDragEnabled = (): boolean => {
  const [enabled, setEnabled] = useState(() => window.matchMedia(POINTER_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(POINTER_QUERY);
    const sync = () => setEnabled(query.matches);

    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return enabled;
};

/**
 * There is no separate `blocked` flag on a card: a card is blocked when it sits
 * in the BLOCKED column or still carries the reason it was blocked for.
 */
const needsAttention = (card: Card): boolean =>
  card.stuck || card.status === 'BLOCKED' || card.blockedReason !== null;

/** Numbers live in the draft as strings so a half-typed field is not NaN. */
interface TaskDraft {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  storyPoints: string;
  assigneeId: string;
  dueDate: string;
  labels: string;
  estimatedHours: string;
}

const emptyDraft = (): TaskDraft => ({
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  storyPoints: '3',
  assigneeId: '',
  dueDate: '',
  labels: '',
  estimatedHours: ''
});

const draftFromCard = (card: Card): TaskDraft => ({
  title: card.title,
  description: card.description ?? '',
  priority: card.priority,
  status: card.status,
  storyPoints: String(card.storyPoints),
  assigneeId: card.assigneeId === null ? '' : String(card.assigneeId),
  dueDate: card.dueDate ?? '',
  labels: card.labels.join(', '),
  estimatedHours: card.estimatedHours === null ? '' : String(card.estimatedHours)
});

/** The fields both create and edit share; assignee differs and is added by the caller. */
const draftToInput = (draft: TaskDraft): TaskInput => ({
  title: draft.title.trim(),
  description: draft.description.trim() || null,
  priority: draft.priority,
  storyPoints: Number(draft.storyPoints) || 0,
  estimatedHours: draft.estimatedHours.trim() === '' ? null : Number(draft.estimatedHours),
  dueDate: draft.dueDate || null,
  labels: draft.labels
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
});

/**
 * On edit an emptied field must be cleared explicitly: the API treats a null
 * as "leave unchanged", so without these flags blanking a due date would come
 * back still set after the refetch.
 */
const draftToEdit = (draft: TaskDraft): TaskInput => ({
  ...draftToInput(draft),
  clearDescription: draft.description.trim() === '',
  clearDueDate: draft.dueDate === '',
  clearEstimatedHours: draft.estimatedHours.trim() === '',
  clearLabels: draft.labels.trim() === ''
});


/**
 * Due dates are shown short — "Sep 15" rather than the raw ISO date, which is
 * three times the width for no extra meaning on a card this size. Parsed at
 * local midnight so it does not slip a day west of Greenwich.
 */
const formatDue = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};



export const ScrumBoard: React.FC = () => {
  const [board, setBoard] = useState<Board | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [wipBusy, setWipBusy] = useState<TaskStatus | null>(null);

  /**
   * Project scope.
   *
   * A scrum master works one project at a time, so the choice is remembered
   * across reloads: coming back and landing on someone else's project is a
   * quiet way to plan the wrong sprint. Read lazily rather than in an effect,
   * so the very first render is already scoped correctly.
   */
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | ''>(() => {
    try {
      const stored = window.localStorage.getItem(PROJECT_KEY);
      return stored === null || stored === '' ? '' : Number(stored) || '';
    } catch {
      // Private windows and blocked site data both throw on access
      return '';
    }
  });

  // Filters
  const [sprintId, setSprintId] = useState<number | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [label, setLabel] = useState('');
  const [unassigned, setUnassigned] = useState(false);

  // Forms & Modals
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [settingsColumn, setSettingsColumn] = useState<BoardColumn | null>(null);
  const [saving, setSaving] = useState(false);

  /** Custom status display names set by Scrum Master */
  const [customLabels, setCustomLabels] = useState<Record<string, string>>(() => {
    try {
      const stored = window.localStorage.getItem(COLUMN_NAMES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Drag and drop
  const dragEnabled = useDragEnabled();
  const [dragCardId, setDragCardId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);

  // Typing must not fire a request per keystroke; the board query is not cheap.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo<BoardFilters>(
    () => ({
      projectId: projectId === '' ? undefined : projectId,
      sprintId: sprintId === '' ? undefined : sprintId,
      assigneeId: unassigned ? undefined : (assigneeId === '' ? undefined : assigneeId),
      priority: priority === '' ? undefined : priority,
      label: label || undefined,
      search: search || undefined,
      unassigned: unassigned ? true : undefined
    }),
    [projectId, sprintId, assigneeId, priority, label, search, unassigned]
  );

  const load = useCallback(async () => {
    setError('');
    setRefreshing(true);

    try {
      setBoard(await fetchBoard(filters));
    } catch (err) {
      setBoard(null);
      setError(err instanceof Error ? err.message : 'Could not load the board');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  // The sprint list follows the project but not the other filters, so it is
  // refetched when the project changes rather than on every keystroke. A
  // failure here still leaves a usable board.
  useEffect(() => {
    void (async () => {
      try {
        setSprints(await fetchSprints(projectId === '' ? undefined : projectId));
      } catch {
        setSprints([]);
      }
    })();
  }, [projectId]);

  // The project list belongs to the PM module and is read-only here, so a
  // project renamed there is renamed here. Losing it must not take the board
  // down with it — the board is still usable unscoped.
  useEffect(() => {
    void (async () => {
      try {
        setProjects(await fetchProjects());
      } catch {
        setProjects([]);
      }
    })();
  }, []);

  /**
   * Switching project clears the chosen sprint.
   *
   * Keeping it would send project A's sprint alongside project B's id, which
   * the backend rejects outright. Falling back to "this project's current
   * sprint" is better than an error the user did not cause.
   */
  const handleProjectChange = (next: number | '') => {
    setProjectId(next);
    setSprintId('');

    try {
      if (next === '') {
        window.localStorage.removeItem(PROJECT_KEY);
      } else {
        window.localStorage.setItem(PROJECT_KEY, String(next));
      }
    } catch {
      // Remembering the choice is a convenience, never a requirement
    }
  };

  /**
   * Six active sprint columns, in BOARD_COLUMNS order (Backlog has its own dedicated page).
   *
   * Review has no column of its own — see BOARD_COLUMNS — so its cards are
   * carried into Testing rather than dropped: a missing column reads as lost
   * work. Such a card still shows "Review" in its own move dropdown, so its
   * real status stays visible even though it sits under Testing.
   */
  const columns = useMemo<BoardColumn[]>(() => {
    const byStatus = new Map(board?.columns.map((column) => [column.status, column]) ?? []);

    return BOARD_COLUMNS.map((status) => {
      const baseColumn = byStatus.get(status);
      const customName = customLabels[status];
      const label = customName || baseColumn?.label || STATUS_LABEL[status];

      const column = baseColumn
        ? { ...baseColumn, label }
        : {
            status,
            label,
            taskCount: 0,
            totalPoints: 0,
            wipLimit: null,
            wipExceeded: false,
            cards: []
          };

      if (status !== 'TESTING') return column;

      const review = byStatus.get('CODE_REVIEW');

      if (!review || review.cards.length === 0) return column;

      const taskCount = column.taskCount + review.taskCount;

      return {
        ...column,
        taskCount,
        totalPoints: column.totalPoints + review.totalPoints,
        // The limit belongs to Testing, so re-test it against the merged count
        wipExceeded: column.wipLimit !== null && taskCount > column.wipLimit,
        cards: [...review.cards, ...column.cards]
      };
    });
  }, [board, customLabels]);

  /** Every card on the board, for the dependency picker in the detail panel. */
  const allCards = useMemo(
    () => columns.flatMap((column) => column.cards),
    [columns]
  );

  const cardById = useMemo(() => {
    const map = new Map<number, Card>();
    columns.forEach((column) => column.cards.forEach((card) => map.set(card.id, card)));
    return map;
  }, [columns]);

  const filterActive =
    searchInput.trim() !== '' ||
    assigneeId !== '' ||
    priority !== '' ||
    label !== '' ||
    unassigned;

  const clearFilters = () => {
    setSearchInput('');
    setAssigneeId('');
    setPriority('');
    setLabel('');
    setUnassigned(false);
  };

  const runOnCard = async (id: number, action: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    setError('');
    setNotice('');

    try {
      await action();
      setNotice(message);
      // The backend derives counts, ageing and WIP state, so a local patch would drift.
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (card: Card, status: TaskStatus) => {
    if (status === card.status) {
      return;
    }

    let blockedReason: string | undefined;

    if (status === 'BLOCKED') {
      // The backend rejects a blocked move with no reason, so asking first
      // avoids spending a request on a guaranteed 400.
      const answer = window.prompt(`Why is ${card.taskKey} blocked?`, card.blockedReason ?? '');

      if (answer === null) {
        return;
      }

      if (!answer.trim()) {
        setError('A card can only be blocked with a reason.');
        return;
      }

      blockedReason = answer.trim();
    }

    await runOnCard(
      card.id,
      () => moveTask(card.id, status, blockedReason),
      `${card.taskKey} moved to ${STATUS_LABEL[status]}`
    );
  };

  const handleClone = (card: Card) =>
    runOnCard(card.id, () => cloneTask(card.id), `${card.taskKey} cloned`);

  const handleDelete = async (card: Card) => {
    if (!window.confirm(`Delete ${card.taskKey} — ${card.title}? This cannot be undone.`)) {
      return;
    }

    await runOnCard(card.id, () => deleteTask(card.id), `${card.taskKey} deleted`);
  };

  const handleSaveColumnSettings = async (columnStatus: TaskStatus, newLabel: string, limit: number | null) => {
    const updated = { ...customLabels };
    if (newLabel && newLabel !== STATUS_LABEL[columnStatus]) {
      updated[columnStatus] = newLabel;
    } else {
      delete updated[columnStatus];
    }
    setCustomLabels(updated);
    try {
      window.localStorage.setItem(COLUMN_NAMES_KEY, JSON.stringify(updated));
    } catch {
      // storage quota or private windows
    }

    setWipBusy(columnStatus);
    setError('');
    setNotice('');

    try {
      await setWipLimit(columnStatus, limit, {
        projectId: projectId === '' ? undefined : projectId,
        sprintId: activeSprintId ?? undefined
      });
      const displayLabel = updated[columnStatus] || STATUS_LABEL[columnStatus];
      setNotice(
        limit === null
          ? `Column settings updated for ${displayLabel}`
          : `${displayLabel} limited to ${limit} cards`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save column settings');
    } finally {
      setWipBusy(null);
    }
  };

  const handleResetColumnLabel = (columnStatus: TaskStatus) => {
    const updated = { ...customLabels };
    delete updated[columnStatus];
    setCustomLabels(updated);
    try {
      window.localStorage.setItem(COLUMN_NAMES_KEY, JSON.stringify(updated));
    } catch {
      // storage quota
    }
  };

  const activeSprintId = sprintId === '' ? board?.sprintId : sprintId;

  // Resolved from the board's own cards, so the dialog closes by itself if a
  // refresh removes the card underneath it rather than editing a stale copy
  const editingCard = editingId === null ? null : cardById.get(editingId) ?? null;
  const detailCard = detailId === null ? null : cardById.get(detailId) ?? null;

  const handleCreate = async (draft: TaskDraft) => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const created = await createTask({
        ...draftToInput(draft),
        status: draft.status,
        assigneeId: draft.assigneeId === '' ? null : Number(draft.assigneeId),
        // Without the sprint the card lands in the backlog and the board looks unchanged.
        sprintId: activeSprintId ?? null
      });

      setCreating(false);
      setNotice(`${created.taskKey} created`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the task');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (card: Card, draft: TaskDraft) => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await updateTask(card.id, {
        ...draftToEdit(draft),
        // draftToInput leaves status out, so the dialog's status field has to
        // be sent here or changing it would report success and change nothing
        status: draft.status,
        assigneeId: draft.assigneeId === '' ? null : Number(draft.assigneeId),
        // PATCH treats a null assignee as "unchanged", so clearing needs the flag.
        unassign: draft.assigneeId === ''
      });

      setEditingId(null);
      setNotice(`${card.taskKey} saved`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the task');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (status: TaskStatus) => {
    setDropTarget(null);

    if (dragCardId === null) {
      return;
    }

    const card = cardById.get(dragCardId);
    setDragCardId(null);

    if (card) {
      void handleMove(card, status);
    }
  };

  if (loading) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} ${TYPE.body} text-slate-500`}>
        Loading the board…
      </div>
    );
  }

  // No running sprint is the expected state for a new team/project, not a failure
  if (error && isNoActiveSprint(error)) {
    return (
      <div className="space-y-4">
        {/* Header with project picker so the user can easily switch to another project */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className={`${TYPE.title} text-slate-900`}>Scrum Board</h2>
            <p className={`${TYPE.meta} text-slate-500`}>
              {projectId !== ''
                ? (projects.find((p) => p.id === projectId)?.name ?? `Project ${projectId}`)
                : 'All projects'}
              {refreshing && <span className="text-slate-400"> · updating…</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="board-project">Project</label>
            <select
              id="board-project"
              value={projectId}
              onChange={(event) =>
                handleProjectChange(
                  event.target.value === '' ? '' : Number(event.target.value)
                )}
              className={`${TYPE.meta} ${FIELD.select} max-w-[14rem] truncate`}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name ?? project.code ?? `Project ${project.id}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void load()}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
            >
              <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : undefined} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>

        <div className={`${SURFACE.card} ${SURFACE.pad} max-w-2xl`}>
          <div className="flex items-center gap-2">
            <FiCalendar size={16} className="text-slate-400 shrink-0" aria-hidden="true" />
            <h2 className={`${TYPE.title} text-slate-900`}>No sprint is running</h2>
          </div>
          <p className={`${TYPE.body} text-slate-600 mt-3 leading-relaxed`}>
            {projectId !== ''
              ? 'This project has no sprint yet. Open Sprint Cycles to create and start a sprint for this project, or select a different project above.'
              : 'Open Sprint Cycles, create a sprint, pull in the work the team is committing to, then press Start. The board fills in from that moment.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => void load()}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
            >
              <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : undefined} aria-hidden="true" /> Check again
            </button>
            {projectId !== '' && (
              <button
                type="button"
                onClick={() => handleProjectChange('')}
                className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
              >
                View all projects
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className={`${TYPE.title} text-slate-900`}>Scrum Board</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="board-project-err">Project</label>
            <select
              id="board-project-err"
              value={projectId}
              onChange={(event) =>
                handleProjectChange(
                  event.target.value === '' ? '' : Number(event.target.value)
                )}
              className={`${TYPE.meta} ${FIELD.select} max-w-[14rem] truncate`}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name ?? project.code ?? `Project ${project.id}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void load()}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
            >
              <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : undefined} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>

        <div className={`${SURFACE.card} ${SURFACE.pad} border-rose-500/20`}>
          <p className={`${TYPE.body} text-rose-600`} role="alert">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} mt-3`}
          >
            <FiRefreshCw size={13} className={refreshing ? 'animate-spin' : undefined} aria-hidden="true" /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} ${TYPE.body} text-slate-500`}>
        No board available yet. Create a sprint to get started.
      </div>
    );
  }

  const selectedSprint = activeSprintId ?? board.sprintId;
  const sprintListed = sprints.some((sprint) => sprint.id === board.sprintId);

  return (
    <div className="space-y-4">
      {/* Sprint header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`${TYPE.title} text-slate-900`}>{board.sprintName} board</h2>
          <p className={`${TYPE.meta} text-slate-500`}>
            {/* Naming the project makes the scope visible, so nobody plans
                the right sprint under the wrong project by accident */}
            {board.projectName !== null && (
              <span className="text-slate-600 font-medium">{board.projectName} · </span>
            )}
            {board.totalTasks} cards · {board.totalPoints} points ·{' '}
            {board.sprintStatus && (
              <>
                {' · '}
                <span className="capitalize">{board.sprintStatus.toLowerCase()}</span>
              </>
            )}
            {refreshing && <span className="text-slate-400"> · updating…</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project comes first: it is the scope everything else sits inside */}
          <label className="sr-only" htmlFor="board-project">Project</label>
          <select
            id="board-project"
            value={projectId}
            onChange={(event) =>
              handleProjectChange(
                event.target.value === '' ? '' : Number(event.target.value)
              )}
            className={`${TYPE.meta} ${FIELD.select} max-w-[14rem] truncate`}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name ?? project.code ?? `Project ${project.id}`}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="board-sprint">Sprint</label>
          <select
            id="board-sprint"
            value={selectedSprint}
            onChange={(event) => setSprintId(Number(event.target.value))}
            className={`${TYPE.meta} ${FIELD.select}`}
          >
            {/* The board can be showing a sprint the list has not returned */}
            {!sprintListed && (
              <option value={board.sprintId}>{board.sprintName}</option>
            )}
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}{sprint.status ? ` · ${sprint.status.toLowerCase()}` : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void load()}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
          >
            <FiRefreshCw size={13} aria-hidden="true" /> Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setCreating((open) => !open);
              setEditingId(null);
            }}
            aria-expanded={creating}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
          >
            <FiPlus size={13} aria-hidden="true" /> New task
          </button>
        </div>
      </div>

      {/* Filters — SRS Module 5 */}
      <div className={`${SURFACE.card} ${SURFACE.padTight}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <label className="sr-only" htmlFor="board-search">Search cards</label>
            <FiSearch
              size={14}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="board-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Title, key or description"
              className={`${TYPE.body} ${FIELD.input} pl-9`}
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="board-assignee">Assignee</label>
            <select
              id="board-assignee"
              value={unassigned ? '' : assigneeId}
              disabled={unassigned}
              onChange={(event) => {
                const val = event.target.value === '' ? '' : Number(event.target.value);
                setAssigneeId(val);
                if (val !== '') {
                  setUnassigned(false);
                }
              }}
              className={`${TYPE.body} ${FIELD.select} w-full py-2 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <option value="">{unassigned ? 'Unassigned only selected' : 'Any assignee'}</option>
              {board.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name ?? member.email} • {member.department || 'General'} ({member.role || 'Member'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sr-only" htmlFor="board-priority">Priority</label>
            <select
              id="board-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority | '')}
              className={`${TYPE.body} ${FIELD.select} w-full py-2`}
            >
              <option value="">Any priority</option>
              {PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {PRIORITY_LABEL[option]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sr-only" htmlFor="board-label">Label</label>
            <select
              id="board-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className={`${TYPE.body} ${FIELD.select} w-full py-2`}
            >
              <option value="">Any label</option>
              {board.availableLabels.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2.5">
          <label className={`${TYPE.meta} inline-flex items-center gap-2 text-slate-600 cursor-pointer`}>
            <input
              type="checkbox"
              checked={unassigned}
              onChange={(event) => {
                const checked = event.target.checked;
                setUnassigned(checked);
                if (checked) {
                  setAssigneeId('');
                }
              }}
              className="w-4 h-4 rounded border-slate-300 accent-emerald-600
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            />
            Unassigned only
          </label>

          {filterActive && (
            <button
              type="button"
              onClick={clearFilters}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} py-1.5`}
            >
              <FiX size={13} aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {error && board && (
        <p
          role="alert"
          className={`${SURFACE.card} ${SURFACE.padTight} ${TYPE.body} text-rose-600 border-rose-500/20`}
        >
          {error}
        </p>
      )}

      <p aria-live="polite" className={`${TYPE.meta} ${STATUS.done.text} font-medium ${notice ? '' : 'sr-only'}`}>
        {notice}
      </p>

      {creating && (
        <section className={`${SURFACE.card} ${SURFACE.pad}`}>
          <h3 className={`${TYPE.title} text-slate-900 mb-3`}>New task</h3>
          <TaskForm
            idPrefix="create"
            initial={emptyDraft()}
            members={board.members}
            showStatus
            saving={saving}
            submitLabel="Create task"
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </section>
      )}

      {/* 5-Column Grid: full width layout without horizontal scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full items-start">
        {columns.map((column) => {
          const tone = STATUS[COLUMN_TONE[column.status]];
          const dropping = dropTarget === column.status;

          return (
            <section
              key={column.status}
              aria-labelledby={`column-${column.status}`}
              className="w-full min-w-0 flex flex-col rounded-2xl bg-slate-50/80 border border-slate-200/80 p-2.5 shadow-xs transition-all"
            >
              <div
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-colors shadow-2xs
                  ${column.wipExceeded
                    ? `${STATUS.blocked.soft} ${STATUS.blocked.ring}`
                    : `${tone.soft} ${tone.ring}`}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${tone.rail}`} aria-hidden="true" />
                <h3
                  id={`column-${column.status}`}
                  className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap
                    ${column.wipExceeded ? STATUS.blocked.text : 'text-slate-700'}`}
                >
                  {column.label}
                </h3>
                <span
                  className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ml-auto shrink-0 border
                    ${column.wipExceeded ? `${STATUS.blocked.text} bg-rose-50 border-rose-200` : 'text-slate-600 bg-white/90 border-slate-200/70'}`}
                >
                  {column.wipLimit === null
                    ? column.taskCount
                    : `${column.taskCount} / ${column.wipLimit}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsColumn(column)}
                  disabled={wipBusy === column.status}
                  aria-label={`Configure status name and WIP limit for ${column.label}`}
                  title="Status name & WIP limit settings"
                  className="shrink-0 p-1 rounded-md cursor-pointer text-slate-400 hover:text-slate-700 hover:bg-black/5
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-emerald-500 disabled:cursor-wait transition-colors"
                >
                  <FiSliders size={12} aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center justify-between px-1.5 mt-1.5 mb-1 text-[11px] text-slate-400 tabular-nums">
                <span>{column.totalPoints} points</span>
                {column.wipExceeded && (
                  <span className={`${STATUS.blocked.text} font-semibold`}> · over WIP limit</span>
                )}
              </div>

              <div
                onDragOver={(event) => {
                  if (!dragEnabled || dragCardId === null) return;
                  event.preventDefault();
                  setDropTarget(column.status);
                }}
                onDragLeave={() => setDropTarget((current) => (current === column.status ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(column.status);
                }}
                className={`mt-1 flex-1 flex flex-col space-y-2 rounded-xl min-h-[360px] p-1 transition-colors
                  ${dropping ? 'bg-emerald-500/10 ring-2 ring-emerald-500/40' : ''}`}
              >
                {column.cards.length === 0 ? (
                  filterActive ? (
                    <div className="flex-1 flex items-center justify-center p-4 rounded-xl border border-dashed border-slate-200/60 text-center min-h-[140px]">
                      <p className="text-xs font-medium text-slate-400">No matching cards</p>
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-dashed border-slate-200/50 min-h-[140px]" />
                  )
                ) : (
                  <ul className="space-y-2">
                    {column.cards.map((card) => (
                      <BoardCard
                        key={card.id}
                        card={card}
                        members={board.members}
                        siblings={allCards}
                        busy={busyId === card.id}
                        editing={editingId === card.id}
                        dragEnabled={dragEnabled}
                        dragging={dragCardId === card.id}
                        onDragStart={(event) => {
                          // text/plain keeps Firefox happy; the id in state is what we read back
                          event.dataTransfer.setData('text/plain', String(card.id));
                          event.dataTransfer.effectAllowed = 'move';
                          setDragCardId(card.id);
                        }}
                        onDragEnd={() => {
                          setDragCardId(null);
                          setDropTarget(null);
                        }}
                        onMove={handleMove}
                        onClone={handleClone}
                        onDelete={handleDelete}
                        onEditOpen={() => {
                          setEditingId(card.id);
                          setCreating(false);
                        }}
                        onDetailOpen={() => setDetailId(card.id)}
                        onRefresh={() => void load()}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Editing lives in a modal */}
      {editingCard !== null && (
        <TaskEditDialog
          card={editingCard}
          members={board.members}
          saving={saving}
          onCancel={() => setEditingId(null)}
          onSubmit={(draft) => handleEdit(editingCard, draft)}
        />
      )}

      {/* Details (Sub-tasks, dependencies, attachments, discussion) lives in a spacious modal */}
      {detailCard !== null && (
        <TaskDetailDialog
          card={detailCard}
          members={board.members}
          siblings={allCards}
          onClose={() => setDetailId(null)}
          onRefresh={() => void load()}
        />
      )}

      {/* Column settings modal (Rename status display name & WIP limit) */}
      {settingsColumn !== null && (
        <ColumnSettingsDialog
          column={settingsColumn}
          currentLabel={customLabels[settingsColumn.status] || STATUS_LABEL[settingsColumn.status]}
          wipBusy={wipBusy === settingsColumn.status}
          onCancel={() => setSettingsColumn(null)}
          onResetLabel={() => handleResetColumnLabel(settingsColumn.status)}
          onSave={(newLabel, limit) => handleSaveColumnSettings(settingsColumn.status, newLabel, limit)}
        />
      )}
    </div>
  );
};

/**
 * Editing a card happens in a modal rather than inside the card.
 *
 * A board column is around 200px wide, and the inline form this replaced had
 * to fit eight fields into that, pushing the rest of the column out of view
 * while it was open. The native <dialog> is deliberate: showModal() brings
 * Escape-to-close, a focus trap and an inert background, none of which a
 * hand-rolled overlay gets for free.
 */
const TaskEditDialog: React.FC<{
  card: Card;
  members: Member[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (draft: TaskDraft) => Promise<void>;
}> = ({ card, members, saving, onCancel, onSubmit }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `edit-dialog-${card.id}-title`;

  useEffect(() => {
    const dialog = ref.current;

    if (dialog !== null && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape fires 'cancel'; routing it through the board's own close keeps
      // editingId and the dialog's open state from drifting apart
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      // Only a click on the backdrop itself closes: the panel is a child, so
      // clicks inside the form never reach this handler as the target
      onClick={(event) => {
        if (event.target === ref.current) {
          onCancel();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200
        bg-white p-0 shadow-lg backdrop:bg-slate-900/40"
    >
      <div className={SURFACE.pad}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 id={titleId} className={`${TYPE.title} text-slate-900`}>
              Edit task
            </h3>
            <p className={`${TYPE.meta} text-slate-500 truncate`}>
              <span className={`${TYPE.code} text-slate-400`}>{card.taskKey}</span>
              {' · '}
              {card.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close without saving"
            className="shrink-0 p-1 rounded cursor-pointer text-slate-400 hover:text-slate-600
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-emerald-500"
          >
            <FiX size={16} aria-hidden="true" />
          </button>
        </div>

        <TaskForm
          idPrefix={`edit-${card.id}`}
          initial={draftFromCard(card)}
          members={members}
          showStatus
          saving={saving}
          submitLabel="Save"
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      </div>
    </dialog>
  );
};

/**
 * Task details (sub-tasks, dependencies, attachments, discussion) open in a spacious
 * modal dialog so cards on the board stay compact, readable, and uniform.
 */
const TaskDetailDialog: React.FC<{
  card: Card;
  members: Member[];
  siblings: Card[];
  onClose: () => void;
  onRefresh: () => void;
}> = ({ card, members, siblings, onClose, onRefresh }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `detail-dialog-${card.id}-title`;

  useEffect(() => {
    const dialog = ref.current;

    if (dialog !== null && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) {
          onClose();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[88vh] rounded-2xl border border-slate-200
        bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 overflow-hidden flex flex-col"
    >
      <div className={`${SURFACE.padTight} border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/80`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${TYPE.code} text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-200/70`}>
              {card.taskKey}
            </span>
            <span className={`${TYPE.meta} font-semibold px-2 py-0.5 rounded-full ${STATUS.done.soft} ${STATUS.done.text}`}>
              {STATUS_LABEL[card.status]}
            </span>
          </div>
          <h3 id={titleId} className={`${TYPE.title} text-slate-900 text-lg leading-snug`}>
            {card.title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close task details"
          className="shrink-0 p-1.5 rounded-lg cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <FiX size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(88vh-4.5rem)]">
        <ScrumTaskDetail
          card={card}
          members={members}
          siblings={siblings}
          onSubtaskChange={onRefresh}
        />
      </div>
    </dialog>
  );
};

const BoardCard: React.FC<{
  card: Card;
  members: Member[];
  /** The rest of the board, offered as dependency targets in the detail panel. */
  siblings: Card[];
  busy: boolean;
  /** Dimmed and undraggable while the edit dialog holds this card. */
  editing: boolean;
  dragEnabled: boolean;
  dragging: boolean;
  onDragStart: (event: React.DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
  onMove: (card: Card, status: TaskStatus) => Promise<void>;
  onClone: (card: Card) => Promise<void>;
  onDelete: (card: Card) => Promise<void>;
  onEditOpen: () => void;
  onDetailOpen: () => void;
  onRefresh?: () => void;
}> = ({
  card,
  members: _members,
  siblings: _siblings,
  busy,
  editing,
  dragEnabled,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
  onClone,
  onDelete,
  onEditOpen,
  onDetailOpen,
  onRefresh: _onRefresh,
}) => {
  const attention = needsAttention(card);
  const priorityStyle = PRIORITY_STYLE[card.priority];

  return (
    <li
      draggable={dragEnabled && !editing && !busy}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative overflow-hidden ${SURFACE.card} p-3
        transition-shadow hover:shadow-sm
        ${attention ? 'border-rose-500/25' : ''}
        ${dragging ? 'opacity-50' : ''}
        ${busy ? 'opacity-60' : ''}
        ${dragEnabled && !editing && !busy ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {attention && (
        <span className={`absolute inset-y-0 left-0 w-[3px] ${STATUS.blocked.rail}`} aria-hidden="true" />
      )}


          {/* Header: what it is and how big. Actions stay out of the resting state. */}
          <div className="flex items-baseline gap-1.5">
            <span
              title={`Priority: ${PRIORITY_LABEL[card.priority]}`}
              className={`${TYPE.meta} font-bold leading-none shrink-0 ${priorityStyle.text}`}
            >
              <span aria-hidden="true">{priorityStyle.mark}</span>
              <span className="sr-only">Priority {PRIORITY_LABEL[card.priority]}</span>
            </span>

            <span className={`${TYPE.code} text-slate-400 whitespace-nowrap`}>{card.taskKey}</span>

            {/*
              Due date and points share the header's spare room, and both step
              aside for the hover actions. Three items in the footer squeezed the
              column name, and the column name has to stay fully readable.
            */}
            <span
              className="ml-auto flex items-baseline gap-2 shrink-0 transition-opacity
                group-hover:opacity-0 group-focus-within:opacity-0"
            >
              {card.subtaskCount !== undefined && card.subtaskCount > 0 && (
                <button
                  type="button"
                  onClick={onDetailOpen}
                  className={`${TYPE.meta} inline-flex items-center gap-0.5 font-semibold rounded px-1 py-0.5 cursor-pointer ${
                    card.completedSubtaskCount === card.subtaskCount
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                  title={`${card.completedSubtaskCount ?? 0} of ${card.subtaskCount} sub-tasks completed — click to view`}
                >
                  <FiCheckSquare size={10} aria-hidden="true" />
                  {card.completedSubtaskCount ?? 0}/{card.subtaskCount}
                </button>
              )}

              {card.dueDate && (
                <span
                  className={`${TYPE.meta} whitespace-nowrap
                    ${card.overdue ? `${STATUS.blocked.text} font-medium` : 'text-slate-400'}`}
                >
                  {card.overdue && (
                    <FiAlertTriangle size={11} aria-hidden="true" className="inline mr-0.5 -mt-px" />
                  )}
                  {formatDue(card.dueDate)}
                  <span className="sr-only">{card.overdue ? ' — overdue' : ' — due date'}</span>
                </span>
              )}

              <span className={`${TYPE.meta} text-slate-500 tabular-nums`}>
                {card.storyPoints}
                <span className="sr-only"> story points</span>
                <span aria-hidden="true">p</span>
              </span>
            </span>
          </div>

          <p
            onClick={onDetailOpen}
            className={`${TYPE.body} font-medium text-slate-900 leading-snug mt-1 break-words cursor-pointer hover:text-emerald-700 transition-colors`}
          >
            {card.title}
          </p>

          {card.labels.length > 0 && (
            <ul className="flex flex-wrap gap-1 mt-2">
              {card.labels.map((chip) => (
                <li key={chip} className={`${TYPE.meta} ${labelChip(chip)} leading-none py-1`}>
                  {chip}
                </li>
              ))}
            </ul>
          )}

          {card.blockedReason && (
            <p className={`${TYPE.meta} ${STATUS.blocked.text} flex items-start gap-1 mt-2`}>
              <FiAlertTriangle size={11} aria-hidden="true" className="mt-px shrink-0" />
              <span className="break-words">{card.blockedReason}</span>
            </p>
          )}

          {/* Footer: who, how long, when due, and where it can go next */}
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                title={card.assigneeName ? `${card.assigneeName} • ${card.assigneeDepartment || 'General'} (${card.assigneeRole || 'Member'})${card.assigneeEmail ? ` — ${card.assigneeEmail}` : ''}` : 'Unassigned'}
                className={`w-6 h-6 rounded-full shrink-0 grid place-items-center ${TYPE.code}
                  font-semibold ${card.assigneeId === null
                    ? 'bg-slate-50 text-slate-300 border border-dashed border-slate-300'
                    : 'bg-slate-100 text-slate-600'}`}
              >
                <span aria-hidden="true">{card.assigneeId === null ? '?' : card.assigneeInitials}</span>
                <span className="sr-only">{card.assigneeName ?? 'Unassigned'}</span>
              </span>
              {card.assigneeName && (
                <div className="flex flex-col min-w-0 max-w-[105px] leading-tight" title={`${card.assigneeName} (${card.assigneeDepartment || ''})`}>
                  <span className="truncate text-[10px] font-bold text-slate-700">{card.assigneeName}</span>
                  {card.assigneeDepartment && (
                    <span className="truncate text-[8px] font-semibold text-teal-600">{card.assigneeDepartment}</span>
                  )}
                </div>
              )}
            </div>

            {/* Ageing is only worth showing once a card has actually sat somewhere */}
            {(card.daysInColumn > 0 || card.stuck) && (
              <span
                className={`${TYPE.meta} inline-flex items-center gap-1 tabular-nums shrink-0
                  whitespace-nowrap
                  ${card.stuck ? `${STATUS.blocked.text} font-medium` : 'text-slate-400'}`}
              >
                <FiClock size={11} aria-hidden="true" />
                {card.daysInColumn}d
                <span className="sr-only"> in this column</span>
              </span>
            )}

            {/*
              Always visible and never disabled: this is the conforming
              alternative to dragging, so keyboard and touch users must be able
              to reach it at any time. Styled quietly so it does not shout.
            */}
            <label className="sr-only" htmlFor={`move-${card.id}`}>
              Move {card.taskKey} to another column
            </label>
            <select
              id={`move-${card.id}`}
              value={card.status}
              onChange={(event) => void onMove(card, event.target.value as TaskStatus)}
              className={`${TYPE.meta} ml-auto shrink-0 cursor-pointer
                rounded-md border border-transparent bg-transparent py-1 pl-1 pr-0.5
                text-slate-500 hover:border-slate-200 hover:bg-slate-50
                focus-visible:outline-2 focus-visible:outline-offset-1
                focus-visible:outline-emerald-500`}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </div>

          {/*
            Revealed on hover, and on keyboard focus so the icons are reachable
            without a pointer. They overlay the points badge rather than taking
            a permanent row, which is what made every card so tall.
          */}
          <span
            className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-white/95
              pl-1 opacity-0 transition-opacity group-hover:opacity-100
              group-focus-within:opacity-100"
          >
            <IconButton
              label={`Show sub-tasks, dependencies, files and comments for ${card.taskKey}`}
              disabled={busy}
              onClick={onDetailOpen}
              icon={<FiChevronDown size={13} aria-hidden="true" />}
            />
            <IconButton
              label={`Edit ${card.taskKey}`}
              disabled={busy}
              onClick={onEditOpen}
              icon={<FiEdit2 size={13} aria-hidden="true" />}
            />
            <IconButton
              label={`Clone ${card.taskKey}`}
              disabled={busy}
              onClick={() => void onClone(card)}
              icon={<FiCopy size={13} aria-hidden="true" />}
            />
            <IconButton
              label={`Delete ${card.taskKey}`}
              disabled={busy}
              danger
              onClick={() => void onDelete(card)}
              icon={<FiTrash2 size={13} aria-hidden="true" />}
            />
          </span>

    </li>
  );
};

const IconButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}> = ({ label, icon, onClick, disabled, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`p-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-40
      disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2
      ${danger
        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 focus-visible:outline-rose-500'
        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-emerald-500'}`}
  >
    {icon}
  </button>
);

const TaskForm: React.FC<{
  idPrefix: string;
  initial: TaskDraft;
  members: Member[];
  saving: boolean;
  submitLabel: string;
  showStatus?: boolean;
  onCancel: () => void;
  onSubmit: (draft: TaskDraft) => Promise<void>;
}> = ({ idPrefix, initial, members, saving, submitLabel, showStatus, onCancel, onSubmit }) => {
  const [draft, setDraft] = useState<TaskDraft>(initial);
  const [invalid, setInvalid] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!draft.title.trim()) {
      setInvalid('A title is required.');
      return;
    }

    setInvalid('');
    void onSubmit(draft);
  };

  const labelClass = `${TYPE.eyebrow} text-slate-400 block mb-1`;

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-title`}>Title</label>
        <input
          id={`${idPrefix}-title`}
          value={draft.title}
          onChange={(event) => set('title', event.target.value)}
          aria-invalid={invalid !== ''}
          aria-describedby={invalid ? `${idPrefix}-title-error` : undefined}
          placeholder="What needs doing?"
          className={`${TYPE.body} ${FIELD.input}`}
        />
        {invalid && (
          <p id={`${idPrefix}-title-error`} role="alert" className={`${TYPE.meta} text-rose-600 mt-1`}>
            {invalid}
          </p>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          value={draft.description}
          onChange={(event) => set('description', event.target.value)}
          rows={2}
          placeholder="Context, acceptance criteria"
          className={`${TYPE.body} ${FIELD.input} resize-y`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-priority`}>Priority</label>
          <select
            id={`${idPrefix}-priority`}
            value={draft.priority}
            onChange={(event) => set('priority', event.target.value as Priority)}
            className={`${TYPE.body} ${FIELD.select} w-full py-2`}
          >
            {PRIORITIES.map((option) => (
              <option key={option} value={option}>{PRIORITY_LABEL[option]}</option>
            ))}
          </select>
        </div>

        {showStatus && (
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-status`}>Column</label>
            <select
              id={`${idPrefix}-status`}
              value={draft.status}
              onChange={(event) => set('status', event.target.value as TaskStatus)}
              className={`${TYPE.body} ${FIELD.select} w-full py-2`}
            >
              {/* A brand new card cannot be blocked — blocking needs a reason, which
                  only the move flow collects */}
              {TASK_STATUSES.filter((status) => status !== 'BLOCKED').map((status) => (
                <option key={status} value={status}>{STATUS_LABEL[status]}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-points`}>Story points</label>
          <input
            id={`${idPrefix}-points`}
            type="number"
            min={0}
            step={1}
            value={draft.storyPoints}
            onChange={(event) => set('storyPoints', event.target.value)}
            className={`${TYPE.body} ${FIELD.input}`}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-hours`}>Estimated hours</label>
          <input
            id={`${idPrefix}-hours`}
            type="number"
            min={0}
            step={0.5}
            value={draft.estimatedHours}
            onChange={(event) => set('estimatedHours', event.target.value)}
            placeholder="Optional"
            className={`${TYPE.body} ${FIELD.input}`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass} htmlFor={`${idPrefix}-assignee`}>Assignee</label>
            <input
              type="text"
              placeholder="Search employee..."
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              className="text-[11px] px-2 py-0.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-32"
            />
          </div>
          <select
            id={`${idPrefix}-assignee`}
            value={draft.assigneeId}
            onChange={(event) => set('assigneeId', event.target.value)}
            className={`${TYPE.body} ${FIELD.select} w-full py-2`}
          >
            <option value="">Unassigned</option>
            {members
              .filter((member) => {
                if (!assigneeSearch.trim()) return true;
                const q = assigneeSearch.toLowerCase();
                return (
                  (member.name && member.name.toLowerCase().includes(q)) ||
                  (member.email && member.email.toLowerCase().includes(q)) ||
                  (member.department && member.department.toLowerCase().includes(q)) ||
                  (member.role && member.role.toLowerCase().includes(q))
                );
              })
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name ?? member.email} • {member.department || 'General'} ({member.role || 'Member'}) — {member.email}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-due`}>Due date (Optional)</label>
          <input
            id={`${idPrefix}-due`}
            type="date"
            value={draft.dueDate}
            onChange={(event) => set('dueDate', event.target.value)}
            className={`${TYPE.body} ${FIELD.input}`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-labels`}>Labels</label>
        <input
          id={`${idPrefix}-labels`}
          value={draft.labels}
          onChange={(event) => set('labels', event.target.value)}
          placeholder="api, urgent"
          aria-describedby={`${idPrefix}-labels-hint`}
          className={`${TYPE.body} ${FIELD.input}`}
        />
        <p id={`${idPrefix}-labels-hint`} className={`${TYPE.meta} text-slate-400 mt-1`}>
          Separate labels with commas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <button
          type="submit"
          disabled={saving}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/**
 * Allows the Scrum Master to customize the display status name for a column
 * (e.g. rename "In progress" to "Development") and set its WIP limit.
 */
const ColumnSettingsDialog: React.FC<{
  column: BoardColumn;
  currentLabel: string;
  wipBusy: boolean;
  onCancel: () => void;
  onSave: (newLabel: string, wipLimit: number | null) => Promise<void>;
  onResetLabel: () => void;
}> = ({ column, currentLabel, wipBusy, onCancel, onSave, onResetLabel }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState(currentLabel);
  const [limitStr, setLimitStr] = useState(column.wipLimit === null ? '' : String(column.wipLimit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedLimit = limitStr.trim();
    const limit = trimmedLimit === '' ? null : Number(trimmedLimit);

    if (limit !== null && (!Number.isInteger(limit) || limit < 0)) {
      setError('WIP limit must be a non-negative whole number or blank.');
      return;
    }

    setSaving(true);
    try {
      await onSave(label.trim(), limit);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save column settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      <div className={SURFACE.pad}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className={`${TYPE.title} text-slate-900`}>Column & Status Settings</h3>
            <p className={`${TYPE.meta} text-slate-500`}>
              Customize status name and WIP limit for <span className="font-semibold text-slate-700">{STATUS_LABEL[column.status]}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close settings"
            className="p-1 rounded cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <FiX size={16} />
          </button>
        </div>

        {error && (
          <p className={`${TYPE.meta} ${STATUS.blocked.text} mb-3 font-medium`} role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`${TYPE.eyebrow} text-slate-600 block mb-1`} htmlFor="col-custom-label">
              Status / Column Display Name
            </label>
            <input
              id="col-custom-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={STATUS_LABEL[column.status]}
              className={`${TYPE.body} ${FIELD.input}`}
            />
            <p className={`${TYPE.meta} text-slate-400 mt-1`}>
              Original default: <span className="font-medium text-slate-500">{STATUS_LABEL[column.status]}</span>
            </p>
          </div>

          <div>
            <label className={`${TYPE.eyebrow} text-slate-600 block mb-1`} htmlFor="col-wip-limit">
              WIP Limit (Max Cards)
            </label>
            <input
              id="col-wip-limit"
              type="number"
              min="0"
              step="1"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              placeholder="Leave blank for no limit"
              className={`${TYPE.body} ${FIELD.input}`}
            />
            <p className={`${TYPE.meta} text-slate-400 mt-1`}>
              Highlights column in red if total cards in column exceed this limit.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onResetLabel();
                setLabel(STATUS_LABEL[column.status]);
              }}
              className={`${TYPE.meta} text-slate-500 hover:text-slate-800 underline cursor-pointer`}
            >
              Reset name to default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || wipBusy}
                className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
              >
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
};
