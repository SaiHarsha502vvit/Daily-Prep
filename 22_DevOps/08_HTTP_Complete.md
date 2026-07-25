> **Navigation**: [← DNS](07_DNS_Complete.md) | [Index](00_INDEX.md) | [Next → TLS](09_TLS_Encryption.md)

# 🌐 Chapter 8: HTTP Complete — The Language of the Web

> _"HTTP is the most widely used protocol in history. Every webpage, API call, webhook, file download, and REST endpoint speaks HTTP. Understanding it deeply — not just 'GET returns 200' but what every header means and how HTTP/2 multiplexing works — separates junior from senior engineers."_

---

# PART 1: History — From Simple Documents to Real-Time Apps

---

```
1991 — HTTP/0.9:
  Tim Berners-Lee at CERN. The simplest possible protocol.
  Only ONE method: GET. Only ONE response type: HTML.
  No headers. No status codes.

  Request:  GET /index.html
  Response: <html>Hello World</html>
  Connection closes immediately.

1996 — HTTP/1.0 (RFC 1945):
  Headers added! Content negotiation! Status codes!
  Methods: GET, HEAD, POST.
  Content-Type header: images, audio, not just HTML.
  BUT: one request per TCP connection. Open, request, close. Repeat.
  50 resources on a page = 50 TCP connections = 50 handshakes = SLOW.

1997 — HTTP/1.1 (RFC 2068 → RFC 7230-7235):
  The workhorse of the internet for 18 years.
  Key innovations:
  • Keep-alive: reuse TCP connections (persistent connections by default!)
  • Host header: multiple websites on one IP (virtual hosting)
  • Chunked transfer encoding: stream responses of unknown size
  • Range requests: resume interrupted downloads
  • Cache-Control, ETag, If-Modified-Since: sophisticated caching
  • PUT, DELETE, PATCH, OPTIONS methods

  PROBLEM: Head-of-line blocking.
  HTTP/1.1 can pipeline (send multiple requests without waiting for responses).
  BUT responses must be in order! If request 1 takes 5 seconds,
  requests 2-10 wait 5 seconds even though their responses are ready.

  WORKAROUND: Browsers open 6 TCP connections per domain.
  6 parallel connections × multiple requests each = reasonable performance.
  But 6 × TCP handshakes + TLS handshakes = still wasteful.

2015 — HTTP/2 (RFC 7540):
  Based on Google's SPDY protocol.
  Key innovations:
  • Binary framing: no longer text-based. Binary frames on a single TCP connection.
  • Multiplexing: multiple requests AND responses SIMULTANEOUSLY on ONE connection.
    No head-of-line blocking at HTTP layer!
    Request 1 (slow) doesn't block request 2 (fast).
  • Header compression: HPACK algorithm.
    HTTP/1.1: repeat ALL headers with every request (User-Agent, Cookie, etc.)
    HTTP/2: send headers ONCE, then only send DIFFERENCES.
  • Server push: server can send resources BEFORE client requests them.
    Server knows client will need style.css → pushes it proactively.
  • Stream prioritization: client tells server which resources matter most.

  BUT: still uses TCP underneath → TCP head-of-line blocking remains.
  If ONE TCP segment is lost → ALL HTTP/2 streams wait for retransmission.

2022 — HTTP/3 (RFC 9114):
  Replaces TCP with QUIC (over UDP).
  No TCP head-of-line blocking: each stream is independent at transport level.
  0-RTT connection establishment (for repeat connections).
  Connection migration (WiFi → cellular without reconnection).

  ~30% of all web traffic uses HTTP/3 as of 2024.
```

---

# PART 2: HTTP Methods — When to Use What

---

