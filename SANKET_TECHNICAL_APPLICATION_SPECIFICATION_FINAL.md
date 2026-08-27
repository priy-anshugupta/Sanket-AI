
SANKET · AI

Technical Application Specification

SIH26165 · AI/NLP Engine for SIF Precursor Detection in Oil India Safety Reports

Final Engineering Blueprint

Audience: 6-person implementation team · Human developers · AI coding assistants

Source basis: SANKET · AI PRD v2.0 + existing technical specification

Document purpose

Define the implementable architecture, components, interfaces, AI pipeline, workflows, testing strategy, and delivery plan for SANKET · AI.

# Table of Contents

Table of Contents	2

## 1. Executive Overview	6

## 2. Problem Definition	6

## 3. Functional Three-Layer Model	6

## 4. System Architecture	7

### 4.1 High-Level Flow (PRD-baseline)	7

### 4.2 Expanded Architecture	7

### 4.3 Subsystem Responsibilities	7

## 5. Technology Stack	8

## 6. Repository Structure	8

### 6.1 Folder-by-folder notes	9

## 7. Frontend Architecture	10

### 7.1 Structure	10

### 7.2 Pages	10

`/` — Triage Queue (F8)	10

`/reports/[id]` — Incident Inspector (F9)	10

`/graph` — Safety Signal Graph (F6)	11

`/heatmap` — SIF-Precursor Density Heatmap (Headline Deliverable) & Analytics	11

`/briefing` — Shift Handover Generator (F12)	11

`/voice` — Multimodal Field Reporting Portal (F13/F15) (Voice Hold-to-Talk Mic + Direct Text Box Fallback)

`/settings` — System Configuration (F16)	11

`/login` — 2-Portal Dual Sign-In Entry Point (Field Worker Quick-Access vs Safety Manager Command Center)

### 7.3 Key Reusable Components	11

## 8. Backend Architecture	12

### 8.1 Responsibilities	12

### 8.2 Folder Responsibilities	12

## 9. API Specification	12

## 10. Database Architecture	13

`reports`	13

`entities`	14

`lsr_tags`	14

`graph_edges`	14

`actions`	14

`feedback_log`	14

`systemic_alerts`	14

Entity Relationship Summary	14

PRD Ambiguity — `graph_edges.report_ids` vs. relational normalization	14

`users` table — **Recommended Addition (Required)**	14

## 11. AI/NLP Architecture	14

### 11.1 Stage 1 — Text Preprocessor	14

### 11.2 Stage 2 — SIF Classifier	15

### 11.3 Stage 3 — Entity Extractor	15

### 11.4 Stage 4 — LSR Mapper	15

### 11.5 Stage 5 — LLM Explainer	15

### 11.6 Performance	15

## 12. SIF Classification (Stage 2 — deep dive)	15

Pipeline	15

## 13. Entity Extraction (Stage 3 — deep dive)	16

## 14. IOGP Life-Saving Rule Mapping (Stage 4 — deep dive)	16

## 15. LLM Explanation System (Stage 5 — deep dive)	16

Prompt template (PRD-specified)	16

Grounding to prevent hallucination	16

Validation	17

Online/Offline switching	17

Failure behavior	17

## 16. LangGraph Agent Architecture	17

### 16.1 Shared State	17

### 16.2 Agent-by-Agent Specification	17

### 16.3 Execution Flow	18

## 17. Knowledge Graph (Layer 2)	18

### 17.1 Graph Engine	18

### 17.2 Nodes & Edges (PRD Section 9, unchanged)	18

### 17.3 Update Flow	18

### 17.4 Frontend Serialization	18

## 18. Near-Miss Multiplier / Temporal Cluster Detection (Layer 2, deep dive)	18

## 19. MCP Architecture	19

## 20. CAPA System (Layer 3)	19

### 20.1 Trigger Conditions	19

### 20.2 Work Order Fields (PRD Section 4, F11)	20

### 20.3 SLA Rules (PRD-specified, unchanged)	20

### 20.4 Status Lifecycle	20

### 20.5 What is AI-assisted vs. deterministic	20

## 21. Human-in-the-Loop Feedback	20

## 22. Realtime Architecture — **Recommended Addition**	20

## 23. Document Generation	21

### 23.1 Shift Handover Briefing (F12)	21

### 23.2 Safety Intervention Dossier (F13)	21

### 23.3 Bow-Tie Model (F14)	21

## 24. Multimodal Field Reporting (Voice + Direct Text Fallback)

## 25. Air-Gapped Architecture	21

## 26. Authentication & Security	22

### 26.1 Roles (PRD Section 19, unchanged)	22

### 26.2 Implementation	22

### 26.3 Other safeguards	22

## 27. Data Strategy	22

## 28. Analytics	22

## 29. End-to-End Data Flows	23

Workflow 1 — Manual Report	23

Workflow 2 — Batch Upload (CSV/JSON, up to 500)	23

Workflow 3 — Voice Report	23

Workflow 4 — Systemic Risk Detection	23

Workflow 5 — CAPA Creation	23

Workflow 6 — Human Feedback	23

Workflow 7 — PDF Generation	23

## 30. Error Handling	23

## 31. Performance	24

## 32. Testing Strategy	24

Unit	24

Integration	24

End-to-End	24

AI Evaluation	25

## 33. Implementation Roadmap (PRD 4 Phases, expanded)	25

Phase 1 — Core MVP (Days 1–4)	25

Phase 2 — Intelligence Layer (Days 5–8)	25

Phase 3 — Output & Accessibility (Days 9–11)	25

Phase 4 — Demo Polish & Testing (Days 12–14)	25

Recommended dependency-aware build order note	25

## 34. Feature/Stage Ownership	26

Six-Person Team Table	26

## 35. Environment Setup	26

`.env.example`	26

## 36. Docker & Deployment	27

## 37. Architecture Decisions & Rationale	27

## 38. Scope Boundaries — What NOT to Build	28

## 39. PRD Ambiguities / Recommended Clarifications (consolidated)	28

## 40. Final Build Checklist	29

## 41. Final Architecture Summary	30

Repository Tree — see Section 6.	30

High-Level Architecture — see Section 4.2.	30

Layer Diagrams	30

End-to-End Data Flow — see Section 29 (Workflows 1–7).	30

Technology Stack Table — see Section 5.	30

Six-Person Team Table — see Section 34.	30

Phase Roadmap — see Section 33.	30

Implementation Traceability Matrix	31

Document Quality Notes	31

If the Word viewer does not automatically refresh the TOC, use Word's “Update Field” action on the table.

# 1. Executive Overview

SANKET · AI ingests Oil India Limited's free-text safety reports and turns them into structured, explainable, and actionable safety intelligence. It does this through three layers — understand a single report, connect many reports, and turn the result into a tracked corrective action (CAPA). The system is a modular monolith: one FastAPI backend, one Next.js frontend, one SQL database, an in-process AI pipeline, an in-memory graph, and a small set of MCP tools — not a distributed system. This document tells a team of six exactly what to build, where, with what technology, and in what order.

# 2. Problem Definition

Safety reports are free-text observations submitted by field workers, supervisors, and officers — near misses, unsafe acts, unsafe conditions, and incident logs. Most are low-severity. A small fraction (empirically ~20–25% industry-wide, per DEKRA) describe conditions with Serious Injury & Fatality (SIF) potential — a fatal outcome was realistically possible even though nothing bad happened this time. Traditional safety metrics that count all incidents equally hide this fraction: DEKRA's research shows non-fatal incidents can fall sharply while fatalities barely move, because low-severity events and SIF-potential events have different causes.

The DEKRA classification used throughout SANKET · AI:

* SIF Actual (SIFa)** — a fatality or life-altering injury occurred.
* SIF Potential / Precursor (SIFp)** — high-energy hazard + a missing or failed barrier; disaster avoided by luck or timing.
* Non-SIF** — low-energy event, no realistic fatal escalation path.

Individually, a report like "oil stain on walkway" looks trivial. But if the same equipment or location produces three such reports in a week, that is a systemic risk — a barrier is silently failing. Catching this requires looking across reports, not just at one. Once a risk (individual or systemic) is identified, someone must be made responsible for fixing it, on a deadline, with proof of verification — this is CAPA (Corrective and Preventive Action). Because classification is probabilistic, human-in-the-loop review (AGREE / UPGRADE / DOWNGRADE) keeps a person legally and practically accountable for every high-stakes decision — SANKET · AI supports HSE officers, it does not replace them.

SANKET · AI in one sentence: a multi-agent AI/NLP engine that scores, explains, connects, and helps act on SIF-precursor safety reports in real time, with a fully offline mode for air-gapped operation.

# 3. Functional Three-Layer Model

This model is the spine of the whole system. Every module built by the team must be traceable to one of these layers.

| Layer | Question Answered | PRD Features | Core Tech |
| --- | --- | --- | --- |
| **Layer 1 — Individual Report Intelligence** | What happened in this report and how dangerous is it? | F1–F5, F17 (per-report portion), F18 | Sentence-Transformers, GLiNER/spaCy, embeddings, Groq/Ollama |
| **Layer 2 — Cross-Report / Systemic Intelligence** | What pattern exists across many reports, and is it a bigger threat? | F6, F7 | NetworkX, temporal windowing |
| **Layer 3 — CAPA / Intervention** | What should be done, by whom, by when, and how do we know it's done? | F11, F8 (action columns) | Deterministic business logic |

Layers are strictly sequential in data dependency: Layer 2 consumes Layer 1's entities; Layer 3 consumes Layer 1's SIF score and Layer 2's cluster alerts. F9 (Inspector), F10 (feedback), F12–F14 (documents), F15 (voice), F16 (air-gap) and F17–F18 (analytics/energy wheel) are cross-cutting features that read from all three layers rather than belonging to one.

# 4. System Architecture

## 4.1 High-Level Flow (PRD-baseline)

Users → Frontend → Backend API → Async Processing → AI/NLP Pipeline
      → Cross-Report Intelligence → CAPA/Action → Database
      → Realtime Dashboard / Reports

## 4.2 Expanded Architecture

