"""
SANKET · AI — Report API Routes
Thin route handlers delegating to report_service.
"""

import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.db.engine import get_db
from backend.services.report_service import report_service
from backend.workers.pipeline_worker import process_report, process_batch
from backend.schemas.report import (
    ReportIngestRequest, ReportResponse, ReportListResponse,
    IngestResponse, ReportFeedbackRequest, ReportActionRequest,
    HeatmapResponse,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_report(
    request: ReportIngestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest a single text report.
    Creates record with PENDING status and enqueues background pipeline.
    """
    report = await report_service.create_report(
        db=db,
        raw_text=request.text,
        source=request.source,
        location=request.location,
        asset_id=request.asset_id,
        activity_type=request.activity_type,
        shift=request.shift,
    )
    await db.commit()

    # Enqueue background processing
    background_tasks.add_task(process_report, report.id)

    return IngestResponse(
        job_id=report.id,
        count=1,
        status="PENDING",
        message="Report ingested and queued for AI processing",
    )


@router.post("/ingest/csv", response_model=IngestResponse)
async def ingest_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Batch ingest reports from CSV file (up to 500 reports).
    CSV must have a 'text' or 'description' or 'narrative' column.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    content = await file.read()
    csv_text = content.decode("utf-8", errors="replace")

    reports = await report_service.create_reports_from_csv(db, csv_text)
    await db.commit()

    if not reports:
        raise HTTPException(status_code=400, detail="No valid reports found in CSV")

    # Enqueue batch processing
    report_ids = [r.id for r in reports]
    background_tasks.add_task(process_batch, report_ids)

    return IngestResponse(
        job_id=reports[0].id,
        count=len(reports),
        status="PENDING",
        message=f"{len(reports)} reports ingested and queued for processing",
    )


@router.get("", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    sif_label: Optional[str] = Query(None, pattern="^(HIGH|MEDIUM|LOW)$"),
    status: Optional[str] = Query(None),
    location: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Paginated triage queue with filters.
    Default sort: SIF score descending (highest risk first).
    """
    reports, total = await report_service.list_reports(
        db, page=page, limit=limit,
        sif_label=sif_label, status=status,
        location=location, search=search,
    )

    return ReportListResponse(
        reports=[ReportResponse.model_validate(r) for r in reports],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get full report detail with entities, LSR tags, and actions."""
    report = await report_service.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/feedback")
async def submit_feedback(
    report_id: str,
    request: ReportFeedbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit AGREE/UPGRADE/DOWNGRADE feedback on a report."""
    try:
        feedback = await report_service.add_feedback(
            db,
            report_id=report_id,
            corrected_label=request.corrected_label,
            action=request.action,
            reason=request.reason,
            officer_id=request.officer_id,
        )
        await db.commit()
        return {"feedback_id": feedback.id, "status": "recorded"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
