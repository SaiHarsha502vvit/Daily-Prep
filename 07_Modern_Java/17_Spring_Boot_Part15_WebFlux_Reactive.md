# 🌊 SPRING BOOT MASTERY - Part 15: Spring WebFlux & Reactive Programming

> **The Complete Guide to Non-Blocking, Reactive Spring Applications**
> _"Handle millions of connections with minimal resources"_

---

# TABLE OF CONTENTS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WHAT THIS PART COVERS                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. Reactive Programming Fundamentals                                           │
│  2. Project Reactor: Mono & Flux                                               │
│  3. Spring WebFlux Basics                                                       │
│  4. Functional Endpoints (RouterFunction)                                       │
│  5. Reactive Data Access (R2DBC)                                               │
│  6. WebClient (Reactive HTTP Client)                                           │
│  7. Error Handling in Reactive Streams                                         │
│  8. Testing Reactive Code                                                       │
│  9. Backpressure & Performance                                                 │
│  10. When to Use WebFlux vs MVC                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 1: REACTIVE PROGRAMMING FUNDAMENTALS

---

## Chapter 1: Why Reactive?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              TRADITIONAL vs REACTIVE                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TRADITIONAL (Spring MVC) - Thread-per-Request:                                │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │  Request → Thread 1 (BLOCKED waiting for DB) → Response            │       │
│  │  Request → Thread 2 (BLOCKED waiting for API) → Response           │       │
│  │  Request → Thread 3 (BLOCKED waiting for file) → Response          │       │
│  │  ...                                                                │       │
│  │  Request → Thread 200 (Max threads!) → Queue/Reject                │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
│  Problem: Each thread uses ~1MB memory, wastes time waiting                    │
│                                                                                  │
│  REACTIVE (Spring WebFlux) - Event Loop:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │  Event Loop Thread (never blocks!)                                  │       │
│  │    ├── Receives request 1 → Starts async DB call → Moves on       │       │
│  │    ├── Receives request 2 → Starts async API call → Moves on      │       │
│  │    ├── DB callback arrives → Sends response 1                      │       │
│  │    ├── Receives request 3 → Starts async work → Moves on          │       │
│  │    └── API callback arrives → Sends response 2                     │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
│  Benefit: 10-100x more concurrent connections with same resources              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Reactive Manifesto Principles

```java
/**
 * REACTIVE SYSTEMS ARE:
 *
 * 1. RESPONSIVE
 *    - System responds in a timely manner
 *    - Consistent response times under varying load
 *
 * 2. RESILIENT
 *    - System stays responsive in face of failure
 *    - Failures contained and isolated
 *
 * 3. ELASTIC
 *    - System scales up/down based on load
 *    - No bottlenecks, no central contention
 *
 * 4. MESSAGE-DRIVEN
 *    - Asynchronous message passing
 *    - Non-blocking communication
 *    - Backpressure support
 */
```

### The Reactive Streams Specification

```java
/**
 * REACTIVE STREAMS - The Standard API (java.util.concurrent.Flow in Java 9+)
 *
 * Four Core Interfaces:
 */

// 1. Publisher - Data source (produces items)
public interface Publisher<T> {
    void subscribe(Subscriber<? super T> subscriber);
}

// 2. Subscriber - Data consumer (receives items)
public interface Subscriber<T> {
    void onSubscribe(Subscription subscription);  // Called first
    void onNext(T item);                          // For each item
    void onError(Throwable throwable);            // On error
    void onComplete();                            // When done
}

// 3. Subscription - Link between Publisher and Subscriber
public interface Subscription {
    void request(long n);   // Request n items (backpressure!)
    void cancel();          // Cancel subscription
}

// 4. Processor - Both a Publisher and Subscriber
public interface Processor<T, R> extends Subscriber<T>, Publisher<R> {
}

/**
 * KEY CONCEPT: Backpressure
 *
 * The subscriber controls the flow rate!
 *
 * subscription.request(1);   // "I can handle 1 item"
 * subscription.request(10);  // "I can handle 10 items"
 * subscription.request(Long.MAX_VALUE);  // "Send everything!"
 */
```

---

# SECTION 2: PROJECT REACTOR - Mono & Flux

---

