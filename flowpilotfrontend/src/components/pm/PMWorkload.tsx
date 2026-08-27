import { useEffect, useMemo, useState } from "react";

const colorThemes = {
  teal: {
    avatarBg: "bg-teal-100",
    avatarText: "text-teal-600",
    filled: "bg-teal-400",
    empty: "bg-teal-50",
  },
  violet: {
    avatarBg: "bg-violet-100",
    avatarText: "text-violet-600",
    filled: "bg-violet-400",
    empty: "bg-violet-50",
  },
  amber: {
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-600",
    filled: "bg-amber-500",
    empty: "bg-amber-50",
  },
  green: {
    avatarBg: "bg-green-100",
    avatarText: "text-green-600",
    filled: "bg-green-500",
    empty: "bg-green-50",
  },
  red: {
    avatarBg: "bg-rose-100",
    avatarText: "text-rose-600",
    filled: "bg-rose-500",
    empty: "bg-rose-50",
  },
};

type ThemeKey = keyof typeof colorThemes;

interface Task {
  id: number;
  taskKey: string;
  title: string;
  status: string;
  storyPoints: number;
  sprintId: number | null;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeRole: string | null;
  createdAt: string;
  completedAt: string | null;
  actualHours: number | null;
}

interface TeamMember {
  id: number;
  initials: string;
  name: string;
  role: string;
  done: number;
  assigned: number;
  theme: ThemeKey;
}

const API_URL = "http://localhost:8080/api/pm/analytics/tasks";

function getInitials(name: string) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function TeamWorkloadBar({
  done,
  assigned,
  theme,
}: {
  done: number;
  assigned: number;
  theme: { filled: string; empty: string };
}) {
  const segments = Array.from(
    { length: Math.max(assigned, 1) },
    (_, i) => i < done
  );

  return (
    <div className="flex w-full min-w-0 gap-1">
      {segments.map((isFilled, i) => (
        <div
          key={i}
          className={`h-5 min-w-0 flex-1 rounded-full ${
            isFilled ? theme.filled : theme.empty
          }`}
        />
      ))}
    </div>
  );
}

function TeamWorkloadRow({
  initials,
  name,
  role,
  done,
  assigned,
  theme: themeKey,
}: TeamMember) {
  const theme = colorThemes[themeKey];

  const percent =
    assigned > 0 ? Math.round((done / assigned) * 100) : 0;

  return (
    <div className="flex min-w-0 flex-col gap-6 border-b border-slate-50 py-5 last:border-none sm:flex-row sm:items-center sm:gap-4">
      {/* Avatar + name */}
      <div className="flex min-w-0 items-center gap-4 sm:w-50 sm:shrink-0">
        <div
          className={`flex h-11 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${theme.avatarBg} ${theme.avatarText}`}
        >
          {initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-medium font-bold text-slate-900">
            {name}
          </p>

          <p className="truncate text-xs text-slate-400">
            {role}
          </p>
        </div>
      </div>

      {/* Bar + caption */}
      <div className="min-w-0 flex-1">
        <TeamWorkloadBar
          done={done}
          assigned={assigned}
          theme={theme}
        />

        <p className="mt-1.5 text-xs text-slate-400">
          {done} done / {assigned} assigned
        </p>
      </div>

      {/* Percent */}
      <div className="text-right sm:w-24 sm:shrink-0">
        <p className="text-lg font-bold text-slate-900">
          {percent}%
        </p>

        <p className="text-xs text-slate-400">
          complete
        </p>
      </div>
    </div>
  );
}

function TeamWorkloadCard({
  team,
  sprintId,
  loading,
}: {
  team: TeamMember[];
  sprintId: number | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
      <h2 className="mb-2 text-base font-bold text-slate-900 sm:text-lg">
        Team Workload —{" "}
        {sprintId !== null ? `Sprint ${sprintId}` : "No Sprint"}
      </h2>

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">
          Loading team workload...
        </div>
      ) : team.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          No assigned tasks found for this sprint.
        </div>
      ) : (
        <div className="min-w-0">
          {team.map((member) => (
            <TeamWorkloadRow
              key={member.id}
              {...member}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const PMWorkload = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data: Task[] = await response.json();

      setTasks(data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch workload:", err);

      setError(
        "Unable to load team workload. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchTasks();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchTasks();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /*
   * Find the latest sprint from the real task data.
   *
   * Your current database contains Sprint 14,
   * so this will automatically show:
   *
   * Team Workload — Sprint 14
   */
  const currentSprintId = useMemo(() => {
    const sprintIds = tasks
      .map((task) => task.sprintId)
      .filter(
        (id): id is number => id !== null
      );

    if (sprintIds.length === 0) {
      return null;
    }

    return Math.max(...sprintIds);
  }, [tasks]);

  /*
   * Only use tasks belonging to the current sprint.
   */
  const currentSprintTasks = useMemo(() => {
    if (currentSprintId === null) {
      return [];
    }

    return tasks.filter(
      (task) => task.sprintId === currentSprintId
    );
  }, [tasks, currentSprintId]);

  /*
   * Create workload information from real tasks.
   */
  const team = useMemo<TeamMember[]>(() => {
    const memberMap = new Map<number, TeamMember>();

    currentSprintTasks.forEach((task) => {
      if (task.assigneeId === null) {
        return;
      }

      const memberId = task.assigneeId;

      if (!memberMap.has(memberId)) {
        const name =
          task.assigneeName ||
          `User #${memberId}`;

        const themeKeys: ThemeKey[] = [
          "teal",
          "violet",
          "amber",
          "green",
          "red",
        ];

        const theme =
          themeKeys[memberMap.size % themeKeys.length];

        memberMap.set(memberId, {
          id: memberId,
          initials: getInitials(name),
          name,
          role: task.assigneeRole || "Team Member",
          done: 0,
          assigned: 0,
          theme,
        });
      }

      const member = memberMap.get(memberId)!;

      member.assigned += 1;

      if (task.status.toUpperCase() === "DONE") {
        member.done += 1;
      }
    });

    return Array.from(memberMap.values());
  }, [currentSprintTasks]);

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col bg-slate-50 lg:flex-row">
      <div className="min-w-0 flex-1">
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <TeamWorkloadCard
            team={team}
            sprintId={currentSprintId}
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
};

export default PMWorkload;