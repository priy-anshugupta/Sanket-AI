"""
SANKET · AI — Database Engine & Session Factory
SQLAlchemy async engine for SQLite (dev) / PostgreSQL (prod / Supabase).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from backend.config.settings import settings


# Connect args based on DB engine
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"timeout": 60}
elif "postgresql" in settings.DATABASE_URL or "asyncpg" in settings.DATABASE_URL:
    connect_args = {
        "statement_cache_size": 0,
        "timeout": 45,
        "command_timeout": 45,
    }

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Enable WAL mode and busy timeout for concurrent SQLite transactions
if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=60000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency: yields an async DB session."""
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
    """Create all tables on startup."""
    # Import the model package before reading metadata.  SQLAlchemy only knows
    # about declarative classes that have been imported into this process.
    import backend.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Dispose engine on shutdown."""
    await engine.dispose()
