# 🔧 SPRING BOOT MASTERY - Part 14: Essential Topics (Previously Missing)

> **Everything Else You NEED to Know**
> _"The gaps that separate amateurs from professionals"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why These "Essential Missing" Topics?                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Production requirements: Caching, async, scheduling are expected            │
│  • API completion: Swagger docs, file uploads are basic features              │
│  • Monitoring: Actuator = production application visibility                   │
│  • Performance: Async and caching directly affect response times              │
│  • Interview gaps: "Have you used @Cacheable? @Async?" - common questions    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How to Implement Each Feature?                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • @Cacheable: Annotate method, configure cache manager (Redis/Caffeine)       │
│  • @Async: @EnableAsync + return CompletableFuture                            │
│  • @Scheduled: @EnableScheduling + cron expressions                           │
│  • Actuator: Add dependency, configure endpoints in properties                │
│  • Swagger: springdoc-openapi dependency, annotations optional                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Each Feature?                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Caching: Expensive computations, frequently accessed data                   │
│  • Async: Email sending, file processing, external API calls                  │
│  • Scheduling: Report generation, cleanup jobs, data sync                     │
│  • Actuator: Always in production for monitoring/health checks                │
│  • Swagger: APIs consumed by other teams/clients                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Topics to Prioritize?                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     Caching, @Async, Actuator, Swagger/OpenAPI                      │
│  IMPORTANT:     Scheduling, file upload, email, internationalization           │
│  ADVANCED:      WebSocket, Server-Sent Events, rate limiting                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# TABLE OF CONTENTS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WHAT THIS PART COVERS                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Caching (@Cacheable, @CacheEvict, Redis)                                   │
│  2. Async Processing (@Async, @EnableAsync)                                    │
│  3. Scheduling (@Scheduled, @EnableScheduling)                                 │
│  4. Spring Boot Actuator (Health, Metrics, Info)                              │
│  5. API Documentation (Swagger/OpenAPI)                                        │
│  6. File Upload/Download (Multipart)                                           │
│  7. Email Sending (JavaMailSender)                                             │
│  8. Logging (SLF4J, Logback Configuration)                                     │
│  9. Database Migrations (Flyway)                                               │
│  10. Docker Deployment                                                          │
│  11. Environment Configuration                                                  │
│  12. Messaging Basics (Kafka/RabbitMQ)                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 1: CACHING

---

## Chapter 1: Spring Cache Abstraction

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WHY CACHING MATTERS                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITHOUT CACHING:                                                               │
│  • Same expensive database query runs 1000x/minute                             │
│  • External API calls hit rate limits                                          │
│  • CPU-intensive calculations repeat unnecessarily                             │
│  • Response time: 500ms                                                        │
│                                                                                  │
│  WITH CACHING:                                                                  │
│  • Database query runs once, cached for 5 minutes                              │
│  • API response cached, within rate limits                                     │
│  • Calculation done once, result reused                                        │
│  • Response time: 5ms                                                          │
│                                                                                  │
│  CACHE PROVIDERS:                                                               │
│  • Simple (ConcurrentHashMap) - Built-in, single instance                     │
│  • Caffeine - High-performance local cache                                     │
│  • Redis - Distributed cache (multiple instances)                              │
│  • Ehcache - Feature-rich local cache                                          │
│  • Hazelcast - Distributed + in-memory grid                                   │
│                                                                                  │
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

# SECTION 2: ASYNC PROCESSING

---

## Chapter 2: @Async Deep Dive

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              ASYNC PROCESSING FLOW                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SYNCHRONOUS (Default):                                                         │
│  Request → processA() → processB() → sendEmail() → Response                    │
│  Total time: 100ms + 50ms + 2000ms = 2150ms                                    │
│                                                                                  │
│  ASYNCHRONOUS (With @Async):                                                    │
│  Request → processA() → processB() → [sendEmail() in background] → Response   │
│  Total time: 100ms + 50ms = 150ms (email sends in parallel)                   │
│                                                                                  │
│  USE CASES:                                                                      │
│  • Sending emails/notifications                                                 │
│  • Generating reports                                                           │
│  • Calling external APIs that aren't needed for response                       │
│  • Audit logging                                                                │
│  • Clean-up tasks                                                               │
│                                                                                  │
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

