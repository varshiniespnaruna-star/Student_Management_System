import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

export const studentsRouter = Router();

// Middleware: Student access only
studentsRouter.use(requireAuth);
studentsRouter.use(requireRole('student', 'admin'));

// Helper to get active student profile
function getStudentContext(req: Request): { profileId: string; classId: string; userId: string } | null {
  const profile = db.getStudentProfileByUserId(req.user!.id);
  if (!profile) return null;
  return {
    profileId: profile.id,
    classId: profile.class_id,
    userId: req.user!.id,
  };
}

// 1. GET /api/v1/students/overview
studentsRouter.get('/overview', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found for current user.' });
    return;
  }

  const profile = db.getStudentProfileById(ctx.profileId);
  const attendanceStats = db.getStudentAttendanceStats(ctx.profileId);
  const academics = db.getStudentAcademicPerformance(ctx.profileId);
  const assignments = db.getAssignments({ class_id: ctx.classId });
  const submissions = db.getStudentSubmissions(ctx.profileId);

  // Calculate pending assignments
  const submittedAssignmentIds = new Set(submissions.map((s) => s.assignment_id));
  const pendingAssignments = assignments.filter((a) => !submittedAssignmentIds.has(a.id));

  // Today's timetable
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const todayName = days[new Date().getDay()] || 'Monday';
  const allTimetable = db.getTimetable({ class_id: ctx.classId });
  const todayTimetable = allTimetable
    .filter((t) => t.day_of_week === (todayName === 'Sunday' || todayName === 'Saturday' ? 'Monday' : todayName))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Recent announcements (targeted)
  const announcements = db.getAnnouncements('student', ctx.classId).slice(0, 4);

  // Recent activity
  const recentActivity = [
    ...submissions.slice(0, 3).map((s) => ({
      type: 'submission',
      title: `Submitted assignment (${s.file_name})`,
      date: s.submitted_at,
      status: s.status,
    })),
    ...attendanceStats.history.slice(0, 3).map((h) => ({
      type: 'attendance',
      title: `Class attendance: ${h.subject_name}`,
      date: h.date,
      status: h.status,
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  res.json({
    student: {
      id: profile?.id,
      full_name: profile?.full_name,
      register_number: profile?.register_number,
      class_name: profile?.class_name,
      department_name: profile?.department_name,
      semester: profile?.semester,
    },
    metrics: {
      attendance_percentage: attendanceStats.overall.percentage,
      is_low_attendance: attendanceStats.overall.is_low_attendance,
      attendance_threshold: attendanceStats.overall.threshold,
      current_gpa: academics.current_gpa,
      total_credits: academics.total_credits,
      pending_assignments_count: pendingAssignments.length,
      upcoming_exams_count: academics.detailed_marks.filter((m) => m.assessment_type === 'exam').length,
    },
    today_timetable: todayTimetable,
    attendance_trend: attendanceStats.trend,
    subject_performance: academics.subject_breakdown,
    upcoming_deadlines: pendingAssignments.slice(0, 3),
    recent_announcements: announcements,
    recent_activity: recentActivity,
  });
});

// 2. GET /api/v1/students/profile
studentsRouter.get('/profile', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }
  const profile = db.getStudentProfileById(ctx.profileId);
  res.json({ profile });
});

// 3. PUT /api/v1/students/profile
studentsRouter.put('/profile', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  // Ensure security: Students cannot change academic fields
  const forbidden = ['register_number', 'department_id', 'class_id', 'semester', 'enrollment_year', 'role', 'id', 'user_id'];
  for (const key of forbidden) {
    if (key in req.body && req.body[key] !== undefined) {
      delete req.body[key];
    }
  }

  const { phone, emergency_contact, address, date_of_birth, blood_group } = req.body;
  if (phone) {
    db.updateUser(ctx.userId, { phone });
  }

  const updated = db.updateStudentProfile(ctx.profileId, {
    emergency_contact,
    address,
    date_of_birth,
    blood_group,
  });

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'STUDENT_PROFILE_UPDATE',
    entity_type: 'STUDENT_PROFILE',
    entity_id: ctx.profileId,
    details: 'Student updated personal contact information',
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    message: 'Profile updated successfully',
    profile: updated,
  });
});

// 4. GET /api/v1/students/attendance
studentsRouter.get('/attendance', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }
  const stats = db.getStudentAttendanceStats(ctx.profileId);
  res.json(stats);
});

// 5. GET /api/v1/students/academics
studentsRouter.get('/academics', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }
  const academics = db.getStudentAcademicPerformance(ctx.profileId);
  res.json(academics);
});

