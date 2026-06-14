# 06. Enterprise Structure

> Why the framework folder looks the way it does. Each directory has a job. The 5-layer API library. When the structure starts paying back. How to know when you've over-architected.

---

## The framework layout

```
framework/
├── playwright.config.ts          ← runner behaviour
├── config/
│   └── env.loader.ts             ← typed env reader
├── constants/
│   ├── endpoints.ts              ← URL factories
│   ├── headers.crm.ts            ← header factories
│   ├── messages.ts               ← UI/error message strings
│   ├── payloads.citation.ts      ← payload factories with overrides
│   └── timeouts.ts               ← timeout constants
├── fixtures/
│   ├── auth.fixture.ts           ← account pool
│   ├── auth.oauth.fixture.ts     ← OAuth token fixture
│   └── page.fixture.ts           ← page object fixture
├── tests/
│   └── orangehrm/
│       └── login.spec.ts         ← spec files
├── test-data/                    ← static JSON/CSV
├── types/                        ← shared type declarations
├── utilities/
│   ├── api/
│   │   └── APIUtils.ts           ← HTTP wrapper
│   ├── auth/
│   │   └── totp.helper.ts        ← TOTP generation
│   ├── data/
│   │   └── data.loader.ts        ← test data loading
│   └── helpers/
│       ├── action.helpers.ts     ← click/fill wrappers with logging
│       └── file.helpers.ts       ← upload/download helpers
└── websites/
    └── orangehrm/
        └── pages/
            ├── LoginPage.ts      ← POMs
            └── DashboardPage.ts
```

Each folder answers one question:

- `config/` — How do we read environment?
- `constants/` — What are the unchanging values?
- `fixtures/` — How does each test get set up?
- `tests/` — What do we actually verify?
- `test-data/` — What static inputs do tests use?
- `types/` — What types are shared across files?
- `utilities/` — What helpers do we reuse?
- `websites/` — What page objects do we have?

---

## Why this shape

### config/ separated from constants/

`config/` reads ENV — values that change per environment.
`constants/` defines CODE — values that don't change.

```typescript
// config/env.loader.ts
export const envConfig = {
  orangehrm: { baseUrl: requireEnv("ORANGEHRM_BASE_URL") },
};

// constants/endpoints.ts
export const Endpoints = {
  citations: { getById: (id: string) => `/api/v1/citations/${id}` },
};
```

These are different kinds of "constant." The split makes the difference explicit.

### fixtures/ separated from tests/

Tests import from `fixtures/` (the barrel). Never from `@playwright/test` directly.

```typescript
// tests/orangehrm/login.spec.ts
import { test, expect } from "../../fixtures/page.fixture";
```

This means:

- Custom fixtures are always available.
- Centralised teardown.
- New fixtures don't require updating every spec.

See [`reference/04_fixtures.md §11`](../reference/04_fixtures.md#11-testuse--per-filedescribe-overrides).

### utilities/api/ vs constants/headers.crm.ts

`utilities/api/APIUtils.ts` is GENERIC infrastructure (HTTP wrapper).
`constants/headers.crm.ts` is DOMAIN-SPECIFIC code.

The split keeps the generic layer reusable across apps.

### websites/ as the POM root

```
websites/
├── orangehrm/
│   └── pages/
└── crm/
    ├── pages/
    └── components/
```

If your team tests multiple apps, each gets its own subdirectory. POMs from one app never import from another.

If you test ONE app, you could collapse `websites/` to just `pages/`. The current shape is forward-looking for multi-app shops.

---

## The 5-layer API library

For API testing, the framework has layers, not one big class:

```
┌─────────────────────────────────────┐
│ 5. Test body                        │  ← business actions
├─────────────────────────────────────┤
│ 4. Domain clients (CitationsClient) │  ← typed methods + Zod validation
├─────────────────────────────────────┤
│ 3. Header / Endpoint / Payload      │  ← static factories
│    factories                        │
├─────────────────────────────────────┤
│ 2. APIUtils wrapper                 │  ← logging, timing, status check
├─────────────────────────────────────┤
│ 1. APIRequestContext (Playwright)   │  ← raw HTTP
└─────────────────────────────────────┘
```

Each layer has one job. Tests touch layer 5. The implementation hides in 1–4.

See [`reference/06_api_testing.md §14`](../reference/06_api_testing.md#14-the-5-layer-enterprise-api-library) for the full pattern.

---

## When this structure pays off

| Team size      | Structure benefit                                 |
| -------------- | ------------------------------------------------- |
| 1 engineer     | None — overhead exceeds benefit                   |
| 2–3 engineers  | Beginning to show — fixtures, factories           |
| 4–10 engineers | Massive — refactoring is safe, onboarding is fast |
| 10+ engineers  | Essential — anything less is chaos                |

For solo projects or proofs of concept, dump everything into a flat `tests/` and skip the architecture. Add layers as the team grows.

The cost of premature structure: 200 lines of plumbing for 50 lines of test logic. Don't.

---

## Knowing you've over-architected

Symptoms:

| Smell                                                | Diagnosis                |
| ---------------------------------------------------- | ------------------------ |
| 7 layers to add one endpoint                         | You've over-layered      |
| Engineers can't write a test without reading 5 files | API surface too obscured |
| Factories that always have the same default          | Defaults > factory       |
| Wrapper that only does `return inner(args)`          | Useless layer            |
| Abstract base class for one concrete subclass        | Premature abstraction    |
| Generic types with 5+ parameters                     | Trying too hard          |

Cure: delete a layer. If the test still works in 1 hour, the layer wasn't earning its place.

---

## The Seven Laws

The framework codifies seven principles. If your test code violates one, suspect a bug.

1. **Tests import from fixtures barrel** — never `@playwright/test` directly.
2. **POMs constructed BEFORE test.step** — see [`learn/04`](./04_architecture_walkthrough.md).
3. **Object accumulator for cross-step state** — never `let` primitives.
4. **Named factory calls** — `HeadersCrm.auth(token)`, not inline objects.
5. **Step names describe behaviour** — "API: verify status is PAID", not "Step 3".
6. **Three-layer verification for critical flows** — UI + API + DB.
7. **Cleanup runs even on failure** — `try/finally` in fixtures, mandatory.

These rules are sometimes "wrong" in isolation. Together, they're what separates code that runs from infrastructure that scales.

---

## How to introduce this gradually

You inherit a 1000-line test file with everything inline. Don't rewrite. Introduce the structure file by file:

1. **First**: extract obvious constants. URLs, headers, usernames go into `constants/`.
2. **Then**: extract POMs as you touch them. A new test for an existing page → write the POM.
3. **Then**: extract fixtures. The third time you write the same `beforeEach`, fixture it.
4. **Then**: split into API client classes. When the same `request.post('/X')` appears in 5 tests.
5. **Last**: introduce Zod schema validation. Only after the layers above are solid.

This usually takes 6–12 months for a 200-test legacy suite. Faster if you're starting fresh.

---

## What's next

- [Ch32 SDET Interview Prep](../06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) — talking about this in interviews.
- [`reference/06_api_testing.md`](../reference/06_api_testing.md) — the 5-layer pattern in detail.
- [`reference/04_fixtures.md`](../reference/04_fixtures.md) — fixture composition.
- [`framework/`](../framework/) — the runnable reference of all of this.
