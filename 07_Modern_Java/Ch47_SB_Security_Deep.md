**Navigation**: [< Previous Chapter](Ch46_SB_Database_Design.md) | [Back to Index](../00_MASTER_INDEX.md)

---

```java
            .map(targetUser -> 
                targetUser.getOrganizationId().equals(currentUser.getOrganizationId())
            )
            .orElse(false);
    }

    public boolean isManager(Long departmentId, Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        return currentUser.getManagedDepartmentIds().contains(departmentId);
    }

    public boolean isOwner(Long resourceId, String resourceType, Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        
        switch (resourceType) {
            case "document":
                return documentRepository.findById(resourceId)
                    .map(doc -> doc.getOwnerId().equals(currentUser.getId()))
                    .orElse(false);
            case "project":
                return projectRepository.findById(resourceId)
                    .map(proj -> proj.getOwnerId().equals(currentUser.getId()))
                    .orElse(false);
            default:
                return false;
        }
    }
}

// ==================== CUSTOM PERMISSION EVALUATOR ====================

public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(
            Authentication auth, 
            Object targetDomainObject, 
            Object permission) {
        
        if (auth == null || targetDomainObject == null || permission == null) {
            return false;
        }

        String targetType = targetDomainObject.getClass().getSimpleName().toUpperCase();
        return hasPrivilege(auth, targetType, permission.toString().toUpperCase());
    }

    @Override
    public boolean hasPermission(
            Authentication auth, 
            Serializable targetId, 
            String targetType, 
            Object permission) {
        
        if (auth == null || targetType == null || permission == null) {
            return false;
        }

        return hasPrivilege(auth, targetType.toUpperCase(), permission.toString().toUpperCase());
    }

    private boolean hasPrivilege(Authentication auth, String targetType, String permission) {
        String requiredAuthority = targetType + ":" + permission;
        
        return auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(authority -> 
                authority.equals(requiredAuthority) || 
                authority.equals(targetType + ":ADMIN") ||
                authority.equals("ROLE_ADMIN")
            );
    }
}

// Using custom permission evaluator
@Service
public class OrderService {

    @PreAuthorize("hasPermission(#orderId, 'ORDER', 'READ')")
    public Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    @PreAuthorize("hasPermission(#order, 'WRITE')")
    public Order updateOrder(Order order) {
        return orderRepository.save(order);
    }
}
```

---

# SECTION 5: ROW-LEVEL SECURITY

---

## Chapter 5: Filtering Data by User Context

```java
// ==================== HIBERNATE FILTERS FOR ROW-LEVEL SECURITY ====================

/**
 * Filter data automatically based on user's organization
 */
@Entity
@Table(name = "documents")
@FilterDef(
    name = "organizationFilter",
    parameters = @ParamDef(name = "orgId", type = Long.class)
)
@Filter(name = "organizationFilter", condition = "organization_id = :orgId")
@Data
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    @Column(name = "organization_id")
    private Long organizationId;
    
    @Column(name = "owner_id")
    private Long ownerId;
}

// ==================== AUTOMATIC FILTER ACTIVATION ====================

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class TenantFilterAspect {

    private final EntityManager entityManager;

    @Before("execution(* com.example.repository.*Repository.*(..))")
    public void enableTenantFilter() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.getPrincipal() instanceof User) {
            User user = (User) auth.getPrincipal();
            Session session = entityManager.unwrap(Session.class);
            
            Filter filter = session.enableFilter("organizationFilter");
            filter.setParameter("orgId", user.getOrganizationId());
            
            log.debug("Enabled organization filter for org: {}", user.getOrganizationId());
        }
    }
}

// ==================== SPRING DATA JPA SPECIFICATIONS ====================

@Service
@RequiredArgsConstructor
public class SecureDocumentService {

    private final DocumentRepository documentRepository;

    public List<Document> findDocuments(DocumentSearchCriteria criteria) {
        User currentUser = getCurrentUser();
        
        Specification<Document> spec = Specification
            .where(belongsToOrganization(currentUser.getOrganizationId()))
            .and(hasAccessLevel(currentUser));
        
        if (criteria.getTitle() != null) {
            spec = spec.and(titleContains(criteria.getTitle()));
        }
        
        return documentRepository.findAll(spec);
    }

    private Specification<Document> belongsToOrganization(Long orgId) {
        return (root, query, cb) -> 
            cb.equal(root.get("organizationId"), orgId);
    }

    private Specification<Document> hasAccessLevel(User user) {
        return (root, query, cb) -> {
            if (user.hasRole("ADMIN")) {
                return cb.conjunction();  // No restriction
            }
            
            // Regular users can only see public or their own documents
            return cb.or(
                cb.equal(root.get("accessLevel"), AccessLevel.PUBLIC),
                cb.equal(root.get("ownerId"), user.getId())
            );
        };
    }

    private Specification<Document> titleContains(String title) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%");
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}

// ==================== REPOSITORY WITH AUTOMATIC SECURITY ====================

public interface SecureDocumentRepository extends JpaRepository<Document, Long> {

    // Automatically filtered by @Query
    @Query("""
        SELECT d FROM Document d 
        WHERE d.organizationId = :#{authentication.principal.organizationId}
        AND (d.ownerId = :#{authentication.principal.id} 
             OR d.accessLevel = 'PUBLIC'
             OR :#{hasRole('ADMIN')} = true)
    """)
    List<Document> findAccessibleDocuments();

    // Method with owner check
    @Query("""
        SELECT d FROM Document d 
        WHERE d.id = :id 
        AND (d.ownerId = :#{authentication.principal.id} OR :#{hasRole('ADMIN')} = true)
    """)
    Optional<Document> findByIdSecure(@Param("id") Long id);
}
```

