**Navigation**: [< Previous](Ch36_SB_Service_Repository.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch40_SB_JPA_Deep_Dive.md)

# 🌱 SPRING BOOT MASTERY - Part 7: Controllers & REST API Architecture

**The Gateway to Your Application**
_"Controllers are thin - they delegate, not implement"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why REST Controllers?                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • REST is the standard: Web APIs, mobile apps, microservices                   │
│  • HTTP verbs: GET, POST, PUT, DELETE map to CRUD operations                    │
│  • Status codes: 200, 201, 400, 404, 500 communicate results                    │
│  • JSON by default: @RestController auto-serializes to JSON                     │
│  • Interview must-know: API design is tested in every backend interview         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How Controllers Handle Requests?                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • @GetMapping: Retrieve resource - GET /api/users/{id}                         │
│  • @PostMapping: Create resource - POST /api/users                              │
│  • @PutMapping: Update entire resource - PUT /api/users/{id}                    │
│  • @DeleteMapping: Remove resource - DELETE /api/users/{id}                     │
│  • @Valid: Trigger bean validation on request body                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Which Parameter Type?                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • @PathVariable: Resource identifier - /users/{id}                             │
│  • @RequestParam: Filters, pagination - /users?status=active&page=1             │
│  • @RequestBody: Create/Update data - JSON payload                              │
│  • @RequestHeader: Auth tokens, API keys, custom headers                        │
│  • ResponseEntity: Full control over status, headers, body                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Controller Patterns to Use?                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     @RestController, @RequestMapping, @Valid, ResponseEntity        │
│  IMPORTANT:     @ControllerAdvice for global exceptions, API versioning         │
│  ADVANCED:      HATEOAS, content negotiation, file uploads                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---

# 📖 REST Controller Fundamentals

---

## Chapter 1: Controller Anatomy

