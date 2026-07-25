# 13. SDET × Spring Boot — Testing Spring Boot Applications End-to-End

**Navigation**: [← Spring Boot × DSA](12_SpringBoot_Plus_DSA_Progressive.md) | [📚 Index](../00_INDEX.md) | [🔥 Elite Rounds →](10_Elite_Cross_Domain_Rounds.md)

**Cross-links:**

- [`21_SDET_Playwright_Automation/`](../../21_SDET_Playwright_Automation/) — Playwright patterns
- [`24_Advanced_API_Testing/`](../../24_Advanced_API_Testing/) — API testing depth
- [`07_Modern_Java/`](../../07_Modern_Java/) — Spring Boot internals

---

> **Reading contract**: Every topic starts at zero. By the end of each topic you will understand the Spring Boot testing tool, WHY it exists, WHEN to use it over alternatives, a complete working solution, and 3 practice challenges.

---

## Table of Contents

1. [The Testing Pyramid — Where Each Tool Fits](#1-the-testing-pyramid--where-each-tool-fits)
2. [@SpringBootTest vs @WebMvcTest vs @DataJpaTest](#2-springboottest-vs-webmvctest-vs-datajpatest)
3. [MockMvc vs WebTestClient vs TestRestTemplate](#3-mockmvc-vs-webtestclient-vs-testresttemplate)
4. [WireMock — Testing External API Dependencies](#4-wiremock--testing-external-api-dependencies)
5. [EmbeddedKafka — Testing Async Event Consumers](#5-embeddedkafka--testing-async-event-consumers)
6. [Testcontainers — Real Database in Tests](#6-testcontainers--real-database-in-tests)
7. [Spring Security Testing — Auth Flows End-to-End](#7-spring-security-testing--auth-flows-end-to-end)

---

## 1. The Testing Pyramid — Where Each Tool Fits

### 🧠 Foundation — Why a Pyramid?

The testing pyramid answers one question: **where should you put your effort?**

```
                    ┌─────┐
                    │ E2E │   Few, slow, expensive (real browser + real DB + real APIs)
                   /───────\
                  / Integra-\  Some — test layers together (Spring context + real DB)
                 /   tion    \
                /─────────────\
               /     Unit      \  Many — fast, isolated (mock everything external)
              /─────────────────\
```

**Why pyramid not rectangle?**

- Unit tests: milliseconds each → run thousands in CI in seconds
- Integration tests: seconds each → run hundreds in CI in minutes
- E2E tests: minutes each → run tens in CI in hours

Inverted pyramid (too many E2E) = **"ice cream cone anti-pattern"** — slow CI, unreliable feedback, developers skip running tests locally.

---

### 🔍 The Real-World SDET Problem

Your team has 800 tests. 600 are Playwright E2E against a real environment. CI takes 45 minutes. When a deploy fails, you can't tell if it's a code bug or environment flakiness. **Restructure the testing strategy.**

---

### 🗺️ How to Think About It

```
Each test layer's job:
  Unit (@MockBean, Mockito): "Does this single class do its logic correctly?"
  Integration (@DataJpaTest, @WebMvcTest): "Does this layer work with its immediate dependencies?"
  Contract (WireMock): "Does this service honour the API contract with its downstream?"
  System (@SpringBootTest): "Does the whole application start and handle a realistic scenario?"
  E2E (Playwright): "Does the FULL USER JOURNEY work in a real browser?"

Move tests as LOW as possible while still testing the right thing.
  DB query logic → @DataJpaTest (not E2E)
  HTTP endpoint mapping → @WebMvcTest (not @SpringBootTest)
  User login flow → E2E (can't test browser auth any other way)
```

---

### ✍️ The Restructured Test Distribution

| Layer                 | Count | Tool                     | When to use                                      |
| --------------------- | ----- | ------------------------ | ------------------------------------------------ |
| Unit                  | 400   | JUnit 5 + Mockito        | Business logic, data transformations             |
| Repository            | 80    | @DataJpaTest             | JPQL queries, JPA mappings                       |
| Controller            | 120   | @WebMvcTest + MockMvc    | HTTP layer, request/response mapping, validation |
| Service integration   | 60    | @SpringBootTest (no web) | Service ↔ DB integration                         |
| External API contract | 40    | WireMock                 | Outbound HTTP stubs                              |
| Async events          | 20    | EmbeddedKafka            | Kafka consumer/producer                          |
| Full system           | 30    | @SpringBootTest (web)    | End-to-end application scenarios                 |
| Browser E2E           | 50    | Playwright               | Critical user journeys only                      |

Result: 800 tests → **CI from 45 minutes to 12 minutes**.

---

## 2. @SpringBootTest vs @WebMvcTest vs @DataJpaTest

### 🧠 Foundation — The Spring Application Context

When Spring starts, it builds an **Application Context** — a container holding all configured beans, their dependencies, and their configuration. Loading it takes 5-20 seconds.

Different test slices load DIFFERENT subsets of this context:

```
@SpringBootTest        → loads EVERYTHING (full app context)
                          ↕ slowest, most realistic

@WebMvcTest            → loads ONLY web layer (controllers, filters, converters)
                          ↕ fast, no DB

@DataJpaTest           → loads ONLY JPA layer (repositories, entities, DataSource)
                          ↕ fast, no HTTP

@JsonTest              → loads ONLY Jackson serialization/deserialization
@RestClientTest        → loads ONLY REST client beans
```

---

### 🔍 The Real-World SDET Problem

You need to test three things:

1. `CitationController.createCitation()` validates the request and returns 400 for missing `amount`
2. `CitationRepository.findByStatus()` returns citations in descending date order
3. The full flow: `POST /api/citations` → controller → service → repository → DB → response

Which annotation do you use for each?

---

### 🗺️ How to Think About It

```
Test 1 (validation): Only involves the HTTP layer. No DB needed.
  → Use @WebMvcTest. Inject the controller, mock the service.
  → Fast: only the web slice loads.

Test 2 (repository query): Only involves JPA + DB. No HTTP needed.
  → Use @DataJpaTest. Uses H2 in-memory DB by default.
  → Fast: only the JPA slice loads.

Test 3 (full flow): Involves all layers working together.
  → Use @SpringBootTest. Load the full context.
  → Slow: but worth it for integration confidence.
```

---

### ✍️ The Solution — Three Annotations, Three Tests

```java
// Test 1: @WebMvcTest — HTTP layer only
@WebMvcTest(CitationController.class)
class CitationControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean CitationService citationService;  // ← mock the service; not testing it here

    @Test
    void createCitation_missingAmount_returns400() throws Exception {
        mockMvc.perform(post("/api/citations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\": \"USR-001\"}"))  // missing "amount"
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("amount"))
            .andExpect(jsonPath("$.errors[0].message").value("must not be null"));
    }

    @Test
    void createCitation_valid_returnsCreated() throws Exception {
        when(citationService.create(any())).thenReturn(new CitationDTO("CIT-001", "PENDING", new BigDecimal("150")));

        mockMvc.perform(post("/api/citations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\": \"USR-001\", \"amount\": 150}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("CIT-001"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }
}
```

```java
// Test 2: @DataJpaTest — repository layer only
@DataJpaTest
class CitationRepositoryTest {

    @Autowired CitationRepository repo;
    @Autowired TestEntityManager em;  // for setup — bypass service layer

    @Test
    void findByStatus_returnsInDescendingDateOrder() {
        // Setup: insert test data directly via EntityManager
        Citation older = new Citation("CIT-OLD", "PENDING", LocalDateTime.now().minusDays(2));
        Citation newer = new Citation("CIT-NEW", "PENDING", LocalDateTime.now().minusDays(1));
        em.persistAndFlush(older);
        em.persistAndFlush(newer);

        List<Citation> results = repo.findByStatusOrderByCreatedAtDesc("PENDING");

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo("CIT-NEW");  // newer first
        assertThat(results.get(1).getId()).isEqualTo("CIT-OLD");
    }

    @Test
    void findByStatus_noMatchingRecords_returnsEmptyList() {
        List<Citation> results = repo.findByStatusOrderByCreatedAtDesc("PAID");
        assertThat(results).isEmpty();
    }
}
// Note: @DataJpaTest wraps each test in a transaction and ROLLS BACK automatically
// → No test pollution between tests — each starts with a clean state
```

```java
// Test 3: @SpringBootTest — full integration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CitationIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired CitationRepository repo;

    @Test
    @Sql("/test-data/clean.sql")  // clean the real DB before this test
    void createAndPayCitation_fullFlow() {
        // Step 1: Create
        ResponseEntity<CitationDTO> createRes = restTemplate.postForEntity(
            "/api/citations",
            new CreateCitationRequest("USR-001", new BigDecimal("150")),
            CitationDTO.class
        );
        assertThat(createRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String citationId = createRes.getBody().getId();

        // Step 2: Verify it's in DB
        assertThat(repo.existsById(citationId)).isTrue();

        // Step 3: Pay
        ResponseEntity<Void> payRes = restTemplate.postForEntity(
            "/api/citations/{id}/payment",
            new PaymentRequest("CREDIT_CARD"),
            Void.class,
            citationId
        );
        assertThat(payRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Step 4: Verify status updated
        Citation fromDb = repo.findById(citationId).orElseThrow();
        assertThat(fromDb.getStatus()).isEqualTo("PAID");
    }
}
```

---

### 🎯 Similar Challenges

**Challenge A**: You want to test that `CitationController` returns 401 when no Authorization header is present. Should you use `@WebMvcTest` or `@SpringBootTest`? What additional setup is needed?

<details><summary>Answer</summary>

```java
@WebMvcTest(CitationController.class)
@Import(SecurityConfig.class)  // ← MUST import security config; @WebMvcTest doesn't load it by default
class CitationSecurityTest {

    @Autowired MockMvc mockMvc;
    @MockBean CitationService citationService;
    @MockBean JwtTokenProvider jwtProvider;  // mock the JWT validator

    @Test
    void getCitation_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/citations/CIT-001"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void getCitation_invalidToken_returns401() throws Exception {
        when(jwtProvider.validateToken(anyString())).thenReturn(false);

        mockMvc.perform(get("/api/citations/CIT-001")
                .header("Authorization", "Bearer invalid-token"))
            .andExpect(status().isUnauthorized());
    }
}
```

**Use `@WebMvcTest`** — security is a web-layer concern. `@SpringBootTest` would work but is overkill and much slower.

**`@Import(SecurityConfig.class)`** is the critical detail: `@WebMvcTest` loads controller + security infrastructure but NOT your `SecurityConfig`. Without importing it, Spring uses default (permit-all) security, and your 401 tests will PASS WHEN THEY SHOULDN'T.

</details>

---

**Challenge B**: You have a JPQL query with a complex `CASE WHEN` expression. Unit tests with Mockito can't test this (they mock the repository entirely). `@DataJpaTest` uses H2 but your query uses PostgreSQL-specific functions (`DATE_TRUNC`, `ILIKE`). What do you do?

<details><summary>Answer</summary>

```java
// Option 1: Testcontainers — run real PostgreSQL in a Docker container during tests
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // don't replace with H2
@Testcontainers
class CitationRepositoryPostgresTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("citations_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired CitationRepository repo;

    @Test
    void findByCaseInsensitiveName_usesILIKE() {
        // Now running against real PostgreSQL → ILIKE works
        List<Citation> results = repo.findByNameContainingIgnoreCase("jones");
        assertThat(results).isNotEmpty();
    }
}
```

**Why not just mock it?** A mocked repository tells you NOTHING about whether the query actually works in PostgreSQL. Testcontainers gives you a real database — your JPQL + PostgreSQL-specific functions are genuinely tested.

</details>

---

## 3. MockMvc vs WebTestClient vs TestRestTemplate

### 🧠 Foundation — Three Ways to Call Your Spring Endpoints in Tests

```
MockMvc          → In-process, no real HTTP, synchronous, works with @WebMvcTest
WebTestClient    → Reactive (WebFlux), fluent API, supports async assertions
TestRestTemplate → Real HTTP client, requires @SpringBootTest(webEnvironment=RANDOM_PORT)
```

---

### 🔍 The Real-World SDET Problem

You have three teams testing three different layers. Which client should each use?

- Team A: testing controller validation (no DB)
- Team B: testing a WebFlux (reactive) API
- Team C: testing the full deployed app (all layers + real DB)

---

### 🗺️ How to Think About It

```
Decision tree:
  Is your app WebFlux (reactive)?
    Yes → always use WebTestClient
    No  → continue...

  Are you using @WebMvcTest (no real HTTP)?
    Yes → use MockMvc (can't use RestTemplate — no server)
    No  → @SpringBootTest with RANDOM_PORT?
      Yes → TestRestTemplate (real HTTP, pre-configured with base URL)
            OR WebTestClient (also works — more fluent API)
      MOCK environment? → use MockMvc
```

---

### ✍️ The Solution — Side by Side

```java
// === MockMvc (works with @WebMvcTest and @SpringBootTest) ===
// Pros: fastest, detailed request inspection, .andDo(print()) debugging
// Cons: no real HTTP (can miss TCP-level issues), verbose syntax

mockMvc.perform(
    post("/api/citations")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"amount\": 150}")
        .header("Authorization", "Bearer " + jwtToken)
)
.andExpect(status().isCreated())
.andExpect(header().string("Location", matchesRegex("/api/citations/CIT-.*")))
.andExpect(jsonPath("$.status").value("PENDING"))
.andDo(print());  // prints full request/response — great for debugging


// === WebTestClient (works with @SpringBootTest + WebFlux, or via MockMvc bridge) ===
// Pros: fluent builder API, reactive-first, works with both MVC and WebFlux
// Cons: slightly more complex setup for MVC apps

webTestClient
    .post().uri("/api/citations")
    .contentType(MediaType.APPLICATION_JSON)
    .header("Authorization", "Bearer " + jwtToken)
    .bodyValue(Map.of("amount", 150))
    .exchange()
    .expectStatus().isCreated()
    .expectHeader().valueMatches("Location", "/api/citations/CIT-.*")
    .expectBody()
        .jsonPath("$.status").isEqualTo("PENDING")
        .jsonPath("$.id").value(id -> assertThat(id.toString()).startsWith("CIT-"));


// === TestRestTemplate (@SpringBootTest with RANDOM_PORT) ===
// Pros: real HTTP, simplest API, follows redirects automatically
// Cons: less fluent, harder to assert headers, no streaming support

ResponseEntity<CitationDTO> response = restTemplate.postForEntity(
    "/api/citations",
    new CreateCitationRequest(new BigDecimal("150")),
    CitationDTO.class
);

assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
assertThat(response.getHeaders().getLocation()).isNotNull();
assertThat(response.getBody().getStatus()).isEqualTo("PENDING");
```

**When to use which** at a glance:

| Scenario                                  | Best choice                      |
| ----------------------------------------- | -------------------------------- |
| Validating request/response shape (no DB) | MockMvc                          |
| WebFlux reactive endpoints                | WebTestClient                    |
| Testing redirects, cookie handling        | TestRestTemplate                 |
| Asserting custom headers precisely        | MockMvc (`header().string(...)`) |
| Streaming/SSE endpoints                   | WebTestClient                    |
| Complex JSON path assertions              | MockMvc + jsonPath               |

---

### 🎯 Similar Challenges

**Challenge A**: You need to test a file upload endpoint (`POST /api/citations/attachments` with `multipart/form-data`). Which client handles this cleanest? Write the test.

<details><summary>Answer</summary>

```java
// MockMvc handles multipart cleanest in non-reactive MVC apps:
mockMvc.perform(
    multipart("/api/citations/attachments")
        .file(new MockMultipartFile(
            "file",              // form field name
            "invoice.pdf",       // original filename
            "application/pdf",   // content type
            "PDF content bytes".getBytes()
        ))
        .param("citationId", "CIT-001")
        .header("Authorization", "Bearer " + jwt)
)
.andExpect(status().isOk())
.andExpect(jsonPath("$.attachmentId").exists())
.andExpect(jsonPath("$.filename").value("invoice.pdf"));
```

**Why MockMvc**: `MockMultipartFile` is a Spring test utility specifically built for `multipart/form-data`. Equivalent with `TestRestTemplate` requires building a `MultiValueMap<String, Object>` manually — more verbose and error-prone.

</details>

---

**Challenge B**: Your endpoint returns a paginated list. You want to iterate through ALL pages in a test and collect all items. Write this with `TestRestTemplate` and a `do/while` loop.

<details><summary>Answer</summary>

```java
record Page<T>(List<T> items, String nextCursor, boolean hasMore) {}

List<CitationDTO> allCitations = new ArrayList<>();
String cursor = null;

do {
    String url = "/api/citations?limit=50" + (cursor != null ? "&cursor=" + cursor : "");
    ResponseEntity<Page> response = restTemplate.getForEntity(url, Page.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    Page page = response.getBody();

    allCitations.addAll(page.items());
    cursor = page.hasMore() ? page.nextCursor() : null;

} while (cursor != null);

// Assert collected all expected citations
assertThat(allCitations).hasSizeGreaterThanOrEqualTo(100);
assertThat(allCitations.stream().map(c -> c.id()).distinct().count())
    .isEqualTo(allCitations.size()); // no duplicates
```

</details>

---

## 4. WireMock — Testing External API Dependencies

### 🧠 Foundation — What is WireMock?

When your Spring Boot service calls an external API (Dynamics 365, Stripe, a third-party REST service), tests face a choice:

1. Call the **real API** → slow, costs money, network-dependent, data shared with prod → ❌ for automated tests
2. **Mock the HTTP client** (Mockito `@MockBean` on `RestTemplate`) → doesn't test actual HTTP behaviour (serialization, headers, status codes) → ❌ incomplete
3. **WireMock** → spins up a REAL HTTP server on a local port, returns pre-configured responses → ✅ tests actual HTTP behavior without the real external dependency

```
Your Spring app → HTTP request → [WireMock server on port 8089] → stubbed response
                                  (instead of real Dynamics 365)
```

---

### 🔍 The Real-World SDET Problem

Your `DynamicsApiClient` calls `https://d365.company.com/citations/{id}`. In tests:

- The real D365 is unstable (staging flaps)
- Tests that call real D365 take 2-3 seconds vs 50ms for local stubs
- You need to test how your code handles D365 returning 503

Without WireMock, you can't easily simulate D365 returning 503.

---

### 🗺️ How to Think About It

```
WireMock stubs have two parts:
  1. Request matcher: "when I see THIS request..."
     → method (GET/POST), URL pattern, headers, body
  2. Response definition: "...return THAT response"
     → status code, headers, body, optional delay

Setup order:
  1. Start WireMock server (or use @AutoConfigureWireMock in Spring)
  2. Register stubs (before the test action)
  3. Call your Spring endpoint (which internally calls WireMock instead of real API)
  4. Assert your Spring app's behaviour
  5. Optionally verify WireMock received the expected calls
```

---

### ✍️ The Solution

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWireMock(port = 0)  // ← starts WireMock on a random port; Spring auto-configures
                                   //   ${wiremock.server.port} property
class DynamicsApiClientTest {

    @Autowired TestRestTemplate restTemplate;

    @Test
    void getCitation_dynamics365Returns200_propagatesData() {
        // Stub: when GET /citations/CIT-001 → return 200 with JSON body
        stubFor(get(urlEqualTo("/citations/CIT-001"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "citationId": "CIT-001",
                        "status": "ACTIVE",
                        "amount": 150.00
                    }
                    """)
            ));

        // Call YOUR API (which internally calls the WireMock stub)
        ResponseEntity<CitationDTO> response = restTemplate.getForEntity(
            "/api/citations/CIT-001", CitationDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatus()).isEqualTo("ACTIVE");

        // Verify WireMock received exactly 1 call (catches retry bugs)
        verify(1, getRequestedFor(urlEqualTo("/citations/CIT-001")));
    }

    @Test
    void getCitation_dynamics365Returns503_returnsServiceUnavailable() {
        // Simulate a D365 outage — impossible to do with real D365 in a controlled test
        stubFor(get(urlEqualTo("/citations/CIT-999"))
            .willReturn(aResponse()
                .withStatus(503)
                .withFixedDelay(2000)  // also simulate slow response (2s)
                .withBody("{\"error\": \"Service Unavailable\"}")
            ));

        ResponseEntity<ErrorResponse> response = restTemplate.getForEntity(
            "/api/citations/CIT-999", ErrorResponse.class
        );

        // Your circuit breaker / fallback should handle this
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody().getError()).contains("temporarily unavailable");
    }

    @Test
    void createCitation_dynamics365SlowResponse_returnsTimeoutError() {
        stubFor(post(urlEqualTo("/citations"))
            .willReturn(aResponse()
                .withStatus(200)
                .withFixedDelay(10_000)  // simulate 10-second lag
                .withBody("{\"citationId\": \"CIT-NEW\"}")
            ));

        // Your app should timeout after 5 seconds (configured in application.yml)
        long start = System.currentTimeMillis();
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity(
            "/api/citations", new CreateCitationRequest("USR-001", new BigDecimal("150")), ErrorResponse.class
        );
        long elapsed = System.currentTimeMillis() - start;

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.GATEWAY_TIMEOUT);
        assertThat(elapsed).isLessThan(6000); // failed fast — didn't wait the full 10s
    }
}
```

```yaml
# application-test.yml — override D365 base URL to point at WireMock
dynamics365:
  base-url: http://localhost:${wiremock.server.port}
  timeout-ms: 5000
```

---

### 🎯 Similar Challenges

**Challenge A**: Your `PaymentService` calls Stripe's API to process payments. Write WireMock stubs for three scenarios: (1) successful charge, (2) card declined (402), (3) Stripe rate limited (429 with Retry-After: 2). Assert your app's response for each.

<details><summary>Answer</summary>

```java
@Test
void processPayment_stripeSucceeds_returns200() {
    stubFor(post(urlEqualTo("/v1/charges"))
        .willReturn(aResponse()
            .withStatus(200)
            .withBody("{\"id\": \"ch_001\", \"status\": \"succeeded\", \"amount\": 15000}")));

    ResponseEntity<PaymentResult> res = restTemplate.postForEntity(
        "/api/payments", new PaymentRequest("CIT-001", "tok_visa"), PaymentResult.class);

    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(res.getBody().getChargeId()).isEqualTo("ch_001");
}

@Test
void processPayment_cardDeclined_returns402() {
    stubFor(post(urlEqualTo("/v1/charges"))
        .willReturn(aResponse()
            .withStatus(402)
            .withBody("{\"error\": {\"type\": \"card_error\", \"code\": \"card_declined\"}}")));

    ResponseEntity<ErrorResponse> res = restTemplate.postForEntity(
        "/api/payments", new PaymentRequest("CIT-001", "tok_chargeDeclined"), ErrorResponse.class);

    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.PAYMENT_REQUIRED);
    assertThat(res.getBody().getCode()).isEqualTo("CARD_DECLINED");
}

@Test
void processPayment_stripeRateLimited_respectsRetryAfter() {
    stubFor(post(urlEqualTo("/v1/charges"))
        .willReturn(aResponse()
            .withStatus(429)
            .withHeader("Retry-After", "2")
            .withBody("{\"error\": \"rate_limited\"}")));

    long start = System.currentTimeMillis();
    ResponseEntity<ErrorResponse> res = restTemplate.postForEntity(
        "/api/payments", new PaymentRequest("CIT-001", "tok_visa"), ErrorResponse.class);
    long elapsed = System.currentTimeMillis() - start;

    // App should retry after 2s (respecting Retry-After), then succeed or propagate error
    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    assertThat(elapsed).isBetween(1900L, 5000L); // waited ~2s before failing
}
```

</details>

---

**Challenge B**: You want to verify that when Dynamics 365 returns a 200 but with a malformed JSON body (missing required field `citationId`), your app returns a clear 502 Bad Gateway with an error message — NOT a 500 NullPointerException. Write the WireMock stub and assertion.

<details><summary>Answer</summary>

```java
@Test
void getCitation_malformedD365Response_returns502NotNullPointer() {
    stubFor(get(urlEqualTo("/citations/CIT-BROKEN"))
        .willReturn(aResponse()
            .withStatus(200)
            .withHeader("Content-Type", "application/json")
            .withBody("{\"status\": \"ACTIVE\"}") // missing citationId field!
        ));

    ResponseEntity<ErrorResponse> res = restTemplate.getForEntity(
        "/api/citations/CIT-BROKEN", ErrorResponse.class);

    // Must be 502 (Bad Gateway — upstream returned unusable data), not 500 (our bug)
    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
    assertThat(res.getBody().getError()).contains("upstream");
    assertThat(res.getBody().getError()).doesNotContain("NullPointerException"); // no stack trace leakage
}
```

This test catches the common bug where developers forget to validate the upstream response and let `NullPointerException` bubble up as a 500. A 502 is more honest and easier to debug.

</details>

---

## 5. EmbeddedKafka — Testing Async Event Consumers

### 🧠 Foundation — What is Embedded Kafka?

Kafka is normally a separate process (a server). In tests, spinning up a real Kafka server would:

- Take 5-10 seconds to start
- Require Docker or external infrastructure
- Leave state between tests

**Embedded Kafka** (`@EmbeddedKafka` from `spring-kafka-test`) starts an in-process Kafka broker — no Docker, no external process, starts in <1 second.

```
Normal: Your app → network → [Kafka cluster]
Embedded: Your app → in-memory → [Kafka running in same JVM]
```

---

### 🔍 The Real-World SDET Problem

`PaymentService` publishes `PaymentProcessedEvent` to Kafka topic `payment-processed`. `NotificationService` consumes that topic and sends an email. You need to:

1. Test that `PaymentService` publishes the correct event (producer test)
2. Test that `NotificationService` reacts correctly when an event arrives (consumer test)
3. Test the full flow end-to-end: payment → Kafka → notification

---

### 🗺️ How to Think About It

```
Async testing challenge:
  Producer publishes → Kafka → Consumer processes (in a different thread, different time)

  Test must:
    1. Publish or trigger an action
    2. WAIT for the async processing to complete (polling!)
    3. Assert the outcome

  Tools:
    @EmbeddedKafka → provides the in-process broker
    KafkaTemplate  → to publish test events
    KafkaConsumer  → to read from topics (verify producer output)
    CountDownLatch → to coordinate async consumer test completion
    expect.poll    → in Playwright (for API-level evidence)
```

---

### ✍️ The Solution

```java
// Producer test: verify the correct event was published to Kafka
@SpringBootTest
@EmbeddedKafka(
    partitions = 1,
    brokerProperties = {"listeners=PLAINTEXT://localhost:9092", "port=9092"},
    topics = {"payment-processed"}
)
class PaymentServiceKafkaProducerTest {

    @Autowired PaymentService paymentService;

    @Autowired
    @Autowired EmbeddedKafkaBroker embeddedKafka;

    private Consumer<String, String> consumer;

    @BeforeEach
    void setUpConsumer() {
        Map<String, Object> props = KafkaTestUtils.consumerProps("test-group", "true", embeddedKafka);
        consumer = new DefaultKafkaConsumerFactory<String, String>(props).createConsumer();
        embeddedKafka.consumeFromAnEmbeddedTopic(consumer, "payment-processed");
    }

    @AfterEach
    void tearDown() { consumer.close(); }

    @Test
    void processPayment_publishesCorrectKafkaEvent() {
        // Act
        paymentService.processPayment("CIT-001", new BigDecimal("150"));

        // Wait for Kafka message (async) with timeout
        ConsumerRecords<String, String> records = KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(5));

        assertThat(records.count()).isEqualTo(1);
        ConsumerRecord<String, String> record = records.iterator().next();

        // Assert event content
        PaymentProcessedEvent event = objectMapper.readValue(record.value(), PaymentProcessedEvent.class);
        assertThat(event.getCitationId()).isEqualTo("CIT-001");
        assertThat(event.getAmount()).isEqualByComparingTo(new BigDecimal("150"));
        assertThat(event.getTimestamp()).isNotNull();
    }
}


// Consumer test: verify NotificationService reacts correctly to incoming event
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"payment-processed"})
class NotificationServiceKafkaConsumerTest {

    @Autowired KafkaTemplate<String, String> kafkaTemplate;
    @MockBean EmailService emailService;  // mock the outbound email — we test the consumer logic

    @Test
    void onPaymentProcessedEvent_sendsEmail() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);

        // Capture the email call
        doAnswer(invocation -> {
            latch.countDown();  // signal: email was sent
            return null;
        }).when(emailService).sendPaymentConfirmation(anyString(), any());

        // Publish a test event to embedded Kafka
        String eventJson = """
            {"citationId":"CIT-001","userId":"USR-001","amount":150.00,"timestamp":"2026-01-01T10:00:00"}
            """;
        kafkaTemplate.send("payment-processed", "CIT-001", eventJson);

        // Wait for consumer to process (async) — max 10 seconds
        boolean received = latch.await(10, TimeUnit.SECONDS);

        assertThat(received).isTrue(); // consumer fired within 10 seconds
        verify(emailService).sendPaymentConfirmation("USR-001", new BigDecimal("150.00"));
    }

    @Test
    void onMalformedEvent_doesNotSendEmail_routesToDlt() throws InterruptedException {
        // Publish garbage — consumer must NOT send email but route to DLT
        kafkaTemplate.send("payment-processed", "BAD", "{broken json{{{{");

        // Wait a reasonable time
        Thread.sleep(3000);

        // Email must NOT have been sent for malformed events
        verify(emailService, never()).sendPaymentConfirmation(any(), any());
        // (In a complete test, also verify the DLT received the message)
    }
}
```

**Key insight for async tests**: use `CountDownLatch.await(timeout, unit)` to wait for async processing. Never use `Thread.sleep(fixedTime)` — it's always either too short (flaky) or too long (slow).

---

### 🎯 Similar Challenges

**Challenge A**: Your `AuditService` listens to three different Kafka topics: `payment-processed`, `citation-created`, and `user-registered`. Write a test that publishes one event to EACH topic and verifies `AuditService` creates exactly 3 audit log entries (one per event).

<details><summary>Answer</summary>

```java
@Test
void auditService_processesEventsFromThreeTopics_createsThreeAuditLogs()
    throws InterruptedException {

    CountDownLatch latch = new CountDownLatch(3); // expect 3 events

    doAnswer(inv -> { latch.countDown(); return null; })
        .when(auditRepository).save(any(AuditLog.class));

    // Publish to all three topics
    kafkaTemplate.send("payment-processed", """
        {"citationId":"CIT-001","amount":100,"timestamp":"2026-01-01T10:00:00"}""");
    kafkaTemplate.send("citation-created", """
        {"citationId":"CIT-002","userId":"USR-001","timestamp":"2026-01-01T10:01:00"}""");
    kafkaTemplate.send("user-registered", """
        {"userId":"USR-002","email":"test@example.com","timestamp":"2026-01-01T10:02:00"}""");

    boolean allProcessed = latch.await(15, TimeUnit.SECONDS);
    assertThat(allProcessed).withFailMessage("Not all 3 events were processed within 15s").isTrue();

    verify(auditRepository, times(3)).save(any(AuditLog.class));
}
```

</details>

---

## 6. Testcontainers — Real Database in Tests

### 🧠 Foundation — What is Testcontainers?

Testcontainers is a Java library that manages Docker containers in your test lifecycle:

- Spins up a REAL PostgreSQL container before your test class runs
- Provides the actual JDBC URL to Spring via `@DynamicPropertySource`
- Shuts down and removes the container after tests finish

```
Test starts → Docker: pull postgres:15 → start container → expose port 5432
         → Spring connects via jdbc:postgresql://localhost:{random-port}/test
         → Tests run against real PostgreSQL
Test ends  → Docker: stop + remove container
```

**Why not H2?**
H2 (in-memory DB) is fast but differs from PostgreSQL in:

- SQL syntax (some JPQL generates PostgreSQL-specific SQL)
- Constraints behavior
- Index strategies
- Full-text search functions

Testcontainers gives you the real thing.

---

### 🔍 The Real-World SDET Problem

Your migration added a PostgreSQL-specific partial index:

```sql
CREATE UNIQUE INDEX idx_citations_pending_user
ON citations(user_id)
WHERE status = 'PENDING';
```

This means: each user can have at most ONE pending citation at a time. You need a test that verifies this constraint is enforced. H2 doesn't support partial unique indexes — Testcontainers running real PostgreSQL does.

---

### ✍️ The Solution

```java
@SpringBootTest
@Testcontainers
class CitationPartialIndexTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("citations_test")
        .withUsername("test")
        .withPassword("test")
        .withInitScript("db/migrations/V1__initial_schema.sql"); // run Flyway-style scripts

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired CitationRepository repo;
    @Autowired CitationService service;

    @Test
    @Transactional  // rollback after test
    void createCitation_whenUserAlreadyHasPending_throwsConstraintViolation() {
        // Create first PENDING citation for user
        service.createCitation("USR-001", new BigDecimal("100"));

        // Attempt to create a SECOND pending citation — must fail
        assertThatThrownBy(() -> service.createCitation("USR-001", new BigDecimal("200")))
            .isInstanceOf(DataIntegrityViolationException.class)
            .hasMessageContaining("idx_citations_pending_user");
    }

    @Test
    @Transactional
    void createCitation_previousCitationPaid_allowsNewPending() {
        // First citation — pay it
        Citation first = service.createCitation("USR-002", new BigDecimal("100"));
        service.markPaid(first.getId());

        // Now create a new PENDING citation — should succeed (no pending in DB)
        assertThatNoException().isThrownBy(
            () -> service.createCitation("USR-002", new BigDecimal("200"))
        );
    }
}
```

**Shared container (performance optimization)**:

```java
// Reuse the same container across ALL test classes — faster than one per class
abstract class PostgreSQLTestBase {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("test");

    static {
        postgres.start(); // start ONCE, reused by all subclasses
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        // ...
    }
}

// Each test class extends the base — reuses the running container
class CitationRepositoryTest extends PostgreSQLTestBase { ... }
class PaymentRepositoryTest extends PostgreSQLTestBase { ... }
```

---

### 🎯 Similar Challenges

**Challenge A**: You need to test that your `CitationRepository.findByCitationNumber()` query handles NULL citation numbers gracefully — returning an empty Optional, NOT throwing a database exception. Write the Testcontainers test, including how you seed test data without using the service layer (which might have validation that prevents nulls).

<details><summary>Answer</summary>

```java
@Test
@Sql("/test-data/citation-with-null-number.sql") // SQL file that inserts a row with NULL citationNumber
void findByCitationNumber_nullInput_returnsEmpty() {
    Optional<Citation> result = repo.findByCitationNumber(null);
    assertThat(result).isEmpty();
}

// /test-data/citation-with-null-number.sql:
// INSERT INTO citations (id, user_id, status, citation_number, amount)
// VALUES ('CIT-NULL', 'USR-001', 'PENDING', NULL, 100.00);
```

**Why bypass the service layer?** Service layer validation rejects null `citationNumber` — you'd never create that state through the service. But LEGACY DATA in the DB might have nulls (migrated from an old system). Direct SQL setup lets you create the exact database state you need to test.

</details>

---

## 7. Spring Security Testing — Auth Flows End-to-End

### 🧠 Foundation — The Spring Security Request Processing Flow

```
Request → [SecurityFilterChain]
  ↓
  [1. SecurityContextPersistenceFilter]: restore security context from session/token
  [2. UsernamePasswordAuthenticationFilter]: handle form login
  [3. BearerTokenAuthenticationFilter]: handle JWT Bearer tokens
  [4. ExceptionTranslationFilter]: convert auth exceptions → 401/403 responses
  [5. FilterSecurityInterceptor]: check method-level @PreAuthorize rules
  ↓
  [Controller method executes]
```

Understanding this chain tells you EXACTLY why `@WithMockUser` works, why `@PreAuthorize` tests need specific setup, and why some security tests pass locally but fail in integration.

---

### 🔍 The Real-World SDET Problem

You have three security scenarios to test:

1. Unauthenticated user accessing a protected endpoint → 401
2. Authenticated user without the right role → 403
3. Authenticated user with correct role → 200

Each requires different test setup.

---

### ✍️ The Solution — Four Security Test Patterns

```java
@WebMvcTest(CitationController.class)
@Import(SecurityConfig.class)
class CitationSecurityTest {

    @Autowired MockMvc mockMvc;
    @MockBean CitationService citationService;
    @MockBean JwtTokenProvider jwtProvider;

    // Pattern 1: No auth → 401
    @Test
    void getSecuredEndpoint_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/citations/CIT-001"))
            .andExpect(status().isUnauthorized());
    }

    // Pattern 2: Valid auth but wrong role → 403
    @Test
    @WithMockUser(username = "officer@company.com", roles = {"OFFICER"})
    void approveCitation_officerRole_returns403() throws Exception {
        // OFFICER cannot approve — requires MANAGER or above
        mockMvc.perform(post("/api/citations/CIT-001/approve"))
            .andExpect(status().isForbidden());
    }

    // Pattern 3: Valid auth with correct role → 200
    @Test
    @WithMockUser(username = "manager@company.com", roles = {"MANAGER"})
    void approveCitation_managerRole_returns200() throws Exception {
        when(citationService.approve("CIT-001", "manager@company.com"))
            .thenReturn(new CitationDTO("CIT-001", "APPROVED", new BigDecimal("150")));

        mockMvc.perform(post("/api/citations/CIT-001/approve"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    // Pattern 4: Real JWT token (integration test of the JWT parsing)
    @Test
    void getEndpoint_withRealJwtToken_returns200() throws Exception {
        // Generate a real signed JWT (using your JwtTokenProvider, not mocked)
        String jwt = jwtTokenProvider.generateToken("USR-001", List.of("ROLE_USER"));

        when(citationService.findById("CIT-001"))
            .thenReturn(new CitationDTO("CIT-001", "PENDING", new BigDecimal("150")));

        mockMvc.perform(get("/api/citations/CIT-001")
                .header("Authorization", "Bearer " + jwt))
            .andExpect(status().isOk());
    }
}
```

**`@WithMockUser` deep-dive**: this annotation populates the `SecurityContextHolder` BEFORE the test method runs — it bypasses the filter chain entirely. It does NOT test your JWT parsing code — it only tests that once authentication succeeds, the authorization rules work correctly. To test JWT parsing itself, use Pattern 4 with a real token.

---

### 🎯 Similar Challenges

**Challenge A**: Your endpoint `DELETE /api/citations/{id}` should only succeed if the authenticated user is either the OWNER of the citation OR has the `SUPER_ADMIN` role. An `ADMIN` who is NOT the owner should get 403. Write the `@PreAuthorize` expression and two tests proving both cases.

<details><summary>Answer</summary>

```java
// Controller method
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('SUPER_ADMIN') or @citationSecurity.isOwner(#id, authentication.name)")
public ResponseEntity<Void> deleteCitation(@PathVariable String id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
}

// Security helper bean — Spring evaluates @citationSecurity.isOwner(...)
@Component("citationSecurity")
public class CitationSecurityService {
    @Autowired CitationRepository repo;

    public boolean isOwner(String citationId, String username) {
        return repo.findById(citationId)
            .map(c -> c.getOwnerEmail().equals(username))
            .orElse(false);
    }
}

// Tests:
@Test
@WithMockUser(username = "admin@company.com", roles = {"ADMIN"})
void deleteCitation_adminNotOwner_returns403() throws Exception {
    // Simulate: citation is owned by a different user
    when(citationService.getOwner("CIT-001")).thenReturn("otheruser@company.com");

    mockMvc.perform(delete("/api/citations/CIT-001"))
        .andExpect(status().isForbidden());
}

@Test
@WithMockUser(username = "owner@company.com", roles = {"USER"})
void deleteCitation_ownerUser_returns204() throws Exception {
    // Simulate: citation is owned by this user
    when(citationSecurity.isOwner("CIT-001", "owner@company.com")).thenReturn(true);

    mockMvc.perform(delete("/api/citations/CIT-001"))
        .andExpect(status().isNoContent());
}
```

</details>

---

**Challenge B**: You need to test the full JWT flow: a user submits their credentials to `POST /auth/login`, receives a JWT, and then uses that JWT to call a protected endpoint. Write this as a single integration test using `TestRestTemplate` (so you test real HTTP and real JWT generation/parsing).

<details><summary>Answer</summary>

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class JwtAuthFlowIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepo;
    @Autowired PasswordEncoder encoder;

    @Test
    void loginThenAccessProtectedEndpoint_fullJwtFlow() {
        // Setup: create a user in the DB
        userRepo.save(new User("testuser@example.com", encoder.encode("password123"), "ROLE_USER"));

        // Step 1: Login → get JWT
        ResponseEntity<LoginResponse> loginRes = restTemplate.postForEntity(
            "/auth/login",
            Map.of("email", "testuser@example.com", "password", "password123"),
            LoginResponse.class
        );
        assertThat(loginRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        String jwt = loginRes.getBody().getToken();
        assertThat(jwt).isNotBlank().startsWith("eyJ"); // JWTs start with eyJ (base64 of {"alg":...})

        // Step 2: Use JWT to access protected endpoint
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwt);
        ResponseEntity<CitationDTO[]> citationsRes = restTemplate.exchange(
            "/api/citations",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            CitationDTO[].class
        );
        assertThat(citationsRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Step 3: Tampered JWT must return 401
        String tamperedJwt = jwt.substring(0, jwt.lastIndexOf('.') + 1) + "tampered_signature";
        headers.set("Authorization", "Bearer " + tamperedJwt);
        ResponseEntity<ErrorResponse> tamperedRes = restTemplate.exchange(
            "/api/citations",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            ErrorResponse.class
        );
        assertThat(tamperedRes.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
```

**This test proves**: JWT generation works, JWT validation works, tamper detection works, the full filter chain integrates correctly — all in one test.

</details>

---

**Navigation**: [← Spring Boot × DSA](12_SpringBoot_Plus_DSA_Progressive.md) | [📚 Index](../00_INDEX.md) | [🔥 Elite Rounds →](10_Elite_Cross_Domain_Rounds.md)


---

## Reality Check

**"Testing Spring Boot is just writing unit tests"** ? Spring testing is a LAYERED discipline with framework-specific tooling ([21_SDET, 07_Modern_Java]): the pure unit test (no Spring context � fast), the slice test (@WebMvcTest, @DataJpaTest � partial context), the full integration test (@SpringBootTest � slow, real wiring), and the testcontainers for real dependencies. The fusion rounds drill choosing the right test layer for what you are verifying ([13_DE testing]'s pyramid, Spring flavor), and "just unit tests" misses the slice-versus-integration decision that determines whether Spring tests are fast-and-focused or slow-and-brittle.

**"An SDET testing a Spring app doesn't need Spring internals"** ? Testing Spring effectively requires understanding what you are testing ([07_Modern_Java Ch55]): the transaction behavior in tests (the @Transactional rollback, the test that shares or isolates state), the proxy and DI (the mock that must be injected correctly), the context caching (the slow suite from too many distinct contexts). The SDET who does not understand Spring internals writes tests that are flaky, slow, or that test the mock not the behavior � and these rounds integrate the Spring-internals knowledge with the testing skill.

**"Test strategy for a backend is the same as for a frontend"** ? Backend testing emphasizes different layers and concerns ([21_SDET Ch62, 22_Advanced_API_Testing]): the API contract testing ([21_SDET Ch38]), the database verification ([21_SDET Ch30]), the transaction and data-lifecycle ([21_SDET Ch28]), the service integration � versus the frontend's UI and interaction focus. The fusion rounds drill the backend test strategy (the API, the data, the integration, the [21_SDET Ch62] test-data-and-environments), and applying frontend testing instincts to a backend misses the contract, data, and transaction concerns that dominate backend testing.

**"The SDET and developer skills don't overlap here"** ? This fusion is exactly where they MERGE � the developer who tests well and the SDET who understands the code ([21_SDET Ch32-36 the bridge]): the SDET building the test infrastructure for a Spring app needs the Spring knowledge, and the developer needs the testing discipline. The progressive rounds bridge the SDET's testing depth with the backend developer's framework-and-fundamentals knowledge, which is the [21_SDET] SDET-to-SDE bridge in practice � and treating the skills as non-overlapping misses that modern quality engineering requires both.

**"Integration testing a Spring app is straightforward"** ? Spring integration testing is full of specific traps ([21_SDET Ch26, 07_Modern_Java]): the test-data isolation across tests ([21_SDET Ch09, Ch28] � the shared database state, the transaction that must roll back or the data that pollutes), the context caching and the slow suite, the flaky tests from timing and async, the testcontainers lifecycle. The fusion rounds drill these Spring-integration-testing realities (the isolation, the context management, the flakiness � the [21_SDET Ch26] taxonomy in Spring form), and "straightforward" is exactly the underestimation that produces the slow, flaky, state-polluting integration suite.
