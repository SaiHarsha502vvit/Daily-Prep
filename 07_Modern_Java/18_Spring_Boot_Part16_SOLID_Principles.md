# 🏗️ SPRING BOOT MASTERY - Part 16: SOLID Principles Deep Dive

> **Object-Oriented Design Principles with Real Spring Examples**
> _"Write maintainable, flexible, and robust code"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Learn SOLID Principles?                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Reduces bugs: Changes don't break existing functionality                    │
│  • Interview essential: Asked in every senior Java interview                   │
│  • Spring is built on SOLID (IoC = DIP, @Component = SRP)                     │
│  • Enables testability: Well-designed code is easy to test                    │
│  • Team scalability: Multiple devs can work without conflicts                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How to Apply SOLID?                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • S: One class = One responsibility (UserService only handles users)         │
│  • O: Extend behavior without modifying existing code (Strategy pattern)      │
│  • L: Subtypes must be substitutable for their base types                     │
│  • I: Many specific interfaces > one general interface                        │
│  • D: Depend on abstractions, not concrete implementations                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Apply Each Principle?                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • SRP: Class has more than one reason to change → Split it                   │
│  • OCP: Adding feature requires modifying existing code → Use abstraction     │
│  • LSP: Subclass throws exceptions parent doesn't → Redesign hierarchy        │
│  • ISP: Class implements methods it doesn't need → Split interface            │
│  • DIP: Hard to test due to concrete dependencies → Inject interfaces         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Principles are Most Critical in Spring?                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     DIP (entire IoC is based on it), SRP (service layer design)   │
│  IMPORTANT:     OCP (extensible configurations), ISP (repository interfaces)  │
│  ADVANCED:      LSP (exception handling hierarchies)                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# TABLE OF CONTENTS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WHAT THIS PART COVERS                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. S - Single Responsibility Principle (SRP)                                  │
│  2. O - Open/Closed Principle (OCP)                                            │
│  3. L - Liskov Substitution Principle (LSP)                                    │
│  4. I - Interface Segregation Principle (ISP)                                  │
│  5. D - Dependency Inversion Principle (DIP)                                   │
│  6. Complete Spring Boot Project Example                                        │
│  7. Common Violations & Refactoring                                            │
│  8. SOLID in Microservices                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# WHY SOLID MATTERS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              THE COST OF VIOLATING SOLID                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITHOUT SOLID:                                                                 │
│  • Adding features breaks existing code                                        │
│  • Testing requires complex setup                                              │
│  • Changes ripple through the codebase                                         │
│  • Code becomes "fragile" - fix one bug, create three                         │
│  • New team members struggle to understand                                     │
│                                                                                  │
│  WITH SOLID:                                                                    │
│  • Features can be added without modifying existing code                       │
│  • Each class can be tested in isolation                                       │
│  • Changes are localized                                                       │
│  • Code is modular and replaceable                                             │
│  • The system is easier to understand                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 1: SINGLE RESPONSIBILITY PRINCIPLE (SRP)

---

## Chapter 1: "A class should have only one reason to change"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              SINGLE RESPONSIBILITY PRINCIPLE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  KEY INSIGHT: "One reason to change" = "One actor/stakeholder"                 │
│                                                                                  │
│  If your class changes because:                                                 │
│  • Business rules change → One responsibility                                  │
│  • Database schema changes → Another responsibility                            │
│  • UI requirements change → Another responsibility                             │
│                                                                                  │
│  Then your class has MULTIPLE responsibilities!                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ❌ VIOLATING SRP

```java
/**
 * VIOLATION: This class has 4 reasons to change:
 * 1. Business rules (calculateTotalPrice)
 * 2. Database logic (saveToDatabase)
 * 3. Notification logic (sendConfirmationEmail)
 * 4. Report generation (generateReport)
 */
@Service
public class OrderService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private JavaMailSender mailSender;

    public void processOrder(Order order) {
        // Business logic
        double total = calculateTotalPrice(order);
        order.setTotal(total);
        
        // Database logic
        saveToDatabase(order);
        
        // Notification logic
        sendConfirmationEmail(order);
        
        // Reporting logic
        generateReport(order);
    }
    
    private double calculateTotalPrice(Order order) {
        double subtotal = order.getItems().stream()
            .mapToDouble(item -> item.getPrice() * item.getQuantity())
            .sum();
        double tax = subtotal * 0.1;
        double discount = calculateDiscount(order);
        return subtotal + tax - discount;
    }
    
    private double calculateDiscount(Order order) {
        if (order.getCustomer().isPremium()) {
            return order.getTotal() * 0.15;
        }
        return 0;
    }
    
    private void saveToDatabase(Order order) {
        jdbcTemplate.update(
            "INSERT INTO orders (id, customer_id, total, status) VALUES (?, ?, ?, ?)",
            order.getId(), order.getCustomer().getId(), order.getTotal(), "PENDING"
        );
        
        for (OrderItem item : order.getItems()) {
            jdbcTemplate.update(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                order.getId(), item.getProduct().getId(), item.getQuantity(), item.getPrice()
            );
        }
    }
    
    private void sendConfirmationEmail(Order order) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getCustomer().getEmail());
        message.setSubject("Order Confirmation #" + order.getId());
        message.setText("Thank you for your order. Total: $" + order.getTotal());
        mailSender.send(message);
    }
    
    private void generateReport(Order order) {
        // Generate PDF report...
        String html = "<html><body><h1>Order Report</h1>...</body></html>";
        // Convert to PDF...
        // Save to filesystem...
    }
}
```

### ✅ APPLYING SRP

```java
// ============== SEPARATED CONCERNS ==============

/**
 * OrderService - ONLY orchestrates the order process
 * Single reason to change: Order processing workflow changes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderPricingService pricingService;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final ReportService reportService;

    @Transactional
    public OrderResponse processOrder(CreateOrderRequest request) {
        log.info("Processing order for customer: {}", request.getCustomerId());
        
        // Delegate to specialized services
        Order order = createOrder(request);
        
        // Calculate pricing (delegated)
        OrderPricing pricing = pricingService.calculatePricing(order);
        order.applyPricing(pricing);
        
        // Persist (delegated)
        Order savedOrder = orderRepository.save(order);
        
        // Notifications (delegated, async)
        notificationService.sendOrderConfirmation(savedOrder);
        
        // Reporting (delegated, async)
        reportService.generateOrderReport(savedOrder);
        
        return OrderResponse.from(savedOrder);
    }
    
    private Order createOrder(CreateOrderRequest request) {
        return Order.builder()
            .customerId(request.getCustomerId())
            .items(request.getItems().stream()
                .map(this::toOrderItem)
                .collect(Collectors.toList()))
            .status(OrderStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .build();
    }
    
    private OrderItem toOrderItem(OrderItemRequest request) {
        return OrderItem.builder()
            .productId(request.getProductId())
            .quantity(request.getQuantity())
            .unitPrice(request.getPrice())
            .build();
    }
}

/**
 * OrderPricingService - ONLY handles pricing calculations
 * Single reason to change: Pricing rules change
 */
@Service
@RequiredArgsConstructor
public class OrderPricingService {

    private final DiscountService discountService;
    private final TaxService taxService;

    public OrderPricing calculatePricing(Order order) {
        BigDecimal subtotal = calculateSubtotal(order);
        BigDecimal discount = discountService.calculateDiscount(order, subtotal);
        BigDecimal tax = taxService.calculateTax(subtotal.subtract(discount));
        BigDecimal total = subtotal.subtract(discount).add(tax);
        
        return OrderPricing.builder()
            .subtotal(subtotal)
            .discount(discount)
            .tax(tax)
            .total(total)
            .build();
    }
    
    private BigDecimal calculateSubtotal(Order order) {
        return order.getItems().stream()
            .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

/**
 * DiscountService - ONLY handles discount calculations
 * Single reason to change: Discount rules change
 */
@Service
@RequiredArgsConstructor
public class DiscountService {

    private final CustomerRepository customerRepository;

    public BigDecimal calculateDiscount(Order order, BigDecimal subtotal) {
        Customer customer = customerRepository.findById(order.getCustomerId())
            .orElseThrow(() -> new CustomerNotFoundException(order.getCustomerId()));
        
        if (customer.getTier() == CustomerTier.PREMIUM) {
            return subtotal.multiply(BigDecimal.valueOf(0.15));
        } else if (customer.getTier() == CustomerTier.GOLD) {
            return subtotal.multiply(BigDecimal.valueOf(0.10));
        }
        
        return BigDecimal.ZERO;
    }
}

/**
 * TaxService - ONLY handles tax calculations
 * Single reason to change: Tax regulations change
 */
@Service
public class TaxService {

    private static final BigDecimal TAX_RATE = BigDecimal.valueOf(0.10);

    public BigDecimal calculateTax(BigDecimal taxableAmount) {
        return taxableAmount.multiply(TAX_RATE);
    }
}

/**
 * NotificationService - ONLY handles notifications
 * Single reason to change: Notification requirements change
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;
    private final SmsService smsService;

    @Async
    public void sendOrderConfirmation(Order order) {
        try {
            emailService.sendOrderConfirmationEmail(order);
            
            if (order.getCustomer().isSmsEnabled()) {
                smsService.sendOrderConfirmationSms(order);
            }
        } catch (Exception e) {
            log.error("Failed to send notification for order: {}", order.getId(), e);
            // Don't fail the order process due to notification failure
        }
    }
}

/**
 * EmailService - ONLY handles email sending
 * Single reason to change: Email infrastructure changes
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;

    public void sendOrderConfirmationEmail(Order order) {
        String body = templateService.generateOrderConfirmationBody(order);
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getCustomer().getEmail());
        message.setSubject("Order Confirmation #" + order.getId());
        message.setText(body);
        
        mailSender.send(message);
    }
}

/**
 * ReportService - ONLY handles report generation
 * Single reason to change: Report format/requirements change
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final PdfGenerator pdfGenerator;
    private final ReportRepository reportRepository;

    @Async
    public void generateOrderReport(Order order) {
        byte[] pdfContent = pdfGenerator.generateOrderReport(order);
        
        Report report = Report.builder()
            .orderId(order.getId())
            .content(pdfContent)
            .generatedAt(LocalDateTime.now())
            .build();
        
        reportRepository.save(report);
    }
}
```

---

# SECTION 2: OPEN/CLOSED PRINCIPLE (OCP)

---

## Chapter 2: "Open for extension, closed for modification"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              OPEN/CLOSED PRINCIPLE                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  KEY INSIGHT: Add NEW behavior without changing EXISTING code                   │
│                                                                                  │
│  "Open for extension"    = You can add new functionality                        │
│  "Closed for modification" = Without changing existing code                     │
│                                                                                  │
│  ACHIEVED THROUGH:                                                               │
│  • Abstraction (interfaces/abstract classes)                                    │
│  • Composition over inheritance                                                 │
│  • Strategy pattern                                                             │
│  • Plugin architecture                                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ❌ VIOLATING OCP

```java
/**
 * VIOLATION: Adding a new payment method requires modifying this class
 * Every new payment type = another if/else branch
 */
@Service
public class PaymentService {

    @Autowired
    private StripeClient stripeClient;
    
    @Autowired
    private PayPalClient payPalClient;

    public PaymentResult processPayment(Order order, PaymentMethod method) {
        
        if (method == PaymentMethod.CREDIT_CARD) {
            // Credit card logic
            return stripeClient.charge(
                order.getTotal(),
                order.getCreditCardToken()
            );
        } 
        else if (method == PaymentMethod.PAYPAL) {
            // PayPal logic
            return payPalClient.executePayment(
                order.getPayPalPaymentId()
            );
        }
        else if (method == PaymentMethod.BANK_TRANSFER) {
            // Bank transfer logic - ADDED LATER (modified existing code!)
            return processBankTransfer(order);
        }
        else if (method == PaymentMethod.CRYPTO) {
            // Crypto logic - ADDED EVEN LATER (modified again!)
            return processCrypto(order);
        }
        // Every new payment method = more modification!
        
        throw new UnsupportedPaymentMethodException(method);
    }
    
    private PaymentResult processBankTransfer(Order order) { ... }
    private PaymentResult processCrypto(Order order) { ... }
}
```

### ✅ APPLYING OCP - Strategy Pattern

