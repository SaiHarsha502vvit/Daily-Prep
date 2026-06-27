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

## 0. War Stories — When the Fast Path Bites Back

### Story 1: Sharding broke test isolation (worker-shared state)

A team enabled `--shard=1/4` and saw flakiness jump from 2% to 19%. The suite had 600 tests; the failures were random-looking and never the same test twice.

Root cause: the team had a `globalSetup` that seeded a shared test database with a fixed dataset. With sharding, four CI agents ran simultaneously. All four called the same `globalSetup` function against the same database. Agents would seed records, then another agent would delete them in teardown, then the first agent's tests would fail finding no records.

Fix: test data namespaced by shard number:

```typescript
// globalSetup.ts
const shardIndex = parseInt(process.env.SHARD_INDEX ?? '0');
const prefix = `shard-${shardIndex}`;
await db.seed({ prefix }); // each shard seeds prefix-scoped records
```

**Lesson:** Sharding adds concurrency. Concurrency exposes shared-state bugs that were invisible with sequential runs. Before enabling `--shard`, audit every `globalSetup` and `globalTeardown` for shared resources.

### Story 2: Test selection skipped the failing test for 3 weeks

A team implemented git-diff-based test selection. Only tests that imported changed files would run on PRs. A backend developer changed `services/pricing.service.ts`. The affected tests for pricing were selected and ran. They passed.

Three weeks later, a customer reported a UI bug: the pricing display on the checkout page was wrong. The test covering it: `tests/checkout/order-summary.spec.ts`. Why hadn't it caught the regression?

The import chain was: `order-summary.spec.ts` → `OrderSummaryPage.ts` → `formatCurrency.util.ts`. The test imported a utility, not the service. The service change didn't affect `formatCurrency.util.ts` directly — it affected it through a runtime dependency (the API response shape), not a static import.

The test selection correctly followed the static import graph. But the real dependency was dynamic (API response format), which the import graph can't see.

**Lesson:** Static import analysis misses runtime dependencies: API contracts, event buses, environment variables, database schema. Test selection reduces CI time but is not a substitute for running the full suite periodically. Run full suite nightly; run affected-only on PRs.

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
        with: { node-version: "20" }
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
import { execSync } from "child_process";
import * as path from "path";

const changed = execSync("git diff --name-only origin/main...HEAD")
  .toString()
  .split("\n")
  .filter(Boolean);

const ALWAYS_RUN_SMOKE = changed.some((f) =>
  /package\.json|playwright\.config|fixtures\//.test(f),
);
if (ALWAYS_RUN_SMOKE) {
  process.stdout.write("--grep @smoke\n");
  process.exit(0);
}

// Map a changed POM/util to its likely test
const testFiles = new Set<string>();
for (const file of changed) {
  if (file.endsWith(".spec.ts")) {
    testFiles.add(file);
  } else if (file.includes("websites/")) {
    const site = file.split("/")[1];
    testFiles.add(`tests/${site}`);
  }
}

if (testFiles.size === 0) {
  process.exit(0); // nothing relevant changed
}
console.log([...testFiles].join(" "));
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

---

## 9. Time-Based Sharding vs File-Based Sharding

Playwright uses file-based hashing for shard assignment: a hash of the test file path modulo N determines which shard runs it. This is stable — the same test always goes to the same shard — which means shard-to-shard variance is bounded by the number of files, not by test duration.

```bash
# Playwright's shard assignment logic (simplified)
# shard_index = hash(test_file_path) % total_shards
npx playwright test --shard=1/4  # Runs ~25% of files, same ones every time
npx playwright test --shard=2/4  # Different 25%, same every time
```

This stability is a feature, not a bug. If shard 3 runs slowly every time, you know it contains slow files and can investigate those specifically. With time-based sharding, the same test might run on shard 1 today and shard 3 tomorrow, making historical comparisons noisy.

### Time-based alternatives that exist

**Jest shard** (`--shard=1/N`): Jest also uses file-based sharding but in CI environments with heavy parallelism, the scheduler distributes jobs to workers of varying capacity, so effective wall time per shard can vary even with even file distribution.

**Cypress parallel mode**: Cypress uses a different strategy — it distributes individual test files by historical timing data from their record API. This is closer to dynamic allocation (covered in Section 10) and requires their paid Record Dashboard, making it a commercial lock-in.

**Cucumber-JVM with TestNG**: Uses time-based distribution via `threadCount` + `dataProvider` parallelism. Each thread picks the next available test. The order is non-deterministic, making retry logic harder and shard stability impossible.

### Why time-based fails for E2E

