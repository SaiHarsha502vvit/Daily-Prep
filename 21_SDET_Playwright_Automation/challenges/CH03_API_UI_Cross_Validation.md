# Challenge 03 — API + UI Cross-Validation

> Prove the UI and the backend agree. A test that only checks one side is half-blind.

## What you're building

Using [reqres.in](https://reqres.in/) as the API (and OrangeHRM as the UI side, optional), you'll create a user via API and verify it lands in the listing endpoint with the correct shape.

## Required files

```
challenges/solutions/CH03/
├── applications/reqres-service/api/UsersClient.ts
├── types/reqres.types.ts
└── tests/reqres/cross-validation.api.spec.ts
```

## Acceptance criteria

### `UsersClient.ts`

- Constructor takes a Playwright `APIRequestContext`.
- Methods:
  - `create(payload: ReqresCreateUserPayload): Promise<ReqresCreateUserResponse>`
  - `list(page: number): Promise<ReqresUserListResponse>`
  - `getById(id: number): Promise<ReqresUser>`
- Each method asserts the HTTP status and returns the parsed body **typed**, not `any`.
- All URLs come from a single `endpoints.reqres` object — not string-concatenated inline.

### Test

- Generate a unique name + job via your `uniqueId` helper (timestamp + random suffix).
- POST to create the user. Assert `id`, `createdAt`, and that the echoed name/job match.
- Then GET the listing — assert your typed shape (`page`, `per_page`, `data[]`).
- Use `expect(body).toMatchObject({ ... })` for partial shape, plus targeted field assertions.
- Tag the test `@e2e` and `@api`.

## Pass condition

- One green test on `npm run test:api`.
- The test fails clearly if reqres ever changes its response shape — i.e. it asserts shape, not just status.
- Re-running 10× → zero flakes.

## Hints

<details><summary>Hint 1 — typing the response</summary>

```typescript
const body = (await response.json()) as ReqresCreateUserResponse;
```

A cast is fine for now. Chapter 44 (Zod validation) will harden this.

</details>

<details><summary>Hint 2 — unique data</summary>

Reqres is a mock — it always returns success. The real lesson is _the assertion pattern_. Apply it to your own backend at work.

</details>

## What this teaches

- That "the API returned 200" is not a passing test. The body shape is.
- That a domain client (`UsersClient`) hides URLs and headers from specs.
- That tests should generate fresh data — `name: "Alice"` shared across tests will collide eventually.
