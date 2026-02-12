# 🔐 SPRING BOOT MASTERY - Part 17: Database Security & User Management

> **Complete Guide to User Management, Roles, Permissions, and Database Security**
> _"Secure your data from the ground up"_

---

# TABLE OF CONTENTS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              WHAT THIS PART COVERS                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. User Management Entity Design                                               │
│  2. Role-Based Access Control (RBAC)                                           │
│  3. Permission/Authority Management                                             │
│  4. Password Security (BCrypt, Argon2)                                         │
│  5. Custom UserDetailsService Implementation                                    │
│  6. Method-Level Security (@PreAuthorize, @Secured)                           │
│  7. Database Row-Level Security                                                │
│  8. Audit Logging (Who did what, when)                                         │
│  9. SQL Injection Prevention                                                    │
│  10. Encrypting Sensitive Data                                                  │
│  11. Database Connection Security                                               │
│  12. Multi-Tenancy Security                                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 1: USER MANAGEMENT ENTITY DESIGN

---

## Chapter 1: Complete User Entity Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              USER-ROLE-PERMISSION MODEL                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────┐                   │
│  │    USER     │────►│   USER_ROLES    │◄────│    ROLE     │                   │
│  │             │     │  (Join Table)   │     │             │                   │
│  │ - id        │     │ - user_id       │     │ - id        │                   │
│  │ - username  │     │ - role_id       │     │ - name      │                   │
│  │ - email     │     └─────────────────┘     │ - desc      │                   │
│  │ - password  │                              └─────────────┘                   │
│  │ - enabled   │                                     │                          │
│  │ - locked    │                                     │                          │
│  │ - expired   │     ┌─────────────────┐            │                          │
│  └─────────────┘     │ ROLE_PERMISSIONS│◄───────────┘                          │
│                      │  (Join Table)   │                                        │
│                      │ - role_id       │     ┌─────────────┐                   │
│                      │ - permission_id │────►│ PERMISSION  │                   │
│                      └─────────────────┘     │             │                   │
│                                              │ - id        │                   │
│                                              │ - name      │                   │
│                                              │ - resource  │                   │
│                                              │ - action    │                   │
│                                              └─────────────┘                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Entity Classes

```java
// ==================== USER ENTITY ====================

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_username", columnList = "username", unique = true),
    @Index(name = "idx_users_email", columnList = "email", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    @JsonIgnore  // NEVER expose password in JSON responses
    private String password;

    @Column(name = "first_name", length = 50)
    private String firstName;

    @Column(name = "last_name", length = 50)
    private String lastName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    // ==================== ACCOUNT STATUS FLAGS ====================
    
    @Column(name = "account_non_expired")
    @Builder.Default
    private boolean accountNonExpired = true;

    @Column(name = "account_non_locked")
    @Builder.Default
    private boolean accountNonLocked = true;

    @Column(name = "credentials_non_expired")
    @Builder.Default
    private boolean credentialsNonExpired = true;

    @Builder.Default
    private boolean enabled = true;

    // ==================== SECURITY TRACKING ====================
    
    @Column(name = "failed_login_attempts")
    @Builder.Default
    private int failedLoginAttempts = 0;

    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    // ==================== ROLES ====================
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // ==================== AUDIT FIELDS ====================
    
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    // ==================== UserDetails Implementation ====================
    
    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        
        // Add roles as authorities (prefixed with ROLE_)
        roles.forEach(role -> {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
            
            // Add permissions from each role
            role.getPermissions().forEach(permission -> 
                authorities.add(new SimpleGrantedAuthority(permission.getName()))
            );
        });
        
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    // ==================== HELPER METHODS ====================
    
    public void incrementFailedLoginAttempts() {
        this.failedLoginAttempts++;
    }

    public void resetFailedLoginAttempts() {
        this.failedLoginAttempts = 0;
        this.lockTime = null;
    }

    public void lockAccount() {
        this.accountNonLocked = false;
        this.lockTime = LocalDateTime.now();
    }

    public void unlockAccount() {
        this.accountNonLocked = true;
        this.lockTime = null;
        this.failedLoginAttempts = 0;
    }

    public boolean hasRole(String roleName) {
        return roles.stream()
            .anyMatch(role -> role.getName().equalsIgnoreCase(roleName));
    }

    public boolean hasPermission(String permissionName) {
        return roles.stream()
            .flatMap(role -> role.getPermissions().stream())
            .anyMatch(perm -> perm.getName().equalsIgnoreCase(permissionName));
    }
}

// ==================== ROLE ENTITY ====================

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;  // e.g., "ADMIN", "USER", "MODERATOR"

    @Column(length = 200)
    private String description;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    @ManyToMany(mappedBy = "roles")
    @JsonIgnore
    private Set<User> users = new HashSet<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Predefined roles
    public static final String ADMIN = "ADMIN";
    public static final String USER = "USER";
    public static final String MODERATOR = "MODERATOR";
    public static final String MANAGER = "MANAGER";
}

// ==================== PERMISSION ENTITY ====================

@Entity
@Table(name = "permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"resource", "action"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;  // e.g., "users:read", "users:write", "orders:delete"

    @Column(nullable = false, length = 50)
    private String resource;  // e.g., "users", "orders", "products"

    @Column(nullable = false, length = 20)
    private String action;  // e.g., "read", "write", "delete", "admin"

    @Column(length = 200)
    private String description;

    @ManyToMany(mappedBy = "permissions")
    @JsonIgnore
    private Set<Role> roles = new HashSet<>();

    // Helper method to create permission name
    public static String createName(String resource, String action) {
        return resource + ":" + action;
    }
    
    // Common permission patterns
    public static final String READ = "read";
    public static final String WRITE = "write";
    public static final String DELETE = "delete";
    public static final String ADMIN = "admin";
}
```

