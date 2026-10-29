import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  School,
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle,
  Building2,
  Users,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const AcademicManagement: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'classes' | 'subjects' | 'allocations'>('departments');

  // Academic data
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classDeptId, setClassDeptId] = useState('');
  const [classSection, setClassSection] = useState('A');

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDeptId, setSubDeptId] = useState('');
  const [subCredits, setSubCredits] = useState('3');
  const [subDesc, setSubDesc] = useState('');

  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocTeacherId, setAllocTeacherId] = useState('');
  const [allocSubjectId, setAllocSubjectId] = useState('');
  const [allocClassId, setAllocClassId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/academic-data');
      setDepartments(res.departments || []);
      setClasses(res.classes || []);
      setSubjects(res.subjects || []);
      setAllocations(res.allocations || []);
      setTeachers(res.teachers || []);

      if (res.departments?.length > 0) {
        setClassDeptId(res.departments[0].id);
        setSubDeptId(res.departments[0].id);
      }
      if (res.teachers?.length > 0) {
        setAllocTeacherId(res.teachers[0].id);
      }
      if (res.subjects?.length > 0) {
        setAllocSubjectId(res.subjects[0].id);
      }
      if (res.classes?.length > 0) {
        setAllocClassId(res.classes[0].id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) {
      error('Department name and code are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/admin/departments', {
        name: deptName,
        code: deptCode,
        description: deptDesc,
      });
      success('Department created successfully');
      setShowDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      fetchAcademicData();
    } catch (err: any) {
      error(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !classDeptId) {
      error('Class name and department are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/admin/classes', {
        name: className,
        department_id: classDeptId,
        section: classSection,
      });
      success('Class created successfully');
      setShowClassModal(false);
      setClassName('');
      setClassSection('A');
      fetchAcademicData();
    } catch (err: any) {
      error(err.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subCode || !subDeptId) {
      error('Subject name, code, and department are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/admin/subjects', {
        name: subName,
        code: subCode,
        department_id: subDeptId,
        credits: Number(subCredits) || 3,
        description: subDesc,
      });
      success('Subject created successfully');
      setShowSubjectModal(false);
      setSubName('');
      setSubCode('');
      setSubCredits('3');
      setSubDesc('');
      fetchAcademicData();
    } catch (err: any) {
      error(err.message || 'Failed to create subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAlloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocTeacherId || !allocSubjectId || !allocClassId) {
      error('Teacher, subject, and class are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/admin/teacher-assignments', {
        teacher_id: allocTeacherId,
        subject_id: allocSubjectId,
        class_id: allocClassId,
      });
      success('Teacher allocation assigned successfully');
      setShowAllocModal(false);
      fetchAcademicData();
    } catch (err: any) {
      error(err.message || 'Failed to assign teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlloc = async (id: string) => {
    if (!confirm('Are you sure you want to remove this teacher assignment?')) return;
    try {
      await api.delete(`/admin/teacher-assignments/${id}`);
      success('Teacher allocation removed');
      fetchAcademicData();
    } catch (err: any) {
      error(err.message || 'Failed to delete allocation');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading academic structure..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Structure</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure departments, degree sections, curriculum subjects, and faculty course allocations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'departments' && (
            <button
              onClick={() => setShowDeptModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          )}
          {activeTab === 'classes' && (
            <button
              onClick={() => setShowClassModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          )}
          {activeTab === 'subjects' && (
            <button
              onClick={() => setShowSubjectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          )}
          {activeTab === 'allocations' && (
            <button
              onClick={() => setShowAllocModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Assign Teacher
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{departments.length}</div>
            <div className="text-xs text-slate-500 font-medium">Departments</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{classes.length}</div>
            <div className="text-xs text-slate-500 font-medium">Classes & Sections</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{subjects.length}</div>
            <div className="text-xs text-slate-500 font-medium">Subjects Active</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{allocations.length}</div>
            <div className="text-xs text-slate-500 font-medium">Faculty Allocations</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'departments', label: 'Departments', icon: Building2, count: departments.length },
            { id: 'classes', label: 'Classes & Sections', icon: School, count: classes.length },
            { id: 'subjects', label: 'Subjects', icon: BookOpen, count: subjects.length },
            { id: 'allocations', label: 'Faculty Course Allocations', icon: Users, count: allocations.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab: Departments */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Classes Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => {
                const count = classes.filter((c) => c.department_id === dept.id).length;
                return (
                  <tr key={dept.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{dept.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{dept.name}</td>
                    <td className="py-3 px-4 text-slate-500">{dept.description || '—'}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Classes */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Class / Batch</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4 text-right">Registered ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => {
                const dept = departments.find((d) => d.id === cls.department_id);
                return (
                  <tr key={cls.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{cls.name}</td>
                    <td className="py-3 px-4 text-slate-700">{dept?.name || cls.department_id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
                        Section {cls.section}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">{cls.id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Subjects */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Subject Title</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => {
                const dept = departments.find((d) => d.id === sub.department_id);
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{sub.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{sub.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{sub.credits} Credits</td>
                    <td className="py-3 px-4 text-slate-600">{dept?.name || 'Computer Science'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">{sub.description || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Allocations */}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{alloc.teacher_name}</div>
                    <div className="text-xs text-slate-500">{alloc.teacher_email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{alloc.subject_name}</div>
                    <div className="text-xs font-mono text-blue-600">{alloc.subject_code}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                      {alloc.class_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteAlloc(alloc.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                      title="Remove Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {allocations.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No teacher course allocations found. Click "Assign Teacher" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Department Modal */}
      <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add Department">
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mechanical Engineering"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Department Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MECH"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Overview of the department"
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDeptModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Class Modal */}
      <Modal isOpen={showClassModal} onClose={() => setShowClassModal(false)} title="Add Class / Section">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Class Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. CSE - 4th Year - Sec A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department *</label>
            <select
              value={classDeptId}
              onChange={(e) => setClassDeptId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Section</label>
            <input
              type="text"
              value={classSection}
              onChange={(e) => setClassSection(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowClassModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal isOpen={showSubjectModal} onClose={() => setShowSubjectModal(false)} title="Add Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. CS606"
              value={subCode}
              onChange={(e) => setSubCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Natural Language Processing"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={subDeptId}
                onChange={(e) => setSubDeptId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                value={subCredits}
                onChange={(e) => setSubCredits(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Course description"
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSubjectModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocation Modal */}
      <Modal isOpen={showAllocModal} onClose={() => setShowAllocModal(false)} title="Assign Teacher to Subject & Class">
        <form onSubmit={handleCreateAlloc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teacher *</label>
            <select
              value={allocTeacherId}
              onChange={(e) => setAllocTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.employee_id} - {t.designation})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject *</label>
            <select
              value={allocSubjectId}
              onChange={(e) => setAllocSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.credits} Credits)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Class / Section *</label>
            <select
              value={allocClassId}
              onChange={(e) => setAllocClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAllocModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Assign Allocation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
