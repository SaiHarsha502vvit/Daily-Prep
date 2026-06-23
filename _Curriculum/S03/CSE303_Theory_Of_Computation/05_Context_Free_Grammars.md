# Chapter 5 — Context-Free Grammars

> "Regular languages can count to one. Context-free languages can count to two — and that turns out to be exactly enough for programming languages."

---

## The Problem That Breaks Regular Languages

You learned in Chapter 4 (Pumping Lemma) that `L = {aⁿbⁿ | n ≥ 0}` is not regular. But *why does that matter outside theory?*

Consider balanced parentheses in code:

```
((()))         ← valid
(()())         ← valid
()(()())       ← valid
((()           ← invalid — more opens than closes
```

Every programming language parser must recognize balanced brackets. The Pumping Lemma proof for `{aⁿbⁿ}` applies directly: balanced parens are just `aⁿbⁿ` in disguise (a = `(`, b = `)`), so no DFA can recognize them.

**The core problem:** DFAs have fixed memory (states). Matching the *n*th open paren with the *n*th close paren requires remembering *n* — but *n* is unbounded, so you'd need infinitely many states.

**The insight:** you need a *stack* — a memory that can grow without bound but only reads the top. A stack lets you push for `(` and pop for `)`, checking balance. Context-free grammars are exactly the rules that capture what a stack-based machine can compute.

---

## 5.1 Formal Definition

A **context-free grammar (CFG)** is a 4-tuple `G = (V, Σ, R, S)` where:

- **V** = finite set of **variables** (also called non-terminals), e.g., `{S, A, B}`
- **Σ** = finite set of **terminals** (the actual symbols in strings), e.g., `{a, b, (, )}`
- **R** = finite set of **production rules** of the form `A → w` where `A ∈ V` and `w ∈ (V ∪ Σ)*`
- **S ∈ V** = the **start variable**

The key constraint: the left-hand side of every rule is a *single* variable. This "context-free" constraint means you can replace `A` with its production regardless of what's around it — no context needed.

### Balanced Parentheses CFG

```
S → (S) | SS | ε
```

Trace `(()())`:
```
S
→ SS                  (rule SS)
→ (S)S                (left S → (S))
→ (SS)S               (inner S → SS)
→ ((S)S)S             (left S of inner → (S))
→ (()S)S              (S → ε, () formed)
→ (()(S))S            (S → (S))
→ (()())S             (S → ε)
→ (()())              (S → ε)
```

Each step replaces exactly one variable (left-hand side) with its production (right-hand side). This is a **derivation**.

---

## 5.2 Derivations and Parse Trees

### Notation

`A ⇒ w` means one derivation step.

`A ⇒* w` means zero or more steps (reflexive-transitive closure).

The **language of G**: `L(G) = { w ∈ Σ* | S ⇒* w }` — all strings of terminals derivable from S.

### Leftmost vs Rightmost Derivation

In each step, which variable do you replace?

**Leftmost derivation:** always replace the leftmost variable.

**Rightmost derivation:** always replace the rightmost variable.

Both produce the same set of strings, but they matter for parsers: recursive-descent parsers use leftmost, LR parsers use rightmost.

### Parse Trees

A **parse tree** is the derivation visualized as a tree:
- Root = S
- Interior nodes = variables
- Leaves (left to right) = terminals = the derived string

Example: `S → aSb | ε` derives `aaabbb`:

```
        S
      / | \
     a  S  b
       /|\
      a  S  b
        /|\
       a  S  b
          |
          ε
```

Reading leaves left-to-right: `a a a b b b = a³b³`. ✓

**Parse trees are the semantic backbone of compilers.** An expression like `3 + 4 * 5` has two possible parse trees depending on precedence — whichever tree the compiler produces determines the answer.

---

## 5.3 Ambiguity — The Hidden Trap

A grammar is **ambiguous** if some string has two or more distinct parse trees (equivalently, two distinct leftmost derivations).

### The Arithmetic Ambiguity

Grammar:
```
E → E + E | E * E | (E) | id
```

String: `id + id * id`

**Parse tree 1** (addition first — wrong):
```
       E
     / | \
    E  +  E
    |   / | \
   id  E  *  E
       |      |
      id     id
```
→ Computes `(id + id) * id`

**Parse tree 2** (multiplication first — correct):
```
       E
     / | \
    E  +  E
    |   / | \
   id  E  *  E
       |      |
      id     id
```

Wait — these look identical. The structure differs in *which E is the root*:

Tree 1: root `E → E + E`, right child `E → E * E`
Tree 2: root `E → E + E`, right child `E → E * E`

Let me draw them more clearly:

```
Tree 1: ((id+id)*id)          Tree 2: (id+(id*id))

      E                              E
    / | \                          / | \
   E  +  E            vs          E  +  E
  /|\    |                        |    /|\
 E * E   id                      id  E  * E
 |   |                               |     |
id   id                             id    id
```

Same string, different trees, different evaluation order. The grammar is ambiguous.

### Fixing Arithmetic Ambiguity

Standard fix: encode precedence and associativity into the grammar structure:

```
E  → E + T | T          (addition, left-associative, lowest precedence)
T  → T * F | F          (multiplication, left-associative, higher precedence)
F  → (E) | id           (atoms and parenthesized expressions)
```

Now `id + id * id` has exactly one parse tree:

```
      E
    / | \
   E  +  T
   |    /|\
   T   T  *  F
   |   |      |
   F   F     id
   |   |
  id  id
```

Bottom-up: `T → F → id` for each id; then `T * F` at multiplication level; then `E + T` at addition level. Multiplication binds tighter because it's lower in the grammar.

### The Dangling Else Problem

Classic ambiguity in programming:
```
if (a) if (b) s1 else s2
```

Which `if` does `else` belong to? Grammar:
```
S → if(E)S | if(E)S else S | s
```

This grammar is ambiguous (two parse trees). Languages fix it by convention ("else matches nearest if") but the *grammar itself* is ambiguous. Real parser generators handle this via explicit conflict resolution rules, not grammar structure.

### Inherent Ambiguity

Some CFLs are **inherently ambiguous**: every grammar for the language is ambiguous. Example:
```
L = {aⁱbʲcᵏ | i=j or j=k}
```

No unambiguous CFG exists for L (proof requires the CFL pumping lemma — Chapter 7). This is rare but real.

---

## 5.4 Chomsky Normal Form (CNF)

**Why normalize?** The CYK parsing algorithm (and many proofs) require a clean grammar structure. CNF provides it.

**Chomsky Normal Form (CNF):** Every production has exactly one of these forms:
1. `A → BC` (exactly two variables)
2. `A → a` (exactly one terminal)
3. `S → ε` only if ε ∈ L(G) (only the start variable can produce ε)

**Theorem:** Every CFG can be converted to CNF without changing the language (except possibly adding/removing ε depending on the convention).

### CNF Conversion Algorithm (4 steps)

**Step 1: Add new start variable**

If S appears on the right side of any rule, add `S₀ → S` and make S₀ the new start. This ensures the start variable is never on a right-hand side.

**Step 2: Eliminate ε-productions**

Find all variables A such that `A ⇒* ε` (nullable variables). For each rule containing a nullable variable on the right, add a version with that variable removed.

Example: if `A → ε` and `B → ACA`, add `B → CA | AC | C` (cover all subsets of nullable occurrences). Then remove all `A → ε` rules (except `S₀ → ε` if ε ∈ L).

**Step 3: Eliminate unit productions** (`A → B`, a single variable)

If `A → B` and `B → w`, add `A → w`. Repeat until no unit productions remain. Order matters — process all chains.

Example:
```
A → B, B → C, C → ab
→ add: B → ab, A → ab, A → C
→ continue until all unit productions gone
```

**Step 4: Convert long rules to binary**

Any rule `A → B₁B₂...Bₖ` with k ≥ 3 gets broken down:

```
A → B₁B₂B₃...Bₖ
  becomes:
A  → B₁A₁
A₁ → B₂A₂
...
Aₖ₋₂ → Bₖ₋₁Bₖ
```

**Terminals inside rules:** Replace each terminal `a` in a mixed rule `A → aB` with a new variable `Tₐ → a`, making `A → TₐB`.

### Full Example

Start: `S → aSb | ε`

Step 1: add `S₀ → S`
```
S₀ → S
S  → aSb | ε
```

Step 2: eliminate ε (S is nullable, S₀ will handle ε):
```
S₀ → S | ε      ← add S₀ → ε since S → ε
S  → aSb | ab   ← add ab (drop S from aSb when S = ε)
```
Remove `S → ε`.

Step 3: eliminate unit `S₀ → S`:
```
S₀ → aSb | ab | ε
S  → aSb | ab
```

