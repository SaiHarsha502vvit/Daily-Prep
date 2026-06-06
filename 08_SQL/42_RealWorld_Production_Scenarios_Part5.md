# Chapter 42 — Real-World Production Scenarios Part 5: Backend & Spring Boot Production Hell

**What:** 25+ backend/Spring Boot production nightmares (Scenarios 101–125) with 5W-H + fixes
**Why:** The backend layer has its own class of disasters — memory leaks, thread starvation, JPA traps
**Where:** Any Java/Spring Boot application running in production
**How:** Understand the failure → code-level fix → SQL fix → DSA insight

---

## 📋 Scenario Master Index (Part 5: Scenarios 101–125)

| # | Scenario | Category |
|---|----------|----------|
| 101 | LazyInitializationException in REST response | JPA/Hibernate |
| 102 | @Transactional not working — silently no rollback | Spring |
| 103 | HikariCP connection pool exhausted | Connection Pool |
| 104 | Memory leak from Hibernate session cache | Memory |
| 105 | N+1 in REST controller — 1000 queries per request | JPA/Hibernate |
| 106 | Slow startup — Flyway migration on 500M-row table | Deployment |
| 107 | Thread pool exhaustion from blocking DB calls | Threads |
| 108 | Circuit breaker for database failover | Resilience |
| 109 | Entity equals/hashCode wrong — Set breaks | JPA/Hibernate |
| 110 | Open Session in View — silent performance killer | JPA/Hibernate |
| 111 | Bulk INSERT 1M rows — OOM crash | Batch Processing |
| 112 | @Cacheable returns stale data after DB update | Caching |
| 113 | REST API pagination — full table scan on page 50000 | API Design |
| 114 | Multitenancy — wrong tenant gets data | Security |
| 115 | Distributed lock fails — two instances process same job | Concurrency |
| 116 | Health check passes but app is unhealthy | Monitoring |
| 117 | Graceful shutdown loses in-flight transactions | Deployment |
| 118 | Spring Security session + DB session mismatch | Security |
| 119 | File upload saves to local disk — pod restart loses it | Cloud Native |
| 120 | Log table grows unbounded — disk full | Operations |
| 121 | API rate limiting — single user DDoSes your DB | API Design |
| 122 | Retry storm after partial failure | Resilience |
| 123 | JSON serialization infinite recursion (bidirectional JPA) | Serialization |
| 124 | Spring Batch fails at row 999,997 of 1M — restart? | Batch Processing |
| 125 | Microservice data consistency without 2PC | Architecture |

---

## Scenario 101: LazyInitializationException in REST Response

### 🔴 The Incident
API returns 500 error: `LazyInitializationException: could not initialize proxy — no Session`. Customer entity has `@OneToMany List<Order> orders` — accessed during JSON serialization AFTER transaction closed.

### 5W-H Analysis
| Question | Answer |
|----------|--------|
| **What** | Hibernate lazy-loads collections. After transaction closes, accessing unloaded collection throws exception |
| **Why** | Default `@OneToMany` fetch = LAZY. Jackson serializer accesses the field outside Hibernate session |
| **When** | Any REST endpoint returning entities with lazy relationships |
| **Where** | Controller returning JPA entities directly (no DTO) |
| **Who** | Every Spring Boot developer hits this within their first month |
| **How** | Use DTOs, fetch joins, or entity graphs — never return JPA entities directly |

### FIX 1: Use DTOs (Best Practice)

```java
// DTO — only the data you need
public record CustomerResponse(
    Long id,
    String name,
    String email,
    int orderCount  // Just the count, not all orders
) {
    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(c.getId(), c.getName(), c.getEmail(), c.getOrders().size());
    }
}

// Repository: JPQL projection
@Query("SELECT new com.app.dto.CustomerResponse(c.id, c.name, c.email, SIZE(c.orders)) " +
       "FROM Customer c WHERE c.id = :id")
CustomerResponse findDtoById(@Param("id") Long id);
```

### FIX 2: JOIN FETCH when you need the relationship

```java
@Query("SELECT c FROM Customer c JOIN FETCH c.orders WHERE c.id = :id")
Customer findWithOrders(@Param("id") Long id);
// One query: SELECT c.*, o.* FROM customers c JOIN orders o ON o.customer_id = c.id
```

