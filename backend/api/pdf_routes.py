"""
SANKET · AI — PDF Download & Generation API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os

from backend.db.engine import get_db
from backend.services.report_service import report_service
from backend.pdf.generator import pdf_generator

from typing import Optional

router = APIRouter(tags=["PDF Generation"])


@router.get("/api/pdf/shift-handover")
@router.get("/api/reports/shift-handover/pdf")
async def get_shift_handover_pdf(
    rig_id: Optional[str] = "OIL-RIG-05 (Baghjan Complex / Upper Assam Basin)",
    shift_name: Optional[str] = "DAY SHIFT (06:00 – 18:00 IST) ➔ NIGHT SHIFT RELIEF",
    outgoing_supervisor: Optional[str] = "Tikheswar Gohain (Badge: OIL-SUP-2940)",
    incoming_supervisor: Optional[str] = "Pranjal Borah (Badge: OIL-SUP-3185)",
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and stream the 1-Page Official Oil India Limited Statutory Shift Handover Briefing (Form OISD-189/DGMS).
    Fetches open SIF precursors dynamically from the live triage database.
    """
    open_reports = []
    try:
        reports_high, _ = await report_service.list_reports(db, limit=3, sif_label="HIGH")
        reports_med, _ = await report_service.list_reports(db, limit=2, sif_label="MEDIUM")
        open_reports = (reports_high or []) + (reports_med or [])
    except Exception as e:
        print(f"[PDF] DB query fallback for shift handover: {e}", flush=True)

    shift_data = {
        "rig_id": rig_id,
        "shift_name": shift_name,
        "outgoing_supervisor": outgoing_supervisor,
        "incoming_supervisor": incoming_supervisor,
    }

    filepath = pdf_generator.generate_shift_handover(shift_data=shift_data, open_reports=open_reports)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate Shift Handover PDF")

    filename = os.path.basename(filepath)
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )


@router.get("/api/reports/{report_id}/pdf")
async def get_report_pdf(report_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generate and stream an Executive Safety PDF Brief for a specific report.
    """
    report = await report_service.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    filepath = pdf_generator.generate_brief(report)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate PDF document")

    filename = os.path.basename(filepath)
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )


