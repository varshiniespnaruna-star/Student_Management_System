import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

export const teachersRouter = Router();

// Middleware: Teacher or Admin access
teachersRouter.use(requireAuth);
teachersRouter.use(requireRole('teacher', 'admin'));

function getTeacherContext(req: Request): { profileId: string; userId: string } | null {
  const profile = db.getTeacherProfileByUserId(req.user!.id);
  if (!profile) return null;
  return {
    profileId: profile.id,
    userId: req.user!.id,
  };
}

// 1. GET /api/v1/teachers/overview
teachersRouter.get('/overview', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const profile = db.getTeacherProfileById(ctx.profileId);
  const assignments = db.getTeacherAssignments(ctx.profileId);
  const classIds = Array.from(new Set(assignments.map((a) => a.class_id)));
  const subjectIds = Array.from(new Set(assignments.map((a) => a.subject_id)));

  // Total students taught in teacher's classes
  const rawState = db.getRawState();
  const enrolledStudents = rawState.studentProfiles.filter((s) => classIds.includes(s.class_id));

  // Today's timetable
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const todayName = days[new Date().getDay()] || 'Monday';
  const dayToQuery = todayName === 'Sunday' || todayName === 'Saturday' ? 'Monday' : todayName;
  const teacherTimetable = db.getTimetable({ teacher_id: ctx.profileId });
  const todayClasses = teacherTimetable
    .filter((t) => t.day_of_week === dayToQuery)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Pending evaluations
  const teacherAssignmentsList = db.getAssignments({ teacher_id: ctx.profileId });
  let pendingSubmissionsCount = 0;
  teacherAssignmentsList.forEach((asg) => {
    const subs = db.getSubmissions(asg.id);
    pendingSubmissionsCount += subs.filter((s) => s.status === 'submitted' || s.status === 'late').length;
  });

  // Recent announcements
  const announcements = db.getAnnouncements('teacher').slice(0, 4);

  // Attendance completion summary
  const todayDate = new Date().toISOString().slice(0, 10);
  const todaySessions = db.getAttendanceSessions({ teacher_id: ctx.profileId, date: todayDate });
  const scheduledTodayCount = todayClasses.length;

  // Subject performance summary for charts
  const teacherAssessments = rawState.assessments.filter((a) => a.teacher_id === ctx.profileId);
  const perfData = teacherAssessments.slice(0, 5).map((asm) => {
    const marks = rawState.marks.filter((m) => m.assessment_id === asm.id);
    const avg = marks.length > 0 ? marks.reduce((sum, m) => sum + m.marks_obtained, 0) / marks.length : 0;
    const sub = rawState.subjects.find((s) => s.id === asm.subject_id);
    return {
      assessment: asm.title.length > 20 ? asm.title.slice(0, 20) + '...' : asm.title,
      subject: sub?.code || asm.subject_id,
      average_marks: Number(avg.toFixed(1)),
      max_marks: asm.max_marks,
      percentage: Number(((avg / asm.max_marks) * 100).toFixed(1)),
    };
  });

  res.json({
    teacher: profile,
    metrics: {
      assigned_classes_count: classIds.length,
      assigned_subjects_count: subjectIds.length,
      total_students_taught: enrolledStudents.length,
      pending_evaluations_count: pendingSubmissionsCount,
      scheduled_classes_today: scheduledTodayCount,
      completed_attendance_today: todaySessions.length,
    },
    today_classes: todayClasses,
    assigned_allocations: assignments,
    performance_chart: perfData,
    recent_announcements: announcements,
  });
});

// 2. GET /api/v1/teachers/profile
teachersRouter.get('/profile', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }
  const profile = db.getTeacherProfileById(ctx.profileId);
  const allocations = db.getTeacherAssignments(ctx.profileId);
  res.json({ profile, allocations });
});

// PUT /api/v1/teachers/profile
teachersRouter.put('/profile', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { office_room, phone, qualification, experience_years } = req.body;
  const updated = db.updateTeacherProfile(ctx.profileId, {
    office_room,
    phone,
    qualification,
    experience_years,
  });

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'TEACHER_PROFILE_UPDATE',
    entity_type: 'TEACHER_PROFILE',
    entity_id: ctx.profileId,
    details: 'Teacher updated profile information',
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: 'Profile updated successfully', profile: updated });
});

