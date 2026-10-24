# 🐳 Docker & Containers — Complete Guide

**Navigation**: [< Linux CLI](02_Linux_CLI_Shell.md) | [Index](00_INDEX.md) | [Next: CI/CD >](04_CICD_Pipelines.md)

---

# WHY: Why Containers Exist

## The Problem

```
Developer: "It works on MY machine!"
Ops Team:  "Well, it DOESN'T work on the server."

WHY? Because your machine has:
  - Java 17, but server has Java 11
  - MySQL 8.0, but server has 5.7
  - Ubuntu 22, but server has CentOS 7
  - 50 environment variables you forgot to document

The SAME code behaves differently in different environments.
This is the #1 cause of deployment failures in the industry.
```

## The Solution: Containers

```
Container = Your application + ALL its dependencies
            packaged into ONE portable unit

┌──────────────────────────────┐
│         Container            │
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Your │ │ Java │ │MySQL │  │
│  │ App  │ │  17  │ │ 8.0  │  │
│  └──────┘ └──────┘ └──────┘  │
│  ┌──────────────────────────┐│
│  │    Ubuntu 22.04 (base)   ││
│  └──────────────────────────┘│
└──────────────────────────────┘

This container runs IDENTICALLY on:
  ✅ Your laptop
  ✅ Your colleague's Mac
  ✅ Testing server
  ✅ Production AWS EC2
  ✅ Kubernetes cluster
```

🔬 **Section Challenge — The Solution: Containers**

**Challenge 1 (Reasoning):** The diagram shows a container includes Ubuntu 22.04 as the base. But the host machine is also running Linux. If containers share the host kernel, why do you need a base OS image at all?

<details><summary>Answer</summary>

The base image doesn't provide a kernel — it provides the **userspace**: system libraries (glibc, libssl), package managers (apt, yum), shell utilities (bash, ls, cat), and filesystem layout (/etc, /usr, /var). Your application links against specific versions of these libraries at compile time. If your app was compiled against Ubuntu 22.04's glibc 2.35 but the host has Alpine's musl-libc, it will crash with missing symbol errors. The base image guarantees the correct userspace environment regardless of the host. This is why `alpine` images are so small (~5MB) — they use musl-libc and BusyBox instead of full GNU coreutils, but some applications aren't compatible with musl.

</details>

## Container vs Virtual Machine

```
┌─── VM ────────────────────┐    ┌─── Container ─────────────┐
│ App A    App B    App C   │    │ App A    App B    App C   │
│ Bins/Libs Bins/Libs B/L   │    │ Bins/Libs Bins/Libs B/L   │
│ Guest OS  Guest OS  G.OS  │    │                           │
│ (Ubuntu)  (CentOS) (Deb)  │    │      Docker Engine        │
│                           │    │                           │
│      Hypervisor           │    │      Host OS (Linux)      │
│      Host OS              │    │      Hardware             │
│      Hardware             │    └───────────────────────────┘
└────────────────────────────────────────────────────────────┘

VM:        Heavy (GB), 30s startup, full OS per app
Container: Light (MB), 1s startup, shared OS kernel

Analogy:
  VM = Separate HOUSES (each has foundation, walls, roof)
  Container = APARTMENTS (shared building, private units)
```

🔬 **Section Challenge — Container vs Virtual Machine**

**Challenge 1 (Reasoning):** The diagram shows containers are "lighter" than VMs. But a container running a compromised application shares the host kernel. If an attacker escapes the container (kernel exploit), they own the entire host and ALL other containers. How do VMs prevent this, and what are "gVisor" and "Kata Containers"?

<details><summary>Answer</summary>

VMs have **hardware-level isolation**: each VM runs its own kernel on virtualized hardware (CPU ring separation via VT-x). A kernel exploit in VM1 only compromises VM1's kernel — the hypervisor is a separate security boundary. Container isolation relies on **software-only** mechanisms (namespaces, cgroups, seccomp) enforced by the SHARED host kernel. **gVisor** (Google) adds a user-space kernel that intercepts syscalls — the container never touches the real kernel, but at ~30% performance overhead. **Kata Containers** run each container inside a lightweight VM (micro-VM), getting VM-level isolation with near-container performance. Production rule: use gVisor/Kata for untrusted workloads (multi-tenant SaaS), standard containers for trusted internal services.

