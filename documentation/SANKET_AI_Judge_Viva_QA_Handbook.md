SANKET · AI

Judge, Viva & Team Q&A Handbook

Likely questions, doubts, objections and concise answers for SIH presentation and technical viva.

"See the Sanket (Signal) Before It Becomes the Incident."

## How to use this handbook

Each answer has three layers: the short answer a presenter can say in 15-25 seconds, the deeper explanation for follow-up questions, and a "do not claim" note where the project materials or current code do not justify a stronger statement.

| Answer pattern Use: PROBLEM → DESIGN CHOICE → HOW IT WORKS → LIMITATION. Judges usually care less about buzzwords than whether the team understands why each component exists. |
| --- |

## Part I -- The questions almost guaranteed to come

### 1. What exactly is SANKET AI?

Short answer: SANKET is an edge-oriented safety-intelligence platform that converts unstructured field observations into SIF precursor intelligence, maps them to IOGP Life-Saving Rules, detects recurring systemic patterns, and supports HSE intervention.

If they ask further: The product is organized into individual intelligence, systemic intelligence and actionable intervention. It is not simply an incident database or chatbot.

### 2. What problem are you solving?

Short answer: We are solving the gap between a safety observation being recorded and the organization recognizing that it may be part of a dangerous pattern.

If they ask further: The PRD focuses on three things: SIF classification, automatic IOGP rule mapping, and recurring precursor pattern detection/ranking.

### 3. Why not just use an existing incident-management system?

Short answer: Existing systems can store safety records, but SANKET is designed around extracting intelligence from unstructured observations and connecting weak signals across reports.

If they ask further: The differentiator is the combination of multilingual ingestion, SIF precursor scoring, entity/LSR extraction, cross-report systemic correlation and an operational response workflow.

Do not claim: Do not claim that every existing enterprise system lacks every one of these capabilities. Say SANKET is purpose-built around this workflow.

### 4. Why is SIF classification necessary?

Short answer: Because not every safety observation deserves the same urgency. SIF classification asks whether an observation has the potential for a serious or fatal outcome.

If they ask further: The system prioritizes high-consequence precursor signals rather than treating all observations as equivalent.

### 5. Why use embeddings instead of an LLM to classify SIF?

Short answer: Because the primary classification needs to be reproducible and auditable. We use multilingual embeddings against a defined set of SIF precursor anchors, with deterministic scoring logic.

If they ask further: The LLM is reserved for explanation. This reduces the chance that a generative model changes the classification simply because its wording or reasoning varies.

### 6. What is multilingual-e5-small doing?

Short answer: It converts text into numerical vectors that capture semantic meaning across supported languages. SANKET compares the report vector with known SIF precursor anchors.

If they ask further: The project uses 384-dimensional embeddings. The classifier combines similarity with project-specific scoring/keyword/negation logic.

### 7. Why 50 SIF anchors?

Short answer: They provide a defined reference library of industrial precursor patterns against which observations can be compared.

If they ask further: The anchor library makes the scoring explainable as similarity to known precursor concepts rather than an opaque free-form LLM judgement.

Do not claim: Do not claim that 50 anchors are universally sufficient for every Oil India operation; they are the project's calibrated prototype library.

### 8. How do you handle "gas leak" versus "no gas leak"?

Short answer: The classifier includes negation handling so that a critical phrase preceded by a negation is not treated the same way as an actual hazard statement.

If they ask further: The project documentation describes a five-token sliding negation window and language-specific negation terms.

### 9. Why extract entities?

Short answer: Because words such as "pump," "BOP," "Well Pad 7," "high pressure" and "bypass" are the bridge between a free-text report and systemic analysis.

If they ask further: Entities become graph nodes and correlation keys. Without normalization, two reports referring to the same asset with different wording can appear unrelated.

### 10. What entities do you extract?

Short answer: The project describes equipment, location, barrier failure, energy source, shift/time, weather, PPE status and body part.

If they ask further: The exact extractor implementation has evolved, so the team should describe the taxonomy in the specification and verify which labels are active in the current build.

Do not claim: Do not claim a label is live if it is only present in the specification.

### 11. Why map to IOGP Life-Saving Rules?

Short answer: It connects an observation to a recognized safety-rule framework, giving the HSE officer a familiar safety category and a consistent way to group observations.

If they ask further: The mapper compares the observation with definitions for the nine IOGP rules using vector similarity.

### 12. Why do you need the LLM at all?

