# Chapter 7 — Diffie-Hellman & Elliptic Curve Cryptography

> "RSA solved key distribution by giving everyone a permanent mailbox with a public slot and a private key. Diffie-Hellman solves the same problem completely differently: two strangers, in full view of an eavesdropper who hears every bit exchanged, agree on a secret that eavesdropper cannot feasibly compute — and neither party had to have a key pair to begin with."

---

## The Problem

Chapter 6 solved key distribution, but the solution has a shape worth noticing: RSA requires each party to have already generated a *permanent* key pair. That permanence is a liability as much as a convenience — if a private key is ever compromised, every message ever encrypted to it, past or future, becomes retroactively readable by whoever holds it. What would be genuinely better is a way for two parties to agree on a **brand-new secret, generated fresh, for this conversation only** — so that compromising today's secret reveals nothing about yesterday's or tomorrow's.

Whitfield Diffie and Martin Hellman's 1976 paper, *New Directions in Cryptography*, proposed exactly this, and it doesn't use RSA's hard problem (factoring) at all — it uses a different one. This chapter derives the protocol, derives precisely why an eavesdropper can't break it, derives — just as carefully — the one thing it conspicuously fails to protect against, and then shows that the entire protocol survives, unchanged, when moved into a completely different mathematical group: points on an elliptic curve.

---

## 7.1 The Diffie-Hellman Protocol

**Public setup:** agree on a large prime $p$ and a **generator** $g$ (an integer whose powers $g^1, g^2, \ldots \bmod p$ cycle through — ideally — every nonzero residue mod $p$ before repeating). Both $p$ and $g$ are completely public; anyone, including an eavesdropper, knows them.

**The exchange:**

1. Alice picks a **secret** integer $a$, computes $A = g^a \bmod p$, and sends $A$ publicly.
2. Bob picks a **secret** integer $b$, computes $B = g^b \bmod p$, and sends $B$ publicly.
3. Alice computes $B^a \bmod p$. Bob computes $A^b \bmod p$.

**Why these two computations produce the same value — derived, not assumed:**

$$B^a = (g^b)^a = g^{ba} \qquad\qquad A^b = (g^a)^b = g^{ab}$$

Since ordinary integer multiplication is commutative, $ba = ab$ — so $g^{ba} = g^{ab}$, exactly, for *any* choice of $a$ and $b$, not just ones that happen to work out numerically. Both parties land on the identical shared secret $g^{ab} \bmod p$, having each performed only *one* exponentiation with their own secret exponent, and having never transmitted $a$ or $b$ themselves anywhere.

**Verified worked example:**

```
Public parameters: p=23 (prime), g=5 (generator)
Alice's secret a=6, public A = g^a mod p = 8
Bob's secret   b=15, public B = g^b mod p = 19
Alice computes B^a mod p = 2
Bob computes   A^b mod p = 2
Shared secrets match: True
Direct check g^(ab) mod p = 2   (matches)
```

Both sides derive `2`, without either one ever knowing the other's secret exponent, using only values ($p$, $g$, $A$, $B$) that were exchanged in full public view.

---

## 7.2 Why This Is Hard to Reverse: The Discrete Logarithm Problem

An eavesdropper watching this exchange sees $p$, $g$, $A$, and $B$ — everything except $a$ and $b$ themselves. Computing $A=g^a\bmod p$ *forward*, given $a$, is exactly Chapter 5 §5.6's square-and-multiply — cheap, roughly $2\log_2(a)$ multiplications, regardless of how large $p$ is. Reversing it — given $g$, $p$, and $A$, find the exponent $a$ that produces it — is the **discrete logarithm problem**, and no algorithm is known that solves it efficiently in general. This asymmetry (cheap forward, believed-hard backward) is the entire security argument, and it's worth confirming both halves rather than trusting the claim.

**Verified — the backward direction really is only brute-forceable at this toy size:**

```
Eavesdropper sees p=23, g=5, A=8. Brute-forcing all 23 possible exponents:
Recovered a = 6   (matches the real secret exactly)
```

