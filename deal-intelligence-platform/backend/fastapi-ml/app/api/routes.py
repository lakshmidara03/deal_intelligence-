from __future__ import annotations

from fastapi import APIRouter

from app.agents.coordinator.agent import coordinator_agent
from app.ml.model_service import deal_model_service
from app.schemas.deal import AgentRunRequest, DealFeatures, PredictionResponse, SentimentRequest
from app.services.sentiment_service import sentiment_service

router = APIRouter(prefix="/api/v1")


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "deal-intelligence-ml"}


@router.post("/predict", response_model=PredictionResponse)
async def predict(payload: DealFeatures) -> dict:
    return deal_model_service.predict(payload)


@router.post("/sentiment")
async def sentiment(payload: SentimentRequest) -> dict:
    return sentiment_service.analyze(payload.text)


@router.post("/agents/run")
async def run_agents(payload: AgentRunRequest) -> dict:
    return await coordinator_agent.run(payload.payload)
