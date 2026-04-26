**Navigation**: [< Previous Chapter](Ch48_SB_WebFlux_Core.md) | [Back to Index](../00_MASTER_INDEX.md)

---

    // Transaction example
    @Transactional
    public Mono<Void> transferData(Long fromUserId, Long toUserId) {
        return databaseClient.sql("UPDATE accounts SET balance = balance - 100 WHERE user_id = :id")
            .bind("id", fromUserId)
            .fetch()
            .rowsUpdated()
            .then(databaseClient.sql("UPDATE accounts SET balance = balance + 100 WHERE user_id = :id")
                .bind("id", toUserId)
                .fetch()
                .rowsUpdated())
            .then();
    }
}
```

### Handling Relationships (Manual Joins)

```java
/**
 * R2DBC doesn't support JPA relationships
 * You must handle joins manually
 */

@Table("posts")
@Data
public class Post {
    @Id
    private Long id;
    private String title;
    private String content;
    private Long authorId;  // FK, not @ManyToOne!
    private LocalDateTime createdAt;
}

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // Manual join - fetch post with author
    public Mono<PostWithAuthor> findPostWithAuthor(Long postId) {
        return postRepository.findById(postId)
            .flatMap(post -> userRepository.findById(post.getAuthorId())
                .map(author -> new PostWithAuthor(post, author)));
    }

    // Fetch all posts with authors
    public Flux<PostWithAuthor> findAllPostsWithAuthors() {
        return postRepository.findAll()
            .flatMap(post -> userRepository.findById(post.getAuthorId())
                .map(author -> new PostWithAuthor(post, author)));
    }

    // More efficient: batch fetch authors
    public Flux<PostWithAuthor> findAllPostsWithAuthorsBatch() {
        return postRepository.findAll()
            .collectList()
            .flatMapMany(posts -> {
                // Collect unique author IDs
                Set<Long> authorIds = posts.stream()
                    .map(Post::getAuthorId)
                    .collect(Collectors.toSet());

                // Fetch all authors at once
                return userRepository.findAllById(authorIds)
                    .collectMap(User::getId)
                    .flatMapMany(authorsMap ->
                        Flux.fromIterable(posts)
                            .map(post -> new PostWithAuthor(
                                post,
                                authorsMap.get(post.getAuthorId())
                            )));
            });
    }
}

@Data
@AllArgsConstructor
public class PostWithAuthor {
    private Post post;
    private User author;
}
```

---

# SECTION 5: WEBCLIENT - REACTIVE HTTP CLIENT

---

## Chapter 7: WebClient Basics

```java
/**
 * WebClient - The reactive replacement for RestTemplate
 *
 * Features:
 * - Non-blocking
 * - Supports streaming
 * - Built-in retry, timeout
 * - Functional API
 */

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
            .baseUrl("https://api.example.com")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .filter(logRequest())
            .filter(logResponse())
            .codecs(configurer -> configurer
                .defaultCodecs()
                .maxInMemorySize(16 * 1024 * 1024))  // 16MB buffer
            .build();
    }

    // Logging filter
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.info("Request: {} {}", request.method(), request.url());
            return Mono.just(request);
        });
    }

    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            log.info("Response status: {}", response.statusCode());
            return Mono.just(response);
        });
    }

    @Bean
    public WebClient webClientWithTimeout() {
        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(10))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000);

        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}

// ==================== USING WEBCLIENT ====================

