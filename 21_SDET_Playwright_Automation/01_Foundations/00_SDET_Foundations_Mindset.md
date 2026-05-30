# 00. SDET Foundations & Mindset — The Mental Model That Changes Everything

**Navigation**: [Index](../00_INDEX.md) | [Next: Playwright & TypeScript Basics →](./01_Playwright_TS_Basics.md)

---

## 5W1H — Why This Chapter Exists

- **WHAT**: The mental models, vocabulary, and professional frameworks that separate a script-runner from a Software Development Engineer in Test.
- **WHY**: The fastest path to becoming a great SDET is not learning more Playwright APIs — it is **changing how you think about problems**. Engineers who understand WHY before HOW write frameworks that last years. Engineers who only learn HOW write scripts that break in weeks.
- **WHO**: Anyone transitioning from Manual QA, from a different language, or from "I know how to automate clicks" to "I can design a scalable test infrastructure."
- **WHEN**: Before touching any code. Return here every 3 months — your understanding of these principles will deepen with experience.
- **HOW**: By internalising the Testing Pyramid, the three pillars of reliability, and the professional vocabulary that lets you speak the same language as developers and architects.

---

## 1. The Actual Definition of an SDET

The most damaging misconception in QA automation:

> "An SDET is someone who uses Playwright (or Selenium, or Cypress) to automate test cases."

This is like saying "A civil engineer is someone who uses AutoCAD." The tool is incidental.

**The real definition:**

> An SDET (Software Development Engineer in Test) is a software engineer whose product is the **quality infrastructure** of the application — the test framework, CI pipeline, observability tooling, and processes that give the engineering team confidence to ship every day.

```
Comparison:

Product Engineer     →  writes code that users run
SDET                 →  writes code that product engineers rely on

The "user" of an SDET's code is another engineer.
That changes everything about how you design it:
  - Your "product" must be maintainable by multiple people
  - Your "product" runs 50 times a day unattended in CI
  - Failures in your "product" block deployments
  - The quality of your code determines the reliability of every release
```

### The Manual QA → SDET → SDE Progression

| Dimension | Manual QA | SDET | SDE (target) |
|---|---|---|---|
| **Output** | Test cases, bug reports | Test framework, CI pipeline | Production features |
| **Thinking** | "What might break?" | "How do I prove this works at scale?" | "How do I build this to be correct?" |
| **Core skill** | Domain knowledge | Engineering + domain | Engineering |
| **Daily question** | "Did this scenario pass?" | "Is my test suite trustworthy?" | "Is my system correct?" |
| **Failure mode** | Miss edge cases | Flaky tests, slow CI | Bugs in production |

The SDET who also thinks like an SDE is rare and extremely valuable. That is the target of this curriculum.

---

## 2. The Testing Pyramid — The Most Important Mental Model

The Testing Pyramid (originally described by Mike Cohn in *Succeeding with Agile*, 2009) is the foundational framework for all test strategy decisions.

```
                     ╔══════════════╗
                     ║   E2E / UI   ║  ← Few, Slow, Expensive, High Confidence
                     ║   (5-10%)    ║    "Does the complete user journey work?"
                     ╚══════════════╝
                ╔══════════════════════╗
                ║   Integration / API  ║  ← Some, Medium Speed, Reliable
                ║      (20-30%)        ║    "Do the services talk correctly?"
                ╚══════════════════════╝
           ╔══════════════════════════════╗
           ║       Unit / Component       ║  ← Many, Fast, Cheap, Focused
           ║          (60-70%)            ║    "Does this function do the right thing?"
           ╚══════════════════════════════╝
```

### The 3 Layers Explained

**Layer 1 — Unit Tests (the foundation)**
- Written by: developers
- What they test: a single function, class, or component in complete isolation
- Mocking: everything external is mocked (database, network, time)
- Speed: milliseconds per test
- Example: "Does `calculateFineAmount(days: 5, rate: 10)` return `50`?"
- Your role as SDET: review them, sometimes write them for shared utilities

