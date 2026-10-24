**Navigation**: [< Previous](Ch42_SB_HTTP_Deep_Dive.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch50_SB_DSA_Applications.md)

# 🔐 SPRING BOOT MASTERY - Part 11: Authentication & Authorization

**Securing Your Applications**
_"Security is not a feature, it's a requirement"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

**WHY: Why Security is Critical?**

```text
• Data breaches cost millions: Legal fees, reputation damage
• Compliance: GDPR, HIPAA, PCI-DSS require security
• OWASP Top 10: Broken auth consistently in top vulnerabilities
• Interview: Security questions separate senior from junior developers
• Career: Security expertise = higher pay, more opportunities
```

**HOW: How Spring Security Works?**

```text
• Filter chain: Request passes through security filters
• Authentication: Who are you? (login, JWT validation)
• Authorization: What can you do? (roles, permissions)
• SecurityContext: Holds authenticated user info
• UserDetailsService: Loads user data for authentication
```

**WHEN: When to Use Each Auth Strategy?**

```text
• Session-based: Traditional web apps, server-rendered pages
• JWT: REST APIs, microservices, stateless authentication
• OAuth2: "Login with Google/GitHub", third-party integration
• API Keys: Service-to-service communication
• Basic Auth: Simple internal APIs, development only
```

**WHICH: Which Security Concepts to Master?**

```text
ESSENTIAL:     Authentication vs Authorization, JWT, SecurityFilterChain
IMPORTANT:     @PreAuthorize, BCrypt, CORS configuration
ADVANCED:      OAuth2 flows, custom filters, method security
```

---

# SECTION 1: AUTHENTICATION vs AUTHORIZATION

---

## Chapter 1: Understanding the Difference

🔬 **Section Challenge — Chapter 1: Understanding the Difference**

**Challenge 1 (Reasoning):** In OAuth2 (e.g., logging in with Google), why does the client application receive an Authorization Code first, instead of directly receiving the Access Token?

<details><summary>Answer</summary>

Security against token interception (Authorization Code Flow). If the Authorization Server sent the Access Token directly via the browser redirect URL (Implicit Flow), it would be exposed in browser history, proxy logs, and vulnerable to interception. By returning a short-lived Authorization Code, the client application's secure backend server can exchange it for the real Access Token directly via a secure, back-channel HTTPS POST request, ensuring the Access Token never touches the vulnerable browser URL.

</details>

## Authentication vs Authorization

| | Authentication (AuthN) | Authorization (AuthZ) |
| --- | --- | --- |
| Question | "WHO are you?" | "WHAT can you do?" |
| Verifies | Identity | Permissions |
| Order | Happens FIRST | Happens AFTER authentication |
| Examples | Username + password<br>Fingerprint<br>Face ID<br>JWT token | User can view their own data<br>Admin can delete any user<br>Manager can approve requests<br>Guest can only read |
| HTTP status on failure | `401 Unauthorized` | `403 Forbidden` |

> [!TIP]
> **Real-world analogy: airport security.**
> 1. **Authentication:** show your ID/passport at the checkpoint. "Are you really John Smith?" ✓
> 2. **Authorization:** check your boarding pass. "Can you enter the First Class lounge?" ✗ "Can you board Flight AA123?" ✓

**In code:**

1. The user logs in with email/password → **authentication**.
2. The system returns a JWT token.
3. The user tries to access `/admin/users` → **authorization**.
4. The system checks: does this user have the `ADMIN` role? No → `403 Forbidden`.

---

## Chapter 2: Spring Security Architecture

**Spring Security filter chain**

```mermaid
flowchart TD
  R["HTTP request"] --> F1
  subgraph SFC["SECURITY FILTER CHAIN"]
    F1["1. SecurityContextPersistenceFilter<br/>loads the SecurityContext from the session<br/>(SecurityContextHolderFilter in Spring Security 6)"]
    F2["2. LogoutFilter<br/>handles the /logout URL"]
    F3["3. UsernamePasswordAuthenticationFilter<br/>handles form login (POST /login)"]
    F4["4. BasicAuthenticationFilter<br/>handles the HTTP Basic Auth header"]
    F5["5. BearerTokenAuthenticationFilter (for JWT)<br/>validates the JWT from the Authorization header"]
    F6["6. ExceptionTranslationFilter<br/>converts security exceptions to HTTP responses"]
    F7["7. FilterSecurityInterceptor / AuthorizationFilter<br/>final authorization check: can the user access this URL?"]
    F1 --> F2 --> F3 --> F4 --> F5 --> F6 --> F7
  end
  F7 --> C["Controller (if all filters pass)"]
```

**How to read this diagram.** The request passes through each filter in order. Which filters are present depends on your configuration, and a filter can stop the request (for example with a 401 or 403) before it reaches the controller.

---

🔬 **Section Challenge — Chapter 2: Spring Security Architecture**

**Challenge 1 (Reasoning):** JWT vs session cookies — what are the tradeoffs for a distributed microservices architecture?