## Chapter 2: The Reactor Library

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              MONO vs FLUX                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  MONO<T> - 0 or 1 element                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │  Like Optional<T> but ASYNC                                         │       │
│  │                                                                      │       │
│  │  Mono.just("Hello")           // 1 element                          │       │
│  │  Mono.empty()                 // 0 elements                         │       │
│  │  Mono.error(new Ex())         // Error signal                       │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
│  FLUX<T> - 0 to N elements                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │  Like Stream<T> but ASYNC                                           │       │
│  │                                                                      │       │
│  │  Flux.just("A", "B", "C")     // 3 elements                         │       │
│  │  Flux.range(1, 100)           // 100 elements                       │       │
│  │  Flux.interval(Duration)       // Infinite elements                 │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
│  KEY INSIGHT: Nothing happens until you SUBSCRIBE!                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Maven Dependencies

```xml
<!-- Spring WebFlux (includes Reactor) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>

<!-- Reactor Test -->
<dependency>
    <groupId>io.projectreactor</groupId>
    <artifactId>reactor-test</artifactId>
    <scope>test</scope>
</dependency>
```

### Creating Mono and Flux

```java
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

public class ReactorBasics {

    // ==================== MONO CREATION ====================

    public void monoCreation() {
        // From a value
        Mono<String> mono1 = Mono.just("Hello");

        // Empty Mono (completes without value)
        Mono<String> mono2 = Mono.empty();

        // From nullable (may or may not have value)
        String maybeNull = null;
        Mono<String> mono3 = Mono.justOrEmpty(maybeNull);  // Empty if null

        // Error Mono
        Mono<String> mono4 = Mono.error(new RuntimeException("Oops!"));

        // From Supplier (lazy evaluation)
        Mono<String> mono5 = Mono.fromSupplier(() -> expensiveOperation());

        // From Callable
        Mono<String> mono6 = Mono.fromCallable(() -> blockingCall());

        // From CompletableFuture
        Mono<String> mono7 = Mono.fromFuture(CompletableFuture.supplyAsync(() -> "async"));

        // Deferred - creates new Mono per subscriber
        Mono<Long> mono8 = Mono.defer(() -> Mono.just(System.currentTimeMillis()));

        // With delay
        Mono<String> mono9 = Mono.just("delayed").delayElement(Duration.ofSeconds(2));
    }

    // ==================== FLUX CREATION ====================

    public void fluxCreation() {
        // From values
        Flux<String> flux1 = Flux.just("A", "B", "C");

        // From array
        Flux<String> flux2 = Flux.fromArray(new String[]{"A", "B", "C"});

        // From iterable (List, Set, etc.)
        List<String> list = Arrays.asList("A", "B", "C");
        Flux<String> flux3 = Flux.fromIterable(list);

        // From Stream (careful: streams are single-use!)
        Flux<String> flux4 = Flux.fromStream(list.stream());

        // Range of integers
        Flux<Integer> flux5 = Flux.range(1, 10);  // 1, 2, 3, ..., 10

        // Empty Flux
        Flux<String> flux6 = Flux.empty();

        // Error Flux
        Flux<String> flux7 = Flux.error(new RuntimeException("Error!"));

        // Interval (infinite, emits every duration)
        Flux<Long> flux8 = Flux.interval(Duration.ofSeconds(1));

        // Generate (programmatic sequence)
        Flux<Integer> flux9 = Flux.generate(
            () -> 0,  // Initial state
            (state, sink) -> {
                sink.next(state);
                if (state == 10) sink.complete();
                return state + 1;
            }
        );

        // Create (for bridging async APIs)
        Flux<String> flux10 = Flux.create(sink -> {
            // Called when someone subscribes
            sink.next("First");
            sink.next("Second");
            sink.complete();
        });

        // Concat multiple publishers
        Flux<String> flux11 = Flux.concat(
            Mono.just("First"),
            Flux.just("Second", "Third")
        );

        // Merge multiple publishers (interleaved)
        Flux<String> flux12 = Flux.merge(flux1, flux2);
    }

    private String expensiveOperation() {
        return "result";
    }

    private String blockingCall() throws Exception {
        return "result";
    }
}
```

### Subscribing - Making It Execute