An eavesdropper armed with nothing but patience recovers Alice's secret exponent instantly here — because there are only 23 candidates to check. This toy example is *not* secure; it's small specifically so the arithmetic is checkable by hand and by a quick script. Real Diffie-Hellman uses primes with hundreds of digits, which makes the identical brute-force strategy require on the order of $10^{\text{hundreds}}$ candidates — while Alice and Bob's own cost barely changes at all, since square-and-multiply's cost grows only with the number of *bits* of the exponent, not the size of the search space an attacker faces.

**One more nuance worth flagging, because it directly motivates §7.4:** brute force isn't actually the *best* known attack on this specific kind of group. Generic algorithms like baby-step-giant-step solve the discrete log problem in roughly $\sqrt{p}$ time in *any* group — already far better than brute force's $p$ time — and for the specific multiplicative-group-of-integers-mod-$p$ setting used here, even faster **index calculus** methods exist, running in sub-exponential time (the same qualitative category of shortcut Chapter 6 flagged for RSA's factoring attacks). This is exactly why real classical Diffie-Hellman needs primes of at least 2048–3072 bits, not merely "big enough that $\sqrt{p}$ is large" — the group itself has a known structural weakness that a generic square-root-time analysis would understate.

---

## 7.3 The Gap DH Doesn't Close: No Authentication

Everything in §7.1–§7.2 protects against a **passive** eavesdropper — someone who only *listens*. It says nothing at all about an **active** attacker who can intercept and substitute messages in transit. This gap isn't a minor caveat; it's total.

**Derive the attack precisely.** Suppose Mallory sits directly on the wire between Alice and Bob and can intercept and replace anything either one sends. When Alice broadcasts her public value intending it for Bob, Mallory intercepts it and sends Alice a *different* public value of Mallory's own choosing instead — Alice has no way to tell it apart from a real one, because nothing about the DH protocol as derived above ties a public value to *who* generated it. Symmetrically for what Bob receives. Mallory simply runs **two separate, complete Diffie-Hellman exchanges** — one with Alice, in which Mallory poses as Bob, and one with Bob, in which Mallory poses as Alice — ending up with two *different* shared secrets, one per victim.

**Verified concretely.** Continuing the §7.1 numeric setup, Mallory picks her own secret exponent for each side of the conversation and substitutes her own public values:

```
Alice's resulting 'shared secret' = 9
Mallory<->Alice secret (computed independently by Mallory) = 9
Match: True   <- Alice actually shares a secret with MALLORY, not Bob

Bob's resulting 'shared secret' = 3
Mallory<->Bob secret (computed independently by Mallory) = 3
Match: True   <- Bob actually shares a secret with MALLORY, not Alice

Alice's secret vs Bob's secret: False   <- they share NOTHING with each other
```

Alice and Bob each complete the protocol successfully, each compute *a* shared secret, and neither one has any indication anything went wrong — but the two secrets are different, held by Mallory on both sides. Mallory can decrypt everything Alice sends (using the Alice-Mallory key), read it, re-encrypt it under the Bob-Mallory key, and forward it — invisibly, in both directions, indefinitely.

**Why this happened, structurally:** nothing in §7.1's protocol ever checks *whose* public value $A$ or $B$ is — only that *some* valid exponentiation happened. Diffie-Hellman, exactly as derived, provides confidentiality against passive listening and absolutely no **authentication**. The fix has to come from *outside* the exchange itself: bind each public value to a claimed identity using something only the real Alice or real Bob could produce — a **digital signature** over the exchanged public values, using a key pair whose authenticity is established some other way (Chapter 9 derives signatures in full; Chapter 11 shows exactly how TLS uses this to authenticate a real DH — or ECDH — exchange in practice). Unauthenticated Diffie-Hellman, exactly as presented in §7.1, is a teaching example. No real deployment ships it without an authentication layer on top.

---

## 7.4 Elliptic Curve Cryptography — Same Protocol, Different Group

Everything derived in §7.1–§7.3 depended on exactly one structural fact: a **group** where computing $g^a$ forward is cheap and reversing it (discrete log) is hard. Nothing about the argument specifically required that group to be "integers mod a prime under multiplication." Swap in a *different* group with the same forward-cheap/backward-hard property, and the identical protocol — same algebra, same MITM gap, same fix — carries over unchanged.

**Why bother swapping groups at all?** Because §7.2 already flagged that the classical mod-$p$ multiplicative group has a real weakness: sub-exponential index-calculus attacks, which is exactly why it needs such large primes (2048–3072+ bits). **Elliptic curve groups are believed to have no such shortcut** — the best known *general*-purpose attack against elliptic curve discrete log runs in the generic $\sqrt{p}$-time class (via an algorithm called Pollard's rho, not derived here), with no known faster structural attack analogous to index calculus. That single difference is worth an enormous amount in practice: per the same NIST equivalence table already cited in Chapter 6, a **256-bit** elliptic curve key reaches roughly the same real-world security as **RSA-3072** or classical DH-3072 — an order of magnitude fewer bits for the same protection, because the *best known attack* against the smaller group is proportionally so much weaker.

**The group, concretely.** An elliptic curve over a finite field is the set of points $(x,y)$ satisfying $y^2 = x^3+ax+b \pmod p$ for fixed constants $a,b,p$, together with one extra formal element called the **point at infinity** ($\mathcal{O}$), which plays the role of the identity element (the "0" of this group — analogous to how $1$ was the identity for multiplication mod $p$ in §7.1).

**Point addition, derived geometrically.** Given two distinct points $P$ and $Q$ on the curve, draw the straight line through them. Algebraically, substituting that line's equation into the curve's cubic equation produces a cubic with exactly three roots (over the reals; the same algebra carries through mod $p$) — two of them are $P$ and $Q$'s $x$-coordinates, so there is exactly **one third intersection point** with the curve. Reflecting that third point across the $x$-axis (negating its $y$-coordinate) defines $P+Q$. Doubling a point ($P+P$) uses the **tangent line** at $P$ in place of a secant through two distinct points, since there's no second point to draw a line through. This reflection step is what makes the point set close under this operation into a genuine group: the point at infinity acts as the identity ($P + \mathcal{O} = P$), $(x,y)$'s inverse is $(x,-y)$ (a vertical line through both meets the curve at infinity, by construction), and associativity — a real but more involved algebraic fact — holds, though its full proof is out of scope here, the same way Chapter 3 used $\mathrm{GF}(2^8)$'s field properties without re-proving the field axioms from scratch.

**Scalar multiplication — the exact structural echo of Chapter 5's square-and-multiply.** To compute $k \cdot P$ (add $P$ to itself $k$ times) efficiently, use **double-and-add**: process the bits of $k$, always *doubling* the running result, and *adding* $P$ whenever the current bit is 1. This is, mechanically, the identical algorithm as Chapter 5 §5.6's square-and-multiply, with "square" replaced by "double a point" and "multiply by the base" replaced by "add the base point" — the same reason it exists (avoid $k-1$ separate additions) and the same complexity gain ($\approx 2\log_2 k$ point operations instead of $k$).

**Verified on a real toy curve**, $y^2 = x^3 + 2x + 2 \pmod{17}$:

```
Non-singularity check: 4a^3+27b^2 mod p = 4  (must be != 0): OK
Total points on curve (including point at infinity): 19
Base point G = (0, 6), on curve: True
Order of G (smallest k with kG = point at infinity): 19
scalar_mult(19, G) = None  (point at infinity, as required)

Manual G+G+G+G+G = (10, 11)
scalar_mult(5, G) = (10, 11)
Match: True
```

The curve has exactly 19 points total, and $G=(0,6)$ turns out to generate all 19 of them — a clean, verified example where scalar multiplication really does behave as a group operation (adding $G$ to itself 19 times, via *either* five direct additions repeated or the double-and-add algorithm, returns to the identity, confirmed both ways).

**ECDH — the exact same protocol as §7.1, with $g^a \bmod p$ replaced by $a\cdot G$:**

```
Alice's secret a=7, public point A = a*G = (13, 10)
Bob's secret   b=11, public point B = b*G = (5, 1)
Alice computes a*B = (0, 6)
Bob computes   b*A = (0, 6)
Shared points match: True
Direct check (ab)*G = (0, 6)  (matches)
```

Identical structure, identical correctness argument ($a(bG) = (ab)G = b(aG)$ by the same commutativity-of-scalar-multiplication reasoning as §7.1's exponent argument), identical result: both parties land on the same shared point using only publicly exchanged values. And — worth stating explicitly, since it's easy to assume swapping in a "stronger" group fixes everything — **ECDH inherits §7.3's man-in-the-middle vulnerability completely unchanged.** Nothing about the MITM attack derived there depended on the group being multiplication mod a prime; the identical two-separate-exchanges attack works, unmodified in structure, against unauthenticated ECDH. A stronger group raises the bar against discrete-log attacks; it does nothing whatsoever about authentication, which remains Chapter 9's problem to solve.

---

## Section Challenge

---

**Q1.** Verify *algebraically*, without relying on the fact that the numbers happened to match in §7.1's worked example, why $B^a \bmod p$ and $A^b \bmod p$ are **guaranteed** to be equal for any secret exponents Alice and Bob choose.

<details>
<summary>Answer</summary>

**It follows from one property of ordinary integers: multiplication is commutative — nothing about the specific values chosen matters at all.**

By definition, $A = g^a \bmod p$ and $B = g^b \bmod p$. Substituting:

$$B^a \bmod p = (g^b)^a \bmod p = g^{ba} \bmod p \qquad\qquad A^b \bmod p = (g^a)^b \bmod p = g^{ab} \bmod p$$

Both expressions reduce to $g$ raised to a product of $a$ and $b$ — and because $b\cdot a = a \cdot b$ for any integers $a,b$ (multiplication of ordinary integers is commutative, unconditionally), $g^{ba} = g^{ab}$ **identically**, before any specific numbers are ever substituted in. The worked example's match ($B^a \equiv A^b \equiv 2 \pmod{23}$) isn't a fortunate coincidence to be spot-checked — it's the necessary consequence of an algebraic identity that holds for *every* possible pair of secret exponents, which is exactly why the protocol is trustworthy as a general-purpose construction rather than something that merely happened to work in one example.
</details>

---

**Q2.** The toy example in §7.2 was broken by an eavesdropper in an instant, via brute force. Does this mean Diffie-Hellman's real-world security is *only* a matter of picking a big enough prime to make brute force infeasible?

<details>
<summary>Answer</summary>

**No — brute force is the weakest attack an implementation has to survive, not the only one, and this is the same lesson Chapter 3 and Chapter 6 both already established for different mechanisms.**

Making $p$ large enough that trying all $p$ possible exponents is infeasible does defeat *brute force* specifically — but §7.2 explicitly named two better attacks: baby-step-giant-step, a **generic** algorithm (works in any group) that solves discrete log in roughly $\sqrt{p}$ operations rather than $p$, and **index calculus**, a *structural* attack specific to the multiplicative-group-mod-$p$ setting that runs in sub-exponential time — meaningfully faster than even the $\sqrt{p}$ generic bound. A prime chosen only large enough to defeat brute force, while ignoring these faster known attacks, would still be breakable well within a real attacker's reach.

This is precisely the same shape of reasoning Chapter 3 §3.10 used for AES's round count (chosen as a margin above the best known *cryptanalytic shortcut*, not merely enough to defeat brute-force key search) and Chapter 6's Section Challenge Q3 used for RSA's key size (chosen to outpace sub-exponential *factoring* algorithms, not merely brute force). Real Diffie-Hellman parameter selection follows the identical principle: choose $p$ large enough to stay safely ahead of the *best currently known* attack against this specific group (index calculus, here), with a deliberate safety margin for future improvements in that attack — which is also exactly why §7.4 motivates switching to elliptic curve groups at all: not because bigger primes were unavailable, but because a group *without* a known sub-exponential shortcut lets the same security level be reached with dramatically fewer bits.
</details>

---

**Q3.** Does switching from classical Diffie-Hellman to ECDH fix the man-in-the-middle vulnerability derived in §7.3, since elliptic curve cryptography is generally described as "stronger"?

<details>
<summary>Answer</summary>

**No — and §7.4 said so explicitly, but it's worth deriving independently why "stronger" doesn't help here.** The man-in-the-middle attack in §7.3 never used any property specific to the multiplicative group mod $p$ — it only used the fact that the bare protocol never checks *who* sent a given public value. Mallory's attack was: intercept, substitute her own public value, complete two independent full exchanges, one per victim. Every step of that attack translates over to ECDH with zero modification beyond swapping "$g^a \bmod p$" for "$a\cdot G$" throughout — Mallory picks two scalars instead of two exponents, computes two elliptic-curve points instead of two mod-$p$ integers, and ends up holding two distinct shared *points*, one per victim, exactly as before.

**This is the same "independent failure axes" lesson from Chapter 6's Section Challenge Q2, recurring at the protocol level instead of the implementation level.** There, key size (defends against factoring) and padding scheme (defends against malleability/determinism) were shown to be independent knobs — turning one does nothing to the other. Here, *which group the discrete-log problem is instantiated in* (defends against faster-than-generic discrete-log attacks, §7.4's entire motivation) and *whether the exchanged values are authenticated* (defends against active interception, §7.3) are similarly independent. ECDH's smaller keys and stronger discrete-log hardness are a real, valuable upgrade over classical DH — for exactly the threat model §7.4 targeted. They are not, and were never intended to be, an answer to §7.3's threat model at all. Authentication has to be added on top, via digital signatures (Chapter 9), regardless of which flavor of Diffie-Hellman sits underneath it.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Diffie-Hellman exchange | $A=g^a\bmod p$, $B=g^b\bmod p$ exchanged publicly; both sides compute $g^{ab}\bmod p$ via $B^a=A^b$ — verified numerically and confirmed algebraically via commutativity of integer multiplication |
| Discrete logarithm problem | Forward exponentiation is cheap (Ch5 §5.6's square-and-multiply); reversing it is believed hard — verified that brute force *does* break the toy-scale example, specifically because the toy prime is small enough to enumerate |
| Index calculus / faster attacks | The classical mod-$p$ group admits sub-exponential attacks beyond generic $\sqrt{p}$ methods, which is why real classical DH needs 2048–3072+ bit primes — the same "margin above best known attack" principle as Ch3's AES rounds and Ch6's RSA key size |
| Man-in-the-middle | DH protects only against passive eavesdroppers; verified that an active attacker running two separate DH exchanges (one per victim) ends up holding two different shared secrets, invisibly, with neither victim able to detect it |
| The fix (forward reference) | Authenticating the exchanged public values (digital signatures, Chapter 9) — unauthenticated DH/ECDH is never deployed as-is in practice (Chapter 11) |
| Elliptic curve groups | Points $(x,y)$ on $y^2=x^3+ax+b\bmod p$ plus a point at infinity as identity; point addition derived geometrically (chord/tangent + reflection) — verified on a real 19-point toy curve |
| Scalar multiplication (double-and-add) | The exact same algorithmic shape as Ch5 §5.6's square-and-multiply, with doubling/adding points instead of squaring/multiplying integers — verified against manual repeated addition |
| ECDH | Identical protocol to §7.1 with $a\cdot G$ replacing $g^a\bmod p$ — verified full key agreement on the toy curve; inherits §7.3's MITM gap completely unchanged, since group choice and authentication are independent concerns |
| Why ECC at all | No known sub-exponential attack on the elliptic curve discrete log problem (unlike the classical group) — a 256-bit EC key matches RSA-3072/AES-128 (NIST equivalence, also cited in Ch6) |

**Where we go next:** This chapter solved *secrecy* between two parties who've never met, and *explicitly* left authentication as an open gap — Mallory could impersonate anyone, because nothing here proves identity. Before that gap can be closed with signatures (Chapter 9), the course needs one more foundational tool: a way to condense an arbitrarily large message down to a small, fixed-size fingerprint that changes unpredictably if even one bit of the input changes. Chapter 8 builds cryptographic hash functions from exactly that requirement.

---

*Next: [08 — Cryptographic Hash Functions](08_Cryptographic_Hash_Functions.md)*
