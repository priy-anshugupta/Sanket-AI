# SANKET · AI — Safety Signal Graph
## Product, UX, Architecture & Implementation Specification

**Document purpose:** Human-readable product/engineering specification and AI implementation brief  
**Component:** Safety Signal Knowledge Graph (F6) + Near-Miss Multiplier / Systemic Risk (F7)  
**Project:** SANKET · AI — SIH26165  
**Status:** Proposed improvement specification  
**Primary goal:** Transform the existing graph from a relationship visualization into an evidence-first systemic safety intelligence and investigation interface.

---

# 1. Executive Summary

The current Safety Signal Graph demonstrates that SANKET can visualize relationships among safety-related entities such as locations, equipment, activities and Life-Saving Rules. However, the current experience does not communicate the most important information to an HSE manager or site officer:

> **What is happening, where is it happening, why does it matter, what evidence supports it, what is connected to it, and what should I investigate next?**

The graph currently answers primarily:

> **“What things are connected?”**

The improved graph must answer:

> **“What safety situation is developing, where is it occurring, why has SANKET identified it, what evidence supports that conclusion, what related risks are present, and what should the user investigate?”**

This document defines the required transformation.

The existing graph visualization should **not** be discarded. NetworkX and the current interactive graph can remain part of the implementation. The major change is that the graph must become an **evidence-first systemic safety intelligence layer**, with the visualization acting as the navigation surface for structured safety information.

The desired experience is:

```text
RAW REPORTS
    ↓
SANKET NLP / AI PIPELINE
    ↓
STRUCTURED SAFETY INFORMATION
    ↓
ENTITY NORMALIZATION
    ↓
GRAPH PROJECTION
    ↓
TEMPORAL CORRELATION
    ↓
SYSTEMIC SAFETY SIGNAL
    ↓
GRAPH VISUALIZATION
    ↓
USER SELECTS SITE / SIGNAL / EQUIPMENT
    ↓
SITUATION / SIGNAL INTELLIGENCE VIEW
    ↓
SUPPORTING EVIDENCE + TIMELINE + RELATIONSHIPS
    ↓
INCIDENT INSPECTOR
    ↓
INVESTIGATION / CAPA
```

The graph therefore becomes a **decision-support and investigation tool**, not merely a network diagram.

---

# 2. Source and Scope

This document is based on the current SANKET repository analysis and the project's existing requirements/specifications.

Primary source documents:

- `SANKET_PRD.md`
- `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`
- `SANKET_COMPONENT_DEEP_ANALYSIS.md`
- `README.md`
- `task.md`

The PRD defines the Safety Signal Knowledge Graph as F6 and the Near-Miss Multiplier as F7. F6 is intended to connect equipment, locations and barrier failures through weighted co-occurrence relationships. F7 is intended to detect three or more correlated minor anomalies involving the same equipment or location within a seven-day rolling window and elevate the resulting cluster to HIGH risk.

The technical specification defines the graph as Layer 2 of the architecture. It specifies NetworkX as the in-memory computation layer, `graph_edges` as the durability layer, entity/LSR-driven graph updates after the NLP stages, and SQL-based rolling-window cluster detection.

This document adds the product/UX interpretation needed to make those capabilities useful to humans.

---

# 3. The Fundamental Product Problem

SANKET's overall purpose is:

```text
RAW SAFETY DATA
        ↓
INDIVIDUAL INTELLIGENCE
        ↓
SYSTEMIC INTELLIGENCE
        ↓
ACTIONABLE INTERVENTION
```

The graph belongs primarily to **Systemic Intelligence**.

A single report can tell us:

> “A worker observed an unstable excavation near a crane.”

That is useful, but it is an individual observation.

The graph should help answer:

> “Has this same equipment, location, activity, barrier, or safety condition appeared repeatedly across different reports?”

For example:

```text
Report 1
Pump-04 + vibration
        ↓
Report 2
Pump-04 + oil leakage
        ↓
Report 3
Pump-04 + seal failure
        ↓
SYSTEMIC SIGNAL
```

The value is not the existence of the three reports individually.

The value is recognizing that:

> **A recurring pattern is developing around Pump-04.**

That is the reason the graph and temporal cluster system exist.

---

# 4. Current State — What the Graph Does Today

The current repository contains a real NetworkX graph implementation and a graph frontend.

The graph currently provides:

- entity nodes
- weighted relationships
- node selection
- node filtering
- zooming
- panning
- node dragging
- connected-node inspection
- incident counts
- severity information
- a graph statistics display
- a “critical hub” concept

However, the current implementation has major limitations.

## 4.1 Data integration gap

The normal report processing worker does not currently update the graph after processing a report.

The normal flow is effectively:

```text
Report
  ↓
Preprocessing
  ↓
SIF classification
  ↓
Entity extraction
  ↓
LSR mapping
  ↓
Explanation
  ↓
Database
```

The graph is not consistently inserted into this flow.

Instead, the graph endpoint can perform a separate partial reconstruction from report fields.

This means the graph is not yet a reliable projection of the actual structured intelligence produced by the NLP pipeline.

## 4.2 Persistence gap

The repository contains a `GraphEdge` database model, but the current graph state is process-local NetworkX state.

The intended architecture is:

```text
NetworkX
    ↓
Graph computation / query
    ↓
GraphEdge persistence
    ↓
Database durability
```

The current implementation does not fully achieve this.

A backend restart can therefore cause graph state to disappear and be partially rebuilt.

## 4.3 Entity coverage gap

The NLP entity extractor produces multiple entity types, including:

- EQUIPMENT
- LOCATION
- BARRIER_FAILURE
- ENERGY_SOURCE
- SHIFT_TIME
- WEATHER_CONDITION
- PPE_STATUS
- BODY_PART

The current graph reconstruction does not consistently use the durable extracted entity records.

As a result, important safety context can be missing from the graph.

## 4.4 Relationship semantics gap

The current graph primarily represents co-occurrence.

It does not have enough evidence metadata to explain:

- why two nodes are connected
- which reports created the relationship
- how recent the relationship is
- whether the relationship is strong or weak
- whether the relationship represents co-occurrence, location, LSR violation, or another relationship type

The UI also uses language such as “causal edges”, while the implementation does not establish causality.

This must be corrected.

