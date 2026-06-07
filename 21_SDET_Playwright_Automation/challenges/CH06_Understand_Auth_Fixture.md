# Challenge 06 — Understand `auth.fixture.ts`

> No code. Just deep understanding. Then re-implement from memory.

## Part 1 — Reading exercise

Read these two files:

- [`framework/fixtures/auth.fixture.ts`](../framework/fixtures/auth.fixture.ts)
- [`02_Core_Architecture/09_Parallel_Execution_Workers.md`](../02_Core_Architecture/09_Parallel_Execution_Workers.md)

## Part 2 — Draw the diagram

On paper, draw:

1. Four worker processes (Node.js processes) starting simultaneously.
2. Each one calling `acquireAccount()`.
3. Each one's offset (`workerIndex % ACCOUNTS.length`).
4. The lock file each one attempts first.
5. The retry path if their first choice is locked.

## Part 3 — Answer in writing (in your own notes)

1. **Why does worker offset prevent contention?**
   Hint: imagine all 4 workers starting and all trying `account-1.lock` first. What happens?

2. **What happens if a test crashes after `acquire` but before `release`?**
   Hint: what does the `stale` option in `proper-lockfile` do?

3. **Why a file lock and not a JavaScript `Map`?**
   Hint: how many JavaScript processes does a `--workers=4` run create?

4. **Why does `release` go in a `finally` block in `page.fixture.ts`?**
   Hint: what happens if the test body throws?

5. **What's the failure mode if `ACCOUNTS.length === 1` and `workers === 4`?**
   Hint: read the code carefully — what is the wait budget? What happens after it expires?

## Part 4 — Re-implement from memory

Close all reference material. In a new file `challenges/solutions/CH06/auth-from-memory.ts`, write `acquireAccount()` and `releaseAccount()` from scratch.

## Acceptance criteria

- Part 3 answers are in `challenges/solutions/CH06/answers.md` and explain *why*, not just *what*.
- Part 4 implementation:
  - Uses `proper-lockfile`.
  - Uses worker offset.
  - Has a wait budget with a clear error on exhaustion.
  - Tracks released functions in a `Map` keyed by account id.
- Diff your version against `framework/fixtures/auth.fixture.ts` — note every meaningful difference.

## Pass condition

You can explain the file to another engineer in 10 minutes, without notes.

## What this teaches

- The actual mental model behind parallel-safe test isolation.
- That "parallel" in Playwright means **separate OS processes**, not separate threads.
- Why locking primitives that work in-memory in one language often fail across processes.
