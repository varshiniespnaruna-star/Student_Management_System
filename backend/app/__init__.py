import os
from datetime import datetime, timedelta
from functools import wraps
import jwt
from flask import Flask, request, jsonify
from flask_cors import CORS
from .models import (
    db, User, Department, AcademicSemester, ClassGroup, Subject,
    StudentProfile, TeacherProfile, TeacherAssignment, AttendanceSession,
    AttendanceRecord, Assessment, Mark, Assignment, AssignmentSubmission,
    TimetableEntry, Announcement, Notification, StudyTask, SkillCertification,
    AuditLog, PasswordResetToken
)

JWT_SECRET = os.getenv('JWT_SECRET', 'flask-ssms-secret-key-2026')

def generate_jwt(user):
    payload = {
        'id': user.id,
        'email': user.email,
        'role': user.role,
        'full_name': user.full_name,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        elif 'token' in request.cookies:
            token = request.cookies.get('token')

        if not token:
            return jsonify({'error': 'Authentication required. Token missing.'}), 401

        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = User.query.get(data['id'])
            if not current_user or current_user.status == 'inactive':
                return jsonify({'error': 'User invalid or inactive.'}), 401
        except Exception:
            return jsonify({'error': 'Token is invalid or expired.'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def roles_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'error': f'Forbidden: Action requires role in {roles}. Your role is {current_user.role}'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

def create_app(test_config=None):
    app = Flask(__name__)
    CORS(app)

    if test_config:
        app.config.update(test_config)
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ssms.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Bad request'}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    # Health
    @app.route('/api/v1/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'app': 'SSMS Flask API'})

    # Auth routes
    @app.route('/api/v1/auth/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401

        if user.status == 'inactive':
            return jsonify({'error': 'Account inactive'}), 403

        token = generate_jwt(user)
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'full_name': user.full_name
            }
        })

    @app.route('/api/v1/auth/me', methods=['GET'])
    @token_required
    def me(current_user):
        return jsonify({
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'role': current_user.role,
                'full_name': current_user.full_name
            }
        })

    @app.route('/api/v1/auth/logout', methods=['POST'])
    @token_required
    def logout(current_user):
        return jsonify({'message': 'Logged out successfully'})

    @app.route('/api/v1/auth/forgot-password', methods=['POST'])
    def forgot_password():
        data = request.get_json() or {}
        email = data.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        user = User.query.filter_by(email=email).first()
        token_str = f"rst_{datetime.utcnow().timestamp()}"
        if user:
            t = PasswordResetToken(
                email=email,
                token=token_str,
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            db.session.add(t)
            db.session.commit()
        return jsonify({'message': 'Reset instructions sent', 'dev_token': token_str})

    @app.route('/api/v1/auth/reset-password', methods=['POST'])
    def reset_password():
        data = request.get_json() or {}
        token = data.get('token')
        new_password = data.get('new_password')
        if not token or not new_password:
            return jsonify({'error': 'Token and new password required'}), 400

        tok = PasswordResetToken.query.filter_by(token=token, used=False).first()
        if not tok or tok.expires_at < datetime.utcnow():
            return jsonify({'error': 'Invalid or expired token'}), 400

        user = User.query.filter_by(email=tok.email).first()
        if user:
            user.set_password(new_password)
            tok.used = True
            db.session.commit()
            return jsonify({'message': 'Password reset successfully'})
        return jsonify({'error': 'User not found'}), 404

    # Students routes
    @app.route('/api/v1/students/profile', methods=['GET'])
    @token_required
    @roles_required('student', 'admin')
    def student_profile(current_user):
        sp = StudentProfile.query.filter_by(user_id=current_user.id).first()
        if not sp:
            return jsonify({'error': 'Profile not found'}), 404
        return jsonify({
            'id': sp.id,
            'register_number': sp.register_number,
            'full_name': current_user.full_name,
            'emergency_contact': sp.emergency_contact,
            'address': sp.address,
            'class_id': sp.class_id,
            'semester': sp.semester
        })

    @app.route('/api/v1/students/profile', methods=['PUT'])
    @token_required
    @roles_required('student', 'admin')
    def update_student_profile(current_user):
        sp = StudentProfile.query.filter_by(user_id=current_user.id).first()
        if not sp:
            return jsonify({'error': 'Profile not found'}), 404
        data = request.get_json() or {}
        # Students CANNOT modify register_number or academic data
        if 'register_number' in data and data['register_number'] != sp.register_number:
            return jsonify({'error': 'Unauthorized modification of register number'}), 403
        if 'emergency_contact' in data:
            sp.emergency_contact = data['emergency_contact']
        if 'address' in data:
            sp.address = data['address']
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'})

    @app.route('/api/v1/students/attendance', methods=['GET'])
    @token_required
    @roles_required('student', 'admin')
    def student_attendance(current_user):
        sp = StudentProfile.query.filter_by(user_id=current_user.id).first()
        if not sp:
            return jsonify({'error': 'Student not found'}), 404
        records = AttendanceRecord.query.filter_by(student_id=sp.id).all()
        total = len(records)
        attended = sum(1 for r in records if r.status == 'present')
        percentage = (attended / total * 100) if total > 0 else 100.0
        return jsonify({
            'total_classes': total,
            'attended': attended,
            'percentage': round(percentage, 1),
            'records': [{'status': r.status, 'remarks': r.remarks} for r in records]
        })

    @app.route('/api/v1/students/academics', methods=['GET'])
    @token_required
    @roles_required('student', 'admin')
    def student_academics(current_user):
        sp = StudentProfile.query.filter_by(user_id=current_user.id).first()
        if not sp:
            return jsonify({'error': 'Student not found'}), 404
        marks = Mark.query.filter_by(student_id=sp.id).all()
        return jsonify({
            'marks': [{'assessment_id': m.assessment_id, 'marks_obtained': m.marks_obtained} for m in marks]
        })

    @app.route('/api/v1/students/assignments', methods=['GET'])
    @token_required
    @roles_required('student', 'admin')
    def student_assignments(current_user):
        sp = StudentProfile.query.filter_by(user_id=current_user.id).first()
        if not sp:
            return jsonify({'error': 'Student not found'}), 404
        assignments = Assignment.query.filter_by(class_id=sp.class_id).all()
        return jsonify({'assignments': [{'id': a.id, 'title': a.title, 'due_date': a.due_date} for a in assignments]})

    @app.route('/api/v1/students/assignments/<int:assignment_id>/submit', methods=['POST'])
    @token_required
    @roles_required('student')
    def submit_assignment(current_user, assignment_id):
        sp = StudentProfile.query.filter_by(user_id=current_user.id).first()
        assignment = Assignment.query.get(assignment_id)
        if not assignment or assignment.class_id != sp.class_id:
            return jsonify({'error': 'Assignment not accessible'}), 403

        data = request.get_json() or {}
        file_name = data.get('file_name')
        if not file_name:
            return jsonify({'error': 'File name required'}), 400

        # Reject disallowed extension (e.g. .exe)
        if file_name.endswith('.exe') or file_name.endswith('.sh'):
            return jsonify({'error': 'Unauthorized file type'}), 400

        sub = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=sp.id,
            file_name=file_name,
            file_path=f"/uploads/{file_name}",
            status='submitted'
        )
        db.session.add(sub)
        db.session.commit()
        return jsonify({'message': 'Submitted successfully', 'submission_id': sub.id}), 201

    @app.route('/api/v1/students/study-tasks', methods=['GET', 'POST'])
    @token_required
    @roles_required('student')
    def study_tasks(current_user):
        sp = StudentProfile.query.filter_by(user_id=current_user.id).first()
        if request.method == 'POST':
            data = request.get_json() or {}
            title = data.get('title')
            if not title:
                return jsonify({'error': 'Title required'}), 400
            task = StudyTask(
                student_id=sp.id,
                title=title,
                priority=data.get('priority', 'medium'),
                due_date=data.get('due_date')
            )
            db.session.add(task)
            db.session.commit()
            return jsonify({'message': 'Task created', 'id': task.id}), 201

        tasks = StudyTask.query.filter_by(student_id=sp.id).all()
        return jsonify({'tasks': [{'id': t.id, 'title': t.title, 'is_completed': t.is_completed} for t in tasks]})

    # Teachers routes
    @app.route('/api/v1/teachers/profile', methods=['GET'])
    @token_required
    @roles_required('teacher', 'admin')
    def teacher_profile(current_user):
        tp = TeacherProfile.query.filter_by(user_id=current_user.id).first()
        if not tp:
            return jsonify({'error': 'Teacher profile not found'}), 404
        return jsonify({
            'employee_id': tp.employee_id,
            'designation': tp.designation,
            'office_room': tp.office_room,
            'full_name': current_user.full_name
        })

    @app.route('/api/v1/teachers/attendance', methods=['POST'])
    @token_required
    @roles_required('teacher', 'admin')
    def teacher_attendance(current_user):
        tp = TeacherProfile.query.filter_by(user_id=current_user.id).first()
        data = request.get_json() or {}
        class_id = data.get('class_id')
        subject_id = data.get('subject_id')
        date = data.get('date')
        period = data.get('period', 1)
        records = data.get('records', [])

        # Check teacher assignment permission
        if current_user.role == 'teacher':
            assigned = TeacherAssignment.query.filter_by(teacher_id=tp.id, class_id=class_id, subject_id=subject_id).first()
            if not assigned:
                return jsonify({'error': 'Teacher not assigned to this class and subject'}), 403

        # Prevent duplicate session for same class, subject, date, period
        existing = AttendanceSession.query.filter_by(class_id=class_id, subject_id=subject_id, date=date, period=period).first()
        if existing:
            return jsonify({'error': 'Duplicate attendance session for this date and period'}), 409

        session = AttendanceSession(
            class_id=class_id,
            subject_id=subject_id,
            teacher_id=tp.id,
            date=date,
            period=period
        )
        db.session.add(session)
        db.session.flush()

        for r in records:
            status = r.get('status')
            if status not in ['present', 'absent', 'leave']:
                return jsonify({'error': f'Invalid status {status}'}), 400
            rec = AttendanceRecord(
                session_id=session.id,
                student_id=r.get('student_id'),
                status=status,
                remarks=r.get('remarks')
            )
            db.session.add(rec)
        db.session.commit()
        return jsonify({'message': 'Attendance saved', 'session_id': session.id}), 201

    @app.route('/api/v1/teachers/marks', methods=['POST'])
    @token_required
    @roles_required('teacher', 'admin')
    def enter_marks(current_user):
        data = request.get_json() or {}
        assessment_id = data.get('assessment_id')
        student_id = data.get('student_id')
        marks_obtained = data.get('marks_obtained')

        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404

        if marks_obtained < 0:
            return jsonify({'error': 'Marks cannot be negative'}), 400

        if marks_obtained > assessment.max_marks:
            return jsonify({'error': 'Marks cannot exceed maximum marks'}), 400

        m = Mark(assessment_id=assessment_id, student_id=student_id, marks_obtained=marks_obtained)
        db.session.add(m)
        db.session.commit()
        return jsonify({'message': 'Marks recorded'}), 201

    @app.route('/api/v1/teachers/grading', methods=['POST'])
    @token_required
    @roles_required('teacher', 'admin')
    def grade_assignment(current_user):
        data = request.get_json() or {}
        submission_id = data.get('submission_id')
        score = data.get('score')
        feedback = data.get('feedback')

        sub = AssignmentSubmission.query.get(submission_id)
        if not sub:
            return jsonify({'error': 'Submission not found'}), 404

        sub.score = score
        sub.feedback = feedback
        sub.status = 'evaluated'
        sub.evaluated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Graded successfully'})

    # Timetable routes
    @app.route('/api/v1/timetable', methods=['GET', 'POST'])
    @token_required
    def timetable_route(current_user):
        if request.method == 'POST':
            if current_user.role not in ['admin']:
                return jsonify({'error': 'Only administrators can modify timetable directly'}), 403
            data = request.get_json() or {}
            class_id = data.get('class_id')
            subject_id = data.get('subject_id')
            teacher_id = data.get('teacher_id')
            day_of_week = data.get('day_of_week')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            room = data.get('room')

            if start_time >= end_time:
                return jsonify({'error': 'Invalid time range'}), 400

            # Conflict detection
            conflict = TimetableEntry.query.filter_by(
                day_of_week=day_of_week,
                start_time=start_time,
                room=room
            ).first()
            if conflict:
                return jsonify({'error': 'Room conflict detected'}), 409

            teacher_conflict = TimetableEntry.query.filter_by(
                day_of_week=day_of_week,
                start_time=start_time,
                teacher_id=teacher_id
            ).first()
            if teacher_conflict:
                return jsonify({'error': 'Teacher double-booking detected'}), 409

            entry = TimetableEntry(
                class_id=class_id, subject_id=subject_id, teacher_id=teacher_id,
                day_of_week=day_of_week, start_time=start_time, end_time=end_time, room=room
            )
            db.session.add(entry)
            db.session.commit()
            return jsonify({'message': 'Timetable entry created', 'id': entry.id}), 201

        entries = TimetableEntry.query.all()
        return jsonify({'timetable': [{'id': e.id, 'day': e.day_of_week, 'start': e.start_time, 'room': e.room} for e in entries]})

    # Announcements routes
    @app.route('/api/v1/announcements', methods=['GET', 'POST'])
    @token_required
    def announcements_route(current_user):
        if request.method == 'POST':
            if current_user.role not in ['admin', 'teacher']:
                return jsonify({'error': 'Unauthorized to publish announcements'}), 403
            data = request.get_json() or {}
            ann = Announcement(
                title=data.get('title'),
                content=data.get('content'),
                category=data.get('category', 'academic'),
                target_role=data.get('target_role', 'all'),
                author_id=current_user.id,
                author_name=current_user.full_name,
                author_role=current_user.role
            )
            db.session.add(ann)
            db.session.commit()
            return jsonify({'message': 'Announcement created', 'id': ann.id}), 201

        announcements = Announcement.query.filter_by(is_archived=False).all()
        return jsonify({'announcements': [{'id': a.id, 'title': a.title} for a in announcements]})

    # Notifications routes
    @app.route('/api/v1/notifications', methods=['GET'])
    @token_required
    def notifications_route(current_user):
        notifs = Notification.query.filter_by(user_id=current_user.id).all()
        unread = sum(1 for n in notifs if not n.is_read)
        return jsonify({'notifications': [{'id': n.id, 'title': n.title, 'is_read': n.is_read} for n in notifs], 'unread_count': unread})

    @app.route('/api/v1/notifications/<int:nid>/read', methods=['POST'])
    @token_required
    def mark_notif_read(current_user, nid):
        notif = Notification.query.filter_by(id=nid, user_id=current_user.id).first()
        if not notif:
            return jsonify({'error': 'Notification not found or access denied'}), 404
        notif.is_read = True
        db.session.commit()
        return jsonify({'message': 'Marked read'})

    # Reports
    @app.route('/api/v1/reports/attendance', methods=['GET'])
    @token_required
    @roles_required('teacher', 'admin')
    def attendance_report(current_user):
        records = AttendanceRecord.query.all()
        return jsonify({'total_records': len(records)})

    @app.route('/api/v1/reports/csv', methods=['GET'])
    @token_required
    @roles_required('teacher', 'admin')
    def csv_report(current_user):
        csv_data = "RegisterNumber,Subject,Status\nREG-001,CS601,Present\nREG-002,CS601,Absent\n"
        return csv_data, 200, {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="report.csv"'}

    # Admin routes
    @app.route('/api/v1/admin/users/<int:uid>/deactivate', methods=['POST'])
    @token_required
    @roles_required('admin')
    def deactivate_user(current_user, uid):
        user = User.query.get(uid)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user.status = 'inactive'
        db.session.commit()
        return jsonify({'message': 'User deactivated'})

    return app
