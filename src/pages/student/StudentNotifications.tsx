import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Notification, Announcement } from '../../types/index.js';

export const StudentNotifications: React.FC = () => {
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ notifications: Notification[]; announcements: Announcement[] }>(
        '/students/notifications'
      );
      setNotifications(res.notifications || []);
      setAnnouncements(res.announcements || []);
    } catch (err: any) {
      error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/students/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      success('Marked as read');
    } catch (err: any) {
      error(err.message || 'Error updating status');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/students/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('All notifications marked as read');
    } catch (err: any) {
      error(err.message || 'Error updating status');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading notifications & announcements..." />;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filterRead === 'unread') return !n.is_read;
    if (filterRead === 'read') return n.is_read;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Announcements & Alerts
          </h2>
          <p className="text-xs text-slate-500">
            Institutional notices, class announcements, and personal academic alerts
          </p>
        </div>

        {activeTab === 'notifications' && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>My Alerts</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>College Announcements ({announcements.length})</span>
        </button>
      </div>

      {/* Tab 1: Personal Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Showing {filteredNotifs.length} notifications</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as any)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only ({unreadCount})</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {filteredNotifs.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                No notifications found.
              </div>
            ) : (
              filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    !n.is_read ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs mt-0.5 shrink-0">
                      {n.type === 'attendance' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : n.type === 'marks' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : n.type === 'assignment' ? (
                        <FileText className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-purple-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: College Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {ann.category.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    Audience: {ann.target_role.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">{ann.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Published by: <strong>{ann.author_name}</strong> ({ann.author_role})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
