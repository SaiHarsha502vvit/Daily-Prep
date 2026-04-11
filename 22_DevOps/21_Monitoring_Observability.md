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


---

## 🏋️ Practice & Interview Questions — DevOps & Networking

### Predict / Trace
**Q1.** What happens when you type `https://google.com` in a browser?
<details><summary>Answer</summary>

1. DNS lookup: resolve `google.com` → IP (recursive resolver → root → TLD → authoritative NS)
2. TCP connection: 3-way handshake (SYN → SYN-ACK → ACK) to port 443
3. TLS handshake: ClientHello → ServerHello → certificate verification → key exchange → session keys
4. HTTP/2 GET request sent
5. Server responds with HTML (GZIP compressed)
6. Browser parses HTML → fetches CSS/JS → CSSOM + DOM → render tree → paint
</details>

**Q2.** `curl -I https://example.com` returns `Connection: keep-alive`. What does this mean?
<details><summary>Answer</summary>

The TCP connection won't be closed after the response — it stays open for reuse. Avoiding TCP+TLS handshake overhead for subsequent requests. HTTP/1.1 default; HTTP/2 always multiplexes on one connection.
</details>

### Coding / Commands
**Q3.** ⭐ Write a Dockerfile for a Java Spring Boot app — multi-stage build.
<details><summary>Solution</summary>

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle/
RUN ./gradlew dependencies --no-daemon
COPY src src/
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime (smaller image)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
</details>

**Q4.** ⭐ Write a Kubernetes deployment with liveness and readiness probes.
<details><summary>Solution</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myapp:1.0
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "500m" }
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          initialDelaySeconds: 10
          periodSeconds: 5
