> **Navigation**: [← HTTP](08_HTTP_Complete.md) | [Index](00_INDEX.md) | [Next → Firewalls](10_Firewalls_Access_Control.md)

# 🔒 Chapter 9: TLS & Encryption — Securing Every Byte

> _"Without TLS, everything you send on the internet — passwords, credit cards, private messages — travels as PLAINTEXT. Anyone on the same WiFi, any router between you and the server, your ISP — they can read it ALL. TLS is the lock on the door of every HTTP connection."_

---

# PART 1: Cryptography Fundamentals — The Building Blocks

---

```
THREE PROPERTIES WE NEED:
  1. CONFIDENTIALITY: only intended recipient can read the data.
  2. INTEGRITY: data wasn't modified in transit.
  3. AUTHENTICATION: the server IS who it claims to be (not an impersonator).

TLS provides ALL THREE. Let's understand each building block.
```

## Symmetric Encryption — One Key

```
CONCEPT: Same key to ENCRYPT and DECRYPT.
  Encrypt(key, "hello") → "x8f2a..."
  Decrypt(key, "x8f2a...") → "hello"
  
  ANALOGY: A locked box with one key.
  Both sender and receiver have a COPY of the same key.
  Anyone with the key can lock (encrypt) or unlock (decrypt).

ALGORITHMS:
  AES (Advanced Encryption Standard):
    AES-128: 128-bit key.
    AES-256: 256-bit key (used by governments, banks, TLS).
    Block cipher: encrypts data in 128-bit blocks.
    
    Modes:
    CBC (Cipher Block Chaining): each block depends on previous (serial).
    GCM (Galois/Counter Mode): parallelizable, provides AEAD.
      AEAD = Authenticated Encryption with Associated Data.
      Encryption + integrity check in ONE operation. THE standard for TLS 1.3.
    
  ChaCha20-Poly1305:
    Google's alternative to AES-GCM. Faster on devices WITHOUT hardware AES.
    Used by: Android, Chrome on ARM, mobile devices.
    ChaCha20 = stream cipher (encryption). Poly1305 = MAC (integrity).

SPEED: Symmetric encryption is FAST.
  AES-256-GCM with hardware acceleration (AES-NI): ~5 GB/s on modern CPUs.
  That's why TLS uses symmetric encryption for actual data transfer.

THE PROBLEM: How do you SHARE the key securely?
  If you send the key over the internet → attacker intercepts → security broken.
  → We need ASYMMETRIC encryption to exchange the symmetric key.
```

## Asymmetric Encryption — Two Keys

```
CONCEPT: TWO different keys. PUBLIC key and PRIVATE key.
  Encrypt(public_key, "hello") → "x8f2a..."
  Decrypt(private_key, "x8f2a...") → "hello"
  
  Public key: shared with EVERYONE (literally public).
  Private key: kept SECRET by the owner (never shared!).
  
  Anything encrypted with the public key → ONLY the private key can decrypt.
  Anything signed with the private key → ANYONE with the public key can verify.

ALGORITHMS:
  RSA (Rivest-Shamir-Adleman, 1977):
    Based on: difficulty of factoring large primes.
    Key sizes: 2048-bit (minimum today), 4096-bit (recommended).
    Used for: certificate signing, key exchange (legacy TLS).
    Slow! ~1000x slower than AES.
    
    math:
    Choose two large primes: p = 61, q = 53
    n = p × q = 3233  (this is the modulus)
    φ(n) = (p-1)(q-1) = 3120
    Choose e (public exponent) = 17
    Find d where (d × e) mod φ(n) = 1 → d = 2753
    Public key: (n=3233, e=17)
    Private key: (n=3233, d=2753)
    
    Encrypt: ciphertext = message^e mod n
    Decrypt: message = ciphertext^d mod n
    
    Security: to derive d from e and n, you need to factor n into p × q.
    For 2048-bit keys: no known algorithm can do this in reasonable time.
  
  Elliptic Curve (ECC, 1985):
    Based on: difficulty of the elliptic curve discrete logarithm problem.
    Key sizes: 256-bit (equivalent to RSA 3072-bit!)
    MUCH smaller keys, MUCH faster than RSA.
    Used for: TLS 1.3 key exchange, ECDSA signatures, SSH keys (ed25519).
    
    WHY ECC IS WINNING:
    RSA 2048-bit key = 256 bytes. ECC 256-bit key = 32 bytes.
    Same security, 8× smaller → less bandwidth, faster handshakes.
    TLS 1.3 ONLY allows ECC key exchange (no RSA key exchange).

THE HYBRID APPROACH (how TLS actually works):
  Problem: Asymmetric is SLOW (good for small data).
  Solution: Use asymmetric to exchange a SYMMETRIC key.
            Then use the fast symmetric key for actual data.
  
  This is called KEY EXCHANGE.
  TLS 1.3: Diffie-Hellman key exchange → derive AES-256-GCM key → fast data encryption.
```