**Layer 2 — Integration / API Tests (the middle)**
- Written by: SDETs and developers
- What they test: two or more real components interacting (API + database, service A + service B)
- Mocking: minimal — you want to test real interactions
- Speed: hundreds of milliseconds to a few seconds
- Example: "Does `POST /api/v2/citations` actually insert a row in the database with the correct data?"
- Your role as SDET: own this layer — it gives the highest ROI

**Layer 3 — E2E / UI Tests (the tip)**
- Written by: SDETs
- What they test: the complete user journey through a real browser
- Mocking: none (tests real system) or minimal (isolate third parties)
- Speed: seconds to minutes
- Example: "Can a customer log in, create a citation, pay it, and see 'PAID' status?"
- Your role as SDET: design these carefully — they are expensive

### The Anti-Pattern — The Ice Cream Cone

```
                ╔══════════════╗
                ║   E2E / UI   ║  ← Hundreds of UI tests
                ║   (80-90%)   ║
                ╚══════════════╝
           ╔══════════════════════╗
           ║   Integration / API  ║  ← A few
           ╚══════════════════════╝
      ╔══════════════════════════════╗
      ║          Manual tests        ║  ← Most of the actual testing
      ╚══════════════════════════════╝
```

This is how most companies start. The consequences:
- CI pipeline takes 4 hours on every PR
- Tests fail 30% of the time due to timing issues
- A single DOM change breaks 50 tests
- Developers stop trusting the test results ("the tests are always broken")
- No one knows which failures are real bugs vs infrastructure noise

**Your job as SDET: move testing DOWN the pyramid, not up.**

If you can answer "does the citation status update correctly?" with a 200ms API test instead of a 15-second UI test, you MUST use the API test. Reserve UI tests for the journeys only humans care about: the screens, the visual state, the interactions.

---

## 3. The Three Pillars of Reliable Automation

Every flaky test, every "it works on my machine" failure, every mysteriously passing test that misses real bugs — traces back to a violation of one of these three principles.

### Pillar 1 — Idempotency (a test can run N times and always give the same result)

**Definition:** A test is idempotent if running it once gives the same result as running it 100 times. The test does not depend on any state left by a previous run.

**The violation:**
```typescript
// ❌ NOT idempotent — fails on second run
test('Create a citation for customer John Doe', async () => {
  await citationsClient.create({ customerId: 'USR-FIXED-001', amount: 150 });
  // Run 1: creates CIT-001 for USR-FIXED-001 → passes
  // Run 2: USR-FIXED-001 already has a citation → duplicate error → fails
  // Run 3: database constraint blocks → fails
});
```

**The fix — unique identity + cleanup:**
```typescript
// ✅ Idempotent — passes every time regardless of how many times it's run
test('Create a citation', async ({ account, citationsClient }) => {
  // account.userId is unique per test run — no collision possible
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId })
  );
  expect(citation.citationId).toMatch(/^CIT-/);
  // Cleanup happens in the fixture's finally block — slate is clean for next run
});
```

**Why unique identity:** `account.userId` is created fresh for this test run. Even if you run 10 workers in parallel, each gets their own account. No collision possible.

**Why cleanup:** Even if a test fails halfway through, the `try/finally` in the fixture deletes the data. Next run starts clean.

### Pillar 2 — Isolation (each test is an island)

**Definition:** A test must not depend on any state created, modified, or deleted by another test. The ORDER tests run in must not matter.

**The violation:**
```typescript
// ❌ Test B depends on Test A having run first
test('A: Create citation CIT-SHARED', async () => {
  await db.insert('citations', { id: 'CIT-SHARED', status: 'PENDING' });
});

test('B: Dispute citation CIT-SHARED', async () => {
  await page.goto('/citations/CIT-SHARED');          // what if A ran second?
  await disputeForm.submit('Wrong amount');           // what if A failed?
  await expect(statusBadge).toHaveText('DISPUTED');
});
```

Run tests in random order → Test B fails. Run tests in parallel → both tests operate on the same record → race condition. Move Test A to a different file → Test B breaks immediately.

