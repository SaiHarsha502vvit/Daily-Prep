**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Monitoring](12_Monitoring_Observability.md)
🧠 **Mental Model**: See [Production Debugging Thinking](../14_Mental_Models/18_Production_Debugging_Thinking.md)

---

# 🏭 Production-Grade Code Practices — 12-Factor, Logging, Error Handling

What separates hobby code from production-ready software

---

## 📌 WHY / WHAT / WHERE / WHEN / WHO / HOW

**WHY**: Code that runs in production is fundamentally different from tutorial code. Tutorial code runs in ideal conditions with a single user and infinite resources; production code must handle partial failures, concurrent requests, and adversarial inputs. The cost difference is measurable: Heroku's "12-Factor App" methodology codifies patterns that reduce production incidents by 40–60% (per the methodology's published case studies). Without production-aware code practices, every deployment is a high-risk event.

**WHAT**: The 12-Factor App methodology (config, dependencies, backing services, build/release/run stages, processes, port binding, concurrency, disposability, dev/prod parity, logs, admin processes); structured logging with correlation IDs (MDC); error handling patterns that don't leak stack traces; configuration externalization; database migration patterns; feature flags; deployment strategies (blue-green, canary, rolling); testing in production (dark launches, A/B tests).

**WHERE**: Every production service post-2015. The 12-Factor methodology was published by **Heroku co-founder Adam Wiggins et al. in 2011** and has been adopted by Netflix, Uber, Airbnb, and most YC-funded startups. Heroku itself runs millions of apps on these principles. The Spring Boot framework explicitly supports 12-Factor patterns (external config via `application.yml`, embedded servers for port binding, Actuator for health checks).

**WHEN**: When designing any new service (start with 12-Factor). When migrating from monolith to microservices. When debugging production incidents (often reveals gaps in 12-Factor adherence). When onboarding a new engineer to a codebase (12-Factor is the shared vocabulary).

**WHO**: Adam Wiggins (Heroku co-founder) authored the original 12-Factor blog post in **2011**; the methodology crystallized patterns Heroku observed across thousands of customer deployments. Spring Boot (Pivotal, **April 2014**) and Cloud Foundry (**2011**) adopted these patterns as framework defaults. Cloud-native as a movement gained traction ~2015 with the founding of the Cloud Native Computing Foundation (CNCF).

**HOW**: 12-Factor overview first (each factor with a concrete Spring Boot example), then structured logging with MDC correlation IDs, then error handling that doesn't leak stack traces, then configuration externalization (env vars, Vault, AWS Secrets Manager). Database migrations, feature flags, deployment strategies, and testing-in-production are covered in detail in subsequent sections. Each factor ends with a local challenge testing the rule against a concrete code scenario.

## Part 1: The 12-Factor App

12 principles for building cloud-native, production-ready applications

1. Codebase     │ One codebase in version control, many deploys
2. Dependencies │ Explicitly declare and isolate (pom.xml, package.json)
3. Config       │ Store in environment variables, NOT in code
4. Backing Svcs │ Treat DB, cache, queue as attached resources (swap easily)
5. Build/Release│ Strict separation: build → release → run
6. Processes     │ Stateless. Store shared state in DB/cache, not memory
7. Port Binding │ App is self-contained, exports HTTP via port binding
8. Concurrency  │ Scale out via process model (more instances, not threads)
9. Disposability│ Fast startup, graceful shutdown (handle SIGTERM)
10. Dev/Prod Par.│ Keep dev, staging, prod as similar as possible
11. Logs         │ Treat logs as event streams (stdout, not files)
12. Admin Procs. │ Run admin tasks as one-off processes (migrations, scripts)

---

## Part 2: Configuration Management

```java
// ❌ BAD: Hardcoded config
String dbUrl = "jdbc:postgresql://localhost:5432/mydb";

// ✅ GOOD: Externalized config
// application.yml
// spring:
//   datasource:
//     url: ${DATABASE_URL}
//     username: ${DB_USER}
//     password: ${DB_PASSWORD}

// ✅ GOOD: Config server for microservices
// Spring Cloud Config Server → central config for all services
// Profiles: application-dev.yml, application-prod.yml

// ✅ GOOD: Secrets management
// Never store secrets in code/git
// Use: AWS Secrets Manager, HashiCorp Vault, K8s Secrets
```

---

## Part 3: Structured Logging

