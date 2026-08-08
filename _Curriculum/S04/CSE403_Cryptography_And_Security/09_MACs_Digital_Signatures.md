# Chapter 9 — MACs & Digital Signatures

> "A hash proves a message wasn't corrupted by accident. It proves nothing about who sent it — anyone, including whoever tampered with it, can recompute a hash. This chapter builds the two different tools for the two genuinely different jobs: MACs, for two parties who already share a secret, and signatures, for proving something to someone who was never part of the conversation at all."

---

## The Problem

Chapter 8 built $H(m)$ with strong properties — but $H$ is a **public, keyless** function. Anyone, including an attacker, can compute $H(m)$ for any $m$ they choose. If Alice sends Bob a message $m$ together with $H(m)$ so Bob can check nothing got corrupted in transit, and Mallory intercepts and replaces $m$ with a different $m'$, Mallory simply recomputes $H(m')$ and sends that along too — Bob's check passes perfectly, because nothing about it ever depended on a secret Mallory doesn't have. A hash alone proves "this data has this fingerprint." It says nothing about "this data came from someone who didn't want it changed," because *producing* a matching fingerprint for chosen data was never restricted to anyone in particular.

Fixing this needs a **secret** in the mix. This chapter builds two different ways to add one — Message Authentication Codes, for two parties who already share a key, and digital signatures, for a much stronger and more expensive guarantee that holds even for parties who've never met. Both close the exact gap left open at the end of Chapter 7, where Diffie-Hellman was shown to provide secrecy but zero authentication.

---

## 9.1 Why Hashing Alone Isn't Integrity — Need a Keyed Hash

The fix, stated plainly: don't just check $H(m)$, check something that requires a **secret key** to compute — a **Message Authentication Code (MAC)**, $T = \text{MAC}(k, m)$, verifiable only by someone who also holds $k$. Now Mallory's tampering attack from above fails structurally: she can still replace $m$ with $m'$, but she cannot compute a valid $\text{MAC}(k, m')$ without $k$, and Bob's verification (which recomputes $\text{MAC}(k,m')$ himself and compares) will catch the mismatch.

The obvious next question: can a MAC just be built directly from the hash function Chapter 8 already built, cheaply?

---

## 9.2 The Naive Construction Is Broken — Length Extension

**The obvious construction:** $\text{MAC}(k,m) = H(k \| m)$ — prepend the key, hash the result. It seems reasonable: without knowing $k$, an attacker shouldn't be able to compute $H(k\|m)$ for a new $m$.

**It's broken, and the break comes directly from Chapter 8, §8.2's Merkle-Damgård construction.** Recall the key structural fact derived there: a Merkle-Damgård hash's output *is* its raw final internal state — there's no extra finalization step scrambling it further. That means if an attacker knows $H(k\|m)$ for some message $m$, they know **exactly what internal state the hash function was in** after processing $k\|m\|(\text{padding})$ — not just "a fingerprint of it," the literal state. And the compression function only ever needs the *current state* plus the *next block* to keep going — it has no way to "remember" or require the earlier content that produced that state. So an attacker who knows $H(k\|m)$, knows $m$, and knows (or can correctly guess — often fixed by a protocol) the **length** of $k$ — not its content, just its length — can:

1. Compute exactly what padding the hash function would have appended after $k\|m$ (padding depends only on total length, which is now known).
2. **Resume** the hash computation from the known state $H(k\|m)$, feeding in any new blocks of their choosing.
3. Produce a valid $H(k \| m \| \text{padding} \| \text{extension})$ for an attacker-chosen extension — **without ever learning a single byte of $k$.**

**This was implemented and run end to end**, against a small from-scratch Merkle-Damgård hash (not real SHA-256, but built with the identical structural property — raw final state as output, MD-style padding — that makes the attack work; real SHA-256/SHA-1/MD5 all share this exact structural property and are vulnerable to the identical attack in practice):

```
Victim's secret key: 16 bytes (content unknown to attacker, length known/guessed)
Original message: b'amount=10&to=alice'
Real MAC = H(key || message) = 0x9bdd367e

Attacker (knows only real_mac, original_message, key LENGTH) forges an extension: b'&amount=10000&to=eve'
Attacker's forged MAC (computed by RESUMING from real_mac, no key access): 0x73c01dfb
Victim's real MAC of (key || message || glue || extension), computed WITH the real key: 0x73c01dfb
Forged MAC matches what the victim would compute: True
```