> 🔬 **Section Challenge — Asymmetric Encryption — Two Keys**
>>

## Diffie-Hellman Key Exchange — The Magic

```
THE PROBLEM:
  Alice and Bob want to agree on a shared secret.
  They can only communicate over an insecure channel (internet).
  Eve is listening to EVERYTHING.
  How do Alice and Bob create a shared secret that Eve can't derive?

THE MATH (simplified):
  Public parameters: prime p = 23, generator g = 5
  
  Alice:
    Chooses secret a = 6 (private, never shared!)
    Computes A = g^a mod p = 5^6 mod 23 = 15625 mod 23 = 8
    Sends A = 8 to Bob (public, Eve sees this)
  
  Bob:
    Chooses secret b = 15 (private, never shared!)
    Computes B = g^b mod p = 5^15 mod 23 = 30517578125 mod 23 = 19
    Sends B = 19 to Alice (public, Eve sees this)
  
  Alice computes: shared_secret = B^a mod p = 19^6 mod 23 = 2
  Bob computes:   shared_secret = A^b mod p = 8^15 mod 23 = 2
  
  SAME SECRET: 2! Without ever transmitting the secret itself.
  
  Eve knows: p=23, g=5, A=8, B=19.
  To find the secret, Eve must solve: find a where 5^a mod 23 = 8.
  This is the DISCRETE LOGARITHM PROBLEM — computationally infeasible for large numbers.
  
  ANALOGY: Paint mixing.
  Public color: yellow.
  Alice mixes yellow + her secret blue → sends green to Bob.
  Bob mixes yellow + his secret red → sends orange to Alice.
  Alice mixes orange + her secret blue → BROWN.
  Bob mixes green + his secret red → BROWN (same color!).
  Eve sees yellow, green, orange — but can't unmix to find the secret colors.

ECDHE (Elliptic Curve Diffie-Hellman Ephemeral):
  Same concept but using elliptic curve math instead of modular arithmetic.
  Much smaller numbers → faster computation, same security.
  "Ephemeral" = new keys for EVERY connection (forward secrecy!).
  
  FORWARD SECRECY:
  If server's LONG-TERM private key is compromised LATER →
  past traffic is STILL secure because each session used a UNIQUE ephemeral key.
  The ephemeral key was discarded after the session ended.
  
  Without forward secrecy (RSA key exchange):
  If attacker records encrypted traffic AND later steals the private key →
  attacker can decrypt ALL past recorded traffic! Terrible!
  
  TLS 1.3 MANDATES forward secrecy. RSA key exchange is removed entirely.
```

---

# PART 2: Hashing & MACs — Data Integrity

---

```
HASH FUNCTION:
  Input: any-length data → Output: fixed-length "fingerprint."
  
  Properties:
  1. Deterministic: same input → ALWAYS same output.
  2. Fast to compute.
  3. One-way: impossible to reverse (can't get input from output).
  4. Collision-resistant: extremely hard to find two inputs with same output.
  5. Avalanche effect: tiny input change → completely different output.
  
  Algorithms:
  MD5: 128-bit output. BROKEN — collisions found. Never use for security.
  SHA-1: 160-bit. BROKEN — Google found a collision (2017). Legacy only.
  SHA-256: 256-bit. Secure. Used by: TLS, Bitcoin, Git.
  SHA-384: 384-bit. Used by: TLS cipher suites.
  SHA-3: 256/512-bit. Different design (Keccak). NIST standard backup.
  BLAKE3: Very fast. Growing adoption. Used by: Rust build system.

HMAC (Hash-based Message Authentication Code):
  Combines a hash function with a SECRET KEY:
  HMAC(key, message) → tag
  
  Verifier computes HMAC with same key → if tag matches → message is authentic AND unmodified.
  
  Used in: TLS (data integrity), API authentication (HMAC-SHA256 signing),
  JWTs (HS256 = HMAC-SHA256).

DIGITAL SIGNATURES (asymmetric version of MAC):
  Sign:    signature = Sign(private_key, hash(message))
  Verify:  Verify(public_key, hash(message), signature) → true/false
  
  Anyone can verify (public key). Only signer can create (private key).
  Used for: TLS certificates, code signing, Git commits (GPG), JWTs (RS256, ES256).
```

