from __future__ import annotations

from typing import Any

import joblib

from .explanation_engine import brief_summary, explain
from .feature_engineering import add_feature_engineering
from .preprocess import feature_matrix, normalize_rows, normalize_text
from .train_model import MODEL_PATH, PREPROCESSOR_PATH
from .warning_engine import build_warnings


def predict_record(record: dict[str, Any]) -> dict[str, Any]:
    row = prepare_record(record)
    risk_score = predict_risk(row)
    return prediction_payload(row, risk_score)


def predict_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [predict_record(record) for record in records]


def prepare_record(record: dict[str, Any]) -> dict[str, Any]:
    df = normalize_rows([record])
    df["risk_score"] = df["risk_score"].replace("", 0)
    for column in ["deal_summary", "next_step"]:
        df[column] = df[column].apply(normalize_text)
    df["deal_summary_text"] = df["deal_summary"]
    df["next_step_text"] = df["next_step"]
    df = add_feature_engineering(df)
    return df.iloc[0].to_dict()


def predict_risk(row: dict[str, Any]) -> float:
    try:
        model = joblib.load(MODEL_PATH)
        preprocessor = joblib.load(PREPROCESSOR_PATH)
        X = feature_matrix_from_row(row)
        raw = float(model.predict(preprocessor.transform(X))[0])
        return max(0.0, min(100.0, raw))
    except Exception:
        return heuristic_risk(row)


def feature_matrix_from_row(row: dict[str, Any]):
    import pandas as pd

    return feature_matrix(pd.DataFrame([row]))


def prediction_payload(row: dict[str, Any], risk_score: float) -> dict[str, Any]:
    health_score = max(0.0, min(100.0, 100 - risk_score))
    explanation = explain(row, risk_score)
    warnings = build_warnings(row, risk_score)
    return {
        "risk_score": round(risk_score, 2),
        "health_score": round(health_score, 2),
        "health_category": "healthy" if health_score >= 70 else "watch" if health_score >= 40 else "risk",
        "confidence_score": 80.0,
        "warnings": warnings,
        "positive_signals": explanation["positive_signals"],
        "negative_signals": explanation["negative_signals"],
        "explanation": explanation["explanation"],
        "suggested_next_step": suggested_next_step(row, warnings),
        "brief_summary": brief_summary(row, risk_score, health_score),
        "buyer_sentiment": str(row.get("last_call_sentiment") or "Neutral").title(),
        "what_changed": "Dataset-derived signals were recalculated during the latest upload.",
        "model_version": "rf-regressor-v1",
    }


def heuristic_risk(row: dict[str, Any]) -> float:
    risk = float(row.get("risk_score") or 50)
    if str(row.get("decision_maker", "")).lower() in {"no", "false", "", "unknown"}:
        risk += 10
    if not str(row.get("next_step", "")).strip():
        risk += 8
    if str(row.get("last_call_sentiment", "")).lower() == "negative":
        risk += 15
    if str(row.get("competitor", "")).strip():
        risk += 8
    if float(row.get("activity_count", 0) or 0) == 0:
        risk += 12
    return max(0, min(100, risk))


def suggested_next_step(row: dict[str, Any], warnings: list[dict[str, str]]) -> str:
    if warnings:
        return warnings[0]["suggested_mitigation"]
    return str(row.get("next_step") or "Confirm mutual action plan and next milestone with the buyer.")