```java
// ============== STRATEGY INTERFACE ==============

/**
 * PaymentProcessor - The abstraction
 * Add new payment methods by ADDING new implementations
 * The PaymentService never needs to change!
 */
public interface PaymentProcessor {
    
    /**
     * @return true if this processor can handle the payment request
     */
    boolean supports(PaymentRequest request);
    
    /**
     * Process the payment
     */
    PaymentResult process(PaymentRequest request);
    
    /**
     * Get the payment method this processor handles
     */
    PaymentMethod getPaymentMethod();
}

// ============== CONCRETE IMPLEMENTATIONS ==============

@Component
@RequiredArgsConstructor
@Slf4j
public class CreditCardPaymentProcessor implements PaymentProcessor {

    private final StripeClient stripeClient;

    @Override
    public boolean supports(PaymentRequest request) {
        return request.getMethod() == PaymentMethod.CREDIT_CARD;
    }

    @Override
    public PaymentResult process(PaymentRequest request) {
        log.info("Processing credit card payment: {}", request.getOrderId());
        
        CreditCardDetails details = (CreditCardDetails) request.getPaymentDetails();
        
        StripeChargeRequest stripeRequest = StripeChargeRequest.builder()
            .amount(request.getAmount())
            .currency(request.getCurrency())
            .token(details.getToken())
            .description("Order #" + request.getOrderId())
            .build();
        
        StripeChargeResponse response = stripeClient.charge(stripeRequest);
        
        return PaymentResult.builder()
            .success(response.isSuccessful())
            .transactionId(response.getChargeId())
            .message(response.getMessage())
            .build();
    }

    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.CREDIT_CARD;
    }
}

@Component
@RequiredArgsConstructor
@Slf4j
public class PayPalPaymentProcessor implements PaymentProcessor {

    private final PayPalClient payPalClient;

    @Override
    public boolean supports(PaymentRequest request) {
        return request.getMethod() == PaymentMethod.PAYPAL;
    }

    @Override
    public PaymentResult process(PaymentRequest request) {
        log.info("Processing PayPal payment: {}", request.getOrderId());
        
        PayPalDetails details = (PayPalDetails) request.getPaymentDetails();
        
        PayPalExecuteResponse response = payPalClient.executePayment(
            details.getPaymentId(),
            details.getPayerId()
        );
        
        return PaymentResult.builder()
            .success(response.getState().equals("approved"))
            .transactionId(response.getId())
            .message(response.getState())
            .build();
    }

    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.PAYPAL;
    }
}

/**
 * NEW PAYMENT METHOD - Just add a new class!
 * No modification to existing code required
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CryptoPaymentProcessor implements PaymentProcessor {

    private final CryptoGatewayClient cryptoClient;

    @Override
    public boolean supports(PaymentRequest request) {
        return request.getMethod() == PaymentMethod.CRYPTO;
    }

    @Override
    public PaymentResult process(PaymentRequest request) {
        log.info("Processing crypto payment: {}", request.getOrderId());
        
        CryptoDetails details = (CryptoDetails) request.getPaymentDetails();
        
        CryptoPaymentResponse response = cryptoClient.processPayment(
            details.getWalletAddress(),
            details.getCryptoCurrency(),
            request.getAmount()
        );
        
        return PaymentResult.builder()
            .success(response.isConfirmed())
            .transactionId(response.getTxHash())
            .message(response.getStatus())
            .build();
    }

    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.CRYPTO;
    }
}

// ============== PAYMENT SERVICE - CLOSED FOR MODIFICATION ==============

/**
 * PaymentService - Uses all available processors
 * NEVER needs to change when adding new payment methods!
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    // Spring automatically injects ALL PaymentProcessor implementations
    private final List<PaymentProcessor> paymentProcessors;

    public PaymentResult processPayment(PaymentRequest request) {
        log.info("Processing payment for order {} with method {}", 
            request.getOrderId(), request.getMethod());
        
        PaymentProcessor processor = findProcessor(request);
        
        return processor.process(request);
    }
    
    private PaymentProcessor findProcessor(PaymentRequest request) {
        return paymentProcessors.stream()
            .filter(p -> p.supports(request))
            .findFirst()
            .orElseThrow(() -> new UnsupportedPaymentMethodException(
                "No processor found for: " + request.getMethod()
            ));
    }
    
    public List<PaymentMethod> getAvailablePaymentMethods() {
        return paymentProcessors.stream()
            .map(PaymentProcessor::getPaymentMethod)
            .collect(Collectors.toList());
    }
}

// ============== SPRING AUTO-DISCOVERY ==============

/**
 * Spring automatically discovers all @Component classes implementing PaymentProcessor
 * Adding a new payment method is as simple as:
 * 1. Create a new class implementing PaymentProcessor
 * 2. Annotate with @Component
 * 3. Done! No other changes needed.
 */
```

### OCP with Decorator Pattern

```java
/**
 * Example: Adding behavior to notifications without modifying existing code
 */

// Base interface
public interface NotificationSender {
    void send(Notification notification);
}

// Base implementation
@Component("emailNotificationSender")
public class EmailNotificationSender implements NotificationSender {
    
    @Override
    public void send(Notification notification) {
        // Send email
        System.out.println("Sending email: " + notification.getMessage());
    }
}

// Decorator - adds logging without modifying EmailNotificationSender
@Component
@Primary
public class LoggingNotificationDecorator implements NotificationSender {

    private final NotificationSender delegate;

    public LoggingNotificationDecorator(
            @Qualifier("emailNotificationSender") NotificationSender delegate) {
        this.delegate = delegate;
    }

    @Override
    public void send(Notification notification) {
        log.info("About to send notification: {}", notification.getId());
        long startTime = System.currentTimeMillis();
        
        delegate.send(notification);
        
        long duration = System.currentTimeMillis() - startTime;
        log.info("Notification sent in {}ms", duration);
    }
}

// Another decorator - adds retry without modifying existing code
@Component
public class RetryableNotificationDecorator implements NotificationSender {

    private final NotificationSender delegate;
    private final int maxRetries = 3;

    public RetryableNotificationDecorator(
            @Qualifier("loggingNotificationDecorator") NotificationSender delegate) {
        this.delegate = delegate;
    }

    @Override
    public void send(Notification notification) {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                delegate.send(notification);
                return;
            } catch (Exception e) {
                attempts++;
                if (attempts >= maxRetries) {
                    throw e;
                }
                log.warn("Retry attempt {} for notification {}", attempts, notification.getId());
            }
        }
    }
}
```

---

# SECTION 3: LISKOV SUBSTITUTION PRINCIPLE (LSP)

---

## Chapter 3: "Subtypes must be substitutable for their base types"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              LISKOV SUBSTITUTION PRINCIPLE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  If S is a subtype of T, then objects of type T can be replaced                │
│  with objects of type S without breaking the program.                          │
│                                                                                  │
│  IN PRACTICE:                                                                   │
│  • Subclass methods should not throw new exceptions                            │
│  • Subclass methods should accept same or broader input                        │
│  • Subclass methods should return same or narrower output                      │
│  • Subclass should honor base class contracts (preconditions, postconditions)  │
│                                                                                  │
│  THE CLASSIC VIOLATION: Rectangle/Square problem                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ❌ CLASSIC LSP VIOLATION