E2E tests have two properties that make time-based distribution problematic:

1. **Variable execution time**: A UI test that navigates to a page and checks for an element might take 800ms. The same test on a slow CI runner or against a throttled staging environment might take 8 seconds. Time-based distribution assumes test duration is predictable.

2. **Cross-test dependencies**: Two tests that touch the same resource (a shared test database, a mock server) can cause one to wait for the other. File-based distribution keeps all tests that touch resource X on the same shard, avoiding cross-shard conflicts.

3. **State persistence**: If you use Playwright's `storageState` to preserve login across tests, tests that share state need to be on the same shard. With time-based distribution, a test that depends on a login state set by another test might land on a different shard and fail with "not logged in."

```typescript
// This pattern only works if both tests are on the same shard
test("setup: login", async ({ page }) => {
  await page.goto("/login");
  // ... login steps
  await context.storageState({ path: "storage-state.json" });
});

test.use({ storageState: "storage-state.json" });
test("dashboard loads", async ({ page }) => {
  // Depends on login state — must be on same shard as setup test
});
```

### When file-based hashing causes problems

The one legitimate case for alternative sharding: your test files are highly imbalanced. If one file has 400 tests and another has 2, shard distribution is even by file count but wildly uneven by test count. In this case:

```bash
# Check shard balance
npx playwright test --list  # Lists all test files
# Manually partition by grouping files into N buckets of similar total test count
```

Or use dynamic allocation (Section 10) to solve this properly.

---

## 10. Dynamic Shard Allocation

File-based hashing gives stability but not balance. If your 500-test suite has 400 tests in `auth.spec.ts` and 1 test in each of 100 other files, shard 1 gets ~400 tests and shards 2–4 get ~33 each. The slow shard dominates wall time.

Dynamic shard allocation solves this by reading historical test duration data and assigning tests to shards using a greedy bin-packing algorithm that aims for equal total duration per shard.

### Collecting historical duration data

After each CI run, extract test durations from the Playwright JSON report:

```typescript
// scripts/compute-test-durations.ts
import * as fs from "fs";
import * as path from "path";

interface TestDuration {
  file: string;
  testName: string;
  durationMs: number;
  lastRun: string;
}

function computeFileDurations(jsonReportPath: string): Map<string, number> {
  const report = JSON.parse(fs.readFileSync(jsonReportPath, "utf8"));
  const fileDurations = new Map<string, number>();

  for (const suite of report.suites ?? []) {
    const file = suite.file ?? "unknown";
    const fileDuration = suite.specs.reduce(
      (sum: number, spec: any) =>
        sum + (spec.tests[0]?.results[0]?.duration ?? 0),
      0,
    );
    fileDurations.set(file, (fileDurations.get(file) ?? 0) + fileDuration);
  }

  return fileDurations;
}

// Merge with historical data (stored in CI artifact or S3)
function mergeHistoricalData(
  current: Map<string, number>,
  historical: Map<string, number>,
  decayFactor = 0.7,
): Map<string, number> {
  const merged = new Map<string, number>();

  for (const [file, currentDuration] of current) {
    const historicalDuration = historical.get(file) ?? currentDuration;
    // Exponential moving average: recent runs count more
    merged.set(
      file,
      Math.round(
        decayFactor * historicalDuration + (1 - decayFactor) * currentDuration,
      ),
    );
  }

  return merged;
}

// Greedy bin-packing: assign each file to the shard with the current lowest total duration
function assignFilesToShards(
  fileDurations: Map<string, number>,
  numShards: number,
): Map<number, string[]> {
  const shards: Map<number, string[]> = new Map();
  const shardTotals: number[] = Array(numShards).fill(0);

  for (let i = 0; i < numShards; i++) shards.set(i, []);

  // Sort files by duration descending (pack big files first for better balance)
  const sortedFiles = [...fileDurations.entries()].sort((a, b) => b[1] - a[1]);

  for (const [file, duration] of sortedFiles) {
    // Find the shard with the minimum current total duration
    const minShard = shardTotals.indexOf(Math.min(...shardTotals));
    shards.get(minShard)!.push(file);
    shardTotals[minShard] += duration;
  }

  return shards;
}

// Usage
const currentDurations = computeFileDurations("blob-report/test-results.json");
const historicalData = new Map<string, number>(); // loaded from CI cache
const avgDurations = mergeHistoricalData(currentDurations, historicalData);
const shardAssignment = assignFilesToShards(avgDurations, 4);

// Output: shard 1 → ['auth.spec.ts', 'checkout.spec.ts'], etc.
console.log(JSON.stringify(Object.fromEntries(shardAssignment), null, 2));
```

