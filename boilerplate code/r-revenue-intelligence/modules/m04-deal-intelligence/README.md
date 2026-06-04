# M04 Deal Intelligence Module - HubSpot Integration

This module provides HubSpot CRM integration for fetching real deal data.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (dealboards_rep)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  dealBoardsService.ts → Calls Backend API            │  │
│  │  ↓ Fallback to mock data if backend fails            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTP API
┌─────────────────────────────────────────────────────────────┐
│              Backend (m04-deal-intelligence)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DealsController ← HTTP endpoints                    │  │
│  │  ↓                                                   │  │
│  │  HubSpotService ← Calls HubSpot API                  │  │
│  │  ↓ Fallback to DealsService (mock) if HubSpot fails │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    HubSpot CRM API                          │
│         (api.hubapi.com/crm/v3)                            │
│         Token: (set via HUBSPOT_ACCESS_TOKEN env var)        │
└─────────────────────────────────────────────────────────────┘
```

## Created Files

### Backend (Module)
- `m04-deal-intelligence.module.ts` - NestJS module definition
- `package.json` - Module dependencies

### Services
- `services/hubspot.service.ts` - HubSpot API integration
  - `getAllDeals()` - Fetch all deals from HubSpot
  - `getDealById()` - Fetch single deal
  - `getPipelines()` - Get available pipelines
  - `generateDealBoardsFromDeals()` - Transform deals to boards
  - Transforms HubSpot data to our format with AI scores, warnings, MEDDPICC

- `services/deals.service.ts` - Mock data fallback
  - Provides mock boards and deals when HubSpot API fails

### Controller
- `controllers/deals.controller.ts` - REST API endpoints
  - `GET /api/deals/boards` - List all deal boards
  - `GET /api/deals/boards/:boardId` - Get board details
  - `GET /api/deals/boards/:boardId/deals` - Get deals for board
  - `GET /api/deals/all` - Get all deals
  - `GET /api/deals/:dealId` - Get single deal
  - `GET /api/deals/pipelines/list` - Get pipelines

### Types
- `interfaces/hubspot.types.ts` - TypeScript interfaces for HubSpot data

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/deals/boards` | GET | Get all deal boards (grouped by pipeline) |
| `/api/deals/boards/:id` | GET | Get board details with deals |
| `/api/deals/boards/:id/deals` | GET | Get deals for specific board |
| `/api/deals/all` | GET | Get all deals from HubSpot |
| `/api/deals/:dealId` | GET | Get specific deal by ID |
| `/api/deals/pipelines/list` | GET | List available pipelines |

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": [...],
  "isMock": false,
  "error": null  // only present if using mock fallback
}
```

## Data Flow

1. **Frontend** calls backend API (`dealBoardsService.ts`)
2. **Backend** tries to fetch from HubSpot
3. If HubSpot succeeds → Returns real data with `isMock: false`
4. If HubSpot fails → Returns mock data with `isMock: true`
5. **Frontend** displays data (can show badge if `isMock: true`)

## Environment Variables

The HubSpot token is hardcoded in `hubspot.service.ts`:
```typescript
this.accessToken = this.configService.get<string>('HUBSPOT_ACCESS_TOKEN') || '';
```

To use environment variable instead:
```bash
HUBSPOT_ACCESS_TOKEN=your_token_here
```

## Running the System

### 1. Start the Backend

The backend should be started as part of the main NestJS application:

```bash
cd r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence
npm run start:dev
```

The module will be available at `http://localhost:3000/api/deals/...`

### 2. Start the Frontend

```bash
cd r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/apps/web/src/modules/m04-deal-intelligence/dealboards_rep
npm run dev
```

Frontend runs at `http://localhost:5176`

### 3. CORS Configuration

If frontend can't connect to backend due to CORS, add to backend main.ts:

```typescript
app.enableCors({
  origin: 'http://localhost:5176',
  credentials: true,
});
```

## Fallback Behavior

Both layers have fallback mechanisms:

### Backend Fallback
- If HubSpot API fails (network error, invalid token, rate limit)
- Controller catches error and returns mock data from `DealsService`
- Response includes `"isMock": true` and error message

### Frontend Fallback  
- If backend is not running or returns error
- Frontend service catches error and returns local mock data
- Console shows warning: "[getDealBoards] Backend failed, using mock"

## Features

### AI Score Calculation
Calculated based on:
- Deal amount (higher = better)
- Probability percentage
- Has close date (more likely to close)

### Warnings Detection
Flags deals with:
- No close date set
- Low probability (< 30%)
- High amount with low probability
- Missing deal name

### MEDDPICC Score
Calculated based on:
- Metrics (has amount): 15 points
- Economic Buyer (owner assigned): 15 points
- Decision Criteria (has stage): 10 points
- Decision Process (has probability): 10 points
- Identify Pain (meaningful name): 15 points
- Champion (has contacts): 15 points
- Competition (has close date): 10 points

## Testing

### Check if HubSpot connection works:
```bash
curl https://api.hubapi.com/crm/v3/objects/deals?limit=10 \
  -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN"
```

### Check backend API:
```bash
curl http://localhost:3000/api/deals/boards
```

### Expected Response
```json
{
  "success": true,
  "data": [
    {
      "boardId": "1",
      "name": "Sales Pipeline",
      "description": "Deals in Sales Pipeline pipeline",
      "owner": "...",
      "dealCount": 5,
      "totalAmount": 500000
    }
  ],
  "isMock": false
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module @nestjs/common" | Run `npm install` in module directory |
| "Backend failed, using mock" | Check if backend is running on port 3000 |
| "HubSpot API error" | Check if token is valid and not expired |
| CORS errors | Enable CORS in backend main.ts |
| No deals showing | Check HubSpot account has deals in the CRM |

## HubSpot Token Security

⚠️ **Important**: The HubSpot token has access to your CRM data. 

For production:
1. Move token to environment variables
2. Rotate tokens regularly
3. Use least-privilege scopes
4. Monitor API usage
