def test_student_study_task_crud(client, student_headers, student2_headers):
    # Student 1 creates task
    res = client.post('/api/v1/students/study-tasks', json={
        'title': 'Read Chapter 4 on B-Trees',
        'priority': 'high',
        'due_date': '2026-11-01'
    }, headers=student_headers)
    assert res.status_code == 201

    # Student 1 lists tasks
    res2 = client.get('/api/v1/students/study-tasks', headers=student_headers)
    assert res2.status_code == 200
    assert len(res2.get_json()['tasks']) == 1

    # Student 2 has zero tasks (private task isolation)
    res3 = client.get('/api/v1/students/study-tasks', headers=student2_headers)
    assert res3.status_code == 200
    assert len(res3.get_json()['tasks']) == 0
