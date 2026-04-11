> **Navigation**: [← Cloud VPC](13_Cloud_Networking_VPC.md) | [Index](00_INDEX.md) | [Next → Debugging](15_Network_Debugging.md)

# 🔑 Chapter 14: SSH & Remote Access — Connecting to Machines Securely

> _"SSH replaced Telnet (which sent passwords in plaintext!) and became the universal standard for secure remote access. Every server you'll ever manage — cloud, on-prem, container — you'll access via SSH."_

---

# PART 1: SSH Architecture

---

```
SSH (Secure Shell) — RFC 4251-4254 (2006), originated 1995 (Tatu Ylönen).

WHAT SSH PROVIDES:
  1. Encrypted remote shell (command line access)
  2. Encrypted file transfer (SCP, SFTP)
  3. Port forwarding / tunneling (access internal services securely)
  4. Authentication (password or key-based)
  
SSH USES TCP PORT 22 (by default).

AUTHENTICATION METHODS (in order of preference):

1. PUBLIC KEY (best — passwordless, most secure):
   Your machine has private key (~/.ssh/id_ed25519).
   Server has your public key (~/.ssh/authorized_keys).
   
   Handshake: server sends challenge → your SSH client signs with private key →
   server verifies with public key → authenticated!
   
   NO PASSWORD crosses the network. Private key NEVER leaves your machine.

2. PASSWORD:
   Encrypted by SSH tunnel. But: vulnerable to brute force.
   DISABLE password auth on production servers!
   
3. CERTIFICATE-BASED (enterprise):
   SSH CA signs your public key → certificate has expiry and permissions.
   Server trusts the CA → automatically trusts any cert signed by it.
   Used by: large organizations, HashiCorp Vault SSH.

KEY TYPES:
  RSA (ssh-rsa):      Most compatible. 4096-bit recommended. Legacy.
  ECDSA (ecdsa):      Elliptic curve. 256-bit = RSA 3072-bit security. Faster.
  Ed25519 (ed25519):  Daniel Bernstein's curve. 256-bit. FASTEST. RECOMMENDED.
                      Small keys, fast verification, high security.
  
  ALWAYS USE ed25519 for new keys.
```

```bash
# ── SSH KEY MANAGEMENT ──

# Generate an Ed25519 key pair (recommended)
ssh-keygen -t ed25519 -C "your_email@example.com"
# Prompts: file location (~/.ssh/id_ed25519) + passphrase (PROTECT YOUR KEY!)
# Creates: id_ed25519 (PRIVATE — NEVER share!) + id_ed25519.pub (public — copy to servers)

# Generate RSA key (for compatibility with old systems)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key to a remote server (easiest method)
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@192.168.1.50
# This adds your public key to the server's ~/.ssh/authorized_keys

# SSH to a server
ssh user@192.168.1.50                       # uses default key
ssh -i ~/.ssh/prod-key.pem ec2-user@54.123.45.67  # specify key (AWS EC2)
ssh -p 2222 user@server.example.com          # non-standard port

# SSH Agent (avoid typing passphrase every time)
eval "$(ssh-agent -s)"                       # start agent
ssh-add ~/.ssh/id_ed25519                    # add key to agent
ssh-add -l                                    # list loaded keys
# Agent keeps decrypted key in memory → SSH uses it automatically.

# SSH Agent Forwarding (use YOUR key on the remote server)
ssh -A user@bastion.myapp.com
# Now on bastion: ssh user@internal-server → uses YOUR local key!
# CAUTION: anyone with root on the bastion can hijack your forwarded agent!
# Only forward to TRUSTED machines.
```

---

# PART 2: SSH Config — Never Type Long Commands Again

---

```bash
# ── ~/.ssh/config — the power-user's best friend ──

# Simple server
Host prod-web
    HostName 54.123.45.67
    User ubuntu
    IdentityFile ~/.ssh/prod-key.pem
    Port 22

# Now just: ssh prod-web   (that's it!)

# Server behind a bastion (jump host)
Host prod-db
    HostName 10.0.2.50           # private IP (not directly reachable)
    User admin
    IdentityFile ~/.ssh/prod-key.pem
    ProxyJump bastion             # jump through bastion first!

Host bastion
    HostName bastion.myapp.com
    User ubuntu
    IdentityFile ~/.ssh/bastion-key.pem
    ForwardAgent yes              # forward SSH agent to bastion

# Wildcard: apply settings to ALL hosts
Host *
    ServerAliveInterval 60        # send keepalive every 60s (prevent timeout)
    ServerAliveCountMax 3         # disconnect after 3 missed keepalives
    AddKeysToAgent yes            # auto-add keys to agent
    Compression yes               # compress SSH data (helps on slow links)

# Multiple bastion hops (hop through 2 servers!)
Host deep-internal
    HostName 10.10.5.100
    User admin
    ProxyJump bastion,internal-gateway

# Pattern matching
Host staging-*
    User deploy
    IdentityFile ~/.ssh/staging-key.pem

# Usage: ssh staging-web1, ssh staging-api2 → all use deploy@staging-key
```

---

# PART 3: SSH Tunneling — The Swiss Army Knife

---