@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiService {

    private final WebClient webClient;

    // GET request - single object
    public Mono<UserDto> getUser(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .bodyToMono(UserDto.class);
    }

    // GET request - list
    public Flux<UserDto> getAllUsers() {
        return webClient.get()
            .uri("/users")
            .retrieve()
            .bodyToFlux(UserDto.class);
    }

    // GET with query parameters
    public Flux<UserDto> searchUsers(String query, int page, int size) {
        return webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/users/search")
                .queryParam("q", query)
                .queryParam("page", page)
                .queryParam("size", size)
                .build())
            .retrieve()
            .bodyToFlux(UserDto.class);
    }

    // POST request
    public Mono<UserDto> createUser(CreateUserRequest request) {
        return webClient.post()
            .uri("/users")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(UserDto.class);
    }

    // POST with Mono body
    public Mono<UserDto> createUserReactive(Mono<CreateUserRequest> request) {
        return webClient.post()
            .uri("/users")
            .body(request, CreateUserRequest.class)
            .retrieve()
            .bodyToMono(UserDto.class);
    }

    // PUT request
    public Mono<UserDto> updateUser(Long id, UpdateUserRequest request) {
        return webClient.put()
            .uri("/users/{id}", id)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(UserDto.class);
    }

    // DELETE request
    public Mono<Void> deleteUser(Long id) {
        return webClient.delete()
            .uri("/users/{id}", id)
            .retrieve()
            .bodyToMono(Void.class);
    }

    // With headers
    public Mono<UserDto> getUserWithAuth(Long id, String token) {
        return webClient.get()
            .uri("/users/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .bodyToMono(UserDto.class);
    }

    // Error handling
    public Mono<UserDto> getUserWithErrorHandling(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, response -> {
                if (response.statusCode() == HttpStatus.NOT_FOUND) {
                    return Mono.error(new UserNotFoundException(id));
                }
                return response.bodyToMono(String.class)
                    .flatMap(body -> Mono.error(new ClientException(body)));
            })
            .onStatus(HttpStatusCode::is5xxServerError, response ->
                Mono.error(new ServerException("Server error")))
            .bodyToMono(UserDto.class);
    }

    // With retry
    public Mono<UserDto> getUserWithRetry(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .bodyToMono(UserDto.class)
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                .filter(throwable -> throwable instanceof ServerException)
                .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) ->
                    new ServerException("Max retries exceeded")));
    }

    // With timeout
    public Mono<UserDto> getUserWithTimeout(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .bodyToMono(UserDto.class)
            .timeout(Duration.ofSeconds(5))
            .onErrorResume(TimeoutException.class, e ->
                Mono.error(new ServiceUnavailableException("Timeout")));
    }

    // Exchange for full response access
    public Mono<ResponseEntity<UserDto>> getUserWithFullResponse(Long id) {
        return webClient.get()
            .uri("/users/{id}", id)
            .retrieve()
            .toEntity(UserDto.class);
    }

    // SSE (Server-Sent Events) streaming
    public Flux<ServerSentEvent<String>> streamEvents() {
        return webClient.get()
            .uri("/events/stream")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .retrieve()
            .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {});
    }
}
```

---

# SECTION 6: ERROR HANDLING IN REACTIVE STREAMS

---

## Chapter 8: Error Handling Operators

```java
public class ReactiveErrorHandling {

    // ==================== ERROR OPERATORS ====================

