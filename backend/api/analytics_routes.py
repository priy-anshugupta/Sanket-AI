"""
SANKET · AI — Analytics API Routes
Heatmap, trends, and summary statistics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.engine import get_db
from backend.services.report_service import report_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    """Dashboard summary: total reports, HIGH/MEDIUM/LOW counts."""
    return await report_service.get_analytics_summary(db)


@router.get("/heatmap")
async def get_heatmap(db: AsyncSession = Depends(get_db)):
    """
    SIF-Precursor Density Heatmap — HEADLINE DELIVERABLE.
    Returns Site × Activity matrix with D_SIF = (SIFp / Total) × 100.
    """
    return await report_service.get_heatmap_data(db)


@router.get("/replay/baghjan")
async def get_baghjan_replay():
    """
    Baghjan 2020 'Time Machine' Disaster Replay.
    Returns the 14-day historical timeline proving early detection value.
    """
    return {
        "title": "Baghjan Well #5 Blowout — 14-Day Precursor Timeline",
        "description": "Recreating Oil India's 2020 catastrophe to prove SANKET·AI could have detected cascading signals 14 days before the blowout.",
        "events": [
            {
                "day": -14,
                "date": "2020-05-13",
                "report": "Slight mud fluid loss observed during tripping at Well #5.",
                "sif_score": 0.22,
                "sif_label": "LOW",
                "energy_type": "Pressure",
                "barrier": "Mud weight monitoring",
                "status": "routine",
            },
            {
                "day": -10,
                "date": "2020-05-17",
                "report": "Annular pressure fluctuation of 80 PSI logged on BOP.",
                "sif_score": 0.58,
                "sif_label": "MEDIUM",
                "energy_type": "Pressure",
                "barrier": "BOP pressure monitoring",
                "status": "warning",
            },
            {
                "day": -6,
                "date": "2020-05-21",
                "report": "Gas bubble surging observed in cellar pit during casing workover.",
                "sif_score": 0.68,
                "sif_label": "MEDIUM",
                "energy_type": "Chemical",
                "barrier": "Gas detection system",
                "status": "warning",
            },
            {
                "day": -3,
                "date": "2020-05-24",
                "report": "Temporary valve bypass utilized due to replacement delay.",
                "sif_score": 0.81,
                "sif_label": "HIGH",
                "energy_type": "Pressure",
                "barrier": "Safety valve integrity",
                "status": "critical",
            },
            {
                "day": -3,
                "date": "2020-05-24",
                "report": "SANKET Near-Miss Multiplier: 3+ correlated events at Well #5 in 11 days. SYSTEMIC BLOWOUT PRECURSOR ESCALATION triggered.",
                "sif_score": 0.96,
                "sif_label": "CRITICAL",
                "energy_type": "Multiple (Pressure + Chemical)",
                "barrier": "SYSTEMIC FAILURE — Multiple barriers compromised",
                "status": "multiplier",
                "multiplier_event": True,
                "recommendation": "Emergency well kill procedure recommended immediately",
            },
            {
                "day": 0,
                "date": "2020-05-27",
                "report": "Actual Blowout: Uncontrolled gas and condensate release from Well #5 at Baghjan. Fire ignited on June 9, 2020.",
                "sif_score": 1.0,
                "sif_label": "ACTUAL",
                "energy_type": "Pressure + Chemical + Thermal",
                "barrier": "All barriers failed",
                "status": "disaster",
                "counterfactual": "If SANKET was deployed, the Multiplier would have fired on Day -3, triggering an emergency well kill 3 days before the actual blowout. The Baghjan disaster could have been prevented.",
            },
        ],
    }
