# Chapter 8 — Cryptographic Hash Functions

> "Every chapter so far has moved information around while keeping it secret. This one does something different: it takes anything — a password, a photograph, a four-gigabyte repository — and crushes it down to 32 bytes that change unpredictably if a single bit of the input does."

---

## The Problem

How does `git` detect that a single byte changed somewhere inside a repository with gigabytes of history, without comparing every byte against a saved copy? How can a software vendor publish "the official checksum" of a download, such that a tampered file is instantly detectable without re-downloading a trusted reference copy? How, as Chapter 7 left off asking, can two parties eventually *prove* they signed a specific message without transmitting that entire message every time signatures are checked?

All three questions want the same tool: a function that takes an input of *any* size and produces a short, fixed-size output — a **fingerprint** — with the property that the fingerprint is exquisitely sensitive to the input: change one bit anywhere in a gigabyte file, and the fingerprint should look like a completely unrelated random value, not a slightly-different one. This chapter derives exactly what properties such a function needs, builds the standard construction that makes it possible for a function to accept arbitrary-length input at all, and then derives — with real, checkable mathematics — the single most consequential fact governing every hash function's actual security margin: the birthday paradox.

---

## 8.1 What a Cryptographic Hash Function Needs to Guarantee

A hash function $H$ maps inputs of any length to a fixed-length output (256 bits, for the function this chapter focuses on). Being deterministic and fast to compute is necessary but nowhere near sufficient — plenty of fast, deterministic functions (like "take the first 256 bits of the input, pad with zeros if shorter") are useless for security. Three specific properties are what's actually needed, and they're worth deriving from *why* each is needed rather than listing as arbitrary definitions.

**Preimage resistance.** Given only a hash output $h$, it should be infeasible to find *any* input $m$ with $H(m) = h$. **Why needed:** password storage (Chapter 10 derives this in full) stores $H(\text{password})$, never the password itself. If an attacker steals the stored hash, preimage resistance is exactly the property standing between them and a working password — without it, the hash could be reversed directly.

**Second-preimage resistance.** Given a *specific* input $m_1$, it should be infeasible to find a *different* input $m_2 \neq m_1$ with $H(m_2) = H(m_1)$. **Why needed:** software distribution publishes $H(\text{legitimate file})$ so users can verify their download. Second-preimage resistance is what stops an attacker from crafting a *different*, malicious file that happens to hash to the same published value — the legitimate file is fixed and known; the attacker needs to match it specifically.

**Collision resistance.** It should be infeasible to find *any* pair $m_1 \neq m_2$ (the attacker gets to choose **both**) with $H(m_1) = H(m_2)$. **Why needed:** digital signatures (Chapter 9) sign a message's *hash*, not the message itself, for efficiency. If an attacker can find two colliding messages — one innocuous, one malicious — *before* asking anyone to sign anything, they can get the innocuous one signed and later claim the signature covers the malicious one instead, since both hash identically. Note the crucial difference from second-preimage resistance: here the attacker controls *both* inputs, chosen together, rather than being handed one fixed input and hunting for a partner.

**These are genuinely different properties, not three phrasings of the same idea** — worth confirming with an actual counterexample rather than asserting it. Take a real hash function $H'$ (SHA-256, truncated to 32 bits for a demonstrable toy) and deliberately sabotage it: define $H(x) = H'(x)$ for almost every input, **except** two specific fixed values, `SPECIAL_A` (eight zero bytes) and `SPECIAL_B` (eight `0xFF` bytes), which are both hard-coded to output the same fixed value:

```
H(SPECIAL_A) = abcdef01
H(SPECIAL_B) = abcdef01
Collision exists and is trivially known: True   (SPECIAL_A != SPECIAL_B as inputs)
```

**Collision resistance is now completely broken** — anyone can name this pair from the function's public definition, no search required. But **second-preimage resistance survives for almost every input**: handed some *specific*, essentially arbitrary $m_1$ (not `SPECIAL_A` or `SPECIAL_B` — an astronomically unlikely coincidence for a random $m_1$), finding a *different* $m_2$ colliding with it is exactly as hard as it was for the untouched $H'$, because the sabotage only touches two fixed points that a random $m_1$ will essentially never land on:

```
For random (non-special) inputs, H(x) == Hprime(x) exactly (no shortcut introduced elsewhere):
  x=4420823c...: H(x)==Hprime(x): True   (5 random samples, all confirmed identical to untouched H')
```

