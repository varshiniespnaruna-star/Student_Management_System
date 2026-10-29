def test_record_attendance_session(client, teacher_headers):
    payload = {
        'class_id': 1,
        'subject_id': 1,
        'date': '2026-10-29',
        'period': 1,
        'records': [
            {'student_id': 1, 'status': 'present'},
            {'student_id': 2, 'status': 'absent', 'remarks': 'Sick leave'}
        ]
    }
    res = client.post('/api/v1/teachers/attendance', json=payload, headers=teacher_headers)
    assert res.status_code == 201

def test_reject_invalid_attendance_status(client, teacher_headers):
    payload = {
        'class_id': 1,
        'subject_id': 1,
        'date': '2026-10-30',
        'period': 1,
        'records': [{'student_id': 1, 'status': 'invalid_status'}]
    }
    res = client.post('/api/v1/teachers/attendance', json=payload, headers=teacher_headers)
    assert res.status_code == 400

def test_prevent_duplicate_attendance_sessions(client, teacher_headers):
    payload = {
        'class_id': 1,
        'subject_id': 1,
        'date': '2026-10-25',
        'period': 2,
        'records': [{'student_id': 1, 'status': 'present'}]
    }
    res1 = client.post('/api/v1/teachers/attendance', json=payload, headers=teacher_headers)
    assert res1.status_code == 201

    res2 = client.post('/api/v1/teachers/attendance', json=payload, headers=teacher_headers)
    assert res2.status_code == 409

def test_students_cannot_record_attendance(client, student_headers):
    payload = {
        'class_id': 1,
        'subject_id': 1,
        'date': '2026-10-29',
        'period': 3,
        'records': [{'student_id': 1, 'status': 'present'}]
    }
    res = client.post('/api/v1/teachers/attendance', json=payload, headers=student_headers)
    assert res.status_code == 403

def test_student_attendance_calculation(client, teacher_headers, student_headers):
    # Record a session where student 1 is present
    payload = {
        'class_id': 1,
        'subject_id': 1,
        'date': '2026-10-21',
        'period': 1,
        'records': [{'student_id': 1, 'status': 'present'}]
    }
    client.post('/api/v1/teachers/attendance', json=payload, headers=teacher_headers)

    res = client.get('/api/v1/students/attendance', headers=student_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['total_classes'] >= 1
    assert data['attended'] >= 1
    assert data['percentage'] == 100.0
