# 21. Algorithm War Stories — How Engineers Actually Solved It

**Navigation**: [← 20: DSA Patterns PDF Coverage Map](20_DSA_Patterns_PDF_Java_Coverage_Map.md) | [📚 Algorithms Index](00_INDEX.md) | [A5: Designing Your Own Algorithms →](A5_Designing_Your_Own_Algorithms.md)

> **The chapter that connects the textbook to the incident channel.**
>
> Every case below is a real engineering problem at a real company. For each one: what broke, what the naive fix was and why it failed, what algorithm or data structure actually solved it, and — most importantly — **the reasoning path the engineers walked**, traced through the [A5 design loop](A5_Designing_Your_Own_Algorithms.md).

> **How to read this chapter.** Do not read it as trivia. For each story, stop at the "⏸️ Your turn" marker and try to design the fix yourself before reading on. The value is in matching your reasoning against theirs, not in memorizing what Discord did.

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | The whole course |
| **You will learn** | Ten real production incidents analysed through the algorithm design loop (what was assumed, what broke, what fixed it) |
| **Leads to** | [Production](13_Algorithms_In_Production.md), [A5 Design](A5_Designing_Your_Own_Algorithms.md) |
| **Abstraction level** | L8: failure as the best teacher |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Algorithm War Stories

### 1. The bottom line

Every algorithm failure in production traces back to an assumption about input, scale or order that stopped being true.

### 2. The textbook core

- Common root causes: worst-case input, hash collisions, unbounded recursion, wrong complexity at scale, ordering assumptions.
- Fixes are often a **different algorithm or a guard**, not more hardware.
- Use postmortems to extract the violated invariant.
- Add tests and monitors that would have caught it.

### 3. The real-world analogy

A **flight-accident report**: the value is not the blame but the checklist item it adds for every future pilot.

### 4. Walkthrough

1. Incident: a regex or sort became quadratic on adversarial input.
2. Identify the assumption ("input is random").
3. Replace with a linear algorithm or add a limit.
4. Add a regression test using the adversarial case.

> [!NOTE]
> **Quick check:** What is the most common root cause pattern? *An unstated assumption about input size or distribution.*

---


## Table of Contents