---



🔬 **Section Challenge — Chapter 5: Filtering Data by User Context**

**Challenge 1 (Design — Who/When/What):** A multi-tenant SaaS app has `orders` table with `tenant_id`. Users must ONLY see their own tenant's data — even if they craft a URL with another tenant's `orderId`. **Who** enforces tenant isolation? **When** in the request lifecycle? **What** is the Spring Security + JPA pattern?

<details><summary>Answer</summary>

**Who enforces?** Three layers: (1) **Spring Security** — authentication confirms the tenant from the JWT claim. (2) **Repository layer** — every query automatically appends `AND tenant_id = :currentTenant`. (3) **Service layer** — explicit ownership check before returning sensitive objects. **When?** Repository-level enforcement at every DB query — not just at the controller. A crafted URL bypasses the controller check if you only check there. **Pattern:** (1) Store tenant in `SecurityContextHolder` after JWT parse: `tenantId = jwtClaims.get("tenantId")`. (2) Use `@FilterDef` + `@Filter` (Hibernate) OR Spring Data `@Query` with SpEL `?#{principal.tenantId}`: `@Query("SELECT o FROM Order o WHERE o.tenantId = ?#{principal.tenantId}")`. (3) For critical resources, add explicit check in service: `if (!order.getTenantId().equals(currentTenant)) throw new AccessDeniedException("...")`. **Why triple-layer?** Defense in depth — if one layer has a bug, the others catch it.

</details>


# SECTION 6: AUDIT LOGGING

---

## Chapter 6: Tracking Who Did What, When

