# 34. Algorithms in Test Automation — Search, Sort, and Pattern Recognition

**Navigation**: [← Chapter 33: SDET→SDE CS Thinking](./33_SDET_to_SDE_CS_Thinking.md) | [Index](../00_INDEX.md) | [→ Chapter 35: OOP Design Patterns Deep-Dive for SDETs](./35_OOP_Design_Patterns_for_SDETs.md)

**Cross-references (read these alongside this chapter):**

- [`../../03_Algorithms/01_Algorithm_Thinking.md`](../../03_Algorithms/01_Algorithm_Thinking.md) — The algorithm thinking framework that applies to test design
- [`../../03_Algorithms/06e_Algorithm_Patterns.md`](../../03_Algorithms/06e_Algorithm_Patterns.md) — Patterns like sliding window, two pointers — appear directly in assertion design
- [`../../14_Mental_Models/14_Optimization_Pipeline.md`](../../14_Mental_Models/14_Optimization_Pipeline.md) — Brute-force → optimise pipeline (how to improve slow tests)
- [`../../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md`](../../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md) — Always start with brute force, then optimise
- [`../../20_Interview_Mastery/02_Constraint_to_Algorithm_Map.md`](../../20_Interview_Mastery/02_Constraint_to_Algorithm_Map.md) — Constraint → algorithm selection maps to problem → test strategy

---

## Why Algorithms Matter in Test Engineering

```
"I don't need algorithms — I'm an SDET, not a competitive programmer."

This is wrong. Here is where algorithms appear every single day:

1. Searching for the right locator in a massive D365 DOM → tree search
2. Polling until a condition is met → binary search in time
3. Deciding which tests to run on a PR → set intersection
4. Finding which commit broke a test → binary search (git bisect)
5. Ordering test setup steps → topological sort
6. Processing a paginated API response → sliding window
7. Asserting table data is sorted correctly → sort verification
8. Finding duplicate test IDs → two-pointer / HashMap
9. Building retry logic → backoff algorithm
10. Optimising a slow test suite → greedy / DP thinking

Every algorithm has a test automation equivalent.
This chapter makes those connections explicit.
```

---

## 0. War Stories — When Algorithmic Thinking Saved the Run

### Story 1: O(n²) pagination check that took 4 hours in CI

A colleague wrote the "verify no duplicates" check for a paginated API response. It worked fine in development where the dataset had 200 citations. In CI against the staging database (11,000 citations), the test took 4 hours and was marked as "infrastructure issue." The test was retried 3 times automatically, consuming 12 hours of CI time on each nightly run.

The problem: a nested loop checking every citation against every other citation — O(n²). With 11,000 citations that's 121 million comparisons. The fix was a HashSet (Section 2 of this chapter) — O(n) time, O(n) space. The test dropped from 4 hours to 3.7 seconds.

The lesson: any assertion that iterates over "all results" is hiding an O(n²) time bomb. When the dataset grows, you pay.

### Story 2: 90-minute test suite that ran in 14 minutes after dependency-graph ordering

A test suite for a D365 module had 70 tests, each setting up its own data from scratch: login, navigate to admin, create record, navigate back, run assertion. Average setup time: 72 seconds per test. Total: 5,040 seconds (~84 minutes).

Applying topological sort (Section 6): some tests could share setup data. Tests that only READ didn't need their own data — they could use data created by tests that WRITE. After mapping dependencies and reordering using DFS topological sort, 38 tests were able to share setup. Runtime: 14 minutes.

The lesson: test execution order is a graph problem. Ignoring it costs you wall-clock time every single CI run.

### Story 3: Binary search that found the flaky commit in 7 minutes instead of 7 days

A flaky test appeared in CI. The last known-green state was a commit 180 commits ago. One engineer estimated "a week" to bisect manually by checking commits one by one. Another knew `git bisect` — which performs binary search on the commit history. 180 commits → log₂(180) ≈ 7 checks. The flaky commit was identified in 7 minutes.

`git bisect start HEAD <known-good-sha>` hands you the midpoint commit. You run the test. If it fails, `git bisect bad`. If it passes, `git bisect good`. After 7 iterations: `git bisect good` tells you the first bad commit and the changed file.

The lesson: git bisect is binary search. If you don't recognize the pattern, you do it manually and it takes a week.

---

## 1. The Algorithm Thinking Framework Applied to Test Design

From [`../../03_Algorithms/01_Algorithm_Thinking.md`](../../03_Algorithms/01_Algorithm_Thinking.md), the framework is:

```
1. Understand the problem completely
2. Identify constraints
3. Think brute force first
4. Identify the bottleneck / inefficiency
5. Optimise — apply the right pattern
6. Verify edge cases
```

**Applied to test design — the same steps:**

```
Test problem: "Verify that citations are sorted by issue date, newest first"

Step 1 — Understand completely:
  The results grid shows citations. We need to verify the ORDER, not just presence.
  "Sorted" means: each row's date ≥ next row's date (descending).

Step 2 — Constraints:
  D365 grid might only show 50 rows at a time (pagination).
  Dates are displayed as "05/28/2026" strings, not ISO format.
  We have up to 500 citations in the DB.

Step 3 — Brute force:
  Fetch all 500 citations from API, sort them in TypeScript, compare to UI.
  → Works but: 500 API calls is slow. Comparing all 500 rows is fragile.

Step 4 — Bottleneck:
  We don't need all 500 — we only need to verify the VISIBLE 50.
  And we don't need the full comparison — we only need adjacent pair checks.

Step 5 — Optimise:
  Fetch visible 50 rows. Check: date[i] >= date[i+1] for each adjacent pair.
  This is O(n) where n=50, not O(500).
  Classic: verify sorted array by checking adjacent pairs.

Step 6 — Edge cases:
  - Two citations on the same day → same date is valid (equal is ok)
  - Only 1 citation → vacuously sorted, test should pass
  - All same date → still sorted
```

```typescript
// The O(n) sorted verification test
async function verifyGridSortedByDate(
  grid: MasterSearchResultsGrid,
  direction: "asc" | "desc" = "desc",
): Promise<void> {
  const rows = await grid.rows.all();
  if (rows.length <= 1) return; // edge case: 0 or 1 rows are trivially sorted

  const dates: Date[] = [];
  for (const row of rows) {
    const dateText =
      (await row.locator('[data-col="issueDate"]').textContent()) ?? "";
    dates.push(parseMMDDYYYY(dateText)); // parse "05/28/2026" → Date
  }

  // Check adjacent pairs — O(n), no sorting needed
  for (let i = 0; i < dates.length - 1; i++) {
    if (direction === "desc") {
      expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
    } else {
      expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i + 1].getTime());
    }
  }
}
```

---

## 2. Sliding Window → Paginated API Assertions

**The algorithm** (from [`../../03_Algorithms/06e_Algorithm_Patterns.md`](../../03_Algorithms/06e_Algorithm_Patterns.md)):

- Sliding window: maintain a fixed-size window over a sequence
- Move the window forward without reprocessing everything already seen
- Use for: subarray problems, stream processing, rate limiting

**In test automation — processing paginated API responses:**

```typescript
// Scenario: The citations API paginates with 20 items per page.
// You need to find ALL citations for a user across ALL pages
// and verify there are no duplicates.

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    totalPages: number;
    pageSize: number;
    total: number;
  };
}

// BRUTE FORCE: fetch all pages, concatenate, scan for duplicates — O(n²)
const all: CitationApiResponse[] = [];
let page = 1;
do {
  const resp = await citationsClient.search({ userId: account.userId, page });
  all.push(...resp.data);
  page++;
} while (page <= resp.pagination.totalPages);

// O(n²) duplicate check:
for (let i = 0; i < all.length; i++) {
  for (let j = i + 1; j < all.length; j++) {
    expect(all[i].citationId).not.toBe(all[j].citationId); // O(n²)
  }
}

// OPTIMISED: sliding window over pages + HashSet for O(1) duplicate detection
async function fetchAllPagesWithDuplicateCheck(
  searchFn: (page: number) => Promise<PaginatedResponse<CitationApiResponse>>,
): Promise<CitationApiResponse[]> {
  const seen = new Set<string>(); // HashSet — O(1) lookup
  const all: CitationApiResponse[] = [];
  let currentPage = 1;

  do {
    const response = await searchFn(currentPage);
    const { data, pagination } = response;

    // Sliding window: process current page's window
    for (const citation of data) {
      if (seen.has(citation.citationId)) {
        throw new Error(
          `Duplicate citation detected: ${citation.citationId} on page ${currentPage}`,
        );
      }
      seen.add(citation.citationId);
      all.push(citation);
    }

    if (currentPage >= pagination.totalPages) break;
    currentPage++;
  } while (true);

  return all;
}
// O(n) time: each citation processed once. O(n) space: HashSet holds all IDs.
// Detects duplicates immediately as they're encountered, not at the end.
```

**Why this is better:**

- The window slides forward: only the current page is in active memory, previous pages released
- Duplicate detection is O(1) per item (HashSet) instead of O(n) per item (array scan)
- Fails fast: stops at the first duplicate rather than collecting all data first

---

## 3. Two Pointers → Dual-Context Test Assertions

**The algorithm** (from [`../../20_Interview_Mastery/Problem_Sets_DSA/14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md`](../../20_Interview_Mastery/Problem_Sets_DSA/14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md)):

- Two pointers: two indices moving through an array, often toward each other or in sync

**In test automation — admin + customer dual context:**

```typescript
// Pattern 3 (Ch13): Two contexts, two pages, actions on one visible on the other.
// This IS the two-pointer pattern applied to async UIs.

// Pointer 1: adminPage (moves forward by performing actions)
// Pointer 2: customerPage (moves forward by observing effects)
// They must stay "in sync" — customer pointer catches up before admin advances.

test("Admin changes credit limit → customer sees updated limit", async ({
  adminContext,
  customerContext,
}) => {
  const adminPage = adminContext.pages()[0]; // pointer 1
  const customerPage = customerContext.pages()[0]; // pointer 2

  const creditModule = new CreditLimitPage(adminPage);
  const customerDashboard = new CustomerDashboardPage(customerPage);

  // Pointer 1 advances:
  await creditModule.setCreditLimit(account.userId, 5000);
  await creditModule.saveChanges();

  // SYNC POINT: pointer 2 must catch up before we assert
  // (same as two-pointer convergence — wait for pointers to meet at the same value)
  await customerPage.reload();
  await expect(customerDashboard.creditLimitDisplay).toHaveText("£5,000", {
    timeout: 30_000,
  });

  // Pointer 1 advances again:
  await creditModule.setCreditLimit(account.userId, 7500);
  await creditModule.saveChanges();

  // SYNC POINT again:
  await customerPage.reload();
  await expect(customerDashboard.creditLimitDisplay).toHaveText("£7,500", {
    timeout: 30_000,
  });
});
```

**The invariant** (same as two-pointer invariant in algorithms):

> At every sync point, both pointers must be observing the SAME state.
> Violating this gives incorrect assertions — same as reading a stale left pointer in a two-pointer algorithm.

---

## 4. Binary Search → Efficient Element Finding in Large Grids

**The algorithm** (O(log n) search in sorted space):

```typescript
// Scenario: D365 results grid has 1000 rows, sorted by citation ID.
// You need to find citation CIT-500 without scrolling through all 1000 rows.

// BRUTE FORCE O(n): check each row until found
const rows = await grid.locator(".ms-DetailsRow").all();
let targetRow = null;
for (const row of rows) {
  const id = await row.locator('[data-col="citationId"]').textContent();
  if (id?.trim() === "CIT-500") {
    targetRow = row;
    break;
  }
}
// O(n): checks up to 1000 rows

// BINARY SEARCH approach: use the API to pre-locate, then navigate directly
// (Because Playwright can't do binary search on virtual-scroll grids,
//  but you can binary search the API response to find the page number)

async function findCitationPage(
  citationId: string,
  pageSize = 20,
): Promise<number> {
  // Binary search: which page is the citation on?
  let low = 1,
    high = 50; // assume ≤50 pages

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const response = await citationsClient.search({ page: mid, pageSize });

    const ids = response.data.map((c) => c.citationId);
    if (ids.includes(citationId)) return mid; // FOUND

    // Since sorted: if first ID on this page > target → target is on earlier page
    if (ids[0] > citationId) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  throw new Error(`Citation ${citationId} not found in any page`);
}
// O(log n) pages fetched instead of O(n) pages
```

**The deeper insight:**

> Any time you have a SORTED, MONOTONIC problem space in tests,
> ask: "Can I binary search instead of linear scan?"
> Tests that navigate to "page N" to find an item are doing binary search implicitly.

---

## 5. Greedy Algorithm → Test Suite Prioritisation

**The algorithm** (from [`../../03_Algorithms/12_Greedy_Algorithms_Complete.md`](../../03_Algorithms/12_Greedy_Algorithms_Complete.md)):

- Greedy: at each step, make the locally optimal choice
- Works when: local optima compose to a global optimum
- Classic example: activity selection problem (schedule maximum non-overlapping activities)

**In test automation — which tests to run on a PR:**

```
Problem: You have 500 tests but only 10 minutes in CI.
Which tests give maximum coverage of the changed code?

Greedy approach:
  1. Sort tests by "coverage density" = (files covered) / (time to run)
  2. Greedily select tests with highest density until time budget is used
  3. Always include @smoke tests regardless (they're mandatory)

This is equivalent to the fractional knapsack problem:
  - Each test is an item with weight (time) and value (coverage)
  - You have capacity (10 minutes)
  - Greedy: take highest value/weight ratio first

Implementation in CI:
  npx playwright test --grep "@smoke" --timeout=600000  # always run: 10min budget
  # Then greedily add @regression tests starting from fastest (--repeat-each sorting)
```

**Activity selection in test scheduling:**

```typescript
// Schedule tests to avoid overlapping shared resources (e.g., the same test account)
// This IS the activity selection problem.

interface TestActivity {
  name: string;
  usesAccount: string; // which test account it uses
  durationMs: number;
}

// Greedy: sort by end time, select non-overlapping activities
// Applied: tests using the same account must not run simultaneously
// → Assign them to different workers (different account pools)

// playwright.config.ts:
projects: [
  // Each project uses a DIFFERENT account → no overlap → no data pollution
  { name: "admin-tests", use: { storageState: "auth/admin.json" } },
  { name: "supervisor-tests", use: { storageState: "auth/supervisor.json" } },
  { name: "customer-tests", use: { storageState: "auth/customer.json" } },
];
// Greedy assignment: tests using admin account → admin project.
// No two tests in the same project share state → activity selection satisfied.
```

---

## 6. Dynamic Programming → Optimal Retry Backoff

**The algorithm** (from [`../../03_Algorithms/04a_DP_Internals.md`](../../03_Algorithms/04a_DP_Internals.md)):

- DP: break a problem into overlapping subproblems, cache results
- Key properties: optimal substructure + overlapping subproblems

**In test automation — designing the optimal retry interval sequence:**

```typescript
// Problem: Given a total timeout T and max attempts N,
// what is the optimal sequence of wait intervals to maximise
// detection probability while minimising total wait time?

// DP formulation:
// dp[i] = optimal interval for attempt i
// Constraint: sum(dp) <= T, len(dp) = N
// Objective: detect fast events quickly, still catch slow events

// Solution: exponential backoff (the DP-optimal solution for this problem)
// dp[0] = base (e.g., 500ms)
// dp[i] = min(dp[i-1] * 2, maxInterval)

function generateBackoffIntervals(
  base: number,
  maxInterval: number,
  maxAttempts: number,
): number[] {
  const intervals: number[] = [];
  let current = base;
  for (let i = 0; i < maxAttempts; i++) {
    intervals.push(current);
    current = Math.min(current * 2, maxInterval);
  }
  return intervals;
}

// generateBackoffIntervals(500, 10_000, 7)
// = [500, 1000, 2000, 4000, 8000, 10000, 10000]
// Catches fast events (500ms), backs off for slow events (10s max)
// Total max wait: 36 seconds — you knew the upper bound before running

// This IS Playwright's built-in intervals:
await expect
  .poll(fn, {
    intervals: [500, 1000, 2000, 4000, 8000, 10_000], // exponential backoff
    timeout: 36_000,
  })
  .toBe(expected);
```

---

## 7. Pattern Recognition → Test Strategy Selection

From [`../../20_Interview_Mastery/02_Constraint_to_Algorithm_Map.md`](../../20_Interview_Mastery/02_Constraint_to_Algorithm_Map.md), the idea is: given constraints, map to the right algorithm. The same applies to tests:

```
Given constraint/observation → Select test strategy

"The API has a 200ms SLA"
  → Add response time assertion: expect(duration).toBeLessThan(200)
  → Use performance timing: page.on('response', r => measureTime(r))

"Two services must process events in order"
  → Use queue ordering assertion (Section 2 of Ch33)
  → Assert index(eventA) < index(eventB) in the notification list

"Same data appears in 3 different places (UI, API, DB)"
  → Use three-layer verification (Ch30)
  → Fail immediately if any layer disagrees

"Test is slow because it creates complex data via UI"
  → Recognise: UI setup is O(n × clicks); API setup is O(1) API call
  → Switch to API seeding for setup (Ch28, Strategy 1)

"Tests pass alone but fail in parallel"
  → Recognise: data pollution or shared state (Ch26, Type 2/3)
  → Apply: unique ID per test (Ch28, TestId utility)

"Notification test fails 1/5 times"
  → Recognise: Type 9 flakiness (third-party service timing)
  → Apply: expect.poll() with 30s timeout (Ch26)

"Need to test what happens when API returns 500"
  → Cannot reproduce with real API → mocking required (Ch31)
  → Use page.route() to intercept and return 500

"D365 assertion fails immediately but passes with waitForTimeout(2000)"
  → Recognise: Type 1 timing / two-phase render (Ch26)
  → Replace with expect(locator).toHaveText(value, { timeout: 30_000 })
```

**The recognition skill — building intuition:**

```
Month 1: You google solutions to each problem.
Month 3: You recognise which chapter to look in.
Month 6: You recognise the pattern before finishing reading the problem.
Month 12: You see the pattern in the problem description before writing code.

The transition happens when you've solved enough examples that
the pattern recognition is automatic. This is NOT memorisation —
it is building a graph of (symptoms) → (diagnoses) in your brain.

Every practice challenge in this curriculum trains that graph.
```

---

## 8. Brute Force → Optimal: Applied to Test Design

From [`../../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md`](../../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md):

```
The playbook:
  1. Write the brute-force solution (always works, might be slow)
  2. Run it, verify correctness
  3. Profile: where is the time being spent?
  4. Apply the optimal pattern for that bottleneck
  5. Verify the optimised version gives the same result
```

**Applied to test suite optimisation:**

```
Step 1 — Brute force test setup:
  Each test navigates to the login page, enters credentials, logs in.
  100 tests × 10 seconds login = 1000 seconds (16 minutes) just for setup.

Step 2 — Verify it works (brute force is correct):
  All tests pass. But CI takes 40 minutes.

Step 3 — Profile:
  playwright show-report → per-test timing breakdown
  Finding: 25% of time is authentication (login steps)

Step 4 — Apply optimal pattern:
  StorageState (Ch16) — login once in globalSetup, reuse for all tests.
  100 tests × 0 seconds login = 0 seconds setup time.
  CI drops from 40 to 30 minutes.

Step 5 — Verify correctness:
  All tests still pass with saved auth state.
  Auth-specific tests (login page, logout, token expiry) are EXCLUDED
  from storageState — they need real login (brute force for those).
```

---

## ðŸ‹ï¸ Practice Challenges

### Challenge 1 [Algorithm Design]

You have a paginated API: `GET /api/citations?page=N&size=20` returning up to 500 pages. You need to find the FIRST citation with `status = 'OVERDUE'` and the page number it appears on.

The citations are sorted by `dueDate` ascending (oldest due date first). Overdue citations cluster near the beginning (they have old due dates). Write the most efficient search strategy. What is its time complexity?

<details><summary>Answer</summary>

