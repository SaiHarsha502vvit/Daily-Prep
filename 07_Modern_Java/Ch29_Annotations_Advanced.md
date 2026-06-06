**Navigation**: [< Previous Chapter](Ch28_Annotations_Core.md) | [Back to Index](../00_MASTER_INDEX.md)

---

```java
    private int port;
    private String username;
    private String password;
    
    // Getters and setters required for @ConfigurationProperties
}

@Service
public class EmailService {
    
    /**
     * @Value - Inject property values
     */
    @Value("${app.name}")
    private String appName;
    
    @Value("${app.mail.host:localhost}")  // With default value
    private String mailHost;
    
    @Value("${app.feature.enabled:false}")
    private boolean featureEnabled;
    
    @Value("#{${app.servers}}")  // SpEL for lists: app.servers=server1,server2
    private List<String> servers;
    
    @Value("#{systemProperties['user.home']}")  // System property
    private String userHome;
    
    @Value("#{environment['PATH']}")  // Environment variable
    private String path;
}
```

### Profile & Conditional

```java
/**
 * @Profile - Bean only active in specified profile
 */
@Configuration
@Profile("dev")
public class DevConfig {
    
    @Bean
    public DataSource dataSource() {
        // H2 in-memory database for development
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }
}

@Configuration
@Profile("prod")
public class ProdConfig {
    
    @Bean
    public DataSource dataSource() {
        // PostgreSQL for production
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://prod-db:5432/myapp");
        return ds;
    }
}

@Configuration
@Profile("!test")  // Active in all profiles EXCEPT test
public class NotTestConfig {}

@Configuration
@Profile({"dev", "staging"})  // Active in dev OR staging
public class NonProdConfig {}
```

---

## Web & REST Annotations

