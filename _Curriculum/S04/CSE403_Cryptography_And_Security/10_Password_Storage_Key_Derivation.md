# Chapter 10 — Password Storage & Key Derivation

> "Every password a human chooses is weaker than it needs to be, and every fast hash function makes that weakness worse. This chapter puts real numbers on both halves of that sentence."

---

## The Problem

Every scheme built so far in this course — AES keys, RSA private keys, Diffie-Hellman secrets — assumed a key drawn uniformly at random from an enormous space. Passwords break that assumption completely: they're chosen by humans, who are bad at randomness and worse at remembering it, and reused across dozens of unrelated services. That second fact alone makes plaintext password storage catastrophic in a way specific to passwords: if one service stores passwords in plaintext and gets breached, every *other* account where a user reused that same password is compromised too, instantly, regardless of how well-defended those other services are. The failure doesn't stay contained to the system that failed.

The obvious fix — store $H(\text{password})$ instead of the password itself — is a real improvement, but this chapter derives, with real numbers rather than hand-waving, exactly how far short it still falls, and builds up to the actual answer in layers: first defeating precomputation, then defeating raw speed, then covering two adjacent mechanisms (TOTP and JWT) that round out how modern systems authenticate people and services.

---

## 10.1 Why $H(\text{password})$ Alone Is Still Broken — Precomputation

$H$ is deterministic: the same password always produces the same hash. This looks harmless until you notice what it enables for an attacker: **precompute $H(\text{candidate})$ for a huge dictionary of candidate passwords once, entirely independent of any specific victim**, and that same table instantly cracks *any* future stolen hash that happens to match an entry — for any number of victims, forever. This is a **time-memory tradeoff**: pay a large amount of time exactly once (building the table), and every subsequent lookup becomes nearly free.

**Verified concretely.** Precompute $H(\text{pin})$ for all 10,000 four-digit PINs:

```
Precomputed SHA-256 table for all 10,000 4-digit PINs: 0.0163 sec (one-time cost)
```

Then "crack" three completely different stolen hashes, simulating three unrelated victims:

```
Looking up 3 DIFFERENT stolen hashes: 0.0024 ms total
Recovered PINs: 4271, 0000, 9999   (all correct: True)
```

Sixteen milliseconds of one-time work, then a fraction of a millisecond *combined* to crack three separate victims — and a fourth, fifth, or four-millionth victim costs the same near-zero marginal amount, because the expensive part already happened, once, in advance. (Real rainbow tables use a more space-efficient chaining trick to cover a far larger candidate space than a plain dictionary could fit in memory, but the core exploitable property — precompute once, reuse against every future victim — is fully captured by the plain dictionary demonstrated here.)

---

## 10.2 Salting — Fixes Precomputation Specifically, Not Brute Force Generally

**The fix:** store $H(\text{salt} \| \text{password})$, with a random salt generated fresh **per user** and stored alongside the hash (the salt itself needs no secrecy at all). This breaks precomputation's central advantage directly: a table built for one salt value only matches hashes computed with that *same* salt. With unique salts, an attacker would need an entirely separate precomputed table *per user* — which defeats the entire "build once, crack everyone" economics that made precomputation attacks powerful in the first place.

**Verified.** The same password, hashed with two different salts:

```
Alice's stored hash: 8a7c6637ab8b9b121f55a4946738f0eb1a579b88a3cedd331959d01551293708
Bob's stored hash:   0df120ffb792a5c211e9460efb6a4ce8081bb58faa068ea81f1d02fe3df1d7a3
Identical despite the same password: False
Alice's hash found in the UNSALTED rainbow table from §10.1: False
```

The precomputed table from §10.1 — built without knowing any salt — is now completely useless against Alice's stored hash, even though her real password (`4271`) was one of the exact 10,000 entries that table covers.

**The half of this that's easy to overlook, and worth deriving explicitly:** salting does **nothing** to slow down an attacker who commits to attacking *one already-identified target hash* directly. Given one specific salted hash and its (public, known) salt, cracking it still costs exactly one hash computation per candidate tried — the same order of cost as attacking an unsalted hash of the same password:

```
Cracking ONE specific salted hash directly:   8.69 ms, 10,000 hash computations
Cracking ONE specific unsalted hash directly: 5.31 ms, same order of computations
```

