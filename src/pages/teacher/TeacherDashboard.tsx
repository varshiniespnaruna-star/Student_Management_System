import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CalendarCheck,
  FileCheck,
  Clock,
  ArrowRight,
  Megaphone,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherOverview();
  }, []);

  const fetchTeacherOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/overview');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner fullScreen message="Loading faculty dashboard..." />;
  }

  const { teacher, metrics, today_classes, assigned_allocations, performance_chart, recent_announcements } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {teacher.designation}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">ID: {teacher.employee_id}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {teacher.full_name}! 🎓
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {teacher.department_name} • Office: {teacher.office_room}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" /> Mark Attendance
          </button>
          <button
            onClick={() => navigate('/teacher/marks')}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Enter Marks
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Students Taught"
          value={metrics.total_students_taught}
          subtitle={`Across ${metrics.assigned_classes_count} enrolled classes`}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          trend={{ value: 'Full scope', isPositive: true }}
        />

        <StatCard
          title="Assigned Subjects"
          value={metrics.assigned_subjects_count}
          subtitle="Curriculum course offerings"
          icon={<BookOpen className="w-5 h-5 text-purple-600" />}
          trend={{ value: `${assigned_allocations.length} class allocations`, isPositive: true }}
        />

        <StatCard
          title="Pending Evaluations"
          value={metrics.pending_evaluations_count}
          subtitle="Submissions awaiting score"
          icon={<FileCheck className="w-5 h-5 text-amber-500" />}
          highlight={metrics.pending_evaluations_count > 0}
          trend={{
            value: metrics.pending_evaluations_count > 0 ? 'Needs review' : 'All clear',
            isPositive: metrics.pending_evaluations_count === 0,
          }}
        />

        <StatCard
          title="Today's Lectures"
          value={`${metrics.completed_attendance_today} / ${metrics.scheduled_classes_today}`}
          subtitle="Attendance taken today"
          icon={<Clock className="w-5 h-5 text-emerald-600" />}
          trend={{
            value: metrics.completed_attendance_today >= metrics.scheduled_classes_today ? 'Completed' : 'Pending',
            isPositive: metrics.completed_attendance_today >= metrics.scheduled_classes_today,
          }}
        />
      </div>

      {/* Charts & Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Average Score Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Assessment Averages</h3>
              <p className="text-xs text-slate-400">Class score averages across evaluated tests</p>
            </div>
            <button
              onClick={() => navigate('/teacher/marks')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Gradebook <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            {performance_chart.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No assessments recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance_chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="assessment" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Class Average']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Today's Lecture Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Today’s Schedule</h3>
              <p className="text-xs text-slate-400">Lecture hall times and assigned student batches</p>
            </div>
            <button
              onClick={() => navigate('/teacher/timetable')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Full Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {today_classes.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No classes scheduled for today.</p>
            ) : (
              today_classes.map((cls: any) => (
                <div
                  key={cls.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                      {cls.start_time}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{cls.subject_name}</h4>
                      <p className="text-[11px] text-slate-500">{cls.class_name}</p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">
                    {cls.room}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assigned Subjects & Classes Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Teaching Allocations & Subject Portfolio</h3>
            <p className="text-xs text-slate-400">Active institutional teaching responsibilities</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Assigned Class</th>
                <th className="py-3 px-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {assigned_allocations.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{a.subject_name}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{a.subject_code}</td>
                  <td className="py-3.5 px-4 font-semibold text-blue-700">{a.class_name}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate('/teacher/attendance')}
                        className="py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer text-[11px]"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => navigate('/teacher/marks')}
                        className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer text-[11px]"
                      >
                        Marks
                      </button>
                    </div>
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
