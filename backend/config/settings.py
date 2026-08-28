"""
SANKET · AI — Central Configuration
Pydantic Settings for all environment variables and thresholds.
"""

from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Central configuration loaded from .env file."""

    # --- App ---
    APP_NAME: str = "SANKET · AI"
    APP_VERSION: str = "1.0.0"
    AI_MODE: Literal["online", "airgapped"] = "online"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres.hbpcldlvsgnsyaqyaosq:qAvX%2BD77%40nK6g6Z@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

    # --- Auth ---
    JWT_SECRET: str = "changeme-to-a-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 480

    # --- Online LLM Provider (Groq) ---
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # --- Offline LLM Provider (Ollama) ---
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # --- SIF Classification Thresholds ---
    SIF_HIGH_THRESHOLD: float = 0.75
    SIF_MEDIUM_THRESHOLD: float = 0.50
    LSR_SIMILARITY_THRESHOLD: float = 0.45

    # --- Near-Miss Multiplier ---
    CLUSTER_WINDOW_DAYS: int = 7
    CLUSTER_MIN_EVENTS: int = 3

    # --- Embedding Model ---
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-small"

    # --- Keyword Boost ---
    KEYWORD_BOOST: float = 0.15

    # --- Critical SIF Keywords ---
    CRITICAL_KEYWORDS: list[str] = [
        "fatality", "confined space", "energized", "fall from height",
        "h2s", "h₂s", "blowout", "explosion", "crush", "amputation",
        "high voltage", "unanchored", "high pressure", "flammable",
        "toxic gas", "well kick", "fire", "electrocution",
        "struck by", "caught between", "collapse"
    ]

    # --- Negation Terms ---
    NEGATION_TERMS: list[str] = [
        "no", "not", "without", "avoided", "zero",
        "never", "prevented", "none", "absent"
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton instance
settings = Settings()
