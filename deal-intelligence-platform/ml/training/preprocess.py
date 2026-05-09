from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from feature_engineering import AI_SCORE_COLUMNS, FEATURE_COLUMNS, TARGET_COLUMN

CATEGORICAL_COLUMNS = ["deal_stage", "opportunity_type", "forecast_trend"]
BOOLEAN_COLUMNS = ["competitor_mentioned", "next_step_defined", "close_date_pushed"]
NUMERIC_COLUMNS = [
    "deal_value",
    "probability",
    "stage_age_days",
    "inactivity_days",
    "engagement_score",
    "meetings_count",
    "email_count",
    "sentiment_score",
]

COLUMN_ALIASES = {
    "Crm Stage": "deal_stage",
    "Deal Source": "opportunity_type",
    "Deal Value Inr": "deal_value",
    "Probability Pct": "probability",
    "Days In Current Stage": "stage_age_days",
    "Days Since Last Activity": "inactivity_days",
    "Total Meetings": "meetings_count",
    "Total Emails": "email_count",
    "Health Status": TARGET_COLUMN,
}

SENTIMENT_MAP = {
    "negative": -0.65,
    "neutral": 0.0,
    "positive": 0.72,
}


def load_dataset(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    df = pd.read_excel(path)
    df = df.rename(columns={source: target for source, target in COLUMN_ALIASES.items() if source in df.columns})
    df = derive_missing_features(df)
    forbidden = AI_SCORE_COLUMNS.intersection({column.lower() for column in df.columns})
    if forbidden:
        df = df[[column for column in df.columns if column.lower() not in forbidden]]
    missing = [column for column in FEATURE_COLUMNS + [TARGET_COLUMN] if column not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")
    return df[FEATURE_COLUMNS + [TARGET_COLUMN]].copy()


def derive_missing_features(df: pd.DataFrame) -> pd.DataFrame:
    derived = df.copy()
    if "competitor_mentioned" not in derived.columns:
        competitor_cols = [column for column in ["Competitor 1", "Competitor 2"] if column in derived.columns]
        if competitor_cols:
            competitor_text = derived[competitor_cols].fillna("").astype(str).agg(" ".join, axis=1).str.lower()
            derived["competitor_mentioned"] = ~competitor_text.str.contains("unknown|nan|none|^\\s*$", regex=True)
        else:
            derived["competitor_mentioned"] = False
    if "next_step_defined" not in derived.columns:
        derived["next_step_defined"] = derived.get("Next Step", "").fillna("").astype(str).str.len() > 0
    if "close_date_pushed" not in derived.columns:
        derived["close_date_pushed"] = pd.to_numeric(derived.get("Days In Current Stage", derived.get("stage_age_days", 0)), errors="coerce").fillna(0) > 60
    if "sentiment_score" not in derived.columns:
        sentiment = derived.get("Last Call Sentiment", "Neutral").fillna("Neutral").astype(str).str.lower()
        derived["sentiment_score"] = sentiment.map(SENTIMENT_MAP).fillna(0.0)
    if "forecast_trend" not in derived.columns:
        probability = pd.to_numeric(derived.get("probability", derived.get("Probability Pct", 0)), errors="coerce").fillna(0)
        inactivity = pd.to_numeric(derived.get("inactivity_days", derived.get("Days Since Last Activity", 0)), errors="coerce").fillna(0)
        derived["forecast_trend"] = "stable"
        derived.loc[(probability >= 60) & (inactivity <= 7), "forecast_trend"] = "increasing"
        derived.loc[(probability < 40) | (inactivity >= 14), "forecast_trend"] = "declining"
    if "engagement_score" not in derived.columns:
        calls = pd.to_numeric(derived.get("Total Calls", 0), errors="coerce").fillna(0)
        emails = pd.to_numeric(derived.get("email_count", derived.get("Total Emails", 0)), errors="coerce").fillna(0)
        meetings = pd.to_numeric(derived.get("meetings_count", derived.get("Total Meetings", 0)), errors="coerce").fillna(0)
        contacts = pd.to_numeric(derived.get("No Of Contacts", 0), errors="coerce").fillna(0)
        decision = derived.get("Decision Maker Engaged", "No").fillna("No").astype(str).str.lower().eq("yes").astype(int)
        budget = derived.get("Budget Confirmed", "No").fillna("No").astype(str).str.lower().eq("yes").astype(int)
        raw = meetings * 8 + calls * 4 + emails * 0.8 + contacts * 3 + decision * 12 + budget * 10
        derived["engagement_score"] = raw.clip(0, 100)
    if "opportunity_type" not in derived.columns:
        derived["opportunity_type"] = "Unknown"
    return derived


def normalize_frame(df: pd.DataFrame) -> pd.DataFrame:
    normalized = df.copy()
    for column in BOOLEAN_COLUMNS:
        normalized[column] = normalized[column].astype(bool).astype(int)
    for column in NUMERIC_COLUMNS:
        normalized[column] = pd.to_numeric(normalized[column], errors="coerce").fillna(0)
    for column in CATEGORICAL_COLUMNS:
        normalized[column] = normalized[column].fillna("unknown").astype(str)
    return normalized


def build_preprocessor() -> ColumnTransformer:
    numeric_pipeline = Pipeline([("scaler", StandardScaler())])
    categorical_pipeline = Pipeline([("encoder", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_COLUMNS + BOOLEAN_COLUMNS),
            ("cat", categorical_pipeline, CATEGORICAL_COLUMNS),
        ]
    )
