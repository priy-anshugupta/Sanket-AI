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

router = APIRouter(prefix="/api/reports", tags=["PDF Generation"])


@router.get("/{report_id}/pdf")
async def get_report_pdf(report_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generate and stream an Executive Safety PDF Brief for a specific report.
    """
    report = await report_service.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate the PDF file
    filepath = pdf_generator.generate_brief(report)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate PDF document")

    filename = os.path.basename(filepath)
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf"
    )