### FIX 3: EntityGraph

```java
@EntityGraph(attributePaths = {"orders", "orders.items"})
@Query("SELECT c FROM Customer c WHERE c.id = :id")
Customer findWithOrdersAndItems(@Param("id") Long id);
```

### Anti-Pattern: DON'T Do This
```java
// DON'T use Open Session in View (OSIV) as a fix
// DON'T use Hibernate.initialize() in controller
// DON'T set fetch = FetchType.EAGER (loads EVERYTHING always)
```

---




## Scenario 102: @Transactional Not Working — No Rollback

### 🔴 The Incident
Method throws exception but database changes are committed. Data in inconsistent state.

### Root Causes & Fixes

```java
// CAUSE 1: Calling @Transactional method from same class
@Service
public class OrderService {
    public void process() {
        this.createOrder();  // ❌ Direct call — proxy bypassed — no transaction!
    }
    
    @Transactional
    public void createOrder() {
        // This runs WITHOUT a transaction when called from process()!
    }
}

// FIX: Call from different bean, or use self-injection
@Service
public class OrderService {
    @Autowired
    private OrderService self;  // Proxy-aware self reference
    
    public void process() {
        self.createOrder();  // ✅ Goes through proxy — transaction works
    }
    
    @Transactional
    public void createOrder() { /* ... */ }
}

// CAUSE 2: Catching exception inside @Transactional
@Transactional
public void createOrder() {
    try {
        orderRepo.save(order);
        paymentService.charge(order);  // Throws RuntimeException
    } catch (Exception e) {
        log.error("Failed", e);  // ❌ Swallowed exception = no rollback!
    }
}

// FIX: Let the exception propagate
@Transactional
public void createOrder() {
    orderRepo.save(order);
    paymentService.charge(order);  // Exception propagates → triggers rollback
}

// CAUSE 3: Checked exception doesn't trigger rollback by default
@Transactional
public void createOrder() throws BusinessException {
    orderRepo.save(order);
    throw new BusinessException("Payment failed");  // ❌ No rollback! (checked)
}

// FIX: Specify rollback for checked exceptions
@Transactional(rollbackFor = Exception.class)  // Rollback for ALL exceptions
public void createOrder() throws BusinessException { /* ... */ }

// CAUSE 4: Method is private
@Transactional
private void createOrder() { }  // ❌ Spring AOP can't proxy private methods!
// FIX: Make it public
```

---



🔬 **Section Challenge — Scenario 102: @Transactional Not Working — No Rollback**

**Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
<details><summary>Answer</summary>

READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
</details>


## Scenario 103: HikariCP Connection Pool Exhausted

### 🔴 The Incident
`HikariPool - Connection is not available, request timed out after 30000ms`. All API requests fail. 10 connections max, all in use.

### Diagnosis

```sql
-- PostgreSQL: See active connections
SELECT pid, usename, application_name, state, query, 
       NOW() - query_start AS duration
FROM pg_stat_activity
WHERE datname = 'mydb'
ORDER BY duration DESC;
-- Look for: state = 'idle in transaction' (leaked connections)
```

### Spring Boot Fix

🔬 **Section Challenge — Scenario 103: HikariCP Connection Pool Exhausted**

**Challenge 1 (Reasoning):** `pg_stat_activity` shows many sessions in `idle in transaction` for 30+ seconds. Why can this exhaust HikariCP even if CPU and database I/O look normal?
<details><summary>Answer</summary>

A connection is checked out until the transaction ends. `idle in transaction` means the application is not actively querying, but it is still holding the connection and transaction resources. Hikari sees the connection as busy, so new requests wait until `connection-timeout` and fail. This is a capacity problem caused by connection hold time, not CPU saturation. Fix the code path that keeps transactions open and add leak detection / transaction timeout as guardrails.
</details>

**Challenge 2 (Design):** The team wants to raise `maximum-pool-size` from 10 to 100. What must you check before doing that, and why can a bigger pool make the incident worse?
<details><summary>Answer</summary>

Check database `max_connections`, CPU, memory per backend, lock contention, average query time, and p95 connection hold time. A larger pool can push more concurrent work into the database than it can execute, increasing lock waits, context switching, memory pressure, and queueing inside the database. The real fix is often shorter transactions, no external HTTP inside transactions, indexes, batching, and fail-fast timeouts. Pool size is a throttle, not a magic throughput multiplier.
</details>


