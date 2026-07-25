# ADR-006: Typed API Clients by Composition over APIRequestContext (No axios, No Inheritance)

## Status

- Accepted (2026-07-25) — documents the founding design of `utilities/api/`

## Context

API calls appear in three roles: pure API tests, UI-test setup/verification (Ch15's asymmetric pattern), and data factories. Design options:

1. **Raw `request.get(...)` inline in specs** — no abstraction; URL strings, headers, and status checks duplicated everywhere; drift guaranteed.
2. **A third-party HTTP client (axios/got)** — familiar, but it bypasses Playwright's `APIRequestContext`, losing: automatic storageState/cookie sharing with the browser context, HAR capture, trace integration, and proxy/TLS config inheritance. Two HTTP stacks to configure identically forever.
3. **Inheritance hierarchy** (`UsersClient extends BaseClient extends HttpClient`) — the classic Java-shop shape; fragile base-class problem, and mixing transport concerns into domain clients.
4. **Composition**: a thin generic `ApiCore`/`APIUtils` wrapping `APIRequestContext` (retry, typed errors, logging, telemetry), with domain clients (`UsersClient`, `ResourcesClient`) *holding* it and exposing typed methods returning DTOs.

## Decision

Option 4. The layer contract:

- `utilities/api/ApiCore.ts` — transport: retries with exponential backoff, `ApiError` with status/body, optional step logging (`LOG_API_STEPS`), OpenTelemetry spans.
- `constants/endpoints.ts` + `HeadersBuilder` — no URL or header literals outside these modules (Ch22's factory pattern).
- `clients/*.ts` — one class per API surface, methods typed `Promise<UserDto>`, zero assertion logic inside (clients fetch; specs assert — matchers like `toMatchSchemaZod` live in `utilities/matchers/`).
- Delivered to specs via the worker-scoped `api.fixture` (ADR-004), sharing auth state with the browser when needed.

## Consequences

### Positive

- One HTTP stack: browser and API calls share cookies, storageState, tracing, and HAR — cross-layer tests (UI action → API verification) need zero extra auth plumbing.
- Type safety end-to-end: endpoint changes break compilation in one clients file, not at runtime across 40 specs.
- Domain clients stay ~50 lines because transport concerns live once in `ApiCore`.

### Negative

- `APIRequestContext` is less featureful than axios (no interceptor ecosystem, no automatic JSON revival hooks) — accepted; `ApiCore` implements the two interceptor use-cases we actually have (logging, retry).
- A custom layer is code we own: retry and error semantics need their own tests (`tests/api/retry.api.spec.ts` exists for exactly this).

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Clients accumulate assertion logic | Medium | Medium | Review rubric rule: clients return data or throw `ApiError`; expect() only in specs/matchers |
| DTO drift vs real API | Medium | Medium | `toMatchSchemaZod` matcher validates responses against schemas in API specs |
| Someone adds axios "just for one script" | Medium | Low | Dependency review; this ADR is the citation |

## Related

- Ch22 (factories), Ch23 (APIUtils walkthrough), Ch44 (enterprise client library)
- ADR-004 — the fixture delivery mechanism
- `utilities/matchers/to-match-schema-zod.ts` — where contract validation lives instead
