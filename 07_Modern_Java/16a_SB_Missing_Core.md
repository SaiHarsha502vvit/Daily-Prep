> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](16b_SB_Missing_Advanced.md)

---

# 🔧 SPRING BOOT MASTERY - Part 14: Essential Topics (Previously Missing)

> **Everything Else You NEED to Know**
> _"The gaps that separate amateurs from professionals"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why These "Essential Missing" Topics?                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Production requirements: Caching, async, scheduling are expected             │
│  • API completion: Swagger docs, file uploads are basic features                │
│  • Monitoring: Actuator = production application visibility                     │
│  • Performance: Async and caching directly affect response times                │
│  • Interview gaps: "Have you used @Cacheable? @Async?" - common questions       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How to Implement Each Feature?                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • @Cacheable: Annotate method, configure cache manager (Redis/Caffeine)        │
│  • @Async: @EnableAsync + return CompletableFuture                              │
│  • @Scheduled: @EnableScheduling + cron expressions                             │
│  • Actuator: Add dependency, configure endpoints in properties                  │
│  • Swagger: springdoc-openapi dependency, annotations optional                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Each Feature?                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Caching: Expensive computations, frequently accessed data                    │
│  • Async: Email sending, file processing, external API calls                    │
│  • Scheduling: Report generation, cleanup jobs, data sync                       │
│  • Actuator: Always in production for monitoring/health checks                  │
│  • Swagger: APIs consumed by other teams/clients                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Topics to Prioritize?                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     Caching, @Async, Actuator, Swagger/OpenAPI                      │
│  IMPORTANT:     Scheduling, file upload, email, internationalization            │
│  ADVANCED:      WebSocket, Server-Sent Events, rate limiting                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 📌 Table of Contents

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WHAT THIS PART COVERS                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. Caching (@Cacheable, @CacheEvict, Redis)                                    │
│  2. Async Processing (@Async, @EnableAsync)                                     │
│  3. Scheduling (@Scheduled, @EnableScheduling)                                  │
│  4. Spring Boot Actuator (Health, Metrics, Info)                                │
│  5. API Documentation (Swagger/OpenAPI)                                         │
│  6. File Upload/Download (Multipart)                                            │
│  7. Email Sending (JavaMailSender)                                              │
│  8. Logging (SLF4J, Logback Configuration)                                      │
│  9. Database Migrations (Flyway)                                                │
│  10. Docker Deployment                                                          │
│  11. Environment Configuration                                                  │
│  12. Messaging Basics (Kafka/RabbitMQ)                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 📌 Section 1: Caching

---

## Chapter 1: Spring Cache Abstraction

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WHY CACHING MATTERS                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WITHOUT CACHING:                                                               │
│  • Same expensive database query runs 1000x/minute                              │
│  • External API calls hit rate limits                                           │
│  • CPU-intensive calculations repeat unnecessarily                              │
│  • Response time: 500ms                                                         │
│                                                                                 │
│  WITH CACHING:                                                                  │
│  • Database query runs once, cached for 5 minutes                               │
│  • API response cached, within rate limits                                      │
│  • Calculation done once, result reused                                         │
│  • Response time: 5ms                                                           │
│                                                                                 │
│  CACHE PROVIDERS:                                                               │
│  • Simple (ConcurrentHashMap) - Built-in, single instance                       │
│  • Caffeine - High-performance local cache                                      │
│  • Redis - Distributed cache (multiple instances)                               │
│  • Ehcache - Feature-rich local cache                                           │
│  • Hazelcast - Distributed + in-memory grid                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Enable Caching

```java
// pom.xml
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-cache</artifactId>
// </dependency>

@SpringBootApplication
@EnableCaching  // Enable Spring's caching support
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

### @Cacheable - Read from Cache

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * @Cacheable - Checks cache BEFORE executing method
     * If cache hit: returns cached value, method NOT executed
     * If cache miss: executes method, stores result in cache
     */
    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        log.info("Fetching user from database: {}", id);  // Only logs on cache miss
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    // Complex key with SpEL
    @Cacheable(value = "users", key = "#username.toLowerCase()")
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Multiple parameters in key
    @Cacheable(value = "userSearch", key = "#role + '_' + #status")
    public List<User> findByRoleAndStatus(String role, String status) {
        return userRepository.findByRoleAndStatus(role, status);
    }

    // Conditional caching - only cache if condition is true
    @Cacheable(value = "users", key = "#id", condition = "#id > 0")
    public User findByIdConditional(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    // Unless - don't cache null results
    @Cacheable(value = "users", key = "#id", unless = "#result == null")
    public User findByIdUnlessNull(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    // Cache with sync (prevent cache stampede)
    @Cacheable(value = "users", key = "#id", sync = true)
    public User findByIdSync(Long id) {
        // Only one thread will execute this at a time for same key
        return userRepository.findById(id).orElse(null);
    }
}
```

