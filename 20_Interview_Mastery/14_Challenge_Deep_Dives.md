# 14. Challenge Deep Dives — Point-by-Point Explanations

**Navigation**: [← SDET × Spring Boot](13_SDET_Plus_SpringBoot_Progressive.md) | [📚 Index](00_INDEX.md)

**Domain pairs covered:**

- [Deep Dive A — SDET × DSA: Polling with Sliding Window](#deep-dive-a--sdet--dsa-polling-with-sliding-window)
- [Deep Dive B — Spring Boot × DSA: LRU Cache Inside JPA](#deep-dive-b--spring-boot--dsa-lru-cache-inside-jpa)
- [Deep Dive C — SDET × Spring Boot: Testing with WireMock](#deep-dive-c--sdet--spring-boot-testing-with-wiremock)

---

> **How to use this file**: Read every section in order. Understand the concept, trace the code step by step, understand what breaks without the approach, then solve the similar challenges BEFORE looking at the answer.

---

## Deep Dive A — SDET × DSA: Polling with Sliding Window

### The Real-World Scenario

You're testing a citation management system. When a `POST /api/citations` is called:

- The API responds immediately with `201 Created` and `{ "id": "CIT-001", "status": "PENDING" }`
- A background worker picks it up, validates, and changes the status to `PROCESSED`
- This background processing takes anywhere from **200 milliseconds to 8 seconds** depending on server load

Your test needs to verify the citation ends up in `PROCESSED` state.

---

### Step 1 — Understand Exactly What the Problem Is

Before writing any code, answer these questions:

**Q: What are you waiting for?**
→ A field in an API response (`status`) to change its value.

**Q: When does the wait end?**
→ Either the condition becomes true (success) OR a maximum time budget is exhausted (failure).

**Q: What makes this hard?**
→ You don't know WHEN it will happen. Could be 200ms. Could be 8 seconds. Could be never if the system is broken.

**Q: What would a human do?**
→ Check once. If not ready, wait a bit. Check again. If still not ready, wait a bit longer. After enough time passes, give up.

This "check → wait → check → wait → give up" pattern is exactly what **polling** means in code.

---

### Step 2 — Why a Fixed Sleep is Wrong

The most common mistake beginners make:

```typescript
// ❌ WRONG — Fixed sleep
await page.waitForTimeout(5000); // wait 5 seconds
const res = await request.get(`/api/citations/${id}/status`);
expect(await res.json()).toMatchObject({ status: "PROCESSED" });
```

**Why this fails — point by point:**

**Point 1: It's either too slow or too brittle.**
If the background worker is fast (200ms) and you wait 5000ms, your test spends 4.8 seconds doing nothing. Multiply by 100 tests = 8 minutes of pure waiting. Over a week of CI runs, this wastes hours.

**Point 2: It makes tests environment-dependent.**
On a fast developer machine the worker finishes in 200ms. On an overloaded CI server it takes 6 seconds. If your fixed sleep is 5000ms: passes on dev, fails on CI. This is the definition of a flaky test — it's not testing your code, it's testing how fast the machine is today.

**Point 3: It gives no information when it fails.**
When the sleep ends and the status is still `PENDING`, you have no idea if:

- The worker hasn't started yet (and would finish in 1 more second)
- The worker crashed 3 seconds ago and will never finish
- The status update has a bug and will never change

A polling approach tells you when it stopped checking and what the last value was.

---

### Step 3 — The Sliding Window Mental Model

Think of a **sliding window** as a time budget that moves forward:

```
Total budget: 10 seconds
[0ms -------- 10,000ms]

Attempt 1 at 100ms:   status = PENDING → move window forward
Attempt 2 at 300ms:   status = PENDING → move window forward
Attempt 3 at 800ms:   status = PENDING → move window forward
Attempt 4 at 1,800ms: status = PROCESSED → SUCCESS! Window consumed: 1.8 seconds

If status never changes:
Attempt 8 at 9,500ms: status = PENDING → move window forward
Time budget = 10,000ms → EXHAUSTED → FAIL with clear message
```

The window "slides" through real time. We don't care about a fixed position in time — we care about the **window between now and budget-exhausted**. The moment we get a result or run out of budget, we stop.

The **intervals** control how fast we slide:

```
intervals: [100, 200, 500, 1000, 2000]
```

- First check at 100ms → catches fast responses without waiting
- Second check at 200ms → slightly more time for moderate loads
- Third check at 500ms → covers 80% of normal cases
- Fourth check at 1000ms → covers slow servers
- Fifth and beyond at 2000ms → maximum spacing for very slow cases

This is called **exponential-ish backoff** — you check more often when it's fresh (likely to resolve soon) and less often as time goes on (reduces load on the server, reduces log noise).

---

### Step 4 — The Correct Solution with Line-by-Line Explanation

```typescript
test("Citation transitions from PENDING to PROCESSED", async ({ request }) => {
  // ── Part 1: Create the citation ─────────────────────────────────────────

  const createResponse = await request.post("/api/citations", {
    data: { amount: 150, userId: "USR-001" },
  });
  // request.post: sends HTTP POST with JSON body
  // await: waits for the HTTP response (not for background processing — just the API ack)

  expect(createResponse.status()).toBe(201);
  // 201 Created means the citation record was saved, background processing STARTED
  // This is synchronous — we know it happened

  const { id } = await createResponse.json();
  // Destructure the response body to get the citation ID
  // e.g. id = "CIT-a3f8b2c1"
  // We need this ID to poll the status endpoint

  // ── Part 2: Poll for status change ──────────────────────────────────────

  await expect
    .poll(
      // ↑ expect.poll is Playwright's built-in polling utility
      // It calls the function argument repeatedly until the assertion passes or timeout

      async () => {
        // This is the "probe function" — it runs on every poll attempt

        const statusResponse = await request.get(`/api/citations/${id}/status`);
        // Makes a GET request to the status endpoint
        // e.g. GET /api/citations/CIT-a3f8b2c1/status

        const body = await statusResponse.json();
        // Parse the JSON response body
        // e.g. { "status": "PENDING", "updatedAt": "..." }

        return body.status;
        // Return the value we want to track
        // expect.poll compares this return value against the assertion (.toBe('PROCESSED'))
      },

      {
        message: `Citation ${id} should become PROCESSED within 10 seconds`,
        // ↑ This message appears in the test failure output
        // Without this: "Expected ... but received ..." — which citation? What was the context?
        // With this: "Citation CIT-a3f8b2c1 should become PROCESSED within 10 seconds" — clear!

        timeout: 10_000,
        // ↑ Maximum total time to wait in milliseconds (10 seconds)
        // If the condition is not met by this time → test FAILS
        // The _ in 10_000 is just a JavaScript readability trick (= 10000)

        intervals: [100, 200, 500, 1000, 2000],
        // ↑ How long to wait between each poll attempt
        // Poll 1: wait 100ms → check
        // Poll 2: wait 200ms → check
        // Poll 3: wait 500ms → check
        // Poll 4: wait 1000ms → check
        // Poll 5+: wait 2000ms → check, check, check...
        // Playwright cycles through intervals; repeats the LAST interval if more polls needed
      },
    )
    .toBe("PROCESSED");
  // ↑ The assertion: what the probe function's return value MUST equal
  // expect.poll keeps retrying until this is true OR timeout is reached
  // If this NEVER becomes true → test fails with the message above + last received value
});
```

---

### Step 5 — Trace Through Two Real Executions

**Execution 1: Fast server (background worker finishes in 300ms)**

```
T=0ms:    POST /api/citations → 201 Created, id = "CIT-001"
T=0ms:    expect.poll starts, budget = 10,000ms
T=100ms:  Probe 1: GET /status → { status: "PENDING" } → return "PENDING" → not "PROCESSED" → retry
T=300ms:  Probe 2: GET /status → { status: "PROCESSED" } → return "PROCESSED" → matches! → PASS
Total time: ~300ms. No wasted waiting.
```

**Execution 2: Slow server (background worker takes 7 seconds)**

```
T=0ms:    POST /api/citations → 201 Created, id = "CIT-002"
T=0ms:    expect.poll starts, budget = 10,000ms
T=100ms:  Probe 1: GET /status → PENDING → retry
T=300ms:  Probe 2: GET /status → PENDING → retry
T=800ms:  Probe 3: GET /status → PENDING → retry
T=1,800ms: Probe 4: GET /status → PENDING → retry
T=3,800ms: Probe 5: GET /status → PENDING → retry
T=5,800ms: Probe 6: GET /status → PENDING → retry
T=7,800ms: Probe 7: GET /status → PROCESSED → PASS
Total: ~7.8 seconds. Correctly waited the full time.
```

**Execution 3: Broken system (status never changes)**

```
T=0ms:     POST /api/citations → 201, id = "CIT-003"
T=100ms:   Probe 1 → PENDING
T=300ms:   Probe 2 → PENDING
T=800ms:   Probe 3 → PENDING
T=1,800ms: Probe 4 → PENDING
T=3,800ms: Probe 5 → PENDING
T=5,800ms: Probe 6 → PENDING
T=7,800ms: Probe 7 → PENDING
T=9,800ms: Probe 8 → PENDING
T=10,000ms: Budget exhausted → FAIL

Error output:
  "Citation CIT-003 should become PROCESSED within 10 seconds"
  Expected: "PROCESSED"
  Received: "PENDING"  ← shows the last known value — tells you the status was wrong, not missing
```

This failure message is genuinely useful — it tells you the processing is stuck at PENDING, which points you to the background worker, not the status endpoint.

---

### Step 6 — What the Interviewer Is Really Checking

When an interviewer asks "how do you test eventually-consistent APIs?", they want to hear you say these things (in your own words):

✅ "I never use fixed sleeps — they make tests environment-dependent and either slow or brittle."

✅ "I use adaptive polling with a time budget and variable intervals — check more often early, less often later."

✅ "I set a generous timeout (10 seconds) to tolerate slow CI, but the test finishes as soon as the condition is met."

✅ "I include a clear failure message so when the test fails, the error tells me the problem — not just 'expected X got Y'."

✅ "I return the actual value from the probe function so Playwright can show me what it received — this avoids digging through logs."

---

### Similar Challenges — Try Before Looking at the Answer

**Challenge A** _(easier)_: You're testing a batch export API. You trigger `POST /api/exports` and get back `{ "exportId": "EXP-001", "status": "QUEUED" }`. The export goes through states: `QUEUED → PROCESSING → COMPLETE`. You need to assert it reaches `COMPLETE` within 30 seconds. The export usually takes 5–15 seconds.

Write the complete Playwright test. Pay attention to:

- What should `intervals` look like for something that takes 5–15 seconds? (not 100ms — too noisy)
- What is a good failure message?

<details><summary>Answer — Point by Point</summary>

```typescript
test("Batch export reaches COMPLETE state within 30 seconds", async ({
  request,
}) => {
  // Step 1: Trigger the export
  const triggerRes = await request.post("/api/exports", {
    data: { format: "CSV", userId: "USR-001", dateRange: "2026-01" },
  });
  expect(triggerRes.status()).toBe(202);
  // 202 Accepted (not 201 Created) means "I've accepted your request, processing is async"
  // This is the correct HTTP status for long-running async operations

  const { exportId } = await triggerRes.json();

  // Step 2: Poll for COMPLETE
  await expect
    .poll(
      async () => {
        const statusRes = await request.get(`/api/exports/${exportId}/status`);
        const body = await statusRes.json();

        // Extra guard: if status is ERROR, fail immediately instead of waiting the full 30s
        if (body.status === "ERROR") {
          throw new Error(`Export ${exportId} failed: ${body.errorMessage}`);
          // Throwing inside expect.poll causes immediate failure — not a retry
          // This is the "fail fast on known-bad states" pattern
        }

        return body.status;
      },
      {
        message: `Export ${exportId} should reach COMPLETE within 30 seconds`,
        timeout: 30_000,
        intervals: [2000, 3000, 5000, 5000, 5000],
        // ↑ Why start at 2000ms (not 100ms)?
        // Exports take 5-15 seconds — checking at 100ms just creates 50 wasted HTTP calls
        // and spams the server log with meaningless "still QUEUED" responses.
        // Start the first check at 2 seconds because we KNOW it won't be done in 100ms.
        // The interval schedule matches the expected duration: 2s → 5s → 10s → 15s → 20s → done.
      },
    )
    .toBe("COMPLETE");
});
```

**Key insight:** `intervals` is not one-size-fits-all. For a 200ms transition use `[100, 200, 500]`. For a 10-second transition use `[2000, 3000, 5000]`. Always match your interval schedule to the realistic completion time — polling too often is wasteful, too rarely is slow.

**Second insight:** the `throw new Error()` inside the probe function is how you "fail fast" on terminal bad states. If you see `ERROR`, there's no point waiting 30 more seconds — you already know it failed. Throwing causes immediate test failure with a clear message.

</details>

---

**Challenge B** _(medium)_: A notification delivery system. You call `POST /api/notifications/send` and get back `{ "messageId": "MSG-001" }`. You need to verify the notification was actually DELIVERED — but the `/api/notifications/MSG-001` endpoint returns the full object including a `deliveredAt` timestamp (which is `null` until delivery). Your assertion: `deliveredAt` must not be null AND must be within the last 5 minutes.

<details><summary>Answer — Point by Point</summary>

```typescript
test("Notification is delivered within 15 seconds with a valid timestamp", async ({
  request,
}) => {
  // Trigger
  const sendRes = await request.post("/api/notifications/send", {
    data: {
      userId: "USR-001",
      type: "PAYMENT_CONFIRMATION",
      referenceId: "CIT-001",
    },
  });
  expect(sendRes.status()).toBe(200);
  const { messageId } = await sendRes.json();

  // Record the time BEFORE polling starts
  // This is important for the "within last 5 minutes" assertion
  const testStartTime = new Date();

  // Poll for delivery
  const deliveredNotification = await expect
    .poll(
      async () => {
        const res = await request.get(`/api/notifications/${messageId}`);
        const notification = await res.json();

        // Return the FULL OBJECT — we need multiple fields to assert
        // (not just a string status)
        return notification;
      },
      {
        message: `Notification ${messageId} should be delivered within 15 seconds`,
        timeout: 15_000,
        intervals: [500, 1000, 2000, 3000],
      },
      // ↓ Use a custom matcher that checks MULTIPLE conditions at once
    )
    .toMatchObject({
      messageId: messageId,
      deliveredAt: expect.not.toBeNull(),
      // ↑ expect.not.toBeNull() inside toMatchObject = "this field must exist and not be null"
    });

  // After the poll confirms deliveredAt is not null, do the timestamp range check:
  const deliveredAt = new Date(deliveredNotification.deliveredAt);
  const ageMs = deliveredAt.getTime() - testStartTime.getTime();

  expect(
    ageMs,
    "deliveredAt should be AFTER the test started",
  ).toBeGreaterThanOrEqual(0);
  expect(
    ageMs,
    "deliveredAt should be within 5 minutes of test start",
  ).toBeLessThan(5 * 60 * 1000);
  // ↑ This catches a subtle bug: if the system "delivers" with a timestamp from
  // a previous run's data — the timestamp would be OLDER than testStartTime → negative ageMs → fail
});
```

**Why return the full object?** You need TWO assertions:

1. `deliveredAt` is not null (to know delivery happened)
2. `deliveredAt` is a reasonable timestamp (to catch data bugs)

If your probe returns only `notification.deliveredAt !== null`, you lose the timestamp and can't do the range check. Return the full object, assert both together.

</details>

---

**Challenge C** _(hard)_: You're testing a rate-limited endpoint. Your test sends 12 requests to `GET /api/citations` in rapid succession. The first 10 should return 200. The 11th and 12th should return 429 with a `Retry-After` header. After waiting the time specified in `Retry-After`, the next request should succeed again (200). Write the complete test including the wait-and-retry verification.

<details><summary>Answer — Point by Point</summary>

```typescript
test("Rate limiter: 10 allowed, then 429, then recovers after Retry-After", async ({
  request,
}) => {
  const userId = `RATE-TEST-${Date.now()}`;
  // ↑ Unique per run. Why?
  // Rate limits are tracked per-user. If you reuse a userId across test runs
  // (in the same 10-second window), the rate limit from the previous run bleeds in.
  // timestamp-based ID = guaranteed isolation between test runs.

  // ── Phase 1: Send 12 concurrent requests ────────────────────────────────

  const responses = await Promise.all(
    Array.from({ length: 12 }, () =>
      request.get("/api/citations", { headers: { "X-User-Id": userId } }),
    ),
  );
  // ↑ Why Promise.all?
  // Promise.all fires ALL 12 requests simultaneously.
  // All 12 hit the server within a few milliseconds of each other.
  // This is the only way to reliably trigger a rate limit.
  //
  // A for loop would send them sequentially with ~50ms gaps — probably none get rate limited.
  // A sequential approach tests "12 requests over 600ms" not "12 requests in 10ms".

  // ── Phase 2: Categorize the responses ───────────────────────────────────

  const successful = responses.filter((r) => r.status() === 200);
  const throttled = responses.filter((r) => r.status() === 429);

  // Assertions on counts
  expect(successful.length).toBe(10);
  // Exactly 10 succeed — the rate limit is 10/window, not "approximately 10"

  expect(throttled.length).toBe(2);
  // The 11th and 12th are throttled

  // ── Phase 3: Inspect the 429 response shape ─────────────────────────────

  const firstThrottled = throttled[0];

  const retryAfterHeader = firstThrottled.headers()["retry-after"];
  expect(retryAfterHeader).toBeDefined();
  // ↑ The server MUST tell the client when to retry
  // A 429 without Retry-After is an incomplete implementation — this assertion catches it

  const retryAfterSeconds = parseInt(retryAfterHeader, 10);
  expect(retryAfterSeconds).toBeGreaterThan(0);
  // Must be a positive number (not 0, not NaN, not negative)

  const body = await firstThrottled.json();
  expect(body.error).toBe("RATE_LIMIT_EXCEEDED");
  // The error code must be machine-readable — not a human message like "too many requests"
  // Clients use the code to decide retry logic; humans read the message field
  expect(body.retryAfterMs).toBeGreaterThan(0);
  // Millisecond version of retry delay — useful for programmatic clients

  // ── Phase 4: Wait the specified time and verify recovery ────────────────

  const waitMs = retryAfterSeconds * 1000;
  // Convert seconds to milliseconds

  // Add a small buffer (200ms) because "retry after N seconds" means "at least N seconds"
  // Hitting exactly at the boundary can still return 429 due to clock jitter
  await new Promise((resolve) => setTimeout(resolve, waitMs + 200));

  // After waiting, the rate limit window should have reset
  const recoveryRes = await request.get("/api/citations", {
    headers: { "X-User-Id": userId },
  });

  expect(recoveryRes.status()).toBe(200);
  // ↑ This proves the rate limiter recovers — it's not permanently blocking the user
  // A common implementation bug: rate limit never resets → this assertion catches it

  // Also verify the rate limit headers on the recovery response
  const remaining = recoveryRes.headers()["x-ratelimit-remaining"];
  expect(parseInt(remaining)).toBe(9);
  // After 1 recovery request, 9 slots remain (10 - 1 = 9)
  // This proves the sliding window reset correctly to a full 10
});
```

**The three things this test proves:**

1. The rate limiter correctly allows exactly 10 requests
2. The 429 response is correctly formed (machine-readable error, valid Retry-After)
3. The rate limiter RECOVERS after the window expires — it doesn't permanently block

Without assertion 3, you'd never catch the bug where the Redis key TTL is set incorrectly and the limit never resets.

</details>

---

## Deep Dive B — Spring Boot × DSA: LRU Cache Inside JPA

### The Real-World Scenario

Your citation API has a `GET /api/citations/{id}` endpoint. It's called 10,000 times per minute. Each call hits PostgreSQL. The DB query is fast (2ms), but 10,000 × 2ms = 20 seconds of cumulative DB work per minute, plus connection pool pressure, plus query plan overhead.

You add JPA's Second-Level Cache. Response times drop from 2ms to 0.1ms for cached citations. But then a support ticket: "User updated their citation 5 minutes ago and the API still shows the old data." The cache is serving stale data.

---

### Step 1 — What is an LRU Cache (Really)?

Think of it as a **VIP lounge with limited seats**:

```
Lounge capacity: 3 people (entries)
Timeline:
  Alice enters → Lounge: [Alice]
  Bob enters   → Lounge: [Bob, Alice]
  Carol enters → Lounge: [Carol, Bob, Alice]
  Dave arrives → Lounge is FULL
               → Who gets kicked? Alice — she's been sitting longest without anyone interacting with her
               → Lounge: [Dave, Carol, Bob]
  Bob waves    → Bob is "recently used" → moves to front
               → Lounge: [Bob, Dave, Carol]
  Eve arrives  → Lounge is FULL → kick Carol (least recently used)
               → Lounge: [Eve, Bob, Dave]
```

The rule: **when you need space, remove the person who has been unused the longest**.

In code terms:

- **Capacity** = how many objects can be cached (e.g. 1000 Citation objects)
- **Get** = using an entry (moves it to "most recently used" position)
- **Put** = adding a new entry (if full, evict least recently used first)

---

### Step 2 — The Data Structure That Makes LRU O(1)

A naive LRU with just an array is O(n): to move an item to the front, you'd shift everything else. With 10,000 cached items, that's 10,000 operations per cache hit.

The O(1) trick: combine **HashMap + Doubly Linked List**:

```
HashMap: citationId → pointer to node in the list
         "CIT-001" → [node at position 3 in list]
         "CIT-002" → [node at position 1 in list]

Doubly Linked List (MRU at head, LRU at tail):
  HEAD ↔ [CIT-002 data] ↔ [CIT-003 data] ↔ [CIT-001 data] ↔ TAIL

On GET("CIT-001"):
  1. HashMap lookup: O(1) → find node
  2. Unlink node from current position: O(1) (doubly linked → update 2 pointers)
  3. Relink at HEAD: O(1)
  Total: O(1)

On eviction:
  1. Remove TAIL node: O(1)
  2. Remove TAIL's key from HashMap: O(1)
  Total: O(1)
```

Every operation is O(1). The cache never slows down regardless of how many items it holds.

---

### Step 3 — Where Spring's JPA L2C Uses This

```
Your app's JPA call:
  citation = repo.findById("CIT-001")

Hibernate's internal decision tree:
  Step 1: Check EntityManager (L1 cache — per-request, always checked first)
    → If HIT: return immediately (same transaction saw this entity before)
    → If MISS: continue

  Step 2: Check Second-Level Cache (L2C — shared across requests, LRU-based)
    → If HIT: deserialize from cache, return (no DB)
    → If MISS: continue

  Step 3: Query the database
    → Execute: SELECT * FROM citations WHERE id = 'CIT-001'
    → Deserialize result
    → Store in L2C: cache.put("CIT-001", citationData)
    → Return

On PUT (update):
  Hibernate must INVALIDATE the L2C entry for the updated entity
  Otherwise: next GET → L2C HIT → stale data → the bug in our scenario
```

---

### Step 4 — The Stale Data Bug and Its Fix

```java
// The Entity — WRONG (missing eviction strategy)
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY) // ← BUG: READ_ONLY means never invalidate
public class Citation {
    @Id String id;
    CitationStatus status;
    BigDecimal amount;
}

// What happens when you update:
// 1. Transaction A: UPDATE citations SET status = 'PAID' WHERE id = 'CIT-001' → commits
// 2. L2C still has: { id: "CIT-001", status: "PENDING" } (never invalidated — READ_ONLY!)
// 3. Transaction B: findById("CIT-001") → L2C HIT → returns status = "PENDING" ← stale!
```

```java
// The CORRECT entity configuration
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
// ↑ READ_WRITE: Hibernate will:
//   - Lock the L2C entry during the update transaction
//   - Invalidate (or update) the L2C entry when the transaction commits
//   - Other threads that read during the update get a soft-lock + fall back to DB
public class Citation {
    @Id String id;
    CitationStatus status;
    BigDecimal amount;

    // If Citations have comments — MUST annotate the collection too
    @OneToMany(mappedBy = "citation", fetch = FetchType.LAZY)
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    // ↑ Without this: Citation is cached but getComments() always hits DB
    // The collection and the entity have SEPARATE cache regions
    List<Comment> comments;
}

// Also configure the cache region capacity and TTL (ehcache.xml):
// <cache alias="com.company.Citation">
//   <heap units="entries">1000</heap>       ← LRU capacity: 1000 citation objects
//   <expiry><ttl unit="minutes">5</ttl></expiry>  ← also expire after 5 min (belt + suspenders)
// </cache>
```

---

### Step 5 — The Four Cache Concurrency Strategies Compared

| Strategy               | Can Update? | Thread Safe?       | Use When                                                  |
| ---------------------- | ----------- | ------------------ | --------------------------------------------------------- |
| `READ_ONLY`            | ❌ No       | ✅ Yes (lockless)  | Reference data that NEVER changes (countries, currencies) |
| `NONSTRICT_READ_WRITE` | ✅ Yes      | ⚠️ Weak            | Rarely-updated data where brief staleness is OK           |
| `READ_WRITE`           | ✅ Yes      | ✅ Yes (soft lock) | Frequently-updated entities needing consistency           |
| `TRANSACTIONAL`        | ✅ Yes      | ✅ Yes (JTA tx)    | Strict consistency required (financial data)              |

**For citations** (updated when paid): `READ_WRITE` is correct. `TRANSACTIONAL` is overkill unless you're using JTA transactions across multiple databases.

---

### Step 6 — Interview Narration Script

When asked "how would you cache citation data in Spring Boot?", say:

> "I'd use JPA's Second-Level Cache backed by EhCache. The key decision is the concurrency strategy — for entities that are read-heavy but do get updated, `READ_WRITE` is correct. It uses a soft-lock mechanism: during an update transaction, the L2C entry is locked; other threads fall back to the database for that entry while the lock is held. After commit, the entry is refreshed. I'd also ensure I annotate any `@OneToMany` collections with their own `@Cache` annotation, because the entity cache and the collection cache are separate regions in Hibernate. Finally, I'd configure a TTL as a safety net — even with correct invalidation, a 5-minute TTL prevents stale data from surviving across application restarts or cluster deployments where cache invalidation messages might be missed."

---

### Similar Challenges — Try Before Looking at the Answer

**Challenge A**: You add `@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)` to the `Citation` entity. You have a test that:

1. Loads `CIT-001` (populates cache)
2. Directly updates the DB row using JDBC (bypasses Hibernate/JPA)
3. Loads `CIT-001` again via `repo.findById()`

Will the test see the updated value? Why or why not? What should you do if you need the test to see fresh data?

<details><summary>Answer — Point by Point</summary>

**Answer: No — the test will see the cached (stale) value.**

**Why point by point:**

**Point 1**: When you called `repo.findById("CIT-001")` the first time, Hibernate stored the entity in L2C. The L2C key is `"CIT-001"`, the value is the full serialized Citation object as it was at query time.

**Point 2**: When you update the DB row using raw JDBC (`jdbcTemplate.update("UPDATE citations SET status = 'PAID' WHERE id = 'CIT-001'")`), Hibernate has NO IDEA this happened. JDBC bypasses Hibernate's EntityManager entirely. Hibernate doesn't know to invalidate its L2C entry.

**Point 3**: On the second `repo.findById("CIT-001")`:

- Hibernate checks L1 cache (EntityManager session) → may HIT if same session → returns stale!
- Hibernate checks L2C → HIT → returns the pre-update value → stale!

**Point 4**: This is a fundamental principle: **the cache can only be invalidated by the mechanism that knows about the change**. JDBC bypasses Hibernate → Hibernate can't invalidate.

**What to do:**

```java
// Option 1: Evict the specific entity after the raw JDBC update
cacheManager.getCache("com.company.Citation").evict("CIT-001");

// Option 2: Clear the entire L2C (nuclear option — use in tests only)
sessionFactory.getCache().evictAllRegions();

// Option 3: Use Hibernate for the update (then L2C invalidation is automatic)
Citation c = em.find(Citation.class, "CIT-001");
c.setStatus(CitationStatus.PAID);
// Hibernate issues UPDATE + invalidates L2C on commit

// Option 4 (in tests): Use @CacheEvict in setup
@BeforeEach
void evictCache() {
    sessionFactory.getCache().evictEntityData(Citation.class);
}
```

**The rule**: raw SQL/JDBC is a "cache bypass" — you own the invalidation. Hibernate-managed updates handle invalidation for you.

</details>

---

**Challenge B**: Your `Citation` entity has a `@ManyToOne` to `User`. The `User` entity is also cached with `@Cache`. When you load `Citation CIT-001`, does it automatically load and cache the `User` entity? What controls this?

<details><summary>Answer — Point by Point</summary>

**Answer: It depends on the fetch strategy and whether User has its own `@Cache` annotation.**

**Point 1 — Fetch strategy determines WHEN User is loaded:**

```java
@Entity
public class Citation {
    @ManyToOne(fetch = FetchType.LAZY)   // ← LAZY: User is NOT loaded with Citation
    @JoinColumn(name = "user_id")
    User user;
    // Loading CIT-001 does NOT automatically load the User entity
    // User is loaded only when citation.getUser() is called
}
```

**Point 2 — L2C checks happen at the moment of loading:**

```
citation.getUser() called:
  Step 1: Hibernate knows user_id = "USR-001" from the Citation row
  Step 2: Check L1 cache for User "USR-001" → maybe hit if same session loaded this user before
  Step 3: Check L2C for User "USR-001" → HIT if User entity has @Cache AND was previously loaded
  Step 4: If miss → DB query: SELECT * FROM users WHERE id = 'USR-001'
```

**Point 3 — User needs its own `@Cache` annotation:**

```java
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
// ↑ Without this: User is NEVER cached in L2C, even when accessed through Citation
public class User {
    @Id String id;
    String email;
}
```

**Point 4 — Why separate cache regions make sense:**

- Citation might have 10,000 records → large cache region (1000 entries with LRU eviction)
- User might have 500 records → smaller cache region (500 entries, fits entirely)
- Different TTLs: Citation changes when paid (minutes), User changes on profile update (hours)
- Separate regions = separate LRU lists = independent eviction policies

**Practical rule**: every entity that is frequently loaded independently AND is not trivially small should have its own `@Cache` annotation with thoughtfully configured capacity and TTL.

</details>

---

## Deep Dive C — SDET × Spring Boot: Testing with WireMock

### The Real-World Scenario

Your `CitationService` calls Dynamics 365 to fetch citation details before processing a payment. The D365 URL is `https://d365.company.com/api/citations/{id}`. In your Spring Boot service:

```java
public CitationDetails fetchFromD365(String citationId) {
    return webClient.get()
        .uri(d365BaseUrl + "/api/citations/{id}", citationId)
        .retrieve()
        .onStatus(HttpStatusCode::is4xxClientError, resp ->
            Mono.error(new CitationNotFoundException("D365: " + citationId)))
        .onStatus(HttpStatusCode::is5xxServerError, resp ->
            Mono.error(new DynamicsApiException("D365 error for " + citationId)))
        .bodyToMono(CitationDetails.class)
        .block();
}
```

You need to test: (1) the happy path, (2) citation not found in D365, (3) D365 is down.

---

### Step 1 — Why You Can't Use Mockito Here

You might think: just mock `WebClient` with Mockito.

```java
@MockBean WebClient webClient;
when(webClient.get()...).thenReturn(...);
```

**Why this fails — point by point:**

**Point 1**: `WebClient` has a builder pattern. Mocking `webClient.get()` returns a mock. Then `.uri()` on the mock needs to return a mock. Then `.retrieve()` needs to return a mock. Then `.onStatus()`. Then `.bodyToMono()`. Then `.block()`. You'd need 7+ nested mocks. One change in the production code breaks all 7 mock expectations.

**Point 2**: Even if you wire it all up, you're testing your mock, not your code. The actual HTTP serialization (does your `CitationDetails` Jackson mapping work?), URL construction (is the `{id}` template expanded correctly?), and header passing (does Authorization get sent?) are all bypassed.

**Point 3**: You can't simulate network-level behavior like connection timeouts, slow responses, or half-open connections with Mockito.

**WireMock solution**: it spins up a REAL HTTP server on a local port. Your `webClient` makes REAL HTTP calls to it. The URL `https://d365.company.com` is replaced with `http://localhost:8089` in test configuration. Everything in your production code runs exactly as it would in production — except the responses are controlled by you.

---

### Step 2 — WireMock Stub Anatomy

A WireMock stub has exactly two parts:

```java
stubFor(
    // Part 1: Request matcher — "when you see THIS..."
    get(urlEqualTo("/api/citations/CIT-001"))
        .withHeader("Authorization", containing("Bearer"))
        .withQueryParam("version", equalTo("2")),

    // Part 2: Response definition — "...return THAT"
    // (chained from the matcher)
    .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody("""
            { "citationId": "CIT-001", "status": "ACTIVE", "amount": 150.00 }
            """)
        .withFixedDelay(50)  // simulate 50ms network latency
    )
);
```

**Matcher options:**

| Matcher                                             | What it checks            |
| --------------------------------------------------- | ------------------------- |
| `urlEqualTo("/api/citations/CIT-001")`              | Exact URL path match      |
| `urlPathMatching("/api/citations/.*")`              | Regex URL match           |
| `get(...)`                                          | HTTP method + URL         |
| `withHeader("Authorization", containing("Bearer"))` | Header must contain value |
| `withRequestBody(equalToJson("{...}"))`             | Body must equal JSON      |
| `withQueryParam("v", equalTo("2"))`                 | Query parameter check     |

---

### Step 3 — The Complete Solution with Line-by-Line Explanation

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// ↑ Starts the full Spring application on a random port
// We need the full application because we're testing the CitationService
// which calls WebClient which makes real HTTP — needs the full context

@AutoConfigureWireMock(port = 0)
// ↑ Starts a WireMock server on a random available port (port=0 means "pick any free port")
// Spring Boot auto-discovers the port and sets ${wiremock.server.port}
// This avoids port conflicts when multiple test classes run in parallel
class CitationD365IntegrationTest {

    @Autowired
    TestRestTemplate restTemplate;
    // ↑ A test-aware RestTemplate pre-configured with the application's base URL
    // We use this to call OUR API (which internally calls WireMock for D365)

    // ── Test 1: Happy path — D365 returns citation data ──────────────────

    @Test
    void getCitationDetails_d365Returns200_propagatesData() {
        // Step A: Register the stub BEFORE the action
        stubFor(
            get(urlPathMatching("/api/citations/CIT-HAPPY"))
            // ↑ urlPathMatching accepts a regex: "any URL matching this pattern"
            // Why regex instead of exact? More resilient to minor URL changes in production code

            .withHeader("Authorization", matching("Bearer .*"))
            // ↑ Verify our service SENDS the auth header
            // If the header is missing, WireMock returns 404 (no matching stub) → test fails
            // This catches the bug where developers forget to pass auth tokens to downstream APIs

            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                // ↑ MUST set Content-Type: application/json
                // Without it, Jackson doesn't know how to deserialize the response
                // and your WebClient throws an error even though the status is 200

                .withBody("""
                    {
                        "citationId": "CIT-HAPPY",
                        "status": "ACTIVE",
                        "amount": 150.00,
                        "currency": "USD"
                    }
                    """)
                // ↑ The body your CitationDetails class must be able to deserialize
                // Test this by checking: does this JSON map to all required fields in CitationDetails?
            )
        );

        // Step B: Call YOUR API (which internally calls WireMock)
        ResponseEntity<PaymentPreviewDTO> response = restTemplate.getForEntity(
            "/api/citations/CIT-HAPPY/payment-preview",
            PaymentPreviewDTO.class
        );
        // Your endpoint: GET /api/citations/{id}/payment-preview
        // Internally: CitationService.fetchFromD365("CIT-HAPPY") → WireMock

        // Step C: Assert the response from YOUR API
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getAmount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(response.getBody().getCurrency()).isEqualTo("USD");

        // Step D: Verify WireMock received the expected call
        verify(1, getRequestedFor(urlPathMatching("/api/citations/CIT-HAPPY")));
        // ↑ WireMock.verify checks "how many times was this stub called?"
        // Expected: exactly 1 time
        // If your code accidentally calls D365 twice (e.g. in a retry loop with wrong logic):
        //   verify(1, ...) → FAIL → catches the double-call bug
        // If your code has an error and never calls D365:
        //   verify(1, ...) → FAIL → catches the bypass bug
    }

    // ── Test 2: Citation not found in D365 (404) ─────────────────────────

    @Test
    void getCitationDetails_d365Returns404_returnsNotFound() {
        stubFor(
            get(urlPathMatching("/api/citations/CIT-MISSING"))
            .willReturn(aResponse()
                .withStatus(404)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"error\": \"Citation not found\", \"citationId\": \"CIT-MISSING\"}")
            )
        );

        ResponseEntity<ErrorResponse> response = restTemplate.getForEntity(
            "/api/citations/CIT-MISSING/payment-preview",
            ErrorResponse.class
        );

        // Your API should translate D365's 404 into its own 404
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        // NOT a 500! A 404 from downstream should produce a 404 upstream, not an internal error

        assertThat(response.getBody().getError()).contains("CIT-MISSING");
        // The error message should identify WHICH citation was not found
        // A generic "not found" message is unhelpful for debugging

        assertThat(response.getBody().getError()).doesNotContain("D365");
        // The error SHOULD NOT expose internal implementation details (that you use D365)
        // to the API consumer — information leakage is a security concern
    }

    // ── Test 3: D365 is down (503) ──────────────────────────────────────

    @Test
    void getCitationDetails_d365Returns503_returnsServiceUnavailable() {
        stubFor(
            get(urlPathMatching("/api/citations/CIT-DOWN"))
            .willReturn(aResponse()
                .withStatus(503)
                .withHeader("Content-Type", "application/json")
                .withFixedDelay(2000)
                // ↑ Simulate a slow-then-failing response: D365 hangs for 2 seconds then 503s
                // This tests your timeout configuration:
                //   - If your WebClient has a 5-second timeout → waits 2s, gets 503, handles it
                //   - If timeout is 1 second → times out at 1s → different error code path
                // Choose the delay to test the scenario you care about
                .withBody("{\"error\": \"Service Unavailable\"}")
            )
        );

        long startTime = System.currentTimeMillis();
        ResponseEntity<ErrorResponse> response = restTemplate.getForEntity(
            "/api/citations/CIT-DOWN/payment-preview",
            ErrorResponse.class
        );
        long elapsed = System.currentTimeMillis() - startTime;

        // Assert the status code
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        // 503 from D365 → 503 from our API (or 502 Bad Gateway — both are correct)
        // What's NOT correct: 200 with null data, or 500 Internal Server Error

        // Assert timing: the response should take ~2 seconds (the stub's delay)
        // but not exceed our configured timeout (e.g. 5 seconds)
        assertThat(elapsed)
            .isGreaterThan(1800)    // waited for the 2-second stub delay
            .isLessThan(5000);      // didn't wait longer than our timeout

        // Assert the error is not a stack trace
        assertThat(response.getBody().getError())
            .doesNotContain("Exception")
            .doesNotContain("at com.company"); // no stack trace in production API responses
    }
}
```

---

### Step 4 — What WireMock Verifies That Mockito Cannot

| What you're testing                           | Mockito                    | WireMock                     |
| --------------------------------------------- | -------------------------- | ---------------------------- |
| Your service SENDS the correct URL            | ❌ No                      | ✅ `urlPathMatching(...)`    |
| Your service SENDS the correct headers        | ❌ No                      | ✅ `withHeader(...)`         |
| Your service handles 503 correctly            | ⚠️ Simulate with exception | ✅ Real 503 response         |
| Your Jackson `@JsonProperty` mapping works    | ❌ No (mocked body)        | ✅ Real JSON deserialization |
| Your service only calls D365 ONCE (not twice) | ❌ No                      | ✅ `verify(1, ...)`          |
| Your timeout configuration fires correctly    | ❌ No                      | ✅ `withFixedDelay(...)`     |

---

### Similar Challenges — Try Before Looking at the Answer

**Challenge A** _(medium)_: Your `PaymentService` calls Stripe's `POST /v1/charges` endpoint. Write WireMock stubs and assertions for: successful charge, and Stripe returns a 402 with a `decline_code` of `insufficient_funds`. Your API should map this to a 402 with a user-friendly message (not the raw Stripe error).

<details><summary>Answer — Point by Point</summary>

```java
@Test
void processPayment_stripeInsufficientFunds_returns402WithFriendlyMessage() {

    // Step 1: Stub Stripe's response for insufficient funds
    stubFor(
        post(urlEqualTo("/v1/charges"))
        .withHeader("Authorization", matching("Bearer sk_test_.*"))
        // ↑ Stripe uses Bearer tokens. Verifying the header ensures:
        //   (a) your service sends auth credentials
        //   (b) you're using test keys (sk_test_), not production keys (sk_live_) in test env

        .withRequestBody(containing("amount=15000"))
        // ↑ Verify the body contains the correct charge amount (150.00 USD = 15000 cents)
        // Stripe uses form-encoded bodies, not JSON, for charges

        .willReturn(aResponse()
            .withStatus(402)
            // ↑ Stripe returns 402 Payment Required for card errors

            .withHeader("Content-Type", "application/json")
            .withBody("""
                {
                    "error": {
                        "type": "card_error",
                        "code": "card_declined",
                        "decline_code": "insufficient_funds",
                        "message": "Your card has insufficient funds.",
                        "param": "amount"
                    }
                }
                """)
        )
    );

    // Step 2: Call your payment API
    ResponseEntity<PaymentErrorResponse> response = restTemplate.postForEntity(
        "/api/citations/CIT-001/pay",
        new PaymentRequest("tok_visa", new BigDecimal("150.00")),
        PaymentErrorResponse.class
    );

    // Step 3: Assert YOUR API's response (not Stripe's raw response)
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYMENT_REQUIRED);
    // ↑ Your API correctly propagates the 402 (not 500)

    assertThat(response.getBody().getMessage())
        .isEqualTo("Payment declined: insufficient funds. Please use a different card.");
    // ↑ User-friendly message — NOT the raw Stripe message
    // Stripe's "Your card has insufficient funds." is OK but your API should add context
    // "Please use a different card" tells the user what to DO, not just what went wrong

    assertThat(response.getBody().getCode()).isEqualTo("CARD_DECLINED");
    // ↑ Machine-readable code for the frontend to handle programmatically
    // Frontend can show: if code === 'CARD_DECLINED' → show "Try another card" button

    assertThat(response.getBody().getMessage())
        .doesNotContain("decline_code")
        .doesNotContain("Stripe")
        .doesNotContain("sk_test");
    // ↑ THREE things you MUST NOT leak in API responses:
    //   1. Internal error codes from the payment provider
    //   2. Which payment provider you use (Stripe vs Braintree — competitor info)
    //   3. API keys (catastrophic if logged or returned)

    // Step 4: Verify Stripe was called exactly once
    verify(1, postRequestedFor(urlEqualTo("/v1/charges")));
    // ↑ Confirms no retry logic accidentally called Stripe twice for a definitive failure
    // (insufficient funds is not a transient error — retrying makes no sense and charges twice)
}
```

</details>

---

**Challenge B** _(hard)_: You want to test that your service RETRIES when D365 returns 503 the first time but 200 on the second attempt. Your service uses `@Retry(maxAttempts = 3)`. Write the WireMock stubs using `Scenarios` (stateful stubs) so the first call returns 503 and the second call returns 200.

<details><summary>Answer — Point by Point</summary>

```java
@Test
void getCitation_d365Flaps_retriesAndSucceeds() {

    // WireMock Scenarios: stateful stubs that change behaviour based on "scenario state"
    // Think of it as a state machine:
    //   State "Started" (default) → return 503
    //   State "RetrySucceeds"     → return 200

    // Stub 1: In "Started" state → return 503 → then transition to "RetrySucceeds"
    stubFor(
        get(urlPathMatching("/api/citations/CIT-FLAP"))
        .inScenario("D365 Flap Recovery")
        // ↑ Name the scenario — links the stubs together

        .whenScenarioStateIs(STARTED)
        // ↑ STARTED is WireMock's default initial state (constant = "Started")
        // This stub only fires when the scenario is in this state

        .willSetStateTo("RetrySucceeds")
        // ↑ After this stub fires, transition the scenario to this new state
        // So: first call → fires this stub → 503 → state becomes "RetrySucceeds"

        .willReturn(aResponse()
            .withStatus(503)
            .withBody("{\"error\": \"temporarily unavailable\"}")
        )
    );

    // Stub 2: In "RetrySucceeds" state → return 200
    stubFor(
        get(urlPathMatching("/api/citations/CIT-FLAP"))
        .inScenario("D365 Flap Recovery")
        .whenScenarioStateIs("RetrySucceeds")
        // ↑ This stub only fires after the state has transitioned
        // Second call → state is "RetrySucceeds" → fires this stub → 200

        .willReturn(aResponse()
            .withStatus(200)
            .withHeader("Content-Type", "application/json")
            .withBody("""
                { "citationId": "CIT-FLAP", "status": "ACTIVE", "amount": 200.00 }
                """)
        )
    );

    // Now call YOUR API — it should:
    //   1. Call D365 → 503 → retry (because @Retry(maxAttempts=3))
    //   2. Call D365 → 200 → success
    ResponseEntity<PaymentPreviewDTO> response = restTemplate.getForEntity(
        "/api/citations/CIT-FLAP/payment-preview",
        PaymentPreviewDTO.class
    );

    // Assert: eventually succeeded
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody().getAmount()).isEqualByComparingTo(new BigDecimal("200.00"));

    // Assert: D365 was called TWICE (once fail + once success = 2 total calls)
    verify(2, getRequestedFor(urlPathMatching("/api/citations/CIT-FLAP")));
    // ↑ This is the critical assertion: proves retry happened
    // If D365 was called only once → retry didn't fire → @Retry is misconfigured
    // If D365 was called 3 times → retry didn't stop at success → bug in retry logic
}
```

**The Scenario concept**: WireMock Scenarios are a simple state machine. Each stub says "only fire in state X, then transition to state Y". This lets you simulate sequences — first call fails, second call succeeds — which is impossible with simple static stubs.

</details>

---

**Navigation**: [← SDET × Spring Boot](13_SDET_Plus_SpringBoot_Progressive.md) | [📚 Index](00_INDEX.md)
