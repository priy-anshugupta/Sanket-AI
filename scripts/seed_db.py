"""
SANKET · AI — Database Seeder
Seeds the DB with synthetic reports and processes them through the pipeline.
"""

import asyncio
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.engine import init_db, async_session_factory
from backend.services.report_service import report_service
from backend.models.user import User
from backend.auth.jwt_handler import hash_password


async def seed_users(db):
    """Seed demo users."""
    from sqlalchemy import select, func
    count = await db.execute(select(func.count(User.id)))
    if count.scalar() > 0:
        print("  Users already seeded, skipping")
        return

    users = [
        User(id="user-admin-001", username="admin", password_hash=hash_password("admin123"),
             full_name="System Administrator", role="admin"),
        User(id="user-hse-001", username="rajesh", password_hash=hash_password("rajesh123"),
             full_name="Rajesh Kumar (HSE GM)", role="hse_manager"),
        User(id="user-officer-001", username="priya", password_hash=hash_password("priya123"),
             full_name="Priya Singh (Site Officer)", role="site_officer"),
        User(id="user-worker-001", username="bikash", password_hash=hash_password("bikash123"),
             full_name="Bikash Das (Field Worker)", role="field_worker"),
    ]
    for user in users:
        db.add(user)
    await db.flush()
    print("  [OK] Seeded 4 demo users")


async def seed_reports(db, data_path: str = None):
    """Seed synthetic reports."""
    if data_path is None:
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data", "synthetic", "synthetic_500.json"
        )

    if not os.path.exists(data_path):
        print(f"  [WARN] No synthetic data found at {data_path}")
        print("  Run: python scripts/generate_synthetic_data.py first")
        return 0

    from sqlalchemy import select, func
    from backend.models.report import Report
    existing = await db.execute(select(func.count(Report.id)))
    existing_count = existing.scalar() or 0
    if existing_count > 0:
        print(f"  Reports already seeded ({existing_count} present), skipping duplicate seed.")
        return existing_count

    with open(data_path, "r", encoding="utf-8") as f:
        reports_data = json.load(f)

    count = 0
    for item in reports_data:
        report = await report_service.create_report(
            db=db,
            raw_text=item["text"],
            source="csv",
            location=item.get("location"),
            activity_type=item.get("activity_type"),
            shift=item.get("shift"),
        )
        count += 1

    await db.flush()
    print(f"  [OK] Seeded {count} reports")
    return count


async def main():
    """Run the seeder."""
    print("=" * 50)
    print("  SANKET · AI — Database Seeder")
    print("=" * 50)

    # Initialize DB
    await init_db()
    print("[1/3] Database tables created")

    async with async_session_factory() as db:
        # Seed users
        print("[2/3] Seeding users...")
        await seed_users(db)

        # Seed reports
        print("[3/3] Seeding reports...")
        count = await seed_reports(db)

        await db.commit()

    print("=" * 50)
    print(f"  [OK] Seeding complete! {count} reports ready.")
    print("  Run the backend: uvicorn backend.main:app --reload")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
