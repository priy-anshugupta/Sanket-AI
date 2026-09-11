SANKET · AI

Team Explanation & System Understanding Guide

A non-technical, presentation-ready explanation of the product, its features, architecture and implementation.

"See the Sanket (Signal) Before It Becomes the Incident."

## How to use this document

This guide is written for the entire team. It explains SANKET from the problem first, then the user journey, then the major features, and finally the technology behind them. A team member should be able to read only the feature sections and still explain the system to a judge who has never seen SANKET before.

| Important presentation rule Always distinguish between the SIH prototype, the intended architecture, and a future production deployment. The project specifications contain ambitious production concepts such as RoIP hardware, offline edge queues and OT/DCS integration. The repository audit found that some of these are currently simulated or only partially wired. Never claim an unimplemented or uncertified capability as already deployed. |
| --- |

## 1. What is SANKET AI?

SANKET AI is an edge-oriented safety-intelligence platform for upstream oil and gas operations. Its purpose is to turn unstructured safety observations--written, spoken or received through approved field communication channels--into structured SIF (Serious Injury & Fatality) precursor intelligence.

The central idea is simple: a dangerous event often has warning signs before the final incident. One small observation may look harmless, but several related observations across time, equipment and location can reveal a developing systemic problem.

| RAW SAFETY DATA       ↓ INDIVIDUAL INTELLIGENCE   • SIF score   • Entities   • Life-Saving Rule   • Explanation       ↓ SYSTEMIC INTELLIGENCE   • Knowledge Graph   • Temporal clusters   • Site/activity density       ↓ ACTIONABLE INTERVENTION   • Investigation   • CAPA   • SWA / emergency workflow   • Shift briefing |
| --- |

*Source basis: `SANKET_PRD.md`, Technical Application Specification, and `understandsanketai.md`.*

## 2. The problem SANKET is solving

The project is aligned to SIH26165. The PRD describes three core expectations: classify unstructured unsafe-act/unsafe-condition and near-miss narratives by SIF potential, map them to the 9 IOGP Life-Saving Rules, and surface recurring precursor patterns across locations, activities and barrier failures so that sites/activities can be ranked by precursor density.

| Problem | What happens without SANKET | How SANKET addresses it |
| --- | --- | --- |
| Lagging indicators | Safety information may be reviewed after an event or during later shift review. | Scores observations as they enter the system and prioritizes high-potential signals. |
| Data silos | Paper logs, text reports and field voice communications remain separate. | Normalizes different inputs into a common report/intelligence pipeline. |
| Weak signals look harmless | Minor observations may be considered independently. | Connects repeated entities and observations across a rolling time window. |
| Hard to investigate | An officer must manually read many reports to find a pattern. | Triage, graph, filters, evidence and timelines make patterns easier to inspect. |
| Language / field constraints | Workers may communicate naturally in local languages and may not be able to use consumer phones in hazardous areas. | Supports multilingual processing and provides a production architecture based on approved field devices and RoIP. |

| Simple analogy Think of SANKET as a smoke detector for safety information. It does not wait for the fire. It listens for weak signals that, when combined, may indicate that something is becoming dangerous. |
| --- |

## 3. Who uses SANKET?

| User | Main need | Main SANKET view |
| --- | --- | --- |
| Frontline worker | Report a hazard quickly without filling a complicated form. | Field Reporter |
| Shift in-charge / process safety engineer | See what is happening across active assets right now. | DCS Control Room |
| HSE officer / rig superintendent | Review, prioritize and resolve observations. | Triage Queue + Incident Inspector |
| Process safety / reliability investigator | Find recurring relationships and systemic patterns. | Signal Graph |
| Regional HSE / fleet manager | Understand where risk is concentrated. | SIF Heatmap + Analytics |
| Emergency commander | Coordinate immediate response actions. | Emergency Playbook |
| Management / training / audit audience | Understand historical patterns and lessons. | Baghjan Replay + Briefing |

