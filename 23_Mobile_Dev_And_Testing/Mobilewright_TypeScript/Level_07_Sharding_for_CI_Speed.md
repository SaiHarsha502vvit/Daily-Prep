# Level 7 — Sharding for CI Speed

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 6](Level_06_Multi_Platform_Project_Config.md)

---

## Basics — Two Different Axes of Parallelism, Not One

```bash
# --shard splits the SUITE across separate machines/CI jobs
npx mobilewright test --shard=1/4   # this machine runs shard 1 of 4
npx mobilewright test --shard=2/4   # a DIFFERENT machine runs shard 2 of 4

# --workers controls parallelism WITHIN a single machine's shard
npx mobilewright test --shard=1/4 --workers=2
```

These answer two genuinely different questions: `--shard` is "how do we split this suite across multiple separate CI runners entirely," while `--workers` is "how many tests run concurrently on the one runner we're currently on." Combining both multiplies actual parallelism — 4 shards × 2 workers each is 8-way parallelism total, across 4 separate machines.

---

## Concept — Why Device-Bound Testing Makes Sharding Different From Browser Sharding

[Playwright_Mobile_TypeScript never needed real device provisioning](../Playwright_Mobile_TypeScript/00_ROADMAP.md) — a browser context is cheap to spin up, and dozens can run concurrently on one machine with no real hardware constraint. A real Android emulator or iOS simulator is a genuinely heavier resource — each running instance consumes real CPU/RAM, and (critically) **two parallel workers generally can't safely share one running emulator instance**, since both would be driving the same app state simultaneously with no isolation between them.

The practical consequence: `--workers` on a mobile suite is bounded by *how many emulator/simulator instances the CI machine can actually run concurrently*, not by an arbitrary concurrency preference the way it might be for a browser suite. Setting `--workers=8` on a CI runner that can only actually boot 2 emulators at once doesn't produce 8-way parallelism — it produces contention, timeouts, or outright failures as workers compete for device resources that don't exist.

---

## Real-World Problem — Cutting a 40-Minute Suite Down for CI

```yaml
# .github/workflows/mobile-tests.yml (conceptual — Level 13's capstone builds this out fully)
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx mobilewright test --shard=${{ matrix.shard }}/4
```

Four CI jobs, each responsible for one quarter of the suite, running in parallel as separate matrix jobs — each gets its own runner, its own emulator/simulator, no device contention between shards since they're genuinely separate machines. A suite that takes 40 minutes serially can approach ~10 minutes wall-clock time this way, assuming the suite splits evenly.

---

## Solution — The Balance Assumption Sharding Depends On

Per Mobilewright's own CLI documentation, `--shard` splits work at the **test file** level (the same granularity as Playwright's own sharding) — not at the individual-test level. This assumption matters:

```
tests/
  login.spec.ts          (3 tests)
  checkout.spec.ts       (2 tests)
  settings.spec.ts       (2 tests)
  onboarding-flow.spec.ts (45 tests)   <- one file, disproportionately large
```

With 4 shards, if `onboarding-flow.spec.ts` lands entirely in one shard, that shard runs 45 tests' worth of work while the others run 2-3 files each — the total wall-clock time is bounded by the **slowest** shard, not the average, so an unbalanced suite doesn't actually get the full speedup the shard count implies. The fix isn't a Mobilewright-specific trick — it's the same general discipline as balancing any sharded test suite: keep individual spec files roughly comparable in size, and split a disproportionately large file like `onboarding-flow.spec.ts` into several smaller files if it's become a bottleneck.

---

## Challenges

### 🐛 Bug Hunt — Workers That Starve Each Other

```yaml
strategy:
  matrix:
    shard: [1, 2]
steps:
  - run: npx mobilewright test --shard=${{ matrix.shard }}/2 --workers=6
```

Each CI runner in this matrix only has enough resources to reliably run 2 emulator instances at once. Tests fail intermittently with device-connection timeouts, not assertion failures. Using [this level's own Concept section](#concept--why-device-bound-testing-makes-sharding-different-from-browser-sharding), diagnose the mistake.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `--workers=6` tells Mobilewright to try running 6 tests concurrently on a single runner that can only actually support 2 emulator instances at once — the extra 4 workers are competing for device resources that don't exist, producing exactly the device-connection timeouts described, which look like flakiness but are actually a resource-provisioning mismatch, not a test-logic problem at all. This is the exact trap [this level's Concept section](#concept--why-device-bound-testing-makes-sharding-different-from-browser-sharding) named directly — worker count for mobile suites needs to match real device capacity, not an arbitrary "more parallelism is better" instinct carried over from browser-based testing. The fix:

```yaml
- run: npx mobilewright test --shard=${{ matrix.shard }}/2 --workers=2
```

More total throughput, if still needed, should come from **more shards** (more separate CI machines, each within its own real device capacity) rather than **more workers** squeezed onto one machine beyond what it can actually run.

</details>

---

### 🎭 Two Truths and a Lie — Shards and Workers

**A.** `--shard=2/4` and `--shard=3/4` running on two separate CI machines execute completely disjoint sets of test files — no file runs in both shards.

**B.** Increasing `--workers` always produces proportionally faster suite completion, regardless of how many real emulator/simulator instances the machine can run.

**C.** An unevenly distributed suite (one huge spec file, several tiny ones) can make 4-way sharding deliver noticeably less than a 4x speedup, because total time is bounded by the slowest shard.

<details><summary>Which one's the lie</summary>

**B is the lie.** This is precisely [this level's own Bug Hunt](#-bug-hunt--workers-that-starve-each-other) — workers beyond what the machine's real device capacity can support don't add parallelism, they add contention, and can make things slower (timeouts, retries) rather than faster. Worker count has a real hardware ceiling that a browser-based suite's worker count generally doesn't share.

🔴 **Explanation:** A is true and is the basic mechanical guarantee sharding provides — each shard number gets a disjoint slice of the total test files, which is exactly what makes running them on separate machines safe and correct rather than duplicating work. C is true and is [this level's own Solution section](#solution--the-balance-assumption-sharding-depends-on) stated directly — sharding's speedup is bounded by the slowest shard, and an unbalanced split can leave real speedup on the table even with a high shard count.

</details>

---

**Next → [Level 8: The Fixture Gap](Level_08_The_Fixture_Gap.md)**