```
METHOD   │ PURPOSE              │ IDEMPOTENT │ SAFE │ REQUEST BODY │ RESPONSE BODY
─────────┼──────────────────────┼────────────┼──────┼──────────────┼──────────────
GET      │ Read / retrieve      │ YES        │ YES  │ NO*          │ YES
POST     │ Create / submit      │ NO         │ NO   │ YES          │ YES
PUT      │ Replace entirely     │ YES        │ NO   │ YES          │ Optional
PATCH    │ Partial update       │ NO**       │ NO   │ YES          │ YES
DELETE   │ Remove resource      │ YES        │ NO   │ Optional     │ Optional
HEAD     │ GET without body     │ YES        │ YES  │ NO           │ NO (headers only)
OPTIONS  │ What methods allowed?│ YES        │ YES  │ NO           │ YES (Allow header)
TRACE    │ Echo request back    │ YES        │ YES  │ NO           │ YES (diagnostic)
CONNECT  │ Establish tunnel     │ NO         │ NO   │ NO           │ YES (proxy tunneling)

*GET technically CAN have a body, but most servers ignore it.
**PATCH CAN be idempotent if designed carefully.

IDEMPOTENT: Calling it 1 time or 100 times produces the SAME result.
  PUT /users/123 {name: "Alice"} → always sets name to Alice (same result).
  POST /users {name: "Alice"}   → creates a NEW user each time!
  DELETE /users/123              → first call deletes, subsequent calls = 404 (but server state is same).

SAFE: Does NOT modify server state. GET, HEAD, OPTIONS = safe.
  GET should NEVER change data. GET /delete-user → TERRIBLE design!

REAL EXAMPLES:
  List users:           GET    /api/users
  Get one user:         GET    /api/users/123
  Create user:          POST   /api/users          {name: "Alice", email: "alice@example.com"}
  Update entire user:   PUT    /api/users/123       {name: "Alice", email: "new@example.com"}
  Update email only:    PATCH  /api/users/123       {email: "new@example.com"}
  Delete user:          DELETE /api/users/123
  Check if user exists: HEAD   /api/users/123       (returns 200 or 404, no body)
  CORS preflight:       OPTIONS /api/users          (returns allowed methods, headers)
```

---

# PART 3: HTTP Status Codes — The Complete Reference

---

```
1xx — INFORMATIONAL (rare, but important):
  100 Continue:          "Send the body now" (client sent Expect: 100-continue header)
  101 Switching Protocols: "OK, let's switch to WebSocket" (Upgrade header)
  103 Early Hints:       "Start loading these CSS/JS files while I prepare the page"

2xx — SUCCESS:
  200 OK:                Standard success. GET → response body. POST → created resource info.
  201 Created:           Resource was created. Should include Location header with new URL.
                         POST /users → 201 Created, Location: /users/123
  202 Accepted:          Request accepted but NOT YET PROCESSED (async ops).
                         POST /reports → 202 Accepted (report will be generated later)
  204 No Content:        Success but no body to return. DELETE → 204 (deleted, nothing to show).
  206 Partial Content:   Range request successful. Used for: resumable downloads, video streaming.

3xx — REDIRECTION:
  301 Moved Permanently: URL has permanently changed. Search engines update their index.
                         http://myapp.com → 301 → https://myapp.com (HTTP→HTTPS redirect)
  302 Found:             Temporary redirect. Browser follows redirect but doesn't update bookmarks.
  304 Not Modified:      Cache is still valid. Browser sent If-None-Match (ETag) → server confirms.
                         No body sent → browser uses cached version (saves bandwidth!).
  307 Temporary Redirect: Like 302, but KEEPS the HTTP method. POST /old → 307 → POST /new.
  308 Permanent Redirect: Like 301, but KEEPS the HTTP method.

4xx — CLIENT ERROR:
  400 Bad Request:       Request is malformed. Missing required field, invalid JSON, etc.
  401 Unauthorized:      "Who are you?" No authentication provided. Send a token!
  403 Forbidden:         "I know who you are, but you don't have permission."
                         401 = identity unknown. 403 = identity known, access denied.
  404 Not Found:         Resource doesn't exist at this URL.
  405 Method Not Allowed: Using POST on a read-only endpoint, GET on a write-only endpoint.
  408 Request Timeout:   Client took too long to send the complete request.
  409 Conflict:          Conflict with current state. E.g., user already exists, version conflict.
  413 Payload Too Large: Request body exceeds server limit (file upload too big).
  415 Unsupported Media: Wrong Content-Type. Sent XML when server expects JSON.
  422 Unprocessable:     Syntax is valid BUT content is semantically wrong.
                         JSON is valid, but "age: -5" is not meaningful.
  429 Too Many Requests: RATE LIMITED. Retry after Retry-After header seconds.

5xx — SERVER ERROR:
  500 Internal Server Error: Generic "something crashed." Check server logs!
  502 Bad Gateway:       Proxy/LB received invalid response from upstream server.
                         NGINX → your app crashed → NGINX returns 502 to client.
  503 Service Unavailable: Server is overloaded or under maintenance.
                         Usually temporary. Retry-After header tells when to retry.
  504 Gateway Timeout:   Proxy/LB timed out waiting for upstream response.
                         Your app is too slow → NGINX waited 30s → gave up → 504.
```