---

# PART 3: TLS 1.3 Handshake — Step by Step

---

```
THE FULL TLS 1.3 HANDSHAKE (1-RTT):

Client                                      Server
  |                                            |
  |-------- ClientHello ─────────────────────>|
  |  Supported cipher suites (e.g., TLS_AES_256_GCM_SHA384)
  |  Supported key exchange groups (e.g., x25519, secp256r1)
  |  Client's key share (ECDHE public value)  |
  |  SNI: api.myapp.com (Server Name Indication)
  |  ALPN: h2, http/1.1 (Application Layer Protocol Negotiation)
  |                                            |
  |<─────── ServerHello ──────────────────────|
  |  Chosen cipher suite: TLS_AES_256_GCM_SHA384
  |  Server's key share (ECDHE public value)   |
  |                                            |
  |<─────── EncryptedExtensions ──────────────|
  |  ALPN: h2 (chosen protocol: HTTP/2)        |
  |                                            |
  |<─────── Certificate ──────────────────────|
  |  Server's TLS certificate + chain          |
  |                                            |
  |<─────── CertificateVerify ────────────────|
  |  Signature over handshake (proves cert ownership)
  |                                            |
  |<─────── Finished ─────────────────────────|
  |  HMAC over entire handshake transcript     |
  |                                            |
  |  Client verifies:                          |
  |  1. Certificate chain → trusted CA?        |
  |  2. Certificate hostname = api.myapp.com?  |
  |  3. Certificate not expired?               |
  |  4. CertificateVerify signature valid?     |
  |  5. Derive shared secret from key shares   |
  |                                            |
  |-------- Finished ────────────────────────>|
  |  HMAC confirming client's view of handshake|
  |                                            |
  |<======= ENCRYPTED DATA EXCHANGE =========>|
  |  All data encrypted with AES-256-GCM       |
  |  using keys derived from shared secret     |

TOTAL: 1 round trip! (TLS 1.2 required 2 round trips)

0-RTT RESUMPTION (for repeat connections):
  Client has cached the server's pre-shared key from a previous session.
  Client sends data IN THE FIRST PACKET (with ClientHello).
  Server can process data immediately → 0 round trips for data!
  
  RISK: 0-RTT data can be REPLAYED by an attacker.
  Only safe for IDEMPOTENT requests (GET, not POST).
```

---

# PART 4: Certificates & PKI — The Trust System

---

```
THE TRUST PROBLEM:
  You visit https://bank.com. How do you know it's really your bank?
  Without certificates: attacker intercepts → shows THEIR site → steals your password!
  
  SOLUTION: Certificate Authorities (CAs) — trusted third parties.
  CA says: "I verified that bank.com is owned by Bank Corp."
  CA signs a certificate with its private key.
  Browser has CA's public key pre-installed → can verify the signature.

THE CERTIFICATE CHAIN:
  Root CA (pre-installed in browser/OS: ~150 root CAs)
    → signs → Intermediate CA (reduces risk if root is compromised)
      → signs → YOUR DOMAIN CERTIFICATE
  
  Chain example for api.myapp.com:
  1. Root: "DST Root CA X3" (pre-installed in browser)
  2. Intermediate: "Let's Encrypt R3" (signed by root)
  3. Leaf: "api.myapp.com" (signed by intermediate)
  
  Browser validates: root signature on intermediate ✓ → intermediate signature on leaf ✓ → TRUSTED.

WHAT'S IN A CERTIFICATE (X.509):
  Subject: CN=api.myapp.com, O=My Company, L=San Francisco, ST=CA, C=US
  Issuer: CN=Let's Encrypt R3, O=Let's Encrypt
  Validity: Not Before: 2024-01-01, Not After: 2024-03-31 (90 days for LE)
  Public Key: EC 256-bit (the server's public key for key exchange)
  Subject Alternative Names (SAN): api.myapp.com, *.myapp.com
  Key Usage: Digital Signature, Key Agreement
  Certificate Signature Algorithm: sha256WithRSAEncryption
  
  SAN (Subject Alternative Name): THE field browsers check for hostname.
  Wildcard cert: *.myapp.com → covers www.myapp.com, api.myapp.com (but NOT myapp.com itself!).

LET'S ENCRYPT — FREE TLS FOR EVERYONE:
  Founded 2015 by EFF/Mozilla/Akamai/etc.
  Issues free TLS certificates via automated ACME protocol.
  90-day validity (force automation → no forgotten expired certs!).
  ~400 million certificates issued. Changed the web from mostly HTTP to mostly HTTPS.
  
  HOW ACME WORKS:
  1. certbot (client) requests cert for api.myapp.com.
  2. Let's Encrypt challenges: "Prove you control this domain."
     HTTP-01: place a file at http://api.myapp.com/.well-known/acme-challenge/TOKEN
     DNS-01:  create a TXT record: _acme-challenge.api.myapp.com
  3. Let's Encrypt verifies → issues certificate.
  4. certbot installs cert in nginx/Apache and sets auto-renewal cron.
```

