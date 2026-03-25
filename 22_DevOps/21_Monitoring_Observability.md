> **Navigation**: [← Terraform](20_Terraform_IaC.md) | [Index](00_INDEX.md) | [Next → SRE](22_SRE_Practices.md)

# 📊 Chapter 21: Monitoring & Observability — Seeing Inside Your System

> _"If you can't measure it, you can't improve it — and you definitely can't debug it at 3 AM when the on-call pager wakes you up. Observability is the difference between 'I think it crashed' and 'I know exactly which function, on which server, is failing for 2.3% of users from EU region.'"_

---

# PART 1: The Three Pillars of Observability

---

```
1. METRICS (numbers over time):
   "CPU is at 78%." "Error rate is 2.3%." "p99 latency is 450ms."
   Cheap to store, fast to query, easy to alert on.
   WHEN: "Is something wrong?" → metrics tell you.
   Tools: Prometheus, Grafana, Datadog, CloudWatch.

2. LOGS (discrete events):
   "2024-03-24 10:15:32 ERROR [req-abc123] Database connection timeout at pool.get()"
   Rich context. Structured (JSON) for searchability.
   WHEN: "What exactly went wrong?" → logs tell you.
   Tools: Elasticsearch (ELK), Loki (Grafana stack), Splunk, CloudWatch Logs.

3. TRACES (request journey across services):
   "Request abc123: API Gateway (5ms) → Auth Service (12ms) → User Service (35ms) → Database (200ms)"
   Shows WHERE time is spent. Critical for microservices.
   WHEN: "Where is it slow?" → traces tell you.
   Tools: Jaeger, Zipkin, Tempo (Grafana), AWS X-Ray.

THE MELT MODEL (+ Events):
  Metrics + Events + Logs + Traces = complete observability.
  Events: deploys, config changes, incidents → correlate with metrics/logs.
```

---

# PART 2: Prometheus — Metrics Collection

---

```
PROMETHEUS ARCHITECTURE:
  ┌─────────────────┐
  │ Your App exports │──── /metrics endpoint (HTTP)
  │ metrics           │
  └─────────────────┘
         ↑
  ┌──────┴──────────┐
  │ Prometheus       │ PULLS metrics from apps every 15-30 seconds
  │ (scrapes targets)│
  │ Time-series DB   │ Stores: metric name + labels + timestamp + value
  └──────┬──────────┘
         │
  ┌──────▼──────────┐
  │ Grafana          │ Queries Prometheus → visualizes dashboards
  └──────┬──────────┘
         │
  ┌──────▼──────────┐
  │ Alertmanager     │ Evaluates rules → sends alerts → PagerDuty/Slack
  └─────────────────┘

METRIC TYPES:
  COUNTER: only goes UP. Total requests, total errors, total bytes sent.
    http_requests_total{method="GET", path="/api/users", status="200"} 15234
  
  GAUGE: goes up AND down. Current temperature, queue size, active connections.
    active_connections{server="web-1"} 42
  
  HISTOGRAM: distribution of values. Request latency, response size.
    Records: counts in buckets (≤50ms, ≤100ms, ≤250ms, ≤500ms, ≤1s, ≤5s).
    http_request_duration_seconds_bucket{le="0.25"} 9800
    http_request_duration_seconds_bucket{le="0.5"}  9950
    → 98% of requests complete in ≤250ms. 99.5% in ≤500ms.
  
  SUMMARY: similar to histogram but calculates quantiles client-side.
    Less commonly used. Histograms are preferred (can aggregate server-side).
```

```python
# ── INSTRUMENTING YOUR APP (Python) ──
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Define metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'path', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'Request latency in seconds',
    ['method', 'path'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
)

ACTIVE_REQUESTS = Gauge(
    'active_requests',
    'Number of requests currently being processed'
)

DB_POOL_SIZE = Gauge('db_connection_pool_size', 'Database connection pool size')
DB_POOL_USED = Gauge('db_connection_pool_used', 'Database connections in use')

# Use in your request handler
def handle_request(method, path):
    ACTIVE_REQUESTS.inc()
    start_time = time.time()
    
    try:
        # ... your business logic ...
        status = "200"
    except Exception:
        status = "500"
        raise
    finally:
        duration = time.time() - start_time
        REQUEST_COUNT.labels(method=method, path=path, status=status).inc()
        REQUEST_LATENCY.labels(method=method, path=path).observe(duration)
        ACTIVE_REQUESTS.dec()

# Start metrics endpoint on port 9090
start_http_server(9090)
# Prometheus scrapes http://your-app:9090/metrics
```

