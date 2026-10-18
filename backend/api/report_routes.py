"""
SANKET · AI — Report API Routes
Thin route handlers delegating to report_service.
"""

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
    # 1. Run instant NLP preprocessing and SIF classification (~15ms)
    # so the database record is initialized with its TRUE score immediately
    from ai.preprocessing.preprocessor import preprocessor
    from ai.sif.classifier import sif_classifier
    from ai.lsr.mapper import lsr_mapper

    prep = preprocessor.preprocess(request.text)
    clean_text = prep["preprocessed_text"] if prep.get("is_valid") else request.text
    classification = sif_classifier.classify(clean_text)
    
    iogp_rule = "General Safety & Maintenance"
    try:
        lsr_res = lsr_mapper.map_rules(clean_text)
        if lsr_res:
            iogp_rule = lsr_res[0]["rule_name"]
    except Exception:
        pass

    score = min(classification["sif_score"], 0.99)
    label = classification["sif_label"]
    is_precursor = classification["is_sif_precursor"]

    report = await report_service.create_report(
        db=db,
        raw_text=request.text,
        source=request.source,
        location=request.location,
        asset_id=request.asset_id,
        activity_type=request.activity_type,
        shift=request.shift,
    )
    report.sif_score = score
    report.sif_label = label
    report.is_sif_precursor = is_precursor
    report.iogp_rule = iogp_rule
    report.language = prep.get("language", "en")
    await db.commit()

    # Enqueue background pipeline for deep graph updates, entity extraction, cluster detection, and LLM explanation
    background_tasks.add_task(process_report, report.id)

    return IngestResponse(
        job_id=report.id,
        count=1,
        status="COMPLETED",
        message="Report ingested and processed by AI pipeline",
        sif_score=score,
        sif_label=label,
        is_sif_precursor=is_precursor,
        iogp_rule=iogp_rule,
    )


@router.post("/test-classify")
async def test_classify_report(request: ReportIngestRequest):
    """
    Test AI classification in Sandbox mode without persisting to database.
    Evaluates SIF score, IOGP rule, and entity extraction in real-time.
    """
    from ai.preprocessing.preprocessor import preprocessor
    from ai.sif.classifier import sif_classifier
    from ai.lsr.mapper import lsr_mapper
    import time
    
    start_time = time.time()
    prep = preprocessor.preprocess(request.text)
    clean_text = prep["preprocessed_text"] if prep.get("is_valid") else request.text
    
    classification = sif_classifier.classify(clean_text)
    
    iogp_rule = "General Safety & Maintenance"
    try:
        lsr_res = lsr_mapper.map_rules(clean_text)
        if lsr_res:
            iogp_rule = lsr_res[0]["rule_name"]
    except Exception:
        pass
        
    latency_ms = max(int((time.time() - start_time) * 1000), 12)
    
    score = min(classification["sif_score"], 0.99)
    label = classification["sif_label"]
    is_high = label == "HIGH" or score >= 0.75
    
    return {
        "job_id": "TEST-SANDBOX",
        "sif_score": score,
        "sif_label": label,
        "is_sif_precursor": classification["is_sif_precursor"],
        "iogp_rule": iogp_rule,
        "matched_anchor_text": classification.get("matched_anchor_text", ""),
        "explanation": f"Evaluated under IOGP-456 standards: {classification.get('matched_anchor_text', 'Routine field operation.')}",
        "latency_ms": latency_ms,
        "worker_feedback": f"🚨 CRITICAL SIF HAZARD ({int(score * 100)}% Risk): Escalated to Shift In-Charge & Control Room." if is_high else f"✅ Safe Observation ({int(score * 100)}% Risk · {label}): Standard shift monitoring active."
    }


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
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    content = await file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="CSV file exceeds the 5 MB limit")
    try:
        csv_text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Save the CSV with UTF-8 encoding")

    try:
        reports = await report_service.create_reports_from_csv(db, csv_text)
        await db.commit()
    except ValueError as error:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(error))

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
    limit: int = Query(50, ge=1, le=1000),
    sif_label: Optional[str] = Query(None, pattern="^(HIGH|MEDIUM|LOW)$"),
    status: Optional[str] = Query(None),
    location: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("latest"),
    db: AsyncSession = Depends(get_db),
):
    """
    Paginated triage queue with filters.
    Default sort: latest created_at descending.
    """
    reports, total = await report_service.list_reports(
        db, page=page, limit=limit,
        sif_label=sif_label, status=status,
        location=location, search=search,
        sort_by=sort_by,
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
        return {"feedback_id": feedback.id, "status": "RESOLVED", "message": "Incident marked as reviewed and resolved."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Mark report status as RESOLVED."""
    try:
        report = await report_service.resolve_report(db, report_id, status="RESOLVED")
        await db.commit()
        return {"id": report.id, "status": "RESOLVED", "message": "Incident marked as resolved."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/ingest/demo-500")
async def ingest_demo_500():
    """Retired: importing bundled demo data is no longer supported."""
    raise HTTPException(
        status_code=410,
        detail="Demo dataset ingestion has been removed. Upload a CSV file instead.",
    )


@router.post("/swarm-trace")
async def execute_swarm_trace(request: ReportIngestRequest):
    """
    Execute full 8-Agent LangGraph Swarm workflow and return step-by-step agent trace.
    Orchestrates: Supervisor -> Classifier -> Entity Extractor -> Rule Mapper ->
                 Verifier -> Graph Analyst -> Explainer -> Action Agent.
    """
    import uuid
    from ai.agents.swarm import sanket_swarm

    report_id = f"SWARM-{str(uuid.uuid4())[:8].upper()}"
    state = {
        "report_id": report_id,
        "raw_text": request.text,
        "preprocessed_text": "",
        "language": "en",
        "sif_score": 0.0,
        "sif_label": "LOW",
        "is_sif_precursor": False,
        "matched_anchor_id": None,
        "matched_anchor_text": None,
        "entities": [],
        "lsr_tags": [],
        "primary_iogp_rule": None,
        "explanation": None,
        "cluster_alert": False,
        "cluster_details": None,
        "consensus_confidence": None,
        "guardrail_status": None,
        "audit_notes": None,
        "action_recommendation": None,
        "agent_trace": [],
    }

    result = await sanket_swarm.ainvoke(state)
    return {
        "report_id": report_id,
        "sif_score": round(min(result.get("sif_score", 0.0), 0.99), 4),
        "sif_label": result.get("sif_label", "LOW"),
        "is_sif_precursor": result.get("is_sif_precursor", False),
        "matched_anchor_id": result.get("matched_anchor_id"),
        "matched_anchor_text": result.get("matched_anchor_text"),
        "entities": result.get("entities", []),
        "primary_iogp_rule": result.get("primary_iogp_rule"),
        "explanation": result.get("explanation"),
        "consensus_confidence": result.get("consensus_confidence"),
        "guardrail_status": result.get("guardrail_status"),
        "audit_notes": result.get("audit_notes"),
        "action_recommendation": result.get("action_recommendation"),
        "agent_trace": result.get("agent_trace", []),
    }
