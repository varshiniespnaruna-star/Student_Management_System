import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  CalendarCheck,
  GraduationCap,
  FileText,
  Clock,
  BellRing,
  BookOpenCheck,
  Users,
  FileCheck,
  Megaphone,
  ShieldCheck,
  UsersRound,
  Building2,
  CalendarRange,
  Sliders,
  ShieldAlert,
  LogOut,
  X,
  School,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Role } from '../../types/index.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed = false }) => {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();

  // Student Nav Items (exactly 8 pages as specified)
  const studentNav: NavItem[] = [
    { label: 'Overview', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/student/profile', icon: UserCheck },
    { label: 'My Attendance', path: '/student/attendance', icon: CalendarCheck },
    { label: 'Academics & Marks', path: '/student/academics', icon: GraduationCap },
    { label: 'My Assignments', path: '/student/assignments', icon: FileText },
    { label: 'My Timetable', path: '/student/timetable', icon: Clock },
    { label: 'Announcements', path: '/student/notifications', icon: BellRing },
    { label: 'Study Planner & Skills', path: '/student/study-planner', icon: BookOpenCheck },
  ];

  // Teacher Nav Items (exactly 8 pages as specified)
  const teacherNav: NavItem[] = [
    { label: 'Overview', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Teacher Profile', path: '/teacher/profile', icon: UserCheck },
    { label: 'Student Directory', path: '/teacher/students', icon: Users },
    { label: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { label: 'Marks Management', path: '/teacher/marks', icon: GraduationCap },
    { label: 'Assignment Portal', path: '/teacher/assignments', icon: FileCheck },
    { label: 'Timetable & Schedule', path: '/teacher/timetable', icon: Clock },
    { label: 'Announcements & Reports', path: '/teacher/announcements', icon: Megaphone },
  ];

  // Admin Nav Items
  const adminNav: NavItem[] = [
    { label: 'Overview', path: '/admin/dashboard', icon: ShieldCheck },
    { label: 'User Accounts', path: '/admin/users', icon: UsersRound },
    { label: 'Academic Structure', path: '/admin/academic', icon: Building2 },
    { label: 'Timetable Master', path: '/admin/timetable', icon: CalendarRange },
    { label: 'System Settings', path: '/admin/settings', icon: Sliders },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
  ];

  let currentNav: NavItem[] = [];
  let roleTitle = 'Student Portal';

  if (role === 'teacher') {
    currentNav = teacherNav;
    roleTitle = 'Faculty Portal';
  } else if (role === 'admin') {
    currentNav = adminNav;
    roleTitle = 'Administration';
  } else {
    currentNav = studentNav;
    roleTitle = 'Student Portal';
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 md:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <School className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 tracking-tight">SSMS</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                  {roleTitle}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Menu
            </p>
          )}

          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0`} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom user badge & logout */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
