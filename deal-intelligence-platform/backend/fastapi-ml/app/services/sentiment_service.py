from __future__ import annotations

import sys

from app.core.config import settings

sys.path.append(str(settings.nlp_code_dir))
try:
    from sentiment_pipeline import SentimentService  # type: ignore  # noqa: E402
except Exception:
    class SentimentService:
        def analyze(self, text: str) -> dict:
            lowered = text.lower()
            negative = any(term in lowered for term in ["delay", "risk", "competitor", "pricing", "concern"])
            positive = any(term in lowered for term in ["approved", "confirmed", "aligned", "signed"])
            label = "negative" if negative else "positive" if positive else "neutral"
            return {"label": label, "score": 0.66 if label != "neutral" else 0.5, "summary": text[:220], "model": "heuristic"}

sentiment_service = SentimentService()
