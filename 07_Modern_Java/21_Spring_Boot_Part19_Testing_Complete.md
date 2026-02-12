# Spring Boot Part 19: Testing Complete Guide
## Unit, Integration, Mockito, and Test-Driven Development

> **"Code without tests is broken by design"** - Every tested line is confidence in production

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
│  ✅ Catch bugs early (cheaper to fix)                       │
│  ✅ Documentation through code                              │
│  ✅ Refactoring confidence                                  │
│  ✅ Design improvement (testable = good design)             │
│  ✅ Regression prevention                                   │
│  ✅ Continuous Integration enablement                       │
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
│ @SpringBootTest         │ Full application context (integration)  │
│ @WebMvcTest             │ Only web layer (controllers)            │
│ @DataJpaTest            │ Only JPA components (repositories)      │
│ @WebFluxTest            │ Only WebFlux components                 │
│ @JsonTest               │ Only JSON serialization                 │
│ @RestClientTest         │ Only REST client components             │
│ @MockBean               │ Add mock to Spring context              │
│ @SpyBean                │ Add spy to Spring context               │
│ @TestConfiguration      │ Test-specific configuration             │
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
@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class SecuredControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    @WithAnonymousUser
    void shouldDenyAnonymousAccess() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isUnauthorized());
    }
    
    @Test
    @WithMockUser(username = "user", roles = {"USER"})
    void shouldAllowAuthenticatedUser() throws Exception {
        when(userService.findAll()).thenReturn(List.of());
        
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk());
    }
    
    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldAllowAdminToDelete() throws Exception {
        doNothing().when(userService).delete(1L);
        
        mockMvc.perform(delete("/api/users/1"))
            .andExpect(status().isNoContent());
    }
    
    @Test
    @WithMockUser(username = "user", roles = {"USER"})
    void shouldDenyUserFromDeleting() throws Exception {
        mockMvc.perform(delete("/api/users/1"))
            .andExpect(status().isForbidden());
    }
    
    @Test
    void shouldAuthenticateWithJwt() throws Exception {
        String token = generateTestJwtToken("user", List.of("ROLE_USER"));
        
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }
}
```

---

## Integration Testing

### Full Integration Test

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class OrderIntegrationTest {
    
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7")
        .withExposedPorts(6379);
    
    @LocalServerPort
    private int port;
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
    
    @BeforeEach
    void setup() {
        orderRepository.deleteAll();
        userRepository.deleteAll();
        
        // Create test user
        userRepository.save(User.builder()
            .name("Test User")
            .email("test@test.com")
            .build());
    }
    
    @Test
    @DisplayName("Should create order through full flow")
    void shouldCreateOrderThroughFullFlow() {
        // Given
        CreateOrderRequest request = new CreateOrderRequest(
            1L,
            List.of(new OrderItemRequest("PROD-1", 2))
        );
        
        // When
        ResponseEntity<OrderResponse> response = restTemplate.postForEntity(
            "/api/orders",
            request,
            OrderResponse.class
        );
        
        // Then
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getBody().getId());
        assertEquals(OrderStatus.CONFIRMED, response.getBody().getStatus());
        
        // Verify in database
        Order savedOrder = orderRepository.findById(response.getBody().getId())
            .orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, savedOrder.getStatus());
    }
    
    @Test
    @DisplayName("Should handle concurrent orders correctly")
    void shouldHandleConcurrentOrders() throws Exception {
        // Given
        int numberOfOrders = 10;
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(numberOfOrders);
        AtomicInteger successCount = new AtomicInteger(0);
        
        // When
        for (int i = 0; i < numberOfOrders; i++) {
            executor.submit(() -> {
                try {
                    CreateOrderRequest request = new CreateOrderRequest(
                        1L,
                        List.of(new OrderItemRequest("PROD-1", 1))
                    );
                    
                    ResponseEntity<OrderResponse> response = restTemplate.postForEntity(
                        "/api/orders",
                        request,
                        OrderResponse.class
                    );
                    
                    if (response.getStatusCode() == HttpStatus.CREATED) {
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }
        
        latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();
        
        // Then
        assertEquals(numberOfOrders, successCount.get());
        assertEquals(numberOfOrders, orderRepository.count());
    }
}
```

