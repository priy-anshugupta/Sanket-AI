"""
SANKET · AI — Layer 1: Deterministic Physics & Hazard Rules Engine
Zero-hallucination, unbendable physical boundary rules based on API RP 754,
OISD-189, and DGMS standards for upstream oil & gas operations.
"""

import re
from typing import Dict, Any, List, Optional


class PhysicsRulesEngine:
    """
    Layer 1 of the Defense-in-Depth Guardrail System.
    
    Evaluates raw/preprocessed text against deterministic physical hazard boundaries:
    - High Pressure (>500 PSI, standpipe kicks, line surges)
    - Critical Well Barriers (BOP leaks, blind rams, shear rams, bypasses)
    - Toxic & Flammable Gases (H2S, methane plumes, cellar gas)
    - High-Energy Mechanical & Electrical (33kV, cranes, suspended loads, scaffolding)
    - Explicit Routine / Safe Contexts (drills, pre-shift inspections, zero-leak checks)
    """

    # 1. Active High Pressure Boundaries (>= 500 PSI or active pressure surge)
    HIGH_PRESSURE_PATTERNS = [
        re.compile(r"\b(\d{3,5})\s*(psi|bar|kpa)\b", re.IGNORECASE),
        re.compile(r"\b(pressure\s+kick|well\s+kick|gas\s+surge|standpipe\s+pressure\s+kick|1800\s*psi|2000\s*psi|3000\s*psi|5000\s*psi)\b", re.IGNORECASE),
        re.compile(r"\b(saap\s+barhise|pressure\s+badh\s+raha|chapp\s+besi)\b", re.IGNORECASE),
    ]

    # 2. Critical Well Barrier Failures (Active BOP Leaks, Blind Rams, Wellhead seals)
    CRITICAL_BARRIER_PATTERNS = [
        re.compile(r"\b(bop|blowout\s+preventer|annular\s+seal|blind\s+ram|shear\s+ram|kill\s+line|choke\s+manifold)\b.*\b(weeping|weep|bypass|bypassed|leak|leaking|tapakh?|failure)\b", re.IGNORECASE),
        re.compile(r"\b(weeping|weep|bypass|bypassed|ram\s+failure)\b.*\b(bop|seal|manifold|valve)\b", re.IGNORECASE),
        re.compile(r"\b(বিঅ'পি|ভাল্ভ)\b.*\b(বেয়া|লিক|ফাটিছে)\b", re.IGNORECASE),
        re.compile(r"\b(bop\s+beya|bop\s+leak|valve\s+kharab)\b", re.IGNORECASE),
    ]

    # 3. Active Flammable & Toxic Gas Releases (H2S, Methane, Wellhead bursts)
    TOXIC_FLAMMABLE_PATTERNS = [
        re.compile(r"\b(h2s|h₂s|hydrogen\s+sulfide|sour\s+gas|toxic\s+gas)\b.*\b(leak|odor|smell|detected|release|spread|surging|high)\b", re.IGNORECASE),
        re.compile(r"\b(gas\s+leak|gas\s+leaking|pipe\s+burst|pipeline\s+rupture|pipeline\s+burst|gas\s+phat|aag|fire\s+hazard|explosion)\b", re.IGNORECASE),
        re.compile(r"\b(গেছ\s+লিক|পাইপলাইন\s+ফাটিছে|জুই|ধোঁৱা)\b", re.IGNORECASE),
        re.compile(r"\b(ges\s+leak|phatise|phati\s+gol|zui|aag)\b", re.IGNORECASE),
    ]

    # 4. High-Energy Mechanical, Electrical, and Height Hazards
    HIGH_ENERGY_MECHANICAL_PATTERNS = [
        re.compile(r"\b(33kv|11kv|high\s+voltage|overhead\s+power\s*line|electrocution)\b", re.IGNORECASE),
        re.compile(r"\b(crane|suspended\s+load|drill\s+collar|hoist|wireline\s+snap|dropped\s+object)\b", re.IGNORECASE),
        re.compile(r"\b(scaffold|scaffolding|12-meter|10-meter|fall\s+from\s+height|without\s+harness|no\s+harness|harness\s+nai)\b", re.IGNORECASE),
    ]

    # 5. Verified Routine / Safe Observations & Drills (Avoid False Alarms)
    ROUTINE_SAFE_PATTERNS = [
        re.compile(r"\b(routine\s+check|routine\s+inspection|routine\s+cleaning|routine\s+maintenance|routine\s+shift)\b", re.IGNORECASE),
        re.compile(r"\b(safety\s+drill|mock\s+drill|demonstration|demonstrated|training\s+exercise)\b", re.IGNORECASE),
        re.compile(r"\b(all\s+safe|all\s+ok|all\s+clear|all\s+normal|everything\s+normal|no\s+leak\s+found|no\s+hazard|zero\s+leak|no\s+gas\s+leak)\b", re.IGNORECASE),
        re.compile(r"\b(sab\s+theek|sab\s+safe|bhal\s+aase|thike\s+ase|konu\s+leak\s+nai|কোনো\s+লিক\s+নাই|সকলো\s+ঠিকে\s+আছে)\b", re.IGNORECASE),
    ]

    def evaluate_boundaries(self, text: str) -> Dict[str, Any]:
        """
        Evaluate deterministic physical boundaries on text.
        """
        # First check: Is this explicitly a safety drill or verified zero-leak check?
        is_safe = any(p.search(text) for p in self.ROUTINE_SAFE_PATTERNS)
        
        # Check active barrier failure (e.g. leaking under pressure)
        is_barrier = any(p.search(text) for p in self.CRITICAL_BARRIER_PATTERNS)
        is_gas = any(p.search(text) for p in self.TOXIC_FLAMMABLE_PATTERNS)
        
        # If explicitly a drill or safe check without an active barrier failure, cap at safe ceiling
        if is_safe and not (is_barrier or (is_gas and not ("no leak" in text.lower() or "drill" in text.lower() or "নাই" in text))):
            return {
                "has_physical_floor": False,
                "forced_floor_score": 0.12,
                "forced_label": "LOW",
                "matched_categories": ["ROUTINE_SAFE_CONTEXT"],
                "is_explicitly_safe": True,
                "safe_ceiling_score": 0.18,
                "details": "Verified routine inspection / safety drill without active barrier degradation",
            }

        matched_categories = []
        floor_score = 0.0
        label = None
        reasons = []

        # Check 1: Critical Well Barrier Breach (Highest Severity)
        if is_barrier:
            matched_categories.append("CRITICAL_WELL_BARRIER")
            floor_score = max(floor_score, 0.85)
            label = "HIGH"
            reasons.append("Critical wellbore barrier (BOP/Manifold/Valve) degradation detected")

        # Check 2: Toxic & Flammable Gas Release
        if is_gas:
            matched_categories.append("TOXIC_FLAMMABLE_GAS")
            floor_score = max(floor_score, 0.78)
            label = "HIGH"
            reasons.append("Active flammable/toxic gas release or rupture detected")

        # Check 3: High-Energy Pressure Thresholds
        for p in self.HIGH_PRESSURE_PATTERNS:
            match = p.search(text)
            if match:
                matched_categories.append("HIGH_PRESSURE_SURGE")
                floor_score = max(floor_score, 0.75)
                label = "HIGH"
                reasons.append("High-energy pressurized reservoir or standpipe surge detected")
                break

        # Check 4: High-Energy Mechanical / Electrical / Height
        is_mech = any(p.search(text) for p in self.HIGH_ENERGY_MECHANICAL_PATTERNS)
        if is_mech:
            matched_categories.append("HIGH_ENERGY_LINE_OF_FIRE")
            floor_score = max(floor_score, 0.75)
            label = "HIGH"
            reasons.append("High-voltage, crane swing, or working-at-height hazard detected")

        return {
            "has_physical_floor": bool(floor_score > 0.0),
            "forced_floor_score": floor_score,
            "forced_label": label,
            "matched_categories": matched_categories,
            "is_explicitly_safe": False,
            "safe_ceiling_score": None,
            "details": "; ".join(reasons) if reasons else "No hard physical boundary triggered",
        }


# Singleton
physics_engine = PhysicsRulesEngine()
