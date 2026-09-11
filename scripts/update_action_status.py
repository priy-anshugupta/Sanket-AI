import sqlite3
import asyncio
from backend.db.engine import async_session_factory
from backend.models.report import Report
from backend.models.action import Action
from sqlalchemy import select, update

# 1. Update SQLite
conn = sqlite3.connect('sanket.db')
cur = conn.cursor()
cur.execute("""
    UPDATE reports 
    SET status = 'ACTION_DISPATCHED'
    WHERE id IN (SELECT DISTINCT report_id FROM actions WHERE status = 'OPEN')
""")
conn.commit()
print('SQLite updated! Total changes:', conn.total_changes)
cur.execute("SELECT id, status, raw_text FROM reports WHERE status = 'ACTION_DISPATCHED'")
for r in cur.fetchall():
    print(' SQLite:', r[0][:8], r[1], r[2][:40])

# 2. Update Supabase
async def update_supabase():
    async with async_session_factory() as db:
        res = await db.execute(select(Action.report_id).where(Action.status == 'OPEN'))
        open_report_ids = [r[0] for r in res.all() if r[0]]
        if open_report_ids:
            await db.execute(
                update(Report)
                .where(Report.id.in_(open_report_ids))
                .values(status='ACTION_DISPATCHED')
            )
            await db.commit()
            print('Supabase updated with ACTION_DISPATCHED for IDs:', len(open_report_ids))

asyncio.run(update_supabase())
