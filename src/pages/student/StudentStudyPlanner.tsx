import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Award,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { StudyTask, SkillCertification, Subject } from '../../types/index.js';

export const StudentStudyPlanner: React.FC = () => {
  const { success, error } = useToast();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [skills, setSkills] = useState<SkillCertification[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // New Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubjectId, setTaskSubjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // New Skill Modal
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillTitle, setSkillTitle] = useState('');
  const [skillCategory, setSkillCategory] = useState<'skill' | 'certification' | 'project' | 'internship'>('certification');
  const [skillOrg, setSkillOrg] = useState('');
  const [skillUrl, setSkillUrl] = useState('');

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const fetchPlannerData = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ tasks: StudyTask[]; skills: SkillCertification[]; subjects: Subject[] }>(
        '/students/study-planner'
      );
      setTasks(res.tasks || []);
      setSkills(res.skills || []);
      setSubjects(res.subjects || []);
    } catch (err: any) {
      error(err.message || 'Failed to load study planner');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      await api.post('/students/study-planner/tasks', {
        title: taskTitle,
        description: taskDesc,
        subject_id: taskSubjectId || undefined,
        priority: taskPriority,
        due_date: taskDueDate || undefined,
      });
      success('Study task created successfully');
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      fetchPlannerData();
    } catch (err: any) {
      error(err.message || 'Error creating task');
    }
  };

  const handleToggleTask = async (task: StudyTask) => {
    try {
      await api.put(`/students/study-planner/tasks/${task.id}`, {
        is_completed: !task.is_completed,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: !t.is_completed } : t))
      );
    } catch (err: any) {
      error(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/students/study-planner/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      success('Task removed');
    } catch (err: any) {
      error(err.message || 'Failed to delete task');
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillTitle.trim()) return;

    try {
      await api.post('/students/study-planner/skills', {
        title: skillTitle,
        category: skillCategory,
        organization: skillOrg,
        credential_url: skillUrl,
        issue_date: new Date().toISOString().slice(0, 10),
        status: 'completed',
      });
      success('Skill/Certification added');
      setShowSkillModal(false);
      setSkillTitle('');
      setSkillOrg('');
      setSkillUrl('');
      fetchPlannerData();
    } catch (err: any) {
      error(err.message || 'Failed to record skill');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await api.delete(`/students/study-planner/skills/${id}`);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      success('Record removed');
    } catch (err: any) {
      error(err.message || 'Failed to delete record');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading study planner..." />;
  }

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Study Planner & Career Portfolio
          </h2>
          <p className="text-xs text-slate-500">
            Personal academic goal setting, revision checklists, and extracurricular skill records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSkillModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-blue-600" /> Add Certification/Skill
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Study Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Personal Study Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Personal Revision Goals</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {completedCount} of {tasks.length} completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
              />
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active revision tasks. Click "New Study Task" to plan your week!
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const subject = subjects.find((s) => s.id === task.subject_id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                        task.is_completed
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1">
                          <p
                            className={`text-xs font-semibold ${
                              task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {subject && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {subject.name}
                              </span>
                            )}
                            <Badge
                              variant={
                                task.priority === 'high'
                                  ? 'danger'
                                  : task.priority === 'medium'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {task.priority.toUpperCase()} PRIORITY
                            </Badge>
                            {task.due_date && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Due {task.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Skills, Certifications & Internships */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900">Verified Credentials</h3>
              </div>
              <span className="text-xs text-slate-400">{skills.length} listed</span>
            </div>

            {skills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No certifications or projects logged yet.
              </p>
            ) : (
              <div className="space-y-3">
                {skills.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant={
                            item.category === 'certification'
                              ? 'purple'
                              : item.category === 'internship'
                              ? 'primary'
                              : 'success'
                          }
                          size="sm"
                        >
                          {item.category.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      {item.organization && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.organization}</p>
                      )}
                      {item.credential_url && (
                        <a
                          href={item.credential_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline mt-1 block"
                        >
                          Verification URL →
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteSkill(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Add Personal Study Task"
        description="Private planning task visible only to your student account"
      >
        <form onSubmit={handleCreateTask} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Solve Practice Set 4 for Database Normalization"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Key topics to review, formulas, or test cases"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Subject</label>
              <select
                value={taskSubjectId}
                onChange={(e) => setTaskSubjectId(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">General Study</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Due Date</label>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>

      {/* New Skill Modal */}
      <Modal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        title="Add Certification, Project, or Skill"
        description="Showcase professional credentials and real-world internships"
      >
        <form onSubmit={handleCreateSkill} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={skillTitle}
              onChange={(e) => setSkillTitle(e.target.value)}
              placeholder="e.g. AWS Certified Developer / Distributed Cache Project"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="certification">Certification</option>
                <option value="project">Project</option>
                <option value="internship">Internship</option>
                <option value="skill">Skill</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Issuer</label>
              <input
                type="text"
                value={skillOrg}
                onChange={(e) => setSkillOrg(e.target.value)}
                placeholder="e.g. Amazon Web Services / Google"
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Verification / Project URL (Optional)</label>
            <input
              type="url"
              value={skillUrl}
              onChange={(e) => setSkillUrl(e.target.value)}
              placeholder="https://..."
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowSkillModal(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
