"""
SANKET · AI — Stage 1: Text Preprocessor
Unicode normalization, language detection, and text cleanup.
"""

import re
import unicodedata
from langdetect import detect, LangDetectException


class TextPreprocessor:
    """
    Stage 1 of the 5-stage NLP pipeline.
    Cleans raw report text and detects language.
    """

    def __init__(self):
        # Common mojibake / HTML entity patterns
        self._html_entities = {
            "&amp;": "&", "&lt;": "<", "&gt;": ">",
            "&quot;": '"', "&apos;": "'", "&#39;": "'",
        }

    def preprocess(self, raw_text: str) -> dict:
        """
        Preprocess raw report text.

        Returns:
            {
                "preprocessed_text": str,
                "language": str,
                "word_count": int,
                "is_valid": bool
            }
        """
        if not raw_text or not raw_text.strip():
            return {
                "preprocessed_text": "",
                "language": "unknown",
                "word_count": 0,
                "is_valid": False,
            }

        text = raw_text.strip()

        # Unicode NFC normalization
        text = unicodedata.normalize("NFC", text)

        # Fix HTML entities
        for entity, replacement in self._html_entities.items():
            text = text.replace(entity, replacement)

        # Remove control characters (but keep newlines and tabs)
        text = "".join(
            ch for ch in text
            if unicodedata.category(ch) != "Cc" or ch in ("\n", "\t", "\r")
        )

        # Normalize whitespace (collapse multiple spaces, preserve newlines)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = text.strip()

        # Detect language
        language = self._detect_language(text)

        # Word count
        word_count = len(text.split())

        return {
            "preprocessed_text": text,
            "language": language,
            "word_count": word_count,
            "is_valid": word_count >= 1,  # Valid even for short field observations (e.g. 'all good', 'fire', 'leak')
        }

    def _detect_language(self, text: str) -> str:
        """Detect language using langdetect. Returns ISO 639-1 code."""
        try:
            lang = detect(text)
            # Map to our supported languages
            lang_map = {
                "en": "en",
                "hi": "hi",
                "as": "as",  # Assamese
                "bn": "bn",  # Bengali
            }
            return lang_map.get(lang, lang)
        except LangDetectException:
            return "en"  # Default to English


# Singleton
preprocessor = TextPreprocessor()
