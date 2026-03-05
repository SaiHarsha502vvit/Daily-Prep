# 🌱 SPRING BOOT MASTERY - Part 9: Clean Architecture & Quality Code

> **Building Production-Ready Applications**
> _"Good architecture is about managing complexity"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Clean Architecture?                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Technical debt: Bad architecture = slow development over time                │
│  • Team productivity: Good structure = multiple devs work without conflicts     │
│  • Testability: Layered code = easy to mock and unit test                       │
│  • Maintenance: Clear boundaries = change one thing without breaking others     │
│  • Interview: "How do you structure a Spring Boot project?"                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How to Structure a Spring Boot Project?                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Layered: Controller → Service → Repository (classic Spring pattern)          │
│  • Package by feature: user/, order/, payment/ (better for large apps)          │
│  • Hexagonal: Ports & Adapters for framework independence                       │
│  • Shared kernel: Common DTOs, exceptions, utilities in /common                 │
│  • Configuration: Separate config classes for different concerns                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Each Architecture Style?                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Simple layered: Small projects, MVPs, learning                               │
│  • Package by feature: Large monoliths, future microservice extraction          │
│  • Hexagonal: When business logic is complex, need framework independence       │
│  • Modular monolith: When you might need microservices later                    │
│  • CQRS: Read/write patterns differ significantly                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Quality Practices to Follow?                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     Layered architecture, exception handling, logging               │
│  IMPORTANT:     Code review, consistent naming, DTO patterns                    │
│  ADVANCED:      Domain-driven design, event sourcing, modular boundaries        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# APPLICATION ARCHITECTURE

---

