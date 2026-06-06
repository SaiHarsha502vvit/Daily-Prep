> **Navigation**: [Back to Index](../../00_MASTER_INDEX.md) | [Next ▶](Day_002_Arrays_PrefixSum.md)

# Day 01 — Arrays: Two Pointers Pattern

> **15-Day Prep** | **Difficulty:** MEDIUM | **Theme:** Arrays + Two Pointer Mastery
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Next Day](Day_002_Arrays_PrefixSum.md)

---

## Completion Checklist

- [ ] P1: LC 259 — 3Sum Smaller (Premium) (30 min)
- [ ] P2: LC 11 — Container With Most Water (25 min)
- [ ] P3: CF 1A — Theatre Square (20 min)
- [ ] P4: CF 580C — Kefa and Park (25 min)

---

## 🧠 Pattern Mental Model — Two Pointers

```
CORE INSIGHT:
  When you have a SORTED array and want to find PAIRS/TRIPLETS satisfying
  a condition, DON'T use nested loops (O(n²) or O(n³)).

  Instead: fix one pointer, move two pointers toward each other.

  WHY it works:
    - left pointer moves RIGHT  → sum INCREASES
    - right pointer moves LEFT  → sum DECREASES
    - This covers ALL valid pairs in O(n) — no pair is ever missed!

TEMPLATE:
  sort(arr)
  left = 0, right = n - 1
  while (left < right):
      if condition(arr[left], arr[right]):
          // found! move both or count
      elif sum too small:
          left++   // make it bigger
      else:
          right--  // make it smaller

WHEN TO USE:
  ✅ Finding pairs/triplets with a target sum
  ✅ Removing duplicates in-place
  ✅ Merging sorted arrays
  ✅ Checking palindromes
  ❌ Unsorted array + complex condition → use HashMap instead
```

---

## Problem 1 — LC 259: 3Sum Smaller 🔒 Premium

**Platform:** LeetCode Premium | **Difficulty:** Medium | **Pattern:** Sort + Two Pointers

### 📋 Problem Statement

Given an array of `n` integers `nums` and an integer `target`, find the number
of index triplets `(i, j, k)` with `i < j < k` such that:

```
nums[i] + nums[j] + nums[k] < target
```

**Constraints:**
- `n == nums.length`
- `0 <= n <= 3500`
- `-100 <= nums[i] <= 100`
- `-100 <= target <= 100`

**Examples:**
```
Example 1:
  Input:  nums = [-2, 0, 1, 3], target = 2
  Output: 2
  Explanation:
    Triplet (-2, 0, 1): sum = -1 < 2 ✅
    Triplet (-2, 0, 3): sum = 1 < 2  ✅
    Triplet (-2, 1, 3): sum = 2 = 2  ❌ (not strictly less)
    Triplet (0, 1, 3) : sum = 4 > 2  ❌
    Count = 2

Example 2:
  Input:  nums = [], target = 0
  Output: 0

Example 3:
  Input:  nums = [0], target = 0
  Output: 0  (need at least 3 elements)
```

---

### Approach 1 — Brute Force: O(n³) Time, O(1) Space

**Idea:** Try every possible triplet `(i, j, k)`. Check if their sum < target.

**Why this is wrong for interviews:**
With n = 3500, that's 3500³ / 6 ≈ **7 billion operations**. TLE guaranteed.

```java
// BRUTE FORCE — DO NOT SUBMIT, understand the baseline
public int threeSumSmaller_BF(int[] nums, int target) {
    int count = 0;
    int n = nums.length;
    for (int i = 0; i < n - 2; i++) {
        for (int j = i + 1; j < n - 1; j++) {
            for (int k = j + 1; k < n; k++) {
                if (nums[i] + nums[j] + nums[k] < target) {
                    count++;
                }
            }
        }
    }
    return count;
}
// Time: O(n³) — try all C(n,3) triplets
// Space: O(1)
```

---

### Approach 2 — Better: Sort + O(n²) Naive

**Idea:** Sort first, then for each `i`, use brute force on remainder.
Sorting doesn't help the inner loop yet.