### @CacheEvict - Remove from Cache

```java
@Service
public class UserService {

    /**
     * @CacheEvict - Removes entry from cache
     * Use when data changes (create, update, delete)
     */
    @CacheEvict(value = "users", key = "#user.id")
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    // Evict all entries in cache
    @CacheEvict(value = "users", allEntries = true)
    public void clearAllUserCache() {
        log.info("All user cache cleared");
    }

    // Evict before method execution
    @CacheEvict(value = "users", key = "#id", beforeInvocation = true)
    public void deleteUser(Long id) {
        // Cache cleared BEFORE this runs
        // Useful if method might fail - cache still cleared
        userRepository.deleteById(id);
    }
}
```

### @CachePut - Update Cache

```java
@Service
public class UserService {

    /**
     * @CachePut - ALWAYS executes method and updates cache
     * Different from @Cacheable which skips execution on cache hit
     */
    @CachePut(value = "users", key = "#user.id")
    public User createUser(User user) {
        // Method always executes, result stored in cache
        return userRepository.save(user);
    }

    @CachePut(value = "users", key = "#result.id")
    public User createUserReturnId(User user) {
        // Use #result to access return value in key
        return userRepository.save(user);
    }
}
```

### @Caching - Multiple Cache Operations

```java
@Service
public class UserService {

    @Caching(
        cacheable = {
            @Cacheable(value = "users", key = "#id")
        },
        evict = {
            @CacheEvict(value = "userSearch", allEntries = true)
        }
    )
    public User findAndRefreshSearch(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @Caching(evict = {
        @CacheEvict(value = "users", key = "#user.id"),
        @CacheEvict(value = "userSearch", allEntries = true),
        @CacheEvict(value = "userStats", allEntries = true)
    })
    public void updateUserAndClearRelated(User user) {
        userRepository.save(user);
    }
}
```

### Cache Configuration

```java
// application.yml
// spring:
//   cache:
//     type: caffeine  # simple, caffeine, redis
//     caffeine:
//       spec: maximumSize=500,expireAfterWrite=10m

@Configuration
@EnableCaching
public class CacheConfig {

    // Caffeine cache manager with custom settings
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .initialCapacity(100)
            .maximumSize(500)
            .expireAfterWrite(Duration.ofMinutes(10))
            .recordStats());  // Enable statistics
        return cacheManager;
    }

    // Multiple caches with different settings
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();

        cacheManager.setCaches(List.of(
            buildCache("users", 100, Duration.ofMinutes(30)),
            buildCache("products", 500, Duration.ofHours(1)),
            buildCache("config", 50, Duration.ofDays(1))
        ));

        return cacheManager;
    }

    private CaffeineCache buildCache(String name, int maxSize, Duration ttl) {
        return new CaffeineCache(name, Caffeine.newBuilder()
            .maximumSize(maxSize)
            .expireAfterWrite(ttl)
            .build());
    }
}
```

### Redis Cache (Distributed)

```java
// pom.xml
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-data-redis</artifactId>
// </dependency>

// application.yml
// spring:
//   redis:
//     host: localhost
//     port: 6379
//   cache:
//     type: redis
//     redis:
//       time-to-live: 600000  # 10 minutes in ms

@Configuration
@EnableCaching
public class RedisCacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();

        // Different TTL for different caches
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("users", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigs.put("products", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigs.put("sessions", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigs)
            .transactionAware()
            .build();
    }
}
```

---

# 📌 Section 2: Async Processing

---