**The fix:**
```typescript
// ✅ Each test creates its own data
test('Dispute a pending citation', async ({ account, citationsClient, page }) => {
  // Create MY OWN citation — don't share with other tests
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId })
  );
  // Now test against MY citation — cannot be affected by any other test
  await page.goto(`/citations/${citation.citationId}`);
  await disputeForm.submit('Wrong amount');
  await expect(statusBadge).toHaveText('DISPUTED');
});
```

**Playwright's implementation of isolation:** By default, Playwright gives every test a fresh `BrowserContext` — its own isolated cookie store, localStorage, and sessionStorage. No cookies from Test A leak to Test B. This is the browser-level isolation.

The test-data isolation (unique per-test data) is YOUR responsibility as SDET — Playwright cannot do this for you.

### Pillar 3 — Wait for State, Not Time

**Definition:** Never use `page.waitForTimeout(N)`. Instead, wait for the application to reach a specific observable state.

**The violation:**
```typescript
// ❌ Hard sleep — the silent killer of test reliability
await page.click('#saveBtn');
await page.waitForTimeout(3000);  // "the page usually loads in 2s, so 3s should work"
await expect(page.locator('.success')).toBeVisible();

// What happens:
// Normal day: save takes 1.2s → you wait 1.8s unnecessarily (slow)
// Heavy load: save takes 3.5s → you check at 3s → fails (false failure)
// Your network is fast: save takes 0.8s → you wait 2.2s unnecessarily (very slow)
// CI server: save takes 5s → you check at 3s → always fails in CI
```

**The fix — wait for observable state:**
```typescript
// ✅ Wait for what the user would observe
await page.click('#saveBtn');

// Wait for: loading spinner to disappear (D365 pattern)
await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 30_000 });

// Wait for: success notification to appear
await expect(page.locator('.notification-success')).toBeVisible({ timeout: 15_000 });

// Wait for: navigation to complete (SPA pattern)
await page.waitForURL('**/citations/*/detail', { timeout: 15_000 });

// Wait for: API call to complete (network-level wait)
const [saveResponse] = await Promise.all([
  page.waitForResponse(res => res.url().includes('/api/citations') && res.request().method() === 'POST'),
  page.click('#saveBtn'),
]);
expect(saveResponse.status()).toBe(201);
```

**The hierarchy of wait strategies (best to worst):**

```
1. expect(locator).toBeVisible()        — auto-retrying, reads state, BEST
2. page.waitForURL()                    — navigation-specific, very reliable
3. page.waitForResponse()               — network-level, perfect for API-driven apps
4. page.waitForLoadState('networkidle') — waits for network quiet, fragile for SPAs
5. page.waitForSelector()              — lower-level, avoid if possible
6. page.waitForTimeout(n)              — NEVER USE unless debugging
```

---

## 4. The Professional Vocabulary — Talking Like an SDET

Knowing these terms lets you communicate precisely with developers, architects, and your own tests.

### Test Pyramid Terms

```
Flakiness:    A test that produces different results across runs without application changes.
              "This test is flaky" = "I don't trust this test result."

Idempotency:  A test can be run N times with the same result.

Determinism:  Given the same input, always produce the same output.
              A deterministic test has no randomness, timing dependence, or shared state.

Test Isolation: Each test runs independently — order doesn't matter.

State:        The current values stored in a system (database rows, cookies, localStorage).
              "Dirty state" = state left over from a previous test.

Test Data:    The data created or used by a test. Must be unique per test run.
```

### Architecture Terms

```
Fixture:      A function that sets up (and tears down) the preconditions for a test.
              Playwright fixtures provide page, context, account, apiClient etc.

POM:          Page Object Model. A class that represents one page/component of the UI.
              Encapsulates locators and interactions — tests don't contain raw locators.

Factory:      A function that creates objects with sensible defaults.
              PayloadsCitation.pending() is a factory.

Seeding:      Creating test data before a test runs (via API, DB, or UI).

Teardown:     Deleting or restoring test data after a test runs.

Contract:     An agreed API shape between consumer and provider.
              "The API contract says status must be one of: PENDING|PAID|DISPUTED"

Assertion:    A check that verifies the application's state matches expectations.
              Hard assertion: throws immediately on failure.
              Soft assertion: collects failures and reports all at the end.
```

### Timing Terms (Critical for D365)

