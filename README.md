# Smart Student Management System (SSMS)

A production-grade, full-stack **Smart Student Management System (SSMS)** with Role-Based Access Control (RBAC) designed for academic institutions, faculty, and students. Built with React 19, TypeScript, Express, Vite, and Tailwind CSS, featuring automated conflict detection, GPA calculation, analytics, and a companion Python Flask backend with a 14-file Pytest test suite.

---

## 🎯 Key Features & Modules

### 1. Authentication & Security
- **JWT-Based Authentication** with cookie and Bearer token support.
- **Role-Based Access Control (RBAC)** strictly partitioning `student`, `teacher`, and `admin` routes.
- **Self-Service Password Recovery** with security questions, reset tokens, and simulated delivery.
- **Demo Quick-Switcher** allowing instant switching between demo personas.

### 2. Student Portal (Exactly 8 Pages)
1. **Overview (`/student/dashboard`)**: GPA gauge, attendance ring, upcoming assignment countdowns, today's schedule, and recent notices.
2. **My Profile (`/student/profile`)**: Academic credentials, contact details, emergency contacts, blood group, and self-service editor.
3. **My Attendance (`/student/attendance`)**: Overall attendance %, subject-wise breakdown, attendance status badges (`present`, `absent`, `late`, `excused`), and warning thresholds.
4. **Academics & Marks (`/student/academics`)**: Cumulative GPA (10.0 scale), semester-wise grade trends, internal tests vs. final exam breakdowns, and faculty feedback.
5. **My Assignments (`/student/assignments`)**: Active deadlines, submission status, grade review, and file upload simulated submissions.
6. **My Timetable (`/student/timetable`)**: Weekly schedule matrix (Monday–Friday) with rooms, professors, and subject codes.
7. **Announcements & Notifications (`/student/notifications`)**: Official institutional bulletins, filter by category (exam, academic, events), and interactive unread badge counters.
8. **Study Planner & Skills (`/student/study-planner`)**: To-do study planner with priority tags and skill/certification showcase.

### 3. Faculty Portal (Exactly 8 Pages)
1. **Overview (`/teacher/dashboard`)**: Metrics on assigned classes, active students, pending assignment submissions, and quick actions.
2. **Teacher Profile (`/teacher/profile`)**: Employee ID, designation, office location, research background, and assigned classes.
3. **Student Directory (`/teacher/students`)**: Search and filter students across assigned classes with academic warning flags.
4. **Attendance Management (`/teacher/attendance`)**: Date & lecture selector, 1-click batch status toggles (Mark All Present, Absent), and persistence.
5. **Marks Management (`/teacher/marks`)**: Gradebook grid for Internal Assessment 1 & 2, Midterm, and Semester Finals with automatic grade classification.
6. **Assignment Portal (`/teacher/assignments`)**: Create new assignments with deadlines and review/grade student submissions with feedback.
7. **Timetable & Schedule (`/teacher/timetable`)**: Daily and weekly faculty schedule with classroom allocations.
8. **Announcements & Reports (`/teacher/announcements`)**: Publish announcements targeted to classes/all students and generate downloadable PDF/CSV grade and attendance reports.

### 4. Administration Module (6 Pages)
1. **Overview (`/admin/dashboard`)**: Institutional metrics (total students, faculty, classes, average attendance, system status).
2. **User Accounts (`/admin/users`)**: Create students/teachers/admins, toggle active/inactive status, and administrative password resets.
3. **Academic Structure (`/admin/academic`)**: Manage departments, classes, subjects, credits, and faculty course allocations.
4. **Timetable Master (`/admin/timetable`)**: Complete timetable grid with real-time room, teacher, and class conflict detection.
5. **System Settings (`/admin/settings`)**: Configurable attendance alert threshold (e.g., 75%), grading rules, academic year, and database reseed tool.
6. **Audit Logs (`/admin/audit-logs`)**: Immutable security audit trail of authentication events, grade modifications, attendance sessions, and CSV export.

---

## 👥 Demo Credentials

| Role | Email | Password | Details |
|---|---|---|---|
| **Administrator** | `admin@ssms.edu` | `Admin@123` | Full administrative control |
| **Teacher** | `sarah.jenkins@ssms.edu` | `Teacher@123` | Faculty member (CSE) |
| **Student** | `alex.morgan@student.ssms.edu` | `Student@123` | Final year CSE student |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS 4, Lucide React, Recharts.
- **Backend (Node.js/Express)**: Express 4, tsx, JWT (`jsonwebtoken`), `bcryptjs`, `multer`, file-based JSON database with automatic persistence (`.ssms_data.json`).
- **Companion Backend (Python/Flask)**: Flask, SQLAlchemy, PyJWT, Werkzeug.
- **Testing**: 14 Pytest test files covering authentication, RBAC, attendance, grading, timetable conflicts, reports, and security audit logs.

---

## 🚀 Running the Application

### 1. Dev Server (Frontend + Express API)
```bash
npm run dev
```
The server runs on **port 3000** hosting both the `/api/v1` backend endpoints and the Vite development server.

### 2. Pytest Test Suite
To execute the automated Python test suite:
```bash
python3 -m pytest tests/ -v
```
All 14 test files validate the application logic with 100% pass rate.
