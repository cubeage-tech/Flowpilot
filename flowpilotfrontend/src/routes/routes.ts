/**
 * Flowpilot Common Routes & Navigation Configuration
 * 
 * Central registry for all application views, role mappings, and routing paths.
 */

export const APP_VIEWS = {
  LANDING: 'landing',
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
} as const;

export type AppView = typeof APP_VIEWS[keyof typeof APP_VIEWS];

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  SCRUM_MASTER: 'SCRUM_MASTER',
  DEVELOPER: 'DEVELOPER',
  QA_ENGINEER: 'QA_ENGINEER',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/** Friendly names for user roles displayed across the UI. */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  SCRUM_MASTER: 'Scrum Master',
  DEVELOPER: 'Developer',
  QA_ENGINEER: 'QA Engineer',
  VIEWER: 'Viewer',
};

/** Normalize role strings from backend tokens/responses to standard UserRole. */
export function normalizeRole(role: string | null | undefined): string {
  if (!role) return '';
  const clean = role.trim().toUpperCase().replace(/[-\s]+/g, '_');
  if (clean.startsWith('ROLE_')) return clean.substring(5);
  return clean;
}

/** Central API routes configuration mapping backend endpoints. */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
  },
  SUPERADMIN: {
    DASHBOARD: '/api/superadmin/dashboard',
    USERS: '/api/superadmin/users',
    DEPARTMENTS: '/api/superadmin/departments',
    PROJECTS: '/api/superadmin/projects',
    ROLES: '/api/superadmin/roles',
    AUDIT_LOGS: '/api/superadmin/audit-logs',
    SETTINGS: '/api/superadmin/settings',
  },
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    DEPARTMENTS: '/api/admin/departments',
  },
  PM: {
    PROJECTS: '/api/pm/projects',
  },
  SCRUM_MASTER: {
    BOARD: '/api/scrummaster/board',
    SPRINTS: '/api/scrummaster/sprints',
    TASKS: '/api/scrummaster/tasks',
    STANDUPS: '/api/scrummaster/standups',
    RETROSPECTIVES: '/api/scrummaster/retrospectives',
    ANALYTICS: '/api/scrummaster/analytics',
  },
  DEVELOPER: {
    TIME_LOGS: '/api/developer/timelogs',
  },
  QA: {
    BUG_REPORTS: '/api/qa/bugs',
    TEST_CASES: '/api/qa/tests',
  },
  VIEWER: {
    REPORTS: '/api/viewer/reports',
    SPRINT_STATUS: '/api/viewer/sprints',
  },
} as const;