## 4. The application at a glance

| FIELD REPORTER     ↓ TRIAGE QUEUE     ↓ INDIVIDUAL INTELLIGENCE     ↓ DCS CONTROL ROOM     ↓ SIGNAL GRAPH + TEMPORAL PATTERNS     ↓ SIF HEATMAP / ANALYTICS     ↓ EMERGENCY PLAYBOOK + CAPA     ↓ HUMAN REVIEW + CLOSURE  Supporting: Baghjan Replay | Shift Briefing | System Control | Voice/RoIP architecture |
| --- |

## 5. The AI/NLP pipeline -- explained without jargon

The project specification describes a five-stage report-intelligence pipeline, with graph/systemic processing after the first five stages. The same concept is also presented in `understandsanketai.md` as a seven-stage neuro-symbolic pipeline.

| Stage | What it means | Key implementation | Why it matters |
| --- | --- | --- | --- |
| 1. Preprocessing | Cleans the text and identifies the language. | TextPreprocessor / language detection | Makes later stages operate on cleaner, normalized input. |
| 2. SIF classifier | Estimates whether the observation has Serious Injury & Fatality potential. | multilingual-e5-small + 50 SIF anchors + scoring/negation logic | Prioritizes dangerous precursor observations. |
| 3. Entity extraction | Finds the important things mentioned in the observation. | GLiNER / spaCy or current extractor path | Turns free text into equipment, location, barrier and energy context. |
| 4. IOGP mapping | Identifies the relevant Life-Saving Rule(s). | Vector similarity against 9 IOGP rules | Connects observations to a recognized safety framework. |
| 5. Grounded explanation | Explains the already-computed result in plain language. | Ollama local LLM or cloud provider depending on mode | Makes the result understandable to an HSE officer without allowing the LLM to decide the primary score. |
| 6. Knowledge Graph | Connects recurring entities and relationships. | NetworkX + graph projection | Turns separate observations into a cross-report picture. |
| 7. Near-Miss Multiplier | Checks whether repeated signals meet the systemic-risk rule. | Temporal/SQL clustering logic | Surfaces patterns that individual report scoring may miss. |

| Critical concept: the LLM is not the primary safety judge The deterministic/embedding-based SIF stage produces the score. The local LLM is used for a grounded explanation after the relevant gate. This separation improves reproducibility, auditability and offline operation. |
| --- |

## 6. SIF -- what it means

SIF stands for Serious Injury & Fatality. In this project, the question is not simply "did someone get hurt?" The system is interested in whether an observation represents a precursor with the potential for a serious or fatal outcome.

The SIF classifier uses multilingual-e5-small embeddings. A report is represented as a 384-dimensional vector and compared with a library of 50 SIF precursor anchors. The project documentation also describes keyword/negation handling and calibrated scoring.

| Example "BOP hydraulic line is leaking under high pressure while the isolation valve is bypassed." contains equipment, an energy source, and a barrier-control problem. The classifier can therefore treat it as a potentially high-consequence precursor rather than ordinary maintenance text. |
| --- |

## 7. Feature 1 -- Triage Queue

Route shown in the application: `/dashboard`. Target audience: HSE officers and rig/safety management.

| Question | Answer |
| --- | --- |
| What is it? | The central inbox for safety observations. |
| Why does it exist? | A site can receive many reports; officers need a prioritized list instead of reading everything with equal urgency. |
| What does it show? | Total ingested reports, high/medium/low categories, search/filter controls, SIF classification, IOGP rule, asset/location, status and timestamp. |
| Key implementation | FastAPI report ingestion + background NLP pipeline + database-backed report list + frontend dashboard. |
| Problem solved | Turns a large stream of unstructured observations into an actionable review queue. |

How to explain the screen: "This is where the safety officer starts. Instead of treating 1,500 observations equally, SANKET puts the higher-potential signals where the officer can investigate them first."

*Source basis: `understandsanketai.md` screen manual; PRD F8/F9; technical specification Sections 7-15.*

