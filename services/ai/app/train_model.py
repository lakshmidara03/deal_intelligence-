from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from .preprocess import TARGET_COLUMN, clean_dataset, feature_matrix, make_preprocessor

MODEL_DIR = Path("models")
MODEL_PATH = MODEL_DIR / "model.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor.pkl"
METRICS_PATH = MODEL_DIR / "metrics.pkl"


def train(rows: list[dict[str, Any]]) -> dict[str, Any]:
    df, validation = clean_dataset(rows)
    if df.empty:
        raise ValueError("No training rows were found after cleaning. Confirm the Excel file has a populated Risk Score column.")
    X = feature_matrix(df)
    y = df[TARGET_COLUMN]
    if len(df) < 2:
        raise ValueError("At least 2 cleaned rows are required for train/test split.")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    preprocessor = make_preprocessor()
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)

    model = RandomForestRegressor(n_estimators=240, max_depth=14, random_state=42, n_jobs=-1)
    model.fit(X_train_transformed, y_train)
    predictions = model.predict(X_test_transformed).clip(0, 100)

    metrics = {
        "mae": float(mean_absolute_error(y_test, predictions)),
        "rmse": float(np.sqrt(mean_squared_error(y_test, predictions))),
        "r2": float(r2_score(y_test, predictions)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
    }

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    joblib.dump(metrics, METRICS_PATH)
    print(f"MAE={metrics['mae']:.4f} RMSE={metrics['rmse']:.4f} R2={metrics['r2']:.4f}")
    return {"metrics": metrics, "validation": validation, "model_path": str(MODEL_PATH), "preprocessor_path": str(PREPROCESSOR_PATH)}
