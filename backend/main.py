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
from backend.db.engine import init_db, close_db


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
    """Air-Gap status and system health."""
    import psutil

    # Check outbound connections for this process
    connections = []
    try:
        proc = psutil.Process()
        connections = [
            c for c in proc.connections()
            if c.status == "ESTABLISHED" and c.raddr
        ]
    except Exception:
        pass

    outbound_count = len(connections)

    return {
        "is_airgapped": settings.AI_MODE == "airgapped",
        "mode": settings.AI_MODE,
        "outbound_connections": outbound_count,
        "outbound_kbps": 0 if settings.AI_MODE == "airgapped" else "monitoring",
        "models_loaded": {
            "embeddings": "intfloat/multilingual-e5-small",
            "ner": "GLiNER + spaCy",
            "llm": settings.OLLAMA_MODEL if settings.AI_MODE == "airgapped" else settings.GROQ_MODEL,
        },
        "zero_egress": outbound_count == 0,
    }
