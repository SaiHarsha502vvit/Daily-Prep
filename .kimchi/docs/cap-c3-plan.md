# CAP_C3 Test Analytics Dashboard — Implementation Plan

## Overview

Full-stack demo: Playwright JSON report → Ingester (Express) → PostgreSQL → Next.js Dashboard.

## Chunks

### Chunk 1: Root + Ingester foundation (simple)

- `CAP_C3/package.json` — root workspace manifest
- `CAP_C3/apps/ingester/package.json`
- `CAP_C3/apps/ingester/tsconfig.json`
- `CAP_C3/apps/ingester/src/schema.sql` — CREATE TABLE statements
- `CAP_C3/apps/ingester/src/db.ts` — pg client with pool

### Chunk 2: Ingester server (simple)

- `CAP_C3/apps/ingester/src/server.ts` — Express server with POST /api/runs

### Chunk 3: Web foundation (simple)

- `CAP_C3/apps/web/package.json`
- `CAP_C3/apps/web/tsconfig.json`
- `CAP_C3/apps/web/next.config.js`
- `CAP_C3/apps/web/src/api/index.ts` — API client for ingester

### Chunk 4: Web pages (simple)

- `CAP_C3/apps/web/src/pages/index.tsx` — Overview
- `CAP_C3/apps/web/src/pages/test-detail.tsx` — Test detail
- `CAP_C3/apps/web/src/pages/owner-view.tsx` — Owner view
- `CAP_C3/apps/web/src/styles.css` — Minimal CSS

### Chunk 5: Infrastructure (simple)

- `CAP_C3/infra/docker-compose.yml`
- `CAP_C3/infra/github-action/action.yml`
- `CAP_C3/Dockerfile.ingester`
- `CAP_C3/Dockerfile.web`

### Chunk 6: Examples + README (simple)

- `CAP_C3/examples/playwright-suite/playwright.config.ts`
- `CAP_C3/examples/playwright-suite/tests/sample.spec.ts`
- `CAP_C3/examples/playwright-suite/package.json`
- `CAP_C3/README.md`

## Complexity Classification

All chunks: **simple** (straightforward CRUD, HTTP server, React pages, Docker config, README)

## Implementation Order

1. Root workspace + ingester foundation (Chunks 1-2)
2. Web foundation (Chunks 3-4)
3. Infrastructure (Chunk 5)
4. Examples + README (Chunk 6)
5. Verification

## Acceptance Criteria

- `cd CAP_C3 && npm install` works
- `npx tsc --noEmit` passes for both apps
- Docker Compose starts all services
- Empty DB shows graceful "No data" messages
- README has architecture diagram and instructions