    public void errorOperators() {

        // onErrorReturn - Return default value on error
        Mono<String> mono1 = callService()
            .onErrorReturn("default value");

        // onErrorReturn with predicate
        Mono<String> mono2 = callService()
            .onErrorReturn(
                e -> e instanceof TimeoutException,
                "timeout default"
            );

        // onErrorResume - Switch to fallback publisher
        Mono<String> mono3 = callService()
            .onErrorResume(e -> callBackupService());

        // onErrorResume with different fallbacks per error type
        Mono<String> mono4 = callService()
            .onErrorResume(TimeoutException.class, e -> callBackupService())
            .onErrorResume(NotFoundException.class, e -> Mono.empty())
            .onErrorResume(e -> Mono.error(new ServiceException(e)));

        // onErrorMap - Transform error
        Mono<String> mono5 = callService()
            .onErrorMap(e -> new CustomException("Wrapped: " + e.getMessage()));

        // onErrorMap with predicate
        Mono<String> mono6 = callService()
            .onErrorMap(
                e -> e instanceof IllegalStateException,
                e -> new BadRequestException(e.getMessage())
            );

        // doOnError - Side effect on error (logging)
        Mono<String> mono7 = callService()
            .doOnError(e -> log.error("Error occurred: {}", e.getMessage()))
            .onErrorReturn("fallback");

        // onErrorContinue (Flux) - Log error and continue with other elements
        Flux<Integer> flux1 = Flux.just(1, 2, 3, 4, 5)
            .map(i -> {
                if (i == 3) throw new RuntimeException("Error on 3");
                return i * 10;
            })
            .onErrorContinue((error, item) ->
                log.warn("Skipping item {} due to: {}", item, error.getMessage())
            );
        // Result: 10, 20, 40, 50 (3 is skipped)

        // retry - Retry on error
        Mono<String> mono8 = callService()
            .retry(3);  // Retry up to 3 times

        // retryWhen - Advanced retry with backoff
        Mono<String> mono9 = callService()
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                .maxBackoff(Duration.ofSeconds(10))
                .jitter(0.5)  // Add randomness
                .filter(e -> e instanceof RetryableException)
                .doBeforeRetry(signal ->
                    log.info("Retrying, attempt {}", signal.totalRetries()))
            );
    }

    // ==================== GLOBAL ERROR HANDLING ====================

    @ControllerAdvice
    public class GlobalErrorHandler {

        @ExceptionHandler(NotFoundException.class)
        @ResponseStatus(HttpStatus.NOT_FOUND)
        public Mono<ErrorResponse> handleNotFound(NotFoundException ex) {
            return Mono.just(new ErrorResponse(
                "NOT_FOUND",
                ex.getMessage(),
                LocalDateTime.now()
            ));
        }

        @ExceptionHandler(ValidationException.class)
        @ResponseStatus(HttpStatus.BAD_REQUEST)
        public Mono<ErrorResponse> handleValidation(ValidationException ex) {
            return Mono.just(new ErrorResponse(
                "VALIDATION_ERROR",
                ex.getMessage(),
                LocalDateTime.now()
            ));
        }

        @ExceptionHandler(Exception.class)
        @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
        public Mono<ErrorResponse> handleGeneral(Exception ex) {
            log.error("Unhandled exception", ex);
            return Mono.just(new ErrorResponse(
                "INTERNAL_ERROR",
                "An unexpected error occurred",
                LocalDateTime.now()
            ));
        }
    }

    // ==================== FUNCTIONAL ENDPOINT ERROR HANDLING ====================

    @Component
    public class ErrorHandlerConfig {

        @Bean
        public WebExceptionHandler errorHandler() {
            return (exchange, ex) -> {
                ServerHttpResponse response = exchange.getResponse();

                if (ex instanceof NotFoundException) {
                    response.setStatusCode(HttpStatus.NOT_FOUND);
                } else if (ex instanceof ValidationException) {
                    response.setStatusCode(HttpStatus.BAD_REQUEST);
                } else {
                    response.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
                }

                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

                ErrorResponse error = new ErrorResponse(
                    response.getStatusCode().toString(),
                    ex.getMessage(),
                    LocalDateTime.now()
                );

                DataBuffer buffer = response.bufferFactory()
                    .wrap(objectMapper.writeValueAsBytes(error));

                return response.writeWith(Mono.just(buffer));
            };
        }
    }

    private Mono<String> callService() {
        return Mono.just("result");
    }

    private Mono<String> callBackupService() {
        return Mono.just("backup result");
    }
}

@Data
@AllArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private LocalDateTime timestamp;
}
```

---



🔬 **Section Challenge — Chapter 8: Error Handling Operators**

**Challenge 1 (Reasoning):** In Spring WebFlux, what happens if you forget to subscribe to a `Mono` or `Flux` publisher?
<details><summary>Answer</summary>

Nothing happens. Absolutely nothing. Reactive streams in Project Reactor are "cold" by default. The entire pipeline of `.map()`, `.filter()`, and `.flatMap()` is just a blueprint of what *should* happen. The execution is never triggered, no network calls are made, and no data is processed until a terminal `.subscribe()` method is called (which Spring WebFlux automatically does for you when you return the Publisher from a Controller).
</details>


# SECTION 7: TESTING REACTIVE CODE

---

## Chapter 9: StepVerifier

```java
import reactor.test.StepVerifier;
import reactor.test.publisher.TestPublisher;

