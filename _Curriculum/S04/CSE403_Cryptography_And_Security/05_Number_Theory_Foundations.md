# Chapter 5 — Number Theory Foundations for Crypto

> "RSA and Diffie-Hellman will look like magic for exactly as long as you don't have this chapter. Every step of both is ordinary arithmetic — this is the chapter that makes sure it's ordinary to you too."

---

## The Problem

Every cipher since Chapter 3 has shared one inconvenient assumption: both parties already have the same secret key. AES needs it. CBC and CTR need it. Chapter 2 named this problem and didn't solve it — the one-time pad's fatal flaw wasn't the encryption step, it was that securely sharing a key in advance is exactly as hard as securely sharing the message would have been.

Chapters 6 and 7 solve this for real, using **public-key cryptography** — schemes where the encryption key can be shouted from the rooftops and the security holds anyway, because encrypting is easy in one direction and reversing it is believed to be hard without a specific piece of extra information (a private key). Building anything like that requires a mathematical operation that is cheap to compute forwards and — as far as anyone has proven — expensive to undo. That operation is **modular exponentiation**, and the fact that it's hard to undo rests entirely on number theory results that need to be derived, not assumed.

This chapter builds exactly the pieces Chapters 6 and 7 will call on: modular arithmetic itself, Euler's totient function, Fermat's and Euler's theorems (both proved, not just stated), the extended Euclidean algorithm (the actual algorithm that computes RSA's private key), and fast modular exponentiation (the actual algorithm that makes RSA and Diffie-Hellman computationally possible at all). Nothing here is crypto yet — it's the arithmetic engine underneath it.

---

## 5.1 Modular Arithmetic — Working with Remainders

Modular arithmetic is ordinary arithmetic, plus one rule: numbers wrap around after reaching a fixed modulus $n$, exactly like a clock face wraps around after 12. Formally, $a \bmod n$ is the remainder when $a$ is divided by $n$, and two numbers $a, b$ are **congruent mod $n$** — written $a \equiv b \pmod n$ — if they leave the same remainder, equivalently if $n$ divides $a - b$ exactly.

The reason this is usable for cryptography rather than just a curiosity: addition, subtraction, and multiplication all behave exactly the way you'd want inside a fixed modulus — $(a+b) \bmod n = ((a \bmod n) + (b \bmod n)) \bmod n$, and the same for multiplication. This means you can reduce mod $n$ at *any* point during a computation, not just at the end, without changing the final answer. That single fact is what makes §5.6's fast exponentiation algorithm possible at all: it lets every intermediate result stay small (bounded by $n$) instead of growing without limit.

**Quick verified example:** $47 \times 38 \bmod 12$. Directly: $47 \times 38 = 1786$, and $1786 \bmod 12 = 10$. Reducing first: $47 \bmod 12 = 11$, $38 \bmod 12 = 2$, and $11 \times 2 = 22$, $22 \bmod 12 = 10$ — same answer, confirmed identical by direct computation either way. This isn't a special case; it's the property that makes every algorithm in this chapter tractable.

---

## 5.2 Euler's Totient Function $\varphi(n)$

Define $\varphi(n)$ as the count of integers in $\{1, 2, \ldots, n\}$ that are **coprime** to $n$ (share no common factor with $n$ other than 1, i.e. $\gcd(k,n)=1$). This single function is the hinge Chapter 6's entire key-generation procedure turns on, so it's worth deriving its two special-case formulas rather than just quoting them.

**$\varphi(p)$ for prime $p$:** since $p$ is prime, its only divisors are 1 and $p$ itself. Every integer from $1$ to $p-1$ therefore shares no factor with $p$ except 1 — all $p-1$ of them are coprime to $p$. So:

$$\varphi(p) = p - 1$$