### Request Mapping

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    
    /**
     * @GetMapping - HTTP GET
     */
    @GetMapping
    public List<User> findAll() {
        return userService.findAll();
    }
    
    @GetMapping("/{id}")
    public User findById(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    /**
     * @PostMapping - HTTP POST
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }
    
    /**
     * @PutMapping - HTTP PUT (full update)
     */
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, 
                       @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }
    
    /**
     * @PatchMapping - HTTP PATCH (partial update)
     */
    @PatchMapping("/{id}")
    public User partialUpdate(@PathVariable Long id,
                              @RequestBody Map<String, Object> updates) {
        return userService.partialUpdate(id, updates);
    }
    
    /**
     * @DeleteMapping - HTTP DELETE
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
    
    // ═══════════════════════════════════════════════════════════
    // PARAMETER ANNOTATIONS
    // ═══════════════════════════════════════════════════════════
    
    /**
     * @PathVariable - Extract from URL path
     */
    @GetMapping("/{userId}/orders/{orderId}")
    public Order getOrder(
            @PathVariable Long userId,
            @PathVariable("orderId") Long orderId) {  // Custom name
        return orderService.findByUserAndId(userId, orderId);
    }
    
    /**
     * @RequestParam - Extract from query string
     */
    @GetMapping("/search")
    public Page<User> search(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id") String sortField) {
        return userService.search(name, PageRequest.of(page, size, Sort.by(sortField)));
    }
    
    /**
     * @RequestHeader - Extract from HTTP header
     */
    @GetMapping("/me")
    public User getCurrentUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId) {
        return userService.getCurrentUser(authHeader);
    }
    
    /**
     * @CookieValue - Extract from cookie
     */
    @GetMapping("/preferences")
    public Preferences getPreferences(
            @CookieValue(value = "session-id", required = false) String sessionId) {
        return preferencesService.getBySession(sessionId);
    }
    
    /**
     * @RequestBody - Deserialize JSON body
     */
    @PostMapping("/bulk")
    public List<User> createBulk(@Valid @RequestBody List<CreateUserRequest> requests) {
        return userService.createAll(requests);
    }
    
    /**
     * @ModelAttribute - Form data binding (for MVC)
     */
    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public User createFromForm(@ModelAttribute CreateUserRequest request) {
        return userService.create(request);
    }
}
```

### Exception Handling

```java
/**
 * @ControllerAdvice - Global exception handler
 * @RestControllerAdvice = @ControllerAdvice + @ResponseBody
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    /**
     * @ExceptionHandler - Handle specific exception
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage,
                (a, b) -> a  // Handle duplicates
            ));
        
        return new ErrorResponse("VALIDATION_FAILED", "Validation failed", errors);
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }
}
```

### Response Annotations

```java
@RestController
public class FileController {
    
    /**
     * @ResponseBody - Return value is response body (default in @RestController)
     */
    @GetMapping("/data")
    @ResponseBody  // Redundant in @RestController
    public Data getData() {
        return new Data();
    }
    
    /**
     * @ResponseStatus - Set HTTP status code
     */
    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)  // 201
    public Item createItem(@RequestBody Item item) {
        return itemService.create(item);
    }
    
    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)  // 204
    public void deleteItem(@PathVariable Long id) {
        itemService.delete(id);
    }
}
```

---

## Security Annotations

### Method Security

```java
/**
 * Enable method security in config
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {}

@Service
public class UserService {
    
    /**
     * @PreAuthorize - Check before method execution
     * SpEL expressions supported
     */
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long userId) {
        // Only admins can delete
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<User> getAllUsers() {
        // Admin or Manager
    }
    
    @PreAuthorize("hasAuthority('user:read')")
    public User getUser(Long id) {
        // Has specific authority
    }
    
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public User getUserProfile(Long userId) {
        // Own profile or admin
    }
    
    @PreAuthorize("@securityService.canAccessUser(#userId)")
    public User getSecuredUser(Long userId) {
        // Custom security check via bean method
    }
    
    /**
     * @PostAuthorize - Check after method execution
     * Can use 'returnObject'
     */
    @PostAuthorize("returnObject.owner == authentication.name or hasRole('ADMIN')")
    public Document getDocument(Long id) {
        return documentRepository.findById(id).orElseThrow();
    }
    
    /**
     * @PreFilter - Filter collection parameter before execution
     */
    @PreFilter("filterObject.owner == authentication.name")
    public void deleteDocuments(List<Document> documents) {
        // Only deletes documents owned by current user
    }
    
    /**
     * @PostFilter - Filter collection result after execution
     */
    @PostFilter("filterObject.isPublic or filterObject.owner == authentication.name")
    public List<Document> getDocuments() {
        return documentRepository.findAll();
    }
    
    /**
     * @Secured - Simpler role check (no SpEL)
     */
    @Secured("ROLE_ADMIN")
    public void adminOnly() {}
    
    @Secured({"ROLE_ADMIN", "ROLE_MANAGER"})
    public void adminOrManager() {}
    
    /**
     * @RolesAllowed - JSR-250 standard
     */
    @RolesAllowed("ADMIN")
    public void jsr250AdminOnly() {}
}
```

---



🔬 **Section Challenge — Security Annotations**

**Challenge 1 (Reasoning):** JWT vs session cookies — what are the tradeoffs for a distributed microservices architecture?
<details><summary>Answer</summary>

JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed.
</details>


## Caching Annotations

### Setup Caching

```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(10)));
        return manager;
    }
}
```

### Cache Annotations

```java
@Service
public class ProductService {
    
    /**
     * @Cacheable - Cache method result
     * Next call with same params returns cached value
     */
    @Cacheable(value = "products", key = "#id")
    public Product findById(Long id) {
        // Only called if not in cache
        return productRepository.findById(id).orElseThrow();
    }
    
    @Cacheable(
        value = "products",
        key = "#root.methodName + '_' + #name",
        condition = "#name.length() > 3",  // Only cache if condition true
        unless = "#result == null"          // Don't cache null results
    )
    public Product findByName(String name) {
        return productRepository.findByName(name);
    }
    
    /**
     * @CachePut - Always execute and update cache
     */
    @CachePut(value = "products", key = "#product.id")
    public Product update(Product product) {
        // Always executed, result cached
        return productRepository.save(product);
    }
    
    /**
     * @CacheEvict - Remove from cache
     */
    @CacheEvict(value = "products", key = "#id")
    public void delete(Long id) {
        productRepository.deleteById(id);
    }
    
    @CacheEvict(value = "products", allEntries = true)
    public void clearCache() {
        // Clears entire cache
    }
    
