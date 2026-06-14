# CSE403 — Cryptography & Security

## Description

Security is not an afterthought — it is a first-class engineering concern. This course covers symmetric and asymmetric cryptography, hash functions, digital signatures, authentication protocols, TLS/SSL, common attack vectors (XSS, SQLi, CSRF), and secure software development practices. You will learn to think like an attacker in order to defend better.

## Learning Outcomes

- Implement and break classical ciphers; understand why they fail (frequency analysis)
- Apply modern symmetric algorithms (AES) and asymmetric algorithms (RSA, ECC) correctly
- Use hash functions (SHA-256, bcrypt, Argon2) for integrity, password storage, and Merkle trees
- Design and analyze authentication and key exchange protocols (Diffie-Hellman, HMAC)
- Identify and mitigate OWASP Top 10 vulnerabilities in web applications
- Understand TLS/SSL handshake, certificates, PKI, and certificate authority trust chains

## Syllabus Outline

- **Unit 1:** History of Cryptography — Substitution ciphers, Vigenère, Enigma, frequency analysis
- **Unit 2:** Symmetric Cryptography — Block ciphers, AES, modes of operation (CBC, GCM), stream ciphers
- **Unit 3:** Asymmetric Cryptography — RSA, Diffie-Hellman, Elliptic Curve Cryptography
- **Unit 4:** Hash Functions & Digital Signatures — SHA-256, HMAC, Merkle trees, ECDSA
- **Unit 5:** Authentication & Protocols — Password hashing (bcrypt, Argon2), salts, pepper, OTP, JWT
- **Unit 6:** Web Security — XSS, SQLi, CSRF, SSRF, IDOR, race conditions, HTTPS/TLS
- **Unit 7:** Secure Development — Threat modeling, security code review, penetration testing basics

## Existing Content

> **TBD — Phase 3** — No existing content linked yet. This shell is scaffolded for Phase 3 content development.

## Subdirectories

- `lectures/` — Topic-by-topic lecture notes
- `labs/` — Hands-on cryptography implementations and security testing labs
- `assignments/` — Graded cryptographic protocol and security analysis tasks
- `projects/` — Capstone: build a secure communication system or conduct a penetration test
- `rubrics/` — Grading criteria for all deliverables
