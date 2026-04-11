> **Navigation**: [← Network Debugging](15_Network_Debugging.md) | [Index](00_INDEX.md) | [Next → Docker](17_Docker_Complete.md)

# 🐧 Chapter 16: Linux Administration — The Server Operating System

> _"Every server, container, and cloud instance runs Linux. Every Docker image is built ON Linux. Kubernetes runs ON Linux. Your CI/CD pipelines run ON Linux. If you don't understand Linux deeply, you're building castles on shifting sand."_

---

# PART 1: History & Why Linux Dominates Servers

---

```
1969 — UNIX (Ken Thompson & Dennis Ritchie, Bell Labs):
  Written in C (Ritchie invented C for this purpose!).
  Design philosophy: "Do one thing and do it well."
  Small, composable tools piped together.
  
1991 — LINUX (Linus Torvalds, 21-year-old Finnish student):
  "I'm doing a (free) operating system (just a hobby, won't be big)."
  Now powers: 96.3% of the world's top 1 million web servers,
  100% of the top 500 supercomputers, all Android phones,
  and every major cloud provider (AWS, GCP, Azure).
  
WHY LINUX DOMINATES SERVERS:
  1. FREE and open source (no license costs for thousands of servers).
  2. STABLE: Linux servers run for YEARS without rebooting.
  3. EFFICIENT: no GUI overhead → all resources for your application.
  4. CUSTOMIZABLE: strip the OS to exactly what you need (containers!).
  5. THE ECOSYSTEM: Docker, K8s, nginx, PostgreSQL — all built for Linux first.

DISTRIBUTIONS:
  ┌─────────────┬──────────────────────────────────────────┐
  │ Distro      │ Used For                                 │
  ├─────────────┼──────────────────────────────────────────┤
  │ Ubuntu      │ Most popular for servers/Docker. AWS     |
  |                                                default.│
  │ Debian      │ Ubuntu's parent. Ultra-stable. Minimal.  │
  │ CentOS/Rocky│ RHEL-compatible. Enterprise servers.     │
  │ Alpine      │ 5MB. Used in Docker images (minimal)     │
  │ Amazon Linux│ AWS-optimized. Based on RHEL/Fedora      │
  │ Arch        │ Bleeding-edge. Rolling release. Dev use  │
  └─────────────┴──────────────────────────────────────────┘
```

---

# PART 2: The Filesystem Hierarchy — Where Everything Lives

---

```
/                   ← ROOT of everything
├── /bin             ← Essential binaries (ls, cat, cp, bash)
├── /sbin            ← System binaries (iptables, fdisk, reboot) — root only
├── /usr             ← User programs (most installed software)
│   ├── /usr/bin     ← User binaries (python, node, docker)
│   ├── /usr/lib     ← Libraries for user binaries
│   └── /usr/local   ← Locally compiled/installed software
├── /etc             ← CONFIGURATION files (nginx.conf, sshd_config, fstab)
├── /var             ← VARIABLE data (grows over time)
│   ├── /var/log     ← Log files (syslog, nginx, auth.log)
│   ├── /var/lib     ← Application state (Docker images, databases)
│   └── /var/www     ← Web server document root (by convention)
├── /home            ← User home directories (/home/deploy, /home/admin)
├── /root            ← Root user's home directory
├── /tmp             ← Temporary files (cleared on reboot)
├── /dev             ← Device files (/dev/sda = first disk, /dev/null = black hole)
├── /proc            ← Virtual filesystem: kernel/process info (not real files!)
│   ├── /proc/cpuinfo ← CPU details
│   ├── /proc/meminfo ← Memory details
│   └── /proc/[PID]   ← Per-process info (cmdline, status, fd)
├── /sys             ← Virtual filesystem: hardware/kernel parameters
├── /opt             ← Optional third-party software
└── /mnt, /media     ← Mount points for external filesystems

KEY INSIGHT:
  /proc and /sys are NOT real files on disk.
  They're virtual filesystems: windows into the KERNEL.
  cat /proc/cpuinfo → kernel generates CPU info on the fly.
  echo 1 > /proc/sys/net/ipv4/ip_forward → CHANGES kernel behavior live!
```

