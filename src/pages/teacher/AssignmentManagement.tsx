import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  Calendar,
  FileCheck,
  Eye,
  Check,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const AssignmentManagement: React.FC = () => {
  const { success, error } = useToast();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submissions review
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);

  // Grade Modal
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeScore, setGradeScore] = useState<number | string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAllocId, setSelectedAllocId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/assignments');
      setAllocations(res.allocations || []);
      setAssignments(res.assignments || []);

      if (res.allocations && res.allocations.length > 0) {
        setSelectedAllocId(res.allocations[0].id);
      }

      if (res.assignments && res.assignments.length > 0) {
        setSelectedAssignmentId(res.assignments[0].id);
        loadSubmissions(res.assignments[0].id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (asgId: string) => {
    try {
      const res = await api.get(`/teachers/assignments/${asgId}/submissions`);
      setCurrentAssignment(res.assignment);
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAssignment = (id: string) => {
    setSelectedAssignmentId(id);
    loadSubmissions(id);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const alloc = allocations.find((a) => a.id === selectedAllocId);
    if (!alloc) {
      error('Please select an allocated subject.');
      return;
    }

    if (!title.trim() || !dueDate) {
      error('Title and due date are required.');
      return;
    }

    try {
      await api.post('/teachers/assignments', {
        title,
        description,
        subject_id: alloc.subject_id,
        class_id: alloc.class_id,
        due_date: dueDate,
        max_score: maxScore,
      });

      success('New assignment published successfully');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchMetadata();
    } catch (err: any) {
      error(err.message || 'Failed to create assignment');
    }
  };

  const handleOpenGrade = (sub: any) => {
    setGradingSubmission(sub);
    setGradeScore(sub.score !== undefined ? sub.score : currentAssignment?.max_score || 100);
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const num = Number(gradeScore);
    if (isNaN(num) || num < 0 || (currentAssignment && num > currentAssignment.max_score)) {
      error(`Score must be between 0 and ${currentAssignment?.max_score || 100}`);
      return;
    }

    try {
      setSavingGrade(true);
      await api.post(`/teachers/assignments/submissions/${gradingSubmission.id}/grade`, {
        score: num,
        feedback: gradeFeedback,
      });

      success('Submission evaluation saved');
      setGradingSubmission(null);
      loadSubmissions(selectedAssignmentId);
    } catch (err: any) {
      error(err.message || 'Failed to grade submission');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading assignment portal..." />;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assignment Management</h2>
          <p className="text-xs text-slate-500">
            Publish course projects, track student uploads, and evaluate submissions with feedback
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </button>
      </div>

      {/* Assignment Carousel Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Select Assignment to Evaluate Submissions:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {assignments.map((asg) => (
            <button
              key={asg.id}
              onClick={() => handleSelectAssignment(asg.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedAssignmentId === asg.id
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Badge variant="primary" size="sm">
                  {asg.subject_name}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">Due: {asg.due_date}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate">{asg.title}</h4>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
                <span>{asg.class_name}</span>
                <span className="text-blue-700 font-bold">
                  {asg.evaluated_count} / {asg.total_submissions} Graded
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Roster */}
      {currentAssignment && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{currentAssignment.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentAssignment.class_name} • Max Score: {currentAssignment.max_score} points
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              Submissions Received: {submissions.length}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No student submissions received yet for this assignment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Register No</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Submitted File</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4 text-center">Score</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-slate-600">{sub.register_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.student_name}</td>
                      <td className="py-3 px-4">
                        <a
                          href={sub.file_path}
                          download={sub.file_name}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {sub.file_name}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {sub.score !== undefined ? `${sub.score} / ${currentAssignment.max_score}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            sub.status === 'evaluated'
                              ? 'success'
                              : sub.status === 'late'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                        >
                          {sub.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenGrade(sub)}
                          className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                        >
                          {sub.status === 'evaluated' ? 'Edit Grade' : 'Evaluate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grade Submission Modal */}
      <Modal
        isOpen={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        title={`Evaluate: ${gradingSubmission?.student_name || 'Student'}`}
        description={`File: ${gradingSubmission?.file_name} • Max Score: ${currentAssignment?.max_score}`}
      >
        <form onSubmit={handleSaveGrade} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Score Obtained (out of {currentAssignment?.max_score || 100})
            </label>
            <input
              type="number"
              min={0}
              max={currentAssignment?.max_score || 100}
              required
              value={gradeScore}
              onChange={(e) => setGradeScore(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Evaluator Feedback
            </label>
            <textarea
              rows={3}
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
              placeholder="Constructive feedback for the student..."
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setGradingSubmission(null)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingGrade}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {savingGrade ? 'Saving...' : 'Submit Evaluation'}
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Course Assignment"
        description="Issue assignments to enrolled classes with deadline and instructions"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Protocol Implementation"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions & Problem Statement</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide assignment guidelines and submission expectations..."
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Allocation</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Score Points</label>
              <input
                type="number"
                min={1}
                required
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Deadline</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Publish Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
