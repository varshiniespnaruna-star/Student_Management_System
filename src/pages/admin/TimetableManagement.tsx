import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Filter,
  Building,
  User,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { TimetableEntry } from '../../types/index.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TimetableManagement: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // Add Slot Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [slotClassId, setSlotClassId] = useState('');
  const [slotSubjectId, setSlotSubjectId] = useState('');
  const [slotTeacherId, setSlotTeacherId] = useState('');
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('10:00');
  const [slotRoom, setSlotRoom] = useState('LH-101');
  const [submitting, setSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadataAndTimetable();
  }, []);

  const fetchMetadataAndTimetable = async () => {
    try {
      setLoading(true);
      const [acadRes, ttRes] = await Promise.all([
        api.get('/admin/academic-data'),
        api.get('/admin/timetable'),
      ]);
      setClasses(acadRes.classes || []);
      setSubjects(acadRes.subjects || []);
      setTeachers(acadRes.teachers || []);
      setTimetable(ttRes.timetable || []);

      if (acadRes.classes?.length > 0) setSlotClassId(acadRes.classes[0].id);
      if (acadRes.subjects?.length > 0) setSlotSubjectId(acadRes.subjects[0].id);
      if (acadRes.teachers?.length > 0) setSlotTeacherId(acadRes.teachers[0].id);
    } catch (err: any) {
      error(err.message || 'Failed to load timetable management data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      let url = '/admin/timetable';
      if (selectedClassId !== 'all') {
        url += `?class_id=${selectedClassId}`;
      }
      const res = await api.get(url);
      setTimetable(res.timetable || []);
    } catch (err: any) {
      error(err.message || 'Failed to refresh timetable');
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchTimetable();
    }
  }, [selectedClassId]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    if (slotStartTime >= slotEndTime) {
      setConflictWarning('Start time must be strictly before end time.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/admin/timetable', {
        class_id: slotClassId,
        subject_id: slotSubjectId,
        teacher_id: slotTeacherId,
        day_of_week: slotDay,
        start_time: slotStartTime,
        end_time: slotEndTime,
        room: slotRoom,
      });

      success('Timetable slot scheduled successfully');
      setShowAddModal(false);
      fetchTimetable();
    } catch (err: any) {
      setConflictWarning(err.message || 'Schedule conflict detected');
      error(err.message || 'Failed to schedule slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      await api.delete(`/admin/timetable/${id}`);
      success('Timetable slot removed');
      fetchTimetable();
    } catch (err: any) {
      error(err.message || 'Failed to delete timetable slot');
    }
  };

  const filteredEntries = timetable.filter((entry) => {
    if (selectedDay !== 'all' && entry.day_of_week !== selectedDay) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading timetable master..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Timetable Master</h1>
          <p className="text-sm text-slate-500 mt-1">
            Institutional schedule matrix with real-time teacher and room conflict detection.
          </p>
        </div>
        <button
          onClick={() => {
            setConflictWarning(null);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Schedule Slot
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 uppercase">Class:</span>
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-blue-500 bg-white"
          >
            <option value="all">All Classes & Sections</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs font-semibold text-slate-600 uppercase">Day:</span>
          </div>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-blue-500 bg-white"
          >
            <option value="all">All Working Days (Mon - Fri)</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredEntries.length}</span> scheduled sessions
        </div>
      </div>

      {/* Conflict Detection Banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Automated Conflict Engine Active:</strong> The scheduler automatically blocks overlapping slots for the same teacher, room, or student class section.
        </span>
      </div>

      {/* Timetable Matrix Grid by Day */}
      <div className="space-y-4">
        {DAYS.filter((d) => selectedDay === 'all' || selectedDay === d).map((day) => {
          const dayEntries = timetable
            .filter((e) => e.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div key={day} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800">{day}</span>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {dayEntries.length} {dayEntries.length === 1 ? 'Period' : 'Periods'}
                </span>
              </div>

              {dayEntries.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No periods scheduled for {day}</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dayEntries.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                    >
                      <div className="flex items-start md:items-center gap-4">
                        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono text-xs font-bold rounded-lg border border-blue-100 flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {slot.start_time} - {slot.end_time}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {slot.subject_name || slot.subject_id}
                            </span>
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {slot.subject_code}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 text-slate-700 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {slot.teacher_name || 'Faculty Member'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-blue-600">
                              <Building className="w-3.5 h-3.5" />
                              Room: {slot.room}
                            </span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                              {slot.class_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Schedule New Timetable Slot">
        <form onSubmit={handleCreateSlot} className="space-y-4">
          {conflictWarning && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Scheduling Conflict:</strong>
                <p className="mt-0.5">{conflictWarning}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Class / Section *</label>
              <select
                value={slotClassId}
                onChange={(e) => setSlotClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500 bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject *</label>
              <select
                value={slotSubjectId}
                onChange={(e) => setSlotSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500 bg-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teacher *</label>
              <select
                value={slotTeacherId}
                onChange={(e) => setSlotTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500 bg-white"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.designation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Day of Week *</label>
              <select
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500 bg-white"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={slotStartTime}
                onChange={(e) => setSlotStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">End Time *</label>
              <input
                type="time"
                required
                value={slotEndTime}
                onChange={(e) => setSlotEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Room / Lab *</label>
              <input
                type="text"
                required
                placeholder="e.g. LH-101"
                value={slotRoom}
                onChange={(e) => setSlotRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Checking Conflicts...' : 'Schedule Period'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
