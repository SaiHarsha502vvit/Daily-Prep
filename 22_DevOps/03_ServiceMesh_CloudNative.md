> **Navigation**: [← Networking & Security](02_Networking_Security.md) | [Index](00_INDEX.md)

# ☁️ Service Mesh, Serverless & Cloud Native Patterns

> _"Kubernetes answers 'how do I run containers.' Service mesh answers 'how do containers talk to each other securely, observably, and reliably — without changing a single line of application code.'"_

---

# PART 1: Service Mesh — The Networking Layer You Don't Code

---

```
THE PROBLEM:
  Microservices need to: encrypt traffic (mTLS), retry on failure,
  load balance, observe (trace requests), enforce rate limits.
  
  WITHOUT service mesh: every team adds these features IN CODE.
  → Java team uses Resilience4j. Python team uses their own retry lib.
  → Inconsistent, duplicated work, hard to enforce company-wide policies.
  
  WITH service mesh: a SIDECAR PROXY sits next to every pod.
  Your app makes plain HTTP calls. The proxy handles EVERYTHING:
  mTLS, retries, circuit breakers, tracing, rate limiting.
  
  ANALOGY: A translator accompanies you in a foreign country.
  You speak English (plain HTTP). The translator handles:
  local language (mTLS encryption), customs (rate limits),
  directions (routing), and reports where you've been (tracing).
  You don't need to learn anything new.

HOW IT WORKS:
  
  ┌─ Pod A ──────────────────────┐     ┌─ Pod B ──────────────────────┐
  │  ┌──────────┐  ┌──────────┐  │     │  ┌──────────┐  ┌──────────┐  │
  │  │ Your App │→→│  Envoy   │──┼──►──┼──│  Envoy   │→→│ Your App │  │
  │  │ (8080)   │  │ (sidecar)│  │     │  │ (sidecar)│  │ (8080)   │  │
  │  └──────────┘  └──────────┘  │     │  └──────────┘  └──────────┘  │
  └──────────────────────────────┘     └──────────────────────────────┘
  
  Your app calls localhost:8080 → Envoy intercepts → encrypts (mTLS) →
  routes to Pod B's Envoy → decrypts → forwards to Pod B's app.
  
  All traffic is encrypted in transit. Apps don't know about TLS.

KEY SERVICE MESH FEATURES:

1. mTLS (Mutual TLS):
   Every pod-to-pod call is encrypted. Both sides verify identity.
   Zero-trust networking: even internal traffic is encrypted.
   Certificate rotation happens automatically (no manual cert management!).

2. Traffic Management:
   Canary deploys: route 5% of traffic to new version.
   A/B testing: route by header (user-agent, cookie).
   Retries: automatic retry with backoff on 503 errors.
   Timeouts: global timeout policy (no more infinite waits).

3. Observability (free!):
   Every request is automatically traced (no code changes).
   Metrics: latency p99, error rate, requests/sec per service.
   Dashboard in Jaeger/Kiali shows the entire service graph.

ISTIO vs LINKERD:
  Istio:   Feature-rich. Complex. Uses Envoy proxy. More configuration.
           Best for: large enterprises, complex traffic policies.
  Linkerd: Lightweight. Simple. Uses its own micro-proxy.
           Best for: teams wanting simplicity, lower resource overhead.
  
  Recommendation: Start with Linkerd (easy). Move to Istio if you need advanced features.
```

```yaml
# ── ISTIO: Canary deployment via traffic splitting ──
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
  - myapp
  http:
  - route:
    - destination:
        host: myapp
        subset: stable            # v1.0 (current)
      weight: 90                  # 90% of traffic
    - destination:
        host: myapp
        subset: canary            # v2.0 (new)
      weight: 10                  # 10% of traffic
    retries:
      attempts: 3
      perTryTimeout: 2s
    timeout: 10s

---
# Define which pods belong to which subset
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: myapp
spec:
  host: myapp
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100       # circuit breaker: max connections
    outlierDetection:
      consecutive5xxErrors: 5     # eject pod after 5 consecutive errors
      interval: 30s
      baseEjectionTime: 30s
  subsets:
  - name: stable
    labels:
      version: v1
  - name: canary
    labels:
      version: v2
```

