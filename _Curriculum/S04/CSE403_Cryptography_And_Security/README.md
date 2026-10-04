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

## Chapters

| # | Chapter |
|---|---------|
| [01](01_Classical_Ciphers_Cryptanalysis.md) | Classical Ciphers & Cryptanalysis |
| [02](02_Perfect_Secrecy_One_Time_Pad.md) | Perfect Secrecy & the One-Time Pad |
| [03](03_Block_Ciphers_AES.md) | Block Ciphers & AES |
| [04](04_Modes_Of_Operation.md) | Modes of Operation |
| [05](05_Number_Theory_Foundations.md) | Number Theory Foundations for Crypto |
| [06](06_RSA.md) | RSA |
| [07](07_Diffie_Hellman_ECC.md) | Diffie-Hellman & Elliptic Curve Cryptography |
| [08](08_Cryptographic_Hash_Functions.md) | Cryptographic Hash Functions |
| [09](09_MACs_Digital_Signatures.md) | MACs & Digital Signatures |
| [10](10_Password_Storage_Key_Derivation.md) | Password Storage & Key Derivation |
| [11](11_TLS_SSL_PKI.md) | TLS/SSL & PKI |
| [12](12_Web_Vulnerabilities_OWASP.md) | Web Vulnerabilities (OWASP Top 10) |
| [13](13_Threat_Modeling_Secure_SDLC.md) | Threat Modeling & Secure SDLC |
