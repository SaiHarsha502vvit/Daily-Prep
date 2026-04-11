> **Navigation**: [← Firewalls](10_Firewalls_Access_Control.md) | [Index](00_INDEX.md) | [Next → WiFi & APs](12_WiFi_AP_Enterprise.md)

# ⚖️ Chapter 11: Load Balancing & Proxies — Distributing Traffic at Scale

> _"One server can handle 2,000 requests per second. You get 100,000 req/s. Without load balancing, you're dead. With it, you split traffic across 50 servers and no one breaks a sweat."_

---

# PART 1: Forward Proxy vs Reverse Proxy

---

```
FORWARD PROXY (client-side):
  Client → Forward Proxy → Internet
  
  The proxy acts on BEHALF OF THE CLIENT.
  Internet sees the proxy's IP, not the client's.
  
  Uses:
  1. Privacy/anonymity: hide client IP (VPN, Tor).
  2. Content filtering: corporate proxy blocks social media.
  3. Caching: proxy caches responses → faster for repeated requests.
  4. Bypassing restrictions: access blocked websites through foreign proxy.
  
  Examples: Squid, corporate proxy servers, VPN tunnels.

REVERSE PROXY (server-side):
  Client → Reverse Proxy → Backend Servers
  
  The proxy acts on BEHALF OF THE SERVER.
  Client sees the proxy's IP, not the backend servers'.
  
  Uses:
  1. Load balancing: distribute across multiple backends.
  2. TLS termination: proxy handles HTTPS, backends get HTTP.
  3. Caching: cache static responses at the edge.
  4. Security: hide backend topology, WAF, rate limiting.
  5. Compression: proxy gzips responses.
  
  Examples: nginx, HAProxy, Envoy, Traefik, Caddy, AWS ALB.

THE CRITICAL DIFFERENCE:
  Forward: protects CLIENTS. Client knows about the proxy.
  Reverse: protects SERVERS. Client usually doesn't know there's a proxy.
```

---

# PART 2: Layer 4 vs Layer 7 Load Balancing

---

```
LAYER 4 (Transport — TCP/UDP level):
  Sees: source IP, dest IP, source port, dest port, protocol.
  Does NOT see: HTTP headers, URLs, cookies, content.
  
  Decision: based on IP + port. Route entire TCP connection to one backend.
  Speed: FAST (no content parsing, works at kernel level).
  
  HOW IT WORKS:
  Client connects to VIP (Virtual IP: 54.123.45.67:443).
  L4 LB selects backend server (10.0.1.10:8000).
  ALL packets in this connection go to the SAME backend.
  
  Modes:
  DSR (Direct Server Return): backend responds DIRECTLY to client (bypasses LB).
    Ultra-fast. Used for: high-bandwidth services (video streaming).
  NAT mode: LB rewrites src/dst IPs. Both directions through LB.
  
  Examples: AWS NLB, HAProxy L4 mode, Linux IPVS, nginx (stream module).
  
  ANALOGY: A highway toll booth.
  Routes cars (connections) to different lanes (backends) based on license plate (IP/port).
  Doesn't read what's in the car (HTTP content).

LAYER 7 (Application — HTTP/HTTPS level):
  Sees: HTTP headers, URL path, host header, cookies, query params, body.
  
  Decision: based on CONTENT.
  /api/*        → api-backends
  /static/*     → CDN/static servers
  /admin/*      → admin-backends (with additional auth check)
  Host: api.v2  → v2-backends
  Cookie: canary=true → canary-backends
  
  Speed: Slower than L4 (must parse HTTP). But much more powerful.
  
  CAN DO:
  • TLS termination (handles HTTPS, forwards HTTP to backends)
  • Header injection (add X-Request-Id for tracing)
  • URL rewriting (/old-path → /new-path)
  • Response caching
  • Rate limiting per path/user
  • A/B testing, canary routing
  
  Examples: AWS ALB, nginx, HAProxy L7 mode, Envoy, Traefik.
  
  ANALOGY: A restaurant host.
  Reads your reservation (HTTP request). VIP? Private room. Regular? Main dining.
  Vegetarian? Kitchen with veggie chef. Understands your NEEDS.

WHEN TO USE:
  L4: Raw TCP/UDP traffic (databases, gaming, gRPC), maximum performance.
  L7: HTTP APIs, web apps, microservices — whenever you need content-based routing.
  Both: L4 in front (global traffic distribution) → L7 behind (per-service routing).
```

