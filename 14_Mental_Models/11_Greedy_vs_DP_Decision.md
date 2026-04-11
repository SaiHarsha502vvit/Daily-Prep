**Navigation**: [< Previous](10_Interview_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](12_Space_Time_Tradeoffs.md)

**Mental Model 11** | [Index](../00_MASTER_INDEX.md)

---

# 🧠 GREEDY vs DYNAMIC PROGRAMMING — THE DECISION FRAMEWORK

## The Core Difference


**Greedy**: Make the locally optimal choice at each step.
Never look back. Never reconsider.
Works when local optimum → global optimum.
Time: Usually O(n log n) [sort] + O(n) [scan]

**Dp**: Try ALL choices at each step. Remember results.
Build optimal from sub-solutions.
Works when you need to explore all possibilities.
Time: Usually O(n²) or O(n × W) — slower but always correct.

💡 **ANALOGY:**
Greedy = Taking the highway with the fewest current cars (local best)
DP     = Checking ALL possible routes on Google Maps (global best)
GREEDY IS FASTER BUT RISKIER.
It only works when you can PROVE local = global.
## The Decision Checklist

Ask these THREE questions. If ALL are YES → Greedy works.
If ANY is NO → Use DP.
Q1: GREEDY CHOICE PROPERTY
"Can I make the best local choice and never regret it?"
Q2: OPTIMAL SUBSTRUCTURE
"Does the optimal solution contain optimal sub-solutions?"
Q3: NO FUTURE DEPENDENCY
"Does my current choice NOT affect future choices'
available options in a complex way?"
BOTH Greedy and DP need Optimal Substructure (Q2).
Greedy ADDITIONALLY needs the Greedy Choice Property (Q1).
DP doesn't need Q1 — it explores everything anyway.
## Proof Techniques For Greedy

How do you PROVE greedy works? Two standard techniques:
TECHNIQUE 1: EXCHANGE ARGUMENT
"Suppose greedy solution G and optimal solution O differ.
Show we can modify O to look more like G without worsening it.
Therefore G is also optimal."
Example — Activity Selection (LC 435 variant):
Greedy: Pick activity ending earliest. If optimal picks a later-ending
activity first, swap it with our earliest-ending one. The swap can't
cause conflicts (ends earlier → leaves more room). So greedy ≥ optimal.
TECHNIQUE 2: GREEDY STAYS AHEAD
"At every step, show greedy solution is at least as good
as any other solution up to that point."
Example — Fractional Knapsack:
Sort by value/weight ratio. Taking highest ratio first → at every stage,
total value ≥ any alternative selection of the same total weight.

**In Interviews**: You don't need a formal proof. Say:
"I believe greedy works here because [greedy choice property holds] —
choosing the locally best [X] can never make the global answer worse."


🔬 **Section Challenge — Proof Techniques For Greedy**

**Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.
</details>


## When Greedy Fails — Classic Traps

- ❌ 0/1 KNAPSACK: Greedy by value/weight ratio FAILS.
Items: (w=10,v=60), (w=20,v=100), (w=30,v=120). Capacity=50.
Greedy by ratio: take first (6.0), then second (5.0) → w=30, v=160
Optimal: take second + third → w=50, v=220. GREEDY LOSES.
(But Fractional Knapsack → greedy IS optimal.)
- ❌ COIN CHANGE (arbitrary denominations): Greedy FAILS.
Coins: [1, 3, 4]. Amount: 6.
Greedy: 4+1+1 = 3 coins. Optimal: 3+3 = 2 coins.
(But with US coins [1,5,10,25] → greedy IS optimal.)
- ❌ LONGEST INCREASING SUBSEQUENCE: Greedy "pick smallest" FAILS.
[1, 100, 2, 3, 4]. Greedy might pick 1, 2 early but needs to
explore whether 100 leads somewhere. Need DP (or patience sort).
- ✅ ACTIVITY SELECTION: Greedy by earliest end WORKS.
- ✅ HUFFMAN CODING: Greedy merge lowest freq WORKS.
- ✅ DIJKSTRA: Greedy pick nearest unvisited WORKS (non-negative weights).
- ✅ KRUSKAL/PRIM: Greedy pick lightest edge WORKS.


🔬 **Section Challenge — When Greedy Fails — Classic Traps**

**Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.
</details>


## The Quick Decision Table

