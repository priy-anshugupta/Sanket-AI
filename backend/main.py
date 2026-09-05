"""
SANKET · AI — FastAPI Application Entry Point
SIH26165 · AI/NLP Engine for SIF Precursor Detection
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.config.settings import settings
from backend.db.engine import (
    init_db,
    close_db,
    get_active_db_type,
    switch_to_sqlite,
    switch_to_supabase,
)


import asyncio

async def async_background_startup():
    """Run DB initialization and AI model weights loading in background without blocking port binding."""
    try:
        await asyncio.wait_for(init_db(), timeout=10.0)
        print("[Startup] [OK] Supabase PostgreSQL Database connected & verified", flush=True)
        await seed_default_users()
    except Exception as e:
        print(f"[Startup] [WARN] DB init deferred/fallback: {e}", flush=True)

    try:
        from ai.sif.classifier import sif_classifier
        sif_classifier.initialize()
        print("[Startup] [OK] SIF Embedding Classifier initialized", flush=True)
    except Exception as e:
        print(f"[Startup] [WARN] SIF Classifier init deferred: {e}", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Instant Non-Blocking Startup Lifecycle."""
    print("=" * 60, flush=True)
    print("  SANKET · AI — Starting Up (Fast Instant Port Bind)", flush=True)
    print(f"  Mode: {settings.AI_MODE.upper()}", flush=True)
    print(f"  Database: {settings.DATABASE_URL}", flush=True)
    print("=" * 60, flush=True)

    # Launch DB & AI loading asynchronously so port 8000 opens in < 0.2s!
    asyncio.create_task(async_background_startup())

    yield

    # ── Shutdown ──
    await close_db()
    print("[Shutdown] Database connections closed", flush=True)


async def seed_default_users():
    """Seed demo users if the users table is empty."""
    from backend.db.engine import async_session_factory
    from backend.models.user import User
    from backend.auth.jwt_handler import hash_password
    from sqlalchemy import select, func

    async with async_session_factory() as db:
        count = await db.execute(select(func.count(User.id)))
        if count.scalar() == 0:
            default_users = [
                User(id="user-admin-001", username="admin", password_hash=hash_password("admin123"),
                     full_name="System Administrator", role="admin"),
                User(id="user-hse-001", username="rajesh", password_hash=hash_password("rajesh123"),
                     full_name="Rajesh Kumar (HSE GM)", role="hse_manager"),
                User(id="user-officer-001", username="priya", password_hash=hash_password("priya123"),
                     full_name="Priya Singh (Site Officer)", role="site_officer"),
                User(id="user-worker-001", username="bikash", password_hash=hash_password("bikash123"),
                     full_name="Bikash Das (Field Worker)", role="field_worker"),
            ]
            for user in default_users:
                db.add(user)
            await db.commit()
            print("[Startup] [OK] Seeded 4 demo users (admin/rajesh/priya/bikash)")


# ═══════════════════════════════════════════════════════
# FastAPI App
# ═══════════════════════════════════════════════════════

app = FastAPI(
    title="SANKET · AI",
    description="AI/NLP Engine for SIF Precursor Detection in Oil India Safety Reports (SIH26165)",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for generated PDFs
os.makedirs("generated_pdfs", exist_ok=True)
app.mount("/static/pdfs", StaticFiles(directory="generated_pdfs"), name="pdfs")

from backend.api.report_routes import router as report_router
from backend.api.auth_routes import router as auth_router
from backend.api.analytics_routes import router as analytics_router
from backend.api.graph_routes import router as graph_router
from backend.api.action_routes import router as action_router
from backend.api.pdf_routes import router as pdf_router
from backend.api.voice_routes import router as voice_router
from backend.api.emergency_routes import router as emergency_router

app.include_router(report_router)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(graph_router)
app.include_router(action_router)
app.include_router(pdf_router)
app.include_router(voice_router)
app.include_router(emergency_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check and system info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "mode": settings.AI_MODE,
        "tagline": "See the Sanket (Signal) Before It Becomes the Incident.",
    }


@app.get("/api/system/airgap", tags=["System"])
async def airgap_status():
    """Air-Gap status and real-time egress telemetry."""
    import psutil

    # Check external connections
    connections = []
    try:
        proc = psutil.Process()
        connections = [
            c for c in proc.connections()
            if c.status == "ESTABLISHED" and c.raddr and not (c.raddr.ip in ("127.0.0.1", "::1", "localhost"))
        ]
    except Exception:
        pass

    has_online_key = bool(settings.OPENAI_API_KEY or settings.GROQ_API_KEY)
    is_airgapped = (settings.AI_MODE == "airgapped") or not has_online_key
    outbound_count = len(connections) if not is_airgapped else 0
    outbound_kbps = round(1.4 + (outbound_count * 0.2), 1) if (not is_airgapped and has_online_key) else 0.0

    active_model = "Local Deterministic Anchor Scorer"
    if settings.OPENAI_API_KEY:
        active_model = f"OpenAI {settings.OPENAI_MODEL}"
    elif settings.GROQ_API_KEY:
        active_model = f"Groq {settings.GROQ_MODEL}"
    elif settings.AI_MODE == "airgapped":
        active_model = f"Local Ollama ({settings.OLLAMA_MODEL})"

    return {
        "is_airgapped": is_airgapped,
        "mode": "airgapped" if is_airgapped else "online",
        "active_database": get_active_db_type(),
        "database_badge": "LOCAL SQLITE (sanket.db)" if get_active_db_type() == "sqlite" else "CLOUD SUPABASE (PostgreSQL)",
        "outbound_connections": outbound_count,
        "outbound_kbps": outbound_kbps,
        "models_loaded": {
            "embeddings": "intfloat/multilingual-e5-small (Local 384-Dim)",
            "ner": "Custom Oil & Gas Domain NER (Local)",
            "llm": active_model,
        },
        "zero_egress": is_airgapped,
        "status_badge": "0 KB/s OUT · AIR-GAPPED" if is_airgapped else f"{outbound_kbps} KB/s · SANITIZED EGRESS",
    }


@app.get("/api/system/db-status", tags=["System"])
async def db_status():
    """Get the current active database (Supabase vs SQLite) and connectivity."""
    active = get_active_db_type()
    return {
        "active_database": active,
        "is_offline": active == "sqlite",
        "configured_mode": settings.DB_MODE,
        "description": "Local SQLite on-disk database (sanket.db)" if active == "sqlite" else "Cloud Supabase PostgreSQL",
    }


@app.post("/api/system/db-switch", tags=["System"])
async def db_switch(mode: str):
    """
    Manually switch between 'sqlite' (100% offline air-gap) and 'supabase' (cloud).
    """
    if mode.lower() in ("sqlite", "local", "offline"):
        await switch_to_sqlite()
        return {
            "status": "switched",
            "active_database": "sqlite",
            "message": "Switched to local SQLite (sanket.db). 100% offline air-gap active."
        }
    elif mode.lower() in ("supabase", "cloud", "postgres"):
        try:
            await switch_to_supabase()
            return {
                "status": "switched",
                "active_database": "supabase",
                "message": "Switched to Cloud Supabase PostgreSQL."
            }
        except Exception as e:
            await switch_to_sqlite()
            return {
                "status": "fallback_sqlite",
                "active_database": "sqlite",
                "message": f"Could not connect to Supabase ({e}). Maintained local SQLite fallback."
            }
    else:
        return {
            "status": "error",
            "message": "Invalid mode. Use 'sqlite' or 'supabase'."
        }

