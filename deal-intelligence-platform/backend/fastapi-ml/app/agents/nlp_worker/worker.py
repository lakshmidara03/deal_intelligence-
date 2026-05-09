class NLPWorker:
    def run(self, payload: dict) -> dict:
        text = payload.get("interaction_text", "")
        concern = any(token in text.lower() for token in ["competitor", "delay", "pricing"])
        return {"nlp_signals": {"concern_detected": concern, "interaction_summary": text[:180]}}
