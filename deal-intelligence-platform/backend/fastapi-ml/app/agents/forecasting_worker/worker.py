class ForecastWorker:
    def run(self, payload: dict) -> dict:
        probability = payload.get("probability", 0)
        trend = payload.get("forecast_trend", "stable")
        return {"forecast_signals": {"trend": trend, "commit_risk": probability < 50 or trend == "declining"}}
