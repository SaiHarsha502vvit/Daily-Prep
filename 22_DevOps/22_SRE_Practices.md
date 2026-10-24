> **Navigation**: [← Monitoring](21_Monitoring_Observability.md) | [Index](00_INDEX.md) | [Next → GitOps](23_GitOps_Deployments.md)

# 🚨 Chapter 22: SRE Practices — Running Production Like Google

> _"SRE is what happens when you ask a software engineer to design an operations function. Instead of heroes putting out fires, you get systems that prevent fires — and math that tells you when to stop adding features and focus on reliability."_

---

# PART 1: SRE Foundations — The Philosophy

---

```
TRADITIONAL OPS:
  Operations team manually deploys, monitors, responds to incidents.
  More users → more work → hire more ops people → doesn't scale.

SRE (Site Reliability Engineering — Google, 2003):
  Software engineers who happen to run production.
  AUTOMATE EVERYTHING: deployments, monitoring, incident response, capacity planning.

  KEY PRINCIPLES:
  1. Embrace risk (accept that failure will happen — plan for it).
  2. SLOs define reliability (customers define "good enough," not engineering).
  3. Reduce toil (automate repetitive work).
  4. Move fast with error budgets (math-based feature vs reliability decisions).
  5. Blameless postmortems (learn from failures, don't punish people).

OPERATIONS IS A SOFTWARE PROBLEM.
```

---

# PART 2: SLIs, SLOs, SLAs — The Reliability Math

---

```
SLI (Service Level Indicator):
  A MEASUREMENT of service quality.
  "What are we measuring?"

  Availability SLI:
    successful_requests / total_requests × 100
    → "99.2% of requests returned non-5xx in the last 30 days"

  Latency SLI:
    requests_under_threshold / total_requests × 100
    → "95.1% of requests completed in < 200ms"

  Correctness SLI:
    correct_responses / total_responses × 100
    → "99.99% of calculations returned correct results"

SLO (Service Level Objective):
  A TARGET for the SLI.
  "What's our goal?"

  SLO: 99.9% availability (measured over 30-day rolling window).
  Meaning: we tolerate up to 43.2 minutes of downtime per month.

  SLO: 95% of requests complete in < 200ms.
  Meaning: 5% of requests can be slow, but not more.

  THE NINES TABLE:
  ┌──────────┬─────────────────┬────────────────┬────────────────┐
  │ Target   │ Downtime/year   │ Downtime/month │ Downtime/day   │
  ├──────────┼─────────────────┼────────────────┼────────────────┤
  │ 99%      │ 3.65 days       │ 7.31 hours     │ 14.4 minutes   │
  │ 99.9%    │ 8.76 hours      │ 43.2 minutes   │ 1.44 minutes   │
  │ 99.95%   │ 4.38 hours      │ 21.6 minutes   │ 43.2 seconds   │
  │ 99.99%   │ 52.6 minutes    │ 4.32 minutes   │ 8.64 seconds   │
  │ 99.999%  │ 5.26 minutes    │ 25.9 seconds   │ 0.86 seconds   │
  └──────────┴─────────────────┴────────────────┴────────────────┘

  Every additional nine is 10x harder to achieve and 10x more expensive!
  99% → 99.9%: add redundancy, health checks.
  99.9% → 99.99%: multi-region, sophisticated failover, chaos testing.
  99.99% → 99.999%: extreme engineering (database replication, CDN everywhere).

SLA (Service Level Agreement):
  A CONTRACT with customers. Legal and financial consequences.
  "If we fail to meet 99.9% availability, we credit 10% of your bill."

  SLA is ALWAYS looser than SLO (internal target is stricter than customer promise).
  SLO: 99.95% | SLA: 99.9% → gives buffer for internal issues.

ERROR BUDGET:
  Error budget = 1 - SLO.
  SLO: 99.9% → Error budget: 0.1% → 43.2 minutes of downtime/month.

  If budget is HEALTHY (plenty left):
    → Ship features faster. Take more risks. Deploy more often.

  If budget is CONSUMED:
    → STOP shipping new features. Focus entirely on reliability.
    → Fix bugs, add monitoring, improve testing, fix infrastructure.

  This is the MAGIC of SRE. It creates a self-regulating system:
  Product team wants features → but they also want uptime →
  if they break things → they exhaust budget → forced to fix reliability first.
```

---

# PART 3: Incident Management

---