---

# PART 4: HTTP Headers — The Detailed Reference

---

```
REQUEST HEADERS (client → server):

Host: api.myapp.com
  REQUIRED in HTTP/1.1. Tells the server WHICH website you want.
  Without this, virtual hosting (multiple sites on one IP) wouldn't work.

Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Authentication token. "Bearer" scheme = JWT token.
  "Basic" scheme = base64(username:password) — DON'T use without HTTPS!

Content-Type: application/json
  What FORMAT is the request body in?
  application/json (most APIs), multipart/form-data (file uploads),
  application/x-www-form-urlencoded (HTML form submissions).

Accept: application/json
  What FORMAT does the client want the response in?
  Server uses this for content negotiation (JSON vs XML vs HTML).

User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
  Identifies the client. Browsers send long strings.
  APIs often set: User-Agent: MyApp/1.0 (for rate limiting identification).

Cookie: session_id=abc123; theme=dark
  Client sends stored cookies. Server reads them for session management.

Cache-Control: no-cache
  Client tells server: "I want a fresh response, don't give me cached data."

If-None-Match: "etag-abc123"
  "I have this cached version (ETag). Has it changed?"
  Server responds 304 (not changed) or 200 (new version + new ETag).


RESPONSE HEADERS (server → client):

Content-Type: application/json; charset=utf-8
  Format of the response body.

Content-Length: 1234
  Size of response body in bytes. Required for non-chunked responses.

Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
  HttpOnly: JavaScript can't read it (prevents XSS cookie theft!)
  Secure: only sent over HTTPS
  SameSite: prevents CSRF attacks
  Max-Age: cookie expires in 3600 seconds (1 hour)

Cache-Control: public, max-age=31536000, immutable
  Cache this for 1 year. Never revalidate (content will never change).
  Used for: versioned assets (style.v123.css, bundle.abc123.js).

ETag: "abc123"
  A fingerprint of the resource. Client sends it back in If-None-Match.
  If same → 304 Not Modified. If different → 200 with new content.

Location: /api/users/123
  Used with 201 Created: where the new resource lives.
  Used with 3xx redirects: where to go next.

Retry-After: 30
  Used with 429 (rate limit) and 503 (overloaded): wait 30 seconds before retrying.

Access-Control-Allow-Origin: https://myapp.com
  CORS header. "Only myapp.com can make requests from a browser."
  * = allow anyone (security risk for authenticated APIs!).

X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
  Unique ID for this request. Used for: tracing through microservices, debugging.
  Log this everywhere → correlate logs across services when something fails.
```

---

# PART 5: cURL Mastery — The Swiss Army Knife

---

```bash
# ── cURL: Every Developer Must Know These ──

# Basic GET
curl https://api.myapp.com/users

# Verbose output (see EVERYTHING: DNS, TCP, TLS, headers)
curl -v https://api.myapp.com/users

# POST with JSON body
curl -X POST https://api.myapp.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# PUT (replace)
curl -X PUT https://api.myapp.com/users/123 \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Updated"}'

# PATCH (partial update)
curl -X PATCH https://api.myapp.com/users/123 \
  -H "Content-Type: application/json" \
  -d '{"email": "new@email.com"}'

# DELETE
curl -X DELETE https://api.myapp.com/users/123

# See only response headers (HEAD request)
curl -I https://api.myapp.com/users

# Follow redirects (e.g., HTTP → HTTPS)
curl -L http://myapp.com        # -L follows 301/302 redirects

# Send form data (file upload)
curl -X POST https://api.myapp.com/upload \
  -F "file=@/path/to/document.pdf" \
  -F "description=My document"

# Save response to file
curl -o response.json https://api.myapp.com/users

# Show timing breakdown (DNS, TCP, TLS, first byte)
curl -w "\nDNS: %{time_namelookup}s\nTCP: %{time_connect}s\nTLS: %{time_appconnect}s\nFirst byte: %{time_starttransfer}s\nTotal: %{time_total}s\n" \
  -o /dev/null -s https://api.myapp.com/users

# Output:
# DNS: 0.004s
# TCP: 0.025s
# TLS: 0.067s
# First byte: 0.098s
# Total: 0.103s
# → TLS handshake = 0.042s (0.067 - 0.025). Response gen = 0.031s.

# Test with specific HTTP version
curl --http2 https://api.myapp.com/users    # Force HTTP/2
curl --http3 https://api.myapp.com/users    # Force HTTP/3 (QUIC)

# Rate limit test (send 100 requests)
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{http_code} " https://api.myapp.com/users
done
# Watch for 429 (rate limited) in the output

# REST API testing with jq (JSON processor)
curl -s https://api.myapp.com/users | jq '.[] | {name, email}'
```