The attacker's computation never touches the secret key — only its length, the original message, and the leaked MAC value. Getting this right requires the padding computation to line up *exactly* with what the real hash function would compute for the true total length (the attacker's "glue" padding after the original key+message, and a second, final padding tail after their own extension, both derived purely from lengths) — but once it does, the forgery is bit-for-bit indistinguishable from a real MAC produced with the actual key. If a system trusted this construction to authorize, say, a funds transfer, an attacker with no key access at all could append `&amount=10000&to=eve` to a legitimately-authorized message and produce a MAC the victim's own verification code would accept.

---

## 9.3 HMAC — The Real Fix

The vulnerability in §9.2 came from one specific structural fact: the naive construction's output **is** an exposed, directly resumable internal state. **HMAC** (Bellare, Canetti, and Krawczyk, presented at CRYPTO'96 and standardized as RFC 2104 in 1997) fixes this with a **nested** construction:

$$\text{HMAC}(k, m) = H\big((k \oplus \text{opad}) \,\|\, H((k \oplus \text{ipad}) \,\|\, m)\big)$$

where `opad` and `ipad` are fixed public constants (`0x5c` and `0x36`, each repeated to fill a block) and $k$ is padded/pre-hashed to the hash function's block size as needed.

**Why nesting specifically defeats §9.2's attack.** Even granting that an attacker *could* run the exact length-extension trick against the **inner** call $H((k\oplus\text{ipad})\|m)$ — extending its exposed output state with attacker-chosen blocks — that only produces a forged value for the *inner* hash. To turn that into a forged HMAC, the attacker would still need to compute the **outer** call, $H((k\oplus\text{opad}) \| \text{[inner result]})$ — and that outer call's own input begins with $k\oplus\text{opad}$, a value exactly as secret as $k$ itself (XORing with a fixed *public* constant does not remove secrecy; it's a bijection an attacker can trivially undo in the other direction, but they'd need to already know $k$ or $k\oplus\text{opad}$ to do so). There is no exposed, resumable raw state for the *outer* call the way there was for the naive construction's single hash — the outer call's required secret prefix is never revealed by anything HMAC publishes. The attack that broke §9.2 needed a leaked, directly-resumable internal state to extend from; HMAC's outer layer never exposes one.

**Verified against a real implementation, using real SHA-256** — not the toy hash from §9.2, but the actual algorithm, cross-checked against Python's own standard-library `hmac` module:

```
My HMAC-SHA256:      146772e9f026f8b429c4baacc6179a3e8efc75edbf02d8891fc426a5e893c4b8
Python stdlib HMAC:  146772e9f026f8b429c4baacc6179a3e8efc75edbf02d8891fc426a5e893c4b8
Match: True
```

An independently-written implementation of the nested construction just derived produces bit-for-bit the same output as Python's own battle-tested standard library — confirming the construction was reproduced correctly, not just described correctly.

---

## 9.4 Digital Signatures — What Public-Key Crypto Gives You That a MAC Can't

HMAC solves integrity and authenticity **between two parties who already share a secret key**. But notice what it structurally *cannot* do: **the verifier holds exactly the same key the signer used.** Anyone who can *check* an HMAC tag could have *produced* that exact same tag themselves — verification and creation require identical knowledge. This means a MAC can never prove to a third party (a judge, an auditor, some other server entirely outside the two-party relationship) which of the two key-holders actually produced a given tag — both were equally capable of it. This property — the *inability* to later prove authorship to an outside party — is called lacking **non-repudiation**, and it isn't a flaw in any particular MAC algorithm's design; it's a structural consequence of *any* scheme built on one shared secret key, no matter how well-designed.

**Digital signatures fix this by splitting "can verify" from "can create" across two different keys**, exactly the public/private split Chapter 6 built for encryption: sign with a **private** key only the signer holds; verify with the corresponding **public** key, which anyone — including a totally uninvolved third party — can hold, without that ability ever letting them forge a new signature.

**RSA signatures reuse Chapter 6's exact machinery, with the two exponents' roles reversed:**

$$\text{sign}(m) = m^d \bmod n \qquad\qquad \text{verify}(m, s):\ s^e \bmod n \overset{?}{=} m$$

Signing uses the **private** exponent $d$ (the operation only the key-holder can perform); verifying uses the **public** exponent $e$ (computable by anyone). **Verified, reusing the exact key pair from Chapter 6** ($p=61,q=53,n=3233,e=17,d=2753$):

```
Signer computes s = m^d mod n = 65^2753 mod 3233 = 588   (requires private key d)
Verifier computes s^e mod n = 588^17 mod 3233 = 65        (only needs PUBLIC key e,n)
Signature verifies: True
```