---

# PART 3: Load Balancing Algorithms

---

```
ROUND ROBIN:
  Server 1 → 2 → 3 → 1 → 2 → 3 → ...
  Fair if all servers are IDENTICAL (same CPU, same load).
  Problem: if server 3 is slow (processing a heavy request), it still gets traffic → overwhelmed.
  DNS also supports round-robin (multiple A records).

WEIGHTED ROUND ROBIN:
  Server 1 (weight=5) → gets 5 out of every 7 requests.
  Server 2 (weight=1) → gets 1 out of 7.
  Server 3 (weight=1) → gets 1 out of 7.
  Use: larger servers get more traffic. Canary deployment (new version = low weight).

LEAST CONNECTIONS:
  Route to the server with the FEWEST active connections.
  Best for: long-lived connections (WebSockets, gRPC streams, database connections).
  Problem: doesn't account for server CAPACITY (big vs small server).

WEIGHTED LEAST CONNECTIONS:
  Combines least connections with weights.
  Score = active_connections / weight. Lowest score wins.
  Best of both: capacity-aware AND load-aware.

RANDOM:
  Pick a random server. Surprisingly effective with enough servers.
  "Power of Two Random Choices": pick 2 random servers → route to the less loaded one.
  Better than round-robin for heterogeneous workloads!

IP HASH:
  hash(client_ip) % num_servers = server index.
  Same client ALWAYS goes to the same server (session affinity).
  Problem: add/remove a server → ALL hashes change → ALL sessions reassigned.

CONSISTENT HASHING:
  Servers and clients mapped to positions on a hash ring (0 to 2^32).
  Client goes to the nearest server clockwise on the ring.
  Adding a server: only ~1/N of clients are remapped.
  Removing a server: only that server's clients are remapped.
  
  Used by: Envoy, nginx Plus, CDNs, database sharding (Cassandra, DynamoDB).
  SEE: DS in Production — Hash Tables — Consistent Hashing for full explanation.

LEAST RESPONSE TIME:
  Route to the server with the lowest average response time.
  Adaptive: automatically sends less traffic to slow servers.
  Requires: active health monitoring and latency tracking.
```

---

# PART 4: nginx — Complete Load Balancer Configuration

---

```nginx
# ── PRODUCTION NGINX LOAD BALANCER ──

# Worker processes: one per CPU core
worker_processes auto;
events {
    worker_connections 65535;     # max connections per worker
    multi_accept on;             # accept multiple connections at once
    use epoll;                   # Linux high-performance event mechanism
}

http {
    # ── LOGGING ──
    log_format json_logs escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"method":"$request_method",'
        '"uri":"$request_uri",'
        '"status":$status,'
        '"body_bytes":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_response_time":"$upstream_response_time",'
        '"upstream_addr":"$upstream_addr",'
        '"request_id":"$request_id"'
    '}';
    access_log /var/log/nginx/access.log json_logs;

    # ── PERFORMANCE ──
    sendfile on;                 # zero-copy file serving
    tcp_nopush on;               # send headers and beginning of file together
    tcp_nodelay on;              # disable Nagle's algorithm
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;        # don't compress tiny responses

    # ── UPSTREAM GROUPS ──
    upstream api_servers {
        least_conn;              # algorithm: least active connections

        server 10.0.1.10:8000 weight=3 max_fails=3 fail_timeout=30s;
        server 10.0.1.11:8000 weight=2 max_fails=3 fail_timeout=30s;
        server 10.0.1.12:8000 weight=1 max_fails=3 fail_timeout=30s;
        server 10.0.1.13:8000 backup;    # only if all others are down

        keepalive 32;            # keep 32 connections alive to backends
    }

    upstream static_servers {
        server 10.0.2.10:80;
        server 10.0.2.11:80;
    }

    upstream websocket_servers {
        ip_hash;                 # session affinity for WebSocket
        server 10.0.3.10:8080;
        server 10.0.3.11:8080;
    }

    # ── RATE LIMITING ──
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # ── HTTP → HTTPS REDIRECT ──
    server {
        listen 80;
        server_name api.myapp.com www.myapp.com;
        return 301 https://$host$request_uri;
    }

    # ── MAIN HTTPS SERVER ──
    server {
        listen 443 ssl http2;
        server_name api.myapp.com;

        # TLS configuration
        ssl_certificate     /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers on;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # ── API ROUTES ──
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://api_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Request-Id $request_id;

            proxy_connect_timeout 5s;
            proxy_read_timeout 30s;
            proxy_send_timeout 10s;

            proxy_next_upstream error timeout http_502 http_503;
            proxy_next_upstream_tries 2;
        }

        # ── LOGIN (stricter rate limit) ──
        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            proxy_pass http://api_servers;
        }

        # ── STATIC FILES (cached) ──
        location /static/ {
            proxy_pass http://static_servers;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # ── WEBSOCKET ──
        location /ws/ {
            proxy_pass http://websocket_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 86400;    # keep WebSocket alive for 24h
        }

        # ── HEALTH CHECK ENDPOINT ──
        location /health {
            access_log off;
            return 200 '{"status": "healthy"}';
            add_header Content-Type application/json;
        }
    }
}
```

---

# PART 5: CDN (Content Delivery Network)

---

```
THE PROBLEM:
  Your server is in Virginia. User is in Tokyo.
  Round-trip time: ~150ms. Every resource (CSS, JS, images): 150ms × each.
  100 resources: 15+ seconds just for network transit!

CDN SOLUTION:
  Cache your content at 300+ EDGE LOCATIONS worldwide.
  User in Tokyo → hits CDN edge in Tokyo (5ms) instead of Virginia (150ms).
  
  CDN PROVIDERS:
  Cloudflare: 330+ cities. Free tier! Also offers DDoS protection, WAF, DNS.
  AWS CloudFront: 450+ PoPs. Deep AWS integration.
  Akamai: oldest CDN. 4,000+ PoPs. Enterprise.
  Fastly: real-time purging. Used by GitHub, Stripe.

WHAT CDN CACHES:
  Static assets: CSS, JS, images, fonts, videos.
  API responses: if Cache-Control allows (GET requests with proper headers).
  
  CACHE RULES (set by your server's response headers):
  Cache-Control: public, max-age=31536000, immutable
    → CDN caches for 1 year. Never revalidates. File name has version hash.
    → Used for: style.abc123.css (filename changes = cache busts automatically).
  
  Cache-Control: public, max-age=60, stale-while-revalidate=300
    → CDN caches for 60s, then serves stale while fetching fresh in background.
    → Used for: API responses, dynamic HTML.
  
  Cache-Control: private, no-store
    → CDN does NOT cache. Every request goes to origin.
    → Used for: user-specific data, authenticated APIs.

CDN INVALIDATION:
  You deploy new CSS. Old CSS is cached at 300 locations.
  OPTIONS:
  1. Versioned filenames (best): style.v2.css → new URL → CDN fetches fresh.
  2. Purge: send purge request to CDN → invalidates cached copies.
     Cloudflare: takes ~30 seconds globally.
     Fastly: takes ~150ms globally (real-time purge, their key differentiator).
  3. Wait for TTL expiration (if you can afford the delay).
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Consistent hashing** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) |
| **TCP load balancing** | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — kube-proxy, IPVS |
| **HTTP routing** | [Ch 08: HTTP](08_HTTP_Complete.md) — headers, methods |
| **TLS termination** | [Ch 09: TLS](09_TLS_Encryption.md) — certificates for nginx |
| **K8s Ingress** | [Networking & Security](02_Networking_Security.md) — Ingress controllers |
| **Service mesh** | [Cloud Native](03_ServiceMesh_CloudNative.md) — Envoy proxy |
| **React deployment** | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) — build → nginx |
| **CSS CDN** | [CSS Modern](../18_CSS_Complete/04_CSS_Modern_Architecture.md) — versioned assets |

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


> **Navigation**: [← Firewalls](10_Firewalls_Access_Control.md) | [Index](00_INDEX.md) | [Next → WiFi & APs](12_WiFi_AP_Enterprise.md)