```java
@RestController  // = @Controller + @ResponseBody
@RequestMapping("/api/v1/users")  // Base path for all endpoints
@RequiredArgsConstructor  // Constructor DI
@Validated  // Enable method-level validation
@Slf4j  // Logger
public class UserController {

    private final UserService userService;

    // GET /api/v1/users
    @GetMapping
    public ResponseEntity<PageResponse<UserSummary>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        Pageable pageable = PageableUtils.create(page, size, sort);
        return ResponseEntity.ok(userService.findAll(pageable));
    }

    // GET /api/v1/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    // POST /api/v1/users
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        UserResponse created = userService.create(request);
        URI location = URI.create("/api/v1/users/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    // PUT /api/v1/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        return ResponseEntity.ok(userService.update(id, request));
    }

    // DELETE /api/v1/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Chapter 2: HTTP Method Mappings

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP METHODS & SPRING MAPPINGS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  HTTP Method    Annotation        Purpose              Idempotent   Safe        │
│  ──────────────────────────────────────────────────────────────────────────     │
│  GET            @GetMapping       Read resource           ✅         ✅           │
│  POST           @PostMapping      Create resource         ❌         ❌           │
│  PUT            @PutMapping       Replace resource        ✅         ❌           │
│  PATCH          @PatchMapping     Partial update          ❌*        ❌           │
│  DELETE         @DeleteMapping    Delete resource         ✅         ❌           │
│  HEAD           @RequestMapping   Get headers only        ✅         ✅           │
│  OPTIONS        @RequestMapping   Get allowed methods     ✅         ✅           │
│                                                                                 │
│  *PATCH can be idempotent depending on implementation                           │
│                                                                                 │
│  Idempotent = Same request N times = Same result                                │
│  Safe = Doesn't modify server state                                             │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RESTful URL Design:                                                            │
│                                                                                 │
│  ✅ GOOD (Noun-based, resource-oriented):                                        │
│  GET    /api/v1/users                    → Get all users                        │
│  GET    /api/v1/users/123                → Get user 123                         │
│  POST   /api/v1/users                    → Create user                          │
│  PUT    /api/v1/users/123                → Replace user 123                     │
│  PATCH  /api/v1/users/123                → Update user 123                      │
│  DELETE /api/v1/users/123                → Delete user 123                      │
│  GET    /api/v1/users/123/orders         → Get orders of user 123               │
│  POST   /api/v1/users/123/orders         → Create order for user 123            │
│                                                                                 │
│  ❌ BAD (Verb-based, RPC style):                                                 │
│  GET    /api/v1/getUser?id=123           → Don't use verbs in URL               │
│  POST   /api/v1/createUser               → POST already means create            │
│  GET    /api/v1/deleteUser?id=123        → Don't use GET for deletion           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---



🔬 **Section Challenge — Chapter 2: HTTP Method Mappings**

**Challenge 1 (Reasoning):** `Connection: keep-alive` vs HTTP/2 — what does each one do differently for multiplexing?
<details><summary>Answer</summary>

HTTP/1.1 keep-alive: reuse ONE TCP connection for sequential requests. Still head-of-line blocking — request 2 waits for response 1. HTTP/2: one TCP connection, but requests are multiplexed as frames with stream IDs. Multiple requests in-flight simultaneously. Response frames for different streams are interleaved. HTTP/2 also has header compression (HPACK) and server push. Still has TCP HOL blocking (one lost packet blocks all streams). HTTP/3 (QUIC): uses UDP, per-stream reliability, eliminates TCP HOL blocking entirely.
</details>


## Chapter 3: Request Parameters

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    // ═══════════════════════════════════════════════════════════════════════════
    // @PathVariable - URL path segment
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/v1/users/123
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) { }

    // Custom name
    @GetMapping("/{userId}/orders/{orderId}")
    public OrderResponse getOrder(
            @PathVariable("userId") Long uid,
            @PathVariable("orderId") Long oid) { }

    // Optional path variable
    @GetMapping({"/", "/{id}"})
    public ResponseEntity<?> getUsers(
            @PathVariable(required = false) Long id) {
        if (id == null) {
            return ResponseEntity.ok(userService.findAll());
        }
        return ResponseEntity.ok(userService.findById(id));
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // @RequestParam - Query string parameter
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/v1/users?page=0&size=10
    @GetMapping
    public Page<UserResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) { }

    // Required parameter
    // GET /api/v1/users/search?email=john@test.com
    @GetMapping("/search")
    public UserResponse searchByEmail(
            @RequestParam String email) { }  // Required by default

    // Optional parameter
    // GET /api/v1/users?status=active
    @GetMapping
    public List<UserResponse> getUsers(
            @RequestParam(required = false) String status) { }

    // List parameter
    // GET /api/v1/users?roles=ADMIN&roles=USER
    @GetMapping
    public List<UserResponse> getByRoles(
            @RequestParam List<Role> roles) { }

    // Map for dynamic parameters
    // GET /api/v1/users?name=John&email=john@test.com&...
    @GetMapping
    public List<UserResponse> search(
            @RequestParam Map<String, String> params) { }


    // ═══════════════════════════════════════════════════════════════════════════
    // @RequestBody - JSON body
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/v1/users (with JSON body)
    @PostMapping
    public UserResponse createUser(
            @Valid @RequestBody CreateUserRequest request) { }


    // ═══════════════════════════════════════════════════════════════════════════
    // @RequestHeader - HTTP headers
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/profile")
    public UserResponse getProfile(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId) { }

    // All headers
    @GetMapping
    public void debug(@RequestHeader HttpHeaders headers) {
        headers.forEach((key, value) -> log.debug("{}: {}", key, value));
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // @CookieValue - Cookies
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping
    public void withCookie(
            @CookieValue("JSESSIONID") String sessionId,
            @CookieValue(value = "preferences", defaultValue = "{}") String prefs) { }


    // ═══════════════════════════════════════════════════════════════════════════
    // @ModelAttribute - Form data / Query params to object
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/v1/users?name=John&email=john@test.com&role=ADMIN
    @GetMapping
    public List<UserResponse> search(@ModelAttribute UserSearchCriteria criteria) { }

    // UserSearchCriteria has fields: name, email, role
    // Spring binds query params to object automatically
}
```

---

