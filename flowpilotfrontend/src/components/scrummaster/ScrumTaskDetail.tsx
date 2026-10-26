import React, { useCallback, useEffect, useState } from 'react';
import { FiCheckSquare, FiDownload, FiLink2, FiPaperclip, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import { TYPE, STATUS, FIELD } from './scrumUI';
import { ScrumTaskComments } from './ScrumTaskComments';
import {
  addDependency,
  attachmentUrl,
  createSubtask,
  deleteAttachment,
  deleteSubtask,
  fetchAttachments,
  fetchDependencies,
  fetchSubtasks,
  removeDependency,
  toggleSubtask,
  uploadAttachment,
  STATUS_LABEL,
  type Attachment,
  type Card,
  type Dependencies,
  type Member,
  type Subtask
} from './scrumApi';

/** Bytes as something a person can read: 1.4 MB rather than 1468006. */
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Everything about one task that will not fit on a board card: dependencies,
 * attachments and discussion (SRS Module 4). Mounted only while a card is
 * expanded, so a board of forty cards does not fire a hundred extra requests.
 */
interface Props {
  card: Card;
  members: Member[];
  /** Other cards on the board, offered as dependency targets. */
  siblings: Card[];
  /** Optional callback to notify parent board when subtasks change so card counts refresh */
  onSubtaskChange?: () => void;
}

export const ScrumTaskDetail: React.FC<Props> = ({ card, members, siblings, onSubtaskChange }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssigneeId, setNewSubtaskAssigneeId] = useState('');
  const [subtaskAssigneeSearch, setSubtaskAssigneeSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [dependsOn, setDependsOn] = useState('');

  const load = useCallback(async () => {
    setError('');

    try {
      const [files, links, subs] = await Promise.all([
        fetchAttachments(card.id),
        fetchDependencies(card.id),
        fetchSubtasks(card.id)
      ]);
      setAttachments(files);
      setDependencies(links);
      setSubtasks(subs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load task detail');
    }
  }, [card.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');

    try {
      await action();
      await load();
      if (onSubtaskChange) {
        onSubtaskChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Cleared so choosing the same file twice still fires a change event
    event.target.value = '';
    void run(() => uploadAttachment(card.id, file));
  };

  /** A task cannot link to itself, and an existing link is not offered twice. */
  const linkable = siblings.filter(
    (other) =>
      other.id !== card.id &&
      !(dependencies?.blockedBy ?? []).some((link) => link.taskId === other.id)
  );

  const completedSubtasksCount = subtasks.filter((st) => st.completed).length;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-4">
      {error && (
        <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium`} role="alert">
          {error}
        </p>
      )}

      {/* Sub-tasks */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <FiCheckSquare size={12} className="text-slate-400" aria-hidden="true" />
            <h5 className={`${TYPE.eyebrow} text-slate-400`}>
              Sub-tasks
              {subtasks.length > 0 && (
                <span className="normal-case text-slate-500 font-normal">
                  {' '}· {completedSubtasksCount} of {subtasks.length} done
                </span>
              )}
            </h5>
          </div>
          {subtasks.length > 0 && (
            <span className={`${TYPE.meta} font-semibold text-slate-500`}>
              {Math.round((completedSubtasksCount / subtasks.length) * 100)}%
            </span>
          )}
        </div>

        {subtasks.length > 0 && (
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasksCount / subtasks.length) * 100}%` }}
            />
          </div>
        )}

        {subtasks.length === 0 ? (
          <p className={`${TYPE.meta} text-slate-400 mb-2`}>No sub-tasks added yet.</p>
        ) : (
          <ul className="space-y-1.5 mb-2.5">
            {subtasks.map((st) => (
              <li
                key={st.id}
                className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 border border-slate-100/60 group transition-colors"
              >
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => void run(() => toggleSubtask(st.id))}
                  disabled={busy}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer accent-emerald-600 shrink-0"
                />
                <span
                  className={`${TYPE.meta} flex-1 text-slate-800 ${
                    st.completed ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {st.title}
                </span>

                {st.assigneeName && (
                  <span
                    className={`${TYPE.code} px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0`}
                    title={`Assigned to ${st.assigneeName}`}
                  >
                    {st.assigneeInitials}
                  </span>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => deleteSubtask(st.id))}
                  aria-label={`Delete subtask ${st.title}`}
                  className="text-slate-300 hover:text-rose-600 cursor-pointer shrink-0 transition-colors
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                >
                  <FiTrash2 size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add subtask form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newSubtaskTitle.trim()) return;
            const title = newSubtaskTitle.trim();
            const assigneeId = newSubtaskAssigneeId ? Number(newSubtaskAssigneeId) : null;
            setNewSubtaskTitle('');
            setNewSubtaskAssigneeId('');
            void run(() => createSubtask(card.id, title, assigneeId));
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5"
        >
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Add a sub-task…"
            className={`${TYPE.meta} ${FIELD.input} flex-1 py-1.5`}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              placeholder="Search..."
              value={subtaskAssigneeSearch}
              onChange={(e) => setSubtaskAssigneeSearch(e.target.value)}
              className={`${TYPE.meta} text-[11px] px-1.5 py-1 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-20`}
            />
            <select
              value={newSubtaskAssigneeId}
              onChange={(e) => setNewSubtaskAssigneeId(e.target.value)}
              className={`${TYPE.meta} ${FIELD.select} py-1.5 min-w-[7.5rem]`}
            >
              <option value="">Unassigned</option>
              {members
                .filter((m) => {
                  if (!subtaskAssigneeSearch.trim()) return true;
                  const q = subtaskAssigneeSearch.toLowerCase();
                  return (
                    (m.name && m.name.toLowerCase().includes(q)) ||
                    (m.email && m.email.toLowerCase().includes(q))
                  );
                })
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={busy || !newSubtaskTitle.trim()}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary} py-1.5 px-3 shrink-0`}
            >
              <FiPlus size={12} aria-hidden="true" /> Add
            </button>
          </div>
        </form>
      </section>

      {/* Dependencies */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <FiLink2 size={12} className="text-slate-400" aria-hidden="true" />
          <h5 className={`${TYPE.eyebrow} text-slate-400`}>
            Dependencies
            {dependencies && dependencies.unresolvedCount > 0 && (
              <span className={STATUS.blocked.text}>
                {' '}· waiting on {dependencies.unresolvedCount}
              </span>
            )}
          </h5>
        </div>

        {dependencies
          && dependencies.blockedBy.length === 0
          && dependencies.blocking.length === 0 ? (
          <p className={`${TYPE.meta} text-slate-400 mb-2`}>Not linked to any other task.</p>
        ) : (
          <ul className="space-y-1.5 mb-2">
            {dependencies?.blockedBy.map((link) => {
              const tone = link.done ? STATUS.done : STATUS.blocked;

              return (
                <li key={`b-${link.id}`} className="flex items-center gap-2">
                  <span
                    className={`${TYPE.meta} font-semibold px-1.5 py-0.5 rounded border shrink-0
                      ${tone.soft} ${tone.text} ${tone.ring}`}
                  >
                    Waits on
                  </span>
                  <span className={`${TYPE.code} text-slate-400 shrink-0`}>{link.taskKey}</span>
                  <span className={`${TYPE.meta} text-slate-700 truncate flex-1`}>{link.title}</span>
                  <span className={`${TYPE.meta} text-slate-400 shrink-0`}>
                    {STATUS_LABEL[link.status]}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => removeDependency(link.id))}
                    aria-label={`Remove dependency on ${link.taskKey}`}
                    className="text-slate-300 hover:text-rose-600 cursor-pointer shrink-0
                      focus-visible:outline-2 focus-visible:outline-offset-2
                      focus-visible:outline-rose-500"
                  >
                    <FiTrash2 size={11} />
                  </button>
                </li>
              );
            })}

            {/* The reverse direction is read-only here: the link belongs to the other card */}
            {dependencies?.blocking.map((link) => (
              <li key={`f-${link.id}`} className="flex items-center gap-2">
                <span
                  className={`${TYPE.meta} font-semibold px-1.5 py-0.5 rounded border shrink-0
                    ${STATUS.plan.soft} ${STATUS.plan.text} ${STATUS.plan.ring}`}
                >
                  Blocks
                </span>
                <span className={`${TYPE.code} text-slate-400 shrink-0`}>{link.taskKey}</span>
                <span className={`${TYPE.meta} text-slate-700 truncate flex-1`}>{link.title}</span>
                <span className={`${TYPE.meta} text-slate-400 shrink-0`}>
                  {STATUS_LABEL[link.status]}
                </span>
              </li>
            ))}
          </ul>
        )}

        {linkable.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${TYPE.meta} text-slate-500 shrink-0`}>Waits on</span>

            <label className="sr-only" htmlFor={`dep-task-${card.id}`}>Task to link</label>
            <select
              id={`dep-task-${card.id}`}
              value={dependsOn}
              onChange={(event) => setDependsOn(event.target.value)}
              className={`${TYPE.meta} ${FIELD.select} flex-1 min-w-[10rem]`}
            >
              <option value="">Choose a task…</option>
              {linkable.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.taskKey} — {other.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={busy || dependsOn === ''}
              onClick={() => {
                const target = Number(dependsOn);
                setDependsOn('');
                void run(() => addDependency(card.id, target));
              }}
              className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary}`}
            >
              <FiPlus size={12} aria-hidden="true" /> Link
            </button>
          </div>
        )}
      </section>

      {/* Attachments */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <FiPaperclip size={12} className="text-slate-400" aria-hidden="true" />
          <h5 className={`${TYPE.eyebrow} text-slate-400`}>
            Attachments{attachments.length > 0 && ` · ${attachments.length}`}
          </h5>
        </div>

        {attachments.length === 0 ? (
          <p className={`${TYPE.meta} text-slate-400 mb-2`}>Nothing attached.</p>
        ) : (
          <ul className="space-y-1.5 mb-2">
            {attachments.map((file) => (
              <li key={file.id} className="flex items-center gap-2">
                <span className={`${TYPE.meta} text-slate-700 truncate flex-1`}>
                  {file.fileName}
                </span>
                <span className={`${TYPE.meta} text-slate-400 shrink-0 tabular-nums`}>
                  {formatBytes(file.sizeBytes)}
                </span>
                {file.uploadedByName && (
                  <span
                    className={`${TYPE.meta} text-slate-400 shrink-0`}
                    title={file.uploadedByName}
                  >
                    {file.uploadedByInitials}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => window.open(attachmentUrl(file), '_blank', 'noopener')}
                  aria-label={`Download ${file.fileName}`}
                  className="text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-emerald-500"
                >
                  <FiDownload size={12} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Delete ${file.fileName}? This cannot be undone.`)) {
                      void run(() => deleteAttachment(file.id));
                    }
                  }}
                  aria-label={`Delete ${file.fileName}`}
                  className="text-slate-300 hover:text-rose-600 cursor-pointer shrink-0
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-rose-500"
                >
                  <FiTrash2 size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* A styled label drives the input, which stays screen-reader reachable */}
        <label
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.secondary} inline-flex`}
          htmlFor={`attach-${card.id}`}
        >
          <FiUpload size={12} aria-hidden="true" /> Attach a file
        </label>
        <input
          id={`attach-${card.id}`}
          type="file"
          onChange={handleUpload}
          disabled={busy}
          className="sr-only"
        />
      </section>

      <ScrumTaskComments taskId={card.id} taskKey={card.taskKey} members={members} />
    </div>
  );
};
