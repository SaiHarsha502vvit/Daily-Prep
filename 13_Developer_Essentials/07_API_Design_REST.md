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
