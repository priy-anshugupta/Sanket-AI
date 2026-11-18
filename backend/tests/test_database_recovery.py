"""Outage tests use disposable SQLite and fakes, never the production database."""
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

import importlib
db = importlib.import_module("backend.db.engine")
from backend.main import app, recover_database_startup


class DatabaseRecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_readiness_queries_application_table_and_recovers(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        try:
            factory = async_sessionmaker(engine)
            with patch.object(db, "_current_session_factory", factory):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get("/ready")
                    self.assertEqual(response.status_code, 503)
                    self.assertNotIn("sqlite", response.text)
                    self.assertEqual((await client.get("/health")).status_code, 200)
                    async with engine.begin() as conn:
                        await conn.exec_driver_sql("CREATE TABLE reports (id TEXT PRIMARY KEY)")
                    for method in (client.get, client.head):
                        response = await method("/ready")
                        self.assertEqual(response.status_code, 200)
                        self.assertEqual(response.headers["cache-control"], "no-store")
        finally:
            await engine.dispose()

    async def test_probe_has_deadline(self):
        class SlowSession:
            async def __aenter__(self):
                await asyncio.sleep(10)
            async def __aexit__(self, *args):
                pass
        with patch.object(db, "async_session_factory", SlowSession):
            with self.assertRaises(TimeoutError):
                await db.check_database_ready(timeout=0.01)

    async def test_failed_cloud_startup_never_switches_to_sqlite(self):
        class BrokenEngine:
            def begin(self):
                raise OSError("unreachable")
        with patch.object(db, "_current_engine", BrokenEngine()), patch.object(db.settings, "DB_MODE", "supabase"), patch.object(db, "switch_to_sqlite", new_callable=AsyncMock) as fallback:
            with self.assertRaises(OSError):
                await db.init_db()
            fallback.assert_not_awaited()

    async def test_cloud_auto_mode_also_never_falls_back(self):
        class BrokenEngine:
            def begin(self):
                raise OSError("unreachable")
        with patch.object(db, "_current_engine", BrokenEngine()), patch.object(db.settings, "DB_MODE", "auto"), patch.object(db.settings, "DATABASE_URL", "postgresql+asyncpg://unused"), patch.dict("os.environ", {"RENDER": "true"}), patch.object(db, "switch_to_sqlite", new_callable=AsyncMock) as fallback:
            with self.assertRaises(OSError):
                await db.init_db()
            fallback.assert_not_awaited()

    async def test_explicit_offline_mode_remains_available(self):
        with patch.object(db.settings, "DB_MODE", "sqlite"), patch.object(db, "switch_to_sqlite", new_callable=AsyncMock) as fallback:
            await db.init_db()
            fallback.assert_awaited_once()

    async def test_connection_retry_recovers_and_closes_failed_session(self):
        failed = AsyncMock()
        failed.execute.side_effect = OSError("disconnected")
        healthy = AsyncMock()
        with patch.object(db, "async_session_factory", side_effect=[failed, healthy]), patch.object(db.asyncio, "sleep", new_callable=AsyncMock):
            dependency = db.get_db()
            self.assertIs(await anext(dependency), healthy)
            with self.assertRaises(StopAsyncIteration):
                await anext(dependency)
        failed.close.assert_awaited_once()
        healthy.commit.assert_awaited_once()
        healthy.close.assert_awaited_once()

    async def test_outage_returns_503_after_bounded_retries(self):
        session = AsyncMock()
        session.execute.side_effect = OSError("private connection details")
        test_app = FastAPI()
        from backend.main import unavailable_database_handler
        test_app.add_exception_handler(db.DatabaseUnavailable, unavailable_database_handler)
        @test_app.get("/data")
        async def endpoint(session=Depends(db.get_db)):
            self.fail("Request handler must not run during outage")
        with patch.object(db, "async_session_factory", return_value=session) as factory, patch.object(db.asyncio, "sleep", new_callable=AsyncMock):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as client:
                response = await client.get("/data")
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.headers["retry-after"], "10")
                self.assertNotIn("private", response.text)
            self.assertEqual(factory.call_count, 3)

    async def test_write_failure_is_not_replayed(self):
        session = AsyncMock()
        with patch.object(db, "async_session_factory", return_value=session) as factory:
            dependency = db.get_db()
            await anext(dependency)
            with self.assertRaises(db.DatabaseUnavailable):
                await dependency.athrow(OSError("connection lost after write"))
            self.assertEqual(factory.call_count, 1)
            session.rollback.assert_awaited_once()
            session.commit.assert_not_awaited()
            session.close.assert_awaited_once()

    async def test_background_initialization_recovers_without_restart(self):
        with patch("backend.main.initialize_database", new_callable=AsyncMock, side_effect=[OSError(), None]) as initialize, patch("backend.main.asyncio.sleep", new_callable=AsyncMock) as sleep:
            await recover_database_startup()
            self.assertEqual(initialize.await_count, 2)
            self.assertEqual([call.args[0] for call in sleep.await_args_list], [2, 4])

    async def test_failed_manual_cloud_switch_keeps_existing_engine(self):
        original = db._current_engine
        candidate = AsyncMock()
        candidate.begin = MagicMock(side_effect=OSError("unavailable"))
        with patch.object(db, "_build_postgres_engine", return_value=candidate):
            with self.assertRaises(OSError):
                await db.switch_to_supabase()
        self.assertIs(db._current_engine, original)
        candidate.dispose.assert_awaited_once()

    async def test_background_backoff_is_capped(self):
        with patch("backend.main.initialize_database", new_callable=AsyncMock, side_effect=[OSError()] * 6 + [None]), patch("backend.main.asyncio.sleep", new_callable=AsyncMock) as sleep:
            await recover_database_startup()
            self.assertEqual([call.args[0] for call in sleep.await_args_list], [2, 4, 8, 16, 30, 30, 30])

    async def test_lifespan_cancels_recovery_on_shutdown(self):
        from backend.main import lifespan
        started = asyncio.Event()
        cancelled = asyncio.Event()
        async def recovery():
            started.set()
            try:
                await asyncio.Event().wait()
            finally:
                cancelled.set()
        with patch("backend.main.initialize_database", new_callable=AsyncMock, side_effect=OSError()), patch("backend.main.recover_database_startup", side_effect=recovery), patch("backend.main.async_ai_model_startup", new_callable=AsyncMock), patch("backend.main.close_db", new_callable=AsyncMock) as close:
            async with lifespan(app):
                await asyncio.wait_for(started.wait(), timeout=1)
            self.assertTrue(cancelled.is_set())
            close.assert_awaited_once()