```yaml
# application.yml — tune HikariCP
spring:
  datasource:
    hikari:
      maximum-pool-size: 20          # Default 10 may be too low
      minimum-idle: 5
      connection-timeout: 10000      # Fail fast (10s not 30s)
      idle-timeout: 600000           # Release idle connections after 10 min
      max-lifetime: 1800000          # Cycle connections every 30 min
      leak-detection-threshold: 30000 # Log warning if connection held > 30s
```

```java
// COMMON LEAK: Manual DataSource.getConnection() without closing
public void badMethod(DataSource ds) throws SQLException {
    Connection conn = ds.getConnection();  // ❌ Never closed!
    PreparedStatement ps = conn.prepareStatement("SELECT 1");
    ResultSet rs = ps.executeQuery();
    // Exception here → connection leaked forever!
}

// FIX: try-with-resources
public void goodMethod(DataSource ds) throws SQLException {
    try (Connection conn = ds.getConnection();
         PreparedStatement ps = conn.prepareStatement("SELECT 1");
         ResultSet rs = ps.executeQuery()) {
        // Auto-closed even on exception
    }
}

// COMMON LEAK 2: Long-running @Transactional holding connection
@Transactional
public void processReport() {
    List<Order> orders = orderRepo.findAll();  // Connection acquired
    generatePDF(orders);       // Takes 5 minutes — connection held entire time!
    emailService.send(pdf);    // Still holding connection!
}

// FIX: Only use @Transactional where needed
public void processReport() {
    List<OrderDTO> orders = orderService.fetchOrders(); // Short transaction
    byte[] pdf = generatePDF(orders);  // No DB connection held
    emailService.send(pdf);  // No DB connection held
}
```

---

## Scenario 104: Memory Leak from Hibernate Session Cache

### 🔴 The Incident
Application OOM after processing large batch. Heap dump shows millions of Hibernate entity instances in `PersistenceContext`.

### Root Cause
Hibernate's first-level cache (Session) keeps ALL entities loaded in a transaction. Loading 1M rows = 1M objects in memory.

### Fix

```java
// BAD: Loading 1M entities in one transaction
@Transactional
public void processAll() {
    List<Order> orders = orderRepo.findAll();  // 1M entities in memory!
    orders.forEach(o -> o.setProcessed(true));
    // Flush: 1M UPDATE statements
}

// FIX 1: Stream + batch flush
@Transactional
public void processAll() {
    int batchSize = 500;
    int count = 0;
    
    try (Stream<Order> stream = orderRepo.streamAll()) {
        for (Order order : (Iterable<Order>) stream::iterator) {
            order.setProcessed(true);
            if (++count % batchSize == 0) {
                entityManager.flush();  // Write to DB
                entityManager.clear();  // Release memory!
            }
        }
    }
}

// FIX 2: Bulk update (no entity loading at all)
@Modifying
@Query("UPDATE Order o SET o.processed = true WHERE o.processed = false")
int markAllProcessed();
// One SQL statement. Zero entities loaded. Instant.

// FIX 3: StatelessSession for bulk operations
Session session = entityManager.unwrap(Session.class);
StatelessSession stateless = session.getSessionFactory().openStatelessSession();
// StatelessSession has NO first-level cache — no memory bloat
```

---



🔬 **Section Challenge — Scenario 104: Memory Leak from Hibernate Session Cache**

**Challenge 1 (Reasoning):** N+1 query problem — explain with a concrete JPA example and show the fix.
<details><summary>Answer</summary>

```java
// N+1: fetches all orders (1 query), then for EACH order fetches customer (N queries)
List<Order> orders = orderRepo.findAll(); // 1 query
orders.forEach(o -> System.out.println(o.getCustomer().getName())); // N queries!

// Fix 1: JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.customer")
List<Order> findAllWithCustomer();

// Fix 2: EntityGraph
@EntityGraph(attributePaths = "customer")
List<Order> findAll();
```
Both load orders + customers in ONE query (JOIN). Always check Hibernate's SQL log in development.
</details>


## Scenario 105: N+1 in REST Controller — 1000 Queries Per Request

