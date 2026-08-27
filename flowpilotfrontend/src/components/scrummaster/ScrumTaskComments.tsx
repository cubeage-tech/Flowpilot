import React, { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiMessageSquare, FiSend, FiTrash2 } from 'react-icons/fi';
import { TYPE, SURFACE, STATUS, FIELD } from './scrumUI';
import {
  addComment,
  deleteComment,
  editComment,
  fetchComments,
  type Member,
  type TaskComment
} from './scrumApi';

/**
 * Task discussion (SRS Module 4). Mounted inside a card once it is expanded,
 * so the thread is fetched only for the task actually being read rather than
 * for every card on the board.
 */
interface Props {
  taskId: number;
  taskKey: string;
  members: Member[];
  /** Who is writing. Until sessions carry a user id, the caller supplies it. */
  authorId?: number | null;
}

const formatWhen = (iso: string): string => {
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) return iso;

  return parsed.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ScrumTaskComments: React.FC<Props> = ({ taskId, taskKey, members, authorId }) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [body, setBody] = useState('');
  const [author, setAuthor] = useState<string>(authorId ? String(authorId) : '');
  const [sending, setSending] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');

  const load = useCallback(async () => {
    setError('');

    try {
      setComments(await fetchComments(taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (body.trim() === '') return;

    setSending(true);
    setError('');

    try {
      await addComment(taskId, body.trim(), author ? Number(author) : null);
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post the comment');
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (comment: TaskComment) => {
    if (editBody.trim() === '') return;

    setBusyId(comment.id);
    setError('');

    try {
      await editComment(comment.id, editBody.trim());
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the edit');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (comment: TaskComment) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;

    setBusyId(comment.id);
    setError('');

    try {
      await deleteComment(comment.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the comment');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-1.5 mb-2">
        <FiMessageSquare size={12} className="text-slate-400" aria-hidden="true" />
        <h5 className={`${TYPE.eyebrow} text-slate-400`}>
          Discussion{comments.length > 0 && ` · ${comments.length}`}
        </h5>
      </div>

      {error && (
        <p className={`${TYPE.meta} ${STATUS.blocked.text} font-medium mb-2`} role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className={`${TYPE.meta} text-slate-400`}>Loading…</p>
      ) : comments.length === 0 ? (
        <p className={`${TYPE.meta} text-slate-400`}>No comments yet.</p>
      ) : (
        <ul className="space-y-2 mb-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`${SURFACE.padTight} rounded-xl bg-slate-50 ${
                busyId === comment.id ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full shrink-0 grid place-items-center ${TYPE.code}
                    font-semibold bg-white text-slate-500`}
                  aria-hidden="true"
                >
                  {comment.authorInitials}
                </span>
                <span className={`${TYPE.meta} font-semibold text-slate-700 truncate`}>
                  {comment.authorName ?? 'Unknown'}
                </span>
                <span className={`${TYPE.meta} text-slate-400 shrink-0`}>
                  {formatWhen(comment.createdAt)}
                  {comment.edited && ' · edited'}
                </span>

                <span className="ml-auto flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditBody(comment.body);
                    }}
                    aria-label={`Edit comment by ${comment.authorName ?? 'unknown author'}`}
                    className="text-slate-300 hover:text-slate-600 cursor-pointer
                      focus-visible:outline-2 focus-visible:outline-offset-2
                      focus-visible:outline-emerald-500"
                  >
                    <FiEdit2 size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(comment)}
                    aria-label={`Delete comment by ${comment.authorName ?? 'unknown author'}`}
                    className="text-slate-300 hover:text-rose-600 cursor-pointer
                      focus-visible:outline-2 focus-visible:outline-offset-2
                      focus-visible:outline-rose-500"
                  >
                    <FiTrash2 size={11} />
                  </button>
                </span>
              </div>

              {editingId === comment.id ? (
                <div className="mt-1.5 space-y-1.5">
                  <label className="sr-only" htmlFor={`edit-comment-${comment.id}`}>
                    Comment text
                  </label>
                  <textarea
                    id={`edit-comment-${comment.id}`}
                    rows={2}
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    className={`${TYPE.body} ${FIELD.input}`}
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleEdit(comment)}
                      disabled={editBody.trim() === ''}
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
                <p className={`${TYPE.body} text-slate-700 leading-snug mt-1`}>{comment.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSend} className="space-y-1.5">
        <label className="sr-only" htmlFor={`comment-author-${taskId}`}>
          Comment as
        </label>
        <select
          id={`comment-author-${taskId}`}
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          className={`${TYPE.meta} ${FIELD.select} w-full`}
        >
          <option value="">Comment as…</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name ?? member.email}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`comment-body-${taskId}`}>
          Add a comment to {taskKey}
        </label>
        <textarea
          id={`comment-body-${taskId}`}
          rows={2}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={`Add a note about ${taskKey}`}
          className={`${TYPE.body} ${FIELD.input}`}
        />

        <button
          type="submit"
          disabled={sending || body.trim() === ''}
          className={`${TYPE.meta} ${FIELD.button} ${FIELD.primary}`}
        >
          <FiSend size={12} aria-hidden="true" />
          {sending ? 'Posting…' : 'Comment'}
        </button>
      </form>
    </section>
  );
};
