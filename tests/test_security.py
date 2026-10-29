def test_unauthenticated_request_rejected(client):
    res = client.get('/api/v1/students/profile')
    assert res.status_code == 401

def test_role_escalation_attempt(client, student_headers):
    # Student attempting to access admin endpoint
    res = client.post('/api/v1/admin/users/1/deactivate', headers=student_headers)
    assert res.status_code == 403

def test_cross_role_access_prevention(client, teacher_headers):
    # Teacher attempting to access student-only study tasks
    res = client.get('/api/v1/students/study-tasks', headers=teacher_headers)
    assert res.status_code == 403

def test_tampered_token_rejected(client):
    res = client.get('/api/v1/auth/me', headers={'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'})
    assert res.status_code == 401
