from __future__ import annotations

from io import BytesIO
from typing import Any

import pandas as pd

from .predict import predict_record
from .preprocess import clean_dataset
from .train_model import train


def ingest_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    training = train(rows)
    df, validation = clean_dataset(rows)
    records = []
    for record in df.to_dict(orient="records"):
        prediction = predict_record(record)
        records.append({**record, "prediction": prediction})
    return {"validation": {**validation, **training["validation"]}, "metrics": training["metrics"], "records": records}


def ingest_excel_bytes(contents: bytes) -> dict[str, Any]:
    frame = pd.read_excel(BytesIO(contents))
    rows = frame.fillna("").to_dict(orient="records")
    return ingest_rows(rows)
