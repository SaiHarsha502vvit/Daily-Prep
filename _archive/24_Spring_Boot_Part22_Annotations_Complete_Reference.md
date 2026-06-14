# Spring Boot Part 22: Complete Annotations Reference

## Every Important Annotation You Need to Know

> **"Annotations are the DNA of Spring Boot - they define behavior without boilerplate"**

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Learn All These Annotations?                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Annotations ARE Spring: Without them, you're writing raw Java               │
│  • Interview questions: "Explain @Transactional propagation"                  │
│  • Debug faster: Know what each annotation does under the hood                │
│  • Write less code: @PrePersist beats manual timestamp setting                │
│  • Avoid bugs: Wrong annotation = silent failures in production               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How Annotations Work?                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Metadata: Annotations are just metadata read at runtime                    │
│  • Reflection: Spring scans classes and reads annotations                     │
│  • Proxies: Many annotations create proxies (@Transactional, @Cacheable)      │
│  • Callbacks: JPA annotations trigger lifecycle methods                       │
│  • Compile-time: Lombok annotations generate code at compile time             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Each Annotation Category?                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • JPA Lifecycle: Auto timestamps, UUID generation, soft deletes              │
│  • Validation: Every DTO that accepts user input                              │
│  • Transaction: Service methods that modify data                              │
│  • Security: Protecting endpoints and methods                                 │
│  • Caching: Expensive operations that return same results                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Annotations are Most Critical?                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     @Entity, @RestController, @Service, @Autowired, @Transactional │
│  IMPORTANT:     @Valid, @PrePersist, @Cacheable, @Async, @PreAuthorize        │
│  ADVANCED:      @EntityListeners, @Formula, @ConditionalOnProperty            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Table of Contents

