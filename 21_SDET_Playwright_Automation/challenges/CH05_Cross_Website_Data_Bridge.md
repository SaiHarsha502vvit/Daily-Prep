# Challenge 05 — Cross-Website Data Bridge

> One test hits two services. The first produces data. The second consumes it. The plumbing between them is the `TestDataBridge`.

## Scenario

1. POST `/api/users` on reqres.in → get back an `id` and `name`.
2. Store both in a `TestDataBridge`.
3. POST to `https://httpbin.org/anything` with `{ id: <from bridge>, name: <from bridge> }`.
4. Assert httpbin echoes back exactly the values the bridge stored.

## Required files

```
challenges/solutions/CH05/
├── utilities/bridge/test-data.bridge.ts
├── utilities/bridge/bridge-keys.ts
├── applications/httpbin/api/HttpbinClient.ts
└── tests/cross-service/reqres-to-httpbin.spec.ts
```

## Acceptance criteria

### Bridge

- `TestDataBridge` has `set<T>`, `get<T>`, `has`, `clear`, `snapshot`.
- `get` throws a clear error if the key was never set (no silent `undefined`).
- Keys are an enum (`BridgeKeys`), not strings.

### Test

- Three distinct `test.step()` blocks: "Create user via reqres", "Bridge stores values", "Echo via httpbin asserts equality".
- Bridge is fixture-injected via `page.fixture.ts` and **auto-cleared** after the test.
- No variable like `let userId: string` in the spec — all data flows through the bridge.

## Pass condition

- Test passes consistently.
- Removing the `bridge.set` line in step 1 causes the bridge.get in step 3 to throw with a meaningful message containing the key name.
- Bridge `snapshot()` printed in the test report shows both values.

## Hints

<details><summary>Why a bridge instead of let-variables?</summary>

Three reasons:

1. Discipline — letting steps share data via `let` makes it harder to refactor steps into reusable helpers.
2. Visibility — `snapshot()` makes failure diagnosis 10× faster.
3. Type safety — `get<T>` forces you to declare the expected type at every read site.

</details>

## What this teaches

- Cross-system test choreography without spaghetti.
- That the bridge object should outlive a single step but die at test end.
- How to type a typed key-value store with TypeScript generics.