---

# PART 3: Users, Groups & Permissions

---

```
LINUX IS MULTI-USER. Every file has an OWNER and PERMISSIONS.

FILE PERMISSIONS:
  ls -la /var/www/index.html
  -rw-r--r-- 1 www-data www-data 4096 Mar 24 10:00 index.html
  
  BREAKDOWN:
  - rw- r-- r--
  │ │   │   │
  │ │   │   └── OTHER (everyone else): read only
  │ │   └────── GROUP (www-data group): read only
  │ └────────── OWNER (www-data user): read + write
  └──────────── FILE TYPE: - = file, d = directory, l = symlink
  
  PERMISSION VALUES:
  r (read)    = 4
  w (write)   = 2
  x (execute) = 1
  
  OCTAL NOTATION:
  rwxr-xr-- = 754
  Owner: 7 (4+2+1 = rwx)
  Group: 5 (4+0+1 = r-x)
  Other: 4 (4+0+0 = r--)

COMMON PERMISSION PATTERNS:
  755 (rwxr-xr-x): Directories, executables. Owner full, others read+execute.
  644 (rw-r--r--): Files. Owner read+write, others read only.
  600 (rw-------): Private files (SSH keys!). Owner only.
  700 (rwx------): Private directories (.ssh/).
  777 (rwxrwxrwx): EVERYONE can do EVERYTHING. NEVER use in production!
  
  SSH KEY FILES MUST BE:
  ~/.ssh/             → 700 (drwx------)
  ~/.ssh/id_ed25519   → 600 (-rw-------)
  ~/.ssh/authorized_keys → 644 (-rw-r--r--)
  If permissions are wrong → SSH REFUSES to use the key!
```

```bash
# ── USER & PERMISSION COMMANDS ──

# Create user
sudo useradd -m -s /bin/bash deploy       # -m: create home dir, -s: default shell
sudo passwd deploy                         # set password

# Add user to group
sudo usermod -aG docker deploy             # add deploy to docker group
sudo usermod -aG sudo deploy               # give sudo privileges

# Change file ownership
sudo chown deploy:deploy /opt/myapp        # change owner and group
sudo chown -R deploy:deploy /opt/myapp/    # recursive

# Change permissions
chmod 755 /opt/myapp/start.sh              # owner: rwx, group/other: rx
chmod 600 ~/.ssh/id_ed25519                # owner only: rw

# Set default permissions for new files
umask 022                                   # new files: 644, new dirs: 755

# SPECIAL PERMISSIONS:
# SUID: run as file OWNER (dangerous!)
chmod u+s /usr/bin/passwd                   # passwd runs as root (needed to modify /etc/shadow)
ls -la /usr/bin/passwd                      # -rwsr-xr-x (note the 's')

# SGID: run as file GROUP / inherit group in directories
chmod g+s /shared/team-dir                  # new files inherit group

# Sticky bit: only owner can delete files in directory
chmod +t /tmp                               # /tmp has sticky bit (drwxrwxrwt)
# Without sticky bit: anyone could delete anyone else's temp files!
```

---

# PART 4: Process Management

---

```
A PROCESS IS A RUNNING PROGRAM.
Every process has:
  PID (Process ID): unique identifier
  PPID (Parent PID): who started this process
  UID: which user owns it
  State: running, sleeping, stopped, zombie
  Priority/nice value: scheduling priority

PROCESS STATES:
  R (Running):   actively using CPU
  S (Sleeping):  waiting for I/O or event (most processes are here!)
  D (Disk sleep): uninterruptible I/O wait (can't be killed — waiting for disk)
  T (Stopped):   suspended (Ctrl+Z)
  Z (Zombie):    finished but parent hasn't collected exit status

PROCESS TREE:
  PID 1 (systemd or init) → parent of ALL processes
    ├── sshd → per-session sshd → bash → your commands
    ├── dockerd → containerd → shim → container processes
    ├── nginx (master) → nginx workers
    └── postgres (postmaster) → per-connection backends
```

