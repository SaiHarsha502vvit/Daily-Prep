# 67. Test Impact Analysis

 [← 66. Data Anonymization](./66_Data_Anonymization_And_PII_Masking.md) | [Index](../00_INDEX.md) | [→ 68. Chaos Engineering](./68_Chaos_Engineering_And_Resilience_Testing.md)

---

## 5W1H

| Question | Answer |
|----------|--------|
| **What** | Test Impact Analysis (TIA) is the practice of selecting and running only the tests that are relevant to the code that changed, rather than running the entire suite on every commit. |
| **Why** | Monorepo test suites with thousands of tests can take 30–90 minutes to run. Developers who wait that long for feedback context-switch, lose flow, or merge without CI approval. TIA restores fast feedback without sacrificing coverage. |
| **Who** | SDETs, platform engineers, CI architects, and senior developers who own build pipeline performance. |
| **Where** | In CI/CD pipelines (GitHub Actions, Azure DevOps, GitLab CI), in local pre-push hooks, and in IDE integrations that highlight affected tests. |
| **When** | On every pull request, on every merge queue run, and optionally on every local commit for large test suites. |
| **How** | By building an import dependency graph (static or AST-based), diffing the current commit against the merge target, computing the transitive closure of affected modules, and mapping those modules back to test files. |

---

## Table of Contents

