from __future__ import annotations

import json
from pathlib import Path

import joblib
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from feature_engineering import FEATURE_COLUMNS, TARGET_COLUMN
from preprocess import build_preprocessor, load_dataset, normalize_frame
from shap_analysis import save_shap_summary

ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = ROOT / "datasets" / "deal_intelligence_dataset_cleaned.xlsx"
MODEL_DIR = ROOT / "ml" / "models"


def train(dataset_path: Path = DATASET_PATH) -> dict:
    df = normalize_frame(load_dataset(dataset_path))
    x = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(str)

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    x_train, x_test, y_train, y_test = train_test_split(
        x, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            (
                "model",
                XGBClassifier(
                    objective="multi:softprob",
                    eval_metric="mlogloss",
                    n_estimators=260,
                    learning_rate=0.05,
                    max_depth=4,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    random_state=42,
                ),
            ),
        ]
    )

    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)
    report = {
        "accuracy": accuracy_score(y_test, predictions),
        "classification_report": classification_report(y_test, predictions, target_names=label_encoder.classes_, output_dict=True),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "labels": label_encoder.classes_.tolist(),
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_DIR / "xgboost_model.pkl")
    joblib.dump(label_encoder, MODEL_DIR / "label_encoder.pkl")
    joblib.dump(pipeline.named_steps["preprocessor"], MODEL_DIR / "scaler.pkl")
    save_shap_summary(pipeline, x_test.head(50), MODEL_DIR / "shap_summary.pkl")
    (MODEL_DIR / "metrics.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    metrics = train()
    print(json.dumps(metrics, indent=2))