Short answer: The LLM turns structured, already-computed safety facts into a concise human-readable explanation. It is not the primary SIF judge.

If they ask further: For example, the classifier may say HIGH, identify a failed barrier and an energy source, and the LLM turns those facts into a short explanation of what happened, why it matters and what immediate action should be considered.

### 13. Why Qwen3:8B?

Short answer: The SANKET explainer only needs a compact local model that can follow a grounded prompt and produce short explanations. Qwen3:8B is in the same 7B/8B class as the models specified for the project.

If they ask further: It is not being asked to perform the entire safety pipeline. SIF scoring, graph analysis and clustering remain deterministic/specialized components.

### 14. What if Qwen hallucinates?

Short answer: We reduce that risk by not giving it authority over the primary SIF score and by grounding its prompt in extracted entities, the score and rule information. High-severity decisions are also intended to remain subject to human review.

If they ask further: The project specification explicitly separates deterministic scoring from generative explanation.

Do not claim: Do not say hallucination is mathematically impossible.

### 15. Why not use a 70B model?

Short answer: We do not need one for this role. The output is a short grounded explanation, not open-ended research or long-form reasoning. A smaller local model is easier to run at the edge.

If they ask further: A larger model may improve some language tasks, but it also increases resource requirements. The architecture deliberately minimizes LLM dependence.

### 16. How does the Signal Graph help?

Short answer: A table shows individual reports. The graph shows recurring relationships between equipment, locations, barriers, energy sources and rules across reports.

If they ask further: This supports systemic investigation: if multiple reports repeatedly involve the same equipment or location, the HSE team can investigate the pattern rather than reading each report in isolation.

### 17. Is the graph actually causal?

Short answer: Not automatically. The graph primarily represents evidence-based associations/co-occurrences from the reports. We should not equate an edge with proven causation.

If they ask further: The graph specification and code audit explicitly recommend avoiding unsupported causal claims.

### 18. What is the Near-Miss Multiplier?

Short answer: It is a temporal correlation rule: three or more distinct correlated observations involving the same equipment or location within a seven-day rolling window can trigger systemic-risk escalation.

If they ask further: The purpose is to detect accumulation: several individually modest signals may together justify investigation.

### 19. Why seven days?

Short answer: Seven days is the project's configured rolling window for the prototype. It gives enough time to connect recurring operational observations while keeping the signal recent.

If they ask further: The value is a configurable business rule, not a universal law of industrial safety. It can be calibrated for a real deployment.

### 20. Why three events?

Short answer: Three distinct observations provide a simple prototype threshold for repeated evidence rather than escalating from a single isolated observation.

If they ask further: The threshold is configurable and should be validated against site data before production use.

## Part II -- Field Reporter, RoIP and hazardous-area questions

### 21. Phones are banned in hazardous areas. How does your system work?

Short answer: The production architecture does not depend on consumer smartphones. It is designed to accept observations from approved PTT radios, intrinsically safe terminals or fixed kiosks, with radio traffic bridged through an appropriate RoIP/interface layer.

If they ask further: The key component is the RoIP gateway: it converts radio-side audio/signalling into an IP/software-accessible stream. SANKET then treats the resulting observation like any other report.

Do not claim: Do not claim that the current browser page itself is an ATEX-certified device.

### 22. What exactly is RoIP?

Short answer: Radio over IP is the bridge between a land-mobile-radio system and IP/software infrastructure.

If they ask further: Radio audio goes to a supported gateway; the gateway exposes audio using an appropriate interface such as RTP, SIP or vendor-specific RoIP. SANKET should keep that vendor-specific logic behind an adapter boundary.

### 23. Does a walkie-talkie have an API?

Short answer: Not universally. Conventional VHF/UHF radios generally need a supported gateway, base-station interface, dispatch system or vendor integration to expose audio to software.

If they ask further: That is why the architecture separates the radio layer from SANKET's intelligence layer.

### 24. Why a dedicated safety channel?

Short answer: Because recording every radio conversation increases noise, storage, privacy exposure and false positives. A governed safety channel gives the system a focused source of safety observations.

If they ask further: The project material proposes a dedicated Channel 9 concept for the prototype/production architecture.

### 25. What happens if the radio gateway fails?

Short answer: A production edge design should expose a gateway-health state and queue observations locally where possible. The system should distinguish "no reports" from "the ingestion path is offline."

