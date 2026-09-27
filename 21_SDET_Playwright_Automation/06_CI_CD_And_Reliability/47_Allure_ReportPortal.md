# 47. Allure & ReportPortal — Test Reporting That Scales Beyond `report.html`

**Navigation**: [← 46. BDD with Cucumber](../07_Specialised_Testing/46_BDD_With_Cucumber.md) | [Index](../00_INDEX.md) | [→ 48. Sharding & Test Selection](./48_Sharding_And_Test_Selection.md)

---

## 5W1H

- **WHAT**: Two reporting systems — Allure (file-based, opens in any browser) and ReportPortal (hosted server with history, search, AI failure clustering).
- **WHY**: Playwright's built-in HTML report is single-run, single-machine. Once you have 1k+ tests across multiple projects, branches, and developers, you need persistent history, owner tagging, and search.
- **WHO**: Teams with > ~200 tests, more than one CI pipeline, or stakeholders outside the immediate team.
- **WHEN**: Once you find yourself answering "did test X fail yesterday too?" by digging through CI artifacts. That's the signal.
- **HOW**: Add a reporter to `playwright.config.ts`. For Allure, generate locally / on CI. For ReportPortal, point it at the hosted server with a token.

---

## 0. War Stories — Why Reporting Matters More Than You Think

### The flaky test that was "passing" for 4 months

A test had been retried 2 times on every CI run for 4 months. It passed on the retry, so the build was green, the test was marked passing. Nobody looked at it.

Allure's "retry rate" metric showed the test was retrying 70% of the time. Without that metric, you need to grep CI logs manually — which nobody does at scale.

When we finally looked at the retried test, we found a missing `await` that occasionally failed the timing assertion. The fix took 5 minutes. The 4-month delay cost: 100 extra minutes of CI time per week, and one engineer's trust in the test suite ("tests lie all the time anyway").

**The metric that matters:** retry rate, not just pass rate. Allure shows both. Playwright's built-in HTML report shows neither.

### The test failure that nobody owned

350 tests. A test called `"Admin should be able to archive a citation"` started failing. Nobody investigated because:
- Nobody knew who wrote it
- The test had no @owner label
- The failure message was "Timeout exceeded" — no indication of which line

Two weeks later a product manager noticed the archive feature was broken in production. The test had been correctly detecting it. The failure was ignored for 2 weeks because nobody knew to investigate it.

Allure's `@allure.label.owner('harsha@example.com')` decoration sends failure notifications to the named owner automatically. One decorator, two weeks earlier.

---

## 1. The two flavours

|                    | Allure                                     | ReportPortal                            |
| ------------------ | ------------------------------------------ | --------------------------------------- |
| **Hosting**        | None — `npx allure open` locally           | Self-hosted or SaaS                     |
| **History**        | Per artefact run                           | Persistent DB                           |
| **Cost**           | Free                                       | Free OSS, paid SaaS                     |
| **Best for**       | Mid-size teams, CI artifact viewing        | Large orgs, multi-team aggregation      |
| **Killer feature** | Categories, severity, owners on every test | Failure auto-clustering, defect tracker |

For most teams: **Allure first, ReportPortal when the org demands it.**

---

## 2. Allure — minimum wire-up

```bash
npm i -D allure-playwright allure-commandline
```

```typescript
// playwright.config.ts
reporter: [
  ['list'],
  ['html', { open: 'never' }],
  ['allure-playwright', { detail: true, outputFolder: 'allure-results' }],
],
```

```bash
# After the run
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## 3. Allure — making it actually useful

```typescript
import { test } from "@playwright/test";
import { allure } from "allure-playwright";

