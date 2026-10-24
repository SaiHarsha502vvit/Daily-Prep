# 11. SDET × DSA — From Basics to Elite

**Navigation**: [← Elite Cross-Domain Rounds](10_Elite_Cross_Domain_Rounds.md) | [📚 Index](../00_INDEX.md) | [SpringBoot × DSA →](12_SpringBoot_Plus_DSA_Progressive.md)

**Cross-links:**

- [`21_SDET_Playwright_Automation/`](../../21_SDET_Playwright_Automation/) — Playwright patterns used in solutions
- [`02_Data_Structures/`](../../02_Data_Structures/) — DSA foundations
- [`24_Advanced_API_Testing/`](../../24_Advanced_API_Testing/) — API testing patterns

---

> **Reading contract**: Every topic starts at zero — no assumed knowledge. By the end of each topic you will know the algorithm, why it appears in SDET work, how to implement it, and have 3 practice challenges to drill.

---

## Table of Contents

1. [Sliding Window → Polling & Wait Strategies](#1-sliding-window--polling--wait-strategies)
2. [HashMap → Response Deduplication in Tests](#2-hashmap--response-deduplication-in-tests)
3. [Topological Sort → Test Execution Ordering](#3-topological-sort--test-execution-ordering)
4. [Binary Search → Bisecting a Flaky Test Commit](#4-binary-search--bisecting-a-flaky-test-commit)
5. [Heap → Test Suite Prioritisation](#5-heap--test-suite-prioritisation)
6. [Exponential Backoff → Retry-Safe API Test Design](#6-exponential-backoff--retry-safe-api-test-design)
7. [Frequency Map → Flaky Test Statistical Detection](#7-frequency-map--flaky-test-statistical-detection)
8. [Segment Tree → Performance Metric Range Queries](#8-segment-tree--performance-metric-range-queries)

---

## 1. Sliding Window → Polling & Wait Strategies

### 🧠 Foundation — What is a Sliding Window?

Imagine you have a long list of numbers: `[1, 3, 2, 6, 4, 5, 8, 7]`. You want to find the maximum sum of any 3 consecutive numbers.

**Brute force**: check every window of 3 by summing them fresh → O(n × k).

**Sliding window**: compute the first window once, then _slide_ it — add the new element coming in, subtract the element going out → O(n).

```
[1, 3, 2] → sum=6
    [3, 2, 6] → sum = 6 - 1 + 6 = 11
        [2, 6, 4] → sum = 11 - 3 + 4 = 12
```

The insight: **you re-use the previous window's result** instead of recomputing from scratch.

---

### 🔍 The Real-World SDET Problem

Your API test creates a citation and then polls for its status to change from `PENDING` to `PROCESSED`. The API is eventually consistent — it may take anywhere from 200ms to 8 seconds.

**Wrong approach**:

```typescript
// ❌ Fixed wait — too short = flaky, too long = slow
await page.waitForTimeout(5000);
const status = await request.get(`/api/citations/${id}/status`);
```

**The sliding window insight applied to polling**: instead of a fixed timeout, use a **variable interval** that checks on an _adaptive_ schedule — checking more frequently early on, then spacing out (because if it hasn't happened in 2 seconds, another 500ms check is unlikely to help).

---

### 🗺️ How to Think About It

```
Step 1: Define the "window"
  → In polling: the window is the remaining time budget (e.g. 10 seconds total)

Step 2: Define the "slide"
  → Each poll attempt consumes part of the window

Step 3: Define the exit condition
  → Condition becomes true OR window is exhausted → fail

Step 4: Define the interval strategy
  → Fixed intervals: [500, 500, 500, ...]    (simple, ok for short waits)
  → Growing intervals: [100, 200, 400, 800]  (exponential — better for long waits)
  → Playwright's built-in: expect.poll() handles this for you
```

---

### ✍️ The Solution

```typescript
// ✅ CORRECT: Sliding window polling with expect.poll
test("Citation status transitions from PENDING to PROCESSED", async ({
  request,
}) => {
  const res = await request.post("/api/citations", { data: { amount: 150 } });
  const { id } = await res.json();

  // expect.poll slides a 10-second window, checking every 500ms
  // It stops the moment the condition is met — no wasted time
  await expect
    .poll(
      async () => {
        const statusRes = await request.get(`/api/citations/${id}/status`);
        return (await statusRes.json()).status;
      },
      {
        message: `Citation ${id} should transition to PROCESSED within 10s`,
        timeout: 10_000,
        intervals: [100, 200, 500, 1000, 2000], // sliding schedule: fast first, then slower
      },
    )
    .toBe("PROCESSED");
});
```

**Why `intervals` matters**: If the first poll at 100ms succeeds (the API was fast today), the test finishes in 100ms. Without intervals, you'd always wait the full timeout. This is the sliding window principle: **adapt the window to the signal**.

---

### 🎯 Similar Challenges

**Challenge A**: Your test needs to wait for a Kafka message to appear in a topic. The message usually arrives in 1-3 seconds but can take up to 15 seconds during peak load. Write a `pollKafkaMessage` utility using the sliding window approach. What intervals would you choose and why?

<details><summary>Answer</summary>

```typescript
async function pollKafkaMessage(
  consumer: KafkaConsumer,
  topic: string,
  matcher: (msg: any) => boolean,
  options = { timeout: 15_000, intervals: [200, 500, 1000, 2000, 5000] },
): Promise<KafkaMessage> {
  return expect
    .poll(
      async () => {
        const messages = await consumer.getMessages(topic, { maxMessages: 50 });
        return messages.find((m) => matcher(JSON.parse(m.value)));
      },
      {
        timeout: options.timeout,
        intervals: options.intervals,
        message: `Expected Kafka message in topic "${topic}" within ${options.timeout}ms`,
      },
    )
    .not.toBeUndefined();
}
```

**Interval reasoning**:

- `200ms`: catches the fast path (message already there or arrives immediately)
- `500ms, 1000ms`: medium latency (Kafka consumer lag)
- `2000ms, 5000ms`: slow path (consumer rebalance, network partition recovery)

The sliding window adapts to the actual system speed — fast tests on good days, reliable tests on bad days.

</details>

---

**Challenge B**: A notification API returns a list of notifications for a user. Your test must confirm that a specific notification appears IN THE LIST within 5 seconds. The list grows over time (new notifications are appended). Write the poll such that you check the list, extract just the IDs, and assert the target ID is present.

<details><summary>Answer</summary>

```typescript
await expect
  .poll(
    async () => {
      const res = await request.get(`/api/notifications?userId=${userId}`);
      const { notifications } = await res.json();
      return notifications.map((n: any) => n.id); // return the array of IDs
    },
    { timeout: 5000, intervals: [200, 500, 1000] },
  )
  .toContain(expectedNotificationId);
// toContain works on arrays — it checks if the returned array includes the expected ID
```

**The sliding window here**: each iteration re-fetches the FULL list (the window = the current state of the list). We slide forward until the condition is met.

</details>

---

**Challenge C**: You need to verify that a database count reaches exactly 10 within 8 seconds (a batch processor is inserting records asynchronously). What happens if `expect.poll` NEVER returns 10 but the value oscillates between 9 and 11 due to concurrent deletes? How do you make the test robust?

<details><summary>Answer</summary>

```typescript
// Naive — breaks if value oscillates past 10 and then drops below:
await expect
  .poll(async () => await db.count("citations"), { timeout: 8000 })
  .toBe(10);

// Robust — poll until count >= 10 (more lenient lower bound):
await expect
  .poll(async () => await db.count("citations"), {
    timeout: 8000,
    message: "Citation count should reach at least 10",
  })
  .toBeGreaterThanOrEqual(10);

// OR: use a "settled" poll — wait until 2 consecutive checks agree:
let previousCount = -1;
await expect
  .poll(
    async () => {
      const count = await db.count("citations");
      if (count === previousCount && count >= 10) return count;
      previousCount = count;
      return -1; // sentinel: tell expect.poll to keep retrying
    },
    { timeout: 8000 },
  )
  .toBeGreaterThanOrEqual(10);
```

**The lesson**: sliding window polling must account for _oscillating_ state. A simple `.toBe(10)` is brittle. Use `toBeGreaterThanOrEqual` for monotonic growth, or the "settled" pattern for volatile data.

</details>

---

## 2. HashMap → Response Deduplication in Tests

### 🧠 Foundation — What is a HashMap?

A HashMap (also called a dictionary or hash table) stores key-value pairs. The superpower: **O(1) lookup** — finding whether a key exists takes the same time whether you have 10 or 10 million entries.

```
Internally:
  hash("CIT-001") → bucket 5 → { key: "CIT-001", value: {...} }
  hash("CIT-002") → bucket 12 → { key: "CIT-002", value: {...} }

Lookup: hash("CIT-001") → go to bucket 5 → found in O(1)
```

**Why not a plain array?** Array lookup is O(n) — you have to check every element. HashMap trades space for speed.

---

### 🔍 The Real-World SDET Problem

Your API test paginates through all citations for a user (3 pages × 50 = 150 citations). You suspect the API sometimes returns the same citation on two different pages (a pagination bug). You need to **detect duplicates** efficiently.

**Brute force**: for every citation, scan the entire already-seen list → O(n²).

**HashMap approach**: store every seen ID in a Set (a HashMap where only keys matter). For each new citation, O(1) check → O(n) total.

---

### 🗺️ How to Think About It

```
Step 1: Identify what makes a record "duplicate"
  → For citations: the ID field. Two objects with the same ID = duplicate.

Step 2: Choose the right data structure
  → If you only need to detect duplicates: Set (values not needed)
  → If you need the first occurrence: Map<id, pageNumber>
  → If you need count of occurrences: Map<id, count>

Step 3: Iterate once (O(n))
  → For each item: check if ID in Set → yes → DUPLICATE found
  →               → no  → add to Set

Step 4: Assert at the end
  → collected.length === Set.size → no duplicates
```

---

### ✍️ The Solution

```typescript
test("Pagination returns no duplicate citations across pages", async ({
  request,
}) => {
  const userId = "USR-001";
  const seenIds = new Set<string>(); // O(1) lookup
  const duplicates: string[] = []; // track which IDs were duplicated
  let cursor: string | null = null;

  do {
    const url =
      `/api/citations?userId=${userId}&limit=50` +
      (cursor ? `&cursor=${cursor}` : "");
    const res = await request.get(url);
    const body = await res.json();

    for (const citation of body.items) {
      if (seenIds.has(citation.id)) {
        duplicates.push(citation.id); // O(1) — HashMap lookup
      } else {
        seenIds.add(citation.id); // O(1) — HashMap insert
      }
    }

    cursor = body.nextCursor ?? null;
  } while (cursor !== null);

  // Assertion with a useful failure message
  expect(
    duplicates,
    `Found duplicate citation IDs across pages: ${duplicates.join(", ")}`,
  ).toHaveLength(0);
});
```

**Complexity**: O(n) time (one pass), O(n) space (the Set grows with unique IDs). Compare to O(n²) brute force which would be 22,500 operations for 150 items.

---

### 🎯 Similar Challenges

**Challenge A**: Your API returns a list of transactions for a user. Each transaction has a `referenceId` that MUST be unique across ALL transactions for that user. Write a test that collects ALL transactions (paginated), checks for duplicate `referenceId` values, and reports WHICH specific IDs are duplicated and HOW MANY TIMES each appears.

<details><summary>Answer</summary>

```typescript
test("Transaction referenceIds are globally unique per user", async ({
  request,
}) => {
  const userId = "USR-AUDIT-001";
  const idCounts = new Map<string, number>(); // referenceId → count
  let cursor: string | null = null;

  do {
    const res = await request.get(
      `/api/transactions?userId=${userId}&limit=100` +
        (cursor ? `&cursor=${cursor}` : ""),
    );
    const body = await res.json();

    for (const tx of body.items) {
      idCounts.set(tx.referenceId, (idCounts.get(tx.referenceId) ?? 0) + 1);
    }
    cursor = body.nextCursor ?? null;
  } while (cursor !== null);

  // Find all referenceIds that appeared more than once
  const duplicates = [...idCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => `${id} (×${count})`);

  expect(
    duplicates,
    `Duplicate referenceIds found: ${duplicates.join(", ")}`,
  ).toHaveLength(0);
});
```

**Why `Map<id, count>` instead of `Set`**: Set only tells you IF a duplicate exists. Map tells you WHICH ones and HOW MANY times — far more useful for bug reporting.

</details>

---

**Challenge B**: You are testing a webhook delivery system. Your test triggers an event and then polls the webhook log endpoint. The same webhook can be delivered to multiple endpoints — so the same event ID SHOULD appear multiple times (once per endpoint). But the SAME event ID to the SAME endpoint should NEVER appear twice. Design the deduplication check.

<details><summary>Answer</summary>

```typescript
// Key: composite key = eventId + endpointId
const seen = new Set<string>();
const duplicates: string[] = [];

for (const delivery of webhookDeliveries) {
  const compositeKey = `${delivery.eventId}::${delivery.endpointId}`;

  if (seen.has(compositeKey)) {
    duplicates.push(compositeKey);
  } else {
    seen.add(compositeKey);
  }
}

expect(duplicates, "Duplicate webhook deliveries detected").toHaveLength(0);
```

**Key insight**: the "identity" of a record is determined by the DOMAIN, not just one field. Composite keys in a Set encode multi-field uniqueness constraints.

</details>

---

**Challenge C**: Your API returns 500 search results across 10 pages. You want to verify that the results are in the correct order (sorted by `relevanceScore` descending). Write an O(n) check — NOT O(n²).

<details><summary>Answer</summary>

```typescript
let previousScore = Infinity; // use Infinity as the starting sentinel (every score is ≤ ∞)
const orderViolations: string[] = [];

for (const result of allResults) {
  if (result.relevanceScore > previousScore) {
    orderViolations.push(
      `${result.id}: score ${result.relevanceScore} > previous ${previousScore} (out of order)`,
    );
  }
  previousScore = result.relevanceScore;
}

expect(
  orderViolations,
  `Sort order violated:\n${orderViolations.join("\n")}`,
).toHaveLength(0);
```

**O(n) trick**: you don't need to compare every pair (O(n²)). A single pass tracking the "previous" value is sufficient to detect any out-of-order element — because if the sequence IS sorted, every element is ≤ its predecessor.

</details>

---

## 3. Topological Sort → Test Execution Ordering

### 🧠 Foundation — What is Topological Sort?

Imagine you're getting dressed. You must put on socks BEFORE shoes. Underwear BEFORE trousers. But socks and underwear can be put on in any order — neither depends on the other.

Topological sort takes a set of tasks with dependencies and produces a valid order to execute them — where every dependency is satisfied before the task that needs it.

```
Tasks and dependencies:
  CreateUser → must happen before CreateCitation
  CreateCitation → must happen before ProcessPayment
  CreateAddress → must happen before CreateUser (user needs an address)

Topological order:
  CreateAddress → CreateUser → CreateCitation → ProcessPayment
```

**Cycle detection**: if task A depends on B AND B depends on A → impossible (circular dependency → DEAD).

---

### 🔍 The Real-World SDET Problem

You have 15 API tests. Some tests depend on data created by other tests:

- `test_create_citation` must run before `test_pay_citation`
- `test_create_user` must run before `test_create_citation`
- `test_generate_report` must run after both `test_pay_citation` AND `test_apply_discount`

If tests run in the wrong order, they fail not because the feature is broken but because the required data doesn't exist. **These are ORDER-dependent test failures** — the most confusing kind.

---

### 🗺️ How to Think About It

```
Step 1: Model the problem as a directed graph
  → Node = test
  → Edge A → B = "A must run before B" (B depends on A)

Step 2: Check for cycles
  → Cycle = impossible dependency chain → fix the test design
  → Use DFS with 3 states: UNVISITED, IN_PROGRESS, DONE

Step 3: Run topological sort (Kahn's algorithm)
  → Find all nodes with in-degree 0 (no dependencies) → start queue
  → Process queue: add to result, reduce neighbors' in-degrees
  → If neighbor's in-degree hits 0 → add to queue
  → If result length < total nodes → cycle exists

Step 4: Execute tests in topological order
```

---

### ✍️ The Solution

```typescript
// Test dependency graph builder + topological executor
type TestId = string;
interface TestDependency {
  id: TestId;
  dependencies: TestId[];
  execute: () => Promise<void>;
}

function topologicalSort(tests: TestDependency[]): TestId[] {
  const graph = new Map<TestId, Set<TestId>>();
  const inDegree = new Map<TestId, number>();

  // Initialize
  for (const test of tests) {
    if (!graph.has(test.id)) graph.set(test.id, new Set());
    if (!inDegree.has(test.id)) inDegree.set(test.id, 0);
  }

  // Build adjacency list and in-degree count
  for (const test of tests) {
    for (const dep of test.dependencies) {
      graph.get(dep)!.add(test.id); // dep → test
      inDegree.set(test.id, (inDegree.get(test.id) ?? 0) + 1);
    }
  }

  // Kahn's algorithm
  const queue: TestId[] = [...inDegree.entries()]
    .filter(([, deg]) => deg === 0)
    .map(([id]) => id);
  const result: TestId[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of graph.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (result.length !== tests.length) {
    throw new Error("CIRCULAR DEPENDENCY detected in test graph!");
  }

  return result;
}

// Usage in a test suite
const tests: TestDependency[] = [
  {
    id: "create_user",
    dependencies: [],
    execute: async () => {
      /* POST /users */
    },
  },
  {
    id: "create_citation",
    dependencies: ["create_user"],
    execute: async () => {
      /* POST /citations */
    },
  },
  {
    id: "pay_citation",
    dependencies: ["create_citation"],
    execute: async () => {
      /* POST /payments */
    },
  },
  {
    id: "gen_report",
    dependencies: ["pay_citation"],
    execute: async () => {
      /* GET /reports */
    },
  },
];

const order = topologicalSort(tests);
const testMap = new Map(tests.map((t) => [t.id, t]));

for (const testId of order) {
  await testMap.get(testId)!.execute();
}
```

**Why this matters in real SDET work**: Playwright's `test.describe` and `test.beforeEach` solve simple sequential dependencies. But for complex multi-step API test suites where tests share state via an accumulator object, topological sort ensures correctness even when test files are run in different orders across CI jobs.

---

### 🎯 Similar Challenges

**Challenge A**: You have these tests with dependencies. Find a valid execution order OR detect if it's impossible:

```
test_A depends on: test_C
test_B depends on: test_A, test_D
test_C depends on: (nothing)
test_D depends on: test_C
test_E depends on: test_B
```

<details><summary>Answer</summary>

```
Build the graph:
  C → A  (A depends on C)
  A → B  (B depends on A)
  C → D  (D depends on C)
  D → B  (B depends on D)
  B → E  (E depends on B)

In-degrees:
  A: 1 (depends on C)
  B: 2 (depends on A and D)
  C: 0 (no dependencies)
  D: 1 (depends on C)
  E: 1 (depends on B)

Kahn's:
  Queue: [C]
  Process C → result=[C], reduce A to 0, reduce D to 0
  Queue: [A, D]
  Process A → result=[C, A], reduce B to 1
  Process D → result=[C, A, D], reduce B to 0
  Queue: [B]
  Process B → result=[C, A, D, B], reduce E to 0
  Queue: [E]
  Process E → result=[C, A, D, B, E]

Valid order: C → A → D → B → E (or C → D → A → B → E — both are valid)
```

</details>

---

**Challenge B**: Add test_F that depends on test_E, and test_C that also depends on test_F. Is a valid order still possible? What has changed?

<details><summary>Answer</summary>

```
Original: test_C has no dependencies.
New rule: test_C depends on test_F.
test_F depends on test_E.
test_E depends on test_B.
test_B depends on test_C (directly or transitively via A/D).
test_C depends on test_F → ... → test_C.

This creates a CYCLE:
  C → A → B → E → F → C  (circular!)

Detection: after running Kahn's algorithm, result.length < total nodes (C, A, B, D, E, F = 6 nodes but result has fewer because cyclic nodes are never added to the queue).

Fix: either remove the C→F dependency (test_C must not depend on test_F if test_F transitively needs test_C), or restructure — extract the shared setup into a fixture that both C and F use.
```

</details>

---

## 4. Binary Search → Bisecting a Flaky Test Commit

### 🧠 Foundation — What is Binary Search?

You have a sorted list of 1,000,000 numbers. You want to find if 42 is in it. Brute force: check every number → up to 1,000,000 checks. Binary search: check the middle, eliminate half the list, repeat → at most **20 checks** (log₂(1,000,000) ≈ 20).

```
List: [1, 5, 12, 28, 42, 67, 89, 100]
Looking for: 42

Step 1: middle = 28. 42 > 28 → search RIGHT half
Step 2: middle = 67. 42 < 67 → search LEFT half
Step 3: middle = 42. FOUND! ✓

3 steps instead of 8.
```

**The invariant**: at every step, the answer (if it exists) is within the current search space `[left, right]`. You never skip the answer because you only eliminate halves where the answer CANNOT be.

---

### 🔍 The Real-World SDET Problem

A test that was passing 3 weeks ago is now flaky. Your git log has 200 commits between "last known good" and "current broken". You need to find WHICH commit introduced the flakiness.

This is `git bisect` — and it is binary search applied to a commit history.

```
200 commits to check:
  Linear scan: up to 200 test runs
  Binary search: ceil(log₂(200)) = 8 test runs!
```

---

### 🗺️ How to Think About It

```
Step 1: Define "good" and "bad"
  → good = last commit where the test passed reliably
  → bad  = current commit where the test is flaky/failing

Step 2: Binary search the commit range
  → Pick the middle commit
  → Run the flaky test N times (e.g. 5 runs — flaky tests need multiple runs to detect)
  → If all 5 pass → mark GOOD (bisect right)
  → If any fail → mark BAD (bisect left)

Step 3: Automate the bisect
  → git bisect run <script> — runs your test script automatically

Step 4: When bisect converges to 1 commit — that's your culprit
```

---

### ✍️ The Solution

```bash
# Start bisect
git bisect start
git bisect bad HEAD                          # current = broken
git bisect good v1.2.0                       # known good tag

# Write a bisect test script (run_flaky_test.sh):
```

```bash
#!/bin/bash
# run_flaky_test.sh — binary search oracle for git bisect

PASS_COUNT=0
FAIL_COUNT=0

for i in {1..5}; do
  npx playwright test tests/api/citation_payment.spec.ts --reporter=list
  if [ $? -eq 0 ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# If ANY run failed, this commit is "bad"
if [ $FAIL_COUNT -gt 0 ]; then
  echo "FLAKY: $FAIL_COUNT/5 runs failed"
  exit 1   # exit 1 = bad commit
else
  echo "STABLE: 5/5 runs passed"
  exit 0   # exit 0 = good commit
fi
```

```bash
# Run automated bisect:
git bisect run ./run_flaky_test.sh
# Git will binary search 200 commits with only ~8 test runs!
# Output: "abc1234 is the first bad commit"
```

**TypeScript equivalent — bisect a list of test results**:

```typescript
// Given: array of {commitSha, passRate} where passRate drops from 1.0 to <0.8 at some point
// Find: the FIRST commit where passRate < 0.8

function findFirstBrokenCommit(
  history: { sha: string; passRate: number }[],
): string | null {
  let left = 0;
  let right = history.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (history[mid].passRate >= 0.8) {
      left = mid + 1; // mid is still "good" → broken is to the RIGHT
    } else {
      right = mid; // mid is "bad" → broken is here or to the LEFT
    }
  }

  return history[left].passRate < 0.8 ? history[left].sha : null;
}
```

---

### 🎯 Similar Challenges

**Challenge A**: You have a sorted array of response times in milliseconds from an API: `[45, 78, 102, 134, 156, 189, 210, 245, 312, 401]`. Write a binary search that finds the FIRST response time exceeding a P95 threshold of 200ms. What is the index?

<details><summary>Answer</summary>

```typescript
function findFirstExceeding(times: number[], threshold: number): number {
  let left = 0;
  let right = times.length; // right is EXCLUSIVE (one past the end)

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (times[mid] <= threshold) {
      left = mid + 1; // mid is acceptable → look right
    } else {
      right = mid; // mid exceeds threshold → answer is here or left
    }
  }

  return left; // left === right at convergence = first index exceeding threshold
}

const times = [45, 78, 102, 134, 156, 189, 210, 245, 312, 401];
const idx = findFirstExceeding(times, 200);
// → idx = 6, times[6] = 210 (first value > 200)
// This means 60% of calls are within threshold (6/10), 40% are not.
```

**SDET application**: use this to find the EXACT PERCENTILE at which your SLA breaks — binary search is far faster than scanning from left for large datasets.

</details>

---

**Challenge B**: Your CI pipeline runs 300 tests. Tests 0-299. You know that tests 0-183 passed yesterday. Today some tests in the range 184-299 are failing. You have a "test runner" function `runTest(i)` that returns `true` if test i passes and `false` if it fails. The failures are CONTIGUOUS — once a test starts failing, all higher-numbered tests also fail (they share a broken dependency). Binary-search to find the FIRST failing test index.

<details><summary>Answer</summary>

```typescript
async function findFirstFailingTest(
  runTest: (index: number) => Promise<boolean>,
  low: number,
  high: number,
): Promise<number> {
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const passed = await runTest(mid);

    if (passed) {
      low = mid + 1; // mid passed → first failure is to the RIGHT
    } else {
      high = mid; // mid failed → first failure is here or to the LEFT
    }
  }

  return low; // first failing index
}

const firstFailing = await findFirstFailingTest(runTest, 184, 299);
// log₂(116) ≈ 7 test runs instead of 116!
```

</details>

---

## 5. Heap → Test Suite Prioritisation

### 🧠 Foundation — What is a Heap?

A heap is a tree-based structure with one rule: **the parent is always ≥ (max-heap) or ≤ (min-heap) its children**.

```
Max-heap example:
         100
        /    \
      80      90
     / \     / \
    70  60  85  50

Operations:
  peek (get max): O(1) — just look at the root
  insert: O(log n) — add at bottom, bubble up
  extractMax: O(log n) — remove root, replace with last element, bubble down
```

A min-heap is the same but the smallest element is always at the root.

**Use cases**: priority queue — always process the highest-priority item next.

---

### 🔍 The Real-World SDET Problem

You have 500 API tests. A deploy is happening in 30 minutes and you only have time to run the 50 most critical ones. Tests have:

- `priority` (1-5, where 5 = payment-critical)
- `lastFailureRate` (0.0-1.0 — how often this test has failed historically)
- `estimatedDuration` (seconds)

You want a priority queue that surfaces the most critical tests first. Score formula:

```
score = priority × 10 + lastFailureRate × 5 - estimatedDuration × 0.1
```

---

### 🗺️ How to Think About It

```
Step 1: Define the priority score function
  → Higher score = should run sooner

Step 2: Build a max-heap of (score, test)
  → Heap automatically keeps the highest-score test at the root
  → extractMax gives you the next test to run → O(log n)

Step 3: Extract top-N tests
  → Call extractMax N times → O(N log M) where M = total tests

Alternative (simpler for fixed N):
  Sort descending by score → O(M log M), then take first N
  Heap is better only if M is huge (millions) and N is small
```

---

### ✍️ The Solution

```typescript
interface TestCase {
  id: string;
  priority: number; // 1-5
  lastFailureRate: number; // 0.0-1.0
  estimatedDuration: number; // seconds
}

function scoreTest(test: TestCase): number {
  return (
    test.priority * 10 + test.lastFailureRate * 5 - test.estimatedDuration * 0.1
  );
}

// Simple max-heap using a sorted approach (fine for ≤ 10K tests)
function getTopN(tests: TestCase[], n: number): TestCase[] {
  return [...tests]
    .sort((a, b) => scoreTest(b) - scoreTest(a)) // descending by score
    .slice(0, n);
}

// Full min-heap for production (for millions of tests):
class MaxHeap<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  push(item: T): void {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.heap[i], this.heap[parent]) > 0) {
        [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
        i = parent;
      } else break;
    }
  }

  private _sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const left = 2 * i + 1,
        right = 2 * i + 2;
      if (left < n && this.compare(this.heap[left], this.heap[largest]) > 0)
        largest = left;
      if (right < n && this.compare(this.heap[right], this.heap[largest]) > 0)
        largest = right;
      if (largest === i) break;
      [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
      i = largest;
    }
  }
}

// Usage
const heap = new MaxHeap<TestCase>((a, b) => scoreTest(a) - scoreTest(b));
for (const test of allTests) heap.push(test);

const top50: TestCase[] = [];
for (let i = 0; i < 50; i++) {
  const next = heap.pop();
  if (next) top50.push(next);
}
```

---

### 🎯 Similar Challenges

**Challenge A**: You have a flaky test detector running overnight. It collects `(testId, failCount, totalRuns)` pairs. Write a function that returns the top 10 flakiest tests using a min-heap of size 10 (keeping memory O(10) instead of O(n) — useful when n is millions of test results).

<details><summary>Answer</summary>

```typescript
// Min-heap of size K — after processing all tests, the heap contains the top-K
// This is the "K largest elements" pattern — classic heap usage

interface FlakyResult {
  testId: string;
  flakiness: number; // failCount / totalRuns
}

function topKFlakiest(results: FlakyResult[], k: number): FlakyResult[] {
  // Use JavaScript's built-in sort for simplicity (replace with actual min-heap for massive datasets)
  return [...results].sort((a, b) => b.flakiness - a.flakiness).slice(0, k);
}

// With true min-heap (O(n log k) instead of O(n log n)):
// - Push first k elements into a MIN-heap
// - For each subsequent element: if it's LARGER than heap root → pop root, push new element
// - At the end: heap contains the K largest elements
// This is O(n log k) time, O(k) space — optimal when k << n
```

</details>

---

## 6. Exponential Backoff → Retry-Safe API Test Design

### 🧠 Foundation — What is Exponential Backoff?

When a network request fails, when do you retry? Three options:

1. **Immediate retry**: hammer the server → makes overload worse
2. **Fixed delay** (e.g. every 1s): predictable but can create synchronized retry storms (1000 clients all retry at the same second)
3. **Exponential backoff with jitter**: wait 1s, then 2s, then 4s, then 8s + random jitter → retries spread out over time → gentle on the server

```
Attempt 1 fails → wait 2⁰ × base = 1s + random(0, 0.5s)
Attempt 2 fails → wait 2¹ × base = 2s + random(0, 0.5s)
Attempt 3 fails → wait 2² × base = 4s + random(0, 0.5s)
Attempt 4 fails → wait 2³ × base = 8s + random(0, 0.5s)
Max attempts reached → fail with last error
```

The geometric series `1 + 2 + 4 + 8 = 15s` total wait for 4 retries.

---

### 🔍 The Real-World SDET Problem

Your SDET suite calls a real external API (Dynamics 365, Salesforce) that occasionally returns 429 (rate-limited) or 503 (overloaded). Your test should not FAIL on transient errors — it should retry intelligently.

But naive retry in tests is also dangerous: if you retry 5 times with 5s delay each, a truly broken API causes your test to take 30 seconds before failing. You need a **capped** backoff.

---

### ✍️ The Solution

```typescript
// Generic retry wrapper with exponential backoff + jitter
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    retryOn?: (error: any) => boolean;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 10_000,
    retryOn = (e) => e?.status === 429 || e?.status === 503,
  } = options;

  let lastError: any;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (!retryOn(error) || attempt === maxAttempts - 1) throw error;

      // Exponential backoff: 2^attempt * baseDelay + jitter
      const exponential = Math.min(
        Math.pow(2, attempt) * baseDelayMs,
        maxDelayMs,
      );
      const jitter = Math.random() * (baseDelayMs / 2); // ±25% jitter
      const delay = Math.floor(exponential + jitter);

      console.warn(
        `Attempt ${attempt + 1} failed (${error.status}). Retrying in ${delay}ms...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

// Usage in a Playwright test:
test("Fetch citation with retry on transient failures", async ({ request }) => {
  const citation = await withRetry(
    async () => {
      const res = await request.get("/api/citations/CIT-001");
      if (!res.ok())
        throw Object.assign(new Error("API error"), { status: res.status() });
      return res.json();
    },
    {
      maxAttempts: 4,
      baseDelayMs: 500,
      retryOn: (e) => [429, 503].includes(e.status),
    },
  );

  expect(citation.id).toBe("CIT-001");
});
```

---

### 🎯 Similar Challenges

**Challenge A**: Implement a version of `withRetry` that also respects the `Retry-After` header from 429 responses — if the server tells you to wait 5 seconds, your retry should wait exactly that (ignoring exponential backoff for that specific case).

<details><summary>Answer</summary>

```typescript
async function withSmartRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxAttempts - 1) throw error;

      // Respect Retry-After header if present
      const retryAfterSec = error.headers?.["retry-after"];
      const delay = retryAfterSec
        ? parseInt(retryAfterSec, 10) * 1000 // server told us exactly
        : Math.min(Math.pow(2, attempt) * 500, 8000); // exponential backoff

      console.warn(
        `Attempt ${attempt + 1} failed. Waiting ${delay}ms (${retryAfterSec ? "server-specified" : "exponential"})`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

</details>

---

## 7. Frequency Map → Flaky Test Statistical Detection

### 🧠 Foundation — What is a Frequency Map?

A frequency map counts how many times each value appears in a dataset.

```
Input: ["PASS", "FAIL", "PASS", "PASS", "FAIL", "PASS", "FAIL"]
Frequency Map: { "PASS": 4, "FAIL": 3 }
Pass rate: 4/7 = 57%
```

Frequency maps answer: "How often does X occur in this data?" — the foundation of all statistical analysis.

---

### 🔍 The Real-World SDET Problem

Your CI runs each test 10 times per week. A test is considered "flaky" if its pass rate is between 20% and 80% (it sometimes passes, sometimes fails — not consistently broken, not consistently passing). You need to analyze a week's CI run data and produce a flakiness report.

---

### ✍️ The Solution

```typescript
interface CIRunResult {
  testId: string;
  runDate: string;
  result: "PASS" | "FAIL" | "SKIP";
}

interface FlakinessReport {
  testId: string;
  totalRuns: number;
  passRate: number;
  status: "STABLE" | "FLAKY" | "BROKEN" | "SKIPPED";
}

function analyzeFlakiness(
  results: CIRunResult[],
  flakyThreshold = { low: 0.2, high: 0.8 },
): FlakinessReport[] {
  // Step 1: Build frequency map per test
  const testResults = new Map<
    string,
    { pass: number; fail: number; skip: number }
  >();

  for (const run of results) {
    if (!testResults.has(run.testId)) {
      testResults.set(run.testId, { pass: 0, fail: 0, skip: 0 });
    }
    const counts = testResults.get(run.testId)!;
    counts[run.result.toLowerCase() as "pass" | "fail" | "skip"]++;
  }

  // Step 2: Compute pass rate and classify
  return [...testResults.entries()]
    .map(([testId, counts]) => {
      const total = counts.pass + counts.fail + counts.skip;
      const passRate =
        total > 0 ? counts.pass / (counts.pass + counts.fail) : 1;

      let status: FlakinessReport["status"];
      if (counts.skip === total) status = "SKIPPED";
      else if (passRate > flakyThreshold.high) status = "STABLE";
      else if (passRate < flakyThreshold.low) status = "BROKEN";
      else status = "FLAKY";

      return {
        testId,
        totalRuns: total,
        passRate: Math.round(passRate * 100) / 100,
        status,
      };
    })
    .sort((a, b) => a.passRate - b.passRate); // worst first
}

// Report output:
const report = analyzeFlakiness(weeklyResults);
const flaky = report.filter((r) => r.status === "FLAKY");
const broken = report.filter((r) => r.status === "BROKEN");

console.table(
  flaky.map((r) => ({ ...r, passRate: `${(r.passRate * 100).toFixed(0)}%` })),
);
```

---

### 🎯 Similar Challenges

**Challenge A**: Extend the flakiness detector to also compute **the day of the week with the highest failure rate** (maybe tests fail more on Mondays because weekend deployments broke something). Group the data by day and find the worst day.

<details><summary>Answer</summary>

```typescript
function worstDayOfWeek(results: CIRunResult[]): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayCounts = new Map<number, { pass: number; fail: number }>();

  for (const run of results) {
    const day = new Date(run.runDate).getDay(); // 0=Sun, 6=Sat
    if (!dayCounts.has(day)) dayCounts.set(day, { pass: 0, fail: 0 });
    const counts = dayCounts.get(day)!;
    if (run.result === "PASS") counts.pass++;
    else if (run.result === "FAIL") counts.fail++;
  }

  let worstDay = -1;
  let worstRate = 0;
  for (const [day, { pass, fail }] of dayCounts) {
    const failRate = fail / (pass + fail);
    if (failRate > worstRate) {
      worstRate = failRate;
      worstDay = day;
    }
  }

  return worstDay >= 0
    ? `${days[worstDay]} (${(worstRate * 100).toFixed(1)}% failure rate)`
    : "No data";
}
```

**Real insight**: Monday failures after weekend deploys, Friday failures after code freeze rushes — frequency maps across time dimensions reveal systemic patterns invisible to individual test views.

</details>

---

## 8. Segment Tree → Performance Metric Range Queries

### 🧠 Foundation — What is a Segment Tree?

A Segment Tree is a binary tree where:

- Each **leaf** holds a single value (e.g. one API response time measurement)
- Each **internal node** holds the result of combining its children (e.g. the `min`, `max`, or `sum` of a range)

```
Array:  [45, 89, 12, 67, 34, 156, 23, 78]
Index:   0   1   2   3   4    5   6   7

Segment tree for RANGE MINIMUM:

                   [0..7] min=12
                  /              \
          [0..3] min=12      [4..7] min=23
          /       \           /       \
      [0..1]   [2..3]     [4..5]   [6..7]
      min=45   min=12     min=34   min=23
      /   \    /   \      /   \    /   \
    [45] [89] [12] [67] [34] [156] [23] [78]
```

**Why this matters**:

- Brute force range min/max query: O(n) — scan every element in range
- Segment tree range query: O(log n) — traverse only the relevant nodes
- When you run 10,000 performance metric queries per minute, O(log n) vs O(n) is the difference between 14 operations and 10,000

---

### 🔍 The Real-World SDET Problem

Your performance test captures API response times every 100ms for 10 minutes → **6,000 data points**. Your assertions need:

1. What was the **maximum** response time between minute 3 and minute 7?
2. How many data points in that range **exceeded 200ms** (the SLA threshold)?
3. After each new data point arrives, update the tree and re-query in real time

Brute force: 6,000 scans per query × many assertions = too slow to run inline.
Segment tree: build once in O(n log n), query any range in O(log n).

---

### 🗺️ How to Think About It

```
Step 1: Identify your "combination" operation
  → Range MAX: the maximum value in any range (SLA breach detection)
  → Range SUM: total of values in range (error count)
  → Range MIN: minimum (best-case response time)
  → Can combine multiple: each node stores {min, max, sum, count}

Step 2: Build — O(n log n)
  → Start at leaves (individual data points)
  → Each parent = combine(left child, right child)

Step 3: Query a range [l, r] — O(log n)
  → If node range is fully inside [l,r]: return node's stored value
  → If node range is fully outside [l,r]: return identity (∞ for min, -∞ for max, 0 for sum)
  → If partial overlap: recurse into both children, combine results

Step 4: Update a single value — O(log n)
  → Update the leaf
  → Propagate change upward to root (O(log n) nodes updated)
```

---

### ✍️ The Solution

```typescript
// Segment tree storing {min, max, sum, count} per range
// Perfect for performance test assertions

interface RangeStats {
  min: number;
  max: number;
  sum: number;
  count: number;
}

class PerformanceSegmentTree {
  private readonly n: number;
  private readonly tree: RangeStats[];

  constructor(data: number[]) {
    this.n = data.length;
    // Tree size: 4 * n is always sufficient (safe upper bound)
    this.tree = new Array(4 * this.n).fill(null).map(() => ({
      min: Infinity,
      max: -Infinity,
      sum: 0,
      count: 0,
    }));
    this.build(data, 1, 0, this.n - 1);
    // node index 1 = root (1-indexed for clean parent/child math: children of i = 2i, 2i+1)
  }

  private combine(a: RangeStats, b: RangeStats): RangeStats {
    return {
      min: Math.min(a.min, b.min),
      max: Math.max(a.max, b.max),
      sum: a.sum + b.sum,
      count: a.count + b.count,
    };
  }

  private build(
    data: number[],
    node: number,
    start: number,
    end: number,
  ): void {
    if (start === end) {
      // Leaf node: single data point
      this.tree[node] = {
        min: data[start],
        max: data[start],
        sum: data[start],
        count: 1,
      };
      return;
    }
    const mid = Math.floor((start + end) / 2);
    this.build(data, 2 * node, start, mid); // build left child
    this.build(data, 2 * node + 1, mid + 1, end); // build right child
    this.tree[node] = this.combine(
      this.tree[2 * node],
      this.tree[2 * node + 1],
    );
    // ↑ Each parent = combination of its children
  }

  // Query range [l, r] for combined stats
  query(l: number, r: number): RangeStats {
    return this._query(1, 0, this.n - 1, l, r);
  }

  private _query(
    node: number,
    start: number,
    end: number,
    l: number,
    r: number,
  ): RangeStats {
    if (r < start || end < l) {
      // Completely outside query range — return identity values
      return { min: Infinity, max: -Infinity, sum: 0, count: 0 };
    }
    if (l <= start && end <= r) {
      // Completely inside query range — return stored value directly
      return this.tree[node];
    }
    // Partial overlap — recurse into both halves
    const mid = Math.floor((start + end) / 2);
    const leftResult = this._query(2 * node, start, mid, l, r);
    const rightResult = this._query(2 * node + 1, mid + 1, end, l, r);
    return this.combine(leftResult, rightResult);
  }

  // Update a single data point (e.g. new measurement arrives)
  update(index: number, newValue: number): void {
    this._update(1, 0, this.n - 1, index, newValue);
  }

  private _update(
    node: number,
    start: number,
    end: number,
    index: number,
    value: number,
  ): void {
    if (start === end) {
      // Found the leaf — update it
      this.tree[node] = { min: value, max: value, sum: value, count: 1 };
      return;
    }
    const mid = Math.floor((start + end) / 2);
    if (index <= mid) this._update(2 * node, start, mid, index, value);
    else this._update(2 * node + 1, mid + 1, end, index, value);
    // After updating the leaf, recompute this node from children
    this.tree[node] = this.combine(
      this.tree[2 * node],
      this.tree[2 * node + 1],
    );
  }
}

// ── Usage in a performance test ──────────────────────────────────────────────

test("API response times stay within SLA across all load phases", async ({
  request,
}) => {
  const responseTimes: number[] = [];

  // Collect 6,000 measurements (100ms intervals × 10 minutes)
  for (let i = 0; i < 6000; i++) {
    const start = Date.now();
    await request.get("/api/citations");
    responseTimes.push(Date.now() - start);
    await new Promise((r) => setTimeout(r, 100));
  }

  // Build segment tree once: O(n log n)
  const tree = new PerformanceSegmentTree(responseTimes);

  // Minute 0-2: warmup phase [indices 0-1799]
  const warmup = tree.query(0, 1799);
  expect(warmup.max).toBeLessThan(500);
  // "During warmup, worst response was under 500ms"

  // Minute 3-7: peak load phase [indices 1800-4199]
  const peak = tree.query(1800, 4199);
  expect(peak.max).toBeLessThan(300); // stricter SLA during peak
  expect(peak.sum / peak.count).toBeLessThan(150); // avg < 150ms
  // O(log 6000) ≈ 13 operations — not 2,400 scans!

  // Minute 8-10: cooldown phase [indices 4200-5999]
  const cooldown = tree.query(4200, 5999);
  expect(cooldown.max).toBeLessThan(200);
  // Cooldown should recover to healthy baselines

  // Count SLA breaches across entire run
  // Note: for count-of-threshold-exceeding, a different structure is needed
  // (segment tree stores max, not count-above-threshold)
  // Use a filter for this specific query:
  const slaBreaches = responseTimes
    .slice(1800, 4200)
    .filter((t) => t > 300).length;
  const slaBreachRate = slaBreaches / 2400;
  expect(slaBreachRate, "SLA breach rate during peak").toBeLessThan(0.01); // < 1%
});
```

**Complexity breakdown**:

- Build tree: O(n log n) — done ONCE
- Each range query (max, min, sum, count): O(log n)
- Each point update: O(log n)
- Compare to brute force per query: O(n)

For 6,000 data points and 20 assertions: segment tree = 20 × 13 = 260 operations. Brute force = 20 × 6,000 = 120,000 operations.

---

### 🎯 Similar Challenges

**Challenge A**: Your load test captures 10,000 HTTP response codes (200, 404, 500, 503) sequentially. You need to find: in any given 1-minute window (600 data points), what was the maximum consecutive sequence of 5xx errors? A segment tree alone can't answer this directly — which data structure would you ADD to help, and why?

<details><summary>Answer — Point by Point</summary>

```typescript
// What you need: "maximum consecutive sequence of 5xx errors in range [l, r]"
// This is NOT a simple range max — it requires knowing:
//   1. Prefix 5xx length (consecutive 5xx from the left edge of the node)
//   2. Suffix 5xx length (consecutive 5xx at the right edge of the node)
//   3. Max internal 5xx sequence (the answer for that node's full range)

// Each segment tree node stores:
interface ConsecutiveStats {
  total: number; // total elements in this segment
  prefixOnes: number; // consecutive 5xx from LEFT edge
  suffixOnes: number; // consecutive 5xx from RIGHT edge
  maxOnes: number; // maximum consecutive 5xx sequence in this range
  allOnes: boolean; // true if ENTIRE range is 5xx (needed for merging)
}

function combine5xx(
  left: ConsecutiveStats,
  right: ConsecutiveStats,
): ConsecutiveStats {
  // The max consecutive could span the boundary:
  // left-suffix + right-prefix = cross-boundary streak
  const crossBoundary = left.suffixOnes + right.prefixOnes;

  return {
    total: left.total + right.total,
    prefixOnes: left.allOnes ? left.total + right.prefixOnes : left.prefixOnes,
    // ↑ If left is ALL 5xx, prefix extends into right
    suffixOnes: right.allOnes
      ? right.total + left.suffixOnes
      : right.suffixOnes,
    maxOnes: Math.max(left.maxOnes, right.maxOnes, crossBoundary),
    // ↑ The answer is the max of: left's internal max, right's internal max,
    //   OR the streak that crosses the boundary
    allOnes: left.allOnes && right.allOnes,
  };
}
```

**Why this matters**: standard range-max segment trees store a scalar. For "maximum consecutive sequence" you need a COMPOSITE value per node. The key insight is that you can ALWAYS design a segment tree by defining what `combine(left, right)` does — the tree structure is the same; what changes is the information stored.

This exact pattern appears in: maximum subarray problems, longest consecutive sequence problems, and run-length encoding queries — all solved with the same "prefix/suffix/max-internal/all-one" composite node.

</details>

---

**Challenge B**: You collect 1,000 API response times. You need to query: "how many data points in range [l, r] are below the P50 threshold?" P50 is dynamic — it changes as you collect more data. Design the approach. (Hint: a Merge Sort Tree or Persistent Segment Tree can answer count-of-values-below-threshold in O(log² n), but explain the simpler O(n) fallback first and when the complex structure is worth it.)

<details><summary>Answer — Point by Point</summary>

```typescript
// Simple approach: O(n) per query — acceptable for ≤ 20 queries on 1,000 points
function countBelowThreshold(
  data: number[],
  l: number,
  r: number,
  threshold: number,
): number {
  return data.slice(l, r + 1).filter((v) => v < threshold).length;
  // O(r - l + 1) per query — fine for small datasets or infrequent queries
}

// When is this NOT enough?
// - 1,000,000 data points AND thousands of threshold queries per second
// - THEN you need a Merge Sort Tree:
//   Each segment tree node stores its elements SORTED
//   Binary search within the node gives count-below in O(log n)
//   Total: O(log² n) per query instead of O(n)
//   Build cost: O(n log n) space and time

// For interview purposes, articulate the trade-off:
console.log(`
  Simple O(n) per query:
    Pro: trivially simple to implement and test
    Con: 1,000 queries × 1,000,000 data points = 10^9 operations → 10+ seconds

  Merge Sort Tree O(log² n) per query:
    Pro: handles millions of queries efficiently
    Con: complex to implement, O(n log n) space

  Practical SDET choice: O(n) for performance assertions (≤ 100 queries)
                         Pre-compute percentiles for dynamic P50 (O(n log n) once)
`);

// The percentile pre-computation approach for dynamic P50:
const sorted = [...data].sort((a, b) => a - b);
const p50 = sorted[Math.floor(sorted.length * 0.5)];
// Now p50 is computed — use O(n) query or binary search on sorted array
const countBelowP50 = sorted.filter((v) => v < p50).length; // ≈ 50% by definition
```

**The interview answer**: for most SDET use cases (≤ 10,000 data points, ≤ 100 queries), O(n) per query is fine. For high-frequency streaming metrics at scale, a merge sort tree or a pre-sorted structure with binary search delivers O(log n) to O(log² n). Always state WHEN the complexity difference matters — interviewers reward pragmatic reasoning.

</details>

---

**Navigation**: [← Elite Cross-Domain Rounds](10_Elite_Cross_Domain_Rounds.md) | [📚 Index](../00_INDEX.md) | [SpringBoot × DSA →](12_SpringBoot_Plus_DSA_Progressive.md)


---

## Reality Check

**"SDET interviews don't need real DSA"** — SDET-to-SDE and senior-SDET rounds test DSA applied to TEST INFRASTRUCTURE ([21_SDET Ch33, Ch34]): the flaky-test clustering (a grouping/graph problem), the optimal shard assignment (a partitioning/greedy problem — [21_SDET Ch62]), the test-prioritization by failure rate (sorting/scheduling), the retry-backoff (the curve). "SDET does not need DSA" is the outdated view — the modern SDET builds test platforms ([21_SDET Ch62]) whose problems ARE algorithmic, and these rounds drill the DSA that appears in real test-infrastructure work.

**"The DSA in SDET rounds is watered down"** — It is REAL DSA in a testing context, and the context is the added difficulty ([21_SDET Ch34]): recognizing the test problem IS a known algorithm (the [05_LeetCode-real-world-map] reverse-translation — this shard-assignment is bin-packing, this flake-detection is a statistical/graph problem), then applying it. The context makes it harder, not easier — you must translate the testing problem into the algorithmic form, which is a skill the pure-algorithm problem does not exercise.

**"SDET DSA is about testing the algorithms"** — It is about USING algorithms to build test infrastructure AND about testing-specific reasoning ([21_SDET Ch34, Ch26]): the analytics over test results (the [21_SDET Ch62] flake metrics — the data structures and aggregations), the diff-based test selection (the dependency graph — [21_SDET Ch48]), the deduplication of failures. The dual angle (algorithms to build test tooling, plus the testing domain's specific problems like flakiness and coverage) is what these rounds integrate — not merely testing that sort works.

**"SDET-to-SDE transition just needs coding practice"** — The transition needs the CS-thinking and system-design that SDET work under-exercises ([21_SDET Ch33, Ch35]): the SDET strong at testing and framework design who needs the DSA fundamentals, the system-design thinking, the OOP-patterns depth for the SDE bar. These progressive rounds bridge exactly that gap (the SDET's testing strength plus the DSA/design the SDE role adds), and "just coding practice" under-scopes the CS-foundations and design-thinking the transition requires.

**"Testing experience is a disadvantage in DSA rounds"** — Testing experience is an ASSET — the SDET's edge-case instinct and correctness-focus directly help ([05_Problem_Solving/23, 21_SDET]): the SDET who reflexively enumerates the edges (empty, boundary, duplicate — the [05_Problem_Solving/23] discipline they already have), who thinks about correctness and failure modes, who tests their solution. These rounds let the SDET LEVERAGE the testing mindset (the edge-case enumeration, the verification habit) as a DSA strength, which is why the SDET-plus-DSA fusion plays to the SDET's existing correctness-and-edge-case skills rather than exposing a weakness.