## 8. Feature 2 -- Incident Inspector / Human Review

| Question | Answer |
| --- | --- |
| What is it? | The detailed investigation view for one report. |
| Why? | A score alone is not enough; an officer needs the narrative, extracted context, rule mapping, explanation and action history. |
| Key implementation | Report detail API/UI, persisted entities and LSR tags, explanation, officer feedback, CAPA/work-order workflow. |
| Human role | The officer can confirm, upgrade or downgrade the assessment. The system is decision support, not a replacement for the safety officer. |
| Why important? | Creates accountability and an auditable human-in-the-loop decision point. |

Presentation line: "AI prioritizes and explains; the authorized safety officer remains responsible for validating the operational decision."

## 9. Feature 3 -- Field Reporter / Voice & Radio Ingestion

This feature solves a practical field problem: a worker needs a fast reporting mechanism, and consumer smartphones may not be appropriate in hazardous process areas.

| Production-oriented concept: Worker   ↓ Approved PTT / intrinsically safe terminal / kiosk   ↓ Site radio system   ↓ RoIP / SIP / RTP gateway   ↓ SANKET edge ingestion   ↓ Speech-to-text   ↓ Field Observation   ↓ Canonical report ingestion   ↓ SIF / entities / LSR / explanation   ↓ Graph / systemic risk / HSE action |
| --- |

| Layer | What it does | Key component / boundary |
| --- | --- | --- |
| Worker interface | Press-to-talk or simple observation entry. | Approved field device / current demo UI |
| Radio integration | Bridges radio audio into IP/software. | RoIP gateway |
| Edge ingestion | Receives, identifies, buffers and forwards audio. | SANKET edge ingestion layer |
| Speech-to-text | Converts speech to text. | Whisper / ASR |
| Safety intelligence | Analyzes the resulting observation. | Existing SANKET report pipeline |

| What the RoIP gateway is It is the boundary between the radio world and the software/IP world. SANKET should not contain vendor-specific radio logic. A real deployment requires the exact radio system, gateway interface, metadata availability and site governance to be known first. |
| --- |

| Current repository truth The code audit found that the visible Field Reporter is currently a simulator; the backend has a separate Whisper path, and the current field page/pipeline integration has known gaps. Therefore the team should describe the radio page as an SIH demonstration of the intended architecture unless the integration has subsequently been made real. |
| --- |

## 10. Feature 4 -- DCS Control Room Live Wall

| Question | Answer |
| --- | --- |
| Purpose | Give the shift in-charge a live operational picture rather than requiring manual review of the entire report queue. |
| What does it show? | Total reports, high-SIF and medium warnings, low/housekeeping volume, live incident stream and fleet asset risk matrix. |
| Why separate from Triage? | Triage is an investigation queue; the DCS wall is a situational-awareness surface for active operations. |
| Key implementation | Dashboard UI consuming report/risk data and, in the intended architecture, realtime events/WebSocket updates. |
| Value | Reduces the time between a field observation being recorded and the control-room team seeing that a high-potential issue exists. |

Presentation line: "Triage tells an officer what to investigate; the DCS wall tells the operation what is happening now."

## 11. Feature 5 -- Safety Signal Knowledge Graph

The graph is not primarily about making a visually impressive network. Its purpose is to answer a question that a flat report table cannot answer easily: which equipment, locations, barrier failures, energy sources and safety rules recur together across multiple observations?

| Report A → Pump-04 + vibration Report B → Pump-04 + leakage Report C → Pump-04 + seal failure                  ↓          RECURRING SAFETY SIGNAL                 ↓        Investigate Pump-04 |
| --- |

| Concept | Meaning |
| --- | --- |
| Node | A structured safety entity such as equipment, location, barrier failure, energy source, shift or LSR violation. |
| Edge | A relationship/co-occurrence supported by the underlying report data. |
| Weight | How often the relationship is observed, according to the graph model. |
| Evidence | The reports that support the relationship or signal. |
| Systemic signal | A repeated correlated pattern that deserves investigation. |

