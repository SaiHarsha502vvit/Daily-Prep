# Synthetic Monitoring

> **Canonical lesson:** [54 Synthetic Monitoring](../../06_CI_CD_And_Reliability/54_Synthetic_Monitoring.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> Specialised reference for running Playwright tests as production monitors on a schedule. Checkly, Datadog Synthetics, cron-based runs, alerting, SLA reporting.

---

## Table of contents

1. [What synthetic monitoring is](#1-what-it-is)
2. [Synthetic vs E2E vs RUM](#2-vs-others)
3. [Checkly](#3-checkly)
4. [Datadog Synthetics](#4-datadog)
5. [Self-hosted (cron + Playwright)](#5-self-hosted)
6. [Alerting](#6-alerting)
7. [SLO/SLA reporting](#7-slo-sla)
8. [Cost vs value](#8-cost-value)

---

## 1. What it is

Run a test every N minutes against PRODUCTION. If the test fails, the on-call engineer is alerted.

Use cases:

- Critical user flow monitor (signup, login, checkout).
- Third-party dependency monitor (payment gateway, IdP).
- Geographic availability check.
- Performance budget enforcement (LCP > 3s = alert).

---

## 2. vs others

| Type                       | What                                                      |
| -------------------------- | --------------------------------------------------------- |
| Functional E2E (PR / CI)   | Catch regressions before deploy                           |
| Synthetic monitoring       | Catch problems after deploy, before users notice          |
| RUM (Real User Monitoring) | Tell you problems users ARE noticing (after they noticed) |

Synthetic monitors are the BRIDGE between deploy and user impact.

---

## 3. Checkly

Native Playwright support. Hosted SaaS.

```typescript
// __checks__/checkout.check.ts
import { test, expect } from "@playwright/test";

test("checkout flow works end-to-end", async ({ page }) => {
  await page.goto("https://app.example.com/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Email").fill(process.env.MONITOR_EMAIL!);
  await page.getByLabel("Password").fill(process.env.MONITOR_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/dashboard/);
});
```

```typescript
// checkly.config.ts
import { defineConfig } from "checkly";

export default defineConfig({
  projectName: "production-monitors",
  checks: {
    frequency: 10, // run every 10 minutes
    locations: ["us-east-1", "eu-west-1", "ap-southeast-1"],
    runtimeId: "2024.02",
    alertChannels: [{ id: "slack-prod-alerts" }, { id: "pagerduty-oncall" }],
  },
});
```

Push:

```bash
npx checkly deploy
```

Now `checkout.check.ts` runs every 10 minutes from 3 regions. Failures alert.

### 3.1 Checkly advantages

- Native Playwright (same API, same fixtures).
- Multi-region by default.
- Visual dashboards, charts.
- Integration with Slack, PagerDuty, etc.

---

## 4. Datadog Synthetics

```yaml
# datadog-synthetics.yaml
- type: browser
  name: Checkout flow
  status: live
  locations: ["aws:us-east-1", "aws:eu-west-1"]
  frequency: 600 # seconds
  steps:
    - type: goto
      url: "https://app.example.com/"
    - type: click
      selector: "role=link[name=Sign in]"
    # ... etc.
```

Or via the SaaS UI / API.

Datadog Synthetics has its own DSL — not Playwright. Less flexible but integrates with the Datadog observability platform.

---

## 5. Self-hosted

```yaml
# .github/workflows/synthetic.yml
on:
  schedule:
    - cron: "*/10 * * * *" # every 10 minutes
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: npx playwright install --with-deps chromium
      - run: npm ci
      - run: npx playwright test tests/monitors/
        env:
          BASE_URL: https://app.example.com
      - name: Alert on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            { "text": "🚨 Production monitor failed" }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

GitHub Actions has a 5-minute cron minimum. For 1-minute intervals, use Checkly or a separate scheduler.

---

## 6. Alerting

### 6.1 Don't page on flake

A single flaky run shouldn't page someone at 3am. Patterns:

- Require 2-3 consecutive failures before alerting.
- Tiered alerts: Slack for first failure, PagerDuty for second.
- Cooldown periods: don't re-alert if already alerted.

```typescript
// Checkly alerting config
alertChannels: [{
  id: 'slack',
  sendDegraded: true,           // for performance regressions
  sendRecovery: true,
  sslExpiry: true,
  thresholdType: 'CHECK_COUNT',
  threshold: 2,                  // 2 consecutive failures before alert
}],
```

### 6.2 Severity by flow

- Login broken → critical, page immediately.
- Search slow → warning, Slack only.
- Logout slow → low priority, daily digest.

---

## 7. SLO/SLA reporting

```
SLO: 99.5% of monitor runs succeed in any 30-day window.
```

Track:

- Monitor runs / month.
- Successful runs.
- Calculate availability.
- Surface on internal dashboard.

If you commit to SLAs with customers, synthetic monitors are evidence.

---

## 8. Cost vs value

| Approach                   | Cost (~)        | Value                                 |
| -------------------------- | --------------- | ------------------------------------- |
| Checkly free tier          | $0              | Basic single-region                   |
| Checkly paid               | $80–$500/mo     | Multi-region, dashboards, alerting    |
| Datadog Synthetics         | $5 per 10K runs | Tightly integrated with Datadog stack |
| Self-hosted GitHub Actions | $0–$50/mo       | Flexible but you maintain             |
| Selenium Grid + cron       | Free            | DIY, lots of ops                      |

For a 5-monitor setup running every 10 minutes: ~22000 runs/month. Cheap on Datadog, mid-price on Checkly.

---

## Cross-references

- CI patterns (cron in GHA): [`../reference/10_ci_docker.md`](../quick_reference/10_ci_docker.md)
- Performance budgets (alerting on perf): [`./performance.md`](./performance.md)
- Reporting (custom alert reporters): [`../reference/11_reporting.md §13`](../quick_reference/11_reporting.md#13-custom-reporters--5-real-world-examples)
