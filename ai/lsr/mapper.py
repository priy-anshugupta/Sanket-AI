"""
SANKET · AI — Stage 4: IOGP Life-Saving Rule Mapper
Embedding similarity matching against 9 IOGP rules.
"""

import json
import os
import numpy as np
from pathlib import Path
from backend.config.settings import settings


RULE_DOMAIN_KEYWORDS = {
    "Bypassing Safety Controls": ["bop", "psv", "interlock", "alarm", "bypass", "override", "safety critical", "safety valve", "tamper", "prv", "esd", "emergency shutdown"],
    "Energy Isolation": ["pressure", "psi", "bar", "hydraulic", "loto", "isolation", "isolate", "electrical", "voltage", "lockout", "tagout", "bleed", "drain line", "valve weeping", "fluid under", "containment", "piping", "accumulator"],
    "Confined Space": ["confined", "tank", "vessel", "pit", "cellar", "manhole", "atmosphere", "oxygen", "h2s", "toxic gas", "gas test", "ppm"],
    "Hot Work": ["welding", "grinding", "torch", "cutting", "spark", "hot work", "flame", "flammable"],
    "Safe Mechanical Lifting": ["crane", "rigging", "sling", "hoist", "winch", "suspended load", "lifting", "shackle", "derrick lift"],
    "Working at Height": ["scaffold", "ladder", "roof", "harness", "fall arrest", "fall protection", "mast", "derrick platform", "monkey board", "working at height", "elevated walkway"],
    "Line of Fire": ["line of fire", "pinch point", "stored energy", "struck by", "whipcheck", "rotating", "kickback", "recoil"],
    "Ground Disturbance": ["excavat", "trench", "underground", "buried cable", "digging", "pipeline crossing"],
    "Driving Safety": ["vehicle", "driving", "seatbelt", "speed limit", "driver", "transport", "pickup truck", "crash"],
}


class LSRMapper:
    """
    Stage 4 of the NLP pipeline.
    Maps report text to the 9 IOGP Life-Saving Rules using
    hybrid embedding similarity + domain keyword calibration.
    """

    def __init__(self):
        self.rules: list[dict] = []
        self.rule_embeddings: np.ndarray | None = None
        self.model = None
        self._initialized = False

    def initialize(self, model=None):
        """Load IOGP rules and precompute embeddings."""
        if self._initialized:
            return

        data_path = os.path.join(
            Path(__file__).parent.parent.parent, "data", "iogp_rules.json"
        )

        with open(data_path, "r", encoding="utf-8") as f:
            self.rules = json.load(f)

        if model is not None:
            self.model = model
        else:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL)

        # Precompute rule description embeddings
        rule_texts = [
            f"query: {rule['rule_name']}: {rule['description']}"
            for rule in self.rules
        ]
        self.rule_embeddings = self.model.encode(
            rule_texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        self._initialized = True
        print(f"[LSR Mapper] Loaded {len(self.rules)} IOGP rules with embeddings")

    def map_rules(self, text: str, top_k: int = 2) -> list[dict]:
        """
        Map report text to IOGP Life-Saving Rules with domain calibration.
        Returns top-k rules with similarity >= threshold.
        """
        import re
        if not self._initialized:
            self.initialize()

        # Encode report text (reuses same model as SIF classifier)
        report_embedding = self.model.encode(
            f"query: {text}",
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        # Cosine similarity against all 9 rules
        similarities = np.dot(self.rule_embeddings, report_embedding)

        # Apply domain keyword priors: +0.12 for matching keywords, -0.15 for Height if no height keywords exist
        text_lower = text.lower()
        adjusted = np.copy(similarities)
        for idx, rule in enumerate(self.rules):
            rname = rule["rule_name"]
            kws = RULE_DOMAIN_KEYWORDS.get(rname, [])
            matches = sum(1 for kw in kws if re.search(r'\b' + re.escape(kw) + r'\b', text_lower))
            if matches > 0:
                adjusted[idx] += min(0.12 * matches, 0.25)
            elif rname == "Working at Height":
                adjusted[idx] -= 0.15

        # Get top-k rules above threshold
        results = []
        sorted_indices = np.argsort(adjusted)[::-1]

        for idx in sorted_indices[:top_k]:
            sim = float(adjusted[idx])
            if sim >= settings.LSR_SIMILARITY_THRESHOLD:
                rule = self.rules[idx]
                results.append({
                    "rule_id": rule["rule_id"],
                    "rule_name": rule["rule_name"],
                    "description": rule["description"],
                    "similarity": round(min(sim, 0.99), 4),
                    "barriers": rule.get("barriers", []),
                })

        return results

    def get_rule_by_name(self, rule_name: str) -> dict | None:
        """Look up a specific IOGP rule by name."""
        for rule in self.rules:
            if rule["rule_name"].lower() == rule_name.lower():
                return rule
        return None

    def get_rule_by_id(self, rule_id: str) -> dict | None:
        """Look up a specific IOGP rule by ID."""
        for rule in self.rules:
            if rule["rule_id"] == rule_id:
                return rule
        return None


# Singleton
lsr_mapper = LSRMapper()