### Slice Tests Overview

```java
// JSON Serialization Test
@JsonTest
class UserJsonTest {
    
    @Autowired
    private JacksonTester<UserDTO> json;
    
    @Test
    void shouldSerializeUser() throws Exception {
        UserDTO user = new UserDTO(1L, "John", "john@test.com");
        
        assertThat(json.write(user)).hasJsonPathNumberValue("@.id");
        assertThat(json.write(user)).extractingJsonPathStringValue("@.name")
            .isEqualTo("John");
    }
    
    @Test
    void shouldDeserializeUser() throws Exception {
        String content = """
            {
                "id": 1,
                "name": "John",
                "email": "john@test.com"
            }
            """;
        
        assertThat(json.parse(content)).isEqualTo(new UserDTO(1L, "John", "john@test.com"));
    }
}

// REST Client Test
@RestClientTest(ExternalApiClient.class)
class ExternalApiClientTest {
    
    @Autowired
    private ExternalApiClient client;
    
    @Autowired
    private MockRestServiceServer server;
    
    @Test
    void shouldCallExternalApi() {
        server.expect(requestTo("/external/data"))
            .andRespond(withSuccess("{\"value\": \"test\"}", MediaType.APPLICATION_JSON));
        
        String result = client.getData();
        
        assertEquals("test", result);
    }
}
```

---

## Test Containers

### Setup and Configuration

```java
@SpringBootTest
@Testcontainers
class ContainerizedTest {
    
    // PostgreSQL Container
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");
    
    // MySQL Container
    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
        .withDatabaseName("testdb");
    
    // MongoDB Container
    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:6.0");
    
    // Redis Container
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);
    
    // Kafka Container
    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));
    
    // Elasticsearch Container
    @Container
    static ElasticsearchContainer elastic = new ElasticsearchContainer(
        "docker.elastic.co/elasticsearch/elasticsearch:8.9.0")
        .withEnv("xpack.security.enabled", "false");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.elasticsearch.uris", elastic::getHttpHostAddress);
    }
    
    @Test
    void testWithContainers() {
        assertTrue(postgres.isRunning());
        assertTrue(redis.isRunning());
    }
}
```

### Reusable Container Configuration

```java
// Abstract base class for container-based tests
public abstract class AbstractContainerBaseTest {
    
    static final PostgreSQLContainer<?> POSTGRES;
    static final GenericContainer<?> REDIS;
    
    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:15")
            .withReuse(true);
        POSTGRES.start();
        
        REDIS = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379)
            .withReuse(true);
        REDIS.start();
    }
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }
}

// Test class extending the base
@SpringBootTest
class UserServiceIntegrationTest extends AbstractContainerBaseTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    void shouldWorkWithRealDatabase() {
        User user = userService.create("Test", "test@test.com");
        assertNotNull(user.getId());
    }
}
```

---

## Testing Best Practices

### Test Organization

```
src/
├── main/java/
│   └── com/example/
│       ├── controller/
│       ├── service/
│       └── repository/
└── test/
    ├── java/
    │   └── com/example/
    │       ├── controller/          # Controller tests
    │       │   └── UserControllerTest.java
    │       ├── service/             # Service unit tests
    │       │   └── UserServiceTest.java
    │       ├── repository/          # Repository tests
    │       │   └── UserRepositoryTest.java
    │       ├── integration/         # Integration tests
    │       │   └── UserIntegrationTest.java
    │       └── util/                # Test utilities
    │           ├── TestDataFactory.java
    │           └── AbstractContainerTest.java
    └── resources/
        ├── application-test.yml
        └── test-data/
            └── users.json
```

### Test Data Factory

