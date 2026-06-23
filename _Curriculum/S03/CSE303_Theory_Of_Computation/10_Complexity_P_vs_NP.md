# Chapter 10 — Complexity Theory: P vs NP

> "Decidability asks: can it be solved? Complexity asks: can it be solved *fast*? The P vs NP question is whether 'easy to check' implies 'easy to find'."

---

## The Shift from Decidability to Complexity

Chapter 9 drew the line between what can and cannot be computed. Now we work inside the "can be computed" region and ask *how efficiently*.

**The key insight driving complexity:** Many problems are easy to *verify* but seem hard to *solve*. 

Examples:
- **Sudoku:** Given a filled-in board, checking correctness is trivial (scan rows/columns/boxes). Finding a solution to a partially filled board can take hours of backtracking.
- **Factoring:** Given n=15, checking that 3×5=15 is instant. Finding the factors of a 2048-bit RSA modulus is believed to take billions of years.
- **Traveling Salesman:** Given a complete route, checking its total length is O(n). Finding the *shortest* route requires (naively) checking n! permutations.

**The P vs NP question:** Is there always an efficient *search* algorithm when verification is efficient?

---

## 10.1 Time Complexity Classes

### Big-O Recap

`f(n) = O(g(n))` iff there exist constants c, n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀.

**Running time of TM M on input w:** the number of steps before M halts.

**Time complexity of language L:** `t_M(n) = max{|steps| : M on input of length n}` — worst-case over all inputs of length n.

### The Class P

`P` = the class of languages decidable by a deterministic TM in polynomial time:

```
P = ⋃_{k≥0} TIME(nᵏ)
```

where `TIME(f(n))` = languages decidable in O(f(n)) steps.

**P is robust:** Changing the model (multi-tape TM, RAM machine, Java program) only changes running time by a polynomial factor, not exponential. So P is machine-model independent.

**Examples in P:**
- Sorting (O(n log n))
- Shortest path in a graph (Dijkstra O(E log V))
- Testing if a number is prime (AKS algorithm — famously proved in 2002, O(n^6))
- Maximum flow in a network (O(VE) with BFS-based Ford-Fulkerson)
- Linear programming (ellipsoid method O(n^6 L²) where L = input bit length)

### The Class NP

`NP` = the class of languages decidable by a **nondeterministic** TM in polynomial time.

Equivalently (and more useful): L ∈ NP iff there exists a polynomial-time **verifier** V such that:

```
w ∈ L ⟺ ∃ certificate c of length poly(|w|) such that V(w, c) accepts
```

The certificate c is a "witness" — a short proof of membership that V can check efficiently.

**Examples in NP:**
- **SAT (Boolean Satisfiability):** Given formula φ, is there a truth assignment making φ true? Certificate: the truth assignment. Verifier: plug in values, evaluate φ in O(n).
- **CLIQUE:** Does graph G have a k-clique? Certificate: the k nodes. Verifier: check all edges, O(k²).
- **Hamiltonian Path:** Is there a path visiting each node exactly once? Certificate: the path. Verifier: check each edge exists, check each node visited once, O(n).
- **Vertex Cover:** Is there a set S of ≤ k vertices covering every edge? Certificate: S. Verifier: for each edge, check one endpoint is in S. O(E).
- **Subset Sum:** Given integers S and target t, does some subset sum to t? Certificate: the subset. Verifier: check sum, O(n).

**P ⊆ NP:** Every P problem has a polynomial-time decider. The verifier ignores the certificate and just runs the decider. So P ⊆ NP.

**Is P = NP?** Unknown. The Clay Mathematics Institute offers $1,000,000 for a proof or disproof. Most researchers believe P ≠ NP, but no proof exists.

---

## 10.2 The NP Definition via Verifiers — Why Equivalent

**Claim:** NTIME(n^k) = languages with poly-time verifiers.

**Direction 1 (NTM → Verifier):** Given NTM N running in time n^k, the verifier V on (w, c) simulates the nondeterministic branch described by c (interpret c as the sequence of nondeterministic choices). If that branch accepts: V accepts. Time: O(n^k).

**Direction 2 (Verifier → NTM):** Given verifier V for L, build NTM N: nondeterministically guess certificate c of length poly(n), then run V(w,c). If V accepts: accept. Time: poly(n) (guess + verify).

This equivalence is why we mostly think in terms of verifiers — they're more intuitive than nondeterminism.

---

## 10.3 The P vs NP Landscape

```
All languages
    ⊆
Decidable
    ⊆
NP-hard (problems at least as hard as any NP problem)
    ⊇
NP-complete (hardest NP problems: in NP AND NP-hard)
    ⊇  
?
NP
    ⊇
P
```

