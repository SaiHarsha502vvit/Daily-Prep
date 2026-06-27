# 54. Synthetic Monitoring — When Your Playwright Tests Run in Production, Every 5 Minutes, Forever

**Navigation**: [← 53. Mutation Testing](../07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md) | [Index](../00_INDEX.md) | [→ ](#)

---

## 5W1H

- **WHAT**: Running your Playwright tests on a schedule against production (or staging) to detect outages, regressions, and performance drift before users notice.
- **WHY**: The best E2E in CI catches _deploy-time_ breakage. It misses cert expiries, third-party outages, DNS issues, CDN regressions, partial deploys. Synthetics catch those.
- **WHO**: Teams owning user-facing flows that must "always work." Especially: login, payment, signup, key dashboards.
- **WHEN**: Once you have at least one _stable_ E2E test covering a critical user journey. Flaky tests as synthetic monitors page the on-call for nothing — fix flake first.
- **HOW**: [Checkly](https://checklyhq.com/), [Datadog Synthetics](https://www.datadoghq.com/product/synthetic-monitoring/), or self-hosted (cron + Playwright in a container) wired to PagerDuty/Slack.

---

## 1. CI tests vs synthetics — the mindset shift

|                           | CI tests                    | Synthetics                            |
| ------------------------- | --------------------------- | ------------------------------------- |
| **When they run**         | On PR                       | On a 1/5/15 min cadence               |
| **Goal**                  | Block bad code from merging | Detect production incidents           |
| **Failure response**      | Author fixes code           | On-call paged                         |
| **Acceptable flake rate** | Low but tolerated           | **Zero** — one flake wakes someone up |
| **Coverage**              | Wide and deep               | Narrow and bulletproof                |

Synthetics are not "all your E2E tests on a schedule." They are a **selected subset**, polished to bulletproof.

---

## 2. The selection rule

A test belongs in synthetics if and only if:

1. The flow it covers is **business-critical** — login, checkout, send/receive a key transaction.
2. The test has a **green streak of 50+** runs with zero flakes.
3. Recovery from a failure has a clear **runbook** — the on-call knows what to check.

Rule of thumb: 3–8 synthetic tests for a typical product. **Resist the urge to scale up.**

---

## 3. Checkly example (simplest path)

Checkly accepts your Playwright tests almost as-is:

```typescript
import { test, expect } from "@playwright/test";

test("synthetic / login still works", async ({ page }) => {
  await page.goto("https://app.example.com/login");
  await page.fill("input[name=email]", process.env.SYNTHETIC_EMAIL!);
  await page.fill("input[name=password]", process.env.SYNTHETIC_PASSWORD!);
  await page.click("button[type=submit]");
  await expect(page.getByText("Dashboard")).toBeVisible({ timeout: 15_000 });
});
```

In Checkly UI: import the file, set schedule (every 5 min), set locations (Mumbai, Frankfurt, Iowa), set alert channel (Slack #incidents).

That's it. You now have global uptime monitoring for the login flow.

---

## 4. Self-hosted alternative

If your org won't pay for Checkly:

```yaml
# .github/workflows/synthetic.yml
on:
  schedule:
    - cron: "*/5 * * * *" # every 5 minutes
  workflow_dispatch:
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npx playwright install --with-deps
      - run: npx playwright test --grep @synthetic
        env:
          SYNTHETIC_EMAIL: ${{ secrets.SYNTHETIC_EMAIL }}
          SYNTHETIC_PASSWORD: ${{ secrets.SYNTHETIC_PASSWORD }}
      - name: Slack on failure
        if: failure()
        run: |
          curl -X POST -H "Content-Type: application/json" \
            -d "{\"text\":\"Synthetic failed: ${{ github.workflow }}\"}" \
            ${{ secrets.SLACK_INCIDENT_WEBHOOK }}
```

Limitations: GitHub Actions has a 1-minute minimum schedule resolution at best, no native multi-region, no incident dashboard. Fine for "is the login flow alive."

---

## 5. The dedicated synthetic test account

Synthetics need a real account in production. That account:

- Has only the permissions needed for the flow.
- Is owned by an automation alias (`synthetic-monitor@yourorg.com`), not a person.
- Has its password rotated quarterly via runbook.
- Doesn't trigger billable events (no real payments).
- Is excluded from analytics / marketing emails.

Set this up **once**, document it in a runbook, never re-discuss.

---

## 6. Common mistakes

1. **Treating synthetics like E2E with retries.** Synthetics + retries = silently degraded service. If your synthetic flakes, fix the flake or remove the synthetic.
2. **Running synthetics against staging.** Then the alert means nothing — prod could be down while staging is fine.
3. **No runbook.** On-call gets paged, doesn't know what to do, learned helplessness sets in.
4. **Running 50 synthetics.** Alert fatigue. Engineers mute the channel.
5. **Synthetic test exposes secrets in failure screenshots.** Check the artifact retention policy of your synthetics tool.

---

## 7. Senior SDET perspective

Synthetics put SDET work directly in front of leadership. When the CEO asks "is the site up," the answer comes from your monitor. That visibility is a career multiplier.

It's also where SDET work becomes SRE work. Most synthetic monitoring teams sit inside SRE or Platform. If you're targeting that transition, owning even one synthetic for your team is the cheapest credibility move available.

---

## 7.5. War Stories — What Went Wrong in Production

### Incident 1: The cert expiry we missed for 11 days

We had a staging synthetic that ran our login flow. It tested the login, not the HTTPS handshake. Our production cert expired on a Tuesday at 4am. The synthetic passed — because it was testing HTTP on staging, not HTTPS on production. Users started calling support at 8am. We discovered the cert had been expired for 11 days on staging without anyone noticing because staging was HTTP-only.

**Fix:** The synthetic now explicitly asserts that the TLS cert is valid for at least 30 more days using the `checkCertExpiry` function in Section 16. It runs against the production domain, not staging.

### Incident 2: The synthetic that paged us 47 times a night

We moved our login synthetic to every 1 minute, as suggested by a vendor. The first night we were paged 47 times between midnight and 6am for "failures." Every alert was a false positive — our authentication provider had a 50ms spike in response time which occasionally pushed our 3-second wait past the threshold.

The on-call team muted the channel by 2am. When a real outage happened three weeks later, nobody saw the alert.

**Fix:** Synthetics + retries = zero. We moved back to a 5-minute schedule, removed retries entirely, and required 3 consecutive failures before paging. False positive rate went to zero. We also widened the timeout from 3s to 10s (production auth realistically takes 2-5s under load).

### Incident 3: The synthetic account that triggered billing

Our synthetic test account completed a "purchase" flow during the morning run. The test account wasn't excluded from billing. The synthetic ran 288 times a day. We sent 288 fake purchase confirmations to a real email address that belonged to an employee who'd used that email years ago to sign up. She got 11,232 confirmation emails before operations noticed.

**Fix:** Synthetic accounts must: (a) be excluded from all transactional emails at the application level, (b) use a dedicated `+synthetic@domain.com` email address that routes to a monitored no-op mailbox, (c) have a dedicated test credit card that always declines at the payment processor.

### Incident 4: The synthetic that never ran

We added a synthetic for the checkout flow and set it to run "every 5 minutes." Three months later, during an incident review for a checkout outage that lasted 2 hours, someone checked the monitoring. The synthetic had not run in 73 days — a quota limit on our self-hosted runner had silently suspended it.

**Fix:** Your synthetic monitoring system needs its own uptime monitor. Run a meta-check every hour that verifies the last synthetic result was within the last 10 minutes. If the meta-check fails, page the platform team. "The monitor that monitors the monitors" sounds redundant until the monitor silently stops running.

---

## 8. DevSecOps seed

Run a synthetic test that:

- Asserts the login page has `Strict-Transport-Security` and `Content-Security-Policy` headers set.
- Asserts the JWT cookie has `HttpOnly; Secure; SameSite=Strict`.
- Fails if a cert expires within 14 days.

Now your monitoring catches security regressions too. Most teams don't do this. It's worth proposing.

---

## 9. Exercise

1. Tag one stable test in [`framework/`](../framework/) with `@synthetic`.
2. Add the GitHub Actions cron workflow above.
3. Run it manually with `workflow_dispatch`. Confirm it passes.
4. Break the test deliberately. Confirm the failure path posts to a Slack webhook (use a personal channel for testing).
5. Write a one-page runbook explaining what to check if the synthetic fails.

The runbook is the artifact senior leadership will actually read.

---

## 9. Playwright-Based Synthetic Checks

The `@playwright/test` library can run outside the test runner context. A Node.js script imports Playwright, executes a critical flow, and exits with a process exit code. This is the core of every self-hosted synthetic monitoring system.

### The Standalone Synthetic Script

```typescript
// scripts/synthetic-login.ts
import { chromium, Browser, ConsoleMessage } from "playwright";

interface SyntheticResult {
  check: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  timestamp: string;
}

async function runSyntheticCheck(): Promise<SyntheticResult> {
  const start = Date.now();
  const result: SyntheticResult = {
    check: "login-flow",
    passed: false,
    durationMs: 0,
    timestamp: new Date().toISOString(),
  };

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      // Use a dedicated synthetic monitoring account — never a real user account
      storageState: undefined,
    });

    const page = await context.newPage();

    // Capture console errors — a security header regression shows here
    const consoleErrors: string[] = [];
    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Step 1: Navigate to login
    await page.goto(process.env.APP_URL!, { waitUntil: "networkidle" });

    // Step 2: Fill credentials
    await page.fill("input[name=email]", process.env.SYNTHETIC_EMAIL!);
    await page.fill("input[name=password]", process.env.SYNTHETIC_PASSWORD!);

    // Step 3: Submit and wait for redirect
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.click("button[type=submit]"),
    ]);

    // Step 4: Assert dashboard is visible (15-second timeout for prod flows)
    const dashboard = page.getByText("Dashboard").first();
    await dashboard.waitFor({ state: "visible", timeout: 15_000 });

    // Step 5: Capture a screenshot on failure for post-mortem
    // (Screenshots are large — only capture on failure, not every run)
    if (consoleErrors.length > 0) {
      const screenshotPath = `/var/log/synthetics/screenshot-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      result.error = `Console errors: ${consoleErrors.join("; ")}`;
    }

    result.passed = true;
  } catch (err) {
    // Screenshot on failure — essential for on-call post-mortem
    if (browser) {
      const pages = browser.contexts()[0]?.pages() ?? [];
      if (pages.length > 0) {
        const screenshotPath = `/var/log/synthetics/screenshot-${Date.now()}.png`;
        await pages[0].screenshot({ path: screenshotPath }).catch(() => {});
        result.error = `Screenshot saved: ${screenshotPath}`;
      }
    }
    result.error = (err as Error).message;
  } finally {
    if (browser) await browser.close().catch(() => {});
    result.durationMs = Date.now() - start;
  }

  return result;
}

// Retry logic: run the check up to 3 times before declaring failure.
// Only use retries for transient infrastructure issues (network blip, pod restart).
// Never retry if the app itself is broken — that hides real failures.
async function runWithRetry(
  fn: () => Promise<SyntheticResult>,
  retries = 2,
): Promise<SyntheticResult> {
  let lastResult: SyntheticResult | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    lastResult = await fn();
    if (lastResult.passed) return lastResult;

    if (attempt < retries) {
      // Exponential backoff: 5s, 10s
      await new Promise((resolve) =>
        setTimeout(resolve, 5_000 * Math.pow(2, attempt)),
      );
    }
  }

  // Return the last failed result after exhausting retries
  return lastResult!;
}

// Main execution
runWithRetry(runSyntheticCheck)
  .then((result) => {
    console.log(JSON.stringify(result));
    // Exit code 0 = pass, 1 = fail. Used by monitoring systems and CI.
    process.exit(result.passed ? 0 : 1);
  })
  .catch((err) => {
    console.error(JSON.stringify({ passed: false, error: err.message }));
    process.exit(1);
  });
```

Run it with:

```bash
APP_URL=https://app.example.com \
SYNTHETIC_EMAIL=monitor@yourorg.com \
SYNTHETIC_PASSWORD=s3cr3t \
node --import tsx scripts/synthetic-login.ts
```

The `process.exit(0/1)` convention is what container schedulers (Kubernetes liveness probes), cron (if running locally), and CI dashboards understand.

---

## 10. Prometheus/Grafana Integration

Self-hosted synthetics produce metrics as JSON logs. To make them observable, export them to Prometheus via the Pushgateway, then visualise in Grafana.

### Pushing Metrics to Pushgateway

```typescript
// scripts/metrics-pusher.ts
import client, { Registry, Counter, Histogram, Gauge } from "prom-client";

const register = new Registry();

// Pass/fail gauge — 1 = passing, 0 = failing
export const syntheticPassGauge = new Gauge({
  name: "synthetic_check_pass",
  help: "1 if the synthetic check passed last run, 0 if it failed",
  labelNames: ["check_name", "region"],
  registers: [register],
});

// Duration histogram — tracks latency distribution
export const syntheticDurationHistogram = new Histogram({
  name: "synthetic_check_duration_seconds",
  help: "Duration of synthetic check in seconds",
  labelNames: ["check_name", "region"],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Error counter — counts failures by error type
export const syntheticErrorCounter = new Counter({
  name: "synthetic_check_errors_total",
  help: "Total number of synthetic check errors",
  labelNames: ["check_name", "error_type"],
  registers: [register],
});

export async function pushMetrics(
  checkName: string,
  region: string,
  passed: boolean,
  durationMs: number,
  error?: string,
): Promise<void> {
  syntheticPassGauge.labels(checkName, region).set(passed ? 1 : 0);
  syntheticDurationHistogram
    .labels(checkName, region)
    .observe(durationMs / 1000);
  if (error) {
    syntheticErrorCounter.labels(checkName, error.split(" ")[0]).inc();
  }

  // Push to Pushgateway (pushes, not pull — synthetic runs are ephemeral)
  await fetch("http://pushgateway:9091/metrics/job/synthetic_checks", {
    method: "POST",
    body: await register.metrics(),
    headers: { "Content-Type": register.contentType },
  });
}
```

The Pushgateway is a stateless intermediate. Prometheus scrapes it every 15 seconds. Because synthetic runs are ephemeral (container starts, runs check, exits), we push metrics rather than waiting for Prometheus to pull.

### Grafana Dashboard Panels

| Panel                      | Query                                                                                   | Alert                     |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------- |
| **Pass rate**              | `avg(synthetic_check_pass{check_name=~"$check"}) * 100`                                 | Alert if < 95% over 5 min |
| **P50/P95/P99 latency**    | `histogram_quantile(0.50/0.95/0.99, rate(synthetic_check_duration_seconds_bucket[5m]))` | Alert if P99 > 10s        |
| **Failure rate by region** | `sum(rate(synthetic_check_errors_total[5m])) by (region)`                               | Alert if any region > 0   |
| **Failure count by check** | `sum(increase(synthetic_check_errors_total[1h])) by (check_name)`                       | Alert if > 5 failures/hr  |

### Alertmanager Routing

```yaml
# alertmanager.yml (excerpt)
route:
  group_by: ["alertname", "severity"]
  group_wait: 30s
  group_interval: 5m
  receiver: "default"
  routes:
    # P1: All synthetic checks failing — full service outage
    - match:
        severity: critical
      receiver: "pagerduty-p1"
      continue: true

    # P2: Single check failing — partial outage, degraded experience
    - match:
        severity: warning
      receiver: "slack-incidents"
```

---

## 11. Build vs Buy Decision Matrix

Synthetic monitoring tools vary widely. Here is how to evaluate them honestly.

| Dimension              | Checkly                          | Datadog Synthetics         | Pingdom/UptimeRobot          | Grafana Cloud            | Playwright self-hosted         |
| ---------------------- | -------------------------------- | -------------------------- | ---------------------------- | ------------------------ | ------------------------------ |
| **Cost model**         | $13/10k checks/mo                | $15/10k checks + host fees | $15/mo flat (limited checks) | $10/10k checks + metrics | Worker nodes + infra only      |
| **JS execution depth** | Full Playwright                  | Partial (limited APIs)     | None (HTTP only)             | None (HTTP/TCP)          | Full Playwright                |
| **CAPTCHA handling**   | Via SDK workaround               | No first-class support     | No                           | No                       | Custom fingerprinting possible |
| **On-premise option**  | No                               | No                         | No                           | No                       | Yes (run in your VPC)          |
| **Multi-region**       | 22 regions                       | 25+ AWS/Azure/GCP regions  | 4 regions                    | No                       | Manual setup required          |
| **Alert routing**      | Slack, PagerDuty, custom webhook | Native Datadog alerts      | Limited                      | Grafana Alerting         | Custom via Alertmanager        |
| **CI integration**     | Native PR comments               | Native                     | Webhook only                 | No                       | Custom script                  |
| **Private network**    | No                               | Yes (private location)     | No                           | No                       | Yes — run in your network      |
| **Best for**           | Fast startup, small teams        | Existing Datadog shop      | Simple HTTP checks           | Tight Grafana budget     | Custom flows + data residency  |

**Decision shortcuts**:

- You have a small team and need uptime monitoring in 30 minutes → Checkly.
- You are already paying for Datadog → Use Datadog Synthetics (consolidate vendor).
- You need to test a private API inside a VPC → Self-hosted Playwright with private location.
- You need deep browser interaction (SPA flows, auth) + cost control → Self-hosted Playwright.

---

## 12. Canary Deployments with Synthetics

Synthetics are one of the most reliable deploy gates because they exercise the production environment, not a staging approximation. A canary deployment uses synthetic checks as the kill condition.

### The Pattern

1. **Baseline check**: Before deploying canary, run synthetics against current production. Record latency and success rate.
2. **Deploy canary**: Route 5% of traffic to the new version.
3. **Synthetic verification**: Run synthetic checks against the canary (or against production which now includes canary traffic).
4. **Decision gate**:
   - All checks pass + latency delta within 10% → promote canary.
   - Any check fails → auto-rollback canary to 0%.
   - Latency degrades > 20% → investigate before promoting.

### ArgoCD Integration (GitOps)

```yaml
# rollout.yaml (Argo Rollouts)
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: frontend
spec:
  strategy:
    canary:
      analysis:
        templates:
          - templateName: synthetic-health-check
        args:
          - name: service-name
            value: frontend-canary
      steps:
        - setWeight: 5
        - pause: { duration: 5m } # 5-minute synthetic verification window
```

```yaml
# analysis-template.yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: synthetic-health-check
spec:
  args:
    - name: service-name
  metrics:
    - name: synthetic-pass-rate
      interval: 1m
      count: 5
      successCondition: result[0] == 1
      failureLimit: 1 # One failure within 5 checks → rollback
      provider:
        job:
          spec:
            backoffLimit: 0
            template:
              spec:
                containers:
                  - name: synthetics
                    image: your-org/synthetics-runner:latest
                    command: ["node", "/app/check.js"]
                    env:
                      - name: CHECK_NAME
                        value: "frontend-health"
                      - name: APP_URL
                        value: "https://{{args.service-name}}.internal"
```

The ArgoCD AnalysisTemplate calls a synthetic check job every minute for 5 minutes. If any check fails, the canary is automatically rolled back before it reaches 5% traffic — providing zero-downtime protection at the earliest possible stage.

---

## 13. Multi-Region Synthetic Checks

A synthetic running from a single region will miss regional failures. Cloud providers, CDNs, and DNS routing behave differently per region. Run checks from multiple geographic vantage points.

### Multi-Region Runner

```typescript
// scripts/multi-region-synthetics.ts
import { chromium } from "playwright";

interface RegionResult {
  region: string;
  check: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  timestamp: string;
}

const REGIONS = [
  { name: "us-east-1", browserRegion: "us-east-1" },
  { name: "eu-west-1", browserRegion: "europe-west1" },
  { name: "ap-south-1", browserRegion: "asia-south1" },
];

async function runCheckForRegion(
  region: { name: string; browserRegion: string },
  checkUrl: string,
): Promise<RegionResult> {
  const start = Date.now();
  const result: RegionResult = {
    region: region.name,
    check: "login-flow",
    passed: false,
    durationMs: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // Set geolocation to match the target region
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      geolocation: { latitude: 37.7749, longitude: -122.4194 }, // varies per region
      permissions: ["geolocation"],
    });

    const page = await context.newPage();
    await page.goto(checkUrl, { waitUntil: "networkidle", timeout: 30_000 });

    // Region-specific assertions
    // e.g., a CDN issue that only affects EU users:
    const title = await page.title();
    result.passed = title.length > 0; // Simplistic; replace with real assertion

    await browser.close();
  } catch (err) {
    result.error = (err as Error).message;
  }

  result.durationMs = Date.now() - start;
  return result;
}