```
INCIDENT LIFECYCLE:

1. DETECTION (fastest possible):
   → Monitoring alert fires (Prometheus → PagerDuty → on-call SRE).
   → Customer report (SLOWER — means monitoring missed it!).
   → Synthetic monitoring (automated tests that probe your service regularly).

   GOAL: detect within 1-5 minutes. Not 30 minutes.

2. TRIAGE:
   Impact assessment: How many users? Which features? Revenue impact?
   Severity classification:
   SEV-1: Total outage. All users affected. Immediate response. All hands.
   SEV-2: Major feature down. Significant user impact. On-call + escalation.
   SEV-3: Minor feature degraded. Some users affected. On-call handles.
   SEV-4: Very minor issue. No user impact. Fix during business hours.

3. MITIGATION (stop the bleeding):
   → Rollback the last deployment (kubectl rollout undo).
   → Increase capacity (scale up instances).
   → Toggle feature flag off.
   → Redirect traffic (DNS failover to backup region).
   → Restart the service (if the fix is unclear, buy time).

   GOAL: mitigate in minutes. Root cause can wait. Users can't.

4. RESOLUTION (fix the root cause):
   After mitigation: proper investigation and permanent fix.
   May take hours or days. That's OK — users are no longer affected.

5. POSTMORTEM (learn and prevent):
   Within 48 hours of resolution.
   BLAMELESS: focus on SYSTEMS, not people.
   "The deploy system allowed untested code to reach production."
   NOT: "John deployed broken code."

POSTMORTEM TEMPLATE:
  Title: [Date] — [Service] — [Brief description]
  Impact: X users affected for Y minutes. $Z revenue lost.
  Timeline: minute-by-minute chronology.
  Root cause: specific technical explanation.
  Contributing factors: what made it worse?
  Lessons learned: what surprised us?
  Action items:
  - [P0] Add health check to deployment pipeline (Owner: Alice, Due: Apr 1)
  - [P1] Improve monitoring to detect this class of failure (Owner: Bob, Due: Apr 15)
  - [P2] Document runbook for similar incidents (Owner: Carol, Due: Apr 30)
```

---

# PART 4: Toil Reduction & Automation

---

```
TOIL = repetitive, manual, automatable work that scales with service size.

EXAMPLES OF TOIL:
  - Manually restarting crashed services at 3 AM.
  - Manually running database migrations before each deploy.
  - Manually provisioning new servers.
  - Manually rotating certificates.
  - Manually investigating every alert (even false positives).

GOOGLE'S RULE: SREs should spend < 50% of time on toil.
  > 50% → team is an ops team, not SRE. Unacceptable.
  Remainder: building automation, improving reliability, engineering work.

AUTOMATION HIERARCHY:
  1. ELIMINATE: do we even need this task? (best solution!)
  2. AUTOMATE FULLY: machines do it with no human involvement.
  3. AUTOMATE PARTIALLY: machine does work, human approves.
  4. DOCUMENT: clear runbook so anyone can do it consistently.
  5. AD-HOC: worst case — figure it out each time.

EXAMPLES:
  Certificate rotation: manual every 90 days → cert-manager auto-renews.
  Capacity scaling: manual "add more servers" → HPA auto-scales on CPU.
  Incident response: human reads logs → automated runbook triggers on alert.
  Database migration: manual SSH + run scripts → CI/CD pipeline runs automatically.
```

---

# PART 5: Chaos Engineering

---

```
CHAOS ENGINEERING: inject failures in PRODUCTION to test resilience.

"Everything fails, all the time." — Werner Vogels (Amazon CTO).
Better to discover failures in a controlled experiment than at 3 AM.

PRINCIPLES:
  1. Define "steady state" (normal metrics: latency, error rate, throughput).
  2. Hypothesize: "system will remain in steady state when X fails."
  3. Introduce failure: kill servers, break networks, fill disks.
  4. Observe: did the system recover? Was the hypothesis true?
  5. Fix: if the system failed → you found a bug BEFORE customers did!

TOOLS:
  Chaos Monkey (Netflix):       Randomly kills EC2 instances in production.
  Litmus (LitmusChaos):         Chaos engineering for Kubernetes.
  Gremlin:                      Enterprise chaos platform (commercial).
  Chaos Mesh:                   Open-source for K8s (CNCF).
  Toxiproxy (Shopify):          Simulate network conditions (latency, timeout).

EXPERIMENTS TO RUN:
  ┌───────────────────────────┬─────────────────────────────────────┐
  │ Experiment                 │ What You Learn                      │
  ├───────────────────────────┼─────────────────────────────────────┤
  │ Kill one app instance     │ Does LB redirect? How fast?         │
  │ Kill the database primary │ Does failover work? Data lost?      │
  │ Add 500ms network latency │ Do timeouts trigger? Cascading?     │
  │ Fill disk to 100%         │ Does alerting catch it? App crash?  │
  │ DNS resolution failure    │ Does caching help? How long?        │
  │ TLS certificate expired   │ Does monitoring detect? Autorenew?  │
  │ Dependency service down   │ Circuit breaker triggers? Fallback? │
  └───────────────────────────┴─────────────────────────────────────┘
```

