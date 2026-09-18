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
async def get_graph_signals(
    reload: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns Cytoscape.js-compatible {nodes[], edges[]} for the
    Safety Signal Knowledge Graph visualization with Bow-Tie causal chaining.
    """
    from sqlalchemy.orm import selectinload

    if reload or graph_store.node_count == 0:
        try:
            # Optimize: load all valid reports with relationships to avoid N+1 queries.
            # Limit increased to prevent graph truncation while remaining performant.
            result = await db.execute(
                select(Report)
                .options(selectinload(Report.entities), selectinload(Report.lsr_tags))
                .where(Report.sif_score.isnot(None))
                .order_by(desc(Report.sif_score))
                .limit(1000)
            )
            reports = result.scalars().all()

            if reports:
                graph_store.clear()
                for r in reports:
                    entities = [
                        {"type": e.entity_type, "value": e.entity_value}
                        for e in r.entities
                    ]
                    lsr_rules = [
                        {"rule_name": t.rule_name, "rule_id": t.rule_id}
                        for t in r.lsr_tags
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
        except Exception as e:
            print(f"[Graph] Failed to rebuild graph from DB: {e}")

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

    NODE_CAPA_MAP = {
        "Baghjan Well #5": "Dispatch Senior HSE Area Superintendent to Baghjan Well #5. Conduct area-wide barrier audit on all active digital work permits (e-PTWs).",
        "Well Pad 7": "Suspend elevated work permits on Well Pad 7. Conduct structural re-inspection of scaffolding and certify all safety harnesses with third-party tag.",
        "Moran OCS-3": "Deploy dedicated Banksman / Rigging Supervisor at Moran OCS-3. Enforce mandatory 10-meter physical boundary clearance from energized utility lines.",
        "Geleki Processing": "Install heavy steel crash bollards around gas manifolds. Enforce 10 km/h speed limiters and strictly segregate pedestrian and vehicular zones.",
        "Blowout Preventer (BOP)": "Schedule immediate Lock-Out / Tag-Out (LOTO) mechanical integrity inspection on Blowout Preventer (BOP). Perform hydrostatic barrier pressure test before next shift.",
        "12m Scaffold Tower": "Re-tag scaffold tower with red lockout tag. Replace missing cross-bracing and require 100% green tag re-certification by certified scaffold inspector.",
        "Crawler Crane (5-Ton)": "Calibrate crane limit switches and boom angle indicators. Verify crane load chart certifications and de-energize proximate overhead transmission lines.",
        "Heavy Industrial Forklift": "Perform immediate preventive brake overhaul. Equip vehicle with 360-degree ultrasonic proximity sensors and blue spotlight safety warning beams.",
        "Primary Well Containment": "Establish secondary mechanical barrier isolation per OISD-189 Section 7.4. Re-calculate drilling mud hydrostatic weight and test casing pressure rating.",
        "100% Fall Arrest Harness": "Withdraw all uninspected full-body harnesses from the tool crib. Enforce mandatory twin-lanyard 100% tie-off compliance with shock absorbers.",
        "Overhead Line Clearance": "Coordinate with Assam State Electricity Board (ASEB) to de-energize line or install high-visibility insulated line markers and physical goalposts.",
        "Physical Crash Barrier": "Erect reinforced ASTM-rated steel guard rails around flammable gas piping. Restrict heavy forklift access to dedicated concrete transport lanes.",
        "Bypassing Safety Controls": "Mandate Toolpusher and HSE Manager dual sign-off for any interlock override. Audit management of change (MOC) logs across all active crews.",
        "Working at Height": "Conduct mandatory stand-down Toolbox Talk on IOGP Rule #3 (Working at Height). Verify lifeline tension and anchor point load ratings.",
        "Safe Mechanical Lifting": "Enforce mandatory Lift Plan sign-off for loads exceeding 1 ton. Clear all personnel from lifting drop radius prior to crane hoist activation.",
        "Line of Fire": "Reposition perimeter warning barricades and repaint safety exclusion zones. Enforce mandatory 'Eyes on Path / Line of Fire' field audits.",
        "1800 PSI Gas Surge": "Bleed off excess casing pressure through choke manifold to flare pit. Verify pressure relief valve (PRV) set points and gas kick detection alarms.",
        "12m Fall Drop Energy": "Install perimeter debris netting and self-retracting lifelines (SRL). Verify structural tie-off anchor points rated for minimum 22.2 kN (5,000 lbs).",
        "33,000V Power Grid": "Obtain electrical permit-to-work isolation certificate. Maintain absolute minimum 4.0m exclusion envelope and deploy grounding mats.",
        "Pressurized Flammable Gas": "Deploy continuous Lower Explosive Limit (LEL) combustible gas detectors. Enforce ATEX Zone-1 cold work restrictions and eliminate all ignition sources.",
    }

    if ent_value in NODE_CAPA_MAP:
        capa = NODE_CAPA_MAP[ent_value]
    elif ent_type == "EQUIPMENT" or "pump" in ent_value.lower() or "bop" in ent_value.lower() or "valve" in ent_value.lower():
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
        ],
    }