test("@smoke admin creates a customer", async ({ page }) => {
  await allure.epic("Customer Management");
  await allure.feature("Customer Creation");
  await allure.story("Admin happy path");
  await allure.severity("critical");
  await allure.owner("mawa@example.com");
  await allure.tms("JIRA-1234");
  await allure.issue("JIRA-9876", "Known flake on Friday");

  // ...
});
```

After that, your Allure UI lets you filter by epic, severity, owner, and link straight to JIRA.

---

## 4. ReportPortal — when you grow into it

```bash
npm i -D @reportportal/agent-js-playwright
```

```typescript
// playwright.config.ts
reporter: [
  ['list'],
  [
    '@reportportal/agent-js-playwright',
    {
      apiKey: process.env.RP_API_KEY!,
      endpoint: 'https://reportportal.yourorg.com/api/v1',
      project: 'your-project',
      launch: 'sdet-playwright',
      attributes: [
        { key: 'branch', value: process.env.GITHUB_REF_NAME ?? 'local' },
        { key: 'env', value: process.env.ENV ?? 'local' },
      ],
    },
  ],
],
```

What ReportPortal does that Allure doesn't:

- **Auto-analyser** — clusters identical failures across runs. "33 tests failed with the same NoSuchElement on Tuesday — likely env issue."
- **Defect classification** — Product Bug / Automation Bug / System Issue / No Defect. Forces a triage discipline.
- **Cross-suite search** — "show me every test that ever failed with `oxd-spinner` in the stack trace."

---

## 5. What to put on EVERY test (regardless of reporter)

Make this a code review rule:

```typescript
test("@smoke @owner:sdet-team customers list paginates", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: "jira", description: "PROJ-1234" });
  testInfo.annotations.push({ type: "severity", description: "critical" });
  // ...
});
```

Annotations flow into both Allure and ReportPortal. Test titles encode the tag (`@smoke`, `@owner:...`). Reports become useful instead of decorative.

---

## 6. Common mistakes

1. **Treating the report as the source of truth.** It's a view. The source of truth is the JSON results file (`reporter: [['json', ...]]`).
2. **Not tagging owners.** Every flaky test ends up "team-wide pain." Owners turn it into "Bob owns this one."
3. **Including `allure-results/` in git.** It's a build artefact. Gitignore it.
4. **Running both Allure and ReportPortal "for safety."** Pick one. Two of them is two flake surfaces for reporting.

---

## 7. Senior SDET perspective

The report is the daily artefact your team interacts with. If it's ugly, slow, or noisy, every conversation about quality starts on the back foot. Invest one focused day on reporting once you cross ~200 tests — the ROI is enormous.

---

## 8. Exercise

1. Wire Allure into [`framework/`](../framework/).
2. Add `allure.severity('critical')` and `allure.owner('you@example.com')` to one test.
3. Run the suite, open Allure, click the test, screenshot the page, paste into your notes.
4. Now break one test deliberately. Re-run. See whether the Allure history page surfaces it.

Result: you now have a reporting layer recruiters will recognise on sight.

---

## 9. Allure Environment Properties

The `environment.properties` file injects CI metadata into every Allure report. This is critical for reproducibility — when a failure surfaces in a report, you immediately know which browser, OS, branch, and commit produced it.

### File format

```properties
# allure-results/environment.properties
Browser=Chromium 126.0
Browser=Chrome 126.0
Browser=Firefox 128.0
ENV=staging
BRANCH=feat/payment-retry
COMMIT=a3f9d21
COMMIT_MSG=fix: retry logic on 429
PLATFORM=linux
PYTHON=3.12
NODE=20.14.0
PLAYWRIGHT=1.44.0
```

Allure reads this file at report-generation time and surfaces it in the **Environment widget** at the top of the Overview page.

### Generating in CI (GitHub Actions)

The static properties file is fine for local runs, but CI needs dynamic values:

```bash
# scripts/generate-allure-env.sh
#!/usr/bin/env bash
set -euo pipefail

cat > allure-results/environment.properties << EOF
Browser=$(npx playwright --version | grep -oP 'chromium\d+' | head -1 || echo "unknown")
ENV=${ENV:-local}
BRANCH=${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}
COMMIT=${GITHUB_SHA:-$(git rev-parse HEAD)}
COMMIT_MSG=${PULL_REQUEST_TITLE:-$(git log -1 --format=%s)}
PLATFORM=${RUNNER_OS:-linux}
NODE=$(node --version)
PLAYWRIGHT=$(npm list @playwright/test --depth=0 --json | grep '"version"' | cut -d'"' -f4)
CI=${CI:-false}
TEST_START_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

echo "Environment properties generated:"
cat allure-results/environment.properties
```

Wire this into your workflow:

```yaml
- name: Generate Allure environment properties
  run: bash scripts/generate-allure-env.sh
  env:
    ENV: staging
    GITHUB_REF_NAME: ${{ github.ref_name }}
    GITHUB_SHA: ${{ github.sha }}
    PULL_REQUEST_TITLE: ${{ github.event.pull_request.title }}

- name: Run Playwright tests
  run: npx playwright test

- name: Generate Allure report
  run: |
    npx allure generate allure-results --clean -o allure-report

- name: Upload Allure report
  uses: actions/upload-artifact@v4
  with:
    name: allure-report-${{ github.sha }}
    path: allure-report
    retention-days: 30
```

### Environment Properties in Monorepo CI

In a monorepo with multiple packages, differentiate by workspace:

```bash
# Per-package environment
PACKAGE=$(node -p "require('./package.json').name")
echo "Package=$PACKAGE" >> allure-results/environment.properties

