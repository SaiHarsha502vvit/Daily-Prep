> **Navigation**: [< Previous](07_Spring_Boot_Part5_Lombok_DTOs.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](09_Spring_Boot_Part7_Controllers_REST.md)

# 🌱 SPRING BOOT MASTERY - Part 6: Service Layer & Repository Patterns

> **The Architecture of Clean Business Logic**
> _"Services orchestrate, Repositories persist"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Service Layer Pattern?                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Fat controller anti-pattern: Business logic belongs in services              │
│  • Reusability: Same service works for REST, CLI, scheduled jobs                │
│  • Testability: Services easy to unit test without HTTP                         │
│  • Transaction boundary: @Transactional goes on services                        │
│  • Clean architecture: Controller → Service → Repository separation             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How to Structure Service Layer?                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Interface + Implementation: UserService interface, UserServiceImpl           │
│  • @Service annotation: Marks class for component scanning                      │
│  • Constructor injection: @RequiredArgsConstructor for dependencies             │
│  • DTO conversion: Service converts Entity ↔ DTO                                │
│  • Exception handling: Throw domain exceptions from services                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Service vs Repository?                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  SERVICE: Business logic, validation, orchestration, DTO conversion             │
│  REPOSITORY: Data access only - findById, save, delete, custom queries          │
│                                                                                 │
│  SERVICE: "Create order" = validate stock, calculate price, send email          │
│  REPOSITORY: "Save order to database"                                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Patterns to Use?                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     @Service, @Repository, @Transactional on service methods        │
│  IMPORTANT:     Interface segregation, custom repository methods                │
│  ADVANCED:      Specifications, domain events, CQRS separation                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 📌 The Service Layer

---

## Chapter 1: Why Service Layer Exists

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    THE SERVICE LAYER PURPOSE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WITHOUT SERVICE LAYER (Fat Controller Anti-Pattern):                           │
│                                                                                 │
│  @RestController                                                                │
│  public class OrderController {                                                 │
│      @PostMapping("/orders")                                                    │
│      public Order createOrder(@RequestBody OrderRequest req) {                  │
│          // ❌ Validation logic in controller                                    │
│          if (req.getItems().isEmpty()) throw new BadRequestException();         │
│                                                                                 │
│          // ❌ Business logic in controller                                      │
│          double total = 0;                                                      │
│          for (Item item : req.getItems()) {                                     │
│              Product p = productRepo.findById(item.productId);                  │
│              if (p.getStock() < item.quantity) throw new OutOfStockException(); │
│              total += p.getPrice() * item.quantity;                             │
│          }                                                                      │
│                                                                                 │
│          // ❌ Transaction management in controller                              │
│          Order order = new Order();                                             │
│          order.setTotal(total);                                                 │
│          orderRepo.save(order);                                                 │
│                                                                                 │
│          // ❌ Integration with external services                                │
│          emailService.sendOrderConfirmation(order);                             │
│          inventoryService.decrementStock(order);                                │
│                                                                                 │
│          return order;                                                          │
│      }                                                                          │
│  }                                                                              │
│                                                                                 │
│  PROBLEMS:                                                                      │
│  ❌ Untestable - can't unit test business logic                                  │
│  ❌ Code duplication - same logic in multiple controllers                        │
│  ❌ Mixed concerns - HTTP handling + business + persistence                      │
│  ❌ Hard to maintain - changes ripple everywhere                                 │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WITH SERVICE LAYER (Clean Architecture):                                       │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐           │
│  │                                                                   │          │
│  │  Controller                Service                Repository     │           │
│  │  ┌─────────┐            ┌───────────┐           ┌───────────┐   │            │
│  │  │ HTTP    │───────────▶│ Business  │───────────▶│ Database  │   │           │
│  │  │ Layer   │            │ Logic     │            │ Access    │   │           │
│  │  └─────────┘            └───────────┘            └───────────┘   │           │
│  │  • Request    ──────▶   • Validation  ──────▶   • CRUD          │            │
│  │  • Response   ◀──────   • Rules       ◀──────   • Queries       │            │
│  │  • Auth       ──────▶   • Orchestrate ──────▶   • Transactions  │            │
│  │                                                                   │          │
│  └──────────────────────────────────────────────────────────────────┘           │
│                                                                                 │
│  BENEFITS:                                                                      │
│  ✅ Single Responsibility - each layer has ONE job                               │
│  ✅ Testable - unit test services without HTTP                                   │
│  ✅ Reusable - same service used by REST, GraphQL, CLI                           │
│  ✅ Maintainable - changes isolated to one layer                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 2: Service Layer Best Practices

### Basic Service Structure

