import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, User, ChevronRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { TimetableEntry } from '../../types/index.js';

export const StudentTimetable: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  // Determine today's day of week
  const todayIndex = new Date().getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[todayIndex] === 'Sunday' || dayNames[todayIndex] === 'Saturday' ? 'Monday' : dayNames[todayIndex];

  useEffect(() => {
    fetchTimetable();
    setSelectedDay(todayName);
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ timetable: TimetableEntry[] }>('/students/timetable');
      setTimetable(res.timetable);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading course schedule..." />;
  }

  // Filter slots for selected day sorted by start time
  const daySlots = timetable
    .filter((t) => t.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Class Timetable</h2>
          <p className="text-xs text-slate-500">
            Weekly academic class schedule, lecture halls, and instructor allocations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            Today: {todayName}
          </Badge>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {daysOfWeek.map((day) => {
          const isToday = day === todayName;
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
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day's Schedule List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h3 className="text-base font-bold text-slate-900">
            {selectedDay} Schedule
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {daySlots.length} lecture session(s)
          </span>
        </div>

        {daySlots.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No scheduled classes for {selectedDay}. Enjoy your personal study time!
          </div>
        ) : (
          <div className="space-y-4">
            {daySlots.map((slot, index) => (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all bg-slate-50/40"
              >
                <div className="flex items-start gap-4">
                  {/* Period time box */}
                  <div className="flex flex-col items-center justify-center w-20 py-2 px-2 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0 font-mono text-center">
                    <span className="text-xs font-bold text-slate-900">{slot.start_time}</span>
                    <span className="text-[10px] text-slate-400">to</span>
                    <span className="text-xs font-bold text-slate-600">{slot.end_time}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Period {index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{slot.subject_name}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Prof. {slot.teacher_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700 font-semibold">{slot.room}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge variant="primary" size="sm">
                    {slot.room}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
