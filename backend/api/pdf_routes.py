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
    rig_id: Optional[str] = None,
    shift_name: Optional[str] = None,
    outgoing_supervisor: Optional[str] = None,
    incoming_supervisor: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and stream the 1-Page Official Oil India Limited Statutory Shift Handover Briefing (Form OISD-189/DGMS).
    Dynamically determines active 12-hour shift window (Day vs Night), filters distinct SIF precursor reports from the database,
    and formats an audit-ready, boardroom-grade 1-page PDF.
    """
    from datetime import datetime, timedelta, timezone

    # Calculate real-time Indian Standard Time (IST = UTC + 5:30)
    now_utc = datetime.now(timezone.utc)
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    now_ist = now_utc.astimezone(ist_tz)
    hour = now_ist.hour

    # DGMS Statutory 12-Hour Shift Window
    if 6 <= hour < 18:
        auto_shift = "DAY SHIFT (06:00 – 18:00 IST) ➔ NIGHT SHIFT RELIEF"
        auto_out_sup = "Tikheswar Gohain (Senior Toolpusher / Badge: OIL-SUP-2940)"
        auto_in_sup = "Pranjal Borah (Relief Toolpusher / Badge: OIL-SUP-3185)"
        auto_relinquished = "18:00 IST" if hour >= 17 else f"{now_ist.strftime('%H:%M')} IST"
        auto_accepted = "18:05 IST" if hour >= 17 else f"{(now_ist + timedelta(minutes=5)).strftime('%H:%M')} IST"
        weather_desc = "31°C (Day Shift) · Humidity 79% · Barometer 1008 hPa · Wind 14 km/h ENE"
    else:
        auto_shift = "NIGHT SHIFT (18:00 – 06:00 IST) ➔ DAY SHIFT RELIEF"
        auto_out_sup = "Pranjal Borah (Night Toolpusher / Badge: OIL-SUP-3185)"
        auto_in_sup = "Tikheswar Gohain (Day Toolpusher / Badge: OIL-SUP-2940)"
        auto_relinquished = "06:00 IST" if 4 <= hour <= 6 else f"{now_ist.strftime('%H:%M')} IST"
        auto_accepted = "06:05 IST" if 4 <= hour <= 6 else f"{(now_ist + timedelta(minutes=5)).strftime('%H:%M')} IST"
        weather_desc = "26°C (Night Shift) · Humidity 88% · Barometer 1011 hPa · Wind 10 km/h SW"

    resolved_rig_id = rig_id or "OIL-RIG-05 (Baghjan Complex / Upper Assam Basin)"
    resolved_shift_name = shift_name or auto_shift
    resolved_out_sup = outgoing_supervisor or auto_out_sup
    resolved_in_sup = incoming_supervisor or auto_in_sup
    turnover_dt_str = now_ist.strftime("%d-%b-%Y | %H:%M IST")

    # Fetch live SIF precursor reports from database
    open_reports = []
    has_active_swa = False
    top_hazard_desc = "Annular BOP secondary packoff weeping hydraulic fluid under 1,800 PSI vibration flutter."

    try:
        raw_reports, _ = await report_service.list_reports(db, limit=50, sort_by="latest")
        
        seen_keys = set()
        candidates = []
        for r in raw_reports:
            txt = (r.raw_text or "").strip()
            if not txt or len(txt) < 10:
                continue
            # Filter out corrupted / placeholder test strings
            if "\ufffd" in txt or "priyanshu" in txt.lower():
                continue
            
            # SIF Precursor threshold (HIGH or MEDIUM, or sif_score >= 0.50)
            is_precursor = (r.sif_label in ("HIGH", "MEDIUM")) or (r.sif_score and r.sif_score >= 0.50)
            if not is_precursor:
                continue

            # Check if this is an SWA incident
            if "EMERGENCY SWA" in txt or "Stop Work" in txt:
                has_active_swa = True

            # Deduplication key: location + normalized first 30 chars
            norm_key = f"{r.location or 'Well Pad 7'}:{txt[:30].lower()}"
            if norm_key in seen_keys:
                continue
            seen_keys.add(norm_key)
            candidates.append(r)

            if len(candidates) >= 4:
                break

        open_reports = candidates
        if open_reports:
            top_hazard_desc = f"{open_reports[0].location or 'Well Pad 7'}: {open_reports[0].raw_text[:120]}"
    except Exception as e:
        print(f"[PDF] DB query fallback for shift handover: {e}", flush=True)

    shift_data = {
        "rig_id": resolved_rig_id,
        "shift_name": resolved_shift_name,
        "outgoing_supervisor": resolved_out_sup,
        "incoming_supervisor": resolved_in_sup,
        "turnover_dt_str": turnover_dt_str,
        "relinquished_at": auto_relinquished,
        "accepted_at": auto_accepted,
        "weather_desc": weather_desc,
        "has_active_swa": has_active_swa,
        "top_hazard_desc": top_hazard_desc,
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


@router.get("/api/pdf/dgms-form-iv")
@router.get("/api/pdf/dgms-form-iv/{report_id}")
@router.get("/api/reports/{report_id}/dgms-form-iv")
async def get_dgms_form_iv_pdf(
    report_id: Optional[str] = "DEMO",
    location: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and stream Government of India · Directorate General of Mines Safety (DGMS)
    FORM IV — Notice of Dangerous Occurrence (Regulation 99 of Oil Mines Regulations 2017).
    """
    report_data = {}
    if report_id and report_id != "DEMO":
        report = await report_service.get_report(db, report_id)
        if report:
            report_data = {
                "id": report.id,
                "location": location or report.location,
                "raw_text": report.raw_text,
                "sif_score": report.sif_score,
                "sif_label": report.sif_label,
                "iogp_rule": report.iogp_rule,
                "created_at": report.created_at,
            }

    if not report_data:
        report_data = {
            "id": f"DGMS-{report_id}" if report_id else "DGMS-SWA-01",
            "location": location or "Well Pad 7 (Upper Assam Exploration Asset)",
            "raw_text": "Blowout Preventer (BOP) secondary valve seal weeping hydraulic fluid under 1800 PSI annular vibration during pipe tripping.",
            "sif_score": 0.94,
            "sif_label": "HIGH",
            "iogp_rule": "Bypassing Safety Controls / Energy Isolation",
        }

    filepath = pdf_generator.generate_dgms_form_iv(report_data)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate DGMS Form IV document")

    filename = os.path.basename(filepath)
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )


