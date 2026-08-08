# Chapter 13 — Threat Modeling & Secure SDLC

> "Twelve chapters built tools, each one solving a specific, named threat. This chapter builds the process that decides, before a single line of code ships, which threats a given system actually faces — and closes the loop back to the two ideas every tool in this entire course ultimately traces to."

---

## The Problem

Every mechanism this course built solves a specific, well-defined threat: AES defeats an eavesdropper who can only observe ciphertext; HMAC defeats an attacker who can tamper with a message; TLS's certificate chain defeats an attacker who can intercept a connection but doesn't hold a CA-trusted private key. But no system automatically knows *which* of these threats actually apply to it, whether it deployed the right tool for each one, or whether — as Chapters 4, 9, and 11 kept demonstrating — a bug in how the tools were *assembled* quietly undermined a component that was, on its own terms, perfectly sound. What's been missing is a systematic process for asking "what could go wrong here, specifically, for *this* system" **before** writing code, rather than reactively patching after an incident forces the question. That process is threat modeling, and this closing chapter builds it — using this course's own vulnerability catalog as the worked material.

---

## 13.1 STRIDE — Six Categories, Six Defenses Already Built

**STRIDE** (Loren Kohnfelder and Praerit Garg, Microsoft, 1999) organizes threats into six categories. What makes it worth revisiting *here*, at the end of this specific course, is that every single category maps directly onto a mechanism already derived in an earlier chapter — this section is as much a review of the entire course as it is a new framework.

**Spoofing** — pretending to be someone or something you're not. Defended by **authentication**: digital signatures (Ch9), TLS certificates binding a key to an identity (Ch11), passwords and TOTP (Ch10). The clearest possible illustration already sits in this course: Chapter 7, §7.3's man-in-the-middle attack was spoofing in its purest form — Mallory impersonating Bob to Alice and Alice to Bob, defeated only once Chapter 9's signatures were added on top.

**Tampering** — unauthorized modification of data. Defended by **integrity** mechanisms: hash functions (Ch8), MACs (Ch9), and an AEAD scheme's authentication tag (Ch4, §4.5). Chapter 4's CTR-mode bit-flipping attack is an unmitigated tampering attack, verified concretely; GCM's tag check is exactly this STRIDE category's defense, also verified.

**Repudiation** — denying having performed an action, with no way for anyone else to prove otherwise. This is the one category with exactly **one** tool in this course's kit actually capable of addressing it: digital signatures' non-repudiation property (Ch9, §9.4). Chapter 9 derived precisely *why* a MAC cannot provide this — verifier and signer hold the identical key, so a MAC can never distinguish, to an outside party, which of the two produced a given tag. Repudiation is the STRIDE category that most sharply separates "symmetric" from "asymmetric" in this course's toolbox.

**Information Disclosure** — exposing data to parties never meant to see it. Defended by **confidentiality**: AES (Ch3/4) and RSA/ECC (Ch6/7) for data in motion or arbitrary storage, TLS (Ch11) specifically for data in transit, and password hashing (Ch10) for one particular, narrow kind of data at rest.

**Denial of Service** — making a system unavailable to legitimate users. This is the one category this course has **not** built dedicated tools for, worth stating plainly rather than glossing over: DoS defenses are largely about resource management, rate-limiting, and infrastructure scaling, outside this course's cryptographic scope. But cryptographic design choices do intersect with it — Chapter 6's asymmetric operations are, by Chapter 11's own measurement, orders of magnitude more expensive than symmetric ones, meaning an attacker who can trigger many expensive RSA/DH operations on a server (a flood of connection attempts, each demanding a full handshake) spends comparatively little to force the defender to spend a lot. This is exactly why real TLS implementations use cheap, stateless verification (cookies, rate limits) to filter obviously abusive traffic *before* committing to the expensive asymmetric work Chapter 11 derived.

**Elevation of Privilege** — gaining access or capabilities beyond what was actually granted. Defended by **authorization**, and Chapter 12, §12.4's IDOR is exactly this category: a user authenticated at one privilege level (themselves) gaining access to data or actions that should have required a different one (another user's resources) — precisely the authentication-versus-authorization distinction Chapter 12 derived in detail.

