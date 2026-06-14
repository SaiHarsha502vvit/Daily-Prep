# Spring Boot Part 20: Microservices Patterns

## Service Discovery, API Gateway, Circuit Breakers, and More

> **"Microservices are about doing one thing well, and integrating elegantly"** - Distributed systems done right

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Microservices?                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Scale independently: Scale only the service that needs it                   │
│  • Team autonomy: Different teams own different services                       │
│  • Technology freedom: Each service can use best-fit technology               │
│  • Fault isolation: One service failure doesn't crash everything              │
│  • Faster deployment: Deploy one service without touching others              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How Do Microservices Communicate?                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Service Discovery: Eureka/Consul finds service locations dynamically       │
│  • API Gateway: Single entry, routing, auth, rate limiting (Spring Cloud)    │
│  • Circuit Breaker: Resilience4j prevents cascade failures                    │
│  • Event-Driven: Kafka/RabbitMQ for async communication                       │
│  • Config Server: Centralized configuration management                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Microservices?                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  USE MICROSERVICES:                                                             │
│  • Large teams (5+ developers per team)                                        │
│  • Independent scaling needs                                                   │
│  • Complex domain with clear boundaries                                        │
│                                                                                  │
│  STICK WITH MONOLITH:                                                           │
│  • Small team, MVP, unclear domain boundaries                                  │
│  • Simple CRUD apps, limited scaling needs                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Patterns to Master?                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     API Gateway, Service Discovery, Circuit Breaker                │
│  IMPORTANT:     Config Server, Load Balancing, Saga Pattern                    │
│  ADVANCED:      CQRS, Event Sourcing, Service Mesh                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Table of Contents

