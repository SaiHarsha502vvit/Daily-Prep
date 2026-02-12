# 🔐 SPRING BOOT MASTERY - Part 11: Authentication & Authorization

> **Securing Your Applications**
> _"Security is not a feature, it's a requirement"_

---

# SECTION 1: AUTHENTICATION vs AUTHORIZATION

---

## Chapter 1: Understanding the Difference

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION vs AUTHORIZATION                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────┬──────────────────────────────────────┐   │
│  │      AUTHENTICATION (AuthN)      │      AUTHORIZATION (AuthZ)           │   │
│  ├──────────────────────────────────┼──────────────────────────────────────┤   │
│  │                                  │                                      │   │
│  │  "WHO are you?"                  │  "WHAT can you do?"                  │   │
│  │                                  │                                      │   │
│  │  Verifies IDENTITY               │  Verifies PERMISSIONS                │   │
│  │                                  │                                      │   │
│  │  Happens FIRST                   │  Happens AFTER authentication       │   │
│  │                                  │                                      │   │
│  │  Examples:                       │  Examples:                           │   │
│  │  • Username + Password           │  • User can view their own data     │   │
│  │  • Fingerprint                   │  • Admin can delete any user        │   │
│  │  • Face ID                       │  • Manager can approve requests     │   │
│  │  • JWT Token                     │  • Guest can only read              │   │
│  │                                  │                                      │   │
│  │  HTTP Status: 401 Unauthorized   │  HTTP Status: 403 Forbidden         │   │
│  │                                  │                                      │   │
│  └──────────────────────────────────┴──────────────────────────────────────┘   │
│                                                                                  │
│  REAL-WORLD ANALOGY:                                                            │
│  ═══════════════════                                                            │
│                                                                                  │
│  AIRPORT SECURITY:                                                              │
│                                                                                  │
│  1. AUTHENTICATION: Show your ID/Passport at checkpoint                         │
│     "Are you really John Smith?" ✓                                              │
│                                                                                  │
│  2. AUTHORIZATION: Check your boarding pass                                     │
│     "Can you enter the First Class lounge?" ✗                                  │
│     "Can you board Flight AA123?" ✓                                            │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│  IN CODE:                                                                        │
│                                                                                  │
│  User logs in with email/password → AUTHENTICATION                              │
│  System returns JWT token                                                       │
│                                                                                  │
│  User tries to access /admin/users → AUTHORIZATION                              │
│  System checks: Does this user have ADMIN role? No → 403 Forbidden             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 2: Spring Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              SPRING SECURITY FILTER CHAIN                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HTTP Request                                                                   │
│       │                                                                         │
│       ▼                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    SECURITY FILTER CHAIN                                │   │
│  │                                                                         │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 1. SecurityContextPersistenceFilter                           │    │   │
│  │  │    → Loads SecurityContext from session                       │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                            │                                           │   │
│  │                            ▼                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 2. LogoutFilter                                                │    │   │
│  │  │    → Handles /logout URL                                       │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                            │                                           │   │
│  │                            ▼                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 3. UsernamePasswordAuthenticationFilter                       │    │   │
│  │  │    → Handles form login (/login POST)                         │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                            │                                           │   │
│  │                            ▼                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 4. BasicAuthenticationFilter                                   │    │   │
│  │  │    → Handles HTTP Basic Auth header                           │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                            │                                           │   │
│  │                            ▼                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 5. BearerTokenAuthenticationFilter (for JWT)                  │    │   │
│  │  │    → Validates JWT from Authorization header                   │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                            │                                           │   │
│  │                            ▼                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 6. ExceptionTranslationFilter                                 │    │   │
│  │  │    → Converts security exceptions to HTTP responses           │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                            │                                           │   │
│  │                            ▼                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 7. FilterSecurityInterceptor / AuthorizationFilter            │    │   │
│  │  │    → Final authorization check (can user access this URL?)    │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│       │                                                                         │
│       ▼                                                                         │
│  Controller (if all filters pass)                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 2: JWT AUTHENTICATION (Most Common)

---