</details>

## WHO: Origin Story

**2013: Solomon Hykes at dotCloud** built Docker as an internal tool, open-sourced it, and revolutionized deployment.

Based on: Linux cgroups + namespaces (existed since 2008)
Docker's genius = Made containers EASY to use

---

🔬 **Section Challenge — WHO: Origin**

**Challenge 1 (Reasoning):** Docker is built on Linux namespaces (2002) and cgroups (2008). If these kernel features existed for years before Docker (2013), why didn't containers become mainstream until Docker? What was Docker's actual innovation?

<details><summary>Answer</summary>

Pre-Docker container tools (LXC, OpenVZ) existed but required deep Linux sysadmin knowledge — manually configuring cgroups, writing namespace syscall wrappers, building rootfs from scratch. Docker's innovations were: (1) **The Dockerfile** — a declarative, reproducible build format anyone could read. (2) **Docker Hub** — a public registry of pre-built images (like npm/Maven for OS environments). (3) **Layered image format** — only transfer the diff, not the entire OS. (4) **Simple CLI** — `docker run nginx` vs. paragraphs of LXC config. Docker didn't invent containerization — it made it **accessible**. The same way Git didn't invent version control, but made it practical for everyone.

</details>

# WHAT: Core Concepts

## Images vs Containers

```
IMAGE = Blueprint/Template (read-only)
  - Like a Java CLASS
  - Defines what the container will contain
  - Stored in registries (Docker Hub)

CONTAINER = Running instance of an image
  - Like a Java OBJECT
  - Created from an image
  - Has its own state, network, filesystem

One image → Many containers:
  Image: my-spring-app:1.0
    → Container 1 (port 8080)
    → Container 2 (port 8081)
    → Container 3 (port 8082)
```

🔬 **Section Challenge — Images vs Containers**

**Challenge 1 (Reasoning):** The text says "One image → Many containers." If 10 containers run from the same image, do they share the image's filesystem or does each get a copy? What happens when Container 3 writes a file?

<details><summary>Answer</summary>

All 10 containers share the SAME read-only image layers (they are mounted read-only). Each container gets its own thin **writable layer** on top (Copy-on-Write). When Container 3 writes a file, the storage driver (OverlayFS) copies that specific file from the read-only layer into Container 3's writable layer, then modifies the copy. The other 9 containers are unaffected — they still see the original file. This means 10 containers from a 500MB image use ~500MB + (10 × ~5MB writable layers) = ~550MB total, NOT 5GB. When a container is deleted, only its writable layer is removed — the shared image layers remain. This is why `docker commit` captures a container's writable layer as a new image layer.

</details>

## Layers (How Images are Efficient)

```
Dockerfile:                    Image Layers:
FROM ubuntu:22.04      →  ┌─────────────────┐ Layer 1: Ubuntu (shared!)
RUN apt install java   →  ├─────────────────┤ Layer 2: Java
COPY app.jar /app/     →  ├─────────────────┤ Layer 3: Your JAR
CMD ["java","-jar"]    →  └─────────────────┘

Key insight: Layers are CACHED and SHARED
  - 10 apps using Java 17? → Java layer downloaded ONCE
  - Change only your code? → Only Layer 3 rebuilds
```

---

# HOW: Docker in Practice

## Installation

```bash

# Windows: Install Docker Desktop
# Mac: Install Docker Desktop
# Linux:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

🔬 **Section Challenge — Installation**

**Challenge 1 (Reasoning):** After installing Docker on Linux, you must run `sudo usermod -aG docker $USER` and then log out/in. Why can't you just use `sudo docker run` instead? What security risk does adding your user to the `docker` group create?

<details><summary>Answer</summary>

The Docker daemon runs as **root** and exposes a Unix socket (`/var/run/docker.sock`). Anyone with access to this socket effectively has root access to the host — they can mount the host filesystem (`docker run -v /:/host`), access the host network, and escalate privileges. Adding your user to the `docker` group grants **unsupervised root-equivalent access** without needing `sudo` (no password prompt, no audit log). Using `sudo docker` is actually MORE secure because it logs the command and requires authentication. In production, use **rootless Docker** (`dockerd-rootless`) which runs the daemon as an unprivileged user, or use Podman (daemonless, rootless by default).

</details>

## Level 1: Running Containers (Day 1)

```bash
# Run your first container
docker run hello-world

