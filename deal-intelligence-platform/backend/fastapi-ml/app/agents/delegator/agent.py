class DelegatorAgent:
    def run(self, outputs: list[dict]) -> dict:
        flattened = {key: value for output in outputs for key, value in output.items()}
        actions = []
        if flattened.get("crm_signals", {}).get("inactivity_days", 0) > 5:
            actions.append("Re-engage buyer with a specific mutual action plan")
        if flattened.get("nlp_signals", {}).get("concern_detected"):
            actions.append("Send competitive differentiation and commercial justification")
        if flattened.get("forecast_signals", {}).get("commit_risk"):
            actions.append("Move deal to manager inspection and validate forecast category")
        return {"combined_signals": flattened, "recommended_actions": actions or ["Continue standard close plan"]}
