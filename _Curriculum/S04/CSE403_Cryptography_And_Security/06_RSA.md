# Chapter 6 — RSA

> "Every piece already exists. Euler's theorem, modular inverses, fast exponentiation — Chapter 5 built all of it without saying why. RSA doesn't add new mathematics. It notices that those pieces, arranged in exactly the right order, solve the key-distribution problem Chapter 2 identified and never solved."

---

## The Problem

Chapter 2 named the circularity precisely: a one-time pad needs a key shared in advance, over a channel already as secure as the message itself. Chapters 3 and 4 built excellent symmetric encryption, but never touched that circularity — AES still needs both parties to already hold the same secret key before anything can be encrypted.

Public-key cryptography breaks the circle by splitting the key into two mathematically linked halves with a genuinely strange property: one half can be published to the entire planet, and the other half never has to leave its owner's possession or be transmitted anywhere, ever — yet a message encrypted with the public half can *only* be decrypted with the private half. RSA (first publicly described by Ron Rivest, Adi Shamir, and Leonard Adleman at MIT — an April 1977 technical memo, publicly announced later that year, and formally published in *Communications of the ACM* in February 1978; an equivalent method was independently discovered by Clifford Cocks at British intelligence agency GCHQ in 1973, but kept classified until 1997) was the first such scheme to become widely practical. This chapter builds it, using nothing but the tools Chapter 5 already derived — and then shows, just as rigorously, exactly where and why it breaks if used carelessly.

---

## 6.1 Key Generation

Four steps, each one a direct application of a Chapter 5 result:

1. **Choose two large, secret primes $p$ and $q$.**
2. **Compute the public modulus** $n = pq$.
3. **Compute $\varphi(n) = (p-1)(q-1)$** — Chapter 5, §5.2's formula, derived from first principles there. This value must stay exactly as secret as $p$ and $q$ themselves (Chapter 5's Section Challenge Q1 showed precisely why: knowing $n$ and $\varphi(n)$ together is mathematically equivalent to knowing $p$ and $q$ outright, via one quadratic equation).
4. **Choose a public exponent $e$ with $\gcd(e, \varphi(n)) = 1$**, then **compute the private exponent $d$ as the modular inverse of $e$ mod $\varphi(n)$**, using the extended Euclidean algorithm from Chapter 5, §5.5. The coprimality requirement on $e$ isn't a stylistic preference — Chapter 5's Section Challenge Q3 derived that a modular inverse exists *if and only if* $\gcd(e,\varphi(n))=1$; pick an $e$ that fails this and there is no valid $d$ to compute at all, for any $n$.

The **public key** is $(e, n)$; the **private key** is $d$ (real implementations also keep $p$ and $q$ around privately, to decrypt roughly four times faster using a shortcut called the Chinese Remainder Theorem — a nice optimization, but not needed to understand why RSA works, so it's left out here).

**Verified worked example**, using the same $p, q$ this chapter will reuse throughout:

```
p=61, q=53
n = p*q = 3233
phi(n) = (p-1)(q-1) = 3120
choose e=17: gcd(e, phi(n)) = 1   (OK)
d = modular inverse of e mod phi(n) = 2753
verify e*d mod phi(n) = 1   (confirmed)
```

Public key: $(e,n) = (17, 3233)$. Private key: $d = 2753$.

---

## 6.2 Encryption and Decryption

$$c = m^e \bmod n \qquad\qquad m = c^d \bmod n$$

Both operations are exactly Chapter 5, §5.6's square-and-multiply algorithm — literally the same code, run once with exponent $e$ and once with exponent $d$. Nothing new needs to be built here; this is precisely why Chapter 5 spent so much effort deriving that algorithm rather than just asserting modular exponentiation is "fast."

**Verified**, encrypting the byte value for `'A'` under the key pair from §6.1:

```
message m = 65
ciphertext c = 65^17 mod 3233 = 2790
decrypted m' = 2790^2753 mod 3233 = 65
m' == m: True
```

---

## 6.3 Why Decryption Actually Recovers the Plaintext

This is the step every RSA explanation is tempted to skip. It shouldn't be skipped — it's a two-line argument once Chapter 5 is already built, and skipping it is exactly the "X works because Y" hand-wave this course refuses to do.

**Claim:** $c^d \bmod n = m$, i.e. $m^{ed} \equiv m \pmod n$.

**Derivation.** By construction, $d$ is the modular inverse of $e$ mod $\varphi(n)$, which means precisely $ed \equiv 1 \pmod{\varphi(n)}$ — i.e., $ed = 1 + k\varphi(n)$ for some integer $k$. Substitute directly:

$$m^{ed} = m^{1 + k\varphi(n)} = m \cdot \left(m^{\varphi(n)}\right)^k$$

Now apply **Euler's theorem**, Chapter 5 §5.4, exactly as promised there: as long as $\gcd(m,n)=1$, $m^{\varphi(n)} \equiv 1 \pmod n$. Substituting:

$$m^{ed} \equiv m \cdot 1^k \equiv m \pmod n$$

That's the whole proof. Every piece of it was built, derived, and verified in Chapter 5 — this chapter just assembled the pieces.

**Verified with the running numeric example, showing every intermediate quantity, not just the final match:**

```
e*d = 46801 = 1 + 15*phi(n) = 1 + 15*3120 = 46801   (confirmed)
pow(65, 3120, 3233) = 1   (Euler's theorem directly confirmed for this m, n)
So m^(ed) mod n = 65 * 1^15 mod n = 65 -- matches the decrypted value from Section 6.2 exactly.
```

**A loose end worth naming rather than hiding:** Euler's theorem in the form just used requires $\gcd(m,n)=1$. What if the message $m$ happens to be an exact multiple of the secret prime $p$ or $q$? Verified directly rather than assumed away: with $m_{\text{edge}} = 3p = 183$ (so $\gcd(m_{\text{edge}}, n) = 61 \neq 1$), encryption and decryption still round-trip correctly (`183 -> 1586 -> 183`, confirmed). The reason is a short separate argument (apply Fermat's theorem mod $p$ and mod $q$ independently, handling the case where $p \mid m$ or $q \mid m$ as its own trivial sub-case, then combine) — a real and complete argument, just one this course doesn't need to spell out in full, since for real cryptographic-sized primes the odds of a random message landing on an exact multiple of a secret several-hundred-digit prime are astronomically close to zero. It's flagged here rather than swept under the rug: the general correctness proof does hold in all cases, this chapter just derives the overwhelmingly common one in full.

---

## 6.4 Why Textbook RSA Is Broken in Practice

"Textbook RSA" — exactly the scheme just derived, $c=m^e \bmod n$ with no further processing — is provably correct and yet **unsafe to deploy as-is.** Three separate, verifiable failures, each one worth deriving concretely rather than just naming.

**1. Determinism — the exact ECB problem from Chapter 4, §4.1, one level up.** $c=m^e\bmod n$ is a deterministic function: the same $m$ always produces the same $c$ under a fixed key. Encrypt the word `HELLO` one character at a time under the same key:

```
Message: HELLO
Per-character ciphertexts: [3000, 28, 2726, 2726, 1307]
'L' appears at positions 2 and 3 -- ciphertext values: 2726 and 2726
Identical: True
```

The repeated letter produces a repeated ciphertext value, visible without any decryption at all — precisely Chapter 4's ECB penguin, with 16-byte AES blocks swapped for RSA-encrypted characters.

**2. Malleability — the exact bit-flipping problem from Chapter 4, §4.4, algebraic instead of bitwise.** Because $(mk)^e = m^e \cdot k^e$, an attacker who intercepts $c=m^e\bmod n$ — without knowing $m$, $d$, or anything secret — can compute $c' = c \cdot k^e \bmod n$ for any chosen $k$, and $c'$ will decrypt to *exactly* $mk \bmod n$:

```
Original message m=50, ciphertext c=538
Attacker computes c' = c * 2^e mod n = 1773  (no key knowledge used)
Victim decrypts c' -> 100
Expected m*2 mod n = 100.  Match: True
```

The attacker blindly doubled the plaintext a victim would decrypt, with zero knowledge of what that plaintext even was — the same category of attack as Chapter 4's CTR bit-flip, just exploiting RSA's multiplicative structure instead of CTR's XOR structure.

**3. Small-exponent, unpadded messages can bypass the modulus entirely.** RSA's security depends on the modular *wraparound* — but if $m$ is small enough and $e$ is small (a small $e$, like 3, is a common efficiency choice), $m^e$ might never exceed $n$ in the first place:

```
e=3, message m=10: m^e = 1000  (n=3233, and 1000 < 3233)
Since m^e < n, c = m^e mod n = m^e exactly -- no modular reduction ever happened
Attacker computes an ordinary integer cube root of the ciphertext: 10
Recovered m = 10, matches original: True
```

No cryptography was broken here at all — the modular exponentiation quietly degenerated into *ordinary* exponentiation, reversible with an ordinary integer root, because the "encrypted" value never actually wrapped around the modulus. (A related, more general version of this — recovering $m$ from the *same* small-$e$-encrypted message sent to several recipients with different moduli, via the Chinese Remainder Theorem — is a well-documented real attack technique; the mechanism demonstrated above is its simplest special case.)

---

## 6.5 OAEP — Fixing Textbook RSA's Problems

Given §6.4's three failures, a fix needs to satisfy three requirements simultaneously: (1) the same message must encrypt to *different* ciphertexts each time (kills determinism — the same principle as Chapter 4's random IV requirement); (2) the padded structure must be destroyed by any ciphertext tampering, so a manipulated ciphertext decrypts to garbage that gets rejected rather than to a predictably-modified message (kills malleability); (3) the padded value must always occupy close to the *full* size of $n$, regardless of how short the real message is (kills the small-$m^e$ problem).

**OAEP (Optimal Asymmetric Encryption Padding)**, introduced by Mihir Bellare and Phillip Rogaway at EUROCRYPT 1994, satisfies all three. Structurally, it's worth pausing on: OAEP pads the message with random bytes and a redundancy check, then runs the result through **two rounds of masking, each mask generated by a cryptographic hash function (Chapter 8) and combined via XOR** — which is, concretely, **a two-round Feistel network** (Chapter 3, §3.2) built out of hash functions instead of a block cipher's round function, immediately *before* the RSA exponentiation happens. The specific hash-function mechanics are Chapter 8's territory and are deliberately not re-derived here — what matters at this point in the course is recognizing the shape: this is the same swap-and-combine structure Chapter 3 proved is invertible regardless of what the inner function computes, reused as a padding scheme rather than a cipher. The randomness baked into that padding is what defeats determinism; the redundancy check baked into it is what makes ciphertext tampering produce invalid, rejected padding almost certainly, defeating malleability; and the padding always fills the plaintext block up to (just under) the size of $n$, defeating the small-$m^e$ problem directly.