## Chapter 1: Layered Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT LAYERED ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           ┌─────────────────┐                                   │
│                           │     CLIENT      │                                   │
│                           │  (Browser/App)  │                                   │
│                           └───────┬─────────┘                                   │
│                                   │                                             │
│  ┌────────────────────────────────┼────────────────────────────────────────┐    │
│  │                                │                                         │   │
│  │  ┌─────────────────────────────▼─────────────────────────────────────┐  │    │
│  │  │                    CONTROLLER LAYER                                │  │   │
│  │  │                                                                    │  │   │
│  │  │  • @RestController, @Controller                                   │  │    │
│  │  │  • Request/Response handling                                      │  │    │
│  │  │  • Validation (@Valid)                                            │  │    │
│  │  │  • Authentication/Authorization                                   │  │    │
│  │  │  • Exception handling (@ControllerAdvice)                        │  │     │
│  │  │  • DTO ↔ External communication                                   │  │    │
│  │  │                                                                    │  │   │
│  │  └────────────────────────────┬──────────────────────────────────────┘  │    │
│  │                               │ DTOs                                    │    │
│  │  ┌────────────────────────────▼──────────────────────────────────────┐  │    │
│  │  │                     SERVICE LAYER                                  │  │   │
│  │  │                                                                    │  │   │
│  │  │  • @Service                                                       │  │    │
│  │  │  • Business logic                                                 │  │    │
│  │  │  • Transaction management (@Transactional)                       │  │     │
│  │  │  • Orchestration between components                              │  │     │
│  │  │  • Domain rules enforcement                                      │  │     │
│  │  │  • DTO ↔ Entity mapping                                          │  │     │
│  │  │                                                                    │  │   │
│  │  └────────────────────────────┬──────────────────────────────────────┘  │    │
│  │                               │ Entities                                │    │
│  │  ┌────────────────────────────▼──────────────────────────────────────┐  │    │
│  │  │                   REPOSITORY LAYER                                 │  │   │
│  │  │                                                                    │  │   │
│  │  │  • @Repository                                                    │  │    │
│  │  │  • Data access (JpaRepository)                                   │  │     │
│  │  │  • Custom queries                                                 │  │    │
│  │  │  • NO business logic here!                                       │  │     │
│  │  │                                                                    │  │   │
│  │  └────────────────────────────┬──────────────────────────────────────┘  │    │
│  │                               │                                         │    │
│  └───────────────────────────────┼─────────────────────────────────────────┘    │
│                                  │                                              │
│                           ┌──────▼──────┐                                       │
│                           │  DATABASE   │                                       │
│                           └─────────────┘                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 2: Package Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED PACKAGE STRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  OPTION 1: LAYER-BASED (Traditional)                                            │
│  ═══════════════════════════════════                                            │
│                                                                                 │
│  com.company.myapp/                                                             │
│  ├── MyApplication.java                                                         │
│  ├── controller/                                                                │
│  │   ├── UserController.java                                                    │
│  │   ├── OrderController.java                                                   │
│  │   └── ProductController.java                                                 │
│  ├── service/                                                                   │
│  │   ├── UserService.java                                                       │
│  │   ├── OrderService.java                                                      │
│  │   └── ProductService.java                                                    │
│  ├── repository/                                                                │
│  │   ├── UserRepository.java                                                    │
│  │   ├── OrderRepository.java                                                   │
│  │   └── ProductRepository.java                                                 │
│  ├── entity/                                                                    │
│  │   ├── User.java                                                              │
│  │   ├── Order.java                                                             │
│  │   └── Product.java                                                           │
│  ├── dto/                                                                       │
│  │   ├── request/                                                               │
│  │   │   ├── CreateUserRequest.java                                             │
│  │   │   └── UpdateUserRequest.java                                             │
│  │   └── response/                                                              │
│  │       ├── UserResponse.java                                                  │
│  │       └── UserSummary.java                                                   │
│  ├── mapper/                                                                    │
│  │   └── UserMapper.java                                                        │
│  ├── exception/                                                                 │
│  │   ├── GlobalExceptionHandler.java                                            │
│  │   └── ResourceNotFoundException.java                                         │
│  └── config/                                                                    │
│      ├── SecurityConfig.java                                                    │
│      └── OpenApiConfig.java                                                     │
│                                                                                 │
│  ✅ PROS: Easy to navigate by layer                                              │
│  ❌ CONS: Related code spread across packages                                    │
│                                                                                 │
│                                                                                 │
│  OPTION 2: FEATURE/DOMAIN-BASED (Recommended for larger apps)                   │
│  ═════════════════════════════════════════════════════════════                  │
│                                                                                 │
│  com.company.myapp/                                                             │
│  ├── MyApplication.java                                                         │
│  ├── user/                                                                      │
│  │   ├── UserController.java                                                    │
│  │   ├── UserService.java                                                       │
│  │   ├── UserRepository.java                                                    │
│  │   ├── User.java                                                              │
│  │   └── dto/                                                                   │
│  │       ├── CreateUserRequest.java                                             │
│  │       └── UserResponse.java                                                  │
│  ├── order/                                                                     │
│  │   ├── OrderController.java                                                   │
│  │   ├── OrderService.java                                                      │
│  │   ├── OrderRepository.java                                                   │
│  │   ├── Order.java                                                             │
│  │   └── dto/                                                                   │
│  ├── product/                                                                   │
│  │   └── ...                                                                    │
│  └── common/                                                                    │
│      ├── exception/                                                             │
│      ├── config/                                                                │
│      └── util/                                                                  │
│                                                                                 │
│  ✅ PROS: All related code together, easy to refactor to microservices           │
│  ❌ CONS: Less obvious layer separation                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 3: Clean Code Principles for Spring

### Single Responsibility Principle

```java
// ═══════════════════════════════════════════════════════════════════════════════
// ❌ BAD: Controller doing too much
// ═══════════════════════════════════════════════════════════════════════════════

@RestController
public class UserController {

    @PostMapping("/users")
    public User createUser(@RequestBody CreateUserRequest req) {
        // Validation
        if (req.getEmail() == null) throw new BadRequest("Email required");
        if (!req.getEmail().contains("@")) throw new BadRequest("Invalid email");

        // Check duplicates
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new Conflict("Email exists");
        }

        // Create user
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));

        // Save
        User saved = userRepository.save(user);

        // Send email
        emailService.sendWelcomeEmail(saved);

        return saved;  // ❌ Returning entity!
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ✅ GOOD: Each layer has single responsibility
// ═══════════════════════════════════════════════════════════════════════════════

// Controller: Only HTTP concerns
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest req) {

        UserResponse created = userService.create(req);
        URI location = URI.create("/users/" + created.id());
        return ResponseEntity.created(location).body(created);
    }
}


// Service: Business logic
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final UserMapper userMapper;

    public UserResponse create(CreateUserRequest request) {
        validateUniqueEmail(request.email());

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User saved = userRepository.save(user);

        emailService.sendWelcomeEmail(saved);

        return userMapper.toResponse(saved);
    }

    private void validateUniqueEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }
    }
}


// Repository: Only data access
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
}


// DTO: Validation rules (via annotations)
public record CreateUserRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password
) {}
```