**A co-occurrence relationship must never be presented as proof of causation.**

## 4.5 Temporal intelligence gap

The graph visualization does not sufficiently communicate:

- first seen
- last seen
- recent activity
- trend
- seven-day event count
- escalation
- whether a signal is emerging or historical

A total incident count alone is insufficient.

---

# 5. Product Vision for the Improved Graph

The improved graph should be treated as a:

> **Systemic Safety Intelligence Map**

Its purpose is to surface safety situations and provide a path into their evidence.

The system should make the following hierarchy explicit:

```text
SITE
  ↓
SAFETY SIGNAL
  ↓
SYSTEMIC RISK / CLUSTER
  ↓
EVIDENCE
  ↓
INDIVIDUAL INCIDENT
  ↓
ACTION
```

The graph should answer five questions immediately:

1. **What is happening?**
2. **Where is it happening?**
3. **How serious/current is it?**
4. **Why does SANKET believe it is a meaningful signal?**
5. **What evidence and relationships support it?**

A sixth question should then be easy to answer:

6. **What should I investigate next?**

---

# 6. Core Design Principle: The Graph Must Tell a Story

The current screen is visually network-centric.

The improved screen should be **intelligence-centric**.

Current mental model:

```text
NODE → NODE → NODE → NODE
```

Desired mental model:

```text
SAFETY SITUATION
       ↓
WHY IT MATTERS
       ↓
WHERE
       ↓
WHAT IS INVOLVED
       ↓
EVIDENCE
       ↓
CONNECTED RISKS
       ↓
INVESTIGATION
```

The graph is still present, but the user should never be required to reverse-engineer the meaning of the network manually.

---

# 7. Graph Conceptual Model

The graph should distinguish between different conceptual categories.

## 7.1 Site / Location

Examples:

- Well Pad 7
- Duliajan Plant
- Digboi Pad 14
- Tengakhat Station

A location should have a safety identity.

Example:

```text
Well Pad 7

Asset Type:
Oil Production Well Pad

Operating Context:
Drilling / Workover

Current Risk:
SYSTEMIC

Reports — 7 days:
17

SIF Precursors:
6

Active Signals:
3
```

## 7.2 Safety Signal

Examples:

- Energy Isolation
- Ground Disturbance
- Line of Fire
- Working at Height

A signal represents a recurring or meaningful safety pattern.

## 7.3 Equipment

Examples:

- BOP
- Pump-04
- Wellhead
- Crane
- Valve
- Pipeline

Equipment should be linked to reports and signals with evidence.

## 7.4 Safety Context

Examples:

- Barrier failure
- Energy source
- Activity
- Shift
- Weather
- PPE status
- Life-Saving Rule

These provide explanatory context.

## 7.5 Systemic Risk Cluster

A systemic cluster is a higher-level safety situation generated when the temporal correlation rule is satisfied.

Example:

```text
SYSTEMIC RISK CLUSTER

Location:
Well Pad 7

Signal:
Energy Isolation

Evidence:
6 reports

Window:
7 days

Status:
ACTIVE

Trend:
INCREASING
```

This should be visually distinct from ordinary nodes.

---

# 8. Required User Experience

## 8.1 Initial Graph View

When the user first opens `/graph`, the system should prioritize active systemic signals.

The user should not have to inspect 28 nodes to discover the important one.

The graph should visually prioritize:

1. active systemic clusters
2. high-risk signals
3. recently active sites
4. strongly supported relationships
5. ordinary historical context

Unrelated or low-value nodes should be visually de-emphasized when a systemic cluster is selected.

## 8.2 Top-Level Summary

The page should communicate the current situation above or alongside the graph.

Example:

```text
ACTIVE SYSTEMIC SIGNAL

Well Pad 7 — Energy Isolation

6 related precursor reports detected
within the last 7 days.

CRITICAL · INCREASING · Last observed 42 min ago

[Investigate Signal]
```

This is significantly more useful than:

```text
Critical Hub Spotlight: Energy Isolation (26 Incidents)
```

because it communicates:

- what
- where
- count
- time window
- current state
- trend
- action

---

# 9. Node Click Behavior

Clicking a node should no longer simply provide telemetry.

It should open an **Intelligence Drawer**.

The drawer should change depending on what was selected.

---

# 10. Location Node — Site Situation View

When a user selects a location:

```text
WELL PAD 7
Oil Production Well Pad
Upper Assam
```

show:

## Current Situation

```text
SYSTEMIC RISK

17 reports in the last 7 days
6 SIF precursor reports
3 active safety signals
Risk trend: INCREASING
Latest observation: 42 min ago
```

## What is happening?

Generate a concise grounded summary from structured evidence.

Example:

> Repeated energy-isolation and line-of-fire observations are occurring during drilling and lifting activities at Well Pad 7. Multiple reports within the rolling seven-day window indicate recurring control weaknesses rather than isolated observations.

The summary must be grounded in actual reports/entities and must not invent facts.

## Active Safety Signals

```text
🔴 Energy Isolation        6 reports
🔴 Line of Fire            5 reports
🟠 Ground Disturbance      4 reports
🟡 Working at Height       2 reports
```

Each signal should be clickable.

## Affected Equipment

```text
BOP
Wellhead
Crane
Valve
```

## Recent Evidence

Show the most recent supporting reports.

Each report should include:

- timestamp
- short summary
- SIF label
- location
- relevant signal/entity

Clicking a report should open the existing Incident Inspector.

---

# 11. Safety Signal Node — Signal Investigation View

When a user selects:

```text
Energy Isolation
```

show:

## Signal Identity

```text
ENERGY ISOLATION

Type:
Safety Signal / LSR-related pattern

Status:
SYSTEMIC

Severity:
CRITICAL

Confidence:
[computed from evidence, if supported]

Last observed:
42 min ago
```

## What is happening?

Example:

> Energy-isolation observations are recurring across multiple reports, with the strongest concentration at Well Pad 7 and repeated involvement of BOP and wellhead-related operations.

Again, the statement must be generated from actual evidence.

## Why was this signal raised?

This section is essential.

Example:

```text
WHY THIS SIGNAL WAS RAISED

✓ 6 supporting reports
✓ 4 reports at Well Pad 7
✓ 3 reports within the rolling 7-day threshold
✓ 4 reports associated with SIF potential
✓ Repeated relationship with BOP / Wellhead
✓ Latest observation occurred 42 min ago
```

