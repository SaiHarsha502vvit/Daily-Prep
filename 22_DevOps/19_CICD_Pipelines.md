> **Navigation**: [← Kubernetes](18_Kubernetes_Complete.md) | [Index](00_INDEX.md) | [Next → Terraform](20_Terraform_IaC.md)

# 🔄 Chapter 19: CI/CD Pipelines — From Code to Production Automatically

> _"The difference between a hobby project and a production system: the hobby project you deploy by SSHing in and running git pull. The production system deploys itself, tests itself, and rolls itself back if something goes wrong — all without human intervention."_

---

# PART 1: CI vs CD vs CD — The Three Practices

---

```
CI (CONTINUOUS INTEGRATION):
  Every code push → automated build + test.
  Developers merge to main multiple times per day.
  Tests catch bugs IMMEDIATELY (not 2 weeks later during QA).
  
  THE GOAL: broken code never lives in main for more than minutes.
  
  WHAT RUNS:
  1. Code compilation / build
  2. Unit tests
  3. Integration tests
  4. Static analysis (linting, type checking)
  5. Security scanning (dependency vulnerabilities)
  6. Code coverage reporting

CD (CONTINUOUS DELIVERY):
  EVERY commit to main is AUTOMATICALLY deployed to staging.
  Deployment to production requires a MANUAL approval (button click).
  "Always deployable" — main branch is always in a releasable state.

CD (CONTINUOUS DEPLOYMENT):
  Everything in Delivery but ALSO automatically deploys to production.
  No human approval needed (if all tests pass → production!).
  Requires: very high test confidence, feature flags, observability.
  
  COMPANY EXAMPLES:
  Amazon: deploys to production every 11.7 seconds.
  Netflix: deploys hundreds of times per day.
  GitHub: continuous deployment with feature flags.
```

---

# PART 2: GitHub Actions — Complete Reference

---

```yaml
# ── .github/workflows/ci-cd.yml — Production Pipeline ──
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:          # manual trigger from GitHub UI

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

# Cancel in-progress runs for the same branch (save CI minutes!)
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── STAGE 1: LINT & TYPE CHECK (fast feedback) ──
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-python@v5
      with:
        python-version: "3.12"
        cache: pip
    
    - name: Install dependencies
      run: pip install ruff mypy
    
    - name: Lint
      run: ruff check .
    
    - name: Type check
      run: mypy src/ --strict

  # ── STAGE 2: TEST (parallel matrix) ──
  test:
    runs-on: ubuntu-latest
    needs: lint                # only run if lint passes
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]
    
    services:                  # spin up test dependencies as containers!
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports: ["6379:6379"]
    
    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}
        cache: pip
    
    - name: Install dependencies
      run: pip install -r requirements.txt -r requirements-test.txt
    
    - name: Run tests with coverage
      run: pytest --cov=src --cov-report=xml -v
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage
      uses: codecov/codecov-action@v4
      with:
        file: coverage.xml

  # ── STAGE 3: SECURITY SCAN ──
  security:
    runs-on: ubuntu-latest
    needs: lint
    steps:
    - uses: actions/checkout@v4
    
    - name: Dependency vulnerability scan
      run: pip-audit -r requirements.txt
    
    - name: SAST (Semgrep)
      uses: semgrep/semgrep-action@v1
      with:
        config: p/python p/owasp-top-ten

  # ── STAGE 4: BUILD & PUSH DOCKER IMAGE ──
  build:
    runs-on: ubuntu-latest
    needs: [test, security]    # only after tests AND security pass
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v4
    
    - uses: docker/setup-buildx-action@v3
    
    - uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Scan image for vulnerabilities
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        severity: CRITICAL,HIGH

  # ── STAGE 5: DEPLOY TO STAGING ──
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    environment: staging       # GitHub environment (protection rules)
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to staging
      run: |
        kubectl set image deployment/my-api \
          api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          -n staging
        kubectl rollout status deployment/my-api -n staging --timeout=300s

  # ── STAGE 6: DEPLOY TO PRODUCTION (manual approval) ──
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production    # requires approval from designated reviewers!
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        kubectl set image deployment/my-api \
          api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          -n production
        kubectl rollout status deployment/my-api -n production --timeout=300s
    
    - name: Verify deployment
      run: |
        sleep 30
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.myapp.com/health)
        if [ "$STATUS" != "200" ]; then
          echo "Health check failed! Rolling back..."
          kubectl rollout undo deployment/my-api -n production
          exit 1
        fi
```

---

# PART 3: Deployment Strategies

---

```
1. ROLLING UPDATE (K8s default):
   Replace pods one by one. Old and new versions run SIMULTANEOUSLY.
   Zero downtime. maxSurge=1, maxUnavailable=0.
   Risk: both v1 and v2 handle traffic → must be compatible.

2. BLUE/GREEN:
   Two identical environments. Blue = current, Green = new.
   Deploy to Green → test → switch traffic from Blue to Green.
   Instant rollback: switch back to Blue.
   Cost: need 2x resources during deployment.
   
   Implementation: two K8s Deployments, switch Service selector.

3. CANARY:
   Route 5% of traffic to new version. Monitor error rate.
   If OK → increase to 25% → 50% → 100%.
   If errors → roll back immediately (only 5% of users affected!).
   
   Implementation: two Deployments with different weights in Ingress/Istio.
   OR: use ArgoCD Rollouts with automatic analysis.

4. FEATURE FLAGS (safest):
   Deploy new code to 100% of servers — but HIDDEN behind a flag.
   Enable flag for 1% of users → monitor → increase gradually.
   
   Benefits:
   - Decouple deployment from release.
   - Kill switch: disable feature instantly without redeploy.
   - A/B testing: show feature to test group, measure impact.
   
   Tools: LaunchDarkly, Unleash (open source), Flagsmith.

5. A/B TESTING (requires traffic splitting):
   50% of users see version A, 50% see version B.
   Measure: conversion rate, performance, user satisfaction.
   Choose the winner. Only for UI/UX experiments, not backend changes.
```

