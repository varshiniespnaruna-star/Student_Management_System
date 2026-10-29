def test_attendance_report(client, teacher_headers):
    res = client.get('/api/v1/reports/attendance', headers=teacher_headers)
    assert res.status_code == 200

def test_csv_report_export(client, teacher_headers):
    res = client.get('/api/v1/reports/csv', headers=teacher_headers)
    assert res.status_code == 200
    assert 'text/csv' in res.content_type
    assert 'REG-001' in res.get_data(as_text=True)

def test_student_cannot_access_reports(client, student_headers):
    res = client.get('/api/v1/reports/attendance', headers=student_headers)
    assert res.status_code == 403