# Run interactive Ubuntu
docker run -it ubuntu bash
# You're now INSIDE an Ubuntu container!
# Try: ls, cat /etc/os-release, exit

# Run Nginx web server
docker run -d -p 8080:80 nginx
# -d = detached (background)
# -p 8080:80 = map host port 8080 → container port 80
# Visit http://localhost:8080 → you'll see Nginx!

# Run MySQL
docker run -d \
  --name my-mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -p 3306:3306 \
  mysql:8.0

# Container management
docker ps                  # List RUNNING containers
docker ps -a               # List ALL containers (including stopped)
docker stop <name/id>      # Stop container
docker rm <name/id>        # Remove container
docker logs <name/id>      # View container logs
docker logs -f <name/id>   # Follow logs (real-time)
docker exec -it <name> bash  # Get shell INSIDE running container
```

## Level 2: Building Your Own Image (Week 1)

### Dockerfile for Spring Boot Application

```dockerfile
# === Dockerfile ===

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:resolve         # Cache dependencies
COPY src/ ./src/
RUN mvn package -DskipTests

# Stage 2: Run (smaller image)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Non-root user (security best practice)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Building and Running

```bash
# Build the image
docker build -t my-spring-app:1.0 .

# Run it
docker run -d -p 8080:8080 --name myapp my-spring-app:1.0

# Test it
curl http://localhost:8080/api/health
```

### Dockerfile Best Practices

```dockerfile
# BAD: Everything in one layer
FROM ubuntu
RUN apt update && apt install java && apt install maven
COPY . /app
RUN mvn package

# GOOD: Optimized layers, multi-stage, minimal base
FROM eclipse-temurin:17-jre-alpine   # Small base (200MB vs 1GB)
COPY --from=build app.jar /app/      # Only the artifact

# GOOD: .dockerignore (like .gitignore)
# .dockerignore:
.git
target
*.md
.idea
```

## Level 3: Docker Compose (Week 2)

### WHY Compose?

```
Typical app needs:
  - Spring Boot API (port 8080)
  - PostgreSQL database (port 5432)
  - Redis cache (port 6379)
  - Nginx reverse proxy (port 80)

Without Compose: 4 separate docker run commands with 20+ flags
With Compose: ONE yaml file, ONE command
```

### docker-compose.yml Example

```yaml
version: "3.8"

services:
  # Spring Boot Application
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/myapp
      - SPRING_DATASOURCE_USERNAME=admin
      - SPRING_DATASOURCE_PASSWORD=secret
      - SPRING_REDIS_HOST=cache
    depends_on:
      - db
      - cache
    restart: unless-stopped

  # PostgreSQL Database
  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data # Persistent storage!

  # Redis Cache
  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:
  pgdata: # Named volume for database persistence
```

### Compose Commands

```bash
docker-compose up -d              # Start everything
docker-compose down               # Stop everything
docker-compose logs -f app        # Follow app logs
docker-compose ps                 # Status of all services
docker-compose exec app bash      # Shell into app container
docker-compose build              # Rebuild images
docker-compose up -d --build      # Rebuild and restart
```

## Level 4: Volumes & Networking (Month 1)

### Volumes (Persistent Data)

```bash
# Problem: Container dies → ALL data inside dies too
# Solution: Volumes mount external storage into containers

# Named volume (Docker manages location)
docker run -v mydata:/var/lib/mysql mysql:8

# Bind mount (your specific folder)
docker run -v $(pwd)/config:/app/config my-app

# In docker-compose:
volumes:
  - pgdata:/var/lib/postgresql/data     # Named volume
  - ./config:/app/config                # Bind mount
  - ./logs:/app/logs                    # Logs accessible from host
```

### Networking

```
Docker creates internal networks:
  app ←──────→ db       ← communicate by SERVICE NAME
  app ←──────→ cache    ← no need for IP addresses!

  nginx ←────→ internet ← only nginx exposed to outside

This is WHY your Spring Boot connects to "db:5432"
instead of "localhost:5432" inside Docker
```