1. [JPA Entity Lifecycle Annotations](#jpa-entity-lifecycle-annotations)
2. [JPA Mapping Annotations](#jpa-mapping-annotations)
3. [Spring Data Auditing](#spring-data-auditing)
4. [Validation Annotations](#validation-annotations)
5. [Spring Core Annotations](#spring-core-annotations)
6. [Web & REST Annotations](#web--rest-annotations)
7. [Security Annotations](#security-annotations)
8. [Caching Annotations](#caching-annotations)
9. [Async & Scheduling Annotations](#async--scheduling-annotations)
10. [Transaction Annotations](#transaction-annotations)
11. [Testing Annotations](#testing-annotations)
12. [Lombok Annotations](#lombok-annotations)
13. [Conditional Annotations](#conditional-annotations)
14. [Hibernate-Specific Annotations](#hibernate-specific-annotations)
15. [Interview Questions](#interview-questions)

---

## JPA Entity Lifecycle Annotations

### Lifecycle Callback Methods

```
┌─────────────────────────────────────────────────────────────────┐
│                JPA ENTITY LIFECYCLE CALLBACKS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NEW ENTITY                                                      │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────┐                                                │
│  │ @PrePersist │ ──► Before INSERT                              │
│  └─────────────┘                                                │
│      │                                                           │
│      ▼ (em.persist())                                           │
│  ┌──────────────┐                                               │
│  │ @PostPersist │ ──► After INSERT (ID available)               │
│  └──────────────┘                                               │
│                                                                  │
│  MANAGED ENTITY                                                  │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────┐                                                │
│  │ @PreUpdate  │ ──► Before UPDATE                              │
│  └─────────────┘                                                │
│      │                                                           │
│      ▼ (dirty checking)                                         │
│  ┌──────────────┐                                               │
│  │ @PostUpdate  │ ──► After UPDATE                              │
│  └──────────────┘                                               │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ @PreRemove  │ ──► Before DELETE                              │
│  └─────────────┘                                                │
│      │                                                           │
│      ▼ (em.remove())                                            │
│  ┌──────────────┐                                               │
│  │ @PostRemove  │ ──► After DELETE                              │
│  └──────────────┘                                               │
│                                                                  │
│  LOADING ENTITY                                                  │
│  ┌───────────┐                                                  │
│  │ @PostLoad │ ──► After SELECT (entity loaded from DB)         │
│  └───────────┘                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Complete Entity Lifecycle Example

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Transient  // Not persisted to database
    private String fullNameCache;

    // ═══════════════════════════════════════════════════════════
    // LIFECYCLE CALLBACKS
    // ═══════════════════════════════════════════════════════════

    /**
     * @PrePersist - Called BEFORE entity is inserted
     *
     * USE CASES:
     * - Set creation timestamp
     * - Generate UUID
     * - Set default values
     * - Encrypt sensitive data
     * - Validate business rules before save
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        // Example: Hash password before saving
        if (this.password != null && !this.password.startsWith("$2a$")) {
            this.password = BCrypt.hashpw(this.password, BCrypt.gensalt());
        }
    }

    /**
     * @PostPersist - Called AFTER entity is inserted
     *
     * USE CASES:
     * - Send notification (email, event)
     * - Audit logging
     * - Update related entities
     * - Trigger async processes
     *
     * NOTE: ID is now available!
     */
    @PostPersist
    protected void afterCreate() {
        System.out.println("User created with ID: " + this.id);
        // Could trigger: eventPublisher.publish(new UserCreatedEvent(this));
    }

    /**
     * @PreUpdate - Called BEFORE entity is updated
     *
     * USE CASES:
     * - Update modification timestamp
     * - Validate changes
     * - Re-encrypt modified fields
     * - Track what changed (for audit)
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * @PostUpdate - Called AFTER entity is updated
     *
     * USE CASES:
     * - Send change notifications
     * - Invalidate caches
     * - Audit logging
     */
    @PostUpdate
    protected void afterUpdate() {
        System.out.println("User " + this.id + " updated at " + this.updatedAt);
    }

    /**
     * @PreRemove - Called BEFORE entity is deleted
     *
     * USE CASES:
     * - Validate deletion is allowed
     * - Clean up related resources (files, etc.)
     * - Soft delete instead of hard delete
     * - Create backup/archive
     */
    @PreRemove
    protected void onDelete() {
        System.out.println("About to delete user: " + this.id);
        // Could throw exception to prevent deletion
        // throw new IllegalStateException("Cannot delete active user");
    }

    /**
     * @PostRemove - Called AFTER entity is deleted
     *
     * USE CASES:
     * - Send deletion notification
     * - Clean up external resources
     * - Audit logging
     */
    @PostRemove
    protected void afterDelete() {
        System.out.println("User " + this.id + " has been deleted");
    }

    /**
     * @PostLoad - Called AFTER entity is loaded from database
     *
     * USE CASES:
     * - Decrypt sensitive data
     * - Calculate transient fields
     * - Initialize lazy-loaded state
     * - Transform stored data format
     */
    @PostLoad
    protected void onLoad() {
        // Calculate transient field after loading
        this.fullNameCache = calculateFullName();

        // Could decrypt fields here
        // this.ssn = decrypt(this.encryptedSsn);
    }

    private String calculateFullName() {
        return "User: " + this.email;
    }
}
```

### Using @EntityListeners (Recommended Approach)

```java
/**
 * @EntityListeners - Externalize lifecycle logic
 *
 * WHY USE THIS:
 * - Separation of concerns
 * - Reusable across entities
 * - Cleaner entity classes
 * - Better testability
 */
@Entity
@EntityListeners({AuditingEntityListener.class, CustomEntityListener.class})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal amount;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

// Custom Listener
public class CustomEntityListener {

    @PrePersist
    public void prePersist(Object entity) {
        System.out.println("About to persist: " + entity.getClass().getSimpleName());
    }

    @PostPersist
    public void postPersist(Object entity) {
        // Publish event
        if (entity instanceof Order order) {
            // applicationEventPublisher.publishEvent(new OrderCreatedEvent(order));
        }
    }

    @PreUpdate
    public void preUpdate(Object entity) {
        System.out.println("About to update: " + entity.getClass().getSimpleName());
    }
}
```

---

## JPA Mapping Annotations

### Entity & Table Annotations

```java
/**
 * @Entity - Marks class as JPA entity
 * @Table - Customizes table mapping
 */
@Entity(name = "UserEntity")  // Entity name for JPQL queries
@Table(
    name = "users",           // Table name
    schema = "public",        // Schema name
    catalog = "mydb",         // Catalog name
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"email"}),
        @UniqueConstraint(columnNames = {"username", "tenant_id"})
    },
    indexes = {
        @Index(name = "idx_email", columnList = "email"),
        @Index(name = "idx_status_created", columnList = "status, created_at DESC")
    }
)
public class User {
    // ...
}
```

### Primary Key Annotations

```java
@Entity
public class Order {

    /**
     * @Id - Marks primary key
     * @GeneratedValue - ID generation strategy
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // Auto-increment
    private Long id;

    // --- OR ---

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
    @SequenceGenerator(
        name = "order_seq",
        sequenceName = "order_sequence",
        allocationSize = 50  // Performance: pre-allocate 50 IDs
    )
    private Long id;

    // --- OR ---

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)  // Java 21+
    private UUID id;

    // --- OR for Composite Keys ---

    @EmbeddedId
    private OrderItemId id;
}

/**
 * @Embeddable - Composite primary key
 */
@Embeddable
public class OrderItemId implements Serializable {

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "product_id")
    private Long productId;

    // equals() and hashCode() REQUIRED!
}
```

### Column Annotations

```java
@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @Column - Customize column mapping
     */
    @Column(
        name = "product_name",      // Column name
        nullable = false,           // NOT NULL
        unique = true,              // UNIQUE constraint
        length = 255,               // VARCHAR length
        columnDefinition = "TEXT",  // Raw SQL type
        insertable = true,          // Include in INSERT
        updatable = true            // Include in UPDATE
    )
    private String name;

    /**
     * @Basic - Basic type mapping (optional for simple types)
     */
    @Basic(fetch = FetchType.LAZY, optional = false)
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * @Lob - Large Object (BLOB/CLOB)
     */
    @Lob
    @Column(name = "image_data")
    private byte[] image;

    /**
     * @Enumerated - Enum mapping
     */
    @Enumerated(EnumType.STRING)  // Store as "ACTIVE", not 0
    @Column(name = "status", length = 20)
    private ProductStatus status;

    /**
     * @Temporal - Date/Time mapping (pre-Java 8)
     * NOTE: Not needed for LocalDate, LocalDateTime, Instant
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date legacyDate;

    /**
     * @Transient - NOT persisted to database
     */
    @Transient
    private BigDecimal calculatedDiscount;

    /**
     * @Formula - Hibernate: calculated column from SQL
     */
    @Formula("(SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = id)")
    private Integer orderCount;

    /**
     * @Generated - Value generated by database
     */
    @Generated(GenerationTime.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

### Relationship Annotations

```java
@Entity
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne - Many orders belong to one user
     *
     * FETCH TYPES:
     * - EAGER: Load immediately (default for @ManyToOne)
     * - LAZY: Load when accessed
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_order_user")
    )
    private User user;

    /**
     * @OneToMany - One order has many items
     *
     * CASCADE TYPES:
     * - PERSIST: Save children when parent saved
     * - MERGE: Update children when parent updated
     * - REMOVE: Delete children when parent deleted
     * - REFRESH: Refresh children when parent refreshed
     * - DETACH: Detach children when parent detached
     * - ALL: All of above
     *
     * ORPHAN REMOVAL: Delete children removed from collection
     */
    @OneToMany(
        mappedBy = "order",           // Field in OrderItem that owns relationship
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY        // Default for collections
    )
    @OrderBy("createdAt DESC")        // Default ordering
    private List<OrderItem> items = new ArrayList<>();

    /**
     * @OneToOne - One order has one payment
     */
    @OneToOne(
        mappedBy = "order",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private Payment payment;

    // Helper methods for bidirectional relationship
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}

@Entity
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /**
     * @ManyToMany - Many-to-many relationship
     */
    @ManyToMany
    @JoinTable(
        name = "product_categories",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories = new HashSet<>();
}

@Entity
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @OneToOne - Owning side with foreign key
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", unique = true)
    private Order order;
}
```

### Embedded Objects

```java
/**
 * @Embeddable - Component that can be embedded in entities
 */
@Embeddable
public class Address {

    @Column(name = "street", length = 200)
    private String street;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    @Column(name = "country", length = 50)
    private String country;
}

@Entity
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    /**
     * @Embedded - Embed the Address component
     */
    @Embedded
    private Address billingAddress;

    /**
     * @AttributeOverrides - Customize embedded column names
     * (Required when embedding same type multiple times)
     */
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "street",
            column = @Column(name = "shipping_street")),
        @AttributeOverride(name = "city",
            column = @Column(name = "shipping_city")),
        @AttributeOverride(name = "zipCode",
            column = @Column(name = "shipping_zip")),
        @AttributeOverride(name = "country",
            column = @Column(name = "shipping_country"))
    })
    private Address shippingAddress;

    /**
     * @ElementCollection - Collection of embeddables or basic types
     */
    @ElementCollection
    @CollectionTable(
        name = "customer_phone_numbers",
        joinColumns = @JoinColumn(name = "customer_id")
    )
    @Column(name = "phone_number")
    private Set<String> phoneNumbers = new HashSet<>();
}
```

### Inheritance Annotations

```java
/**
 * @Inheritance - Entity inheritance strategy
 *
 * STRATEGIES:
 * - SINGLE_TABLE: All classes in one table (default, best performance)
 * - JOINED: Each class has own table with foreign keys
 * - TABLE_PER_CLASS: Each concrete class has complete table
 */
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(
    name = "payment_type",
    discriminatorType = DiscriminatorType.STRING
)
public abstract class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal amount;
    private LocalDateTime paymentDate;
}

@Entity
@DiscriminatorValue("CREDIT_CARD")
public class CreditCardPayment extends Payment {

    @Column(name = "card_number")
    private String cardNumber;

    @Column(name = "expiry_date")
    private String expiryDate;
}

@Entity
@DiscriminatorValue("BANK_TRANSFER")
public class BankTransferPayment extends Payment {

    @Column(name = "bank_account")
    private String bankAccount;

    @Column(name = "routing_number")
    private String routingNumber;
}

// JOINED Strategy Example
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Vehicle {
    @Id
    @GeneratedValue
    private Long id;
    private String manufacturer;
}

@Entity
@PrimaryKeyJoinColumn(name = "vehicle_id")
public class Car extends Vehicle {
    private int numberOfDoors;
}
```

---

## Spring Data Auditing

### Setup Auditing

```java
/**
 * @EnableJpaAuditing - Enable Spring Data auditing
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            // Get current user from Security Context
            return Optional.ofNullable(SecurityContextHolder.getContext())
                .map(SecurityContext::getAuthentication)
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getName);
        };
    }
}
```

### Auditing Annotations

```java
/**
 * @MappedSuperclass - Base class for auditing
 * (Not an entity itself, just provides fields to children)
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {

    /**
     * @CreatedDate - Automatically set on entity creation
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * @LastModifiedDate - Automatically updated on entity modification
     */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * @CreatedBy - Who created this entity
     */
    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    /**
     * @LastModifiedBy - Who last modified this entity
     */
    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    /**
     * @Version - Optimistic locking
     * Prevents lost updates in concurrent scenarios
     */
    @Version
    @Column(name = "version")
    private Long version;

    // Getters and setters
}

// Usage
@Entity
@Table(name = "products")
public class Product extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private BigDecimal price;

    // All audit fields inherited!
}
```

---

## Validation Annotations

### Bean Validation (JSR-380)

```java
import jakarta.validation.constraints.*;

@Entity
public class UserRegistration {

    // ═══════════════════════════════════════════════════════════
    // NULL CHECKS
    // ═══════════════════════════════════════════════════════════

    /**
     * @NotNull - Field cannot be null
     */
    @NotNull(message = "ID is required")
    private Long id;

    /**
     * @NotEmpty - Not null AND not empty (for collections, strings)
     */
    @NotEmpty(message = "Roles cannot be empty")
    private List<String> roles;

    /**
     * @NotBlank - Not null AND not empty AND not whitespace only
     * Use for business fields that need actual content
     */
    @NotBlank(message = "Name is required")
    private String name;

    // ═══════════════════════════════════════════════════════════
    // SIZE CONSTRAINTS
    // ═══════════════════════════════════════════════════════════

    /**
     * @Size - String length or collection size
     */
    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    private String username;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    /**
     * @Length - Hibernate validator (same as @Size for strings)
     */
    @Length(min = 2, max = 100)
    private String bio;

    // ═══════════════════════════════════════════════════════════
    // NUMERIC CONSTRAINTS
    // ═══════════════════════════════════════════════════════════

    /**
     * @Min / @Max - Numeric bounds (inclusive)
     */
    @Min(value = 0, message = "Age cannot be negative")
    @Max(value = 150, message = "Age is too high")
    private Integer age;

    /**
     * @Positive - Must be > 0
     * @PositiveOrZero - Must be >= 0
     * @Negative - Must be < 0
     * @NegativeOrZero - Must be <= 0
     */
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @PositiveOrZero(message = "Quantity cannot be negative")
    private Integer quantity;

    /**
     * @Digits - Digit constraints for decimals
     */
    @Digits(integer = 10, fraction = 2, message = "Invalid amount format")
    private BigDecimal amount;

    /**
     * @DecimalMin / @DecimalMax - Decimal bounds
     */
    @DecimalMin(value = "0.01", message = "Minimum price is 0.01")
    @DecimalMax(value = "999999.99", message = "Maximum price exceeded")
    private BigDecimal unitPrice;

    // ═══════════════════════════════════════════════════════════
    // STRING PATTERNS
    // ═══════════════════════════════════════════════════════════

    /**
     * @Email - Valid email format
     */
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    /**
     * @Pattern - Regular expression validation
     */
    @Pattern(
        regexp = "^\\+?[1-9]\\d{1,14}$",
        message = "Invalid phone number format"
    )
    private String phoneNumber;

    @Pattern(
        regexp = "^[A-Z]{2}[0-9]{6}$",
        message = "Invalid passport format"
    )
    private String passportNumber;

    // ═══════════════════════════════════════════════════════════
    // DATE/TIME CONSTRAINTS
    // ═══════════════════════════════════════════════════════════

    /**
     * @Past - Must be in the past
     * @PastOrPresent - Must be in past or now
     */
    @Past(message = "Birth date must be in the past")
    private LocalDate birthDate;

    @PastOrPresent(message = "Registration date cannot be in future")
    private LocalDateTime registrationDate;

    /**
     * @Future - Must be in the future
     * @FutureOrPresent - Must be in future or now
     */
    @Future(message = "Expiry date must be in the future")
    private LocalDate expiryDate;

    @FutureOrPresent(message = "Start date cannot be in the past")
    private LocalDateTime startDate;

    // ═══════════════════════════════════════════════════════════
    // BOOLEAN CONSTRAINTS
    // ═══════════════════════════════════════════════════════════

    /**
     * @AssertTrue - Must be true
     * @AssertFalse - Must be false
     */
    @AssertTrue(message = "You must accept the terms")
    private Boolean termsAccepted;

    @AssertFalse(message = "User must not be blocked")
    private Boolean isBlocked;

    // ═══════════════════════════════════════════════════════════
    // NESTED/CASCADED VALIDATION
    // ═══════════════════════════════════════════════════════════

    /**
     * @Valid - Triggers validation of nested object
     */
    @Valid
    @NotNull(message = "Address is required")
    private Address address;

    @Valid
    @NotEmpty(message = "At least one contact is required")
    private List<Contact> contacts;
}
```

### Custom Validators

```java
/**
 * Custom Validation Annotation
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
@Documented
public @interface ValidPassword {
    String message() default "Password does not meet requirements";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

/**
 * Validator Implementation
 */
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        // Initialize if needed
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return false;
        }

        // At least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
        return password.length() >= 8
            && password.matches(".*[A-Z].*")
            && password.matches(".*[a-z].*")
            && password.matches(".*\\d.*")
            && password.matches(".*[@#$%^&+=!].*");
    }
}

// Usage
public class User {

    @ValidPassword
    private String password;
}
```

### Cross-Field Validation

```java
/**
 * Class-level validation for comparing fields
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordMatchValidator.class)
public @interface PasswordMatch {
    String message() default "Passwords do not match";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    String password();
    String confirmPassword();
}

public class PasswordMatchValidator
    implements ConstraintValidator<PasswordMatch, Object> {

    private String passwordField;
    private String confirmField;

    @Override
    public void initialize(PasswordMatch annotation) {
        this.passwordField = annotation.password();
        this.confirmField = annotation.confirmPassword();
    }

    @Override
    public boolean isValid(Object obj, ConstraintValidatorContext context) {
        try {
            Object password = BeanUtils.getPropertyDescriptor(obj.getClass(), passwordField)
                .getReadMethod().invoke(obj);
            Object confirm = BeanUtils.getPropertyDescriptor(obj.getClass(), confirmField)
                .getReadMethod().invoke(obj);

            return password != null && password.equals(confirm);
        } catch (Exception e) {
            return false;
        }
    }
}

// Usage
@PasswordMatch(password = "password", confirmPassword = "confirmPassword")
public class RegistrationRequest {
    private String password;
    private String confirmPassword;
}
```

### Validation Groups

```java
/**
 * Validation Groups - Different rules for different scenarios
 */
public interface OnCreate {}
public interface OnUpdate {}

public class User {

    @Null(groups = OnCreate.class, message = "ID must be null for new users")
    @NotNull(groups = OnUpdate.class, message = "ID is required for updates")
    private Long id;

    @NotBlank(groups = {OnCreate.class, OnUpdate.class})
    private String name;

    @NotBlank(groups = OnCreate.class, message = "Password required for registration")
    private String password;
}

// Controller usage
@PostMapping
public User create(@Validated(OnCreate.class) @RequestBody User user) {
    return userService.create(user);
}

@PutMapping("/{id}")
public User update(@Validated(OnUpdate.class) @RequestBody User user) {
    return userService.update(user);
}
```

---

## Spring Core Annotations

### Bean Definition

```java
/**
 * @Component - Generic Spring-managed component
 * Scanned automatically by @ComponentScan
 */
@Component
public class EmailHelper {
    // ...
}

/**
 * @Service - Business logic layer
 * Semantically same as @Component, indicates service layer
 */
@Service
public class UserService {
    // ...
}

/**
 * @Repository - Data access layer
 * Also enables exception translation (SQL → DataAccessException)
 */
@Repository
public class UserRepository {
    // ...
}

/**
 * @Controller - Web MVC controller
 * Returns view names
 */
@Controller
public class HomeController {
    // ...
}

/**
 * @RestController - REST API controller
 * = @Controller + @ResponseBody
 */
@RestController
public class UserApiController {
    // ...
}

/**
 * @Configuration - Configuration class
 * Contains @Bean methods
 */
@Configuration
public class AppConfig {

    /**
     * @Bean - Method produces a Spring bean
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * @Bean with dependencies (injected via method parameters)
     */
    @Bean
    public UserService userService(UserRepository userRepository) {
        return new UserService(userRepository);
    }
}
```

### Dependency Injection

```java
@Service
public class OrderService {

    // ═══════════════════════════════════════════════════════════
    // CONSTRUCTOR INJECTION (RECOMMENDED)
    // ═══════════════════════════════════════════════════════════

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    /**
     * @Autowired - Not required on single constructor (Spring 4.3+)
     */
    public OrderService(UserRepository userRepository,
                        OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    // ═══════════════════════════════════════════════════════════
    // FIELD INJECTION (NOT RECOMMENDED for production code)
    // ═══════════════════════════════════════════════════════════

    @Autowired
    private EmailService emailService;  // Hard to test!

    // ═══════════════════════════════════════════════════════════
    // SETTER INJECTION
    // ═══════════════════════════════════════════════════════════

    private NotificationService notificationService;

    @Autowired
    public void setNotificationService(NotificationService service) {
        this.notificationService = service;
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFIER & PRIMARY
    // ═══════════════════════════════════════════════════════════

    /**
     * @Qualifier - Select specific bean by name
     */
    @Autowired
    @Qualifier("emailNotificationService")
    private NotificationService emailNotification;

    /**
     * @Primary - Used on bean definition to make it the default
     */
    // In configuration:
    // @Bean
    // @Primary
    // public NotificationService defaultNotification() { ... }
}
```

### Bean Scope

```java
/**
 * @Scope - Bean lifecycle scope
 */

@Component
@Scope("singleton")  // Default - one instance per context
public class SingletonBean {}

@Component
@Scope("prototype")  // New instance every time requested
public class PrototypeBean {}

@Component
@Scope("request")    // One per HTTP request (web only)
@RequestScope        // Shorthand annotation
public class RequestScopedBean {}

@Component
@Scope("session")    // One per HTTP session (web only)
@SessionScope        // Shorthand annotation
public class SessionScopedBean {}

@Component
@Scope("application")  // One per ServletContext
@ApplicationScope      // Shorthand annotation
public class ApplicationScopedBean {}

/**
 * IMPORTANT: Injecting short-lived beans into long-lived beans
 * Use proxy mode!
 */
@Component
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestScopedWithProxy {
    // Can now be injected into singleton beans safely
}
```

### Lifecycle Annotations

```java
@Component
public class DatabaseInitializer {

    /**
     * @PostConstruct - Called after dependency injection
     * Use for initialization logic
     */
    @PostConstruct
    public void init() {
        System.out.println("Bean initialized, dependencies injected");
        // Initialize resources, validate configuration, etc.
    }

    /**
     * @PreDestroy - Called before bean destruction
     * Use for cleanup logic
     */
    @PreDestroy
    public void cleanup() {
        System.out.println("Bean being destroyed");
        // Close connections, release resources, etc.
    }
}
```

### Property Injection

```java
@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private String host;
    private int port;
    private String username;
    private String password;

    // Getters and setters required for @ConfigurationProperties
}

@Service
public class EmailService {

    /**
     * @Value - Inject property values
     */
    @Value("${app.name}")
    private String appName;

    @Value("${app.mail.host:localhost}")  // With default value
    private String mailHost;

    @Value("${app.feature.enabled:false}")
    private boolean featureEnabled;

    @Value("#{${app.servers}}")  // SpEL for lists: app.servers=server1,server2
    private List<String> servers;

    @Value("#{systemProperties['user.home']}")  // System property
    private String userHome;

    @Value("#{environment['PATH']}")  // Environment variable
    private String path;
}
```

### Profile & Conditional

```java
/**
 * @Profile - Bean only active in specified profile
 */
@Configuration
@Profile("dev")
public class DevConfig {

    @Bean
    public DataSource dataSource() {
        // H2 in-memory database for development
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }
}

@Configuration
@Profile("prod")
public class ProdConfig {

    @Bean
    public DataSource dataSource() {
        // PostgreSQL for production
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://prod-db:5432/myapp");
        return ds;
    }
}

@Configuration
@Profile("!test")  // Active in all profiles EXCEPT test
public class NotTestConfig {}

@Configuration
@Profile({"dev", "staging"})  // Active in dev OR staging
public class NonProdConfig {}
```

---

## Web & REST Annotations

### Request Mapping

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    /**
     * @GetMapping - HTTP GET
     */
    @GetMapping
    public List<User> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public User findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    /**
     * @PostMapping - HTTP POST
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    /**
     * @PutMapping - HTTP PUT (full update)
     */
    @PutMapping("/{id}")
    public User update(@PathVariable Long id,
                       @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    /**
     * @PatchMapping - HTTP PATCH (partial update)
     */
    @PatchMapping("/{id}")
    public User partialUpdate(@PathVariable Long id,
                              @RequestBody Map<String, Object> updates) {
        return userService.partialUpdate(id, updates);
    }

    /**
     * @DeleteMapping - HTTP DELETE
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }

    // ═══════════════════════════════════════════════════════════
    // PARAMETER ANNOTATIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @PathVariable - Extract from URL path
     */
    @GetMapping("/{userId}/orders/{orderId}")
    public Order getOrder(
            @PathVariable Long userId,
            @PathVariable("orderId") Long orderId) {  // Custom name
        return orderService.findByUserAndId(userId, orderId);
    }

    /**
     * @RequestParam - Extract from query string
     */
    @GetMapping("/search")
    public Page<User> search(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id") String sortField) {
        return userService.search(name, PageRequest.of(page, size, Sort.by(sortField)));
    }

    /**
     * @RequestHeader - Extract from HTTP header
     */
    @GetMapping("/me")
    public User getCurrentUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId) {
        return userService.getCurrentUser(authHeader);
    }

    /**
     * @CookieValue - Extract from cookie
     */
    @GetMapping("/preferences")
    public Preferences getPreferences(
            @CookieValue(value = "session-id", required = false) String sessionId) {
        return preferencesService.getBySession(sessionId);
    }

    /**
     * @RequestBody - Deserialize JSON body
     */
    @PostMapping("/bulk")
    public List<User> createBulk(@Valid @RequestBody List<CreateUserRequest> requests) {
        return userService.createAll(requests);
    }

    /**
     * @ModelAttribute - Form data binding (for MVC)
     */
    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public User createFromForm(@ModelAttribute CreateUserRequest request) {
        return userService.create(request);
    }
}
```

### Exception Handling

```java
/**
 * @ControllerAdvice - Global exception handler
 * @RestControllerAdvice = @ControllerAdvice + @ResponseBody
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * @ExceptionHandler - Handle specific exception
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage,
                (a, b) -> a  // Handle duplicates
            ));

        return new ErrorResponse("VALIDATION_FAILED", "Validation failed", errors);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }
}
```

### Response Annotations

```java
@RestController
public class FileController {

    /**
     * @ResponseBody - Return value is response body (default in @RestController)
     */
    @GetMapping("/data")
    @ResponseBody  // Redundant in @RestController
    public Data getData() {
        return new Data();
    }

    /**
     * @ResponseStatus - Set HTTP status code
     */
    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)  // 201
    public Item createItem(@RequestBody Item item) {
        return itemService.create(item);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)  // 204
    public void deleteItem(@PathVariable Long id) {
        itemService.delete(id);
    }
}
```

---

## Security Annotations

### Method Security

```java
/**
 * Enable method security in config
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {}

@Service
public class UserService {

    /**
     * @PreAuthorize - Check before method execution
     * SpEL expressions supported
     */
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long userId) {
        // Only admins can delete
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<User> getAllUsers() {
        // Admin or Manager
    }

    @PreAuthorize("hasAuthority('user:read')")
    public User getUser(Long id) {
        // Has specific authority
    }

    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public User getUserProfile(Long userId) {
        // Own profile or admin
    }

    @PreAuthorize("@securityService.canAccessUser(#userId)")
    public User getSecuredUser(Long userId) {
        // Custom security check via bean method
    }

    /**
     * @PostAuthorize - Check after method execution
     * Can use 'returnObject'
     */
    @PostAuthorize("returnObject.owner == authentication.name or hasRole('ADMIN')")
    public Document getDocument(Long id) {
        return documentRepository.findById(id).orElseThrow();
    }

    /**
     * @PreFilter - Filter collection parameter before execution
     */
    @PreFilter("filterObject.owner == authentication.name")
    public void deleteDocuments(List<Document> documents) {
        // Only deletes documents owned by current user
    }

    /**
     * @PostFilter - Filter collection result after execution
     */
    @PostFilter("filterObject.isPublic or filterObject.owner == authentication.name")
    public List<Document> getDocuments() {
        return documentRepository.findAll();
    }

    /**
     * @Secured - Simpler role check (no SpEL)
     */
    @Secured("ROLE_ADMIN")
    public void adminOnly() {}

    @Secured({"ROLE_ADMIN", "ROLE_MANAGER"})
    public void adminOrManager() {}

    /**
     * @RolesAllowed - JSR-250 standard
     */
    @RolesAllowed("ADMIN")
    public void jsr250AdminOnly() {}
}
```

---

## Caching Annotations

### Setup Caching

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(10)));
        return manager;
    }
}
```

### Cache Annotations

```java
@Service
public class ProductService {

