**Navigation**: [⬅ Bitwise Trie Interview Guide](20_Bitwise_Trie_Interview_Guide.md) | [📚 Index](00_INDEX.md) | [Next: PDF Topic to Workspace Map ➡](22_DSA_PDF_Topic_to_Workspace_Map.md)

# File 21 — Prefix Sum, Prefix XOR, and 2D Prefix: Unified Cheat Sheet

## Why This Chapter

Many interview problems look different but reduce to one of these three tools:
- Prefix Sum (additive)
- Prefix XOR (bitwise parity)
- 2D Prefix (rectangle aggregate)

Java implementation companion:
- [03_Algorithms/19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md](../03_Algorithms/19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md)

This file gives a single mental model:
1. logic and formulas
2. when to pick which
3. alternatives and edge cases
4. interview communication script

---

## 1) Prefix Sum (1D)



🔬 **Section Challenge — 1) Prefix Sum (1D)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 1.1 Definition

For array `a[0..n-1]`, define prefix array `p`:

- `p[i] = a[0] + a[1] + ... + a[i]`

Common alternate form with sentinel:

- `p[0] = 0`
- `p[i+1] = p[i] + a[i]`

Sentinel form is safer for boundaries.




## 1.2 Range Sum Formula

If using sentinel:

- sum of `a[l..r] = p[r+1] - p[l]`

If using direct prefix `p[i]=sum(0..i)`:

- sum `a[l..r] = p[r] - (l>0 ? p[l-1] : 0)`



🔬 **Section Challenge — 1.2 Range Sum Formula**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 1.3 Typical Problem Patterns

- many range sum queries
- subarray sum equals k
- longest subarray with target sum (with hash map)
- difference array based range updates

---



## 2) Prefix XOR (1D)



🔬 **Section Challenge — 2) Prefix XOR (1D)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 2.1 Definition

- `x[i] = a[0] XOR a[1] XOR ... XOR a[i]`

Sentinel form:

- `x[0] = 0`
- `x[i+1] = x[i] XOR a[i]`




## 2.2 Range XOR Formula

Using sentinel:

- xor of `a[l..r] = x[r+1] XOR x[l]`

Why it works:
- XOR cancels equal terms (`v XOR v = 0`)

## 2.3 Typical Problem Patterns

- subarray xor equals k
- maximize xor with prefix values
- parity/invariant problems with bitwise state

---



## 3) 2D Prefix Sum (Matrix)



🔬 **Section Challenge — 3) 2D Prefix Sum (Matrix)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 3.1 Definition

For matrix `A` with rows `1..R`, cols `1..C`, define `S`:

- `S[i][j] = sum of rectangle (1,1) to (i,j)`

Build formula:

- `S[i][j] = A[i][j] + S[i-1][j] + S[i][j-1] - S[i-1][j-1]`

The subtraction removes double-count overlap.




## 3.2 Rectangle Query Formula

For rectangle `(r1,c1)` to `(r2,c2)`:

- `sum = S[r2][c2] - S[r1-1][c2] - S[r2][c1-1] + S[r1-1][c1-1]`

This is inclusion-exclusion in 2D.

## 3.3 Typical Problem Patterns

- many rectangle sum queries
- matrix block sum
- count cells/properties in rectangles

---



## 4) Decision Guide (Which Prefix Tool?)

Ask in this order:

1. Is operation additive (`+/-`) over a contiguous range?
- yes -> Prefix Sum

2. Is operation XOR or parity bit behavior?
- yes -> Prefix XOR

3. Is data 2D and query asks rectangle aggregate?
- yes -> 2D Prefix

4. Are there updates too?
- static queries -> prefix arrays are excellent
- dynamic updates + queries -> consider Fenwick/Segment Tree

Interview line:

"Because queries are static and contiguous, I precompute prefix once in O(n) and answer each query in O(1)."

---



🔬 **Section Challenge — 4) Decision Guide (Which Prefix Tool?)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 5) Same Problem, Different Styles (Alternatives)

## Example A: Subarray Sum Equals K

