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

    PROMPT_TEMPLATE = """You are a DGMS-certified senior safety expert at Oil India Limited, trained on OISD-189, IOGP Life-Saving Rules, and API RP 754 SIF precursor methodology.

INCIDENT REPORT: "{text}"

SIF CLASSIFICATION: {sif_label} (score: {sif_score:.0%})
NEAREST KNOWN PRECURSOR: "{matched_anchor}"

TASK: Produce a precise 3-sentence analysis:
1. WHAT happened — identify the specific equipment, energy source, and failure mechanism from the report text only.
2. WHY this is dangerous — explain the barrier failure chain and SIF fatality pathway per IOGP/OISD standards.
3. IMMEDIATE ACTION — state the mandatory response per DGMS/OISD (e.g., Stop Work Authority, LOTO, area evacuation radius, pressure bleed-off).

GUARDRAILS:
- ONLY cite facts explicitly stated in the report text. Do NOT invent equipment names, pressures, or locations not mentioned.
- If the report is in Hindi/Hinglish/Assamese, still analyze in English.
- If the report describes a routine/safe activity, explain why SIF risk is low.
- Be specific: name the barrier (e.g., "BOP annular seal"), the energy source (e.g., "1800 PSI wellbore pressure"), and the IOGP rule violated."""

    SYSTEM_PROMPT = """You are a senior Oil & Gas industrial safety analyst at Oil India Limited with 20+ years field experience in Upper Assam oilfields.
You are trained on DGMS (Directorate General of Mines Safety) regulations, OISD-189 safety standards, IOGP 9 Life-Saving Rules, and API RP 754 SIF precursor framework.
You analyze safety incident reports and provide grounded, factual explanations.
NEVER hallucinate or fabricate details not present in the report.
Answer in exactly 3 concise, technical sentences."""

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
                return await self._explain_openai(prompt)
            if settings.GROQ_API_KEY:
                return await self._explain_groq(prompt)
            print("[Explainer] No online API key (OpenAI or Groq) configured; explanation skipped")
            return None

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