### Dependency Inversion

```java
// ═══════════════════════════════════════════════════════════════════════════════
// ❌ BAD: Service depends on concrete implementation
// ═══════════════════════════════════════════════════════════════════════════════

@Service
public class OrderService {

    // Directly depends on concrete implementation
    private final StripePaymentGateway paymentGateway = new StripePaymentGateway();

    public void processPayment(Order order) {
        paymentGateway.charge(order.getTotal());  // Tightly coupled to Stripe
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ✅ GOOD: Depend on abstraction
// ═══════════════════════════════════════════════════════════════════════════════

// Define interface (abstraction)
public interface PaymentGateway {
    PaymentResult charge(PaymentMethod method, BigDecimal amount);
}

// Stripe implementation
@Service
@ConditionalOnProperty(name = "payment.provider", havingValue = "stripe")
public class StripePaymentGateway implements PaymentGateway {

    @Override
    public PaymentResult charge(PaymentMethod method, BigDecimal amount) {
        // Stripe-specific logic
    }
}

// PayPal implementation
@Service
@ConditionalOnProperty(name = "payment.provider", havingValue = "paypal")
public class PayPalPaymentGateway implements PaymentGateway {

    @Override
    public PaymentResult charge(PaymentMethod method, BigDecimal amount) {
        // PayPal-specific logic
    }
}

// Service depends on interface
@Service
@RequiredArgsConstructor
public class OrderService {

    private final PaymentGateway paymentGateway;  // Injected - could be any impl

    public void processPayment(Order order) {
        paymentGateway.charge(order.getPaymentMethod(), order.getTotal());
    }
}

// Benefits:
// ✅ Easy to switch implementations
// ✅ Easy to test (mock the interface)
// ✅ Easy to add new payment providers
```

---

## Chapter 4: Writing Quality Service Methods