Step 4: fix terminals in multi-symbol rules (`a`, `b` appear with others):
```
Tₐ → a
T_b → b
```
Replace `aSb` → `TₐST_b` and `ab` → `TₐT_b`:
```
S₀ → TₐST_b | TₐT_b | ε
S  → TₐST_b | TₐT_b
```

Fix `TₐST_b` (length 3) → binary:
```
A₁ → ST_b
S₀ → TₐA₁ | TₐT_b | ε
S  → TₐA₁ | TₐT_b
```

Now every production is `A → BC`, `A → a`, or `S₀ → ε`. CNF complete. ✓

---

## 5.5 The CYK Parsing Algorithm

**Problem:** Given a CFG G in CNF and a string w = w₁w₂...wₙ, is w ∈ L(G)?

**Brute force:** try all derivations — exponential time.

**CYK (Cocke-Younger-Kasami):** Dynamic programming over substrings — O(n³ · |G|) where |G| is grammar size.

### The Recurrence

Let `T[i][j]` = set of variables that can derive the substring `wᵢwᵢ₊₁...wⱼ`.

**Base case:** `T[i][i] = { A | A → wᵢ ∈ R }` — single-character substrings.

**Recursive case:** `A ∈ T[i][j]` if there exists a split point k (i ≤ k < j) and a rule `A → BC` such that `B ∈ T[i][k]` and `C ∈ T[k+1][j]`.

**Accept if:** `S ∈ T[1][n]`.

### CYK Trace

Grammar:
```
S → AB | BC
A → BA | a
B → CC | b
C → AB | a
```

Input: `baaba` (n=5, indices 1-5: b=1, a=2, a=3, b=4, a=5)

Fill base (diagonal):
```
T[1][1] = {B}   (b → B)
T[2][2] = {A,C} (a → A, a → C)
T[3][3] = {A,C} (a → A, a → C)
T[4][4] = {B}   (b → B)
T[5][5] = {A,C} (a → A, a → C)
```

Length-2 substrings:
```
T[1][2]: rules A→BC where B∈T[1][1]={B}, C∈T[2][2]={A,C}
  → B∈T[1][1], C∈T[2][2]: check S→BC: yes! → S∈T[1][2]
  → B∈T[1][1], A∈T[2][2]: check A→BA: yes! → A∈T[1][2]
  T[1][2] = {S, A}

T[2][3]: B∈T[2][2]={A,C}, C∈T[3][3]={A,C}
  → A,A: check A→BA? No. S→AB? No. B→CC? No. C→AB? No. A→BA? No.
  → Wait, need to be careful: for rule X→YZ, need Y∈T[i][k] and Z∈T[k+1][j]
  T[2][2]={A,C}, T[3][3]={A,C}
  S→AB: A∈T[2][2]✓, B∈T[3][3]? No (B∉{A,C}).
  S→BC: B∈T[2][2]? No.
  A→BA: B∈T[2][2]? No.
  A→BA from other split: only k=2 here.
  B→CC: C∈T[2][2]✓, C∈T[3][3]✓ → B∈T[2][3]!
  C→AB: A∈T[2][2]✓, B∈T[3][3]? No.
  T[2][3] = {B}
```

(Continuing full table is long; the key is S ∈ T[1][5] at the end.)

**Time complexity:** O(n²) cells × O(n) split points × O(|G|) rules = **O(n³ |G|)**.

This is polynomial — practical for small grammars (compilers typically use more optimized Earley or LALR parsers for efficiency, but CYK proves the decision problem is in P).

---

## 5.6 Properties of CFLs

Context-free languages are **closed under** some operations but not others:

| Operation | Closed? | How |
|-----------|---------|-----|
| Union | ✓ | New start: `S → S₁ | S₂` |
| Concatenation | ✓ | New start: `S → S₁S₂` |
| Kleene star | ✓ | New start: `S → SS₁ | ε` |
| Reversal | ✓ | Reverse all right-hand sides |
| **Intersection** | ✗ | `{aⁿbⁿcⁿ}` = `{aⁿbⁿ} ∩ {bⁿcⁿ}` neither alone a CFL⁻¹ |
| **Complement** | ✗ | If complement were closed, intersection would be too (DeMorgan) |
| Intersection with regular | ✓ | Run PDA and DFA in parallel (proof in Ch6) |

**Why intersection fails:** Consider `L₁ = {aⁿbⁿcᵏ}` and `L₂ = {aᵏbⁿcⁿ}`. Both are CFLs. But `L₁ ∩ L₂ = {aⁿbⁿcⁿ}` which requires matching three counts simultaneously — provably not context-free (Chapter 7).

