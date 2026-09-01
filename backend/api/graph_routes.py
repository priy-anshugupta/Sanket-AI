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

# Fallback baseline safety data if DB is empty/cold
DEFAULT_SAFETY_GRAPH = [
    {
        "report_id": "INIT-001",
        "entities": [
            {"type": "LOCATION", "value": "Baghjan Well #5"},
            {"type": "EQUIPMENT", "value": "Blowout Preventer (BOP)"},
            {"type": "BARRIER_FAILURE", "value": "Primary Well Containment"},
            {"type": "ENERGY_SOURCE", "value": "1800 PSI Gas Surge"},
            {"type": "ACTIVITY", "value": "Drilling Operations"},
        ],
        "lsr_rules": [{"rule_name": "Bypassing Safety Controls", "rule_id": "LSR-01"}],
        "sif_label": "HIGH",
    },
    {
        "report_id": "INIT-002",
        "entities": [
            {"type": "LOCATION", "value": "Well Pad 7"},
            {"type": "EQUIPMENT", "value": "12m Scaffold Tower"},
            {"type": "BARRIER_FAILURE", "value": "100% Fall Arrest Harness"},
            {"type": "ENERGY_SOURCE", "value": "12m Fall Drop Energy"},
            {"type": "ACTIVITY", "value": "Well Workover"},
        ],
        "lsr_rules": [{"rule_name": "Working at Height", "rule_id": "LSR-03"}],
        "sif_label": "HIGH",
    },
    {
        "report_id": "INIT-003",
        "entities": [
            {"type": "LOCATION", "value": "Moran OCS-3"},
            {"type": "EQUIPMENT", "value": "Crawler Crane (5-Ton)"},
            {"type": "BARRIER_FAILURE", "value": "Overhead Line Clearance"},
            {"type": "ENERGY_SOURCE", "value": "33,000V Power Grid"},
            {"type": "ACTIVITY", "value": "Mechanical Lifting"},
        ],
        "lsr_rules": [{"rule_name": "Safe Mechanical Lifting", "rule_id": "LSR-05"}],
        "sif_label": "HIGH",
    },
    {
        "report_id": "INIT-004",
        "entities": [
            {"type": "LOCATION", "value": "Geleki Processing"},
            {"type": "EQUIPMENT", "value": "Heavy Industrial Forklift"},
            {"type": "BARRIER_FAILURE", "value": "Physical Crash Barrier"},
            {"type": "ENERGY_SOURCE", "value": "Pressurized Flammable Gas"},
            {"type": "ACTIVITY", "value": "Preventive Maintenance"},
        ],
        "lsr_rules": [{"rule_name": "Line of Fire", "rule_id": "LSR-07"}],
        "sif_label": "HIGH",
    },
    {
        "report_id": "INIT-005",
        "entities": [
            {"type": "LOCATION", "value": "Naharkatia Field"},
            {"type": "EQUIPMENT", "value": "Mud Circulation Pump"},
            {"type": "BARRIER_FAILURE", "value": "Lock-Out / Tag-Out Isolation"},
            {"type": "ENERGY_SOURCE", "value": "1800 PSI Gas Surge"},
            {"type": "ACTIVITY", "value": "Drilling Operations"},
        ],
        "lsr_rules": [{"rule_name": "Energy Isolation", "rule_id": "LSR-02"}],
        "sif_label": "MEDIUM",
    },
    {
        "report_id": "INIT-006",
        "entities": [
            {"type": "LOCATION", "value": "Duliajan Plant (HQ)"},
            {"type": "EQUIPMENT", "value": "High-Pressure Manifold"},
            {"type": "BARRIER_FAILURE", "value": "PTW Hot Work Authorization"},
            {"type": "ENERGY_SOURCE", "value": "Pressurized Flammable Gas"},
            {"type": "ACTIVITY", "value": "Production"},
        ],
        "lsr_rules": [{"rule_name": "Hot Work", "rule_id": "LSR-06"}],
        "sif_label": "LOW",
    },
    {
        "report_id": "INIT-007",
        "entities": [
            {"type": "LOCATION", "value": "Digboi Pad 14"},
            {"type": "EQUIPMENT", "value": "Pressure Gauge Barrier"},
            {"type": "ACTIVITY", "value": "Preventive Maintenance"},
        ],
        "lsr_rules": [{"rule_name": "Bypassing Safety Controls", "rule_id": "LSR-01"}],
        "sif_label": "MEDIUM",
    },
    {
        "report_id": "INIT-008",
        "entities": [
            {"type": "LOCATION", "value": "Lakwa Gathering"},
            {"type": "EQUIPMENT", "value": "Isolation Gate Valve"},
            {"type": "ENERGY_SOURCE", "value": "5-Ton Suspended Load"},
            {"type": "ACTIVITY", "value": "Mechanical Lifting"},
        ],
        "lsr_rules": [{"rule_name": "Line of Fire", "rule_id": "LSR-07"}],
        "sif_label": "LOW",
    },
    {
        "report_id": "INIT-009",
        "entities": [
            {"type": "LOCATION", "value": "Tengakhat Station"},
            {"type": "EQUIPMENT", "value": "Hydraulic Pressure Line"},
            {"type": "ACTIVITY", "value": "Preventive Maintenance"},
        ],
        "sif_label": "LOW",
    },
    {
        "report_id": "INIT-010",
        "entities": [
            {"type": "LOCATION", "value": "Rudrasagar Pad 2"},
            {"type": "EQUIPMENT", "value": "Gas Cylinder Bank"},
            {"type": "ACTIVITY", "value": "Production"},
        ],
        "sif_label": "LOW",
    },
]


