# SANKET AI — Final Master Project Reference

**Project:** SANKET AI  
**SIH Problem Statement:** SIH26165  
**Domain:** Industrial Safety / Upstream Oil & Gas  
**Primary Context:** Oil India Limited / upstream operations  
**Document purpose:** Single source of truth for team understanding, presentation, technical explanation, viva preparation, and future documentation.

> **Truth principle:** This document separates what the current prototype actually implements from what the project specifications intend and what belongs to a future production deployment. Claims about current functionality should be made only at the level supported by the implementation audit.

---

# 1. Executive Overview

SANKET AI is an edge-oriented safety-intelligence platform designed to turn fragmented safety observations into structured and actionable **Serious Injury & Fatality (SIF) precursor intelligence**.

The underlying problem is that safety observations are often treated as isolated records. A single observation may appear minor, while several observations involving the same equipment, location, activity, or barrier can collectively indicate deteriorating safety conditions.

The project is aligned with three core outcomes described in the project PRD:

1. Classify unstructured unsafe-act/unsafe-condition and near-miss narratives by SIF potential.
2. Automatically map observations to the 9 IOGP Life-Saving Rules.
3. Surface recurring precursor patterns across locations, activities, and barrier failures so that sites/activities can be prioritized by SIF-precursor density. fileciteturn10file2

The conceptual product flow is:

```text
FIELD OBSERVATION
       ↓
INGESTION
       ↓
INDIVIDUAL SAFETY INTELLIGENCE
       ↓
CROSS-REPORT / SYSTEMIC INTELLIGENCE
       ↓
HUMAN INVESTIGATION
       ↓
ACTION / CAPA
       ↓
CLOSURE & LEARNING
```

A useful one-sentence explanation is:

> **SANKET turns fragmented safety observations into individual SIF intelligence, connects them into systemic patterns, and helps HSE teams act before a precursor becomes an incident.** fileciteturn10file3

---

# 2. The Problem SANKET Solves

## 2.1 Traditional safety reporting problem

A conventional safety system may contain large numbers of reports:

- unsafe acts;
- unsafe conditions;
- near misses;
- maintenance observations;
- incident records;
- field communications.

Most observations are low severity. The important question is not simply:

> "How many incidents occurred?"

but:

> "Which observations indicate that a serious or fatal event was realistically possible?"

The project materials use the DEKRA-style distinction:

| Classification | Meaning |
|---|---|
| **SIF Actual (SIFa)** | A fatality or life-altering injury occurred. |
| **SIF Potential / Precursor (SIFp)** | A high-energy hazard exists together with a missing or failed barrier, while a serious outcome was avoided. |
| **Non-SIF** | No realistic fatal escalation path is present. |

The important insight is that low-consequence observations can still be valuable if they repeatedly point toward the same deteriorating barrier or system.

## 2.2 The systemic-risk problem

Consider:

```text
Monday
Valve weep

Wednesday
Gauge abnormality

Friday
Isolation issue
```

Individually, each may receive limited attention.

If the observations repeatedly involve the same location/equipment/barrier, the combined pattern may be more important than any individual report.

SANKET therefore has two levels of intelligence:

```text
ONE REPORT
"What happened and how serious could it be?"

MANY REPORTS
"Is there a recurring pattern that deserves investigation?"
```

## 2.3 CAPA closes the loop

Identifying a risk is not enough.

Someone must:

- investigate it;
- decide what should be done;
- assign responsibility;
- establish a deadline;
- verify completion;
- record the outcome.

This is the purpose of **CAPA — Corrective and Preventive Action**.

The system is intended as decision support for HSE personnel, not as a replacement for accountable safety officers. The project materials explicitly emphasize human review for high-stakes decisions. fileciteturn10file0

---

# 3. Who Uses SANKET?

| User | Main need | Main view |
|---|---|---|
| Frontline worker | Report a hazard quickly | Field Reporter |
| Shift in-charge / process safety engineer | Understand active operational risk | DCS Control Room |
| HSE officer / rig superintendent | Prioritize and investigate observations | Triage Queue + Incident Inspector |
| Process-safety / reliability investigator | Find recurring relationships | Signal Graph |
| Regional HSE / fleet manager | Understand spatial concentration | SIF Heatmap + Analytics |
| Emergency commander | Coordinate response | Emergency Playbook |
| Management / training / audit audience | Understand historical patterns | Baghjan Replay + Briefing |

This role-to-feature mapping is part of the team's existing explanation framework. fileciteturn10file4

---

# 4. Application at a Glance

The product can be understood as:

```text
FIELD REPORTER
      ↓
TRIAGE QUEUE
      ↓
INDIVIDUAL INTELLIGENCE
      ↓
DCS CONTROL ROOM
      ↓
SIGNAL GRAPH + TEMPORAL PATTERNS
      ↓
SIF HEATMAP / ANALYTICS
      ↓
EMERGENCY PLAYBOOK + CAPA
      ↓
HUMAN REVIEW + CLOSURE
```

Supporting capabilities include:

- Baghjan Replay;
- Shift Briefing;
- document generation;
- system controls;
- local/offline architecture;
- intended RoIP integration.

The key product idea is therefore not a collection of dashboards. It is a pipeline from **field signal → intelligence → systemic understanding → action**.

---

# 5. Current Verified System Architecture

## 5.1 Technology stack

### Backend

- FastAPI
- Python
- SQLAlchemy
- PostgreSQL in the intended/check-in configuration
- SQLite is also used in the local Compose configuration
- asynchronous database tooling

### Frontend

- Next.js
- React
- TailwindCSS
- dashboard-oriented application routes

### AI / NLP

- `intfloat/multilingual-e5-small`
- Sentence Transformers
- Whisper
- deterministic regex/keyword processing
- local Ollama or cloud LLM providers

### Graph / Analytics

- NetworkX
- SQL-based temporal clustering

### Orchestration / tooling

- LangGraph exists in the repository as an intended orchestration layer.
- FastMCP is included in the project dependencies/specification.
- The current active report path does **not** execute the LangGraph swarm.

The repository deep analysis describes the project as a modular monolith rather than a distributed microservice architecture. fileciteturn10file1

---

