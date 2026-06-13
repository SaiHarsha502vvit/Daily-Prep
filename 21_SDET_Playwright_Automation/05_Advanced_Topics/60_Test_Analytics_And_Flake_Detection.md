# Chapter 60 — Test Analytics and Flake Detection

**Navigation**: [← 59. Docker](./59_Docker_For_Playwright.md) | [Index](../00_INDEX.md) | [→ 61. Leadership & Mentoring](./61_Leadership_And_Mentoring_Playbook.md)

---

## 5W1H

| | |
|---|---|
| **WHAT** | Systematic collection, analysis, and action on test suite data: duration trends, flakiness detection, cost-per-test computation, import-graph driven test selection, and dashboard design |
| **WHY** | A test suite that grows without metrics becomes a liability. Analytics expose what is slow, what is flaky, and what does not matter. Without data, teams optimize the wrong things and ship with blind spots |
| **WHO** | Senior and Principal SDETs who own test infrastructure, CI pipelines, and quality reporting. Also engineering managers who need objective quality signals for roadmap discussions |
| **WHEN** | When the suite exceeds 200 tests, when CI times cross the 10-minute mark, when flaky failures appear more than once per sprint, or when leadership asks "How good is our testing?" |
| **WHERE** | CI pipeline artifacts, historical JSON/XML reports, data warehouses (SQLite/Postgres), Allure/ReportPortal APIs, and custom dashboards |
| **HOW** | By instrumenting the test runner, persisting results into a queryable store, applying statistical and ML-based detection algorithms, and presenting findings in a dashboard that drives action |

---

## Table of Contents