```java
// ==================== AUDIT CONFIGURATION ====================

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class AuditConfig {

    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated() || 
                auth.getPrincipal().equals("anonymousUser")) {
                return Optional.of("SYSTEM");
            }
            
            if (auth.getPrincipal() instanceof User) {
                return Optional.of(((User) auth.getPrincipal()).getUsername());
            }
            
            return Optional.of(auth.getName());
        };
    }
}

// ==================== AUDIT TRAIL ENTITY ====================

@Entity
@Table(name = "audit_trail", indexes = {
    @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditAction action;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 50)
    private String username;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "old_values", columnDefinition = "TEXT")
    private String oldValues;  // JSON

    @Column(name = "new_values", columnDefinition = "TEXT")
    private String newValues;  // JSON

    @Column(name = "changed_fields", length = 2000)
    private String changedFields;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 500)
    private String description;
}

public enum AuditAction {
    CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, 
    PASSWORD_CHANGE, PERMISSION_CHANGE, EXPORT
}

// ==================== AUDIT SERVICE ====================

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditTrailRepository auditRepository;
    private final ObjectMapper objectMapper;

    @Async
    public void logAction(AuditAction action, String entityType, Long entityId,
                         Object oldValue, Object newValue, String description) {
        try {
            AuditTrail audit = AuditTrail.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .userId(getCurrentUserId())
                .username(getCurrentUsername())
                .ipAddress(getClientIp())
                .userAgent(getUserAgent())
                .oldValues(oldValue != null ? objectMapper.writeValueAsString(oldValue) : null)
                .newValues(newValue != null ? objectMapper.writeValueAsString(newValue) : null)
                .changedFields(calculateChangedFields(oldValue, newValue))
                .timestamp(LocalDateTime.now())
                .description(description)
                .build();

            auditRepository.save(audit);
            
            log.info("Audit log: {} {} {} by {}", 
                action, entityType, entityId, audit.getUsername());

        } catch (Exception e) {
            log.error("Failed to create audit log", e);
        }
    }

    private String calculateChangedFields(Object oldValue, Object newValue) {
        if (oldValue == null || newValue == null) {
            return null;
        }

        try {
            JsonNode oldNode = objectMapper.valueToTree(oldValue);
            JsonNode newNode = objectMapper.valueToTree(newValue);

            List<String> changedFields = new ArrayList<>();
            
            Iterator<String> fieldNames = newNode.fieldNames();
            while (fieldNames.hasNext()) {
                String field = fieldNames.next();
                if (!oldNode.has(field) || !oldNode.get(field).equals(newNode.get(field))) {
                    changedFields.add(field);
                }
            }

            return String.join(",", changedFields);
        } catch (Exception e) {
            return null;
        }
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            return ((User) auth.getPrincipal()).getId();
        }
        return null;
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    private String getClientIp() {
        ServletRequestAttributes attrs = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            String ip = request.getHeader("X-Forwarded-For");
            return ip != null ? ip.split(",")[0].trim() : request.getRemoteAddr();
        }
        return null;
    }

    private String getUserAgent() {
        ServletRequestAttributes attrs = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            return attrs.getRequest().getHeader("User-Agent");
        }
        return null;
    }
}

// ==================== ENTITY LISTENER FOR AUTOMATIC AUDITING ====================

@Component
public class AuditEntityListener {

    private static AuditService auditService;

    @Autowired
    public void setAuditService(AuditService auditService) {
        AuditEntityListener.auditService = auditService;
    }

    @PostPersist
    public void postPersist(Object entity) {
        if (entity instanceof Auditable) {
            Auditable auditable = (Auditable) entity;
            auditService.logAction(
                AuditAction.CREATE,
                entity.getClass().getSimpleName(),
                auditable.getId(),
                null,
                entity,
                "Created " + entity.getClass().getSimpleName()
            );
        }
    }

    @PreUpdate
    public void preUpdate(Object entity) {
        // Store old value for comparison in postUpdate
        // Using entity manager to get original values
    }

    @PostUpdate
    public void postUpdate(Object entity) {
        if (entity instanceof Auditable) {
            Auditable auditable = (Auditable) entity;
            auditService.logAction(
                AuditAction.UPDATE,
                entity.getClass().getSimpleName(),
                auditable.getId(),
                null, // Would need old values from PreUpdate
                entity,
                "Updated " + entity.getClass().getSimpleName()
            );
        }
    }

    @PostRemove
    public void postRemove(Object entity) {
        if (entity instanceof Auditable) {
            Auditable auditable = (Auditable) entity;
            auditService.logAction(
                AuditAction.DELETE,
                entity.getClass().getSimpleName(),
                auditable.getId(),
                entity,
                null,
                "Deleted " + entity.getClass().getSimpleName()
            );
        }
    }
}

public interface Auditable {
    Long getId();
}

// Apply to entities
@Entity
@EntityListeners(AuditEntityListener.class)
public class User implements Auditable {
    // ...
}
```

---



🔬 **Section Challenge — Chapter 6: Tracking Who Did What, When**

**Challenge 1 (Reasoning):** Why does storing a raw, unencrypted JWT in localStorage make your application critically vulnerable to Cross-Site Scripting (XSS)?
<details><summary>Answer</summary>

If an attacker manages to inject malicious JavaScript into your webpage (XSS), that script has unrestricted access to `window.localStorage`. The script can read the JWT, send it to the attacker's server, and the attacker now has full, unrestricted access to impersonate the user until the token expires. To prevent this, sensitive JWTs should be stored in `HttpOnly` cookies, which are completely invisible and inaccessible to JavaScript execution.
</details>


# SECTION 7: SQL INJECTION PREVENTION

---

## Chapter 7: Preventing SQL Injection Attacks

