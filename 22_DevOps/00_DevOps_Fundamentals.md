> **Navigation**: [Back to Master Index](../00_MASTER_INDEX.md)

# 🚀 DevOps — Complete Guide: Basics to Advanced

> _"DevOps is not a tool, a team, or a process. It's a CULTURE: the practice of breaking down the wall between Development and Operations so you can ship software faster, safer, and more reliably."_

---

![The DevOps Infinity Loop — Plan, Code, Build, Test, Release, Deploy, Operate, Monitor](devops_lifecycle.png)

# PART 0: The 5W+H Framework

| Question  | DevOps Context                                                                                                                                                         |
| :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | A set of practices, tools, and cultural philosophies that automate and integrate software development (Dev) and IT operations (Ops).                                   |
| **WHY**   | Pre-DevOps: Dev team writes code → throws "over the wall" → Ops team deploys it. Months of friction, broken deployments, finger-pointing. DevOps tears down that wall. |
| **WHEN**  | As soon as you have more than one person working on software that needs to run reliably. Even a solo developer benefits from CI/CD and containerization.               |
| **WHERE** | Everywhere software ships: startups, enterprises, banks, healthcare. AWS, GCP, Azure all have DevOps services.                                                         |
| **WHO**   | Gene Kim ("The Phoenix Project"), Patrick Debois (coined "DevOps" in 2009), Nicole Forsgren (DORA metrics research).                                                   |
| **HOW**   | Automate everything: testing, building, deployment. Measure everything: deployments/day, MTTR, change failure rate. Share ownership between Dev and Ops.               |

---

# PART 1: The History — How DevOps Was Born

---

```
THE WATERFALL ERA (1970s-2000s):
  Plan → Analyze → Design → Code → Test → Deploy → Maintain
  Each phase takes months, sequential, rigid.

  THE PROBLEM:
  • Dev finishes code → hands to Ops → "It works on my machine!"
  • Ops tries to deploy → it breaks → blame game starts
  • Releases happen every 6-12 months → big, scary, risky deployments
  • Long release cycles = slow response to user needs

  ANALOGY: Building a house by:
  First designing the entire house on paper for 2 months.
  Then handing blueprints to builders (never talking again).
  Then noticing after construction: "the living room doors are backwards."
  Rebuilding takes months. Designer - Builder disconnect is fatal.

THE AGILE REVOLUTION (2001):
  Agile Manifesto: Individuals, working software, collaboration, responding to change.
  Small iterations (sprints), frequent delivery, customer collaboration.

  BUT: Agile helped DEV teams ship faster.
  OPS teams still deployed once a month using manual scripts.
  The bottleneck moved from Dev to Ops.

DEVOPS EMERGES (2009):
  Patrick Debois organizes "DevOpsDays" in Ghent, Belgium.
  THE INSIGHT: Break the wall by sharing TOOLS, PRACTICES, and CULTURE.

  Key books:
  "The Phoenix Project" (2013): Novel about IT transformation
  "The DevOps Handbook" (2016): Practical implementation
  "Accelerate" (2018): DORA research — what actually works

TODAY (2024):
  Elite teams deploy 973x more frequently than low performers.
  Change failure rates: 0-15% (elite) vs 46-60% (low)
  MTTR: Hours vs Months
  Source: DORA State of DevOps 2023
```

---

# PART 2: Linux & Shell Fundamentals — The Foundation

---