# 6. Active Report Processing Pipeline

The current active report path is procedural.

```text
POST /api/reports/ingest
        ↓
Raw report text
        ↓
1. Preprocessing
        ↓
2. SIF semantic scoring
        ↓
3. Deterministic safety guardrails
        ↓
4. Pattern/keyword entity extraction
        ↓
5. IOGP semantic matching
        ↓
6. LLM explanation when applicable
        ↓
7. Persistence
```

The audit checkpoint describes the active worker as `backend/workers/pipeline_worker.py`. The current implementation should therefore be explained as a **procedural hybrid NLP pipeline**, not as an actively executing multi-agent swarm.

The technical specification describes a broader three-layer product model:

```text
Layer 1 — Individual Report Intelligence
Layer 2 — Cross-Report / Systemic Intelligence
Layer 3 — CAPA / Intervention
```

Layer 2 is intended to consume structured output from Layer 1, while Layer 3 consumes individual and systemic intelligence. fileciteturn10file13

---

# 7. Individual Report Intelligence

## 7.1 Preprocessing

### Purpose

Clean and normalize the incoming observation before downstream analysis.

### Current implementation

The audit identifies:

- Unicode normalization;
- regex cleanup;
- language detection using `langdetect`.

### Why it exists

Safety observations can contain inconsistent formatting, spelling, punctuation, or multiple languages. Normalization makes later semantic comparison more reliable.

---

# 8. SIF Semantic Embedding Classifier

## Purpose

The classifier estimates how strongly an observation resembles known SIF precursor patterns.

## Current implementation

The verified implementation uses:

```text
intfloat/multilingual-e5-small
```

with:

- 384-dimensional embeddings;
- 50 preconfigured SIF anchor vectors;
- cosine/dot-product similarity;
- keyword/negation-aware scoring logic.

The project PRD specifies thresholds of:

| Semantic risk score | Label |
|---:|---|
| `>= 0.75` | HIGH |
| `0.50–0.74` | MEDIUM |
| `< 0.50` | LOW |

The final presentation should call the resulting value a:

> **Semantic SIF Risk Score**

or

> **Semantic Similarity Score**

It should **not** be described as a calibrated probability or statistical confidence unless a probabilistic calibration layer is actually added.

## Why embeddings?

A keyword-only system can miss semantically similar wording.

For example:

```text
"pressure escaping from the blowout preventer"
```

and

```text
"high-pressure leakage observed around the BOP"
```

may use different words while describing related conditions.

Embeddings provide semantic similarity rather than relying exclusively on exact word matches.

## SIF anchors

The classifier compares the report against a curated library of 50 SIF precursor examples/anchors. The anchor-based approach provides an interpretable reference set rather than requiring a large end-to-end supervised classifier.

### Important limitation

The anchor approach still requires rigorous evaluation against independently labeled observations. Similarity to an anchor is not itself proof that the observation belongs to a true SIF class.

---

# 9. Deterministic Safety Guardrails

This is one of the most important technical distinctions in the final project explanation.

The current implementation contains regex-based safety rules that can adjust semantic scoring based on explicit safety indicators.

Examples include categories such as:

- high pressure;
- critical barrier failures;
- toxic/flammable gas;
- high-energy mechanical conditions;
- explicitly safe/routine contexts.

A critical condition can impose a score floor, while explicitly safe language can impose a ceiling.

## Correct terminology

Use:

> **Deterministic Safety Guardrails**

or

> **Heuristic Safety Rules Engine**

Avoid claiming:

- physics-informed neural network;
- physics-informed AI;
- neuro-symbolic neural architecture.

The current rules are deterministic text-pattern rules. They are valuable as guardrails, but they are not a physics simulator embedded inside the neural model.

## Why guardrails?

The embedding model provides semantic evidence.

The rules provide explicit safety constraints.

Conceptually:

```text
Semantic evidence
       +
Deterministic safety rules
       ↓
More controlled risk assessment
```

This makes the system easier to audit than allowing an LLM to make the primary safety classification.

## Limitation

The rules are brittle if they depend on exact wording.

A differently phrased observation can fail to trigger a rule.

Therefore future improvement should include broader normalization, richer domain patterns, and independent evaluation.

---

# 10. Entity Extraction

## Purpose

Extract structured information from an unstructured safety observation.

Examples:

- equipment;
- location;
- barrier;
- energy source;
- shift/time;
- weather;
- other industrial context.

## Current implementation

The audit verified that the active extractor uses:

- regular expressions;
- keyword lists;
- deterministic pattern matching.

It is **not** currently a neural or zero-shot NER implementation.

### Correct presentation wording

> **Domain-specific deterministic entity extraction using regex patterns and industrial keyword dictionaries.**

Do not claim:

> "GLiNER zero-shot NER"

or

> "spaCy neural NER"

for the current implementation.

## Why use deterministic extraction?

For a focused industrial vocabulary, explicit patterns are:

- easy to inspect;
- easy to debug;
- predictable;
- inexpensive;
- usable offline.

## Limitation

Unknown or newly named equipment can be missed.

A production version could combine:

```text
Domain rules
+
NER model
+
Entity normalization
+
Canonical entity registry
```

---

# 11. IOGP Life-Saving Rule Mapping

## Purpose

Map a report to relevant **IOGP Life-Saving Rules (LSRs)**.

The project specification describes 9 rules.

## Current implementation

The audit identifies semantic similarity matching using the same multilingual embedding model against pre-embedded rule representations, with a configured threshold.

Therefore the safest terminology is:

> **Semantic Similarity Matching for IOGP Life-Saving Rules**

rather than calling it a conventional supervised classifier.

## Why it exists

The mapping gives the safety officer a recognized safety-rule context without requiring them to manually interpret every narrative.

---

# 12. LLM Explanation

## Purpose

The LLM is a downstream explanation component.

It is **not the primary SIF classifier**.

The current pipeline first obtains the semantic risk assessment and then, for sufficiently high-scoring reports, requests a short grounded explanation.

The intended explanation is concise and tied to the information in the report.

## Model status

The repository audit found the project configured around:

- local `llama3.1:8b` through Ollama;
- cloud alternatives such as GPT-4o/Groq depending on configuration.

