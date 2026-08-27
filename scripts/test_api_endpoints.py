"""
SANKET · AI — Quick API Verification Script
Tests the root health, emergency contacts, 6-channel matrix, and audit trail endpoints.
"""

import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    endpoints = [
        ("/", "Root Health Check"),
        ("/api/system/ingestion-channels", "6-Channel Ingestion Matrix"),
        ("/api/emergency/contacts", "Emergency Contacts Directory"),
        ("/api/audit/trail", "Immutable Audit Trail"),
    ]

    print("=" * 60)
    print("  SANKET · AI — API Endpoint Verification")
    print("=" * 60)

    for path, name in endpoints:
        url = f"{BASE_URL}{path}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                print(f"[OK] 200 {name:<30} -> {json.dumps(data)[:80]}...")
        except Exception as e:
            print(f"[FAIL] {name:<30} -> {e}")

    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