```
PROMQL QUERIES (Prometheus Query Language):

# Request rate (per second, over last 5 minutes)
rate(http_requests_total[5m])

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
* 100

# p99 latency (99th percentile — worst 1% of requests)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Top 5 slowest endpoints
topk(5, histogram_quantile(0.95, sum by(path)(rate(http_request_duration_seconds_bucket[5m]))))

# Rate of increase of errors
deriv(http_requests_total{status="500"}[1h])
```

---

# PART 3: Structured Logging — Beyond Console.log

---

```python
# ── STRUCTURED LOGGING (JSON — machine readable) ──
import structlog
import logging

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()

# GOOD: structured with context
logger.info("request_completed",
    method="GET",
    path="/api/users",
    status=200,
    duration_ms=45.2,
    user_id="usr_123",
    request_id="req_abc456"
)
# Output: {"event":"request_completed","method":"GET","path":"/api/users",
#          "status":200,"duration_ms":45.2,"user_id":"usr_123",
#          "request_id":"req_abc456","level":"info","timestamp":"2024-03-24T10:15:32Z"}

# BAD: unstructured (can't search, can't aggregate, can't alert)
print(f"GET /api/users returned 200 in 45.2ms for user usr_123")

# WHY STRUCTURED?
# 1. Search: query logs WHERE status=500 AND duration_ms > 1000
# 2. Aggregate: count errors by path, average duration by user
# 3. Alert: trigger alert when error count > threshold
# 4. Correlate: find ALL logs for request_id="req_abc456" across services
```

---

# PART 4: OpenTelemetry — The Universal Standard

---

```
OPENTELEMETRY (OTel) = vendor-neutral standard for telemetry.
  One instrumentation → export to ANY backend (Prometheus, Jaeger, Datadog, etc.).
  
  BEFORE OTel: instrument for Prometheus AND Jaeger AND Datadog → 3x work!
  WITH OTel: instrument ONCE → OTel Collector → routes to any backend.
  
  OTel Collector:
  Your App → OTel SDK → OTel Collector → Prometheus (metrics)
                                        → Loki (logs)
                                        → Tempo (traces)
  
  The Collector:
  - Receives telemetry from apps.
  - Processes: batch, filter, transform, sample.
  - Exports: to multiple backends simultaneously.
  
  Supported languages: Python, Java, Go, Node.js, .NET, Rust, C++.
```

---

# PART 5: Alerting — The Last Line of Defense

---

```yaml
# ── PROMETHEUS ALERTING RULES ──
groups:
- name: application_alerts
  rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m]))
      / sum(rate(http_requests_total[5m]))
      > 0.05
    for: 5m                     # must be true for 5 minutes (avoid flapping)
    labels:
      severity: critical
    annotations:
      summary: "High error rate: {{ $value | humanizePercentage }}"
      runbook: "https://wiki.mycompany.com/runbooks/high-error-rate"

  - alert: HighLatency
    expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "p99 latency above 2s: {{ $value }}s"

  - alert: PodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Pod {{ $labels.pod }} is crash-looping"

  - alert: DiskSpaceRunningOut
    expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
    for: 15m
    labels:
      severity: warning
    annotations:
      summary: "Disk space < 10% on {{ $labels.instance }}"
```

```
ALERTING BEST PRACTICES:

1. ALERT ON SYMPTOMS, NOT CAUSES:
   BAD:  "CPU > 80%" → CPU might be high and everything is fine.
   GOOD: "Error rate > 5%" → users are experiencing errors. Actionable!

2. EVERY ALERT MUST HAVE A RUNBOOK:
   "What do I do when this fires at 3 AM?"
   Link to wiki page with: what it means, how to diagnose, how to fix.

3. AVOID ALERT FATIGUE:
   Too many alerts → team ignores ALL of them → miss the critical one.
   If an alert fires but doesn't need action → delete or tune it.
   Review alerts monthly: "Did every alert this month need human action?"

4. USE SEVERITY LEVELS:
   Page (wake someone up): only for user-impacting, revenue-impacting issues.
   Ticket (next business day): degraded performance, non-critical warnings.
   Log (informational): no action needed, just track.
```

---

# PART 6: Grafana Dashboards — Visualization as Code

---