    /**
     * @Cacheable - Cache method result
     * Next call with same params returns cached value
     */
    @Cacheable(value = "products", key = "#id")
    public Product findById(Long id) {
        // Only called if not in cache
        return productRepository.findById(id).orElseThrow();
    }

    @Cacheable(
        value = "products",
        key = "#root.methodName + '_' + #name",
        condition = "#name.length() > 3",  // Only cache if condition true
        unless = "#result == null"          // Don't cache null results
    )
    public Product findByName(String name) {
        return productRepository.findByName(name);
    }

    /**
     * @CachePut - Always execute and update cache
     */
    @CachePut(value = "products", key = "#product.id")
    public Product update(Product product) {
        // Always executed, result cached
        return productRepository.save(product);
    }

    /**
     * @CacheEvict - Remove from cache
     */
    @CacheEvict(value = "products", key = "#id")
    public void delete(Long id) {
        productRepository.deleteById(id);
    }

    @CacheEvict(value = "products", allEntries = true)
    public void clearCache() {
        // Clears entire cache
    }

    @CacheEvict(value = "products", allEntries = true, beforeInvocation = true)
    public void refreshAll() {
        // Clears cache before method executes (even if exception thrown)
    }

    /**
     * @Caching - Multiple cache operations
     */
    @Caching(
        put = { @CachePut(value = "products", key = "#product.id") },
        evict = {
            @CacheEvict(value = "productList", allEntries = true),
            @CacheEvict(value = "productCount", allEntries = true)
        }
    )
    public Product save(Product product) {
        return productRepository.save(product);
    }
}
```

---

## Async & Scheduling Annotations

### Async Configuration

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            log.error("Async error in {}: {}", method.getName(), ex.getMessage());
        };
    }
}
```

