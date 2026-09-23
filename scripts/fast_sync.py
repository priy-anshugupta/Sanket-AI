"""
Fast Bulk Sync: Copies 553 classified reports from SQLite to Supabase in 1 single network request.
"""
import sqlite3
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from backend.config.settings import settings

def parse_dt(val):
    if not val or not isinstance(val, str):
        return val
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(val, fmt)
        except Exception:
            pass
    return None

async def main():
    print("Reading SQLite sanket.db...")
    s_conn = sqlite3.connect("sanket.db")
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    s_cur.execute("SELECT * FROM reports")
    sqlite_reports = [dict(r) for r in s_cur.fetchall()]

    s_cur.execute("SELECT * FROM entities")
    sqlite_entities = [dict(r) for r in s_cur.fetchall()]

    s_cur.execute("SELECT * FROM lsr_tags")
    sqlite_lsr = [dict(r) for r in s_cur.fetchall()]

    s_conn.close()
    print(f"Loaded {len(sqlite_reports)} reports from SQLite.")

    datetime_cols = {"created_at", "updated_at", "submitted_at"}
    clean_reports = []
    for r in sqlite_reports:
        cr = {}
        for k, v in r.items():
            if k in datetime_cols and v:
                cr[k] = parse_dt(v)
            elif k in ("is_sif_precursor", "escalated_by_cluster") and v is not None:
                cr[k] = bool(v)
            else:
                cr[k] = v
        clean_reports.append(cr)

    print("Connecting to Supabase...")
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Broaden any restrictive columns
        for col in ["source", "activity_type", "status", "shift", "language", "location", "iogp_rule", "matched_anchor_id", "asset_id", "ingestion_channel", "model_version"]:
            try:
                await conn.execute(text(f'ALTER TABLE reports ALTER COLUMN "{col}" TYPE TEXT'))
            except Exception:
                pass

        # Clear existing rows
        for tbl in ["actions", "lsr_tags", "entities", "reports"]:
            try:
                await conn.execute(text(f'DELETE FROM "{tbl}"'))
            except Exception:
                pass

        # Bulk insert all 553 reports in one statement
        cols = list(clean_reports[0].keys())
        cols_str = ", ".join([f'"{c}"' for c in cols])
        params_str = ", ".join([f":{c}" for c in cols])
        stmt = text(f"INSERT INTO reports ({cols_str}) VALUES ({params_str})")
        print("Bulk inserting 553 reports...")
        await conn.execute(stmt, clean_reports)
        print("Reports inserted.")

        if sqlite_entities:
            e_cols = list(sqlite_entities[0].keys())
            e_cols_str = ", ".join([f'"{c}"' for c in e_cols])
            e_params_str = ", ".join([f":{c}" for c in e_cols])
            e_stmt = text(f"INSERT INTO entities ({e_cols_str}) VALUES ({e_params_str})")
            await conn.execute(e_stmt, sqlite_entities)
            print(f"Inserted {len(sqlite_entities)} entities.")

        if sqlite_lsr:
            l_cols = list(sqlite_lsr[0].keys())
            l_cols_str = ", ".join([f'"{c}"' for c in l_cols])
            l_params_str = ", ".join([f":{c}" for c in l_cols])
            l_stmt = text(f"INSERT INTO lsr_tags ({l_cols_str}) VALUES ({l_params_str})")
            await conn.execute(l_stmt, sqlite_lsr)
            print(f"Inserted {len(sqlite_lsr)} lsr_tags.")

    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT count(*) FROM reports"))
        count = res.scalar()
        res2 = await conn.execute(text("SELECT sif_label, count(*) FROM reports GROUP BY sif_label ORDER BY sif_label"))
        print(f"\n[DONE] Supabase successfully populated with {count} reports: {res2.fetchall()}")

if __name__ == "__main__":
    asyncio.run(main())
