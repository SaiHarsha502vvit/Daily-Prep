# CAP_C3 — Test Analytics Dashboard

> Stand up an end-to-end pipeline: Playwright runs → JSON → database → React dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions CI                         │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │ Playwright   │───▶│  JSON Report    │───▶│   Ingester     │  │
│  │ Test Suite   │    │  results.json   │    │  POST /api/runs│  │
│  └──────────────┘    └─────────────────┘    └───────┬────────┘  │
│                                                      │           │
└──────────────────────────────────────────────────────┼───────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │   PostgreSQL    │
                                              │  (testanalytics)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │   Next.js Web   │
                                              │  Dashboard      │
                                              │ GET /api/overview│
                                              └─────────────────┘
```

## Sequence Diagram

```
Playwright Test → JSON Report → Ingester API → PostgreSQL → Next.js Dashboard
     Run              upload           validate        query       render
                      (curl)          (Zod)          (SQL)       (React)
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### 1. Clone and start the stack

```bash
cd CAP_C3
docker compose -f infra/docker-compose.yml up --build
```

This starts:
| Service | URL | Purpose |
|---------|-----|---------|
| PostgreSQL | localhost:5432 | Data store |
| Ingester | localhost:3001 | REST API |
| Web | localhost:3000 | Dashboard UI |

### 2. Run the Playwright example suite

```bash
cd examples/playwright-suite
npm install
npx playwright install chromium
PLAYWRIGHT_JSON_OUTPUT_NAME=playwright-report/results.json npx playwright test
```

### 3. Upload results to the dashboard

```bash
curl -X POST http://localhost:3001/api/runs \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d @playwright-report/results.json
```

Or use the GitHub Action (see below).

### 4. Open the dashboard

```
http://localhost:3000
```

## Project Structure

```
CAP_C3/
├── apps/
│   ├── ingester/          # Express API server
│   │   └── src/
│   │       ├── server.ts  # Express + Zod validation + routes
│   │       ├── db.ts      # pg connection pool
│   │       └── schema.sql # PostgreSQL schema
│   └── web/               # Next.js dashboard
│       └── src/
│           ├── pages/
│           │   ├── index.tsx           # Overview
│           │   ├── test/[name].tsx     # Test detail
│           │   ├── owner/[name].tsx    # Owner view
│           │   └── owners/index.tsx    # Owner list
│           └── api/index.ts            # API client
├── infra/
│   ├── docker-compose.yml # Full stack (postgres + ingester + web)
│   └── github-action/
│       └── action.yml     # Reusable upload workflow
├── examples/
│   └── playwright-suite/  # Minimal suite that generates JSON
├── Dockerfile.ingester
├── Dockerfile.web
└── package.json           # Root workspace
```

## Ingester API

| Endpoint            | Method | Description                                       |
| ------------------- | ------ | ------------------------------------------------- |
| `/health`           | GET    | Health check                                      |
| `/api/runs`         | POST   | Ingest Playwright JSON report                     |
| `/api/overview`     | GET    | Dashboard summary (pass rate, failing/slow tests) |
| `/api/tests/:name`  | GET    | Pass/fail history for a specific test             |
| `/api/owners`       | GET    | List all test owners                              |
| `/api/owners/:name` | GET    | Per-owner summary + tests not run in 30 days      |
| `/api/runs`         | GET    | Recent run list                                   |

### Authentication

All mutating endpoints require `Authorization: Bearer <token>`.
Token is configured via `INGESTER_TOKEN` env var (default: `dev-token`).

### Playwright Report Format

The ingester accepts the standard Playwright JSON report format:

```json
{
  "id": "optional-run-id",
  "timestamp": "2024-01-01T00:00:00Z",
  "branch": "main",
  "commitSha": "abc123",
  "results": [
    {
      "tests": [
        {
          "title": "test name",
          "fullTitle": "describe block > test name",
          "file": "tests/foo.spec.ts",
          "status": "passed",
          "duration": 1234,
          "error": { "message": "..." },
          "owner": "team-name"
        }
      ]
    }
  ]
}
```

## GitHub Action Integration

```yaml
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright test
      - name: Upload report
        uses: ./.github/workflows/upload-playwright-report
        with:
          ingester-url: https://your-ingester.example.com
          ingester-token: ${{ secrets.INGESTER_TOKEN }}
          playwright-report-path: playwright-report/results.json
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
          min-pass-rate: "80"
```

## Deployment Notes

### Vercel (Web)

```bash
cd apps/web
vercel --prod
```

Set `NEXT_PUBLIC_INGESTER_URL` to your deployed ingester URL.

### Supabase / Railway / Render (Ingester + Postgres)

1. Create a PostgreSQL database
2. Set `DATABASE_URL` and `INGESTER_TOKEN` environment variables
3. Deploy the ingester as a Docker container or Node.js process

Recommended free/cheap tiers:

- **Supabase**: PostgreSQL free tier (500 MB, 2 connections)
- **Railway**: $5/month hobbyist plan with 1 GB RAM
- **Render**: Free tier (sleeps after 15 min inactivity)

### Vercel + Supabase (fully serverless)

| Layer    | Service                     | Plan          |
| -------- | --------------------------- | ------------- |
| Frontend | Vercel                      | Free          |
| API      | Vercel Serverless Functions | Free          |
| Database | Supabase                    | Free (500 MB) |
| Auth     | Supabase Auth               | Free          |

The ingester can run as a Vercel serverless function with a connection pooler.

## Database Schema

```sql
runs (id UUID PK, timestamp TIMESTAMPTZ, branch, commit_sha, workflow_name, run_number)
tests (id SERIAL PK, run_id UUID FK, test_name, file_path, status, duration_ms, error_message, error_stack, owner)
-- indexes on run_id, test_name, owner, status, timestamp
```

## Test Coverage

Ingester unit test coverage target: **60%**.

```bash
cd apps/ingester
npm install
npx vitest run --coverage
```

Key areas to cover:

- Zod validation (valid/invalid payloads → 422)
- Idempotency (re-post same run ID updates, not duplicates)
- SQL injection resistance (parameterized queries)
- Empty database graceful handling

## Adding the `owner` Field to Tests

Annotate Playwright tests to track ownership:

```typescript
test("login works", { owner: "auth-team" }, async ({ page }) => {
  // ...
});
```

Use the Playwright `metadata` option or a custom reporter to extract `owner` and add it to the JSON report output.

## Environment Variables

| Variable                   | Default                 | Description                  |
| -------------------------- | ----------------------- | ---------------------------- |
| `DATABASE_URL`             | (required)              | PostgreSQL connection string |
| `PORT`                     | `3001`                  | Ingester listen port         |
| `INGESTER_TOKEN`           | `dev-token`             | Bearer token for API auth    |
| `NEXT_PUBLIC_INGESTER_URL` | `http://localhost:3001` | Web → ingester URL           |

## License

MIT