### Async Annotations

```java
@Service
public class NotificationService {

    /**
     * @Async - Execute method asynchronously
     * Method must be public and called from another bean!
     */
    @Async
    public void sendEmailAsync(String to, String subject, String body) {
        // Runs in separate thread
        emailSender.send(to, subject, body);
    }

    /**
     * @Async with Future return type
     */
    @Async
    public CompletableFuture<Boolean> sendSmsAsync(String phone, String message) {
        boolean result = smsSender.send(phone, message);
        return CompletableFuture.completedFuture(result);
    }

    /**
     * @Async with specific executor
     */
    @Async("taskExecutor")
    public void heavyTask() {
        // Uses named executor bean
    }
}
```

### Scheduling Annotations

```java
@Configuration
@EnableScheduling
public class SchedulingConfig {}

@Component
@Slf4j
public class ScheduledTasks {

    /**
     * @Scheduled - Execute periodically
     *
     * fixedRate: Run every N ms (may overlap)
     * fixedDelay: Wait N ms after completion before next run
     * initialDelay: Wait before first execution
     */
    @Scheduled(fixedRate = 60000)  // Every 60 seconds
    public void checkHealthEveryMinute() {
        log.info("Health check at {}", LocalDateTime.now());
    }

    @Scheduled(fixedDelay = 30000, initialDelay = 10000)
    public void cleanupWithDelay() {
        // First run 10s after startup, then 30s after each completion
    }

    /**
     * Cron expressions (second minute hour day month weekday)
     */
    @Scheduled(cron = "0 0 2 * * *")  // 2 AM daily
    public void nightlyCleanup() {
        log.info("Running nightly cleanup");
    }

    @Scheduled(cron = "0 */15 * * * *")  // Every 15 minutes
    public void quarterHourTask() {}

    @Scheduled(cron = "0 0 9 * * MON-FRI")  // 9 AM weekdays
    public void weekdayMorningReport() {}

    @Scheduled(cron = "0 0 0 1 * *")  // First day of each month
    public void monthlyReport() {}

    /**
     * Externalized cron
     */
    @Scheduled(cron = "${app.cleanup.cron:0 0 3 * * *}")
    public void configurableTask() {}

    /**
     * @Schedules - Multiple schedules
     */
    @Schedules({
        @Scheduled(cron = "0 0 9 * * MON-FRI"),
        @Scheduled(cron = "0 0 18 * * MON-FRI")
    })
    public void twiceDaily() {}
}
```