@ExtendWith(MockitoExtension.class)
public class ReactiveServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    // ==================== STEPVERIFIER BASICS ====================

    @Test
    void testMonoSuccess() {
        Mono<String> mono = Mono.just("Hello");

        StepVerifier.create(mono)
            .expectNext("Hello")
            .verifyComplete();  // Must complete
    }

    @Test
    void testMonoEmpty() {
        Mono<String> mono = Mono.empty();

        StepVerifier.create(mono)
            .verifyComplete();  // Just completes, no elements
    }

    @Test
    void testMonoError() {
        Mono<String> mono = Mono.error(new RuntimeException("Error!"));

        StepVerifier.create(mono)
            .expectError(RuntimeException.class)
            .verify();
    }

    @Test
    void testFluxElements() {
        Flux<Integer> flux = Flux.just(1, 2, 3, 4, 5);

        StepVerifier.create(flux)
            .expectNext(1)
            .expectNext(2)
            .expectNext(3, 4, 5)  // Multiple at once
            .verifyComplete();
    }

    @Test
    void testFluxCount() {
        Flux<Integer> flux = Flux.range(1, 100);

        StepVerifier.create(flux)
            .expectNextCount(100)
            .verifyComplete();
    }

    @Test
    void testFluxWithPredicate() {
        Flux<Integer> flux = Flux.just(2, 4, 6, 8);

        StepVerifier.create(flux)
            .expectNextMatches(i -> i % 2 == 0)
            .expectNextMatches(i -> i > 2)
            .expectNextCount(2)
            .verifyComplete();
    }

    @Test
    void testFluxConsumeWith() {
        Flux<String> flux = Flux.just("hello", "world");

        StepVerifier.create(flux)
            .consumeNextWith(s -> assertThat(s).hasSize(5))
            .consumeNextWith(s -> assertThat(s).startsWith("w"))
            .verifyComplete();
    }

    // ==================== TESTING WITH VIRTUAL TIME ====================

    @Test
    void testWithVirtualTime() {
        // Testing delayed elements without actually waiting
        StepVerifier.withVirtualTime(() ->
                Flux.interval(Duration.ofSeconds(1)).take(3))
            .expectSubscription()
            .expectNoEvent(Duration.ofSeconds(1))
            .expectNext(0L)
            .thenAwait(Duration.ofSeconds(2))
            .expectNext(1L, 2L)
            .verifyComplete();
    }

    @Test
    void testTimeoutWithVirtualTime() {
        StepVerifier.withVirtualTime(() ->
                Mono.delay(Duration.ofHours(1)).map(l -> "result"))
            .expectSubscription()
            .thenAwait(Duration.ofHours(1))
            .expectNext("result")
            .verifyComplete();
    }

    // ==================== TESTING SERVICE METHODS ====================

    @Test
    void testFindById_Found() {
        User user = new User(1L, "john", "john@test.com");
        when(userRepository.findById(1L)).thenReturn(Mono.just(user));

        StepVerifier.create(userService.findById(1L))
            .assertNext(dto -> {
                assertThat(dto.getUsername()).isEqualTo("john");
                assertThat(dto.getEmail()).isEqualTo("john@test.com");
            })
            .verifyComplete();
    }

    @Test
    void testFindById_NotFound() {
        when(userRepository.findById(999L)).thenReturn(Mono.empty());

        StepVerifier.create(userService.findById(999L))
            .verifyComplete();  // Empty mono
    }

    @Test
    void testFindAll() {
        List<User> users = Arrays.asList(
            new User(1L, "john", "john@test.com"),
            new User(2L, "jane", "jane@test.com")
        );
        when(userRepository.findAll()).thenReturn(Flux.fromIterable(users));

        StepVerifier.create(userService.findAll())
            .expectNextCount(2)
            .verifyComplete();
    }

    // ==================== TEST PUBLISHER ====================

    @Test
    void testWithTestPublisher() {
        // Create a controllable publisher
        TestPublisher<String> testPublisher = TestPublisher.create();

        Flux<String> flux = testPublisher.flux();

        StepVerifier.create(flux)
            .then(() -> testPublisher.emit("A", "B", "C"))
            .expectNext("A", "B", "C")
            .verifyComplete();
    }

    @Test
    void testBackpressure() {
        Flux<Integer> flux = Flux.range(1, 100);

        StepVerifier.create(flux, 10)  // Request only 10
            .expectNextCount(10)
            .thenCancel()  // Cancel remaining
            .verify();
    }
}
```

---

# SECTION 8: BACKPRESSURE & PERFORMANCE

---

## Chapter 10: Managing Backpressure

```java
public class BackpressureExamples {

