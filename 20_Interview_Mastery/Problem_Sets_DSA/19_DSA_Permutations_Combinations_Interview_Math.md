**Navigation**: [⬅ SQL Foundations from Notes](../Problem_Sets_SQL/18_SQL_Foundations_Commands_Operators_Functions.md) | [📚 Index](../00_INDEX.md) | [Next: Bitwise Trie Interview Guide ➡](20_Bitwise_Trie_Interview_Guide.md)

# File 19 — DSA Permutations & Combinations: Math-First Logic, Interview Narration, Then Coding

## Why This File Exists

You identified an important gap: permutations/combinations were present in problem files, but the **deep math reasoning + communication style** was missing.

This chapter fixes that in your preferred order:

1. Plain logic and counting math
2. Decision framework (which model to use)
3. Interview narration (how to explain)
4. Language-specific implementation details (only after logic)

---

## 1) Core Math Language You Must Speak in Interviews

## 1.1 Factorial and counting base

- $n! = n \times (n-1) \times \dots \times 1$
- Interpretation: number of ways to arrange $n$ distinct items in order

Examples:

- 3 letters (A,B,C): $3! = 6$ orders
- 5 distinct numbers: $5! = 120$ permutations

## 1.2 Permutation formula (order matters)

Choose and arrange $r$ items from $n$:

$$
{}^nP_r = \frac{n!}{(n-r)!}
$$

Meaning: pick first position in $n$ ways, second in $n-1$, ..., $r$-th in $n-r+1$ ways.

## 1.3 Combination formula (order does not matter)

Choose $r$ items from $n$ without ordering:

$$
{}^nC_r = \frac{n!}{r!(n-r)!}
$$

Relation:

$$
{}^nP_r = {}^nC_r \cdot r!
$$

Interpretation: combinations times internal ordering of chosen set.

## 1.4 Multiset duplicates

If total $n$ items with repeats $a,b,c,...$:

$$
\text{distinct permutations} = \frac{n!}{a!b!c!\dots}
$$

Example: AAB (3 letters, two A's)

$$
\frac{3!}{2!} = 3
$$

---

## 2) Interview Decision Tree: Permutation vs Combination vs Subset

Use this mental classifier:

1. "Does order change meaning?"

- yes -> permutation/sequence
- no -> combination/subset

2. "Do I need fixed size $k$?"

- yes -> choose/arrange $k$
- no -> all subsets/permutations

3. "Can an element repeat?"

- yes -> unbounded/reuse model
- no -> used-once model

4. "Are duplicates in input possible?"

- yes -> sort + duplicate-skip logic

5. "Need count only or actual lists?"

- count -> DP/combinatorics faster
- materialized lists -> backtracking

Interview one-liner:

"I first classify by order sensitivity and reuse policy, then choose between backtracking generation and DP/counting based on whether output is count-only or explicit list."

---

## 3) Product Rule, Sum Rule, Complement — The Hidden Backbone

🔬 **Section Challenge — 3) Product Rule, Sum Rule, Complement — The Hidden Backbone**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 3.1 Product rule

If step A has $x$ choices and step B has $y$ independent choices, total = $x \cdot y$.

Example: lock with 4 digits -> $10^4$ possibilities.

## 3.2 Sum rule

If options are mutually exclusive: total = add counts.

Example: select from branch CSE or EEE with no overlap -> add counts.

🔬 **Section Challenge — 3.2 Sum rule**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 3.3 Complement counting

Count total minus invalid.

Example: strings length 5 over digits with at least one repeated -> total $10^5$ minus all distinct $10P5$.

Interview line:

"When direct counting gets messy, I switch to complement counting because invalid patterns are easier to compute."

---

## 4) Problem Families with Logic-First Explanations

## Family A: Generate all permutations of distinct numbers

### Plain logic

- Build sequence position by position
- At each step choose one unused element
- Branching factor shrinks each level
- Stop when sequence length equals $n$

State:

- current path
- used set/boolean array

Complexity:

- states $\approx n!$
- each output copy costs $O(n)$
- total $O(n \cdot n!)$

Interview narration:

"This is an order-sensitive exhaustive generation. I model it as a permutation tree where each level fixes one position with an unused element."

## Family B: Permutations with duplicates

### Plain logic

Naive generation repeats same output due to equal values.