1. [Microservices Architecture Overview](#microservices-architecture-overview)
2. [Service Discovery](#service-discovery)
3. [API Gateway Pattern](#api-gateway-pattern)
4. [Circuit Breaker Pattern](#circuit-breaker-pattern)
5. [Load Balancing](#load-balancing)
6. [Configuration Management](#configuration-management)
7. [Saga Pattern](#saga-pattern)
8. [Event-Driven Architecture](#event-driven-architecture)
9. [CQRS Pattern](#cqrs-pattern)
10. [Service Mesh](#service-mesh)
11. [Security Patterns](#security-patterns)
12. [Observability Patterns](#observability-patterns)
13. [Deployment Patterns](#deployment-patterns)
14. [Best Practices](#best-practices)
15. [Interview Questions](#interview-questions)

---

## Microservices Architecture Overview

### Monolith vs Microservices

```
🏢 MONOLITHIC ARCHITECTURE
┌─────────────────────────────────────────────────────────────────┐
│                     Single Application                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  User   │  │  Order  │  │ Payment │  │Inventory│            │
│  │ Service │  │ Service │  │ Service │  │ Service │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       └────────────┴────────────┴────────────┘                  │
│                        │                                        │
│                 ┌──────┴──────┐                                 │
│                 │  Database   │                                 │
│                 └─────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘

🌐 MICROSERVICES ARCHITECTURE
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        Load Balancer / Reverse Proxy                     │   │
│  └───────────────────┬─────────────────────────────────────┘   │
│            ┌─────────┼─────────┬───────────┐                    │
│            ▼         ▼         ▼           ▼                    │
│     ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│     │   User    │ │   Order   │ │  Payment  │ │ Inventory │    │
│     │  Service  │ │  Service  │ │  Service  │ │  Service  │    │
│     └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘    │
│           │             │             │             │           │
│     ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐    │
│     │  User DB  │ │ Order DB  │ │Payment DB │ │Inventory  │    │
│     │ (Postgres)│ │  (Mongo)  │ │ (Postgres)│ │   DB      │    │
│     └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

| Principle             | Description                           | Example                           |
| --------------------- | ------------------------------------- | --------------------------------- |
| Single Responsibility | One service = one business capability | Order Service only handles orders |
| Decentralized Data    | Each service owns its data            | Order DB separate from User DB    |
| Design for Failure    | Expect and handle failures            | Circuit breakers, retries         |
| Loose Coupling        | Minimize dependencies                 | Event-driven communication        |
| High Cohesion         | Related functions together            | All order logic in Order Service  |

### Spring Cloud Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPRING CLOUD ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │ Service       │    │ API Gateway   │    │ Config Server │       │
│  │ Discovery     │    │               │    │               │       │
│  │ (Eureka)      │    │ (Gateway)     │    │ (Config)      │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │ Circuit       │    │ Distributed   │    │ Load          │       │
│  │ Breaker       │    │ Tracing       │    │ Balancing     │       │
│  │ (Resilience4j)│    │ (Sleuth)      │    │ (LoadBalancer)│       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │ Message       │    │ Security      │    │ Monitoring    │       │
│  │ Broker        │    │               │    │               │       │
│  │ (Stream)      │    │ (Security)    │    │ (Actuator)    │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Service Discovery

### Why Service Discovery?

```
Without Service Discovery:
┌─────────────────────────────────────────────────────────────────┐
│  Service A needs to call Service B                              │
│  ❌ Hard-coded URLs: http://192.168.1.100:8080                  │
│  ❌ What if Service B moves?                                    │
│  ❌ What if we scale to multiple instances?                     │
└─────────────────────────────────────────────────────────────────┘

With Service Discovery:
┌─────────────────────────────────────────────────────────────────┐
│  Service A calls "order-service" (logical name)                 │
│  ✅ Service Registry resolves to healthy instance               │
│  ✅ Automatic failover to other instances                       │
│  ✅ Dynamic scaling without config changes                      │
└─────────────────────────────────────────────────────────────────┘
```

### Eureka Server Setup

```xml
<!-- pom.xml for Eureka Server -->
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2023.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

```java
// Eureka Server Application
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

```yaml
# application.yml for Eureka Server
server:
  port: 8761

eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: false # Server doesn't register itself
    fetch-registry: false # Server doesn't fetch registry
  server:
    enable-self-preservation: true
    eviction-interval-timer-in-ms: 5000
```

### Eureka Client Setup

```xml
<!-- pom.xml for Eureka Client -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

```java
// Any microservice becomes a Eureka Client
@SpringBootApplication
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

```yaml
# application.yml for Order Service (Eureka Client)
spring:
  application:
    name: order-service # This name is used for service discovery

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
    registry-fetch-interval-seconds: 5
  instance:
    instance-id: ${spring.application.name}:${random.uuid}
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 30
```

### Service-to-Service Communication with Discovery

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final DiscoveryClient discoveryClient;
    private final RestTemplate restTemplate;

    // Method 1: Manual Discovery
    public User getUserManually(Long userId) {
        List<ServiceInstance> instances = discoveryClient
            .getInstances("user-service");

        if (instances.isEmpty()) {
            throw new ServiceUnavailableException("user-service not available");
        }

        ServiceInstance instance = instances.get(0); // Simple selection
        String url = instance.getUri() + "/api/users/" + userId;

        return restTemplate.getForObject(url, User.class);
    }

    // Method 2: Using @LoadBalanced RestTemplate (Recommended)
    public User getUserWithLoadBalancer(Long userId) {
        // Uses logical service name - load balancer resolves it
        return restTemplate.getForObject(
            "http://user-service/api/users/" + userId,
            User.class
        );
    }
}

@Configuration
public class RestTemplateConfig {

    @Bean
    @LoadBalanced  // Enables service discovery and load balancing
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

### Using WebClient with Discovery

```java
@Configuration
public class WebClientConfig {

    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}

@Service
@RequiredArgsConstructor
public class OrderServiceReactive {

    private final WebClient.Builder webClientBuilder;

    public Mono<User> getUser(Long userId) {
        return webClientBuilder.build()
            .get()
            .uri("http://user-service/api/users/{id}", userId)
            .retrieve()
            .bodyToMono(User.class);
    }
}
```

### Using OpenFeign (Declarative REST Client)

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

```java
// Enable Feign in main application
@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

// Feign Client Interface
@FeignClient(name = "user-service", fallback = UserClientFallback.class)
public interface UserClient {

    @GetMapping("/api/users/{id}")
    User getUser(@PathVariable("id") Long id);

    @GetMapping("/api/users")
    List<User> getAllUsers();

    @PostMapping("/api/users")
    User createUser(@RequestBody CreateUserRequest request);

    @GetMapping("/api/users/search")
    List<User> searchUsers(@RequestParam("query") String query,
                          @RequestParam("page") int page);
}

// Fallback implementation for resilience
@Component
public class UserClientFallback implements UserClient {

    @Override
    public User getUser(Long id) {
        return User.builder()
            .id(id)
            .name("Unknown (Service Unavailable)")
            .build();
    }

    @Override
    public List<User> getAllUsers() {
        return Collections.emptyList();
    }

    @Override
    public User createUser(CreateUserRequest request) {
        throw new ServiceUnavailableException("Cannot create user - service down");
    }

    @Override
    public List<User> searchUsers(String query, int page) {
        return Collections.emptyList();
    }
}

// Using the Feign client
@Service
@RequiredArgsConstructor
public class OrderService {

    private final UserClient userClient;

    public Order createOrder(OrderRequest request) {
        // Feign handles service discovery, load balancing, and serialization
        User user = userClient.getUser(request.getUserId());

        return Order.builder()
            .user(user)
            .items(request.getItems())
            .build();
    }
}
```

### Consul as Alternative

```yaml
# application.yml for Consul
spring:
  cloud:
    consul:
      host: localhost
      port: 8500
      discovery:
        service-name: ${spring.application.name}
        instance-id: ${spring.application.name}:${random.uuid}
        health-check-interval: 10s
```

---

## API Gateway Pattern

### Why API Gateway?

```
Without API Gateway:
┌─────────────────────────────────────────────────────────────────┐
│  Client → User Service (port 8081)                              │
│  Client → Order Service (port 8082)                             │
│  Client → Payment Service (port 8083)                           │
│  ❌ Client needs to know all service locations                  │
│  ❌ Cross-cutting concerns duplicated                           │
│  ❌ Protocol translation complex                                │
└─────────────────────────────────────────────────────────────────┘

With API Gateway:
┌─────────────────────────────────────────────────────────────────┐
│  Client → API Gateway (port 8080)                               │
│  Gateway → User/Order/Payment Services                          │
│  ✅ Single entry point                                          │
│  ✅ Centralized auth, rate limiting, logging                    │
│  ✅ Request routing and aggregation                             │
└─────────────────────────────────────────────────────────────────┘
```

### Spring Cloud Gateway Setup

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

```java
@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

### Gateway Configuration (YAML)

```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true # Auto-discover routes from Eureka
          lower-case-service-id: true

      routes:
        # User Service Routes
        - id: user-service
          uri: lb://user-service # lb:// enables load balancing
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1
            - AddRequestHeader=X-Gateway-Source, API-Gateway

        # Order Service Routes
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
            - name: CircuitBreaker
              args:
                name: orderCircuitBreaker
                fallbackUri: forward:/fallback/orders

        # Payment Service Routes (with rate limiting)
        - id: payment-service
          uri: lb://payment-service
          predicates:
            - Path=/api/payments/**
            - Method=POST
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
                redis-rate-limiter.requestedTokens: 1

        # Route with retry
        - id: inventory-service
          uri: lb://inventory-service
          predicates:
            - Path=/api/inventory/**
          filters:
            - name: Retry
              args:
                retries: 3
                statuses: BAD_GATEWAY,GATEWAY_TIMEOUT
                methods: GET
                backoff:
                  firstBackoff: 100ms
                  maxBackoff: 500ms
                  factor: 2

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### Gateway Configuration (Java)

```java
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            // User service route
            .route("user-service", r -> r
                .path("/api/users/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway", "true")
                    .circuitBreaker(config -> config
                        .setName("userCircuitBreaker")
                        .setFallbackUri("forward:/fallback/users"))
                )
                .uri("lb://user-service"))

            // Order service with custom filter
            .route("order-service", r -> r
                .path("/api/orders/**")
                .and()
                .method(HttpMethod.GET, HttpMethod.POST)
                .filters(f -> f
                    .stripPrefix(1)
                    .filter(new LoggingGatewayFilterFactory().apply(new Object()))
                    .retry(config -> config
                        .setRetries(3)
                        .setStatuses(HttpStatus.BAD_GATEWAY)))
                .uri("lb://order-service"))

            // Path rewriting
            .route("legacy-service", r -> r
                .path("/old-api/**")
                .filters(f -> f
                    .rewritePath("/old-api/(?<segment>.*)", "/api/${segment}"))
                .uri("lb://new-service"))

            .build();
    }
}
```

### Custom Gateway Filters

```java
// Global Filter - applies to all routes
@Component
@Slf4j
public class LoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();

        ServerHttpRequest request = exchange.getRequest().mutate()
            .header("X-Request-ID", requestId)
            .build();

        log.info("Request: {} {} [{}]",
            request.getMethod(),
            request.getPath(),
            requestId);

        return chain.filter(exchange.mutate().request(request).build())
            .then(Mono.fromRunnable(() -> {
                long duration = System.currentTimeMillis() - startTime;
                log.info("Response: {} - {} ms [{}]",
                    exchange.getResponse().getStatusCode(),
                    duration,
                    requestId);
            }));
    }

    @Override
    public int getOrder() {
        return -1; // High priority
    }
}

// Authentication Filter
@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtTokenProvider tokenProvider;

    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/public"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().toString();

        // Skip authentication for public paths
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, "Missing or invalid Authorization header",
                HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        try {
            if (!tokenProvider.validateToken(token)) {
                return onError(exchange, "Invalid token", HttpStatus.UNAUTHORIZED);
            }

            // Add user info to headers for downstream services
            String userId = tokenProvider.getUserId(token);
            String roles = tokenProvider.getRoles(token);

            ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-User-ID", userId)
                .header("X-User-Roles", roles)
                .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());

        } catch (Exception e) {
            return onError(exchange, "Token validation failed", HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message,
                               HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = String.format("{\"error\": \"%s\"}", message);
        DataBuffer buffer = response.bufferFactory()
            .wrap(body.getBytes(StandardCharsets.UTF_8));

        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -2; // Before logging filter
    }
}

// Rate Limiting Filter Factory
@Component
public class CustomRateLimiterFilterFactory extends
        AbstractGatewayFilterFactory<CustomRateLimiterFilterFactory.Config> {

    private final RateLimiter rateLimiter;

    public CustomRateLimiterFilterFactory(RateLimiter rateLimiter) {
        super(Config.class);
        this.rateLimiter = rateLimiter;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String clientIp = Objects.requireNonNull(
                exchange.getRequest().getRemoteAddress()).getHostString();

            if (!rateLimiter.tryAcquire(clientIp, config.getRequestsPerSecond())) {
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                return exchange.getResponse().setComplete();
            }

            return chain.filter(exchange);
        };
    }

    @Data
    public static class Config {
        private int requestsPerSecond = 10;
    }
}
```

### Fallback Controller

```java
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> userServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "message", "User service is temporarily unavailable",
                "fallback", true,
                "timestamp", Instant.now()
            ));
    }

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> orderServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "message", "Order service is temporarily unavailable",
                "fallback", true,
                "timestamp", Instant.now()
            ));
    }

    @PostMapping("/payments")
    public ResponseEntity<Map<String, Object>> paymentServiceFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "message", "Payment service is temporarily unavailable. Please retry later.",
                "fallback", true,
                "retryAfter", 30,
                "timestamp", Instant.now()
            ));
    }
}
```

---

## Circuit Breaker Pattern

### Why Circuit Breaker?

```
Without Circuit Breaker:
┌─────────────────────────────────────────────────────────────────┐
│  Service A → Service B (failing)                                │
│  ❌ Requests keep failing                                       │
│  ❌ Threads blocked waiting for timeout                         │
│  ❌ Cascading failures to other services                        │
│  ❌ Resources exhausted                                         │
└─────────────────────────────────────────────────────────────────┘