    @CacheEvict(value = "products", allEntries = true, beforeInvocation = true)
    public void refreshAll() {
        // Clears cache before method executes (even if exception thrown)
    }
    
    /**
     * @Caching - Multiple cache operations
     */
    @Caching(
        put = { @CachePut(value = "products", key = "#product.id") },
        evict = { 
            @CacheEvict(value = "productList", allEntries = true),
            @CacheEvict(value = "productCount", allEntries = true)
        }
    )
    public Product save(Product product) {
        return productRepository.save(product);
    }
}
```

---



🔬 **Section Challenge — Caching Annotations**

**Challenge 1 (Design):** Cache-aside vs write-through vs write-behind — when does each cause stale data?
<details><summary>Answer</summary>

Cache-aside (lazy load): on cache miss, load from DB and populate cache. Stale: if DB updated externally (direct DB write bypassing cache). Write-through: write to cache AND DB simultaneously. Stale: never (cache always reflects writes). Write-behind (write-back): write to cache, async write to DB. Stale: if cache crashes before DB write → data loss. Rule: cache-aside for read-heavy. Write-through for write+read. Write-behind for write-heavy (accept loss risk).
</details>


## Async & Scheduling Annotations

### Async Configuration

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }
    
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            log.error("Async error in {}: {}", method.getName(), ex.getMessage());
        };
    }
}
```

### Async Annotations

```java
@Service
public class NotificationService {
    
    /**
     * @Async - Execute method asynchronously
     * Method must be public and called from another bean!
     */
    @Async
    public void sendEmailAsync(String to, String subject, String body) {
        // Runs in separate thread
        emailSender.send(to, subject, body);
    }
    
    /**
     * @Async with Future return type
     */
    @Async
    public CompletableFuture<Boolean> sendSmsAsync(String phone, String message) {
        boolean result = smsSender.send(phone, message);
        return CompletableFuture.completedFuture(result);
    }
    
    /**
     * @Async with specific executor
     */
    @Async("taskExecutor")
    public void heavyTask() {
        // Uses named executor bean
    }
}
```

### Scheduling Annotations

```java
@Configuration
@EnableScheduling
public class SchedulingConfig {}

@Component
@Slf4j
public class ScheduledTasks {
    
    /**
     * @Scheduled - Execute periodically
     * 
     * fixedRate: Run every N ms (may overlap)
     * fixedDelay: Wait N ms after completion before next run
     * initialDelay: Wait before first execution
     */
    @Scheduled(fixedRate = 60000)  // Every 60 seconds
    public void checkHealthEveryMinute() {
        log.info("Health check at {}", LocalDateTime.now());
    }
    
    @Scheduled(fixedDelay = 30000, initialDelay = 10000)
    public void cleanupWithDelay() {
        // First run 10s after startup, then 30s after each completion
    }
    
    /**
     * Cron expressions (second minute hour day month weekday)
     */
    @Scheduled(cron = "0 0 2 * * *")  // 2 AM daily
    public void nightlyCleanup() {
        log.info("Running nightly cleanup");
    }
    
    @Scheduled(cron = "0 */15 * * * *")  // Every 15 minutes
    public void quarterHourTask() {}
    
    @Scheduled(cron = "0 0 9 * * MON-FRI")  // 9 AM weekdays
    public void weekdayMorningReport() {}
    
    @Scheduled(cron = "0 0 0 1 * *")  // First day of each month
    public void monthlyReport() {}
    
    /**
     * Externalized cron
     */
    @Scheduled(cron = "${app.cleanup.cron:0 0 3 * * *}")
    public void configurableTask() {}
    
    /**
     * @Schedules - Multiple schedules
     */
    @Schedules({
        @Scheduled(cron = "0 0 9 * * MON-FRI"),
        @Scheduled(cron = "0 0 18 * * MON-FRI")
    })
    public void twiceDaily() {}
}
```

---



🔬 **Section Challenge — Async & Scheduling Annotations**

**Challenge 1 (Reasoning):** What is the difference between `@Primary` and `@Qualifier` when resolving ambiguous dependencies (multiple beans of the same type)?
<details><summary>Answer</summary>

