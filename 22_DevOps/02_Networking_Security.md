> **Navigation**: [← Advanced](01_DevOps_Advanced.md) | [Index](00_INDEX.md) | [Next → Service Mesh](03_ServiceMesh_CloudNative.md)

# 🔐 Networking & Security for DevOps — Complete Deep Guide

> _"Every system you build sits on a network. If you don't understand how packets flow from browser to server, you can't debug production. And if you can't secure that path, you shouldn't be deploying anything."_

---

# PART 0: The 5W+H Framework

| Question  | Context                                                                                                                                                               |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | The networking stack (DNS, TCP/IP, TLS, Load Balancing) and security practices (DevSecOps, secrets management, supply chain) that make deployments reliable and safe. |
| **WHY**   | When an API times out at 2am → is it DNS? TLS cert expired? Load balancer misconfigured? Network ACL blocking? You MUST understand the layers to diagnose.            |
| **WHEN**  | Every single deployment. Every microservice call. Every HTTPS handshake.                                                                                              |
| **WHERE** | Between your browser and server, between microservices, between clusters, between clouds.                                                                             |
| **WHO**   | Cerf & Kahn (TCP/IP, 1974), Diffie & Hellman (key exchange, 1976), Berners-Lee (HTTP, 1991).                                                                          |
| **HOW**   | Through protocol layers (OSI/TCP-IP), encryption (TLS 1.3), authentication, and defense-in-depth security.                                                            |

---

# PART 1: How The Internet Actually Works — DNS→TCP→TLS→HTTP

---

```
WHAT HAPPENS WHEN YOU TYPE "https://api.myapp.com/users" IN THE BROWSER?

STEP 1 — DNS RESOLUTION (Domain → IP Address):
  Browser: "What is the IP of api.myapp.com?"

  Check order:
  1. Browser cache (cached from previous visit, TTL-based)
  2. OS cache (system-level DNS cache)
  3. Router cache (home router may cache DNS)
  4. ISP recursive resolver (your ISP's DNS server)
  5. Root name servers → .com TLD servers → myapp.com NS → api.myapp.com A record

  Result: api.myapp.com → 54.123.45.67

  ANALOGY: Looking up a phone number.
  1. Your recent calls list (browser cache)
  2. Your contacts (OS cache)
  3. The phone book at your house (router)
  4. Directory assistance (ISP resolver)
  5. International operator → country operator → local operator → the number

  DNS RECORD TYPES:
  A       → IPv4 address:  api.myapp.com → 54.123.45.67
  AAAA    → IPv6 address
  CNAME   → Alias:         www.myapp.com → myapp.com
  MX      → Mail server:   myapp.com → mail.google.com
  TXT     → Verification:  SPF, DKIM, domain ownership proofs
  NS      → Name server:   myapp.com → ns1.cloudflare.com

STEP 2 — TCP THREE-WAY HANDSHAKE (establish connection):
  Client → Server:  SYN (Synchronize): "I want to talk. My sequence # is 100."
  Server → Client:  SYN-ACK: "Got it. My sequence # is 200. I ACK your 100."
  Client → Server:  ACK: "Got it. Connection established."

  WHY 3 steps? Both sides need to confirm they can SEND and RECEIVE.
  2 steps wouldn't confirm that client received server's response.

  ANALOGY: Phone call.
  You: "Hello?" (SYN)
  Them: "Hello, yes, I can hear you! Can you hear me?" (SYN-ACK)
  You: "Yes, I hear you too! Let's talk." (ACK)

  TCP GUARANTEES:
  • Ordered delivery (packets arrive in sequence)
  • Reliable delivery (lost packets are retransmitted)
  • Flow control (sender doesn't overwhelm receiver — sliding window!)
  • Congestion control (slow start, don't overwhelm the network)

STEP 3 — TLS HANDSHAKE (encrypt the connection):
  TLS 1.3 (modern, 2018): 1-RTT handshake (1 round trip)

  Client → Server:  ClientHello: "I support these cipher suites, here's my key share."
  Server → Client:  ServerHello + Certificate + Finished: "Here's my cert, key share, done."
  Client:           Verify certificate chain (is this really api.myapp.com?)
                    Derive shared secret using key shares (Diffie-Hellman)
  Client → Server:  Finished (encrypted!): "All future data is encrypted."

  WHAT TLS PROTECTS:
  • Confidentiality: data is encrypted (nobody can read it)
  • Integrity: HMAC ensures data isn't modified in transit
  • Authentication: certificate proves server identity

  CERTIFICATE CHAIN:
  Root CA (pre-installed in browser: DigiCert, Let's Encrypt)
    → Intermediate CA (signed by root)
      → Your domain cert (signed by intermediate)

  Let's Encrypt (free TLS) + cert-manager on K8s = automatic TLS for all services!

STEP 4 — HTTP REQUEST (application data):
  GET /users HTTP/2
  Host: api.myapp.com
  Authorization: Bearer eyJhbG...
  Accept: application/json

  HTTP/2 improvements over HTTP/1.1:
  • Multiplexing: multiple requests over ONE TCP connection (no head-of-line blocking)
  • Header compression: HPACK algorithm (repeated headers aren't resent)
  • Server push: server can proactively send resources

  HTTP/3 (QUIC): replaces TCP with UDP + reliability built in
  • 0-RTT connection establishment (TLS built into QUIC)
  • No head-of-line blocking even at the transport layer
  • Used by Google, Cloudflare, Facebook

THE FULL JOURNEY:
  DNS → TCP → TLS → HTTP → Load Balancer → Web Server → App → DB → Response
  Total initial latency breakdown:
    DNS:     50ms (if not cached)
    TCP:     20ms (1 RTT to server)
    TLS:     20ms (1 RTT for TLS 1.3)
    HTTP:    varies (depends on your app)

  FIRST REQUEST: ~90ms overhead before first byte!
  SUBSEQUENT: TCP + TLS reused via keep-alive → near zero overhead.
```

