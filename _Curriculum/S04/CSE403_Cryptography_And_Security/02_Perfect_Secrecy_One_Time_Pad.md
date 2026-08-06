# Chapter 2 — Perfect Secrecy & the One-Time Pad

> "There is exactly one cipher in the history of cryptography that is mathematically, provably, permanently unbreakable — no matter how much computing power an attacker ever gets, forever. This chapter builds it, proves it, and then explains why you have almost certainly never used it."

---

## The Problem

Chapter 1 ended on an uncomfortable observation: every classical cipher was "secure" right up until it wasn't. Vigenère was called "indecipherable" for 300 years by people who simply hadn't found the attack yet. That's not a security guarantee — it's a track record, and track records end.

So here's a sharper question: can we define, mathematically, what "unbreakable" would even *mean* — precisely enough that we could *prove* a cipher satisfies it, rather than just fail to break it for a few centuries?

Claude Shannon answered this in 1949, in the paper that founded the entire mathematical theory of cryptography. This chapter derives his definition, builds the one cipher that meets it, and then shows exactly why that cipher is almost useless in practice — which is the honest reason modern cryptography (starting Chapter 3) doesn't use it.

---

## 2.1 Defining "Unbreakable" — Perfect Secrecy

What would it mean for a ciphertext to give an attacker *zero* information about the plaintext?

Before seeing any ciphertext, an attacker has some belief about what the message might say — call this the **prior probability** $P(M = m)$ for each possible message $m$ (maybe they think "ATTACK AT DAWN" is likelier than "SEND MORE STAPLES," based on context). After intercepting a specific ciphertext $c$, the attacker's belief updates to $P(M = m \mid C = c)$ — the **posterior probability**.

**Shannon's definition of perfect secrecy:** a cipher has perfect secrecy if, for every plaintext $m$ and every ciphertext $c$:

$$P(M = m \mid C = c) = P(M = m)$$

In words: **seeing the ciphertext changes nothing.** The attacker's belief about the message after seeing $c$ is *identical* to their belief before seeing anything. The ciphertext is statistically independent of the plaintext. This is a dramatically stronger requirement than "hard to break" — it says the ciphertext carries *literally zero bits* of information about the message, regardless of how much computing power, how much cleverness, or how much time the attacker has. Not "computationally infeasible to break." **Impossible** to break, in the same sense that it's impossible to determine a fair coin's outcome by looking at a wall it wasn't flipped near.

This is an extremely high bar. Let's see if anything can clear it.

---

## 2.2 The One-Time Pad Construction

**The construction:** to encrypt a plaintext $m$ (as a bit string, or equivalently a string of numbers mod 26 as in Chapter 1), generate a key $k$ that is:

1. **The same length as the message**,
2. **Chosen uniformly at random** (every possible key string equally likely), and
3. **Combined with the message via XOR** (bits) or **modular addition** (letters):

$$c = m \oplus k \qquad \text{(bits)} \qquad \text{or} \qquad c_i = (m_i + k_i) \bmod 26 \qquad \text{(letters)}$$

To decrypt: $m = c \oplus k$ (XOR is its own inverse) or $m_i = (c_i - k_i) \bmod 26$.