The current development environment may use:

> **Qwen3:8B through Ollama**

but this must not be described as the repository's original or verified primary classifier.

## What Qwen3:8B does

When configured as the local LLM, Qwen3:8B is appropriate for:

- short grounded explanations;
- structured prompt following;
- local/offline generation.

It is not responsible for:

- primary SIF scoring;
- graph clustering;
- database aggregation;
- deterministic safety rules.

This separation is important:

```text
Embedding model
    ↓
SIF semantic risk score

Safety rules
    ↓
Guardrail reconciliation

LLM
    ↓
Human-readable explanation
```

---

# 13. Voice / Speech-to-Text

## Purpose

Allow observations to originate as speech rather than typed text.

The intended production architecture is particularly relevant to field environments where consumer smartphones may be unsuitable or prohibited.

## Current implementation status

The audit distinguishes two things:

### Voice backend capability

A separate Whisper-based backend path exists.

### Visible Field Reporter

The current repository audit identifies the visible Field Reporter as having integration gaps and/or simulator behavior rather than a fully implemented radio-connected field system.

Therefore the final presentation must distinguish:

```text
Voice / transcription software capability
```

from:

```text
Real radio/RoIP field deployment
```

## Whisper

The project can use:

- local Whisper;
- or an online transcription provider when configured.

The desired architecture is:

```text
Audio
 ↓
ASR / Whisper
 ↓
Transcript
 ↓
Review where required
 ↓
Canonical report ingestion
 ↓
Existing SANKET intelligence pipeline
```

## Safety requirement

A failed transcription should **never become fabricated evidence**.

The Field Reporter specification explicitly requires that ASR failure never create fabricated transcripts. fileciteturn9file5

---

# 14. Field Reporter and RoIP Architecture

## Product purpose

The Field Reporter solves a practical field constraint:

> Workers need a fast way to report hazards, but conventional consumer smartphones may not be appropriate in hazardous process areas.

The intended architecture is:

```text
WORKER
   ↓
APPROVED PTT / FIELD DEVICE
   ↓
SITE RADIO SYSTEM
   ↓
RoIP / RADIO-IP GATEWAY
   ↓
SITE NETWORK
   ↓
SANKET EDGE INGESTION
   ↓
AUDIO
   ↓
ASR
   ↓
FIELD OBSERVATION
   ↓
SANKET REPORT PIPELINE
   ↓
SIF + ENTITIES + LSR + EXPLANATION
   ↓
SYSTEMIC INTELLIGENCE
   ↓
HSE INVESTIGATION / CAPA
```

The Field Reporter specification explicitly separates the radio layer from the SANKET intelligence layer and recommends an adapter boundary for future real RoIP integrations. fileciteturn9file2

## What is the RoIP gateway?

**RoIP = Radio over IP.**

The gateway is the boundary between:

```text
Radio / PTT world
```

and:

```text
IP / software world
```

SANKET should not contain vendor-specific radio logic.

A real deployment would require the target radio system, gateway interface, available metadata, authentication and site governance to be known first.

## Current status

The safest status model is:

| Capability | Status |
|---|---|
| Voice/transcription backend capability | Implemented |
| Field Reporter UI/demo | Partially implemented / simulator aspects |
| Canonical voice-to-report integration | Requires verification/fixes |
| RoIP gateway | Specified / intended |
| Vendor-specific radio integration | Future |
| Certified hazardous-area hardware | External production requirement |

The Field Reporter specification itself describes the real RoIP implementation as a proposed architecture and recommends implementing a simulator before requiring real hardware. fileciteturn9file4

---

# 15. Triage Queue

**Route:** `/dashboard`

## What it is

The central safety-observation inbox.

## Why it exists

A site can generate many observations. Treating every observation equally makes investigation inefficient.

The Triage Queue prioritizes attention around higher-potential observations.

## Typical information

- total reports;
- SIF severity;
- search/filter controls;
- IOGP rule;
- asset/location;
- timestamp;
- lifecycle/status.

## Key implementation

The current audit identifies this as one of the more substantially wired parts of the application, backed by report persistence and the active NLP pipeline.

### Presentation line

> **"The Triage Queue is where the safety officer starts. Instead of treating every observation equally, SANKET brings higher-potential signals to the front of the investigation queue."**

---

# 16. Incident Inspector and Human Review

## Purpose

A score alone is insufficient for a high-stakes safety decision.

The Incident Inspector provides the detailed context needed to investigate a report.

It can present:

- original narrative;
- SIF assessment;
- extracted entities;
- IOGP mapping;
- explanation;
- action history;
- human review.

## Human-in-the-loop

The project materials describe officer actions such as:

- AGREE;
- UPGRADE;
- DOWNGRADE.

The principle is:

```text
AI recommendation
       ↓
Evidence/context
       ↓
Authorized safety officer
       ↓
Confirm / override
       ↓
Auditable action
```

### Key statement

> **AI prioritizes and explains; the authorized safety officer remains responsible for validating the operational decision.**

---

# 17. DCS Control Room Live Wall

## Purpose

The DCS/control-room view is intended as a situational-awareness surface.

It is different from the Triage Queue:

- **Triage:** what should I investigate?
- **Control Room:** what is happening across the operation?

The project materials describe a live operational picture containing precursor feeds, fleet/site risk information and response controls.

## Current implementation caution

Do not imply that the prototype is directly connected to real industrial PLC/SCADA/DCS telemetry unless that integration has been separately implemented and tested.

The intended production architecture would require validated OT integration.

---

# 18. Safety Signal Knowledge Graph

## Purpose

The Signal Graph exists because a flat report table does not make relationships between recurring observations easy to see.

It is intended to connect entities such as:

- equipment;
- locations;
- barriers;
- energy sources;
- activities;
- safety rules;
- reports.

The intended user question is:

> **"What recurring relationships are hidden across many reports?"**

## Conceptual flow

```text
Report
  ↓
Structured entities
  ↓
Canonical entity identity
  ↓
Relationships
  ↓
Graph / systemic analysis
  ↓
Evidence-backed safety signal
```

## Important terminology

The graph should be described as showing:

> **relationships, recurring patterns and evidence**