## Chapter 2: @Async Deep Dive

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              ASYNC PROCESSING FLOW                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SYNCHRONOUS (Default):                                                         │
│  Request → processA() → processB() → sendEmail() → Response                     │
│  Total time: 100ms + 50ms + 2000ms = 2150ms                                     │
│                                                                                 │
│  ASYNCHRONOUS (With @Async):                                                    │
│  Request → processA() → processB() → [sendEmail() in background] → Response     │
│  Total time: 100ms + 50ms = 150ms (email sends in parallel)                     │
│                                                                                 │
│  USE CASES:                                                                     │
│  • Sending emails/notifications                                                 │
│  • Generating reports                                                           │
│  • Calling external APIs that aren't needed for response                        │
│  • Audit logging                                                                │
│  • Clean-up tasks                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Enable and Configure

```java
@SpringBootApplication
@EnableAsync  // Enable async processing
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);           // Min threads
        executor.setMaxPoolSize(10);           // Max threads
        executor.setQueueCapacity(100);        // Queue before rejecting
        executor.setThreadNamePrefix("Async-"); // For debugging
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }

    // Handle uncaught async exceptions
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (throwable, method, objects) -> {
            log.error("Async exception in method {}: {}",
                method.getName(), throwable.getMessage());
        };
    }
}
```

### @Async Methods

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;
    private final SmsGateway smsGateway;

    /**
     * Fire-and-forget async method (void return)
     * Caller doesn't wait or care about result
     */
    @Async
    public void sendEmailAsync(String to, String subject, String body) {
        // This runs in a separate thread
        log.info("Sending email in thread: {}", Thread.currentThread().getName());

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);

        log.info("Email sent to {}", to);
    }

    /**
     * Async with result (CompletableFuture)
     * Caller can optionally wait for result
     */
    @Async
    public CompletableFuture<Boolean> sendSmsAsync(String phone, String message) {
        log.info("Sending SMS in thread: {}", Thread.currentThread().getName());

        try {
            smsGateway.send(phone, message);
            return CompletableFuture.completedFuture(true);
        } catch (Exception e) {
            log.error("SMS failed: {}", e.getMessage());
            return CompletableFuture.completedFuture(false);
        }
    }

    /**
     * Use specific executor
     */
    @Async("emailExecutor")  // Custom executor bean name
    public void sendEmailWithExecutor(String to, String subject, String body) {
        // Uses emailExecutor bean instead of default
    }
}


// Usage in Controller/Service
@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final NotificationService notificationService;

    @PostMapping("/orders")
    public ResponseEntity<Order> createOrder(@RequestBody OrderRequest request) {
        // Process order synchronously
        Order order = orderService.create(request);

        // Send notifications asynchronously (don't wait)
        notificationService.sendEmailAsync(
            order.getCustomerEmail(),
            "Order Confirmed",
            "Your order #" + order.getId() + " is confirmed!"
        );

        // Return immediately, email sends in background
        return ResponseEntity.ok(order);
    }

    @PostMapping("/orders/{id}/notify-all")
    public ResponseEntity<String> notifyAll(@PathVariable Long id) {
        Order order = orderService.findById(id);

        // Run multiple async tasks
        CompletableFuture<Boolean> emailFuture =
            notificationService.sendEmailAsync2(order.getEmail(), "...");
        CompletableFuture<Boolean> smsFuture =
            notificationService.sendSmsAsync(order.getPhone(), "...");

        // Wait for all to complete (optional)
        CompletableFuture.allOf(emailFuture, smsFuture).join();

        return ResponseEntity.ok("All notifications sent");
    }
}
```

### Common @Async Pitfalls

```java
@Service
public class BadAsyncExample {

    // ❌ PROBLEM 1: Calling async method from same class
    public void process() {
        sendEmailInternal("test@test.com");  // NOT ASYNC! Same class call
    }

    @Async
    public void sendEmailInternal(String to) {
        // This won't run async when called from process()
        // Spring AOP proxy is bypassed
    }

    // ✅ SOLUTION: Inject self or use separate service
    @Autowired
    private BadAsyncExample self;

    public void processFixed() {
        self.sendEmailInternal("test@test.com");  // Goes through proxy
    }
}


// ❌ PROBLEM 2: Transaction in async
@Service
public class BadTransactionAsync {

    @Async
    @Transactional  // Problematic!
    public void asyncTransactional() {
        // Transaction starts in new thread
        // Original transaction is NOT propagated
        // Can cause unexpected behavior
    }
}

// ✅ SOLUTION: Separate transaction boundary
@Service
public class GoodAsyncService {