```java
// BETTER — still O(n²) inner loop but opens door for two-pointer
public int threeSumSmaller_Better(int[] nums, int target) {
    Arrays.sort(nums);  // Sort enables two-pointer
    int count = 0, n = nums.length;
    for (int i = 0; i < n - 2; i++) {
        // For each i, count pairs (j, k) with j > i, k > j
        // where nums[i] + nums[j] + nums[k] < target
        for (int j = i + 1; j < n - 1; j++) {
            int remaining = target - nums[i] - nums[j];
            // Binary search for last k where nums[k] < remaining
            int k = upperBound(nums, j + 1, n - 1, remaining - 1);
            count += k - j;  // all indices from j+1 to k are valid
        }
    }
    return count;
}
// Time: O(n² log n) — still improvable
```

---

### Approach 3 — Optimal: Sort + Two Pointers — O(n²) Time, O(1) Space

**The KEY insight (this is the trick to memorize):**

```
After sorting, fix index i. For the remaining subarray [i+1 ... n-1]:
  left = i + 1,  right = n - 1

  If nums[i] + nums[left] + nums[right] < target:
    → EVERY pair (left, left+1), (left, left+2), ..., (left, right) is valid!
      Because nums[right] is the LARGEST in the window, and it already satisfies.
      So we gain (right - left) valid triplets in ONE step.
    → Move left++ to find more triplets.

  If nums[i] + nums[left] + nums[right] >= target:
    → Sum is too large. Move right-- to reduce it.
```

```java
public int threeSumSmaller(int[] nums, int target) {
    Arrays.sort(nums);          // Step 1: Sort — O(n log n)
    int count = 0;
    int n = nums.length;

    for (int i = 0; i < n - 2; i++) {           // Fix first element
        int left = i + 1;
        int right = n - 1;

        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum < target) {
                // CRITICAL: All triplets (i, left, left+1..right) are valid!
                // Because array is sorted: nums[left] <= nums[left+1] <= ... <= nums[right]
                // If (i, left, right) < target, then (i, left, any_middle) < target too
                count += right - left;
                left++;                          // Try next left boundary
            } else {
                right--;                         // Sum too big, shrink from right
            }
        }
    }
    return count;
}
// Time:  O(n log n) for sort + O(n²) for double loop = O(n²) overall
// Space: O(1) — sort in-place (O(log n) for sort call stack)
```

---

### 🔍 Dry Run — Example 1

```
nums = [-2, 0, 1, 3], target = 2

After sort: [-2, 0, 1, 3]  (already sorted)

i = 0, nums[i] = -2:
  left = 1, right = 3
  sum = -2 + 0 + 3 = 1 < 2 → count += (3 - 1) = 2, left = 2
  left = 2, right = 3
  sum = -2 + 1 + 3 = 2 >= 2 → right = 2
  left = 2 = right, loop ends

i = 1, nums[i] = 0:
  left = 2, right = 3
  sum = 0 + 1 + 3 = 4 >= 2 → right = 2
  left = 2 = right, loop ends

i = 2: i < n - 2 = 2 fails, loop ends

Final count = 2 ✅
```

---

