import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiEdit2, FiMinus, FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import { TYPE, SURFACE, STATUS, FIELD } from './scrumUI';
import {
  createRetroItem,
  deleteRetroItem,
  fetchRetrospective,
  fetchSprints,
  updateRetroItem,
  type Member,
  type RetroItem,
  type RetroKind,
  type Retrospective,
  type Sprint,
  type SprintStatus
} from './scrumApi';

/** One STATUS entry. Panels and rows take a tone, never raw colour classes. */
type Tone = (typeof STATUS)[keyof typeof STATUS];

/** Borrowed from the client so the form payload cannot drift from the API. */
type NewItem = Parameters<typeof createRetroItem>[0];

/**
 * The three retro columns in one place: tone, heading, and what belongs in the
 * column when it is still empty. ACTION is last because it is the output of
 * the other two.
 */
const PANELS = [
  {
    kind: 'WENT_WELL' as RetroKind,
    heading: 'What went well',
    tone: STATUS.done,
    placeholder: 'A win, practice or habit worth keeping',
    empty: 'Nothing captured yet. Note the practices and wins the team should keep doing.'
  },
  {
    kind: 'TO_CHANGE' as RetroKind,
    heading: 'What to change',
    tone: STATUS.blocked,
    placeholder: 'Something that slowed the sprint down',
    empty: 'Nothing captured yet. Note what got in the team’s way this sprint.'
  },
  {
    kind: 'ACTION' as RetroKind,
    heading: 'Carried into the next sprint',
    tone: STATUS.plan,
    placeholder: 'A change the team commits to, in one line',
    empty: 'No actions yet. Turn a “what to change” into an owned commitment for the next sprint.'
  }
] as const;

type Panel = (typeof PANELS)[number];

const SPRINT_TONE: Record<SprintStatus, Tone> = {
  PLANNED: STATUS.idle,
  ACTIVE: STATUS.active,
  COMPLETED: STATUS.done
};

const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  COMPLETED: 'Completed'
};

/**
 * Backend dates are date-only (LocalDate). `new Date('2026-08-09')` is parsed
 * as UTC midnight, which renders as the previous day west of Greenwich, so the
 * parts are handed to the local-time constructor instead.
 */