If they ask further: The Field Reporter specification recommends CONNECTED/DEGRADED/DISCONNECTED health, queue depth, last-seen time and retry behavior.

### 26. What happens if the internet is down?

Short answer: The intended air-gapped architecture keeps the core intelligence local. Local ASR, embeddings, database and Ollama can operate without a cloud LLM.

If they ask further: The field specification also proposes store-and-forward behavior so observations can remain queued until connectivity returns.

Do not claim: The current repository audit says complete offline field queue/synchronization is not fully implemented. Present this as an intended production capability unless you have verified the new implementation.

### 27. Can you guarantee sub-500ms end-to-end response?

Short answer: Only if we measure the full path. The project has a target/demo claim, but radio, buffering, ASR, NLP and alert dispatch all contribute to end-to-end latency.

If they ask further: For a defensible presentation, quote measured prototype latency for the exact test path and separate it from the production target.

### 28. Is the emergency lockout really controlling the rig?

Short answer: In the SIH prototype, it should be described as a digital SWA/response workflow demonstration. Real physical shutdown or e-PTW interlocking would require separate OT safety engineering and certification.

If they ask further: The AI result can recommend or initiate an authorized workflow; it should not be presented as a certified safety instrumented function.

## Part III -- Architecture & implementation questions

### 29. Why FastAPI?

Short answer: FastAPI fits the Python-heavy AI stack, provides typed request validation and async-friendly APIs, and keeps the backend as a single modular service.

If they ask further: The technical specification uses FastAPI as the central entry point for frontend operations and orchestration triggers.

### 30. Why Next.js?

Short answer: It provides the operator-facing web application and works well for a dashboard with multiple routes and reusable UI components.

If they ask further: The frontend should render intelligence; it should not be responsible for computing the SIF decision.

### 31. Why a modular monolith instead of microservices?

Short answer: For an SIH prototype, a modular monolith reduces deployment and networking complexity while keeping the AI, graph, documents and workflow modules separated in code.

If they ask further: The technical specification explicitly defines the backend as a modular monolith. MCP is a protocol boundary, not a requirement to deploy every component as a separate service.

### 32. What is LangGraph doing?

Short answer: It is intended to orchestrate specialized processing steps with explicit state and conditional routing.

If they ask further: The seven conceptual agents are supervisor, classifier, entity extractor, rule mapper, graph analyst, explainer and action/CAPA.

### 29. Why FastAPI?

Short answer: FastAPI fits the Python-heavy AI stack, provides typed request validation and async-friendly APIs, and keeps the backend as a single modular service.

If they ask further: The technical specification uses FastAPI as the central entry point for frontend operations and orchestration triggers.

### 30. Why Next.js?

Short answer: It provides the operator-facing web application and works well for a dashboard with multiple routes and reusable UI components.

If they ask further: The frontend should render intelligence; it should not be responsible for computing the SIF decision.

### 31. Why a modular monolith instead of microservices?

Short answer: For an SIH prototype, a modular monolith reduces deployment and networking complexity while keeping the AI, graph, documents and workflow modules separated in code.

If they ask further: The technical specification explicitly defines the backend as a modular monolith. MCP is a protocol boundary, not a requirement to deploy every component as a separate service.

### 32. What is LangGraph doing?

Short answer: It is intended to orchestrate specialized processing steps with explicit state and conditional routing.

If they ask further: The seven conceptual agents are supervisor, classifier, entity extractor, rule mapper, graph analyst, explainer and action/CAPA.

### 33. Is LangGraph actually running in the current report path?

Short answer: The repository audit found that the normal ingestion worker currently executes the five-stage pipeline directly; the LangGraph swarm is defined but is not the active path.

If they ask further: This is a good example of why we separate current implementation from intended architecture.

### 34. What is MCP? Is it an AI model?

Short answer: No. MCP is a standardized tool-calling protocol. It lets an agent call reusable functions such as querying incidents, detecting clusters or generating a PDF.

If they ask further: The specification describes four local tools. MCP itself is not responsible for the safety decision.

### 35. Why NetworkX?

Short answer: It is lightweight and appropriate for the prototype's relationship graph and graph algorithms.

If they ask further: The intended durability layer is the database; NetworkX is the in-memory computation/query layer.

### 36. Why SQL for the temporal cluster instead of graph traversal?

Short answer: The cluster condition is fundamentally a time-window counting problem: group entities by equipment/location, filter reports to the rolling window, and count distinct reports.

