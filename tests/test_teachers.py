def test_teacher_profile_access(client, teacher_headers):
    res = client.get('/api/v1/teachers/profile', headers=teacher_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['employee_id'] == 'EMP-TEST-1'
    assert data['full_name'] == 'Teacher User'

def test_student_cannot_access_teacher_profile(client, student_headers):
    res = client.get('/api/v1/teachers/profile', headers=student_headers)
    assert res.status_code == 403
