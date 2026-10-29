import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  Download,
  Printer,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { StudentAcademicsData } from '../../types/index.js';

export const StudentAcademics: React.FC = () => {
  const [data, setData] = useState<StudentAcademicsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcademics();
  }, []);

  const fetchAcademics = async () => {
    try {
      setLoading(true);
      const res = await api.get<StudentAcademicsData>('/students/academics');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!data) return;
    const rows = [
      ['Smart Student Management System - Official Academic Transcript'],
      ['Generated On', new Date().toLocaleDateString()],
      ['Current GPA', data.current_gpa.toString()],
      ['Total Credits', data.total_credits.toString()],
      [],
      ['Subject Code', 'Subject Name', 'Credits', 'Obtained Marks', 'Max Marks', 'Percentage', 'Grade', 'Grade Points'],
      ...data.subject_breakdown.map((s) => [
        s.subject_code,
        s.subject_name,
        s.credits.toString(),
        s.total_obtained.toString(),
        s.total_max.toString(),
        `${s.percentage}%`,
        s.grade,
        s.gpa_point.toString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SSMS_Academic_Transcript.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return <LoadingSpinner fullScreen message="Loading academic performance records..." />;
  }

  const { current_gpa, total_credits, subject_breakdown, detailed_marks, semester_history } = data;

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Academic Performance</h2>
          <p className="text-xs text-slate-500">
            Assessment scores, grade calculation, and transcript progression
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" /> Export CSV Report
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Transcript
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Current Semester GPA"
          value={current_gpa}
          subtitle="4.00 Grade Point Scale"
          icon={<GraduationCap className="w-5 h-5" />}
          highlight
          trend={{ value: 'First Class with Distinction', isPositive: true }}
        />

        <StatCard
          title="Earned Credits"
          value={total_credits}
          subtitle="Current semester registration"
          icon={<Award className="w-5 h-5 text-amber-500" />}
          trend={{ value: 'Full load', isPositive: true }}
        />

        <StatCard
          title="Completed Assessments"
          value={detailed_marks.length}
          subtitle="Tests & evaluations recorded"
          icon={<FileSpreadsheet className="w-5 h-5 text-blue-500" />}
          trend={{ value: '100% evaluated', isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Semester GPA Trajectory */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Semester GPA Trajectory</h3>
              <p className="text-xs text-slate-400">Progression from Semester 1 through Current</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={semester_history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="semester" tickFormatter={(s) => `Sem ${s}`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[3.0, 4.0]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(val: any) => [val, 'GPA']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="gpa" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-Wise Performance Comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Curriculum Score Percentage</h3>
              <p className="text-xs text-slate-400">Subject weighted achievement</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subject_breakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subject_code" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subject Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Subject Performance & Grade Breakdown</h3>
          <p className="text-xs text-slate-400">Official semester grade point calculation</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4 text-center">Credits</th>
                <th className="py-3 px-4 text-center">Marks Obtained</th>
                <th className="py-3 px-4 text-center">Max Marks</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Grade Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {subject_breakdown.map((s) => (
                <tr key={s.subject_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.subject_name}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{s.subject_code}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700">{s.credits}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">{s.total_obtained}</td>
                  <td className="py-3.5 px-4 text-center text-slate-500">{s.total_max}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-700">{s.percentage}%</td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={s.grade.startsWith('A') ? 'success' : 'primary'} size="sm">
                      {s.grade}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">{s.gpa_point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Assessment Marks Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Individual Assessment Scores & Feedback</h3>
          <p className="text-xs text-slate-400">Continuous internal assessments and midterm results</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Assessment Title</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Teacher Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {detailed_marks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">{m.assessment_title}</td>
                  <td className="py-3 px-4 text-slate-600">{m.subject_name}</td>
                  <td className="py-3 px-4 text-slate-500 capitalize">{m.assessment_type.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{m.date}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-700">
                    {m.marks_obtained} / {m.max_marks} ({m.percentage}%)
                  </td>
                  <td className="py-3 px-4 text-slate-600 italic">
                    {m.feedback || '—'}
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
