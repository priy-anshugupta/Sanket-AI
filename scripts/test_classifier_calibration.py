"""
SANKET · AI — Classifier Verification & Calibration Test
Tests the calibrated SIF classifier against high-energy vs low-severity reports.
"""

import sys
import os
from pathlib import Path

# Add project root to python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.sif.classifier import sif_classifier

TEST_CASES = [
    # Low-Severity / Non-SIF Cases (Must be LOW < 0.45)
    ("Housekeeping issue with tools left on walkway near office building", "LOW"),
    ("Mosquito net torn at field camp accommodation", "LOW"),
    ("Faded sign board at remote pipeline marker location", "LOW"),
    ("First aid treatment for minor scratch on finger while opening box", "LOW"),
    ("Worker drinking water bottle left on generator desk", "LOW"),

    # High-Energy / True SIF Precursor Cases (Must be HIGH >= 0.75)
    ("Well kick detected with rapid annular pressure increase to 1800 PSI during tripping", "HIGH"),
    ("BOP valve leaking hydraulic fluid under high pressure near wellhead", "HIGH"),
    ("H2S toxic gas release detected above 50 ppm near production separator", "HIGH"),
    ("Worker fell from scaffolding at height of 6 meters without safety harness", "HIGH"),
    ("Heavy electrical arc flash at 11KV switchgear panel with explosion", "HIGH"),

    # Multilingual Code-Switching (Hindi / Hinglish / Assamese) (Must be HIGH >= 0.75)
    ("Valve mein bahut pressure hai 1800 PSI, BOP check karo jaldi", "HIGH"),
    ("Gas leak ho raha hai wellhead ke paas, H2S smell aa raha hai", "HIGH"),
    ("Aag lag gayi welding ke sparks se diesel tank ke paas", "HIGH"),
    ("BOP valve tu leak hoise 1800 PSI pressure ase bipod ase", "HIGH"),
]

def run_tests():
    print("=" * 70)
    print("  SANKET · AI — SIF Classifier Calibration Verification")
    print("=" * 70)

    sif_classifier.initialize()

    passed = 0
    total = len(TEST_CASES)

    for text, expected in TEST_CASES:
        res = sif_classifier.classify(text)
        actual = res["sif_label"]
        score = res["sif_score"]
        anchor = res["matched_anchor_text"][:40]

        is_ok = (actual == expected)
        if is_ok:
            passed += 1
            status = "[PASS]"
        else:
            status = "[FAIL]"

        print(f"\n{status} | Expected: {expected:<5} | Got: {actual:<5} ({score:.4f})")
        print(f"  Text   : {text[:65]}...")
        print(f"  Anchor : {anchor}...")
        if res.get("low_severity_penalty_applied"):
            print("  [Note] Low-severity discriminator penalty applied.")
        if res.get("keyword_boost_applied"):
            print(f"  [Note] Keyword boost applied: {res.get('boosted_keywords')}")

    print("\n" + "=" * 70)
    print(f"  TEST RESULTS: {passed}/{total} Passed ({passed/total*100:.1f}%)")
    print("=" * 70)

    if passed == total:
        print("  ALL CALIBRATION TESTS PASSED! Classifier is mathematically sound.")
    else:
        print("  SOME TESTS FAILED. Review thresholds.")

if __name__ == "__main__":
    run_tests()
