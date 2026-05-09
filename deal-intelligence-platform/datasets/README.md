# Datasets

Place `deal_intelligence_dataset_cleaned.xlsx` in this folder.

The XGBoost training pipeline uses `health_status` as the target label and only these features:

- `deal_stage`
- `opportunity_type`
- `deal_value`
- `probability`
- `stage_age_days`
- `inactivity_days`
- `engagement_score`
- `meetings_count`
- `email_count`
- `competitor_mentioned`
- `next_step_defined`
- `close_date_pushed`
- `sentiment_score`
- `forecast_trend`

Any pre-existing AI score columns are excluded before training.