    /**
     * BACKPRESSURE STRATEGIES
     *
     * When producer is faster than consumer:
     */

    public void backpressureStrategies() {
        // Fast producer
        Flux<Long> fastProducer = Flux.interval(Duration.ofMillis(1));

        // BUFFER - Store elements in memory (default)
        // Risk: OutOfMemoryError if buffer grows too large
        Flux<Long> buffered = fastProducer
            .onBackpressureBuffer(1000);  // Buffer up to 1000

        // BUFFER with overflow strategy
        Flux<Long> bufferedWithStrategy = fastProducer
            .onBackpressureBuffer(
                100,
                item -> log.warn("Dropped: {}", item),  // Overflow callback
                BufferOverflowStrategy.DROP_OLDEST      // Drop strategy
            );

        // DROP - Drop elements consumer can't handle
        Flux<Long> dropped = fastProducer
            .onBackpressureDrop(
                item -> log.warn("Dropped: {}", item)
            );

        // LATEST - Keep only the latest element
        Flux<Long> latest = fastProducer
            .onBackpressureLatest();

        // ERROR - Signal error on overflow
        Flux<Long> errored = fastProducer
            .onBackpressureError();
    }

    // ==================== RATE LIMITING ====================

    public void rateLimiting() {
        Flux<Integer> source = Flux.range(1, 1000);

        // limitRate - Request elements in batches
        Flux<Integer> limited = source
            .limitRate(10);  // Request 10 at a time

        // limitRate with prefetch
        Flux<Integer> limitedPrefetch = source
            .limitRate(100, 10);  // Prefetch 100, then 10 at a time

        // Sample - Emit at intervals
        Flux<Long> sampled = Flux.interval(Duration.ofMillis(1))
            .sample(Duration.ofSeconds(1));  // One per second

        // Throttle first
        Flux<Long> throttled = Flux.interval(Duration.ofMillis(100))
            .throttleFirst(Duration.ofSeconds(1));

        // Window - Group into windows
        Flux<Flux<Integer>> windowed = source
            .window(10);  // Windows of 10 elements

        // Buffer - Collect into lists
        Flux<List<Integer>> buffered = source
            .buffer(10);  // Lists of 10 elements
    }

    // ==================== PARALLEL PROCESSING ====================

    public void parallelProcessing() {
        Flux<Integer> source = Flux.range(1, 100);

        // Parallel processing on multiple rails
        source
            .parallel(4)  // 4 parallel rails
            .runOn(Schedulers.parallel())
            .map(i -> processItem(i))
            .sequential()  // Back to sequential
            .subscribe();

        // FlatMap with concurrency limit
        source
            .flatMap(
                i -> processAsync(i),
                8  // Max 8 concurrent subscriptions
            )
            .subscribe();
    }

    // ==================== SCHEDULERS ====================

    public void schedulers() {
        Flux<Integer> source = Flux.range(1, 10);

        // subscribeOn - Affects upstream (source)
        source
            .subscribeOn(Schedulers.boundedElastic())  // Run source on elastic
            .map(i -> i * 2)
            .subscribe();

        // publishOn - Affects downstream
        source
            .publishOn(Schedulers.parallel())  // Run downstream on parallel
            .map(i -> i * 2)
            .subscribe();

        /**
         * SCHEDULERS:
         *
         * Schedulers.immediate()      - Current thread (no context switch)
         * Schedulers.single()         - Single reusable thread
         * Schedulers.parallel()       - Fixed pool (CPU cores)
         * Schedulers.boundedElastic() - Bounded elastic pool (for blocking I/O)
         * Schedulers.fromExecutor()   - Custom executor
         */

        // For blocking calls
        Mono.fromCallable(() -> blockingCall())
            .subscribeOn(Schedulers.boundedElastic())  // IMPORTANT!
            .subscribe();
    }

    private Integer processItem(Integer i) {
        return i * 2;
    }

    private Mono<Integer> processAsync(Integer i) {
        return Mono.just(i * 2)
            .delayElement(Duration.ofMillis(100));
    }