---

## 5.7 Real-World Connections

### Programming Language Grammars

Every programming language has a formal grammar. Java's grammar is a CFG with ~200 productions. The compiler's front-end has two phases:

1. **Lexer (DFA):** tokenizes source → `if`, `(`, identifier, `)`, etc. Regular language, O(n).
2. **Parser (PDA/CYK):** checks token stream against grammar. Context-free, O(n³) worst case but O(n) with well-structured LALR grammars.

The split is intentional: use the cheaper machine for what it can handle, escalate only when needed.

### JSON and XML

JSON's grammar (simplified):
```
Value  → String | Number | Object | Array | true | false | null
Object → '{' Members '}'
Members → Pair | Pair ',' Members | ε
Pair   → String ':' Value
Array  → '[' Elements ']'
```

This is context-free. The nested structure (objects inside arrays inside objects) requires a stack — you can't parse JSON with a regex alone (despite popular attempts with `.*` patterns).

### Compiler Precedence Climbing

The precedence-fixing grammar from §5.3 (`E → E+T | T`, `T → T*F | F`, `F → (E) | id`) is actually how real C/Java compilers encode arithmetic. Each level of the grammar corresponds to one precedence tier.

### HTML

HTML5's grammar is NOT context-free (tag matching with namespace rules makes it context-sensitive). This is why HTML parsers are special-cased rather than using standard CFG tools — and why you see so many quirky error-recovery behaviors in browsers.

---

## 5.8 The Hierarchy So Far

```
Regular Languages (DFA/NFA/RegEx)
    ⊂
Context-Free Languages (CFG/PDA)
    ⊂
Context-Sensitive Languages (linear-bounded automata)
    ⊂
Recursively Enumerable (Turing machines)
```

Where we are:
- Chapters 1-4: Regular = DFA = NFA = RegEx. Pumping Lemma separates regular from everything else.
- **This chapter:** CFLs via CFGs. Closed under union/concat/star, not intersection/complement.
- Chapter 6: Pushdown Automata (PDAs) — the machine model matching CFGs.
- Chapter 7: Pumping Lemma for CFLs — separates CFLs from the next tier up.
- Chapters 8-11: Turing machines, decidability, complexity.

---

## Section Challenge

Five questions. Try each before opening the answer.

---

**Q1.** Write a CFG for `L = {aⁿb²ⁿ | n ≥ 0}` — strings of n a's followed by 2n b's.

<details>
<summary>Answer</summary>

Each `a` must generate exactly two `b`'s. Structure: wrap `a` around two extra `b`'s:

```
S → aSbb | ε
```

Derivation of `aabbbbb` (n=2):
```
S → aSbb → aaSbbbb → aabb..wait that gives aabbbb
```

Hmm let me recount. n=2 means 2 a's and 4 b's: `aabbbb`.

```
S → aSbb → aaSbbbb → aaεbbbb = aabbbb ✓
```

Yes: each application of `S → aSbb` adds one `a` on the left and two `b`'s on the right. When S produces ε, we stop. Result: n a's and 2n b's. ✓
</details>

---

**Q2.** Convert the grammar `S → aSb | ab` to CNF.

<details>
<summary>Answer</summary>

Current rules: `S → aSb | ab`