---

# PART 2: Serverless — Functions Without Servers

---

```
THE EVOLUTION:
  Bare Metal → VMs → Containers → Serverless
  Each step: less infrastructure for the developer to manage.
  
  Serverless = you write a FUNCTION. Cloud runs it. You pay per invocation.
  No servers to manage. No Docker. No K8s. Just code.
  
  ANALOGY: 
  Running a server = owning a car. You pay even when parked.
  Serverless = taking a taxi. You pay only when riding.

AWS LAMBDA (most popular):
  
  Trigger → Lambda Function → Response
  
  Triggers: API Gateway (HTTP), SQS (message queue), S3 (file upload),
            CloudWatch (scheduled), DynamoDB Streams (data change)
  
  PRICING: $0.20 per 1 million invocations.
           Free tier: 1M invocations/month.
  
  COLD START PROBLEM:
  First invocation after idle: Lambda spins up a container → 100-3000ms delay.
  Subsequent invocations: warm container → 1-10ms.
  
  MITIGATION:
  • Provisioned Concurrency: pre-warm N instances (costs more)
  • Smaller runtime: Python/Node start faster than Java/Spring
  • SnapStart (Java): snapshot at init → fast restore

WHEN TO USE SERVERLESS vs CONTAINERS:
  ✓ Serverless: Event-driven, sporadic traffic, simple functions, startups
  ✗ Serverless: Long-running tasks (15 min max!), consistent high traffic,
                 complex apps, need control over runtime
  
  KNATIVE (Serverless ON Kubernetes):
    Run serverless workloads on YOUR K8s cluster.
    Scale-to-zero: no traffic → 0 pods (saves resources).
    Scale-from-zero: first request → pod spins up (cold start ~2-5s).
    Best of both: serverless scaling + K8s flexibility.
```

```python
# ── AWS LAMBDA FUNCTION (Python) ──
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('orders')

def lambda_handler(event, context):
    """
    API Gateway trigger: POST /orders
    Event contains the HTTP request body.
    """
    body = json.loads(event['body'])
    
    # Validate
    if not body.get('customer_id') or not body.get('items'):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    # Store in DynamoDB
    order_id = str(uuid.uuid4())
    table.put_item(Item={
        'orderId': order_id,
        'customerId': body['customer_id'],
        'items': body['items'],
        'total': str(body['total']),
        'status': 'PENDING',
        'createdAt': datetime.utcnow().isoformat()
    })
    
    # Trigger next step (async!)
    sqs = boto3.client('sqs')
    sqs.send_message(
        QueueUrl='https://sqs.us-east-1.amazonaws.com/123/payment-queue',
        MessageBody=json.dumps({'orderId': order_id, 'total': body['total']})
    )
    
    return {
        'statusCode': 201,
        'body': json.dumps({'orderId': order_id, 'status': 'PENDING'})
    }
```

---

# PART 3: FinOps — Cloud Cost Management

---