---

## Transaction Annotations

### ACID Properties - Database Transaction Fundamentals

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ACID PROPERTIES EXPLAINED                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ACID = The four guarantees every database transaction should provide           │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ A = ATOMICITY ("All or Nothing")                                        │    │
│  │ ───────────────────────────────────────────────────────────────────────│    │
│  │ WHAT: Transaction either FULLY completes or FULLY fails               │    │
│  │                                                                         │    │
│  │ Bank Transfer Example:                                                  │    │
│  │   1. Debit $100 from Account A  ─┐                                     │    │
│  │   2. Credit $100 to Account B   ─┤ BOTH must succeed, or NEITHER      │    │
│  │                                                                         │    │
│  │ WITHOUT ATOMICITY: Crash after step 1 = money disappears!             │    │
│  │ WITH ATOMICITY: Crash after step 1 = both steps rolled back           │    │
│  │                                                                         │    │
│  │ IN SPRING: @Transactional ensures atomicity via rollback              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ C = CONSISTENCY ("Valid State to Valid State")                          │    │
│  │ ───────────────────────────────────────────────────────────────────────│    │
│  │ WHAT: Transaction moves database from one valid state to another      │    │
│  │                                                                         │    │
│  │ Example Constraints:                                                    │    │
│  │   • Account balance cannot be negative                                 │    │
│  │   • Foreign key must reference existing row                            │    │
│  │   • Total debits must equal total credits                              │    │
│  │                                                                         │    │
│  │ WITHOUT CONSISTENCY: Order references non-existent product            │    │
│  │ WITH CONSISTENCY: Constraint violation = transaction rejected         │    │
│  │                                                                         │    │
│  │ IN SPRING: JPA validations + DB constraints enforce consistency       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ I = ISOLATION ("Transactions Don't Interfere")                          │    │
│  │ ───────────────────────────────────────────────────────────────────────│    │
│  │ WHAT: Concurrent transactions appear to run sequentially              │    │
│  │                                                                         │    │
│  │ Problem Without Isolation:                                              │    │
│  │   TX1: Read balance ($100)                                             │    │
│  │   TX2: Read balance ($100), Withdraw $50, Commit ($50)                │    │
│  │   TX1: Withdraw $80, Commit → NEGATIVE BALANCE (-$30)!                │    │
│  │                                                                         │    │
│  │ ISOLATION LEVELS:                                                       │    │
│  │   READ_UNCOMMITTED → Dirty reads possible (see uncommitted changes)   │    │
│  │   READ_COMMITTED   → No dirty reads (default for most DBs)            │    │
│  │   REPEATABLE_READ  → Same read = same result within transaction       │    │
│  │   SERIALIZABLE     → Full isolation (as if transactions run serially) │    │
│  │                                                                         │    │
│  │ IN SPRING: @Transactional(isolation = Isolation.REPEATABLE_READ)      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ D = DURABILITY ("Committed = Permanent")                                │    │
│  │ ───────────────────────────────────────────────────────────────────────│    │
│  │ WHAT: Once committed, data survives system crashes/restarts           │    │
│  │                                                                         │    │
│  │ Example:                                                                │    │
│  │   • User completes purchase → commit → server crashes                 │    │
│  │   • After restart, purchase is STILL in database                      │    │
│  │                                                                         │    │
│  │ HOW DATABASES ACHIEVE DURABILITY:                                       │    │
│  │   • Write-ahead logging (WAL)                                          │    │
│  │   • Flushing to disk before confirming commit                          │    │
│  │   • Replication for fault tolerance                                    │    │
│  │                                                                         │    │
│  │ IN SPRING: Handled by database engine automatically                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  INTERVIEW TIP: "ACID ensures database transactions are reliable even with     │
│  concurrent access and system failures"                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Transaction Configuration

