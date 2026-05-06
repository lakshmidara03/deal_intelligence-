# Deal Intelligence POC

No-Docker POC for a sales deal intelligence workspace.

## What This POC Proves

- A sales manager can view deals in a structured board.
- A user can open one deal and inspect details, recent activity, AI insights, health status, and deal drivers.
- The system can generate a simple AI-backed explanation, recommended next action, and confidence indicator.

## Apps

- `frontend` - Next.js + React + TypeScript frontend
- `backend` - NestJS + TypeScript backend API
- `services/ai` - FastAPI AI analysis service
- `packages/database` - Prisma schema and seed data for Supabase/PostgreSQL

## No Docker Local Run

Use separate terminals.

```bash
cd packages/database
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

```bash
cd backend
npm install
npm run start:dev
```

```bash
cd services/ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

```bash
cd frontend
npm install
npm run dev
```

## Required Environment Variables

Copy `.env.example` files in each app/package to `.env`.

```bash
DATABASE_URL="postgresql://..."
AI_SERVICE_URL="http://127.0.0.1:8001"
NEXT_PUBLIC_API_URL="http://127.0.0.1:3001/api/v1"
OPENAI_API_KEY="optional-for-real-ai"
```

For the backend, at minimum create one of these files:

- `.env`
- `backend/.env`
- `packages/database/.env`

With:

```bash
DATABASE_URL="your_supabase_or_postgresql_connection_string"
AI_SERVICE_URL="http://127.0.0.1:8001"
PORT="3001"
```

## Mandatory POC Features

- Deal board with sample deals
- Deal detail page
- Recent activity summary
- AI deal drivers
- Simple health status
- AI insight panel
- Backend REST APIs
- Prisma database models

## Unique Features Included

- Deal health explanation
- Driver-based insight cards
- AI recommended next action
- Activity timeline
- Confidence indicator
- Risk reason tags
- One-click re-analyze
- Raw activity and AI interpretation side by side