### Database Schema (Flyway Migration)

```sql
-- V1__Create_Security_Tables.sql

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone_number VARCHAR(20),
    account_non_expired BOOLEAN DEFAULT TRUE,
    account_non_locked BOOLEAN DEFAULT TRUE,
    credentials_non_expired BOOLEAN DEFAULT TRUE,
    enabled BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    lock_time TIMESTAMP,
    password_changed_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Roles table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    description VARCHAR(200),
    CONSTRAINT uk_permission_resource_action UNIQUE (resource, action)
);

-- User-Roles join table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Role-Permissions join table
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_enabled ON users(enabled);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full system access'),
    ('USER', 'Standard user access'),
    ('MODERATOR', 'Content moderation access'),
    ('MANAGER', 'Team management access');

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('users:read', 'users', 'read', 'View user information'),
    ('users:write', 'users', 'write', 'Create and update users'),
    ('users:delete', 'users', 'delete', 'Delete users'),
    ('users:admin', 'users', 'admin', 'Full user management'),
    ('roles:read', 'roles', 'read', 'View roles'),
    ('roles:write', 'roles', 'write', 'Create and update roles'),
    ('orders:read', 'orders', 'read', 'View orders'),
    ('orders:write', 'orders', 'write', 'Create and update orders'),
    ('orders:delete', 'orders', 'delete', 'Delete orders'),
    ('products:read', 'products', 'read', 'View products'),
    ('products:write', 'products', 'write', 'Create and update products'),
    ('reports:read', 'reports', 'read', 'View reports'),
    ('reports:export', 'reports', 'export', 'Export reports');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'USER' AND p.name IN ('users:read', 'orders:read', 'orders:write', 'products:read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'MODERATOR' AND p.name IN ('users:read', 'users:write', 'orders:read', 'products:read', 'products:write');
```

---

# SECTION 2: CUSTOM UserDetailsService

---

## Chapter 2: Implementing UserDetailsService

