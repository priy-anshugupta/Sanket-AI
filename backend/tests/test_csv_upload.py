"""Exercise upload transactions against a disposable SQLite database."""

import io
import unittest

from fastapi import BackgroundTasks, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import backend.models  # Register relationship models before using the ORM.
from backend.api.report_routes import ingest_csv, ingest_demo_500
from backend.db.engine import Base
from backend.models.report import Report


class CsvUploadTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine('sqlite+aiosqlite:///:memory:')
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        self.db = async_sessionmaker(self.engine, expire_on_commit=False)()

    async def asyncTearDown(self):
        await self.db.close()
        await self.engine.dispose()

    async def test_upload_commits_only_selected_file_and_queues_its_ids(self):
        tasks = BackgroundTasks()
        upload = UploadFile(filename='OBSERVATIONS.CSV', file=io.BytesIO(b'text,location\nGas leak near pump,Digboi\n'))
        response = await ingest_csv(tasks, upload, self.db)
        reports = (await self.db.scalars(select(Report))).all()
        self.assertEqual(response.count, 1)
        self.assertEqual(reports[0].raw_text, 'Gas leak near pump')
        self.assertEqual(reports[0].source, 'csv')
        self.assertEqual(tasks.tasks[0].args, ([reports[0].id],))

    async def test_invalid_later_row_leaves_database_empty(self):
        upload = UploadFile(filename='bad.csv', file=io.BytesIO(b'text\nGas leak near pump\nx\n'))
        tasks = BackgroundTasks()
        with self.assertRaises(HTTPException) as error:
            await ingest_csv(tasks, upload, self.db)
        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(await self.db.scalar(select(func.count(Report.id))), 0)
        self.assertEqual(tasks.tasks, [])

    async def test_encoding_file_type_and_size_errors(self):
        for name, content, status in [('data.json', b'{}', 400), ('data.csv', b'\xff', 400), ('large.csv', b'x' * (5 * 1024 * 1024 + 1), 413)]:
            with self.subTest(name=name), self.assertRaises(HTTPException) as error:
                await ingest_csv(BackgroundTasks(), UploadFile(filename=name, file=io.BytesIO(content)), self.db)
            self.assertEqual(error.exception.status_code, status)

    async def test_retired_demo_endpoint_cannot_insert_reports(self):
        with self.assertRaises(HTTPException) as error:
            await ingest_demo_500()
        self.assertEqual(error.exception.status_code, 410)
        self.assertEqual(await self.db.scalar(select(func.count(Report.id))), 0)