```java
public class SubscribingExamples {

    /**
     * CRITICAL: Nothing happens until you subscribe!
     *
     * Think of Mono/Flux as a recipe - it describes what to do
     * but doesn't cook until someone subscribes.
     */

    public void subscribingBasics() {
        Flux<Integer> flux = Flux.range(1, 5)
            .map(i -> i * 2)
            .filter(i -> i > 5);

        // At this point, NOTHING has executed yet!

        // Basic subscribe
        flux.subscribe();  // Executes but ignores items

        // Subscribe with consumer
        flux.subscribe(
            item -> System.out.println("Received: " + item)  // onNext
        );

        // Subscribe with error handler
        flux.subscribe(
            item -> System.out.println("Item: " + item),     // onNext
            error -> System.err.println("Error: " + error)   // onError
        );

        // Subscribe with completion handler
        flux.subscribe(
            item -> System.out.println("Item: " + item),     // onNext
            error -> System.err.println("Error: " + error),  // onError
            () -> System.out.println("Completed!")           // onComplete
        );

        // Subscribe with subscription handler (for backpressure)
        flux.subscribe(
            item -> System.out.println("Item: " + item),
            error -> System.err.println("Error: " + error),
            () -> System.out.println("Completed!"),
            subscription -> subscription.request(3)  // Request only 3 items
        );
    }

    // Block (ONLY FOR TESTS OR NON-REACTIVE CODE!)
    public void blockingOperations() {
        Mono<String> mono = Mono.just("Hello");

        // Block and get value
        String value = mono.block();  // BLOCKING!

        // Block with timeout
        String value2 = mono.block(Duration.ofSeconds(5));

        Flux<Integer> flux = Flux.range(1, 10);

        // Block and get first
        Integer first = flux.blockFirst();

        // Block and get last
        Integer last = flux.blockLast();

        // Collect all to list (blocking)
        List<Integer> list = flux.collectList().block();
    }
}
```

---

## Chapter 3: Operators - Transforming Reactive Streams