```
WHY LINUX?
  96% of world's servers run Linux.
  All cloud providers (AWS, GCP, Azure) default to Linux.
  Docker containers are Linux processes.

  Even Windows DevOps pros must know Linux.

FILESYSTEM HIERARCHY:
  /           Root — everything starts here
  /bin        Essential binaries (ls, cp, mv, rm, bash)
  /etc        Configuration files (nginx.conf, sshd_config)
  /home       Home directories for users (/home/alice)
  /var        Variable data (logs: /var/log/nginx/)
  /tmp        Temporary files (cleared on reboot)
  /proc       Virtual filesystem: running processes, kernel info
  /usr        User programs (/usr/bin, /usr/local/bin)
  /opt        Optional/third-party software

ESSENTIAL COMMANDS:
  File navigation:
  ls -la            # list all files with permissions + sizes
  pwd               # print working directory
  cd /var/log       # change to /var/log directory
  find / -name "*.log" -mtime -1   # find logs modified in last 24h

  File operations:
  cp -r src/ dest/  # recursive copy
  mv old.txt new.txt
  ln -s /long/path /short/link  # symbolic link

  Text processing (critically important for DevOps logs!):
  cat app.log                 # print entire file
  grep "ERROR" app.log        # filter lines containing ERROR
  grep -n "TIMEOUT" app.log   # with line numbers
  awk '{print $1, $4}' access.log  # extract columns 1 and 4
  sed 's/localhost/0.0.0.0/g' config.txt  # find and replace
  tail -f app.log             # follow log in real-time (F5 for DevOps)
  wc -l app.log               # count lines

PERMISSIONS (critical for security):
  ls -la output:
  -rwxr-xr-x  1  alice  devops  4096  deploy.sh
  │││││││││
  │││└────────── Other: read only (r--)
  │││
  ││└─────────── Group: read+execute (r-x)
  │└──────────── Owner: read+write+execute (rwx)
  └───────────── Type: - (file), d (directory), l (symlink)

  chmod 755 script.sh    # rwx r-x r-x (owner full, others read+execute)
  chmod 600 .env         # rw- --- --- (only owner can read/write secrets!)
  chown alice:devops file.txt

PROCESSES & SYSTEM MONITORING:
  ps aux            # all running processes
  top / htop        # interactive process monitor (CPU %, MEM %)
  lsof -i :8080     # who is listening on port 8080?
  netstat -tlnp     # all listening ports

  # Kill processes
  kill -9 PID       # SIGKILL (force)
  kill -15 PID      # SIGTERM (graceful shutdown, handle cleanup)
```

---

# PART 3: Docker — Containers Explained

---

```
THE PROBLEM BEFORE DOCKER (2013):
  Developer: "It works on my machine!"
  Ops: "Well, we're not deploying your machine."

  WHY? Software dependencies:
  • Dev machine: Python 3.11, PostgreSQL 15, libssl 1.1
  • Prod server: Python 3.8, PostgreSQL 11, libssl 1.0
  → App breaks in production despite working in dev.

VIRTUAL MACHINES vs CONTAINERS:

  VIRTUAL MACHINE:
  Hardware → Hypervisor → [Guest OS | Guest OS | Guest OS]
                              └─ Full OS, ~GB each, boots in minutes

  CONTAINER:
  Hardware → Host OS Kernel → [Container | Container | Container]
                                    └─ Just the app + libs, ~MB each, starts in ms

  KEY DIFFERENCE: Containers share the HOST OS kernel.
  They're just ISOLATED PROCESSES with their own filesystem view.

  ANALOGY: VM = Buying separate furnished apartments (each has own kitchen!)
           Container = Moving to a shared house where each tenant has own
           bedroom + bathroom but shares kitchen and living room (host OS kernel).

WHAT IS A DOCKER IMAGE?
  A read-only template describing everything needed to run your app:
  • Base OS layer (ubuntu:22.04)
  • Runtime (python:3.11)
  • Dependencies (requirements.txt)
  • Your application code
  • Startup command

  LAYERS: Images are LAYERED (like a git history of the filesystem).
  Each Dockerfile instruction creates a new read-only layer.
  Layers are cached and SHARED between images.

  ANALOGY: Image = Recipe. Container = Dish cooked from that recipe.
  Same recipe → many identical dishes.
  One recipe stored once on disk → shared by all containers reading from it.

DOCKERFILE — Writing Your Recipe:
```

```dockerfile
# ── Multi-stage Dockerfile (production best practice) ──

# Stage 1: Build (has dev dependencies like compilers)
FROM python:3.11-slim AS builder
WORKDIR /build

COPY requirements.txt .
# Install dependencies into a virtual environment (isolate from system Python)
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime (lean, no build tools)
FROM python:3.11-slim AS runtime
# Copy ONLY the virtual environment from builder (not pip, not compilers)
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY src/ ./src/
COPY config/ ./config/

# Run as non-root user (security best practice!)
RUN useradd -r appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
# ENTRYPOINT = fixed command, CMD = default args (can be overridden)
ENTRYPOINT ["python", "-m", "uvicorn"]
CMD ["src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t myapp:v1.2.3 .       # build image, tag it
docker run -d -p 8080:8000 \          # -d = detached (background)
           -e DATABASE_URL=$DB_URL \  # environment variable injection
           --name myapp-container \
           myapp:v1.2.3

docker ps                              # see running containers
docker logs -f myapp-container         # follow logs
docker exec -it myapp-container bash   # shell into running container
docker stop myapp-container            # graceful stop (SIGTERM)

# Docker image optimization checklist:
# ✅ Use specific tags (python:3.11-slim, NOT python:latest)
# ✅ Multi-stage builds (separate build vs runtime)
# ✅ .dockerignore file (exclude .git, __pycache__, tests)
# ✅ Run as non-root user
# ✅ Layer caching: copy requirements BEFORE code (doesn't change often)
# ✅ Use --no-cache-dir for pip (don't bloat image)
```

---

# PART 4: Docker Compose — Multi-Container Apps

---

```
PROBLEM: Real apps have multiple services:
  → API server, Database, Redis cache, Message queue
  Managing them manually with docker run is chaos.

DOCKER COMPOSE: Declare your entire application stack in YAML.
  One command starts everything: docker compose up
  One command destroys everything: docker compose down
```

```yaml
# docker-compose.yml — Full-stack app stack
version: "3.9"

services:
  # ── Application Server ──
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:secret@db:5432/appdb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy # wait for DB health check
      redis:
        condition: service_started
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs # mount logs directory
    networks:
      - backend

  # ── PostgreSQL Database ──
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data # named volume = persists!
      - ./init.sql:/docker-entrypoint-initdb.d/ # auto-run on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

  # ── Redis Cache ──
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes # persistence enabled
    volumes:
      - redis_data:/data
    networks:
      - backend

  # ── Nginx Reverse Proxy ──
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on: [api]
    networks:
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
    driver: bridge
```

---

# PART 5: Kubernetes — Container Orchestration at Scale

---

```
ANALOGY: If Docker is individual workers, Kubernetes is the STAFFING AGENCY.
  Worker (container): Does a specific job.
  Staffing Agency (K8s):
    "I need 10 workers at all times! If one gets sick, hire a replacement immediately."
    "When business is busy, scale to 50 workers. When slow, scale back to 5."
    "Zero downtime: cycle out workers gradually as new ones come in."

THE PROBLEM DOCKER ALONE DOESN'T SOLVE:
  • Your container crashes at 3am → nobody restarts it
  • Traffic spikes → you need 50 containers instead of 5 → who manages?
  • Rolling updates → how do you update without downtime?
  • Multiple servers → how do you distribute containers across 100 machines?

  KUBERNETES (K8s) solves ALL of this.

KEY KUBERNETES CONCEPTS:

CLUSTER:
  Master Node (Control Plane): Manages the cluster
    • API Server: receives kubectl commands
    • Scheduler: decides WHICH node runs each pod
    • etcd: distributed key-value store (cluster state)
    • Controller Manager: maintains desired state

  Worker Nodes: Run the actual containers
    • kubelet: agent on each node (reports to control plane)
    • kube-proxy: network rules for pods
    • Container runtime: Docker/containerd

POD:
  The smallest deployable unit in K8s.
  Usually contains ONE container (can share multiple tightly-coupled containers).
  Pods are EPHEMERAL — they die and are replaced.
  Each pod gets an IP address within the cluster.

DEPLOYMENT:
  Manages a set of identical Pods (replicas).
  "Run 3 replicas of this pod, always. If one dies, start a new one."
  Handles rolling updates: swap pods one-by-one (zero downtime).

SERVICE:
  Stable network endpoint for a set of pods.
  Pods come and go (IPs change). Service IP is STABLE.
  Load balances across all healthy pods.
  Types: ClusterIP (internal), NodePort, LoadBalancer, Ingress.

NAMESPACE:
  Virtual clusters within a cluster. Used for environment separation.
  (dev, staging, prod namespaces in same cluster)

CONFIGMAP + SECRET:
  ConfigMap: environment variables, configuration (non-sensitive)
  Secret: passwords, API keys (base64 encoded, stored in etcd)
```