```
GRAFANA = visualization layer for ALL your telemetry data.
  Connects to: Prometheus, Loki, Tempo, Elasticsearch, MySQL, PostgreSQL.
  
  THE RED METHOD (for microservices):
  Rate:    requests per second.
  Errors:  error rate (percentage of requests that fail).
  Duration: latency (p50, p95, p99).
  
  THE USE METHOD (for infrastructure):
  Utilization: how full? (CPU %, disk %, memory %).
  Saturation: how queued? (run queue length, swap usage).
  Errors: any errors? (disk errors, NIC errors).

DASHBOARD BEST PRACTICES:
  1. TOP ROW: Golden signals (error rate, latency, throughput).
  2. MIDDLE: resource utilization (CPU, memory, disk, network).
  3. BOTTOM: detailed breakdowns (per-endpoint, per-instance).
  4. Include deployment markers (vertical annotations on graphs).
  5. Store dashboard JSON in Git → Grafana loads on startup (dashboards-as-code).
```

---

# PART 7: The ELK Stack — Log Aggregation at Scale

---

```
ELK = Elasticsearch + Logstash + Kibana.

  Elasticsearch: search engine + document store. Indexes logs for fast queries.
  Logstash: ETL pipeline. Receives → parses → transforms → sends to ES.
  Kibana: web UI for searching and visualizing logs.
  
  MODERN ALTERNATIVE: Grafana Loki (lighter, cheaper, uses labels not full-text).
  
  ARCHITECTURE:
  App → Filebeat/Fluent Bit → Logstash → Elasticsearch → Kibana
  
WHY NOT JUST grep ON SERVERS?
  1. 50 servers → grep on each one manually? No.
  2. Logs rotate/delete → old logs lost. ES retains them.
  3. Full-text search across ALL services in milliseconds.
  4. Aggregation: "how many 500 errors per endpoint per hour?"

KIBANA QUERY EXAMPLES (KQL):
  status:500                                # all 500 errors
  status:500 AND path:"/api/payments"       # payment errors only
  duration_ms > 1000                         # slow requests
  request_id:"req_abc123"                   # trace a single request
```

---

# PART 8: Distributed Tracing — Following Requests

---

```
IN MICROSERVICES: one request touches 5-15 services.
"The page is slow" → WHERE? Which service? Which query?

TRACE: the complete journey of ONE request through all services.
  Trace ID: req-abc123 (unique per request, propagated via headers).
  
  Spans (each service creates one):
  ┌──────────────────┬──────────────────────────────────────────────┐
  │ API Gateway      │ ████ 5ms                                     │
  │ Auth Service     │     ████████ 12ms                            │
  │ User Service     │             ██████████████ 35ms              │
  │   → DB Query     │                ████████████████████ 200ms    │
  │ Response         │                                    ██ 2ms   │
  └──────────────────┴──────────────────────────────────────────────┘
  TOTAL: 254ms. Bottleneck: DB query at 200ms (79%!).

TRACE PROPAGATION:
  Service A adds header: traceparent: 00-<trace-id>-<span-id>-01
  Service A calls B → passes the header.
  B reads trace-id → creates its own span with same trace-id.
  Backend (Jaeger/Tempo) reassembles the full trace.
  
CORRELATION (the holy grail):
  Metrics: "error rate spiked at 14:23."
  Traces: "request req-abc123 at 14:23 took 45 seconds."
  Logs: "req-abc123: database connection timeout at pool.get()."
  
  trace_id links all three → ONE click: metric spike → trace → exact log line.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **K8s monitoring** | [Ch 18: K8s](18_Kubernetes_Complete.md) — pod metrics, HPA uses metrics |
| **SRE (SLOs use metrics)** | [Ch 22: SRE](22_SRE_Practices.md) — SLIs, SLOs, error budgets |
| **Docker stats** | [Ch 17: Docker](17_Docker_Complete.md) — container monitoring |
| **Load balancer metrics** | [Ch 11: LB](11_Load_Balancing_Proxies.md) — upstream response time |
| **SQL slow query logs** | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — query monitoring |
| **Linux system monitoring** | [Ch 16: Linux](16_Linux_Administration.md) — USE method |
| **CI/CD (deploy markers)** | [Ch 19: CI/CD](19_CICD_Pipelines.md) — correlate deploys with metrics |
| **Network debugging** | [Ch 15: Debugging](15_Network_Debugging.md) — packet-level analysis |

---

> **Navigation**: [← Terraform](20_Terraform_IaC.md) | [Index](00_INDEX.md) | [Next → SRE](22_SRE_Practices.md)