const formatDate = (iso: string | null): string => {
  if (!iso) return '';

  const [year, month, day] = iso.split('-');
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/** "Sprint 13 · 10 Aug 2026", or whichever half of it was filled in. */
const dueText = (item: RetroItem): string =>
  [item.dueLabel, formatDate(item.dueDate)].filter(Boolean).join(' · ');

export const ScrumRetrospective: React.FC = () => {
  const [data, setData] = useState<Retrospective | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintId, setSprintId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** A failed row action, kept apart from `error` so one bad toggle cannot blank the page. */
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (id?: number) => {
    setError('');

    try {
      const [retro, sprintList] = await Promise.all([fetchRetrospective(id), fetchSprints()]);
      setData(retro);
      setSprints(sprintList);
      setSprintId(retro.sprintId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the retrospective');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Refetches rather than patching the item in place: the backend owns the
   * ordering, the owner strings and the completed counts, so a local guess
   * would drift from the next load. Only the acting row is disabled.
   */
  const runRowAction = async (
    item: RetroItem,
    action: () => Promise<unknown>
  ): Promise<boolean> => {
    setActionError('');
    setBusyId(item.id);

    try {
      await action();
      await load(data?.sprintId);
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'That change could not be saved');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const toggleItem = (item: RetroItem, completed: boolean) => {
    void runRowAction(item, () => updateRetroItem(item.id, { completed }));
  };

  const saveItemText = (item: RetroItem, text: string) =>
    runRowAction(item, () => updateRetroItem(item.id, { text }));

  const removeItem = (item: RetroItem) => {
    // A retro note is the only record of what the team said, and there is no
    // undo on the server, so the confirm is deliberate rather than defensive.
    if (!window.confirm(`Delete “${item.text}”? This cannot be undone.`)) return;

    void runRowAction(item, () => deleteRetroItem(item.id));
  };

  /** Throws on failure so the form that called it can show the reason in place. */
  const addItem = async (input: NewItem) => {
    setActionError('');
    await createRetroItem(input);
    await load(data?.sprintId);
  };

  if (loading) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} ${TYPE.body} text-slate-500`}>
        Loading the retrospective…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} border-rose-500/20`}>
        <p className={`${TYPE.body} text-rose-600`} role="alert">
          {error || 'No retrospective available'}
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

  const itemsByKind: Record<RetroKind, RetroItem[]> = {
    WENT_WELL: data.wentWell,
    TO_CHANGE: data.toChange,
    ACTION: data.actions
  };

  const sprintTone = SPRINT_TONE[data.sprintStatus] ?? STATUS.idle;
  const activeSprint = sprints.find((sprint) => sprint.status === 'ACTIVE') ?? null;

  /**
   * createRetroItem() sends no sprint id, so the backend files a new note
   * against the ACTIVE sprint (ScrumRetrospectiveService.resolveSprint). A form
   * on any other sprint would therefore file notes out of sight, so it is only
   * offered where the note actually lands. Reading, editing, ticking off and
   * deleting are all keyed by item id and work on a closed sprint as normal.
   * Drop this gate once the client can pass a sprint id on create.
   */
  const canAdd = activeSprint !== null && activeSprint.id === data.sprintId;

  const renderPanel = (panel: Panel) => {
    const items = itemsByKind[panel.kind];
    const isActions = panel.kind === 'ACTION';
    const doneCount = items.filter((item) => item.completed).length;

    const rows = items.map((item, index) => (
      <RetroRow
        key={item.id}
        item={item}
        // Actions are numbered because they carry over in priority order
        index={isActions ? index + 1 : null}
        tone={panel.tone}
        bullet={
          panel.kind === 'WENT_WELL' ? (
            <FiCheck size={11} strokeWidth={3} />
          ) : (
            <FiMinus size={11} strokeWidth={3} />
          )
        }
        busy={busyId === item.id}
        onToggle={isActions ? toggleItem : null}
        onSaveText={saveItemText}
        onDelete={removeItem}
      />
    ));

    return (
      <section key={panel.kind} className={`${SURFACE.card} overflow-hidden`}>
        <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <h3 className={`${TYPE.eyebrow} ${panel.tone.text}`}>{panel.heading}</h3>
          <span className={`${TYPE.meta} text-slate-400 tabular-nums shrink-0`}>
            {isActions && items.length > 0 ? `${doneCount} of ${items.length} done` : items.length}
          </span>
        </header>

        {items.length === 0 ? (
          <p className={`${TYPE.body} text-slate-500 ${SURFACE.pad} leading-snug`}>{panel.empty}</p>
        ) : isActions ? (
          <ol>{rows}</ol>
        ) : (
          <ul>{rows}</ul>
        )}

        {canAdd && (
          <footer className="px-4 sm:px-5 py-3 border-t border-slate-100">
            <AddForm
              kind={panel.kind}
              placeholder={panel.placeholder}
              members={data.members}
              onSubmit={addItem}
            />
          </footer>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header — SRS: sprint retrospective */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`${TYPE.title} text-slate-900`}>{data.sprintName} retrospective</h2>
          <p className={`${TYPE.meta} text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5`}>
            <span className={`${sprintTone.text} font-semibold`}>
              {SPRINT_STATUS_LABEL[data.sprintStatus] ?? 'Unknown status'}
            </span>
            {data.heldOn && (
              <>
                <span aria-hidden="true">·</span>
                <span>held {formatDate(data.heldOn)}</span>
              </>
            )}
            {data.actions.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {data.actions.filter((item) => item.completed).length} of {data.actions.length}{' '}
                  actions done
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="retro-sprint">
            Sprint
          </label>
          <select
            id="retro-sprint"
            value={sprintId}
            onChange={(event) => {
              const next = Number(event.target.value);
              setSprintId(next);
              void load(next);
            }}
            className={`${TYPE.meta} ${FIELD.select}`}
          >
            {/* A retro can be open on a sprint the list does not carry; without
                its own option the select would render blank */}
            {!sprints.some((sprint) => sprint.id === data.sprintId) && (
              <option value={data.sprintId}>{data.sprintName}</option>
            )}
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} · {sprint.status.toLowerCase()}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void load(data.sprintId)}
            aria-label="Reload this retrospective"
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
          >
            <FiRefreshCw size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {actionError && (
        <div
          className={`${SURFACE.card} ${SURFACE.padTight} border-rose-500/20 flex items-start justify-between gap-3`}
          role="alert"
        >
          <p className={`${TYPE.body} text-rose-600`}>{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError('')}
            aria-label="Dismiss this message"
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} shrink-0`}
          >
            <FiX size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      {!canAdd && (
        <div
          className={`${SURFACE.card} ${SURFACE.padTight} ${STATUS.plan.ring} flex flex-wrap items-center justify-between gap-3`}
        >
          <p className={`${TYPE.body} text-slate-600 leading-snug`}>
            {activeSprint
              ? 'New notes are filed against the sprint that is running, so nothing can be added here. Existing items can still be edited, ticked off and deleted.'
              : 'No sprint is running, so new notes cannot be filed. Existing items can still be edited, ticked off and deleted.'}
          </p>
          {activeSprint && (
            <button
              type="button"
              onClick={() => {
                setSprintId(activeSprint.id);
                void load(activeSprint.id);
              }}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} shrink-0`}
            >
              <FiPlus size={13} aria-hidden="true" /> Add to {activeSprint.name}
            </button>
          )}
        </div>
      )}

      {/* Observations side by side, actions beneath: the actions are what the
          two columns above resolve into */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PANELS.filter((panel) => panel.kind !== 'ACTION').map(renderPanel)}
      </div>

      {PANELS.filter((panel) => panel.kind === 'ACTION').map(renderPanel)}
    </div>
  );
};

