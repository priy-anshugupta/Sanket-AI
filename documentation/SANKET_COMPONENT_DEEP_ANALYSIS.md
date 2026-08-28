# SANKET · AI — Signal Graph & Field Reporter Deep Analysis

> **Scope and method.** This is a code-first reverse-engineering report for the Safety Signal Graph (F6), Near-Miss Multiplier (F7), and Field Reporter (F13). “FACT” means verified in the current repository; “SPECIFICATION” means stated in the PRD/technical specification; “INFERENCE” follows directly from those facts. No application code was changed for this report. The working SQLite database (`sanket.db`) was read as an additional snapshot only; it contained 507 reports, 1,537 entities, zero `graph_edges`, and zero `systemic_alerts` at inspection time.

## 1. Executive Summary

SANKET is a Next.js + FastAPI modular monolith intended to turn field safety observations into Serious Injury & Fatality (SIF) precursor intelligence. The implemented text pipeline is functional in outline: a report is persisted, a FastAPI background task preprocesses it, scores it with multilingual E5 embeddings, extracts pattern/keyword entities, maps IOGP Life-Saving Rules (LSRs), and optionally requests an LLM explanation. The database is SQLAlchemy-backed; Docker defaults to a persistent SQLite volume while the checked-in settings default to a remote PostgreSQL URL.

The two audited components are materially less integrated than their names and UI imply:

- **Safety Signal Graph:** an in-memory, process-wide undirected `networkx.Graph` exists and can serialize to Cytoscape-shaped JSON. It is populated by the demo-500 route or lazily by `GET /api/graph/signals`, not by the normal production report worker. The lazy route reconstructs only a reduced, heuristic graph from at most 60 `Report` rows rather than persisted extracted entities. Its `GraphEdge` ORM table is never written or read. A restart therefore loses graph state; the next signals request builds a potentially different/partial graph.
- **Near-Miss Multiplier:** the SQL query and escalation functions exist, including a configurable 7-day/3-distinct-report threshold, but no normal route, worker, or executed LangGraph flow calls them. Consequently, ordinary ingestion cannot create `SystemicAlert`s or escalate reports. The function checks one exact `(entity_type, entity_value)` at a time, rather than a correlated equipment-or-location grouping.
- **Field Reporter:** the browser page is a polished demo/simulator. It does not use `MediaRecorder`, microphone permissions, waveform data, audio upload, or `/api/voice/transcribe-and-ingest`. Its “recording” timer inserts hard-coded text. Its normal submit sends `raw_text`, while the backend schema requires `text`; therefore it receives HTTP 422 in the current API and then deliberately displays a fabricated offline HIGH result. The separate backend Whisper service works as a synchronous upload-to-transcription-to-immediate-ingestion endpoint, but it is not frontend-connected and does not retain audio or allow transcript correction before creating the report.

The most valuable near-term work is correctness and truthful integration: make text/voice submission conform to one contract, call graph update + cluster detection from the committed NLP pipeline, persist/rebuild graph state (or query it from relational data), and make the UI distinguish real outcomes from demo simulations. Adding Neo4j, GraphRAG, radios, or a complex realtime layer before those steps would obscure rather than solve the core gaps.

## 2. Repository & Architecture Context

### Repository map

| Area | Actual responsibility | Relevant files |
| --- | --- | --- |
| Frontend | Next.js 16 / React 19 client pages; hand-built Canvas graph and reporter simulation | `frontend/app/dashboard/graph/page.tsx`, `frontend/app/dashboard/voice/page.tsx`, `frontend/src/lib/api.ts`, `frontend/src/types/index.ts` |
| API/backend | FastAPI application, SQLAlchemy async sessions, FastAPI `BackgroundTasks` | `backend/main.py`, `backend/api/*.py`, `backend/services/report_service.py`, `backend/workers/pipeline_worker.py` |
| Data | SQLAlchemy models for reports, entities, LSR tags, alerts, graph-edge snapshot model, users | `backend/models/` |
| AI/NLP | Preprocessing, E5 classifier, rule mapper, regex/keyword entity extractor, optional Groq/Ollama explanation | `ai/preprocessing/`, `ai/sif/`, `ai/entities/`, `ai/lsr/`, `ai/explanation/` |
| Graph/cluster | Process-local NetworkX store and independent SQL temporal-cluster helper | `graph/graph_store.py`, `graph/clustering.py` |
| Voice | Local Python Whisper wrapper; multipart API route | `ai/voice/whisper_service.py`, `backend/api/voice_routes.py` |
| Deployment | Dockerized frontend/backend/Ollama; SQLite volume in Compose | `docker-compose.yml`, `Dockerfile.backend`, `Dockerfile.frontend` |
| Specifications/demo assets | Product requirement, technical design, mentor production concepts, synthetic data and scripts | `SANKET_PRD.md`, `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`, `mentor feedback.md`, `data/`, `scripts/` |

**FACT:** `backend/main.py` installs all routers, initializes tables, seeds four demo users, and eagerly initializes the SIF classifier. There is no startup graph reconstruction, task queue/broker, WebSocket router, or voice-model initialization.

**FACT:** The normal worker is not LangGraph. `POST /api/reports/ingest` schedules `backend.workers.pipeline_worker.process_report`; that function directly executes five stages. `ai/agents/swarm.py` defines a LangGraph flow that does call `graph_store.add_report_entities`, but no code imports/invokes `sanket_swarm` from an active route or worker.

**FACT:** `requirements.txt` includes NetworkX 3.4.2, `openai-whisper==20240930`, SentenceTransformers 3.3.1, FastAPI, SQLAlchemy/aiosqlite, LangGraph, and `httpx`. It does not list `asyncpg` although the default `DATABASE_URL` in `backend/config/settings.py` uses `postgresql+asyncpg`; Compose overrides it with `sqlite+aiosqlite:///./data/sanket.db`.

**FACT:** auth primitives exist (`backend/auth/rbac.py`) but neither graph, report, nor voice routes use `get_current_user` or `require_role`. All audited endpoints are publicly callable when the backend is reachable. The frontend API client can attach a token, but the target pages use raw `fetch` or no authorization header.

### AI pipeline actually executed

```text
POST /api/reports/ingest {text, source, metadata}
  -> Report(status=PENDING) committed
  -> FastAPI BackgroundTasks.process_report(report_id)
  -> TextPreprocessor
  -> SIFClassifier (local SentenceTransformer; model may download when absent)
  -> EntityExtractor -> Entity rows
  -> LSRMapper -> LSRTag rows
  -> optional Groq/Ollama explanation for score >= .50
  -> Report(status=COMPLETED)

No graph update, cluster check, alert creation, websocket event, CAPA creation,
or LangGraph execution is on this runtime path.
```

**Source:** `backend/api/report_routes.py` (`ingest_report`), `backend/workers/pipeline_worker.py` (`process_report`), `backend/services/report_service.py`, `ai/preprocessing/preprocessor.py`, `ai/sif/classifier.py`, `ai/entities/extractor.py`, `ai/lsr/mapper.py`.

## 3. Component Relationship Overview

### Current implementation relationship

```text
Graph page -> GET /api/graph/signals -> empty in-memory store?
                                      -> up to 60 reports + report fields + keyword scan
                                      -> NetworkX -> canvas JSON

Voice page -> preset/simulated text -> POST /api/reports/ingest with {raw_text}
                                    -> schema rejects request (422)
                                    -> UI displays locally fabricated result

Separate, unused voice API -> Whisper -> immediately creates Report -> normal NLP path
Separate, unused LangGraph -> GraphStore.add_report_entities (but no SQL cluster escalation)
Separate MCP tool -> ClusterDetector.check_clusters (read-only unless caller separately escalates)
```

### Intended relationship

**SPECIFICATION:** Layer 2 consumes Layer 1 entities: report → entity/LSR extraction → graph update → temporal SQL cluster check → systemic alert/escalation → dashboard. Voice is intended to transcribe, show an editable transcript, then submit to the same text ingestion endpoint. The technical specification calls this strictly sequential.