```java
/**
 * VIOLATION: Square is NOT a proper subtype of Rectangle
 * Code that works with Rectangle breaks when given a Square
 */
public class Rectangle {
    protected int width;
    protected int height;
    
    public void setWidth(int width) {
        this.width = width;
    }
    
    public void setHeight(int height) {
        this.height = height;
    }
    
    public int getArea() {
        return width * height;
    }
}

public class Square extends Rectangle {
    
    @Override
    public void setWidth(int width) {
        // Violates LSP - changes behavior unexpectedly
        this.width = width;
        this.height = width;  // Also changes height!
    }
    
    @Override
    public void setHeight(int height) {
        // Violates LSP - changes behavior unexpectedly
        this.width = height;  // Also changes width!
        this.height = height;
    }
}

// This test FAILS with Square but PASSES with Rectangle
public void testRectangle(Rectangle rect) {
    rect.setWidth(5);
    rect.setHeight(4);
    
    // Expected: 20
    // With Rectangle: 20 ✓
    // With Square: 16 ✗ (5*5 then 4*4 = 16)
    assert rect.getArea() == 20;
}
```

### ❌ LSP VIOLATION IN SPRING

```java
/**
 * VIOLATION: ReadOnlyUserRepository breaks UserRepository contract
 */
public interface UserRepository {
    User save(User user);
    Optional<User> findById(Long id);
    void delete(Long id);
}

@Repository
public class JpaUserRepository implements UserRepository {
    
    @Override
    public User save(User user) {
        return entityManager.merge(user);
    }
    
    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(entityManager.find(User.class, id));
    }
    
    @Override
    public void delete(Long id) {
        User user = entityManager.find(User.class, id);
        if (user != null) {
            entityManager.remove(user);
        }
    }
}

/**
 * VIOLATES LSP!
 * Code using UserRepository expects save() and delete() to work
 * This implementation breaks that expectation
 */
@Repository
public class ReadOnlyUserRepository implements UserRepository {
    
    @Override
    public User save(User user) {
        throw new UnsupportedOperationException("Read-only repository!");
    }
    
    @Override
    public Optional<User> findById(Long id) {
        // This works...
    }
    
    @Override
    public void delete(Long id) {
        throw new UnsupportedOperationException("Read-only repository!");
    }
}

// Any code using UserRepository will break with ReadOnlyUserRepository
public class UserService {
    private final UserRepository userRepository;
    
    public void createUser(User user) {
        userRepository.save(user);  // BOOM! UnsupportedOperationException
    }
}
```

### ✅ APPLYING LSP

```java
// ============== PROPER INTERFACE SEGREGATION ==============

/**
 * SOLUTION: Separate read and write contracts
 */
public interface UserReader {
    Optional<User> findById(Long id);
    List<User> findAll();
    boolean existsById(Long id);
}

public interface UserWriter {
    User save(User user);
    void delete(Long id);
}

// Full repository implements both
public interface UserRepository extends UserReader, UserWriter {
}

@Repository
public class JpaUserRepository implements UserRepository {
    
    @Override
    public User save(User user) {
        return entityManager.merge(user);
    }
    
    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(entityManager.find(User.class, id));
    }
    
    @Override
    public void delete(Long id) {
        User user = entityManager.find(User.class, id);
        if (user != null) {
            entityManager.remove(user);
        }
    }
    
    @Override
    public List<User> findAll() {
        return entityManager.createQuery("SELECT u FROM User u", User.class)
            .getResultList();
    }
    
    @Override
    public boolean existsById(Long id) {
        return findById(id).isPresent();
    }
}

// Read-only service only depends on UserReader - LSP satisfied!
@Service
public class UserQueryService {
    private final UserReader userReader;  // Only needs read operations
    
    public UserQueryService(UserReader userReader) {
        this.userReader = userReader;
    }
    
    public UserDto findUser(Long id) {
        return userReader.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
}

// Write service uses full repository
@Service
public class UserCommandService {
    private final UserRepository userRepository;  // Needs both read and write
    
    public UserCommandService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        User user = toEntity(request);
        User saved = userRepository.save(user);
        return toDto(saved);
    }
}
```

### LSP in Exception Handling

```java
/**
 * LSP Rule: Subtypes should not throw new/unexpected exceptions
 */

// ❌ VIOLATION
public interface DataProcessor {
    void process(String data);  // No checked exceptions declared
}

public class FileDataProcessor implements DataProcessor {
    @Override
    public void process(String data) {
        // Forces callers to handle IOException they didn't expect!
        throw new IOException("File error");  // Compile error (checked exception)
    }
}

// ✅ CORRECT - Use runtime exceptions or declare in interface
public interface DataProcessor {
    void process(String data) throws ProcessingException;  // Declared!
}

public class ProcessingException extends RuntimeException {
    public ProcessingException(String message) {
        super(message);
    }
    
    public ProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}

public class FileDataProcessor implements DataProcessor {
    @Override
    public void process(String data) throws ProcessingException {
        try {
            // File operations...
        } catch (IOException e) {
            throw new ProcessingException("Failed to process file", e);
        }
    }
}

public class DatabaseDataProcessor implements DataProcessor {
    @Override
    public void process(String data) throws ProcessingException {
        try {
            // Database operations...
        } catch (SQLException e) {
            throw new ProcessingException("Failed to process database", e);
        }
    }
}
```

---

# SECTION 4: INTERFACE SEGREGATION PRINCIPLE (ISP)

---

## Chapter 4: "Clients should not be forced to depend on interfaces they don't use"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              INTERFACE SEGREGATION PRINCIPLE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FAT INTERFACE PROBLEMS:                                                        │
│  • Implementing classes forced to provide dummy implementations                 │
│  • Changes to unused methods affect implementers                               │
│  • Hard to understand what's actually needed                                   │
│                                                                                  │
│  SOLUTION: Small, focused interfaces                                           │
│  • Each interface represents one capability                                    │
│  • Classes implement only what they need                                       │
│  • Easier to test and mock                                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ❌ VIOLATING ISP - Fat Interface

```java
/**
 * VIOLATION: "Fat" interface forces implementers to provide
 * methods they don't need or support
 */
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
    void submitTimesheet();
    void codeReview();
    void deployToProduction();
}

// Human worker uses all methods - OK
public class HumanWorker implements Worker {
    @Override public void work() { /* Working */ }
    @Override public void eat() { /* Eating */ }
    @Override public void sleep() { /* Sleeping */ }
    @Override public void attendMeeting() { /* In meeting */ }
    @Override public void submitTimesheet() { /* Submitting */ }
    @Override public void codeReview() { /* Reviewing */ }
    @Override public void deployToProduction() { /* Deploying */ }
}

// Robot worker - forced to implement methods that don't apply!
public class RobotWorker implements Worker {
    @Override public void work() { /* Working */ }
    
    @Override public void eat() { 
        throw new UnsupportedOperationException("Robots don't eat!");
    }
    
    @Override public void sleep() { 
        throw new UnsupportedOperationException("Robots don't sleep!");
    }
    
    @Override public void attendMeeting() {
        throw new UnsupportedOperationException("Robots can't attend meetings!");
    }
    
    @Override public void submitTimesheet() {
        throw new UnsupportedOperationException("Robots don't have timesheets!");
    }
    
    @Override public void codeReview() { /* Can do */ }
    @Override public void deployToProduction() { /* Can do */ }
}
```