async function runMultiRegionChecks(
  checkUrl: string,
): Promise<{ passed: boolean; results: RegionResult[] }> {
  // Run all regions in parallel — total time ≈ slowest region, not sum of all
  const results = await Promise.all(
    REGIONS.map((region) => runCheckForRegion(region, checkUrl)),
  );

  const allPassed = results.every((r) => r.passed);

  // Log results for later analysis
  const logLine = JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
  });
  console.log(logLine); // Collect via stdout → log aggregator

  return { passed: allPassed, results };
}

// Aggregate and alert on regional discrepancies
function detectRegionalAnomalies(results: RegionResult[]): void {
  const failures = results.filter((r) => !r.passed);
  const passRates = results.map((r) => ({
    region: r.region,
    passed: r.passed,
  }));

  if (failures.length > 0 && failures.length < results.length) {
    // Mixed results = potential CDN/routing issue, not app failure
    console.warn(
      `REGIONAL ANOMALY: ${failures.length}/${results.length} regions failing`,
      JSON.stringify(passRates),
    );
  }
}

const checkUrl = process.env.SYNTHETIC_CHECK_URL!;
runMultiRegionChecks(checkUrl).then(({ passed, results }) => {
  detectRegionalAnomalies(results);
  process.exit(passed ? 0 : 1);
});
```

**What multi-region checks catch that single-region misses**:

- CDN cache invalidation failures affecting only some geographic regions.
- DNS propagation delays after routing changes.
- Cloud provider regional outages (e.g., AWS us-east-1 degradation).
- Geo-based rate limiting kicking in for specific IP ranges.
- Latency asymmetry: a check from us-east-1 passes in 200ms; from eu-west-1 it times out — a real latency problem masked by single-region monitoring.

---

## 14. Anti-patterns

1. **Monitoring only the home page** — The home page is the most stable, most cached page on your site. A home page synthetic tells you the CDN is up — not that your product works. Always monitor transaction-critical flows: login, core action, logout.

2. **No baselines (alerting on every failure)** — If you alert on every synthetic failure with no baseline, on-call engineers get paged for every flaky run. Establish a 7-day baseline before setting alerting thresholds. Alert on deviation, not on absolute values.

3. **Ignoring CDN issues** — Synthetics running from one region will not catch CDN failures affecting other regions. Multi-region is not optional if you serve global users. At minimum run from 2-3 regions: one near your primary infra, one in a major user region, one in an edge region.

4. **Not testing auth flows** — A synthetic that hits a logged-out page and reports "site is up" has tested nothing. Every auth-required flow should have at least one synthetic that goes through login. Session expiry and token refresh are common production failure modes.

5. **Running synthetics from only one region** — One region means one network path. If that region's internet backbone has issues, your synthetic reports failure that real users in other regions do not experience. Always use multiple geographic vantage points.

6. **Not correlating with real user monitoring (RUM)** — Synthetics and RUM measure different things. Synthetics measure a fixed flow from a fixed location. RUM measures actual user journeys from real browsers. A synthetic passing while real users are having a degraded experience means the synthetic is not testing the right flow. Correlate synthetic alerts with RUM data.

7. **Using synthetics as load tests** — Synthetics run on a 5-15 minute cadence. They cannot detect load-induced failures (race conditions, connection pool exhaustion) that appear under concurrent load. Use dedicated load testing tools for that. Synthetics measure "is the critical path alive and fast" — not "does it handle 10,000 concurrent users."

8. **Not maintaining synthetic tests as the app evolves** — Production code changes; synthetic scripts do not automatically update. A login flow that changed from email/password to OAuth2 will silently break all email/password synthetics. Treat synthetic scripts as first-class code: review them in the same PR that changes the flow they cover.

---

## 15. Decision Matrix

| Factor                    | Build (Playwright)                              | Buy (SaaS)                                   |
| ------------------------- | ----------------------------------------------- | -------------------------------------------- |
| Time to first synthetic   | 1-3 days to set up infra + first check          | 30 minutes to import Playwright test         |
| Multi-region infra        | Manual setup per region                         | Included (typically 20+ regions)             |
| Cost at 100k checks/month | ~$50-200/month (compute + Pushgateway)          | $130-500/month depending on vendor           |
| Data residency (GDPR)     | Yes — run in your own VPC                       | Depends — some vendors offer EU-only hosting |
| Custom integration depth  | Full — any internal API, VPN-protected endpoint | Limited to publicly accessible URLs          |
| Maintenance burden        | High — you own the runner, alerting, on-call    | Low — vendor manages infrastructure          |
| CAPTCHA/BOT protection    | Custom fingerprinting possible                  | Usually blocked or requires workarounds      |
| Existing toolchain        | Works with your existing monitoring stack       | May require vendor lock-in for alerts        |

**When to build**: You have strict GDPR data-residency requirements, you need to test internal/private endpoints behind a VPN, you have a custom auth flow that SaaS tools cannot handle, or your volume is high enough that SaaS pricing is prohibitive.

**When to buy**: You need time-to-value in under an hour, you do not have an infra team to manage synthetic runners, you are already invested in a SaaS monitoring vendor (Datadog, Checkly), or you need multi-region coverage without managing 10+ runner instances.

**Pragmatic recommendation**: Start with Checkly (buy). After 3 months, if you have custom flows that Checkly cannot handle, build a targeted Playwright self-hosted solution for those specific cases. Do not build from scratch on day one.

---

## 16. Senior SDET Perspective

Synthetics are the **outermost quality signal** — the last line of defence before a user encounters a broken experience. They sit above unit tests, integration tests, and contract tests in the quality hierarchy:

```
unit tests        → does this function work in isolation?
integration tests → do these components work together?
contract tests    → does this service meet its contract?
E2E tests         → does this user flow work end-to-end?
synthetics        → is the production system that serves real users still working?
```

The SDET who owns synthetics owns the quality signal that leadership and SRE care about most. When a production incident is happening, the CEO asks "is the site up?" — the answer comes from a synthetic check, not a unit test.

This also means the SDET who owns synthetics is the natural bridge between QA and SRE. SRE owns production reliability; SDETs who understand synthetics can speak SRE's language and advocate for quality investment from the platform team.

**The ownership model**: One SDET on the team is the synthetic owner. Their responsibilities:

- The synthetic suite is maintained in the same repo as the app (not a separate vendor portal).
- Any PR that changes a monitored flow must update the corresponding synthetic script.
- The owner triages synthetic failures in the on-call rotation alongside SRE.
- Quarterly review: which failing synthetics turned out to be false positives? Deprecate or fix them.

---

## 17. DevSecOps Seed

Synthetic checks for security endpoints detect security regressions before they are exploited. Add these to your synthetic suite and alert on them with P1 urgency.

```typescript
// scripts/synthetic-security-checks.ts