**Worked example (bytes, matching how it's used in practice):**

```
message:  ATTACK   (bytes: 41 54 54 41 43 4B)
key:      (random) d6 8e d8 1c 07 ed
cipher:   msg XOR key = 97 da 8c 5d 44 a6
decrypt:  cipher XOR key = 41 54 54 41 43 4B = ATTACK  ✓ (verified by direct computation)
```

---

## 2.3 Proving the One-Time Pad Achieves Perfect Secrecy

Here's the argument, made concrete rather than abstract. Take the 4-letter ciphertext `EQNZ` (produced by encrypting some unknown 4-letter plaintext with some unknown random key, using letter-addition as in Chapter 1). An attacker who intercepts `EQNZ` and wants to know the plaintext must ask: **which plaintexts are even consistent with this ciphertext?**

The answer: **every single one of them.** For *any* candidate 4-letter plaintext you propose, there exists *exactly one* key that would produce `EQNZ` from it — because $k = c - m \pmod{26}$ always has a unique solution:

| Candidate plaintext | Implied key ($k = c - m$) | Re-encrypt with that key | Matches `EQNZ`? |
|---|---|---|---|
| `HELP` | `XMCK` | `EQNZ` | ✓ |
| `SEND` | `MMAW` | `EQNZ` | ✓ |
| `MEET` | `SMJG` | `EQNZ` | ✓ |
| `ABCD` | `EPLW` | `EQNZ` | ✓ |
| `ZZZZ` | `FROA` | `EQNZ` | ✓ |

(Verified by direct computation — each of these five wildly different plaintexts really does map to the identical ciphertext `EQNZ` under its own implied key.) This isn't a coincidence limited to these five — it's true of **all $26^4$ possible 4-letter strings**. Every one of them is exactly as consistent with the observed ciphertext as every other one, *provided the key was truly uniform random*. There is no computation, no cleverness, no amount of staring at `EQNZ` that favors `HELP` over `ZZZZ` — because the key that would make either one true is equally likely to have been chosen.

**The formal proof sketch:** for a fixed ciphertext $c$, the map $k \mapsto m = c - k$ is a *bijection* between keys and plaintexts (every key gives a different plaintext, and every plaintext is hit by exactly one key). Since $k$ was chosen uniformly at random over the full key space, and this map is a bijection, the *resulting* $m$ is **also uniformly distributed** over the full plaintext space — regardless of which $c$ you condition on. That's exactly Shannon's condition: $P(M=m \mid C=c)$ works out to be the same for every $m$, matching $P(M=m)$ before any ciphertext was seen. The one-time pad achieves perfect secrecy. This is not a claim that's held up for 300 years like Vigenère's reputation — it's a proof that holds forever.

---

## 2.4 Shannon's Theorem — The Price of Perfection

Perfect secrecy sounds too good to be true, and there's a reason it's rarely used: Shannon also proved a matching **lower bound** on what it costs.

**Shannon's theorem:** any cipher with perfect secrecy must have a key space at least as large as the message space: $|K| \geq |M|$.

**Why (counting argument):** fix any ciphertext $c$ that occurs with nonzero probability. For perfect secrecy to hold, *every* plaintext $m$ must be reachable from $c$ by *some* key (otherwise $P(M=m \mid C=c) = 0 \neq P(M=m)$ for that $m$, violating the definition outright). Each key $k$ can only map $c$ back to *one* specific plaintext ($m = D_k(c)$, decryption is a function). So to reach all $|M|$ possible plaintexts from this one ciphertext, you need at least $|M|$ distinct keys. Hence $|K| \geq |M|$.

**What this means concretely:** to perfectly-secretly encrypt a 1 GB file, you need a *truly random* key that is *also 1 GB*, used for that file *and only that file*, and both parties must already share that key over some channel secure enough that an attacker never sees it. If you had a channel that secure, you could have just sent the 1 GB message over it directly.

This is the punchline of the whole chapter: **perfect secrecy is not an engineering goal you fall short of and improve toward — it's a mathematical wall.** You cannot have a key shorter than the message and *also* have perfect secrecy; the counting argument above isn't a limitation of the one-time pad's particular design, it's a limitation of *any possible cipher* that achieves Shannon's definition. AES uses a 256-bit key to encrypt gigabytes of data — by Shannon's theorem, **AES cannot possibly have perfect secrecy.** This is not a flaw discovered by cryptanalysts; it is a mathematical certainty, known in advance, accepted on purpose. Chapter 3 explains exactly what weaker (but achievable, and good enough) guarantee AES offers instead.

---

## 2.5 Why the One-Time Pad Is (Almost) Never Used

Perfect secrecy, achieved — so why doesn't everyone use one-time pads? Three requirements, each individually brutal:

**1. The key must be truly random.** Not a password, not output from a predictable algorithm, not "looks random to a human" — genuinely uniform over every possible key of that length. Generating gigabytes of true randomness (from hardware entropy sources) at the rate modern systems move data is a real engineering problem in its own right.

**2. The key must never be reused — not even once, not even partially.** Reuse breaks the *entire* guarantee, not just "weakens" it. Recall the attack Chapter 1's Section Challenge previewed:

```
key reused for two messages:
  ATTACK  (key QRSTUV) -> c1 = QKLTWF
  RETREA  (key QRSTUV) -> c2 = HVLKYV

  c1 - c2 (mod 26) = JPAJYK
  p1 - p2 (mod 26) = JPAJYK      <- identical! the key cancelled out completely
```

(Verified by direct computation, and the same cancellation holds bit-for-bit with XOR on real bytes: `c1 XOR c2 == m1 XOR m2` exactly.) The moment a key is reused, an attacker can combine the two ciphertexts and eliminate the key entirely, reducing the problem to "recover two plaintexts from their difference" — which is exactly the kind of statistical/linguistic attack Chapter 1 used to defeat Vigenère, because English-minus-English is not random. **A two-time pad has *none* of the one-time pad's guarantees.** This is why it's not called a "reduced-security pad" — reuse doesn't degrade the security, it deletes it.

**3. The key must be distributed as securely as the message, and be exactly as long.** This is the circular problem: to send a perfectly-secret 1 GB message, you need to have already securely shared a 1 GB random key. Whatever channel you used to share that key was, by definition, secure enough to have just sent the message. One-time pads solve the *encryption* problem while leaving the *key distribution* problem exactly as hard as the original problem — they don't eliminate the hard part, they relocate it.

(One-time pads *are* used in narrow, high-value settings where the cost is worth it — historically for diplomatic and intelligence communications with pre-shared physical key material, distributed once under heavy security and consumed a page at a time, never reused. That's the exception that proves the rule: it only works when key distribution is a solved problem for entirely separate reasons.)

---

## 2.6 The Path Forward: From Perfect to Computational Security

Shannon's theorem is not a dead end — it's a fork in the road, and it tells us exactly what both paths look like:

- **Information-theoretic security** (what this chapter built): security that holds against an attacker with *unlimited* computing power, forever. Achievable, but Shannon's theorem proves it *requires* a key as long as the message, used once. Impractical for almost everything.
- **Computational security** (where the rest of this course lives): security that holds against any attacker with *realistic, bounded* computing power — say, unable to try more than $2^{128}$ operations before the sun burns out. This is a strictly weaker guarantee *in principle*. But it turns out to be strong enough in practice to protect every bank transaction, every HTTPS connection, and every encrypted message sent today, while using a *short, reusable* key.

The trick that makes computational security work: instead of a truly random key as long as the message, use a *short* random key to seed a deterministic algorithm that *behaves* as if it were producing random-looking output — a **pseudorandom function**. It isn't actually random (an attacker with infinite time could eventually distinguish it from true randomness), but if no *realistic* amount of computation can tell the difference, that's good enough for every practical purpose. Chapter 3 builds exactly this: block ciphers, and the specific one — AES — that the entire world now trusts to do the job the one-time pad does, without paying the one-time pad's price.

---

## Section Challenge

---

**Q1.** A student proposes: "Let's make the one-time pad practical by generating the key from a *pseudorandom number generator* (PRNG) seeded with a short, easy-to-share 128-bit password, instead of a truly random key as long as the message." Does this scheme still have perfect secrecy? Justify using Shannon's theorem directly, not just intuition.

<details>
<summary>Answer</summary>

**No — and Shannon's theorem proves it can't, without even analyzing the PRNG's quality.**

The scheme's *effective* key space is now the space of 128-bit passwords: $|K| = 2^{128}$. That's the only source of randomness in the entire system — the PRNG is a deterministic function of the seed, so once the seed (password) is fixed, the entire "random-looking" keystream is fixed too. If the message space $|M|$ (e.g., all possible messages up to some large length) exceeds $2^{128}$ — which it does for almost any file bigger than 16 bytes — then $|K| < |M|$, and Shannon's theorem says perfect secrecy is **mathematically impossible**, regardless of how good the PRNG is.

Concretely: by the counting argument from §2.4, for perfect secrecy every plaintext consistent with a given ciphertext needs its own key. With only $2^{128}$ possible keys but far more than $2^{128}$ possible messages, most messages simply have **no key at all** that could produce a given ciphertext — meaning $P(M=m \mid C=c) = 0$ for those messages, which is not equal to their prior probability $P(M=m)$ unless that prior was already zero. The definition is violated by construction, before you've analyzed a single line of the PRNG's code.

**This does not mean the scheme is insecure** — this is, in fact, *exactly* the idea behind stream ciphers and Chapter 3's block ciphers in counter mode: a short key expands into a long pseudorandom-*looking* stream. What it means is that the scheme has given up perfect (information-theoretic) secrecy and now needs a different, computational argument for why it's still secure in practice — namely, that no realistic attacker can distinguish the PRNG's output from true randomness. That's a genuinely different (weaker, but achievable) kind of proof, and building it rigorously is the entire subject of Chapter 3.
</details>

---

**Q2.** Suppose a careless engineer implements a one-time pad correctly (true random key, used once) for encrypting network traffic, but generates the random key using a PRNG seeded from `time.now()` (the current timestamp) instead of a proper hardware entropy source. Is this still "perfect secrecy" in Shannon's sense? What actually breaks?

<details>
<summary>Answer</summary>

**No — the key is no longer uniformly random, even though it's used only once, so the proof in §2.3 no longer applies.**

The proof that the OTP achieves perfect secrecy depended critically on one clause: *the key was chosen uniformly at random* over the full key space. A timestamp-seeded PRNG produces a key that is a **deterministic function of a value with very little real entropy** — a Unix timestamp to the nearest second only has as many "reasonably likely" values as there are seconds in the plausible window an attacker would guess (hours or days, not the full $2^{256}$-or-whatever key space). The bijection argument in §2.3 required every key to be equally likely; here, the vast majority of the theoretical key space has *probability zero* of ever being chosen, and a small, guessable set of keys has all the probability mass.

**What actually breaks:** an attacker doesn't need to search the full key space. They guess a plausible range of timestamps (a much, much smaller space — hours, not $2^{256}$), regenerate the PRNG output for each candidate, and check which one decrypts the ciphertext into something that looks like valid traffic. This is a brute-force attack over *seconds of plausible send-time*, not over the key space — often practical in well under a second of computation.

**The lesson, stated generally:** "used only once" (property 2 from §2.5) and "truly random" (property 1) are *both independently required*, and violating either one alone is enough to destroy the guarantee completely — there's no partial credit. A predictable-but-unique key fails exactly as badly as a random-but-reused key, just via a different attack. This is precisely why real systems get audited specifically for their random number generation (`/dev/urandom`, hardware RNGs, CSPRNGs) — the one-time pad's security proof has zero tolerance for a "close enough to random" key.
</details>

---

**Q3.** Shannon's theorem says $|K| \geq |M|$ is *necessary* for perfect secrecy. Is it *sufficient*? That is: if you have a key space at least as large as the message space, does that guarantee perfect secrecy, no matter how the encryption function combines key and message?

<details>
<summary>Answer</summary>

**No — $|K| \geq |M|$ is necessary but not sufficient.** The *size* of the key space isn't what makes the OTP work; the specific bijective structure of the combining function (mod-26 addition, or XOR) is what does the work, combined with *uniform* key selection.

**Counterexample:** suppose $|K| = |M|$ (key space exactly as large as needed), but the encryption function is $c = m$ (the "key" is generated but never actually used — a deliberately silly example, but a legal one under "some function combining $m$ and $k$"). The key space is large enough by Shannon's counting bound, but the ciphertext trivially equals the plaintext — zero secrecy, let alone perfect secrecy.

A subtler, more realistic counterexample: suppose the combining function is $c = \max(m, k)$ instead of addition. The key space can be exactly $|M|$, and the key can be chosen uniformly at random, but $P(M=m \mid C=c)$ is **not** uniform — a ciphertext of, say, the maximum possible value is disproportionately likely to have come from a plaintext that was *already* large (since $\max(m,k) = c_{max}$ is satisfied by many key choices when $m$ is large, but requires $k = c_{max}$ exactly when $m$ is small). The attacker learns something: "the plaintext was probably not small." That's a leak — not perfect secrecy — despite $|K| = |M|$ and uniform key selection.

**What actually makes OTP's specific combining function work:** for *every fixed* ciphertext $c$, the function $k \mapsto D_k(c)$ must be a **bijection** onto the full message space — every plaintext reachable, each by exactly one key. Addition mod 26 (or XOR) has this property for free, because it's invertible in both directions for every fixed operand. $\max(\cdot,\cdot)$ does not. **The lesson:** perfect secrecy is a property of the whole triple (key distribution, message space, *and* the specific combining function) — you cannot get it from key-space size alone, and this is exactly why block ciphers in Chapter 3 are built around specific mathematical structures (invertible S-boxes, invertible linear layers) rather than arbitrary "mixing" functions.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Perfect secrecy (Shannon) | $P(M=m \mid C=c) = P(M=m)$ for all $m,c$ — ciphertext carries zero information about plaintext |
| One-time pad | $c = m \oplus k$ with $k$ truly random, message-length, single-use |
| Proof of OTP's perfect secrecy | For any fixed ciphertext, every possible plaintext is reachable by exactly one equally-likely key — a bijection argument |
| Shannon's theorem | Perfect secrecy requires $\lvert K \rvert \geq \lvert M \rvert$ — key must be at least as long as the message |
| Why OTP is impractical | Needs true randomness, zero reuse, and a key-distribution channel as secure and as large as the message itself |
| Two-time pad attack | Reusing a key lets an attacker cancel it via XOR/subtraction of two ciphertexts, destroying the entire guarantee — not just weakening it |
| Necessary ≠ sufficient | $\lvert K \rvert \geq \lvert M \rvert$ alone doesn't guarantee secrecy — the combining function must itself be a bijection for every fixed ciphertext |
| The fork in the road | Information-theoretic security (unconditional, impractical) vs. computational security (bounded-attacker, practical) — the rest of the course lives on the second path |

**Where we go next:** Chapter 3 builds the practical replacement: a short, reusable key expanded — through a carefully designed, publicly known algorithm — into something that behaves like a random permutation to any attacker without unlimited computing power. That's AES, and the chapter derives its structure piece by piece, the same way this chapter derived the one-time pad.

---

*Next: [03 — Block Ciphers & AES](03_Block_Ciphers_AES.md)*
