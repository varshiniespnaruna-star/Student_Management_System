import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../common/Badge.js';
import { api } from '../../services/api.js';
import { Notification } from '../../types/index.js';

interface NavbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, title }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.get<{ notifications: Notification[]; unread_count: number }>(
          user.role === 'student' ? '/students/notifications' : '/admin/overview'
        );
        if (res.notifications) {
          setNotifications(res.notifications);
          setUnreadCount(res.unread_count || 0);
        }
      } catch {
        // fallback
      }
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 30000);
    return () => clearInterval(timer);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await api.post(`/students/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        navigate(link);
        setShowNotifications(false);
      }
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (role === 'teacher') {
      navigate(`/teacher/students?search=${encodeURIComponent(searchQuery)}`);
    } else if (role === 'admin') {
      navigate(`/admin/users?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/student/assignments?search=${encodeURIComponent(searchQuery)}`);
    }
    setSearchQuery('');
  };

  // Generate breadcrumb parts from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const roleName = role ? role.toUpperCase() : 'PORTAL';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title & Breadcrumbs */}
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>SSMS</span>
            <span>/</span>
            <span className="capitalize">{pathParts[0] || 'Dashboard'}</span>
            {pathParts[1] && (
              <>
                <span>/</span>
                <span className="text-slate-600 capitalize">
                  {pathParts[1].replace('-', ' ')}
                </span>
              </>
            )}
          </div>
          <h1 className="text-sm font-semibold text-slate-800 leading-tight">
            {title || (pathParts[1] ? pathParts[1].replace('-', ' ') : 'Dashboard')}
          </h1>
        </div>
      </div>

      {/* Center: Search input */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center relative max-w-xs w-full mx-4"
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder={
            role === 'teacher'
              ? 'Search students, classes...'
              : role === 'admin'
              ? 'Search users, subjects...'
              : 'Search courses, assignments...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
        />
      </form>

      {/* Right: Notifications, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <Badge variant="primary" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {role === 'student' && (
                  <button
                    onClick={() => {
                      navigate('/student/notifications');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    View all <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No recent notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.link)}
                      className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            n.is_read ? 'text-slate-300' : 'text-blue-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs">
              {user?.full_name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.full_name || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium capitalize">
                {roleName}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{user?.full_name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <Badge
                    variant={
                      role === 'admin' ? 'purple' : role === 'teacher' ? 'primary' : 'success'
                    }
                    size="sm"
                  >
                    {roleName}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                {role === 'student' && (
                  <button
                    onClick={() => {
                      navigate('/student/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" /> My Profile
                  </button>
                )}
                {role === 'teacher' && (
                  <button
                    onClick={() => {
                      navigate('/teacher/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" /> Teacher Profile
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