```yaml
# deployment.yaml — Full production-ready Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
  namespace: production
  labels:
    app: myapp
    version: v1.2.3

spec:
  replicas: 3 # Run 3 identical pods
  selector:
    matchLabels:
      app: myapp

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1 # At most 1 pod down during update
      maxSurge: 1 # At most 1 extra pod during update

  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: registry.io/myapp:v1.2.3
          ports:
            - containerPort: 8000

          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url # pulled from K8s Secret
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: log_level # pulled from ConfigMap

          resources:
            requests: # guaranteed resources
              memory: "128Mi"
              cpu: "100m" # 0.1 CPU cores
            limits: # maximum allowed
              memory: "256Mi"
              cpu: "500m"

          # Health checks — K8s uses these to manage pod lifecycle
          livenessProbe: # Is the container alive?
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10

          readinessProbe: # Is the container ready for traffic?
            httpGet:
              path: /ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
  namespace: production
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8000
  type: ClusterIP # Internal-only, fronted by Ingress
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp-deployment
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70 # Scale up if CPU > 70%, scale down < 70%
```

---

# PART 6: CI/CD Pipelines — GitHub Actions

---

```
CI (Continuous Integration):
  Every code push → automatically: build → test → report
  GOAL: Catch bugs FAST, before they reach production.

CD (Continuous Delivery):
  Every green CI build → automatically: package → deploy to staging
  GOAL: Keep the software always in a deployable state.

CD (Continuous Deployment):
  Every green CI build → automatically deploy to PRODUCTION.
  GOAL: Fully automated deployment. Human approval optional.

ANALOGY:
  CI   = The quality inspector who checks every item off the assembly line.
  CD   = The shipping department that prepares it for delivery automatically.
  CDeployment = The delivery driver who ships to customers automatically.
```

```yaml
# .github/workflows/ci-cd.yml — Complete GitHub Actions Pipeline
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ── Stage 1: Code Quality ──────────────────────────────
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install black isort flake8 mypy
      - run: black --check src/
      - run: isort --check-only src/
      - run: flake8 src/
      - run: mypy src/

  # ── Stage 2: Tests ─────────────────────────────────────
  test:
    needs: lint-and-format
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: test }
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r requirements-dev.txt
      - name: Run tests with coverage
        run: pytest --cov=src --cov-report=xml --cov-fail-under=80
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
      - uses: codecov/codecov-action@v4 # Upload coverage to Codecov

  # ── Stage 3: Build & Push Docker Image ─────────────────
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' # only on push, not PR
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=short     # git-abc1234
            type=ref,event=branch     # branch name
            type=semver,pattern={{version}}  # v1.2.3

      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha # GitHub Actions cache for layer caching
          cache-to: type=gha,mode=max

  # ── Stage 4: Deploy to Staging ─────────────────────────
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.STAGING_KUBECONFIG }}
      - run: |
          kubectl set image deployment/myapp \
            myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image-digest }} \
            -n staging
          kubectl rollout status deployment/myapp -n staging --timeout=5m

  # ── Stage 5: Deploy to Production (with approval) ──────
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    environment: production # GitHub environment protection: requires manual approval!
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.PROD_KUBECONFIG }}
      - run: |
          kubectl set image deployment/myapp \
            myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image-digest }} \
            -n production
          kubectl rollout status deployment/myapp -n production --timeout=10m
```

---

