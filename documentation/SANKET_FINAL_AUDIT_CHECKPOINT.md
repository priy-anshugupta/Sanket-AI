# SANKET AI Final Audit Checkpoint

## 1. Executive Understanding
SANKET AI is an edge-oriented safety-intelligence platform built for upstream Oil & Gas (specifically Oil India). It is designed to convert fragmented safety observations into actionable Serious Injury & Fatality (SIF) precursor intelligence. The codebase consists of a React/Next.js frontend, a FastAPI/PostgreSQL backend, and a procedural NLP pipeline augmented with embedding-based semantic matching.

## 2. Verified Architecture
- **Backend:** FastAPI, PostgreSQL (asyncpg), SQLAlchemy.
- **Frontend:** Next.js, React, TailwindCSS.
- **AI/NLP Pipeline:** A unified, sequential pipeline (Preprocessor -> SIF Classifier -> Physics Guardrails -> Entity Extractor -> IOGP Mapper -> LLM Explainer -> Graph Ingestion).
- **Presentation:** A mix of fully wired live dashboards and hardcoded static mockups used for demonstration purposes.

## 3. Active Execution Path
**(All stages below are currently executed sequentially via `backend/workers/pipeline_worker.py`)**
1. **Input:** Raw report text ingested via `/api/reports/ingest`.
2. **Preprocessing:** Unicode normalization, language detection via `langdetect` (Deterministic).
3. **SIF Classification:** Cosine similarity via `multilingual-e5-small` embeddings against 50 static anchor vectors + keyword boost.
4. **Physics Guardrail Reconciliation:** Applies regex-based score floors (e.g. 0.85 for active barrier failure) and ceilings (e.g. 0.18 for routine drill).
5. **Entity Extraction:** Hardcoded regex and keyword matching for 8 industrial entity types.
6. **IOGP Mapping:** Cosine similarity via `multilingual-e5-small` against 9 IOGP rules.
7. **LLM Explanation:** 3-sentence grounded explanation via `llama3.1:8b` (Ollama) or `gpt-4o` (OpenAI API).
8. **Graph Insertion:** Ephemeral in-memory NetworkX edge addition.
9. **Systemic Clustering:** SQL aggregation grouped by entity.
10. **Persistence:** Saved to PostgreSQL database.

## 4. Feature Implementation Status
- **Triage Queue Dashboard (`/dashboard`):** IMPLEMENTED (Fully wired to database).
- **Voice / Field Reporter Dashboard (`/dashboard/voice`):** IMPLEMENTED (Fully wired to Whisper STT and backend API).
- **Near-Miss Multiplier:** IMPLEMENTED (SQL clustering logic).
- **GIS Heatmap Dashboard (`/dashboard/heatmap`):** PARTIALLY IMPLEMENTED (Matrix data uses live SQL aggregation; Map points and radiuses are SIMULATED/HARDCODED).
- **Emergency SWA Dashboard (`/dashboard/emergency`):** PARTIALLY IMPLEMENTED (Triggering SWA uses live API; Location threats, contacts, and checklists are SIMULATED/HARDCODED).
- **Baghjan Replay (`/dashboard/replay`):** SIMULATED/HARDCODED (Driven entirely by static React UI state; no backend interaction).
- **Air-Gap Telemetry:** PARTIALLY IMPLEMENTED (Monitors process-level TCP egress using `psutil`, not true hardware/OS-level isolation).

## 5. AI/ML Implementation Status
- **Multi-Agent Orchestration:** SPECIFIED (LangGraph swarm code exists but is bypassed entirely by a procedural worker).
- **SIF Classifier:** IMPLEMENTED (Vector embedding similarity).
- **Entity Extractor:** IMPLEMENTED (Deterministic Regex/Keyword matching).
- **Physics Guardrails:** IMPLEMENTED (Deterministic Regex engine).
- **LLM Explainer:** IMPLEMENTED (Generates text prompt via API).
- **Graph Engine:** PARTIALLY IMPLEMENTED (In-memory NetworkX graph resets on server restart).

## 6. Current Model Configuration
- **Embedding Model:** `intfloat/multilingual-e5-small` (384-dimensional).
- **Voice STT:** Local Whisper `base` or OpenAI `whisper-1` API.
- **LLM Engine:** Local `llama3.1:8b` (via Ollama), or `gpt-4o` / Groq API.
- **Qwen3:8B:** SPECIFIED (Mentioned in documentation but completely absent from the actual codebase/execution).

## 7. Field Reporter / RoIP Status
- **Status:** IMPLEMENTED.
- **Details:** The `/dashboard/voice` UI successfully transcribes audio using Whisper and transmits it to `/api/reports/ingest`, dynamically passing it through the active backend pipeline and generating a real database record.

