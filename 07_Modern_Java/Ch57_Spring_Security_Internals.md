**Navigation**: [< Previous](Ch56_Hibernate_JPA_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch65_OS_Fundamentals.md)

# 🔐 Chapter 38 — Spring Security Internals: How Every HTTP Request Gets Secured

**"When you hit /api/users with a JWT token, Spring Security doesn't use magic. It runs your request through a chain of 15+ filters, each doing ONE job — extract the token, validate it, create an Authentication object, store it in SecurityContext, then decide if you're ALLOWED to access that endpoint. Fail at any filter? 401/403."**

---

## PART 0: The 5W+H Framework

**Mental Model:** Think of Spring Security as an airport security system. Authentication (AuthN) is the passport control verifying who you are. Authorization (AuthZ) is the ticket checker deciding if you're allowed to enter the VIP lounge or board a specific flight.

| Question | Spring Security Context |
| :--- | :--- |
| **WHAT** | A powerful, highly customizable authentication and access-control framework that protects Java applications from common vulnerabilities (CSRF, session fixation). |
| **WHY** | To ensure only verified users can access the system (Authentication) and that they can only touch data they are permitted to see (Authorization), while abstracting the immense complexity of modern security protocols. |
| **WHEN** | Used essentially in *every* production Spring application that handles user data, exposes APIs, or manages internal administrative dashboards. |
| **WHERE** | Implemented as a chain of highly specialized Servlet Filters (`DelegatingFilterProxy` -> `FilterChainProxy`) that intercept every single HTTP request before it reaches your Controllers. |
| **WHO** | Maintained by the Spring team, deeply integrated with the Spring ecosystem, but capable of operating independently. |
| **HOW** | Uses an `AuthenticationManager` to verify credentials, stores the result in a thread-local `SecurityContext`, and uses `AuthorizationManager` (and AOP for `@PreAuthorize`) to enforce access rules. |

### Where It's Used in Real World
*   **Stateless REST APIs**: Verifying JSON Web Tokens (JWT) for mobile apps or single-page applications (React/Angular) on every request without maintaining sessions.
*   **SSO & Federated Login**: Allowing users to log in explicitly via "Sign in with Google/GitHub" using OAuth2 and OpenID Connect flows.
*   **Enterprise Intranets**: Integrating with corporate Active Directory/LDAP servers to manage internal employee access using fine-grained Role-Based Access Control (RBAC).
*   **Zero-Trust Microservices**: Securing internal service-to-service communication using client credentials and mutual TLS.

---

## Table of Contents