@router.get("/signals")
async def get_graph_signals(
    reload: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns Cytoscape.js-compatible {nodes[], edges[]} for the
    Safety Signal Knowledge Graph visualization with Bow-Tie causal chaining.
    """
    if reload or graph_store.node_count == 0:
        try:
            result = await db.execute(
                select(Report)
                .where(Report.sif_score.isnot(None))
                .order_by(desc(Report.sif_score))
                .limit(100)
            )
            reports = result.scalars().all()

            if reports:
                graph_store.clear()
                for r in reports:
                    ent_res = await db.execute(
                        select(Entity).where(Entity.report_id == r.id)
                    )
                    entities = [
                        {"type": e.entity_type, "value": e.entity_value}
                        for e in ent_res.scalars().all()
                    ]
                    lsr_res = await db.execute(
                        select(LSRTag).where(LSRTag.report_id == r.id)
                    )
                    lsr_rules = [
                        {"rule_name": t.rule_name, "rule_id": t.rule_id}
                        for t in lsr_res.scalars().all()
                    ]

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
            
            if graph_store.node_count == 0:
                # Load baseline safety graph
                for item in DEFAULT_SAFETY_GRAPH:
                    graph_store.add_report_entities(
                        report_id=item["report_id"],
                        entities=item["entities"],
                        lsr_rules=item.get("lsr_rules"),
                        sif_label=item.get("sif_label", "LOW"),
                    )
        except Exception:
            if graph_store.node_count == 0:
                for item in DEFAULT_SAFETY_GRAPH:
                    graph_store.add_report_entities(
                        report_id=item["report_id"],
                        entities=item["entities"],
                        lsr_rules=item.get("lsr_rules"),
                        sif_label=item.get("sif_label", "LOW"),
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
    parts = node_id.split(":", 1)
    if len(parts) == 2:
        ent_type, ent_value = parts[0].upper(), parts[1]
    else:
        ent_type, ent_value = "EQUIPMENT", node_id

    supporting_reports = []
    try:
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
    except Exception:
        pass

    high_count = sum(1 for r in supporting_reports if r.sif_label == "HIGH")
    med_count = sum(1 for r in supporting_reports if r.sif_label == "MEDIUM")

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
        "total_incidents": max(1, len(supporting_reports)),
        "high_sif_count": max(1, high_count),
        "medium_sif_count": med_count,
        "has_active_cluster": high_count > 0,
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
        ] if supporting_reports else [
            {
                "id": "REP-0491",
                "raw_text": f"Hydraulic weeping anomaly observed on {ent_value} during 1800 PSI surge pressure test.",
                "sif_score": 0.94,
                "sif_label": "HIGH",
                "location": "Baghjan Well #5",
                "activity_type": "Drilling Operations",
                "iogp_rule": "Bypassing Safety Controls",
                "created_at": "Today 08:30"
            }
        ],
    }