1. [How To Use This Chapter](#0-how-to-use-this-chapter)
2. Story 1: The Quadratic That Only Appeared at Scale
3. [Story 2: Counting Distinct Users Without the Memory](#story-2-counting-distinct-users-without-the-memory-hyperloglog)
4. [Story 3: The Cache That Made Things Slower](#story-3-the-cache-that-made-things-slower-thundering-herd--stampede)
5. [Story 4: Resharding Without Downtime](#story-4-resharding-without-downtime-consistent-hashing)
6. [Story 5: The Feed That Could Not Fan Out](#story-5-the-feed-that-could-not-fan-out-the-celebrity-problem)
7. [Story 6: Rate Limiting That Did Not Lie](#story-6-rate-limiting-that-did-not-lie-sliding-window-counters)
8. [Story 7: The Sort That Was Already Sorted](#story-7-the-sort-that-was-already-sorted-timsort)
9. [Story 8: Finding the Bad Deploy in 9 Steps](#story-8-finding-the-bad-deploy-in-9-steps-bisection)
10. [Story 9: The Retry Storm That Took Down the Service](#story-9-the-retry-storm-that-took-down-the-service-backoff--jitter)
11. [Story 10: Deduplicating a Firehose in One Pass](#story-10-deduplicating-a-firehose-in-one-pass-bloom-filters)
12. [The Cross-Story Patterns](#the-cross-story-patterns)
13. [Old Algorithms vs New Inventions](#old-algorithms-vs-new-inventions-what-industry-actually-does)
14. [Practice Challenges](#-practice-challenges)
15. [Reality Check](#reality-check)

---

## 0. How To Use This Chapter

Each story follows the same skeleton, which is deliberately the [A5 design loop](A5_Designing_Your_Own_Algorithms.md):

```
SYMPTOM      → what the on-call engineer actually saw
NAIVE FIX    → what was tried first, and why it failed
⏸️ YOUR TURN → design it yourself before reading on
THE INSIGHT  → the structural property that unlocked the fix
THE SOLUTION → the algorithm/DS, and its cost
THE COST     → what was traded away (nothing is free)
TRANSFER     → where else this exact reasoning applies
```

**The skill being built** is *recognition*: seeing a production symptom and knowing which algorithmic shape sits underneath it. That is the reverse of the usual direction ([05_LeetCode↔Real World map](../04_Patterns_Templates/05_LeetCode_RealWorld_Map.md)) and it is the direction that matters at work.

---

## Story 1: The Quadratic That Only Appeared at Scale (Accidentally-On² Node)

**SYMPTOM.** A background job processed a list of items against a list of already-seen IDs. Fine for months. Then a customer onboarded with 40,000 records and the job went from 8 seconds to *46 minutes*, and the pod started getting OOM-killed.

**THE CODE** (the shape, not the original):

```java
List<String> seen = new ArrayList<>();
for (Record r : incoming) {                 // n
    if (!seen.contains(r.getId())) {        // O(n) linear scan inside the loop!
        process(r);
        seen.add(r.getId());
    }
}
```

**NAIVE FIX.** "Add more memory / run it on a bigger box." This buys a small linear factor against a quadratic curve — the job still fails at the next customer. Throwing hardware at Θ(n²) is the classic misdiagnosis ([Enterprise 05](../10_Enterprise_Systems/05_RealWorld_Problems_DSA.md)).

**⏸️ YOUR TURN.** What is the repeated work, and which [A5 §1.2](A5_Designing_Your_Own_Algorithms.md) row is it?

**THE INSIGHT.** The repeated work is *"searches over the same set"* — `contains` re-scans a list that only grows. The row's tool is **an index**. Nothing about the algorithm's logic changes; only the membership structure does.

**THE SOLUTION.**

```java
Set<String> seen = new HashSet<>();          // O(1) expected membership
for (Record r : incoming) {
    if (seen.add(r.getId())) {               // add() returns false if present
        process(r);
    }
}
```

Θ(n²) → Θ(n). The 46 minutes became under 2 seconds.

**THE COST.** Memory: a `HashSet` costs more per element than an `ArrayList` (bucket array + node objects). At 40,000 IDs that is irrelevant; at 400 million it would itself be the problem — and that is exactly Story 10.

**TRANSFER.** This is the single most common performance bug in production code, and it is nearly invisible in review because *both* lines look innocent. Watch for **any O(n) operation inside a loop over n**: `list.contains`, `list.indexOf`, `list.remove(Object)`, string concatenation in a loop, or a DB query per iteration (the N+1 — [08_SQL](../08_SQL/14_Query_Optimization.md), [Enterprise 06](../10_Enterprise_Systems/06_RealWorld_Problems_Part2.md)).

> **The habit worth building:** when reviewing a loop, ask of every call inside it — *"what is this operation's complexity?"* Most quadratic disasters are one `contains` away from linear.

---

## Story 2: Counting Distinct Users Without the Memory (HyperLogLog)

**SYMPTOM.** An analytics dashboard needed "unique visitors today" per site, across millions of sites. The obvious implementation — a `Set` of user IDs per site — consumed tens of GB of RAM and kept OOMing the aggregation workers.

**NAIVE FIX.** Shard the sets across more machines. This works and costs linearly more machines forever — you have scaled the cost, not solved the problem.

**⏸️ YOUR TURN.** Before designing: is exact counting even *possible* in small memory? Argue it information-theoretically.

**THE INSIGHT.** To count distinct items *exactly*, you must be able to tell whether the next item was seen before — which requires retaining enough information to distinguish all seen items. That is Ω(n) bits. **Exact is provably impossible in sublinear space** ([A3 Lower Bounds](A3_Lower_Bounds_And_NP.md)).

So the design loop hits "impossible requirement," and the tool is [relaxing a currency](A5_Designing_Your_Own_Algorithms.md) — here, **exactness**.

**THE SOLUTION — HyperLogLog.** Hash each item; look at the position of the leftmost 1-bit in the hash. Seeing a hash with 10 leading zeros is evidence you have seen roughly 2¹⁰ distinct items (because that pattern has probability 2⁻¹¹ per item). Average that estimate over many independent buckets to cut the variance.

- **Space:** ~12 KB for a ~2% error, *regardless of cardinality* — billions of items.
- **Merge:** two HLLs combine by taking the per-bucket maximum, which makes it trivially distributable — critical for the sharded aggregation.

**THE COST.** ~2% error, and it cannot answer "was *this specific* user here?" — only "how many."

**TRANSFER.** Redis `PFCOUNT`, every large-scale analytics platform, and the whole [sketch family](../02_Data_Structures/A4_Randomized_Data_Structures.md): Count-Min for frequencies, t-digest for quantiles, Bloom for membership. **The trigger phrase is "roughly how many/how much"** — whenever the consumer of a number does not need it exact, sketches buy orders of magnitude.

---

## Story 3: The Cache That Made Things Slower (Thundering Herd / Stampede)

**SYMPTOM.** A team added a 60-second cache in front of an expensive query. Latency improved — until, once a minute, the database CPU spiked to 100% and requests timed out. **Adding the cache created a periodic outage.**

**NAIVE FIX.** Increase the TTL. This makes the spike *less frequent* and *no smaller*, and adds staleness. The spike is not caused by the TTL length.

**⏸️ YOUR TURN.** What happens at the exact moment the key expires, under 5,000 concurrent requests?

**THE INSIGHT.** At expiry, *every* in-flight request misses simultaneously, and all of them independently run the expensive query. One expiry event → 5,000 identical database queries in the same millisecond. The cache did not reduce load; it **synchronized** it.

This is a *concurrency* insight, not an algorithmic one — which is exactly why it surprises people who reasoned only about hit rates.

**THE SOLUTION.** Three complementary fixes, in increasing order of quality:

1. **Request coalescing / single-flight.** The first miss acquires a lock and computes; concurrent missers *wait for that result* rather than launching their own. 5,000 queries → 1.
2. **Probabilistic early expiration.** Each request refreshes the key with probability that rises as expiry approaches — so refresh happens *before* expiry, by one unlucky request, while everyone else still gets a hit.
3. **Stale-while-revalidate.** Serve the stale value immediately and refresh in the background. Best latency; requires tolerance for briefly-stale data.

**THE COST.** Single-flight adds a lock (and a failure mode: if the computing request hangs, the waiters hang). Probabilistic refresh does slightly more work than necessary. SWR serves stale data — a correctness decision, not a performance one.

**TRANSFER.** Any expiry-driven system: cache TTLs, token refresh (the [Ch61](../21_SDET_Playwright_Automation/03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md) parallel-refresh test is this exact bug), cron jobs that all fire at `00:00`, and clients that all reconnect after a deploy. **Whenever many independent actors share a deadline, they will synchronize** — the fix is always to *desynchronize* (jitter, coalesce, or refresh early). See also Story 9.

---

## Story 4: Resharding Without Downtime (Consistent Hashing)

**SYMPTOM.** A cache cluster used `hash(key) % N` to pick a server. Adding a 5th server to 4 remapped **~80% of all keys** — the cache emptied, every request became a miss, and the origin database fell over. Scaling up caused an outage.

**⏸️ YOUR TURN.** Why does `% N` remap so much? Compute the fraction of keys that keep their server when N goes 4 → 5.

**THE INSIGHT.** With `hash % N`, a key stays put only if `hash % 4 == hash % 5`, which is rare — roughly 1 in 5. **~80% of keys move.** The problem is that modulo mixes *every* key's placement with the *total count*, so changing the count perturbs everything.

You want a scheme where adding a server moves only the keys that server should own — about `1/N` of them.

**THE SOLUTION — consistent hashing.** Map both servers and keys onto a circle (hash space). A key belongs to the first server clockwise from it. Adding a server inserts one point on the circle and steals only the arc between it and its predecessor: **~1/N of keys move**, not 80%.

- **Virtual nodes:** hash each physical server to ~100–200 points on the ring, so arcs are evenly sized. Without this, a few servers randomly own huge arcs and load is badly skewed.

**THE COST.** More complex than modulo; needs the ring structure (a sorted map, `O(log n)` lookup) and virtual-node bookkeeping.

**TRANSFER.** Memcached/Redis clusters, Cassandra and DynamoDB partitioning, CDN edge selection, and any sharded system that must grow. **The general shape: when a placement function depends on the total count, changing the count is catastrophic** — design placement to be *local* instead.

---

## Story 5: The Feed That Could Not Fan Out (The Celebrity Problem)

**SYMPTOM.** A social feed used *fan-out-on-write*: when you post, write that post into every follower's timeline list. Fast reads (timeline is precomputed), acceptable writes — until an account with 30 million followers posted, and the write generated 30 million timeline inserts, saturating the cluster for minutes.

**NAIVE FIX.** Switch everyone to *fan-out-on-read* (compute the timeline at read time by merging the people you follow). This fixes the celebrity write and destroys read latency for ordinary users — a read now merges hundreds of lists on every timeline load.

**⏸️ YOUR TURN.** Both strategies are correct and both fail. What does that tell you about the design?

**THE INSIGHT.** The two strategies fail on *disjoint* populations: fan-out-on-write fails for accounts with huge follower counts; fan-out-on-read fails for ordinary users reading frequently. Since the failure sets are disjoint, **you do not have to choose globally** — you can apply each strategy where it wins. (Same shape as the LRU composition in [DS A5 §1.2](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md): two structures each acing half the contract.)

**THE SOLUTION — the hybrid.**
- **Ordinary accounts:** fan-out-on-write. Followers' timelines are precomputed; reads are a single list fetch.
- **Celebrity accounts** (above a follower threshold): do *not* fan out. Store the post once.
- **At read time:** fetch your precomputed timeline **and** merge in the recent posts of the few celebrities you follow — a k-way merge over a handful of sorted lists ([15_Heap](../04_Patterns_Templates/15_Heap_Plus_GreedySelection.md)).

**THE COST.** Two code paths, a threshold to tune, and a merge at read time (small, because you follow few celebrities). The system is more complex than either pure strategy — which is the honest price of not failing at either extreme.

**TRANSFER.** Any system with a **heavily skewed distribution**: hot keys in a cache, high-degree nodes in a graph, one tenant generating 90% of load in a multi-tenant system. **The pattern: when a power-law distribution breaks your uniform strategy, special-case the head and keep the uniform strategy for the tail.**

---

## Story 6: Rate Limiting That Did Not Lie (Sliding Window Counters)

**SYMPTOM.** An API enforced "100 requests per minute" with a counter reset every minute (a *fixed window*). A client discovered they could send 100 requests at 11:59:59 and 100 more at 12:00:01 — **200 requests in 2 seconds**, all within the limit. Downstream services fell over.

**⏸️ YOUR TURN.** Design a limiter with no boundary burst. What must you store, and how little can you get away with?

**THE INSIGHT.** A fixed window has no memory across the boundary — the reset discards exactly the information needed to prevent the burst. The requirement is really *"no more than 100 in **any** 60-second span,"* which is a sliding, not fixed, condition.

**THE SOLUTION LADDER** (each row trades memory against precision — the [three-currency dial](A5_Designing_Your_Own_Algorithms.md) again):

| Approach | Memory / key | Precision | Notes |
| --- | --- | --- | --- |
| Fixed window | 1 counter | ❌ boundary burst up to 2× | what broke |
| **Sliding window log** | timestamp per request | ✅ exact | 100 timestamps/key; expensive at scale |
| **Sliding window counter** | 2 counters | ✅ good approximation | **the production choice** |
| **Token bucket** | 2 numbers (tokens, last-refill) | ✅ + allows controlled bursts | what most gateways ship |

**The sliding window counter** keeps the current and previous window counts and interpolates:

```
estimate = currentCount + previousCount × (fraction of previous window still in range)

// At 12:00:15 with a 60s window (25% of the previous window still counts):
// estimate = current + previous × 0.75
```

Two integers per key, no boundary burst, error bounded by the assumption that the previous window's requests were uniformly spread.

**THE COST.** A small approximation error (it assumes uniformity within the previous window). In exchange: O(1) memory per key instead of O(limit).

**TRANSFER.** Every API gateway, login-attempt throttling, and the [SDET flakiness quarantine](../21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md) ("2 flakes in 7 days" is a sliding-window count). **Whenever a rule says "N per time period," ask whether the period is fixed or sliding** — the difference is a real exploit.

---

## Story 7: The Sort That Was Already Sorted (Timsort)

**SYMPTOM.** Not an outage — an *opportunity*. Python's list sort and Java's object sort were spending Θ(n log n) on data that was frequently *already mostly sorted*: log entries by timestamp, records appended in order, lists re-sorted after a small change.

**⏸️ YOUR TURN.** What property does real-world data have that random data does not, and how would you exploit it?

**THE INSIGHT.** Real data contains **natural runs** — maximal already-ordered subsequences. Merge sort ignores them entirely: it recursively splits down to single elements even when the input is one long sorted run. The structure was there and the algorithm was blind to it ([A5 §1](A5_Designing_Your_Own_Algorithms.md): "the structure the brute force ignores" can be a property of your *data distribution*).

**THE SOLUTION — Timsort** (Tim Peters, 2002):
1. Scan for natural runs (ascending, or strictly descending → reverse in place).
2. Extend short runs to a minimum length using **binary insertion sort** — genuinely faster below ~32–64 elements (better constants, cache-friendly, no allocation).
3. Merge runs using a stack with invariants that keep merges balanced.

**Result:** **O(n) on already-sorted input**, Θ(n log n) worst case, and **stable**.

**THE COST.** Substantially more complex than merge sort. And the sting in the tail: in 2015, researchers formally verifying the merge-stack invariant **found it was incorrect** — a bug that had shipped in Java and Python for years and could cause an `ArrayIndexOutOfBoundsException` on adversarial input. A sobering endorsement of [proof discipline](A1_Correctness_Proofs.md) and of the [validation protocol](A5_Designing_Your_Own_Algorithms.md).

**TRANSFER.** `Arrays.sort(Object[])` in Java, `sorted()` in Python, and V8. **The generalizable move: profile your actual data before assuming the worst case.** Adaptive algorithms — ones that get faster on structured input — are a whole design family (adaptive sorts, self-adjusting splay trees, LZ-family compression).

---

## Story 8: Finding the Bad Deploy in 9 Steps (Bisection)

**SYMPTOM.** A performance regression appeared "sometime in the last two weeks" — about 500 commits. Manual investigation of "recent suspicious changes" burned two days and found nothing.

**⏸️ YOUR TURN.** You can test any commit in ~10 minutes. What is the minimum number of tests to find the culprit, and what property must hold?

**THE INSIGHT.** "Is the bug present at commit X?" is a **monotonic predicate**: false for all commits before the bad one, true for all after. Monotonicity is exactly the precondition for [binary search](../04_Patterns_Templates/06_Binary_Search_Patterns.md).

500 commits → ⌈log₂ 500⌉ = **9 tests**. Two days → ninety minutes.

```bash
git bisect start
git bisect bad HEAD
git bisect good v1.2.0          # last known-good release
# git checks out the midpoint; you test and mark:
git bisect good   # or: git bisect bad
# ... 9 iterations later:
# "abc1234 is the first bad commit"

# And if the test is scriptable, it is fully automatic:
git bisect run ./perf-check.sh
```

**THE COST / THE PRECONDITION.** Bisection is only valid if the predicate is genuinely monotonic. It breaks when: the bug is **flaky** (test it multiple times per step, or the search converges on noise), the regression is the *interaction* of two commits, or intermediate commits do not build (`git bisect skip`, which is why "every commit builds" is a real engineering property — [13_DE Git](../13_Developer_Essentials/01_Git_Version_Control.md)).

**TRANSFER.** Debugging generally: bisect the *input* (which row of the 10M-row file crashes the parser?), bisect the *config* (disable half the plugins), bisect the *system* (is it the app, the network, or the DB?). **Any "somewhere in this large space" question with a monotonic test is 20 questions, not a linear scan.** This is the single highest-leverage algorithmic idea in day-to-day engineering.

---

## Story 9: The Retry Storm That Took Down the Service (Backoff + Jitter)

**SYMPTOM.** A downstream service had a 3-second blip. Every client retried immediately. The retries arrived in a synchronized wave, the service — already recovering — was knocked down again, and the cycle repeated. A 3-second blip became a **40-minute outage**.

**NAIVE FIX.** Add a fixed delay: retry after 1s. This does not help — all clients still retry *at the same time*, one second later. The wave is delayed, not dispersed.

**⏸️ YOUR TURN.** Two things are wrong with "retry immediately, then every 1s." Name both.

**THE INSIGHT.** Two independent defects:
1. **No backoff** — retry pressure does not decrease as the outage persists, so a struggling service never gets slack to recover.
2. **No jitter** — all clients share a clock-derived schedule, so they stay *synchronized*. (Same root cause as Story 3: independent actors sharing a deadline.)

**THE SOLUTION — exponential backoff with full jitter:**

```java
// AWS Architecture Blog's "full jitter" — the version that actually disperses.
long delay = Math.min(CAP, BASE * (1L << attempt));   // exponential: 1s, 2s, 4s, 8s...
long sleep = ThreadLocalRandom.current().nextLong(0, delay + 1);  // spread across [0, delay]
Thread.sleep(sleep);
```

**Why full jitter and not "delay ± 10%":** a small jitter band still leaves clients clustered. Sampling uniformly across the whole interval spreads the retries evenly, which is what actually flattens the load curve.

Pair it with a **circuit breaker**: after k consecutive failures, stop calling entirely for a cool-down, then let one probe through. This converts "hammer the dying service" into "check whether it recovered."

**THE COST.** Higher tail latency for individual requests (a retry may wait longer than strictly necessary), and bounded retries mean some requests fail that a persistent retry would eventually have served. Both are correct trades: **the system surviving is worth more than any single request succeeding.**

**TRANSFER.** Every HTTP client, message consumer, and database connection pool. And note the general principle across Stories 3, 6, and 9: **synchronized independent actors are a systemic hazard, and randomization is the standard cure.** Randomness is not only for algorithms; it is a load-shaping tool.

---

## Story 10: Deduplicating a Firehose in One Pass (Bloom Filters)

**SYMPTOM.** A crawler processed billions of URLs and had to skip already-visited ones. A `HashSet<String>` of visited URLs would need hundreds of GB — far beyond a single machine, and sharding it made every check a network round-trip.

**⏸️ YOUR TURN.** You may not store the URLs. What kind of wrong answer would still be *useful* here, and which direction must the error go?

**THE INSIGHT.** This is Story 2's move applied to *membership* instead of *counting*: exact membership requires storing the keys, so relax exactness. But the crucial design decision is **which direction the error may go**:

- A **false positive** ("we've seen this, skip it") → you skip a URL you have not crawled. Cost: one missed page. Tolerable.
- A **false negative** ("we haven't seen this") → you re-crawl. Cost: wasted work, possibly an infinite loop. **Not tolerable.**

So you need a structure with **false positives but never false negatives** — which is precisely the Bloom filter's guarantee, and the guarantee is *structural*: bits are only ever set, never cleared, so a member's bits are always still set ([DS A5 §9.1](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md)).

**THE SOLUTION.** A bit array of size `m` with `k` hash functions. `add(x)` sets `k` bits; `contains(x)` is true only if all `k` are set.

Sizing is engineerable, not guesswork: false-positive rate ≈ `(1 − e^(−kn/m))^k`, minimized at `k = (m/n)·ln 2`. **~10 bits per element gives ~1% false positives** — billions of URLs in a few GB, on one machine.

**THE COST.** ~1% of URLs never crawled, and you cannot delete from a standard Bloom filter (counting Bloom filters or cuckoo filters exist for that).

**TRANSFER.** Browser safe-browsing (a false positive costs one extra verification round-trip — precisely why the asymmetry is acceptable), LSM-tree read paths (skip runs that definitely lack the key — Story from [DS A5 §9.3](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md)), and CDN cache admission. **The design question to steal: "which direction may my error go, and what does each direction cost?"**

---

## The Cross-Story Patterns

Ten stories, five recurring shapes. These are what you should actually retain.

### Pattern A — Hidden quadratics (Stories 1, 5)
An O(n) operation inside an O(n) loop, or a per-item fan-out that scales with a second dimension. **Invisible in review, catastrophic at scale.** Diagnostic question: *what is the complexity of every call inside this loop?*

### Pattern B — Exactness is unaffordable (Stories 2, 10)
When exact answers provably need too much space, relax exactness — and **choose the error direction deliberately**. Diagnostic question: *does the consumer of this answer actually need it exact, and which way may it be wrong?*

### Pattern C — Synchronized independent actors (Stories 3, 6, 9)
Many clients sharing a deadline (cache expiry, window boundary, retry schedule) create load spikes that no individual actor intends. **Randomization/jitter is the cure.** Diagnostic question: *do many independent parties act on the same clock here?*

### Pattern D — Skewed distributions break uniform strategies (Stories 4, 5)
Power laws — celebrity accounts, hot keys, whale tenants — defeat designs that assume uniformity. **Special-case the head; keep the simple strategy for the tail.** Diagnostic question: *what does the 99.9th percentile of this distribution look like?*

### Pattern E — Monotonic predicates unlock binary search (Story 8)
Any "where in this large space" question with a monotone test collapses from linear to logarithmic. Diagnostic question: *is there a yes/no test whose answer flips exactly once across this space?*

---

## Old Algorithms vs New Inventions (What Industry Actually Does)

Your question — *are engineers using the old algorithms or creating new ones?* — has a precise answer, and it is worth being exact about.

### The distribution of real work

> [!NOTE]
> The percentages below are an **illustrative rule of thumb from experience, not measured data**.

| Tier | Frequency | What it looks like |
| --- | --- | --- |
| **Applying a classical algorithm** | ~90% | Story 1 (hash set), Story 8 (binary search), Story 5's merge step |
| **Composing/adapting classics** | ~9% | Story 5 (hybrid fan-out), Story 6 (window counter), Story 3 (coalescing) |
| **Inventing genuinely new** | ~1% | HyperLogLog (2007), the LSM tree (1996), Raft (2014) |

**The overwhelming majority of "algorithmic" engineering is recognition and adaptation**, not invention. Story 1 was solved by a 1950s idea. Story 8 is binary search from antiquity. This is why the [A5 chapters](A5_Designing_Your_Own_Algorithms.md) emphasize *deriving* over *cataloguing* — derivation is what lets you recognize and adapt.

### But new algorithms genuinely are being created — here is where

| Era | Invention | What forced it |
| --- | --- | --- |
| 1996 | **LSM tree** | Write-heavy workloads that B-trees served badly |
| 2007 | **HyperLogLog** | Web-scale cardinality with no memory |
| 2014 | **Raft** (Ongaro and Ousterhout) | Paxos was correct and nobody could implement it right — *understandability* as a design goal |
| 2014 | **Cuckoo filter** | Bloom filters cannot delete |
| 2010s–now | **Learning-augmented structures** | ML predictions as hints, with worst-case guarantees when wrong |
| 2010s–now | **Sketches everywhere** | Streaming data outgrew exact structures |

Notice the pattern in that right-hand column: **new algorithms are forced by new constraints**, not invented for elegance. Web scale forced sketches. Cheap SSDs + write-heavy logging forced LSM trees. Human fallibility forced Raft. When your constraints are genuinely novel, invention is on the table — and that is precisely the situation the [A5 design loop](A5_Designing_Your_Own_Algorithms.md) is for.

### What this means for you

1. **Master recognition first** — 90% of the value. Story 1 is a career-long recurring bug.
2. **Practice composition** — 9%, and it is what senior engineers actually do (Stories 3, 5, 6).
3. **Know the design method** — 1%, but it is also what lets you *read and evaluate* new work, and what you reach for when your constraint really is novel.

---

## 🏋️ Practice Challenges

**Challenge 1 — Diagnose from symptom.** For each symptom, name the likely algorithmic cause and the fix, without looking back:
   a. "The job is fine in staging, times out in production with the big customer."
   b. "Every hour on the hour, our DB CPU spikes to 100% for 30 seconds."
   c. "We added a server to the cache cluster and the site went down."
   d. "One tenant's activity makes the whole system slow for everyone."
   e. "The bug appeared somewhere in the last 300 commits."

**Challenge 2 — Design the error direction.** You must deduplicate payment webhook deliveries (the provider guarantees at-least-once). Would you use a Bloom filter? Argue both directions of error in *this* domain, and state your decision. *(Careful — this one differs from Story 10.)*

**Challenge 3 — The hybrid.** Design a notification system where most users have <100 followers but some have millions, notifications must arrive within 5 seconds, and the system must survive a celebrity event. Specify both paths and the threshold, and say how you would choose the threshold from data.

**Challenge 4 — Find your own war story.** In your current codebase at work, find one loop with an O(n) call inside it, or one place where many clients share a deadline. Write it up in this chapter's format (SYMPTOM → INSIGHT → SOLUTION → COST → TRANSFER). **This is your Lane C action for the week** ([FTE plan](../12_Daily_Practice/00_FTE_CONVERSION_PLAN_2026.md)) — bring it to your team.

---

## 📎 Cross-References

- [A5: Designing Your Own Algorithms](A5_Designing_Your_Own_Algorithms.md) — the design loop these stories are traced through
- [DS A5: Designing Your Own Data Structures](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md) — Bloom, HLL, LSM derivations
- [13: Algorithms In Production](13_Algorithms_In_Production.md) — the production-constraints companion
- [A4: Randomized Algorithms](A4_Randomized_Algorithms.md) — the machinery behind jitter and sketches
- [00_ALGORITHM_TIMELINE](00_ALGORITHM_TIMELINE.md) — when each was invented and why
- [10_Enterprise/08 Real-World Incidents](../10_Enterprise_Systems/08_RealWorld_Incidents_DSA.md) — enterprise incident classes
- [21_SDET Ch43: SDET War Stories](../21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/43_Real_World_SDET_War_Stories.md) — the testing-side equivalent

---

**Navigation**: [← 20: DSA Patterns PDF Coverage Map](20_DSA_Patterns_PDF_Java_Coverage_Map.md) | [📚 Algorithms Index](00_INDEX.md) | [A5: Designing Your Own Algorithms →](A5_Designing_Your_Own_Algorithms.md)

---

## 🏢 Enterprise Lens — Algorithm War Stories

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Incident reviews, SRE playbooks, design reviews |
| **Failure modes** | Treating incidents as one-off bugs instead of classes of bug |
| **Testing and verification** | Turn each story into a test case and a dashboard alert |

---

## Reality Check

**"These stories are interesting but they're other companies' problems"** → Story 1 (the O(n) call inside a loop) is in almost every codebase over a year old, including yours. Stories 3, 6, and 9 appear the moment you have more than one client and a timeout. The stories are chosen because they *recur* — they are the algorithmic shapes production reliably produces, which is why Challenge 4 asks you to find one in your own code this week rather than admire someone else's.

**"The engineers who solved these must have known the algorithm already"** → They mostly derived the *need* first and found the tool second. The HyperLogLog team started from "exact is impossible in this memory," which is a lower-bound argument, not a recollection. The fan-out hybrid came from noticing two strategies failed on disjoint populations. **Recognizing the shape of the problem is the transferable skill; the tool's name is lookup-able** — which is exactly why the diagnostic questions in the cross-story patterns matter more than the algorithm names.

**"Real engineering is mostly inventing new algorithms"** → It is ~90% recognizing and applying classics, ~9% composing and adapting them, ~1% genuine invention. Story 1 was fixed by a 1950s idea and Story 8 by an ancient one. The romantic picture of constant invention leads people to over-value exotic knowledge and under-value the recognition that prevents quadratic disasters — the reverse of the actual value distribution.

**"Approximate answers are a compromise you accept when you fail to do it exactly"** → Approximation is frequently the *correct* engineering choice, not a concession: exact distinct-counting is provably impossible in sublinear space, so HyperLogLog is not a weaker hash set — it is the answer to a different, better-posed question. The mature move is asking whether the consumer needs exactness at all, and — as Story 10 shows — **which direction the error may go**, because that asymmetry is often what makes the whole approach viable.

**"Once I know these ten stories, I can recognize production problems"** → Ten stories give you five patterns (§Cross-Story Patterns), and the patterns are what generalize — but recognition is built by *repeatedly attempting diagnosis*, not by reading solved cases. That is why each story has a ⏸️ marker and why Challenge 4 is the one that matters: the story you find and write up yourself is worth more than the ten you read, because it is the one that builds the reflex of looking.