## Chapter 4: Response Handling

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    // ═══════════════════════════════════════════════════════════════════════════
    // BASIC RESPONSES
    // ═══════════════════════════════════════════════════════════════════════════

    // Direct return (200 OK implicit)
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.findById(id);  // → 200 OK + JSON body
    }

    // ResponseEntity for control
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse user = userService.findById(id);
        return ResponseEntity.ok(user);  // Explicit 200 OK
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // HTTP STATUS CODES
    // ═══════════════════════════════════════════════════════════════════════════

    // 201 Created (with Location header)
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest req) {
        UserResponse created = userService.create(req);
        URI location = URI.create("/api/v1/users/" + created.id());
        return ResponseEntity
            .created(location)
            .body(created);
    }

    // 204 No Content
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // 202 Accepted (async processing)
    @PostMapping("/bulk-import")
    public ResponseEntity<ImportJobResponse> bulkImport(@RequestBody List<UserRequest> users) {
        ImportJobResponse job = userService.startBulkImport(users);
        return ResponseEntity
            .accepted()
            .body(job);
    }

    // 404 Not Found
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Custom status
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest req) {
        UserResponse created = userService.create(req);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .header("X-Custom-Header", "value")
            .body(created);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // RESPONSE HEADERS
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse user = userService.findById(id);
        return ResponseEntity.ok()
            .header("X-Request-ID", UUID.randomUUID().toString())
            .header("Cache-Control", "max-age=3600")
            .header("ETag", "\"" + user.hashCode() + "\"")
            .body(user);
    }

    // Using HttpServletResponse
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id, HttpServletResponse response) {
        response.setHeader("X-Custom", "value");
        return userService.findById(id);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // STREAMING RESPONSE
    // ═══════════════════════════════════════════════════════════════════════════

    // Large data - stream instead of loading all into memory
    @GetMapping("/export")
    public ResponseEntity<StreamingResponseBody> exportUsers() {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header("Content-Disposition", "attachment; filename=users.csv")
            .body(outputStream -> {
                userService.streamAllUsers(user -> {
                    try {
                        outputStream.write(formatCsvRow(user).getBytes());
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                });
            });
    }

    // Server-Sent Events (SSE)
    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<UserEvent>> streamEvents() {
        return userEventPublisher.getEventStream()
            .map(event -> ServerSentEvent.<UserEvent>builder()
                .id(event.getId().toString())
                .event(event.getType())
                .data(event)
                .build());
    }
}
```

---



🔬 **Section Challenge — Chapter 4: Response Handling**

**Challenge 1 (Reasoning):** Why is returning a generic `Map<String, Object>` or a plain `ResponseEntity<?>` from a `@RestController` considered an anti-pattern for REST APIs?
<details><summary>Answer</summary>

Loss of Type Safety and API Documentation. A generic `Map` completely destroys type safety; the compiler cannot verify what fields are being sent. Furthermore, tools like Swagger/OpenAPI rely on strongly typed DTO classes (e.g., `UserResponseDTO`) to generate API documentation. If you return a `Map`, the API documentation will just show an empty JSON object `{}`, making it impossible for frontend developers to know the contract without executing the endpoint.
</details>


## Chapter 5: Validation

```java
// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs WITH VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

public record CreateUserRequest(

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    String name,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100)
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
        message = "Password must contain lowercase, uppercase, digit, and special character"
    )
    String password,

    @NotNull(message = "Age is required")
    @Min(value = 18, message = "Must be at least 18")
    @Max(value = 120, message = "Invalid age")
    Integer age,

    @NotNull
    Role role,

    @NotEmpty(message = "At least one phone number required")
    @Size(max = 3, message = "Maximum 3 phone numbers")
    List<@Pattern(regexp = "^\\+?[0-9]{10,15}$") String> phoneNumbers,

    @Valid  // Validate nested object
    @NotNull
    AddressRequest address

) {}

public record AddressRequest(
    @NotBlank String street,
    @NotBlank String city,
    @NotBlank @Size(min = 2, max = 2) String state,
    @NotBlank @Pattern(regexp = "^[0-9]{5}(-[0-9]{4})?$") String zipCode
) {}


// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER WITH VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

@RestController
@RequestMapping("/api/v1/users")
@Validated  // Enable validation
public class UserController {

