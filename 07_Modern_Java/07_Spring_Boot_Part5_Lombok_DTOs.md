# 🌱 SPRING BOOT MASTERY - Part 5: Lombok & DTO Patterns

> **Eliminating Boilerplate, Clean Data Transfer**
> _"Write less code, express more intent"_

---

# LOMBOK - THE BOILERPLATE KILLER

---

## Chapter 1: Why Lombok Exists

### 🔵 THE PROBLEM: Java Verbosity

```java
// WITHOUT LOMBOK - 80+ lines for a simple class!

public class User {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean active;
    private Role role;

    // Default constructor
    public User() {}

    // All-args constructor
    public User(Long id, String firstName, String lastName, String email,
                LocalDateTime createdAt, LocalDateTime updatedAt,
                boolean active, Role role) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.active = active;
        this.role = role;
    }

    // Getters
    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isActive() { return active; }
    public Role getRole() { return role; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setEmail(String email) { this.email = email; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setActive(boolean active) { this.active = active; }
    public void setRole(Role role) { this.role = role; }

    // equals()
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return active == user.active &&
               Objects.equals(id, user.id) &&
               Objects.equals(firstName, user.firstName) &&
               Objects.equals(lastName, user.lastName) &&
               Objects.equals(email, user.email) &&
               Objects.equals(createdAt, user.createdAt) &&
               Objects.equals(updatedAt, user.updatedAt) &&
               role == user.role;
    }

    // hashCode()
    @Override
    public int hashCode() {
        return Objects.hash(id, firstName, lastName, email,
                           createdAt, updatedAt, active, role);
    }

    // toString()
    @Override
    public String toString() {
        return "User{" +
               "id=" + id +
               ", firstName='" + firstName + '\'' +
               ", lastName='" + lastName + '\'' +
               ", email='" + email + '\'' +
               ", createdAt=" + createdAt +
               ", updatedAt=" + updatedAt +
               ", active=" + active +
               ", role=" + role +
               '}';
    }
}
```

### 🟢 WITH LOMBOK - Same functionality in 15 lines!

```java
@Data  // Generates getters, setters, equals, hashCode, toString
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean active;
    private Role role;
}

// That's it! 80+ lines → 15 lines
// All methods are generated at COMPILE TIME
```

---

## Chapter 2: How Lombok Works (The Magic)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LOMBOK COMPILATION PROCESS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐                                                            │
│  │  User.java      │                                                            │
│  │  @Data          │                                                            │
│  │  class User {   │                                                            │
│  │    String name; │                                                            │
│  │  }              │                                                            │
│  └────────┬────────┘                                                            │
│           │                                                                      │
│           ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    JAVA COMPILER (javac)                                 │   │
│  │                                                                          │   │
│  │  1. Parse source code → Abstract Syntax Tree (AST)                      │   │
│  │  2. LOMBOK HOOKS IN via Annotation Processor API                        │   │
│  │  3. Lombok MODIFIES the AST (adds methods to tree)                      │   │
│  │  4. Compiler continues with modified AST                                │   │
│  │  5. Generates bytecode with all Lombok methods                          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│           │                                                                      │
│           ▼                                                                      │
│  ┌─────────────────┐                                                            │
│  │  User.class     │  ← Contains all generated methods!                         │
│  │  getName()      │                                                            │
│  │  setName()      │                                                            │
│  │  equals()       │                                                            │
│  │  hashCode()     │                                                            │
│  │  toString()     │                                                            │
│  └─────────────────┘                                                            │
│                                                                                  │
│  KEY INSIGHT: Lombok modifies bytecode at COMPILE time, not runtime            │
│  There's NO runtime overhead - methods exist in .class file                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 3: Lombok Annotations Deep Dive

### @Getter and @Setter

```java
// BASIC USAGE
@Getter @Setter
public class User {
    private String name;
    private String email;
}

// GENERATES:
public String getName() { return name; }
public void setName(String name) { this.name = name; }
public String getEmail() { return email; }
public void setEmail(String email) { this.email = email; }


// FIELD-LEVEL (selective generation)
public class User {
    @Getter @Setter
    private String name;

    @Getter  // No setter - read-only
    private String email;

    // No annotations - no methods generated
    private String internalField;
}


// ACCESS LEVEL CONTROL
public class User {
    @Getter(AccessLevel.PUBLIC)
    @Setter(AccessLevel.PROTECTED)  // Setter is protected
    private String name;

    @Getter(AccessLevel.NONE)  // No getter generated
    @Setter
    private String password;
}


// BOOLEAN GETTERS
public class User {
    @Getter @Setter
    private boolean active;  // Generates: isActive() not getActive()

    @Getter @Setter
    private Boolean verified;  // Generates: getVerified() (object Boolean)
}
```

### @ToString

```java
// BASIC
@ToString
public class User {
    private Long id;
    private String name;
    private String email;
}
// GENERATES: User(id=1, name=John, email=john@test.com)


// EXCLUDE SENSITIVE FIELDS
@ToString(exclude = {"password", "ssn"})
public class User {
    private String name;
    private String password;  // Won't appear in toString
    private String ssn;       // Won't appear in toString
}


// INCLUDE ONLY SPECIFIC FIELDS
@ToString(onlyExplicitlyIncluded = true)
public class User {
    @ToString.Include
    private Long id;

    @ToString.Include
    private String name;

    private String email;  // Won't appear
    private String password;  // Won't appear
}


// CALL PARENT toString()
@ToString(callSuper = true)
public class Employee extends Person {
    private String department;
}
// GENERATES: Employee(super=Person(name=John), department=IT)


// CUSTOM FIELD NAMES
@ToString
public class User {
    @ToString.Include(name = "userId")
    private Long id;

    @ToString.Include(rank = -1)  // Lower rank = printed last
    private String name;
}
```

### @EqualsAndHashCode

```java
// BASIC (uses ALL non-static fields)
@EqualsAndHashCode
public class User {
    private Long id;
    private String name;
    private String email;
}


// EXCLUDE FIELDS
@EqualsAndHashCode(exclude = {"createdAt", "updatedAt"})
public class User {
    private Long id;
    private String name;
    private LocalDateTime createdAt;  // Excluded
    private LocalDateTime updatedAt;  // Excluded
}


// ONLY SPECIFIC FIELDS (Business Key)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    @EqualsAndHashCode.Include
    private Long id;  // Only id used for equality

    private String name;  // Not used
    private String email;  // Not used
}


// ⚠️ CRITICAL FOR JPA ENTITIES
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    @Id
    @GeneratedValue
    @EqualsAndHashCode.Include  // Use only ID for equality
    private Long id;

    private String name;
}
/*
 * WHY? JPA proxies may not have all fields loaded!
 * Using non-ID fields can cause:
 * - LazyInitializationException
 * - Incorrect equality with proxies
 * - HashSet/HashMap issues
 */


// CALL PARENT equals/hashCode
@EqualsAndHashCode(callSuper = true)
public class Employee extends Person {
    private String department;
}
```

### @NoArgsConstructor, @AllArgsConstructor, @RequiredArgsConstructor

```java
// NO-ARGS CONSTRUCTOR
@NoArgsConstructor
public class User {
    private String name;
}
// GENERATES: public User() {}


// ALL-ARGS CONSTRUCTOR
@AllArgsConstructor
public class User {
    private Long id;
    private String name;
    private String email;
}
// GENERATES: public User(Long id, String name, String email) { ... }


// REQUIRED-ARGS CONSTRUCTOR (final + @NonNull fields)
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;  // Included (final)
    private final EmailService emailService;      // Included (final)
    private String optionalField;                 // Not included
}
// GENERATES: public UserService(UserRepository userRepository, EmailService emailService) { ... }

// THIS IS THE SPRING BEST PRACTICE FOR DEPENDENCY INJECTION!
@Service
@RequiredArgsConstructor  // Generates constructor for DI
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    // No explicit constructor needed!
}


// STATIC FACTORY METHOD
@RequiredArgsConstructor(staticName = "of")
public class Point {
    private final int x;
    private final int y;
}
// GENERATES: private Point(int x, int y) { ... }
//            public static Point of(int x, int y) { return new Point(x, y); }
// USAGE: Point p = Point.of(10, 20);


// FORCE ACCESS LEVEL
@NoArgsConstructor(access = AccessLevel.PRIVATE)  // Private no-arg constructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class User { }
```

### @Data (The Shortcut)