```java
// ==================== CUSTOM USER DETAILS SERVICE ====================

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final LoginAttemptService loginAttemptService;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) 
            throws UsernameNotFoundException {
        
        log.debug("Loading user by username or email: {}", usernameOrEmail);
        
        // Check if user is blocked due to too many failed attempts
        if (loginAttemptService.isBlocked(usernameOrEmail)) {
            log.warn("User {} is blocked due to too many failed login attempts", 
                usernameOrEmail);
            throw new LockedException("Account is temporarily locked due to " +
                "too many failed login attempts. Try again later.");
        }
        
        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
            .orElseThrow(() -> {
                log.warn("User not found: {}", usernameOrEmail);
                return new UsernameNotFoundException(
                    "User not found with username or email: " + usernameOrEmail
                );
            });
        
        // Check account status
        validateAccountStatus(user);
        
        return user;
    }

    private void validateAccountStatus(User user) {
        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled. Please contact support.");
        }
        
        if (!user.isAccountNonLocked()) {
            throw new LockedException("Account is locked. Please contact support.");
        }
        
        if (!user.isAccountNonExpired()) {
            throw new AccountExpiredException("Account has expired.");
        }
        
        if (!user.isCredentialsNonExpired()) {
            throw new CredentialsExpiredException("Password has expired. Please reset.");
        }
    }
}

// ==================== LOGIN ATTEMPT SERVICE ====================

@Service
@Slf4j
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 15;

    // Cache for tracking login attempts
    private final LoadingCache<String, Integer> attemptsCache;

    public LoginAttemptService() {
        this.attemptsCache = CacheBuilder.newBuilder()
            .expireAfterWrite(LOCK_DURATION_MINUTES, TimeUnit.MINUTES)
            .build(new CacheLoader<String, Integer>() {
                @Override
                public Integer load(String key) {
                    return 0;
                }
            });
    }

    public void loginSucceeded(String key) {
        attemptsCache.invalidate(key);
    }

    public void loginFailed(String key) {
        int attempts = attemptsCache.getUnchecked(key);
        attempts++;
        attemptsCache.put(key, attempts);
        log.warn("Failed login attempt {} for user: {}", attempts, key);
    }

    public boolean isBlocked(String key) {
        return attemptsCache.getUnchecked(key) >= MAX_ATTEMPTS;
    }

    public int getRemainingAttempts(String key) {
        return Math.max(0, MAX_ATTEMPTS - attemptsCache.getUnchecked(key));
    }
}

// ==================== AUTHENTICATION EVENT LISTENERS ====================

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationEventListener {

    private final LoginAttemptService loginAttemptService;
    private final UserRepository userRepository;

    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        String username = event.getAuthentication().getName();
        
        log.info("Successful login for user: {}", username);
        loginAttemptService.loginSucceeded(username);
        
        // Update last login info
        userRepository.findByUsername(username).ifPresent(user -> {
            user.resetFailedLoginAttempts();
            user.setLastLoginAt(LocalDateTime.now());
            user.setLastLoginIp(getClientIp());
            userRepository.save(user);
        });
    }

    @EventListener
    public void onAuthenticationFailure(AuthenticationFailureBadCredentialsEvent event) {
        String username = (String) event.getAuthentication().getPrincipal();
        
        log.warn("Failed login attempt for user: {}", username);
        loginAttemptService.loginFailed(username);
        
        // Update failed attempts in database
        userRepository.findByUsername(username).ifPresent(user -> {
            user.incrementFailedLoginAttempts();
            
            if (user.getFailedLoginAttempts() >= 5) {
                user.lockAccount();
                log.warn("Account locked for user: {} after {} failed attempts", 
                    username, user.getFailedLoginAttempts());
            }
            
            userRepository.save(user);
        });
    }

    private String getClientIp() {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty()) {
                ip = request.getRemoteAddr();
            }
            return ip;
        }
        return "unknown";
    }
}
```

---

# SECTION 3: PASSWORD SECURITY

---

## Chapter 3: Password Encoding & Validation