# SECTION 3: SCHEDULING

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
```

### Cron Expression Reference

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              CRON EXPRESSION CHEAT SHEET                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Format: second minute hour day-of-month month day-of-week                      │
│                                                                                  │
│  ┌──────────── second (0-59)                                                    │
│  │ ┌────────── minute (0-59)                                                    │
│  │ │ ┌──────── hour (0-23)                                                      │
│  │ │ │ ┌────── day of month (1-31)                                             │
│  │ │ │ │ ┌──── month (1-12)                                                    │
│  │ │ │ │ │ ┌── day of week (0-7, 0 or 7 = Sunday)                             │
│  │ │ │ │ │ │                                                                    │
│  * * * * * *                                                                    │
│                                                                                  │
│  SPECIAL CHARACTERS:                                                             │
│  * = any value                                                                  │
│  , = list (MON,WED,FRI)                                                        │
│  - = range (1-5)                                                               │
│  / = step (*/15 = every 15)                                                    │
│                                                                                  │
│  EXAMPLES:                                                                       │
│  "0 0 * * * *"     = Every hour (top of hour)                                  │
│  "0 */30 * * * *"  = Every 30 minutes                                          │
│  "0 0 9-17 * * *"  = Every hour, 9 AM - 5 PM                                  │
│  "0 0 0 * * *"     = Midnight every day                                        │
│  "0 0 12 * * MON"  = Noon every Monday                                         │
│  "0 0 0 1 * *"     = Midnight, first of month                                  │
│  "0 0 0 L * *"     = Midnight, last day of month                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 4: SPRING BOOT ACTUATOR

---

## Chapter 4: Production-Ready Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              ACTUATOR - PRODUCTION MONITORING                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WHAT ACTUATOR PROVIDES:                                                        │
│  • /actuator/health - Is app healthy?                                          │
│  • /actuator/info - App version, git info                                      │
│  • /actuator/metrics - CPU, memory, requests                                   │
│  • /actuator/env - Environment properties                                      │
│  • /actuator/loggers - View/change log levels                                  │
│  • /actuator/beans - All Spring beans                                          │
│  • /actuator/mappings - All URL mappings                                       │
│  • /actuator/threaddump - Thread states                                        │
│  • /actuator/heapdump - Heap dump (download)                                   │
│                                                                                  │
│  USED BY:                                                                        │
│  • Kubernetes (health probes)                                                   │
│  • Prometheus (metrics scraping)                                               │
│  • Load balancers (health checks)                                              │
│  • DevOps dashboards                                                            │
│                                                                                  │
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

# SECTION 5: API DOCUMENTATION (SWAGGER/OPENAPI)

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

```yaml
# application.yml
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: method
    tagsSorter: alpha
  show-actuator: false
```

### OpenAPI Configuration

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("My Application API")
                .version("1.0.0")
                .description("API documentation for My Application")
                .contact(new Contact()
                    .name("Backend Team")
                    .email("team@company.com")
                    .url("https://company.com"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0")))
            .externalDocs(new ExternalDocumentation()
                .description("Wiki Documentation")
                .url("https://wiki.company.com"))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Enter JWT token")));
    }
}
```

### Annotating Controllers

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs for managing users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(
        summary = "Get user by ID",
        description = "Retrieves a user by their unique identifier"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(
            @Parameter(description = "User ID", required = true, example = "1")
            @PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @Operation(summary = "Create a new user")
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "User to create",
                required = true,
                content = @Content(
                    schema = @Schema(implementation = CreateUserRequest.class),
                    examples = @ExampleObject(
                        name = "Example user",
                        value = """
                            {
                                "email": "john@example.com",
                                "name": "John Doe",
                                "role": "USER"
                            }
                            """
                    )
                )
            )
            @RequestBody @Valid CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.create(request));
    }

    @Operation(
        summary = "Search users",
        description = "Search users with filtering and pagination"
    )
    @GetMapping("/search")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @Parameter(description = "Search by name")
            @RequestParam(required = false) String name,

            @Parameter(description = "Filter by role")
            @RequestParam(required = false) String role,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.search(name, role, page, size));
    }
}


