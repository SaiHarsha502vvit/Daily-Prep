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

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **TCP transport** | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — HTTP rides on TCP (or QUIC) |
| **DNS resolution** | [Ch 07: DNS](07_DNS_Complete.md) — first step before any HTTP request |
| **TLS encryption** | [Ch 09: TLS](09_TLS_Encryption.md) — HTTPS = HTTP + TLS |
| **REST API in FastAPI** | [Python Asyncio](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) |
| **React fetching** | [React Hooks](../15_React_Frontend/03_Hooks_Deep_Dive.md) — useEffect, Suspense |
| **JS fetch API** | [JavaScript Modern](../16_JavaScript/06_JS_Modern_ES6Plus.md) |
| **SQL injection via HTTP** | [SQL Security](../08_SQL/33_SQL_Security_Injection.md) |
| **Load balancing HTTP** | [Networking & Security](02_Networking_Security.md) — L7 load balancers |
| **Caching (ETag)** | [Browser Rendering](../16_JavaScript/09_Browser_Internals_Rendering.md) |

---

> **Navigation**: [← DNS](07_DNS_Complete.md) | [Index](00_INDEX.md) | [Next → TLS](09_TLS_Encryption.md)
