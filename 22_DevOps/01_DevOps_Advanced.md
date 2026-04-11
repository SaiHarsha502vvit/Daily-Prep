> **Navigation**: [← Fundamentals](00_DevOps_Fundamentals.md) | [Index](00_INDEX.md) | [Networking →](02_Networking_Security.md)

# 🚀 DevOps Advanced — IaC, GitOps, Observability & Production Patterns

> _"Junior DevOps: 'I deployed it manually and it works.' Senior DevOps: 'If I can't reproduce this deployment from code in under 5 minutes, it's not ready for production.'"_

---

# PART 0: The Evolution of Deployment

```
ERA 1 — THE BARE METAL AGE (1990s-2000s):
  Buy servers. Rack them. Install OS. SSH in. Deploy manually.
  Months to get a new server. Config drift everywhere.
  When server dies → panic. Rebuild from memory. Takes days.
  ANALOGY: Building a house brick by brick. Each house is unique.

ERA 2 — VIRTUALIZATION (2000s-2010s):
  VMware, VirtualBox. One physical → many virtual machines.
  Faster provisioning (~hours). But still snowflake configs.
  Chef, Puppet, Ansible emerge for config management.
  ANALOGY: Mass-producing house blueprints. Still building each one.

ERA 3 — CLOUD + CONTAINERS (2010s-2020s):
  AWS/GCP/Azure + Docker. Spin up in seconds. Immutable infra.
  Kubernetes orchestrates thousands of containers automatically.
  Terraform manages cloud infrastructure AS CODE (declarative).
  ANALOGY: Ordering pre-built modular homes from a catalog.

ERA 4 — PLATFORM ENGINEERING (2020s-present):
  Internal Developer Platforms. Developers self-serve deployments.
  GitOps (ArgoCD, Flux). Everything in Git — pull request to deploy.
  Service meshes (Istio, Linkerd). Observability (OpenTelemetry).
  Serverless on K8s (Knative). AI-assisted incident response.
  ANALOGY: A city with smart infrastructure — water, power, roads 
  all managed automatically. Residents just move in.
```

---

# PART 1: Infrastructure as Code (Terraform)

---

```
WHAT IS IAC?
  Managing infrastructure (servers, databases, networks, DNS, load balancers)
  through DECLARATIVE CODE, not manual UI clicks.
  
  ANALOGY: Ordering at a restaurant.
  IMPERATIVE: "Take flour. Mix with water. Knead for 10 min. Roll flat..."
  DECLARATIVE: "I'd like a margherita pizza, please."
  
  Terraform = you describe WHAT you want (a pizza).
  Terraform figures out HOW to create/update it.

THE TERRAFORM WORKFLOW:
  1. WRITE: Define desired infrastructure in .tf files (HCL language)
  2. PLAN:  terraform plan → shows what will change (dry run!)
  3. APPLY: terraform apply → makes it real
  4. DESTROY: terraform destroy → tears it all down
  
STATE FILE (terraform.tfstate):
  Terraform stores the current state of your infrastructure.
  CRUCIAL: This file is the source of truth. If lost → Terraform 
  doesn't know what exists. Use REMOTE STATE (S3, GCS) in production!

HOW TERRAFORM DIFFERS FROM ANSIBLE:
  Terraform: INFRASTRUCTURE — creates servers, networks, databases.
             Declarative. Tracks state. Immutable.
  Ansible:   CONFIGURATION — installs software, configures OS settings.
             Procedural steps. No state. Mutable.
  Often used TOGETHER: Terraform creates VMs, Ansible configures them.
```

