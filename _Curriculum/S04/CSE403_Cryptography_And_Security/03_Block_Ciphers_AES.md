# Chapter 3 — Block Ciphers & AES

> "The one-time pad is unbreakable and unusable. This chapter builds the thing everyone actually uses instead — a cipher that doesn't need to *be* random, only to be indistinguishable from random to anyone who doesn't hold the key."

---

## The Problem

Chapter 2 ended at a mathematical wall. Shannon proved that perfect secrecy requires a key at least as long as the message, used exactly once. That's not a limitation of the one-time pad's *design* — it's a limitation of *any* cipher that achieves perfect secrecy. So encrypting a gigabyte with perfect secrecy needs a gigabyte of true randomness, shared in advance, over a channel already as secure as the one you're trying to build. Nobody has that.

And yet every laptop on Earth encrypts gigabytes of traffic per day using a key that's 128 or 256 *bits* — sixteen or thirty-two bytes — reused across billions of messages. By Shannon's theorem, this is **provably not perfectly secret.** So what is it, and why do banks trust it with actual money?

Here's the reframing that makes it possible: instead of asking for a ciphertext that gives an attacker *zero* information (impossible without a message-length key), ask for a ciphertext that gives an attacker *no information they can actually extract* — not because the information isn't there in some abstract sense, but because extracting it would require more computation than exists in any practical attacker's budget. Trade an unconditional guarantee for a conditional one, and in exchange, get to use a short, reusable key.

This chapter builds the object that does this: a **block cipher**. Concretely, it derives the two competing structural ideas history produced for building one — the Feistel network and the substitution-permutation network — and then builds AES, the substitution-permutation network the entire world settled on, piece by piece, deriving why each of its four layer types exists.

---

## 3.1 From Perfect Secrecy to Computational Security: PRPs

Chapter 2's one-time pad had a specific mathematical shape: $c = m \oplus k$, where $k$ was as long as $m$, uniformly random, and used once. Strip away the "as long as $m$" and "used once" requirements — what's left is a much more attractive shape: a keyed function $E_k$ that takes a plaintext block and produces a ciphertext block, where $E_k$ is a **permutation** for every fixed key $k$ (every plaintext maps to a unique ciphertext, so decryption $D_k = E_k^{-1}$ is well-defined).

**The property we actually want:** for a randomly chosen key $k$ (kept secret), no attacker who can run a *realistic* amount of computation — say, up to $2^{80}$ or $2^{128}$ operations, nowhere near "unlimited" — can distinguish $E_k$ from a *genuinely* random permutation on the same set of blocks, even when given a black box that lets them encrypt and decrypt chosen blocks under the hidden key. This is called a **pseudorandom permutation (PRP)**. It is deliberately *not* the same claim the one-time pad made. The one-time pad's ciphertext carried literally zero bits of information about the plaintext, against *any* attacker, forever. A PRP's ciphertext might, in principle, carry some information extractable by an attacker with unbounded computing power — but no attacker anyone will ever actually field can get at it. That's the entire trade Chapter 2's closing section previewed: give up the unconditional guarantee, keep a short reusable key.

**A quick but important distinction: PRP vs. PRF.** A block cipher, because it must be decryptable, has to be a *permutation* for each key — invertible, same-size input and output. That's a PRP. A weaker, more general object called a **pseudorandom function (PRF)** drops the invertibility requirement entirely — it just has to *look* random to a bounded attacker who can only query it in the forward direction, with no promise it's even a bijection. Every PRP is automatically usable as a PRF (you can always just not use the inverse), but not every PRF is a PRP. Why mention this now, before it's needed? Because Chapter 4 builds a mode of operation (CTR) that uses AES *only* in the forward, encrypt direction — never decrypts a block at all — which means CTR mode's security only ever needs AES to behave like a PRF, a strictly weaker ask than the full PRP guarantee AES actually provides. Keep this distinction in your pocket; it's the reason Chapter 4 can turn a block cipher into something that behaves like a stream cipher.

This immediately raises the real engineering question of this chapter: **how do you actually build a function that behaves like a random permutation, from a short key, using only a fixed, public, efficiently computable algorithm (Kerckhoffs, Chapter 1)?** History converged on two structurally different answers, both built by chaining together a "round function" many times:

- **Feistel networks** — used by DES (adopted as FIPS-46 in 1977, developed by IBM with NSA review, a 16-round design with a 56-bit key that is no longer secure today simply because 56 bits is brute-forceable with modern hardware — a key-*length* failure, not a structural one, and orthogonal to this chapter's argument).
- **Substitution-permutation networks (SPNs)** — used by AES (selected by NIST in 2000 from a worldwide open competition, standardized as FIPS-197 in November 2001), the cipher this chapter is building toward.

Both are worth deriving, because the *contrast between them* is exactly what explains why AES's specific structure looks the way it does.

---

## 3.2 The Feistel Insight: Invertibility Without an Invertible Round Function

Here's the design problem a block cipher faces: you want each round to scramble the block using some function $F$ that's as cryptographically nasty and nonlinear as possible — the nastier and more nonlinear, the harder to reverse-engineer. But you *also* need the whole cipher to be invertible, because the legitimate receiver has to decrypt. Nonlinear, nasty functions are typically hard to *design* to be invertible. Do you have to solve both problems — "make $F$ strong" and "make $F$ invertible" — at once?

**The Feistel trick says no.** Split the block into two halves, $L$ and $R$. Define one round as:

$$L', R' = R,\ \ L \oplus F(R, k)$$

Watch what happens when you try to undo it. You're given $(L', R')$ and the round key $k$. Since $R' = L \oplus F(R,k)$ and $L' = R$, you can substitute directly:

$$R = L' \qquad L = R' \oplus F(L', k) = R' \oplus F(R, k)$$

Both quantities on the right — $L'$, $R'$, and $k$ — are things you already have. **You never need to invert $F$ at all.** You *recompute* $F(R,k)$ (using $R = L'$, which you now have) and XOR it against $R'$ to peel $L$ back out, exploiting only the fact that XOR undoes itself ($x \oplus y \oplus y = x$, the same fact that made the one-time pad's decryption formula work in Chapter 2). $F$ itself is never run "backwards" — it's run *forwards* again, on an input you already know, in both encryption and decryption.

**This means $F$ is allowed to be a non-invertible mess**, and the round is still perfectly invertible. That's the entire insight, and it's worth confirming on a genuinely non-invertible $F$ rather than taking it on faith.

**Verified example.** Take the deliberately non-bijective round function $F(x,\text{key}) = ((x \ll 3) \oplus (x \gg 2) \oplus \text{key} \oplus x^2) \bmod 256$. First, confirm it really isn't invertible: fixing key `0x5a` and running every input `0`–`255` through it,

```
Distinct outputs: 182 out of 256 possible inputs
Example collisions:
   F(2, 0x5a)  = F(21, 0x5a) = 78
   F(7, 0x5a)  = F(32, 0x5a) = 82
   F(35, 0x5a) = F(54, 0x5a) = 131
Total collision pairs found: 74
```

Confirmed: given only the output `78` and the key `0x5a`, there is no way to tell whether the input was `2` or `21` — $F$ throws away information and cannot be undone on its own. Now run it inside a 6-round Feistel network anyway, on $L_0=$`0x3c`, $R_0=$`0xa5`, with round keys `[0x11, 0x9f, 0x42, 0xc7, 0x08, 0x5d]`:

| Round | key | $F(R_{\text{prev}})$ | $L_i$ | $R_i$ |
|---|---|---|---|---|
| 0 (start) | — | — | `0x3c` | `0xa5` |
| 1 | `0x11` | `0x49` | `0xa5` | `0x75` |
| 2 | `0x9f` | `0x53` | `0x75` | `0xf6` |
| 3 | `0x42` | `0xab` | `0xf6` | `0xde` |
| 4 | `0xc7` | `0x84` | `0xde` | `0x72` |
| 5 | `0x08` | `0x40` | `0x72` | `0x9e` |
| 6 | `0x5d` | `0x0e` | `0x9e` | `0x7c` |

Ciphertext: $(L_6, R_6) = ($`0x9e`, `0x7c`$)$. Running the decryption formula derived above — $R_{i-1} = L_i$, $L_{i-1} = R_i \oplus F(L_i, k_i)$ — with the round keys applied in **reverse order**, starting from `(0x9e, 0x7c)`:

```
undo key=0x5d -> (0x72, 0x9e)
undo key=0x08 -> (0xde, 0x72)
undo key=0xc7 -> (0xf6, 0xde)
undo key=0x42 -> (0x75, 0xf6)
undo key=0x9f -> (0xa5, 0x75)
undo key=0x11 -> (0x3c, 0xa5)   <- matches the original (L0, R0) exactly
```

Recovered exactly. This isn't a lucky draw — the same construction was run over **2000 random trials** (random 16-bit plaintexts, random sets of 6 round keys, the same deliberately non-injective $F$): **0 failures out of 2000.** Every single trial decrypted correctly, despite $F$ being non-invertible on its own in every single trial.

**The lesson:** the Feistel structure decouples "the round function must be strong" from "the round function must be invertible" completely. A cipher designer is free to make $F$ as ugly, nonlinear, and lossy as they want for security purposes, without worrying for one second about whether that specific $F$ can be undone — the *structure* guarantees invertibility regardless. This is genuinely elegant, and it's why Feistel networks were the dominant block cipher structure for decades (DES, and later Blowfish, Twofish, and others).

---

## 3.3 AES Chooses a Different Path: Substitution-Permutation Networks

When NIST ran the open, public competition to replace DES, the winning submission — Rijndael, designed by Joan Daemen and Vincent Rijmen, which the world now calls AES — is **not** a Feistel network. It's a **substitution-permutation network (SPN)**, and the difference is structural, not cosmetic.

In a Feistel round, only *half* the block ($R$) is fed through the round function; the other half ($L$) is untouched that round, just relocated. That's precisely the trick that let $F$ be non-invertible — the untouched half is what lets you "recompute and cancel" during decryption.

An SPN has no untouched half. **Every round transforms the entire block**, through a stack of layers applied in sequence. This forces a much stricter requirement, worth deriving explicitly: since there's no half-block held in reserve to reconstruct anything from, **every single layer of an SPN round must, by itself, be invertible.** If any one layer lost information — mapped two different states to the same output, the way this chapter's toy $F$ did — decryption would hit a wall for at least some inputs, with no structural trick available to route around it. Every layer has to pull its own weight *and* be reversible on its own.

AES's 128-bit block (16 bytes) is organized, per the standard, as a $4\times4$ grid filled **column by column** — byte 0 goes to row 0/col 0, byte 1 to row 1/col 0, byte 2 to row 2/col 0, byte 3 to row 3/col 0, byte 4 to row 0/col 1, and so on:

```
byte index:        state grid (row, col):
 0  4  8 12          [ 0][ 4][ 8][12]
 1  5  9 13    -->    [ 1][ 5][ 9][13]
 2  6 10 14           [ 2][ 6][10][14]
 3  7 11 15           [ 3][ 7][11][15]
```

This layout is what makes "column" and "row" meaningful for the next two layers — ShiftRows operates on the horizontal rows of this grid, MixColumns on the vertical columns. AES's round (repeated with minor variation for 10, 12, or 14 rounds depending on key size) is exactly four such layers, applied to the entire grid every round:

1. **SubBytes** — the only nonlinear layer.
2. **ShiftRows** — permutes bytes between columns.
3. **MixColumns** — mixes bytes within a column (skipped in the final round).
4. **AddRoundKey** — XORs in the round's slice of key material.

The next four sections derive why each one earns its place, and why the round has to look like *this specific sequence* and not some other one.

---

## 3.4 SubBytes — The Only Nonlinear Step, and Why That's Non-Negotiable

**Why does a block cipher need *any* nonlinear step at all?** Concretely: suppose, hypothetically, a cipher's every layer were **linear** (or affine) over $\mathrm{GF}(2)$ — every operation is matrix multiplication and XOR, nothing else, no matter how many rounds. Composing linear maps produces another linear map; composing affine maps produces another affine map. That's not a cryptographic claim, it's a fact about linear algebra, and it has a brutal consequence: **the entire multi-round cipher, no matter how many rounds, collapses algebraically into a single equivalent linear function of the plaintext and key.** If an attacker can write down that equivalent function, recovering the key from even a *single* known plaintext/ciphertext pair becomes a matrix-inversion problem — not a search problem.

This is worth confirming for real rather than asserting.

**Verified toy cipher (pure linear, no S-box).** Build a 3-round cipher on 8-bit blocks: a fixed public invertible $8\times8$ matrix $A$ over $\mathrm{GF}(2)$ provides the "mixing," and a public linear key schedule (fixed matrices $B_0, B_1, B_2$) derives three round keys from an 8-bit master key $K$: $K_0 = B_0K,\ K_1=B_1K,\ K_2=B_2K$. Each round is $S \mapsto A\cdot S \oplus K_i$. Expanding all three rounds symbolically:

$$C = A\big(A(A\cdot P \oplus K_0) \oplus K_1\big) \oplus K_2 = A^3P \ \oplus\ \underbrace{(A^2B_0 \oplus AB_1 \oplus B_2)}_{M}\,K$$

Every term is linear in $P$ and $K$ — three rounds of mixing collapsed into **one** matrix $A^3$ acting on $P$ and **one** matrix $M$ acting on $K$, XORed together. That collapse is exactly the danger: if an attacker knows $A$, $B_0,B_1,B_2$ (Kerckhoffs — they know the algorithm), and observes *one* plaintext/ciphertext pair, they can solve $M K = C \oplus A^3P$ for $K$ directly, by inverting $M$.

Running it: with a randomly generated (invertible) $A, B_0, B_1, B_2$, secret key $K=$`0xce`, and one known pair $P=$`0xc2` $\to C=$`0x7d`:

```
Attacker computes M^-1 * (C xor A^3*P) = 0xce
Recovered key matches secret key: True
Using recovered key to predict a SECOND, unrelated ciphertext: predicted 0xab, actual 0xab -> match
```

One known plaintext, one matrix inversion, full key recovery — confirmed against an independent second ciphertext so it isn't a fluke. **This holds regardless of how many linear rounds you add**, because the composition of any number of linear rounds is still just one linear map.

**Now inject a fixed nonlinear S-box** (an arbitrary byte permutation, not derivable from any matrix) into each round: $S \mapsto \text{SBox}(A \cdot S \oplus K_i)$. The exact same attacker, running the exact same linear-algebra attack (computing $M^{-1}(C \oplus A^3P)$, pretending the cipher is still linear):

```
Naive linear-algebra attack computes: K_guess = 0x77
Does K_guess equal the real secret key 0xce?  False
Using K_guess to predict a second ciphertext:  predicted 0xb8, actual 0xfe -> NO match
```

The algebraic shortcut is simply gone — there's no matrix $M$ that relates $C$ to $K$ anymore, because $\text{SBox}(\cdot)$ can't be pulled apart into "linear in $K$" and "linear in $P$" pieces. The attacker is thrown back onto brute force: trying all 256 possible 8-bit keys against the one known pair does find the real key (`[206]` = `0xce`, uniquely) — but notice *why* that's no longer alarming: with AES's actual 128-bit keys, "throw the attacker back onto brute force" means throwing them at $2^{128}$ candidates, not 256. **Nonlinearity's job isn't to defeat brute force — key length alone does that. Its job is to remove the linear-algebra shortcut that would otherwise let an attacker skip brute force entirely, regardless of key length.**

This is precisely why **SubBytes** exists: a fixed, public, nonlinear substitution table — 256 entries, one output byte for every possible input byte, applied independently to each of the 16 bytes of the state. (AES's real S-box is constructed from multiplicative inversion in $\mathrm{GF}(2^8)$ composed with a fixed affine map, chosen specifically to minimize linear and differential correlations between input and output bits; the field-arithmetic construction itself is out of scope here, but the *reason* it must be nonlinear is exactly the reason just derived.) SubBytes is the **only** nonlinear operation anywhere in AES — every other layer (ShiftRows, MixColumns, AddRoundKey) is linear/affine over $\mathrm{GF}(2)$. All of AES's resistance to the linear-algebra shortcut rides on this one layer.

---

## 3.5 ShiftRows — Diffusion Across Columns

SubBytes alone has a blind spot: it transforms each of the 16 bytes of the state **independently** — byte 3 of the state never influences byte 7, no matter how many rounds of SubBytes-only processing you apply. A change in one input byte would only ever affect that same byte position downstream. That's not diffusion; a per-byte substitution cipher, no matter how nonlinear each individual substitution is, is still just 16 parallel, structurally isolated single-byte ciphers — a shape that should feel familiar from Chapter 1's substitution cipher, vulnerable to essentially the same class of attack, just repeated 16 times.

AES's state is a $4\times4$ grid of bytes. **MixColumns** (next section) mixes bytes *within* a column — but on its own that would only ever mix the 4 bytes that started in the same column; columns would stay permanently isolated from each other, effectively four independent 32-bit sub-ciphers running side by side forever, regardless of round count.

**ShiftRows fixes exactly this gap, structurally**: row $r$ of the state is cyclically shifted left by $r$ positions (row 0 untouched, row 1 shifted by 1, row 2 by 2, row 3 by 3). This is a pure relocation — no bytes are combined or changed, they just move to different *columns*. Its entire purpose is to feed MixColumns, next round, bytes that originally came from *different* columns.

**Verified diffusion trace.** Encrypt two plaintexts differing in a single bit (byte 0, one bit flipped) under the same AES-128 key, and count how many of the 16 state bytes differ after each stage:

```
after AddRoundKey (whitening) :  1 / 16 bytes differ
after round 1                 :  4 / 16 bytes differ
after round 2                 : 16 / 16 bytes differ
after round 3                 : 16 / 16 bytes differ
... (stays 16/16 through round 10)
```

This is the diffusion story made concrete: the 1 differing byte lives in some column; MixColumns (round 1) spreads it to all 4 bytes of *that same column* (still only 4/16 different overall) — and then ShiftRows at the *start* of round 2 relocates those 4 differing bytes into **four different columns**, so round 2's MixColumns spreads each of them across its own column, and all 16 bytes now differ. Two rounds is enough for a single input bit to influence every output byte at least once. ShiftRows is the layer that makes that cross-column handoff possible; without it, that second row of numbers would read `4 / 16` forever.

---

## 3.6 MixColumns — Diffusion Within a Column

Where ShiftRows relocates bytes *between* columns without combining them, **MixColumns does the combining**: it treats each column (4 bytes) as a vector and multiplies it by a fixed, public, invertible $4\times4$ matrix —

$$\begin{pmatrix}2&3&1&1\\1&2&3&1\\1&1&2&3\\3&1&1&2\end{pmatrix}$$

— so that every output byte of a column is a combination of *all four* input bytes of that column, not just one. Combined with ShiftRows feeding it bytes from every other column in alternating rounds, this is the mechanism actually responsible for the 4→16 spread measured above.

**Why $\mathrm{GF}(2^8)$ arithmetic and not ordinary integer arithmetic?** Two hard requirements collide here. First, every layer of an SPN must be invertible (§3.3) — but "multiply by 2" in ordinary arithmetic mod 256 is *not* invertible (half of the 256 byte values are even, and multiplication by 2 collapses distinct inputs to the same output, exactly the collision problem from §3.2's non-invertible-$F$ discussion, which is fine for a *Feistel* round function but fatal for an SPN layer that has no structural trick to compensate). Second, every other operation in AES combines bytes via XOR, and for the algebra to compose cleanly, "multiplication" needs to interact with XOR the way ordinary multiplication interacts with ordinary addition. $\mathrm{GF}(2^8)$ — the finite field of 256 elements, with addition defined as XOR and multiplication defined modulo a fixed irreducible polynomial ($x^8+x^4+x^3+x+1$, i.e. `0x11B`) — satisfies both: it's a genuine field, so *every nonzero byte has a multiplicative inverse* (multiplication is always invertible), and its addition operation is literally XOR, matching the rest of the cipher. The specific matrix above was chosen (a maximum-distance-separable matrix, a coding-theory property that guarantees the strongest possible mixing for a matrix of that size) to be invertible over this field while maximizing diffusion. The full multiplication-table construction is genuinely out of scope for this course — what matters is *why* a field had to be invented for this step at all, which is the invertibility-plus-XOR-compatibility argument just given, not the specific field chosen.

(This chapter's verification implementation includes a real `GF(2^8)` multiply-with-reduction routine used inside a from-scratch AES-128 implementation — see §3.9's worked example — so this isn't asserted from a diagram; it's the actual arithmetic that produced the verified ciphertext below.)

---

## 3.7 AddRoundKey — Where the Key Actually Enters

The first three layers — SubBytes, ShiftRows, MixColumns — are all **fixed public functions with zero dependence on the secret key.** Anyone, including an attacker, can compute them exactly, for any input, without knowing anything secret. **AddRoundKey is the only layer where the key does anything at all**: it XORs the entire 128-bit state against a 128-bit slice of key material (a "round key," derived in §3.9) — once *before* round 1 even starts (called **key whitening**), and once at the end of every round thereafter.

Two things worth deriving rather than asserting:

**Why whiten before round 1, rather than letting the plaintext go straight into SubBytes?** SubBytes is a fixed public lookup table. If the very first operation applied to the ciphertext pipeline were SubBytes with no keyed step first, then for a *known* plaintext, an attacker would know *exactly* what's being fed into that first public S-box lookup — the S-box's output would be fully attacker-computable, contributing nothing secret at that point. Whitening ensures that even the very first S-box lookup of round 1 is already operating on `plaintext XOR (secret key material)`, not on the plaintext directly — so no layer of the cipher, from the first byte onward, is ever operating on purely attacker-known input.

**Why re-inject key material every single round, rather than once at the start?** SubBytes, ShiftRows, and MixColumns are all public and all invertible (§3.3 required this). If the key were only XORed in once, an attacker facing the full 10-round cipher could simply *undo* every public layer — invert MixColumns, invert ShiftRows, invert SubBytes, all computable with no secret knowledge — collapsing the entire 10-round cascade of keyless public math back down to something equivalent to a single round wrapped around one key XOR. Re-injecting key material after every round means an attacker attempting that same "peel off the public layers" strategy runs straight into a fresh, independent chunk of secret key material at every single step, not just at the boundary.

---

## 3.8 Confusion + Diffusion — Shannon's 1949 Blueprint

Chapter 2 opened with Claude Shannon's 1949 paper, *Communication Theory of Secrecy Systems* — the paper that defined perfect secrecy and proved the one-time pad achieves it. The same paper also laid out a design principle for ciphers that *can't* achieve perfect secrecy but still need to be as strong as possible: good ciphers should combine

- **confusion** — make the relationship between key and ciphertext as complex and nonlinear as possible, so that even with a lot of ciphertext, statistical relationships to the key are hard to pin down (this is SubBytes's job, and §3.4 showed concretely what happens without it: the relationship collapses to something linear-algebra-solvable), and
- **diffusion** — spread the influence of every plaintext bit and every key bit over as much of the ciphertext as possible, so that no small chunk of ciphertext depends on only a small chunk of the input (ShiftRows + MixColumns's job, §3.5–§3.6).

AES's four-layer round is a direct, literal implementation of this 1949 blueprint: SubBytes is confusion, ShiftRows+MixColumns is diffusion, AddRoundKey is where the secret actually gets folded in so that both properties are *keyed* rather than public. The verified avalanche measurement from §3.9's full AES run makes this concrete: flipping a **single bit** of the plaintext (with everything else, including the key, held fixed) changed **62 of the 128 output bits** — 48%, close to the theoretical ideal of 50% ("avalanche effect": roughly half the output bits should flip for *any* single input bit flipped, plaintext or key, if diffusion has fully saturated). One flipped input bit influencing essentially half of a 128-bit output, after just 10 rounds, is confusion and diffusion compounding across rounds exactly as Shannon's principle describes.

---

## 3.9 The Key Schedule

AES doesn't reuse one 128-bit key for every round. It expands a single master key into a distinct 128-bit **round key** for each of the 11 AddRoundKey applications AES-128 performs (1 initial whitening key + 10 per-round keys), using a fixed, public, deterministic algorithm called the **key schedule**.

**Why not just reuse the same 128 bits every round?** This is a direct callback to Chapter 1's Kasiski lesson: *any* literal repetition of key material across positions is a structural crack an attacker can potentially pry open (§1.5, §1.6's Enigma discussion, and Chapter 2's two-time-pad attack are three separate instances of exactly this failure mode). Diversifying the key material every round, even though it's all *derived* from the same underlying entropy, avoids handing an attacker any exploitable relationship between what round 3 and round 7 are XORing in.

**The mechanism, at the level this course needs (not byte-by-byte):** the 128-bit key is treated as four 4-byte "words." New words are generated one at a time: for most positions, a new word is just the XOR of the word 4 positions back and the immediately preceding word. But at every 4th position, before that XOR, the preceding word is first rotated by one byte (**RotWord**), then every byte in it is passed through the *same* SubBytes S-box used in the main cipher (**SubWord**), and then XORed against a round constant (**Rcon**) — a fixed, public sequence that is *different for every round*, specifically so that no two rounds' key-generation steps are structurally identical to each other, closing off the exact kind of cross-round symmetry Kasiski-style analysis looks for. This process repeats until enough words exist to form all 11 round keys (AES-192 and AES-256 use a slightly larger $N_k$ and a couple of extra scheduling details, but the same shape). The three AES variants differ only in how much master-key material feeds the schedule and how many round keys get generated from it:

| Variant | Master key words ($N_k$) | Rounds ($N_r$) | Round keys generated |
|---|---|---|---|
| AES-128 | 4 (128 bits) | 10 | 11 |
| AES-192 | 6 (192 bits) | 12 | 13 |
| AES-256 | 8 (256 bits) | 14 | 15 |

Every row still XORs in exactly one 128-bit round key per AddRoundKey application — a bigger master key doesn't mean a bigger *block*, only more schedule material and (per §3.10) more rounds to keep an equivalent safety margin at that key size.

**Verified worked example**, generated from the real key-schedule implementation used for the AES run below (master key `000102030405060708090a0b0c0d0e0f`):

```
Round key 0  (= original master key):  000102030405060708090a0b0c0d0e0f
Round key 1:                           d6aa74fdd2af72fadaa678f1d6ab76fe
Round key 10 (final):                  13111d7fe3944a17f307a78b4d2b30c5
```

Round key 0 is *literally* the raw master key (which is exactly right — it's what gets whitened into the plaintext before round 1, per §3.7). Every subsequent round key is fully **determined** by that same 128 bits — no new entropy enters anywhere in this process — yet looks statistically unrelated to it. This is the key schedule acting as a deterministic expansion function, the same conceptual role a PRG plays in Chapter 2's closing discussion: a short secret seed, deterministically stretched into more material, with the stretching adding *apparent* randomness but never adding *actual* entropy. (Section Challenge Q3 below returns to exactly this point.)

**Full worked verification, checked against the official published test vector.** A complete from-scratch AES-128 implementation (S-box, key schedule, all four layers, real $\mathrm{GF}(2^8)$ arithmetic) was run against FIPS-197's own Appendix C.1 known-answer test:

```
Key:                          000102030405060708090a0b0c0d0e0f
Plaintext:                    00112233445566778899aabbccddeeff
Computed ciphertext:          69c4e0d86a7b0430d8cdb78070b4c55a
Official FIPS-197 ciphertext: 69c4e0d86a7b0430d8cdb78070b4c55a
MATCH: True
```

This isn't a hand-simulated trace — it's a real, independently-written implementation of every layer derived in this chapter, checked bit-for-bit against the standard's own published answer.

---

## 3.10 Why 10/12/14 Rounds — Margin, Not Minimum

AES-128, AES-192, and AES-256 use 10, 12, and 14 rounds respectively. It's tempting to assume more rounds are needed for bigger keys because the bigger key "needs more mixing to search through" — but that reasoning doesn't hold up, and it's worth deriving why.

**Round count has nothing to do with defeating brute force.** Brute-forcing a 128-bit key versus a 256-bit key are already separated by a factor of $2^{128}$ — an incomprehensibly large gap that no amount of round-count tweaking could meaningfully add to or subtract from. If brute force were the only threat, round count wouldn't need to track key size at all.

**What round count actually defends against is cryptanalytic shortcuts** — structured ways of exploiting statistical biases across rounds to recover key bits using far fewer than $2^{n}$ operations, which, if a cipher had too few rounds, could beat brute force outright. Two of the best-known general techniques give the flavor: **differential cryptanalysis** tracks a chosen *difference* between two plaintexts (e.g., XOR them together) and looks for output-difference patterns that occur with higher-than-random probability as that difference propagates through the S-box and mixing layers round by round; **linear cryptanalysis** instead looks for *linear approximations* of the nonlinear S-box (some XOR of specific input and output bits that holds slightly more or less than half the time, rather than exactly half) and chains many such approximations across rounds into a statistical bias detectable over enough samples. Both are exactly the kind of "attack the structure, not the key space" move Chapter 1 kept surfacing — frequency analysis attacked language structure, Kasiski attacked key repetition, the Enigma reflector attacked machine structure, and in every case the raw key space (Enigma's was ~$10^{23}$) was never the weak point — just formalized here for bit-level ciphers instead of alphabets. Every added round gives both techniques one more layer of confusion and diffusion to fight through before their statistical bias decays into uselessness. AES's round count exists specifically to close off the modern, mathematical version of that same class of shortcut.

The design logic: cryptanalysts publish attacks against **reduced-round** variants of AES (6 rounds, 7 rounds, and so on) — showing how many rounds a given technique can "see through" before it stops providing any advantage over brute force. AES's designers chose the *full* round count to sit safely above the best such shortcut known at design time, **plus a deliberate safety margin**, so that gradual future improvements in cryptanalysis (which is exactly what happens historically — attacks on reduced-round variants creep upward over the years as research continues) are very unlikely to ever reach the full round count. No attack faster than brute force is currently known against full-round AES at any of the three key sizes.

**Why the round count still scales with key size, then, if it's not about brute force:** larger keys are chosen specifically for larger safety margins over longer time horizons and against more capable future adversaries — and one concrete, well-established reason to want that extra margin is quantum computing: Grover's algorithm gives a quadratic speedup for unstructured search, which for a symmetric cipher roughly *halves* the effective bit-security of brute force (a 128-bit key degrades toward "128/2 = 64-bit-equivalent" security against a large enough quantum attacker, while a 256-bit key only degrades toward 128-bit-equivalent — still comfortably out of reach). Choosing AES-256 is choosing a bigger cushion against a broader, longer-lived threat model. Since a bigger key also means more key-schedule structure and more material for a cryptanalyst to potentially find patterns in, AES's designers added proportionally more rounds at each larger key size too — not because search takes longer, but to preserve the *same generous margin above the best known shortcut* at every key size, not just at 128 bits.

---

## Section Challenge

---

**Q1.** Section 3.2 proved that a Feistel network is invertible *even when* the round function $F$ is non-invertible. Suppose someone takes this to the extreme and sets $F(x,\text{key}) = x$ — the round function simply ignores the key entirely. Is the resulting cipher still invertible by the Feistel structure? Is it secure?

<details>
<summary>Answer</summary>

**Still perfectly invertible — the Feistel structure doesn't care what $F$ computes, only that both parties compute the same thing.** The decryption formula derived in §3.2, $R_{i-1}=L_i,\ L_{i-1}=R_i \oplus F(L_i,k_i)$, never assumed anything about $F$'s internal structure — it only required that the *same* $F$ and the *same* key be recomputed during decryption, which works whether $F$ is a wild nonlinear mess or the trivial identity function. Verified directly: running $F(x,\text{key})=x$ through the 6-round Feistel structure and then decrypting recovers the original plaintext exactly, just as with the non-bijective $F$ from §3.2.

**But it is trivially, catastrophically insecure**, for a completely different reason than anything discussed about invertibility. If $F$ ignores its key argument, then **the key has zero effect on the ciphertext** — encrypting the same plaintext under two entirely different sets of round keys produces identical output:

```
plaintext (L0=0x3c, R0=0xa5), keys=[0x11,0x9f,0x42,0xc7,0x08,0x5d] -> ciphertext (60, 165)
plaintext (L0=0x3c, R0=0xa5), keys=[0x00,0x00,0x00,0x00,0x00,0x00] -> ciphertext (60, 165)
Identical ciphertext regardless of key: True
```

(As a side curiosity, `60,165` is `0x3c,0xa5` in decimal — for this specific degenerate $F$, six rounds happens to land back on the original input exactly, because the underlying transform $(L,R)\mapsto(R,\,L\oplus R)$ is a linear map over $\mathrm{GF}(2)$ whose repeated application has a short cycle. That's a fun artifact of this particular toy, not the point — the point is that both completely different key sets produced the *same* output as each other.)

An attacker doesn't even need to search a key space — they already know the ciphertext doesn't depend on the key at all, so there is no secret to recover in the first place.

**Why this matters beyond the toy example:** it's the exact same lesson Chapter 2 proved with Shannon's theorem, applied to a different layer of the stack. There, $|K| \geq |M|$ was *necessary but not sufficient* for perfect secrecy — you also needed the combining function to be a bijection with the right structure (Ch2 §2.4's Q3). Here, "the Feistel structure guarantees invertibility" is *necessary but nowhere near sufficient* for security — invertibility is a plumbing requirement (the legitimate receiver must be able to decrypt), completely orthogonal to whether the cipher actually hides anything. AES's SubBytes, ShiftRows, MixColumns, and AddRoundKey were each derived in this chapter specifically because invertibility alone was never the hard part.
</details>

---

**Q2.** In a Feistel network, only *half* the block is actively transformed by the round function each round — the other half just changes position. In an SPN like AES, the *entire* block goes through every layer, every round. Given this, would you expect an SPN to generally need fewer rounds than a Feistel network to achieve full diffusion (every output bit depending on every input bit)? Use the verified diffusion trace from §3.5 to support your answer.

<details>
<summary>Answer</summary>

**Yes, generally — and the mechanism is directly visible in the round function's "coverage" per round, not just a historical coincidence.**

In one Feistel round, $L' = R$ (an untouched relocation) and $R' = L \oplus F(R,k)$ (the only part of the block actually mixed that round). Only *half* the state receives new mixing each round; the untouched half has to wait for a *later* round, after enough back-and-forth swapping, before it gets touched by $F$ at all. Full diffusion — every output bit depending on every input bit — therefore tends to require accumulating effects over comparatively more rounds, because each round only actively mixes half the material.

In an SPN round, there is no untouched half: SubBytes transforms all 16 bytes, and ShiftRows+MixColumns mix *all* of them across the *entire* block structure, every single round. The verified trace from §3.5 shows exactly how fast this saturates for AES specifically:

```
after AddRoundKey (whitening) :  1 / 16 bytes differ
after round 1                 :  4 / 16 bytes differ   (spread within one column)
after round 2                 : 16 / 16 bytes differ   (spread across all columns)
```

A single flipped input bit reaches *every* byte of the state in just **two rounds**, because every layer that round is acting on the whole block simultaneously rather than half of it. That's a big part of why AES gets away with only 10 rounds for a 128-bit key while DES (Feistel, 64-bit block) used 16 rounds for a smaller, 56-bit key — although, as §3.10 stresses, byte-level diffusion saturating quickly is not the same claim as "no cryptanalytic shortcut exists below round 10"; the *margin* above the best known shortcut, not raw diffusion speed, is what ultimately sets the final round count. Diffusion speed explains why an SPN's round count is in the same ballpark as a Feistel network's despite doing more work per round, not why the exact number is 10 rather than, say, 6.
</details>

---

**Q3.** A student argues: "AES-256's key schedule expands a 256-bit master key into 15 round keys of 128 bits each — that's $15 \times 128 = 1920$ bits of round-key material in total. Doesn't that mean the cipher effectively has more than 256 bits of security, since there's so much more keyed material floating around during encryption?"

<details>
<summary>Answer</summary>

**No — the key schedule is a deterministic expansion, not a source of new randomness, so it cannot increase the security ceiling above the master key's own entropy.**

Every one of those 1920 bits of round-key material is a fixed, public function of the same 256 secret bits (§3.9) — RotWord, SubWord, XOR with public Rcon constants, all of it computable by anyone who already knows the master key, with zero additional secret input anywhere in the process. An attacker who recovers the master key can recompute *all* round keys instantly via the same public algorithm; conversely, if an attacker somehow recovered even *one* full round key, in many practical cryptanalytic settings that leaks serious structural information toward recovering the master key itself, precisely because the relationship between them is a known public formula, not an independent secret.

This is the exact same principle Chapter 2's Q1 established for PRNG-seeded pseudo-one-time-pads: a short seed, expanded by a public deterministic algorithm into a much longer stream, does not carry more entropy than the seed — expansion adds *length* and *apparent* statistical complexity, never *randomness*. The key schedule is doing precisely this: expanding a 256-bit seed into a longer keystream-like structure (round keys) for the same reason a stream cipher expands a short key into a long pseudorandom pad. The *ceiling* on how hard AES-256 is to attack via key search is 256 bits, full stop, no matter how much round-key material the schedule derives from it — because 256 bits is the total amount of secret information that ever entered the system in the first place.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| PRP (pseudorandom permutation) | Computational-security analog of the one-time pad: a keyed permutation indistinguishable from random to any *bounded* attacker, using a short, reusable key instead of a message-length one-time key |
| Feistel network | Splitting the block and computing $L',R' = R,\ L \oplus F(R,k)$ is invertible *regardless* of whether $F$ itself is invertible — verified with a deliberately non-injective $F$ across 2000 random trials, 0 failures |
| SPN vs. Feistel | Feistel transforms half the block per round (round function can be non-invertible); SPN transforms the whole block every round (every layer must individually be invertible) — AES is an SPN, not a Feistel network |
| SubBytes | AES's only nonlinear layer; verified that a purely linear multi-round cipher collapses to one matrix equation solvable from a single known plaintext, while injecting a nonlinear S-box defeats that exact attack |
| ShiftRows | Relocates bytes between columns (no mixing) — verified to be what turns "4/16 bytes differ" into "16/16 bytes differ" one round later |
| MixColumns | Mixes bytes within a column via a fixed invertible matrix over $\mathrm{GF}(2^8)$, chosen specifically because ordinary mod-256 arithmetic isn't invertible and doesn't compose with XOR |
| AddRoundKey | The only layer where the secret key enters; whitening before round 1 and re-injection every round both close off "strip away the public, keyless, invertible layers" strategies |
| Confusion + diffusion | Shannon's 1949 design blueprint (same paper as Chapter 2's perfect-secrecy proof) — SubBytes is confusion, ShiftRows+MixColumns is diffusion; verified avalanche effect: 1 flipped plaintext bit changed 62/128 ciphertext bits |
| Key schedule | Deterministically expands the master key into per-round key material to avoid literal key-repetition (a direct callback to Chapter 1's Kasiski lesson) — adds no new entropy, verified against FIPS-197's official test vector |
| Round count (10/12/14) | Chosen as a safety margin above the best published cryptanalytic shortcut, not to slow down brute force (key length alone handles that) |

**Where we go next:** This chapter built a cipher that safely and securely scrambles exactly one 128-bit block. Real messages are gigabytes long. Chapter 4 derives what happens when you have to chain many block encryptions together to handle an arbitrary-length message — and shows, with a concrete broken example, that the naive way of doing this (encrypt each block independently) leaks the plaintext's structure almost as badly as Chapter 1's substitution cipher did.

---

*Next: [04 — Modes of Operation](04_Modes_Of_Operation.md)*
