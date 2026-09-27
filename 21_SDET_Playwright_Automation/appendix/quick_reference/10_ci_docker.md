# CI + Docker

> **Canonical lesson:** [25 CICD Integration GitHub Azure](../../06_CI_CD_And_Reliability/25_CICD_Integration_GitHub_Azure.md) · [59 Docker For Playwright](../../06_CI_CD_And_Reliability/59_Docker_For_Playwright.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> The authoritative reference for running Playwright in CI and inside containers. Every CI platform (GitHub Actions, Azure DevOps, GitLab, CircleCI, Jenkins), the official Docker image internals, optimal sharding strategies, artifact handling, secret management, performance tuning, and every production failure that's bitten teams.

---

## Table of contents

1. [The CI execution model](#1-the-ci-execution-model)
2. [GitHub Actions — full workflow](#2-github-actions)
3. [Azure DevOps Pipelines](#3-azure-devops)
4. [GitLab CI](#4-gitlab-ci)
5. [CircleCI](#5-circleci)
6. [Jenkins](#6-jenkins)
7. [The official Playwright Docker image](#7-the-official-docker-image)
8. [Dockerfile patterns](#8-dockerfile-patterns)
9. [docker-compose for multi-service](#9-docker-compose)
10. [Sharding in CI](#10-sharding-in-ci)
11. [Merging sharded reports](#11-merging-reports)
12. [Artifact handling](#12-artifact-handling)
13. [Secret management](#13-secret-management)
14. [Performance — workers, /dev/shm, memory](#14-performance)
15. [Caching strategies](#15-caching)
16. [Debugging CI-only failures](#16-debugging-ci)
17. [Common production failures](#17-common-production-failures)
18. [Anti-pattern catalog](#18-anti-pattern-catalog)

---

## 1. The CI execution model

In CI:

| Layer           | What happens                                                       |
| --------------- | ------------------------------------------------------------------ |
| Runner          | Fresh VM or container per job. Default disk, RAM, CPU per CI tier. |
| Setup           | Clone repo, install Node, install dependencies, install browsers.  |
| Test            | Run Playwright.                                                    |
| Artifact upload | Save reports, traces, screenshots, videos.                         |
| Teardown        | Runner is destroyed (in most CI).                                  |

### 1.1 Differences from local

| Aspect           | Local                | CI                                 |
| ---------------- | -------------------- | ---------------------------------- |
| Browser presence | Likely installed     | Must install per run (cache helps) |
| OS dependencies  | Likely installed     | Must install per run               |
| Speed            | Variable             | Steadier (dedicated runner)        |
| Memory           | Often plenty         | Tightly bounded                    |
| CPU              | Bursty               | Steady                             |
| Network          | Stable home network  | Shared cloud network               |
| File system      | Persistent           | Wiped per job                      |
| Stdout/stderr    | Streamed to terminal | Captured to log file               |

### 1.2 What runs once per CI vs once per shard

| Item                     | Per-CI-invocation      | Per-shard              |
| ------------------------ | ---------------------- | ---------------------- |
| Repo checkout            | If shards reuse — once | Per shard              |
| Node install             | Once                   | Per shard              |
| `npm ci`                 | Once with cache        | Per shard              |
| `npx playwright install` | Once with cache        | Per shard              |
| Browser launch           | N/A (per worker)       | Per worker × workers   |
| Setup project            | N/A                    | Per shard              |
| Tests                    | N/A                    | Per shard, partitioned |
| Artifact upload          | Per shard              | Per shard              |
| Report merge             | Once at end            | N/A                    |

---

## 2. GitHub Actions

The canonical pattern, since most teams use this.

### 2.1 Minimal workflow

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

### 2.2 Sharded workflow

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/
          retention-days: 1

  merge:
    if: ${{ !cancelled() }}
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-html-report
          path: playwright-report/
          retention-days: 14
```

Note: `playwright.config.ts` must include `['blob']` reporter when `process.env.CI` is true:

```typescript
reporter: process.env.CI
  ? [['blob', { outputDir: 'blob-report' }], ['github']]
  : [['list'], ['html']],
```

### 2.3 With Docker

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.49.0-jammy
      options: --shm-size=2g
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test
```

`container` runs the entire job inside the image. Browsers are already installed; you save the install step.

### 2.4 With matrix + Docker

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
container:
  image: mcr.microsoft.com/playwright:v1.49.0-jammy
  options: --shm-size=2g
steps:
  - uses: actions/checkout@v4
  - run: npm ci
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

Each shard runs in its own container.

### 2.5 The `github` reporter

```typescript
reporter: process.env.CI ? [['github']] : [['list']],
```

The `github` reporter writes annotations that show as inline failures on the PR's "Files changed" view. Highly recommended.

### 2.6 Conditional report only on failure

```yaml
- uses: actions/upload-artifact@v4
  if: failure() # only upload if a step failed
  with:
    name: playwright-report
    path: playwright-report/
```

Saves storage when everything passes.

### 2.7 Comment results on PR

```yaml
- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    header: playwright-results
    message: |
      ## Playwright results
      Passed: ${{ steps.tests.outputs.passed }}
      Failed: ${{ steps.tests.outputs.failed }}
      [Full report](https://...)
```

Combined with a custom reporter that writes summary stats to outputs.

---

## 3. Azure DevOps

### 3.1 Pipeline YAML

```yaml
trigger:
  - main

pool:
  vmImage: ubuntu-latest

variables:
  CI: true
  NODE_VERSION: 20.x

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: $(NODE_VERSION)

  - script: npm ci
    displayName: "Install dependencies"

  - script: npx playwright install --with-deps chromium
    displayName: "Install browsers"

  - script: npx playwright test
    displayName: "Run tests"
    env:
      ORANGEHRM_USERNAME: $(orangehrmUsername)
      ORANGEHRM_PASSWORD: $(orangehrmPassword)

  - task: PublishPipelineArtifact@1
    condition: always()
    inputs:
      targetPath: playwright-report
      artifact: PlaywrightReport

  - task: PublishTestResults@2
    condition: always()
    inputs:
      testResultsFormat: JUnit
      testResultsFiles: test-results/junit.xml
      failTaskOnFailedTests: true
```

The `PublishTestResults@2` task surfaces individual test results in the Azure DevOps test tab — drill into specific failures from the UI.

### 3.2 Parallel jobs

```yaml
- job: PlaywrightShards
  strategy:
    parallel: 4
  steps:
    - script: |
        npx playwright test --shard=$(System.JobPositionInPhase)/$(System.TotalJobsInPhase)
```

Azure DevOps automatically partitions jobs. `System.JobPositionInPhase` and `System.TotalJobsInPhase` are built-in variables.

### 3.3 Secrets

```yaml
variables:
  - group: production-secrets # variable group from Library

steps:
  - script: npx playwright test
    env:
      DB_PASSWORD: $(dbPassword) # mapped from variable group
```

`variable group` lets you reuse secrets across pipelines.

### 3.4 Docker container

```yaml
- script: |
    docker run --rm \
      --shm-size=2g \
      -v $(System.DefaultWorkingDirectory):/work \
      -w /work \
      mcr.microsoft.com/playwright:v1.49.0-jammy \
      bash -c "npm ci && npx playwright test"
```

---

## 4. GitLab CI

```yaml
# .gitlab-ci.yml
image: mcr.microsoft.com/playwright:v1.49.0-jammy

variables:
  CI: "true"

stages:
  - test

playwright:
  stage: test
  parallel:
    matrix:
      - SHARD: [1, 2, 3, 4]
  script:
    - npm ci
    - npx playwright test --shard=$SHARD/4
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    reports:
      junit: test-results/junit.xml
    expire_in: 14 days

merge_reports:
  stage: test
  needs:
    - job: playwright
      artifacts: true
  script:
    - npm ci
    - npx playwright merge-reports --reporter html ./blob-report
  artifacts:
    paths:
      - playwright-report/
    expire_in: 14 days
```

### 4.1 GitLab-specific

- `parallel: matrix` is the native sharding.
- `artifacts.reports.junit` surfaces test results in the GitLab UI.
- `expire_in` controls storage cost.

---

## 5. CircleCI

```yaml
# .circleci/config.yml
version: 2.1

executors:
  playwright:
    docker:
      - image: mcr.microsoft.com/playwright:v1.49.0-jammy

jobs:
  test:
    executor: playwright
    parallelism: 4
    steps:
      - checkout
      - run: npm ci
      - run: npx playwright test --shard=$(($CIRCLE_NODE_INDEX + 1))/$(($CIRCLE_NODE_TOTAL))
      - store_artifacts:
          path: playwright-report
      - store_test_results:
          path: test-results

workflows:
  test:
    jobs:
      - test
```

### 5.1 CircleCI-specific

- `parallelism` runs N copies of the job.
- `CIRCLE_NODE_INDEX` is 0-indexed; shard arg expects 1-indexed.
- `store_test_results` surfaces results in CircleCI Insights for flake detection.

---

## 6. Jenkins

Pipeline (declarative):

```groovy
pipeline {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.49.0-jammy'
      args '--shm-size=2g'
    }
  }
  environment {
    CI = 'true'
    ORANGEHRM_PASSWORD = credentials('orangehrm-password')
  }
  stages {
    stage('Install') { steps { sh 'npm ci' } }
    stage('Test') {
      steps {
        sh 'npx playwright test'
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true
      junit 'test-results/junit.xml'
    }
  }
}
```

### 6.1 Jenkins-specific

- `credentials('id')` retrieves from Jenkins Credentials store.
- `junit` step parses and displays results in the Jenkins UI.
- For parallel: use `parallel { branch1 { ... }, branch2 { ... } }` blocks.

---

## 7. The official Docker image

`mcr.microsoft.com/playwright` is Microsoft's official image. What's inside:

### 7.1 Tag conventions

```
mcr.microsoft.com/playwright:v{version}-{ubuntu-codename}
```

| Tag             | Ubuntu    | Notes                       |
| --------------- | --------- | --------------------------- |
| `v1.49.0-jammy` | 22.04 LTS | ✅ Recommended for prod CI  |
| `v1.49.0-focal` | 20.04 LTS | Legacy — for older CI hosts |
| `v1.49.0-noble` | 24.04 LTS | Newest — cutting-edge       |

Always pin the EXACT Playwright version. Mismatches between `FROM` tag and `package.json` `@playwright/test` version cause subtle browser-binary issues.

### 7.2 What's installed

- Ubuntu base
- Node.js (LTS, matches Playwright's recommended version)
- All Playwright browser binaries (Chromium, Firefox, WebKit)
- All OS dependencies (libgtk, libnss, libasound, etc.)
- Standard locale (`en_US.UTF-8`)
- Non-root user `pwuser` (UID 1000)

### 7.3 What's NOT installed

- Your `node_modules` — install via `npm ci` in your Dockerfile
- Your test source code — `COPY` in
- Environment variables / secrets
- Custom fonts (e.g., for visual regression with corporate fonts)
- Database clients (psql, mysql, etc.)
- Cloud CLIs (aws, gcloud, az)

### 7.4 Size

| Tag                                       | Compressed | Uncompressed |
| ----------------------------------------- | ---------- | ------------ |
| `v1.49.0-jammy`                           | ~1.4 GB    | ~3.6 GB      |
| `v1.49.0-jammy` (after our COPY + npm ci) | ~2.2 GB    | ~5.0 GB      |

Pulls take 30–90 seconds on a fast CI connection. Cache the layer in CI.

### 7.5 Alternatives

| Image                                        | Use when                                                    |
| -------------------------------------------- | ----------------------------------------------------------- |
| `mcr.microsoft.com/playwright:v1.49.0-jammy` | Default — recommended                                       |
| `mcr.microsoft.com/playwright/python`        | Python tests (not relevant here)                            |
| `mcr.microsoft.com/playwright/java`          | Java tests                                                  |
| Custom Dockerfile from scratch               | You need custom fonts, system deps, or want a slimmer image |

---

## 8. Dockerfile patterns

### 8.1 Minimal

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY . .
ENV CI=true
ENTRYPOINT ["npx", "playwright", "test"]
CMD []
```

`--ignore-scripts` skips the postinstall browser download (already in the image).

### 8.2 Production-grade (with non-root user)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

RUN id -u pwuser &>/dev/null || ( \
    groupadd -r pwuser -g 1000 && \
    useradd -r -g pwuser -u 1000 -m -s /bin/bash pwuser \
    )

WORKDIR /app
RUN chown -R pwuser:pwuser /app
USER pwuser

ENV CI=true
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --chown=pwuser:pwuser package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY --chown=pwuser:pwuser . .

ENTRYPOINT ["npx", "playwright", "test"]
CMD []
```

Running as non-root is a security best practice. The Microsoft image has `pwuser` predefined; this Dockerfile reuses it.

### 8.3 Layer ordering for cache reuse

```dockerfile
# 1. Manifest only — cached unless package.json changes
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# 2. Source code — cache miss when any .ts file changes
COPY . .
```

If you reverse the order (`COPY . .` then `npm ci`), every code change re-runs `npm ci` — 30+ seconds wasted per build.

### 8.4 .dockerignore

```
# .dockerignore
node_modules/
playwright-report/
test-results/
auth-states/
*.lock
.env
.env.local
.git/
.github/
.vscode/
*.md
```

Without `.dockerignore`, `COPY . .` copies `node_modules/` (often 300+ MB) into the build context. Slow build, bloated image.

### 8.5 Multi-stage for smaller image

```dockerfile
# Stage 1: build (full toolchain)
FROM node:20-slim AS builder
WORKDIR /build
COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci
COPY . .
RUN npx tsc --noEmit            # type-check only

# Stage 2: runtime (browsers, slimmer)
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
WORKDIR /app
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build .
ENV CI=true
ENTRYPOINT ["npx", "playwright", "test"]
```

Final image is slightly smaller (no TypeScript compiler in runtime). Marginal benefit; usually not worth the complexity.

---

## 9. docker-compose

For multi-service setups (app + test runner).

### 9.1 With a local app

```yaml
version: "3.9"

services:
  app:
    image: node:20-alpine
    working_dir: /app
    command: sh -c "npx --yes serve -s . -l 3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000"]
      interval: 5s
      retries: 6
      start_period: 10s

  playwright:
    build:
      context: .
      dockerfile: Dockerfile
    shm_size: "2gb"
    depends_on:
      app: { condition: service_healthy }
    environment:
      CI: "true"
      API_BASE_URL: http://app:3000
    volumes:
      - ./playwright-report:/app/playwright-report
      - ./test-results:/app/test-results
```

### 9.2 Standalone runner

```yaml
services:
  playwright:
    build:
      context: .
      dockerfile: Dockerfile
    shm_size: "2gb"
    environment:
      CI: "true"
      ORANGEHRM_BASE_URL: ${ORANGEHRM_BASE_URL:-https://opensource-demo.orangehrmlive.com}
      API_BASE_URL: ${API_BASE_URL:-https://reqres.in}
    volumes:
      - ./playwright-report:/app/playwright-report
      - ./test-results:/app/test-results
```

### 9.3 Common flags

| Flag                                                      | Purpose                        |
| --------------------------------------------------------- | ------------------------------ |
| `shm_size: "2gb"`                                         | Avoid Chromium OOM on /dev/shm |
| `depends_on.condition: service_healthy`                   | Wait for app readiness         |
| `volumes: ./report:/app/report`                           | Persist artifacts on host      |
| `env_file: .env`                                          | Load env vars from file        |
| `command: ["npx", "playwright", "test", "--project=api"]` | Override the default test run  |

---

## 10. Sharding in CI

### 10.1 The math

For N shards on M machines:

- Wall-clock = (total_runtime / N) + per_shard_ramp_up
- Per-shard cost = ramp-up + (suite_size / N) × avg_test_duration

Ramp-up (clone, install, browser install, fixture setup): 60–120 seconds. If a shard runs for 3 minutes of tests but 2 minutes of ramp-up, you're 40% efficient.

### 10.2 Optimal shard count

| Suite size      | Recommended shards                  |
| --------------- | ----------------------------------- |
| < 50 tests      | 1 (don't shard — ramp-up dominates) |
| 50–200 tests    | 2–4                                 |
| 200–1000 tests  | 4–8                                 |
| 1000–5000 tests | 8–16                                |
| > 5000 tests    | 16+ (or multiple matrices)          |

The break-even point: a shard should run for 3–10 minutes of tests. Less than 3 min, ramp-up dominates. More than 10 min, you could parallelise more.

### 10.3 Per-shard CI cost

Each shard is a separate CI job. Costs scale linearly:

- 4 shards = 4 jobs = 4× per-minute cost
- 8 shards = 8 jobs = 8× per-minute cost

For paid CI, balance wall-clock vs cost. Many teams optimise for wall-clock during dev hours, cost overnight.

### 10.4 Shard imbalance

Shards split by COUNT, not duration. If 10% of tests take 90% of time:

- 4 shards each get 25% of tests.
- One shard happens to have all the slow tests.
- That shard takes 90% of total wall-clock; others finish in 10%.

Mitigations:

- Use `test.slow()` to mark known-slow tests; Playwright groups them across shards.
- Run a profiling pass; identify slow tests; split them manually across files.
- Accept imbalance; total wall-clock is bounded by the worst shard.

### 10.5 The blob reporter for shard merging

```typescript
// playwright.config.ts
reporter: process.env.CI
  ? [['blob']]
  : [['list'], ['html']],
```

Each shard writes `blob-report/report-{shard}.zip`. After all shards complete:

```bash
npx playwright merge-reports --reporter html ./all-blob-reports
```

Produces `playwright-report/` with merged HTML.

---

## 11. Merging reports

### 11.1 The workflow

```
Job: shard 1 → blob-report-1.zip
Job: shard 2 → blob-report-2.zip
Job: shard 3 → blob-report-3.zip
Job: shard 4 → blob-report-4.zip
         ↓ (merge job downloads all, runs merge)
       playwright-report/  ← unified HTML
```

### 11.2 GitHub Actions merge

```yaml
merge:
  needs: test # depends on shard jobs
  if: ${{ !cancelled() }} # run even if some shards failed
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 20, cache: npm }
    - run: npm ci
    - uses: actions/download-artifact@v4
      with:
        path: all-blob-reports
        pattern: blob-report-*
        merge-multiple: true
    - run: npx playwright merge-reports --reporter html ./all-blob-reports
    - uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
```

`merge-multiple: true` flattens all artifacts into `all-blob-reports/`.

### 11.3 Merge with multiple reporters

```bash
npx playwright merge-reports --reporter html,junit ./all-blob-reports
```

Produces both `playwright-report/` (HTML) AND `test-results/junit.xml`. Useful for CI dashboards that consume JUnit.

### 11.4 The merged report's filtering

The merged HTML report aggregates results across all shards. You can filter by:

- Project (if you ran multiple projects)
- Status (passed/failed/flaky/skipped)
- Tag (if you used annotations)
- Browser

Useful for triaging a 500-test suite where 5 failed.

---

## 12. Artifact handling

### 12.1 What to keep

| Artifact       | Use                      | Retention            |
| -------------- | ------------------------ | -------------------- |
| HTML report    | Human triaging           | 14 days              |
| Trace files    | Detailed debugging       | 7 days (large)       |
| Screenshots    | Quick visual debugging   | 7 days               |
| Videos         | Edge-case debugging      | 3 days (largest)     |
| JUnit XML      | CI dashboard integration | 90 days (small)      |
| JSON results   | Analytics pipeline       | 90 days              |
| `blob-report/` | Sharded → merged         | 1 day (intermediate) |

### 12.2 Conditional upload

```yaml
- uses: actions/upload-artifact@v4
  if: failure() && !cancelled() # only on real failures
  with:
    name: playwright-failures
    path: |
      playwright-report/
      test-results/
```

`if: failure()` saves storage when the suite passes.

### 12.3 Artifact size limits

| CI             | Per-artifact limit  | Total storage limit    |
| -------------- | ------------------- | ---------------------- |
| GitHub Actions | 10 GB               | Account-level, complex |
| Azure DevOps   | None (configurable) | Per-org                |
| GitLab.com     | 1 GB                | Per-tier               |
| CircleCI       | 3 GB                | Per-tier               |

If your trace files routinely exceed limits, switch to `trace: 'retain-on-failure'` and compress.

### 12.4 Cleanup of old artifacts

```yaml
# .github/workflows/cleanup.yml
on:
  schedule:
    - cron: "0 0 * * 0" # weekly

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: c-hive/gha-remove-artifacts@v1
        with:
          age: "14 days"
          skip-recent: 5
```

Removes artifacts older than 14 days, keeping the 5 most recent. Cost-saving for paid plans.

---

## 13. Secret management

### 13.1 The pattern

| Stage            | What                                                          |
| ---------------- | ------------------------------------------------------------- |
| Local dev        | `.env` file (gitignored)                                      |
| CI runner        | CI platform's secret store, injected as env vars at job start |
| Vault (advanced) | Pull from HashiCorp Vault / AWS Secrets Manager at runtime    |

### 13.2 GitHub Actions secrets

```yaml
env:
  ORANGEHRM_USERNAME: ${{ secrets.ORANGEHRM_USERNAME }}
  ORANGEHRM_PASSWORD: ${{ secrets.ORANGEHRM_PASSWORD }}
  OAUTH_CLIENT_SECRET: ${{ secrets.OAUTH_CLIENT_SECRET }}
```

Set in: Settings → Secrets and variables → Actions.

### 13.3 Azure DevOps secrets

```yaml
variables:
  - group: production-secrets
```

Set in: Pipelines → Library → Variable Groups → mark "secret" for each value.

### 13.4 mTLS cert injection

```yaml
- run: |
    echo "${{ secrets.MTLS_CERT_BASE64 }}" | base64 -d > /tmp/client.p12
    chmod 600 /tmp/client.p12
- run: npx playwright test
  env:
    MTLS_PFX_PATH: /tmp/client.p12
    MTLS_PFX_PASSPHRASE: ${{ secrets.MTLS_PASSPHRASE }}
```

Store the cert base64-encoded as a secret. Write to disk at runtime. Never commit `.p12` files.

### 13.5 Audit — what NOT to log

The custom reporter or any `console.log` can leak secrets:

```typescript
// ❌ Leaks token to CI log
console.log(`Token: ${oauthToken}`);

// ✅ Mask in log
console.log(`Token: ${oauthToken.slice(0, 8)}...`);
```

Audit your reporter implementations. Treat CI logs as if anyone in the company can read them — because in most orgs they can.

### 13.6 Rotation

Production credentials should rotate quarterly. CI secret stores let you update without code changes:

- Update in CI secrets UI.
- Next job uses the new value automatically.

If credentials leak via logs, rotate IMMEDIATELY.

---

## 14. Performance

### 14.1 `--shm-size`

The single most important Docker flag for Playwright.

```bash
docker run --shm-size=2g playwright-image
```

```yaml
# docker-compose
services:
  playwright:
    shm_size: "2gb"
```

```yaml
# GitHub Actions container
container:
  image: mcr.microsoft.com/playwright:v1.49.0-jammy
  options: --shm-size=2g
```

Why: Chromium uses `/dev/shm` (shared memory) heavily for IPC. Docker's default is 64 MB. Browser crashes with "Target closed" or OOM after ~30 tests without this.

### 14.2 Worker count

| Runner                          | Memory       | Recommended workers |
| ------------------------------- | ------------ | ------------------- |
| GitHub Actions standard (Linux) | 7 GB, 2 CPU  | 2                   |
| GitHub Actions large            | 16 GB, 4 CPU | 4                   |
| GitHub Actions XL               | 32 GB, 8 CPU | 8                   |
| Azure DevOps standard           | 7 GB         | 2                   |
| GitLab small                    | 4 GB         | 1                   |

```typescript
workers: process.env.CI ? Math.min(parseInt(process.env.PLAYWRIGHT_WORKERS ?? '4'), 8) : undefined,
```

Override via env var in CI:

```yaml
env:
  PLAYWRIGHT_WORKERS: 4
```

Lets you tune without code changes.

### 14.3 Browser install caching

```yaml
- uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-v1.49.0

- run: npx playwright install --with-deps chromium
  if: steps.playwright-cache.outputs.cache-hit != 'true'
```

Browser binaries cached across runs. Saves 30–60 seconds per run.

### 14.4 npm cache

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
```

`cache: npm` saves `node_modules/` and reuses when `package-lock.json` is unchanged. Saves 20–40 seconds.

### 14.5 Skip browser download in Docker

When using `mcr.microsoft.com/playwright:*`, browsers are already there. Skip the download:

```dockerfile
RUN npm ci --ignore-scripts
```

`--ignore-scripts` prevents the `playwright install` postinstall hook. Saves ~500 MB + 90 seconds per build.

### 14.6 ramp-up time vs sharding

For a 5-min test suite + 2-min ramp-up:

- 1 shard: 7 min total.
- 2 shards: 2.5 min tests + 2 min ramp-up = 4.5 min per shard, max 4.5 min total.
- 4 shards: 1.25 min tests + 2 min ramp-up = 3.25 min per shard.
- 8 shards: 0.6 min tests + 2 min ramp-up = 2.6 min per shard (75% wasted on ramp-up).

Beyond 4 shards, ramp-up dominates. Tune accordingly.

---

## 15. Caching

### 15.1 What to cache

| Cache                                      | Benefit  |
| ------------------------------------------ | -------- |
| `node_modules/` (via `npm ci` + lock file) | 20–40 s  |
| `~/.cache/ms-playwright` (browsers)        | 30–60 s  |
| Built test artifacts (rarely useful)       | Variable |
| Docker layers (in registry)                | 60–120 s |

### 15.2 GitHub Actions cache

```yaml
- uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.cache/ms-playwright
    key: pw-deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

Cache key includes `package-lock.json` hash — invalidates on dependency change.

### 15.3 Docker BuildKit cache

```yaml
- uses: docker/setup-buildx-action@v3

- name: Build with cache
  uses: docker/build-push-action@v5
  with:
    context: .
    push: false
    tags: playwright-test:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

Layer cache persisted across runs via GitHub Actions cache backend.

### 15.4 Cache busting

Sometimes cache outlives its usefulness:

```yaml
key: pw-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-v3
```

Bump the `v3` suffix to force a fresh cache.

---

## 16. Debugging CI

### 16.1 The CI-only flake

A test passes locally, fails in CI. The first move:

1. Download the trace artifact from CI.
2. Run `npx playwright show-trace ci-failure.zip` locally.
3. Inspect the snapshot at failure.
4. Compare with a local passing run's trace.

### 16.2 Reproducing the CI env locally

```bash
# Match CI parallelism
CI=true npx playwright test --workers=2 --shard=1/4

# Match CI Docker
docker run --rm \
  --shm-size=2g \
  -v $(pwd):/work \
  -w /work \
  mcr.microsoft.com/playwright:v1.49.0-jammy \
  bash -c "npm ci && CI=true npx playwright test"

# Match CI viewport (if you suspect)
PLAYWRIGHT_VIEWPORT_WIDTH=1280 npx playwright test
```

### 16.3 SSH into the CI runner

GitHub Actions:

```yaml
- name: Setup tmate session
  if: failure()
  uses: mxschmitt/action-tmate@v3
  timeout-minutes: 30
```

Connects via SSH for interactive debugging. Only enable for specific debugging — security risk if always on.

### 16.4 Verbose Playwright logs

```bash
DEBUG=pw:api npx playwright test
DEBUG=pw:* npx playwright test          # all Playwright logs
DEBUG=*       npx playwright test       # everything (very verbose)
```

```yaml
env:
  DEBUG: pw:api
```

Use sparingly — logs get massive. For one-off CI debugging, enable temporarily.

### 16.5 Custom reporter for failure dumps

```typescript
class FailureDumper implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "failed") {
      console.log("=== FAILURE DETAILS ===");
      console.log("Test:", test.title);
      console.log("File:", test.location.file);
      console.log("Error:", result.error?.message);
      console.log("Stack:", result.error?.stack);
      console.log(
        "Attachments:",
        result.attachments.map((a) => a.path),
      );
    }
  }
}
```

Outputs to stdout — visible in CI logs without needing to download trace files.

---

## 17. Common production failures

### Failure 1 — Browser not found in CI

**Symptom:** `Executable doesn't exist at ~/.cache/ms-playwright/...`

**Cause:** Forgot `npx playwright install` step.

**Fix:** Add the install step. Or use the official Docker image where browsers are pre-installed.

### Failure 2 — OOM on the second test

**Symptom:** First test passes, second test fails with "Target crashed."

**Cause:** Chromium ran out of `/dev/shm`. Default is 64 MB.

**Fix:** `--shm-size=2g` on docker run, or `shm_size: "2gb"` in compose.

### Failure 3 — Tests pass locally, fail in container

**Symptom:** Container tests time out; local passes.

**Cause:** Container's resource limits (CPU, RAM). The test that was 5s locally is 35s in the container.

**Fix:** Increase container resources. Or increase test timeouts.

### Failure 4 — Sharded reports don't merge

**Symptom:** `merge-reports` errors with "Invalid blob report".

**Cause:** Playwright version mismatch across shards (one shard ran v1.48, another v1.49).

**Fix:** Pin version in `package.json`. Always `npm ci` (not `install`).

### Failure 5 — `npm ci` errors with "lock file out of sync"

**Symptom:** `npm ci` fails in CI but `npm install` works locally.

**Cause:** `package-lock.json` not committed. Or it's out of date.

**Fix:** Always commit lock file. Run `npm install` locally before pushing if you changed deps.

### Failure 6 — Browser fails to launch with "no usable sandbox"

**Symptom:** `Failed to launch browser ... No usable sandbox.`

**Cause:** Linux without user namespace cloning. Common in nested containers.

**Fix:** `--no-sandbox` flag:

```typescript
launchOptions: {
  args: ['--no-sandbox'],
}
```

Only safe in trusted environments. Don't run user-supplied URLs without sandbox.

### Failure 7 — Artifact upload exceeds limit

**Symptom:** `Artifact too large to upload (12.5 GB).`

**Cause:** `trace: 'on'` with 500 tests = 5+ GB. Plus videos.

**Fix:** `trace: 'retain-on-failure'` AND don't upload `test-results/` unconditionally — only on failure.

### Failure 8 — Secrets leak in CI logs

**Symptom:** Searching the CI log finds `OAUTH_CLIENT_SECRET=...`.

**Cause:** A custom reporter or fixture printed the env.

**Fix:** Audit logging. CI platforms usually mask known secrets, but custom logging can leak.

### Failure 9 — Tests stall after ~10 in Docker

**Symptom:** Tests run, then suddenly hang. No error.

**Cause:** ulimit too low. Docker default `nofile` (file descriptors) is 1024; Playwright + browser need more.

**Fix:** `--ulimit nofile=65536:65536`.

### Failure 10 — Container fails on Apple Silicon (ARM64)

**Symptom:** `exec format error` when running x86 image on M1/M2 Mac.

**Cause:** Architecture mismatch.

**Fix:** Use multi-arch images (Microsoft now ships ARM64 variants):

```bash
docker pull --platform linux/arm64 mcr.microsoft.com/playwright:v1.49.0-jammy
```

### Failure 11 — `npm ci` cache miss every run

**Symptom:** Even though `package-lock.json` didn't change, the cache rebuilds.

**Cause:** Cache key includes the OS but not specific version (`runner.os` is `Linux`, not `ubuntu-22.04`). When CI bumps to ubuntu-24.04 you lose your cache.

**Fix:** Be specific: `key: pw-deps-${{ runner.os }}-${{ matrix.node }}-${{ hashFiles('package-lock.json') }}`.

### Failure 12 — `--shard=1/4` produces 0 results

**Symptom:** Shard 1 has 0 tests; shards 2–4 have 50 each.

**Cause:** `--grep` after `--shard`. The grep eliminates 197 tests; shard 1's 50 was 0 of the 3 surviving.

**Fix:** Don't shard small filtered suites. Or don't grep when sharding.

---

## 18. Anti-pattern catalog

| ❌                                                  | ✅                                          |
| --------------------------------------------------- | ------------------------------------------- |
| Default Docker `/dev/shm` (64 MB)                   | `--shm-size=2g`                             |
| `npm install` in Dockerfile                         | `npm ci --ignore-scripts`                   |
| `COPY . .` before `npm ci`                          | Layer order: manifests first, source second |
| No `.dockerignore`                                  | Comprehensive `.dockerignore`               |
| `workers: 16` on 2 GB runner                        | Cap by `min(cpus, ram_gb / 0.6)`            |
| `trace: 'on'` in CI                                 | `trace: 'retain-on-failure'`                |
| Hardcoded secrets in workflow YAML                  | CI secret store                             |
| `npm install --no-package-lock` to skip lock issues | Fix the lock file                           |
| Browser install without cache                       | Cache `~/.cache/ms-playwright`              |
| Single 60-minute job for 500 tests                  | Shard 4–8 ways                              |
| No timeout on CI job                                | `timeout-minutes: 60`                       |
| Always upload all artifacts                         | `if: failure()` for traces/videos           |
| Different Playwright versions per shard             | Pin in package.json + lock file             |
| `console.log(token)` for "debugging"                | Masked output; remove before merge          |
| Production credentials in dev CI runs               | Separate dev / prod credentials             |
| No `if: !cancelled()` on merge job                  | Without it, cancellation breaks merge       |
| Docker run as root (CVE risk)                       | `USER pwuser`                               |
| Image without pinned Playwright version             | `FROM ...:v1.49.0-jammy` exact pin          |

---

## Cross-references

- Config for CI mode: [`./02_config.md#23-the-metadata--propagating-context-to-reports`](./02_config.md)
- Parallelism + sharding internals: [`./07_parallelism.md`](./07_parallelism.md)
- Reporters in CI: [`./11_reporting.md`](./11_reporting.md)
- Reliability in CI: [`./08_reliability.md`](./08_reliability.md)
- Real Dockerfile: [`../framework/Dockerfile`](../../framework/Dockerfile)
- Real compose: [`../framework/docker-compose.yml`](../../framework/docker-compose.yml)
- Gate tiers, flake SLA, and the operating calendar around this pipeline: [`../06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md`](../../06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md)