```bash
# ── CERTIFICATE COMMANDS ──

# Check a server's certificate
openssl s_client -connect api.myapp.com:443 -servername api.myapp.com < /dev/null
# Shows: certificate chain, protocol, cipher suite

# View certificate details
openssl s_client -connect api.myapp.com:443 < /dev/null 2>/dev/null | \
  openssl x509 -text -noout
# Shows: subject, issuer, validity dates, SANs, public key type/size

# Check certificate expiry
openssl s_client -connect api.myapp.com:443 < /dev/null 2>/dev/null | \
  openssl x509 -enddate -noout
# Output: notAfter=Mar 31 12:00:00 2024 GMT

# Generate a self-signed certificate (for development)
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 \
  -keyout key.pem -out cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Let's Encrypt with certbot (production)
sudo certbot --nginx -d api.myapp.com -d www.myapp.com
# Auto-configures nginx, installs cert, sets up renewal timer.

# Test renewal
sudo certbot renew --dry-run

# Certificate in Kubernetes (cert-manager)
# cert-manager automatically requests + renews Let's Encrypt certs:
```

```yaml
# Kubernetes cert-manager: automatic TLS certificates
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-tls
  namespace: production
spec:
  secretName: api-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - api.myapp.com
  - www.myapp.com
# cert-manager handles: domain verification, cert issuance, renewal.
# The cert appears as a K8s Secret that Ingress can reference.
```

---

# PART 5: mTLS — Mutual TLS (Zero Trust)

---

```
STANDARD TLS: Client verifies server's identity. Server doesn't verify client.
  Used for: web browsing (server proves it's google.com, client is anonymous).

MUTUAL TLS (mTLS): BOTH sides verify each other's certificates.
  Server verifies client AND client verifies server.
  
  USE CASES:
  • Microservices: Service A proves identity to Service B (and vice versa).
  • Zero-trust networking: no implicit trust, even inside the datacenter.
  • API authentication: client certificate replaces API key.
  • IoT: devices authenticate to cloud services.
  
  SERVICE MESH (Istio/Linkerd):
  Sidecar proxy automatically handles mTLS between ALL services.
  Your application code doesn't know about TLS.
  Certificate rotation happens automatically via Envoy → the CA (Citadel in Istio).
  
  Without service mesh: each team manages their own certificates.
  With service mesh: zero-config mTLS everywhere. Zero trust. Automatically.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **TCP transport for TLS** | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — TLS runs on TCP |
| **HTTPS = HTTP + TLS** | [Ch 08: HTTP Complete](08_HTTP_Complete.md) |
| **DevSecOps (certificates)** | [Networking & Security](02_Networking_Security.md) — cert pipeline |
| **Service mesh mTLS** | [Cloud Native](03_ServiceMesh_CloudNative.md) — Istio/Linkerd |
| **JWT tokens** | [Enterprise Auth](../10_Enterprise_Systems/06_Authentication_Security.md) |
| **Python requests (TLS)** | [Asyncio](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) — HTTPS calls |
| **Math (modular arithmetic)** | [Math Behind Code](../21_Python_ML_DL_NLP/04b_Math_Behind_The_Code.md) |
| **Hash tables (cert cache)** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) |

---


---

## 🏋️ Practice & Interview Questions — DevOps & Networking

### Predict / Trace
**Q1.** What happens when you type `https://google.com` in a browser?
<details><summary>Answer</summary>

