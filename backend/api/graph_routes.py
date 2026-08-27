"""
SANKET · AI — Graph API Routes
Knowledge graph signals and cluster data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.engine import get_db
from backend.models.alert import SystemicAlert
from graph.graph_store import graph_store

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])


@router.get("/signals")
async def get_graph_signals(db: AsyncSession = Depends(get_db)):
    """
    Returns Cytoscape.js-compatible {nodes[], edges[]} for the
    Safety Signal Knowledge Graph visualization.
    """
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
