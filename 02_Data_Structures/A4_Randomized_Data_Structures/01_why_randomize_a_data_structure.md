# 1. Why Randomize a Data Structure?

> **Navigation**: [Chapter overview](../A4_Randomized_Data_Structures.md) | [4. Treaps — Randomized BST →](02_treaps_randomized_bst.md)
> Page 1 of 7 in **A4. Randomized Data Structures — Probabilistic Guarantees in Storage**


## The Deterministic Trap

Every deterministic data structure has a worst-case input that an adversary can construct. Consider:

- **Binary Search Tree on sorted input**: A BST built by inserting keys in sorted order degenerates to a linked list — O(n) search.
- **Chained hash table with a bad hash function**: All n keys hash to bucket 0, giving O(n) lookup.
- **AVL tree with sequential inserts**: More rotations than Red-Black, ~log n per insert but higher constant factors.

In each case, the **structure of the input**, not the size of n, determines the cost. An adversary who knows your algorithm can always manufacture the worst case.

## The Randomization Countermeasure

A randomized data structure injects randomness **independent of the input**:

- Random coin flips decide which paths are explored, which buckets hold keys, which nodes get promoted.
- The input distribution is irrelevant — even a perfectly crafted adversarial input cannot predict the random choices.
- Bounds are expressed as **expected** or **with high probability (whp)** — meaning Pr[bad event] < 1/n^c for any constant c.

**Definition**: A randomized data structure achieves **expected O(f(n))** if the expected cost over random coin flips, for any fixed input, is O(f(n)). It achieves **O(f(n)) whp** if Pr[cost > C·f(n)] < 1/n^c for some constant C.

## Expected vs. High-Probability

```
Expected O(log n):   E[T] = O(log n)     — average over random seeds
O(log n) whp:        Pr[T > 10·log n] < 1/n^3  — tail bound

whp is stronger: guarantees the result holds with overwhelming probability
against every input. Useful when "expected" alone isn't sufficient for
production SLAs.
```

## What This Chapter Covers

We study data structures **where randomization is part of the structure's design** — not just randomized algorithms applied to static data. The distinction:

| Chapter A4 (Algorithms) covers | This chapter covers |
|---|---|
| Randomized quicksort (random pivot) | Skip lists (randomized height) |
| Universal hashing (random hash function) | Bloom filters (random bits from many hashes) |
| QuickSelect | Cuckoo hashing (random bucket selection) |
| | Count-Min sketch, HyperLogLog (streaming) |
| | Consistent hashing (random ring placement) |
| | Treaps (random priority) |

Both chapters share probability foundations. This one focuses on data structures where the random choices create the structural invariants directly.

---

## 2. The Probability Toolkit

This section is a concise reference. For full derivations, see `03_Algorithms/A4_Randomized_Algorithms.md`.

### Linearity of Expectation

**E[X + Y] = E[X] + E[Y]** — holds even when X and Y are dependent.

Use case: decompose a complex random sum into a sum of simpler indicator variables.

### Indicator Random Variables

Indicator I_A = 1 if event A occurs, 0 otherwise. Key property: **E[I_A] = Pr[A]**.

Define X = number of elements promoted to level k in a skip list.
Each element independently promoted with probability p = 1/2.
E[X] = n·p = n/2. No joint distribution needed.

### Markov's Inequality

For any non-negative random variable X: **Pr[X ≥ t] ≤ E[X]/t**.

Use case: convert expected bounds into tail bounds. If E[X] = log n, then Pr[X > 10 log n] ≤ 1/10.

### Chernoff Bound (Sum of Independent 0/1 Variables)

If X = X_1 + ... + X_n where each X_i ∈ {0,1} is independent with Pr[X_i=1] = p_i, then for any δ > 0:

**Pr[X > (1+δ)μ] ≤ e^{-δ²μ/3)** where μ = E[X] = Σp_i

Also: **Pr[X < (1-δ)μ] ≤ e^(-δ²μ/2)**

Use case: concentration of bucket sizes in hashing. If we insert n items into m buckets using a good hash function, each bucket has expected size n/m. Chernoff bounds tell us the probability any bucket deviates significantly from the mean — crucial for Bloom filter and cuckoo hash analysis.

### The Union Bound

**Pr[A ∪ B] ≤ Pr[A] + Pr[B]** — used when bounding probability of any bad event across many independent attempts.

Use case: the probability that a skip list has height > 10 log n is bounded by summing over all n elements the probability that that element is at level 10 log n.

---

## 3. Skip Lists — Randomized Balanced Search

### 💬 Study-Partner View — Skip Lists (Randomized)

**1. The bottom line:** A skip list uses coin flips to build express lanes, so it behaves like a balanced tree without any rebalancing code.

**2. The textbook core:**

- Each inserted node gets height `h` with probability `p^(h-1)(1-p)` (usually `p = 1/2`).
- Expected height O(log n); expected search/insert/delete **O(log n)**; expected space O(n).
- High-probability bound: search is O(log n) with probability ≥ `1 - 1/n^c`.
- The adversary cannot predict the coin flips, so no input is consistently bad.

**3. The real-world analogy:** A **building with elevators**: some floors have express stops (decided at random when built), and from any floor you jump up the express levels then walk down.

