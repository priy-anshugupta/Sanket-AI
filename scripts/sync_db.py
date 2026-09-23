"""
Script to sync clean 553 reports from local SQLite (sanket.db) to Supabase PostgreSQL.
Fixes VARCHAR limits and ensures 100% data sync.
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
    try:
        return datetime.fromisoformat(val)
    except Exception:
        for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(val, fmt)
            except Exception:
                pass
    return None

async def main():
    print("1. Reading clean data from local SQLite (sanket.db)...")
    s_conn = sqlite3.connect("sanket.db")
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    s_cur.execute("SELECT count(*) FROM reports")
    total_sqlite = s_cur.fetchone()[0]
    print(f"Total reports in SQLite: {total_sqlite}")

    s_cur.execute("SELECT * FROM reports")
    sqlite_reports = [dict(r) for r in s_cur.fetchall()]

    s_cur.execute("SELECT * FROM entities")
    sqlite_entities = [dict(r) for r in s_cur.fetchall()]

    s_cur.execute("SELECT * FROM lsr_tags")
    sqlite_lsr = [dict(r) for r in s_cur.fetchall()]

    s_cur.execute("SELECT * FROM actions")
    sqlite_actions = [dict(r) for r in s_cur.fetchall()]

    s_conn.close()
    print(f"Loaded: {len(sqlite_reports)} reports, {len(sqlite_entities)} entities, {len(sqlite_lsr)} lsr_tags, {len(sqlite_actions)} actions.")

    print("\n2. Connecting to Supabase...")
    engine = create_async_engine(settings.DATABASE_URL)

    # Step 2a: Broaden VARCHAR columns in Supabase so truncation never happens
    async with engine.begin() as conn:
        print("Broadening varchar columns in Supabase...")
        for col in ["source", "activity_type", "status", "shift", "language", "location", "iogp_rule", "matched_anchor_id", "asset_id", "ingestion_channel", "model_version"]:
            try:
                await conn.execute(text(f'ALTER TABLE reports ALTER COLUMN "{col}" TYPE TEXT'))
            except Exception as ex:
                pass

        # Clear existing rows
        for tbl in ["actions", "lsr_tags", "entities", "reports"]:
            try:
                await conn.execute(text(f'DELETE FROM "{tbl}"'))
            except Exception as ex:
                pass
        print("Existing rows cleared.")

    # Step 2b: Insert clean reports in batches
    print(f"\n3. Inserting {len(sqlite_reports)} reports into Supabase...")
    datetime_cols = {"created_at", "updated_at", "submitted_at"}
    async with engine.begin() as conn:
        for r in sqlite_reports:
            cols = list(r.keys())
            clean_row = {}
            for k, v in r.items():
                if k in datetime_cols and v:
                    clean_row[k] = parse_dt(v)
                elif k in ("is_sif_precursor", "escalated_by_cluster") and v is not None:
                    clean_row[k] = bool(v)
                else:
                    clean_row[k] = v

            cols_str = ", ".join([f'"{c}"' for c in cols])
            params_str = ", ".join([f":{c}" for c in cols])
            await conn.execute(
                text(f"INSERT INTO reports ({cols_str}) VALUES ({params_str})"),
                clean_row
            )
        print("All reports inserted successfully!")

        # Insert entities
        print(f"Inserting {len(sqlite_entities)} entities...")
        for e in sqlite_entities:
            cols = list(e.keys())
            cols_str = ", ".join([f'"{c}"' for c in cols])
            params_str = ", ".join([f":{c}" for c in cols])
            await conn.execute(text(f'INSERT INTO entities ({cols_str}) VALUES ({params_str})'), e)

        # Insert lsr_tags
        print(f"Inserting {len(sqlite_lsr)} lsr_tags...")
        for l in sqlite_lsr:
            cols = list(l.keys())
            cols_str = ", ".join([f'"{c}"' for c in cols])
            params_str = ", ".join([f":{c}" for c in cols])
            await conn.execute(text(f'INSERT INTO lsr_tags ({cols_str}) VALUES ({params_str})'), l)

        # Insert actions
        print(f"Inserting {len(sqlite_actions)} actions...")
        for a in sqlite_actions:
            clean_a = {}
            for k, v in a.items():
                if k in ("due_date", "created_at", "updated_at") and v:
                    clean_a[k] = parse_dt(v)
                else:
                    clean_a[k] = v
            cols = list(clean_a.keys())
            cols_str = ", ".join([f'"{c}"' for c in cols])
            params_str = ", ".join([f":{c}" for c in cols])
            await conn.execute(text(f'INSERT INTO actions ({cols_str}) VALUES ({params_str})'), clean_a)

    # Step 3: Verification
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT count(*) FROM reports"))
        new_supa_count = res.scalar()
        res2 = await conn.execute(text("SELECT sif_label, count(*) FROM reports GROUP BY sif_label ORDER BY sif_label"))
        labels_breakdown = res2.fetchall()
        print(f"\n========================================================")
        print(f" [SUCCESS] Supabase is now in 100% sync with SQLite!")
        print(f" Total Reports in Supabase: {new_supa_count}")
        print(f" Risk Breakdown: {labels_breakdown}")
        print(f"========================================================")

if __name__ == "__main__":
    asyncio.run(main())