If they ask further: The technical specification explicitly describes an indexed SQL approach for the rolling-window check. The graph then visualizes the resulting systemic signal.

### 37. What is the database storing?

Short answer: Reports, extracted entities, LSR tags, graph-edge persistence, CAPA actions, feedback and systemic alerts are the major data categories in the specification.

If they ask further: This creates a trace from the original observation to intelligence, relationship evidence, action and human review.

### 38. Why background processing?

Short answer: Some AI steps can be slower than an HTTP request should be. The API can persist the report quickly and let a background worker perform the pipeline.

If they ask further: The intended design also supports realtime events when processing stages complete.

## Part IV -- Demo/application screen questions

## Part IV -- Demo/application screen questions

### 39. What is the Triage Queue?

Answer: The prioritized inbox for observations. It answers: "What needs attention?"

### 40. Why do you have a DCS Control Room if you already have Triage?

Answer: The DCS wall answers: "What is happening across the operation right now?" Triage is for investigation and lifecycle management.

### 41. Why do you need the Heatmap?

Answer: It answers: "Where is risk concentrated?" It gives management a fleet/geographic view rather than a report-by-report view.

### 42. Why do you need the Signal Graph?

Answer: It answers: "Which safety concepts and observations are connected?" It exposes recurring equipment/location/barrier relationships.

### 43. Why do you need the Emergency Playbook?

Answer: Detection alone does not close the safety loop. The playbook turns an important finding into a structured response workflow.

### 44. Why Baghjan Replay?

Answer: It gives judges a concrete historical narrative showing why weak signals matter and how earlier correlation could change the response point.

### 45. Why System Control?

Answer: It exposes the health/configuration side of the system: local AI mode, model status, SIF thresholds and operational configuration.

### 46. Why a Shift Briefing PDF?

Answer: Safety information must survive shift changes. A concise handover document converts dashboard intelligence into something the next crew can act on.

## Part V -- Tough technical objections

### 47. What if the model gives a false positive?

Answer: A false positive is a review signal, not a reason for an uncertified physical action. The architecture uses thresholds, deterministic scoring, human review and audit trails. Thresholds should be validated on held-out data.

### 48. What if the model misses a real precursor?

Answer: No text model can guarantee zero misses. The system therefore combines multiple signals--SIF scoring, entities, LSR mapping, temporal recurrence and human review--and requires empirical evaluation.

### 49. What if two reports use different names for the same equipment?

Answer: Entity normalization/canonicalization is necessary. The technical specification explicitly identifies normalization as important because exact-value clustering otherwise breaks.

### 50. What if the same report is uploaded twice?

Answer: It must not count as two independent observations. Deduplication and idempotency protect the graph and temporal cluster detector.

### 51. What if the LLM is unavailable?

Answer: The report should remain usable with deterministic SIF/entity/LSR outputs. The explanation can be pending or retried; the LLM is not the single point of failure for classification.

### 52. What if Whisper fails?

Answer: The system should expose a truthful failure or pending state and preserve original audio when retention is enabled. It must never invent a transcript.

### 53. What if there is no internet?

Answer: The intended air-gapped architecture uses local embeddings, local ASR where packaged, local Ollama and local persistence/queueing. If a particular prototype path still needs connectivity, say so honestly.

### 54. How do you prove the system is air-gapped?

Answer: Process-level egress monitoring can show that the SANKET process has no outbound connections, but that is not proof of physical network isolation of the entire machine. Full assurance requires network-level controls and deployment validation.

### 55. How do you validate the AI?

Answer: Use held-out labeled data and report measured precision, recall and F1 for the relevant tasks. Do not evaluate only on synthetic data used to design the rules.

### 56. Isn't the synthetic dataset circular?

Answer: It can be if the same rules create and evaluate the dataset. Synthetic data is useful for demonstrating the pipeline and seeded clusters, but generalization should be assessed with separate held-out or externally grounded data.

## Part VI -- Baghjan replay and evidence questions

### 57. Are you claiming SANKET would definitely have prevented Baghjan?

Answer: No. The replay is a counterfactual demonstration using a historical timeline. It shows where SANKET's logic would surface precursor information and how an intervention could be represented; it is not proof that the real outcome was guaranteed to change.

### 58. Where did the Baghjan precursor sequence come from?

Answer: The project replay materials define a sequence involving mud loss, pressure anomaly, gas bubbling and later BOP/barrier degradation before the blowout. The team should distinguish project reconstruction/demo data from independently validated historical records.