    private String blockingCall() throws Exception {
        Thread.sleep(1000);
        return "result";
    }
}
```

---



🔬 **Section Challenge — Chapter 10: Managing Backpressure**

**Challenge 1 (Reasoning):** In Spring WebFlux, what happens if you forget to subscribe to a `Mono` or `Flux` publisher?
<details><summary>Answer</summary>

Nothing happens. Absolutely nothing. Reactive streams in Project Reactor are "cold" by default. The entire pipeline of `.map()`, `.filter()`, and `.flatMap()` is just a blueprint of what *should* happen. The execution is never triggered, no network calls are made, and no data is processed until a terminal `.subscribe()` method is called (which Spring WebFlux automatically does for you when you return the Publisher from a Controller).
</details>


# SECTION 9: WHEN TO USE WEBFLUX vs MVC

---

## Chapter 11: Making the Right Choice

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│              WEBFLUX vs MVC DECISION MATRIX                                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CHOOSE SPRING MVC WHEN:                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐      │
│  │ ✓ Traditional CRUD application                                         │      │
│  │ ✓ Team is familiar with blocking paradigm                             │       │
│  │ ✓ Using JPA/Hibernate (blocking by design)                           │        │
│  │ ✓ Moderate traffic (hundreds/thousands RPS)                          │        │
│  │ ✓ Complex business logic with many interconnected calls              │        │
│  │ ✓ Need mature ecosystem (more libraries, tools)                      │        │
│  └────────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  CHOOSE SPRING WEBFLUX WHEN:                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐      │
│  │ ✓ High concurrency (10K+ simultaneous connections)                    │       │
│  │ ✓ Streaming data (real-time feeds, SSE, WebSocket)                   │        │
│  │ ✓ Microservices with many external calls (API Gateway)               │        │
│  │ ✓ Event-driven architecture                                           │       │
│  │ ✓ Limited resources (need efficiency)                                 │       │
│  │ ✓ Team comfortable with reactive programming                         │        │
│  └────────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  ⚠️ DON'T USE WEBFLUX IF:                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐      │
│  │ ✗ Need JPA relationships (@OneToMany, @ManyToOne)                    │        │
│  │ ✗ Team unfamiliar with reactive concepts                             │        │
│  │ ✗ Need blocking libraries without reactive alternatives              │        │
│  │ ✗ Simple CRUD without high concurrency needs                         │        │
│  └────────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│              COMMON MISTAKES TO AVOID                                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. BLOCKING IN REACTIVE CODE                                                    │
│     ❌ BAD:                                                                       │
│     Mono.just(repository.findById(id))  // Blocking call!                        │
│                                                                                  │
│     ✅ GOOD:                                                                      │
│     Mono.fromCallable(() -> repository.findById(id))                             │
│         .subscribeOn(Schedulers.boundedElastic())                                │
│                                                                                  │
│  2. NOT SUBSCRIBING                                                              │
│     ❌ BAD:                                                                       │
│     userService.createUser(request);  // Nothing happens!                        │
│                                                                                  │
│     ✅ GOOD:                                                                      │
│     return userService.createUser(request);  // Let Spring subscribe             │
│                                                                                  │
│  3. USING .block() IN REACTIVE CODE                                              │
│     ❌ BAD:                                                                       │
│     User user = userService.findById(id).block();  // Defeats purpose!           │
│                                                                                  │
│     ✅ GOOD:                                                                      │
│     return userService.findById(id).map(this::process);                          │
│                                                                                  │
│  4. MIXING MVC AND WEBFLUX DEPENDENCIES                                          │
│     ❌ BAD:                                                                       │
│     Including both spring-boot-starter-web AND spring-boot-starter-webflux       │
│                                                                                  │
│     ✅ GOOD:                                                                      │
│     Use only one (Spring Boot uses MVC if both present)                          │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Complete WebFlux Application Example

```java
// ============== APPLICATION SETUP ==============

@SpringBootApplication
public class ReactiveApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReactiveApplication.class, args);
    }
}

// ============== CONFIGURATION ==============

@Configuration
@EnableR2dbcAuditing
@EnableR2dbcRepositories
public class DatabaseConfig extends AbstractR2dbcConfiguration {

