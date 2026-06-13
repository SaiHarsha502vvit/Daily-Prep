# 63. SLOs and Error Budgets for Test Automation

[← 62. Cost Governance](./62_Cost_Governance_And_FinOps.md) | [Index](../00_INDEX.md) | [→ 64. Self-Healing Locators](./64_Self_Healing_Locators.md)

---

## 5W1H Header

| Element | Details |
|---------|---------|
| **What** | Service Level Objectives (SLOs) and error budgets applied to test automation infrastructure — defining measurable quality targets, tracking adherence, and making release decisions based on quantified risk |
| **Why** | Without SLOs, teams argue subjectively about "good enough" quality; error budgets provide a mathematical basis for release decisions, preventing both over-testing (waste) and under-testing (risk) |
| **Who** | Principal SDETs, test infrastructure leads, SREs responsible for test platform reliability, and engineering managers balancing delivery velocity against quality |
| **When** | During platform design (SLO definition), continuously (SLO monitoring), and at release gates (error budget consumption) |
| **Where** | Test infrastructure dashboards (Grafana, Datadog), CI/CD pipelines (release gates), alerting systems (PagerDuty, Slack), and test reports |
| **How** | Define measurable SLIs, set data-driven SLO targets, track error budget consumption rate, and integrate budget status into release decision workflows |

---

## Table of Contents

