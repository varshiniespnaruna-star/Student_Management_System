def test_successful_login(client):
    res = client.post('/api/v1/auth/login', json={'email': 'student@ssms.test', 'password': 'Student@123'})
    assert res.status_code == 200
    data = res.get_json()
    assert 'token' in data
    assert data['user']['email'] == 'student@ssms.test'
    assert data['user']['role'] == 'student'

def test_invalid_credentials(client):
    res = client.post('/api/v1/auth/login', json={'email': 'student@ssms.test', 'password': 'WrongPassword!'})
    assert res.status_code == 401

def test_missing_fields(client):
    res = client.post('/api/v1/auth/login', json={'email': 'student@ssms.test'})
    assert res.status_code == 400

def test_logout(client, student_headers):
    res = client.post('/api/v1/auth/logout', headers=student_headers)
    assert res.status_code == 200

def test_protected_route_without_token(client):
    res = client.get('/api/v1/auth/me')
    assert res.status_code == 401

def test_expired_or_invalid_token(client):
    res = client.get('/api/v1/auth/me', headers={'Authorization': 'Bearer invalid.token.signature'})
    assert res.status_code == 401

def test_password_reset_flow(client):
    res = client.post('/api/v1/auth/forgot-password', json={'email': 'student@ssms.test'})
    assert res.status_code == 200
    token = res.get_json()['dev_token']

    res2 = client.post('/api/v1/auth/reset-password', json={'token': token, 'new_password': 'NewPassword@2026'})
    assert res2.status_code == 200

    # Try login with new password
    res3 = client.post('/api/v1/auth/login', json={'email': 'student@ssms.test', 'password': 'NewPassword@2026'})
    assert res3.status_code == 200
