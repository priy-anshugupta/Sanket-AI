"""
SANKET · AI — SIF Anchor Library Loader
Loads and precomputes embeddings for 50 SIF anchor texts.
"""

import json
import os
import numpy as np
from pathlib import Path


class AnchorLibrary:
    """
    Manages the 50-item SIF Anchor Library.
    Precomputes embeddings at process startup for fast cosine similarity.
    """

    def __init__(self):
        self.anchors: list[dict] = []
        self.anchor_embeddings: np.ndarray | None = None
        self._loaded = False

    def load(self, data_path: str = None, embedding_model=None):
        """
        Load anchors from JSON and precompute embeddings.

        Args:
            data_path: Path to sif_anchor_library.json
            embedding_model: SentenceTransformer model instance
        """
        if data_path is None:
            data_path = os.path.join(
                Path(__file__).parent.parent.parent, "data", "sif_anchor_library.json"
            )

        with open(data_path, "r", encoding="utf-8") as f:
            self.anchors = json.load(f)

        if embedding_model is not None:
            # Precompute all anchor embeddings in one batch
            anchor_texts = [
                f"query: {anchor['text']}" for anchor in self.anchors
            ]
            self.anchor_embeddings = embedding_model.encode(
                anchor_texts,
                normalize_embeddings=True,
                show_progress_bar=False,
                batch_size=64,
            )

        self._loaded = True

    def get_anchor_by_id(self, anchor_id: str) -> dict | None:
        """Get a specific anchor by its ID."""
        for anchor in self.anchors:
            if anchor["id"] == anchor_id:
                return anchor
        return None

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def count(self) -> int:
        return len(self.anchors)


# Singleton
anchor_library = AnchorLibrary()