```hcl
# ── TERRAFORM EXAMPLE: Complete AWS Infrastructure ──

# Provider: which cloud to talk to
provider "aws" {
  region = "us-east-1"
}

# VPC (Virtual Private Cloud — your own network in the cloud)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"    # 10.0.0.0 - 10.0.255.255 (65,536 IPs)
  enable_dns_hostnames = true
  
  tags = { Name = "production-vpc" }
}

# Subnet (a subdivision of the VPC)
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id    # reference VPC above
  cidr_block              = "10.0.1.0/24"      # 256 IPs
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  
  tags = { Name = "public-subnet" }
}

# Security Group (firewall rules)
resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id
  
  # Allow HTTP from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Allow HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Instance (virtual server)
resource "aws_instance" "web" {
  ami                    = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2
  instance_type          = "t3.medium"               # 2 vCPU, 4GB RAM
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker
    systemctl start docker
    docker pull myapp:latest
    docker run -d -p 80:8080 myapp:latest
  EOF
  
  tags = { Name = "web-server", Environment = "production" }
}

# RDS Database
resource "aws_db_instance" "postgres" {
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  db_name              = "myapp"
  username             = var.db_username
  password             = var.db_password    # from variables, NEVER hardcode!
  skip_final_snapshot  = false
  multi_az             = true               # high-availability!
}

# VARIABLES — parameterize everything
variable "db_username" { type = string }
variable "db_password" { type = string, sensitive = true }  # hidden in logs

# OUTPUTS — show useful info after apply
output "web_server_ip" { value = aws_instance.web.public_ip }
output "db_endpoint"   { value = aws_db_instance.postgres.endpoint }
```

---

# PART 2: Advanced Kubernetes — Production Patterns

---

```
BEYOND BASIC K8s (from the fundamentals guide):
  You know: Pods, Deployments, Services, HPA.
  Now: Rolling vs Canary vs Blue/Green, Helm charts, Ingress, ConfigMaps/Secrets.

DEPLOYMENT STRATEGIES:

1. ROLLING UPDATE (default — safe and gradual):
   Replace old pods with new ones ONE AT A TIME.
   At no point is the app completely down.
   
   ANALOGY: Renovating rooms in a hotel while guests are staying.
   Room 1 closed for renovation → Room 2 still serving guests.
   Room 1 reopens (new version) → Room 2 closes for renovation.
   
   maxSurge: how many EXTRA pods during update (temporary capacity)
   maxUnavailable: how many pods can be DOWN simultaneously

2. CANARY DEPLOYMENT (gradual risk reduction):
   Deploy new version to a SMALL % of pods (5-10%).
   Monitor errors, latency, and metrics.
   If healthy → gradually increase to 100%.
   If broken → rollback instantly (only 5% of users affected).
   
   ANALOGY: Canary in a coal mine.
   Send one canary (new version) down the mine (production).
   If canary dies (high errors) → don't send miners (full rollout).

3. BLUE/GREEN (instant switchover):
   Run TWO identical environments: Blue (current) and Green (new).
   Green is fully tested. When ready → switch ALL traffic from Blue to Green.
   If Green fails → switch back to Blue instantly (still running!).
   
   COST: Double infrastructure during deployment. But zero downtime.
```

```yaml
# ── HELM CHART STRUCTURE ──
# Helm = package manager for Kubernetes
# Chart = a package of K8s manifests (YAML templates)

# Chart.yaml (metadata)
apiVersion: v2
name: myapp
version: 1.2.0
appVersion: "3.5.1"
description: My production application

# values.yaml (default configuration — can be overridden per environment)
replicaCount: 3
image:
  repository: myorg/myapp
  tag: "3.5.1"
  pullPolicy: IfNotPresent
resources:
  requests:
    cpu: 250m       # 0.25 CPU cores
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
service:
  type: ClusterIP
  port: 8080
ingress:
  enabled: true
  host: api.myapp.com
  tls: true
env:
  DATABASE_URL: "postgresql://user:pass@db:5432/myapp"
  REDIS_URL: "redis://cache:6379"
  LOG_LEVEL: "info"

---
# templates/deployment.yaml (using Go templating)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0        # zero downtime!
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
        resources: {{ toYaml .Values.resources | nindent 10 }}
        
        # Health checks — K8s knows when your app is healthy
        livenessProbe:           # Is the container alive?
          httpGet:
            path: /healthz
            port: {{ .Values.service.port }}
          initialDelaySeconds: 15
          periodSeconds: 20
        
        readinessProbe:          # Is the container READY to receive traffic?
          httpGet:
            path: /ready
            port: {{ .Values.service.port }}
          initialDelaySeconds: 5
          periodSeconds: 10
        
        env:
        {{- range $key, $value := .Values.env }}
        - name: {{ $key }}
          value: {{ $value | quote }}
        {{- end }}

---
# templates/ingress.yaml (route external traffic to your service)
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Chart.Name }}-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod   # auto TLS!
spec:
  tls:
  - hosts:
    - {{ .Values.ingress.host }}
    secretName: {{ .Chart.Name }}-tls
  rules:
  - host: {{ .Values.ingress.host }}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{ .Chart.Name }}
            port:
              number: {{ .Values.service.port }}
{{- end }}
```