---

# PART 6: Capacity Planning — Mathematical Approach

---

```
CAPACITY PLANNING = predicting WHEN you'll run out of resources.

THE MATH:

  Current usage: 60% CPU across 10 servers.
  Growth rate: 15% month-over-month.
  Capacity ceiling: 80% (above this → performance degrades).

  Months until ceiling: log(80/60) / log(1.15) = 2.06 months.
  → In ~2 months you need more capacity!

HEADROOM CALCULATION:
  Production: always maintain 30-50% headroom.
  WHY?
  1. Traffic spikes (Black Friday → 3x normal traffic).
  2. Instance failure (1 of 3 dies → remaining 2 handle 150% load each).
  3. Deployment overhead (rolling update briefly doubles pod count).

  FORMULA: required_instances = peak_load / (capacity_per_instance × target_utilization)
  Example: 10,000 req/s peak, 500 req/s per instance, 70% target →
           10,000 / (500 × 0.7) = 28.6 → 29 instances minimum.

LOAD TESTING (measure before you calculate):
  Tools:
  k6 (Grafana):       JavaScript-based. Excellent for API testing.
  Locust (Python):    Script load tests in Python.
  wrk:                Simple HTTP benchmarking. Ultra-fast.
  JMeter:             Enterprise. GUI-based. Heavy but comprehensive.
  Gatling:            Scala-based. Beautiful reports.

  WHAT TO MEASURE:
  1. Throughput: max requests/second before degradation.
  2. Latency: p50, p95, p99 at various load levels.
  3. Breaking point: load at which errors start appearing.
  4. Recovery: how fast does the system recover after overload?
```

```bash
# ── LOAD TESTING EXAMPLES ──

# k6 (recommended for API testing)
# test.js:
# import http from 'k6/http';
# import { check } from 'k6';
# export let options = {
#   stages: [
#     { duration: '2m', target: 100 },    // ramp to 100 users
#     { duration: '5m', target: 100 },    // hold at 100
#     { duration: '2m', target: 500 },    // spike to 500
#     { duration: '5m', target: 500 },    // hold at 500
#     { duration: '2m', target: 0 },      // ramp down
#   ],
# };
# export default function() {
#   let res = http.get('https://api.myapp.com/users');
#   check(res, { 'status is 200': (r) => r.status === 200 });
# }
k6 run test.js

# wrk (simple HTTP benchmark)
wrk -t12 -c400 -d30s https://api.myapp.com/users
# -t12: 12 threads, -c400: 400 connections, -d30s: 30 seconds
# Output: Requests/sec: 15,234  Latency avg: 26.31ms  p99: 198.42ms

# Locust (Python)
# locustfile.py:
# from locust import HttpUser, task
# class APIUser(HttpUser):
#     @task
#     def get_users(self):
#         self.client.get("/api/users")
locust --headless -u 1000 -r 100 -t 300s --host https://api.myapp.com
# -u 1000: simulate 1000 users, -r 100: spawn 100/sec, -t: run for 300s
```

---

# PART 7: On-Call Practices — Sustainable Operations

---

```
ON-CALL = being responsible for production systems outside business hours.

ON-CALL BEST PRACTICES:

1. ROTATION:
   Minimum 2 people per rotation (primary + secondary).
   1-week rotations (not longer — burnout risk).
   Handoff meeting: outgoing SRE briefs incoming on current state.

2. COMPENSATION:
   On-call pay: stipend for being available (even without pages).
   Incident pay: extra compensation for actual pages.
   Time off: comp time after high-incident weeks.
   Google policy: max 2 incidents per 12-hour shift. More = process failure.

3. ESCALATION:
   Primary on-call: responds within 5 minutes.
   If unresponsive after 10 min → secondary on-call paged.
   If SEV-1 → escalate to engineering manager + VP immediately.

   PagerDuty escalation policy:
   0 min: page primary (push notification + SMS + phone call)
   10 min: page secondary
   20 min: page engineering manager
   30 min: page VP of Engineering

4. ON-CALL HEALTH METRICS:
   Track monthly:
   - Pages per on-call shift (target: < 2 per shift)
   - Time to acknowledge (target: < 5 min)
   - Time to mitigate (target: < 30 min for SEV-1)
   - False positive rate (target: < 10%)
   - After-hours vs business-hours ratio

   If pages-per-shift > 5 → team is overloaded → fix alerts or add redundancy.
   If false positive rate > 30% → alert fatigue → tune or delete noisy alerts.

5. RUNBOOK-DRIVEN RESPONSE:
   Every alert MUST link to a runbook.
   1. Alert fires → on-call reads runbook.
   2. Runbook has: what it means, how to diagnose, how to fix.
   3. If runbook exists and is followed → 80% of incidents resolved in < 15 min.
   4. If NO runbook → human must think from scratch at 3 AM → slow and error-prone.
```