**Specification:** `SANKET_PRD.md`, F6/F7/F13 and Section 9; `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`, Sections 17, 18, 24 and 29.

# PART I — SAFETY SIGNAL GRAPH

## 4. Product Purpose

A report table answers “what did this worker report?” A graph is meant to answer “which equipment, places, failed barriers, energies, and rules recur together across many reports?” In product terms, a **signal** is a repeated or meaningful connection between those safety concepts; a **systemic risk** is a recurring correlated pattern whose combined context is more serious than each individual observation. This supports the SIH outcome of surfacing/ranking SIF-precursor patterns across sites and activities, rather than treating every UA/UC/near-miss record independently.

**SPECIFICATION:** F6 says nodes are equipment, locations, and barrier failures with weighted co-occurrence edges. F7 says three or more correlated minor anomalies at the same equipment or location in a rolling seven days must elevate the cluster. The technical specification expands the node taxonomy with shift, energy source, and LSR violation. Entity extraction is the bridge from natural-language SIF precursors (for example pressure plus a failed barrier) to graphable safety context.

**FACT:** the code can represent many entity types and weighted association, but it does not represent reports, time, clusters, causal assertions, or systemic-risk status in the NetworkX graph. Thus visual connections are correlations from a common report, not evidence of causal pathways.

**Source:** `SANKET_PRD.md` (Sections 1, 9, F6/F7); `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md` (Sections 17–18); `graph/graph_store.py`; `ai/entities/extractor.py`.

## 5. Current Architecture

### Graph creation and ownership

**FACT:** importing `graph.graph_store` creates `graph_store = GraphStore()`. Its constructor creates a plain undirected `nx.Graph()` and a Python `_report_registry`. It is process-wide singleton state; it is neither request-scoped nor database-backed. The registry is only assigned in `add_report_entities` and has no public reader or persistence.

**Source:** `graph/graph_store.py` (`GraphStore.__init__`, module-level `graph_store`).

### Every current graph mutation path

| Caller/path | Input | Mutation | Persistence/error behavior |
| --- | --- | --- | --- |
| `GraphStore.add_report_entities` | report ID, entity dicts, optional LSR dicts, SIF label/timestamp | adds/increments entity nodes, LSR nodes, and all pairwise edges | no DB write; no locking/validation; `KeyError` is possible for malformed entities/rules |
| `/api/reports/ingest/demo-500` | generated report field values | creates Location/Activity/optional LSR entities and calls GraphStore for each item | DB report commit occurs after mutations; graph survives only process lifetime; no cluster call |
| `GET /api/graph/signals` when store empty | first 60 reports, not their `Entity` rows | derives location/activity/IOGP fields and a small hard-coded equipment keyword list, then calls GraphStore | no graph snapshot; failures not wrapped; rebuild selection lacks explicit ordering |
| `graph_analyst_agent` in unused swarm | extracted entities and LSR mapping | calls `add_report_entities` | not on actual route/worker path; sets `cluster_alert=False` and never invokes detector |

**IMPLEMENTED DIFFERENTLY:** the spec’s `graph/builder.py` and `graph/serializer.py` do not exist. The store itself is both builder and serializer.

## 6. Graph Data Model

### Node architecture

| Node type | Exists in normal runtime graph? | Source | Identifier | Attributes / meaning |
| --- | --- | --- | --- |
| `EQUIPMENT` | Partially | full extractor only via unused swarm; graph GET’s fixed keyword scan | `EQUIPMENT:<value>` | label, type, `report_count`, `last_seen`, maximum seen SIF severity |
| `LOCATION` | Yes, limited | `Report.location` on lazy reconstruction; extractor only via unused swarm | `Location:<value>` or `LOCATION:<value>` depending caller | same attributes; type inconsistency is material |
| `ACTIVITY` | Yes, but not spec taxonomy | `Report.activity_type` / demo route | `Activity:<value>` | same attributes |
| `LSR Rule` | Yes, limited | lazy report field creates entity type `LSR Rule` | `LSR Rule:<value>` | entity-style node attributes |
| `LSR_VIOLATION` | Only if caller supplies `lsr_rules` | `add_report_entities(..., lsr_rules=...)`, used by unused swarm | `LSR:<rule_name>` | label/type/count/last_seen; no severity at creation |
| `BARRIER_FAILURE` | Only via unused swarm | extractor | `BARRIER_FAILURE:<value>` | same entity attributes |
| `ENERGY_SOURCE` | Only via unused swarm | extractor | `ENERGY_SOURCE:<value>` | same entity attributes |
| `SHIFT_TIME`, `WEATHER_CONDITION`, `PPE_STATUS`, `BODY_PART` | Only via unused swarm | extractor | `<type>:<value>` | same entity attributes |
| REPORT / CLUSTER / shift (`SHIFT`) | No | none | n/a | no report or cluster nodes; extractor calls shift `SHIFT_TIME`, not `SHIFT` |

**FACT:** node identity is a raw formatted string. There is no global canonicalization in `GraphStore`. The extractor has local normalization (for example Pump-4/Pump 04 → Pump-04, BOP aliases) and deduplicates within one extraction by lowercase `(type,value)`, but graph lazy reconstruction uses title-cased field values and fixed keywords without that normalizer. Therefore equivalent values can split into distinct nodes due to type/case/spacing/value source.

**FACT:** node `report_count` increments every time `add_report_entities` is called, even for an already processed `report_id`; `_report_registry` does not prevent it. `last_seen` is written only for extracted entity nodes, not LSR nodes on subsequent calls. Severity never downgrades and is the highest SIF label observed, not a temporal or aggregate risk score. Nodes are never deleted/expired while the process lives.

**Source:** `graph/graph_store.py` (`add_report_entities`); `ai/entities/extractor.py` (`extract`, `_normalize`); `backend/api/graph_routes.py` (`get_graph_signals`).

## 7. Node Architecture

The database `Entity` model is the richer durable entity record: `{id, report_id, entity_type, entity_value, confidence}` with an index on `(entity_type, entity_value)`. The inspected SQLite data contains the eight extractor types: LOCATION, ENERGY_SOURCE, EQUIPMENT, PPE_STATUS, BARRIER_FAILURE, WEATHER_CONDITION, BODY_PART, and SHIFT_TIME. Yet the lazy graph does not load this table, so a user viewing the graph does not receive the graph of those actual extracted entities.

**INFERENCE:** after a restart the page loses barrier/energy/PPE/etc. graph coverage even if those entities remain safely stored in SQL, because rebuilding does not query `entities`.

**Source:** `backend/models/entity.py`; `backend/api/graph_routes.py`; `ai/entities/extractor.py`.

## 8. Edge Architecture

| Edge type | Exists? | Source → target | Weight behavior | Attributes / limitations |
| --- | --- | --- | --- | --- |
| `co_occurred_with` | Yes | every unordered pair in `node_ids` | increments for every `add_report_entities` invocation, including same report reprocessing | `weight`, `report_ids`; first-created edge type persists |
| `violates_rule` | Partly | each accumulated entity node → LSR node | created once then can increment | inserted first, then the same pair is also traversed by pairwise co-occurrence; edge remains `violates_rule` while weight can represent both semantics |
| `located_at` | No | n/a | n/a | specified but unimplemented |
| temporal/report/cluster edges | No | n/a | n/a | graph does not encode dates, reports, alert membership, or causal direction |

`networkx.Graph` permits exactly one undirected edge per node pair. `_add_edge` increments its single `weight` irrespective of the requested `edge_type`; it does not create a separate relationship. For example, if a given entity/LSR pair first receives `violates_rule`, the later co-occurrence loop increments that same edge without changing `edge_type`. Weight consequently means **number of mutation calls across all semantics**, not reliably “distinct reports sharing this relationship.” Although `report_ids` prevents duplicate IDs in the list, the numeric weight still increments on duplicate processing and can exceed the number of distinct report IDs.

