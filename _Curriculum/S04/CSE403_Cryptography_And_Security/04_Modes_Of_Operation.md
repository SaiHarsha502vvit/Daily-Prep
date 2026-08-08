# Chapter 4 — Modes of Operation

> "AES encrypts exactly one 16-byte block. Everything else — a photo, a 4 GB backup, a single 'yes' — is a decision you have to make yourself. This chapter is the story of how many different ways there are to make that decision badly, and the one detail that breaks even the ones that look right."

---

## The Problem

Chapter 3 built AES: a keyed permutation on exactly 128 bits. Real messages are not 128 bits. They're photographs, database backups, HTTP requests — arbitrary length, almost always many blocks long. AES itself has nothing to say about how to handle block two, or block two thousand. That's a separate design question, called a **mode of operation**, and it turns out to be a question with several wrong answers that all *look* reasonable at first glance.

This chapter works through four of them. The first one fails almost immediately, for a reason that should feel familiar from Chapter 1. The next two fix that failure in different ways, each inheriting a sharp edge from an earlier chapter (CBC inherits a version of the IV-predictability problem; CTR inherits Chapter 2's two-time-pad problem, exactly). And the last major lesson is the most important one: even once confidentiality is handled correctly, this chapter shows — with a real, working attack — that confidentiality was never the whole problem.

---

## 4.1 ECB — The Naive Approach, and Why It's an Instant Fail

The obvious idea: split the plaintext into 16-byte blocks, encrypt each one independently with the same key, concatenate the results. This is called **Electronic Codebook mode (ECB)**, and the reasoning behind it sounds sound: Chapter 3 proved AES is a strong PRP, indistinguishable from a random permutation to any bounded attacker. Doesn't that mean each block's ciphertext is safe?

**The hole in that reasoning:** Chapter 3's PRP guarantee is a statement about *one* input at a time — given a single block, its ciphertext looks random. It says nothing whatsoever about the *relationship between* the ciphertexts of two different blocks encrypted under the same key. And $E_k$ is a **function** — by definition, the same input always produces the same output. If plaintext block 7 and plaintext block 19 happen to be identical, $E_k(\text{block}_7) = E_k(\text{block}_{19})$, *always*, no matter how strong $E_k$ is. ECB doesn't break AES. It uses AES perfectly correctly, and exposes a structural fact that was true all along: identical inputs to a deterministic function produce identical outputs.

**This is worth seeing directly rather than trusting the argument.** Build a small synthetic "image": 8 rows of 16 bytes each (one AES block per row), where rows 0, 1, 6, 7 share one plaintext pattern (call it "background") and rows 2–5 share a different pattern ("shape") — exactly the way a real image has large uniform regions:

```
Plaintext structure: rows 0,1,6,7 = block A (background), rows 2-5 = block B (shape)
```

Encrypt it under real AES-128-ECB with a random key:

```
ECB ciphertext, row by row (first 8 hex chars shown):
  row 0: e70914f2...
  row 1: e70914f2...      <- identical to row 0
  row 2: c92e54da...
  row 3: c92e54da...      <- identical to row 2
  row 4: c92e54da...      <- identical to row 2
  row 5: c92e54da...      <- identical to row 2
  row 6: e70914f2...      <- identical to row 0
  row 7: e70914f2...      <- identical to row 0

Distinct ciphertext rows under ECB: 2 (out of 8 rows, only 2 distinct plaintext blocks were used)
```

Every individual ciphertext block, taken alone, is unrecognizable — that part of AES's guarantee holds fine. But the **pattern of which blocks are equal to which other blocks** survives encryption *exactly*, because equality is exactly the one thing a deterministic function is guaranteed to preserve. This is the real mechanism behind the famous "ECB penguin" demonstration: encrypt a bitmap image with ECB, and the large uniform-color regions (sky, background, a silhouette's outline) reproduce their block-level repetition pattern in the ciphertext, so the outline of the original image remains visible even though no individual pixel block is decodable.