```java
@Service  // Marks as Spring-managed service bean
@RequiredArgsConstructor  // Constructor injection (Lombok)
@Transactional  // Default: all methods transactional
@Slf4j  // Logger
public class UserService {

    // Dependencies - all final (immutable)
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final UserMapper userMapper;

    // READ operations - optimize with readOnly
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public Page<UserSummary> findAll(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(userMapper::toSummary);
    }

    // WRITE operations - transactional by default
    public UserResponse create(CreateUserRequest request) {
        validateUniqueEmail(request.email());

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User saved = userRepository.save(user);

        // Side effects - can use @TransactionEventListener for decoupling
        emailService.sendWelcomeEmail(saved);

        log.info("Created user: id={}, email={}", saved.getId(), saved.getEmail());

        return userMapper.toResponse(saved);
    }

    // Private helper methods
    private void validateUniqueEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }
    }
}
```

### Service Method Patterns

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PaymentGateway paymentGateway;
    private final OrderMapper orderMapper;

    // ═══════════════════════════════════════════════════════════════════════════
    // PATTERN 1: QUERY METHOD (Read-only, simple retrieval)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return orderRepository.findById(id)
            .map(orderMapper::toResponse)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByUser(Long userId) {
        return orderRepository.findByUserId(userId)
            .stream()
            .map(orderMapper::toResponse)
            .toList();
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // PATTERN 2: COMMAND METHOD (Write, with validation & side effects)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Long userId) {
        // 1. Load & validate entities
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        List<OrderItem> items = validateAndBuildItems(request.items());

        // 2. Create aggregate
        Order order = Order.builder()
            .user(user)
            .items(items)
            .status(OrderStatus.PENDING)
            .total(calculateTotal(items))
            .build();

        // 3. Apply business rules
        applyDiscounts(order, user);

        // 4. Persist
        Order saved = orderRepository.save(order);

        // 5. Side effects (consider event publishing for decoupling)
        log.info("Order created: orderId={}, userId={}, total={}",
                 saved.getId(), userId, saved.getTotal());

        // 6. Return response
        return orderMapper.toResponse(saved);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // PATTERN 3: STATE TRANSITION METHOD (Update status with validations)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public OrderResponse confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Validate state transition
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException(
                "Cannot confirm order in status: " + order.getStatus());
        }

        // Process payment
        PaymentResult payment = paymentGateway.charge(
            order.getUser().getPaymentMethod(),
            order.getTotal()
        );

        if (!payment.isSuccess()) {
            order.setStatus(OrderStatus.PAYMENT_FAILED);
            orderRepository.save(order);
            throw new PaymentFailedException(payment.getMessage());
        }

        // Update state
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentId(payment.getTransactionId());
        order.setConfirmedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);

        log.info("Order confirmed: orderId={}, paymentId={}",
                 orderId, payment.getTransactionId());

        return orderMapper.toResponse(saved);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // PATTERN 4: BATCH OPERATION (Processing multiple items)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public BatchResult cancelExpiredOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        List<Order> expiredOrders = orderRepository
            .findByStatusAndCreatedAtBefore(OrderStatus.PENDING, cutoff);

        int cancelled = 0;
        int failed = 0;

        for (Order order : expiredOrders) {
            try {
                order.setStatus(OrderStatus.CANCELLED);
                order.setCancelledAt(LocalDateTime.now());
                order.setCancelReason("Expired - no payment received");
                orderRepository.save(order);
                cancelled++;
            } catch (Exception e) {
                log.error("Failed to cancel order: {}", order.getId(), e);
                failed++;
            }
        }

        log.info("Batch cancel completed: cancelled={}, failed={}", cancelled, failed);

        return new BatchResult(cancelled, failed);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // PATTERN 5: ORCHESTRATION METHOD (Coordinates multiple services)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public OrderResponse processCompleteOrder(CreateOrderRequest request, Long userId) {
        // Orchestrate multiple operations
        OrderResponse order = createOrder(request, userId);

        // Reserve inventory
        inventoryService.reserveItems(order.id(), request.items());

        // Initialize shipping
        shippingService.createShipment(order.id(), request.shippingAddress());

        // Send confirmation
        notificationService.sendOrderConfirmation(order);

        return order;
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    private List<OrderItem> validateAndBuildItems(List<OrderItemRequest> requests) {
        List<OrderItem> items = new ArrayList<>();

        for (OrderItemRequest req : requests) {
            Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> new ProductNotFoundException(req.productId()));

            if (product.getStock() < req.quantity()) {
                throw new InsufficientStockException(
                    product.getId(), product.getStock(), req.quantity());
            }

            items.add(OrderItem.builder()
                .product(product)
                .quantity(req.quantity())
                .unitPrice(product.getPrice())
                .build());
        }

        return items;
    }

    private BigDecimal calculateTotal(List<OrderItem> items) {
        return items.stream()
            .map(item -> item.getUnitPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void applyDiscounts(Order order, User user) {
        if (user.getMembershipTier() == MembershipTier.GOLD) {
            BigDecimal discount = order.getTotal()
                .multiply(BigDecimal.valueOf(0.10));
            order.setDiscount(discount);
            order.setTotal(order.getTotal().subtract(discount));
        }
    }
}
```

---

## Chapter 3: Service Layer Anti-Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE ANTI-PATTERNS TO AVOID                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ❌ ANTI-PATTERN 1: Anemic Service (Just a CRUD wrapper)                         │
│  ────────────────────────────────────────────────────────────────────────       │
│  @Service                                                                       │
│  public class UserService {                                                     │
│      public User findById(Long id) {                                            │
│          return userRepository.findById(id).orElse(null);  // Just delegation!  │
│      }                                                                          │
│      public User save(User user) {                                              │
│          return userRepository.save(user);  // No business logic!               │
│      }                                                                          │
│  }                                                                              │
│  // Problem: No value add. Controller could use Repository directly.            │
│                                                                                 │
│  ✅ FIX: Add validation, business rules, orchestration                           │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ❌ ANTI-PATTERN 2: Entity Exposure (Returning entities from service)            │
│  ────────────────────────────────────────────────────────────────────────       │
│  @Service                                                                       │
│  public class UserService {                                                     │
│      public User findById(Long id) {  // ❌ Returns Entity!                      │
│          return userRepository.findById(id).orElseThrow();                      │
│      }                                                                          │
│  }                                                                              │
│  // Problems:                                                                   │
│  // - Exposes internal structure                                                │
│  // - Can't control what data is returned                                       │
│  // - Lazy loading issues in presentation layer                                 │
│                                                                                 │
│  ✅ FIX: Return DTOs from service methods                                        │
│  public UserResponse findById(Long id) {                                        │
│      return userRepository.findById(id)                                         │
│          .map(userMapper::toResponse)                                           │
│          .orElseThrow(() -> new UserNotFoundException(id));                     │
│  }                                                                              │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ❌ ANTI-PATTERN 3: God Service (Does everything)                                │
│  ────────────────────────────────────────────────────────────────────────       │
│  @Service                                                                       │
│  public class BusinessService {  // 3000+ lines!                                │
│      public void processUser() { ... }                                          │
│      public void processOrder() { ... }                                         │
│      public void processPayment() { ... }                                       │
│      public void processShipping() { ... }                                      │
│      public void processReporting() { ... }                                     │
│      // 50+ more methods...                                                     │
│  }                                                                              │
│                                                                                 │
│  ✅ FIX: Split into focused services by domain                                   │
│  - UserService, OrderService, PaymentService, ShippingService                   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ❌ ANTI-PATTERN 4: HttpServletRequest in Service                                │
│  ────────────────────────────────────────────────────────────────────────       │
│  @Service                                                                       │
│  public class UserService {                                                     │
│      public User createUser(HttpServletRequest request) {  // ❌ HTTP leak!      │
│          String name = request.getParameter("name");                            │
│      }                                                                          │
│  }                                                                              │
│  // Problem: Service tied to HTTP, can't use with CLI/tests                     │
│                                                                                 │
│  ✅ FIX: Accept DTOs, not HTTP objects                                           │
│  public UserResponse createUser(CreateUserRequest request) { ... }              │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ❌ ANTI-PATTERN 5: Missing @Transactional                                       │
│  ────────────────────────────────────────────────────────────────────────       │
│  @Service                                                                       │
│  public class TransferService {                                                 │
│      public void transfer(Long from, Long to, BigDecimal amount) {              │
│          Account source = accountRepo.findById(from).get();                     │
│          Account dest = accountRepo.findById(to).get();                         │
│                                                                                 │
│          source.debit(amount);                                                  │
│          accountRepo.save(source);  // ← What if this succeeds...               │
│                                                                                 │
│          dest.credit(amount);                                                   │
│          accountRepo.save(dest);    // ← ...but this fails? MONEY LOST!         │
│      }                                                                          │
│  }                                                                              │
│                                                                                 │
│  ✅ FIX: Add @Transactional for atomic operations                                │
│  @Transactional                                                                 │
│  public void transfer(Long from, Long to, BigDecimal amount) { ... }            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 4: Service Interface Pattern

```java
// Should you use interfaces for services?

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION 1: Interface + Implementation (Traditional)
// ═══════════════════════════════════════════════════════════════════════════════

// Interface
public interface UserService {
    UserResponse findById(Long id);
    UserResponse create(CreateUserRequest request);
    UserResponse update(Long id, UpdateUserRequest request);
    void delete(Long id);
}

// Implementation
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    // ... other methods
}

