def test_create_and_retrieve_announcements(client, teacher_headers, student_headers):
    res = client.post('/api/v1/announcements', json={
        'title': 'Midterm Revision Session',
        'content': 'Revision session held this Thursday at 4 PM.',
        'category': 'academic',
        'target_role': 'all'
    }, headers=teacher_headers)
    assert res.status_code == 201

    res2 = client.get('/api/v1/announcements', headers=student_headers)
    assert res2.status_code == 200
    assert len(res2.get_json()['announcements']) >= 1

def test_student_cannot_post_announcements(client, student_headers):
    res = client.post('/api/v1/announcements', json={
        'title': 'Unauthorized Post',
        'content': 'Students cannot create announcements'
    }, headers=student_headers)
    assert res.status_code == 403
