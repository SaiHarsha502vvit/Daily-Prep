**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Production Practices](11_Production_Code_Practices.md)
🧠 **Mental Model**: See [Production Debugging Thinking](../14_Mental_Models/18_Production_Debugging_Thinking.md)

---

# 📊 Monitoring & Observability — Prometheus, Grafana, ELK

The three pillars: Metrics, Logs, Traces — how to know what your system is doing in production

---

## 📌 WHY / WHAT / WHERE / WHEN / WHO / HOW

**WHY**: You cannot fix what you cannot see. Production systems fail in unexpected ways, and the difference between a 5-minute outage and a 5-hour outage is usually the quality of observability. Google's SRE research (Beyer, Jones, Petoff, Murphy, "Site Reliability Engineering", 2016) shows that organizations with mature observability practices resolve incidents 3× faster. The Three Pillars (metrics, logs, traces) work together — metrics tell you *what* is broken, logs tell you *why*, traces tell you *where in the request path*.

**WHAT**: The Three Pillars of observability (metrics, logs, traces); Golden Signals (latency, traffic, errors, saturation); RED method (Rate, Errors, Duration); USE method (Utilization, Saturation, Errors); SLI/SLO/Error Budget concepts and calculations; structured logging with correlation IDs; distributed tracing with OpenTelemetry; alerting design (symptom-based vs cause-based); on-call practices; runbook templates; dashboard design.

**WHERE**: Every production system post-2015. Google's SRE book (2016) formalized the methodology. Etsy pioneered StatsD (2008/2011). SoundCloud created Prometheus (2012, inspired by Borgmon). Grafana (2014) became the standard dashboard tool. Honeycomb (2016) popularized wide-event structured logging. OpenTelemetry (2019, merger of OpenTracing + OpenCensus) is the modern instrumentation standard, supported by all major cloud vendors.

**WHEN**: When designing any new service (instrument from day 1 — retrofitting observability later is painful). When migrating from monolith to microservices (distributed tracing becomes essential). When on-call rotations are added (alerting design + runbooks). When MTTR (mean time to recovery) is high (symptom-based alerts and structured logs cut MTTR dramatically).

