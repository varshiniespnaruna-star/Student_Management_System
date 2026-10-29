def test_get_student_profile(client, student_headers):
    res = client.get('/api/v1/students/profile', headers=student_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['register_number'] == 'REG-TEST-1'
    assert data['full_name'] == 'Student User'

def test_update_permitted_profile_fields(client, student_headers):
    res = client.put('/api/v1/students/profile', json={
        'emergency_contact': '+1-555-9999',
        'address': '123 Academic Way'
    }, headers=student_headers)
    assert res.status_code == 200

    res2 = client.get('/api/v1/students/profile', headers=student_headers)
    assert res2.get_json()['emergency_contact'] == '+1-555-9999'

def test_prevent_modifying_register_number(client, student_headers):
    res = client.put('/api/v1/students/profile', json={
        'register_number': 'HACKED-REG-999'
    }, headers=student_headers)
    assert res.status_code == 403

def test_student_data_isolation(client, student_headers, student2_headers):
    res1 = client.get('/api/v1/students/profile', headers=student_headers)
    res2 = client.get('/api/v1/students/profile', headers=student2_headers)
    assert res1.get_json()['register_number'] == 'REG-TEST-1'
    assert res2.get_json()['register_number'] == 'REG-TEST-2'
    assert res1.get_json()['id'] != res2.get_json()['id']