---

# PART 6: REST API Design Principles

---

```
REST (Representational State Transfer) — Roy Fielding, 2000.

PRINCIPLES:
1. RESOURCE-BASED: URLs represent RESOURCES (nouns), not actions (verbs).
   ✓ GET  /users/123       (get user 123)
   ✗ GET  /getUser?id=123  (verb in URL — bad)
   ✗ POST /deleteUser      (POST for deletion — bad)

2. HTTP METHODS = ACTIONS:
   GET = read, POST = create, PUT = replace, PATCH = update, DELETE = remove.

3. STATELESS: Each request contains ALL information needed.
   Server doesn't store client state between requests.
   Authentication token in EVERY request (not session-based*).
   *Sessions are technically stateful but widely used with REST.

4. HIERARCHICAL URLS:
   /organizations/42/teams/7/members          (org 42, team 7, members)
   /products/shoes/reviews                     (reviews for shoes)

5. FILTERING, SORTING, PAGINATION via query parameters:
   GET /users?role=admin&sort=created_at&order=desc&page=2&limit=20

6. VERSIONING:
   /api/v1/users   (URL path versioning — most common)
   Accept: application/vnd.myapp.v2+json (header versioning — cleaner)

7. ERROR RESPONSES should be consistent:
   {
     "error": {
       "code": "USER_NOT_FOUND",
       "message": "User with id 123 was not found",
       "details": { "id": 123 }
     }
   }

8. HATEOAS (Hypermedia as the Engine of Application State):
   Response includes links to related actions:
   {
     "id": 123,
     "name": "Alice",
     "_links": {
       "self": "/api/users/123",
       "orders": "/api/users/123/orders",
       "update": "/api/users/123",
       "delete": "/api/users/123"
     }
   }
   Client doesn't need to hardcode URLs — follows links.
   Rarely implemented fully, but a good design principle.
```

---

## 🔬 Section Challenges

---

🔬 **Section Challenge — HTTP/1.1 vs HTTP/2 vs HTTP/3 Evolution**

**Challenge 1 (Reasoning):** HTTP/3 replaced TCP with QUIC over UDP. WHY did HTTP/3 make this radical change? And WHAT problem with TCP persisted even in HTTP/2's binary framing layer?

<details><summary>Answer</summary>

**WHY HTTP/3 switched from TCP to UDP:**
TCP's reliability guarantees come with a cost: head-of-line blocking at the transport layer. TCP tracks all bytes in sequence, so if one segment is lost, the TCP stack on both ends MUST wait for retransmission before delivering ANY data to the application — even data from OTHER logical streams. HTTP/1.1 solved this at the application layer (with 6 parallel connections) but couldn't eliminate the underlying TCP problem. HTTP/2 tried to solve it by multiplexing over one TCP connection — but HTTP/2 streams still share ONE TCP sequence number space. If the underlying TCP segment for ANY HTTP/2 stream is lost, the TCP stack blocks delivery of ALL subsequent data to the application, regardless of which stream the lost segment belonged to. HTTP/2 eliminated HTTP-layer head-of-line blocking but TCP-layer head-of-line blocking remained.

**WHAT problem persisted in HTTP/2:** TCP head-of-line blocking. One lost TCP segment stalls all HTTP/2 streams simultaneously. You could have a response ready on Stream 5, but Stream 5's data is sitting in the TCP receive buffer waiting for Stream 3's retransmitted segment — because TCP guarantees ordered delivery at the byte-stream level, not at the HTTP stream level.

**HTTP/3's solution (QUIC):** QUIC is built on UDP but adds its own reliability layer. Crucially, QUIC tracks each HTTP/3 stream independently at the transport layer. If Stream A loses a packet, Stream B is delivered to the application immediately — Stream B doesn't wait for Stream A's retransmission. QUIC uses connection IDs (not IP+port tuples) to enable seamless WiFi-to-cellular handoff. This is why YouTube doesn't buffer when you walk between networks.

