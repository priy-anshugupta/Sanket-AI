"""
SANKET · AI — Fast Batch Recalibration
Recalibrates all existing reports in the database using the new calibrated SIF classifier.
Uses batch encoding for ultra-fast vectorized classification.
"""

import asyncio
import sys
import os
from pathlib import Path
from sqlalchemy import select, update

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.db.engine import async_session_factory
from backend.models.report import Report
from ai.sif.classifier import sif_classifier

async def recalibrate_all():
    print("=" * 60)
    print("  SANKET · AI — Fast Vectorized Database Recalibration")
    print("=" * 60)

    sif_classifier.initialize()

    async with async_session_factory() as db:
        res = await db.execute(select(Report.id, Report.raw_text, Report.preprocessed_text))
        rows = res.all()
        print(f"  Found {len(rows)} reports in database.")

        if not rows:
            print("  No reports found.")
            return

        report_ids = [r[0] for r in rows]
        texts = [r[2] if r[2] else r[1] for r in rows]

        print("  Running batch classification with calibrated classifier...")
        results = sif_classifier.classify_batch(texts)

        high_count = sum(1 for r in results if r["sif_label"] == "HIGH")
        med_count = sum(1 for r in results if r["sif_label"] == "MEDIUM")
        low_count = sum(1 for r in results if r["sif_label"] == "LOW")

        print(f"  Results Breakdown: HIGH={high_count}, MEDIUM={med_count}, LOW={low_count}")

        # Update in database
        print("  Saving calibrated scores to database...")
        for rid, res_item in zip(report_ids, results):
            await db.execute(
                update(Report)
                .where(Report.id == rid)
                .values(
                    sif_score=res_item["sif_score"],
                    sif_label=res_item["sif_label"],
                    is_sif_precursor=res_item["is_sif_precursor"],
                    matched_anchor_id=res_item["matched_anchor_id"],
                    matched_anchor_text=res_item["matched_anchor_text"],
                    model_version="v1.0-calibrated"
                )
            )

        await db.commit()
        print("=" * 60)
        print(f"  [OK] Successfully recalibrated {len(rows)} reports!")
        print(f"  Calibrated Distribution: HIGH: {high_count} | MEDIUM: {med_count} | LOW: {low_count}")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(recalibrate_all())