### Balancing in CI

```yaml
- name: Compute optimal shard assignment
  id: shard-plan
  run: |
    node scripts/compute-test-durations.js \
      --results blob-report/test-results.json \
      --shards 4 \
      --output shard-plan.json

- name: Run shard 1
  run: npx playwright test $(jq -r '.["0"] | join(" ")' shard-plan.json)

- name: Run shard 2
  run: npx playwright test $(jq -r '.["1"] | join(" ")' shard-plan.json)
# ... shards 3 and 4
```

### Trade-offs of dynamic allocation

|                   | Static (file hash)             | Dynamic (duration-based)                 |
| ----------------- | ------------------------------ | ---------------------------------------- |
| Stability         | Same files → same shard always | Files can move between shards            |
| Balance           | Can be imbalanced by file size | Aims for equal duration                  |
| Setup effort      | None                           | Requires historical data pipeline        |
| Failure isolation | Easy (same file, same shard)   | Harder (file moves, harder to reproduce) |
| Best for          | Stable file sizes              | Highly imbalanced test files             |

For most teams: **start with static**. If a single slow-shard problem persists after profiling the slow files, evaluate dynamic allocation.

---

## 11. Test Impact Analysis with madge

Madge is a dependency graph tool for JavaScript/TypeScript. It builds an import graph from your source files and tells you which modules depend on which. Combined with a git diff, this gives you precise test selection — only run tests that transitively depend on changed code.

### Building the import graph

```bash
# Install madge
npm i -D madge

# Generate import graph for all TypeScript files
npx madge --extensions ts,tsx --json --include 'src/**/*.ts' --exclude 'src/**/*.test.ts' src/ > import-graph.json

# Visualise the graph (generates a dot file for graphviz)
npx madge --extensions ts --image graph.png src/
```

The output `import-graph.json` maps each module to the list of modules it imports:

```json
{
  "src/services/OrderService.ts": [
    "src/models/Order.ts",
    "src/clients/PaymentClient.ts"
  ],
  "src/pages/CheckoutPage.ts": [
    "src/services/OrderService.ts",
    "src/components/CartSummary.ts"
  ]
}
```

### Transitive dependency traversal with ts-morph

Madge gives you direct imports. To find all tests that **transitively** import a changed file, traverse the graph:

```typescript
// scripts/find-affected-tests.ts
import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

interface ImportGraph {
  [filePath: string]: string[]; // file → files it imports
}

// Build import graph using ts-morph
function buildImportGraph(sourcePaths: string[]): ImportGraph {
  const project = new Project();
  const graph: ImportGraph = {};

  sourcePaths.forEach((filePath) => {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const imports: string[] = [];

    sourceFile.getImportDeclarations().forEach((decl) => {
      const moduleSpec = decl
        .getModuleSpecifier()
        .getText()
        .replace(/['"]/g, "");
      // Resolve relative imports
      if (moduleSpec.startsWith(".")) {
        const resolved = path.resolve(path.dirname(filePath), moduleSpec);
        imports.push(resolved);
      }
    });

    graph[filePath] = imports;
  });

  return graph;
}

// Find all test files that transitively depend on changed files
function findAffectedTests(
  changedFiles: string[],
  importGraph: ImportGraph,
): Set<string> {
  const affected = new Set<string>();
  const queue = [...changedFiles];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Find all files that import current (reverse edges)
    for (const [file, imports] of Object.entries(importGraph)) {
      if (
        imports.some((imp) => imp.includes(current) || current.includes(imp))
      ) {
        if (file.includes(".spec.ts") && !affected.has(file)) {
          affected.add(file);
        } else if (!file.includes(".spec.ts")) {
          // Non-test file — continue traversal
          if (!queue.includes(file)) queue.push(file);
        }
      }
    }
  }

  return affected;
}

// Usage
const changedFiles = execSync("git diff --name-only origin/main...HEAD")
  .toString()
  .split("\n")
  .filter(Boolean);

const importGraph = buildImportGraph(findAllSourceFiles("src/"));
const affectedTests = findAffectedTests(changedFiles, importGraph);

console.log([...affectedTests].join("\n"));
```

### Running only affected tests

```bash
# scripts/run-affected.sh
#!/usr/bin/env bash
set -euo pipefail

AFFECTED=$(node scripts/find-affected-tests.js)

if [ -z "$AFFECTED" ]; then
  echo "No affected tests found — running smoke suite"
  npx playwright test --grep @smoke
else
  echo "Running affected tests:"
  echo "$AFFECTED"
  npx playwright test $AFFECTED
fi
```

