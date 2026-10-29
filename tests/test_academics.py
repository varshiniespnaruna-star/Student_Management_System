def test_enter_marks_validation(client, teacher_headers):
    # Valid mark
    res = client.post('/api/v1/teachers/marks', json={
        'assessment_id': 1,
        'student_id': 1,
        'marks_obtained': 85.0
    }, headers=teacher_headers)
    assert res.status_code == 201

def test_reject_negative_marks(client, teacher_headers):
    res = client.post('/api/v1/teachers/marks', json={
        'assessment_id': 1,
        'student_id': 1,
        'marks_obtained': -5.0
    }, headers=teacher_headers)
    assert res.status_code == 400

def test_reject_marks_exceeding_maximum(client, teacher_headers):
    res = client.post('/api/v1/teachers/marks', json={
        'assessment_id': 1,
        'student_id': 1,
        'marks_obtained': 150.0 # max is 100
    }, headers=teacher_headers)
    assert res.status_code == 400

def test_student_cannot_enter_marks(client, student_headers):
    res = client.post('/api/v1/teachers/marks', json={
        'assessment_id': 1,
        'student_id': 1,
        'marks_obtained': 100.0
    }, headers=student_headers)
    assert res.status_code == 403