/*
 * PROS:
 * ✅ Easy to swap implementations (testing, different strategies)
 * ✅ Clear contract definition
 * ✅ Supports Spring AOP proxying better
 *
 * CONS:
 * ❌ More boilerplate code
 * ❌ Often only one implementation exists
 * ❌ Interface usually just mirrors implementation
 */


// ═══════════════════════════════════════════════════════════════════════════════
// OPTION 2: Concrete Class Only (Modern Pragmatic)
// ═══════════════════════════════════════════════════════════════════════════════

@Service
@RequiredArgsConstructor
public class UserService {  // No interface - simpler!

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    // ... other methods
}

/*
 * PROS:
 * ✅ Less boilerplate
 * ✅ Class IS the contract
 * ✅ Spring proxies work fine with classes (CGLIB)
 * ✅ Mockito can mock concrete classes
 *
 * CONS:
 * ❌ Slightly harder to swap implementations
 *
 * RECOMMENDATION:
 * → Start without interface
 * → Add interface when you actually need multiple implementations
 * → "You Ain't Gonna Need It" (YAGNI)
 */


// ═══════════════════════════════════════════════════════════════════════════════
// WHEN TO USE INTERFACE:
// ═══════════════════════════════════════════════════════════════════════════════

// 1. Multiple implementations exist (Strategy pattern)
public interface PaymentGateway {
    PaymentResult charge(PaymentMethod method, BigDecimal amount);
}

