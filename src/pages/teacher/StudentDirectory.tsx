import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Phone, Mail, GraduationCap, CalendarCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const StudentDirectory: React.FC = () => {
  const { error } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Student Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    fetchDirectory();
  }, [selectedClass]);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      let url = '/teachers/students?';
      if (selectedClass !== 'all') {
        url += `class_id=${encodeURIComponent(selectedClass)}&`;
      }
      const res = await api.get(url);
      setStudents(res.students || []);
      setClasses(res.classes || []);
    } catch (err: any) {
      error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      s.register_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory</h2>
          <p className="text-xs text-slate-500">
            Enrolled student roster across your assigned classes and academic performance summaries
          </p>
        </div>

        {/* Search & Class Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name or reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-xs">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Assigned Classes</option>
              {Array.from(new Set(classes.map((c: any) => c.class_id))).map((cid) => {
                const cls = classes.find((c: any) => c.class_id === cid);
                return (
                  <option key={cid} value={cid}>
                    {cls?.class_name || cid}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Enrolled Students ({filtered.length})
          </span>
        </div>

        {loading ? (
          <LoadingSpinner message="Filtering directory..." />
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No enrolled students match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Academic GPA</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                          {s.full_name?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.full_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{s.register_number}</td>
                    <td className="py-3 px-4 text-slate-700">{s.class_name}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={s.is_low_attendance ? 'danger' : 'success'} size="sm">
                        {s.attendance_percentage}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {s.current_gpa || '3.80'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Student Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Dossier Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.full_name || 'Student Profile'}
        description={`Registration: ${selectedStudent?.register_number} • ${selectedStudent?.class_name}`}
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-400 font-medium">Attendance Standing</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedStudent.attendance_percentage}%
                </p>
                <span className={selectedStudent.is_low_attendance ? 'text-rose-600' : 'text-emerald-600'}>
                  {selectedStudent.is_low_attendance ? 'Needs improvement (<75%)' : 'Good standing'}
                </span>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Cumulative GPA</p>
                <p className="text-sm font-bold text-blue-700 mt-0.5">
                  {selectedStudent.current_gpa} / 4.00
                </p>
                <span className="text-slate-500">First Class</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedStudent.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedStudent.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedStudent.department_name} (Semester {selectedStudent.semester})</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
