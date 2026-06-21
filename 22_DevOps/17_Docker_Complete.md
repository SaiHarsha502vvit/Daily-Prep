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
      target: production # multi-stage target
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy # wait for DB health check!
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
      POSTGRES_PASSWORD: pass # Use secrets in production!
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql # auto-run on first start
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
  postgres_data: # named volume: persists across container restarts
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

# PART 6: Multi-Stage Builds — Ship Less, Attack Less

---

```
THE PROBLEM MULTI-STAGE BUILDS SOLVE:

When you build a Go application, what does the Docker image ACTUALLY need?
  - The Go compiler (go binary, ~300 MB)
  - All header files and build tools
  - Your source code
  - Intermediate build artifacts (.o files, cached modules)

But once the binary is built, NONE of that is needed at runtime.
A compiled Go binary is self-contained — no interpreter, no dynamic libs.

If you use a single-stage Dockerfile:
  FROM golang:1.21
  WORKDIR /app
  COPY . .
  RUN go build -o myapp .
  CMD ["./myapp"]

Result: ~800 MB image with compilers, build tools, and source code inside.
An attacker who compromises this container has access to ALL of it.

MULTI-STAGE BUILDS SOLVE THIS:

  Stage 1 (builder):   Has Go compiler + source → produces binary
  Stage 2 (final):     Has ONLY the binary → tiny, hardened image

  FROM golang:1.21 AS builder
  WORKDIR /app
  COPY . .
  RUN go build -ldflags='-w -s' -o myapp .   # -w -s strips debug info

  FROM alpine:3.19  # 5 MB base
  COPY --from=builder /app/myapp /myapp
  CMD ["/myapp"]

Result: ~8 MB image. Only the binary. No compiler. No shell. No build tools.
```

## Why This Matters — The Size and Security Trade-offs

```
IMAGE SIZE COMPARISON — Go Application:

  golang:1.21 (single-stage)    →  800 MB
  golang:1.21 (builder) + alpine →   8 MB
  golang:1.21 (builder) + scratch →  6 MB

  → 100x smaller. Same running application.

Why does this matter beyond disk space?

1. FASTER PULLS IN CI/CD:
   Pulling an 800 MB image on every build → 2-5 minutes per pipeline run.
   Pulling an 8 MB image → 3-5 seconds.
   At 50 builds/day, that's 2+ hours of daily CI waste eliminated.

2. SMALLER ATTACK SURFACE:
   Every binary in the image is a potential CVE entry point.
   An 800 MB Ubuntu image has ~500 packages → hundreds of known CVEs.
   An 8 MB Alpine image has ~30 packages → fewer CVEs, easier patching.
   The binary-only image has exactly 1 file → trivially auditable.

3. CHEAPER STORAGE (at scale):
   ECR/GCR/ACR charges per GB/month.
   10,000 images × 800 MB = 8 TB = ~$720/month in storage.
   10,000 images × 8 MB   = 80 GB  = ~$7/month in storage.
```

## BuildKit Advanced Features — Caching, SSH, and Parallelism

```
DOCKER BUILDKIT (enabled by default in Docker Desktop, opt-in on Linux):

  DOCKER_BUILDKIT=1 docker build .

Why BuildKit?
  - Parallel stage execution (independent stages run simultaneously)
  - Improved caching (invalidates fewer layers on code changes)
  - Better handling of symlinks and special files

KEY BUILDKIT MOUNTS:

  --mount=type=cache,target=/root/.cache/go-build
    Persists the Go module cache between builds.
    First build: downloads everything.
    Subsequent builds: reuse cache → 30-90% faster.
    Cache lives on HOST, not inside the image → not shipped to registry.

  --mount=type=ssh
    Forward SSH agent into the build container.
    Useful for: cloning private repos during `go get` or `pip install`.

  --mount=type=secret,id=npm_token
    Exposes a secret file (e.g., NPM token) during build, hidden from image.

  # Example: Go build with module cache and SSH
  docker build \
    --ssh default \
    --mount=type=cache,target=/root/.cache/go-build \
    -t myapp .

PARALLEL STAGE EXECUTION:
  If you have two stages that don't depend on each other:
    FROM golang:1.21 AS builder
    FROM node:20 AS assets
  BuildKit runs them in parallel, reducing total build time.
```

