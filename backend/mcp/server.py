"""
SANKET · AI — FastMCP Tool Registry
Exposes safety analytics, IOGP rules, cluster detection, and PDF generation
as in-process MCP tools for autonomous AI agent consumption.
"""

from typing import Optional
from fastmcp import FastMCP
from sqlalchemy import select

from backend.db.engine import async_session_factory
from backend.models.report import Report
from backend.services.report_service import report_service
from ai.lsr.mapper import lsr_mapper
from graph.clustering import cluster_detector
from backend.pdf.generator import pdf_generator

mcp = FastMCP("sanket-safety-engine")


@mcp.tool()
async def query_past_incidents(
    keywords: list[str],
    location: Optional[str] = None,
    limit: int = 5
) -> list[dict]:
    """
    Search historical incident database for similar past safety observations.
    Useful for finding recurring precursor patterns at specific assets.
    """
    async with async_session_factory() as db:
        query = select(Report)
        if location:
            query = query.where(Report.location.ilike(f"%{location}%"))
        query = query.order_by(Report.submitted_at.desc()).limit(limit)

        result = await db.execute(query)
        reports = result.scalars().all()

        return [
            {
                "id": r.id,
                "text": r.raw_text,
                "sif_label": r.sif_label,
                "sif_score": r.sif_score,
                "location": r.location,
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
            }
            for r in reports
        ]


@mcp.tool()
async def lookup_iogp_rule(rule_name_or_id: str) -> dict:
    """
    Lookup official IOGP 9 Life-Saving Rules barrier requirements and guidance.
    """
    rule = lsr_mapper.get_rule_by_name(rule_name_or_id) or lsr_mapper.get_rule_by_id(rule_name_or_id)
    if rule:
        return rule
    return {
        "error": f"Rule '{rule_name_or_id}' not found in IOGP Life-Saving Rules corpus.",
        "valid_rules": [r["rule_name"] for r in lsr_mapper.rules]
    }


@mcp.tool()
async def detect_graph_clusters(
    entity_value: str,
    entity_type: str = "EQUIPMENT",
    window_days: int = 7
) -> dict:
    """
    Check if an asset or location has triggered the Near-Miss Multiplier
    (>=3 correlated events in rolling window).
    """
    async with async_session_factory() as db:
        cluster_info = await cluster_detector.check_clusters(
            db=db,
            entity_type=entity_type,
            entity_value=entity_value,
            window_days=window_days,
        )
        return cluster_info


@mcp.tool()
async def generate_executive_pdf_brief(report_id: str) -> dict:
    """
    Generate an Executive Safety PDF Brief for boardroom / HSE management distribution.
    """
    async with async_session_factory() as db:
        report = await report_service.get_report(db, report_id)
        if not report:
            return {"error": f"Report {report_id} not found"}

        filepath = pdf_generator.generate_brief(report)
        return {
            "success": True,
            "report_id": report.id,
            "pdf_path": filepath,
            "sif_label": report.sif_label,
            "sif_score": report.sif_score,
        }