```java
public class TestDataFactory {
    
    public static User createUser() {
        return User.builder()
            .name("Test User")
            .email("test@example.com")
            .status(UserStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();
    }
    
    public static User createUser(String name, String email) {
        return User.builder()
            .name(name)
            .email(email)
            .status(UserStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();
    }
    
    public static List<User> createUsers(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> createUser("User " + i, "user" + i + "@test.com"))
            .collect(Collectors.toList());
    }
    
    public static Order createOrder(User user) {
        return Order.builder()
            .user(user)
            .items(createOrderItems(3))
            .status(OrderStatus.PENDING)
            .totalAmount(new BigDecimal("150.00"))
            .createdAt(LocalDateTime.now())
            .build();
    }
    
    public static List<OrderItem> createOrderItems(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> OrderItem.builder()
                .productId("PROD-" + i)
                .productName("Product " + i)
                .quantity(i + 1)
                .price(new BigDecimal("50.00"))
                .build())
            .collect(Collectors.toList());
    }
    
    // Builder pattern for complex test data
    public static UserBuilder userBuilder() {
        return new UserBuilder();
    }
    
    public static class UserBuilder {
        private String name = "Default User";
        private String email = "default@test.com";
        private UserStatus status = UserStatus.ACTIVE;
        private Set<Role> roles = new HashSet<>();
        
        public UserBuilder withName(String name) {
            this.name = name;
            return this;
        }
        
        public UserBuilder withEmail(String email) {
            this.email = email;
            return this;
        }
        
        public UserBuilder withStatus(UserStatus status) {
            this.status = status;
            return this;
        }
        
        public UserBuilder withRole(Role role) {
            this.roles.add(role);
            return this;
        }
        
        public User build() {
            return User.builder()
                .name(name)
                .email(email)
                .status(status)
                .roles(roles)
                .createdAt(LocalDateTime.now())
                .build();
        }
    }
}
```

### Custom Assertions

```java
public class CustomAssertions {
    
    public static UserAssert assertThat(User user) {
        return new UserAssert(user);
    }
    
    public static class UserAssert extends AbstractAssert<UserAssert, User> {
        
        public UserAssert(User actual) {
            super(actual, UserAssert.class);
        }
        
        public UserAssert hasName(String name) {
            isNotNull();
            if (!Objects.equals(actual.getName(), name)) {
                failWithMessage("Expected user name to be <%s> but was <%s>",
                    name, actual.getName());
            }
            return this;
        }
        
        public UserAssert hasEmail(String email) {
            isNotNull();
            if (!Objects.equals(actual.getEmail(), email)) {
                failWithMessage("Expected user email to be <%s> but was <%s>",
                    email, actual.getEmail());
            }
            return this;
        }
        
        public UserAssert isActive() {
            isNotNull();
            if (actual.getStatus() != UserStatus.ACTIVE) {
                failWithMessage("Expected user to be ACTIVE but was <%s>",
                    actual.getStatus());
            }
            return this;
        }
        
        public UserAssert hasRole(String roleName) {
            isNotNull();
            boolean hasRole = actual.getRoles().stream()
                .anyMatch(r -> r.getName().equals(roleName));
            if (!hasRole) {
                failWithMessage("Expected user to have role <%s>", roleName);
            }
            return this;
        }
    }
}

// Usage in tests
@Test
void shouldCreateActiveUserWithRole() {
    User user = userService.createAdmin("Admin", "admin@test.com");
    
    CustomAssertions.assertThat(user)
        .hasName("Admin")
        .hasEmail("admin@test.com")
        .isActive()
        .hasRole("ROLE_ADMIN");
}
```

### Test Configuration

```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
  
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  
  main:
    allow-bean-definition-overriding: true

logging:
  level:
    org.springframework.test: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql: TRACE
```

---

## Test-Driven Development

### TDD Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                       TDD Red-Green-Refactor                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────┐         ┌─────────┐         ┌─────────┐          │
│    │  RED    │ ──────▶ │  GREEN  │ ──────▶ │REFACTOR │          │
│    │         │         │         │         │         │          │
│    │ Write a │         │ Write   │         │ Improve │          │
│    │ failing │         │ minimum │         │ code    │          │
│    │ test    │         │ code to │         │ quality │          │
│    │         │         │ pass    │         │         │          │
│    └────┬────┘         └────┬────┘         └────┬────┘          │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                          │                                      │
│                    Repeat Cycle                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### TDD Example: Building a Calculator