**The lesson is Chapter 1's lesson again, wearing a different alphabet.** Chapter 1's substitution cipher mapped each of 26 possible plaintext *letters* to a fixed ciphertext letter, consistently, and frequency analysis exploited exactly that consistency. ECB maps each of $2^{128}$ possible plaintext *blocks* to a fixed ciphertext block, consistently — the alphabet is enormous instead of 26 symbols, but "same input always produces same output, and that consistency is visible in the ciphertext" is the identical disease. A larger alphabet doesn't fix a structural leak; §1.2 already proved that a $4\times10^{26}$-size key space doesn't stop frequency analysis either.

---

## 4.2 CBC — Chaining Blocks Together

The fix has to attack ECB's actual flaw directly: make each block's ciphertext depend on more than just that block's own plaintext, so that two identical plaintext blocks can produce *different* ciphertext.

**The natural mechanism — chaining:** XOR each plaintext block with the *previous ciphertext block* before encrypting it:

$$C_i = E_k(P_i \oplus C_{i-1})$$

Decryption reverses this directly (XOR undoes itself, same fact used throughout Chapters 2–3): $D_k(C_i) = P_i \oplus C_{i-1}$, so $P_i = D_k(C_i) \oplus C_{i-1}$. This is **Cipher Block Chaining (CBC)**. Now if plaintext blocks 7 and 19 are identical, their ciphertexts are still almost certainly different — because $C_6$ and $C_{18}$ (whatever ciphertext happened to precede each one) are essentially never equal, so each block is being XORed against a different mask before encryption.

**Why an IV is required, structurally, not just by convention.** The formula $C_i = E_k(P_i \oplus C_{i-1})$ has an obvious gap at $i=0$: there is no $C_{-1}$. Something has to fill that role for the very first block, and it has to be agreed by both sides — this is the **initialization vector (IV)**: $C_0 = E_k(P_0 \oplus \text{IV})$. The IV doesn't need to be secret (it's typically sent alongside the ciphertext in the clear) — but it does need to be **unpredictable in advance**, and it's worth deriving exactly why, rather than asserting it as a rule.

**Verified demonstration.** Encrypt two different messages that happen to share the same first plaintext block, under the same key, first with a **fixed** IV reused across both:

```
ciphertext block A: 56bb056dd4a64f2c6f2cb66b9bbeb7b2
ciphertext block B: 56bb056dd4a64f2c6f2cb66b9bbeb7b2
Identical first ciphertext blocks: True   <- leaks that both messages start the same way, exactly like ECB
```

A fixed (or otherwise predictable) IV reduces CBC's very first block back to ECB's exact failure mode — because $P_0 \oplus \text{IV}$ is identical whenever $P_0$ and the IV are both identical, so $E_k$ is once again being fed the same input twice. Now repeat with a **fresh, unpredictable** IV for each message:

```
ciphertext block A: fa07f9bc51b80917598082cf3314ffc1
ciphertext block B: 305dd1f7f8e3e2c76a3f0060ded36afc
Identical first ciphertext blocks: False   <- no leak; CBC's chaining property is restored
```

The chaining property that protects every *later* block was never in danger — it's specifically block 0 that borrows its security entirely from the IV's unpredictability, and only an unpredictable IV delivers that. (This exact failure mode — a predictable, implicit IV, specifically the reuse of the previous record's last ciphertext block as the next record's IV — was the mechanism behind a real, practical attack on early TLS/SSL deployments using CBC.) The full 8-row synthetic plaintext from §4.1, re-encrypted under CBC with a proper random IV, confirms the general case: **8 distinct ciphertext rows out of 8**, versus ECB's 2 — and decrypting it back recovers the original plaintext exactly, verified directly.

---

## 4.3 CTR — Turning a Block Cipher into a Stream Cipher

