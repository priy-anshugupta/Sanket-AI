"""
SANKET · AI — Graph API Routes
Truthful Knowledge Graph signals, evidence-first inspection, and cluster data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from backend.db.engine import get_db
from backend.models.alert import SystemicAlert
from backend.models.report import Report
from backend.models.entity import Entity
from backend.models.lsr_tag import LSRTag
from graph.graph_store import graph_store

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])


@router.get("/signals")
async def get_graph_signals(db: AsyncSession = Depends(get_db)):
    """
    Returns Cytoscape.js-compatible {nodes[], edges[]} for the
    Safety Signal Knowledge Graph visualization.
    Auto-populates from database Entity & LSRTag records if in-memory store is empty.
    """
    if graph_store.node_count == 0:
        # 1. Fetch distinct high & medium risk reports with their extracted entities
        result = await db.execute(
            select(Report)
            .where(Report.sif_score.isnot(None))
            .order_by(desc(Report.sif_score))
            .limit(150)
        )
        reports = result.scalars().all()

        for r in reports:
            # Query extracted entities from SQL
            ent_res = await db.execute(
                select(Entity).where(Entity.report_id == r.id)
            )
            entities = [
                {"type": e.entity_type, "value": e.entity_value}
                for e in ent_res.scalars().all()
            ]

            # Query LSR tags from SQL
            lsr_res = await db.execute(
                select(LSRTag).where(LSRTag.report_id == r.id)
            )
            lsr_rules = [
                {"rule_name": t.rule_name, "rule_id": t.rule_id}
                for t in lsr_res.scalars().all()
            ]

            # Fallbacks from report columns
            if not any(e["type"] == "LOCATION" for e in entities) and r.location:
                entities.append({"type": "LOCATION", "value": r.location})
            if not any(e["type"] == "ACTIVITY" for e in entities) and r.activity_type:
                entities.append({"type": "ACTIVITY", "value": r.activity_type})

            if entities or lsr_rules:
                graph_store.add_report_entities(
                    report_id=r.id,
                    entities=entities,
                    lsr_rules=lsr_rules,
                    sif_label=r.sif_label or "LOW",
                    timestamp=r.submitted_at or r.created_at,
                )

    return graph_store.to_cytoscape_json()


@router.get("/evidence/{node_id:path}")
async def get_node_evidence(
    node_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Evidence-First Safety Graph (F6):
    Returns full supporting incident history, degraded barriers, active clusters,
    and recommended CAPA for any selected equipment, location, or LSR rule node.
    """
    # Parse entity type and value (e.g. "EQUIPMENT:Pump-04" -> "EQUIPMENT", "Pump-04")
    parts = node_id.split(":", 1)
    if len(parts) == 2:
        ent_type, ent_value = parts[0].upper(), parts[1]
    else:
        ent_type, ent_value = "EQUIPMENT", node_id

    # 1. Query all supporting reports for this entity
    query = (
        select(Report)
        .join(Entity, Entity.report_id == Report.id)
        .where(
            func.lower(Entity.entity_value) == ent_value.lower()
        )
        .order_by(desc(Report.created_at))
        .limit(20)
    )
    res = await db.execute(query)
    supporting_reports = res.scalars().all()

    # Fallback: query by location or substring in raw_text if not found in Entity table
    if not supporting_reports:
        res2 = await db.execute(
            select(Report)
            .where(
                (Report.location.ilike(f"%{ent_value}%")) |
                (Report.raw_text.ilike(f"%{ent_value}%"))
            )
            .order_by(desc(Report.sif_score))
            .limit(10)
        )
        supporting_reports = res2.scalars().all()

    # 2. Check for active systemic alerts (Near-Miss Multiplier F7)
    alert_res = await db.execute(
        select(SystemicAlert)
        .where(SystemicAlert.cluster_node.ilike(f"%{ent_value}%"))
        .where(SystemicAlert.status == "ACTIVE")
    )
    active_alert = alert_res.scalar_one_or_none()

    # 3. Analyze barrier degradation and energy sources
    high_count = sum(1 for r in supporting_reports if r.sif_label == "HIGH")
    med_count = sum(1 for r in supporting_reports if r.sif_label == "MEDIUM")

    # Generate context-aware recommended CAPA
    if ent_type == "EQUIPMENT" or "pump" in ent_value.lower() or "bop" in ent_value.lower() or "valve" in ent_value.lower():
        capa = f"Schedule immediate Lock-Out / Tag-Out (LOTO) mechanical integrity inspection on {ent_value}. Perform hydrostatic pressure barrier verification before next active shift."
    elif ent_type == "LOCATION":
        capa = f"Dispatch Senior HSE Area Superintendent to {ent_value}. Conduct area-wide barrier audit on all active digital work permits (e-PTWs)."
    else:
        capa = f"Review standard operating procedures for {ent_value}. Enforce mandatory pre-job safety briefing (Toolbox Talk) with toolpusher sign-off."

    return {
        "node_id": node_id,
        "node_label": ent_value,
        "node_type": ent_type,
        "total_incidents": len(supporting_reports),
        "high_sif_count": high_count,
        "medium_sif_count": med_count,
        "has_active_cluster": active_alert is not None,
        "cluster_details": {
            "alert_id": active_alert.id,
            "event_count": active_alert.event_count,
            "detected_at": active_alert.detected_at.isoformat(),
        } if active_alert else None,
        "recommended_capa": capa,
        "supporting_reports": [
            {
                "id": r.id,
                "raw_text": r.raw_text,
                "sif_score": r.sif_score,
                "sif_label": r.sif_label,
                "location": r.location,
                "activity_type": r.activity_type,
                "iogp_rule": r.iogp_rule,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in supporting_reports
        ]
    }


@router.get("/clusters")
async def get_clusters(
    status: str = None,
    db: AsyncSession = Depends(get_db),
):
    """Returns active systemic risk clusters (Near-Miss Multiplier F7)."""
    query = select(SystemicAlert)
    if status:
        query = query.where(SystemicAlert.status == status)
    else:
        query = query.where(SystemicAlert.status == "ACTIVE")

    result = await db.execute(query)
    alerts = result.scalars().all()

    return {
        "clusters": [
            {
                "id": a.id,
                "cluster_node": a.cluster_node,
                "cluster_type": a.cluster_type,
                "event_count": a.event_count,
                "report_ids": a.report_ids,
                "status": a.status,
                "detected_at": a.detected_at.isoformat() if a.detected_at else None,
            }
            for a in alerts
        ]
    }


@router.get("/stats")
async def get_graph_stats():
    """Graph statistics."""
    return {
        "node_count": graph_store.node_count,
        "edge_count": graph_store.edge_count,
    }
