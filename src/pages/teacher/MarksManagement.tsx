import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Save,
  Download,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const MarksManagement: React.FC = () => {
  const { success, error } = useToast();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Student Marks Table
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [marksList, setMarksList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Create Assessment Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedAllocId, setSelectedAllocId] = useState('');
  const [asmType, setAsmType] = useState('internal_1');
  const [maxMarks, setMaxMarks] = useState<number>(50);
  const [asmDate, setAsmDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/marks');
      setAllocations(res.allocations || []);
      setAssessments(res.assessments || []);

      if (res.allocations && res.allocations.length > 0) {
        setSelectedAllocId(res.allocations[0].id);
      }

      if (res.assessments && res.assessments.length > 0) {
        setSelectedAssessmentId(res.assessments[0].id);
        loadAssessmentMarks(res.assessments[0].id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load gradebook');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentMarks = async (assessmentId: string) => {
    try {
      const res = await api.get(`/teachers/marks/assessment/${assessmentId}`);
      setCurrentAssessment(res.assessment);
      setMarksList(res.marks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAssessment = (id: string) => {
    setSelectedAssessmentId(id);
    loadAssessmentMarks(id);
  };

  const handleMarkChange = (studentId: string, val: string) => {
    const num = Number(val);
    setMarksList((prev) =>
      prev.map((m) => (m.student_id === studentId ? { ...m, marks_obtained: num } : m))
    );
  };

  const handleFeedbackChange = (studentId: string, val: string) => {
    setMarksList((prev) =>
      prev.map((m) => (m.student_id === studentId ? { ...m, feedback: val } : m))
    );
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const alloc = allocations.find((a) => a.id === selectedAllocId);
    if (!alloc) {
      error('Please select an allocated subject.');
      return;
    }

    if (!title.trim() || maxMarks <= 0) {
      error('Please specify a valid title and positive max marks.');
      return;
    }

    try {
      const res = await api.post('/teachers/marks/assessments', {
        title,
        subject_id: alloc.subject_id,
        class_id: alloc.class_id,
        type: asmType,
        max_marks: maxMarks,
        date: asmDate,
      });

      success('Assessment created successfully');
      setShowModal(false);
      setTitle('');
      fetchMetadata();
    } catch (err: any) {
      error(err.message || 'Failed to create assessment');
    }
  };

  const handleSaveMarks = async () => {
    if (!currentAssessment) return;

    // Validate marks
    for (const m of marksList) {
      if (m.marks_obtained < 0 || m.marks_obtained > currentAssessment.max_marks) {
        error(`Invalid marks for ${m.student_name}: must be between 0 and ${currentAssessment.max_marks}`);
        return;
      }
    }

    try {
      setSaving(true);
      await api.post(`/teachers/marks/assessment/${currentAssessment.id}/save`, {
        marks: marksList.map((m) => ({
          student_id: m.student_id,
          marks_obtained: m.marks_obtained,
          feedback: m.feedback,
        })),
      });

      success('Assessment marks published successfully!');
      loadAssessmentMarks(currentAssessment.id);
    } catch (err: any) {
      error(err.message || 'Error saving marks');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!currentAssessment || marksList.length === 0) return;
    const rows = [
      [`Marks Report - ${currentAssessment.title}`],
      ['Max Marks', currentAssessment.max_marks.toString()],
      ['Date', currentAssessment.date],
      [],
      ['Register Number', 'Student Name', 'Marks Obtained', 'Percentage', 'Feedback'],
      ...marksList.map((m) => [
        m.register_number,
        m.student_name,
        m.marks_obtained.toString(),
        `${((m.marks_obtained / currentAssessment.max_marks) * 100).toFixed(1)}%`,
        `"${m.feedback || ''}"`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Marks_${currentAssessment.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading marks management portal..." />;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Marks & Results Management
          </h2>
          <p className="text-xs text-slate-500">
            Create academic assessments, score student performance, and publish official grades
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentAssessment && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Marks CSV
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Assessment
          </button>
        </div>
      </div>

      {/* Assessment Selection Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select Active Assessment to Grade / Review:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {assessments.map((asm) => (
            <button
              key={asm.id}
              onClick={() => handleSelectAssessment(asm.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedAssessmentId === asm.id
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  {asm.type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{asm.date}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate">{asm.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                {asm.subject_name} • Max: {asm.max_marks} pts
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Marks Entry Table */}
      {currentAssessment && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{currentAssessment.title}</h3>
                <Badge variant="primary" size="sm">
                  Max Marks: {currentAssessment.max_marks}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter student scores. Values will be validated against maximum score limit.
              </p>
            </div>

            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing...' : 'Save & Publish Marks'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Register Number</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4 w-32">Marks Obtained</th>
                  <th className="py-2.5 px-4 text-center">Score %</th>
                  <th className="py-2.5 px-4">Teacher Evaluation Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {marksList.map((m) => {
                  const pct = ((m.marks_obtained / currentAssessment.max_marks) * 100).toFixed(1);
                  const isInvalid = m.marks_obtained < 0 || m.marks_obtained > currentAssessment.max_marks;

                  return (
                    <tr key={m.student_id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-slate-600">{m.register_number}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{m.student_name}</td>
                      <td className="py-2.5 px-4">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={currentAssessment.max_marks}
                            value={m.marks_obtained}
                            onChange={(e) => handleMarkChange(m.student_id, e.target.value)}
                            className={`w-24 py-1 px-2.5 text-xs rounded-lg border font-bold text-slate-900 ${
                              isInvalid ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200 bg-white'
                            } focus:outline-none focus:ring-1 focus:ring-blue-600`}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold">
                        <span className={Number(pct) >= 75 ? 'text-emerald-700' : 'text-slate-800'}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          placeholder="Optional performance comment..."
                          value={m.feedback || ''}
                          onChange={(e) => handleFeedbackChange(m.student_id, e.target.value)}
                          className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 bg-white w-full max-w-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Assessment"
        description="Configure evaluation type, maximum marks, and course allocation"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Internal Assessment 2 - SQL Query Optimization"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject & Class</label>
              <select
                value={selectedAllocId}
                onChange={(e) => setSelectedAllocId(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {allocations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.subject_code} - {a.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Type</label>
              <select
                value={asmType}
                onChange={(e) => setAsmType(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="internal_1">Internal Assessment 1</option>
                <option value="internal_2">Internal Assessment 2</option>
                <option value="exam">Mid-Term / Final Exam</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Practical Lab Test</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks</label>
              <input
                type="number"
                min={1}
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date Conducted</label>
              <input
                type="date"
                required
                value={asmDate}
                onChange={(e) => setAsmDate(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Create Assessment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
