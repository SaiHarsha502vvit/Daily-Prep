> **Navigation**: [← Load Balancing](11_Load_Balancing_Proxies.md) | [Index](00_INDEX.md) | [Next → Cloud VPC](13_Cloud_Networking_VPC.md)

# 📡 Chapter 12: WiFi, Access Points & Enterprise Networking

> _"Your home WiFi router is a Swiss Army knife — it does everything but nothing well. Enterprise networking separates each function into specialized hardware, managed centrally, designed for thousands of users."_

---

# PART 1: Home Router vs Enterprise — The Architecture Gap

---

```
YOUR HOME ROUTER IS 7 DEVICES IN ONE:

  ┌────────────────────────────────────┐
  │         HOME ROUTER                 │
  ├────────────────────────────────────┤
  │ 1. MODEM: converts ISP signal      │
  │    (DOCSIS/DSL/fiber) to Ethernet  │
  │ 2. ROUTER: NAT, routes between     │
  │    internal network and internet   │
  │ 3. SWITCH: 4x Ethernet ports       │
  │    (connects wired devices)        │
  │ 4. WIFI AP: broadcasts SSID        │
  │    (WiFi chip + antennas)          │
  │ 5. FIREWALL: basic NAT firewall    │
  │    (blocks unsolicited inbound)    │
  │ 6. DHCP SERVER: assigns IPs        │
  │    to connected devices            │
  │ 7. DNS FORWARDER: forwards DNS     │
  │    queries to ISP resolver         │
  └────────────────────────────────────┘

ENTERPRISE separates EVERY FUNCTION:
  Edge router (Cisco ISR): connects to ISP via BGP.
  Core switch (Cisco Nexus): 10-100 Gbps backbone.
  Distribution switch: per-floor, L3 routing between VLANs.
  Access switch (Cisco Catalyst): per-room, connects endpoints, PoE for APs.
  Access Point (Cisco/Aruba/UniFi): WiFi only, managed by controller.
  WiFi Controller (Cisco WLC/UniFi): centralized AP management.
  Firewall (Palo Alto/FortiGate): security between zones.
  DHCP Server (Windows Server/ISC DHCP): enterprise IP assignment.
  DNS Server (Active Directory DNS/BIND): internal name resolution.
```

---

# PART 2: Access Points — Deep Dive

---

```
AN ACCESS POINT IS A:
  Layer 2 device that bridges wireless clients to the wired network.
  THAT'S IT. No routing. No NAT. No DHCP. Just wireless ↔ wired.

DEPLOYMENT MODELS:

1. STANDALONE (autonomous):
   Each AP is configured individually (SSID, channel, power).
   Works for: 1-5 APs (small office, home).
   Nightmare at scale: 100 APs × individual configs = chaos.

2. CONTROLLER-BASED (centralized):
   WiFi Controller manages ALL APs from one dashboard.
   Pushes config: SSID, channel, power level, security.
   Dynamic adjustments: AP detects interference → controller changes channel.
   Roaming: client moves between APs → controller handles handoff seamlessly.
   
   Vendors:
   Cisco WLC + Cisco APs (enterprise, expensive)
   Aruba HPE + Aruba APs (enterprise, strong AI optimization)
   UniFi Controller + UniFi APs (prosumer, best value)
   Meraki + Meraki APs (cloud-managed by Cisco, subscription)

3. CLOUD-MANAGED:
   Controller runs in the cloud (vendor-hosted).
   APs connect to vendor's cloud management plane.
   Configure from anywhere via web dashboard.
   Examples: Meraki (Cisco), ExtremeCloud, UniFi Cloud.

PHYSICAL DEPLOYMENT:

  PoE (Power over Ethernet):
  AP needs ONE cable: Ethernet (data + power from PoE switch).
  No separate power adapter! Makes deployment easy.
  
  Mounting: ceiling-mount (most common), wall-mount, outdoor.
  Coverage: 1 AP per 2,000-5,000 sq ft (depends on walls, density).
  Density: 1 AP per 25-50 users (for active workloads).
  
  SITE SURVEY:
  Before installing, do a WiFi site survey (tools: Ekahau, NetSpot).
  Map the building → identify dead zones → plan AP placement.
  Consider: walls (especially concrete/brick), metal objects, elevator shafts.

CHANNEL PLANNING:
  2.4 GHz: Only 3 non-overlapping channels: 1, 6, 11.
  If two neighboring APs both use channel 1 → INTERFERENCE.
  Plan: AP1=ch1, AP2=ch6, AP3=ch11, AP4=ch1 (repeat pattern).
  
  5 GHz: 25 non-overlapping channels. Much easier to plan.
  Use 80 MHz wide channels (4 non-overlapping) or 40 MHz (8+).
  
  6 GHz: 59 non-overlapping 20 MHz channels. Almost no planning needed.
```

---

# PART 3: Enterprise WiFi Security — WPA3 & 802.1X

---

```
WIFI SECURITY EVOLUTION:
  WEP (1997):   BROKEN. Cracked in minutes. Never use.
  WPA (2003):   TKIP. Partially broken. Legacy only.
  WPA2 (2004):  AES-CCMP. Secure for personal use. Standard today.
  WPA3 (2018):  SAE (Simultaneous Authentication of Equals).
                Protected against offline dictionary attacks.
                Individual data encryption (each client has unique key).

WPA2-Personal vs WPA2-Enterprise:
  PERSONAL (PSK):
    One password for everyone. Everyone shares the same key.
    Problem: employee leaves → must change password for EVERYONE.
    Acceptable for: home, small office.
  
  ENTERPRISE (802.1X):
    Each user has UNIQUE credentials. No shared password.
    Uses RADIUS server for authentication.
    
    FLOW:
    1. Client connects to SSID.
    2. AP blocks all traffic except 802.1X auth (Extensible Authentication Protocol).
    3. Client sends credentials to AP (via EAP).
    4. AP forwards to RADIUS server (FreeRADIUS, Microsoft NPS, Cisco ISE).
    5. RADIUS verifies:
       - Username/password (EAP-TTLS/PAP)
       - Client certificate (EAP-TLS — most secure)
       - Active Directory lookup (user is in "WiFi-Users" group?)
    6. RADIUS responds: ACCEPT or REJECT.
    7. If ACCEPT: RADIUS tells AP which VLAN to assign the user to!
       Employee → VLAN 10 (full access).
       Guest → VLAN 20 (internet only).
       IoT → VLAN 30 (isolated).
    8. AP generates unique encryption key for this client session.

VLAN ASSIGNMENT VIA RADIUS:
  This is how enterprise WiFi provides NETWORK SEGMENTATION via WiFi:
  
  One SSID: "CorpWiFi"
  Employee logs in: RADIUS assigns VLAN 10 → full access → internal servers.
  Contractor logs in: RADIUS assigns VLAN 20 → limited access → only specific servers.
  Guest logs in: RADIUS assigns VLAN 30 → internet only → no internal access.
  
  All on the SAME SSID! RADIUS dynamically segments users.
```

---

# PART 4: Troubleshooting WiFi

---

```bash
# ── WIFI DIAGNOSTICS ──

# Linux: scan for nearby WiFi networks
sudo iwlist wlan0 scan | grep -E "ESSID|Channel|Signal"

# Show your WiFi connection details
iwconfig wlan0
# Output: ESSID:"CorpWiFi"  Frequency:5.18 GHz  Access Point: AA:BB:CC:DD:EE:FF
#         Bit Rate=866.7 Mb/s  Signal level=-55 dBm

# Signal strength guide:
# -30 dBm: excellent (right next to AP)
# -50 dBm: great (typical office)
# -60 dBm: good
# -67 dBm: minimum for reliable video streaming
# -70 dBm: minimum for web browsing
# -80 dBm: weak (disconnection likely)
# -90 dBm: unusable

# macOS: hold Option + click WiFi icon → detailed info
# Or: /System/Library/PrivateFrameworks/Apple80211.framework/.../airport -s

# Windows: show WiFi report
netsh wlan show interfaces     # current connection
netsh wlan show networks mode=bssid  # nearby networks with signal

COMMON WIFI PROBLEMS:
  Slow speed but strong signal → channel interference.
    Fix: change to less crowded channel (or use 5/6 GHz).
  
  Intermittent drops → AP overloaded or roaming issue.
    Fix: add more APs, enable fast roaming (802.11r).
  
  Good signal but can't connect → authentication failure.
    Fix: check RADIUS server logs, client certificates.
  
  Dead zones → physical obstruction.
    Fix: add AP or WiFi extender/mesh node.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Physical layer** | [Ch 04: Fundamentals](04_Networking_Complete.md) — WiFi standards, modulation |
| **VLANs** | [Ch 04: Fundamentals](04_Networking_Complete.md) — VLAN trunking, 802.1Q |
| **DHCP** | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — DORA process |
| **TLS/certificates** | [Ch 09: TLS](09_TLS_Encryption.md) — EAP-TLS client certs |
| **Firewall zones** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — VLAN firewalling |
| **Cloud WiFi** | [Cloud Networking](13_Cloud_Networking_VPC.md) — virtual networks |

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


> **Navigation**: [← Load Balancing](11_Load_Balancing_Proxies.md) | [Index](00_INDEX.md) | [Next → Cloud VPC](13_Cloud_Networking_VPC.md)
