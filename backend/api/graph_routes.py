"""
SANKET · AI — Graph API Routes
Knowledge graph signals and cluster data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.engine import get_db
from backend.models.alert import SystemicAlert
from backend.models.report import Report
from graph.graph_store import graph_store

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])


@router.get("/signals")
async def get_graph_signals(db: AsyncSession = Depends(get_db)):
    """
    Returns Cytoscape.js-compatible {nodes[], edges[]} for the
    Safety Signal Knowledge Graph visualization.
    Auto-populates from database if in-memory store is empty.
    """
    if graph_store.node_count == 0:
        # Load high-risk reports to build initial graph
        result = await db.execute(select(Report).limit(60))
        reports = result.scalars().all()
        for r in reports:
            entities = []
            if r.location:
                entities.append({"type": "Location", "value": r.location})
            if r.activity_type:
                entities.append({"type": "Activity", "value": r.activity_type})
            if r.iogp_rule:
                entities.append({"type": "LSR Rule", "value": r.iogp_rule})
            
            # Simple keyword extraction for equipment
            for eq in ["BOP", "Pump", "Valve", "Crane", "Compressor", "Flange", "Scaffolding", "Generator", "Wellhead", "Tank"]:
                if eq.lower() in (r.raw_text or "").lower():
                    entities.append({"type": "Equipment", "value": eq})

            if entities:
                graph_store.add_report_entities(
                    report_id=r.id,
                    entities=entities,
                    sif_label=r.sif_label or "LOW",
                    timestamp=r.created_at.isoformat() if r.created_at else None
                )

    return graph_store.to_cytoscape_json()


@router.get("/clusters")
async def get_clusters(
    status: str = None,
    db: AsyncSession = Depends(get_db),
):
    """Returns active systemic risk clusters."""
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
