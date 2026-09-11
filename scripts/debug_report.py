import sqlite3

conn = sqlite3.connect('sanket.db')
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Tables:", tables)

cur.execute("SELECT id, sif_score, sif_label, is_sif_precursor, status, updated_at FROM reports WHERE id LIKE '%7f107480%'")
print("Report:", cur.fetchall())

if 'feedbacks' in tables:
    cur.execute("SELECT * FROM feedbacks WHERE report_id LIKE '%7f107480%'")
    print("Feedbacks:", cur.fetchall())

if 'audit_logs' in tables:
    cur.execute("SELECT * FROM audit_logs WHERE report_id LIKE '%7f107480%'")
    print("Audit logs:", cur.fetchall())