Default vs Explicit. `@Primary` is placed on the Bean definition to declare it as the universal default. If a class asks for a `PaymentService`, it gets the `@Primary` one automatically. `@Qualifier("stripe")` is placed on the injection point (the constructor parameter) to explicitly request a specific bean by name, completely overriding any `@Primary` designation.
</details>


## Transaction Annotations

### ACID Properties - Database Transaction Fundamentals

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        ACID PROPERTIES EXPLAINED                                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ACID = The four guarantees every database transaction should provide            │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │ A = ATOMICITY ("All or Nothing")                                        │     │
│  │ ───────────────────────────────────────────────────────────────────────│      │
│  │ WHAT: Transaction either FULLY completes or FULLY fails               │       │
│  │                                                                         │     │
│  │ Bank Transfer Example:                                                  │     │
│  │   1. Debit $100 from Account A  ─┐                                     │      │
│  │   2. Credit $100 to Account B   ─┤ BOTH must succeed, or NEITHER      │       │
│  │                                                                         │     │
│  │ WITHOUT ATOMICITY: Crash after step 1 = money disappears!             │       │
│  │ WITH ATOMICITY: Crash after step 1 = both steps rolled back           │       │
│  │                                                                         │     │
│  │ IN SPRING: @Transactional ensures atomicity via rollback              │       │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │ C = CONSISTENCY ("Valid State to Valid State")                          │     │
│  │ ───────────────────────────────────────────────────────────────────────│      │
│  │ WHAT: Transaction moves database from one valid state to another      │       │
│  │                                                                         │     │
│  │ Example Constraints:                                                    │     │
│  │   • Account balance cannot be negative                                 │      │
│  │   • Foreign key must reference existing row                            │      │
│  │   • Total debits must equal total credits                              │      │
│  │                                                                         │     │
│  │ WITHOUT CONSISTENCY: Order references non-existent product            │       │
│  │ WITH CONSISTENCY: Constraint violation = transaction rejected         │       │
│  │                                                                         │     │
│  │ IN SPRING: JPA validations + DB constraints enforce consistency       │       │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │ I = ISOLATION ("Transactions Don't Interfere")                          │     │
│  │ ───────────────────────────────────────────────────────────────────────│      │
│  │ WHAT: Concurrent transactions appear to run sequentially              │       │
│  │                                                                         │     │
│  │ Problem Without Isolation:                                              │     │
│  │   TX1: Read balance ($100)                                             │      │
│  │   TX2: Read balance ($100), Withdraw $50, Commit ($50)                │       │
│  │   TX1: Withdraw $80, Commit → NEGATIVE BALANCE (-$30)!                │       │
│  │                                                                         │     │
│  │ ISOLATION LEVELS:                                                       │     │
│  │   READ_UNCOMMITTED → Dirty reads possible (see uncommitted changes)   │       │
│  │   READ_COMMITTED   → No dirty reads (default for most DBs)            │       │
│  │   REPEATABLE_READ  → Same read = same result within transaction       │       │
│  │   SERIALIZABLE     → Full isolation (as if transactions run serially) │       │
│  │                                                                         │     │
│  │ IN SPRING: @Transactional(isolation = Isolation.REPEATABLE_READ)      │       │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │ D = DURABILITY ("Committed = Permanent")                                │     │
│  │ ───────────────────────────────────────────────────────────────────────│      │
│  │ WHAT: Once committed, data survives system crashes/restarts           │       │
│  │                                                                         │     │
│  │ Example:                                                                │     │
│  │   • User completes purchase → commit → server crashes                 │       │
│  │   • After restart, purchase is STILL in database                      │       │
│  │                                                                         │     │
│  │ HOW DATABASES ACHIEVE DURABILITY:                                       │     │
│  │   • Write-ahead logging (WAL)                                          │      │
│  │   • Flushing to disk before confirming commit                          │      │
│  │   • Replication for fault tolerance                                    │      │
│  │                                                                         │     │
│  │ IN SPRING: Handled by database engine automatically                   │       │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  INTERVIEW TIP: "ACID ensures database transactions are reliable even with       │
│  concurrent access and system failures"                                          │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Transaction Configuration