This provides explainability without requiring the user to understand the graph algorithm.

## Related Entities

```text
Equipment
• BOP
• Wellhead
• Valve

Locations
• Well Pad 7
• Tengakhat Station

Activities
• Drilling
• Workover

Related LSR
• Energy Isolation
```

## Evidence

List supporting reports.

---

# 12. Equipment Node — Equipment Risk View

When a user selects:

```text
Pump-04
```

show:

```text
PUMP-04

Equipment

Risk Status:
RECURRING

Reports:
8

Last observed:
Today 08:41

Associated signals:
• Vibration
• Leakage
• Barrier Failure

Affected locations:
• Well Pad 7

Related barriers:
• Seal integrity
• Isolation verification
```

Then show the timeline and reports.

The purpose is to answer:

> **“What is happening around this asset?”**

---

# 13. Relationship Inspection

A major improvement should be the ability to inspect **why a connection exists**.

Example:

```text
Ground Disturbance
        │
        │
      Crane
```

Selecting the relationship should display:

### Relationship Evidence

```text
Ground Disturbance ↔ Crane

Relationship:
Co-occurrence

Supporting reports:
4

First observed:
22 Aug

Last observed:
28 Aug

Association strength:
Strong
```

Then list the evidence:

```text
28 Aug
Crane setup reported near unstable ground

26 Aug
Ground disturbance observed during lifting

24 Aug
Crane activity reported near excavation

22 Aug
Unstable soil observed during lifting
```

The user should be able to inspect each report.

---

# 14. Relationship Semantics

Relationships must be explicitly typed.

Minimum supported semantics:

### `co_occurred_with`

Two entities appeared in the same report.

### `located_at`

An entity is associated with a location.

### `violates_rule`

An entity/report is associated with an IOGP Life-Saving Rule violation.

Additional relationships can be added only when their evidence and semantics are clearly defined.

Do not call a relationship “causal” unless the system has a genuine causal model.

Preferred UI terminology:

- Association
- Evidence Link
- Co-occurrence
- Shared Location
- Shared Equipment
- LSR Relationship

Avoid:

- Causal Edge
- Causal Pathway
- Cause

unless causality has actually been established.

---

# 15. Timeline — Required

Every systemic signal and important site should have a timeline.

Example:

```text
GROUND DISTURBANCE — WELL PAD 7

22 Aug   ● LOW
24 Aug   ● MEDIUM
26 Aug   ● HIGH
28 Aug   ● HIGH
                  ↑
             Increasing
```

The timeline should show:

- date/time
- report count
- SIF label
- escalation state
- relevant signal/entity

This is more useful than an aggregate count because it communicates **change over time**.

---

# 16. Current vs Historical Information

Every important graph object should distinguish:

### Total history

```text
26 total incidents
```

from:

### Current activity

```text
6 reports in last 7 days
```

and:

### Recent activity

```text
Last observed 42 minutes ago
```

and:

### Trend

```text
Increasing
Stable
Decreasing
```

The user must not mistake historical frequency for current risk.

---

# 17. Systemic Cluster Investigation

When F7 detects a systemic cluster, the graph should create an investigation-oriented view.

Example:

```text
SYSTEMIC RISK CLUSTER #17

Well Pad 7
Energy Isolation

6 reports
7-day window
3+ event threshold satisfied

Status:
ACTIVE

Trend:
INCREASING
```

## Cluster explanation

Example:

> Six reports associated with Well Pad 7 and energy-isolation conditions were recorded during the rolling seven-day window. The repeated observations indicate a recurring safety-control pattern requiring site-level investigation.

## Supporting evidence

List every report contributing to the cluster.

## Connected safety entities

```text
BOP
Wellhead
Valve
Drilling
Line of Fire
Energy Isolation
```

## Recommended investigation

This should be conservative and grounded.

Example:

> Verify energy-isolation and exclusion-zone controls associated with the affected drilling activities before continued work.

The system should recommend investigation, not autonomously declare that a physical control must be shut down.

---

# 18. “Why This Matters” Section

Every systemic signal should contain a concise explanation of operational significance.

Example:

```text
WHY THIS MATTERS

This pattern is no longer an isolated observation.
Multiple independent reports indicate recurring
control weakness at the same operational location.

The latest reports show continued exposure,
increasing the value of immediate site review.
```

This should be based on:

- recurrence
- severity
- recency
- affected barrier
- energy source
- equipment/location
- LSR association

It must not invent causal conclusions.

---

# 19. “What Should I Investigate?” Section

The graph should eventually guide the user toward investigation.

Possible evidence-based investigation areas:

```text
1. Verify energy isolation controls
2. Review recent BOP / wellhead observations
3. Inspect affected exclusion zones
4. Review related LSR compliance
5. Review the six supporting reports
```

The user should be able to create or navigate to a CAPA action from this area where appropriate.

The system remains decision support.

Human review is required for consequential decisions.

---

# 20. Graph-to-Incident Inspector Integration

The graph should not duplicate the entire incident-report interface.

Instead:

```text
GRAPH
  ↓
SIGNAL / SITE
  ↓
SUPPORTING REPORT
  ↓
INCIDENT INSPECTOR
```

The existing Incident Inspector already has the conceptual components required for deep report investigation:

- raw report
- entities
- SIF score
- LSR rule
- explanation
- graph context
- action controls

Therefore the graph should become a navigation surface into that existing investigation system.

---

# 21. Graph-to-CAPA Integration

For an active systemic signal, the graph should expose an action path:

```text
SYSTEMIC SIGNAL
       ↓
INVESTIGATE
       ↓
VIEW EVIDENCE
       ↓
CREATE / OPEN CAPA
```

The graph itself should not become a complete CAPA management system.

It should provide enough context for the user to decide whether a CAPA action is appropriate.

---

# 22. Visual Hierarchy

The graph must avoid the problem:

> Everything looks important, therefore nothing looks important.

Recommended visual priority:

```text
SYSTEMIC CLUSTER
    ↓
ACTIVE SIGNAL
    ↓
CURRENT SITE
    ↓
IMPORTANT EQUIPMENT
    ↓
SUPPORTING CONTEXT
    ↓
HISTORICAL / LOW-RELEVANCE NODES
```