```java
// ==================== PASSWORD CONFIGURATION ====================

@Configuration
public class PasswordConfig {

    /**
     * BCrypt is the recommended default
     * - Adaptive: can increase cost factor over time
     * - Includes salt automatically
     * - Resistant to rainbow table attacks
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // Cost factor 12 (2^12 rounds)
    }

    /**
     * For higher security requirements, use Argon2
     * - Winner of Password Hashing Competition (2015)
     * - Memory-hard (harder to attack with GPUs/ASICs)
     */
    @Bean
    @Profile("high-security")
    public PasswordEncoder argon2PasswordEncoder() {
        return new Argon2PasswordEncoder(
            16,      // Salt length
            32,      // Hash length
            1,       // Parallelism
            65536,   // Memory (64MB)
            3        // Iterations
        );
    }

    /**
     * Delegating encoder allows gradual migration between algorithms
     */
    @Bean
    @Profile("migration")
    public PasswordEncoder delegatingPasswordEncoder() {
        String defaultEncoder = "bcrypt";
        
        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("bcrypt", new BCryptPasswordEncoder(12));
        encoders.put("argon2", new Argon2PasswordEncoder());
        encoders.put("scrypt", new SCryptPasswordEncoder());
        // Legacy encoders for migration
        encoders.put("sha256", new StandardPasswordEncoder());  // Deprecated
        
        DelegatingPasswordEncoder encoder = 
            new DelegatingPasswordEncoder(defaultEncoder, encoders);
        
        // For encoding passwords without prefix (when upgrading)
        encoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder(12));
        
        return encoder;
    }
}

// ==================== PASSWORD VALIDATION ====================

@Service
@RequiredArgsConstructor
public class PasswordValidationService {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    /**
     * NIST SP 800-63B Guidelines:
     * - Minimum 8 characters
     * - Maximum 128 characters
     * - No composition rules (uppercase, special chars, etc.)
     * - Check against breached password lists
     * - Allow spaces and all printable characters
     */
    public PasswordValidationResult validate(String password, User user) {
        List<String> errors = new ArrayList<>();

        // Length check
        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters");
        }
        
        if (password.length() > MAX_LENGTH) {
            errors.add("Password must not exceed " + MAX_LENGTH + " characters");
        }

        // No personal info
        if (containsPersonalInfo(password, user)) {
            errors.add("Password must not contain username, email, or name");
        }

        // Check against common passwords
        if (isCommonPassword(password)) {
            errors.add("Password is too common. Choose a more unique password");
        }

        // Check password history
        if (isInPasswordHistory(password, user)) {
            errors.add("Cannot reuse recent passwords");
        }

        // Check against breached passwords (HaveIBeenPwned)
        if (isBreachedPassword(password)) {
            errors.add("This password has been exposed in data breaches");
        }

        return PasswordValidationResult.builder()
            .valid(errors.isEmpty())
            .errors(errors)
            .build();
    }

    private boolean containsPersonalInfo(String password, User user) {
        String lowerPassword = password.toLowerCase();
        
        return lowerPassword.contains(user.getUsername().toLowerCase()) ||
               lowerPassword.contains(user.getEmail().split("@")[0].toLowerCase()) ||
               (user.getFirstName() != null && 
                lowerPassword.contains(user.getFirstName().toLowerCase())) ||
               (user.getLastName() != null && 
                lowerPassword.contains(user.getLastName().toLowerCase()));
    }

    private boolean isCommonPassword(String password) {
        // Top 10000 common passwords list
        Set<String> commonPasswords = loadCommonPasswords();
        return commonPasswords.contains(password.toLowerCase());
    }

    private boolean isInPasswordHistory(String password, User user) {
        // Check last 5 passwords
        // Requires storing password history in database
        return false;  // Implementation depends on password history storage
    }

    private boolean isBreachedPassword(String password) {
        // Use HaveIBeenPwned API (k-anonymity approach)
        // Only sends first 5 chars of SHA-1 hash
        try {
            String sha1 = DigestUtils.sha1Hex(password).toUpperCase();
            String prefix = sha1.substring(0, 5);
            String suffix = sha1.substring(5);

            // Call HIBP API with prefix
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(
                "https://api.pwnedpasswords.com/range/" + prefix,
                String.class
            );

            // Check if suffix exists in response
            return response != null && 
                   Arrays.stream(response.split("\n"))
                       .anyMatch(line -> line.startsWith(suffix));

        } catch (Exception e) {
            // If API fails, don't block registration
            return false;
        }
    }

    private Set<String> loadCommonPasswords() {
        // Load from file or embedded resource
        return Set.of(
            "password", "123456", "password123", "admin", "letmein",
            "welcome", "monkey", "dragon", "master", "qwerty"
            // ... more passwords
        );
    }
}

@Data
@Builder
public class PasswordValidationResult {
    private boolean valid;
    private List<String> errors;
}

// ==================== PASSWORD EXPIRY ====================

@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordExpiryChecker {

    private static final int PASSWORD_EXPIRY_DAYS = 90;

    @Scheduled(cron = "0 0 0 * * ?")  // Run daily at midnight
    public void checkPasswordExpiry() {
        LocalDateTime expiryThreshold = LocalDateTime.now()
            .minusDays(PASSWORD_EXPIRY_DAYS);

        // Find users with expired passwords
        List<User> expiredUsers = userRepository.findByPasswordChangedAtBefore(
            expiryThreshold
        );

        expiredUsers.forEach(user -> {
            user.setCredentialsNonExpired(false);
            userRepository.save(user);
            
            // Send reminder email
            notificationService.sendPasswordExpiryNotification(user);
        });
    }
}
```

---

# SECTION 4: METHOD-LEVEL SECURITY

---

## Chapter 4: @PreAuthorize, @Secured, and Custom Expressions