```bash
# Helm commands
helm install myapp ./charts/myapp                     # install
helm upgrade myapp ./charts/myapp --set replicaCount=5 # scale
helm rollback myapp 1                                  # rollback to revision 1
helm list                                              # see all releases
helm template myapp ./charts/myapp                    # dry run (see generated YAML)
```

---

# PART 3: GitOps — Git as the Single Source of Truth

---

```
WHAT IS GITOPS?
  Everything about your infrastructure and deployments lives IN GIT.
  
  TRADITIONAL: Developer pushes code → CI builds image → CI PUSHES to K8s
  GITOPS:      Developer pushes code → CI builds image → CI updates Git manifest
               → ArgoCD PULLS from Git → ArgoCD deploys to K8s
  
  KEY DIFFERENCE:
  Traditional = CI system has kubectl access (security risk!)
  GitOps      = Only ArgoCD has cluster access. CI just pushes to Git.
  
  BENEFITS:
  ✓ Full audit trail: every deployment is a Git commit
  ✓ Rollback = git revert (not "type kubectl rollback and pray")
  ✓ Pull Request = deployment review (team reviews infra changes)
  ✓ Self-healing: if someone manually changes K8s, ArgoCD reverts it!
  ✓ Declarative: Git repo describes desired state → ArgoCD enforces it
  
  TOOLS: ArgoCD (most popular), Flux (CNCF), Jenkins X

ARGOCD WORKFLOW:
  1. Developer merges PR to main branch
  2. CI pipeline builds Docker image, pushes to registry
  3. CI updates Helm chart version in a separate "gitops" repo
  4. ArgoCD watches gitops repo (polling or webhook)
  5. ArgoCD detects drift: Git says v3.5.1, cluster has v3.5.0
  6. ArgoCD syncs: applies new manifests to K8s cluster
  7. Health checks pass → deployment complete!
  8. If failing → ArgoCD shows "Degraded" in dashboard → alert fires
```

---

# PART 4: Observability Stack — Beyond Basic Monitoring

---

```
THE THREE PILLARS OF OBSERVABILITY:

1. METRICS (Prometheus + Grafana):
   NUMBERS over time. "How many requests per second?"
   Gauge: current value (CPU 65%)
   Counter: cumulative (total_requests: 1,234,567)
   Histogram: distribution (request_duration_seconds)
   
   USE: Alerting, SLO dashboards, capacity planning.

2. LOGS (ELK Stack / Loki):
   EVENTS with context. "User 123 got 500 error on /api/orders"
   Structured logging (JSON): { "level": "error", "userId": 123, "path": "/api/orders" }
   
   USE: Debugging specific failures, audit trails, searching for patterns.

3. TRACES (Jaeger / OpenTelemetry):
   The JOURNEY of a single request across multiple services.
   Request → API Gateway → User Service → Database → Cache → Response
   Each step has timing: "DB query took 340ms of the total 500ms"
   
   USE: Finding WHERE the bottleneck is in a microservices chain.

OPENTELEMETRY (OTel) — THE UNIFIED STANDARD:
  Before OTel: Different libraries for metrics (Prometheus), traces (Jaeger), logs (Fluentd).
  After OTel:  ONE SDK, ONE standard, exports to ANY backend.
  
  You instrument your code ONCE with OTel. Then choose your backend:
  • Metrics → Prometheus / Datadog
  • Traces  → Jaeger / Zipkin / X-Ray
  • Logs    → Loki / CloudWatch / ELK
  
  ANALOGY: OTel = USB-C. One cable, all devices.
  Before: different charger for each phone brand.
  After:  one universal connector.

ALERTING BEST PRACTICES:
  ✗ DON'T alert on: CPU usage (normal fluctuations trigger noise)
  ✓ DO alert on: SLO breaches (error rate > 0.1% over 5 min)
  ✓ DO alert on: Burn rate (at this pace, we'll exhaust the error budget in 6 hours)
  
  ACTIONABLE ALERTS ONLY:
  If an alert fires, someone must be able to DO something about it.
  "Disk 85% full" → actionable (expand disk or clean up).
  "Memory 60%" → probably noise (60% is normal).
```