@Service
@ConditionalOnProperty(name = "payment.provider", havingValue = "stripe")
public class StripePaymentGateway implements PaymentGateway { }

@Service
@ConditionalOnProperty(name = "payment.provider", havingValue = "paypal")
public class PayPalPaymentGateway implements PaymentGateway { }


// 2. External system abstraction (for testing)
public interface EmailService {
    void send(String to, String subject, String body);
}

@Service
@Profile("!test")
public class SmtpEmailService implements EmailService { }

@Service
@Profile("test")
public class MockEmailService implements EmailService { }


// 3. Complex domain with specification pattern
public interface OrderSpecification {
    boolean isSatisfiedBy(Order order);
}
```

---

# 📌 The Repository Layer

---

## Chapter 5: Spring Data JPA Repository Fundamentals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SPRING DATA JPA REPOSITORY HIERARCHY                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│               Repository<T, ID>              ← Marker interface                 │
│                      │                                                          │
│                      ▼                                                          │
│           CrudRepository<T, ID>              ← Basic CRUD operations            │
│           • save(entity)                                                        │
│           • saveAll(entities)                                                   │
│           • findById(id) → Optional<T>                                          │
│           • existsById(id)                                                      │
│           • findAll() → Iterable<T>                                             │
│           • findAllById(ids)                                                    │
│           • count()                                                             │
│           • deleteById(id)                                                      │
│           • delete(entity)                                                      │
│           • deleteAll()                                                         │
│                      │                                                          │
│                      ▼                                                          │
│        ListCrudRepository<T, ID>             ← Returns List instead of Iterable │
│                      │                                                          │
│                      ▼                                                          │
│    PagingAndSortingRepository<T, ID>         ← + Pagination & Sorting           │
│           • findAll(Sort sort)                                                  │
│           • findAll(Pageable pageable) → Page<T>                                │
│                      │                                                          │
│                      ▼                                                          │
│          JpaRepository<T, ID>                ← + JPA specific features          │
│           • flush()                                                             │
│           • saveAndFlush(entity)                                                │
│           • deleteInBatch(entities)                                             │
│           • getById(id) → T (lazy)                                              │
│           • getReferenceById(id) → T (lazy proxy)                               │
│                      │                                                          │
│                      ▼                                                          │
│          JpaSpecificationExecutor<T>         ← + Dynamic queries                │
│           • findOne(Specification)                                              │
│           • findAll(Specification)                                              │
│           • findAll(Specification, Pageable)                                    │
│           • count(Specification)                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Basic Repository

```java
// JpaRepository = All CRUD + Paging + Sorting + JPA specific
public interface UserRepository extends JpaRepository<User, Long> {
    // That's it! All basic operations are available:

    // Inherited from JpaRepository:
    // save(), saveAndFlush(), findById(), findAll(),
    // findAll(Pageable), count(), delete(), etc.
}

// Usage in service:
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public void examples() {
        // Save
        User user = new User();
        User saved = userRepository.save(user);

        // Find
        Optional<User> found = userRepository.findById(1L);
        User byId = userRepository.getReferenceById(1L);  // Lazy proxy

        // Check existence
        boolean exists = userRepository.existsById(1L);

        // Count
        long count = userRepository.count();

        // Pagination
        Page<User> page = userRepository.findAll(
            PageRequest.of(0, 10, Sort.by("createdAt").descending())
        );

        // Delete
        userRepository.deleteById(1L);
        userRepository.delete(user);
    }
}
```

---

## Chapter 6: Query Methods (Derived Queries)

```java
public interface UserRepository extends JpaRepository<User, Long> {

    // ═══════════════════════════════════════════════════════════════════════════
    // BASIC PROPERTY QUERIES
    // ═══════════════════════════════════════════════════════════════════════════

    // Returns Optional for single result
    Optional<User> findByEmail(String email);

    // Returns null if not found (not recommended - use Optional)
    User findByUsername(String username);

    // Multiple conditions with And/Or
    Optional<User> findByEmailAndActiveTrue(String email);
    List<User> findByRoleOrDepartment(Role role, String department);

    // Boolean properties
    List<User> findByActiveTrue();
    List<User> findByActiveFalse();
    List<User> findByEmailVerifiedIsTrue();


    // ═══════════════════════════════════════════════════════════════════════════
    // COMPARISON OPERATORS
    // ═══════════════════════════════════════════════════════════════════════════

    // Equality (default)
    List<User> findByAge(int age);                // age = ?
    List<User> findByAgeNot(int age);             // age != ?