## Chapter 3: JWT (JSON Web Token) Explained

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         JWT STRUCTURE                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.                                          │
│  eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.        │
│  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c                                   │
│                                                                                  │
│  ─────────────────┬─────────────────────────────────────────┬──────────────     │
│       HEADER      │              PAYLOAD                    │   SIGNATURE       │
│     (Base64)      │            (Base64)                     │   (Base64)        │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│  HEADER (Algorithm + Type):                                                     │
│  ══════════════════════════                                                     │
│  {                                                                              │
│    "alg": "HS256",    ← Algorithm used to sign                                 │
│    "typ": "JWT"       ← Token type                                             │
│  }                                                                              │
│                                                                                  │
│  PAYLOAD (Claims - the actual data):                                           │
│  ════════════════════════════════════                                           │
│  {                                                                              │
│    "sub": "1234567890",     ← Subject (user ID)                                │
│    "name": "John Doe",      ← Custom claim                                     │
│    "email": "john@test.com",                                                   │
│    "roles": ["USER", "ADMIN"],                                                 │
│    "iat": 1516239022,       ← Issued At (Unix timestamp)                       │
│    "exp": 1516242622        ← Expiration (Unix timestamp)                      │
│  }                                                                              │
│                                                                                  │
│  SIGNATURE:                                                                     │
│  ══════════                                                                     │
│  HMACSHA256(                                                                    │
│    base64UrlEncode(header) + "." + base64UrlEncode(payload),                   │
│    secret_key                                                                   │
│  )                                                                              │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│  WHY JWT?                                                                       │
│  ════════                                                                       │
│                                                                                  │
│  ✅ STATELESS: Server doesn't need to store sessions                           │
│  ✅ SCALABLE: Works across multiple servers (no session sharing)               │
│  ✅ MOBILE-FRIENDLY: Easy to send in header                                    │
│  ✅ SELF-CONTAINED: Contains all user info needed                              │
│  ✅ CROSS-DOMAIN: Works for APIs consumed by different clients                 │
│                                                                                  │
│  ⚠️ CAUTION:                                                                   │
│  • Cannot invalidate individual tokens (use short expiry + refresh tokens)     │
│  • Payload is only Base64 encoded, NOT encrypted (don't put secrets)          │
│  • Token size can grow large with many claims                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 4: JWT Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JWT AUTHENTICATION FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STEP 1: LOGIN                                                                  │
│  ═════════════                                                                  │
│                                                                                  │
│  Client                              Server                                     │
│    │                                    │                                       │
│    │  POST /api/auth/login              │                                       │
│    │  {                                 │                                       │
│    │    "email": "john@test.com",       │                                       │
│    │    "password": "secret123"         │                                       │
│    │  }                                 │                                       │
│    │ ──────────────────────────────────►│                                       │
│    │                                    │ 1. Find user by email                │
│    │                                    │ 2. Verify password hash              │
│    │                                    │ 3. Generate JWT token                │
│    │                                    │                                       │
│    │        200 OK                      │                                       │
│    │  {                                 │                                       │
│    │    "accessToken": "eyJhbG...",     │                                       │
│    │    "refreshToken": "eyJhbG...",    │                                       │
│    │    "expiresIn": 3600               │                                       │
│    │  }                                 │                                       │
│    │ ◄──────────────────────────────────│                                       │
│    │                                    │                                       │
│                                                                                  │
│  STEP 2: ACCESS PROTECTED RESOURCE                                              │
│  ═════════════════════════════════                                              │
│                                                                                  │
│  Client                              Server                                     │
│    │                                    │                                       │
│    │  GET /api/users/me                 │                                       │
│    │  Authorization: Bearer eyJhbG...   │                                       │
│    │ ──────────────────────────────────►│                                       │
│    │                                    │ 1. Extract token from header         │
│    │                                    │ 2. Validate signature                │
│    │                                    │ 3. Check expiration                  │
│    │                                    │ 4. Extract user from token           │
│    │                                    │ 5. Process request                   │
│    │                                    │                                       │
│    │        200 OK                      │                                       │
│    │  {                                 │                                       │
│    │    "id": 123,                      │                                       │
│    │    "name": "John Doe"              │                                       │
│    │  }                                 │                                       │
│    │ ◄──────────────────────────────────│                                       │
│    │                                    │                                       │
│                                                                                  │
│  STEP 3: TOKEN EXPIRED - REFRESH                                                │
│  ════════════════════════════════                                               │
│                                                                                  │
│  Client                              Server                                     │
│    │                                    │                                       │
│    │  POST /api/auth/refresh            │                                       │
│    │  {                                 │                                       │
│    │    "refreshToken": "eyJhbG..."     │                                       │
│    │  }                                 │                                       │
│    │ ──────────────────────────────────►│                                       │
│    │                                    │ 1. Validate refresh token            │
│    │                                    │ 2. Generate new access token         │
│    │                                    │                                       │
│    │        200 OK                      │                                       │
│    │  {                                 │                                       │
│    │    "accessToken": "new_eyJhbG...", │                                       │
│    │    "expiresIn": 3600               │                                       │
│    │  }                                 │                                       │
│    │ ◄──────────────────────────────────│                                       │
│    │                                    │                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

## Chapter 8: Testing in Postman

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TESTING AUTH IN POSTMAN                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STEP 1: REGISTER USER                                                          │
│  ═════════════════════                                                          │
│                                                                                  │
│  POST http://localhost:8080/api/auth/register                                   │
│                                                                                  │
│  Body (raw JSON):                                                               │
│  {                                                                              │
│    "email": "john@test.com",                                                   │
│    "password": "MySecret123!",                                                 │
│    "firstName": "John",                                                        │
│    "lastName": "Doe"                                                           │
│  }                                                                              │
│                                                                                  │
│  Response:                                                                       │
│  {                                                                              │
│    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInJvbGVzIjo...",      │
│    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huQHRlc3Qu...",        │
│    "tokenType": "Bearer",                                                       │
│    "expiresIn": 3600                                                            │
│  }                                                                              │
│                                                                                  │
│                                                                                  │
│  STEP 2: LOGIN                                                                   │
│  ═════════════                                                                   │
│                                                                                  │
│  POST http://localhost:8080/api/auth/login                                      │
│                                                                                  │
│  Body (raw JSON):                                                               │
│  {                                                                              │
│    "email": "john@test.com",                                                   │
│    "password": "MySecret123!"                                                  │
│  }                                                                              │
│                                                                                  │
│  → Save accessToken to environment variable!                                    │
│                                                                                  │
│  Tests tab (auto-save token):                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ var json = pm.response.json();                                        │    │
│  │ pm.environment.set("accessToken", json.accessToken);                  │    │
│  │ pm.environment.set("refreshToken", json.refreshToken);                │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│                                                                                  │
│  STEP 3: ACCESS PROTECTED ENDPOINT                                              │
│  ═════════════════════════════════                                              │
│                                                                                  │
│  GET http://localhost:8080/api/users/me                                        │
│                                                                                  │
│  Headers:                                                                        │
│  ┌───────────────────┬──────────────────────────────────────────┐              │
│  │ Key               │ Value                                    │              │
│  ├───────────────────┼──────────────────────────────────────────┤              │
│  │ Authorization     │ Bearer {{accessToken}}                   │              │
│  └───────────────────┴──────────────────────────────────────────┘              │
│                                                                                  │
│  OR use Authorization tab:                                                      │
│  • Type: Bearer Token                                                           │
│  • Token: {{accessToken}}                                                       │
│                                                                                  │
│                                                                                  │
│  STEP 4: TEST 401 UNAUTHORIZED                                                  │
│  ═════════════════════════════                                                  │
│                                                                                  │
│  GET http://localhost:8080/api/users/me                                        │
│  (without Authorization header)                                                 │
│                                                                                  │
│  Expected Response: 401 Unauthorized                                            │
│  {                                                                              │
│    "error": "Unauthorized",                                                    │
│    "message": "Full authentication is required"                                │
│  }                                                                              │
│                                                                                  │
│                                                                                  │
│  STEP 5: TEST 403 FORBIDDEN                                                     │
│  ══════════════════════════                                                     │
│                                                                                  │
│  GET http://localhost:8080/api/admin/users                                     │
│  Authorization: Bearer {{accessToken}} (USER role, not ADMIN)                  │
│                                                                                  │
│  Expected Response: 403 Forbidden                                               │
│  {                                                                              │
│    "error": "Forbidden",                                                       │
│    "message": "Access denied"                                                  │
│  }                                                                              │
│                                                                                  │
│                                                                                  │
│  STEP 6: REFRESH TOKEN                                                          │
│  ═════════════════════                                                          │
│                                                                                  │
│  POST http://localhost:8080/api/auth/refresh                                   │
│                                                                                  │
│  Body:                                                                          │
│  {                                                                              │
│    "refreshToken": "{{refreshToken}}"                                          │
│  }                                                                              │
│                                                                                  │
│  → Gets new accessToken without re-entering password                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 4: OTHER AUTH METHODS

---

## Chapter 9: OAuth2 / Social Login

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

# SECURITY BEST PRACTICES CHECKLIST

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKLIST                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AUTHENTICATION:                                                                 │
│  □ Use BCrypt for password hashing (never plain text or MD5/SHA1)              │
│  □ Implement rate limiting on login endpoints                                   │
│  □ Use short-lived access tokens (15-60 min)                                   │
│  □ Use longer-lived refresh tokens (7-30 days)                                 │
│  □ Store refresh tokens securely (database with user binding)                  │
│  □ Implement token blacklisting for logout                                     │
│  □ Use HTTPS everywhere in production                                          │
│                                                                                  │
│  AUTHORIZATION:                                                                  │
│  □ Implement principle of least privilege                                       │
│  □ Use role-based OR permission-based access control                           │
│  □ Validate resource ownership (user can only access their data)               │
│  □ Never trust client-side authorization                                        │
│                                                                                  │
│  JWT SPECIFIC:                                                                   │
│  □ Use strong secret key (min 256 bits for HS256)                             │
│  □ Set appropriate expiration times                                            │
│  □ Don't store sensitive data in JWT payload (it's just Base64!)              │
│  □ Validate all claims (iss, aud, exp)                                        │
│                                                                                  │
│  GENERAL:                                                                        │
│  □ Disable CSRF only for stateless APIs                                        │
│  □ Implement proper CORS configuration                                          │
│  □ Log authentication failures (but not passwords!)                            │
│  □ Use security headers (X-Content-Type-Options, X-Frame-Options)             │
│  □ Keep dependencies updated                                                    │
│  □ Conduct regular security audits                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

_Continue to Part 12: DSA in Spring Boot Applications_