There is no edge timestamp, confidence, severity, direction, source-text span, provenance by entity extraction confidence, or explanation of *why* two nodes are linked. `to_cytoscape_json` omits `report_ids` and `last_seen`, so the frontend cannot drill into supporting reports even though the in-memory edge had IDs.

**Source:** `graph/graph_store.py` (`add_report_entities`, `_add_edge`, `to_cytoscape_json`).

## 9. Graph Lifecycle & Persistence

**FACT:** `backend/models/graph_edge.py` defines a `graph_edges` table (source, target, type, weight, report IDs, updated time) but no repository code imports it for reads/writes except an unused import in `ingest_demo_500`. No serialization, deserialization, snapshot scheduler, database transaction, or startup rebuild exists. In the inspected `sanket.db`, `graph_edges` had zero rows.

| Event | Actual result |
| --- | --- |
| Backend process restart | NetworkX graph and `_report_registry` are empty. |
| First signals request after restart | lazily builds from at most 60 arbitrarily selected reports; not their durable entity records. |
| Frontend reload | refetches current backend’s graph; does not change it. |
| Database restart | data depends on configured DB/volume; graph is unaffected until its process is restarted/requeried. |
| Report deletion/update | no inverse graph mutation, so an already populated graph becomes stale. |

**SPECIFICATION:** the technical specification explicitly requires periodic snapshots to `graph_edges` so restart does not lose the graph. This is **specified but not implemented**.

**Source:** `backend/models/graph_edge.py`; `backend/main.py` (`lifespan`); `backend/api/graph_routes.py`; `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md` §§17.1, 17.3 and database section.

## 10. Graph Processing Pipeline

The normal worker commits entities and LSR tags but stops before any graph work. The sole code path that would construct graph nodes from extracted entity data is `graph_analyst_agent` in the LangGraph swarm. It is neither scheduled nor persisted; it does not call `cluster_detector` despite its docstring saying it “inspects” clusters.

The graph endpoint’s lazy bootstrap is an alternate data path:

```text
Report rows (limit 60)
 -> Report.location / activity_type / iogp_rule
 -> raw-text substring test for ten generic equipment terms
 -> GraphStore pairwise associations
 -> Cytoscape-shaped JSON
```

It uses neither `Entity.confidence` nor the real entity extraction results, and it passes no `lsr_rules`, so it does not create `LSR_VIOLATION` nodes or `violates_rule` edges.

**Source:** `backend/workers/pipeline_worker.py`; `ai/agents/swarm.py` (`graph_analyst_agent`); `backend/api/graph_routes.py`.

## 11. API Layer

### `GET /api/graph/signals`

- **Authentication/parameters:** none. It accepts no filters, pagination, date range, location, equipment, or maximum-node query parameter.
- **Route/service:** `backend/api/graph_routes.py:get_graph_signals`; it operates directly on the singleton (no graph service).
- **Response:** `GraphStore.to_cytoscape_json(max_nodes=200)` takes the first 200 NetworkX node iteration entries, then includes only edges between those nodes. Ordering is insertion order, not a risk ranking.

```json
{
  "nodes": [{"data": {
    "id": "Location:Well Pad 7",
    "label": "Well Pad 7",
    "type": "Location",
    "report_count": 4,
    "severity": "HIGH"
  }}],
  "edges": [{"data": {
    "id": "Location:Well Pad 7___Activity:Drilling",
    "source": "Location:Well Pad 7",
    "target": "Activity:Drilling",
    "weight": 4,
    "edge_type": "co_occurred_with"
  }}]
}
```

### Other endpoints

`GET /api/graph/clusters?status=...` returns active/default `SystemicAlert` rows as `{clusters:[{id,cluster_node,cluster_type,event_count,report_ids,status,detected_at}]}`. It does not join report details, calculate current membership, expose window length, or authorize access. `GET /api/graph/stats` reports only current in-memory counts.

**GAP:** The documented filterable serializer and frontend graph-to-report drill-down do not exist. API client methods in `frontend/src/lib/api.ts` are typed, but the graph page bypasses them and uses a hard-coded `http://localhost:8000` fetch.

**Source:** `backend/api/graph_routes.py`; `graph/graph_store.py`; `frontend/src/lib/api.ts`; `frontend/src/types/index.ts`.

## 12. Frontend Visualization

**FACT:** the graph is not Cytoscape.js. `frontend/package.json` has no Cytoscape dependency. `frontend/app/dashboard/graph/page.tsx` draws a custom `<canvas>` in a continuous `requestAnimationFrame` loop. It loads graph data once on mount; a failed request simply ends loading and renders an empty canvas with no error message or retry button (although `RefreshCw` is imported).

Actual user functions:

- category filter buttons for ALL/LSR RULE/EQUIPMENT/LOCATION/ACTIVITY; filters hide nodes while edges remain drawn, so hidden-node connections can still be visible;
- fixed concentric layout: LSR inside, equipment middle, locations/activity/other outside; it is neither force-directed nor data-derived clustering;
- mouse wheel zoom (0.5–2.5), panning by dragging blank space, and manual node drag;
- hover/selection dimming for direct neighbors, right-panel node label/type/ID/count and direct-neighbor list; selecting a neighbor works.

The canvas has a loading message and inspector empty state, but no data empty-state message, no semantic keyboard interactions, no accessible alternative graph/table, no screen-reader labels for the canvas, no search, no date/location/equipment/activity filter beyond type, no edge selection/weight labels, no report navigation, no cluster cards, and no displayed error state. It is responsive only through CSS grid; the fixed 560px canvas and mouse-only interactions are weak on touch/mobile. Each rendered frame repeatedly performs linear `nodes.find` per edge/particle, and React re-installs the render effect when hover/selection/filter/zoom/pan state changes.

**IMPLEMENTED DIFFERENTLY:** text claims “Causal Edges,” “cross-site failure cascades,” “Critical Hub,” and “Cytoscape”; the payload only establishes co-occurrence and the renderer is Canvas. `topHub` is simply maximum node `report_count`, not centrality, risk score, or current systemic alert.

**Source:** `frontend/app/dashboard/graph/page.tsx`; `frontend/package.json`.

## 13. Near-Miss Multiplier

**FACT:** `ClusterDetector.check_clusters(db, entity_type, entity_value, window_days, min_events)` computes `cutoff = datetime.utcnow() - timedelta(days=window)`, joins `entities` to `reports`, filters exact entity type/value and `Report.submitted_at >= cutoff`, and obtains `DISTINCT Entity.report_id`. Defaults come from `settings` (7 days / 3 events). At threshold it returns a dict with score `0.92`, severity `CRITICAL_SYSTEMIC_PRECURSOR`, supporting IDs, and window metadata. This is a query helper; it does not mutate data.

`escalate_cluster` prevents a duplicate only when an **ACTIVE** `SystemicAlert` exists with the same `cluster_node`, ignoring `cluster_type` and time window. It creates an alert, loops through supporting reports, and for any report not already labelled HIGH sets `original_sif_score`, label HIGH, precursor true, and `escalated_by_cluster`. It flushes but leaves transaction commit to its caller. The score remains its prior score; the returned .92 is never written. Reports already HIGH do not receive `escalated_by_cluster` or original-score annotation.

**Source:** `graph/clustering.py` (`ClusterDetector.check_clusters`, `escalate_cluster`); `backend/config/settings.py`.

## 14. Cluster Detection

### Trigger integration result

**FACT:** no call to `check_clusters` or `escalate_cluster` appears in `pipeline_worker.py`, report routes, graph routes, or an executed application flow. The only executable references are the MCP `detect_graph_clusters` tool (query only) and the uncalled swarm imports. Therefore the promised “Report → entities → temporal query → systemic alert → escalation → frontend” is **specified but not implemented** in normal operation.