```python
# OPENTELEMETRY — Python instrumentation example

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Setup once at app startup
trace.set_tracer_provider(TracerProvider())
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4317"))
)

# Auto-instrument FastAPI (adds traces to all endpoints automatically!)
FastAPIInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()  # traces all HTTP client calls too

# Custom spans for business logic
tracer = trace.get_tracer("myapp.orders")

@app.post("/orders")
async def create_order(request: OrderRequest):
    with tracer.start_as_current_span("create-order") as span:
        span.set_attribute("order.customer_id", request.customer_id)
        span.set_attribute("order.total", request.total)
        
        with tracer.start_as_current_span("validate-inventory"):
            check_inventory(request.items)  # sub-span: isolated timing
        
        with tracer.start_as_current_span("process-payment"):
            charge_payment(request.payment_method)
        
        with tracer.start_as_current_span("save-to-db"):
            order = save_order(request)
        
        span.set_attribute("order.id", order.id)
        return order
# In Jaeger UI: see each sub-operation's timing visually!
# "validate-inventory took 20ms, process-payment took 150ms, save-to-db took 30ms"
```

---

# PART 5: CI/CD Advanced Patterns

---

```yaml
# ── ADVANCED GITHUB ACTIONS PIPELINE ──
# Features: matrix builds, caching, environment gates, canary deployment

name: Production Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]    # test on multiple Node versions!
        os: [ubuntu-latest, windows-latest]
    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'                  # cache node_modules!
    
    - run: npm ci
    - run: npm run lint
    - run: npm run test -- --coverage
    
    - uses: actions/upload-artifact@v4
      with:
        name: coverage-${{ matrix.node-version }}
        path: coverage/

  build:
    needs: test                       # only if ALL test matrix jobs pass!
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - uses: docker/build-push-action@v5
      with:
        push: true
        tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=gha          # GitHub Actions cache for Docker layers!
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging              # requires approval in GitHub settings!
    steps:
    - name: Deploy to staging
      run: |
        helm upgrade myapp ./charts/myapp \
          --set image.tag=${{ github.sha }} \
          --namespace staging \
          --wait --timeout 300s

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production           # separate approval gate!
    steps:
    - name: Canary deploy (10%)
      run: |
        helm upgrade myapp ./charts/myapp \
          --set image.tag=${{ github.sha }} \
          --set canary.enabled=true \
          --set canary.weight=10 \
          --namespace production
    
    - name: Monitor canary (5 min)
      run: |
        sleep 300
        ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_errors[5m])")
        if [ "$ERROR_RATE" -gt "0.01" ]; then
          echo "Canary failed! Rolling back."
          helm rollback myapp 0 --namespace production
          exit 1
        fi
    
    - name: Full rollout
      run: |
        helm upgrade myapp ./charts/myapp \
          --set image.tag=${{ github.sha }} \
          --set canary.enabled=false \
          --namespace production
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Docker basics** | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — containers, docker-compose |
| **Kubernetes basics** | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — Deployment, HPA |
| **Distributed patterns** | [Enterprise Distributed](../10_Enterprise_Systems/09_Distributed_Patterns.md) — Saga, Outbox, CQRS |
| **GitHub Actions for ML** | [MLOps Production](../21_Python_ML_DL_NLP/13_MLOps_Production.md) — CI/CD for ML pipelines |
| **SRE fundamentals** | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — SLOs, error budgets |
| **FastAPI (async deployment)** | [Python Asyncio](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) |
| **Networking / TLS / DNS** | [Networking & Security](02_Networking_Security.md) — full DNS→TCP→TLS journey |
| **Service Mesh (Istio)** | [Cloud Native](03_ServiceMesh_CloudNative.md) — mTLS, traffic splitting |
| **Serverless / Lambda** | [Cloud Native](03_ServiceMesh_CloudNative.md) — cold starts, Knative |
| **SQL injection/security** | [SQL Security](../08_SQL/33_SQL_Security_Injection.md) — parameterized queries |
| **DS in production** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — LRU cache, queues, hash maps |

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


> **Navigation**: [← Fundamentals](00_DevOps_Fundamentals.md) | [Index](00_INDEX.md) | [Networking →](02_Networking_Security.md) | [Cloud Native →](03_ServiceMesh_CloudNative.md)
