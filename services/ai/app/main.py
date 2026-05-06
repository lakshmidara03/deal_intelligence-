from datetime import datetime
from enum import Enum
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field


class DealHealth(str, Enum):
    HEALTHY = "HEALTHY"
    AT_RISK = "AT_RISK"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class DriverImpact(str, Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"


class Activity(BaseModel):
    id: str
    type: str
    title: str
    summary: str
    rawText: str
    occurredAt: datetime


class Deal(BaseModel):
    id: str
    name: str
    company: str
    owner: str
    value: int
    stage: str
    closeDate: datetime
    health: DealHealth
    healthExplanation: Optional[str] = None
    recommendedAction: Optional[str] = None
    confidence: str = "Medium"
    activities: List[Activity] = Field(default_factory=list)


class DealDriver(BaseModel):
    label: str
    description: str
    impact: DriverImpact


class DealAnalysis(BaseModel):
    health: DealHealth
    confidence: str
    healthExplanation: str
    recommendedAction: str
    insightSummary: str
    interpretation: str
    drivers: List[DealDriver]


app = FastAPI(
    title="Deal Intelligence AI Service",
    description="POC service that turns CRM activity context into simple deal health insights.",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/analyze-deal", response_model=DealAnalysis)
def analyze_deal(deal: Deal):
    activity_text = " ".join(
        [f"{activity.title} {activity.summary} {activity.rawText}" for activity in deal.activities]
    ).lower()

    drivers: List[DealDriver] = []

    if "competitor" in activity_text or "northstar" in activity_text:
        drivers.append(
            DealDriver(
                label="Competitor Mention",
                description="Recent activity suggests the buyer is comparing another vendor.",
                impact=DriverImpact.NEGATIVE,
            )
        )

    if "no reply" in activity_text or "quiet" in activity_text or "stalled" in activity_text:
        drivers.append(
            DealDriver(
                label="No Recent Activity",
                description="The deal appears to have slowed after the last customer touch.",
                impact=DriverImpact.NEGATIVE,
            )
        )

    if "next step is not" in activity_text or "next step missing" in activity_text:
        drivers.append(
            DealDriver(
                label="Next Step Missing",
                description="There is no clear scheduled follow-up or customer-owned action.",
                impact=DriverImpact.NEGATIVE,
            )
        )

    if "budget is approved" in activity_text or "budget confirmed" in activity_text:
        drivers.append(
            DealDriver(
                label="Budget Confirmed",
                description="Budget is available, which improves close potential.",
                impact=DriverImpact.POSITIVE,
            )
        )

    if not drivers:
        drivers.append(
            DealDriver(
                label="Needs More Context",
                description="There are not enough strong signals to classify this deal confidently.",
                impact=DriverImpact.NEUTRAL,
            )
        )

    negative_count = len([driver for driver in drivers if driver.impact == DriverImpact.NEGATIVE])
    positive_count = len([driver for driver in drivers if driver.impact == DriverImpact.POSITIVE])

    if negative_count >= 2:
        health = DealHealth.AT_RISK
        confidence = "High"
        health_explanation = (
            "This deal is at risk because multiple recent signals point to stalled momentum or buyer uncertainty."
        )
        recommended_action = (
            "Confirm the next meeting, address competitor concerns, and identify the procurement owner."
        )
    elif positive_count > negative_count:
        health = DealHealth.HEALTHY
        confidence = "Medium"
        health_explanation = "This deal looks healthy because positive engagement signals outweigh risk signals."
        recommended_action = "Keep momentum by confirming timeline, success criteria, and implementation ownership."
    else:
        health = DealHealth.NEEDS_REVIEW
        confidence = "Medium"
        health_explanation = "This deal needs review because the available activity context is mixed or incomplete."
        recommended_action = "Ask the owner to add the latest customer update and confirm the next step."

    return DealAnalysis(
        health=health,
        confidence=confidence,
        healthExplanation=health_explanation,
        recommendedAction=recommended_action,
        insightSummary=f"{deal.company} was analyzed using {len(deal.activities)} recent activities.",
        interpretation=(
            "The analysis combines CRM activity text, call notes, and simple risk indicators to explain deal health."
        ),
        drivers=drivers[:4],
    )
