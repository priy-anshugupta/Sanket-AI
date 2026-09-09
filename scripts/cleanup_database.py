"""
SANKET · AI — Database Cleanup & Deduplication Script
Removes duplicate unclassified CSV records from repeated seed runs and failed dummy records.
Restores the database to the clean calibrated baseline.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.engine import async_session_factory
from backend.models.report import Report
from backend.models.feedback import FeedbackLog
from backend.models.entity import Entity
from backend.models.lsr_tag import LSRTag
from backend.models.action import Action
from sqlalchemy import select, func, delete


async def run_cleanup():
    print("=" * 60)
    print("  SANKET · AI — Database Cleanup & Deduplication")
    print("=" * 60)

    async with async_session_factory() as db:
        # Step 0: Before counts
        total_before = (await db.execute(select(func.count(Report.id)))).scalar() or 0
        high_before = (await db.execute(select(func.count(Report.id)).where(Report.sif_label == "HIGH"))).scalar() or 0
        med_before = (await db.execute(select(func.count(Report.id)).where(Report.sif_label == "MEDIUM"))).scalar() or 0
        low_before = (await db.execute(select(func.count(Report.id)).where(Report.sif_label == "LOW"))).scalar() or 0
        pending_before = (await db.execute(select(func.count(Report.id)).where(Report.status == "PENDING"))).scalar() or 0

        print(f"Current Total Reports in Database: {total_before}")
        print(f"  HIGH: {high_before}")
        print(f"  MEDIUM: {med_before}")
        print(f"  LOW: {low_before}")
        print(f"  PENDING (Unclassified): {pending_before}")
        print("-" * 60)

        # Step 1: Find unclassified CSV duplicates
        res_csv = await db.execute(
            select(Report.id).where(Report.source == "csv", Report.status == "PENDING")
        )
        csv_ids = list(res_csv.scalars().all())
        print(f"Found {len(csv_ids)} duplicate unclassified CSV reports to purge.")

        # Step 2: Find failed dummy test reports ('all good')
        res_failed = await db.execute(
            select(Report.id).where(Report.raw_text == "all good")
        )
        failed_ids = list(res_failed.scalars().all())
        print(f"Found {len(failed_ids)} failed dummy test reports to purge.")

        all_purge_ids = csv_ids + failed_ids

        if not all_purge_ids:
            print("[INFO] Database is already clean. Nothing to purge.")
            return

        # Step 3: Delete any child foreign keys for purged IDs
        if all_purge_ids:
            await db.execute(delete(FeedbackLog).where(FeedbackLog.report_id.in_(all_purge_ids)))
            await db.execute(delete(Action).where(Action.report_id.in_(all_purge_ids)))
            await db.execute(delete(LSRTag).where(LSRTag.report_id.in_(all_purge_ids)))
            await db.execute(delete(Entity).where(Entity.report_id.in_(all_purge_ids)))
            print("  [OK] Cleaned related child records (entities, tags, actions, feedback)")

            # Step 4: Delete reports
            await db.execute(delete(Report).where(Report.id.in_(all_purge_ids)))
            print(f"  [OK] Deleted {len(all_purge_ids)} redundant reports")

        await db.commit()

        # Step 5: After counts
        total_after = (await db.execute(select(func.count(Report.id)))).scalar() or 0
        high_after = (await db.execute(select(func.count(Report.id)).where(Report.sif_label == "HIGH"))).scalar() or 0
        med_after = (await db.execute(select(func.count(Report.id)).where(Report.sif_label == "MEDIUM"))).scalar() or 0
        low_after = (await db.execute(select(func.count(Report.id)).where(Report.sif_label == "LOW"))).scalar() or 0
        pending_after = (await db.execute(select(func.count(Report.id)).where(Report.status == "PENDING"))).scalar() or 0

        print("=" * 60)
        print("CLEANUP SUCCESSFUL! NEW DATABASE STATE:")
        print(f"  TOTAL INGESTED: {total_after}")
        print(f"  HIGH SIF:       {high_after}")
        print(f"  MEDIUM:         {med_after}")
        print(f"  LOW / NON-SIF:  {low_after}")
        print(f"  PENDING:        {pending_after}")
        print(f"  Verification: HIGH ({high_after}) + MEDIUM ({med_after}) + LOW ({low_after}) = {high_after + med_after + low_after}")
        print(f"  Matches Total Exactly: {total_after == (high_after + med_after + low_after)}")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_cleanup())