| STRIDE category | Defended by | Chapter |
|---|---|---|
| **S**poofing | Authentication (signatures, certificates, passwords/TOTP) | Ch7 §7.3, Ch9, Ch10, Ch11 |
| **T**ampering | Integrity (hashes, MACs, AEAD tags) | Ch4 §4.4-4.5, Ch8, Ch9 |
| **R**epudiation | Non-repudiation (signatures specifically, not MACs) | Ch9 §9.4 |
| **I**nformation Disclosure | Confidentiality (symmetric/asymmetric encryption, TLS) | Ch3, Ch4, Ch6, Ch7, Ch10, Ch11 |
| **D**enial of Service | Resource management (outside this course's scope; intersects with asymmetric-op cost) | Ch6, Ch11 (partial) |
| **E**levation of Privilege | Authorization (not just authentication) | Ch12 §12.4 |

---

## 13.2 Attack Trees

An **attack tree** decomposes a single top-level attacker goal (the root) into concrete, specific sub-goals, connected by **OR** (any one branch alone suffices) or **AND** (every child is required together) relationships, recursively, until each leaf is a specific, concrete technique. The value isn't the diagram itself — it's the discipline of forcing *systematic* coverage of a goal from multiple angles, rather than fixating on whichever vulnerability happens to come to mind first, and making attacker **cost** comparable across genuinely different branches so defenders can prioritize by actual risk rather than by which branch sounds most technically interesting.

**A worked example, built entirely from this course's own material** — root goal: *attacker drains Alice's bank account*.

```
GOAL: Drain Alice's account
 OR
 ├─ Break TLS directly (Ch11)
 │    requires: defeat AES-GCM or forge a CA-trusted certificate signature
 │    cost: extremely high, assuming correct implementation (Ch3/Ch9's proofs hold)
 │
 ├─ CSRF the transfer endpoint (Ch12 §12.2)
 │    requires: victim visits an attacker page while authenticated, AND
 │               endpoint lacks CSRF-token verification
 │    cost: low, IF the endpoint is missing the check -- zero network position needed
 │
 ├─ Steal Alice's password via a leaked unsalted hash (Ch10 §10.1-10.3)
 │    requires: a DIFFERENT breach exposes an unsalted/fast-hashed password database, AND
 │               Alice reused that password here
 │    cost: very low once a leak exists -- verified: near-instant with a precomputed table
 │
 └─ MITM Alice's initial key exchange (Ch07 §7.3)
      requires: active position on Alice's specific network path, AND
                exact timing during a session establishment, AND
                a way to bypass certificate validation (Ch11 §11.4)
      cost: high -- needs an active, targeted, per-victim position; largely closed by
            correct certificate validation
```

Four branches, all leading to the same root goal, drawing on four different chapters — and, worth stating explicitly, they are not equally worth defending against, which is precisely §13.3's payoff and Section Challenge Q2's subject.

---

## 13.3 A Practical Security Code Review Checklist

A short, concrete checklist, each item traceable to a specific derivation earlier in this course rather than a generic, unsourced rule of thumb:

- **Are all cryptographic primitives from vetted, standard, publicly-analyzed libraries — never hand-rolled?** (Ch1 §1.7's Kerckhoffs principle, and "never roll your own crypto" stated as its direct four-word consequence.)
- **Is every encryption mode authenticated (AEAD), never bare CBC or CTR alone?** (Ch4 §4.4-4.5's bit-flipping and padding-oracle derivations.)
- **Are IVs and nonces generated correctly and never reused under the same key?** (The single most repeated failure mode in this entire course — Ch1 §1.5's Vigenère, Ch2's two-time pad, Ch4 §4.3's CTR nonce reuse, Ch9 §9.4's ECDSA nonce reuse, all the identical mistake in different clothing.)
- **Are passwords hashed with a memory-hard KDF (bcrypt/scrypt/Argon2), never a fast general-purpose hash?** (Ch10 §10.3-10.4's verified ~89,600× speed argument.)
- **Does every resource-access code path check authorization, not merely authentication?** (Ch12 §12.4's IDOR derivation.)
- **Are state-changing endpoints protected against CSRF, and is all output escaped for the specific syntax context it lands in?** (Ch12 §12.1-12.2.)
- **Is certificate validation actually enforced — no disabled verification, no self-signed certificates accepted in production?** (Ch11 §11.4.)
- **Do concurrent check-then-act sequences use real locking or an atomic conditional operation?** (Ch12 §12.5's verified 30-thread race demonstration.)
- **Does every verification step happen *before* trusting a message's own claims about itself — an algorithm field, a padding byte, anything attacker-supplied — never after?** (Ch4 §4.6's padding oracle and Ch10 §10.6's JWT `alg: none`, the same "never let the message decide how it gets checked" lesson recurring twice.)

---

## 13.4 Defense in Depth and Least Privilege

**Why a single point of failure means something structurally different in security than in reliability engineering** is worth deriving carefully, not just asserting.

In **reliability** engineering, a single point of failure is a component whose independent failure (wear, a random hardware fault, bad luck) takes down the whole system — and the standard fix, redundancy, genuinely works, because redundant components fail **independently** of each other. If each of two identical, independently-operating components fails randomly 1% of the time, both failing simultaneously is roughly $0.01\%$ — a real, multiplicative improvement, because nothing about component A failing makes component B any more likely to fail at the same moment.

**Security doesn't get this multiplicative benefit for free, because an attacker is not a random, independent process.** An intelligent adversary who succeeds at defeating one layer can specifically study, target, and adapt to the *next* layer, using exactly what they learned defeating the first. Two firewalls from the same vendor, sharing the same misconfiguration, both fail to the identical bypass technique — that's not defense in depth, it's the same single point of failure, counted twice. **Genuine defense in depth requires layers that are *qualitatively independent*** — the specific technique that defeats one provides no help defeating the other. A network-level firewall and Chapter 12, §12.4's application-level ownership check are genuinely independent in this sense: an IP-spoofing technique that bypasses the firewall has no bearing on whether the resource-ownership check still holds, and vice versa.

This is, read backward, exactly what kept happening throughout this course: Chapter 4, §4.6's padding oracle attack left AES itself completely unbroken — a different layer (error-message behavior) failed. Chapter 9, §9.5's sign/encrypt composition risk left both the signature and the encryption individually sound — the *ordering* layer was the exposure. Chapter 11, §11.4's self-signed-certificate failure left AES-GCM doing its job correctly — the *trust-binding* layer was what gave way. In every one of these, **some** layer held even as another one failed, and whatever protection remained came from that surviving layer — not from any single layer being unbreakable, which none of them ever claimed to be. That is defense in depth, observed in the specific failures this course spent twelve chapters deriving, not just defined in the abstract.

**Least privilege is the same underlying principle, applied one step earlier** — not "how do we defend a component after the fact," but "how little access does this component or user actually need to be granted in the first place." Given the intelligent-adversary framing above, *some* component will eventually be compromised; least privilege's entire purpose is ensuring that when it happens, the blast radius is limited to whatever that specific component was ever permitted to touch, not the whole system. Chapter 12, §12.4's authorization check *is* a least-privilege enforcement point, applied per-request. Chapter 9, Section Challenge Q2's warning against reusing one RSA key pair across both signing and decryption roles is least privilege applied to key scope: narrowing what a single key is trusted for, so that compromise or misuse in one role doesn't automatically extend into the other.

---

## 13.5 Closing the Course — Kerckhoffs and Shannon, One Last Time

Two ideas, both introduced in the first two chapters, turn out to be the source every subsequent engineering choice in this course traces back to. Worth tracing that lineage explicitly, once, at the end.

**Kerckhoffs's principle (Chapter 1, §1.7):** security must depend only on keeping a *key* secret, never on hiding a *design*. Track this forward: AES's complete specification is a public NIST standard, verified in Chapter 3 against its own official FIPS-197 test vector. RSA and Diffie-Hellman's mathematics are public algebra, derived openly in Chapters 5 through 7. SHA-256's structure is a public FIPS-180-4 standard, its round constants literally derivable by anyone from cube roots of primes (Chapter 8). TLS 1.3 is a public IETF standard, RFC 8446 (Chapter 11). **Every single verified worked example in this entire course used a publicly documented, openly standardized algorithm.** That was never incidental — it is Kerckhoffs's principle, enforced structurally, chapter after chapter, without exception.

**Shannon's security definitions (Chapter 2):** perfect secrecy as the unreachable gold standard, and the deliberate fork onto *computational* security once Shannon's own theorem proved perfect secrecy impractical for anything longer than a one-time pad. Track this forward too: every "security" claim made after Chapter 2 is a *bounded-attacker* claim, not an unconditional one — AES's PRP indistinguishability (Ch3, §3.1) assumes a computationally limited adversary; RSA and Diffie-Hellman's hardness (Ch6/7) rests on problems believed hard, not proven impossible; a hash function's collision resistance (Ch8, §8.5) is explicitly a *bounded* $2^{n/2}$ figure, not $2^n$. **Not one single "unbreakable" claim appears anywhere in this course after Chapter 2**, and that absence is deliberate — it is Shannon's fork, taken consistently, all the way to this closing chapter.

**Every engineering decision from Chapter 3 onward is downstream of exactly these two ideas.** Assume the attacker already knows everything except the key (Kerckhoffs) — so security has to survive complete public scrutiny of the design itself. Define security *precisely*, then either prove a scheme meets that definition or explicitly, honestly accept a weaker, bounded guarantee instead of vague confidence (Shannon) — so every claim this course made was falsifiable, specific, and where possible, verified by actually running the code rather than asserted. Threat modeling — this chapter — is nothing more than the discipline of applying both of those ideas *to a whole system*, deliberately, before it ships, rather than waiting for an incident to force the question afterward.

---

## Section Challenge

---

**Q1.** Classify the ECDSA nonce-reuse vulnerability from Chapter 9, §9.4 (the 2010 Sony PlayStation 3 key recovery) using STRIDE. Does it fit exactly one category?

<details>
<summary>Answer</summary>

**No — and that's the important, generalizable point: STRIDE's categories are angles to check systematically, not a mutually exclusive partition, and a single serious root-cause vulnerability routinely cascades into several of them at once.**

Primarily, it's **Spoofing**: once the private signing key is recovered from two signatures sharing a nonce, an attacker can produce valid signatures for *any* content whatsoever, fully impersonating the legitimate signer with no further effort. But it doesn't stop there. It's simultaneously **Tampering**: any content that relies on that signature for integrity — in the real incident, signed software updates — can now be replaced by attacker-modified versions that still pass verification, since the attacker can re-sign anything. And, specific to the actual PS3 scenario, it's **Elevation of Privilege**: code that was never trusted (attacker-supplied) becomes, once validly signed with the recovered key, indistinguishable from officially trusted system code — a direct jump from "arbitrary untrusted input" to "fully trusted, system-signed content."

**The general lesson:** don't treat STRIDE as a sorting exercise where each vulnerability gets filed under exactly one label. Its value is as a *checklist of questions to ask about a single component* — "could this be spoofed? could its output be tampered with? could it enable privilege elevation?" — and a genuinely serious vulnerability, like a compromised signing key, tends to answer "yes" to several of those questions simultaneously, because the categories describe *consequences*, and one root cause can have several different consequences at once.
</details>

---

**Q2.** In §13.2's worked attack tree, both "steal Alice's password via a leaked unsalted hash" and "MITM Alice's initial key exchange" lead to the same root goal. Using attack-tree reasoning rather than intuition about technical sophistication, which should a defender rationally prioritize fixing first?

<details>
<summary>Answer</summary>

**The password-hashing branch — and the reasoning has to be cost-and-scale comparison, not which attack sounds more impressive to a security researcher, which is precisely what attack-tree analysis is designed to force.**

The unsalted-hash-plus-precomputation attack (Ch10 §10.1) requires **zero** special network position, works identically and simultaneously against **every** user in a leaked database at once, and — per §10.1's own verified numbers — costs a fraction of a millisecond per victim once the precomputed table exists, which itself only needs to be built a single time. It doesn't even require attacking *this* system directly; it only requires that Alice reused a password exposed in some unrelated breach, a genuinely common real-world occurrence this chapter's own opening section named directly.

The MITM branch (Ch7 §7.3) requires an **active**, ongoing position on Alice's specific network path, timed to coincide with one specific key-exchange event, and — critically — is exactly the threat Chapter 11's certificate-based authentication was purpose-built to close off, meaning a correctly implemented TLS deployment has already substantially raised this branch's cost before any additional defensive effort is spent. It's also inherently **per-victim**: compromising Alice's specific connection does nothing to compromise Bob's.

**Attack-tree analysis exists precisely to surface this kind of comparison explicitly**, rather than letting engineering attention default to whichever attack is more conceptually interesting to think about. A branch that is cheap, scales to every user at once, and requires no special positioning is a higher real-world risk than a branch that is expensive, requires active per-victim effort, and is already substantially mitigated by a correctly functioning layer elsewhere in the system — regardless of which one makes for a more compelling conference talk.
</details>

---

**Q3.** A team proposes a new, in-house-designed encryption algorithm for a product, arguing: "We'll also keep the algorithm itself secret, as an extra defense-in-depth layer on top of the key." Evaluate this proposal using both Kerckhoffs's principle (Chapter 1) and the defense-in-depth reasoning from this chapter (§13.4).

<details>
<summary>Answer</summary>

**This is not genuine defense in depth, and checking it against §13.4's own independence requirement is what exposes exactly why.** §13.4 derived that authentic defense in depth requires layers that are *qualitatively independent* — defeating one must provide no help toward defeating the other. Algorithm secrecy and key secrecy fail this test badly, for two compounding reasons Chapter 1, §1.7 already derived in full: first, algorithm secrets leak through channels key secrets don't share nearly as easily — reverse engineering, employee turnover, chip decapping, accidental publication — meaning "the algorithm is secret" is a far more fragile, far less independent form of protection than it sounds; second, and more fundamentally, an undisclosed algorithm has not been subjected to the adversarial public scrutiny that gives every algorithm actually used in this course its justified confidence. AES survived an open, multi-year international competition and decades of published cryptanalysis attempting to break it (Ch3). This new algorithm has survived a design meeting.

**"Secret algorithm plus secret key" isn't two independent layers — it's Kerckhoffs's exact security-through-obscurity failure mode from Chapter 1, §1.7, wearing the vocabulary of a legitimate chapter-13 concept.** Adding an *un-analyzed*, *unreviewed* layer on top of a properly-keyed one doesn't multiply protection the way §13.4 showed two independent, well-vetted mechanisms can — it adds a layer whose actual strength is completely unknown, dressed in language ("extra defense in depth") borrowed from a principle that, correctly applied, would have rejected it. The proposal fails on Chapter 1's terms alone; checking it against this chapter's own independence requirement confirms exactly *why* it fails, rather than just asserting that it does. This is the entire course's standard, applied one final time: derive the answer, don't state it.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---|---|
| STRIDE | Six threat categories, each mapped to a specific defense already derived in this course: Spoofing→authentication, Tampering→integrity, Repudiation→signatures specifically, Information Disclosure→confidentiality, Denial of Service→resource management (outside this course's scope), Elevation of Privilege→authorization |
| Attack trees | Decompose a goal into AND/OR sub-goals to force systematic, multi-angle analysis and make attacker cost comparable across branches — worked example spans Ch7, Ch10, Ch11, and Ch12 |
| Security code review checklist | Nine concrete, actionable items, each traced to a specific chapter's derivation rather than stated as an unsourced rule |
| Defense in depth | Requires *qualitatively independent* layers, unlike reliability redundancy — an intelligent adversary who defeats one layer can specifically target the next; this course's own recurring "the math was fine, a different layer failed" pattern (Ch4, Ch9, Ch11) is this principle observed in practice |
| Least privilege | Minimize what any component is granted, so that eventual compromise (assumed, not merely possible, under an intelligent-adversary model) has a limited blast radius — Ch12 §12.4's authorization checks and Ch9's key-scoping warning are both instances |
| Kerckhoffs's principle, traced forward | Every verified algorithm in this course (AES/FIPS-197, RSA/DH math, SHA-256/FIPS-180-4, TLS/RFC 8446) was public and standardized — never once a secret design, from Chapter 3 through Chapter 13 |
| Shannon's fork, traced forward | Every post-Chapter-2 security claim is a bounded, computational one (PRP indistinguishability, hardness assumptions, birthday-bounded collision resistance) — no unconditional "unbreakable" claim appears anywhere after perfect secrecy's own chapter |

**This closes the course.** Chapter 1 opened with a two-thousand-year arms race and a question: can "unbreakable" ever be defined precisely enough to prove? Chapter 2 answered yes, proved it, and showed the proof's own cost made it impractical almost everywhere. Chapters 3 through 12 built the practical alternative, piece by piece, deriving — and, wherever a number was involved, verifying by actually running the code — not just what each mechanism does, but why it has to be built exactly that way. This chapter is the discipline that ties the whole toolbox to a real system: ask what could go wrong, specifically, before it does — using tools this course spent thirteen chapters earning the right to trust, for reasons that were derived, never merely asserted.

---

*This is the final chapter of CSE403 — Cryptography & Security.*