CBC fixes ECB's leak but pays for it with strict sequential structure — block $i$'s encryption depends on block $i-1$'s *ciphertext*, so encryption can't be parallelized, and (as §4.6 will show) mishandling the padding this sequential structure requires opens an entirely different attack. **Counter mode (CTR)** takes a different approach to the same underlying problem, and it's worth deriving because of *what it structurally turns into*.

**The construction:** don't encrypt the plaintext at all. Instead, encrypt a **counter** — a nonce concatenated with a block index that increments by one for each block — and XOR the result with the plaintext:

$$C_i = P_i \oplus E_k(\text{nonce} \,\|\, i)$$

Decryption is the *identical* operation: $P_i = C_i \oplus E_k(\text{nonce}\,\|\,i)$ — CTR mode **never calls AES decryption at all**, only ever the forward encryption direction. This is exactly the PRP-vs-PRF distinction flagged as a forward reference in Chapter 3, §3.1: CTR only ever needs $E_k$ to behave like a pseudorandom *function*, the weaker of the two guarantees, since nothing is ever inverted.

**Look closely at the shape of that equation.** $C = P \oplus (\text{something generated from a key})$ is *exactly* Chapter 2's one-time pad equation. The "pad" here — $E_k(\text{nonce}\,\|\,0), E_k(\text{nonce}\,\|\,1), \ldots$ — is not shared in advance and is not truly random; it's *generated* on demand from a short key and a nonce, using AES as a pseudorandom generator, precisely the trick Chapter 2's closing section previewed and Chapter 3 built the machinery for. Verified round trip on a real message:

```
Plaintext:  b'THIS IS A SECRET MESSAGE OVER 16 BYTES!'
Ciphertext: 9d0aa243ceb104cfa140f03597284ed730c561177407ba9cdab466d2a810f0c1ae96da883b47ee
Decrypt (re-apply same keystream) recovers plaintext exactly: True
```

**And because it's structurally a generated one-time pad, it inherits the one-time pad's one unforgivable sin.** If the *same* (key, nonce) pair is ever used to encrypt two different messages, both messages are XORed against the *identical* keystream — and Chapter 2's two-time-pad attack applies verbatim: XOR the two ciphertexts, and the keystream cancels completely.

**Verified.** Two different (but equal-length) plaintexts, encrypted under CTR with the same key and the same reused nonce:

```
c1 XOR c2 == p1 XOR p2 : True
```

No key material required at all — just as in Chapter 2. And this isn't an abstract information leak; it's directly exploitable when the attacker can guess or already knows one of the two messages.

**A precise contrast worth drawing out, since it's easy to blur the two:** CBC's IV (§4.2) had to be *unpredictable* — an attacker who could merely *guess it in advance* was enough to reduce block 0 to ECB. CTR's nonce has a different, narrower requirement: it only has to be **unique** per key, never repeated — it does *not* need to be unpredictable. A CTR nonce that counts 0, 1, 2, 3, … in full public view is completely fine, because nothing in the derivation above depended on the attacker being unable to predict the *next* nonce — it depended entirely on $E_k(\text{nonce}\|i)$ never being computed twice for the same (key, nonce‖i) pair. Predictability of a CTR nonce buys an attacker nothing, because a predicted-but-still-unique input still produces a keystream block that was never used anywhere else. This distinction is the subject of this chapter's Section Challenge Q2. Concretely, with `plaintext_1 = "TRANSFER $100 TO ALICE ACCOUNT!"` and an unknown `plaintext_2` encrypted under the same reused nonce:

```
Attacker who knows/guesses plaintext_1 recovers plaintext_2 fully: True
  recovered_p2 = b'TRANSFER $900 TO EVE___ACCOUNT!'
```

The second message is recovered in full, with zero knowledge of the key — purely from the reused keystream. This is precisely why CTR-mode nonces come with such strict "never repeat under the same key, ever" requirements in every real protocol that uses it (TLS 1.3, SSH, disk encryption): nonce reuse in CTR isn't a *weakening* of security, exactly as Chapter 2 stressed for the two-time pad — it *deletes* it, in one XOR.