### Edge-case behavior if a caller invokes it

| Case | Actual behavior |
| --- | --- |
| Exactly 2 distinct reports | returns `cluster_alert: false`. |
| Exactly 3 / 4+ | true at 3; all distinct IDs in lookback are returned. |
| Exactly 7 days old | included when `submitted_at >= cutoff`; timestamp precision/timezone consistency depends on stored naive UTC values. |
| Just outside 7 days | excluded. |
| Duplicate entity rows in one report | deduplicated by SQL `DISTINCT report_id` for event count. |
| Same report processed twice | event count remains one, but `Entity` rows may be duplicated because worker inserts without uniqueness; graph counts/weights duplicate if used. |
| Different spelling/case/renamed asset/location | separate exact `entity_value` groups; no alias/canonical asset mapping in cluster query. |
| Old cluster/window expiry | existing ACTIVE alert remains active indefinitely; no expiry/re-evaluation/resolution job. |
| Overlapping clusters | separate calls may create per exact node; no composite/overlap merging. |
| Multiple equipment or locations in a report | each must be checked separately by an absent caller; no multi-entity correlation query. |

Concurrency risks: two transactions can both see no existing active alert and each add one (no unique constraint); concurrent escalation can overwrite `original_sif_score` after the first change or leave inconsistent membership. There is no isolation policy, lock, idempotency key, alert audit event, user acknowledgement/resolution workflow, WebSocket notification, or CAPA action creation.

**SPECIFICATION GAP:** The technical document requests a grouped EQUIPMENT/LOCATION rolling query after each report and `cluster.created` WebSocket delivery; code contains neither. The PRD says “same equipment/location,” whereas current helper treats either an exact supplied entity but has no invocation to enforce either scope.

**Source:** `graph/clustering.py`; `backend/mcp/server.py`; `backend/workers/pipeline_worker.py`; `backend/models/alert.py`; technical spec §18.

## 15. Graph UX Analysis

For an HSE officer, the page communicates category and frequency but not operationally defensible risk:

| Operational question | Current answer | Why it matters |
| --- | --- | --- |
| What is most dangerous now? | “Critical Hub” is highest node count. | Frequency is not severity, recency, exposure, or systemic escalation. |
| Why are two nodes connected? | Only implicit common occurrence; edge has no visible weight or report IDs. | Officer cannot validate or explain the signal. |
| Which reports support it? | Impossible from UI/API payload. | No investigation/CAPA handoff. |
| Is it historical or emerging? | Impossible: timestamps omitted. | The user cannot distinguish a stale pattern from a rising threat. |
| Is it causation? | UI calls paths causal without causal evidence. | Can lead to unsafe conclusions. |
| Can the officer filter its site/date/asset/activity? | Only node type filter. | Large operational datasets become unreadable. |
| Can action be taken? | No alert acknowledgement, report link, owner, CAPA, or export. | Visual discovery does not lead to risk control. |

## 16. Graph Performance

No graph benchmarks or graph-specific tests exist. Complexity follows the code, not invented measurements:

- Per report graph mutation is O(k²) edge attempts for k entity/LSR nodes. It grows quickly for reports with many extracted terms.
- Serialization scans all nodes then all edges; `max_nodes=200` caps output nodes but not the graph storage/work beforehand.
- Lazy rebuild processes only 60 reports, so it avoids scale rather than supporting it; no sort means result coverage is not intentionally risk/recent based.
- Cluster checking is indexed on entity type/value and report has a submitted-at index, but exact plan/database dependence is unmeasured. Repeating a per-entity query per report would create growing query load.
- Canvas rendering is O(E×N) per frame for edge endpoint lookup plus particle lookup. At 500 reports, entity-pair graphs can become dense; 5,000/50,000 reports require a bounded query/subgraph strategy, aggregation and virtualized/demand-driven rendering rather than continuously animating all links.

**INFERENCE:** a full graph built from all extracted entities could be much larger than the UI’s 200-node payload, while a graph sourced only from coarse report fields is misleadingly small. Benchmark before selecting a graph database.

## 17. Graph Security & Reliability

- Graph endpoints and report IDs in edge data are unauthenticated; report visibility/RBAC is not enforced.
- Raw entity labels are returned and drawn as canvas text. This avoids HTML injection in the canvas itself, but unbounded strings can harm layout/performance; no schema length validation occurs at GraphStore boundary.
- Graph/SQL state diverges because mutations happen outside DB transactions, graph snapshot is absent, and normal pipeline never mutates graph.
- A multi-process Uvicorn deployment would produce one isolated graph per process; there is no shared store or synchronization.
- The endpoints do not protect snapshot/rebuild/mutations with locks; simultaneous first requests may interleave graph creation.
- There is no audit trail for graph updates, edge provenance exposed to the client, cluster decisions, or alert transitions. `AuditTrail` exists for emergency actions but the graph/cluster code does not write it.

## 18. Graph Testing

Existing scripts only test classifier calibration and selected HTTP endpoints; neither exercises graph logic, cluster boundaries, persistence, UI, auth, or graph-to-report flow. `scripts/test_api_endpoints.py` tests unrelated emergency endpoints. No pytest/Jest/Playwright suite is present.

Recommended tests:

- unit: canonical node identity; duplicate report idempotency; LSR relationship semantics; distinct edge weights/report IDs; serialization truncation and stable output;
- database: snapshot/rebuild round trip, report deletion/update reconciliation, cluster exact boundary, duplicate `Entity` rows, casing/alias groups, expired/resolved alerts, concurrent escalation;
- API: roles, date/location/asset filters, error responses, no leakage of inaccessible reports;
- browser/E2E: ingest a report → entity rows → graph edge → third correlated report → alert → drill-down/dashboard update.

## 19. Graph Improvement Opportunities

### Quick wins

1. **Connect the committed worker to one graph/cluster service.** After entities/LSR tags are successfully flushed, use the extracted durable data, mutate idempotently, check EQUIPMENT and LOCATION, then persist alert/outcome in the same controlled transaction. This fixes the core F6/F7 promise; complexity Medium, SIH relevance Critical.
2. **Make the graph truthful and explainable.** Export `report_ids`, distinct-report count, last-seen/first-seen and explicit association wording; replace “causal” claims. Add selected-edge/report drill-down. Complexity Low–Medium; High product impact.
3. **Repair contracts and auth before exposing graph.** Use route dependencies and enforce report visibility; validate entity fields and cap labels. Complexity Medium; Critical reliability/security.
4. **Define a canonical entity key.** Share normalization/alias logic across extractor, report metadata, graph, and cluster query. Complexity Medium; High signal quality.

### Medium improvements

1. Persist a graph projection reliably (transactional upsert to `GraphEdge`, snapshot/rebuild on startup) or derive an API subgraph directly from `Entity`/`Report` records. A relational query/projection is enough for current SIH scale; choose one source of truth.
2. Add API filtering by date, equipment, location, activity, severity and maximum graph budget; surface active clusters as cards/subgraphs with recency and supporting reports.
3. Separate relation semantics: use a `MultiGraph` or a normalized relationship/provenance model if `violates_rule` and co-occurrence must coexist. Do not sum incompatible meanings in one weight.
4. Replace perpetual animated full graph with a filter-first, selected-neighborhood view. Pre-index IDs/maps in Canvas, reduce/reduce-motion animation, and provide keyboard/table accessibility.

### Advanced improvements

1. Add explicit temporal evidence and scoring: first/last seen, decay, SIF distribution, entity confidence, evidence count, and alert lifecycle. This offers explainability before centrality/community algorithms.
2. Introduce community/centrality/anomaly analysis only after node identity/persistence/provenance are correct; present results as ranked hypotheses, not causes.
3. Consider Neo4j/graph DB only if relational projection plus NetworkX cannot meet query/write/ownership scale, or if multi-hop graph queries become a proven requirement. It is outside immediate SIH value and adds deployment/backup/security burden.
4. GraphRAG/embeddings are optional future investigation; they do not replace deterministic cluster alerts and require governed source evidence.

