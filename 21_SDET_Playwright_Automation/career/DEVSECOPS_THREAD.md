# DevSecOps Thread — Security Seeds Across the Module

A running index of every security/DevSecOps idea seeded across the chapters. Read this when you want to **connect the dots** between SDET work and the DevSecOps career path you're aiming at.

## How to use this

1. Read one row per week. Try the suggested action.
2. By month 6 you'll have built a small but real DevSecOps muscle even without changing roles.
3. When interviewing for DevSecOps later, point at this list — "here are 15 things I shipped on the security side while in SDET role."

---

## The thread

| #   | Chapter                         | Seed                                                                                        | Action you can take today                                                                                          |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | 04 — JS/TS for Automation       | `typeof` checks aren't security boundaries. Server validates.                               | Find one place in your work suite where the test assumes client validation is enough. Add a server-side assertion. |
| 2   | 05 — POM Architecture           | Selectors expose intent. Avoid `data-testid="admin-only-delete-button"` in non-admin views. | Review your POM for selectors that leak privileged-action existence to unprivileged users.                         |
| 3   | 06 — Custom Fixtures            | Fixtures with credentials must never log them.                                              | Audit your fixtures for `console.log` of the account/token.                                                        |
| 4   | 08 — Browser Internals          | `localStorage` is XSS-visible. Sensitive tokens belong in `HttpOnly` cookies.               | Open your app's DevTools. Is anything sensitive in localStorage? Write a test that fails if it is.                 |
| 5   | 09 — Parallel Workers           | One test corrupts an account → blast radius is now the pool. Isolation matters.             | Confirm your pool releases on test failure. Trace one failed test through finally-blocks.                          |
| 6   | 14 — Magic Link Pattern         | Tokens reuse and expiry are the canonical security test.                                    | Write 3 tests: reuse fails, expiry works, new request invalidates old.                                             |
| 7   | 15 — UI-API Side Effects        | "200 OK" doesn't mean "the right thing happened." Same for `403`.                           | Find a UI flow where you only assert the UI; add an API audit-log assertion.                                       |
| 8   | 16 — StorageState Chaining      | Shared storage state is shared credentials. Per-role state.                                 | Audit your `globalSetup.ts`. Does one storage state file get re-used across roles?                                 |
| 9   | 19 — Console Scripts & Security | Cookie audit, headers audit, IDOR — already in this chapter.                                | Run the cookie audit script on a real site. Note anything missing.                                                 |
| 10  | 25 — CI/CD                      | Secrets masking; PR-from-fork secret denial.                                                | Open your GitHub Actions config. Is `secrets.X` referenced inside `pull_request_target`? Hunt down any.            |
| 11  | 28 — Test Data Lifecycle        | Cleanup must run on failure. Orphan data leaks PII.                                         | Add `try/finally` to your highest-blast-radius test.                                                               |
| 12  | 30 — DB Verification            | SQL-injection-shaped payloads make great negative tests for DB-backed inputs.               | Write one. Use a known-safe pattern like `' OR 1=1 --` in a search box, assert it doesn't return everything.       |
| 13  | 31 — API Mocking                | Be careful: a mock returns 200 while real API throws 500 hides incidents.                   | Audit one mock — does it match the real response shape, including error cases?                                     |
| 14  | 40 — Security Testing OWASP     | Auth enforcement, IDOR, injection.                                                          | Pick one OWASP Top 10 item. Write a test against your team's app.                                                  |
| 15  | 46 — BDD                        | Acceptance criteria for security flows read beautifully in Gherkin.                         | Write one `.feature` covering the expired-JWT flow.                                                                |
| 16  | 49 — Feature Flags              | Flags are kill switches. Test that off → not exposed.                                       | For one risky flag at work, write a "flag off → endpoint returns 403/404" test.                                    |
| 17  | 50 — Email Service Testing      | Password reset tokens — single-use, time-bound, replaced by new request.                    | Build the three tests from this chapter on any flow you can access.                                                |
| 18  | 51 — Secrets Management         | `.env` discipline, gitleaks, secret rotation.                                               | Install gitleaks pre-commit. Try to commit `AKIA1234567890ABCDEF`. Should fail.                                    |
| 19  | 53 — Mutation Testing           | Surviving mutants in `validateJWT()` ≈ unfixed assertion gaps in auth code.                 | Run Stryker on any auth or input-validation function.                                                              |
| 20  | 54 — Synthetic Monitoring       | Synthetics can assert security headers (HSTS, CSP), cert expiry, secure cookie flags.       | Add one header-asserting synthetic to your team's site.                                                            |

---

## Patterns you'll notice across all rows

- **Assertions matter more than coverage.** Every row is "you have a test but it asserts the wrong thing."
- **Defence in depth.** Each layer (UI / API / DB / headers / cookies) has its own assertion.
- **Test what shouldn't happen.** Most security tests are _negative_ — privileged action should fail for unprivileged user, expired token should fail, malformed input should fail. SDETs over-test the happy path.

---

## Six-month DevSecOps muscle plan

| Month | Goal                                                                               |
| ----- | ---------------------------------------------------------------------------------- |
| 1     | Run rows 1–4 of this table                                                         |
| 2     | Rows 5–8 + finish OWASP Top 10 chapter                                             |
| 3     | Rows 9–12 + introduce gitleaks at work                                             |
| 4     | Rows 13–16 + one OWASP ZAP scan on your team's site                                |
| 5     | Rows 17–20 + propose synthetic security headers to oncall                          |
| 6     | Write a blog post: "Security regression tests an SDET can ship without permission" |

By month 6 you've earned the right to talk about DevSecOps in interviews. Before then, just keep adding rows.
