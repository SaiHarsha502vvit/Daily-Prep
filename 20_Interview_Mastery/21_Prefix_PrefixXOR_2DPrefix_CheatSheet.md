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

---


---

## 🏋️ Practice & Interview Questions — Algorithms

### Sorting
**Q1.** Which sorting algorithm does Java use for `Arrays.sort(int[])`? Why not MergeSort?
<details><summary>Answer</summary>

**Dual-Pivot QuickSort** — for primitives. MergeSort requires O(N) extra space. QuickSort is in-place and cache-friendly. Stability doesn't matter for primitives (equal ints are indistinguishable). For objects (`Arrays.sort(Object[])`), Java uses **TimSort** (stable, O(N log N) worst).
</details>

**Q2.** Trace Merge Sort on `[4,2,7,1]`.
<details><summary>Answer</summary>

Split: `[4,2]` `[7,1]` → Split: `[4]` `[2]` `[7]` `[1]` → Merge: `[2,4]` `[1,7]` → Merge: `[1,2,4,7]`
</details>

**Q3.** ⭐⭐ Sort Colors (Dutch National Flag — 3-way partition).
<details><summary>Solution</summary>

```java
int lo=0, mid=0, hi=n-1;
while(mid<=hi){
    if(nums[mid]==0) swap(nums,lo++,mid++);
    else if(nums[mid]==1) mid++;
    else swap(nums,mid,hi--);
}
```
</details>

### Binary Search
**Q4.** ⭐ Search in Rotated Sorted Array.
<details><summary>Solution</summary>

```java
int lo=0, hi=n-1;
while(lo<=hi){
    int mid=(lo+hi)/2;
    if(nums[mid]==target) return mid;
    if(nums[lo]<=nums[mid]){ // left half sorted
        if(nums[lo]<=target&&target<nums[mid]) hi=mid-1; else lo=mid+1;
    } else { // right half sorted
        if(nums[mid]<target&&target<=nums[hi]) lo=mid+1; else hi=mid-1;
    }
}
return -1;
```
</details>

**Q5.** ⭐ Find First and Last Position (binary search twice).
<details><summary>Solution</summary>

```java
// First: find leftmost with while(lo<hi){ if arr[mid]>=target hi=mid else lo=mid+1 }
// Last: find rightmost with while(lo<hi){ if arr[mid]<=target lo=mid+1 else hi=mid } return lo-1
```
</details>

**Q6.** ⭐⭐ Koko Eating Bananas — binary search on answer.
<details><summary>Key insight</summary>

Binary search the eating speed k in range [1, max(piles)]. For each k, calculate hours needed. Find minimum k where hours ≤ H.
</details>

### Dynamic Programming
**Q7.** ⭐ Climbing Stairs — n steps, 1 or 2 at a time. How many ways?
<details><summary>Solution</summary>

```java
// Fibonacci sequence! dp[i] = dp[i-1] + dp[i-2]
int a=1, b=1;
for(int i=2;i<=n;i++){ int c=a+b; a=b; b=c; }
return b;
```
</details>

**Q8.** ⭐ Coin Change — minimum coins for amount.
<details><summary>Solution</summary>

```java
int[] dp = new int[amount+1]; Arrays.fill(dp, amount+1);
dp[0]=0;
for(int i=1;i<=amount;i++)
    for(int c:coins) if(c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
return dp[amount]>amount?-1:dp[amount];
```
</details>

**Q9.** ⭐⭐ Longest Common Subsequence.
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(text1.charAt(i-1)==text2.charAt(j-1)) dp[i][j]=dp[i-1][j-1]+1;
    else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
}
return dp[m][n];
```
</details>

**Q10.** ⭐⭐ Word Break — can string be segmented using dictionary words?
<details><summary>Solution</summary>

```java
boolean[] dp=new boolean[n+1]; dp[0]=true;
for(int i=1;i<=n;i++) for(String w:wordDict)
    if(i>=w.length()&&dp[i-w.length()]&&s.substring(i-w.length(),i).equals(w)) dp[i]=true;
return dp[n];
```
</details>

**Q11.** ⭐⭐⭐ Edit Distance (Levenshtein).
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=0;i<=m;i++) dp[i][0]=i;
for(int j=0;j<=n;j++) dp[0][j]=j;
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(word1.charAt(i-1)==word2.charAt(j-1)) dp[i][j]=dp[i-1][j-1];
    else dp[i][j]=1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));
}
```
</details>

### Graph Algorithms
**Q12.** ⭐ Number of Islands (BFS/DFS grid traversal).
<details><summary>Solution</summary>

```java
for each cell (i,j) if grid[i][j]=='1': count++; BFS/DFS to mark all connected land as visited
```
</details>

**Q13.** ⭐⭐ Course Schedule — detect cycle in directed graph (Topological sort).
<details><summary>Solution</summary>

```java
// Kahn's algorithm: indegree array + BFS queue
// If result size == numCourses → no cycle → can finish
```
</details>

**Q14.** ⭐⭐ Dijkstra's Shortest Path.
<details><summary>Solution</summary>

```java
PriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[1]-b[1]); // [node, dist]
pq.offer(new int[]{src,0}); dist[src]=0;
while(!pq.isEmpty()){
    int[] curr=pq.poll(); int u=curr[0],d=curr[1];
    if(d>dist[u]) continue; // stale
    for(int[] neighbor:graph[u]) if(dist[u]+neighbor[1]<dist[neighbor[0]]){
        dist[neighbor[0]]=dist[u]+neighbor[1]; pq.offer(new int[]{neighbor[0],dist[neighbor[0]]});
    }
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | QuickSort avg/worst | O(N log N) avg, O(N²) worst |
| 2 | MergeSort space complexity | O(N) |
| 3 | HeapSort space complexity | O(1) (in-place) |
| 4 | Binary search precondition | Sorted array |
| 5 | BFS time complexity on graph | O(V+E) |
| 6 | DFS space complexity | O(V) (recursion stack) |
| 7 | Dijkstra fails on | Negative weight edges |
| 8 | Bellman-Ford handles | Negative weights, detects negative cycles |
| 9 | Floyd-Warshall use case | All-pairs shortest path, O(V³) |
| 10 | Topological sort requires | Directed Acyclic Graph (DAG) |


**Navigation**: [⬅ Bitwise Trie Interview Guide](20_Bitwise_Trie_Interview_Guide.md) | [📚 Index](00_INDEX.md) | [Next: PDF Topic to Workspace Map ➡](22_DSA_PDF_Topic_to_Workspace_Map.md)