</details>

**Challenge 2 (Reasoning):** Browsers opened 6 TCP connections per domain in the HTTP/1.1 era as a workaround. This 6-connection limit is still enforced today (and is why domain sharding was a thing). WHY was it introduced, and WHY did HTTP/2's multiplexing make it obsolete?

<details><summary>Answer</summary>

**WHY the 6-connection limit was introduced:** HTTP/1.1 introduced persistent TCP connections (keep-alive), allowing multiple requests to reuse one connection. But it also introduced head-of-line blocking: if Request 1 is slow, Requests 2-N on that same connection must wait. To work around this, browsers opened 6 parallel TCP connections per origin domain. Each connection could independently pipeline requests. The limit of 6 was a compromise: enough parallelism for reasonable page load, but limited enough to avoid overwhelming servers. HTTP/1.1 pipelining was specified but NEVER widely deployed in browsers due to the head-of-line blocking problem — so the 6-connection trick was the only real parallelism.

**WHY HTTP/2 made it obsolete:** HTTP/2 multiplexes multiple requests simultaneously over a SINGLE TCP connection. If Request A is slow, Request B is delivered to the application immediately — no blocking. The single connection also means only one TCP handshake, one TLS handshake (for HTTPS), and one TCP slow-start ramp. With HTTP/1.1, 6 connections each had to go through slow start independently. HTTP/2 is more TCP-efficient by design, making domain sharding (splitting assets across multiple domains to get more than 6 connections) counterproductive — it actually hurts performance by adding DNS lookup and TCP handshake overhead for additional domains.

</details>

---

🔬 **Section Challenge — HTTP Status Code Semantics**

**Challenge 1 (Reasoning):** A client makes a request. The server responds with 404. Is this necessarily the client's fault? Now consider 503 and 301. WHY do status code families (4xx vs 5xx vs 3xx) matter for client retry logic and state management?

<details><summary>Answer</summary>

**404 Not Found — Is it the client's fault?** Not necessarily. 404 means the URL has no resource at this path — but the REASON depends on context: (1) Client error: the client typed `/usres/123` instead of `/users/123` (typo in URL). (2) Stale link: the resource existed when a crawler indexed the page, but was deleted — the client followed a valid-looking link that no longer exists. (3) Missing static asset: `/assets/logo.png` returns 404 — but this is often a deployment issue (file not copied to CDN), not a client bug. The 4xx family signals that the REQUEST as framed cannot be fulfilled — but it doesn't always mean the client made a mistake, and retrying won't help.

**503 Service Unavailable — Is it the server's fault?** Yes, primarily. 503 means the server is temporarily unable to handle the request (overloaded, under maintenance). The 5xx family signals server-side failure — the problem is on the server side, not in how the request was formulated. This matters for retry logic: a 503 with a `Retry-After` header tells the client exactly when to retry. The client SHOULD retry, and exponential backoff is appropriate.

**301 Moved Permanently — Is it the server's fault?** Neither — it's a routing decision. 3xx codes tell the client to take additional action, typically following a redirect. 301 means the resource lives elsewhere permanently (browsers cache this permanently; search engines update their index). A 301 response with `Location: https://api.example.com/v2/users` means: "Your request was correct, but the resource moved. Go there next time."

**WHY status code families matter for retry logic:**
- **4xx**: Do NOT retry. The request is fundamentally wrong (bad URL, bad auth, bad method). Retrying without fixing the issue will just fail again. Exception: 429 (rate limited) — retry after the specified delay.
- **5xx**: MAY retry with backoff. The server had a problem; it might recover. Use exponential backoff with jitter. Distinguish: 500 (generic crash — retry) vs 502/504 (upstream problem — retry) vs 503 (retry after Retry-After).
- **3xx**: Do NOT retry the original request blindly. Follow the redirect (handle redirects with a maximum hop count to prevent redirect loops). A client that blindly retries a POST on 301 becomes a GET on 307/308 (depending on whether the redirect preserves method).

</details>

---

🔬 **Section Challenge — HTTP Caching Headers**

**Challenge 1 (Reasoning):** A server responds with `Cache-Control: max-age=3600`. After 30 minutes, the client makes the exact same request. Does it send a conditional revalidation request, or does it serve from cache directly? WHAT header would change this behavior, and WHY would a server set it?

<details><<summary>Answer</summary>