```java
// ❌ BAD: Unstructured log
System.out.println("Order processed for user " + userId);

// ❌ BAD: String concatenation (evaluated even if log level disabled)
log.debug("Processing order " + order.toString());

// ✅ GOOD: Parameterized, structured logging
log.info("Order processed userId={} orderId={} amount={}", userId, orderId, amount);

// ✅ GOOD: MDC (Mapped Diagnostic Context) for request tracing
public class RequestFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) {
        String correlationId = Optional.ofNullable(
            ((HttpServletRequest) req).getHeader("X-Correlation-ID"))
            .orElse(UUID.randomUUID().toString());
        
        MDC.put("correlationId", correlationId);
        MDC.put("userId", extractUserId(req));
        try {
            chain.doFilter(req, resp);
        } finally {
            MDC.clear(); // ALWAYS clear MDC
        }
    }
}

// logback-spring.xml pattern:
// %d{ISO8601} [%thread] %-5level %logger{36} [%X{correlationId}] - %msg%n
```

### Log Levels Guide

```
┌───────────┬──────────────────────────────────────────────────────────────────┐
│ Level     │ When to Use                                                      │
├───────────┼──────────────────────────────────────────────────────────────────┤
│ ERROR     │ Something failed that needs human attention NOW                  │
│           │ e.g., payment gateway down, data corruption                      │
│ WARN      │ Something unexpected but handled. Monitor trends.                │
│           │ e.g., retry succeeded, cache miss, deprecated API call           │
│ INFO      │ Business-significant events. "What happened?"                    │
│           │ e.g., order placed, user registered, deployment started          │
│ DEBUG     │ Detailed flow for troubleshooting. Off in prod.                  │
│           │ e.g., SQL queries, request/response bodies                       │
│ TRACE     │ Very fine-grained. Almost never in prod.                         │
│           │ e.g., entering/exiting methods, variable values                  │
└───────────┴──────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — Part 3: Structured Logging**

**Challenge 1 (Bug Hunt):** A production service logs every DB query at `DEBUG` level. A developer enables `DEBUG` logging to investigate a bug and the server runs out of memory in 3 minutes. What caused this and how do you safely enable debug logging in production?

<details><summary>Answer</summary>

The cause: with `DEBUG` enabled, every SQL query, every request/response body, and every framework internal is logged. Under 500 req/s this generates ~50MB/s of log data. The JVM log buffer fills, GC pressure spikes, then heap exhaustion → OOM. Safe alternatives: (1) **Dynamic log level via Actuator** — `POST /actuator/loggers/com.myapp.OrderService` with body `{"configuredLevel": "DEBUG"}` — enables debug for ONE class for a short window, then revert. (2) **Sampling** — log only 1% of DEBUG events in production using a filter. (3) **Conditional DEBUG** — `if (log.isDebugEnabled())` prevents string interpolation cost when DEBUG is off. Never enable root-level DEBUG in production.

</details>

**Challenge 2 (Reasoning):** An MDC `correlationId` set in a request filter leaks into a subsequent unrelated request. What is the exact mechanism and which line of code prevents it?

<details><summary>Answer</summary>

Mechanism: Spring Boot uses a thread pool (Tomcat default: 200 threads). When request 1 completes, its thread returns to the pool. If the `finally { MDC.clear(); }` block is missing, the `correlationId` stays in the thread's `ThreadLocal` storage. Request 2 from a different user picks up the same thread → logs for request 2 contain request 1's `correlationId` → distributed tracing is corrupted. Prevention: `MDC.clear()` in the `finally` block of the filter (not just the normal path). The `finally` guarantees execution even on exception. This is why the code example shows `try { chain.doFilter() } finally { MDC.clear() }` — the `finally` is load-bearing, not optional.

</details>

## Part 4: Error Handling

```java
// ❌ BAD: Generic catch-all
try {
    processOrder(order);
} catch (Exception e) {
    e.printStackTrace(); // goes to stdout, no context, no alert
}

// ✅ GOOD: Specific exceptions, proper handling
try {
    processOrder(order);
} catch (InsufficientInventoryException e) {
    log.warn("Out of stock orderId={} productId={}", order.getId(), e.getProductId());
    return OrderResult.outOfStock(e.getProductId());
} catch (PaymentDeclinedException e) {
    log.warn("Payment declined orderId={} reason={}", order.getId(), e.getReason());
    return OrderResult.paymentFailed(e.getReason());
} catch (Exception e) {
    log.error("Unexpected error processing orderId={}", order.getId(), e);
    alertService.notifyOnCall("Order processing failed", e);
    throw new OrderProcessingException("Failed to process order", e);
}