// 6. GET /api/v1/students/assignments
studentsRouter.get('/assignments', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const assignments = db.getAssignments({ class_id: ctx.classId });
  const submissions = db.getStudentSubmissions(ctx.profileId);
  const subMap = new Map(submissions.map((s) => [s.assignment_id, s]));

  const enriched = assignments.map((a) => {
    const sub = subMap.get(a.id);
    const today = new Date().toISOString().slice(0, 10);
    const isPastDue = today > a.due_date;
    let computedStatus: 'pending' | 'submitted' | 'late' | 'evaluated' | 'overdue' = 'pending';

    if (sub) {
      computedStatus = sub.status;
    } else if (isPastDue) {
      computedStatus = 'overdue';
    }

    return {
      ...a,
      submission: sub || null,
      status: computedStatus,
    };
  });

  res.json({ assignments: enriched });
});

// 7. POST /api/v1/students/assignments/:id/submit
studentsRouter.post('/assignments/:id/submit', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const assignmentId = req.params.id;
  const assignment = db.getAssignments({}).find((a) => a.id === assignmentId);
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found.' });
    return;
  }

  if (assignment.class_id !== ctx.classId) {
    res.status(403).json({ error: 'You are not enrolled in the class for this assignment.' });
    return;
  }

  const { fileName, filePath } = req.body;
  if (!fileName) {
    res.status(400).json({ error: 'File name or submission content is required.' });
    return;
  }

  const submission = db.submitAssignment(
    assignmentId,
    ctx.profileId,
    fileName,
    filePath || `/uploads/${fileName}`
  );

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'ASSIGNMENT_SUBMITTED',
    entity_type: 'ASSIGNMENT',
    entity_id: assignmentId,
    details: `Submitted file: ${fileName}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    message: 'Assignment submitted successfully',
    submission,
  });
});

// 8. GET /api/v1/students/timetable
studentsRouter.get('/timetable', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }
  const timetable = db.getTimetable({ class_id: ctx.classId });
  res.json({ timetable });
});

// 9. GET /api/v1/students/notifications
studentsRouter.get('/notifications', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const notifications = db.getNotifications(ctx.userId);
  const announcements = db.getAnnouncements('student', ctx.classId);

  res.json({
    notifications,
    announcements,
    unread_count: notifications.filter((n) => !n.is_read).length,
  });
});

// 10. POST /api/v1/students/notifications/:id/read
studentsRouter.post('/notifications/:id/read', (req: Request, res: Response): void => {
  const success = db.markNotificationAsRead(req.params.id, req.user!.id);
  if (!success) {
    res.status(404).json({ error: 'Notification not found or access denied.' });
    return;
  }
  res.json({ message: 'Notification marked as read.' });
});

// 11. POST /api/v1/students/notifications/read-all
studentsRouter.post('/notifications/read-all', (req: Request, res: Response): void => {
  const count = db.markAllNotificationsAsRead(req.user!.id);
  res.json({ message: `Marked ${count} notifications as read.` });
});

// 12. GET /api/v1/students/study-planner
studentsRouter.get('/study-planner', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const tasks = db.getStudyTasks(ctx.profileId);
  const skills = db.getSkills(ctx.profileId);
  const subjects = db.getSubjects();

  res.json({
    tasks,
    skills,
    subjects,
  });
});

// 13. POST /api/v1/students/study-planner/tasks
studentsRouter.post('/study-planner/tasks', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const { title, description, subject_id, priority, due_date } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Task title is required.' });
    return;
  }

  const task = db.createStudyTask({
    student_id: ctx.profileId,
    title,
    description,
    subject_id,
    priority: priority || 'medium',
    due_date,
    is_completed: false,
  });

  res.status(201).json({ message: 'Study task created', task });
});

// 14. PUT /api/v1/students/study-planner/tasks/:id
studentsRouter.put('/study-planner/tasks/:id', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const updated = db.updateStudyTask(req.params.id, ctx.profileId, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Task not found or access denied.' });
    return;
  }
  res.json({ message: 'Task updated', task: updated });
});

// 15. DELETE /api/v1/students/study-planner/tasks/:id
studentsRouter.delete('/study-planner/tasks/:id', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const ok = db.deleteStudyTask(req.params.id, ctx.profileId);
  if (!ok) {
    res.status(404).json({ error: 'Task not found or access denied.' });
    return;
  }
  res.json({ message: 'Task deleted successfully' });
});

// 16. POST /api/v1/students/study-planner/skills
studentsRouter.post('/study-planner/skills', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const { title, category, organization, issue_date, credential_url, status } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required.' });
    return;
  }

  const skill = db.createSkill({
    student_id: ctx.profileId,
    title,
    category: category || 'skill',
    organization,
    issue_date,
    credential_url,
    status: status || 'completed',
  });

  res.status(201).json({ message: 'Skill/Certification recorded', skill });
});

// 17. DELETE /api/v1/students/study-planner/skills/:id
studentsRouter.delete('/study-planner/skills/:id', (req: Request, res: Response): void => {
  const ctx = getStudentContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Student profile not found.' });
    return;
  }

  const ok = db.deleteSkill(req.params.id, ctx.profileId);
  if (!ok) {
    res.status(404).json({ error: 'Skill record not found.' });
    return;
  }
  res.json({ message: 'Skill record deleted' });
});