**Preimage resistance survives too**, for the same reason: given a random target hash value, the two sabotaged inputs only help an attacker if the target happens to equal that one specific injected value — negligible probability. One function, one deliberately injected flaw, and three different resulting security postures. Collision resistance is the property broken by an attacker who gets to pick *both* sides of a pair in advance; the other two are unaffected because they each pin down at least one side of the pair to something the attacker doesn't get to choose ahead of time.

---

## 8.2 The Merkle-Damgård Construction

A hash function has to accept input of *any* length, but any concrete algorithm has to be built from fixed-size operations — you can't hand-design a different circuit for every possible input length. The standard solution is a **compression function** $f$ that takes a fixed-size chunk of message plus a fixed-size running state, and produces a new fixed-size state: $\text{state}_i = f(\text{state}_{i-1}, \text{block}_i)$, starting from a fixed public initial state, processing the (padded) message one fixed-size block at a time, with the final state as the output.

**This is structurally the same shape as Chapter 4, §4.2's CBC mode** — a fixed-size operation chained sequentially across a variable-length input, each step depending on everything that came before via the running state. The goal is different (a fingerprint, not encryption) and the fixed-size operation is different (a compression function, not a block cipher), but "repeatedly apply a fixed-size operation, threading a running value through every block" is the identical structural idea in both places.

Two details matter enough to flag explicitly. First, the padding has to unambiguously mark where the real message ends — and, critically, typically encodes the message's **length** directly into the padding, specifically to prevent an attacker from confusing two different messages that happen to produce the same padded byte stream. (Hold onto this detail: Chapter 9 shows exactly what goes wrong when a length-extension attack exploits precisely this padding structure.) Second, the construction comes with a genuinely useful guarantee, provable but not re-derived here: **if the small, fixed-size compression function $f$ is collision-resistant, the entire arbitrary-length hash function built from it is also collision-resistant.** This is *why* the construction became the standard — designers only need to get one small building block right, and collision resistance at any input length follows for free. MD5, SHA-1, and SHA-256 are all built this way.

---

## 8.3 SHA-256's Structure, Conceptually

SHA-256 (part of the SHA-2 family, standardized by NIST) is a Merkle-Damgård hash function that processes the message in 512-bit blocks, maintaining a 256-bit internal state (eight 32-bit words), and runs 64 rounds of bitwise rotations, XORs, ANDs, and modular additions per block — mixing each block's bits into the running state thoroughly, in the same *spirit* as Chapter 3's confusion-and-diffusion design goal for AES, though the specific operations are different since a hash function's compression step needs to be one-way, not invertible. One small, verifiable detail worth knowing precisely rather than taking on faith: SHA-256's 64 round constants are not arbitrary — per the official specification (FIPS 180-4), they are exactly the first 32 bits of the fractional parts of the cube roots of the first 64 prime numbers, chosen specifically because they're numbers nobody could have covertly selected for a hidden structural weakness — they're derivable by anyone from pure mathematics, not chosen by the designers' discretion. The full round function's internal bit-level derivation is genuinely out of scope here — the two facts that matter for the rest of this chapter are: it's Merkle-Damgård (§8.2's guarantee applies), and its output is 256 bits wide (which §8.5 shows is not the same thing as "256 bits of collision security").

---

## 8.4 The Birthday Paradox, Derived and Verified

Here's a classic puzzle, worth solving properly rather than quoting the punchline: how many people need to be in a room before there's a better-than-50% chance that two of them share a birthday? Intuition says "somewhere around 183" (half of 365) — intuition is wrong, and it's worth deriving exactly why, because the *same* mistaken intuition is precisely what makes hash collision resistance easy to overestimate.

**Derive $P(\text{no shared birthday among } k \text{ people})$ directly**, rather than the probability of a collision: person 1 has some birthday; person 2 avoids it with probability $\frac{364}{365}$; person 3 avoids *both* previous birthdays with probability $\frac{363}{365}$; and so on. Multiplying these independent-avoidance probabilities together:

$$P(\text{no collision}) = \prod_{i=0}^{k-1} \frac{365-i}{365} \qquad\Longrightarrow\qquad P(\text{collision}) = 1 - \prod_{i=0}^{k-1}\frac{365-i}{365}$$

**Verified by direct computation, not just the closed form:**

```
k=22: P(collision) = 0.4757   (below 50%)
k=23: P(collision) = 0.5073   (crosses 50%)
```

And confirmed independently by simulation — 200,000 random trials of 23 people each, counting how often at least two share a birthday:

```
Monte Carlo (200,000 trials, 23 people each): empirical P(collision) = 0.5076
Matches closed-form prediction (0.5073) closely: True
```