1. [Why Test Analytics Matters at Scale](#1-why-test-analytics-matters-at-scale)
2. [Historical Test Duration Analysis](#2-historical-test-duration-analysis)
3. [Flake Detection Algorithms](#3-flake-detection-algorithms)
4. [ML-Based Flake Prediction Primer](#4-ml-based-flake-prediction-primer)
5. [Import-Graph Based Test Selection](#5-import-graph-based-test-selection)
6. [Cost-Per-Test Calculation](#6-cost-per-test-calculation)
7. [Allure Trends API Consumption](#7-allure-trends-api-consumption)
8. [Test Health Dashboard Design](#8-test-health-dashboard-design)
9. [Anti-Patterns: Analytics Edition](#9-anti-patterns-analytics-edition)
10. [Decision Matrix: Build vs Buy for Analytics](#10-decision-matrix-build-vs-buy-for-analytics)
11. [Senior/Principal SDET Perspective: Data-Driven Quality Conversations](#11-seniorprincipal-sdet-perspective-data-driven-quality-conversations)
12. [DevSecOps Seed: Anomaly Detection for Security Test Failures](#12-devsecops-seed-anomaly-detection-for-security-test-failures)
13. [Exercise: Build a Flake-Score Script from Playwright JSON Reports](#13-exercise-build-a-flake-score-script-from-playwright-json-reports)

---

## 1. Why Test Analytics Matters at Scale

### The Three Costs of an Unmeasured Test Suite

Every test in your suite consumes three resources continuously. Most teams only track the first:

| Cost Type | Formula (Simplified) | When It Bites |
|---|---|---|
| **CI Compute** | `workerMinutes x $/minute` | Crosses CI budget; PRs queue behind expensive suites |
| **Browser Cloud** | `browserMinutes x $/minute` | Teams on BrowserStack/Sauce Labs get surprise invoices |
| **Debugging Time** | `flakeCount x engineerHoursPerInvestigation x $/hour` | Silent killer — 20 flaky tests at 30 minutes each per week = 10 hours of engineering time evaporated |

> **Reality check**: If your 500-test suite runs in 12 minutes with 4 workers, but 8% of PRs fail on flaky tests that engineers re-run and investigate, your real CI cost is not 12 minutes. It is 12 minutes plus the average 1.3 re-runs per PR plus the debugging time. That 12-minute suite may cost 45 minutes of engineering attention per PR.

### PR Latency and Team Morale

PR latency is the time from code push to merge. Analytics tie test metrics directly to developer experience:

| Signal | Interpretation | Action |
|---|---|---|
| Mean PR latency increasing 10% per quarter | Suite growing faster than optimization | Audit slowest 10% tests |
| Flaky failure rate > 5% | Developers lose trust in CI | Quarantine + investigate, do not ignore |
| Coverage flat, test count rising 20% | Tests are duplicative or low-impact | Review test strategy |
| P95 duration > 3x median duration | A few tests dominate wall time | Profile and split or optimize |

### The Principal SDET View

At the principal level, your job is not to write tests — it is to ensure the test system produces actionable signal at a cost the business can sustain. Analytics is the language you use to translate "the tests are flaky" into "we are burning 12 engineering hours per sprint on investigations that find no product bugs."

> **Quality is not coverage. Quality is signal-to-noise ratio at a sustainable cost.**

---

## 2. Historical Test Duration Analysis

### The Data Problem

Playwright JSON reports contain per-test duration data, but they are overwritten on every run. To detect trends, you need a time-series store.

### SQLite Schema for Trend Storage

For teams without a data warehouse, a local SQLite database is sufficient for 10,000+ test records:

```typescript
// scripts/analytics/schema.ts
import { Database } from 'better-sqlite3';

const db = new Database('test_analytics.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS test_runs (
    run_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    git_sha         TEXT NOT NULL,
    branch          TEXT NOT NULL,
    run_timestamp   INTEGER NOT NULL,  -- epoch seconds
    total_tests     INTEGER NOT NULL,
    passed          INTEGER NOT NULL,
    failed          INTEGER NOT NULL,
    skipped         INTEGER NOT NULL,
    flaky           INTEGER NOT NULL,
    ci_worker_count INTEGER NOT NULL,
    wall_duration_ms INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS test_results (
    result_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id          INTEGER NOT NULL REFERENCES test_runs(run_id),
    test_file       TEXT NOT NULL,
    test_title      TEXT NOT NULL,
    project         TEXT NOT NULL,
    status          TEXT NOT NULL CHECK(status IN ('passed','failed','skipped','timedOut','interrupted')),
    duration_ms     INTEGER NOT NULL,
    retry_count     INTEGER DEFAULT 0,
    error_message   TEXT,
    error_type      TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_results_run ON test_results(run_id);
  CREATE INDEX IF NOT EXISTS idx_results_test ON test_results(test_file, test_title);
  CREATE INDEX IF NOT EXISTS idx_results_time ON test_results(run_id, duration_ms);
`);
```

### Parsing Playwright JSON Reports

```typescript
// scripts/analytics/ingestReport.ts
import * as fs from 'fs';
import { Database } from 'better-sqlite3';

interface PlaywrightReport {
  config: {
    workers: number;
    projects: Array<{ name: string }>;
  };
  suites: Array<{
    title: string;
    file: string;
    specs: Array<{
      title: string;
      tests: Array<{
        projectName: string;
        results: Array<{
          status: string;
          duration: number;
          retry: number;
          error?: { message: string };
        }>;
      }>;
    }>;
  }>;
}

export function ingestReport(reportPath: string, gitSha: string, branch: string): void {
  const db = new Database('test_analytics.db');
  const raw = fs.readFileSync(reportPath, 'utf-8');
  const report: PlaywrightReport = JSON.parse(raw);

  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let flaky = 0;
  let maxDuration = 0;

  const insertRun = db.prepare(`
    INSERT INTO test_runs (git_sha, branch, run_timestamp, total_tests, passed, failed, skipped, flaky, ci_worker_count, wall_duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertResult = db.prepare(`
    INSERT INTO test_results (run_id, test_file, test_title, project, status, duration_ms, retry_count, error_message, error_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const runTimestamp = Math.floor(Date.now() / 1000);

  const flattened: Array<{
    testFile: string;
    testTitle: string;
    project: string;
    status: string;
    duration: number;
    retry: number;
    errorMessage?: string;
  }> = [];

  for (const suite of report.suites) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        totalTests++;
        const result = test.results[test.results.length - 1];
        const status = result.status;
        if (status === 'passed') passed++;
        else if (status === 'failed') failed++;
        else if (status === 'skipped') skipped++;
        if (test.results.length > 1) flaky++;
        maxDuration = Math.max(maxDuration, result.duration);

        flattened.push({
          testFile: suite.file,
          testTitle: spec.title,
          project: test.projectName,
          status,
          duration: result.duration,
          retry: test.results.length - 1,
          errorMessage: result.error?.message,
        });
      }
    }
  }

  const runInfo = insertRun.run(gitSha, branch, runTimestamp, totalTests, passed, failed, skipped, flaky, report.config.workers, maxDuration);
  const runId = Number(runInfo.lastInsertRowid);

  for (const r of flattened) {
    const errorType = r.errorMessage ? classifyError(r.errorMessage) : null;
    insertResult.run(runId, r.testFile, r.testTitle, r.project, r.status, r.duration, r.retry, r.errorMessage ?? null, errorType);
  }

  db.close();
}

function classifyError(message: string): string {
  if (message.includes('TimeoutError')) return 'TimeoutError';
  if (message.includes('locator')) return 'LocatorError';
  if (message.includes('expect')) return 'AssertionError';
  if (message.includes('net::')) return 'NetworkError';
  return 'Unknown';
}
```

### Querying Duration Trends

```typescript
// scripts/analytics/queries.ts
import { Database } from 'better-sqlite3';

const db = new Database('test_analytics.db');

export function getSlowestTests(days: number, limit: number = 20) {
  const stmt = db.prepare(`
    SELECT test_file, test_title,
           AVG(duration_ms) AS avg_duration,
           MAX(duration_ms) AS max_duration,
           COUNT(*) AS runs
    FROM test_results
    JOIN test_runs ON test_results.run_id = test_runs.run_id
    WHERE test_runs.run_timestamp > ?
    GROUP BY test_file, test_title
    ORDER BY avg_duration DESC
    LIMIT ?
  `);
  return stmt.all(Math.floor(Date.now() / 1000) - days * 86400, limit);
}

export function getTestDurationTrend(testFile: string, testTitle: string, days: number) {
  const stmt = db.prepare(`
    SELECT run_timestamp, duration_ms, status
    FROM test_results
    JOIN test_runs ON test_results.run_id = test_runs.run_id
    WHERE test_file = ? AND test_title = ?
      AND test_runs.run_timestamp > ?
    ORDER BY run_timestamp
  `);
  return stmt.all(testFile, testTitle, Math.floor(Date.now() / 1000) - days * 86400);
}
```

### Postgres Alternative (Team Scale)

When multiple CI workers write concurrently, SQLite contention becomes a problem. Migrate to Postgres with the same schema. Only the connection layer changes:

```typescript
// scripts/analytics/postgresStore.ts
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function ingestReportAsync(reportPath: string, gitSha: string, branch: string): Promise<void> {
  const raw = await fs.promises.readFile(reportPath, 'utf-8');
  const report = JSON.parse(raw);
  // ... same flattening logic ...
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const runRes = await client.query(
      `INSERT INTO test_runs (...) VALUES (...) RETURNING run_id`,
      [gitSha, branch, /* ... */]
    );
    const runId = runRes.rows[0].run_id;
    for (const r of flattened) {
      await client.query(
        `INSERT INTO test_results (...) VALUES (...)`,
        [runId, r.testFile, /* ... */]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

---

## 3. Flake Detection Algorithms

### What Is a Flaky Test?

A flaky test is a test that yields different outcomes (pass/fail) across runs without any code change. It is the single biggest destroyer of CI trust. The goal of flake detection is to identify these tests before they become a crisis.

### Algorithm 1: Pass-Rate Variance

The simplest algorithm flags tests whose pass rate falls below a threshold over a window:

```typescript
// scripts/analytics/flakeDetection.ts
function computePassRate(results: Array<{ status: string }>): number {
  if (results.length === 0) return 1;
  const passed = results.filter(r => r.status === 'passed').length;
  return passed / results.length;
}

export function detectFlakyByPassRate(
  testResults: Map<string, Array<{ status: string }>>,
  windowRuns: number = 30,
  threshold: number = 0.95,
): Array<{ testKey: string; passRate: number; totalRuns: number }> {
  const flaky: Array<{ testKey: string; passRate: number; totalRuns: number }> = [];
  for (const [testKey, results] of testResults.entries()) {
    const windowed = results.slice(-windowRuns);
    const passRate = computePassRate(windowed);
    if (passRate < threshold && windowed.length >= 10) {
      flaky.push({ testKey, passRate, totalRuns: windowed.length });
    }
  }
  return flaky.sort((a, b) => a.passRate - b.passRate);
}
```

> **Rule of thumb**: A test with < 95% pass rate over 30 runs is flaky. A test with < 90% pass rate is a CI emergency.

### Algorithm 2: Statistical Significance (Binomial Test)

Pass-rate variance is noisy for infrequently-run tests. A better approach tests whether the failure rate is statistically distinguishable from zero.

Use the exact binomial test: given `n` runs and `k` failures, compute the p-value for the hypothesis that the true failure rate is zero. If p < 0.05, the test is statistically flaky.

```typescript
// scripts/analytics/binomialFlake.ts
function binomialPValue(n: number, k: number): number {
  // P(X >= k) where X ~ Binomial(n, p=0.01) — assumes 1% baseline noise
  // For simplicity, we use a normal approximation with continuity correction
  const p0 = 0.01;
  const mu = n * p0;
  const sigma = Math.sqrt(n * p0 * (1 - p0));
  const z = (k - 0.5 - mu) / sigma;
  // Return approximate one-tailed p-value
  return 1 - normalCDF(z);
}

function normalCDF(x: number): number {
  // Abramowitz & Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

export function detectFlakyBinomial(
  results: Array<{ status: string }>,
  alpha: number = 0.05,
): { isFlaky: boolean; pValue: number; failureRate: number } {
  const n = results.length;
  const k = results.filter(r => r.status === 'failed').length;
  if (n < 10) return { isFlaky: false, pValue: 1, failureRate: 0 };
  const pValue = binomialPValue(n, k);
  return {
    isFlaky: pValue < alpha,
    pValue,
    failureRate: k / n,
  };
}
```

### Algorithm 3: Error-Message Clustering (String Similarity)

Not all failures of the same test are the same root cause. A test may fail with a timeout on Mondays (cold caches) and a locator error on Fridays (deploy timing). Clustering error messages helps distinguish multiple flakiness modes.

```typescript
// scripts/analytics/errorClustering.ts
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] =
        a[i - 1] === b[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[a.length][b.length];
}

function normalizedSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

export function clusterErrorMessages(
  errors: string[],
  similarityThreshold: number = 0.75,
): string[][] {
  const clusters: string[][] = [];
  for (const error of errors) {
    let placed = false;
    for (const cluster of clusters) {
      const representative = cluster[0];
      if (normalizedSimilarity(error, representative) >= similarityThreshold) {
        cluster.push(error);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([error]);
  }
  return clusters;
}
```

> **Insight from the field**: If a test has two distinct error clusters with similar frequency, it has two independent flakiness modes. Fixing one will not fix the other. This is why naive "re-run until pass" is dangerous — it masks multiple root causes.

---

## 4. ML-Based Flake Prediction Primer

### Why ML for Flake Prediction?

Reactive flake detection ("this test failed 3 times this week") is useful. Predictive flake detection ("this test has a 78% chance of failing next week") is transformative. It lets you prioritize investigation before the CI crisis.

### Feature Engineering

A lightweight flake predictor needs only a handful of features that are cheap to compute from your existing data:

```typescript
// scripts/analytics/features.ts
interface TestFeatures {
  testKey: string;                    // composite key: file + title
  errorTypeDiversity: number;         // unique error types / total failures
  avgDurationMs: number;              // historical average duration
  durationTrendSlope: number;         // slope of duration over last 20 runs
  fileAgeDays: number;                // days since test file last modified
  authorCount: number;                // number of unique git authors touching this file
  timeSinceLastChangeDays: number;    // days since last git change
  failureCountLast30: number;         // raw failure count
  retryRate: number;                  // retries / total runs
  testLengthLines: number;            // lines of code in the test
  usesWaitForTimeout: boolean;        // static analysis: contains waitForTimeout?
}

export function extractFeatures(
  testKey: string,
  history: Array<{ status: string; duration_ms: number; error_type: string | null }>,
  gitMetadata: { ageDays: number; authorCount: number; lastChangeDays: number; lines: number },
  sourceCode: string,
): TestFeatures {
  const failures = history.filter(h => h.status === 'failed');
  const errorTypes = new Set(failures.map(f => f.error_type).filter(Boolean));

  // Simple linear regression for duration trend
  const n = Math.min(history.length, 20);
  const recent = history.slice(-n);
  const xMean = (n - 1) / 2;
  const yMean = recent.reduce((s, h) => s + h.duration_ms, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    numerator += dx * (recent[i].duration_ms - yMean);
    denominator += dx * dx;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;

  return {
    testKey,
    errorTypeDiversity: failures.length > 0 ? errorTypes.size / failures.length : 0,
    avgDurationMs: history.reduce((s, h) => s + h.duration_ms, 0) / history.length,
    durationTrendSlope: slope,
    fileAgeDays: gitMetadata.ageDays,
    authorCount: gitMetadata.authorCount,
    timeSinceLastChangeDays: gitMetadata.lastChangeDays,
    failureCountLast30: failures.length,
    retryRate: history.filter(h => h.status === 'failed').length / history.length,
    testLengthLines: gitMetadata.lines,
    usesWaitForTimeout: sourceCode.includes('waitForTimeout'),
  };
}
```

### A Simple Decision-Tree Classifier (No TensorFlow Required)

For most teams, a hand-tuned rule engine outperforms an untuned ML model:

```typescript
// scripts/analytics/heuristicPredictor.ts
export function predictFlakeRisk(features: TestFeatures): { risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; score: number } {
  let score = 0;

  // Failure signal
  if (features.failureCountLast30 > 5) score += 30;
  else if (features.failureCountLast30 > 2) score += 15;

  // Retry signal
  if (features.retryRate > 0.2) score += 25;
  else if (features.retryRate > 0.1) score += 10;

  // Duration creep — slower tests are closer to timeout
  if (features.durationTrendSlope > 100) score += 15;

  // Code churn signal
  if (features.timeSinceLastChangeDays < 3) score += 10;
  if (features.errorTypeDiversity > 0.5) score += 20; // multiple failure modes

  // Static smell
  if (features.usesWaitForTimeout) score += 15;
  if (features.testLengthLines > 80) score += 5; // long tests are brittle

  // Normalize to 0-100
  score = Math.min(100, score);

  if (score >= 70) return { risk: 'CRITICAL', score };
  if (score >= 50) return { risk: 'HIGH', score };
  if (score >= 25) return { risk: 'MEDIUM', score };
  return { risk: 'LOW', score };
}
```

> **Production note**: If your team already has a data science pipeline (Spark, BigQuery, SageMaker), train a gradient-boosted model (XGBoost/LightGBM) on the same feature set. But start with the heuristic. A heuristic you understand beats a black-box model you cannot explain to your EM.

---

## 5. Import-Graph Based Test Selection

### The Problem: Running Everything Every Time

A 500-test suite that runs on every PR is wasteful if only 3 tests import the changed files. Import-graph based selection runs only tests transitively dependent on the diff.

### Using `madge` CLI

`madge` generates a dependency graph from your TypeScript source:

```bash
# Generate a JSON dependency graph
npx madge --extensions ts,tsx --json src/ > dependency-graph.json

# Find what test files import a given module
npx madge --extensions ts,tsx --depends lib/utils/Auth.ts src/
```

### Programmatic Import Graph with `ts-morph`

For CI integration, you want programmatic control:

```typescript
// scripts/analytics/testSelector.ts
import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';

interface DependencyGraph {
  [filePath: string]: string[]; // file -> files it directly imports
}

export function buildDependencyGraph(srcRoot: string): DependencyGraph {
  const project = new Project({ tsConfigFilePath: path.join(srcRoot, 'tsconfig.json') });
  const graph: DependencyGraph = {};

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const imports = sourceFile
      .getImportDeclarations()
      .map(imp => {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        if (moduleSpecifier.startsWith('.')) {
          return sourceFile.getDirectoryPath() + '/' + moduleSpecifier; // simplified
        }
        return null;
      })
      .filter((s): s is string => s !== null);
    graph[filePath] = imports;
  }
  return graph;
}

export function getTransitiveDependents(graph: DependencyGraph, changedFiles: string[]): Set<string> {
  const dependents = new Set<string>();

  function dfs(target: string, visited = new Set<string>()) {
    if (visited.has(target)) return;
    visited.add(target);
    for (const [file, imports] of Object.entries(graph)) {
      if (imports.some(imp => imp.endsWith(target) || target.endsWith(imp))) {
        dependents.add(file);
        dfs(file, visited);
      }
    }
  }

  for (const changed of changedFiles) {
    dfs(changed);
  }

  return dependents;
}

export function selectTests(graph: DependencyGraph, changedFiles: string[], testPattern = /\.spec\.(ts|tsx)$/): string[] {
  const dependents = getTransitiveDependents(graph, changedFiles);
  return Array.from(dependents).filter(f => testPattern.test(f));
}
```

### Git-Diff Driven Selection in CI

```bash
# scripts/ci/selective-test.sh
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | grep -E '\.(ts|tsx)$')

# If no source files changed, run a smoke subset only
if [ -z "$CHANGED_FILES" ]; then
  npx playwright test --grep "smoke"
  exit 0
fi

# Build the dependency graph and select relevant tests
npx ts-node scripts/analytics/testSelector.ts --changed "$CHANGED_FILES" --output selected-tests.txt

if [ -s selected-tests.txt ]; then
  npx playwright test --config playwright.config.ts $(cat selected-tests.txt | tr '\n' ' ')
else
  echo "No affected tests. Running smoke suite."
  npx playwright test --grep "smoke"
fi
```

> **Caveat**: Import-graph selection misses runtime dependencies (env vars, DB state, feature flags) and test files that do not statically import changed code but test behavior side-effected by it. Always run a smoke suite alongside the selected subset.

---

## 6. Cost-Per-Test Calculation

### The Full Formula

```
Cost-per-test = (CI Compute Cost + Browser Cloud Cost + Debugging Time Cost) / Total Tests
```

Broken down:

| Component | How to Measure | Example |
|---|---|---|
| **CI Compute** | Minutes x workers x $/minute (GitHub Actions: $0.008/min for Linux) | 12 min x 4 workers x $0.008 = $0.384 per run |
| **Browser Cloud** | Browser minutes x $/minute (BrowserStack: ~$0.20/min for desktop) | 8 tests x 2 min x $0.20 = $3.20 per run |
| **Debugging Time** | FlakyCount x avgInvestigationHours x engineerHourlyRate | 3 flakes/week x 0.5h x $100 = $150/week |

### TypeScript Cost Calculator

```typescript
// scripts/analytics/costCalculator.ts
interface CostConfig {
  ciCostPerMinute: number;
  browserCloudCostPerMinute: number;
  engineerHourlyRate: number;
  avgInvestigationMinutesPerFlake: number;
}

interface RunMetrics {
  wallMinutes: number;
  workerCount: number;
  browserMinutes: number;
  testCount: number;
  flakyCount: number;
}

export function calculateCostPerRun(metrics: RunMetrics, config: CostConfig): {
  ciCost: number;
  browserCost: number;
  debugCostPerRun: number;
  totalCost: number;
  costPerTest: number;
} {
  const ciCost = metrics.wallMinutes * metrics.workerCount * config.ciCostPerMinute;
  const browserCost = metrics.browserMinutes * config.browserCloudCostPerMinute;

  // Amortize weekly debugging cost across runs (assume 70 runs/week for active teams)
  const weeklyDebugCost = metrics.flakyCount * (config.avgInvestigationMinutesPerFlake / 60) * config.engineerHourlyRate;
  const debugCostPerRun = weeklyDebugCost / 70;

  const totalCost = ciCost + browserCost + debugCostPerRun;
  return {
    ciCost,
    browserCost,
    debugCostPerRun,
    totalCost,
    costPerTest: totalCost / metrics.testCount,
  };
}

// Example usage
const config: CostConfig = {
  ciCostPerMinute: 0.008,
  browserCloudCostPerMinute: 0.20,
  engineerHourlyRate: 100,
  avgInvestigationMinutesPerFlake: 30,
};

const metrics: RunMetrics = {
  wallMinutes: 12,
  workerCount: 4,
  browserMinutes: 48, // 12 tests x 4 browsers
  testCount: 500,
  flakyCount: 3,
};

const result = calculateCostPerRun(metrics, config);
console.log(`Cost per test: $${result.costPerTest.toFixed(4)}`);
console.log(`CI: $${result.ciCost.toFixed(2)}, Browser: $${result.browserCost.toFixed(2)}, Debug: $${result.debugCostPerRun.toFixed(2)}`);
```

### Cost Dashboard KPIs

| KPI | Target | Red Flag |
|---|---|---|
| Cost per test | < $0.05 | > $0.15 |
| Debug cost share of total | < 30% | > 60% |
| Cost per commit (amortized) | < $2.00 | > $5.00 |
| Flaky-induced cost ratio | < 20% | > 40% |

---

## 7. Allure Trends API Consumption

### Why Allure Trends Matter

Allure Report stores historical results and exposes them via REST. You can query trend data without writing your own database layer.

### Allure REST Endpoints (Self-Hosted)

```typescript
// scripts/analytics/allureClient.ts
const ALLURE_BASE = process.env.ALLURE_URL || 'http://localhost:5050';

interface AllureTrendItem {
  statistic: {
    passed: number;
    failed: number;
    skipped: number;
    broken: number;
    total: number;
  };
  time: { start: number; stop: number };
}

export async function fetchTrendData(): Promise<AllureTrendItem[]> {
  const response = await fetch(`${ALLURE_BASE}/allure/widgets/history-trend.json`);
  if (!response.ok) throw new Error(`Allure API error: ${response.status}`);
  return response.json();
}

export async function fetchTestCaseHistory(testCaseId: string) {
  const response = await fetch(`${ALLURE_BASE}/allure/testcase/${testCaseId}/history`);
  if (!response.ok) throw new Error(`Allure API error: ${response.status}`);
  return response.json();
}

export async function buildTrendSummary(): Promise<{
  avgPassRate: number;
  trendDirection: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  worstRunIndex: number;
}> {
  const trend = await fetchTrendData();
  const passRates = trend.map(t => t.statistic.passed / t.statistic.total);
  const avgPassRate = passRates.reduce((a, b) => a + b, 0) / passRates.length;

  // Simple linear regression on pass rate over time
  const n = passRates.length;
  const xMean = (n - 1) / 2;
  const yMean = avgPassRate;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (passRates[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;

  let trendDirection: 'IMPROVING' | 'STABLE' | 'DEGRADING' = 'STABLE';
  if (slope > 0.005) trendDirection = 'IMPROVING';
  else if (slope < -0.005) trendDirection = 'DEGRADING';

  const worstRunIndex = passRates.indexOf(Math.min(...passRates));

  return { avgPassRate, trendDirection, worstRunIndex };
}
```

### Integrating Allure Trends into Your Dashboard

```typescript
// scripts/analytics/dashboard/allureWidget.tsx
// Simplified React component for a hypothetical dashboard
export function AllureTrendWidget() {
  const [summary, setSummary] = useState<{ avgPassRate: number; trendDirection: string } | null>(null);

  useEffect(() => {
    buildTrendSummary().then(setSummary);
  }, []);

  if (!summary) return <div>Loading...</div>;

  const color = summary.avgPassRate > 0.95 ? 'green' : summary.avgPassRate > 0.85 ? 'orange' : 'red';

  return (
    <div style={{ border: `2px solid ${color}`, padding: 16 }}>
      <h3>Allure Pass Rate Trend</h3>
      <p>Average: {(summary.avgPassRate * 100).toFixed(1)}%</p>
      <p>Direction: {summary.trendDirection}</p>
    </div>
  );
}
```

---

## 8. Test Health Dashboard Design

### The Metrics That Matter

A dashboard that shows everything shows nothing. Limit yourself to six metrics:

| Metric | Definition | Target | Why It Matters |
|---|---|---|---|
| **Pass Rate** | passed / (passed + failed) over 7 days | > 98% | Baseline trust metric |
| **Flake Rate** | tests with >1 retry / total tests per run | < 2% | Measures CI trust erosion |
| **Avg Duration** | Mean test duration (ms) | Stable or decreasing | Efficiency metric |
| **P95 Duration** | 95th percentile duration | < 3x median | Catches slow outliers |
| **Coverage Trend** | Line coverage % over time | Increasing or stable | Signal completeness |
| **Time to Fix** | Hours from first flake detection to PR merged with fix | < 48h | Measures team responsiveness |

### Dashboard Layout Sketch

```
+--------------------------------------------------+
|  PASS RATE (7d)    FLAKE RATE (7d)   AVG DURATION |
|     97.2%             1.8%            4.2s       |
|     [sparkline]       [sparkline]     [sparkline]|
+--------------------------------------------------+
|  TOP 10 SLOWEST TESTS        |  FLAKIEST TESTS   |
|  1. checkout.spec.ts  45s    |  1. payment.ts    |
|  2. report.spec.ts    38s    |  2. auth.spec.ts  |
|  ...                         |  ...              |
+--------------------------------------------------+
|  COVERAGE TREND (30d)        |  COST PER TEST   |
|  [line chart]                |  $0.042          |
+--------------------------------------------------+
```

### TypeScript Dashboard API

```typescript
// scripts/analytics/dashboard/api.ts
import { Database } from 'better-sqlite3';

const db = new Database('test_analytics.db');

export function getDashboardData(days: number = 7) {
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const passRate = db.prepare(`
    SELECT CAST(SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS rate
    FROM test_results
    JOIN test_runs ON test_results.run_id = test_runs.run_id
    WHERE test_runs.run_timestamp > ?
  `).pluck().get(since);

  const flakeRate = db.prepare(`
    SELECT CAST(SUM(CASE WHEN retry_count > 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS rate
    FROM test_results
    JOIN test_runs ON test_results.run_id = test_runs.run_id
    WHERE test_runs.run_timestamp > ?
  `).pluck().get(since);

  const avgDuration = db.prepare(`
    SELECT AVG(duration_ms) FROM test_results
    JOIN test_runs ON test_results.run_id = test_runs.run_id
    WHERE test_runs.run_timestamp > ? AND status = 'passed'
  `).pluck().get(since);

  const p95Duration = db.prepare(`
    SELECT duration_ms FROM test_results
    JOIN test_runs ON test_results.run_id = test_runs.run_id
    WHERE test_runs.run_timestamp > ? AND status = 'passed'
    ORDER BY duration_ms
    LIMIT 1 OFFSET (SELECT COUNT(*) * 0.95 FROM test_results JOIN test_runs ON test_results.run_id = test_runs.run_id WHERE test_runs.run_timestamp > ? AND status = 'passed')
  `).pluck().get(since, since);

  return {
    passRate: passRate ?? 0,
    flakeRate: flakeRate ?? 0,
    avgDuration: avgDuration ?? 0,
    p95Duration: p95Duration ?? 0,
  };
}
```

---

## 9. Anti-Patterns: Analytics Edition

### 1. Ignoring Flaky Tests

**Pattern**: "It'll fix itself" — developers learn to re-run CI. Over time, 40% of PRs need a re-run. Trust collapses.

**Fix**: Track time-to-fix as a team KPI. Every flaky test gets a ticket with a 48-hour SLA.

### 2. Quarantining Without Investigation

**Pattern**: Move flaky tests to a quarantine folder. They rot there for 6 months. No one knows if the product behavior they test still works.

**Fix**: Quarantine is a temporary triage state (max 5 days). Every quarantined test must have an owner, a due date, and a note linking to the root-cause hypothesis.

### 3. Not Tracking Time-to-Fix

**Pattern**: Flakiness is detected but never resolved. The same test flakes for 3 months.

**Fix**: Measure "flake lifetime" — days from first detected flake to merged fix. Report it in sprint retrospectives.

### 4. Gaming Metrics

**Pattern**: Split one slow test into 20 micro-tests. Pass rate looks great. Coverage looks great. But the suite tests the same path 20 times and misses edge cases entirely.

**Fix**: Track "unique code paths tested" alongside count metrics. Review test strategies, not just dashboards.

### 5. No Baselines

**Pattern**: "Tests are slow this week" — compared to what? Without a baseline, every conversation is subjective.

**Fix**: Set baselines at the start of each quarter. Any 10% regression triggers an automatic alert and a mandatory review.

### 6. Alerting Fatigue

**Pattern**: Every failing test pings Slack. After 50 false alarms, engineers mute the channel. Real failures go unnoticed.

**Fix**: Use tiered alerting. Flake rate > 2% pages the on-call. Single test failure only opens a ticket.

### 7. Vanity Metrics

**Pattern**: Celebrating 10,000 tests while the pass rate is 82%. No one asks whether those tests catch real bugs.

**Fix**: Track "defect escape rate" — bugs found in production that had no failing test. If the number rises while test count rises, your tests are not testing the right things.

### 8. No Action from Data

**Pattern**: Beautiful dashboards exist. No one looks at them. No process consumes the data.

**Fix**: Every metric must have an owner and an action trigger. "If flake rate > 3%, then schedule an engineering meeting within 24 hours." Dashboards without action are decoration.

---

## 10. Decision Matrix: Build vs Buy for Analytics

| Solution | Setup Effort | Maintenance | Customization | Cost (Annual) | Best For |
|---|---|---|---|---|---|
| **Custom (SQLite + scripts)** | 1-2 weeks | Medium | Unlimited | Infrastructure only | Teams < 50 people, unique workflows |
| **Grafana + Prometheus** | 1 week | Low | High (queries) | Free (OSS) / ~$500 (Cloud) | Teams with existing observability stack |
| **Datadog CI Visibility** | 1 day | Low | Low-Medium | ~$15-30/seat/month | Teams wanting zero maintenance |
| **Allure Enterprise** | 2-3 days | Low | Medium | ~$3k-10k/year | Teams already using Allure reports |
| **ReportPortal** | 3-5 days | Medium | Medium | Free (OSS) / ~$5k (managed) | Teams wanting ML-based defect triage |

### When to Build

- Your test selection logic is custom (import-graph + feature flag matrix).
- You need to join test data with business metrics (revenue per feature, customer segment).
- You have dedicated platform engineering time.

### When to Buy

- You need results in days, not weeks.
- Your team has no data engineering capacity.
- Standard metrics (pass rate, duration, flake count) are sufficient.

### The Hybrid Approach (Recommended)

Start with a bought solution (Datadog or Allure) for immediate signal. Run a parallel custom pipeline for your unique metrics. Migrate ownership of bought-solution dashboards to the EM; own the custom pipeline as SDET infrastructure.

---

## 11. Senior/Principal SDET Perspective: Data-Driven Quality Conversations

### Translating Metrics to Business Language

Engineering managers and product leaders do not care about flake rate. They care about velocity, risk, and cost. Your job is to translate:

| Engineering Metric | Business Translation |
|---|---|
| Flake rate 5% | "Engineers spend 2 hours per sprint re-running CI instead of shipping features" |
| P95 duration increased 40% | "Our CI now blocks PRs for 18 minutes instead of 12. At 50 PRs/week, that's 5 hours of wait time multiplied by 8 engineers" |
| Coverage flat for 2 quarters | "We are shipping code in areas with no automated safety net. Regression risk is unmeasured" |
| Time-to-fix > 5 days | "When tests find a real bug, we take a week to act. That is a week of exposure in production" |

### The Quarterly Quality Review

Run a 30-minute review every quarter with engineering leadership. Structure:

1. **Trends** (5 min): Pass rate, flake rate, duration over the last 90 days.
2. **Top 3 Problems** (10 min): The three metrics that moved in the wrong direction, with root-cause hypotheses.
3. **Cost of Inaction** (5 min): What happens if we do nothing? (PR latency, bug escapes, engineer frustration).
4. **Proposed Investments** (10 min): Specific, costed proposals. "Invest 3 days to parallelize the checkout suite, reducing CI wall time by 4 minutes."

> **Principal SDET rule**: Never bring a metric without a story and a recommendation. Data without narrative is noise.

---

## 12. DevSecOps Seed: Anomaly Detection for Security Test Failures

### Why Security Tests Need Anomaly Detection

Security test failures (ZAP scans, auth enforcement tests, IDOR tests) are rare but high-impact. A single new failure may indicate a vulnerability. However, running security suites on every PR is expensive. Anomaly detection lets you run lightweight security checks continuously and flag deviations.

### Statistical Anomaly Detection

```typescript
// scripts/analytics/securityAnomaly.ts
interface SecurityTestResult {
  testName: string;
  timestamp: number;
  failedAssertions: string[];
  responseTimeMs: number;
}

export function detectAnomaly(
  history: number[], // previous response times or failure counts
  current: number,
  zThreshold: number = 2.5,
): { isAnomaly: boolean; zScore: number } {
  if (history.length < 10) return { isAnomaly: false, zScore: 0 };
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((s, x) => s + (x - mean) ** 2, 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev === 0 ? 0 : (current - mean) / stdDev;
  return { isAnomaly: Math.abs(zScore) > zThreshold, zScore };
}

// Usage: flag if a security test's response time spikes (possible DoS regression)
const responseTimes = [120, 115, 118, 122, 119, 121, 117, 120, 118, 119]; // baseline
const current = 450;
const anomaly = detectAnomaly(responseTimes, current);
if (anomaly.isAnomaly) {
  console.warn(`SECURITY ANOMALY: response time Z-score = ${anomaly.zScore.toFixed(2)}. Possible performance regression or attack vector.`);
}
```

### Integration with Security Scan Pipelines

```yaml
# .github/workflows/security-anomaly.yml
name: Security Anomaly Check
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
jobs:
  anomaly-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test --grep "security" --reporter=json
      - run: npx ts-node scripts/analytics/securityAnomaly.ts --report test-results/report.json
```

---

## 13. Exercise: Build a Flake-Score Script from Playwright JSON Reports

### The Task

Write a self-contained TypeScript script that:
1. Accepts a path to a Playwright JSON report.
2. Computes a "flake score" for every test: a number from 0 to 100 where higher means more likely to be flaky.
3. Prints a ranked table of the 20 highest-risk tests.
4. Persists the scores to a JSON file for trend comparison.

### The Algorithm

Your flake score should combine:
- **Retry penalty**: Each retry adds 20 points.
- **Duration variance penalty**: Coefficient of variation (stdDev / mean) x 25.
- **Failure penalty**: Each failure adds 15 points.
- **Timeout penalty**: If the last failure was a TimeoutError, add 10 points.

Cap the score at 100.

### The Script

```typescript
// exercises/flake-score/flakeScore.ts
import * as fs from 'fs';

interface PlaywrightResult {
  status: string;
  duration: number;
  error?: { message: string };
  retry: number;
}

interface PlaywrightTest {
  projectName: string;
  results: PlaywrightResult[];
}

interface PlaywrightSpec {
  title: string;
  tests: PlaywrightTest[];
}

interface PlaywrightSuite {
  file: string;
  specs: PlaywrightSpec[];
}

interface PlaywrightReport {
  suites: PlaywrightSuite[];
}

interface FlakeScore {
  testKey: string;
  file: string;
  title: string;
  score: number;
  retries: number;
  failures: number;
  avgDuration: number;
  durationCv: number;
  lastErrorType: string | null;
}

function computeFlakeScore(results: PlaywrightResult[]): number {
  let score = 0;

  // Retry penalty
  const totalRetries = results.reduce((sum, r) => sum + (r.retry ?? 0), 0);
  score += totalRetries * 20;

  // Failure penalty
  const failures = results.filter(r => r.status === 'failed').length;
  score += failures * 15;

  // Duration variance penalty
  const durations = results.map(r => r.duration);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const variance = durations.reduce((s, d) => s + (d - mean) ** 2, 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean === 0 ? 0 : stdDev / mean;
  score += cv * 25;

  // Timeout penalty
  const lastFailure = [...results].reverse().find(r => r.status === 'failed');
  if (lastFailure?.error?.message?.includes('TimeoutError')) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

function classifyError(message?: string): string | null {
  if (!message) return null;
  if (message.includes('TimeoutError')) return 'TimeoutError';
  if (message.includes('locator')) return 'LocatorError';
  if (message.includes('expect')) return 'AssertionError';
  if (message.includes('net::')) return 'NetworkError';
  return 'Other';
}

export function analyzeReport(reportPath: string): FlakeScore[] {
  const raw = fs.readFileSync(reportPath, 'utf-8');
  const report: PlaywrightReport = JSON.parse(raw);

  const scores: FlakeScore[] = [];

  for (const suite of report.suites) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        const results = test.results;
        const score = computeFlakeScore(results);
        const durations = results.map(r => r.duration);
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const variance = durations.reduce((s, d) => s + (d - mean) ** 2, 0) / durations.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean === 0 ? 0 : stdDev / mean;
        const lastFailure = [...results].reverse().find(r => r.status === 'failed');

        scores.push({
          testKey: `${suite.file}::${spec.title}`,
          file: suite.file,
          title: spec.title,
          score,
          retries: results.reduce((s, r) => s + (r.retry ?? 0), 0),
          failures: results.filter(r => r.status === 'failed').length,
          avgDuration: Math.round(mean),
          durationCv: Math.round(cv * 100) / 100,
          lastErrorType: classifyError(lastFailure?.error?.message),
        });
      }
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

// CLI usage
if (require.main === module) {
  const reportPath = process.argv[2];
  const outputPath = process.argv[3] || 'flake-scores.json';

  if (!reportPath) {
    console.error('Usage: npx ts-node flakeScore.ts <report.json> [output.json]');
    process.exit(1);
  }

  const scores = analyzeReport(reportPath);

  console.log('\n=== TOP 20 FLAKE RISKS ===');
  console.log('Score | File | Title | Retries | Failures | AvgDur | CV | LastError');
  console.log('-'.repeat(120));
  scores.slice(0, 20).forEach(s => {
    console.log(
      `${s.score.toString().padStart(3)} | ${s.file.slice(0, 40).padEnd(40)} | ${s.title.slice(0, 25).padEnd(25)} | ` +
      `${s.retries} | ${s.failures} | ${s.avgDuration}ms | ${s.durationCv} | ${s.lastErrorType ?? 'None'}`
    );
  });

  fs.writeFileSync(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), scores }, null, 2));
  console.log(`\nWrote ${scores.length} scores to ${outputPath}`);
}
```

### Running the Script

```bash
# Generate a Playwright JSON report first
npx playwright test --reporter=json --output test-results/report.json

# Run the analyzer
npx ts-node exercises/flake-score/flakeScore.ts test-results/report.json flake-scores.json
```

### Self-Grading Rubric

| Criterion | Points | What "Good" Looks Like |
|---|---|---|
| Correctly parses Playwright JSON structure | 20 | Handles suites, specs, tests, and results without crashes on missing optional fields |
| Flake score algorithm implemented as specified | 25 | Retry, failure, duration CV, and timeout penalties all present, capped at 100 |
| Outputs ranked table of top 20 | 15 | Table is human-readable, columns aligned, truncated gracefully |
| Persists JSON output with timestamp | 15 | Output file contains metadata (`generatedAt`) and full score list |
| Handles edge cases gracefully | 15 | No division by zero, handles empty results array, survives missing error messages |
| Code quality | 10 | Typed interfaces, pure functions, no `any`, clear variable names |

**Score yourself**: Add the points for criteria you met. 90+ = excellent, 75-89 = good, 60-74 = passing, < 60 = review and retry.

---

**Navigation**: [← 59. Docker](./59_Docker_For_Playwright.md) | [Index](../00_INDEX.md) | [→ 61. Leadership & Mentoring](./61_Leadership_And_Mentoring_Playbook.md)