**Does the client revalidate after 30 minutes with `max-age=3600`?** No. With `max-age=3600` (1 hour), the cached response is still FRESH. The client serves it directly from cache — zero network request. The cache is valid for the full hour. No `If-None-Match` or `If-Modified-Since` is sent.

**What changes this behavior?** Adding `no-cache` to the request or response. `Cache-Control: no-cache` on a RESPONSE means: cache this, but revalidate on every use — always send a conditional request. This is useful for sensitive data (bank account balance) where staleness is dangerous, but you still want the efficiency of a shared cache for the round-trip savings of a 304 response.

**WHY would a server set `no-cache`?** Consider an API that returns user-specific data. The server wants browsers to cache it (saves bandwidth) but cannot risk serving stale data (imagine the user's permissions changed but they're seeing old data). `Cache-Control: no-cache` forces the browser to ALWAYS revalidate. The server checks the `If-None-Match` (ETag) or `If-Modified-Since` header — if the resource hasn't changed, it returns 304 (not modified) and the browser uses the cached copy (minimal overhead). If it HAS changed, it returns 200 with the new body. The alternative, `Cache-Control: private, no-store`, tells all caches (including CDNs) to never store the response — the client must refetch every time.

</details>

---

🔬 **Section Challenge — TLS Handshake**

**Challenge 1 (Reasoning):** TLS 1.2 requires 2 round trips (2 RTT) for a new HTTPS connection. TLS 1.3 reduces this to 1 RTT. For a 50ms RTT connection, this is 50ms of latency saved. WHY does this matter so much, and WHAT did TLS 1.3 sacrifice — in terms of legacy compatibility and cryptographic features — to achieve this 1-RTT improvement?

<details><summary>Answer</summary>

**WHY 50ms saved matters:** On a 50ms RTT connection (typical for US-West to US-East), a TLS 1.2 handshake costs 100ms before the first HTTP byte is sent. For a mobile user on a 100ms RTT connection, the TLS 1.2 handshake alone costs 200ms. Research shows every 100ms of latency costs ~1% in conversions. For HTTP/2 or HTTP/3 where the handshake is followed by HTTP requests, the TLS overhead can dominate total page load time for above-the-fold content. TLS 1.3's 1-RTT handshake is a direct user-perceivable latency win.

**WHAT TLS 1.3 sacrificed for 1-RTT:**

1. **RSA key exchange is gone.** TLS 1.2 allowed RSA-based key exchange: the client generates a pre-master secret, encrypts it with the server's RSA public key, and sends it. The server decrypts it. This is 1-RTT — but it has a critical flaw: if an attacker records the handshake and later steals the server's private key, they can decrypt ALL past sessions (forward secrecy failure). TLS 1.3 mandates Diffie-Hellman (DH) key exchange. With DH, the session key is derived from both parties' randomness — stealing the private key later does NOT expose past sessions (perfect forward secrecy). This is the tradeoff: TLS 1.3 sacrificed RSA key exchange (simpler but insecure) to gain forward secrecy.

2. **Legacy cipher suite support.** TLS 1.3 removed support for cipher suites that use CBC mode (like TLS_RSA_WITH_AES_256_CBC_SHA) and static RSA signatures. These were vulnerable to attacks like BEAST and Lucky13. TLS 1.3 only supports AEAD ciphers (AES-GCM, ChaCha20-Poly1305) which provide authenticated encryption — data is encrypted AND integrity-checked in one step. This simplifies the attack surface significantly.

3. **Downgrade protection mechanism.** TLS 1.3 added a mechanism that makes it harder for attackers to force clients and servers to negotiate TLS 1.2. TLS 1.2 can be exploited more easily — so TLS 1.3 implementations reject handshakes that look like downgrade attempts.

**0-RTT resumption (the bonus round):** TLS 1.3 also supports 0-RTT resumption for repeat connections using session tickets. The client sends encrypted data in the first flight (using a cached session key). This saves the entire RTT for returning connections. The tradeoff: 0-RTT data is vulnerable to replay attacks (the server might accept the same ticket twice) — so 0-RTT is not used for non-idempotent requests like POST/PUT/DELETE.

</details>

---

## 🔗 Cross-References