```java
// Step 1: RED - Write failing test
class CalculatorTest {
    
    private Calculator calculator;
    
    @BeforeEach
    void setup() {
        calculator = new Calculator();
    }
    
    @Test
    @DisplayName("Should add two numbers")
    void shouldAddTwoNumbers() {
        // This test will fail - Calculator doesn't exist yet
        int result = calculator.add(2, 3);
        assertEquals(5, result);
    }
}

// Step 2: GREEN - Minimum code to pass
public class Calculator {
    public int add(int a, int b) {
        return a + b;  // Simplest implementation
    }
}

// Step 3: RED - Add more tests
@Test
@DisplayName("Should subtract two numbers")
void shouldSubtractTwoNumbers() {
    int result = calculator.subtract(5, 3);
    assertEquals(2, result);
}

@Test
@DisplayName("Should handle negative numbers")
void shouldHandleNegativeNumbers() {
    assertEquals(-1, calculator.add(-3, 2));
    assertEquals(-5, calculator.subtract(2, 7));
}

// Step 4: GREEN - Implement subtract
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int subtract(int a, int b) {
        return a - b;
    }
}

// Step 5: RED - Add division (edge case)
@Test
@DisplayName("Should throw exception when dividing by zero")
void shouldThrowWhenDividingByZero() {
    assertThrows(ArithmeticException.class, 
        () -> calculator.divide(10, 0));
}

@Test
@DisplayName("Should divide two numbers")
void shouldDivideTwoNumbers() {
    assertEquals(2.5, calculator.divide(5, 2));
}

// Step 6: GREEN - Implement division
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int subtract(int a, int b) {
        return a - b;
    }
    
    public double divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("Cannot divide by zero");
        }
        return (double) a / b;
    }
}

// Step 7: REFACTOR - Clean up if needed
// Extract common validation, add documentation, etc.
```

### TDD for Service Layer

```java
// Step 1: Write test for user registration
@ExtendWith(MockitoExtension.class)
class UserRegistrationServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private UserRegistrationService registrationService;
    
    // RED: Test for happy path
    @Test
    @DisplayName("Should register new user successfully")
    void shouldRegisterNewUser() {
        // Given
        RegistrationRequest request = new RegistrationRequest(
            "john@example.com", "password123", "John Doe"
        );
        
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        
        // When
        User result = registrationService.register(request);
        
        // Then
        assertNotNull(result.getId());
        assertEquals("john@example.com", result.getEmail());
        verify(emailService).sendWelcomeEmail(any(User.class));
    }
    
    // RED: Test for duplicate email
    @Test
    @DisplayName("Should throw exception for duplicate email")
    void shouldThrowForDuplicateEmail() {
        // Given
        RegistrationRequest request = new RegistrationRequest(
            "existing@example.com", "password123", "John"
        );
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        
        // When & Then
        assertThrows(DuplicateEmailException.class,
            () -> registrationService.register(request));
        
        verify(userRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }
    
    // RED: Test for password validation
    @Test
    @DisplayName("Should throw exception for weak password")
    void shouldThrowForWeakPassword() {
        // Given
        RegistrationRequest request = new RegistrationRequest(
            "john@example.com", "123", "John"
        );
        
        // When & Then
        assertThrows(WeakPasswordException.class,
            () -> registrationService.register(request));
    }
}

// GREEN: Implement the service
@Service
@RequiredArgsConstructor
public class UserRegistrationService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    
    @Transactional
    public User register(RegistrationRequest request) {
        // Validate password strength
        if (request.getPassword().length() < 8) {
            throw new WeakPasswordException("Password must be at least 8 characters");
        }
        
        // Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(
                "Email already registered: " + request.getEmail()
            );
        }
        
        // Create user
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .name(request.getName())
            .status(UserStatus.PENDING_VERIFICATION)
            .build();
        
        User savedUser = userRepository.save(user);
        
        // Send welcome email
        emailService.sendWelcomeEmail(savedUser);
        
        return savedUser;
    }
}
```

---

## Behavior-Driven Development

### BDD with Cucumber

