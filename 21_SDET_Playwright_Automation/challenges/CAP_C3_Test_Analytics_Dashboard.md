# Capstone C3 — Test Analytics Dashboard

> Stand up an end-to-end pipeline: Playwright runs → JSON → database → React dashboard. The full-stack capstone.

## Why this exists

This is the bridge from "I write tests" to "I own the test platform." It also exercises every part of your future SDE / DevSecOps stack: HTTP server, DB, frontend, CI, deployment.

## What you ship

```
test-analytics-dashboard/
├── apps/
│   ├── ingester/              ← Node service: receives Playwright JSON, writes to DB
│   │   ├── src/server.ts
│   │   ├── src/db.ts
│   │   └── src/schema.sql
│   └── web/                   ← React (or Next.js) dashboard
│       ├── src/pages/         ← Overview, Test Detail, Owner View
│       └── src/api/
├── infra/
│   ├── docker-compose.yml     ← Postgres + ingester + web
│   └── github-action/         ← reusable workflow that uploads results
├── examples/playwright-suite/ ← a sample suite wired to the dashboard
└── README.md
```

## Required features

### Ingester

- POST `/api/runs` accepts a Playwright JSON report.
- Validates with **Zod** (or similar) — rejects malformed payloads with 422.
- Writes to PostgreSQL: tables `runs`, `tests`, `attachments`.
- Idempotent: re-posting the same run-id updates rather than duplicates.

### Web dashboard

- **Overview**: 30-day pass rate trend, total runs, top 10 failing tests, top 10 slowest tests.
- **Test detail**: pass/fail history for one test, grouped by branch.
- **Owner view**: per-owner test counts, failure rates, "tests not run in 30 days."

### CI integration

- GitHub Action `upload-playwright-report` reusable workflow.
- After test run, POSTs `results.json` to the ingester.
- Auth via simple bearer token from secrets.

## Stretch features

- **Flake detection** — integrate Capstone C1 output as a dashboard tab.
- **Alerts** — Slack webhook on pass rate dropping below threshold.
- **Auth** — login with GitHub OAuth.
- **Multi-tenant** — `team_id` column, dashboard scoped per team.

## Acceptance criteria

- `docker compose up` from clean clone → working stack on localhost.
- README with architecture diagram, sequence diagram of a run upload, deployment notes.
- At least 60% test coverage on the ingester.
- Dashboard handles an empty DB gracefully (not blank, not broken).
- Public repo, demo deployment URL in the README (Vercel + Supabase free tier is fine).

## What this teaches

- Backend + frontend wired together with a real schema.
- That test data is _production data_ — needs migrations, indexes, retention policy.
- Operational concerns: idempotency, validation at the boundary, observability.

## Portfolio value

This single repo demonstrates: TypeScript, React, Postgres, Docker, CI/CD, GitHub Actions, REST API design, and SQL. It is a credible jump pad from SDET to SDE.

## Timeline guidance

Don't try to ship all of it in a weekend. Plan four iterations:

| Week | Goal                                                                 |
| ---- | -------------------------------------------------------------------- |
| 1    | Ingester with hard-coded schema, no UI — runs `psql` queries by hand |
| 2    | Minimal Next.js page reading from `/api/overview`                    |
| 3    | Test detail page + GitHub Action                                     |
| 4    | Polish, deploy, write the README                                     |

Anything beyond this is a stretch goal — ship the four-week version first.
