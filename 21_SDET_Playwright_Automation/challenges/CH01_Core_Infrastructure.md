# Challenge 01 — Core Infrastructure

> Build the foundation layer from scratch. Even though `framework/` already ships one, **write your own version in a new folder** so you understand every line you'd otherwise copy.

## What you're building

A minimal infrastructure layer that any real test suite would rely on. Five files. No tests yet — those come in CH02.

## Required files

```
challenges/solutions/CH01/
├── constants/timeouts.ts
├── types/api.types.ts
├── types/user.types.ts
├── utilities/helpers/action.helpers.ts
└── config/env.loader.ts
```

## Acceptance criteria

### `constants/timeouts.ts`
- Exports a `Timeouts` enum with **at least 7 named values** (ONE_SECOND through FIVE_MINUTES).
- Values use the numeric separator (`30_000`, not `30000`) so they are readable.
- Exports a `PollIntervals` enum (FAST / MEDIUM / SLOW).

### `types/api.types.ts`
- Exports a generic `ApiResponse<T>` interface.
- Includes optional `meta?: PaginationMeta` and `errors?: ApiError[]`.
- `PaginationMeta` has `page`, `perPage`, `total`, `totalPages` — all numbers.
- `ApiError` has `code`, `message`, optional `field`.

### `types/user.types.ts`
- Exports a `UserRole` enum (at least 3 values).
- Exports a `UserStatus` enum (at least 3 values).
- Exports a `UserData` interface with role typed as `UserRole`.

### `utilities/helpers/action.helpers.ts`
- Exports `clickElement(locator, options)` and `fillInput(locator, value, options)`.
- Each takes an `ActionOptions` object with required `description` string and optional `timeout`.
- Each waits for visible before acting.
- Each emits a single-line log when `process.env.LOG_ACTIONS === 'true'`.

### `config/env.loader.ts`
- Reads `.env` via `dotenv`.
- Exports four helpers: `requireEnv`, `optionalEnv`, `boolEnv`, `numberEnv`.
- `requireEnv` throws a **descriptive** error if the key is missing (must mention the key name and `.env.example`).
- Exports an `envConfig` constant typed as `EnvironmentConfig`.
- Base URLs are trimmed of trailing `/`.

## Pass condition

- `npm run typecheck` exits 0 with **zero errors**.
- Deleting any required env var and importing `env.loader` throws an error containing the missing key's name.
- No `any` type anywhere.

## Hints (only if stuck)

<details><summary>Hint 1 — env.loader pattern</summary>

Read variables once at module load, validate, and expose as a frozen typed object. Fail-fast is the whole point.

</details>

<details><summary>Hint 2 — why ActionOptions has a `description`</summary>

Because trace logs and screenshots are useless without context. `"clicked button"` means nothing; `"login submit"` is searchable.

</details>

## Self-grading rubric

| Criterion | Pass | Fail |
|---|---|---|
| Strict TS compiles | yes | no |
| No `any` | none | any present |
| `requireEnv` error message names the key | yes | no |
| Enums use numeric separators | yes | no |
| Helpers log only when env flag is set | yes | always logs |

## What this teaches

- The discipline that separates infrastructure code from test code.
- Why every "small" helper still has a return type.
- Why config validation happens at boot, not at first failure.