```java
public class ReactorOperators {

    // ==================== TRANSFORMING ====================

    public void transformingOperators() {
        // map - Transform each element
        Flux<Integer> mapped = Flux.just(1, 2, 3)
            .map(i -> i * 10);  // 10, 20, 30

        // flatMap - Transform to Publisher and flatten (async)
        Flux<String> flatMapped = Flux.just(1, 2, 3)
            .flatMap(i -> callAsyncService(i));  // Order NOT guaranteed

        // concatMap - Like flatMap but preserves order
        Flux<String> concatMapped = Flux.just(1, 2, 3)
            .concatMap(i -> callAsyncService(i));  // Order guaranteed

        // flatMapSequential - Parallel execution, ordered results
        Flux<String> seqMapped = Flux.just(1, 2, 3)
            .flatMapSequential(i -> callAsyncService(i));

        // cast - Type cast
        Flux<Number> casted = Flux.just(1, 2, 3)
            .cast(Number.class);

        // index - Add index to each element
        Flux<Tuple2<Long, String>> indexed = Flux.just("A", "B", "C")
            .index();  // (0, A), (1, B), (2, C)
    }

    // ==================== FILTERING ====================

    public void filteringOperators() {
        Flux<Integer> numbers = Flux.range(1, 10);

        // filter - Keep matching elements
        Flux<Integer> evens = numbers.filter(i -> i % 2 == 0);

        // filterWhen - Async filter
        Flux<Integer> asyncFiltered = numbers
            .filterWhen(i -> isValid(i));  // Returns Mono<Boolean>

        // distinct - Remove duplicates
        Flux<Integer> distinct = Flux.just(1, 1, 2, 2, 3).distinct();

        // distinctUntilChanged - Remove consecutive duplicates
        Flux<Integer> distinctConsec = Flux.just(1, 1, 2, 1, 1)
            .distinctUntilChanged();  // 1, 2, 1

        // take - First n elements
        Flux<Integer> firstThree = numbers.take(3);

        // takeLast - Last n elements
        Flux<Integer> lastThree = numbers.takeLast(3);

        // takeUntil - Until condition
        Flux<Integer> untilFive = numbers.takeUntil(i -> i == 5);

        // takeWhile - While condition
        Flux<Integer> whileLessFive = numbers.takeWhile(i -> i < 5);

        // skip - Skip first n
        Flux<Integer> skipThree = numbers.skip(3);

        // skipLast - Skip last n
        Flux<Integer> skipLastThree = numbers.skipLast(3);

        // elementAt - Get specific index
        Mono<Integer> third = numbers.elementAt(2);

        // next - Get first element as Mono
        Mono<Integer> first = numbers.next();

        // last - Get last element as Mono
        Mono<Integer> last = numbers.last();

        // single - Expect exactly one element
        Mono<Integer> single = Flux.just(1).single();  // Error if 0 or >1
    }

    // ==================== COMBINING ====================

    public void combiningOperators() {
        Flux<String> flux1 = Flux.just("A", "B");
        Flux<String> flux2 = Flux.just("C", "D");

        // concat - Sequential concatenation
        Flux<String> concatted = Flux.concat(flux1, flux2);  // A, B, C, D

        // merge - Interleaved merge
        Flux<String> merged = Flux.merge(flux1, flux2);  // Order varies

        // zip - Combine corresponding elements
        Flux<Tuple2<String, String>> zipped = Flux.zip(flux1, flux2);

        // zipWith - Combine with another flux
        Flux<String> zippedWith = flux1.zipWith(flux2, (a, b) -> a + b);

        // combineLatest - Combine latest from each
        Flux<String> combined = Flux.combineLatest(
            flux1, flux2, (a, b) -> a + b
        );

        // startWith - Prepend elements
        Flux<String> withStart = flux1.startWith("START");

        // concatWith - Append another flux
        Flux<String> withEnd = flux1.concatWith(flux2);

        // mergeWith - Merge with another flux
        Flux<String> mergedWith = flux1.mergeWith(flux2);
    }

    // ==================== AGGREGATING ====================

    public void aggregatingOperators() {
        Flux<Integer> numbers = Flux.range(1, 10);

        // count - Number of elements
        Mono<Long> count = numbers.count();

        // reduce - Reduce to single value
        Mono<Integer> sum = numbers.reduce(0, (a, b) -> a + b);

        // reduceWith - Reduce with initial supplier
        Mono<Integer> sumWith = numbers.reduceWith(() -> 0, Integer::sum);

        // scan - Like reduce but emits intermediate results
        Flux<Integer> runningSum = numbers.scan(0, Integer::sum);
        // 0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55

        // collectList - Collect all to List
        Mono<List<Integer>> list = numbers.collectList();

        // collectMap - Collect to Map
        Mono<Map<Integer, String>> map = numbers
            .collectMap(i -> i, i -> "Value" + i);

        // collectMultimap - Collect to Multimap (List values)
        Mono<Map<String, Collection<Integer>>> multimap = numbers
            .collectMultimap(i -> i % 2 == 0 ? "even" : "odd");

        // all - All match predicate?
        Mono<Boolean> allPositive = numbers.all(i -> i > 0);

        // any - Any match predicate?
        Mono<Boolean> anyTen = numbers.any(i -> i == 10);

        // hasElement - Contains element?
        Mono<Boolean> hasFive = numbers.hasElement(5);

        // hasElements - Has any elements?
        Mono<Boolean> notEmpty = numbers.hasElements();
    }

    // ==================== TIMING ====================

    public void timingOperators() {
        Flux<Integer> numbers = Flux.range(1, 5);

        // delayElements - Delay each element
        Flux<Integer> delayed = numbers
            .delayElements(Duration.ofMillis(100));

        // delaySubscription - Delay subscription
        Flux<Integer> delayedSub = numbers
            .delaySubscription(Duration.ofSeconds(1));

        // timeout - Error if no element within duration
        Mono<String> withTimeout = Mono.delay(Duration.ofSeconds(5))
            .map(l -> "result")
            .timeout(Duration.ofSeconds(2));  // TimeoutException!

        // timeout with fallback
        Mono<String> withFallback = Mono.delay(Duration.ofSeconds(5))
            .map(l -> "result")
            .timeout(Duration.ofSeconds(2), Mono.just("fallback"));

        // elapsed - Include elapsed time
        Flux<Tuple2<Long, Integer>> withElapsed = numbers
            .delayElements(Duration.ofMillis(100))
            .elapsed();

        // timestamp - Include timestamp
        Flux<Tuple2<Long, Integer>> withTimestamp = numbers.timestamp();

        // sample - Emit latest at intervals
        Flux<Long> sampled = Flux.interval(Duration.ofMillis(100))
            .sample(Duration.ofMillis(500));
    }

    // Helper methods
    private Mono<String> callAsyncService(Integer id) {
        return Mono.just("Result-" + id)
            .delayElement(Duration.ofMillis(100));
    }

    private Mono<Boolean> isValid(Integer i) {
        return Mono.just(i > 5);
    }
}
```

---

# SECTION 3: SPRING WEBFLUX

---