## Real-World Multi-Stage Patterns

```dockerfile
# ── Go Application (binary-only) ──
FROM golang:1.21-alpine AS builder
WORKDIR /app
# Copy go mod first (exploits layer caching)
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags='-w -s' \
    -o /myapp .

FROM scratch
COPY --from=builder /myapp /myapp
# Copy CA certs for HTTPS (alpine has them; scratch has nothing)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
ENTRYPOINT ["/myapp"]
# Final image: ~6-8 MB

# ── Node.js Application (production deps only) ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production   # skip devDependencies

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build              # e.g., Next.js build, webpack, etc.

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
# Final image: only production deps + built artifacts (no source, no dev tools)
```

---

# PART 7: Docker Networking Deep-Dive — Why Each Network Type Exists

---

```
NETWORKING PHILOSOPHY IN DOCKER:

Every network type solves a specific problem. If you understand WHY each exists,
you'll know which to use instead of blindly following examples.

The key question: "Who should this container be able to talk to, and from where?"
```

## The Bridge Network — Isolation Within a Host

```
WHY BRIDGE EXISTS:
  Before Docker, all processes on a Linux host shared the same network stack.
  Container A could bind to port 80 and Container B couldn't.
  Container A could sniff traffic from Container B.

  Bridge networking solves: "How do I let containers talk to each other
  while keeping them isolated from the host and external networks?"

HOW IT WORKS:
  Docker creates a virtual ethernet bridge (docker0, usually 172.17.0.x).
  Each container gets a veth pair: one end in the container, one on the bridge.
  Container traffic goes: container → veth → bridge → iptables → host interface.

  NAT (Network Address Translation) is involved for outbound traffic.
  The host rewrites source IPs so containers appear to come from the host.

PRACTICAL EXAMPLES:

  # Create a custom bridge network
  docker network create --driver bridge mynet

  # Containers in same bridge can communicate by NAME (Docker DNS!)
  docker run --network mynet --name api -d myapi
  docker run --network mynet --name db -d postgres
  # API connects to: postgresql://db:5432 (Docker's embedded DNS resolves 'db')

  # Containers NOT in same network: completely isolated from each other

THE PROBLEM WITH DEFAULT BRIDGE (docker0):
  Before Docker 1.9, you could only communicate by IP, not by name.
  User-defined bridges added DNS-based service discovery.
  Always create user-defined bridges — avoid the default docker0 bridge.
```

## Host Network — Maximum Performance, No Isolation

```
WHY HOST NETWORK EXISTS:
  Bridge networking adds NAT overhead. Every outbound packet is rewritten.
  For latency-sensitive applications, this matters:
    Bridge: container → veth → bridge → iptables → host NIC → wire
    Host:   container → host NIC → wire

  The question host network answers: "How do I get container networking
  with ZERO performance overhead?"

WHEN TO USE IT:
  - High-frequency trading systems where microseconds matter
  - Network monitoring tools that need to see raw host traffic
  - System daemons that MUST bind to host ports (no port conflict possible)

WHEN NOT TO USE:
  - ANY multi-container application (can't have two containers on port 80)
  - Environments where isolation matters (shared hosts, CI runners)
  - If you need to run multiple replicas (port conflicts guaranteed)

EXAMPLE:
  docker run --network host nginx
  # nginx is directly on host's port 80 — no -p mapping needed
  # BUT: if you try to run a second container on port 80, it fails

WARNING: --network host means the container's root user IS the host's root user.
  No network namespace isolation = no network-level privilege separation.
  The container can bind to privileged ports (< 1024) as root.
```

## None and Overlay Networks — Extremes of the Spectrum

