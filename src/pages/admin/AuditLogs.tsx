import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Calendar,
  Download,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Badge } from '../../components/common/Badge.js';
import { AuditLog } from '../../types/index.js';

export const AuditLogs: React.FC = () => {
  const { error, success } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs?limit=200');
      setLogs(res.logs || []);
    } catch (err: any) {
      error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string): 'danger' | 'success' | 'warning' | 'primary' => {
    if (action.includes('RESET') || action.includes('DELETE') || action.includes('INACTIVE')) return 'danger';
    if (action.includes('CREATE') || action.includes('ASSIGN')) return 'success';
    if (action.includes('UPDATE') || action.includes('STATUS')) return 'warning';
    return 'primary';
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchEmail = log.user_email?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchEntity = log.entity_type?.toLowerCase().includes(q);
      return matchEmail || matchAction || matchDetails || matchEntity;
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'User Email', 'Action', 'Entity Type', 'Details', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.created_at || l.timestamp || ''}"`,
      `"${l.user_email || ''}"`,
      `"${l.action}"`,
      `"${l.entity_type}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ip_address || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ssms_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Audit logs downloaded as CSV');
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Retrieving audit logs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete immutable audit trail of authentication events, grade modifications, attendance sessions, and administrative actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, action, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-blue-500 bg-white"
            >
              <option value="all">All Action Types</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> audit events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const timeStr = log.created_at || log.timestamp || new Date().toISOString();
              const dt = new Date(timeStr);
              const formattedDate = dt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dt.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-xs">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    <div>{formattedDate}</div>
                    <div className="text-[11px] text-slate-400">{formattedTime}</div>
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-900 whitespace-nowrap">
                    {log.user_email || 'System'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                      {log.entity_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-800 max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-sm">
                  No audit log entries match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
