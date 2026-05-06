# POC Requirements

## Mandatory Requirements

1. Deal board
   - Show sample deals in a structured view.
   - Include deal name, company, owner, stage, value, close date, and health.

2. Deal detail screen
   - Open one deal from the board.
   - Display basic deal metadata and current health.

3. Recent activity summary
   - Show recent CRM/call/email/note activity linked to the deal.
   - Store raw activity text and a short human-readable summary.

4. Deal drivers
   - Show 2 to 4 drivers explaining deal success or risk.
   - Include impact: positive, negative, or neutral.

5. Simple health status
   - Use only `HEALTHY`, `AT_RISK`, and `NEEDS_REVIEW`.

6. AI insight panel
   - Explain why the deal has its current health status.
   - Show a recommended next action.

7. REST API
   - `GET /api/v1/deals`
   - `GET /api/v1/deals/:id`
   - `GET /api/v1/deals/:id/activities`
   - `GET /api/v1/deals/:id/insights`
   - `POST /api/v1/deals/:id/analyze`

8. Database
   - `Deal`
   - `Activity`
   - `DealDriver`
   - `DealInsight`

## Unique Features

1. Deal health explanation
   - The UI shows the reason behind the status, not only a badge.

2. Driver-based insight cards
   - Each driver explains one risk or success factor.

3. AI recommended next action
   - The detail screen tells the owner what to do next.

4. Activity timeline
   - Activities are shown chronologically with type and summary.

5. Confidence indicator
   - Each analyzed deal has High, Medium, or Low confidence.

6. Risk reason tags
   - Driver labels act as scan-friendly tags such as `Competitor Mention` and `Next Step Missing`.

7. One-click re-analyze
   - The detail screen includes an `Analyze Deal` button.

8. Raw activity and AI interpretation
   - The deal detail screen shows the original activity text next to the AI interpretation.

## Excluded From This POC

- Docker
- Full CRM sync
- Advanced forecasting
- Complex deal scoring
- Whisper audio transcription
- Redis and BullMQ queueing
- Multi-tenant enterprise authorization