## 8. Known Implementation / Documentation Discrepancies
- **Discrepancy:** Docs claim LangGraph 8-Agent Swarm execution; reality is a bypassed procedural worker.
- **Discrepancy:** Docs claim "Zero-Shot NER via spaCy/GLiNER"; reality is deterministic Regex string matching.
- **Discrepancy:** Docs claim "Physics-Informed AI / Neuro-symbolic architecture"; reality is deterministic Regex pattern matching (if text contains "1800 PSI", set score to 0.85).
- **Discrepancy:** Docs claim `Qwen3:8B` acts as the primary classifier; reality is embeddings classify the text, and `llama3.1:8b` (or GPT-4o) merely generates a 3-sentence summary afterward.
- **Discrepancy:** Docs claim 100% Physical Air-Gap Telemetry; reality is process-level python `psutil` socket checking.

## 9. Known Weaknesses
- **Entity Extractor:** Fails silently on unknown industrial entities due to strict reliance on hardcoded keyword lists.
- **Physics Guardrails:** Extremely brittle. Changing a keyword slightly (e.g., phrasing a pressure surge differently than hardcoded regex) bypasses the guardrail.
- **Evaluation Deficit:** Zero robust ML evaluation metrics exist (no precision, recall, F1, or confusion matrix).
- **Circular Testing:** The synthetic dataset (`synthetic_500.json`) is generated using the exact keywords the rules engine looks for, meaning it cannot be used to prove real-world accuracy.
- **Ephemeral Graph:** The live Knowledge Graph clears entirely on every backend restart.

## 10. Open Questions Requiring Investigation
- Execution of STAGE 7: Document Audit.
- Execution of STAGE 8: Judge/Viva Attack Test.
- Execution of STAGE 9: Prioritized Change Plan.
- Execution of STAGE 10: Recommended Rewritten Sections.

## 11. Required Documentation Corrections
- Remove all claims that Qwen3:8B operates as the primary SIF classifier.
- Accurately describe the Entity Extractor as "Regex pattern matching" rather than neural/zero-shot NER.
- Remove the LangGraph swarm diagram from the active ingestion path description.
- Restrict claims of "Physics-informed AI" and replace with "Deterministic Safety Guardrails".
- Clarify that Air-Gap Telemetry monitors process-level Python sockets, not the physical machine interface.

## 12. Recommended Final Terminology
- **Use:** "Semantic Embedding Classifier" (Instead of Probabilistic/LLM Classifier).
- **Use:** "Deterministic Safety Guardrails" (Instead of Physics-Informed AI or Neuro-Symbolic).
- **Use:** "Hybrid NLP Pipeline" (Instead of Agent Swarm).
- **Use:** "Regex Pattern Extraction" (Instead of Zero-Shot NER).
- **Use:** "Semantic Similarity Matching" (For the IOGP Rule Mapper).

## 13. Judge / Viva Vulnerabilities
1. *"Show me your LangGraph swarm executing."* -> **VULNERABILITY:** The code actively bypasses it in favor of a procedural python function.
2. *"What is the F1 score of your NER model?"* -> **VULNERABILITY:** It is just a regex script; no F1 metrics or holdout test set exist.
3. *"How did you evaluate the SIF classifier?"* -> **VULNERABILITY:** Evaluation consists solely of a 14-string hardcoded unit test (`test_classifier_calibration.py`).
4. *"Is the Baghjan replay pulling historical data from the backend?"* -> **VULNERABILITY:** It is entirely driven by a hardcoded static React state variable.

## 14. Files Inspected During Audit
- `backend/main.py`
- `backend/config/settings.py`
- `backend/workers/pipeline_worker.py`
- `backend/api/voice_routes.py`
- `ai/agents/swarm.py`
- `ai/preprocessing/preprocessor.py`
- `ai/sif/classifier.py`
- `ai/sif/anchor_library.py`
- `ai/sif/guardrails.py`
- `ai/sif/physics_rules.py`
- `ai/entities/extractor.py`
- `ai/lsr/mapper.py`
- `ai/explanation/explainer.py`
- `ai/voice/whisper_service.py`
- `data/sif_anchor_library.json`
- `scripts/test_classifier_calibration.py`
- `scripts/generate_synthetic_data.py`
- `frontend/app/dashboard/voice/page.tsx`
- `frontend/app/dashboard/heatmap/page.tsx`
- `frontend/app/dashboard/emergency/page.tsx`
- `frontend/app/dashboard/replay/page.tsx`
