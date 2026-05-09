from __future__ import annotations

import os
from pathlib import Path

from pydantic import BaseModel

PROJECT_ROOT = Path(__file__).resolve().parents[4] if len(Path(__file__).resolve().parents) > 4 else Path.cwd()


class Settings(BaseModel):
    app_name: str = "DealIQ ML Service"
    project_root: Path = PROJECT_ROOT
    model_dir: Path = Path(os.getenv("MODEL_DIR", PROJECT_ROOT / "ml" / "models"))
    dataset_path: Path = Path(os.getenv("DATASET_PATH", PROJECT_ROOT / "datasets" / "deal_intelligence_dataset_cleaned.xlsx"))
    training_code_dir: Path = Path(os.getenv("TRAINING_CODE_DIR", PROJECT_ROOT / "ml" / "training"))
    nlp_code_dir: Path = Path(os.getenv("NLP_CODE_DIR", PROJECT_ROOT / "ml" / "nlp"))


settings = Settings()