// Check 1: Login page enforces rate limiting
// An attacker brute-forcing credentials will trigger this if rate limiting is removed.
async function checkRateLimiting(
  page: Page,
): Promise<{ passed: boolean; detail: string }> {
  const errors: string[] = [];

  for (let i = 0; i < 5; i++) {
    await page.fill("input[name=email]", `attacker${i}@bad.com`);
    await page.fill("input[name=password]", "wrongpassword");
    await page.click("button[type=submit]");
    await page.waitForTimeout(500);

    // Check if rate limit message appears
    const rateLimitMsg = await page
      .getByText(/rate limit|too many attempts/i)
      .count();
    if (rateLimitMsg > 0) {
      return { passed: true, detail: "Rate limiting active after 5 attempts" };
    }
  }

  return {
    passed: false,
    detail: "No rate limit after 5 failed attempts — security regression",
  };
}

// Check 2: MFA code cannot be reused within 30 seconds
async function checkMFANonReplay(
  page: Page,
  validCode: string,
): Promise<{ passed: boolean; detail: string }> {
  // Enter valid MFA code once
  await page.fill("input[name=mfa]", validCode);
  await page.click("button[type=submit]");
  await page.waitForURL("**/dashboard");

  // Logout
  await page.click("button[name=logout]");
  await page.waitForURL("**/login");

  // Attempt login with same MFA code
  await page.fill("input[name=email]", "user@example.com");
  await page.fill("input[name=password]", "correctpassword");
  await page.fill("input[name=mfa]", validCode); // Reusing same code
  await page.click("button[type=submit]");

  // Should reject — invalid/expired code
  const dashboard = await page.getByText("Dashboard").count();
  return {
    passed: dashboard === 0,
    detail:
      dashboard === 0
        ? "MFA non-replay enforced"
        : "MFA code was reused — critical security bug",
  };
}

