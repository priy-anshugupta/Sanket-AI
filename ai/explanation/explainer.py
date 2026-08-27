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

    PROMPT_TEMPLATE = """You are an industrial safety expert analyzing a safety incident report.

Given this safety incident report and its SIF classification of {sif_label} (score: {sif_score}):

Report: "{text}"

Most similar known precursor: "{matched_anchor}"

Explain in exactly 2 sentences why this event has serious injury or fatality potential.
Reference the specific barrier failure and energy source identified.
Be concise, factual, and cite specific hazards from the report text. Do not hallucinate details not present in the report."""

    async def explain(
        self,
        text: str,
        sif_label: str,
        sif_score: float,
        matched_anchor: str = "",
        entities: list[dict] = None,
    ) -> str | None:
        """
        Generate a 2-sentence grounded explanation.

        Routes to Groq API (online) or Ollama (offline) based on AI_MODE.
        """
        prompt = self.PROMPT_TEMPLATE.format(
            text=text[:500],  # Limit context window
            sif_label=sif_label,
            sif_score=sif_score,
            matched_anchor=matched_anchor,
        )

        if settings.AI_MODE == "online" and settings.GROQ_API_KEY:
            return await self._explain_groq(prompt)
        else:
            return await self._explain_ollama(prompt)

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
            # Do NOT silently fall back to Ollama — per spec Section 15
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