### 59. Why is the Baghjan example useful?

Answer: It makes the abstract idea of weak signals concrete. Judges can see how individually separated observations can become meaningful when viewed together.

## Part VII -- Questions about the model choice: Qwen3:8B

### 60. Why did you change from llama3.1:8b to qwen3:8b?

Answer: The project needs a local 7B/8B-class model for the grounded explanation role. Qwen3:8B fits the resource class and is available locally through Ollama. The surrounding architecture does not depend on the exact model name.

### 61. Is 5.2 GB enough for your laptop?

Answer: The model can load on the available machine, as demonstrated by the successful Ollama test. Runtime memory also includes context/KV cache and buffers, so actual use is larger than the model file. For short explanations, the workload is modest.

### 62. Why not use Qwen3 for SIF classification?

Answer: Because classification is deliberately separated from generation. Embedding similarity against a defined precursor library is easier to reproduce and audit than asking an LLM for a free-form safety judgement.

### 63. Does Qwen3 need internet?

Answer: No, not when served locally through Ollama with the model already downloaded. The inference request stays on the local machine.

### 64. What does Qwen3 actually receive?

Answer: It should receive the report text plus deterministic outputs needed for grounding--SIF score/label, relevant entities, failed barrier, energy source and LSR context--and a strict instruction to explain rather than change the classification.

### 65. What if Qwen3 gives a different risk level?

Answer: The system should ignore that as a classification authority. The deterministic SIF result remains the official model output; Qwen's role is explanation.

## Part VIII -- "Why this feature?" master table

| Feature/component | Why it exists | One-line judge answer |
| --- | --- | --- |
| Field Reporter | Make field reporting fast and compatible with constrained/hazardous environments. | It gets the observation into SANKET with minimal worker effort. |
| RoIP Gateway | Bridge approved radio infrastructure to software. | It is the boundary between radio communications and SANKET's IP/AI layer. |
| Whisper / ASR | Convert spoken observations to text. | It makes voice usable by the same NLP pipeline as typed reports. |
| SIF Classifier | Prioritize high-consequence precursor observations. | It answers whether this observation has SIF potential. |
| 50 SIF Anchors | Provide known semantic precursor references. | They give the classifier a defined safety reference space. |
| Entity Extractor | Turn free text into structured context. | It finds the equipment, location, barrier and energy involved. |
| IOGP Mapper | Connect observations to established safety rules. | It tells the officer which Life-Saving Rule is relevant. |
| Qwen3:8B | Generate grounded natural-language explanation. | It explains the result; it does not decide the primary SIF score. |
| Signal Graph | Expose cross-report relationships. | It helps find recurring systemic patterns hidden across separate reports. |
| Near-Miss Multiplier | Detect accumulation over time. | Three correlated events in the configured seven-day window can become a systemic signal. |
| Triage Queue | Prioritize investigation. | It is the HSE officer's operational inbox. |
| DCS Control Room | Provide live situational awareness. | It is the fleet's current safety pulse. |
| SIF Heatmap | Show geographic concentration. | It tells management where precursor density is highest. |
| Emergency Playbook | Turn detection into response. | It gives the commander a structured SWA/response workflow. |
| CAPA | Track corrective action to closure. | It makes sure a finding can become an owned, time-bound action. |
| Human Review | Maintain accountability. | AI assists; the safety officer validates or overrides. |
| Baghjan Replay | Demonstrate the concept on a concrete historical timeline. | It shows why connecting weak signals earlier matters. |
| Shift Briefing | Preserve intelligence across shifts. | It turns the current safety picture into an actionable handover. |
| Air-Gap Mode | Protect sensitive operational data and support disconnected sites. | Core local AI can operate without sending reports to a cloud model. |
| LangGraph | Orchestrate specialized stages. | It makes the multi-stage workflow explicit and controllable. |
| MCP | Standardize tool access. | It lets agents call reusable database/graph/document tools. |

## Part IX -- Rapid-fire viva

