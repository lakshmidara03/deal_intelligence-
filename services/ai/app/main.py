from __future__ import annotations

from typing import Any

from fastapi import FastAPI, UploadFile
from pydantic import BaseModel

from .model_service import metrics as model_metrics
from .model_service import model_ready
from .predict import predict_record
from .train_model import train
from .upload_dataset import ingest_excel_bytes, ingest_rows

app = FastAPI(title="Deal Boards AI Service", version="0.2.0")


class DatasetPayload(BaseModel):
    filename: str
    rows: list[dict[str, Any]]


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "model_ready": model_ready()}


@app.get("/metrics")
def metrics() -> dict[str, Any]:
    return model_metrics()


@app.post("/dataset/upload")
def upload_dataset(payload: DatasetPayload) -> dict[str, Any]:
    result = ingest_rows(payload.rows)
    return {"filename": payload.filename, **result}


@app.post("/dataset/upload-file")
async def upload_dataset_file(file: UploadFile) -> dict[str, Any]:
    result = ingest_excel_bytes(await file.read())
    return {"filename": file.filename, **result}


@app.post("/train")
def train_endpoint(payload: DatasetPayload) -> dict[str, Any]:
    return train(payload.rows)


@app.post("/predict")
def predict_endpoint(record: dict[str, Any]) -> dict[str, Any]:
    return predict_record(record)