## Chapter 4: WebFlux Controllers

```java
/**
 * Spring WebFlux provides TWO programming models:
 *
 * 1. Annotated Controllers (@RestController) - Same as MVC but return Mono/Flux
 * 2. Functional Endpoints (RouterFunction) - Functional style routing
 */

// ==================== ANNOTATED CONTROLLERS ====================

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    /**
     * Return Mono for single result
     */
    @GetMapping("/{id}")
    public Mono<ResponseEntity<UserDto>> getUser(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Return Flux for multiple results
     */
    @GetMapping
    public Flux<UserDto> getAllUsers() {
        return userService.findAll();
    }

    /**
     * Flux with Server-Sent Events (SSE) - Real-time streaming!
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<UserDto> streamUsers() {
        return userService.findAll()
            .delayElements(Duration.ofSeconds(1));  // Emit one per second
    }

    /**
     * Accept Mono in request body
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<UserDto> createUser(@RequestBody Mono<CreateUserRequest> request) {
        return request.flatMap(userService::create);
    }

    /**
     * Accept Flux for batch operations
     */
    @PostMapping("/batch")
    public Flux<UserDto> createUsers(@RequestBody Flux<CreateUserRequest> requests) {
        return requests.flatMap(userService::create);
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<UserDto>> updateUser(
            @PathVariable Long id,
            @RequestBody Mono<UpdateUserRequest> request) {
        return request
            .flatMap(req -> userService.update(id, req))
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteUser(@PathVariable Long id) {
        return userService.deleteById(id)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}

// ==================== SERVICE LAYER ====================

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public Mono<UserDto> findById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toDto);
    }

    public Flux<UserDto> findAll() {
        return userRepository.findAll()
            .map(userMapper::toDto);
    }

    public Mono<UserDto> create(CreateUserRequest request) {
        return Mono.just(request)
            .map(userMapper::toEntity)
            .flatMap(userRepository::save)
            .map(userMapper::toDto);
    }

    public Mono<UserDto> update(Long id, UpdateUserRequest request) {
        return userRepository.findById(id)
            .map(user -> {
                userMapper.updateEntity(user, request);
                return user;
            })
            .flatMap(userRepository::save)
            .map(userMapper::toDto);
    }

    public Mono<Void> deleteById(Long id) {
        return userRepository.deleteById(id);
    }
}
```

---

## Chapter 5: Functional Endpoints (RouterFunction)