// DTO with schema annotations
@Schema(description = "User creation request")
public record CreateUserRequest(

    @Schema(
        description = "User's email address",
        example = "john@example.com",
        required = true
    )
    @Email
    @NotBlank
    String email,

    @Schema(
        description = "User's full name",
        example = "John Doe",
        minLength = 2,
        maxLength = 100
    )
    @NotBlank
    @Size(min = 2, max = 100)
    String name,

    @Schema(
        description = "User role",
        allowableValues = {"USER", "ADMIN", "MODERATOR"},
        defaultValue = "USER"
    )
    String role
) {}
```

**Access Swagger UI:** `http://localhost:8080/swagger-ui.html`

---

# SECTION 6: FILE UPLOAD/DOWNLOAD

---

## Chapter 6: Multipart File Handling

```yaml
# application.yml
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 10MB
      max-request-size: 50MB
      file-size-threshold: 2KB # After this, write to disk
```

```java
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileStorageService storageService;

    /**
     * Single file upload
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedType(contentType)) {
            throw new BadRequestException("File type not allowed");
        }

        String fileName = storageService.store(file);

        return ResponseEntity.ok(new FileUploadResponse(
            fileName,
            file.getOriginalFilename(),
            file.getSize(),
            file.getContentType()
        ));
    }

    /**
     * Multiple file upload
     */
    @PostMapping("/upload-multiple")
    public ResponseEntity<List<FileUploadResponse>> uploadMultiple(
            @RequestParam("files") MultipartFile[] files) {

        return ResponseEntity.ok(
            Arrays.stream(files)
                .filter(f -> !f.isEmpty())
                .map(f -> {
                    String name = storageService.store(f);
                    return new FileUploadResponse(name, f.getOriginalFilename(),
                                                   f.getSize(), f.getContentType());
                })
                .toList()
        );
    }

    /**
     * File download
     */
    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        Resource resource = storageService.loadAsResource(filename);

        String contentType = "application/octet-stream";

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + resource.getFilename() + "\"")
            .body(resource);
    }

    /**
     * Stream large file
     */
    @GetMapping("/stream/{filename}")
    public ResponseEntity<StreamingResponseBody> streamFile(@PathVariable String filename) {
        Path filePath = storageService.getPath(filename);

        StreamingResponseBody stream = outputStream -> {
            try (InputStream inputStream = Files.newInputStream(filePath)) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
            }
        };

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + filename + "\"")
            .body(stream);
    }

    private boolean isAllowedType(String contentType) {
        return List.of(
            "image/jpeg", "image/png", "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ).contains(contentType);
    }
}


@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Path.of(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String store(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
            ? originalName.substring(originalName.lastIndexOf("."))
            : "";
        String newFileName = UUID.randomUUID() + extension;

        Path destinationPath = Path.of(uploadDir).resolve(newFileName);

        try {
            file.transferTo(destinationPath);
            log.info("File stored: {}", newFileName);
            return newFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Resource loadAsResource(String filename) {
        try {
            Path file = Path.of(uploadDir).resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileNotFoundException("File not found: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new FileNotFoundException("File not found: " + filename);
        }
    }

    public Path getPath(String filename) {
        return Path.of(uploadDir).resolve(filename);
    }
}
```

---

# SECTION 7: EMAIL SENDING

---

## Chapter 7: JavaMailSender

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD} # Use app password for Gmail
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000
```

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Simple text email
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
        log.info("Email sent to {}", to);
    }

    /**
     * HTML email
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent)
            throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);  // true = HTML

        mailSender.send(message);
        log.info("HTML email sent to {}", to);
    }

    /**
     * Email with attachment
     */
    public void sendEmailWithAttachment(String to, String subject, String text,
                                         String attachmentPath) throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text);

        FileSystemResource file = new FileSystemResource(new File(attachmentPath));
        helper.addAttachment(file.getFilename(), file);

        mailSender.send(message);
        log.info("Email with attachment sent to {}", to);
    }

    /**
     * Template-based email (with Thymeleaf)
     */
    @Autowired
    private SpringTemplateEngine templateEngine;

    public void sendTemplatedEmail(String to, String templateName,
                                    Map<String, Object> variables) throws MessagingException {

        Context context = new Context();
        context.setVariables(variables);

        String htmlContent = templateEngine.process(templateName, context);
        sendHtmlEmail(to, (String) variables.get("subject"), htmlContent);
    }
}


// Email template: src/main/resources/templates/email/welcome.html
// <!DOCTYPE html>
// <html xmlns:th="http://www.thymeleaf.org">
// <body>
//     <h1>Welcome, <span th:text="${name}">User</span>!</h1>
//     <p>Your account has been created successfully.</p>
//     <a th:href="${activationLink}">Activate your account</a>
// </body>
// </html>
```