1. DNS lookup: resolve `google.com` → IP (recursive resolver → root → TLD → authoritative NS)
2. TCP connection: 3-way handshake (SYN → SYN-ACK → ACK) to port 443
3. TLS handshake: ClientHello → ServerHello → certificate verification → key exchange → session keys
4. HTTP/2 GET request sent
5. Server responds with HTML (GZIP compressed)
6. Browser parses HTML → fetches CSS/JS → CSSOM + DOM → render tree → paint
</details>

**Q2.** `curl -I https://example.com` returns `Connection: keep-alive`. What does this mean?
<details><summary>Answer</summary>

The TCP connection won't be closed after the response — it stays open for reuse. Avoiding TCP+TLS handshake overhead for subsequent requests. HTTP/1.1 default; HTTP/2 always multiplexes on one connection.
</details>

### Coding / Commands
**Q3.** ⭐ Write a Dockerfile for a Java Spring Boot app — multi-stage build.
<details><summary>Solution</summary>

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle/
RUN ./gradlew dependencies --no-daemon
COPY src src/
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime (smaller image)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
</details>

**Q4.** ⭐ Write a Kubernetes deployment with liveness and readiness probes.
<details><summary>Solution</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myapp:1.0
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "500m" }
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          initialDelaySeconds: 10
          periodSeconds: 5