**"Just add padding" is not automatically enough, though — the specific structure matters, which is worth taking seriously as its own lesson.** RSA's earlier, simpler padding scheme, PKCS#1 v1.5, was also "padding," and it was still broken in a chosen-ciphertext setting: Daniel Bleichenbacher's 1998 attack (presented at CRYPTO'98) showed that a server which reveals *only* whether a decrypted, attacker-submitted ciphertext has validly-formatted PKCS#1 v1.5 padding — the exact same "one bit of oracle feedback, queried adaptively" shape as Chapter 4 §4.6's CBC padding oracle attack — lets an attacker recover the entire plaintext without the private key. Same disease as Chapter 4's padding oracle, different cipher entirely. This is precisely why OAEP's adoption mattered beyond "textbook RSA has no padding" — the *quality* and structure of the padding scheme is itself load-bearing, not a checkbox.

---

## 6.6 Real-World Implementation Pitfalls

**Reusing a prime across two different keys is catastrophic, immediately, for a very specific reason.** If two supposedly independent RSA moduli $n_1 = p\cdot q_1$ and $n_2 = p\cdot q_2$ accidentally share the prime $p$ (a real, documented failure mode traced to weak or insufficiently-seeded random number generators on some devices), an attacker who only ever sees the two public moduli — each individually still an enormous, unfactorable-looking composite number — can find the shared factor **instantly**:

```
n1 = 9973 * 9967 = 99400891
n2 = 9973 * 9949 = 99221377
gcd(n1, n2) = 9973   (equals the true shared prime exactly)
q1 = n1/gcd = 9967 (correct), q2 = n2/gcd = 9949 (correct)
Both moduli fully factored, instantly, via the Euclidean algorithm -- no brute force needed.
```

This is genuinely unsettling once you notice it: the Euclidean algorithm's speed (Chapter 5, §5.5) — the very property that makes RSA key generation *practical* in the first place — is exactly what makes this mistake instantly, catastrophically exploitable the moment it happens, on numbers far too large to factor by any other known method.

**Key size has to track factoring algorithm strength, not just "bigger is better."** It's tempting to compare RSA's key size directly against AES's and conclude RSA's 2048 bits is "more secure" than AES's 256 — but the two numbers measure fundamentally different things and are not on the same scale. AES's key can only be attacked by brute-force search (Chapter 3) — no shortcut faster than trying keys is known — so an AES key of $n$ bits genuinely offers roughly $2^n$ security. RSA's key can be attacked by *factoring* $n=pq$, and the best known factoring algorithms (the General Number Field Sieve, among others — the algorithm itself is out of scope here) are **sub-exponential**: meaningfully faster than brute force, though still infeasible at recommended sizes. Because of that asymmetry, RSA needs a much larger *bit count* to reach the same real-world security level as a symmetric key — per NIST's published equivalence guidance, RSA-2048 provides security roughly comparable to a 112-bit symmetric key, and it takes RSA-3072 to reach the rough equivalent of AES-128. "2048 > 256" is comparing units that don't mean the same thing.

**Timing attacks leak key bits through how long decryption takes, not what it outputs.** Square-and-multiply (Chapter 5, §5.6) does an *extra* multiplication precisely on the rounds where the current exponent bit is 1 — so the total work done (and, in a naive implementation, the total time taken) depends on the private exponent's specific bit pattern:

```
Real private exponent d=2753, binary=101011000001 (12 bits, 5 one-bits)
Square-and-multiply cost: 12 squarings (always) + 5 extra multiplications (only on 1-bits)
Contrast exponent d'=2048, binary=100000000000: 12 squarings + only 1 extra multiplication
```

Two exponents of the same bit-length can require measurably different amounts of work. Paul Kocher's 1996 paper (CRYPTO'96) showed this isn't just a theoretical curiosity: an attacker who can measure decryption time precisely, across enough repeated queries to average out noise, can gradually recover the private exponent's bits directly from *how long* decryption takes — without ever seeing a single incorrect output. The standard defense is **constant-time implementation**: always perform the "extra multiply" step regardless of the current bit's value (multiplying by 1 when the bit is 0, discarding the result), so that timing no longer correlates with the secret bit pattern at all. This is the RSA-flavored instance of the exact same lesson Chapter 4 closed on: a mathematically correct scheme can still leak everything through a side channel the proof never accounted for.

---

## Section Challenge

---

**Q1.** Why does RSA key generation require $\gcd(e, \varphi(n)) = 1$ specifically? What concretely breaks if an implementation accidentally chose an $e$ sharing a common factor with $\varphi(n)$?

<details>
<summary>Answer</summary>

