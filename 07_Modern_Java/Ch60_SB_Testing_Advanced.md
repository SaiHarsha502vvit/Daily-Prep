**Navigation**: [< Previous Chapter](Ch59_SB_Testing_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md)

---

### Historical Evolution

**Inventor / Originator:** JUnit 5 (Jupiter) by Marc Philipp and the JUnit team (2017) — the first major rewrite since JUnit 4 (2006).

**Predecessor context:** JUnit 4 (2006) dominated for over a decade. Its `TestCase` inheritance was replaced by annotations. Mockito (2004, Emmanuel Bernard) succeeded EasyMock (2001). TestContainers (2016) didn't exist — integration tests used embedded databases (H2, Derby) that behaved differently from production Postgres.

**Evolution narrative:** `@WebMvcTest` (Spring Boot 1.4, 2016) sliced the Spring context for controller tests — no full app startup needed. `@DataJpaTest` (Spring Boot 1.4.1, 2016) used an embedded database by default. TestContainers (AtomicJar, 2016) launched real Docker containers for integration tests — same Postgres version as production. ArchUnit (2019, ArchUnit Team) enforced architectural rules in unit tests: layer violations, cycle detection. Gatling (2012, Stephane Landelle) brought Scala-based load testing. JMeter (1998, Apache) was the legacy load testing tool. Mutation testing (PIT, 2012) automated bug injection to check test quality.

**Modern practice:** JUnit 5 with `@SpringBootTest` for full integration tests, `@WebMvcTest` for slices, `@DataJpaTest` for repositories. `@MockBean` for Spring context mocks. TestContainers for Postgres, Redis, Kafka in `@Container` tests. ArchUnit for architecture enforcement. Consider mutation testing with Pitest (2020+) for critical code paths.

- **`@WebMvcTest` — Spring Boot 1.4 (2016)**: Controller slice testing. Minimal context. Fast feedback.
- **TestContainers — AtomicJar 2016**: Real Docker containers in tests. Same DB as production.
- **ArchUnit — 2019**: Architecture rules in unit tests. Layer violations, package cycles, naming conventions.
- **Gatling — 2012**: Scala-based load testing. Scenario recording. CI integration.
- **Pitest (PIT) — 2012, matured 2020+**: Mutation testing. Injects bugs to verify test quality.

---

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

🔬 **Section Challenge — Integration Testing**

**Challenge 1 (Reasoning):** Why is using Testcontainers superior to using an In-Memory Database (like H2) for integration testing Spring Boot applications?

<details><summary>Answer</summary>

Syntax and Feature parity. H2 emulates Postgres/MySQL but often fails to accurately replicate native JSONB operators, advanced window functions, or specific transaction isolation anomalies. If tests pass on H2 but run on Postgres in production, you are blind to database-specific bugs. Testcontainers spins up a real Docker container of the exact Postgres version you use in production, ensuring 100% environment parity and eliminating "works on my machine" bugs.

</details>

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

🔬 **Section Challenge — Test Containers**

**Challenge 1 (Reasoning):** Why is using Testcontainers superior to using an In-Memory Database (like H2) for integration testing Spring Boot applications?

<details><summary>Answer</summary>

Syntax and Feature parity. H2 emulates Postgres/MySQL but often fails to accurately replicate native JSONB operators, advanced window functions, or specific transaction isolation anomalies. If tests pass on H2 but run on Postgres in production, you are blind to database-specific bugs. Testcontainers spins up a real Docker container of the exact Postgres version you use in production, ensuring 100% environment parity and eliminating "works on my machine" bugs.

</details>

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
┌──────────────────────────────────────────────────────────────────┐
│                       TDD Red-Green-Refactor                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────┐         ┌─────────┐         ┌─────────┐           │
│    │  RED    │ ──────▶ │  GREEN  │ ──────▶ │REFACTOR │           │
│    │         │         │         │         │         │           │
│    │ Write a │         │ Write   │         │ Improve │           │
│    │ failing │         │ minimum │         │ code    │           │
│    │ test    │         │ code to │         │ quality │           │
│    │         │         │ pass    │         │         │           │
│    └────┬────┘         └────┬────┘         └────┬────┘           │
│         │                   │                   │                │
│         └───────────────────┴───────────────────┘                │
│                          │                                       │
│                    Repeat Cycle                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
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

🔬 **Section Challenge — Performance Testing**

**Challenge 1 (Reasoning):** Why is using Testcontainers superior to using an In-Memory Database (like H2) for integration testing Spring Boot applications?

<details><summary>Answer</summary>

Syntax and Feature parity. H2 emulates Postgres/MySQL but often fails to accurately replicate native JSONB operators, advanced window functions, or specific transaction isolation anomalies. If tests pass on H2 but run on Postgres in production, you are blind to database-specific bugs. Testcontainers spins up a real Docker container of the exact Postgres version you use in production, ensuring 100% environment parity and eliminating "works on my machine" bugs.

</details>

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

**Remember**: "Tests are not overhead. They are investments in code quality, maintainability, and your own sanity."

---

_Next: Part 20 - Microservices Patterns (Service Discovery, API Gateway, Circuit Breakers)_

---

**Navigation**: [< Previous](Ch59_SB_Testing_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch61_SB_Microservices_Core.md)

🔬 **Section Challenge — Summary**

**Challenge 1 (Reasoning):** The Quick Reference shows both `@MockBean` and `@SpyBean`. In practice, using `@MockBean` in integration tests causes a subtle but devastating performance problem. What is it, and when should you use `@SpyBean` instead?

<details><summary>Answer</summary>

Every `@MockBean` creates a **new Spring ApplicationContext** because it replaces a real bean with a mock, making the context unique. Spring caches contexts between tests — but if Test A uses `@MockBean UserRepository` and Test B uses `@MockBean ProductRepository`, Spring can't reuse the same context. With 50 test classes each mocking different beans, you get 50 separate context loads (~5-15 seconds each) instead of 1 shared context. This is the #1 cause of slow Spring Boot test suites. **`@SpyBean`** wraps the REAL bean (delegates to real methods by default, lets you stub specific calls). It's better when you only need to verify interactions or stub one method while keeping real behavior. Fix for `@MockBean` performance: (1) Use `@MockBean` on the SAME set of beans across all test classes → context is shared. (2) Use `@Import(TestConfig.class)` with pre-defined mocks. (3) Prefer `@WebMvcTest` (slice test) over `@SpringBootTest` — smaller context, faster loads.

</details>
