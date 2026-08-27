import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

type FilterType =
  | 'All'
  | 'Today'
  | 'This Week'
  | 'USER_CREATED'
  | 'PROJECT_UPDATED'
  | 'SPRINT_STARTED'
  | 'TIME_LOGGED';

interface AuditLog {
  id: number;
  time: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  day: string;
}

const API_URL = 'http://localhost:8080/api/superadmin/audit-logs';

const filters: FilterType[] = [
  'All',
  'Today',
  'This Week',
  'USER_CREATED',
  'PROJECT_UPDATED',
  'SPRINT_STARTED',
  'TIME_LOGGED',
];

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('accessToken')
  );
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapAuditLog = (item: Record<string, unknown>): AuditLog => ({
  id: Number(item.id ?? 0),
  time: String(item.time ?? ''),
  user: String(item.user ?? item.userName ?? ''),
  action: String(item.action ?? ''),
  entity: String(item.entity ?? item.entityName ?? ''),
  entityId: String(item.entityId ?? ''),
  ip: String(item.ip ?? item.ipAddress ?? ''),
  day: String(item.day ?? ''),
});

const SuperAdminAuditLogs: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const fetchAuditLogs = async () => {
        try {
          setLoading(true);
          setError('');

          const token = getToken();
          if (!token) {
            throw new Error('Please log in again to view audit logs.');
          }

          const params = new URLSearchParams();
          params.append('filter', activeFilter);
          if (search.trim()) {
            params.append('search', search.trim());
          }

          const response = await fetch(`${API_URL}?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            signal: controller.signal,
          });

          if (response.status === 401 || response.status === 403) {
            throw new Error('Please log in again to view audit logs.');
          }

          if (!response.ok) {
            throw new Error(`Failed to load audit logs: ${response.status}`);
          }

          const data = await response.json();
          const rows = Array.isArray(data) ? data : [];
          setAuditLogs(rows.map((item) => mapAuditLog(item as Record<string, unknown>)));
        } catch (err) {
          if (controller.signal.aborted) {
            return;
          }

          console.error('Error loading audit logs:', err);
          setError(
            err instanceof Error ? err.message : 'Unable to load audit logs'
          );
          setAuditLogs([]);
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      fetchAuditLogs();
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [activeFilter, search]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return auditLogs;
    }

    return auditLogs.filter(
      (log) =>
        log.user.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.entity.toLowerCase().includes(query) ||
        log.entityId.toLowerCase().includes(query) ||
        log.ip.toLowerCase().includes(query)
    );
  }, [auditLogs, search]);

  return (
    <div className="w-full min-w-0">
      {/* FILTER BAR */}
      <div className="mb-4 overflow-x-auto pb-1">
        <div className="flex w-max min-w-full items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-lg border px-4 py-2 text-[10px] font-semibold transition sm:px-5 sm:text-[11px] ${
                activeFilter === filter
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* OPTIONAL SEARCH - compact and responsive */}
      <div className="mb-4">
        <div className="relative mx-auto w-full sm:max-w-[280px]">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[10px] text-slate-600 outline-none placeholder:text-slate-400 focus:border-slate-300"
          />
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] font-semibold text-red-500">
          {error}
        </div>
      )}
      {loading && (
        <p className="mb-3 text-[11px] font-semibold text-slate-400">Loading audit logs...</p>
      )}

      {/* AUDIT TABLE — desktop */}
      <div className="hidden md:block w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="w-[12%] whitespace-nowrap px-5 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Time
                </th>
                <th className="w-[17%] whitespace-nowrap px-4 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  User
                </th>
                <th className="w-[26%] whitespace-nowrap px-4 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Action
                </th>
                <th className="w-[10%] whitespace-nowrap px-4 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Entity
                </th>
                <th className="w-[12%] whitespace-nowrap px-4 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Entity ID
                </th>
                <th className="w-[23%] whitespace-nowrap px-4 py-3 text-left text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  IP Address
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-[10px] font-medium text-slate-400">
                      {log.time}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold text-slate-800">
                      {log.user}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex whitespace-nowrap rounded-md bg-red-50 px-2.5 py-1 text-[9px] font-semibold text-red-500">
                        {log.action}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[10px] font-medium text-slate-500">
                      {log.entity}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[10px] text-slate-400">
                      {log.entityId}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[10px] text-slate-400">
                      {log.ip}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <p className="text-[11px] font-bold text-slate-700">
                      No audit logs found
                    </p>
                    <p className="mt-1 text-[9px] text-slate-400">
                      Try another filter or search term.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT CARDS — mobile */}
      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-[11px] font-bold text-slate-700">No audit logs found</p>
            <p className="mt-1 text-[9px] text-slate-400">Try another filter or search term.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-[9px] font-semibold text-red-500 whitespace-nowrap">{log.action}</span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{log.time}</span>
              </div>
              <p className="text-[12px] font-bold text-slate-800 mb-2">{log.user}</p>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                <div><span className="text-slate-400">Entity: </span>{log.entity}</div>
                <div><span className="text-slate-400">ID: </span><span className="font-mono">{log.entityId}</span></div>
                <div className="col-span-2"><span className="text-slate-400">IP: </span><span className="font-mono">{log.ip}</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuperAdminAuditLogs;