```java
@Service
@Transactional  // Class-level: all public methods are transactional
public class OrderService {

    /**
     * @Transactional - Method-level overrides class-level
     *
     * PROPAGATION:
     * - REQUIRED (default): Join existing or create new
     * - REQUIRES_NEW: Always create new (suspend current)
     * - SUPPORTS: Use existing or run non-transactional
     * - NOT_SUPPORTED: Suspend existing, run non-transactional
     * - MANDATORY: Must have existing transaction
     * - NEVER: Must NOT have existing transaction
     * - NESTED: Nested transaction (savepoint)
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String action) {
        // New transaction - commits even if calling tx rolls back
        auditRepository.save(new AuditLog(action));
    }

    /**
     * ISOLATION LEVELS:
     * - DEFAULT: Database default
     * - READ_UNCOMMITTED: Dirty reads possible
     * - READ_COMMITTED: No dirty reads
     * - REPEATABLE_READ: Consistent reads within transaction
     * - SERIALIZABLE: Full isolation (slowest)
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
        // Highest isolation for financial operations
    }

    /**
     * ROLLBACK RULES:
     * - rollbackFor: Rollback on these exceptions
     * - noRollbackFor: Don't rollback on these exceptions
     *
     * Default: Rollback on RuntimeException & Error
     *          NO rollback on checked exceptions
     */
    @Transactional(
        rollbackFor = {BusinessException.class, IOException.class},
        noRollbackFor = NonCriticalException.class
    )
    public void riskyOperation() throws IOException {
        // Rolls back on BusinessException or IOException
        // Does NOT rollback on NonCriticalException
    }

    /**
     * READ-ONLY:
     * Optimization hint - can skip dirty checking
     */
    @Transactional(readOnly = true)
    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    /**
     * TIMEOUT:
     * Transaction timeout in seconds
     */
    @Transactional(timeout = 30)
    public void longRunningOperation() {
        // Fails if takes longer than 30 seconds
    }
}
```

