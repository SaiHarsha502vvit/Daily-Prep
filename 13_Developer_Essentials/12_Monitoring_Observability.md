**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Production Practices](11_Production_Code_Practices.md)
🧠 **Mental Model**: See [Production Debugging Thinking](../14_Mental_Models/18_Production_Debugging_Thinking.md)

---

# 📊 Monitoring & Observability — Prometheus, Grafana, ELK

The three pillars: Metrics, Logs, Traces — how to know what your system is doing in production

---

## The Three Pillars

PILLAR 1: METRICS (What is happening?)
→ Numerical time-series data: CPU 85%, latency 120ms, errors 5/min
→ Tools: Prometheus, Datadog, CloudWatch
→ Dashboards: Grafana

PILLAR 2: LOGS (Why did it happen?)
→ Detailed event records with context
→ Tools: ELK Stack (Elasticsearch + Logstash + Kibana), Loki, Splunk
→ Structured JSON logs with correlation IDs

PILLAR 3: TRACES (Where did it happen?)
→ Follow a request across multiple services
→ Tools: Jaeger, Zipkin, AWS X-Ray, OpenTelemetry
→ Trace ID propagated through headers

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

---