```java
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;
    private final OrderMapper orderMapper;

    // ═══════════════════════════════════════════════════════════════════════════
    // QUALITY METHOD: Clear structure, error handling, logging
    // ═══════════════════════════════════════════════════════════════════════════

    public OrderResponse createOrder(CreateOrderRequest request, Long userId) {
        log.debug("Creating order for user={}, items={}", userId, request.items().size());

        // 1. VALIDATE & LOAD DEPENDENCIES
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        List<Product> products = loadAndValidateProducts(request.items());

        // 2. BUILD DOMAIN OBJECT
        Order order = buildOrder(user, products, request);

        // 3. APPLY BUSINESS RULES
        applyDiscountsAndPromotions(order, user);
        validateOrderConstraints(order);

        // 4. RESERVE INVENTORY
        try {
            inventoryService.reserve(order.getItems());
        } catch (InsufficientInventoryException e) {
            throw new OrderCreationException("Some items are out of stock", e);
        }

        // 5. PERSIST
        Order saved = orderRepository.save(order);

        // 6. SIDE EFFECTS (consider events for decoupling)
        notificationService.sendOrderConfirmation(order);

        log.info("Order created: orderId={}, userId={}, total={}",
                 saved.getId(), userId, saved.getTotal());

        return orderMapper.toResponse(saved);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS: Keep public methods clean
    // ═══════════════════════════════════════════════════════════════════════════

    private List<Product> loadAndValidateProducts(List<OrderItemRequest> items) {
        Set<Long> productIds = items.stream()
            .map(OrderItemRequest::productId)
            .collect(Collectors.toSet());

        List<Product> products = productRepository.findAllById(productIds);

        if (products.size() != productIds.size()) {
            Set<Long> foundIds = products.stream()
                .map(Product::getId)
                .collect(Collectors.toSet());
            Set<Long> missingIds = new HashSet<>(productIds);
            missingIds.removeAll(foundIds);
            throw new ProductNotFoundException(missingIds);
        }

        return products;
    }

    private Order buildOrder(User user, List<Product> products, CreateOrderRequest request) {
        Map<Long, Product> productMap = products.stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<OrderItem> orderItems = request.items().stream()
            .map(item -> OrderItem.builder()
                .product(productMap.get(item.productId()))
                .quantity(item.quantity())
                .unitPrice(productMap.get(item.productId()).getPrice())
                .build())
            .toList();

        BigDecimal total = orderItems.stream()
            .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Order.builder()
            .user(user)
            .items(orderItems)
            .total(total)
            .status(OrderStatus.PENDING)
            .shippingAddress(request.shippingAddress())
            .build();
    }

    private void applyDiscountsAndPromotions(Order order, User user) {
        // Member discount
        if (user.getMembershipTier() == MembershipTier.GOLD) {
            BigDecimal discount = order.getTotal().multiply(new BigDecimal("0.10"));
            order.setDiscount(discount);
            order.setTotal(order.getTotal().subtract(discount));
        }

        // Minimum order check
        if (order.getTotal().compareTo(new BigDecimal("25.00")) < 0) {
            throw new MinimumOrderException("Minimum order is $25.00");
        }
    }

    private void validateOrderConstraints(Order order) {
        if (order.getItems().isEmpty()) {
            throw new EmptyOrderException("Order must have at least one item");
        }

        if (order.getItems().size() > 50) {
            throw new OrderConstraintException("Maximum 50 items per order");
        }
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // STATE TRANSITION: Clear validation and state changes
    // ═══════════════════════════════════════════════════════════════════════════

    public OrderResponse confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Validate state transition
        if (!order.canConfirm()) {
            throw new InvalidOrderStateException(
                "Cannot confirm order in state: " + order.getStatus());
        }

        // Process payment
        PaymentResult payment = processPayment(order);

        // Update state
        order.confirm(payment.getTransactionId());

        Order saved = orderRepository.save(order);

        log.info("Order confirmed: orderId={}, paymentId={}",
                 orderId, payment.getTransactionId());

        return orderMapper.toResponse(saved);
    }

    private PaymentResult processPayment(Order order) {
        PaymentResult result = paymentGateway.charge(
            order.getUser().getPaymentMethod(),
            order.getTotal()
        );

        if (!result.isSuccess()) {
            order.setStatus(OrderStatus.PAYMENT_FAILED);
            orderRepository.save(order);
            throw new PaymentFailedException(result.getMessage());
        }

        return result;
    }
}
```

---

## Chapter 5: Configuration Best Practices

```yaml
# ═══════════════════════════════════════════════════════════════════════════════
# application.yml - Organized configuration
# ═══════════════════════════════════════════════════════════════════════════════

spring:
    application:
        name: my-service

    # Profile-independent settings
    jackson:
        default-property-inclusion: non_null
        serialization:
            write-dates-as-timestamps: false

    # JPA settings
    jpa:
        open-in-view: false # Important! Disable for proper lazy loading
        hibernate:
            ddl-auto: validate # Never auto-create in production!
        properties:
            hibernate:
                format_sql: true
                generate_statistics: false

# Custom application configuration
app:
    security:
        jwt:
            secret: ${JWT_SECRET} # From environment variable
            expiration: 3600

    pagination:
        default-size: 20
        max-size: 100

    features:
        email-notifications: true
        audit-logging: true

---
# Development profile
spring:
    config:
        activate:
            on-profile: dev

    jpa:
        show-sql: true
        hibernate:
            ddl-auto: update # OK for development

    h2:
        console:
            enabled: true

logging:
    level:
        org.springframework.web: DEBUG
        org.hibernate.SQL: DEBUG
        com.myapp: DEBUG

app:
    features:
        email-notifications: false # Disable in dev

---
# Production profile
spring:
    config:
        activate:
            on-profile: prod

    jpa:
        show-sql: false
        hibernate:
            ddl-auto: none # Never in production!

logging:
    level:
        ROOT: WARN
        com.myapp: INFO
```

