# ADR-003: OrangeHRM Public Demo + reqres.in as Teaching Targets

## Status

- Accepted (2026-07-25) — documents a decision in effect since the framework's creation

## Context

A teaching framework needs an application to test. Options:

1. **Self-hosted demo app in-repo** (e.g., dockerized TodoMVC or a purpose-built app) — fully controlled, offline-capable, but every learner must run Docker before their first test, and a toy app can't demonstrate enterprise UI patterns (grids, multi-step forms, role menus).
2. **Public demo instances** — OrangeHRM's `opensource-demo.orangehrmlive.com` (a real HR product with login, PIM grids, forms) and `reqres.in` (a stable fake REST API). Zero setup, real-product DOM complexity — but shared with the world and periodically reset/slow.
3. **Recorded/mocked application (HAR replay)** — deterministic but teaches testing against a fossil; no real network, auth, or state.

The framework's teaching goals rank "first test passing in 5 minutes" and "DOM that looks like work" above "hermetic determinism" — the curriculum explicitly teaches flake diagnosis, and a *slightly* imperfect public target provides honest material for it.

## Decision

Use **OrangeHRM's public demo** for UI specs and **reqres.in** for API specs. Encode resilience to their public nature:

1. Credentials are the demo's published ones (`Admin/admin123`) — placed in `.env.example`/`.env.ci` deliberately, with comments stating they are public, so learners see the *pattern* (env-driven secrets) without any actual secret.
2. reqres.in specs `test.skip()` automatically when `REQRES_API_KEY` is absent.
3. Specs never assert on global state (other visitors mutate it) — only on entities the test itself created, prefixed for cleanup.
4. The demo being reset nightly is treated as a feature: it is the "shared environment discipline" lab from Ch62 §1.3.

## Consequences

### Positive

- `git clone && npm i && npx playwright test` works in minutes, no Docker, no seed step.
- Learners hit real-world conditions (latency variance, shared data, occasional 503s) with instructor-designed coping patterns, not sanitized ones.
- The POM/component chapters dissect a genuinely complex production DOM (OrangeHRM is a shipping product).

### Negative

- Suite health depends on a third party. A demo outage fails CI honestly — mitigated by the smoke/regression tag split and by `test.skip` guards on the API side.
- No destructive-path coverage (can't test data deletion flows aggressively on a shared instance).
- Demo UI upgrades occasionally move locators — accepted as recurring, realistic maintenance exercises (tracked in MAP_CODE_TO_CHAPTER when they cause chapter drift).

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| OrangeHRM demo retired/moved | Low | High | POMs isolate all URLs/locators; `ORANGEHRM_BASE_URL` env allows pointing at a self-hosted OrangeHRM Docker image (published by vendor) with minimal diff |
| reqres.in rate limits / auth changes | Happened (2024 API-key change) | Medium | Auto-skip guard already in place; key documented in `.env.example` |
| Learners mistake public creds for acceptable practice | Medium | Medium | Explicit comments in every env file + Ch51 secrets chapter teaches the real pattern |

## Related

- `.env.example`, `.env.ci` — the documented-public-credentials pattern
- Ch28 (data lifecycle), Ch62 §1.3 (shared-environment discipline)
- `fixtures/orangehrm.fixture.ts`, `pages/` — the isolation layer that makes retargeting cheap