---

# PART 8: Real-World Postmortem — Complete Example

---

```
────────────────────────────────────────────────────────────────────
POSTMORTEM: 2024-03-15 — API Service — Complete Outage (SEV-1)
────────────────────────────────────────────────────────────────────

STATUS: RESOLVED
DURATION: 47 minutes (14:23 UTC → 15:10 UTC)
IMPACT: 100% of API requests failed. 45,000 users affected.
        Estimated revenue loss: $12,400.
DETECTION: PagerDuty alert (error rate > 5%).
           Time to detect: 2 minutes.

════════════════════════════════════════════════════════════
TIMELINE (UTC):
════════════════════════════════════════════════════════════

14:15 — Engineer A merges PR #1847 (database query optimization).
14:18 — CI pipeline passes. ArgoCD deploys new image to production.
14:20 — New pods start. Rolling update begins (3 pods).
14:23 — First errors appear. Database connection pool exhausted.
         Error rate spikes from 0.1% to 98%.
14:25 — PagerDuty pages primary on-call (Engineer B).
14:27 — Engineer B acknowledges. Checks Grafana dashboard.
         Sees: all pods in CrashLoopBackOff. DB connections maxed.
14:30 — Engineer B runs: kubectl rollout undo deployment/api -n prod
         But: rollback fails — previous image also affected (same DB schema).
14:35 — Engineer B escalates to secondary (Engineer A, author of the PR).
         Engineer A joins incident channel.
14:38 — Root cause identified: new query added a sequential scan on a
         400M-row table. Query takes 45 seconds. Connection pool (max 20)
         fills up in 15 seconds. All subsequent requests timeout.
14:42 — Engineer A creates hotfix: adds database index.
         CREATE INDEX CONCURRENTLY idx_users_region ON users(region);
14:48 — Index creation completes (CONCURRENTLY = no table lock).
14:50 — Engineer B redeploys original (rolled-back) version.
         New version with index will deploy later after testing.
14:55 — Pods healthy. Error rate drops to 0.3%.
15:00 — Error rate back to baseline 0.1%. Cache warming complete.
15:10 — Incident resolved. All-clear posted.

════════════════════════════════════════════════════════════
ROOT CAUSE:
════════════════════════════════════════════════════════════

PR #1847 changed a query from:
  SELECT * FROM users WHERE id = $1 (index lookup, 2ms)
to:
  SELECT * FROM users WHERE region = $1 (sequential scan, 45,000ms)

The "region" column had NO INDEX. PostgreSQL performed a sequential scan
on 400M rows. Each query consumed a connection for 45 seconds.
With a pool of 20 connections and ~50 req/s, the pool exhausted in <1s.

════════════════════════════════════════════════════════════
CONTRIBUTING FACTORS:
════════════════════════════════════════════════════════════

1. No query performance testing in CI pipeline.
2. Code review did not catch the missing index.
3. Load testing environment has only 1,000 rows (no perf difference).
4. Connection pool timeout was set to 60s (too high — should be 5s).

════════════════════════════════════════════════════════════
ACTION ITEMS:
════════════════════════════════════════════════════════════

[P0] Add EXPLAIN ANALYZE check in CI for any modified queries.
     Owner: Engineer A. Due: 2024-03-22.

[P0] Reduce connection pool timeout from 60s to 5s.
     Owner: Engineer B. Due: 2024-03-18.

[P1] Add production-sized dataset to staging environment.
     Owner: Platform Team. Due: 2024-04-01.

[P1] Add slow query alerting (queries > 1s trigger warning).
     Owner: SRE Team. Due: 2024-03-29.

[P2] Create runbook for "DB connection pool exhausted" alert.
     Owner: Engineer B. Due: 2024-04-05.
────────────────────────────────────────────────────────────
```

---

# PART 9: Runbook Engineering

---

