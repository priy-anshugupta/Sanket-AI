"""
SANKET AI — Senior Developer Audit Test Suite
Comprehensive end-to-end verification for demo day.
Tests: SIF scoring, IOGP mapping, entity extraction, negation detection, physics rules, guardrails.
"""
import sys, os
sys.path.insert(0, os.getcwd())
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"

PASS = 0
FAIL = 0

def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} -- {detail}")

print("=" * 70)
print("SANKET AI — SENIOR DEVELOPER AUDIT TEST SUITE")
print("=" * 70)

# ── 1. SIF CLASSIFIER SCORE CLAMPING ──
print("\n--- 1. SIF CLASSIFIER SCORE CLAMPING ---")
from ai.sif.classifier import sif_classifier

test_texts = {
    "h2s": "Strong H2S smell detected near cellar pit during well pressure test.",
    "bop": "Annular BOP valve seal weeping hydraulic fluid under 1800 PSI vibration during drilling.",
    "handrail": "Staircase safety handrail loose on mud tank walkway. Oil spilled on floor.",
    "crane": "Crane moving heavy 5-ton drill collar over wellhead manifold without ground spotter.",
    "safe": "All safe, routine inspection completed. No leak found. Everything normal.",
    "hindi_safe": "Sab theek hai, koi leak nahi hai. Normal shift.",
    "assamese_leak": "Ges leak phatise pipeline, bop beya hoiche.",
}

for key, text in test_texts.items():
    result = sif_classifier.classify(text)
    score = result["sif_score"]
    label = result["sif_label"]
    check(f"Score range [{key}]", 0.0 <= score <= 0.99, f"score={score}")
    
    # Specific validations
    if key == "h2s":
        check(f"H2S = HIGH", label == "HIGH", f"got {label}")
        check(f"H2S score <= 0.99", score <= 0.99, f"got {score}")
    elif key == "safe":
        check(f"Safe = LOW", label == "LOW", f"got {label}")
        check(f"Safe score < 0.30", score < 0.30, f"got {score}")
    elif key == "hindi_safe":
        check(f"Hindi safe = LOW", label == "LOW", f"got {label}")
    elif key == "bop":
        check(f"BOP = HIGH", label == "HIGH", f"got {label}")
    elif key == "assamese_leak":
        check(f"Assamese leak = HIGH or MEDIUM", label in ("HIGH", "MEDIUM"), f"got {label}")

# ── 2. IOGP LIFE-SAVING RULE MAPPING ──
print("\n--- 2. IOGP LIFE-SAVING RULE MAPPING ---")
from ai.lsr.mapper import lsr_mapper

iogp_tests = {
    "Strong H2S smell detected near cellar pit during well pressure test.": "Confined Space",
    "Annular BOP valve seal weeping hydraulic fluid under 1800 PSI vibration during drilling.": "Energy Isolation",
    "Crane moving heavy 5-ton drill collar over wellhead manifold without ground spotter.": "Safe Mechanical Lifting",
    "Staircase safety handrail loose on mud tank walkway. Oil spilled on floor.": "Line of Fire",
    "Worker welding near diesel storage tank without hot work permit.": "Hot Work",
    "Scaffold platform missing toe boards on derrick at 12 meters height.": "Working at Height",
    "Worker driving pickup truck without seatbelt on site road.": "Driving Safety",
    "Excavation near buried cable without ground disturbance permit.": "Ground Disturbance",
    "Safety valve PSV bypassed by maintenance crew without authorization.": "Bypassing Safety Controls",
}

for text, expected_rule in iogp_tests.items():
    lsr_result = lsr_mapper.map_rules(text)
    if lsr_result:
        actual_rule = lsr_result[0]["rule_name"]
        sim = lsr_result[0]["similarity"]
        check(f"IOGP [{expected_rule}]", actual_rule == expected_rule, f"got '{actual_rule}' (sim={sim})")
        check(f"  LSR sim <= 0.99", sim <= 0.99, f"sim={sim}")
    else:
        check(f"IOGP [{expected_rule}]", False, "No rule matched!")

# ── 3. ENTITY EXTRACTION ──
print("\n--- 3. ENTITY EXTRACTION ---")
from ai.entities.extractor import entity_extractor

ent_text = "BOP valve leaking on rig floor at Well Pad 7 during day shift. Worker not wearing harness."
entities = entity_extractor.extract(ent_text)
entity_types = [e["type"] for e in entities]
entity_values = [e["value"].lower() for e in entities]