```java
@Data  // = @Getter + @Setter + @ToString + @EqualsAndHashCode + @RequiredArgsConstructor
public class User {
    private Long id;
    private String name;
    private String email;
}

/*
 * ⚠️ WARNING: @Data is MUTABLE by default
 * - Generates setters for all fields
 * - Not good for immutable objects
 * - Not ideal for JPA entities (see below)
 */

// FOR JPA ENTITIES, USE THIS COMBINATION INSTEAD:
@Entity
@Getter
@Setter  // Or be selective
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // JPA needs no-arg constructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"password", "orders"})  // Exclude collections to avoid lazy loading
public class User {
    @Id
    @GeneratedValue
    @EqualsAndHashCode.Include
    private Long id;

    private String name;

    @ToString.Exclude
    private String password;

    @OneToMany(mappedBy = "user")
    @ToString.Exclude  // Avoid loading entire collection
    private List<Order> orders;
}
```

### @Value (Immutable Data Class)

```java
@Value  // = @Getter + @AllArgsConstructor + @ToString + @EqualsAndHashCode + make all fields private final
public class UserDTO {
    Long id;
    String name;
    String email;
}

// GENERATES:
public final class UserDTO {
    private final Long id;
    private final String name;
    private final String email;

    public UserDTO(Long id, String name, String email) { ... }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    // equals, hashCode, toString
    // NO SETTERS! Immutable!
}

// USE FOR: DTOs, Value Objects, Configuration Objects
// ⚠️ Cannot use @Value with JPA @Entity (entities need setters & no-arg constructor)
```

### @Builder (The Builder Pattern)

```java
@Builder
public class User {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private boolean active;
}

// USAGE:
User user = User.builder()
    .name("John")
    .email("john@test.com")
    .role(Role.USER)
    .active(true)
    .build();

// GENERATES (simplified):
public class User {
    // ... fields ...

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String name;
        // ... other fields ...

        public UserBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserBuilder name(String name) {
            this.name = name;
            return this;
        }

        // ... other setters ...

        public User build() {
            return new User(id, name, email, role, active);
        }
    }
}


// BUILDER WITH DEFAULTS
@Builder
public class Order {
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private String productName;
    private int quantity;
}
// Order.builder().productName("Laptop").quantity(1).build()
// → status = PENDING, createdAt = now()


// BUILDER + TOBUILDER (Copy and modify)
@Builder(toBuilder = true)
public class User {
    private String name;
    private String email;
}

User original = User.builder().name("John").email("john@test.com").build();
User modified = original.toBuilder().email("newemail@test.com").build();
// modified = User(name=John, email=newemail@test.com)


// BUILDER WITH INHERITANCE
@SuperBuilder  // Use instead of @Builder for inheritance
public class Person {
    private String name;
}

@SuperBuilder
public class Employee extends Person {
    private String department;
}

Employee emp = Employee.builder()
    .name("John")        // From Person
    .department("IT")    // From Employee
    .build();
```

### @Slf4j and Other Logger Annotations

```java
@Slf4j  // Creates: private static final Logger log = LoggerFactory.getLogger(UserService.class);
@Service
public class UserService {

    public User findById(Long id) {
        log.debug("Finding user by id: {}", id);  // Use directly!
        log.info("User found: {}", user);
        log.error("Error occurred", exception);
        return user;
    }
}

// OTHER LOGGER OPTIONS:
@Log        // java.util.logging.Logger
@Log4j      // Apache Log4j 1.x
@Log4j2     // Apache Log4j 2.x
@Slf4j      // SLF4J (RECOMMENDED - Spring Boot default)
@CommonsLog // Apache Commons Logging
@JBossLog   // JBoss Logging
@Flogger    // Google Flogger
```

### @NonNull and @Cleanup

```java
// @NonNull - Null checks
public class UserService {

    public User createUser(@NonNull String name, @NonNull String email) {
        // Lombok generates null check at start of method:
        // if (name == null) throw new NullPointerException("name is marked non-null but is null");
        return new User(name, email);
    }
}

// @NonNull on fields
@RequiredArgsConstructor
public class UserService {
    @NonNull  // Included in constructor, null-check added
    private UserRepository userRepository;
}


// @Cleanup - Auto-close resources
public void readFile(String path) {
    @Cleanup InputStream in = new FileInputStream(path);
    @Cleanup OutputStream out = new FileOutputStream("output.txt");

    // ... use streams ...

    // Lombok generates try-finally to close resources
    // No need for try-with-resources!
}

// EQUIVALENT TO:
public void readFile(String path) {
    try (InputStream in = new FileInputStream(path);
         OutputStream out = new FileOutputStream("output.txt")) {
        // ... use streams ...
    }
}
```

### @SneakyThrows