1. [Why Test Impact Analysis Matters](#1-why-test-impact-analysis-matters)
2. [Static Analysis with `madge`](#2-static-analysis-with-madge)
3. [Programmatic Import Graph with `ts-morph`](#3-programmatic-import-graph-with-ts-morph)
4. [Git-Diff Driven Test Selection](#4-git-diff-driven-test-selection)
5. [Transitive Dependency Handling](#5-transitive-dependency-handling)
6. [Partition Strategies](#6-partition-strategies)
7. [Fallback Strategies](#7-fallback-strategies)
8. [CI Integration](#8-ci-integration)
9. [Anti-Patterns](#9-anti-patterns)
10. [Decision Matrix](#10-decision-matrix-when-tia-is-worth-the-complexity)
11. [Senior/Principal Perspective](#11-seniorprincipal-perspective)
12. [DevSecOps Seed](#12-devsecops-seed)
13. [Exercise](#13-exercise)

---

## 1. Why Test Impact Analysis Matters

### 1.1 The Feedback Loop

Continuous Integration promises fast feedback. The reality in large codebases is often different:

| Suite Size | Full Run Time | PRs per Day | Total CI Compute Hours |
|------------|--------------|-------------|------------------------|
| 200 tests  | 8 min        | 40          | 5.3 hrs                |
| 1,000 tests| 35 min       | 40          | 23.3 hrs               |
| 5,000 tests| 120 min      | 40          | 80 hrs                 |

At 5,000 tests, a team of 20 engineers burning 80 CI hours per day on full runs is not just expensive — it is slow. TIA can reduce that to 5–15 minutes per PR by running only the affected subset.

### 1.2 Cost, Not Just Speed

CI minutes are billed. Self-hosted runners depreciate. Cloud egress for artifact upload and download accumulates. A 50% reduction in test execution time is a 50% reduction in direct infrastructure cost, plus the indirect cost of developer waiting time.

### 1.3 Developer Friction

Developers will bypass slow checks. They will push directly to `main`. They will skip CI for "obvious" changes. They will run tests locally and claim green. TIA removes the legitimate excuse for bypassing checks because the check is fast.

### 1.4 Risk Awareness

TIA is not about running fewer tests. It is about running the right tests. A change to a utility function used by 200 tests should not trigger the other 4,800. A change to a database migration should trigger a broader smoke set. TIA makes the mapping explicit and automated.

---

## 2. Static Analysis with `madge`

`madge` is a CLI tool that builds a dependency graph from `require` and `import` statements. It is fast, language-aware, and requires zero configuration for standard project layouts.

### 2.1 Installation and Basic Usage

```bash
npm install -g madge

# generate a dependency graph for the entire project
madge --extensions ts,tsx src/ > deps.txt

# show circular dependencies (a common source of unexpected test coupling)
madge --circular --extensions ts src/

# generate a visual graph (requires graphviz)
madge --image deps.png --extensions ts src/
```

### 2.2 Interpreting Output

```bash
$ madge --extensions ts src/

e2e/auth/login.spec.ts
  utils/auth-helper.ts
  pages/login.page.ts

pages/login.page.ts
  utils/locator-utils.ts
  config/env.ts

utils/auth-helper.ts
  config/env.ts
  api/client.ts
```

This tree tells us that a change to `utils/auth-helper.ts` should trigger `e2e/auth/login.spec.ts`. A change to `config/env.ts` should trigger both `pages/login.page.ts` and `utils/auth-helper.ts`, which in turn means `login.spec.ts` must run.

### 2.3 Strengths and Limits

| Strength | Limit |
|----------|-------|
| Zero-config for standard layouts | Misses dynamic imports (`await import(path)`) |
| Fast (scans files, not AST) | Misses test-to-test dependencies via shared state |
| Detects circular deps | Cannot reason about runtime wiring (dependency injection) |
| CLI and programmatic API | Requires file paths to map to source; breaks with path aliases unless configured |

For projects using TypeScript path aliases (`@/utils/foo`), add a `tsconfig.json` reference:

```bash
madge --extensions ts --ts-config tsconfig.json src/
```

---

## 3. Programmatic Import Graph with `ts-morph`

`ts-morph` is a TypeScript AST manipulation library. It exposes every import, export, class, and function. When `madge` is too coarse, `ts-morph` gives you surgical precision.

### 3.1 Building the Graph

```typescript
// scripts/build-import-graph.ts
import { Project, SourceFile } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

interface ImportEdge {
  source: string;
  target: string;
  importPath: string;
  isDefault: boolean;
  namedImports: string[];
}

function buildGraph(projectPath: string): ImportEdge[] {
  const project = new Project({ tsConfigFilePath: path.join(projectPath, 'tsconfig.json') });
  const edges: ImportEdge[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const sourcePath = sourceFile.getFilePath();

    for (const importDecl of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const resolved = importDecl.getModuleSpecifierSourceFile();

      if (resolved) {
        edges.push({
          source: sourcePath,
          target: resolved.getFilePath(),
          importPath: moduleSpecifier,
          isDefault: !!importDecl.getDefaultImport(),
          namedImports: importDecl.getNamedImports().map(n => n.getName()),
        });
      }
    }
  }

  return edges;
}

const edges = buildGraph(process.cwd());
fs.writeFileSync('import-graph.json', JSON.stringify(edges, null, 2));
console.log(`Graph built: ${edges.length} edges across ${new Set(edges.map(e => e.source)).size} files`);
```

### 3.2 From Graph to Affected Tests

Once the graph is built, traversing it is straightforward:

```typescript
// scripts/find-affected.ts
import * as fs from 'fs';

interface ImportEdge {
  source: string;
  target: string;
}

function findAffectedTests(
  changedFiles: string[],
  graphPath: string,
  testPattern = /\.spec\.ts$/
): string[] {
  const edges: ImportEdge[] = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const adjacency = new Map<string, string[]>();

  // Build reverse adjacency: who imports this file?
  for (const { source, target } of edges) {
    const dependents = adjacency.get(target) ?? [];
    dependents.push(source);
    adjacency.set(target, dependents);
  }

  const affected = new Set<string>();
  const queue = [...changedFiles];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    // If this file is a test, mark it
    if (testPattern.test(current)) {
      affected.add(current);
    }

    // Traverse upstream: who depends on this file?
    const dependents = adjacency.get(current) ?? [];
    for (const dependent of dependents) {
      if (!visited.has(dependent)) {
        queue.push(dependent);
      }
    }
  }

  return Array.from(affected).sort();
}

// Example usage
const changed = ['src/utils/auth-helper.ts'];
const tests = findAffectedTests(changed, 'import-graph.json');
console.log('Affected tests:', tests);
```

### 3.3 When to Use `ts-morph` Over `madge`

| Scenario | Tool |
|----------|------|
| Fast periodic graph refresh in CI | `madge` |
| Fine-grained analysis (function-level) | `ts-morph` |
| Need to manipulate code during analysis | `ts-morph` |
| Zero-dependency, one-off investigation | `madge` |
| Build a custom test selection toolchain | `ts-morph` |

---

## 4. Git-Diff Driven Test Selection

The practical pipeline for TIA in CI is:

1. Compute the diff between the current branch and `main`.
2. Map each changed file to its dependents using the import graph.
3. Filter dependents to test files.
4. Run only those tests.

### 4.1 Diff Extraction

```bash
# changed files in the current PR against main
git diff --name-only origin/main...HEAD > changed-files.txt

# include renamed files
git diff --name-only --diff-filter=ACMRT origin/main...HEAD > changed-files.txt
```

### 4.2 Selection Script

```typescript
// scripts/select-affected-tests.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ImportEdge {
  source: string;
  target: string;
}

function getChangedFiles(baseBranch = 'origin/main'): string[] {
  const output = execSync(`git diff --name-only --diff-filter=ACMRT ${baseBranch}...HEAD`, {
    encoding: 'utf8',
  });
  return output.trim().split('\n').filter(Boolean);
}

function findAffectedTests(
  changedFiles: string[],
  graphPath: string,
  projectRoot = process.cwd()
): string[] {
  const edges: ImportEdge[] = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const adjacency = new Map<string, Set<string>>();

  for (const { source, target } of edges) {
    const set = adjacency.get(target) ?? new Set<string>();
    set.add(source);
    adjacency.set(target, set);
  }

  const resolvedChanged = changedFiles.map(f => path.resolve(projectRoot, f));
  const affected = new Set<string>();
  const visited = new Set<string>();
  const queue = [...resolvedChanged];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current.endsWith('.spec.ts') || current.endsWith('.test.ts')) {
      affected.add(path.relative(projectRoot, current));
    }

    const dependents = adjacency.get(current) ?? new Set<string>();
    for (const dep of dependents) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }

  return Array.from(affected).sort();
}

function main() {
  const baseBranch = process.env.TIA_BASE_BRANCH ?? 'origin/main';
  const changed = getChangedFiles(baseBranch);

  if (changed.length === 0) {
    console.log('No changed files detected.');
    process.exit(0);
  }

  console.log(`Changed files: ${changed.length}`);
  const tests = findAffectedTests(changed, 'import-graph.json');

  if (tests.length === 0) {
    console.log('No affected tests found.');
    process.exit(0);
  }

  console.log(`Affected tests: ${tests.length}`);
  fs.writeFileSync('affected-tests.txt', tests.join('\n'));
}

main();
```

### 4.3 Running the Selected Tests

```bash
# read the list and pass to Playwright
TESTS=$(cat affected-tests.txt | tr '\n' ' ')
npx playwright test $TESTS
```

Or, for sharding compatibility:

```bash
# split affected tests across N shards
mapfile -t ALL_AFFECTED < affected-tests.txt
TOTAL=${#ALL_AFFECTED[@]}
SHARD_SIZE=$(( (TOTAL + SHARD_TOTAL - 1) / SHARD_TOTAL ))
START=$(( (SHARD_INDEX - 1) * SHARD_SIZE ))
END=$(( START + SHARD_SIZE ))
if [ "$END" -gt "$TOTAL" ]; then END=$TOTAL; fi

TESTS=""
for ((i=START; i<END; i++)); do
  TESTS="$TESTS ${ALL_AFFECTED[$i]}"
done

npx playwright test $TESTS --shard=${SHARD_INDEX}/${SHARD_TOTAL}
```

---

## 5. Transitive Dependency Handling

### 5.1 The Transitive Explosion

A change to `src/utils/string-utils.ts` is imported by 12 files. Each of those is imported by 4 more. The transitive closure may reach 50 test files. This is not a bug — it is correct. If the utility behavior changed, every test that relies on it must validate the change.

### 5.2 Transitive Closure Algorithm

```typescript
function transitiveClosure(
  startNodes: string[],
  adjacency: Map<string, Set<string>>
): Set<string> {
  const visited = new Set<string>();
  const queue = [...startNodes];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current) ?? new Set<string>();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return visited;
}
```

This is a standard BFS over the reverse dependency graph. Time complexity is `O(V + E)` where `V` is files and `E` is imports.

### 5.3 Capping the Closure

In rare cases, a change to a foundational module (e.g., `src/config/env.ts`) may affect the entire test suite. TIA should detect this and fall back to a full run rather than pretending the closure is small.

```typescript
const AFFECTED_CAP = 0.5; // 50% of all tests
const allTests = getAllTestFiles();
const affected = findAffectedTests(changed, graph);

if (affected.length > allTests.length * AFFECTED_CAP) {
  console.warn('Affected test ratio exceeds cap; falling back to full suite');
  runFullSuite();
} else {
  runTests(affected);
}
```

---

## 6. Partition Strategies

### 6.1 File-Level Selection

The simplest strategy: if a test file imports a changed file (directly or transitively), run it. This is what the scripts in Sections 2–5 implement. It is fast to compute and easy to explain.

### 6.2 Function-Level Selection

A more advanced strategy maps changed functions to the tests that call them. This requires:

- A call graph built from the AST.
- Knowledge of which test calls which function.

```typescript
// simplified: map each test to the functions it invokes
const testToFunctions = new Map<string, string[]>();
// ... populated by AST traversal

const changedFunctions = ['validateEmail'];
const affectedTests = Array.from(testToFunctions.entries())
  .filter(([, funcs]) => changedFunctions.some(cf => funcs.includes(cf)))
  .map(([test]) => test);
```

**Pros**: Precise. A change to `validateEmail` does not trigger tests that only use `validatePhone` from the same module.
**Cons**: Expensive to build. Fragile with dynamic dispatch, callbacks, and higher-order functions.

### 6.3 Module-Level Selection

Group files by module boundaries (e.g., `packages/auth/`, `packages/billing/`). If any file in a module changes, run all tests for that module. This is coarser than file-level but avoids false negatives from cross-module re-exports and barrel files.

| Strategy | Precision | Build Cost | Best For |
|----------|-----------|------------|----------|
| File-level | Medium | Low | Most repos |
| Function-level | High | High | Critical paths with strict SLAs |
| Module-level | Low | Very Low | Monorepos with clear package boundaries |

---

## 7. Fallback Strategies

### 7.1 Large Diff (>50 Files)

When a PR touches 50+ files, the transitive closure may include the majority of the test suite. The overhead of computing and sharding the affected set may exceed the cost of a full run. Fallback behavior:

1. Compute affected tests anyway (fast; just a graph traversal).
2. If affected count > 60% of total tests, run the smoke suite + a random 10% sample of the full suite.
3. If affected count <= 60%, run affected + smoke.

```typescript
const CHANGED_FILE_THRESHOLD = 50;
const AFFECTED_RATIO_CAP = 0.6;

if (changed.length > CHANGED_FILE_THRESHOLD) {
  const ratio = affected.length / allTests.length;
  if (ratio > AFFECTED_RATIO_CAP) {
    return [...smokeTests, ...sample(allTests, 0.1)];
  }
}
```

### 7.2 Tiny Diff (<3 Files)

A 1-line change to a README should not trigger a complex TIA pipeline. However, a 1-line change to a shared utility absolutely should run its affected tests. The distinction is whether the changed files are code:

```typescript
const CODE_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'jsx', 'json', 'yml', 'yaml']);
const codeChanges = changed.filter(f => {
  const ext = f.split('.').pop() ?? '';
  return CODE_EXTENSIONS.has(ext);
});

if (codeChanges.length === 0) {
  console.log('No code changes; running smoke only');
  runTests(smokeTests);
  return;
}

if (codeChanges.length < 3 && affected.length < 10) {
  // tiny code change: affected tests + a random sample for regression confidence
  const sampleSize = Math.min(20, Math.floor(allTests.length * 0.05));
  return [...affected, ...sample(allTests, sampleSize)];
}
```

### 7.3 Smoke Tests Always Run

Regardless of diff size, a designated smoke suite should always execute. Smoke tests validate critical paths (login, checkout, API health) and catch systemic issues that TIA may miss (e.g., environment misconfiguration, global flag changes).

---

## 8. CI Integration

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/test-impact-analysis.yml
name: Test Impact Analysis

on:
  pull_request:
    branches: [main]

jobs:
  compute-affected:
    runs-on: ubuntu-latest
    outputs:
      tests: ${{ steps.select.outputs.tests }}
      count: ${{ steps.select.outputs.count }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Build import graph
        run: npx ts-node scripts/build-import-graph.ts

      - name: Select affected tests
        id: select
        run: |
          npx ts-node scripts/select-affected-tests.ts
          TESTS=$(cat affected-tests.txt | tr '\n' ' ')
          COUNT=$(cat affected-tests.txt | wc -l)
          echo "tests=$TESTS" >> $GITHUB_OUTPUT
          echo "count=$COUNT" >> $GITHUB_OUTPUT

  run-tests:
    needs: compute-affected
    runs-on: ubuntu-latest
    if: ${{ needs.compute-affected.outputs.count != '0' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run affected tests
        run: npx playwright test ${{ needs.compute-affected.outputs.tests }}

  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test e2e/smoke/ --project=chromium
```

### 8.2 Caching the Import Graph

Building the graph is `O(N)` where `N` is the number of source files. For large repos this may take 10–30 seconds. Cache the graph JSON in CI and only rebuild when source files change:

```yaml
- uses: actions/cache@v4
  with:
    path: import-graph.json
    key: tia-graph-${{ hashFiles('src/**/*.ts', 'src/**/*.tsx') }}
```

### 8.3 Reporting

Publish the affected test list as a PR comment so reviewers can see what ran and what did not:

```yaml
- name: Comment affected tests
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const tests = fs.readFileSync('affected-tests.txt', 'utf8');
      const body = `## Affected Tests (${process.env.COUNT})\n\n\`\`\`\n${tests}\n\`\`\``;
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body
      });
```

---

## 9. Anti-Patterns

### 9.1 Selecting Only Direct Dependents

A developer runs tests that directly import the changed file but ignores tests that import dependents of the changed file. A utility change breaks a page object, which breaks a test — but the test was never run. Always compute the full transitive closure.

### 9.2 Ignoring Transitive Dependencies

This is the same mistake with a different justification: "the import graph is too noisy, so I'll only go one level deep." One level deep is not TIA. It is random selection with extra steps.

### 9.3 Not Running Smoke as Fallback

A PR refactors the global error handler. TIA says no tests are affected because no test directly imports the error handler module (it is wired at runtime). The PR merges. Production breaks because the error handler no longer logs to the monitoring service. Smoke tests would have caught this.

### 9.4 Trusting Git Diff for Moved Files

Git diff shows a file as moved (`R100`) if the similarity is high. TIA tools that parse `--name-only` output may see the new path but miss the old path's dependents. Use `--diff-filter=ACMRT` to include renames in the changed set, and verify that the import graph resolves the new path.

### 9.5 Not Handling Deleted Files

A PR deletes `src/legacy/api.ts`. Tests that imported it are still in the repo. TIA must detect that a deleted file had dependents and run those tests — they are likely to fail with import errors.

### 9.6 Not Accounting for Global Config Changes

Changes to `.env.example`, `playwright.config.ts`, or `jest.setup.ts` can affect every test. TIA should treat modifications to global configuration as a full-suite trigger, or at minimum as a smoke + random-sample trigger.

### 9.7 Running No Tests When Diff Is in Markdown

A PR edits `README.md`. TIA correctly finds zero affected tests. CI passes green. Then a second PR edits `README.md` and `src/core/login.ts`. If the developer sees "0 tests" from the README PR and assumes CI is always fast, they may be surprised when the real PR triggers hundreds of tests. This is a communication failure, not a TIA failure — but it erodes trust.

### 9.8 Over-Engineering Selection for Tiny Codebases

A repo with 40 tests that runs in 90 seconds does not need TIA. The cognitive and maintenance overhead of maintaining the import graph, the selection scripts, and the fallback logic exceeds the time saved. TIA pays off past the threshold of ~200 tests or ~5 minutes of execution time.

---

## 10. Decision Matrix: When TIA Is Worth the Complexity

| Factor | TIA Recommended | TIA Not Recommended |
|--------|----------------|---------------------|
| **Test count** | >200 tests | <50 tests |
| **Full suite runtime** | >10 minutes | <3 minutes |
| **Team size** | >5 active developers | Solo developer |
| **Repo structure** | Monorepo with clear packages | Single-package, flat structure |
| **PR frequency** | >10 PRs per day | <2 PRs per day |
| **CI cost sensitivity** | High (cloud minutes) | Low (self-hosted, idle capacity) |
| **Failure blast radius** | Large (one bug affects many users) | Small (personal project) |
| **Test flakiness** | Low (TIA amplifies flakiness if tests are already flaky) | High (fix flakiness first) |

**Principal Verdict**: Implement TIA when two or more "recommended" factors align. Do not implement TIA if your primary problem is test flakiness or coverage gaps — solve those first.

---

## 11. Senior/Principal Perspective: TIA as a Developer-Experience Tool, Not Just a Cost Tool

### 11.1 The Narrative Shift

Finance will ask about CI cost savings. Developers will ask about feedback speed. Both are valid, but the deeper value of TIA is **maintaining flow state**. A developer who submits a PR and receives results in 8 minutes stays in context. A developer who waits 45 minutes goes to Slack, starts another branch, and context-switches into cognitive debt.

### 11.2 The Platform Team's Mandate

If you lead a platform or developer productivity team, TIA is a flagship project. It is technically interesting, visibly impactful, and aligns with engineering leadership's cost and velocity goals. Treat it as a product: measure adoption, time-to-feedback, and developer satisfaction (NPS surveys post-PR).

### 11.3 The Risk of Over-Trust

TIA is an optimization, not a guarantee. It reduces test volume by design. The tests it skips are, probabilistically, not affected by the change — but probability is not certainty. Communicate this clearly:

- TIA never replaces nightly full-suite runs.
- TIA never replaces release branch validation.
- TIA is a PR-time filter, not a safety net.

A principal engineer should resist the temptation to claim that TIA "proves nothing else broke." It proves that nothing in the affected dependency graph broke. That is a narrower and more honest claim.

---

## 12. DevSecOps Seed: Ensuring Security-Critical Tests Always Run

### 12.1 The Whitelist Approach

TIA must not exempt security-critical tests. A change to a CSS file should not skip the authentication flow tests. A change to a logging library should not skip the authorization boundary tests.

Maintain a whitelist of test files that always run, regardless of TIA output:

```typescript
const SECURITY_WHITELIST = [
  'e2e/auth/login.spec.ts',
  'e2e/auth/logout.spec.ts',
  'e2e/auth/mfa.spec.ts',
  'e2e/auth/session-hijacking.spec.ts',
  'e2e/auth/rbac-boundary.spec.ts',
  'e2e/payments/pci-tokenization.spec.ts',
];

const finalTestSet = new Set([...affectedTests, ...SECURITY_WHITELIST, ...SMOKE_TESTS]);
```

### 12.2 Tag-Based Inclusion

Alternatively, tag tests with `@security-critical` and include them via Playwright's project filter:

```typescript
// playwright.config.ts
projects: [
  { name: 'affected', testMatch: 'affected-tests.txt' },
  { name: 'security', testMatch: '**/*.spec.ts', grep: /@security-critical/ },
  { name: 'smoke', testMatch: 'e2e/smoke/**/*.spec.ts' },
];
```

### 12.3 Audit Trail

Log which tests ran because of TIA, which ran because of the whitelist, and which ran because of the fallback. This audit log is evidence for security reviews and compliance audits that critical tests were not silently bypassed.

```typescript
console.log(JSON.stringify({
  event: 'test-selection',
  pr: process.env.PR_NUMBER,
  tiaSelected: affectedTests.length,
  whitelistSelected: SECURITY_WHITELIST.length,
  fallbackTriggered: changed.length > CHANGED_FILE_THRESHOLD,
  timestamp: new Date().toISOString(),
}));
```

---

## 13. Exercise

### Write a `select-affected-tests.ts` Script

Build a TypeScript script that uses `madge` to build an import graph and `git diff` to select affected tests. The script must satisfy the following requirements:

1. **Graph Construction**:
   - Call `madge` programmatically or via `child_process` to build a dependency graph.
   - Support TypeScript path aliases from `tsconfig.json`.
   - Cache the graph to `import-graph.json` and reuse it if source files have not changed.

2. **Diff Detection**:
   - Detect changed files between the current branch and `origin/main`.
   - Handle added, modified, renamed, and deleted files.

3. **Transitive Closure**:
   - Compute the full transitive closure of dependents for each changed file.
   - Filter the closure to test files (`.spec.ts`, `.test.ts`).

4. **Fallbacks**:
   - If >50 files changed, fallback to smoke + random 10% sample.
   - If affected tests exceed 60% of total suite, fallback to smoke + random 10%.
   - If zero code files changed, run smoke only.

5. **Output**:
   - Write `affected-tests.txt` with one test path per line.
   - Write `selection-report.json` containing metadata: changed files, affected count, fallback triggered, whitelist additions.

6. **Security Whitelist**:
   - Accept a path to a JSON file listing tests that must always run.
   - Merge whitelist tests into the final output.

### Self-Grading Rubric

| Criterion | Acceptable | Good | Excellent |
|-----------|-----------|------|-----------|
| **Graph accuracy** | `madge` runs and produces a JSON graph | Resolves TS path aliases correctly | Detects circular dependencies and warns |
| **Diff handling** | Detects modified files only | Detects added, modified, renamed, deleted | Handles merge commits and complex git history |
| **Transitive closure** | Direct dependents only | Full BFS transitive closure | Optimized with early-exit if closure exceeds cap |
| **Fallback logic** | Hardcoded thresholds | Configurable thresholds via CLI flags | Adaptive thresholds based on historical suite metrics |
| **Output quality** | `affected-tests.txt` produced | Plus `selection-report.json` | Plus PR comment markdown, CI annotation format |
| **Security whitelist** | Reads a static JSON file | Supports glob patterns in whitelist | Supports tag-based inclusion with Playwright grep |
| **Code quality** | Single script, runs on demand | Modular functions, typed interfaces | Full unit tests with mocked `madge` and `git`, >80% coverage |
| **Documentation** | Inline comments | README with usage examples | ADR in `docs/adr/` justifying madge vs. ts-morph |

**Scoring**:
- **30–35**: Excellent. This script could be adopted as the team's canonical TIA tool.
- **23–29**: Good. Minor gaps in diff handling or output formatting.
- **16–22**: Acceptable. Functional but needs edge-case handling.
- **0–15**: Needs revision. Review Sections 4 and 5, then re-implement.

---

**Navigation**: [← 66. Data Anonymization](./66_Data_Anonymization_And_PII_Masking.md) | [Index](../00_INDEX.md) | [→ 68. Chaos Engineering](./68_Chaos_Engineering_And_Resilience_Testing.md)
