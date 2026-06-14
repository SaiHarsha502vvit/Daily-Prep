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

| Topic                  | Related Content                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Consistent hashing** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md)                    |
| **TCP load balancing** | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — kube-proxy, IPVS                        |
| **HTTP routing**       | [Ch 08: HTTP](08_HTTP_Complete.md) — headers, methods                               |
| **TLS termination**    | [Ch 09: TLS](09_TLS_Encryption.md) — certificates for nginx                         |
| **K8s Ingress**        | [Networking & Security](02_Networking_Security.md) — Ingress controllers            |
| **Service mesh**       | [Cloud Native](03_ServiceMesh_CloudNative.md) — Envoy proxy                         |
| **React deployment**   | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) — build → nginx |
| **CSS CDN**            | [CSS Modern](../18_CSS_Complete/04_CSS_Modern_Architecture.md) — versioned assets   |