rather than proving causality.

A correlation or co-occurrence does not automatically establish:

> "A caused B."

## Current implementation

The audit identifies:

- an in-memory NetworkX graph;
- graph serialization for visualization;
- graph lifecycle/persistence gaps;
- incomplete integration with the normal report worker.

The deeper code audit states that ordinary report ingestion currently does not reliably populate the production graph/systemic path, and graph state is not durably persisted. fileciteturn10file1

## Production direction

A stronger production implementation would:

- persist graph state or rebuild it reliably from structured database data;
- preserve evidence/provenance;
- canonicalize entities;
- prevent duplicate relationships;
- expose "why raised?" explanations;
- connect graph signals to underlying reports and investigation workflows.

The Signal Graph specification explicitly says the graph should be an evidence-first systemic investigation system rather than merely a node-link visualization. fileciteturn9file11

---

# 19. Near-Miss Multiplier / Temporal Systemic Detection

## Purpose

Detect repeated observations within a configured time window.

The project specification uses a conceptual threshold of:

```text
3 or more distinct reports
within 7 days
```

for a repeated entity/pattern.

## Why it exists

A single low-severity observation may not justify escalation.

Repeated independent observations can indicate deterioration.

```text
Observation 1
      +
Observation 2
      +
Observation 3
      ↓
Systemic signal
```

## Current implementation status

The SQL clustering logic exists, but the audit found that the normal report ingestion path does not currently execute the complete systemic escalation flow.

Therefore:

> The temporal clustering mechanism exists, but the end-to-end automatic systemic-alert path should not be presented as fully integrated unless it is subsequently wired and verified.

## Important limitation

Three reports do not automatically prove a common root cause.

The system should say:

> "These reports share a recurring relationship and warrant investigation."

It should not say:

> "These reports prove the root cause."

---

# 20. SIF Geo-Spatial Heatmap

## Purpose

The heatmap answers:

> **"Where is SIF-precursor risk concentrated?"**

This is especially useful for regional HSE management.

## Intended capability

The project specifications describe:

- site/activity risk density;
- asset/location context;
- spatial prioritization;
- geospatial layers;
- contextual environmental/process information.

The PRD explicitly identifies SIF-precursor density ranking as a headline outcome. fileciteturn10file9

## Current status

The audit distinguishes:

- live SQL-based matrix/aggregation data;
- static/simulated GIS points, radiuses and contextual map assets.

Therefore the team should not claim that every visible GIS layer represents live production telemetry.

### Presentation line

> **"The graph tells us what is connected; the heatmap tells us where risk is concentrated."**

---

# 21. Emergency Playbook and SWA

**SWA = Stop Work Authority.**

## Purpose

When a critical hazard is identified, the user needs a structured response process rather than an unorganized collection of information.

The prototype concept includes:

- critical hazard information;
- response checklist;
- emergency contacts;
- SWA workflow;
- communication/RoIP demonstration.

## Safety boundary

The prototype must not be presented as:

- a certified physical safety interlock;
- autonomous rig shutdown;
- a certified safety instrumented function.

Real physical control or e-PTW/DCS integration would require separate:

- hazard analysis;
- authorization;
- fail-safe engineering;
- OT integration;
- testing;
- certification/governance.

The Field Reporter specification explicitly maintains this boundary. fileciteturn9file6

## Current status

The audit identifies SWA triggering/UI behavior as partly wired while some location threats, contacts and checklists are static/demo data.

---

# 22. CAPA — Corrective and Preventive Action

## Purpose

CAPA turns identified risk into an accountable action.

A useful lifecycle is:

```text
Risk identified
      ↓
Investigation
      ↓
Corrective / preventive action
      ↓
Owner assigned
      ↓
Deadline
      ↓
Verification
      ↓
Closure
```

## Why it matters

Without CAPA:

```text
AI finds problem
      ↓
Human sees problem
      ↓
Nothing necessarily changes
```

With CAPA:

```text
AI finds problem
      ↓
Human validates
      ↓
Action assigned
      ↓
Action tracked
      ↓
Resolution verified
```

The technical specification places CAPA in the third functional layer: intervention/action. fileciteturn10file13

---

# 23. Baghjan 2020 Replay

## Purpose

The Baghjan Replay is a historical/counterfactual demonstration intended to show how precursor signals could be connected earlier.

The conceptual timeline in the project materials includes:

```text
Day -14 → mud loss
Day -10 → pressure anomaly
Day -6  → gas bubbling
Day -3  → barrier degradation
Day 0   → blowout
```

## Current implementation

The audit found that the visible replay is driven by static frontend data/state rather than a dynamically reconstructed backend historical dataset.

## Correct presentation

Say:

> **"The replay demonstrates how SANKET could have surfaced the precursor pattern earlier."**

Do not say:

> "SANKET mathematically proves it would have prevented the Baghjan disaster."

The replay is a **counterfactual demonstration**, not a controlled historical experiment. The existing team guide makes this distinction explicitly. fileciteturn10file8

---

# 24. Shift Briefing and Documents

## Shift Briefing

Converts safety intelligence into a compact handover for the incoming shift.

Useful information includes:

- important current risks;
- unresolved actions;
- priority observations;
- relevant systemic signals.

## Safety Intervention Dossier

The technical specification also describes report-centered evidence/action documentation.

## Bow-Tie representation

A structured view of:

```text
Threats
  ↓
Preventive barriers
  ↓
Top event
  ↓
Mitigating barriers
  ↓
Consequences
```

## Important design principle

PDFs and generated documents are **output layers**.

They should not become a second source of truth separate from the database/application state.

---

# 25. Local / Edge / Air-Gap-Oriented Operation

## Purpose

Industrial operational data may need to remain within a controlled local environment.

The intended architecture is:

```text
FIELD / SITE NETWORK
        ↓
LOCAL SANKET EDGE
  ├── Whisper / ASR
  ├── multilingual-e5-small
  ├── entity / LSR processing
  ├── local Ollama
  └── local database / queue
        ↓
LOCAL CONTROL ROOM
```

## What is currently demonstrated

The audit identifies application-level process socket monitoring using `psutil`.

This can tell the application about its observed process connections.