With Circuit Breaker:
┌─────────────────────────────────────────────────────────────────┐
│  Service A → Circuit Breaker → Service B                        │
│  ✅ Fast fail when service down                                 │
│  ✅ Fallback response immediately                               │
│  ✅ Periodic health checks                                      │
│  ✅ Automatic recovery when service recovers                    │
└─────────────────────────────────────────────────────────────────┘
```

### Circuit Breaker States

```
┌─────────────────────────────────────────────────────────────────┐
│                  CIRCUIT BREAKER STATES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────────────┐                                            │
│   │     CLOSED     │ ←─── Normal operation                      │
│   │  (Requests     │      All requests pass through             │
│   │   pass through)│                                            │
│   └───────┬────────┘                                            │
│           │ Failure threshold exceeded                           │
│           ▼                                                      │
│   ┌────────────────┐                                            │
│   │      OPEN      │ ←─── Circuit tripped                        │
│   │  (Requests     │      All requests fail fast                │
│   │   fail fast)   │      Fallback returned                     │
│   └───────┬────────┘                                            │
│           │ Wait duration elapsed                                │
│           ▼                                                      │
│   ┌────────────────┐                                            │
│   │   HALF-OPEN    │ ←─── Testing phase                         │
│   │  (Limited      │      Limited requests allowed              │
│   │   requests)    │                                            │
│   └───────┬────────┘                                            │
│           │                                                      │
│     Success  │  Failure                                          │
│        │     │     │                                             │
│        ▼     │     ▼                                             │
│    CLOSED    │   OPEN                                            │
│              │                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Resilience4j Setup

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

### Circuit Breaker Configuration

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      userService:
        register-health-indicator: true
        sliding-window-type: COUNT_BASED
        sliding-window-size: 10
        minimum-number-of-calls: 5
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
        automatic-transition-from-open-to-half-open-enabled: true
        record-exceptions:
          - java.io.IOException
          - java.net.ConnectException
          - feign.FeignException
        ignore-exceptions:
          - com.example.BusinessException

      paymentService:
        sliding-window-type: TIME_BASED
        sliding-window-size: 60 # 60 seconds
        minimum-number-of-calls: 10
        failure-rate-threshold: 60
        slow-call-rate-threshold: 80
        slow-call-duration-threshold: 2s
        wait-duration-in-open-state: 60s
        permitted-number-of-calls-in-half-open-state: 5

  retry:
    instances:
      userService:
        max-attempts: 3
        wait-duration: 500ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        retry-exceptions:
          - java.io.IOException
          - java.net.SocketTimeoutException
        ignore-exceptions:
          - com.example.BusinessException

  ratelimiter:
    instances:
      paymentService:
        limit-for-period: 10
        limit-refresh-period: 1s
        timeout-duration: 100ms

  bulkhead:
    instances:
      orderService:
        max-concurrent-calls: 10
        max-wait-duration: 100ms

  timelimiter:
    instances:
      userService:
        timeout-duration: 3s
        cancel-running-future: true
```

### Using Circuit Breaker in Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final UserClient userClient;
    private final PaymentClient paymentClient;
    private final InventoryClient inventoryClient;

    // Using annotations
    @CircuitBreaker(name = "userService", fallbackMethod = "getUserFallback")
    @Retry(name = "userService")
    @RateLimiter(name = "userService")
    public User getUser(Long userId) {
        log.info("Calling user service for user: {}", userId);
        return userClient.getUser(userId);
    }

    private User getUserFallback(Long userId, Exception e) {
        log.warn("Fallback triggered for user {} due to: {}", userId, e.getMessage());
        return User.builder()
            .id(userId)
            .name("Unknown User (Service Unavailable)")
            .build();
    }

    // Circuit breaker with bulkhead
    @CircuitBreaker(name = "paymentService", fallbackMethod = "processPaymentFallback")
    @Bulkhead(name = "paymentService", type = Bulkhead.Type.SEMAPHORE)
    @TimeLimiter(name = "paymentService")
    public CompletableFuture<PaymentResult> processPayment(PaymentRequest request) {
        return CompletableFuture.supplyAsync(() ->
            paymentClient.processPayment(request));
    }

    private CompletableFuture<PaymentResult> processPaymentFallback(
            PaymentRequest request, Exception e) {
        log.error("Payment fallback for request: {}", request, e);
        return CompletableFuture.completedFuture(
            PaymentResult.builder()
                .success(false)
                .message("Payment service temporarily unavailable")
                .build()
        );
    }

    // Multiple patterns combined
    @CircuitBreaker(name = "orderService", fallbackMethod = "createOrderFallback")
    @Retry(name = "orderService", fallbackMethod = "createOrderRetryFallback")
    @Bulkhead(name = "orderService")
    public Order createOrder(OrderRequest request) {
        User user = getUser(request.getUserId());

        if (!inventoryClient.checkAvailability(request.getItems())) {
            throw new InsufficientInventoryException("Items not available");
        }

        Order order = Order.builder()
            .user(user)
            .items(request.getItems())
            .status(OrderStatus.PENDING)
            .build();

        // Process payment
        PaymentResult payment = paymentClient.processPayment(
            new PaymentRequest(order.getId(), order.getTotalAmount())
        );

        if (payment.isSuccess()) {
            order.setStatus(OrderStatus.CONFIRMED);
        }

        return order;
    }

    private Order createOrderFallback(OrderRequest request, Exception e) {
        log.error("Order creation failed", e);
        return Order.builder()
            .status(OrderStatus.FAILED)
            .errorMessage("Unable to process order at this time")
            .build();
    }
}
```

### Programmatic Circuit Breaker