// 3. GET /api/v1/teachers/students (Student Directory within teaching scope)
teachersRouter.get('/students', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const allocations = db.getTeacherAssignments(ctx.profileId);
  const allowedClassIds = Array.from(new Set(allocations.map((a) => a.class_id)));

  const rawState = db.getRawState();
  let students = rawState.studentProfiles.filter((s) => allowedClassIds.includes(s.class_id));

  // Search & filter query params
  const { search, class_id, department_id, semester } = req.query;

  if (class_id && typeof class_id === 'string') {
    if (!allowedClassIds.includes(class_id)) {
      res.status(403).json({ error: 'Access denied to students of this class.' });
      return;
    }
    students = students.filter((s) => s.class_id === class_id);
  }

  if (department_id && typeof department_id === 'string') {
    students = students.filter((s) => s.department_id === department_id);
  }

  if (semester && typeof semester === 'string') {
    students = students.filter((s) => s.semester === Number(semester));
  }

  const enriched = students.map((s) => {
    const u = db.findUserById(s.user_id);
    const cls = rawState.classes.find((c) => c.id === s.class_id);
    const dept = rawState.departments.find((d) => d.id === s.department_id);
    const attStats = db.getStudentAttendanceStats(s.id);
    const acad = db.getStudentAcademicPerformance(s.id);

    return {
      id: s.id,
      user_id: s.user_id,
      register_number: s.register_number,
      full_name: u?.full_name,
      email: u?.email,
      phone: u?.phone,
      class_name: cls?.name,
      department_name: dept?.name,
      semester: s.semester,
      attendance_percentage: attStats.overall.percentage,
      is_low_attendance: attStats.overall.is_low_attendance,
      current_gpa: acad.current_gpa,
    };
  });

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    const filtered = enriched.filter(
      (s) => (s.full_name && s.full_name.toLowerCase().includes(q)) || s.register_number.toLowerCase().includes(q)
    );
    res.json({ students: filtered, classes: allocations });
    return;
  }

  res.json({ students: enriched, classes: allocations });
});

// 4. GET & POST /api/v1/teachers/attendance
teachersRouter.get('/attendance', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const allocations = db.getTeacherAssignments(ctx.profileId);
  const sessions = db.getAttendanceSessions({ teacher_id: ctx.profileId });

  // Low attendance students list across teacher's classes
  const rawState = db.getRawState();
  const allowedClassIds = Array.from(new Set(allocations.map((a) => a.class_id)));
  const students = rawState.studentProfiles.filter((s) => allowedClassIds.includes(s.class_id));

  const lowAttendanceStudents = students
    .map((s) => {
      const stats = db.getStudentAttendanceStats(s.id);
      const u = db.findUserById(s.user_id);
      const cls = rawState.classes.find((c) => c.id === s.class_id);
      return {
        id: s.id,
        register_number: s.register_number,
        full_name: u?.full_name,
        class_name: cls?.name,
        total_classes: stats.overall.total_classes,
        attended: stats.overall.attended,
        missed: stats.overall.missed,
        percentage: stats.overall.percentage,
      };
    })
    .filter((s) => s.percentage < rawState.systemSettings.attendance_warning_threshold);

  res.json({
    allocations,
    sessions: sessions.slice(0, 30),
    low_attendance_students: lowAttendanceStudents,
    threshold: rawState.systemSettings.attendance_warning_threshold,
  });
});

teachersRouter.get('/attendance/session/:id', (req: Request, res: Response): void => {
  const records = db.getSessionRecords(req.params.id);
  const session = db.getAttendanceSessions({}).find((s) => s.id === req.params.id);
  res.json({ session, records });
});