<details><summary>Answer</summary>

JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed.

</details>

# SECTION 2: JWT AUTHENTICATION (Most Common)

---

## Chapter 3: JWT (JSON Web Token) Explained

🔬 **Section Challenge — Chapter 3: JWT (JSON Web Token) Explained**

**Challenge 1 (JWT Signature Verification Flow):** A JWT arrives in the `Authorization: Bearer <token>` header. **Who** verifies the signature? **When** is the token considered valid? **What** happens if the secret key changes on the server between token issuance and verification?

<details><summary>Answer</summary>

**Who verifies:** The Spring Security `JwtAuthenticationConverter` or `JwtDecoder` bean (from `spring-security-oauth2-resource-server`). It extracts the three parts: header + payload + signature. Recomputes HMAC-SHA256(base64(header) + "." + base64(payload), secretKey). Compares with the provided signature. **When valid:** (1) Signature matches (not tampered). (2) `exp` claim is in the future (not expired). (3) `iss` claim matches expected issuer. (4) `aud` claim matches expected audience (if configured). **If secret key changes:** ALL existing tokens become INVALID. The signature verification fails because the server can't reproduce the original signature with the new key. ALL users are effectively logged out. **Solution for key rotation:** Use asymmetric JWT (RSA/EC): private key signs, public key verifies. Rotate ONLY the private key. Old tokens signed with old private key are still verifiable with the old PUBLIC key until they expire. Use `/.well-known/jwks.json` endpoint to publish current public keys (JWKS — JSON Web Key Set). Resource servers fetch current public keys dynamically.

</details>