# PART II — FIELD REPORTER

## 20. Product Purpose

The intended field reporter serves rig-floor technicians, drillers, derrickmen, and similar workers who have gloves, noise, limited time, varied literacy/languages, and may have unsafe/forbidden consumer-phone access. The PRD wants a worker to report → review → submit in under 15 seconds, without seeing SIF scores, graphs, or managerial complexity. Voice reduces typing friction; a direct text fallback remains necessary when audio is unusable. Both are intended to enter the same intelligence pipeline so field observations become manager-visible systemic signals.

**SPECIFICATION:** F13 specifies browser MediaRecorder to local `whisper-small`, Hindi/English demo support (technical spec additionally lists Assamese/Bengali), editable transcript, then unified `POST /api/reports/ingest` with source voice.

**FACT:** the current page targets a command-center-like industrial demo with hardware selection, risk assessment panel, and claimed interventions. It shows SIF HIGH/LOW and “automated interlocks” to the reporter—contrary to the worker simplicity requirement—and does not perform actual device, radio, kiosk, or browser recording integration.

**Source:** `SANKET_PRD.md` (personas, F13); technical spec §24; `mentor feedback.md`; `frontend/app/dashboard/voice/page.tsx`.

## 21. Current Architecture

```text
Actual page:
hardware selector + preset / fake mic timer + editable textarea
 -> POST /api/reports/ingest { raw_text, source, location, activity_type }
 -> Pydantic expects `text`, responds 422
 -> catch handler displays fabricated offline result

Separate backend endpoint, not used by page:
multipart audio -> synchronous VoiceTranscriber (Whisper base / mock)
 -> Report(source=voice) committed -> BackgroundTasks.process_report
 -> standard NLP pipeline
```

The displayed `hardwareMode` only changes a `source` string (`roip_walkie_talkie`, `is_handheld`, or `rig_kiosk`). It neither changes transport nor authenticates a device/user. The server accepts arbitrary source strings because `ReportIngestRequest.source` has no enum.

**Source:** `frontend/app/dashboard/voice/page.tsx`; `backend/api/voice_routes.py`; `backend/schemas/report.py`.

## 22. Frontend Recording System

**FACT:** `VoiceReportPage` has only React state (`inputText`, `isRecording`, `isSubmitting`, `result`, location/activity/hardware mode). `handleSimulateVoice` toggles a state flag and sets a hard-coded Pump-04 sentence after 2.5 seconds. There is no `navigator.mediaDevices`, `getUserMedia`, `MediaRecorder`, AudioContext, Blob, MIME negotiation, waveform sampling, duration timer, audio preview, microphone permission request, language selector, file upload, or `FormData`.

The textarea is editable before submit, so it is a real direct-text UI. It has HTML `required`, and the button disables on blank trimmed text, but no explicit minimum/maximum visual validation, save draft, confirmation, error toast, upload progress, transcript state, or separate success state. On failure it presents a HIGH “Offline Edge Reflex” simulation rather than telling the worker the report was not saved.

Responsiveness is a Tailwind grid (`grid-cols-1 lg:grid-cols-12`) and controls are touch-sized in places, but the page is dense, contains small text, requires typing, and has no accessible labels for the simulated mic beyond surrounding content. It does not meet the documented single-purpose mobile worker flow.

**Source:** `frontend/app/dashboard/voice/page.tsx` (`handleSimulateVoice`, `handleSubmit`, JSX form).

## 23. Backend Voice Pipeline

`POST /api/voice/transcribe-and-ingest` accepts multipart field `audio`, optional `location`, `activity_type`, `shift`. It reads the whole upload into memory with `await audio.read()`, synchronously calls `voice_transcriber.transcribe_audio_file`, substitutes a generic “Unspecified anomaly” sentence if text has fewer than three characters, creates a Report with `source="voice"`, commits it, and schedules the normal worker. It returns `job_id`, text, detected language, status, and a message.

There is no standalone `/api/voice/transcribe` endpoint despite both PRD and technical spec naming it. There is no two-step transcript-review API; the backend commits before the caller can edit. There is no request-size limit, MIME/extension allowlist, magic-byte validation, duration limit, streaming upload, audio storage, virus scan, rate limit, timeout handling, explicit HTTP error conversion, task concurrency bound, or retained original audio/provenance field. Temporary file cleanup is correctly attempted in a `finally` block after model transcription, but a failure before/while temporary file setup is not independently handled by the route.

**Source:** `backend/api/voice_routes.py` (`transcribe_and_ingest_audio`); `backend/services/report_service.py`; `backend/workers/pipeline_worker.py`.

## 24. Whisper / Speech Processing

**FACT:** `VoiceTranscriber` defaults to model size `base`, not `small`. On the first request it calls `whisper.load_model("base")`, retaining the model as a singleton for later requests. It calls Whisper `transcribe(path, fp16=False)`, so the code selects CPU-compatible FP32 behavior; it has no device configuration, model download packaging/preload guarantee, explicit language selection, beam/VAD/noise settings, or per-request timeout.

Whisper auto-detects language through the returned `result["language"]`; it has no explicit supported-language enforcement. The comments say Assamese/Hindi/Bengali/English, but actual accuracy/model language support is not tested in the repo. All filename extensions are accepted (used solely as a temp-file suffix); decoder support depends on Whisper/FFmpeg environment. No maximum recording duration/memory requirement/latency benchmark is present.

If import/model loading fails, `initialize` logs only; `transcribe_audio_file` returns a fixed English oil-seepage transcript with `mocked: true`, so the route creates a plausibly real report from unavailable speech infrastructure. This is dangerous as a production behavior. If Whisper succeeds it deletes the temp file; neither audio nor segments/duration/mocked flag are persisted or returned fully.

**IMPLEMENTED DIFFERENTLY:** PRD calls for local `whisper-small` (461 MB); technical spec describes online Groq Whisper in online mode/local small offline. Actual service always attempts local base and ignores `AI_MODE`; on failure it mocks instead of switching provider or requiring manual text.

**Source:** `ai/voice/whisper_service.py`; `requirements.txt`; `SANKET_PRD.md` F13/tech stack; technical spec §§24–25.

## 25. Transcript & Report Submission

The text submission contract expects:

```json
{"text":"...", "source":"text|voice|csv", "location":"...", "asset_id":"...", "activity_type":"...", "shift":"..."}
```

and validates `text` 3–10,000 characters. The page submits `raw_text`; Pydantic therefore rejects it before `report_service.create_report` is called. Even if fixed to `text`, `handleSubmit` ignores the successful API response and derives `sif_score`, label, rule, and escalation solely from keywords in client text. It never polls/reads the job result, thus cannot reflect the asynchronous pipeline’s true score or explanation.

The voice route bypasses the designed edit/confirm stage by ingesting immediately. It does mark Report.source as `voice`; normal text defaults source text. `Report` has `language`, `source`, `ingestion_channel`, and metadata fields, but voice route does not persist detected language, original audio, audio hash, recorder/device identity, transcript revision, or `ingestion_channel`. The worker later runs language detection on transcript text, which may differ from Whisper’s detected language.

**Source:** `backend/schemas/report.py` (`ReportIngestRequest`); `frontend/app/dashboard/voice/page.tsx` (`handleSubmit`); `backend/api/voice_routes.py`; `backend/models/report.py`.

## 26. Direct Text Fallback

**FACT:** direct text is the only functional UI input mode, but the payload defect prevents submission. Location/activity input fields are sent; shift is omitted. Worker source strings are distinguishable in persistence only if a conforming client sends them, but neither the `ReportResponse` frontend type nor the current UI shows a voice-specific provenance/audit context.