---

## 4.4 What CBC and CTR Both Still Lack: Integrity

Suppose CBC and CTR are both used correctly — random IVs, never-reused nonces, a properly secret key. Both now provide solid **confidentiality**: an eavesdropper who only *observes* ciphertext learns nothing useful about the plaintext. But neither mode makes any claim at all about a completely different property: **can an active attacker who intercepts and modifies the ciphertext in transit cause the receiver to accept a different, attacker-chosen plaintext?**

**Verified bit-flipping attack on CTR.** Recall $C_i = P_i \oplus E_k(\text{nonce}\,\|\,i)$. XOR is bitwise and position-preserving — flip bit $j$ of $C_i$, and bit $j$ of the *decrypted* $P_i$ flips too, deterministically, with every other bit of the message completely unaffected (the keystream for those other bits is untouched):

```
Original plaintext:  b'AMOUNT: $0000100.00 SEND=FRIEND'
Ciphertext:           3d92a1c0ed79e64315129f5173eb75eff91e3dc25f75d2f15716f185dd4a97

Attacker flips ciphertext bits with NO knowledge of the key.
Resulting plaintext after victim decrypts the tampered ciphertext: b'AMOUNT: $9999100.00 SEND=FRIEND'
Rest of message unchanged apart from the targeted bytes: True
```

This is not "the message got corrupted into garbage" — that would at least be detectable. The attacker computed *exactly* which ciphertext bits to flip to turn `$0000100` into `$9999100`, changed nothing else, and the victim's decryption produces a coherent, plausible, attacker-chosen message with **zero knowledge of the key**. (CBC has an analogous, structurally different bit-flipping property: flipping bits of ciphertext block $C_{i-1}$ predictably flips the same bits of the *next* block's decrypted plaintext $P_i$, while scrambling block $i-1$'s own decrypted output into garbage — the mechanism is different, but the underlying gap is the same one derived here.)

**The conclusion has to be stated precisely:** confidentiality (hiding content from a passive eavesdropper) and **integrity** (detecting whether an active attacker tampered with the message) are two *separate* properties. Encryption alone — no matter which mode, no matter how correctly the IV/nonce is handled — only ever promises the first one. Getting the second one requires something new.

---

## 4.5 AEAD and GCM — Adding Integrity to Encryption

What's missing is a way for the receiver to verify, before trusting *any* of the decrypted plaintext, that the ciphertext is exactly what the legitimate sender produced and nothing an attacker altered. That requires a **keyed** integrity check — an unkeyed one (like a plain hash of the ciphertext) is useless here, since an attacker who can modify the ciphertext can just as easily recompute a plain hash over their modified version. (Chapter 9 derives this class of construction — Message Authentication Codes — in full; for now, treat it as: a function of the ciphertext and the secret key that produces a short **tag**, which the receiver recomputes and compares before doing anything else with the plaintext.)

**GCM (Galois/Counter Mode)** is the standard way to get both properties from one construction, and its name describes exactly what it's built from: **CTR mode** (§4.3, unchanged) provides confidentiality, combined with **GHASH**, a keyed checksum computed via polynomial evaluation over the finite field $\mathrm{GF}(2^{128})$ (the same *kind* of field-arithmetic idea Chapter 3 used for MixColumns, just a different, larger field — the polynomial construction itself is out of scope for this course, matching Chapter 3's treatment of MixColumns' field arithmetic). GHASH is computed over the ciphertext and produces an **authentication tag**, sent alongside the ciphertext.

