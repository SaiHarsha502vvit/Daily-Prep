# Chapter 12 — Boolean Algebra & Circuits

> [< Previous: 11 Graph Theory Foundations](11_Graph_Theory_Foundations.md) | [Course Index](README.md)

---

## Closing the Loop

You started this course with propositional logic in Chapter 01: propositions that are TRUE or FALSE, connected by ∧ (AND), ∨ (OR), ¬ (NOT), → (implies), ↔ (biconditional).

Boolean algebra is the same system — but studied from the hardware side. When an engineer designs a CPU, they're building physical mechanisms (transistors → logic gates → circuits) that implement Boolean operations. The mathematics of propositional logic IS the mathematics of digital hardware.

By the end of this chapter, you'll see:
- Why De Morgan's laws matter for circuit optimization.
- How a truth table becomes a circuit.
- Why SAT (Boolean satisfiability) is the canonical NP-complete problem.
- How bitwise operations in your code are literally Boolean algebra at the instruction level.

---

## Boolean Variables and Operations

A **Boolean variable** takes values in {0, 1} (false/true, off/on, LOW/HIGH).

The three fundamental operations:

| Operation | Symbol | Logic | Gates |
|-----------|--------|-------|-------|
| NOT | ¬A, A̅, ~A | complement | inverter |
| AND | A·B, A∧B, AB | conjunction | AND gate |
| OR | A+B, A∨B | disjunction | OR gate |

**Priority:** NOT binds tightest, then AND, then OR (just like × before + in arithmetic).

**XOR (exclusive OR):** A ⊕ B = (A ∨ B) ∧ ¬(A ∧ B) = "exactly one of A, B is true."

XOR is the cornerstone of error detection, encryption (one-time pad), and parity bits.

---

## Boolean Algebra Laws

These are the same identities from Chapter 05 (sets) and Chapter 01 (logic) — unified:

| Law | AND form | OR form |
|-----|----------|---------|
| Identity | A · 1 = A | A + 0 = A |
| Annihilation | A · 0 = 0 | A + 1 = 1 |
| Idempotence | A · A = A | A + A = A |
| Complement | A · Ā = 0 | A + Ā = 1 |
| Double negation | ¬(¬A) = A | — |
| Commutativity | A·B = B·A | A+B = B+A |
| Associativity | (A·B)·C = A·(B·C) | (A+B)+C = A+(B+C) |
| Distributivity | A·(B+C) = A·B + A·C | A+(B·C) = (A+B)·(A+C) |
| De Morgan | ¬(A·B) = Ā + B̄ | ¬(A+B) = Ā · B̄ |
| Absorption | A·(A+B) = A | A+(A·B) = A |

**The law of duality:** Any Boolean identity remains valid if you swap AND↔OR and 0↔1 throughout. This is why AND/OR laws always come in pairs.

---

## Logic Gates: Hardware Implements Algebra

A **logic gate** is a physical device (implemented with transistors) that computes a Boolean function.

```
AND gate:     A ──┐
              B ──┤>── A·B

OR gate:      A ──┐
              B ──┤≥1── A+B

NOT gate:     A ──┤o── Ā

NAND gate:    A ──┐
              B ──┤>o── ¬(A·B) = Ā+B̄   (AND then NOT)

NOR gate:     A ──┐
              B ──┤≥1o── ¬(A+B) = Ā·B̄  (OR then NOT)

XOR gate:     A ──┐
              B ──┤=1── A⊕B
```

**NAND and NOR are functionally complete:** any Boolean function can be implemented using only NAND gates (or only NOR gates). This matters in chip manufacturing — using fewer gate types reduces production complexity.

**Proof that NAND is functionally complete:**
```
NOT A     = NAND(A, A)
A AND B   = NAND(NAND(A,B), NAND(A,B))  = NOT(NAND(A,B))
A OR B    = NAND(NAND(A,A), NAND(B,B))  = NAND(NOT A, NOT B) = ¬(Ā·B̄) = A+B (De Morgan) ✓
```

---

## From Truth Table to Circuit: Sum of Products

**Problem:** Given a truth table, build a Boolean expression (and then a circuit) that produces the correct output.

**Minterm:** A product (AND) of all variables (negated or not) that evaluates to 1 for exactly one input row.

**Sum of Products (SOP) / canonical DNF:**  
Take all rows where the output is 1. For each such row, write the minterm. OR all minterms together.

**Example: XOR from truth table**

| A | B | A⊕B |
|---|---|-----|
| 0 | 0 | 0   |
| 0 | 1 | 1   | ← minterm: Ā·B
| 1 | 0 | 1   | ← minterm: A·B̄
| 1 | 1 | 0   |

**SOP form:** A⊕B = (Ā·B) + (A·B̄)

Circuit: two AND gates + one OR gate (plus NOT gates for Ā and B̄). Correct.

This procedure ALWAYS works: any truth table → SOP form → circuit. It's the mechanical translation from specification (truth table) to implementation (circuit).

---

## Minimization: Why Simplification Matters

The SOP form is correct but often not minimal. More gates = larger chip, higher cost, more power, more heat.

**Algebraic simplification:**

```
F(A, B, C) = A·B·C + A·B·C̄
           = A·B·(C + C̄)    [distributivity]
           = A·B·1           [complement law]
           = A·B             [identity]
```

Two 3-input AND gates + one OR gate → simplified to one 2-input AND gate. One gate eliminated.

### Karnaugh Maps (K-Maps)

A **Karnaugh map** is a visual tool for simplifying Boolean expressions by grouping minterms that differ in one variable.

**2-variable K-map for F = Ā·B + A·B:**

```
       B=0    B=1
A=0 │  0   │  1  │
A=1 │  0   │  1  │

Column B=1 is all 1s → F = B (A is irrelevant)
```

**3-variable K-map:** Gray code ordering (only one bit changes between adjacent cells) allows grouping:

```
         BC=00  BC=01  BC=11  BC=10
A=0  │   0   │   1   │   1   │   0   │
A=1  │   0   │   1   │   1   │   0   │
```

The 4 middle cells (BC=01, BC=11 in both A=0 and A=1 rows) group to: B (A and C cancel out).

**K-map grouping rules:**
- Groups must be rectangles of size 1, 2, 4, 8, ... (powers of 2).
- Groups may wrap around edges (the map is toroidal).
- Larger groups → fewer literals in the resulting term → simpler circuit.
- Choose fewest, largest non-overlapping groups that cover all 1-cells.

**K-maps are only practical up to 4-5 variables.** Beyond that, computer-aided design (CAD) tools use the Quine-McCluskey algorithm or modern SAT-based methods.

---

## The SAT Problem: Boolean Algebra Meets Complexity

**Boolean Satisfiability (SAT):**  
Given a Boolean formula, does there exist an assignment of TRUE/FALSE to its variables that makes the formula TRUE?

**Example:**  
F = (A ∨ B) ∧ (Ā ∨ C) ∧ (B̄ ∨ C̄)

Is F satisfiable? Try A=T, B=F, C=T:
- (T ∨ F) = T ✓
- (F ∨ T) = T ✓
- (T ∨ F) = T ✓

Yes — the formula is satisfiable. ✓

**Why SAT matters:**
- SAT was the FIRST problem proven NP-complete (Cook–Levin theorem, 1971).
- NP-complete means: every NP problem can be reduced to SAT in polynomial time.
- No polynomial-time algorithm for SAT is known. If you found one, you'd solve P vs NP.

**But SAT solvers work in practice:**
- Modern SAT solvers (MiniSAT, Z3, CaDiCaL) can solve instances with millions of variables in seconds.
- They use heuristics, unit propagation, CDCL (Conflict-Driven Clause Learning).
- Applications: hardware verification (prove a CPU design has no bugs), software model checking, AI planning, cryptographic attack tools.

---

## Bitwise Operations: Boolean Algebra in Your Code

Every programming language exposes Boolean algebra directly through bitwise operators:

| Boolean algebra | Java/TypeScript | Applies to |
|-----------------|----------------|------------|
| A AND B | `a & b` | Integers (bit by bit) |
| A OR B | `a \| b` | Integers |
| A XOR B | `a ^ b` | Integers |
| NOT A | `~a` | Integer (bitwise complement) |
| Left shift | `a << n` | Multiply by 2ⁿ |
| Right shift | `a >> n` | Divide by 2ⁿ |

**Power-of-2 check using Boolean algebra:**

n is a power of 2 iff n has exactly one bit set.

```java
boolean isPowerOf2(int n) {
    return n > 0 && (n & (n - 1)) == 0;
    // n     =  0001000  (e.g., 8)
    // n-1   =  0000111
    // n&(n-1) = 0000000 = 0 → exactly one bit set ✓
    
    // n     =  0001001  (9 — not power of 2)
    // n-1   =  0001000
    // n&(n-1) = 0001000 ≠ 0 → fails ✓
}
```

**Extracting bits (bitmask patterns):**

```java
// Set bit k: n | (1 << k)
// Clear bit k: n & ~(1 << k)
// Toggle bit k: n ^ (1 << k)
// Check if bit k is set: (n >> k) & 1
```

**Permission systems using bitmasks (real production code pattern):**

```typescript
const READ    = 0b001;  // 1
const WRITE   = 0b010;  // 2
const EXECUTE = 0b100;  // 4

let perms = READ | WRITE;   // 0b011 = 3

function can(perms: number, action: number): boolean {
    return (perms & action) !== 0;   // Boolean AND: is the bit set?
}

can(perms, READ);    // true
can(perms, EXECUTE); // false
```

This is UNIX file permissions (`rwx` = 7 = 111₂), Java's `AccessController`, and every bitmask flag system in existence. They are all Boolean algebra.

---

## Connecting the Course: Everything Was About Boolean Reasoning

Looking back at CSE101:

| Chapter | Concept | Boolean connection |
|---------|---------|-------------------|
| 01 | Propositional logic | Boolean algebra IS propositional logic |
| 02 | Quantifiers | ∀ = infinite AND, ∃ = infinite OR |
| 03 | Proofs | Proof by contradiction = show ¬P → F (Boolean 0) |
| 04 | Induction | Loop invariant = a Boolean property preserved by each step |
| 05 | Sets | Set operations ARE Boolean algebra on membership predicates |
| 06 | Relations | Relation membership is a Boolean predicate on pairs |
| 07 | Functions | Injectivity/surjectivity are Boolean properties of relations |
| 08-09 | Counting | Counting subsets = enumerating Boolean vectors |
| 10 | Recurrences | Memoization avoids recomputing Boolean subproblems |
| 11 | Graphs | Connectivity = reachability, a Boolean property |
| 12 | Boolean algebra | The unified algebraic system underlying all of it |

---

## Section Challenge

> ### Circuit Design from Spec to Implementation
>
> You're designing hardware logic for a priority encoder. Three input signals (A, B, C) represent button presses. Your output has two bits (Y₁, Y₀) that encode which button was pressed with highest priority (C > B > A). If no button is pressed, output is 00.
>
> Priority table:
> | C | B | A | Y₁ | Y₀ | Meaning |
> |---|---|---|----|----|---------|
> | 0 | 0 | 0 | 0  | 0  | No press |
> | 0 | 0 | 1 | 0  | 1  | A pressed |
> | 0 | 1 | 0 | 1  | 0  | B pressed |
> | 0 | 1 | 1 | 1  | 0  | B wins (B > A) |
> | 1 | 0 | 0 | 1  | 1  | C pressed |
> | 1 | 0 | 1 | 1  | 1  | C wins |
> | 1 | 1 | 0 | 1  | 1  | C wins |
> | 1 | 1 | 1 | 1  | 1  | C wins |
>
> **Question 1:** Write the canonical SOP expression for Y₁ and Y₀ from the truth table.
>
> **Question 2:** Simplify Y₁ and Y₀ algebraically (or using K-map reasoning).
>
> **Question 3:** Verify your simplified expressions produce the correct truth table.
>
> **Question 4:** What is the minimum gate count for Y₁ and Y₀ combined?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Canonical SOP from truth table