    @Override
    @Bean
    public ConnectionFactory connectionFactory() {
        return ConnectionFactories.get(ConnectionFactoryOptions.builder()
            .option(DRIVER, "postgresql")
            .option(HOST, "localhost")
            .option(PORT, 5432)
            .option(USER, "postgres")
            .option(PASSWORD, "password")
            .option(DATABASE, "reactive_db")
            .build());
    }
}

// ============== ENTITY ==============

@Table("products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}

// ============== REPOSITORY ==============

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {

    Flux<Product> findByNameContainingIgnoreCase(String name);

    @Query("SELECT * FROM products WHERE price BETWEEN :min AND :max")
    Flux<Product> findByPriceRange(BigDecimal min, BigDecimal max);

    @Modifying
    @Query("UPDATE products SET stock = stock - :quantity WHERE id = :id AND stock >= :quantity")
    Mono<Integer> decrementStock(Long id, Integer quantity);
}

// ============== DTOs ==============

@Data
@Builder
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
}

@Data
public class CreateProductRequest {
    @NotBlank
    private String name;
    private String description;
    @NotNull @Positive
    private BigDecimal price;
    @NotNull @PositiveOrZero
    private Integer stock;
}

// ============== SERVICE ==============

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    public Mono<ProductDto> findById(Long id) {
        return productRepository.findById(id)
            .map(this::toDto)
            .doOnSuccess(p -> log.debug("Found product: {}", p));
    }

    public Flux<ProductDto> findAll() {
        return productRepository.findAll()
            .map(this::toDto);
    }

    public Flux<ProductDto> search(String query) {
        return productRepository.findByNameContainingIgnoreCase(query)
            .map(this::toDto);
    }

    public Mono<ProductDto> create(CreateProductRequest request) {
        Product product = Product.builder()
            .name(request.getName())
            .description(request.getDescription())
            .price(request.getPrice())
            .stock(request.getStock())
            .build();

        return productRepository.save(product)
            .map(this::toDto)
            .doOnSuccess(p -> log.info("Created product: {}", p.getId()));
    }

    @Transactional
    public Mono<ProductDto> purchase(Long productId, Integer quantity) {
        return productRepository.decrementStock(productId, quantity)
            .filter(updated -> updated > 0)
            .switchIfEmpty(Mono.error(new InsufficientStockException(productId)))
            .flatMap(u -> productRepository.findById(productId))
            .map(this::toDto);
    }

    private ProductDto toDto(Product product) {
        return ProductDto.builder()
            .id(product.getId())
            .name(product.getName())
            .description(product.getDescription())
            .price(product.getPrice())
            .stock(product.getStock())
            .build();
    }
}

