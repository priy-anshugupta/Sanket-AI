"""
SANKET · AI — Background Pipeline Worker
Async worker that runs the 5-stage NLP pipeline for each report.
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
        Stage 2: SIF Classification
        Stage 3: Entity Extraction (Phase 2)
        Stage 4: LSR Mapping (Phase 2)
        Stage 5: LLM Explanation (Phase 2)
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

            # ── Stage 3: Entity Extraction (loaded dynamically) ──
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
            except ImportError:
                pass  # Entity extractor not yet built (Phase 2)
            except Exception as e:
                print(f"[Pipeline] Entity extraction warning: {e}")

            # ── Stage 4: LSR Mapping (loaded dynamically) ──
            iogp_rule = None
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
            except ImportError:
                pass  # LSR mapper not yet built (Phase 2)
            except Exception as e:
                print(f"[Pipeline] LSR mapping warning: {e}")

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
                except ImportError:
                    pass  # Explainer not yet built (Phase 2)
                except Exception as e:
                    print(f"[Pipeline] LLM explanation warning: {e}")

            # ── Complete the report ──
            await report_service.complete_report(
                db, report_id,
                explanation=explanation,
                iogp_rule=iogp_rule,
            )

            await db.commit()
            print(f"[Pipeline] [OK] Report {report_id[:8]}... completed -> {classification['sif_label']} ({classification['sif_score']})")

        except Exception as e:
            await db.rollback()
            print(f"[Pipeline] [ERROR] Report {report_id[:8]}... failed: {e}")
            traceback.print_exc()
            async with async_session_factory() as error_db:
                await report_service.fail_report(error_db, report_id, str(e))
                await error_db.commit()


async def process_batch(report_ids: list[str]):
    """Process a batch of reports concurrently."""
    tasks = [process_report(rid) for rid in report_ids]
    await asyncio.gather(*tasks, return_exceptions=True)