---

# SECTION 8: LOGGING

---

## Chapter 8: Logging Configuration

```yaml
# application.yml
logging:
  level:
    root: INFO
    com.myapp: DEBUG
    org.springframework: INFO
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE # Show query params
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/application.log
    max-size: 10MB
    max-history: 30
```

### Logback Configuration

```xml
<!-- src/main/resources/logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <!-- Console appender -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} %highlight(%-5level) %cyan(%logger{36}) - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- Rolling file appender -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/application.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} %-5level [%thread] %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- JSON format for production (ELK stack) -->
    <appender name="JSON" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.json</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/application.%d{yyyy-MM-dd}.json</fileNamePattern>
            <maxHistory>7</maxHistory>
        </rollingPolicy>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
    </appender>

    <!-- Profile-specific configuration -->
    <springProfile name="dev">
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <springProfile name="prod">
        <root level="INFO">
            <appender-ref ref="FILE"/>
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

### Structured Logging with MDC

```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
            throws ServletException, IOException {

        // Add context to all logs in this request
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        String userId = request.getHeader("X-User-Id");

        MDC.put("requestId", requestId);
        MDC.put("userId", userId != null ? userId : "anonymous");
        MDC.put("path", request.getRequestURI());

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();  // Important: clear after request
        }
    }
}

// Logback pattern to include MDC
// %d{yyyy-MM-dd HH:mm:ss} [%X{requestId}] [%X{userId}] %-5level %logger{36} - %msg%n
```

---

# SECTION 9: DATABASE MIGRATIONS

---

## Chapter 9: Flyway

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId> <!-- or flyway-database-postgresql -->
</dependency>
```

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    validate-on-migrate: true
```

### Migration Files

```sql
-- src/main/resources/db/migration/V1__Create_users_table.sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);


-- src/main/resources/db/migration/V2__Add_role_to_users.sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';


-- src/main/resources/db/migration/V3__Create_orders_table.sql
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Flyway Naming Convention

```
V<version>__<description>.sql

Examples:
V1__Create_users_table.sql
V2__Add_role_column.sql
V3__Create_orders_table.sql
V1.1__Add_index.sql  (Versioned: runs once)
R__Insert_reference_data.sql  (Repeatable: runs when checksum changes)
```

---

# SECTION 10: DOCKER DEPLOYMENT

---

## Chapter 10: Dockerizing Spring Boot

```dockerfile
# Dockerfile - Multi-stage build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/mydb
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=secret
      - SPRING_REDIS_HOST=redis
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: mydb
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mysql-data:
  redis-data:
```

### Building and Running

```bash
# Build image
docker build -t myapp:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

# SECTION 11: ENVIRONMENT CONFIGURATION

---

## Chapter 11: Externalized Configuration

```yaml
# application.yml - Common settings
spring:
  application:
    name: my-application
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

---
# application-dev.yml
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:h2:mem:devdb
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true

logging:
  level:
    com.myapp: DEBUG

---
# application-prod.yml
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

logging:
  level:
    root: WARN
    com.myapp: INFO
```

### Configuration Properties Class

```java
@Configuration
@ConfigurationProperties(prefix = "app")
@Validated
@Getter @Setter
public class AppProperties {

    @NotBlank
    private String name;

    @Valid
    private Security security = new Security();

    @Valid
    private Cache cache = new Cache();

    @Getter @Setter
    public static class Security {
        @NotBlank
        private String jwtSecret;

        @Positive
        private long jwtExpirationMs = 86400000;  // 1 day default
    }

    @Getter @Setter
    public static class Cache {
        @Positive
        private int ttlMinutes = 60;