**RECOMMENDATION:** retain a concise free-text fallback but guide it with one optional structured prompt (what/where/asset), clear minimum content feedback, large submit/confirmation controls, and a truthful queued/failed state. Avoid forcing workers to classify risk, select complex equipment taxonomy, or interpret management actions.

## 27. Offline / Edge Capability

The following distinction is essential:

| Capability | Offline AI capability in code | Offline application/device/network capability in code |
| --- | --- | --- |
| E5 classifier / regex NER / NetworkX | Can run locally once model/code/assets are available | API/frontend still need a locally reachable backend; no packaged model assurance or device queue |
| Whisper | Local Python model attempted; may require first-download and FFmpeg/model availability | no browser offline recording/queue/upload retry; failure returns fake transcript |
| Database | Docker SQLite volume supports local persistence | default settings use remote PostgreSQL; no local encrypted immutable field queue/sync |
| Explainer | Ollama path used only when `AI_MODE=airgapped` | requires an available local Ollama service/model; no fallback beyond null explanation |
| Graph/cluster | NetworkX/process local and SQL can operate locally | graph is volatile; no report-to-graph integration; no sync/reconciliation |
| Frontend | static app may load if cached | no service worker, offline page, IndexedDB queue, background sync, resumable upload, or connectivity status |

`/api/system/airgap` only inspects current process connections via psutil; it does not prove the machine/network is physically air-gapped. In online mode the explainer calls Groq. SentenceTransformer/Whisper can download models if absent. Compose starts backend in `AI_MODE=online` and attaches services to a bridge network, so it is not an offline deployment configuration by default.

**Source:** `backend/main.py` (`airgap_status`); `backend/config/settings.py`; `ai/explanation/explainer.py`; `ai/voice/whisper_service.py`; `docker-compose.yml`; technical spec §25.

## 28. Industrial Deployment Reality

| Capability | Current demo | Production industrial deployment concept | SIH scope assessment |
| --- | --- | --- | --- |
| Consumer browser page | implemented as desktop-style simulator | only on approved intrinsically safe/rugged device, or outside hazardous zone | demo UI acceptable only if labelled simulation |
| ATEX/IECEx device compatibility | labels/marketing only; no certification/integration evidence | certified hardware, MDM, physical-zone procedures | outside software-only SIH build; do not claim compliance |
| VHF/UHF RoIP | source selector/copy only | gateway/audio stream, radio provisioning, PTT control, recording governance | architecture/demo storyboard, not implemented |
| Flameproof kiosk | selector/copy only | certified intercom, kiosk UI, identity, local edge gateway | production integration |
| IVR/landline/SMS/manual channels | none | six-channel mentor matrix | future/optional, not required before core flow works |
| Zero-connectivity field use | a simulated catch message only | durable local queue, local model/data, signed sync, conflict/idempotency policy | high-value production architecture; an offline queue demo is plausible SIH scope |
| Local safety reflex/siren/e-PTW lockout | UI claims only; no APIs/devices | safety-engineered, authorised OT integration with fail-safe controls | outside scope until formal safety/OT validation |

**SPECIFICATION:** mentor feedback proposes ATEX radios, IS handhelds, flameproof kiosks, RoIP, edge compute, store-and-forward and local siren/earpiece feedback. These are production concepts and judge-facing constraints—not evidence the repository implements or certifies them.

**Source:** `mentor feedback.md` §§2–5; `frontend/app/dashboard/voice/page.tsx`.

## 29. Field UX Analysis

Field conditions expose concrete failures:

- **Gloves/rush:** multiple demo selections and small text are slower than one large PTT plus confirmation. No <15-second flow has been measured.
- **Noise/wind/machinery/radio audio:** no VAD, denoising, confidence, waveform/level warning, retry, or domain vocabulary feedback exists. A fabricated transcript masks failure.
- **Low literacy/multilingual/code-switching:** the backend depends on Whisper/model behavior then `langdetect` over transcript; no language choice, reviewed translation, phonetic/domain glossary, or confidence display exists.
- **Poor/intermittent connectivity:** submission treats any error as a successful safety reflex; no local persistence means observation can be lost.
- **Accidental or incorrect reports:** no audio/transcript preview, confirm/edit workflow for actual audio, duplicate key, cancel, draft recovery, or correction audit.
- **Mobile lifecycle/battery:** no persisted draft or upload resume. A suspend/close/battery loss loses unsent state.

The worker should receive simple acknowledgement (“saved locally”, “queued”, “sent”, or “needs retry”) and immediate human-approved safety guidance only where governed. It should not see invented DCS/e-PTW/IVR completion claims.

## 30. Failure Modes

| Failure | Current behavior | Desired behavior | Severity |
| --- | --- | --- | --- |
| Mic permission denied / MediaRecorder unavailable | not requested/used | show text fallback and concise reason | 🟠 High |
| Unsupported/empty/long audio | route accepts all bytes/extension; blank transcript becomes generic report | validate MIME/signature/duration/size; reject clearly, retain manual fallback | 🔴 Critical |
| Transcription/model unavailable | hard-coded plausible transcript is submitted | explicit unavailable state; manual text or queued audio, never invent evidence | 🔴 Critical |
| Noisy/mixed-language audio | no confidence/quality handling | confidence + replay/edit/re-record/language guidance | 🟠 High |
| Network/backend unavailable | page displays fabricated local HIGH result; report not queued | durable offline queue and delivery state | 🔴 Critical |
| Ingestion schema mismatch | page request gets 422 then fake success | shared typed contract and E2E contract test | 🔴 Critical |
| Pipeline failure | report becomes FAILED in DB; page has no job tracking | status polling/push and retry/escalation workflow | 🟠 High |
| Duplicate submission | no idempotency protection | client-generated draft/report key and server dedupe policy | 🟠 High |
| Close/suspend/battery/storage loss | unsent textarea only in memory | draft persistence and store-and-forward | 🟠 High |
| Multiple submissions | unbounded FastAPI background tasks; model calls may contend | bounded worker/executor/queue, observability, backpressure | 🟡 Medium |

## 31. Security & Privacy

Voice/report endpoints lack authentication and RBAC despite JWT/RBAC helpers. Any client can upload arbitrarily large binary data and create reports. The service reads it entirely into RAM and invokes an external decoder/model without input controls. Audio is temporarily stored with a client-derived extension, deleted after successful/failed transcription, and not retained; that limits retention but provides no consent, retention schedule, secure location, chain of custody, or forensic provenance. A model-load failure turns audio into fabricated business data, which is an integrity issue more than a privacy benefit.

`JWT_SECRET` and demo credentials/defaults are present in configuration/startup patterns. Security work should move secrets to deployment configuration, disable public demo defaults, apply role/asset scope authorization, impose size/type/rate limits, log safely without raw sensitive audio/text unnecessarily, and document retention/legal requirements before recording workforce audio.

**Source:** `backend/api/voice_routes.py`; `backend/api/report_routes.py`; `backend/auth/rbac.py`; `backend/config/settings.py`; `backend/main.py`.

## 32. Field Reporter Testing

No voice recorder, upload, transcript/edit, offline, or E2E tests are present. Recommended coverage:

- browser unit/component: permission denied, no MediaRecorder, correct MIME/form data, timer/max duration, re-record/cancel, transcript edit, direct text boundaries, accessible keyboard/touch flow;
- API: authenticated multipart happy path, invalid/oversized/empty audio, decoder/model error, temporary-file cleanup, `text` schema contract, no fabricated report on failure, idempotency;
- offline: queued draft/audio, restart recovery, reconnect ordering, conflict/duplicate policy;
- integration: voice/text → Report source/language/provenance → NLP entities/LSRs → graph update → third matching report → alert/dashboard evidence.

## 33. Field Reporter Improvement Opportunities

### Quick wins