check("Equipment extracted", "EQUIPMENT" in entity_types, f"types={entity_types}")
check("Location extracted", "LOCATION" in entity_types, f"types={entity_types}")
check("BOP found", any("bop" in v for v in entity_values), f"values={entity_values}")
check("Rig Floor found", any("rig floor" in v for v in entity_values), f"values={entity_values}")
check("Barrier failure found", "BARRIER_FAILURE" in entity_types, f"types={entity_types}")
check("PPE found", "PPE_STATUS" in entity_types, f"types={entity_types}")
check("Shift time found", "SHIFT_TIME" in entity_types, f"types={entity_types}")

# Word boundary test
ent_text2 = "The pump was operational and no valve issues found."
entities2 = entity_extractor.extract(ent_text2)
check("No false 'amp' from 'pump'", not any(e["value"].lower() == "amp" for e in entities2), f"entities={[e['value'] for e in entities2]}")

# ── 4. NEGATION DETECTION ──
print("\n--- 4. NEGATION DETECTION ---")
from ai.sif.negation import negation_parser

neg_tests = [
    ("No explosion occurred at the site", "explosion", True),
    ("Major explosion near wellhead caused fire", "explosion", False),
    ("Leak nahi hai, sab safe", "leak", True),
    ("Gas leak detected near cellar pit", "leak", False),
    ("Konu leak nai, thike ase", "leak", True),
]

for text, keyword, should_negate in neg_tests:
    is_negated = negation_parser.is_negated(text, keyword)
    check(f"Negation [{keyword}] in '{text[:40]}...'", is_negated == should_negate, f"expected negated={should_negate}, got {is_negated}")

# ── 5. PHYSICS RULES ENGINE ──
print("\n--- 5. PHYSICS RULES ENGINE ---")
from ai.sif.physics_rules import physics_engine

physics_tests = [
    ("BOP seal weeping under 1800 PSI", True, "HIGH"),
    ("H2S gas leak detected near wellhead", True, "HIGH"),
    ("Crane suspended load over workers", True, "HIGH"),
    ("Routine inspection all safe", False, None),
    ("Safety drill demonstration no leak", False, None),
]

for text, should_have_floor, expected_label in physics_tests:
    result = physics_engine.evaluate_boundaries(text)
    has_floor = result["has_physical_floor"]
    check(f"Physics floor [{text[:40]}]", has_floor == should_have_floor, f"expected floor={should_have_floor}, got {has_floor}")
    if should_have_floor and expected_label:
        check(f"  Physics label", result["forced_label"] == expected_label, f"expected {expected_label}, got {result['forced_label']}")

# ── 6. GUARDRAILS CONSENSUS ──
print("\n--- 6. GUARDRAILS CONSENSUS ---")
from ai.sif.guardrails import guardrail_engine

# Test that guardrails never return > 0.99
guard_texts = [
    "Strong H2S smell detected near cellar pit during well pressure test.",
    "BOP valve failure with 2000 PSI gas kick detected.",
    "Major explosion at wellhead, fire spreading, all workers evacuating.",
]

for text in guard_texts:
    result = sif_classifier.classify(text)
    check(f"Guardrail clamp [{text[:45]}]", result["sif_score"] <= 0.99, f"score={result['sif_score']}")

# ── 7. SETTINGS VALIDATION ──
print("\n--- 7. SETTINGS VALIDATION ---")
from backend.config.settings import settings

check("Embedding model correct", settings.EMBEDDING_MODEL == "intfloat/multilingual-e5-small")
check("SIF HIGH threshold = 0.75", settings.SIF_HIGH_THRESHOLD == 0.75)
check("SIF MEDIUM threshold = 0.50", settings.SIF_MEDIUM_THRESHOLD == 0.50)
check("LSR threshold = 0.45", settings.LSR_SIMILARITY_THRESHOLD == 0.45)
check("Keyword boost = 0.15", settings.KEYWORD_BOOST == 0.15)
check("Cluster window = 7 days", settings.CLUSTER_WINDOW_DAYS == 7)
check("Cluster min events = 3", settings.CLUSTER_MIN_EVENTS == 3)
check("Negation terms include Hindi", "nahi" in settings.NEGATION_TERMS)
check("Negation terms include Assamese", "nai" in settings.NEGATION_TERMS)
check("Critical keywords include h2s", "h2s" in settings.CRITICAL_KEYWORDS)
check("Critical keywords include Assamese", any(k for k in settings.CRITICAL_KEYWORDS if ord(k[0]) > 2000) if settings.CRITICAL_KEYWORDS else False)

# ── SUMMARY ──
print("\n" + "=" * 70)
total = PASS + FAIL
print(f"AUDIT COMPLETE: {PASS}/{total} PASSED, {FAIL}/{total} FAILED")
if FAIL == 0:
    print("STATUS: ALL CHECKS PASSED -- DEMO READY")
else:
    print(f"STATUS: {FAIL} FAILURES NEED ATTENTION")
print("=" * 70)