// ✅ GOOD: Global exception handler (Spring Boot)
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(404)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(500)
            .body(new ErrorResponse("INTERNAL_ERROR", "Something went wrong"));
        // NEVER leak stack traces to client in production!
    }
}
```

---

🔬 **Section Challenge — Part 4: Error Handling**

**Challenge 1 (Trace):** `catch (Exception e) { e.printStackTrace(); }` appears in a production payment service. Name three specific things that go wrong in a production environment with this pattern.

<details><summary>Answer</summary>

1. **Lost stack trace**: `printStackTrace()` writes to `System.err`, which is typically not captured by centralized log aggregators (ELK/Loki capture `System.out`/structured logs). The error vanishes. 2. **No alerting**: proper logging frameworks integrate with alertmanager/PagerDuty via appenders. `e.printStackTrace()` bypasses all of this — the on-call engineer is never notified. 3. **No context**: you see the exception type and stack, but zero business context — no `orderId`, no `userId`, no `correlationId`. When debugging at 3am, "NullPointerException at line 47" is useless without knowing which order triggered it. Fix: `log.error("Payment failed orderId={}", orderId, e)` — the exception is the LAST parameter, SLF4J automatically appends the full stack trace after the structured message.

</details>

**Challenge 2 (Design):** A `@ControllerAdvice` has a handler for `Exception.class` that returns `500` with `{"error": "Something went wrong"}`. A security reviewer flags this as incomplete. What specific attack does returning the raw `e.getMessage()` instead enable?

<details><summary>Answer</summary>

Returning `e.getMessage()` to the client enables **Information Disclosure** (OWASP A05). Database exceptions leak schema information: `PSQLException: column "password_hash" of relation "users" does not exist` reveals the table name and column names. Hibernate exceptions reveal entity class names. Connection errors reveal internal hostnames: `Could not connect to jdbc:postgresql://prod-db-01.internal:5432`. Each piece of internal architecture info helps an attacker build a map of your system. Fix: (1) log the full exception server-side with `log.error(..., e)`, (2) return ONLY a generic message to the client `{"error": "An unexpected error occurred", "correlationId": "abc-123"}` — the correlationId lets support trace the log without exposing internals.

</details>

## Part 5: Health Checks & Graceful Shutdown

```java
// Spring Boot Actuator health check
// GET /actuator/health → {"status": "UP"}

// Custom health indicator
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Health.up().withDetail("database", "reachable").build();
        } catch (Exception e) {
            return Health.down().withException(e).build();
        }
    }
}

// Readiness vs Liveness (Kubernetes):
// Liveness:  "Is the app alive?" → If no → restart container
// Readiness: "Can it handle traffic?" → If no → remove from load balancer

// Graceful shutdown
@PreDestroy
public void shutdown() {
    log.info("Shutting down — completing in-flight requests...");
    // Stop accepting new requests
    // Wait for current requests to finish (with timeout)
    // Close database connections
    // Flush queues
    log.info("Shutdown complete");
}
// application.yml: server.shutdown=graceful
//                  spring.lifecycle.timeout-per-shutdown-phase=30s
```

---

## Part 6: Retry & Circuit Breaker

```java
// ── Retry with Exponential Backoff ──
@Retryable(
    value = {TransientException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2) // 1s, 2s, 4s
)
public PaymentResult chargeCard(PaymentRequest request) {
    return paymentGateway.charge(request);
}

@Recover
public PaymentResult fallback(TransientException e, PaymentRequest request) {
    log.error("All retries failed for payment={}", request.getId(), e);
    return PaymentResult.failed("Payment gateway unavailable");
}

// ── Circuit Breaker (Resilience4j) ──
// States: CLOSED (normal) → OPEN (failing, reject fast) → HALF_OPEN (test)
@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
public PaymentResult processPayment(PaymentRequest req) {
    return paymentGateway.charge(req);
}

// Circuit breaker config:
// failure-rate-threshold: 50%  → open after 50% failures
// wait-duration-in-open-state: 30s → try again after 30s
// sliding-window-size: 10 → evaluate last 10 calls
```

---

