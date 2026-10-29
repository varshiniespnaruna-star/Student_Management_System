def test_admin_deactivate_user(client, admin_headers):
    # Deactivate student 2 (user id 4)
    res = client.post('/api/v1/admin/users/4/deactivate', headers=admin_headers)
    assert res.status_code == 200

    # Deactivated user cannot log in
    res2 = client.post('/api/v1/auth/login', json={'email': 'student2@ssms.test', 'password': 'Student@123'})
    assert res2.status_code == 403

def test_unauthorized_user_cannot_access_admin(client, student_headers):
    res = client.post('/api/v1/admin/users/4/deactivate', headers=student_headers)
    assert res.status_code == 403
