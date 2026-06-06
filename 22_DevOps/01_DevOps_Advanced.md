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