📎 **Reference Anchor:** [jjwt `DefaultJwtParser.java`](https://github.com/jwtk/jjwt/blob/0.12.6/impl/src/main/java/io/jsonwebtoken/impl/DefaultJwtParser.java#L380-L450)  
**Invariant learned:** The parser re-signs `base64(header).base64(payload)` with the local secret and compares against the provided signature using a **constant-time comparison** (`MessageDigest.isEqual`) to prevent timing attacks. If the local secret rotates, the re-signed value will never match the original signature.  
**Local rewrite:** The `JwtService` above calls `Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token)` — this delegates directly to jjwt's `DefaultJwtParser`. The `verifyWith()` call sets the expected signing key; `parseSignedClaims()` validates all three checks: signature, `exp`, `nbf`.  
**Constraint warning:** jjwt uses HMAC-SHA256 by default (symmetric — same key signs and verifies). For a **resource server** that should only verify (not sign), use asymmetric RSA/EC. With jjwt: sign with `Keys.keyPairFor(SignatureAlgorithm.RS256)`, verify with the public key only.

## JWT structure

A JWT is three Base64URL-encoded parts joined by dots:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.          <- HEADER
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.   <- PAYLOAD
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c    <- SIGNATURE
```

| Part | Holds | Encoding |
| --- | --- | --- |
| Header | Algorithm and token type | Base64URL |
| Payload | Claims (the actual data) | Base64URL |
| Signature | Proof the first two parts were not altered | Base64URL |

**Header (algorithm + type)**

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

| Field | Meaning |
| --- | --- |
| `alg` | Algorithm used to sign |
| `typ` | Token type |

**Payload (claims, the actual data)**

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "email": "john@test.com",
  "roles": ["USER", "ADMIN"],
  "iat": 1516239022,
  "exp": 1516242622
}
```

| Claim | Meaning |
| --- | --- |
| `sub` | Subject (user ID) |
| `name`, `email`, `roles` | Custom claims |
| `iat` | Issued at (Unix timestamp) |
| `exp` | Expiration (Unix timestamp) |

**Signature**

```text
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

**Why JWT?**

- ✅ **Stateless:** the server doesn't need to store sessions.
- ✅ **Scalable:** works across multiple servers (no session sharing).
- ✅ **Mobile-friendly:** easy to send in a header.
- ✅ **Self-contained:** carries all the user info needed.
- ✅ **Cross-domain:** works for APIs consumed by different clients.

> [!WARNING]
> - Individual tokens cannot be invalidated (use short expiry + refresh tokens).
> - The payload is only Base64 encoded, NOT encrypted (don't put secrets in it).
> - Token size grows with the number of claims.

---

## Chapter 4: JWT Authentication Flow

**JWT authentication flow**

**Step 1: login**

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: POST /api/auth/login {"email": "john@test.com", "password": "secret123"}
  Note over S: 1. Find user by email<br/>2. Verify password hash<br/>3. Generate JWT token
  S-->>C: 200 OK {"accessToken": "eyJhbG...", "refreshToken": "eyJhbG...", "expiresIn": 3600}
```

**How to read this diagram.** Read top to bottom: the client posts its email and password to the login endpoint; the server finds the user, verifies the password hash and generates a JWT (the note lists these three steps), then replies 200 OK with an access token, a refresh token and an expiry. Notice that the server returns the tokens - the client uses them in Step 2.

**Step 2: access a protected resource**

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: GET /api/users/me, Authorization: Bearer eyJhbG...
  Note over S: 1. Extract the token from the header<br/>2. Validate the signature<br/>3. Check the expiration<br/>4. Extract the user from the token<br/>5. Process the request
  S-->>C: 200 OK {"id": 123, "name": "John Doe"}
```

**Step 3: token expired, so refresh**

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: POST /api/auth/refresh {"refreshToken": "eyJhbG..."}
  Note over S: 1. Validate the refresh token<br/>2. Generate a new access token
  S-->>C: 200 OK {"accessToken": "new_eyJhbG...", "expiresIn": 3600}
```

**How to read these diagrams.** The client logs in once and receives an access token and a refresh token. It sends the access token with every request. When the access token expires, it uses the refresh token to get a new one without asking for the password again.

---

## Chapter 5: Complete JWT Implementation

```java
// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCIES (pom.xml)
// ═══════════════════════════════════════════════════════════════════════════════
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-security</artifactId>
// </dependency>
// <dependency>
//     <groupId>io.jsonwebtoken</groupId>
//     <artifactId>jjwt-api</artifactId>
//     <version>0.12.3</version>
// </dependency>
// <dependency>
//     <groupId>io.jsonwebtoken</groupId>
//     <artifactId>jjwt-impl</artifactId>
//     <version>0.12.3</version>
//     <scope>runtime</scope>
// </dependency>
// <dependency>
//     <groupId>io.jsonwebtoken</groupId>
//     <artifactId>jjwt-jackson</artifactId>
//     <version>0.12.3</version>
//     <scope>runtime</scope>
// </dependency>


// ═══════════════════════════════════════════════════════════════════════════════
// 1. USER ENTITY
// ═══════════════════════════════════════════════════════════════════════════════

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String firstName;

    private String lastName;

    @Column(nullable = false)
    private boolean enabled = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    private Set<Role> roles = new HashSet<>();

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
            .collect(Collectors.toList());
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}

public enum Role {
    USER, ADMIN, MANAGER
}


// ═══════════════════════════════════════════════════════════════════════════════
// 2. JWT SERVICE - Token Generation & Validation
// ═══════════════════════════════════════════════════════════════════════════════

@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private long accessTokenExpiration;  // e.g., 3600000 (1 hour)

    @Value("${app.jwt.refresh-expiration}")
    private long refreshTokenExpiration;  // e.g., 604800000 (7 days)

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Generate access token
    public String generateAccessToken(UserDetails userDetails) {
        return generateToken(userDetails, accessTokenExpiration);
    }

    // Generate refresh token
    public String generateRefreshToken(UserDetails userDetails) {
        return generateToken(userDetails, refreshTokenExpiration);
    }

    private String generateToken(UserDetails userDetails, long expiration) {
        Map<String, Object> claims = new HashMap<>();

        if (userDetails instanceof User user) {
            claims.put("userId", user.getId());
            claims.put("roles", user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toList()));
        }

        return Jwts.builder()
            .claims(claims)
            .subject(userDetails.getUsername())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey())
            .compact();
    }

    // Extract username from token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract user ID from token
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    // Extract any claim
    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    // Validate token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 3. JWT AUTHENTICATION FILTER
// ═══════════════════════════════════════════════════════════════════════════════

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Get Authorization header
        final String authHeader = request.getHeader("Authorization");

        // Check if header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract token (remove "Bearer " prefix)
        final String token = authHeader.substring(7);

        try {
            // Extract username from token
            final String username = jwtService.extractUsername(token);

            // If username exists and not already authenticated
            if (username != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

                // Load user from database
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Validate token
                if (jwtService.isTokenValid(token, userDetails)) {
                    // Create authentication object
                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                        );

                    // Add request details
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    // Set authentication in context
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("Authenticated user: {}", username);
                }
            }
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
        }

        // Continue filter chain
        filterChain.doFilter(request, response);
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 4. SECURITY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enable @PreAuthorize, @PostAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (not needed for stateless API with JWT)
            .csrf(csrf -> csrf.disable())

            // Configure authorization
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // Admin only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // All other endpoints require authentication
                .anyRequest().authenticated()
            )

            // Stateless session (no session cookies)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

            // Exception handling
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write(
                        "{\"error\": \"Unauthorized\", \"message\": \"" +
                        authException.getMessage() + "\"}"
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                        "{\"error\": \"Forbidden\", \"message\": \"Access denied\"}"
                    );
                })
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 5. AUTH CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.email());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for email: {}", request.email());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        // For JWT, logout is handled client-side by deleting the token
        // Optionally: add token to blacklist
        return ResponseEntity.ok().build();
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 6. AUTH SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        // Create new user
        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRoles(Set.of(Role.USER));

        User saved = userRepository.save(user);
        log.info("User registered: {}", saved.getEmail());

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(saved);
        String refreshToken = jwtService.generateRefreshToken(saved);

        return new AuthResponse(accessToken, refreshToken, "Bearer", 3600);
    }

    public AuthResponse login(LoginRequest request) {
        // Authenticate
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.email(),
                request.password()
            )
        );

        // Load user
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        log.info("User logged in: {}", user.getEmail());

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, "Bearer", 3600);
    }

    public AuthResponse refresh(RefreshRequest request) {
        // Extract username from refresh token
        String username = jwtService.extractUsername(request.refreshToken());

        // Load user
        User user = userRepository.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Validate refresh token
        if (!jwtService.isTokenValid(request.refreshToken(), user)) {
            throw new InvalidTokenException("Invalid refresh token");
        }

        // Generate new access token
        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResponse(accessToken, request.refreshToken(), "Bearer", 3600);
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 7. DTOs
// ═══════════════════════════════════════════════════════════════════════════════

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String firstName,
    String lastName
) {}

public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}

public record RefreshRequest(
    @NotBlank String refreshToken
) {}

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn
) {}
```

---

# SECTION 3: AUTHORIZATION (RBAC - Role Based Access Control)

---

## Chapter 6: Method-Level Security

```java
// ═══════════════════════════════════════════════════════════════════════════════
// @PreAuthorize - Check BEFORE method execution
// ═══════════════════════════════════════════════════════════════════════════════

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SecuredController {

    private final UserService userService;
    private final OrderService orderService;

    // ─────────────────────────────────────────────────────────────────────────
    // ROLE-BASED ACCESS
    // ─────────────────────────────────────────────────────────────────────────

    // Only users with ADMIN role can access
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/users")
    public List<UserResponse> getAllUsers() {
        return userService.findAll();
    }

    // Multiple roles (OR logic)
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }

    // Multiple roles (AND logic)
    @PreAuthorize("hasRole('ADMIN') and hasRole('SUPER_USER')")
    @PostMapping("/system/reset")
    public void systemReset() {
        // dangerous operation
    }

    // Any of these authorities
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERVISOR')")
    @GetMapping("/reports")
    public List<Report> getReports() {
        return reportService.findAll();
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PERMISSION-BASED ACCESS (Fine-grained)
    // ─────────────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAuthority('user:read')")
    @GetMapping("/users/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PreAuthorize("hasAuthority('user:write')")
    @PostMapping("/users")
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        return userService.create(request);
    }


    // ─────────────────────────────────────────────────────────────────────────
    // EXPRESSION-BASED ACCESS (SpEL - Spring Expression Language)
    // ─────────────────────────────────────────────────────────────────────────

    // Access method parameters
    // User can only view their own orders
    @PreAuthorize("#userId == authentication.principal.id")
    @GetMapping("/users/{userId}/orders")
    public List<OrderResponse> getUserOrders(@PathVariable Long userId) {
        return orderService.findByUserId(userId);
    }

    // User can only update their own profile
    @PreAuthorize("#id == authentication.principal.id or hasRole('ADMIN')")
    @PutMapping("/users/{id}")
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    // Check object properties
    @PreAuthorize("#request.departmentId == authentication.principal.departmentId " +
                  "or hasRole('ADMIN')")
    @PostMapping("/leave-requests")
    public LeaveRequest createLeaveRequest(@RequestBody LeaveRequestDto request) {
        return leaveService.create(request);
    }


    // ─────────────────────────────────────────────────────────────────────────
    // @PostAuthorize - Check AFTER method execution (on return value)
    // ─────────────────────────────────────────────────────────────────────────

    // Only return if user owns the resource
    @PostAuthorize("returnObject.userId == authentication.principal.id " +
                   "or hasRole('ADMIN')")
    @GetMapping("/orders/{id}")
    public OrderResponse getOrder(@PathVariable Long id) {
        return orderService.findById(id);  // Check happens AFTER this returns
    }


    // ─────────────────────────────────────────────────────────────────────────
    // @PreFilter / @PostFilter - Filter collections
    // ─────────────────────────────────────────────────────────────────────────

    // Filter input collection
    @PreFilter("filterObject.departmentId == authentication.principal.departmentId")
    @PostMapping("/bulk-update")
    public void bulkUpdate(@RequestBody List<UpdateRequest> requests) {
        // Only requests matching user's department are passed through
    }

    // Filter output collection
    @PostFilter("filterObject.ownerId == authentication.principal.id " +
                "or hasRole('ADMIN')")
    @GetMapping("/documents")
    public List<Document> getDocuments() {
        return documentService.findAll();
        // Non-owned documents filtered out (unless admin)
    }
}
```

---

🔬 **Section Challenge — Chapter 6: Method-Level Security**

**Challenge 1 (@PreAuthorize vs @PostAuthorize):** `@PreAuthorize("#id == authentication.principal.id")` vs `@PostAuthorize("returnObject.ownerId == authentication.principal.id")`. **Who** checks authorization? **When** is `@PostAuthorize` necessary? **What** happens to the database write if `@PostAuthorize` fails?

<details><summary>Answer</summary>

**Who checks:** Spring Security's method security proxy. `@PreAuthorize` runs BEFORE the method body. `@PostAuthorize` runs AFTER the method body with access to `returnObject`. **When `@PostAuthorize` is necessary:** When the authorization decision depends on the RETURN VALUE. Example: `@PostAuthorize("returnObject.ownerId == authentication.principal.id")` on `findDocument(Long id)` — you don't know the document's owner UNTIL you load it from the database. You must load first, THEN check ownership. **What happens to database write if @PostAuthorize fails:** The method EXECUTES (including DB writes, side effects). The return value is checked AFTER completion. If unauthorized: throws `AccessDeniedException`. BUT any DB changes already committed are NOT rolled back (unless wrapped in `@Transactional` which gets rolled back by the exception). **@PostAuthorize + @Transactional:** If both are present, transaction commits after method, THEN `@PostAuthorize` checks. If `@PostAuthorize` throws, the transaction is already committed. Solution: Use `@PreAuthorize` with a repository check, or ensure the transaction rollbacks via `@Transactional(rollbackFor = AccessDeniedException.class)`. **Best practice:** Prefer `@PreAuthorize` for data access control. Use `@PostAuthorize` sparingly and only when pre-check is impossible.

</details>

## Chapter 7: Custom Security Expressions

```java
// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM SECURITY SERVICE (for complex authorization logic)
// ═══════════════════════════════════════════════════════════════════════════════

@Service("authz")  // Bean name used in SpEL
@RequiredArgsConstructor
public class AuthorizationService {

    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;

    // Check if user is project owner
    public boolean isProjectOwner(Long projectId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            return false;
        }
        User user = (User) auth.getPrincipal();

        return projectRepository.findById(projectId)
            .map(project -> project.getOwnerId().equals(user.getId()))
            .orElse(false);
    }

    // Check if user is team member
    public boolean isTeamMember(Long teamId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();

        return teamRepository.existsByIdAndMembersContaining(teamId, user);
    }

    // Check if user can access resource
    public boolean canAccessResource(Long resourceId, String action) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();

        // Complex business logic here
        // Check resource ownership, team membership, delegated access, etc.

        return true; // or false based on logic
    }

    // Check department access
    public boolean isInSameDepartment(Long targetUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) auth.getPrincipal();

        return userRepository.findById(targetUserId)
            .map(target -> target.getDepartmentId().equals(currentUser.getDepartmentId()))
            .orElse(false);
    }
}


// Using custom authorization in controllers
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    // Use custom authz service
    @PreAuthorize("@authz.isProjectOwner(#projectId)")
    @PutMapping("/{projectId}")
    public ProjectResponse updateProject(
            @PathVariable Long projectId,
            @RequestBody UpdateProjectRequest request) {
        return projectService.update(projectId, request);
    }

    // Combine with roles
    @PreAuthorize("@authz.isTeamMember(#teamId) or hasRole('ADMIN')")
    @GetMapping("/teams/{teamId}/projects")
    public List<ProjectResponse> getTeamProjects(@PathVariable Long teamId) {
        return projectService.findByTeamId(teamId);
    }

    // Complex condition
    @PreAuthorize("@authz.canAccessResource(#id, 'DELETE') and hasRole('MANAGER')")
    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable Long id) {
        projectService.delete(id);
    }
}
```

---

🔬 **Section Challenge — Chapter 7: Custom Security Expressions**

**Challenge 1 (Design):** Design a custom security expression `@authz.canAccessProject(#projectId, authentication)`. What inputs should it receive, where should ownership checks happen, and what must stay out of the controller?

<details><summary>Trace, Reasoning & Debug</summary>

```java
@Component("authz")
public class AuthorizationRules {
    public boolean canAccessProject(Long projectId, Authentication authentication) {
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
        return projectRepository.existsByIdAndMembers_Id(projectId, user.id());
    }
}
```

The controller should express the rule, not implement it. Keep row-level authorization in a named bean so it can use repositories, be tested directly, and stay consistent across endpoints. Pass only stable identifiers and the authenticated principal; never trust request bodies for ownership.

</details>

## Chapter 8: Testing in Postman

**Testing auth in Postman**

**Step 1: register a user**

`POST http://localhost:8080/api/auth/register`

```json
{
  "email": "john@test.com",
  "password": "MySecret123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInJvbGVzIjo...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huQHRlc3Qu...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Step 2: log in**

`POST http://localhost:8080/api/auth/login`

```json
{
  "email": "john@test.com",
  "password": "MySecret123!"
}
```

Save the `accessToken` to an environment variable. In the **Tests** tab, auto-save the tokens:

```javascript
var json = pm.response.json();
pm.environment.set("accessToken", json.accessToken);
pm.environment.set("refreshToken", json.refreshToken);
```

**Step 3: access a protected endpoint**

`GET http://localhost:8080/api/users/me`

| Header key | Value |
| --- | --- |
| `Authorization` | `Bearer {{accessToken}}` |

Or use the **Authorization** tab: Type = Bearer Token, Token = `{{accessToken}}`.

**Step 4: test 401 Unauthorized**

`GET http://localhost:8080/api/users/me` (without the `Authorization` header). Expected: `401 Unauthorized`.

```json
{
  "error": "Unauthorized",
  "message": "Full authentication is required"
}
```

**Step 5: test 403 Forbidden**

`GET http://localhost:8080/api/admin/users` with `Authorization: Bearer {{accessToken}}` (a USER role, not ADMIN). Expected: `403 Forbidden`.

```json
{
  "error": "Forbidden",
  "message": "Access denied"
}
```

**Step 6: refresh the token**

`POST http://localhost:8080/api/auth/refresh`

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

This returns a new `accessToken` without re-entering the password.

---

🔬 **Section Challenge — Chapter 8: Testing in Postman**

**Challenge 1 (JWT Expiry and Refresh Token Pattern):** Access token expires in 15 minutes. **Who** issues a new one? **When** should the client use the refresh token? **What** is the security risk if refresh tokens never expire?

<details><summary>Answer</summary>

**Who issues a new access token:** The Authorization Server (your Spring Boot auth service, or Keycloak, Auth0). The client sends the refresh token to `/oauth/token` (or `/auth/refresh`) with `grant_type=refresh_token`. The server validates the refresh token, issues a new access token (and optionally rotates the refresh token). **When the client uses the refresh token:** When the API returns `401 Unauthorized`. The client should: (1) Try the original request. (2) On `401`, silently call the refresh endpoint. (3) Retry the original request with the new access token. (4) If refresh fails (refresh token expired): redirect to login. **Security risk of non-expiring refresh tokens:** If a refresh token is stolen (XSS, MITM, log leak), the attacker can generate access tokens INDEFINITELY. No expiry = permanent compromise until the user changes password or the token is explicitly revoked. **Best practices:** Refresh token rotation (issue new refresh token on each use, invalidate old one). Short-lived access tokens (15-60 min). Refresh tokens stored in `httpOnly` cookies (not localStorage — XSS safe). Refresh token families (if a reused refresh token is detected, invalidate the entire family). Absolute max lifetime: force re-login after 30 days regardless.

</details>

## Chapter 9: OAuth2 / Social Login

# 📌 Section 4: Other Auth Methods

---

## Chapter 9: OAuth2 / Social Login

### OAuth2 Authorization Code Flow — Visual Diagram

**OAuth2 authorization code flow** (the most common and most secure flow for web apps)

```mermaid
sequenceDiagram
  participant U as User (browser)
  participant A as Your app (Spring Boot)
  participant AS as Auth server (Google/GitHub)
  participant RS as Resource server (Google API etc.)
  U->>A: click "Login with Google"
  Note over U,AS: Step 1: redirect to the auth server
  A-->>U: 302 redirect to accounts.google.com/auth?client_id=YOUR_APP&redirect_uri=/callback&scope=email+profile&response_type=code&state=random_csrf_token
  Note over U,AS: Step 2: the user logs in at the auth server
  U->>AS: email + password
  AS->>AS: verify credentials
  Note over U,AS: Step 3: "Allow this app?" consent
  AS-->>U: consent screen
  U->>AS: "Yes, Allow"
  Note over U,AS: Step 4: the auth server redirects back with a CODE
  AS-->>U: 302 redirect to yourapp.com/callback?code=AUTH_CODE_abc123&state=random_csrf_token
  U->>A: /callback
  Note over A,AS: Step 5: exchange the code for tokens (SERVER-TO-SERVER)
  A->>AS: POST /token (code, client_id, client_secret)
  AS-->>A: access_token, refresh_token, id_token (OIDC)
  Note over A,RS: Step 6: use the access token to get user info
  A->>RS: GET /userinfo (Bearer token)
  RS-->>A: { email, name, picture }
  Note over U,A: Step 7: create a session, redirect to the dashboard
  A-->>U: Set-Cookie: JSESSIONID
```

**How to read this diagram.** The browser only ever carries a short-lived authorization code. Your server exchanges that code for tokens directly with the auth server, so the tokens never reach the browser.

**Why authorization code (not implicit)?**

- The code is exchanged server-side, so the token is NEVER exposed to the browser.
- `client_secret` stays on the server, so it can't be stolen from JavaScript.
- Refresh tokens are possible, giving long-lived sessions without re-login.

**Security checklist**

- ✅ Validate the `state` parameter (prevents CSRF).
- ✅ Use HTTPS everywhere.
- ✅ Store tokens server-side (not in `localStorage`).
- ✅ Validate that `redirect_uri` matches the registered URI.
- ✅ Use PKCE for public clients (mobile and SPA).

```java
// ═══════════════════════════════════════════════════════════════════════════════
// OAuth2 LOGIN (Google, GitHub, Facebook, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

// application.yml
// spring:
//   security:
//     oauth2:
//       client:
//         registration:
//           google:
//             client-id: ${GOOGLE_CLIENT_ID}
//             client-secret: ${GOOGLE_CLIENT_SECRET}
//             scope: openid, profile, email
//           github:
//             client-id: ${GITHUB_CLIENT_ID}
//             client-secret: ${GITHUB_CLIENT_SECRET}
//             scope: user:email, read:user

// pom.xml: spring-boot-starter-oauth2-client

@Configuration
@EnableWebSecurity
public class OAuth2SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login**", "/error**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard", true)
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService())
                )
            );

        return http.build();
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService() {
        return new CustomOAuth2UserService();
    }
}


@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate =
            new DefaultOAuth2UserService();
        OAuth2User oauth2User = delegate.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId();  // "google", "github"
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        // Find or create user
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setFirstName(name);
                newUser.setProvider(provider);
                newUser.setRoles(Set.of(Role.USER));
                return userRepository.save(newUser);
            });

        return new CustomOAuth2User(oauth2User, user);
    }
}
```

---

🔬 **Section Challenge — Chapter 9: OAuth2 / Social Login**

**Challenge 1 (OAuth2 Scopes and Resource Server Token Validation):** Your Spring Boot API is an OAuth2 Resource Server. A client sends an access token with scope `read:users`. **Who** validates the scope? **When** does Spring Security auto-reject the request? **What** annotation enforces scope-based access on a method?

<details><summary>Answer</summary>

**Who validates the scope:** Spring Security's `JwtAuthenticationConverter` + `SecurityFilterChain`. The JWT is decoded, scopes extracted from the `scope` or `scp` claim. A `JwtGrantedAuthoritiesConverter` maps each scope to an authority: `read:users` → `SCOPE_read:users`. **When Spring Security auto-rejects:** If the endpoint requires `hasAuthority('SCOPE_write:users')` and the token only has `SCOPE_read:users`, the security filter returns `403 Forbidden`. The request is rejected BEFORE reaching the controller. **Annotation for scope-based method access:** `@PreAuthorize("hasAuthority('SCOPE_read:users')")` on the method. Or configure in `SecurityFilterChain`: `.requestMatchers("/users/**").hasAuthority("SCOPE_read:users")`. **JWT scope claim format varies:** Auth0: `"scope": "read:users write:orders"` (space-separated string). Okta/Keycloak: `"scp": ["read:users", "write:orders"]` (array). Spring's `JwtGrantedAuthoritiesConverter` handles both. **Resource server setup:** `spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://auth-server/.well-known/jwks.json`. Spring fetches public keys automatically and validates signatures without storing tokens locally.

</details>

## Chapter 10: API Key Authentication

```java
// ═══════════════════════════════════════════════════════════════════════════════
// API KEY AUTHENTICATION (for service-to-service or simple API access)
// ═══════════════════════════════════════════════════════════════════════════════

@Component
@RequiredArgsConstructor
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey != null && !apiKey.isEmpty()) {
            ApiKeyDetails keyDetails = apiKeyService.validateKey(apiKey);

            if (keyDetails != null) {
                // Create authentication
                ApiKeyAuthenticationToken authToken =
                    new ApiKeyAuthenticationToken(keyDetails, keyDetails.getPermissions());

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Skip for auth endpoints
        return request.getRequestURI().startsWith("/api/auth/");
    }
}


@Entity
@Table(name = "api_keys")
@Getter
@Setter
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String keyHash;  // Store hashed key

    private String name;

    private String description;

    @ManyToOne
    private User owner;

    @ElementCollection
    private Set<String> permissions = new HashSet<>();

    private boolean active = true;

    private LocalDateTime expiresAt;

    private LocalDateTime lastUsedAt;
}


@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;

    public String generateKey(User owner, String name, Set<String> permissions) {
        // Generate random key
        String rawKey = "sk_" + UUID.randomUUID().toString().replace("-", "");

        // Save hashed key
        ApiKey apiKey = new ApiKey();
        apiKey.setKeyHash(passwordEncoder.encode(rawKey));
        apiKey.setOwner(owner);
        apiKey.setName(name);
        apiKey.setPermissions(permissions);
        apiKey.setExpiresAt(LocalDateTime.now().plusYears(1));

        apiKeyRepository.save(apiKey);

        // Return raw key (show only once!)
        return rawKey;
    }

    public ApiKeyDetails validateKey(String rawKey) {
        // Find all active keys and check hash
        // (In production, use prefix lookup for efficiency)
        return apiKeyRepository.findByActiveTrue().stream()
            .filter(key -> passwordEncoder.matches(rawKey, key.getKeyHash()))
            .filter(key -> key.getExpiresAt().isAfter(LocalDateTime.now()))
            .findFirst()
            .map(key -> {
                // Update last used
                key.setLastUsedAt(LocalDateTime.now());
                apiKeyRepository.save(key);

                return new ApiKeyDetails(key);
            })
            .orElse(null);
    }
}


// Usage in Postman:
// GET http://localhost:8080/api/data
// Headers:
//   X-API-Key: sk_abc123def456...
```

---

## Chapter 11: Basic Authentication

```java
// ═══════════════════════════════════════════════════════════════════════════════
// BASIC AUTHENTICATION (Simple username:password in header)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Header format: Authorization: Basic base64(username:password)
// Example: Authorization: Basic am9obkB0ZXN0LmNvbTpzZWNyZXQxMjM=
//
// ⚠️ WARNING: Basic Auth sends credentials with EVERY request
// Only use with HTTPS in production!


@Configuration
@EnableWebSecurity
public class BasicAuthSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults());  // Enable basic auth

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // In-memory users (for testing only!)
        UserDetails user = User.builder()
            .username("user@test.com")
            .password(passwordEncoder().encode("password"))
            .roles("USER")
            .build();

        UserDetails admin = User.builder()
            .username("admin@test.com")
            .password(passwordEncoder().encode("admin123"))
            .roles("USER", "ADMIN")
            .build();

        return new InMemoryUserDetailsManager(user, admin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}


// Testing in Postman:
// 1. Go to Authorization tab
// 2. Type: Basic Auth
// 3. Username: user@test.com
// 4. Password: password
// Postman auto-generates the encoded header
```

---

# 💪 Security Best Practices Checklist

**SECURITY CHECKLIST**

```text
AUTHENTICATION:
□ Use BCrypt for password hashing (never plain text or MD5/SHA1)
□ Implement rate limiting on login endpoints
□ Use short-lived access tokens (15-60 min)
□ Use longer-lived refresh tokens (7-30 days)
□ Store refresh tokens securely (database with user binding)
□ Implement token blacklisting for logout
□ Use HTTPS everywhere in production

AUTHORIZATION:
□ Implement principle of least privilege
□ Use role-based OR permission-based access control
□ Validate resource ownership (user can only access their data)
□ Never trust client-side authorization

JWT SPECIFIC:
□ Use strong secret key (min 256 bits for HS256)
□ Set appropriate expiration times
□ Don't store sensitive data in JWT payload (it's just Base64!)
□ Validate all claims (iss, aud, exp)

GENERAL:
□ Disable CSRF only for stateless APIs
□ Implement proper CORS configuration
□ Log authentication failures (but not passwords!)
□ Use security headers (X-Content-Type-Options, X-Frame-Options)
□ Keep dependencies updated
□ Conduct regular security audits
```

---

_Continue to Part 12: DSA in Spring Boot Applications_

---

> **Navigation**: [< Previous](Ch42_SB_HTTP_Deep_Dive.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch50_SB_DSA_Applications.md)


---

## Reality Check

**"Storing passwords as MD5 or SHA-256 hashes is secure"** → MD5 and SHA-256 are fast hashing algorithms — intentionally so. For passwords, speed is a vulnerability: a GPU can compute 10 billion MD5 hashes per second. Pre-computed rainbow tables defeat unsalted hashes. Use bcrypt, scrypt, or Argon2 — deliberately slow password hashing algorithms with built-in salting. Spring Security's `BCryptPasswordEncoder` is correct. SHA-256 for passwords is a security bug.

**"HTTPS means my API is secure"** → HTTPS encrypts data in transit. It does NOT protect against: SQL injection in your query layer, broken access control (user A accessing user B's data), IDOR (Insecure Direct Object Reference), XSS if you render unsanitized user content, misconfigured CORS allowing any origin, storing secrets in application.properties in git.

**"JWT tokens are encrypted — the user cannot read them"** → Standard JWTs are BASE64-ENCODED, not encrypted. Base64 is trivially reversible. The payload (claims: user ID, roles, expiry) is readable by anyone holding the token. JWT provides *integrity* (the signature prevents tampering) but NOT *confidentiality*. Never put sensitive data (SSN, credit card, passwords) in a JWT payload unless you use JWE (JSON Web Encryption).

**"Session-based auth is old; JWT is always better"** → Session auth stores state server-side — easy to invalidate (logout = delete session). JWT is stateless — you cannot invalidate a token before its expiry without a server-side blocklist (which re-introduces state, defeating the benefit). For short-lived access tokens + refresh token rotation, JWT makes sense. For server-rendered apps or when immediate revocation is needed, sessions may be better.

**"Disabling CORS restrictions fixes my CORS error"** → CORS (Cross-Origin Resource Sharing) is enforced by the *browser*. API clients (curl, Postman, server-side code) are not subject to CORS. If you disable CORS via `@CrossOrigin(origins = "*")`, your API accepts requests from ANY website's JavaScript — including malicious ones that can make authenticated requests using the user's cookies. Only allow specific trusted origins.