**The precise scope of what salting buys you:** it eliminates the *cross-victim amortization* advantage that made precomputed dictionaries so devastatingly cheap per-victim. It does nothing whatsoever about the *raw speed* of attacking any single already-targeted hash — that's a completely separate problem, and it's §10.3's problem to solve.

---

## 10.3 Why a Fast Hash Is a Bad Choice for Passwords — The Arithmetic

SHA-256 (Chapter 8) has excellent preimage resistance, and it's deliberately engineered to be **fast** — a genuine virtue for file integrity checks, Merkle trees, and TLS handshakes, all of which want to hash large amounts of data quickly. That exact virtue becomes the fatal flaw once it's applied to password storage specifically, for a reason worth stating precisely: **human-chosen passwords carry far less real entropy than the hash function's own output space** — people choose memorable strings, not uniform random bytes — so the actual search space an attacker needs to cover is dramatically smaller than "however many possible SHA-256 outputs exist." Combine a small real search space with a *fast* per-guess cost, and the arithmetic turns ugly quickly.

**Real, sourced hardware numbers** — published hashcat benchmarks (version 6.2.6) for a single RTX 4090 GPU:

```
Single RTX 4090, SHA-256: 21.51 billion hashes/sec
Single RTX 4090, bcrypt:  240.09 thousand hashes/sec
Ratio: SHA-256 is 89,603x faster than bcrypt on the identical hardware
```

Same chip, same silicon, same electricity bill — an 89,600-times difference, purely because bcrypt is deliberately engineered to resist exactly this kind of throughput.

**Applying this to real password spaces, computed directly rather than estimated:**

```
8-character all-lowercase password space: 26^8 = 208,827,064,576
  Time to exhaust @ SHA-256 GPU rate: 9 seconds
  Time to exhaust @ bcrypt GPU rate:  10 days, 1 hours, 36 minutes, 35 seconds

10-character mixed-case+digit password space: 62^10 = 839,299,365,868,340,224
  Time to exhaust @ SHA-256 GPU rate: 1 years, 86 days ...
  Time to exhaust @ bcrypt GPU rate:  110,851 years, 104 days ...
```

An 8-character all-lowercase password — the kind plenty of real systems still accept — falls in **nine seconds** of brute force against raw SHA-256 on a single consumer GPU. Even a considerably stronger 10-character mixed-case-and-digit password falls in roughly fifteen months on that same single GPU (and real attacks parallelize across many GPUs at once, shrinking that further, potentially to days). Under bcrypt, the identical 10-character space takes over **a hundred thousand years** on the same hardware. Nothing about the *password* changed between these two rows — only the *hash function protecting it*. This is the numeric core of the entire chapter: **speed, which is exactly the right property everywhere else this course has used a hash function, is exactly the wrong property here**, because it directly multiplies an attacker's throughput against a search space that was already dangerously small.

---

## 10.4 Deliberately Slow, Memory-Hard Functions — bcrypt, scrypt, Argon2

**Why not just iterate SHA-256 many times** (hash the output again, and again, tens of thousands of times — a real technique called key stretching, used by the older PBKDF2 standard)? It helps, by a constant factor, but doesn't fix the *structural* problem: GPUs and custom ASICs are specifically excellent at running the same simple operation millions of times in parallel. Iterating a fast hash more times just multiplies a constant into both the legitimate server's cost *and* the attacker's cost equally — it doesn't change the fundamental hardware asymmetry that let a $2,000 GPU outrun a general-purpose CPU by four orders of magnitude in the first place.

**The structural fix is memory-hardness**: require each individual hash *attempt* to consume a large, fixed amount of memory — not just more compute steps. This targets the asymmetry directly, because compute cores and memory capacity scale completely differently: a chip can be built with thousands of small, cheap, identical compute cores, but **memory is physically large, expensive, and fundamentally harder to duplicate thousands of times over on the same die or board.** Forcing every single guess to require tens of megabytes of RAM caps how many guesses can run *truly* in parallel — no matter how many idle compute cores are sitting around waiting for their turn at memory.

**Verified illustrative arithmetic:**

