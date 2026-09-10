"""
SANKET · AI — Background Pipeline Worker
Async worker that runs the 7-stage NLP pipeline for each report.
"""

import asyncio
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.engine import async_session_factory
from backend.services.report_service import report_service
from ai.preprocessing.preprocessor import preprocessor
from ai.sif.classifier import sif_classifier


async def process_report(report_id: str):
    """
    Run the full NLP pipeline for a single report.
    Called as a background task after ingestion.

    Pipeline stages:
        Stage 1: Text Preprocessing
        Stage 2: SIF Classification (Multilingual E5)
        Stage 3: Entity Extraction (8 entity types)
        Stage 4: LSR Mapping (IOGP 9 Life-Saving Rules)
        Stage 5: LLM Explanation (Conditional: score >= 0.50)
        Stage 6: Live Signal Knowledge Graph Update
        Stage 7: Near-Miss Multiplier (7-day / 3-event rolling window escalation)
    """
    async with async_session_factory() as db:
        try:
            # Fetch the report
            report = await report_service.get_report(db, report_id)
            if not report:
                print(f"[Pipeline] Report {report_id} not found")
                return

            print(f"[Pipeline] Processing report {report_id[:8]}...")

            # ── Stage 1: Preprocessing ──
            prep_result = preprocessor.preprocess(report.raw_text)
            if not prep_result["is_valid"]:
                await report_service.fail_report(
                    db, report_id, "Text too short or invalid after preprocessing"
                )
                await db.commit()
                return

            preprocessed_text = prep_result["preprocessed_text"]
            language = prep_result["language"]

            # ── Stage 2: SIF Classification ──
            classification = sif_classifier.classify(preprocessed_text)

            # Update report with classification results
            await report_service.update_report_classification(
                db,
                report_id=report_id,
                sif_score=classification["sif_score"],
                sif_label=classification["sif_label"],
                is_sif_precursor=classification["is_sif_precursor"],
                matched_anchor_id=classification["matched_anchor_id"],
                matched_anchor_text=classification["matched_anchor_text"],
                preprocessed_text=preprocessed_text,
                language=language,
            )

            # ── Stage 3: Entity Extraction ──
            entities = []
            try:
                from ai.entities.extractor import entity_extractor
                entities = entity_extractor.extract(preprocessed_text)
                if entities:
                    from backend.models.entity import Entity
                    import uuid
                    for ent in entities:
                        entity_obj = Entity(
                            id=str(uuid.uuid4()),
                            report_id=report_id,
                            entity_type=ent["type"],
                            entity_value=ent["value"],
                            confidence=ent.get("confidence", 1.0),
                        )
                        db.add(entity_obj)

                    # Auto-detect location/asset from entities if not set
                    if not report.location:
                        loc_entities = [e for e in entities if e["type"] == "LOCATION"]
                        if loc_entities:
                            report.location = loc_entities[0]["value"]
                    if not report.asset_id:
                        eq_entities = [e for e in entities if e["type"] == "EQUIPMENT"]
                        if eq_entities:
                            report.asset_id = eq_entities[0]["value"]
            except Exception as e:
                print(f"[Pipeline] Entity extraction warning: {e}")

            # ── Stage 4: LSR Mapping ──
            iogp_rule = None
            lsr_results = []
            try:
                from ai.lsr.mapper import lsr_mapper
                lsr_results = lsr_mapper.map_rules(preprocessed_text)
                if lsr_results:
                    from backend.models.lsr_tag import LSRTag
                    import uuid as uuid_mod
                    for lr in lsr_results:
                        tag = LSRTag(
                            id=str(uuid_mod.uuid4()),
                            report_id=report_id,
                            rule_name=lr["rule_name"],
                            rule_id=lr["rule_id"],
                            similarity=lr["similarity"],
                        )
                        db.add(tag)
                    iogp_rule = lsr_results[0]["rule_name"]
            except Exception as e:
                print(f"[Pipeline] LSR mapping warning: {e}")

            # Commit classification, entities, and tags immediately to free SQLite write lock!
            await db.commit()

            # ── Stage 5: LLM Explanation (conditional: score >= 0.50) ──
            explanation = None
            if classification["sif_score"] >= 0.50:
                try:
                    from ai.explanation.explainer import llm_explainer
                    explanation = await llm_explainer.explain(
                        text=preprocessed_text,
                        sif_label=classification["sif_label"],
                        sif_score=classification["sif_score"],
                        matched_anchor=classification["matched_anchor_text"],
                    )
                except Exception as e:
                    print(f"[Pipeline] LLM explanation warning: {e}")

            # ── Complete the report ──
            await report_service.complete_report(
                db, report_id,
                explanation=explanation,
                iogp_rule=iogp_rule,
            )

            # Flush to make entity rows available for cluster check
            await db.flush()

            # ── Stage 6: Update Live Signal Knowledge Graph (F6) ──
            try:
                from graph.graph_store import graph_store
                graph_store.add_report_entities(
                    report_id=report_id,
                    entities=entities,
                    lsr_rules=lsr_results,
                    sif_label=classification["sif_label"],
                    timestamp=report.submitted_at or report.created_at,
                )
            except Exception as ge:
                print(f"[Pipeline] Graph store update warning: {ge}")

            # ── Stage 7: Near-Miss Multiplier & Temporal Cluster Escalation (F7) ──
            try:
                from graph.clustering import cluster_detector
                checked_nodes = set()
                for ent in entities:
                    if ent["type"] in ("EQUIPMENT", "LOCATION"):
                        node_key = f"{ent['type']}:{ent['value']}"
                        if node_key not in checked_nodes:
                            checked_nodes.add(node_key)
                            cluster_info = await cluster_detector.check_clusters(
                                db, entity_type=ent["type"], entity_value=ent["value"]
                            )
                            if cluster_info.get("cluster_alert"):
                                print(f"[Multiplier] 🚨 CLUSTER DETECTED for {node_key} ({cluster_info['event_count']} events)! Escalating...")
                                alert = await cluster_detector.escalate_cluster(db, cluster_info)
                                if alert:
                                    print(f"[Multiplier] Created SystemicAlert ID: {alert.id} for {alert.cluster_node}")
            except Exception as ce:
                print(f"[Pipeline] Multiplier cluster check warning: {ce}")

            await db.commit()
            print(f"[Pipeline] [OK] Report {report_id[:8]}... completed -> {classification['sif_label']} ({classification['sif_score']})")

            # ── Stage 8: Real-Time WebSocket Push (<0.2s live sync) ──
            try:
                from backend.services.alert_manager import alert_manager
                from datetime import datetime
                broadcast_payload = {
                    "id": report_id,
                    "report_id": report_id,
                    "raw_text": report.raw_text,
                    "sif_score": classification["sif_score"],
                    "sif_label": classification["sif_label"],
                    "is_sif_precursor": classification["is_sif_precursor"],
                    "location": report.location or "Well Pad 7 (Upper Assam)",
                    "activity_type": report.activity_type or "Drilling",
                    "iogp_rule": iogp_rule or "General Safety & Maintenance",
                    "status": "COMPLETED",
                    "created_at": (report.created_at or datetime.utcnow()).isoformat(),
                }
                await alert_manager.broadcast_new_report(broadcast_payload)

                if classification["sif_label"] == "HIGH" or classification["sif_score"] >= 0.75:
                    await alert_manager.broadcast_sif_alert(broadcast_payload)
            except Exception as bcast_err:
                print(f"[Pipeline] WebSocket broadcast warning: {bcast_err}")

        except Exception as e:
            await db.rollback()
            print(f"[Pipeline] [ERROR] Report {report_id[:8]}... failed: {e}")
            traceback.print_exc()
            async with async_session_factory() as error_db:
                await report_service.fail_report(error_db, report_id, str(e))
                await error_db.commit()


async def process_batch(report_ids: list[str]):
    """Process a batch of reports concurrently with bounded concurrency to protect DB locks."""
    sem = asyncio.Semaphore(3)

    async def _throttled_process(rid: str):
        async with sem:
            return await process_report(rid)

    tasks = [_throttled_process(rid) for rid in report_ids]
    await asyncio.gather(*tasks, return_exceptions=True)
