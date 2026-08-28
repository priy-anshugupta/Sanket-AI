# SANKET · AI — Build Task Tracker

## Phase 1 — Foundation & Core MVP
- [x] Project scaffolding (`requirements.txt`, `.env.example`, `.env`, `backend/config/settings.py`)
- [x] Database models (8 tables: `Report`, `Entity`, `LSRTag`, `GraphEdge`, `Action`, `FeedbackLog`, `SystemicAlert`, `User`)
- [x] Authentication & RBAC (JWT handler with bcrypt, 4 roles: `admin`, `hse_manager`, `site_officer`, `field_worker`)
- [x] AI Pipeline Stage 1 (`TextPreprocessor` with Unicode normalization & language detection)
- [x] AI Pipeline Stage 2 (`SIFClassifier` with `multilingual-e5-small` embeddings + 5-token `NegationParser`)
- [x] Data files (50 curated SIF reference anchors, 9 IOGP Life-Saving Rules corpus)
- [x] Report ingestion API & `ReportService` (Single report, CSV batch parsing, Triage queue, Analytics summary)
- [x] Background pipeline worker (`backend/workers/pipeline_worker.py`)
- [x] Frontend scaffolding (Next.js App Router, TypeScript, Tailwind CSS)
- [x] Frontend Hero Landing page (`app/page.tsx`) with dark defense-grade UI & login portals
- [x] Frontend Triage Queue (`app/dashboard/page.tsx`) with severity filtering, search & live refresh

## Phase 2 — Intelligence Layer
- [x] AI Stage 3 (`EntityExtractor` for 8 industrial entity types with spatial normalization)
- [x] AI Stage 4 (`LSRMapper` for IOGP 9 Life-Saving Rules vector cosine matching)
- [x] AI Stage 5 (`LLMExplainer` dual-mode: Groq online / Ollama offline with grounded 2-sentence synthesis)
- [x] LangGraph 7-Agent Swarm (`ai/agents/swarm.py` with `ReportState` & `StateGraph` compilation)
- [x] FastMCP Tool Server (`backend/mcp/server.py` with 4 in-process tools)
- [x] Safety Signal Knowledge Graph (`graph/graph_store.py` in-memory NetworkX with Cytoscape.js export)
- [x] Near-Miss Multiplier (`graph/clustering.py` 7-day rolling window cluster detection)
- [x] Frontend SIF-Precursor Density Heatmap (`app/dashboard/heatmap/page.tsx` - Headline Deliverable)
- [x] Frontend Safety Signal Knowledge Graph (`app/dashboard/graph/page.tsx` with canvas force-directed layout)
- [x] Frontend Report Detail Inspector (`app/dashboard/report/[id]/page.tsx` with Human-in-the-Loop review & CAPA work order dispatch)

## Phase 3 — Output & Accessibility
- [x] ReportLab Executive Safety PDF Brief generator (`backend/pdf/generator.py` & `backend/api/pdf_routes.py`)
- [x] Voice Observation System (`ai/voice/whisper_service.py` with Whisper multilingual STT & `backend/api/voice_routes.py`)
- [x] Frontend Field Worker Voice & Observation Portal (`app/dashboard/voice/page.tsx`)
- [x] Baghjan 2020 Disaster Replay "Time Machine" (`app/dashboard/replay/page.tsx` with interactive timeline)
- [x] Sovereign Air-Gap & System Settings (`app/dashboard/settings/page.tsx` with zero-egress monitor & threshold tuning)
- [x] CAPA Actions Engine (`backend/api/action_routes.py` with 24h/48h/7d SLA tracking)

## Phase 4 — Polish & Demo
- [x] 500-Report Synthetic Data Generator (`scripts/generate_synthetic_data.py` with 2 pre-seeded clusters)
- [x] Database Seeder (`scripts/seed_db.py` with 4 demo users & 507 synthetic safety reports)
- [x] Batch Pipeline Processor (`scripts/process_all_reports.py`)
- [ ] Comprehensive Project README & Architecture Documentation
