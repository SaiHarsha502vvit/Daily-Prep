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