---

# PART 4: CI Platform Comparison

---

```
┌─────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│ Feature             │ GitHub Actions       │ GitLab CI            │ Jenkins              │
├─────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ Config file         │ .github/workflows/*  │ .gitlab-ci.yml       │ Jenkinsfile (Groovy) │
│ Runner hosting      │ GitHub-hosted or     │ GitLab-hosted or     │ Self-hosted (always) │
│                     │ self-hosted          │ self-hosted          │                      │
│ Docker support      │ Service containers   │ Services + DinD      │ Docker plugin        │
│ Built-in registry   │ GHCR (free)          │ Built-in registry    │ None (use external)  │
│ Secrets management  │ Repository/Org secrets│ CI/CD Variables     │ Credentials plugin   │
│ Approval gates      │ Environments         │ Manual jobs          │ Input step           │
│ Caching             │ actions/cache        │ Built-in cache       │ Plugins              │
│ Matrix builds       │ ✅ Native            │ ✅ parallel/matrix  │ Plugin (matrix-project)│
│ Pricing             │ Free (2000 min/month)│ Free (400 min/month) │ Free (self-hosted)   │
│ Learning curve      │ Low                  │ Low                  │ High (Groovy, plugins)│
└─────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘

WHEN TO USE:
  GitHub Actions: if your code is on GitHub. Best ecosystem of reusable actions.
  GitLab CI: if you self-host GitLab. Tightest integration with GitLab features.
  Jenkins: if you need extreme customization, complex pipelines, or legacy.
  
  TREND: Jenkins is declining. GitHub Actions and GitLab CI rising rapidly.
```

---

# PART 5: Database Migrations in CI/CD

---

```
THE HARDEST PART: database migrations.
Code deploys are reversible (rollback to old image).
Database migrations are NOT (you can't un-delete a column!).

EXPAND-CONTRACT PATTERN (zero-downtime schema changes):
  Want to: rename column "name" to "full_name".
  
  WRONG (breaks old code):
    ALTER TABLE users RENAME COLUMN name TO full_name;  -- old code explodes!
  
  RIGHT (3-step):
  Step 1 (expand): ADD column full_name, write to BOTH columns.
    ALTER TABLE users ADD COLUMN full_name TEXT;
    -- Deploy code that writes to BOTH name AND full_name.
    
  Step 2 (migrate): switch reads to new column.
    -- Deploy code that reads from full_name. Still writes both.
    
  Step 3 (contract): drop old column.
    ALTER TABLE users DROP COLUMN name;
    -- Deploy code that only uses full_name.
  
  Each step is a SEPARATE deployment. Each is independently safe.

MIGRATION RUN ORDER:
  ALWAYS run migrations BEFORE deploying new code.
  Pipeline: migrate → deploy → verify → cleanup (later, separate PR).
```

---

# PART 6: Pipeline Optimization

---

```
SLOW PIPELINE = slow feedback = developer frustration = bugs merge to main.
GOAL: < 10 minutes for CI. < 20 minutes for full CI/CD.

TECHNIQUES:
  1. CACHE: pip/npm packages, Docker layers → saves 60-120 seconds.
  2. PARALLELIZE: lint + test + security run simultaneously.
  3. FAIL FAST: lint first (10s). Skip tests if lint fails.
  4. MATRIX: Python 3.10, 3.11, 3.12 on 3 runners simultaneously.
  5. INCREMENTAL: monorepo tools (Nx, Turborepo) — only build what changed.
  6. DOCKER LAYER CACHE: cache-from: type=gha → saves 3-5 min per build.
  7. SELF-HOSTED RUNNERS: your hardware, no queue → 2-5x faster.
  8. TEST SPLITTING: split tests across runners (pytest-split, RSpec).
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Docker builds images** | [Ch 17: Docker](17_Docker_Complete.md) — Dockerfile, multi-stage |
| **K8s receives deployments** | [Ch 18: K8s](18_Kubernetes_Complete.md) — rollout, HPA |
| **Terraform in pipeline** | [Ch 20: Terraform](20_Terraform_IaC.md) — plan in PR, apply on merge |
| **GitOps (ArgoCD)** | [Ch 23: GitOps](23_GitOps_Deployments.md) — Git-driven deployment |
| **Monitoring (verify)** | [Ch 21: Observability](21_Monitoring_Observability.md) — post-deploy metrics |
| **Security scanning** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — OWASP, SAST/DAST |
| **SQL migrations** | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — expand-contract |
| **SRE (deploy velocity)** | [Ch 22: SRE](22_SRE_Practices.md) — error budgets gate deploys |

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


> **Navigation**: [← Kubernetes](18_Kubernetes_Complete.md) | [Index](00_INDEX.md) | [Next → Terraform](20_Terraform_IaC.md)