### ✅ APPLYING ISP - Segregated Interfaces

```java
// ============== SEGREGATED INTERFACES ==============

/**
 * Small, focused interfaces - each represents one capability
 */
public interface Workable {
    void work();
}

public interface Feedable {
    void eat();
    void sleep();
}

public interface Meetable {
    void attendMeeting();
}

public interface Trackable {
    void submitTimesheet();
}

public interface CodeReviewer {
    void codeReview();
}

public interface Deployer {
    void deployToProduction();
}

// ============== IMPLEMENTATIONS ==============

/**
 * Human implements all relevant interfaces
 */
@Component
public class HumanDeveloper implements 
        Workable, Feedable, Meetable, Trackable, CodeReviewer, Deployer {
    
    @Override public void work() { log.info("Coding..."); }
    @Override public void eat() { log.info("Lunch break"); }
    @Override public void sleep() { log.info("Zzz..."); }
    @Override public void attendMeeting() { log.info("In standup"); }
    @Override public void submitTimesheet() { log.info("Submitted hours"); }
    @Override public void codeReview() { log.info("Reviewing PR"); }
    @Override public void deployToProduction() { log.info("Deploying..."); }
}

/**
 * Robot only implements what it can actually do
 */
@Component
public class RobotWorker implements Workable, CodeReviewer, Deployer {
    
    @Override public void work() { log.info("Automated task running"); }
    @Override public void codeReview() { log.info("Static analysis complete"); }
    @Override public void deployToProduction() { log.info("CI/CD pipeline triggered"); }
}

/**
 * Contractor - implements subset
 */
@Component
public class Contractor implements Workable, Trackable, CodeReviewer {
    
    @Override public void work() { log.info("Working on task"); }
    @Override public void submitTimesheet() { log.info("Invoice submitted"); }
    @Override public void codeReview() { log.info("Reviewing..."); }
}

// ============== SERVICES DEPEND ON SPECIFIC INTERFACES ==============

/**
 * MeetingScheduler only needs Meetable workers
 */
@Service
public class MeetingScheduler {
    private final List<Meetable> meetableWorkers;
    
    public MeetingScheduler(List<Meetable> meetableWorkers) {
        this.meetableWorkers = meetableWorkers;
    }
    
    public void scheduleDailyStandup() {
        meetableWorkers.forEach(Meetable::attendMeeting);
    }
}

/**
 * DeploymentService only needs Deployer capability
 */
@Service
public class DeploymentService {
    private final List<Deployer> deployers;
    
    public DeploymentService(List<Deployer> deployers) {
        this.deployers = deployers;
    }
    
    public void deployAll() {
        deployers.forEach(Deployer::deployToProduction);
    }
}

/**
 * TimesheetService only needs Trackable workers
 */
@Service
public class TimesheetService {
    private final List<Trackable> trackableWorkers;
    
    public TimesheetService(List<Trackable> trackableWorkers) {
        this.trackableWorkers = trackableWorkers;
    }
    
    public void collectTimesheets() {
        trackableWorkers.forEach(Trackable::submitTimesheet);
    }
}
```

### ISP in Spring Data Repositories

```java
/**
 * Spring Data repositories are a GREAT example of ISP
 */

// Base interfaces - segregated by capability
public interface Repository<T, ID> {
    // Marker interface
}

public interface CrudRepository<T, ID> extends Repository<T, ID> {
    <S extends T> S save(S entity);
    Optional<T> findById(ID id);
    Iterable<T> findAll();
    void deleteById(ID id);
    // ... basic CRUD
}

public interface PagingAndSortingRepository<T, ID> extends CrudRepository<T, ID> {
    Page<T> findAll(Pageable pageable);
    Iterable<T> findAll(Sort sort);
}

public interface JpaRepository<T, ID> extends PagingAndSortingRepository<T, ID> {
    void flush();
    <S extends T> S saveAndFlush(S entity);
    void deleteInBatch(Iterable<T> entities);
    // ... JPA-specific methods
}

// You choose the level you need:

// Only need basic CRUD
public interface UserRepository extends CrudRepository<User, Long> {}

// Need paging too
public interface ProductRepository extends PagingAndSortingRepository<Product, Long> {}

// Need all JPA features
public interface OrderRepository extends JpaRepository<Order, Long> {}
```

---

# SECTION 5: DEPENDENCY INVERSION PRINCIPLE (DIP)

---

## Chapter 5: "Depend on abstractions, not concretions"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              DEPENDENCY INVERSION PRINCIPLE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HIGH-LEVEL MODULES should not depend on LOW-LEVEL MODULES                     │
│  BOTH should depend on ABSTRACTIONS                                             │
│                                                                                  │
│  ❌ WRONG:                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                             │
│  │  OrderService    │────────►│  MySQLRepository │                             │
│  │  (High-level)    │         │  (Low-level)     │                             │
│  └──────────────────┘         └──────────────────┘                             │
│                                                                                  │
│  ✅ RIGHT:                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                             │
│  │  OrderService    │────────►│  Repository      │◄─────────┐                  │
│  │  (High-level)    │         │  (Abstraction)   │          │                  │
│  └──────────────────┘         └──────────────────┘          │                  │
│                                        ▲                     │                  │
│                                        │                     │                  │
│                               ┌────────┴────────┐           │                  │
│                               │ MySQLRepository │           │                  │
│                               │ (Low-level)     │           │                  │
│                               └─────────────────┘           │                  │
│                               ┌─────────────────┐           │                  │
│                               │ PostgresRepo    │───────────┘                  │
│                               └─────────────────┘                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ❌ VIOLATING DIP