---

## Testing Annotations

### Spring Boot Test

```java
/**
 * @SpringBootTest - Full application context test
 */
@SpringBootTest
class ApplicationTests {
    @Test
    void contextLoads() {}
}

/**
 * @WebMvcTest - Test only web layer
 */
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean  // Mock service layer
    private UserService userService;

    @Test
    void shouldReturnUser() throws Exception {
        given(userService.findById(1L)).willReturn(new User(1L, "John"));

        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"));
    }
}

/**
 * @DataJpaTest - Test only JPA layer
 */
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindByEmail() {
        User user = new User("john@email.com", "John");
        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByEmail("john@email.com");

        assertThat(found).isPresent();
    }
}

/**
 * @MockBean vs @SpyBean
 */
@SpringBootTest
class ServiceTest {

    @MockBean  // Full mock - all methods return defaults
    private ExternalService externalService;

    @SpyBean  // Partial mock - real methods unless stubbed
    private UserService userService;
}
```

### JUnit 5 Annotations

```java
class UserServiceTest {

    @BeforeAll
    static void setupClass() {
        // Run once before all tests
    }

    @AfterAll
    static void teardownClass() {
        // Run once after all tests
    }

    @BeforeEach
    void setup() {
        // Run before each test
    }

    @AfterEach
    void cleanup() {
        // Run after each test
    }

    @Test
    void shouldDoSomething() {}

    @Test
    @DisplayName("Should create user when valid data provided")
    void createUserTest() {}

    @Test
    @Disabled("Fix in next sprint")
    void brokenTest() {}

    @RepeatedTest(5)
    void shouldBeConsistent() {}

    @ParameterizedTest
    @ValueSource(strings = {"john@email.com", "jane@email.com"})
    void shouldAcceptValidEmails(String email) {}

    @ParameterizedTest
    @CsvSource({"1, John", "2, Jane"})
    void shouldHandleMultipleParams(Long id, String name) {}

    @Nested
    @DisplayName("When user exists")
    class WhenUserExists {

        @Test
        void shouldReturnUser() {}

        @Test
        void shouldUpdateUser() {}
    }
}
```

### Mockito Annotations

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock  // Create mock
    private UserRepository userRepository;

    @Spy  // Partial mock
    private EmailService emailService;

    @InjectMocks  // Inject mocks into this
    private UserService userService;

    @Captor  // Capture arguments
    private ArgumentCaptor<User> userCaptor;

    @Test
    void shouldSaveUser() {
        User user = new User("test@email.com");
        when(userRepository.save(any(User.class))).thenReturn(user);

        userService.create(user);

        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("test@email.com");
    }
}
```

---

## Lombok Annotations

```java
/**
 * @Data = @Getter + @Setter + @ToString + @EqualsAndHashCode + @RequiredArgsConstructor
 */
@Data
public class UserDto {
    private Long id;
    private String name;
}

/**
 * For immutable objects (DTOs, Value Objects)
 */
@Value  // Immutable @Data
public class CreateUserRequest {
    String name;
    String email;
}

/**
 * @Builder - Fluent builder pattern
 */
@Builder
@AllArgsConstructor
public class Order {
    private Long id;

    @Builder.Default  // Default value in builder
    private OrderStatus status = OrderStatus.PENDING;

    @Singular  // For collections: addItem(), items()
    private List<OrderItem> items;
}

// Usage
Order order = Order.builder()
    .id(1L)
    .item(item1)
    .item(item2)
    .build();

/**
 * Constructor annotations
 */
@NoArgsConstructor           // No-arg constructor
@AllArgsConstructor          // All-arg constructor
@RequiredArgsConstructor     // Constructor for final fields
public class User {
    private final Long id;   // Included in @RequiredArgsConstructor
    private String name;     // Not included
}

/**
 * @Slf4j - Logger injection
 */
@Slf4j
public class UserService {

    public void process() {
        log.info("Processing...");
        log.debug("Debug: {}", data);
        log.error("Error occurred", exception);
    }
}

/**
 * @Accessors - Customize getter/setter style
 */
@Data
@Accessors(fluent = true)  // getName() → name()
public class Config {
    private String host;
    private int port;
}
// Usage: config.host("localhost").port(8080);

/**
 * @With - Immutable "setters" that return new instance
 */
@Value
@With
public class Point {
    int x;
    int y;
}
// Usage: Point p2 = p1.withX(10);

/**
 * @SneakyThrows - Throw checked exceptions without declaring
 */
@SneakyThrows
public void readFile() {
    Files.readString(Path.of("file.txt"));  // IOException not declared
}

/**
 * @Cleanup - Auto-close resources
 */
public void processFile() {
    @Cleanup InputStream in = new FileInputStream("file.txt");
    // Automatically closed at end of scope
}

/**
 * Entity with Lombok (careful with @Data!)
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "orders")  // Avoid lazy loading issues
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @EqualsAndHashCode.Include  // Only use ID for equals/hashCode
    private Long id;

    private String name;

    @OneToMany(mappedBy = "user")
    private List<Order> orders;  // Excluded from toString
}
```

---

## Conditional Annotations

```java
@Configuration
public class ConditionalConfig {

    /**
     * @ConditionalOnProperty - Based on property value
     */
    @Bean
    @ConditionalOnProperty(
        name = "app.feature.enabled",
        havingValue = "true",
        matchIfMissing = false  // Don't load if property missing
    )
    public FeatureService featureService() {
        return new FeatureService();
    }

    /**
     * @ConditionalOnMissingBean - Only if bean doesn't exist
     */
    @Bean
    @ConditionalOnMissingBean(DataSource.class)
    public DataSource defaultDataSource() {
        return new EmbeddedDatabaseBuilder().build();
    }

    /**
     * @ConditionalOnBean - Only if bean exists
     */
    @Bean
    @ConditionalOnBean(RedisConnectionFactory.class)
    public CacheManager redisCacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory).build();
    }

    /**
     * @ConditionalOnClass - Only if class is on classpath
     */
    @Bean
    @ConditionalOnClass(name = "org.postgresql.Driver")
    public DataSource postgresDataSource() {
        return new HikariDataSource();
    }

    /**
     * @ConditionalOnMissingClass - Only if class is NOT on classpath
     */
    @Bean
    @ConditionalOnMissingClass("com.oracle.jdbc.Driver")
    public DataSource nonOracleDataSource() {
        return new EmbeddedDatabaseBuilder().build();
    }

    /**
     * @ConditionalOnExpression - SpEL expression
     */
    @Bean
    @ConditionalOnExpression("${app.mode} == 'advanced' and ${app.enabled}")
    public AdvancedFeature advancedFeature() {
        return new AdvancedFeature();
    }

    /**
     * @ConditionalOnWebApplication - Only in web context
     * @ConditionalOnNotWebApplication - Only in non-web context
     */
    @Bean
    @ConditionalOnWebApplication
    public WebFeature webFeature() {
        return new WebFeature();
    }
}
```

---

## Hibernate-Specific Annotations

```java
@Entity
public class Product {

