from __future__ import annotations

from datetime import date
from typing import Any


def build_warnings(row: dict[str, Any], risk_score: float, threshold: float = 70.0) -> list[dict[str, str]]:
    warnings: list[dict[str, str]] = []
    activity_count = int(float(row.get("activity_count", 0) or 0))
    inactivity_score = float(row.get("inactivity_score", 0) or 0)
    close_date = _parse_date(row.get("estimated_close_date"))
    next_step = str(row.get("next_step") or "").strip()

    if activity_count == 0 or inactivity_score > 7:
        warnings.append(_warning("NO_ACTIVITY", "No recent customer engagement", "high", f"No activity was detected for {int(inactivity_score)} days.", "Schedule follow-up and log the next customer touch.", "Schedule follow-up"))
    if str(row.get("decision_maker", "")).strip().lower() in {"no", "false", "", "pending", "unknown"}:
        warnings.append(_warning("DECISION_MAKER_NOT_ENGAGED", "Decision maker not engaged", "high", "Decision maker is missing or not engaged.", "Identify and re-engage the economic buyer.", "Find decision maker"))
    if close_date and close_date < date.today():
        warnings.append(_warning("CLOSE_DATE_PAST", "Close date risk", "critical", "Estimated close date is in the past.", "Update close date or validate the deal status.", "Update close date"))
    if not next_step:
        warnings.append(_warning("NO_NEXT_STEP", "Missing next step", "high", "No next step is documented.", "Add a specific next step with owner and due date.", "Add next step"))
    if str(row.get("last_call_sentiment", "")).strip().lower() == "negative":
        warnings.append(_warning("NEGATIVE_SENTIMENT", "Negative sentiment", "critical", "Last call sentiment is negative.", "Send a recovery follow-up and align on buyer concerns.", "Re-engage buyer"))
    if str(row.get("competitor", "")).strip():
        warnings.append(_warning("COMPETITOR_MENTIONED", "Competitor detected", "medium", "A competitor is present in the deal context.", "Document differentiation and decision criteria.", "Review competition"))
    if risk_score > threshold:
        warnings.append(_warning("HIGH_RISK_DEAL", "High risk deal", "critical", f"Predicted risk score is {risk_score:.1f}.", "Prioritize mitigation before forecast review.", "Prioritize deal"))
    if float(row.get("days_in_pipeline", 0) or 0) > 90:
        warnings.append(_warning("STAGE_AGING", "Stage aging", "medium", "Deal has been in pipeline longer than expected.", "Validate stage exit criteria and customer urgency.", "Review stage"))
    return warnings


def _warning(code: str, title: str, severity: str, explanation: str, mitigation: str, cta: str) -> dict[str, str]:
    return {
        "code": code,
        "title": title,
        "severity": severity,
        "explanation": explanation,
        "suggested_mitigation": mitigation,
        "cta_action": cta,
    }


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None