```java
/**
 * SQL INJECTION PREVENTION CHECKLIST
 * 
 * ✅ Use parameterized queries (JPA, Spring Data)
 * ✅ Use named parameters
 * ✅ Validate and sanitize input
 * ✅ Use ORM (Hibernate/JPA) properly
 * ✅ Avoid string concatenation in queries
 * ✅ Implement input validation
 * ✅ Use least-privilege database accounts
 */

// ==================== SAFE EXAMPLES ====================

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ SAFE: Spring Data derived query (parameterized automatically)
    List<User> findByUsernameContaining(String username);

    // ✅ SAFE: Named parameters with @Query
    @Query("SELECT u FROM User u WHERE u.username = :username")
    Optional<User> findByUsername(@Param("username") String username);

    // ✅ SAFE: Positional parameters
    @Query("SELECT u FROM User u WHERE u.email = ?1")
    Optional<User> findByEmail(String email);

    // ✅ SAFE: Native query with named parameters
    @Query(value = "SELECT * FROM users WHERE status = :status", nativeQuery = true)
    List<User> findByStatus(@Param("status") String status);
}

// ==================== UNSAFE EXAMPLES (NEVER DO THIS!) ====================

@Repository
public class UnsafeUserRepository {

    @PersistenceContext
    private EntityManager em;

    // ❌ DANGEROUS: String concatenation in JPQL
    public List<User> findByUsernameDangerous(String username) {
        // NEVER DO THIS!
        String jpql = "SELECT u FROM User u WHERE u.username = '" + username + "'";
        return em.createQuery(jpql, User.class).getResultList();
        
        // Attack: username = "' OR '1'='1"
        // Result: SELECT u FROM User u WHERE u.username = '' OR '1'='1'
        // Returns ALL users!
    }

    // ❌ DANGEROUS: String concatenation in native query
    public List<User> findByEmailDangerous(String email) {
        String sql = "SELECT * FROM users WHERE email = '" + email + "'";
        return em.createNativeQuery(sql, User.class).getResultList();
        
        // Attack: email = "'; DROP TABLE users; --"
        // Could delete the entire table!
    }
}

// ==================== SAFE IMPLEMENTATION ====================

@Repository
@RequiredArgsConstructor
public class SafeUserRepository {

    private final EntityManager em;

    // ✅ SAFE: Using parameter binding
    public List<User> findByUsernameSecure(String username) {
        return em.createQuery(
            "SELECT u FROM User u WHERE u.username = :username", 
            User.class)
            .setParameter("username", username)
            .getResultList();
    }

    // ✅ SAFE: Using Criteria API
    public List<User> searchUsers(UserSearchCriteria criteria) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        List<Predicate> predicates = new ArrayList<>();

        if (criteria.getUsername() != null) {
            predicates.add(cb.like(
                cb.lower(root.get("username")),
                "%" + criteria.getUsername().toLowerCase() + "%"
            ));
        }

        if (criteria.getEmail() != null) {
            predicates.add(cb.equal(root.get("email"), criteria.getEmail()));
        }

        cq.where(predicates.toArray(new Predicate[0]));
        return em.createQuery(cq).getResultList();
    }

    // ✅ SAFE: Using JdbcTemplate with parameter binding
    public List<User> findByStatusJdbc(String status) {
        return jdbcTemplate.query(
            "SELECT * FROM users WHERE status = ?",
            new Object[]{status},
            (rs, rowNum) -> mapRowToUser(rs)
        );
    }
}

// ==================== INPUT VALIDATION ====================

@Service
@RequiredArgsConstructor
public class UserSearchService {

    private final UserRepository userRepository;

    public List<UserDto> searchUsers(String searchTerm) {
        // Validate and sanitize input
        String sanitized = sanitizeSearchTerm(searchTerm);
        
        if (sanitized.isEmpty()) {
            throw new InvalidSearchTermException("Search term is invalid");
        }
        
        return userRepository.findByUsernameContainingIgnoreCase(sanitized)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    private String sanitizeSearchTerm(String input) {
        if (input == null) {
            return "";
        }
        
        // Remove potentially dangerous characters
        return input
            .replaceAll("[';\"\\\\]", "")  // Remove quotes and backslashes
            .replaceAll("--", "")           // Remove SQL comments
            .replaceAll("/\\*.*\\*/", "")   // Remove block comments
            .trim();
    }
}
```

---



🔬 **Section Challenge — Chapter 7: Preventing SQL Injection Attacks**

**Challenge 1 (Reasoning):** Why does storing a raw, unencrypted JWT in localStorage make your application critically vulnerable to Cross-Site Scripting (XSS)?
<details><summary>Answer</summary>

If an attacker manages to inject malicious JavaScript into your webpage (XSS), that script has unrestricted access to `window.localStorage`. The script can read the JWT, send it to the attacker's server, and the attacker now has full, unrestricted access to impersonate the user until the token expires. To prevent this, sensitive JWTs should be stored in `HttpOnly` cookies, which are completely invisible and inaccessible to JavaScript execution.
</details>