```
</details>

**Q5.** ⭐⭐ Design a zero-downtime deployment strategy.
<details><summary>Answer</summary>

**Blue-Green**: run two identical envs, switch load balancer. Instant rollback. Double the infra cost.
**Rolling**: replace pods one-by-one. K8s default. Slower, but no extra infra.
**Canary**: route 5% traffic to new version, monitor errors/latency, gradually increase. Most risk-controlled.
**Feature flags**: deploy code but disable feature — decouple deployment from release.
</details>

### Interview Questions
**Q6.** TCP vs UDP — when to use each?
<details><summary>Answer</summary>

**TCP**: reliable (acknowledgments, retransmission), ordered, connection-based. Use for: HTTP, databases, SSH, email — anywhere correctness matters more than speed.
**UDP**: unreliable, unordered, connectionless. Use for: video streaming, gaming, DNS, VoIP — where speed matters more than perfect delivery, or app handles reliability itself.
</details>

**Q7.** What is a memory limit vs memory request in Kubernetes?
<details><summary>Answer</summary>

`request`: guaranteed allocation — K8s won't schedule pod on node with less available. `limit`: maximum usage — if exceeded, pod is OOM-killed. Set requests for scheduling accuracy; set limits to prevent noisy neighbor problems. Best practice: requests=expected P50 usage, limits=expected P99 surge.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | HTTP status code 429 | Too Many Requests (rate limited) |
| 2 | HTTP status code 503 | Service Unavailable (server down/overloaded) |
| 3 | DNS record type for IP address | A record (IPv4), AAAA record (IPv6) |
| 4 | Load balancer Layer 4 vs 7 | L4: TCP/UDP level; L7: HTTP/application level (content-aware) |
| 5 | TLS/SSL terminates where | At load balancer (termination), or all the way to pod (passthrough) |
| 6 | `docker exec -it container bash` does | Opens interactive shell in running container |
| 7 | Kubernetes etcd stores | Cluster state (all K8s object definitions) |
| 8 | CI/CD — what triggers a pipeline? | Code push, PR, tag, schedule, or manual trigger |



---

## 🧠 Deep Conceptual Questions — Networking & DevOps Internals

**C1. TCP three-way handshake: WHY three steps? Can it be done in two?**
<details><summary>Deep Answer</summary>

Two-way fails: both sides need to confirm the OTHER side can send AND receive. 
- SYN (client→server): "I want to connect, my sequence starts at X"
- SYN-ACK (server→client): "Got your SYN, my sequence starts at Y, ack=X+1"  
- ACK (client→server): "Got your SYN-ACK, ack=Y+1"

Without the third ACK: client knows server is alive, but server doesn't know the client received the SYN-ACK. If SYN-ACK lost: server has allocated resources (TCB) thinking connection established, client doesn't know. The ACK confirms the server's sequence number was received. This asymmetric confirmation requires 3 messages minimum. Four-way teardown: TCP is full-duplex — each direction closed independently, hence 4 steps.
</details>

**C2. What happens when you run `docker run`? Trace the full execution path.**
<details><summary>Deep Answer</summary>

1. **Docker CLI** parses the command, sends REST API request to Docker daemon (`/run`)
2. **Docker daemon** (dockerd) receives the request
3. If image not local: **pull from registry** (Docker Hub → HTTPS, layer downloads)
4. Daemon calls **containerd** (container runtime interface)
5. containerd calls **runc** (OCI runtime)
6. runc creates **Linux namespaces**: PID, NET, MNT, UTS, IPC, USER — isolates the process
7. runc sets up **cgroups**: limits CPU, memory, I/O
8. runc **pivot_root**: changes the filesystem root to the container's overlay filesystem
9. runc executes the entrypoint process (PID 1 in the container)
10. Container stdout/stderr connected through Docker daemon to your terminal
</details>

**C3. Why does Kubernetes use etcd and what would happen if etcd went down?**
<details><summary>Deep Answer</summary>

etcd = distributed key-value store using the Raft consensus algorithm. Stores ALL cluster state: pod specs, deployments, services, secrets, configmaps, RBAC, CRDs. Raft ensures consistency across a cluster of 3-5 etcd nodes (quorum = (N/2)+1). **If etcd goes down**: API server can't read/write state. kubectl commands fail. Scheduler can't schedule new pods. Controller manager can't reconcile state. EXISTING running pods continue running (they don't constantly check etcd — they're managed by kubelet on each node). New pods can't be scheduled. No updates possible. This is why etcd backup + restore is the most critical K8s operation.
</details>

**C4. TLS handshake: what is forward secrecy and why does it matter?**
<details><summary>Deep Answer</summary>

Without forward secrecy: if attacker records encrypted traffic now, and later compromises the server's private key, they can decrypt ALL past traffic retroactively. The server's private key decrypts the session key which decrypts the data. **Forward secrecy** (TLS 1.3 default): each session uses an **ephemeral key pair** (ECDHE). Session keys derived from ephemeral keys + DH exchange. Session key is never stored. If private key compromised later: past sessions can't be decrypted (the ephemeral keys are gone). This is why TLS 1.3 mandates forward secrecy and deprecated non-FS cipher suites. Practically: enables safer long-term data archival.
</details>

**C5. DNS propagation: why does it take "up to 48 hours"?**
<details><summary>Deep Answer</summary>

DNS uses hierarchical caching. Each DNS record has a TTL (time-to-live). When you update a DNS record, authoritative NS serves the new value immediately. But: resolvers worldwide have cached the OLD value until their cache TTL expires. TTL varies: some ISPs set their resolver cache TTL aggressively (override your TTL), some ignore TTL and cache for hours regardless. "48 hours" = worst-case TTL of most records (common: 3600s=1hr, 86400s=1day). Reduce before migration: lower TTL to 60s a week before planned change → faster propagation. After change: most resolvers pick up the new value within minutes. "48 hours" is a legacy conservative estimate.
</details>

**C6. Load balancer: what is the difference between Layer 4 and Layer 7?**
<details><summary>Deep Answer</summary>

**Layer 4 (Transport)**: routes based on TCP/UDP. Sees: IP address, port. Doesn't read HTTP content. Faster (no packet inspection, can be done in-kernel). Can't do URL-based routing, auth injection, session affinity by cookie. Examples: AWS NLB, HAProxy in TCP mode. **Layer 7 (Application)**: reads HTTP headers, URL, body. Can route `/api` to one backend, `/static` to another. Can inject headers (`X-Real-IP`), handle SSL termination, do health checks on HTTP endpoints, session affinity by cookie. More CPU-intensive (full packet inspection). Examples: NGINX, AWS ALB, Envoy. Modern microservices use L7 (Envoy/Istio) for fine-grained traffic control.
</details>


> **Navigation**: [← Terraform](20_Terraform_IaC.md) | [Index](00_INDEX.md) | [Next → SRE](22_SRE_Practices.md)

