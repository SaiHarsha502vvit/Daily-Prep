**Navigation**: [< Previous](16_IaC_Terraform.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_Backend_Cloud_Integration.md)

**Developer Essentials Chapter 17** | [← IaC Terraform](16_IaC_Terraform.md) | [Index](../00_MASTER_INDEX.md) | [Next → Backend + Cloud](18_Backend_Cloud_Integration.md)

# Servers, Ports & Networking — The Complete Theory

## 5W1H — Why This Chapter?

WHAT: How computers communicate over networks — servers,
ports, protocols, DNS, firewalls, security groups.

WHY: Every application you build runs ON a server,
communicates THROUGH ports, uses PROTOCOLS to talk.
If you don't understand this, you can't:

- Debug "connection refused" errors
- Configure deployment correctly
- Understand CORS, firewalls, load balancers
- Pass any infrastructure interview question

WHO: Backend and full-stack developers.

WHEN: Before deploying anything. Before interviews.

HOW: Through real-world analogies that make it stick.

---

## WHO: Origin Story

**Networking protocols have evolved through 40 years of internet standardization:**

- **1974** — Vint Cerf and Bob Kahn published "A Protocol for Packet Network Interconnection" (IEEE Transactions on Communications), laying the theoretical foundation for TCP/IP.
- **1983** — ARPANET officially switched from NCP to TCP/IP on January 1 ("flag day"). This is the official birth of the modern Internet. Paul Mockapetris invented DNS, publishing RFC 882/883 (later superseded by RFC 1034/1035 in 1987).
- **1991** — Tim Berners-Lee at CERN introduced HTTP/0.9, a single-line protocol: `GET /page.html\r\n`. No headers, no status codes, no verbs beyond GET. The World Wide Web was born.
- **1996** — HTTP/1.0 published as RFC 1945, adding headers, POST/HEAD methods, status codes, and content negotiation. The Web became a programmable platform.
- **1999** — HTTP/1.1 published as RFC 2616, adding persistent connections (keep-alive), chunked transfers, virtual hosting. This remained the dominant protocol for 15 years.
- **1999** — TLS 1.0 (SSL 3.0 successor) published as RFC 2246, enabling encrypted HTTPS at web scale. SSL 3.0 deprecated due to POODLE attack in 2014.
- **2008** — TLS 1.2 published as RFC 5246, adding SHA-256 signatures and AES-GCM cipher suites. TLS 1.2 remains the minimum recommended version into the 2020s.
- **2009** — Google began developing SPDY ("speedy"), an experimental protocol to reduce web latency. SPDY introduced header compression, multiplexing, and server push — the foundations of HTTP/2.
- **2015** — HTTP/2 published as RFC 7540, based directly on Google's SPDY (2009-2015). Binary framing, multiplexing, header compression (HPACK) became standard in all major browsers by 2016.
- **2018** — TLS 1.3 published as RFC 8446, reducing handshake from 2 RTTs to 1 (or 0-RTT resumption), removing insecure cipher suites, and improving forward secrecy. Dramatically faster and more secure.
- **2022** — HTTP/3 published as RFC 9114, based on Google's QUIC protocol (2013). Uses UDP instead of TCP, eliminating head-of-line blocking — the primary remaining performance limitation of HTTP/2.
- **2000** — Roy Fielding's doctoral dissertation "Architectural Styles and the Design of Network-based Software Architectures" formalized REST (Representational State Transfer), providing the constraints (client-server, stateless, cacheable, uniform interface) that modern web APIs are built on.

**Key references:**
- Vint Cerf & Bob Kahn — "A Protocol for Packet Network Interconnection" (1974) — The foundational paper for TCP/IP; established the concept of packet switching and network-layer addressing that the entire Internet runs on.
- Paul Mockapetris — DNS specification (1983, RFC 882/883; 1987 RFC 1034/1035) — The phone book of the Internet; enabled human-readable domain names as the primary interface to IP addresses, without which modern web hosting, load balancing, and CDN routing would be impossible.
- Tim Berners-Lee — HTTP/0.9 (1991) — The original web protocol; a single GET command over a TCP connection. Every subsequent HTTP version descends from this single-line protocol.
- Google Chromium Team — SPDY (2009-2015) — The experimental foundation of HTTP/2; demonstrated that binary framing and multiplexing could halve page load times.
- Roy Fielding — REST dissertation (2000) — The architectural foundation for modern web APIs; REST constraints (statelessness, cacheability, uniform interface) are what enable CD pipelines, API gateways, and microservices to interoperate reliably.

**The networking invariant**: "Every network request flows through 7 layers of the OSI model, and failure at any layer produces a specific, named symptom."

- Layer 1-2 failure (physical/data link): cable disconnected, switch down → no link light, ARP fails silently
- Layer 3 failure (network): wrong subnet, router down → "no route to host", packets silently dropped
- Layer 4 failure (transport): port closed, firewall blocks → "connection refused" (TCP RST received) vs "connection timed out" (packets dropped silently)
- Layer 7 failure (application): server crashed, app returns 500 → HTTP status code; connection is open, request fails

This invariant predicts failure: when a connection fails, knowing WHICH layer broke down tells you exactly where to look. "Connection refused" → check the listening process (Layer 4/7 boundary). "Connection timed out" → check the network path (firewalls, security groups, routing). "DNS not found" → check name resolution. The diagnostic tree starts at the symptom and walks down through the layers.

---

## 1. What Is a Server?

```
ANALOGY: A Server is a RESTAURANT

┌──────────────────────────────────────────────────────────┐
│                                                          │
│  RESTAURANT (= Server)                                   │
│  ├── Has an ADDRESS (IP address = 192.168.1.100)         │
│  ├── Is OPEN at certain hours (server process running)   │
│  ├── Has a MENU (API endpoints)                          │
│  ├── Takes ORDERS (HTTP requests)                        │
│  ├── Cooks FOOD (processes request, queries DB)          │
│  ├── Serves DISHES (HTTP response with data)             │
│  └── Has multiple COUNTERS (ports)                       │
│      ├── Counter 80  → regular food (HTTP)               │
│      ├── Counter 443 → premium food (HTTPS)              │
│      └── Counter 22  → staff-only entrance (SSH)         │
│                                                          │
└──────────────────────────────────────────────────────────┘

TECHNICALLY:
• A server is just a computer running a program that
  LISTENS for incoming connections.
• Your laptop can be a server (localhost).
• AWS EC2, Azure VM = servers in the cloud.
• "Server" = the software (Tomcat, Nginx), not the hardware.
```

---

## 2. IP Addresses — The Complete Picture

```
IP ADDRESS = The mailing address of a computer on a network

IPv4:  192.168.1.100  (4 numbers, 0-255 each)
IPv6:  2001:0db8:85a3:0000:0000:8a2e:0370:7334 (longer)

SPECIAL ADDRESSES:
┌─────────────────┬────────────────────────────────────────┐
│ 127.0.0.1       │ localhost — YOUR machine (loopback)    │
│ 0.0.0.0         │ "All interfaces" — listen on every     │
│                  │ network adapter the machine has       │
│ 192.168.x.x     │ Private network (your home WiFi)       │
│ 10.x.x.x        │ Private network (corporate/cloud)      │
│ 172.16-31.x.x   │ Private network (alternative range)    │
│ Public IPs       │ Unique, routable on the internet      │
└─────────────────┴────────────────────────────────────────┘

ANALOGY:
• 127.0.0.1 = "my house" (always refers to yourself)
• 192.168.x.x = "street addresses in a gated community"
•   (only reachable WITHIN the community)
• Public IP = "full postal address reachable by anyone"
```

---

## 3. Ports — Deep Dive

```
PORT = Which DOOR on the server to knock on (0-65535)

ANALOGY: An office building has ONE address (IP),
but MANY office rooms (ports).
├── Room 80  → Web server (HTTP)
├── Room 443 → Secure web server (HTTPS)
├── Room 22  → SSH (remote login)
├── Room 3306 → MySQL database
└── Room 8080 → Your Spring Boot app

WELL-KNOWN PORTS (0-1023):
┌──────┬──────────────────────────────────────────────────┐
│ Port │ Service          │ What It Does                  │
├──────┼──────────────────┼───────────────────────────────┤
│ 20   │ FTP (data)       │ File transfer                 │
│ 21   │ FTP (control)    │ File transfer commands        │
│ 22   │ SSH              │ Secure remote login           │
│ 25   │ SMTP             │ Send email                    │
│ 53   │ DNS              │ Domain name resolution        │
│ 80   │ HTTP             │ Web traffic (unencrypted)     │
│ 443  │ HTTPS            │ Web traffic (encrypted/TLS)   │
└──────┴──────────────────┴───────────────────────────────┘

DEVELOPER PORTS (commonly used):
┌──────┬──────────────────────────────────────────────────┐
│ 3000 │ React dev server (Vite), Express.js              │
│ 3306 │ MySQL                                            │
│ 5432 │ PostgreSQL                                       │
│ 5173 │ Vite dev server (default)                        │
│ 6379 │ Redis                                            │
│ 8080 │ Spring Boot / Tomcat                             │
│ 8443 │ Spring Boot HTTPS                                │
│ 9092 │ Apache Kafka                                     │
│ 27017│ MongoDB                                          │
└──────┴──────────────────────────────────────────────────┘

WHY "Port already in use"?
→ Another program is already listening on that port.
→ Fix: kill the other process, or change your port.
→ Spring Boot: server.port=8081 in application.properties
```

---

## 4. Protocols — How Computers Talk

```
PROTOCOL = Agreed-upon language/rules for communication

ANALOGY: Like languages — if you speak English and the
other person speaks French, communication fails.
Both sides must agree on the same protocol.

THE NETWORK LAYER CAKE:

┌────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (what you code with)                │
│  HTTP, HTTPS, WebSocket, gRPC, SMTP, FTP               │
│  "I want to GET /api/users"                            │
├────────────────────────────────────────────────────────┤
│  TRANSPORT LAYER                                       │
│  TCP (reliable, ordered) or UDP (fast, unreliable)     │
│  "Break into packets, ensure delivery"                 │
├────────────────────────────────────────────────────────┤
│  NETWORK LAYER                                         │
│  IP (Internet Protocol)                                │
│  "Route packets from source IP to destination IP"      │
├────────────────────────────────────────────────────────┤
│  PHYSICAL LAYER                                        │
│  Ethernet, WiFi, Fiber                                 │
│  "Actual electrical/light signals on wire"             │
└────────────────────────────────────────────────────────┘

TCP vs UDP:
┌─────────────┬───────────────────────────────────────────┐
│ TCP         │ Reliable, ordered. Like certified mail.   │
│             │ Used for: HTTP, email, file transfer      │
│             │ "Guarantees every packet arrives"         │
├─────────────┼───────────────────────────────────────────┤
│ UDP         │ Fast, no guarantee. Like shouting.        │
│             │ Used for: Video calls, gaming, DNS        │
│             │ "Some packets lost? That's okay"          │
└─────────────┴───────────────────────────────────────────┘
```

---

## 5. HTTP / HTTPS — What Developers Use Most

```
HTTP REQUEST ANATOMY:

GET /api/users?role=admin HTTP/1.1     ← Method + Path + Version
Host: api.example.com                   ← Which server
Authorization: Bearer eyJhbGc...        ← Auth token
Accept: application/json                ← "I want JSON back"
Content-Type: application/json          ← "I'm sending JSON"

{"name": "Alice"}                       ← Body (POST/PUT only)

HTTP RESPONSE:

HTTP/1.1 200 OK                         ← Status code
Content-Type: application/json
Set-Cookie: session=abc123

[{"id": 1, "name": "Alice"}]            ← Response body

STATUS CODES (memorize these):
┌──────┬──────────────────────────────────────────────────┐
│ 200  │ OK — success                                     │
│ 201  │ Created — new resource made (POST success)       │
│ 204  │ No Content — success, nothing to return (DELETE) │
│ 301  │ Moved Permanently — URL changed forever          │
│ 302  │ Found — temporary redirect                       │
│ 400  │ Bad Request — your input is wrong                │
│ 401  │ Unauthorized — not logged in                     │
│ 403  │ Forbidden — logged in but no permission          │
│ 404  │ Not Found — resource doesn't exist               │
│ 409  │ Conflict — duplicate entry, state mismatch       │
│ 429  │ Too Many Requests — rate limited                 │
│ 500  │ Internal Server Error — server crashed           │
│ 502  │ Bad Gateway — proxy can't reach backend          │
│ 503  │ Service Unavailable — server overloaded          │
│ 504  │ Gateway Timeout — backend took too long          │
└──────┴──────────────────────────────────────────────────┘

HTTPS = HTTP + TLS/SSL encryption
→ All data encrypted in transit
→ Browser shows padlock icon
→ Requires SSL certificate (Let's Encrypt = free)
→ MANDATORY for any production site
```

---

🔬 **Section Challenge — 5. HTTP / HTTPS — What Developers Use Most**

**Challenge 1 (Reasoning — Who/When/What):** HTTPS adds a TLS handshake before data flows. **Who** performs it? **When** does it happen? **What** is the performance impact in modern TLS 1.3 vs TLS 1.2?\n\n<details><summary>Answer</summary>\n\n**Who performs?** Client and server together — the client sends a `ClientHello`, server responds with its certificate + chosen cipher suite, then keys are exchanged. **When?** On the FIRST TCP connection to a server (or after connection timeout). Subsequent requests on the same connection (HTTP keep-alive or HTTP/2) reuse the already-negotiated TLS session. **TLS 1.2:** 2 round-trips before data (1 for TCP, 1 for TLS) — ~200ms on transatlantic connections. **TLS 1.3:** Only 1 round-trip for new connections; supports **0-RTT** (zero round-trip) for resumed sessions — client sends data in the FIRST packet. **Practical impact:** Modern HTTPS with HTTP/2 + TLS 1.3 has negligible overhead vs HTTP, often faster due to binary protocol + HPACK compression.\n\n</details>

## 6. DNS — How Names Become IP Addresses

```
DNS = Domain Name System

ANALOGY: DNS is the phone book of the internet.
You know the NAME (google.com) but need the NUMBER (142.x.x.x)

WHAT HAPPENS when you type google.com:

1. Browser checks its cache
   (Have I looked this up recently?)
2. OS checks its cache
   (Has any app on this machine looked it up?)
3. Router / ISP DNS cache
4. If not cached → RECURSIVE DNS QUERY:

Your Computer
  │
  ├──→ Root DNS Server         "Who handles .com?"
  │    └──→ .com TLD Server    "Who handles google.com?"
  │         └──→ Google's NS   "google.com = 142.250.80.46"
  │
  ← ─── IP address returned (and cached for next time)

DNS RECORDS:
┌─────────┬────────────────────────────────────────────────┐
│ A       │ Maps domain → IPv4 address                     │
│ AAAA    │ Maps domain → IPv6 address                     │
│ CNAME   │ Alias: app.example.com → example.com           │
│ MX      │ Mail server for the domain                     │
│ TXT     │ Verification records (SPF, DKIM for email)     │
│ NS      │ Which DNS server is authoritative              │
└─────────┴────────────────────────────────────────────────┘

TTL (Time To Live): How long to cache the record.
Low TTL (60s) = changes propagate fast but more DNS queries.
High TTL (86400s) = fewer queries but changes are slow.

### Diagram: DNS Resolution with Timing

```
USER TYPES: example.com
       │
       ▼
┌─────────────────┐
│ 1. Browser cache │ 0ms (check first)
└────────┬────────┘
         ▼ (miss)
┌─────────────────┐
│ 2. OS cache      │ 1ms (resolv.conf)
└────────┬────────┘
         ▼ (miss)
┌─────────────────┐
│ 3. Recursive     │ 5-50ms
│    Resolver      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. Root (. )     │ 50-200ms (13 root servers)
│    TLD (.com)    │ 100-300ms (com TLD)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. Authoritative │ 50-200ms (example.com NS)
└────────┬────────┘
         ▼
   IP: 93.184.216.34
   TTL: 86400s (cache for 24h)

Total worst case: ~600ms (cold cache)
```
```

---

🔬 **Section Challenge — 6. DNS — How Names Become IP Addresses**

**Challenge 1 (Reasoning):** Your service's DNS TTL is 300s. You deploy to a new IP. When is traffic fully migrated?

<details><summary>Answer</summary>

Not immediately — each DNS resolver caches the old IP for up to its remaining TTL (up to 300s). As resolvers' caches expire, they re-query and get the new IP. Some ISP resolvers ignore TTL (cap at 5-10 minutes). Full migration: typically 5-30 minutes in practice despite low TTL. Strategy: lower TTL to 60s ONE WEEK before migration. After migration confirmed, restore TTL to normal. Never start migration with a high TTL (24h).

</details>

## 7. Firewalls & Security Groups

```
FIREWALL = The bouncer at the door

ANALOGY: Your server is a building.
The firewall is the security guard who checks:
• "Are you on the guest list?" (allowed IP?)
• "Which room are you visiting?" (allowed port?)
• "Are you entering or leaving?" (inbound vs outbound?)

┌──────────────────────────────────────────────────────────┐
│                     FIREWALL RULES                       │
│                                                          │
│  INBOUND (traffic coming IN to your server):             │
│  ┌────────┬──────────┬───────────────┬──────────┐        │
│  │ Port   │ Protocol │ Source        │ Action   │        │
│  ├────────┼──────────┼───────────────┼──────────┤        │
│  │ 22     │ TCP      │ My IP only    │ ALLOW    │        │
│  │ 80     │ TCP      │ 0.0.0.0/0    │ ALLOW    │         │
│  │ 443    │ TCP      │ 0.0.0.0/0    │ ALLOW    │         │
│  │ 3306   │ TCP      │ App server IP │ ALLOW    │        │
│  │ *      │ *        │ *             │ DENY     │        │
│  └────────┴──────────┴───────────────┴──────────┘        │
│                                                          │
│  MEANING:                                                │
│  • SSH: Only I can connect (my IP)                       │
│  • HTTP/HTTPS: Anyone on internet can access             │
│  • MySQL: Only the app server can connect                │
│  • Everything else: BLOCKED                              │
└──────────────────────────────────────────────────────────┘

CLOUD SECURITY GROUPS (AWS/Azure):

Security Group = Virtual firewall for cloud resources
ANALOGY: Like a gated community with rules:

┌── Web Server SG ───────────────────────────────────────┐
│ Allow port 80, 443 from ANYWHERE (public internet)     │
│ Allow port 22 from MY IP only                          │
└────────────────────────────────────────────────────────┘
                     │ Can talk to ↓
┌── App Server SG ───────────────────────────────────────┐
│ Allow port 8080 from Web Server SG ONLY                │
│ No public access!                                      │
└────────────────────────────────────────────────────────┘
                     │ Can talk to ↓
┌── Database SG ─────────────────────────────────────────┐
│ Allow port 3306 from App Server SG ONLY                │
│ No public access! No direct web access!                │
└────────────────────────────────────────────────────────┘

This is the PRINCIPLE OF LEAST PRIVILEGE:
Each layer can ONLY talk to the layer it needs.
Database is NEVER directly accessible from the internet.
```

---

🔬 **Section Challenge — 7. Firewalls & Security Groups**

**Challenge 1 (Reasoning):** JWT vs session cookies — what are the tradeoffs for a distributed microservices architecture?

<details><summary>Answer</summary>

JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed.

</details>

## 8. Load Balancers & Reverse Proxies

```
LOAD BALANCER = Traffic cop that distributes requests

WHY: One server can handle ~1000 requests/second.
What if you get 10,000? You need MULTIPLE servers.
Load balancer distributes traffic across them.

ANALOGY: Like a restaurant host who seats customers
at different tables to balance the load on waiters.

Internet Users
    │ │ │ │ │
    ▼ ▼ ▼ ▼ ▼
┌──────────────────┐
│  LOAD BALANCER   │  (Nginx, AWS ALB, Azure LB)
│  (Single entry)  │
└───┬───┬───┬──────┘
    │   │   │
    ▼   ▼   ▼
[App 1][App 2][App 3]   ← Same application, 3 copies

STRATEGIES:
• Round Robin: 1→2→3→1→2→3 (rotate equally)
• Least Connections: send to server with fewest active requests
• IP Hash: same client always goes to same server (sessions)
• Weighted: server with more CPU gets more traffic

REVERSE PROXY (Nginx):
Sits in front of your app server. Handles:
• SSL termination (HTTPS → HTTP internally)
• Static file serving (faster than app server)
• Caching responses
• Rate limiting
• Compression (gzip/brotli)
```

---

🔬 **Section Challenge — 8. Load Balancers & Reverse Proxies**

**Challenge 1 (Reasoning):** Round-robin load balancing sends requests to servers 1,2,3,1,2,3. Why does this fail for stateful sessions?

<details><summary>Answer</summary>

Session data (shopping cart, auth state) is stored on ONE server. Round-robin sends the NEXT request to a different server which has NO session data → user is logged out, cart is empty. Solutions: (1) Sticky sessions (session affinity) — LB routes user to the same server based on cookie. Single point of failure risk. (2) Externalize session to Redis — all servers share one session store. (3) Stateless auth (JWT) — no server-side session needed. Modern preference: stateless design + JWT.

</details>

## 9. The Full Request Journey

```
What happens when you type "https://myapp.com/api/users":

1. BROWSER: "I need the IP for myapp.com"
   └→ DNS lookup → 54.23.100.50

2. BROWSER → PORT 443 at 54.23.100.50
   └→ TCP handshake (SYN → SYN-ACK → ACK)
   └→ TLS handshake (negotiate encryption)

3. REQUEST hits LOAD BALANCER
   └→ Chooses Server 2 (least connections)

4. REQUEST hits REVERSE PROXY (Nginx on Server 2)
   └→ Strips SSL, forwards to localhost:8080

5. REQUEST hits SPRING BOOT (port 8080)
   └→ DispatcherServlet → Controller → Service → Repository
   └→ Repository queries DATABASE (port 3306)
   └→ Database returns rows
   └→ Service applies business logic
   └→ Controller returns ResponseEntity<List<User>>

6. RESPONSE travels back:
   Spring Boot → Nginx → Load Balancer → Internet → Browser

7. BROWSER: Receives JSON, React updates the UI.

Total time: 100-500ms for a typical API call.
```

---

## 10. Common Networking Errors (What They Mean)

Error │ Cause → Fix
───────────────────────────────┼────────────────────────────────
Connection refused │ Nothing running on that port.
│ Start the server! Check port.
│
Connection timed out │ Firewall blocking, wrong IP,
│ server unreachable. Check SG.
│
Port already in use │ Another process has the port.
│ Kill it or use different port.
│
ECONNRESET │ Other side closed connection.
│ Server crashed mid-request.
│
DNS resolution failed │ Domain doesn't exist or DNS
│ server down. Check domain name.
│
CORS error (browser only) │ Server doesn't allow your
│ origin. Add CORS headers.
│
SSL handshake failed │ Certificate expired or invalid.
│ Renew cert. Check date/domain.
│
502 Bad Gateway │ Load balancer can't reach
│ backend. Backend is down.

---

🔬 **Section Challenge — 10. Common Networking Errors (What They Mean)**

**Challenge 1 (Connection Refused vs Timed Out):** A Spring Boot app deployed on EC2 port 8080 works fine when curled via `localhost:8080` from SSH, but the public IP `http://1.2.3.4:8080` gives "Connection timed out". What are the two most likely causes at the infrastructure layer?

<details><summary>Answer</summary>

"Connection timed out" means TCP SYN packets are dropped and never reach the application. Causes: (1) **Cloud Firewall (Security Group)**: The AWS Security Group attached to the EC2 instance doesn't have an inbound rule allowing TCP port 8080 from `0.0.0.0/0` (or your IP). (2) **OS Firewall (iptables/ufw)**: The Linux firewall is blocking port 8080. **Crucial distinction**: If it were a Spring Boot configuration issue (e.g., binding to `127.0.0.1` instead of `0.0.0.0`), you would get "Connection refused", NOT "Connection timed out". A timeout specifically implies the network packet was silently dropped before the OS could even reject it.

</details>

**Challenge 2 (502 During Traffic Spikes):** The same application is put behind an Nginx reverse proxy. Nginx handles SSL and forwards to Spring Boot on `localhost:8080`. Users report occasional "502 Bad Gateway" errors during traffic spikes. Spring Boot logs show no crashes. What is happening?

<details><summary>Answer</summary>

"502 Bad Gateway" means the proxy (Nginx) tried to connect to the upstream (Spring Boot), but the upstream failed to respond or accept the connection. Since Spring isn't crashing, it's **resource exhaustion at the connection layer**: (1) **Tomcat Thread Pool Exhaustion**: Spring Boot defaults to 200 max threads. During a spike, if all 200 are busy, new connections from Nginx are queued or rejected. Nginx gives up and returns 502. (2) **Keep-Alive race condition**: Nginx reuses TCP connections to Spring Boot. If Spring Boot closes an idle connection exactly as Nginx sends a new request on it, Nginx gets a connection reset (ECONNRESET) and returns 502. Fix: Ensure Tomcat's `server.tomcat.keep-alive-timeout` is slightly LONGER than Nginx's `keepalive_timeout` so Nginx is always the one to close idle connections.

</details>

### Production Reality

**Server, port, and networking configurations fail in production in these named ways:**

- **Connection pool exhaustion** — HikariCP default maximum pool size of 10 connections per instance times 20 auto-scaled instances = 200 total connections to the database. Under a traffic spike (Black Friday), database max_connections=100 is exceeded. New requests queue behind connection checkout, p99 latency climbs from 50ms to 30,000ms, then the application returns 503. Cloudflare 2019 postmortem: connection pool saturation at the edge caused a cascade of 503s during a DDoS mitigation.
- **DNS TTL misconfiguration** — a 24-hour DNS TTL on the API endpoint blocks emergency failover. When the primary load balancer fails at midnight, traffic cannot be routed to the backup until the next day. Conversely, a 60-second TTL creates 1,440 DNS queries/day per resolver, adding latency and risk of DNS provider rate limiting. Correct production pattern: TTL=300s normally, lower to 60s during planned migrations.
- **Load balancer sticky session failure** — sticky sessions (session affinity by cookie) route user requests to the same backend instance. When that instance is killed during a rolling deployment, the user loses their session state with no fallback. All sticky sessions for the dead instance hit the new instance which has no session data. 100% of those users see "session expired" simultaneously during a deployment.
- **TLS handshake timeout under DDoS** — TLS 1.2 handshake costs ~1ms CPU per connection (asymmetric cryptography). A SYN flood with 50,000 spoofed IPs exhausts the server's CPU before any application payload arrives. Cloudflare's mitigation (2019): offload TLS termination to the edge; the origin server only handles established connections. On origin, use `ssl_preread` in Nginx to decrypt once and reuse for upstream connections.
- **Firewall rule explosion** — adding allow-rules without reviewing creates an overly permissive security group that defeats the purpose of the firewall. Each overly permissive rule is a potential entry point. OWASP recommendation: "default deny" + explicit allow-only. Real pattern: a developer adds `0.0.0.0/0` on port 22 for a temporary fix; the rule stays for 2 years; credential stuffing attacks against port 22 begin immediately.

**Debug workflow:** For connection pool exhaustion: monitor `HikariPool.getActiveConnections()` via JMX; for DNS TTL issues: `dig +time=1 +tries=1` to check propagation; for sticky session failures: look for spike in "session created" logs coinciding with deployment timestamps.
**Mitigation discipline:** Configure HikariCP pool size as `((core_count * 2) + effective_spindle_count)` for on-prem; for cloud RDS use connection pooler (RDS Proxy, PgBouncer). Set DNS TTL as a deployment parameter. Use stateless auth (JWT) instead of sticky sessions. Offload TLS at the edge (CloudFront, ALB). Run quarterly security group audits: for every rule, verify the source CIDR is the minimum necessary.

**Why this matters for networking:** The modern developer inherits 40 years of accumulated protocol decisions. HTTP/1.1's keep-alive persists connections; HTTP/2's multiplexing eliminates head-of-line blocking; TLS 1.3's handshake reduction cuts latency by half. Understanding the evolutionary path explains WHY protocols behave as they do — and why "connection refused" errors happen at specific layers of the stack.

---

## Interview Quick-Fire

```
Q: What's the difference between HTTP and HTTPS?
→ HTTPS = HTTP + TLS encryption. All data encrypted in transit.
  HTTP sends data as plain text (anyone can intercept).
  HTTPS uses SSL/TLS certificates. Mandatory for production.

Q: What is a port and why does it matter?
→ A port is a number (0-65535) that identifies which SERVICE
  on a machine should handle the request. Like a room number
  in a building. Port 80 = HTTP, 443 = HTTPS, 8080 = Spring Boot.

Q: What is a security group?
→ Virtual firewall in the cloud. Rules that say "allow traffic
  on port X from source Y." You create separate groups for
  web tier, app tier, database tier — each with minimal access.

Q: What's the difference between a load balancer and reverse proxy?
→ Load balancer: distributes traffic across multiple server copies.
  Reverse proxy: sits in front of ONE server, handles SSL, caching,
  static files, rate limiting. Nginx can do BOTH.

Q: Explain what happens when I visit a URL.
→ DNS lookup → TCP connection → TLS handshake → HTTP request
  → Load balancer → App server → Database query → Response
  back through entire chain → Browser renders HTML/JSON.
```

---

[← IaC Terraform](16_IaC_Terraform.md) | [Index](../00_MASTER_INDEX.md) | [Next → Backend + Cloud](18_Backend_Cloud_Integration.md)