```java
/**
 * VIOLATION: High-level OrderService directly depends on low-level MySQL
 */
public class OrderService {

    // Direct dependency on concrete implementation!
    private final MySQLOrderRepository repository = new MySQLOrderRepository();
    
    // Direct dependency on concrete email client!
    private final SmtpEmailClient emailClient = new SmtpEmailClient();
    
    // Direct dependency on concrete payment gateway!
    private final StripePaymentGateway paymentGateway = new StripePaymentGateway();

    public void processOrder(Order order) {
        // Tightly coupled to specific implementations
        // Can't swap MySQL for PostgreSQL
        // Can't swap SMTP for SendGrid
        // Can't swap Stripe for PayPal
        // Can't unit test without real MySQL, SMTP, Stripe!
        
        repository.save(order);
        emailClient.send(order.getCustomerEmail(), "Order confirmed");
        paymentGateway.charge(order.getTotal(), order.getCardToken());
    }
}
```

### ✅ APPLYING DIP with Spring

```java
// ============== ABSTRACTIONS ==============

public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(Long id);
    List<Order> findByCustomerId(Long customerId);
}

public interface EmailSender {
    void send(String to, String subject, String body);
}

public interface PaymentGateway {
    PaymentResult charge(BigDecimal amount, PaymentDetails details);
}

// ============== LOW-LEVEL IMPLEMENTATIONS ==============

@Repository
public class JpaOrderRepository implements OrderRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    @Override
    public Order save(Order order) {
        return em.merge(order);
    }
    
    @Override
    public Optional<Order> findById(Long id) {
        return Optional.ofNullable(em.find(Order.class, id));
    }
    
    @Override
    public List<Order> findByCustomerId(Long customerId) {
        return em.createQuery(
            "SELECT o FROM Order o WHERE o.customerId = :customerId", 
            Order.class)
            .setParameter("customerId", customerId)
            .getResultList();
    }
}

@Component
@Profile("sendgrid")  // Use in production
public class SendGridEmailSender implements EmailSender {
    
    private final SendGrid sendGridClient;
    
    @Override
    public void send(String to, String subject, String body) {
        Email from = new Email("noreply@myapp.com");
        Email toEmail = new Email(to);
        Content content = new Content("text/plain", body);
        Mail mail = new Mail(from, subject, toEmail, content);
        
        sendGridClient.api(new Request())
            .method(Method.POST)
            .endpoint("mail/send")
            .body(mail.build());
    }
}

@Component
@Profile("test")  // Use in tests
public class MockEmailSender implements EmailSender {
    
    private final List<SentEmail> sentEmails = new ArrayList<>();
    
    @Override
    public void send(String to, String subject, String body) {
        sentEmails.add(new SentEmail(to, subject, body));
    }
    
    public List<SentEmail> getSentEmails() {
        return sentEmails;
    }
}

@Component
@ConditionalOnProperty(name = "payment.gateway", havingValue = "stripe")
public class StripePaymentGateway implements PaymentGateway {
    
    @Override
    public PaymentResult charge(BigDecimal amount, PaymentDetails details) {
        // Stripe implementation
    }
}

@Component
@ConditionalOnProperty(name = "payment.gateway", havingValue = "paypal")
public class PayPalPaymentGateway implements PaymentGateway {
    
    @Override
    public PaymentResult charge(BigDecimal amount, PaymentDetails details) {
        // PayPal implementation
    }
}

// ============== HIGH-LEVEL SERVICE (DEPENDS ON ABSTRACTIONS) ==============

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    // Depends on abstractions, not concretions!
    private final OrderRepository orderRepository;
    private final EmailSender emailSender;
    private final PaymentGateway paymentGateway;

    @Transactional
    public OrderResponse processOrder(CreateOrderRequest request) {
        log.info("Processing order for customer: {}", request.getCustomerId());
        
        // Create order
        Order order = createOrderFromRequest(request);
        
        // Charge payment (doesn't know if it's Stripe, PayPal, etc.)
        PaymentResult paymentResult = paymentGateway.charge(
            order.getTotal(),
            request.getPaymentDetails()
        );
        
        if (!paymentResult.isSuccess()) {
            throw new PaymentFailedException(paymentResult.getMessage());
        }
        
        order.setPaymentTransactionId(paymentResult.getTransactionId());
        order.setStatus(OrderStatus.PAID);
        
        // Save (doesn't know if it's MySQL, PostgreSQL, MongoDB, etc.)
        Order savedOrder = orderRepository.save(order);
        
        // Send notification (doesn't know if it's SMTP, SendGrid, etc.)
        emailSender.send(
            request.getCustomerEmail(),
            "Order Confirmation",
            "Your order #" + savedOrder.getId() + " has been confirmed"
        );
        
        return OrderResponse.from(savedOrder);
    }
}

// ============== EASY TESTING ==============

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    
    @Mock
    private EmailSender emailSender;
    
    @Mock
    private PaymentGateway paymentGateway;
    
    @InjectMocks
    private OrderService orderService;

    @Test
    void processOrder_Success() {
        // Arrange
        CreateOrderRequest request = createTestRequest();
        Order savedOrder = createTestOrder();
        
        when(paymentGateway.charge(any(), any()))
            .thenReturn(PaymentResult.success("txn-123"));
        when(orderRepository.save(any()))
            .thenReturn(savedOrder);
        
        // Act
        OrderResponse response = orderService.processOrder(request);
        
        // Assert
        assertThat(response.getId()).isEqualTo(savedOrder.getId());
        verify(emailSender).send(anyString(), anyString(), anyString());
    }
    
    @Test
    void processOrder_PaymentFails_ThrowsException() {
        // Arrange
        CreateOrderRequest request = createTestRequest();
        
        when(paymentGateway.charge(any(), any()))
            .thenReturn(PaymentResult.failure("Insufficient funds"));
        
        // Act & Assert
        assertThrows(PaymentFailedException.class, 
            () -> orderService.processOrder(request));
        
        verify(orderRepository, never()).save(any());
        verify(emailSender, never()).send(anyString(), anyString(), anyString());
    }
}
```

### DIP Configuration Example

```java
/**
 * Spring configuration showing how implementations are wired
 */
@Configuration
public class AppConfig {

    // Different implementations for different environments
    
    @Bean
    @Profile("prod")
    public EmailSender prodEmailSender(SendGridProperties properties) {
        return new SendGridEmailSender(properties);
    }
    
    @Bean
    @Profile("dev")
    public EmailSender devEmailSender() {
        return new ConsoleEmailSender();  // Just logs to console
    }
    
    @Bean
    @Profile("test")
    public EmailSender testEmailSender() {
        return new MockEmailSender();  // Captures sent emails
    }
}

// application-prod.yml
payment:
  gateway: stripe
  
// application-dev.yml
payment:
  gateway: mock
```

---

# SECTION 6: COMPLETE SPRING BOOT PROJECT EXAMPLE

---

## Chapter 6: E-Commerce System Following SOLID

