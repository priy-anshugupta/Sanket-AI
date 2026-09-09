"""
SANKET · AI — Stage 5: LLM Explainer
Grounded 2-sentence explanation using Groq (online) or Ollama (offline).
"""

import httpx
from backend.config.settings import settings


class LLMExplainer:
    """
    Stage 5 of the NLP pipeline.
    Generates a grounded, 2-sentence plain-English explanation
    citing the specific barrier failure and energy source.

    Only runs for reports with sif_score >= 0.50.
    """

    PROMPT_TEMPLATE = """You are a DGMS-certified Senior Industrial Process Safety Expert & SIF Auditor at Oil India Limited (Upper Assam Basin).
You are evaluating an incoming frontline hazard report word-by-word with ZERO tolerance for hallucination.

RAW REPORT TEXT: "{text}"
BASELINE SIF CLASSIFICATION: {sif_label} (Score: {sif_score:.0%})
MATCHED OILFIELD PRECURSOR ANCHOR: "{matched_anchor}"

DEEP REASONING PROTOCOL (Perform step-by-step word-by-word evaluation):
1. WORD-BY-WORD DECOMPOSITION: Carefully parse every word. Identify:
   - Specific equipment mentioned (e.g., BOP, manifold, standpipe, mud pump, compressor, crane, scaffold, pipeline).
   - Physical state & failure condition (e.g., leaking, weeping, vibrating, cracked, unbolted, corroded, surging).
   - High-energy source & magnitude (e.g., wellbore gas, 1800 PSI, 33kV high voltage, suspended 5-ton load, H2S toxic gas, height).
   - Active safety barrier broken/bypassed (e.g., primary hydraulic seal, secondary blind ram, LOTO padlock, safety harness, relief valve).
2. CONTEXT INTEGRITY & NEGATION CHECK: Verify if words like "no", "nahi", "nai", "safe", "normal" are present to avoid false alarms.
3. REGULATORY COMPLIANCE: Map the failure directly to OISD-189 (Standard Operating Procedures) and IOGP 9 Life-Saving Rules.

OUTPUT REQUIREMENT:
Provide a rigorous, grounded, 3-sentence safety executive synthesis:
Sentence 1 [WHAT HAPPENED]: State the exact physical equipment, failure mechanism, and energy source using strictly the facts present in the text.
Sentence 2 [WHY IT IS DANGEROUS]: Explain the barrier failure pathway and how this precursor could escalate to a Serious Injury or Fatality (SIF) per API RP 754 / IOGP rules.
Sentence 3 [MANDATORY IMMEDIATE ACTION]: Specify the mandatory regulatory countermeasure (e.g., Stop Work Authority, 500m digital perimeter freeze, LOTO isolation, well kill sequence, or continuous air monitoring).

STRICT ANTI-HALLUCINATION GUARDRAILS:
- NEVER invent equipment, pressures, or locations not explicitly mentioned in the text.
- If the report is in Hindi, Hinglish, Assamese, or Bengali, translate the context accurately and write the analysis in professional English.
- Output ONLY the 3 grounded sentences. No preambles, no bullet labels."""

    SYSTEM_PROMPT = """You are a senior Oil & Gas industrial process safety auditor at Oil India Limited with 20+ years field experience in Upper Assam oilfields.
You are certified in DGMS regulations, OISD-189 safety standards, IOGP 9 Life-Saving Rules, and API RP 754 SIF precursor methodology.
You examine incoming field reports word-by-word, analyze root-cause barrier failures, and produce exact 3-sentence executive directives with zero hallucination."""

    async def explain(
        self,
        text: str,
        sif_label: str,
        sif_score: float,
        matched_anchor: str = "",
        entities: list[dict] = None,
    ) -> str | None:
        """
        Generate a grounded 3-sentence explanation with DGMS/OISD guardrails.
        Routes to GPT-4o (online) or Groq/Ollama based on AI_MODE.
        """
        prompt = self.PROMPT_TEMPLATE.format(
            text=text[:800],
            sif_label=sif_label,
            sif_score=sif_score,
            matched_anchor=matched_anchor,
        )

        if settings.AI_MODE == "online":
            if settings.OPENAI_API_KEY:
                res = await self._explain_openai(prompt)
                if res:
                    return res
                print("[Explainer] OpenAI failed or timed out; falling back to local Ollama...")
            elif settings.GROQ_API_KEY:
                res = await self._explain_groq(prompt)
                if res:
                    return res
                print("[Explainer] Groq failed or timed out; falling back to local Ollama...")

        return await self._explain_ollama(prompt)

    async def _explain_openai(self, prompt: str) -> str | None:
        """Call OpenAI GPT-4o for grounded industrial safety explanation."""
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.OPENAI_MODEL or "gpt-4o",
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_PROMPT},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.15,
                        "max_tokens": 300,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Explainer] OpenAI GPT-4o error: {e}")
            return None

    async def _explain_groq(self, prompt: str) -> str | None:
        """Call Groq API for explanation."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are a concise industrial safety analyst. Answer in exactly 2 sentences."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 200,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[Explainer] Groq API error: {e}")
            return None

    async def _explain_ollama(self, prompt: str) -> str | None:
        """Call local Ollama for explanation."""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_HOST}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "num_predict": 200,
                        },
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "").strip()
        except Exception as e:
            print(f"[Explainer] Ollama error: {e}")
            return None


# Singleton
llm_explainer = LLMExplainer()
