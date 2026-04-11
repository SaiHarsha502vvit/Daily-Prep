> **Navigation**: [← Linux](16_Linux_Administration.md) | [Index](00_INDEX.md) | [Next → Kubernetes](18_Kubernetes_Complete.md)

# 🐳 Chapter 17: Docker Complete — Containers From Scratch

> _"A container is NOT a VM. A VM virtualizes hardware. A container virtualizes the OS. That one sentence, deeply understood, is worth more than 100 Docker tutorials."_

---

# PART 1: History — Why Containers Exist

---

```
THE PROBLEM (2000s):
  "Works on my machine" → doesn't work in production.
  Dev: macOS, Python 3.9, OpenSSL 1.1
  Prod: Ubuntu, Python 3.6, OpenSSL 1.0
  → Different libraries, different versions, different behavior, BUGS.
  
  VMs SOLVED THIS (partially):
  Package entire OS + app + dependencies into a VM image.
  But: each VM = separate kernel + full OS = 1-10 GB, boots in 30-60s.
  Running 50 microservices = 50 VMs = 50 kernels = massive overhead!

2013 — DOCKER:
  Solomon Hykes released Docker. Didn't invent containers (Linux had them since 2008).
  Made containers EASY. One command: docker run nginx.
  
  Container = your app + libraries + config, isolated from host, sharing the host kernel.
  Image size: 50-200 MB (vs 1-10 GB VM). Boot time: <1 second (vs 30s VM).

THE CRITICAL DIFFERENCE:
  
  VM:                          Container:
  ┌──────────────┐             ┌──────────────┐
  │ Your App     │             │ Your App     │
  ├──────────────┤             ├──────────────┤
  │ Libraries    │             │ Libraries    │
  ├──────────────┤             ├──────────────┤
  │ Guest OS     │             │              │
  │ (full kernel)│             │ (no kernel!) │
  ├──────────────┤             ├──────────────┤
  │ Hypervisor   │             │ Container    │
  │ (VMware/KVM) │             │ Runtime      │
  ├──────────────┤             ├──────────────┤
  │ Host OS      │             │ Host OS      │
  │ Host Kernel  │             │ Host Kernel  │
  └──────────────┘             └──────────────┘
  
  Container shares the HOST kernel. No guest OS overhead.
  Only isolates: process tree, network, filesystem, users.
```

---

# PART 2: Under The Hood — Namespaces & cgroups

---

```
LINUX GIVES CONTAINERS TWO KERNEL FEATURES:

1. NAMESPACES (Isolation — what the container CAN SEE):
   Each namespace isolates a specific resource type.
   
   PID namespace:     Container sees only ITS processes (PID 1 = your app, not systemd).
   NET namespace:     Container gets its own network stack (own IP, ports, routing).
   MNT namespace:     Container has its own filesystem (can't see host files).
   UTS namespace:     Container has its own hostname.
   IPC namespace:     Isolated inter-process communication (shared memory, semaphores).
   USER namespace:    Container's root (uid 0) maps to unprivileged user on host.
   
   Without namespaces: all processes see each other, share network, share filesystem.
   With namespaces: each container thinks it's the ONLY thing running.

2. CGROUPS (Control Groups — what the container CAN USE):
   Limits CPU, memory, disk I/O, network bandwidth.
   
   cpu.max:        Container gets max 200% CPU (2 cores).
   memory.max:     Container gets max 512MB RAM. Exceeds? → OOM killed!
   pids.max:       Max 100 processes (prevents fork bombs).
   io.max:         Limit disk read/write speed.
   
   Without cgroups: one container could consume ALL CPU/memory → starve others.
   With cgroups: guaranteed resource isolation.

CONTAINER = Namespace isolation + cgroup limits + filesystem image.
That's it. No magic. Just Linux kernel features wrapped nicely by Docker.
```

---

# PART 3: Docker Images — Layers & The Build Cache

---

```
AN IMAGE IS A STACK OF READ-ONLY LAYERS.

Dockerfile:
  FROM ubuntu:22.04         ← Layer 1: base OS (72 MB)
  RUN apt-get install python ← Layer 2: installed packages (+50 MB)
  COPY requirements.txt .    ← Layer 3: copy file (+1 KB)
  RUN pip install -r req.txt ← Layer 4: installed deps (+100 MB)
  COPY . /app                ← Layer 5: your code (+5 MB)
  CMD ["python", "app.py"]   ← Layer 6: metadata (0 bytes, just config)
  
  Total image: ~227 MB. Each layer is cached independently!

LAYER CACHING (CRITICAL FOR CI/CD SPEED):
  Docker caches each layer by its instruction.
  If the instruction AND all inputs haven't changed → reuse cached layer!
  
  BAD order:                   GOOD order:
  COPY . /app                  COPY requirements.txt .
  RUN pip install              RUN pip install -r requirements.txt
                               COPY . /app
  
  BAD: Any code change → COPY . invalidates → pip install reruns (5 min!).
  GOOD: Only requirements.txt change triggers pip install.
       Code change → only last COPY rebuilds (5 seconds!).
```

