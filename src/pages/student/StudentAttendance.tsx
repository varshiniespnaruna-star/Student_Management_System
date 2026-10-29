import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { StudentAttendanceData } from '../../types/index.js';

export const StudentAttendance: React.FC = () => {
  const [data, setData] = useState<StudentAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'leave'>('all');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get<StudentAttendanceData>('/students/attendance');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner fullScreen message="Loading attendance records..." />;
  }

  const { overall, subject_wise, history, trend } = data;

  const filteredHistory = history.filter((h) => {
    if (statusFilter === 'all') return true;
    return h.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and warning alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Record</h2>
          <p className="text-xs text-slate-500">
            Recorded session history, subject metrics, and compliance status
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
          <span className="text-slate-400">Institutional Threshold:</span>
          <span className="text-blue-700">{overall.threshold}% Minimum</span>
        </div>
      </div>

      {overall.is_low_attendance && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-950">Critical Attendance Warning</h4>
            <p className="mt-0.5 text-amber-800">
              Your overall attendance is currently {overall.percentage}%, which is strictly below the {overall.threshold}% institutional minimum requirement for end-semester examination hall ticket issuance. Please reach out to your academic counselor immediately.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${overall.percentage}%`}
          subtitle={`${overall.attended} of ${overall.total_classes} classes attended`}
          icon={<CalendarCheck className="w-5 h-5" />}
          highlight={overall.is_low_attendance}
          trend={{
            value: overall.is_low_attendance ? 'Warning' : 'Good Standing',
            isPositive: !overall.is_low_attendance,
          }}
        />

        <StatCard
          title="Classes Attended"
          value={overall.attended}
          subtitle="Present mark recorded"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          trend={{ value: 'Full credit', isPositive: true }}
        />

        <StatCard
          title="Classes Missed"
          value={overall.missed}
          subtitle="Unexcused absences"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          trend={{ value: `${overall.missed} sessions`, isPositive: overall.missed === 0 }}
        />

        <StatCard
          title="Excused Leave"
          value={overall.leave}
          subtitle="Documented medical/event leave"
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          trend={{ value: 'Authorized', isPositive: true }}
        />
      </div>

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Subject-Wise Attendance Summary</h3>
            <p className="text-xs text-slate-400">Class hours breakdown across registered curriculum</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4 text-center">Total Classes</th>
                <th className="py-3 px-4 text-center">Attended</th>
                <th className="py-3 px-4 text-center">Missed</th>
                <th className="py-3 px-4 text-center">Leave</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {subject_wise.map((s) => (
                <tr key={s.subject_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.subject_name}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{s.subject_code}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700">{s.total}</td>
                  <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">{s.attended}</td>
                  <td className="py-3.5 px-4 text-center text-rose-700 font-semibold">{s.missed}</td>
                  <td className="py-3.5 px-4 text-center text-blue-700">{s.leave}</td>
                  <td className="py-3.5 px-4 text-center font-bold">
                    <span className={s.percentage < overall.threshold ? 'text-rose-600' : 'text-slate-800'}>
                      {s.percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={s.percentage < overall.threshold ? 'danger' : 'success'} size="sm">
                      {s.percentage < overall.threshold ? 'Low Attendance' : 'Compliant'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cumulative Attendance Trend Line Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Cumulative Attendance Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Daily attendance trajectory vs 75% threshold benchmark</p>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Attendance']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Date-wise Detailed Attendance History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Session Log History</h3>
            <p className="text-xs text-slate-400">Chronological attendance timestamps</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">All Sessions ({history.length})</option>
              <option value="present">Present Only ({overall.attended})</option>
              <option value="absent">Absences Only ({overall.missed})</option>
              <option value="leave">Approved Leave ({overall.leave})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredHistory.slice(0, 30).map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-700">{h.date}</td>
                  <td className="py-3 px-4 text-slate-500">Period {h.period}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {h.subject_name} <span className="text-slate-400 font-normal">({h.subject_code})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{h.teacher_name}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={
                        h.status === 'present' ? 'success' : h.status === 'absent' ? 'danger' : 'primary'
                      }
                      size="sm"
                    >
                      {h.status === 'present' ? 'Present' : h.status === 'absent' ? 'Absent' : 'Approved Leave'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400 italic">
                    {h.remarks || '—'}
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