```
THE PROBLEM:
  Cloud billing is pay-per-use.
  Without controls: engineering team spins up resources → forgets about them.
  Monthly AWS bill goes from $5,000 → $50,000. Nobody knows why.
  
  FINOPS = Financial + Operations. Making cloud costs visible and accountable.

COST OPTIMIZATION STRATEGIES:

1. RIGHT-SIZING:
   Most instances are overprovisioned. Monitor actual CPU/memory usage.
   t3.large (2 vCPU, 8GB) running at 5% CPU → switch to t3.small (save 75%).
   
   Tools: AWS Compute Optimizer, Datadog, kubecost (K8s cost per pod).

2. RESERVED INSTANCES / SAVINGS PLANS:
   On-Demand: $0.1 per hour (full price, no commitment)
   1-year reserved: $0.06/hr (40% savings, commitment)
   3-year reserved: $0.04/hr (60% savings, big commitment)
   Spot instances: $0.02/hr (80% savings, BUT can be terminated with 2 min warning!)
   
   Spot is great for: batch processing, CI/CD runners, ML training.
   Spot is BAD for: production API servers (can't lose them mid-request!).

3. TAGGING:
   Tag every resource: team=payments, environment=staging, project=checkout.
   → Slice the bill by team: "Payments team: $12,000, Analytics: $8,000."
   → Delete all staging resources after 7 days automatically.

4. SCALING POLICIES:
   Schedule-based: Scale down at night (70% of traffic is daytime).
   Event-based: Scale up for Black Friday, scale down after.
   
   K8s: HPA (Horizontal Pod Autoscaler) + VPA (Vertical Pod Autoscaler).
   Cluster Autoscaler: add/remove NODES when pods can't be scheduled.

UNIT ECONOMICS:
  Track cost PER UNIT of business value:
  Cost per 1,000 API requests: $0.05
  Cost per customer: $2.50/month
  Cost per GB processed: $0.12
  
  If cost per request increases → investigate specific service.
```

---

# PART 4: Platform Engineering — The Future of DevOps

---

```
THE PROBLEM WITH "YOU BUILD IT, YOU RUN IT":
  Every team needs to: write Terraform, Dockerfiles, K8s manifests,
  set up CI/CD, configure monitoring, manage secrets...
  → Each team reinvents the wheel → inconsistent, slow, error-prone.

PLATFORM ENGINEERING:
  A dedicated team builds an Internal Developer Platform (IDP).
  Developers SELF-SERVE through Golden Paths:
  
  Developer: "I need a new microservice."
  IDP: "Fill in this form: service name, language, team."
  → Auto-creates: GitHub repo, Dockerfile, Helm chart, CI/CD pipeline,
     Prometheus alerts, Grafana dashboard, staging + prod namespaces.
  → Developer starts writing business code in 10 minutes!

THE CNCF LANDSCAPE (Cloud Native Computing Foundation):
  The CNCF graduates and incubates the tools that run the cloud:
  
  GRADUATED (production-proven):
  • Kubernetes (orchestration)
  • Prometheus (metrics)
  • Envoy (proxy/service mesh)
  • containerd (container runtime)
  • Helm (package management)
  • Argo (GitOps, workflows)
  • Flux (GitOps)
  • Jaeger (tracing)
  • OpenTelemetry (observability)
  • Falco (runtime security)
  • Linkerd (service mesh)
  
  INCUBATING (gaining traction):
  • Dapr (portable microservices runtime)
  • Backstage (developer portal — Spotify open-sourced)
  • Crossplane (manage cloud from K8s)
  • Knative (serverless on K8s)
  • Kyverno (K8s policy engine)
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Saga pattern (distributed tx)** | [Enterprise Distributed](../10_Enterprise_Systems/09_Distributed_Patterns.md) — compensation logic |
| **Circuit breaker** | [Networking & Security](02_Networking_Security.md) — cloud reliability patterns |
| **DynamoDB (Lambda backend)** | [NoSQL Guide](../08_SQL/22_NoSQL_MongoDB.md) — document stores |
| **ML model serving (Lambda)** | [MLOps Production](../21_Python_ML_DL_NLP/13_MLOps_Production.md) |
| **Queue-based (SQS)** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — queues everywhere |
| **Event-driven (Kafka)** | [Enterprise Distributed](../10_Enterprise_Systems/09_Distributed_Patterns.md) — Outbox, CQRS |

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


> **Navigation**: [← Networking & Security](02_Networking_Security.md) | [Index](00_INDEX.md)