teachersRouter.post('/attendance', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { class_id, subject_id, date, period, records } = req.body;
  if (!class_id || !subject_id || !date || !period || !Array.isArray(records)) {
    res.status(400).json({ error: 'Missing required attendance fields.' });
    return;
  }

  // Verify teacher teaches this subject & class
  const allocations = db.getTeacherAssignments(ctx.profileId);
  const isAllowed = allocations.some((a) => a.class_id === class_id && a.subject_id === subject_id);
  if (!isAllowed && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'You are not assigned to teach this class and subject.' });
    return;
  }

  const result = db.recordAttendanceSession(class_id, subject_id, ctx.profileId, date, Number(period), records);

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'ATTENDANCE_RECORDED',
    entity_type: 'ATTENDANCE_SESSION',
    entity_id: result.session.id,
    details: `Recorded attendance for class ${class_id}, period ${period}, date ${date}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    message: 'Attendance recorded successfully',
    session: result.session,
    records: result.records,
  });
});

// 5. GET & POST /api/v1/teachers/marks
teachersRouter.get('/marks', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const allocations = db.getTeacherAssignments(ctx.profileId);
  const assessments = db.getAssessments({ teacher_id: ctx.profileId });

  res.json({
    allocations,
    assessments,
  });
});

teachersRouter.get('/marks/assessment/:id', (req: Request, res: Response): void => {
  const assessment = db.getAssessments({}).find((a) => a.id === req.params.id);
  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found.' });
    return;
  }
  const marks = db.getAssessmentMarks(req.params.id);
  res.json({ assessment, marks });
});

teachersRouter.post('/marks/assessments', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { title, subject_id, class_id, type, max_marks, date } = req.body;
  if (!title || !subject_id || !class_id || !max_marks || !date) {
    res.status(400).json({ error: 'All assessment fields are required.' });
    return;
  }

  if (Number(max_marks) <= 0) {
    res.status(400).json({ error: 'Maximum marks must be greater than zero.' });
    return;
  }

  const assessment = db.createAssessment({
    title,
    subject_id,
    class_id,
    teacher_id: ctx.profileId,
    type: type || 'exam',
    max_marks: Number(max_marks),
    date,
  });

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'ASSESSMENT_CREATED',
    entity_type: 'ASSESSMENT',
    entity_id: assessment.id,
    details: `Created assessment "${title}" with max marks ${max_marks}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({ message: 'Assessment created successfully', assessment });
});

teachersRouter.post('/marks/assessment/:id/save', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { marks } = req.body;
  if (!Array.isArray(marks)) {
    res.status(400).json({ error: 'Marks list is required.' });
    return;
  }

  try {
    const updated = db.saveAssessmentMarks(req.params.id, marks);

    db.logAudit({
      user_id: ctx.userId,
      user_email: req.user!.email,
      action: 'MARKS_RECORDED',
      entity_type: 'ASSESSMENT',
      entity_id: req.params.id,
      details: `Saved marks for assessment ${req.params.id}`,
      ip_address: req.ip || '127.0.0.1',
    });

    res.json({ message: 'Marks saved successfully', marks: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Error saving marks' });
  }
});

// 6. GET & POST /api/v1/teachers/assignments
teachersRouter.get('/assignments', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const allocations = db.getTeacherAssignments(ctx.profileId);
  const assignments = db.getAssignments({ teacher_id: ctx.profileId });

  const enriched = assignments.map((a) => {
    const subs = db.getSubmissions(a.id);
    const evaluated = subs.filter((s) => s.status === 'evaluated').length;
    return {
      ...a,
      total_submissions: subs.length,
      evaluated_count: evaluated,
      pending_count: subs.length - evaluated,
    };
  });

  res.json({ allocations, assignments: enriched });
});

teachersRouter.get('/assignments/:id/submissions', (req: Request, res: Response): void => {
  const submissions = db.getSubmissions(req.params.id);
  const assignment = db.getAssignments({}).find((a) => a.id === req.params.id);
  res.json({ assignment, submissions });
});