Rows where Y₁ = 1 (output bit 1 is high):
  C=0,B=1,A=0: C̄·B·Ā
  C=0,B=1,A=1: C̄·B·A
  C=1,B=0,A=0: C·B̄·Ā
  C=1,B=0,A=1: C·B̄·A
  C=1,B=1,A=0: C·B·Ā
  C=1,B=1,A=1: C·B·A

Y₁ = C̄·B·Ā + C̄·B·A + C·B̄·Ā + C·B̄·A + C·B·Ā + C·B·A

Rows where Y₀ = 1 (output bit 0 is high):
  C=0,B=0,A=1: C̄·B̄·A
  C=1,B=0,A=0: C·B̄·Ā
  C=1,B=0,A=1: C·B̄·A
  C=1,B=1,A=0: C·B·Ā
  C=1,B=1,A=1: C·B·A

Y₀ = C̄·B̄·A + C·B̄·Ā + C·B̄·A + C·B·Ā + C·B·A

──────────────────────────────────────────────────────────

QUESTION 2: Simplification

SIMPLIFY Y₁:

Group 1: C̄·B·Ā + C̄·B·A = C̄·B·(Ā+A) = C̄·B·1 = C̄·B
Group 2: C·B̄·Ā + C·B̄·A = C·B̄·(Ā+A) = C·B̄
Group 3: C·B·Ā + C·B·A  = C·B·(Ā+A)  = C·B

Y₁ = C̄·B + C·B̄ + C·B
   = C̄·B + C·(B̄+B)
   = C̄·B + C·1
   = C̄·B + C

Now apply absorption: C̄·B + C
  Can this simplify further? C̄·B + C = B·C̄ + C
  Use: X + X̄·Y = X + Y (absorption variant: C + C̄·B = C + B)
  
  Y₁ = B + C

VERIFY Y₁ = B + C:
  B=0, C=0 → 0 ✓ (rows 0: Y₁=0, row 1: Y₁=0)
  B=1, C=0 → 1 ✓ (rows 2, 3: Y₁=1)
  B=0, C=1 → 1 ✓ (rows 4, 5: Y₁=1)
  B=1, C=1 → 1 ✓ (rows 6, 7: Y₁=1) ✓

──────────────────────────────────────────────────────────

SIMPLIFY Y₀:

Y₀ = C̄·B̄·A + C·B̄·Ā + C·B̄·A + C·B·Ā + C·B·A

Group: C·B̄·Ā + C·B̄·A = C·B̄·(Ā+A) = C·B̄
Group: C·B·Ā + C·B·A  = C·B·(Ā+A)  = C·B

Y₀ = C̄·B̄·A + C·B̄ + C·B
   = C̄·B̄·A + C·(B̄+B)
   = C̄·B̄·A + C·1
   = C̄·B̄·A + C

Apply absorption variant: C + C̄·B̄·A = C + B̄·A (since C + C̄·X = C + X)

Y₀ = C + B̄·A = C + Ā̄·B  (Ā̄ = A, so Y₀ = C + A·B̄)

Wait, let me redo: C̄·B̄·A — here C̄ means NOT C, B̄ means NOT B.
  C + C̄·(B̄·A) = C + B̄·A (absorption: X + X̄·Z = X + Z where Z = B̄·A)

Y₀ = C + A·B̄

VERIFY Y₀ = C + A·B̄:
  C=0, B=0, A=0: 0 + 0·1 = 0 ✓ (row 0: Y₀=0)
  C=0, B=0, A=1: 0 + 1·1 = 1 ✓ (row 1: Y₀=1)
  C=0, B=1, A=0: 0 + 0·0 = 0 ✓ (row 2: Y₀=0)
  C=0, B=1, A=1: 0 + 1·0 = 0 ✓ (row 3: Y₀=0)
  C=1, B=0, A=0: 1 + 0·1 = 1 ✓ (row 4: Y₀=1)
  C=1, B=0, A=1: 1 + 1·1 = 1 ✓ (row 5: Y₀=1)
  C=1, B=1, A=0: 1 + 0·0 = 1 ✓ (row 6: Y₀=1)
  C=1, B=1, A=1: 1 + 1·0 = 1 ✓ (row 7: Y₀=1) ✓