---

## 12. Git-Diff Driven Test Selection

A robust `affected-tests` script needs to handle edge cases that simple path heuristics miss: deleted files, renamed imports, shared utilities, and fixture files.

### Complete implementation

```typescript
// scripts/affected-tests.ts
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface TestFile {
  path: string;
  testNames: string[];
  imports: string[];
}

// Parse git diff to get changed files
function getChangedFiles(baseRef: string = "origin/main"): string[] {
  try {
    return execSync(`git diff --name-only ${baseRef}...HEAD`, {
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => f.trim().length > 0);
  } catch {
    console.warn("Could not diff against origin/main — using HEAD~1");
    return execSync("git diff --name-only HEAD~1", { encoding: "utf8" })
      .split("\n")
      .filter((f) => f.trim().length > 0);
  }
}

// Check for high-impact changes that always warrant full smoke
function requiresFullSmoke(files: string[]): boolean {
  const SMOKE_TRIGGERS = [
    /package\.json$/, // dependencies changed
    /playwright\.config/, // config changed
    /fixtures\.ts$/, // shared fixtures changed
    /conftest\.ts$/, // test setup changed
    /test-data\.json$/, // shared test data changed
    /\.github\/workflows/, // CI pipeline changed
  ];

  return files.some((f) => SMOKE_TRIGGERS.some((r) => r.test(f)));
}

// Map changed production files to test files via import graph
function findAffectedTests(changedFiles: string[]): string[] {
  // Load the import graph from madge output
  const graphPath = "import-graph.json";
  let importGraph: Record<string, string[]> = {};

  try {
    importGraph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
  } catch {
    console.warn("No import graph found — falling back to path heuristics");
    return fallbackPathHeuristics(changedFiles);
  }

  // Build reverse graph: which files depend on which
  const dependents: Record<string, string[]> = {};
  for (const [importer, imports] of Object.entries(importGraph)) {
    for (const imported of imports) {
      if (!dependents[imported]) dependents[imported] = [];
      dependents[imported].push(importer);
    }
  }

  // BFS from changed files through the import graph
  const affected = new Set<string>();
  const queue = [...changedFiles];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Find all files that import current (directly or transitively)
    for (const [importedFile, importingFiles] of Object.entries(dependents)) {
      if (
        importedFile.includes(current) ||
        current.includes(importedFile) ||
        path.basename(importedFile, path.extname(importedFile)) ===
          path.basename(current, path.extname(current))
      ) {
        for (const f of importingFiles) {
          if (f.includes(".spec.ts") && !affected.has(f)) {
            affected.add(f);
          } else if (!f.includes(".spec.ts") && !queue.includes(f)) {
            queue.push(f);
          }
        }
      }
    }
  }

  return [...affected];
}

// Fallback when no import graph is available
function fallbackPathHeuristics(changedFiles: string[]): string[] {
  const testFiles = new Set<string>();

  for (const file of changedFiles) {
    if (file.includes(".spec.ts") || file.includes(".test.ts")) {
      testFiles.add(file);
    } else if (file.startsWith("src/")) {
      // src/OrderService.ts → tests/**/OrderService*.spec.ts
      const base = path.basename(file, path.extname(file));
      // Heuristic: look for matching spec files
      const specCandidates = execSync(
        `find tests -name "${base}*.spec.ts" 2>/dev/null`,
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      )
        .split("\n")
        .filter(Boolean);
      specCandidates.forEach((s) => testFiles.add(s));
    }
  }

  return [...testFiles];
}

// Main
const changedFiles = getChangedFiles();

if (requiresFullSmoke(changedFiles)) {
  console.log("@smoke"); // Signal to CI to run smoke only
  process.exit(0);
}

const affectedTests = findAffectedTests(changedFiles);

if (affectedTests.length === 0) {
  // No affected tests found — run a minimal smoke
  console.log("@smoke");
  process.exit(0);
}

// Output file paths for playwright
console.log(affectedTests.join(" "));
```

### Edge cases handled

| Edge case               | How it's handled                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Deleted file            | `git diff --name-only` includes deleted files; findAffectedTests checks if any test imported the deleted file |
| Renamed import          | ts-morph resolves the renamed path; the import graph will have the new name                                   |
| Shared fixture changed  | `requiresFullSmoke` catches `fixtures.ts` changes and triggers @smoke                                         |
| No import graph exists  | Falls back to path heuristics, then falls back to @smoke                                                      |
| New file (not in graph) | Won't appear in changed files from diff — but new files that import nothing don't need tests                  |
| Tests over-shattering   | Each changed file triggers only its own test; shared util triggers all tests that import it                   |

