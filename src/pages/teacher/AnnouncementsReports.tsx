import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  FileSpreadsheet,
  Download,
  Plus,
  Calendar,
  Archive,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';

export const AnnouncementsReports: React.FC = () => {
  const { success, error } = useToast();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'announcements' | 'reports'>('announcements');

  // Announcement modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<'students' | 'class'>('students');
  const [targetClassId, setTargetClassId] = useState('');
  const [category, setCategory] = useState<'academic' | 'event' | 'college'>('academic');

  // Report generator
  const [reportType, setReportType] = useState<'attendance' | 'marks' | 'assignments'>('attendance');
  const [reportData, setReportData] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/announcements');
      setAllocations(res.allocations || []);
      setAnnouncements(res.announcements || []);
      if (res.allocations && res.allocations.length > 0) {
        setTargetClassId(res.allocations[0].class_id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Title and message content are required.');
      return;
    }

    try {
      await api.post('/teachers/announcements', {
        title,
        content,
        target_role: targetRole,
        target_class_id: targetRole === 'class' ? targetClassId : undefined,
        category,
      });

      success('Announcement published to students!');
      setShowAnnModal(false);
      setTitle('');
      setContent('');
      fetchData();
    } catch (err: any) {
      error(err.message || 'Error publishing notice');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const res = await api.get(`/teachers/reports?type=${reportType}`);
      setReportData(res.report || []);
      success(`${reportType.toUpperCase()} report generated (${(res.report || []).length} rows)`);
    } catch (err: any) {
      error(err.message || 'Error generating report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportReportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const rows = [
      headers,
      ...reportData.map((row) => headers.map((h) => `"${row[h] || ''}"`)),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SSMS_${reportType}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading announcements & reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Announcements & Analytical Reports
          </h2>
          <p className="text-xs text-slate-500">
            Communicate class notices and generate institutional audit reports with CSV export
          </p>
        </div>

        {activeTab === 'announcements' && (
          <button
            onClick={() => setShowAnnModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Faculty Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportable Reports</span>
        </button>
      </div>

      {/* Tab 1: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No active announcements found.
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {ann.category.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      Target: {ann.target_role.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Author: {ann.author_name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Exportable Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Institutional Reports Generator</h3>
              <p className="text-xs text-slate-500">
                Filter and export comprehensive class performance records
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="attendance">Class Attendance Report</option>
                <option value="marks">Examination Marks Report</option>
                <option value="assignments">Assignment Completion Report</option>
              </select>

              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="py-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {generatingReport ? 'Generating...' : 'Run Query'}
              </button>
            </div>
          </div>

          {reportData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Generated {reportData.length} records
                </span>

                <button
                  onClick={handleExportReportCSV}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" /> Export CSV File
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      {Object.keys(reportData[0]).map((h) => (
                        <th key={h} className="py-2.5 px-4 capitalize">
                          {h.replace('_', ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        {Object.keys(reportData[0]).map((h) => (
                          <td key={h} className="py-2.5 px-4 text-slate-800">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Announcement Modal */}
      <Modal
        isOpen={showAnnModal}
        onClose={() => setShowAnnModal(false)}
        title="Publish Course Notice"
        description="Notify enrolled students regarding assignments, deadlines, or guest lectures"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab Project Demonstration Guidelines"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Content</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full announcement text..."
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="students">All Enrolled Students</option>
                <option value="class">Specific Class</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="academic">Academic</option>
                <option value="event">Event</option>
                <option value="college">College General</option>
              </select>
            </div>
          </div>

          {targetRole === 'class' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class</label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {Array.from(new Set(allocations.map((a) => a.class_id))).map((cid) => {
                  const alloc = allocations.find((a) => a.class_id === cid);
                  return (
                    <option key={cid} value={cid}>
                      {alloc?.class_name || cid}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAnnModal(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