---

# PART 2: Load Balancing — Distributing Traffic

---

```
THE PROBLEM:
  Your app gets 10,000 requests/second.
  One server handles 2,000 req/s max.
  → You need 5+ servers and something to DISTRIBUTE traffic.

LAYER 4 (Transport) vs LAYER 7 (Application) LOAD BALANCERS:

L4 LOAD BALANCER:
  Works at TCP/UDP level. Doesn't inspect HTTP content.
  Routes based on: IP address, port number, protocol.
  FAST (no content parsing), simple, less intelligent.
  Examples: AWS NLB, HAProxy (L4 mode), Linux IPVS.

  ANALOGY: A receptionist who routes calls by phone number.
  "All calls to extension 100 go to Team A, extension 200 to Team B."
  (Doesn't know WHAT the caller wants to discuss.)

L7 LOAD BALANCER:
  Reads HTTP headers, URL path, cookies, host header.
  Routes based on: path (/api vs /static), host, headers, content type.
  Can add headers, rewrite URLs, terminate TLS, cache responses.
  Examples: AWS ALB, nginx, HAProxy (L7 mode), Envoy, Traefik.

  ANALOGY: A concierge who reads your request.
  "Need tech support? Floor 3. Sales? Floor 5. VIP member? Express elevator."

LOAD BALANCING ALGORITHMS:

Round Robin:         Server 1 → 2 → 3 → 1 → 2 → 3
  Simple. Fair if all servers are identical.
  Problem: if one server is slower, it gets overwhelmed.

Weighted Round Robin: Server 1 (weight 3) → 2 (weight 1) → 3 (weight 1)
  Server 1 gets 3x more traffic (it's a bigger machine).

Least Connections:   Route to the server with fewest active connections.
  Best for: Long-lived connections (WebSockets, gRPC streaming).

IP Hash:             hash(client_ip) % num_servers → always same server.
  Session affinity without cookies. Problem: add/remove server → reshuffling.

Consistent Hashing:  Servers mapped to a ring → add/remove only affects neighbors.
  Used by: CDNs, database sharding, Kubernetes kube-proxy.
  SEE: DS in Production → Hash Tables → Consistent Hashing.
```