```
A RUNBOOK = step-by-step instructions for responding to an alert.

TEMPLATE:

  ┌─────────────────────────────────────────────────┐
  │ RUNBOOK: High Error Rate (> 5%)                  │
  ├─────────────────────────────────────────────────┤
  │ ALERT:  HighErrorRate                            │
  │ SEVERITY: Critical                               │
  │ LAST UPDATED: 2024-03-20                         │
  ├─────────────────────────────────────────────────┤
  │                                                  │
  │ 1. ASSESS IMPACT                                │
  │    □ Check Grafana: API Error Rate dashboard     │
  │    □ How many users affected? (check active      │
  │      sessions metric)                            │
  │    □ Which endpoints? (filter by path label)     │
  │                                                  │
  │ 2. DIAGNOSE                                     │
  │    □ Was there a recent deployment?              │
  │      kubectl rollout history deploy/api -n prod  │
  │    □ Check application logs:                     │
  │      kubectl logs -l app=api -n prod --tail=100  │
  │    □ Check database connectivity:                │
  │      kubectl exec -it api-pod -- pg_isready      │
  │    □ Check external dependencies:                │
  │      curl -v https://payment-provider.com/health │
  │                                                  │
  │ 3. COMMON FIXES                                 │
  │    □ Recent deploy caused it? → rollback:        │
  │      kubectl rollout undo deploy/api -n prod     │
  │    □ OOM kills? → increase memory limit          │
  │    □ DB connection exhausted? → restart pods:    │
  │      kubectl rollout restart deploy/api -n prod  │
  │    □ External dependency down? → enable circuit  │
  │      breaker fallback (feature flag)             │
  │                                                  │
  │ 4. ESCALATION                                   │
  │    □ If not resolved in 15 min → escalate:       │
  │      page secondary on-call                      │
  │    □ If SEV-1 → notify engineering manager       │
  │                                                  │
  │ 5. POST-RESOLUTION                              │
  │    □ Verify error rate returned to baseline      │
  │    □ Post all-clear in #incidents Slack channel  │
  │    □ Create postmortem doc                       │
  └─────────────────────────────────────────────────┘

AUTOMATION LEVELS:
  Level 1: Human reads runbook → follows steps manually.
  Level 2: Runbook steps are scripted → human triggers script.
  Level 3: Alert triggers script automatically → human reviews.
  Level 4: Fully automated → human only notified of outcome.

  GOAL: move every runbook from Level 1 → Level 4 over time.
```

---

# PART 10: Reliability Patterns — Code-Level Resilience

---

```python
# ── CIRCUIT BREAKER PATTERN ──
# Prevents cascading failures. If a dependency is failing,
# STOP calling it (fail fast) instead of waiting for timeouts.

import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"       # normal: requests pass through
    OPEN = "open"           # broken: requests fail immediately
    HALF_OPEN = "half_open" # testing: allow ONE request to check recovery

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = None

    def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN  # try one request
            else:
                raise CircuitBreakerOpenError("Circuit is OPEN — failing fast!")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Usage:
breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30)
try:
    result = breaker.call(payment_service.charge, amount=99.99)
except CircuitBreakerOpenError:
    # Dependency is down — use fallback
    result = queue_for_retry(amount=99.99)
```

```python
# ── RETRY WITH EXPONENTIAL BACKOFF + JITTER ──
# Without jitter: 1000 clients all retry at exactly 2s, 4s, 8s → thundering herd!
# With jitter: each client retries at 2s±random, 4s±random → load is spread.

import random
import time

def retry_with_backoff(func, max_retries=5, base_delay=1.0, max_delay=60.0):
    for attempt in range(max_retries):
        try:
            return func()
        except (ConnectionError, TimeoutError) as e:
            if attempt == max_retries - 1:
                raise  # exhausted all retries

            # Exponential backoff with full jitter
            delay = min(base_delay * (2 ** attempt), max_delay)
            jitter = random.uniform(0, delay)

            print(f"Attempt {attempt + 1} failed: {e}. Retrying in {jitter:.1f}s...")
            time.sleep(jitter)

# ── BULKHEAD PATTERN ──
# Isolate resources so one failing component can't consume ALL resources.
# Like watertight compartments in a ship — one leak doesn't sink the whole ship.

from concurrent.futures import ThreadPoolExecutor

# Separate thread pools for each dependency
payment_pool = ThreadPoolExecutor(max_workers=10, thread_name_prefix="payment")
user_pool = ThreadPoolExecutor(max_workers=20, thread_name_prefix="user")
email_pool = ThreadPoolExecutor(max_workers=5, thread_name_prefix="email")

# If payment service is slow → only payment_pool fills up.
# user_pool and email_pool continue working normally!
future = payment_pool.submit(payment_service.charge, amount=99.99)

# ── GRACEFUL DEGRADATION ──
# If a non-critical feature fails → serve a degraded version, not an error.

def get_product_page(product_id):
    product = db.get_product(product_id)     # CRITICAL — must work

    try:
        reviews = review_service.get(product_id)  # NON-CRITICAL
    except Exception:
        reviews = []  # degrade: show page without reviews

    try:
        recommendations = ml_service.recommend(product_id)  # NON-CRITICAL
    except Exception:
        recommendations = get_popular_products()  # fallback to popular items

    return render(product, reviews, recommendations)
```

---

# PART 11: SRE Team Structure & Culture

---

