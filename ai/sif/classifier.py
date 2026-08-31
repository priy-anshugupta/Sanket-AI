"""
SANKET · AI — Stage 2: SIF Classifier
Scientific SIF Risk Classification using multilingual embeddings + negation-aware keyword boost.
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from backend.config.settings import settings
from ai.sif.anchor_library import anchor_library
from ai.sif.negation import negation_parser
from ai.sif.guardrails import guardrail_engine


class SIFClassifier:
    """
    Stage 2 of the 5-stage NLP pipeline.

    Classification pipeline:
        1. Encode report text with multilingual-e5-small (384-dim)
        2. Cosine similarity against 50 SIF anchors
        3. Negation-aware keyword boost (+0.15)
        4. Clamp to [0.0, 1.0]
        5. Label: HIGH (≥0.75), MEDIUM (0.50-0.74), LOW (<0.50)
    """

    def __init__(self):
        self.model: SentenceTransformer | None = None
        self._initialized = False

    def initialize(self):
        """Load embedding model and precompute anchor embeddings."""
        if self._initialized:
            return

        print(f"[SIF Classifier] Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print(f"[SIF Classifier] Model loaded. Embedding dim: {self.model.get_sentence_embedding_dimension()}")

        # Precompute anchor embeddings
        anchor_library.load(embedding_model=self.model)
        print(f"[SIF Classifier] Loaded {anchor_library.count} SIF anchors with embeddings")

        self._initialized = True

    def classify(self, text: str) -> dict:
        """
        Classify a single report text for SIF potential.

        Args:
            text: Preprocessed report text

        Returns:
            {
                "sif_score": float (0.0-1.0),
                "sif_label": str (HIGH/MEDIUM/LOW),
                "is_sif_precursor": bool,
                "matched_anchor_id": str,
                "matched_anchor_text": str,
                "keyword_boost_applied": bool,
                "boosted_keywords": list[str]
            }
        """
        if not self._initialized:
            self.initialize()

        # 1. Encode the report text
        report_embedding = self.model.encode(
            f"query: {text}",
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        # 2. Cosine similarity against all anchors
        similarities = np.dot(anchor_library.anchor_embeddings, report_embedding)
        max_idx = int(np.argmax(similarities))
        max_similarity = float(similarities[max_idx])
        matched_anchor = anchor_library.anchors[max_idx]

        # Check for explicitly safe / routine / non-hazardous observations
        import re
        safe_regex = re.compile(
            r"\b(all\s+good|all\s+safe|all\s+ok|everything\s+ok|everything\s+fine|routine\s+check|routine\s+inspection|routine\s+cleaning|no\s+hazard|no\s+issue|no\s+leak|no\s+danger|normal\s+shift|sab\s+theek|bhal\s+aase|housekeeping\s+ok|normal\s+operation)\b",
            re.IGNORECASE
        )
        
        # 3. Negation-aware keyword boost
        keyword_results = negation_parser.check_keywords(text, settings.CRITICAL_KEYWORDS)
        boosted_keywords = [kr["keyword"] for kr in keyword_results if kr["should_boost"]]
        keyword_boost = settings.KEYWORD_BOOST if boosted_keywords else 0.0

        if safe_regex.search(text) and not boosted_keywords:
            return {
                "sif_score": 0.12,
                "sif_label": "LOW",
                "is_sif_precursor": False,
                "matched_anchor_id": "SAFE-001",
                "matched_anchor_text": "Routine safe field condition without high energy precursors",
                "matched_anchor_similarity": 0.12,
                "keyword_boost_applied": False,
                "boosted_keywords": [],
            }

        # 4. Raw score + clamp (calibrated for E5 similarity floor: anchor baseline is ~0.70)
        # Scale range [0.70, 0.95] into [0.0, 1.0] for non-boosted embeddings
        calibrated_similarity = (max_similarity - 0.70) / 0.25 if max_similarity > 0.70 else 0.10
        calibrated_similarity = float(np.clip(calibrated_similarity, 0.0, 1.0))
        
        raw_score = (calibrated_similarity * 0.7) + (max_similarity * 0.3) + keyword_boost
        final_score = float(np.clip(raw_score, 0.0, 1.0))

        # 5. Label assignment
        if final_score >= settings.SIF_HIGH_THRESHOLD:
            label = "HIGH"
        elif final_score >= settings.SIF_MEDIUM_THRESHOLD:
            label = "MEDIUM"
        else:
            label = "LOW"

        # 6. Defense-in-Depth Guardrail Consensus Arbitration
        consensus = guardrail_engine.reconcile_classification(
            text=text,
            neural_score=final_score,
            neural_label=label,
            matched_anchor=matched_anchor["text"],
            boosted_keywords=boosted_keywords,
        )

        return {
            "sif_score": consensus["final_sif_score"],
            "sif_label": consensus["final_sif_label"],
            "is_sif_precursor": consensus["is_sif_precursor"],
            "consensus_confidence": consensus["consensus_confidence"],
            "guardrail_status": consensus["guardrail_status"],
            "audit_notes": consensus["audit_notes"],
            "matched_anchor_id": matched_anchor["id"],
            "matched_anchor_text": matched_anchor["text"],
            "matched_anchor_similarity": round(max_similarity, 4),
            "keyword_boost_applied": bool(boosted_keywords),
            "boosted_keywords": boosted_keywords,
        }

    def classify_batch(self, texts: list[str]) -> list[dict]:
        """
        Classify a batch of report texts efficiently.
        Uses batched encoding for performance (200 reports < 5s target).
        """
        if not self._initialized:
            self.initialize()

        if not texts:
            return []

        # Batch encode all reports
        report_embeddings = self.model.encode(
            [f"query: {t}" for t in texts],
            normalize_embeddings=True,
            show_progress_bar=False,
            batch_size=64,
        )

        results = []
        for i, (text, embedding) in enumerate(zip(texts, report_embeddings)):
            # Cosine similarity
            similarities = np.dot(anchor_library.anchor_embeddings, embedding)
            max_idx = int(np.argmax(similarities))
            max_similarity = float(similarities[max_idx])
            matched_anchor = anchor_library.anchors[max_idx]

            # Keyword boost
            keyword_results = negation_parser.check_keywords(text, settings.CRITICAL_KEYWORDS)
            boosted = [kr["keyword"] for kr in keyword_results if kr["should_boost"]]
            boost = settings.KEYWORD_BOOST if boosted else 0.0

            score = float(np.clip(max_similarity + boost, 0.0, 1.0))

            if score >= settings.SIF_HIGH_THRESHOLD:
                label = "HIGH"
            elif score >= settings.SIF_MEDIUM_THRESHOLD:
                label = "MEDIUM"
            else:
                label = "LOW"

            results.append({
                "sif_score": round(score, 4),
                "sif_label": label,
                "is_sif_precursor": label in ("HIGH", "MEDIUM"),
                "matched_anchor_id": matched_anchor["id"],
                "matched_anchor_text": matched_anchor["text"],
                "matched_anchor_similarity": round(max_similarity, 4),
                "keyword_boost_applied": bool(boosted),
                "boosted_keywords": boosted,
            })

        return results


# Singleton
sif_classifier = SIFClassifier()