| PROBLEM TYPE                    | USE     | WHY |
════════════════════════════════╪═════════╪═════════════════════════════
| Activity Selection/Scheduling   | GREEDY  | Earliest end → max activities |
| Fractional Knapsack             | GREEDY  | Can take fractions → ratio |
| 0/1 Knapsack                    | DP      | Can't take fractions |
| Coin Change (arbitrary)         | DP      | Greedy fails for [1,3,4] |
| Shortest Path (non-negative)    | GREEDY  | Dijkstra proven optimal |
| Shortest Path (negative edges)  | DP      | Bellman-Ford needed |
| MST (Kruskal/Prim)             | GREEDY  | Cut property proves it |
| Huffman Coding                  | GREEDY  | Merge cheapest first |
| LIS                             | DP      | Future elements affect choice |
| Edit Distance                   | DP      | Single char choice ripples |
| Matrix Chain Multiplication     | DP      | Order matters globally |
| Interval Scheduling Max         | GREEDY  | Sort by end, always keep early |
| Weighted Job Scheduling         | DP      | Weights make greedy fail |
| Jump Game I                     | GREEDY  | Track max reachable |
| Jump Game II (min jumps)        | GREEDY  | BFS-like level expansion |
| Task Scheduler                  | GREEDY  | Most frequent first |
| Stock Buy/Sell (1 transaction)  | GREEDY  | Track min, max profit |
| Stock Buy/Sell (k transactions) | DP      | State: day × transactions |
## The Hybrid Pattern: Greedy + Dp

Some problems use BOTH:
- Weighted Job Scheduling: Sort by end (greedy step), then DP
- LIS with patience sort: Binary search (greedy element) within DP
- Dijkstra: Greedy vertex selection + DP relaxation

**Rule Of Thumb**: If greedy feels right but you're not 100% sure,
start with DP. It's always correct. Then optimize to greedy if proof
becomes clear during implementation.

---



🔬 **Section Challenge — The Hybrid Pattern: Greedy + Dp**

**Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.
</details>


## 🎯 INTERVIEW SCRIPT

When you see an optimization problem, say this to the interviewer:

"This has optimal substructure. Let me check if the greedy choice property holds — can I commit to a local choice without regret? [If yes:] Greedy will be O(n log n). [If no:] I'll use DP to explore all subproblems."

This shows you know the theory, even if you pick the wrong approach initially.

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



---

## 🧠 Deep Conceptual Questions — Algorithm Design & Analysis

**C1. What does O(N log N) "feel like" and why is it the complexity barrier for comparison-based sorting?**
<details><summary>Deep Answer</summary>

O(N log N) for N=1M ≈ 20M operations. O(N²) ≈ 1 trillion. The difference is 50,000x. **Comparison sort lower bound**: any comparison-based sort must distinguish between N! possible orderings. Each comparison has 2 outcomes. A decision tree with N! leaves needs ≥ log₂(N!) height ≈ N log N (Stirling's approximation). Therefore NO comparison sort can beat O(N log N) in the worst case. Non-comparison sorts (counting sort, radix sort, bucket sort) break this bound by using non-comparison operations — but require constraints on input (e.g., integer range bounded by N).
</details>

**C2. Greedy algorithms: when do they work and what must be proven?**
<details><summary>Deep Answer</summary>

A greedy algorithm makes the locally optimal choice at each step. Works when problem has: (1) **Greedy choice property**: local optimal leads to global optimal — the choice never needs to be revised. (2) **Optimal substructure**: optimal solution to the problem contains optimal solutions to subproblems. To PROVE greedy is correct: use "exchange argument" — assume optimal solution differs from greedy, show you can swap greedy's choice in without making it worse, contradiction. Greedy FAILS when: future choices depend on current choice in complex ways (use DP instead). Classic works: interval scheduling, Huffman coding, Dijkstra. Classic fails: 0-1 knapsack (use DP).
</details>

**C3. Dynamic Programming: what is "overlapping subproblems" and why does it matter?**
<details><summary>Deep Answer</summary>

Overlapping subproblems: the same sub-computation appears multiple times. Fibonacci: `fib(5)` calls `fib(4)` and `fib(3)`. `fib(4)` also calls `fib(3)`. Without memoization: `fib(3)` computed exponentially many times → O(2^N). With memoization: each sub-result computed once and stored → O(N). DP is valuable SPECIFICALLY when: (1) problem has optimal substructure AND (2) subproblems overlap. If no overlap: just use divide-and-conquer (merge sort's subproblems don't overlap → no DP needed). DP = "smart recursion" = avoid recomputing.
</details>

**C4. Top-down (memoization) vs Bottom-up (tabulation) DP — when to choose each?**
<details><summary>Deep Answer</summary>

**Top-down (memoization)**: Write natural recursion + cache results. Easy to implement, only computes needed subproblems (sparse computation). Cons: recursion overhead and stack depth risk. Use when: problem is naturally recursive, only a fraction of subproblems needed. **Bottom-up (tabulation)**: Fill DP table iteratively from base cases. No recursion overhead, better cache performance, easier space optimization. Use when: need all subproblems (or most of them), want to optimize space (can often reduce to 1D from 2D). Rule: start with top-down for correctness verification, optimize to bottom-up for performance.
</details>

**C5. Dijkstra's Algorithm: why does it fail on negative weights?**
<details><summary>Deep Answer</summary>

Dijkstra assumes: once a node is "settled" (extracted from the priority queue with its final shortest distance), that distance is optimal. With negative weights: settling node A at distance 5 might not be final — a path through B (distance 7) → C (edge -10) → A gives distance -3. But A was already settled! Dijkstra doesn't revisit settled nodes. Bellman-Ford handles negatives by relaxing ALL edges N-1 times — no "settled" assumption. For graphs with negative cycles: Bellman-Ford detects them (if distances still decrease after N-1 rounds, there's a negative cycle).
</details>