```bash
# ── PROCESS COMMANDS ──

# List processes
ps aux                          # all processes with details
ps aux --sort=-%mem | head -20  # top 20 memory consumers
ps aux --sort=-%cpu | head -20  # top 20 CPU consumers
ps -ef --forest                 # tree view of process hierarchy

# Real-time monitoring
top                             # classic process monitor
htop                            # modern, colorful, interactive
# In htop: F5 = tree view, F6 = sort, F9 = kill, F4 = filter

# Find process by name
pgrep -a nginx                  # PID + command line for "nginx" processes
pidof nginx                     # just PIDs

# Find what's using a port
lsof -i :8080                   # process on port 8080
ss -tlnp | grep 8080            # same, different tool

# ── SIGNALS (how to communicate with processes) ──
kill -15 12345                  # SIGTERM (15): graceful shutdown (default)
kill -9 12345                   # SIGKILL (9): force kill (CANNOT be caught!)
kill -1 12345                   # SIGHUP (1): reload configuration
killall nginx                   # kill all nginx processes
pkill -f "python app.py"       # kill by command pattern

# WHEN TO USE EACH:
# SIGTERM (15): ALWAYS try this first. App can clean up gracefully.
# SIGKILL (9):  ONLY when SIGTERM fails. No cleanup. May corrupt data!
# SIGHUP (1):   nginx, PostgreSQL → reload config without downtime.
#               kill -HUP $(cat /var/run/nginx.pid) → nginx reloads config

# ── BACKGROUND PROCESSES ──
./long_task.sh &                # run in background
nohup ./server.sh &             # run in background, survive logout
disown %1                       # detach job 1 from current shell
jobs                            # list background jobs

# ── RESOURCE LIMITS ──
ulimit -a                       # show all limits
ulimit -n 65535                 # max open files (important for web servers!)
ulimit -u 4096                  # max user processes

# Permanent limits: /etc/security/limits.conf
# deploy  soft  nofile  65535
# deploy  hard  nofile  65535
```

---

# PART 5: systemd — The Service Manager

---

```
SYSTEMD IS THE INIT SYSTEM FOR MODERN LINUX.
It manages ALL services (daemons): start, stop, restart, enable at boot.

UNIT FILE ANATOMY (/etc/systemd/system/myapp.service):
```

```ini
[Unit]
Description=My Application Server
Documentation=https://docs.myapp.com
After=network.target postgresql.service    # start AFTER network + database
Requires=postgresql.service                # FAIL if postgres isn't running
Wants=redis.service                        # nice-to-have (don't fail without it)

[Service]
Type=notify                                # app notifies systemd when ready
User=deploy                               # run as 'deploy' user (NOT root!)
Group=deploy
WorkingDirectory=/opt/myapp
ExecStartPre=/opt/myapp/bin/migrate        # run migrations BEFORE starting
ExecStart=/opt/myapp/bin/server --port 8080
ExecReload=/bin/kill -HUP $MAINPID         # how to reload config
Restart=on-failure                         # restart if crashes
RestartSec=5                               # wait 5s before restart
TimeoutStartSec=30                         # fail if not started in 30s
TimeoutStopSec=10                          # force kill if not stopped in 10s

# Resource limits
LimitNOFILE=65535                          # max open files
MemoryMax=2G                               # kill if uses > 2GB RAM (cgroup limit)
CPUQuota=200%                              # max 2 CPU cores

# Security hardening
NoNewPrivileges=true                       # can't gain new privileges (setuid)
ProtectSystem=strict                       # read-only filesystem (except /var, /run)
ProtectHome=true                           # no access to /home
PrivateTmp=true                            # isolated /tmp

# Environment
EnvironmentFile=/opt/myapp/.env            # load env vars from file
Environment=NODE_ENV=production

# Logging
StandardOutput=journal                     # stdout → journald
StandardError=journal                      # stderr → journald
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target                 # enable at normal boot
```