| Do not overstate causality The code audit specifically warns that the current graph primarily represents correlation/co-occurrence. Do not tell a judge that a graph edge proves causation unless you have actual causal evidence. Say "association," "co-occurrence," or "evidence relationship." |
| --- |

*Source basis: `SANKET_SIGNAL_GRAPH_SPECIFICATION.md`; `SANKET_COMPONENT_DEEP_ANALYSIS.md`.*

## 12. Feature 6 -- Near-Miss Multiplier / Systemic Risk

This is the logic that changes SANKET from an individual-report classifier into a systemic safety tool.

| Same equipment or location         + 3 or more distinct reports         + within a 7-day rolling window         ↓ SYSTEMIC RISK SIGNAL         ↓ Escalate for investigation / alert |
| --- |

The project specification says the cluster can elevate the involved reports to HIGH while preserving their original SIF scores and recording the reason for the escalation. That is important: the system should be able to distinguish "the raw report scored 0.42" from "the report is now operationally escalated because it belongs to a systemic cluster."

| Why this exists | Simple explanation |
| --- | --- |
| Individual scores can miss accumulation | Three small issues can collectively be more concerning than any one issue. |
| Different workers see different pieces | One worker may report vibration, another leakage, another a bypass. |
| Time matters | The same issue recurring over days can indicate degradation. |
| Managers need a trigger | A cluster creates a reason to investigate a location/equipment rather than waiting for a severe event. |

## 13. Feature 7 -- SIF Geo-Spatial Heatmap

| Question | Answer |
| --- | --- |
| What is it? | A geographic view of safety precursor density and contextual site information. |
| Why? | A fleet manager needs to know where risk is concentrated, not only which individual report is severe. |
| What does the demo show? | Upper Assam map, asset markers, SIF density, pipeline context, environmental layers and asset telemetry. |
| Key implementation | Map frontend/Leaflet-style GIS presentation backed by asset/report density and contextual layers. |
| Value | Supports site-level prioritization and helps management see spatial concentration. |

Presentation line: "The graph tells us what is connected; the heatmap tells us where the concentration is."

## 14. Feature 8 -- Emergency Playbook & SWA Workflow

The Emergency Playbook is the intervention side of the system. It provides a structured response interface when a critical hazard is active.

| Visible capability | Purpose |
| --- | --- |
| Critical hazard card | Shows location, hazard, root-cause context, failed barrier and energy source. |
| SWA workflow | Represents the Stop Work Authority process in the prototype. |
| Emergency checklist | Provides ordered response steps instead of relying on memory during a high-pressure situation. |
| Call roster | Makes responsible contacts immediately visible. |
| RoIP bridge tab | Demonstrates how radio communication could be connected to the system. |

| Safety boundary The UI should be described as a digital response workflow/prototype. An AI classification must not be presented as a certified physical safety interlock or autonomous rig shutdown. Real OT/DCS/e-PTW integration would require separate hazard analysis, authorization, fail-safe engineering, testing and certification. |
| --- |

## 15. Feature 9 -- Baghjan 2020 Replay

The Baghjan Replay is a historical/counterfactual demonstration. It walks through precursor observations leading toward the 2020 blowout and shows how connecting those signals earlier could support an intervention.

| Historical timeline Day -14 → mud loss Day -10 → pressure anomaly Day -6  → gas bubbling Day -3  → BOP bypass / barrier degradation Day 0   → blowout  SANKET demonstration: same warning signals       ↓ connected earlier       ↓ high-potential intervention point       ↓ counterfactual prevention scenario |
| --- |

| How to phrase it safely Say: "The replay demonstrates how SANKET could have surfaced the precursor pattern earlier." Avoid saying that the replay proves with mathematical certainty that the real disaster would have been prevented. It is a counterfactual demonstration, not a historical experiment. |
| --- |

