import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

export const adminRouter = Router();

// Middleware: Admin only
adminRouter.use(requireAuth);
adminRouter.use(requireRole('admin'));

// 1. GET /api/v1/admin/overview
adminRouter.get('/overview', (req: Request, res: Response): void => {
  const raw = db.getRawState();

  const totalStudents = raw.studentProfiles.length;
  const totalTeachers = raw.teacherProfiles.length;
  const totalClasses = raw.classes.length;
  const totalDepartments = raw.departments.length;
  const totalSubjects = raw.subjects.length;
  const totalAssignments = raw.assignments.length;

  // Calculate average attendance across institution
  const totalAttendanceRecords = raw.attendanceRecords.length;
  const totalAttended = raw.attendanceRecords.filter((r) => r.status === 'present').length;
  const avgAttendance = totalAttendanceRecords > 0
    ? Number(((totalAttended / totalAttendanceRecords) * 100).toFixed(1))
    : 0;

  // Active users count
  const activeUsers = raw.users.filter((u) => u.status === 'active').length;

  res.json({
    metrics: {
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_classes: totalClasses,
      total_departments: totalDepartments,
      total_subjects: totalSubjects,
      total_assignments: totalAssignments,
      average_attendance: avgAttendance,
      active_users: activeUsers,
    },
    system_settings: raw.systemSettings,
    recent_logs: raw.auditLogs.slice(0, 10),
  });
});

// 2. User Management
// GET /api/v1/admin/users
adminRouter.get('/users', (req: Request, res: Response): void => {
  const { role, status, search } = req.query;
  const raw = db.getRawState();

  let list = raw.users.map((u) => {
    let details: any = {};
    if (u.role === 'student') {
      const sp = db.getStudentProfileByUserId(u.id);
      details = {
        register_number: sp?.register_number,
        class_name: sp?.class_name,
        department_name: sp?.department_name,
        semester: sp?.semester,
      };
    } else if (u.role === 'teacher') {
      const tp = db.getTeacherProfileByUserId(u.id);
      details = {
        employee_id: tp?.employee_id,
        designation: tp?.designation,
        department_name: tp?.department_name,
        office_room: tp?.office_room,
      };
    }
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      phone: u.phone,
      status: u.status,
      created_at: u.created_at,
      details,
    };
  });

  if (role && typeof role === 'string') {
    list = list.filter((u) => u.role === role);
  }
  if (status && typeof status === 'string') {
    list = list.filter((u) => u.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.details?.register_number && u.details.register_number.toLowerCase().includes(q)) ||
        (u.details?.employee_id && u.details.employee_id.toLowerCase().includes(q))
    );
  }

  res.json({ users: list });
});

// POST /api/v1/admin/users (Create Student, Teacher, or Admin)
adminRouter.post('/users', (req: Request, res: Response): void => {
  const { email, password, role, full_name, phone, studentData, teacherData } = req.body;

  if (!email || !password || !role || !full_name) {
    res.status(400).json({ error: 'Email, password, role, and full name are required.' });
    return;
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'A user with this email address already exists.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const newUser = db.createUser({
    email,
    password_hash,
    role,
    full_name,
    phone,
    status: 'active',
  });

  if (role === 'student' && studentData) {
    db.createStudentProfile({
      user_id: newUser.id,
      register_number: studentData.register_number || `REG-${Date.now().toString().slice(-4)}`,
      department_id: studentData.department_id || 'dept-1',
      class_id: studentData.class_id || 'cls-csea-6',
      semester: Number(studentData.semester) || 1,
      enrollment_year: Number(studentData.enrollment_year) || 2026,
      emergency_contact: studentData.emergency_contact || '+1 (555) 000-0000',
      address: studentData.address,
      date_of_birth: studentData.date_of_birth,
      blood_group: studentData.blood_group,
    });
  } else if (role === 'teacher' && teacherData) {
    const raw = db.getRawState();
    raw.teacherProfiles.push({
      id: `tp-${Date.now()}`,
      user_id: newUser.id,
      employee_id: teacherData.employee_id || `EMP-${Date.now().toString().slice(-3)}`,
      department_id: teacherData.department_id || 'dept-1',
      designation: teacherData.designation || 'Assistant Professor',
      qualification: teacherData.qualification || 'M.S. / Ph.D.',
      experience_years: Number(teacherData.experience_years) || 0,
      office_room: teacherData.office_room || 'Academic Block 1',
    });
    db.saveState();
  }

  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'USER_CREATED',
    entity_type: 'USER',
    entity_id: newUser.id,
    details: `Admin created ${role} user: ${email}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({ message: 'User created successfully', user: newUser });
});

// PUT /api/v1/admin/users/:id/status (Activate / Deactivate)
adminRouter.put('/users/:id/status', (req: Request, res: Response): void => {
  const { status } = req.body;
  if (status !== 'active' && status !== 'inactive') {
    res.status(400).json({ error: 'Status must be active or inactive.' });
    return;
  }

  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    return;
  }

  const updated = db.updateUser(req.params.id, { status });
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'USER_STATUS_CHANGE',
    entity_type: 'USER',
    entity_id: req.params.id,
    details: `Updated user status to ${status}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: `User status updated to ${status}.`, user: updated });
});