const RetroRow: React.FC<{
  item: RetroItem;
  /** 1-based position for actions, null for the observation columns. */
  index: number | null;
  tone: Tone;
  bullet: React.ReactNode;
  busy: boolean;
  /** Only actions can be ticked off, so only they get a checkbox. */
  onToggle: ((item: RetroItem, completed: boolean) => void) | null;
  onSaveText: (item: RetroItem, text: string) => Promise<boolean>;
  onDelete: (item: RetroItem) => void;
}> = ({ item, index, tone, bullet, busy, onToggle, onSaveText, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  const startEdit = () => {
    setDraft(item.text);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(item.text);
    setEditing(false);
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();

    const next = draft.trim();

    // An unchanged text would spend a request to save what is already stored
    if (!next || next === item.text) {
      cancelEdit();
      return;
    }

    if (await onSaveText(item, next)) {
      setEditing(false);
    }
  };

  const due = dueText(item);

  return (
    <li className="flex items-start gap-3 px-4 sm:px-5 py-3 border-b border-slate-100 last:border-0">
      {onToggle ? (
        <>
          <input
            type="checkbox"
            id={`retro-done-${item.id}`}
            checked={item.completed}
            disabled={busy}
            onChange={(event) => onToggle(item, event.target.checked)}
            className="w-4 h-4 mt-1 shrink-0 cursor-pointer accent-violet-600 disabled:cursor-wait
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          />
          <label htmlFor={`retro-done-${item.id}`} className="sr-only">
            {item.completed ? 'Reopen' : 'Mark done'}: {item.text}
          </label>
        </>
      ) : (
        <span
          className={`w-5 h-5 rounded-full shrink-0 grid place-items-center mt-0.5
            ${tone.soft} ${tone.text}`}
          aria-hidden="true"
        >
          {bullet}
        </span>
      )}

      {/* Hidden from assistive tech: the ordered list already announces the position */}
      {index !== null && (
        <span
          className={`w-6 h-6 rounded-full shrink-0 grid place-items-center ${TYPE.meta}
            font-semibold tabular-nums ${tone.soft} ${tone.text}`}
          aria-hidden="true"
        >
          {index}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={submitEdit}
            onKeyDown={(event) => {
              if (event.key === 'Escape') cancelEdit();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <label htmlFor={`retro-text-${item.id}`} className="sr-only">
              Edit item text
            </label>
            <input
              id={`retro-text-${item.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={busy}
              required
              className={`${TYPE.body} ${FIELD.input} flex-1 min-w-40`}
            />
            <button
              type="submit"
              disabled={busy}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={busy}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <p
              className={`${TYPE.body} leading-snug
                ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}
            >
              {item.text}
            </p>

            {(item.ownerId !== null || due) && (
              <p className={`${TYPE.meta} text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1`}>
                {item.ownerId !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full grid place-items-center font-semibold
                        bg-slate-100 text-slate-600"
                      aria-hidden="true"
                    >
                      {item.ownerInitials || '?'}
                    </span>
                    {item.ownerName ?? 'Unnamed owner'}
                  </span>
                )}
                {due && (
                  <span className={item.completed ? '' : `${tone.text} font-medium`}>due {due}</span>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={startEdit}
            disabled={busy}
            aria-label={`Edit: ${item.text}`}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
          >
            <FiEdit2 size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={busy}
            aria-label={`Delete: ${item.text}`}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.danger}`}
          >
            <FiTrash2 size={13} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
};

/**
 * The add form owns its own draft and its own failure message: a validation
 * error belongs next to the field that caused it, not in the page banner.
 */
const AddForm: React.FC<{
  kind: RetroKind;
  placeholder: string;
  members: Member[];
  onSubmit: (input: NewItem) => Promise<void>;
}> = ({ kind, placeholder, members, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [ownerId, setOwnerId] = useState<number | ''>('');
  const [dueLabel, setDueLabel] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isAction = kind === 'ACTION';
  const field = (name: string) => `retro-new-${kind.toLowerCase()}-${name}`;

  const close = () => {
    setOpen(false);
    setText('');
    setOwnerId('');
    setDueLabel('');
    setDueDate('');
    setFormError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) return;

    setSaving(true);
    setFormError('');

    try {
      await onSubmit({
        kind,
        text: trimmed,
        // An owner or a due date on an observation is a 400 from the backend:
        // only an action has somebody to chase and a date to hit
        ...(isAction
          ? {
              ownerId: ownerId === '' ? null : ownerId,
              dueLabel: dueLabel.trim() || null,
              dueDate: dueDate || null
            }
          : {})
      });
      close();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'The item could not be added');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
      >
        <FiPlus size={13} aria-hidden="true" /> {isAction ? 'Add an action' : 'Add a note'}
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
      className="space-y-2.5"
    >
      <div>
        <label htmlFor={field('text')} className="sr-only">
          {isAction ? 'New action' : 'New note'}
        </label>
        <input
          id={field('text')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          disabled={saving}
          required
          autoFocus
          className={`${TYPE.body} ${FIELD.input}`}
        />
      </div>

      {isAction && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label htmlFor={field('owner')} className={`${TYPE.eyebrow} text-slate-400 block mb-1`}>
              Owner
            </label>
            <select
              id={field('owner')}
              value={ownerId}
              onChange={(event) =>
                setOwnerId(event.target.value === '' ? '' : Number(event.target.value))
              }
              disabled={saving}
              className={`${TYPE.body} ${FIELD.select} w-full`}
            >
              <option value="">Nobody yet</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name ?? member.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={field('label')} className={`${TYPE.eyebrow} text-slate-400 block mb-1`}>
              Due label
            </label>
            <input
              id={field('label')}
              value={dueLabel}
              onChange={(event) => setDueLabel(event.target.value)}
              placeholder="Sprint 13 start"
              maxLength={60}
              disabled={saving}
              className={`${TYPE.body} ${FIELD.input}`}
            />
          </div>

          <div>
            <label htmlFor={field('date')} className={`${TYPE.eyebrow} text-slate-400 block mb-1`}>
              Due date
            </label>
            <input
              id={field('date')}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={saving}
              className={`${TYPE.body} ${FIELD.input}`}
            />
          </div>
        </div>
      )}

      {formError && (
        <p className={`${TYPE.meta} text-rose-600`} role="alert">
          {formError}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={close}
          disabled={saving}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