```java
@Service
@Transactional  // Class-level: all public methods are transactional
public class OrderService {
    
    /**
     * @Transactional - Method-level overrides class-level
     * 
     * PROPAGATION:
     * - REQUIRED (default): Join existing or create new
     * - REQUIRES_NEW: Always create new (suspend current)
     * - SUPPORTS: Use existing or run non-transactional
     * - NOT_SUPPORTED: Suspend existing, run non-transactional
     * - MANDATORY: Must have existing transaction
     * - NEVER: Must NOT have existing transaction
     * - NESTED: Nested transaction (savepoint)
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String action) {
        // New transaction - commits even if calling tx rolls back
        auditRepository.save(new AuditLog(action));
    }
    
    /**
     * ISOLATION LEVELS:
     * - DEFAULT: Database default
     * - READ_UNCOMMITTED: Dirty reads possible
     * - READ_COMMITTED: No dirty reads
     * - REPEATABLE_READ: Consistent reads within transaction
     * - SERIALIZABLE: Full isolation (slowest)
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
        // Highest isolation for financial operations
    }
    
    /**
     * ROLLBACK RULES:
     * - rollbackFor: Rollback on these exceptions
     * - noRollbackFor: Don't rollback on these exceptions
     * 
     * Default: Rollback on RuntimeException & Error
     *          NO rollback on checked exceptions
     */
    @Transactional(
        rollbackFor = {BusinessException.class, IOException.class},
        noRollbackFor = NonCriticalException.class
    )
    public void riskyOperation() throws IOException {
        // Rolls back on BusinessException or IOException
        // Does NOT rollback on NonCriticalException
    }
    
    /**
     * READ-ONLY:
     * Optimization hint - can skip dirty checking
     */
    @Transactional(readOnly = true)
    public List<Order> getOrders() {
        return orderRepository.findAll();
    }
    
    /**
     * TIMEOUT:
     * Transaction timeout in seconds
     */
    @Transactional(timeout = 30)
    public void longRunningOperation() {
        // Fails if takes longer than 30 seconds
    }
}
```

---



🔬 **Section Challenge — Transaction Annotations**

**Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
<details><summary>Answer</summary>

READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
</details>


## Testing Annotations

### Spring Boot Test

```java
/**
 * @SpringBootTest - Full application context test
 */
@SpringBootTest
class ApplicationTests {
    @Test
    void contextLoads() {}
}

/**
 * @WebMvcTest - Test only web layer
 */
@WebMvcTest(UserController.class)
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean  // Mock service layer
    private UserService userService;
    
    @Test
    void shouldReturnUser() throws Exception {
        given(userService.findById(1L)).willReturn(new User(1L, "John"));
        
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"));
    }
}

/**
 * @DataJpaTest - Test only JPA layer
 */
@DataJpaTest
class UserRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void shouldFindByEmail() {
        User user = new User("john@email.com", "John");
        entityManager.persistAndFlush(user);
        
        Optional<User> found = userRepository.findByEmail("john@email.com");
        
        assertThat(found).isPresent();
    }
}

/**
 * @MockBean vs @SpyBean
 */
@SpringBootTest
class ServiceTest {
    
    @MockBean  // Full mock - all methods return defaults
    private ExternalService externalService;
    
    @SpyBean  // Partial mock - real methods unless stubbed
    private UserService userService;
}
```

### JUnit 5 Annotations

```java
class UserServiceTest {
    
    @BeforeAll
    static void setupClass() {
        // Run once before all tests
    }
    
    @AfterAll
    static void teardownClass() {
        // Run once after all tests
    }
    
    @BeforeEach
    void setup() {
        // Run before each test
    }
    
    @AfterEach
    void cleanup() {
        // Run after each test
    }
    
    @Test
    void shouldDoSomething() {}
    
    @Test
    @DisplayName("Should create user when valid data provided")
    void createUserTest() {}
    
    @Test
    @Disabled("Fix in next sprint")
    void brokenTest() {}
    
    @RepeatedTest(5)
    void shouldBeConsistent() {}
    
    @ParameterizedTest
    @ValueSource(strings = {"john@email.com", "jane@email.com"})
    void shouldAcceptValidEmails(String email) {}
    
    @ParameterizedTest
    @CsvSource({"1, John", "2, Jane"})
    void shouldHandleMultipleParams(Long id, String name) {}
    
    @Nested
    @DisplayName("When user exists")
    class WhenUserExists {
        
        @Test
        void shouldReturnUser() {}
        
        @Test
        void shouldUpdateUser() {}
    }
}
```

### Mockito Annotations

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock  // Create mock
    private UserRepository userRepository;
    
    @Spy  // Partial mock
    private EmailService emailService;
    
    @InjectMocks  // Inject mocks into this
    private UserService userService;
    
    @Captor  // Capture arguments
    private ArgumentCaptor<User> userCaptor;
    
    @Test
    void shouldSaveUser() {
        User user = new User("test@email.com");
        when(userRepository.save(any(User.class))).thenReturn(user);
        
        userService.create(user);
        
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("test@email.com");
    }
}
```

---



🔬 **Section Challenge — Testing Annotations**

**Challenge 1 (Reasoning):** What is the difference between `@Primary` and `@Qualifier` when resolving ambiguous dependencies (multiple beans of the same type)?
<details><summary>Answer</summary>

Default vs Explicit. `@Primary` is placed on the Bean definition to declare it as the universal default. If a class asks for a `PaymentService`, it gets the `@Primary` one automatically. `@Qualifier("stripe")` is placed on the injection point (the constructor parameter) to explicitly request a specific bean by name, completely overriding any `@Primary` designation.
</details>


## Lombok Annotations

```java
/**
 * @Data = @Getter + @Setter + @ToString + @EqualsAndHashCode + @RequiredArgsConstructor
 */
@Data
public class UserDto {
    private Long id;
    private String name;
}

/**
 * For immutable objects (DTOs, Value Objects)
 */
@Value  // Immutable @Data
public class CreateUserRequest {
    String name;
    String email;
}

/**
 * @Builder - Fluent builder pattern
 */
@Builder
@AllArgsConstructor
public class Order {
    private Long id;
    
    @Builder.Default  // Default value in builder
    private OrderStatus status = OrderStatus.PENDING;
    
    @Singular  // For collections: addItem(), items()
    private List<OrderItem> items;
}

// Usage
Order order = Order.builder()
    .id(1L)
    .item(item1)
    .item(item2)
    .build();

/**
 * Constructor annotations
 */
@NoArgsConstructor           // No-arg constructor
@AllArgsConstructor          // All-arg constructor
@RequiredArgsConstructor     // Constructor for final fields
public class User {
    private final Long id;   // Included in @RequiredArgsConstructor
    private String name;     // Not included
}

/**
 * @Slf4j - Logger injection
 */
@Slf4j
public class UserService {
    
    public void process() {
        log.info("Processing...");
        log.debug("Debug: {}", data);
        log.error("Error occurred", exception);
    }
}

/**
 * @Accessors - Customize getter/setter style
 */
@Data
@Accessors(fluent = true)  // getName() → name()
public class Config {
    private String host;
    private int port;
}
// Usage: config.host("localhost").port(8080);

/**
 * @With - Immutable "setters" that return new instance
 */
@Value
@With
public class Point {
    int x;
    int y;
}
// Usage: Point p2 = p1.withX(10);

/**
 * @SneakyThrows - Throw checked exceptions without declaring
 */
@SneakyThrows
public void readFile() {
    Files.readString(Path.of("file.txt"));  // IOException not declared
}

/**
 * @Cleanup - Auto-close resources
 */
public void processFile() {
    @Cleanup InputStream in = new FileInputStream("file.txt");
    // Automatically closed at end of scope
}