    // @Valid triggers validation on @RequestBody
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.create(request));
    }

    // Validate path variables
    @GetMapping("/{id}")
    public UserResponse getUser(
            @PathVariable @Min(1) Long id) {
        return userService.findById(id);
    }

    // Validate request params
    @GetMapping
    public Page<UserResponse> getUsers(
            @RequestParam @Min(0) int page,
            @RequestParam @Min(1) @Max(100) int size) {
        return userService.findAll(PageRequest.of(page, size));
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION ANNOTATIONS REFERENCE
// ═══════════════════════════════════════════════════════════════════════════════

/*
 * STANDARD (jakarta.validation.constraints):
 *
 * @NotNull        - Not null
 * @NotBlank       - Not null, not empty, not whitespace only (String)
 * @NotEmpty       - Not null, not empty (String, Collection, Map, Array)
 * @Null           - Must be null
 *
 * @Size(min, max) - String length or collection size
 * @Min(value)     - Number >= value
 * @Max(value)     - Number <= value
 *
 * @Email          - Valid email format
 * @Pattern(regexp)- Matches regex
 *
 * @Positive       - Number > 0
 * @PositiveOrZero - Number >= 0
 * @Negative       - Number < 0
 * @NegativeOrZero - Number <= 0
 *
 * @Past           - Date in past
 * @PastOrPresent  - Date in past or now
 * @Future         - Date in future
 * @FutureOrPresent- Date in future or now
 *
 * @Digits(integer, fraction) - Number digit constraints
 * @DecimalMin(value)  - Decimal >= value
 * @DecimalMax(value)  - Decimal <= value
 *
 * @Valid          - Cascade validation to nested objects
 *
 * HIBERNATE VALIDATOR EXTRAS:
 * @URL            - Valid URL
 * @CreditCardNumber
 * @ISBN
 * @Length(min, max) - String length
 * @Range(min, max)  - Number in range
 * @UniqueElements   - Collection has no duplicates
 */


// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

// 1. Create annotation
@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
@Documented
public @interface UniqueEmail {
    String message() default "Email already exists";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 2. Create validator
@Component
@RequiredArgsConstructor
public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    private final UserRepository userRepository;

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null) return true;  // Let @NotNull handle null
        return !userRepository.existsByEmail(email);
    }
}

// 3. Use it
public record CreateUserRequest(
    @UniqueEmail
    @Email
    String email
) {}


// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION GROUPS (Different rules for create vs update)
// ═══════════════════════════════════════════════════════════════════════════════

// Define groups
public interface OnCreate {}
public interface OnUpdate {}

// DTO with groups
public record UserRequest(

    @Null(groups = OnCreate.class, message = "ID must be null for creation")
    @NotNull(groups = OnUpdate.class, message = "ID required for update")
    Long id,

    @NotBlank(groups = {OnCreate.class, OnUpdate.class})
    String name,

    @NotBlank(groups = OnCreate.class)  // Required only on create
    String password

) {}

// Controller usage
@PostMapping
public UserResponse create(
        @Validated(OnCreate.class) @RequestBody UserRequest request) { }

@PutMapping("/{id}")
public UserResponse update(
        @PathVariable Long id,
        @Validated(OnUpdate.class) @RequestBody UserRequest request) { }
```

---

## Chapter 6: Exception Handling

```java
// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM EXCEPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Base exception
public class ApiException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public ApiException(String message, String errorCode, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    // Getters...
}

// Specific exceptions
public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String resource, Object id) {
        super(
            String.format("%s not found with id: %s", resource, id),
            "RESOURCE_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
    }
}

public class UserNotFoundException extends ResourceNotFoundException {
    public UserNotFoundException(Long id) {
        super("User", id);
    }
}

public class EmailAlreadyExistsException extends ApiException {
    public EmailAlreadyExistsException(String email) {
        super(
            String.format("Email already exists: %s", email),
            "EMAIL_ALREADY_EXISTS",
            HttpStatus.CONFLICT
        );
    }
}