    @Autowired
    private TransactionalService txService;

    @Async
    public void asyncWork(Long id) {
        // Call transactional service from async method
        txService.doTransactionalWork(id);
    }
}

@Service
public class TransactionalService {
    @Transactional
    public void doTransactionalWork(Long id) {
        // Proper transaction here
    }
}
```

---

# 📌 Section 3: Scheduling

---

## Chapter 3: @Scheduled Tasks

```java
@Configuration
@EnableScheduling  // Enable scheduling
public class SchedulingConfig implements SchedulingConfigurer {

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        // Custom thread pool for scheduled tasks
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("Scheduled-");
        scheduler.initialize();
        taskRegistrar.setTaskScheduler(scheduler);
    }
}


@Service
@Slf4j
public class ScheduledTasks {

    /**
     * fixedRate: Run every X ms (regardless of previous execution time)
     * Starts new execution even if previous hasn't finished
     */
    @Scheduled(fixedRate = 5000)  // Every 5 seconds
    public void runEvery5Seconds() {
        log.info("Fixed rate task - {}", LocalDateTime.now());
    }

    /**
     * fixedDelay: Wait X ms AFTER previous execution completes
     * Ensures gap between executions
     */
    @Scheduled(fixedDelay = 10000)  // 10 seconds after last completion
    public void runWithDelay() {
        log.info("Fixed delay task - {}", LocalDateTime.now());
        // If this takes 3 seconds, next run is 13 seconds from start
    }

    /**
     * initialDelay: Wait before first execution
     */
    @Scheduled(initialDelay = 5000, fixedRate = 60000)
    public void runAfterStartup() {
        // Waits 5 seconds after app start, then runs every minute
        log.info("Task with initial delay");
    }

    /**
     * Cron expression for complex schedules
     * Format: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 9 * * MON-FRI")  // 9 AM weekdays
    public void runAt9AmWeekdays() {
        log.info("Morning report generation");
    }

    @Scheduled(cron = "0 */15 * * * *")  // Every 15 minutes
    public void runEvery15Minutes() {
        log.info("15-minute task");
    }

    @Scheduled(cron = "0 0 0 1 * *")  // First day of every month
    public void runMonthly() {
        log.info("Monthly cleanup");
    }

    /**
     * Cron with timezone
     */
    @Scheduled(cron = "0 0 18 * * *", zone = "America/New_York")
    public void runAt6PmNewYork() {
        log.info("End of business day - NY time");
    }

    /**
     * Externalized schedule
     */
    @Scheduled(cron = "${jobs.cleanup.cron:0 0 2 * * *}")  // Default: 2 AM
    public void configurableCleanup() {
        log.info("Configurable cleanup");
    }
}


// application.yml
// jobs:
//   cleanup:
//     cron: "0 0 3 * * *"  # Override to 3 AM

### Cron Expression Reference

┌─────────────────────────────────────────────────────────────────────────────────┐
│              CRON EXPRESSION CHEAT SHEET                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Format: second minute hour day-of-month month day-of-week                      │
│                                                                                 │
│  ┌──────────── second (0-59)                                                    │
│  │ ┌────────── minute (0-59)                                                    │
│  │ │ ┌──────── hour (0-23)                                                      │
│  │ │ │ ┌────── day of month (1-31)                                              │
│  │ │ │ │ ┌──── month (1-12)                                                     │
│  │ │ │ │ │ ┌── day of week (0-7, 0 or 7 = Sunday)                               │
│  │ │ │ │ │ │                                                                    │
│  * * * * * *                                                                    │
│                                                                                 │
│  SPECIAL CHARACTERS:                                                            │
│  * = any value                                                                  │
│  , = list (MON,WED,FRI)                                                         │
│  - = range (1-5)                                                                │
│  / = step (*/15 = every 15)                                                     │
│                                                                                 │
│  EXAMPLES:                                                                      │
│  "0 0 * * * *"     = Every hour (top of hour)                                   │
│  "0 */30 * * * *"  = Every 30 minutes                                           │
│  "0 0 9-17 * * *"  = Every hour, 9 AM - 5 PM                                    │
│  "0 0 0 * * *"     = Midnight every day                                         │
│  "0 0 12 * * MON"  = Noon every Monday                                          │
│  "0 0 0 1 * *"     = Midnight, first of month                                   │
│  "0 0 0 L * *"     = Midnight, last day of month                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🌱 Section 4: Spring Boot Actuator