## 16. Feature 10 -- Shift Handover & Documents

The briefing generator converts safety intelligence into a compact operational handover. The technical specification also describes a Safety Intervention Dossier and Bow-Tie output.

- Shift briefing: concise list of important risks/actions for the incoming shift.

- Safety dossier: detailed report-centered evidence and action information.

- Bow-Tie representation: a structured view of threats, barriers and consequences for high-SIF cases.

- PDF generation is an output layer; it should not become a second source of truth.

## 17. Feature 11 -- Air-Gap / Sovereign Local Operation

The intended deployment is suitable for environments where sensitive operational data should remain inside a private network or local edge environment. The architecture places local models such as embeddings, Whisper and Ollama alongside the backend.

| FIELD / SITE NETWORK       ↓ LOCAL SANKET EDGE   • Whisper / ASR   • multilingual-e5-small   • Entity / LSR processing   • Local Ollama   • Local database / queue       ↓ LOCAL CONTROL ROOM  Optional later synchronization to central systems when policy and connectivity permit. |
| --- |

| Air-gap wording The repository audit notes that the current `/api/system/airgap` telemetry measures the application's process connections; it does not mathematically prove that the entire physical machine is air-gapped. For a judge, say "application-level/local egress monitoring" or "designed for air-gapped deployment," unless a real network isolation test has been performed. |
| --- |

## 18. Feature 12 -- Human-in-the-Loop & Calibration

Safety decisions require accountable human oversight. The project includes officer feedback--AGREE, UPGRADE and DOWNGRADE--and a calibration concept for thresholds.

- AI produces a recommendation and evidence.

- Authorized officer reviews the case.

- Officer can confirm or override the classification.

- Feedback is logged for audit/learning analysis.

- Threshold suggestions should be treated as calibration assistance, not automatic unsafe model self-modification.

## 19. Deduplication

The PRD includes a near-duplicate filter. The reason is simple: repeated copy-paste reports should not artificially inflate the apparent frequency of a signal.

| Why this matters to the graph If the same report is accidentally ingested three times, a temporal cluster detector could falsely believe there are three independent observations. Deduplication and report-level idempotency protect systemic-risk analysis. |
| --- |

## 20. LangGraph and MCP -- what the team should say

The specification describes a seven-agent LangGraph orchestration and four FastMCP tools. These are architectural organization mechanisms, not seven separate AI models.

| Term | What it is | Why it exists |
| --- | --- | --- |
| LangGraph | A state-machine/orchestration layer for the specialized pipeline stages. | Makes the sequence and conditional routing explicit. |
| Agent | A specialized step in that orchestration. | Keeps responsibilities separated: classification, entities, rules, graph, explanation, action. |
| MCP | A standardized way for agents to call reusable tools. | Prevents agents from embedding database/graph/PDF logic directly. |
| NetworkX | Graph computation library. | Stores/query relationships for the systemic intelligence layer. |

| Repository truth The code audit found that the normal report ingestion path currently executes the five-stage pipeline directly; the defined LangGraph swarm is not currently the active path. So describe LangGraph/MCP as the intended orchestration architecture unless the team has since wired it into the live path. |
| --- |

## 21. Why Qwen3:8B is suitable

The project documentation originally names a local 7B/8B-class Ollama model for the explainer. Qwen3:8B is in the same practical class and is suitable for the current role because the LLM is not responsible for primary SIF scoring.

| Task | Qwen3:8B suitability |
| --- | --- |
| Short grounded safety explanation | Suitable |
| Follow a structured prompt | Suitable |
| English / common Indian-language text | Suitable; test exact field language/slang before claiming accuracy |
| Primary SIF classification | Not its job |
| Graph clustering | Not its job |
| High-volume long-form generation | Not required for SANKET |

Recommended local configuration for the current setup:

| AI_MODE=airgapped OLLAMA_HOST=http://127.0.0.1:11434 OLLAMA_MODEL=qwen3:8b |
| --- |

