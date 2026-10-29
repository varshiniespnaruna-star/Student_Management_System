import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { DashboardLayout } from './components/layout/DashboardLayout.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';
import { Role } from './types/index.js';

// Public Pages (4)
import { Login } from './pages/auth/Login.js';
import { Register } from './pages/auth/Register.js';
import { ForgotPassword } from './pages/auth/ForgotPassword.js';
import { ResetPassword } from './pages/auth/ResetPassword.js';

// Student Pages (8)
import { StudentDashboard } from './pages/student/StudentDashboard.js';
import { StudentProfile } from './pages/student/StudentProfile.js';
import { StudentAttendance } from './pages/student/StudentAttendance.js';
import { StudentAcademics } from './pages/student/StudentAcademics.js';
import { StudentAssignments } from './pages/student/StudentAssignments.js';
import { StudentTimetable } from './pages/student/StudentTimetable.js';
import { StudentNotifications } from './pages/student/StudentNotifications.js';
import { StudentStudyPlanner } from './pages/student/StudentStudyPlanner.js';

// Teacher Pages (8)
import { TeacherDashboard } from './pages/teacher/TeacherDashboard.js';
import { TeacherProfile } from './pages/teacher/TeacherProfile.js';
import { StudentDirectory } from './pages/teacher/StudentDirectory.js';
import { AttendanceManagement } from './pages/teacher/AttendanceManagement.js';
import { MarksManagement } from './pages/teacher/MarksManagement.js';
import { AssignmentManagement } from './pages/teacher/AssignmentManagement.js';
import { TeacherTimetable } from './pages/teacher/TeacherTimetable.js';
import { AnnouncementsReports } from './pages/teacher/AnnouncementsReports.js';

// Admin Pages (6)
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { UserManagement } from './pages/admin/UserManagement.js';
import { AcademicManagement } from './pages/admin/AcademicManagement.js';
import { TimetableManagement } from './pages/admin/TimetableManagement.js';
import { SystemSettings } from './pages/admin/SystemSettings.js';
import { AuditLogs } from './pages/admin/AuditLogs.js';

// 404
import { NotFound } from './pages/NotFound.js';

// Helper to get default path for a role
const getRoleHome = (role: Role | null): string => {
  if (role === 'teacher') return '/teacher/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/student/dashboard';
};

// Protected route guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Public only route guard (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <>{children}</>;
};

// Root index redirect
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner text="Initializing SSMS..." />
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Root */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Student Module (8 Routes) */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/academics"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAcademics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/timetable"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/study-planner"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentStudyPlanner />
                </ProtectedRoute>
              }
            />

            {/* Teacher Module (8 Routes) */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/profile"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <StudentDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <AttendanceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/marks"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <MarksManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <AssignmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/timetable"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/announcements"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <AnnouncementsReports />
                </ProtectedRoute>
              }
            />

            {/* Administrator Module (6 Routes) */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academic"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AcademicManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TimetableManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SystemSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
