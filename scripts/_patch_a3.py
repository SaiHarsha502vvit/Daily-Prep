import sys

# A3_DS_Lower_Bounds.md
path = '02_Data_Structures/A3_DS_Lower_Bounds.md'
txt = open(path, encoding='utf-8').read()
anchor = '*[<- A2: DS Complexity](A2_DS_Complexity_FirstPrinciples.md) | [A4: Randomized DS ->](A4_Randomized_Data_Structures.md)*'
if anchor not in txt:
    # try with unicode
    anchor = '*[← A2: DS Complexity](A2_DS_Complexity_FirstPrinciples.md) | [A4: Randomized DS →](A4_Randomized_Data_Structures.md)*'
addition = """

---

## Proof Corner -- Comparison-Based DS Lower Bounds

**Lower bound for searching in unsorted array**: Any deterministic comparison-based algorithm requires Omega(n) comparisons to find a target in an n-element unsorted array.

**Proof (adversary argument)**: The adversary starts with no restrictions on the array values. For each comparison arr[i] vs arr[j], the adversary answers consistently but never commits to placing the target where it has already been excluded. After fewer than n comparisons, at least one position has never been compared; the adversary places the target there (or declares it absent). The algorithm cannot distinguish these cases.

**Lower bound for sorted dictionary (n ops)**: O(n log n) total time for n insertions + n lookups.

**Proof (sorting reduction)**: Given a comparison-based dictionary, sort n elements by inserting each, then doing in-order traversal. This sort runs in the time of n insertions + one traversal. Since comparison-based sorting requires Omega(n log n) comparisons, the dictionary uses Omega(n log n) total.

**Finding max in n elements -- tight lower bound**: Exactly n-1 comparisons are necessary and sufficient.

**Proof**: Each comparison eliminates exactly one element from being the max. To identify the max from n elements, n-1 must be eliminated. One linear scan achieves exactly n-1 comparisons.

---

## When It Breaks -- DS Lower Bounds

**1. Lower bounds don't apply to non-comparison algorithms** -- counting sort, radix sort, and hash tables are not comparison-based. They achieve O(n) or O(1) operations by exploiting numeric structure, bypassing the Omega(n log n) and Omega(log n) comparison bounds.

**2. Cell-probe model vs comparison model** -- some problems that look like they need O(log n) comparisons can achieve O(1) with precomputation (e.g., static range minimum queries via sparse table). The comparison lower bound doesn't apply to lookup-table-based algorithms.

**3. Amortised vs worst-case lower bounds** -- a lower bound of Omega(n log n) for n operations allows individual O(1) operations. Only the TOTAL is bounded. Never cite an amortised lower bound to rule out a fast individual operation.

---

## Section Challenge -- DS Lower Bounds

**Problem 1 (6 min)**: Prove that any comparison-based algorithm to find BOTH the minimum AND maximum of n elements requires at least ceil(3n/2) - 2 comparisons.

<details><summary>Model Answer</summary>

**Lower bound via adversary**: Classify each element as: never compared (N), beaten (lost at least one comparison), winning (won but never lost), or drawn (both won and lost). To identify min+max:
- min must win ALL comparisons it participates in.
- max must lose ALL comparisons it participates in.

No element can be both min and max (n >= 2). So at least 2 elements must be classified as "winner only" (max candidate) and "loser only" (min candidate).

A pair comparison in the first pass with n/2 pairs uses n/2 comparisons, giving n/2 winners and n/2 losers. Then: n/2-1 comparisons to find max among winners + n/2-1 comparisons to find min among losers = n-2 additional comparisons. Total: n/2 + n - 2 = 3n/2 - 2.

**Upper bound**: The pair algorithm achieves 3n/2 - 2 comparisons. Therefore this bound is tight.

</details>

---

## Reference Anchor

**Java -- lower bound implications in library design**:
```java
// java.util.Collections.min/max: each does n-1 comparisons (standard linear scan)
// Combined min+max using pair algorithm -- 3n/2 - 2 comparisons:
static int[] minMax(int[] arr) {
    int lo, hi;
    int start;
    if (arr.length % 2 == 0) {
        lo = Math.min(arr[0], arr[1]);
        hi = Math.max(arr[0], arr[1]);
        start = 2;
    } else {
        lo = hi = arr[0];
        start = 1;
    }
    for (int i = start; i < arr.length - 1; i += 2) {
        int a = arr[i], b = arr[i+1];
        if (a < b) { lo = Math.min(lo, a); hi = Math.max(hi, b); }
        else        { lo = Math.min(lo, b); hi = Math.max(hi, a); }
    }
    return new int[]{lo, hi};
    // Total: 1 (pair) + 1 (vs lo) + 1 (vs hi) per pair = 3*(n/2) = 3n/2
}

// java.util.Arrays.sort on int[] achieves Theta(n log n) -- optimal for comparison sort
// For special-case linear sorts: Arrays.sort is NOT used (Java has no built-in radix sort)
// Must implement counting sort / radix sort manually for O(n) sorting
```

---

## Brute Force to Optimal -- Lower Bound Aware Algorithms

| Problem | Naive ops | Optimal ops | Lower bound | Tight? |
|---------|-----------|------------|-------------|--------|
| Find max | n-1 | n-1 | n-1 | Yes |
| Find min+max | 2(n-1) | 3n/2-2 | 3n/2-2 | Yes |
| Sort | O(n^2) | O(n log n) | Omega(n log n) | Yes |
| Sorted search | O(n) | O(log n) | Omega(log n) | Yes |
| Median | O(n^2) | O(n) | Omega(n) | Yes (linear select) |
"""
if anchor in txt:
    open(path, 'w', encoding='utf-8').write(txt.replace(anchor, anchor + addition, 1))
    print('OK: A3_DS_Lower_Bounds.md')