// POST /api/v1/admin/users/:id/reset-password
adminRouter.post('/users/:id/reset-password', (req: Request, res: Response): void => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const user = db.findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(user.id, { password_hash });

  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'ADMIN_PASSWORD_RESET',
    entity_type: 'USER',
    entity_id: user.id,
    details: `Admin changed password for ${user.email}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: `Password for ${user.email} updated successfully.` });
});

// 3. Academic Structure Management (Departments, Semesters, Classes, Subjects)
adminRouter.get('/academic-data', (req: Request, res: Response): void => {
  const departments = db.getDepartments();
  const semesters = db.getSemesters();
  const classes = db.getClasses();
  const subjects = db.getSubjects();
  const allocations = db.getTeacherAssignments();
  const raw = db.getRawState();
  const teachers = raw.teacherProfiles.map((tp) => db.getTeacherProfileById(tp.id));

  res.json({
    departments,
    semesters,
    classes,
    subjects,
    allocations,
    teachers,
  });
});

// POST /api/v1/admin/departments
adminRouter.post('/departments', (req: Request, res: Response): void => {
  const { name, code, description } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: 'Department name and code are required.' });
    return;
  }
  const raw = db.getRawState();
  const dept = {
    id: `dept-${Date.now()}`,
    name,
    code: code.toUpperCase(),
    description,
  };
  raw.departments.push(dept);
  db.saveState();
  res.status(201).json({ message: 'Department created', department: dept });
});

// POST /api/v1/admin/classes
adminRouter.post('/classes', (req: Request, res: Response): void => {
  const { name, department_id, semester_id, section } = req.body;
  if (!name || !department_id) {
    res.status(400).json({ error: 'Class name and department are required.' });
    return;
  }
  const raw = db.getRawState();
  const newClass = {
    id: `cls-${Date.now()}`,
    name,
    department_id,
    semester_id: semester_id || 'sem-2026-fall',
    section: section || 'A',
  };
  raw.classes.push(newClass);
  db.saveState();
  res.status(201).json({ message: 'Class created', class: newClass });
});

// POST /api/v1/admin/subjects
adminRouter.post('/subjects', (req: Request, res: Response): void => {
  const { name, code, department_id, credits, description } = req.body;
  if (!name || !code || !department_id) {
    res.status(400).json({ error: 'Subject name, code, and department are required.' });
    return;
  }
  const raw = db.getRawState();
  const subject = {
    id: `sub-${Date.now()}`,
    name,
    code: code.toUpperCase(),
    department_id,
    credits: Number(credits) || 3,
    description,
  };
  raw.subjects.push(subject);
  db.saveState();
  res.status(201).json({ message: 'Subject created', subject });
});

// POST & DELETE /api/v1/admin/teacher-assignments
adminRouter.post('/teacher-assignments', (req: Request, res: Response): void => {
  const { teacher_id, subject_id, class_id } = req.body;
  if (!teacher_id || !subject_id || !class_id) {
    res.status(400).json({ error: 'Teacher, Subject, and Class must be selected.' });
    return;
  }

  const allocation = db.assignTeacher(teacher_id, subject_id, class_id);
  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'TEACHER_ALLOCATION',
    entity_type: 'TEACHER_ASSIGNMENT',
    entity_id: allocation.id,
    details: `Assigned teacher ${teacher_id} to subject ${subject_id} in class ${class_id}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({ message: 'Teacher allocation saved', allocation });
});