The unknown: is P = NP? If yes, the entire diagram collapses and NP-hard problems become tractable. If P ≠ NP (believed), then NP-complete problems lie strictly between P and NP-hard.

**What we DO know:**
- P ⊆ NP (trivially)
- NP is contained in EXPTIME = TIME(2^(n^k)) (by explicit NTM branch search)
- P ≠ EXPTIME (time hierarchy theorem: more time gives strictly more power)
- Therefore P ⊆ NP ⊆ EXPTIME, and at least one of P⊊NP or NP⊊EXPTIME must be strict (likely both)

---

## 10.4 Polynomial-Time Reductions

**Definition:** A **polynomial-time many-one reduction** from A to B (A ≤_p B) is a computable function f with poly-time computation such that:

```
w ∈ A ⟺ f(w) ∈ B
```

**Closure:** If A ≤_p B and B ∈ P, then A ∈ P.

**Contrapositive:** If A ≤_p B and A ∉ P (assuming P ≠ NP, if A is NP-complete), then B ∉ P.

**Transitivity:** If A ≤_p B and B ≤_p C, then A ≤_p C.

Poly-time reductions form the core tool for NP-completeness proofs. Chapter 11 will use them extensively.

---

## 10.5 NP-Completeness

**Definition:** A language B is **NP-hard** if A ≤_p B for every A ∈ NP.

**Definition:** B is **NP-complete** if B ∈ NP AND B is NP-hard.

If B is NP-complete, B is the "hardest problem in NP" in the sense that solving B efficiently solves everything in NP.

**The Cook-Levin Theorem (1971):** SAT is NP-complete.

This is the first result — it requires showing directly (from the NTM definition) that every NP problem reduces to SAT. Chapter 11 covers the proof.

**Consequences:**
- If SAT ∈ P, then P = NP.
- If P ≠ NP, then SAT ∉ P (no polynomial algorithm exists).
- Since SAT is NP-complete, showing A ≤_p SAT (any A ∈ NP) is trivial — we get it for free.
- To prove B is NP-complete: show B ∈ NP and that SAT ≤_p B (or any other known NP-complete problem reduces to B).

---

## 10.6 The Time Hierarchy Theorem

**Theorem:** For time-constructible f with f(n) log f(n) = o(g(n)):

```
TIME(f(n)) ⊊ TIME(g(n))
```

**Corollary:** P ⊊ EXPTIME (proper subset).

**Proof sketch (diagonalization again):** Build a TM D that:
1. On input M#x (encoding of M and x), check if |M#x| ≤ f(n) and M accepts M#x within g(n) steps.
2. If yes: reject. If no: accept.

D decides a language not in TIME(f(n)) but in TIME(g(n)) — more time gives strictly more power.

**Why this matters:** Even though we can't prove P ≠ NP, we know: P ≠ EXPTIME. Problems solvable in exponential time include things no polynomial algorithm can solve. The P vs NP question is whether the gap between "polynomial" and "exponential" actually contains any natural NP problems.

---

## 10.7 The World If P = NP

Most researchers believe P ≠ NP. But it's worth understanding what P = NP would mean:

**Positive consequences:**
- RSA and elliptic-curve cryptography become broken (factoring ∈ P)
- Drug discovery: protein folding optimization ∈ P → instant drug design
- AI: training neural networks to optimality ∈ P (weight optimization)
- Mathematics: automated theorem proving ∈ P (checking proofs is P → finding proofs is too)

**Negative consequences:**
- All public-key cryptography collapses (TLS, HTTPS, SSH)
- Privacy and secure communication at internet scale become impossible
- The "digital lock" securing modern commerce disappears

**The asymmetry:** P = NP would be simultaneously the greatest scientific breakthrough (efficient optimization) and the greatest security catastrophe (all secrets broken).

---

## 10.8 Complexity Classes Beyond NP

The P/NP question is famous, but the complexity landscape is richer:

| Class | Machine Model | Meaning |
|-------|--------------|---------|
| P | DTM, poly time | fast to decide |
| NP | NTM, poly time | fast to verify |
| co-NP | NTM, poly time (for complement) | fast to verify non-membership |
| PSPACE | DTM, poly SPACE | poly-space computation |
| EXPTIME | DTM, exp time | exponential time |
| #P | counting machine | count NP witnesses (e.g., count satisfying assignments) |

**Key relationships:**

```
P ⊆ NP ∩ co-NP ⊆ NP ∪ co-NP ⊆ PSPACE ⊆ EXPTIME
```

**NP vs co-NP:** Is NP = co-NP? Equivalent to: if a problem has short proofs of membership (NP), does it also have short proofs of non-membership? Likely not, but also unproven.

For example, SAT ∈ NP (short proof: satisfying assignment). The complement of SAT: "given φ, is φ unsatisfiable?" = UNSAT. A short proof of unsatisfiability would require checking all 2ⁿ assignments — believed to not exist. UNSAT ∈ co-NP, and it's believed UNSAT ∉ NP.