### Testing the script

```bash
# Test with a known change
echo "Test: Change OrderService, expect checkout.spec.ts and order.spec.ts"
echo "src/services/OrderService.ts" | node scripts/affected-tests.js

# Verify smoke triggers
echo "Test: Change fixtures.ts, expect @smoke"
echo "src/fixtures.ts" | node scripts/affected-tests.js
```

---

## 13. Monorepo Sharding

In a monorepo (Nx, Turborepo,pnpm workspaces), multiple applications share a single Playwright config and test directory. This changes the sharding strategy because:

- A single shard run includes tests for all apps
- You may want app-level parallelism (app A on shard 1-2, app B on shard 3-4)
- `playwright.config.ts` is shared but each app has its own `package.json` dependencies

### Project-level sharding

Playwright's built-in project filtering handles this cleanly:

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    {
      name: "web-app",
      testDir: "./apps/web-app/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-app",
      testDir: "./apps/mobile-app/e2e",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "admin-dashboard",
      testDir: "./apps/admin-dashboard/e2e",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
```

```yaml
# Nx-style CI with project sharding
jobs:
  e2e:
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci

      # Each shard runs only apps affected by the PR + smoke
      - name: Determine affected apps
        id: affected-apps
        run: |
          CHANGED=$(git diff --name-only origin/main...HEAD | cut -d/ -f1-2 | sort -u)
          echo "apps=$CHANGED" >> $GITHUB_OUTPUT

      - name: Run web-app tests (sharded)
        if: contains(matrix.shard <= 2, true)
        run: npx playwright test --project=web-app --shard=${{ matrix.shard % 2 + 1 }}/2

      - name: Run admin-dashboard tests (sharded)
        if: contains(matrix.shard > 2, true)
        run: npx playwright test --project=admin-dashboard --shard=${{ (matrix.shard - 2) % 2 + 1 }}/2
```

### Turborepo pipeline sharding

```json
// turbo.json
{
  "pipeline": {
    "test:e2e": {
      "dependsOn": ["^build"],
      "outputs": ["blob-report/**"],
      "inputs": ["e2e/**/*.ts", "src/**/*", "package.json"]
    }
  }
}
```

With Turborepo's cache, if neither `e2e/` nor `src/` has changed, the test task is cached and skipped entirely. Combine with the affected-tests script:

```bash
# In CI, before running tests
CHANGED=$(git diff --name-only origin/main...HEAD)
if echo "$CHANGED" | grep -q 'apps/web-app/'; then
  npx turbo test:e2e --filter=web-app --shard=1/2
fi
```

### Project-level vs file-level sharding

| Strategy          | How it works                                                           | Best for                                  |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| **Project-level** | Each project (app) is a Playwright project; shard at the project level | Monorepo with 2–5 distinct apps           |
| **File-level**    | All projects combined; Playwright distributes test files across shards | Single suite, 1 app                       |
| **Hybrid**        | Project-level first (apps), then file-level within each app            | Large monorepo, many apps with many tests |

---

## 14. Anti-Patterns

### 1. Sharding without `fail-fast: false`

With `fail-fast: true` (default in some CI configs), if shard 1 fails, shards 2–4 are cancelled. You only see the first shard's failures. The other 75% of the suite might also have failed, but you'll never know.

```yaml
# Always set fail-fast: false for sharded runs
jobs:
  e2e:
    strategy:
      fail-fast: false # Critical!
      matrix:
        shard: [1, 2, 3, 4]
```

### 2. Forgetting to merge reports

After a 4-shard run, you have 4 HTML reports, 4 JUnit XMLs, 4 Allure results. Engineers open one and miss failures in the others.

```yaml
# Always merge
- name: Merge Playwright reports
  run: npx playwright merge-reports --reporter=list ./blob-reports
```

Document this prominently in your CI readme. New engineers always forget this.

### 3. Using time-based sharding for E2E tests

As covered in Section 9, time-based distribution fails for E2E because of unpredictable duration and cross-test state. Stick to Playwright's file-based `--shard`.

### 4. Not handling shard-skew (one shard gets all slow tests)

This happens when one test file has disproportionately many tests. Static file hashing puts all those tests on the same shard, making it 80% of wall time.

Detect it:

```bash
# After a run, check durations per shard
for shard in blob-reports/shard-*/; do
  echo "=== $shard ==="
  cat "$shard"/playwright-report/data/test-results.json 2>/dev/null \
    | jq '[.[] | select(.status=="passed" or .status=="failed") | .duration] | add'
done
```

If one shard consistently has 3× the duration of others, investigate: likely one file has 40% of all tests. Split it or use dynamic allocation.

### 5. Running the full suite when only docs changed

```bash
# Wrong: running full suite on docs-only PR
git diff --name-only | xargs -I{} npx playwright test
# This runs zero tests (no .spec.ts files changed) but your CI step succeeds
```

Your affected-tests script should detect `README.md`, `docs/`, `*.md` changes and explicitly run `@smoke` or `@docs` tag instead of nothing.

### 6. No fallback to smoke when the affected-tests script fails

```typescript
// scripts/affected-tests.ts — ALWAYS has a fallback
try {
  const affected = findAffectedTests(changedFiles);
  if (affected.length === 0) {
    console.log("@smoke"); // Always output something
  } else {
    console.log(affected.join(" "));
  }
} catch (err) {
  console.error("affected-tests failed, falling back to @smoke:", err);
  console.log("@smoke"); // Never fail silently
}
```

### 7. Not caching node_modules between shards

Each matrix job runs `npm ci` independently. For 4 shards, that's 4× the install time. Cache node_modules:

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### 8. Ignoring test-skew across shards

Shard-skew doesn't just mean duration imbalance — it means **failure skew**. If the test file most likely to fail lands entirely on shard 1, then shard 1 will always be the "failing" shard, making trend analysis misleading.

```bash
# Check failure rate per shard historically
for i in 1 2 3 4; do
  echo "Shard $i failure rate:"
  jq '[.[] | select(.shard=='$i' and .status=="failed")] | length' all-runs.json
done
```

If one shard consistently has 2× the failures of others, the distribution is non-random (likely caused by a large test file on that shard). Split it.

---

## 15. Decision Matrix

Use this to choose your execution strategy:

| Scenario                           | Strategy                                        | Why                                                          |
| ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Suite < 15 min, < 200 tests        | No sharding needed                              | Overhead of sharding not worth it                            |
| Suite 15–60 min, 200–500 tests     | 2–4 way sharding only                           | Cut wall time without complexity                             |
| Suite < 10 min, team < 5           | Test selection (affected-tests)                 | Running fewer tests is better than running same tests faster |
| Suite > 60 min, > 500 tests        | Sharding + test selection combined              | Both needed: cut total tests AND reduce wall time per PR     |
| Monorepo, many apps                | Project-level sharding + test selection per app | Each app has its own test suite; affected-tests per app      |
| Team > 20 engineers, > 5 pipelines | Sharding + selection + merge infrastructure     | Enterprise scale needs all three                             |
| Flaky tests, high variance         | Sharding with fail-fast:false + report merge    | Need full picture of all failures                            |
| Solo dev, fast feedback needed     | No sharding, affected-tests only                | Minimise total tests run                                     |

**The transition signals**:

- PR feedback > 10 minutes → add sharding
- Affected-tests script returns > 80% of suite for most PRs → sharding is more valuable than selection
- Different apps in monorepo change independently → project-level sharding
- One shard consistently takes 3× longer → dynamic shard allocation or split the large test file

---

## 16. Senior SDET Perspective

### PR feedback latency is THE metric

The goal is not "run all tests." The goal is "give the engineer the right signal as fast as possible." These are different objectives. Running all tests for a 10,000-test suite gives you comprehensive signal but at 83 hours of wall time — useless. Running only the affected 50 tests for a PR touching one module gives you fast signal but misses regressions in shared code.

The right balance is: **affected-tests for precision, sharding for speed, smoke for confidence.**

### The 4-minute p50 benchmark

Industry research and SDET experience converge on a useful target: **p50 PR feedback ≤ 4 minutes**. This keeps engineers in flow state. At 4 minutes, an engineer can wait for feedback before context-switching to another task. At 25 minutes, the engineer has already moved on, started another task, and returning to the PR requires 15+ minutes to re-context.

```
PR Feedback Latency Impact
──────────────────────────
< 4 min   → In flow, waits for CI, context preserved
4–10 min  → Switches to review, returns quickly
10–25 min → Starts new work, CI becomes background noise
> 25 min  → Context switch complete, CI is ignored
```

Track this in your quality dashboard. If p50 is 12 minutes, that is the number to bring to the next planning meeting — 12 minutes of idle engineering time per PR, across 20 engineers, across 10 PRs/day = 40 engineer-minutes of wasted context-switching per day = 3.3 engineer-hours = roughly $300/day in lost productivity.

### Tracking the metrics that matter

Add this to your CI summary:

```yaml
- name: Print CI summary
  run: |
    echo "## Playwright Results"
    echo ">>> PR Feedback Latency: ${{ env.PR_FEEDBACK_SECONDS }}s"
    echo ">>> Tests Run: ${{ env.TESTS_RUN }}"
    echo ">>> Passed: ${{ env.TESTS_PASSED }} | Failed: ${{ env.TESTS_FAILED }}"
    echo ">>> Shard wall time: ${{ env.SHARD_TIME }}s"
    echo ">>> Selection: ${{ env.SELECTION_TYPE }} (smoke/affected/full)"
```

Surface these in your weekly report to leadership. "Mean PR feedback time reduced from 18 min to 6 min over the quarter" is a business value statement, not just a technical metric.

### The cost of CI wait time

```
Monthly CI compute cost model:
  20 engineers
  × 10 PRs/day
  × 30 days
  = 6,000 PR runs/month

  Option A: No sharding, 20 min/run = 2,000 CPU-minutes/run
  Option B: 4-way sharding, 5 min/run = 500 CPU-minutes/run

  Difference: 1,500 CPU-minutes/run × 6,000 runs = 9,000,000 CPU-min/month extra
  At $0.008/CPU-minute (GitHub Actions hosted): $72,000/year extra
```

Sharding and selection are not just developer experience improvements — they are cost optimisation.

---

## 17. DevSecOps Seed — Compute Budget Governance

### Setting per-job resource limits

Sharded runs consume N× compute. Without controls, teams accidentally create runaway workflows:

```yaml
jobs:
  e2e:
    # Prevent runaway parallelism
    concurrency:
      group: e2e-${{ github.ref }}
      cancel-in-progress: false # Don't cancel, but limit to 1 concurrent run per branch

    # Set explicit timeout (prevents hung test from burning budget)
    timeout-minutes: 30

    # Resource limits (for self-hosted runners)
    runs-on: [self-hosted, small] # Tagged by size: small/medium/large
```

### Monthly CI budget tracking

```bash
# scripts/ci-cost-report.sh
#!/usr/bin/env bash
# Run at month-end via scheduled workflow

gh api graphql -f query='
  query($org: String!, $from: DateTime!, $to: DateTime!) {
    organization(login: $org) {
      packages(first: 10) {
        nodes { name }
      }
    }
  }' \
  -f org=$GITHUB_ORG \
  -f from=$(date -d 'first day of last month' -u +%Y-%m-%dT00:00:00Z) \
  -f to=$(date -d 'first day of this month' -u +%Y-%m-%dT00:00:00Z)

echo "Monthly CI cost: $COST_USD"
if [ "$COST_USD" -gt "${MONTHLY_BUDGET:-5000}" ]; then
  echo "::warning::CI spend exceeded budget: \$${COST_USD} vs \$${MONTHLY_BUDGET}"
fi
```

### Spot instances for test runners

GitHub Actions hosted runners are already spot-priced. For self-hosted runners, use spot:

```yaml
# AWS EC2 spot for self-hosted runners
InstanceMarketOptions:
  MarketType: spot
  SpotOptions:
    SpotInstanceType: persistent
    InterruptionBehavior: stop # Stop and restart later, don't terminate
```

Spot instances can reduce compute costs by 60–70%. The trade-off: they can be interrupted. For test runners, this is acceptable — CI reruns the job anyway. For long-running jobs that cannot be interrupted, use on-demand.

### Artifact cost management

```bash
# Report artifact storage growth
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=your-ci-artifacts \
  --start-time $(date -d '30 days ago' -u +%s) \
  --end-time $(date -u +%s) \
  --period 86400 \
  --statistics Average

# Alert if storage grows > 50% month-over-month
if [ "$CURRENT_SIZE" -gt $((PREVIOUS_SIZE * 150 / 100)) ]; then
  echo "::warning::Artifact storage growing rapidly: ${PREVIOUS_SIZE} → ${CURRENT_SIZE}"
fi
```

---

## 18. Exercise — Complete Deliverable

### Objective

Build a GitHub Actions workflow with 4-way sharded Playwright tests, wire in an affected-tests script, and demonstrate the delta between a docs-only PR and a code-changing PR.

### Steps

1. **Add sharding to your workflow**

   Create `.github/workflows/sharded-e2e.yml` with 4-way shard matrix, `fail-fast: false`, and report merging. Use the `npx playwright merge-reports` command.

2. **Build the affected-tests script**

   Create `scripts/affected-tests.ts` using the file-path heuristic approach (or ts-morph import graph if comfortable). Handle these cases:
   - Changed `.spec.ts` files → run those directly
   - Changed `fixtures.ts` or `package.json` → output `@smoke`
   - Nothing relevant changed → output `@smoke` (never output nothing)

3. **Wire affected-tests into the workflow**

   ```yaml
   - name: Determine tests to run
     id: affected
     run: |
       SPECS=$(node scripts/affected-tests.js)
       echo "specs=$SPECS" >> $GITHUB_OUTPUT
   ```

4. **Open two PRs and test**

   **PR 1 — docs only**: Change only `README.md`. Time the run. Document: how many tests ran, final duration, what the script output.

   **PR 2 — code change**: Change a single service file (e.g., add a console.log to `OrderService.ts`). Time the run. Document: how many tests ran, final duration, what the script output.

5. **Calculate the delta**

   ```
   PR 1 (docs) → X tests, Y minutes
   PR 2 (code) → A tests, B minutes
   Delta: B − Y minutes saved, A − X additional tests run
   Ratio: X/A (what fraction of suite was run for code change)
   ```

6. **Document the experiment**

   In your `framework/` directory, create `docs/sharding-experiment.md` with:
   - Screenshots of both CI runs showing duration
   - The affected-tests output for each PR
   - The delta calculation
   - Recommendations for threshold tuning (e.g., at what file count does affected-tests provide more value than sharding alone?)

### Self-Grading Rubric

| Criterion                           | 0 — Not done   | 1 — Partially done            | 2 — Complete                                              |
| ----------------------------------- | -------------- | ----------------------------- | --------------------------------------------------------- |
| 4-way sharded workflow created      | No workflow    | Workflow exists but fails     | Workflow runs, shards correctly, merges reports           |
| affected-tests script implemented   | No script      | Script exists but no fallback | Script exists, handles all edge cases, has smoke fallback |
| affected-tests wired into CI        | Not wired      | Wired but not in matrix       | Fully wired, outputs used in playwright test command      |
| PR 1 (docs) timed and documented    | Not done       | Partially documented          | Screenshotted, duration recorded, test count noted        |
| PR 2 (code) timed and documented    | Not done       | Partially documented          | Screenshotted, duration recorded, test count noted        |
| Delta calculation in experiment doc | No calculation | Basic calculation             | Detailed breakdown with time saved and test ratio         |
| fail-fast: false confirmed          | Not set        | Set but untested              | Confirmed: one shard failure doesn't cancel others        |
| Report merging confirmed            | Not merged     | Partial merge                 | Full merged report available with all shards              |

**Total: /16**

**Passing score: 12/16**

**Target: 14/16** — anything less means the sharding infrastructure has gaps that would cause confusion in a production team context.


---

## Reality Check

**"More shards equals faster execution"** ? Each shard has overhead: CI runner startup, dependency installation, browser installation, and global setup. With 10-second overhead per shard, splitting a 60-second suite into 10 shards takes 10 seconds per shard plus 10 seconds overhead = 20 seconds per shard, slower than 2 shards at 40 seconds each. Optimal shard count balances parallelism benefit against per-shard overhead.

**"Sharding distributes tests evenly"** ? Playwright sharding splits tests by test FILE, not by test DURATION. A shard with one 60-second test file and a shard with ten 5-second test files both have roughly equal test count but drastically different execution times. The slow shard determines total CI time. Balance test files to have similar execution times, or use test-level sharding tools that distribute by historical duration.

**"Test selection based on changed files reduces CI time"** ? Test selection requires a mapping of source files to test files. This mapping is either: manual (maintained list that drifts out of date), static analysis (import graph that misses dynamic dependencies), or historical (coverage data from previous runs that may be stale). Incorrect test selection means skipping tests that should have run, missing regressions. Complement selection with periodic full-suite runs.

**"Parallel execution across shards is always safe"** ? Shards run on separate CI runners accessing shared test infrastructure: the same database, the same API endpoints, the same test accounts. Two shards creating a user with the same email collide. Two shards resetting the same test data interfere. Shard safety requires: unique test data per shard (include shard index in generated data) and no shared mutable state.

**"CI matrix builds replace custom sharding"** ? CI matrix builds (GitHub Actions matrix strategy) create parallel jobs easily but do not coordinate test distribution. Two matrix jobs might run overlapping tests. Playwright's built-in sharding (--shard=1/3) with matrix jobs ensures non-overlapping distribution. Use the matrix for infrastructure setup (different OS, different Node versions) and Playwright sharding for test distribution.