```java
// WITHOUT @SneakyThrows
public String readFile(String path) {
    try {
        return Files.readString(Path.of(path));
    } catch (IOException e) {
        throw new RuntimeException(e);  // Wrap checked exception
    }
}

// WITH @SneakyThrows
@SneakyThrows  // Throws checked exception without declaring
public String readFile(String path) {
    return Files.readString(Path.of(path));  // IOException is thrown sneakily
}

/*
 * HOW IT WORKS:
 * Lombok uses a trick: throws the checked exception without wrapping
 * Bytecode doesn't require throws declaration (JVM doesn't care)
 * Only javac enforces checked exceptions!
 *
 * ⚠️ USE WITH CAUTION:
 * - Breaks checked exception contract
 * - Callers don't know to catch the exception
 * - Use only for truly exceptional cases
 */
```

### @Synchronized

```java
// WITHOUT @Synchronized
public class Counter {
    private final Object lock = new Object();
    private int count = 0;

    public void increment() {
        synchronized (lock) {  // Explicit lock object
            count++;
        }
    }
}

// WITH @Synchronized
public class Counter {
    private int count = 0;

    @Synchronized  // Lombok creates a private lock object
    public void increment() {
        count++;
    }
}

// GENERATES:
public class Counter {
    private final Object $lock = new Object[0];  // Empty array (small footprint)
    private int count = 0;

    public void increment() {
        synchronized ($lock) {
            count++;
        }
    }
}

/*
 * WHY BETTER THAN synchronized(this)?
 * - synchronized(this) allows external code to acquire the lock
 * - Private $lock object = only your methods can acquire it
 * - Prevents denial-of-service attacks
 */
```

---

## Chapter 4: Lombok Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LOMBOK BEST PRACTICES                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ✅ DO:                                                                          │
│  ───────                                                                         │
│  • Use @RequiredArgsConstructor for Spring DI                                   │
│  • Use @Builder for complex object creation                                     │
│  • Use @Value for immutable DTOs                                                │
│  • Use @Slf4j for logging                                                       │
│  • Exclude sensitive fields from @ToString                                      │
│  • Use onlyExplicitlyIncluded for @EqualsAndHashCode in JPA                    │
│                                                                                  │
│  ❌ DON'T:                                                                       │
│  ──────────                                                                      │
│  • Use @Data on JPA entities without customization                             │
│  • Include collections in @ToString (lazy loading issues)                      │
│  • Use @EqualsAndHashCode with all fields on JPA entities                      │
│  • Overuse @SneakyThrows                                                        │
│  • Forget that Lombok is a compile-time tool                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Lombok Configuration File

```properties
# lombok.config (place in project root)

# Stop if older Lombok version
config.stopBubbling = true

# Flag @Data usage as warning (prefer explicit annotations)
lombok.data.flagUsage = warning

# Default field access for @EqualsAndHashCode
lombok.equalsAndHashCode.callSuper = call

# Require explicit inclusion for toString
lombok.toString.onlyExplicitlyIncluded = true

# Add @Generated annotation to generated code
lombok.addLombokGeneratedAnnotation = true

# Use Jackson-friendly builders
lombok.builder.className = *Builder

# Log field name
lombok.log.fieldName = log

# Disable experimental features
lombok.experimental.flagUsage = warning
```

---

# DTOs - DATA TRANSFER OBJECTS

---

## Chapter 5: Why DTOs Matter

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    THE DTO PROBLEM                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITHOUT DTOs (Exposing Entity Directly):                                       │
│                                                                                  │
│  @Entity                                                                         │
│  public class User {                                                             │
│      private Long id;                                                           │
│      private String email;                                                       │
│      private String passwordHash;     // 🔴 EXPOSED TO CLIENT!                 │
│      private String ssn;              // 🔴 EXPOSED TO CLIENT!                 │
│      private List<Order> orders;      // 🔴 LazyInitializationException!       │
│      private LocalDateTime lastLogin; // 🔴 Internal data exposed!             │
│  }                                                                              │
│                                                                                  │
│  PROBLEMS:                                                                       │
│  ❌ Security: Sensitive data exposed                                            │
│  ❌ Performance: Loading unnecessary relationships                              │
│  ❌ Coupling: API tied to database schema                                       │
│  ❌ Versioning: Changing entity breaks all clients                             │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITH DTOs (Clean API Contract):                                                │
│                                                                                  │
│  public record UserResponse(                                                    │
│      Long id,                                                                   │
│      String email,                                                              │
│      String displayName                                                         │
│  ) {}                                                                           │
│                                                                                  │
│  BENEFITS:                                                                       │
│  ✅ Security: Only expose what's needed                                        │
│  ✅ Performance: Load only required data                                       │
│  ✅ Decoupling: API independent of database                                    │
│  ✅ Versioning: Can evolve API without changing entity                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 6: DTO Patterns

