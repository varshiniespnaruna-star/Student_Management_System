from backend.app.models import db, Assignment

def test_assignment_submission_and_evaluation(client, app, student_headers, teacher_headers):
    with app.app_context():
        asg = Assignment(
            title='Test Assignment 1', description='Test instructions',
            subject_id=1, class_id=1, teacher_id=1,
            issue_date='2026-10-10', due_date='2026-11-10', max_score=100.0
        )
        db.session.add(asg)
        db.session.commit()
        asg_id = asg.id

    # Student submits
    res_sub = client.post(f'/api/v1/students/assignments/{asg_id}/submit', json={
        'file_name': 'my_submission.pdf'
    }, headers=student_headers)
    assert res_sub.status_code == 201
    sub_id = res_sub.get_json()['submission_id']

    # Teacher grades
    res_grade = client.post('/api/v1/teachers/grading', json={
        'submission_id': sub_id,
        'score': 95.0,
        'feedback': 'Excellent work'
    }, headers=teacher_headers)
    assert res_grade.status_code == 200

def test_reject_unauthorized_file_types(client, app, student_headers):
    with app.app_context():
        asg = Assignment(
            title='Test Assignment 2', description='Instructions',
            subject_id=1, class_id=1, teacher_id=1,
            issue_date='2026-10-10', due_date='2026-11-10'
        )
        db.session.add(asg)
        db.session.commit()
        asg_id = asg.id

    res = client.post(f'/api/v1/students/assignments/{asg_id}/submit', json={
        'file_name': 'malicious.exe'
    }, headers=student_headers)
    assert res.status_code == 400