### Style 1: Prefix + hash map (optimal)

Logic:
- current prefix = `curr`
- need previous prefix `curr-k`
- count how many times `curr-k` appeared

Time O(n), space O(n).

### Style 2: Brute force

- all l,r pairs with running sum
- O(n^2)

Use brute force only for very small n or as baseline explanation.



🔬 **Section Challenge — Example A: Subarray Sum Equals K**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## Example B: Range Sum Query (immutable)

### Style 1: Prefix array

- preprocess O(n)
- each query O(1)

### Style 2: direct per-query scan

- preprocess O(1)
- each query O(length)

Good when queries are very few.



🔬 **Section Challenge — Example B: Range Sum Query (immutable)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## Example C: Rectangle Sum in Matrix

### Style 1: 2D Prefix

- preprocess O(RC)
- query O(1)

### Style 2: Sum every cell per query

- query O(area)

---




## 6) Difference Array (Range Update Companion)

When updates are range increments and final array is needed, use difference array.

1D difference `d`:
- to add `val` on `[l..r]`
  - `d[l] += val`
  - `d[r+1] -= val` (if in bounds)
- final values recovered by prefix sum of `d`

This is the update-side mirror of prefix sum.

---

## 7) Common Pitfalls

1. Off-by-one indexing
- fix: prefer sentinel prefix arrays

2. Forgetting initial map seed in prefix-hash problems
- for sum/xor subarray counting, often need frequency of prefix 0 initialized to 1

3. Integer overflow in large sums
- use long where needed

4. Wrong rectangle formula signs in 2D prefix
- always remember: `+ - - +`

5. Using prefix arrays for heavy dynamic updates
- use Fenwick/Segment tree instead

---

## 8) Interview Communication Templates

## Template 1: Prefix Sum

"This is a static range-sum query problem. I precompute cumulative sums once. Then each query is difference of two prefix values, so query time becomes O(1)."



🔬 **Section Challenge — Template 1: Prefix Sum**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## Template 2: Prefix Hash (subarray target)

"If current prefix is P, I need an earlier prefix P-k. So I track frequency of previous prefixes in a hash map while scanning once."



🔬 **Section Challenge — Template 2: Prefix Hash (subarray target)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## Template 3: Prefix XOR

"XOR behaves like reversible parity; range XOR is prefixXor[r] XOR prefixXor[l-1]. That gives O(1) range computation after O(n) preprocessing."



🔬 **Section Challenge — Template 3: Prefix XOR**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## Template 4: 2D Prefix

"Rectangle sum uses inclusion-exclusion on four prefix corners, so each query is constant time."

---



🔬 **Section Challenge — Template 4: 2D Prefix**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## 9) Language-Specific Notes (After Logic)

## Java notes

- use `long[]` for potentially large sums
- sentinel style arrays simplify `l=0` cases
- for prefix-hash counting: `Map<Integer, Integer>` or `Map<Long, Integer>`

## Python notes

- dictionaries are concise for prefix frequency
- be explicit with 1-based vs 0-based matrix indices in 2D prefix

---

## 10) Quick Formula Box

1D Prefix Sum:
- `p[0]=0`
- `p[i+1]=p[i]+a[i]`
- `sum(l,r)=p[r+1]-p[l]`

1D Prefix XOR:
- `x[0]=0`
- `x[i+1]=x[i] XOR a[i]`
- `xor(l,r)=x[r+1] XOR x[l]`

2D Prefix:
- `S[i][j]=A[i][j]+S[i-1][j]+S[i][j-1]-S[i-1][j-1]`
- `rect(r1,c1,r2,c2)=S[r2][c2]-S[r1-1][c2]-S[r2][c1-1]+S[r1-1][c1-1]`

---

## 11) Practice Ladder

1. Range Sum Query - Immutable
2. Subarray Sum Equals K
3. Subarray XOR Equals K
4. Range XOR Queries
5. Range Sum Query 2D - Immutable
6. Matrix Block Sum
7. Prefix + Hash mixed constraints