```java
@Service
@RequiredArgsConstructor
public class ProgrammaticCircuitBreakerExample {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final RetryRegistry retryRegistry;
    private final BulkheadRegistry bulkheadRegistry;
    private final UserClient userClient;

    public User getUserWithProgrammaticCircuitBreaker(Long userId) {
        CircuitBreaker circuitBreaker = circuitBreakerRegistry
            .circuitBreaker("programmaticUserService");

        Retry retry = retryRegistry.retry("programmaticUserService");
        Bulkhead bulkhead = bulkheadRegistry.bulkhead("programmaticUserService");

        Supplier<User> decoratedSupplier = Decorators
            .ofSupplier(() -> userClient.getUser(userId))
            .withCircuitBreaker(circuitBreaker)
            .withRetry(retry)
            .withBulkhead(bulkhead)
            .withFallback(List.of(
                CallNotPermittedException.class,
                Exception.class
            ), e -> getFallbackUser(userId))
            .decorate();

        return decoratedSupplier.get();
    }

    private User getFallbackUser(Long userId) {
        return User.builder()
            .id(userId)
            .name("Fallback User")
            .build();
    }

    // Monitoring circuit breaker state
    public Map<String, Object> getCircuitBreakerStatus(String name) {
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(name);
        CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();

        return Map.of(
            "state", circuitBreaker.getState().name(),
            "failureRate", metrics.getFailureRate(),
            "slowCallRate", metrics.getSlowCallRate(),
            "numberOfBufferedCalls", metrics.getNumberOfBufferedCalls(),
            "numberOfFailedCalls", metrics.getNumberOfFailedCalls(),
            "numberOfSuccessfulCalls", metrics.getNumberOfSuccessfulCalls(),
            "numberOfSlowCalls", metrics.getNumberOfSlowCalls()
        );
    }
}
```

### Circuit Breaker Events

```java
@Component
@Slf4j
public class CircuitBreakerEventListener {

    public CircuitBreakerEventListener(CircuitBreakerRegistry registry) {
        registry.getAllCircuitBreakers().forEach(this::registerEventListeners);
        registry.getEventPublisher()
            .onEntryAdded(event -> registerEventListeners(event.getAddedEntry()));
    }

    private void registerEventListeners(CircuitBreaker circuitBreaker) {
        circuitBreaker.getEventPublisher()
            .onStateTransition(event -> {
                log.info("Circuit breaker '{}' state changed: {} → {}",
                    circuitBreaker.getName(),
                    event.getStateTransition().getFromState(),
                    event.getStateTransition().getToState());

                // Send alert on state changes
                if (event.getStateTransition().getToState() == CircuitBreaker.State.OPEN) {
                    sendAlert(circuitBreaker.getName(), "Circuit OPENED");
                }
            })
            .onSuccess(event -> {
                log.debug("Circuit breaker '{}' call succeeded in {} ms",
                    circuitBreaker.getName(),
                    event.getElapsedDuration().toMillis());
            })
            .onError(event -> {
                log.warn("Circuit breaker '{}' call failed: {}",
                    circuitBreaker.getName(),
                    event.getThrowable().getMessage());
            })
            .onCallNotPermitted(event -> {
                log.warn("Circuit breaker '{}' rejected call - circuit is OPEN",
                    circuitBreaker.getName());
            });
    }

    private void sendAlert(String circuitBreakerName, String message) {
        // Send to monitoring system (e.g., Slack, PagerDuty)
        log.error("ALERT: {} - {}", circuitBreakerName, message);
    }
}
```

---

## Load Balancing

### Client-Side Load Balancing

```java
@Configuration
public class LoadBalancerConfig {

    @Bean
    @LoadBalanced
    public RestTemplate loadBalancedRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}
```

### Custom Load Balancer Configuration

```java
@Configuration
public class CustomLoadBalancerConfig {

    @Bean
    public ServiceInstanceListSupplier serviceInstanceListSupplier(
            ConfigurableApplicationContext context) {
        return ServiceInstanceListSupplier.builder()
            .withDiscoveryClient()
            .withHealthChecks()
            .withCaching()
            .withZonePreference()
            .build(context);
    }
}

// Custom load balancer for specific service
@LoadBalancerClient(
    name = "user-service",
    configuration = UserServiceLoadBalancerConfig.class
)
public class LoadBalancerClients {
}

@Configuration
public class UserServiceLoadBalancerConfig {

    @Bean
    public ReactorLoadBalancer<ServiceInstance> roundRobinLoadBalancer(
            Environment environment,
            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new RoundRobinLoadBalancer(
            loadBalancerClientFactory.getLazyProvider(name, ServiceInstanceListSupplier.class),
            name
        );
    }
}
```

### Load Balancing Strategies

```
┌─────────────────────────────────────────────────────────────────┐
│                  LOAD BALANCING STRATEGIES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Round Robin          │ Equal distribution, sequential          │
│  Instance 1 → 2 → 3 → 1 → 2 → 3...                              │
│                                                                  │
│  Random               │ Random instance selection                │
│  Good for stateless services                                    │
│                                                                  │
│  Weighted             │ Based on capacity/health                 │
│  Instance 1 (w=3) gets 3x traffic of Instance 2 (w=1)          │
│                                                                  │
│  Zone Aware           │ Prefer same availability zone            │
│  Reduces latency, contains failures                             │
│                                                                  │
│  Health-Based         │ Only route to healthy instances          │
│  Respects health indicators                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Management

### Spring Cloud Config Server

```xml
<!-- Config Server dependencies -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-server</artifactId>
</dependency>
```

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

```yaml
# Config Server application.yml
server:
  port: 8888

spring:
  application:
    name: config-server
  cloud:
    config:
      server:
        git:
          uri: https://github.com/company/config-repo
          default-label: main
          search-paths: "{application}"
          clone-on-start: true
          force-pull: true
        encrypt:
          enabled: true

encrypt:
  key: ${ENCRYPT_KEY}
```

### Config Client Setup

```yaml
# bootstrap.yml for config client
spring:
  application:
    name: order-service
  cloud:
    config:
      uri: http://localhost:8888
      fail-fast: true
      retry:
        initial-interval: 1000
        max-attempts: 6
        max-interval: 2000
        multiplier: 1.1
```

### Configuration Repository Structure

```
config-repo/
├── application.yml              # Common configuration for all services
├── application-dev.yml          # Common dev configuration
├── application-prod.yml         # Common prod configuration
├── order-service/
│   ├── order-service.yml        # Order service specific
│   ├── order-service-dev.yml
│   └── order-service-prod.yml
├── user-service/
│   ├── user-service.yml
│   └── user-service-prod.yml
└── payment-service/
    └── payment-service.yml
```

### Dynamic Configuration Refresh

```java
@RestController
@RefreshScope  // Enables dynamic refresh
@RequiredArgsConstructor
public class ConfigController {

    @Value("${app.feature.enabled:false}")
    private boolean featureEnabled;

    @Value("${app.rate.limit:100}")
    private int rateLimit;

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        return Map.of(
            "featureEnabled", featureEnabled,
            "rateLimit", rateLimit
        );
    }
}

// Trigger refresh via POST /actuator/refresh
// Or use Spring Cloud Bus for broadcast refresh to all instances
```

### Configuration Encryption

```bash
# Encrypt sensitive values
curl -X POST http://localhost:8888/encrypt -d "mySecret"
# Returns: AQA2jxK...encrypted...