It does **not** prove:

> "The physical machine is completely air-gapped."

## Correct terminology

Use:

> **Application-level/local egress monitoring**

and:

> **Designed for local/air-gapped deployment**

unless an actual network isolation test has been performed.

---

# 26. LangGraph and MCP

## LangGraph

LangGraph is an orchestration/state-management framework intended to organize specialized processing stages.

The project specification describes specialized agent concepts such as:

- supervisor;
- classifier;
- entity extractor;
- rule mapper;
- graph analyst;
- explainer;
- action/CAPA.

These are **logical responsibilities**, not necessarily seven different AI models.

## Current status

The repository contains the LangGraph implementation, but the audit found that the normal report ingestion path bypasses it and directly executes the procedural pipeline.

Therefore:

> **LangGraph is an intended/available orchestration architecture, not the active report-ingestion execution path in the audited repository.**

## MCP

**MCP = Model Context Protocol.**

MCP is not an AI model.

It is a standardized tool-calling interface that can allow an AI agent to access reusable capabilities such as:

- incident queries;
- cluster detection;
- graph functions;
- document generation.

The project dependencies include FastMCP, but MCP should not be presented as the mechanism currently responsible for every safety decision.

---

# 27. Implementation Status — Master Matrix

The following matrix is the safest current high-level classification based on the audit checkpoint and project sources.

| Component | Current status | Explanation |
|---|---|---|
| Report ingestion | 🟢 Implemented & active | Core report endpoint and processing worker exist |
| Text preprocessing | 🟢 Implemented & active | Normalization + language detection |
| SIF semantic scoring | 🟢 Implemented & active | multilingual-e5-small + anchors |
| Safety guardrails | 🟢 Implemented & active | Deterministic regex rules |
| Entity extraction | 🟢 Implemented & active | Regex/keyword patterns |
| IOGP semantic mapping | 🟢 Implemented & active | Embedding similarity |
| LLM explanation | 🟢 Implemented | Downstream explanation |
| LangGraph swarm | 🟡 Implemented but bypassed | Exists but is not active ingestion path |
| Voice/Whisper backend | 🟢 Implemented | Separate voice capability exists |
| Visible Field Reporter | 🟡 Partial / demo aspects | Integration gaps identified by audit |
| RoIP gateway | 🟣 Specified / intended | Requires external gateway/radio integration |
| Triage Queue | 🟢 Implemented | DB-backed dashboard |
| Incident Inspector | 🟢/🟡 | UI/workflow exists; exact action integration should be verified before claiming full production lifecycle |
| NetworkX graph | 🟡 Partial | In-memory and incompletely integrated with normal ingestion |
| Persistent graph database | ⚪ Future | Not current architecture |
| Near-Miss clustering | 🟡 Partial | Logic exists; automatic normal-path escalation is not fully wired |
| Heatmap matrix | 🟢 Implemented | SQL aggregation |
| GIS map/context layers | 🔵 Simulated/static | Visible data includes hardcoded assets |
| Emergency SWA workflow | 🟡 Partial | Trigger exists; some response data is static |
| Physical OT/DCS shutdown | ⚪ Future | Requires separate validated integration |
| Baghjan Replay | 🔵 Simulated/static | Frontend demonstration |
| Shift briefing/documents | 🟡/🟢 | Intended output capability; exact current implementation should be verified per route |
| Application-level air-gap telemetry | 🟢 Implemented | Process-level socket monitoring |
| Physical air-gap | ⚪ Future/deployment responsibility | Cannot be proven by application telemetry |
| Qwen3:8B | 🔵 Current local option / configuration-dependent | Suitable as local explainer; not primary SIF classifier |
| Real-world accuracy benchmark | 🔴 Missing | No robust precision/recall/F1 benchmark verified |

### Status definitions

- 🟢 **Implemented & active**
- 🟡 **Implemented but partial/bypassed**
- 🔵 **Simulated / hardcoded demonstration**
- 🟣 **Specified / intended**
- ⚪ **Future / production**
- 🔴 **Important missing capability**

---

# 28. Current AI Model Roles

| Component | Model/technology | Role |
|---|---|---|
| Semantic SIF scoring | `intfloat/multilingual-e5-small` | SIF semantic similarity/risk scoring |
| SIF anchors | 50 curated vectors | Reference precursor patterns |
| Entity extraction | Regex + keyword lists | Domain entity extraction |
| Safety guardrails | Regex/rule engine | Deterministic safety constraints |
| IOGP mapping | multilingual-e5-small | Semantic rule matching |
| Voice STT | Whisper | Speech-to-text |
| Local explanation | Ollama model such as Qwen3:8B / llama3.1:8b | Grounded explanation |
| Cloud explanation | GPT/Groq provider depending configuration | Grounded explanation |
| Graph | NetworkX | Relationship representation/analysis |
| Temporal systemic detection | SQL | Time-window aggregation |

The important architecture is therefore:

```text
SEMANTIC MODEL
       +
DETERMINISTIC RULES
       +
PATTERN EXTRACTION
       +
SEMANTIC RULE MATCHING
       +
OPTIONAL LLM EXPLANATION
       +
TEMPORAL / GRAPH ANALYSIS
```

---

# 29. Why Qwen3:8B Is Suitable

Qwen3:8B is suitable for the current local LLM role **because the LLM is downstream of the primary SIF scoring system**.

It does not need to perform:

- primary classification;
- graph traversal;
- temporal aggregation;
- database work.

It mainly needs to produce a concise explanation grounded in already structured information.

### Suitable tasks

- short safety explanations;
- structured prompt following;
- local/offline generation;
- common Indian-language/English text, subject to testing on actual field language.

### Not its job

```text
Qwen3:8B
   ≠
SIF classifier

Qwen3:8B
   ≠
graph engine

Qwen3:8B
   ≠
safety rule engine
```

If configured locally, the conceptual environment is:

```text
AI_MODE=airgapped
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:8b
```

The exact runtime configuration should always be verified before claiming which model is active.

---

# 30. Data and Evaluation

## Current state

The audit found no rigorous machine-learning benchmark with verified:

- precision;
- recall;
- F1;
- confusion matrix;
- independent hold-out evaluation.