```
SSH TUNNELING = creating an encrypted connection that allows access
to services that are otherwise unreachable (behind firewalls, in private subnets).

THREE TYPES:

1. LOCAL PORT FORWARDING (-L):
   "Make a remote service available on MY machine."
   
   Use case: Access a production database that's in a private subnet.
   The database only allows connections from the bastion host.
   
   ssh -L 5432:db-internal:5432 user@bastion.myapp.com
   
   Translation:
   "Listen on MY localhost:5432. Send traffic through SSH to bastion.
    Bastion connects to db-internal:5432 and relays data back."
   
   Now: psql -h localhost -p 5432 → connects to the PRODUCTION DATABASE!
   
   Traffic flow:
   Your laptop:5432 → [SSH encrypted tunnel] → bastion → db-internal:5432

2. REMOTE PORT FORWARDING (-R):
   "Make a service on MY machine available to the REMOTE server."
   
   Use case: Show your local dev server to a colleague on the remote network.
   
   ssh -R 8080:localhost:3000 user@remote-server.com
   
   Translation:
   "On remote-server, listen on port 8080. Forward to MY localhost:3000."
   
   Now: curl http://remote-server:8080 → reaches YOUR local dev server!
   
   Like a reverse ngrok.

3. DYNAMIC PORT FORWARDING (-D / SOCKS proxy):
   "Route ALL my traffic through the SSH server."
   
   ssh -D 1080 user@remote-server.com
   
   Creates a SOCKS5 proxy on localhost:1080.
   Configure browser to use SOCKS5 proxy localhost:1080.
   → ALL browser traffic routes through the SSH tunnel → exits at remote-server.
   
   Use case: Browse internal websites, bypass geographic restrictions.
```

```bash
# ── FILE TRANSFER OVER SSH ──

# SCP (Secure Copy — simple but limited)
scp file.tar.gz user@server:/opt/deploy/       # upload
scp user@server:/var/log/app.log ./            # download
scp -r ./my-project user@server:/home/user/    # recursive directory upload

# RSYNC (better — incremental, resume, compression)
rsync -avz --progress ./build/ user@server:/var/www/html/
# -a: archive mode (preserves permissions, timestamps)
# -v: verbose
# -z: compress during transfer
# --progress: show progress bar
# ONLY transfers files that CHANGED (much faster than scp for updates!)

# SFTP (interactive file transfer)
sftp user@server
sftp> ls                    # list remote files
sftp> get /var/log/app.log  # download
sftp> put ./deploy.tar.gz   # upload
sftp> bye
```

---

# PART 4: VPN — Virtual Private Networks

---

```
VPN = encrypted tunnel between your device and a network.
All your traffic routes through the VPN server.

TYPES:

SITE-TO-SITE VPN:
  Connects two ENTIRE networks through an encrypted tunnel.
  Office A ←→ VPN tunnel ←→ Office B. All devices on both sides can communicate.
  Used by: enterprises connecting offices, AWS VPC to on-premises.
  Protocols: IPsec, AWS Site-to-Site VPN.

REMOTE ACCESS VPN:
  Individual users connect to corporate network from anywhere.
  Laptop → VPN tunnel → corporate network → access internal resources.
  Used by: remote workers, accessing production infrastructure.
  Protocols: OpenVPN, WireGuard, IPsec IKEv2.

WIREGUARD (modern, fast, simple):
  Only ~4,000 lines of code (OpenVPN is 100,000+).
  Uses modern cryptography: Curve25519, ChaCha20, Poly1305, BLAKE2.
  Faster than OpenVPN and IPsec.
  Built into Linux kernel (since 5.6).
  
  Becoming the default for cloud VPN (Tailscale, Cloudflare WARP use WireGuard).

SPLIT TUNNELING:
  Full tunnel: ALL traffic goes through VPN (secure but slow).
  Split tunnel: only CORPORATE traffic goes through VPN, rest goes direct.
  
  Split is faster but: personal traffic isn't protected.
  Corporate preference: usually full tunnel for security.
```

---

# PART 5: Production SSH Hardening

---

```bash
# ── /etc/ssh/sshd_config — Production Server SSH Hardening ──

# Disable password authentication (key-only)
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable root login
PermitRootLogin no

# Only allow specific users/groups
AllowUsers deploy admin
# Or: AllowGroups ssh-users

# Change default port (security through obscurity — minor but helps)
Port 2222

# Restrict to specific network interface
ListenAddress 10.0.1.0

# Idle timeout (disconnect inactive sessions)
ClientAliveInterval 300       # check every 5 minutes
ClientAliveCountMax 2         # disconnect after 2 missed checks (10 min total)

# Disable forwarding (if not needed)
AllowTcpForwarding no
X11Forwarding no
AllowAgentForwarding no

# Log level
LogLevel VERBOSE               # log authentication details

# Limit authentication attempts
MaxAuthTries 3
MaxSessions 5

# Use only strong algorithms
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Restart SSH to apply: sudo systemctl restart sshd
```

```
FAIL2BAN (brute force protection):
  Monitors SSH logs → bans IPs after N failed attempts.
  
  sudo apt install fail2ban
  # Config: /etc/fail2ban/jail.local
  [sshd]
  enabled = true
  port = 2222
  maxretry = 3
  bantime = 3600        # ban for 1 hour
  findtime = 600        # within 10 minutes
  
  # Check banned IPs
  sudo fail2ban-client status sshd
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **TLS (SSH uses similar crypto)** | [Ch 09: TLS](09_TLS_Encryption.md) — Diffie-Hellman, Ed25519 |
| **Public/private keys** | [Ch 09: TLS](09_TLS_Encryption.md) — asymmetric encryption |
| **Bastion in VPC** | [Ch 13: Cloud VPC](13_Cloud_Networking_VPC.md) — public subnet bastion |
| **Firewall (port 22)** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — allow SSH from subnet |
| **Docker exec (alt to SSH)** | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — container debugging |
| **Git over SSH** | Uses the same ~/.ssh/id_ed25519 key format |

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


> **Navigation**: [← Cloud VPC](13_Cloud_Networking_VPC.md) | [Index](00_INDEX.md) | [Next → Debugging](15_Network_Debugging.md)
