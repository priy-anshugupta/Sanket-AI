"""
SANKET · AI — Batch Report Processor
Runs the full 5-stage NLP pipeline across all PENDING reports in the database.
"""

import asyncio
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from backend.db.engine import async_session_factory
from backend.models.report import Report
from backend.workers.pipeline_worker import process_report


async def process_all(limit: int = 500):
    print("=" * 60)
    print("  SANKET · AI — Processing Seeded Reports through 5-Stage Pipeline")
    print("=" * 60)

    # Initialize SIF classifier and models
    from ai.sif.classifier import sif_classifier
    sif_classifier.initialize()

    from ai.lsr.mapper import lsr_mapper
    lsr_mapper.initialize(model=sif_classifier.model)

    async with async_session_factory() as db:
        res = await db.execute(
            select(Report.id).where(Report.status.in_(["PENDING", "FAILED"])).limit(limit)
        )
        report_ids = [row[0] for row in res.all()]

    print(f"  Found {len(report_ids)} reports to process...")

    # Process with semaphore of 2 to guarantee zero DB lock contention
    sem = asyncio.Semaphore(2)

    async def safe_process(rid):
        async with sem:
            await process_report(rid)

    for i in range(0, len(report_ids), 10):
        chunk = report_ids[i:i + 10]
        await asyncio.gather(*(safe_process(rid) for rid in chunk))
        print(f"  Processed {min(i + 10, len(report_ids))}/{len(report_ids)} reports...")

    print("=" * 60)
    print("  [OK] Batch processing complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(process_all())