Fix:

- sort input
- when encountering equal values, only allow one branch ordering per level using skip rule

Skip rule concept:

"If current value equals previous and previous identical value was not used in this branch position, skip current to avoid symmetric duplicates."

## Family C: Combinations `n choose k`

### Plain logic

- Order irrelevant
- enforce increasing index selection
- each recursive call moves start forward

Complexity:

- outputs $\binom{n}{k}$
- each output length $k$
- total $O(k \cdot \binom{n}{k})$

Interview narration:

"I prevent reorder duplicates by only selecting future elements. This turns permutations into combinations."

## Family D: Combination Sum (reuse allowed)

### Plain logic

- pick candidate and either continue with same index (reuse) or move ahead
- prune when running sum exceeds target

Key distinction:

- reuse allowed -> recurse with same index
- reuse not allowed -> recurse with next index

## Family E: Subsets / power set

### Plain logic

Each element has two decisions:

- include
- exclude

Total subsets: $2^n$.

Interview line:

"Subset generation is binary decision per element, so search tree has $2^n$ leaves."

---

## 5) Pruning Strategy (Where Senior-Level Thinking Shows)

## 5.1 Bound-based pruning

If remaining best-case cannot beat target, cut branch.

## 5.2 Sum overflow pruning

In positive-only sets, if current sum > target, stop branch immediately.

## 5.3 Length pruning

If required length is $k$, and remaining elements are fewer than needed, stop.

## 5.4 Duplicate symmetry pruning

Sort first, skip equal values at same decision depth.

Interview line:

"I’m not just brute-forcing; I reduce search tree size using monotonic bounds and symmetry breaking."

---

## 6) Real-World Mapping (How to Explain Relevance)

## 6.1 Security / OTP / brute-force risk

- permutations/sequences count -> attack surface size
- informs rate-limit and lockout policy

🔬 **Section Challenge — 6.1 Security / OTP / brute-force risk**

**Challenge 1 (Reasoning):** JWT vs session cookies — what are the tradeoffs for a distributed microservices architecture?

<details><summary>Answer</summary>

JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed.

</details>

## 6.2 Team/route scheduling

- order-sensitive assignments -> permutation model
- choose subset of candidates -> combination model

## 6.3 Product bundles and recommendations

- customer bundle suggestions are combinations
- ranked display arrangements are permutations

## 6.4 A/B test group allocations

- choosing groups from user pool -> combinations
- ordering test execution pipelines -> permutations

Interview line:

"This is not just a puzzle; it models configuration space size in security, scheduling, and recommendation systems."

---

## 7) Communication Templates You Can Use in Live Interview

## Template 1 — classify problem quickly

"I’ll first classify whether order matters. If order matters, it’s permutation-style branching; if not, it’s combination/subset style with monotonic index progression."

## Template 2 — explain state and transition

"My state is current selection plus used elements and current depth/sum. Transition is choosing one valid next candidate; rollback restores state for sibling branches."

## Template 3 — explain complexity

"Worst case is exponential due to output size itself. Since we must enumerate results, lower complexity than output cardinality is impossible."

## Template 4 — explain pruning

"I sort and prune impossible branches early, which reduces average search significantly though worst-case remains exponential."

---

## 8) From Math Logic to Language-Specific Coding (After Logic is Clear)

You asked for language details only after plain logic; this is that final step.

## 8.1 Language-agnostic implementation checklist

1. Data structures:

- list for current path
- boolean/map for used
- result container

2. Recursion contract:

- function(path, start/used, remaining target)

3. Base conditions:

- path length met OR target met

4. Undo step:

- remove last choice
- unmark used

5. Duplicate handling:

- sorted input + skip condition

## 8.2 Java-specific implementation notes

- use `ArrayList` for path/result
- copy path when adding result: `new ArrayList<>(path)`
- prefer boolean[] for used when indices are stable
- sort with `Arrays.sort(nums)` before duplicate skip
- avoid global mutable state in multithreaded contexts

## 8.3 Python-specific notes

- list append/pop natural for backtracking
- use `path.copy()` on result add
- sort first for duplicate skip

## 8.4 SQL-style note (count-only combinatorics)

When only counts are needed (not full generated sets), avoid recursive generation and compute combinatorial counts via formulas or DP tables.

---

