# 54. Synthetic Monitoring — When Your Playwright Tests Run in Production, Every 5 Minutes, Forever

**Navigation**: [← 53. Mutation Testing](../07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md) | [Index](../00_INDEX.md) | [→ ](#)

---

## 5W1H

- **WHAT**: Running your Playwright tests on a schedule against production (or staging) to detect outages, regressions, and performance drift before users notice.
- **WHY**: The best E2E in CI catches *deploy-time* breakage. It misses cert expiries, third-party outages, DNS issues, CDN regressions, partial deploys. Synthetics catch those.
- **WHO**: Teams owning user-facing flows that must "always work." Especially: login, payment, signup, key dashboards.
- **WHEN**: Once you have at least one *stable* E2E test covering a critical user journey. Flaky tests as synthetic monitors page the on-call for nothing — fix flake first.
- **HOW**: [Checkly](https://checklyhq.com/), [Datadog Synthetics](https://www.datadoghq.com/product/synthetic-monitoring/), or self-hosted (cron + Playwright in a container) wired to PagerDuty/Slack.

---

## 1. CI tests vs synthetics — the mindset shift

| | CI tests | Synthetics |
|---|---|---|
| **When they run** | On PR | On a 1/5/15 min cadence |
| **Goal** | Block bad code from merging | Detect production incidents |
| **Failure response** | Author fixes code | On-call paged |
| **Acceptable flake rate** | Low but tolerated | **Zero** — one flake wakes someone up |
| **Coverage** | Wide and deep | Narrow and bulletproof |

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
import { test, expect } from '@playwright/test';

test('synthetic / login still works', async ({ page }) => {
  await page.goto('https://app.example.com/login');
  await page.fill('input[name=email]', process.env.SYNTHETIC_EMAIL!);
  await page.fill('input[name=password]', process.env.SYNTHETIC_PASSWORD!);
  await page.click('button[type=submit]');
  await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 15_000 });
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
    - cron: '*/5 * * * *'   # every 5 minutes
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