This construction is called **AEAD — Authenticated Encryption with Associated Data.** The "associated data" part matters: some fields of a real message (a packet's sequence number, a protocol header) need to be *authenticated* — the receiver needs to know they weren't tampered with — but must not be *encrypted*, because the receiver (or intermediate network equipment) needs to read them before decryption even happens. GCM lets the sender feed such fields into the tag computation without encrypting them.

**Why this closes §4.4's attack, structurally, not just in this specific instance:** the receiving side of an AEAD scheme is required to **recompute the tag and check it before releasing any plaintext at all**. If an attacker flips a ciphertext bit exactly as in §4.4's demonstration, the ciphertext changes, so the correct tag for that (now-different) ciphertext also changes — but the attacker, lacking the key, cannot compute what that new correct tag should be. The receiver's recomputed tag won't match the one that arrived, and the entire message is rejected outright. The bit-flipping capability that CTR alone handed an attacker for free is still technically *possible* to attempt — it just no longer *works*, because the corrupted plaintext is never used for anything.

(One nuance worth flagging without a full derivation: because GCM's confidentiality layer *is* CTR mode internally, GCM inherits CTR's exact nonce-uniqueness requirement from §4.3 — reusing a nonce under GCM breaks confidentiality in precisely the way already shown, and separately undermines the authentication guarantee too. "Never reuse a nonce" is, once again, not a suggestion.)

**One more detail that matters as much as having a tag at all: the *order of operations* on the receiving side.** It has to be *verify the tag, then decrypt* — not *decrypt, then verify, and only act on the plaintext if the tag checks out*. This sounds like a distinction without a difference (either way, a bad tag means the plaintext never gets used, right?) but it isn't: if a real implementation decrypts first and only checks the tag afterward, then *some* code path — however small, a memory write, a buffer allocation sized from attacker-controlled decrypted data, a branch — has already executed on attacker-influenced plaintext before the rejection happens. §4.6 is a full worked example of exactly this class of mistake: a padding check that runs *before* an integrity check gives an attacker a side channel into every byte of the plaintext, even though the "final" answer (reject this message) ends up correct either way. Verify-then-decrypt closes this off structurally: an invalid tag means decryption is never even attempted, so there is no code path left for a side channel to leak information through.

---

## 4.6 Padding Oracle Attacks on CBC — When Elegant Math Isn't Enough

CBC, used with a proper random IV, has a real security proof behind it. That proof is not wrong. And CBC was, for years, deployed in ways that were still completely breakable — not because the math was flawed, but because real deployments quietly violated an assumption the proof depended on. This is worth walking through in full, because the lesson generalizes far beyond CBC.

**The setup.** CBC only encrypts whole blocks, but real messages rarely land on an exact multiple of 16 bytes. The standard fix is **PKCS#7 padding**: before encrypting, append $n$ bytes, each with the value $n$, where $n$ is chosen to bring the total length up to a multiple of the block size (if the message is already a multiple, a full extra block of padding is added, so the padding is never zero bytes and is always unambiguous to strip afterward). After decrypting, the receiver reads the last byte, treats it as "how many padding bytes to remove," and — critically for what follows — **checks that those last $n$ bytes are all actually equal to $n$** before accepting the message as validly padded.

**The vulnerability.** Suppose a server decrypts attacker-supplied ciphertext and reveals — through *any* observable channel: a distinct error message, a different HTTP status code, or even just a measurably different response time — whether that padding check passed or failed. That single bit of information ("valid padding" vs. "invalid padding"), asked adaptively across many attacker-crafted ciphertexts, turns out to be enough to decrypt the **entire message**, without the key, ever.

**Deriving the mechanism.** Recall CBC decryption: $P_i = D_k(C_i) \oplus C_{i-1}$. An attacker who can submit an *arbitrary* fake "previous block" $C'$ alongside a real target block $C_i$, and observe only whether $D_k(C_i) \oplus C'$ ends in valid PKCS#7 padding, can control $C'$ byte by byte. Sweep the last byte of $C'$ through all 256 possible values; exactly one (generically) will make the final decrypted byte equal `0x01` — a validly padded single byte — and the oracle will report success. The moment it does, the attacker has learned one exact byte of $D_k(C_i)$ (the *raw* AES decryption of the block, before the final XOR): $D_k(C_i)[15] = C'[15] \oplus 1$. Fix that byte in $C'$ so it now reliably produces a trailing `0x01` won't-happen coincidence, adjust it instead to force a target padding of `0x02` in the *last two* bytes, and sweep the second-to-last byte the same way. Repeat for all 16 bytes of the block, and the entire raw decryption $D_k(C_i)$ is known — from which the *real* plaintext block follows immediately: $P_i = D_k(C_i) \oplus C_{i-1,\text{real}}$, using the genuine previous ciphertext block the attacker already had.

**This was implemented and run for real** — not simulated by assertion. A 31-byte secret was CBC-encrypted with a random key and IV; an "oracle" function (standing in for the server, with access to the key) was written to reveal *only* a `True`/`False` padding-validity verdict; and an attacker routine was written that calls *only* that oracle function — it never touches the key or calls AES decryption directly, exactly mirroring what a real network attacker can do:

```
Secret plaintext (31 bytes): b'PADDING ORACLES LEAK EVERYTHING'
Ciphertext (2 blocks): 2ceedd2dbe7edeef72e827d1857d2ccb4a7b8bd42433dc2751e98ffa5da7dad2

Total oracle queries used: 3975 (attacker never called AES decrypt or touched the key directly)
Recovered bytes (with PKCS7 padding still attached): b'PADDING ORACLES LEAK EVERYTHING\x01'
After stripping PKCS7 padding: b'PADDING ORACLES LEAK EVERYTHING'
Matches original secret exactly: True
```

The full plaintext, recovered exactly, using fewer than 4,000 yes/no oracle queries and no access to the key whatsoever — a workload that takes milliseconds, not the astronomical brute-force effort AES's key length is supposed to demand. This is the real attack published by Serge Vaudenay at Eurocrypt 2002, and it was not a theoretical curiosity: implementations of CBC padding checks in widely deployed software (including SSL/TLS stacks, and web frameworks such as early ASP.NET) were found practically vulnerable to exactly this technique.

**Why this matters more than "one specific bug in one specific system":** CBC's confidentiality proof implicitly assumes the attacker only ever *observes* ciphertext and never receives feedback about *how* decryption succeeded or failed. Padding validation, implemented naively, quietly hands the attacker exactly one extra bit of feedback per query — and that one bit, it turns out, is sufficient to break everything, byte by byte. **The math was never wrong. The deployment silently violated an assumption the math depended on**, and no amount of AES's own strength could compensate, because the attack never once needed to attack AES itself. Even "fixing" the error *message* to be identical in both cases isn't automatically sufficient — if the *timing* of a valid-padding response differs measurably from an invalid-padding response (because, for instance, a valid-padding path goes on to do extra work an invalid-padding path skips), that timing difference is its own oracle; a real, published attack called **Lucky Thirteen** (2013) exploited exactly this timing variant against real TLS implementations that had already tried to patch the original Vaudenay attack. The durable fix is structural, not a patch: use an AEAD construction (§4.5) where the integrity tag is checked **before** any padding is examined at all, so a tampered ciphertext is rejected outright and the padding-processing code path — the entire source of the leak — is never reached with attacker-influenced data in the first place.

---

## Section Challenge

---

**Q1.** A developer wants to cheaply patch ECB's weakness without switching modes. Their idea: prepend one random 16-byte "salt" block to the plaintext before ECB-encrypting everything (so block 0 is random noise, and blocks 1..n are the real message, each still encrypted independently under plain ECB). Does this fix ECB's core problem?

<details>
<summary>Answer</summary>

**No — it hides nothing beyond block 0 itself, and the actual message content is exactly as exposed as before.** ECB's flaw, derived in §4.1, is that *every* block is encrypted independently and deterministically: $C_i = E_k(P_i)$, with no dependence on anything outside block $i$. Prepending one random block only changes what block 0 happens to contain — it does nothing to blocks 1 through $n$, which are still each individually run through $E_k$ with zero influence from the salt block or from each other. Two identical plaintext blocks anywhere in the *real* message content still produce identical ciphertext blocks, exactly as in §4.1's 8-row demonstration; the repeating "background" and "shape" rows would still collapse to 2 distinct ciphertext values regardless of what block 0 contains, because nothing about how blocks 1–7 get encrypted has changed at all.

**Why this is a useful trap to fall into (and see through):** it's tempting to think "add some randomness somewhere and the whole ciphertext becomes unpredictable." But the fix that actually works — CBC, §4.2 — doesn't just add randomness once; it **chains** that randomness *forward*, so every single block's encryption input depends on the ciphertext of the block before it: $C_i = E_k(P_i \oplus C_{i-1})$. A salt block that isn't fed forward into the encryption of every subsequent block accomplishes nothing structural; it's randomness that touches exactly one block and then stops. CBC's IV is exactly this same "one random value at the start" idea — the entire difference is that CBC's chaining propagates its effect through every block that follows, while this proposal's salt block doesn't propagate anywhere.
</details>

---

**Q2.** System A picks a fresh random 96-bit nonce for every CTR-mode message it encrypts under a fixed key. System B uses a strictly incrementing counter (0, 1, 2, 3, …) as its nonce, never repeating, for every message under the same fixed key. Given that §4.3 proved nonce reuse in CTR is catastrophic, which system is actually safer, and why?

<details>
<summary>Answer</summary>

**System B (the incrementing counter) is safer — provided the "never repeats" guarantee is actually engineered correctly — because it has *zero* probability of nonce reuse by construction, while System A has a small but real, growing probability of reuse.**

A 96-bit random nonce has an enormous space ($2^{96}$ values), but "enormous" is not "zero," and choosing values uniformly at random from a large space eventually produces a repeat with meaningfully non-negligible probability once *enough* messages have been sent — this is a **birthday-paradox** phenomenon (derived properly in Chapter 8): collision probability grows with roughly the *square* of the number of nonces used, not linearly, so it becomes non-negligible far sooner than "$2^{96}$ is astronomically large" naively suggests, especially at the volume of traffic a busy server sends in its lifetime. System A's risk is small at reasonable volumes but is fundamentally *probabilistic* and gets worse the longer the same key stays in use.

System B's incrementing counter, by contrast, has **exactly zero** probability of an accidental repeat, as long as the counter truly never resets or duplicates — which is a real engineering requirement, not a cryptographic one: the counter state has to be reliably persisted across restarts, there must be exactly one writer incrementing it (a naive multi-server or multi-process setup that each starts counting from 0 independently would silently reintroduce §4.3's exact catastrophe), and VM snapshot/restore or backup-restore operations must not roll the counter backward.

