import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Save,
  Check,
  History,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

interface AttendanceRecordInput {
  student_id: string;
  student_name: string;
  register_number: string;
  status: 'present' | 'absent' | 'leave';
  remarks?: string;
}

export const AttendanceManagement: React.FC = () => {
  const { success, error } = useToast();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [lowAttendanceList, setLowAttendanceList] = useState<any[]>([]);
  const [threshold, setThreshold] = useState(75);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [selectedAllocation, setSelectedAllocation] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState<number>(1);

  // Student list for marking
  const [records, setRecords] = useState<AttendanceRecordInput[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/attendance');
      setAllocations(res.allocations || []);
      setSessions(res.sessions || []);
      setLowAttendanceList(res.low_attendance_students || []);
      setThreshold(res.threshold || 75);

      if (res.allocations && res.allocations.length > 0) {
        setSelectedAllocation(res.allocations[0].id);
        loadStudentsForClass(res.allocations[0].class_id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load attendance portal');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForClass = async (classId: string) => {
    try {
      const res = await api.get(`/teachers/students?class_id=${classId}`);
      const initial: AttendanceRecordInput[] = (res.students || []).map((s: any) => ({
        student_id: s.id,
        student_name: s.full_name,
        register_number: s.register_number,
        status: 'present', // default all present
        remarks: '',
      }));
      setRecords(initial);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocationChange = (allocId: string) => {
    setSelectedAllocation(allocId);
    const alloc = allocations.find((a) => a.id === allocId);
    if (alloc) {
      loadStudentsForClass(alloc.class_id);
    }
  };

  const setStatus = (studentId: string, status: 'present' | 'absent' | 'leave') => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    const alloc = allocations.find((a) => a.id === selectedAllocation);
    if (!alloc) {
      error('Please select an active subject allocation.');
      return;
    }

    if (records.length === 0) {
      error('No enrolled students in class.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post('/teachers/attendance', {
        class_id: alloc.class_id,
        subject_id: alloc.subject_id,
        date,
        period,
        records: records.map((r) => ({
          student_id: r.student_id,
          status: r.status,
          remarks: r.remarks,
        })),
      });

      success('Attendance session saved successfully!');
      fetchMetadata();
    } catch (err: any) {
      error(err.message || 'Failed to save attendance session.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading attendance management..." />;
  }

  const currentAllocation = allocations.find((a) => a.id === selectedAllocation);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Attendance Management
          </h2>
          <p className="text-xs text-slate-500">
            Record class sessions, log student attendance, and monitor low-attendance alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            Threshold: {threshold}%
          </Badge>
        </div>
      </div>

      {/* Low Attendance Warning Panel */}
      {lowAttendanceList.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs">
          <div className="flex items-center gap-2 mb-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Low Attendance Watchlist ({lowAttendanceList.length} students under {threshold}%)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowAttendanceList.slice(0, 6).map((s) => (
              <span
                key={s.id}
                className="bg-white border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg font-medium text-[11px]"
              >
                {s.full_name} ({s.register_number}) — <strong className="text-rose-600">{s.percentage}%</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Recording Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Take Class Attendance</h3>
            <p className="text-xs text-slate-500">Select course allocation, date and lecture period</p>
          </div>

          {/* Quick Mark All buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="py-1 px-3 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="py-1 px-3 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Form Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject & Class</label>
            <select
              value={selectedAllocation}
              onChange={(e) => handleAllocationChange(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              {allocations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject_name} ({a.class_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lecture Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value={1}>Period 1 (09:00 - 10:00)</option>
              <option value={2}>Period 2 (10:15 - 11:15)</option>
              <option value={3}>Period 3 (11:30 - 12:30)</option>
              <option value={4}>Period 4 (13:30 - 14:30)</option>
              <option value={5}>Period 5 (14:45 - 15:45)</option>
            </select>
          </div>
        </div>

        {/* Student Roster Marking Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Register No</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {records.map((r) => (
                <tr key={r.student_id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono text-slate-600">{r.register_number}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{r.student_name}</td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setStatus(r.student_id, 'present')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          r.status === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(r.student_id, 'absent')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          r.status === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-rose-700'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(r.student_id, 'leave')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          r.status === 'leave'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-blue-700'
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="text"
                      placeholder="Optional remarks"
                      value={r.remarks || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRecords((prev) =>
                          prev.map((rec) =>
                            rec.student_id === r.student_id ? { ...rec, remarks: val } : rec
                          )
                        );
                      }}
                      className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 bg-white w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Recording Attendance...' : 'Save & Submit Attendance'}
          </button>
        </div>
      </div>

      {/* Recent Sessions History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <History className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Recent Attendance Sessions Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Period</th>
                <th className="py-2 px-3">Class</th>
                <th className="py-2 px-3">Subject</th>
                <th className="py-2 px-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.slice(0, 10).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-medium">{s.date}</td>
                  <td className="py-2.5 px-3">Period {s.period}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{s.class_name}</td>
                  <td className="py-2.5 px-3 text-slate-700">{s.subject_name}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(s.created_at).toLocaleTimeString()}
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