## Part 7: API Best Practices

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  REST API Checklist:                                                             ║
║  ✅ Use proper HTTP methods (GET=read, POST=create, PUT=replace, PATCH=update)    ║
║  ✅ Meaningful status codes (200, 201, 400, 401, 403, 404, 409, 500)              ║
║  ✅ Consistent error response format                                              ║
║  ✅ Versioning (URI: /api/v1/ or Header: Accept: application/vnd.api.v1+json)     ║
║  ✅ Pagination (page/size or cursor-based for large datasets)                     ║
║  ✅ Rate limiting (return 429 + Retry-After header)                               ║
║  ✅ Request validation (Jakarta Bean Validation: @NotNull, @Size, @Email)         ║
║  ✅ CORS configuration for frontend                                               ║
║  ✅ Idempotency keys for POST requests (prevent duplicate processing)             ║
║  ✅ Request/response logging with sensitive data masking                          ║
║                                                                                  ║
║  Pagination Example:                                                             ║
║  GET /api/v1/orders?page=0&size=20&sort=createdAt,desc                           ║
║  → { content: [...], page: 0, size: 20, totalElements: 143, totalPages: 8 }      ║
║                                                                                  ║
║  Idempotency Example:                                                            ║
║  POST /api/v1/payments                                                           ║
║  Header: Idempotency-Key: abc-123-def                                            ║
║  → First call: process payment, store result keyed by "abc-123-def"              ║
║  → Second call: return stored result (no double charge)                          ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### Conceptual Depth: The 12-Factor Invariant

**Core invariant:** A 12-Factor app can be deployed to any environment (dev/staging/prod) without code changes — only configuration changes.

**Why this matters:** The opposite is the "snowflake server" anti-pattern — a server configured by a series of imperative SSH commands that no one dares to recreate. When that server dies, all institutional knowledge dies with it.

**The deep pattern:** Each of the 12 factors removes one source of friction between developer environments and production:
- Factor I (Codebase) → one source of truth, multiple deploys
- Factor III (Config) → environment-specific values live outside the repo
- Factor V (Build/Release/Run) → strict separation prevents "works in staging" surprises
- Factor X (Dev/Prod Parity) → keep time/gap/personnel differences small
- Factor XII (Admin Processes) → one-off migrations run as processes, not snowflake cron jobs

**Constraint that breaks the invariant:** Long-lived mutable state in the filesystem (Factor VI violation). The moment you write to local disk and assume it persists across deploys, you lose portability.

**Practical signal:** If your "production deploy" requires a 47-step runbook that diverges from staging by 12 steps, you have violated multiple factors.

---

## Part 8: Database Migration Strategies

Database schemas evolve. Without disciplined migration, schema changes cause outages: a column rename deployed before the application update crashes every request reading the old column. The two production-grade migration tools are **Flyway** (SQL-first, simpler) and **Liquibase** (XML/YAML/JSON changelog, more flexible). Both support versioned, reversible migrations.

### Why Migrations Matter

A migration tool answers: "what schema changes were applied to production, in what order, and can we roll them back?" Without this, schema changes are tribal knowledge — every new engineer must read Slack history to know what the schema looks like today.

### Flyway Example

```
src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__add_email_verified_column.sql
├── V3__create_orders_table.sql
└── V4__add_index_on_user_id.sql
```

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- V2__add_email_verified_column.sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- V3__create_orders_table.sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Flyway runs migrations in order on application startup. The `flyway_schema_history` table tracks which migrations have been applied.

### Spring Boot Integration

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

### Migration Best Practices

1. **Never modify a committed migration**: once `V2__add_email_verified_column.sql` runs in production, you cannot edit it. Create `V5__fix_email_verified_default.sql` instead.
2. **Forward-only is safer than rollback**: rollbacks are rarely tested and often fail in production. Plan migrations that don't need rollback.
3. **Backward-compatible changes only during deployment**: if V3 renames a column, the application must work with BOTH old and new column names until the next deploy.
4. **Test migrations against production data**: use a production snapshot in staging. A migration that works on empty tables may fail on tables with 100M rows.

🔬 **Section Challenge — Database Migration Strategy**

You're adding a `middle_name` column to a `users` table with 50M rows in production. The deployment must complete within a 5-minute maintenance window. What's the migration approach, and why is `ALTER TABLE users ADD COLUMN middle_name VARCHAR(100)` dangerous on a large table?

<details>
<summary>Answer</summary>

**The danger**: `ALTER TABLE` on a large table in MySQL/Postgres can lock the table for the duration of the operation. On 50M rows, adding a column with a default value can take 5-30 minutes — far longer than the 5-minute window. During this time, all writes to `users` are blocked, and reads are queued.

**Safe approach**:
1. **V1 — Add column without default** (instant in MySQL 8.0+, Postgres 11+): `ALTER TABLE users ADD COLUMN middle_name VARCHAR(100) NULL;`. No row rewrite, completes in milliseconds.
2. **Deploy application version A** that writes to the new column but tolerates NULL values.
3. **V2 — Backfill in batches**: `UPDATE users SET middle_name = '' WHERE middle_name IS NULL LIMIT 10000;` repeated until done. Each batch is fast; the operation can run during normal traffic.
4. **V3 — Add NOT NULL constraint** (after backfill completes): `ALTER TABLE users ALTER COLUMN middle_name SET NOT NULL;`. Now the column is required.

