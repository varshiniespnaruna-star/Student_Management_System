from backend.app.models import db, Notification

def test_user_notification_flow(client, app, student_headers, student2_headers):
    with app.app_context():
        # Create notification for student 1
        n = Notification(user_id=3, title='Assignment Reminder', message='Submit before midnight', is_read=False)
        db.session.add(n)
        db.session.commit()
        n_id = n.id

    # Student 1 gets notification
    res = client.get('/api/v1/notifications', headers=student_headers)
    assert res.status_code == 200
    assert res.get_json()['unread_count'] == 1

    # Student 2 cannot see student 1 notification
    res2 = client.get('/api/v1/notifications', headers=student2_headers)
    assert res2.status_code == 200
    assert res2.get_json()['unread_count'] == 0

    # Student 1 marks as read
    res3 = client.post(f'/api/v1/notifications/{n_id}/read', headers=student_headers)
    assert res3.status_code == 200

    # Student 2 cannot mark student 1 notification
    res4 = client.post(f'/api/v1/notifications/{n_id}/read', headers=student2_headers)
    assert res4.status_code == 404