```typescript
// Insight: overdue citations are at the BEGINNING (old due dates first, sorted asc)
// This means the problem space has a pattern:
// Page 1: likely all OVERDUE (old due dates)
// Page N: likely all PENDING/PAID (newer due dates)
// Boundary: somewhere between page 1 and page N

// A BINARY SEARCH would work if the problem were perfectly monotonic,
// but a citation on page 10 might have PAID status (paid before due).
// So perfect binary search won't work.

// OPTIMAL: Linear scan from page 1, stop at first OVERDUE found.
// Since OVERDUE citations cluster at the front, expected O(1) pages fetched
// (in the average case where there are many OVERDUE citations).
// Worst case: O(log n) for a single OVERDUE citation — treat like binary search.

async function findFirstOverdueCitation(
  client: CitationsApiClient,
): Promise<{ citation: CitationApiResponse; page: number } | null> {
  let page = 1;
  const totalPages = 500; // upper bound

  while (page <= totalPages) {
    const response = await client.search({
      page,
      size: 20,
      sort: "dueDate:asc",
    });

    const overdue = response.data.find((c) => c.status === "OVERDUE");
    if (overdue) return { citation: overdue, page };

    // Early termination: if no OVERDUE on this page AND dueDate > today,
    // all future pages will have even newer dates → definitely not OVERDUE
    const allFuture = response.data.every(
      (c) => new Date(c.dueDate!) > new Date(),
    );
    if (allFuture) return null; // no OVERDUE will exist on subsequent pages

    if (page >= response.pagination.totalPages) return null;
    page++;
  }
  return null;
}
// Best case: O(1) pages (first page has OVERDUE)
// Average case: O(k) where k = pages before first OVERDUE (small)
// Worst case: O(n) pages (OVERDUE only on the last page, or none exists)
// With early termination: practically O(1) for well-behaved data
```

</details>

---

### Challenge 2 [Pattern Recognition]

Match each test problem to its algorithm pattern and implementation strategy:

| Problem                                                                    | Algorithm | Implementation |
| -------------------------------------------------------------------------- | --------- | -------------- |
| Find all tests that cover a changed file                                   | ?         | ?              |
| Verify API response list has no duplicates                                 | ?         | ?              |
| Test that credit limit updates propagate in order (A then B, not B then A) | ?         | ?              |
| Find minimum set of tests that cover all critical paths                    | ?         | ?              |

<details><summary>Answer</summary>

| Problem                                                      | Algorithm                                                                                 | Implementation                                                                                 |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Find all tests that cover a changed file                     | **Graph reachability / BFS** — changed file is a node; tests that import it are neighbors | Build an import dependency graph, BFS from changed file, collect all reachable test files      |
| Verify API response list has no duplicates                   | **HashSet O(1)**                                                                          | Iterate once, insert each ID into a Set; throw on first collision                              |
| Test that credit limit updates propagate in order (A then B) | **Queue ordering / two-pointer**                                                          | Assert `index(updateA) < index(updateB)` in the audit log or notification list                 |
| Find minimum set of tests that cover all critical paths      | **Set Cover (NP-hard) → Greedy approximation**                                            | Sort tests by coverage density (paths covered / time), greedily select until all paths covered |

</details>

### Challenge 3 [MCQ] — Sliding Window for Log Analysis

You receive an audit log with 50,000 timestamped events. You need to find the 10-second window with the highest number of FAILED_LOGIN events (to detect brute-force attacks in your test data). Which algorithmic approach solves this in O(n) time?

A) Nested loop: for each event, count FAILED_LOGIN events within 10 seconds. O(n²).
B) Sort by event type first, then scan. O(n log n).
C) Sliding window with two pointers: maintain a window [left, right]. Advance right; when the window exceeds 10 seconds, advance left. Track the max count. O(n).
D) Binary search for every event's 10-second boundary. O(n log n).

<details><summary>Answer</summary>

**C** — The sliding window pattern is optimal here:

```typescript
function findBruteForceWindow(
  events: AuditEvent[],
  windowSeconds: number = 10,
): { start: number; end: number; count: number } {
  // Assumes events are sorted by timestamp (audit logs are chronological)
  const failedLogins = events.filter((e) => e.type === "FAILED_LOGIN");

  let left = 0;
  let maxCount = 0;
  let maxWindow = { start: 0, end: 0, count: 0 };

  for (let right = 0; right < failedLogins.length; right++) {
    // Shrink window from left while it exceeds 10 seconds
    while (
      failedLogins[right].timestamp - failedLogins[left].timestamp >
      windowSeconds * 1000
    ) {
      left++;
    }

    const currentCount = right - left + 1;
    if (currentCount > maxCount) {
      maxCount = currentCount;
      maxWindow = {
        start: failedLogins[left].timestamp,
        end: failedLogins[right].timestamp,
        count: currentCount,
      };
    }
  }

  return maxWindow;
}

// In test:
const bruteForceWindow = findBruteForceWindow(auditLog);
expect(
  bruteForceWindow.count,
  "No brute force window should exceed 5 attempts in 10s",
).toBeLessThanOrEqual(5);
```

The sliding window makes each element enter and exit the window at most once — O(n) total. Option A (nested loop) is O(n²): for 50,000 events this is 2.5 billion comparisons. Option C's O(n) handles 50,000 events in milliseconds.

**Automation application**: Use sliding window whenever you're asserting rate-limiting behavior, event frequency thresholds, or burst detection in log/audit trail data.

</details>

---

### Challenge 4 [Spot the Bug — Graph Traversal for Test Dependency]

```typescript
// Builds a dependency graph: if test A creates data that test B needs,
// there's an edge A → B. Used to determine test execution order.

function buildExecutionOrder(dependencies: Map<string, string[]>): string[] {
  const order: string[] = [];
  const visited = new Set<string>();

  function dfs(test: string): void {
    if (visited.has(test)) return;
    visited.add(test);
    for (const dep of dependencies.get(test) ?? []) {
      dfs(dep);
    }
    order.push(test);
  }

  for (const test of dependencies.keys()) {
    dfs(test);
  }

  return order;
}

// Dependencies: A depends on B, B depends on C
const deps = new Map([
  ["testA", ["testB"]],
  ["testB", ["testC"]],
  ["testC", []],
  ["testD", ["testA", "testC"]], // testD depends on testA and testC
]);

const order = buildExecutionOrder(deps);
// Expected: C, B, A, D (topological order)
```

There is a critical missing check. What happens if the dependency graph has a cycle (e.g., A→B→A), and how do you fix it?

<details><summary>Answer</summary>

**Bug**: The DFS has no cycle detection. If `testA` depends on `testB` and `testB` depends on `testA`, the call stack recurses infinitely:

```
dfs('testA') → visits 'testA', calls dfs('testB')
  dfs('testB') → visits 'testB', calls dfs('testA')
    dfs('testA') → 'testA' is already visited → returns immediately ✓
```

Wait — actually the `visited` Set DOES prevent infinite recursion because `visited.has(test)` returns true on the second visit. BUT it produces a **wrong topological order** when there's a cycle — it silently accepts cyclic dependencies and returns an order that is semantically invalid (a test appears before its dependency).

The fix: distinguish between "currently in stack" (grey) and "fully processed" (black) — the three-color DFS:

```typescript
function buildExecutionOrder(dependencies: Map<string, string[]>): string[] {
  const order: string[] = [];
  const state = new Map<string, "unvisited" | "in-stack" | "done">();

  for (const test of dependencies.keys()) {
    state.set(test, "unvisited");
  }

  function dfs(test: string): void {
    if (state.get(test) === "done") return;
    if (state.get(test) === "in-stack") {
      throw new Error(
        `Circular dependency detected: ${test} depends on itself transitively`,
      );
    }

    state.set(test, "in-stack");
    for (const dep of dependencies.get(test) ?? []) {
      dfs(dep);
    }
    state.set(test, "done");
    order.push(test);
  }

  for (const test of dependencies.keys()) {
    if (state.get(test) === "unvisited") dfs(test);
  }

  return order;
}
```

With a cycle `A→B→A`, this throws: `Circular dependency detected: testA depends on itself transitively` — a clear, actionable error instead of silent wrong ordering.

**Real application**: Playwright's `test.describe.serial()` and fixture dependency graphs must be acyclic (DAGs). If you build a custom dependency-aware test runner, cycle detection is mandatory.

</details>

---

### Challenge 5 [Write It Yourself — Two-Sum for Response Validation]

