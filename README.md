# AI Revenue Intelligence Deals Board

Sales Rep only V1 for an AI-powered operational Deal Board. The uploaded Excel dataset is the single source of truth for deal rows, AI training, risk predictions, health scores, warnings, activity records, and PostgreSQL population.

No Docker. No Prisma ORM. No fake deal seed data.

## Structure

```text
frontend/       Next.js 14 Sales Rep Deal Board UI
backend/        NestJS 10 API using raw PostgreSQL via pg
services/ai/    FastAPI AI ingestion, training, prediction service
packages/       Shared UI, types, and config packages
```

## Stack

- Frontend: Next.js 14 App Router, strict TypeScript, TailwindCSS, shadcn-style components, TanStack Table, Zustand, React Query, Framer Motion
- Backend: NestJS 10, raw SQL, `pg`, PostgreSQL 16
- AI service: Python 3.12, FastAPI, pandas, scikit-learn, numpy, openpyxl, xlrd, joblib

## PostgreSQL Setup

Create a PostgreSQL 16 database:

```sql
CREATE DATABASE dealboards;
CREATE USER dealboards_user WITH PASSWORD 'dealboards_password';
GRANT ALL PRIVILEGES ON DATABASE dealboards TO dealboards_user;
```

Enable schema:

```bash
$env:DATABASE_URL="postgresql://dealboards_user:dealboards_password@localhost:5432/dealboards"
npm run db:schema
```

Optional UI shell records only, with no deal seed data:

```bash
psql "$env:DATABASE_URL" -f backend/db/sample_inserts.sql
```

## pgAdmin Setup

1. Open pgAdmin and register your local PostgreSQL server.
2. Create the `dealboards` database if it does not already exist.
3. Open Query Tool for `dealboards`.
4. Run [schema.sql](</c:/Users/Relanto/Downloads/M4_DEALBOARDS(salesrep)/backend/db/schema.sql>).
5. Optionally run [sample_inserts.sql](</c:/Users/Relanto/Downloads/M4_DEALBOARDS(salesrep)/backend/db/sample_inserts.sql>) for the sales rep user and board-view shell. It does not insert deals.

## Environment

Copy env examples:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
copy services\ai\.env.example services\ai\.env
```

Backend:

```env
DATABASE_URL="postgresql://dealboards_user:dealboards_password@localhost:5432/dealboards"
PORT=3001
AI_SERVICE_URL="http://127.0.0.1:8001"
HUBSPOT_BASE_URL="https://api.hubapi.com"
HUBSPOT_ACCESS_TOKEN=""
```

Frontend:

```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:3001"
```

## Install

```bash
npm install
cd services/ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run Locally

Use three terminals:

```bash
npm run dev:api
npm run dev:web
npm run dev:ai
```

Open `http://localhost:3000`.

## Excel Dataset Requirements

Supported formats: `.xlsx` and `.xls`.

Expected columns are similar to:

- `Deal Id`
- `Deal Name`
- `Account Industry`
- `Region`
- `Deal Owner`
- `CRM Stage`
- `Deal Value`
- `Probability`
- `Created Date`
- `Estimated Close Date`
- `Days In Pipeline`
- `Health`
- `Deal Summary`
- `No Of Contacts`
- `Decision Maker`
- `Budget`
- `Competitor`
- `Total Calls`
- `Total Emails`
- `Last Call Sentiment`
- `Next Step`
- `Risk Score`

The target label is numeric `Risk Score`. Health Score is always derived as `100 - Risk Score`.

## AI Pipeline

On dataset upload:

1. Parse Excel.
2. Normalize column names.
3. Clean missing, pending, and unknown values.
4. Convert dates.
5. Engineer features such as `deal_age_days`, `days_to_close`, `engagement_ratio`, `contact_density`, `stalled_flag`, `decision_maker_flag`, `budget_confirmed_flag`, `negative_sentiment_flag`, `competitor_flag`, `pipeline_velocity`, and `inactivity_score`.
6. Use TF-IDF on `Deal Summary` and `Next Step`.
7. Split 80/20 with `train_test_split(..., test_size=0.2, random_state=42)`.
8. Train `RandomForestRegressor`.
9. Calculate MAE, RMSE, and R2.
10. Save `services/ai/models/model.pkl` and `services/ai/models/preprocessor.pkl`.
11. Generate predictions, health scores, warnings, and explanations.
12. Populate PostgreSQL through the NestJS upload flow.

FastAPI endpoints:

- `POST /dataset/upload`
- `POST /dataset/upload-file`
- `POST /train`
- `POST /predict`
- `GET /metrics`
- `GET /health`

## HubSpot Setup

Create a HubSpot private app token with CRM object access, then paste it into `backend/.env`:

```env
HUBSPOT_ACCESS_TOKEN="pat-..."
```

Minimum permissions:

- Deals: read and write (`crm.objects.deals.read`, `crm.objects.deals.write`)
- Notes/engagements: read and write if you want history notes on synced deals
- CRM associations: read and write if your HubSpot private app UI exposes separate association permissions

Restart the backend after changing `.env`.

Backend endpoints:

- `GET /crm/status` verifies the token and reads deal pipelines.
- `POST /crm/sync/:id` creates or updates the HubSpot deal, adds a HubSpot note, stores `hubspot_deal_id` locally, and writes a `crm_sync_logs` row.
- `PATCH /deals/:id` updates local CRM fields, then automatically syncs those fields to HubSpot.

## Database Files

- [schema.sql](</c:/Users/Relanto/Downloads/M4_DEALBOARDS(salesrep)/backend/db/schema.sql>)
- [migration.sql](</c:/Users/Relanto/Downloads/M4_DEALBOARDS(salesrep)/backend/db/migration.sql>)
- [sample_inserts.sql](</c:/Users/Relanto/Downloads/M4_DEALBOARDS(salesrep)/backend/db/sample_inserts.sql>)

## ER Diagram Explanation

`users` own saved `board_views` and can own `deals`.

`uploaded_datasets` records each Excel upload and training metrics. `deals` reference the upload that last populated them.

Each `deal` has many `contacts`, `activities`, `warnings`, `ai_scores`, `playbook_items`, and `crm_sync_logs`. Child records use `ON DELETE CASCADE` so board rows remain clean when a deal is removed.

`ai_scores` stores risk score, health score, positive signals, negative signals, and explanation text. `warnings` stores deterministic rule-engine warnings. `board_views` stores filters, grouping, sorting, and visible columns in JSONB for saved custom views.

## Sales Rep Scope

Implemented workflow:

Deal Boards -> My Deals Board -> Deal Row -> Deal Detail Drawer -> Take Action.

Not included: Manager dashboards, RevOps dashboards, CRO dashboards, or real HubSpot integration.