**Total downtime**: zero — the application tolerates NULL middle names during the migration window.

**Alternative tools for zero-downtime migrations**:
- **gh-ost** (GitHub) — online schema migration for MySQL; creates a shadow table, replicates changes, swaps atomically
- **pg_repack** (Postgres) — reclaims space without exclusive locks
- **pt-online-schema-change** (Percona) — similar to gh-ost

**The principle**: never lock a table on a long-running ALTER. Always split the operation into (1) schema change that's metadata-only, (2) backfill in batches, (3) constraint enforcement.
</details>

---

## Part 9: Feature Flags

Feature flags decouple deploy from release. You ship code to production (deploy) but the feature is hidden behind a flag (release). This lets you deploy Friday afternoon without fear: if the feature breaks, toggle the flag off; users never see the broken code.

### Flag Types

| Type | Use case | Lifecycle |
|---|---|---|
| **Release flag** | Hide new feature during rollout | Short-lived (days to weeks) |
| **Experiment flag** | A/B test variants for analytics | Medium-lived (weeks to months) |
| **Ops flag** | Toggle system behavior under load | Long-lived (months to years) |
| **Permission flag** | Premium-tier feature gating | Permanent (until tier changes) |

### Implementation: Simple Toggle

```java
@Component
public class FeatureFlags {
    private final Map<String, Boolean> flags = new HashMap<>();

    public boolean isEnabled(String flagName) {
        return flags.getOrDefault(flagName, false);
    }

    public void setFlag(String flagName, boolean enabled) {
        flags.put(flagName, enabled);
    }
}

// Usage in service
if (featureFlags.isEnabled("new-checkout-flow")) {
    return newCheckoutFlow.process(order);
} else {
    return legacyCheckoutFlow.process(order);
}
```

### Implementation: Production-Grade (LaunchDarkly-style)

```java
@Component
public class FeatureFlagService {
    private final LDClient ldClient;

    public boolean isEnabled(String key, LDUser user, boolean defaultValue) {
        return ldClient.boolVariation(key, user, defaultValue);
    }
}

// Usage
LDUser user = new LDUser.Builder(userId)
    .custom("email", email)
    .custom("plan", "premium")
    .build();

if (flagService.isEnabled("new-checkout", user, false)) {
    return newCheckoutFlow.process(order);
}
```

### Rollout Strategy

```
Day 1:   Flag OFF — deploy code, no users see new feature
Day 2:   Flag ON for internal employees (5 users)
Day 3:   Flag ON for 1% of users (canary)
Day 5:   Flag ON for 10% of users
Day 7:   Flag ON for 50% of users
Day 10:  Flag ON for 100% — flag removed in next sprint
```

### Cleanup Discipline

Every flag has a deadline. A flag left in code for 6+ months is technical debt:
- New engineers don't know what the flag does
- The flag has 4 conditional branches (the original, 2 intermediate states, and "always on")
- Removing the flag requires re-testing the full feature

**Rule**: add the flag with a "remove by" date in the code comment. Remove the flag (and the conditional) within 30 days of 100% rollout.

🔬 **Section Challenge — Feature Flag Cleanup**

A flag `enable-new-pricing` was added 8 months ago. The code has the following conditional:

```java
if (flags.isEnabled("enable-new-pricing")) {
    return calculatePriceV2(items, user);
} else {
    return calculatePriceV1(items, user);
}
```

You need to remove the flag. What's the migration plan to ensure no behavior change?

<details>
<summary>Answer</summary>

**The plan**:
1. **Verify the flag is at 100%** for all users. Check the feature flag service dashboard.
2. **Run the new pricing calculation in shadow mode**: call `calculatePriceV2` for every user, log the difference vs `calculatePriceV1`. Confirm zero divergence over 7 days.
3. **Switch the default**: make `calculatePriceV2` the default, but keep the flag check for one more deploy cycle.
4. **Remove the flag check entirely**:
   ```java
   return calculatePriceV2(items, user);  // flag removed
   ```
5. **Remove `calculatePriceV1`** if no other code calls it.
6. **Remove the flag from the feature flag service** (LaunchDarkly dashboard).

**Why the shadow-mode step**: 8 months is a long time. Code paths may have diverged, edge cases may have been added to one branch but not the other. Shadow mode (run both, log differences, no user impact) catches divergence before users see it.