```
NONE NETWORK — "Air-Gapped Containers":

  WHY: Some workloads have NO business being on a network.
    - Batch ETL jobs that read from a volume, process, write to a volume
    - Security-sensitive workloads (crypto key generation, no network exposure)
    - Short-lived jobs where network is unnecessary overhead

  docker run --network none python3 script.py
  # Container has loopback only (lo interface). No external access.
  # Useful for: data processing pipelines where input/output is volume-based.

OVERLAY NETWORK — "Containers Across Hosts Talk to Each Other":

  WHY: Single-host Docker is fine for dev, but production needs multiple hosts.
    If you have 3 servers running 50 containers, how do containers on Host A
    talk to containers on Host B?

  Overlay network creates a virtual network spanning all hosts.
  Each container gets an IP on this overlay (not the physical network).

  Under the hood: Docker uses VXLAN (Virtual Extensible LAN).
    Encapsulates container traffic in UDP packets, routes across physical hosts.
    Containers think they're on the same switch — even when they're not.

  # Docker Swarm automatically creates an overlay network for services
  docker network create --driver overlay myoverlay
  docker service create --network myoverlay myservice

  Kubernetes uses its own overlay (Flannel, Calico, Cilium) — not Docker's overlay.
  But understanding Docker overlay makes K8s networking much clearer.
```

## Macvlan — When a Container Needs Its Own MAC Address

```
WHY MACVLAN EXISTS:
  Sometimes you want a container to be a FIRST-CLASS CITIZEN on the physical network.
  Not behind NAT. Not on a virtual bridge. On the actual network, with its own IP.

  Use cases:
    - Legacy applications that refuse to work with NAT (some Java apps, SAP)
    - DHCP-dependent applications (DHCP servers assign IPs by MAC address)
    - Network monitoring tools that need to appear as real hardware

  HOW: Macvlan creates a virtual interface with a new MAC address.
  The container binds to a physical host interface. Traffic goes directly to wire.

  docker network create --driver macvlan \
    --subnet=192.168.1.0/24 \
    --gateway=192.168.1.1 \
    -o parent=eth0 mymacvlan

  docker run --network mymacvlan --ip=192.168.1.50 myapp
  # Container appears on the physical network with MAC 02:42:c0:a8:01:32
  # DHCP can assign it an IP. Switch sees it as a real device.

  TRADE-OFF: Macvlan traffic bypasses the Docker bridge entirely.
    Container can't communicate with the Docker host on the same interface.
    (Host has eth0, container has veth on eth0's macvlan — different MACs collide.)
    Workaround: use a dedicated parent interface or 802.1q VLAN tagging.
```

## Port Publishing — EXPOSE vs -p (Document vs Open)

```
THE CONFUSION: EXPOSE and -p do different things.

EXPOSE (in Dockerfile):
  - Pure documentation. "This container EXPECTS to receive traffic on port 80."
  - Does NOT open any firewall holes. Has zero runtime effect unless documented.
  - Useful for: other developers reading the Dockerfile understand the app's contract.

  EXPOSE 80 443   # "I speak HTTP and HTTPS"

-p (at runtime):
  - Actually opens the port. Maps host port → container port.
  - Tells Docker to configure iptables to allow traffic through.

  -p 8080:80       # host:8080 → container:80
  -p 80            # host:80 → container:80 (host port defaults to container port)
  -p 0.0.0.0:8080:80  # specific interface only (security: don't expose to all interfaces!)

BEST PRACTICE:
  Always use -p explicitly at runtime.
  Use EXPOSE in Dockerfile as documentation.

  For security: prefer -p 127.0.0.1:8080:80 on a public host.
    Container is accessible from localhost only.
    External traffic must go through nginx/load balancer first.

  docker run -p 127.0.0.1:8080:80 -p 127.0.0.1:5432:5432 myapp
  # DB port only accessible from the host itself — not from other containers!
```

---

# PART 8: Container Security — Non-Root Users and Distroless Images

---

```
THE FUNDAMENTAL RISK: Docker Runs as Root by Default

Let's be precise about what this means.

When you run `docker run ubuntu`, the process inside the container runs as UID 0 (root).
But that root is NAMESPACE-MAPPED to an unprivileged UID on the host.
  Container root (UID 0 inside) → Host UID 165536 (example).
  The container's root CAN'T write to host files because it maps to a non-root UID.

So you're safe, right? NOT EXACTLY.

Three attack vectors that make root-inside-container dangerous:

1. CONTAINER ESCAPE via kernel exploit:
   If a kernel exploit lets an attacker break OUT of the container namespace,
   they land as the host UID (165536) — still unprivileged.
   BUT: many exploits also escalate to root on the host.
   If the container runs as actual root (UID 0 on host), escape = instant root on host.

2. ACCESS TO DOCKER SOCKET:
   If a container gets the Docker socket (/var/run/docker.sock), it can:
   - Spin up new containers (as root on host)
   - Mount host filesystems read-write
   - Escape to host in one API call

3. CAPABILITIES AND SECCOMP:
   Docker grants some capabilities by default (CAP_SYS_ADMIN, etc.).
   A container with CAP_SYS_ADMIN can mount filesystems, potentially escaping.
   The Linux kernel's attack surface is exposed — more packages = more CVEs.
```