# Use in configuration
spring:
  datasource:
    password: '{cipher}AQA2jxK...encrypted...'
```

---

## Saga Pattern

### Why Saga?

```
Problem with Distributed Transactions:
┌─────────────────────────────────────────────────────────────────┐
│  Order Service → Payment Service → Inventory Service            │
│  ❌ 2PC (Two-Phase Commit) doesn't work across services         │
│  ❌ Long-running transactions lock resources                    │
│  ❌ Single service failure blocks entire transaction            │
└─────────────────────────────────────────────────────────────────┘

Saga Solution:
┌─────────────────────────────────────────────────────────────────┐
│  Local transactions with compensating actions                   │
│  Each step can be rolled back independently                     │
│  ✅ Eventually consistent                                       │
│  ✅ No distributed locks                                        │
│  ✅ Better scalability                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Saga Patterns

```
CHOREOGRAPHY-BASED SAGA:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Order     ──event──▶    Payment    ──event──▶   Inventory     │
│   Service              Service               Service             │
│      │                      │                      │             │
│      └──────────────────────┴──────────────────────┘             │
│                   Event Bus (Kafka)                              │
│  ✅ Loose coupling                                               │
│  ❌ Hard to track overall progress                               │
└─────────────────────────────────────────────────────────────────┘

ORCHESTRATION-BASED SAGA:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │  Saga           │                          │
│                    │  Orchestrator   │                          │
│                    └────────┬────────┘                          │
│              ┌──────────────┼──────────────┐                    │
│              ▼              ▼              ▼                    │
│         Order           Payment       Inventory                 │
│         Service         Service       Service                   │
│  ✅ Clear flow visibility                                       │
│  ✅ Easier error handling                                       │
│  ❌ Orchestrator becomes single point                           │
└─────────────────────────────────────────────────────────────────┘
```

### Orchestration-Based Saga Implementation

```java
// Saga Orchestrator
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderSagaOrchestrator {

    private final OrderService orderService;
    private final PaymentClient paymentClient;
    private final InventoryClient inventoryClient;
    private final NotificationClient notificationClient;

    @Transactional
    public OrderResult executeOrderSaga(OrderRequest request) {
        SagaContext context = new SagaContext();

        try {
            // Step 1: Create Order
            Order order = createOrder(request, context);

            // Step 2: Reserve Inventory
            reserveInventory(order, context);

            // Step 3: Process Payment
            processPayment(order, context);

            // Step 4: Confirm Order
            confirmOrder(order);

            // Step 5: Send Notification
            sendNotification(order);

            log.info("Saga completed successfully for order: {}", order.getId());
            return OrderResult.success(order);

        } catch (Exception e) {
            log.error("Saga failed, initiating compensation", e);
            compensate(context);
            return OrderResult.failure(e.getMessage());
        }
    }

    private Order createOrder(OrderRequest request, SagaContext context) {
        log.info("Step 1: Creating order");
        Order order = orderService.create(request);
        context.setOrder(order);
        context.addCompensation(() -> orderService.cancel(order.getId()));
        return order;
    }

    private void reserveInventory(Order order, SagaContext context) {
        log.info("Step 2: Reserving inventory for order: {}", order.getId());
        InventoryReservation reservation = inventoryClient.reserve(
            new ReservationRequest(order.getId(), order.getItems())
        );
        context.setReservation(reservation);
        context.addCompensation(() ->
            inventoryClient.cancelReservation(reservation.getId()));
    }

    private void processPayment(Order order, SagaContext context) {
        log.info("Step 3: Processing payment for order: {}", order.getId());
        PaymentResult payment = paymentClient.process(
            new PaymentRequest(order.getId(), order.getTotalAmount())
        );

        if (!payment.isSuccess()) {
            throw new PaymentFailedException(payment.getMessage());
        }

        context.setPayment(payment);
        context.addCompensation(() ->
            paymentClient.refund(payment.getTransactionId()));
    }

    private void confirmOrder(Order order) {
        log.info("Step 4: Confirming order: {}", order.getId());
        orderService.confirm(order.getId());
    }

    private void sendNotification(Order order) {
        log.info("Step 5: Sending notification for order: {}", order.getId());
        try {
            notificationClient.sendOrderConfirmation(order);
        } catch (Exception e) {
            // Notification failure shouldn't fail the saga
            log.warn("Failed to send notification, will retry later", e);
        }
    }

    private void compensate(SagaContext context) {
        log.info("Starting compensation for failed saga");
        context.executeCompensations();
    }
}

// Saga Context to track state and compensations
@Data
public class SagaContext {
    private Order order;
    private InventoryReservation reservation;
    private PaymentResult payment;
    private final Deque<Runnable> compensations = new ArrayDeque<>();

    public void addCompensation(Runnable compensation) {
        compensations.push(compensation);
    }

    public void executeCompensations() {
        while (!compensations.isEmpty()) {
            try {
                compensations.pop().run();
            } catch (Exception e) {
                // Log but continue with other compensations
                log.error("Compensation failed", e);
            }
        }
    }
}
```

### Choreography-Based Saga with Events

```java
// Order Created Event
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderCreatedEvent {
    private String orderId;
    private String customerId;
    private List<OrderItem> items;
    private BigDecimal totalAmount;
}

// Order Service publishes events
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final StreamBridge streamBridge;

    public Order createOrder(OrderRequest request) {
        Order order = Order.builder()
            .customerId(request.getCustomerId())
            .items(request.getItems())
            .status(OrderStatus.PENDING)
            .build();

        Order savedOrder = orderRepository.save(order);

        // Publish event
        streamBridge.send("order-events-out-0",
            new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getCustomerId(),
                savedOrder.getItems(),
                savedOrder.getTotalAmount()
            )
        );

        return savedOrder;
    }

    @Bean
    public Consumer<PaymentCompletedEvent> handlePaymentCompleted() {
        return event -> {
            log.info("Payment completed for order: {}", event.getOrderId());
            orderRepository.updateStatus(event.getOrderId(), OrderStatus.PAID);

            streamBridge.send("inventory-reserve-out-0",
                new ReserveInventoryCommand(event.getOrderId()));
        };
    }

    @Bean
    public Consumer<PaymentFailedEvent> handlePaymentFailed() {
        return event -> {
            log.warn("Payment failed for order: {}", event.getOrderId());
            orderRepository.updateStatus(event.getOrderId(), OrderStatus.PAYMENT_FAILED);
        };
    }
}

// Payment Service listens and responds
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentGateway paymentGateway;
    private final StreamBridge streamBridge;

    @Bean
    public Consumer<OrderCreatedEvent> handleOrderCreated() {
        return event -> {
            log.info("Processing payment for order: {}", event.getOrderId());

            try {
                PaymentResult result = paymentGateway.process(
                    event.getOrderId(),
                    event.getTotalAmount()
                );

                if (result.isSuccess()) {
                    streamBridge.send("payment-events-out-0",
                        new PaymentCompletedEvent(
                            event.getOrderId(),
                            result.getTransactionId()
                        )
                    );
                } else {
                    streamBridge.send("payment-events-out-0",
                        new PaymentFailedEvent(
                            event.getOrderId(),
                            result.getErrorMessage()
                        )
                    );
                }
            } catch (Exception e) {
                streamBridge.send("payment-events-out-0",
                    new PaymentFailedEvent(event.getOrderId(), e.getMessage())
                );
            }
        };
    }
}
```

