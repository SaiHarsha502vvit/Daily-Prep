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
  • Integrity: every record is authenticated, so tampering is detected (TLS 1.3 uses AEAD ciphers such as AES-GCM;
    TLS 1.2 and older used a separate HMAC)
  • Authentication: certificate proves server identity

  CERTIFICATE CHAIN:
  Root CA (pre-installed in the OS/browser trust store, e.g. DigiCert, ISRG Root X1 for Let's Encrypt)
    → Intermediate CA (signed by root)
      → Your domain cert (signed by intermediate)

  Let's Encrypt (free TLS) + cert-manager on K8s = automatic TLS for all services!

STEP 4 — HTTP REQUEST (application data):
  GET /users HTTP/2
  Host: api.myapp.com
  Authorization: Bearer eyJhbG...
  Accept: application/json

  HTTP/2 improvements over HTTP/1.1:
  • Multiplexing: multiple requests over ONE TCP connection (removes HTTP-level head-of-line blocking;
    TCP-level blocking remains: one lost packet stalls EVERY stream until it is retransmitted)
  • Header compression: HPACK algorithm (repeated headers aren't resent)
  • Server push: in the spec, but effectively dead. Chrome removed it in version 106 (2022); don't design around it

  HTTP/3 (QUIC): replaces TCP with UDP + reliability built in
  • Transport + TLS 1.3 handshake combined: 1 RTT for a NEW connection, 0-RTT only when RESUMING a
    previous session (0-RTT data can be replayed by an attacker, so only send idempotent requests in it)
  • No head-of-line blocking between streams (each stream has its own loss recovery)
  • Used by Google, Cloudflare, Facebook

THE FULL JOURNEY:
  DNS → TCP → TLS → HTTP → Load Balancer → Web Server → App → DB → Response
  Total initial latency breakdown (illustrative; measured for real in "Trace it yourself" below):
    DNS:     50ms (if not cached)
    TCP:     20ms (1 RTT to server)
    TLS:     20ms (1 RTT for TLS 1.3, plus a little CPU for the key exchange)
    HTTP:    varies (depends on your app)

  FIRST REQUEST: ~90ms overhead before first byte!
  SUBSEQUENT: TCP + TLS reused via keep-alive → near zero overhead.
```

---

## Trace it yourself — measure each step, then read the failure signature

*Measured in WSL2 Ubuntu (curl 8.5.0, OpenSSL 3.0.13) against a public site, 2026-10-24. Your numbers will differ; the **shape** is what matters.*

```bash
$ curl -s -o /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} http=%{http_version}\n' https://example.com/
dns=0.048887 tcp=0.060172 tls=0.084000 ttfb=0.100125 http=2
```

curl's timers are **cumulative from the start of the request**, not per-step. Subtract: DNS 49 ms, TCP handshake 11 ms (`0.060 - 0.049`), TLS 24 ms (`0.084 - 0.060`), server think-time + first byte 16 ms. TLS cost more than the TCP round trip because the key exchange and the certificate signature check burn CPU on top of the one RTT. Now fetch the URL **twice in one command** so curl reuses the connection:

```bash
$ curl -s -o /dev/null -o /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} new_connections=%{num_connects}\n' https://example.com/ https://example.com/
dns=0.041091 tcp=0.051716 tls=0.076615 ttfb=0.092633 new_connections=1
dns=0.000011 tcp=0.000000 tls=0.000000 ttfb=0.014885 new_connections=0
```

The second request pays **0 ms** for DNS, TCP and TLS: the keep-alive connection is already open. That is the entire reason `keepalive` appears in the nginx `upstream` block below, and why a load balancer that opens a fresh connection per request to the backend wastes the handshake on every call.

Look at what TLS 1.3 negotiated, and what the certificate chain looked like:

```bash
$ echo | openssl s_client -connect example.com:443 -servername example.com -tls1_3 2>&1 | egrep -i "depth|Verification|Cipher|Server Temp Key"
depth=3 C = US, O = SSL Corporation, CN = SSL.com TLS ECC Root CA 2022
depth=2 C = US, O = SSL Corporation, CN = SSL.com TLS Transit ECC CA R2
depth=1 C = US, O = SSL Corporation, CN = Cloudflare TLS Issuing ECC CA 3
depth=0 CN = example.com
Server Temp Key: X25519, 253 bits
Verification: OK
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
```

Read it bottom-up: `TLS_AES_256_GCM_SHA384` is an **AEAD** cipher (encryption and integrity in one primitive, which is why the older "HMAC" wording had to change), `X25519` is the Diffie-Hellman group that produced the shared secret (forward secrecy: stealing the server key later does not decrypt recorded traffic), and the chain has **four** levels here, not the textbook three: the server must send the intermediates, the client already trusts the root. The same site's certificate was valid `Sep 26 2026 -> Dec 25 2026` (about 90 days), so rotation must be automated; see [TLS & Encryption](09_TLS_Encryption.md).

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as Recursive resolver
    participant S as Server
    B->>R: A record for api.myapp.com?
    R-->>B: 54.123.45.67 with a TTL
    B->>S: SYN
    S-->>B: SYN-ACK
    B->>S: ACK
    B->>S: ClientHello with SNI and key share
    S-->>B: ServerHello, Certificate, Finished
    B->>S: Finished, then GET /users encrypted
    S-->>B: 200 OK encrypted
```

**How to read this diagram.** Three participants: the browser, the recursive resolver that answers DNS on its behalf, and the origin server. Order top to bottom: one DNS round trip, then the three TCP messages, then the TLS 1.3 exchange (one round trip, after which the browser already sends its encrypted request), then the HTTP response. Notice that DNS talks to a *different machine* than everything below it, and that each arrow pair before the `GET` is latency you pay again on every brand-new connection.

### The same trace as a debugging table

Each layer fails in a way that names itself. Reproduced here with real exit codes:

| Symptom (curl) | Layer that broke | Reproduction I ran | First command to run |
| --- | --- | --- | --- |
| `(6) Could not resolve host` | DNS | `curl https://nonexistent.invalid/` gave exit 6 | `getent hosts NAME`, then `resolvectl query NAME` |
| `(7) Failed to connect ... Couldn't connect` (instant) | TCP RST: host up, **nothing listening** | `curl http://127.0.0.1:9/` gave exit 7 after 0 ms | `ss -ltn \| grep :PORT` on the server |
| `(28) ... Timeout was reached` (after the full timeout) | TCP SYN dropped: firewall, security group, wrong route | `curl --connect-timeout 2 http://10.255.255.1/` gave exit 28 after 2003 ms | `nc -zv -w 3 HOST PORT`; check security groups and NACLs |
| `(60) SSL certificate problem` | TLS trust: self-signed, expired, missing intermediate, wrong name | `curl https://localhost:8443/` against a self-signed `openssl s_server` gave exit 60; with `--cacert ss.crt` it returned 200 | `openssl s_client -connect H:443 -servername H -showcerts` |
| 502 / 503 / 504 | Proxy reached, **upstream** failed | see the nginx lab in Part 2 | proxy error log, then curl the upstream directly |

*Refused is instant, timeout is slow* is the single most useful distinction: a refusal means a packet got all the way to the host and the kernel answered "no listener" (an `RST`), while a timeout means the packets disappeared, which is almost always a filter in between.

### History in five dates

- **1974**: Cerf and Kahn publish the TCP/IP design paper; the layered split (reliable stream on top of best-effort packets) is why a lost packet is a TCP problem, not an application problem.
- **1983-1987**: DNS replaces the shared `HOSTS.TXT` file (RFC 882/883, then RFC 1034/1035 in 1987); the pain was one file everyone had to copy.
- **1995-2018**: SSL (Netscape) becomes TLS 1.0 (RFC 2246, 1999); TLS 1.2 follows in 2008 (RFC 5246); TLS 1.3 (RFC 8446, 2018) cuts the handshake to one round trip and removes the weak legacy options.
- **2015**: HTTP/2 (RFC 7540, revised as RFC 9113 in 2022) multiplexes streams over one connection.
- **2021-2022**: QUIC (RFC 9000) and HTTP/3 (RFC 9114) move the transport to UDP to escape TCP head-of-line blocking.

🔬 **Section Challenge — Where did the time and the packet go?**

**Challenge 1 (Debugging):** Users in one office report `curl https://api.myapp.com/health` hangs for about two minutes and then fails; everyone else is fine. From the office laptop `getent hosts api.myapp.com` returns an IP immediately. Which layer is broken, what exit code do you expect, and what do you run next?

<details><summary>Answer</summary>

DNS works (the lookup returned instantly), so the failure is after resolution. A long hang followed by failure, rather than an instant error, means **packets are being dropped, not rejected**: the TCP SYN gets no reply. With default `tcp_syn_retries=6` the kernel gives up after roughly two minutes; curl then reports `(7)` "Connection timed out" (or `(28)` if you set `--connect-timeout`). An instant refusal (`(7)` after about 0 ms) would have pointed at a closed port instead. Next: `nc -zv -w 3 api.myapp.com 443` from the office to confirm, `traceroute -T -p 443 api.myapp.com` to see where it dies (not verified here), then ask what is special about that office: its egress NAT IP missing from the server's security-group or WAF allow-list, or a corporate proxy that blocks the destination. Do **not** start with `openssl` or the app logs: nothing reached the app.

</details>

**Challenge 2 (Calculation):** Using the measured timings above (DNS 49 ms, TCP 11 ms, TLS 24 ms, first byte 16 ms), a page needs 30 sequential API calls to the same host. Estimate total network overhead with (a) a new connection per call and no DNS cache, (b) one keep-alive connection.

<details><summary>Answer</summary>

(a) Each call pays at most `49 + 11 + 24 + 16 = 100 ms` before the first byte: 30 x 100 = **3.0 s** (a local DNS cache would remove the 49 ms from calls 2 to 30, giving about 100 + 29 x 51 = 1.6 s). (b) One setup (84 ms) plus 30 x 16 ms first-byte = 84 + 480 = **about 0.56 s**. Keep-alive and HTTP/2 multiplexing are worth roughly a 3x to 5x difference here, and the gap grows with RTT: on a 150 ms intercontinental path every handshake round trip costs 150 ms instead of 11 to 24 ms, while the reused connection pays no handshake at all.

</details>

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
  Used by: CDNs, cache clusters, database sharding, Envoy's ring-hash / Maglev policies.
  (NOT kube-proxy: its iptables mode picks a backend at random, IPVS mode offers rr/lc/sh policies.)
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

    # Open-source nginx has PASSIVE health checks only: a server that errors or times out
    # max_fails times (default 1) within fail_timeout (default 10s) is skipped for fail_timeout.
    # Active probing (health_check) is an nginx Plus feature; HAProxy does it for free (see chapter 11).
    keepalive 32;   # idle connections to upstreams kept for reuse; needs proxy_http_version 1.1
                    # and proxy_set_header Connection "" in the location (set below)
}

upstream static_servers {
    server 10.0.2.10:80;
    server 10.0.2.11:80;
}

server {
    listen 443 ssl;
    http2 on;          # nginx >= 1.25.1; older versions use `listen 443 ssl http2;` (deprecated since 1.25.1)
    server_name api.myapp.com;

    # TLS configuration
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;   # disable old TLS 1.0/1.1!

    # Route /api/* to API servers
    location /api/ {
        proxy_pass http://api_servers;
        proxy_http_version 1.1;               # required for upstream keepalive
        proxy_set_header Connection "";       # drop the default "Connection: close"
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

    # Rate limiting: the zone is DEFINED in the http{} block (above `server`), USED here.
    location /api/v1/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;                 # default is 503, which looks like an outage
        proxy_pass http://api_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}

# In http{}, next to the upstream blocks (a limit_req_zone inside server{} is a hard config error):
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
```

---

## Lab — prove what the nginx config really does

*Verified with nginx 1.24.0 (extracted from the Ubuntu 24.04 package into a home directory and run as a normal user on high ports) and three tiny Python backends on 8001/8002/8003. `http2 on;` needs nginx 1.25.1+, so that one line is **not verified here**.*

**1. The original rate-limit placement is a hard error.** `limit_req_zone` is only legal in `http{}`:

```text
$ nginx -t -c bad.conf        # limit_req_zone placed inside server { }
nginx: [emerg] "limit_req_zone" directive is not allowed here in bad.conf:5
nginx: configuration file bad.conf test failed
```

**2. Weights and `backup`.** Config: `server :8001 weight=3; server :8002 weight=1; server :8003 backup;` and 20 requests:

```text
$ for i in $(seq 20); do curl -s localhost:8080/x | cut -d' ' -f1; done | sort | uniq -c
     15 backend=A
      5 backend=B
```

Exactly 3:1, and the `backup` server C received nothing while A and B were healthy.

**3. Failure and failover, with the client seeing nothing.** Kill A, then send 8 requests:

```text
8 x HTTP 200     (all served by B)
error.log: connect() failed (111: Connection refused) while connecting to upstream ... upstream: "http://127.0.0.1:8001/x"
```

The user saw no error because nginx's default `proxy_next_upstream error timeout` retried the *same request* on the next server, and it marked A as failed for `fail_timeout` (10 s). Kill B too and every response comes from the `backup` server C. The lesson: **a dead backend is invisible to users and visible only in the error log**, so alert on upstream errors, not on user-facing 5xx.

**4. Rate limiting, measured.** `rate=5r/s`, `burst=5 nodelay`, `limit_req_status 429`, 20 requests fired back-to-back:

```text
      6 200
     14 429
```

6 = 1 (the allowed rate) + 5 (the burst). `nodelay` serves the burst immediately instead of spacing it out; without it the extra requests would be queued and delayed to 5 per second. Choose 429 so clients and dashboards can tell "you were throttled" from "we are down" (503).

### Choosing: L4, L7 or neither

| Situation | Choose | Why |
| --- | --- | --- |
| Non-HTTP protocol (database, MQTT, raw TCP), or you must not terminate TLS | L4 (NLB, HAProxy `mode tcp`, IPVS) | no parsing, preserves the TCP stream, lowest latency |
| Route by host/path/header, redirects, per-route rate limits, WAF, retries | L7 (ALB, nginx, Envoy, HAProxy `mode http`) | needs to read the request |
| WebSockets, gRPC streams, long uploads | L7 with `least_conn` and long `proxy_read_timeout` | round-robin spreads *connections* evenly, not *work* |
| One server, no HA requirement, traffic fits | **no load balancer** | an extra hop is an extra failure point and an extra TLS termination to manage |
| Need session stickiness | Fix the app (move the session to Redis) before using `ip_hash` | sticky sessions pin load unevenly and break on every scale event |

`ip_hash` is a trap behind a CDN or a corporate NAT: thousands of users share one source IP, so they all land on one server.

🔬 **Section Challenge — Load balancer behavior**

**Challenge 1 (Reasoning):** After a deploy, the nginx error log fills with `connect() failed (111: Connection refused) while connecting to upstream` for one backend, yet the monitoring dashboard shows 0% 5xx. Is the dashboard wrong?

<details><summary>Answer</summary>

No, and this is the lab above. nginx retries a failed connect on the next upstream inside the same client request, so the client gets a 200 from another server. The error log is the only signal that one backend is out of rotation, and the remaining servers now carry its share (capacity is reduced silently). Alert on the *upstream error rate* (`$upstream_status`, or the `nginx_upstream_*` exporter metrics) and on "healthy backends < N", not just on client-facing 5xx. Also check whether `proxy_next_upstream` was widened to include `http_500`: retrying non-idempotent POSTs on a 500 can double-charge a customer.

</details>

**Challenge 2 (Design):** You set `limit_req zone=api burst=20 nodelay` with `rate=100r/s` keyed on `$binary_remote_addr`. Your API sits behind a CDN. A single abusive client is not stopped, but legitimate users start getting 429s. Why, and what is the fix?

<details><summary>Answer</summary>

Behind the CDN, `$remote_addr` is the CDN edge's address, so the key identifies *the CDN node*, not the user: all users behind that edge share one bucket (innocent users get 429) and the abuser is mixed in. Fix: restore the real client IP with the `realip` module (`set_real_ip_from <CDN ranges>; real_ip_header X-Forwarded-For;` or the CDN's own header such as `CF-Connecting-IP`) and key on that, or key on an API token (`$http_authorization`) instead of the IP. Only trust the forwarded header from the CDN's published ranges, otherwise clients can spoof their own key.

</details>

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
          # GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}  # required for repos owned by an organization
          # (alternative with no license: run the open-source gitleaks CLI directly in a `run:` step)

  sast:
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep          # the old returntocorp/semgrep-action is deprecated; run the CLI image
    steps:
      - uses: actions/checkout@v4
      - name: SAST with Semgrep
        run: semgrep scan --config p/owasp-top-ten --config p/javascript --config p/python --error

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
        uses: aquasecurity/trivy-action@<release-tag-or-full-commit-SHA>   # never @master: a moving branch is a supply-chain hole
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

  The list is revised every few years. The 2025 edition (check owasp.org for the final text) folds SSRF into
  Broken Access Control, moves Security Misconfiguration up to #2, and adds Software Supply Chain Failures and
  Mishandling of Exceptional Conditions. The categories change; the habit (design for abuse) does not.
```

---

## Why shift-left exists, and what each scanner can and cannot see

The pain it fixes is **cost of change over time**: a hard-coded key found in the commit that introduced it costs a `git commit --amend`; the same key found in a pen test six months later costs a rotation across every system that ever saw it, plus a hunt through logs for misuse. Once a secret has been pushed, treat it as leaked: **rotate first, then clean history** (rewriting history does not un-leak a secret that GitHub, forks, CI logs or a clone already holds).

| Tool class | Finds | Misses | Typical false-positive source | Run it |
| --- | --- | --- | --- | --- |
| Secret scan (gitleaks) | committed keys, tokens | secrets typed into a console, stored in a vault with wide access | high-entropy test fixtures | pre-commit **and** CI |
| SAST (Semgrep, CodeQL) | injection patterns, unsafe APIs in your code | logic flaws, runtime config, anything needing data flow it cannot model | pattern matches in dead code | every PR |
| SCA / dependency scan (npm audit, pip-audit, Dependabot) | known CVEs in direct and transitive packages | zero-days, malicious *new* packages | CVEs in code paths you never call | every PR + nightly (new CVEs appear after you merged) |
| Image scan (Trivy) | CVEs in OS packages and language packages in the image | your own app logic | base-image CVEs with no fix available | build, then registry scheduled rescan |
| DAST (ZAP) | what a running app exposes: headers, injection, misconfigured auth | code you did not exercise | tests against a stub environment | staging, per release |
| Runtime (Falco) | shells in containers, unexpected file/syscall activity | slow, legitimate-looking abuse | legitimate debugging sessions | production |

A finding is not a failure of the tool: the real design choice is the **gate policy**. Failing the build on every `HIGH` blocks the team on CVEs with no fix; failing only on `CRITICAL` with a fix available (`--ignore-unfixed` in Trivy) plus a dashboard for the rest is the usual compromise. Keep an expiring allow-list file with a ticket per suppression, otherwise "ignored" becomes permanent.

**Alternatives to a hosted vault.** A Kubernetes `Secret` is base64, not encryption; anyone who can `get secrets` in the namespace can read it, and unless etcd encryption-at-rest is on it is stored in plain text. Options in rising order of effort: sealed secrets (encrypted blob safe to commit, decrypted in-cluster), SOPS (encrypt the values in your Git files with a KMS key), External Secrets Operator or the CSI secrets driver (fetch from AWS/Vault at runtime), and Vault dynamic credentials (short-lived DB users created per request, nothing long-lived to leak). Environment variables are the weakest delivery: they appear in `/proc/<pid>/environ`, in crash dumps, and in `docker inspect`.

```mermaid
flowchart LR
    A["Commit"] --> B["Pre-commit: secret scan"]
    B --> C["CI: SAST + dependency scan"]
    C --> D["Build image"]
    D --> E["Image scan + sign"]
    E --> F["Admission check: signed and scanned only"]
    F --> G["Production"]
    G --> H["Runtime detection"]
    H -.->|"new CVE or incident"| A
```

**How to read this diagram.** Each box is a gate that can stop the change; read left to right in the order a change travels. Cheap, fast checks (secret scan, SAST) are on the left so a developer learns within a minute; slower checks (image scan, signing, admission) sit after the build; the right edge is production detection. The dotted arrow is the part people forget: production findings and newly published CVEs must flow back into the start of the pipeline, otherwise the pipeline only protects the code as it was on the day it was merged.

🔬 **Section Challenge — Secrets and pipeline gates**

**Challenge 1 (Incident):** Gitleaks flags an AWS access key committed 3 weeks ago on a feature branch that was already merged. A teammate proposes `git filter-repo` to delete the key from history and move on. What is wrong with that plan, and what is the correct order?

<details><summary>Answer</summary>

Deleting it from history does not make it safe: the key was readable in the remote, in every clone and fork, in CI logs and caches for 3 weeks, and may already be scraped (public repos are scanned by bots within minutes). Correct order: (1) **revoke/rotate the key now** in IAM; (2) check CloudTrail for use of that key since the commit date; (3) replace it with a vault/OIDC-issued short-lived credential so no long-lived key exists; (4) only then rewrite history if policy requires, and coordinate a force-push and fresh clones; (5) add the pre-commit hook and a CI scan so the next one is caught before the push.

</details>

**Challenge 2 (Trade-off):** Your Trivy step uses `severity: HIGH,CRITICAL` and `exit-code: 1`. After a base-image update the whole organization's builds go red overnight for a CVE that has no patched version. What do you change and what do you refuse to change?

<details><summary>Answer</summary>

Change the policy, not the visibility: add `ignore-unfixed: true` so only vulnerabilities with an available fix break the build, keep the unfixed ones in the report, and record any explicit suppression in a dated, ticketed `.trivyignore` entry that expires. Refuse to (a) set `exit-code: 0` globally (the gate then protects nothing), (b) pin the image forever to avoid the finding (you stop receiving fixes), or (c) let each team keep its own ignore list with no owner. Also check whether the vulnerable package is even present in the final stage of a multi-stage build; moving to a slimmer or distroless base often removes the finding entirely.

</details>

---

# PART 4: Networking for Kubernetes

---

```
KUBERNETES NETWORKING MODEL:
  Every pod gets its own IP address (no NAT, no port mapping).
  Pods on the same node communicate via virtual bridge.
  Pods on different nodes communicate via the CNI plugin: an overlay (flannel VXLAN, Calico IP-in-IP/VXLAN),
  plain routing (Calico BGP, Cilium native routing), or the cloud's own VPC addresses (AWS VPC CNI).

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
    External traffic → cloud LB → NodePort → pod (many clouds can also target pod IPs directly).
    The standard for production web services. One cloud LB PER Service gets expensive: put an
    Ingress/Gateway in front and use a single LB.

  Ingress: HTTP/HTTPS routing rules (like nginx, but K8s-native).
    Route by HOST:  api.myapp.com → api service, www.myapp.com → frontend
    Route by PATH:  /api/* → backend, /static/* → CDN
    TLS termination: Ingress handles HTTPS, pods receive plain HTTP.
    Ingress controllers: ingress-nginx, traefik, AWS Load Balancer Controller.
    Note: the Kubernetes project announced the retirement of ingress-nginx (best-effort maintenance ended
    March 2026) and points new work at the Gateway API (Gateway, HTTPRoute); check the current status
    before choosing a controller. The Ingress API is frozen; Gateway API is where new features land.

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

Three traps when you apply `default-deny-all` above (YAML follows the `networking.k8s.io/v1` schema; not applied to a cluster here, no cluster in my lab):

1. **Egress deny also blocks DNS.** Pods resolve names through CoreDNS in `kube-system`. With `Egress` in `policyTypes` and no allow rule, every `curl http://service` fails with "Could not resolve host", which looks like a DNS bug. Add an egress rule to port 53 (UDP and TCP) toward the DNS pods (select `kube-system` by its `kubernetes.io/metadata.name` label).
2. **The allow-rule on the database is only half the path.** If egress is also default-denied, the *api* pods need an egress rule toward the database on 5432, because both ends are filtered.
3. **A NetworkPolicy object does nothing unless the CNI enforces it.** Calico, Cilium and Antrea enforce; plain flannel does not. `kubectl apply` succeeds either way, so test it: from a pod that should be blocked, `nc -zv -w 2 database 5432` must time out.

---

### Which Service type, and how a packet really reaches a pod

| You need | Use | Not |
| --- | --- | --- |
| Pod-to-pod inside the cluster | `ClusterIP` + DNS name `svc.namespace.svc.cluster.local` | a NodePort or LoadBalancer "because it works" |
| Quick external access on a lab cluster | `NodePort` or `kubectl port-forward` | NodePort in production (every node is now an entry point, port range 30000-32767 is firewall-hostile) |
| One public TCP/UDP service | `LoadBalancer` | many LoadBalancers for many HTTP apps (one cloud LB each) |
| Many HTTP apps behind one address, host/path routing, TLS | Ingress or Gateway API behind a single LoadBalancer | hand-rolled nginx pods you forget to patch |
| Stable DNS to each individual pod (databases, StatefulSets) | headless Service (`clusterIP: None`) | a normal ClusterIP, which load-balances away the identity |

A ClusterIP is not an interface on any machine. It is a **virtual IP rewritten by `kube-proxy` rules** on every node (iptables or IPVS) or by eBPF in Cilium: the packet to `10.96.0.10:80` has its destination replaced by one chosen pod IP before it leaves the node. Consequences you can debug with: `ping` to a ClusterIP fails (no ICMP rule), the Service only works if `kubectl get endpointslices -l kubernetes.io/service-name=NAME` lists ready pod IPs, and a Service whose selector matches no pod has *no endpoints* and returns connection refused or timeouts.

```mermaid
flowchart TD
    C["Client pod resolves my-svc"] --> D["CoreDNS returns ClusterIP"]
    D --> K["Node rules (kube-proxy or eBPF) pick one ready endpoint"]
    K --> P1["Pod A 10.244.1.5"]
    K --> P2["Pod B 10.244.2.7"]
    R["Readiness probe fails"] -.->|"endpoint removed"| K
```

**How to read this diagram.** Follow the solid arrows: the client asks DNS for the Service name, DNS answers with the stable virtual IP, the node's packet rules rewrite that IP to one real pod, and the packet is delivered. The dashed arrow is the control loop that makes this safe: when a pod's readiness probe fails, its address is removed from the endpoint list and new connections stop going to it. Notice that DNS never returns pod IPs for a normal Service, so a pod that is unready is protected even if a client cached the ClusterIP.

🔬 **Section Challenge — Kubernetes networking**

**Challenge 1 (Debugging):** You apply `default-deny-all` (Ingress and Egress) in namespace `production`, then the allow rule for `api -> database`. The API pods now crash-loop with "could not resolve host database". The allow rule is correct. What is missing?

<details><summary>Answer</summary>

Egress from the API pods to the cluster DNS. With `Egress` denied by default, the pod cannot reach CoreDNS in `kube-system` on port 53 (UDP, and TCP for large answers), so name resolution fails before any connection to the database is attempted. Add a NetworkPolicy with an egress rule to `namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: kube-system}}` plus the DNS pod label, ports 53/UDP and 53/TCP. Separately, the API pods still need an egress rule to the database on 5432, because the database's *ingress* rule only opens the receiving side. Verify with `kubectl exec api-pod -- nslookup database` (must succeed) and `nc -zv -w 2 database 5432`.

</details>

**Challenge 2 (Reasoning):** `kubectl get svc web` shows a ClusterIP, but `curl web` from another pod hangs. `kubectl get pods -l app=web` shows 3 pods `Running`. What do you check first and why?

<details><summary>Answer</summary>

`kubectl get endpointslices -l kubernetes.io/service-name=web` (or `kubectl get endpoints web`). If it is empty, the Service has nothing to route to even though pods are Running, which means either the Service `selector` does not match the pod labels (a typo like `app: web` vs `app: webapp`) or the pods are not **Ready** (readiness probe failing, so they are held out of the endpoints). A Running pod is not a Ready pod. Also confirm `targetPort` matches the container's real listening port: `kubectl exec pod -- ss -ltn`.

</details>

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

### When each pattern backfires

| Pattern | Use when | Do NOT use when / failure mode |
| --- | --- | --- |
| Retry with backoff + jitter | failure is transient (connection reset, 503 during a deploy) and the call is **idempotent** | the call is not idempotent (payment POST without an idempotency key), or the dependency is overloaded: retries add load to a system already failing |
| Circuit breaker | a dependency has a failure mode that makes calls slow, not just failed | the threshold is lower than normal error noise (it flaps), or no fallback exists so "open" is just a faster error |
| Bulkhead | one slow dependency must not exhaust shared threads/connections | pools are so small that normal bursts are rejected |
| Timeouts (the one nobody lists) | **always**: every network call needs one | "no timeout" means a stuck dependency holds a thread forever, the root of most cascading failures |

**Retry amplification is arithmetic, not opinion.** If three layers (browser -> gateway -> service -> database) each make up to 3 attempts, one user click can become 3 x 3 x 3 = **27** database attempts exactly when the database is struggling. Rules that keep it safe: retry at *one* layer (usually the edge), set a retry budget (for example at most 10% extra requests), and propagate a deadline so inner calls stop when the outer caller has already given up.

Backoff with full jitter in code (Python, runs as is):

```python
import random, time

def call_with_retry(fn, attempts=5, base=0.1, cap=5.0):
    for n in range(attempts):
        try:
            return fn()
        except ConnectionError:
            if n == attempts - 1:
                raise
            time.sleep(random.uniform(0, min(cap, base * 2 ** n)))   # full jitter: random in [0, backoff]
```

Without the `random.uniform`, 10,000 clients that failed together retry together at 0.1 s, 0.2 s, 0.4 s: the "thundering herd" the text above describes, now as a synchronized wave.

**Liveness probes that check the database kill the whole fleet.** If liveness calls the DB and the DB has a 30-second blip, Kubernetes restarts *every* app pod at once, which then stampede the recovering database with new connection pools. Liveness answers only "is this process wedged?"; dependency health belongs in readiness, and even there prefer degraded responses over hard failure when the dependency is optional.

🔬 **Section Challenge — Reliability patterns**

**Challenge 1 (Calculation):** A service has a 2 s timeout and 3 retries (4 total attempts) with no backoff, called by 500 clients each making 1 request/s. The backend degrades and every call times out. What load does the backend see, and what is the minimal fix?

<details><summary>Answer</summary>

Normal load 500 req/s. Under failure each request makes 4 attempts, but each attempt takes 2 s, so each client has 4 attempts in flight over 8 s while new requests keep arriving every second: in steady state about 500 x 4 = **2,000 req/s** (a 4x amplification) hitting a backend that is already failing, and it holds roughly 2,000 x 2 s = 4,000 connections open. Minimal fix: cap total retries with a budget or a deadline (give up after the caller's own 2 s limit, not after 8 s), add exponential backoff with jitter, and add a circuit breaker so after N consecutive timeouts calls fail in microseconds instead of holding a socket for 2 s.

</details>

---

## 🔗 Cross-References

| Topic                        | Related Content                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **TCP sliding window**       | [Algorithms in Production](../03_Algorithms/13_Algorithms_In_Production.md) — sliding window = TCP flow control |
| **Hash tables (DNS cache)**  | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — hash table → DNS, session store              |
| **MVCC (DB isolation)**      | [SQL Internals Deep](../08_SQL/49_SQL_Internals_Deep.md) — row versioning, xmin/xmax                            |
| **SQL injection (OWASP #3)** | [SQL Security](../08_SQL/33_SQL_Security_Injection.md) — parameterized queries                                  |
| **Saga / circuit breaker**   | [Enterprise Distributed](../10_Enterprise_Systems/09_Distributed_Patterns.md) — Saga, Outbox, CQRS              |
| **Async HTTP (FastAPI)**     | [Python Asyncio](../25_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) — non-blocking I/O                     |
| **React deployment (nginx)** | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) — build → nginx → CDN                       |
| **JavaScript Event Loop**    | [JS V8 Internals](../16_JavaScript/06_JS_Modern_ES6Plus.md) — single-thread, I/O model (like nginx)             |
| **Docker/K8s basics**        | [DevOps Fundamentals](00_DevOps_Fundamentals.md)                                                                |
| **Terraform/Helm/GitOps**    | [DevOps Advanced](01_DevOps_Advanced.md)                                                                        |


---

## Reality Check

**"Network security is the firewall"** — The firewall is one layer of a DEFENSE-IN-DEPTH model, and perimeter-only security is exactly what modern architecture abandoned: once inside the wall, a flat network lets one compromised host reach everything (the lateral-movement path behind most breach escalations), which is why zero-trust replaces "trusted inside" with "verify every connection regardless of origin" (mutual TLS between services, identity-based authorization per request, network segmentation so a breach is contained). The firewall answers "who can reach the perimeter"; the harder and more important question is "what can a compromised internal host reach" — and the perimeter model has no answer.

**"HTTPS everywhere means the network is secure"** — TLS secures data IN TRANSIT against eavesdropping and tampering; it says nothing about the many other network attack surfaces: the service exposed that should not be (the internal admin port reachable from the internet — [servers/ports]' bind-address lesson at security scale), the DNS that can be poisoned or hijacked to redirect your encrypted traffic to an attacker's valid-cert endpoint, the certificate validation your client skipped ("trust all certs" in the HTTP client — TLS with verification disabled is theater), and the traffic ANALYSIS that leaks information even when content is encrypted (who talks to whom, when, how much). Encryption is necessary and narrow.

**"Security groups and firewall rules are set-and-forget"** — Rules ROT toward permissiveness through the path of least resistance: the temporary 0.0.0.0/0 opened to debug and never closed, the rule referencing an IP that got reassigned, the accumulated allow-list nobody dares prune because nobody remembers what breaks. The disciplines that fight the rot are the same as code: least-privilege by default (deny-all, allow specific — the inverse of the convenient allow-all-deny-specific), rules as reviewed IaC ([Terraform]'s plan-review applied to network policy), and periodic audit (the security-group review that finds the three-year-old wildcard). A firewall config is authorization code, and un-reviewed authorization code drifts toward open.

**"Internal traffic is trusted, so we secure the edge"** — The trusted-internal assumption is precisely what a single breach weaponizes: the phished credential, the vulnerable dependency ([security]'s supply chain), the SSRF that turns your own server into an internal client — each converts one foothold into free rein across an unsegmented internal network. Zero-trust's core claim is that "internal" is not an identity: every service authenticates and authorizes every caller (service mesh mTLS making this the default, [service-mesh] chapter), segmentation limits blast radius, and the network is designed assuming a breach WILL happen and asking how far it spreads. The edge-only model optimizes for the attacker who politely stays outside.

**"VPN gives secure remote access"** — VPN grants NETWORK-level access — often the whole internal network to an authenticated device — which is a broad, coarse grant that the compromised laptop then inherits (VPN-in means inside-the-perimeter, and the perimeter model's flaws come along): the modern direction is zero-trust network access / identity-aware proxies that grant per-APPLICATION access based on user AND device posture, per request, with no implicit network membership (reach the one app you are authorized for, not the network it lives on). The VPN's convenience — one connection, everything reachable — is identical to its risk, and "we have a VPN" answers connectivity, not the authorization question that actually contains breaches.