**Nothing "weakens" — key generation becomes mathematically impossible for that choice of $e$, full stop.** This is not a fresh RSA-specific rule; it's Chapter 5's Section Challenge Q3, cashed in directly: a modular inverse of $e$ mod $\varphi(n)$ exists **if and only if** $\gcd(e,\varphi(n))=1$. If an implementation picked an $e$ that shares a common factor $g>1$ with $\varphi(n)$, the extended Euclidean algorithm (§6.1, Chapter 5 §5.5) would still run to completion, but it would return Bézout coefficients satisfying $e\cdot x + \varphi(n)\cdot y = g$ with $g\neq 1$ — not $1$ — and reducing mod $\varphi(n)$ gives $e\cdot x \equiv g \pmod{\varphi(n)}$, which is not the statement "$x$ is $e$'s inverse." There is no other candidate to try either: every multiple of $e$ mod $\varphi(n)$ stays a multiple of $g$, and a multiple of $g>1$ can never equal $1$ mod anything sharing that factor.

Concretely, real implementations don't discover this via a failed attack later — they check $\gcd(e,\varphi(n))=1$ as an explicit, mandatory step *during* key generation (§6.1), before ever attempting to compute $d$. If the check fails, the fix is to pick a different $e$ (or regenerate $p,q$ if $e$ is fixed, such as the common choice $e=65537$) and try again — not to proceed with a "weaker" key, because there is no key to proceed with at all.
</details>

---

**Q2.** Does switching to OAEP padding make RSA immune to the shared-prime attack from §6.6? Does using a much larger key size (say, 4096 bits instead of 2048) make RSA immune to the malleability attack from §6.4? Justify both answers.

<details>
<summary>Answer</summary>

**No to both — these are genuinely independent failure categories, each requiring its own, separate fix, not points on one single "more security" dial.**

OAEP is a **padding scheme** applied to the plaintext, at encryption time, using an *already-generated* key pair $(e,n)$ and $(d,n)$. It has no visibility into, and no influence over, *how those primes $p$ and $q$ were originally chosen*. The shared-prime vulnerability (§6.6) is a **key-generation-time** failure — specifically, a random-number-generation quality problem, where two supposedly independent key-generation runs happened to draw the same prime. OAEP operates entirely downstream of that event and cannot retroactively un-share a prime that key generation already chose. The fix for the shared-prime problem lives entirely in key generation: a properly-seeded, high-quality source of randomness when selecting $p$ and $q$, full stop — no padding scheme touches this layer at all.

Symmetrically, key size (2048 vs. 4096 bits) governs how hard $n$ is to **factor** — it raises the bar against the attack described in §6.6's second half (factoring algorithms) and against brute-force key search generally. It says nothing whatsoever about *how the plaintext is packaged before RSA's exponentiation is applied* to it. Textbook RSA at 4096 bits is exactly as multiplicatively malleable as textbook RSA at 2048 bits — the algebraic identity $(mk)^e = m^e k^e$ that §6.4 exploited holds for *any* modulus size, because it's a property of exponentiation itself, not of how many bits $n$ happens to have. Only changing *how the message is padded before encryption* (OAEP, §6.5) touches malleability.

**The general lesson:** "more security" isn't a single dial. Key size defends against brute-force/factoring attacks on the key itself. Padding scheme defends against structural attacks on how plaintext relates to ciphertext (determinism, malleability, small-exponent attacks). Randomness quality during key generation defends against an entirely separate class of implementation failure. A system can be arbitrarily strong on one axis and completely broken on another — which is exactly why §6.4, §6.5, and §6.6 needed to be three separate sections rather than one.
</details>

---

**Q3.** A colleague argues: "2048-bit RSA must be far more secure than 256-bit AES, since 2048 is a much bigger number than 256." Are they right?

<details>
<summary>Answer</summary>

**No — this compares bit-lengths across two attacks with fundamentally different shapes, and the comparison is not meaningful without accounting for that.**