---

## Event-Driven Architecture

### Event Types

```
┌─────────────────────────────────────────────────────────────────┐
│                       EVENT TYPES                               │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN EVENTS                                                  │
│  Something that happened in the business domain                 │
│  Examples: OrderPlaced, PaymentReceived, UserRegistered         │
│                                                                  │
│  INTEGRATION EVENTS                                             │
│  Events shared between bounded contexts/services                │
│  Examples: OrderCreatedIntegrationEvent                         │
│                                                                  │
│  EVENT COMMANDS                                                 │
│  Request for action (imperative)                                │
│  Examples: ProcessPayment, ShipOrder                            │
│                                                                  │
│  EVENT QUERIES                                                  │
│  Request for data                                               │
│  Examples: GetOrderStatus                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Spring Cloud Stream with Kafka

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-stream-kafka</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    stream:
      bindings:
        order-events-out-0:
          destination: order-events
          producer:
            partition-key-expression: headers['partitionKey']
        order-events-in-0:
          destination: order-events
          group: order-service-group
        payment-events-in-0:
          destination: payment-events
          group: order-service-group
      kafka:
        binder:
          brokers: localhost:9092
          auto-create-topics: true
          replication-factor: 3
        bindings:
          order-events-out-0:
            producer:
              configuration:
                acks: all
```

```java
// Event Publisher
@Service
@RequiredArgsConstructor
public class EventPublisher {

    private final StreamBridge streamBridge;

    public void publishOrderCreated(Order order) {
        OrderCreatedEvent event = new OrderCreatedEvent(
            order.getId(),
            order.getCustomerId(),
            order.getItems(),
            order.getTotalAmount(),
            Instant.now()
        );

        streamBridge.send("order-events-out-0",
            MessageBuilder.withPayload(event)
                .setHeader("partitionKey", order.getCustomerId())
                .setHeader("eventType", "OrderCreated")
                .build()
        );
    }
}

// Event Consumer
@Configuration
public class EventConsumers {

    @Bean
    public Consumer<Message<OrderCreatedEvent>> orderCreatedConsumer(
            InventoryService inventoryService) {
        return message -> {
            OrderCreatedEvent event = message.getPayload();
            log.info("Received OrderCreatedEvent: {}", event.getOrderId());

            inventoryService.reserveInventory(
                event.getOrderId(),
                event.getItems()
            );
        };
    }

    @Bean
    public Function<OrderCreatedEvent, PaymentRequestEvent> orderToPayment() {
        return order -> new PaymentRequestEvent(
            order.getOrderId(),
            order.getTotalAmount()
        );
    }
}
```

### Event Sourcing

```java
// Event Store
@Entity
@Table(name = "event_store")
@Data
public class StoredEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String aggregateId;
    private String aggregateType;
    private String eventType;

    @Lob
    private String payload;

    private int version;
    private Instant timestamp;
}

@Repository
public interface EventStoreRepository extends JpaRepository<StoredEvent, String> {
    List<StoredEvent> findByAggregateIdOrderByVersionAsc(String aggregateId);
    Optional<StoredEvent> findTopByAggregateIdOrderByVersionDesc(String aggregateId);
}

// Event Store Service
@Service
@RequiredArgsConstructor
public class EventStore {

    private final EventStoreRepository repository;
    private final ObjectMapper objectMapper;

    public void append(String aggregateId, String aggregateType,
                       Object event, int expectedVersion) {
        Optional<StoredEvent> lastEvent = repository
            .findTopByAggregateIdOrderByVersionDesc(aggregateId);

        int currentVersion = lastEvent.map(StoredEvent::getVersion).orElse(0);

        if (currentVersion != expectedVersion) {
            throw new OptimisticLockingException(
                "Expected version " + expectedVersion + " but found " + currentVersion
            );
        }

        StoredEvent storedEvent = new StoredEvent();
        storedEvent.setAggregateId(aggregateId);
        storedEvent.setAggregateType(aggregateType);
        storedEvent.setEventType(event.getClass().getSimpleName());
        storedEvent.setPayload(serialize(event));
        storedEvent.setVersion(currentVersion + 1);
        storedEvent.setTimestamp(Instant.now());

        repository.save(storedEvent);
    }

    public List<Object> getEvents(String aggregateId) {
        return repository.findByAggregateIdOrderByVersionAsc(aggregateId)
            .stream()
            .map(this::deserialize)
            .collect(Collectors.toList());
    }

    private String serialize(Object event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            throw new EventSerializationException(e);
        }
    }

    private Object deserialize(StoredEvent storedEvent) {
        try {
            Class<?> eventClass = Class.forName(
                "com.example.events." + storedEvent.getEventType()
            );
            return objectMapper.readValue(storedEvent.getPayload(), eventClass);
        } catch (Exception e) {
            throw new EventDeserializationException(e);
        }
    }
}

// Order Aggregate using Event Sourcing
@Data
public class OrderAggregate {
    private String id;
    private String customerId;
    private List<OrderItem> items = new ArrayList<>();
    private OrderStatus status;
    private BigDecimal totalAmount;
    private int version;

    // Apply events to rebuild state
    public void apply(Object event) {
        if (event instanceof OrderCreatedEvent e) {
            this.id = e.getOrderId();
            this.customerId = e.getCustomerId();
            this.items = e.getItems();
            this.status = OrderStatus.PENDING;
            this.totalAmount = e.getTotalAmount();
        } else if (event instanceof OrderPaidEvent e) {
            this.status = OrderStatus.PAID;
        } else if (event instanceof OrderShippedEvent e) {
            this.status = OrderStatus.SHIPPED;
        } else if (event instanceof OrderCancelledEvent e) {
            this.status = OrderStatus.CANCELLED;
        }
        this.version++;
    }

    // Rebuild from events
    public static OrderAggregate fromEvents(List<Object> events) {
        OrderAggregate aggregate = new OrderAggregate();
        events.forEach(aggregate::apply);
        return aggregate;
    }
}
```

---

## CQRS Pattern

### CQRS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CQRS PATTERN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌─────────────┐                              │
│                    │   Client    │                              │
│                    └──────┬──────┘                              │
│              Commands     │     Queries                          │
│           ┌───────────────┴───────────────┐                     │
│           ▼                               ▼                     │
│   ┌───────────────┐               ┌───────────────┐             │
│   │   Command     │               │    Query      │             │
│   │   Handler     │               │    Handler    │             │
│   └───────┬───────┘               └───────┬───────┘             │
│           │                               │                     │
│           ▼                               ▼                     │
│   ┌───────────────┐               ┌───────────────┐             │
│   │   Write DB    │ ──events──▶   │   Read DB     │             │
│   │  (PostgreSQL) │               │   (MongoDB)   │             │
│   │  Normalized   │               │   Denormalized│             │
│   └───────────────┘               └───────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### CQRS Implementation