### Type-Safe Configuration

```java
// ═══════════════════════════════════════════════════════════════════════════════
// Type-safe configuration with @ConfigurationProperties
// ═══════════════════════════════════════════════════════════════════════════════

@Configuration
@ConfigurationProperties(prefix = "app")
@Validated
@Getter
@Setter
public class AppProperties {

    @Valid
    private Security security = new Security();

    @Valid
    private Pagination pagination = new Pagination();

    @Valid
    private Features features = new Features();

    @Getter
    @Setter
    public static class Security {
        @Valid
        private Jwt jwt = new Jwt();

        @Getter
        @Setter
        public static class Jwt {
            @NotBlank
            private String secret;

            @Min(60)
            @Max(86400)
            private int expiration = 3600;
        }
    }

    @Getter
    @Setter
    public static class Pagination {
        @Min(1)
        @Max(100)
        private int defaultSize = 20;

        @Min(1)
        @Max(1000)
        private int maxSize = 100;
    }

    @Getter
    @Setter
    public static class Features {
        private boolean emailNotifications = true;
        private boolean auditLogging = true;
    }
}


// Usage
@Service
@RequiredArgsConstructor
public class UserService {

    private final AppProperties appProperties;

    public void example() {
        int maxPageSize = appProperties.getPagination().getMaxSize();
        String jwtSecret = appProperties.getSecurity().getJwt().getSecret();

        if (appProperties.getFeatures().isEmailNotifications()) {
            // Send email
        }
    }
}
```

---

## Chapter 6: Error Handling Strategy

