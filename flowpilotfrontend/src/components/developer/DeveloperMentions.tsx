import React, { useEffect, useState } from "react";
import {
  Bug,
  Send,
  CornerDownRight,
  Maximize2,
  X,
  Clock,
  Terminal,
  CheckCircle2,
  Camera,
} from "lucide-react";

interface BugReply {
  id: number;
  bugId?: string;
  qaBugReportId?: number;
  senderName: string;
  senderRole: string;
  message: string;
  time?: string;
  createdAt?: string;
}

interface Mention {
  id: number;
  initials: string;
  name: string;
  task: string;
  message: string;
  time: string;
  unread: boolean;

  // Rich QA Bug details
  bugId?: string;
  title?: string;
  projectId?: number;
  projectName?: string;
  linkedTaskId?: string;
  environment?: string;
  severity?: string;
  assignedTo?: string;
  createdBy?: string;
  stepsToReproduce?: string;
  screenshot?: string;
  status?: string;
  createdAt?: string;
  replies?: BugReply[];
}

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:8080"
}/api/developer/mentions`;

export const DeveloperMentions: React.FC = () => {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [sentReplyId, setSentReplyId] = useState<number | null>(null);

  // Full image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("accessToken")
    );
  };

  const getLoggedInUserName = () => {
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("userData");
      if (stored) {
        const u = JSON.parse(stored);
        return u.name || u.fullName || u.email || "Developer";
      }
    } catch {}
    return "Developer";
  };

  const fetchMentions = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch mentions (${response.status})`);
      }

      const data: Mention[] = await response.json();
      setMentions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching mentions:", err);
      setError(err?.message || "Failed to load mentions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentions();
  }, []);

  const unreadCount = mentions.filter((m) => m.unread).length;

  const openReply = (id: number) => {
    setReplyOpen(id);
    setReplyText("");
    setMentions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
    );
  };

  const cancelReply = () => {
    setReplyOpen(null);
    setReplyText("");
  };

  const sendReply = async (mentionId: number) => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    const token = getToken();
    const developerName = getLoggedInUserName();

    try {
      const response = await fetch(`${API_URL}/${mentionId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          senderName: developerName,
          senderRole: "DEVELOPER",
          message: replyText.trim(),
        }),
      });

      if (!response.ok) {
        // Fallback to qa bug reply endpoint
        await fetch(`http://localhost:8080/api/qa/bugs/${mentionId}/replies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            senderName: developerName,
            senderRole: "DEVELOPER",
            message: replyText.trim(),
          }),
        });
      }

      const newReply: BugReply = {
        id: Date.now(),
        senderName: developerName,
        senderRole: "DEVELOPER",
        message: replyText.trim(),
        time: "Just now",
      };

      // Append locally to conversation
      setMentions((prev) =>
        prev.map((m) =>
          m.id === mentionId
            ? { ...m, replies: [...(m.replies || []), newReply] }
            : m
        )
      );

      setSentReplyId(mentionId);
      setReplyOpen(null);
      setReplyText("");
      setTimeout(() => setSentReplyId(null), 3000);
    } catch (err: any) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    const s = severity?.toLowerCase() || "medium";
    if (s.includes("crit")) {
      return "bg-rose-50 text-rose-700 border-rose-200 font-extrabold";
    }
    if (s.includes("high")) {
      return "bg-red-50 text-red-600 border-red-200 font-bold";
    }
    if (s.includes("low")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
    }
    return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-xs text-slate-400">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500 mb-2" />
          Loading bug reports & QA mentions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
          <p className="text-xs text-rose-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchMentions}
            className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          <span className="font-extrabold text-slate-800">{unreadCount} unread mentions</span> ·{" "}
          <span>{mentions.length} total bug reports from QA</span>
        </div>
        <span className="text-[11px] text-slate-400">
          Replies sent here sync directly into QA Engineer's bug view
        </span>
      </div>

      {/* No Mentions */}
      {mentions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          <Bug size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-700">No QA Bug Mentions Found</p>
          <p className="mt-1 text-slate-400">When QA logs bugs assigned to you, full details and screenshots will appear here.</p>
        </div>
      )}

      {/* Mention Cards */}
      <div className="space-y-4">
        {mentions.map((mention) => {
          const bugCode = mention.bugId || `BUG-${mention.id}`;
          const bugTitle = mention.title || mention.task;
          const steps = mention.stepsToReproduce;

          return (
            <div
              key={mention.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 ${
                mention.unread ? "border-amber-300 bg-amber-50/10" : "border-slate-200/80"
              }`}
            >
              {/* Header: QA Reporter, Bug ID, Badges, Time */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {/* QA Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                    {mention.initials || "QA"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {mention.createdBy || mention.name || "QA Engineer"}
                      </span>
                      <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 border border-indigo-200/60">
                        QA REPORTER
                      </span>
                      {mention.unread && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[9px] font-extrabold text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Filed bug on project: <span className="font-medium text-slate-600">{mention.projectName || "General"}</span>
                    </p>
                  </div>
                </div>

                {/* Right Badges */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {bugCode}
                  </span>

                  <span
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${getSeverityBadge(
                      mention.severity
                    )}`}
                  >
                    {mention.severity || "Medium"}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={12} />
                    {mention.time}
                  </span>
                </div>
              </div>

              {/* Bug Details Title & Meta Badges */}
              <div className="mt-3.5 space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Bug size={16} className="text-rose-500 shrink-0" />
                  <span>{bugTitle}</span>
                </h4>

                {/* Meta details bar */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {mention.environment && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      Env: <strong>{mention.environment}</strong>
                    </span>
                  )}
                  {mention.linkedTaskId && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      Linked Task: <strong>{mention.linkedTaskId}</strong>
                    </span>
                  )}
                  {mention.assignedTo && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      Assigned To: <strong>{mention.assignedTo}</strong>
                    </span>
                  )}
                  <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 border border-rose-200/60">
                    Status: {mention.status || "Open"}
                  </span>
                </div>
              </div>

              {/* Steps to Reproduce */}
              {steps && (
                <div className="mt-3 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    <Terminal size={13} className="text-slate-500" />
                    <span>Steps to Reproduce (from QA)</span>
                  </div>
                  <pre className="font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {steps}
                  </pre>
                </div>
              )}

              {/* SCREENSHOT PREVIEW (IF ATTACHED BY QA) */}
              {mention.screenshot && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Camera size={14} className="text-indigo-600" />
                      Screenshot Proof Attached by QA
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewImage(mention.screenshot || null)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <Maximize2 size={12} />
                      View Full Image
                    </button>
                  </div>
                  <div
                    onClick={() => setPreviewImage(mention.screenshot || null)}
                    className="relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-900/5 group max-h-56"
                  >
                    <img
                      src={mention.screenshot}
                      alt="Bug Screenshot"
                      className="w-full object-contain max-h-56 transition group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5">
                        <Maximize2 size={13} /> Click to Enlarge
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* DISCUSSION THREAD / PAST REPLIES */}
              {mention.replies && mention.replies.length > 0 && (
                <div className="mt-3.5 space-y-2.5 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Discussion History ({mention.replies.length})
                  </span>
                  <div className="space-y-2">
                    {mention.replies.map((reply, idx) => {
                      const isDev = reply.senderRole === "DEVELOPER";
                      return (
                        <div
                          key={reply.id || idx}
                          className={`rounded-xl p-3 text-xs ${
                            isDev
                              ? "bg-teal-50/70 border border-teal-100 text-teal-950 ml-4 sm:ml-8"
                              : "bg-slate-50 border border-slate-200 text-slate-800 mr-4 sm:mr-8"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className="flex items-center gap-1.5">
                              <span>{reply.senderName}</span>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold ${
                                  isDev ? "bg-teal-200/80 text-teal-800" : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {isDev ? "DEVELOPER" : "QA"}
                              </span>
                            </span>
                            <span className="text-slate-400 font-normal">{reply.time || "Recent"}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{reply.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* REPLY FORM / BUTTON */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                {replyOpen === mention.id ? (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Reply to QA ({mention.createdBy || "QA Team"}):
                    </label>
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="e.g. Fixed in commit #a4f2, deploying to Dev for retesting..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelReply}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={sendingReply || !replyText.trim()}
                        onClick={() => sendReply(mention.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition shadow-sm"
                      >
                        <Send size={13} />
                        {sendingReply ? "Sending…" : "Send Reply to QA"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openReply(mention.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3.5 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100/70"
                    >
                      <CornerDownRight size={13} />
                      Reply to QA
                    </button>

                    {sentReplyId === mention.id && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 animate-fade-in">
                        <CheckCircle2 size={14} /> Reply sent directly to QA panel!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LIGHTBOX MODAL FOR FULL SCREENSHOT */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/70 p-2 text-white hover:bg-slate-900"
            >
              <X size={18} />
            </button>
            <div className="max-h-[85vh] overflow-auto p-2">
              <img src={previewImage} alt="Bug Full Screenshot" className="max-w-full rounded-lg object-contain mx-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperMentions;