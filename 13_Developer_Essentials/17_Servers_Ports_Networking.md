**Navigation**: [< Previous](16_IaC_Terraform.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_Backend_Cloud_Integration.md)

**Developer Essentials Chapter 17** | [← IaC Terraform](16_IaC_Terraform.md) | [Index](../00_MASTER_INDEX.md) | [Next → Backend + Cloud](18_Backend_Cloud_Integration.md)

# Servers, Ports & Networking — The Complete Theory

## 5W1H — Why This Chapter?


WHAT: How computers communicate over networks — servers,
ports, protocols, DNS, firewalls, security groups.

WHY:  Every application you build runs ON a server,
communicates THROUGH ports, uses PROTOCOLS to talk.
If you don't understand this, you can't:
- Debug "connection refused" errors
- Configure deployment correctly
- Understand CORS, firewalls, load balancers
- Pass any infrastructure interview question

WHO:  Backend and full-stack developers.

WHEN: Before deploying anything. Before interviews.

HOW:  Through real-world analogies that make it stick.


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

**Flow:**
1. ANALOGY: A Server is a RESTAURANT
2. RESTAURANT (= Server)
3. Has an ADDRESS (IP address = 192.168.1.100)
4. Is OPEN at certain hours (server process running)
5. Has a MENU (API endpoints)
6. Takes ORDERS (HTTP requests)
7. Cooks FOOD (processes request, queries DB)

```mermaid
flowchart TD
    N1["ANALOGY: A Server is a RESTAURANT"]
    N2["RESTAURANT (= Server)"]
    N3["Has an ADDRESS (IP address = 192.168.1.100)"]
    N4["Is OPEN at certain hours (server process running)"]
    N5["Has a MENU (API endpoints)"]
    N6["Takes ORDERS (HTTP requests)"]
    N7["Cooks FOOD (processes request, queries DB)"]
    N8["Serves DISHES (HTTP response with data)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
1. IP ADDRESS = The mailing address of a computer on a net
2. IPv4: 192.168.1.100 (4 numbers, 0-255 each)
3. IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 (longer)
4. SPECIAL ADDRESSES:
5. 127.0.0.1 localhost — YOUR machine (loopback)
6. 0.0.0.0 'All interfaces' — listen on every
7. network adapter the machine has

```mermaid
flowchart TD
    N1["IP ADDRESS = The mailing address of a computer on a net"]
    N2["IPv4: 192.168.1.100 (4 numbers, 0-255 each)"]
    N3["IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 (longer)"]
    N4["SPECIAL ADDRESSES:"]
    N5["127.0.0.1 localhost — YOUR machine (loopback)"]
    N6["0.0.0.0 'All interfaces' — listen on every"]
    N7["network adapter the machine has"]
    N8["192.168.x.x Private network (your home WiFi)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
1. Port Service What It Does / 20 FTP (data) File transfer
2. 3000 React dev server (Vite), Express.js / 3306 MySQL /

```mermaid
flowchart TD
    N1["Port Service What It Does / 20 FTP (data) File transfer"]
    N2["3000 React dev server (Vite), Express.js / 3306 MySQL /"]
    N1 --> N2
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

**Flow:**
1. PROTOCOL = Agreed-upon language/rules for communication
2. ANALOGY: Like languages — if you speak English and the
3. other person speaks French, communication fails.
4. Both sides must agree on the same protocol.
5. THE NETWORK LAYER CAKE:
6. APPLICATION LAYER (what you code with)
7. HTTP, HTTPS, WebSocket, gRPC, SMTP, FTP

```mermaid
flowchart TD
    N1["PROTOCOL = Agreed-upon language/rules for communication"]
    N2["ANALOGY: Like languages — if you speak English and the"]
    N3["other person speaks French, communication fails."]
    N4["Both sides must agree on the same protocol."]
    N5["THE NETWORK LAYER CAKE:"]
    N6["APPLICATION LAYER (what you code with)"]
    N7["HTTP, HTTPS, WebSocket, gRPC, SMTP, FTP"]
    N8["'I want to GET /api/users'"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
1. HTTP REQUEST ANATOMY:
2. Host: api.example.com ← Which server
3. Authorization: Bearer eyJhbGc... ← Auth token
4. Accept: application/json ← 'I want JSON back'
5. Content-Type: application/json ← 'I'm sending JSON' {'name': 'Alice'} ← Body (POST/PUT only) HTTP RESPONSE:

```mermaid
flowchart TD
    N1["HTTP REQUEST ANATOMY:"]
    N2["Host: api.example.com ← Which server"]
    N3["Authorization: Bearer eyJhbGc... ← Auth token"]
    N4["Accept: application/json ← 'I want JSON back'"]
    N5["Content-Type: application/json ← 'I'm sending JSON'"]
    N6["{'name': 'Alice'} ← Body (POST/PUT only)"]
    N7["HTTP RESPONSE:"]
    N8["HTTP/1.1 200 OK ← Status code"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---



🔬 **Section Challenge — 5. HTTP / HTTPS — What Developers Use Most**

**Challenge 1 (Reasoning):** `Connection: keep-alive` vs HTTP/2 — what does each one do differently for multiplexing?
<details><summary>Answer</summary>

HTTP/1.1 keep-alive: reuse ONE TCP connection for sequential requests. Still head-of-line blocking — request 2 waits for response 1. HTTP/2: one TCP connection, but requests are multiplexed as frames with stream IDs. Multiple requests in-flight simultaneously. Response frames for different streams are interleaved. HTTP/2 also has header compression (HPACK) and server push. Still has TCP HOL blocking (one lost packet blocks all streams). HTTP/3 (QUIC): uses UDP, per-stream reliability, eliminates TCP HOL blocking entirely.
</details>


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
```

**Flow:**
1. DNS = Domain Name System
2. ANALOGY: DNS is the phone book of the internet.
3. WHAT HAPPENS when you type google.com:
4. Browser checks its cache
5. (Have I looked this up recently?)
6. OS checks its cache
7. (Has any app on this machine looked it up?)

```mermaid
flowchart TD
    N1["DNS = Domain Name System"]
    N2["ANALOGY: DNS is the phone book of the internet."]
    N3["WHAT HAPPENS when you type google.com:"]
    N4["1. Browser checks its cache"]
    N5["(Have I looked this up recently?)"]
    N6["2. OS checks its cache"]
    N7["(Has any app on this machine looked it up?)"]
    N8["3. Router / ISP DNS cache"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

**Flow:**
1. Port Protocol Source Action / 22 TCP My IP only ALLOW /
2. Allow port 80, 443 from ANYWHERE (public internet) / Al
3. Allow port 8080 from Web Server SG ONLY / No public acc
4. Allow port 3306 from App Server SG ONLY / No public acc

```mermaid
flowchart TD
    N1["Port Protocol Source Action / 22 TCP My IP only ALLOW /"]
    N2["Allow port 80, 443 from ANYWHERE (public internet) / Al"]
    N3["Allow port 8080 from Web Server SG ONLY / No public acc"]
    N4["Allow port 3306 from App Server SG ONLY / No public acc"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
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

**Flow:**
1. LOAD BALANCER = Traffic cop that distributes requests /
2. LOAD BALANCER (Nginx, AWS ALB, Azure LB) / (Single entr [App 1][App 2][App 3] ← Same application, 3 copies / ST

```mermaid
flowchart TD
    N1["LOAD BALANCER = Traffic cop that distributes requests /"]
    N2["LOAD BALANCER (Nginx, AWS ALB, Azure LB) / (Single entr"]
    N3["[App 1][App 2][App 3] ← Same application, 3 copies / ST"]
    N1 --> N2
    N2 --> N3
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

**Flow:**
1. BROWSER
2. PORT 443 at 54.23.100.50
3. Spring Boot
4. Nginx
5. Load Balancer
6. Internet
7. Browser

```mermaid
flowchart TD
    N1["2. BROWSER"]
    N2["PORT 443 at 54.23.100.50"]
    N3["Spring Boot"]
    N4["Nginx"]
    N5["Load Balancer"]
    N6["Internet"]
    N7["Browser"]
    N1 --> N2
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
```

---

## 10. Common Networking Errors (What They Mean)


Error                          │ Cause → Fix
───────────────────────────────┼────────────────────────────────
Connection refused             │ Nothing running on that port.
│ Start the server! Check port.
│
Connection timed out           │ Firewall blocking, wrong IP,
│ server unreachable. Check SG.
│
Port already in use            │ Another process has the port.
│ Kill it or use different port.
│
ECONNRESET                     │ Other side closed connection.
│ Server crashed mid-request.
│
DNS resolution failed          │ Domain doesn't exist or DNS
│ server down. Check domain name.
│
CORS error (browser only)      │ Server doesn't allow your
│ origin. Add CORS headers.
│
SSL handshake failed           │ Certificate expired or invalid.
│ Renew cert. Check date/domain.
│
502 Bad Gateway                │ Load balancer can't reach
│ backend. Backend is down.


---



🔬 **Section Challenge — 10. Common Networking Errors (What They Mean)**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


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

**Flow:**
1. DNS lookup
2. TCP connection
3. TLS handshake
4. HTTP request
5. Load balancer
6. App server
7. Database query
8. Response

```mermaid
flowchart TD
    N1["DNS lookup"]
    N2["TCP connection"]
    N3["TLS handshake"]
    N4["HTTP request"]
    N5["Load balancer"]
    N6["App server"]
    N7["Database query"]
    N8["Response"]
    N9["back through entire chain"]
    N10["Browser renders HTML/JSON."]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N5 --> N6
    N6 --> N7
    N7 --> N8
    N9 --> N10
```

---

[← IaC Terraform](16_IaC_Terraform.md) | [Index](../00_MASTER_INDEX.md) | [Next → Backend + Cloud](18_Backend_Cloud_Integration.md)