---

# WHERE: Real-World Docker Usage

## Local Development Environment

```yaml
# docker-compose.dev.yml
# New developer joins → runs ONE command → entire stack works

services:
  app:
    build: .
    volumes:
      - ./src:/app/src # Hot reload! Edit code → changes instantly
    ports:
      - "8080:8080"
      - "5005:5005" # Debug port
    environment:
      - SPRING_PROFILES_ACTIVE=dev
```

## Production Deployment

```bash
# Build → Tag → Push → Pull → Run

# On CI/CD server:
docker build -t mycompany/myapp:v2.1.0 .
docker push mycompany/myapp:v2.1.0

# On production server:
docker pull mycompany/myapp:v2.1.0
docker run -d --name myapp mycompany/myapp:v2.1.0
```

---

# WHEN: Decision Guide

```
USE Docker when:
  ✅ Multiple services need to work together
  ✅ "Works on my machine" problems
  ✅ Need consistent dev/test/prod environments
  ✅ Microservices architecture
  ✅ Deploying to cloud

DON'T use Docker when:
  ❌ Simple single-file scripts
  ❌ Learning basic programming (unnecessary complexity)
  ❌ Performance-critical apps needing bare-metal speed
```

---

### Historical Evolution

**Container technology has evolved from kernel primitives (2002) to a universal deployment unit (2015+):**

- **2002** — Linux kernel namespace support merged, introducing the first isolation primitives for processes (PID, mount, network, UTS, IPC namespaces). Namespaces are the foundation that all container runtimes build on.
- **2007** — Linux cgroups (control groups) merged into the mainline kernel (2.6.24). Cgroups provided resource metering and hard limiting (CPU, memory, I/O) for process groups — enabling containers to have guaranteed resource allocations, not just isolation.
- **2008** — LXC (Linux Containers) released, combining cgroups and namespaces into a userspace tool. LXC was the first production-ready container system, but it required significant sysadmin knowledge to configure and operate.
- **2013** — Solomon Hykes at dotCloud open-sourced Docker at PyCon US (March 2013). Docker's innovations: the Dockerfile declarative build format, Docker Hub image registry, and layered image storage — making containers accessible to every developer.
- **2015** — OCI (Open Container Initiative) founded by Docker, CoreOS, and others under the Linux Foundation. OCI published the Container Runtime Specification (runtime-spec) and Image Specification (image-spec), ensuring that container images built with Docker would be portable to any OCI-compliant runtime.
- **2015** — Kubernetes 1.0 released. Built on Docker as its default container runtime, Kubernetes extended containers from a developer convenience to the universal deployment unit for production cloud infrastructure.

**Key references:**
- Solomon Hykes (dotCloud) — Docker open-source (2013, PyCon US) — Docker's layered image model, Dockerfile syntax, and Docker Hub registry made containerization a mainstream developer practice. The Dockerfile became the universal build artifact for cloud-native applications.
- Linux Kernel Community — cgroups (merged 2.6.24, 2007) + namespaces (2002) — The kernel primitives that Docker, LXC, and all container runtimes ultimately depend on; cgroups enforce resource limits, namespaces enforce isolation.
- OCI (Docker + CoreOS + Linux Foundation) — Open Container Initiative specifications (2015) — The portability standard ensuring that container images built with Docker, Podman, or containerd are interchangeable across runtimes and cloud providers.
- Google — Kubernetes (2015, based on Borg/Omega internal systems) — Kubernetes elevated containers from a developer tool to the standard unit of orchestration for cloud-native production deployments.

**Why this matters for Docker:** Docker did not invent containerization — it made it accessible. Understanding the kernel primitives (cgroups 2007, namespaces 2002) explains WHY containers work: resource metering and isolation are built into the Linux kernel, Docker just exposed them through a developer-friendly CLI. The OCI standard (2015) explains WHY your Docker image runs identically on Kubernetes, local Docker Desktop, and GitHub Actions.

---

# 🧭 Docker Cheat Sheet

