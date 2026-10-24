**Navigation**: [< Previous](Ch41_SB_Architecture_Quality.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch43_SB_Auth_Security.md)

# 🌐 SPRING BOOT MASTERY - Part 10: HTTP Deep Dive

**Understanding How the Internet Really Works**
_"Every API call is a journey through layers of protocols"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

**WHY: Why Understand HTTP Deeply?**

```text
• Debug network issues: "Why is my API slow?" - headers, connections
• API design: Right status codes, headers make intuitive APIs
• Security: CORS, cookies, authentication headers
• Performance: Caching, compression, keep-alive connections
• Interview: Network questions are common in backend interviews
```

**HOW: How HTTP Request/Response Cycle Works?**

```text
• DNS lookup: Domain → IP address resolution
• TCP handshake: Establish connection (3-way handshake)
• TLS negotiation: HTTPS encryption setup
• Request: Method + URL + Headers + Body
• Response: Status + Headers + Body
```

**WHEN: When to Use Each HTTP Method?**

```text
• GET: Retrieve data (safe, idempotent, cacheable)
• POST: Create new resource (not idempotent)
• PUT: Replace entire resource (idempotent)
• PATCH: Partial update (not always idempotent)
• DELETE: Remove resource (idempotent)
```

**WHICH: Which HTTP Concepts to Master?**

```text
ESSENTIAL:     Status codes, methods, headers, request/response structure
IMPORTANT:     CORS, cookies, caching headers, content types
ADVANCED:      HTTP/2, WebSocket, long polling, streaming
```

---

# 📌 Section 1: HTTP Request Lifecycle

---

## Chapter 1: What Happens When You Hit an API?

**The complete journey of an HTTP request**

You type: `http://api.myapp.com/users/123?include=orders`

**Step 1: DNS resolution.** The browser asks, "What's the IP of `api.myapp.com`?"