**$\varphi(pq)$ for distinct primes $p, q$:** count, instead, how many integers in $\{1,\ldots,pq\}$ are **not** coprime to $pq$ — i.e. share a factor with $p$ or with $q$ — and subtract from $pq$. The multiples of $p$ in that range are $p, 2p, \ldots, qp$: exactly $q$ of them. The multiples of $q$ are exactly $p$ of them. A number that's a multiple of *both* $p$ and $q$ is a multiple of $pq$ — and the only multiple of $pq$ in the range $\{1,\ldots,pq\}$ is $pq$ itself, so that overlap has been double-counted exactly once. By inclusion-exclusion, the count of non-coprime integers is $q + p - 1$, so:

$$\varphi(pq) = pq - (p + q - 1) = pq - p - q + 1 = (p-1)(q-1)$$

**Verified**, by brute-force counting every integer from 1 to $n$ and checking `gcd(k,n)==1` directly, compared against the formula:

```
phi(7) [prime]  = 6    (expect p-1 = 6)     match: True
phi(5*7=35)   brute force = 24,  formula (p-1)(q-1) = 24,  match: True
phi(11*13=143) brute force = 120, formula (p-1)(q-1) = 120, match: True
phi(17*19=323) brute force = 288, formula (p-1)(q-1) = 288, match: True
```

Hold onto $\varphi(pq) = (p-1)(q-1)$ specifically — Chapter 6's RSA key generation computes exactly this quantity as its very first step.

---

## 5.3 Fermat's Little Theorem

**Claim:** for prime $p$ and any integer $a$ not divisible by $p$,

$$a^{p-1} \equiv 1 \pmod p$$

This deserves a real argument, not just a demonstration that it holds numerically.

