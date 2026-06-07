# 48. Sharding & Test Selection — Running 10,000 Tests Fast Enough to Care

**Navigation**: [← 47. Allure & ReportPortal](./47_Allure_ReportPortal.md) | [Index](../00_INDEX.md) | [→ 49. Feature Flag Testing](./49_Feature_Flag_Testing.md)

---

## 5W1H

- **WHAT**: Two related techniques — **sharding** (split a suite across N machines) and **test selection** (only run tests likely affected by this PR).
- **WHY**: A 10k-test suite at 30 s per test = 83 hours. No human waits 83 hours for a PR. Sharding cuts wall time linearly; selection cuts which tests run at all.
- **WHO**: Any team where the full suite runs > 15 minutes.
- **WHEN**: As soon as PR feedback exceeds ~10 minutes. Earlier than that, your effort is better spent fixing flakes.
- **HOW**: Playwright's `--shard N/M` flag, GitHub Actions matrix, plus a layer that computes affected tests from the git diff.

---

## 1. Sharding — Playwright already does this

```bash
# Run shard 1 of 4
npx playwright test --shard=1/4
# Shard 2 of 4
npx playwright test --shard=2/4
# ...
```

Playwright stably hashes test files into N buckets. Same shard number → same tests, every time.

## 2. CI matrix wiring

```yaml
# .github/workflows/e2e.yml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
  merge-reports:
    if: always()
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - run: npx playwright merge-reports --reporter=html ./blob-report-*
      - uses: actions/upload-artifact@v4
        with: { name: html-report, path: playwright-report }
```

The `blob` reporter + `merge-reports` is the official way to recombine sharded runs into a single HTML report.

---

## 3. Test selection — only run what's affected

```
                            git diff origin/main...HEAD
                                       │
                                       ▼
                              files changed list
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
        production code          test files              shared utilities
              │                        │                        │
   touched files map ←─────────────────┴────────────────────────┘
              │
              ▼
   test files that import (transitively) any touched file
              │
              ▼
        playwright test <list>
```

### Cheap implementation — file path heuristics

```typescript
// scripts/affected-tests.ts
import { execSync } from 'child_process';
import * as path from 'path';

const changed = execSync('git diff --name-only origin/main...HEAD')
  .toString()
  .split('\n')
  .filter(Boolean);

const ALWAYS_RUN_SMOKE = changed.some((f) =>
  /package\.json|playwright\.config|fixtures\//.test(f)
);
if (ALWAYS_RUN_SMOKE) {
  process.stdout.write('--grep @smoke\n');
  process.exit(0);
}

// Map a changed POM/util to its likely test
const testFiles = new Set<string>();
for (const file of changed) {
  if (file.endsWith('.spec.ts')) {
    testFiles.add(file);
  } else if (file.includes('websites/')) {
    const site = file.split('/')[1];
    testFiles.add(`tests/${site}`);
  }
}

if (testFiles.size === 0) {
  process.exit(0); // nothing relevant changed
}
console.log([...testFiles].join(' '));
```

### Robust implementation — TS dependency graph

For accuracy, build a real import graph (via `ts-morph` or `madge`), then mark every test that transitively imports a changed file. Worth the effort once you have > 500 tests.

---

## 4. Combining sharding + selection

```yaml
- name: Compute affected tests
  id: affected
  run: echo "specs=$(node scripts/affected-tests.js)" >> $GITHUB_OUTPUT

- name: Run affected tests, sharded
  run: |
    if [ -z "${{ steps.affected.outputs.specs }}" ]; then
      echo "No affected tests — running smoke only"
      npx playwright test --grep @smoke --shard=${{ matrix.shard }}/4
    else
      npx playwright test ${{ steps.affected.outputs.specs }} --shard=${{ matrix.shard }}/4
    fi
```

This is the pattern at scale: **always run @smoke, plus everything affected.**

---

## 5. Common mistakes

1. **Sharding without `fail-fast: false`** — first shard fails, others cancel, you only see one error.
2. **Forgetting to merge reports** — engineers open shard-3 only and miss failures in shard-1.
3. **Time-based sharding** ("split tests by historical duration") sounds smart, gets you nothing for the complexity. Stick to Playwright's built-in.
4. **Path heuristics over-trust** — a util touched by one test file might be used by 50. Either run the affected file's tests AND a smoke sweep, or invest in the import graph.

---

## 6. Senior SDET perspective

The senior question is **PR feedback latency**, not "tests per minute." 4 minutes p50 = engineers stay in flow. 25 minutes p50 = they context-switch, queue up changes, and your CI bill triples.

Track this metric. Surface it. It's the most actionable number a test platform owner has.

---

## 7. DevSecOps seed

Sharded runs cost N× the compute. Set per-job CPU/RAM limits and total monthly budgets. Surprise CI bills are a real DevSecOps issue (cost governance is part of the discipline).

---

## 8. Exercise

1. Add a GitHub Actions workflow to [`framework/`](../framework/) that runs 4-way sharded.
2. Write `scripts/affected-tests.ts` with the simple path-heuristic approach.
3. Open two PRs: one touching only `README.md`, one touching a POM. Confirm the first runs only smoke and the second runs the related spec.
4. Time both. Note the delta.