## The USER Directive — Running as Non-Root

```
SOLUTION 1: Explicitly run as a non-root user.

  # In Dockerfile:
  RUN groupadd -r appuser && useradd -r -g appuser appuser
  WORKDIR /app
  COPY --chown=appuser:appuser . .
  USER appuser

  CMD ["python", "app.py"]

What this actually does:
  - Switches the running process from UID 0 to UID 165537 (or similar)
  - The container process can no longer bind to privileged ports (< 1024)
  - If container escapes, attacker lands as a non-root host UID → limited damage

TRADE-OFFS:
  - Can't install packages as root (do it before USER directive)
  - Can't bind to port 80 (use a reverse proxy or setcap)
  - Some apps need root for initial setup (handle in entrypoint script)

  # Entrypoint pattern: setup as root, drop privileges before app starts
  COPY entrypoint.sh /
  RUN chmod +x /entrypoint.sh
  ENTRYPOINT ["/entrypoint.sh"]
  CMD ["python", "app.py"]

  # entrypoint.sh:
  #!/bin/sh
  setup_permissions
  exec gosu appuser "$@"   # run the CMD as non-root
```

## Distroless Images — Why Google's Distroless and Chainguard Exist

```
THE PROBLEM WITH UBUNTU/DEBIAN-BASED IMAGES:

An ubuntu:22.04 image has ~450 packages installed by default:
  - bash, sh, ash (shells)
  - apt, dpkg (package managers)
  - curl, wget, nc, netcat (networking tools)
  - vi, nano, less (editors)
  - Python, Perl, awk (interpreters)

Each of these is a CVE opportunity.
  - Shell injection vulnerabilities
  - Buffer overflows in network tools
  - Privilege escalation in setuid binaries

If an attacker gets shell access, they can:
  - Download and run arbitrary code (curl/wget)
  - Install backdoors (apt install malicious-package)
  - Use shells to pivot to other systems

DISTROLESS IMAGES:

Google's distroless images (gcr.io/distroless/*) contain:
  - Your application
  - CA certificates (for HTTPS)
  - Timezone data
  - The language runtime (Python, Node, Go)

They do NOT contain:
  - Any shell (/bin/sh, /bin/bash — GONE)
  - Any package manager (apt, yum, apk — GONE)
  - Any debugging tools (curl, wget, nc — GONE)
  - Any compilers or build tools

RESULT:
  node:18          →  350 MB, shells + package manager + 100+ binaries
  distroless/nodejs18-debian11 → 50 MB, only Node.js runtime + certs

If an attacker compromises a distroless container:
  - No shell to run commands → must exploit the application directly
  - No curl/wget to download tools → limited lateral movement
  - No package manager to install malware → confined to what exists
```

## Real CVE Examples — Why Slimming Images Directly Reduces Risk