```
</details>

**Q5.** ⭐⭐ Design a zero-downtime deployment strategy.
<details><summary>Answer</summary>

**Blue-Green**: run two identical envs, switch load balancer. Instant rollback. Double the infra cost.
**Rolling**: replace pods one-by-one. K8s default. Slower, but no extra infra.
**Canary**: route 5% traffic to new version, monitor errors/latency, gradually increase. Most risk-controlled.
**Feature flags**: deploy code but disable feature — decouple deployment from release.
</details>

### Interview Questions
**Q6.** TCP vs UDP — when to use each?
<details><summary>Answer</summary>

**TCP**: reliable (acknowledgments, retransmission), ordered, connection-based. Use for: HTTP, databases, SSH, email — anywhere correctness matters more than speed.
**UDP**: unreliable, unordered, connectionless. Use for: video streaming, gaming, DNS, VoIP — where speed matters more than perfect delivery, or app handles reliability itself.
</details>

**Q7.** What is a memory limit vs memory request in Kubernetes?
<details><summary>Answer</summary>

`request`: guaranteed allocation — K8s won't schedule pod on node with less available. `limit`: maximum usage — if exceeded, pod is OOM-killed. Set requests for scheduling accuracy; set limits to prevent noisy neighbor problems. Best practice: requests=expected P50 usage, limits=expected P99 surge.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | HTTP status code 429 | Too Many Requests (rate limited) |
| 2 | HTTP status code 503 | Service Unavailable (server down/overloaded) |
| 3 | DNS record type for IP address | A record (IPv4), AAAA record (IPv6) |
| 4 | Load balancer Layer 4 vs 7 | L4: TCP/UDP level; L7: HTTP/application level (content-aware) |
| 5 | TLS/SSL terminates where | At load balancer (termination), or all the way to pod (passthrough) |
| 6 | `docker exec -it container bash` does | Opens interactive shell in running container |
| 7 | Kubernetes etcd stores | Cluster state (all K8s object definitions) |
| 8 | CI/CD — what triggers a pipeline? | Code push, PR, tag, schedule, or manual trigger |



---

## 🧠 Deep Conceptual Questions — Networking & DevOps Internals

**C1. TCP three-way handshake: WHY three steps? Can it be done in two?**
<details><summary>Deep Answer</summary>

Two-way fails: both sides need to confirm the OTHER side can send AND receive. 
- SYN (client→server): "I want to connect, my sequence starts at X"
- SYN-ACK (server→client): "Got your SYN, my sequence starts at Y, ack=X+1"  
- ACK (client→server): "Got your SYN-ACK, ack=Y+1"

Without the third ACK: client knows server is alive, but server doesn't know the client received the SYN-ACK. If SYN-ACK lost: server has allocated resources (TCB) thinking connection established, client doesn't know. The ACK confirms the server's sequence number was received. This asymmetric confirmation requires 3 messages minimum. Four-way teardown: TCP is full-duplex — each direction closed independently, hence 4 steps.
</details>

**C2. What happens when you run `docker run`? Trace the full execution path.**
<details><summary>Deep Answer</summary>

1. **Docker CLI** parses the command, sends REST API request to Docker daemon (`/run`)
2. **Docker daemon** (dockerd) receives the request
3. If image not local: **pull from registry** (Docker Hub → HTTPS, layer downloads)
4. Daemon calls **containerd** (container runtime interface)
5. containerd calls **runc** (OCI runtime)
6. runc creates **Linux namespaces**: PID, NET, MNT, UTS, IPC, USER — isolates the process
7. runc sets up **cgroups**: limits CPU, memory, I/O
8. runc **pivot_root**: changes the filesystem root to the container's overlay filesystem
9. runc executes the entrypoint process (PID 1 in the container)
10. Container stdout/stderr connected through Docker daemon to your terminal
</details>

**C3. Why does Kubernetes use etcd and what would happen if etcd went down?**
<details><summary>Deep Answer</summary>

etcd = distributed key-value store using the Raft consensus algorithm. Stores ALL cluster state: pod specs, deployments, services, secrets, configmaps, RBAC, CRDs. Raft ensures consistency across a cluster of 3-5 etcd nodes (quorum = (N/2)+1). **If etcd goes down**: API server can't read/write state. kubectl commands fail. Scheduler can't schedule new pods. Controller manager can't reconcile state. EXISTING running pods continue running (they don't constantly check etcd — they're managed by kubelet on each node). New pods can't be scheduled. No updates possible. This is why etcd backup + restore is the most critical K8s operation.
</details>

**C4. TLS handshake: what is forward secrecy and why does it matter?**
<details><summary>Deep Answer</summary>

Without forward secrecy: if attacker records encrypted traffic now, and later compromises the server's private key, they can decrypt ALL past traffic retroactively. The server's private key decrypts the session key which decrypts the data. **Forward secrecy** (TLS 1.3 default): each session uses an **ephemeral key pair** (ECDHE). Session keys derived from ephemeral keys + DH exchange. Session key is never stored. If private key compromised later: past sessions can't be decrypted (the ephemeral keys are gone). This is why TLS 1.3 mandates forward secrecy and deprecated non-FS cipher suites. Practically: enables safer long-term data archival.
</details>

**C5. DNS propagation: why does it take "up to 48 hours"?**
<details><summary>Deep Answer</summary>

DNS uses hierarchical caching. Each DNS record has a TTL (time-to-live). When you update a DNS record, authoritative NS serves the new value immediately. But: resolvers worldwide have cached the OLD value until their cache TTL expires. TTL varies: some ISPs set their resolver cache TTL aggressively (override your TTL), some ignore TTL and cache for hours regardless. "48 hours" = worst-case TTL of most records (common: 3600s=1hr, 86400s=1day). Reduce before migration: lower TTL to 60s a week before planned change → faster propagation. After change: most resolvers pick up the new value within minutes. "48 hours" is a legacy conservative estimate.
</details>

**C6. Load balancer: what is the difference between Layer 4 and Layer 7?**
<details><summary>Deep Answer</summary>

**Layer 4 (Transport)**: routes based on TCP/UDP. Sees: IP address, port. Doesn't read HTTP content. Faster (no packet inspection, can be done in-kernel). Can't do URL-based routing, auth injection, session affinity by cookie. Examples: AWS NLB, HAProxy in TCP mode. **Layer 7 (Application)**: reads HTTP headers, URL, body. Can route `/api` to one backend, `/static` to another. Can inject headers (`X-Real-IP`), handle SSL termination, do health checks on HTTP endpoints, session affinity by cookie. More CPU-intensive (full packet inspection). Examples: NGINX, AWS ALB, Envoy. Modern microservices use L7 (Envoy/Istio) for fine-grained traffic control.
</details>


> **Navigation**: [← HTTP](08_HTTP_Complete.md) | [Index](00_INDEX.md) | [Next → Firewalls](10_Firewalls_Access_Control.md)
