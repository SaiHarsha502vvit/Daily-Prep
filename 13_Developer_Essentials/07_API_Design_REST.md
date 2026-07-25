# 🌐 API Design & REST — Complete Guide

**Navigation**: [< Testing](06_Testing_Fundamentals.md) | [Index](00_INDEX.md) | [Next: Security >](08_Security_Fundamentals.md)

---

# WHY: Why API Design Matters

## The Contract Between Systems

```
┌─────────────┐     HTTP Request       ┌─────────────┐
│   Frontend  │ ──────────────────>    │   Backend   │
│  (React/    │                        │  (Spring    │
│   Angular ) │ <──────────────────    │   Boot)     │
│             │     HTTP Response      │             │
└─────────────┘                        └─────────────┘

┌─────────────┐     HTTP Request       ┌─────────────┐
│   Mobile    │ ──────────────────>    │   Your API  │
│   App       │ <──────────────────    │             │
└─────────────┘     HTTP Response      └─────────────┘

┌─────────────┐     HTTP Request       ┌─────────────┐
│   Partner   │ ──────────────────>    │   Your API  │
│   Company   │ <──────────────────    │             │
└─────────────┘     HTTP Response      └─────────────┘

Your API = a CONTRACT. Once published, breaking changes = TRUST broken.
```

---

# WHAT: REST Principles

## REST = REpresentational State Transfer

```
6 Constraints:
  1. CLIENT-SERVER      — Client and server evolve independently
  2. STATELESS          — Each request contains ALL info needed (no server memory)
  3. CACHEABLE          — Responses declare if they can be cached
  4. UNIFORM INTERFACE  — Consistent URL patterns and methods
  5. LAYERED SYSTEM     — Client doesn't know if talking to real server or proxy
  6. CODE ON DEMAND     — (Optional) Server can send executable code
```

## HTTP Methods (Verbs)

```
Method  │ Purpose          │ Idempotent? │ Safe? │ Body?
────────┼──────────────────┼─────────────┼───────┼──────
GET     │ Read resource    │ Yes         │ Yes   │ No
POST    │ Create resource  │ No          │ No    │ Yes
PUT     │ Replace entirely │ Yes         │ No    │ Yes
PATCH   │ Partial update   │ No*         │ No    │ Yes
DELETE  │ Remove resource  │ Yes         │ No    │ No

Idempotent = calling it N times gives same result as calling once
Safe = does NOT modify server state

Example:
  GET  /users/42      → Returns user 42 (no change)
  DELETE /users/42    → Deletes user 42 (calling again = same state)
  POST /users         → Creates new user (calling twice = TWO users!)
```

🔬 **Section Challenge — HTTP Methods (Verbs)**

**Challenge 1 (Reasoning):** `PUT /api/users/42` and `PATCH /api/users/42` both update user 42. When does idempotency matter and which one is NOT idempotent by definition?

<details><summary>Answer</summary>

`PUT` is idempotent: calling it 5 times has the same effect as calling it once — it completely replaces the resource with the full body you send. `PATCH` is **not idempotent by definition** (though implementations can make it so). Example: `PATCH {"views": "+1"}` increments the view count — calling it 5 times = 5 increments. `PUT {"views": 100}` called 5 times = still 100. Idempotency matters in network failures: if a client retries a timed-out request, `PUT` is safe to retry. Blindly retrying `POST` creates duplicate orders. This is why payment APIs use **idempotency keys** — a unique UUID per request that the server uses to deduplicate retries.

</details>

## HTTP Status Codes

```
2xx SUCCESS:
  200 OK               → GET/PUT/PATCH succeeded
  201 Created           → POST succeeded, new resource created
  204 No Content        → DELETE succeeded, nothing to return

3xx REDIRECTION:
  301 Moved Permanently → Resource has new URL forever
  304 Not Modified      → Cached version is still valid

4xx CLIENT ERROR:
  400 Bad Request       → Malformed JSON, missing required field
  401 Unauthorized      → Not authenticated (who are you?)
  403 Forbidden         → Authenticated but not authorized (you can't do this)
  404 Not Found         → Resource doesn't exist
  409 Conflict          → Duplicate key, version conflict
  422 Unprocessable     → Valid JSON, but business logic rejects it
  429 Too Many Requests → Rate limited

5xx SERVER ERROR:
  500 Internal Error    → Bug in your code
  502 Bad Gateway       → Upstream service down
  503 Service Unavailable → Server overloaded, try later
```