```java
// ============== PROJECT STRUCTURE ==============
/*
src/main/java/com/example/ecommerce/
├── domain/                      # Domain entities
│   ├── Order.java
│   ├── OrderItem.java
│   └── OrderStatus.java
├── dto/                         # Data transfer objects
│   ├── request/
│   │   └── CreateOrderRequest.java
│   └── response/
│       └── OrderResponse.java
├── exception/                   # Custom exceptions
│   ├── OrderNotFoundException.java
│   └── PaymentFailedException.java
├── service/                     # Business logic (SRP)
│   ├── OrderService.java
│   ├── PricingService.java
│   ├── InventoryService.java
│   └── NotificationService.java
├── payment/                     # Payment abstraction (OCP, DIP)
│   ├── PaymentProcessor.java   # Interface
│   ├── CreditCardProcessor.java
│   ├── PayPalProcessor.java
│   └── CryptoProcessor.java
├── repository/                  # Data access (ISP)
│   ├── OrderRepository.java
│   └── OrderQueryRepository.java
├── notification/                # Notification abstraction (OCP, DIP)
│   ├── NotificationSender.java # Interface
│   ├── EmailNotificationSender.java
│   └── SmsNotificationSender.java
├── shipping/                    # Shipping abstraction (OCP)
│   ├── ShippingCalculator.java # Interface
│   ├── StandardShipping.java
│   ├── ExpressShipping.java
│   └── FreeShipping.java
└── controller/
    └── OrderController.java
*/

// ============== DOMAIN ==============

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long customerId;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items = new ArrayList<>();
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal shippingCost;
    private BigDecimal total;
    
    private String paymentTransactionId;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}

// ============== PAYMENT ABSTRACTION (OCP + DIP) ==============

public interface PaymentProcessor {
    boolean supports(PaymentMethod method);
    PaymentResult process(PaymentRequest request);
}

@Component
@RequiredArgsConstructor
public class CreditCardProcessor implements PaymentProcessor {
    
    private final StripeClient stripeClient;
    
    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.CREDIT_CARD;
    }
    
    @Override
    public PaymentResult process(PaymentRequest request) {
        // Stripe-specific implementation
    }
}

@Component
@RequiredArgsConstructor
public class PayPalProcessor implements PaymentProcessor {
    
    private final PayPalClient payPalClient;
    
    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.PAYPAL;
    }
    
    @Override
    public PaymentResult process(PaymentRequest request) {
        // PayPal-specific implementation
    }
}

// ============== SHIPPING ABSTRACTION (OCP) ==============

public interface ShippingCalculator {
    boolean supports(ShippingMethod method);
    BigDecimal calculate(Order order);
}

@Component
public class StandardShipping implements ShippingCalculator {
    
    private static final BigDecimal RATE_PER_ITEM = BigDecimal.valueOf(2.99);
    
    @Override
    public boolean supports(ShippingMethod method) {
        return method == ShippingMethod.STANDARD;
    }
    
    @Override
    public BigDecimal calculate(Order order) {
        int totalItems = order.getItems().stream()
            .mapToInt(OrderItem::getQuantity)
            .sum();
        return RATE_PER_ITEM.multiply(BigDecimal.valueOf(totalItems));
    }
}

@Component
public class ExpressShipping implements ShippingCalculator {
    
    private static final BigDecimal FLAT_RATE = BigDecimal.valueOf(15.99);
    
    @Override
    public boolean supports(ShippingMethod method) {
        return method == ShippingMethod.EXPRESS;
    }
    
    @Override
    public BigDecimal calculate(Order order) {
        return FLAT_RATE;
    }
}

@Component
public class FreeShipping implements ShippingCalculator {
    
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = BigDecimal.valueOf(100);
    
    @Override
    public boolean supports(ShippingMethod method) {
        return method == ShippingMethod.FREE;
    }
    
    @Override
    public BigDecimal calculate(Order order) {
        if (order.getSubtotal().compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }
        throw new ShippingNotAvailableException(
            "Free shipping requires minimum order of $" + FREE_SHIPPING_THRESHOLD
        );
    }
}

// ============== SERVICES (SRP) ==============

@Service
@RequiredArgsConstructor
public class ShippingService {
    
    private final List<ShippingCalculator> shippingCalculators;
    
    public BigDecimal calculateShipping(Order order, ShippingMethod method) {
        return shippingCalculators.stream()
            .filter(calc -> calc.supports(method))
            .findFirst()
            .map(calc -> calc.calculate(order))
            .orElseThrow(() -> new UnsupportedShippingMethodException(method));
    }
}

@Service
@RequiredArgsConstructor
public class PaymentService {
    
    private final List<PaymentProcessor> paymentProcessors;
    
    public PaymentResult processPayment(PaymentRequest request) {
        return paymentProcessors.stream()
            .filter(p -> p.supports(request.getMethod()))
            .findFirst()
            .map(p -> p.process(request))
            .orElseThrow(() -> new UnsupportedPaymentMethodException(request.getMethod()));
    }
}

@Service
@RequiredArgsConstructor
public class PricingService {
    
    private final DiscountService discountService;
    private final TaxService taxService;
    private final ShippingService shippingService;
    
    public OrderPricing calculatePricing(Order order, ShippingMethod shippingMethod) {
        BigDecimal subtotal = calculateSubtotal(order);
        BigDecimal discount = discountService.calculateDiscount(order);
        BigDecimal taxableAmount = subtotal.subtract(discount);
        BigDecimal tax = taxService.calculateTax(taxableAmount);
        BigDecimal shipping = shippingService.calculateShipping(order, shippingMethod);
        BigDecimal total = taxableAmount.add(tax).add(shipping);
        
        return OrderPricing.builder()
            .subtotal(subtotal)
            .discount(discount)
            .tax(tax)
            .shippingCost(shipping)
            .total(total)
            .build();
    }
    
    private BigDecimal calculateSubtotal(Order order) {
        return order.getItems().stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

// ============== MAIN ORDER SERVICE (ORCHESTRATION) ==============

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final PricingService pricingService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final OrderMapper orderMapper;
    
    public OrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating order for customer: {}", request.getCustomerId());
        
        // 1. Validate and reserve inventory
        inventoryService.reserveItems(request.getItems());
        
        try {
            // 2. Create order entity
            Order order = orderMapper.toEntity(request);
            
            // 3. Calculate pricing
            OrderPricing pricing = pricingService.calculatePricing(
                order, request.getShippingMethod()
            );
            order.applyPricing(pricing);
            
            // 4. Process payment
            PaymentResult paymentResult = paymentService.processPayment(
                PaymentRequest.builder()
                    .orderId(order.getId())
                    .amount(pricing.getTotal())
                    .method(request.getPaymentMethod())
                    .details(request.getPaymentDetails())
                    .build()
            );
            
            if (!paymentResult.isSuccess()) {
                throw new PaymentFailedException(paymentResult.getMessage());
            }
            
            order.setPaymentTransactionId(paymentResult.getTransactionId());
            order.setStatus(OrderStatus.PAID);
            
            // 5. Save order
            Order savedOrder = orderRepository.save(order);
            
            // 6. Confirm inventory
            inventoryService.confirmReservation(savedOrder.getId());
            
            // 7. Send notifications (async)
            notificationService.sendOrderConfirmation(savedOrder);
            
            return orderMapper.toResponse(savedOrder);
            
        } catch (Exception e) {
            // Release inventory reservation on failure
            inventoryService.releaseReservation(request.getItems());
            throw e;
        }
    }
}

// ============== NOTIFICATION ABSTRACTION (OCP + ISP) ==============

public interface NotificationSender {
    void send(NotificationRequest request);
    NotificationType getType();
}

@Component
@RequiredArgsConstructor
public class EmailNotificationSender implements NotificationSender {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    @Override
    public void send(NotificationRequest request) {
        // Email implementation
    }
    
    @Override
    public NotificationType getType() {
        return NotificationType.EMAIL;
    }
}

@Component
@RequiredArgsConstructor
public class SmsNotificationSender implements NotificationSender {
    
    private final TwilioClient twilioClient;
    
    @Override
    public void send(NotificationRequest request) {
        // SMS implementation
    }
    
    @Override
    public NotificationType getType() {
        return NotificationType.SMS;
    }
}

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final List<NotificationSender> notificationSenders;
    private final CustomerPreferenceRepository preferenceRepository;
    
    @Async
    public void sendOrderConfirmation(Order order) {
        CustomerPreferences prefs = preferenceRepository
            .findByCustomerId(order.getCustomerId())
            .orElse(CustomerPreferences.defaults());
        
        NotificationRequest request = NotificationRequest.builder()
            .customerId(order.getCustomerId())
            .orderId(order.getId())
            .message(buildConfirmationMessage(order))
            .build();
        
        // Send to all enabled channels
        notificationSenders.stream()
            .filter(sender -> prefs.isEnabled(sender.getType()))
            .forEach(sender -> {
                try {
                    sender.send(request);
                } catch (Exception e) {
                    log.error("Failed to send {} notification for order {}", 
                        sender.getType(), order.getId(), e);
                }
            });
    }
}

// ============== REPOSITORY (ISP) ==============

// Basic CRUD operations
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(Long customerId);
}

// Read-only queries (separate interface)
public interface OrderQueryRepository {
    List<OrderSummary> findOrderSummaries(Long customerId, LocalDateTime since);
    OrderStatistics getStatistics(Long customerId);
}

@Repository
@RequiredArgsConstructor
public class OrderQueryRepositoryImpl implements OrderQueryRepository {
    
    private final EntityManager em;
    
    @Override
    public List<OrderSummary> findOrderSummaries(Long customerId, LocalDateTime since) {
        // Complex query implementation
    }
    
    @Override
    public OrderStatistics getStatistics(Long customerId) {
        // Statistics query implementation
    }
}
```

