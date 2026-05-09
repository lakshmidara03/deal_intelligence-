from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(Path(__file__).resolve().parent))

from feature_engineering import build_driver_list  # noqa: E402
from preprocess import derive_missing_features, load_dataset, normalize_frame  # noqa: E402

DATASET_PATH = ROOT / "datasets" / "deal_intelligence_dataset_cleaned.xlsx"
OUT_DIR = ROOT / "frontend" / "data"

NEXT_STEP_PLAYBOOK = [
    "Send pricing clarification email to the buyer and confirm budget owner",
    "Schedule champion call to validate business pain and buying timeline",
    "Book executive meeting with decision maker and sales manager",
    "Send ROI summary email with implementation plan and risk mitigations",
    "Run procurement follow-up call and confirm legal/security blockers",
    "Schedule technical validation meeting with product specialist",
]


def status_label(value: str) -> str:
    cleaned = str(value).strip().lower()
    if cleaned in {"at risk", "risk", "risky"}:
        return "At Risk"
    if cleaned in {"needs review", "review", "medium"}:
        return "Needs Review"
    return "Healthy"


def clean_value(value):
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if hasattr(value, "item"):
        return value.item()
    return value


def export(limit: int = 50) -> None:
    raw = pd.read_excel(DATASET_PATH)
    feature_frame = normalize_frame(load_dataset(DATASET_PATH))
    enriched = derive_missing_features(raw).rename(
        columns={
            "Deal Id": "id",
            "Deal Name": "name",
            "Account Name": "account",
            "Deal Owner": "owner",
            "Crm Stage": "deal_stage",
            "Deal Source": "opportunity_type",
            "Deal Value Inr": "deal_value",
            "Probability Pct": "probability",
            "Days In Current Stage": "stage_age_days",
            "Days Since Last Activity": "inactivity_days",
            "Total Meetings": "meetings_count",
            "Total Emails": "email_count",
            "Estimated Close Date": "close_date",
            "Health Status": "health_status",
        }
    )
    deals = []
    interactions = []
    for idx, row in enriched.head(limit).iterrows():
        raw_row = raw.iloc[idx].to_dict()
        raw_details = {str(key): clean_value(value) for key, value in raw_row.items()}
        features = feature_frame.iloc[idx].to_dict()
        drivers = build_driver_list(features)
        health = status_label(row.get("health_status", "Healthy"))
        confidence = int(max(58, min(95, 62 + len(drivers) * 6 + (12 if health == "At Risk" else 0))))
        deal_id = str(row.get("id", f"DL-{idx + 1:05d}"))
        dataset_next_step = str(row.get("Next Step", "Follow up with buyer"))
        playbook_step = NEXT_STEP_PLAYBOOK[idx % len(NEXT_STEP_PLAYBOOK)]
        human_review_required = health == "At Risk" or "no next step" in drivers or features["inactivity_days"] >= 14
        deal = {
            "id": deal_id,
            "name": str(row.get("name", f"Deal {idx + 1}")),
            "account": str(row.get("account", "Unknown Account")),
            "owner": str(row.get("owner", "Unassigned")),
            "deal_stage": str(features["deal_stage"]),
            "opportunity_type": str(features["opportunity_type"]),
            "deal_value": float(features["deal_value"]),
            "probability": float(features["probability"]),
            "stage_age_days": int(features["stage_age_days"]),
            "inactivity_days": int(features["inactivity_days"]),
            "engagement_score": float(features["engagement_score"]),
            "meetings_count": int(features["meetings_count"]),
            "email_count": int(features["email_count"]),
            "competitor_mentioned": bool(features["competitor_mentioned"]),
            "next_step_defined": bool(features["next_step_defined"]),
            "close_date_pushed": bool(features["close_date_pushed"]),
            "sentiment_score": float(features["sentiment_score"]),
            "forecast_trend": str(features["forecast_trend"]),
            "health_status": health,
            "ai_confidence": confidence,
            "close_date": str(row.get("close_date", ""))[:10],
            "drivers": drivers,
            "next_best_action": f"{playbook_step}. Dataset next step: {dataset_next_step}.",
            "manual_next_step": "",
            "human_review_required": human_review_required,
            "raw_details": raw_details,
        }
        deals.append(deal)
        sentiment = str(row.get("Last Call Sentiment", "Neutral")).lower()
        normalized_sentiment = sentiment if sentiment in {"positive", "neutral", "negative"} else "neutral"
        created_date = str(raw_details.get("Created Date") or "")
        last_activity = str(raw_details.get("Last Activity Date") or "")
        close_date = str(raw_details.get("Estimated Close Date") or "")
        interactions.extend(
            [
                {
                    "id": f"INT-{deal_id}-1",
                    "deal_id": deal_id,
                    "channel": "email",
                    "actor": "Account executive",
                    "summary": f"Initial outreach email sent for {row.get('Primary Product', 'solution')} evaluation.",
                    "sentiment": "neutral",
                    "created_at": created_date,
                },
                {
                    "id": f"INT-{deal_id}-2",
                    "deal_id": deal_id,
                    "channel": "call",
                    "actor": "Buyer team",
                    "summary": f"Discovery call covered stage {features['deal_stage']} and current probability {features['probability']}%.",
                    "sentiment": normalized_sentiment,
                    "created_at": last_activity,
                },
                {
                    "id": f"INT-{deal_id}-3",
                    "deal_id": deal_id,
                    "channel": "meeting",
                    "actor": "Decision committee",
                    "summary": f"Meeting discussed competitors {raw_details.get('Competitor 1') or 'Unknown'} and {raw_details.get('Competitor 2') or 'Unknown'}.",
                    "sentiment": "negative" if features["competitor_mentioned"] else "positive",
                    "created_at": last_activity,
                },
                {
                    "id": f"INT-{deal_id}-4",
                    "deal_id": deal_id,
                    "channel": "call",
                    "actor": "Sales manager",
                    "summary": f"Close-plan review: {playbook_step.lower()}.",
                    "sentiment": "negative" if human_review_required else "positive",
                    "created_at": close_date,
                },
            ]
        )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "deals.json").write_text(json.dumps(deals, indent=2), encoding="utf-8")
    (OUT_DIR / "interactions.json").write_text(json.dumps(interactions, indent=2), encoding="utf-8")
    print(f"Exported {len(deals)} deals and {len(interactions)} interactions to {OUT_DIR}")


if __name__ == "__main__":
    export()