else:
    print('MISS: A3_DS_Lower_Bounds.md')
    print(repr(txt[-100:]))

# A3_Lower_Bounds_And_NP.md
path = '03_Algorithms/A3_Lower_Bounds_And_NP.md'
txt = open(path, encoding='utf-8').read()
anchor = '*[← A2: Complexity First Principles](A2_Complexity_FirstPrinciples.md) | [A4: Randomized Algorithms →](A4_Randomized_Algorithms.md)*'
addition = """

---

## Proof Corner -- NP-Completeness and Reduction Correctness

**NP definition**: A language L is in NP if there exists a polynomial-time verifier V such that for every x in L, there exists a polynomial-size certificate c with V(x, c) = 1; and for every x not in L, no certificate satisfies V(x, c) = 1.

**NP-hardness proof template**:
1. Choose a known NP-hard problem P (e.g., 3-SAT, Clique, Vertex Cover).
2. Show a polynomial-time reduction f: P -> Q (P instances to Q instances).
3. Correctness: x is YES for P iff f(x) is YES for Q.
4. Conclusion: if Q were solvable in poly-time, so would P -- contradicting P NP-hard.

**Vertex Cover 2-approximation correctness**: Find a maximal matching M (greedily). Add both endpoints of each matching edge to the cover C. Claim: |C| <= 2*OPT.

Proof: Every edge in M must be covered; no two matching edges share an endpoint (matching property); so OPT must include at least one endpoint of each matching edge; |OPT| >= |M|. But |C| = 2|M| <= 2*OPT. QED.

---

## When It Breaks -- Lower Bounds and NP

**1. Reducing in the wrong direction** -- to prove Q NP-hard, reduce FROM a known NP-hard problem TO Q. Reducing FROM Q to a known NP-hard problem only proves Q is in NP (or nothing, if the reduction goes wrong). This is the most common error in NP-hardness proofs.

**2. Non-polynomial reduction** -- the reduction must run in polynomial time in the input size. If f(x) itself requires exponential time or produces exponential output, the hardness transfer fails.

**3. Approximation ratio direction confusion** -- for minimisation, ratio = ALG/OPT >= 1. For maximisation, ratio = OPT/ALG >= 1. Reporting "we achieve a 2-approximation" for the wrong objective gives a misleading claim.

**4. P = NP misunderstanding** -- P = NP would make NP-hard problems solvable in polynomial time, but problems outside NP (PSPACE, EXPTIME) remain hard. "P = NP solves everything" is incorrect.

---

## Reference Anchor

**Standard NP references and Java SAT solving**:
```
Garey and Johnson, "Computers and Intractability" (1979) -- canonical NP hardness catalog
Karp's 21 NP-complete problems (1972) -- foundation of practical reductions
CLRS Chapter 34 -- NP-completeness with formal proof templates

Key reductions for interviews:
  3-SAT -> Independent Set (clause gadgets -> clique; variable gadgets)
  Clique -> Vertex Cover (complement: VC of G = n - clique of complement(G))
  3-SAT -> Subset Sum (arithmetic gadget: one row per literal)
```

```java
// 2-Approximation for Vertex Cover:
Set<Integer> cover = new HashSet<>();
boolean[] inMatching = new boolean[n];
for (int[] edge : edges) {
    int u = edge[0], v = edge[1];
    if (!inMatching[u] && !inMatching[v]) {
        cover.add(u); cover.add(v);
        inMatching[u] = inMatching[v] = true;
    }
}
// |cover| <= 2 * OPT: each matching edge must be in OPT, |matching| <= OPT, |cover|=2|matching|

// 2-SAT in polynomial time (P class) via SCC:
// Build implication graph: for each clause (a OR b), add edges !a->b and !b->a
// x is satisfiable iff x and !x are in different SCCs (Kosaraju/Tarjan in O(V+E))
```

---

## Brute Force to Optimal -- NP-Hard Problem Strategies

| Strategy | When to use | Example | Guarantee |
|----------|------------|---------|-----------|
| Exact exponential | Small n < 20 | Branch-and-bound, ILP | Optimal |
| Approximation | Poly time, bounded error | Greedy VC, LP relax | rho*OPT |
| FPT algorithm | Hard but parameter k is small | Vertex Cover FPT: O(2^k * n) | Exact, fast for small k |
| Heuristic | Large n, no guarantee needed | Simulated annealing | No guarantee |
| Special case | Restricted input structure | PTAS for planar TSP | (1+eps)*OPT |

```java
// Brute-force for Vertex Cover (n <= 20): try all 2^n subsets
// O(2^n * n): check each subset if it covers all edges
for (int mask = 0; mask < (1 << n); mask++) {
    if (Integer.bitCount(mask) < bestSize && coversAll(mask, edges)) {
        bestSize = Integer.bitCount(mask);
        bestMask = mask;
    }
}
// For n=20: 2^20 = 1M subsets * 20n check = 20M ops -- feasible
// For n=40: 2^40 = 1T -- infeasible without pruning
```
"""
if anchor in txt:
    open(path, 'w', encoding='utf-8').write(txt.replace(anchor, anchor + addition, 1))
    print('OK: A3_Lower_Bounds_And_NP.md')
else:
    print('MISS: A3_Lower_Bounds_And_NP.md')
    print(repr(txt[-100:]))

print('A3 patch done')