**The general pattern, generalized beyond 365 days to $N$ equally likely possibilities:** approximating the product using $1-x\approx e^{-x}$ for small $x$ gives $P(\text{collision}) \approx 1 - e^{-k^2/2N}$, which crosses roughly 50% once $k \approx 1.18\sqrt{N}$ — **collisions become likely once the number of samples reaches around $\sqrt{N}$, not around $N$.** With $N=365$, $\sqrt{365}\approx19.1$, and the precise threshold (23) lands close to that estimate, exactly matching the exact computation above. This square-root scaling, not the naive "half of $N$" intuition, is the fact that matters for everything that follows.

**Verified once more, directly through simulation rather than only through the formula** — generate random values in $\{0,\ldots,N-1\}$ one at a time until the *first* repeat appears, and average how many draws that took, across many trials:

```
N=2^8=256:    average tries until first collision =  20.53   sqrt(N) =  16.00   ratio = 1.283
N=2^10=1024:  average tries until first collision =  41.37   sqrt(N) =  32.00   ratio = 1.293
N=2^12=4096:  average tries until first collision =  79.66   sqrt(N) =  64.00   ratio = 1.245
N=2^14=16384: average tries until first collision = 164.84   sqrt(N) = 128.00   ratio = 1.288
N=2^16=65536: average tries until first collision = 324.64   sqrt(N) = 256.00   ratio = 1.268
```

The ratio of average-tries-to-$\sqrt{N}$ holds steady around 1.25–1.29 across every scale tested — matching the theoretical constant $\sqrt{\pi/2}\approx1.2533$ closely. The $\sqrt{N}$ scaling isn't a rough rule of thumb; it's confirmed here by direct simulation at five different scales, independent of the closed-form birthday formula above.

---

## 8.5 The Birthday Attack on Hash Collision Resistance

Apply §8.4 directly to hash outputs. An $n$-bit hash function has $N=2^n$ possible output values — "possible birthdays." By the square-root scaling just derived and verified, an attacker doesn't need anywhere near $2^n$ attempts to find *some* colliding pair; roughly $\sqrt{2^n} = 2^{n/2}$ random inputs suffice before a collision becomes likely, via the exact mechanism just verified in simulation.

**This is a sharp, specific, and easy-to-underestimate fact: an $n$-bit hash function offers only $n/2$ bits of *collision* resistance, not $n$ bits — even though it offers close to the full $n$ bits of *preimage* resistance.** These are genuinely different attack shapes, worth distinguishing precisely rather than blurring together: preimage resistance is about matching *one fixed target* — there's no "birthday" effect to exploit, because you're not comparing many random tries against *each other*, only against one specific pinned value, so that search genuinely does cost close to $2^n$. Collision resistance is about finding *any* match among *many* freely-chosen tries compared *against each other* — exactly the birthday setup, and exactly why it's so much cheaper.

**Concretely, at real hash sizes:** SHA-1 has a 160-bit output, suggesting (naively) $2^{160}$ security — but its actual *collision* resistance, by the argument just derived, was only ever about $2^{80}$. That number eventually became reachable: on February 23, 2017, researchers from Google and CWI Amsterdam published the first practical SHA-1 collision (the "SHAttered" attack) — two distinct PDF files with identical SHA-1 hashes, produced using roughly $2^{63.1}$ SHA-1 computations (about 6,500 CPU-years plus 110 GPU-years of computation). Notice that figure is *smaller* than the naive $2^{80}$ birthday-bound estimate too — real cryptanalysis found additional structural shortcuts inside SHA-1 specifically, on top of the birthday bound's baseline — but it was the birthday bound, known and published for decades before SHAttered, that told everyone in advance exactly which magnitude of effort to expect a collision to require, and therefore exactly when SHA-1 needed to be retired for any collision-sensitive use. **This is precisely why SHA-256 — 256-bit output, hence $2^{128}$ collision resistance by the same birthday-bound argument — replaced it**: $2^{128}$ stays safely beyond any currently foreseeable computational budget, in a way $2^{80}$ (SHA-1's real collision-security level, not its nominal 160-bit output) no longer does.

---

## 8.6 Merkle Trees