```
LOG4SHELL (CVE-2021-44228, December 2021):

  Affects: Apache Log4j (Java logging library)
  Severity: CVSS 10.0 (maximum)
  What it allowed: Remote code execution via a single crafted string

  Why distroless matters here:
    A container running: openjdk:17-slim
    If log4j is in the app → vulnerable to remote code execution.

    But: openjdk:17-slim has ~80 packages. A Java exploit works.
    An attacker who exploits it CAN use the shell to:
      - Download a cryptocurrency miner (curl/wget exist!)
      - Scan the internal network (nc/nmap exist!)
      - Install a backdoor (apt install exists!)

    With gcr.io/distroless/java:17:
      - Same Java app, same log4j vulnerability
      - BUT: attacker gets RCE inside container with no shell
      - They CAN'T download tools, run pivoting scans, or install malware
      - The blast radius is dramatically reduced

IMAGE SIZE / CVE CORRELATION:

  ubuntu:22.04              → 77 MB compressed  → 1,200+ known CVEs
  ubuntu:22.04-slim         → 30 MB compressed  → 200+ known CVEs
  alpine:3.19               → 3.5 MB compressed → 50+ known CVEs
  distroless/static-debian12 → 2 MB compressed  → 2-5 known CVEs (base layer only)

  Every unnecessary package is a potential CVE.
  Fewer packages = smaller attack surface = fewer CVEs that apply to you.

CHAINGUARD IMAGES (The Next Level):

  Chainguard (a Kubernetes security company) takes this further:
    - Every package is explicitly pinned and auditable
    - Images are rebuilt daily as packages update
    - SBOMs (Software Bill of Materials) are provided
    - Fully signed with Sigstore (transparency log)

  cgr.dev/chainguard/node → ~5 MB, built from source, SBOM included
```

## Security Best Practices — The Practical Checklist

```
1. NEVER run containers as root (USER directive in every Dockerfile)
   Even a non-root container limits blast radius on escape.

2. Use distroless or scratch images for compiled-language apps (Go, Rust, C)
   Use alpine for interpreted languages (Python, Node) when distroless isn't available.
   Avoid ubuntu/debian base images unless you need their tooling.

3. Drop ALL capabilities you don't need:
   docker run --cap-drop=ALL --privileged=false myapp
   Docker grants CAP_NET_BIND_SERVICE by default — drop it if not needed.

4. Read-only root filesystem:
   docker run --read-only myapp
   Container can't write anywhere except tmpfs or volumes.
   Forces you to use named volumes for state — good design.

5. No new privileges:
   docker run --security-opt=no-new-privileges myapp
   Prevents setuid binaries from escalating privileges inside the container.

6. Scan images in CI/CD:
   Trivy, Snyk, Grype — fail builds on HIGH/CRITICAL CVEs.
   docker scout cves myimage  # Docker's native scanner

7. Pin base image versions:
   FROM node:20.11.1-alpine3.19   # Pin exact version, not :20 or :latest
   Unpinned :latest can silently bring in breaking changes.
```

---

🔬 **Section Challenge — Multi-Stage Builds**

> Your Dockerfile uses `FROM ubuntu:22.04` and `RUN apt-get install -y python3`. The final image is 450 MB. You want to reduce this to the minimum necessary.
>
> **Q1:** What is the *minimum* package you need in the **final stage** if you're shipping a Python web application? Walk through the dependency chain — Python itself, then the runtime libraries, then your app code.
>
> **Q2:** If you switch to a multi-stage build with `python:3.12-slim` as the builder and `python:3.12-slim` as the final stage, roughly how small would the image get? What about using `python:3.12-alpine` instead — and what is the critical caveat?
>
> **Q3:** You want to go further and use `scratch` as your final stage for a Python app. Why is this NOT straightforward, and what would you need to add that a compiled Go binary would NOT require?
>
<details>
<summary>Answer</summary>

**A1:** In the final stage, you only need:
- `python3` (the interpreter) and `python3-venv` (for virtualenvs)
- Your installed packages from `pip install` (the `.so` extension modules)
- Your application code

You do NOT need: compilers (`gcc`), `python3-dev` (headers), `git` (used only for `pip install git+...`), `curl`/`wget` (used only for downloading packages). Each of these is 10-50 MB and adds CVE surface.

**A2:**
- `python:3.12-slim` final stage: ~150 MB (stripped Debian, no compilers)
- `python:3.12-alpine` final stage: ~50 MB (musl libc, very minimal Alpine)
- The caveat: Alpine uses **musl libc** instead of glibc. Some Python packages with C extensions (numpy, pandas, lxml, Pillow) are compiled against glibc and may fail or behave differently on Alpine. Always test your specific dependencies on Alpine before committing to it.

**A3:** `scratch` is an empty image — literally nothing. You can't run a Python interpreter from `scratch` because there is no Python binary. Python is an interpreted language — it needs a runtime binary (`python3`) to execute your code. Unlike Go (which produces a static ELF binary that the kernel can run directly), Python requires `python3` as an external dependency. The only way to use `scratch` with Python is to compile Python statically into a single binary (possible but exotic) or use a tool like `PyInstaller`/`cx_Freeze` that bundles Python + your code into a standalone executable — and even then, you'd still need the shared C library.

