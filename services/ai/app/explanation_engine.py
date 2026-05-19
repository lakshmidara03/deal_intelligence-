from __future__ import annotations

from typing import Any


def build_signals(row: dict[str, Any], risk_score: float) -> tuple[list[str], list[str]]:
    positive: list[str] = []
    negative: list[str] = []

    if str(row.get("decision_maker", "")).lower() in {"yes", "true", "1"}:
        positive.append("Decision maker engagement detected")
    else:
        negative.append("No decision maker engagement detected")

    if str(row.get("budget", "")).lower() in {"yes", "true", "1", "confirmed"}:
        positive.append("Budget is confirmed")
    else:
        negative.append("Budget is not confirmed")

    if float(row.get("activity_count", 0) or 0) > 0:
        positive.append("Customer activity is present")
    else:
        negative.append("No recent activity is present")

    if str(row.get("last_call_sentiment", "")).lower() == "negative":
        negative.append("Last call sentiment is negative")
    elif str(row.get("last_call_sentiment", "")).lower() == "positive":
        positive.append("Last call sentiment is positive")

    if str(row.get("competitor", "")).strip():
        negative.append("Competitor is mentioned")

    if risk_score >= 70:
        negative.append("Predicted risk score is high")
    elif risk_score <= 35:
        positive.append("Predicted risk score is low")

    return positive, negative


def explain(row: dict[str, Any], risk_score: float) -> dict[str, Any]:
    positive, negative = build_signals(row, risk_score)
    if negative:
        explanation = "Risk increased because " + " and ".join(signal.lower() for signal in negative[:3]) + "."
    else:
        explanation = "Risk is controlled because buyer engagement, activity, and deal hygiene signals are positive."
    return {
        "positive_signals": positive,
        "negative_signals": negative,
        "explanation": explanation,
    }


def brief_summary(row: dict[str, Any], risk_score: float, health_score: float) -> str:
    return (
        f"{row.get('deal_name', 'This deal')} has a predicted risk score of {risk_score:.1f} "
        f"and health score of {health_score:.1f}. Prioritize the strongest negative signal before the next customer touch."
    )
