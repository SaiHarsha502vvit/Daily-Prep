# Chapter 07 — Functions & Properties

> [< Previous: 06 Relations & Properties](06_Relations_Properties.md) | [Course Index](README.md) | [Next → 08 Counting & Combinatorics](08_Counting_Combinatorics.md)

---

## The Problem Functions Solve

Chapter 06 introduced relations — subsets of A × B where any element of A can relate to zero, one, or many elements of B.

Most real processes need something stronger: **given an input, there is exactly one output**. A tax bracket formula doesn't say "this income could give several tax rates — pick one." A password hash function doesn't say "this password might produce two different hashes."

A **function** is a relation with this exactness guarantee. It's the right tool for any deterministic mapping: input → unique output. Without functions, you can't define what "equal" means for complex objects, can't compose operations safely, can't prove algorithm correctness.

---

## Definition: Function

A **function** f : A → B is a relation f ⊆ A × B such that:

1. **Total:** Every element a ∈ A appears in at least one pair (a, b) ∈ f.
2. **Deterministic:** Every element a ∈ A appears in at most one pair (a, b) ∈ f.

Together: every element of A appears in **exactly one** pair.

We write **f(a) = b** to mean (a, b) ∈ f.

```
A = {Alice, Bob, Carol}    (students)
B = {A, B, C, D, F}       (grades)

VALID FUNCTION (each student gets exactly one grade):
  f = {(Alice, A), (Bob, B), (Carol, A)}
  f(Alice) = A, f(Bob) = B, f(Carol) = A

INVALID (not a function — Bob gets two grades):
  {(Alice, A), (Bob, B), (Bob, C), (Carol, A)}

INVALID (not a function — Carol gets no grade):
  {(Alice, A), (Bob, B)}
```

---

## Vocabulary: Domain, Codomain, Range

```
            f
    A ─────────────────→ B
  [Domain]         [Codomain]
                      ↑
                [Range = f(A) = actual outputs used]
```

| Term | Meaning | Example above |
|------|---------|---------------|
| **Domain** | The input set A | Students |
| **Codomain** | The allowed output set B | Grades A–F |
| **Range** (or Image) | The subset of B actually produced: f(A) | {A, B} — A and F, C, D unused |

**Critical distinction:** Codomain is what the function *can* produce; range is what it *does* produce.

A function that doesn't use all of B (range ⊊ codomain) is common. A function that covers all of B (range = codomain) is **surjective**.

---

## The Three Key Properties

### Injective (One-to-One): No Two Inputs Share an Output

**Formal:** f is injective if ∀a₁, a₂ ∈ A. f(a₁) = f(a₂) → a₁ = a₂

Equivalently (contrapositive): a₁ ≠ a₂ → f(a₁) ≠ f(a₂).

**Analogy:** A fingerprint database. Every person has exactly one fingerprint pattern, and no two different people share the same pattern. You can reverse-lookup: given a fingerprint, you find at most one person.

**Directed graph view:** Every B-node has **at most one** incoming arrow.

```
INJECTIVE (different inputs → different outputs):
Alice ──→ A
Bob   ──→ B     ← each grade used at most once
Carol ──→ C

NOT INJECTIVE (Alice and Carol both map to A):
Alice ──→ A ←── Carol   ← two inputs share one output
Bob   ──→ B
```