---

# SECTION 7: COMMON VIOLATIONS & REFACTORING

---

## Quick Reference: Spotting SOLID Violations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              SOLID VIOLATION CODE SMELLS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SRP VIOLATIONS:                                                                │
│  • Class name contains "And" or "Manager"                                      │
│  • Class has > 500 lines of code                                               │
│  • Multiple @Autowired fields (> 5-7)                                          │
│  • Methods using completely different sets of fields                           │
│                                                                                  │
│  OCP VIOLATIONS:                                                                │
│  • switch/if-else chains on type/enum                                          │
│  • Adding features requires modifying existing classes                         │
│  • "instanceof" checks scattered in code                                       │
│                                                                                  │
│  LSP VIOLATIONS:                                                                │
│  • throw UnsupportedOperationException in subclass                            │
│  • Subclass overrides with empty method body                                   │
│  • Subclass changes method behavior unexpectedly                               │
│                                                                                  │
│  ISP VIOLATIONS:                                                                │
│  • Implementing class has empty/dummy methods                                  │
│  • Interface has > 10 methods                                                  │
│  • Unrelated methods grouped in one interface                                  │
│                                                                                  │
│  DIP VIOLATIONS:                                                                │
│  • "new" keyword for service classes                                           │
│  • Concrete class in constructor parameters                                    │
│  • Hard-coded class names (e.g., MySQLRepository)                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# INTERVIEW QUESTIONS

```
Q1: Why is SRP important?
A: SRP ensures each class has one reason to change, making code easier to 
   understand, test, and maintain. Changes to one responsibility don't 
   affect others.

Q2: How does Spring help implement DIP?
A: Spring's IoC container manages dependencies through interfaces. We code 
   against abstractions (@Autowired interfaces), and Spring injects concrete 
   implementations. We can swap implementations via configuration without 
   changing business code.

Q3: What's the relationship between OCP and DIP?
A: They work together. DIP says depend on abstractions. OCP says extend 
   through abstractions. By depending on interfaces (DIP), we can add new 
   implementations without modifying existing code (OCP).

Q4: Give an example of ISP in Spring.
A: Spring Data repositories: CrudRepository, PagingRepository, JpaRepository.
   Each adds functionality. You extend only what you need instead of one 
   massive interface.

Q5: How do you test code that follows SOLID?
A: SOLID makes testing easy:
   - SRP: Small classes = simple unit tests
   - OCP: Test new features without changing existing tests
   - LSP: Test base contract, subtypes should pass same tests
   - ISP: Mock small interfaces easily
   - DIP: Inject mocks instead of real dependencies

Q6: What's a code smell for SRP violation?
A: Classes with "And" or "Manager" in the name, many @Autowired fields,
   or methods that use completely different subsets of fields.

Q7: How do you refactor an OCP violation?
A: Replace switch/if-else chains with Strategy pattern. Create an interface
   for the varying behavior, implement it for each case, and use Spring's
   List<Interface> injection to auto-discover implementations.

Q8: What's the difference between LSP and ISP?
A: LSP ensures subtypes can replace base types without breaking code.
   ISP ensures clients aren't forced to depend on methods they don't use.
   LSP is about inheritance hierarchy behavior, ISP is about interface design.
```

---

**END OF PART 16: SOLID PRINCIPLES DEEP DIVE**

➡️ **Next: Part 17 - Database Security (User Management, Roles)**