public class BusinessRuleException extends ApiException {
    public BusinessRuleException(String rule) {
        super(rule, "BUSINESS_RULE_VIOLATION", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ERROR RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

@Builder
public record ErrorResponse(
    LocalDateTime timestamp,
    int status,
    String error,
    String errorCode,
    String message,
    String path,
    List<FieldError> fieldErrors
) {
    @Builder
    public record FieldError(
        String field,
        String message,
        Object rejectedValue
    ) {}
}


// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXCEPTION HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

@RestControllerAdvice  // Global handler for all controllers
@Slf4j
public class GlobalExceptionHandler {

    // Handle custom API exceptions
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(
            ApiException ex, HttpServletRequest request) {

        log.warn("API exception: {} - {}", ex.getErrorCode(), ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(ex.getStatus().value())
            .error(ex.getStatus().getReasonPhrase())
            .errorCode(ex.getErrorCode())
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(ex.getStatus()).body(error);
    }

    // Handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> ErrorResponse.FieldError.builder()
                .field(fe.getField())
                .message(fe.getDefaultMessage())
                .rejectedValue(fe.getRejectedValue())
                .build())
            .toList();

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Validation Failed")
            .errorCode("VALIDATION_ERROR")
            .message("Invalid request data")
            .path(request.getRequestURI())
            .fieldErrors(fieldErrors)
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    // Handle constraint violations (path variables, params)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        List<ErrorResponse.FieldError> errors = ex.getConstraintViolations()
            .stream()
            .map(cv -> ErrorResponse.FieldError.builder()
                .field(extractFieldName(cv.getPropertyPath()))
                .message(cv.getMessage())
                .rejectedValue(cv.getInvalidValue())
                .build())
            .toList();

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Constraint Violation")
            .errorCode("CONSTRAINT_VIOLATION")
            .message("Invalid parameter(s)")
            .path(request.getRequestURI())
            .fieldErrors(errors)
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    // Handle 404 from Spring
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            NoResourceFoundException ex, HttpServletRequest request) {

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.NOT_FOUND.value())
            .error("Not Found")
            .errorCode("ENDPOINT_NOT_FOUND")
            .message("Resource not found")
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // Handle method not allowed
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.METHOD_NOT_ALLOWED.value())
            .error("Method Not Allowed")
            .errorCode("METHOD_NOT_ALLOWED")
            .message(String.format("'%s' is not supported. Supported: %s",
                ex.getMethod(), Arrays.toString(ex.getSupportedMethods())))
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(error);
    }

    // Handle JSON parse errors
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleJsonParseError(
            HttpMessageNotReadableException ex, HttpServletRequest request) {

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Malformed JSON")
            .errorCode("JSON_PARSE_ERROR")
            .message("Invalid JSON in request body")
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    // Catch-all for unexpected errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(
            Exception ex, HttpServletRequest request) {

        log.error("Unexpected error", ex);  // Log full stack trace

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .error("Internal Server Error")
            .errorCode("INTERNAL_ERROR")
            .message("An unexpected error occurred")  // Don't expose details!
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private String extractFieldName(Path path) {
        String fullPath = path.toString();
        int lastDot = fullPath.lastIndexOf('.');
        return lastDot > 0 ? fullPath.substring(lastDot + 1) : fullPath;
    }
}
```

---



🔬 **Section Challenge — Chapter 6: Exception Handling**

**Challenge 1 (Reasoning):** Why is returning a generic `Map<String, Object>` or a plain `ResponseEntity<?>` from a `@RestController` considered an anti-pattern for REST APIs?
<details><summary>Answer</summary>

Loss of Type Safety and API Documentation. A generic `Map` completely destroys type safety; the compiler cannot verify what fields are being sent. Furthermore, tools like Swagger/OpenAPI rely on strongly typed DTO classes (e.g., `UserResponseDTO`) to generate API documentation. If you return a `Map`, the API documentation will just show an empty JSON object `{}`, making it impossible for frontend developers to know the contract without executing the endpoint.
</details>


## Chapter 7: API Versioning

```java
// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 1: URL PATH VERSIONING (Most Common)
// ═══════════════════════════════════════════════════════════════════════════════

// /api/v1/users
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 {
    @GetMapping("/{id}")
    public UserResponseV1 getUser(@PathVariable Long id) { }
}

// /api/v2/users
@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 {
    @GetMapping("/{id}")
    public UserResponseV2 getUser(@PathVariable Long id) { }  // Different response
}

/*
 * PROS:
 * ✅ Clear, visible versioning
 * ✅ Easy to route and cache
 * ✅ Easy to document
 *
 * CONS:
 * ❌ URL changes on version bump
 * ❌ Can lead to code duplication
 */


// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 2: HEADER VERSIONING
// ═══════════════════════════════════════════════════════════════════════════════

// X-API-Version: 1
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(value = "/{id}", headers = "X-API-Version=1")
    public UserResponseV1 getUserV1(@PathVariable Long id) { }

