# ADR-002: SQLite for the Flake-Analytics Trend Store

## Status

- Accepted (2026-07-25)

## Context

The flake SLA process (Ch62 §3) needs per-test history: pass/fail/flaky outcomes, durations, and timestamps across runs, queryable for "flake rate last 7 days" and "slowest 10 trend." Options considered:

1. **A hosted dashboard vendor** (Currents, ReportPortal SaaS) — rich UI, zero maintenance, but per-seat cost, data leaves the org (procurement/security review), and the learning value of building the pipeline disappears.
2. **Postgres/MySQL service** — proper multi-writer concurrency, but now the *test* infrastructure has a *database* infrastructure: provisioning, credentials in CI, migrations, backups. A dependency heavier than the problem.
3. **SQLite file** (`analytics.db`) written by the reporter/CLI, persisted as a CI artifact or on a shared volume.
4. **JSON files per run, aggregated at read time** — no dependencies at all, but every trend query re-parses hundreds of files; no indexes; concurrent appends corrupt.

The workload is: single writer per run (the CLI ingests one `results.json` at a time), a few thousand rows per week, read by one weekly report. This is squarely inside SQLite's design envelope.

## Decision

Use **SQLite** via the `utilities/analytics/` CLI (`trend-store.ts`). The database file is gitignored; CI persists it as a pipeline artifact between runs (download → append → re-upload). Queries ship as CLI subcommands (`--flake-report`, `--slowest`) so the report is reproducible by anyone with the file.

## Consequences

### Positive

- Zero infrastructure: no service, no credentials, no network. `npm run flake:report` works on a laptop with a downloaded artifact.
- Real SQL: windowed flake rates and duration percentiles are one query, with indexes.
- The store is a file → trivially attached to the weekly report, diffable in size, restorable from any previous CI artifact.

### Negative

- Single-writer: two CI jobs must not append concurrently. Mitigated by ingesting only in one post-suite job (merge-reports step owns the write).
- No UI: trends are CLI tables/CSV. Acceptable — the consumer is a weekly engineering report, not a live dashboard. If a live dashboard becomes a requirement, that is CAP_C3's Grafana path or a vendor re-evaluation, not a reason to pre-build one.
- Artifact-based persistence means history lives in CI retention windows (90 days default). Mitigated by a monthly snapshot to long-term storage if longer trends are needed.

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Concurrent append corrupts db | Low | Medium | Single ingest job; WAL mode; `proper-lockfile` guard in CLI |
| History lost with CI artifact expiry | Medium | Low | Monthly snapshot job; the actionable window is 7–30 days anyway |
| Team outgrows CLI reports | Medium | Low | Schema is plain SQL — migrating to Postgres is a pg_dump-shaped problem, not a rewrite |

## Related

- `framework/utilities/analytics/` — implementation
- Ch62 §3 (flake SLA), §6 (metrics) — the consumers of this data
- CAP_C3 capstone — the dashboard evolution of the same schema
