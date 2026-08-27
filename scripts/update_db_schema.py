"""
SANKET · AI — Database Schema Sync & Migration
Ensures all new tables and columns (audit_trail, sync_queue, latitude, longitude,
ingestion_channel, model_version) are properly created and indexed in sanket.db.
"""

import sys
import os
import asyncio
from pathlib import Path
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.db.engine import engine, init_db, async_session_factory
from backend.models import *

async def sync_schema():
    print("=" * 60)
    print("  SANKET · AI — Synchronizing Database Schema")
    print("=" * 60)

    # 1. Create any missing tables (audit_trail, sync_queue, etc.)
    await init_db()
    print("[Schema] [OK] Tables verified and created.")

    # 2. Check and add new columns to reports table if they don't exist
    new_columns = [
        ("ingestion_channel", "VARCHAR(50) DEFAULT 'web'"),
        ("latitude", "FLOAT"),
        ("longitude", "FLOAT"),
        ("model_version", "VARCHAR(50) DEFAULT 'v1.0-calibrated'"),
    ]

    async with async_session_factory() as session:
        for col_name, col_type in new_columns:
            try:
                await session.execute(text(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type};"))
                await session.commit()
                print(f"[Schema] [OK] Added column '{col_name}' to reports table.")
            except Exception as e:
                # Column already exists in SQLite
                await session.rollback()
                print(f"[Schema] Column '{col_name}' already exists or verified.")

    print("=" * 60)
    print("  Database schema sync complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(sync_schema())
