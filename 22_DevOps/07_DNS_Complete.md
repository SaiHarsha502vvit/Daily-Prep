> **Navigation**: [← TCP/UDP](06_TCP_UDP_Deep_Dive.md) | [Index](00_INDEX.md) | [Next → HTTP](08_HTTP_Complete.md)

# 🔍 Chapter 7: DNS — The Internet's Phone Book

> _"DNS is the most critical system on the internet that nobody thinks about. If DNS goes down, the internet effectively stops working — even though all the servers are still running. You just can't find them."_

---

# PART 1: History — From hosts.txt to Global DNS

---

```
THE BEGINNING (1970s):
  ARPANET had a file called HOSTS.TXT.
  Every hostname → IP mapping was in this ONE FILE.
  Maintained by ONE person (Elizabeth Feinler at SRI).
  Every computer downloaded this file periodically.
  
  When ARPANET had 100 hosts → manageable.
  When internet reached 1,000 hosts (early 1983) → impossible.
  File was megabytes, always outdated, naming conflicts.

1983 — DNS INVENTED:
  Paul Mockapetris (RFC 882, 883 → later RFC 1034, 1035).
  DISTRIBUTED, HIERARCHICAL naming system.
  No single point of failure. Scales to billions of names.
  
  THIS IS THE SAME SYSTEM RUNNING TODAY.
  41 years later, the fundamental design hasn't changed.

THE DNS HIERARCHY:
  
  . (ROOT)                         ← 13 root server clusters worldwide
  ├── .com (TLD)                   ← Verisign operates .com
  │   ├── google.com               ← Google's authoritative NS
  │   │   ├── www.google.com       ← A record: 142.250.80.4
  │   │   ├── mail.google.com      ← CNAME → googlemail.l.google.com
  │   │   └── dns.google.com       ← A record: 8.8.8.8
  │   ├── github.com               ← GitHub's authoritative NS
  │   └── myapp.com                ← YOUR domain's authoritative NS
  ├── .org
  ├── .net
  ├── .io                          ← Country code TLD (British Indian Ocean Territory!)
  ├── .dev                         ← Google-owned TLD (requires HTTPS)
  └── .uk, .de, .jp, ...           ← Country code TLDs

THE 13 ROOT SERVERS:
  Named A through M. Run by different organizations worldwide.
  A = Verisign, B = USC-ISI, J = Verisign, K = RIPE NCC, etc.
  
  BUT: "13 root servers" is misleading.
  Each "server" is actually hundreds of instances via ANYCAST.
  Real count: 1,700+ root server instances across 200+ locations.
  
  ANYCAST: same IP address announced from multiple physical locations.
  Your query goes to the NEAREST instance (BGP routing handles this).
```

---

# PART 2: The Resolution Process — Step by Step

---

```
YOU TYPE: https://api.myapp.com/users
BROWSER NEEDS: the IP address of api.myapp.com

STEP 1 — BROWSER CACHE:
  Browser checks its in-memory DNS cache.
  Chrome: chrome://net-internals/#dns (view cached entries!)
  TTL-based: if cached AND TTL hasn't expired → use cached IP. Done!

STEP 2 — OS CACHE (STUB RESOLVER):
  Browser asks the OS resolver.
  The OS checks its system-wide DNS cache.
  
  Linux: systemd-resolved maintains a cache.
  macOS: mDNSResponder.
  Windows: DNS Client service.
  
  Also checks: /etc/hosts file (Linux/macOS) or C:\Windows\System32\drivers\etc\hosts
  Entries in hosts file OVERRIDE DNS!
  
  127.0.0.1  localhost
  192.168.1.50  myapp.local    ← custom mapping (useful for dev)
  0.0.0.0  ads.facebook.com   ← block ads by mapping to nowhere!

STEP 3 — RECURSIVE RESOLVER:
  OS sends query to configured DNS server (usually your ISP or 8.8.8.8).
  This is the RECURSIVE RESOLVER — it does the heavy lifting.
  
  The resolver checks ITS cache first.
  Popular domains (google.com) are almost always cached.

STEP 4 — ITERATIVE QUERIES (if not cached):
  Resolver asks the ROOT SERVER: "Where is api.myapp.com?"
  Root: "I don't know, but .com is handled by these TLD servers: a.gtld-servers.net ..."
  
  Resolver asks the .COM TLD SERVER: "Where is api.myapp.com?"
  TLD: "I don't know, but myapp.com is handled by: ns1.cloudflare.com, ns2.cloudflare.com"
  
  Resolver asks AUTHORITATIVE NS (ns1.cloudflare.com): "What is api.myapp.com?"
  Authoritative: "api.myapp.com → 54.123.45.67, TTL=300 (5 minutes)"
  
  Resolver caches the answer (for TTL seconds) and returns it to your OS.

TOTAL: Up to 4 network round trips (if nothing is cached).
In practice: 1-2 hops (root + TLD are almost always cached by recursive resolver).
Typical DNS resolution time: 5-50ms (cached) or 50-200ms (uncached).

VISUAL:
  Browser → OS Cache → Recursive Resolver → Root → TLD → Authoritative → Answer!
  Each arrow can be a cache HIT (instant) or a cache MISS (network round trip).
```

---

# PART 3: DNS Record Types — The Complete Reference

---

```
A RECORD (Address):
  Maps hostname to IPv4 address.
  api.myapp.com → 54.123.45.67
  Most common record type. The fundamental purpose of DNS.
  
  Multiple A records = DNS round-robin load balancing:
  api.myapp.com → 54.123.45.67
  api.myapp.com → 54.123.45.68
  api.myapp.com → 54.123.45.69
  First query returns .67, second returns .68, etc. (simple but no health checking!)

AAAA RECORD (IPv6 Address):
  Maps hostname to IPv6 address.
  api.myapp.com → 2001:db8::1
  Four A's because IPv6 is 4× the length of IPv4 (128 vs 32 bits).

CNAME RECORD (Canonical Name / Alias):
  Maps hostname to ANOTHER hostname.
  www.myapp.com → myapp.com (www is just an alias for the main domain)
  blog.myapp.com → myapp.ghost.io (points to Ghost hosting)
  
  IMPORTANT: CNAME cannot coexist with other records at the SAME name!
  You CANNOT have: myapp.com CNAME someother.com AND myapp.com MX mail.google.com
  Root domain (@) should use A/AAAA, not CNAME.
  
  ALIAS / ANAME: Non-standard extension by Cloudflare/Route53.
  Acts like CNAME but at the root domain. Resolves to IP at query time.

MX RECORD (Mail Exchange):
  Specifies mail servers for the domain.
  myapp.com MX 10 mail1.myapp.com
  myapp.com MX 20 mail2.myapp.com
  
  Priority number: LOWER = higher priority.
  Mail goes to mail1 first. If down → tries mail2.

TXT RECORD (Text):
  Arbitrary text. Used for VERIFICATION and SECURITY:
  
  SPF: "v=spf1 include:_spf.google.com ~all"
    → "Only Google's servers can send email from @myapp.com"
    → Prevents email spoofing.
  
  DKIM: Cryptographic signature for emails.
    → Receiving mail server can verify the email wasn't tampered with.
  
  DMARC: Policy for handling SPF/DKIM failures.
    → "If email fails verification, reject it."
  
  Domain verification: Google/AWS/etc ask you to add a TXT record
    to prove you own the domain.

NS RECORD (Name Server):
  Delegates a domain to specific name servers.
  myapp.com NS ns1.cloudflare.com
  myapp.com NS ns2.cloudflare.com
  "Cloudflare is authoritative for myapp.com."

SOA RECORD (Start of Authority):
  Contains zone metadata: primary NS, admin email, serial number,
  refresh interval, retry interval, expire time, minimum TTL.
  One per zone. Critical for zone transfers between DNS servers.

SRV RECORD (Service):
  Specifies host and port for a service.
  _sip._tcp.myapp.com SRV 10 5 5060 sip.myapp.com
  → "SIP over TCP is available on sip.myapp.com port 5060"
  
  Used by: LDAP, SIP, XMPP, Kubernetes service discovery.

PTR RECORD (Pointer / Reverse DNS):
  Maps IP → hostname (reverse of A record).
  67.45.123.54.in-addr.arpa PTR api.myapp.com
  Used by: email servers to verify sender domain, security logging.

CAA RECORD (Certificate Authority Authorization):
  Specifies which CAs can issue TLS certificates for your domain.
  myapp.com CAA 0 issue "letsencrypt.org"
  → Only Let's Encrypt can issue certs for myapp.com.
  Prevents unauthorized certificate issuance.
```

```bash
# ── DNS COMMANDS — Complete Reference ──

# Basic lookup
nslookup api.myapp.com
dig api.myapp.com A

# Lookup specific record types
dig myapp.com MX          # mail servers
dig myapp.com TXT         # SPF, DKIM, verification
dig myapp.com NS          # name servers
dig myapp.com SOA         # zone authority
dig myapp.com AAAA        # IPv6 address
dig myapp.com CAA         # certificate authorities

# Trace the FULL resolution path (see every hop!)
dig +trace api.myapp.com
# Output shows: root servers → TLD servers → authoritative NS → final answer

# Query a SPECIFIC DNS server
dig @8.8.8.8 api.myapp.com       # Ask Google's DNS
dig @1.1.1.1 api.myapp.com       # Ask Cloudflare's DNS
dig @ns1.cloudflare.com api.myapp.com  # Ask authoritative directly

# Reverse DNS lookup (IP → hostname)
dig -x 8.8.8.8
# Answer: dns.google.

# Show only the answer (clean output)
dig +short api.myapp.com
# 54.123.45.67

# Check TTL (Time-To-Live) — how long until cache expires
dig api.myapp.com | grep -A1 "ANSWER SECTION"
# api.myapp.com.  300  IN  A  54.123.45.67
# TTL = 300 seconds = 5 minutes

# Test DNS propagation after changing records
# Query multiple public DNS servers to check if update has propagated:
for dns in 8.8.8.8 1.1.1.1 9.9.9.9 208.67.222.222; do
  echo "$dns: $(dig +short @$dns api.myapp.com)"
done

# Flush local DNS cache
sudo systemd-resolve --flush-caches  # Linux (systemd)
sudo dscacheutil -flushcache          # macOS
ipconfig /flushdns                    # Windows
```

---

# PART 4: TTL, Caching & Propagation

---

```
TTL (TIME TO LIVE):
  Every DNS record has a TTL: how many seconds resolvers should CACHE the answer.
  
  Low TTL (60-300s / 1-5 min):
    ✓ Changes propagate quickly (good for failover, migrations)
    ✗ More DNS queries (higher load on authoritative servers)
    ✗ Slightly higher latency (cache misses more often)
    Use for: production services, load balancers, CDN endpoints
  
  High TTL (3600-86400s / 1-24 hours):
    ✓ Fewer DNS queries (CDN, authoritative servers have less load)
    ✓ Lower latency (cache hits more often)
    ✗ Changes take hours to propagate
    Use for: static records (MX, NS), rarely-changed hosts
  
  TTL STRATEGY FOR MIGRATIONS:
  1. BEFORE migration (48 hours ahead): reduce TTL to 60 seconds.
  2. WAIT for old TTL to expire (caches flush the old high-TTL record).
  3. MAKE THE CHANGE (update IP address).
  4. WAIT 60 seconds → all clients get new IP.
  5. AFTER migration: increase TTL back to normal.
  
  If you skip step 1 → clients with old cached (high-TTL) records
  will keep going to the OLD server for hours!

DNS PROPAGATION:
  "Propagation" is really just "waiting for old cached entries to expire."
  There's no active "push" of DNS updates. It's all pull + cache TTL.
  
  Typical propagation times:
  TTL 60s:    → ~1 minute
  TTL 300s:   → ~5 minutes
  TTL 3600s:  → ~1 hour
  TTL 86400s: → ~24 hours
  
  Check propagation: https://dnschecker.org/ or the script above.
  
  EDGE CASE: Some ISP resolvers IGNORE TTL and cache for longer!
  Nothing you can do about this. Plan for 1-2 hours even with low TTL.
```

---

# PART 5: DNS Security — Attacks & Defenses

---

```
DNS WAS DESIGNED WITHOUT SECURITY (1983).
No authentication. No encryption. Trust is assumed. Bad assumption.

ATTACK 1 — DNS SPOOFING / CACHE POISONING:
  Attacker sends fake DNS responses before the real authoritative server responds.
  Recursive resolver caches the FAKE answer.
  All clients of that resolver now go to the ATTACKER'S server!
  
  Defense: DNSSEC (see below), randomized source ports, 0x20 encoding.

ATTACK 2 — DNS AMPLIFICATION (DDoS):
  Attacker sends DNS queries with SPOOFED source IP (victim's IP).
  DNS servers respond to the VICTIM with large responses.
  Amplification factor: tiny query (64 bytes) → huge response (4000+ bytes).
  → 60x amplification! Flood the victim's bandwidth.
  
  Defense: Rate limiting, response rate limiting (RRL) on DNS servers,
  BCP38 (ISPs should block spoofed source IPs).

ATTACK 3 — DNS TUNNELING:
  Encode arbitrary data in DNS queries (subdomain = data payload).
  Bypasses firewalls (DNS is almost never blocked).
  Used by: malware for command & control, data exfiltration.
  
  Defense: Monitor DNS query length, detect unusual subdomains.

DNSSEC (DNS Security Extensions):
  Adds CRYPTOGRAPHIC SIGNATURES to DNS records.
  Authoritative server signs records with its private key.
  Resolvers verify signatures using the public key (published in DNS!).
  
  Chain of trust: root signs → TLD signs → domain signs → records verified.
  
  ADOPTION: ~30% of domains are signed. Chrome validates DNSSEC since 2023.
  Limitation: DNSSEC proves data INTEGRITY (not tampered), NOT privacy
  (queries are still plaintext → ISP can see what domains you visit).

DNS OVER HTTPS (DoH) / DNS OVER TLS (DoT):
  PROBLEM: DNS queries are plaintext UDP → ISP/employer/attacker can see them.
  
  DoH (port 443): DNS queries inside HTTPS. Looks like normal web traffic.
    Used by: Firefox, Chrome, Edge (default or optional).
    Server: https://dns.google/dns-query, https://cloudflare-dns.com/dns-query
  
  DoT (port 853): DNS queries encrypted with TLS.
    Used by: Android (Private DNS setting), system-level resolvers.
  
  CONTROVERSY: DoH bypasses enterprise/parental DNS filtering.
  Enterprise: "We block malware domains at DNS level. DoH breaks that."
  Privacy advocates: "ISPs shouldn't see my DNS queries."
  Both sides have valid points!
```

---

# PART 6: DNS in Production — Configuration & Best Practices

---

```
POPULAR DNS PROVIDERS:

  RECURSIVE RESOLVERS (where clients send queries):
  8.8.8.8 / 8.8.4.4          — Google Public DNS
  1.1.1.1 / 1.0.0.1          — Cloudflare DNS (fastest!)
  9.9.9.9                    — Quad9 (privacy + security focused)
  208.67.222.222              — OpenDNS (Cisco)
  Your ISP's resolver         — usually slowest, least private
  
  AUTHORITATIVE DNS HOSTING (where YOUR records live):
  Cloudflare DNS              — free, global anycast, fast propagation
  AWS Route 53                — integrates with AWS, health checks, routing policies
  Google Cloud DNS            — high availability, global
  NS1                        — traffic management, RUM-based routing
  
  Cloudflare is the most popular choice for most developers.
  Route 53 if you're deep in AWS ecosystem.

CONFIGURING DNS FOR A NEW DOMAIN:

  1. Buy domain from registrar (Namecheap, Cloudflare, GoDaddy).
  2. Point NS records to your DNS provider.
     myapp.com NS ns1.cloudflare.com
     myapp.com NS ns2.cloudflare.com
  3. Add records:
     @ A 54.123.45.67           (root domain → your server)
     www CNAME myapp.com        (www → root domain)
     api A 54.123.45.68         (API subdomain → API server)
     @ MX 10 mx.zoho.com        (email → Zoho mail)
     @ TXT "v=spf1 include:zoho.com ~all"  (SPF for email auth)
  
  4. Wait for propagation (reduced TTL of 60s → ~1 minute).
  5. Verify: dig myapp.com A, dig www.myapp.com CNAME.

HEALTH-CHECKED DNS (AWS Route 53 & similar):
  Route 53 can health-check your servers and REMOVE unhealthy IPs from DNS!
  
  api.myapp.com → 54.123.45.67 (health check: GET /health every 30s)
  api.myapp.com → 54.123.45.68 (health check: GET /health every 30s)
  
  If .67 fails health check → Route 53 stops returning it in responses.
  Clients automatically go to .68 only. Automatic failover via DNS!
  
  ROUTING POLICIES (Route 53):
  Simple: round-robin across all IPs.
  Weighted: 70% to .67, 30% to .68 (canary deployment!).
  Latency-based: route to the server closest to the client.
  Geolocation: users in EU → EU server. Users in US → US server.
  Failover: primary server, with automatic failover to secondary.
```

```python
# ── DNS IN PYTHON ──

import socket

# Basic DNS resolution (uses the OS resolver)
ip = socket.gethostbyname("api.myapp.com")
print(f"api.myapp.com → {ip}")
# Uses /etc/resolv.conf nameservers → recursive resolver.

# Get ALL addresses (including IPv6)
results = socket.getaddrinfo("google.com", 443, socket.AF_UNSPEC, socket.SOCK_STREAM)
for family, socktype, proto, canonname, sockaddr in results:
    print(f"  {sockaddr[0]} (IPv{'4' if family == socket.AF_INET else '6'})")

# Using dnspython library for full DNS control
import dns.resolver

# Query A records
answers = dns.resolver.resolve("api.myapp.com", "A")
for rdata in answers:
    print(f"A: {rdata.address}, TTL: {answers.rrset.ttl}")

# Query MX records
mx_answers = dns.resolver.resolve("google.com", "MX")
for mx in mx_answers:
    print(f"MX: {mx.exchange} (priority: {mx.preference})")

# Query TXT records (SPF, DKIM)
txt_answers = dns.resolver.resolve("google.com", "TXT")
for txt in txt_answers:
    print(f"TXT: {txt.to_text()}")

# Reverse DNS lookup
from dns.reversename import from_address
rev_name = from_address("8.8.8.8")
rev_answers = dns.resolver.resolve(rev_name, "PTR")
for ptr in rev_answers:
    print(f"8.8.8.8 → {ptr.to_text()}")  # dns.google.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Hash table (DNS cache)** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) |
| **Tree (DNS hierarchy)** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — tree structure |
| **UDP for DNS** | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — why DNS uses UDP |
| **TLS certificates** | [Ch 09: TLS & Encryption](09_TLS_Encryption.md) |
| **AWS Route 53** | [Cloud Networking](13_Cloud_Networking_VPC.md) |
| **Kubernetes DNS** | [Networking & Security](02_Networking_Security.md) — CoreDNS, service discovery |
| **Python async DNS** | [Asyncio Internals](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) |

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


> **Navigation**: [← TCP/UDP](06_TCP_UDP_Deep_Dive.md) | [Index](00_INDEX.md) | [Next → HTTP](08_HTTP_Complete.md)