teachersRouter.post('/assignments', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { title, description, subject_id, class_id, due_date, max_score } = req.body;
  if (!title || !subject_id || !class_id || !due_date || !max_score) {
    res.status(400).json({ error: 'All assignment fields are required.' });
    return;
  }

  const assignment = db.createAssignment({
    title,
    description: description || '',
    subject_id,
    class_id,
    teacher_id: ctx.profileId,
    issue_date: new Date().toISOString().slice(0, 10),
    due_date,
    max_score: Number(max_score),
  });

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'ASSIGNMENT_CREATED',
    entity_type: 'ASSIGNMENT',
    entity_id: assignment.id,
    details: `Created assignment "${title}" due on ${due_date}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({ message: 'Assignment created successfully', assignment });
});

teachersRouter.post('/assignments/submissions/:id/grade', (req: Request, res: Response): void => {
  const { score, feedback } = req.body;
  if (score === undefined || isNaN(Number(score))) {
    res.status(400).json({ error: 'Valid numerical score is required.' });
    return;
  }

  try {
    const graded = db.gradeSubmission(req.params.id, Number(score), feedback || '');
    res.json({ message: 'Submission graded successfully', submission: graded });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Error grading submission' });
  }
});

// 7. GET & POST /api/v1/teachers/timetable
teachersRouter.get('/timetable', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const timetable = db.getTimetable({ teacher_id: ctx.profileId });
  res.json({ timetable });
});

// Teachers can request a timetable change (logged to audit and creates admin notification)
teachersRouter.post('/timetable/request-change', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { entry_id, reason, preferred_slot } = req.body;
  if (!reason) {
    res.status(400).json({ error: 'Reason for schedule change request is required.' });
    return;
  }

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'TIMETABLE_CHANGE_REQUESTED',
    entity_type: 'TIMETABLE',
    entity_id: entry_id,
    details: `Reason: ${reason} | Preferred slot: ${preferred_slot || 'N/A'}`,
    ip_address: req.ip || '127.0.0.1',
  });

  // Notify admin
  const raw = db.getRawState();
  const adminUser = raw.users.find((u) => u.role === 'admin');
  if (adminUser) {
    db.createNotification({
      user_id: adminUser.id,
      title: 'Timetable Change Request',
      message: `${req.user!.full_name} submitted a timetable adjustment request: ${reason}`,
      type: 'system',
      link: '/admin/timetable',
    });
  }

  res.json({ message: 'Schedule change request submitted to academic administration.' });
});

// 8. GET & POST /api/v1/teachers/announcements & reports
teachersRouter.get('/announcements', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const allocations = db.getTeacherAssignments(ctx.profileId);
  const announcements = db.getAnnouncements('teacher');

  res.json({ allocations, announcements });
});

teachersRouter.post('/announcements', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { title, content, target_role, target_class_id, category } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required.' });
    return;
  }

  const announcement = db.createAnnouncement({
    title,
    content,
    category: category || 'academic',
    target_role: target_role || 'students',
    target_class_id,
    author_id: ctx.userId,
    author_name: req.user!.full_name,
    author_role: 'teacher',
  });

  db.logAudit({
    user_id: ctx.userId,
    user_email: req.user!.email,
    action: 'ANNOUNCEMENT_CREATED',
    entity_type: 'ANNOUNCEMENT',
    entity_id: announcement.id,
    details: `Teacher posted announcement "${title}"`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.status(201).json({ message: 'Announcement published successfully', announcement });
});

// Reports generator (Attendance, Marks, Assignments)
teachersRouter.get('/reports', (req: Request, res: Response): void => {
  const ctx = getTeacherContext(req);
  if (!ctx) {
    res.status(404).json({ error: 'Teacher profile not found.' });
    return;
  }

  const { type, class_id, subject_id } = req.query;
  const rawState = db.getRawState();

  if (type === 'attendance') {
    const students = rawState.studentProfiles.filter((s) => !class_id || s.class_id === class_id);
    const reportData = students.map((s) => {
      const u = db.findUserById(s.user_id);
      const cls = rawState.classes.find((c) => c.id === s.class_id);
      const stats = db.getStudentAttendanceStats(s.id);
      return {
        register_number: s.register_number,
        student_name: u?.full_name,
        class_name: cls?.name,
        total_sessions: stats.overall.total_classes,
        attended: stats.overall.attended,
        missed: stats.overall.missed,
        leave: stats.overall.leave,
        attendance_percentage: `${stats.overall.percentage}%`,
        status: stats.overall.is_low_attendance ? 'Warning (<75%)' : 'Good',
      };
    });
    res.json({ report: reportData, generated_at: new Date().toISOString() });
    return;
  }

  if (type === 'marks') {
    const assessments = rawState.assessments.filter((a) => !subject_id || a.subject_id === subject_id);
    const reportData: any[] = [];
    assessments.forEach((asm) => {
      const marksList = db.getAssessmentMarks(asm.id);
      marksList.forEach((m) => {
        reportData.push({
          assessment: asm.title,
          subject_code: rawState.subjects.find((s) => s.id === asm.subject_id)?.code,
          register_number: m.register_number,
          student_name: m.student_name,
          marks_obtained: m.marks_obtained,
          max_marks: asm.max_marks,
          percentage: `${((m.marks_obtained / asm.max_marks) * 100).toFixed(1)}%`,
        });
      });
    });
    res.json({ report: reportData, generated_at: new Date().toISOString() });
    return;
  }

  if (type === 'assignments') {
    const assignments = rawState.assignments.filter((a) => !class_id || a.class_id === class_id);
    const reportData = assignments.map((a) => {
      const subs = db.getSubmissions(a.id);
      return {
        assignment_title: a.title,
        subject: rawState.subjects.find((s) => s.id === a.subject_id)?.name,
        due_date: a.due_date,
        total_submissions: subs.length,
        evaluated: subs.filter((s) => s.status === 'evaluated').length,
        pending: subs.filter((s) => s.status === 'submitted' || s.status === 'late').length,
      };
    });
    res.json({ report: reportData, generated_at: new Date().toISOString() });
    return;
  }

  res.status(400).json({ error: 'Valid report type (attendance | marks | assignments) is required.' });
});
