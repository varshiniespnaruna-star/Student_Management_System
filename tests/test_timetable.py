def test_create_and_retrieve_timetable(client, admin_headers, student_headers):
    # Admin creates timetable slot
    res = client.post('/api/v1/timetable', json={
        'class_id': 1,
        'subject_id': 1,
        'teacher_id': 1,
        'day_of_week': 'Monday',
        'start_time': '09:00',
        'end_time': '10:00',
        'room': 'Lab 101'
    }, headers=admin_headers)
    assert res.status_code == 201

    # Student retrieves
    res2 = client.get('/api/v1/timetable', headers=student_headers)
    assert res2.status_code == 200
    assert len(res2.get_json()['timetable']) >= 1

def test_detect_timetable_room_conflict(client, admin_headers):
    # Create initial slot
    res1 = client.post('/api/v1/timetable', json={
        'class_id': 1,
        'subject_id': 1,
        'teacher_id': 1,
        'day_of_week': 'Monday',
        'start_time': '09:00',
        'end_time': '10:00',
        'room': 'Lab 101'
    }, headers=admin_headers)
    assert res1.status_code == 201

    # Second slot in same room at same time for different class/teacher
    res2 = client.post('/api/v1/timetable', json={
        'class_id': 2,
        'subject_id': 1,
        'teacher_id': 2,
        'day_of_week': 'Monday',
        'start_time': '09:00',
        'end_time': '10:00',
        'room': 'Lab 101'
    }, headers=admin_headers)
    assert res2.status_code == 409

def test_validate_invalid_time_range(client, admin_headers):
    res = client.post('/api/v1/timetable', json={
        'class_id': 1,
        'subject_id': 1,
        'teacher_id': 1,
        'day_of_week': 'Tuesday',
        'start_time': '11:00',
        'end_time': '10:00', # invalid
        'room': 'Lab 102'
    }, headers=admin_headers)
    assert res.status_code == 400