**The trade-off**: shadow mode doubles compute for 7 days. For pricing — a critical correctness path — the 7 days of double-compute is worth the safety.

**Anti-pattern**: removing the flag without shadow mode. "It's been on for 8 months, so it must be safe." No — the conditional branches may have diverged in ways that only show under specific inputs.
</details>

---

## Part 10: Deployment Strategies

The naive deployment (stop the old version, start the new version) causes downtime. Modern deployment strategies keep at least one version running during the deploy.

### Rolling Deployment

Replace instances one at a time:

```
Before: [v1] [v1] [v1] [v1]
After:  [v1] [v1] [v1] [v2]  ← rolling: replace one
After:  [v1] [v1] [v2] [v2]  ← next
After:  [v1] [v2] [v2] [v2]
After:  [v2] [v2] [v2] [v2]  ← done
```

**Trade-off**: zero downtime, but for the duration of the deploy, BOTH v1 and v2 receive traffic. If v2 has a bug, some users hit it. Use health checks: only proceed to the next instance after the new one passes health checks.

### Blue-Green Deployment

Two identical environments (blue = current, green = new). Switch all traffic at once:

```
Before: 100% traffic → Blue (v1)
Deploy Green (v2), run smoke tests on Green
Switch: 100% traffic → Green (v2)
Keep Blue running for 24h (rollback insurance)
Decommission Blue
```

**Trade-off**: instant rollback (flip traffic back to Blue), but requires 2× infrastructure during deploy. Database migrations are tricky — both versions must be compatible with the same schema.

### Canary Deployment

Deploy to a small percentage first, then ramp:

```
Day 1: 99% traffic → v1, 1% → v2
Day 2: 95% traffic → v1, 5% → v2 (if error rate OK)
Day 3: 50% traffic → v1, 50% → v2
Day 5: 0% traffic → v1, 100% → v2
```