The existing classifier calibration test checks a small set of hardcoded examples.

## Synthetic data

The project contains a synthetic dataset generator.

Synthetic data is useful for:

- development;
- demonstrations;
- pipeline testing;
- seeding repeatable scenarios.

But if the synthetic examples are intentionally generated around the same keywords/patterns used by the classifier and rules, they cannot establish real-world accuracy.

This is a form of **circular evaluation risk**.

## What a defensible benchmark needs

A future evaluation set should contain independently labeled observations, ideally:

```text
Labeled observations
       ↓
Train / development data
       ↓
Hold-out evaluation set
       ↓
SIF predictions
       ↓
Precision / Recall / F1
       ↓
Confusion matrix
       ↓
Threshold analysis
```

Do not invent accuracy percentages.

---

# 31. Known Weaknesses

## 31.1 Entity extraction brittleness

Unknown equipment or phrasing can be missed.

## 31.2 Safety-rule brittleness

Exact regex patterns can fail when a hazard is described differently.

## 31.3 Evaluation deficit

No verified robust real-world performance benchmark exists.

## 31.4 Synthetic-data circularity

Synthetic reports can resemble the rules used to detect them.

## 31.5 Graph persistence/integration

The current NetworkX graph is ephemeral and its normal ingestion integration is incomplete.

## 31.6 Voice integration

The intended production Field Reporter/RoIP architecture is ahead of the current software integration.

## 31.7 Air-gap terminology

Process-level egress monitoring must not be confused with physical network isolation.

## 31.8 LLM failure handling

LLM explanation should degrade gracefully without changing the underlying safety classification.

## 31.9 Authentication / authorization

The code audit identified authentication primitives but also found that audited report, graph and voice endpoints were not consistently protected by authentication/role dependencies. This is a production security gap that should be addressed before deployment. fileciteturn10file1

---

# 32. Recommended Improvements

## Priority 1 — Correctness and safety

1. Remove any fabricated transcription fallback.
2. Make voice/report API contracts consistent.
3. Ensure failed transcription produces an explicit failure state.
4. Clearly distinguish demo/simulated results from real backend results.
5. Add authentication and authorization to relevant APIs.

## Priority 2 — Systemic intelligence integration

1. Connect canonical report ingestion to graph updates.
2. Connect canonical entities to temporal cluster detection.
3. Persist or reliably rebuild graph state.
4. Preserve evidence/provenance.
5. Prevent duplicate reports from inflating systemic signals.

The Field Reporter specification explicitly emphasizes idempotency because duplicate transmissions could falsely inflate systemic-risk evidence. fileciteturn9file13

## Priority 3 — AI evaluation

1. Build an independently labeled benchmark.
2. Measure precision, recall and F1.
3. Evaluate thresholds.
4. Test multilingual field language.
5. Test false-positive and false-negative cases.
6. Separate development/synthetic data from evaluation data.

## Priority 4 — Field architecture

1. Implement a transport-independent `FieldObservation` contract.
2. Build a simulator adapter first.
3. Add durable queue/store-and-forward.
4. Add authentication/device identity.
5. Define a `RadioRoIPAdapter` boundary.
6. Only implement a real gateway after identifying the target radio system.

This sequence is consistent with the Field Reporter specification. fileciteturn9file15

---

# 33. Current Prototype vs Production Vision

| Capability | SIH prototype/current state | Production direction |
|---|---|---|
| Text ingestion | Implemented | Retain |
| Semantic SIF scoring | Implemented | Independently benchmark/calibrate |
| Safety rules | Implemented | Expand/test domain rules |
| Entity extraction | Regex/keyword | Hybrid NER + normalization |
| IOGP mapping | Semantic matching | Benchmark and improve |
| LLM explanation | Local/cloud option | Governed local model preferred where required |
| Voice | Software capability / integration gaps | Evidence-preserving field pipeline |
| Field device | Simulated/browser environment | Approved site device |
| Radio | Simulator/intended architecture | Site-specific radio + RoIP gateway |
| Graph | In-memory NetworkX | Persistent/rebuildable evidence graph |
| Temporal clustering | SQL logic | Fully wired systemic alert path |
| GIS | Partial/static | Live governed GIS/process data |
| Emergency SWA | Digital workflow/demo | Validated operational integration |
| SCADA/DCS | Dashboard/application data | Separate OT integration |
| Air-gap | Process-level telemetry | Network/host deployment controls |
| Baghjan Replay | Static demonstration | Evidence-backed historical reconstruction |
| Evaluation | Unit/synthetic testing | Independent labeled benchmark |

---

# 34. Presentation Narrative

A clean presentation should follow the user's journey rather than the codebase.

## Step 1 — Problem

> "Safety teams receive large numbers of fragmented observations. The challenge is identifying the few signals that indicate serious or systemic risk before an incident occurs."

## Step 2 — Field signal

> "A worker reports an observation through text or, in the intended field architecture, through approved voice/radio infrastructure."

## Step 3 — Individual intelligence

```text
Preprocess
   ↓
SIF semantic score
   ↓
Safety guardrails
   ↓
Entities
   ↓
IOGP rule
   ↓
Explanation
```

## Step 4 — Triage

> "The safety officer gets a prioritized investigation queue."

## Step 5 — Systemic intelligence

> "SANKET then looks across observations to find recurring equipment, location, barrier or activity patterns."

## Step 6 — Action

> "The officer investigates, validates the assessment, and can initiate CAPA or an appropriate response workflow."

## Step 7 — Management

> "Heatmaps, dashboards, briefings and historical replay provide higher-level situational awareness."

### One-minute version

> **"A worker observes a hazard. SANKET ingests the observation, calculates a semantic SIF risk score, applies deterministic safety guardrails, extracts industrial context and maps it to an IOGP Life-Saving Rule. Important cases receive a grounded explanation. Across reports, recurring entities and time-based patterns are surfaced for systemic investigation. The HSE team sees those signals through triage, graphs and analytics, and a human officer validates the decision and drives corrective action."**

---

# 35. Judge/Viva Core Questions

## Why does SANKET need to exist?