---

🔬 **Section Challenge — HTTP Status Codes**

**Challenge 1 (Trace):** Your API returns `403 Forbidden` when a user tries to access another user’s order. A teammate says it should be `404 Not Found` to avoid leaking that the resource exists. Who is right and why?

<details><summary>Answer</summary>

Both are defensible, and this is a real security design decision. Returning `403` is technically correct (you’re authenticated but unauthorized) but **confirms the resource exists** — an attacker can enumerate valid IDs by seeing 403 vs 404. Returning `404` for unauthorized resources is the **security-by-obscurity** pattern (used by GitHub — private repos return 404 to non-members, not 403). The right answer for interviews: acknowledge the tradeoff. In high-security APIs (healthcare, finance), prefer `404` to prevent information leakage. In internal APIs where enumeration isn’t a threat model, `403` is clearer. Distinguish `401` (not authenticated — no token) from `403` (authenticated but forbidden — valid token, wrong role).

</details>

# HOW: Designing Good APIs

## Level 1 — URL Structure

```
RULE: Use NOUNS (resources), not VERBS (actions)

✅ GOOD:
  GET    /api/users              → List all users
  GET    /api/users/42           → Get user 42
  POST   /api/users              → Create user
  PUT    /api/users/42           → Update user 42
  DELETE /api/users/42           → Delete user 42

❌ BAD:
  GET    /api/getUsers
  POST   /api/createUser
  POST   /api/deleteUser/42
  GET    /api/getUserByName?name=John

NESTED resources:
  GET    /api/users/42/orders           → All orders for user 42
  GET    /api/users/42/orders/7         → Order 7 of user 42
  POST   /api/users/42/orders           → Create order for user 42

PATH rules:
  - Use kebab-case: /api/user-profiles (NOT /api/userProfiles)
  - Use PLURAL: /api/users (NOT /api/user)
  - Max 3 levels deep: /api/users/42/orders (NOT /api/a/b/c/d/e)
  - Version in URL: /api/v1/users
```

## Level 2 — Request & Response Design

```java
// REQUEST: Create a user
POST /api/v1/users
Content-Type: application/json

{
    "name": "Sai Harsha",
    "email": "harsha@example.com",
    "role": "DEVELOPER"
}

// RESPONSE: 201 Created
{
    "id": 42,
    "name": "Sai Harsha",
    "email": "harsha@example.com",
    "role": "DEVELOPER",
    "createdAt": "2026-03-03T10:30:00Z",
    "links": {
        "self": "/api/v1/users/42",
        "orders": "/api/v1/users/42/orders"
    }
}
```

## Level 3 — Pagination

```java
// REQUEST: Page 2 of users, 20 per page
GET /api/v1/users?page=2&size=20&sort=name,asc

// RESPONSE:
{
    "data": [
        {"id": 21, "name": "Alice"},
        {"id": 22, "name": "Bob"}
    ],
    "pagination": {
        "page": 2,
        "size": 20,
        "totalElements": 150,
        "totalPages": 8,
        "hasNext": true,
        "hasPrevious": true
    }
}

// Spring Boot Implementation:
@GetMapping("/users")
public Page<UserDTO> getUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "name") String sort
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(sort));
    return userService.findAll(pageable);
}
```

## Level 4 — Error Handling

```java
// CONSISTENT error response format:
{
    "status": 400,
    "error": "Bad Request",
    "message": "Validation failed",
    "timestamp": "2026-03-03T10:30:00Z",
    "path": "/api/v1/users",
    "details": [
        {"field": "email", "message": "must be a valid email address"},
        {"field": "name", "message": "must not be blank"}
    ]
}

// Spring Boot Global Exception Handler:
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> details = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(f -> new FieldError(f.getField(), f.getDefaultMessage()))
            .toList();

        return new ErrorResponse(400, "Validation failed", details);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse(404, ex.getMessage(), null);
    }
}
```