/**
 * Entity with Lombok (careful with @Data!)
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "orders")  // Avoid lazy loading issues
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    
    @Id
    @EqualsAndHashCode.Include  // Only use ID for equals/hashCode
    private Long id;
    
    private String name;
    
    @OneToMany(mappedBy = "user")
    private List<Order> orders;  // Excluded from toString
}
```

---

## Conditional Annotations

```java
@Configuration
public class ConditionalConfig {
    
    /**
     * @ConditionalOnProperty - Based on property value
     */
    @Bean
    @ConditionalOnProperty(
        name = "app.feature.enabled",
        havingValue = "true",
        matchIfMissing = false  // Don't load if property missing
    )
    public FeatureService featureService() {
        return new FeatureService();
    }
    
    /**
     * @ConditionalOnMissingBean - Only if bean doesn't exist
     */
    @Bean
    @ConditionalOnMissingBean(DataSource.class)
    public DataSource defaultDataSource() {
        return new EmbeddedDatabaseBuilder().build();
    }
    
    /**
     * @ConditionalOnBean - Only if bean exists
     */
    @Bean
    @ConditionalOnBean(RedisConnectionFactory.class)
    public CacheManager redisCacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory).build();
    }
    
    /**
     * @ConditionalOnClass - Only if class is on classpath
     */
    @Bean
    @ConditionalOnClass(name = "org.postgresql.Driver")
    public DataSource postgresDataSource() {
        return new HikariDataSource();
    }
    
    /**
     * @ConditionalOnMissingClass - Only if class is NOT on classpath
     */
    @Bean
    @ConditionalOnMissingClass("com.oracle.jdbc.Driver")
    public DataSource nonOracleDataSource() {
        return new EmbeddedDatabaseBuilder().build();
    }
    
    /**
     * @ConditionalOnExpression - SpEL expression
     */
    @Bean
    @ConditionalOnExpression("${app.mode} == 'advanced' and ${app.enabled}")
    public AdvancedFeature advancedFeature() {
        return new AdvancedFeature();
    }
    
    /**
     * @ConditionalOnWebApplication - Only in web context
     * @ConditionalOnNotWebApplication - Only in non-web context
     */
    @Bean
    @ConditionalOnWebApplication
    public WebFeature webFeature() {
        return new WebFeature();
    }
}
```

---

## Hibernate-Specific Annotations

```java
@Entity
public class Product {
    
    /**
     * @NaturalId - Business key (unique, immutable)
     * Enables naturalId() queries
     */
    @NaturalId
    @Column(nullable = false, unique = true, updatable = false)
    private String sku;
    
    /**
     * @Formula - Calculated field using SQL
     * Not stored in database
     */
    @Formula("(SELECT COUNT(*) FROM order_items WHERE product_id = id)")
    private Integer totalOrders;
    
    @Formula("price * (1 - discount_percent / 100)")
    private BigDecimal effectivePrice;
    
    /**
     * @Where - Default WHERE clause for entity/collection
     */
    @Where(clause = "deleted = false")  // Soft delete filter
    @OneToMany(mappedBy = "product")
    private List<Review> reviews;
    
    /**
     * @Filter - Dynamic, parameterized filter
     */
    @FilterDef(name = "statusFilter", 
               parameters = @ParamDef(name = "status", type = String.class))
    @Filter(name = "statusFilter", condition = "status = :status")
    @OneToMany(mappedBy = "product")
    private List<OrderItem> orderItems;
    
    /**
     * @DynamicUpdate - Only include changed columns in UPDATE
     * Reduces SQL size, better for auditing
     */
    @DynamicUpdate
    @DynamicInsert  // Only non-null columns in INSERT
    private String description;
    
    /**
     * @BatchSize - Batch loading for collections
     * Reduces N+1 queries
     */
    @BatchSize(size = 25)
    @OneToMany(mappedBy = "product")
    private Set<Image> images;
    
    /**
     * @Fetch - Fetch strategy
     */
    @Fetch(FetchMode.SUBSELECT)  // One subselect for all collections
    @OneToMany(mappedBy = "product")
    private List<Tag> tags;
    
    /**
     * @Immutable - Entity cannot be updated
     */
    // @Immutable on class level
    
