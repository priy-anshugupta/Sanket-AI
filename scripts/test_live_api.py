"""Quick live API test to verify SIF score clamping on running server."""
import requests
import json

BASE = "http://localhost:8000"

tests = [
    {"text": "Strong H2S smell detected near cellar pit during well pressure test.", "source": "test"},
    {"text": "Annular BOP valve seal weeping hydraulic fluid under 1800 PSI vibration during drilling.", "source": "test"},
    {"text": "All safe, routine inspection completed. No leak found.", "source": "test"},
]

print("=== LIVE API TEST ===\n")
for t in tests:
    try:
        r = requests.post(f"{BASE}/api/reports/test-classify", json=t, timeout=30)
        data = r.json()
        score = data.get("sif_score", -1)
        label = data.get("sif_label", "?")
        rule = data.get("iogp_rule", "?")
        latency = data.get("latency_ms", "?")
        
        status = "PASS" if 0 <= score <= 0.99 else "FAIL"
        print(f"[{status}] score={score:.4f} label={label} rule={rule} latency={latency}ms")
        print(f"       text: {t['text'][:60]}...")
        if score > 0.99:
            print(f"       *** BUG: SCORE {score} > 0.99! ***")
    except Exception as e:
        print(f"[ERROR] {e}")
    print()

# Also test from phone's perspective
phone_ip = "10.58.177.169"
try:
    r = requests.post(f"http://{phone_ip}:8000/api/reports/test-classify", 
                      json={"text": "Gas kick during drilling operation", "source": "phone_test"}, 
                      timeout=10)
    print(f"[PASS] Phone IP ({phone_ip}:8000) accessible: {r.status_code}")
except Exception as e:
    print(f"[FAIL] Phone IP ({phone_ip}:8000) NOT accessible: {e}")

try:
    r = requests.get(f"http://{phone_ip}:3000/worker", timeout=10)
    print(f"[PASS] Phone frontend ({phone_ip}:3000/worker) accessible: {r.status_code}")
except Exception as e:
    print(f"[FAIL] Phone frontend ({phone_ip}:3000/worker) NOT accessible: {e}")