### Request and Response DTOs

```java
// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs (Input)
// ═══════════════════════════════════════════════════════════════════════════════

// Using Java Records (Recommended for Java 16+)
public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100)
    String name,

    @NotBlank
    @Email(message = "Invalid email format")
    String email,

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).+$",
             message = "Password must contain uppercase, lowercase, and digit")
    String password,

    @NotNull
    Role role
) {}

// Using Lombok (Java 8-15 or when you need mutability)
@Value  // Immutable
public class CreateUserRequest {
    @NotBlank String name;
    @NotBlank @Email String email;
    @NotBlank @Size(min = 8) String password;
    @NotNull Role role;
}


// UPDATE REQUEST (May have optional fields)
@Data
public class UpdateUserRequest {
    @Size(min = 2, max = 100)
    private String name;  // Optional - null means "don't update"

    @Email
    private String email;

    // No password field - separate endpoint for password change
}


// PARTIAL UPDATE (PATCH)
@Data
public class PatchUserRequest {
    private Optional<String> name = Optional.empty();
    private Optional<String> email = Optional.empty();

    public boolean hasName() { return name.isPresent(); }
    public boolean hasEmail() { return email.isPresent(); }
}


// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs (Output)
// ═══════════════════════════════════════════════════════════════════════════════

// Full response
public record UserResponse(
    Long id,
    String name,
    String email,
    Role role,
    boolean active,
    LocalDateTime createdAt
) {
    // Static factory method for mapping
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt()
        );
    }
}


// Summary response (for lists)
public record UserSummary(
    Long id,
    String name,
    String email
) {
    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getName(), user.getEmail());
    }
}


// Detail response (includes related data)
public record UserDetailResponse(
    Long id,
    String name,
    String email,
    Role role,
    List<OrderSummary> recentOrders,
    AddressResponse address,
    UserStats stats
) {
    public static UserDetailResponse from(User user, List<Order> orders, UserStats stats) {
        return new UserDetailResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            orders.stream().map(OrderSummary::from).toList(),
            AddressResponse.from(user.getAddress()),
            stats
        );
    }
}
```

### Paginated Response DTO

```java
// Generic paginated response
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    // Factory method from Spring's Page object
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isFirst(),
            page.isLast()
        );
    }

    // Factory method with mapper
    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
            page.getContent().stream().map(mapper).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isFirst(),
            page.isLast()
        );
    }
}

// Usage:
public PageResponse<UserSummary> getUsers(int page, int size) {
    Page<User> users = userRepository.findAll(PageRequest.of(page, size));
    return PageResponse.from(users, UserSummary::from);
}
```

### API Response Wrapper

```java
// Standardized API response format
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    String errorCode,
    LocalDateTime timestamp
) {
    // Success response
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, null, LocalDateTime.now());
    }

    // Error response
    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, null, message, errorCode, LocalDateTime.now());
    }
}

// Usage in controller:
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
    return userService.findById(id)
        .map(user -> ResponseEntity.ok(ApiResponse.success(UserResponse.from(user))))
        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error("User not found", "USER_NOT_FOUND")));
}
```

---

## Chapter 7: DTO Mapping Strategies

### Manual Mapping (Simple, No Dependencies)

```java
@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;

        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt()
        );
    }

    public User toEntity(CreateUserRequest request) {
        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setRole(request.role());
        user.setActive(true);
        return user;
    }

    public void updateEntity(User user, UpdateUserRequest request) {
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
    }

    public List<UserResponse> toResponseList(List<User> users) {
        return users.stream()
            .map(this::toResponse)
            .toList();
    }
}
```

### MapStruct (Compile-Time Code Generation)