1. Check the browser cache.
2. Check the OS cache (`/etc/hosts`, DNS cache).
3. Query the DNS resolver (the ISP's DNS).
4. The resolver queries: root → TLD (`.com`) → authoritative DNS.
5. It returns `52.34.198.76`.

```mermaid
flowchart LR
  B["Browser"] --> ISP["ISP DNS (resolver)"] --> R["Root DNS"] --> T[".com TLD"] --> A["Authoritative DNS for myapp<br/>→ 52.34.198.76"]
```

**How to read this diagram.** The resolver walks down the DNS hierarchy until it reaches the server that knows the answer.

**Step 2: TCP connection (three-way handshake)**

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: SYN (seq=100)
  S-->>C: SYN-ACK (seq=300, ack=101)
  C->>S: ACK (ack=301)
  Note over C,S: Connection ESTABLISHED
```

**How to read this diagram.** The client sends SYN, the server answers SYN-ACK, and the client confirms with ACK. Then the connection is established.

**Step 3: TLS handshake (for HTTPS)**

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: ClientHello (TLS versions, cipher suites)
  S-->>C: ServerHello + Certificate
  C->>S: Verify the certificate, generate a session key, send it encrypted
  S-->>C: Acknowledge: encrypted connection ready
```

**How to read this diagram.** This is a simplified view. The two sides agree on a TLS version and cipher suite, the client verifies the server's certificate, and both end up with a shared session key.

**Step 4: the HTTP request is sent**

```http
GET /users/123?include=orders HTTP/1.1
Host: api.myapp.com
User-Agent: Mozilla/5.0
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1...
Connection: keep-alive
```

**Step 5: the server processes it (Spring Boot).** Tomcat → filters → Security `FilterChainProxy` → `DispatcherServlet` → `HandlerMapping` → `Interceptor.preHandle()` → controller → service → DB → `Interceptor.postHandle()` → `Interceptor.afterCompletion()` → filters (in reverse) → Tomcat writes the response. (Full 14-step breakdown with code examples: see Ch55, Sections 12A-12H.)

**Step 6: the HTTP response is returned**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 256

{"id": 123, "name": "John", "orders": [...]}
```

**Step 7: TCP connection close (or kept alive).** With HTTP/1.1 keep-alive, the connection stays open for reuse. Without it, the connection closes with a four-step exchange: FIN, ACK, FIN, ACK.

---

## Chapter 2: HTTP Request Structure

🔬 **Section Challenge — Chapter 2: HTTP Request Structure**

**Challenge 1 (Debug — Who/When/What):** A client sends `Content-Type: application/json` but the body is actually form-encoded. **Who** first detects the mismatch in Spring Boot? **What** exception is thrown? **When** in the request lifecycle?

<details><summary>Answer</summary>

**Who detects?** `HttpMessageConverter` selection inside `RequestMappingHandlerAdapter`. When your controller has `@RequestBody`, Spring picks the converter matching `Content-Type`. For `application/json`, it picks `MappingJackson2HttpMessageConverter`. **What exception?** `HttpMessageNotReadableException` — Jackson fails to parse form-encoded data as JSON. Spring's `DefaultHandlerExceptionResolver` translates this to HTTP 400 Bad Request. **When?** Before your controller method is called, during argument resolution. The converter reads the request body stream eagerly — if it fails, the method never executes.

</details>

## Anatomy Of An Http Request

**Request line**

```http
POST /api/v1/users/123/orders HTTP/1.1
```

| Part | Value |
| --- | --- |
| Method | `POST` |
| URL (path) | `/api/v1/users/123/orders` |
| Version | `HTTP/1.1` |

**Headers**

```http
Host: api.myapp.com
Content-Type: application/json
Content-Length: 89
Accept: application/json
Authorization: Bearer eyJhbGc...
User-Agent: PostmanRuntime/7.29.0
Cache-Control: no-cache
X-Request-ID: abc-123-def
```

| Header | Purpose |
| --- | --- |
| `Host` | Required in HTTP/1.1 |
| `Content-Type` | What format the body is in |
| `Content-Length` | Body size in bytes |
| `Accept` | What format you want back |
| `Authorization` | Authentication token |
| `User-Agent` | Client info |
| `Cache-Control` | Caching behavior |
| `X-Request-ID` | Custom header |

A **blank line** separates the headers from the body.

**Body (optional)**

```json
{
  "productId": 456,
  "quantity": 2
}
```

**Headers in detail**

| Group | Header | Example values |
| --- | --- | --- |
| General | `Cache-Control` | `no-cache`, `no-store`, `max-age=3600` |
| General | `Connection` | `keep-alive`, `close` |
| General | `Date` | `Wed, 12 Feb 2026 10:30:00 GMT` |
| Request | `Accept` | `application/json`, `text/html`, `*/*` |
| Request | `Accept-Encoding` | `gzip, deflate, br` |
| Request | `Accept-Language` | `en-US,en;q=0.9` |
| Request | `Authorization` | `Bearer token`, `Basic base64creds` |
| Request | `Host` | `api.myapp.com` (required!) |
| Request | `User-Agent` | Browser/app identifier |
| Request | `Cookie` | `session=abc123` |
| Request | `Referer` | Previous page URL |
| Entity (about the body) | `Content-Type` | `application/json`, `multipart/form-data` |
| Entity (about the body) | `Content-Length` | Size in bytes |
| Entity (about the body) | `Content-Encoding` | `gzip` |

---

🔬 **Section Challenge — Anatomy Of An HTTP Request**

**Challenge 1 (Design — Who/When/What):** Between `Authorization: Bearer token` vs a cookie-based `session=xyz` — **who** validates each one? **When** does validation happen? **What** makes Bearer tokens stateless?

<details><summary>Answer</summary>

**Bearer token (JWT):** Validated by the application server on every request. Spring Security's `JwtAuthenticationFilter` decodes and verifies the JWT signature + expiry. **When?** Before every protected endpoint — no DB lookup needed because all claims are inside the token. **Stateless** because the server stores NO session state — the token IS the identity. **Cookie session:** The `session=xyz` is a session ID. The server looks up the session in memory (or Redis). **When?** On every request, a DB/cache lookup occurs. **Stateful** — scaling horizontally requires sticky sessions or shared session storage. Bearer wins for microservices; sessions win for simple, low-scale web apps.

</details>

## Chapter 3: HTTP Response Structure

🔬 **Section Challenge — Chapter 3: HTTP Response Structure**

**Challenge 1 (Reasoning — Who/When/What):** A response has `Cache-Control: max-age=3600`. **Who** caches it? **When** does the cache entry expire? **What** happens to subsequent requests within that hour?

<details><summary>Answer</summary>

**Who caches?** The browser (or CDN/proxy if public). `Cache-Control: max-age=3600` without `public`/`private` defaults to private (browser only). Add `public` for CDN caching. **When expires?** 3600 seconds from the `Date` header timestamp. **What happens to subsequent requests?** The browser returns the cached response WITHOUT hitting the server — no network round-trip at all (200 from cache, shown as `(disk cache)` in DevTools). **Invalidation problem:** If you deploy a bug fix, cached clients still get the old response for up to 1 hour. Fix: use versioned URLs (`/api/v1/users`) and short TTLs, or `Cache-Control: no-cache` for dynamic data that must always be fresh.

</details>

## Anatomy Of An Http Response

**Status line**

```http
HTTP/1.1 201 Created
```

| Part | Value |
| --- | --- |
| Version | `HTTP/1.1` |
| Code | `201` |
| Phrase | `Created` |

**Response headers**

```http
Content-Type: application/json
Content-Length: 89
Location: /api/v1/orders/789
Cache-Control: max-age=3600
X-RateLimit-Remaining: 99
Set-Cookie: session=xyz; HttpOnly
```

`Location` tells the client where a 201 resource was created, and `X-RateLimit-Remaining` is a custom response header.

**Response body**

```json
{
  "id": 789,
  "status": "pending"
}
```

**Status codes reference**

| Class | Code | Meaning |
| --- | --- | --- |
| 1xx informational | 100 Continue | Keep sending the request |
| | 101 Switching Protocols | Changing protocols (WebSocket upgrade) |
| 2xx success | 200 OK | Standard success |
| | 201 Created | Resource created (POST) |
| | 202 Accepted | Request accepted, processing asynchronously |
| | 204 No Content | Success but no body (DELETE) |
| 3xx redirection | 301 Moved Permanently | URL changed permanently |
| | 302 Found | Temporary redirect |
| | 304 Not Modified | The cached version is still valid |
| 4xx client error | 400 Bad Request | Invalid syntax or data |
| | 401 Unauthorized | Not authenticated |
| | 403 Forbidden | Authenticated but not authorized |
| | 404 Not Found | Resource doesn't exist |
| | 405 Method Not Allowed | Wrong HTTP method |
| | 409 Conflict | State conflict (duplicate, and so on) |
| | 422 Unprocessable Content | Valid syntax, invalid semantics |
| | 429 Too Many Requests | Rate limit exceeded |
| 5xx server error | 500 Internal Server Error | Generic server error |
| | 502 Bad Gateway | Upstream server error |
| | 503 Service Unavailable | Server temporarily unavailable |
| | 504 Gateway Timeout | Upstream server timeout |

---

🔬 **Section Challenge — Anatomy Of An HTTP Response**

**Challenge 1 (Debug — Who/When/What):** Your API returns 200 OK when creating a user instead of 201 Created. **What** is the practical impact? **Who** actually cares about the distinction?

<details><summary>Answer</summary>

**Practical impact:** REST conventions say 201 = resource created + `Location` header with the new resource URL. Returning 200 omits both signals. **Who cares?** (1) API clients that check status codes for routing logic (e.g., a mobile app that reads the `Location` header to redirect). (2) OpenAPI/Swagger docs that document different status codes for different operations. (3) Monitoring systems that track 2xx but distinguish creation events. (4) Proxy servers that may cache 200 GET responses but not 201. **Fix in Spring Boot:** `return ResponseEntity.created(URI.create("/users/" + user.getId())).body(user)` — this sets 201 AND the `Location` header automatically.

</details>

# SECTION 2: PATH VARIABLES vs QUERY PARAMETERS

---

## Chapter 4: Understanding URL Structure

**URL structure breakdown**

`https://api.myapp.com:8080/api/v1/users/123/orders?status=pending&limit=10`

| Part | Value |
| --- | --- |
| Scheme | `https` |
| Host | `api.myapp.com` |
| Port | `8080` |
| Path | `/api/v1/users/123/orders` |
| Query string | `?status=pending&limit=10` |

**Breaking down the path** `/api/v1/users/123/orders`

| Segment | Meaning |
| --- | --- |
| `/api` | Base path |
| `/v1` | Version: v1 |
| `/users` | Resource: users |
| `/123` | PATH VARIABLE: 123 (the user ID) |
| `/orders` | Resource: orders |

**Breaking down the query string** `?status=pending&limit=10`

| Piece | Meaning |
| --- | --- |
| `?` | Query start marker |
| `status` | Key |
| `=pending` | Value |
| `&` | Parameter separator |
| `limit` | Key |
| `=10` | Value |

---

🔬 **Section Challenge — Chapter 4: Understanding URL Structure**

**Challenge 1 (Reasoning):** Why does making 100 sequential HTTP/1.1 requests to a microservice take significantly longer than making the exact same 100 requests over HTTP/2?

<details><summary>Answer</summary>

Head-of-Line Blocking and Connection Overhead. HTTP/1.1 requires opening a new TCP connection (and performing the expensive TCP/TLS handshakes) for every few requests, and requests on the same connection must wait for the previous response to finish (Head-of-Line blocking). HTTP/2 uses a single, persistent TCP connection and multiplexes all 100 requests concurrently as interleaved binary frames, completely eliminating TCP handshake overhead and blocking.

</details>

## Chapter 5: @PathVariable - Deep Dive

```java
// ═══════════════════════════════════════════════════════════════════════════════
// WHAT IS @PathVariable?
// ═══════════════════════════════════════════════════════════════════════════════
//
// @PathVariable extracts values from the URL PATH ITSELF
//
// URL: /users/123/orders/456
//              ↓         ↓
//           userId    orderId  ← These ARE PART OF THE PATH (not after ?)
//
// USE WHEN: Identifying a SPECIFIC RESOURCE
// Think: "Which exact thing?"
//
// ═══════════════════════════════════════════════════════════════════════════════


@RestController
@RequestMapping("/api/v1")
public class PathVariableExamplesController {

    // ─────────────────────────────────────────────────────────────────────────
    // BASIC PATH VARIABLE
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/users/123
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        // id = 123
        return ResponseEntity.ok(userService.findById(id));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PATH VARIABLE WITH DIFFERENT NAME
    // ─────────────────────────────────────────────────────────────────────────

    // When URL param name differs from Java variable name
    // GET /api/v1/users/123
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserv2(
            @PathVariable("userId") Long id) {  // "userId" maps to id
        return ResponseEntity.ok(userService.findById(id));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // MULTIPLE PATH VARIABLES
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/users/123/orders/456
    @GetMapping("/users/{userId}/orders/{orderId}")
    public ResponseEntity<OrderResponse> getUserOrder(
            @PathVariable Long userId,
            @PathVariable Long orderId) {
        // userId = 123, orderId = 456
        return ResponseEntity.ok(orderService.findByUserAndId(userId, orderId));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // OPTIONAL PATH VARIABLE (Rare - usually bad design)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/products/electronics
    // GET /api/v1/products/electronics/laptops
    @GetMapping({"/products/{category}", "/products/{category}/{subcategory}"})
    public ResponseEntity<List<ProductResponse>> getProducts(
            @PathVariable String category,
            @PathVariable(required = false) String subcategory) {
        // subcategory is null if not provided
        return ResponseEntity.ok(productService.findByCategory(category, subcategory));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PATH VARIABLE WITH MAP (all variables at once)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/regions/north/cities/seattle
    @GetMapping("/regions/{region}/cities/{city}")
    public ResponseEntity<Map<String, Object>> getRegionCity(
            @PathVariable Map<String, String> pathVars) {
        // pathVars = {"region": "north", "city": "seattle"}
        String region = pathVars.get("region");
        String city = pathVars.get("city");
        return ResponseEntity.ok(locationService.find(region, city));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PATH VARIABLE WITH REGEX VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    // Only matches if id is numeric
    // GET /api/v1/items/123 ✓
    // GET /api/v1/items/abc ✗ (404, not this endpoint)
    @GetMapping("/items/{id:\\d+}")  // \\d+ = one or more digits
    public ResponseEntity<ItemResponse> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.findById(id));
    }

    // GET /api/v1/items/abc would match THIS endpoint instead
    @GetMapping("/items/{slug:[a-z-]+}")  // lowercase letters and hyphens
    public ResponseEntity<ItemResponse> getItemBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(itemService.findBySlug(slug));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PATH VARIABLE DATA TYPES
    // ─────────────────────────────────────────────────────────────────────────

    // Spring automatically converts String from URL to target type

    @GetMapping("/numbers/{num}")
    public String numberTypes(
            @PathVariable int num,          // "123" → 123
            @PathVariable Long num2,        // "123" → 123L
            @PathVariable Double num3) {    // "12.5" → 12.5
        return "converted!";
    }

    // Works with @DateTimeFormat
    @GetMapping("/events/{date}")
    public ResponseEntity<List<EventResponse>> getEventsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        // URL: /events/2026-02-12
        // date = LocalDate.of(2026, 2, 12)
        return ResponseEntity.ok(eventService.findByDate(date));
    }

    // Works with UUIDs
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable UUID sessionId) {
        // URL: /sessions/550e8400-e29b-41d4-a716-446655440000
        return ResponseEntity.ok(sessionService.findById(sessionId));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PATH VARIABLE WITH ENUM
    // ─────────────────────────────────────────────────────────────────────────

    public enum ReportType { DAILY, WEEKLY, MONTHLY, YEARLY }

    // GET /api/v1/reports/WEEKLY
    @GetMapping("/reports/{type}")
    public ResponseEntity<ReportResponse> getReport(@PathVariable ReportType type) {
        // Automatically converts string to enum
        // Invalid value → 400 Bad Request
        return ResponseEntity.ok(reportService.generate(type));
    }
}
```

---

## Chapter 6: @RequestParam - Deep Dive

```java
// ═══════════════════════════════════════════════════════════════════════════════
// WHAT IS @RequestParam?
// ═══════════════════════════════════════════════════════════════════════════════
//
// @RequestParam extracts values from QUERY STRING (after ?)
//
// URL: /users?name=John&age=25&active=true
//              ↓       ↓       ↓
//            name    age    active  ← These come AFTER the ?
//
// USE WHEN: Filtering, sorting, pagination, optional data
// Think: "How should I filter/process?"
//
// ═══════════════════════════════════════════════════════════════════════════════


@RestController
@RequestMapping("/api/v1")
public class RequestParamExamplesController {

    // ─────────────────────────────────────────────────────────────────────────
    // BASIC QUERY PARAMETER
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/users?name=John
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> searchUsers(
            @RequestParam String name) {
        // name = "John"
        return ResponseEntity.ok(userService.searchByName(name));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // OPTIONAL PARAMETER (with default)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/products           → page=0, size=20
    // GET /api/v1/products?page=2    → page=2, size=20
    // GET /api/v1/products?size=50   → page=0, size=50
    @GetMapping("/products")
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.findAll(PageRequest.of(page, size)));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // TRULY OPTIONAL (null if not provided)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/orders                    → status=null, minAmount=null
    // GET /api/v1/orders?status=PENDING     → status=PENDING, minAmount=null
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) BigDecimal minAmount) {
        return ResponseEntity.ok(orderService.search(status, minAmount));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // MULTIPLE VALUES (List/Array)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/products?category=electronics&category=books&category=toys
    // OR: /api/v1/products?category=electronics,books,toys
    @GetMapping("/products/filter")
    public ResponseEntity<List<ProductResponse>> filterProducts(
            @RequestParam List<String> category) {
        // category = ["electronics", "books", "toys"]
        return ResponseEntity.ok(productService.findByCategories(category));
    }

    // GET /api/v1/items?ids=1,2,3,4,5
    @GetMapping("/items")
    public ResponseEntity<List<ItemResponse>> getItems(
            @RequestParam List<Long> ids) {
        // ids = [1L, 2L, 3L, 4L, 5L]
        return ResponseEntity.ok(itemService.findAllById(ids));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // DIFFERENT PARAMETER NAME
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/search?q=spring+boot
    @GetMapping("/search")
    public ResponseEntity<SearchResult> search(
            @RequestParam("q") String query) {  // "q" in URL → "query" in code
        return ResponseEntity.ok(searchService.search(query));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // ALL PARAMETERS AS MAP
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/custom?color=red&size=large&brand=nike
    @GetMapping("/custom")
    public ResponseEntity<Map<String, Object>> customSearch(
            @RequestParam Map<String, String> params) {
        // params = {"color": "red", "size": "large", "brand": "nike"}
        return ResponseEntity.ok(catalogService.search(params));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // DATE/TIME PARAMETERS
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/events?from=2026-01-01&to=2026-12-31
    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(eventService.findBetween(from, to));
    }

    // With time: /api/v1/logs?since=2026-02-12T08:30:00
    @GetMapping("/logs")
    public ResponseEntity<List<LogEntry>> getLogs(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime since) {
        return ResponseEntity.ok(logService.findSince(since));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // BOOLEAN PARAMETERS
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/users?active=true&verified=false
    // Note: "true", "yes", "1" all work for true
    //       "false", "no", "0" all work for false
    @GetMapping("/filtered-users")
    public ResponseEntity<List<UserResponse>> getFilteredUsers(
            @RequestParam(defaultValue = "true") boolean active,
            @RequestParam(required = false) Boolean verified) {  // Can be null
        return ResponseEntity.ok(userService.filter(active, verified));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // COMPLEX FILTERING - REAL WORLD EXAMPLE
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/v1/jobs?
    //     keyword=java&
    //     location=seattle&
    //     remote=true&
    //     minSalary=100000&
    //     maxSalary=200000&
    //     experience=SENIOR,MID&
    //     sortBy=salary&
    //     sortDir=desc&
    //     page=0&
    //     size=20

    @GetMapping("/jobs")
    public ResponseEntity<Page<JobResponse>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "false") boolean remote,
            @RequestParam(required = false) BigDecimal minSalary,
            @RequestParam(required = false) BigDecimal maxSalary,
            @RequestParam(required = false) List<ExperienceLevel> experience,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        JobSearchCriteria criteria = JobSearchCriteria.builder()
            .keyword(keyword)
            .location(location)
            .remote(remote)
            .minSalary(minSalary)
            .maxSalary(maxSalary)
            .experienceLevels(experience)
            .build();

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        PageRequest pageRequest = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(jobService.search(criteria, pageRequest));
    }
}
```

---

## Chapter 7: @PathVariable vs @RequestParam - When to Use

**@PathVariable vs @RequestParam decision guide**

| | `@PathVariable` | `@RequestParam` |
| --- | --- | --- |
| **Example URLs** | `/users/123`, `/orders/abc-def-123`, `/products/electronics/laptops` | `/users?name=John`, `/orders?status=pending`, `/products?page=2&size=10` |
| **Role** | IDENTIFIES a resource | FILTERS or MODIFIES the request |
| **Required?** | Required (part of the URL) | Usually optional |
| **Question it answers** | "WHICH specific thing?" | "HOW do you want it?" |
| **Use it for** | Resource IDs<br>Unique identifiers (UUID, slug)<br>Nested resources<br>Required path segments<br>Hierarchical data | Search/filter criteria<br>Pagination (page, size)<br>Sorting (sortBy, sortDir)<br>Optional filters<br>Boolean flags<br>Multiple values (arrays) |

**Combined usage (common pattern):** `GET /api/v1/users/123/orders?status=pending&page=0&size=10`

| Part | Annotation |
| --- | --- |
| `userId` (123) | `@PathVariable` |
| `status`, `page`, `size` | `@RequestParam` |

```java
@GetMapping("/users/{userId}/orders")
public Page<OrderResponse> getUserOrders(
    @PathVariable Long userId,                       // REQUIRED - which user?
    @RequestParam(required = false) OrderStatus status, // OPTIONAL - filter
    @RequestParam(defaultValue = "0") int page,      // OPTIONAL - pagination
    @RequestParam(defaultValue = "20") int size);    // OPTIONAL - pagination
```

**Anti-patterns (don't do these)**

| ❌ Don't | ✅ Do | Rule |
| --- | --- | --- |
| `/users?id=123` | `/users/123` | Use the path for IDs |
| `/search/John/Seattle` | `/search?name=John&city=Seattle` | Use params for filters |
| `/users/123/active/true` | `/users/123?active=true` | Use a param for state |

---

# 🧪 Section 3: Testing in Postman

---

## Chapter 8: Postman Complete Guide

**Postman testing guide**

#### 1. Create New Request

In Postman, pick the method from the dropdown (`GET`), enter the URL, and click **Send**:

`GET http://localhost:8080/api/v1/users/123?active=true`

#### 2. Path Variables In Postman

URL: http://localhost:8080/api/v1/users/:userId/orders/:orderId

Go to "Params" tab:

| Path variable | Value |
| --- | --- |
| `userId` | 123 |
| `orderId` | 456 |

Result: http://localhost:8080/api/v1/users/123/orders/456

#### 3. Query Parameters In Postman

Go to "Params" tab:

| Query param | Value |
| --- | --- |
| `status` | PENDING |
| `page` | 0 |
| `size` | 20 |
| `sort` | created,desc |

Result: ?status=PENDING&page=0&size=20&sort=created,desc

#### 4. Headers In Postman

Go to "Headers" tab:

| Key | Value |
| --- | --- |
| Content-Type | application/json |
| Accept | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIsIn... |
| X-Request-ID | abc-123-def |

#### 5. Request Body (Post/Put)

Go to "Body" tab → Select "raw" → Select "JSON"

```json
{
  "email": "john@example.com",
  "password": "SecretPass123",
  "name": "John Doe"
}
```

#### 6. FORM DATA (File Upload)

Go to "Body" tab → Select "form-data"

| Key | Type | Value |
| --- | --- | --- |
| file | File | [Select File] |
| description | Text | My document |

#### 7. Authorization Tab

Type: Bearer Token  
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

OR

Type: Basic Auth  
Username: admin  
Password: secret123

---

## Chapter 9: Postman Environment Variables & Collections

**Postman pro tips**

#### Environment Variables

Create environments: Development, Staging, Production

Variables:

| Variable | Value | Environment |
| --- | --- | --- |
| `baseUrl` | `http://localhost:8080` | Dev |
| `baseUrl` | `https://api.staging.myapp.com` | Staging |
| `baseUrl` | `https://api.myapp.com` | Prod |
| `accessToken` | (set via script) | all |

Usage in URL: {{baseUrl}}/api/v1/users  
Usage in Header: Bearer {{accessToken}}

#### PRE-REQUEST SCRIPT (JavaScript)

```javascript
// Set timestamp
pm.environment.set("timestamp", Date.now());

// Generate random email
pm.environment.set("randomEmail",
    "test" + Math.random().toString(36).substring(7) + "@example.com");
```

#### TEST SCRIPT (Validate Response)

```javascript
// Check status code
pm.test("Status is 200", function() {
    pm.response.to.have.status(200);
});

// Check response body
pm.test("Has user ID", function() {
    const json = pm.response.json();
    pm.expect(json.id).to.exist;
});
```

```javascript
// Save token from login response for future requests
var json = pm.response.json();
pm.environment.set("accessToken", json.accessToken);
```

#### COLLECTION RUNNER (Automated Testing)

Organize requests in folders:

```text
📁 My API Collection
├── 📁 Auth
│   ├── POST /auth/login
│   └── POST /auth/refresh
├── 📁 Users
│   ├── GET /users (list)
│   ├── GET /users/:id
│   ├── POST /users
│   ├── PUT /users/:id
│   └── DELETE /users/:id
└── 📁 Orders
    ├── GET /users/:userId/orders
    └── POST /users/:userId/orders
```

Run entire collection → Click "Runner" → Select collection → Run!

---

# 🌐 Section 4: Network Protocols

---

## Chapter 10: Protocol Comparison

**Network protocols overview**

**OSI model layers**

| Layer | Name | Examples |
| --- | --- | --- |
| 7 | Application | HTTP, HTTPS, FTP, SMTP, POP3, IMAP, DNS |
| 6 | Presentation | SSL/TLS, JPEG, ASCII |
| 5 | Session | NetBIOS, PPTP |
| 4 | Transport | TCP, UDP |
| 3 | Network | IP, ICMP |
| 2 | Data link | Ethernet, WiFi |
| 1 | Physical | Cables, radio waves |

**Protocol comparison**

| Protocol | Port | Purpose |
| --- | --- | --- |
| HTTP | 80 | Web pages (unencrypted) |
| HTTPS | 443 | Secure web (encrypted with TLS) |
| FTP | 21 | File transfer (command channel) |
| FTPS | 990 | Secure FTP (implicit TLS) |
| SFTP | 22 | File transfer over SSH |
| SSH | 22 | Secure shell (remote access) |
| SMTP | 25, 587 | Sending email |
| POP3 | 110, 995 | Download email (delete from the server) |
| IMAP | 143, 993 | Sync email (keep on the server) |
| DNS | 53 | Domain name resolution |
| WebSocket | 80, 443 | Bidirectional real-time communication |
| MQTT | 1883 | IoT messaging |
| gRPC | 443 | High-performance RPC |

**TCP vs UDP**

| | TCP | UDP |
| --- | --- | --- |
| Connection | Connection-oriented | Connectionless |
| Reliability | Reliable (acknowledges data) | Unreliable (fire and forget) |
| Ordering | Ordered delivery | No order guarantee |
| Error handling | Error checking and retransmission | Basic error checking only |
| Speed | Slower but reliable | Faster but may lose data |
| Used by | HTTP, HTTPS, SSH, email | DNS, video streaming, gaming, VoIP |

---

## Chapter 11: Building Protocol Clients in Spring Boot

```java
// ═══════════════════════════════════════════════════════════════════════════════
// 1. EMAIL - SMTP (Spring Mail)
// ═══════════════════════════════════════════════════════════════════════════════

// application.yml
// spring:
//   mail:
//     host: smtp.gmail.com
//     port: 587
//     username: your-email@gmail.com
//     password: ${MAIL_PASSWORD}
//     properties:
//       mail.smtp.auth: true
//       mail.smtp.starttls.enable: true

// pom.xml: spring-boot-starter-mail

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;  // Thymeleaf

    // Simple text email
    public void sendSimpleEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
        log.info("Email sent to {}", to);
    }

    // HTML email with template
    public void sendHtmlEmail(String to, String subject, String template,
                              Map<String, Object> variables) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(template, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);  // true = HTML

            mailSender.send(message);
            log.info("HTML email sent to {}", to);
        } catch (MessagingException e) {
            throw new EmailException("Failed to send email", e);
        }
    }

    // Email with attachment
    public void sendEmailWithAttachment(String to, String subject, String body,
                                         String attachmentPath) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            FileSystemResource file = new FileSystemResource(new File(attachmentPath));
            helper.addAttachment(file.getFilename(), file);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new EmailException("Failed to send email with attachment", e);
        }
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 2. FTP - File Transfer
// ═══════════════════════════════════════════════════════════════════════════════

// pom.xml: commons-net for FTP

@Service
@RequiredArgsConstructor
@Slf4j
public class FtpService {

    @Value("${ftp.host}")
    private String host;

    @Value("${ftp.port}")
    private int port;

    @Value("${ftp.username}")
    private String username;

    @Value("${ftp.password}")
    private String password;

    public void uploadFile(String localPath, String remotePath) {
        FTPClient ftpClient = new FTPClient();

        try {
            // Connect
            ftpClient.connect(host, port);
            ftpClient.login(username, password);
            ftpClient.enterLocalPassiveMode();
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);

            // Upload
            try (InputStream inputStream = new FileInputStream(localPath)) {
                boolean success = ftpClient.storeFile(remotePath, inputStream);
                if (!success) {
                    throw new FtpException("Failed to upload file");
                }
            }

            log.info("File uploaded: {} → {}", localPath, remotePath);

        } catch (IOException e) {
            throw new FtpException("FTP operation failed", e);
        } finally {
            try {
                if (ftpClient.isConnected()) {
                    ftpClient.logout();
                    ftpClient.disconnect();
                }
            } catch (IOException ignored) {}
        }
    }

    public void downloadFile(String remotePath, String localPath) {
        FTPClient ftpClient = new FTPClient();

        try {
            ftpClient.connect(host, port);
            ftpClient.login(username, password);
            ftpClient.enterLocalPassiveMode();

            try (OutputStream outputStream = new FileOutputStream(localPath)) {
                boolean success = ftpClient.retrieveFile(remotePath, outputStream);
                if (!success) {
                    throw new FtpException("Failed to download file");
                }
            }

            log.info("File downloaded: {} → {}", remotePath, localPath);

        } catch (IOException e) {
            throw new FtpException("FTP operation failed", e);
        } finally {
            try {
                if (ftpClient.isConnected()) {
                    ftpClient.logout();
                    ftpClient.disconnect();
                }
            } catch (IOException ignored) {}
        }
    }

    public List<String> listFiles(String remotePath) {
        FTPClient ftpClient = new FTPClient();

        try {
            ftpClient.connect(host, port);
            ftpClient.login(username, password);
            ftpClient.enterLocalPassiveMode();

            FTPFile[] files = ftpClient.listFiles(remotePath);
            return Arrays.stream(files)
                .map(FTPFile::getName)
                .collect(Collectors.toList());

        } catch (IOException e) {
            throw new FtpException("FTP list failed", e);
        } finally {
            try {
                if (ftpClient.isConnected()) {
                    ftpClient.logout();
                    ftpClient.disconnect();
                }
            } catch (IOException ignored) {}
        }
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 3. WebSocket - Real-time Communication
// ═══════════════════════════════════════════════════════════════════════════════

// pom.xml: spring-boot-starter-websocket

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Messages TO client use /topic prefix
        config.enableSimpleBroker("/topic", "/queue");
        // Messages FROM client use /app prefix
        config.setApplicationDestinationPrefixes("/app");
        // User-specific messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*")
                .withSockJS();  // Fallback for browsers without WebSocket
    }
}

// WebSocket Controller
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    // Receive message from client, broadcast to all subscribers
    @MessageMapping("/chat.sendMessage")  // Client sends to /app/chat.sendMessage
    @SendTo("/topic/public")              // Broadcast to all subscribers
    public ChatMessage sendMessage(ChatMessage message) {
        return message;
    }

    // Send to specific user
    @MessageMapping("/chat.sendPrivate")
    public void sendPrivateMessage(PrivateMessage message, Principal principal) {
        messagingTemplate.convertAndSendToUser(
            message.getRecipient(),
            "/queue/private",
            message
        );
    }

    // Send from any service (not just WebSocket handler)
    public void notifyUser(String username, Notification notification) {
        messagingTemplate.convertAndSendToUser(
            username,
            "/queue/notifications",
            notification
        );
    }
}

// JavaScript client:
// const socket = new SockJS('/ws');
// const stompClient = Stomp.over(socket);
// stompClient.connect({}, frame => {
//     stompClient.subscribe('/topic/public', message => {
//         console.log('Received:', JSON.parse(message.body));
//     });
//     stompClient.send('/app/chat.sendMessage', {}, JSON.stringify({text: 'Hello!'}));
// });


// ═══════════════════════════════════════════════════════════════════════════════
// 4. Raw TCP Socket Server (Custom Protocol)
// ═══════════════════════════════════════════════════════════════════════════════

@Component
@Slf4j
public class TcpServer {

    @Value("${tcp.server.port:9090}")
    private int port;

    private ServerSocket serverSocket;
    private ExecutorService executorService;

    @PostConstruct
    public void start() {
        executorService = Executors.newCachedThreadPool();

        new Thread(() -> {
            try {
                serverSocket = new ServerSocket(port);
                log.info("TCP Server started on port {}", port);

                while (!serverSocket.isClosed()) {
                    Socket clientSocket = serverSocket.accept();
                    executorService.submit(() -> handleClient(clientSocket));
                }
            } catch (IOException e) {
                log.error("TCP Server error", e);
            }
        }).start();
    }

    private void handleClient(Socket socket) {
        try (
            BufferedReader in = new BufferedReader(
                new InputStreamReader(socket.getInputStream()));
            PrintWriter out = new PrintWriter(socket.getOutputStream(), true)
        ) {
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                log.info("Received: {}", inputLine);

                // Process command (custom protocol)
                String response = processCommand(inputLine);
                out.println(response);
            }
        } catch (IOException e) {
            log.error("Client handling error", e);
        }
    }

    private String processCommand(String command) {
        // Simple command processor
        return switch (command.toUpperCase()) {
            case "PING" -> "PONG";
            case "TIME" -> LocalDateTime.now().toString();
            case "QUIT" -> "BYE";
            default -> "UNKNOWN COMMAND";
        };
    }

    @PreDestroy
    public void stop() throws IOException {
        if (serverSocket != null) {
            serverSocket.close();
        }
        if (executorService != null) {
            executorService.shutdown();
        }
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 5. gRPC - High Performance RPC
// ═══════════════════════════════════════════════════════════════════════════════

// Proto file: user_service.proto
// syntax = "proto3";
// package com.myapp;
//
// service UserService {
//   rpc GetUser (GetUserRequest) returns (UserResponse);
//   rpc ListUsers (ListUsersRequest) returns (stream UserResponse);
// }
//
// message GetUserRequest {
//   int64 id = 1;
// }
//
// message UserResponse {
//   int64 id = 1;
//   string name = 2;
//   string email = 3;
// }

// pom.xml: grpc-spring-boot-starter

@GrpcService
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void getUser(GetUserRequest request,
                        StreamObserver<UserResponse> responseObserver) {
        User user = userRepository.findById(request.getId())
            .orElseThrow(() -> new StatusRuntimeException(Status.NOT_FOUND));

        UserResponse response = UserResponse.newBuilder()
            .setId(user.getId())
            .setName(user.getName())
            .setEmail(user.getEmail())
            .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void listUsers(ListUsersRequest request,
                          StreamObserver<UserResponse> responseObserver) {
        // Streaming response
        userRepository.findAll().forEach(user -> {
            UserResponse response = UserResponse.newBuilder()
                .setId(user.getId())
                .setName(user.getName())
                .setEmail(user.getEmail())
                .build();
            responseObserver.onNext(response);
        });
        responseObserver.onCompleted();
    }
}
```

---

🔬 **Section Challenge — Chapter 11: Building Protocol Clients in Spring Boot**

**Challenge 1 (Reasoning):** Why does making 100 sequential HTTP/1.1 requests to a microservice take significantly longer than making the exact same 100 requests over HTTP/2?

<details><summary>Answer</summary>

Head-of-Line Blocking and Connection Overhead. HTTP/1.1 requires opening a new TCP connection (and performing the expensive TCP/TLS handshakes) for every few requests, and requests on the same connection must wait for the previous response to finish (Head-of-Line blocking). HTTP/2 uses a single, persistent TCP connection and multiplexes all 100 requests concurrently as interleaved binary frames, completely eliminating TCP handshake overhead and blocking.

</details>

## Chapter 12: HTTP Client Implementations

```java
// ═══════════════════════════════════════════════════════════════════════════════
// CALLING EXTERNAL APIs FROM SPRING BOOT
// ═══════════════════════════════════════════════════════════════════════════════

// Option 1: RestTemplate (Legacy, still widely used)
@Service
@RequiredArgsConstructor
public class ExternalApiService {

    private final RestTemplate restTemplate;

    public UserDto getUser(Long id) {
        String url = "https://api.external.com/users/{id}";
        return restTemplate.getForObject(url, UserDto.class, id);
    }

    public UserDto createUser(CreateUserRequest request) {
        String url = "https://api.external.com/users";
        return restTemplate.postForObject(url, request, UserDto.class);
    }

    // With headers
    public UserDto getUserWithAuth(Long id, String token) {
        String url = "https://api.external.com/users/{id}";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<UserDto> response = restTemplate.exchange(
            url, HttpMethod.GET, entity, UserDto.class, id);

        return response.getBody();
    }
}

// RestTemplate bean configuration
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(30))
            .build();
    }
}


// Option 2: WebClient (Modern, Reactive - Recommended for new projects)
@Service
@RequiredArgsConstructor
public class ReactiveApiService {

    private final WebClient webClient;

    public Mono<UserDto> getUser(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .bodyToMono(UserDto.class);
    }

    // Blocking call (if you need synchronous)
    public UserDto getUserBlocking(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .bodyToMono(UserDto.class)
            .block();  // Blocks until complete
    }

    // With error handling
    public Mono<UserDto> getUserWithErrorHandling(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .onStatus(HttpStatus::is4xxClientError, response ->
                Mono.error(new ClientException("Client error: " + response.statusCode())))
            .onStatus(HttpStatus::is5xxServerError, response ->
                Mono.error(new ServerException("Server error: " + response.statusCode())))
            .bodyToMono(UserDto.class)
            .timeout(Duration.ofSeconds(10));
    }
}

// WebClient bean configuration
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
            .baseUrl("https://api.external.com")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .filter(logRequest())
            .build();
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.info("Request: {} {}", clientRequest.method(), clientRequest.url());
            return Mono.just(clientRequest);
        });
    }
}


// Option 3: OpenFeign (Declarative HTTP Client)
// pom.xml: spring-cloud-starter-openfeign

@EnableFeignClients  // On main application class

@FeignClient(name = "user-service", url = "${external.api.url}")
public interface UserClient {

    @GetMapping("/users/{id}")
    UserDto getUser(@PathVariable Long id);

    @GetMapping("/users")
    List<UserDto> getAllUsers(@RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size);

    @PostMapping("/users")
    UserDto createUser(@RequestBody CreateUserRequest request);

    @PutMapping("/users/{id}")
    UserDto updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request);

    @DeleteMapping("/users/{id}")
    void deleteUser(@PathVariable Long id);
}

// Usage in service
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserClient userClient;  // Auto-injected

    public UserDto getUser(Long id) {
        return userClient.getUser(id);
    }
}
```

---

_Continue to Part 11: Authentication & Authorization_

---

**Navigation**: [< Previous](Ch41_SB_Architecture_Quality.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch43_SB_Auth_Security.md)

🔬 **Section Challenge — Chapter 12: HTTP Client Implementations**

**Challenge 1 (Design — Who/When/What):** `RestTemplate` vs `WebClient` — both make HTTP calls. **Who** blocks the calling thread? **When** should you pick `WebClient` even in a non-reactive app? **What** does `WebClient.block()` do internally?

<details><summary>Answer</summary>

**Who blocks?** `RestTemplate` always blocks the calling thread — it's synchronous. `WebClient` is non-blocking by default. **When pick WebClient in non-reactive?** (1) When you need reactive features like streaming, SSE, or connection pooling with backpressure. (2) RestTemplate is in maintenance mode since Spring 5 — new features only in WebClient. (3) When consuming microservices with variable latency — `WebClient` can aggregate multiple parallel calls with `Mono.zip()`. **What does `block()` do?** Subscribes to the reactive pipeline and blocks the current thread until the result arrives — similar to `CompletableFuture.get()`. You get the convenience of sync code while the underlying HTTP layer remains non-blocking. Downside: defeats reactive scalability — avoid in reactive contexts.

</details>


---

## Reality Check

**"HTTP is stateless so the server remembers nothing"** — HTTP the PROTOCOL is stateless — each request is independent. But applications build statefulness ON TOP: session cookies, JWT tokens, server-side session stores. Spring Security's SecurityContextPersistenceFilter restores the authentication context from the HTTP session on every request. The protocol is stateless; the application is not.

**"HTTPS encrypts everything"** — HTTPS encrypts the request BODY, headers, and path, but the destination HOSTNAME is visible in the TLS SNI (Server Name Indication) extension — sent in plaintext during the TLS handshake. The IP address is always visible. DNS queries (unless using DoH/DoT) reveal the domain. HTTPS protects content confidentiality, not connection metadata.

**"REST is a protocol"** — REST is an ARCHITECTURAL STYLE, not a protocol. The protocol is HTTP. REST defines constraints: statelessness, uniform interface, resource identification via URIs, and representation transfer. Most APIs called RESTful are actually RPC-over-HTTP — they use HTTP as transport but violate REST constraints like HATEOAS. This matters because true REST enables client evolution without server changes.

**"Connection: keep-alive is the default since HTTP/1.1"** — True for HTTP/1.1 but misleading in practice. Spring Boot with embedded Tomcat defaults to keep-alive with a timeout of 60 seconds and a max of 100 requests per connection. Load balancers, proxies, and CDNs may close connections sooner based on their own timeouts. A keep-alive timeout mismatch between client and server causes connection reset errors that are difficult to diagnose.

**"HTTP status codes have strict definitions"** — The RFC defines status codes, but real APIs use them inconsistently. Some APIs return 200 for everything with an error field in the body. Others return 400 for business rule violations that are not technically bad requests. Spring Boot default error handling returns 500 for any unhandled exception — whether it is a bug or a known business error. Consistent status code semantics are a DESIGN choice your team makes, not a guarantee from the framework.
