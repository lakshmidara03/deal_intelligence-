from __future__ import annotations

from pathlib import Path

import joblib

from .train_model import METRICS_PATH, MODEL_PATH, PREPROCESSOR_PATH


def model_ready() -> bool:
    return Path(MODEL_PATH).exists() and Path(PREPROCESSOR_PATH).exists()


def metrics() -> dict:
    if not Path(METRICS_PATH).exists():
        return {"status": "not_trained"}
    return joblib.load(METRICS_PATH)