</details>

---

🔬 **Section Challenge — Container Security and Privilege Escalation**

> A containerized web application is running as root inside the container. Through a vulnerability in the application, an attacker achieves remote code execution (RCE) and gains a shell running as UID 0 inside the container.
>
> **Q1:** The attacker tries to mount the host filesystem: `mount -t proc none /proc` inside the container. Does this succeed? What does it actually mount, and why?
>
> **Q2:** A kernel exploit (CVE-2022-0847 / "Dirty Pipe") is used to escape the container namespace and gain root on the host. Given that the container was running as the mapped root user (not actual host root), how much does the `USER` directive mitigate this scenario? What does it NOT protect against?
>
> **Q3:** Name **at least three** mitigations beyond `USER` that reduce the impact of a successful container compromise. For each, explain what specific threat it addresses.
>
<details>
<summary>Answer</summary>

**A1:** No — it mounts a new `proc` filesystem into the container's `/proc`, but this is the container's own proc (PID namespace), not the host's. Because the container has its own PID namespace, `/proc` shows only container processes. Even if you mount `--privileged`, you still can't see host PIDs from within the container namespace. This is a fundamental property of namespaces: you can't escape into host namespace views through mount tricks alone.

**A2:** The `USER` directive (switching to non-root) helps in the following way:
- Container root (UID 0 inside) maps to host UID 165536 (unprivileged) by default
- If the kernel exploit gives root INSIDE the container, it still maps to an unprivileged UID on the host
- BUT: kernel exploits often ALSO escalate privileges within the host namespace, potentially escaping the mapping entirely
- If the container was already running as non-root (`USER appuser`), the attacker's starting point is lower-privileged

What `USER` does NOT protect against: capabilities granted to the container (e.g., `CAP_SYS_ADMIN`), the Docker socket being mounted, or kernel exploits that directly manipulate cgroup/namespace state. It protects against the "accidental root" scenario but not against sophisticated privilege escalation exploits.

**A3:**
1. **Read-only root filesystem (`--read-only`)**: Prevents writing to disk. If attacker gets RCE, they can't write malware to `/tmp` or modify binaries. Forces you to use named volumes for state — good design discipline.

2. **`--cap-drop=ALL`**: Removes all Linux capabilities from the container. By default, Docker grants some capabilities (e.g., `CAP_NET_BIND_SERVICE`, `CAP_DAC_OVERRIDE`). Dropping all of them means even root inside the container can't perform privileged operations like mounting filesystems or loading kernel modules.

3. **`--security-opt=no-new-privileges`**: Prevents setuid binaries (like `sudo`) from gaining elevated privileges inside the container. Even if an attacker uploads a setuid binary, it can't escalate.

4. **Distroless images**: Removing shells (no `/bin/sh`) means an attacker with RCE can't easily run arbitrary commands — they'd need to exploit the application directly. This dramatically limits lateral movement even if RCE is achieved.

5. **Seccomp profile (`--security-opt seccomp=profile.json`)**: Restricts which syscalls the container can make. Docker's default seccomp blocks ~44 syscalls including `mount`, but you can customize further to block `ptrace`, `perf_event_open`, etc.

</details>

---

## 🔗 Cross-References

| Topic                        | Related Content                                                               |
| ---------------------------- | ----------------------------------------------------------------------------- |
| **Linux namespaces/cgroups** | [Ch 16: Linux](16_Linux_Administration.md) — kernel features Docker uses      |
| **Container networking**     | [Ch 04: Fundamentals](04_Networking_Complete.md) — bridge, overlay            |
| **K8s runs containers**      | [Ch 18: Kubernetes](18_Kubernetes_Complete.md) — pod = group of containers    |
| **CI/CD builds images**      | [Ch 19: CI/CD](19_CICD_Pipelines.md) — build + push in pipeline               |
| **Terraform deploys**        | [Ch 20: Terraform](20_Terraform_IaC.md) — infrastructure for containers       |
| **Security scanning**        | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — Trivy container scanning |
| **PostgreSQL in Docker**     | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — volumes for durability  |