```java
// Commands
public sealed interface OrderCommand {
    record CreateOrder(String customerId, List<OrderItem> items)
        implements OrderCommand {}
    record CancelOrder(String orderId, String reason)
        implements OrderCommand {}
    record UpdateOrderStatus(String orderId, OrderStatus status)
        implements OrderCommand {}
}

// Queries
public sealed interface OrderQuery {
    record GetOrderById(String orderId) implements OrderQuery {}
    record GetOrdersByCustomer(String customerId, int page, int size)
        implements OrderQuery {}
    record SearchOrders(OrderSearchCriteria criteria) implements OrderQuery {}
}

// Command Handler
@Service
@RequiredArgsConstructor
public class OrderCommandHandler {

    private final EventStore eventStore;
    private final ApplicationEventPublisher eventPublisher;

    public String handle(OrderCommand.CreateOrder command) {
        String orderId = UUID.randomUUID().toString();

        OrderCreatedEvent event = new OrderCreatedEvent(
            orderId,
            command.customerId(),
            command.items(),
            calculateTotal(command.items()),
            Instant.now()
        );

        eventStore.append(orderId, "Order", event, 0);
        eventPublisher.publishEvent(event);  // For read model update

        return orderId;
    }

    public void handle(OrderCommand.CancelOrder command) {
        OrderAggregate order = loadAggregate(command.orderId());

        if (order.getStatus() == OrderStatus.SHIPPED) {
            throw new BusinessException("Cannot cancel shipped order");
        }

        OrderCancelledEvent event = new OrderCancelledEvent(
            command.orderId(),
            command.reason(),
            Instant.now()
        );

        eventStore.append(command.orderId(), "Order", event, order.getVersion());
        eventPublisher.publishEvent(event);
    }

    private OrderAggregate loadAggregate(String orderId) {
        List<Object> events = eventStore.getEvents(orderId);
        if (events.isEmpty()) {
            throw new OrderNotFoundException(orderId);
        }
        return OrderAggregate.fromEvents(events);
    }
}

// Query Handler (uses optimized read model)
@Service
@RequiredArgsConstructor
public class OrderQueryHandler {

    private final OrderReadRepository readRepository;

    public OrderView handle(OrderQuery.GetOrderById query) {
        return readRepository.findById(query.orderId())
            .orElseThrow(() -> new OrderNotFoundException(query.orderId()));
    }

    public Page<OrderView> handle(OrderQuery.GetOrdersByCustomer query) {
        return readRepository.findByCustomerId(
            query.customerId(),
            PageRequest.of(query.page(), query.size())
        );
    }

    public Page<OrderView> handle(OrderQuery.SearchOrders query) {
        return readRepository.search(query.criteria());
    }
}

// Read Model (optimized for queries)
@Document(collection = "orders")
@Data
public class OrderView {
    @Id
    private String id;
    private String customerId;
    private String customerName;  // Denormalized
    private List<OrderItemView> items;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    public static class OrderItemView {
        private String productId;
        private String productName;
        private int quantity;
        private BigDecimal price;
        private String imageUrl;  // Denormalized
    }
}

// Read Model Updater (Event Handler)
@Component
@RequiredArgsConstructor
public class OrderReadModelUpdater {

    private final OrderReadRepository readRepository;
    private final UserClient userClient;
    private final ProductClient productClient;

    @EventListener
    public void on(OrderCreatedEvent event) {
        UserDTO user = userClient.getUser(event.getCustomerId());

        List<OrderView.OrderItemView> itemViews = event.getItems().stream()
            .map(item -> {
                ProductDTO product = productClient.getProduct(item.getProductId());
                OrderView.OrderItemView view = new OrderView.OrderItemView();
                view.setProductId(item.getProductId());
                view.setProductName(product.getName());
                view.setQuantity(item.getQuantity());
                view.setPrice(item.getPrice());
                view.setImageUrl(product.getImageUrl());
                return view;
            })
            .collect(Collectors.toList());

        OrderView view = new OrderView();
        view.setId(event.getOrderId());
        view.setCustomerId(event.getCustomerId());
        view.setCustomerName(user.getName());
        view.setItems(itemViews);
        view.setStatus(OrderStatus.PENDING);
        view.setTotalAmount(event.getTotalAmount());
        view.setCreatedAt(event.getTimestamp());
        view.setUpdatedAt(event.getTimestamp());

        readRepository.save(view);
    }

    @EventListener
    public void on(OrderCancelledEvent event) {
        readRepository.updateStatus(event.getOrderId(), OrderStatus.CANCELLED);
    }
}
```

---

## Service Mesh

### Service Mesh Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE MESH                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Traditional:  Service A ──────────────▶ Service B              │
│                                                                  │
│  With Mesh:    ┌─────────┐          ┌─────────┐                 │
│                │Service A│          │Service B│                 │
│                └────┬────┘          └────┬────┘                 │
│                     │                    │                      │
│                ┌────┴────┐          ┌────┴────┐                 │
│                │ Sidecar │──────────│ Sidecar │                 │
│                │ Proxy   │          │ Proxy   │                 │
│                └─────────┘          └─────────┘                 │
│                     │                    │                      │
│                     └────────┬───────────┘                      │
│                          Control Plane                          │
│                   (Configuration, Policies)                     │
│                                                                  │
│  Benefits:                                                       │
│  ✅ Traffic management (routing, load balancing)                │
│  ✅ Security (mTLS, authorization)                              │
│  ✅ Observability (metrics, tracing, logging)                   │
│  ✅ Reliability (retries, circuit breakers)                     │
│                                                                  │
│  Popular: Istio, Linkerd, Consul Connect                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Istio Configuration Example

