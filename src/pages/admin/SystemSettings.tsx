import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';

export const SystemSettings: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [systemName, setSystemName] = useState('Smart Student Management System (SSMS)');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [allowProfileEdit, setAllowProfileEdit] = useState(true);

  // Reset database modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.settings) {
        setSystemName(res.settings.system_name || 'Smart Student Management System (SSMS)');
        setAcademicYear(res.settings.academic_year || '2026-2027');
        setAttendanceThreshold(res.settings.attendance_warning_threshold ?? 75);
        setAllowProfileEdit(res.settings.allow_student_profile_edit ?? true);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attendanceThreshold < 0 || attendanceThreshold > 100) {
      error('Attendance threshold must be between 0 and 100%');
      return;
    }

    try {
      setSaving(true);
      await api.put('/admin/settings', {
        system_name: systemName,
        academic_year: academicYear,
        attendance_warning_threshold: Number(attendanceThreshold),
        allow_student_profile_edit: allowProfileEdit,
      });
      success('System settings saved successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (resetConfirmInput !== 'RESET') {
      error('Please type RESET to confirm');
      return;
    }

    try {
      setResetting(true);
      await api.post('/admin/reset-demo-data', {});
      success('Database reset to initial demo seeds successfully');
      setShowResetModal(false);
      setResetConfirmInput('');
      fetchSettings();
    } catch (err: any) {
      error(err.message || 'Failed to reset database');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading system settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure academic policies, attendance thresholds, system branding, and maintenance operations.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Institutional Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">General Information</h2>
              <p className="text-xs text-slate-500">Institutional branding and active academic period</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Portal / System Name
              </label>
              <input
                type="text"
                required
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Current Academic Session
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026-2027"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Academic Policies */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic & Attendance Policies</h2>
              <p className="text-xs text-slate-500">Thresholds for alerts, warnings, and student self-service</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Attendance Warning Threshold (%): <span className="text-blue-600 font-bold">{attendanceThreshold}%</span>
                </label>
                <span className="text-xs text-slate-400">Students falling below this receive automated warnings</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                className="w-full mt-2 accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>50% (Lenient)</span>
                <span>75% (Standard University Policy)</span>
                <span>90% (Strict)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-slate-800">Student Self-Service Profile Updates</div>
                <div className="text-xs text-slate-500">
                  Allow students to edit phone, address, and emergency contact details directly from their portal.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowProfileEdit}
                  onChange={(e) => setAllowProfileEdit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Grading Scale Standard */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Standard Grading System (10.0 Scale)</h2>
              <p className="text-xs text-slate-500">Institutional grade breakdown applied to all final marks</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900 text-lg">A+</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1">90 - 100%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">10.0 GPA</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900 text-lg">A</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1">80 - 89%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">9.0 GPA</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900 text-lg">B+</div>
              <div className="text-xs font-semibold text-blue-600 mt-1">70 - 79%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">8.0 GPA</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900 text-lg">B</div>
              <div className="text-xs font-semibold text-blue-600 mt-1">60 - 69%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">7.0 GPA</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900 text-lg">C</div>
              <div className="text-xs font-semibold text-amber-600 mt-1">50 - 59%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">6.0 GPA</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900 text-lg">F</div>
              <div className="text-xs font-semibold text-rose-600 mt-1">&lt; 50%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">0.0 GPA</div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset Demo Database */}
      <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-900">Database Reset & Reseeding</h2>
            <p className="text-xs text-rose-700">Restore all student profiles, test marks, and attendance to default state</p>
          </div>
        </div>

        <p className="text-xs text-rose-600 leading-relaxed">
          Resetting will reload all 22 sample students, 4 faculty profiles, academic courses, timetables, and demo assignments.
          This operation is recommended for demonstration and test runs.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setResetConfirmInput('');
              setShowResetModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-bold transition shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Database
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Confirm Database Reset">
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Warning:</strong> This will restore default mock profiles and clear any newly created demo records.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Type <span className="font-mono text-rose-600 font-bold">RESET</span> to confirm:
            </label>
            <input
              type="text"
              value={resetConfirmInput}
              onChange={(e) => setResetConfirmInput(e.target.value)}
              placeholder="RESET"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-rose-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resetConfirmInput !== 'RESET' || resetting}
              onClick={handleResetDatabase}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