```nginx
# ── NGINX L7 LOAD BALANCER CONFIGURATION ──

# Define upstream server groups
upstream api_servers {
    # Least connections algorithm
    least_conn;

    server 10.0.1.10:8000 weight=3;    # bigger server, more traffic
    server 10.0.1.11:8000 weight=1;
    server 10.0.1.12:8000 weight=1;
    server 10.0.1.13:8000 backup;       # only if all others are down!

    # Health check: fail after 3 failures, recover after 2 successes
    # 30s timeout between checks
    keepalive 32;   # keep connections alive for reuse
}

upstream static_servers {
    server 10.0.2.10:80;
    server 10.0.2.11:80;
}

server {
    listen 443 ssl http2;
    server_name api.myapp.com;

    # TLS configuration
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;   # disable old TLS 1.0/1.1!

    # Route /api/* to API servers
    location /api/ {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 10s;
    }

    # Route static files to CDN/static servers
    location /static/ {
        proxy_pass http://static_servers;
        expires 30d;                    # browser cache for 30 days
        add_header Cache-Control "public, immutable";
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    location /api/v1/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api_servers;
    }
}
```

---

# PART 3: DevSecOps — Security Shift-Left

---

```
THE PHILOSOPHY:
  OLD WAY: Build → Test → … → Security Review (at the end!)
  → Security finds vulnerabilities late → expensive to fix → delays release.

  DEVSECOPS: Security at EVERY stage, from the very first commit.
  "Shift left" = move security checks earlier in the pipeline.

  ANALOGY: Building inspections.
  Old: Inspect the FINISHED building → find foundation cracks → demolish and rebuild.
  New: Inspect at every stage (foundation, framing, electrical) → catch problems cheap.

THE SECURITY PIPELINE:

  STAGE 1 — CODE (Developer's machine):
  • Pre-commit hooks: detect secrets (API keys, passwords) BEFORE they reach Git!
  • IDE linters: flag SQL injection, XSS patterns in real-time
  • Tools: gitleaks (secret scanner), semgrep (static analysis)

  STAGE 2 — BUILD (CI Pipeline):
  • SAST (Static Application Security Testing): scan source code
    - Semgrep, SonarQube, CodeQL (GitHub native!)
  • Dependency scanning: check for known CVEs in npm/pip/maven packages
    - Dependabot (GitHub), Snyk, OWASP Dependency-Check
  • License scanning: ensure no GPL contamination in proprietary code

  STAGE 3 — DEPLOY (Container/Image):
  • Container image scanning: scan Docker images for vulnerable OS packages
    - Trivy, Snyk Container, Docker Scout
  • Signed images: ensure the image you deploy is the one you built
    - cosign (Sigstore), Docker Content Trust
  • Admission controllers: K8s webhook that BLOCKS unsigned/unscanned images

  STAGE 4 — RUNTIME (Production):
  • DAST (Dynamic Application Security Testing): test running app
    - OWASP ZAP, Burp Suite → automated penetration testing
  • Runtime security: detect anomalous behavior in running containers
    - Falco (CNCF): alerts on unexpected system calls, file access
  • Network policies: K8s NetworkPolicy → restrict pod-to-pod communication
```

```yaml
# ── GITHUB ACTIONS SECURITY PIPELINE ──
name: Security Scan
on: [push, pull_request]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history for git secret scanning
      - name: Detect secrets
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SAST with Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/javascript
            p/python

  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check npm vulnerabilities
        run: npm audit --audit-level=high
      - name: Check Python vulnerabilities
        run: pip-audit --strict

  container-scan:
    needs: [secret-scan, sast]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .
      - name: Scan with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          severity: "CRITICAL,HIGH"
          exit-code: "1" # FAIL the pipeline on critical vulns!
```

```
SECRETS MANAGEMENT:

NEVER DO THIS:
  DATABASE_URL=postgresql://admin:password123@db:5432  # hardcoded in code!
  AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE                  # in .env committed to git!

PROPER SECRETS FLOW:
  1. Developer creates secret → stores in VAULT (HashiCorp Vault, AWS Secrets Manager)
  2. CI/CD pipeline reads secret from vault at deploy time → injects as env var
  3. Application reads env var → never touches the secret in code
  4. Secret rotation: vault auto-rotates passwords every 30 days
  5. Audit log: every secret access is logged (who, when, where)

KUBERNETES SECRETS:
  # Better: External Secrets Operator (fetches from AWS/Vault into K8s Secret)
  apiVersion: external-secrets.io/v1beta1
  kind: ExternalSecret
  metadata:
    name: db-credentials
  spec:
    refreshInterval: 1h
    secretStoreRef:
      name: aws-secrets-manager
    target:
      name: db-secret
    data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: production/database-url
    # K8s Secret auto-created and auto-rotated from AWS Secrets Manager!

OWASP TOP 10 (2021) — What Hackers Target:
  1. Broken Access Control (IDOR, missing authorization checks)
  2. Cryptographic Failures (weak TLS, plaintext passwords)
  3. Injection (SQL injection, XSS, command injection)
  4. Insecure Design (logic flaws, missing rate limits)
  5. Security Misconfiguration (default passwords, open debug endpoints)
  6. Vulnerable Components (outdated dependencies with known CVEs)
  7. Authentication Failures (weak passwords, missing MFA)
  8. Data Integrity Failures (insecure deserialization, unsigned updates)
  9. Logging Failures (no audit trail, missing security events)
  10. Server-Side Request Forgery (SSRF — making server fetch internal URLs)
```

---

# PART 4: Networking for Kubernetes

---

```
KUBERNETES NETWORKING MODEL:
  Every pod gets its own IP address (no NAT, no port mapping).
  Pods on the same node communicate via virtual bridge.
  Pods on different nodes communicate via overlay network (flannel, calico, cilium).

  KEY RULES:
  1. Every pod can reach every other pod (by default, no firewall)
  2. Every node can reach every pod
  3. The pod's IP is the same from inside and outside the pod

SERVICES — How Traffic Reaches Your Pods:

  ClusterIP (default): Internal-only IP. Accessible within the cluster.
    kubectl expose deploy myapp --type=ClusterIP --port=80 --target-port=8000

  NodePort: Opens a port (30000-32767) on EVERY node's IP.
    Any node IP + nodePort → routes to the service → routes to a pod.
    Good for: dev/testing, exposing to external load balancer.

  LoadBalancer: Creates a cloud load balancer (AWS ELB, GCP LB).
    External traffic → cloud LB → NodePort → pod.
    The standard for production web services.

  Ingress: HTTP/HTTPS routing rules (like nginx, but K8s-native).
    Route by HOST:  api.myapp.com → api service, www.myapp.com → frontend
    Route by PATH:  /api/* → backend, /static/* → CDN
    TLS termination: Ingress handles HTTPS, pods receive plain HTTP.
    Ingress controllers: nginx-ingress, traefik, AWS ALB Ingress Controller.

NETWORK POLICIES — The Firewall for Pods:
```

```yaml
# ── Block all ingress by default (zero-trust) ──
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {} # applies to ALL pods in namespace
  policyTypes:
    - Ingress
    - Egress

---
# ── Allow only specific communication ──
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database # this policy applies to database pods
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api # ONLY api pods can reach database
      ports:
        - port: 5432
          protocol: TCP # only on PostgreSQL port
# Result: database is invisible to everything except the API service.
# Even if an attacker compromises the frontend pod → can't reach DB.
```

---

# PART 5: Cloud Design Patterns for Reliability

---

```
CIRCUIT BREAKER:
  When a downstream service is failing, DON'T keep hammering it.
  After N failures → OPEN the circuit (reject requests immediately).
  After a cool-down → HALF-OPEN (try one request). If ok → CLOSE. If fail → reopen.

  SEE: Enterprise Systems → Distributed Patterns for implementation details.

  Without circuit breaker:
    Service A → calls failing Service B → waits (30s timeout) × 1000 concurrent users
    → 1000 threads stuck waiting → Service A runs out of threads → Service A ALSO dies!
    → CASCADING FAILURE across your entire system!

  With circuit breaker:
    After 5 failures → circuit opens → requests fail FAST (no waiting)
    → Service A stays healthy → users get error page instead of nothing.

RETRY WITH EXPONENTIAL BACKOFF:
  When a request fails: retry after 1s, then 2s, then 4s, then 8s...
  ADD JITTER: random delay (0-1s) → prevents thundering herd.

  Without jitter: 10,000 clients all retry at exactly 1s, 2s, 4s → DDoS your own server!
  With jitter: 10,000 clients retry randomly between 0.5-1.5s, 1-3s, 3-5s → flat load.

BULKHEAD:
  Isolate critical services from each other.
  Ship analogy: bulkheads divide a ship into compartments.
  If one compartment floods (service fails) → others stay dry (still work).

  Implementation: Separate thread pools per downstream service.
  Payment pool: 50 threads.   Recommendation pool: 20 threads.
  If recommendations hang → only 20 threads stuck → payments still work!

HEALTH CHECK PATTERN (liveness + readiness):
  Liveness: "Am I alive?" → if NO → K8s KILLS the pod (restart).
    Detects: deadlocks, infinite loops, corrupted state.
    DON'T: Check dependencies in liveness (DB down ≠ app dead).

  Readiness: "Am I ready for traffic?" → if NO → K8s removes from Service (no traffic).
    DO: Check dependency connectivity (DB reachable, cache warm).
    Pod stays alive but doesn't receive requests until ready.

  Startup: "Have I finished starting up?" → for slow-starting apps.
    150s startup? Don't let liveness kill it during initialization.

SIDECAR PATTERN:
  Deploy a helper container alongside your main container in the SAME pod.
  They share the network (localhost) and storage (shared volumes).

  Used for: logging agents, service mesh proxies (Envoy/Istio), config reloaders.

  Your app doesn't know about the sidecar — it just makes HTTP calls.
  Sidecar intercepts, adds encryption, auth, retries, metrics… transparently.
```

---

## 🔗 Cross-References

| Topic                        | Related Content                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **TCP sliding window**       | [Algorithms in Production](../03_Algorithms/12_Algorithms_In_Production.md) — sliding window = TCP flow control |
| **Hash tables (DNS cache)**  | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — hash table → DNS, session store              |
| **MVCC (DB isolation)**      | [SQL Internals Deep](../08_SQL/49_SQL_Internals_Deep.md) — row versioning, xmin/xmax                            |
| **SQL injection (OWASP #3)** | [SQL Security](../08_SQL/33_SQL_Security_Injection.md) — parameterized queries                                  |
| **Saga / circuit breaker**   | [Enterprise Distributed](../10_Enterprise_Systems/09_Distributed_Patterns.md) — Saga, Outbox, CQRS              |
| **Async HTTP (FastAPI)**     | [Python Asyncio](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) — non-blocking I/O                     |
| **React deployment (nginx)** | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) — build → nginx → CDN                       |
| **JavaScript Event Loop**    | [JS V8 Internals](../16_JavaScript/06_JS_Modern_ES6Plus.md) — single-thread, I/O model (like nginx)             |
| **Docker/K8s basics**        | [DevOps Fundamentals](00_DevOps_Fundamentals.md)                                                                |
| **Terraform/Helm/GitOps**    | [DevOps Advanced](01_DevOps_Advanced.md)                                                                        |