| Topic                      | Related Content                                                                 |
| -------------------------- | ------------------------------------------------------------------------------- |
| **TCP transport**          | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — HTTP rides on TCP (or QUIC)         |
| **DNS resolution**         | [Ch 07: DNS](07_DNS_Complete.md) — first step before any HTTP request           |
| **TLS encryption**         | [Ch 09: TLS](09_TLS_Encryption.md) — HTTPS = HTTP + TLS                         |
| **REST API in FastAPI**    | [Python Asyncio](../25_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md)        |
| **React fetching**         | [React Hooks](../15_React_Frontend/03_Hooks_Deep_Dive.md) — useEffect, Suspense |
| **JS fetch API**           | [JavaScript Modern](../16_JavaScript/06_JS_Modern_ES6Plus.md)                   |
| **SQL injection via HTTP** | [SQL Security](../08_SQL/33_SQL_Security_Injection.md)                          |
| **Load balancing HTTP**    | [Networking & Security](02_Networking_Security.md) — L7 load balancers          |
| **Caching (ETag)**         | [Browser Rendering](../16_JavaScript/09_Browser_Internals_Rendering.md)         |


---

## Reality Check

**"HTTP is a simple request-response protocol"** ? The request-response shape is simple; the SEMANTICS that infrastructure depends on are where correctness lives: method safety and idempotency as CONTRACTS (GET safe, PUT/DELETE idempotent, POST neither � [13_DE REST]'s retry-and-cache foundation), status codes as machine routing (the 200-with-error-body that blinds caches and monitoring), and the header ecosystem doing the real work (caching directives, content negotiation, auth, CORS). "Simple protocol" is true of the wire format and false of the semantic contracts � and every team that treats HTTP as a dumb pipe rediscovers why the contracts exist through cache bugs and broken retries.

**"Caching headers are an optimization to add later"** ? Cache-Control is a CORRECTNESS surface before it is an optimization: get it wrong and you either serve stale data (the user seeing yesterday's balance because you cached a personalized response publicly) or serve nothing cacheably (every request hitting the origin, the CDN doing nothing). The distinctions that matter � public versus private, max-age versus s-maxage (CDN versus browser), must-revalidate, ETag/If-None-Match for conditional requests, and the immutable-with-hashed-filenames pattern for assets ([build-tools]' cache-busting) � are a small vocabulary that determines whether your caching layer helps, does nothing, or actively corrupts. Adding it "later" means shipping with either no caching or accidental wrong caching.

**"HTTPS is HTTP with encryption bolted on"** ? TLS changes the CONNECTION model in ways that shape performance and architecture: the handshake adds round trips ([TCP deep-dive] � session resumption and TLS 1.3 exist to minimize them), SNI reveals the hostname even when content is encrypted (the privacy gap ECH addresses), certificate management becomes operational (expiry as a recurring outage cause � the cert that lapsed on a weekend, automation via ACME/Let's Encrypt the fix), and TLS termination location is an architecture decision (at the edge/LB versus end-to-end � the trade between inspection/caching and zero-trust encryption-in-depth). "Encryption bolted on" undersells that HTTPS restructures the connection lifecycle you must operate.

**"HTTP/2 and HTTP/3 are automatic performance wins"** ? Each fixes a specific bottleneck and introduces its own considerations: HTTP/2's multiplexing eliminates the need for the HTTP/1.1 workarounds (domain sharding, sprite sheets, concatenation � practices that become COUNTERPRODUCTIVE under H2, the migration where old optimizations became pessimizations), but H2 over TCP still suffers transport-level head-of-line blocking (one lost packet stalls all streams � [TCP deep-dive]); HTTP/3 over QUIC fixes that but is UDP-based (the middleboxes and networks that block or throttle UDP). The win is real and conditional � reversing legacy optimizations, ensuring the whole path supports the version, and measuring rather than assuming � not a flag you flip for free speedup.

**"CORS errors are a bug to make go away"** ? CORS is a browser SECURITY mechanism working as designed, and "making it go away" with wildcard origins or a disabled check removes a real protection: the same-origin policy prevents malicious sites from reading responses to authenticated requests to your API (the CSRF-adjacent attack CORS constrains), so the fix is CONFIGURING it correctly (specific allowed origins, credentials handling, preflight for non-simple requests � understanding why the OPTIONS preflight fires) not defeating it. The developer reflex to slap Access-Control-Allow-Origin: * on everything to stop the error is disabling a security control to silence a symptom � and on a credentialed API, it is a genuine vulnerability, which is exactly why the browser forbids wildcard-plus-credentials.