---

## Chapter 4: Production-Ready Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              ACTUATOR - PRODUCTION MONITORING                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WHAT ACTUATOR PROVIDES:                                                        │
│  • /actuator/health - Is app healthy?                                           │
│  • /actuator/info - App version, git info                                       │
│  • /actuator/metrics - CPU, memory, requests                                    │
│  • /actuator/env - Environment properties                                       │
│  • /actuator/loggers - View/change log levels                                   │
│  • /actuator/beans - All Spring beans                                           │
│  • /actuator/mappings - All URL mappings                                        │
│  • /actuator/threaddump - Thread states                                         │
│  • /actuator/heapdump - Heap dump (download)                                    │
│                                                                                 │
│  USED BY:                                                                       │
│  • Kubernetes (health probes)                                                   │
│  • Prometheus (metrics scraping)                                                │
│  • Load balancers (health checks)                                               │
│  • DevOps dashboards                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### Configuration

```yaml
# application.yml
management:
    endpoints:
        web:
            exposure:
                include: health,info,metrics,prometheus # Expose specific endpoints
                # include: "*"  # Expose all (NOT recommended in prod)
            base-path: /actuator # URL prefix
    endpoint:
        health:
            show-details: when-authorized # always, never, when-authorized
            show-components: always
    info:
        env:
            enabled: true # Show info.* properties
    health:
        db:
            enabled: true # Database health check
        redis:
            enabled: true # Redis health check
        diskspace:
            enabled: true # Disk space check

# Custom info
info:
    app:
        name: My Application
        version: "@project.version@" # From Maven
        description: Spring Boot Demo
    team: Backend Team
    contact: team@company.com
```

### Health Indicators

```java
// Custom health indicator
@Component
public class ExternalApiHealthIndicator implements HealthIndicator {

    @Autowired
    private WebClient webClient;

    @Override
    public Health health() {
        try {
            String response = webClient.get()
                .uri("https://api.external.com/health")
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(5));

            return Health.up()
                .withDetail("external-api", "Available")
                .withDetail("response", response)
                .build();

        } catch (Exception e) {
            return Health.down()
                .withDetail("external-api", "Unavailable")
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}

// Custom health for database check
@Component
public class DatabaseHealthIndicator extends AbstractHealthIndicator {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

        if (result != null && result == 1) {
            builder.up()
                .withDetail("database", "Responsive")
                .build();
        } else {
            builder.down()
                .withDetail("database", "Query failed")
                .build();
        }
    }
}
```

### Custom Metrics

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final MeterRegistry meterRegistry;
    private final Counter orderCounter;
    private final Timer orderProcessingTimer;

    @PostConstruct
    public void initMetrics() {
        // Counter - counts occurrences
        Counter.builder("orders.created")
            .description("Number of orders created")
            .tag("type", "all")
            .register(meterRegistry);

        // Gauge - current value
        Gauge.builder("orders.pending", this, OrderService::getPendingOrderCount)
            .description("Number of pending orders")
            .register(meterRegistry);
    }

    public Order createOrder(OrderRequest request) {
        // Record timing
        return Timer.builder("order.processing.time")
            .description("Order processing duration")
            .tag("type", request.getType())
            .register(meterRegistry)
            .record(() -> {
                // Actual processing
                Order order = process(request);

                // Increment counter
                meterRegistry.counter("orders.created",
                    "type", request.getType()).increment();

                return order;
            });
    }
}
```

### Access Examples

```bash
# Health check
GET http://localhost:8080/actuator/health

# Response:
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 500107862016,
        "free": 300000000000
      }
    },
    "redis": { "status": "UP" }
  }
}

# Metrics
GET http://localhost:8080/actuator/metrics/jvm.memory.used

# Change log level at runtime
POST http://localhost:8080/actuator/loggers/com.myapp
Content-Type: application/json
{
  "configuredLevel": "DEBUG"
}
```

---

# 🔌 Section 5: API Documentation (swagger/openapi)

---

## Chapter 5: Swagger/OpenAPI Setup

```xml
<!-- pom.xml - SpringDoc OpenAPI -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```


---

> **Navigation**: [< Previous](15_Spring_Boot_Part13_Industry_Projects.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](16b_SB_Missing_Advanced.md)