```java
/**
 * FUNCTIONAL ENDPOINTS
 *
 * Alternative to Controller annotations
 * More flexible and functional style
 *
 * Components:
 * - RouterFunction<ServerResponse> - Defines routes
 * - HandlerFunction<ServerResponse> - Handles requests
 * - ServerRequest - Reactive request
 * - ServerResponse - Reactive response
 */

// ==================== ROUTE CONFIGURATION ====================

@Configuration
public class UserRouterConfig {

    @Bean
    public RouterFunction<ServerResponse> userRoutes(UserHandler handler) {
        return RouterFunctions.route()
            // GET /api/users
            .GET("/api/users", handler::getAllUsers)

            // GET /api/users/{id}
            .GET("/api/users/{id}", handler::getUserById)

            // POST /api/users
            .POST("/api/users", handler::createUser)

            // PUT /api/users/{id}
            .PUT("/api/users/{id}", handler::updateUser)

            // DELETE /api/users/{id}
            .DELETE("/api/users/{id}", handler::deleteUser)

            // Nested routes
            .path("/api/admin", builder -> builder
                .GET("/users", handler::getAllUsersAdmin)
                .POST("/users/bulk", handler::bulkCreateUsers)
            )

            // With filters
            .filter(this::loggingFilter)

            .build();
    }

    // Alternative using nest()
    @Bean
    public RouterFunction<ServerResponse> nestedRoutes(UserHandler handler) {
        return RouterFunctions
            .nest(RequestPredicates.path("/api"),
                RouterFunctions.route()
                    .nest(RequestPredicates.path("/users"),
                        RouterFunctions.route()
                            .GET("", handler::getAllUsers)
                            .GET("/{id}", handler::getUserById)
                            .POST("", handler::createUser)
                            .build()
                    )
                    .build()
            );
    }

    // Logging filter
    private Mono<ServerResponse> loggingFilter(
            ServerRequest request,
            HandlerFunction<ServerResponse> next) {
        log.info("Request: {} {}", request.method(), request.path());
        return next.handle(request)
            .doOnSuccess(response ->
                log.info("Response status: {}", response.statusCode())
            );
    }
}

// ==================== HANDLER CLASS ====================

@Component
@RequiredArgsConstructor
@Slf4j
public class UserHandler {

    private final UserService userService;
    private final Validator validator;

    public Mono<ServerResponse> getAllUsers(ServerRequest request) {
        // Query parameters
        Integer page = request.queryParam("page")
            .map(Integer::parseInt)
            .orElse(0);
        Integer size = request.queryParam("size")
            .map(Integer::parseInt)
            .orElse(20);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(userService.findAll(page, size), UserDto.class);
    }

    public Mono<ServerResponse> getUserById(ServerRequest request) {
        Long id = Long.parseLong(request.pathVariable("id"));

        return userService.findById(id)
            .flatMap(user -> ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(user))
            .switchIfEmpty(ServerResponse.notFound().build());
    }

    public Mono<ServerResponse> createUser(ServerRequest request) {
        return request.bodyToMono(CreateUserRequest.class)
            .doOnNext(this::validate)
            .flatMap(userService::create)
            .flatMap(user -> ServerResponse
                .created(URI.create("/api/users/" + user.getId()))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(user))
            .onErrorResume(ValidationException.class, e ->
                ServerResponse.badRequest()
                    .bodyValue(new ErrorResponse(e.getMessage())));
    }

    public Mono<ServerResponse> updateUser(ServerRequest request) {
        Long id = Long.parseLong(request.pathVariable("id"));

        return request.bodyToMono(UpdateUserRequest.class)
            .doOnNext(this::validate)
            .flatMap(req -> userService.update(id, req))
            .flatMap(user -> ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(user))
            .switchIfEmpty(ServerResponse.notFound().build());
    }

    public Mono<ServerResponse> deleteUser(ServerRequest request) {
        Long id = Long.parseLong(request.pathVariable("id"));

        return userService.findById(id)
            .flatMap(user -> userService.deleteById(id)
                .then(ServerResponse.noContent().build()))
            .switchIfEmpty(ServerResponse.notFound().build());
    }

    // Bulk create (accepts Flux)
    public Mono<ServerResponse> bulkCreateUsers(ServerRequest request) {
        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(
                request.bodyToFlux(CreateUserRequest.class)
                    .flatMap(userService::create),
                UserDto.class
            );
    }

    // Admin endpoint
    public Mono<ServerResponse> getAllUsersAdmin(ServerRequest request) {
        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(userService.findAllWithDetails(), UserDto.class);
    }

    private void validate(Object request) {
        Set<ConstraintViolation<Object>> violations =
            validator.validate(request);
        if (!violations.isEmpty()) {
            String message = violations.stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));
            throw new ValidationException(message);
        }
    }
}
```

---

# SECTION 4: REACTIVE DATA ACCESS (R2DBC)

---

## Chapter 6: R2DBC - Reactive Relational Database Connectivity

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              R2DBC vs JDBC                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  JDBC (Traditional):                                                            │
│  • Blocking - Thread waits for database response                               │
│  • Uses thread pool (HikariCP)                                                 │
│  • Works with JPA/Hibernate                                                    │
│                                                                                  │
│  R2DBC (Reactive):                                                              │
│  • Non-blocking - Event loop handles responses                                 │
│  • Uses connection pool (r2dbc-pool)                                           │
│  • Works with Spring Data R2DBC (no JPA!)                                      │
│                                                                                  │
│  ⚠️ IMPORTANT: R2DBC does NOT support JPA features:                            │
│  • No lazy loading                                                              │
│  • No @OneToMany, @ManyToOne                                                   │
│  • No JPQL (uses simple queries or @Query)                                     │
│  • Manual joins required                                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Dependencies and Configuration

```xml
<!-- R2DBC for PostgreSQL -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-r2dbc</artifactId>
</dependency>
<dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Or for H2 (testing) -->
<dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-h2</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Connection pooling -->
<dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-pool</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
    r2dbc:
        url: r2dbc:postgresql://localhost:5432/mydb
        username: user
        password: password
        pool:
            initial-size: 5
            max-size: 20
            max-idle-time: 30m
```

### Entity and Repository