```yaml
# Virtual Service for traffic routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
    - order-service
  http:
    - match:
        - headers:
            x-user-type:
              exact: premium
      route:
        - destination:
            host: order-service
            subset: v2
          weight: 100
    - route:
        - destination:
            host: order-service
            subset: v1
          weight: 90
        - destination:
            host: order-service
            subset: v2
          weight: 10

---
# Destination Rule for subsets
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

---

## Security Patterns

### OAuth2 / JWT Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                   OAUTH2 FLOW WITH GATEWAY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Client → Auth Server: Login (username/password)             │
│  2. Auth Server → Client: JWT Token                             │
│  3. Client → API Gateway: Request + JWT                         │
│  4. Gateway: Validate JWT, extract claims                       │
│  5. Gateway → Service: Request + User Context headers           │
│  6. Service: Process request                                    │
│                                                                  │
│  ┌────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐      │
│  │ Client │───▶│  Auth    │───▶│ Gateway │───▶│ Service │      │
│  │        │◀───│  Server  │◀───│         │◀───│         │      │
│  └────────┘    └──────────┘    └─────────┘    └─────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Gateway Security Configuration

```java
@Configuration
@EnableWebFluxSecurity
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/api/auth/**").permitAll()
                .pathMatchers("/api/public/**").permitAll()
                .pathMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .pathMatchers("/api/admin/**").hasRole("ADMIN")
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
            )
            .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder(@Value("${jwt.secret}") String secret) {
        return NimbusReactiveJwtDecoder.withSecretKey(
            new SecretKeySpec(secret.getBytes(), "HmacSHA256")
        ).build();
    }

    private Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthConverter() {
        return jwt -> {
            Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
            return Mono.just(
                new JwtAuthenticationToken(jwt, authorities, jwt.getSubject())
            );
        };
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles == null) {
            return Collections.emptyList();
        }
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
            .collect(Collectors.toList());
    }
}
```

---

## Observability Patterns

### The Three Pillars

```
┌─────────────────────────────────────────────────────────────────┐
│              THREE PILLARS OF OBSERVABILITY                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │   METRICS   │   │   LOGGING   │   │   TRACING   │           │
│  │             │   │             │   │             │           │
│  │ What?       │   │ What?       │   │ What?       │           │
│  │ Quantitative│   │ Event data  │   │ Request     │           │
│  │ measurements│   │ & context   │   │ journey     │           │
│  │             │   │             │   │             │           │
│  │ Tools:      │   │ Tools:      │   │ Tools:      │           │
│  │ Prometheus  │   │ ELK Stack   │   │ Jaeger      │           │
│  │ Grafana     │   │ Loki        │   │ Zipkin      │           │
│  │ Micrometer  │   │ Fluentd     │   │ Tempo       │           │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
│                                                                  │
│  Combined: Full visibility into system behavior                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Metrics with Micrometer

```java
@Configuration
public class MetricsConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
            .commonTags("application", "order-service")
            .commonTags("environment", System.getenv("ENV"));
    }
}

@Service
@RequiredArgsConstructor
public class OrderService {

    private final MeterRegistry meterRegistry;
    private final Counter orderCounter;
    private final Timer orderProcessingTimer;

    public OrderService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.orderCounter = Counter.builder("orders.created")
            .description("Number of orders created")
            .register(meterRegistry);
        this.orderProcessingTimer = Timer.builder("orders.processing.time")
            .description("Time to process orders")
            .register(meterRegistry);
    }

    public Order createOrder(OrderRequest request) {
        return orderProcessingTimer.record(() -> {
            Order order = processOrder(request);
            orderCounter.increment();

            // Custom metrics
            meterRegistry.gauge("orders.pending",
                orderRepository.countByStatus(OrderStatus.PENDING));

            return order;
        });
    }
}
```

---

## Deployment Patterns

### Blue-Green Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                   BLUE-GREEN DEPLOYMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Before:                                                         │
│  Load Balancer ──▶ Blue (v1.0) ✅ Active                        │
│                    Green (v1.1) 🔳 Staged                        │
│                                                                  │
│  After:                                                          │
│  Load Balancer ──▶ Blue (v1.0) 🔳 Standby                       │
│                    Green (v1.1) ✅ Active                        │
│                                                                  │
│  ✅ Zero downtime                                               │
│  ✅ Instant rollback                                            │
│  ❌ Needs 2x infrastructure                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Canary Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANARY DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: 5% to new version                                     │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  v1.0: ██████████████████████████████████████ 95%  │        │
│  │  v1.1: ██ 5%                                        │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  Phase 2: 25% to new version (if metrics good)                  │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  v1.0: ████████████████████████████████ 75%        │        │
│  │  v1.1: ████████ 25%                                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  Phase 3: 100% to new version                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  v1.0: 0%                                           │        │
│  │  v1.1: ██████████████████████████████████████ 100% │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  ✅ Gradual rollout                                             │
│  ✅ Real traffic validation                                     │
│  ✅ Quick rollback if issues                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions

### Beginner

**Q1: What is service discovery and why is it needed?**

```
Service discovery allows services to find each other dynamically without
hard-coded URLs. It's needed because:
- Services can scale up/down
- IP addresses change
- Services can move to different hosts
- Enables load balancing across instances
```

**Q2: What is an API Gateway?**

```
API Gateway is a single entry point for all clients that:
- Routes requests to appropriate services
- Handles cross-cutting concerns (auth, logging, rate limiting)
- Aggregates responses from multiple services
- Provides protocol translation
```

**Q3: Explain the Circuit Breaker pattern**

```
Circuit breaker prevents cascading failures:
- CLOSED: Normal operation, requests pass through
- OPEN: Failure threshold exceeded, fail fast
- HALF-OPEN: Test if service recovered

Benefits:
- Fast failure instead of waiting for timeout
- Gives failing service time to recover
- Prevents resource exhaustion
```

### Advanced

**Q4: Compare choreography vs orchestration saga**

```
Choreography:
- Services communicate via events
- Loose coupling
- No central coordinator
- Hard to track progress
- Best for: Simple workflows

Orchestration:
- Central coordinator manages flow
- Clear visibility
- Easier error handling
- Single point of failure
- Best for: Complex workflows
```

**Q5: What is CQRS and when to use it?**

```
Command Query Responsibility Segregation separates read and write operations.

Use when:
- Different read/write patterns
- Need different optimization for queries vs commands
- High read/write ratio
- Complex domain logic

Don't use when:
- Simple CRUD operations
- Small scale application
- Team unfamiliar with pattern
```

**Q6: How do you handle distributed transactions?**

```
Options:
1. Saga Pattern - Compensating transactions
2. Two-Phase Commit (2PC) - Not recommended for microservices
3. Eventual Consistency - Accept temporary inconsistency
4. Outbox Pattern - Reliable event publishing

Best practices:
- Design for idempotency
- Use correlation IDs
- Implement retry with exponential backoff
- Handle partial failures gracefully
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                 MICROSERVICES PATTERNS CHEAT SHEET                  │
├─────────────────────────────────────────────────────────────────────┤
│ COMMUNICATION PATTERNS                                              │
│  Synchronous     │ REST, gRPC, GraphQL                              │
│  Asynchronous    │ Message queues (Kafka, RabbitMQ)                 │
│  Event-driven    │ Events/Event Sourcing                            │
├─────────────────────────────────────────────────────────────────────┤
│ RESILIENCE PATTERNS                                                 │
│  Circuit Breaker │ Fail fast when service down                      │
│  Retry           │ Automatic retry with backoff                     │
│  Bulkhead        │ Isolate failures                                 │
│  Timeout         │ Don't wait forever                               │
│  Rate Limiter    │ Protect from overload                            │
├─────────────────────────────────────────────────────────────────────┤
│ DATA PATTERNS                                                       │
│  Saga            │ Distributed transactions                         │
│  CQRS            │ Separate read/write models                       │
│  Event Sourcing  │ Store events, derive state                       │
│  Outbox          │ Reliable event publishing                        │
├─────────────────────────────────────────────────────────────────────┤
│ DEPLOYMENT PATTERNS                                                 │
│  Blue-Green      │ Zero downtime, instant rollback                  │
│  Canary          │ Gradual rollout                                  │
│  Rolling         │ Sequential instance updates                      │
├─────────────────────────────────────────────────────────────────────┤
│ DISCOVERY & ROUTING                                                 │
│  Service Registry│ Eureka, Consul                                   │
│  API Gateway     │ Spring Cloud Gateway                             │
│  Load Balancer   │ Client-side with discovery                       │
│  Service Mesh    │ Istio, Linkerd                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

Microservices patterns solve distributed system challenges:

1. **Service Discovery** - Dynamic service location
2. **API Gateway** - Single entry point, cross-cutting concerns
3. **Circuit Breaker** - Resilience against failures
4. **Saga** - Distributed transaction management
5. **CQRS** - Optimized read/write separation
6. **Event-Driven** - Loose coupling through events

> **Remember**: "Start with a monolith, break into microservices when you understand the domain boundaries" - Martin Fowler

---

_Next: Part 21 - Cloud Deployment (AWS/Azure/GCP Integration)_
