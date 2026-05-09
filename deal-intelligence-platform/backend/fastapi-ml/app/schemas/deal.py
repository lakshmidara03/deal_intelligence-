from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Momentum = Literal["increasing", "stable", "declining"]
HealthStatus = Literal["Healthy", "Needs Review", "At Risk"]


class DealFeatures(BaseModel):
    deal_stage: str
    opportunity_type: str
    deal_value: float = Field(ge=0)
    probability: float = Field(ge=0, le=100)
    stage_age_days: int = Field(ge=0)
    inactivity_days: int = Field(ge=0)
    engagement_score: float = Field(ge=0, le=100)
    meetings_count: int = Field(ge=0)
    email_count: int = Field(ge=0)
    competitor_mentioned: bool
    next_step_defined: bool
    close_date_pushed: bool
    sentiment_score: float = Field(ge=-1, le=1)
    forecast_trend: Momentum


class PredictionResponse(BaseModel):
    prediction: HealthStatus
    confidence: int
    drivers: list[str]
    shap_factors: list[dict]
    next_best_action: str


class SentimentRequest(BaseModel):
    text: str = Field(min_length=1)


class AgentRunRequest(BaseModel):
    deal_id: str | None = None
    payload: dict = Field(default_factory=dict)
