# Code Review Rubric for Test Automation PRs

> **Purpose**: Standardize how test code is reviewed so that every PR improves the suite's reliability, speed, and maintainability. Apply this rubric to all Playwright (or equivalent) test PRs.

---

## Review Dimensions

### 1. Architecture

Evaluates the structural decisions in the test code and how it fits into the broader framework.

| Severity    | Criteria                                                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blocker** | Violates established architectural patterns (e.g., selectors inline instead of POM, mixing UI and API logic without justification). Introduces circular dependencies between test modules.    |
| **Major**   | Inconsistent use of design patterns (e.g.,mixing POM with inline locators). Test structure does not follow the project's established conventions. Missing abstraction for a repeated pattern. |
| **Minor**   | Could be more modular (e.g., a helper function that could be generalized). Minor naming inconsistencies within a page object or fixture.                                                      |
| **Nit**     | Suboptimal import ordering. Minor whitespace or grouping preferences.                                                                                                                         |

**Questions to Ask**:

- Does this PR follow our established Page Object Model / architecture?
- Are new abstractions justified by their reuse potential?
- Does the test hierarchy match the feature domain?

---

### 2. Correctness

Evaluates whether the test actually verifies what it claims to verify.

| Severity    | Criteria                                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blocker** | Test passes when the bug it targets is present (false negative). Test asserts on implementation details rather than user-visible behavior. Race conditions or timing issues that make the test non-deterministic. |
| **Major**   | Assertions are weak (e.g., `expect(true).toBe(true)` instead of real checks). Missing negative test cases. Does not verify the end state of a mutation.                                                           |
| **Minor**   | Edge case not covered (e.g., empty cart, 500-error response). Data setup could be more realistic.                                                                                                                 |
| **Nit**     | Redundant assertion already covered by another test. Overly specific assertion message.                                                                                                                           |

**Questions to Ask**:

- Does this test fail if the feature regresses?
- Are we testing user-visible behavior or implementation internals?
- Is every branch of the code under test covered?

---

### 3. Maintainability

Evaluates how easy the test will be to understand, debug, and modify in 6 months.

| Severity    | Criteria                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blocker** | Uses magic values without explanation. No documentation for complex test setup. Flaky by design (e.g., hardcoded waits, unmocked third-party calls).                        |
| **Major**   | Excessive duplication (violation of DRY). Poor naming (e.g., `test1`, `doStuff()`). Missing comments for non-obvious business logic. No trace or debuggability affordances. |
| **Minor**   | Could use a fixture instead of inline setup. Minor formatting inconsistency. Test data could be more descriptive.                                                           |
| **Nit**     | Typo in test name. Inconsistent quote style. Trailing whitespace.                                                                                                           |

**Questions to Ask**:

- Could a new engineer understand this test in under 2 minutes?
- If this page changes its layout, how many tests break?
- Is debugging this test straightforward (trace, screenshot, clear error message)?

---

### 4. Performance

Evaluates the runtime cost of the test and its impact on CI pipeline health.

| Severity    | Criteria                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Blocker** | Introduces a test that takes >60s without justification. Opens a new browser context per test when a shared context would suffice. Makes unnecessary API calls to external services. |
| **Major**   | Significantly slower than comparable tests (>2x median runtime). Could be parallelized but is not. Uses full-page screenshots when element-level suffices.                           |
| **Minor**   | Minor optimization possible (e.g., prefetching data, reusing auth state). Slight increase in total suite runtime.                                                                    |
| **Nit**     | Import of unused fixtures or helpers. Minor cleanup of dead code.                                                                                                                    |

**Questions to Ask**:

- What is the median runtime for this test?
- Can we reduce the number of page navigations?
- Are we using the most efficient assertion strategy?

---

### 5. Observability

Evaluates how well the test communicates its intent and results to the team.

| Severity    | Criteria                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blocker** | Failure gives no actionable information (no trace, no screenshot, no logs). Test name does not describe what is being tested. Missing breadcrumbs to reproduce locally. |
| **Major**   | Missing attachments on failure. Inconsistent tagging or metadata (e.g., missing `@smoke` or `@regression` labels). No documentation update reflecting test changes.     |
| **Minor**   | Could add a more descriptive assertion message. Missing metadata for analytics (e.g., feature owner, component).                                                        |
| **Nit**     | Minor inconsistency in test naming convention.                                                                                                                          |