1. Fix page payload to `text`, consume the real job result/status, and clearly report failed submission. This is a P0 correctness change (Low complexity, Critical impact).
2. Either wire real MediaRecorder to a two-step transcription endpoint or label/remove the simulator from production-facing flow. Do not present simulated consequences as actual control actions (Medium, Critical).
3. Replace mock Whisper transcript fallback with explicit transcription failure and manual text/retry option (Low, Critical).
4. Add route auth/worker role plus file size/type/duration validation (Medium, Critical).

### Medium improvements

1. Build PTT recorder + preview/transcript-edit/confirm flow; propagate language, source, audio hash/reference, device/channel and correction revision to a dedicated provenance model (Medium).
2. Implement offline-first encrypted local draft/queue with submission IDs, retry/backoff, and truthful queue state; service worker/IndexedDB for browser demo or native rugged-client equivalent (High).
3. Add audio quality indication/VAD/noise-processing choice and industrial vocabulary evaluation for Hindi/Assamese/English code-switching (Medium–High).
4. Make worker UI one purpose: large PTT/text fallback and short confirmation; move SIF/graph/intervention details to the command center (Medium).

### Advanced / production architecture

1. Deploy approved ATEX/IECEx hardware and a local edge gateway only with hardware/OT owners; connect radios/kiosks/IVR through governed interfaces.
2. Package/preload a quantized supported STT model, embeddings and local database; sign/encrypt store-and-forward sync and establish data retention/audit controls.
3. Integrate safety controls only after hazard analysis, authorization, fail-safe design and DCS/e-PTW vendor validation. UI copy is not a safety interlock.

# PART III — SYSTEM INTEGRATION

## 34. Field Reporter → Intelligence Pipeline

**Current:** conforming direct API clients using `/api/voice/transcribe-and-ingest` do enter the same `process_report` path after a report is created. The visible Field Reporter does not, because it sends the wrong field and does not call voice API. The worker stores transcript as `raw_text` but loses audio/transcription provenance. Its subsequent stages create `Entity` and `LSRTag` rows.

**Desired:** field capture (voice or text) → durable locally identified draft → transcript/edit/confirmation → unified typed ingest → source/language/provenance persisted → idempotent pipeline → graph/cluster service → actionable manager alert. The worker must preserve delivery and model outcome distinction.

## 35. Intelligence Pipeline → Signal Graph

**Current:** no connection from `pipeline_worker.process_report` to `GraphStore` or `ClusterDetector`; completed reports remain relational NLP records. Graph endpoint later performs a separate, partial report-field/keyword reconstruction. Cluster route only reads pre-existing alerts, and no normal code writes one.

**Desired:** after entity and LSR persistence, perform an idempotent graph projection and cluster evaluation based on canonical durable entities; persist an alert/evidence record and notify dashboard/owner. Do not equate graph edge with causation; show supporting report/event evidence.

## 36. Cross-Component Data Contracts

| Concept | Current contract | Transformation / loss |
| --- | --- | --- |
| Report | ORM `Report`: raw/preprocessed text, language, scores, location, asset, activity, shift, source, ingestion channel, timestamps | page calls incompatible `raw_text`; voice route does not save Whisper language/audio/channel |
| Entity | `Entity(report_id, entity_type, entity_value, confidence)` | normal pipeline writes; graph lazy rebuild ignores it |
| LSR | `LSRTag(report_id, rule_name, rule_id, similarity)` | normal pipeline writes; graph lazy rebuild only uses `Report.iogp_rule` string |
| Graph node | in-memory `{label,type,report_count,last_seen,severity}` | no durable node table; serialized payload omits last_seen |
| Graph edge | in-memory type/weight/report IDs; `GraphEdge` model mirrors it | model unused; response omits report IDs |
| Cluster/alert | `SystemicAlert` exact entity group + report ID JSON | no creator runtime path; no resolution/audit/UI integration |
| Voice transcript | returned only by endpoint, stored as `Report.raw_text` | editable review is absent; no revision/audio evidence |

## 37. Current vs Intended Architecture

### Diagram A — Current implementation (verified)

```text
[Voice Page simulator] --invalid {raw_text}--> [Report API schema] --422-->
          |                                                     [fake UI result]

[Separate multipart voice API] -> [local Whisper base or mock] -> [Report]
                                                              -> [5-stage worker]
                                                              -> [Entity/LSR SQL]

[Graph Page] -> [GET signals] -> [partial report-field bootstrap] -> [volatile NetworkX]

[ClusterDetector / GraphEdge / LangGraph graph agent] ---- defined, not on normal flow ----
```

### Diagram B — Recommended architecture

```text
[Existing: field text/PTT capture]
  -> [Proposed: local draft/queue + identity/provenance]
  -> [Existing: typed report ingest]
  -> [Existing: NLP stages]
  -> [Proposed: canonical entity + graph projection service]
  -> [Proposed: transactional 7-day equipment/location cluster evaluator]
  -> [Existing/proposed: systemic_alert evidence + CAPA/manager notification]
  -> [Proposed: filtered, evidence-first graph/report drill-down]

[Optional production outside SIH core: radio/kiosk/IVR gateway, edge hardware,
OT/DCS/e-PTW integration, graph database]
```

## 38. Gap Matrix

| Capability | PRD requirement | Technical spec | Current code | Status | Gap | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Signal graph | entity graph with weighted associations | update after entities/LSRs; filterable Cytoscape serialization | volatile partial bootstrap; unused full entity graph agent | 🟠 Partial | pipeline/persistence/provenance absent | 🔴 Critical |
| Node taxonomy | equipment/location/barrier/energy | + shift/LSR | extractor supports types; visible graph mostly location/activity/rule/keywords | 🟠 Partial | real entities not rendered | 🟠 High |
| Graph persistence | graph feature available across use | periodic `graph_edges` snapshot | ORM only, zero reads/writes | 🔴 Not implemented | restart loss/inconsistency | 🔴 Critical |
| F7 multiplier | >=3 same equipment/location in 7d → HIGH | SQL check, alert/event/realtime | helper only; no invoked escalation | 🔴 Not implemented | no actual systemic detection | 🔴 Critical |
| Graph UX | interactive cluster pulse | filters, red cluster, report context | custom canvas, type filter/select only | 🟠 Partial | no evidence/time/action | 🟠 High |
| Field voice | MediaRecorder → Whisper → edit → unified ingestion | 2-step API with fallback | no recorder; backend one-step unused | 🔴 Not implemented | demo simulation, no real voice UX | 🔴 Critical |
| Text fallback | simple direct text | unified contract | textarea, but wrong key causes 422 | 🔴 Broken | report cannot submit from page | 🔴 Critical |
| Multilingual STT | Hindi/Assamese/English (and Bengali documentation) | online/offline provider policy | local base auto-detect only, no tests | 🟠 Partial | model/version/mode mismatch | 🟠 High |
| Offline operation | full offline demo | provider swap/local components | local pieces, online Compose/no queue/model packaging | 🟠 Partial | no field offline application | 🟠 High |
| Shared integration | field report strengthens graph/cluster | report completed → graph → alert/push | disconnected | 🔴 Not implemented | core product narrative unavailable | 🔴 Critical |

## 39. Technical Debt

- **Correctness:** incompatible `raw_text` vs `text` contract; successful/failed reporter simulation masks server state.
- **Coupling/source of truth:** graph endpoint derives a different model from worker; GraphStore is global mutable state and GraphEdge is dead persistence design.
- **Idempotency/concurrency:** no unique entity/report-processing protection, graph duplicate counts, unbounded `asyncio.gather` batches/background tasks, alert creation race.
- **Data quality:** raw exact strings as cross-report keys; source type casing (`Location` vs `LOCATION`); no canonical asset ID binding.
- **Reliability:** no model/audio validation, unsafe mock transcription, no queue/retry/draft lifecycle; no cluster call/resolution.
- **Security:** RBAC helpers unused, public uploads/graph data, insecure demo-oriented secret/default patterns.
- **Frontend:** hard-coded backend URL bypasses configuration/API client, Canvas claims unsupported semantics, no error/accessibility state, no real job lifecycle.
- **Tests:** no automated coverage for target components or end-to-end integration.