    @GetMapping(value = "/{id}", headers = "X-API-Version=2")
    public UserResponseV2 getUserV2(@PathVariable Long id) { }
}

/*
 * PROS:
 * ✅ Clean URLs
 * ✅ Version not in URL
 *
 * CONS:
 * ❌ Hidden versioning (not visible in URL)
 * ❌ Harder to test in browser
 * ❌ Caching complexity
 */


// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 3: ACCEPT HEADER (Content Negotiation)
// ═══════════════════════════════════════════════════════════════════════════════

// Accept: application/vnd.myapp.v1+json
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(value = "/{id}", produces = "application/vnd.myapp.v1+json")
    public UserResponseV1 getUserV1(@PathVariable Long id) { }

    @GetMapping(value = "/{id}", produces = "application/vnd.myapp.v2+json")
    public UserResponseV2 getUserV2(@PathVariable Long id) { }
}

/*
 * PROS:
 * ✅ RESTful approach
 * ✅ Version in media type
 *
 * CONS:
 * ❌ Complex setup
 * ❌ Harder for clients
 */


// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 4: QUERY PARAMETER
// ═══════════════════════════════════════════════════════════════════════════════

// /api/users/123?version=2
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public Object getUser(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int version) {
        return version == 2
            ? userService.getUserV2(id)
            : userService.getUserV1(id);
    }
}

/*
 * PROS:
 * ✅ Easy to implement
 * ✅ Optional parameter
 *
 * CONS:
 * ❌ Not truly RESTful
 * ❌ Caching issues
 */


// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION: URL PATH VERSIONING
// ═══════════════════════════════════════════════════════════════════════════════

/*
 * Use /api/v1/, /api/v2/ because:
 * - Most widely understood
 * - Easy to implement and test
 * - Clear documentation
 * - Works well with caching
 * - Easy to deprecate old versions
 */