### 🔴 The Incident
`GET /api/orders` takes 8 seconds. Database shows 1001 queries: 1 for orders + 1000 for each order's customer.

### Diagnosis

```yaml



# Enable query logging to see the problem
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        generate_statistics: true
```

### Fix

```java
// BAD: Causes N+1
@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY)  // Default for ManyToOne is EAGER!
    private Customer customer;
}

// Query: SELECT * FROM orders → 1000 rows
// Then for EACH order: SELECT * FROM customers WHERE id = ? → 1000 queries

// FIX 1: JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.customer")
List<Order> findAllWithCustomer();
// One query: SELECT o.*, c.* FROM orders o JOIN customers c ON ...

// FIX 2: @BatchSize (Hibernate batches the lazy loads)
@Entity
public class Customer {
    @BatchSize(size = 100)  // Loads 100 customers at a time instead of 1
    @OneToMany(mappedBy = "customer")
    private List<Order> orders;
}
// 1 query for orders + 10 batch queries for 1000 customers (100 each) = 11 total

// FIX 3: Spring Data projection
public interface OrderSummary {
    Long getId();
    BigDecimal getTotal();
    String getCustomerName();  // Derived from join
}

@Query("SELECT o.id as id, o.total as total, c.name as customerName " +
       "FROM Order o JOIN o.customer c")
List<OrderSummary> findAllSummaries();
```

---

## Scenario 106: Slow Startup — Flyway Migration on 500M-Row Table

### 🔴 The Incident
Application takes 45 minutes to start. Kubernetes kills the pod (health check timeout). Pod restart loop.

### Fix

```yaml
# application.yml — separate migration from startup
spring:
  flyway:
    enabled: false  # Don't run at startup

# Run migration as a separate Kubernetes Job BEFORE deployment:
# k8s-migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  template:
    spec:
      containers:
      - name: migration
        image: myapp:latest
        command: ["java", "-cp", "app.jar", "org.flywaydb.commandline.Main", "migrate"]
```

```java
// Or: Run migration in a background thread
@Component
public class AsyncMigration implements ApplicationListener<ApplicationReadyEvent> {
    @Async
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        flyway.migrate();  // Runs after app is ready (health check passes)
    }
}
```

---

## Scenario 107: Thread Pool Exhaustion from Blocking DB Calls

### 🔴 The Incident
Tomcat thread pool (200 threads) fully consumed. All waiting on slow DB query. New requests rejected with 503.

### Fix

```java
// Diagnosis: Thread dump shows all threads in WAITING state at JDBC
// jstack <pid> | grep -A 5 "WAITING"

// FIX 1: Set query timeout so slow queries don't hold threads forever
@Transactional(timeout = 5)  // 5 seconds max
public List<Order> getOrders() { /* ... */ }

// FIX 2: Async execution for slow operations
@Async("dbTaskExecutor")
@Transactional(readOnly = true)
public CompletableFuture<List<Order>> getOrdersAsync() {
    return CompletableFuture.completedFuture(orderRepo.findAll());
}

@Bean("dbTaskExecutor")
public Executor dbTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(10);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(100);
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    return executor;
}

// FIX 3: Circuit breaker to fail fast
@CircuitBreaker(name = "database", fallbackMethod = "getOrdersFallback")
public List<Order> getOrders() {
    return orderRepo.findAll();
}

public List<Order> getOrdersFallback(Exception e) {
    return cachedOrders.get();  // Return cached data
}
```

---




## Scenario 108: Circuit Breaker for Database Failover

### Fix: Resilience4j with Spring Boot

```java
// application.yml
resilience4j:
  circuitbreaker:
    instances:
      database:
        slidingWindowSize: 10
        failureRateThreshold: 50    # Open circuit if 50% fail
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3

@Service
public class OrderService {
    
    @CircuitBreaker(name = "database", fallbackMethod = "fallback")
    @Retry(name = "database", fallbackMethod = "fallback")
    public Order getOrder(Long id) {
        return orderRepo.findById(id).orElseThrow();
    }
    
    private Order fallback(Long id, Exception e) {
        // Try read replica
        return readReplicaRepo.findById(id)
            .orElse(cacheService.getCachedOrder(id));
    }
}
```

---

## Scenario 109: Entity equals/hashCode Wrong — Set Breaks

### 🔴 The Incident
Adding entities to `Set` causes duplicates. `contains()` returns false for entities that SHOULD match.

### Fix

```java
// BAD: Using @Data (Lombok) on JPA entities
@Data  // ❌ Generates equals/hashCode with ALL fields
@Entity
public class Order {
    @Id @GeneratedValue
    private Long id;
    private String status;
}
// PROBLEM: Before save, id=null. After save, id=42.
// HashSet bucket is based on null id → can't find entity after save!

// BAD: Using id in equals (null before persist)
public boolean equals(Object o) {
    return Objects.equals(id, o.id);  // ❌ Both null before save = all equal!
}

// GOOD: Use business key or UUID assigned at construction
@Entity
public class Order {
    @Id @GeneratedValue
    private Long id;
    
    @Column(unique = true, updatable = false)
    private UUID businessKey = UUID.randomUUID();  // Assigned immediately
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order other)) return false;
        return businessKey.equals(other.businessKey);
    }
    
    @Override
    public int hashCode() {
        return businessKey.hashCode();
    }
}

// ALTERNATIVE: Use entity identity (safe for single persistence context)
@Entity
public class Order {
    @Id @GeneratedValue
    private Long id;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order other)) return false;
        return id != null && id.equals(other.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();  // Constant — all Orders in same bucket
        // Degrades HashSet to O(n) but is CORRECT across persist lifecycle
    }
}
```

### DSA Connection
- **Hash collision** — constant hashCode degrades HashMap/HashSet from O(1) to O(n)
- **Object identity vs equality** — reference equality (`==`) vs value equality (`.equals()`)
- **Business key = natural key** = deterministic hash from immutable field

---

## Scenario 110: Open Session in View — Silent Performance Killer

### 🔴 The Incident
Spring Boot enables OSIV by default. Every REST request holds a DB connection from request start to response end. Under load, connections exhausted.

### Fix

```yaml



# Disable OSIV
spring:
  jpa:
    open-in-view: false  # Default is TRUE — disable it!
    # Now LazyInitializationException forces you to fetch properly
```

```java
// With OSIV disabled, you MUST fetch everything you need in the service layer
@Service
public class CustomerService {
    @Transactional(readOnly = true)
    public CustomerDTO getCustomer(Long id) {
        Customer c = customerRepo.findWithOrders(id);  // JOIN FETCH
        return CustomerDTO.from(c);  // Map to DTO inside transaction
    }
}
```

---

## Scenario 111: Bulk INSERT 1M Rows — OOM Crash

### Fix

```java
// BAD: saveAll with 1M entities
orderRepo.saveAll(millionOrders);  // OOM! All entities in memory + Hibernate cache

// FIX 1: Batch INSERT with JdbcTemplate
@Transactional
public void bulkInsert(List<Order> orders) {
    jdbcTemplate.batchUpdate(
        "INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)",
        orders, 5000,  // batch size
        (ps, order) -> {
            ps.setLong(1, order.getCustomerId());
            ps.setBigDecimal(2, order.getTotal());
            ps.setString(3, order.getStatus());
        }
    );
}

// FIX 2: Hibernate batch settings
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 500
          order_inserts: true
          order_updates: true

// FIX 3: COPY command (PostgreSQL — fastest possible)
@Transactional
public void copyInsert(List<Order> orders) {
    CopyManager cm = new CopyManager((BaseConnection) dataSource.getConnection());
    StringWriter sw = new StringWriter();
    for (Order o : orders) {
        sw.write(o.getCustomerId() + "\t" + o.getTotal() + "\t" + o.getStatus() + "\n");
    }
    cm.copyIn("COPY orders (customer_id, total, status) FROM STDIN", new StringReader(sw.toString()));
}
```

---




## Scenario 112: @Cacheable Returns Stale Data After DB Update

### Fix

```java
// PROBLEM: Cache not invalidated after direct DB update
@Cacheable("orders")
public Order getOrder(Long id) { return orderRepo.findById(id).orElseThrow(); }

// Someone runs: UPDATE orders SET status = 'shipped' WHERE id = 42;
// Cache still returns status = 'pending'!

// FIX 1: @CacheEvict on mutations
@CacheEvict(value = "orders", key = "#id")
public void updateOrderStatus(Long id, String status) {
    orderRepo.updateStatus(id, status);
}

// FIX 2: @CachePut (update cache with new value)
@CachePut(value = "orders", key = "#order.id")
public Order updateOrder(Order order) {
    return orderRepo.save(order);
}

// FIX 3: TTL (Time-To-Live) so stale data eventually expires
@Bean
public CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager("orders");
    manager.setCaffeine(Caffeine.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)  // Max staleness: 5 minutes
        .maximumSize(10000));
    return manager;
}
```

---

## Scenario 113: REST API Pagination — Full Table Scan on Page 50000

### Fix

```java
// BAD: Offset pagination on deep pages
// Page 50000, size 20 → OFFSET 999980 LIMIT 20
// Database reads and DISCARDS 999,980 rows!

// FIX: Keyset/Cursor pagination
@GetMapping("/api/orders")
public CursorPage<OrderDTO> getOrders(
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") int size) {
    
    Long afterId = cursor != null ? decodeCursor(cursor) : 0L;
    
    List<Order> orders = orderRepo.findByIdGreaterThanOrderByIdAsc(afterId, PageRequest.of(0, size + 1));
    
    boolean hasNext = orders.size() > size;
    if (hasNext) orders = orders.subList(0, size);
    
    String nextCursor = hasNext ? encodeCursor(orders.get(orders.size() - 1).getId()) : null;
    
    return new CursorPage<>(
        orders.stream().map(OrderDTO::from).toList(),
        nextCursor
    );
}
```

```sql
-- Underlying SQL:
-- OFFSET: SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 999980  -- Reads 1M rows!
-- KEYSET: SELECT * FROM orders WHERE id > 999980 ORDER BY id LIMIT 20  -- Index seek!
```

---




## Scenario 114–125: Quick-Fire Backend Scenarios

### Scenario 114: Multitenancy — Wrong Tenant Gets Data
```java
// FIX: Hibernate Filter per tenant
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = Long.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Entity
public class Order {
    private Long tenantId;
}

// Enable filter on every request
@Component
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Long tenantId = extractTenantId(request);
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
        return true;
    }
}
```

### Scenario 115: Distributed Lock — Two Instances Process Same Job
```java
// FIX: Database-level distributed lock
@Component
public class DistributedLock {
    @Autowired private JdbcTemplate jdbc;
    
    public boolean tryLock(String lockName, Duration duration) {
        try {
            int rows = jdbc.update(
                "INSERT INTO distributed_locks (lock_name, locked_by, locked_until) " +
                "VALUES (?, ?, ?) ON CONFLICT (lock_name) DO UPDATE " +
                "SET locked_by = EXCLUDED.locked_by, locked_until = EXCLUDED.locked_until " +
                "WHERE distributed_locks.locked_until < NOW()",
                lockName, getInstanceId(), Instant.now().plus(duration)
            );
            return rows > 0;
        } catch (Exception e) {
            return false;
        }
    }
}

-- SQL:
CREATE TABLE distributed_locks (
    lock_name VARCHAR(100) PRIMARY KEY,
    locked_by VARCHAR(100),
    locked_until TIMESTAMPTZ
);
```

### Scenario 116: Health Check Passes But App Is Unhealthy
```java
// Default health check only verifies DB connection exists
// FIX: Custom health indicator that tests actual functionality
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Autowired private JdbcTemplate jdbc;
    
    @Override
    public Health health() {
        try {
            long start = System.currentTimeMillis();
            jdbc.queryForObject("SELECT 1", Integer.class);
            long duration = System.currentTimeMillis() - start;
            
            if (duration > 1000) {
                return Health.down()
                    .withDetail("query_time_ms", duration)
                    .withDetail("reason", "Database responding too slowly")
                    .build();
            }
            
            // Check connection pool health
            HikariDataSource ds = (HikariDataSource) dataSource;
            int active = ds.getHikariPoolMXBean().getActiveConnections();
            int total = ds.getHikariPoolMXBean().getTotalConnections();
            
            if ((double) active / total > 0.9) {
                return Health.down()
                    .withDetail("reason", "Connection pool 90%+ utilized")
                    .build();
            }
            
            return Health.up().withDetail("query_time_ms", duration).build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### Scenario 117: Graceful Shutdown Loses In-Flight Transactions
```yaml
# application.yml
server:
  shutdown: graceful  # Wait for in-flight requests to complete
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s  # Max wait time
```

```java
@PreDestroy
public void onShutdown() {
    log.info("Shutting down — waiting for {} active transactions", 
             transactionManager.getActiveCount());
}
```

### Scenario 118: Spring Security Session Fixation
```java
// FIX: Session fixation protection
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.sessionManagement(session -> session
            .sessionFixation().changeSessionId()  // New ID after login
            .maximumSessions(1)
            .maxSessionsPreventsLogin(true)
        );
        return http.build();
    }
}
```

### Scenario 119: File Upload Lost on Pod Restart
```java
// BAD: Saving to local filesystem
Files.write(Paths.get("/tmp/uploads/" + filename), bytes);
// Pod restarts → files gone!