1. [The Big Picture — What Happens to Every Request](#1-the-big-picture--what-happens-to-every-request)
2. [The Filter Chain — The Core Architecture](#2-the-filter-chain--the-core-architecture)
3. [Authentication vs Authorization — Two Different Questions](#3-authentication-vs-authorization--two-different-questions)
4. [SecurityContext and ThreadLocal — Where "Current User" Lives](#4-securitycontext-and-threadlocal--where-current-user-lives)
5. [How Username/Password Authentication Works (All 12 Steps)](#5-how-usernamepassword-authentication-works-all-12-steps)
6. [How JWT Authentication Works (All 10 Steps)](#6-how-jwt-authentication-works-all-10-steps)
7. [How Authorization Decisions Are Made](#7-how-authorization-decisions-are-made)
8. [How @PreAuthorize Works Under the Hood](#8-how-preauthorize-works-under-the-hood)
9. [CORS and CSRF — Why They Exist and How Spring Handles Them](#9-cors-and-csrf--why-they-exist-and-how-spring-handles-them)
10. [How to Configure Security — Modern Way (Spring Security 6+)](#10-how-to-configure-security--modern-way-spring-security-6)
11. [OAuth2 / OpenID Connect Flow](#11-oauth2--openid-connect-flow)
12. [Common Security Mistakes and Fixes](#12-common-security-mistakes-and-fixes)

---

## 1. The Big Picture — What Happens to Every Request

```
  Client sends HTTP Request
       │
       ▼
  ┌─── Tomcat (Servlet Container) ─────────────────────────────────┐
  │                                                                │
  │  DelegatingFilterProxy                                         │
  │  (Bridge between Servlet world and Spring world)               │
  │       │                                                        │
  │       ▼                                                        │
  │  FilterChainProxy (Spring Security's entry point)              │
  │       │                                                        │
  │       ├── Match request to SecurityFilterChain                 │
  │       │   (you can have MULTIPLE chains for different paths)   │
  │       │   /api/** → chain with JWT filters                     │
  │       │   /admin/** → chain with session + RBAC filters        │
  │       │   /public/** → chain that permits all                  │
  │       │                                                        │
  │       ▼                                                        │
  │  SecurityFilterChain (ordered list of filters)                 │
  │  ┌──────────────────────────────────────────────────────┐      │
  │  │ Filter 1: DisableEncodeUrlFilter                     │      │
  │  │ Filter 2: WebAsyncManagerIntegrationFilter           │      │
  │  │ Filter 3: SecurityContextHolderFilter                │      │
  │  │ Filter 4: HeaderWriterFilter                         │      │
  │  │ Filter 5: CorsFilter                                 │      │
  │  │ Filter 6: CsrfFilter                                 │      │
  │  │ Filter 7: LogoutFilter                               │      │
  │  │ Filter 8: UsernamePasswordAuthenticationFilter       │      │
  │  │ Filter 9: DefaultLoginPageGeneratingFilter           │      │
  │  │ Filter 10: BasicAuthenticationFilter                 │      │
  │  │ Filter 11: RequestCacheAwareFilter                   │      │
  │  │ Filter 12: SecurityContextHolderAwareRequestFilter   │      │
  │  │ Filter 13: AnonymousAuthenticationFilter             │      │
  │  │ Filter 14: ExceptionTranslationFilter                │      │
  │  │ Filter 15: AuthorizationFilter                       │      │
  │  └──────────────────────────────────────────────────────┘      │
  │       │                                                        │
  │       ▼                                                        │
  │  DispatcherServlet → Controller → Service → Repository         │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
```

---

## 2. The Filter Chain — The Core Architecture

### What Each Key Filter Does

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  FILTER                          │  JOB                                 │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  SecurityContextHolderFilter     │  Load SecurityContext from repo      │
  │                                  │  (HttpSession for sessions,          │
  │                                  │   empty for stateless JWT)           │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  CorsFilter                      │  Handle CORS preflight OPTIONS       │
  │                                  │  Add Access-Control-Allow-* headers  │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  CsrfFilter                      │  Validate CSRF token for state-      │
  │                                  │  changing requests (POST/PUT/DELETE) │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  LogoutFilter                    │  Intercept POST /logout              │
  │                                  │  Clear session, cookies, context     │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  UsernamePasswordAuthFilter      │  Intercept POST /login               │
  │                                  │  Extract username/password from form │
  │                                  │  Delegate to AuthenticationManager   │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  BasicAuthenticationFilter       │  Extract credentials from            │
  │                                  │  Authorization: Basic header         │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  AnonymousAuthenticationFilter   │  If no auth yet, create anonymous    │
  │                                  │  Authentication (role_ANONYMOUS)     │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  ExceptionTranslationFilter      │  Catch AuthenticationException →     │
  │                                  │  redirect to login or send 401       │
  │                                  │  Catch AccessDeniedException → 403   │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  AuthorizationFilter             │  Check if current Authentication     │
  │                                  │  has permission for this URL         │
  │                                  │  (replaces old FilterSecurityInter.) │
  └──────────────────────────────────────────────────────────────────────────┘
```

### Filter Ordering Matters!

```
  Authentication filters MUST come BEFORE authorization filters.
  
  WHY:
  AuthorizationFilter asks: "Does this user have ROLE_ADMIN?"
  But WHO is "this user"?
  → Set by an authentication filter earlier in the chain
  → If auth filter hasn't run yet, user is "anonymous"
  → Anonymous doesn't have ROLE_ADMIN → 403!
  
  ORDER RULE:
  1. Context loading (who was already logged in?)
  2. CORS/CSRF (infrastructure)
  3. Authentication (who ARE you?)
  4. Authorization (what can you DO?)
```

---



🔬 **Section Challenge — 2. The Filter Chain — The Core Architecture**

**Challenge 1 (Engineering):** A monolithic application fires an `@Async` background event to send an email upon successful user registration, extracting the current user's email via `SecurityContextHolder.getContext().getAuthentication().getName()`. Intermittently, the system crashes with a `NullPointerException`, and logs reveal `getAuthentication()` is returning `null`. Why does this happen, and how do you resolve it architecturally?
<details><summary>Answer</summary>

**Scenario:** Background execution threads fail to access the authenticated user's context, leading to intermittent NPEs.
**Trace:** `SecurityContextHolder` uses a `ThreadLocal` strategy by default (`MODE_THREADLOCAL`). The context is exclusively bound to the Tomcat HTTP worker thread that intercepted the request. When `@Async` delegates execution to a separate thread pool (`TaskExecutor`), the newly spawned worker thread has an empty `ThreadLocal` state.
**Debug/Fix:** Do not rely on `MODE_INHERITABLETHREADLOCAL` in thread-pooled environments, as worker threads are reused, risking severe security cross-contamination where User B might inherit User A's context. The architectural fix is to wrap the thread pool with Spring Security's concurrency utilities. Configure the `@Async` executor to return a `DelegatingSecurityContextExecutor`, which explicitly propagates and clears the `SecurityContext` across thread boundaries safely for each task execution.
</details>


## 3. Authentication vs Authorization — Two Different Questions

```
  AUTHENTICATION (AuthN)               AUTHORIZATION (AuthZ)
  ══════════════════════               ══════════════════════
  "WHO are you?"                       "WHAT can you do?"
                                       
  Input: credentials                   Input: authenticated user + resource
  (username/password, JWT, OAuth)      
                                       
  Output: Authentication object        Output: allow / deny
  (principal, authorities)             
                                       
  When: During login or                When: Every request,
  token validation                     after authentication
                                       
  Failure: 401 Unauthorized            Failure: 403 Forbidden
                                       
  Spring class:                        Spring class:
  AuthenticationManager                AuthorizationManager
  AuthenticationProvider               (or @PreAuthorize)


  THE AUTHENTICATION OBJECT:
  ══════════════════════════

  public interface Authentication extends Principal {
      Collection<? extends GrantedAuthority> getAuthorities();
      Object getCredentials();   // password (usually erased after auth)
      Object getDetails();       // IP, session ID, etc.
      Object getPrincipal();     // UserDetails (your user object)
      boolean isAuthenticated();
  }
  
  Concrete implementation (most common):
  UsernamePasswordAuthenticationToken {
      principal = UserDetails { username="harsha", authorities=[ROLE_USER] }
      credentials = null  (erased after successful auth)
      authorities = [SimpleGrantedAuthority("ROLE_USER")]
      isAuthenticated = true
  }
```

---



🔬 **Section Challenge — 3. Authentication vs Authorization — Two Different Questions**

**Challenge 1 (Engineering):** A REST API returns `401 Unauthorized` for an endpoint secured with `@PreAuthorize("hasRole('ADMIN')")`, even though the user successfully logged in as an administrator. Logs show that `Authentication.isAuthenticated()` is `true`. Why is the server returning a 401 instead of a 403, and what architectural misconfiguration causes this?
<details><summary>Answer</summary>

**Scenario:** An authenticated admin receives an Authentication error (401) instead of an Authorization evaluation (403 or 200).
**Trace:** In the Spring Security Filter Chain, the `AuthorizationFilter` evaluates `@PreAuthorize` rules. If an `AccessDeniedException` is thrown, the `ExceptionTranslationFilter` intercepts it. It checks if the user is authenticated. However, if the `Authentication` object represents an *Anonymous* user (or if the token filter failed to populate the `SecurityContext` for this specific request), it assumes the user isn't logged in and returns a 401. If the user *is* authenticated but lacks the role, it returns a 403. If a 401 is returned despite a "successful" login, the state is being lost.
**Debug/Fix:** This happens in stateless JWT architectures when the `JwtAuthenticationFilter` is placed *after* the `AuthorizationFilter` in the security chain, or if the JWT is missing from the `Authorization` header on this specific client request. Fix the order by explicitly configuring `.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`.
</details>

## 4. SecurityContext and ThreadLocal — Where "Current User" Lives

```
  HOW SPRING KNOWS WHO THE CURRENT USER IS:
  ═══════════════════════════════════════════

  Thread-1 (handling /api/orders for Harsha):
  ┌────────────────────────────────────────────────────────────┐
  │ ThreadLocal<SecurityContext>                                │
  │   └── SecurityContextImpl                                  │
  │        └── Authentication                                  │
  │             ├── principal = UserDetails{username="harsha"}  │
  │             ├── authorities = [ROLE_USER, ROLE_ADMIN]       │
  │             └── isAuthenticated = true                       │
  └────────────────────────────────────────────────────────────┘

  Thread-2 (handling /api/products for John):
  ┌────────────────────────────────────────────────────────────┐
  │ ThreadLocal<SecurityContext>                                │
  │   └── SecurityContextImpl                                  │
  │        └── Authentication                                  │
  │             ├── principal = UserDetails{username="john"}    │
  │             ├── authorities = [ROLE_USER]                   │
  │             └── isAuthenticated = true                       │
  └────────────────────────────────────────────────────────────┘
  
  Each thread has its OWN SecurityContext.
  Threads can't see each other's context.
  
  
  ACCESSING CURRENT USER IN YOUR CODE:
  ═════════════════════════════════════

  // Method 1: SecurityContextHolder static access
  Authentication auth = SecurityContextHolder.getContext().getAuthentication();
  String username = auth.getName();
  
  // Method 2: Inject in controller method
  @GetMapping("/profile")
  public UserProfile getProfile(@AuthenticationPrincipal UserDetails user) {
      return profileService.getProfile(user.getUsername());
  }
  
  // Method 3: In SpEL expressions
  @PreAuthorize("#userId == authentication.principal.id")
  public User getUser(Long userId) { ... }
  
  
  LIFECYCLE:
  ═════════
  
  SecurityContextHolderFilter (start of chain):
  → Load SecurityContext from SecurityContextRepository
  → Store in ThreadLocal via SecurityContextHolder.setContext()
  
  ... request processing ...
  
  SecurityContextHolderFilter (end of chain, in finally block):
  → Clear ThreadLocal via SecurityContextHolder.clearContext()
  → Save to SecurityContextRepository if changed
  
  WHY clear? Thread pool reuse!
  If not cleared, next request on same thread would see previous user!
```

---



🔬 **Section Challenge — 4. SecurityContext and ThreadLocal — Where "Current User" Lives**

**Challenge 1 (Engineering):** In a reactive Spring WebFlux application using Project Reactor, calling `SecurityContextHolder.getContext().getAuthentication()` returns `null` inside a `flatMap` operator, even though the user is authenticated at the controller level. Why does this happen, and how do you retrieve the user identity in a reactive pipeline?
<details><summary>Answer</summary>

**Scenario:** Standard ThreadLocal-based security contexts disappear during reactive stream execution, causing unexpected `null` errors.
**Trace:** `SecurityContextHolder` relies on `ThreadLocal` storage. In reactive programming (WebFlux/Reactor), a single HTTP request is processed asynchronously across multiple worker threads (event loop). When execution jumps from the I/O thread to a worker thread inside a `flatMap`, the `ThreadLocal` state is left behind on the original thread.
**Debug/Fix:** Never use `SecurityContextHolder` in WebFlux. Instead, use the reactive `ReactiveSecurityContextHolder`. To access the context inside a reactive pipeline, use `ReactiveSecurityContextHolder.getContext()`, which retrieves the context from the Reactor `Context` (which safely propagates across thread boundaries), e.g., `ReactiveSecurityContextHolder.getContext().map(ctx -> ctx.getAuthentication().getName())`.
</details>


## 5. How Username/Password Authentication Works (All 12 Steps)

```
  Client sends: POST /login
                Content-Type: application/x-www-form-urlencoded
                Body: username=harsha&password=secret123

                         
  Step 1: UsernamePasswordAuthenticationFilter intercepts POST /login
          (configured to match this path)

  Step 2: Extract credentials
          String username = request.getParameter("username");  // "harsha"
          String password = request.getParameter("password");  // "secret123"

  Step 3: Create UNAUTHENTICATED token
          UsernamePasswordAuthenticationToken token = 
              UsernamePasswordAuthenticationToken.unauthenticated(username, password);
          // token.isAuthenticated() == false at this point

  Step 4: Delegate to AuthenticationManager
          Authentication result = authenticationManager.authenticate(token);

  Step 5: AuthenticationManager (ProviderManager) iterates its providers
          for (AuthenticationProvider provider : providers) {
              if (provider.supports(token.getClass())) {
                  return provider.authenticate(token);  // → DaoAuthenticationProvider
              }
          }

  Step 6: DaoAuthenticationProvider.authenticate()
          → Calls UserDetailsService.loadUserByUsername("harsha")

  Step 7: YOUR UserDetailsService runs
          @Service
          public class MyUserDetailsService implements UserDetailsService {
              public UserDetails loadUserByUsername(String username) {
                  User user = userRepo.findByUsername(username)
                      .orElseThrow(() -> new UsernameNotFoundException("Not found"));
                  return new org.springframework.security.core.userdetails.User(
                      user.getUsername(),
                      user.getPassword(),    // BCrypt hash from DB
                      user.getAuthorities()
                  );
              }
          }

  Step 8: Password verification
          DaoAuthenticationProvider calls:
          passwordEncoder.matches("secret123", "$2a$10$ABC...hashedValue")
          → BCrypt internally:
            1. Extract salt from stored hash
            2. Hash "secret123" with same salt
            3. Compare resulting hash with stored hash
            4. Return true/false

  Step 9: If password matches → Create AUTHENTICATED token
          UsernamePasswordAuthenticationToken authenticated = 
              UsernamePasswordAuthenticationToken.authenticated(
                  userDetails,      // principal
                  null,             // credentials erased!
                  authorities       // [ROLE_USER, ROLE_ADMIN]
              );

  Step 10: Store in SecurityContext
           SecurityContextHolder.getContext().setAuthentication(authenticated);

  Step 11: Save SecurityContext to HttpSession
           (SecurityContextRepository saves it)
           Session gets a JSESSIONID cookie

  Step 12: AuthenticationSuccessHandler runs
           → Redirect to / or original URL
           → Or return 200 with user info (REST API)

  
  IF STEP 8 FAILS (wrong password):
  ══════════════════════════════════
  
  Step 8b: passwordEncoder.matches() returns false
  Step 9b: throw BadCredentialsException("Bad credentials")
  Step 10b: ExceptionTranslationFilter catches it
  Step 11b: AuthenticationFailureHandler runs
            → Redirect to /login?error
            → Or return 401 (REST API)
```

---

## 6. How JWT Authentication Works (All 10 Steps)

```
  JWT is STATELESS — no HttpSession, no server-side state.
  The token itself IS the identity proof.

  Client sends: GET /api/orders
                Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYXJzaGE...

                         
  Step 1: Your custom JwtAuthenticationFilter runs
          (extends OncePerRequestFilter, added to chain)

  Step 2: Extract token from header
          String authHeader = request.getHeader("Authorization");
          if (authHeader == null || !authHeader.startsWith("Bearer ")) {
              filterChain.doFilter(request, response);  // No token? Skip, let next filter handle
              return;
          }
          String jwt = authHeader.substring(7);  // Remove "Bearer "

  Step 3: Parse and validate JWT
          Claims claims = Jwts.parser()
              .verifyWith(secretKey)           // HMAC-SHA256 verification
              .build()
              .parseSignedClaims(jwt)
              .getPayload();
          
          // JWT Structure:
          // Header:  {"alg":"HS256","typ":"JWT"}  (Base64)
          // Payload: {"sub":"harsha","roles":["USER","ADMIN"],"exp":1720000000}
          // Signature: HMAC-SHA256(header.payload, secretKey)
          //
          // Verification: Re-compute HMAC-SHA256 and compare with signature.
          // If someone tampered with payload, signature won't match → reject!

  Step 4: Check expiration
          if (claims.getExpiration().before(new Date())) {
              // Token expired! Send 401
              response.sendError(401, "Token expired");
              return;
          }

  Step 5: Extract user info from claims
          String username = claims.getSubject();  // "harsha"
          List<String> roles = claims.get("roles", List.class);  // ["USER","ADMIN"]

  Step 6: Load UserDetails (optional but recommended)
          UserDetails userDetails = userDetailsService.loadUserByUsername(username);
          // Verifies user still exists and isn't disabled/locked

  Step 7: Create Authentication object
          UsernamePasswordAuthenticationToken auth = 
              UsernamePasswordAuthenticationToken.authenticated(
                  userDetails,
                  null,
                  userDetails.getAuthorities()
              );
          auth.setDetails(new WebAuthenticationDetailsSource()
              .buildDetails(request));  // IP, session ID

  Step 8: Store in SecurityContext (ThreadLocal — for this request only)
          SecurityContextHolder.getContext().setAuthentication(auth);

  Step 9: Continue filter chain
          filterChain.doFilter(request, response);
          // AuthorizationFilter will now see an authenticated user
          // Controller can access @AuthenticationPrincipal

  Step 10: After response sent, SecurityContext cleared
           // Since stateless — nothing saved to session
           // Next request must send JWT again


  JWT CONFIG — Disable sessions:
  ═══════════════════════════════
  
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
      return http
          .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .csrf(csrf -> csrf.disable())  // No CSRF needed for stateless JWT
          .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
          .build();
  }
```

---

## 7. How Authorization Decisions Are Made

```
  AFTER authentication, AuthorizationFilter runs:
  
  AuthorizationFilter.doFilter(request, response, chain)
       │
       ├── Get current Authentication from SecurityContext
       │   auth = SecurityContextHolder.getContext().getAuthentication()
       │
       ├── Get AuthorizationManager (Spring Security 6+)
       │
       ├── Call: authorizationManager.check(auth, request)
       │   │
       │   ├── URL-based rules:
       │   │   .requestMatchers("/api/admin/**").hasRole("ADMIN")
       │   │   .requestMatchers("/api/users/**").hasAnyRole("USER", "ADMIN")
       │   │   .requestMatchers("/public/**").permitAll()
       │   │
       │   ├── Match request URL against patterns
       │   │   GET /api/admin/dashboard → matches "/api/admin/**"
       │   │   → requires ROLE_ADMIN
       │   │
       │   ├── Check: auth.getAuthorities() contains ROLE_ADMIN?
       │   │   ├── YES → return AuthorizationDecision(true)
       │   │   └── NO  → return AuthorizationDecision(false)
       │   │
       │   └── return decision
       │
       ├── If granted → chain.doFilter() → reach controller
       │
       └── If denied → throw AccessDeniedException
            → ExceptionTranslationFilter catches it
            → Send 403 Forbidden


  ROLE vs AUTHORITY:
  ══════════════════
  
  hasRole("ADMIN")      → checks for GrantedAuthority "ROLE_ADMIN"
                           (Spring auto-prepends "ROLE_")
                           
  hasAuthority("ADMIN") → checks for GrantedAuthority "ADMIN"
                           (exact match, no prefix)
  
  hasRole("ADMIN")         == hasAuthority("ROLE_ADMIN")
  
  Best practice: Use hasRole() for coarse-grained (USER, ADMIN, MODERATOR)
                 Use hasAuthority() for fine-grained (READ_PRIVILEGE, WRITE_PRIVILEGE)
```

---

## 8. How @PreAuthorize Works Under the Hood

```
  @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
  public User getUser(Long userId) { ... }


  WHAT HAPPENS:
  ═════════════

  Step 1: At startup, Spring creates a PROXY for your service
          (CGLIB proxy wrapping UserService)

  Step 2: The proxy contains a MethodSecurityInterceptor
          (an AOP around-advice)

  Step 3: When getUser(5L) is called:
  
          Proxy.getUser(5L)
               │
               ▼
          MethodSecurityInterceptor.invoke()
               │
               ├── Get @PreAuthorize expression:
               │   "hasRole('ADMIN') or #userId == authentication.principal.id"
               │
               ├── Create SpEL EvaluationContext:
               │   ├── authentication = SecurityContextHolder.getContext().getAuth()
               │   ├── #userId = 5L  (method parameter)
               │   ├── principal = authentication.getPrincipal()
               │   └── returnObject = null (not evaluated yet for @Pre)
               │
               ├── Evaluate SpEL expression:
               │   ├── hasRole('ADMIN') → check auth.getAuthorities()
               │   │   → false (user is not admin)
               │   ├── OR
               │   ├── #userId == authentication.principal.id
               │   │   → 5L == user.getId() → true (user accessing own data)
               │   └── Result: true (because of OR)
               │
               ├── If true → proceed to actual method
               │   return userService.getUser(5L)
               │
               └── If false → throw AccessDeniedException
                   → 403 Forbidden
  
  
  @PostAuthorize — checked AFTER method runs:
  ════════════════════════════════════════════
  
  @PostAuthorize("returnObject.owner == authentication.name")
  public Document getDocument(Long id) {
      return documentRepo.findById(id).orElseThrow();
  }
  
  Method runs FIRST → result inspected → denied if check fails.
  Careful: method side effects still happen even if denied!


  ENABLING METHOD SECURITY:
  ═════════════════════════
  
  @Configuration
  @EnableMethodSecurity  // Spring Security 6+
  public class SecurityConfig {
      // @EnableMethodSecurity enables:
      // @PreAuthorize, @PostAuthorize — SpEL expressions (recommended)
      // @Secured — simpler, role-based only
      // JSR-250 @RolesAllowed — if jsr250Enabled = true
  }
```

---

## 9. CORS and CSRF — Why They Exist and How Spring Handles Them

### CORS (Cross-Origin Resource Sharing)

```
  THE PROBLEM:
  ════════════
  Browser security: JavaScript on https://frontend.com 
  cannot call https://api.backend.com by default.
  This is the Same-Origin Policy.
  
  CORS is the mechanism that says: "It's OK, I trust this origin."

  
  FLOW:
  ═════
  
  Browser → OPTIONS /api/users (preflight request)
            Origin: https://frontend.com
            Access-Control-Request-Method: POST
            Access-Control-Request-Headers: Content-Type, Authorization
       │
       ▼
  CorsFilter checks:
  ├── Is https://frontend.com in allowed origins? YES
  ├── Is POST in allowed methods? YES
  ├── Are those headers allowed? YES
  └── Respond with:
      Access-Control-Allow-Origin: https://frontend.com
      Access-Control-Allow-Methods: GET, POST, PUT, DELETE
      Access-Control-Allow-Headers: Content-Type, Authorization
      Access-Control-Max-Age: 3600
  
  Browser → POST /api/users  (actual request, now allowed)


  SPRING CONFIGURATION:
  ═════════════════════
  
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      return http
          .cors(cors -> cors.configurationSource(request -> {
              var config = new CorsConfiguration();
              config.setAllowedOrigins(List.of("https://frontend.com"));
              config.setAllowedMethods(List.of("GET","POST","PUT","DELETE"));
              config.setAllowedHeaders(List.of("*"));
              config.setAllowCredentials(true);
              return config;
          }))
          .build();
  }
```

### CSRF (Cross-Site Request Forgery)

```
  THE ATTACK:
  ═══════════
  
  1. You log into bank.com → get session cookie
  2. You visit evil.com
  3. evil.com has: <form action="https://bank.com/transfer" method="POST">
                    <input name="to" value="attacker">
                    <input name="amount" value="10000">
                    </form>
                    <script>document.forms[0].submit()</script>
  4. Browser sends POST to bank.com WITH your session cookie
  5. Bank thinks it's you → transfers money!
  
  
  CSRF PROTECTION:
  ════════════════
  
  Server generates a random token, stores it in session.
  Every form must include this token as a hidden field.
  
  <form action="/transfer" method="POST">
      <input type="hidden" name="_csrf" value="abc123-random-token">
      ...
  </form>
  
  CsrfFilter:
  ├── POST request? → check _csrf parameter
  ├── Token matches session token? → allow
  └── Token missing or wrong? → 403 Forbidden
  
  evil.com can't read the CSRF token (same-origin policy blocks reading)
  So evil.com can't include it in the forged form → attack fails!
  
  
  WHEN TO DISABLE CSRF:
  ═════════════════════
  
  .csrf(csrf -> csrf.disable())  // OK for stateless JWT APIs
  
  If you use JWT (no cookies/sessions), CSRF doesn't apply.
  CSRF only matters when browser automatically sends credentials (cookies).
  JWT in Authorization header is NOT sent automatically.
```

---



🔬 **Section Challenge — 9. CORS and CSRF — Why They Exist and How Spring Handles Them**

**Challenge 1 (Engineering):** A Single Page Application (SPA) on `https://frontend.com` attempts to send a `POST` request to `https://api.backend.com/login`. The browser's network tab shows the `OPTIONS` preflight request succeeds (200 OK), but the subsequent `POST` request fails with a CORS network error. Why did the actual request fail if the preflight succeeded?
<details><summary>Answer</summary>

**Scenario:** CORS policy blocks a cross-origin state-changing request despite a successful OPTIONS preflight.
**Trace:** The `CorsFilter` correctly handled the `OPTIONS` request and returned `Access-Control-Allow-Origin: https://frontend.com`. However, the `POST` request hits the `CsrfFilter` before reaching the controller. Because the SPA did not include a valid CSRF token in the request header (e.g., `X-CSRF-TOKEN`), the `CsrfFilter` immediately rejected the request with a 403 Forbidden. The browser sees a failed request lacking the proper CORS headers in the error response, masking it as a generic "CORS error".
**Debug/Fix:** If the API uses stateless JWTs instead of session cookies, disable CSRF entirely using `.csrf(csrf -> csrf.disable())` since CSRF exploits cookie auto-inclusion. If using session cookies, configure a `CookieCsrfTokenRepository` to send the token to the frontend, and ensure the SPA reads the `XSRF-TOKEN` cookie and attaches it as an `X-XSRF-TOKEN` header on every `POST`/`PUT`/`DELETE` request.
</details>


## 10. How to Configure Security — Modern Way (Spring Security 6+)

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        return http
            // Which requests this chain handles
            .securityMatcher("/api/**")
            
            // Stateless for API
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            
            // No CSRF for stateless API
            .csrf(csrf -> csrf.disable())
            
            // CORS
            .cors(Customizer.withDefaults())
            
            // URL-based authorization
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/api/**").authenticated()
            )
            
            // Add JWT filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            
            // Exception handling
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> 
                    res.sendError(401, "Unauthorized"))
                .accessDeniedHandler((req, res, accessEx) -> 
                    res.sendError(403, "Forbidden"))
            )
            
            .build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
        // BCrypt: adaptive hashing, includes salt, configurable rounds
        // Default: 10 rounds ≈ 100ms per hash
        // Prevents: rainbow table attacks, brute force (slow by design)
    }
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
        // Auto-configured by Spring Boot — uses your UserDetailsService + PasswordEncoder
    }
}
```

---



🔬 **Section Challenge — 10. How to Configure Security — Modern Way (Spring Security 6+)**

**Challenge 1 (Engineering):** In a microservices architecture using stateless JWTs for authentication, a malicious user's account is suspended by an administrator. However, the malicious user continues to make successful API calls for the next 45 minutes until their token expires. How do you design an architectural fix to immediately revoke access without abandoning the stateless, decentralized benefits of JWTs?
<details><summary>Answer</summary>

**Scenario:** A compromised or suspended JWT continues to grant access because stateless tokens cannot be revoked natively by the authorization server.
**Trace:** By design, JWTs are mathematically verified via signature checks (HMAC/RSA) locally by each microservice without calling a central database. Because the token is valid until its `exp` claim passes, the downstream services have no way of knowing the user's state has changed. Moving back to stateful session validation defeats the purpose of decentralized JWTs.
**Debug/Fix:** Implement a hybrid token-revocation pattern using an asynchronous Redis Deny List. When an account is suspended, the Auth server publishes a "revoke" event to an event broker (Kafka/RabbitMQ). All microservices consume this event and cache the `jti` (JWT ID) in a local fast-lookup store (or a shared low-latency Redis cluster) with a TTL matching the token's remaining lifespan. The API Gateway or `JwtAuthenticationFilter` simply checks the cache for the `jti` before performing the signature validation.
</details>


## 11. OAuth2 / OpenID Connect Flow

```
  OAUTH2 AUTHORIZATION CODE FLOW (most secure for web apps):
  ═══════════════════════════════════════════════════════════

  ┌──────────┐     ┌──────────────┐     ┌─────────────────┐
  │  Browser  │     │ Your App     │     │ Auth Provider   │
  │  (User)   │     │ (Backend)    │     │ (Google/Okta)   │
  └─────┬─────┘     └──────┬───────┘     └────────┬────────┘
        │                  │                       │
   1.   │ Click "Login     │                       │
        │ with Google"     │                       │
        │─────────────────→│                       │
        │                  │                       │
   2.   │  Redirect to Google                      │
        │←─────────────────│                       │
        │  Location: https://accounts.google.com/  │
        │    ?client_id=YOUR_APP_ID                │
        │    &redirect_uri=https://yourapp.com/callback
        │    &response_type=code                   │
        │    &scope=openid email profile           │
        │    &state=random123                      │
        │                  │                       │
   3.   │──────────────────────────────────────────→│
        │  User logs in + consents                 │
        │                  │                       │
   4.   │←─────────────────────────────────────────│
        │  Redirect back with AUTH CODE:           │
        │  https://yourapp.com/callback?code=XYZ   │
        │                  │                       │
   5.   │─────────────────→│                       │
        │                  │  Exchange code for tokens
        │                  │─────────────────────→ │
        │                  │  POST /oauth/token     │
        │                  │  code=XYZ              │
        │                  │  client_secret=SECRET  │
        │                  │                       │
   6.   │                  │ ←─────────────────────│
        │                  │  {                     │
        │                  │    access_token: "...",│
        │                  │    id_token: "...",    │
        │                  │    refresh_token: "..."│
        │                  │  }                     │
        │                  │                       │
   7.   │                  │  Validate id_token     │
        │                  │  Extract user info     │
        │                  │  Create session or JWT │
        │                  │                       │
   8.   │ ←────────────────│                       │
        │  Set-Cookie or   │                       │
        │  return JWT      │                       │


  WHY AUTH CODE FLOW IS SECURE:
  ═════════════════════════════
  
  • Auth code alone is useless (needs client_secret to exchange)
  • client_secret NEVER goes to browser (server-to-server exchange in step 5-6)
  • Token exchange happens server-side (not visible in URL/browser)
  • State parameter prevents CSRF on redirect
  • PKCE (Proof Key for Code Exchange) added for extra security
```

---

## 12. Common Security Mistakes and Fixes

```
  MISTAKE 1: Order of matchers matters!
  ═════════════════════════════════════
  
  ❌ WRONG — permitAll() first, catches everything:
  .requestMatchers("/**").permitAll()
  .requestMatchers("/api/admin/**").hasRole("ADMIN")  // NEVER reached!
  
  ✅ CORRECT — specific first, general last:
  .requestMatchers("/api/admin/**").hasRole("ADMIN")
  .requestMatchers("/api/**").authenticated()
  .requestMatchers("/**").permitAll()
  
  
  MISTAKE 2: Storing plain-text passwords
  ════════════════════════════════════════
  
  ❌ user.setPassword("secret123");
  ✅ user.setPassword(passwordEncoder.encode("secret123"));
  
  
  MISTAKE 3: Exposing sensitive data in JWT
  ══════════════════════════════════════════
  
  ❌ JWT payload: {"sub":"harsha","password":"secret","creditCard":"1234-5678"}
  ✅ JWT payload: {"sub":"harsha","roles":["USER"],"exp":1720000000}
  
  JWTs are Base64-encoded (NOT encrypted). Anyone can read the payload!
  Put ONLY: user ID, roles, expiration. Never secrets.
  
  
  MISTAKE 4: Not validating JWT properly
  ═══════════════════════════════════════
  
  ❌ Decode JWT without signature verification
  ✅ Always verify signature + check expiration + check issuer
  
  
  MISTAKE 5: CORS allow all origins in production
  ═════════════════════════════════════════════════
  
  ❌ config.setAllowedOrigins(List.of("*"));
     config.setAllowCredentials(true);  // This combination is ILLEGAL in CORS spec!
  
  ✅ config.setAllowedOrigins(List.of("https://yourfrontend.com"));
     config.setAllowCredentials(true);
  
  
  MISTAKE 6: Forgetting @Transactional in UserDetailsService
  ══════════════════════════════════════════════════════════
  
  ❌ If user has lazy-loaded roles and no @Transactional:
     LazyInitializationException during authentication!
  
  ✅ @Transactional(readOnly = true) on loadUserByUsername()
     Or use JOIN FETCH in the repository query
```

---

**Next Chapter**: [OS Fundamentals for Backend Developers →](Ch65_OS_Fundamentals.md)


🔬 **Section Challenge — 12. Common Security Mistakes and Fixes**

**Challenge 1 (Engineering):** An application uses Spring Security 6+ and configures authorization rules using `.requestMatchers("/api/admin/**").hasRole("ADMIN")` followed by `.requestMatchers("/api/**").permitAll()`. During a pentest, an attacker discovers they can bypass the admin check by sending a request to `/api/admin/dashboard/` (with a trailing slash) or `/api//admin/dashboard`. Why does this bypass the security rule, and how does Spring Security 6 address it?
<details><summary>Answer</summary>

**Scenario:** URL path manipulation allows an unauthenticated user to bypass authorization filters and access restricted endpoints.
**Trace:** Historically (in Spring Security 5 with `AntPathRequestMatcher`), path matching was strict. If the security rule was `/api/admin/**`, a request to `/api/admin/dashboard/` might be treated differently than `/api/admin/dashboard` depending on Spring MVC's trailing slash configuration, leading to severe bypass vulnerabilities if the controller still routed the malicious path to the restricted handler.
**Debug/Fix:** Spring Security 6 mitigates this by dropping `antMatchers` in favor of `requestMatchers`, which natively integrates with Spring MVC's `HandlerMappingIntrospector`. However, to fully secure endpoints against path traversal/normalization attacks (like `//` or `%2e`), you must enforce `StrictHttpFirewall` (the default) and ensure your routing rules strictly match the MVC handlers. Never rely solely on URL prefix matching; combine it with `@PreAuthorize("hasRole('ADMIN')")` directly on the controller methods to guarantee defense-in-depth regardless of the URL path requested.
</details>


