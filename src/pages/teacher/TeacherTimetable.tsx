import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { TimetableEntry } from '../../types/index.js';

export const TeacherTimetable: React.FC = () => {
  const { success, error } = useToast();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Request change modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [reason, setReason] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ timetable: TimetableEntry[] }>('/teachers/timetable');
      setTimetable(res.timetable || []);
    } catch (err: any) {
      error(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequest = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setReason('');
    setPreferredSlot('');
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      error('Please provide a reason for schedule adjustment.');
      return;
    }

    try {
      setSubmittingRequest(true);
      const res = await api.post('/teachers/timetable/request-change', {
        entry_id: selectedEntry?.id,
        reason,
        preferred_slot: preferredSlot,
      });

      success(res.message);
      setShowRequestModal(false);
    } catch (err: any) {
      error(err.message || 'Error submitting request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading faculty teaching schedule..." />;
  }

  const daySlots = timetable
    .filter((t) => t.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Teaching Schedule</h2>
          <p className="text-xs text-slate-500">
            Weekly allocated lecture periods, laboratory hours, and classroom allocations
          </p>
        </div>

        <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Timetable modification is restricted to Academic Administration. Requests can be submitted below.</span>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {daysOfWeek.map((day) => {
          const isSelected = day === selectedDay;
          const count = timetable.filter((t) => t.day_of_week === day).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Slots */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h3 className="text-base font-bold text-slate-900">{selectedDay} Classes</h3>
          <span className="text-xs text-slate-500 font-medium">
            {daySlots.length} allocated session(s)
          </span>
        </div>

        {daySlots.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No teaching commitments scheduled on {selectedDay}.
          </div>
        ) : (
          <div className="space-y-4">
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/40"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-20 py-2 px-2 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0 font-mono text-center">
                    <span className="text-xs font-bold text-slate-900">{slot.start_time}</span>
                    <span className="text-[10px] text-slate-400">to</span>
                    <span className="text-xs font-bold text-slate-600">{slot.end_time}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{slot.subject_name}</h4>
                    <p className="text-xs text-blue-700 font-semibold mt-0.5">{slot.class_name}</p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned Room: <strong className="text-slate-800">{slot.room}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenRequest(slot)}
                    className="py-1 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    Request Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Timetable Rescheduling"
        description={`Subject: ${selectedEntry?.subject_name} • Slot: ${selectedEntry?.day_of_week} ${selectedEntry?.start_time}-${selectedEntry?.end_time}`}
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Reschedule Request
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Faculty conference representation / Laboratory maintenance overlap..."
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Alternate Day & Time (Optional)
            </label>
            <input
              type="text"
              value={preferredSlot}
              onChange={(e) => setPreferredSlot(e.target.value)}
              placeholder="e.g. Friday Period 4 (13:30 - 14:30)"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRequest}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingRequest ? 'Submitting...' : 'Send to Administration'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