## 9) Common Mistakes and How to Avoid Them

1. Treating combinations like permutations

- symptom: duplicate output orderings
- fix: enforce forward index

2. Forgetting rollback in backtracking

- symptom: corrupted path across branches
- fix: strict choose -> recurse -> unchoose

3. Ignoring duplicate handling

- symptom: repeated outputs
- fix: sort + level-based skip rule

4. Not pruning sum overflow

- symptom: timeout on combination sum
- fix: monotonic pruning after sort

5. Wrong complexity claim

- symptom: claiming polynomial
- fix: tie complexity to output size

---

## 10) Mini Practice Set (Logic Prompts)

1. "Choose 3 committee members out of 10" -> combination model; count and generate.
2. "Arrange 4 speakers in order" -> permutation model.
3. "Generate all unique seatings from [A, A, B, C]" -> duplicate-aware permutation.
4. "Find all 5-number lottery ticket sets from 1..49" -> combination without replacement.
5. "Find all item bundles summing to budget with item reuse" -> combination sum reuse model.
6. "Top-k ordered recommendations from candidate pool" -> permutation of size k.

---

## 11) One-Page Interview Summary

- Order matters -> permutation
- Order does not matter -> combination/subset
- Reuse allowed -> stay on same index
- Reuse not allowed -> move index forward
- Duplicates in input -> sort + skip symmetric branches
- Enumeration complexity follows output cardinality
- Always narrate: classification -> state -> transition -> pruning -> complexity

---

**Navigation**: [⬅ SQL Foundations from Notes](../Problem_Sets_SQL/18_SQL_Foundations_Commands_Operators_Functions.md) | [📚 Index](../00_INDEX.md) | [Next: Bitwise Trie Interview Guide ➡](20_Bitwise_Trie_Interview_Guide.md)


---

## Reality Check

**"Generating permutations and combinations is one technique"** — They branch on DIFFERENT trees with different bookkeeping ([04_Patterns/17, 22_Recursion_Subsets]): permutations branch on what-goes-next (depth n, shrinking fan-out, needs a used-set), combinations branch with a start-index to kill orderings, subsets branch include-or-not (binary). Drawing the first two levels of the CORRECT tree before coding prevents the wrong-bookkeeping hybrid that generates duplicates or misses arrangements — the distinction is the whole difficulty.

**"Duplicate handling means deduping the output"** — Deduping output costs exponential wasted exploration then hashes it away ([17_Backtracking, 22_Recursion_Subsets]): the correct tool is same-level skip after sorting (skip a candidate equal to its previous sibling when the sibling was not used at this depth). Permutations-with-dupes and combinations-with-dupes both hinge on this same-level-versus-same-path distinction, and the Set-on-results approach is the tell of not understanding where the duplicates come from in the tree.

**"Interview math is memorizing formulas"** — The counting problems test whether you can DERIVE the recurrence or the combinatorial argument ([03_Algorithms/06, 08 number-theory]): the arrangement that is a product rule, the count that is inclusion-exclusion, the probability that is favorable-over-total with the right sample space. Memorized nCr formulas fail the novel counting question — the skill is modeling the count (what am I counting, what is the recurrence, does order matter) which is a reasoning act, and the modular-arithmetic that keeps the large counts from overflowing ([03_Algorithms/06] Math.floorMod, modular inverse).

**"The output size does not affect complexity here"** — For enumeration, the OUTPUT is often exponential and dominates ([22_Recursion_Subsets]): n subsets is 2^n, and copying the path into results at every leaf is a hidden cost that makes the exponential solution inexplicably slow even for legal n. The complexity analysis must distinguish tree-size from output-size, because only tree-size responds to pruning — the enumeration whose cost is the output cannot be pruned faster, and knowing which you have tells you whether optimization is even possible.

**"These problems are pure recursion practice"** — They are where recursion meets combinatorial modeling and modular arithmetic ([03c_Recursion, 03_Algorithms/06]): the constrained generation (valid-parentheses pruning during generation, not filtering after — the constraints pushed INTO the generator shrink the tree), the counting that needs the combinatorial insight, the large-count that needs modular arithmetic. Treating them as recursion drills misses the modeling (what is the state space, what makes a partial candidate dead) and the math (the overflow-safe modular counting) that are the actual content beyond the recursive scaffolding.