```java
// Add dependency:
// implementation 'org.mapstruct:mapstruct:1.5.5.Final'
// annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
// annotationProcessor 'org.projectlombok:lombok-mapstruct-binding:0.2.0'

@Mapper(componentModel = "spring")  // Makes it a Spring bean
public interface UserMapper {

    // Simple mapping (same field names)
    UserResponse toResponse(User user);

    // Mapping with different field names
    @Mapping(source = "email", target = "emailAddress")
    @Mapping(source = "createdAt", target = "registrationDate")
    UserDTO toDTO(User user);

    // Ignore fields
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    User toEntity(CreateUserRequest request);

    // Custom mapping for nested objects
    @Mapping(source = "address.city", target = "city")
    @Mapping(source = "address.country", target = "country")
    UserFlatDTO toFlatDTO(User user);

    // Collection mapping (automatic!)
    List<UserResponse> toResponseList(List<User> users);

    // Update existing entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    void updateEntity(@MappingTarget User user, UpdateUserRequest request);

    // Expression mapping
    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    UserResponse toResponseWithFullName(User user);

    // Default method for custom logic
    default String map(Role role) {
        return role != null ? role.name() : null;
    }
}

// Usage:
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;  // Injected automatically

    public UserResponse findById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
}
```

---

## Chapter 8: DTO Architecture Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DTO ARCHITECTURE                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PACKAGE STRUCTURE:                                                              │
│                                                                                  │
│  com.example.myapp/                                                             │
│  ├── controller/                                                                │
│  │   └── UserController.java                                                    │
│  ├── service/                                                                   │
│  │   └── UserService.java                                                       │
│  ├── repository/                                                                │
│  │   └── UserRepository.java                                                    │
│  ├── entity/                         ← Database entities                        │
│  │   └── User.java                                                              │
│  ├── dto/                            ← All DTOs                                 │
│  │   ├── request/                    ← Input DTOs                               │
│  │   │   ├── CreateUserRequest.java                                             │
│  │   │   └── UpdateUserRequest.java                                             │
│  │   ├── response/                   ← Output DTOs                              │
│  │   │   ├── UserResponse.java                                                  │
│  │   │   ├── UserSummary.java                                                   │
│  │   │   └── UserDetailResponse.java                                            │
│  │   └── common/                     ← Shared DTOs                              │
│  │       ├── PageResponse.java                                                  │
│  │       └── ApiResponse.java                                                   │
│  └── mapper/                         ← DTO mappers                              │
│      └── UserMapper.java                                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Example: User Management

```java
// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY
// ═══════════════════════════════════════════════════════════════════════════════

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"passwordHash", "orders"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();
}


// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ═══════════════════════════════════════════════════════════════════════════════

public record CreateUserRequest(
    @NotBlank @Size(min = 2, max = 100) String name,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    @NotNull Role role
) {}

public record UpdateUserRequest(
    @Size(min = 2, max = 100) String name,
    @Email String email,
    Role role,
    Boolean active
) {}


// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

public record UserResponse(
    Long id,
    String name,
    String email,
    Role role,
    boolean active,
    LocalDateTime createdAt
) {}

public record UserSummary(Long id, String name, String email) {}


// ═══════════════════════════════════════════════════════════════════════════════
// MAPPER (MapStruct)
// ═══════════════════════════════════════════════════════════════════════════════

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);
    UserSummary toSummary(User user);
    List<UserResponse> toResponseList(List<User> users);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "active", constant = "true")
    User toEntity(CreateUserRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "orders", ignore = true)
    void updateEntity(@MappingTarget User user, UpdateUserRequest request);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserSummary> findAll(int page, int size) {
        Page<User> users = userRepository.findAll(PageRequest.of(page, size));
        return PageResponse.from(users, userMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User saved = userRepository.save(user);
        log.info("Created user: {}", saved.getId());

        return userMapper.toResponse(saved);
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));

        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new EmailAlreadyExistsException(request.email());
            }
        }

        userMapper.updateEntity(user, request);

        User saved = userRepository.save(user);
        log.info("Updated user: {}", saved.getId());

        return userMapper.toResponse(saved);
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
        log.info("Deleted user: {}", id);
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<PageResponse<UserSummary>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.findAll(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        URI location = URI.create("/api/v1/users/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

# 📋 LOMBOK & DTO CHECKLIST

```
LOMBOK:
□ Know all core annotations (@Data, @Value, @Builder, etc.)
□ Understand @RequiredArgsConstructor for Spring DI
□ Can configure Lombok for JPA entities properly
□ Know when to use @Value vs @Data
□ Can use @Builder with defaults and toBuilder

DTOs:
□ Understand why DTOs are essential (security, decoupling)
□ Can design Request vs Response DTOs
□ Know DTO mapping strategies (manual, MapStruct)
□ Can implement paginated responses
□ Understand API response wrapper pattern
```

---

_Continue to Part 6: Service Layer & Repository Best Practices_