**Short answer:** Because counting incidents equally can hide high-consequence precursors. SANKET prioritizes SIF potential and looks for recurring patterns across observations.

## Why not just use an LLM?

**Answer:** The primary SIF assessment does not depend on free-form LLM reasoning. SANKET uses embedding similarity and deterministic safety rules for more predictable and auditable processing, while the LLM is used downstream for explanation.

## Why embeddings?

**Answer:** They capture semantic similarity even when the wording differs, which is useful for multilingual and free-text safety observations.

## Why deterministic guardrails?

**Answer:** Explicit safety constraints should not depend entirely on probabilistic semantic similarity. Guardrails provide predictable overrides/floors for known high-risk patterns.

## Is the classifier probabilistic?

**Answer:** The current output should be described as a semantic risk/similarity score, not a calibrated probability.

## Is your entity extractor AI?

**Answer:** It is currently a deterministic domain-specific pattern extractor using regex and keyword matching. A neural NER component is a possible future enhancement.

## Does LangGraph currently process reports?

**Answer:** The repository contains the LangGraph architecture, but the audited active ingestion worker currently executes the processing procedurally.

## Does the graph prove causality?

**Answer:** No. It surfaces recurring relationships and evidence that warrant investigation. Correlation is not proof of causation.

## Why three reports and seven days?

**Answer:** They are configured systemic-detection parameters intended to identify repeated signals while limiting isolated noise. They should ultimately be calibrated using operational data.

## Does the Baghjan Replay prove SANKET would have prevented the disaster?

**Answer:** No. It is a counterfactual demonstration showing how precursor patterns could have been surfaced earlier.

## Is SANKET physically shutting down the rig?

**Answer:** No. The prototype demonstrates a digital SWA/response workflow. Physical OT shutdown requires separate validated safety engineering and authorization.

## Is the system actually air-gapped?

**Answer:** The application includes process-level egress monitoring and is designed for local deployment. Physical air-gap isolation is a deployment/network property and is not proven by the application's socket telemetry.

## What does Qwen3:8B do?

**Answer:** When configured locally, Qwen3:8B can generate the short grounded explanation after the deterministic/embedding-based pipeline has already assessed the report. It is not the primary SIF classifier.

## How accurate is the AI?

**Answer:** The current repository does not contain a sufficiently rigorous independent benchmark to justify a production accuracy claim. We should measure precision, recall and F1 on independently labeled data before making such claims.

---

# 36. Questions About the Field Reporter

## Why not simply use a phone?

Because the intended operating environment may restrict or discourage consumer smartphones in hazardous process areas. The production architecture therefore uses approved field communication infrastructure.

## Why RoIP?

RoIP provides a boundary between existing radio/PTT infrastructure and software/IP systems. SANKET does not need to replace the radio system; it needs a governed way to receive relevant communication.

## Does SANKET directly connect to a walkie-talkie?

Not generically. Conventional radio systems need an appropriate gateway, base-station interface, dispatch platform or vendor-supported integration.

## What happens if the gateway fails?

A production edge design should expose gateway health, queue observations where possible, and distinguish "no reports" from "ingestion unavailable."

## What happens when the internet is down?

The intended architecture places ASR, embeddings, database/queue and the local LLM at the edge. Complete offline field queue/synchronization is a production requirement and should not be claimed as fully implemented unless verified.

## Why a dedicated safety channel?

It reduces unrelated radio traffic, privacy exposure, storage volume and false positives. The field specification proposes a governed safety-channel concept. fileciteturn9file4

---

# 37. Questions About Security and Safety

## Can an AI automatically stop a rig?

The AI can support or initiate an authorized digital workflow, but it should not be presented as a certified physical safety control. Any actual shutdown integration requires independent safety engineering.

## What happens if the AI is wrong?

The architecture separates safety scoring from explanation and includes human review. A production system must additionally be evaluated for false positives/negatives and fail-safe behavior.

## What happens if the LLM hallucinates?

The LLM should only generate a grounded explanation from the structured report context. If it fails or times out, the underlying deterministic/embedding classification should remain intact.

## What happens if Whisper fails?

The correct production behavior is an explicit transcription failure state. The system must not fabricate a transcript.

---

# 38. Claims the Team Must Avoid

Do **not** claim:

- "100% accurate AI."
- "Mathematically proven disaster prevention."
- "The graph proves root cause."
- "The LLM classifies SIF."
- "Qwen3 is the SIF classifier."
- "The entity extractor is GLiNER zero-shot NER."
- "LangGraph is the active ingestion path" unless it is actually wired.
- "The system is physically air-gapped" based only on `psutil`.
- "SANKET is ATEX certified."
- "SANKET is OISD/DGMS certified."
- "The prototype directly controls a real rig."
- "The prototype is connected to live SCADA/PLC telemetry" unless demonstrated.
- "Synthetic data proves real-world accuracy."
- "RoIP directly connects any walkie-talkie to SANKET."

Instead, use precise phrases such as:

> "Designed for..."

> "The prototype demonstrates..."

> "The current implementation uses..."

> "The production architecture would..."

> "The current repository contains..."

This is stronger than overclaiming because every statement can be defended.

---

# 39. Recommended Terminology

| Avoid | Use |
|---|---|
| Neuro-symbolic AI | Hybrid NLP pipeline |
| Physics-informed AI | Deterministic Safety Guardrails |
| Zero-shot NER | Regex/domain pattern extraction |
| Probabilistic classifier | Semantic Embedding Classifier / Semantic Risk Score |
| AI probability | Semantic risk score |
| Agent swarm runs ingestion | LangGraph orchestration exists; current worker is procedural |
| Causal graph | Evidence-backed relationship/systemic graph |
| Air-gap proof | Application-level egress monitoring / designed for local air-gapped deployment |
| AI shuts down rig | Digital SWA/response workflow |
| RoIP connects directly to walkie-talkie | RoIP gateway bridges radio infrastructure to IP/software |
| Disaster prevention proof | Counterfactual replay / prevention scenario |

---

# 40. Terminology Cheat Sheet