```

---



🔬 **Section Challenge — Chapter 7: API Versioning**

**Challenge 1 (Reasoning):** Why is returning a generic `Map<String, Object>` or a plain `ResponseEntity<?>` from a `@RestController` considered an anti-pattern for REST APIs?
<details><summary>Answer</summary>

Loss of Type Safety and API Documentation. A generic `Map` completely destroys type safety; the compiler cannot verify what fields are being sent. Furthermore, tools like Swagger/OpenAPI rely on strongly typed DTO classes (e.g., `UserResponseDTO`) to generate API documentation. If you return a `Map`, the API documentation will just show an empty JSON object `{}`, making it impossible for frontend developers to know the contract without executing the endpoint.
</details>


## Chapter 8: Controller Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CONTROLLER BEST PRACTICES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. THIN CONTROLLERS                                                            │
│  ─────────────────────                                                          │
│  Controllers should:                                                            │
│  ✅ Receive request                                                              │
│  ✅ Validate (via @Valid)                                                        │
│  ✅ Delegate to service                                                          │
│  ✅ Return response                                                              │
│                                                                                 │
│  Controllers should NOT:                                                        │
│  ❌ Contain business logic                                                       │
│  ❌ Access repositories directly                                                 │
│  ❌ Have complex conditionals                                                    │
│  ❌ Do data transformation (use mapper in service)                               │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  2. USE MEANINGFUL HTTP STATUS CODES                                            │
│  ──────────────────────────────────────                                         │
│  200 OK          - Successful GET, PUT, PATCH                                   │
│  201 Created     - Successful POST (with Location header)                       │
│  204 No Content  - Successful DELETE                                            │
│  400 Bad Request - Validation error, malformed request                          │
│  401 Unauthorized- Missing/invalid authentication                               │
│  403 Forbidden   - Authenticated but not authorized                             │
│  404 Not Found   - Resource doesn't exist                                       │
│  409 Conflict    - Duplicate resource (e.g., email exists)                      │
│  422 Unprocessable Entity - Business rule violation                             │
│  500 Internal Error - Unexpected server error                                   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  3. CONSISTENT RESPONSE FORMAT                                                  │
│  ─────────────────────────────────                                              │
│  // Success response                                                            │
│  {                                                                              │
│    "data": { ... },                                                             │
│    "message": "Success"                                                         │
│  }                                                                              │
│                                                                                 │
│  // Error response                                                              │
│  {                                                                              │
│    "timestamp": "2024-01-15T10:30:00Z",                                         │
│    "status": 404,                                                               │
│    "error": "Not Found",                                                        │
│    "errorCode": "USER_NOT_FOUND",                                               │
│    "message": "User not found with id: 123",                                    │
│    "path": "/api/v1/users/123"                                                  │
│  }                                                                              │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  4. DOCUMENT WITH OPENAPI                                                       │
│  ───────────────────────────                                                    │
│  @Operation(summary = "Get user by ID")                                         │
│  @ApiResponses({                                                                │
│    @ApiResponse(responseCode = "200", description = "User found"),              │
│    @ApiResponse(responseCode = "404", description = "User not found")           │
│  })                                                                             │
│  @GetMapping("/{id}")                                                           │
│  public UserResponse getUser(@PathVariable Long id) { }                         │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  5. PAGINATION BEST PRACTICES                                                   │
│  ─────────────────────────────────                                              │
│  - Default page size (e.g., 20)                                                 │
│  - Max page size limit (e.g., 100)                                              │
│  - Return pagination metadata                                                   │
│  - Use cursor-based for real-time data                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Example: Complete CRUD Controller

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Validated
@Slf4j
@Tag(name = "Users", description = "User management APIs")
public class UserController {

    private final UserService userService;

    // ═══════════════════════════════════════════════════════════════════════════
    // LIST (with pagination)
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "List all users with pagination")
    @GetMapping
    public ResponseEntity<PageResponse<UserSummary>> getUsers(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(userService.findAll(pageable));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH (with filters)
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Search users with filters")
    @GetMapping("/search")
    public ResponseEntity<PageResponse<UserSummary>> searchUsers(
            @Valid @ModelAttribute UserSearchCriteria criteria,
            Pageable pageable) {

        return ResponseEntity.ok(userService.search(criteria, pageable));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET ONE
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Get user by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User found"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(
            @PathVariable @Min(1) Long id) {

        return ResponseEntity.ok(userService.findById(id));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Create new user")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "User created"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "409", description = "Email already exists")
    })
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        UserResponse created = userService.create(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(created.id())
            .toUri();

        return ResponseEntity.created(location).body(created);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE (Full replacement)
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Update user (full replacement)")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        return ResponseEntity.ok(userService.update(id, request));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PATCH (Partial update)
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Partially update user")
    @PatchMapping("/{id}")
    public ResponseEntity<UserResponse> patchUser(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody PatchUserRequest request) {

        return ResponseEntity.ok(userService.patch(id, request));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DELETE
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Delete user")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "User deleted"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable @Min(1) Long id) {

        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUB-RESOURCE: User's Orders
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Get user's orders")
    @GetMapping("/{userId}/orders")
    public ResponseEntity<List<OrderSummary>> getUserOrders(
            @PathVariable @Min(1) Long userId) {

        return ResponseEntity.ok(userService.findUserOrders(userId));
    }

    @Operation(summary = "Create order for user")
    @PostMapping("/{userId}/orders")
    public ResponseEntity<OrderResponse> createUserOrder(
            @PathVariable @Min(1) Long userId,
            @Valid @RequestBody CreateOrderRequest request) {

        OrderResponse created = userService.createOrder(userId, request);

        URI location = URI.create(
            "/api/v1/users/" + userId + "/orders/" + created.id());

        return ResponseEntity.created(location).body(created);
    }
}
```

---

# 📋 CONTROLLER CHECKLIST

```
□ @RestController + @RequestMapping with versioned base path
□ @RequiredArgsConstructor for DI
□ @Validated for method-level validation
□ @Valid on @RequestBody DTOs
□ Appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
□ Correct status codes (200, 201, 204, 400, 404, etc.)
□ ResponseEntity for explicit control
□ POST returns 201 with Location header
□ DELETE returns 204 No Content
□ Global exception handler with @RestControllerAdvice
□ Consistent error response format
□ API documentation with OpenAPI annotations
□ Pagination for list endpoints
□ Thin controllers - delegate to services
```


---

_Continue to Part 8: JPA & Hibernate Deep Dive_


---

> **Navigation**: [< Previous](Ch36_SB_Service_Repository.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch40_SB_JPA_Deep_Dive.md)