    // Comparisons
    List<User> findByAgeLessThan(int age);        // age < ?
    List<User> findByAgeLessThanEqual(int age);   // age <= ?
    List<User> findByAgeGreaterThan(int age);     // age > ?
    List<User> findByAgeGreaterThanEqual(int age);// age >= ?
    List<User> findByAgeBetween(int start, int end); // BETWEEN ? AND ?

    // Date comparisons
    List<User> findByCreatedAtAfter(LocalDateTime date);
    List<User> findByCreatedAtBefore(LocalDateTime date);
    List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);


    // ═══════════════════════════════════════════════════════════════════════════
    // STRING OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    // Pattern matching
    List<User> findByNameContaining(String text);    // LIKE %text%
    List<User> findByNameStartingWith(String prefix);// LIKE text%
    List<User> findByNameEndingWith(String suffix);  // LIKE %text
    List<User> findByNameLike(String pattern);       // LIKE ? (you provide %)

    // Case insensitive
    List<User> findByNameIgnoreCase(String name);
    List<User> findByNameContainingIgnoreCase(String text);

    // Null checks
    List<User> findByMiddleNameIsNull();
    List<User> findByMiddleNameIsNotNull();


    // ═══════════════════════════════════════════════════════════════════════════
    // COLLECTION OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    // IN clause
    List<User> findByRoleIn(Collection<Role> roles);
    List<User> findByIdIn(List<Long> ids);
    List<User> findByStatusNotIn(List<Status> statuses);


    // ═══════════════════════════════════════════════════════════════════════════
    // SORTING
    // ═══════════════════════════════════════════════════════════════════════════

    // Built-in sorting
    List<User> findByActiveTrueOrderByCreatedAtDesc();
    List<User> findByDepartmentOrderByLastNameAscFirstNameAsc(String dept);

    // Dynamic sorting with Sort parameter
    List<User> findByRole(Role role, Sort sort);
    // Usage: findByRole(Role.ADMIN, Sort.by("lastName").ascending())


    // ═══════════════════════════════════════════════════════════════════════════
    // LIMITING RESULTS
    // ═══════════════════════════════════════════════════════════════════════════

    // First/Top
    Optional<User> findFirstByOrderByCreatedAtDesc();  // Latest user
    User findTopByOrderByScoreDesc();                  // Highest score

    // Top N
    List<User> findTop10ByOrderByScoreDesc();          // Top 10 by score
    List<User> findFirst5ByDepartmentOrderByHireDateAsc(String dept);


    // ═══════════════════════════════════════════════════════════════════════════
    // NESTED PROPERTIES (Entity Relationships)
    // ═══════════════════════════════════════════════════════════════════════════

    // Navigate relationships
    List<Order> findByUserEmail(String email);         // order.user.email
    List<Order> findByUserAddressCity(String city);    // order.user.address.city

    // Ambiguity resolution with underscore
    // If User has both "addressCity" field AND "address.city" nested...
    List<User> findByAddress_City(String city);        // Explicitly nested


    // ═══════════════════════════════════════════════════════════════════════════
    // PAGINATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Page (with total count - slightly slower)
    Page<User> findByActiveTrue(Pageable pageable);
    Page<User> findByRole(Role role, Pageable pageable);

    // Slice (without total count - faster for infinite scroll)
    Slice<User> findByDepartment(String dept, Pageable pageable);


    // ═══════════════════════════════════════════════════════════════════════════
    // EXISTS & COUNT
    // ═══════════════════════════════════════════════════════════════════════════

    boolean existsByEmail(String email);
    boolean existsByUsernameIgnoreCase(String username);

    long countByActiveTrue();
    long countByRole(Role role);
    long countByDepartmentAndActiveTrue(String department);


    // ═══════════════════════════════════════════════════════════════════════════
    // DELETE
    // ═══════════════════════════════════════════════════════════════════════════

    // Delete by property (returns count)
    long deleteByActiveFalse();
    long deleteByLastLoginBefore(LocalDateTime cutoff);

    // Delete with return value
    List<User> deleteByInactiveTrue();  // Returns deleted entities
}
```

### Query Method Keyword Reference

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    QUERY METHOD KEYWORDS                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  SUBJECT KEYWORDS (Start of method name):                                     │
│  ─────────────────────────────────────────                                    │
│  find...By      → Query returning result(s)                                   │
│  read...By      → Same as find                                                │
│  query...By     → Same as find                                                │
│  get...By       → Same as find                                                │
│  search...By    → Same as find                                                │
│  stream...By    → Returns Stream<T>                                           │
│  count...By     → Returns count                                               │
│  exists...By    → Returns boolean                                             │
│  delete...By    → Deletes matching entities                                   │
│  remove...By    → Same as delete                                              │
│                                                                               │
│  PREDICATE KEYWORDS (In property expression):                                 │
│  ─────────────────────────────────────────────                                │
│  And            → Combines conditions with AND                                │
│  Or             → Combines conditions with OR                                 │
│  Is, Equals     → Equality (default, can be omitted)                          │
│  Not, IsNot     → Negation                                                    │
│  Between        → Between two values (inclusive)                              │
│  LessThan       → <                                                           │
│  LessThanEqual  → <=                                                          │
│  GreaterThan    → >                                                           │
│  GreaterThanEqual → >=                                                        │
│  After          → > (for dates)                                               │
│  Before         → < (for dates)                                               │
│  IsNull         → IS NULL                                                     │
│  IsNotNull, NotNull → IS NOT NULL                                             │
│  Like           → LIKE (you provide %)                                        │
│  NotLike        → NOT LIKE                                                    │
│  StartingWith   → LIKE ?%                                                     │
│  EndingWith     → LIKE %?                                                     │
│  Containing     → LIKE %?%                                                    │
│  In             → IN (collection)                                             │
│  NotIn          → NOT IN                                                      │
│  True           → = true                                                      │
│  False          → = false                                                     │
│  IgnoreCase     → Case-insensitive comparison                                 │
│  OrderBy        → ORDER BY                                                    │
│                                                                               │
│  MODIFIERS:                                                                   │
│  ───────────                                                                  │
│  First, Top     → LIMIT 1                                                     │
│  FirstN, TopN   → LIMIT N (e.g., First10, Top5)                               │
│  Distinct       → SELECT DISTINCT                                             │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 7: Custom Queries (@Query)

```java
public interface UserRepository extends JpaRepository<User, Long> {