# SECTION 8: ENCRYPTING SENSITIVE DATA

---

## Chapter 8: Encryption at Rest

```java
// ==================== JPA ATTRIBUTE CONVERTER FOR ENCRYPTION ====================

@Converter
@Component
public class EncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;

    @Value("${encryption.key}")
    private String encryptionKey;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            
            SecretKey key = new SecretKeySpec(
                Base64.getDecoder().decode(encryptionKey), 
                "AES"
            );
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec);
            
            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            
            // Combine IV and encrypted data
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            
            return Base64.getEncoder().encodeToString(combined);
            
        } catch (Exception e) {
            throw new EncryptionException("Failed to encrypt data", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        
        try {
            byte[] combined = Base64.getDecoder().decode(dbData);
            
            // Extract IV and encrypted data
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, encrypted, 0, encrypted.length);
            
            SecretKey key = new SecretKeySpec(
                Base64.getDecoder().decode(encryptionKey), 
                "AES"
            );
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec);
            
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new EncryptionException("Failed to decrypt data", e);
        }
    }
}

// ==================== USING ENCRYPTION IN ENTITY ====================

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    // Sensitive data - encrypted at rest
    @Convert(converter = EncryptionConverter.class)
    @Column(name = "ssn")
    private String socialSecurityNumber;

    @Convert(converter = EncryptionConverter.class)
    @Column(name = "credit_card")
    private String creditCardNumber;

    @Convert(converter = EncryptionConverter.class)
    @Column(name = "bank_account")
    private String bankAccountNumber;
}

// ==================== ENCRYPTION SERVICE ====================

@Service
@RequiredArgsConstructor
@Slf4j
public class EncryptionService {

    @Value("${encryption.key}")
    private String masterKey;

    /**
     * Generate a new encryption key (run once during setup)
     */
    public String generateKey() {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    public String encrypt(String plaintext) {
        // Implementation similar to converter
    }

    public String decrypt(String ciphertext) {
        // Implementation similar to converter
    }

    /**
     * Hash sensitive data for searching (one-way)
     * Useful when you need to search encrypted fields
     */
    public String hash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                (data + masterKey).getBytes(StandardCharsets.UTF_8)
            );
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new EncryptionException("Failed to hash data", e);
        }
    }
}
```

---

# SECTION 9: DATABASE CONNECTION SECURITY

---

## Chapter 9: Securing Database Connections

```yaml


🔬 **Section Challenge — Chapter 9: Securing Database Connections**

**Challenge 1 (Reasoning):** Why does storing a raw, unencrypted JWT in localStorage make your application critically vulnerable to Cross-Site Scripting (XSS)?
<details><summary>Answer</summary>

If an attacker manages to inject malicious JavaScript into your webpage (XSS), that script has unrestricted access to `window.localStorage`. The script can read the JWT, send it to the attacker's server, and the attacker now has full, unrestricted access to impersonate the user until the token expires. To prevent this, sensitive JWTs should be stored in `HttpOnly` cookies, which are completely invisible and inaccessible to JavaScript execution.
</details>


# application.yml

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USERNAME}  # Use environment variables!
    password: ${DB_PASSWORD}  # Never hardcode!
    
    # Connection pool security
    hikari:
      connection-timeout: 30000
      maximum-pool-size: 10
      minimum-idle: 5
      idle-timeout: 600000
      max-lifetime: 1800000
      
      # ==================== SSL/TLS ====================
      data-source-properties:
        ssl: true
        sslmode: verify-full
        sslrootcert: /path/to/ca-certificate.crt
        sslcert: /path/to/client-certificate.crt
        sslkey: /path/to/client-key.pk8

# For MySQL with SSL
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=true&requireSSL=true&verifyServerCertificate=true
    hikari:
      data-source-properties:
        trustCertificateKeyStoreUrl: file:/path/to/truststore.jks
        trustCertificateKeyStorePassword: ${TRUSTSTORE_PASSWORD}
        clientCertificateKeyStoreUrl: file:/path/to/keystore.jks
        clientCertificateKeyStorePassword: ${KEYSTORE_PASSWORD}
```

