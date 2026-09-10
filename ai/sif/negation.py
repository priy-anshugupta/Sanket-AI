"""
SANKET · AI — Negation Window Parser
5-token negation window to suppress false-positive keyword boosts.
"""

import re


class NegationParser:
    """
    Checks if a critical keyword is preceded by a negation term
    within a 5-token window. Prevents false positives like
    "no explosion occurred" from triggering a keyword boost.
    """

    def __init__(self, negation_terms: list[str] = None):
        if negation_terms:
            self.negation_terms = [t.lower() for t in negation_terms]
        else:
            try:
                from backend.config.settings import settings
                self.negation_terms = [t.lower() for t in settings.NEGATION_TERMS]
            except Exception:
                self.negation_terms = [
                    "no", "not", "without", "avoided", "zero",
                    "never", "prevented", "none", "absent",
                    "nahi", "nhi", "nahin", "bina",
                    "nai", "nohoy", "nahoi", "nohoi", "nehi",
                ]

    def is_negated(self, text: str, keyword: str) -> bool:
        """
        Check if a keyword occurrence in text is negated.

        Args:
            text: The full report text (lowercase)
            keyword: The critical keyword to check

        Returns:
            True if the keyword is negated (should NOT boost), False otherwise
        """
        text_lower = text.lower()
        keyword_lower = keyword.lower()

        # Find all occurrences of the keyword
        pattern = re.compile(re.escape(keyword_lower))
        matches = list(pattern.finditer(text_lower))

        if not matches:
            return False

        # Tokenize the text
        tokens = text_lower.split()

        for match in matches:
            # Find token position of the keyword
            char_pos = match.start()
            token_idx = self._char_to_token_index(text_lower, tokens, char_pos)

            if token_idx is None:
                continue

            # Check 5-token window before the keyword
            window_start = max(0, token_idx - 5)
            preceding_tokens = tokens[window_start:token_idx]

            # Check if any negation term is in the window
            for token in preceding_tokens:
                # Strip punctuation for comparison
                clean_token = re.sub(r"[^\w]", "", token)
                if clean_token in self.negation_terms:
                    return True

        return False

    def _char_to_token_index(self, text: str, tokens: list[str], char_pos: int) -> int | None:
        """Map a character position to a token index."""
        current_pos = 0
        for idx, token in enumerate(tokens):
            token_start = text.find(token, current_pos)
            if token_start == -1:
                continue
            token_end = token_start + len(token)
            if token_start <= char_pos < token_end:
                return idx
            current_pos = token_end
        return None

    def check_keywords(self, text: str, keywords: list[str]) -> list[dict]:
        """
        Check multiple keywords against the text.

        Returns:
            List of {keyword, found, negated, should_boost}
        """
        text_lower = text.lower()
        results = []

        for keyword in keywords:
            found = keyword.lower() in text_lower
            negated = self.is_negated(text, keyword) if found else False
            results.append({
                "keyword": keyword,
                "found": found,
                "negated": negated,
                "should_boost": found and not negated,
            })

        return results


# Singleton
negation_parser = NegationParser()
