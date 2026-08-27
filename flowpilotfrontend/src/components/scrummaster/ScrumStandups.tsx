import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiCalendar,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiUserPlus
} from 'react-icons/fi';
import { TYPE, SURFACE, STATUS, FIELD } from './scrumUI';
import {
  deleteStandup,
  fetchStandups,
  saveStandup,
  type Member,
  type StandupEntry,
  type Standups
} from './scrumApi';

/** Today in the browser's own timezone, as the yyyy-mm-dd the API expects. */
const todayIso = (): string => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
};

/** Date-only strings are parsed by parts: `new Date('2026-08-25')` is UTC
 *  midnight, which renders as the previous day west of Greenwich. */
const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

interface Draft {
  memberId: string;
  yesterday: string;
  today: string;
  blocker: string;
}

const emptyDraft: Draft = { memberId: '', yesterday: '', today: '', blocker: '' };


/**
 * The API client throws the backend's message rather than a status code, so the
 * "no active sprint" 404 is recognised by its text. It is the normal state for
 * a new team, not a fault, so it must not render as an error.
 */
const isNoActiveSprint = (message: string): boolean =>
  message.toLowerCase().includes('no active sprint');

export const ScrumStandups: React.FC = () => {
  const [data, setData] = useState<Standups | null>(null);
  const [date, setDate] = useState(todayIso());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  /** Row failures are kept apart from load failures, which gate the page. */
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async (forDate: string) => {
    setError('');

    try {
      setData(await fetchStandups({ date: forDate }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the standup');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(date);
  }, [load, date]);

  // Derived inside memos: `data?.entries ?? []` builds a new array on every
  // render, which would make any memo depending on it recompute every time.
  const entries: StandupEntry[] = useMemo(() => data?.entries ?? [], [data]);
  const members: Member[] = useMemo(() => data?.members ?? [], [data]);

  /** Who has an entry for this date, so the form can switch to editing. */
  const entryByMember = useMemo(() => {
    const map = new Map<number, StandupEntry>();
    entries.forEach((entry) => map.set(entry.memberId, entry));
    return map;
  }, [entries]);

  /** The absence is the useful signal at standup time. */
  const missing = useMemo(
    () => members.filter((member) => !entryByMember.has(member.id)),
    [members, entryByMember]
  );

  /** Choosing someone who already spoke loads their entry rather than blanking it. */
  const chooseMember = (raw: string) => {
    const existing = raw ? entryByMember.get(Number(raw)) : undefined;

    setFormError('');
    setDraft({
      memberId: raw,
      yesterday: existing?.yesterday ?? '',
      today: existing?.today ?? '',
      blocker: existing?.blocker ?? ''
    });
  };

  // The backend rejects an entry with all three fields blank, so the button is
  // disabled in that state rather than letting the user discover it as an error.
  const draftEmpty =
    draft.yesterday.trim() === '' &&
    draft.today.trim() === '' &&
    draft.blocker.trim() === '';

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!draft.memberId) {
      setFormError('Choose who is speaking');
      return;
    }

    setSaving(true);
    setFormError('');
    setNotice('');

    try {
      await saveStandup({
        memberId: Number(draft.memberId),
        standupDate: date,
        yesterday: draft.yesterday.trim() || null,
        today: draft.today.trim() || null,
        blocker: draft.blocker.trim() || null
      });

      setDraft(emptyDraft);
      setNotice('Standup entry saved.');
      // attending and blockedCount are derived server-side, so refetch
      await load(date);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: StandupEntry) => {
    if (!window.confirm(`Remove ${entry.memberName ?? 'this member'}'s entry for ${date}?`)) {
      return;
    }

    setBusyId(entry.id);
    setActionError('');
    setNotice('');

    try {
      await deleteStandup(entry.id);
      setNotice('Entry removed.');
      await load(date);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove the entry');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className={`${SURFACE.card} ${SURFACE.pad} ${TYPE.body} text-slate-500`}>
        Loading the standup…
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
          Standup notes are recorded against a sprint. Start one under <span className="font-medium text-slate-900">Sprint Cycles</span> and the day&rsquo;s entries can be captured here.
        </p>
        <button
          type="button"
          onClick={() => void load(date)}
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
          {error || 'No standup available'}
        </p>
        <p className={`${TYPE.meta} text-slate-500 mt-1`}>
          A sprint must be active before standups can be recorded.
        </p>
        <button
          type="button"
          onClick={() => void load(date)}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} mt-3`}
        >
          <FiRefreshCw size={13} aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: which sprint, which day, who is stuck */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`${TYPE.title} text-slate-900`}>Daily standup</h2>
          <p className={`${TYPE.meta} text-slate-500`}>
            {data.sprintName} · {formatDate(data.date)} · {data.attending} attending
            {data.blockedCount > 0 && (
              <span className={`${STATUS.blocked.text} font-semibold`}>
                {' '}· {data.blockedCount} blocked
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="standup-date">
              Date
            </label>
            <input
              id="standup-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`${TYPE.body} ${FIELD.input}`}
            />
          </div>

          {date !== todayIso() && (
            <button
              type="button"
              onClick={() => setDate(todayIso())}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
            >
              <FiCalendar size={13} aria-hidden="true" /> Today
            </button>
          )}
        </div>
      </div>

      {/* Days that actually have entries — quicker than guessing at the picker */}
      {data.recordedDates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${TYPE.eyebrow} text-slate-400`}>Recorded</span>
          {data.recordedDates.map((recorded) => (
            <button
              key={recorded}
              type="button"
              onClick={() => setDate(recorded)}
              aria-pressed={recorded === date}
              className={`${TYPE.meta} px-2.5 py-1 rounded-lg cursor-pointer border transition-colors
                ${recorded === date
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {formatDate(recorded)}
            </button>
          ))}
        </div>
      )}

      <p className={`${TYPE.meta} ${STATUS.done.text} font-medium`} aria-live="polite">
        {notice}
      </p>

      {actionError && (
        <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium`} role="alert">
          {actionError}
        </p>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className={`${SURFACE.card} ${SURFACE.pad}`}>
          <p className={`${TYPE.body} text-slate-600`}>
            No entries for {formatDate(data.date)} yet. Add the first one below.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <article
                className={`${SURFACE.card} ${SURFACE.pad} relative overflow-hidden
                  ${entry.blocked ? 'border-rose-500/25' : ''}
                  ${busyId === entry.id ? 'opacity-50' : ''}`}
              >
                {entry.blocked && (
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-rose-500" aria-hidden="true" />
                )}

                <header className="flex items-center gap-3 mb-4">
                  <span
                    className={`w-9 h-9 rounded-full shrink-0 grid place-items-center ${TYPE.meta}
                      font-semibold bg-slate-100 text-slate-600`}
                    aria-hidden="true"
                  >
                    {entry.memberInitials}
                  </span>

                  <div className="min-w-0">
                    <h3 className={`${TYPE.body} font-semibold text-slate-900 truncate`}>
                      {entry.memberName ?? 'Unknown member'}
                    </h3>
                    {entry.memberRole && (
                      <p className={`${TYPE.meta} text-slate-400`}>{entry.memberRole}</p>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    {entry.blocked && (
                      <span
                        className={`${TYPE.meta} font-semibold inline-flex items-center gap-1
                          px-2 py-1 rounded-md ${STATUS.blocked.soft} ${STATUS.blocked.text}`}
                      >
                        <FiAlertTriangle size={11} aria-hidden="true" /> Blocked
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => chooseMember(String(entry.memberId))}
                      className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={busyId === entry.id}
                      onClick={() => void handleDelete(entry)}
                      aria-label={`Remove ${entry.memberName ?? 'member'}'s entry`}
                      className={`${TYPE.meta} ${FIELD.button} ${FIELD.danger}`}
                    >
                      <FiTrash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </header>

                <dl className={`grid gap-3 sm:grid-cols-2 ${entry.blocked ? 'lg:grid-cols-3' : ''}`}>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <dt className={`${TYPE.eyebrow} text-slate-400 mb-1`}>Yesterday</dt>
                    <dd className={`${TYPE.body} text-slate-700 leading-snug`}>
                      {entry.yesterday || <span className="text-slate-400">Not said</span>}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <dt className={`${TYPE.eyebrow} text-slate-400 mb-1`}>Today</dt>
                    <dd className={`${TYPE.body} text-slate-700 leading-snug`}>
                      {entry.today || <span className="text-slate-400">Not said</span>}
                    </dd>
                  </div>

                  {entry.blocked && (
                    <div className={`rounded-xl px-3 py-2.5 ${STATUS.blocked.soft}`}>
                      <dt className={`${TYPE.eyebrow} ${STATUS.blocked.text} mb-1`}>Blocker</dt>
                      <dd className={`${TYPE.body} ${STATUS.blocked.text} leading-snug`}>
                        {entry.blocker}
                      </dd>
                    </div>
                  )}
                </dl>
              </article>
            </li>
          ))}
        </ul>
      )}

      {/* Who has not spoken yet — the gap is the point of this list */}
      {missing.length > 0 && (
        <div className={`${SURFACE.card} ${SURFACE.padTight}`}>
          <span className={`${TYPE.eyebrow} text-slate-400`}>
            Not yet recorded · {missing.length}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {missing.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => chooseMember(String(member.id))}
                title={member.name ?? member.email}
                className={`${TYPE.meta} inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
                  cursor-pointer bg-slate-50 border border-slate-200 text-slate-600
                  hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-emerald-500`}
              >
                <span className="font-semibold">{member.initials}</span>
                <span className="hidden sm:inline">{member.name ?? member.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Record or edit an entry */}
      <form onSubmit={handleSave} className={`${SURFACE.card} ${SURFACE.pad} space-y-3`}>
        <div className="flex items-center gap-2">
          <FiUserPlus size={14} className="text-slate-400" aria-hidden="true" />
          <h3 className={`${TYPE.title} text-slate-900`}>
            {draft.memberId && entryByMember.has(Number(draft.memberId))
              ? 'Update entry'
              : 'Add an entry'}
          </h3>
        </div>

        <div>
          <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="standup-member">
            Who is speaking
          </label>
          <select
            id="standup-member"
            value={draft.memberId}
            onChange={(event) => chooseMember(event.target.value)}
            className={`${TYPE.body} ${FIELD.input} cursor-pointer`}
          >
            <option value="">Choose a member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name ?? member.email}
                {entryByMember.has(member.id) ? ' — already recorded' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="standup-yesterday">
              Yesterday
            </label>
            <textarea
              id="standup-yesterday"
              rows={2}
              value={draft.yesterday}
              onChange={(event) => setDraft({ ...draft, yesterday: event.target.value })}
              placeholder="What they finished"
              className={`${TYPE.body} ${FIELD.input}`}
            />
          </div>

          <div>
            <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="standup-today">
              Today
            </label>
            <textarea
              id="standup-today"
              rows={2}
              value={draft.today}
              onChange={(event) => setDraft({ ...draft, today: event.target.value })}
              placeholder="What they are picking up"
              className={`${TYPE.body} ${FIELD.input}`}
            />
          </div>
        </div>

        <div>
          <label className={`${TYPE.eyebrow} text-slate-400 block mb-1.5`} htmlFor="standup-blocker">
            Blocker <span className="text-slate-300">— leave empty if none</span>
          </label>
          <textarea
            id="standup-blocker"
            rows={2}
            value={draft.blocker}
            onChange={(event) => setDraft({ ...draft, blocker: event.target.value })}
            placeholder="What is stopping them"
            className={`${TYPE.body} ${FIELD.input}`}
          />
        </div>

        {formError && (
          <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium`} role="alert">
            {formError}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || draftEmpty || !draft.memberId}
            className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
          >
            <FiSave size={13} aria-hidden="true" />
            {saving ? 'Saving…' : 'Save entry'}
          </button>

          {(draft.memberId || !draftEmpty) && (
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft);
                setFormError('');
              }}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
            >
              Clear
            </button>
          )}

          {draftEmpty && draft.memberId && (
            <span className={`${TYPE.meta} text-slate-400`}>
              Fill in at least one field
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
