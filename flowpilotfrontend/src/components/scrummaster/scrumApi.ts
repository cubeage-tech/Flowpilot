/**
 * API client for the Scrum Master module.
 *
 * Types mirror the backend records in
 * com.flowpilot.flowpilot.scrummaster.dto exactly. Keeping the base URL and
 * auth header in one place means the five pages cannot drift apart, and there
 * is a single line to change when the API stops living on localhost.
 */

const BASE_URL = 'http://localhost:8080/api/scrummaster';

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/** Surfaces the backend's own message so the UI can say what actually failed. */
const readError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    return body?.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers: authHeaders() });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on port 8080?');
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

type QueryValue = string | number | boolean | undefined | null;

/** Drops empty values so optional filters do not become `?assigneeId=`. */
const query = (params: Record<string, QueryValue> | object): string => {
  const parts = Object.entries(params as Record<string, QueryValue>)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return parts.length ? `?${parts.join('&')}` : '';
};

// ============================================
// SHARED VOCABULARY
// ============================================

export const TASK_STATUSES = [
  'BACKLOG',
  'SPRINT_READY',
  'TODO',
  'IN_PROGRESS',
  'CODE_REVIEW',
  'TESTING',
  'DONE',
  'BLOCKED'
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * The statuses that get their own board column.
 *
 * Review is deliberately absent. Eight columns left each one too narrow to
 * read a card without truncating the title, so Review's cards ride in the
 * Testing column instead. Review is still a first-class status everywhere
 * else — it stays in every card's move dropdown and in the analytics — so no
 * task becomes unreachable by losing its column.
 */
export const BOARD_COLUMNS: readonly TaskStatus[] = [
  'BACKLOG',
  'SPRINT_READY',
  'TODO',
  'IN_PROGRESS',
  'TESTING',
  'DONE',
  'BLOCKED'
];

export const PRIORITIES = ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'] as const;

export type Priority = (typeof PRIORITIES)[number];

export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

/** Human labels. The backend sends these too, but forms need them before a fetch. */
export const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  SPRINT_READY: 'Sprint ready',
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  CODE_REVIEW: 'Review',
  TESTING: 'Testing',
  DONE: 'Done',
  BLOCKED: 'Blocked'
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOWEST: 'Lowest',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  HIGHEST: 'Highest'
};

// ============================================
// TYPES
// ============================================

export interface Member {
  id: number;
  name: string | null;
  email: string;
  role: string;
  initials: string;
}

export interface Card {
  id: number;
  taskKey: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  storyPoints: number;
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: string | null;
  labels: string[];
  blockedReason: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeInitials: string;
  reporterId: number | null;
  reporterName: string | null;
  sprintId: number | null;
  daysInColumn: number;
  stuck: boolean;
  overdue: boolean;
}

export interface BoardColumn {
  status: TaskStatus;
  label: string;
  taskCount: number;
  totalPoints: number;
  wipLimit: number | null;
  wipExceeded: boolean;
  cards: Card[];
}

export interface Board {
  sprintId: number;
  sprintName: string;
  sprintStatus: SprintStatus;
  totalTasks: number;
  totalPoints: number;
  availableLabels: string[];
  members: Member[];
  columns: BoardColumn[];
}

export interface Sprint {
  id: number;
  sprintNumber: number;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: SprintStatus;
  durationDays: number | null;
  daysRemaining: number;
  daysElapsed: number;
  capacityPoints: number | null;
  committedPoints: number | null;
  projectId: number | null;
  taskCount: number;
  totalPoints: number;
  donePoints: number;
  scopeAddedPoints: number;
  overCapacity: boolean;
}

export interface CompleteResult {
  completedSprintId: number;
  completedPoints: number;
  carriedTaskCount: number;
  carriedPoints: number;
  carriedToSprintId: number | null;
  carriedToSprintName: string | null;
}

export interface StandupEntry {
  id: number;
  memberId: number;
  memberName: string | null;
  memberInitials: string;
  memberRole: string | null;
  standupDate: string;
  yesterday: string | null;
  today: string | null;
  blocker: string | null;
  blocked: boolean;
}