**WHO**: Google SRE team (Beyer, Jones, Petoff, Murphy — "Site Reliability Engineering", 2016). Baron Schwartz ("Practical Guide to Enterprise Monitoring", 2007; "Percona Toolkit"). Brendan Gregg (USENIX/LISA talks; "Systems Performance", 2013). Peter Bourgon ("Metrics, Logs, and Traces" talk at Craft Conference, 2017). Cindy Sridharan ("Distributed Systems Observability", O'Reilly, 2017).

**HOW**: Three Pillars overview first (what each pillar measures, what question it answers), then Golden Signals / RED / USE method comparison, then SLO/SLI/Error Budget calculation with concrete examples, then OpenTelemetry instrumentation (metrics + traces + logs SDK), then alerting design (symptom vs cause; page vs ticket; alert routing), then runbook templates, then dashboard design (what makes a useful Grafana dashboard). Each major section ends with a local challenge.

## The Three Pillars

PILLAR 1: METRICS (What is happening?)

- Numerical time-series data: CPU 85%, latency 120ms, errors 5/min
- Tools: Prometheus, Datadog, CloudWatch
- Dashboards: Grafana

PILLAR 2: LOGS (Why did it happen?)

- Detailed event records with context
- Tools: ELK Stack (Elasticsearch + Logstash + Kibana), Loki, Splunk
- Structured JSON logs with correlation IDs

PILLAR 3: TRACES (Where did it happen?)

- Follow a request across multiple services
- Tools: Jaeger, Zipkin, AWS X-Ray, OpenTelemetry
- Trace ID propagated through headers

---

## Prometheus + Grafana Stack

```
┌────────────┐  scrape /metrics  ┌────────────┐  query  ┌──────────────┐
│ Your App   │◄──────────────────│ Prometheus  │◄───────│ Grafana      │
│ (exposes   │  every 15s         │ (stores     │        │ (visual     │
│  /metrics) │                    │  time-series)│       │  dashboards)│
└────────────┘                   └──────┬─────┘        └───────────────┘
                                        │
                                 ┌──────▼──────┐
                                 │ Alertmanager │
                                 │ (Slack/Page) │
                                 └─────────────┘

4 GOLDEN SIGNALS (Google SRE):
┌──────────────┬──────────────────────────────────────────────────────────┐
│ Latency      │ Time to serve a request (p50, p95, p99)                  │
│ Traffic      │ Requests per second (throughput)                         │
│ Errors       │ Rate of failed requests (5xx, 4xx)                       │
│ Saturation   │ How "full" is your system (CPU, memory, disk, queue)     │
└──────────────┴──────────────────────────────────────────────────────────┘

Spring Boot + Micrometer (auto-exposes Prometheus metrics):
  // pom.xml: spring-boot-starter-actuator + micrometer-registry-prometheus
  // application.yml:
  //   management.endpoints.web.exposure.include: health,prometheus
  //   management.metrics.tags.application: my-service

  // Custom metrics:
  @Component
  public class OrderMetrics {
      private final Counter ordersCreated;
      private final Timer orderProcessingTime;

      public OrderMetrics(MeterRegistry registry) {
          ordersCreated = Counter.builder("orders.created.total")
              .description("Total orders created")
              .tag("service", "order-service")
              .register(registry);
          orderProcessingTime = Timer.builder("orders.processing.duration")
              .description("Order processing time")
              .register(registry);
      }

      public void recordOrder() { ordersCreated.increment(); }
      public Timer.Sample startTimer() { return Timer.start(); }
      public void stopTimer(Timer.Sample sample) { sample.stop(orderProcessingTime); }
  }
```

---

🔬 **Section Challenge — Prometheus + Grafana Stack**

**Challenge 1 (Reasoning):** Your CPU alert fires at `cpu_usage > 80%`. It fires 30 times per day, all false positives. The on-call team stops responding to it. What is the root cause of this alert design failure and how do you fix it?

<details><summary>Answer</summary>

Root cause: **alert on symptoms, not causes**. CPU spikes are normal during GC, deployment, or traffic bursts — they're not user-impacting on their own. Alerts based on resource metrics (CPU, memory %) cause alert fatigue and train teams to ignore them. Fix using the **4 Golden Signals**: alert on (1) **Error rate** `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05` — 5% error rate for 5 minutes = users are failing; (2) **Latency** `histogram_quantile(0.99, http_request_duration_seconds_bucket) > 2` — p99 > 2 seconds = users are suffering. These directly measure user impact. The CPU alert gets demoted to a Grafana panel (visible but silent) — it's a diagnostic tool, not an actionable alert. Every alert should have a runbook: "if this fires, do X."

</details>

**Challenge 2 (Design):** Explain the difference between a Prometheus **Counter** and a **Gauge**. Which one should you use for `active_http_connections` and why can you never use `decrease()` on a Counter?

<details><summary>Answer</summary>

**Counter**: monotonically increasing — it only goes up (or resets to zero on restart). Use for totals: requests served, errors thrown, bytes sent. Never use for values that decrease. **Gauge**: can go up or down — represents a current state. Use for: active connections, queue depth, memory usage, temperature. `active_http_connections` is a **Gauge** — it increases when connections open, decreases when they close. You can't use a Counter because when a connection closes, the metric must decrease. The reason Counters never decrease: Prometheus uses `rate()` function which calculates per-second increase. If a counter decreases, `rate()` produces negative values which are meaningless. Counters reset on restart (to 0) — Prometheus detects this and adjusts `rate()` calculations automatically using the `increase()` function.

</details>

## ELK Stack (Centralized Logging)

```
┌────────────┐     ┌───────────┐     ┌───────────────┐     ┌──────────┐
│ App Logs   │────→│ Filebeat/  │────→│ Logstash       │────→│ Elastic│
│ (JSON to   │     │ Fluentd    │     │ (parse,        │     │ search │
│  stdout)   │     │ (ship logs)│     │  transform,    │     │ (index,│
└────────────┘     └───────────┘     │  enrich)       │     │  search) │
                                      └───────────────┘     └────┬─────┘
                                                                 │
                                                           ┌─────▼─────┐
                                                           │  Kibana    │
                                                           │ (search,   │
                                                           │  visualize)│
                                                           └───────────┘

Modern alternative: Grafana Loki (lighter, labels-based, pairs with Grafana)
```

---

🔬 **Section Challenge — ELK Stack (Centralized Logging)**

**Challenge 1 (Design):** Your ELK stack receives 10GB of logs per day. Elasticsearch disk is filling up. Name two strategies to manage this without losing important logs.

<details><summary>Answer</summary>

1. **Index lifecycle management (ILM)**: automatically move indices through hot → warm → cold → delete phases based on age. Hot: latest 3 days on SSD (fast writes/reads). Warm: 4-30 days on HDD (reads only). Cold: 31-90 days on object storage (S3). Delete: after 90 days. This reduces SSD usage by 10x. 2. **Log sampling/filtering**: not all logs need centralized storage. INFO-level framework logs (Hibernate SQL, Spring lifecycle events) have zero value for incident response. Configure Logstash to: drop `DEBUG` logs entirely, sample `INFO` at 10%, forward only `WARN`/`ERROR` unsampled. Alert-worthy events always make it through; routine noise is discarded. Use structured logs (`level`, `service`, `correlationId` as fields) to make Kibana queries fast: `level:ERROR AND service:order-service` returns results in <100ms vs full-text search.

</details>

## Distributed Tracing

```
Request from browser → API Gateway → Order Service → Payment Service

Trace ID: abc-123 (same across ALL services for this request)

┌─── API Gateway (Span 1) ─────────────────────────────────────────┐
│  ┌─── Order Service (Span 2) ──────────────────────────┐         │
│  │  ┌─── DB Query (Span 3) ──────┐                     │         │
│  │  └─────────── 15ms ───────────┘                     │         │
│  │  ┌─── Payment Service (Span 4) ────────────────┐    │         │
│  │  │  ┌─── Stripe API (Span 5) ──────────┐      │    │          │
│  │  │  └──────────── 200ms ───────────────┘      │    │          │
│  │  └──────────────── 250ms ──────────────────────┘    │         │
│  └───────────────────── 280ms ─────────────────────────┘         │
└────────────────────────── 300ms ─────────────────────────────────┘

→ Immediately see: Payment Service (Stripe API call) is the bottleneck!

OpenTelemetry (standard): auto-instruments Spring Boot, propagates trace IDs
```

---

🔬 **Section Challenge — Distributed Tracing**

**Challenge 1 (Trace):** From the waterfall diagram above, the total request takes 300ms. The Stripe API call takes 200ms. What does this tell you, and what are two ways to fix it without changing the Stripe integration?

<details><summary>Answer</summary>

The diagram shows that 200/300ms (67%) of the request latency is a sequential call to the Stripe API. This is a **synchronous blocking call** on the critical path. Two fixes: (1) **Async/queue-based payment**: instead of waiting for Stripe in real-time, push the payment request to a Kafka topic, return `202 Accepted` to the user immediately, process the payment asynchronously. When complete, send a webhook/email. Trade-off: user doesn't get instant confirmation. Acceptable for many e-commerce flows. (2) **Caching with idempotency**: if the payment is a retry (network timeout), return the cached result immediately from Redis (keyed by `Idempotency-Key` header) without calling Stripe again. Eliminates retry latency. The trace also reveals that the Stripe span (Span 5) has no child spans — it's a black box. Add `timeout: 3s` on the HTTP client — a hung Stripe call without timeout blocks a thread forever.

</details>

**Challenge 2 (Reasoning):** A developer says "we don't need distributed tracing — we have correlation IDs in our logs." What can distributed tracing show you that correlation IDs in logs cannot?

<details><summary>Answer</summary>

Correlation IDs show you **what** happened (which log lines belong to the same request). Distributed tracing shows you **when and how long** each step took — with a visual waterfall. Specific gaps: (1) **Precise timing per service**: logs tell you Order Service logged at 10:00:00.100 and Payment Service logged at 10:00:00.350 — but is that 250ms network + processing time, or 200ms Stripe + 50ms overhead? Traces show exact span duration. (2) **Parallel vs sequential**: if Order Service calls Inventory and Payment in parallel, logs can't show the overlap. A trace waterfall shows spans side by side. (3) **Service-level aggregation**: Jaeger shows "Payment Service p99 latency this hour = 850ms" across all traces. Correlating individual log lines for this takes hours. Tracing is the difference between a flight data recorder and reading the pilot's journal.

</details>

## Alerting Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  GOOD ALERTS:                                                                   │
│  ✅ Error rate > 5% for 5 minutes → Page on-call                                 │
│  ✅ P99 latency > 2s for 10 minutes → Warn in Slack                              │
│  ✅ Disk usage > 85% → Ticket                                                    │
│  ✅ Zero orders in last 30 min (business hours) → Investigate                    │
│                                                                                 │
│  BAD ALERTS (alert fatigue):                                                    │
│  ❌ CPU > 80% (spikes are normal, care about sustained)                          │
│  ❌ Any single 500 error (noise)                                                 │
│  ❌ Alerts without runbook (what do I DO about this?)                            │
│                                                                                 │
│  EVERY ALERT SHOULD HAVE:                                                       │
│  1. What is broken (symptom)                                                    │
│  2. What is the impact (users can't checkout)                                   │
│  3. Runbook link (how to investigate and fix)                                   │
│  4. Dashboard link (see current state)                                          │
│  5. Severity (P1: everything down, P2: degraded, P3: potential issue)           │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Historical Evolution

**Observability practices have evolved from post-hoc log analysis to real-time, distributed systems introspection:**

- **2011** — Etsy open-sourced StatsD (originally built internally in 2008). StatsD established the counter/gauge/timing metric model and the aggregation pattern (flush every 10 seconds to Graphite) that became the foundation for Prometheus, Datadog, and CloudWatch metrics.
- **2012** — Prometheus originally developed at SoundCloud by Matthias Rampke, Julius Volz, and Bjorn Rabenstein to address StatsD limitations (no labels/high cardinality, push-only model). The pull-based model, PromQL, and multi-dimensional labels made Prometheus the standard for service-level monitoring.
- **2014** — Grafana 2.0 released (Torkel Oeldegard, originally forked from Kibana in 2014), adding graph visualization for time-series data. By 2016, Grafana became the dominant dashboard tool for Prometheus, InfluxDB, Elasticsearch, and CloudWatch.
- **2015** — OpenTracing standard created (LightStep, donated to CNCF in 2016), providing vendor-neutral instrumentation APIs for distributed tracing.
- **2016** — Google published the SRE Book (*Site Reliability Engineering*, edited by Betsy Beyer et al., O'Reilly). The Four Golden Signals (latency, traffic, errors, saturation) and error budget concept established the standard for modern alerting and SLO-based reliability engineering.
- **2016** — Charity Majors founded Honeycomb, pioneering high-cardinality observability. Majors coined the operational definition: Observability means you can understand the internal state of a system from the outside using outputs.
- **2017** — Peter Bourgons Three Pillars of Observability talk (GOTO Conferences) formalized the canonical mental model: logs (what happened), metrics (how much/how fast), traces (where did it happen).
- **2019** — OpenTelemetry (OTel) formed from the merger of OpenTracing (2015) and OpenCensus (2018, Google/Microsoft). OTel became a CNCF graduated project, providing unified tracing, metrics, and logging instrumentation.

**Key references:**
- Prometheus Authors (SoundCloud) — Prometheus (2012, open-source 2016) — Pull-based metrics with PromQL; Googles Borgmon was the internal inspiration.
- Grafana Labs — Grafana (2014) — Universal observability dashboard integrating every major metrics, logging, and tracing backend.
- CNCF — OpenTelemetry (2019, formed from OpenTracing 2015 + OpenCensus 2018) — Unified standard for observability instrumentation, replacing proprietary agents.
- Charity Majors — Honeycomb (2016) — Pioneered high-cardinality, event-based observability; operational definition of observability coined here.
- Google SRE Team — *Site Reliability Engineering* (2016) — First comprehensive publication of Borgmon, the Four Golden Signals, SLOs, and error budgets.

**Why this matters for monitoring:** The Three Pillars model and the Golden Signals are not theoretical frameworks — they emerged from real production failures at scale. Prometheus solved SoundClouds monitoring gaps. Honeycombs high-cardinality approach emerged from debugging a 1000-service mesh. Understanding the origins explains WHY modern observability stacks look the way they do.

### Production Reality

**Monitoring and observability fail in production in these named ways:**

- **Log loss during incident** — stdout-only logging (no persistent ship-to-remote) loses all logs when the container receives SIGKILL (OOM-kill). AWS S3 us-east-1 outage (February 2017): root cause analysis was delayed by 4 hours because logs from terminated EC2 instances were inaccessible. Without centralized log shipping (Fluentd/Filebeat/Loki), postmortems rely on operator memory and guesswork.
- **Alert fatigue** — an un-tuned alert for "CPU > 80%" fires 200 times per day, 98% false positives (GC pauses, traffic spikes). Atlassian postmortem (2018): 200+ alerts/day with 95% false positives led operators to mute pages entirely. Real production incident: 4-hour MTTR because the on-call engineer ignored a page that turned out to be the only genuine signal.
- **Missing correlation ID** — debugging a multi-service trace without `X-Correlation-ID` propagation requires manual log correlation by timestamp and IP. A 10-service request that fails means manually searching logs across 10 systems, cross-referencing by request timestamp. MDC (Mapped Diagnostic Context) pattern from log4j 2 (2012+) addresses this: inject `correlationId` into every log line automatically.
- **Cascading failure via alerting gap** — alerting on lagging indicators (5xx rate) instead of leading indicators (queue depth, connection pool usage) means the alert fires when customers are already affected. AWS Kinesis Thanksgiving 2020 outage: the queue depth leading indicator was not monitored; the 5xx lag indicator fired 30 minutes after the cascade began. Fix: alert on saturation metrics, not just error rates.
- **High-cardinality metric explosion** — tagging Prometheus metrics with `user_id` creates a unique time series per user. At 1 million users = 1 million unique series, crashing the Prometheus TSDB with OOM. Shopify December 2019: per-user tagging of checkout metrics caused Prometheus to run out of memory and lose all monitoring for 2 hours during peak traffic.
- **P99 vs average hiding tail latency** — average response time of 50ms hides a P99 of 5,000ms (100x slower). The average smooths over the 1% of requests that users actually feel. Amazon research: every 100ms of latency costs 1% revenue. Fix: always alert on `histogram_quantile(0.99, ...)` not averages.
- **SLO violation cascade** — when error budget is exhausted (e.g., 99.9% SLO = 8.76 hours downtime/month), engineering teams freeze deployments to recover. Without SLO culture, teams ship anyway. Each deployment introduces new failure modes into an already-degraded system, compounding customer pain. Google SRE: error budget policy is the primary mechanism for balancing reliability and deployment velocity.

**Debug workflow:** For log loss: verify log shipping pipeline with `kubectl logs <pod>` against centralized store; for alert fatigue: calculate signal-to-noise ratio (true alerts / total pages); for high-cardinality: `Prometheus cardinality API` shows top label combinations by series count.
**Mitigation discipline:** Instrument all log lines with `correlationId` via MDC/slog; ship logs to remote store before containers terminate; alert on leading indicators (queue depth, error budget burn rate); use `histogram_quantile(0.99)` not averages; publish SLOs and enforce error budget freeze policy.

## SLO, SLI, and Error Budget

The Three Pillars tell you **what is happening** in production. SLI/SLO/Error Budget tell you **whether the user experience is acceptable** — and provide a framework for trading off reliability against velocity.

### Definitions

- **SLI (Service Level Indicator)**: a measurement of service quality. Examples: request latency (p99 < 200ms), success rate (>99.9%), availability (uptime).
- **SLO (Service Level Objective)**: a target value for an SLI over a time window. Example: "99.9% of requests return successfully in any 30-day window."
- **Error Budget**: the inverse of the SLO. For SLO = 99.9%, the error budget = 0.1% of requests = ~43 minutes of downtime per 30-day month.

### Why Error Budgets Matter

Without an error budget, "reliability" is unbounded — engineers push for 100% uptime, which means no new deploys, no experiments, no progress. With an error budget:

- **When you're under budget**: deploy freely, take risks, run experiments
- **When you're at budget**: stop non-critical deploys, focus on stability
- **When you've burned the budget**: postmortem required before resuming deploys

This is Google's SRE model, codified in "Site Reliability Engineering" (2016).

### SLO Calculation Examples

| SLO | Per-request | Per-day (1M req/day) | Per-month (30M req) |
|---|---|---|---|
| **99%** (2 nines) | 1 in 100 fails OK | 10,000 failures/day | 300,000 failures/month |
| **99.9%** (3 nines) | 1 in 1,000 fails OK | 1,000 failures/day | 30,000 failures/month |
| **99.95%** (3.5 nines) | 1 in 2,000 fails OK | 500 failures/day | 15,000 failures/month |
| **99.99%** (4 nines) | 1 in 10,000 fails OK | 100 failures/day | 3,000 failures/month |

The cost difference between 99.9% and 99.99% is roughly 10× in infrastructure. Most services should target 99.9% — chasing 99.99% requires multi-region redundancy, automated failover, and ops investment that doesn't pay off unless revenue is tied to uptime (e.g., ad serving, payment processing).

### SLO Document Template

```yaml
# SLO: Checkout API
service: checkout-api
owner: payments-team

slis:
  - name: availability
    description: HTTP 200 responses as fraction of total responses
    query: |
      sum(rate(http_requests_total{status=~"2.."}[30d]))
      /
      sum(rate(http_requests_total[30d]))
    target: 0.999  # 99.9%

  - name: latency
    description: 99th percentile request duration under 300ms
    query: |
      histogram_quantile(0.99, 
        sum(rate(http_request_duration_seconds_bucket[30d])) by (le))
    target: 0.99  # 99% of requests <300ms

  - name: error_rate
    description: 5xx responses as fraction of total responses
    query: |
      sum(rate(http_requests_total{status=~"5.."}[30d]))
      /
      sum(rate(http_requests_total[30d]))
    target: 0.001  # <0.1% errors
```

### Burn Rate Alerting

Traditional alerting: "alert when error rate > 1%". This fires too late (when SLO is already breached) and too noisy (a brief spike during deploy).

**Burn rate alerting**: alert based on **how fast you're burning the error budget**.

```
1-hour burn at 14.4× rate = entire monthly budget consumed in 2 days
6-hour burn at 6× rate = entire monthly budget consumed in 5 days
3-day burn at 1× rate = entire monthly budget consumed in 30 days (exactly on schedule)
```

```yaml
# Prometheus alerting rule
- alert: ErrorBudgetBurningFast
  expr: |
    (
      sum(rate(http_requests_total{status=~"5.."}[1h]))
      /
      sum(rate(http_requests_total[1h]))
    ) > (1 - 0.999) * 14.4
  for: 2m
  labels:
    severity: page
  annotations:
    summary: "Burning error budget at 14.4× rate"
    description: "At current rate, monthly error budget will be exhausted in {{ humanizeDuration $budget_exhaustion_time }}"
```

This alert fires when the burn rate is unsustainable — it would burn the entire monthly budget in 2 days if sustained. Fast feedback, low noise.

🔬 **Section Challenge — SLO Burn Rate Alert**

Your service has SLO 99.9% (error budget = 0.1%). Current error rate over the last hour is 0.5%. Should the burn-rate alert fire? At what burn rate is the alert set, and how does it differ from a traditional "alert if error >1%" alert?

<details>
<summary>Answer</summary>

**Calculation**:
- Current error rate: 0.5%
- SLO target: 0.1% (error budget)
- Burn rate: 0.5% / 0.1% = **5×**
- At 5× burn, monthly budget (0.1% × 30 days = 0.1% × 720 hours) is consumed in 720 / 5 = **144 hours = 6 days**

**Alert firing**:
- The Prometheus rule fires when burn rate > 14.4× (1-hour window) — this would consume the budget in 2 days.
- 5× burn is alarming but not yet critical. A 6-hour burn at 6× would fire the more sensitive alert.

**Difference from traditional alert**:
- Traditional "alert if error >1%": does NOT fire (0.5% < 1%). Misses the issue.
- Burn-rate alert at 14.4×: does NOT fire yet (5× < 14.4×). But the operator should investigate.
- The two alerts form a multi-window strategy:
  - Fast burn (1h × 14.4×): page on-call immediately
  - Slow burn (6h × 6×): ticket for next-day investigation
  - Steady burn (3d × 1×): ticket for weekly review

**Why burn-rate is better**:
- A 5-minute spike of 5% errors = 5 minutes × (5%/0.1%) = 250 minutes of budget consumed in 5 minutes. Without burn-rate, this is invisible (5-minute error rate is rarely alerted).
- The 1-hour burn rate smooths over short spikes; the 14.4× threshold catches sustained problems.

**Production note**: a well-tuned SLO has 3-5 burn-rate alerts at different windows and multipliers. The Prometheus book ("Prometheus: Up & Running", 2018) and Google's SRE workbook detail this multi-window strategy.
</details>

## Sampling Strategies for Distributed Tracing

Tracing every request is expensive. A single trace for a 10-service call generates 10+ spans with metadata. At 10,000 req/sec, that's 100,000 spans/sec — gigabytes of trace data per hour.

**Sampling** reduces this volume while preserving statistical validity for debugging.

### Head-Based Sampling

Decision made at the start of the trace (at the root span):

```java
public boolean shouldSample(String traceId, long requestDurationMs) {
    // Always sample errors
    if (isError()) return true;
    
    // Always sample slow requests (>1s)
    if (requestDurationMs > 1000) return true;
    
    // Sample 1% of normal traffic
    return Math.abs(traceId.hashCode()) % 100 == 0;
}
```

**Trade-off**: simple, no cross-service coordination, but you miss interesting traces (e.g., a rare bug that only fires on certain inputs may never be sampled).

### Tail-Based Sampling

Decision made at the END of the trace (after all spans collected):

```java
public boolean shouldKeep(CompletedTrace trace) {
    // Always keep errors
    if (trace.hasErrors()) return true;
    
    // Always keep slow requests
    if (trace.getDuration() > 1000) return true;
    
    // Always keep traces that touched a "suspicious" service
    if (trace.touchedService("payments")) return true;
    
    // Sample 1% of normal traces
    return trace.getTraceId().hashCode() % 100 == 0;
}
```

**Trade-off**: requires buffering full trace before deciding. But you can keep 100% of errors and only 1% of healthy traffic. This is what production systems like Honeycomb and Lightstep use.

### OpenTelemetry Tail Sampling

```yaml
# OpenTelemetry Collector config
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 50000
    expected_new_traces_per_sec: 100
    policies:
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: slow-traces
        type: latency
        latency:
          threshold_ms: 1000
      - name: probabilistic
        type: probabilistic
        probabilistic:
          sampling_percentage: 1
```

### Sampling Rate Selection

| Traffic volume | Sampling rate | Trace volume | Storage/day |
|---|---|---|---|
| 1,000 req/sec | 100% | 1,000 traces/sec | ~100GB/day |
| 1,000 req/sec | 10% | 100 traces/sec | ~10GB/day |
| 1,000 req/sec | 1% | 10 traces/sec | ~1GB/day |
| 10,000 req/sec | 1% | 100 traces/sec | ~10GB/day |

**Rule of thumb**: keep 100% of errors and slow traces, sample 1-10% of normal traffic. This gives you debugging power for ~10% of the cost.

### W3C Trace Context Propagation

The trace ID flows across service boundaries via HTTP headers:

```http
GET /api/orders HTTP/1.1
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
tracestate: congo=t61rcWkgMzE
```

The `traceparent` header carries:
- Version (00)
- Trace ID (32 hex chars = 128 bits)
- Parent span ID (16 hex chars = 64 bits)
- Trace flags (01 = sampled)

OpenTelemetry injects this automatically when you use the SDK's HTTP instrumentation.

🔬 **Section Challenge — Sampling Strategy Selection**

You run a payment processing service at 5,000 req/sec. Last quarter, an intermittent bug caused 0.01% of requests to double-charge customers. The bug was traced via logs (not tracing) and took 4 days to identify. You're adding distributed tracing. What sampling strategy catches similar bugs reliably?

<details>
<summary>Answer</summary>

**The bug signature**: 0.01% = 1 in 10,000 requests. The bug is rare but high-impact (financial).

**Head-based sampling analysis**:
- 1% sampling = 1 in 100 traces kept = 50 traces/sec total
- Of those, 0.01% × 1% = 0.0001% of traces capture the bug = 5 traces per 10 million
- **Verdict**: head-based at 1% misses the bug in most time windows. Even at 10%, only 1 in 1000 bug occurrences is captured.

**Tail-based sampling analysis**:
- 100% of errors captured → if the bug surfaces as a 5xx or logs an error, ALL occurrences are kept
- If the bug surfaces as a successful double-charge (visible only via downstream reconciliation), you need a custom policy: "keep all traces that touch the `chargeCustomer` operation in payment-service"
- **Verdict**: tail-based catches the bug 100% of the time IF the trace shows an error or unusual pattern.

**Recommended strategy**:
1. **Tail-based sampling with custom policies**:
   - Keep 100% of traces with errors (status_code: ERROR)
   - Keep 100% of traces where the duration > 1 second
   - Keep 100% of traces that touch specific operations: `chargeCustomer`, `refundPayment`, `applyDiscount`
   - Probabilistic 1% for the rest

2. **Configure trace logging**: every charge event logs the trace_id, so reconciliation can find the trace later:
   ```java
   log.info("charge_completed trace_id={} amount={}", 
       span.getContext().getTraceId(), 
       amount);
   ```

3. **Cost**: at 5,000 req/sec with 0.01% errors and 1% slow = 0.5 + 50 = ~50 traces/sec. Plus 1% of healthy traffic = ~50 traces/sec. Total ~100 traces/sec. Storage ~10GB/day. Affordable.

**The lesson**: tail-based sampling is the right choice when bugs are rare-but-impactful. The slight increase in cost (buffering full trace before deciding) pays for itself in debugging speed.
</details>

## Runbook Templates

A runbook is a step-by-step playbook for handling specific incidents. Without one, on-call engineers waste time under pressure figuring out "what do I do?" instead of executing. With one, MTTR (mean time to recovery) drops dramatically.

### Anatomy of a Runbook

````markdown
## Runbook: [Service] [Symptom]

**Severity**: P0 / P1 / P2
**On-call rotation**: payments-oncall
**Escalation**: payments-team-lead (Slack: #payments-escalation)

### Symptoms

What the alert / user report looks like:
- "Checkout API 5xx rate > 1%"
- "Latency p99 > 5 seconds"
- "PagerDuty alert: payments_error_budget_burn"

### Quick Diagnosis (5 minutes)

1. **Check the dashboard**: [link to Grafana dashboard]
   - Look for: error rate spike, latency spike, traffic spike
2. **Check recent deploys**: `kubectl rollout history deployment/payments`
   - Has there been a deploy in the last hour? If yes, roll back.
3. **Check upstream/downstream**: are dependencies (DB, cache, queue) healthy?
   - `kubectl get pods -n payments` — all pods running?
   - `pg_stat_activity` — DB connections exhausted?

### Mitigation (15 minutes)

**If recent deploy caused the issue**:
```bash
kubectl rollout undo deployment/payments
kubectl rollout status deployment/payments
```

**If DB connections exhausted**:
```bash
# Identify long-running queries
SELECT pid, query, state, query_start 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY query_start;

# Kill the long-running query (use sparingly)
SELECT pg_terminate_backend(pid);
```

**If cache (Redis) is down**:
```bash
# Failover to secondary
redis-cli -h redis-primary CLUSTER FAILOVER

# Or temporarily disable cache (degraded mode)
kubectl set env deployment/payments CACHE_ENABLED=false
```

### Long-Term Fix

- File a ticket for root-cause investigation
- Add a regression test that catches this scenario
- Update the runbook if any step was unclear or missing

### Related

- Dashboard: [link]
- Logs: [link to Datadog/Splunk]
- Metrics: [link]
- Recent postmortems: [link]
````

### Example: Runbook for "Payments 5xx Spike"

````markdown
## Runbook: Payments API 5xx Spike

**Severity**: P1 (customer-facing impact)
**Owner**: payments-team

### Symptoms
- Alert: `payments_5xx_rate > 1% for 5 minutes`
- Customer reports: "My payment failed but I was charged"
- Dashboard spike: https://grafana.example.com/d/payments

### Step 1: Verify the alert is real (2 min)
- Check Grafana for actual 5xx count (not synthetic)
- If alert is from synthetic monitoring only, investigate test infra

### Step 2: Check for recent changes (3 min)
```bash
# Recent deploys
kubectl rollout history deployment/payments-api -n payments

# Recent config changes
kubectl get configmap payments-config -o yaml | grep -i "last_modified"
```
If anything changed in the last 30 min, **rollback**:
```bash
kubectl rollout undo deployment/payments-api -n payments
kubectl rollout status deployment/payments-api -n payments
```

### Step 3: Check dependencies (5 min)
- **Database**: `pg_stat_activity` — connections > 80% of max?
- **Redis**: `redis-cli ping` — responding?
- **Stripe API**: https://status.stripe.com — outage?
- **Internal services**: `kubectl get pods -A | grep -v Running`

### Step 4: Apply targeted mitigation (5 min)
Based on diagnosis:
- DB exhausted → kill long-running queries (see SQL above)
- Redis down → disable cache (degraded mode)
- Stripe down → enable circuit breaker (`STRIPE_CIRCUIT_BREAKER=true`)
- Unknown → scale up + page secondary on-call

### Step 5: Communicate
- Post in #incidents: "P1 incident, payments 5xx spike, investigating"
- Update status page: https://status.example.com (if customer-facing)
- Post updates every 15 min until resolved

### Step 6: Post-incident
- File ticket for root-cause analysis within 24h
- Schedule postmortem within 5 business days
- Update this runbook based on learnings
````

### Runbook Maintenance

- **Test the runbook quarterly**: walk through it on a non-incident Tuesday. Steps that don't work or are unclear get fixed.
- **Update after every incident**: if a step was unclear or missing during a real incident, fix it.
- **Link to dashboards, not screenshots**: dashboards evolve; screenshots become stale.

🔬 **Section Challenge — Runbook Anti-Patterns**

A team writes a runbook with these steps: "1. SSH into the production server. 2. Run `kill -9 $(pgrep java)` to restart the app. 3. Verify it's back up." What are the anti-patterns here, and how would you fix them?

<details>
<summary>Answer</summary>

**Anti-patterns**:
1. **"SSH into the production server"** — direct SSH access to production is a security anti-pattern in 2024 (no audit trail, no MFA enforcement, can't be revoked centrally). Use `kubectl exec` or break-glass procedures with audit logging.
2. **"kill -9"** — SIGKILL doesn't allow graceful shutdown. In-flight requests fail; database connections leak (until TCP timeout); logs may be lost. Use `kubectl rollout restart` (sends SIGTERM, waits for graceful shutdown) or scale to 0 and back up.
3. **No verification step beyond "verify it's back up"** — vague. Specific verification: hit the health endpoint, check error rate returns to baseline, check dependency connections are re-established.
4. **No rollback mention** — if a bad deploy caused the issue, restart doesn't fix the root cause. Always check rollout history first and offer rollback as the primary mitigation.
5. **No communication step** — incident response without status updates makes customers anxious and team coordination chaotic.
6. **No escalation path** — what if the on-call can't resolve? Who to page?

**Fixed runbook**:
````markdown
### Step 1: Check for recent deploys
```bash
kubectl rollout history deployment/payments-api -n payments
```
If anything in the last 30 min, **rollback first**:
```bash
kubectl rollout undo deployment/payments-api -n payments
kubectl rollout status deployment/payments-api -n payments
```

### Step 2: If no deploy, restart gracefully
```bash
kubectl rollout restart deployment/payments-api -n payments
kubectl rollout status deployment/payments-api -n payments
```
This sends SIGTERM (allows graceful shutdown), then starts new pods.

### Step 3: Verify recovery
```bash
# Health endpoint
curl -f https://payments.example.com/actuator/health

# Check error rate in Grafana (link)
# Target: 5xx rate < 0.1% within 5 minutes
```

### Step 4: Communicate
Post in #incidents and update status page.
````

**Why this is better**: every step is reproducible, idempotent, and audit-logged. The bad-deploy case is caught early. Graceful shutdown prevents cascade failures.
</details>

## Alert Routing and PagerDuty

Alerting without routing = noise. Every engineer gets paged for everything = alert fatigue = real alerts ignored.

### Severity Levels

| Severity | When to use | Response | Example |
|---|---|---|---|
| **SEV-1** | Customer-facing outage; revenue loss; data loss | Page on-call immediately; expect response in <5 min | Payments 5xx > 5%, DB primary down |
| **SEV-2** | Degraded service; partial impact; SLO at risk | Page on-call; expect response in <30 min | Single pod crash-looping; cache miss rate spike |
| **SEV-3** | Potential issue; needs investigation but no immediate impact | Ticket; review in next business day | Disk usage > 70%; slow query logged |
| **SEV-4** | Informational; no action needed | Log only; weekly review | New version deployed; scheduled maintenance |

### Routing Rules

```yaml
# PagerDuty / Opsgenie routing rules
- name: payments-p1-immediate
  match:
    service: payments
    severity: SEV-1
  route_to: payments-oncall-primary
  escalation_after: 5min
  escalate_to: payments-oncall-secondary
  
- name: payments-p2-business-hours
  match:
    service: payments
    severity: SEV-2
  route_to: payments-oncall-primary
  escalation_after: 30min
  escalate_to: payments-team-lead
  only_during_business_hours: true
  
- name: payments-p3-ticket
  match:
    service: payments
    severity: SEV-3
  create_ticket: true
  assign_to: payments-team-backlog
```

### Alert Quality: The "Page-Worthy" Test

Before adding an alert, ask:
1. **Is this actionable?** (Can the on-call DO something to fix it?)
2. **Is this urgent?** (Does it require response in <30 min?)
3. **Is this specific?** (Does the alert point to a clear root cause?)

If any answer is "no", the alert is not page-worthy. Demote to a ticket.

### Anti-Patterns

- **Alert on every restart**: every Kubernetes pod restart triggers an alert. Result: 50 alerts/day, all noise. Alert on restart **rate** (>5 restarts in 5 minutes), not individual restarts.
- **Alert on every error**: a 404 is an error too. Alert on **5xx** rate, not total error rate.
- **Alert without runbook**: if the alert doesn't link to a runbook, the on-call spends 20 minutes figuring out what to do. Always link the runbook URL in the alert annotation.
- **Alert on symptom AND cause**: alert on user-facing symptom (5xx rate, latency). Don't alert on CPU > 80% (cause). Operators should be able to fix symptoms directly.

### The Alert Funnel

```
All incidents in production
        ↓
  Symptom-based alert (5xx rate, latency)
        ↓
  On-call pages, runs runbook
        ↓
  Identifies cause (DB connection leak)
        ↓
  Fixes cause, symptoms resolve
        ↓
  Postmortem adds alerts for the CAUSE
  (so we catch it earlier next time)
```

Most monitoring setups have this backwards — alerting on causes (CPU, memory, disk) without alerting on symptoms. The user notices symptoms first. Alert on symptoms; investigate causes.

🔬 **Section Challenge — Alert Design Review**

Review these alerts:
1. CPU usage > 80%
2. 5xx error rate > 1% for 5 minutes
3. Disk usage > 90%
4. p99 latency > 2 seconds for 10 minutes
5. Pod restart count > 0 in last hour
6. Memory usage > 1GB

Which are page-worthy? Which should be tickets? Which should be removed entirely?

<details>
<summary>Answer</summary>

**Page-worthy** (actionable, urgent, specific):
- ✅ **5xx error rate > 1% for 5 minutes**: customer-facing impact, action is "check runbook, rollback or restart"
- ✅ **p99 latency > 2 seconds for 10 minutes**: user-facing degradation, action is "check dashboard, identify slow endpoint"

**Tickets** (actionable but not urgent):
- 🎫 **Disk usage > 90%**: action is "expand disk or clean up logs", can wait until business hours
- 🎫 **Memory usage > 1GB**: action is "profile memory leak or set higher limit", not urgent unless trending up

**Remove or rewrite**:
- ❌ **CPU usage > 80%**: not specific (CPU spikes during deploys, GC pauses, batch jobs). Action unclear. Either remove or rewrite as "CPU usage > 80% AND not during scheduled job window AND error rate > baseline".
- ❌ **Pod restart count > 0 in last hour**: too noisy (every Kubernetes deploy restarts pods). Rewrite as "Pod restart count > 5 in last 10 minutes" or "CrashLoopBackOff state".

**The principle**: every alert should answer "what should the on-call DO?" If the answer is unclear or "investigate" without specifics, the alert is not page-worthy.

**Production tip**: start with FEWER alerts. Add alerts only after a real incident where you wished you had one. The cost of a missed alert is lower than the cost of alert fatigue (real alerts being ignored).
</details>

---
---


---

## Reality Check

**"Monitoring and observability are synonyms"** — Monitoring answers KNOWN questions (is CPU high, is the error rate above threshold — dashboards and alerts for failure modes you predicted); observability is the property of being able to answer UNKNOWN questions from emitted telemetry (why is this one customer's checkout slow on Tuesdays — the query you never predicted, answerable only if the data is rich enough to slice ad hoc). The practical divide is cardinality: metrics aggregate cheaply but discard the dimensions (which user, which request); traces and wide structured events keep them and cost accordingly. Mature stacks buy both deliberately — metrics for the knowns, high-cardinality events for the unknowns — rather than discovering during an incident which one they skipped.

**"More dashboards mean better visibility"** — Unowned dashboards are where signal goes to die (the wall of green nobody reads, the 40-panel page whose one meaningful panel nobody remembers): the functioning structure is INVERTED — a small set of golden-signal views per service (latency percentiles, traffic, errors, saturation), each panel answering a question someone actually asks, each alert wired to a runbook — and everything else generated ad hoc from the underlying data at investigation time (the observability property making bespoke dashboards unnecessary). Dashboard COUNT correlates with tooling enthusiasm; incident MTTR correlates with whether the first three clicks answer where-is-it-broken.

**"Averages summarize performance"** — Averages HIDE the users who are suffering: latency distributions are long-tailed (the 200ms average composed of 50ms medians and 8-second p99s — and the p99 users are often your heaviest, most valuable accounts), tail latency COMPOUNDS across fan-out (a page calling five services at p99 each sees far worse than p99 overall — the reason single-service percentiles understate user pain), and error averages mask concentration (99.9 percent success that is 100 percent failure for the one tenant whose data shape triggers the bug). Percentiles as the default lens (p50/p95/p99, sliced by tenant/region/version) is the single habit that separates measurement from reassurance.

**"Alert on everything important"** — Alerts compete for a fixed budget of HUMAN ATTENTION, and over-spending it is self-defeating: every non-actionable page trains responders toward acknowledgment reflexes (alert fatigue being the root cause behind a whole genre of missed-the-real-one postmortems), so the discipline is symptom-based alerting on user-visible degradation (SLO burn rates — is the error budget draining fast) with causes left to dashboards, every alert carrying a runbook link and an implicit question (what should a human DO right now — no answer, no page), and a standing pruning ritual (the alert that fired 40 times without action this quarter is either automated or deleted). Paging is an interruption API with an error budget of its own.

**"Instrumentation is added when problems appear"** — Post-hoc instrumentation arrives one incident too late by definition ([production-debugging]'s artifact lesson — you debug with what past-you emitted): the economical pattern is instrumentation as PART OF THE FEATURE (the new endpoint ships with its RED metrics, trace propagation, and one business-level event — the checkout ships with a funnel counter, because product questions are observability questions too), standardized through shared middleware so the marginal cost per feature approaches zero (the platform's auto-instrumentation plus your domain events), and versioned like code (the metric rename that broke every dashboard teaches this once). The test for any new feature's readiness: what will its incident look like in the tooling — if the answer is a blank query, the feature is not done.
