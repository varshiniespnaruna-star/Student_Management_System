import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  GraduationCap,
  FileText,
  Clock,
  AlertTriangle,
  ArrowRight,
  Megaphone,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await api.get('/students/overview');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading || !data) {
    return <LoadingSpinner fullScreen message="Loading student dashboard metrics..." />;
  }

  const {
    student,
    metrics,
    today_timetable,
    attendance_trend,
    subject_performance,
    upcoming_deadlines,
    recent_announcements,
    recent_activity,
  } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {student.class_name || 'Class of 2026'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">{student.register_number}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {student.full_name}! 👋
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {student.department_name} • Semester {student.semester}
          </p>
        </div>

        {metrics.is_low_attendance && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">Attendance Warning Alert</p>
              <p className="text-[11px] text-amber-700">
                Your attendance ({metrics.attendance_percentage}%) is below the {metrics.attendance_threshold}% mandatory minimum.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4 Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Score"
          value={`${metrics.attendance_percentage}%`}
          subtitle={`Min ${metrics.attendance_threshold}% required`}
          icon={<CalendarCheck className="w-5 h-5" />}
          highlight={metrics.is_low_attendance}
          trend={{
            value: metrics.is_low_attendance ? 'Below Target' : 'Compliant',
            isPositive: !metrics.is_low_attendance,
            label: 'institutional policy',
          }}
        />

        <StatCard
          title="Cumulative GPA"
          value={metrics.current_gpa}
          subtitle={`Scale 4.0 (${metrics.total_credits} credits)`}
          icon={<GraduationCap className="w-5 h-5" />}
          trend={{ value: 'Dean’s Honor Roll', isPositive: true, label: 'Standing' }}
        />

        <StatCard
          title="Pending Submissions"
          value={metrics.pending_assignments_count}
          subtitle="Assignments due soon"
          icon={<FileText className="w-5 h-5" />}
          trend={{
            value: `${upcoming_deadlines.length} critical`,
            isPositive: metrics.pending_assignments_count === 0,
            label: 'this month',
          }}
        />

        <StatCard
          title="Scheduled Exams"
          value={metrics.upcoming_exams_count}
          subtitle="Assessments scheduled"
          icon={<Clock className="w-5 h-5" />}
          trend={{ value: 'Midterm 2', isPositive: true, label: 'active' }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Attendance Progression</h3>
              <p className="text-xs text-slate-400">Cumulative percentage over time</p>
            </div>
            <button
              onClick={() => navigate('/student/attendance')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendance_trend}>
                <defs>
                  <linearGradient id="attColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#attColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Subject Performance</h3>
              <p className="text-xs text-slate-400">Score percentage by subject</p>
            </div>
            <button
              onClick={() => navigate('/student/academics')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Gradebook <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subject_performance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subject_code" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Timetable & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Today’s Timetable</h3>
            </div>
            <button
              onClick={() => navigate('/student/timetable')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Full Schedule →
            </button>
          </div>

          <div className="space-y-2.5">
            {today_timetable.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No scheduled lectures today.</p>
            ) : (
              today_timetable.map((slot: any, idx: number) => (
                <div
                  key={slot.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-center w-14 font-mono font-semibold text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                      <span>{slot.start_time}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{slot.end_time}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{slot.subject_name}</h4>
                      <p className="text-[11px] text-slate-500">Instructor: {slot.teacher_name}</p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">
                    {slot.room}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deadlines & Announcements */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Deadlines</h3>
              <button
                onClick={() => navigate('/student/assignments')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                All
              </button>
            </div>
            <div className="space-y-2">
              {upcoming_deadlines.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No pending assignments!</p>
              ) : (
                upcoming_deadlines.map((asg: any) => (
                  <div key={asg.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-800 truncate">{asg.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>{asg.subject_name}</span>
                      <span className="text-rose-600 font-medium">Due {asg.due_date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Notices</h3>
              </div>
              <button
                onClick={() => navigate('/student/notifications')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                More
              </button>
            </div>
            <div className="space-y-2.5">
              {recent_announcements.slice(0, 2).map((ann: any) => (
                <div key={ann.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/30">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{ann.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