export interface Standups {
  sprintId: number;
  sprintName: string;
  date: string;
  attending: number;
  blockedCount: number;
  recordedDates: string[];
  members: Member[];
  entries: StandupEntry[];
}

export type RetroKind = 'WENT_WELL' | 'TO_CHANGE' | 'ACTION';

export interface RetroItem {
  id: number;
  kind: RetroKind;
  text: string;
  ownerId: number | null;
  ownerName: string | null;
  ownerInitials: string;
  dueLabel: string | null;
  dueDate: string | null;
  completed: boolean;
}

export interface Retrospective {
  sprintId: number;
  sprintName: string;
  sprintStatus: SprintStatus;
  heldOn: string | null;
  wentWell: RetroItem[];
  toChange: RetroItem[];
  actions: RetroItem[];
  members: Member[];
}

export interface DayPoint {
  date: string;
  dayNumber: number;
  remainingPoints: number;
  completedPoints: number;
  totalPoints: number;
  idealRemaining: number;
}

export interface Burndown {
  sprintId: number;
  sprintName: string;
  startDate: string | null;
  endDate: string | null;
  committedPoints: number | null;
  totalPoints: number;
  remainingPoints: number;
  durationDays: number | null;
  pointsBehindIdeal: number;
  trend: 'ahead' | 'on track' | 'behind';
  series: DayPoint[];
}

export interface VelocitySprint {
  sprintId: number;
  sprintNumber: number;
  name: string;
  committedPoints: number | null;
  completedPoints: number;
  current: boolean;
}

export interface Velocity {
  average: number | null;
  rollingAverage: number | null;
  sprintsCounted: number;
  sprints: VelocitySprint[];
}

export interface Slice {
  label: string;
  count: number;
  points: number;
}

export interface MemberProductivity {
  memberId: number;
  name: string | null;
  initials: string;
  assigned: number;
  completed: number;
  points: number;
  completionPercent: number;
}

export interface Kpis {
  tasksCompleted: number;
  tasksTotal: number;
  overdueTasks: number;
  averageCompletionHours: number | null;
  sprintSuccessRatePercent: number | null;
  sprintsAssessed: number;
}

export interface Analytics {
  burndown: Burndown;
  velocity: Velocity;
  kpis: Kpis;
  byPriority: Slice[];
  byStatus: Slice[];
  byMember: MemberProductivity[];
}

export interface Ceremony {
  name: string;
  when: string;
  tone: string;
}

export interface Dashboard {
  sprint: Sprint;
  kpis: Kpis;
  ceremonies: Ceremony[];
  stuckTasks: Card[];
}

// ============================================
// TASKS
// ============================================

export const fetchMembers = () => request<Member[]>('/tasks/members');

export const fetchBacklog = () => request<Card[]>('/tasks/backlog');

export interface TaskInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  status?: TaskStatus;
  storyPoints?: number;
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: string | null;
  labels?: string[];
  blockedReason?: string | null;
  assigneeId?: number | null;
  unassign?: boolean;
  reporterId?: number | null;
  sprintId?: number | null;
  removeFromSprint?: boolean;
  /**
   * A null value means "leave unchanged" on a PATCH, so emptying a field has
   * to be said explicitly. Without these, clearing a due date would report
   * success and silently keep the old value.
   */
  clearDescription?: boolean;
  clearDueDate?: boolean;
  clearEstimatedHours?: boolean;
  clearActualHours?: boolean;
  clearLabels?: boolean;
}

export const createTask = (body: TaskInput) =>
  request<Card>('/tasks', { method: 'POST', body: JSON.stringify(body) });

export const updateTask = (taskId: number, body: TaskInput) =>
  request<Card>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) });

export const cloneTask = (taskId: number) =>
  request<Card>(`/tasks/${taskId}/clone`, { method: 'POST' });

export const deleteTask = (taskId: number) =>
  request<{ success: boolean }>(`/tasks/${taskId}`, { method: 'DELETE' });

// ============================================
// BOARD
// ============================================

export interface BoardFilters {
  sprintId?: number;
  assigneeId?: number;
  priority?: Priority;
  label?: string;
  search?: string;
  unassigned?: boolean;
}