```
Race Condition:   Two operations compete for the same resource and the outcome
                  depends on which finishes first. Tests should never have race conditions.

Two-Phase Render: React/D365 pattern where the container renders immediately (empty)
                  and then the data arrives asynchronously (filling in the container).
                  Text appears to "be there" but is still loading. Your wait must
                  wait for the SPECIFIC TEXT, not just the element's existence.

Network Idle:     All network requests have been idle for 500ms. Indicates page load is done.
                  Fragile for apps that poll (heartbeat requests keep network from being idle).

DOMContentLoaded: HTML is parsed and DOM is constructed. CSS/images may still be loading.
                  `loadState('domcontentloaded')` is faster but less complete than 'load'.
```

---

## 5. The Debugging Pipeline — From Failure to Root Cause in 5 Minutes

When a test fails, you must diagnose it systematically. Do NOT make random changes hoping something works.

```
STEP 1: Read the failure message carefully.
  - "Expected 'PENDING' but got 'undefined'" → element exists but text not loaded (two-phase render)
  - "Timeout waiting for element to be visible" → element doesn't exist or wrong locator
  - "Target closed" → page navigated away before assertion ran
  - "403 Forbidden" → auth token expired or test account doesn't have permission
  - "Connection refused" → environment/URL is wrong, service is down

STEP 2: Open the Playwright trace.
  npx playwright show-trace test-results/[test-name]/trace.zip
  → Shows every action, every screenshot, every network request
  → You can see EXACTLY what the page looked like at the moment of failure
  → You can see if the element existed, if the text was loaded, if the button was enabled

STEP 3: Check if it's a locator issue.
  → In DevTools: $('[data-testid="submit-btn"]') — does it return the right element?
  → Is there more than one match? (Playwright strict mode throws on multiple matches)
  → Is the element inside a Shadow DOM? (XPath won't find it)

STEP 4: Check if it's a timing issue.
  → Did the test fail IMMEDIATELY (locator not found) or after a timeout (element found but waited too long)?
  → Immediate failure = wrong locator OR element doesn't exist
  → Timeout failure = element exists intermittently (timing/loading issue)

STEP 5: Check if it's a data issue.
  → Was the test data created before this step ran?
  → Is the data visible to this user's role/permission?
  → Did a previous test run leave dirty state?

STEP 6: Check the environment.
  → Is the staging environment healthy?
  → Are there any deployment alerts or environment issues?
  → Does the test pass locally but fail in CI? (Timing difference — CI is slower)

STEP 7: If all of the above are fine:
  → YOU FOUND A REAL BUG. File it with the trace, screenshot, and reproduction steps.
```

---

## 6. Test Confidence Levels — What Are You Actually Testing?

Not all tests give you the same type of confidence. Know what each test proves:

```
UI TEST ("The citation form appears and saves correctly"):
  Proves: the HTML renders, buttons are clickable, form submits, navigation works
  Does NOT prove: data was saved correctly in the DB, email was sent, other services were notified

API TEST ("POST /api/v2/citations returns 201 with correct body"):
  Proves: the API accepted the request and returned the expected shape
  Does NOT prove: the UI shows the citation correctly, the DB row is correct

DB TEST ("SELECT from citations WHERE id = ..."):
  Proves: data was persisted with correct values at the database level
  Does NOT prove: the API returns the data correctly, the UI renders it

THREE-LAYER TEST (UI + API + DB):
  Proves: the entire flow — UI submits → API processes → DB stores → UI displays
  This is the gold standard for critical paths (Ch30)

UNDERSTANDING THE GAPS:
  A test can pass even when things are wrong at other layers.
  "Success theatre" — the UI shows ✓ but the backend silently failed.
  Your assertion strategy determines whether you catch real bugs or just UI rendering.
```

---

## 7. The Professional SDET Checklist — Before You Write Any Test

Run through this mental checklist before writing your first line of code:

```
□ What is the MINIMUM level of the pyramid this test can live at?
  → If it can be an API test, don't make it a UI test.

□ Is the test idempotent?
  → Can it be run 100 times in a row with the same result?

□ Is the test isolated?
  → Can it be run in any order, in parallel, on any worker?

□ What is my test data strategy?
  → Where does the data come from? Who creates it? Who cleans it up?

□ What am I actually asserting?
  → Am I checking UI state, API state, or DB state? Is that sufficient?

□ What do I need to WAIT for?
  → What observable state tells me the action is complete?

□ What are the failure modes?
  → What will the error message say when this breaks? Will I be able to diagnose it?

□ Am I testing business behaviour or implementation detail?
  → Testing that a button exists = implementation detail (breaks when button is renamed)
  → Testing that a citation can be created and retrieved = business behaviour (stable)
```

---

## 🏋️ Practice — Deep Understanding Questions

### Q1. [Fundamental] Why is "test order independence" critically important in CI?

<details><summary>Answer</summary>

In CI, Playwright runs tests in parallel across multiple workers. There is no guarantee that Test A runs before Test B — they may run simultaneously on different machines. If Test B depends on state created by Test A, and they run on separate workers, Test B will see no data and fail.

Additionally, CI often runs tests in a different order than your local machine. `playwright.config.ts` can randomise test order. If tests are order-dependent, the suite is non-deterministic — it passes sometimes and fails sometimes with no code changes. This breaks trust in the entire test suite.

The fix: every test creates ALL the data it needs (setup in `beforeEach` or fixtures) and cleans up in `afterEach` or fixture teardown. No test should rely on another test's side effects.
</details>

---

### Q2. [Mental Model] A test passes locally but fails in CI 50% of the time. Walk through your debugging process.

<details><summary>Answer</summary>

This is a **flaky test** — likely a timing issue or shared state problem. Systematic approach:

**1. Check CI vs local differences:**
- CI machines are slower (less CPU, shared I/O) → timeouts that work locally might not hold in CI
- Increase assertion timeouts to 30s for network-dependent assertions

**2. Check for shared state:**
- Is the test using a shared account or shared test data?
- Do parallel workers write to the same record?
- Does the test depend on data from a previous test?

**3. Check for race conditions:**
- Is there a `Promise.all` where the listener might miss the event?
- Is the test checking a value that might still be loading (two-phase render)?

**4. Use `--repeat-each=20` to reproduce locally:**
```bash
npx playwright test tests/specs/myflakytest.spec.ts --repeat-each=20
```
Run it 20 times in a row. If it fails even once → race condition. Examine the failures.

**5. Check the trace:**
```bash
npx playwright test --trace on
```
The trace shows the page state at every step. You can see if the element existed but wasn't yet text-filled, or if the page navigated away.

**6. Fix strategies by flakiness type:**
- Timing: replace `waitForTimeout` with `expect(locator).toHaveText(value, { timeout: 30_000 })`
- Shared state: give each test a unique account and unique data
- Race condition: use `Promise.all([listener, action])` pattern
</details>

---

### Q3. [Architecture] Your manager asks you to "automate all 300 manual regression test cases in Playwright." What do you say?

<details><summary>Answer</summary>

"I won't automate all 300 in Playwright, because that would give us the most expensive, slowest, and most fragile test suite possible. Here's my proposal instead:"

**Step 1 — Classify the 300 tests by pyramid layer:**
- Which test cases are verifying business logic? → API test (10x faster, 10x more reliable)
- Which test cases are verifying data persistence? → DB test or API + DB test
- Which test cases are verifying UI rendering of known data? → Playwright
- Which test cases are verifying complete user journeys? → Playwright

**Step 2 — Estimate the split:**
Typically: 120 cases can become API tests, 60 become DB verifications, 80 become UI tests, 40 require manual testing (exploratory, UX judgment calls).

**Step 3 — Prioritise the UI tests by risk:**
Which 20 UI tests, if broken, would cause a production incident? Automate those first. Don't automate low-risk admin screens that change monthly.

**Result:** 80 fast, reliable automated tests that catch 95% of regressions, instead of 300 slow, brittle UI tests that catch 60% of regressions after a 4-hour CI run.
</details>

---

**Navigation**: [Index](../00_INDEX.md) | [Next: Playwright & TypeScript Basics →](./01_Playwright_TS_Basics.md)
