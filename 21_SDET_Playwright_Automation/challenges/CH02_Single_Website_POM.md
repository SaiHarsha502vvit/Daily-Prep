# Challenge 02 — Single Website POM

> Build a complete POM for a real site, with happy + negative paths, zero hardcoded data, zero raw locators in specs.

## Target site

[https://opensource-demo.orangehrmlive.com/](https://opensource-demo.orangehrmlive.com/)

(Admin / admin123 — public demo, safe to hammer.)

## Required files

```
challenges/solutions/CH02/
├── websites/orangehrm/pages/LoginPage.ts
├── websites/orangehrm/pages/DashboardPage.ts
├── websites/orangehrm/pages/PIMListPage.ts        ← new for this challenge
├── test-data/orangehrm/credentials.json
├── tests/orangehrm/login.spec.ts
└── tests/orangehrm/pim-search.spec.ts             ← new for this challenge
```

## Acceptance criteria

### POMs
- Each POM has **both** a `this.locators` object (raw strings + role descriptors) **and** direct `Locator` properties for outside use. (Dual locator strategy from Ch 05.)
- Every method has typed parameters and a typed return.
- No `any`. No raw `page.locator(...)` calls inside specs.

### `LoginPage.ts`
- `goto()` waits for the username input to be visible before returning.
- `loginWith({ username, password })` uses your `fillInput` / `clickElement` helpers.
- `expectInvalidCredentials()` asserts both the alert visibility and exact message.
- `expectRequiredFieldErrors()` asserts at least one inline error.

### `DashboardPage.ts`
- `expectLoaded()` asserts the header AND the sidebar are visible.
- `logout()` works and returns the user to the login page.

### `PIMListPage.ts`
- `goto()` navigates to the PIM list.
- `searchByEmployeeName(name: string)` fills the search field, clicks search, and waits for the result rows to update.
- `getResultCount()` returns a `number` — not a string, not a Promise of unknown.

### Tests
- `login.spec.ts` covers: valid login, wrong password, wrong username, empty fields. **Four tests.**
- `pim-search.spec.ts` covers: search returns 0 for nonsense input, search returns >0 for a known employee.
- Both files import test data from JSON via `loadTestData`. **No inline strings for credentials or employee names.**
- Tests use the `@smoke` or `@regression` tag in the title.

## Pass condition

- `npm run test:orangehrm` — all six tests pass on a clean run.
- Re-running with `--repeat-each=5 --workers=4` produces zero flakes.
- Running with `LOG_ACTIONS=true` produces a readable action log per test.

## Hints

<details><summary>Hint 1 — the PIM search wait</summary>

OrangeHRM updates the result table via XHR. `waitForResponse` matching the search endpoint is far more reliable than `waitForTimeout`. Pair it with `Promise.all` around the click.

</details>

<details><summary>Hint 2 — credentials.json structure</summary>

```jsonc
{
  "valid":   { "username": "Admin", "password": "admin123" },
  "negative": {
    "wrongPassword": { "username": "Admin", "password": "wrong" },
    "...": "..."
  }
}
```

Keep `valid` and `negative` siblings, not mixed.

</details>

## Self-grading rubric

| Criterion | Pass |
|---|---|
| Zero `page.locator(...)` in any `.spec.ts` | yes |
| Zero hardcoded usernames/passwords in specs | yes |
| Search test reliable under 5×4 parallel | yes |
| All POMs typed, no `any` | yes |
| Tests are tagged | yes |

## What this teaches

- Where the boundary between behaviour (spec) and implementation (POM) actually lives.
- That a POM is not just selectors — it owns waits, assertions, and the wire format of its data.
- That negative tests need their own data; never derive them from `valid` by mutation.
