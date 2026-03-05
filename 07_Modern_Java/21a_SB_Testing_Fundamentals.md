> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](21b_SB_Testing_Advanced.md)

---

# Spring Boot Part 19: Testing Complete Guide
## Unit, Integration, Mockito, and Test-Driven Development

> **"Code without tests is broken by design"** - Every tested line is confidence in production

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Testing is Non-Negotiable?                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Bug in production costs 100x more to fix than in development                 │
│  • Tests = documentation that never gets outdated                               │
│  • Refactoring confidence: change code without fear of breaking things          │
│  • CI/CD requirement: automated deployment needs automated testing              │
│  • Interview essential: All senior interviews include testing questions         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How to Test in Spring Boot?                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • JUnit 5: Test framework (@Test, @BeforeEach, assertions)                     │
│  • Mockito: Mock dependencies (@Mock, @InjectMocks, when/thenReturn)            │
│  • @SpringBootTest: Full integration test with entire context                   │
│  • @WebMvcTest: Test only controllers with MockMvc                              │
│  • @DataJpaTest: Test only repositories with in-memory DB                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Each Test Type?                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Unit tests: Business logic in services (70% of tests)                        │
│  • Integration tests: Database operations, API contracts (20%)                  │
│  • E2E tests: Critical user flows only (10%)                                    │
│  • TestContainers: When in-memory DB isn't realistic enough                     │
│  • TDD: When requirements are clear, write tests first                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Testing Tools to Master?                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     JUnit 5, Mockito, @SpringBootTest, MockMvc                      │
│  IMPORTANT:     TestContainers, @DataJpaTest, @WebMvcTest                       │
│  ADVANCED:      JMeter, Gatling, ArchUnit, Contract Testing                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing with JUnit 5](#unit-testing-with-junit-5)
4. [Mockito Complete Guide](#mockito-complete-guide)
5. [Spring Boot Test Annotations](#spring-boot-test-annotations)
6. [Service Layer Testing](#service-layer-testing)
7. [Repository Layer Testing](#repository-layer-testing)
8. [Controller Layer Testing](#controller-layer-testing)
9. [Integration Testing](#integration-testing)
10. [Test Containers](#test-containers)
11. [Testing Best Practices](#testing-best-practices)
12. [Test-Driven Development (TDD)](#test-driven-development)
13. [Behavior-Driven Development (BDD)](#behavior-driven-development)
14. [Performance Testing](#performance-testing)
15. [Interview Questions](#interview-questions)

---

## Testing Philosophy

### Why Test?

```
🎯 Testing Benefits:
┌─────────────────────────────────────────────────────────────┐
│  ✅ Catch bugs early (cheaper to fix)                        │
│  ✅ Documentation through code                               │
│  ✅ Refactoring confidence                                   │
│  ✅ Design improvement (testable = good design)              │
│  ✅ Regression prevention                                    │
│  ✅ Continuous Integration enablement                        │
└─────────────────────────────────────────────────────────────┘
```

### Cost of Bugs by Stage

```
Stage          │ Cost Multiplier │ Example
───────────────┼─────────────────┼─────────────────────
Development    │ 1x              │ $100 to fix
Testing        │ 10x             │ $1,000 to fix
Production     │ 100x            │ $10,000 to fix
Post-Release   │ 1000x           │ $100,000+ to fix
```

---

## Testing Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲         ← Few, Slow, Expensive
                 ╱──────╲          (Selenium, Cypress)
                ╱        ╲
               ╱Integration╲     ← Some, Medium Speed
              ╱────────────╲       (@SpringBootTest)
             ╱              ╲
            ╱   Unit Tests   ╲   ← Many, Fast, Cheap
           ╱──────────────────╲    (JUnit, Mockito)
          ╱                    ╲
         ╱   Foundation Base    ╲
        ────────────────────────── 

Recommended Ratio: 70% Unit : 20% Integration : 10% E2E
```

### Test Types Comparison

| Type | Scope | Speed | Dependencies | When to Use |
|------|-------|-------|--------------|-------------|
| Unit | Single class/method | Milliseconds | Mocked | Business logic |
| Integration | Multiple components | Seconds | Real/Partial | Component interaction |
| E2E | Full application | Minutes | Real | Critical user flows |

---

## Unit Testing with JUnit 5

### Maven Dependencies

```xml
<dependencies>
    <!-- Spring Boot Starter Test (includes JUnit 5, Mockito, AssertJ) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- For database testing -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- TestContainers for integration tests -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>1.19.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### JUnit 5 Annotations

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class JUnit5AnnotationsDemo {
    
    @BeforeAll
    static void setupAll() {
        // Runs once before all tests (must be static)
        System.out.println("🚀 Starting test suite");
    }
    
    @BeforeEach
    void setup() {
        // Runs before each test
        System.out.println("📋 Setting up test");
    }
    
    @Test
    @DisplayName("Should add two positive numbers correctly")
    void shouldAddPositiveNumbers() {
        // Given
        int a = 5, b = 3;
        
        // When
        int result = a + b;
        
        // Then
        assertEquals(8, result, "5 + 3 should equal 8");
    }
    
    @Test
    @Disabled("Not implemented yet")
    void futureTest() {
        // This test will be skipped
    }
    
    @Test
    @Timeout(value = 100, unit = TimeUnit.MILLISECONDS)
    void shouldCompleteQuickly() {
        // Test fails if takes longer than 100ms
        assertTrue(true);
    }
    
    @AfterEach
    void tearDown() {
        // Runs after each test
        System.out.println("🧹 Cleaning up test");
    }
    
    @AfterAll
    static void tearDownAll() {
        // Runs once after all tests (must be static)
        System.out.println("✅ Test suite complete");
    }
}
```

### Assertions Deep Dive

```java
import static org.junit.jupiter.api.Assertions.*;
import static org.assertj.core.api.Assertions.*;

class AssertionsDemo {
    
    @Test
    void basicAssertions() {
        // Equality
        assertEquals("expected", "expected");
        assertNotEquals("a", "b");
        
        // Boolean
        assertTrue(5 > 3);
        assertFalse(3 > 5);
        
        // Null checks
        assertNull(null);
        assertNotNull("not null");
        
        // Same reference
        String str = "hello";
        assertSame(str, str);
        assertNotSame(new String("hi"), new String("hi"));
        
        // Array equality
        assertArrayEquals(new int[]{1, 2, 3}, new int[]{1, 2, 3});
    }
    
    @Test
    void exceptionTesting() {
        // Assert exception is thrown
        Exception exception = assertThrows(
            IllegalArgumentException.class,
            () -> {
                throw new IllegalArgumentException("Invalid input");
            }
        );
        
        assertEquals("Invalid input", exception.getMessage());
        
        // Assert no exception
        assertDoesNotThrow(() -> {
            int result = 5 + 3;
        });
    }
    
    @Test
    void groupedAssertions() {
        User user = new User("John", 25, "john@email.com");
        
        // All assertions run, failures reported together
        assertAll("User properties",
            () -> assertEquals("John", user.getName()),
            () -> assertEquals(25, user.getAge()),
            () -> assertEquals("john@email.com", user.getEmail())
        );
    }
    
    @Test
    void assertJExamples() {
        // AssertJ provides fluent assertions
        String name = "John Doe";
        
        assertThat(name)
            .isNotNull()
            .startsWith("John")
            .endsWith("Doe")
            .hasSize(8);
        
        List<String> names = List.of("Alice", "Bob", "Charlie");
        
        assertThat(names)
            .hasSize(3)
            .contains("Bob")
            .doesNotContain("David")
            .containsExactly("Alice", "Bob", "Charlie");
        
        // Object assertions
        User user = new User("John", 25, "john@email.com");
        
        assertThat(user)
            .extracting(User::getName, User::getAge)
            .containsExactly("John", 25);
    }
}
```

### Parameterized Tests

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class ParameterizedTestsDemo {
    
    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    void shouldBePositive(int number) {
        assertTrue(number > 0);
    }
    
    @ParameterizedTest
    @ValueSource(strings = {"", "  ", "\t", "\n"})
    void shouldBeBlank(String input) {
        assertTrue(input.isBlank());
    }
    
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "\t"})
    void shouldBeNullEmptyOrBlank(String input) {
        assertTrue(input == null || input.isBlank());
    }
    
    @ParameterizedTest
    @EnumSource(value = Status.class, names = {"ACTIVE", "PENDING"})
    void shouldBeValidStatus(Status status) {
        assertNotNull(status);
    }
    
    @ParameterizedTest
    @CsvSource({
        "apple, 5",
        "banana, 6", 
        "cherry, 6"
    })
    void shouldHaveCorrectLength(String fruit, int expectedLength) {
        assertEquals(expectedLength, fruit.length());
    }
    
    @ParameterizedTest
    @CsvFileSource(resources = "/test-data.csv", numLinesToSkip = 1)
    void shouldParseFromFile(String name, int age, String email) {
        assertNotNull(name);
        assertTrue(age > 0);
        assertTrue(email.contains("@"));
    }
    
    @ParameterizedTest
    @MethodSource("provideStringsForIsEmpty")
    void shouldBeEmpty(String input, boolean expected) {
        assertEquals(expected, input == null || input.isEmpty());
    }
    
    static Stream<Arguments> provideStringsForIsEmpty() {
        return Stream.of(
            Arguments.of(null, true),
            Arguments.of("", true),
            Arguments.of("hello", false)
        );
    }
}
```

### Nested Tests

```java
@DisplayName("User Service Tests")
class UserServiceNestedTest {
    
    private UserService userService;
    
    @BeforeEach
    void setup() {
        userService = new UserService();
    }
    
    @Nested
    @DisplayName("When creating users")
    class CreateUserTests {
        
        @Test
        @DisplayName("Should create user with valid data")
        void shouldCreateValidUser() {
            User user = userService.create("John", "john@email.com");
            assertNotNull(user.getId());
        }
        
        @Test
        @DisplayName("Should throw exception for null name")
        void shouldThrowForNullName() {
            assertThrows(IllegalArgumentException.class, 
                () -> userService.create(null, "john@email.com"));
        }
        
        @Nested
        @DisplayName("With email validation")
        class EmailValidationTests {
            
            @Test
            void shouldRejectInvalidEmail() {
                assertThrows(IllegalArgumentException.class,
                    () -> userService.create("John", "invalid-email"));
            }
            
            @Test
            void shouldAcceptValidEmail() {
                User user = userService.create("John", "john@valid.com");
                assertEquals("john@valid.com", user.getEmail());
            }
        }
    }
    
    @Nested
    @DisplayName("When finding users")
    class FindUserTests {
        
        @BeforeEach
        void createTestUser() {
            userService.create("Test", "test@email.com");
        }
        
        @Test
        void shouldFindExistingUser() {
            Optional<User> user = userService.findByEmail("test@email.com");
            assertTrue(user.isPresent());
        }
        
        @Test
        void shouldReturnEmptyForNonExistent() {
            Optional<User> user = userService.findByEmail("nonexistent@email.com");
            assertTrue(user.isEmpty());
        }
    }
}
```

---

## Mockito Complete Guide

### Basic Mocking

```java
import org.mockito.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class MockitoBasicsTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private UserService userService;
    
    @Captor
    private ArgumentCaptor<User> userCaptor;
    
    @Test
    void shouldReturnMockedValue() {
        // Given - Setup mock behavior
        User mockUser = new User(1L, "John", "john@email.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        // When - Call the method being tested
        Optional<User> result = userService.findById(1L);
        
        // Then - Verify results
        assertTrue(result.isPresent());
        assertEquals("John", result.get().getName());
        
        // Verify mock was called
        verify(userRepository).findById(1L);
        verify(userRepository, times(1)).findById(anyLong());
    }
    
    @Test
    void shouldVerifyNoInteractions() {
        // When
        userService.validateWithoutDb("test@email.com");
        
        // Then - verify repository was never called
        verifyNoInteractions(userRepository);
    }
    
    @Test
    void shouldCaptureArguments() {
        // Given
        when(userRepository.save(any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        
        // When
        userService.createUser("John", "john@email.com");
        
        // Then - Capture and verify the argument
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        
        assertEquals("John", capturedUser.getName());
        assertEquals("john@email.com", capturedUser.getEmail());
    }
}
```

### Advanced Mocking Techniques

```java
@ExtendWith(MockitoExtension.class)
class AdvancedMockingTest {
    
    @Mock
    private PaymentGateway paymentGateway;
    
    @Mock
    private OrderRepository orderRepository;
    
    @InjectMocks
    private OrderService orderService;
    
    @Test
    void shouldStubMultipleCalls() {
        // Return different values on consecutive calls
        when(orderRepository.findNextOrderNumber())
            .thenReturn(1001L)
            .thenReturn(1002L)
            .thenReturn(1003L);
        
        assertEquals(1001L, orderRepository.findNextOrderNumber());
        assertEquals(1002L, orderRepository.findNextOrderNumber());
        assertEquals(1003L, orderRepository.findNextOrderNumber());
    }
    
    @Test
    void shouldStubWithAnswer() {
        // Dynamic response based on input
        when(orderRepository.findById(anyLong())).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            return Optional.of(new Order(id, "Order-" + id));
        });
        
        Order order = orderRepository.findById(123L).orElseThrow();
        assertEquals("Order-123", order.getName());
    }
    
    @Test
    void shouldThrowException() {
        when(paymentGateway.processPayment(any()))
            .thenThrow(new PaymentException("Gateway unavailable"));
        
        assertThrows(PaymentException.class, 
            () -> orderService.processOrder(new Order()));
    }
    
    @Test
    void shouldThrowExceptionOnSecondCall() {
        when(paymentGateway.processPayment(any()))
            .thenReturn(PaymentResult.success())  // First call succeeds
            .thenThrow(new PaymentException("Rate limited")); // Second fails
        
        // First call succeeds
        assertDoesNotThrow(() -> orderService.processOrder(new Order()));
        
        // Second call throws
        assertThrows(PaymentException.class,
            () -> orderService.processOrder(new Order()));
    }
    
    @Test
    void shouldVerifyCallOrder() {
        // Given
        when(orderRepository.save(any())).thenReturn(new Order());
        when(paymentGateway.processPayment(any()))
            .thenReturn(PaymentResult.success());
        
        // When
        orderService.createAndProcessOrder(new OrderRequest());
        
        // Then - Verify order of calls
        InOrder inOrder = inOrder(orderRepository, paymentGateway);
        inOrder.verify(orderRepository).save(any());
        inOrder.verify(paymentGateway).processPayment(any());
    }
    
    @Test
    void shouldUseArgumentMatchers() {
        // Any matchers
        when(orderRepository.findByStatus(any())).thenReturn(List.of());
        when(orderRepository.findByAmount(anyDouble())).thenReturn(List.of());
        when(orderRepository.findByCustomerId(anyLong())).thenReturn(List.of());
        
        // Specific matchers
        when(orderRepository.findByAmount(eq(100.0))).thenReturn(List.of(new Order()));
        when(orderRepository.findByAmount(gt(1000.0))).thenReturn(List.of());
        when(orderRepository.findByAmount(argThat(amount -> amount > 500)))
            .thenReturn(List.of());
        
        // String matchers
        when(orderRepository.findByName(contains("VIP")))
            .thenReturn(List.of(new Order()));
        when(orderRepository.findByName(startsWith("URGENT")))
            .thenReturn(List.of(new Order()));
    }
}
```

### Spying

```java
@ExtendWith(MockitoExtension.class)
class SpyTest {
    
    @Spy
    private ArrayList<String> spyList = new ArrayList<>();
    
    @Spy
    private UserValidator userValidator;
    
    @Test
    void shouldUseRealMethodsWithSpy() {
        // Spy calls real methods by default
        spyList.add("one");
        spyList.add("two");
        
        assertEquals(2, spyList.size());
        assertEquals("one", spyList.get(0));
        
        // Verify real method was called
        verify(spyList).add("one");
    }
    
    @Test
    void shouldOverrideSpecificMethod() {
        // Override specific method
        doReturn(100).when(spyList).size();
        
        spyList.add("one");
        spyList.add("two");
        
        // Real add() was called
        assertEquals(2, spyList.stream().count());
        
        // But size() returns mocked value
        assertEquals(100, spyList.size());
    }
    
    @Test
    void shouldPartiallyMockService() {
        // Use doReturn for spies to avoid calling real method during stubbing
        doReturn(false).when(userValidator).isEmailValid("invalid");
        
        // Real method still works for other inputs
        assertTrue(userValidator.isEmailValid("test@email.com"));
        
        // Stubbed method returns fake value
        assertFalse(userValidator.isEmailValid("invalid"));
    }
}
```

### Mock Static Methods

```java
import org.mockito.MockedStatic;

class StaticMockTest {
    
    @Test
    void shouldMockStaticMethod() {
        try (MockedStatic<UUID> mockedUUID = mockStatic(UUID.class)) {
            UUID fixedUUID = UUID.fromString("123e4567-e89b-12d3-a456-426614174000");
            mockedUUID.when(UUID::randomUUID).thenReturn(fixedUUID);
            
            // Now UUID.randomUUID() returns our fixed value
            assertEquals(fixedUUID, UUID.randomUUID());
        }
        // Outside the try block, real implementation is used
    }
    
    @Test
    void shouldMockStaticWithArguments() {
        try (MockedStatic<LocalDate> mockedDate = mockStatic(LocalDate.class)) {
            LocalDate fixedDate = LocalDate.of(2024, 1, 15);
            mockedDate.when(LocalDate::now).thenReturn(fixedDate);
            mockedDate.when(() -> LocalDate.parse("2024-01-15"))
                .thenReturn(fixedDate);
            
            assertEquals(fixedDate, LocalDate.now());
            assertEquals(fixedDate, LocalDate.parse("2024-01-15"));
        }
    }
}
```

---

## Spring Boot Test Annotations

### Annotation Overview

```
🎯 Spring Boot Test Annotations:
┌────────────────────────────────────────────────────────────────────┐
│ @SpringBootTest         │ Full application context (integration)   │
│ @WebMvcTest             │ Only web layer (controllers)             │
│ @DataJpaTest            │ Only JPA components (repositories)       │
│ @WebFluxTest            │ Only WebFlux components                  │
│ @JsonTest               │ Only JSON serialization                  │
│ @RestClientTest         │ Only REST client components              │
│ @MockBean               │ Add mock to Spring context               │
│ @SpyBean                │ Add spy to Spring context                │
│ @TestConfiguration      │ Test-specific configuration              │
└────────────────────────────────────────────────────────────────────┘
```

### @SpringBootTest Deep Dive

```java
// Full integration test - loads complete application
@SpringBootTest
class FullIntegrationTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    void contextLoads() {
        assertNotNull(userService);
    }
}

// With web environment
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebIntegrationTest {
    
    @LocalServerPort
    private int port;
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void shouldReturnUsers() {
        ResponseEntity<List<User>> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/users",
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<>() {}
        );
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}

// With specific properties
@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "logging.level.org.springframework=DEBUG"
    }
)
class CustomPropertiesTest {
    // Tests with custom properties
}

// With specific configuration classes
@SpringBootTest(classes = {TestConfig.class, SecurityConfig.class})
class SpecificConfigTest {
    // Only loads specified configurations
}
```

---

## Service Layer Testing

### Service Test Example

```java
// Service under test
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final InventoryService inventoryService;
    
    @Transactional
    public Order createOrder(OrderRequest request) {
        // Validate inventory
        if (!inventoryService.checkAvailability(request.getItems())) {
            throw new InsufficientInventoryException("Items not available");
        }
        
        // Create order
        Order order = Order.builder()
            .customerId(request.getCustomerId())
            .items(request.getItems())
            .totalAmount(calculateTotal(request.getItems()))
            .status(OrderStatus.PENDING)
            .build();
        
        Order savedOrder = orderRepository.save(order);
        
        // Process payment
        PaymentResult payment = paymentService.processPayment(
            savedOrder.getId(),
            savedOrder.getTotalAmount()
        );
        
        if (payment.isSuccessful()) {
            savedOrder.setStatus(OrderStatus.CONFIRMED);
            savedOrder.setPaymentId(payment.getTransactionId());
            orderRepository.save(savedOrder);
            
            // Send notification
            notificationService.sendOrderConfirmation(savedOrder);
        } else {
            savedOrder.setStatus(OrderStatus.PAYMENT_FAILED);
            orderRepository.save(savedOrder);
            throw new PaymentFailedException(payment.getErrorMessage());
        }
        
        return savedOrder;
    }
    
    private BigDecimal calculateTotal(List<OrderItem> items) {
        return items.stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

// Comprehensive service tests
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    
    @Mock
    private OrderRepository orderRepository;
    
    @Mock
    private PaymentService paymentService;
    
    @Mock
    private NotificationService notificationService;
    
    @Mock
    private InventoryService inventoryService;
    
    @InjectMocks
    private OrderService orderService;
    
    @Captor
    private ArgumentCaptor<Order> orderCaptor;
    
    private OrderRequest validRequest;
    
    @BeforeEach
    void setup() {
        validRequest = OrderRequest.builder()
            .customerId(1L)
            .items(List.of(
                new OrderItem("PROD-1", "Product 1", new BigDecimal("100.00"), 2),
                new OrderItem("PROD-2", "Product 2", new BigDecimal("50.00"), 1)
            ))
            .build();
    }
    
    @Test
    @DisplayName("Should create order successfully when inventory available and payment succeeds")
    void shouldCreateOrderSuccessfully() {
        // Given
        when(inventoryService.checkAvailability(anyList())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });
        when(paymentService.processPayment(anyLong(), any(BigDecimal.class)))
            .thenReturn(PaymentResult.success("TXN-123"));
        
        // When
        Order result = orderService.createOrder(validRequest);
        
        // Then
        assertNotNull(result);
        assertEquals(OrderStatus.CONFIRMED, result.getStatus());
        assertEquals("TXN-123", result.getPaymentId());
        
        // Verify interactions
        verify(inventoryService).checkAvailability(validRequest.getItems());
        verify(orderRepository, times(2)).save(any(Order.class));
        verify(paymentService).processPayment(eq(1L), eq(new BigDecimal("250.00")));
        verify(notificationService).sendOrderConfirmation(any(Order.class));
    }
    
    @Test
    @DisplayName("Should throw exception when inventory not available")
    void shouldThrowWhenInventoryNotAvailable() {
        // Given
        when(inventoryService.checkAvailability(anyList())).thenReturn(false);
        
        // When & Then
        assertThrows(InsufficientInventoryException.class,
            () -> orderService.createOrder(validRequest));
        
        // Verify no further processing
        verifyNoInteractions(orderRepository);
        verifyNoInteractions(paymentService);
        verifyNoInteractions(notificationService);
    }
    
    @Test
    @DisplayName("Should handle payment failure correctly")
    void shouldHandlePaymentFailure() {
        // Given
        when(inventoryService.checkAvailability(anyList())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });
        when(paymentService.processPayment(anyLong(), any(BigDecimal.class)))
            .thenReturn(PaymentResult.failure("Card declined"));
        
        // When & Then
        PaymentFailedException exception = assertThrows(
            PaymentFailedException.class,
            () -> orderService.createOrder(validRequest)
        );
        
        assertEquals("Card declined", exception.getMessage());
        
        // Verify order status was updated
        verify(orderRepository, times(2)).save(orderCaptor.capture());
        List<Order> savedOrders = orderCaptor.getAllValues();
        assertEquals(OrderStatus.PAYMENT_FAILED, savedOrders.get(1).getStatus());
        
        // Verify no notification sent
        verifyNoInteractions(notificationService);
    }
    
    @Test
    @DisplayName("Should calculate total correctly")
    void shouldCalculateTotalCorrectly() {
        // Given
        when(inventoryService.checkAvailability(anyList())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });
        when(paymentService.processPayment(anyLong(), any(BigDecimal.class)))
            .thenReturn(PaymentResult.success("TXN-123"));
        
        // When
        orderService.createOrder(validRequest);
        
        // Then - Verify correct total was calculated
        // 100.00 * 2 + 50.00 * 1 = 250.00
        verify(paymentService).processPayment(anyLong(), eq(new BigDecimal("250.00")));
    }
}
```

---

## Repository Layer Testing

### @DataJpaTest

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserRepositoryTest {
    
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TestEntityManager entityManager;
    
    @BeforeEach
    void setup() {
        // Clear and setup test data
        userRepository.deleteAll();
    }
    
    @Test
    @DisplayName("Should save and retrieve user")
    void shouldSaveAndRetrieveUser() {
        // Given
        User user = User.builder()
            .name("John Doe")
            .email("john@example.com")
            .status(UserStatus.ACTIVE)
            .build();
        
        // When
        User saved = userRepository.save(user);
        entityManager.flush();
        entityManager.clear();
        
        // Then
        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertEquals("John Doe", found.getName());
        assertEquals("john@example.com", found.getEmail());
    }
    
    @Test
    @DisplayName("Should find users by status")
    void shouldFindUsersByStatus() {
        // Given
        userRepository.saveAll(List.of(
            User.builder().name("Active1").email("a1@test.com")
                .status(UserStatus.ACTIVE).build(),
            User.builder().name("Active2").email("a2@test.com")
                .status(UserStatus.ACTIVE).build(),
            User.builder().name("Inactive").email("i@test.com")
                .status(UserStatus.INACTIVE).build()
        ));
        entityManager.flush();
        
        // When
        List<User> activeUsers = userRepository.findByStatus(UserStatus.ACTIVE);
        
        // Then
        assertEquals(2, activeUsers.size());
        assertTrue(activeUsers.stream()
            .allMatch(u -> u.getStatus() == UserStatus.ACTIVE));
    }
    
    @Test
    @DisplayName("Should execute custom query")
    void shouldExecuteCustomQuery() {
        // Given
        User user = userRepository.save(
            User.builder()
                .name("John Doe")
                .email("john@example.com")
                .status(UserStatus.ACTIVE)
                .build()
        );
        entityManager.flush();
        
        // When
        Optional<User> found = userRepository.findByEmailIgnoreCase("JOHN@EXAMPLE.COM");
        
        // Then
        assertTrue(found.isPresent());
        assertEquals(user.getId(), found.get().getId());
    }
    
    @Test
    @DisplayName("Should page results correctly")
    void shouldPageResultsCorrectly() {
        // Given
        IntStream.range(0, 25).forEach(i -> 
            userRepository.save(
                User.builder()
                    .name("User " + i)
                    .email("user" + i + "@test.com")
                    .status(UserStatus.ACTIVE)
                    .build()
            )
        );
        entityManager.flush();
        
        // When
        Page<User> firstPage = userRepository.findAll(PageRequest.of(0, 10));
        Page<User> secondPage = userRepository.findAll(PageRequest.of(1, 10));
        
        // Then
        assertEquals(25, firstPage.getTotalElements());
        assertEquals(3, firstPage.getTotalPages());
        assertEquals(10, firstPage.getContent().size());
        assertEquals(10, secondPage.getContent().size());
    }
}
```

### Testing with H2 (In-Memory)

```java
@DataJpaTest
// Uses H2 by default
class UserRepositoryH2Test {
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void shouldUseH2Database() {
        User user = userRepository.save(
            User.builder()
                .name("Test User")
                .email("test@test.com")
                .build()
        );
        
        assertNotNull(user.getId());
    }
}
```

---

## Controller Layer Testing

### @WebMvcTest

```java
@WebMvcTest(UserController.class)
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    @DisplayName("GET /api/users - Should return all users")
    void shouldReturnAllUsers() throws Exception {
        // Given
        List<UserDTO> users = List.of(
            new UserDTO(1L, "John", "john@test.com"),
            new UserDTO(2L, "Jane", "jane@test.com")
        );
        when(userService.findAll()).thenReturn(users);
        
        // When & Then
        mockMvc.perform(get("/api/users")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].name").value("John"))
            .andExpect(jsonPath("$[1].name").value("Jane"));
    }
    
    @Test
    @DisplayName("GET /api/users/{id} - Should return user by ID")
    void shouldReturnUserById() throws Exception {
        // Given
        UserDTO user = new UserDTO(1L, "John", "john@test.com");
        when(userService.findById(1L)).thenReturn(Optional.of(user));
        
        // When & Then
        mockMvc.perform(get("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("John"))
            .andExpect(jsonPath("$.email").value("john@test.com"));
    }
    
    @Test
    @DisplayName("GET /api/users/{id} - Should return 404 when not found")
    void shouldReturn404WhenUserNotFound() throws Exception {
        // Given
        when(userService.findById(999L)).thenReturn(Optional.empty());
        
        // When & Then
        mockMvc.perform(get("/api/users/999")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }
    
    @Test
    @DisplayName("POST /api/users - Should create user")
    void shouldCreateUser() throws Exception {
        // Given
        CreateUserRequest request = new CreateUserRequest("John", "john@test.com");
        UserDTO created = new UserDTO(1L, "John", "john@test.com");
        when(userService.create(any(CreateUserRequest.class))).thenReturn(created);
        
        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("John"));
    }
    
    @Test
    @DisplayName("POST /api/users - Should return 400 for invalid request")
    void shouldReturn400ForInvalidRequest() throws Exception {
        // Given - Invalid request (empty name)
        CreateUserRequest request = new CreateUserRequest("", "invalid-email");
        
        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isArray());
    }
    
    @Test
    @DisplayName("PUT /api/users/{id} - Should update user")
    void shouldUpdateUser() throws Exception {
        // Given
        UpdateUserRequest request = new UpdateUserRequest("John Updated", "john.updated@test.com");
        UserDTO updated = new UserDTO(1L, "John Updated", "john.updated@test.com");
        when(userService.update(eq(1L), any(UpdateUserRequest.class))).thenReturn(updated);
        
        // When & Then
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John Updated"));
    }
    
    @Test
    @DisplayName("DELETE /api/users/{id} - Should delete user")
    void shouldDeleteUser() throws Exception {
        // Given
        doNothing().when(userService).delete(1L);
        
        // When & Then
        mockMvc.perform(delete("/api/users/1"))
            .andExpect(status().isNoContent());
        
        verify(userService).delete(1L);
    }
}
```

### Testing with Security

```java