# PART 7: Monitoring — Prometheus + Grafana Stack

---

```
THE THREE PILLARS OF OBSERVABILITY:

  LOGS:   What happened?
    Structured JSON logs (not plain text!) → searchable in Splunk/ELK
    Include: timestamp, level, service, trace_id, message

  METRICS: How much / how fast?
    Time-series numbers: request_rate, error_rate, latency_p99, cpu_usage
    Stored in time-series databases: Prometheus, InfluxDB

  TRACES: Why did THIS request take so long?
    Distributed request path tracked across microservices
    Tools: Jaeger, Zipkin, AWS X-Ray, OpenTelemetry

PROMETHEUS:
  Pull-based: Prometheus scrapes '/metrics' endpoint on your services.

  Your app exposes:
  http_requests_total{method="GET",path="/api/users"}  42378
  http_request_duration_seconds{quantile="0.99"}       0.234
  db_query_duration_seconds{query_type="SELECT"}       0.012

  PromQL (Prometheus Query Language):
  rate(http_requests_total[5m])           # request rate in last 5 minutes
  histogram_quantile(0.99, ...)           # 99th percentile latency
  100 * (1 - rate(up[5m]))               # service availability %

THE FOUR GOLDEN SIGNALS (Google SRE Book):
  1. LATENCY:  How long does it take to service a request?
               p50, p95, p99 (not average — averages hide outliers!)

  2. TRAFFIC:  How much demand is your system handling?
               requests/second, database queries/minute, events/second

  3. ERRORS:   What fraction of requests fail?
               HTTP 5xx rate, failed transactions/minute
               Don't forget: silent errors (wrong results, no exception)

  4. SATURATION: How "full" is your service?
               CPU %, memory %, disk %, queue depth
               Saturation approaching 100% = imminent problems!

ALERTING (when to wake up the on-call):
  Good alert: "Error rate is 5% (SLO is 0.1%)" → clear, actionable
  Bad alert:  "CPU is 80%" → not actionable until you know impact

  Alert fatigue: Too many alerts → on-call ignores them → real incidents missed
  Fix: Alert on SYMPTOMS (user-facing SLOs), not CAUSES (CPU%).
```

---

# PART 8: Site Reliability Engineering (SRE) Concepts

---

```
SRE (coined by Google) = bringing software engineering to operations problems.
"Hope is not a strategy."

SLI, SLO, SLA:
  SLI (Service Level INDICATOR): A metric that measures service quality.
    Example: "Percentage of requests that return HTTP 200 in <500ms"

  SLO (Service Level OBJECTIVE): Your TARGET for the SLI.
    Example: "SLI should be 99.9% over a 30-day rolling window"

  SLA (Service Level AGREEMENT): Contractual commitment with consequences.
    Example: "We commit to 99.9% uptime. If we miss it, you get billing credit."

  Error Budget = 100% - SLO = the allowed "room to fail"
  99.9% SLO → 0.1% error budget → 43.8 minutes/month you can be down.

  When error budget is BURNING FAST:
  → Slow down feature releases, focus on reliability
  When error budget is HEALTHY:
  → Speed up, take more risks with new features

INCIDENT MANAGEMENT:
  1. DETECT:   Alert fires (automatic) or user reports (reactive)
  2. RESPOND:  On-call acknowledges, starts investigation
  3. MITIGATE: Fastest path to restore service (rollback, restart, scale)
  4. RESOLVE:  Root cause found and fixed properly
  5. REVIEW:   Blameless post-mortem: "HOW did this happen?" not "WHO?"

  MTTR (Mean Time To Recovery) = key SRE metric
  Elite teams: MTTR < 1 hour
  Low performers: MTTR > 1 week

TOIL REDUCTION:
  Toil = repetitive, manual work that scales linearly with service size.
  "Every time traffic doubles, someone manually updates the config."

  SRE principle: Automate yourself out of toil.
  "If you do it more than twice, script it."
  Target: <50% of on-call's time spent on toil.

CHAOS ENGINEERING (Netflix, Facebook):
  "Break your system on purpose to find weaknesses before they find you."

  Netflix Chaos Monkey: Randomly terminates production instances.
  Goal: Prove the system is resilient enough that killing a node is boring.

  Principles:
  1. Hypothesize about steady state (system behaves normally)
  2. Vary real-world events (network failure, server crash, disk full)
  3. Run experiments in production (or as prod-like as possible)
  4. Minimize blast radius (small experiments first)
```