**Questions to Ask**:

- If this test fails at 3 AM, can the oncall understand why?
- Is the test properly categorized in our reporting system?
- Are traces/screenshots captured on failure?

---

### 6. Security

Evaluates whether the test introduces or ignores security concerns.

| Severity    | Criteria                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blocker** | Hardcodes secrets (passwords, tokens, API keys) in test code. Bypasses security controls (e.g., disables CSP or auth checks) without explicit justification and review. |
| **Major**   | Uses production credentials in non-production tests. Tests expose sensitive data in screenshots or trace files. Does not validate auth boundaries.                      |
| **Minor**   | Uses weak test passwords. Missing security-focused assertions (e.g., session invalidation on logout).                                                                   |
| **Nit**     | Minor improvement to secret management (e.g., using env vars instead of hardcoded strings).                                                                             |

**Questions to Ask**:

- Are any secrets hardcoded?
- Does this test validate auth and authorization boundaries?
- Could screenshots or traces leak PII?

---

## Review Workflow

### Step 1: Pre-Review Checklist

- [ ] CI is green (or failing only on known flaky tests).
- [ ] PR description links to the ticket and explains what is being tested.
- [ ] Diff size is reasonable (<300 lines ideally; >500 requires justification).

### Step 2: Automated Checks

- [ ] Lint passes (`eslint`, `prettier`, `tsc`).
- [ ] Tests pass locally (`npx playwright test --grep <new-test>`).
- [ ] New code has >=80% test coverage for its test utilities.

### Step 3: Manual Review

- [ ] Review against all 6 dimensions above.
- [ ] Assign severity labels to each finding.
- [ ] Approve, Request Changes, or Comment based on highest severity.

### Step 4: Approval Criteria

- **Approve**: No Blockers, no unresolved Majors.
- **Comment**: Minor clarifications needed; author can merge after addressing.
- **Request Changes**: One or more Blockers or unresolved Majors.

---

## Example Review Comments

### Example 1: Architecture (Major)

> **File**: `tests/checkout.spec.ts:42`
>
> The checkout form selectors are defined inline here and also duplicated in `tests/guest-checkout.spec.ts:28`. Please extract these into the `CheckoutPage` POM so we have a single source of truth for the checkout form locators. This keeps our DRY principle and reduces the blast radius if the checkout UI changes.
>
> **Suggested Change**:
>
> ```ts
> // In page-objects/CheckoutPage.ts
> get creditCardNumber() { return this.page.getByTestId('cc-number'); }
> get expiryDate() { return this.page.getByTestId('cc-expiry'); }
> ```

---

### Example 2: Correctness (Blocker)

> **File**: `tests/login.spec.ts:55`
>
> This assertion checks that the error message element exists, but it does not verify the actual error text. We had a regression last month where the login form showed "An error occurred" instead of "Invalid credentials" and this test passed despite the user-visible bug. Please assert on the exact error message text.
>
> **Suggested Change**:
>
> ```ts
> await expect(page.getByTestId("login-error")).toHaveText(
>   "Invalid credentials",
> );
> ```

---

### Example 3: Performance (Major)

> **File**: `tests/search.spec.ts:12`
>
> This test logs in via the UI for every iteration in the `for` loop. We already have an `authenticatedPage` fixture that reuses stored auth state. Using the fixture will cut ~3s per test iteration (9s total for this file). Please refactor to use the fixture instead of manual login.
>
> **Suggested Change**:
>
> ```ts
> test("search results pagination", async ({ authenticatedPage }) => {
>   // authenticatedPage already has auth cookies set
>   await authenticatedPage.goto("/search");
> });
> ```

---

## Reviewer Calibration

- Reviewers should aim for a **3:1 ratio** of praise/collaboration to criticism.
- Always suggest a concrete fix, not just identify a problem.
- If you mark something as Blocker, be available to pair on the fix.
- When in doubt between Major and Minor, start with Minor and escalate if the author disagrees.
- Blockers must have a clear path to resolution and should be reserved for issues that would degrade the suite's correctness or security.