        @Positive
        private int maxSize = 1000;
    }
}

// application.yml
// app:
//   name: My Application
//   security:
//     jwt-secret: ${JWT_SECRET:default-dev-secret}
//     jwt-expiration-ms: 86400000
//   cache:
//     ttl-minutes: 30
//     max-size: 500


// Usage
@Service
@RequiredArgsConstructor
public class JwtService {
    private final AppProperties appProperties;

    public String generateToken(User user) {
        return Jwts.builder()
            .setSubject(user.getEmail())
            .setExpiration(new Date(System.currentTimeMillis() +
                appProperties.getSecurity().getJwtExpirationMs()))
            .signWith(Keys.hmacShaKeyFor(
                appProperties.getSecurity().getJwtSecret().getBytes()))
            .compact();
    }
}
```

---

# SECTION 12: MESSAGING BASICS

---

## Chapter 12: Kafka & RabbitMQ

### Kafka Producer/Consumer

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: my-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "*"
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

```java
// Kafka Producer
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendOrderCreated(OrderCreatedEvent event) {
        kafkaTemplate.send("order-events", event.getOrderId(), event)
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Order event sent: {}", event.getOrderId());
                } else {
                    log.error("Failed to send order event", ex);
                }
            });
    }
}

// Kafka Consumer
@Service
@Slf4j
public class OrderEventConsumer {

    @KafkaListener(topics = "order-events", groupId = "notification-service")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Received order event: {}", event.getOrderId());
        // Send notification, update analytics, etc.
    }

    @KafkaListener(
        topics = "order-events",
        groupId = "inventory-service",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleInventoryUpdate(
            @Payload OrderCreatedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Inventory update: {} from partition {} offset {}",
                 event.getOrderId(), partition, offset);
    }
}
```

### RabbitMQ

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

```java
@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue orderQueue() {
        return new Queue("order-queue", true);  // durable
    }

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange("order-exchange");
    }

    @Bean
    public Binding orderBinding(Queue orderQueue, TopicExchange orderExchange) {
        return BindingBuilder
            .bind(orderQueue)
            .to(orderExchange)
            .with("order.#");  // Routing key pattern
    }
}

@Service
@RequiredArgsConstructor
public class RabbitProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendOrder(OrderEvent event) {
        rabbitTemplate.convertAndSend(
            "order-exchange",
            "order.created",
            event
        );
    }
}

@Service
@Slf4j
public class RabbitConsumer {

    @RabbitListener(queues = "order-queue")
    public void handleOrder(OrderEvent event) {
        log.info("Received via RabbitMQ: {}", event);
    }
}
```

---

# QUICK REFERENCE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              PART 14 QUICK REFERENCE                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CACHING:                                                                        │
│  @Cacheable - Read from cache                                                   │
│  @CacheEvict - Remove from cache                                                │
│  @CachePut - Always update cache                                                │
│                                                                                  │
│  ASYNC:                                                                          │
│  @EnableAsync + @Async                                                          │
│  Return CompletableFuture<T> for result                                        │
│                                                                                  │
│  SCHEDULING:                                                                     │
│  @EnableScheduling + @Scheduled                                                 │
│  fixedRate, fixedDelay, cron                                                   │
│                                                                                  │
│  ACTUATOR ENDPOINTS:                                                             │
│  /actuator/health - Health check                                               │
│  /actuator/metrics - JVM metrics                                               │
│  /actuator/info - App info                                                     │
│                                                                                  │
│  SWAGGER:                                                                        │
│  @Tag, @Operation, @ApiResponse, @Schema                                       │
│  URL: /swagger-ui.html                                                         │
│                                                                                  │
│  FILES:                                                                          │
│  @RequestParam("file") MultipartFile file                                      │
│                                                                                  │
│  EMAIL:                                                                          │
│  JavaMailSender, SimpleMailMessage, MimeMessage                                │
│                                                                                  │
│  FLYWAY:                                                                         │
│  V<version>__<description>.sql in db/migration/                                │
│                                                                                  │
│  DOCKER:                                                                         │
│  Multi-stage build, docker-compose                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

_This completes the essential missing topics in Spring Boot!_