adminRouter.delete('/teacher-assignments/:id', (req: Request, res: Response): void => {
  const ok = db.removeTeacherAssignment(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'Allocation not found.' });
    return;
  }
  res.json({ message: 'Allocation removed successfully.' });
});

// 4. Timetable Management (with conflict detection)
adminRouter.get('/timetable', (req: Request, res: Response): void => {
  const { class_id, teacher_id } = req.query;
  const entries = db.getTimetable({
    class_id: typeof class_id === 'string' ? class_id : undefined,
    teacher_id: typeof teacher_id === 'string' ? teacher_id : undefined,
  });
  res.json({ timetable: entries });
});

adminRouter.post('/timetable', (req: Request, res: Response): void => {
  const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;
  if (!class_id || !subject_id || !teacher_id || !day_of_week || !start_time || !end_time || !room) {
    res.status(400).json({ error: 'All timetable slot fields are required.' });
    return;
  }

  if (start_time >= end_time) {
    res.status(400).json({ error: 'Start time must be strictly earlier than end time.' });
    return;
  }

  const result = db.addTimetableEntry({
    class_id,
    subject_id,
    teacher_id,
    day_of_week,
    start_time,
    end_time,
    room,
  });

  if (result.error) {
    res.status(409).json({ error: `Timetable conflict: ${result.error}` });
    return;
  }

  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'TIMETABLE_ENTRY_CREATED',
    entity_type: 'TIMETABLE',
    entity_id: result.entry?.id,
    details: `Added ${day_of_week} ${start_time}-${end_time} in ${room}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({ message: 'Timetable entry added successfully', entry: result.entry });
});

adminRouter.delete('/timetable/:id', (req: Request, res: Response): void => {
  const ok = db.deleteTimetableEntry(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'Timetable entry not found.' });
    return;
  }
  res.json({ message: 'Timetable entry deleted successfully.' });
});

// 5. System Settings
adminRouter.get('/settings', (req: Request, res: Response): void => {
  res.json({ settings: db.getSettings() });
});

adminRouter.put('/settings', (req: Request, res: Response): void => {
  const { attendance_warning_threshold, system_name, academic_year, allow_student_profile_edit, grading_rules } = req.body;

  if (attendance_warning_threshold !== undefined) {
    const val = Number(attendance_warning_threshold);
    if (isNaN(val) || val < 0 || val > 100) {
      res.status(400).json({ error: 'Attendance threshold must be a percentage between 0 and 100.' });
      return;
    }
  }

  const updated = db.updateSettings({
    ...(attendance_warning_threshold !== undefined && { attendance_warning_threshold: Number(attendance_warning_threshold) }),
    ...(system_name !== undefined && { system_name }),
    ...(academic_year !== undefined && { academic_year }),
    ...(allow_student_profile_edit !== undefined && { allow_student_profile_edit: Boolean(allow_student_profile_edit) }),
    ...(grading_rules !== undefined && { grading_rules }),
  });

  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'SETTINGS_UPDATE',
    entity_type: 'SETTINGS',
    details: 'Admin updated system configuration',
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: 'System settings updated successfully', settings: updated });
});

// 6. Audit Logs
adminRouter.get('/audit-logs', (req: Request, res: Response): void => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json({ logs: db.getAuditLogs(limit) });
});

// 7. Seed / Reset Demo Database
adminRouter.post('/reset-demo-data', (req: Request, res: Response): void => {
  db.resetToDefault();
  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'DATABASE_RESET',
    entity_type: 'SYSTEM',
    details: 'Admin reset database to full default sample state',
    ip_address: req.ip || '127.0.0.1',
  });
  res.json({ message: 'Database reset to default seed data successfully.' });
});
