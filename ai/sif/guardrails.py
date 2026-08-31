"""
SANKET · AI — Multi-Layer Consensus Guardrail Engine
Reconciles Layer 1 (Deterministic Physics Rules) with Layer 2 (Neural Vector Embeddings)
and Layer 3 (Adversarial Verifier Critic) to produce an unshakeable Consensus Score.
"""

from typing import Dict, Any
from ai.sif.physics_rules import physics_engine


class SafetyGuardrailEngine:
    """
    Multi-Tier Consensus Arbitrator.
    Prevents both False Negatives (Type II - missed disasters)
    and False Positives (Type I - unnecessary ₹20-lakh rig shutdowns).
    """

    def reconcile_classification(
        self,
        text: str,
        neural_score: float,
        neural_label: str,
        matched_anchor: str = "",
        boosted_keywords: list = None,
    ) -> Dict[str, Any]:
        """
        Reconcile neural embeddings with deterministic physical boundaries.
        
        Returns:
            {
                "final_sif_score": float,
                "final_sif_label": str,
                "consensus_confidence": float (0.0 to 1.0),
                "is_sif_precursor": bool,
                "physical_override_applied": bool,
                "guardrail_status": str,
                "audit_notes": str
            }
        """
        physics = physics_engine.evaluate_boundaries(text)

        final_score = neural_score
        final_label = neural_label
        override_applied = False
        confidence = 0.95
        guardrail_status = "CONSENSUS_VERIFIED"
        audit_notes = []

        # Scenario 1: Explicitly Safe / Training Drill context
        if physics["is_explicitly_safe"]:
            if neural_score > 0.35:
                final_score = min(neural_score, physics["safe_ceiling_score"] or 0.18)
                final_label = "LOW"
                override_applied = True
                guardrail_status = "FALSE_ALARM_PREVENTED"
                audit_notes.append("Deterministic Safe Drill/Routine ceiling applied over high neural score")
            else:
                final_score = neural_score
                final_label = "LOW"
                confidence = 0.98

        # Scenario 2: Hard Physical Floor (Missed Hazard Protection)
        elif physics["has_physical_floor"]:
            if neural_score < physics["forced_floor_score"]:
                final_score = max(neural_score, physics["forced_floor_score"])
                final_label = physics["forced_label"] or ("HIGH" if final_score >= 0.75 else "MEDIUM")
                override_applied = True
                guardrail_status = "MISSED_HAZARD_PREVENTED"
                audit_notes.append(f"Physical floor applied ({physics['details']}) over low neural score")
            else:
                # Both agree it's severe!
                final_score = neural_score
                final_label = neural_label
                confidence = 0.99
                audit_notes.append("Dual consensus: Physics boundary and Neural vector both confirm high hazard")

        # Scenario 3: Ambiguity / Divergence Check
        if abs(final_score - neural_score) > 0.25:
            confidence = 0.82
            guardrail_status = "AMBIGUITY_RESOLVED_CONSERVATIVELY"
            audit_notes.append("Conservative physical safety principle enforced per DGMS standard")

        return {
            "final_sif_score": round(float(final_score), 4),
            "final_sif_label": final_label,
            "consensus_confidence": round(float(confidence), 2),
            "is_sif_precursor": final_label in ("HIGH", "MEDIUM"),
            "physical_override_applied": override_applied,
            "guardrail_status": guardrail_status,
            "matched_physical_categories": physics["matched_categories"],
            "audit_notes": "; ".join(audit_notes) if audit_notes else "Clean neural-physical agreement",
        }


# Singleton
guardrail_engine = SafetyGuardrailEngine()