```java
// ==================== SECURE DATA SOURCE CONFIGURATION ====================

@Configuration
@EnableConfigurationProperties(DatabaseProperties.class)
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(DatabaseProperties props) {
        HikariConfig config = new HikariConfig();
        
        config.setJdbcUrl(props.getUrl());
        config.setUsername(props.getUsername());
        config.setPassword(props.getPassword());
        
        // Connection pool settings
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        
        // Connection validation
        config.setConnectionTestQuery("SELECT 1");
        
        // SSL properties
        if (props.isSslEnabled()) {
            Properties sslProps = new Properties();
            sslProps.setProperty("ssl", "true");
            sslProps.setProperty("sslmode", props.getSslMode());
            sslProps.setProperty("sslrootcert", props.getSslRootCert());
            config.setDataSourceProperties(sslProps);
        }
        
        return new HikariDataSource(config);
    }
}

@ConfigurationProperties(prefix = "database")
@Data
public class DatabaseProperties {
    private String url;
    private String username;
    private String password;
    private boolean sslEnabled;
    private String sslMode;
    private String sslRootCert;
    private String sslCert;
    private String sslKey;
}

// ==================== USING SECRETS MANAGER ====================

@Configuration
@Profile("aws")
public class AwsSecretsDataSourceConfig {

    @Bean
    public DataSource dataSource(SecretsManagerClient secretsManager) {
        // Fetch credentials from AWS Secrets Manager
        GetSecretValueRequest request = GetSecretValueRequest.builder()
            .secretId("prod/database/credentials")
            .build();
        
        GetSecretValueResponse response = secretsManager.getSecretValue(request);
        DatabaseCredentials creds = parseCredentials(response.secretString());
        
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(creds.getUrl());
        config.setUsername(creds.getUsername());
        config.setPassword(creds.getPassword());
        
        return new HikariDataSource(config);
    }
}

// ==================== CREDENTIAL ROTATION ====================

@Component
@RequiredArgsConstructor
@Slf4j
public class CredentialRotationService {

    private final HikariDataSource dataSource;
    private final SecretsManagerClient secretsManager;

    @Scheduled(fixedRate = 3600000)  // Every hour
    public void checkAndRotateCredentials() {
        try {
            // Fetch current credentials from secrets manager
            DatabaseCredentials newCreds = fetchCurrentCredentials();
            
            // Check if credentials have changed
            if (!newCreds.getPassword().equals(getCurrentPassword())) {
                log.info("Rotating database credentials");
                
                // Update HikariCP configuration
                HikariConfigMXBean configBean = dataSource.getHikariConfigMXBean();
                configBean.setPassword(newCreds.getPassword());
                
                // Soft evict existing connections
                dataSource.getHikariPoolMXBean().softEvictConnections();
                
                log.info("Database credentials rotated successfully");
            }
        } catch (Exception e) {
            log.error("Failed to rotate credentials", e);
        }
    }
}
```

---

# QUICK REFERENCE

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│              DATABASE SECURITY CHECKLIST                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AUTHENTICATION & AUTHORIZATION                                                  │
│  □ Implement RBAC (Role-Based Access Control)                                    │
│  □ Use fine-grained permissions                                                  │
│  □ Implement method-level security (@PreAuthorize)                               │
│  □ Apply row-level security where needed                                         │
│                                                                                  │
│  PASSWORD SECURITY                                                               │
│  □ Use BCrypt or Argon2 for hashing                                              │
│  □ Implement password policy validation                                          │
│  □ Check against breached password lists                                         │
│  □ Implement password expiry                                                     │
│  □ Track failed login attempts                                                   │
│                                                                                  │
│  DATA PROTECTION                                                                 │
│  □ Encrypt sensitive data at rest                                                │
│  □ Use SSL/TLS for database connections                                          │
│  □ Never expose passwords in logs or responses                                   │
│  □ Implement audit logging                                                       │
│                                                                                  │
│  SQL INJECTION PREVENTION                                                        │
│  □ Use parameterized queries                                                     │
│  □ Never concatenate user input in queries                                       │
│  □ Validate and sanitize all input                                               │
│  □ Use ORM properly                                                              │
│                                                                                  │
│  CONNECTION SECURITY                                                             │
│  □ Use environment variables for credentials                                     │
│  □ Enable SSL for database connections                                           │
│  □ Use secrets manager in production                                             │
│  □ Implement credential rotation                                                 │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```


---

**END OF PART 17: DATABASE SECURITY & USER MANAGEMENT**

➡️ **Next: Part 18 - Distributed Tracing (Sleuth, Zipkin)**


---

> **Navigation**: [< Previous](Ch46_SB_Database_Design.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch53_SB_Distributed_Tracing.md)