**The real lesson:** nonce reuse risk doesn't disappear with either design — it *relocates*. System A's risk is a cryptographic/probabilistic one (birthday bound), quantifiable in advance. System B's risk is an engineering/operational one (state management across restarts, replicas, and failures), and arguably harder to reason about because a single operational mistake (not a statistical fluke) causes an *immediate, certain* repeat rather than a small probability of one. Real protocols (TLS 1.3 among them) generally prefer deterministic counters or counter-derived nonces specifically because "certainly safe if implemented correctly" is often easier to actually get right in practice than "safe with very high probability."
</details>

---

**Q3.** A team, aware of the padding oracle attack from §4.6, fixes their server to return the exact same generic "decryption failed" error text regardless of whether the padding was invalid or whether padding was valid but some later processing step failed. Have they fully closed the vulnerability?

<details>
<summary>Answer</summary>

**Not necessarily — identical error *text* only closes one of the possible side channels; a timing difference between the two code paths is an equally exploitable oracle, and §4.6 already named the real published attack that exploits exactly this.**

The padding oracle attack, as derived in §4.6, needs exactly one bit of information per query: did *this specific ciphertext* decrypt to something with valid padding, yes or no? Identical error text closes off the most obvious channel for that bit — an attacker can no longer read "BAD_PADDING" versus "BAD_MAC" off the response body. But if the code path taken when padding *is* valid does additional work before returning (parsing the now-unpadded plaintext further, checking a MAC, deserializing a payload) that the invalid-padding path skips entirely by failing fast, the two paths take measurably different **time** — and with enough repeated queries and statistical averaging (to smooth out ordinary network jitter), an attacker can distinguish "valid padding" from "invalid padding" from response latency alone, with no need to ever see different error text. This is precisely the mechanism behind the real, published **Lucky Thirteen** attack (2013), which succeeded against TLS implementations that believed they had already closed the Vaudenay padding-oracle hole.