**PSPACE:** Polynomial-space TMs can use exp time (they can revisit configurations). Many two-player game problems (chess, Go, generalized versions) are PSPACE-complete.

---

## 10.9 Practical Algorithms for NP-Complete Problems

Since P ≠ NP is believed (and NP-complete problems appear everywhere), we don't give up — we develop practical strategies:

### 1. Heuristics and Local Search

**Simulated annealing, genetic algorithms:** probabilistic search that works well in practice for TSP and scheduling. No worst-case guarantee.

### 2. Approximation Algorithms

For optimization versions of NP-hard problems:

- **TSP approximation (metric case):** Christofides algorithm gives 3/2-approximation.
- **Vertex Cover:** 2-approximation (match greedily — any maximal matching gives ≤ 2 × OPT).
- **Max Cut:** Simple greedy gives 1/2-approximation; GW algorithm (SDP relaxation) gives 0.878-approximation.

**Inapproximability (assuming P ≠ NP):** Some problems can't be approximated within a constant factor unless P = NP:
- TSP without metric constraint: no constant-factor approximation unless P = NP.
- Max Clique: no n^(1-ε)-approximation.

### 3. Parameterized Complexity

If a parameter k is small (even if n is large), some NP-complete problems become tractable.

- **k-Vertex Cover:** Can be solved in O(2^k · n) — "fixed-parameter tractable" (FPT).
- **k-Clique:** O(n^(k/3)) — polynomial for fixed k.

This is the **FPT (Fixed Parameter Tractable)** complexity class, a fruitful area for practical algorithm design.

### 4. SAT Solvers

Modern SAT solvers (DPLL + CDCL: Conflict-Driven Clause Learning) routinely solve industrial instances with millions of variables. They exploit structure, learn clauses, and use heuristic variable ordering. Not polynomial in theory — but in practice, most real instances have structure that solvers exploit.

---

## Section Challenge

---

**Q1.** Prove that the language `COMPOSITE = {<n> | n is a composite integer}` is in NP. (Note: PRIME ∈ P was proved in 2002 by AKS, which also implies COMPOSITE ∈ P. But prove the NP membership directly using a verifier.)

<details>
<summary>Answer</summary>

**Certificate:** A non-trivial factor f of n, where 1 < f < n.

**Verifier V(n, f):**
1. Check 1 < f < n. If not: reject.
2. Check that f divides n (compute n mod f, check = 0).
3. If both checks pass: accept.

**Correctness:**
- If n is composite: there exists such f (by definition). V accepts.
- If n is prime: no such f exists (the only factors are 1 and n). V rejects all certificates.

**Polynomial time:** Division of two k-digit numbers takes O(k²) time. |f| ≤ |n|, so V runs in poly(|n|) time.

COMPOSITE ∈ NP. ✓

**Note:** COMPOSITE ∈ P as well (via PRIME ∈ P, and complement). But the NP certificate-based argument is simpler to state and predates the AKS result by decades.
</details>

---

**Q2.** Show that if A ≤_p B and B ≤_p C, then A ≤_p C. (Polynomial reductions are transitive.)

<details>
<summary>Answer</summary>

By hypothesis:
- A ≤_p B: there exists poly-time computable f with `w ∈ A ⟺ f(w) ∈ B`.
- B ≤_p C: there exists poly-time computable g with `y ∈ B ⟺ g(y) ∈ C`.

**Compose:** define h(w) = g(f(w)).

**h is poly-time computable:** f runs in O(n^j) time, producing output of length O(n^j). Then g runs on that output in O((n^j)^k) = O(n^(jk)) time. Total: poly(n). ✓

**Correctness:**
```
w ∈ A ⟺ f(w) ∈ B   (by definition of f)
       ⟺ g(f(w)) ∈ C  (by definition of g)
       ⟺ h(w) ∈ C    (by definition of h)
```

Therefore A ≤_p C via h. □

**Why this matters:** Once SAT is proved NP-complete, reductions chain. If we show Clique ≤_p IndependentSet ≤_p VertexCover ≤_p SAT, every link in the chain is a poly-time reduction, and the full chain is also poly-time.
</details>

---

**Q3.** Give a poly-time verifier for the CLIQUE problem: given graph G = (V,E) and integer k, does G have a clique (complete subgraph) of size k?

<details>
<summary>Answer</summary>

**Certificate:** A set S ⊆ V of k vertices claimed to form a clique.

**Verifier V(G=(V,E), k, S):**
1. Check |S| = k. If not: reject.
2. For every pair (u,v) ∈ S × S with u ≠ v: check that (u,v) ∈ E. If any pair not in E: reject.
3. Accept.