```dockerfile
# ── PRODUCTION DOCKERFILE (Python, multi-stage) ──

# Stage 1: Build
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies (cached unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production
FROM python:3.12-slim AS production

# Security: run as non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy only installed packages from builder (not build tools!)
COPY --from=builder /install /usr/local

WORKDIR /app
COPY --chown=appuser:appuser . .

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

```
MULTI-STAGE BUILD:
  Builder stage: has compilers, build tools (~800 MB)
  Production stage: only runtime + compiled code (~100 MB)
  → Image is 8x SMALLER. Fewer packages = smaller attack surface.

IMAGE SIZE COMPARISON:
  python:3.12        → 1.0 GB (full OS, compilers, dev tools)
  python:3.12-slim   → 150 MB (trimmed, no compilers)
  python:3.12-alpine → 50 MB (musl libc, very minimal)
  distroless/python  → 30 MB (Google's, no shell, no package manager)
  
  Alpine caveat: uses musl libc instead of glibc.
  Some Python packages (numpy, pandas) may need compilation or fail.
  Use slim for most Python projects. Alpine for Go/Rust (static binaries).
```

---

# PART 4: Docker Networking

---

```
DOCKER NETWORK TYPES:

BRIDGE (default):
  Docker creates a virtual bridge network (docker0).
  Each container gets its own IP on this bridge (172.17.0.x).
  Containers on the same bridge can communicate by IP.
  With docker-compose: containers communicate by SERVICE NAME (DNS!).
  
  docker network create mynet
  docker run --network mynet --name api myapp
  docker run --network mynet --name db postgres
  # api can reach db: psql -h db -p 5432

HOST:
  Container shares the host's network namespace.
  No network isolation! Container uses host's IP and ports.
  Use for: maximum network performance (no NAT overhead).
  
  docker run --network host nginx
  # nginx is directly accessible on host:80 (no port mapping needed)

NONE:
  No networking at all. Complete isolation.
  Use for: batch processing jobs that don't need network.

OVERLAY:
  Multi-host networking. Containers on DIFFERENT Docker hosts can communicate.
  Used by: Docker Swarm. Prerequisite for multi-host orchestration.
  K8s uses its own overlay networks (Flannel, Calico, Cilium) instead.
```

---

# PART 5: Docker Compose — Multi-Container Applications

---

```yaml
# ── docker-compose.yml — Production-Ready Stack ──
version: "3.9"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production           # multi-stage target
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy  # wait for DB health check!
      cache:
        condition: service_started
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"
        reservations:
          memory: 256M
          cpus: "0.5"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass       # Use secrets in production!
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # auto-run on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - api

volumes:
  postgres_data:       # named volume: persists across container restarts
  redis_data:
```

```bash
# ── DOCKER COMMANDS REFERENCE ──

# Build & run
docker compose up -d                     # start all services (detached)
docker compose up -d --build             # rebuild images + start
docker compose down                      # stop + remove containers
docker compose down -v                   # also remove volumes (data!)

# Debugging
docker compose logs -f api               # follow API logs
docker compose exec api bash             # shell into running container
docker compose ps                        # status of all services
docker compose top                       # processes in each container

# Image management
docker images                            # list images
docker image prune -a                    # remove unused images
docker system prune -a --volumes         # nuclear cleanup (reclaim disk!)
docker system df                         # disk usage breakdown

# Container inspection
docker inspect <container>               # JSON with ALL container details
docker stats                             # live CPU/memory/network per container
docker logs --tail 50 <container>        # last 50 log lines
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Linux namespaces/cgroups** | [Ch 16: Linux](16_Linux_Administration.md) — kernel features Docker uses |
| **Container networking** | [Ch 04: Fundamentals](04_Networking_Complete.md) — bridge, overlay |
| **K8s runs containers** | [Ch 18: Kubernetes](18_Kubernetes_Complete.md) — pod = group of containers |
| **CI/CD builds images** | [Ch 19: CI/CD](19_CICD_Pipelines.md) — build + push in pipeline |
| **Terraform deploys** | [Ch 20: Terraform](20_Terraform_IaC.md) — infrastructure for containers |
| **Security scanning** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — Trivy container scanning |
| **PostgreSQL in Docker** | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — volumes for durability |

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


> **Navigation**: [← Linux](16_Linux_Administration.md) | [Index](00_INDEX.md) | [Next → Kubernetes](18_Kubernetes_Complete.md)