// FIX: Use object storage (S3, MinIO, Azure Blob)
@Service
public class FileStorageService {
    @Autowired private S3Client s3;
    
    public String upload(MultipartFile file) {
        String key = UUID.randomUUID() + "/" + file.getOriginalFilename();
        s3.putObject(
            PutObjectRequest.builder().bucket("uploads").key(key).build(),
            RequestBody.fromInputStream(file.getInputStream(), file.getSize())
        );
        return key;  // Store this key in database, not file path
    }
}
```

### Scenario 120: Log Table Grows Unbounded
```sql
-- PROBLEM: audit_log table has 2 billion rows, 500GB
-- FIX: Partition by time + auto-drop old partitions
CREATE TABLE audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    action VARCHAR(50),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_log_2025_03 PARTITION OF audit_log
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Monthly cron job: drop partitions older than 90 days
DROP TABLE audit_log_2024_12;
-- Instant! No DELETE * scanning rows.
```

### Scenario 121: API Rate Limiting
```java
// FIX: Bucket4j rate limiter backed by database
@Bean
public FilterRegistrationBean<RateLimitFilter> rateLimitFilter() {
    // 100 requests per minute per user
    Bandwidth limit = Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1)));
    
    return new FilterRegistrationBean<>(new RateLimitFilter(limit));
}

// Or simpler: Use Spring Cloud Gateway
spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100
                redis-rate-limiter.burstCapacity: 200
```

### Scenario 122: Retry Storm After Partial Failure
```java
// PROBLEM: 1000 API clients all retry at the same time after a 5-second DB outage
// This AMPLIFIES the load — thundering herd!

// FIX: Exponential backoff with jitter
@Retryable(
    value = DataAccessException.class,
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2, random = true)  // Jitter!
)
public Order getOrder(Long id) {
    return orderRepo.findById(id).orElseThrow();
}

// Client-side: tell clients to use Retry-After header
@ExceptionHandler(ServiceUnavailableException.class)
public ResponseEntity<String> handleUnavailable() {
    return ResponseEntity.status(503)
        .header("Retry-After", "30")  // "Try again in 30 seconds"
        .body("Service temporarily unavailable");
}
```

### Scenario 123: JSON Infinite Recursion (Bidirectional JPA)
```java
// PROBLEM: Customer → Orders → Customer → Orders → ... StackOverflow!
@Entity
public class Customer {
    @OneToMany(mappedBy = "customer")
    private List<Order> orders;
}

@Entity
public class Order {
    @ManyToOne
    private Customer customer;  // Jackson serializes customer → which has orders → ...
}

// FIX 1: @JsonIgnore on one side
@JsonIgnore
@OneToMany(mappedBy = "customer")
private List<Order> orders;

// FIX 2: @JsonManagedReference / @JsonBackReference
@JsonManagedReference
@OneToMany(mappedBy = "customer")
private List<Order> orders;

@JsonBackReference
@ManyToOne
private Customer customer;

// FIX 3 (BEST): Use DTOs — never serialize JPA entities directly
```

### Scenario 124: Spring Batch Fails at Row 999,997 — Restart?
```java
// Spring Batch supports RESTARTABLE jobs
// It stores progress in batch metadata tables