**Consequence of injectivity:**
- |Domain| ≤ |Codomain| (you can't inject more items than there are slots)
- The function is reversible IF you only look at its range: given f(a), you can recover a.

---

### Surjective (Onto): Every Output Is Hit

**Formal:** f is surjective if ∀b ∈ B. ∃a ∈ A. f(a) = b

Every element of B must be the output for at least one input.

**Analogy:** Seating arrangements at a theater where EVERY seat is sold. The mapping (person → seat) is surjective — no seat is empty. (But two people might share a seat if the function isn't also injective.)

**Directed graph view:** Every B-node has **at least one** incoming arrow.

```
SURJECTIVE (every grade used at least once):
Alice ──→ A
Bob   ──→ A     ← A used twice, but that's ok — surjectivity doesn't prevent it
Carol ──→ B
Dave  ──→ C
      ──→ D     ← must be used
      ──→ F     ← must be used
(Domain must be large enough to cover all outputs)

NOT SURJECTIVE (grade F never assigned):
Alice ──→ A
Bob   ──→ B     ← F has no incoming arrow
Carol ──→ C
```

**Consequence of surjectivity:**
- |Domain| ≥ |Codomain| (you need at least as many inputs as outputs)
- Every output is achievable — the function "covers" B completely.

---

### Bijective: Both Injective AND Surjective

A function is **bijective** if it is both injective (no two inputs share an output) and surjective (every output is used).

Result: a **perfect pairing** between A and B. Every input has a unique output, and every output has a unique input.

**Analogy:** A coat-check room with exactly one coat per hanger and one hanger per coat. You give your coat (input) and get a unique ticket (output). The ticket uniquely identifies your coat — one-to-one in both directions.

**Consequence of bijectivity:**
- |A| = |B| (must have equal size for finite sets)
- The function has a well-defined **inverse** f⁻¹ : B → A

```
BIJECTIVE:
Alice ──→ A
Bob   ──→ B
Carol ──→ C

f⁻¹:
A ──→ Alice
B ──→ Bob
C ──→ Carol
```

**Bijectivity in cryptography:** A symmetric encryption function must be bijective. Encrypt(plaintext) = ciphertext means: different plaintexts must produce different ciphertexts (injective — otherwise decryption is ambiguous), and every ciphertext must correspond to some plaintext (surjective — otherwise the decryption function isn't defined everywhere).

---

## Summary Table

| Property | Arrow diagram | |A| vs |B| | Can reverse? |
|----------|--------------|-------------|------------|
| Injective | Each B-node ≤ 1 incoming | |A| ≤ |B| | Yes (on range only) |
| Surjective | Each B-node ≥ 1 incoming | |A| ≥ |B| | Not uniquely |
| Bijective | Each B-node = 1 incoming | |A| = |B| | Yes (full inverse) |
| Neither | Some B-nodes 0, some 2+ | Any | No |

---

## Composition: Building Pipelines

If f : A → B and g : B → C, the **composition** g ∘ f : A → C is defined:

**(g ∘ f)(a) = g(f(a))**

Apply f first, then g. Right-to-left reading (mathematical convention): "g after f."

```
Translation pipeline:
  f : English → German     ("hello" ↦ "hallo")
  g : German  → French     ("hallo" ↦ "allo")

  g ∘ f : English → French  ("hello" ↦ "allo")
```

**Composition preserves properties:**
- If f and g are injective, g ∘ f is injective.
- If f and g are surjective, g ∘ f is surjective.
- If f and g are bijective, g ∘ f is bijective.

**In code:**
```typescript
// Function composition
const double = (x: number) => x * 2;
const addTen = (x: number) => x + 10;

// g ∘ f = addTen after double
const doubleThenAdd10 = (x: number) => addTen(double(x));
doubleThenAdd10(5);  // = 20

// In functional style:
const compose = <A, B, C>(g: (b: B) => C, f: (a: A) => B) => (a: A) => g(f(a));
const transform = compose(addTen, double);
transform(5);  // = 20
```

---

## Inverse Functions

If f : A → B is bijective, the **inverse function** f⁻¹ : B → A is defined:

**f⁻¹(b) = a iff f(a) = b**

**Properties:**
- f⁻¹ ∘ f = idₐ (the identity function on A): undoing f after f gets you back to start.
- f ∘ f⁻¹ = id_B (the identity function on B): undoing in the other order too.

```
f : {1,2,3} → {a,b,c}
f(1) = a, f(2) = b, f(3) = c

f⁻¹ : {a,b,c} → {1,2,3}
f⁻¹(a) = 1, f⁻¹(b) = 2, f⁻¹(c) = 3

(f⁻¹ ∘ f)(1) = f⁻¹(f(1)) = f⁻¹(a) = 1 ✓
```

**Critical:** Only bijections have inverses. A non-injective function cannot have an inverse (f⁻¹(b) would be ambiguous — which input do you return?). A non-surjective function cannot have an inverse defined on all of B (some b has no preimage).

---

## Important Functions You'll Use Constantly

**Identity function:** idₐ(a) = a — maps every element to itself. The neutral element for composition.

**Floor and ceiling:**
- ⌊x⌋ = greatest integer ≤ x. ⌊3.7⌋ = 3, ⌊-1.2⌋ = -2.
- ⌈x⌉ = least integer ≥ x. ⌈3.2⌉ = 4, ⌈-1.8⌉ = -1.
- Used everywhere in algorithm analysis: binary search splits at ⌊n/2⌋, merge sort at ⌈n/2⌉.

**Modulo function:** a mod m — returns the remainder of a/m in range [0, m).
- 17 mod 5 = 2. (-3) mod 5 = 2 (in mathematical convention; Java's `%` gives -3).
- This is a **many-to-one surjection**: many integers map to the same remainder.
- Equivalence relation generated by mod m: a ≡ b (mod m) iff m | (a - b). Equivalence classes are {0,m,2m,...}, {1,m+1,2m+1,...}, etc.

**Hash function:** maps arbitrarily large inputs to a fixed-size range [0, N).
- NOT injective (pigeonhole: if |Domain| > N, collisions are inevitable).
- Ideally approaches surjection (uses all buckets).
- Collision = two distinct inputs with the same output = injectivity failure.
- Chapter 09 (Pigeonhole) will prove why collisions in a hash table with n > |range| are not just likely but **guaranteed**.

---

## Functions in Code — The Direct Mapping

**Pure functions in functional programming** are exactly mathematical functions: same input always produces same output (deterministic), no side effects. `Array.map()` applies a function to each element — it's function application.

```typescript
// Array.map applies f to every element — it's f applied to each input
const nums = [1, 2, 3, 4];
const doubled = nums.map(x => x * 2);   // [2, 4, 6, 8]

// map is f : number[] → number[] where each element transformed by double : number → number
// It composes perfectly because map preserves the structure
```

**Java `Function<T, R>` — explicitly the mathematical concept:**
```java
import java.util.function.Function;

Function<String, Integer> length = String::length;   // f : String → Integer
Function<Integer, Boolean> isEven = n -> n % 2 == 0; // g : Integer → Boolean

// Composition: g ∘ f
Function<String, Boolean> isEvenLength = length.andThen(isEven);
// isEvenLength("hello") = isEven(length("hello")) = isEven(5) = false
// isEvenLength("java") = isEven(4) = true
```

**The `Optional<T>` monad** handles partial functions:
- A partial function is one NOT defined on all inputs (e.g., "divide by" is undefined at divisor = 0).
- Java's `Optional<T>` wraps the output: the function returns `Optional.empty()` when the input is out-of-domain.
- This is how you safely encode partial functions while keeping the type system honest.

---

## Functions and Counting: Connecting to Chapter 08

When A and B are finite, function properties have cardinality consequences that appear in counting proofs:

| Function type | Cardinality constraint | Use in counting |
|---------------|----------------------|-----------------|
| Injective f: A → B | |A| ≤ |B| | Pigeonhole (Chapter 09): if |A| > |B|, no injection exists |
| Surjective f: A → B | |A| ≥ |B| | Surjections count "onto" arrangements |
| Bijective f: A → B | |A| = |B| | Counting by bijection: if A ↔ B bijection exists, |A| = |B| |

The bijection technique is powerful: to count |A|, find a bijection between A and some set B whose size you already know. This is how many combinatorial identities are proven — not by formula, but by exhibiting a bijection.

---

## Section Challenge

> ### Cryptographic Key Space Analysis
>
> A symmetric encryption scheme uses 128-bit keys. Consider f : Keys → Ciphertexts where f is the encryption function (you apply f to a plaintext using a specific key — think of it as fixed-plaintext encryption: we're comparing keys to outputs for one specific message).
>
> **Given:**
> - The key space K has |K| = 2¹²⁸ possible keys.
> - The ciphertext space C has |C| = 2¹²⁸ possible outputs (128-bit blocks).
> - For the scheme to be secure, f must be bijective.
>
> **Question 1:** What would it mean for f to be non-injective? Give a concrete attack that this enables.
>
> **Question 2:** What would it mean for f to be non-surjective? Is this a security problem?
>
> **Question 3:** f⁻¹ is the decryption function. What algebraic property does f⁻¹ have if f is bijective?
>
> **Question 4:** An attacker finds a second-preimage: a different key k₂ ≠ k₁ such that f(k₁) = f(k₂) on the same plaintext. Which function property is violated? What does this allow the attacker to do?
>
> **Bonus:** A hash function g : {0,1}* → {0,1}²⁵⁶ maps inputs of any length to 256-bit outputs. The input space is infinite, the output space has 2²⁵⁶ elements. Can g be injective? Can it be surjective? What does this mean for hash collisions?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Non-injective encryption (key collision)

Non-injective means: ∃ k₁ ≠ k₂ such that f(k₁) = f(k₂).
Two different keys produce the same ciphertext for the same plaintext.

ATTACK ENABLED: Key ambiguity attack.
  If an adversary intercepts a ciphertext C, they need to find the key k such
  that f(k) = C. Non-injectivity means there are TWO valid keys for the same C.
  
  More critically: if you're trying to verify that a communication partner
  used YOUR shared key k₁ (not k₂), you can't — k₂ would produce identical
  ciphertexts. The key is not uniquely determined by the ciphertext.
  
  In a key-exchange protocol, non-injectivity means an attacker who guesses k₂
  can produce the SAME ciphertext as the real k₁ — the ciphertext is no longer
  evidence of which key was used.

──────────────────────────────────────────────────────────

QUESTION 2: Non-surjective encryption

Non-surjective means: ∃ c ∈ C such that no key produces c as output.
Some ciphertexts are structurally impossible.

IS THIS A SECURITY PROBLEM? Yes, in two ways:

  1. Statistical signature: if an attacker knows that 5% of 128-bit strings
     can never appear as ciphertexts, they immediately get information.
     Observing that the actual ciphertext is in the "possible" 95% leaks
     information that reduces the search space.

  2. Structural patterns: real-world example — early DES had 4 "weak keys"
     where f(k) = f⁻¹(k) (the key is its own inverse). This didn't make DES
     non-surjective, but it made the range non-uniform — 4 keys behaved
     differently. Detecting whether a ciphertext came from a weak key gives
     an attacker partial key information.

  IDEAL encryption: f is bijective, and f(K) is uniform over C. Every
  ciphertext is equally likely regardless of the plaintext.

──────────────────────────────────────────────────────────

QUESTION 3: Properties of f⁻¹

If f : K → C is bijective, then f⁻¹ : C → K is also bijective (a bijection's
inverse is a bijection).

Specifically:
  - f⁻¹ is total (defined for every c ∈ C — guaranteed by surjectivity of f)
  - f⁻¹ is deterministic (each c has exactly one preimage — guaranteed by injectivity of f)
  - f⁻¹ is injective (different ciphertexts decrypt to different keys — must be true since f is a function)
  - f⁻¹ is surjective (every key is the decryption of some ciphertext — guaranteed by totality of f)

Algebraically:
  f⁻¹ ∘ f = id_K (decrypt after encrypt = identity)
  f ∘ f⁻¹ = id_C (encrypt after decrypt = identity)

This is exactly the property your AES library uses: Decrypt(Encrypt(msg, key), key) = msg,
guaranteed because AES is bijective (for a fixed key, it's a permutation of the block space).

──────────────────────────────────────────────────────────

QUESTION 4: Second-preimage attack

A second-preimage: k₂ ≠ k₁ but f(k₁) = f(k₂) for the same plaintext.

WHICH PROPERTY IS VIOLATED: Injectivity.
  Injective requires: f(k₁) = f(k₂) → k₁ = k₂.
  The attacker found the NEGATION: f(k₁) = f(k₂) AND k₁ ≠ k₂.

WHAT THE ATTACKER CAN DO:
  k₁ is the legitimate shared key. The attacker now has k₂ ≠ k₁ that produces
  identical ciphertexts. They can:
  
  1. Impersonate: send a ciphertext encrypted with k₂ — the receiver, decrypting
     with k₁, gets the same plaintext. The attacker passes as legitimate without
     knowing the real key k₁.
  
  2. Forge signatures: in schemes where the key IS the signature mechanism,
     k₂ is a "fake key" that produces valid-looking signatures.
  
  3. Halve the key search space: if every key has a partner, the effective
     key space drops from 2¹²⁸ to 2¹²⁷ distinct "ciphertext behaviors."

──────────────────────────────────────────────────────────

BONUS: Hash function injectivity and surjectivity

Can g : {0,1}* → {0,1}²⁵⁶ be injective?
  NO — by the Pigeonhole Principle (Chapter 09).
  The domain {0,1}* is infinite (includes strings of all lengths).
  The codomain {0,1}²⁵⁶ has only 2²⁵⁶ elements (finite).
  An injection would require |Domain| ≤ |Codomain| — but |Domain| is infinite.
  Therefore: hash collisions are MATHEMATICALLY GUARANTEED to exist.
  
  The question is not "do collisions exist?" (they must) but "can an attacker FIND one efficiently?"

Can g be surjective?
  Theoretically yes — if well-designed, every 256-bit string could be a valid hash.
  In practice, most hash functions do approach this (uniform distribution over outputs).
  SHA-256 is designed to appear surjective — all 2²⁵⁶ outputs should be roughly equally likely.

IMPLICATIONS:
  - Collision resistance: hard to find ANY a ≠ b with g(a) = g(b).
  - Preimage resistance: given a hash h, hard to find any a with g(a) = h.
  - Second-preimage resistance: given a, hard to find a' ≠ a with g(a) = g(a').
  
  Note: "hard to find" is not the same as "doesn't exist" (they DO exist — injectivity fails).
  Cryptographic hash security is about computational hardness, not mathematical impossibility.
  The math tells you WHY collisions exist; the security tells you WHY they're hard to exploit.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing domain and codomain**
- f : A → B does NOT mean every element of B is used. B is what the function *can* produce (codomain). What it *does* produce is the range (image), which is a subset of B.

**Mistake 2: Saying "a function is not injective because its range is smaller than the domain"**
- A function can be injective WITH a range smaller than the domain if the domain is smaller. Injectivity requires a₁ ≠ a₂ → f(a₁) ≠ f(a₂), not any comparison of sizes.
- The size constraint is: injective → |Domain| ≤ |Codomain|. Failing this constraint means NO injection exists — but that's different from saying a specific function fails injectivity.

**Mistake 3: Thinking non-bijective functions have no inverse**
- A non-surjective function has no inverse *on all of B*, but has a partial inverse on its range.
- A non-injective function has multiple preimages — the "inverse" is a relation (set-valued), not a function.
- This is why `sqrt(4)` returns only +2 in most languages (not ±2) — the convention picks the positive branch to make sqrt a function.

**Mistake 4: Confusing f ∘ g with g ∘ f**
- Composition is NOT commutative. (g ∘ f)(x) = g(f(x)) applies f first.
- In code: `.andThen(g)` applies g after the current function. `.compose(f)` applies f before.

---

## Connections

- **Chapter 05 — Sets:** A function f : A → B is a subset of A × B with a totality + determinism constraint.
- **Chapter 06 — Relations:** A function is a relation where each left-element appears exactly once. Understanding functions as special relations clarifies why the inverse of a non-bijection is a relation, not a function.
- **Chapter 08 — Counting:** Bijections are the counting tool: |A| = |B| iff a bijection A ↔ B exists. Surjections and injections count different combinatorial objects.
- **Chapter 09 — Pigeonhole:** If f : A → B with |A| > |B|, then f CANNOT be injective — at least two inputs share an output. This is the Pigeonhole Principle stated as a function property.
- `21_Python_ML_DL_NLP/` — Loss functions are functions ℝⁿ → ℝ. Activation functions (ReLU, sigmoid) are functions ℝ → ℝ. Backpropagation computes the composition of partial derivatives of composed functions (chain rule = function composition).
- `07_Modern_Java/` — Java `Function<T, R>`, `Predicate<T>`, `UnaryOperator<T>` are all mathematical functions. `andThen()` is forward composition (f then g), `compose()` is backward composition (g before this).

---

> [< Previous: 06 Relations & Properties](06_Relations_Properties.md) | [Course Index](README.md) | [Next → 08 Counting & Combinatorics](08_Counting_Combinatorics.md)