**Proof sketch.** Consider the $p-1$ numbers $a\cdot 1, a\cdot 2, \ldots, a\cdot(p-1) \pmod p$. Claim: these are just $\{1, 2, \ldots, p-1\}$ in some order (a permutation), not $p-1$ arbitrary values. Why: since $\gcd(a,p)=1$ ($p$ is prime and doesn't divide $a$), multiplication by $a$ mod $p$ is invertible, hence a **bijection** on the nonzero residues mod $p$ — no two distinct values $i \neq j$ in $\{1,\ldots,p-1\}$ can map to the same $a\cdot i \equiv a \cdot j \pmod p$, because that would force $a(i-j)\equiv 0$, and since $a$ is invertible mod $p$ that would force $i \equiv j$, a contradiction. A bijection from a $(p-1)$-element set to itself is a permutation of it.

Since it's a permutation, the **product** of the mapped set equals the product of the original set:

$$\prod_{i=1}^{p-1} (a \cdot i) \equiv \prod_{i=1}^{p-1} i \pmod p \quad\Longrightarrow\quad a^{p-1}\cdot (p-1)! \equiv (p-1)! \pmod p$$

$(p-1)!$ is a product of numbers none of which are divisible by $p$ (all less than $p$, which is prime), so $(p-1)!$ is itself coprime to $p$ and can be **cancelled** from both sides (multiply both sides by its modular inverse, which §5.5 shows how to compute). What's left is exactly the claim: $a^{p-1} \equiv 1 \pmod p$.

**Verified numerically** across several primes:

```
a=3, p=7 (prime):   a^(p-1) mod p = 1   match=True
a=5, p=13 (prime):  a^(p-1) mod p = 1   match=True
a=10, p=17 (prime): a^(p-1) mod p = 1   match=True
a=6, p=23 (prime):  a^(p-1) mod p = 1   match=True
```

---

## 5.4 Euler's Theorem — Generalizing Fermat to Composite Moduli

Fermat's theorem needs $p$ to be **prime**. Chapter 6's RSA modulus $n=pq$ is deliberately **composite** (that's the entire point — its security rests on factoring $n$ being hard). Fermat's theorem, as stated, says nothing about composite moduli at all. Euler's theorem is the fix:

**Claim:** for any $n$ and any $a$ with $\gcd(a,n)=1$,

$$a^{\varphi(n)} \equiv 1 \pmod n$$

Setting $n=p$ prime recovers Fermat exactly, since $\varphi(p)=p-1$ (§5.2) — Euler's theorem is a strict generalization, not a different result.

**Proof sketch (identical strategy to §5.3, generalized).** Where Fermat's proof used *all* nonzero residues mod $p$ (valid only because every one of them is automatically coprime to a prime $p$), Euler's proof restricts attention to exactly the residues that **are** coprime to $n$ — there are $\varphi(n)$ of them by definition. Call this set $U$. Multiplication by $a$ (which is coprime to $n$ by assumption) is again a bijection on $U$ — the same cancellation argument from §5.3 applies unchanged, because $\gcd(a,n)=1$ is exactly what's needed for "multiplication by $a$ is invertible mod $n$," and that's all the bijection argument used. So $a$ permutes $U$, the product of $U$ is preserved, $a^{\varphi(n)}$ times the product of $U$ equals the product of $U$, and — since the product of $U$ is itself coprime to $n$ (a product of things coprime to $n$ is coprime to $n$) and therefore cancellable — $a^{\varphi(n)} \equiv 1 \pmod n$ falls out.

**Verified**, on composite moduli this time:

```
n=5*7=35,   phi(n)=24,  a=4  (gcd(a,n)=1):  a^phi(n) mod n = 1  match=True
n=11*13=143, phi(n)=120, a=6  (gcd(a,n)=1):  a^phi(n) mod n = 1  match=True
n=7*11=77,  phi(n)=60,  a=17 (gcd(a,n)=1):  a^phi(n) mod n = 1  match=True
```

**This is not an incidental fact for this course — it is the single theorem Chapter 6 uses to prove RSA decryption recovers the original plaintext.** Everything in §5.2's derivation of $\varphi(pq)=(p-1)(q-1)$ exists specifically to make this theorem computable for an RSA-shaped modulus.

---

## 5.5 The Extended Euclidean Algorithm — Computing Modular Inverses

**First, plain gcd.** The Euclidean algorithm computes $\gcd(a,b)$ via the identity $\gcd(a,b) = \gcd(b,\, a \bmod b)$, down to $\gcd(a,0)=a$. This identity holds because any number dividing both $a$ and $b$ also divides $a - qb$ for any integer $q$ — in particular divides $a \bmod b$ — and conversely any common divisor of $b$ and $a\bmod b$ divides $a = qb + (a\bmod b)$ too. The two pairs $(a,b)$ and $(b, a\bmod b)$ have **exactly the same set of common divisors**, so in particular the same *greatest* one.

**Verified trace**, $\gcd(240, 46)$:

```
240 = 5*46 + 10
 46 = 4*10 + 6
 10 = 1*6  + 4
  6 = 1*4  + 2
  4 = 2*2  + 0
gcd = 2
```

**Now, the extension.** Run the same division steps, but *also* track how each remainder can be written as an integer combination of the original $a$ and $b$. Working backward through the trace above (each remainder equals the previous divisor minus a multiple of the previous remainder) expresses the final gcd as $a\cdot x + b\cdot y$ for some integers $x,y$ — **Bézout's identity**. Rather than back-substituting by hand (error-prone for anything beyond a toy example), the standard algorithm tracks the coefficients *forward*, updating them alongside each division step:

```
Extended Euclid on (240,46): g=2, x=-9, y=47
Verify 240*x + 46*y == g:  240*(-9) + 46*(47) = 2   (matches g)
```

**Why this matters for cryptography — modular inverses.** If $\gcd(a,n)=1$, Bézout's identity gives integers $x,y$ with $a\cdot x + n\cdot y = 1$. Reduce that equation mod $n$: the $n\cdot y$ term vanishes entirely, leaving $a\cdot x \equiv 1 \pmod n$. That's exactly the definition of a **modular inverse** — $x$ (taken mod $n$ to land in the usual range) is "the reciprocal of $a$," in the sense that multiplying by it undoes multiplying by $a$, inside arithmetic mod $n$. This is the *only* general method for computing modular inverses, and it's the literal algorithm Chapter 6 uses to compute RSA's private exponent from its public one.

**Verified worked example** — the modular inverse of 17 mod 43:

```
extended_gcd(17, 43) = (g=1, x=-5, y=2)
gcd is 1 (an inverse exists exactly because gcd=1)
modular inverse of 17 mod 43 = x mod 43 = 38
Verify: (17 * 38) mod 43 = 1   (matches, as required)
Cross-checked against Python's built-in pow(17, -1, 43) = 38 -- exact match
```

$17 \times 38 = 646 = 15 \times 43 + 1$ — confirmed directly, and cross-checked against an entirely independent computation (Python's own built-in modular inverse) for good measure.

---

## 5.6 Fast Modular Exponentiation — Square-and-Multiply

Both RSA (Chapter 6) and Diffie-Hellman (Chapter 7) need to compute $a^e \bmod n$ where $e$ and $n$ are numbers hundreds of digits long. **Why can't you just compute $a^e$ the naive way** — multiply $a$ by itself $e-1$ times?

**Two separate infeasibilities stack here.** First, computing $a^e$ as an actual integer *before* reducing mod $n$ would produce a number with roughly $e \times \log_{10}(a)$ digits — for crypto-sized $e$, a number vastly larger than the observable universe has particles, long before you even get to reduce it. (§5.1's fact that you can reduce mod $n$ *during* the computation, not just at the end, is what avoids this entirely — every intermediate result stays bounded by $n$.) Second, even granting free reduction at every step, **doing $e-1$ separate multiplications** is still infeasible when $e$ has hundreds of digits: at RSA scale, a private exponent $d$ is typically around 2048 bits, meaning $e \approx 2^{2048}$ — computing $\log_{10}(2^{2048}) \approx 616.5$, so the naive approach would need on the order of $10^{617}$ multiplications. That's not "slow." Every computer that has ever existed, running since the Big Bang, could not get through a meaningful fraction of that.

**The fix: square-and-multiply**, using the exponent's *binary representation* instead of counting up to it one multiplication at a time. The idea, unrolled from the recursive identity $a^{e} = (a^{e/2})^2$ when $e$ is even, or $a^e = a \cdot a^{e-1}$ when $e$ is odd: process the bits of $e$ one at a time (most-significant first), **always squaring** the running result, and **additionally multiplying in $a$** exactly when the current bit is 1. This computes $a^e \bmod n$ in roughly $2\log_2(e)$ multiplications total — for a 2048-bit exponent, about $4096$ multiplications, in place of $10^{617}$.

**Verified full trace**, computing $7^{560} \bmod 1{,}000{,}003$ (exponent $560 = $ `1000110000` in binary, 10 bits):

| bit | after squaring | multiply by base? | running result |
|---|---|---|---|
| 1 | 1 | yes | 7 |
| 0 | 49 | no | 49 |
| 0 | 2401 | no | 2401 |
| 0 | 764786 | no | 764786 |
| 1 | 871111 | yes | 97759 |
| 1 | 793413 | yes | 553876 |
| 0 | 703045 | no | 703045 |
| 0 | 789215 | no | 789215 |
| 0 | 447651 | no | 447651 |
| 0 | 816631 | no | 816631 |

```
Final result: 816631
Python's built-in pow(7, 560, 1000003) = 816631
Match: True
Multiplications used: at most 2*10 = 20  (versus 559 for the naive approach on this small example)
```

Ten bits, at most twenty multiplications, exact match against an independent computation. **This is the algorithm that runs, unmodified, every single time an RSA key is used to encrypt or decrypt (Chapter 6), and every single time a Diffie-Hellman exchange computes $g^a \bmod p$ (Chapter 7)** — nothing about those chapters' operations is exotic once this piece exists; it's this exact loop, applied to numbers with hundreds of digits instead of three.

---

## Section Challenge

---

**Q1.** Suppose an attacker learns both $n=pq$ (public, as it always is in RSA) **and** $\varphi(n)$ (normally kept secret). Show precisely what they can do with both values together, and why this means $\varphi(n)$ must be protected exactly as carefully as the primes $p,q$ themselves.

<details>
<summary>Answer</summary>

**Knowing both $n$ and $\varphi(n)$ is equivalent to knowing $p$ and $q$ outright** — it reduces recovering the two secret primes to solving a quadratic equation, no factoring algorithm required at all.

From §5.2, $\varphi(n) = (p-1)(q-1) = pq - p - q + 1 = n - (p+q) + 1$. Rearranged: $p + q = n - \varphi(n) + 1$ — call this sum $S$, now known. Combined with $pq = n$ (already known), $p$ and $q$ are exactly the two roots of

$$x^2 - Sx + n = 0 \qquad\Longrightarrow\qquad x = \frac{S \pm \sqrt{S^2 - 4n}}{2}$$

— an ordinary quadratic formula, computable instantly. Verified concretely with the classic textbook pair $p=61, q=53$: $n = 3233$, $\varphi(n)=3120$, so $S = 3233-3120+1=114$, and the quadratic's discriminant $S^2-4n = 64$ is a perfect square ($8^2$), giving roots $\frac{114\pm8}{2} = 61$ and $53$ — the original $p$ and $q$, recovered exactly, with no factoring attempt on $n$ whatsoever.

**Why this matters:** RSA's security assumption is "factoring $n=pq$ is hard." This shows that assumption has a silent side door — an attacker doesn't need to factor $n$ directly if they can obtain $\varphi(n)$ by any *other* means (a side channel, an implementation that computes and logs it, a poorly-designed protocol that transmits it). $\varphi(n)$ is not "helpful auxiliary information" that happens to also be sensitive; it is *cryptographically equivalent* to knowing $p$ and $q$ outright, and Chapter 6 treats it accordingly — computed once during key generation, used immediately to derive the private key, and never stored or transmitted afterward.
</details>

---

**Q2.** RSA's modulus $n=pq$ is composite by design — the entire security assumption rests on $n$ being hard to factor. Given that, could RSA's decryption correctness have been proven using Fermat's Little Theorem directly, instead of needing the more general Euler's Theorem?

<details>
<summary>Answer</summary>

**No — Fermat's theorem, as derived in §5.3, applies only when the modulus is prime, and using a prime modulus would eliminate RSA's entire security basis.** The proof in §5.3 leaned on a specific fact only true for primes: *every* nonzero residue mod $p$ is automatically coprime to $p$, which is exactly what let the bijection argument range over *all* of $\{1,\ldots,p-1\}$. For a composite modulus like $n=pq$, that's false — plenty of residues mod $n$ (namely, all multiples of $p$ or of $q$ that are less than $n$) are *not* coprime to $n$, so Fermat's specific argument breaks down immediately; it simply has nothing to say about exponentiation mod a composite number.

Euler's theorem (§5.4) exists precisely to patch this: by restricting the bijection argument to only the $\varphi(n)$ residues that *are* coprime to $n$, the identical cancellation strategy goes through for **any** modulus, prime or composite. RSA's decryption proof (Chapter 6) needs exactly this generality, because using a prime modulus was never an option — the hardness of factoring a large composite number *is* the security assumption RSA is built on. If $n$ were prime, there would be nothing to factor, no secret splitting into $p$ and $q$, and no RSA. Euler's theorem isn't a more-powerful-than-necessary tool being used out of convenience here; it's the minimum generality RSA's very design requires.
</details>

---

**Q3.** Does every integer $a$ have a modular inverse mod $n$? Using the extended Euclidean algorithm from §5.5, describe exactly what happens when you try to compute one for an $a$ that doesn't have an inverse, and connect this to a concrete requirement Chapter 6 places on RSA's public exponent $e$.

<details>
<summary>Answer</summary>

**No — a modular inverse of $a$ mod $n$ exists if and only if $\gcd(a,n)=1$.** The derivation in §5.5 shows exactly why: Bézout's identity guarantees integers $x,y$ with $a\cdot x + n\cdot y = \gcd(a,n)$, always — the extended Euclidean algorithm never fails to produce *some* such $x,y$. But the useful step — reducing mod $n$ to get $a\cdot x \equiv \gcd(a,n) \pmod n$ — only collapses to "$a \cdot x \equiv 1$," i.e. an actual inverse, when $\gcd(a,n)$ happens to equal exactly $1$. If instead $\gcd(a,n) = d > 1$, the algorithm still runs to completion and still returns valid $x,y$, but the resulting statement is $a\cdot x \equiv d \pmod n$ with $d \neq 1$ — which is a true fact about $a$, $x$, and $d$, but is *not* a modular inverse of $a$, and no other choice of $x$ can produce one either (multiplying $a$, a multiple of $d$, by anything mod $n$ can only ever produce another multiple of $d$, which can equal 1 mod $n$ only if $d=1$).

**The concrete connection to Chapter 6:** RSA key generation needs to compute a private exponent $d$ as the modular inverse of the public exponent $e$, mod $\varphi(n)$ — precisely the operation just derived, using precisely this algorithm. For that inverse to exist at all, RSA key generation must choose $e$ **specifically so that $\gcd(e, \varphi(n)) = 1$** — this isn't an arbitrary design rule quoted without justification; it is the exact, necessary-and-sufficient condition this section just derived for a modular inverse to exist in the first place. If a key-generation implementation ever chose an $e$ that failed this check, there would be no valid $d$ to compute, and RSA key generation for that $(e, n)$ pair would be mathematically impossible, not just insecure.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Modular arithmetic | Addition/multiplication can be reduced mod $n$ at any intermediate step without changing the final result — the fact that makes fast exponentiation possible |
| Euler's totient $\varphi(n)$ | Count of integers coprime to $n$; derived $\varphi(p)=p-1$ (prime) and $\varphi(pq)=(p-1)(q-1)$ (distinct primes) via inclusion-exclusion, both verified by brute-force count |
| Fermat's Little Theorem | $a^{p-1}\equiv 1 \pmod p$ for prime $p$; proved via the bijection/permutation argument on nonzero residues mod $p$, verified numerically |
| Euler's Theorem | $a^{\varphi(n)} \equiv 1 \pmod n$ for any $n$ with $\gcd(a,n)=1$ — generalizes Fermat to composite moduli via the identical argument restricted to the $\varphi(n)$ coprime residues; this is the theorem Chapter 6 uses to prove RSA decryption works |
| Extended Euclidean algorithm | Computes $\gcd(a,b)$ *and* Bézout coefficients $x,y$ with $ax+by=\gcd(a,b)$ in one pass; when $\gcd(a,n)=1$, $x \bmod n$ is the modular inverse of $a$ — verified against Python's built-in inverse |
| Modular inverse existence | Exists iff $\gcd(a,n)=1$ — directly forces RSA's requirement that the public exponent $e$ be chosen coprime to $\varphi(n)$ |
| Square-and-multiply | Computes $a^e \bmod n$ in $\approx 2\log_2(e)$ multiplications instead of $e-1$ — the difference between milliseconds and more multiplications than atoms in the universe at RSA/DH key sizes; verified against Python's built-in `pow` |

**Where we go next:** Every tool built in this chapter — $\varphi(n)$, Euler's theorem, the extended Euclidean algorithm, square-and-multiply — exists for exactly one destination: Chapter 6 assembles them into RSA, derives step by step why decryption actually recovers the original plaintext, and verifies the entire key-generation-through-decryption pipeline on real numbers.

---

*Next: [06 — RSA](06_RSA.md)*
