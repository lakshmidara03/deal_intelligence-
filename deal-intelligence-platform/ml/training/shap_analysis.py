from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd


def save_shap_summary(model_pipeline, x_sample: pd.DataFrame, output_path: str | Path) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        import shap

        transformed = model_pipeline.named_steps["preprocessor"].transform(x_sample)
        model = model_pipeline.named_steps["model"]
        explainer = shap.TreeExplainer(model)
        values = explainer.shap_values(transformed)
        joblib.dump({"values": values}, output_path)
    except Exception as exc:  # SHAP can fail in minimal POC environments.
        joblib.dump({"warning": str(exc), "values": []}, output_path)