```text
┌───────────────────────────── Frontend (Next.js) ─────────────────────────────┐
│ Triage Queue · Inspector · Graph · Analytics · Briefing · Voice · Settings    │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                     │ REST + WebSocket
┌───────────────────────────────────▼──────────────────────────────────────────┐
│                          FastAPI Backend (modular monolith)                   │
│  api/  auth/  services/  workers/  db/  config/  realtime/                    │
└───────┬───────────────┬────────────────┬────────────────┬───────────────┬────┘
        │               │                │                │               │
        ▼               ▼                ▼                ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐
│  ai/ pipeline│ │ graph/ (Nx)  │ │ mcp/ (4 tools)│ │ documents/   │ │ LangGraph│
│  5-stage NLP │ │ Signal Graph │ │ FastMCP server│ │ ReportLab/   │ │ 7 agents │
│  + agents    │ │ + clustering │ │               │ │ python-docx  │ │          │
└──────┬───────┘ └──────┬───────┘ └──────┬────────┘ └──────┬───────┘ └────┬─────┘
       │                │                │                 │              │
       └────────────────┴────────────────┴─────────────────┴──────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │  Data Layer                    │
                     │  SQLite/PostgreSQL (SQLAlchemy)│
                     │  ChromaDB (vector store)       │
                     │  NetworkX graph (in-memory,    │
                     │  periodically persisted)       │
                     └───────────────────────────────┘
```

Each box in AI / graph / mcp / documents / LangGraph is a Python package inside the same backend process (imported, not networked) — this is what "modular monolith" means here. MCP is the one exception: it runs as a local fastmcp server (stdio or local HTTP) so agents call tools through a standard protocol, but it is still deployed alongside the backend, not as a remote service.

## 4.3 Subsystem Responsibilities

| Subsystem | Why it exists |
| --- | --- |
| Frontend | Operator-facing dashboard; renders Layer 1–3 outputs; never computes intelligence itself. |
| Backend API | Single entry point for all client operations; owns auth, validation, and orchestration triggers. |
| Background workers | Run the (potentially slow) NLP pipeline off the request thread so ingestion returns immediately. |
| AI/NLP pipeline | Implements Layer 1 (Section 14–19). |
| LangGraph | Orchestrates the 7 agents / pipeline stages with explicit conditional routing (Section 20). |
| Knowledge Graph (NetworkX) | Implements Layer 2 (Section 21–23). |
| MCP tools | Standardized, reusable functions the agents call instead of embedding DB/graph/PDF logic inline (Section 24). |
| Documents | Implements the PDF/document outputs (Section 28). |
| Voice | Alternate ingestion channel that normalizes into the same report pipeline (Section 29). |
| Realtime (WebSocket) | Pushes processing/risk/CAPA events to the dashboard without polling (Section 27). |
| Auth/RBAC | Protects report data and enforces the 4 PRD roles (Section 31). |
| Config | Central place for online/offline mode, thresholds, model paths. |
| Logging/Audit | Every classification, feedback action, and CAPA change is timestamped and attributable. |
| Testing | Unit/integration/E2E/AI-evaluation, kept separate from demo data (Section 37). |

# 5. Technology Stack

| Layer | Technology | Status |
| --- | --- | --- |
| Frontend framework | Next.js 14 (App Router), React, TypeScript | PRD |
| Styling | Tailwind CSS 3.4+ | PRD |
| UI components | shadcn/ui | PRD |
| Charts | Recharts | PRD |
| Graph viz | Cytoscape.js (cola layout) | PRD |
| PDF preview | react-pdf | PRD |
| Backend | FastAPI 0.110+ | PRD |
| ORM | SQLAlchemy 2.0+ (async) | PRD |
| DB (dev) | SQLite | PRD |
| DB (prod) | PostgreSQL 16+ | PRD |
| Vector store | ChromaDB 0.5+ | PRD |
| Embeddings | `sentence-transformers/multilingual-e5-small (intfloat/multilingual-e5-small)` (384-dim) | PRD |
| Zero-shot NER | GLiNER | PRD |
| NLP toolkit | spaCy `en_core_web_sm` (fallback) | PRD |
| LLM (online) | Groq `llama-3.3-70b-versatile` | PRD |
| LLM (offline) | Ollama `llama3.1:8b` | PRD |
| Voice STT | Whisper (`whisper-small`, 461MB) | PRD |
| Orchestration | LangGraph | PRD |
| Tool protocol | FastMCP | PRD |
| Graph analytics | NetworkX 3.3+ | PRD |
| Document gen | ReportLab + python-docx | PRD |
| Diagrams | Mermaid.js | PRD |
| Network monitor | psutil | PRD |
| Realtime | **WebSocket via FastAPI** | **Recommended Addition** — PRD architecture diagram implies real-time updates in F8 ("New reports appear at top as ingested") but specifies no transport. WebSocket is the natural FastAPI-native fit; polling is an acceptable fallback for a hackathon build. |
| Auth | **JWT session + RBAC middleware** | **Recommended Addition** — PRD Section 19 defines 4 roles but not a mechanism. |
| Testing | pytest, pytest-asyncio, httpx, Playwright/Cypress | **Recommended Addition** |

# 6. Repository Structure

vigil-ai/
├── frontend/
│   ├── app/                       # Next.js App Router pages
│   ├── components/
│   ├── hooks/
│   ├── lib/                       # api client, ws client, utils
│   ├── types/
│   └── public/
├── backend/
│   ├── api/                       # route modules, one per resource
│   ├── models/                    # SQLAlchemy ORM models
│   ├── schemas/                   # Pydantic request/response schemas
│   ├── services/                  # business logic (report, capa, feedback, analytics, graph, realtime)
│   ├── workers/                   # background job runners (pipeline trigger)
│   ├── db/                        # session, migrations
│   ├── auth/                      # JWT, RBAC dependency
│   ├── config/                    # settings, mode switch (online/air-gapped)
│   └── main.py
├── ai/
│   ├── preprocessing/             # Stage 1
│   ├── sif/                       # Stage 2 — classifier + anchor library loader
│   ├── entities/                  # Stage 3 — GLiNER + spaCy fallback
│   ├── lsr/                       # Stage 4 — rule mapper
│   ├── explanation/               # Stage 5 — Groq/Ollama explainer
│   ├── agents/                    # LangGraph node implementations (7 agents)
│   ├── pipeline/                  # StateGraph wiring, ReportState
│   └── providers/                 # online/offline model provider switch
├── graph/
│   ├── graph_store.py             # NetworkX graph singleton + persistence
│   ├── builder.py                 # node/edge construction from a processed report
│   ├── clustering.py              # Near-Miss Multiplier / temporal cluster detection
│   └── serializer.py              # graph → Cytoscape JSON
├── mcp/
│   ├── server.py                  # FastMCP app, registers 4 tools
│   └── tools/
│       ├── query_past_incidents.py
│       ├── lookup_iogp_rule.py
│       ├── detect_graph_clusters.py
│       └── generate_pdf.py
├── documents/
│   ├── briefing.py                # F12
│   ├── dossier.py                 # F13
│   ├── bowtie.py                  # F14 (Mermaid generation)
│   └── templates/
├── data/
│   ├── sif_anchor_library.json    # 50 anchors
│   ├── iogp_rules.json            # 9 rules
│   ├── synthetic/                 # 500-report generator + output
│   └── eval/                      # held-out labeled evaluation set (kept separate)
├── scripts/
│   ├── generate_synthetic_data.py
│   ├── precompute_embeddings.py
│   └── seed_db.py
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── eval/
├── docs/
├── docker/
├── .env.example
├── docker-compose.yml
├── README.md
└── .gitignore

## 6.1 Folder-by-folder notes

`ai/` — All ML/NLP/LLM logic lives here, and only here. It must not import FastAPI or touch HTTP concerns; it exposes plain Python functions/classes that backend/services/analysis_service.py calls. This boundary keeps the pipeline independently testable and reusable from CLI scripts (e.g., re-scoring the whole dataset after a threshold change).

`graph/` — Owns the single in-memory NetworkX graph instance. Nothing outside this folder should mutate the graph directly; backend/services/graph_service.py is the only caller. Communicates with: ai/agents (Pattern Detective node calls builder.py), backend/api/graph (reads via serializer.py), mcp/tools/detect_graph_clusters.py (wraps clustering.py).