```gherkin
# features/user-registration.feature
Feature: User Registration
  As a new user
  I want to register for an account
  So that I can access the application

  Background:
    Given the registration system is available

  Scenario: Successful registration with valid data
    Given I am on the registration page
    When I enter email "john@example.com"
    And I enter password "SecurePass123!"
    And I enter name "John Doe"
    And I click the register button
    Then I should see a success message
    And I should receive a welcome email
    And my account should be created with status "PENDING_VERIFICATION"

  Scenario: Registration fails with duplicate email
    Given a user with email "existing@example.com" already exists
    When I try to register with email "existing@example.com"
    Then I should see an error message "Email already registered"
    And no new account should be created

  Scenario Outline: Registration with invalid password
    When I try to register with password "<password>"
    Then I should see an error message "<error>"
    
    Examples:
      | password | error                                    |
      | 123      | Password must be at least 8 characters   |
      | abcdefgh | Password must contain a number           |
      | 12345678 | Password must contain a letter           |
```

### Step Definitions

```java
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class UserRegistrationSteps {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private UserRepository userRepository;
    
    private ResponseEntity<?> lastResponse;
    private RegistrationRequest registrationRequest;
    
    @Given("the registration system is available")
    public void theRegistrationSystemIsAvailable() {
        // Health check or setup
        ResponseEntity<String> health = restTemplate.getForEntity("/actuator/health", String.class);
        assertEquals(HttpStatus.OK, health.getStatusCode());
    }
    
    @Given("a user with email {string} already exists")
    public void aUserWithEmailExists(String email) {
        userRepository.save(User.builder()
            .email(email)
            .password("encoded")
            .name("Existing User")
            .build());
    }
    
    @When("I enter email {string}")
    public void iEnterEmail(String email) {
        if (registrationRequest == null) {
            registrationRequest = new RegistrationRequest();
        }
        registrationRequest.setEmail(email);
    }
    
    @When("I enter password {string}")
    public void iEnterPassword(String password) {
        registrationRequest.setPassword(password);
    }
    
    @When("I enter name {string}")
    public void iEnterName(String name) {
        registrationRequest.setName(name);
    }
    
    @When("I click the register button")
    public void iClickTheRegisterButton() {
        lastResponse = restTemplate.postForEntity(
            "/api/register",
            registrationRequest,
            UserResponse.class
        );
    }
    
    @When("I try to register with email {string}")
    public void iTryToRegisterWithEmail(String email) {
        registrationRequest = new RegistrationRequest(email, "ValidPass123!", "Test");
        iClickTheRegisterButton();
    }
    
    @When("I try to register with password {string}")
    public void iTryToRegisterWithPassword(String password) {
        registrationRequest = new RegistrationRequest("test@test.com", password, "Test");
        iClickTheRegisterButton();
    }
    
    @Then("I should see a success message")
    public void iShouldSeeASuccessMessage() {
        assertEquals(HttpStatus.CREATED, lastResponse.getStatusCode());
    }
    
    @Then("I should see an error message {string}")
    public void iShouldSeeAnErrorMessage(String message) {
        assertTrue(lastResponse.getStatusCode().is4xxClientError());
        ErrorResponse error = (ErrorResponse) lastResponse.getBody();
        assertTrue(error.getMessage().contains(message));
    }
    
    @Then("my account should be created with status {string}")
    public void myAccountShouldBeCreatedWithStatus(String status) {
        User user = userRepository.findByEmail(registrationRequest.getEmail())
            .orElseThrow();
        assertEquals(UserStatus.valueOf(status), user.getStatus());
    }
    
    @Then("no new account should be created")
    public void noNewAccountShouldBeCreated() {
        long count = userRepository.count();
        assertEquals(1, count); // Only the existing user
    }
}
```

---

## Performance Testing

### Basic Performance Test

```java
@SpringBootTest
class PerformanceTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    @Timeout(value = 1, unit = TimeUnit.SECONDS)
    void shouldCompleteUnder1Second() {
        // Test that operation completes quickly
        List<User> users = userService.findAll();
        assertNotNull(users);
    }
    
    @RepeatedTest(100)
    void shouldBeConsistentlyFast() {
        long start = System.nanoTime();
        
        userService.findById(1L);
        
        long duration = System.nanoTime() - start;
        assertTrue(duration < 10_000_000, // 10ms
            "Operation took too long: " + duration + " ns");
    }
    
    @Test
    void shouldHandleConcurrentRequests() throws Exception {
        int threadCount = 100;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);
        
        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await(); // Wait for all threads to be ready
                    userService.findById(1L);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    endLatch.countDown();
                }
            });
        }
        
        startLatch.countDown(); // Start all threads simultaneously
        endLatch.await(30, TimeUnit.SECONDS);
        
        assertEquals(threadCount, successCount.get());
        assertEquals(0, errorCount.get());
        
        executor.shutdown();
    }
}
```

