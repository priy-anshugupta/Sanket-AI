"""Test the SIF classifier on the exact H2S report text to trace score computation."""
import sys
import os
sys.path.insert(0, os.getcwd())

from ai.sif.classifier import sif_classifier
from ai.lsr.mapper import lsr_mapper

# The exact quick tag text from worker/page.tsx
texts = [
    "Strong H2S smell detected near cellar pit during well pressure test.",
    "Annular BOP valve seal weeping hydraulic fluid under 1800 PSI vibration during drilling.",
    "Staircase safety handrail loose on mud tank walkway. Oil spilled on floor.",
    "Crane moving heavy 5-ton drill collar over wellhead manifold without ground spotter.",
    "BOP secondary valve seal weeping hydraulic fluid under 1800 PSI at Well Pad 7",
]

print("=== SIF Classifier Full Test ===\n")
for text in texts:
    result = sif_classifier.classify(text)
    print(f"Text: {text[:70]}...")
    print(f"  sif_score: {result['sif_score']}")
    print(f"  sif_label: {result['sif_label']}")
    print(f"  is_sif_precursor: {result['is_sif_precursor']}")
    print(f"  matched_anchor: {result.get('matched_anchor_text', '')[:60]}")
    print(f"  keyword_boost: {result['keyword_boost_applied']}")
    print(f"  boosted_kw: {result['boosted_keywords']}")
    print(f"  guardrail: {result.get('guardrail_status', 'N/A')}")
    
    # Check score is in valid range
    if result['sif_score'] > 1.0 or result['sif_score'] < 0.0:
        print(f"  *** BUG: SCORE {result['sif_score']} OUT OF RANGE [0.0, 1.0] ***")
    
    # LSR mapping
    try:
        lsr = lsr_mapper.map_rules(text)
        if lsr:
            print(f"  IOGP Rule: {lsr[0]['rule_name']} (sim={lsr[0]['similarity']})")
            if lsr[0]['similarity'] > 1.0:
                print(f"  *** BUG: LSR SIMILARITY {lsr[0]['similarity']} > 1.0 ***")
        else:
            print(f"  IOGP Rule: None mapped")
    except Exception as e:
        print(f"  LSR Error: {e}")
    
    print()

print("=== VERDICT ===")
all_ok = True
for text in texts:
    result = sif_classifier.classify(text)
    if result['sif_score'] > 1.0:
        print(f"FAIL: {text[:50]}... -> score {result['sif_score']}")
        all_ok = False
if all_ok:
    print("ALL SCORES IN VALID RANGE [0.0, 1.0] ✅")