`mcp/` — Thin wrapper layer. Each tool function must delegate to an existing backend/services/* function — no business logic should be duplicated here. This folder should not contain SQL or NetworkX code directly.

`documents/` — Consumes already-computed structured data (report + entities + LSR + graph neighbors + actions) and renders PDFs. Must not call the SIF classifier, GLiNER, or an LLM directly — if a document needs an explanation, it reads report.explanation, which Layer 1 already produced.

`data/` — Static reference data (sif_anchor_library.json, iogp_rules.json) plus synthetic and evaluation datasets. data/eval/ must never be used to generate anchors or fine-tune thresholds — it exists solely to measure them (Section 26).

`backend/services/` — The real business logic layer. Routes in backend/api/ should be thin: validate → call a service → return. Services are what workers, MCP tools, and (indirectly) LangGraph nodes all funnel through, so there is exactly one implementation of "create a report," "update a graph," "create a CAPA action," etc.

# 7. Frontend Architecture

## 7.1 Structure

frontend/
├── app/
│   ├── layout.tsx              # shell: sidebar nav + AirGapStatus widget
│   ├── page.tsx                # Triage Queue ("/")
│   ├── reports/[id]/page.tsx   # Incident Inspector
│   ├── graph/page.tsx          # Safety Signal Graph
│   ├── analytics/page.tsx      # Analytics Dashboard
│   ├── briefing/page.tsx       # Shift Handover
│   ├── voice/page.tsx          # Voice-to-Report
│   ├── settings/page.tsx       # System Configuration
│   └── login/page.tsx          # Recommended Addition — auth entry point
├── components/
├── hooks/
│   ├── useReports.ts
│   ├── useWebSocket.ts
│   └── useAuth.ts
├── lib/
│   ├── api.ts                  # typed REST client
│   └── ws.ts                   # WebSocket client with reconnect/backoff
└── types/
    └── index.ts                # mirrors backend Pydantic schemas

State management: React Query (server cache) + local component state is sufficient; no global state library required (Recommended — avoids overengineering per Rule 7).

## 7.2 Pages

### `/` — Triage Queue (F8)

* Data:** `GET /api/reports` (paginated, filterable).
* Displays:** table columns per PRD Section 12.5 Screen 1 (#, Timestamp, Report Summary, SIF Score badge, LSR tag, Location, Status dot, Actions).
* Interactions:** filter pills (SIF label, LSR tag, status, date range, location), sort by SIF score (default), row click → Inspector, quick actions (mark reviewed / assign / export).
* Realtime:** subscribes to `report.completed` — new/updated rows animate to correct sorted position.
* States:** loading skeleton rows; empty state ("No reports match filters"); error banner with retry.
* Permissions:** all authenticated roles except Field Worker (voice-submission only, per PRD Section 19).

### `/reports/[id]` — Incident Inspector (F9)

* Data:** `GET /api/reports/{id}` (report + entities + lsr_tags + explanation + neighbors + actions).
* Layout:** left panel (60%) — raw text with color-coded entity underlines; right panel (40%) — stacked cards: SIF gauge, LSR citation, Explanation quote block, Bow-Tie (Mermaid, HIGH only), Graph Neighbors mini-view, Action panel with AGREE/UPGRADE/DOWNGRADE buttons.
* Interactions:** feedback submission (`POST /api/reports/{id}/feedback`), CAPA creation (`POST /api/reports/{id}/action`).
* Empty state:** MEDIUM/LOW reports with no explanation show "Explanation not generated (score below 0.50 threshold)" rather than a blank card.

### `/graph` — Safety Signal Graph (F6)

* Data:** `GET /api/graph/signals`, `GET /api/graph/clusters`.
* Layout:** full-screen Cytoscape.js canvas, cola layout, collapsible filter sidebar.
* Interactions:** click node → side drawer of connected reports; clusters render with a pulsing red border (per PRD Section 12.4 Air-Gap/severity color rules — red reserved for critical state).

### `/heatmap` — SIF-Precursor Density Heatmap (Headline Deliverable) & Analytics

* Data:** `GET /api/analytics/trends?metric=...&period=...`.
* Layout:** 4 metric cards, SIF density line chart (30/60/90d toggle), LSR bar chart, Day-vs-Night grouped bar chart, Top-5 riskiest locations.

### `/briefing` — Shift Handover Generator (F12)

* Data:** `POST /api/briefing/generate` → `{pdf_url}`.
* Layout:** form (site, shift type, date) + live PDF preview via react-pdf.

### `/voice` — Multimodal Field Reporting Portal (F13/F15) (Voice Hold-to-Talk Mic + Direct Text Box Fallback)

* Layout:** large mic button (press-and-hold), waveform visualizer, post-recording transcript + detected-language badge, "Submit to Pipeline" button.
* Data:** `POST /api/voice/transcribe` → transcript → `POST /api/reports/ingest`.
* Permission:** the one screen Field Worker role can access.

### `/settings` — System Configuration (F16)

* Layout:** AI mode toggle (Online/Air-Gapped), live air-gap traffic log, loaded-model status, Near-Miss Multiplier window/threshold sliders, feedback review log.
* Data:** `GET /api/system/airgap`.
* Permission:** Admin only.

### `/login` — 2-Portal Dual Sign-In Entry Point (Field Worker Quick-Access vs Safety Manager Command Center)

Simple credential form issuing a JWT; not specified by the PRD, required to make RBAC functional.

## 7.3 Key Reusable Components

| Component | Responsibility |
| --- | --- |
| `ReportTable` / `ReportRow` | Triage queue rendering, sort/filter-aware |
| `SIFBadge` / `SIFScore` | Colored pill (`🔴 HIGH 0.87`) and gauge bar |
| `FilterBar` | Shared filter-pill row (queue + graph + analytics) |
| `EntityHighlight` / `EntityList` | Inline colored underline in report text; grouped sidebar list |
| `LSRRuleCard` | Rule name + official description + examples |
| `ExplanationCard` | Bordered quote block for the 2-sentence LLM output |
| `GraphViewer` / `GraphMiniView` | Full Cytoscape canvas vs. small inline neighbor view |
| `RiskClusterCard` | Systemic alert summary card |
| `CAPAActionPanel` | Assign/track a work order, SLA countdown |
| `FeedbackControls` | AGREE / UPGRADE / DOWNGRADE + reason field |
| `AnalyticsCards` / `Charts` | Recharts wrappers |
| `PDFPreview` | react-pdf wrapper |
| `VoiceRecorder` | MediaRecorder wrapper, waveform |
| `AirGapStatus` | Fixed-position widget, green/red indicator |
| `Toast/Alert` | Notification primitives |
| `Sidebar/Layout/Nav` | App shell |

Visual System & Design Specifications: Dual-Theme Enterprise Architecture. (1) Hero Landing / Auth Entry: Defense-Grade Midnight Dark (#0A0D12) with refinery night backdrop (Asset: C:\Users\priya\Documents\sih26 project build\homepage bg.png / public path /assets/hero_refinery_bg.png), Crisp White (#FFFFFF) headings, Crimson Safety Red (#DC2626) critical accents ('THE INCIDENT' / Primary CTA button), and JetBrains Mono green (#10B981) for Air-Gap Zero-Egress status ('0 KB/s OUT'). (2) Command Center Dashboard: High-density Light Mode (#F8FAFC / #FFFFFF, 1px #E2E8F0 borders) with strict severity badges: Red (#DC2626 HIGH), Amber (#D97706 MEDIUM), Green (#16A34A LOW).

# 8. Backend Architecture

## 8.1 Responsibilities

Authentication/authorization · report ingestion (single/CSV/JSON) · report retrieval & filtering · pipeline triggering · background processing · graph read/write · analytics aggregation · CAPA lifecycle · feedback logging · document generation triggers · voice transcription proxy · realtime event emission · system health / air-gap status.

## 8.2 Folder Responsibilities

backend/
├── api/            → thin route handlers, one router per resource (reports, graph, analytics, briefing, dossier, voice, system, feedback, actions, auth)
├── models/          → SQLAlchemy models: Report, Entity, LSRTag, GraphEdge, Action, FeedbackLog, SystemicAlert, User (Recommended Addition)
├── schemas/          → Pydantic in/out schemas per resource
├── services/          → report_service, analysis_service, graph_service, cluster_service, capa_service, feedback_service, analytics_service, document_service, transcription_service, realtime_service
├── workers/            → async job that runs the AI pipeline per report id, updates status PENDING→PROCESSING→COMPLETED/FAILED
├── db/                  → engine/session factory, migrations (Alembic recommended)
├── auth/                 → JWT issuance, RBAC dependency (`require_role(...)`)
└── config/                 → Settings (pydantic-settings): mode (online/airgap), thresholds, model paths, secrets

Rule enforced throughout: routes never contain business logic. A route validates input via its schema, calls exactly one service method, and returns the service's result mapped to a response schema.

# 9. API Specification

Baseline = PRD Section 11, expanded with auth/errors/events. All endpoints require a valid JWT unless noted; role column uses PRD Section 19 roles (Admin / HSE Manager / Site Officer / Field Worker).

| # | Method | Endpoint | Role | Request | Response | DB ops | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | POST | `/api/reports/ingest` | Site Officer+ (Field Worker for voice-origin only) | `{text?, file?, format?, source}` | `{job_id, count, status}` | insert `reports` (status=PENDING) | enqueues background worker → AI pipeline |
| 2 | GET | `/api/reports` | all except none | query: `sif_label, lsr_tag, status, date_from, date_to, location, equipment, shift, page, limit` | `{reports[], total, page}` | select `reports` w/ filters | — |
| 3 | GET | `/api/reports/{id}` | all | path: `report_id` | `{report, entities[], lsr_tags[], explanation, neighbors[], actions[]}` | joined select across 4 tables | — |
| 4 | POST | `/api/reports/{id}/feedback` | HSE Manager, Site Officer | `{corrected_label, reason?, officer_id}` | `{feedback_id, agreement_rate}` | insert `feedback_log` | emits `feedback.submitted` |
| 5 | POST | `/api/reports/{id}/action` | HSE Manager, Site Officer | `{action_type, priority, assigned_to, due_date, notes?}` | `{action_id, status}` | insert `actions`, computes SLA due date | emits `capa.created` |
| 6 | GET | `/api/graph/signals` | all except Field Worker | `date_from, date_to, location?, equipment?` | `{nodes[], edges[]}` | reads NetworkX (serialized) | — |
| 7 | GET | `/api/graph/clusters` | all except Field Worker | `status?` | `{clusters[]}` | select `systemic_alerts` | — |
| 8 | GET | `/api/analytics/trends` | HSE Manager, Admin | `metric, period` | `{data_points[]}` | aggregate query | — |
| 9 | POST | `/api/briefing/generate` | HSE Manager, Site Officer | `{site, shift_type}` | `{pdf_url}` | reads `reports`, `actions` | MCP `generate_pdf` |
| 10 | POST | `/api/dossier/generate` | HSE Manager, Site Officer | `{report_id}` | `{pdf_url}` | reads full report graph | MCP `generate_pdf` |
| 11 | POST | `/api/voice/transcribe` | Field Worker+ | multipart `audio_file` | `{transcribed_text, language}` | none (stateless) | may chain into endpoint 1 |
| 12 | GET | `/api/system/airgap` | Admin | — | `{is_airgapped, outbound_kbps, models_loaded[], uptime}` | none | — |
| 13 | POST | `/api/auth/login` | public | `{username, password}` | `{token, role}` | select `users` | **Recommended Addition** |
| 14 | WS | `/ws/reports` | all | — | stream of `report.processing / report.completed / risk.detected / cluster.created / capa.created / action.updated` | — | **Recommended Addition** |

Standard error shape: {error_code, message, detail?}. Status codes: 400 (validation), 401/403 (auth), 404 (not found), 409 (conflict, e.g. duplicate feedback), 422 (schema), 500 (unhandled — logged, never leaks stack trace to client), 503 (dependent service down — e.g. Groq unreachable and no offline fallback configured).

# 10. Database Architecture

Baseline = PRD Section 10. UUID primary keys throughout (as specified).

### `reports`

Purpose: canonical record of every ingested report and its Layer-1 result.

Key indexes: sif_label, status, submitted_at (all queried constantly by the Triage Queue and cluster detection). Composite index on (status, sif_label, submitted_at) recommended for the default queue sort.

### `entities`

FK report_id → reports.id (cascade delete). Index on (entity_type, value) — this is the join key Layer 2 uses to find "same equipment/location" across reports; it must be indexed or temporal clustering (Section 23) degrades to a full scan per report.

### `lsr_tags`

FK report_id → reports.id. Index on rule_id (used by analytics F17 LSR breakdown chart).

### `graph_edges`

Not strictly required if the graph lives entirely in NetworkX memory, but the PRD specifies it as a table — treat it as a periodic snapshot/persistence layer so the graph survives a restart. Index on (source_node, target_node).

### `actions`

FK report_id → reports.id. Index on (status, due_date) for SLA-countdown queries and the escalation check.

### `feedback_log`

FK report_id → reports.id. Index on officer_id, timestamp for the agreement-rate rolling metric (F10).

### `systemic_alerts`

Index on cluster_node, status. report_ids stored as JSON array (SQLite/Postgres both support this natively).

### Entity Relationship Summary

Report
 ├── Entities        (1:N)
 ├── LSRTags         (1:N)
 ├── Actions         (1:N)
 ├── FeedbackLog      (1:N)
 └── (indirectly) GraphEdges via report_ids JSON array

### PRD Ambiguity — `graph_edges.report_ids` vs. relational normalization

PRD Ambiguity / Recommended Clarification: storing report_ids as a JSON array inside graph_edges (rather than a normalized edge_report_membership join table) makes "which edges did report X contribute to" a JSON-contains query, which is slower and less indexable than a join table. Recommended: keep the PRD's JSON column for simplicity (SIH timeline), but document this as a known scaling limitation, not silently redesign it.

### `users` table — **Recommended Addition (Required)**

The PRD defines 4 roles (Section 19) but no users table. Minimal schema: id (UUID PK), username, password_hash, role, created_at. Required for any RBAC to function.

# 11. AI/NLP Architecture

The 5-stage pipeline (PRD Section 8) is the heart of Layer 1. Design rule from the AI-context guide: each stage has a clear typed input/output; stages are never collapsed into one LLM call.

Raw Report
  → Stage 1 Preprocessing        (deterministic)
  → Stage 2 SIF Classification   (embedding similarity, deterministic scoring)
  → Stage 3 Entity Extraction    (zero-shot NER model)
  → Stage 4 LSR Mapping          (embedding similarity, deterministic)
  → Stage 5 LLM Explanation      (generative, conditional on score ≥ 0.50)
  → Structured Safety Intelligence

## 11.1 Stage 1 — Text Preprocessor

* Input:** `raw_text: str`
* Output:** `preprocessed_text: str`, `language: str`
* Library:** Unicode NFC normalization (Python `unicodedata`), `langdetect`/`lingua` for language ID, spaCy sentencizer for segmentation, regex/`ftfy`-style cleanup for mojibake/HTML entities.
* Error handling:** empty/whitespace-only text → reject at ingestion with 400, never enters the pipeline.
* Testing:** unit tests with known mojibake strings, mixed-language input, empty string.

## 11.2 Stage 2 — SIF Classifier

See Section 12 (dedicated section — this is the most scrutinized stage of the system).

## 11.3 Stage 3 — Entity Extractor

See Section 13.

## 11.4 Stage 4 — LSR Mapper

See Section 14.

## 11.5 Stage 5 — LLM Explainer

See Section 15. Conditional: only runs if sif_score >= 0.50 (PRD Agent #5 trigger condition) — this saves LLM calls on the ~50% of LOW reports and keeps Groq's free-tier daily quota (14,400 calls) comfortably within budget for a 500-report demo dataset.

## 11.6 Performance

Precompute and cache: 50 SIF anchor embeddings, 9 IOGP rule embeddings — both at process startup, not per-request. multilingual-e5-small (supports Hindi, Assamese, English) runs on CPU comfortably at this batch size (PRD target: 200 reports < 10s end-to-end including all 5 stages).

# 12. SIF Classification (Stage 2 — deep dive)

Why deterministic embedding similarity, not an LLM: SIF classification must be reproducible, auditable, and fast at batch scale — an LLM call per report would be slower, non-deterministic across runs, and impossible to explain with "which anchor matched" evidence. This is a direct instruction in the AI-context guide (Section 7): "Do not replace deterministic/embedding-based classification with an LLM."

### Pipeline

report_text
  → embed with multilingual-e5-small (supports Hindi, Assamese, English) → v ∈ R^384
  → cosine_similarity(v, anchor_i) for each of 50 anchors → max_similarity
  → keyword_boost = +0.15 if critical term present AND preceding 5-token negation window is clean (no: no, not, without, avoided, zero, never, prevented), else 0
  → raw_score = max_similarity + keyword_boost
  → final_score = clamp(raw_score, 0.0, 1.0)
  → label = HIGH if final_score >= 0.75
           MEDIUM if 0.50 <= final_score < 0.75
           LOW if final_score < 0.50

* Critical terms (PRD-specified):** "fatality", "confined space", "energized", "fall from height", "H₂S", "blowout", "explosion", "crush", "amputation" — case-insensitive substring match is sufficient for the hackathon build; stemming/lemmatization is an optional enhancement. (Note: Evaluated strictly with a 5-token preceding negation window parser to eliminate false positives on phrases like "no explosion occurred").
* Anchors:** stored in `data/sif_anchor_library.json`, 50 entries, each `{id, text, lsr, energy_type, sif_level}` per the PRD's schema example. **Anchor embeddings are precomputed once** (`scripts/precompute_embeddings.py`) and cached (ChromaDB or a simple `.npy` file — ChromaDB is the PRD's specified vector store, use it here for both anchors and IOGP rules so there is one vector-storage mechanism, not two).
* Explainability requirement:** every classification must retain `matched_anchor_id` and `matched_anchor_text` alongside the score, so the Inspector (F9) and dossier (F13) can show *why* — this is required by the AI-context guide Section 19 ("Explainability and Trust").
* Testing:** unit tests feeding each of the 50 anchor texts verbatim should score ≥ 0.95 against itself; keyword-boost tests; clamp-at-1.0 boundary tests.
* Do not fabricate accuracy numbers.** The PRD's only stated target is SIF recall ≥ 85% / precision ≥ 75% on a 100-report labeled test set (Section 18.2) — no number beyond that should appear anywhere (demo slides, code comments, or this document).

# 13. Entity Extraction (Stage 3 — deep dive)

* Primary:** GLiNER (zero-shot NER), configured with the 8 custom labels: `EQUIPMENT, LOCATION, SHIFT_TIME, WEATHER_CONDITION, PPE_STATUS, BARRIER_FAILURE, ENERGY_SOURCE, BODY_PART`.
* Fallback:** spaCy `en_core_web_sm` — used when GLiNER confidence is low or GLiNER is unavailable (e.g., model load failure in an offline environment), to guarantee the pipeline never returns zero entities.
* Output schema:** `entities: list[{type, value, confidence}]`, persisted to the `entities` table, one row per entity.
* Why it matters beyond display:** `EQUIPMENT` and `LOCATION` values are the join keys for Layer 2 (Section 21) — extraction quality directly determines cluster-detection quality. Normalize entity values (trim, title-case, common alias mapping e.g. "Pump 4" → "Pump-04") **before** graph insertion, or clustering will silently under-count due to string mismatches. This normalization step is a **Recommended Addition** — the PRD does not specify it, but Section 23's clustering algorithm assumes exact node-label matches.
* Testing:** entity-level F1 against the 50-report labeled evaluation subset (PRD target ≥ 70%, Section 18.2).

# 14. IOGP Life-Saving Rule Mapping (Stage 4 — deep dive)

* Reference data:** the 9 IOGP rules (`data/iogp_rules.json`), each with `{rule_id, rule_name, description, examples}` matching PRD Section 2.4.
* Method:** pre-embed all 9 rule descriptions once at startup; compute cosine similarity between the report embedding (reused from Stage 2, not recomputed) and each rule embedding.
* Threshold:** tag top-1 or top-2 rules with similarity ≥ 0.45 (PRD-specified).
* Relationship to SIF classification:** independent of the SIF score — a LOW-severity report can still carry an LSR tag (e.g., minor PPE non-compliance still maps to a rule) even though it won't be escalated. LSR tagging and SIF scoring both consume the *same* embedding vector, but are two separate similarity searches against two separate anchor sets — do not conflate them into one classifier.
* Storage:** `lsr_tags` table, `{report_id, rule_name, rule_id, similarity}`.

# 15. LLM Explanation System (Stage 5 — deep dive)

Why an LLM exists here and nowhere else in Layer 1: classification (Stage 2) and LSR mapping (Stage 4) need to be deterministic and fast at 200+ reports/batch; explanation generation is inherently a natural-language synthesis task where an LLM is the right tool — but only for reports that already cleared the ≥0.50 threshold, and only to phrase a conclusion the deterministic stages already reached, not to make the classification decision.

### Prompt template (PRD-specified)

Given this safety incident report and its SIF classification of [HIGH/MEDIUM/LOW],
explain in exactly 2 sentences why this event has fatal potential. Reference the
specific barrier failure and energy source identified.

### Grounding to prevent hallucination

The prompt must be populated with already-extracted structured data, not the raw report text alone: the matched barrier-failure/energy-source entities (Stage 3) and the matched LSR rule text (via MCP lookup_iogp_rule) are injected into the prompt context. This is what "grounded explanation" means in the PRD (Agent #5 spec: "uses `lookup_iogp_rule()` to fetch the official rule text for grounded explanation") — the LLM is explaining a decision using facts it's handed, not inventing its own risk assessment.

### Validation

* Reject/retry if output is not close to 2 sentences (simple heuristic: sentence-count check via spaCy).
* Never persist an explanation that references an entity type not present in `report.entities` — a lightweight post-generation check (Recommended Addition) that greps the output for named equipment/location and confirms it matches extracted entities, to catch fabricated specifics.

### Online/Offline switching

ai/providers/ exposes one interface, e.g. ExplainerProvider.generate(prompt) -> str, with two implementations: GroqProvider (online) and OllamaProvider (llama3.1:8b, offline). The active provider is selected from backend/config (AI_MODE=online|airgapped) at process startup — not per-request — so a demo can flip Wi-Fi off mid-run and the next new report still routes correctly if the mode was pre-switched via Settings (F16), consistent with the PRD's Air-Gap demo power-move (Section 16).

### Failure behavior

If Groq is unreachable and mode is online, fall back to FAILED explanation status with a retry queue — do not silently fall back to Ollama unless the operator has explicitly enabled offline mode, since silent mode-switching would undermine the air-gap guarantee this system is built to prove.

# 16. LangGraph Agent Architecture

## 16.1 Shared State

```text
class ReportState(TypedDict):
    raw_text: str
    preprocessed_text: str
    language: str
    sif_score: float
    sif_label: str
    entities: list[dict]
    lsr_tags: list[dict]
    explanation: str
    graph_neighbors: list[dict]
    cluster_alert: bool
    capa_generated: bool
```

## 16.2 Agent-by-Agent Specification

| # | Agent | Responsibility | ML? | LLM? | MCP Tool | Condition | On Failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Supervisor | Orchestrator; routes state through the graph, handles conditional edges and retries | No | No | — | always runs first | marks report `FAILED`, logs error, does not crash the batch |
| 1 | SIF Classifier | Embedding similarity + keyword boost → `sif_score`, `sif_label` | Yes (embeddings) | No | — | always | falls back to `LOW`/flag-for-manual-review if embedding model fails to load |
| 2 | Entity Extractor | GLiNER + spaCy fallback → `entities` | Yes | No | — | always | spaCy fallback if GLiNER fails; empty list (not crash) if both fail |
| 3 | Rule Mapper | Embedding similarity vs. 9 IOGP rules → `lsr_tags` | Yes (embeddings) | No | — | always | empty tag list if embeddings unavailable |
| 4 | Pattern Detective | Updates knowledge graph; queries temporal cluster | Deterministic graph algo | No | `query_past_incidents`, `detect_graph_clusters` | always | graph update retried once; on repeated failure, report still saved, flagged `graph_sync_pending` |
| 5 | Explainer | 2-sentence grounded explanation | No | **Yes** (Groq/Ollama) | `lookup_iogp_rule` | `sif_score >= 0.50` | explanation left null, report still usable; retry queued |
| 6 | CAPA & Dossier | Work-order creation + PDF/dossier data prep | No | No | `generate_pdf` | `sif_score >= 0.75` OR `cluster_alert == True` | CAPA record created even if PDF generation fails (PDF is separable) |

Only Agent #5 calls an LLM. This is intentional and matches AI-context guide Section 4/15 — most of the "intelligence" is deterministic embedding math or graph algorithms, and generative language is reserved for the one place it's actually needed.

## 16.3 Execution Flow

Sequential: Supervisor → 1 → 2 → 3 → 4, then conditionally → 5 (if score ≥ 0.50) and → 6 (if score ≥ 0.75 or cluster_alert). Agents 1–3 have no data dependency on each other and may run in parallel branches in LangGraph (Recommended Addition for performance, since the PRD lists them sequentially but the shared state has no inter-dependency among 1/2/3) — Agent #4 must run after all three complete, since it needs entities.

# 17. Knowledge Graph (Layer 2)

## 17.1 Graph Engine

NetworkX, in-memory, single process-wide instance owned by graph/graph_store.py. Periodically snapshotted to the graph_edges table (e.g., after each report, or on a timer) so a restart doesn't lose graph state — the DB table is the durability layer, NetworkX is the query/compute layer.

## 17.2 Nodes & Edges (PRD Section 9, unchanged)

Nodes: EQUIPMENT, LOCATION, SHIFT, BARRIER_FAILURE, ENERGY_SOURCE, LSR_VIOLATION.

Edges: co_occurred_with (+1 weight per co-occurrence in the same report), located_at (static), violates_rule (+1 per violation instance).

## 17.3 Update Flow

After Stage 3 (entities) and Stage 4 (LSR) complete for a report, Agent #4 (Pattern Detective) calls graph/builder.py:

1. Add/get each extracted entity as a node.
1. Add a `co_occurred_with` edge between every pair of entities in this report (increment weight if edge exists).
1. Add `violates_rule` edges from relevant entity nodes to the matched LSR node.
1. Record `report_id` on each touched edge (for the `report_ids` JSON column).

## 17.4 Frontend Serialization

graph/serializer.py converts the NetworkX graph (optionally filtered by date range/location/equipment per the API query params) into Cytoscape.js-compatible {nodes[], edges[]} JSON — this is what GET /api/graph/signals returns.

# 18. Near-Miss Multiplier / Temporal Cluster Detection (Layer 2, deep dive)

Baseline rule (PRD Section 6.2, 9.3 — unchanged, do not invent new thresholds):

For each EQUIPMENT or LOCATION node N:
    events_in_window = count of reports mentioning N in the last 7 days
    if events_in_window >= 3:
        Flag N as SYSTEMIC_RISK_CLUSTER
        Elevate ALL connected reports to HIGH
        Create SystemicRiskAlert record

* Window & threshold are configurable** (default 7 days / 3 events) via Settings (F16) — implemented as backend config values, not hardcoded constants, so the sliders in `/settings` actually take effect.
* Rolling window implementation:** query `entities` joined to `reports.submitted_at`, grouped by `(entity_type IN (EQUIPMENT, LOCATION), value)`, filtered to `submitted_at >= now() - window_days`, `HAVING COUNT(DISTINCT report_id) >= min_events`. This is a straightforward indexed SQL query — no need for NetworkX traversal here, though the *result* is also reflected as a red-bordered subgraph in the Cytoscape view.
* Duplicate handling:** if the same report is re-processed (e.g., retry after failure), it must not double-count toward the cluster threshold — dedupe by `report_id` in the `COUNT(DISTINCT ...)`.
* Escalation:** when a cluster fires, every `report_id` in the cluster has its `sif_label` set to `HIGH` (the PRD explicitly says "regardless of individual SIF scores") — but the **original `sif_score` is preserved**, not overwritten, so the audit trail shows both the raw score and the reason for escalation (cluster override). Store the override reason (e.g., `escalated_by_cluster: alert_id`) — **Recommended Addition**, needed for explainability (AI-context guide Section 19).
* Alert record:** insert into `systemic_alerts` with `event_count`, `window_days`, `report_ids`, `status=ACTIVE`.
* Frontend delivery:** `cluster.created` WebSocket event → Triage Queue re-sorts, Graph page shows pulsing red border, HSE Manager gets a visible alert.

# 19. MCP Architecture

MCP is not an AI model — it is a standardized calling convention so LangGraph agents invoke reusable, testable functions instead of embedding SQL/graph/PDF code inline. Relationship:

LangGraph Agent → MCP Tool (thin wrapper) → backend/services/* → Database / Graph / Document Generator

| Tool | Params | Returns | Underlying service | Called by | On error |
| --- | --- | --- | --- | --- | --- |
| `query_past_incidents` | `equipment_id: str, days: int = 7` | JSON list of past incidents | `graph_service` / `report_service` | Agent #4 | returns empty list, logs warning — never blocks the pipeline |
| `lookup_iogp_rule` | `rule_name: str` | rule definition + examples + barriers | `data/iogp_rules.json` lookup | Agent #5 | returns null, Explainer degrades to un-grounded generic phrasing flagged as `ungrounded=true` |
| `detect_graph_clusters` | `location: str, window_days: int = 7, min_events: int = 3` | connected subgraphs meeting threshold | `cluster_service` | Agent #4 | returns `no_cluster`, treated as non-fatal |
| `generate_pdf` | `doc_type, report_id, site, shift` | file path/URL | `document_service` | Agent #6 | CAPA record still created; PDF status marked `FAILED`, retryable from UI |

Security consideration: MCP tools run in-process and trust the calling agent; input validation (e.g., report_id existence, days bounds) must still happen inside each tool — MCP is not itself a security boundary.

# 20. CAPA System (Layer 3)

## 20.1 Trigger Conditions

* A 🔴 HIGH report is confirmed (either by AI score ≥0.75 or officer UPGRADE), **or**
* A Systemic Risk Cluster is detected.

## 20.2 Work Order Fields (PRD Section 4, F11)

Incident ID, Priority (CRITICAL/HIGH/ROUTINE), Assigned Role, Due Date (auto-computed), Verification Checklist (3–5 items).

## 20.3 SLA Rules (PRD-specified, unchanged)

CRITICAL → due_date = created_at + 4 hours
HIGH     → due_date = created_at + 24 hours
ROUTINE  → due_date = created_at + 7 days

This calculation is pure deterministic business logic in capa_service.py — no AI involvement.

## 20.4 Status Lifecycle

OPEN → IN_PROGRESS → PENDING_VERIFICATION → CLOSED. Transitions are validated server-side (no skipping states, no reopening a CLOSED action without an explicit reopen action — Recommended Addition for audit integrity).

## 20.5 What is AI-assisted vs. deterministic

* Deterministic:** priority assignment, SLA due-date math, status transitions, checklist template selection.
* AI-assisted (optional):** verification checklist *content* could be phrased by the Explainer LLM using the same grounded context (barrier failure + energy source) — this is an **Optional Implementation Choice**, not required; a static checklist template per LSR rule is sufficient and safer (less hallucination risk) for the SIH build.

# 21. Human-in-the-Loop Feedback

* Actions:** `AGREE`, `UPGRADE`, `DOWNGRADE` buttons next to every SIF classification (F10).
* API:** `POST /api/reports/{id}/feedback` with `{corrected_label, reason?, officer_id}`.
* Storage:** `feedback_log` — `original_label` (from `reports.sif_label` at time of feedback) vs. `corrected_label`, plus `reason`, `officer_id`, `timestamp`.
* Critical rule (AI-context guide Section 13):** feedback is **appended**, never used to silently rewrite `reports.sif_label` retroactively. The report's displayed label can be updated to reflect the officer's correction (so the queue reflects reality), but the **original AI output remains in the audit trail** via `feedback_log.original_label`.
* Model Agreement Rate:** `% of feedback where corrected_label == original_label`, computed over the last 50/100/500 reviews — a straightforward SQL aggregate in `analytics_service.py`, displayed both on `/settings` and as an analytics trend line.
* No automatic retraining.** The PRD explicitly lists this as a "Future" item (Section F10) — do not implement or claim automatic threshold/anchor retraining. Feedback data should simply be queryable for a future offline analysis.

# 22. Realtime Architecture — **Recommended Addition**

The PRD implies live updates (F8: "New reports appear at top as they are ingested") but doesn't specify a transport. Recommended: FastAPI native WebSocket at /ws/reports.

Events:

report.processing    { report_id }
report.completed     { report_id, sif_label, sif_score }
risk.detected         { report_id, sif_label }
cluster.created        { alert_id, cluster_node, report_ids }
capa.created             { action_id, report_id, priority }
action.updated             { action_id, status }

Frontend subscribes via hooks/useWebSocket.ts; on disconnect, exponential-backoff reconnect (1s → 2s → 4s → cap 30s), and a visible "Reconnecting…" indicator rather than silent data staleness. If WebSocket is unavailable in a constrained deployment, the Triage Queue should fall back to short-interval polling (e.g., 5s) — this fallback should be built in from day one so the demo is not fragile to network quirks.

# 23. Document Generation

## 23.1 Shift Handover Briefing (F12)

Input: {site, shift_type}. Output: 1-page PDF — header/branding, top 3 active risk areas, new SIF precursors since last handover (12h), active CAPA with SLA countdown, mandatory TBT checklist. Renderer: ReportLab.

## 23.2 Safety Intervention Dossier (F13)

Input: {report_id}. Output: multi-page PDF — summary+classification, entity table, LSR citation, graph context (related incidents), recommended actions + checklist.

## 23.3 Bow-Tie Model (F14)

Auto-generated for any HIGH-SIF report: Mermaid.js diagram with threats (left), top event (center), consequences (right), and barrier present/broken indicators — rendered client-side in the Inspector (Screen 7), and rasterized/embedded server-side when included in the dossier PDF.

Design rule (AI-context guide Section 12): the document layer only formats already-computed data. No LLM call, no re-classification, no new entity extraction happens inside documents/.

# 24. Multimodal Field Reporting (Voice + Direct Text Fallback)

Browser MediaRecorder (WebM/WAV)
  → POST /api/voice/transcribe
  → Whisper (online: Groq Whisper API | offline: local whisper-small, 461MB)
  → {transcribed_text, language}
  → user reviews/edits transcript in UI
  → POST /api/reports/ingest {text: transcript, source: "voice"}
  → normal 5-stage pipeline (no separate voice-specific intelligence)

Languages: English, Hindi, Assamese, Bengali (PRD-specified). Error handling: unsupported audio format → 400 with a clear message; transcription failure → UI allows manual text fallback rather than blocking submission. Max recording duration: Recommended Addition — cap at ~2 minutes to bound Whisper latency and keep the field-worker UX snappy.

# 25. Air-Gapped Architecture

Two modes, switched centrally in `backend/config`:

|  | Online Development Mode | Offline / Air-Gapped Mode |
| --- | --- | --- |
| Embeddings | `multilingual-e5-small (supports Hindi, Assamese, English)` (always local — same in both modes) | same |
| NER | GLiNER/spaCy (always local) | same |
| Explainer LLM | Groq API | Ollama `llama3.1:8b` |
| Voice STT | Groq Whisper API | local `whisper-small` |
| DB | SQLite/PostgreSQL (always local) | same |
| Graph | NetworkX (always local) | same |
| PDF gen | ReportLab (always local) | same |

Note that embeddings, NER, DB, graph, and PDF generation are already local in both modes — only the Explainer LLM and voice STT actually call an external API, so "air-gapped mode" is really just those two provider swaps plus the network monitor being on.

PRD Ambiguity / Recommended Clarification: the PRD's Air-Gap Integrity Monitor (F16) is described as "Zero-Egress Proof," and the demo strategy (Section 17.1) says "this runs on a single laptop without internet." psutil observing active sockets is an application-level monitor of this process's outbound connections — it demonstrates that SANKET · AI itself made zero external calls during processing; it does not and cannot mathematically prove the physical machine or network is isolated (the OS or other processes could still have connectivity). The AI-context guide explicitly makes this same distinction (Section 14, Section 25). Recommendation: phrase the demo claim and the UI copy as "SANKET · AI made zero outbound connections during this run" rather than "this machine is air-gapped."

# 26. Authentication & Security

## 26.1 Roles (PRD Section 19, unchanged)

| Role | Access |
| --- | --- |
| Admin | full — including `/settings`, mode switching |
| HSE Manager | triage + analytics + graph + briefing/dossier + CAPA + feedback |
| Site Officer | triage + feedback + CAPA (no analytics-level aggregate access required, but not prohibited either — team should confirm) |
| Field Worker | Worker Portal: Voice + Quick Text entry (`/voice`) |

## 26.2 Implementation

JWT-based session (backend/auth/), require_role([...]) FastAPI dependency on every route per the table in Section 9. Passwords hashed (bcrypt/argon2). No secrets in source — all via .env (Section 34).

## 26.3 Other safeguards

Input validation on every ingest endpoint (max text length, CSV/JSON schema validation, max batch size 500 per PRD F1); file-upload MIME/type checks for CSV/JSON/audio; audit logging on every classification, feedback, and CAPA state change with user_id + timestamp (PRD Section 19); no cloud storage for data at rest — OS-level disk encryption assumed, not implemented by the app itself.

# 27. Data Strategy

* Synthetic dataset:** 500 reports generated by `scripts/generate_synthetic_data.py`, distribution per PRD Section 14.2 (Drilling 80, Pipeline 70, Refinery 60, Electrical 50, Working at Height 50, Confined Space 40, Vehicle 40, PPE 40, Housekeeping 70), HIGH 20% / MEDIUM 30% / LOW 50%.
* Seeded clusters (for demo):** Cluster A — Well Pad 7, 3 oil-leak reports on Days 1/3/5; Cluster B — Compressor C-02, 4 vibration/noise reports on Days 2/4/5/6. These must be present verbatim in the demo dataset so F7's Near-Miss Multiplier fires reliably during the live demo.
* SIF Anchor Library:** 50 canonical entries in `data/sif_anchor_library.json`.
* IOGP reference:** 9 rules in `data/iogp_rules.json`.
* Evaluation dataset:** a **separate**, held-out labeled set (100 reports for SIF recall/precision, 50 for LSR accuracy, 50 for entity F1, per PRD Section 18.2) stored in `data/eval/` and **never** mixed into `data/synthetic/` or used to author anchors — this separation is required so accuracy numbers are meaningful rather than circular.

# 28. Analytics

| Metric | Source |
| --- | --- |
| Total Reports | `COUNT(*) FROM reports` |
| HIGH Count | `COUNT(*) FROM reports WHERE sif_label='HIGH'` |
| Active Clusters | `COUNT(*) FROM systemic_alerts WHERE status='ACTIVE'` |
| Model Agreement Rate | `feedback_log`: `% WHERE corrected_label = original_label` over last N |
| SIF Density over time | `reports` grouped by day/week, `sif_score` |
| Risk by LSR category | `lsr_tags` grouped by `rule_name` |
| Day vs Night shift risk | `entities` (SHIFT_TIME) joined to `reports.sif_label` |
| Top 5 riskiest locations | `entities` (LOCATION) joined to `reports.sif_label`, ranked |

All aggregation is plain SQL in analytics_service.py — no AI involved in Section 28 at all.

# 29. End-to-End Data Flows

### Workflow 1 — Manual Report

User → Frontend (submit form) → POST /api/reports/ingest → reports row (PENDING)
     → worker enqueued → LangGraph pipeline (Agents 0-6) → DB updated (COMPLETED)
     → graph updated → cluster check → WebSocket report.completed → Frontend row updates

### Workflow 2 — Batch Upload (CSV/JSON, up to 500)

User uploads file → validated row-by-row → valid rows → reports (PENDING) x N
     → worker pool processes each report through the pipeline independently
     → one row's failure does not block others → status per row visible in queue
     → batch summary: "487/500 processed successfully, 13 failed validation"

### Workflow 3 — Voice Report

Field worker records → POST /api/voice/transcribe → Whisper → transcript shown
     → worker edits/confirms → POST /api/reports/ingest (source=voice) → Workflow 1

### Workflow 4 — Systemic Risk Detection

Report N processed → Agent #4 updates graph → SQL rolling-window query
     → >=3 events at same node in 7 days → systemic_alerts row created
     → ALL connected reports' sif_label → HIGH (score preserved, override logged)
     → WebSocket cluster.created → Graph page shows red pulse, Queue re-sorts
     → Agent #6 (CAPA) triggers automatically

### Workflow 5 — CAPA Creation

HIGH report confirmed OR cluster fires → Agent #6 / capa_service
     → priority determined → SLA due_date computed → actions row (OPEN)
     → WebSocket capa.created → Inspector shows Action Panel populated

### Workflow 6 — Human Feedback

Officer clicks UPGRADE/DOWNGRADE/AGREE → reason (optional) → POST .../feedback
     → feedback_log row inserted → reports.sif_label updated (if corrected)
     → agreement_rate recomputed → /settings + /analytics reflect new value

### Workflow 7 — PDF Generation

User requests briefing/dossier → API reads structured DB data (reports, actions,
graph neighbors) → MCP generate_pdf → document_service (ReportLab) → file saved
     → {pdf_url} returned → react-pdf preview in browser → Download button

# 30. Error Handling

| Failure | Behavior |
| --- | --- |
| AI model fails to load | pipeline stage returns a safe default (e.g., empty entities), report still saved, `stage_errors` logged per report |
| Ollama unavailable (offline mode) | explanation left null, retry queued; report still visible with SIF score/entities/LSR intact |
| Groq unavailable (online mode) | same as above; does **not** silently switch to Ollama (Section 15) |
| GLiNER fails | falls back to spaCy NER automatically |
| Database fails | request returns 503; background worker retries with backoff; no data loss for already-committed reports |
| Graph update fails | report still marked COMPLETED for its Layer-1 result; flagged `graph_sync_pending`; retried by a periodic reconciliation job |
| PDF generation fails | underlying report/CAPA data unaffected; document status `FAILED`, retryable from UI |
| Voice transcription fails | UI offers manual text entry instead of blocking the field worker |
| Malformed CSV row | that row is skipped and reported in the batch summary; the rest of the batch proceeds |
| Empty report text | rejected at ingestion (400), never enters the pipeline |
| WebSocket disconnects | client auto-reconnects with backoff; UI shows "Reconnecting…"; REST remains fully functional meanwhile |
| MCP tool fails | agent treats it as a soft failure (see Section 19 table) and the pipeline continues |
| One report fails in a batch of 500 | isolated per-report try/catch in the worker; batch continues; failed report status = `FAILED` with an error reason, visible and re-triable from the queue |

Report status values used throughout: PENDING → PROCESSING → COMPLETED | FAILED.

# 31. Performance

PRD-stated targets (do not exceed claims beyond these):

* Batch ingestion: 200+ reports processed in < 10 seconds (PRD Section 1, Executive Summary).
* Phase 4 target explicitly says < 5 seconds for 200 reports (PRD Section 15, Phase 4, P4.4).

PRD Ambiguity / Recommended Clarification: the Executive Summary states "< 10 seconds" while the Phase 4 performance task states "< 5 seconds" for the same 200-report benchmark. This is a direct conflict in the source PRD. Recommendation: treat < 10 seconds as the committed/tested target (matches Section 1 and the demo script's "2.8 seconds" example in Section 17.1), and treat < 5 seconds as a stretch goal for Phase 4 polish — do not present both numbers as equally guaranteed in the demo.

Enablers: precomputed anchor/rule embeddings (Section 12, 14), async background workers so ingestion returns immediately, DB indexes per Section 10, batched embedding calls (encode all 200 report texts in one batched call to multilingual-e5-small (supports Hindi, Assamese, English) rather than one-by-one), WebSocket push instead of dashboard polling.

# 32. Testing Strategy

### Unit

SIF classifier (score math, clamping, keyword boost), entity extractor (label coverage), LSR mapper (threshold behavior), graph clustering (rolling-window edge cases: exactly 3 events, events just outside the window), CAPA SLA math (boundary at exactly 4h/24h/7d), preprocessing (mojibake, empty text).

### Integration

API endpoint contract tests (httpx + pytest-asyncio) for all endpoints in Section 9; full pipeline run against a fixed input producing a deterministic (non-LLM) partial result; MCP tool invocation tests against a seeded DB/graph.

### End-to-End

Submit report → AI processing → appears in Triage Queue → SIF/LSR/entities correct
  → risk shown in Inspector → CAPA created for HIGH → PDF generated → feedback
  submitted → agreement rate updates

Recommended tooling: Playwright or Cypress against a running dev stack.

### AI Evaluation

Run against data/eval/ (never data/synthetic/): SIF recall/precision on the 100-report labeled set, LSR accuracy on the 50-report set, entity F1 on the 50-report annotated set — exactly the PRD Section 18.2 targets, reported as measured, not assumed.

# 33. Implementation Roadmap (PRD 4 Phases, expanded)

## Phase 1 — Core MVP (Days 1–4)

| Task | Description | Features | Depends on |
| --- | --- | --- | --- |
| P1.1 | Scaffolding: FastAPI + Next.js + SQLite | — | — |
| P1.2 | DB models + migrations (7 tables + `users`) | — | P1.1 |
| P1.3 | Synthetic data generator (500 reports + 2 clusters) | — | P1.2 |
| P1.4 | Stage 1 + Stage 2 (preprocessing + SIF classifier + anchor library) | F1, F2 | P1.2 |
| P1.5 | Ingestion API (text + CSV) | F1 | P1.4 |
| P1.6 | Report list API + filters | F8 | P1.2 |
| P1.7 | Triage Queue frontend | F8 | P1.6 |
| P1.8 | Basic report detail view | F9 (partial) | P1.5 |

Deliverable: upload 500 reports → ranked SIF dashboard.

## Phase 2 — Intelligence Layer (Days 5–8)

| Task | Description | Features |
| --- | --- | --- |
| P2.1 | Entity extraction (GLiNER + spaCy) | F3 |
| P2.2 | LSR mapping | F4 |
| P2.3 | LLM explainer (Groq/Ollama dual-mode) | F5 |
| P2.4 | Knowledge graph (NetworkX) | F6 |
| P2.5 | Near-Miss Multiplier | F7 |
| P2.6 | MCP tool server (4 tools) | MCP |
| P2.7 | LangGraph agent swarm wiring | Agents |
| P2.8 | Inspector frontend (entities, LSR, explanation) | F9 (complete) |
| P2.9 | Graph frontend (Cytoscape.js) | F6 |
| P2.10 | Feedback API + UI | F10 |

Deliverable: full pipeline running; graph shows clusters; entity highlighting works.

## Phase 3 — Output & Accessibility (Days 9–11)

Briefing PDF (F12), Dossier PDF (F13), Bow-Tie (F14), Voice (F15), Air-Gap Monitor (F16), CAPA dispatcher (F11), Analytics (F17), Energy Wheel (F18), plus corresponding frontend screens.

## Phase 4 — Demo Polish & Testing (Days 12–14)

Demo script rehearsal, seed data quality review, error/loading/empty states, performance tuning, README + Docker Compose, presentation prep, mock-judge dress rehearsal.

### Recommended dependency-aware build order note

The PRD's phase order is sound; the one adjustment worth calling out is that WebSocket/realtime (Section 22, a Recommended Addition) should be scaffolded in Phase 1 (even if only emitting report.completed) rather than bolted on later, since Phase 2–3 features (clusters, CAPA, feedback) all want to push realtime events and retrofitting a WebSocket layer late is more disruptive than building it thin and early.

# 34. Feature/Stage Ownership

Follow Section 33 of the provided ownership blueprint (Stages 1–13) exactly as specified — it is already implementation-ready and consistent with this document's architecture. Summary mapping for quick reference:

| Stage | Focus | Primary Layer(s) |
| --- | --- | --- |
| 1 | Foundation & shared infra | — |
| 2 | Report ingestion & management | pre-Layer 1 |
| 3 | Individual report intelligence | Layer 1 |
| 4 | LangGraph + MCP | Layer 1→2→3 orchestration |
| 5 | Knowledge graph & systemic risk | Layer 2 |
| 6 | CAPA & intervention | Layer 3 |
| 7 | Frontend command center | cross-cutting |
| 8 | Human-in-the-loop | Layer 1 feedback |
| 9 | Documents/briefings/dossiers | cross-cutting output |
| 10 | Voice-to-report | pre-Layer 1 alt. ingestion |
| 11 | Analytics & realtime | cross-cutting |
| 12 | Security, air-gap, deployment | cross-cutting |
| 13 | Integration, evaluation, demo | all |

## Six-Person Team Table

| Feature/Stage | Primary Ownership | Integration Partners |
| --- | --- | --- |
| Foundation (Stage 1) | Backend/DevOps | All |
| Report Ingestion (Stage 2) | Backend | Frontend, AI |
| Individual Intelligence (Stage 3) | AI/NLP | Backend, LangGraph |
| Agent Orchestration (Stage 4) | LangGraph/MCP | AI, Graph, CAPA |
| Systemic Intelligence (Stage 5) | Graph/Analytics | AI, Backend, Frontend |
| CAPA (Stage 6) | Backend/Workflow | Graph, Frontend |
| Frontend Workflows (Stage 7) | Frontend | Backend, AI, Graph |
| Documents (Stage 9) | Documents/Backend | CAPA, Graph, Frontend |
| Voice (Stage 10) | Frontend/AI | Ingestion, NLP |
| Security/Air-Gap (Stage 12) | Backend/DevOps | AI, Deployment |
| Integration/Evaluation (Stage 13) | Shared | Entire team |

# 35. Environment Setup

Required: Python 3.11+, Node.js 20+, Ollama (for offline mode testing), a Groq API key (online mode). Standard commands:

# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# MCP server
python mcp/server.py

# Ollama (offline mode)
ollama pull llama3.1:8b

# Tests
pytest tests/ -v
cd frontend && npm run build && npm run lint

## `.env.example`

# --- App mode ---
AI_MODE=online                  # online | airgapped

# --- Database ---
DATABASE_URL=sqlite+aiosqlite:///./vigil.db

# --- Auth ---
JWT_SECRET=changeme
JWT_EXPIRY_MINUTES=480

# --- Online providers (leave blank in airgapped mode) ---
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# --- Offline providers ---
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# --- Thresholds ---
SIF_HIGH_THRESHOLD=0.75
SIF_MEDIUM_THRESHOLD=0.50
LSR_SIMILARITY_THRESHOLD=0.45
CLUSTER_WINDOW_DAYS=7
CLUSTER_MIN_EVENTS=3

Never commit a filled .env — GROQ_API_KEY and JWT_SECRET are the only true secrets in this system.

# 36. Docker & Deployment

Minimum viable docker-compose.yml services: frontend, backend, db (Postgres, for a demo that wants persistence beyond SQLite). ollama is optional — include it only if the target demo machine has enough RAM/CPU to run llama3.1:8b comfortably; otherwise document local (non-containerized) Ollama installation as the offline-mode path. Do not containerize every ML component separately (Rule 7) — the AI pipeline lives inside the backend container/process.

Development vs. demo: development can run backend/frontend natively for fast reload; the demo deployment should be docker-compose up reproducible from a clean checkout, per PRD Phase 4 (P4.6).

# 37. Architecture Decisions & Rationale

Why FastAPI? Async-native, auto-generated OpenAPI docs, first-class Pydantic validation — fits a Python-heavy AI stack without a separate API-gateway layer.

Why Next.js? App Router gives file-based routing across the 7 required screens with SSR available if needed for the demo; React ecosystem has first-class Cytoscape/Recharts/react-pdf support.

Why SQLite initially, PostgreSQL later? Zero-config for hackathon iteration speed; PostgreSQL adds JSONB (used by graph_edges.report_ids, systemic_alerts.report_ids) and real concurrency for a production deployment — the SQLAlchemy abstraction makes this swap a config change, not a rewrite.

Why Sentence-Transformers (`multilingual-e5-small (supports Hindi, Assamese, English)`)? 80MB, CPU-friendly, 384-dim — small enough to run fully offline on a laptop while remaining accurate enough for anchor-similarity classification; this is the model that makes the air-gap story credible.

Why GLiNER? Zero-shot NER means the 8 custom industrial entity types (EQUIPMENT, BARRIER_FAILURE, etc.) don't require a labeled training set to bootstrap — critical given OIL's real data is confidential and unavailable for fine-tuning.

Why deterministic SIF scoring instead of an LLM? Reproducibility, speed at 200+ report batches, and auditability (a specific matched anchor is evidence; an LLM's internal reasoning is not) — see Section 12.

Why LangGraph? Gives explicit, typed, conditionally-routed state transitions across the 7 agents rather than an ad-hoc sequence of function calls — makes the "which agent ran, with what state" fully inspectable, which matters for debugging and for judge Q&A.

Why NetworkX? In-memory, pure-Python, sufficient scale for a hundreds-of-reports demo graph, no separate graph-database server to deploy or air-gap.

Why ChromaDB? Local-first vector store matching the anchor/rule-embedding caching need without external dependency — consistent with the air-gapped requirement.

Why MCP? Standardizes how agents call shared services (DB queries, PDF generation) so the same tool logic is reusable and independently testable, rather than duplicated inline in each agent.

Why WebSockets? Native to FastAPI, no extra broker needed for this scale, delivers the "reports appear live" UX the PRD implies without the complexity of a message queue.

Why asynchronous background processing? Ingestion must return immediately (especially for 500-report batches); the actual 5-stage pipeline runs off the request thread so the API stays responsive.

# 38. Scope Boundaries — What NOT to Build

Per PRD Section 12.1 design philosophy and AI-context guide Section 26, SANKET · AI is explicitly not:

* an autonomous oil-rig control system or IoT actuator,
* a replacement for HSE personnel — every consequential decision is human-reviewable,
* a system that guarantees zero accidents,
* a system that predicts the exact time of a future accident (Time Machine, FF5, is a *replay* of a known historical timeline, not a forecast),
* a general-purpose chatbot,
* a generic document summarizer unrelated to safety reports,
* built on microservices, Kubernetes, Kafka, or multiple databases — a modular monolith is the correct scope,
* an application where every agent calls an LLM — most of Layer 1 and all of Layer 2/3 are deterministic.

The 6 Future Features (FF1–FF6) in PRD Section 16 (audio briefing, WhatsApp/SMS alerts, GIS heatmap, SLA countdown escalation, Safety Karma gamification) are explicitly out of scope unless separately approved — do not build them speculatively.

# 39. PRD Ambiguities / Recommended Clarifications (consolidated)

1. **Performance target conflict** (Section 31): Executive Summary says < 10s for 200 reports; Phase 4 (P4.4) says < 5s. Treat 10s as the committed target, 5s as stretch.
1. **`graph_edges.report_ids` as JSON vs. normalized join table** (Section 10): kept as PRD-specified JSON column; documented as a known scaling limitation rather than silently redesigned.
1. **Air-Gap "Zero-Egress Proof" framing** (Section 25): `psutil` proves *this process* made no outbound calls, not physical network isolation of the whole machine. Recommend adjusting demo/UI language accordingly.
1. **No transport specified for "real-time" queue updates** (F8): resolved via Recommended Addition of WebSocket + polling fallback (Section 22).
1. **No `users`/auth table specified despite 4 named roles** (Section 19): resolved via Recommended Addition minimal `users` table + JWT (Section 10, 26).
1. **Entity value normalization not specified but required for clustering to work** (Section 23's clustering algorithm assumes exact node-label matches): resolved via Recommended Addition normalization step in entity extraction (Section 13).

# 40. Final Build Checklist

FRONTEND
[ ] App shell (layout, nav, AirGapStatus widget)
[ ] /  Triage Queue (F8)
[ ] /reports/[id]  Incident Inspector (F9)
[ ] /graph  Safety Signal Graph (F6)
[ ] /analytics  Analytics Dashboard (F17, F18)
[ ] /briefing  Shift Handover (F12)
[ ] /voice  Voice-to-Report (F15)
[ ] /settings  System Configuration (F16)
[ ] /login  Auth entry (Recommended Addition)
[ ] Reusable components (Section 7.3)

BACKEND
[ ] FastAPI scaffolding + routers per resource
[ ] Auth/RBAC (JWT + require_role)
[ ] Config (online/airgapped mode switch)
[ ] Background worker for pipeline triggering

DATABASE
[ ] 7 PRD tables + users table
[ ] Indexes per Section 10
[ ] Migrations (Alembic)

AI
[ ] Stage 1 Preprocessing
[ ] Stage 2 SIF Classifier + anchor library (F2)
[ ] Stage 3 Entity Extraction (F3)
[ ] Stage 4 LSR Mapping (F4)
[ ] Stage 5 LLM Explainer, dual-mode (F5)

GRAPH
[ ] NetworkX graph store + builder (F6)
[ ] Cytoscape serializer
[ ] Near-Miss Multiplier / clustering (F7)

LANGGRAPH
[ ] ReportState schema
[ ] 7 agents wired with conditional edges

MCP
[ ] query_past_incidents
[ ] lookup_iogp_rule
[ ] detect_graph_clusters
[ ] generate_pdf

CAPA
[ ] Work-order creation + SLA rules (F11)
[ ] Status lifecycle

DOCUMENTS
[ ] Shift briefing PDF (F12)
[ ] Safety dossier PDF (F13)
[ ] Bow-Tie diagram (F14)

VOICE
[ ] Recording + transcription (F15)

REALTIME
[ ] WebSocket events + reconnect logic

SECURITY
[ ] RBAC enforced on all routes
[ ] Input/upload validation
[ ] Audit logging

DATA
[ ] Synthetic 500-report generator + 2 seeded clusters
[ ] SIF anchor library (50) + IOGP rules (9)
[ ] Held-out evaluation dataset

TESTING
[ ] Unit tests (classifier, entities, LSR, clustering, CAPA)
[ ] Integration tests (API, pipeline, MCP)
[ ] E2E demo-path test
[ ] AI evaluation run against data/eval/

DEPLOYMENT
[ ] docker-compose (frontend, backend, db)
[ ] .env.example documented
[ ] README with setup steps

DEMO
[ ] 3-minute golden path rehearsed
[ ] Air-gap Wi-Fi-off demo verified
[ ] Judge Q&A answers prepared

# 41. Final Architecture Summary

### Repository Tree — see Section 6.

### High-Level Architecture — see Section 4.2.

### Layer Diagrams

LAYER 1                LAYER 2                  LAYER 3
Individual              Cross-Report /            CAPA /
Report Intelligence     Systemic Intelligence     Intervention
────────────────       ────────────────           ────────────────
SIF Score               Knowledge Graph            Work Order
Entities                Temporal Clusters          Priority/SLA
LSR Tags                Systemic Alerts            Assignment
Explanation                                        Verification/Closure

### End-to-End Data Flow — see Section 29 (Workflows 1–7).

### Technology Stack Table — see Section 5.

### Six-Person Team Table — see Section 34.

### Phase Roadmap — see Section 33.

Fundamental transformation SANKET · AI performs, restated:

RAW SAFETY DATA → INDIVIDUAL INTELLIGENCE → SYSTEMIC INTELLIGENCE → ACTIONABLE INTERVENTION

Every component built by the team should be traceable back to exactly one point in this chain.

# Implementation Traceability Matrix

Use this matrix as a quick navigation aid when converting the specification into repository work. The detailed requirements remain in the numbered sections above.

| Capability | PRD Feature | Primary Ownership | Specification Sections |
| --- | --- | --- | --- |
| Report ingestion & management | F1, F8 | Backend + Frontend | 2, 7, 8, 9, 29 |
| SIF classification | F2 | AI/NLP | 11–12 |
| Entity extraction | F3 | AI/NLP | 13 |
| IOGP LSR mapping | F4 | AI/NLP | 14 |
| Grounded explanation | F5 | AI/NLP + LangGraph | 15–16 |
| Safety Signal Graph | F6 | Graph + Frontend | 17 |
| Near-Miss Multiplier / systemic risk | F7 | Graph + Backend | 18 |
| Human feedback | F10 | Backend + Frontend | 21 |
| CAPA / intervention | F11 | Backend + Frontend | 20 |
| Briefing / dossier / Bow-Tie | F12–F14 | Documents + Frontend | 23 |
| Voice-to-report | F15 | AI + Frontend | 24 |
| Air-gap mode | F16 | Backend + AI + DevOps | 25 |
| Analytics / Energy Wheel | F17–F18 | Backend + Frontend | 28 |

# Document Quality Notes

* The document is organized as an implementation blueprint rather than a product overview.
* Mandatory PRD requirements remain distinguishable from recommended additions, assumptions, and ambiguities.
* Technical examples, folder structures, API contracts, tables, workflows, and checklists are retained from the provided specification.
* The table of contents is a live Word field. If a viewer does not refresh fields automatically, update the field once after opening the document.
* The specification should be treated as the team's implementation baseline; code-level decisions should remain traceable to the relevant section rather than being invented independently.