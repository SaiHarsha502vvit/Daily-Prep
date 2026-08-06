# Chapter 1 — Classical Ciphers & Cryptanalysis

> "Every cipher designer believes their cipher is unbreakable. History's job is to prove them wrong. The only question is how long it takes."

---

## The Problem That Starts Everything

Here is a message, encrypted with a cipher that was considered militarily useful for over two thousand years:

```
DWWDFNDWGDZQ
```

Try shifting each letter back by 3 positions in the alphabet (D→A, W→T, W→T, D→A...). You just broke it by hand in under a minute: `ATTACKATDAWN`.

That's the entire chapter in miniature. Classical cryptography is a 2,000-year arms race between people inventing ways to hide information and people inventing ways to reveal it — and the revealing side keeps winning, for a *structural* reason we're about to derive. Understanding exactly *why* every classical cipher eventually falls is not a history lesson. It's the reason modern cryptography looks the way it does: every design choice in AES, RSA, and TLS exists because someone, somewhere, broke the thing that came before it.

---

## 1.1 The Caesar Cipher — And Why 26 Isn't Enough

**The idea:** shift every letter of the alphabet forward by a fixed amount *k*. To encrypt, add *k* (mod 26); to decrypt, subtract *k*.

```
plaintext:   A T T A C K A T D A W N
shift +3:    D W W D F N D W G D Z Q
ciphertext:  D W W D F N D W G D Z Q
```