```
IMAGES:      build | pull | push | images | rmi
CONTAINERS:  run | start | stop | rm | ps | logs | exec
COMPOSE:     up | down | logs | ps | build | exec
VOLUMES:     volume create | volume ls | volume rm
NETWORK:     network create | network ls | network inspect
CLEANUP:     system prune | image prune | container prune
```

---

# 🏋️ Practice Exercises

## Exercise 1: Run & Explore

```
1. Run an nginx container with port mapping
2. Run a MySQL container with environment variables
3. Use docker exec to get inside the MySQL container
4. Run a SQL query from inside the container
```

## Exercise 2: Build Custom Image

```
1. Create a simple Spring Boot app (or any Java app)
2. Write a Dockerfile with multi-stage build
3. Build and run it
4. Push to Docker Hub
```

🔬 **Section Challenge — Exercise 2: Build Custom Image**

**Challenge 1 (Reasoning):** The multi-stage Dockerfile uses `eclipse-temurin:17-jre-alpine` (JRE) for the run stage, not `eclipse-temurin:17-jdk-alpine` (JDK). The build stage uses the full Maven+JDK image. Why is this separation critical for production, and what specific tools in the JDK become security liabilities in production?

<details><summary>Answer</summary>

The JDK includes: `javac` (compiler), `jdb` (debugger), `jcmd`/`jmap`/`jstack` (diagnostic tools), `jar` (packager), and the entire `tools.jar`. In production, none of these are needed — your app runs from a pre-compiled JAR. But if an attacker gains shell access to the container, these tools become weapons: `jmap` can dump heap memory (containing passwords, tokens, PII), `jdb` can attach to the JVM and modify running code, `javac` can compile malicious code on the spot. The JRE image also drops ~200MB of unnecessary files, reducing: (1) image size (faster pulls, less storage), (2) attack surface (fewer binaries = fewer CVE vectors), (3) startup time. **Alpine** further reduces the base from ~300MB (Debian) to ~5MB by using musl-libc and BusyBox. The multi-stage pattern: build with everything you need, deploy with only what you need.

</details>

## Exercise 3: Compose Full Stack

```
1. Create docker-compose.yml with:
   - Spring Boot app
   - PostgreSQL
   - Adminer (DB web UI)
2. Connect app to PostgreSQL
3. Verify data persistence after container restart
```

🔬 **Section Challenge — Exercise 3: Compose Full Stack**

**Challenge 1 (Reasoning):** In the multi-stage Dockerfile, `COPY pom.xml .` and `RUN mvn dependency:resolve` appear BEFORE `COPY src/ ./src/`. Why does this specific ordering matter, and what happens to build times if you reverse them?

<details>
<summary>Answer</summary>

Docker builds images **layer by layer**, and each layer is **cached**. If a layer's input hasn't changed, Docker reuses the cached result instead of re-executing it. Dependencies (`pom.xml`) change rarely — maybe once a week when you add a new library. Source code (`src/`) changes on every commit. By copying `pom.xml` FIRST and resolving dependencies, Docker creates a cached layer containing all downloaded JARs (~200-500MB). On subsequent builds where only `src/` changed, Docker skips the dependency download entirely (cache hit on layers 1-2) and only rebuilds from `COPY src/` onward. **If reversed** (`COPY . .` then `RUN mvn dependency:resolve`), ANY change to ANY file (even a one-line code fix) invalidates the COPY layer, which invalidates ALL subsequent layers — forcing a full `mvn dependency:resolve` on every build. This turns a 10-second rebuild into a 3-5 minute rebuild. **The general rule:** In Dockerfiles, order instructions from **least frequently changing to most frequently changing**. This is called **layer cache optimization** and is the single most impactful Docker performance technique.

</details>

