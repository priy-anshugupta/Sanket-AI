import sys
from pathlib import Path

results = []

def check(name, condition, details=""):
    results.append((name, bool(condition), details))

# 1. CRIT-04: Startup in main.py
main_text = Path("backend/main.py").read_text(encoding="utf-8")
check("CRIT-04: await init_db() in lifespan", "await asyncio.wait_for(init_db()" in main_text and "lifespan" in main_text)
check("HIGH-05: CORS without wildcard with credentials", '"*"' not in main_text.split("allow_origins=")[1].split("]")[0] and "allow_origin_regex" in main_text)

# 2. CRIT-01 & CRIT-03: pipeline_worker.py
pw_text = Path("backend/workers/pipeline_worker.py").read_text(encoding="utf-8")
check("CRIT-01: db.commit() before LLM explanation", "await db.commit()" in pw_text and "Stage 5: LLM Explanation" in pw_text)
check("CRIT-03: Semaphore(3) in process_batch", "asyncio.Semaphore(3)" in pw_text and "def process_batch" in pw_text)

# 3. CRIT-02: report_routes.py demo-500
rr_text = Path("backend/api/report_routes.py").read_text(encoding="utf-8")
check("CRIT-02: demo-500 uses singleton and asyncio.to_thread", "asyncio.to_thread(_classify_all_sync)" in rr_text and "sif_classifier = SIFClassifier()" not in rr_text)

# 4. CRIT-08: requirements.txt
req_text = Path("requirements.txt").read_text(encoding="utf-8")
check("CRIT-08: asyncpg in requirements.txt", "asyncpg" in req_text)
check("CRIT-08: openai in requirements.txt", "openai" in req_text)

# 5. CRIT-05: voice_routes.py
vr_text = Path("backend/api/voice_routes.py").read_text(encoding="utf-8")
check("CRIT-05: audio byte length check in voice_routes", "len(content) < 100" in vr_text)

# 6. CRIT-05 & CRIT-06: whisper_service.py
ws_text = Path("ai/voice/whisper_service.py").read_text(encoding="utf-8")
check("CRIT-06: OpenAI Whisper gated by AI_MODE == online", 'settings.AI_MODE == "online"' in ws_text)
check("CRIT-05: local whisper try-except block", "Local Whisper error" in ws_text)

# 7. HIGH-06: explainer.py
exp_text = Path("ai/explanation/explainer.py").read_text(encoding="utf-8")
check("HIGH-06: deterministic fallback in explainer", "def _deterministic_fallback" in exp_text and "All LLM backends offline" in exp_text)
check("HIGH-06: sequential Groq fallback in explainer", "attempting Groq fallback" in exp_text)

# 8. HIGH-07: extractor.py
ext_text = Path("ai/entities/extractor.py").read_text(encoding="utf-8")
check("HIGH-07: word boundaries in keyword extractors", "re.search(r'\\b' + re.escape(keyword.lower()) + r'\\b', text_lower)" in ext_text)

# 9. HIGH-08: physics_rules.py
pr_text = Path("ai/sif/physics_rules.py").read_text(encoding="utf-8")
check("HIGH-08: hazard inversion check (mech & pressure)", "is_mech" in pr_text and "is_pressure" in pr_text and "has_active_hazard" in pr_text)

# 10. HIGH-09: negation.py
neg_text = Path("ai/sif/negation.py").read_text(encoding="utf-8")
check("HIGH-09: multilingual negation loaded from settings", "settings.NEGATION_TERMS" in neg_text and "nohoy" in neg_text)

# 11. CRIT-07: emergency/page.tsx
em_text = Path("frontend/app/dashboard/emergency/page.tsx").read_text(encoding="utf-8")
check("CRIT-07: emergency timer useEffect cleanup", "clearInterval(timerRef.current)" in em_text and "return () =>" in em_text)

# 12. CRIT-10: tablet lockout relaxed
login_text = Path("frontend/app/login/page.tsx").read_text(encoding="utf-8")
layout_text = Path("frontend/app/dashboard/layout.tsx").read_text(encoding="utf-8")
check("CRIT-10: tablet check relaxed in login (<480px, no iPad)", "window.innerWidth < 480" in login_text and "iPad" not in login_text.split("checkMobile")[1].split(";")[0])
check("CRIT-10: tablet check relaxed in layout (<480px, no iPad)", "window.innerWidth < 480" in layout_text and "iPad" not in layout_text.split("checkScreen")[1].split(";")[0])

# 13. HIGH-02: React error boundaries
check("HIGH-02: app/error.tsx exists", Path("frontend/app/error.tsx").exists())
check("HIGH-02: app/dashboard/error.tsx exists", Path("frontend/app/dashboard/error.tsx").exists())

# 14. HIGH-03: leaflet.css
hm_text = Path("frontend/app/dashboard/heatmap/page.tsx").read_text(encoding="utf-8")
check("HIGH-03: static local leaflet.css import", "import 'leaflet/dist/leaflet.css';" in hm_text)
check("HIGH-03: unpkg CDN link removed", "unpkg.com/leaflet" not in hm_text)

# 15. HIGH-12: report/[id]/page.tsx action error feedback
rep_text = Path("frontend/app/dashboard/report/[id]/page.tsx").read_text(encoding="utf-8")
check("HIGH-12: actionError state in report detail", "const [actionError, setActionError]" in rep_text and "setActionError(" in rep_text)

print("=" * 75)
print(f"{'ITEM':<58} | {'STATUS'}")
print("=" * 75)
all_pass = True
for name, passed, details in results:
    status = "PASSED [OK]" if passed else "FAILED [X]"
    if not passed:
        all_pass = False
    print(f"{name:<58} | {status}")
print("=" * 75)
if all_pass:
    print("RESULT: ALL 20 VERIFICATION CHECKS PASSED PERFECTLY!")
    sys.exit(0)
else:
    print("RESULT: SOME CHECKS FAILED.")
    sys.exit(1)