```bash
# ── SYSTEMD COMMANDS ──

# Service lifecycle
sudo systemctl start myapp        # start now
sudo systemctl stop myapp         # stop now
sudo systemctl restart myapp      # stop + start
sudo systemctl reload myapp       # reload config (no downtime, sends SIGHUP)
sudo systemctl status myapp       # current status + recent logs

# Boot management
sudo systemctl enable myapp       # start on boot
sudo systemctl disable myapp      # don't start on boot
sudo systemctl is-enabled myapp   # check if enabled

# After editing unit file
sudo systemctl daemon-reload      # reload unit files

# View logs
journalctl -u myapp               # all logs for myapp
journalctl -u myapp -f            # follow (tail) live logs
journalctl -u myapp --since "1 hour ago"
journalctl -u myapp --since "2024-03-24 10:00"
journalctl -u myapp -p err        # only errors
journalctl -u myapp -o json       # JSON format (for log aggregation)

# List all services
systemctl list-units --type=service
systemctl list-units --type=service --state=failed  # FAILED services only

# System targets (runlevels)
systemctl get-default              # current default target
# graphical.target = GUI, multi-user.target = headless server
```

---

# PART 6: Disk & Storage Management

---

```bash
# ── DISK COMMANDS ──

# View disk usage
df -h                             # filesystem usage (-h = human readable)
# /dev/sda1  100G   45G  55G  45% /
# If ANY filesystem is >90% → ALERT. >95% → services will fail.

du -sh /var/log                   # directory size
du -sh /var/log/* | sort -rh | head -10  # top 10 largest dirs in /var/log

# Find large files
find / -type f -size +100M -exec ls -lh {} \;  # files > 100MB
ncdu /var                         # interactive disk analyzer (install: apt install ncdu)

# ── MOUNT POINTS ──
lsblk                            # list all block devices (disks, partitions)
# sda          250G disk
# ├─sda1        1G  /boot
# ├─sda2      200G  /
# └─sda3       49G  swap
# sdb          500G disk       (unattached disk — EBS volume?)
# └─sdb1      500G  

# Mount a disk
sudo mkdir /mnt/data
sudo mount /dev/sdb1 /mnt/data
# Permanent: add to /etc/fstab
# /dev/sdb1  /mnt/data  ext4  defaults  0  2

# ── LOG ROTATION ──
# /etc/logrotate.d/myapp:
# /var/log/myapp/*.log {
#     daily
#     rotate 14              # keep 14 days
#     compress               # gzip old logs
#     delaycompress          # don't compress yesterday's
#     missingok              # don't error if log missing
#     notifempty             # don't rotate empty logs
#     copytruncate           # truncate original (no restart needed)
# }
```

---

# PART 7: Shell Scripting Essentials

---