```
A high-end consumer GPU with 24 GB VRAM, hashing a memory-hard function requiring
64 MiB PER HASH ATTEMPT, can run at most 384 truly parallel attempts at once,
REGARDLESS of how many thousands of compute cores the GPU has.

Contrast: a fast hash needs only a few dozen bytes of working state per attempt,
so the same 24 GB could in principle support many millions of concurrent attempts.
```

Sixteen thousand CUDA cores are useless if only 384 of them can ever have their required memory allocated simultaneously — the bottleneck moved from "how fast can you compute" to "how much memory can you provision," and memory is precisely the resource GPUs and ASICs are worst at scaling relative to a general-purpose machine.

**The real algorithms**, each adding its own refinement to this core idea:

- **bcrypt** (Niels Provos and David Mazières, USENIX 1999) — a tunable *cost factor* controlling iteration count, with a moderate, fixed memory footprint; the algorithm demonstrated numerically throughout this chapter.
- **scrypt** (Colin Percival, 2009, originally built for the Tarsnap backup service) — explicitly designed to be memory-hard from the ground up, with independently tunable memory *and* compute cost parameters.
- **Argon2** (winner of the Password Hashing Competition, 2015) — designed specifically to resist both GPU and dedicated ASIC/FPGA attacks via tunable memory, time, and parallelism parameters; generally the current recommended default for new systems.

All three share the same underlying answer to §10.3's problem: deliberately trade speed (a genuine cost to the legitimate server, checking one real login) for a disproportionately larger cost imposed on an attacker checking billions of guesses — and memory-hardness specifically is what keeps that trade from being undone by simply buying more parallel compute hardware.

---

## 10.5 TOTP — Time as an Automatically Synchronized Shared Secret

A second authentication factor ("something you have," alongside a password's "something you know") ideally shouldn't require back-and-forth network communication for every single login attempt. **Time-based One-Time Passwords (TOTP)** solve this with a clever reframing: instead of the server and the user's device negotiating a fresh shared value for each login, use **the current time itself** as a value both sides already, automatically agree on.

**The mechanism:** at enrollment, the server and the user's authenticator app share one secret key, once, over some secure channel (commonly a QR code). From then on, **both sides independently compute** $\text{HMAC}(\text{secret}, \lfloor \text{current\_unix\_time}/30\rfloor)$ and truncate the result to a short numeric code (Chapter 9's HMAC construction, doing double duty here) — no communication needed between them until the moment the user actually types the resulting code into the login form.

**Why time specifically works as the shared "nonce":** both parties' clocks are already roughly synchronized (typically to within the algorithm's tolerance window) without either one needing to tell the other anything, the value changes automatically and predictably, and a short window (30 seconds is standard) sharply bounds how long an intercepted code stays useful to a replay attacker — after the window closes, the code is worthless, even to someone who captured it in transit.

**Verified with a real implementation**, using Python's actual `hmac` module for the HMAC-SHA1 step (not a hand-simulated version):

```
TOTP at t=1700000000: 921300
TOTP at t=1700000005 (same 30-sec window): 921300  (matches: True)
TOTP at t=1700000031 (next window): 732303  (differs: True)
Server-side and client-side independently compute the same code with no communication: True
```

The code is stable across small time shifts within the same 30-second window (5 seconds later, identical code) and changes once the window rolls over (31 seconds later, a completely different code) — exactly the behavior the mechanism is supposed to produce, confirmed by actually running it rather than asserting it.

---

## 10.6 JWT — Structure and the `alg: none` Pitfall

A **JSON Web Token (JWT)** has three base64-encoded, dot-separated parts: a **header** (declaring, among other things, which algorithm was used to sign the token), a **payload** (the actual claims — user identity, permissions, expiration), and a **signature** covering the header and payload together.

**The vulnerability, derived precisely.** JWT's specification legally allows `"alg": "none"` — meaning, in specific narrow scenarios, "this token's integrity is guaranteed by something other than a cryptographic signature." If a verifier's code reads *which* algorithm to use for checking a token **from the token's own header** — attacker-controlled data — rather than from a value the server decided on independently in advance, an attacker can simply submit a token claiming `alg: none` with an empty signature, and a verifier that dispatches based on the token's own claim will skip signature verification **entirely**.

**Verified concretely**, with a minimal but real JWT encoder and two verifiers:

```
Forged token (alg=none, no signature): eyJhbGciOiAibm9uZSIsICJ0eXAiOiAiSldUIn0.eyJ1c2VyIjogImF0dGFja2VyIiwgImFkbWluIjogdHJ1ZX0.

NAIVE verifier (trusts token's own alg claim): accepted=True, payload={'user': 'attacker', 'admin': True}
FIXED verifier (pins HS256, ignores token's alg claim): accepted=False, payload=None
```

The naive verifier — which mirrors a real, historically common implementation mistake — accepts a completely unsigned token and hands back a forged `admin: True` claim as if it were legitimate. The fixed verifier, which hard-codes "this server only ever accepts HS256, full stop, regardless of what any token claims about itself," correctly rejects the identical forged token.

A closely related real vulnerability, **algorithm confusion**, works the same way in a different direction: if a server expects an *asymmetric* algorithm (RS256, verified with a public key) but still lets the token's header pick the verification path, an attacker can craft a token claiming `alg: HS256` and sign it using the server's own **public** key as if it were a symmetric HMAC secret — since that key is public by definition, the attacker can compute a value that a confused verifier, checking against the "same" public key but through the wrong (symmetric) code path, will accept as valid.

**The general lesson, in one sentence that echoes several earlier chapters' closing arguments:** never let untrusted, attacker-controlled input decide which security check gets applied to *that same input*. The verifier has to decide, independently and in advance, exactly what it expects — and reject anything that doesn't match — rather than asking the message how it would prefer to be checked.

---

## Section Challenge

---

**Q1.** A team stores passwords as `bcrypt(salt || password)`, with a properly random, unique salt per user — everything §10.2 and §10.4 recommend. They also temporarily log the *plaintext* password to a debug file "just for troubleshooting," clearing the file after a week. Does their correct use of salted bcrypt protect them here?

<details>
<summary>Answer</summary>

**No — and this isn't a subtle point, it's the "independent failure axes" lesson recurring for perhaps the fifth time in this course.** Salting (§10.2) and memory-hard slow hashing (§10.3–§10.4) protect exactly one specific asset: the **stored hash**, against exactly two specific threats (precomputation reuse and brute-force speed) once that stored hash is what an attacker gets access to. Neither mechanism does anything whatsoever to protect a *plaintext copy of the password sitting in a completely different location* — a debug log file — because that plaintext copy never goes anywhere near the bcrypt computation at all. It's an entirely separate storage location with its own, entirely separate (and in this case, nonexistent) protection.

An attacker who compromises the debug log doesn't need to defeat bcrypt, doesn't need a GPU cluster, doesn't need to know anything about hash functions at all — they read the password directly. The "one week" retention window doesn't help either; it only shrinks the window of exposure, it doesn't close it, and a single automated scrape during that week is enough. The general principle: a strong password-hashing scheme protects data specifically at the point where that scheme is actually applied. It says nothing about every *other* place the same sensitive value might also, carelessly, exist in the system — logs, error messages, browser autofill caches, crash dumps, and analytics events are all real, commonly-cited channels through which "properly hashed" passwords leak in plaintext anyway.
</details>

---

**Q2.** Given the verified ~89,600× speed difference between raw SHA-256 and bcrypt on identical hardware (§10.3), does switching to bcrypt make a service safe regardless of how weak its users' passwords are?

<details>
<summary>Answer</summary>

**No — bcrypt's slowdown is a constant-factor multiplier on the cost of checking *each* guess, not a cap on the *total number of guesses* an attacker ultimately needs to make.** A sufficiently weak, common password — one that appears near the top of a leaked-password frequency list, which real attackers use directly instead of blind brute force — might be found within the first handful of guesses of a targeted **dictionary attack**, regardless of whether each individual guess costs a microsecond (fast hash) or a hundred milliseconds (bcrypt). If the correct password is guess number 12 on an attacker's list, the difference between SHA-256 and bcrypt is the difference between microseconds and slightly-longer microseconds — both are instant from a human timescale, because the *search space actually explored* was never large to begin with.

