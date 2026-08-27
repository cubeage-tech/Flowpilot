import React, { useState } from "react";

interface Mention {
  id: number;
  initials: string;
  name: string;
  task: string;
  message: string;
  time: string;
  unread: boolean;
}

const initialMentions: Mention[] = [
  {
    id: 1,
    initials: "AK",
    name: "Aryan Kapoor",
    task: "T-040",
    message:
      "@sneha How is the component library coming along? We need Button + Input done before the demo on Aug 8.",
    time: "2h ago",
    unread: true,
  },
  {
    id: 2,
    initials: "PR",
    name: "Priya Rajan",
    task: "T-042",
    message:
      "@sneha Found a rendering bug in the velocity chart on Firefox. Can you look into T-042-bug-01?",
    time: "5h ago",
    unread: true,
  },
  {
    id: 3,
    initials: "MK",
    name: "Mihir Khatri",
    task: "T-041",
    message:
      "@sneha API docs are ready for review. I've linked the swagger spec in the PR — let me know if something looks off.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 4,
    initials: "AS",
    name: "Arjun Shah",
    task: "T-049",
    message:
      "@sneha Drag-and-drop is Sprint 12 priority. Please start this after T-044 wraps up.",
    time: "Yesterday",
    unread: false,
  },
];

const DeveloperMentions: React.FC = () => {
  const [mentions, setMentions] = useState(initialMentions);

  const [replyOpen, setReplyOpen] = useState<number | null>(null);

  const [replyText, setReplyText] = useState("");

  const [sentReply, setSentReply] = useState<number | null>(null);

  const unreadCount = mentions.filter((mention) => mention.unread).length;

  const openReply = (id: number) => {
    setReplyOpen(id);
    setReplyText("");

    setMentions((prev) =>
      prev.map((mention) =>
        mention.id === id ? { ...mention, unread: false } : mention
      )
    );
  };

  const cancelReply = () => {
    setReplyOpen(null);
    setReplyText("");
  };

  const sendReply = (id: number) => {
    if (!replyText.trim()) return;

    setSentReply(id);
    setReplyOpen(null);
    setReplyText("");

    setTimeout(() => {
      setSentReply(null);
    }, 2200);
  };

  return (
    <div className="w-full">
      {/* Summary */}
      <div className="mb-4 text-sm text-gray-500">
        <span className="font-medium">
          {unreadCount} unread mentions
        </span>{" "}
        · {mentions.length} total
      </div>

      {/* Mentions */}
      <div className="space-y-3">
        {mentions.map((mention) => (
          <div
            key={mention.id}
            className={`rounded-2xl border bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.04)] transition-all duration-200 ${
              mention.unread
                ? "border-teal-100"
                : "border-gray-100"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-indigo-300 text-xs font-bold text-white">
                {mention.initials}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[13px] font-bold text-gray-900">
                    {mention.name}
                  </span>

                  <span className="text-xs text-gray-400">
                    on
                  </span>

                  <span className="font-mono text-xs text-gray-400">
                    {mention.task}
                  </span>

                  {mention.unread && (
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600">
                      NEW
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[13px] leading-6 text-gray-700">
                  {mention.message}
                </p>

                {/* Reply */}
                <div className="mt-3">
                  {replyOpen === mention.id ? (
                    <div className="max-w-xl">
                      <textarea
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                      />

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => sendReply(mention.id)}
                          className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-600"
                        >
                          Send
                        </button>

                        <button
                          type="button"
                          onClick={cancelReply}
                          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openReply(mention.id)}
                      className="rounded-lg border border-teal-100 bg-white px-4 py-2 text-xs font-semibold text-teal-600 transition hover:bg-teal-50"
                    >
                      Reply
                    </button>
                  )}

                  {sentReply === mention.id && (
                    <span className="ml-3 text-xs font-medium text-emerald-500">
                      Reply sent successfully.
                    </span>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="shrink-0 text-xs text-gray-400">
                {mention.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { DeveloperMentions };
export default DeveloperMentions;