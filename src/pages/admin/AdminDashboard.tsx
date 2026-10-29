import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Sliders,
  CalendarRange,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { StatCard } from '../../components/common/StatCard.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const AdminDashboard: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/overview');
      setOverview(res);
    } catch (err: any) {
      error(err.message || 'Failed to load administration overview');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all databases, users, and academic records to fresh initial seed state?')) {
      return;
    }
    try {
      setResetting(true);
      const res = await api.post('/admin/reset-demo-data');
      success(res.message);
      fetchOverview();
    } catch (err: any) {
      error(err.message || 'Error resetting database');
    } finally {
      setResetting(false);
    }
  };

  if (loading || !overview) {
    return <LoadingSpinner fullScreen message="Loading administrative portal..." />;
  }

  const { metrics, system_settings, recent_logs } = overview;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">
              SUPER ADMINISTRATOR
            </Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">Academic Year {system_settings.academic_year}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Administration Console
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional users, course offerings, timetable masters, and audit security
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            {resetting ? 'Resetting...' : 'Reset Demo DB'}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={metrics.total_students}
          subtitle="Enrolled undergraduates"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          trend={{ value: `${metrics.active_users} active accounts`, isPositive: true }}
        />

        <StatCard
          title="Faculty Members"
          value={metrics.total_teachers}
          subtitle="Professors & Instructors"
          icon={<GraduationCap className="w-5 h-5 text-purple-600" />}
          trend={{ value: 'Full departments', isPositive: true }}
        />

        <StatCard
          title="Departments & Classes"
          value={`${metrics.total_departments} Depts`}
          subtitle={`${metrics.total_classes} active class sections`}
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          trend={{ value: `${metrics.total_subjects} subjects`, isPositive: true }}
        />

        <StatCard
          title="Campus Attendance"
          value={`${metrics.average_attendance}%`}
          subtitle={`Policy minimum: ${system_settings.attendance_warning_threshold}%`}
          icon={<CalendarCheck className="w-5 h-5 text-amber-500" />}
          trend={{
            value: metrics.average_attendance >= system_settings.attendance_warning_threshold ? 'Compliant' : 'Warning',
            isPositive: metrics.average_attendance >= system_settings.attendance_warning_threshold,
          }}
        />
      </div>

      {/* Quick Links Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/admin/academic')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Academic Structure & Allocations</h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure departments, semesters, subjects, classes, and assign faculty to lectures.
          </p>
          <span className="text-xs text-blue-600 font-semibold mt-3 inline-flex items-center gap-1">
            Manage Curriculum →
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/timetable')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <CalendarRange className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Master Timetable & Conflict Engine</h3>
          <p className="text-xs text-slate-500 mt-1">
            Add schedule slots with real-time detection of classroom and teacher double-booking.
          </p>
          <span className="text-xs text-purple-600 font-semibold mt-3 inline-flex items-center gap-1">
            Open Timetable →
          </span>
        </div>

        <div
          onClick={() => navigate('/admin/settings')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">System Governance & Thresholds</h3>
          <p className="text-xs text-slate-500 mt-1">
            Adjust attendance cutoff percentages (75%), grading rules, and system profile settings.
          </p>
          <span className="text-xs text-amber-600 font-semibold mt-3 inline-flex items-center gap-1">
            System Config →
          </span>
        </div>
      </div>

      {/* Security Audit Trail Snippet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Security Audit Trail</h3>
          </div>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            View All Logs →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4">IP Address</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recent_logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-blue-700 font-bold">{log.action}</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono">{log.entity_type}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{log.user_email || 'System'}</td>
                  <td className="py-2.5 px-4 text-slate-600">{log.details}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">{log.ip_address}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