### Load Testing with Gatling (Integration)

```java
// Gatling simulation (Scala)
class UserApiSimulation extends Simulation {
    
    val httpProtocol = http
        .baseUrl("http://localhost:8080")
        .acceptHeader("application/json")
        .contentTypeHeader("application/json")
    
    val getUsers = scenario("Get Users")
        .exec(
            http("Get All Users")
                .get("/api/users")
                .check(status.is(200))
        )
    
    val createUser = scenario("Create User")
        .exec(
            http("Create User")
                .post("/api/users")
                .body(StringBody("""{"name": "Test", "email": "test${userId}@test.com"}"""))
                .check(status.is(201))
        )
    
    setUp(
        getUsers.inject(
            rampUsers(100).during(10.seconds),
            constantUsersPerSec(10).during(30.seconds)
        ),
        createUser.inject(
            rampUsers(50).during(10.seconds)
        )
    ).protocols(httpProtocol)
     .assertions(
         global.responseTime.mean.lt(500),
         global.successfulRequests.percent.gt(99)
     )
}
```

---

## Interview Questions

### Basic Questions

**Q1: What's the difference between @Mock and @MockBean?**
```
@Mock (Mockito):
- Creates a mock for unit tests
- Doesn't involve Spring context
- Used with @ExtendWith(MockitoExtension.class)

@MockBean (Spring):
- Adds mock to Spring ApplicationContext
- Replaces existing bean in context
- Used with @SpringBootTest or slice tests
```

**Q2: When would you use @WebMvcTest vs @SpringBootTest?**
```
@WebMvcTest:
- Tests only the web layer (controllers)
- Faster startup, limited context
- Service layer is mocked
- Good for: Controller logic, request/response mapping

@SpringBootTest:
- Loads full application context
- Slower startup, complete context
- Tests full integration
- Good for: End-to-end testing, integration scenarios
```

**Q3: What is the testing pyramid?**
```
The testing pyramid suggests:
- Many unit tests (fast, cheap, isolated)
- Fewer integration tests (medium speed, component interaction)
- Few E2E tests (slow, expensive, full system)

Ratio: 70% Unit : 20% Integration : 10% E2E
```

### Advanced Questions

**Q4: How do you test async operations?**
```java
@Test
void testAsyncMethod() throws Exception {
    CompletableFuture<String> future = asyncService.processAsync("input");
    
    // Wait for completion with timeout
    String result = future.get(5, TimeUnit.SECONDS);
    
    assertEquals("expected", result);
}

// Or with Awaitility
@Test
void testAsyncWithAwaitility() {
    asyncService.processAsync("input");
    
    await()
        .atMost(5, TimeUnit.SECONDS)
        .pollInterval(100, TimeUnit.MILLISECONDS)
        .until(() -> resultService.hasResult(), is(true));
}
```

**Q5: How do you handle flaky tests?**
```
Strategies for flaky tests:
1. Identify root cause (timing, state, external dependencies)
2. Use proper waits instead of Thread.sleep()
3. Reset state between tests (@BeforeEach cleanup)
4. Mock external dependencies
5. Use TestContainers for database consistency
6. Add retries for truly flaky external systems
7. Run tests in isolation (@DirtiesContext)
```

**Q6: Explain the difference between verify() and ArgumentCaptor**
```java
// verify() - Checks if method was called
verify(repository).save(any(User.class));
verify(repository, times(2)).findById(anyLong());
verify(repository, never()).delete(any());

// ArgumentCaptor - Captures actual argument for inspection
ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
verify(repository).save(captor.capture());
User captured = captor.getValue();
assertEquals("John", captured.getName());
```