When a cluster is selected:

- relevant nodes remain visually strong
- supporting edges become prominent
- unrelated nodes fade
- supporting reports become available
- the investigation drawer becomes the primary information surface

---

# 23. Graph Summary Metrics

The current:

```text
28 Nodes
123 Causal Edges
```

should be replaced or supplemented with metrics that have operational meaning.

Preferred:

```text
28 Safety Entities
17 Active Sites
6 Systemic Signals
42 Evidence Relationships
3 Active Clusters
```

If edge counts are shown, call them:

- Associations
- Evidence Relationships
- Safety Relationships

not “Causal Edges”.

---

# 24. Recommended Main Screen Layout

A recommended high-level structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ SAFETY SIGNAL INTELLIGENCE                                  │
│                                                             │
│ [Active Signals: 3] [Systemic Clusters: 2] [Sites: 17]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ACTIVE SYSTEMIC SIGNAL                                      │
│                                                             │
│ 🔴 Well Pad 7 — Energy Isolation                            │
│ 6 reports · 7 days · Increasing · Last seen 42 min ago     │
│                                                             │
│ [Investigate Signal]                                        │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────────────┬─────────────────────────┐
│                                   │ SIGNAL / SITE           │
│                                   │ INTELLIGENCE            │
│                                   │                         │
│          GRAPH                    │ What's happening?       │
│                                   │                         │ Why raised?       │
│       SITE / SIGNAL               │ Evidence               │
│       RELATIONSHIPS               │ Timeline               │
│                                   │ Connected entities      │
│                                   │ [View reports]          │
│                                   │ [Create action]         │
└───────────────────────────────────┴─────────────────────────┘
```

The exact visual layout can evolve, but the information hierarchy should remain.

---

# 25. Backend Data Model

The graph frontend should consume structured intelligence rather than reconstructing meaning from raw report text.

A conceptual `SafetySignal` response should contain:

```json
{
  "signal_id": "...",
  "signal_type": "SYSTEMIC",
  "title": "Energy Isolation",
  "status": "ACTIVE",
  "severity": "HIGH",
  "confidence": 0.91,

  "site": {
    "id": "...",
    "name": "Well Pad 7",
    "type": "Oil Production Well Pad"
  },

  "summary": "...",
  "why_raised": [
    "...",
    "..."
  ],

  "time_window": {
    "days": 7,
    "event_count": 6,
    "first_seen": "...",
    "last_seen": "..."
  },

  "trend": "INCREASING",

  "evidence": {
    "report_ids": ["...", "..."],
    "count": 6
  },

  "entities": {
    "equipment": ["BOP", "Wellhead"],
    "locations": ["Well Pad 7"],
    "activities": ["Drilling"],
    "barriers": ["Isolation verification"],
    "energy_sources": ["Pressure"]
  },

  "lsr_rules": [
    {
      "name": "Energy Isolation",
      "rule_id": 3,
      "similarity": 0.87
    }
  ],

  "relationships": [
    {
      "source": "Energy Isolation",
      "target": "BOP",
      "type": "co_occurred_with",
      "evidence_count": 4,
      "report_ids": ["...", "..."]
    }
  ],

  "recommended_investigation": "..."
}
```

This is a conceptual contract, not permission to blindly create every field immediately.

Only fields supported by reliable underlying data should be exposed.

---

# 26. Graph Node Data Contract

Each node should have enough information for the UI to explain it.

Minimum conceptual fields:

```text
id
canonical_id
label
type

report_count
distinct_report_count

first_seen
last_seen

current_severity
systemic_status
trend

supporting_report_ids

confidence
```

Important distinction:

`report_count` should mean **distinct supporting reports**, not number of times the same report happened to mutate the graph.

---

# 27. Graph Edge Data Contract

Minimum conceptual fields:

```text
id

source
target

relationship_type

weight
distinct_report_count

first_seen
last_seen

supporting_report_ids

confidence
```

The graph API should expose supporting report IDs because explainability depends on evidence.

The frontend can then retrieve detailed report information when the user requests it.

---

# 28. Entity Canonicalization

Entity identity is foundational.

The following should ideally resolve to the same canonical equipment:

```text
Pump 4
Pump-04
pump 04
P-04
```

when the system has sufficient evidence that they represent the same asset.

Canonicalization should be centralized.

The same canonical identity should be used by:

- entity extraction
- graph construction
- cluster detection
- analytics
- incident relationships
- search
- site/equipment filtering

Do not implement separate normalization logic in every subsystem.

---

# 29. Idempotency

Graph updates must be idempotent.

If report `R123` is processed twice:

```text
First processing:
Pump-04 ↔ Vibration
weight = 1

Retry:
Pump-04 ↔ Vibration
```

must **not** become:

```text
weight = 2
```

if the metric is intended to represent distinct supporting reports.

Instead:

```text
distinct supporting reports = 1
```

The graph and cluster system must distinguish:

- processing attempts
- distinct reports
- evidence relationships

This is critical for reliable systemic detection.

---

# 30. Near-Miss Multiplier — Required Baseline

Do not invent a different threshold unless the product team explicitly changes the requirement.

The current specification baseline is:

```text
For each EQUIPMENT or LOCATION node:

events_in_window =
    count of distinct reports mentioning the node
    within the rolling 7-day window

if events_in_window >= 3:

    SYSTEMIC_RISK_CLUSTER
    ↓
    elevate connected reports to HIGH
    ↓
    create SystemicAlert
```

The window and threshold are configurable in the existing design.

Default:

```text
7 days
3 distinct reports
```

The cluster query should be based on durable entity/report data rather than requiring graph traversal.

---

# 31. Cluster Escalation Semantics

When a systemic cluster fires:

- the connected reports are elevated to HIGH according to the PRD
- the original SIF score must remain preserved
- the escalation reason must be recorded
- the systemic alert must contain supporting report IDs
- the alert must have an active/resolved lifecycle
- the UI must clearly distinguish raw SIF classification from systemic escalation

Example:

```text
Original SIF:
MEDIUM
Score:
0.61

Systemic override:
HIGH

Reason:
Systemic cluster detected

Cluster:
Well Pad 7 / Energy Isolation

