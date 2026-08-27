import { useEffect, useMemo, useState } from "react";

interface AnalyticsTask {
  id: number;
  taskKey: string;
  title: string;
  status: string;
  storyPoints: number;
  sprintId: number | null;
  assigneeId: number | null;
  assigneeName: string | null;
  createdAt: string;
  completedAt: string | null;
  actualHours: number | null;
}

interface StatCardProps {
  label: string;
  value: string;
  valueClass?: string;
}

const API_URL = "http://localhost:8080/api/pm/analytics/tasks";

function StatCard({ label, value, valueClass }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-wide text-slate-400">
        {label.toUpperCase()}
      </p>

      <p
        className={`mt-1 text-2xl font-extrabold sm:text-[28px] ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function VelocityChart({
  velocityData,
}: {
  velocityData: {
    sprint: string;
    value: number;
    current?: boolean;
  }[];
}) {
  const maxValue = Math.max(
    ...velocityData.map((item) => item.value),
    1
  );

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 sm:p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900 sm:text-[15px]">
          Velocity by Sprint
        </h2>

        <button
          type="button"
          className="shrink-0 rounded-lg bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-200"
        >
          Export PDF
        </button>
      </div>

      {velocityData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          No sprint data available.
        </div>
      ) : (
        <div className="flex w-full justify-center">
          <div className="flex w-full items-end justify-center gap-1 overflow-x-auto sm:gap-3">
            {velocityData.map(({ sprint, value, current }) => (
              <div
                key={sprint}
                className="flex w-8 shrink-0 flex-col items-center gap-2 sm:w-auto sm:max-w-[13rem]"
              >
                <span className="text-xs font-semibold text-slate-600 sm:text-sm">
                  {value}
                </span>

                <div className="flex h-24 w-7 items-end sm:h-27 sm:w-12">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      current ? "bg-violet-400" : "bg-violet-100"
                    }`}
                    style={{
                      height: `${(value / maxValue) * 100}%`,
                      minHeight: value > 0 ? "4px" : "0px",
                    }}
                  />
                </div>

                <span className="text-[11px] text-slate-500 sm:text-xs">
                  {sprint}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PMAnalytics() {
  const [tasks, setTasks] = useState<AnalyticsTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${response.statusText}`
        );
      }

      const data: AnalyticsTask[] = await response.json();

      setTasks(data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch PM analytics:", err);

      setError(
        "Unable to load analytics. Make sure the Spring Boot backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial API request
    fetchAnalytics();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const completedTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.status.toUpperCase() === "DONE"
    );
  }, [tasks]);

  const storyPointsDone = useMemo(() => {
    return completedTasks.reduce(
      (total, task) => total + (task.storyPoints || 0),
      0
    );
  }, [completedTasks]);

  const tasksCompleted = completedTasks.length;

  const totalTasks = tasks.length;

  const averageCycleTime = useMemo(() => {
    const completedWithDates = completedTasks.filter(
      (task) => task.createdAt && task.completedAt
    );

    if (completedWithDates.length === 0) {
      return null;
    }

    const totalMilliseconds = completedWithDates.reduce(
      (total, task) => {
        const created = new Date(task.createdAt).getTime();
        const completed = new Date(task.completedAt!).getTime();

        return total + Math.max(0, completed - created);
      },
      0
    );

    const averageMilliseconds =
      totalMilliseconds / completedWithDates.length;

    const averageDays =
      averageMilliseconds / (1000 * 60 * 60 * 24);

    return averageDays;
  }, [completedTasks]);

  const velocityData = useMemo(() => {
    const sprintMap = new Map<number, number>();

    completedTasks.forEach((task) => {
      if (task.sprintId !== null) {
        const current = sprintMap.get(task.sprintId) || 0;

        sprintMap.set(
          task.sprintId,
          current + (task.storyPoints || 0)
        );
      }
    });

    const sortedSprints = Array.from(sprintMap.entries())
      .sort(([sprintA], [sprintB]) => sprintA - sprintB)
      .slice(-8);

    const latestSprintId =
      sortedSprints.length > 0
        ? sortedSprints[sortedSprints.length - 1][0]
        : null;

    return sortedSprints.map(([sprintId, value]) => ({
      sprint: `S${sprintId}`,
      value,
      current: sprintId === latestSprintId,
    }));
  }, [completedTasks]);

  const statCards: StatCardProps[] = [
    {
      label: "Story Points Done",
      value: loading ? "..." : `${storyPointsDone} SP`,
      valueClass: "text-violet-500",
    },
    {
      label: "Tasks Completed",
      value: loading
        ? "..."
        : `${tasksCompleted} / ${totalTasks}`,
      valueClass: "text-emerald-500",
    },
    {
      label: "Avg Cycle Time",
      value:
        loading
          ? "..."
          : averageCycleTime === null
          ? "N/A"
          : `${averageCycleTime.toFixed(1)} days`,
      valueClass: "text-teal-400",
    },
  ];

  return (
    <div className="w-full max-w-full space-y-2 overflow-x-hidden sm:space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <VelocityChart velocityData={velocityData} />
    </div>
  );
}

export default PMAnalytics;