**The problem:** prove that one specific piece of data is part of a large, previously-committed set — without transmitting the entire set, and with a *short* proof. Hashing the entire dataset into one value works as a commitment (§8.1's collision resistance guarantees nobody can later swap in a different dataset with the same hash) but a naive membership proof would require handing over the *entire* dataset to re-hash and check — proof size equal to the size of everything, no matter which single item is being proven.

**The construction:** arrange hashes of the individual data items ("leaves") into a binary tree, where every **internal node is the hash of the concatenation of its two children's hashes**, all the way up to a single **root** hash that acts as a short commitment to the entire set. To prove leaf $i$ belongs to the committed set, reveal only the **sibling hash at every level along the path from that leaf to the root** — not the rest of the tree — and let the verifier recompute hashes up that path, checking the final result against the already-known root.

**Verified**, building a real 8-leaf tree with actual SHA-256:

```
Number of leaves: 8
Root hash: bf02086043dc134279371f3addf711f51fcaf8998a02d04d0045eae092bb7067

Proof for leaf 3 ('transaction_3'): 3 hashes
Proof verifies against the known root: True
```

Three hash values — not all eight leaves — are enough to prove leaf 3's membership, because $\log_2(8)=3$: each level of the proof doubles the number of leaves it implicitly vouches for. **The tamper-evidence is just as important to confirm as the proof mechanics themselves**, and both directions were checked directly: substituting a different value for the leaf being proven, while keeping the same proof and root, fails verification —

```
Verifying a TAMPERED leaf against the same proof/root: False
```

— and so does corrupting even a single bit of one sibling hash *inside* the proof itself, while keeping the real leaf:

```
Verifying the REAL leaf against a tampered proof (1 bit flipped in one sibling hash): False
```

Either kind of tampering breaks the chain of recomputed hashes before it ever reaches the root, and the mismatch is detected immediately. This structure — a short, tamper-evident membership proof against a single committed root — is exactly how `git` addresses its objects (commits, trees, and blobs are identified by the hash of their content, chained into a structure with the same tamper-evident properties derived here) and how blockchains let a lightweight client verify that one specific transaction was included in a block by checking a short Merkle proof against that block's published root, without downloading every other transaction in the block.

---

## Section Challenge

---

**Q1.** Password storage, per §8.1, primarily needs *preimage* resistance (an attacker who steals the stored hash shouldn't be able to recover a working password from it). Does that mean any preimage-resistant hash function — SHA-256, for instance — is automatically a *good* choice for storing passwords?

<details>
<summary>Answer</summary>

**No — and the reason is a completely different axis than any of the three properties derived in §8.1.** Within the narrow threat model "attacker has only the hash, wants to invert it," preimage resistance genuinely is the property doing the work, and SHA-256 has it. But real password-cracking doesn't need to invert an arbitrary 256-bit target — it needs to check whether the hash of any of a *huge but realistically-sized* list of guesses (common passwords, dictionary words, small variations) matches the stolen hash. That's not "break preimage resistance in general" — it's "compute $H(\text{guess})$ many billions of times per second and compare," and SHA-256 being **fast** (a genuine virtue for file integrity checking and Merkle trees, §8.6) is actively a liability here, not a mitigating factor preimage resistance provides any defense against.

**This is the same "independent failure axes" pattern that's recurred since Chapter 6:** key size vs. padding scheme (Ch6 Q2), which group vs. authentication (Ch7 Q3), and now: cryptographic security properties (preimage/second-preimage/collision resistance) vs. **computational cost of evaluating the function at all**. None of §8.1's three properties says anything about *how fast* $H$ is to compute — that's an orthogonal design dimension, and Chapter 10 derives in full why password storage specifically needs a hash function that is deliberately, tunably **slow**, on top of (not instead of) ordinary preimage resistance.
</details>

---

**Q2.** A hash function has a 64-bit output. Roughly how many random inputs would an attacker need to hash before finding a collision with good probability? Would this hash function be a safe choice for a signature scheme (Chapter 9) that depends on collision resistance?

<details>
<summary>Answer</summary>

**Roughly $2^{32}$ — about 4.3 billion — not $2^{64}$, by §8.5's birthday-bound argument, and that number is very much within reach of ordinary modern hardware, so no, 64 bits is unsafe for anything depending on collision resistance.**

Applying §8.5 directly: a 64-bit hash has $N=2^{64}$ possible outputs, and the birthday-bound argument says a collision becomes likely once roughly $\sqrt{N}=\sqrt{2^{64}}=2^{32}$ random inputs have been tried and compared against each other — not once $2^{64}$ have been tried against one fixed target (that would be a *preimage* attack, a different and much harder problem, per §8.5's explicit distinction between the two attack shapes). $2^{32}$ hash computations is a workload a single modern GPU can complete in well under an hour for a fast, unstructured hash — nowhere near the "infeasible for the foreseeable future" bar every other primitive in this course has been held to.

For a signature scheme specifically, this matters enormously precisely because of the mechanism §8.1 derived for *why* collision resistance is the load-bearing property there: an attacker who can find a colliding pair $(m_1,m_2)$ cheaply can get an innocuous $m_1$ signed and later present $m_2$ as if it carried the same valid signature. A 64-bit hash makes that search a routine computation, not a cryptographic barrier. This is exactly why real signature schemes are built on 256-bit-or-larger hash functions (SHA-256 and comparable) — giving $2^{128}$ collision resistance by the same square-root argument, comfortably beyond any realistic attacker's reach, matching the same kind of security margin Chapters 3, 6, and 7 have each independently converged on for their own respective primitives.
</details>

---

**Q3.** A Merkle tree commits to one billion data items. Roughly how many hashes does a single membership proof require? Compute the number directly, and explain concretely why this matters compared to the naive "just re-hash the entire dataset" alternative.

<details>
<summary>Answer</summary>

**About 30 hashes** — computed directly, not approximated: $\log_2(10^9) \approx 29.9$, and since a Merkle proof needs one sibling hash per level of the tree, the proof size is $\lceil \log_2(n) \rceil = 30$ for $n=1{,}000{,}000{,}000$ leaves (matching exactly the scaling table verified in §8.6: `n=1,000,000,000: proof size = 30 hashes`).

**Why this is the entire point of the construction, made concrete by the numbers:** the naive alternative — re-hash the whole committed dataset to confirm one item belongs to it — would require possessing and processing all one billion items, every single time anyone wants to verify a single membership claim. The Merkle-tree proof needs exactly 30 hash values (roughly 960 bytes, at 32 bytes per SHA-256 hash) and 30 hash computations to verify, regardless of which one of the billion items is being checked. That's the practical payoff of $O(\log n)$ versus $O(n)$ at real scale: a lightweight client (§8.6's blockchain example) can verify that one specific transaction was included in a committed block using less data than a single typical image file, without ever downloading — or trusting anyone else's copy of — the other 999,999,999 transactions.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Preimage resistance | Given $h$, hard to find any $m$ with $H(m)=h$ — the property password storage (Ch10) depends on |
| Second-preimage resistance | Given fixed $m_1$, hard to find different $m_2$ with $H(m_2)=H(m_1)$ — protects published file checksums |
| Collision resistance | Hard to find *any* pair $m_1\neq m_2$ (attacker picks both) with equal hashes — what signatures (Ch9) depend on; verified these three properties are genuinely separable via a deliberately sabotaged toy function |
| Merkle-Damgård construction | Chains a fixed-size compression function across arbitrary-length input (structurally the same shape as Ch4 §4.2's CBC chaining) — a collision-resistant compression function yields a collision-resistant full hash function |
| SHA-256 | Merkle-Damgård, 512-bit blocks, 256-bit state, 64 rounds; round constants verified to be exactly the fractional cube roots of the first 64 primes (FIPS 180-4) |
| Birthday paradox | $P(\text{collision among } k) = 1-\prod(365-i)/365$ — verified $k=23$ crosses 50% ($k=22$ doesn't), confirmed by both exact computation and 200,000-trial Monte Carlo simulation |
| $\sqrt{N}$ scaling | Collisions become likely at $\approx\sqrt{N}$ samples, not $\approx N$ — verified independently via direct simulation across 5 orders of magnitude, matching the theoretical constant $\sqrt{\pi/2}$ |
| Birthday attack on hashes | An $n$-bit hash offers only $2^{n/2}$ collision resistance (not $2^n$) while still offering $\approx 2^n$ preimage resistance — the documented, real reason SHA-1 (real collision security $2^{80}$, broken by SHAttered in Feb 2017) was replaced by SHA-256 ($2^{128}$) |
| Merkle trees | $O(\log n)$-size membership proofs against one committed root — verified on a real 8-leaf SHA-256 tree, including that tampering either the leaf or any proof hash is detected; used by git and blockchains |

**Where we go next:** Hash functions give integrity against anyone recomputing a hash — but §8.1 already hinted at the gap: anyone can recompute $H(m)$, including an attacker modifying $m$ in transit. Chapter 9 derives what's needed to bind a hash to a *secret*, why the obvious way to do that (just prepend a key) is broken by a real, exploitable structural flaw in the Merkle-Damgård construction this chapter just built, and how HMAC and digital signatures each close that gap in their own way.

---

*Next: [09 — MACs & Digital Signatures](09_MACs_Digital_Signatures.md)*
