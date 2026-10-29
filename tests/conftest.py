import pytest
from backend.app import create_app
from backend.app.models import (
    db, User, Department, AcademicSemester, ClassGroup, Subject,
    StudentProfile, TeacherProfile, TeacherAssignment, Assessment
)

@pytest.fixture
def app():
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key-ssms'
    }
    app = create_app(test_config)

    with app.app_context():
        db.create_all()

        # Seed test department
        dept = Department(name='Computer Science', code='CSE', description='Computing')
        db.session.add(dept)

        # Semester
        sem = AcademicSemester(name='Fall 2026', year=2026, is_current=True)
        db.session.add(sem)
        db.session.flush()

        # Class
        cls = ClassGroup(name='CSE-A', department_id=dept.id, semester_id=sem.id, section='A')
        db.session.add(cls)

        # Subject
        sub = Subject(name='Database Systems', code='CS601', department_id=dept.id, credits=4)
        db.session.add(sub)
        db.session.flush()

        # Admin user
        admin = User(email='admin@ssms.test', role='admin', full_name='Admin User', status='active')
        admin.set_password('Admin@123')
        db.session.add(admin)

        # Teacher user & profile
        teacher_u = User(email='teacher@ssms.test', role='teacher', full_name='Teacher User', status='active')
        teacher_u.set_password('Teacher@123')
        db.session.add(teacher_u)
        db.session.flush()

        tp = TeacherProfile(
            user_id=teacher_u.id, employee_id='EMP-TEST-1', department_id=dept.id,
            designation='Associate Professor', office_room='Room 101'
        )
        db.session.add(tp)
        db.session.flush()

        # Allocate teacher to subject & class
        ta = TeacherAssignment(teacher_id=tp.id, subject_id=sub.id, class_id=cls.id)
        db.session.add(ta)

        # Assessment
        asm = Assessment(
            title='Midterm Exam', subject_id=sub.id, class_id=cls.id,
            teacher_id=tp.id, type='exam', max_marks=100.0, date='2026-10-15'
        )
        db.session.add(asm)

        # Student user & profile
        student_u = User(email='student@ssms.test', role='student', full_name='Student User', status='active')
        student_u.set_password('Student@123')
        db.session.add(student_u)
        db.session.flush()

        sp = StudentProfile(
            user_id=student_u.id, register_number='REG-TEST-1', department_id=dept.id,
            class_id=cls.id, semester=6, enrollment_year=2023, emergency_contact='+1-555-1234'
        )
        db.session.add(sp)

        # Second student for isolation tests
        student_u2 = User(email='student2@ssms.test', role='student', full_name='Student User 2', status='active')
        student_u2.set_password('Student@123')
        db.session.add(student_u2)
        db.session.flush()

        sp2 = StudentProfile(
            user_id=student_u2.id, register_number='REG-TEST-2', department_id=dept.id,
            class_id=cls.id, semester=6, enrollment_year=2023, emergency_contact='+1-555-5678'
        )
        db.session.add(sp2)

        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def get_auth_token(client, email, password):
    res = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    return res.get_json()['token']

@pytest.fixture
def admin_headers(client):
    token = get_auth_token(client, 'admin@ssms.test', 'Admin@123')
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def teacher_headers(client):
    token = get_auth_token(client, 'teacher@ssms.test', 'Teacher@123')
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def student_headers(client):
    token = get_auth_token(client, 'student@ssms.test', 'Student@123')
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def student2_headers(client):
    token = get_auth_token(client, 'student2@ssms.test', 'Student@123')
    return {'Authorization': f'Bearer {token}'}
