import bcrypt from 'bcryptjs';
import {
  User,
  Department,
  AcademicSemester,
  ClassGroup,
  Subject,
  StudentProfile,
  TeacherProfile,
  TeacherAssignment,
  AttendanceSession,
  AttendanceRecord,
  Assessment,
  Mark,
  Assignment,
  AssignmentSubmission,
  TimetableEntry,
  Announcement,
  Notification,
  StudyTask,
  SkillCertification,
  AuditLog,
  SystemSettings,
} from './types.js';

export function getInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('Admin@123', salt);
  const teacherPasswordHash = bcrypt.hashSync('Teacher@123', salt);
  const studentPasswordHash = bcrypt.hashSync('Student@123', salt);

  // 1. System Settings
  const systemSettings: SystemSettings = {
    attendance_warning_threshold: 75,
    system_name: 'Smart Student Management System (SSMS)',
    academic_year: '2026-2027',
    allow_student_profile_edit: true,
    grading_rules: [
      { grade: 'A+', min_percentage: 90, gpa_point: 4.0 },
      { grade: 'A', min_percentage: 80, gpa_point: 3.7 },
      { grade: 'B+', min_percentage: 70, gpa_point: 3.3 },
      { grade: 'B', min_percentage: 60, gpa_point: 3.0 },
      { grade: 'C', min_percentage: 50, gpa_point: 2.0 },
      { grade: 'F', min_percentage: 0, gpa_point: 0.0 },
    ],
  };

  // 2. Departments
  const departments: Department[] = [
    { id: 'dept-1', name: 'Computer Science and Engineering', code: 'CSE', description: 'Department of Computing, Software and Data Sciences' },
    { id: 'dept-2', name: 'Electronics and Communication Engineering', code: 'ECE', description: 'Department of Microelectronics and Embedded Systems' },
    { id: 'dept-3', name: 'Information Technology', code: 'IT', description: 'Department of Applied Information Systems' },
    { id: 'dept-4', name: 'Mathematics & Computer Applications', code: 'MCA', description: 'Department of Mathematics and Quantitative Sciences' },
  ];

  // 3. Semesters
  const semesters: AcademicSemester[] = [
    { id: 'sem-2026-spring', name: 'Spring 2026', year: 2026, is_current: false },
    { id: 'sem-2026-fall', name: 'Fall 2026', year: 2026, is_current: true },
  ];

  // 4. Classes
  const classes: ClassGroup[] = [
    { id: 'cls-csea-6', name: 'CSE - Section A (Sem 6)', department_id: 'dept-1', semester_id: 'sem-2026-fall', section: 'A' },
    { id: 'cls-cseb-6', name: 'CSE - Section B (Sem 6)', department_id: 'dept-1', semester_id: 'sem-2026-fall', section: 'B' },
    { id: 'cls-ecea-4', name: 'ECE - Section A (Sem 4)', department_id: 'dept-2', semester_id: 'sem-2026-fall', section: 'A' },
  ];

  // 5. Subjects
  const subjects: Subject[] = [
    { id: 'sub-cs601', name: 'Database Management Systems', code: 'CS601', department_id: 'dept-1', credits: 4, description: 'Relational design, normalization, indexing, and SQL/NoSQL transaction theory' },
    { id: 'sub-cs602', name: 'Computer Networks', code: 'CS602', department_id: 'dept-1', credits: 4, description: 'OSI stack, TCP/IP, routing protocols, flow control, and network security' },
    { id: 'sub-cs603', name: 'Web Technologies & Cloud', code: 'CS603', department_id: 'dept-1', credits: 3, description: 'Modern web architecture, REST APIs, cloud deployments, and containerization' },
    { id: 'sub-cs604', name: 'Software Engineering & Agile', code: 'CS604', department_id: 'dept-1', credits: 3, description: 'SDLC, Scrum practices, CI/CD pipelines, and design patterns' },
    { id: 'sub-cs605', name: 'Artificial Intelligence Foundations', code: 'CS605', department_id: 'dept-1', credits: 3, description: 'Search algorithms, probabilistic reasoning, knowledge representation' },
  ];

  // 6. Users & Profiles
  const users: User[] = [
    // Admin
    {
      id: 'usr-admin-1',
      email: 'admin@ssms.edu',
      password_hash: adminPasswordHash,
      role: 'admin',
      full_name: 'Dr. Evelyn Vance',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      phone: '+1 (555) 019-2831',
      status: 'active',
      created_at: '2026-01-10T08:00:00Z',
    },
    // Teachers
    {
      id: 'usr-tch-1',
      email: 'sarah.jenkins@ssms.edu',
      password_hash: teacherPasswordHash,
      role: 'teacher',
      full_name: 'Prof. Sarah Jenkins',
      avatar_url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150',
      phone: '+1 (555) 234-5678',
      status: 'active',
      created_at: '2026-01-15T09:00:00Z',
    },
    {
      id: 'usr-tch-2',
      email: 'robert.chen@ssms.edu',
      password_hash: teacherPasswordHash,
      role: 'teacher',
      full_name: 'Dr. Robert Chen',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '+1 (555) 345-6789',
      status: 'active',
      created_at: '2026-01-15T09:30:00Z',
    },
    {
      id: 'usr-tch-3',
      email: 'priya.sharma@ssms.edu',
      password_hash: teacherPasswordHash,
      role: 'teacher',
      full_name: 'Dr. Priya Sharma',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      phone: '+1 (555) 456-7890',
      status: 'active',
      created_at: '2026-02-01T10:00:00Z',
    },
    {
      id: 'usr-tch-4',
      email: 'david.miller@ssms.edu',
      password_hash: teacherPasswordHash,
      role: 'teacher',
      full_name: 'Prof. David Miller',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '+1 (555) 567-8901',
      status: 'active',
      created_at: '2026-02-01T10:30:00Z',
    },
  ];

  const teacherProfiles: TeacherProfile[] = [
    {
      id: 'tp-1',
      user_id: 'usr-tch-1',
      employee_id: 'EMP-101',
      department_id: 'dept-1',
      designation: 'Associate Professor',
      qualification: 'Ph.D. in Computer Science (MIT)',
      experience_years: 12,
      office_room: 'Tech Block 3, Room 402',
    },
    {
      id: 'tp-2',
      user_id: 'usr-tch-2',
      employee_id: 'EMP-102',
      department_id: 'dept-1',
      designation: 'Professor & HOD',
      qualification: 'Ph.D. in Distributed Computing (Stanford)',
      experience_years: 18,
      office_room: 'Tech Block 3, Room 401',
    },
    {
      id: 'tp-3',
      user_id: 'usr-tch-3',
      employee_id: 'EMP-103',
      department_id: 'dept-1',
      designation: 'Assistant Professor',
      qualification: 'M.Tech, Ph.D. in AI/ML (Georgia Tech)',
      experience_years: 7,
      office_room: 'Tech Block 2, Room 215',
    },
    {
      id: 'tp-4',
      user_id: 'usr-tch-4',
      employee_id: 'EMP-104',
      department_id: 'dept-1',
      designation: 'Senior Lecturer',
      qualification: 'M.S. in Software Systems (CMU)',
      experience_years: 9,
      office_room: 'Tech Block 2, Room 210',
    },
  ];

  const teacherAssignments: TeacherAssignment[] = [
    { id: 'ta-1', teacher_id: 'tp-1', subject_id: 'sub-cs601', class_id: 'cls-csea-6' },
    { id: 'ta-2', teacher_id: 'tp-1', subject_id: 'sub-cs601', class_id: 'cls-cseb-6' },
    { id: 'ta-3', teacher_id: 'tp-2', subject_id: 'sub-cs602', class_id: 'cls-csea-6' },
    { id: 'ta-4', teacher_id: 'tp-3', subject_id: 'sub-cs603', class_id: 'cls-csea-6' },
    { id: 'ta-5', teacher_id: 'tp-4', subject_id: 'sub-cs604', class_id: 'cls-csea-6' },
    { id: 'ta-6', teacher_id: 'tp-3', subject_id: 'sub-cs605', class_id: 'cls-csea-6' },
  ];

  // 7. Seed 22 Students
  const studentNames = [
    { name: 'Alex Morgan', email: 'alex.morgan@student.ssms.edu', reg: 'REG-2026-001', gender: 'male', phone: '+1 (555) 789-0101', emg: '+1 (555) 999-1111', addr: '42 Pine Crest Ave, Seattle, WA', dob: '2004-04-12', bld: 'O+' },
    { name: 'Priya Patel', email: 'priya.patel@student.ssms.edu', reg: 'REG-2026-002', gender: 'female', phone: '+1 (555) 789-0102', emg: '+1 (555) 999-1112', addr: '108 Beacon Hill Way, Seattle, WA', dob: '2004-06-25', bld: 'B+' },
    { name: 'Marcus Wright', email: 'marcus.wright@student.ssms.edu', reg: 'REG-2026-003', gender: 'male', phone: '+1 (555) 789-0103', emg: '+1 (555) 999-1113', addr: '710 University Blvd, Seattle, WA', dob: '2003-11-08', bld: 'A+' },
    { name: 'Elena Rostova', email: 'elena.rostova@student.ssms.edu', reg: 'REG-2026-004', gender: 'female', phone: '+1 (555) 789-0104', emg: '+1 (555) 999-1114', addr: '33 Magnolia St, Bellevue, WA', dob: '2004-01-19', bld: 'AB+' },
    { name: 'Jordan Lee', email: 'jordan.lee@student.ssms.edu', reg: 'REG-2026-005', gender: 'male', phone: '+1 (555) 789-0105', emg: '+1 (555) 999-1115', addr: '822 Maple Grove Dr, Redmond, WA', dob: '2004-08-30', bld: 'O-' },
    { name: 'Chloe Bennett', email: 'chloe.bennett@student.ssms.edu', reg: 'REG-2026-006', gender: 'female', phone: '+1 (555) 789-0106', emg: '+1 (555) 999-1116', addr: '1540 Cascade Court, Seattle, WA', dob: '2004-03-14', bld: 'A-' },
    { name: 'Devon Ramirez', email: 'devon.ramirez@student.ssms.edu', reg: 'REG-2026-007', gender: 'male', phone: '+1 (555) 789-0107', emg: '+1 (555) 999-1117', addr: '298 Lakeview Terrace, Kirkland, WA', dob: '2003-09-02', bld: 'B-' },
    { name: 'Aisha Al-Mansoor', email: 'aisha.mansoor@student.ssms.edu', reg: 'REG-2026-008', gender: 'female', phone: '+1 (555) 789-0108', emg: '+1 (555) 999-1118', addr: '512 Cedar Heights, Seattle, WA', dob: '2004-05-18', bld: 'O+' },
    { name: 'Ethan Hawke', email: 'ethan.hawke@student.ssms.edu', reg: 'REG-2026-009', gender: 'male', phone: '+1 (555) 789-0109', emg: '+1 (555) 999-1119', addr: '620 Olympic View, Bellevue, WA', dob: '2004-07-22', bld: 'A+' },
    { name: 'Sophia Chen', email: 'sophia.chen@student.ssms.edu', reg: 'REG-2026-010', gender: 'female', phone: '+1 (555) 789-0110', emg: '+1 (555) 999-1120', addr: '88 Evergreen Way, Seattle, WA', dob: '2004-02-11', bld: 'AB-' },
    { name: 'Liam O’Connor', email: 'liam.oconnor@student.ssms.edu', reg: 'REG-2026-011', gender: 'male', phone: '+1 (555) 789-0111', emg: '+1 (555) 999-1121', addr: '401 Pacific Highway, Tacoma, WA', dob: '2003-12-05', bld: 'B+' },
    { name: 'Maya Lin', email: 'maya.lin@student.ssms.edu', reg: 'REG-2026-012', gender: 'female', phone: '+1 (555) 789-0112', emg: '+1 (555) 999-1122', addr: '730 Rainier Ave, Seattle, WA', dob: '2004-10-09', bld: 'O+' },
    { name: 'Noah Goldberg', email: 'noah.goldberg@student.ssms.edu', reg: 'REG-2026-013', gender: 'male', phone: '+1 (555) 789-0113', emg: '+1 (555) 999-1123', addr: '190 Summit Ave, Seattle, WA', dob: '2004-04-03', bld: 'A+' },
    { name: 'Zara Washington', email: 'zara.washington@student.ssms.edu', reg: 'REG-2026-014', gender: 'female', phone: '+1 (555) 789-0114', emg: '+1 (555) 999-1124', addr: '344 Meridian Ave, Kirkland, WA', dob: '2003-08-16', bld: 'O-' },
    { name: 'Lucas Silva', email: 'lucas.silva@student.ssms.edu', reg: 'REG-2026-015', gender: 'male', phone: '+1 (555) 789-0115', emg: '+1 (555) 999-1125', addr: '811 Harbor Steps, Seattle, WA', dob: '2004-09-29', bld: 'B+' },
    { name: 'Hannah Schmidt', email: 'hannah.schmidt@student.ssms.edu', reg: 'REG-2026-016', gender: 'female', phone: '+1 (555) 789-0116', emg: '+1 (555) 999-1126', addr: '502 Westlake Ave, Seattle, WA', dob: '2004-01-08', bld: 'A+' },
    { name: 'Rohan Mehra', email: 'rohan.mehra@student.ssms.edu', reg: 'REG-2026-017', gender: 'male', phone: '+1 (555) 789-0117', emg: '+1 (555) 999-1127', addr: '915 Green Lake Way, Seattle, WA', dob: '2004-06-14', bld: 'O+' },
    { name: 'Emily Watson', email: 'emily.watson@student.ssms.edu', reg: 'REG-2026-018', gender: 'female', phone: '+1 (555) 789-0118', emg: '+1 (555) 999-1128', addr: '224 Queen Anne Rd, Seattle, WA', dob: '2003-10-31', bld: 'AB+' },
    { name: 'Carlos Gutierrez', email: 'carlos.gutierrez@student.ssms.edu', reg: 'REG-2026-019', gender: 'male', phone: '+1 (555) 789-0119', emg: '+1 (555) 999-1129', addr: '670 Capitol Hill Dr, Seattle, WA', dob: '2004-05-02', bld: 'B+' },
    { name: 'Grace Kim', email: 'grace.kim@student.ssms.edu', reg: 'REG-2026-020', gender: 'female', phone: '+1 (555) 789-0120', emg: '+1 (555) 999-1130', addr: '1120 Broadway East, Seattle, WA', dob: '2004-07-07', bld: 'O+' },
    { name: 'Tariq Hussain', email: 'tariq.hussain@student.ssms.edu', reg: 'REG-2026-021', gender: 'male', phone: '+1 (555) 789-0121', emg: '+1 (555) 999-1131', addr: '419 Alki Ave SW, Seattle, WA', dob: '2003-09-17', bld: 'A-' },
    { name: 'Zoe Kravitz', email: 'zoe.kravitz@student.ssms.edu', reg: 'REG-2026-022', gender: 'female', phone: '+1 (555) 789-0122', emg: '+1 (555) 999-1132', addr: '305 Fremont Ave N, Seattle, WA', dob: '2004-11-20', bld: 'B+' },
  ];

  const studentProfiles: StudentProfile[] = [];

  studentNames.forEach((s, idx) => {
    const userId = `usr-std-${idx + 1}`;
    const studentProfileId = `sp-${idx + 1}`;
    // Assign 18 to CSE-A, 4 to CSE-B
    const classId = idx < 18 ? 'cls-csea-6' : 'cls-cseb-6';

    users.push({
      id: userId,
      email: s.email,
      password_hash: studentPasswordHash,
      role: 'student',
      full_name: s.name,
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + idx * 100000}?w=150`,
      phone: s.phone,
      status: 'active',
      created_at: '2026-02-10T08:00:00Z',
    });

    studentProfiles.push({
      id: studentProfileId,
      user_id: userId,
      register_number: s.reg,
      department_id: 'dept-1',
      class_id: classId,
      semester: 6,
      enrollment_year: 2023,
      emergency_contact: s.emg,
      address: s.addr,
      date_of_birth: s.dob,
      blood_group: s.bld,
    });
  });

  // 8. Timetable
  const timetableEntries: TimetableEntry[] = [
    // Monday
    { id: 'tt-1', class_id: 'cls-csea-6', subject_id: 'sub-cs601', teacher_id: 'tp-1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', room: 'Lab 4B' },
    { id: 'tt-2', class_id: 'cls-csea-6', subject_id: 'sub-cs602', teacher_id: 'tp-2', day_of_week: 'Monday', start_time: '10:15', end_time: '11:15', room: 'Lecture Hall 101' },
    { id: 'tt-3', class_id: 'cls-csea-6', subject_id: 'sub-cs603', teacher_id: 'tp-3', day_of_week: 'Monday', start_time: '11:30', end_time: '12:30', room: 'Lecture Hall 101' },
    { id: 'tt-4', class_id: 'cls-csea-6', subject_id: 'sub-cs604', teacher_id: 'tp-4', day_of_week: 'Monday', start_time: '13:30', end_time: '15:30', room: 'Software Studio 2' },
    // Tuesday
    { id: 'tt-5', class_id: 'cls-csea-6', subject_id: 'sub-cs605', teacher_id: 'tp-3', day_of_week: 'Tuesday', start_time: '09:00', end_time: '10:00', room: 'Lecture Hall 101' },
    { id: 'tt-6', class_id: 'cls-csea-6', subject_id: 'sub-cs601', teacher_id: 'tp-1', day_of_week: 'Tuesday', start_time: '10:15', end_time: '11:15', room: 'Lecture Hall 101' },
    { id: 'tt-7', class_id: 'cls-csea-6', subject_id: 'sub-cs602', teacher_id: 'tp-2', day_of_week: 'Tuesday', start_time: '11:30', end_time: '12:30', room: 'Network Lab 3' },
    // Wednesday
    { id: 'tt-8', class_id: 'cls-csea-6', subject_id: 'sub-cs603', teacher_id: 'tp-3', day_of_week: 'Wednesday', start_time: '09:00', end_time: '11:00', room: 'Cloud Innovation Lab' },
    { id: 'tt-9', class_id: 'cls-csea-6', subject_id: 'sub-cs604', teacher_id: 'tp-4', day_of_week: 'Wednesday', start_time: '11:15', end_time: '12:15', room: 'Lecture Hall 101' },
    { id: 'tt-10', class_id: 'cls-csea-6', subject_id: 'sub-cs605', teacher_id: 'tp-3', day_of_week: 'Wednesday', start_time: '13:30', end_time: '14:30', room: 'Lecture Hall 102' },
    // Thursday
    { id: 'tt-11', class_id: 'cls-csea-6', subject_id: 'sub-cs601', teacher_id: 'tp-1', day_of_week: 'Thursday', start_time: '09:00', end_time: '11:00', room: 'Database Lab 1' },
    { id: 'tt-12', class_id: 'cls-csea-6', subject_id: 'sub-cs602', teacher_id: 'tp-2', day_of_week: 'Thursday', start_time: '11:15', end_time: '12:15', room: 'Lecture Hall 101' },
    { id: 'tt-13', class_id: 'cls-csea-6', subject_id: 'sub-cs605', teacher_id: 'tp-3', day_of_week: 'Thursday', start_time: '13:30', end_time: '14:30', room: 'Lecture Hall 101' },
    // Friday
    { id: 'tt-14', class_id: 'cls-csea-6', subject_id: 'sub-cs604', teacher_id: 'tp-4', day_of_week: 'Friday', start_time: '09:00', end_time: '10:00', room: 'Lecture Hall 101' },
    { id: 'tt-15', class_id: 'cls-csea-6', subject_id: 'sub-cs603', teacher_id: 'tp-3', day_of_week: 'Friday', start_time: '10:15', end_time: '11:15', room: 'Lecture Hall 101' },
    { id: 'tt-16', class_id: 'cls-csea-6', subject_id: 'sub-cs601', teacher_id: 'tp-1', day_of_week: 'Friday', start_time: '11:30', end_time: '12:30', room: 'Lecture Hall 101' },
  ];

  // 9. Attendance Sessions & Records
  const attendanceSessions: AttendanceSession[] = [];
  const attendanceRecords: AttendanceRecord[] = [];

  // Generate sessions for past 15 days across CSE-A subjects
  const sampleDates = [
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16',
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23',
    '2026-10-26', '2026-10-27', '2026-10-28',
  ];

  let sessIdx = 1;
  let recIdx = 1;

  sampleDates.forEach((date) => {
    // Session 1: DBMS (tp-1)
    const sId1 = `sess-${sessIdx++}`;
    attendanceSessions.push({
      id: sId1,
      class_id: 'cls-csea-6',
      subject_id: 'sub-cs601',
      teacher_id: 'tp-1',
      date,
      period: 1,
      created_at: `${date}T09:05:00Z`,
    });

    // Session 2: Networks (tp-2)
    const sId2 = `sess-${sessIdx++}`;
    attendanceSessions.push({
      id: sId2,
      class_id: 'cls-csea-6',
      subject_id: 'sub-cs602',
      teacher_id: 'tp-2',
      date,
      period: 2,
      created_at: `${date}T10:20:00Z`,
    });

    // Populate records for first 18 students (enrolled in CSE-A)
    for (let i = 0; i < 18; i++) {
      const student = studentProfiles[i];
      // Generate realistic attendance: Alex Morgan has ~92%, Devon Ramirez has ~68% (triggering warning!), others vary 80-95%
      let status1: 'present' | 'absent' | 'leave' = 'present';
      let status2: 'present' | 'absent' | 'leave' = 'present';

      if (student.register_number === 'REG-2026-007') {
        // Devon has lower attendance to demonstrate warnings
        status1 = (i + sessIdx) % 3 === 0 ? 'absent' : 'present';
        status2 = (i + sessIdx) % 2 === 0 ? 'absent' : 'present';
      } else if (student.register_number === 'REG-2026-001') {
        // Alex Morgan: only missed one session with approved leave
        if (date === '2026-10-15') {
          status1 = 'leave';
          status2 = 'leave';
        }
      } else {
        if ((i + sessIdx) % 7 === 0) status1 = 'absent';
        if ((i + sessIdx) % 11 === 0) status2 = 'leave';
      }

      attendanceRecords.push({
        id: `rec-${recIdx++}`,
        session_id: sId1,
        student_id: student.id,
        status: status1,
        remarks: status1 === 'leave' ? 'Medical leave slip submitted' : undefined,
      });

      attendanceRecords.push({
        id: `rec-${recIdx++}`,
        session_id: sId2,
        student_id: student.id,
        status: status2,
        remarks: status2 === 'leave' ? 'College sports meet representation' : undefined,
      });
    }
  });

  // 10. Assessments & Marks
  const assessments: Assessment[] = [
    {
      id: 'asm-1',
      title: 'Internal Assessment 1 - DBMS',
      subject_id: 'sub-cs601',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-1',
      type: 'internal_1',
      max_marks: 50,
      date: '2026-09-25',
    },
    {
      id: 'asm-2',
      title: 'Internal Assessment 2 - Relational Normalization & SQL',
      subject_id: 'sub-cs601',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-1',
      type: 'internal_2',
      max_marks: 50,
      date: '2026-10-20',
    },
    {
      id: 'asm-3',
      title: 'Mid-Term Exam - Computer Networks',
      subject_id: 'sub-cs602',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-2',
      type: 'exam',
      max_marks: 100,
      date: '2026-10-15',
    },
    {
      id: 'asm-4',
      title: 'Cloud Architecture & Web Services Test',
      subject_id: 'sub-cs603',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-3',
      type: 'quiz',
      max_marks: 25,
      date: '2026-10-05',
    },
    {
      id: 'asm-5',
      title: 'Agile & DevOps Practical Assessment',
      subject_id: 'sub-cs604',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-4',
      type: 'assignment',
      max_marks: 50,
      date: '2026-10-10',
    },
  ];

  const marks: Mark[] = [];
  let markIdx = 1;

  assessments.forEach((asm) => {
    for (let i = 0; i < 18; i++) {
      const student = studentProfiles[i];
      let score = Math.round(asm.max_marks * (0.65 + ((i * 7 + 13) % 30) / 100));
      if (student.register_number === 'REG-2026-001') {
        score = Math.round(asm.max_marks * 0.94); // Alex Morgan does great
      } else if (student.register_number === 'REG-2026-002') {
        score = Math.round(asm.max_marks * 0.89);
      }
      if (score > asm.max_marks) score = asm.max_marks;

      marks.push({
        id: `mrk-${markIdx++}`,
        assessment_id: asm.id,
        student_id: student.id,
        marks_obtained: score,
        feedback: score >= asm.max_marks * 0.9 ? 'Outstanding conceptual clarity and execution.' : score >= asm.max_marks * 0.75 ? 'Good performance. Review query optimization techniques.' : 'Needs improvement on edge cases.',
      });
    }
  });

  // 11. Assignments & Submissions
  const assignments: Assignment[] = [
    {
      id: 'asg-1',
      title: 'Distributed Transactions & 2PC Simulation',
      description: 'Implement a two-phase commit protocol simulation demonstrating coordinator recovery and participant timeout handling.',
      subject_id: 'sub-cs601',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-1',
      issue_date: '2026-10-10',
      due_date: '2026-11-05',
      max_score: 100,
    },
    {
      id: 'asg-2',
      title: 'TCP Congestion Control & Bufferbloat Analysis',
      description: 'Simulate Tahoe, Reno, and BBR algorithms under varying packet loss and latency. Provide throughput-delay plots.',
      subject_id: 'sub-cs602',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-2',
      issue_date: '2026-10-12',
      due_date: '2026-10-25',
      max_score: 50,
    },
    {
      id: 'asg-3',
      title: 'Containerized Microservices CI/CD Pipeline',
      description: 'Build a Dockerized multi-tier web application with automated GitHub Actions testing and health check endpoints.',
      subject_id: 'sub-cs603',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-3',
      issue_date: '2026-10-15',
      due_date: '2026-11-10',
      max_score: 100,
    },
    {
      id: 'asg-4',
      title: 'Heuristic Search & A* Pathfinding Benchmark',
      description: 'Implement A* search with Euclidean and Manhattan heuristics. Compare nodes expanded on 50x50 grid mazes.',
      subject_id: 'sub-cs605',
      class_id: 'cls-csea-6',
      teacher_id: 'tp-3',
      issue_date: '2026-10-20',
      due_date: '2026-11-12',
      max_score: 50,
    },
  ];

  const submissions: AssignmentSubmission[] = [
    // Submissions for Alex Morgan (sp-1)
    {
      id: 'subm-1',
      assignment_id: 'asg-2',
      student_id: 'sp-1',
      file_name: 'alex_morgan_tcp_analysis.pdf',
      file_path: '/uploads/alex_morgan_tcp_analysis.pdf',
      submitted_at: '2026-10-24T18:30:00Z',
      status: 'evaluated',
      score: 48,
      feedback: 'Excellent comparison plots and thorough evaluation of BBR vs Reno.',
      evaluated_at: '2026-10-26T14:00:00Z',
    },
    {
      id: 'subm-2',
      assignment_id: 'asg-1',
      student_id: 'sp-1',
      file_name: 'alex_morgan_2pc_simulation.zip',
      file_path: '/uploads/alex_morgan_2pc_simulation.zip',
      submitted_at: '2026-10-28T11:15:00Z',
      status: 'submitted',
    },
    // Submissions from Priya Patel (sp-2)
    {
      id: 'subm-3',
      assignment_id: 'asg-2',
      student_id: 'sp-2',
      file_name: 'priya_patel_tcp_reno.pdf',
      file_path: '/uploads/priya_patel_tcp_reno.pdf',
      submitted_at: '2026-10-25T20:10:00Z',
      status: 'evaluated',
      score: 45,
      feedback: 'Very solid implementation and accurate mathematical analysis.',
      evaluated_at: '2026-10-26T15:20:00Z',
    },
    // Submissions from Marcus Wright (sp-3)
    {
      id: 'subm-4',
      assignment_id: 'asg-2',
      student_id: 'sp-3',
      file_name: 'marcus_tcp_report.pdf',
      file_path: '/uploads/marcus_tcp_report.pdf',
      submitted_at: '2026-10-26T02:00:00Z',
      status: 'late',
      score: 40,
      feedback: 'Submitted after the midnight deadline, but great technical content.',
      evaluated_at: '2026-10-26T16:00:00Z',
    },
  ];

  // 12. Announcements
  const announcements: Announcement[] = [
    {
      id: 'ann-1',
      title: 'End-Semester Examination Schedule Published',
      content: 'The official timetable for Fall 2026 End-Semester Examinations is now finalized. Examinations commence on December 1st, 2026. Hall tickets will be issued starting November 20th.',
      category: 'exam',
      target_role: 'all',
      author_id: 'usr-admin-1',
      author_name: 'Dr. Evelyn Vance',
      author_role: 'admin',
      created_at: '2026-10-25T10:00:00Z',
      is_archived: false,
    },
    {
      id: 'ann-2',
      title: 'Guest Lecture: Scalable Microservices Architecture',
      content: 'We are thrilled to host Dr. Liam Ross, Principal Infrastructure Architect at CloudScale Inc., this Friday at 3:00 PM in Main Auditorium. Attendance is recommended for all CSE Sem 6 students.',
      category: 'academic',
      target_role: 'students',
      target_class_id: 'cls-csea-6',
      author_id: 'usr-tch-1',
      author_name: 'Prof. Sarah Jenkins',
      author_role: 'teacher',
      created_at: '2026-10-27T08:30:00Z',
      is_archived: false,
    },
    {
      id: 'ann-3',
      title: 'Annual Hackathon SSMS HackCon 2026 Registration Open',
      content: 'SSMS HackCon registration is open until November 8. Prizes worth $10,000 to be won across Web3, AI in Healthcare, and Sustainable Computing tracks.',
      category: 'college',
      target_role: 'all',
      author_id: 'usr-admin-1',
      author_name: 'Dr. Evelyn Vance',
      author_role: 'admin',
      created_at: '2026-10-22T14:00:00Z',
      is_archived: false,
    },
    {
      id: 'ann-4',
      title: 'Database Lab Project Demonstration Guidelines',
      content: 'All lab teams must ensure schema dumps and Postman collections are pushed to your team repositories prior to Friday demonstration slots.',
      category: 'academic',
      target_role: 'class',
      target_class_id: 'cls-csea-6',
      author_id: 'usr-tch-1',
      author_name: 'Prof. Sarah Jenkins',
      author_role: 'teacher',
      created_at: '2026-10-28T16:00:00Z',
      is_archived: false,
    },
  ];

  // 13. Notifications
  const notifications: Notification[] = [
    {
      id: 'notif-1',
      user_id: 'usr-std-1', // Alex Morgan
      title: 'Assignment Graded',
      message: 'Prof. Robert Chen graded your assignment "TCP Congestion Control & Bufferbloat Analysis" with score 48/50.',
      type: 'marks',
      is_read: false,
      link: '/student/assignments',
      created_at: '2026-10-26T14:05:00Z',
    },
    {
      id: 'notif-2',
      user_id: 'usr-std-1',
      title: 'Upcoming Assignment Deadline',
      message: 'Assignment "Distributed Transactions & 2PC Simulation" is due on November 5th.',
      type: 'assignment',
      is_read: false,
      link: '/student/assignments',
      created_at: '2026-10-28T09:00:00Z',
    },
    {
      id: 'notif-3',
      user_id: 'usr-std-1',
      title: 'Exam Schedule Announced',
      message: 'The schedule for Fall 2026 examinations has been published by the administration.',
      type: 'exam',
      is_read: true,
      link: '/student/notifications',
      created_at: '2026-10-25T10:05:00Z',
    },
    {
      id: 'notif-4',
      user_id: 'usr-std-7', // Devon Ramirez (Low Attendance Warning)
      title: 'Low Attendance Alert',
      message: 'Your overall attendance is currently at 68%, which falls below the mandatory 75% threshold.',
      type: 'attendance',
      is_read: false,
      link: '/student/attendance',
      created_at: '2026-10-28T17:00:00Z',
    },
    {
      id: 'notif-5',
      user_id: 'usr-tch-1', // Prof. Sarah Jenkins
      title: 'New Assignment Submissions',
      message: '14 new submissions received for "Distributed Transactions & 2PC Simulation".',
      type: 'assignment',
      is_read: false,
      link: '/teacher/assignments',
      created_at: '2026-10-28T12:00:00Z',
    },
  ];

  // 14. Study Tasks & Skills (for Alex Morgan and students)
  const studyTasks: StudyTask[] = [
    {
      id: 'tsk-1',
      student_id: 'sp-1',
      title: 'Finish 2PC Coordinator Recovery Test Cases',
      description: 'Write unit tests simulating network partitions and timeout handling.',
      subject_id: 'sub-cs601',
      priority: 'high',
      due_date: '2026-11-03',
      is_completed: false,
      created_at: '2026-10-26T11:00:00Z',
    },
    {
      id: 'tsk-2',
      student_id: 'sp-1',
      title: 'Revise B-Tree & LSM Tree Index Mechanics',
      description: 'Prepare summary notes comparing write amplification vs read latency.',
      subject_id: 'sub-cs601',
      priority: 'medium',
      due_date: '2026-11-08',
      is_completed: true,
      created_at: '2026-10-20T10:00:00Z',
    },
    {
      id: 'tsk-3',
      student_id: 'sp-1',
      title: 'Review Chapter 5 of Peterson & Davie on BGP Routing',
      description: 'Focus on AS path attributes, multi-homing policies, and route reflection.',
      subject_id: 'sub-cs602',
      priority: 'low',
      due_date: '2026-11-10',
      is_completed: false,
      created_at: '2026-10-27T15:00:00Z',
    },
  ];

  const skills: SkillCertification[] = [
    {
      id: 'sk-1',
      student_id: 'sp-1',
      title: 'AWS Certified Solutions Architect - Associate',
      category: 'certification',
      organization: 'Amazon Web Services',
      issue_date: '2026-05-15',
      credential_url: 'https://aws.amazon.com/verification',
      status: 'completed',
    },
    {
      id: 'sk-2',
      student_id: 'sp-1',
      title: 'Full Stack Distributed Task Queue with Redis',
      category: 'project',
      organization: 'Self-Directed / GitHub Open Source',
      issue_date: '2026-08-10',
      credential_url: 'https://github.com/alexmorgan/distributed-queue',
      status: 'completed',
    },
    {
      id: 'sk-3',
      student_id: 'sp-1',
      title: 'Software Engineering Intern',
      category: 'internship',
      organization: 'Stripe Payments Infrastructure',
      issue_date: '2026-06-01',
      status: 'completed',
    },
    {
      id: 'sk-4',
      student_id: 'sp-1',
      title: 'Deep Learning Specialization (Andrew Ng)',
      category: 'certification',
      organization: 'DeepLearning.AI / Coursera',
      status: 'in_progress',
    },
  ];

  // 15. Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      user_id: 'usr-admin-1',
      user_email: 'admin@ssms.edu',
      action: 'SYSTEM_INITIALIZE',
      entity_type: 'SYSTEM',
      entity_id: 'system',
      details: 'Initial system provisioning and academic session activation',
      ip_address: '127.0.0.1',
      created_at: '2026-10-01T08:00:00Z',
    },
    {
      id: 'aud-2',
      user_id: 'usr-tch-1',
      user_email: 'sarah.jenkins@ssms.edu',
      action: 'ATTENDANCE_RECORDED',
      entity_type: 'ATTENDANCE',
      entity_id: 'sess-1',
      details: 'Marked attendance for CSE-A, Subject: CS601, Period: 1',
      ip_address: '10.0.4.12',
      created_at: '2026-10-12T09:05:00Z',
    },
    {
      id: 'aud-3',
      user_id: 'usr-tch-1',
      user_email: 'sarah.jenkins@ssms.edu',
      action: 'MARKS_PUBLISHED',
      entity_type: 'ASSESSMENT',
      entity_id: 'asm-1',
      details: 'Published marks for Internal Assessment 1 - DBMS',
      ip_address: '10.0.4.12',
      created_at: '2026-09-27T14:30:00Z',
    },
    {
      id: 'aud-4',
      user_id: 'usr-admin-1',
      user_email: 'admin@ssms.edu',
      action: 'ANNOUNCEMENT_CREATED',
      entity_type: 'ANNOUNCEMENT',
      entity_id: 'ann-1',
      details: 'Created announcement: End-Semester Examination Schedule Published',
      ip_address: '127.0.0.1',
      created_at: '2026-10-25T10:00:00Z',
    },
  ];

  return {
    systemSettings,
    departments,
    semesters,
    classes,
    subjects,
    users,
    studentProfiles,
    teacherProfiles,
    teacherAssignments,
    timetableEntries,
    attendanceSessions,
    attendanceRecords,
    assessments,
    marks,
    assignments,
    submissions,
    announcements,
    notifications,
    studyTasks,
    skills,
    auditLogs,
    resetTokens: [] as { email: string; token: string; expires_at: number }[],
  };
}