An API returns a list of citation fines. Business rule: "No two citations issued to the same customer on the same day should have amounts that sum to exactly £500 (a known fraud pattern)." Write an O(n) check using a hash map, then explain why a naïve O(n²) approach fails at scale.

<details><summary>Answer</summary>

```typescript
/**
 * Two-sum fraud detection: find any pair of citations where amounts sum to target.
 * Uses hash-complement pattern for O(n) time.
 */
function findFraudPair(
  citations: {
    citationId: string;
    amount: number;
    customerId: string;
    issuedDate: string;
  }[],
  targetSum: number = 500,
): [string, string] | null {
  // Group by customer+date (the same-day-same-customer constraint)
  const groups = new Map<string, typeof citations>();
  for (const c of citations) {
    const key = `${c.customerId}:${c.issuedDate}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  // For each group, apply two-sum with hash complement
  for (const [, group] of groups) {
    const seen = new Map<number, string>(); // amount → citationId

    for (const c of group) {
      const complement = targetSum - c.amount;

      if (seen.has(complement)) {
        return [seen.get(complement)!, c.citationId]; // fraud pair found
      }

      seen.set(c.amount, c.citationId);
    }
  }

  return null; // no fraud pair
}

// In test:
test("No fraud-pattern citation pairs exist", async ({ citationsClient }) => {
  const citations = await citationsClient.getAllForAudit();
  const fraudPair = findFraudPair(citations, 500);

  expect(
    fraudPair,
    `Fraud pair found: ${fraudPair?.[0]} + ${fraudPair?.[1]} = £500`,
  ).toBeNull();
});
```

**Why O(n²) fails at scale:**

- With 100,000 citations: O(n²) = 10 billion comparisons → ~100 seconds of CPU time → test timeout
- O(n) hash-complement: 100,000 lookups → ~10ms

**The algorithm**: for each citation with amount `a`, check if `target - a` is already in the hash map. If yes, we found the pair. If no, store `a` in the map. Single pass through the array — O(n).

**The grouping step** (by customer+date) adds one more O(n) pass — the total complexity remains O(n). This is the standard two-sum extension for constrained pair-finding in real-world audit problems.

</details>

---

**Navigation**: [← Chapter 33: SDET→SDE CS Thinking](./33_SDET_to_SDE_CS_Thinking.md) | [Index](../00_INDEX.md) | [→ Chapter 35: OOP Design Patterns Deep-Dive for SDETs](./35_OOP_Design_Patterns_for_SDETs.md)


---

## Reality Check

**"Test automation does not need algorithmic thinking"** → Finding the shortest test execution path through a dependency graph is a topological sort problem. Detecting duplicate test scenarios across a test suite is a string similarity problem. Selecting the minimum set of tests that covers all changed code paths is a set cover problem. Algorithmic thinking is not optional for building efficient test infrastructure at scale.

**"Brute force is acceptable in test code because performance does not matter"** → A test utility that compares two arrays with nested loops runs in O(n squared). Called once with 10 items, it takes microseconds. Called by 500 tests with 1000 items each, it adds minutes to the suite. Test code performance matters because it multiplies across the entire test suite. Use appropriate data structures (Set for membership checks, Map for lookups) in test utilities.

**"Sorting and searching algorithms are irrelevant to testing"** → Custom comparators for sorting test results, binary search for finding elements in sorted test data, and hash-based lookups for test configuration are daily operations. Understanding that Array.sort without a comparator sorts lexicographically (10 comes before 9) prevents subtle test data ordering bugs.

**"Graph algorithms are too theoretical for SDETs"** → Test dependency graphs, page navigation flows, and API call chains are all graphs. Detecting circular dependencies between test fixtures is cycle detection. Finding all tests affected by a code change is reachability analysis. Building the minimum set of API calls to reach a test state is shortest path. These are practical applications of graph algorithms that SDETs encounter regularly.

**"Algorithmic optimization is premature in test code"** → Optimization is premature when the code is fast enough. But test suites that take 60 minutes instead of 10 minutes delay deployments by 50 minutes per pipeline run. Across 20 daily deployments, that is 16 hours of developer wait time per day. Optimizing test infrastructure has a direct and measurable ROI in developer productivity.