Alert:
SYS-0017
```

Do not overwrite the underlying score simply to make the UI say HIGH.

---

# 32. Cluster Lifecycle

A systemic cluster should have a lifecycle.

Minimum conceptual states:

```text
ACTIVE
ACKNOWLEDGED
UNDER_REVIEW
RESOLVED
```

The exact states can be kept simpler for SIH if necessary, but the system must avoid creating permanent unexplained red alerts.

The user should be able to understand:

- when the cluster was detected
- why it was detected
- what reports caused it
- whether it is still active
- whether someone reviewed it

---

# 33. Temporal Intelligence

The system should eventually support:

### First seen

When the signal was first observed.

### Last seen

Most recent supporting report.

### Event count

Number of distinct reports within the selected window.

### Historical count

Total number of supporting reports.

### Trend

Derived from the distribution of observations over time.

Possible display:

```text
Historical:
26 reports

Last 7 days:
6 reports

Last 24 hours:
3 reports

Latest:
42 min ago

Trend:
↑ Increasing
```

Trend logic should be deterministic and explainable.

Do not use an opaque AI-generated trend when simple evidence-based computation is sufficient.

---

# 34. Filtering

The graph should eventually support:

- date range
- location
- equipment
- activity
- node type
- severity
- systemic status
- minimum evidence/relationship weight

The technical specification already anticipates filtering by date range, location and equipment.

Filtering should be applied server-side where appropriate rather than downloading an enormous graph and hiding nodes only in the browser.

---

# 35. Search

Add graph search.

Example:

```text
Search:
Pump-04
```

should find:

```text
Pump-04
```

and allow the user to jump directly to its intelligence view.

Search should support canonical entity identity where possible.

---

# 36. Graph Scope / Progressive Disclosure

Do not show the entire enterprise graph at maximum detail by default.

Recommended levels:

## Level 1 — Enterprise / Site overview

```text
Well Pad 7       🔴
Moran OCS-3       🟠
Duliajan Plant    🟢
```

## Level 2 — Site situation

```text
Well Pad 7

Energy Isolation
Line of Fire
Ground Disturbance
Working at Height
```

## Level 3 — Signal investigation

```text
Energy Isolation

BOP
Wellhead
Valve
Drilling
```

## Level 4 — Evidence

```text
Supporting reports
```

## Level 5 — Incident Inspector

```text
Full report investigation
```

This is much easier to understand than displaying every relationship at once.

---

# 37. Explainability Requirements

Every major system conclusion must be explainable.

For a systemic signal, the user should be able to answer:

```text
Why is this HIGH?
Why is this systemic?
Why are these nodes connected?
Which reports support it?
When did it start?
When was it last observed?
What threshold was satisfied?
```

The UI should provide these answers without requiring the user to inspect code or understand NetworkX.

---

# 38. AI-Generated Text Requirements

AI-generated explanations can be useful, but they must be grounded.

The explanation should be based on:

- actual report text
- extracted entities
- LSR tags
- temporal event count
- location/equipment context
- SIF results

The AI must not invent:

- equipment failures not present in evidence
- causal relationships
- physical conditions not reported
- actions already taken
- sensor readings
- DCS state
- operator actions

Preferred wording:

> “Reports indicate repeated observations involving…”

rather than:

> “The pump is failing because…”

unless the evidence actually establishes that fact.

---

# 39. Safety Language Requirements

The graph is an HSE decision-support system.

Therefore:

### Allowed

- detected
- observed
- associated
- recurring
- correlated
- supported by
- evidence indicates
- requires review
- warrants investigation

### Avoid unless technically established

- caused
- guaranteed
- will fail
- will explode
- certain
- proven causal relationship

This is especially important because the graph currently visually suggests causality.

---

# 40. Performance Requirements

The system should prioritize meaningful subgraphs.

Do not attempt to continuously render an unbounded enterprise graph.

Recommended approach:

```text
API
 ↓
filtered graph
 ↓
relevant nodes/edges
 ↓
frontend renderer
```

The frontend should not need to receive thousands of irrelevant nodes.

Rendering should also avoid unnecessary per-frame searches.

If the current Canvas renderer is retained:

- index nodes by ID
- avoid repeated `find()` calls during animation
- reduce unnecessary animation
- support reduced-motion behavior
- render only the necessary subgraph
- separate simulation/layout state from UI state

A migration to Cytoscape.js should only happen if it provides measurable value.

The technical specification names Cytoscape.js, but the current frontend uses a custom Canvas renderer. The goal is not technology conformity for its own sake; the goal is a reliable and usable graph.

---

# 41. Persistence Architecture

Recommended conceptual flow:

```text
Report completed
      ↓
Canonical entities + LSR tags
      ↓
Graph projection service
      ↓
NetworkX computation state
      ↓
GraphEdge persistence
      ↓
Cluster evaluator
      ↓
SystemicAlert
```

On startup:

```text
Database
   ↓
GraphEdge records
   ↓
Rebuild NetworkX
   ↓
Graph ready
```

The graph must not depend on the frontend or a random report reconstruction to restore itself.

---

# 42. Source of Truth

The system should establish a clear source of truth.

Recommended:

```text
Reports / Entities / LSR tags
        ↓
Durable safety evidence
        ↓
Graph projection
        ↓