@Bean
public Step processStep() {
    return stepBuilderFactory.get("processStep")
        .<Order, Order>chunk(1000)  // Commit every 1000 rows
        .reader(orderReader())       // JdbcPagingItemReader (restartable!)
        .processor(orderProcessor())
        .writer(orderWriter())
        .faultTolerant()
        .skip(DataAccessException.class)
        .skipLimit(100)              // Skip up to 100 bad rows
        .retryLimit(3)
        .retry(DeadlockLoserDataAccessException.class)
        .build();
}

// Restart the job — it continues from the last successful chunk!
// Row 999,997 was in chunk 1000 (rows 999,001-1,000,000)
// Restart processes from row 999,001 — only 1 chunk to redo, not 999 chunks
```

### Scenario 125: Microservice Data Consistency Without 2PC
```java
// PROBLEM: Order service creates order, Payment service charges card.
// If payment fails, order is already committed.

// FIX: Saga pattern with outbox
@Transactional
public void createOrder(OrderRequest req) {
    Order order = orderRepo.save(new Order(req));  // Save order
    
    // Save event in SAME transaction (outbox pattern)
    outboxRepo.save(new OutboxEvent(
        "OrderCreated", 
        order.getId().toString(),
        objectMapper.writeValueAsString(order)
    ));
    // Both saved atomically in same DB transaction
}

// Separate process reads outbox and publishes to message broker
@Scheduled(fixedDelay = 1000)
public void publishEvents() {
    List<OutboxEvent> events = outboxRepo.findUnpublished();
    for (OutboxEvent event : events) {
        kafkaTemplate.send("orders", event.getPayload());
        event.setPublished(true);
        outboxRepo.save(event);
    }
}
```

```sql
-- Outbox table
CREATE TABLE outbox_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aggregate_type VARCHAR(50),
    aggregate_id VARCHAR(50),
    payload JSONB,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_outbox_unpublished ON outbox_events (published) WHERE published = FALSE;
```

---

## 🧠 DSA Patterns Behind Backend Scenarios

| Scenario | DSA Pattern |
|----------|-------------|
| LazyInitializationException | **Lazy evaluation / Thunk** — deferred computation |
| Connection pool | **Object pool / Thread pool** — resource reuse |
| Hibernate cache OOM | **LRU cache eviction** — bounded cache with eviction |
| N+1 queries | **Batch processing / Prefetch** — amortize overhead |
| Circuit breaker | **State machine** — CLOSED → OPEN → HALF_OPEN |
| Distributed lock | **Mutex / Semaphore** — mutual exclusion |
| Retry with jitter | **Exponential backoff** — collision avoidance (like CSMA/CD) |
| Infinite recursion | **Cycle detection** — DFS with visited set |
| Keyset pagination | **Binary search / B-Tree seek** — O(log n) vs O(n) scan |
| Saga pattern | **Compensating transactions** — undo log / rollback |
| Outbox pattern | **Write-ahead log (WAL)** — persist intent before execution |
| Batch restart | **Checkpointing** — save progress, resume from last checkpoint |
| Rate limiting | **Token bucket / Sliding window** — rate control algorithms |
| Thread pool exhaustion | **Bounded queue** — producer-consumer with capacity |
| Graceful shutdown | **Drain queue** — stop accepting, process remaining |

---




## 🎯 Complete Series Navigation

| Part | File | Scenarios | Theme |
|------|------|-----------|-------|
| 1 | [Chapter 38](38_RealWorld_Production_Scenarios_Part1.md) | 1–25 | IDs, Data Growth, Storage |
| 2 | [Chapter 39](39_RealWorld_Production_Scenarios_Part2.md) | 26–50 | Query Performance & Optimization |
| 3 | [Chapter 40](40_RealWorld_Production_Scenarios_Part3.md) | 51–75 | Concurrency, Transactions, Integrity |
| 4 | [Chapter 41](41_RealWorld_Production_Scenarios_Part4.md) | 76–100 | Schema, Migrations, Disasters |
| 5 | [Chapter 42](42_RealWorld_Production_Scenarios_Part5.md) | 101–125 | Backend & Spring Boot Production |

**Total: 125 real-world production scenarios with SQL + DSA + Spring Boot solutions**

---

[⬅ Previous: 41_RealWorld_Production_Scenarios_Part4](41_RealWorld_Production_Scenarios_Part4.md) | [📚 Index](00_INDEX.md) | [Next: 43_Interview_Mindset ➡](43_Interview_Mindset_How_Professionals_Explain.md)