```java
// ==================== ENTITY ====================

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

@Table("users")  // Note: Not @Entity! This is Spring Data R2DBC
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private Long id;

    @Column("username")
    private String username;

    private String email;

    private String password;

    @Column("created_at")
    @CreatedDate
    private LocalDateTime createdAt;

    @Column("updated_at")
    @LastModifiedDate
    private LocalDateTime updatedAt;

    private boolean active;
}

// ==================== REPOSITORY ====================

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.r2dbc.repository.Query;

public interface UserRepository extends ReactiveCrudRepository<User, Long> {

    // Derived query methods - return Mono/Flux
    Mono<User> findByUsername(String username);

    Mono<User> findByEmail(String email);

    Flux<User> findByActiveTrue();

    Flux<User> findByUsernameContainingIgnoreCase(String username);

    // Custom queries
    @Query("SELECT * FROM users WHERE email = :email AND active = true")
    Mono<User> findActiveByEmail(String email);

    @Query("SELECT * FROM users WHERE created_at > :since ORDER BY created_at DESC")
    Flux<User> findRecentUsers(LocalDateTime since);

    // Update query
    @Modifying
    @Query("UPDATE users SET active = false WHERE id = :id")
    Mono<Integer> deactivateUser(Long id);

    // Exists check
    Mono<Boolean> existsByUsername(String username);

    // Count
    Mono<Long> countByActiveTrue();

    // Delete
    Mono<Void> deleteByUsername(String username);
}

// ==================== REACTIVE CRUD REPOSITORY METHODS ====================

/**
 * ReactiveCrudRepository provides:
 *
 * Mono<S> save(S entity)
 * Mono<T> findById(ID id)
 * Mono<Boolean> existsById(ID id)
 * Flux<T> findAll()
 * Flux<T> findAllById(Iterable<ID> ids)
 * Mono<Long> count()
 * Mono<Void> deleteById(ID id)
 * Mono<Void> delete(T entity)
 * Mono<Void> deleteAll()
 * Mono<Void> deleteAllById(Iterable<ID> ids)
 */
```

### Database Client (Low-Level Access)

