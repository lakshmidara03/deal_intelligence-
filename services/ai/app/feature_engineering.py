from __future__ import annotations

from datetime import date

import numpy as np
import pandas as pd


def add_feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    today = pd.Timestamp(date.today())
    created = pd.to_datetime(out["created_date"], errors="coerce")
    close = pd.to_datetime(out["estimated_close_date"], errors="coerce")
    last_activity = pd.to_datetime(out["last_activity_date"], errors="coerce")

    out["deal_age_days"] = (today - created).dt.days.fillna(out["days_in_pipeline"]).clip(lower=0)
    out["days_to_close"] = (close - today).dt.days.fillna(0)
    out["created_month"] = created.dt.month.fillna(0).astype(int)
    out["created_quarter"] = created.dt.quarter.fillna(0).astype(int)
    out["overdue_flag"] = (out["days_to_close"] < 0).astype(int)

    calls = pd.to_numeric(out["total_calls"], errors="coerce").fillna(0)
    emails = pd.to_numeric(out["total_emails"], errors="coerce").fillna(0)
    meetings = pd.to_numeric(out["total_meetings"], errors="coerce").fillna(0)
    contacts = pd.to_numeric(out["no_of_contacts"], errors="coerce").fillna(0)
    days_in_pipeline = pd.to_numeric(out["days_in_pipeline"], errors="coerce").fillna(out["deal_age_days"]).clip(lower=1)
    deal_value = pd.to_numeric(out["deal_value"], errors="coerce").fillna(0)

    out["engagement_ratio"] = (calls + emails) / days_in_pipeline
    out["call_email_ratio"] = calls / np.maximum(emails, 1)
    out["contact_density"] = contacts / days_in_pipeline
    out["stalled_flag"] = ((calls + emails + meetings) == 0).astype(int)
    out["decision_maker_flag"] = out["decision_maker"].apply(_yes_no)
    out["budget_confirmed_flag"] = out["budget"].apply(_yes_no)
    out["negative_sentiment_flag"] = out["last_call_sentiment"].astype(str).str.lower().eq("negative").astype(int)
    competitor_clean = out["competitor"].astype(str).str.strip().replace({"": "", "nan": "", "NaN": ""})
    out["competitor_flag"] = competitor_clean.ne("").astype(int)
    out["pipeline_velocity"] = deal_value * pd.to_numeric(out["probability"], errors="coerce").fillna(0) / days_in_pipeline
    inactivity_days = pd.to_numeric(out.get("days_since_last_activity"), errors="coerce").fillna((today - last_activity).dt.days).fillna(0)
    out["inactivity_score"] = np.where((calls + emails + meetings) == 0, out["deal_age_days"], inactivity_days)
    out["activity_count"] = calls + emails + meetings
    return out


def _yes_no(value: object) -> int:
    return int(str(value).strip().lower() in {"yes", "true", "1", "confirmed", "y"})