**Trade-off**: catches bugs with minimal blast radius (1% of users see the broken version). Slower to full rollout. Requires sophisticated traffic splitting (Istio, Linkerd, AWS App Mesh, or the load balancer's weighted routing).

### Implementation: Kubernetes Rolling Update

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # +1 instance during deploy
      maxUnavailable: 0     # never reduce below 4 instances
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:v2
        lifecycle:
          preStop:
            exec:
              command: ["sh", "-c", "sleep 10"]  # let in-flight requests finish
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Key**: `preStop` sleep gives in-flight requests time to complete before SIGTERM. Without this, requests get 502'd mid-response.

### The Database Migration Problem

All three strategies share one challenge: **database schema changes must be compatible with BOTH old and new code during the deploy**.

```
v1 code: reads `users.email_verified` column
v2 code: reads `users.is_verified` column (column renamed)

During deploy: some pods run v1, some run v2
v1 pods crash because `is_verified` doesn't exist
v2 pods crash because `email_verified` doesn't exist
```

**Solution**: multi-step migration
1. **V1 migration**: add new column (`is_verified`) without removing old (`email_verified`)
2. **Deploy v2 code**: v2 reads `is_verified`, but writes to BOTH columns
3. **V2 migration**: backfill `is_verified` from `email_verified`
4. **Deploy v3 code**: v3 reads and writes only `is_verified`
5. **V3 migration**: drop `email_verified`

This 5-step process takes 2-3 deploy cycles but ensures zero downtime.

🔬 **Section Challenge — Database-Compatible Deployment**

You're renaming a column `users.email_verified` to `users.is_verified`. The deploy uses rolling updates (4 instances, replace one at a time, 5 minutes per instance). What's the migration plan, and why can't you just rename the column in one migration?

<details>
<summary>Answer</summary>

**Why one-step rename fails**: during the 20-minute rolling deploy, both v1 (old column) and v2 (new column) are running simultaneously. v1 pods crash when they try to read `email_verified` (which has been renamed and no longer exists). v2 pods crash when they try to read `is_verified` (which doesn't exist yet).

**The safe plan**:
1. **V1 migration (Day 1)**: `ALTER TABLE users ADD COLUMN is_verified BOOLEAN;` — adds the new column without touching the old one. Old code (v1) still reads `email_verified`; new code (v2) reads `is_verified`. Both columns coexist.
2. **Deploy v2 (Day 1-2)**: v2 reads `is_verified`, writes to BOTH `is_verified` and `email_verified`. v1 still reads `email_verified` — works because the column still exists.
3. **V2 migration (Day 3)**: `UPDATE users SET is_verified = email_verified WHERE is_verified IS NULL;` — backfill new column. Run in batches to avoid long locks.
4. **Deploy v3 (Day 3-4)**: v3 reads and writes only `is_verified`. Old column no longer referenced.
5. **V3 migration (Day 5)**: `ALTER TABLE users DROP COLUMN email_verified;` — clean up.

**Total deploy time**: 5 days, but zero downtime and zero errors.

**Anti-pattern**: trying to do this in one shot with a single migration. The "rename column" DDL locks the table, breaks v1, and crashes half the fleet during the rolling update.

**The principle**: schema changes must be **backward-compatible** during the deploy window. If v1 and v2 must coexist for 20 minutes, the schema must support both.
</details>

---

## Part 11: Testing in Production

Pre-production testing (unit, integration, staging) catches 80% of bugs. The remaining 20% only manifest under real traffic patterns: specific data distributions, concurrent users, network conditions. **Testing in production** is the disciplined practice of validating behavior with real users and real data.

### Dark Launch / Shadow Traffic

Deploy the new code path, but route only the response — not the actual user-facing action:

```java
public OrderConfirmation checkout(Cart cart) {
    OrderConfirmation result = legacyCheckout.process(cart);
    
    // Shadow: call new code path, but discard the result
    try {
        OrderConfirmation shadowResult = newCheckout.process(cart);
        metrics.record("shadow.divergence", 
            divergence(result, shadowResult));
    } catch (Exception e) {
        // Swallow exception — never affect user response
        metrics.incrementCounter("shadow.error");
    }
    
    return result;
}
```

**Use case**: high-risk change (pricing algorithm, recommendation engine). Validate that the new code produces the same output as the old, under real traffic, before flipping the switch.

### A/B Testing

Split users into cohorts and compare metrics:

```java
public RecommendationPage getRecommendations(String userId) {
    String cohort = cohortAssigner.assign(userId);  // "A" or "B"
    
    if (cohort.equals("A")) {
        return legacyRecommendations.get(userId);
    } else {
        return newRecommendations.get(userId);
    }
}
```

**Metrics to compare**:
- Conversion rate (A vs B)
- Click-through rate
- Time on page
- Error rate (must be equal — A/B shouldn't introduce new errors)

**Statistical significance**: need ~10,000 users per cohort to detect a 5% difference with 95% confidence. Use a tool like Optimizely, GrowthBook, or Eppo.

### Feature Flag-Driven Rollout (covered in Part 9)

This is the most common testing-in-production technique. Roll out to 1%, monitor metrics, ramp to 10%, 50%, 100%.

### Synthetic Monitoring

Send fake requests through your system continuously:

```yaml
# Blackbox exporter config (Prometheus)
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      method: GET
      url: https://myapp.com/api/health
      interval: 30s
```

Synthetic monitors catch issues BEFORE users do. Run from multiple regions to catch geo-specific outages.

### Chaos Engineering

Inject failures deliberately to validate resilience:

```bash
# Chaos Toolkit example
chaos run experiment.json
```

```json
{
  "title": "Database connection failure",
  "steady-state-hypothesis": {
    "title": "Service responds",
    "probes": [{
      "type": "probe",
      "name": "service-responds",
      "tolerance": 200
    }]
  },
  "method": [{
    "type": "action",
    "name": "terminate-db-connection",
    "provider": {
      "type": "python",
      "module": "chaosaws.ec2.actions",
      "func": "stop_instances",
      "arguments": {"instances": ["db-primary"]}
    }
  }]
}
```

Netflix's **Chaos Monkey** (2011) is the canonical chaos tool. The principle: if you don't test failure modes, you don't know they work. Better to discover issues during controlled chaos exercises than during a 3am outage.

🔬 **Section Challenge — Choosing a Testing-in-Production Technique**

You're deploying a new payment processing flow. The change touches the most critical code path in the system (every transaction goes through it). What's your testing-in-production strategy, and why?

<details>
<summary>Answer</summary>

**For payment processing, the strategy must be conservative**:

1. **Code review and unit tests** (pre-prod): the new flow must have 100% line coverage on the critical path and explicit tests for race conditions, idempotency, and refund edge cases.

2. **Staging environment with production data snapshot** (pre-prod): replay the last 30 days of payment transactions through the new flow. Compare output with legacy. Surface divergences.

3. **Shadow traffic** (early production): deploy new flow, route shadow traffic (no user impact). Run for 7 days. Validate:
   - Result divergence: <0.01% (payment rounding errors are tolerable; logic differences are not)
   - Error rate: equal to legacy
   - Latency: within 10% of legacy

4. **Canary 1%** (after shadow): route 1% of real traffic to new flow. Monitor:
   - Successful charge rate: must match legacy within 0.1%
   - Refund correctness: all refunds within 1 minute of request
   - Idempotency: duplicate requests produce same result

5. **Canary 10% → 50% → 100%** (over 2 weeks): each step requires 24-48 hours of clean metrics before ramping.

6. **Keep legacy code path active for 30 days** post-100%: instant rollback available if production behavior diverges.

**Why not A/B testing for payments**: A/B is for measuring which variant performs better (e.g., new checkout button). For payments, both variants must work correctly — there's no "better" to optimize for. You're validating safety, not improvement.

**Why not chaos engineering here**: chaos engineering tests resilience to failures. Payment flow changes aren't about resilience — they're about correctness. Different problem, different technique.

**The principle**: critical paths use the most conservative techniques (shadow + gradual canary). Lower-risk changes (UI tweaks, recommendation algorithms) can use faster techniques (A/B testing with statistical significance).

**Production monitoring during rollout**: every payment event must log (a) which code path processed it, (b) result, (c) latency. Dashboards for: divergence rate, error rate, refund rate. PagerDuty alert if divergence >0.5% or error rate >legacy's rate.
</details>



---

## Reality Check

**"Production-ready means the feature works"** ? Production-ready is a CHECKLIST of behaviors under conditions the demo never met: what does this code do when its dependency is slow (timeout), down (fallback or fail-fast), or lying (validation at the boundary); what does it log when it fails (enough to diagnose without a redeploy); can it be turned OFF without a deploy (the feature flag as an operational kill switch); is it idempotent under the retry the platform will eventually send; and does it clean up after partial failure (the half-written state that poisons the next run). Feature-works is the entry criterion; the checklist is the difference between shipped and survivable.

**"Defensive programming means checking everything everywhere"** ? Blanket defensiveness produces the null-check confetti that hides real contracts; the professional structure is TRUST ZONES with hard borders: validate exhaustively at the boundary (API input, queue messages, file parses � [security]'s hostile-input assumption), then TRUST inside the zone (internal functions assert contracts rather than re-validating � fail loud on programmer error, not silent-continue), and treat every silent-catch as a future incident (the swallowed exception that converts a crash into a corruption � crashes are diagnosable; corruptions are archaeology). Where to be paranoid and where to be confident is the design decision; everywhere-paranoid is neither.

**"Logging more is logging better"** ? Log VOLUME without design is a cost center that obscures its own signal (the incident where the relevant line drowned in debug noise, the logging bill that rivals compute): the engineered version is structured events (key-value, machine-queryable � grep-ability is the floor, aggregation the point), correlation IDs threaded through every hop ([production-debugging]'s stitch-the-story prerequisite), levels used as an operational contract (ERROR pages someone, WARN trends, INFO narrates state changes, DEBUG exists to be off), and the cardinal sins enforced by review: no secrets/PII in logs (the compliance incident that starts as a debug statement), no per-iteration logging in hot loops, no log-and-rethrow duplication ([error-handling]'s routing discipline).

**"Feature flags are if-statements with a dashboard"** ? Flags are DISTRIBUTED STATE with lifecycle obligations: evaluation consistency matters (the user who flips cohorts mid-session because two services evaluated at different times � sticky bucketing exists for this), flag interactions multiply the test matrix ([21_SDET Ch49]'s combination problem � two dozen active flags is millions of theoretical states; the discipline is short-lived flags plus tested critical combinations), stale flags are debt with a deletion date (the two-year-old flag nobody dares remove because nobody remembers its off-path � flag cleanup belongs in the definition of done), and the off-path must stay TESTED (the kill switch that itself was broken is a genre of incident). The dashboard is the easy part; the hygiene is the practice.

**"Code review is quality gatekeeping"** ? Review optimized purely as a gate produces gate-shaped pathologies (nitpick theater on variable names while the missing timeout sails through, multi-day latency that batches changes into unreviewable lumps); the functioning version is layered: machines own style entirely (formatter and linter � zero human style comments, [dev-tools] delegation), humans own what machines cannot � correctness under failure, contract changes, security-sensitive flows, operability (will we be able to debug this at 3 AM), and knowledge transfer (the review AS the documentation of why). The two metrics that predict review health: time-to-first-response (latency kills batch size kills quality) and the ratio of substantive-to-cosmetic comments � a review culture is measurable, and most measure nothing.