**The generalizable lesson:** "make the visible output identical" is a *patch* aimed at one specific side channel (response content), not a *proof* that no side channel exists — and side channels have a track record of showing up in places nobody patched because nobody was looking there (timing, as here; also power consumption, cache access patterns, and others, all outside this course's scope but the same category of problem). The durable fix identified in §4.6 is structural rather than reactive: adopt an AEAD scheme where the authenticity tag is verified **before** the padding-processing code path is ever reached at all, so there is no valid/invalid-padding branch left in the design for a timing (or any other) side channel to leak information about in the first place. Removing the branch beats trying to make every possible way of observing the branch behave identically.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| ECB | Encrypts each block independently and deterministically — identical plaintext blocks always produce identical ciphertext blocks, leaking structure exactly like Chapter 1's substitution cipher; verified with an 8-row synthetic "image" (2 distinct ciphertext rows out of 8) |
| CBC | Chains blocks via $C_i = E_k(P_i \oplus C_{i-1})$, so identical plaintext blocks stop producing identical ciphertext (verified: 8/8 distinct rows) |
| IV (CBC) | Required to seed block 0; must be unpredictable, not just present — verified that a fixed/predictable IV collapses block 0 back to ECB's exact leak, while a fresh random IV restores full protection |
| CTR | Turns a block cipher into a generated one-time pad: $C_i = P_i \oplus E_k(\text{nonce}\|i)$, using AES only in the forward (PRF-only) direction — verified encrypt/decrypt round trip |
| Nonce reuse (CTR) | Structurally identical to Chapter 2's two-time-pad attack — verified that reusing a (key, nonce) pair lets an attacker cancel the keystream via XOR and fully recover a second plaintext from a known first one |
| Confidentiality ≠ integrity | Neither CBC nor CTR alone detects tampering — verified a CTR bit-flipping attack that changes a specific dollar amount in a message with zero key knowledge, silently and predictably |
| AEAD / GCM | CTR (confidentiality) + GHASH (keyed integrity tag over GF(2^128)) — receiver verifies the tag before trusting any plaintext, closing the bit-flip attack structurally rather than by patching it |
| Padding oracle attack | A single valid/invalid-padding bit, leaked via error message or timing and queried adaptively, decrypts an entire CBC message with zero key access — verified end-to-end: 31-byte secret fully recovered in 3975 oracle queries |
| Security proofs vs. deployments | CBC's confidentiality proof is correct; real systems broke it anyway by leaking one extra bit (padding validity) the proof never accounted for — the fix is closing the side channel structurally (AEAD), not patching each leak as found |

**Where we go next:** Everything since Chapter 2 has been symmetric cryptography — the same key encrypts and decrypts. That leaves the problem Chapter 2 flagged and never solved: how do two parties who've never met agree on a shared key in the first place, over a channel an attacker can listen to? Before that question can be answered (Chapter 7), it needs mathematical machinery this course hasn't built yet — modular arithmetic, modular inverses, and fast exponentiation — which Chapter 5 derives from first principles.

---

*Next: [05 — Number Theory Foundations for Crypto](05_Number_Theory_Foundations.md)*