### Code Challenge

**Implement tests for a shopping cart service:**

```java
// Given this service
@Service
public class ShoppingCartService {
    private final CartRepository cartRepository;
    private final ProductService productService;
    private final PricingService pricingService;
    
    public Cart addItem(Long cartId, Long productId, int quantity);
    public Cart removeItem(Long cartId, Long productId);
    public BigDecimal calculateTotal(Long cartId);
    public Order checkout(Long cartId, PaymentDetails payment);
}

// Write comprehensive tests covering:
// 1. Adding items (happy path and edge cases)
// 2. Removing items
// 3. Total calculation with discounts
// 4. Checkout process
// 5. Error scenarios (invalid product, empty cart, payment failure)

@ExtendWith(MockitoExtension.class)
class ShoppingCartServiceTest {
    
    @Mock private CartRepository cartRepository;
    @Mock private ProductService productService;
    @Mock private PricingService pricingService;
    
    @InjectMocks
    private ShoppingCartService cartService;
    
    // Your tests here...
    
    @Test
    @DisplayName("Should add item to cart")
    void shouldAddItemToCart() {
        // Given
        Cart cart = new Cart(1L, new ArrayList<>());
        Product product = new Product(1L, "Laptop", new BigDecimal("999.99"));
        
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(productService.findById(1L)).thenReturn(Optional.of(product));
        when(cartRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        // When
        Cart result = cartService.addItem(1L, 1L, 2);
        
        // Then
        assertEquals(1, result.getItems().size());
        assertEquals(2, result.getItems().get(0).getQuantity());
    }
    
    // Continue with more tests...
}
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TESTING CHEAT SHEET                              │
├─────────────────────────────────────────────────────────────────────┤
│ ANNOTATIONS                                                         │
│  @Test              - Mark test method                              │
│  @BeforeEach        - Run before each test                          │
│  @AfterEach         - Run after each test                           │
│  @BeforeAll         - Run once before all (static)                  │
│  @AfterAll          - Run once after all (static)                   │
│  @Disabled          - Skip test                                     │
│  @DisplayName       - Custom test name                              │
│  @ParameterizedTest - Run with multiple inputs                      │
│  @Nested            - Group related tests                           │
│  @Timeout           - Fail if exceeds time                          │
├─────────────────────────────────────────────────────────────────────┤
│ MOCKITO                                                             │
│  @Mock              - Create mock                                   │
│  @InjectMocks       - Inject mocks into target                      │
│  @Spy               - Partial mock (real methods)                   │
│  @Captor            - Capture arguments                             │
│  when().thenReturn()- Stub method                                   │
│  verify()           - Verify interaction                            │
│  doThrow()          - Stub void method exception                    │
├─────────────────────────────────────────────────────────────────────┤
│ SPRING BOOT TEST                                                    │
│  @SpringBootTest    - Full context                                  │
│  @WebMvcTest        - Web layer only                                │
│  @DataJpaTest       - JPA layer only                                │
│  @MockBean          - Mock in Spring context                        │
│  @SpyBean           - Spy in Spring context                         │
│  @AutoConfigureMockMvc - Configure MockMvc                          │
├─────────────────────────────────────────────────────────────────────┤
│ ASSERTIONS                                                          │
│  assertEquals(expected, actual)                                     │
│  assertTrue/assertFalse(condition)                                  │
│  assertNull/assertNotNull(object)                                   │
│  assertThrows(Exception.class, () -> ...)                           │
│  assertAll("group", () -> ..., () -> ...)                           │
│  assertThat(actual).isEqualTo(expected)  // AssertJ                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

Testing is a critical skill for professional developers:

1. **Unit Tests** - Fast, isolated, test one thing
2. **Integration Tests** - Test component interactions
3. **Mockito** - Mock dependencies for isolation
4. **Spring Test** - Sliced tests for efficiency
5. **TDD** - Write tests first, then code
6. **BDD** - Tests that describe behavior

> **Remember**: "Tests are not overhead. They are investments in code quality, maintainability, and your own sanity."

---

*Next: Part 20 - Microservices Patterns (Service Discovery, API Gateway, Circuit Breakers)*