**4. Walkthrough:**

1. Insert 30: flip coins: heads, heads, tails → height 3.
2. Link 30 into levels 1, 2 and 3 at the correct sorted position (found by the search path).
3. Later, searching for 30 starts at the top level and drops down whenever the next key would overshoot.
4. Expected number of steps stays O(log n).

> [!NOTE]
> **Quick check:** Why is the worst case still O(n)? *Unlucky coins could build no express lanes, but the probability is astronomically small.*


### Historical Context

Skip lists were introduced by **William Pugh in 1989** (University of Maryland) as a probabilistic alternative to balanced binary search trees. The paper — *"Skip Lists: A Probabilistic Alternative to Balanced Trees"* — argued that skip lists are simpler to implement, easier to understand, and competitive in performance. Today they power `ConcurrentSkipListMap` in Java and sorted sets in Redis (ZSET uses a skip list for scores + a hash for lookups).

### Structure Definition

A skip list is a layered linked list. Level 0 contains all n elements in sorted order. Each element is promoted to level i+1 independently with probability p = 1/2.

```
Level 3:  1 ────────────────────────────── 9 ──────── (height ~3)
Level 2:  1 ────── 4 ──────────────────── 9
Level 1:  1 ── 2 ── 4 ── 5 ── 7 ── 8 ── 9
Level 0:  1 ─ 2 ─ 3 ─ 4 ─ 5 ─ 6 ─ 7 ─ 8 ─ 9
```

**Invariant (Skip List)**: Elements at level i appear in sorted order when traversed. Each element's level is independent of all others, with Pr[level = k] = p^k for geometric distribution with parameter p = 1/2.

### Expected Height

The i-th element is at level k or higher with probability p^k. The expected number of elements at level k is n·p^k. Level k is non-empty in expectation when n·p^k ≥ 1, i.e., k ≤ log_{1/p}(n) = log₂(n).

More precisely, by a Chernoff argument: Pr[height > c·log₂(n)] < n·e^{-c'/n} for constants. With p = 1/2, the expected height is **O(log n)**. In practice, a skip list with 1,000,000 elements has expected height ~20 (compared to AVL's fixed height ≤ 40).

### Search Algorithm

```java
Node find(int key) {
    Node[] update = new Node[maxLevel];
    Node curr = head;

    // Trace the search path
    for (int i = maxLevel - 1; i >= 0; i--) {
        while (curr.forward[i] != null
               && curr.forward[i].key < key) {
            curr = curr.forward[i];
        }
        update[i] = curr;  // Track path for insertion
    }
    return curr.forward[0];  // Level 0 successor
}
```

### Backward Analysis of Search Cost

**Key insight** (Pugh's backward analysis): Trace the search path *backwards* from the found element to the head. At each step moving back, we either:
- Move **left** (stay at same level): probability 1/2
- Move **up** one level: probability 1/2

This is a symmetric random walk on a 2D lattice. Starting from height h (the element's level), moving to level 0 requires at most h upward moves. The expected number of steps to reach level 0 is O(h) = **O(log n)**. ✓

This analysis is cleaner than forward analysis because each backward step depends only on the current position, not on the future.

### Insert and Delete

```java
void insert(int key, Object value) {
    int level = randomLevel();  // Geometric(1/2) - expected O(log n)
    Node[] update = new Node[level + 1];
    Node curr = findPosition(key, update);

    // Insert at level 0..level
    for (int i = 0; i <= level; i++) {
        Node newNode = new Node(key, value, level);
        newNode.forward[i] = update[i].forward[i];
        update[i].forward[i] = newNode;
    }
}

int randomLevel() {
    int lvl = 0;
    while (Math.random() < 0.5 && lvl < MAX_LEVEL) {
        lvl++;
    }
    return lvl;
}
```

### Comparison with Balanced BSTs

| Property | Skip List | AVL Tree | Red-Black Tree |
|---|---|---|---|
| Search | O(log n) exp | O(log n) | O(log n) |
| Insert | O(log n) exp | O(log n) | O(log n) |
| Delete | O(log n) exp | O(log n) | O(log n) |
| Space | O(n log n) pointers | O(n) | O(n) |
| Rebalancing code | None | Rotations | Rotations + recolor |
| Concurrent-friendly | Yes (lock-free variants) | Difficult | Difficult |
| Expected height | O(log n) | ≤ 1.44·log(n+1) | ≤ 2·log(n+1) |

The skip list has **no explicit rebalancing** — the random height naturally keeps the tree balanced. This makes it dramatically simpler to implement correctly and much easier to make concurrent (Java's `ConcurrentSkipListMap` uses CAS operations on forward pointers).

### Production Use

- **Redis ZSET**: Sorted sets store scores; skip list provides O(log n) rank queries and range scans.
- **Java `ConcurrentSkipListMap`**: Concurrent sorted map used in `java.util.concurrent` for high-throughput sorted storage.
- **Apache Kafka**: Offset indexes use skip-list-like structures for index lookups.

---

[Chapter overview](../A4_Randomized_Data_Structures.md) | [4. Treaps — Randomized BST →](02_treaps_randomized_bst.md)