An AES key's *only* known attack is brute-force search over the key space (Chapter 3) — no algorithm faster than trying keys is known, so an AES key of $n$ bits genuinely costs on the order of $2^n$ operations to break. RSA's modulus is attacked by **factoring** it, and the best publicly known factoring algorithms are **sub-exponential** in the number of bits — meaningfully faster than brute force, though still computationally infeasible at the key sizes actually recommended. Because RSA's attack has a real shortcut that AES's attack doesn't, an RSA key needs far more raw bits to reach the same *actual* security level as a symmetric key.

Per NIST's published security-strength equivalence guidance (SP 800-57): **RSA-2048 provides security roughly comparable to a 112-bit symmetric key** — closer to (slightly below) AES-128 than to AES-256 — and it takes **RSA-3072** to reach the rough equivalent of AES-128's 128-bit strength; matching AES-256's strength would require an RSA key on the order of 15,360 bits. So the colleague's comparison, "2048 > 256, so RSA must be stronger," is comparing numbers that live on two different scales entirely: 2048 raw bits of an RSA modulus is *weaker*, not stronger, than 256 raw bits of an AES key. The correct comparison always has to go through each scheme's actual best-known attack, not through the raw bit-count of the key.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Key generation | $n=pq$, $\varphi(n)=(p-1)(q-1)$ (Ch5 §5.2), choose $e$ coprime to $\varphi(n)$, compute $d=e^{-1}\bmod\varphi(n)$ via extended Euclid (Ch5 §5.5) — verified: $p=61,q=53,n=3233,\varphi=3120,e=17,d=2753$ |
| Encryption/decryption | $c=m^e\bmod n$, $m=c^d\bmod n$ — both are literally Ch5 §5.6's square-and-multiply, applied with different exponents |
| Why decryption works | $ed\equiv1\pmod{\varphi(n)}$ means $ed=1+k\varphi(n)$, so $m^{ed}=m\cdot(m^{\varphi(n)})^k \equiv m\cdot 1^k = m \pmod n$ by Euler's theorem (Ch5 §5.4) — verified with every intermediate quantity shown |
| Determinism | Textbook RSA is deterministic — verified repeated ciphertext for a repeated character in "HELLO," the exact ECB failure (Ch4 §4.1) one level up |
| Malleability | $c\cdot k^e \bmod n$ decrypts to $mk\bmod n$ with zero key knowledge — verified; the multiplicative analog of Ch4's CTR bit-flip |
| Small-$e$/no-padding attack | If $m^e < n$, no modular wraparound ever occurs and $m$ is recoverable via an ordinary integer root — verified with $e=3$, $m=10$ |
| OAEP | Random + structured padding, built from a two-round hash-based Feistel-like construction (callback to Ch3 §3.2), fixes all three textbook failures at once — but padding quality itself matters (Bleichenbacher's 1998 attack broke the earlier PKCS#1 v1.5 scheme via a padding oracle, the RSA analog of Ch4 §4.6) |
| Shared-prime failure | Two moduli sharing one prime factor are fully factored instantly via `gcd` — verified; the same Euclidean-algorithm speed that makes RSA practical makes this mistake catastrophic |
| Key size vs. AES | RSA's attack (factoring) is sub-exponential, unlike AES's brute-force-only attack, so equivalent security needs far more RSA bits — verified equivalence: RSA-2048 ≈ 112-bit, RSA-3072 ≈ AES-128 (NIST SP 800-57) |
| Timing attacks | Square-and-multiply's extra multiplication on 1-bits makes runtime depend on the secret exponent's bit pattern — verified bit-count difference; fixed by constant-time implementation |

**Where we go next:** RSA solves key distribution by giving every party a permanent key pair — but a permanent key pair has a downside: if a private key is ever compromised, *every* past message encrypted to it is retroactively readable. Chapter 7 builds Diffie-Hellman, a different solution to the same key-distribution problem, one that can generate a *fresh* shared secret for every conversation — and derives, from first principles, both why it works and the one glaring gap in it that Chapter 9 has to close.

---

*Next: [07 — Diffie-Hellman & Elliptic Curve Cryptography](07_Diffie_Hellman_ECC.md)*
