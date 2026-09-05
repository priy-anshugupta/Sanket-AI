"""
SANKET · AI — Dual-Mode Database Engine & Dynamic Session Factory
Seamlessly switches between Cloud PostgreSQL (Supabase) and Local SQLite (sanket.db).
Guarantees 100% air-gapped offline operation with automatic fallback and default seeding.
"""

import asyncio
import os
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event, select, func
from backend.config.settings import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


# Internal State
_current_engine = None
_current_session_factory = None
active_db_type = "sqlite" if ("sqlite" in settings.DATABASE_URL or settings.DB_MODE == "sqlite" or settings.AI_MODE == "airgapped") else "supabase"


def _build_sqlite_engine(url: str = None):
    """Create local SQLite async engine with WAL mode and high busy-timeout."""
    db_url = url or settings.SQLITE_URL
    eng = create_async_engine(
        db_url,
        echo=False,
        future=True,
        connect_args={"timeout": 60},
    )
    @event.listens_for(eng.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=60000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()
    return eng


def _build_postgres_engine(url: str = None):
    """Create Supabase / PostgreSQL async engine."""
    db_url = url or settings.DATABASE_URL
    return create_async_engine(
        db_url,
        echo=False,
        future=True,
        connect_args={
            "statement_cache_size": 0,
            "timeout": 15,
            "command_timeout": 15,
        },
        pool_pre_ping=True,
        pool_recycle=300,
    )


# Initial Engine Setup
if active_db_type == "sqlite":
    _current_engine = _build_sqlite_engine()
else:
    _current_engine = _build_postgres_engine()

_current_session_factory = async_sessionmaker(
    _current_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class EngineProxy:
    """Proxy for the active SQLAlchemy AsyncEngine."""
    @property
    def sync_engine(self):
        return _current_engine.sync_engine

    def begin(self, *args, **kwargs):
        return _current_engine.begin(*args, **kwargs)

    def connect(self, *args, **kwargs):
        return _current_engine.connect(*args, **kwargs)

    async def dispose(self):
        if _current_engine:
            await _current_engine.dispose()


class SessionProxy:
    """Proxy for the active sessionmaker."""
    def __call__(self, *args, **kwargs):
        return _current_session_factory(*args, **kwargs)


# Exported singleton proxies
engine = EngineProxy()
async_session_factory = SessionProxy()


def get_active_db_type() -> str:
    """Returns 'supabase' or 'sqlite'."""
    return active_db_type


async def switch_to_sqlite():
    """Explicitly switch active database to local SQLite (sanket.db)."""
    global _current_engine, _current_session_factory, active_db_type
    if _current_engine:
        try:
            await _current_engine.dispose()
        except Exception:
            pass

    _current_engine = _build_sqlite_engine()
    _current_session_factory = async_sessionmaker(
        _current_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    active_db_type = "sqlite"

    import backend.models  # noqa: F401
    async with _current_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("[Database] [OFFLINE AIR-GAP] Active database is now local SQLite (sanket.db)", flush=True)
    await seed_offline_defaults()


async def switch_to_supabase():
    """Explicitly switch active database to Cloud Supabase PostgreSQL."""
    global _current_engine, _current_session_factory, active_db_type
    if _current_engine:
        try:
            await _current_engine.dispose()
        except Exception:
            pass

    _current_engine = _build_postgres_engine()
    _current_session_factory = async_sessionmaker(
        _current_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    active_db_type = "supabase"

    import backend.models  # noqa: F401
    async with _current_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("[Database] [CLOUD MODE] Active database is now Supabase PostgreSQL", flush=True)


async def get_db() -> AsyncSession:
    """FastAPI dependency: yields an async DB session from the active engine."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database on startup with intelligent fallback:
    - If DB_MODE is 'sqlite' or AI_MODE is 'airgapped': uses SQLite directly.
    - If DB_MODE is 'supabase' or 'auto': tests connection with a 3.5s timeout.
      If unreachable (e.g. offline/no internet), automatically switches to SQLite.
    """
    global active_db_type
    import backend.models  # noqa: F401

    if settings.DB_MODE == "sqlite" or settings.AI_MODE == "airgapped":
        print("[Database] Mode forced to offline SQLite via configuration", flush=True)
        await switch_to_sqlite()
        return

    # Auto or Supabase mode — test connection
    try:
        print(f"[Database] Testing connection to Supabase...", flush=True)
        async with asyncio.timeout(3.5):
            async with _current_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        active_db_type = "supabase"
        print("[Database] [OK] Supabase PostgreSQL connected & verified (Cloud Mode)", flush=True)
    except Exception as e:
        print(f"[Database] [WARN] Supabase unreachable ({e})", flush=True)
        print("[Database] [AUTO-SWITCH] Seamlessly falling back to local SQLite (sanket.db)...", flush=True)
        await switch_to_sqlite()


async def close_db():
    """Dispose active engine on shutdown."""
    if _current_engine:
        await _current_engine.dispose()


async def seed_offline_defaults():
    """
    Seeds local SQLite with default users and a curated batch of realistic
    Upper Assam oilfield reports if the database is newly initialized.
    """
    from backend.models.user import User
    from backend.models.report import Report
    from backend.auth.jwt_handler import hash_password

    async with async_session_factory() as db:
        try:
            # 1. Seed default users
            user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
            if user_count == 0:
                default_users = [
                    User(id="user-admin-001", username="admin", password_hash=hash_password("admin123"),
                         full_name="System Administrator", role="admin"),
                    User(id="user-hse-001", username="rajesh", password_hash=hash_password("rajesh123"),
                         full_name="Rajesh Kumar (HSE GM)", role="hse_manager"),
                    User(id="user-officer-001", username="priya", password_hash=hash_password("priya123"),
                         full_name="Priya Singh (Site Officer)", role="site_officer"),
                    User(id="user-worker-001", username="bikash", password_hash=hash_password("bikash123"),
                         full_name="Bikash Das (Field Worker)", role="field_worker"),
                ]
                for u in default_users:
                    db.add(u)
                await db.flush()
                print("[Database] [Seed] Created 4 demo users (admin/rajesh/priya/bikash)", flush=True)

            # 2. Seed realistic offline reports if reports table is empty
            report_count = (await db.execute(select(func.count(Report.id)))).scalar() or 0
            if report_count == 0:
                curated_reports = [
                    {
                        "id": "REP-2026-089",
                        "raw_text": "Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration flutter at Well Pad 7.",
                        "sif_score": 0.94,
                        "sif_label": "HIGH",
                        "is_sif_precursor": True,
                        "location": "Well Pad 7",
                        "iogp_rule": "Energy Isolation",
                        "activity_type": "Workover",
                        "shift": "DAY",
                        "status": "COMPLETED",
                        "explanation": "High pressure containment failure on secondary barrier. Matched DEKRA SIF Anchor: High pressure wellhead valve weeping or pressure containment compromise. Enforce Layer 1 Physics Gate.",
                    },
                    {
                        "id": "REP-2026-084",
                        "raw_text": "Standpipe pressure needle flutter 80 PSI observed with minor mud aeration in ditch during circulation test at Baghjan Well #5.",
                        "sif_score": 0.88,
                        "sif_label": "HIGH",
                        "is_sif_precursor": True,
                        "location": "Baghjan Well #5",
                        "iogp_rule": "Bypassing Controls",
                        "activity_type": "Drilling",
                        "shift": "DAY",
                        "status": "COMPLETED",
                        "explanation": "Mud aeration and standpipe flutter indicate formation gas ingress (early kick precursor). Near-Miss Multiplier triggered across 7-day window.",
                    },
                    {
                        "id": "REP-2026-082",
                        "raw_text": "Cellar pit gas detector reading 15 PPM H2S during drain line flush near separator manifold at Moran OCS-3.",
                        "sif_score": 0.78,
                        "sif_label": "HIGH",
                        "is_sif_precursor": True,
                        "location": "Moran OCS-3",
                        "iogp_rule": "Toxic Gas Exposure",
                        "activity_type": "Production",
                        "shift": "NIGHT",
                        "status": "COMPLETED",
                        "explanation": "Toxic H2S gas detected in semi-confined cellar depression. Mandatory breathing apparatus protocol and muster alert active.",
                    },
                    {
                        "id": "REP-2026-079",
                        "raw_text": "Discharge pulsation dampener nitrogen pre-charge low (800 PSI vs 1500 PSI nominal) on mud pump #2 at Digboi Rig #2.",
                        "sif_score": 0.68,
                        "sif_label": "MEDIUM",
                        "is_sif_precursor": False,
                        "location": "Digboi Rig #2",
                        "iogp_rule": "Asset Integrity",
                        "activity_type": "Drilling",
                        "shift": "DAY",
                        "status": "COMPLETED",
                        "explanation": "Pulsation dampener degradation increases fatigue stress on high-pressure mud delivery lines. Work order dispatched.",
                    },
                    {
                        "id": "REP-2026-075",
                        "raw_text": "Scaffolding planks unanchored and missing toe-boards near high-pressure gas bypass line at Tengakhat Station.",
                        "sif_score": 0.62,
                        "sif_label": "MEDIUM",
                        "is_sif_precursor": False,
                        "location": "Tengakhat Station",
                        "iogp_rule": "Work at Height",
                        "activity_type": "Maintenance",
                        "shift": "NIGHT",
                        "status": "COMPLETED",
                        "explanation": "Fall hazard within line-of-fire of pressurized hydrocarbon infrastructure. Red-tag placed on scaffold ladder.",
                    },
                    {
                        "id": "REP-2026-071",
                        "raw_text": "Shift turnover completed. All mechanical interlocks, gas alarms, and emergency muster routes verified normal at Geleki GGS-1.",
                        "sif_score": 0.18,
                        "sif_label": "LOW",
                        "is_sif_precursor": False,
                        "location": "Geleki GGS-1",
                        "iogp_rule": "Safe Systems of Work",
                        "activity_type": "Shift Handover",
                        "shift": "DAY",
                        "status": "COMPLETED",
                        "explanation": "Routine safe observation. All physical barriers verified intact. Safe ceiling cap applied.",
                    },
                    {
                        "id": "REP-2026-068",
                        "raw_text": "Weekly pre-shift tool inspection and PPE verification passed with zero defects at Lakwa Well #12.",
                        "sif_score": 0.12,
                        "sif_label": "LOW",
                        "is_sif_precursor": False,
                        "location": "Lakwa Well #12",
                        "iogp_rule": "Personal Safety",
                        "activity_type": "Inspection",
                        "shift": "DAY",
                        "status": "COMPLETED",
                        "explanation": "Verified compliance log. Routine operational baseline.",
                    },
                ]

                for item in curated_reports:
                    r = Report(
                        id=item["id"],
                        raw_text=item["raw_text"],
                        sif_score=item["sif_score"],
                        sif_label=item["sif_label"],
                        is_sif_precursor=item["is_sif_precursor"],
                        original_sif_score=item["sif_score"],
                        location=item["location"],
                        iogp_rule=item["iogp_rule"],
                        activity_type=item["activity_type"],
                        shift=item["shift"],
                        status=item["status"],
                        explanation=item["explanation"],
                        source="offline_seed",
                        submitted_at=datetime.utcnow(),
                        created_at=datetime.utcnow(),
                    )
                    db.add(r)
                await db.commit()
                print(f"[Database] [Seed] Seeded {len(curated_reports)} curated offline reports into sanket.db", flush=True)
        except Exception as err:
            print(f"[Database] [Seed Error] {err}", flush=True)
            await db.rollback()