```bash
#!/bin/bash
# ── PRODUCTION DEPLOYMENT SCRIPT ──

set -euo pipefail   # THE MOST IMPORTANT LINE IN ANY BASH SCRIPT
# -e: exit immediately on ANY error
# -u: treat unset variables as errors (no silent bugs!)
# -o pipefail: pipe fails if ANY command in the pipe fails

# Configuration
APP_DIR="/opt/myapp"
BACKUP_DIR="/opt/backups"
DEPLOY_USER="deploy"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

# Check prerequisites
[[ $EUID -eq 0 ]] && error "Don't run as root!"
command -v docker &>/dev/null || error "Docker not installed!"

# Backup current version
log "Backing up current version..."
cp -r "$APP_DIR" "$BACKUP_DIR/app_${TIMESTAMP}" || warn "Backup failed"

# Pull new version
log "Pulling latest code..."
cd "$APP_DIR"
git pull origin main || error "Git pull failed"

# Build
log "Building..."
docker compose build --parallel || error "Build failed"

# Health check before switching
log "Running health check on new version..."
docker compose up -d --no-deps app-new
sleep 5

if curl -sf http://localhost:8081/health > /dev/null; then
    log "Health check passed ✓"
else
    error "Health check FAILED. Rolling back..."
    docker compose down app-new
    exit 1
fi

# Deploy
log "Deploying..."
docker compose down app
docker compose up -d app
sleep 3

# Verify deployment
if curl -sf http://localhost:8080/health > /dev/null; then
    log "Deployment successful! ✓"
    # Clean old backups (keep last 5)
    ls -dt "$BACKUP_DIR"/app_* | tail -n +6 | xargs rm -rf
else
    error "Post-deploy health check FAILED!"
    # Automatic rollback
    log "Rolling back to previous version..."
    cp -r "$BACKUP_DIR/app_${TIMESTAMP}" "$APP_DIR"
    docker compose up -d
fi
```

---

# PART 8: Performance Monitoring & Troubleshooting

---

```bash
# ── SYSTEM MONITORING ──

# CPU
top                               # real-time process monitor
mpstat -P ALL 1                   # per-CPU utilization every 1 second
uptime                            # load average (1, 5, 15 min)
# Load average: number of processes waiting for CPU.
# If load > number of CPU cores → CPU is the bottleneck.
# 4-core machine: load 4.0 = fully utilized. Load 8.0 = severe overload.

# MEMORY
free -h                           # total/used/free/cached memory
# "available" is what matters (free + buffers/cache that can be freed).
# If available < 10% of total → danger zone!

vmstat 1                          # virtual memory stats every 1s
# si/so (swap in/out): if > 0 → system is SWAPPING → severely slow!
# Swapping means: RAM is full → OS uses disk as slow RAM → 1000x slower.

# DISK I/O
iostat -xz 1                     # disk I/O stats every 1s
# %util > 80% → disk is saturated → I/O bottleneck
# await > 10ms for SSD → possible disk problem

iotop                            # top for disk I/O (which process is reading/writing)

# NETWORK
iftop                            # top for network (bandwidth per connection)
nethogs                          # bandwidth per PROCESS
ss -s                            # socket statistics summary

# ── THE "USE METHOD" (Brendan Gregg) ──
# For EVERY resource: check Utilization, Saturation, Errors.
# CPU:    Utilization (top), Saturation (load average), Errors (dmesg)
# Memory: Utilization (free), Saturation (swap), Errors (OOM killer in dmesg)
# Disk:   Utilization (iostat %util), Saturation (await), Errors (dmesg, SMART)
# Network:Utilization (iftop), Saturation (drops, overruns), Errors (ifconfig errors)

# ── OOM KILLER ──
# When Linux COMPLETELY runs out of memory:
# The kernel's OOM (Out of Memory) killer picks a process and KILLS it.
# Check: dmesg | grep -i "killed process"
# Prevention: set memory limits in systemd (MemoryMax=2G)
#             or in K8s (resources.limits.memory)
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Docker (runs ON Linux)** | [Ch 17: Docker](17_Docker_Complete.md) — cgroups, namespaces |
| **K8s nodes** | [Ch 18: Kubernetes](18_Kubernetes_Complete.md) — kubelet on Linux |
| **SSH** | [Ch 14: SSH](14_SSH_Remote_Access.md) — remote Linux access |
| **iptables (firewall)** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — Linux firewall |
| **TCP kernel tuning** | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — sysctl parameters |
| **Filesystem (containers)** | [Ch 17: Docker](17_Docker_Complete.md) — overlay2, layers |
| **Process isolation** | [Ch 17: Docker](17_Docker_Complete.md) — namespaces, cgroups |

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


> **Navigation**: [← Network Debugging](15_Network_Debugging.md) | [Index](00_INDEX.md) | [Next → Docker](17_Docker_Complete.md)
