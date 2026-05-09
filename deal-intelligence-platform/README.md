# DealIQ: AI-Powered Deal Intelligence Platform

Enterprise-style POC for deal health prediction, explainable risk signals, interaction sentiment, agentic recommendations, and manager alerts.

## What Is Included

- Next.js 15 App Router frontend with TypeScript, Tailwind CSS, shadcn-style components, Framer Motion, Recharts, and Lucide icons.
- Next.js route handlers for deals, predictions, sentiment, analytics, forecast, alerts, and agents.
- FastAPI ML microservice with Pydantic validation, async APIs, XGBoost model serving, SHAP-ready explanations, NLP sentiment analysis, and CrewAI-compatible agent orchestration.
- XGBoost training pipeline using `health_status` as the target label.
- Supabase PostgreSQL/Auth/Storage integration points and SQL schema.
- Local development setup for Next.js, FastAPI, and Supabase cloud.

## Project Layout

```text
deal-intelligence-platform/
  frontend/
  backend/
    nextjs-api/
    fastapi-ml/
  ml/
    training/
    models/
    nlp/
  datasets/
  docs/
```

## Dataset

Add the real dataset here:

```text
datasets/deal_intelligence_dataset_cleaned.xlsx
```

The trainer deliberately excludes pre-existing AI score columns. Dynamic confidence is generated from `predict_proba` after model inference.

## Local Development

The platform is designed to run directly on your machine:

- Next.js frontend on `http://localhost:3000`
- FastAPI ML service on `http://localhost:8000`
- Supabase PostgreSQL/Auth/Storage from your Supabase cloud project

Install frontend dependencies:

```bash
cd frontend
npm install
npm run dev
```

Run the ML service:

```bash
cd backend/fastapi-ml
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Train the model after placing the Excel dataset:

```bash
cd ml/training
python train_xgboost.py
python export_frontend_data.py
```

`export_frontend_data.py` converts the Excel rows into local Next.js POC data in `frontend/data/deals.json` and `frontend/data/interactions.json`.

## Supabase

1. Create a Supabase project.
2. Run `docs/supabase-schema.sql`.
3. Copy `.env.example` files and fill the Supabase values.
4. Wire production service-role access only on server-side routes.

## Core APIs

- `GET /api/deals`
- `GET /api/deals/[id]`
- `POST /api/predictions`
- `POST /api/sentiment`
- `GET /api/alerts`
- `GET /api/analytics`
- `GET /api/forecast`
- `POST /api/agents/run`

FastAPI mirrors ML functionality at `/api/v1/predict`, `/api/v1/sentiment`, and `/api/v1/agents/run`.
