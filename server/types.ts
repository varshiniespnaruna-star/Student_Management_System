export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface AcademicSemester {
  id: string;
  name: string; // e.g. "Fall 2026", "Spring 2026"
  year: number;
  is_current: boolean;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g. "CSE-A", "CSE-B", "ECE-A"
  department_id: string;
  semester_id: string;
  section: string;
  department_name?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department_id: string;
  credits: number;
  description?: string;
  department_name?: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  register_number: string;
  department_id: string;
  class_id: string;
  semester: number;
  enrollment_year: number;
  emergency_contact: string;
  address?: string;
  date_of_birth?: string;
  blood_group?: string;
  // Joined fields:
  full_name?: string;
  email?: string;
  phone?: string;
  class_name?: string;
  department_name?: string;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  employee_id: string;
  department_id: string;
  designation: string;
  qualification: string;
  experience_years: number;
  office_room: string;
  // Joined fields:
  full_name?: string;
  email?: string;
  phone?: string;
  department_name?: string;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
  teacher_name?: string;
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  date: string; // YYYY-MM-DD
  period: number;
  created_at: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'leave';
  remarks?: string;
  student_name?: string;
  register_number?: string;
}

export interface Assessment {
  id: string;
  title: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  type: 'internal_1' | 'internal_2' | 'exam' | 'quiz' | 'assignment';
  max_marks: number;
  date: string;
  subject_name?: string;
  class_name?: string;
}

export interface Mark {
  id: string;
  assessment_id: string;
  student_id: string;
  marks_obtained: number;
  feedback?: string;
  student_name?: string;
  register_number?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  issue_date: string;
  due_date: string;
  max_score: number;
  file_attachment?: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_name: string;
  file_path: string;
  submitted_at: string;
  status: 'submitted' | 'late' | 'evaluated';
  score?: number;
  feedback?: string;
  evaluated_at?: string;
  student_name?: string;
  register_number?: string;
}

export interface TimetableEntry {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  room: string;
  subject_name?: string;
  teacher_name?: string;
  class_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'college' | 'academic' | 'exam' | 'event' | 'department';
  target_role: 'all' | 'students' | 'teachers' | 'class';
  target_class_id?: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  created_at: string;
  is_archived: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'announcement' | 'attendance' | 'marks' | 'assignment' | 'exam' | 'system';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface StudyTask {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  subject_id?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  is_completed: boolean;
  created_at: string;
}

export interface SkillCertification {
  id: string;
  student_id: string;
  title: string;
  category: 'skill' | 'certification' | 'project' | 'internship';
  organization?: string;
  issue_date?: string;
  credential_url?: string;
  status: 'in_progress' | 'completed';
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface SystemSettings {
  attendance_warning_threshold: number; // default 75
  system_name: string;
  academic_year: string;
  allow_student_profile_edit: boolean;
  grading_rules: {
    grade: string;
    min_percentage: number;
    gpa_point: number;
  }[];
}