**Correctness:**
- If G has a k-clique: let S be one. |S| = k and all C(k,2) pairs are edges → V accepts. ✓
- If G has no k-clique: no valid S exists → for any S of size k, at least one pair missing → V rejects all certificates. ✓

**Polynomial time:** Step 1: O(k). Step 2: O(k²) pair checks, each O(1) with adjacency matrix. Total: O(k²) ≤ O(|V|²) = poly(|G|). ✓

CLIQUE ∈ NP. ✓

**Note:** Checking that a clique exists for ALL sizes simultaneously (finding the maximum clique) is MAX-CLIQUE, which is an optimization version. CLIQUE (decision version, given k) ∈ NP, and MAX-CLIQUE ∈ NP (binary search on k). Both are NP-complete (or NP-hard for the optimization version).
</details>

---

**Q4.** Show that if P = NP, then every NP problem except ∅ and Σ* has a polynomial-time algorithm.

<details>
<summary>Answer</summary>

**If P = NP:** Every language in NP is also in P (by definition of P = NP).

**The exceptions ∅ and Σ*:** These are trivial languages — they're already in P:
- ∅ (reject everything) is decided in O(1): always reject.
- Σ* (accept everything) is decided in O(1): always accept.

They're trivially in P and in NP (though they're degenerate: every certificate works for Σ*, no certificate works for ∅).

**Every other NP language L:** By P = NP, L ∈ P, so it has a polynomial-time decider. ✓

**Why this is notable:** It means the AKS primality algorithm (which *proved* PRIME ∈ P in 2002) would be implied just by P = NP — you wouldn't need the specific algebraic construction. But AKS is a *constructive* polynomial algorithm; P = NP just says one *exists*.

**The caveat:** P = NP existence proofs don't necessarily give practical algorithms — the polynomial could be n^1000. The AKS bound n^6 (roughly) is much better than a purely existential argument would guarantee.
</details>

---

**Q5.** The 3-COLORING problem: given a graph G, can its vertices be colored with 3 colors so no two adjacent vertices share a color? Show that 3-COLORING ∈ NP and explain why it matters for map-coloring applications.

<details>
<summary>Answer</summary>

**3-COLORING ∈ NP:**

Certificate: a function c: V → {1, 2, 3} assigning each vertex a color.

Verifier V(G=(V,E), c):
1. For each vertex v: check c(v) ∈ {1,2,3}. O(|V|).
2. For each edge (u,v) ∈ E: check c(u) ≠ c(v). O(|E|).
3. Accept if all checks pass.

Time: O(|V| + |E|) = poly(|G|). Certificate length: |V| × log(3) bits = poly(|G|). ✓

3-COLORING ∈ NP. ✓

**Map coloring connection:** The four-color theorem (proved 1976) says any planar graph (corresponding to a map where regions are vertices and shared borders are edges) can be 4-colored. But determining if a planar graph is 3-colorable is NP-complete.

**Applications:**
- **Register allocation in compilers:** Variables that are "live" at the same time can't share a register. Assign k registers = k-color the interference graph. k=3 (or small k) is NP-complete, so compilers use heuristics.
- **Frequency assignment (wireless networks):** Cells using the same frequency interfere → color cells with frequencies. k-coloring for small k = NP-complete.
- **Scheduling:** Tasks that conflict (share a resource) → assign time slots (colors). k-coloring the conflict graph.

3-COLORING is NP-complete (proved via reduction from 3-SAT — Chapter 11). This means these scheduling/allocation problems are fundamentally hard unless P = NP.
</details>

---

## Chapter Summary

| Concept | Key Point |
|---------|-----------|
| P | Decidable in poly-time deterministically; model-robust |
| NP | Decidable by NTM in poly-time = languages with poly-time verifiers + poly certificates |
| P ⊆ NP | Every P decider ignores certificate and runs directly |
| P vs NP | Unknown; believed P ≠ NP; $1M Clay prize |
| Poly-time reduction | A ≤_p B: f computable in poly, w∈A ⟺ f(w)∈B |
| NP-hard | Every NP problem poly-reduces to it |
| NP-complete | In NP AND NP-hard; Cook-Levin: SAT is NP-complete |
| Practical responses | Heuristics, approximation, parameterized, SAT solvers |
| Time hierarchy | P ⊊ EXPTIME (strictly; more time = more power) |

**Where we go next:** Chapter 11 proves SAT is NP-complete (Cook-Levin theorem) and builds the full reduction chain: SAT → 3-SAT → Clique → Vertex Cover → Independent Set → Hamiltonian Path.

---

*Previous: [09 — Decidability and the Halting Problem](09_Decidability_Halting_Problem.md)*
*Next: [11 — NP-Completeness and Reduction Chains](11_NP_Completeness.md)*
