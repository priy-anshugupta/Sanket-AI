# 🛡️ SANKET · AI — Core USPs & Data Privacy Architecture
### Smart India Hackathon 2026 · Problem Statement SIH26165
**Ministry of Petroleum and Natural Gas · Oil India Limited (OIL)**

---

## 📌 Executive Pitch Summary (The 15-Second Judge Hook)

> *"Unlike generic AI wrappers that leak sensitive PSU wellhead telemetry to public cloud APIs, SANKET AI features a defense-grade, sovereign air-gapped architecture. We calculate mathematical SIF risk deterministically with zero generative hallucinations, mask personal identifiers locally on CPU, and automatically enforce dynamic 500m Stop Work Authority (SWA) digital permit lockouts across Oil India Limited assets."*

---

## 🏆 Top 5 Architectural USPs & Privacy Differentiators

```
+--------------------------------------------------------------------------------------------------+
|                                    SANKET AI — USP COMPARISON                                    |
+------------------------------------+-------------------------------------------------------------+
| What Generic Hackathon Teams Do    | What SANKET AI Does (Winning Differentiator)                |
+------------------------------------+-------------------------------------------------------------+
| 1. Full Cloud Dependency           | 1. 100% Sovereign Air-Gap with Zero-Egress Socket Monitor    |
| 2. Raw PII & Telemetry Leakage     | 2. Local PII Scrubbing & Industrial Regex Sanitization      |
| 3. Generative AI Hallucinations    | 3. Deterministic + Neuro-Symbolic Mathematical Risk Scoring |
| 4. Isolated Single-Text Analysis   | 4. Cross-Signal Knowledge Graph & Near-Miss Multiplier      |
| 5. Passive Read-Only Dashboard     | 5. Spatial Stop Work Authority (SWA) 500m Permit Freeze     |
+------------------------------------+-------------------------------------------------------------+
```

---

### 1. 🛡️ Sovereign Air-Gapped Dual-Mode Architecture (Zero-Egress Isolation)
* **The Problem with Other Solutions**:
  * Generic applications send proprietary upstream drilling telemetry, pressure logs, and worker identities directly to third-party public cloud endpoints (OpenAI / Anthropic).
  * If internet connectivity drops at remote Upper Assam drilling sites, the entire application stops working.
* **SANKET AI's Unique Solution**:
  * **100% On-Premise Execution**: Sentence embeddings (`multilingual-e5-small`), zero-shot NER, IOGP classification, and DEKRA mathematical scoring execute completely on local on-premise CPU/GPU hardware with **zero external network egress**.
  * **Live Socket Egress Monitor (`/api/system/airgap`)**: Dashboard features a real-time monitor inspecting active network sockets to mathematically prove `0 KB/s OUT · AIR-GAPPED` operational status for DGMS statutory safety audits.
  * **Optional Hybrid Mode**: When `OPENAI_API_KEY` or `GROQ_API_KEY` is enabled, cloud access is restricted strictly to Stage 5 plain-English summaries after all sensitive data has been sanitized locally.

---

### 2. 🔒 Local PII & Proprietary Data Privacy Firewall
* **The Problem with Other Solutions**:
  * Raw worker names, mobile numbers, Aadhaar IDs, contractor details, and exact wellhead coordinates are sent unmasked to external LLMs.
* **SANKET AI's Unique Solution**:
  * **Stage 1 Local Normalization**: All incoming voice transcripts and text reports pass through a local regex and linguistic filter that scrubs personal phone numbers, payroll IDs, and sensitive employee identifiers **locally on CPU** before any vectorization or processing occurs.
  * **Sovereign Anonymization**: Even in cloud-enhanced mode, third-party APIs only receive sanitized, generalized incident hazard tokens with zero linkable employee identities.

---

### 3. ⚡ Deterministic + Neuro-Symbolic Hybrid (Zero Hallucination Guarantee)
* **The Problem with Other Solutions**:
  * Teams use raw LLM prompts (*"Rate this risk 1-10"*). Generative models hallucinate, flip severity scores unpredictably between runs, and fail standard industrial reproducibility audits.
* **What SANKET AI Does Differently**:
  * **Separation of Scoring from Language Generation**: SANKET AI's continuous SIF risk score ($S_{\\text{SIF}} \\in [0.0, 1.0]$) is computed purely through mathematical cosine similarity against **48 safety-calibrated DEKRA SIF reference anchors**.
  * **5-Token Negation Window Parser**: Explicitly distinguishes affirmative hazards from negative observations (e.g., *"no fire observed"* or *"BOP valve did not shear"* do not trigger false positive score spikes).
  * **Strict Quarantining**: LLMs are utilized strictly for Stage 5 plain-English explanatory synthesis and can never alter the deterministic SIF risk score or IOGP rule classification.

---

### 4. 🕸️ Multi-Signal Knowledge Graph & Near-Miss Multiplier
* **The Problem with Other Solutions**:
  * Other solutions treat each safety report in isolation. Minor near-misses (e.g., a weeping valve) are classified as "LOW" and forgotten.
* **What SANKET AI Does Differently**:
  * **In-Memory NetworkX Knowledge Graph**: Automatically links isolated low-level observations across shifts, contractors, and assets.
  * **Near-Miss Multiplier Engine**: If 3 or more minor near-misses occur at the same equipment or location within a 7-day rolling window (e.g., *Day 1 weeping valve + Day 3 vibration spike + Day 5 annular pressure kick*), SANKET AI automatically detects the compound precursor pattern and escalates the collective risk to **HIGH SIF**.

---

### 5. 🛑 Spatial Stop Work Authority (SWA) Digital Permit Lockout
* **The Problem with Other Solutions**:
  * Most hackathon dashboards are passive read-only displays of charts and tables with no automated operational containment.
* **What SANKET AI Does Differently**:
  * **Direct Physical Integration**: Connects the AI precursor detection engine directly to physical **Upper Assam GIS geometry**.
  * **Automated Digital Lockout**: When a critical SIF precursor is detected ($S_{\\text{SIF}} \\ge 0.70$), SANKET AI calculates the dynamic blast hazard radius and issues an instantaneous **Stop Work Authority (SWA) digital freeze** on all active electronic Permits to Work (e-PTWs) within 500m of the affected asset, sounding the rig siren before workers can enter the hazardous perimeter.

---

## 🎙️ Quick Answers to Common Judge Questions

### Q1: "Why not just use ChatGPT or Claude for everything?"
> **Answer:** *"In upstream oil & gas exploration, lives depend on 100% reproducible, auditable decisions. Generative LLMs hallucinate and violate DGMS data sovereignty guidelines. SANKET AI calculates mathematical risk deterministically using DEKRA anchors on local servers, guaranteeing zero hallucinations, instant sub-second response, and verified data privacy."*

### Q2: "Can workers use phones on the rig floor?"
> **Answer:** *"In hazardous ATEX Zone 0/1 areas, civilian phones are prohibited. SANKET AI is designed for ATEX Zone 1 intrinsically safe handhelds and VHF/UHF Push-to-Talk radios via our glove-friendly mobile terminal (`/worker`). In safe muster zones and offices, any standard mobile device or tablet is supported."*

### Q3: "What if there is no internet at remote Assam drilling sites?"
> **Answer:** *"SANKET AI runs completely standalone on local on-premise hardware without needing an internet connection or external API keys. All embeddings, NER models, graph clustering, and speech-to-text operate offline on local CPU/GPU memory."*

---

<div align="center">
  <sub><strong>SANKET · AI</strong> — Built for Oil India Limited · Smart India Hackathon 2026</sub>
</div>