1. [Quality as a Service Level](#1-quality-as-a-service-level)
2. [Defining Test SLOs](#2-defining-test-slos)
3. [SLIs for Test Infrastructure](#3-slis-for-test-infrastructure)
4. [Error Budgets for Quality](#4-error-budgets-for-quality)
5. [Alerting on SLO Breaches](#5-alerting-on-slo-breaches)
6. [Dashboard Design](#6-dashboard-design)
7. [Balancing Speed vs. Coverage](#7-balancing-speed-vs-coverage)
8. [Anti-Patterns](#8-anti-patterns)
9. [Decision Matrix: Which SLOs to Set First](#9-decision-matrix-which-slos-to-set-first)
10. [Senior/Principal Perspective: SLOs as Negotiation Tool](#10-seniorprincipal-perspective-slos-as-negotiation-tool)
11. [DevSecOps Seed: Security SLOs](#11-devsecops-seed-security-slos)
12. [Exercise: Design SLOs for a 500-Test Suite](#12-exercise-design-slos-for-a-500-test-suite)

---

## 1. Quality as a Service Level

### The SRE Analogy

Google's Site Reliability Engineering (SRE) framework defines reliability as a service property:

```
Reliability = MTBF / (MTBF + MTTR)
```

Where:
- **MTBF** = Mean Time Between Failures (how long things work)
- **MTTR** = Mean Time To Repair (how long it takes to fix failures)

Applied to test automation:

```
Test Reliability = MTBF_test_suite / (MTBF_test_suite + MTTR_flaky_fix)
```

A test suite that passes for 100 hours then has a 2-hour incident has 98% reliability. This matches how we think about test suite health: long runs of stability punctuated by incidents.

### The Release Decision Problem

Without SLOs and error budgets, release decisions are subjective:

| Without SLOs | With SLOs |
|-------------|----------|
| "I think this is good enough to ship" | "We have 12% error budget remaining; this release consumes 3%; still acceptable" |
| Arguments between QA and Engineering | Data-driven consensus |
| Fear-driven testing (run more tests = safer = ship slower) | Confidence-driven release (error budget tells us when to slow down) |
| No clear quality bar | Mathematical threshold |

---

## 2. Defining Test SLOs

### SLO Template

An SLO is a **target** (what we want to achieve):

```
**SLO-001: Test Pass Rate**
Type:       Availability
Statement:  "95% of all scheduled test runs must pass (pass rate ≥ 95%)"
Window:     Rolling 7 days
Measurement: (passing_runs / total_runs) × 100
```

### Standard Test SLOs

| SLO ID | Name | Statement | Target | Window |
|--------|------|-----------|--------|--------|
| **SLO-001** | Pass Rate | 95% of scheduled test runs must pass | ≥95% | Rolling 7 days |
| **SLO-002** | P95 Runtime | P95 test execution time ≤ 5 minutes | ≤5 min | Rolling 24 hours |
| **SLO-003** | Flake Rate | Flaky test rate ≤ 2% of total test executions | ≤2% | Rolling 7 days |
| **SLO-004** | Time-to-Feedback | P95 time from commit to test results ≤ 10 minutes | ≤10 min | Rolling 24 hours |
| **SLO-005** | Coverage Trend | Coverage must not decrease by >5% in any 30-day period | ≥-5% delta | Rolling 30 days |

### Defining Each SLO with Formulas

#### SLO-001: Pass Rate

```
target_pass_rate = 0.95
measured_pass_rate = (passing_test_runs / total_test_runs)
SLO status = "MEETS" if measured_pass_rate >= target_pass_rate else "BREACHED"
```

**Example:** 665 passing runs out of 700 total → 95.0% → **MEETS (at threshold)**

#### SLO-002: P95 Runtime

```
target_p95_runtime_minutes = 5
p95_index = floor(len(sorted_runtimes) × 0.95)
measured_p95 = sorted_runtimes[p95_index]
SLO status = "MEETS" if measured_p95 <= target_p95 else "BREACHED"
```

**Example:** P95 of 5.2 minutes on 3,000 executions → **BREACHED (5.2 > 5.0)**

#### SLO-003: Flake Rate

```
target_flake_rate = 0.02
flaky_executions = tests that passed on retry within same run
total_executions = sum of all test executions (including retries)
measured_flake_rate = flaky_executions / total_executions
SLO status = "MEETS" if measured_flake_rate <= target_flake_rate else "BREACHED"
```

**Example:** 350 flaky executions out of 10,000 total → 3.5% → **BREACHED (3.5% > 2%)**

#### SLO-004: Time-to-Feedback

```
target_ttf_minutes = 10
ttf_values = list of (commit_timestamp → results_available_timestamp) deltas
p95_index = floor(len(ttf_values) × 0.95)
measured_p95_ttf = ttf_values[p95_index]
SLO status = "MEETS" if measured_p95_ttf <= target_ttf_minutes else "BREACHED"
```

#### SLO-005: Coverage Trend

```
target_max_coverage_drop = 0.05  # 5%
current_coverage = coverage_measured_today
coverage_30d_ago = coverage_measured_30_days_ago
coverage_delta = current_coverage - coverage_30d_ago
SLO status = "MEETS" if coverage_delta >= -target_max_coverage_drop else "BREACHED"
```

---

## 3. SLIs for Test Infrastructure

### What Is an SLI?

An **SLI (Service Level Indicator)** is a **metric** — the quantitative measurement that feeds an SLO. Every SLO has at least one SLI.

| SLO | SLI(s) |
|-----|--------|
| Pass Rate | `pass_rate = passing / total` |
| P95 Runtime | `p95_runtime`, `p50_runtime`, `p99_runtime` |
| Flake Rate | `flake_rate`, `flake_count`, `unique_flaky_tests` |
| Time-to-Feedback | `ttf_p50`, `ttf_p95`, `queue_time`, `execution_time` |
| Coverage Trend | `coverage_percentage`, `coverage_delta_7d`, `coverage_delta_30d` |

### Comprehensive SLI List

| SLI | Definition | Good | Warning | Critical |
|-----|------------|------|---------|----------|
| `pass_rate` | Passing runs / total runs | >95% | 90–95% | <90% |
| `flake_rate` | Flaky passes / total executions | <2% | 2–5% | >5% |
| `p50_duration_min` | 50th percentile test duration | <2 min | 2–3 min | >3 min |
| `p95_duration_min` | 95th percentile test duration | <5 min | 5–7 min | >7 min |
| `p99_duration_min` | 99th percentile test duration | <10 min | 10–15 min | >15 min |
| `ttf_p95_min` | 95th percentile time-to-feedback | <10 min | 10–15 min | >15 min |
| `ci_queue_time_min` | Time tests wait in CI queue | <2 min | 2–5 min | >5 min |
| `retry_rate` | Retries / total executions | <5% | 5–10% | >10% |
| `unique_failures` | Distinct failing tests per run | <20 | 20–50 | >50 |
| `coverage_percentage` | Line/branch coverage by tests | >80% | 70–80% | <70% |
| `infrastructure_cost_usd` | Daily test infra spend | <$100 | $100–$200 | >$200 |

### SLI Collection Example

```yaml
slis:
  - name: pass_rate
    source: ci_api
    query: "SELECT COUNT(*) WHERE status='pass' / COUNT(*) WHERE status IN ('pass','fail')"
    interval: 60s
    export: prometheus
```

---

## 4. Error Budgets for Quality

### What Is an Error Budget?

An **error budget** is the acceptable level of unreliability — the "room for error" built into your SLO.

```
Error Budget = 100% - SLO_target

SLO target = 95% pass rate
Error budget = 5% of test runs can fail

In 7 days with 700 test runs:
  Error budget = 700 × 0.05 = 35 failures allowed
```

### Error Budget Consumption Formula

```
Error Budget Remaining (%) = 1 - (failures_in_window / error_budget_capacity)
Error Budget Burn Rate = failures_this_period / failures_last_period
  - Burn rate > 1.0: Consuming budget faster than before (bad)
  - Burn rate = 1.0: Consuming at expected rate
  - Burn rate < 1.0: Consuming slower than expected (good)
```

### Error Budget Policy

| Budget Remaining | Status | Action |
|-----------------|--------|--------|
| 100–50% | 🟢 Healthy | Normal operations |
| 50–25% | 🟡 Warning | Investigate trends; prepare for slowdown |
| 25–10% | 🟠 Critical | Slow down releases; prioritize reliability work |
| 10–0% | 🔴 Exhausted | Stop releases; full focus on reliability |
| 0% | ⚫ Breached | Emergency; release freeze until root cause fixed |

### Worked Example: Error Budget for 500-Test Suite

**Assumptions:**
- 500 tests, run daily (700 runs/week)
- SLO target: 98% pass rate (2% error budget)
- Error budget capacity: 700 × 0.02 = **14 failures per week**

| Week | Failures | Budget Consumed | Remaining | Status |
|------|----------|-----------------|-----------|--------|
| Week 1 | 8 | 8/14 = 57% | 43% | 🟡 Warning |
| Week 2 | 6 | 14/14 = 100% | 0% | ⚫ Breached |

Week 2 breach triggers **release freeze** — no new releases until budget recovers.

### Error Budget Recovery

```
Recovery time estimation:
  Weekly_budget = 14 failures
  Fix 3 tests permanently → new weekly failures = 11
  New consumption rate: 11/14 = 78.5%
  Time to full recovery: ~1.3 weeks of running below burn rate
```

---

## 5. Alerting on SLO Breaches

### Alert Severity Levels

| Severity | Trigger Condition | Response Time | Channels |
|----------|------------------|---------------|----------|
| **P1 - Critical** | Error budget ≤ 0%, or pass rate < 90% for 1+ hours | 15 min | PagerDuty (immediate), Slack #incidents |
| **P2 - High** | Error budget < 25%, or pass rate < 95% for 4+ hours | 1 hour | PagerDuty (business hours), Slack #qa-alerts |
| **P3 - Warning** | Error budget < 50%, or single SLO breach | 4 hours | Slack #qa-alerts |
| **P4 - Info** | SLO at risk (trend analysis) | Next business day | Email digest |

### PagerDuty Integration

```javascript
const pdEvent = {
  routing_key: process.env.PAGERDUTY_ROUTING_KEY,
  event_action: 'trigger',
  dedup_key: `slo-error-budget-${windowStart}-${windowEnd}`,
  payload: {
    severity: 'critical',
    summary: `[ALERT] Test Error Budget Breached - ${failuresThisWindow}/${weeklyBudget} failures consumed`,
    source: 'test-automation-platform',
    component: 'test-suite',
    class: 'slo_breach',
    custom_details: {
      window: '2024-W24',
      failures: 15,
      weekly_budget: 14,
      budget_consumed_pct: 107,
      affected_teams: ['frontend', 'api', 'mobile'],
      runbook_url: 'https://wiki.internal/runbooks/test-slo-breach'
    }
  }
};
```

### Slack Alert Example

```yaml
webhook_url: https://hooks.slack.com/services/XXX/YYY/ZZZ

message: |
  :warning: *Test Error Budget Warning*
  
  *Window:* 2024-W24 (Jun 3–Jun 10)
  *Failures:* 11 / 14 budgeted
  *Remaining:* 21% (:red_circle: Critical)
  
  *Trajectory:* At current burn rate, budget exhausted in ~1.5 days
  
  *Action Required:*
  > 1. Investigate top 5 failing tests: <link>
  > 2. Consider slowing release cadence
  > 3. Escalate if no improvement in 24h
```

### Runbook Template

Every alert must link to a **runbook** with:
1. What to check first (3-step triage)
2. Common causes and fixes
3. Escalation path
4. Post-incident requirements

```markdown
# Runbook: Test SLO Error Budget Breach

## Immediate Triage (first 10 minutes)
1. Check Grafana: real breach or measurement lag?
2. Check for recent infra changes
3. Check flake rate: stability or coverage issue?

## If Flake Rate Issue
1. Run `flaky-test-analyzer` to identify top offenders
2. Quarantine top 5 flaky tests until fixed
3. Create tickets; assign to owning team

## Escalation
- Unresolved in 30 min → page Test Infrastructure Lead
- Error budget < 0% for >2 hours → page VP Engineering
```

---

## 6. Dashboard Design

### Grafana Dashboard Layout (Simplified)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TEST INFRASTRUCTURE SLO DASHBOARD                              [Last 7 days] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐  ┌────────────────────────────────────────┐│
│  │     ERROR BUDGET GAUGE      │  │     PASS RATE TREND                    ││
│  │                             │  │                                        ││
│  │         ╭─────╮             │  │   100%┤ ─ ─ ─ ─ ─ ─ ─ ─                ││
│  │        ╱  21%  ╲           │  │    95%┤─────────────●──────              ││
│  │       │REMNG │             │  │    90%┤                                ││
│  │        ╲     ╱             │  │       └────────────────────────         ││
│  │         ╰─────╯            │  │         Mon  Tue  Wed  Thu  Fri        ││
│  │      🟡 WARNING             │  │                                        ││
│  └─────────────────────────────┘  └────────────────────────────────────────┘│
│                                                                              │
│  ┌───────────────────────────────┐  ┌──────────────────────────────────────┐│
│  │    TOP FLAKY TESTS           │  │     TIME-TO-FEEDBACK (P95)           ││
│  │  ───────────────────────────  │  │                                      ││
│  │  checkout.spec.ts  │ 47 │15.7%│ │    15min┤               ┌──●──        ││
│  │  auth.spec.ts      │ 31 │10.3%│ │    10min┤ ─ ─ ─ ─ ─ ─●──┘            ││
│  │  cart.spec.ts      │ 28 │ 9.3%│ │     5min┤●──●──●──●───               ││
│  │  search.spec.ts    │ 22 │ 7.3%│ │         └───────────────────────     ││
│  └───────────────────────────────┘  └──────────────────────────────────────┘│
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  RECENT BREACHES  │  [BREACHED] SLO-002 P95 5.2min>5min  │ 08:30 UTC │  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Panel Specifications

| Panel | Query | Alert Threshold |
|-------|-------|----------------|
| Error Budget Gauge | `(1 - (failures / weekly_budget)) * 100` | <25% = Warning, <10% = Critical |
| Pass Rate Trend | `rate(test_run_pass_total[5m]) / rate(test_run_total[5m])` | <95% = Warning |
| P95 Runtime | `histogram_quantile(0.95, rate(test_duration_seconds_bucket[5m]))` | >300s = Warning |
| Time-to-Feedback | `histogram_quantile(0.95, rate(ttf_seconds_bucket[5m]))` | >600s = Warning |
| Flake Rate | `rate(test_flaky_total[1h]) / rate(test_execution_total[1h])` | >0.02 = Warning |
| Coverage Trend | `test_coverage_percentage{env="prod"}` | <75% = Warning |

---

## 7. Balancing Speed vs. Coverage

### The Fundamental Tension

```
Every test takes time to run.
Every minute of test time delays feedback.
More coverage → more time → slower feedback.

But: More coverage → fewer bugs in production → less MTTR → faster recovery.

Net effect: U-curve of total cost vs. test investment
  - Too few tests: high production bug cost
  - Too many tests: high CI cost + slow feedback
  - Optimal: somewhere in the middle (SLO-defined)
```

### Mathematical Model

```
Total Cost = Cost_CI(test_count) + Cost_Production_Bugs(test_count)

Cost_CI(test_count) = test_count × cost_per_test + cost_of_slow_feedback
  - Grows linearly with test count
  - Adds non-linear feedback delay cost above SLO threshold

Cost_Production_Bugs(test_count) = bug_rate(test_count) × cost_per_bug
  - Decreases with more testing (coverage)
  - Diminishing returns at high coverage levels

Optimal test_count = argmin(Cost_CI + Cost_Production_Bugs)
```

### How SLOs Resolve the Debate

| Debate | Without SLOs | With SLOs |
|--------|-------------|----------|
| "Should we add these 200 tests?" | "Safer" vs. "too slow" | Check if P95 runtime SLO has headroom |
| "Can we skip tests for faster release?" | "Probably fine" | Error budget calculation: 21% remaining, release consumes 5%, acceptable |
| "Why are tests so slow?" | Blame game | Dashboard shows exact SLO breach and contributing tests |
| "Do we need to fix flaky tests now?" | "When we have time" | Error budget burning at 2× rate; critical within 48h or release freeze |

### SLO-Based Decision Framework

```
Before adding a test:
  1. Does P95 runtime SLO have headroom?
     - Yes: add test; monitor impact
     - No: evaluate if new test replaces less-critical test
  
Before skipping tests for speed:
  1. What % of error budget remains?
     - >50%: acceptable risk
     - 25–50%: only skip tests with <1% historical failure rate
     - <25%: do not skip; prioritize fixing slow tests
  
Before shipping with known failures:
  1. How many failures against weekly budget?
     - <budget: ship; document risk
     - >budget: do not ship; fix or defer
```

---

## 8. Anti-Patterns

### 1. 100% Pass Rate as SLO

Setting SLO target to 100% is mathematically impossible for any real-world test suite. It creates perverse incentives: teams hide failures, error budget becomes 0%, flaky tests go unaddressed.

**Fix:** Set SLO to 95–98% pass rate based on historical baseline.

### 2. Ignoring Flaky Tests in Metrics

If you report pass rate as `(passing / total)` without separating first-attempt passes from passes-on-retry, you hide the true flake rate:

```
Reported pass rate: 97% (looks great)
Actual first-attempt pass rate: 89% (terrible)
Flake rate: 8% (very high)
```

**Fix:** Measure first_attempt_pass_rate, not pass_rate_including_retries.

### 3. Alerting on Every Failure

Every failed test triggering PagerDuty = alert fatigue. Real incidents are missed.

**Fix:** Only alert on **SLO breaches**, not individual test failures. Individual failures go to dashboards.

### 4. Not Measuring Time-to-Feedback

Tracking pass rate but not TTF misses developer experience impact:

```
Pass rate: 96% (meets SLO)
Time-to-feedback: 45 minutes (4.5× over SLO target of 10 min)
Your developers are waiting 45 minutes for feedback. SLO is breached.
```

**Fix:** Always track TTF alongside pass rate.

### 5. Static SLOs

An SLO set in 2022 and never revised becomes meaningless as the system evolves.

**Fix:** Quarterly SLO review — assess whether targets are still realistic given system evolution.

### 6. Punishing Teams for Breaches Without Support

Error budget exhaustion followed by "you're in trouble; fix it" without resources destroys morale and hides failures.

**Fix:** Error budget breach should trigger **support**, not blame. Allocate engineering time to help.

### 7. SLOs Without Error Budgets

"Weak SLO target is 95%; we're at 94%" — so what? Without error budgets, there's no framework for "how far can we push before stopping."

**Fix:** Always calculate error budget alongside SLO. "94% = 50% of weekly budget consumed in one day" is actionable.

### 8. Measuring Coverage Instead of Confidence

Coverage percentage tells you what % of code is exercised, not if tests validate correct behavior:

```
Coverage: 90% (great!)
Assertions: `expect(true).toBe(true)` (worthless)
Confidence: 0%
```

**Fix:** Measure confidence separately — mutation testing, bug detection rate, historical escape rate.

---

## 9. Decision Matrix: Which SLOs to Set First

| Team Stage | Start With | Then Add | Avoid Initially |
|-----------|-----------|---------|----------------|
| **New team (< 3 months)** | Pass Rate (SLO-001) | P95 Runtime (SLO-002) | Cost SLOs |
| **Growing team (3–12 months)** | Pass Rate + Flake Rate (SLO-003) | Time-to-Feedback (SLO-004) | Coverage SLOs |
| **Mature team (1–2 years)** | All 5 standard SLOs | Cost SLOs | Nothing |
| **Platform team (multi-team)** | TTF + Pass Rate (shared) | Cross-team flake tracking | Team-specific SLOs |
| **Enterprise (compliance)** | Pass Rate + Coverage | Security SLOs | All (need baseline) |

### SLO Prioritization Logic

```
Priority 1 (always): Pass Rate
  - Universal relevance: every team cares if tests pass
  - Easy to measure: binary outcome
  - High impact: directly gates releases

Priority 2 (if tests > 5 min): P95 Runtime
  - Developer experience impact is high
  - Easy to measure: duration tracking
  - Actionable: directly points to slow tests

Priority 3 (if flake > 2%): Flake Rate
  - High false signal noise without it
  - Directly impacts error budget accuracy
  - Requires: first-attempt-only measurement

Priority 4 (if CI queues > 2 min): TTF
  - Queue time often dominates execution time
  - Easy to measure: CI webhook timestamps
  - Actionable: scaling or sharding decisions

Priority 5 (if coverage declining): Coverage Trend
  - Only relevant if coverage is measured accurately
  - Requires: stable coverage measurement tooling
  - Dangerous if not tied to confidence metrics
```

---

## 10. Senior/Principal Perspective: SLOs as Negotiation Tool

### The Negotiation Problem

Engineering leadership wants: **fast releases**
QA/Reliability wants: **thorough testing**
Finance wants: **low cost**

Without SLOs: subjective debates. With SLOs: quantitative trade-off analysis.

### Using SLOs in Release Negotiations

**Scenario:** Product manager wants to ship today; QA engineer says tests are failing.

**Without SLOs:**
- PM: "We've waited 2 weeks; ship it."
- QA: "We found 6 failures; not safe."
- Argument: subjective, unresolvable.

**With SLOs:**
- QA: "We have 21% error budget remaining. These 6 failures consume 43% of weekly budget. If we ship today and see similar failure rate, we'll hit release freeze by end of week."
- PM: "So we can ship, but need to fix those failures first or we lose the ability to ship for a week?"
- QA: "Exactly. Or we can skip the 2 lowest-risk failures and stay within budget."
- PM: "Which ones?"
- QA: "Here's the risk analysis. Ship with these 4 fixes, defer those 2 to Monday."

**Result:** Data-driven decision, not argument.

### Using SLOs to Justify Investment

**Without SLOs:** "Our tests are slow and flaky. We need $50K to fix it." → Finance: "Why?" → You: "It would be better."

**With SLOs:**
- "P95 runtime is 12 minutes, 20% over SLO. Flake rate is 4.7%, 2.4× over SLO. This means: (a) 15% of PRs miss sprint deadlines, (b) we ship with known failures 30% of the time."
- Finance: "What's the cost of production bugs?"
- You: "Average bug costs $15K to fix. If we prevent 10 bugs/year, ROI is $150K. The $50K investment pays back in 4 months."
- Finance: "Approved."

### Template: SLO Investment Proposal

```markdown
# SLO Improvement Investment Proposal

## Current State
- SLO-002 (P95 Runtime): 12.3 min vs. 5 min target → 146% over
- SLO-003 (Flake Rate): 4.7% vs. 2% target → 135% over
- Impact: 15% developer time lost to CI wait; 4 production bugs last quarter

## Proposed Investment
| Item | Cost | Impact |
|------|------|--------|
| Flaky test remediation (40 tests) | $20K | Reduces flake to <2% |
| Test sharding (10 → 20 shards) | $15K | Reduces P95 to 6.5 min |
| Test selection service | $15K | Reduces CI cost 30% |

## ROI
- Current bug rate: 4/quarter
- Projected reduction: 50% → 2 bugs/quarter
- Cost savings: 2 × $15K × 4 = $120K/year
- Investment: $50K
- **Payback: 5 months**

## Risk if Not Approved
- Error budget exhaustion within 2 months
- Release freeze impacting 20+ engineers
- Estimated cost of slowdowns: $40K/quarter
```

---

## 11. DevSecOps Seed: Security SLOs

### Why Security Needs SLOs

Standard test SLOs measure **functional quality**. Security SLOs measure **security posture over time**.

### Security SLI Table

| SLI | Definition | Target | Window |
|-----|------------|--------|--------|
| Vulnerability Detection Time | Time from code push to CVE/vulnerability detection | P95 ≤ 24 hours | Rolling 7 days |
| Patch Verification Time | Time from patch available to CI confirming fix | P95 ≤ 2 hours | Rolling 7 days |
| Secret Leak Detection | Time from secret committed to detection + revocation | P95 ≤ 15 minutes | Rolling 30 days |
| Security Test Pass Rate | % of security regression tests passing | ≥ 98% | Rolling 7 days |

### Security Error Budget Policy

| Budget | Action |
|--------|--------|
| Critical CVE detected > 24h | P1 alert → security team immediate |
| Secret leak detected > 15 min | P1 alert → rotate credentials immediately |
| Critical patch not verified in 7 days | P2 alert → escalation to security lead |
| Security test pass rate < 95% | P3 alert → block releases |

---

## 12. Exercise: Design SLOs for a 500-Test Suite

### Scenario

Your company has a 500-test Playwright suite running on GitHub Actions. The team has:
- 25 engineers making PRs
- 8-hour CI queue at peak times (workers fully utilized)
- Historically: 4–6 flaky tests causing confusion
- No current SLOs or error budgets

**Context:**
- Tests run: on every PR + nightly (full suite)
- PR frequency: ~15 PRs/day
- Nightly run: full 500-test suite at 2 AM
- Current issues: slow feedback, unclear "good enough" bar, debates about shipping with known failures

### Task

**Part A: Define 5 SLOs** (use the format from Section 2) based on the context. Explain your target choices.

**Part B: Calculate error budget** for the weekly sprint cycle (assume 105 total runs: 70 PR runs + 35 nightly runs). Show the budget consumption table for a week with 12 failures.

**Part C: Design 3 alerts** (use the format from Section 5). Include P1, P2, and P3 severity.

**Part D: Present the SLO proposal** to engineering leadership. Write the executive summary (3–5 sentences).

### Self-Grading Rubric

| Criterion | Exceeds (90–100%) | Meets (70–89%) | Approaching (50–69%) | Below (0–49%) |
|-----------|------------------|----------------|---------------------|---------------|
| **Part A: SLO relevance** | 5 SLOs address actual pain points (speed, flake, release decisions); targets justified by data | 5 SLOs; targets plausible but justification generic | <5 SLOs or targets not justified | No SLOs or irrelevant |
| **Part A: SLO format** | All 5 SLOs use exact template from Section 2 (type, statement, window, measurement) | All 5 SLOs with minor format gaps | Partial SLOs (missing fields) | Not using template |
| **Part B: Error budget calc** | Weekly budget correct, consumption table accurate, clear status | Budget correct, table mostly accurate | Budget errors or incomplete | Fundamental misunderstanding |
| **Part C: Alert design** | All 3 alerts (P1/P2/P3) with correct triggers | 3 alerts, mostly correct triggers | <3 alerts or incorrect severity | No alerts or nonsensical |
| **Part D: Executive summary** | Concise, quantifies impact, addresses leadership priorities | Clear but verbose or missing one element | Vague or not addressing "why now" | No summary |

---

**Navigation**

[← 62. Cost Governance](./62_Cost_Governance_And_FinOps.md) | [Index](../00_INDEX.md) | [→ 64. Self-Healing Locators](./64_Self_Healing_Locators.md)

---

*Co-Authored-By: Kimchi <noreply@kimchi.dev>*