Systemic alerts
```

NetworkX should be treated as a computation/query projection.

It should not become the only durable source of safety evidence.

This allows the system to rebuild or validate the graph from relational data.

---

# 43. Graph Projection Service

The recommended architecture is a dedicated service such as:

```text
backend/services/graph_service.py
```

or an equivalent existing service.

Responsibilities:

1. receive a completed report's structured entities
2. canonicalize identities
3. create/update nodes
4. create/update relationships
5. maintain distinct report membership
6. persist graph relationships
7. expose graph query operations
8. provide evidence metadata

Routes should remain thin.

Business logic should not be embedded directly inside `/api/graph/*`.

---

# 44. Cluster Service

The cluster detector should be treated as a separate business service.

Conceptual responsibility:

```text
cluster_service
```

Responsibilities:

1. identify affected equipment/location nodes
2. query distinct reports in the configured rolling window
3. determine whether threshold is satisfied
4. create/update systemic alerts
5. escalate connected reports
6. preserve original SIF scores
7. store override reason
8. expose cluster evidence
9. handle idempotency
10. manage alert lifecycle

---

# 45. Normal Report Processing Integration

The desired processing flow is:

```text
POST report
      ↓
Report = PENDING
      ↓
NLP processing
      ↓
Entities + LSR tags saved
      ↓
Graph projection
      ↓
Cluster evaluation
      ↓
Systemic alert if threshold satisfied
      ↓
Report / alert status updated
      ↓
Frontend notified
```

The graph should not be rebuilt later as a side effect of opening the graph page.

---

# 46. Realtime Updates

The technical specification proposes a WebSocket event such as:

```text
cluster.created
```

and report-related events.

The graph should eventually update when:

- a new report completes
- a graph relationship is created
- a systemic cluster is detected
- a systemic cluster changes status

The graph does not necessarily need a fully animated real-time physics simulation.

A simple pattern is sufficient:

```text
New systemic signal detected
        ↓
Toast / alert
        ↓
Graph refresh
        ↓
Affected cluster highlighted
```

---

# 47. API Requirements

The graph API should evolve toward at least:

```text
GET /api/graph/signals
GET /api/graph/clusters
```

with filtering.

Possible query parameters:

```text
date_from
date_to
location
equipment
activity
node_type
severity
min_weight
systemic_only
```

The exact API contract should be implemented consistently with the repository's existing API conventions.

A node/signal detail endpoint may also be useful:

```text
GET /api/graph/signals/{id}
```

or an equivalent service-backed detail response.

It should return:

- identity
- current status
- summary
- evidence
- timeline
- connected entities
- supporting reports
- recommended investigation
- related systemic alerts

Do not create redundant endpoints if an existing report/inspector API can provide the information cleanly.

---

# 48. Frontend Interaction Model

## Node click

Opens intelligence drawer.

## Relationship click

Opens relationship evidence.

## Report click

Opens Incident Inspector.

## Cluster click

Focuses the systemic cluster and opens cluster investigation.

## Location click

Shows site situation.

## Search

Focuses matching node.

## Filter

Updates graph and summary metrics.

## Reset

Returns to the current prioritized safety view.

---

# 49. Accessibility

A graph must not be the only way to understand the information.

Provide an alternative structured representation.

For example:

```text
Active Signals

1. Well Pad 7 — Energy Isolation
   6 reports · Increasing
   [Investigate]

2. Digboi Pad 14 — Ground Disturbance
   4 reports · Stable
   [Investigate]
```

This also improves usability on mobile, touch devices and lower-powered machines.

Keyboard navigation and accessible labels should be considered for interactive elements.

---

# 50. Mobile / Responsive Behavior

The graph is primarily a command-center tool, but responsive behavior should remain usable.

On smaller screens:

```text
Graph
 ↓
Tap node
 ↓
Full-width intelligence sheet
```

The intelligence drawer should not become a tiny unreadable panel.

The user should be able to:

- inspect
- view evidence
- open a report
- return to graph

without losing context.

---

# 51. Security and Authorization

Graph data can contain operationally sensitive information.

Graph endpoints should use the project's authentication/RBAC architecture.

At minimum:

- authenticated access
- appropriate role restrictions
- report visibility checks
- no leakage of reports a user is not authorized to see
- safe handling of entity strings
- validated query parameters

Do not leave the graph publicly accessible simply because the graph is “read-only”.

---

# 52. Auditability

Systemic escalation should be auditable.

For every alert, preserve:

```text
alert_id
cluster_node
cluster_type
event_count
window_days
report_ids
created_at
status
escalation_reason
```

For escalated reports, preserve:

```text
original_sif_score
original_sif_label
systemic_override
systemic_alert_id
```

This allows an officer to understand:

> “Why did this report become HIGH?”

---

# 53. Testing Requirements

## Graph unit tests

Test:

- node creation
- canonical identity
- duplicate report processing
- edge creation
- relationship semantics
- distinct report counting
- report membership
- first/last seen
- severity aggregation
- serialization
- graph rebuild

## Cluster tests

Test:

- 2 reports → no cluster
- 3 distinct reports → cluster
- 4+ reports → cluster
- exactly 7-day boundary
- outside window
- duplicate report processing
- different entity spellings
- overlapping clusters
- existing active alert
- alert resolution
- concurrent escalation

## API tests

Test:

- authentication
- filters
- empty graph
- invalid filters
- detail responses
- report evidence
- unauthorized access

## End-to-end test

The most important test:

```text
Report 1
 ↓
Entity extraction
 ↓
Graph update

Report 2
 ↓
Entity extraction
 ↓
Graph update

Report 3
 ↓
Entity extraction
 ↓
Graph update
 ↓
Cluster threshold reached
 ↓
SystemicAlert created
 ↓
Reports escalated
 ↓
Graph cluster highlighted
 ↓
User clicks cluster
 ↓
Evidence displayed
 ↓
User clicks report
 ↓
Incident Inspector opens
```

This is the core product story and should be demonstrably functional.

---

# 54. Demo Dataset Requirements

The project specification describes seeded systemic clusters.

The graph improvement should use these deliberately.

Example:

```text
Cluster A
Well Pad 7
3 oil-leak reports
Days 1 / 3 / 5

Cluster B
Compressor C-02
4 vibration/noise reports
Days 2 / 4 / 5 / 6
```

The demo should visibly show:

```text
ordinary reports
      ↓
recurring pattern
      ↓
systemic cluster
      ↓
red / critical highlight
      ↓
investigation drawer
      ↓
supporting evidence
```

The demo should not rely on fabricated UI-only results.

---

# 55. Recommended Information Architecture

The graph should expose these concepts in this order:

```text
CURRENT RISK
    ↓
LOCATION
    ↓
SAFETY SIGNAL
    ↓
WHY IT WAS RAISED
    ↓
TIMELINE
    ↓
CONNECTED ENTITIES
    ↓
SUPPORTING REPORTS
    ↓
INVESTIGATION
    ↓
ACTION
```

This is the most important UX change in this specification.

---

# 56. Priority Classification

## P0 — Correctness and Integration

These should be completed before advanced graph features.

### P0.1 Connect graph updates to normal report processing

Every completed report with entities/LSR data should update the graph.

### P0.2 Connect cluster detection to normal processing

The Near-Miss Multiplier must actually run.

### P0.3 Make graph state durable

Persist/rebuild graph relationships.

### P0.4 Use actual durable entities

Stop reconstructing the primary graph from partial report fields.

### P0.5 Fix relationship semantics

Do not present co-occurrence as causality.

### P0.6 Make graph updates idempotent

Repeated processing must not artificially inflate relationship strength.

### P0.7 Preserve evidence

Every important relationship must retain supporting report IDs.

---

# 57. P1 — Intelligence UX

### P1.1 Node intelligence drawer

Clicking a node opens a real situation/signal report.

### P1.2 Site identity

Clearly show what the location is and what operations occur there.

### P1.3 “What is happening?”

Provide a grounded summary.

### P1.4 “Why was this raised?”

Provide deterministic evidence.

### P1.5 Supporting incidents

Show report list with timestamps and severity.

### P1.6 Timeline

Show recurrence and trend.

### P1.7 Relationship evidence

Explain why connected nodes are connected.

### P1.8 Cluster investigation

Give systemic alerts a dedicated investigation surface.

### P1.9 Incident Inspector navigation

Clicking evidence should open the existing report inspector.

---

# 58. P2 — Usability

Add:

- search
- date filters
- location filters
- equipment filters
- activity filters
- systemic-only mode
- evidence-weight filtering
- accessible table/list representation
- improved mobile drawer
- better empty/error states
- loading states
- report navigation
- relationship inspection

---

# 59. P3 — Advanced Intelligence

Only after the foundational system is correct, consider:

- richer temporal scoring
- recency decay
- anomaly detection
- community detection
- centrality
- graph-based ranking
- multi-hop investigation
- semantic similarity between signals
- graph embeddings
- GraphRAG
- graph database migration

These are optional future directions.

They should not be introduced merely because they sound sophisticated.

---

# 60. Technology Decision Guidance

Do not replace NetworkX automatically.

NetworkX is adequate for the current SIH-scale graph if:

- graph size is controlled
- API queries are filtered
- persistence is implemented
- evidence is stored correctly
- entity identity is reliable

A graph database such as Neo4j should only be considered if a demonstrated requirement emerges for:

- very large persistent graph workloads
- complex multi-hop queries
- multiple concurrent writers
- graph-native traversal at scale
- operational graph querying beyond the relational projection

Likewise, GraphRAG should not replace deterministic systemic-risk detection.

The safety threshold:

```text
3 distinct reports
within 7 days
same equipment/location
```

should remain deterministic and auditable.

Generative AI can explain the evidence after the system has established it.

---

# 61. What NOT to Build

Do not turn the graph into:

- an autonomous safety controller
- a predictive accident oracle
- an opaque AI risk score
- an ungrounded causal inference engine
- a generic knowledge graph unrelated to safety
- an enterprise-wide visualization with thousands of meaningless nodes
- a second Incident Inspector
- an automatic shutdown system

The graph is decision support.

Human review remains necessary for consequential actions.

---

# 62. AI Implementation Contract

This section is specifically intended for an AI coding agent such as Codex, Claude Code, Gemini CLI, or another software-engineering model.

## Before changing code

1. Inspect the current repository.
2. Read the PRD and technical specification.
3. Read `SANKET_COMPONENT_DEEP_ANALYSIS.md`.
4. Inspect the existing graph files.
5. Inspect report/entity/LSR models.
6. Inspect the report pipeline worker.
7. Inspect the cluster detector.
8. Inspect graph API routes.
9. Inspect the graph frontend.
10. Inspect the Incident Inspector.
11. Inspect existing authentication/RBAC.
12. Inspect tests.

Do not assume documentation matches the code.

---

# 63. AI Implementation Rules

## Rule 1 — Preserve existing architecture where possible

Do not rewrite the application.

Prefer incremental changes.

## Rule 2 — Do not add unnecessary dependencies

Use existing technologies unless a new dependency solves a demonstrated problem.

## Rule 3 — Do not change systemic-risk thresholds

Keep:

```text
7 days
3 distinct reports
```

unless explicitly instructed otherwise.

## Rule 4 — Do not invent data

If the database does not contain a site type, do not fabricate one.

If a relationship is only co-occurrence, do not call it causal.

If no evidence exists, say that the evidence is unavailable.

## Rule 5 — Preserve provenance

Every derived signal should be traceable to supporting reports/entities.

## Rule 6 — Keep deterministic logic deterministic

Cluster detection should not depend on an LLM.

## Rule 7 — Keep routes thin

Business logic belongs in services.

## Rule 8 — Maintain idempotency

Retries must not inflate graph counts or create duplicate alerts.

## Rule 9 — Preserve auditability

Never destroy the original SIF score or hide the reason for escalation.

## Rule 10 — Do not implement fake success

Errors must be shown as errors.

A failed graph update should not be represented as a successful systemic signal.

---

# 64. AI Implementation Sequence

The recommended implementation order is:

```text
STEP 1
Understand existing graph data structures

        ↓

STEP 2
Define canonical entity identity

        ↓

STEP 3
Create / improve graph projection service

        ↓

STEP 4
Connect graph projection to completed report pipeline

        ↓

STEP 5
Make graph updates idempotent

        ↓

STEP 6
Persist graph relationships

        ↓

STEP 7
Connect Near-Miss Multiplier

        ↓

STEP 8
Persist systemic alert evidence

        ↓

STEP 9
Expose evidence-rich graph API

        ↓

STEP 10
Redesign node intelligence drawer

        ↓

STEP 11
Add timeline and “why raised”

        ↓

STEP 12
Connect supporting reports to Incident Inspector

        ↓

STEP 13
Add filters/search/accessibility

        ↓

STEP 14
Test complete end-to-end flow

        ↓

STEP 15
Only then consider advanced graph analytics
```

Do not reverse this order.

---

# 65. Definition of Done

The Signal Graph improvement is considered successful when all of the following are true.

## Data

- [ ] Graph is built from durable structured entities.
- [ ] Entity identities are canonicalized consistently.
- [ ] Graph relationships retain supporting report IDs.
- [ ] Graph updates are idempotent.
- [ ] Graph survives backend restart.
- [ ] Graph and database state can be reconciled.

## Systemic Risk

- [ ] Three distinct reports within seven days can trigger the configured cluster threshold.
- [ ] Duplicate processing does not double-count reports.
- [ ] Systemic alerts are persisted.
- [ ] Supporting reports are persisted.
- [ ] Original SIF score is preserved.
- [ ] Escalation reason is recorded.
- [ ] Alert status can be understood by users.

## API

- [ ] Graph endpoint exposes meaningful structured data.
- [ ] Graph supports useful filters.
- [ ] Node/signal details expose evidence.
- [ ] Supporting reports can be retrieved.
- [ ] Authorization is enforced.

## UX

- [ ] User can identify the most important current systemic signal quickly.
- [ ] User can identify the affected site/location.
- [ ] User can understand what is happening.
- [ ] User can understand why the signal was raised.
- [ ] User can inspect the timeline.
- [ ] User can inspect connected entities.
- [ ] User can inspect relationship evidence.
- [ ] User can inspect supporting reports.
- [ ] User can navigate to Incident Inspector.
- [ ] User can identify what should be investigated.
- [ ] Graph does not misleadingly imply causality.

## Testing

- [ ] Unit tests cover graph logic.
- [ ] Cluster boundary tests exist.
- [ ] Persistence/rebuild test exists.
- [ ] API tests exist.
- [ ] End-to-end report → graph → cluster → inspector flow works.

---

# 66. Recommended Final User Journey

The final user journey should look like this:

```text
HSE MANAGER OPENS GRAPH
        ↓
SEES:
“WELL PAD 7 — ENERGY ISOLATION”
6 reports · 7 days · Increasing
        ↓
CLICKS SIGNAL
        ↓
SEES:
“What is happening?”
        ↓
SEES:
“Why was this raised?”
        ↓
SEES:
Timeline
        ↓
SEES:
Affected equipment / barriers / LSR
        ↓
SEES:
6 supporting reports
        ↓
CLICKS A REPORT
        ↓
INCIDENT INSPECTOR
        ↓
UNDERSTANDS INDIVIDUAL INCIDENT
        ↓
RETURNS TO SIGNAL
        ↓
CREATES / REVIEWS CAPA
```

This is the intended end state.

---

# 67. Example of the Desired Finished Experience

A manager should be able to see something like:

> ## 🔴 Well Pad 7 — Energy Isolation
>
> **SYSTEMIC SAFETY SIGNAL**
>
> **6 reports in the last 7 days · Increasing · Last observed 42 min ago**
>
> ### What is happening?
> Repeated safety observations involving energy-isolation controls are occurring at Well Pad 7 during drilling and related operations.
>
> ### Why was this raised?
> - 6 distinct reports support the signal.
> - The configured systemic threshold has been satisfied.
> - Multiple reports involve the same location.
> - BOP and wellhead equipment recur across the evidence.
> - The latest supporting report was submitted 42 minutes ago.
>
> ### Related safety signals
> - 🔴 Line of Fire — 5 reports
> - 🟠 Ground Disturbance — 4 reports
> - 🟡 Working at Height — 2 reports
>
> ### Evidence timeline
> Aug 22 → Aug 24 → Aug 26 → Aug 28
>
> ### Affected equipment
> BOP · Wellhead · Valve
>
> ### Supporting reports
> 6 reports
>
> **Recommended investigation:** Review energy-isolation and related barrier controls associated with the affected activities.
>
> `[VIEW REPORTS]   [OPEN INCIDENT]   [CREATE ACTION]`

This is what the graph should ultimately communicate.

---

# 68. Final Product Principle

The most important design principle is:

> **Do not make the user interpret the graph. Make the graph explain the safety situation.**

A successful Signal Graph is not measured by:

- number of nodes
- number of edges
- animation quality
- visual complexity
- graph algorithm sophistication

It is measured by whether an HSE user can quickly understand:

```text
WHAT
WHERE
WHY
EVIDENCE
TREND
CONNECTIONS
NEXT STEP
```

The graph visualization is only the surface.

The real product is the **structured systemic safety intelligence underneath it**.

---

# 69. Source Traceability

## Product Requirements

`SANKET_PRD.md`

Relevant concepts:

- SIF precursor detection
- F6 Safety Signal Knowledge Graph
- F7 Near-Miss Multiplier
- Incident Inspector
- graph visualization
- systemic risk
- 7-day / 3-event threshold
- report/entity/graph data model

## Technical Specification

`SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`

Relevant sections:

- Section 8 — Backend architecture
- Section 9 — API specification
- Section 10 — Database architecture
- Section 11–15 — AI/NLP pipeline
- Section 17 — Knowledge Graph
- Section 18 — Near-Miss Multiplier
- Section 29 — End-to-End Data Flows

## Current Code Audit

`SANKET_COMPONENT_DEEP_ANALYSIS.md`

Relevant findings:

- current graph lifecycle
- NetworkX implementation
- graph persistence gap
- graph/entity integration gap
- edge semantics
- cluster trigger integration
- frontend behavior
- graph UX limitations
- evidence/provenance gaps
- security and testing gaps

## Project Tracker

`task.md`

Confirms the intended implementation scope for:

- Safety Signal Knowledge Graph
- Near-Miss Multiplier
- graph frontend
- Incident Inspector

---

# 70. One-Sentence Definition

If the entire feature needs to be explained in one sentence:

> **The SANKET Safety Signal Graph converts individual safety reports into an evidence-backed map of recurring systemic risks, showing users what is happening, where it is happening, why the system detected it, which incidents support it, how related risks connect, and where investigation should begin.**

---

# 71. Final Instruction to an AI Implementer

**Implement the Signal Graph as an evidence-first systemic safety investigation system, not merely as a node-link visualization.**

The implementation must:

1. use the real structured output of the report intelligence pipeline;
2. maintain canonical entity identity;
3. create reliable, idempotent graph relationships;
4. preserve supporting report evidence;
5. persist/rebuild graph state;
6. execute the configured temporal systemic-risk rule;
7. preserve original SIF scores during systemic escalation;
8. expose meaningful signal/site/entity details;
9. provide timeline, trend and “why raised” explanations;
10. allow relationship inspection;
11. link evidence to the existing Incident Inspector;
12. support investigation/action workflows;
13. avoid unsupported causal claims;
14. remain deterministic and auditable where the underlying rule is deterministic;
15. avoid unnecessary architectural overengineering.

**Do not stop at making the graph look better. The objective is to make the graph useful for making a safety decision.**