The 5.2 GB model size does not mean all runtime memory use is exactly 5.2 GB. Ollama also needs runtime buffers/KV cache, and the RTX 3050 6 GB may use a mix of GPU VRAM and system RAM depending on quantization and context. For SANKET's short explanation workload, this is generally a reasonable local configuration. The earlier CUDA crash should be treated as an Ollama/CUDA initialization issue if the model subsequently loads and answers normally.

## 22. The complete story in one minute

| A worker observes a hazard.         ↓ The observation enters SANKET by text, voice or approved field communication.         ↓ The system cleans the text and calculates SIF potential.         ↓ It extracts equipment, location, barrier and energy context.         ↓ It maps the observation to an IOGP Life-Saving Rule.         ↓ For sufficiently important cases, a local LLM explains the result.         ↓ Across reports, SANKET connects recurring entities and checks temporal patterns.         ↓ The HSE team sees the result in the Triage Queue, DCS wall, Graph and Heatmap.         ↓ A human safety officer investigates and can create/validate CAPA.         ↓ The Emergency Playbook and briefing outputs help turn intelligence into action. |
| --- |

| The one sentence to memorize SANKET turns fragmented safety observations into individual SIF intelligence, connects them into systemic patterns, and helps HSE teams act before a precursor becomes an incident. |
| --- |

## 23. Team terminology cheat sheet

| Term | Full form | Plain meaning |
| --- | --- | --- |
| SIF | Serious Injury & Fatality | Potential for a severe/fatal outcome. |
| UA/UC | Unsafe Act / Unsafe Condition | A behavior or condition that creates risk. |
| LSR | Life-Saving Rule | IOGP safety rule mapped to the observation. |
| RoIP | Radio over IP | Bridges radio communications into IP/software systems. |
| PTT | Push-to-Talk | Worker presses a button to transmit voice. |
| ASR | Automatic Speech Recognition | Speech-to-text. |
| NER | Named Entity Recognition | Finds important entities in text. |
| SWA | Stop Work Authority | Authority/process to stop unsafe work. |
| CAPA | Corrective and Preventive Action | Tracked action to address a safety issue. |
| DCS | Distributed Control System | Industrial control-room/process monitoring context. |
| HSE | Health, Safety & Environment | Safety-management function/user group. |
| LLM | Large Language Model | Used here for grounded explanation, not primary scoring. |
| MCP | Model Context Protocol | Standardized tool-calling protocol. |

## 24. Source and truth hierarchy

When preparing the presentation, use the following hierarchy:

1. Current repository behavior -- what the running application actually does.

1. Current project technical specification -- what the architecture is intended to do.

1. PRD -- why the feature exists and what SIH outcome it supports.

1. Mentor/specification material -- operational constraints and proposed production integrations.

1. Future roadmap -- capabilities not yet implemented.

| Never bluff If a judge asks to see an implementation that is not currently wired, the strongest answer is: "That is part of our intended production architecture; the SIH prototype demonstrates the software boundary/simulator, while a real deployment requires site-specific hardware and validation." |
| --- |

## 25. Source documents used

- understandsanketai.md -- master system/domain/presentation guide.

- SANKET_PRD.md -- product requirements and F1-F16 feature catalogue.

- SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md -- architecture, AI pipeline, database, API, LangGraph, MCP, CAPA, documents and deployment.

- SANKET_COMPONENT_DEEP_ANALYSIS.md -- code-first verification of the current implementation and gaps.

- SANKET_FIELD_REPORTER_ROIP_SPECIFICATION_REVISED.md / SANKET_FIELD_REPORTER_ROIP_TECHNICAL_SPECIFICATION.md -- field/radio/RoIP architecture.

- SANKET_SIGNAL_GRAPH_SPECIFICATION.md -- graph/systemic-risk product and UX specification.

- mentor feedback.md -- operational constraints and proposed field/edge architecture.

- task.md / README.md -- implementation/project context.