Step 1: No unit productions. No ε-productions (S doesn't produce ε). No need for new start.

Step 2: Handle long rules. `aSb` has length 3, `ab` has length 2 but with two terminals.

Introduce terminal variables:
```
Tₐ → a
T_b → b
```

Rewrite:
```
S  → TₐST_b | TₐT_b   (replace a and b with variables)
Tₐ → a
T_b → b
```

Now `TₐST_b` has length 3 — split it:
```
A₁ → ST_b       (new variable)
S  → TₐA₁ | TₐT_b
```

Final CNF:
```
S  → TₐA₁ | TₐT_b
A₁ → ST_b
Tₐ → a
T_b → b
```

Every production: `A → BC` or `A → a`. CNF complete. ✓

Verify: `S → TₐA₁ → TₐST_b → TₐTₐA₁T_b → TₐTₐST_bT_b → TₐTₐTₐT_bT_bT_b → aaabbb` ✓
</details>

---

**Q3.** Is the following grammar ambiguous? `S → SS | (S) | ε`. If so, show two different parse trees for the same string.

<details>
<summary>Answer</summary>

**Yes, it's ambiguous.** Consider `()()`:

**Parse tree 1:** `S → SS`, left S → `(S)` → `()`, right S → `(S)` → `()`
```
    S
   / \
  S   S
 /|\ /|\
( S )( S )
  |    |
  ε    ε
```

**Parse tree 2:** `S → SS`, left S → `SS` where each sub-S → `(S)` → `()`, right S → ε:
```
      S
     / \
    S   S
   / \  |
  S   S ε
 /|\ /|\
( S )( S )
  |    |
  ε    ε
```

In tree 2, the root produces `SS` where the right S → ε, and the left S produces the full `()()` via another `SS` split.

Both derivations produce `()()` but have different tree structures. Grammar is ambiguous.

(The grammar is still *correct* — it generates the right language — but the ambiguity matters for parsing: a parser would have multiple choices at each step, leading to exponential backtracking.)
</details>

---

**Q4.** Why can't you intersect two CFLs and always get a CFL? Give the simplest counterexample.

<details>
<summary>Answer</summary>

**Counterexample:**
```
L₁ = {aⁿbⁿcᵏ | n,k ≥ 0}  (count a's and b's, ignore c's)
L₂ = {aᵏbⁿcⁿ | n,k ≥ 0}  (ignore a's, count b's and c's)
```

CFG for L₁: `S → TU, T → aTb | ε, U → Uc | ε`
CFG for L₂: `S → VW, V → Va | ε, W → bWc | ε`

Both are clearly CFLs (two-counter matching with a free third symbol).

`L₁ ∩ L₂ = {aⁿbⁿcⁿ | n ≥ 0}` — strings with equal counts of all three symbols.

We'll prove in Chapter 7 (CFL Pumping Lemma) that `{aⁿbⁿcⁿ}` is NOT context-free — intuitively, a stack can only match two "brackets" at a time, not three simultaneously.

**Why this proves CFLs aren't closed under intersection:** L₁ ∈ CFL, L₂ ∈ CFL, but L₁ ∩ L₂ ∉ CFL. If CFLs were closed, the intersection would have to be a CFL — contradiction.
</details>

---

**Q5.** A compiler has the grammar rule `E → E + E | E * E | num`. Rewrite it to be unambiguous with correct precedence (multiplication before addition) and left-associativity for both operators.

<details>
<summary>Answer</summary>

The standard fix: introduce grammar levels that force precedence through structure.

```
E → E + T | T       (* lower precedence, left-assoc *)
T → T * F | F       (* higher precedence, left-assoc *)
F → num             (* base case *)
```

**Left-associativity check:** `1 + 2 + 3` parses as:
```
E → E + T → (E + T) + T → ((T) + T) + T → ((1) + 2) + 3 = (1+2)+3 ✓
```

Left-recursion ensures `E + T` binds the *left* first.

**Precedence check:** `1 + 2 * 3` parses as:
```
E → E + T                    (use E+T)
  → T + T                    (E degrades to T)
  → 1 + T                    (T → F → num = 1)
  → 1 + T * F                (T expands via T*F)
  → 1 + 2 * 3                (fill in numbers)
```

Tree: `(+, 1, (*, 2, 3))` — multiplication is lower in tree = evaluated first. ✓

**Unambiguous check:** any string has exactly one parse tree because each operator can only appear at its designated grammar level — `+` only at the E level, `*` only at the T level.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---------|-----------|
| CFG | 4-tuple (V, Σ, R, S); rules `A → w`; replaces single variables |
| Derivation | sequence of rule applications; ⇒* is reflexive-transitive closure |
| Parse tree | visual derivation; leaves = derived string |
| Ambiguity | two distinct parse trees for one string; some CFLs inherently ambiguous |
| CNF | all rules are `A→BC`, `A→a`, or `S→ε`; needed for CYK |
| CYK | O(n³|G|) DP algorithm; T[i][j] = variables deriving wᵢ..wⱼ |
| Closure | closed under ∪, ·, *, reversal; NOT closed under ∩ or complement |
| CFL ∩ Regular | always a CFL (run PDA + DFA in parallel — Chapter 6) |

**Where we go next:** Chapter 6 introduces Pushdown Automata (PDAs) — the machine model equivalent to CFGs. We'll prove that PDA languages = CFLs, then use PDAs to understand closure under intersection with regular languages.

---

*Previous: [04 — Pumping Lemma for Regular Languages](04_Pumping_Lemma.md)*
*Next: [06 — Pushdown Automata](06_Pushdown_Automata.md)*
