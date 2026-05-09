from __future__ import annotations


class SentimentService:
    def __init__(self, model_name: str = "ProsusAI/finbert"):
        self.model_name = model_name
        self._pipeline = None

    def _load(self):
        if self._pipeline is None:
            from transformers import pipeline

            self._pipeline = pipeline("sentiment-analysis", model=self.model_name)
        return self._pipeline

    def analyze(self, text: str) -> dict:
        try:
            result = self._load()(text[:1500])[0]
            label = result["label"].lower()
            return {
                "label": label,
                "score": float(result["score"]),
                "summary": text[:220],
                "model": self.model_name,
            }
        except Exception:
            lowered = text.lower()
            negative = any(term in lowered for term in ["delay", "risk", "competitor", "pricing", "concern"])
            positive = any(term in lowered for term in ["approved", "confirmed", "excited", "aligned", "signed"])
            label = "negative" if negative else "positive" if positive else "neutral"
            return {"label": label, "score": 0.68 if label != "neutral" else 0.5, "summary": text[:220], "model": "heuristic"}