    /**
     * @CreationTimestamp / @UpdateTimestamp
     * Hibernate-managed timestamps
     */
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    /**
     * @Type - Custom type mapping (Hibernate 6+)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;
    
    /**
     * @ColumnTransformer - Read/write transformations
     */
    @ColumnTransformer(
        read = "pgp_sym_decrypt(ssn, 'password')",
        write = "pgp_sym_encrypt(?, 'password')"
    )
    private String ssn;
}
```

---



🔬 **Section Challenge — Hibernate-Specific Annotations**

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


## Quick Reference Card

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        SPRING BOOT ANNOTATIONS CHEAT SHEET                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ENTITY LIFECYCLE                                                                 │
│   @PrePersist    - Before INSERT                                                 │
│   @PostPersist   - After INSERT (ID available)                                   │
│   @PreUpdate     - Before UPDATE                                                 │
│   @PostUpdate    - After UPDATE                                                  │
│   @PreRemove     - Before DELETE                                                 │
│   @PostRemove    - After DELETE                                                  │
│   @PostLoad      - After SELECT                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ VALIDATION                                                                       │
│   @NotNull       - Cannot be null                                                │
│   @NotEmpty      - Not null, not empty                                           │
│   @NotBlank      - Not null, not empty, not whitespace                           │
│   @Size          - Length/size constraint                                        │
│   @Min/@Max      - Numeric bounds                                                │
│   @Email         - Valid email format                                            │
│   @Pattern       - Regex match                                                   │
│   @Past/@Future  - Date constraints                                              │
│   @Valid         - Trigger nested validation                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│ CACHING                                                                          │
│   @Cacheable     - Cache result                                                  │
│   @CachePut      - Update cache                                                  │
│   @CacheEvict    - Remove from cache                                             │
│   @Caching       - Multiple cache operations                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ASYNC & SCHEDULING                                                               │
│   @Async         - Run asynchronously                                            │
│   @Scheduled     - Run periodically (fixedRate, cron)                            │
│   @EnableAsync   - Enable async processing                                       │
│   @EnableScheduling - Enable scheduling                                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TRANSACTION                                                                      │
│   @Transactional(propagation=?)   - REQUIRED, REQUIRES_NEW, etc.                 │
│   @Transactional(isolation=?)     - READ_COMMITTED, SERIALIZABLE, etc.           │
│   @Transactional(rollbackFor=?)   - Exceptions to rollback on                    │
│   @Transactional(readOnly=true)   - Optimization for reads                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ SECURITY                                                                         │
│   @PreAuthorize  - Check before execution                                        │
│   @PostAuthorize - Check after execution                                         │
│   @PreFilter     - Filter input collection                                       │
│   @PostFilter    - Filter output collection                                      │
│   @Secured       - Simple role check                                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ AUDITING                                                                         │
│   @CreatedDate   - Auto-set creation time                                        │
│   @LastModifiedDate - Auto-set update time                                       │
│   @CreatedBy     - Auto-set creator                                              │
│   @LastModifiedBy - Auto-set modifier                                            │
│   @Version       - Optimistic locking                                            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions

**Q1: What's the difference between @PrePersist and @CreatedDate?**
```
@PrePersist:
- JPA standard callback
- You write the logic yourself
- More flexible, can do anything
- Works with any JPA provider

@CreatedDate:
- Spring Data specific
- Automatic timestamp setting
- Requires @EnableJpaAuditing
- Cleaner, less boilerplate
```

**Q2: Why doesn't @Transactional work on private methods?**
```
Because Spring uses proxies for @Transactional:
- JDK proxy or CGLIB creates wrapper around your bean
- When you call public method, proxy intercepts
- Private methods cannot be proxied
- Same issue with calls from within the same class (self-invocation)
```

**Q3: @NotNull vs @NotEmpty vs @NotBlank?**
```
@NotNull: value != null
  - null ❌, "" ✅, "  " ✅, "abc" ✅

@NotEmpty: value != null && value.length > 0
  - null ❌, "" ❌, "  " ✅, "abc" ✅

@NotBlank: value != null && value.trim().length > 0
  - null ❌, "" ❌, "  " ❌, "abc" ✅
```

**Q4: When to use @EntityListeners vs inline callbacks?**
```
Inline callbacks (@PrePersist on entity):
- Simple, entity-specific logic
- Keep entity self-contained
- Quick implementation

@EntityListeners:
- Reusable across entities
- Separation of concerns
- Better testability
- Complex audit/event logic
```

---

*This completes the Spring Boot Annotations Reference - bookmark this for quick lookup!*


---

> **Navigation**: [< Previous](Ch28_Annotations_Core.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch52_SB_WebSocket_GraphQL_gRPC.md)