---

# Quick Reference — DevOps Tool Landscape

| Category          | Tools                                        | When to Use                         |
| ----------------- | -------------------------------------------- | ----------------------------------- |
| **VCS**           | Git, GitHub, GitLab                          | Always — version EVERYTHING         |
| **CI/CD**         | GitHub Actions, Jenkins, GitLab CI, CircleCI | Automate build/test/deploy          |
| **Containers**    | Docker, containerd, Podman                   | Package and run applications        |
| **Orchestration** | Kubernetes, ECS, Nomad                       | Manage containers at scale          |
| **IaC**           | Terraform, Pulumi, CloudFormation            | Define infra as code                |
| **Config Mgmt**   | Ansible, Chef, Puppet                        | Configure servers consistently      |
| **Monitoring**    | Prometheus + Grafana, Datadog, Dynatrace     | Observe systems                     |
| **Logging**       | ELK Stack, Loki, Splunk                      | Search and analyse logs             |
| **Tracing**       | Jaeger, Zipkin, AWS X-Ray                    | Trace requests across microservices |
| **Secrets**       | HashiCorp Vault, AWS Secrets Manager         | Store credentials safely            |
| **Registry**      | Docker Hub, ECR, GCR, GHCR                   | Store container images              |

---

## 🔗 Cross-References

| Topic                         | Related Content                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Advanced DevOps**           | [Terraform, Helm, GitOps, OTel](01_DevOps_Advanced.md) — IaC & observability                                |
| **Networking deep dive**      | [Networking & Security](02_Networking_Security.md) — DNS, TCP, TLS, load balancing, DevSecOps               |
| **Service Mesh & Serverless** | [Cloud Native](03_ServiceMesh_CloudNative.md) — Istio, Lambda, FinOps, Platform Engineering                 |
| **Kubernetes networking**     | [Networking & Security](02_Networking_Security.md) — ClusterIP vs NodePort vs Ingress, NetworkPolicy        |
| **MLOps (ML + DevOps)**       | [MLOps Guide](../21_Python_ML_DL_NLP/13_MLOps_Production.md) — model serving, drift detection, CI/CD for ML |
| **Database in Docker**        | [Transactions ACID](../08_SQL/13_Transactions_ACID.md) — WAL durability with Docker volumes                 |
| **SQL Query tuning**          | [SQL Internals Deep](../08_SQL/49_SQL_Internals_Deep.md) — EXPLAIN ANALYZE, buffer pool, B-Tree indexes     |
| **FastAPI async server**      | [Python Asyncio](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) — event loop, uvloop               |
| **JS Event Loop ≈ nginx**     | [JS V8 Internals](../16_JavaScript/06_JS_Modern_ES6Plus.md) — single-thread I/O model                       |
| **React deployment**          | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) — build → nginx → CDN                   |
| **Distributed patterns**      | [Enterprise Distributed](../10_Enterprise_Systems/09_Distributed_Patterns.md) — Saga, Outbox, CQRS          |
| **Queue (message broker)**    | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — Queue = Kafka/SQS                        |
| **Consistent hashing**        | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — load balancing, DB sharding              |
| **Topological sort (CI/CD)**  | [Algorithms in Production](../03_Algorithms/12_Algorithms_In_Production.md) — build dependency ordering     |
| **CSS CDN deployment**        | [CSS Modern](../18_CSS_Complete/04_CSS_Modern_Architecture.md) — Container Queries, static assets           |
| **SQL injection prevention**  | [SQL Security](../08_SQL/33_SQL_Security_Injection.md) — parameterized queries                              |