### ⚡ Edge Cases
- `n < 3` → return 0 immediately (can't form triplet)
- All elements same → still works correctly
- All sums larger than target → count stays 0

### 💡 Key Interview Insight
> **"When array is sorted and you need pairs/triplets satisfying sum condition,
> two pointers gives O(n) inner loop instead of O(n²). The trick is: when
> sum < target with rightmost pointer, ALL in-between elements also satisfy."**

---

## Problem 2 — LC 11: Container With Most Water

**Platform:** LeetCode | **Difficulty:** Medium | **Pattern:** Two Pointers (Classic)

### 📋 Problem Statement

You are given an integer array `height` of length `n`. There are `n` vertical
lines drawn such that the two endpoints of the `i`-th line are at `(i, 0)` and
`(i, height[i])`. Find two lines that together with the x-axis form a container
that holds the most water. Return the **maximum amount of water** a container
can store.

```
Constraints:
  n == height.length
  2 <= n <= 10⁵
  0 <= height[i] <= 10⁴

Example 1:
  Input:  height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
  Output: 49
  Explanation: Lines at index 1 (h=8) and index 8 (h=7)
               Width = 8 - 1 = 7, height = min(8,7) = 7, area = 49

Example 2:
  Input:  height = [1, 1]
  Output: 1
```

---

### Approach 1 — Brute Force: O(n²)

```java
public int maxArea_BF(int[] height) {
    int maxWater = 0;
    int n = height.length;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int water = (j - i) * Math.min(height[i], height[j]);
            maxWater = Math.max(maxWater, water);
        }
    }
    return maxWater;
}
// Time: O(n²) — TLE for n = 10⁵
// Space: O(1)
```

---

### Approach 2 — Optimal: Two Pointers — O(n) Time, O(1) Space

**The KEY reasoning (most interviewers ask "why does this work?"):**

```
Why can we greedily drop the shorter wall?

  Suppose left wall is shorter (height[L] < height[R]).
  Current area = (R - L) * height[L]

  If we move R left (R--):
    Width decreases. Height can only be ≤ height[L] (same or smaller).
    → Area CANNOT increase. So we NEVER need to try these.

  If we move L right (L++):
    Width decreases, BUT height might increase!
    → Area MIGHT increase. So we SHOULD try this.

  Therefore: always move the pointer with the SMALLER height.
  This is a greedy argument — we provably never skip a better answer.
```

```java
public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxWater = 0;

    while (left < right) {
        // Area = width × min_height
        int width = right - left;
        int h = Math.min(height[left], height[right]);
        int area = width * h;
        maxWater = Math.max(maxWater, area);

        // Move the SHORTER wall — greedy decision
        // WHY: Moving the taller wall can only decrease or maintain area
        //      Moving the shorter wall has a CHANCE of increasing area
        if (height[left] <= height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}
// Time:  O(n) — each pointer moves at most n times total
// Space: O(1)
```

---

### 🔍 Dry Run

```
height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
indices:   0  1  2  3  4  5  6  7  8

left=0(h=1), right=8(h=7):  area=(8)*min(1,7)=8,   max=8,  move left++ (1<7)
left=1(h=8), right=8(h=7):  area=(7)*min(8,7)=49,  max=49, move right-- (8>7)
left=1(h=8), right=7(h=3):  area=(6)*min(8,3)=18,  max=49, move right-- (8>3)
left=1(h=8), right=6(h=8):  area=(5)*min(8,8)=40,  max=49, move left++ (tie→left)
left=2(h=6), right=6(h=8):  area=(4)*min(6,8)=24,  max=49, move left++
left=3(h=2), right=6(h=8):  area=(3)*min(2,8)=6,   max=49, move left++
left=4(h=5), right=6(h=8):  area=(2)*min(5,8)=10,  max=49, move left++
left=5(h=4), right=6(h=8):  area=(1)*min(4,8)=4,   max=49, move left++
left=6 = right=6, loop ends

Answer: 49 ✅
```

---

### 💡 Key Insight
> **"Two pointers from both ends. Always move the shorter wall. Why? Because
> moving the taller wall provably cannot increase area — width shrinks AND
> height is still limited by the shorter wall."**

---

## Problem 3 — CF 1A: Theatre Square

**Platform:** Codeforces | **Difficulty:** Easy (Div 2-A) | **Pattern:** Math + Ceiling Division

### 📋 Problem Statement (Full)

Theatre Square in the capital city of Berland has a rectangular shape
with the size `n × m` metres. Mayor wants to pave the square with square
granite flagstones, each of size `a × a`.

Your task is to find the minimum number of flagstones needed to pave
the Theatre Square. Note that flagstones may not be cut.

**Input Format:**
```
Three positive integers n, m, a on a single line.
```

**Constraints:**
```
1 ≤ n, m, a ≤ 10⁹
```

**Sample Input 1:**
```
6 6 4
```
**Sample Output 1:**
```
4
```
**Explanation:** You need ⌈6/4⌉ × ⌈6/4⌉ = 2 × 2 = 4 flagstones.

**Sample Input 2:**
```
1 1 1
```
**Sample Output 2:**
```
1
```

---

### Approach 1 — Brute Force (Wrong / Impractical)

Simulating tile placement would take O(n*m/a²) time — with 10⁹ inputs that's
impossible. This is NOT the way.

---

### Approach 2 — Math: Ceiling Division — O(1)

**Key Insight:** 
```
  Along the n-axis: you need ⌈n/a⌉ tiles
  Along the m-axis: you need ⌈m/a⌉ tiles
  Total = ⌈n/a⌉ × ⌈m/a⌉

  Ceiling division in integer arithmetic:
    ⌈x/y⌉ = (x + y - 1) / y   [integer division]
         or = (x - 1) / y + 1  [equivalent]

  WHY? Because (x + y - 1) adds just enough to round up.
  Example: ⌈6/4⌉ = (6 + 4 - 1) / 4 = 9 / 4 = 2. Correct!
```

**GOTCHA:** n, m, a can be up to 10⁹. The answer can be up to (10⁹/1)² = 10¹⁸.
This overflows `int`! Must use `long`.

```java
import java.util.Scanner;

public class CF_1A_TheatreSquare {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();  // long! NOT int
        long m = sc.nextLong();
        long a = sc.nextLong();

        // Ceiling division: tiles along each axis
        long tilesN = (n + a - 1) / a;
        long tilesM = (m + a - 1) / a;

        System.out.println(tilesN * tilesM);
    }
}
// Time:  O(1) — pure arithmetic
// Space: O(1)
```

---

### 🔍 Dry Run

```
Input: n=6, m=6, a=4

tilesN = (6 + 4 - 1) / 4 = 9 / 4 = 2
tilesM = (6 + 4 - 1) / 4 = 9 / 4 = 2
Answer = 2 × 2 = 4 ✅

Visualization:
  [F][F][F][F] [F][F][F][F]
  [F][F][F][F] [F][F][F][F]
  [F][F][F][F] [F][F][F][F]
  [F][F][F][F] [F][F][F][F]
  [F][F]··    [F][F]··
  [F][F]··    [F][F]··
  Each F = 4x4 tile, dots = unused but paid for (can't cut)
```

---

### ⚡ Edge Cases
- `n=1, m=1, a=1` → `1×1 = 1`
- `n=1000000000, m=1000000000, a=1` → `10¹⁸` — needs `long`
- `n=a, m=a` → exactly `1×1 = 1` tile

### 💡 Key Insight
> **"Ceiling division ⌈x/y⌉ = (x + y - 1) / y in integer arithmetic.
> Always check for overflow when dimensions can be 10⁹ — use long."**

---

## Problem 4 — CF 580C: Kefa and Park

**Platform:** Codeforces | **Difficulty:** Medium (Div 2-C) | **Pattern:** BFS/DFS on Tree

### 📋 Problem Statement (Full)

Kefa lives in a city that looks like a tree with `n` nodes (vertices numbered
1 to n). The root of the tree is always vertex 1. Each vertex `i` has a value
`a[i]` which is either 0 or 1 (1 = there's a cat at this vertex).

Kefa wants to go to a restaurant. A restaurant is any leaf node (a node
with no children). Kefa is afraid of cats, so he won't walk along any path
that has **more than m consecutive cats** (vertices with cat = 1 adjacent to
each other).

Find the number of restaurants Kefa can visit.

**Input Format:**
```
Line 1: two integers n m
Line 2: a[1], a[2], ..., a[n]  (0 or 1)
Next n-1 lines: edges u v
```

**Constraints:**
```
2 ≤ n ≤ 10⁵
0 ≤ m ≤ n
0 ≤ a[i] ≤ 1
```

**Sample Input 1:**
```
4 1
1 1 0 0
1 2
1 3
1 4
```
**Sample Output 1:**
```
2
```
**Explanation:** Restaurants are nodes 2, 3, 4. 
- Path to 2: 1→2. Node 1 has cat, node 2 has cat → 2 consecutive cats > m=1. ❌
- Path to 3: 1→3. Node 1 has cat → 1 cat = m=1. ✅
- Path to 4: 1→4. Node 1 has cat → 1 cat = m=1. ✅
Count = 2.

**Sample Input 2:**
```
7 1
1 0 1 1 0 0 0
1 2
1 3
2 4
2 5
3 6
3 7
```
**Sample Output 2:**
```
2
```

---

### Approach 1 — Brute Force (Conceptual)

For each leaf, trace the path from root to leaf and count max consecutive
cats. O(n²) in worst case (star graph).

---

### Approach 2 — Better: DFS keeping track of current consecutive cats

**Key Insight:** During DFS, pass a counter of consecutive cats.
```
- If current node has a cat:       catsInRow = catsInRow + 1
- If current node has no cat:       catsInRow = 0    (streak broken!)
- If catsInRow > m at any point:   STOP — this path is blocked
- If we reach a leaf with catsInRow <= m: count it
```

This is O(n) which is optimal for a tree traversal.

```java
import java.util.*;

public class CF_580C_KefaAndPark {
    static int[] cats;
    static List<List<Integer>> adj;
    static int m;
    static int restaurants = 0;

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        m = sc.nextInt();

        cats = new int[n + 1];
        for (int i = 1; i <= n; i++) cats[i] = sc.nextInt();

        adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());

        for (int i = 0; i < n - 1; i++) {
            int u = sc.nextInt(), v = sc.nextInt();
            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        // DFS from root (node 1), parent = -1, consecutive cats from root
        int startCats = cats[1] == 1 ? 1 : 0;
        dfs(1, -1, startCats);

        System.out.println(restaurants);
    }

    static void dfs(int node, int parent, int catsInRow) {
        if (catsInRow > m) return;  // Path is blocked — prune this branch

        boolean isLeaf = true;  // Assume leaf until we find a child
        for (int neighbor : adj.get(node)) {
            if (neighbor == parent) continue;  // Don't go back to parent
            isLeaf = false;

            // Update consecutive cat count
            int newCats = (cats[neighbor] == 1) ? catsInRow + 1 : 0;
            dfs(neighbor, node, newCats);
        }

        // Leaf node (no children other than parent) AND path is valid
        if (isLeaf) {
            restaurants++;
        }
    }
}
// Time:  O(n) — each node visited exactly once
// Space: O(n) — adjacency list + recursion stack depth O(n) worst case
```

---

### 🔍 Dry Run — Sample 2

```
Tree structure (root = 1):
      1(cat)
     / \
   2(0) 3(cat)
   / \   / \
  4   5 6   7

m = 1 (at most 1 consecutive cat)

DFS from node 1:
  catsInRow at start = cats[1] = 1

  Visit 2 (parent=1):
    cats[2]=0, newCats = 0
    Visit 4 (parent=2): cats[4]=1, newCats = 1 ≤ m=1
      4 is a leaf → restaurants++ → restaurants=1
    Visit 5 (parent=2): cats[5]=0, newCats = 0 ≤ m=1
      5 is a leaf → restaurants++ → restaurants=2

  Visit 3 (parent=1):
    cats[3]=1, newCats = 1 + 1 = 2 > m=1 → PRUNED, return

Final restaurants = 2 ✅
```

---

### Approach 3 — BFS Variant (Same Complexity, Iterative)

```java
static void bfs(int root) {
    // [node, parent, catsInRow]
    Queue<int[]> queue = new LinkedList<>();
    int startCats = cats[root] == 1 ? 1 : 0;
    queue.offer(new int[]{root, -1, startCats});

    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        int node = curr[0], parent = curr[1], catsInRow = curr[2];

        if (catsInRow > m) continue;  // Blocked path

        boolean isLeaf = true;
        for (int neighbor : adj.get(node)) {
            if (neighbor == parent) continue;
            isLeaf = false;
            int newCats = (cats[neighbor] == 1) ? catsInRow + 1 : 0;
            queue.offer(new int[]{neighbor, node, newCats});
        }
        if (isLeaf) restaurants++;
    }
}
```

---

### ⚡ Edge Cases
- All nodes are leaves → only root exists, but n ≥ 2 so root has at least one child
- `m = 0` → no cats allowed at all, any cat on path blocks it
- `m = n` → all paths valid since max consecutive cats ≤ n
- Chain (linear tree): DFS can hit stack overflow for n=10⁵ → BFS safer

### 💡 Key Insight
> **"Tree DFS with state propagation: carry a counter (catsInRow) that resets
> when the condition breaks. Prune entire subtrees when limit exceeded — this
> is what makes it O(n) instead of O(n²)."**

---

## 📊 Day 01 Summary

| Problem | Pattern | Time | Space | Difficulty |
|---------|---------|------|-------|------------|
| LC 259 3Sum Smaller | Sort + Two Pointers | O(n²) | O(1) | Medium |
| LC 11 Container Water | Two Pointers | O(n) | O(1) | Medium |
| CF 1A Theatre Square | Math + Ceiling Division | O(1) | O(1) | Easy |
| CF 580C Kefa and Park | DFS/BFS on Tree | O(n) | O(n) | Medium |

### 🎯 Patterns to Remember
1. **3Sum pattern:** Fix 1 element, two-pointer the rest
2. **Container pattern:** Move the shorter wall (greedy proof!)
3. **Ceiling division:** `(x + y - 1) / y` — use `long` for large inputs
4. **Tree DFS with state:** Pass accumulated state (catsInRow) down the recursion

---

> **Next Day:** [Day 02 — Arrays: Prefix Sum Pattern](Day_002_Arrays_PrefixSum.md)
