from __future__ import annotations

FEATURE_COLUMNS = [
    "deal_stage",
    "opportunity_type",
    "deal_value",
    "probability",
    "stage_age_days",
    "inactivity_days",
    "engagement_score",
    "meetings_count",
    "email_count",
    "competitor_mentioned",
    "next_step_defined",
    "close_date_pushed",
    "sentiment_score",
    "forecast_trend",
]

TARGET_COLUMN = "health_status"
AI_SCORE_COLUMNS = {
    "ai_score",
    "ai_confidence",
    "confidence_score",
    "risk_score",
    "health_score",
    "prediction_score",
}


def build_driver_list(row: dict) -> list[str]:
    drivers: list[str] = []
    if row.get("inactivity_days", 0) >= 7:
        drivers.append("inactivity")
    if row.get("competitor_mentioned"):
        drivers.append("competitor mention")
    if row.get("engagement_score", 100) < 55:
        drivers.append("low engagement")
    if row.get("close_date_pushed"):
        drivers.append("close date pushed")
    if row.get("stage_age_days", 0) >= 21:
        drivers.append("stage stagnation")
    if not row.get("next_step_defined", True):
        drivers.append("no next step")
    return drivers or ["balanced deal signals"]