```java
@Service
@RequiredArgsConstructor
public class UserDatabaseService {

    private final DatabaseClient databaseClient;

    // Complex queries
    public Flux<User> searchUsers(String search, int limit, int offset) {
        return databaseClient.sql("""
                SELECT * FROM users
                WHERE username ILIKE :search
                   OR email ILIKE :search
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """)
            .bind("search", "%" + search + "%")
            .bind("limit", limit)
            .bind("offset", offset)
            .map((row, metadata) -> User.builder()
                .id(row.get("id", Long.class))
                .username(row.get("username", String.class))
                .email(row.get("email", String.class))
                .active(row.get("active", Boolean.class))
                .createdAt(row.get("created_at", LocalDateTime.class))
                .build())
            .all();
    }

    // Insert with returning
    public Mono<User> insertUser(User user) {
        return databaseClient.sql("""
                INSERT INTO users (username, email, password, active, created_at)
                VALUES (:username, :email, :password, :active, :createdAt)
                RETURNING *
                """)
            .bind("username", user.getUsername())
            .bind("email", user.getEmail())
            .bind("password", user.getPassword())
            .bind("active", user.isActive())
            .bind("createdAt", LocalDateTime.now())
            .map((row, metadata) -> User.builder()
                .id(row.get("id", Long.class))
                .username(row.get("username", String.class))
                .email(row.get("email", String.class))
                .active(row.get("active", Boolean.class))
                .createdAt(row.get("created_at", LocalDateTime.class))
                .build())
            .one();
    }

    // Batch insert
    public Mono<Long> batchInsert(List<User> users) {
        return Flux.fromIterable(users)
            .flatMap(this::insertUser)
            .count();
    }

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

# SECTION 9: WHEN TO USE WEBFLUX vs MVC

---

## Chapter 11: Making the Right Choice

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WEBFLUX vs MVC DECISION MATRIX                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CHOOSE SPRING MVC WHEN:                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ ✓ Traditional CRUD application                                         │    │
│  │ ✓ Team is familiar with blocking paradigm                             │    │
│  │ ✓ Using JPA/Hibernate (blocking by design)                           │    │
│  │ ✓ Moderate traffic (hundreds/thousands RPS)                          │    │
│  │ ✓ Complex business logic with many interconnected calls              │    │
│  │ ✓ Need mature ecosystem (more libraries, tools)                      │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  CHOOSE SPRING WEBFLUX WHEN:                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ ✓ High concurrency (10K+ simultaneous connections)                    │    │
│  │ ✓ Streaming data (real-time feeds, SSE, WebSocket)                   │    │
│  │ ✓ Microservices with many external calls (API Gateway)               │    │
│  │ ✓ Event-driven architecture                                           │    │
│  │ ✓ Limited resources (need efficiency)                                 │    │
│  │ ✓ Team comfortable with reactive programming                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ⚠️ DON'T USE WEBFLUX IF:                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ ✗ Need JPA relationships (@OneToMany, @ManyToOne)                    │    │
│  │ ✗ Team unfamiliar with reactive concepts                             │    │
│  │ ✗ Need blocking libraries without reactive alternatives              │    │
│  │ ✗ Simple CRUD without high concurrency needs                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│              COMMON MISTAKES TO AVOID                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. BLOCKING IN REACTIVE CODE                                                   │
│     ❌ BAD:                                                                     │
│     Mono.just(repository.findById(id))  // Blocking call!                      │
│                                                                                  │
│     ✅ GOOD:                                                                    │
│     Mono.fromCallable(() -> repository.findById(id))                           │
│         .subscribeOn(Schedulers.boundedElastic())                              │
│                                                                                  │
│  2. NOT SUBSCRIBING                                                             │
│     ❌ BAD:                                                                     │
│     userService.createUser(request);  // Nothing happens!                      │
│                                                                                  │
│     ✅ GOOD:                                                                    │
│     return userService.createUser(request);  // Let Spring subscribe          │
│                                                                                  │
│  3. USING .block() IN REACTIVE CODE                                            │
│     ❌ BAD:                                                                     │
│     User user = userService.findById(id).block();  // Defeats purpose!        │
│                                                                                  │
│     ✅ GOOD:                                                                    │
│     return userService.findById(id).map(this::process);                        │
│                                                                                  │
│  4. MIXING MVC AND WEBFLUX DEPENDENCIES                                        │
│     ❌ BAD:                                                                     │
│     Including both spring-boot-starter-web AND spring-boot-starter-webflux    │
│                                                                                  │
│     ✅ GOOD:                                                                    │
│     Use only one (Spring Boot uses MVC if both present)                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
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

# SECTION 10: QUICK REFERENCE

---

## Key Operators Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              REACTIVE OPERATORS QUICK REFERENCE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CREATION:                                                                       │
│  Mono.just(T)           | Single value                                          │
│  Mono.empty()           | No value                                              │
│  Mono.error(ex)         | Error signal                                          │
│  Mono.defer(() -> ...)  | Lazy creation                                         │
│  Flux.just(T...)        | From values                                           │
│  Flux.range(start, n)   | Integer range                                         │
│  Flux.interval(dur)     | Periodic emission                                     │
│  Flux.fromIterable()    | From collection                                       │
│                                                                                  │
│  TRANSFORMATION:                                                                 │
│  .map(fn)               | Transform each element                                │
│  .flatMap(fn)           | Transform to Publisher, flatten (async)              │
│  .concatMap(fn)         | Like flatMap but ordered                              │
│  .filter(pred)          | Keep matching elements                                │
│  .take(n)               | First n elements                                      │
│  .skip(n)               | Skip first n                                          │
│  .distinct()            | Remove duplicates                                     │
│                                                                                  │
│  COMBINING:                                                                      │
│  Flux.concat(p1, p2)    | Sequential combination                                │
│  Flux.merge(p1, p2)     | Interleaved combination                               │
│  Flux.zip(p1, p2)       | Pair elements                                         │
│  .zipWith(other)        | Zip with another publisher                            │
│                                                                                  │
│  ERROR HANDLING:                                                                 │
│  .onErrorReturn(v)      | Return default on error                               │
│  .onErrorResume(fn)     | Switch to fallback                                    │
│  .onErrorMap(fn)        | Transform error                                       │
│  .retry(n)              | Retry n times                                         │
│  .retryWhen(spec)       | Advanced retry                                        │
│                                                                                  │
│  TERMINAL:                                                                       │
│  .subscribe()           | Start the stream                                      │
│  .block()               | Block and get (TESTING ONLY!)                        │
│  .collectList()         | Collect to List                                       │
│                                                                                  │
│  SCHEDULING:                                                                     │
│  .subscribeOn(sched)    | Affects upstream                                      │
│  .publishOn(sched)      | Affects downstream                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
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