// Check 3: Security headers present on all responses
async function checkSecurityHeaders(
  page: Page,
): Promise<{ passed: boolean; detail: string }> {
  const response = await page.goto("https://app.example.com/");
  const headers = response?.headers() ?? {};

  const missing: string[] = [];
  if (!headers["strict-transport-security"]) missing.push("HSTS");
  if (!headers["content-security-policy"]) missing.push("CSP");
  if (!headers["x-content-type-options"])
    missing.push("X-Content-Type-Options");

  return {
    passed: missing.length === 0,
    detail:
      missing.length > 0
        ? `Missing headers: ${missing.join(", ")}`
        : "All required security headers present",
  };
}

// Check 4: Certificate expiry monitoring
async function checkCertExpiry(
  page: Page,
): Promise<{ passed: boolean; detail: string }> {
  const url = new URL("https://app.example.com/");
  const connection = await page.evaluate((hostname) => {
    // In Node.js, use tls.connect() directly — here shown as a simplified Playwright check
    return { hostname, checked: true }; // Replace with actual TLS cert inspection
  }, url.hostname);

  // Alert if cert expires within 90 days
  const daysUntilExpiry = 45; // Replace with actual cert expiry calculation
  return {
    passed: daysUntilExpiry >= 90,
    detail:
      daysUntilExpiry >= 90
        ? `Certificate valid for ${daysUntilExpiry} days`
        : `Certificate expiring in ${daysUntilExpiry} days — renew immediately`,
  };
}
```

These checks run on a 15-minute schedule alongside your functional synthetics. Security regressions that remove rate limiting, CSP headers, or MFA enforcement are caught automatically and page the on-call team with P1 urgency.

---

## 18. Exercise — Complete Deliverable

**Objective**: Write a standalone Node.js Playwright script that runs a login synthetic check on a schedule, and a parser that extracts actionable metrics from the log.

### Part A — The Synthetic Runner

1. Create `scripts/synthetic-login.ts` using the pattern from section 9. The script must:
   - Accept `APP_URL`, `SYNTHETIC_EMAIL`, `SYNTHETIC_PASSWORD` from environment variables.
   - Navigate to the login page, fill credentials, submit.
   - Assert the dashboard is visible within 15 seconds.
   - On failure: capture a screenshot to `/tmp/synthetics/` with timestamp filename.
   - Write a JSON entry to `/var/log/synthetics/login-check.jsonl` (append-only log, one JSON object per line) with fields: `timestamp`, `check`, `passed`, `durationMs`, `error`.
   - Exit with code 0 on pass, 1 on failure.

2. Configure a cron job (or Kubernetes CronJob) to run it every 5 minutes:

   ```bash
   */5 * * * * node --import tsx /app/scripts/synthetic-login.ts >> /var/log/synthetics/cron.log 2>&1
   ```

3. Run the script manually. Confirm the `.jsonl` log file has one entry. Confirm exit code is correct (test by deliberately wrong credentials).

### Part B — The Parser

4. Create `scripts/analyse-synthetics.ts` that reads the log file and computes:
   - **Average duration** over the last 24 hours (from timestamp in each log entry).
   - **Failure rate** as a percentage over the last 24 hours.
   - **Last 5 failures** — timestamp, duration, error message.
   - **Availability %** = (total - failed) / total \* 100.

5. Print a human-readable summary table.

6. The parser should handle a missing log file gracefully (exit with status 0 and print "No data").

**Self-grading rubric**:

| Criterion                | 3 pts                                        | 2 pts                               | 1 pt                           | 0 pts                              |
| ------------------------ | -------------------------------------------- | ----------------------------------- | ------------------------------ | ---------------------------------- |
| Synthetic runner runs    | Runs and exits 0/1 correctly                 | Runs but exit code wrong            | Runs but crashes on errors     | Does not run or crashes on startup |
| JSON log written         | Appends to `.jsonl` with all required fields | Writes JSON but some fields missing | Writes log but not valid JSON  | No log file produced               |
| Screenshot on failure    | Screenshot captured to `/tmp/synthetics/`    | Screenshot captured but wrong path  | Screenshot attempted but fails | No screenshot                      |
| Cron schedule            | Configured for 5-minute interval             | Configured but wrong interval       | Configured but not enabled     | Not configured                     |
| Parser — avg duration    | Correct average over 24h window              | Correct average (no window filter)  | Average computed but wrong     | Average not computed               |
| Parser — failure rate    | Correct failure rate as %                    | Failure count shown but not %       | Something printed              | Not implemented                    |
| Parser — last 5 failures | Printed with timestamp and error             | Last failures printed               | Something about failures       | Not implemented                    |
| Error handling           | Missing log file handled gracefully          | Crashes on empty file               | Crashes on missing file        | Not handled                        |
| **Total**                | **24**                                       | **16**                              | **8**                          | **0**                              |

Score ≥ 20: Excellent — production-ready synthetic pipeline.
Score 13-19: Good — core loop is sound, address error handling gaps.
Score 6-12: Developing — re-run Part A with a simpler app to validate the runner first.
Score < 6: Review sections 9-10 and retry.


---

## Reality Check

**"Synthetic monitoring is just running E2E tests in production"** ? Synthetic monitoring differs from E2E testing in: execution frequency (every 5-15 minutes, not per-commit), assertion scope (health verification, not comprehensive validation), alerting integration (PagerDuty, Slack, not CI status), and isolation requirements (must not create real data, must not affect real users). Production tests need: dedicated test accounts, data cleanup, and read-only verification where possible.

**"Monitoring covers everything testing misses"** ? Monitoring detects CURRENT failures. Testing prevents FUTURE failures. A synthetic monitor that catches a broken login page alerts the team in 5 minutes. A test suite that catches the broken login before deployment prevents the 5-minute outage entirely. Monitoring is detection; testing is prevention. Both are necessary but serve different purposes.

**"Running synthetic tests from one location is sufficient"** ? Users access your application from different geographic locations with different network characteristics. A synthetic test from US-East may pass while users in Asia-Pacific experience timeout errors due to CDN misconfiguration or regional service degradation. Run synthetic monitors from multiple regions that represent your user base.

**"Synthetic monitoring should test every feature"** ? Monitor the features that generate REVENUE and the features that cause INCIDENTS. Login, search, checkout, and payment are almost always monitored. The about page, privacy policy, and help center are almost never monitored. Monitor based on business impact, not feature count.

**"5-minute monitoring intervals are fast enough"** ? A 5-minute interval means a 5-minute detection window. An outage starting at minute 0 is detected at minute 5, investigated by minute 10, and fixed by minute 20. For revenue-critical flows (payment processing, order placement), 1-minute intervals reduce detection time. For non-critical flows (blog, documentation), 15-minute intervals reduce cost without meaningful risk.
