import React, { useCallback, useEffect, useState } from 'react';
import { FiDownload, FiLink2, FiPaperclip, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import { TYPE, STATUS, FIELD } from './scrumUI';
import { ScrumTaskComments } from './ScrumTaskComments';
import {
  addDependency,
  attachmentUrl,
  deleteAttachment,
  fetchAttachments,
  fetchDependencies,
  removeDependency,
  uploadAttachment,
  STATUS_LABEL,
  type Attachment,
  type Card,
  type Dependencies,
  type Member
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
}

export const ScrumTaskDetail: React.FC<Props> = ({ card, members, siblings }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [dependsOn, setDependsOn] = useState('');

  const load = useCallback(async () => {
    setError('');

    try {
      const [files, links] = await Promise.all([
        fetchAttachments(card.id),
        fetchDependencies(card.id)
      ]);
      setAttachments(files);
      setDependencies(links);
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

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-4">
      {error && (
        <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium`} role="alert">
          {error}
        </p>
      )}

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