──────────────────────────────────────────────────────────

QUESTION 3: Verified above (all 8 rows checked for both outputs). ✓

──────────────────────────────────────────────────────────

QUESTION 4: Minimum gate count

Y₁ = B + C
  1 OR gate. Gate count: 1.

Y₀ = C + A·B̄
  1 NOT gate (for B̄)
  1 AND gate (for A·B̄)
  1 OR gate (for C + A·B̄)
  Gate count: 3.

TOTAL: 4 gates (1 OR + 1 NOT + 1 AND + 1 OR)

If B̄ is already available (e.g., as a complement output from a flip-flop):
TOTAL: 3 gates.

COMPARE TO CANONICAL SOP:
  Y₁ canonical: 6 AND gates + 1 OR-of-6 gate = 7 gates (approx)
  Y₀ canonical: 5 AND gates + 1 OR-of-5 gate = 6 gates (approx)
  Total canonical: ~13 gates

  Simplified: 4 gates
  Reduction: ~9 gates saved for a 3-input 2-output circuit.

At VLSI scale (millions of gates), algebraic minimization is a critical cost factor.
This is exactly what hardware synthesis tools (Synopsys Design Compiler, Cadence Genus)
do automatically: minimize gate count while preserving logical equivalence.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing bit operations with logical operations in code**
- `&` (bitwise AND) vs `&&` (logical AND) in Java/C++. 
- `&&` short-circuits (stops if first operand is false). `&` evaluates both and operates on all bits.
- `if (x != null && x.isEmpty())` is correct. `if (x != null & x.isEmpty())` can NullPointerException.

**Mistake 2: K-map grouping errors**
- Groups MUST be rectangles with sizes that are powers of 2: 1, 2, 4, 8.
- A 3-cell group is NOT valid. You must cover it with overlapping 2-cell groups.
- Groups CAN wrap: the left column and right column are "adjacent" in a toroidal K-map.

**Mistake 3: Thinking De Morgan's law reverses precedence**
- ¬(A+B) = Ā·B̄ — correct. The ¬ distributes, AND and OR SWAP.
- ¬(A+B)·C ≠ (Ā·B̄)·C̄ — De Morgan applies to (A+B) only, not the ·C part.

**Mistake 4: Assuming SOP is always the minimum implementation**
- SOP (sum of products) gives a 2-level circuit (AND-OR) which is fast, but not always minimum.
- Product of Sums (POS = OR-AND) or NAND-NAND implementations may use fewer gates.
- Modern synthesis tools explore multiple representations.

---

## Course Capstone: What You Now Can Do

You started Chapter 01 not knowing what a formal proof was. By Chapter 12, you have:

- **Logic (Ch01-02):** translate any English claim into formal logic, evaluate its truth, negate it precisely.
- **Proofs (Ch03-04):** prove or disprove claims using direct proof, contradiction, contrapositive, induction.
- **Sets (Ch05):** model collections, operations, and power sets; apply inclusion-exclusion.
- **Relations (Ch06):** classify relations by their properties; identify equivalence relations and partial orders.
- **Functions (Ch07):** distinguish injective/surjective/bijective; compose and invert; connect to injectability and counting.
- **Counting (Ch08-09):** count permutations and combinations; apply pigeonhole for guaranteed collisions and impossibility proofs.
- **Recurrences (Ch10):** write and solve recurrences; apply Master Theorem; connect to DP.
- **Graphs (Ch11):** model relationships as graphs; reason about connectivity, cycles, and DAG ordering.
- **Boolean Algebra (Ch12):** translate between truth tables, algebraic expressions, and circuits; simplify using laws and K-maps.

**The proof portfolio (course capstone):** Write 10 proofs, at least 3 from CS applications. This is not busywork — it's the forcing function that reveals whether you've internalized the material or just followed along. Every CS graduate who can prove things on demand has an advantage that never expires.

---

> [< Previous: 11 Graph Theory Foundations](11_Graph_Theory_Foundations.md) | [Course Index](README.md)

---

*CSE101 Discrete Mathematics — Course Complete. Continue to CSE102 Programming Fundamentals →*