```
GOOGLE'S SRE MODEL:
  SRE team: software engineers who maintain production systems.
  50% engineering: build automation, tools, observability.
  50% ops: on-call, incident response, capacity planning.

  If ops > 50% → SRE team pushes back to product team:
  "Your service is too unreliable. Fix it before we'll support it."
  This creates SHARED RESPONSIBILITY between SRE and product teams.

TEAM MODELS:

1. EMBEDDED SRE:
   SREs sit WITH the product team. Deep product knowledge.
   Best for: critical services, complex systems.
   Risk: SRE becomes "just another team member" → loses SRE practices.

2. CENTRALIZED SRE:
   Separate SRE team serves multiple product teams.
   Sets standards, provides tools, responds to incidents.
   Best for: consistency across the organization.
   Risk: SRE team becomes bottleneck, lacks product context.

3. HYBRID (most common):
   Central SRE platform team builds tools and sets standards.
   Embedded SREs in critical product teams apply those standards.
   Central team: Prometheus, K8s platform, CI/CD, alerting framework.
   Embedded SREs: service-specific SLOs, runbooks, capacity planning.

THE SRE ENGAGEMENT MODEL:
  New service launches → SRE reviews:
  1. Does it have SLOs defined?
  2. Does it have monitoring and alerting?
  3. Does it have runbooks for common failures?
  4. Does it have load testing results?
  5. Has it passed a production readiness review (PRR)?

  If YES to all → SRE supports it.
  If NO → product team supports it themselves until they meet the bar.

CULTURE:
  Blameless postmortems: "The system failed" not "The person failed."
  Error budgets over arbitrary deadlines: math, not politics.
  Automation over heroism: the 3 AM hero is a PROCESS FAILURE.
  Measured toil: if you can't measure it, you can't reduce it.
  Risk acceptance: perfection is expensive. "Good enough" is defined by SLOs.
```

---

## 🔬 Section Challenges

---

🔬 **Section Challenge — SLOs vs SLIs vs SLAs**

**Challenge 1 (Reasoning):** Your SLA with a customer promises 99.9% monthly uptime. Your measured SLI reports "99.2% of requests returned non-5xx this month." Your SLO target is internally set at 99.5%. WHY might all three numbers differ? What happens to your business when your SLO (internal target) is stricter than your SLA (customer contract)?

<details><summary>Answer</summary>

Three numbers, three different perspectives:

- **SLI** is what you **measure**. In this case, your real error rate is 0.8%. Monitoring missed something, or there's an underlying issue.

- **SLO** is your **internal promise to yourself**. Set at 99.5% (0.5% error budget = ~21.6 min/month downtime). This is tighter than the SLA because you want early warning — when you breach your SLO, you still have time to fix things before breaching the SLA.

- **SLA** is your **legal contract with the customer**. Set at 99.9% (looser than SLO) to give yourself a safety buffer. If your SLO is 99.5% but SLA is 99.9%, you're in trouble — you're already below the legal threshold before you even breach your internal target!

**When SLO > SLA (SLO is stricter):** You risk a legal breach every time your SLO is breached — because your SLO already crossed below your SLA. The SLO should ALWAYS be stricter (higher) than the SLA. The typical pattern:

- SLA: 99.9% (43.2 min downtime/month) — what you promise customers
- SLO: 99.95% (21.6 min downtime/month) — your internal target
- SLI: what you actually measure

If your SLI shows 99.2% (48 min downtime): you've already breached the SLA and owe customer credits. The SLO should have caught this earlier and triggered a reliability sprint before it hit the SLA.

**Key insight:** SLOs are your **early warning system**. If they're tighter than SLAs, you catch regressions before customers notice and before legal consequences kick in.

</details>

---

🔬 **Section Challenge — Error Budgets**

**Challenge 1 (Reasoning):** Your service has an SLO of 99.9% availability — an error budget of 43.2 minutes of downtime per month. In the first week of the month, a cascading infrastructure failure burns through your entire error budget (all 43.2 minutes consumed). The product team wants to ship a major new feature by end of sprint. WHY does the SRE handbook say "stop deploying new features" and what does the math say about continued development?

<details><summary>Answer</summary>

**The math first:** If the error budget (0.1% of the month) is gone in 7 days, the burn rate is ~6x faster than sustainable. You have 23 days left and zero budget. Every new deployment is a coin flip that adds more downtime on top of already-exhausted budget.

**Why "stop deploying":**

1. **Every deploy is a risk.** Even a perfect deploy requires a brief rolling restart (some downtime). With zero error budget, any additional downtime directly breaches your SLO. You can't afford the risk of deploying when you're already in the red.

2. **Feature velocity is a trade-off against reliability.** The SRE error budget creates a self-regulating system: you can't have both maximum features AND maximum reliability. Budget is the negotiation point.

