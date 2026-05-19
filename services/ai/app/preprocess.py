from __future__ import annotations

import re
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .feature_engineering import add_feature_engineering

TARGET_COLUMN = "risk_score"

COLUMN_ALIASES = {
    "deal_id": ["deal id", "deal_id", "crm deal id"],
    "deal_name": ["deal name", "deal_name", "opportunity name"],
    "account_name": ["account name", "account"],
    "account_industry": ["account industry", "industry"],
    "region": ["region"],
    "deal_owner": ["deal owner", "owner"],
    "deal_source": ["deal source"],
    "primary_product": ["primary product"],
    "crm_stage": ["crm stage", "stage"],
    "deal_value": ["deal value", "amount", "value", "deal value inr"],
    "probability": ["probability", "probability pct"],
    "weighted_value": ["weighted value inr"],
    "created_date": ["created date", "created_date"],
    "estimated_close_date": ["estimated close date", "close date"],
    "last_activity_date": ["last activity date"],
    "days_in_pipeline": ["days in pipeline", "days_in_pipeline", "days in current stage"],
    "days_since_last_activity": ["days since last activity"],
    "health": ["health", "health status"],
    "deal_summary": ["deal summary", "summary"],
    "no_of_contacts": ["no of contacts", "contacts", "no_of_contacts"],
    "decision_maker": ["decision maker", "decision_maker", "decision maker engaged"],
    "budget": ["budget", "budget confirmed"],
    "competitor_1": ["competitor 1"],
    "competitor_2": ["competitor 2"],
    "competitor": ["competitor"],
    "total_calls": ["total calls", "calls"],
    "total_emails": ["total emails", "emails"],
    "total_meetings": ["total meetings"],
    "last_call_sentiment": ["last call sentiment", "sentiment"],
    "next_step": ["next step", "next_step"],
    "risk_score": ["risk score", "risk_score", "ai risk score"],
}

NUMERIC_FEATURES = [
    "deal_value",
    "probability",
    "days_in_pipeline",
    "no_of_contacts",
    "total_calls",
    "total_emails",
    "total_meetings",
    "deal_age_days",
    "days_to_close",
    "created_month",
    "created_quarter",
    "overdue_flag",
    "engagement_ratio",
    "call_email_ratio",
    "contact_density",
    "stalled_flag",
    "decision_maker_flag",
    "budget_confirmed_flag",
    "negative_sentiment_flag",
    "competitor_flag",
    "pipeline_velocity",
    "inactivity_score",
    "activity_count",
]

CATEGORICAL_FEATURES = [
    "crm_stage",
    "region",
    "account_industry",
    "deal_owner",
    "health",
    "decision_maker",
    "budget",
    "competitor",
    "last_call_sentiment",
]

TEXT_FEATURES = ["deal_summary_text", "next_step_text"]


def normalize_rows(rows: list[dict[str, Any]]) -> pd.DataFrame:
    raw = pd.DataFrame(rows)
    raw.columns = [_snake(str(column)) for column in raw.columns]
    normalized = pd.DataFrame()
    for canonical, aliases in COLUMN_ALIASES.items():
        source = next((alias for alias in [_snake(a) for a in aliases] if alias in raw.columns), None)
        normalized[canonical] = raw[source] if source else ""
    return normalized


def clean_dataset(rows: list[dict[str, Any]]) -> tuple[pd.DataFrame, dict[str, Any]]:
    df = normalize_rows(rows)
    validation = {
        "row_count": int(len(df)),
        "target_column": "Risk Score",
        "missing_required_columns": [],
        "dropped_rows": 0,
    }
    target_raw = df[TARGET_COLUMN].astype("object")
    target_missing = target_raw.where(target_raw.astype(str).str.strip().ne(""), np.nan)
    if TARGET_COLUMN not in df.columns or target_missing.isna().all():
        validation["missing_required_columns"].append("Risk Score")

    for column in ["deal_value", "probability", "days_in_pipeline", "no_of_contacts", "total_calls", "total_emails", "total_meetings", TARGET_COLUMN]:
        cleaned = df[column].astype("object").where(~df[column].astype(str).isin(["Pending", "Unknown", ""]), np.nan)
        df[column] = pd.to_numeric(cleaned, errors="coerce")
    for column in ["deal_value", "probability", "days_in_pipeline", "no_of_contacts", "total_calls", "total_emails", "total_meetings"]:
        df[column] = df[column].fillna(0)

    df["created_date"] = pd.to_datetime(df["created_date"], errors="coerce")
    df["estimated_close_date"] = pd.to_datetime(df["estimated_close_date"], errors="coerce")
    df["last_activity_date"] = pd.to_datetime(df["last_activity_date"], errors="coerce")
    df["created_date"] = df["created_date"].fillna(pd.Timestamp.today())
    df["last_activity_date"] = df["last_activity_date"].fillna(df["created_date"])
    df["competitor"] = (
        df["competitor"]
        .astype(str)
        .str.strip()
        .replace({"nan": "", "NaN": "", "Unknown": ""})
    )
    competitor_1 = df["competitor_1"].astype(str).str.strip().replace({"nan": "", "NaN": "", "Unknown": ""})
    competitor_2 = df["competitor_2"].astype(str).str.strip().replace({"nan": "", "NaN": "", "Unknown": ""})
    df["competitor"] = df["competitor"].where(df["competitor"].ne(""), competitor_1.where(competitor_1.ne(""), competitor_2))

    for column in CATEGORICAL_FEATURES:
        df[column] = df[column].astype(str).str.strip().replace({"": "Unknown", "nan": "Unknown", "Pending": "Unknown"})
    df["competitor"] = df["competitor"].replace({"unknown": "", "Unknown": ""})

    df["deal_summary"] = df["deal_summary"].apply(normalize_text)
    df["next_step"] = df["next_step"].apply(normalize_text)
    generated_summary = (
        df["deal_name"].astype(str).str.cat(df["account_name"].astype(str), sep=" ")
        .str.cat(df["deal_source"].astype(str), sep=" ")
        .str.cat(df["primary_product"].astype(str), sep=" ")
        .str.cat(df["crm_stage"].astype(str), sep=" ")
    )
    df["deal_summary"] = df["deal_summary"].where(df["deal_summary"].str.len() > 0, generated_summary.apply(normalize_text))
    df["deal_summary_text"] = df["deal_summary"]
    df["next_step_text"] = df["next_step"]

    before = len(df)
    df = df.dropna(subset=[TARGET_COLUMN]).copy()
    validation["dropped_rows"] = int(before - len(df))
    df[TARGET_COLUMN] = df[TARGET_COLUMN].clip(0, 100)
    df["health_score"] = 100 - df[TARGET_COLUMN]
    df = add_feature_engineering(df)
    return df, validation


def make_preprocessor() -> ColumnTransformer:
    numeric = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scale", StandardScaler())])
    categorical = Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer(
        transformers=[
            ("numeric", numeric, NUMERIC_FEATURES),
            ("categorical", categorical, CATEGORICAL_FEATURES),
            ("deal_summary_tfidf", TfidfVectorizer(max_features=80, ngram_range=(1, 2)), "deal_summary_text"),
            ("next_step_tfidf", TfidfVectorizer(max_features=60, ngram_range=(1, 2)), "next_step_text"),
        ],
        remainder="drop",
    )


def feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    return df[NUMERIC_FEATURES + CATEGORICAL_FEATURES + TEXT_FEATURES].copy()


def normalize_text(value: Any) -> str:
    text = str(value or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _snake(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")
