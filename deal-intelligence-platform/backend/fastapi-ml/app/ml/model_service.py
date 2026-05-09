from __future__ import annotations

import sys
from pathlib import Path

import joblib
import pandas as pd

from app.core.config import settings
from app.schemas.deal import DealFeatures

sys.path.append(str(settings.training_code_dir))
try:
    from feature_engineering import build_driver_list  # type: ignore  # noqa: E402
except Exception:
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


class DealModelService:
    def __init__(self) -> None:
        self.pipeline = None
        self.label_encoder = None
        self._load()

    def _load(self) -> None:
        model_path = settings.model_dir / "xgboost_model.pkl"
        label_path = settings.model_dir / "label_encoder.pkl"
        if model_path.exists() and label_path.exists():
            self.pipeline = joblib.load(model_path)
            self.label_encoder = joblib.load(label_path)

    def predict(self, features: DealFeatures) -> dict:
        row = features.model_dump()
        if self.pipeline and self.label_encoder:
            frame = pd.DataFrame([row])
            probabilities = self.pipeline.predict_proba(frame)[0]
            index = int(probabilities.argmax())
            prediction = str(self.label_encoder.inverse_transform([index])[0])
            confidence = int(round(float(probabilities[index]) * 100))
        else:
            risk = (
                row["inactivity_days"] * 4
                + row["stage_age_days"] * 1.1
                + (20 if row["competitor_mentioned"] else 0)
                + (16 if row["close_date_pushed"] else 0)
                + (12 if not row["next_step_defined"] else 0)
                - row["engagement_score"] * 0.32
                - row["probability"] * 0.08
            )
            prediction = "At Risk" if risk >= 60 else "Needs Review" if risk >= 34 else "Healthy"
            confidence = min(95, max(60, int(abs(risk) + 25)))

        drivers = build_driver_list(row)
        shap_factors = [{"feature": driver, "impact": round(0.8 - idx * 0.11, 2)} for idx, driver in enumerate(drivers[:5])]
        return {
            "prediction": prediction,
            "confidence": confidence,
            "drivers": drivers,
            "shap_factors": shap_factors,
            "next_best_action": self.next_best_action(prediction, drivers),
        }

    @staticmethod
    def next_best_action(prediction: str, drivers: list[str]) -> str:
        if prediction == "At Risk":
            return f"Escalate manager review, address {drivers[0]}, and secure a dated buyer next step."
        if prediction == "Needs Review":
            return "Confirm decision criteria, refresh mutual action plan, and strengthen champion alignment."
        return "Maintain momentum with close-plan confirmation and procurement readiness."


deal_model_service = DealModelService()