# Per-app for E2E
APP_URL=${APP_URL:-http://localhost:3000}
echo "AppUnderTest=$APP_URL" >> allure-results/environment.properties
```

### Local override pattern

Create a `allure-results/environment.properties.local` that is `.gitignore`'d. In CI, the generated file overwrites it:

```bash
# .gitignore
allure-results/environment.properties
!allure-results/environment.properties.local
```

This lets developers set `ENV=local-dev` without committing it.

---

## 10. Allure Categories Configuration

Categories let you group failures by root cause type, which transforms the report from a list of failing tests into a **triage dashboard**. Without categories, a report with 47 failures requires opening 47 tabs. With categories, you see: "12 UI Failures, 7 API Failures, 3 Environment Issues, 1 Product Bug, 0 Flaky."

### Default categories that ship with Allure

Allure bundles a `categories.json` schema. You can see it in the [Allure documentation](https://docs.qameta.io/allure/latest/) but the key is defining `categories.json` in your `allure-results/` folder before running `allure generate`. If the file is missing, Allure uses built-in defaults (Product Defects, Test Defects, etc.).

### Custom categories.json

```json
[
  {
    "name": "UI Failures",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*(selector|element|click|hover|scroll|viewport).*",
    "traceRegex": ".*(NoSuchElement|StaleElementReference|TimeoutError|locator).*"
  },
  {
    "name": "API Failures",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*(401|403|404|500|502|503|network|fetch|axios|request).*",
    "traceRegex": ".*(AxiosError|HttpError|statusCode).*"
  },
  {
    "name": "Environment Issues",
    "matchedStatuses": ["failed", "broken"],
    "messageRegex": ".*(ECONNREFUSED|ENOTFOUND|timeout|unavailable|port).*",
    "traceRegex": ".*(ERR_CONNECTION|ETIMEDOUT|SocketException).*"
  },
  {
    "name": "Product Bugs",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*(bug|Bug|BUG|defect|Defect).*",
    "traceRegex": ".*",
    "flaky": false
  },
  {
    "name": "Flaky Tests",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*",
    "traceRegex": ".*",
    "flaky": true
  },
  {
    "name": "Authentication / Authorization",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*(unauthorized|forbidden|403|token|jwt|session).*",
    "traceRegex": ".*"
  },
  {
    "name": "Assertion Failures",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*(expect|assert|toEqual|toBe|toContain).*",
    "traceRegex": ".*"
  },
  {
    "name": "Known Issues",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*",
    "traceRegex": ".*KNOWN_BUG.*"
  }
]
```

The `messageRegex` is checked against the test failure message; `traceRegex` is checked against the full stack trace. First match wins (order matters — put more specific patterns above generic ones).

### Generating categories.json in CI

Store the template in the repo and copy it during the build:

```bash
# scripts/generate-categories.sh
#!/usr/bin/env bash
set -euo pipefail

ENV=${1:-prod}

if [ "$ENV" = "staging" ]; then
  # Staging gets extra debug categories
  cat > allure-results/categories.json << 'EOF'
[
  {"name": "Staging Environment Issues", "matchedStatuses": ["failed"], "messageRegex": ".*(staging|localhost|port).*"},
  {"name": "CI-Specific Failures", "matchedStatuses": ["failed"], "messageRegex": ".*(CI|GITHUB|ACTION).*"}
]
EOF
else
  cp .allure/categories.json allure-results/categories.json
fi
```

### How categories help triage

| Category           | Typical Owner     | Typical Action                                |
| ------------------ | ----------------- | --------------------------------------------- |
| UI Failures        | Frontend / SDET   | Fix locator, update wait strategy             |
| API Failures       | Backend / SDET    | Fix test data, update contract                |
| Environment Issues | DevOps / Platform | Fix infra, update service URLs                |
| Product Bugs       | Product / Dev     | File JIRA, skip with known-bug annotation     |
| Flaky Tests        | SDET              | Add retry, improve waits, fix race conditions |
| Auth Failures      | Auth team         | Fix token handling, update credentials        |
| Known Issues       | QA Lead           | Link to existing ticket, skip test            |

With a well-structured categories.json, the first 5 minutes of a triage meeting becomes a prioritisation conversation instead of a scroll-through-an-enormous-list exercise.

---

## 11. ReportPortal Deep-Dive

ReportPortal is a hosted test intelligence platform. Where Allure is a file-based artefact you serve from CI, ReportPortal is a persistent server with a database. This changes the entire interaction model — you get **history**, **search across runs**, **AI clustering**, and **integration with issue trackers**.

### Dashboard widgets you must know

**Launch Statistics** — Shows pass/fail/in progress/aborted counts for the current launch vs the previous 5. Immediately shows regression.

```
Launch Statistics
─────────────────
Total:      487
Passed:     412  (84.6%)
Failed:      58  (11.9%)
Skipped:     17  ( 3.5%)
vs prev:      ↗ +3.2% pass rate
```

**Flaky Test Statistics** — Lists tests that pass-fail-pass-fail across recent launches. This is the highest-ROI widget: fixing one flaky test removes N future failures from triage.

**Unique Bugs** — Clusters failures by stack trace similarity. "47 tests failed with `NullPointerException at OrderService.place()`" is one unique bug, not 47 tickets.

**Most Failed Patterns** — Ranks failure patterns by frequency. If "timeout on `/api/orders`" appears in 30 tests this week, that's a service issue, not a test issue.

**Test Duration** — Histogram of test durations. Identifies outliers: a 90-second test that should take 3 seconds is either a real bug or a hang.

### SLA reporting with ReportPortal

ReportPortal's time series data answers: "Is quality improving or degrading?" The key metrics are **pass rate trend** and **Mean Execution Time (MET)**. MET is critical for capacity planning — if MET is 12s and you have 500 tests, a 4-shard run should finish in roughly 25 minutes.

```javascript
// Fetch pass rate trend and alert on SLA breach
const launches = await fetch(
  `${RP_ENDPOINT}/api/v1/${RP_PROJECT}/launches?page.size=7`,
  { headers: { Authorization: `Bearer ${RP_API_KEY}` } },
).then((r) => r.json());
const passRates = launches.content.map(
  (l) => l.statistics.testItemPassed / l.statistics.testItemTotal,
);
const avgPassRate = passRates.reduce((a, b) => a + b, 0) / passRates.length;
if (avgPassRate < 0.9)
  console.log(`::error::SLA breach: ${(avgPassRate * 100).toFixed(1)}%`);
```

### JIRA and YouTrack integration

ReportPortal creates JIRA/YouTrack tickets directly from the UI with pre-filled description (test name, failure message, stack trace, launch link, environment) and linked test history. This bridges the gap between test failure and developer triage.

### Defect classification workflow

ReportPortal enforces triage discipline. When a test fails, the analyst classifies it as **Product Bug** (file JIRA), **Automation Bug** (fix the test), **System Issue** (file DevOps ticket), or **No Defect** (close and add to known issues). This classification feeds analytics: which team has the highest automation bug rate? Which product area generates the most environment issues?

### Self-hosted vs SaaS

|             | ReportPortal SaaS      | Self-hosted                          |
| ----------- | ---------------------- | ------------------------------------ |
| Setup time  | 10 minutes             | 2–4 hours                            |
| Maintenance | None (EPAM handles it) | Your team owns DB, backups, upgrades |
| Cost        | ~$200/month            | Infra cost (~$50–500/month on cloud) |

For most teams: **start with the hosted trial**. Migrate to self-hosted when you hit storage limits or need org-wide data residency.

---

## 12. Reporter Comparison Matrix

The table below gives you an honest comparison across the dimensions that actually matter for SDET decision-making.

| Dimension                     | Allure                       | ReportPortal                | Playwright HTML        | JUnit XML              | Custom JSON                |
| ----------------------------- | ---------------------------- | --------------------------- | ---------------------- | ---------------------- | -------------------------- |
| **Hosting required**          | None — local or S3           | Self-hosted or SaaS         | None                   | None                   | Custom endpoint            |
| **History persistence**       | Per-artifact run (S3/manual) | Persistent DB               | None                   | None                   | Custom implementation      |
| **Search across runs**        | File-system grep             | Full-text + filter          | None                   | None                   | Custom implementation      |
| **Failure clustering**        | Manual (categories)          | Automatic AI                | None                   | None                   | Custom                     |
| **Cost**                      | Free (hosting is cost)       | Free OSS / $200+ SaaS       | Free                   | Free                   | Free                       |
| **CI artifact size**          | ~1–5 MB per run              | ~0 (server-side)            | ~500 KB                | ~50 KB                 | ~200 KB                    |
| **Learning curve**            | Low                          | Medium-High                 | Very low               | Low                    | High                       |
| **Stakeholder audience**      | Engineers, senior QA         | QA leads, managers, devs    | Engineers only         | CI systems             | Varies                     |
| **Integration: JIRA**         | Via TMS links                | Native bidirectional        | None                   | None                   | Custom                     |
| **Integration: Slack**        | Via webhooks (manual)        | Native launch notifications | None                   | None                   | Custom                     |
| **Flaky test tracking**       | Manual (flaky:true flag)     | Automatic per-launch        | None                   | None                   | Custom                     |
| **Test selection by history** | Not native                   | Pro feature                 | None                   | None                   | Custom                     |
| **Setup time**                | 1 hour                       | 1–2 days                    | 5 minutes              | 10 minutes             | Days–weeks                 |
| **Best for**                  | Mid teams, CI artefacts      | Enterprise, multi-team      | Solo dev, quick checks | CI gate, XML consumers | Custom analytics pipelines |

### When each reporter shines

**Playwright HTML** — You are a solo engineer or pair. You need zero-friction visibility. You commit, the report sits in your artifact storage for 14 days, you open it when a CI run fails. No setup, no server, no maintenance.

**JUnit XML** — You are feeding results into a broader CI ecosystem (SonarQube, Azure DevOps, Jenkins with plugin support). JUnit XML is the lingua franca of test reporting. You don't look at it directly; other tools consume it.

**Allure** — You have 50–500 tests, a team of 3–15, and you want meaningful filtering by epic/feature/severity/owner without running a server. You are comfortable with a `npx allure generate` step in CI and uploading the artefact to S3/GCS for history.

**ReportPortal** — You have >5 teams running the same suite, >5 pipelines, and leadership needs a single pane of glass for quality metrics. You have the appetite to run and maintain a server (or pay for SaaS). The failure clustering alone is worth 40+ engineer-hours per quarter in saved triage time.

**Custom JSON** — You have a bespoke analytics pipeline, a data warehouse, and custom dashboards. You know what you are doing and need raw data without the Allure or ReportPortal opinions on structure.

### Combining reporters

You can run multiple reporters simultaneously:

```typescript
reporter: [
  ['list'],
  ['html', { open: 'never' }],
  ['allure-playwright', { outputFolder: 'allure-results' }],
  ['junit', { outputFile: 'results/junit.xml' }],
],
```

However, be aware: more reporters = more flake surface. If the JUnit reporter throws mid-run, it can corrupt the overall exit code. Test each reporter in isolation before combining.

---

## 13. CI Artifact Management

When you generate Allure reports, Playwright videos, and trace files for every test in a 500-test suite, you generate a lot of data. Managing this across CI runs requires deliberate policy.

### Allure history persistence across GitHub Actions runs

By default, Allure shows only the current run. To get history (trends, comparisons with previous runs), you need to persist the `history/` directory between runs:

```yaml
- name: Download previous Allure history
  id: prev-history
  uses: dawidd6/action-download-artifact@v3
  with:
    workflow: e2e.yml
    name: allure-history
    path: allure-results/history
  continue-on-error: true

- name: Run tests
  run: npx playwright test

- name: Generate report with history
  run: npx allure generate allure-results --clean -o allure-report

- name: Upload allure-report
  uses: actions/upload-artifact@v4
  with:
    name: allure-report-${{ github.sha }}
    path: allure-report
    retention-days: 14

- name: Upload history for next run
  uses: actions/upload-artifact@v4
  with:
    name: allure-history
    path: allure-results/history
    retention-days: 90
```

The `--clean` flag tells Allure to regenerate based on current results, but the `allure-results/history/` folder (persisted from the previous run) is not deleted — it gets updated with the new run's data. The next run downloads it, creating a rolling 30-90 day history.

### S3 and GCS hosting strategies

For teams that want public URL sharing or compliance-grade retention:

```yaml
# Upload to S3 with encryption
- name: Upload Allure report to S3
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Upload to S3
  run: |
    aws s3 cp allure-report s3://$BUCKET/allure/${{ github.ref_name }}/${{ github.sha }}/ \
      --recursive \
      --sse AES256 \
      --metadata "build=${{ github.run_id }},branch=${{ github.ref_name }}"

# Enable S3 website hosting for Allure
# (Allure reports work as static sites served from S3 website endpoint)
```

```yaml
# GCS alternative
- name: Upload to GCS
  uses: google-github-actions/upload-cloud-storage@v2
  with:
    credentials: ${{ secrets.GCP_SA_KEY }}
    bucket: $BUCKET
    destination_dir: "allure/${{ github.ref_name }}/${{ github.sha }}"
    files: allure-report/**
```

With S3/GCS hosting, stakeholders get a URL like `https://reports.yourorg.com/allure/main/a3f9d21/`. No VPN, no artifact download — shareable links.

### Artifact retention policies

| Artifact type                 | Size per test | 500-test suite | Recommended retention        |
| ----------------------------- | ------------- | -------------- | ---------------------------- |
| Allure results (JSON)         | ~5–20 KB      | 2.5–10 MB      | 7 days in CI, 30 days in S3  |
| Allure report (HTML+JSON)     | ~20–80 KB     | 10–40 MB       | 14 days in CI, 90 days in S3 |
| Playwright video (on failure) | ~5–20 MB      | Up to 500 MB   | 7 days in CI only            |
| Playwright trace (on failure) | ~1–5 MB       | Up to 250 MB   | 7 days in CI only            |
| Screenshots (on failure)      | ~100–500 KB   | Up to 50 MB    | 7 days in CI only            |

**Total worst case**: 500 tests × (20 MB video + 5 MB trace + 500 KB screenshots) = ~12.75 GB per run. This is why you only capture trace/video on failure (`video: 'on-first-retry'`, `trace: 'on-first-retry'`).

### Cost implications of storing trace + video

Assuming 10 CI runs/day, 500 tests/run, and 1% failure rate (5 failures/run):

- Videos: 5 failures × 15 MB × 10 runs × 30 days = 22.5 GB/month
- Traces: 5 failures × 3 MB × 10 runs × 30 days = 4.5 GB/month
- Total: ~27 GB/month

At S3 pricing (~$0.023/GB for standard): **~$0.62/month**. Negligible.

But if you capture video on **all** tests (not just failures): 500 tests × 15 MB × 10 runs × 30 days = 2,250 GB/month = ~$52/month. That's real money.

Rule: **always capture traces on failure**. Capture video on failure or first-retry only. Never capture full-attachment on success.

### S3 lifecycle policies

```bash
#Automatically expire old artifacts (CLI example)
aws s3api put-bucket-lifecycle-configuration \
  --bucket your-allure-bucket \
  --lifecycle-configuration '{"Rules":[{"ID":"Expire-allure-90d","Prefix":"allure/","Status":"Enabled","Expiration":{"Days":90}}]}'
```

---

## 14. Anti-Patterns

### 1. Skipping annotations (@epic, @feature, @owner)

The report exists but tells you nothing actionable. "47 tests failed" with no owner tags means every team argues about who owns what.

```typescript
// Bad — no metadata
test("checkout flow works", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.locator(".total")).toHaveText("$42.00");
});

// Good
test("checkout flow works", async ({ page }, testInfo) => {
  await testInfo.annotations.push({ type: "epic", description: "Checkout" });
  await testInfo.annotations.push({
    type: "owner",
    description: "payments-team",
  });
  await testInfo.annotations.push({
    type: "severity",
    description: "critical",
  });
  // ...
});
```

### 2. Not cleaning allure-results between runs

Stale JSON files from previous runs corrupt history, categories, and environment properties. Always use `--clean` on `allure generate`.

```bash
# Always clean before generate
npx allure generate allure-results --clean -o allure-report
# Never: npx allure generate allure-results -o allure-report
```

### 3. Running two reporting systems "for safety"

Allure + ReportPortal simultaneously doubles your maintenance surface. When one breaks, you spend an hour diagnosing which one and why. Pick one. Use the second one for a migration window, then retire the first.

### 4. Including allure-results in git

```bash
# .gitignore must contain:
allure-results/
allure-report/
```

These are build artifacts. Versioning them is a waste of git storage and causes stale-data bugs when someone checks out an old commit and the CI report diverges from the local run.

### 5. Not setting owner tags

```typescript
// Every test MUST have an owner. Enforce in code review:
test("login page loads", async ({ page }) => {
  // Owner is mandatory — check testInfo.annotations before running assertions
  const hasOwner = testInfo.annotations.some((a) => a.type === "owner");
  if (!hasOwner) throw new Error("TEST WITHOUT OWNER: " + testInfo.title);
});
```

### 6. Treating the report as the source of truth

The report is a **view** on the data. The source of truth is the JSON results. If you need to query test data programmatically, parse `allure-results/` directly — don't scrape the HTML.

```typescript
// Query allure results directly
import * as fs from "fs";
import * as path from "path";

const results = fs
  .readdirSync("allure-results")
  .filter((f) => f.endsWith("-result.json"))
  .flatMap((f) =>
    JSON.parse(fs.readFileSync(path.join("allure-results", f), "utf8")),
  );

const failures = results.filter((r) => r.status === "failed");
failures.forEach((f) => console.log(f.fullName, f.statusDetails?.message));
```

### 7. Ignoring history trends

A single run is a snapshot. An Allure history trend over 30 days tells you whether your test quality is improving, degrading, or flat. If pass rate is dropping 1% per week, you have a systemic problem — but you won't see it without history.

### 8. Duplicating effort with two reporters

Running Allure + JUnit XML + custom JSON in the same config seems thorough. But each reporter adds a write syscall per test result, which adds latency to your test run (typically 10–30% overhead per additional reporter). Test in isolation, pick the one that serves your audience.

---

## 15. Decision Matrix

Use this to choose between Allure and ReportPortal:

| Scenario                                                      | Recommended                | Why                                   |
| ------------------------------------------------------------- | -------------------------- | ------------------------------------- |
| Solo dev, <50 tests                                           | Playwright HTML            | No setup, good enough                 |
| Team <20 engineers, <500 tests                                | Allure                     | Quick to set up, covers basics        |
| Team <20 engineers, single pipeline, no stakeholder reporting | Allure                     | History via S3, categories for triage |
| Team <20 engineers, leadership wants metrics dashboard        | ReportPortal (SaaS)        | Less ops than self-hosted             |
| >20 engineers, >5 teams, shared suite                         | ReportPortal (self-hosted) | Centralised quality billboard         |
| Multi-pipeline, multi-project, same suite                     | ReportPortal               | Unified view across pipelines         |
| Enterprise with compliance requiring audit trail              | ReportPortal               | Persistent DB with user activity logs |
| Open source project                                           | Allure (GitHub Pages)      | Free hosting via GitHub Pages         |
| You need cross-run search ("which test failed with X?")       | ReportPortal               | Full-text search across all runs      |
| CI artifact only, no server, no maintenance                   | Allure (S3/GCS)            | Static hosting, zero ops              |

**The transition signal**: when you find yourself answering "did test X fail yesterday?" by asking in Slack instead of checking a report, that's when you have outgrown Allure and need ReportPortal.

---

## 16. Senior SDET Perspective

### The report as the quality billboard

The test report is the most-read artefact in your quality ecosystem — not just by SDETs, but by tech leads, product managers, and engineering managers. They open it before standup. They share it in postmortems. They screenshot it for leadership updates.

This means the report is a **social artefact**, not just a technical one. A report that is hard to read, slow to load, or noisy (lots of irrelevant failures) trains people to ignore it. A clean, accurate, well-categorised report builds trust in the test suite.

### Aggregate failure data vs individual test failures

Engineers fix individual failures. Leaders need aggregate signals.

Individual failure: "Login test failed with timeout on `/api/auth`." — actionable for one engineer.

Aggregate data: "Auth-related tests failed 14 times this week, all with network timeouts, all in the staging environment, costing us 3 engineer-hours of triage." — actionable for the team lead, who escalates to DevOps.

Your job as an SDET is to surface the **aggregate view first**, then make the individual failure drill-down available. In Allure, this means categories + severity. In ReportPortal, this means dashboard widgets + defect type distribution.

### Presenting metrics to executives

Executives get 5 numbers: pass rate, test count, flaky rate, mean execution time, and critical failures. No stack traces. The framing: "3 critical failures, all with JIRA tickets assigned" is a status update. "47 tests failed" is a fire alarm. When aggregate data shows "automation bug rate = 35% of all failures," that's the signal to invest in test stability.

---

## 17. DevSecOps Seed — Security Test Reporting

### OWASP ZAP integration

Run ZAP as a CI pre-step and embed findings in Allure:

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py -t ${APP_URL} -J zap-report.json -d
```

```typescript
// Attach ZAP findings to Allure
const zapReport = JSON.parse(fs.readFileSync("zap-report.json", "utf8"));
zapReport.site[0]?.alerts.forEach((f: any) => {
  allure.severity(
    f.riskdesc?.includes("High")
      ? "critical"
      : f.riskdesc?.includes("Medium")
        ? "major"
        : "normal",
  );
  allure.description(`[${f.alert}](${f.uri}) — ${f.desc}`);
  allure.label("security", "zap");
});
```

### Vulnerability tracking in Allure

Track CVEs as test cases with `severity: critical`:

```typescript
test("security: no high-severity CVEs in dependencies", async () => {
  const { stdout } = await $`npm audit --json`;
  const audit = JSON.parse(stdout);
  const high = Object.values(audit.vulnerabilities).filter((v: any) =>
    ["high", "critical"].includes(v.severity),
  );
  if (high.length > 0) {
    allure.severity("critical");
    throw new Error(`${high.length} high/critical vulnerabilities found`);
  }
});
```

---

## 18. Exercise — Complete Deliverable

### Objective

Wire complete Allure annotations into your Playwright framework, generate a report, categorise known failures, and capture the categories view screenshot.

### Steps

1. **Install and configure Allure**

   ```bash
   npm i -D allure-playwright allure-commandline
   ```

   ```typescript
   // playwright.config.ts
   reporter: [
     ['list'],
     ['html', { open: 'never' }],
     ['allure-playwright', { outputFolder: 'allure-results' }],
   ],
   ```

2. **Annotate three tests** — Pick three tests in your framework and annotate each with:

   ```typescript
   test("admin creates a customer", async ({ page }) => {
     await allure.epic("Customer Management");
     await allure.feature("Customer Creation");
     await allure.story("Admin happy path");
     await allure.severity("critical");
     await allure.owner("you@example.com");
     await allure.tms("JIRA-1234");
     await allure.label("team", "sdet");
     await allure.label("sprint", "24");
     // ... test body
   });
   ```

3. **Run the suite**

   ```bash
   npx playwright test
   npx allure generate allure-results --clean -o allure-report
   ```

4. **Create `categories.json`**

   Add a `scripts/generate-categories.sh` that creates `allure-results/categories.json` with at least four categories (UI Failures, API Failures, Environment Issues, Product Bugs).

5. **Deliberately break one test** — Make one test fail (wrong assertion). Run again. Open the report. Verify the failure appears in the correct category.

6. **Screenshot the categories view** — Run the suite, generate the report, open it, navigate to the Categories section, and take a screenshot.

7. **Calculate CI artifact size** — After running, check:

   ```bash
   du -sh allure-results/
   du -sh allure-report/
   ```

   Document the sizes in your exercise notes.

### Self-Grading Rubric

| Criterion                                                   | 0 — Not done   | 1 — Partially done               | 2 — Complete                                                                     |
| ----------------------------------------------------------- | -------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| Allure installed and configured                             | Not installed  | Configured but not running       | Installed, configured, tests run                                                 |
| At least 3 tests annotated (epic, feature, owner, severity) | <3 annotated   | 3 annotated but missing ≥1 field | 3+ fully annotated                                                               |
| categories.json generated in CI script                      | No script      | Script exists but not wired      | Script exists and runs in CI                                                     |
| Failing test appears in correct category                    | N/A            | Test fails but no category       | Test fails and appears in correct category                                       |
| Categories view screenshot captured                         | Not captured   | Partial screenshot               | Full screenshot with legend visible                                              |
| CI artifact size documented                                 | Not documented | Size documented                  | Size documented with context (per-test average)                                  |
| README or notes explaining the reporting setup              | None           | Brief description                | Complete explanation of annotations, categories, and how to interpret the report |

**Total: /14**

**Passing score: 10/14**

**Target: 12/14** — anything less means the reporting layer is not production-ready.


---

## Reality Check

**"HTML reporter is sufficient for enterprise test reporting"**→ HTML reporter generates static files per test run with no historical comparison. Enterprise teams need: trend analysis (is flakiness increasing?), failure categorization (product bug vs environment issue vs test bug), and cross-run comparison (did this test start failing after a specific commit?). Tools like Allure and ReportPortal provide these aggregation and analytics capabilities that static reports cannot.

**"Setting up ReportPortal is a one-time effort"**→ ReportPortal requires: persistent storage for test results (PostgreSQL), a running service (Docker or Kubernetes deployment), user authentication, project organization, and retention policies for old results. It is infrastructure that needs monitoring, backup, and maintenance. Evaluate whether your team size justifies the operational overhead — teams under 10 SDETs may find Allure static reports sufficient.

**"More report detail is always better"**→ Reports with every console log, every network request, and every DOM snapshot per test generate gigabytes of data that nobody reads. Configure reporting detail by test OUTCOME: minimal detail for passing tests, full detail (screenshots, traces, logs) for failing tests, and medium detail for retried tests. This reduces storage cost and makes failure reports scannable.

**"Test categorization in reports is optional"**→ Without categories, a report with 50 failures shows 50 undifferentiated red items. Categorizing failures as: product defect, test environment issue, test code bug, and known flaky test enables the team to focus on product defects first and triage the rest. Automated categorization based on error patterns (timeout ? environment, assertion ? product, element not found ? test code) saves manual triage time.

**"Report generation should run after all tests complete"**→ If the CI job crashes or times out during test execution, no report is generated. Use reporters that stream results incrementally (ReportPortal, Allure with real-time adapter) so partial results are available even if the run does not complete. A partial report is infinitely more useful than no report.