| Question | Answer |
| --- | --- |
| What is the project's official expected outcome? | Rank sites/activities by SIF-precursor density and auto-map observations to Life-Saving Rules. |
| What is SIF? | Serious Injury & Fatality. |
| What is LSR? | IOGP Life-Saving Rule. |
| What is RoIP? | Radio over IP. |
| What is ASR? | Automatic Speech Recognition. |
| What is NER? | Named Entity Recognition. |
| What is SWA? | Stop Work Authority. |
| What is CAPA? | Corrective and Preventive Action. |
| What is the local LLM? | Ollama-served Qwen3:8B in the current local setup. |
| What is the embedding model? | multilingual-e5-small, 384 dimensions. |
| How many SIF anchors? | 50 in the project design. |
| How many IOGP rules? | 9. |
| What is the systemic window? | 7 days. |
| What is the cluster threshold? | 3 or more distinct events in the configured prototype rule. |
| Why NetworkX? | Lightweight graph computation for the prototype. |
| Why SQLite/PostgreSQL? | SQLite is convenient for local development; PostgreSQL is the production-oriented relational database in the specification. |
| Does the LLM decide SIF? | No; it explains the deterministic SIF result. |
| Can the graph prove causation? | No; it should be presented as evidence-based association/co-occurrence unless causal evidence exists. |
| Can AI physically shut down a rig? | Not as an uncertified autonomous function; the prototype shows a digital response workflow. |
| What happens if the LLM fails? | The report can remain usable; explanation can be pending/retried. |

## Part X -- What to say when you do not know

A strong technical team does not guess. Use one of these responses when a judge goes beyond the current prototype:

- "That is a production-integration question. Our current prototype defines the software boundary, while the exact site hardware/interface must be selected with the operator."

- "That capability is in our intended architecture, but I don't want to claim it is fully implemented in this build. The current demo shows the corresponding workflow."

- "We have a target for that metric, but we would only call it a guarantee after measuring the complete end-to-end path."

- "The model provides decision support; an authorized HSE officer remains the final operational authority."

- "I can explain the design decision, but I would need the deployment specification to give the exact production hardware value."

## Part XI -- Red-flag claims to avoid

| Avoid saying | Say instead |
| --- | --- |
| "The AI predicts accidents." | "The system detects SIF precursors and recurring risk signals." |
| "The graph proves causality." | "The graph shows evidence-based associations and recurring relationships." |
| "The AI automatically shuts down the rig." | "The prototype demonstrates a digital SWA/response workflow; physical interlocks require separate safety engineering." |
| "We are mathematically 100% air-gapped." | "The application is designed for local/air-gapped operation; process-level egress monitoring is shown in the prototype." |
| "Qwen decides whether something is dangerous." | "The deterministic SIF classifier makes the primary classification; Qwen generates the grounded explanation." |
| "Baghjan proves we would have saved lives." | "The replay is a counterfactual demonstration of how earlier signal correlation could support intervention." |
| "Every feature shown is fully production-ready." | "The SIH prototype demonstrates the core workflow; production hardware, OT integration and certification are separate deployment work." |
| "The model never hallucinates." | "Grounding, constrained prompts and human review reduce hallucination risk." |

## Part XII -- Recommended 3-minute golden-path narrative

1. Start with the problem: "Safety reports contain weak signals, but they are fragmented across text, voice and shifts."

1. Show Field Reporter: "A worker reports a hazard in a simple voice/PTT workflow."

1. Show the pipeline: "SANKET transcribes, scores SIF, extracts entities and maps the IOGP rule."

1. Show Triage: "The officer sees the report prioritized among other observations."

1. Show Signal Graph: "Now we move from one report to the pattern across reports."

1. Show Heatmap/DCS: "We can see where risk is concentrated and what is happening across the fleet."

1. Show Emergency Playbook: "The system turns an important finding into a structured response workflow."

1. Show Baghjan Replay: "Finally, we demonstrate why connecting precursor signals earlier matters."

1. Close: "SANKET's value is not one AI model. It is the complete chain from field signal → intelligence → systemic pattern → human action."

## Part XIII -- Source basis

This handbook is grounded in the current uploaded project materials: `understandsanketai.md`, `SANKET_PRD.md`, `SANKET_TECHNICAL_APPLICATION_SPECIFICATION_FINAL.md`, `SANKET_COMPONENT_DEEP_ANALYSIS.md`, the Field Reporter/RoIP specifications, `SANKET_SIGNAL_GRAPH_SPECIFICATION.md`, `mentor feedback.md`, `task.md` and `README.md`.

| Final team rule Know the difference between WHAT THE PRODUCT IS, WHAT THE PROTOTYPE CURRENTLY DOES, and WHAT THE PRODUCTION ARCHITECTURE WOULD DO. That distinction will make your answers more credible, not less impressive. |
| --- |
