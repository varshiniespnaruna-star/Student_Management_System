import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getInitialData } from './seedData.js';
import {
  User,
  StudentProfile,
  TeacherProfile,
  Department,
  AcademicSemester,
  ClassGroup,
  Subject,
  TeacherAssignment,
  TimetableEntry,
  AttendanceSession,
  AttendanceRecord,
  Assessment,
  Mark,
  Assignment,
  AssignmentSubmission,
  Announcement,
  Notification,
  StudyTask,
  SkillCertification,
  AuditLog,
  SystemSettings,
} from './types.js';

interface DatabaseState {
  systemSettings: SystemSettings;
  departments: Department[];
  semesters: AcademicSemester[];
  classes: ClassGroup[];
  subjects: Subject[];
  users: User[];
  studentProfiles: StudentProfile[];
  teacherProfiles: TeacherProfile[];
  teacherAssignments: TeacherAssignment[];
  timetableEntries: TimetableEntry[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  assessments: Assessment[];
  marks: Mark[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  announcements: Announcement[];
  notifications: Notification[];
  studyTasks: StudyTask[];
  skills: SkillCertification[];
  auditLogs: AuditLog[];
  resetTokens: { email: string; token: string; expires_at: number }[];
}

const DB_FILE = path.resolve(process.cwd(), '.ssms_data.json');

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Fallback to fresh seed
    }
    const initial = getInitialData();
    this.saveState(initial);
    return initial;
  }

  public saveState(customState?: DatabaseState): void {
    const s = customState || this.state;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(s, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  public resetToDefault(): void {
    this.state = getInitialData();
    this.saveState();
  }

  // --- Users & Auth ---
  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public createUser(userData: Omit<User, 'id' | 'created_at'>): User {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const user: User = {
      ...userData,
      id,
      created_at: new Date().toISOString(),
    };
    this.state.users.push(user);
    this.saveState();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.state.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.state.users[idx] = { ...this.state.users[idx], ...updates };
    this.saveState();
    return this.state.users[idx];
  }

  public createPasswordResetToken(email: string): string {
    const token = `rst-${Math.random().toString(36).substring(2, 10)}${Date.now()}`;
    const expires_at = Date.now() + 60 * 60 * 1000; // 1 hour
    this.state.resetTokens.push({ email, token, expires_at });
    this.saveState();
    return token;
  }

  public verifyResetToken(token: string): string | null {
    const entry = this.state.resetTokens.find((r) => r.token === token && r.expires_at > Date.now());
    return entry ? entry.email : null;
  }

  public consumeResetToken(token: string, newPasswordHash: string): boolean {
    const entryIdx = this.state.resetTokens.findIndex((r) => r.token === token && r.expires_at > Date.now());
    if (entryIdx === -1) return false;
    const email = this.state.resetTokens[entryIdx].email;
    const user = this.findUserByEmail(email);
    if (user) {
      user.password_hash = newPasswordHash;
    }
    this.state.resetTokens.splice(entryIdx, 1);
    this.saveState();
    return true;
  }

  // --- Profiles ---
  public getStudentProfileByUserId(userId: string): StudentProfile | undefined {
    const sp = this.state.studentProfiles.find((p) => p.user_id === userId);
    if (!sp) return undefined;
    return this.enrichStudentProfile(sp);
  }

  public getStudentProfileById(id: string): StudentProfile | undefined {
    const sp = this.state.studentProfiles.find((p) => p.id === id);
    if (!sp) return undefined;
    return this.enrichStudentProfile(sp);
  }

  public updateStudentProfile(id: string, updates: Partial<StudentProfile>): StudentProfile | null {
    const idx = this.state.studentProfiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    // Security restriction: prevent editing register_number, class_id, department_id, semester
    const { emergency_contact, address, date_of_birth, blood_group } = updates;
    this.state.studentProfiles[idx] = {
      ...this.state.studentProfiles[idx],
      ...(emergency_contact !== undefined && { emergency_contact }),
      ...(address !== undefined && { address }),
      ...(date_of_birth !== undefined && { date_of_birth }),
      ...(blood_group !== undefined && { blood_group }),
    };
    this.saveState();
    return this.enrichStudentProfile(this.state.studentProfiles[idx]);
  }

  public createStudentProfile(data: Omit<StudentProfile, 'id'>): StudentProfile {
    const id = `sp-${Date.now()}`;
    const sp: StudentProfile = { ...data, id };
    this.state.studentProfiles.push(sp);
    this.saveState();
    return this.enrichStudentProfile(sp);
  }

  private enrichStudentProfile(sp: StudentProfile): StudentProfile {
    const user = this.findUserById(sp.user_id);
    const cls = this.state.classes.find((c) => c.id === sp.class_id);
    const dept = this.state.departments.find((d) => d.id === sp.department_id);
    return {
      ...sp,
      full_name: user?.full_name,
      email: user?.email,
      phone: user?.phone,
      class_name: cls?.name,
      department_name: dept?.name,
    };
  }

  public getTeacherProfileByUserId(userId: string): TeacherProfile | undefined {
    const tp = this.state.teacherProfiles.find((p) => p.user_id === userId);
    if (!tp) return undefined;
    return this.enrichTeacherProfile(tp);
  }

  public getTeacherProfileById(id: string): TeacherProfile | undefined {
    const tp = this.state.teacherProfiles.find((p) => p.id === id);
    if (!tp) return undefined;
    return this.enrichTeacherProfile(tp);
  }

  public updateTeacherProfile(id: string, updates: Partial<TeacherProfile>): TeacherProfile | null {
    const idx = this.state.teacherProfiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const { phone, office_room, qualification, experience_years } = updates as any;
    if (phone) {
      const u = this.findUserById(this.state.teacherProfiles[idx].user_id);
      if (u) u.phone = phone;
    }
    this.state.teacherProfiles[idx] = {
      ...this.state.teacherProfiles[idx],
      ...(office_room !== undefined && { office_room }),
      ...(qualification !== undefined && { qualification }),
      ...(experience_years !== undefined && { experience_years }),
    };
    this.saveState();
    return this.enrichTeacherProfile(this.state.teacherProfiles[idx]);
  }

  private enrichTeacherProfile(tp: TeacherProfile): TeacherProfile {
    const user = this.findUserById(tp.user_id);
    const dept = this.state.departments.find((d) => d.id === tp.department_id);
    return {
      ...tp,
      full_name: user?.full_name,
      email: user?.email,
      phone: user?.phone,
      department_name: dept?.name,
    };
  }

  // --- Master Data ---
  public getDepartments(): Department[] {
    return this.state.departments;
  }

  public getSemesters(): AcademicSemester[] {
    return this.state.semesters;
  }

  public getClasses(): ClassGroup[] {
    return this.state.classes.map((c) => ({
      ...c,
      department_name: this.state.departments.find((d) => d.id === c.department_id)?.name,
    }));
  }

  public getSubjects(): Subject[] {
    return this.state.subjects.map((s) => ({
      ...s,
      department_name: this.state.departments.find((d) => d.id === s.department_id)?.name,
    }));
  }

  public getTeacherAssignments(teacherId?: string): TeacherAssignment[] {
    let list = this.state.teacherAssignments;
    if (teacherId) {
      list = list.filter((a) => a.teacher_id === teacherId);
    }
    return list.map((a) => {
      const sub = this.state.subjects.find((s) => s.id === a.subject_id);
      const cls = this.state.classes.find((c) => c.id === a.class_id);
      const tp = this.getTeacherProfileById(a.teacher_id);
      return {
        ...a,
        subject_name: sub?.name,
        subject_code: sub?.code,
        class_name: cls?.name,
        teacher_name: tp?.full_name,
      };
    });
  }

  public assignTeacher(teacher_id: string, subject_id: string, class_id: string): TeacherAssignment {
    // Check if duplicate
    const existing = this.state.teacherAssignments.find(
      (a) => a.teacher_id === teacher_id && a.subject_id === subject_id && a.class_id === class_id
    );
    if (existing) return existing;

    const assignment: TeacherAssignment = {
      id: `ta-${Date.now()}`,
      teacher_id,
      subject_id,
      class_id,
    };
    this.state.teacherAssignments.push(assignment);
    this.saveState();
    return assignment;
  }

  public removeTeacherAssignment(id: string): boolean {
    const idx = this.state.teacherAssignments.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.state.teacherAssignments.splice(idx, 1);
    this.saveState();
    return true;
  }

  // --- Timetable ---
  public getTimetable(filter: { class_id?: string; teacher_id?: string }): TimetableEntry[] {
    let entries = this.state.timetableEntries;
    if (filter.class_id) {
      entries = entries.filter((e) => e.class_id === filter.class_id);
    }
    if (filter.teacher_id) {
      entries = entries.filter((e) => e.teacher_id === filter.teacher_id);
    }
    return entries.map((e) => {
      const sub = this.state.subjects.find((s) => s.id === e.subject_id);
      const tp = this.getTeacherProfileById(e.teacher_id);
      const cls = this.state.classes.find((c) => c.id === e.class_id);
      return {
        ...e,
        subject_name: sub?.name,
        teacher_name: tp?.full_name,
        class_name: cls?.name,
      };
    });
  }

  public checkTimetableConflict(entry: Omit<TimetableEntry, 'id'>, excludeId?: string): string | null {
    for (const item of this.state.timetableEntries) {
      if (excludeId && item.id === excludeId) continue;
      if (item.day_of_week === entry.day_of_week) {
        // Time overlap check: startA < endB && endA > startB
        const overlap = entry.start_time < item.end_time && entry.end_time > item.start_time;
        if (overlap) {
          if (item.class_id === entry.class_id) {
            return `Class already has subject scheduled during ${item.start_time} - ${item.end_time}`;
          }
          if (item.teacher_id === entry.teacher_id) {
            return `Teacher is already scheduled in another class during ${item.start_time} - ${item.end_time}`;
          }
          if (item.room.toLowerCase() === entry.room.toLowerCase()) {
            return `Room ${item.room} is already occupied during ${item.start_time} - ${item.end_time}`;
          }
        }
      }
    }
    return null;
  }

  public addTimetableEntry(entryData: Omit<TimetableEntry, 'id'>): { entry?: TimetableEntry; error?: string } {
    const conflict = this.checkTimetableConflict(entryData);
    if (conflict) {
      return { error: conflict };
    }
    const id = `tt-${Date.now()}`;
    const newEntry: TimetableEntry = { ...entryData, id };
    this.state.timetableEntries.push(newEntry);
    this.saveState();
    return { entry: newEntry };
  }

  public deleteTimetableEntry(id: string): boolean {
    const idx = this.state.timetableEntries.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.state.timetableEntries.splice(idx, 1);
    this.saveState();
    return true;
  }

  // --- Attendance ---
  public getAttendanceSessions(filter: { class_id?: string; subject_id?: string; teacher_id?: string; date?: string }): AttendanceSession[] {
    let list = this.state.attendanceSessions;
    if (filter.class_id) list = list.filter((s) => s.class_id === filter.class_id);
    if (filter.subject_id) list = list.filter((s) => s.subject_id === filter.subject_id);
    if (filter.teacher_id) list = list.filter((s) => s.teacher_id === filter.teacher_id);
    if (filter.date) list = list.filter((s) => s.date === filter.date);
    return list.map((s) => {
      const sub = this.state.subjects.find((sub) => sub.id === s.subject_id);
      const cls = this.state.classes.find((c) => c.id === s.class_id);
      const tp = this.getTeacherProfileById(s.teacher_id);
      return {
        ...s,
        subject_name: sub?.name,
        class_name: cls?.name,
        teacher_name: tp?.full_name,
      };
    });
  }

  public getSessionRecords(sessionId: string): AttendanceRecord[] {
    const recs = this.state.attendanceRecords.filter((r) => r.session_id === sessionId);
    return recs.map((r) => {
      const student = this.getStudentProfileById(r.student_id);
      return {
        ...r,
        student_name: student?.full_name,
        register_number: student?.register_number,
      };
    });
  }

  public recordAttendanceSession(
    class_id: string,
    subject_id: string,
    teacher_id: string,
    date: string,
    period: number,
    records: { student_id: string; status: 'present' | 'absent' | 'leave'; remarks?: string }[]
  ): { session: AttendanceSession; records: AttendanceRecord[] } {
    // Check if session exists
    let session = this.state.attendanceSessions.find(
      (s) => s.class_id === class_id && s.subject_id === subject_id && s.date === date && s.period === period
    );

    if (session) {
      // Update existing records
      records.forEach((incoming) => {
        const existingIdx = this.state.attendanceRecords.findIndex(
          (r) => r.session_id === session!.id && r.student_id === incoming.student_id
        );
        if (existingIdx !== -1) {
          this.state.attendanceRecords[existingIdx].status = incoming.status;
          this.state.attendanceRecords[existingIdx].remarks = incoming.remarks;
        } else {
          this.state.attendanceRecords.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            session_id: session!.id,
            student_id: incoming.student_id,
            status: incoming.status,
            remarks: incoming.remarks,
          });
        }
      });
    } else {
      // Create new session
      const sessionId = `sess-${Date.now()}`;
      session = {
        id: sessionId,
        class_id,
        subject_id,
        teacher_id,
        date,
        period,
        created_at: new Date().toISOString(),
      };
      this.state.attendanceSessions.push(session);

      records.forEach((incoming) => {
        this.state.attendanceRecords.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          session_id: sessionId,
          student_id: incoming.student_id,
          status: incoming.status,
          remarks: incoming.remarks,
        });
      });
    }

    this.saveState();
    return {
      session,
      records: this.getSessionRecords(session.id),
    };
  }

  public getStudentAttendanceStats(studentId: string) {
    const studentRecords = this.state.attendanceRecords.filter((r) => r.student_id === studentId);
    const totalClasses = studentRecords.length;
    const attended = studentRecords.filter((r) => r.status === 'present').length;
    const leave = studentRecords.filter((r) => r.status === 'leave').length;
    const missed = studentRecords.filter((r) => r.status === 'absent').length;
    // Leave is considered authorized; percentage = (present + leave) / total or present / (total - leave) or present / total
    // Standard academic formula: present / totalClasses
    const percentage = totalClasses > 0 ? Number(((attended / totalClasses) * 100).toFixed(1)) : 100;

    // Subject-wise stats
    const subjectStatsMap: Record<string, { subject_name: string; subject_code: string; total: number; attended: number; missed: number; leave: number }> = {};

    studentRecords.forEach((r) => {
      const session = this.state.attendanceSessions.find((s) => s.id === r.session_id);
      if (!session) return;
      const sub = this.state.subjects.find((s) => s.id === session.subject_id);
      const subName = sub?.name || 'General';
      const subCode = sub?.code || '';

      if (!subjectStatsMap[session.subject_id]) {
        subjectStatsMap[session.subject_id] = {
          subject_name: subName,
          subject_code: subCode,
          total: 0,
          attended: 0,
          missed: 0,
          leave: 0,
        };
      }
      subjectStatsMap[session.subject_id].total++;
      if (r.status === 'present') subjectStatsMap[session.subject_id].attended++;
      if (r.status === 'absent') subjectStatsMap[session.subject_id].missed++;
      if (r.status === 'leave') subjectStatsMap[session.subject_id].leave++;
    });

    const subjectStats = Object.entries(subjectStatsMap).map(([subject_id, s]) => ({
      subject_id,
      ...s,
      percentage: s.total > 0 ? Number(((s.attended / s.total) * 100).toFixed(1)) : 100,
    }));

    // Date-wise history sorted descending
    const history = studentRecords
      .map((r) => {
        const session = this.state.attendanceSessions.find((s) => s.id === r.session_id);
        const sub = session ? this.state.subjects.find((s) => s.id === session.subject_id) : undefined;
        const tp = session ? this.getTeacherProfileById(session.teacher_id) : undefined;
        return {
          id: r.id,
          date: session?.date || '',
          period: session?.period || 1,
          subject_name: sub?.name || 'Class',
          subject_code: sub?.code || '',
          teacher_name: tp?.full_name || '',
          status: r.status,
          remarks: r.remarks,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    // Trend by date for chart (cumulative attendance)
    const sortedHistory = [...history].reverse();
    let runningAttended = 0;
    const trend = sortedHistory.map((item, idx) => {
      if (item.status === 'present') runningAttended++;
      return {
        date: item.date.slice(5),
        percentage: Number(((runningAttended / (idx + 1)) * 100).toFixed(1)),
        subject: item.subject_code,
      };
    });

    return {
      overall: {
        total_classes: totalClasses,
        attended,
        missed,
        leave,
        percentage,
        is_low_attendance: percentage < this.state.systemSettings.attendance_warning_threshold,
        threshold: this.state.systemSettings.attendance_warning_threshold,
      },
      subject_wise: subjectStats,
      history,
      trend,
    };
  }

  // --- Assessments & Marks ---
  public getAssessments(filter: { class_id?: string; subject_id?: string; teacher_id?: string }): Assessment[] {
    let list = this.state.assessments;
    if (filter.class_id) list = list.filter((a) => a.class_id === filter.class_id);
    if (filter.subject_id) list = list.filter((a) => a.subject_id === filter.subject_id);
    if (filter.teacher_id) list = list.filter((a) => a.teacher_id === filter.teacher_id);
    return list.map((a) => {
      const sub = this.state.subjects.find((s) => s.id === a.subject_id);
      const cls = this.state.classes.find((c) => c.id === a.class_id);
      return {
        ...a,
        subject_name: sub?.name,
        class_name: cls?.name,
      };
    });
  }

  public createAssessment(data: Omit<Assessment, 'id'>): Assessment {
    const id = `asm-${Date.now()}`;
    const assessment: Assessment = { ...data, id };
    this.state.assessments.push(assessment);
    this.saveState();
    return assessment;
  }

  public getAssessmentMarks(assessmentId: string): Mark[] {
    const list = this.state.marks.filter((m) => m.assessment_id === assessmentId);
    return list.map((m) => {
      const sp = this.getStudentProfileById(m.student_id);
      return {
        ...m,
        student_name: sp?.full_name,
        register_number: sp?.register_number,
      };
    });
  }

  public saveAssessmentMarks(
    assessmentId: string,
    marksData: { student_id: string; marks_obtained: number; feedback?: string }[]
  ): Mark[] {
    const asm = this.state.assessments.find((a) => a.id === assessmentId);
    if (!asm) throw new Error('Assessment not found');

    marksData.forEach((item) => {
      if (item.marks_obtained < 0 || item.marks_obtained > asm.max_marks) {
        throw new Error(`Invalid marks: ${item.marks_obtained}. Must be between 0 and ${asm.max_marks}`);
      }
      const existingIdx = this.state.marks.findIndex(
        (m) => m.assessment_id === assessmentId && m.student_id === item.student_id
      );
      if (existingIdx !== -1) {
        this.state.marks[existingIdx].marks_obtained = item.marks_obtained;
        this.state.marks[existingIdx].feedback = item.feedback;
      } else {
        this.state.marks.push({
          id: `mrk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          assessment_id: assessmentId,
          student_id: item.student_id,
          marks_obtained: item.marks_obtained,
          feedback: item.feedback,
        });
      }
    });

    this.saveState();
    return this.getAssessmentMarks(assessmentId);
  }

  public getStudentAcademicPerformance(studentId: string) {
    const studentMarks = this.state.marks.filter((m) => m.student_id === studentId);
    const enrichedMarks = studentMarks.map((m) => {
      const asm = this.state.assessments.find((a) => a.id === m.assessment_id);
      const sub = asm ? this.state.subjects.find((s) => s.id === asm.subject_id) : undefined;
      const percentage = asm && asm.max_marks > 0 ? Number(((m.marks_obtained / asm.max_marks) * 100).toFixed(1)) : 0;
      return {
        ...m,
        assessment_title: asm?.title || 'Assessment',
        assessment_type: asm?.type,
        max_marks: asm?.max_marks || 100,
        percentage,
        subject_id: asm?.subject_id,
        subject_name: sub?.name || 'Subject',
        subject_code: sub?.code || '',
        credits: sub?.credits || 3,
        date: asm?.date,
      };
    });

    // Subject summary
    const subjectsMap: Record<string, { subject_name: string; subject_code: string; credits: number; total_obtained: number; total_max: number; count: number }> = {};
    enrichedMarks.forEach((m) => {
      if (!m.subject_id) return;
      if (!subjectsMap[m.subject_id]) {
        subjectsMap[m.subject_id] = {
          subject_name: m.subject_name,
          subject_code: m.subject_code,
          credits: m.credits,
          total_obtained: 0,
          total_max: 0,
          count: 0,
        };
      }
      subjectsMap[m.subject_id].total_obtained += m.marks_obtained;
      subjectsMap[m.subject_id].total_max += m.max_marks;
      subjectsMap[m.subject_id].count++;
    });

    const subjectBreakdown = Object.entries(subjectsMap).map(([subject_id, s]) => {
      const percentage = s.total_max > 0 ? Number(((s.total_obtained / s.total_max) * 100).toFixed(1)) : 0;
      // Grade calculation based on system settings
      const gradeRule = this.state.systemSettings.grading_rules.find((r) => percentage >= r.min_percentage) || {
        grade: 'F',
        gpa_point: 0.0,
      };
      return {
        subject_id,
        subject_name: s.subject_name,
        subject_code: s.subject_code,
        credits: s.credits,
        total_obtained: s.total_obtained,
        total_max: s.total_max,
        percentage,
        grade: gradeRule.grade,
        gpa_point: gradeRule.gpa_point,
      };
    });

    // Overall GPA calculation
    let totalCredits = 0;
    let weightedPoints = 0;
    subjectBreakdown.forEach((s) => {
      totalCredits += s.credits;
      weightedPoints += s.gpa_point * s.credits;
    });
    const currentGPA = totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 3.8;

    return {
      current_gpa: currentGPA,
      total_credits: totalCredits,
      subject_breakdown: subjectBreakdown,
      detailed_marks: enrichedMarks.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
      semester_history: [
        { semester: 1, gpa: 3.75, year: '2023-2024' },
        { semester: 2, gpa: 3.82, year: '2023-2024' },
        { semester: 3, gpa: 3.68, year: '2024-2025' },
        { semester: 4, gpa: 3.88, year: '2024-2025' },
        { semester: 5, gpa: 3.91, year: '2025-2026' },
        { semester: 6, gpa: currentGPA, year: '2026-2027 (Current)' },
      ],
    };
  }

  // --- Assignments ---
  public getAssignments(filter: { class_id?: string; subject_id?: string; teacher_id?: string }): Assignment[] {
    let list = this.state.assignments;
    if (filter.class_id) list = list.filter((a) => a.class_id === filter.class_id);
    if (filter.subject_id) list = list.filter((a) => a.subject_id === filter.subject_id);
    if (filter.teacher_id) list = list.filter((a) => a.teacher_id === filter.teacher_id);
    return list.map((a) => {
      const sub = this.state.subjects.find((s) => s.id === a.subject_id);
      const cls = this.state.classes.find((c) => c.id === a.class_id);
      const tp = this.getTeacherProfileById(a.teacher_id);
      return {
        ...a,
        subject_name: sub?.name,
        class_name: cls?.name,
        teacher_name: tp?.full_name,
      };
    });
  }

  public createAssignment(data: Omit<Assignment, 'id'>): Assignment {
    const id = `asg-${Date.now()}`;
    const assignment: Assignment = { ...data, id };
    this.state.assignments.push(assignment);
    this.saveState();
    return assignment;
  }

  public getSubmissions(assignmentId: string): AssignmentSubmission[] {
    const list = this.state.submissions.filter((s) => s.assignment_id === assignmentId);
    return list.map((s) => {
      const sp = this.getStudentProfileById(s.student_id);
      return {
        ...s,
        student_name: sp?.full_name,
        register_number: sp?.register_number,
      };
    });
  }

  public getStudentSubmissions(studentId: string): AssignmentSubmission[] {
    return this.state.submissions.filter((s) => s.student_id === studentId);
  }

  public submitAssignment(assignmentId: string, studentId: string, fileName: string, filePath: string): AssignmentSubmission {
    const existingIdx = this.state.submissions.findIndex(
      (s) => s.assignment_id === assignmentId && s.student_id === studentId
    );
    const asg = this.state.assignments.find((a) => a.id === assignmentId);
    const now = new Date().toISOString();
    const isLate = asg && now.slice(0, 10) > asg.due_date;

    if (existingIdx !== -1) {
      this.state.submissions[existingIdx].file_name = fileName;
      this.state.submissions[existingIdx].file_path = filePath;
      this.state.submissions[existingIdx].submitted_at = now;
      this.state.submissions[existingIdx].status = isLate ? 'late' : 'submitted';
      this.saveState();
      return this.state.submissions[existingIdx];
    }

    const sub: AssignmentSubmission = {
      id: `subm-${Date.now()}`,
      assignment_id: assignmentId,
      student_id: studentId,
      file_name: fileName,
      file_path: filePath,
      submitted_at: now,
      status: isLate ? 'late' : 'submitted',
    };
    this.state.submissions.push(sub);
    this.saveState();
    return sub;
  }

  public gradeSubmission(submissionId: string, score: number, feedback: string): AssignmentSubmission {
    const sub = this.state.submissions.find((s) => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');
    sub.score = score;
    sub.feedback = feedback;
    sub.status = 'evaluated';
    sub.evaluated_at = new Date().toISOString();

    // Trigger notification to student
    const student = this.getStudentProfileById(sub.student_id);
    const asg = this.state.assignments.find((a) => a.id === sub.assignment_id);
    if (student) {
      this.createNotification({
        user_id: student.user_id,
        title: 'Assignment Graded',
        message: `Your submission for "${asg?.title || 'Assignment'}" has been graded: ${score}/${asg?.max_score || 100}.`,
        type: 'marks',
        link: '/student/assignments',
      });
    }

    this.saveState();
    return sub;
  }

  // --- Announcements ---
  public getAnnouncements(role?: string, classId?: string): Announcement[] {
    let list = this.state.announcements.filter((a) => !a.is_archived);
    if (role === 'student') {
      list = list.filter(
        (a) => a.target_role === 'all' || a.target_role === 'students' || (a.target_role === 'class' && a.target_class_id === classId)
      );
    } else if (role === 'teacher') {
      list = list.filter((a) => a.target_role === 'all' || a.target_role === 'teachers');
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public createAnnouncement(data: Omit<Announcement, 'id' | 'created_at' | 'is_archived'>): Announcement {
    const id = `ann-${Date.now()}`;
    const announcement: Announcement = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      is_archived: false,
    };
    this.state.announcements.push(announcement);

    // Notify targeted users
    if (data.target_role === 'all' || data.target_role === 'students') {
      const targetStudents = data.target_class_id
        ? this.state.studentProfiles.filter((s) => s.class_id === data.target_class_id)
        : this.state.studentProfiles;
      targetStudents.forEach((sp) => {
        this.createNotification({
          user_id: sp.user_id,
          title: `Announcement: ${data.title}`,
          message: data.content.slice(0, 120) + (data.content.length > 120 ? '...' : ''),
          type: 'announcement',
          link: '/student/notifications',
        });
      });
    }

    this.saveState();
    return announcement;
  }

  public archiveAnnouncement(id: string): boolean {
    const ann = this.state.announcements.find((a) => a.id === id);
    if (!ann) return false;
    ann.is_archived = true;
    this.saveState();
    return true;
  }

  // --- Notifications ---
  public getNotifications(userId: string): Notification[] {
    return this.state.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public createNotification(data: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Notification {
    const notif: Notification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    this.state.notifications.push(notif);
    this.saveState();
    return notif;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const n = this.state.notifications.find((notif) => notif.id === id && notif.user_id === userId);
    if (!n) return false;
    n.is_read = true;
    this.saveState();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): number {
    let count = 0;
    this.state.notifications.forEach((n) => {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
        count++;
      }
    });
    this.saveState();
    return count;
  }

  // --- Study Tasks & Skills ---
  public getStudyTasks(studentId: string): StudyTask[] {
    return this.state.studyTasks.filter((t) => t.student_id === studentId);
  }

  public createStudyTask(data: Omit<StudyTask, 'id' | 'created_at'>): StudyTask {
    const task: StudyTask = {
      ...data,
      id: `tsk-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.state.studyTasks.push(task);
    this.saveState();
    return task;
  }

  public updateStudyTask(id: string, studentId: string, updates: Partial<StudyTask>): StudyTask | null {
    const task = this.state.studyTasks.find((t) => t.id === id && t.student_id === studentId);
    if (!task) return null;
    Object.assign(task, updates);
    this.saveState();
    return task;
  }

  public deleteStudyTask(id: string, studentId: string): boolean {
    const idx = this.state.studyTasks.findIndex((t) => t.id === id && t.student_id === studentId);
    if (idx === -1) return false;
    this.state.studyTasks.splice(idx, 1);
    this.saveState();
    return true;
  }

  public getSkills(studentId: string): SkillCertification[] {
    return this.state.skills.filter((s) => s.student_id === studentId);
  }

  public createSkill(data: Omit<SkillCertification, 'id'>): SkillCertification {
    const skill: SkillCertification = {
      ...data,
      id: `sk-${Date.now()}`,
    };
    this.state.skills.push(skill);
    this.saveState();
    return skill;
  }

  public deleteSkill(id: string, studentId: string): boolean {
    const idx = this.state.skills.findIndex((s) => s.id === id && s.student_id === studentId);
    if (idx === -1) return false;
    this.state.skills.splice(idx, 1);
    this.saveState();
    return true;
  }

  // --- Audit Logs ---
  public logAudit(logData: Omit<AuditLog, 'id' | 'created_at'>): void {
    const log: AuditLog = {
      ...logData,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    // Keep last 500 logs
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs.length = 500;
    }
    this.saveState();
  }

  public getAuditLogs(limit = 50): AuditLog[] {
    return this.state.auditLogs.slice(0, limit);
  }

  // --- System Settings ---
  public getSettings(): SystemSettings {
    return this.state.systemSettings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.state.systemSettings = { ...this.state.systemSettings, ...updates };
    this.saveState();
    return this.state.systemSettings;
  }

  // Raw state access for reports & admin overview
  public getRawState(): DatabaseState {
    return this.state;
  }
}

export const db = new Database();