    /**
     * @NaturalId - Business key (unique, immutable)
     * Enables naturalId() queries
     */
    @NaturalId
    @Column(nullable = false, unique = true, updatable = false)
    private String sku;

    /**
     * @Formula - Calculated field using SQL
     * Not stored in database
     */
    @Formula("(SELECT COUNT(*) FROM order_items WHERE product_id = id)")
    private Integer totalOrders;

    @Formula("price * (1 - discount_percent / 100)")
    private BigDecimal effectivePrice;

    /**
     * @Where - Default WHERE clause for entity/collection
     */
    @Where(clause = "deleted = false")  // Soft delete filter
    @OneToMany(mappedBy = "product")
    private List<Review> reviews;

    /**
     * @Filter - Dynamic, parameterized filter
     */
    @FilterDef(name = "statusFilter",
               parameters = @ParamDef(name = "status", type = String.class))
    @Filter(name = "statusFilter", condition = "status = :status")
    @OneToMany(mappedBy = "product")
    private List<OrderItem> orderItems;

    /**
     * @DynamicUpdate - Only include changed columns in UPDATE
     * Reduces SQL size, better for auditing
     */
    @DynamicUpdate
    @DynamicInsert  // Only non-null columns in INSERT
    private String description;

    /**
     * @BatchSize - Batch loading for collections
     * Reduces N+1 queries
     */
    @BatchSize(size = 25)
    @OneToMany(mappedBy = "product")
    private Set<Image> images;

    /**
     * @Fetch - Fetch strategy
     */
    @Fetch(FetchMode.SUBSELECT)  // One subselect for all collections
    @OneToMany(mappedBy = "product")
    private List<Tag> tags;

    /**
     * @Immutable - Entity cannot be updated
     */
    // @Immutable on class level

    /**
     * @CreationTimestamp / @UpdateTimestamp
     * Hibernate-managed timestamps
     */
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * @Type - Custom type mapping (Hibernate 6+)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    /**
     * @ColumnTransformer - Read/write transformations
     */
    @ColumnTransformer(
        read = "pgp_sym_decrypt(ssn, 'password')",
        write = "pgp_sym_encrypt(?, 'password')"
    )
    private String ssn;
}
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SPRING BOOT ANNOTATIONS CHEAT SHEET                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ENTITY LIFECYCLE                                                                 │
│   @PrePersist    - Before INSERT                                                │
│   @PostPersist   - After INSERT (ID available)                                  │
│   @PreUpdate     - Before UPDATE                                                │
│   @PostUpdate    - After UPDATE                                                 │
│   @PreRemove     - Before DELETE                                                │
│   @PostRemove    - After DELETE                                                 │
│   @PostLoad      - After SELECT                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ VALIDATION                                                                       │
│   @NotNull       - Cannot be null                                               │
│   @NotEmpty      - Not null, not empty                                          │
│   @NotBlank      - Not null, not empty, not whitespace                          │
│   @Size          - Length/size constraint                                        │
│   @Min/@Max      - Numeric bounds                                               │
│   @Email         - Valid email format                                           │
│   @Pattern       - Regex match                                                  │
│   @Past/@Future  - Date constraints                                             │
│   @Valid         - Trigger nested validation                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ CACHING                                                                          │
│   @Cacheable     - Cache result                                                 │
│   @CachePut      - Update cache                                                 │
│   @CacheEvict    - Remove from cache                                            │
│   @Caching       - Multiple cache operations                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ASYNC & SCHEDULING                                                               │
│   @Async         - Run asynchronously                                           │
│   @Scheduled     - Run periodically (fixedRate, cron)                           │
│   @EnableAsync   - Enable async processing                                      │
│   @EnableScheduling - Enable scheduling                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TRANSACTION                                                                      │
│   @Transactional(propagation=?)   - REQUIRED, REQUIRES_NEW, etc.               │
│   @Transactional(isolation=?)     - READ_COMMITTED, SERIALIZABLE, etc.         │
│   @Transactional(rollbackFor=?)   - Exceptions to rollback on                  │
│   @Transactional(readOnly=true)   - Optimization for reads                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ SECURITY                                                                         │
│   @PreAuthorize  - Check before execution                                       │
│   @PostAuthorize - Check after execution                                        │
│   @PreFilter     - Filter input collection                                      │
│   @PostFilter    - Filter output collection                                     │
│   @Secured       - Simple role check                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ AUDITING                                                                         │
│   @CreatedDate   - Auto-set creation time                                       │
│   @LastModifiedDate - Auto-set update time                                      │
│   @CreatedBy     - Auto-set creator                                             │
│   @LastModifiedBy - Auto-set modifier                                           │
│   @Version       - Optimistic locking                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions

**Q1: What's the difference between @PrePersist and @CreatedDate?**

```
@PrePersist:
- JPA standard callback
- You write the logic yourself
- More flexible, can do anything
- Works with any JPA provider

@CreatedDate:
- Spring Data specific
- Automatic timestamp setting
- Requires @EnableJpaAuditing
- Cleaner, less boilerplate
```

**Q2: Why doesn't @Transactional work on private methods?**

```
Because Spring uses proxies for @Transactional:
- JDK proxy or CGLIB creates wrapper around your bean
- When you call public method, proxy intercepts
- Private methods cannot be proxied
- Same issue with calls from within the same class (self-invocation)
```

**Q3: @NotNull vs @NotEmpty vs @NotBlank?**

```
@NotNull: value != null
  - null ❌, "" ✅, "  " ✅, "abc" ✅

@NotEmpty: value != null && value.length > 0
  - null ❌, "" ❌, "  " ✅, "abc" ✅

@NotBlank: value != null && value.trim().length > 0
  - null ❌, "" ❌, "  " ❌, "abc" ✅
```

**Q4: When to use @EntityListeners vs inline callbacks?**

```
Inline callbacks (@PrePersist on entity):
- Simple, entity-specific logic
- Keep entity self-contained
- Quick implementation

@EntityListeners:
- Reusable across entities
- Separation of concerns
- Better testability
- Complex audit/event logic
```

---

_This completes the Spring Boot Annotations Reference - bookmark this for quick lookup!_