This is precisely the distinction §10.3–§10.4 were built around, restated from a different angle: memory-hardness and deliberate slowness raise the **cost per guess**. They do nothing to change **how many guesses are actually needed**, which is a property of the password itself (how predictable or common it is), not of the hash function protecting it. Multiplying a large number (guesses needed for a genuinely high-entropy random password) by a large constant factor (bcrypt's slowdown) turns "instant" into "effectively never" — exactly §10.3's numbers. Multiplying a *small* number (guesses needed for a common, weak password) by that same constant factor still leaves a small number. Slow hashing is a real and necessary defense, but it's a defense against **brute-force search cost**, not a substitute for the search space itself being large in the first place — which is a statement about password *choice*, a problem no hash function, however well designed, can retroactively fix.
</details>

---

**Q3.** Suppose an attacker doesn't intercept a single TOTP code in transit, but instead steals the underlying **shared secret** directly — say, via a database breach on the server side. Does TOTP's 30-second window limit the damage the same way it limits a network eavesdropper who captured one code?

<details>
<summary>Answer</summary>

**No — the 30-second window defends against a completely different threat than secret compromise, and it provides zero protection against this one.** The window's entire purpose (§10.5) is bounding how long an *already-observed, one-time* code stays valid — it stops a network eavesdropper who intercepted a single code from replaying that same code five minutes later. It has nothing to say about someone who possesses the **generating secret itself**, because that secret lets them compute the *correct* code for **any** future time step, indefinitely, on demand — functionally identical to a stolen master key, not a stolen single-use item. There's no "window" bounding how long a stolen key stays capable of generating valid outputs; that's true of every keyed construction in this course, not something specific to TOTP.

**This is the same "different threats need different specific defenses" lesson that closed Chapter 2 (a truly random, single-use key is *categorically* different from a "used only once, but predictably generated" key) and reappeared throughout Chapter 9 (a stolen ECDSA nonce vs. a stolen private key are entirely different failure severities).** Time-windowing defends against *replay of an intercepted code*; it was never designed to, and cannot, defend against *compromise of the secret that generates every future code*. The correct response to a stolen TOTP secret isn't "wait 30 seconds and it'll be fine" — it's the same response as any other stolen long-lived key: detect the breach, revoke and rotate the compromised secret (re-enroll the user with a fresh shared secret), and treat every code generated from the old secret as untrustworthy from the moment of compromise onward, not just within some rolling window.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Plaintext storage | Catastrophic beyond the breached service itself, because of real-world password reuse across accounts |
| Precomputation / rainbow tables | $H(\text{password})$ alone is deterministic, letting an attacker build one dictionary that cracks unlimited future victims — verified: 10,000-entry table built in 16ms, then 3 victims cracked in under 3 microseconds combined |
| Salting | Defeats precomputation reuse (verified: identical password, different salts, different hashes; old table useless) but adds essentially nothing to the cost of attacking one already-targeted hash directly (verified: same order of cost, salted or not) |
| Why fast hashing is dangerous | Real sourced GPU rates: SHA-256 ≈21.5 GH/s vs bcrypt ≈240 kH/s on identical hardware (~89,600× gap) — verified an 8-char lowercase password falls in 9 seconds under SHA-256 vs 10 days under bcrypt on the same GPU |
| Memory-hardness | Forces large per-attempt memory use, capping true parallelism regardless of compute core count — verified illustrative arithmetic: 24GB VRAM ÷ 64MiB/attempt = only 384 parallel attempts possible |
| bcrypt / scrypt / Argon2 | Tunable slowness (bcrypt, 1999) → explicit memory-hardness (scrypt, 2009) → memory+time+parallelism tuned specifically against GPU/ASIC/FPGA attacks (Argon2, 2015 PHC winner) |
| TOTP | $\text{HMAC}(\text{secret}, \lfloor t/30\rfloor)$, truncated — time serves as an automatically-synchronized shared value needing no live communication; verified stable within a window, changes across windows |
| JWT `alg: none` | Never let a token's own (attacker-controlled) header decide how it gets verified — verified a naive verifier accepting a forged unsigned admin token, and a fixed (pinned-algorithm) verifier correctly rejecting it |

**Where we go next:** Every mechanism so far has assumed the cryptography itself is where security lives. Chapter 11 shows how TLS assembles nearly every primitive from this entire course — hybrid encryption, authenticated key exchange, signatures, certificates — into the protocol that secures most of the internet, and derives exactly what has to go right, and what real, documented failures happen when it doesn't.

---

*Next: [11 — TLS/SSL & PKI](11_TLS_SSL_PKI.md)*