// ============== CONTROLLER ==============

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ProductDto>> getProduct(@PathVariable Long id) {
        return productService.findById(id)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping
    public Flux<ProductDto> getAllProducts(
            @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return productService.search(search);
        }
        return productService.findAll();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ProductDto> streamProducts() {
        return productService.findAll()
            .delayElements(Duration.ofMillis(500));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ProductDto> createProduct(
            @Valid @RequestBody Mono<CreateProductRequest> request) {
        return request.flatMap(productService::create);
    }

    @PostMapping("/{id}/purchase")
    public Mono<ResponseEntity<ProductDto>> purchaseProduct(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        return productService.purchase(id, quantity)
            .map(ResponseEntity::ok)
            .onErrorResume(InsufficientStockException.class, e ->
                Mono.just(ResponseEntity.badRequest().build()));
    }
}
```

---



🔬 **Section Challenge — Chapter 11: Making the Right Choice**

**Challenge 1 (Reasoning):** In Spring WebFlux, what happens if you forget to subscribe to a `Mono` or `Flux` publisher?
<details><summary>Answer</summary>

Nothing happens. Absolutely nothing. Reactive streams in Project Reactor are "cold" by default. The entire pipeline of `.map()`, `.filter()`, and `.flatMap()` is just a blueprint of what *should* happen. The execution is never triggered, no network calls are made, and no data is processed until a terminal `.subscribe()` method is called (which Spring WebFlux automatically does for you when you return the Publisher from a Controller).
</details>


# SECTION 10: QUICK REFERENCE

---

## Key Operators Cheat Sheet

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│              REACTIVE OPERATORS QUICK REFERENCE                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CREATION:                                                                       │
│  Mono.just(T)           | Single value                                           │
│  Mono.empty()           | No value                                               │
│  Mono.error(ex)         | Error signal                                           │
│  Mono.defer(() -> ...)  | Lazy creation                                          │
│  Flux.just(T...)        | From values                                            │
│  Flux.range(start, n)   | Integer range                                          │
│  Flux.interval(dur)     | Periodic emission                                      │
│  Flux.fromIterable()    | From collection                                        │
│                                                                                  │
│  TRANSFORMATION:                                                                 │
│  .map(fn)               | Transform each element                                 │
│  .flatMap(fn)           | Transform to Publisher, flatten (async)                │
│  .concatMap(fn)         | Like flatMap but ordered                               │
│  .filter(pred)          | Keep matching elements                                 │
│  .take(n)               | First n elements                                       │
│  .skip(n)               | Skip first n                                           │
│  .distinct()            | Remove duplicates                                      │
│                                                                                  │
│  COMBINING:                                                                      │
│  Flux.concat(p1, p2)    | Sequential combination                                 │
│  Flux.merge(p1, p2)     | Interleaved combination                                │
│  Flux.zip(p1, p2)       | Pair elements                                          │
│  .zipWith(other)        | Zip with another publisher                             │
│                                                                                  │
│  ERROR HANDLING:                                                                 │
│  .onErrorReturn(v)      | Return default on error                                │
│  .onErrorResume(fn)     | Switch to fallback                                     │
│  .onErrorMap(fn)        | Transform error                                        │
│  .retry(n)              | Retry n times                                          │
│  .retryWhen(spec)       | Advanced retry                                         │
│                                                                                  │
│  TERMINAL:                                                                       │
│  .subscribe()           | Start the stream                                       │
│  .block()               | Block and get (TESTING ONLY!)                          │
│  .collectList()         | Collect to List                                        │
│                                                                                  │
│  SCHEDULING:                                                                     │
│  .subscribeOn(sched)    | Affects upstream                                       │
│  .publishOn(sched)      | Affects downstream                                     │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

# INTERVIEW QUESTIONS

```
Q1: What's the difference between Mono and Flux?
A: Mono emits 0 or 1 element, Flux emits 0 to N elements. Both are lazy -
   nothing happens until subscribed. Mono is like reactive Optional,
   Flux is like reactive Stream.

Q2: What is backpressure?
A: Backpressure is a mechanism where consumers control the rate of data
   production. The subscriber requests elements via subscription.request(n),
   preventing producer from overwhelming consumer.

Q3: When should I use WebFlux over MVC?
A: Use WebFlux for high-concurrency scenarios (10K+ connections),
   streaming applications, microservices with many external calls.
   Stick with MVC for simple CRUD, JPA-heavy apps, or teams unfamiliar
   with reactive programming.

Q4: What's the difference between flatMap and concatMap?
A: flatMap processes elements concurrently (order not guaranteed).
   concatMap processes sequentially (order preserved but slower).
   Use flatMap for independent operations, concatMap when order matters.

Q5: How do you handle blocking calls in WebFlux?
A: Wrap in Mono.fromCallable() and use subscribeOn(Schedulers.boundedElastic())
   to run on a separate thread pool, keeping the event loop non-blocked.

Q6: What happens if you don't subscribe to a Mono/Flux?
A: Nothing! Reactive streams are lazy. The entire pipeline is just a
   description of work. No actual execution happens without subscription.

Q7: Can you mix Spring MVC and WebFlux?
A: Having both dependencies defaults to MVC. For hybrid apps, use
   WebClient (reactive) in MVC controllers. Don't block in WebFlux!

Q8: What is R2DBC?
A: Reactive Relational Database Connectivity - a non-blocking alternative
   to JDBC. It doesn't support JPA features (lazy loading, relationships),
   requiring manual query management.
```

---

**END OF PART 15: SPRING WEBFLUX & REACTIVE PROGRAMMING**

➡️ **Next: Part 16 - SOLID Principles with Spring Examples**


---

> **Navigation**: [< Previous](Ch48_SB_WebFlux_Core.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch38_SB_SOLID_Core.md)