```java
// ═══════════════════════════════════════════════════════════════════════════════
// EXCEPTION HIERARCHY
// ═══════════════════════════════════════════════════════════════════════════════

// Base application exception
public abstract class ApplicationException extends RuntimeException {

    private final ErrorCode errorCode;
    private final HttpStatus httpStatus;

    protected ApplicationException(String message, ErrorCode errorCode, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = status;
    }

    protected ApplicationException(String message, ErrorCode errorCode, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = status;
    }

    // Getters...
}


// Error codes enum
public enum ErrorCode {
    // Resource errors (400x)
    RESOURCE_NOT_FOUND,
    RESOURCE_ALREADY_EXISTS,
    RESOURCE_CONFLICT,

    // Validation errors (4001-4099)
    VALIDATION_FAILED,
    INVALID_INPUT,

    // Business rule errors (4100-4199)
    BUSINESS_RULE_VIOLATION,
    INSUFFICIENT_FUNDS,
    INVENTORY_UNAVAILABLE,

    // Authentication/Authorization (401x, 403x)
    UNAUTHORIZED,
    FORBIDDEN,
    TOKEN_EXPIRED,

    // Internal errors (500x)
    INTERNAL_ERROR,
    DATABASE_ERROR,
    EXTERNAL_SERVICE_ERROR
}


// Specific exceptions
public class ResourceNotFoundException extends ApplicationException {

    public ResourceNotFoundException(String resourceType, Object id) {
        super(
            String.format("%s not found with id: %s", resourceType, id),
            ErrorCode.RESOURCE_NOT_FOUND,
            HttpStatus.NOT_FOUND
        );
    }
}

public class UserNotFoundException extends ResourceNotFoundException {
    public UserNotFoundException(Long id) {
        super("User", id);
    }
}

public class BusinessRuleException extends ApplicationException {

    public BusinessRuleException(String message) {
        super(message, ErrorCode.BUSINESS_RULE_VIOLATION, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

public class ExternalServiceException extends ApplicationException {

    public ExternalServiceException(String service, String message, Throwable cause) {
        super(
            String.format("External service '%s' error: %s", service, message),
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            HttpStatus.SERVICE_UNAVAILABLE,
            cause
        );
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXCEPTION HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // Handle application exceptions
    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ErrorResponse> handleApplicationException(
            ApplicationException ex, HttpServletRequest request) {

        log.warn("Application error: code={}, message={}",
                 ex.getErrorCode(), ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(ex.getHttpStatus().value())
            .error(ex.getHttpStatus().getReasonPhrase())
            .errorCode(ex.getErrorCode().name())
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(ex.getHttpStatus()).body(error);
    }

    // Handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> new ErrorResponse.FieldError(
                fe.getField(),
                fe.getDefaultMessage(),
                fe.getRejectedValue()
            ))
            .toList();

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Validation Failed")
            .errorCode(ErrorCode.VALIDATION_FAILED.name())
            .message("Invalid request data")
            .path(request.getRequestURI())
            .fieldErrors(fieldErrors)
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    // Catch-all for unexpected errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(
            Exception ex, HttpServletRequest request) {

        log.error("Unexpected error at {}: ", request.getRequestURI(), ex);

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .error("Internal Server Error")
            .errorCode(ErrorCode.INTERNAL_ERROR.name())
            .message("An unexpected error occurred")  // Don't expose details!
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

---

## Chapter 7: Testing Strategy

```java
// ═══════════════════════════════════════════════════════════════════════════════
// UNIT TEST - Service layer
// ═══════════════════════════════════════════════════════════════════════════════

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    void create_WithValidRequest_ReturnsCreatedUser() {
        // Given
        CreateUserRequest request = new CreateUserRequest("john@test.com", "password123");
        User entity = new User(1L, "john@test.com", "hashed");
        UserResponse expected = new UserResponse(1L, "john@test.com");

        when(userRepository.existsByEmail("john@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userMapper.toEntity(request)).thenReturn(new User());
        when(userRepository.save(any(User.class))).thenReturn(entity);
        when(userMapper.toResponse(entity)).thenReturn(expected);

        // When
        UserResponse result = userService.create(request);

        // Then
        assertThat(result).isEqualTo(expected);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void create_WithDuplicateEmail_ThrowsException() {
        // Given
        CreateUserRequest request = new CreateUserRequest("existing@test.com", "password");
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> userService.create(request))
            .isInstanceOf(EmailAlreadyExistsException.class)
            .hasMessageContaining("existing@test.com");

        verify(userRepository, never()).save(any());
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST - Repository
// ═══════════════════════════════════════════════════════════════════════════════

@DataJpaTest  // Configures embedded DB, entity manager, repositories
@AutoConfigureTestDatabase(replace = Replace.NONE)  // Use real DB (with Testcontainers)
@Testcontainers
class UserRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByEmail_ExistingEmail_ReturnsUser() {
        // Given
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hash");
        entityManager.persistAndFlush(user);
        entityManager.clear();  // Clear cache to force DB query

        // When
        Optional<User> result = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(result)
            .isPresent()
            .hasValueSatisfying(u -> assertThat(u.getEmail()).isEqualTo("test@example.com"));
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST - Controller
// ═══════════════════════════════════════════════════════════════════════════════

@WebMvcTest(UserController.class)  // Only web layer
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void createUser_ValidRequest_Returns201() throws Exception {
        // Given
        UserResponse response = new UserResponse(1L, "john@test.com");
        when(userService.create(any())).thenReturn(response);

        // When/Then
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "john@test.com",
                        "password": "Password1!"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.email").value("john@test.com"));
    }

    @Test
    void createUser_InvalidEmail_Returns400() throws Exception {
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "invalid-email",
                        "password": "Password1!"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("email"));
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// FULL INTEGRATION TEST
// ═══════════════════════════════════════════════════════════════════════════════

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class UserApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void fullUserFlow() {
        // Create user
        CreateUserRequest createRequest = new CreateUserRequest("new@test.com", "Password1!");

        ResponseEntity<UserResponse> createResponse = restTemplate.postForEntity(
            "/api/v1/users",
            createRequest,
            UserResponse.class
        );

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody().email()).isEqualTo("new@test.com");

        Long userId = createResponse.getBody().id();

        // Get user
        ResponseEntity<UserResponse> getResponse = restTemplate.getForEntity(
            "/api/v1/users/{id}",
            UserResponse.class,
            userId
        );

        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().id()).isEqualTo(userId);

        // Verify in database
        assertThat(userRepository.findById(userId)).isPresent();
    }
}
```

---

## Chapter 8: Final Checklist

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT MASTERY CHECKLIST                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ARCHITECTURE:                                                                  │
│  □ Clear separation: Controller → Service → Repository                          │
│  □ DTOs for API contracts, Entities for persistence                             │
│  □ Single Responsibility in each class                                          │
│  □ Dependency injection via constructor (final fields)                          │
│                                                                                 │
│  CONTROLLERS:                                                                   │
│  □ @Valid on request bodies                                                     │
│  □ Appropriate HTTP status codes                                                │
│  □ ResponseEntity for explicit control                                          │
│  □ No business logic (delegate to service)                                      │
│  □ API versioning strategy                                                      │
│                                                                                 │
│  SERVICES:                                                                      │
│  □ @Transactional (class level) + @Transactional(readOnly) for reads            │
│  □ Business logic and validation                                                │
│  □ Return DTOs, not entities                                                    │
│  □ Logging for important operations                                             │
│  □ Meaningful exceptions                                                        │
│                                                                                 │
│  JPA/REPOSITORIES:                                                              │
│  □ LAZY fetch for all relationships                                             │
│  □ JOIN FETCH or @EntityGraph to prevent N+1                                    │
│  □ Use Optional for single-result queries                                       │
│  □ Pageable for large result sets                                               │
│  □ @Query for complex queries                                                   │
│                                                                                 │
│  VALIDATION:                                                                    │
│  □ Bean validation annotations on DTOs                                          │
│  □ Custom validators for complex rules                                          │
│  □ Validation groups for create vs update                                       │
│                                                                                 │
│  ERROR HANDLING:                                                                │
│  □ Global @RestControllerAdvice                                                 │
│  □ Custom exception hierarchy                                                   │
│  □ Consistent error response format                                             │
│  □ Don't expose internal errors to clients                                      │
│                                                                                 │
│  CONFIGURATION:                                                                 │
│  □ Profile-specific configs (dev, prod)                                         │
│  □ @ConfigurationProperties for type safety                                     │
│  □ Secrets from environment variables                                           │
│  □ open-in-view: false                                                          │
│                                                                                 │
│  TESTING:                                                                       │
│  □ Unit tests for services (Mockito)                                            │
│  □ @WebMvcTest for controllers                                                  │
│  □ @DataJpaTest for repositories                                                │
│  □ @SpringBootTest for integration                                              │
│  □ Testcontainers for realistic database testing                                │
│                                                                                 │
│  SECURITY:                                                                      │
│  □ Authentication (JWT, OAuth2, etc.)                                           │
│  □ Authorization (@PreAuthorize)                                                │
│  □ CORS configuration                                                           │
│  □ Password encoding                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🎓 SPRING BOOT MASTERY COMPLETE!

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  You've completed the Spring Boot Mastery Guide covering:                       │
│                                                                                 │
│  Part 1: Java Foundations (JVM, Memory, GC, Threading)                          │
│  Part 2: Spring Core (IoC, DI, Beans, Lifecycle)                                │
│  Part 3: AOP & Spring Boot Auto-Configuration                                   │
│  Part 4: Data Access, Web, Security, Testing                                    │
│  Part 5: Lombok & DTOs                                                          │
│  Part 6: Service & Repository Best Practices                                    │
│  Part 7: Controllers & REST API Architecture                                    │
│  Part 8: JPA & Hibernate Deep Dive                                              │
│  Part 9: Clean Architecture & Quality Code                                      │
│                                                                                 │
│  You now have the knowledge to:                                                 │
│  ✅ Understand why Spring works the way it does                                  │
│  ✅ Design clean, maintainable architectures                                     │
│  ✅ Write production-quality code                                                │
│  ✅ Handle errors properly                                                       │
│  ✅ Test at every level                                                          │
│  ✅ Configure for different environments                                         │
│                                                                                 │
│  Keep practicing! Build projects to reinforce these concepts.                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

_End of Spring Boot Mastery Guide_