| Term | Full form | Meaning |
|---|---|---|
| SIF | Serious Injury & Fatality | High-consequence safety potential |
| SIFa | SIF Actual | Serious/fatal outcome occurred |
| SIFp | SIF Potential | High-energy precursor with failed/missing barrier |
| UA/UC | Unsafe Act / Unsafe Condition | Unsafe behavior/condition |
| LSR | Life-Saving Rule | IOGP safety rule |
| HSE | Health, Safety & Environment | Safety management function |
| ASR | Automatic Speech Recognition | Speech-to-text |
| STT | Speech-to-Text | Converting voice to text |
| PTT | Push-to-Talk | Radio transmission mechanism |
| RoIP | Radio over IP | Radio/IP interoperability |
| SWA | Stop Work Authority | Process for stopping unsafe work |
| CAPA | Corrective and Preventive Action | Tracked corrective/preventive work |
| DCS | Distributed Control System | Industrial process/control environment |
| LLM | Large Language Model | Text-generation model used here for explanation |
| MCP | Model Context Protocol | Tool-calling protocol |
| NER | Named Entity Recognition | Identifying entities in text |
| NLP | Natural Language Processing | Processing human language |
| GIS | Geographic Information System | Spatial mapping/analysis |
| OT | Operational Technology | Industrial control technology |
| SIF score | — | Semantic risk/similarity score in current implementation |

---

# 41. Evidence and Source Hierarchy

For presentation and team preparation, use this hierarchy:

1. **Current repository behavior** — what the running application actually does.
2. **Current technical implementation/audit** — code-first findings.
3. **Technical application specification** — intended architecture.
4. **PRD** — product purpose, SIH alignment and feature requirements.
5. **Field Reporter / Signal Graph specifications** — proposed component architecture.
6. **Mentor feedback** — operational constraints and improvement direction.
7. **Presentation/reference documents** — explanations, not authoritative implementation evidence.
8. **Future roadmap** — capabilities not currently demonstrated.

The existing team guide explicitly recommends this hierarchy and emphasizes not bluffing about unimplemented features. fileciteturn10file16

---

# 42. Final Product Principle

SANKET should ultimately be understood as:

```text
FIELD SIGNAL
     ↓
TRUSTWORTHY INGESTION
     ↓
INDIVIDUAL SAFETY INTELLIGENCE
     ↓
SYSTEMIC SAFETY INTELLIGENCE
     ↓
HUMAN INVESTIGATION
     ↓
ACTION
```

The dashboards are interfaces to that intelligence.

The AI model is one component.

The radio is an ingestion mechanism.

The graph is an investigation surface.

The LLM is an explanation mechanism.

The human safety officer remains accountable for operational decisions.

The central value proposition is:

> **Find meaningful safety signals earlier, connect them across observations, and make them actionable.**

---

# 43. Recommended Future Architecture

A production-oriented architecture can evolve toward:

```text
                FIELD
                  │
       ┌──────────┴──────────┐
       │                     │
     TEXT              APPROVED PTT/RADIO
       │                     │
       │                  RoIP Gateway
       │                     │
       └──────────┬──────────┘
                  ↓
          EDGE INGESTION
                  ↓
          FieldObservation
                  ↓
          ASR / PREPROCESSING
                  ↓
       ┌──────────┴──────────┐
       ↓                     ↓
 Semantic SIF          Deterministic
   Scoring              Guardrails
       └──────────┬──────────┘
                  ↓
        Entities + IOGP Mapping
                  ↓
          Grounded Explanation
                  ↓
        Canonical Report Store
                  ↓
       ┌──────────┴──────────┐
       ↓                     ↓
   Graph Projection     SQL Temporal
       ↓                  Analysis
       └──────────┬──────────┘
                  ↓
          SYSTEMIC SIGNAL
                  ↓
       Human Investigation
                  ↓
                CAPA
                  ↓
              Verification
                  ↓
               Closure
```

This preserves the most important design principle from the Field Reporter and Signal Graph specifications: **all ingestion mechanisms should ultimately feed one canonical safety-intelligence pipeline rather than creating separate intelligence systems.** fileciteturn9file13

---

# 44. Final Team Message

If a team member remembers only five things, they should remember:

1. **SANKET is about SIF precursor intelligence, not generic incident counting.**
2. **The current SIF score comes from multilingual embeddings + SIF anchors, with deterministic safety guardrails.**
3. **The LLM explains the result; it does not make the primary SIF decision.**
4. **Systemic intelligence comes from connecting observations across entities and time, but current graph/cluster integration has implementation gaps.**
5. **SANKET supports human safety decisions; it should never be presented as an autonomous certified safety control.**

### Final one-sentence pitch

> **SANKET AI converts fragmented field safety observations into explainable SIF intelligence, connects recurring signals across time and operational context, and helps HSE teams investigate and act before weak signals become serious incidents.**

---

# 45. Source Basis

This master reference was consolidated from the project materials supplied in the conversation, including:

- `SANKET_PRD.md`
- `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`
- `SANKET_COMPONENT_DEEP_ANALYSIS.md`
- `understandsanketai.md`
- `SANKET_AI_System_Guide.docx`
- `SANKET_AI_Team_Explanation_Guide.md/.docx`
- `SANKET_AI_Judge_Viva_QA_Handbook.docx`
- `SANKET_FIELD_REPORTER_ROIP_SPECIFICATION_REVISED.md`
- `SANKET_FIELD_REPORTER_ROIP_TECHNICAL_SPECIFICATION.md`
- `SANKET_SIGNAL_GRAPH_SPECIFICATION.md`
- `mentor feedback.md`
- `task.md`
- `README.md`
- `requirements.txt`
- `SANKET_FINAL_AUDIT_CHECKPOINT.md`

The final audit checkpoint supplied by the project team records the repository-verified Stage 1–5 findings and is treated as the implementation baseline for the current prototype. fileciteturn8file0

---

# 46. Final Status

**This document should be treated as the current master project reference, not as a claim that every specified production feature is already implemented.**

Before SIH presentation, the team should re-check:

- current runtime model configuration;
- current voice/Field Reporter behavior;
- current graph/systemic integration;
- current database/deployment configuration;
- any code changes made after the audit.

The safest presentation is always:

> **What we built → why we built it → how it works → what the prototype demonstrates → what production deployment would require.**