## Level 5 — Versioning & Evolution

```
Strategy 1: URL versioning (MOST COMMON)
  /api/v1/users
  /api/v2/users

Strategy 2: Header versioning
  GET /api/users
  Accept: application/vnd.myapp.v2+json

Strategy 3: Query param
  GET /api/users?version=2

ADDING fields     → NOT a breaking change (backward compatible)
REMOVING fields   → BREAKING change (must version)
CHANGING types    → BREAKING change (string → int)
CHANGING URL      → BREAKING change (new version)
```

**Versioning strategy comparison**:

| Aspect | URI versioning | Header versioning | Query param versioning |
|---|---|---|---|
| Client discoverability | High (`/api/v1` is visible in URL) | Low (hidden in `Accept` header) | Medium (`?version=2` is visible) |
| CDN cacheability | High (different URI = different cache entry) | Low (CDN must vary on `Accept` header) | Medium (different query = different cache key) |
| Documentation burden | Low (Swagger groups by URI prefix) | Medium (need to document `Accept` header values) | Medium |
| Breaking change visibility | Highest (URL change is obvious) | Low (header change is silent) | Medium |
| Browser-testable | Yes (paste URL in browser) | Hard (need to set headers) | Yes |
| REST purity | Low (resource URIs shouldn't change) | High (resources are version-independent) | Low |

## Level 6 — Filtering, Sorting, Field Selection

```
FILTERING:
  GET /api/users?role=DEVELOPER&status=active&minAge=25

SORTING (multiple fields):
  GET /api/users?sort=name,asc&sort=createdAt,desc

FIELD SELECTION (reduce payload):
  GET /api/users?fields=id,name,email

SEARCH:
  GET /api/users?search=harsha
```

---

🔬 **Section Challenge — Level 6 — Filtering, Sorting, Field Selection**

**Challenge 1 (Design):** A client requests `GET /api/users?fields=id,name`. Your `User` entity has 20 fields including `passwordHash` and `ssn`. What are the two risks of a naive “field selection” implementation and how do you prevent them?

<details><summary>Answer</summary>

1. **Sensitive field exposure**: if you implement field selection by reflecting over the entity and filtering by field name, a client could request `?fields=passwordHash,ssn` and receive them in the response. Fix: use a DTO allowlist — only expose fields that exist on your `UserResponse` DTO, never filter from the entity directly. The DTO is the contract; entities are internal. 2. **N+1 query on join fields**: `?fields=name,orderCount` might trigger a lazy-loaded `orders` collection per user if you’re not careful. Fix: use projections at the JPA/query layer — `SELECT u.name, COUNT(o.id) FROM User u LEFT JOIN u.orders o GROUP BY u.id` rather than fetching full entities and filtering in Java.

</details>

# WHERE: Real-World Patterns

## DTO Pattern

```java
// NEVER expose your Entity directly in API

// Entity (database table)
@Entity
public class User {
    @Id private Long id;
    private String name;
    private String email;
    private String passwordHash;  // NEVER send to client!
    private String ssn;           // NEVER send to client!
    private LocalDateTime createdAt;
}

// Response DTO (what client sees)
public record UserResponse(
    Long id,
    String name,
    String email,
    LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(), user.getName(),
            user.getEmail(), user.getCreatedAt()
        );
    }
}

// Request DTO (what client sends)
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email,
    @Size(min = 8) String password
) {}
```

## Rate Limiting

```
WHY: Prevent abuse, protect server resources

Implementation (Spring Boot + Bucket4j):
  - 100 requests per minute per user
  - Return 429 Too Many Requests when exceeded
  - Include headers: X-RateLimit-Remaining, X-RateLimit-Reset

Common limits:
  Public API:        60 requests/minute
  Authenticated:     1000 requests/minute
  Admin:             Unlimited
```

---

🔬 **Section Challenge — Rate Limiting**

**Challenge 1 (Reasoning):** Explain the difference between a **fixed window** and a **sliding window** rate limiter. Which one allows a burst attack at the window boundary?

<details><summary>Answer</summary>

**Fixed window**: counter resets at a fixed clock boundary (e.g., every 60 seconds at :00). A client can make 100 requests at :59, then 100 more at :01 of the next window = 200 requests in 2 seconds. This is the **boundary burst attack**. **Sliding window**: tracks timestamps of recent requests in a rolling log. At any point in time, it counts requests in the last 60 seconds — no boundary to exploit. More accurate but requires storing per-request timestamps (memory cost). Sliding window log variant uses O(requests) memory; sliding window counter (Redis sorted set or two-bucket approximation) reduces this. Bucket4j (used in Spring Boot) implements the **token bucket** algorithm: a bucket holds N tokens, refilled at a constant rate. A burst consumes tokens instantly, then rate is throttled by the refill rate — this allows legitimate traffic spikes without the boundary exploit.

</details>

**Challenge 2 (Design):** Your API returns `429 Too Many Requests`. What headers should you include in the response, and why does each one matter to the client?

<details><summary>Answer</summary>

Standard rate limit headers: `X-RateLimit-Limit: 100` (the total allowed per window), `X-RateLimit-Remaining: 0` (tokens left in this window), `X-RateLimit-Reset: 1709500060` (Unix timestamp when the window resets — client knows exactly when to retry), `Retry-After: 30` (seconds until retry — required by RFC 6585 for 429). Without these headers, clients have no way to implement **exponential backoff** intelligently — they’ll retry immediately, hammering your server further. Well-behaved API clients (Stripe SDK, Twilio SDK) read `Retry-After` and sleep exactly that duration. Missing these headers turns a protection mechanism into a source of cascading retry storms.

</details>

## WHEN: REST vs GraphQL vs gRPC Decision Guide

| Situation | Pick | Why |
|---|---|---|
| Public API for third-party developers | **REST** | Universal HTTP support, well-understood, easy documentation, OpenAPI tooling |
| Mobile app with variable screen layouts | **GraphQL** | Client requests exactly the fields needed; reduces over-fetching on slow networks |
| Internal microservice-to-microservice | **gRPC** | Strongly-typed contracts (protobuf), 5-10× faster than REST/JSON, bidirectional streaming |
| File uploads / large binary payloads | **REST** (multipart) | gRPC supports streaming but tooling is immature; GraphQL file uploads require special handling |
| Real-time bidirectional (chat, live updates) | **WebSocket** or **gRPC streaming** | REST is request-response only; GraphQL subscriptions exist but are complex |
| Quick prototype, small team | **REST** | Lowest tooling overhead; can migrate to GraphQL/gRPC later if needed |

**Pagination style selection**:
- **Offset pagination** (`?page=2&size=20`): simple, but breaks when records are inserted between requests (drift)
- **Cursor pagination** (`?cursor=eyJpZCI6MTAwfQ==`): stable under writes, used by Stripe, GitHub
- **Keyset pagination** (`?after_id=100&limit=20`): most efficient, requires indexed sort key
- **Use offset** for admin UIs where drift is acceptable; **use cursor** for user-facing infinite scroll; **use keyset** for high-throughput internal APIs

**Versioning strategy selection**:
- **URI versioning** when: clients cache responses, third-party developers, mobile apps that ship infrequently
- **Header versioning** when: internal APIs, strict REST compliance required, all clients are within your control
- **No versioning** when: GraphQL (use schema evolution with deprecation) or additive-only changes (new endpoints, never break old ones)

---

# 🧭 API Design Cheat Sheet

```
URL:         /api/v1/{resource-plural}/{id}
Methods:     GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
Status:      2xx (success), 4xx (client error), 5xx (server error)
Pagination:  ?page=0&size=20&sort=field,asc
Errors:      Consistent JSON with status, message, details
Security:    Bearer token in Authorization header
Versioning:  /api/v1/ in URL path
```

---

## Historical Evolution

**Roy Fielding** published his **dissertation "Architectural Styles and the Design of Network-Based Software Architectures"** in **2000** at UC Irvine — the document that formalized REST (Representational State Transfer). Fielding was one of the principal authors of HTTP/1.1 (RFC 2616, 1999); REST was the architectural philosophy behind HTTP's design.

**HTTP versions**:
- **HTTP/0.9** (1991) — single-line protocol, GET only, no headers
- **HTTP/1.0** (1996, RFC 1945) — request/response format, headers, status codes, methods beyond GET
- **HTTP/1.1** (1999, RFC 2616; revised RFC 7230-7235 in 2014) — persistent connections, chunked transfer, host header
- **HTTP/2** (2015, RFC 7540) — binary framing, multiplexing, server push, header compression (HPACK)
- **HTTP/3** (2022, RFC 9114) — QUIC transport (UDP-based), 0-RTT handshake, connection migration

**REST alternatives motivated by REST limitations**:
- **GraphQL** (Facebook, 2015, open-sourced) — solves over-fetching and under-fetching; client specifies exact fields needed. Trade-off: no HTTP caching, complex server-side query planning.
- **gRPC** (Google, 2015, open-sourced 2017) — binary protocol (Protocol Buffers), HTTP/2 multiplexing, strongly-typed contracts. Trade-off: not browser-friendly without a proxy; steep tooling learning curve.
- **Webhook pattern** (2007, term coined by Jeff Lindsay) — server pushes events via HTTP POST. Used for Stripe, GitHub, Slack integrations.

**API versioning evolution**:
- **URI versioning**: `/api/v1/users` — oldest, easiest for clients to discover
- **Header versioning**: `Accept: application/vnd.myapi.v2+json` — purer REST, harder to discover
- **Query param versioning**: `/api/users?version=2` — easy to test in browser, often considered an anti-pattern
- **GraphQL**: versioning largely unnecessary (schema evolution with deprecation)

---

# 🏋️ Practice

## Exercise 1: Design an API

```
Design RESTful endpoints for an E-Commerce system:
  - Products (CRUD + search + filter by category)
  - Shopping Cart (add/remove/view items)
  - Orders (place order, view history, cancel)
  - Reviews (add review, list reviews for product)
Write the URL, method, request body, response body, and status codes.
```

## Exercise 2: Build It

```
Using Spring Boot, implement a REST API for a TODO app:
  - POST /api/todos (create)
  - GET /api/todos (list with pagination)
  - GET /api/todos/{id} (get one)
  - PUT /api/todos/{id} (update)
  - DELETE /api/todos/{id} (delete)
  - Add validation, error handling, DTO pattern
```

### Production Reality

**API design decisions fail in production in these named ways:**

- **Rate limiting absence causing backend overload** — an API without rate limiting accepts unlimited requests from any client. A single misconfigured client with a tight loop can send 10,000 req/s to an endpoint designed for 100 req/s. The database connection pool exhausts; the API returns 503 for all users, including well-behaved clients. The fix (Bucket4j with Redis backend) must be in place before the incident, not after.
- **Idempotency key collisions in retry logic** — client retries a POST `/payments` request on timeout but uses the same idempotency key (`Idempotency-Key: abc-123`) as a previous request with different body content (e.g., amount changed between retries). The server returns the cached response for the original amount, processing the wrong payment. Fix: idempotency key must scope to the exact request body, not just the endpoint.
- **Pagination cursor drift** — cursor-based pagination using `created_at` timestamp drifts when records are inserted or updated during iteration. A page fetched at noon with cursor `2024-01-15T12:00:00Z` returns items created before noon. If a record is created at `2024-01-15T11:59:59Z` between page 1 and page 2 fetch, it appears in page 2 (already seen), or disappears entirely. Fix: use opaque cursor (encoded position) rather than timestamp.
- **Version mismatch in breaking change** — `/api/v1/users` removes the `email` field. A client on an older app version still reads `user.email` and gets `undefined`. The client crashes on `.toLowerCase()` when rendering the email field. No 400 error, no deprecation warning — just a silent JS exception on user devices. Semantic versioning and sunset headers are the production discipline.

**Debug workflow:** For rate limiting: monitor `429 Too Many Requests` rate by client in CloudWatch/Grafana; for pagination drift: verify with `db.orders.count()` vs total API pagination count; for idempotency collisions: log all idempotency key collisions in a dedicated metric.
**Mitigation discipline:** Implement rate limiting before production launch, not after the first DDoS. Use ISO 8601 deprecation headers (`Sunset`, `Deprecation`) when removing API fields. Use opaque cursor pagination for mutable datasets. Test API backward compatibility with consumer-driven contract testing (Pact).

---

**Next Chapter**: [Security Fundamentals →](08_Security_Fundamentals.md)


---

## Reality Check

**"REST means JSON over HTTP with the right verbs"** ? The verb table is the surface; the load-bearing semantics are IDEMPOTENCY and SAFETY classes: GET must be safe (no side effects � the GET-that-mutates breaks caches, prefetchers, and crawlers in ways that surface as mystery data changes), PUT and DELETE are idempotent BY CONTRACT (retry-safe � the network layer depends on it), POST is neither (hence idempotency keys for money-moving POSTs � the client-generated dedup token that makes retries safe, [distributed-systems]' ambiguous-timeout lesson landing in API design). Teams that treat the verbs as naming conventions rather than retry contracts rediscover why the contracts exist during their first double-charge incident.

**"Status codes are error message flavors"** ? Status codes are MACHINE ROUTING signals consumed by infrastructure before humans: caches treat 200 and 404 differently (the 200-with-error-body anti-pattern making failures cacheable and monitoring blind � error rates invisible because everything is 200), retry layers key on 429-versus-4xx-versus-503 (retrying a 400 is waste; NOT retrying a 503 is fragility; missing Retry-After on 429 invites the stampede), and clients branch on the 401-versus-403 distinction (re-authenticate versus give up � conflating them breaks token-refresh flows). The design test: could a generic client with no knowledge of your API make correct retry/cache/auth decisions from your status codes alone?

**"Versioning is a URL prefix decision"** ? The prefix debate distracts from the actual discipline: COMPATIBILITY RULES that make most versioning unnecessary � additive changes only (new optional fields, new endpoints), tolerant readers on both sides (unknown fields ignored, never fatal), explicit deprecation lifecycle (header-signaled, dashboard-tracked consumer migration, sunset dates that are dates). Breaking changes then become rare, deliberate events with migration paths, not version-number increments. APIs that version-prefix eagerly accumulate v1-through-v4 all in production forever (each a permanent maintenance surface); APIs that engineer compatibility ship one living version � the version story IS the change-management story, and the URL is its least important sentence.

**"Pagination is offset and limit"** ? Offset pagination degrades on both axes that matter: performance (offset 500000 scans and discards half a million rows � the deep-page timeout) and CORRECTNESS under mutation (rows inserted or deleted mid-pagination shift the window � duplicates and gaps in every moving dataset, the pagination bug every feed reimplementation ships). Cursor pagination (opaque token encoding the last-seen sort key) fixes both � stable under writes, index-seek performance � at the cost of no random page access (usually a fake requirement). The professional default: cursors for anything that mutates or scales, offsets only for small static admin lists � and the cursor stays OPAQUE (clients that parse your cursor have coupled to your sort implementation forever).

**"Good API docs describe every endpoint"** ? Endpoint enumeration is reference, not design communication � the gaps that generate integration tickets are CROSS-CUTTING contracts docs rarely state: the error envelope (one shape for all failures, with machine-readable codes � clients build their error handling against this once or per-endpoint forever), null-versus-absent semantics (does the PATCH with a null field clear it or ignore it � the question every integration asks eventually), rate-limit behavior (headers, windows, what a burst looks like), and consistency guarantees (is the write immediately readable � [system-design]'s replica-lag surfacing as API confusion). The upgrade path: an examples-first contract (OpenAPI with real request/response pairs per outcome, including failures), because integrators copy examples and only read prose when the examples fail them.