    // ═══════════════════════════════════════════════════════════════════════════
    // JPQL QUERIES (Java Persistence Query Language)
    // ═══════════════════════════════════════════════════════════════════════════

    // Basic JPQL - uses entity names and fields
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailCustom(@Param("email") String email);

    // Positional parameters (1-indexed)
    @Query("SELECT u FROM User u WHERE u.email = ?1 AND u.active = ?2")
    Optional<User> findByEmailAndActive(String email, boolean active);

    // Named parameters (clearer)
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.department = :dept")
    List<User> findByRoleAndDepartment(
        @Param("role") Role role,
        @Param("dept") String department
    );

    // JOIN queries
    @Query("SELECT u FROM User u JOIN u.orders o WHERE o.total > :minTotal")
    List<User> findUsersWithOrdersOver(@Param("minTotal") BigDecimal minTotal);

    // LEFT JOIN (include users without orders)
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.orders o WHERE o.total > :minTotal OR o IS NULL")
    List<User> findUsersWithOptionalOrders(@Param("minTotal") BigDecimal minTotal);

    // Fetch JOIN (eager load - prevent N+1)
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.active = true")
    List<User> findActiveUsersWithOrders();


    // ═══════════════════════════════════════════════════════════════════════════
    // JPQL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    // String functions
    @Query("SELECT u FROM User u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<User> searchByNameCaseInsensitive(@Param("name") String name);

    @Query("SELECT u FROM User u WHERE LENGTH(u.bio) > :minLength")
    List<User> findUsersWithLongBio(@Param("minLength") int minLength);

    // Date functions
    @Query("SELECT u FROM User u WHERE YEAR(u.createdAt) = :year")
    List<User> findUsersCreatedInYear(@Param("year") int year);

    @Query("SELECT u FROM User u WHERE u.createdAt >= CURRENT_DATE")
    List<User> findUsersCreatedToday();

    // Aggregate functions
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRoleQuery(@Param("role") Role role);

    @Query("SELECT AVG(u.age) FROM User u WHERE u.department = :dept")
    Double getAverageAge(@Param("dept") String department);


    // ═══════════════════════════════════════════════════════════════════════════
    // NATIVE SQL QUERIES
    // ═══════════════════════════════════════════════════════════════════════════

    // When you need database-specific features
    @Query(value = "SELECT * FROM users WHERE email = :email", nativeQuery = true)
    Optional<User> findByEmailNative(@Param("email") String email);

    // Complex native query with window function
    @Query(value = """
        SELECT u.*,
               RANK() OVER (PARTITION BY u.department ORDER BY u.salary DESC) as salary_rank
        FROM users u
        WHERE u.department = :dept
        """, nativeQuery = true)
    List<Object[]> findUsersWithSalaryRank(@Param("dept") String department);

    // Native pagination (need countQuery for total count)
    @Query(
        value = "SELECT * FROM users WHERE active = true ORDER BY created_at DESC",
        countQuery = "SELECT COUNT(*) FROM users WHERE active = true",
        nativeQuery = true
    )
    Page<User> findActiveUsersNative(Pageable pageable);


    // ═══════════════════════════════════════════════════════════════════════════
    // MODIFYING QUERIES (UPDATE/DELETE)
    // ═══════════════════════════════════════════════════════════════════════════

    @Modifying  // Required for UPDATE/DELETE
    @Query("UPDATE User u SET u.active = false WHERE u.lastLogin < :cutoff")
    int deactivateInactiveUsers(@Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Query("DELETE FROM User u WHERE u.active = false AND u.createdAt < :cutoff")
    int deleteInactiveUsers(@Param("cutoff") LocalDateTime cutoff);

    // Clear persistence context after modification
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.role = :role WHERE u.id = :id")
    int updateRole(@Param("id") Long id, @Param("role") Role role);


    // ═══════════════════════════════════════════════════════════════════════════
    // DTO PROJECTIONS (SELECT specific fields)
    // ═══════════════════════════════════════════════════════════════════════════

    // Constructor expression - maps to DTO
    @Query("SELECT new com.example.dto.UserSummary(u.id, u.name, u.email) " +
           "FROM User u WHERE u.active = true")
    List<UserSummary> findActiveUserSummaries();

    // Interface projection (Spring creates proxy)
    @Query("SELECT u.id as id, u.name as name, u.email as email FROM User u")
    List<UserProjection> findAllProjected();


    // ═══════════════════════════════════════════════════════════════════════════
    // DYNAMIC QUERIES WITH SpEL
    // ═══════════════════════════════════════════════════════════════════════════

    // Access entity name
    @Query("SELECT u FROM #{#entityName} u WHERE u.active = true")
    List<User> findAllActiveGeneric();

    // Conditional in SpEL
    @Query("SELECT u FROM User u WHERE " +
           "(:name IS NULL OR u.name LIKE %:name%) AND " +
           "(:email IS NULL OR u.email = :email)")
    List<User> searchUsers(
        @Param("name") String name,
        @Param("email") String email
    );
}


// Interface projection
public interface UserProjection {
    Long getId();
    String getName();
    String getEmail();

    // Computed property
    default String getDisplayName() {
        return getName() + " <" + getEmail() + ">";
    }
}
```

---

## Chapter 8: Specifications (Dynamic Queries)

```java
// When you need dynamic WHERE clauses based on user input

// 1. Add JpaSpecificationExecutor to repository
public interface UserRepository extends
        JpaRepository<User, Long>,
        JpaSpecificationExecutor<User> {
}


// 2. Create Specification classes
public class UserSpecifications {

    public static Specification<User> hasName(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isEmpty()) {
                return null;  // No filter
            }
            return cb.like(cb.lower(root.get("name")),
                          "%" + name.toLowerCase() + "%");
        };
    }