## 40. Recommended Architecture

Keep the modular monolith and relational database for SIH. Establish a `signal_service` boundary responsible for: canonical entity keys; idempotent per-report projection; durable evidence/edge upsert or query-derived subgraph; equipment/location rolling cluster evaluation; alert lifecycle; and a compact, authorized API read model. Have the worker call it only after entity/LSR persistence succeeds. Use a transaction/outbox-like event record or a retryable job for reconciliation rather than mutable NetworkX-only state.

For reporter, make capture transport-independent: browser PTT, kiosk/radio gateway and text all produce a versioned “field observation draft” with source/channel/device/language/audio reference/ID. Transcription produces an editable candidate; confirmation produces the existing typed report. For SIH, a browser local queue and demo audio input are enough; certified hardware and OT controls remain optional production adapters.

## 41. Prioritized Improvement Roadmap

| Priority | Item | Likely files | Complexity | Impact / SIH relevance |
| --- | --- | --- | --- | --- |
| P0 | Fix Field Reporter contract/result truthfulness; show queued/failed state | `voice/page.tsx`, `schemas/report.py`, API client/tests | Low | restores demonstrable F13 text flow |
| P0 | Remove fake Whisper report fallback; validate upload and require text fallback | `whisper_service.py`, `voice_routes.py` | Low–Medium | prevents false safety records |
| P0 | Invoke idempotent graph + cluster service after pipeline entity/LSR work | `pipeline_worker.py`, new/updated graph service, tests | Medium | delivers F6/F7 core claim |
| P0 | Persist/rebuild graph or derive subgraph from SQL; reconcile on retry | `graph_store.py`, `graph_edge.py`, startup/API | Medium | prevents restart/stale data loss |
| P0 | Apply RBAC and limits to reports/voice/graph | route modules, `rbac.py` | Medium | baseline safety/privacy |
| P1 | Wire real MediaRecorder/transcript edit (or explicit demo-only file input) | voice page/API | Medium | materially improves live demo |
| P1 | Graph evidence drill-down, recency, filter-first subgraph and cluster cards | graph API/page | Medium | lets judges/officers validate a signal |
| P1 | Seed deterministic three-event scenario and E2E test | synthetic/seed/test fixtures | Low–Medium | makes multiplier demonstrable |
| P2 | Canonical entity/asset dictionary and aliases | extractor/service/models/migration | Medium | reduces false split signals |
| P2 | Offline field queue/retry/draft | frontend + backend ingestion IDs | High | operational usefulness |
| P2 | Audio confidence/re-record/domain vocabulary evaluation | voice service/UI/test corpus | Medium–High | field robustness |
| P3 | Edge packaged models/local encrypted sync/radio-kiosk adapters | deployment/new adapters | High | production field use |
| P3 | OT action integrations, governance and audit lifecycle | external systems/security design | High | production safety only |

## 42. Top 5 Signal Graph Improvements

1. **Wire real pipeline output to F6/F7** — without this, the graph/multiplier are not operational features.
2. **Make projection durable and idempotent** — prevents restart loss, duplicates, and split-brain between SQL and NetworkX.
3. **Canonicalize equipment/location identity** — clustering exact strings is not a reliable industrial signal.
4. **Expose evidence, recency, and report drill-down** — lets an officer judge whether a connection deserves action.
5. **Add alert lifecycle + focused filters** — transforms a decorative topology into an actionable work queue; defer advanced graph analytics until this works.

## 43. Top 5 Field Reporter Improvements

1. **Fix the text payload and remove false success** — the current visible submit flow is broken.
2. **Implement actual record/transcribe/edit/confirm or label the simulator** — restores trust and fulfills F13.
3. **Never fabricate a transcription when STT fails** — safety records require provenance and truthful fallback.
4. **Secure/bound the upload and route** — prevents public arbitrary-memory audio ingestion and protects worker data.
5. **Add offline draft/queue plus status** — directly addresses the mentor’s zero-connectivity field reality, after the online core is correct.

## 44. What To Build Next

First, make one small end-to-end demonstration real: submit a conforming text field observation; process it; persist entities; update a durable graph projection; submit two more canonicalized observations for the same equipment/location; trigger exactly one systemic alert; expose the three report links in a graph/cluster card. In parallel, replace the voice page’s fake result with a working text fallback and a truthful “voice recording is demo-only/not available” state until MediaRecorder is connected. This sequence fixes correctness, proves the SIF cross-report story, and provides a reliable foundation for real PTT/offline work.

## 45. Open Questions

1. Which database is intended as authoritative in each environment: Compose SQLite, remote PostgreSQL, or an explicitly provisioned local PostgreSQL? Resolve before persistence/migrations.
2. Should cluster matching use `Report.asset_id`, extracted EQUIPMENT, LOCATION, or a canonical asset master? What aliases/renames are authoritative?
3. Are alerts meant to expire automatically when the window no longer qualifies, or remain active until a human resolves them?
4. What safety governance allows any automatic worker/DCS/e-PTW action? Until answered, present these as simulated recommendations, not executed interlocks.
5. What audio retention/consent/local data policy applies to worker/radio recordings?
6. Which actual hardware/channel integration is in scope for SIH demo versus product roadmap, and can it be safely emulated with a recorded file/demo gateway?
7. Is the deployed model intended to be Whisper base or small, and how will models/FFmpeg be preloaded for offline use?

## 46. Source / File Reference Index

### Implemented code

- `backend/main.py` — application lifecycle/router registration, classifier init, CORS and airgap status.
- `backend/config/settings.py` — DB, AI mode, SIF/cluster thresholds.
- `backend/db/engine.py` — async SQLAlchemy engine/session/table initialization.
- `backend/api/report_routes.py` — text ingestion/background scheduling and demo-500 graph mutation.
- `backend/services/report_service.py` — report creation/state transitions/listing.
- `backend/workers/pipeline_worker.py` — actual five-stage worker; no graph/cluster operation.
- `ai/agents/swarm.py` — defined but unused graph-aware LangGraph flow.
- `ai/entities/extractor.py` — entity taxonomy, patterns and local normalization.
- `ai/lsr/mapper.py`, `ai/sif/classifier.py`, `ai/preprocessing/preprocessor.py`, `ai/explanation/explainer.py` — NLP pipeline.
- `graph/graph_store.py` — singleton NetworkX model/mutation/serialization.
- `graph/clustering.py` — exact-value rolling SQL check and escalation implementation.
- `backend/api/graph_routes.py` — graph signals/clusters/stats APIs.
- `backend/models/entity.py`, `report.py`, `graph_edge.py`, `alert.py` — durable contracts and unused graph-edge persistence model.
- `backend/api/voice_routes.py`, `ai/voice/whisper_service.py` — voice ingestion/STT.
- `backend/schemas/report.py` — authoritative `text` request schema.
- `backend/auth/rbac.py`, `backend/api/auth_routes.py` — auth exists but audited routes do not use it.
- `frontend/app/dashboard/graph/page.tsx` — custom Canvas graph UX.
- `frontend/app/dashboard/voice/page.tsx` — Field Reporter simulation and invalid submit payload.
- `frontend/src/lib/api.ts`, `frontend/src/types/index.ts`, `frontend/package.json`, `requirements.txt`, `docker-compose.yml` — client contracts, dependencies and deployment context.

### Specifications/context

- `SANKET_PRD.md` — F6/F7/F13, worker persona, graph purpose, intended offline demo.
- `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md` — Sections 17/18/24/25/29, prescribed persistence, workflow and realtime recommendations.
- `mentor feedback.md` — hazardous-area, certified-hardware, zero-connectivity and store-and-forward production concepts.
- `README.md`, `task.md` — implementation claims compared against code.
- `scripts/test_classifier_calibration.py`, `scripts/test_api_endpoints.py` — existing limited test scripts; no target-component tests.