```java
// ==================== SECURITY CONFIGURATION ====================

@Configuration
@EnableMethodSecurity(
    securedEnabled = true,      // Enable @Secured
    jsr250Enabled = true,       // Enable @RolesAllowed (JSR-250)
    prePostEnabled = true       // Enable @PreAuthorize/@PostAuthorize
)
public class MethodSecurityConfig {
    
    // Custom permission evaluator for complex authorization
    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler handler = 
            new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(new CustomPermissionEvaluator());
        return handler;
    }
}

// ==================== USING @PreAuthorize ====================

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Only ADMIN can view all users
     */
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Users can view their own profile OR admins can view any profile
     */
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public UserDto getUser(Long id) {
        return userRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    /**
     * Only users with specific permission can create users
     */
    @PreAuthorize("hasAuthority('users:write')")
    public UserDto createUser(CreateUserRequest request) {
        // Implementation
    }

    /**
     * Users can update themselves OR admins can update anyone
     */
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        // Implementation
    }

    /**
     * Only ADMIN can delete users, and cannot delete themselves
     */
    @PreAuthorize("hasRole('ADMIN') and #id != authentication.principal.id")
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Custom SpEL expression - check if user belongs to same organization
     */
    @PreAuthorize("@securityService.belongsToSameOrganization(#id, authentication)")
    public UserDto getUserInOrganization(Long id) {
        return userRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    /**
     * Multiple conditions
     */
    @PreAuthorize("""
        hasRole('ADMIN') or 
        (hasRole('MANAGER') and @securityService.isManager(#departmentId, authentication)) or
        (hasAuthority('users:read') and #departmentId == authentication.principal.departmentId)
    """)
    public List<UserDto> getUsersByDepartment(Long departmentId) {
        return userRepository.findByDepartmentId(departmentId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
}

// ==================== @PostAuthorize (AFTER execution) ====================

@Service
public class DocumentService {

    /**
     * Filter result AFTER method execution
     * Only return if user owns the document
     */
    @PostAuthorize("returnObject.ownerId == authentication.principal.id or hasRole('ADMIN')")
    public Document getDocument(Long id) {
        return documentRepository.findById(id)
            .orElseThrow(() -> new DocumentNotFoundException(id));
    }

    /**
     * Filter collection after execution
     */
    @PostFilter("filterObject.ownerId == authentication.principal.id or hasRole('ADMIN')")
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    /**
     * Filter input collection before execution
     */
    @PreFilter("filterObject.ownerId == authentication.principal.id")
    public void deleteDocuments(List<Document> documents) {
        documentRepository.deleteAll(documents);
    }
}

// ==================== CUSTOM SECURITY SERVICE ====================

@Service("securityService")
@RequiredArgsConstructor
public class SecurityService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    public boolean belongsToSameOrganization(Long targetUserId, Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        
        return userRepository.findById(targetUserId)
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│              DATABASE SECURITY CHECKLIST                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AUTHENTICATION & AUTHORIZATION                                                 │
│  □ Implement RBAC (Role-Based Access Control)                                  │
│  □ Use fine-grained permissions                                                │
│  □ Implement method-level security (@PreAuthorize)                            │
│  □ Apply row-level security where needed                                       │
│                                                                                  │
│  PASSWORD SECURITY                                                              │
│  □ Use BCrypt or Argon2 for hashing                                           │
│  □ Implement password policy validation                                        │
│  □ Check against breached password lists                                       │
│  □ Implement password expiry                                                   │
│  □ Track failed login attempts                                                 │
│                                                                                  │
│  DATA PROTECTION                                                                │
│  □ Encrypt sensitive data at rest                                              │
│  □ Use SSL/TLS for database connections                                        │
│  □ Never expose passwords in logs or responses                                 │
│  □ Implement audit logging                                                     │
│                                                                                  │
│  SQL INJECTION PREVENTION                                                       │
│  □ Use parameterized queries                                                   │
│  □ Never concatenate user input in queries                                     │
│  □ Validate and sanitize all input                                            │
│  □ Use ORM properly                                                            │
│                                                                                  │
│  CONNECTION SECURITY                                                            │
│  □ Use environment variables for credentials                                   │
│  □ Enable SSL for database connections                                         │
│  □ Use secrets manager in production                                           │
│  □ Implement credential rotation                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

**END OF PART 17: DATABASE SECURITY & USER MANAGEMENT**

➡️ **Next: Part 18 - Distributed Tracing (Sleuth, Zipkin)**