export const fetchBoard = (filters: BoardFilters = {}) =>
  request<Board>(`/board${query(filters)}`);

export const moveTask = (taskId: number, status: TaskStatus, blockedReason?: string) =>
  request<Card>(`/board/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, blockedReason: blockedReason ?? null })
  });

export const fetchWipLimits = () => request<Record<string, number>>('/board/wip-limits');

export const setWipLimit = (status: TaskStatus, limit: number | null) =>
  request<Board>('/board/wip-limits', {
    method: 'PUT',
    body: JSON.stringify({ status, limit })
  });

// ============================================
// SPRINTS
// ============================================

export const fetchSprints = () => request<Sprint[]>('/sprints');

export const fetchActiveSprint = () => request<Sprint>('/sprints/active');

export interface SprintInput {
  name?: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  capacityPoints?: number | null;
  projectId?: number | null;
  backlogTaskIds?: number[];
}

export const createSprint = (body: SprintInput) =>
  request<Sprint>('/sprints', { method: 'POST', body: JSON.stringify(body) });

export const updateSprint = (sprintId: number, body: SprintInput) =>
  request<Sprint>(`/sprints/${sprintId}`, { method: 'PATCH', body: JSON.stringify(body) });

export const startSprint = (sprintId: number) =>
  request<Sprint>(`/sprints/${sprintId}/start`, { method: 'POST' });

export const completeSprint = (sprintId: number, carryTo?: number) =>
  request<CompleteResult>(
    `/sprints/${sprintId}/complete${query({ carryTo })}`,
    { method: 'POST' }
  );

export const addToSprint = (sprintId: number, taskIds: number[]) =>
  request<Sprint>(`/sprints/${sprintId}/backlog`, {
    method: 'POST',
    body: JSON.stringify({ taskIds })
  });

export const removeFromSprint = (sprintId: number, taskIds: number[]) =>
  request<Sprint>(`/sprints/${sprintId}/backlog`, {
    method: 'DELETE',
    body: JSON.stringify({ taskIds })
  });

export const deleteSprint = (sprintId: number) =>
  request<{ success: boolean }>(`/sprints/${sprintId}`, { method: 'DELETE' });

// ============================================
// CEREMONIES
// ============================================

export const fetchStandups = (params: { sprintId?: number; date?: string } = {}) =>
  request<Standups>(`/standups${query(params)}`);

export const saveStandup = (body: {
  memberId: number;
  standupDate: string;
  yesterday?: string | null;
  today?: string | null;
  blocker?: string | null;
}) => request<StandupEntry>('/standups', { method: 'POST', body: JSON.stringify(body) });

export const deleteStandup = (standupId: number) =>
  request<{ success: boolean }>(`/standups/${standupId}`, { method: 'DELETE' });

export const fetchRetrospective = (sprintId?: number) =>
  request<Retrospective>(`/retrospective${query({ sprintId })}`);

export const createRetroItem = (body: {
  kind: RetroKind;
  text: string;
  ownerId?: number | null;
  dueLabel?: string | null;
  dueDate?: string | null;
}) => request<RetroItem>('/retrospective', { method: 'POST', body: JSON.stringify(body) });

export const updateRetroItem = (
  itemId: number,
  body: {
    text?: string;
    ownerId?: number | null;
    clearOwner?: boolean;
    dueLabel?: string | null;
    dueDate?: string | null;
    completed?: boolean;
  }
) => request<RetroItem>(`/retrospective/${itemId}`, {
  method: 'PATCH',
  body: JSON.stringify(body)
});

export const deleteRetroItem = (itemId: number) =>
  request<{ success: boolean }>(`/retrospective/${itemId}`, { method: 'DELETE' });

// ============================================
// ANALYTICS
// ============================================

export const fetchAnalytics = (sprintId?: number) =>
  request<Analytics>(`/analytics${query({ sprintId })}`);

export const fetchDashboard = () => request<Dashboard>('/dashboard');

// ============================================
// TASK COMMENTS  (SRS Module 4)
// ============================================

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number | null;
  authorName: string | null;
  authorInitials: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  edited: boolean;
}

export const fetchComments = (taskId: number) =>
  request<TaskComment[]>(`/comments/task/${taskId}`);

export const addComment = (taskId: number, body: string, authorId?: number | null) =>
  request<TaskComment>(`/comments/task/${taskId}`, {
    method: 'POST',
    body: JSON.stringify({ body, authorId: authorId ?? null })
  });

export const editComment = (commentId: number, body: string) =>
  request<TaskComment>(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ body })
  });

export const deleteComment = (commentId: number) =>
  request<{ success: boolean }>(`/comments/${commentId}`, { method: 'DELETE' });

// ============================================
// PROJECTS  (read-only bridge to the PM module)
// ============================================

export interface ProjectMember {
  id: number;
  name: string | null;
  email: string | null;
  employeeId: string | null;
  designation: string | null;
  initials: string;
}

export interface Project {
  id: number;
  code: string | null;
  name: string | null;
  status: string | null;
  progress: number | null;
  startDate: string | null;
  endDate: string | null;
  memberCount: number;
  members: ProjectMember[];
}

export const fetchProjects = () => request<Project[]>('/projects');

export const fetchProject = (projectId: number) =>
  request<Project>(`/projects/${projectId}`);

/** The sprint roster: the owning project's team (SRS Module 6 "Members"). */
export const fetchProjectMembers = (projectId: number) =>
  request<ProjectMember[]>(`/projects/${projectId}/members`);

// ============================================
// DEPENDENCIES  (SRS Module 4)
// ============================================

export interface DependencyLink {
  id: number;
  taskId: number;
  taskKey: string;
  title: string;
  status: TaskStatus;
  done: boolean;
}

export interface Dependencies {
  taskId: number;
  taskKey: string;
  /** Tasks this one is waiting on. */
  blockedBy: DependencyLink[];
  /** Tasks waiting on this one. */
  blocking: DependencyLink[];
  waiting: boolean;
  unresolvedCount: number;
}

export const fetchDependencies = (taskId: number) =>
  request<Dependencies>(`/dependencies/task/${taskId}`);

export const addDependency = (taskId: number, dependsOnTaskId: number) =>
  request<Dependencies>(`/dependencies/task/${taskId}`, {
    method: 'POST',
    body: JSON.stringify({ dependsOnTaskId })
  });

export const removeDependency = (linkId: number) =>
  request<{ success: boolean }>(`/dependencies/${linkId}`, { method: 'DELETE' });

// ============================================
// ATTACHMENTS  (SRS Module 4)
// ============================================

export interface Attachment {
  id: number;
  taskId: number;
  fileName: string;
  contentType: string | null;
  sizeBytes: number;
  uploadedById: number | null;
  uploadedByName: string | null;
  uploadedByInitials: string;
  uploadedAt: string;
  /** Relative download path, served by the backend. */
  downloadUrl: string;
}

export const fetchAttachments = (taskId: number) =>
  request<Attachment[]>(`/attachments/task/${taskId}`);

/**
 * Multipart upload, so the JSON content-type the shared client sets must be
 * dropped — the browser has to write its own boundary or the server cannot
 * parse the parts.
 */
export const uploadAttachment = async (
  taskId: number,
  file: File,
  uploadedById?: number | null
): Promise<Attachment> => {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('file', file);

  if (uploadedById) {
    form.append('uploadedById', String(uploadedById));
  }

  const response = await fetch(
    `http://localhost:8080/api/scrummaster/attachments/task/${taskId}`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
    }
  );

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      message = (await response.json())?.message ?? message;
    } catch {
      // A non-JSON body means the server rejected it before our handler ran
    }
    throw new Error(message);
  }

  return response.json() as Promise<Attachment>;
};

export const deleteAttachment = (attachmentId: number) =>
  request<{ success: boolean }>(`/attachments/${attachmentId}`, { method: 'DELETE' });

/** Absolute URL for an attachment, since downloads leave the API client. */
export const attachmentUrl = (attachment: Attachment): string =>
  `http://localhost:8080${attachment.downloadUrl}`;