📎 **Reference Anchor:** [moby/buildkit](https://github.com/moby/buildkit)

**Invariant learned:** Layer invalidation cascades downward — modifying a file in layer N invalidates all subsequent layers, requiring rebuild from N+1.

**Local rewrite:** Use BuildKit's `RUN --mount=type=cache,target=/root/.maven` to mount dependency caches outside the layer cache, so they don't trigger layer invalidation when source code changes.

**Constraint warning:** BuildKit's `--mount=type=cache` syntax requires BuildKit-enabled Docker (Docker 23.0+ or BuildKit standalone). On older Docker versions, the syntax fails silently and dependencies are cached in the layer as before.

---

### Trade-off: Container Runtime Variants

| Aspect              | Docker           | Podman            | containerd        | CRI-O             |
|---------------------|------------------|-------------------|-------------------|-------------------|
| Architecture        | daemon-based     | daemonless        | daemon-based      | daemon-based      |
| Root required       | yes              | rootless option   | yes               | yes               |
| Compose support     | native           | podman-compose    | no (use nerdctl)  | no                |
| Systemd integration | weak             | strong (quadlets) | medium            | strong            |
| Kubernetes fit      | poor             | poor              | excellent (CRI)   | excellent (CRI)   |
| Year introduced     | 2013             | 2018 (Red Hat)    | 2015 (Docker)     | 2016 (Red Hat)    |
| License             | Apache 2 (CE)    | Apache 2          | Apache 2          | Apache 2          |
| Best for            | local dev, CI    | rootless prod     | K8s container rt  | OpenShift K8s     |

**Selection rule:** Docker for developer experience and CI; containerd for production Kubernetes nodes; Podman for rootless security-sensitive deployments; CRI-O for OpenShift-specific environments.


---

## Reality Check

**"Containers are lightweight VMs"** — Containers are PROCESSES with scoped views: namespaces partition what the process can see (its own PID tree, network stack, filesystem mounts), cgroups cap what it can consume, and the host kernel is SHARED — no guest OS, no hypervisor, which is why startup is milliseconds and density is high, and also why kernel-version-dependent behavior leaks through (the container that behaves differently on two hosts) and why container isolation is a weaker security boundary than a VM's (the reason multi-tenant platforms still wrap containers in microVMs). The process model predicts everything the VM model gets wrong: one main process per container, death of PID 1 is death of the container, and "SSH into the container" is a smell rather than a workflow.

**"Images are built from the Dockerfile top to bottom, so order is style"** — Order is CACHE ECONOMICS: each instruction is a layer, a changed layer invalidates every layer after it, so the canonical mistake — copy-everything before install-dependencies — rebuilds the entire dependency tree on every source edit, while the canonical fix (copy manifests, install, THEN copy source) makes rebuilds seconds. The adjacent mechanics people meet the hard way: deleted files in later layers still ship in earlier ones (size AND secrets — the credential added then removed is still in the image history), multi-stage builds are the real size lever (build tools stay in the builder stage), and BuildKit cache mounts fix the package-manager cache that layers otherwise discard.

**"Data in containers persists until you remove the container"** — The writable layer is DISPOSABLE BY DESIGN — the correctness model is: containers are cattle, state lives in declared mounts (named volumes for engine-managed data, bind mounts for dev-time source sync), and anything not mounted is presumed lost at any moment (the database in the writable layer that vanished with the recreate — the classic first-month incident). The dev-versus-prod split matters too: bind mounts bring host-filesystem semantics (permission mismatches, the uid-mapping dance on Linux), while named volumes stay engine-native — and the compose file that works on one machine and not another usually differs exactly there.

**"Networking between containers just works with the right ports"** — EXPOSE is documentation; the real model is networks-as-DNS-scopes: containers on the same user-defined network reach each other by SERVICE NAME (the compose default — the app connecting to a hostname that equals the service key), publish maps host ports to container ports for OUTSIDE traffic only (container-to-container traffic neither needs nor sees it), and localhost inside a container is the CONTAINER (the connect-to-host mistake — host-gateway aliases exist for the genuine cases). The debugging sequence that resolves most "cannot connect" tickets: same network? using the service name? is the target actually listening on the container interface rather than its own localhost?

**"If it works in the container locally, it works in production"** — The image pins the filesystem, not the CONTRACT with the environment: resource limits differ (the JVM/Node that read host memory and OOM under production cgroup caps — container-aware runtime flags exist for this), the init story differs (PID 1 signal handling — the container that ignores graceful shutdown because the shell-form CMD swallowed SIGTERM; exec-form and tini are the fixes), users differ (root locally, restricted or arbitrary UID on hardened platforms — the write-permission crash on first prod deploy), and read-only filesystems, seccomp profiles, and missing metadata services complete the list. "Same image everywhere" is the promise; "same constraints everywhere" is the part you must engineer.