Anyone with only $(e,n)$ — no access to $d$ at all — can run the verification step and confirm the signature is valid. And attempting a forgery *without* $d$ genuinely requires solving exactly the problem Chapter 6 showed RSA's trapdoor is built on: computing $s$ such that $s^e \equiv m \pmod n$ for a chosen target $m$, without knowing $d$, is precisely RSA's hard direction. A random guess confirms this concretely: a randomly chosen candidate signature verifies against the intended forged message essentially never (`False`, tested directly).

**In practice, RSA signatures sign a hash of the message, $H(m)$, not the raw message** — both for efficiency (RSA operations on a fixed-size 256-bit hash are cheap regardless of the original message's length) and because it fits within the modulus's size limit. This is Chapter 8, §8.1's original motivation for collision resistance, paying off in full: an attacker who could find two colliding messages $m_1\neq m_2$ with $H(m_1)=H(m_2)$ could get an innocent $m_1$ signed and later present the identical signature as proof $m_2$ was signed — exactly the scenario Chapter 8 used to motivate why collision resistance specifically (not just preimage resistance) matters for signatures.

**ECDSA, conceptually, built on Chapter 7's elliptic curve group.** To sign a message hash $h$ with private key $d$ (public key $Q=dG$): pick a fresh random **nonce** $k$, compute $R = kG$, let $r = R_x \bmod (\text{group order})$, and compute $s = k^{-1}(h + r\cdot d) \bmod (\text{group order})$; the signature is the pair $(r,s)$. Verification reconstructs a point from $(r,s)$, $h$, and the *public* key $Q$ and checks it matches $r$ — the full algebra is not re-derived in detail here, consistent with this course's treatment of elliptic curve internals in Chapter 7.

**What matters far more than the equations is a single, non-negotiable requirement: $k$ must be fresh and unpredictable for every signature.** Reuse it, and simple algebra recovers the private key outright — worth deriving and verifying directly, because this is not a hypothetical. If the *same* $k$ signs two different message hashes $h_1, h_2$ under the same private key, both signatures share the same $r$ (since $R=kG$ never changed), and:

$$s_1 - s_2 = k^{-1}(h_1-h_2) \pmod{\text{order}} \quad\Rightarrow\quad k = (h_1-h_2)(s_1-s_2)^{-1} \pmod{\text{order}}$$

— solvable immediately from two public signatures alone, using nothing but the modular inverse machinery from Chapter 5. Once $k$ is known, $d$ falls out just as directly from $s_1 = k^{-1}(h_1+rd)$. **Verified on Chapter 7's toy curve**, with a private key $d=6$ and a nonce $k=3$ deliberately reused across two different message hashes:

```
Signature 1 (msg_hash=4, k=3): (r,s) = (6, 7)
Signature 2 (msg_hash=11, k=3): (r,s) = (6, 3)
r1 == r2 (both used the same k): True
Both signatures verify correctly under the real public key: True

Attacker recovers:
  k = (h1-h2)*(s1-s2)^-1 mod order = 3   (matches real k=3)
  d = (s1*k - h1)*r1^-1 mod order  = 6   (matches real private key d=6)
```

Full private key recovery, from two otherwise-perfectly-valid signatures, using only public information. **This is not a contrived textbook scenario** — it is precisely the mechanism behind the December 2010 recovery of Sony's PlayStation 3 code-signing private key, publicly disclosed by the group fail0verflow at the Chaos Communication Congress: Sony's ECDSA implementation used a **fixed, non-random $k$ for every single signature**, and the algebra above (applied across not just two but every signed object Sony had ever published) recovered the master signing key directly. The console's entire trust model — every future software update's authenticity — depended on a single random-number-generation mistake, and once the key was public, it could never be quietly rotated away, because it was baked into hardware. This is, once again, the exact refrain that has recurred at every layer of this course since Chapter 1's Vigenère key repetition and Chapter 2's two-time pad: **reusing something that was supposed to be random and secret doesn't weaken a scheme — it deletes its guarantee outright**, and here the stakes were an entire product line's root of trust.

---

## 9.5 Sign-then-Encrypt vs. Encrypt-then-Sign

Combining encryption and signing sounds like it should be a simple matter of applying both — but the *order* creates genuinely different, non-obvious tradeoffs worth naming explicitly, since neither ordering is a universally correct default.

**Sign-then-encrypt** (sign the plaintext, then encrypt the message-plus-signature bundle together): an outside observer of the ciphertext learns nothing about *who* signed it — the signature is hidden inside the encryption along with everything else. But there's a subtler problem: once the legitimate recipient decrypts, they hold a valid `(plaintext, signature)` pair on its own — and *they* can re-encrypt that same pair under a completely different recipient's key and forward it, making it look exactly as if the original sender had signed a message intended for that new party, which was never true. The signature only ever attested to *who sent it*, never *who it was meant for* — a problem sometimes called surreptitious forwarding.

**Encrypt-then-sign** (encrypt first, then sign the resulting ciphertext): the signature is now visibly bound to specific ciphertext bytes, so anyone can confirm *who produced this exact ciphertext* without needing to decrypt it at all — which is exactly the problem: that's metadata leakage. An outside observer now knows Alice sent Bob *some* confidential message at a specific time, information sign-then-encrypt would have kept hidden entirely behind the encryption layer. It also opens a narrower issue: since the signature only covers already-opaque ciphertext, anyone who intercepts it can strip Alice's signature and attach their *own* signature to the identical ciphertext bytes, appearing to claim authorship of content they can't even read.

**Neither ordering is a free win** — each leaks a different kind of information (signer identity, in one direction; the mere existence and timing of a confidential exchange, in the other) and each opens a different structural gap. This is the same lesson Chapter 4 closed on with AEAD's verify-before-decrypt ordering: **composing two individually-secure primitives does not automatically produce a secure combined protocol** — the composition itself has to be analyzed on its own terms. Real protocols (TLS, Chapter 11) don't naively bolt "a signature scheme" onto "an encryption scheme" in either order; they use specific, formally analyzed combined constructions built for the exact threat model at hand.

---

## Section Challenge

---

**Q1.** A developer, aware of the length-extension attack from §9.2, proposes a different fix: compute $H(m \| k)$ — put the key at the **end** of the message instead of the beginning — rather than switching to HMAC. Does this specifically block the length-extension attack derived in §9.2?

<details>
<summary>Answer</summary>

**Yes, for this specific attack — but that isn't the same as saying the construction is safe, and the distinction matters.** The length-extension attack in §9.2 worked by resuming computation *forward* from an exposed final state, appending new blocks *after* everything the victim had already hashed. If the key is appended *last*, the attacker would need to insert new content **before** the key — i.e., splice bytes into the *middle* of an already-completed hash chain — which the sequential, forward-only nature of Merkle-Damgård processing simply does not allow. Resuming from a known state can only ever extend a computation forward from that point; it cannot retroactively rewrite what already happened earlier in the chain. So $H(m\|k)$ genuinely closes off *this specific* attack.

**But "defeats the one attack I named" is not the same claim as "is a proven-secure MAC construction"** — this is precisely Chapter 1's Section Challenge Q1 lesson, resurfacing here in a completely different context: showing one particular attack fails against a scheme says nothing about *every* attack failing against it. $H(m\|k)$ has not received anywhere near the rigorous security analysis and formal proof that HMAC's specific nested construction has (§9.3) — its security against other, less obvious structural attacks on the underlying compression function has not been established with the same confidence. The standard, provably-analyzed answer remains HMAC, not an ad hoc reordering that happens to block the one attack that was top of mind. "I checked this specific concern and it's fine" is exactly the trap a security-critical construction cannot afford to fall into.
</details>

---

**Q2.** Chapter 6 established that a single RSA key pair should never be reused carelessly across incompatible uses. Is it safe to use the *same* RSA key pair both to **decrypt** messages sent to a party and to **sign** messages sent *by* that same party?

<details>
<summary>Answer</summary>

**No — this is a real, well-established bad practice, and the reasoning follows directly from how similar the two operations are mathematically.** RSA decryption computes $m = c^d \bmod n$; RSA signing computes $s = h^d \bmod n$. Structurally, these are the *identical* operation — raising an input to the private exponent $d$ modulo $n$ — the only difference is what the caller intends the input and output to *mean*. If the same key pair serves both roles, an attacker who can get the key-holder to "decrypt" a value of the attacker's choosing has, in effect, obtained a valid signature over that exact value (since the mathematical operation performed is identical), and vice versa: something submitted as a "message to sign" and something submitted as "ciphertext to decrypt" are indistinguishable to the underlying exponentiation. A protocol that exposes both a decryption oracle and a signing oracle under the same key pair risks one operation being abused to produce results indistinguishable from the other.

**The general, durable principle:** cryptographic keys should be scoped to a single purpose, and separate roles should get separate key pairs, even when reusing one key pair would be mathematically "possible." This is a specific instance of a much older idea already established in this course — Kerckhoffs's principle (Chapter 1) says security should depend only on keeping *keys* secret, not on hiding algorithms; the complementary operational discipline is that a key's *scope* should be as narrow and well-defined as its secrecy, because a single key serving two structurally-similar-but-semantically-different purposes gives an attacker two different ways to try to trick the key-holder into using it, rather than one.
</details>

---

**Q3.** Suppose an ECDSA implementation avoids §9.4's exact bug — it never literally reuses the same $k$ twice — but its random number generator only produces $k$ values from a pool of $2^{20}$ possible outcomes (roughly a million), even though $k$ is nominally meant to range over a 256-bit space. After how many signatures does this implementation become practically breakable, and by which mechanism?

<details>
<summary>Answer</summary>

**Roughly $2^{10} = 1{,}024$ signatures — not because of literal repetition, but because of Chapter 8's birthday bound applied to this much smaller effective space of only $2^{20}$ possible nonces.**

"Never literally reused" is not the same guarantee as "safe" — §9.4's attack only needs *some* pair of signatures sharing the same $k$ to exist among however many an attacker collects; it doesn't care how that repeat occurred. With only $2^{20}$ possible nonce values in circulation (regardless of $k$'s nominal 256-bit range — the *effective* randomness is capped by the weak generator, exactly the failure mode Chapter 2's Section Challenge Q2 derived for a timestamp-seeded one-time pad key), Chapter 8, §8.5's birthday-bound argument applies directly: a collision among nonces becomes likely once roughly $\sqrt{N} = \sqrt{2^{20}} = 2^{10} = 1{,}024$ signatures have been collected — not once $2^{20}$ have been collected, and certainly nowhere near $2^{256}$.

Once any two of those roughly-1,024 collected signatures happen to share a $k$ value (found simply by grouping observed signatures by their $r$ value, since $r$ is a direct function of $k$ and repeats exactly when $k$ does), §9.4's exact recovery algebra applies immediately to that pair, with no further effort. **The general lesson, appearing for the third time across three different chapters in three different guises:** the property that actually matters for a secret random value is genuine, high-entropy unpredictability — not the weaker, easier-to-satisfy-by-accident property of "not being the literal same value twice." A weak RNG with a small effective range is caught not by an attacker waiting for an exact repeat, but by the birthday bound making an accidental repeat likely far sooner than the nominal key size would suggest.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Why hashing alone fails | $H(m)$ is public and keyless — anyone can recompute it for tampered data; integrity against a malicious party needs a secret in the mix |
| Naive $H(k\|m)$ MAC | Broken by length extension: Merkle-Damgård's exposed final state lets an attacker resume hashing forward and forge a valid MAC for an extended message, without ever learning $k$ — verified with a full working forgery |
| HMAC | $H((k\oplus\text{opad})\|H((k\oplus\text{ipad})\|m))$ — the outer call's secret-dependent prefix is never exposed, defeating length extension structurally; verified byte-for-byte against Python's stdlib HMAC-SHA256 |
| MAC's structural limit | Verifier and signer hold the same key, so a MAC can never prove authorship to a third party (no non-repudiation) — true of any symmetric MAC regardless of design quality |
| RSA signatures | $s=m^d\bmod n$ (private key) / verify $s^e\bmod n=m$ (public key) — the exact Ch6 machinery with exponent roles reversed; verified on the Ch6 key pair, including a failed forgery attempt without $d$ |
| ECDSA | Built on Ch7's EC group; signing uses a per-signature nonce $k$ that must never repeat or be predictable — verified that reusing $k$ across two signatures recovers the private key via simple algebra, the real mechanism behind the 2010 Sony PS3 key recovery |
| Sign/encrypt ordering | Sign-then-encrypt risks surreptitious forwarding; encrypt-then-sign leaks sender-identity metadata and allows signature stripping — composing two secure primitives doesn't automatically yield a secure protocol (Ch4 AEAD-ordering callback) |

**Where we go next:** Signatures and MACs both assume each party already has a durable, properly-generated key. Chapter 10 turns to the messiest real-world key of all — a human-chosen password — and derives, from first principles, why storing one safely is a completely different problem from anything solved so far, right down to why a *fast*, otherwise-excellent hash function like SHA-256 is actually a dangerous choice for the job.

---

*Next: [10 — Password Storage & Key Derivation](10_Password_Storage_Key_Derivation.md)*