    public static Specification<User> hasEmail(String email) {
        return (root, query, cb) -> {
            if (email == null) return null;
            return cb.equal(root.get("email"), email);
        };
    }

    public static Specification<User> isActive() {
        return (root, query, cb) -> cb.equal(root.get("active"), true);
    }

    public static Specification<User> hasRole(Role role) {
        return (root, query, cb) -> {
            if (role == null) return null;
            return cb.equal(root.get("role"), role);
        };
    }

    public static Specification<User> createdAfter(LocalDateTime date) {
        return (root, query, cb) -> {
            if (date == null) return null;
            return cb.greaterThan(root.get("createdAt"), date);
        };
    }

    public static Specification<User> createdBetween(LocalDateTime start, LocalDateTime end) {
        return (root, query, cb) -> {
            if (start == null && end == null) return null;
            if (start == null) return cb.lessThan(root.get("createdAt"), end);
            if (end == null) return cb.greaterThan(root.get("createdAt"), start);
            return cb.between(root.get("createdAt"), start, end);
        };
    }

    // Join specification
    public static Specification<User> hasOrderWithTotal(BigDecimal minTotal) {
        return (root, query, cb) -> {
            if (minTotal == null) return null;
            Join<User, Order> orders = root.join("orders", JoinType.INNER);
            return cb.greaterThan(orders.get("total"), minTotal);
        };
    }
}


// 3. Use in service
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Page<User> searchUsers(UserSearchCriteria criteria, Pageable pageable) {
        Specification<User> spec = Specification.where(null);  // Start empty

        spec = spec.and(UserSpecifications.hasName(criteria.getName()));
        spec = spec.and(UserSpecifications.hasEmail(criteria.getEmail()));
        spec = spec.and(UserSpecifications.hasRole(criteria.getRole()));
        spec = spec.and(UserSpecifications.createdBetween(
            criteria.getCreatedFrom(), criteria.getCreatedTo()));

        if (criteria.isActiveOnly()) {
            spec = spec.and(UserSpecifications.isActive());
        }

        return userRepository.findAll(spec, pageable);
    }

    // Fluent API style
    public List<User> findActiveAdmins() {
        return userRepository.findAll(
            where(isActive())
                .and(hasRole(Role.ADMIN))
        );
    }
}