3. **You're in a reliability sprint now.** The burned budget signals that something is fundamentally wrong — bad infrastructure, missing redundancy, undetected degradations. Fixing those systematically takes priority over new features.

4. **The business already got its "feature budget" for this month.** The product team consumed the reliability budget with infrastructure failures AND wants to add new feature risk on top. That's double-dipping.

**The SRE principle:** Error budgets turn a political argument ("should we ship or not?") into a mathematical one ("we have X% budget remaining — here are the trade-offs"). When budget is zero, the math is unambiguous: fix reliability first.

**What happens next:** The SRE team formally notifies stakeholders that the service is in an error-budget-exhausted state. Feature freeze is declared. A reliability post-mortem and remediation plan is initiated. Shipping resumes only after the SLO is back within target.

</details>

---

🔬 **Section Challenge — Incident Response**

**Challenge 1 (Reasoning):** It's 3 AM. A P1 incident is active — all checkout transactions are failing across your platform. You're the primary on-call SRE. A senior engineer (Subject Matter Expert on the payments system) is paged. The Incident Commander role is also being filled. WHY does the SRE model explicitly separate the Incident Commander (IC) from the Subject Matter Expert (SME)? Why not let the payments expert just fix it while managing the incident?

<details><summary>Answer</summary>

**The IC-SME separation is a cognitive load management pattern. Here is WHY it matters:**

**The problem at 3 AM with a live P1:**
- The SME is stressed, sleep-deprived, and deeply familiar with the payment system — which means they have strong opinions about the fix.
- They also need to: monitor Slack, coordinate with other teams, make real-time decisions about customer impact, write status page updates, remember to mark the incident resolved, loop in stakeholders...
- Doing both at once creates cognitive overload. The SME either rushes the fix (making mistakes) or handles logistics slowly (prolonging the outage).

**The IC role exists to:**
- Shield the SME from all non-technical distractions (Slack, status pages, stakeholder updates, coordination).
- Make decisions about severity, escalation, and customer communication — freeing the SME to focus 100% on the technical problem.
- Take notes in real-time for the post-mortem (the SME is busy fixing things).
- Be the stable "air traffic controller" who sees the whole picture, while the SME is the "pilot" focused on their instrument panel.

**The separation principle:** The person closest to the problem (SME) should spend maximum time solving the problem, not managing the logistics of the incident. The IC is the multiplier — they make the SME more effective by removing overhead.

**When you don't separate roles (common mistake):** The on-call engineer tries to be both IC and SME, handles a Slack storm of questions while trying to debug, misses a critical signal in the logs because they were typing a customer update, and the incident lasts 2 hours instead of 20 minutes.

**The 3 AM rule:** If you're the on-call SME, your ONLY job is to fix the incident. The IC owns everything else.

</details>

---

🔬 **Section Challenge — Blameless Post-Mortems**

**Challenge 1 (Reasoning):** An engineer pushed a production config change at 2 AM without a code review (the CI system had a bypass flag enabled). It took down checkout for all customers for 47 minutes. The post-mortem is scheduled. At the meeting, a manager asks: "Who made this decision and why weren't they more careful?" WHY is this question harmful to the blameless post-mortem process? WHY does SRE culture say "focus on the system, not the person" — and what actually happens when you blame the individual?

<details><summary>Answer</summary>

**The manager's question is the wrong question. Here's WHY:**

**Question 1: "Who made this decision?"**
This frames a complex system failure as an individual failure. It assumes: (a) the engineer had full information and chose poorly, and (b) if we punish this person, it won't happen again. Both assumptions are wrong.

**What actually happened (the SYSTEM perspective):**
- A bypass flag existed in CI that allowed merges without reviews.
- That flag was accessible to engineers working at 2 AM under pressure.
- No automated guard prevented prod config changes from bypassing review.
- There was no policy (or enforcement) against 2 AM production changes.
- The monitoring system didn't alert on the config change being deployed.

**When you blame the person, you get:**
- The engineer is punished.
- Other engineers become afraid to admit mistakes or push fast.
- The bypass flag stays in CI.
- The next engineer at 2 AM makes the same mistake because the SYSTEM wasn't fixed.
- You fix one person. You don't fix one system.

**Why "focus on the system":**
- Systems can be changed. People are complex and don't change reliably.
- A good system makes it HARD to do the wrong thing. With proper CI guardrails, this engineer couldn't have pushed to production without review — regardless of their skill, intent, or fatigue level at 2 AM.
- Fix the system: require review for prod config changes, disable bypass flags by default, add a pre-deploy smoke test, require two-person review for prod changes.

**The blameless post-mortem question to ask instead:**
"What was true about our system that made this failure possible?" — not "who failed?"