**C6. Union-Find: why is path compression + union by rank/size nearly O(1)?**
<details><summary>Deep Answer</summary>

**Path compression**: when finding the root of element x, make every node on the path point directly to the root. Flattens the tree. Future finds on those paths: O(1). **Union by rank**: always attach the smaller tree under the larger → limits tree height to O(log N). Combined: inverse Ackermann function α(N) amortized — so slow-growing it's practically constant (α(10^80) = 4). Neither alone is optimal: path compression without union by rank → O(log N) amortized. Union by rank without path compression → O(log N). Together → α(N) ≈ O(1) amortized. Used in: Kruskal's MST, cycle detection, connected components.
</details>

**C7. Binary Search on the Answer — what types of problems does it apply to?**
<details><summary>Deep Answer</summary>

When the answer space is **monotone**: "if X is achievable, then all values less extreme than X are also achievable." Problems: minimize the maximum (aggressive cows, split array), find minimum valid threshold (Koko bananas, minimum days to bloom), divide-and-conquer feasibility. Template: binary search on the answer range [lo, hi], for each mid check `isFeasible(mid)` in O(N) or O(N log N). Total: O(N log(answer_range)). Key insight: reframe "find optimal value" as "find smallest X where condition holds" → enables binary search on a non-array space.
</details>

**C8. Why does merge sort guarantee stability while quicksort doesn't?**
<details><summary>Deep Answer</summary>

**Merge sort stability**: during merge, when two elements are equal, we always take from the LEFT array first → preserves original relative order. **QuickSort instability**: the partition step swaps elements across the pivot without regard to original order. Two equal elements may be placed on opposite sides of the pivot, reversing their order. QuickSort CAN be made stable (Lomuto partition with careful implementation) but loses performance. Java uses TimSort for objects (stable), dual-pivot quicksort for primitives (stability irrelevant since primitives without fields).
</details>

**C9. Backtracking: what's the difference from plain DFS and when to use vs DP?**
<details><summary>Deep Answer</summary>

**Backtracking vs DFS**: DFS visits every path. Backtracking prunes paths early when a constraint is violated — avoids exploring infeasible branches. Same asymptotic but drastically different practical performance with good pruning. **Backtracking vs DP**: backtracking for **combinatorial/enumeration** problems (find all solutions, permutations, subsets). DP for **optimization** problems (find optimal single solution). Backtracking produces exponential solutions in worst case but is necessary when you need ALL solutions. DP finds the optimal in polynomial time when overlapping subproblems exist.
</details>

**C10. What is amortized analysis and how does it differ from average-case analysis?**
<details><summary>Deep Answer</summary>

**Amortized**: analyzes the average cost per operation over a SEQUENCE of operations — in the worst case. No probability involved. Guarantees: N operations ALWAYS take O(N·T) total, even if some individual operations are O(N·T). Example: ArrayList append is O(N) when resizing, but amortized O(1) because resizing is rare. **Average-case**: analyzes expected cost of a SINGLE operation assuming random input. QuickSort is O(N log N) average-case (random pivot). Amortized is a stronger guarantee — it holds even for adversarial input sequences.
</details>


**Navigation**: [Back to Index](../00_MASTER_INDEX.md)