(Verified: `ATTACKATDAWN` shifted by 3 really does produce `DWWDFNDWGDZQ` — try decrypting it by hand with shift 3 and you'll recover the original.)

**Formally:** for plaintext letter $p$ (as a number 0–25, A=0) and key $k$:

$$c = (p + k) \bmod 26 \qquad p = (c - k) \bmod 26$$

**Why it's broken the moment someone tries:** the key space is exactly 26 values (k = 0 through 25, and k=0 is the useless "do nothing" case). An attacker doesn't need to be clever — they need to be patient enough to try 25 shifts and notice which one produces English. This is called a **brute-force / exhaustive key search**, and it's the baseline every cipher must defeat: *if trying every key is easy, the cipher provides no security at all, no matter how the ciphertext looks.*

**The first lesson of cryptography:** key space size is a *necessary* condition for security, never a *sufficient* one. Caesar fails because 26 is too small. But — and this is the whole chapter — making the key space astronomically large does **not** automatically fix things, as we're about to see.

---

## 1.2 The Substitution Cipher — A Key Space of 26!

Instead of shifting every letter by the same amount, why not scramble the alphabet completely? Pick *any* permutation of A–Z as your substitution table:

```
plain:   A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
cipher:  Q W E R T Y U I O P A S D F G H J K L Z X C V B N M
```

Now "ATTACK" doesn't shift predictably — each letter maps independently to whatever the table says. The **key space** is the number of possible permutations of 26 letters:

$$26! = 26 \times 25 \times 24 \times \cdots \times 1 \approx 4.03 \times 10^{26}$$

That number is larger than the count of grains of sand on Earth, larger than the number of stars in the observable universe by several orders of magnitude. Brute force is now hopeless — even at a trillion attempts per second, exhausting this key space would take longer than the age of the universe.

**So the substitution cipher is secure, right?**

No. It was broken centuries before computers existed, by 9th-century Arab mathematician Al-Kindi, using an attack that has nothing to do with trying keys.

---

## 1.3 Frequency Analysis — Attacking the Language, Not the Key

**The insight that breaks substitution ciphers:** a substitution cipher doesn't hide the *statistical structure* of the language — it just relabels it. English text isn't random. Some letters appear far more often than others:

| Letter | Frequency | Letter | Frequency | Letter | Frequency |
|---|---|---|---|---|---|
| E | 12.7% | L | 4.0% | B | 1.5% |
| T | 9.1% | C | 2.8% | V | 1.0% |
| A | 8.2% | U | 2.8% | K | 0.8% |
| O | 7.5% | M | 2.4% | J | 0.15% |
| I | 7.0% | W | 2.4% | X | 0.15% |
| N | 6.7% | F | 2.2% | Q | 0.10% |
| S | 6.3% | G | 2.0% | Z | 0.07% |
| H | 6.1% | Y | 2.0% | | |
| R | 6.0% | P | 1.9% | | |
| D | 4.3% | | | | |

If E is substituted by Q everywhere, then **Q becomes the most frequent letter in the ciphertext**, in exactly the proportion E used to appear in the plaintext. Substitution doesn't erase the fingerprint — it just relabels whose fingerprint it is.

**Worked example.** Encrypt a real passage (207 letters of English text) with a *Caesar* shift of 7, then count ciphertext letter frequencies without knowing the key:

```
Ciphertext (first 60 chars): AOLXBPJRIYVDUMVEQBTWZVCLYAOLSHGFKVNHUKAOLMPCLIVEPUNDPGHYKZQB...

Top 5 ciphertext letters by count:
  L: 34    A: 15    O: 15    P: 13    U: 12
```

`L` dominates the ciphertext by a wide margin — 34 occurrences, nearly double the runner-up. In English, `E` is the letter that dominates plaintext by a wide margin. **Hypothesis: L decrypts to E.** Since `L` is 7 positions after `E` in the alphabet, the shift is 7 — and that is, in fact, exactly the key that was used. No brute force was needed; you can find the shift by looking at a single number (the most frequent letter) instead of trying all 25 possibilities.

For a **general substitution cipher** (not just a shift), the same idea works letter-by-letter and word-by-word: match the ciphertext's frequency ranking against English's frequency ranking, use short words (a lone ciphertext letter is almost certainly "A" or "I"), use double letters (`LL`, `EE`, `SS` are common), and iterate — guess a few letters, see what words start to appear, refine. A human with a pencil can typically break a few hundred characters of simple substitution cipher in under an hour. $4 \times 10^{26}$ possible keys, defeated by counting.

**The second lesson of cryptography:** a cipher must hide *statistical structure*, not just relabel symbols. A cipher's key space can be astronomically large and it can *still* leak the plaintext, because the attack doesn't have to search the key space at all — it can attack the redundancy of the message instead.

---

## 1.4 The Vigenère Cipher — Defeating Frequency Analysis (Almost)

The flaw in both previous ciphers is that **each plaintext letter always maps to the same ciphertext letter**. Frequency analysis only works because that mapping is fixed. What if the mapping changed depending on *position*?

**The Vigenère cipher:** pick a keyword, say `LEMON`. Repeat it to match the message length, and add each keyword letter (as a Caesar shift) to the corresponding plaintext letter:

```
plain:   A  T  T  A  C  K  A  T  D  A  W  N
key:     L  E  M  O  N  L  E  M  O  N  L  E
p_val:   0  19 19 0  2  10 0  19 3  0  22 13
k_val:   11 4  12 14 13 11 4  12 14 13 11 4
sum%26:  11 23 5  14 15 21 4  5  17 13 7  17
cipher:  L  X  F  O  P  V  E  F  R  N  H  R
```

(Verified by direct computation — encrypting and then decrypting `LXFOPVEFRNHR` with key `LEMON` recovers `ATTACKATDAWN` exactly.)

Notice: plaintext `A` appears three times (positions 0, 3, 6) and encrypts to **three different ciphertext letters** (L, O, E), because each occurrence lines up with a different letter of the repeating key. This is exactly what breaks frequency analysis: the same plaintext letter no longer produces the same ciphertext letter, so counting ciphertext letter frequencies no longer reveals anything about plaintext letter frequencies. For nearly 300 years (16th–19th century), Vigenère was called *le chiffre indéchiffrable* — "the indecipherable cipher."

It was deciphered.

---

## 1.5 Breaking Vigenère — Kasiski Examination

The weakness is hiding in plain sight: **the key repeats**. If the key has length $L$, then any two identical plaintext sequences separated by a multiple of $L$ characters will encrypt to identical ciphertext sequences — because they line up against the same stretch of key.

**Worked example.** Encrypt `THECATANDTHEDOGRANAWAYTOTHECATANDTHEDOGSHOUSE` with key `KEY` (length 3):

```
Ciphertext: DLCMERKRBDLCNSEBELKAYIXMDLCMERKRBDLCNSECLMEWC
```

Scan for repeated 3-letter sequences and record where they occur:

| Repeated trigram | Positions | Distance | Distance ÷ 3 |
|---|---|---|---|
| `DLC` | 0, 9, 24, 33 | 9, 24, 33 | 3, 8, 11 — all whole numbers |
| `LCM` | 1, 25 | 24 | 8 |
| `MER` | 3, 27 | 24 | 8 |

**Kasiski's method (1863):** every one of these distances is divisible by 3. That's not a coincidence — it's a direct consequence of the key having length 3. In general, the *greatest common divisor* of all the repeat-distances is a strong candidate for the key length. Once the key length $L$ is known, the ciphertext splits into $L$ interleaved streams (every 3rd letter belongs to the same key letter) — and **each of those streams is just a Caesar cipher**, breakable by the frequency analysis from §1.3.

**The third lesson of cryptography:** *any* repetition in the relationship between key and plaintext is a crack an attacker can pry open. Vigenère's fatal flaw wasn't the substitution step — it was reusing the key. This exact lesson resurfaces in Chapter 2 (why the one-time pad must never reuse a key) and Chapter 4 (why reusing a nonce in AES-GCM is catastrophic). It is the single most repeated failure mode in the entire history of cryptography.

---

## 1.6 The Enigma Machine — Mechanization Raises the Bar, Doesn't Remove It

By the 1920s, Vigenère-style ciphers were mechanized into rotor machines. Germany's **Enigma** machine used 3–4 rotors (each rotor a fixed substitution, wired differently), a plugboard (swapping pairs of letters before and after the rotors), and — critically — a **reflector**, which sends the signal back through the rotors a second time. Each keypress also *advanced* a rotor, so the effective substitution alphabet changed with every letter, like a Vigenère key with a period in the tens of thousands.

The key space was enormous: rotor choice, rotor order, rotor starting positions, and plugboard wiring together gave roughly $10^{23}$ possible daily settings. By the standard of §1.1, brute force was absurd.

Enigma fell anyway, for reasons that rhyme with everything above:

- **The reflector created a structural weakness**: because the signal passed through the reflector, *no letter could ever encrypt to itself*. That single fact — "this position can't be E" for every position where the ciphertext letter is E — eliminates a huge fraction of candidate settings for free.
- **Known-plaintext attacks ("cribs"):** German operators sent predictable messages — daily weather reports, standardized sign-offs. If cryptanalysts at Bletchley Park (led in large part by Alan Turing) could guess a stretch of plaintext, they could test candidate rotor settings against it mechanically, using an electromechanical device called the **Bombe** to search the reduced space fast.
- **Operator error:** reusing message keys, choosing predictable settings (a human operator's "random" 3-letter rotor start disproportionately turned out to be things like a girlfriend's initials) — the mathematically strong system was undermined by the humans operating it.

Notice the pattern: the machine's *raw key space* was never the weak point. The weak points were structural leakage (no letter maps to itself), predictable inputs (cribs), and human procedure. This is still exactly how modern systems get broken — not by brute-forcing AES-256, but by implementation bugs, predictable "random" values, and operators who reuse things they were told never to reuse.

---

## 1.7 Kerckhoffs's Principle — The Thesis of This Entire Course

In 1883, Auguste Kerckhoffs articulated the rule that every design in the rest of this course obeys:

> **A cryptosystem should be secure even if everything about the system, except the key, is public knowledge.**

Every classical cipher in this chapter violated this in spirit if not letter — their designers hoped attackers wouldn't figure out the *method* (shift cipher, substitution table, Vigenère structure). Once the method was known, only brute force stood between the attacker and the plaintext — and we showed in §1.1–§1.5 that "the method is public but the key space is hard to search" is a much stronger claim than "nobody knows our method," precisely because secrets about *methods* leak (through espionage, reverse engineering, or reinvention) far more easily than secrets about a single numeric *key* do.

**Why this matters for the rest of the course:** AES's algorithm is public — you can read the exact byte operations in a PDF today. RSA's algorithm is public. TLS's protocol is public, published as an RFC anyone can download. Every cipher from Chapter 3 onward is designed under the assumption that **the attacker already knows exactly how it works**, and security must come entirely from the secrecy of a short key. This is not a weaker guarantee than "keep the algorithm secret" — it's a *stronger* one, because it's a guarantee that survives the algorithm becoming public, which — as this chapter demonstrated three separate times — it eventually always does.

This is also why "I invented my own encryption scheme and kept the algorithm secret" is the single biggest red flag in professional cryptography: an algorithm that has not been public for years, attacked by thousands of researchers, and survived, has not earned any trust at all. It has simply not been tested yet. **Never roll your own crypto** is not a cliché — it's Kerckhoffs's principle plus the historical record of this entire chapter, compressed into four words.

---

## Section Challenge

---

**Q1.** A substitution cipher (26! key space) is used to encrypt a message that turns out to be only 12 letters long, with no repeated letters. Frequency analysis, as described in §1.3, is nearly useless here. Why — and does that mean the cipher is secure for short messages?

<details>
<summary>Answer</summary>

Frequency analysis is a **statistical** attack — it works by comparing observed letter counts to expected English-language frequencies, and statistical signals need enough samples to be reliable. With only 12 letters, there isn't enough data for any letter's count to stand out from noise; a message this short might have zero copies of `E` at all despite `E` being "common," purely by chance.

**This does not mean the cipher is secure.** It means *this specific attack* doesn't apply well at this length. Other attacks remain fully available:
- If the attacker has *any* crib (a guess at part of the plaintext — e.g., they suspect the message says "SEND HELP" or starts with a standard greeting), they can test that guess directly against the ciphertext, recovering several key mappings at once regardless of message length.
- If the same key is reused for a second, longer message (a realistic scenario — nobody generates a new 26!-permutation key per message), frequency analysis becomes effective again on the combined ciphertext.
- Small message spaces (e.g., if the plaintext is known to be one of only a few possible short commands) can be broken by exhaustively encrypting every candidate plaintext and checking which one matches — no key search needed at all.

**The lesson:** "this specific attack doesn't apply" is not the same claim as "this cipher is secure." Security has to hold against *every* attack an adversary might try, not just the one you happened to test. This is why modern cryptography insists on formal security definitions and proofs (starting in Chapter 2) rather than "well, nobody's broken it in the ways we tried."
</details>

---

**Q2.** You intercept two Vigenère ciphertexts that you know were encrypted with the *same* key. You don't know the key or its length. Sketch an attack that doesn't require finding repeated trigrams within a single ciphertext (Kasiski examination). What property of the *two* ciphertexts can you exploit instead?

<details>
<summary>Answer</summary>

**The exploit: XOR (or modular subtraction) of the two ciphertexts cancels the key.**

If $c_1[i] = (p_1[i] + k[i \bmod L]) \bmod 26$ and $c_2[i] = (p_2[i] + k[i \bmod L]) \bmod 26$ for the *same* key stream $k$, then:

$$c_1[i] - c_2[i] \equiv p_1[i] - p_2[i] \pmod{26}$$

The key has completely cancelled out. You're left with the difference between two *plaintexts* — no key material at all. This is now a much easier problem: differences between two natural-language texts are highly non-random (both are English, so their letter-difference stream has statistical structure — e.g., common word patterns, spaces if preserved, or if you have a crib for either plaintext you can recover stretches of the other directly by subtracting).

**Why this matters beyond Vigenère:** this exact attack — "if the same keystream is used twice, XOR the two ciphertexts and the key vanishes" — is the modern **two-time pad attack**, and it is *the* reason Chapter 2 will insist, with a full proof, that a one-time pad key must never, under any circumstances, be reused. The mechanism is identical whether the alphabet is 26 letters added mod 26 or bits XORed mod 2. "Never reuse a key/keystream" is not a Vigenère-specific rule — it is a structural law that reappears at every layer of cryptography covered in this course, including AES-CTR/GCM nonces (Chapter 4).
</details>

---

**Q3.** Kerckhoffs's principle says security should not depend on the algorithm being secret. Play devil's advocate: isn't *some* secrecy about the system still valuable? Why don't real systems publish absolutely everything (e.g., private keys, internal firewall rules)?

<details>
<summary>Answer</summary>

Kerckhoffs's principle draws a specific line, and it's important not to over-generalize it into "secrecy is worthless." The principle says the **algorithm/design** should be assumed public — because algorithm secrecy is fragile (reverse-engineerable, leak-prone, and can't be re-issued if compromised) — but it explicitly still requires **the key** to be secret, and the key is exactly the thing designed to be easy to keep secret and easy to replace if compromised.

Two different things are being confused if you conflate them:

- **"Security through obscurity" (what Kerckhoffs warns against):** relying on an attacker *not knowing your algorithm/method* as your primary defense. Fragile because the design leaks (employee turnover, reverse engineering, published papers, insider threats) and once it does, security collapses entirely with no recovery path.
- **Legitimate operational secrecy (not what Kerckhoffs warns against):** keeping *keys*, *credentials*, and *specific configuration values* secret. This is exactly what every cryptosystem in this course still requires — RSA's private key, TLS's session keys, a firewall's specific IP allowlist. These are secrets, but they are *designed to be secret* and *designed to be rotated/replaced* if exposed, unlike an algorithm.

The practical rule of thumb: **hiding *what* you're protecting with (algorithm, protocol, general architecture) buys you nothing durable and actively creates false confidence; hiding *the specific key/credential* is the entire point of the system and should absolutely be done.** A firewall's rule *engine* (iptables, its general logic) being public is fine; the specific list of what's allowed through *for a given deployment* still benefits from not being handed to an attacker on a silver platter — not because obscurity is security, but because it removes free reconnaissance information, one layer among several (defense in depth, Chapter 13) rather than the sole line of defense.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| Caesar cipher | Key space = 26; broken by brute force alone |
| Substitution cipher | Key space = 26! ≈ 4×10²⁶; broken by frequency analysis despite the huge key space |
| Frequency analysis | Attacks the *statistical structure of language*, not the key — large key space is not sufficient security |
| Vigenère cipher | Polyalphabetic substitution defeats simple frequency analysis by varying the mapping with position |
| Kasiski examination | Repeated ciphertext sequences reveal the key *length*; reduces Vigenère to several Caesar ciphers |
| Two-time pad attack | Reusing a keystream lets an attacker cancel it out by combining two ciphertexts — the root cause reappears at every layer of crypto |
| Enigma | Enormous key space (~10²³) still fell to structural leakage (no self-mapping), known-plaintext cribs, and operator error |
| Kerckhoffs's principle | Security must depend only on key secrecy, never on algorithm secrecy — the foundation of every cipher in the rest of this course |

**Where we go next:** Every cipher in this chapter was eventually broken because none of them had a *proof* of security — they were "secure" only until someone found the attack. Chapter 2 introduces a cipher that can be mathematically *proven* unbreakable, and derives exactly how strict the conditions for that proof are — conditions so strict that satisfying them in practice is nearly impossible. That gap between "provably unbreakable" and "usable in practice" is what the rest of the course exists to close.

---

*Next: [02 — Perfect Secrecy & the One-Time Pad](02_Perfect_Secrecy_One_Time_Pad.md)*