**What blameless does NOT mean:** It does NOT mean "no one is responsible." It means responsibility is shared across the system, not concentrated on one individual. The engineer is invited to the post-mortem (unlike a blame culture where they dread it) and helps design the fix — because they understand the failure better than anyone.

</details>

---

## 🔗 Cross-References

| Topic                             | Related Content                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| **Monitoring (metrics for SLIs)** | [Ch 21: Observability](21_Monitoring_Observability.md) — Prometheus, PromQL                   |
| **K8s self-healing**              | [Ch 18: K8s](18_Kubernetes_Complete.md) — probes, HPA, PDB                                    |
| **Deployment strategies**         | [Ch 19: CI/CD](19_CICD_Pipelines.md) — canary, rollback                                       |
| **Load balancing (failover)**     | [Ch 11: LB](11_Load_Balancing_Proxies.md) — health checks                                     |
| **Distributed patterns**          | [Distributed Patterns](../10_Enterprise_Systems/09_Distributed_Patterns.md) — circuit breaker |
| **SQL slow queries**              | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — EXPLAIN ANALYZE                         |
| **Capacity math**                 | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — bandwidth-delay product                           |
| **Linux performance**             | [Ch 16: Linux](16_Linux_Administration.md) — USE method, OOM killer                           |


---

## Reality Check

**"SRE is a fancier name for ops"** — SRE is ops approached as a SOFTWARE ENGINEERING problem with explicit reliability economics: the defining artifacts are SLOs (a numeric reliability target — not "as reliable as possible") and ERROR BUDGETS (the allowed unreliability, 100 percent minus the SLO, spent deliberately) — which convert reliability from a vibe into a budget that governs decisions (budget remaining means ship features faster; budget exhausted means freeze and stabilize). The cultural inversion: 100 percent reliability is the WRONG target (unaffordable, and unnecessary since users cannot tell 99.99 from 100 through their own flaky networks) — the error budget makes "how reliable should this be, and what does the last nine cost" an explicit engineering trade rather than a heroic aspiration.

**"Error budgets are a way to permit failures"** — Error budgets are a DECISION FRAMEWORK that aligns the dev-versus-ops incentive conflict ([DevOps-fundamentals]'s original wall): the budget is shared — developers want to ship (spends budget on risk), reliability wants stability (preserves budget) — and the budget's state ARBITRATES (healthy budget green-lights faster shipping and more risk; drained budget triggers an automatic freeze-and-stabilize that nobody has to argue for). It reframes reliability from a blocker ("ops said no") to a currency both sides spend and replenish, making the trade-off objective and depersonalized. "Permit failures" misses that the budget's real power is ending the political fight over speed-versus-stability by making it arithmetic.

**"Toil is just the boring parts of the job"** — Toil has a PRECISE definition — manual, repetitive, automatable, tactical, no-enduring-value work that scales linearly with service growth — and SRE treats it as a MEASURED, CAPPED quantity (the canonical 50-percent ceiling: if more than half your time is toil, you are a human doing a machine's job and the service will not scale with you). The discipline is tracking toil, attacking the highest-frequency sources with automation ([13_DE dev-tools]' automate-your-own-telemetry, at team scale), and protecting engineering time to do so. "The boring parts" trivializes it — toil is the specific, quantifiable, scaling-limiting work whose uncapped growth is how ops teams drown as the systems they run grow.

**"Postmortems find what went wrong"** — Blameless postmortems find what made the failure EASY and hard to catch — a systems question, not a person question — because the alternative (find the culprit) destroys the psychological safety that honest analysis requires (people hide mistakes, the same failure recurs, [DevOps-fundamentals]'s fast-blame-loop). The functioning postmortem produces systemic changes with owners (the missing alert, the too-easy-to-misconfigure interface, the missing guardrail — [13_DE production-code]'s make-the-wrong-thing-hard), treats human error as a symptom of system design ("why did the system allow/invite this"), and closes the loop (the action items tracked, [13_DE Agile]'s retro discipline at incident scale). "What went wrong" too easily becomes "who" — the blameless discipline is a deliberate, defended cultural choice because the blame instinct is strong and corrosive.

**"Reliability means preventing all outages"** — Reliability engineering accepts that failures are INEVITABLE and optimizes for fast, bounded recovery over impossible prevention: the metrics reflect it (MTTR — mean time to recovery — often matters more than MTBF — mean time between failures, because you cannot prevent all failure but you can recover fast), the practices build for it (graceful degradation, circuit breakers, [Ch61]-style chaos engineering that finds failure modes before they find you, runbooks that make recovery fast and repeatable), and the SLO itself budgets for failure (the error budget IS planned unreliability). The prevent-everything mindset produces brittle over-investment in the unlikely and under-investment in recovery — SRE's wisdom is that a system which fails often but recovers in seconds beats one that fails rarely but is down for hours, and designs for the former.