// Search criteria DTO
@Data
public class UserSearchCriteria {
    private String name;
    private String email;
    private Role role;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private boolean activeOnly;
}
```

---

## Chapter 9: Repository Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REPOSITORY BEST PRACTICES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. USE OPTIONAL FOR SINGLE RESULTS                                             │
│  ───────────────────────────────────────────                                    │
│  ✅ Optional<User> findByEmail(String email);                                    │
│  ❌ User findByEmail(String email);  // Returns null - error prone               │
│                                                                                 │
│                                                                                 │
│  2. PREFER DERIVED QUERIES FOR SIMPLE CASES                                     │
│  ─────────────────────────────────────────────                                  │
│  ✅ List<User> findByActiveTrue();  // Clear, type-safe                          │
│  ❌ @Query("SELECT u FROM User u WHERE u.active = true")  // Verbose             │
│                                                                                 │
│                                                                                 │
│  3. USE @Query FOR COMPLEX QUERIES                                              │
│  ─────────────────────────────────────                                          │
│  // When method name would be too long:                                         │
│  ✅ @Query("SELECT u FROM User u WHERE u.active = true " +                       │
│           "AND u.role IN :roles AND u.createdAt > :date")                       │
│  ❌ findByActiveTrueAndRoleInAndCreatedAtAfter(...)  // Too long!                │
│                                                                                 │
│                                                                                 │
│  4. USE FETCH JOIN TO PREVENT N+1                                               │
│  ───────────────────────────────────                                            │
│  ✅ @Query("SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id")     │
│  ❌ userRepo.findById(id);  // Then accessing orders causes N+1                  │
│     user.getOrders().forEach(...)  // Each order = 1 query!                     │
│                                                                                 │
│                                                                                 │
│  5. PAGINATE LARGE RESULTS                                                      │
│  ──────────────────────────────                                                 │
│  ✅ Page<User> findByActiveTrue(Pageable pageable);                              │
│  ❌ List<User> findByActiveTrue();  // Returns ALL matching rows!                │
│                                                                                 │
│                                                                                 │
│  6. USE PROJECTIONS FOR READ-ONLY DATA                                          │
│  ─────────────────────────────────────────                                      │
│  ✅ List<UserSummary> findAllUserSummaries();  // Select only needed fields      │
│  ❌ List<User> findAll();  // Loads all fields, all relationships                │
│                                                                                 │
│                                                                                 │
│  7. AVOID LOGIC IN REPOSITORY                                                   │
│  ──────────────────────────────                                                 │
│  Repository = just data access. Business logic goes in Service.                 │
│                                                                                 │
│                                                                                 │
│  8. USE @Modifying FOR BULK OPERATIONS                                          │
│  ──────────────────────────────────────────                                     │
│  @Modifying                                                                     │
│  @Query("UPDATE User u SET u.active = false WHERE u.lastLogin < :cutoff")       │
│  int deactivateInactive(@Param("cutoff") LocalDateTime cutoff);                 │
│  // Much faster than loading entities, modifying, and saving                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Custom Repository Implementation

```java
// When you need logic beyond what Spring Data provides

// 1. Custom interface
public interface UserRepositoryCustom {
    List<User> findUsersWithComplexCriteria(ComplexCriteria criteria);
    void bulkUpdateStatistics();
}

// 2. Implementation (must be named *Impl)
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepositoryCustom {

    private final EntityManager em;

    @Override
    public List<User> findUsersWithComplexCriteria(ComplexCriteria criteria) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<User> query = cb.createQuery(User.class);
        Root<User> user = query.from(User.class);

        List<Predicate> predicates = new ArrayList<>();

        // Build predicates based on criteria...

        query.where(predicates.toArray(new Predicate[0]));

        return em.createQuery(query).getResultList();
    }

    @Override
    @Transactional
    public void bulkUpdateStatistics() {
        em.createNativeQuery("""
            UPDATE users u
            SET order_count = (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id),
                total_spent = (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.user_id = u.id)
            """)
            .executeUpdate();
    }
}

// 3. Extend both interfaces
public interface UserRepository extends
        JpaRepository<User, Long>,
        UserRepositoryCustom {  // Also extends custom!

    // Spring Data methods + custom methods
}

// 4. Usage (unified)
@Service
public class UserService {
    private final UserRepository userRepository;  // One repository

    public List<User> search(ComplexCriteria criteria) {
        return userRepository.findUsersWithComplexCriteria(criteria);  // Custom
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);  // Spring Data
    }
}
```

---

# 📋 SERVICE & REPOSITORY CHECKLIST

```
SERVICE LAYER:
□ @Service + @RequiredArgsConstructor + @Slf4j
□ All dependencies are final (immutable)
□ @Transactional on class (default) + @Transactional(readOnly=true) on reads
□ Return DTOs, not entities
□ Log important operations
□ Throw meaningful exceptions (not generic Exception)
□ Private helper methods for complex logic

REPOSITORY LAYER:
□ Extend JpaRepository<Entity, IdType>
□ Use Optional<T> for single-result queries
□ Use Page<T> or Slice<T> for large result sets
□ Use @Query for complex queries (JPQL or native)
□ Use @Modifying for UPDATE/DELETE
□ Use projections for read-only DTOs
□ Add JpaSpecificationExecutor for dynamic queries
□ Consider custom repository for complex logic
```

---

_Continue to Part 7: Controllers & REST API Best Practices_


---

> **Navigation**: [< Previous](07_Spring_Boot_Part5_Lombok_DTOs.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](09_Spring_Boot_Part7_Controllers_REST.md)