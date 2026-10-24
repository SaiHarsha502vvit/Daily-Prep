# 📊 Part 8: Frequency & Duplicates

> **Navigation**: [← Sorting Algorithms — All 5](05_sorting_algorithms_all_5.md) | [Chapter overview](../01b_Arrays.md) | [University-Level Addendum — Arrays as… →](07_university_level_addendum_arrays_as_formal.md)
> Page 6 of 7 in **Arrays**


## 💬 Study-Partner View — Frequency & Duplicates

**1. The bottom line:** Counting how often things appear is the job of a hash map (or a count array), and that trick solves most "duplicates" problems in one pass.

**2. The textbook core:**

- Use `HashMap<item, count>` (or `int[26]` / `int[256]` for characters) → O(n) time, O(k) space for k distinct items.
- `HashSet` answers "have I seen this?" in O(1) average.
- Sorting is an alternative: equal items become adjacent, O(n log n) time, O(1) extra space.
- Top-K frequent: hash map + heap, or bucket sort by frequency.

**3. The real-world analogy:** A **tally sheet at an election**: for each ballot you add a mark under that candidate's name; at the end the counts are right there.

**4. Walkthrough:**

1. Does `[3, 1, 4, 1, 5]` contain a duplicate?
2. Scan with a `HashSet`: add 3, 1, 4.
3. Next is 1; `set.add(1)` returns `false` because it is already there → duplicate found.
4. One pass: O(n) time, O(n) space.

> [!NOTE]
> **Quick check:** How could you do it with O(1) extra space? *Sort the array first and compare neighbours (O(n log n) time).*


## 🔵 Level 1: Brute — Nested Loops O(n²)

```java
// Count how many times each element appears — O(n²)
for (int i = 0; i < n; i++) {
    int freq = 0;
    for (int j = 0; j < n; j++)
        if (arr[j] == arr[i]) freq++;
    System.out.println(arr[i] + " appears " + freq + " times");
}
// Problem: counts same element multiple times, and O(n²) is too slow for large n
```

## 🧱 Hit the Wall — Need O(n) Lookup by Value

Finding most repeated, least repeated, duplicates: all O(n²) with nested loops.

---

## 🚀 GO LEARN — HashMap

**STOP** — The O(n) solution for ALL frequency problems uses HashMap.

📖 [01e_HashTable.md](../01e_HashTable.md)
Focus on: `put`, `get`, `getOrDefault`, `containsKey`, `merge`, `entrySet`

⬅️ **RETURN CHECKPOINT** — Apply HashMap below.

---

## ✅ Apply: Frequency using HashMap O(n)

```java
// Build frequency map — O(n)
Map<Integer,Integer> freq = new HashMap<>();
for (int x : arr) freq.merge(x, 1, Integer::sum);   // freq[x]++

// Most repeated element
int maxFreq = 0, mostRepeated = -1;
for (var e : freq.entrySet())
    if (e.getValue() > maxFreq) { maxFreq = e.getValue(); mostRepeated = e.getKey(); }

// Count unique elements
int uniques = freq.size();

// Count elements appearing more than once
long dups = freq.values().stream().filter(v -> v > 1).count();
```

## ✅ Loop Patterns for Frequency

```java
// Include right loop (expand from left — cumulative)
for (int right = 0; right < n; right++) { /* process arr[right] */ }

// Include both (shrink/grow window)
for (int left = 0, right = 0; right < n; right++) {
    // add arr[right] to window
    while (/* condition violated */) { /* remove arr[left] */ left++; }
}
```

## ✅ Common Elements in Two Arrays — HashSet O(n+m)

```java
Set<Integer> setA = new HashSet<>();
for (int x : a) setA.add(x);
for (int x : b) if (setA.contains(x)) System.out.print(x + " ");
// vs brute: O(n*m) nested loops
```

## ✅ LCM / GCD of Array Elements

```java
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
int lcm(int a, int b) { return a / gcd(a,b) * b; }   // a/gcd first avoids overflow

// GCD of entire array
int arrGcd = arr[0];
for (int i = 1; i < n; i++) arrGcd = gcd(arrGcd, arr[i]);

// LCM of entire array
long arrLcm = arr[0];
for (int i = 1; i < n; i++) arrLcm = lcm((int)arrLcm, arr[i]);

// LCM of only odd numbers
long oddLcm = 1;
for (int x : arr) if (x % 2 != 0) oddLcm = lcm((int)oddLcm, x);
```

## 🎯 Problems

| Problem                               | Pattern                   |
| ------------------------------------- | ------------------------- |
| LC 1 — Two Sum                        | HashMap complement lookup |
| LC 242 — Valid Anagram                | Frequency count           |
| LC 347 — Top K Frequent Elements      | Freq + Heap               |
| LC 128 — Longest Consecutive Sequence | HashSet O(n)              |
| CF 4C — Registration System           | HashMap counting          |

## 🧠 Pattern Fingerprint — Frequency

**See these words → use this technique:**

| If the problem says... | Use |
| ---------------------- | --- |
| "most/least frequent" | HashMap + track max |
| "count occurrences" | HashMap freq |
| "find duplicate" | HashSet or sorting |
| "common elements two arrays" | HashSet O(n+m) |
| "O(1) lookup by value" | HashMap |

## 📅 Revisit Tracker

- **Day 3:** Redo LC 1 (Two Sum) + LC 242 (Anagram)
- **Day 7:** Redo LC 128 (Consecutive — HashSet O(n))

---

## 🔄 Part 9: Circular Arrays & Rotations

### 💬 Study-Partner View — Circular Arrays & Rotations

**1. The bottom line:** Wrapping around an array is just the modulo operator, and rotating an array can be done in place with three reversals.

**2. The textbook core:**

- Next index in a circle: `(i + 1) % n`; previous: `(i - 1 + n) % n`.
- Rotate right by `k`: use `k % n`, then **reverse all**, reverse the first `k`, reverse the rest → O(n) time, O(1) space.
- A circular buffer keeps `head` and `size` and uses modulo for both ends.
- Circular problems can be solved on a doubled array or with modular indexing.

**3. The real-world analogy:** A **clock face**: after 12 comes 1 again, so moving "forward 5 hours from 10" lands on 3.

**4. Walkthrough:**

1. Rotate `[1, 2, 3, 4, 5]` right by 2.
2. Reverse the whole array: `[5, 4, 3, 2, 1]`.
3. Reverse the first 2: `[4, 5, 3, 2, 1]`; reverse the rest: `[4, 5, 1, 2, 3]`.
4. Result: `[4, 5, 1, 2, 3]`, using only swaps.

> [!NOTE]
> **Quick check:** Why take `k % n` first? *Rotating by `n` returns the original array, so only the remainder matters.*


### Theory — What is a Circular Array?

```
A circular array wraps: index (n-1)+1 → loops back to 0
Input: {1,2,3}
All rotations:
  {1,2,3}  (rotate by 0)
  {2,3,1}  (rotate left by 1)
  {3,1,2}  (rotate left by 2)
Key: use (i + rotate) % n  to access circularly
```

### Print All Circular Rotations O(n²)

```java
public void printRotations(int[] arr) {
    int n = arr.length;
    for (int r = 0; r < n; r++) {
        for (int i = 0; i < n; i++)
            System.out.print(arr[(r + i) % n] + " ");   // modulo is the trick
        System.out.println();
    }
}
```

### Rotate Array Left by K — Reverse Trick O(n) time O(1) space

```java
public void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    k = k % n;                         // handle k > n
    reverse(arr, 0, k - 1);           // reverse first k
    reverse(arr, k, n - 1);           // reverse rest
    reverse(arr, 0, n - 1);           // reverse all
}
private void reverse(int[] arr, int l, int r) {
    while (l < r) { int t=arr[l]; arr[l]=arr[r]; arr[r]=t; l++; r--; }
}
// {1,2,3,4,5}, k=2 → {3,4,5,1,2}
```

### 🎯 Problems

| Problem                              | Pattern                   |
| ------------------------------------ | ------------------------- |
| LC 189 — Rotate Array                | Reverse trick             |
| LC 153 — Min in Rotated Sorted Array | Binary search             |
| LC 918 — Max Sum Circular Subarray   | Kadane's + circular trick |

---

## 🌀 Part 10: Recursion in Arrays

📖 **GO LEARN Recursion fundamentals first if new:**

- 📖 [03b_Recursion_Fundamentals.md](../../03_Algorithms/03b_Recursion_Fundamentals.md)
- ⬅️ Return here to apply it to arrays.

### Recursive Sum

```java
public int sum(int[] arr, int n) {
    if (n == 0) return 0;                         // base case
    return arr[n-1] + sum(arr, n-1);             // reduce and recurse
}
// T(n) = T(n-1) + O(1)  →  O(n) time, O(n) space (stack frames)
```

### Recursive Binary Search

```java
public int binarySearch(int[] arr, int l, int r, int target) {
    if (l > r) return -1;
    int mid = l + (r - l) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) return binarySearch(arr, mid+1, r, target);
    return binarySearch(arr, l, mid-1, target);
}
// T(n) = T(n/2) + O(1)  →  O(log n)
```

### Recursive Reverse

```java
public void reverse(int[] arr, int left, int right) {
    if (left >= right) return;
    int tmp = arr[left]; arr[left] = arr[right]; arr[right] = tmp;
    reverse(arr, left+1, right-1);
}
```

🧠 **Key insight:** Recursion on arrays is often the brute force for subsequences and subsets. DP is the optimization: recursion + memoization.

---

🔬 **Section Challenge — 🌀 Part 10: Recursion in Arrays**

**Challenge 1 (Reasoning):** Every recursive algorithm can be converted to iterative. What data structure replaces the call stack?

<details><summary>Answer</summary>

An explicit `Stack<State>` where State holds what the stack frame would hold (current node, remaining work, partial results). DFS → explicit stack. Factorial → accumulator variable (tail recursion → loop). Tree traversal → stack with nodes + 'visited' flag. When to use recursion vs iteration: recursion = cleaner code when tree/graph depth is bounded. Iteration = necessary when depth is unbounded (stack overflow risk) or when performance is critical.

</details>

**Challenge 2 (Bug Hunt):**

```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```

Why and what are the 3 fixes?

<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.

</details>

## ⚡ Part 11: Pattern Connections Hub

**Master map:** Array problem type → Pattern → DS needed → Where to learn

| Problem Type         | Pattern                         | DS Used       | Study File                                                                         | Example      |
| -------------------- | ------------------------------- | ------------- | ---------------------------------------------------------------------------------- | ------------ |
| Max/min subarray sum | **Kadane's**                    | Variables     | [04_Pattern_Recognition](../../04_Patterns_Templates/04_Pattern_Recognition.md)       | LC 53        |
| Subarray sum = K     | **Prefix Sum + HashMap**        | HashMap       | [04_Pattern_Recognition](../../04_Patterns_Templates/04_Pattern_Recognition.md)       | LC 560       |
| Min window subarray  | **Sliding Window**              | Two ptrs      | [01_Sliding_Window](../../04_Patterns_Templates/01_Sliding_Window.md)                 | LC 209, 76   |
| Pairs with sum K     | **Two Pointers** or **HashMap** | Array/Map     | [07_Two_Pointers](../../04_Patterns_Templates/07_Two_Pointers_Complete.md)            | LC 1, 167    |
| All subsequences     | **Recursion / Backtracking**    | Call stack    | [03c_Recursion_Advanced](../../03_Algorithms/03c_Recursion_Advanced.md)               | LC 78        |
| LIS / LCS            | **DP**                          | 1D/2D array   | [04b_DP_Fundamentals](../../03_Algorithms/04b_DP_Fundamentals.md)                     | LC 300, 1143 |
| Frequency / count    | **HashMap**                     | HashMap       | [01e_HashTable](../01e_HashTable.md)                                                  | LC 1, 347    |
| Find in sorted       | **Binary Search**               | Two ptrs      | [06_Binary_Search_Patterns](../../04_Patterns_Templates/06_Binary_Search_Patterns.md) | LC 704, 33   |
| k-th largest         | **Heap / QuickSelect**          | PriorityQueue | [01f_Trees_Heaps](../01f_Trees_Heaps.md)                                              | LC 215       |
| 3 groups (0,1,2)     | **Dutch National Flag**         | Two ptrs      | [02a_Sorting](../../03_Algorithms/02a_Sorting_Fundamentals.md)                        | LC 75        |

### 🧠 Master Keyword → Pattern Map

| If the problem says... | Use |
| ---------------------- | --- |
| "contiguous" + "sum/max/min" | Sliding window or Kadane's |
| "subarray" + "sum equals K" | Prefix sum + HashMap |
| "subsequence" | Recursion or DP |
| "pairs/triplets" + "sum" | Two pointers (sort first) or HashMap |
| "sorted" + "search" | Binary search |
| "frequency" / "count" | HashMap |
| "rotate" / "circular" | Modulo arithmetic `(i+k)%n` |
| "k-th largest/smallest" | Min-heap of size k |
| "all possible" / "generate all" | Recursion / backtracking |
| "minimum/maximum" + "global" | Greedy or DP |

---

### 🔗 Cross-References — Navigate the Ecosystem

| Topic                          | Related Content                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Array patterns & templates     | [Array + Two Pointers](../../04_Patterns_Templates/08_Array_Plus_TwoPointers.md)   |
| Array practice problems        | [Problem Solving — Arrays](../../05_Problem_Solving/04_Arrays.md)                  |
| Sorting algorithms on arrays   | [Sorting Fundamentals](../../03_Algorithms/02a_Sorting_Fundamentals.md)            |
| Sliding window on arrays       | [Sliding Window Mastery](../../04_Patterns_Templates/01_Sliding_Window.md)         |
| Binary search on sorted arrays | [Binary Search Patterns](../../04_Patterns_Templates/06_Binary_Search_Patterns.md) |
| 2D arrays / Matrix             | [2D Arrays & Matrix](../04_2D_Arrays_Matrix.md)                                    |
| NumPy arrays (Python)          | [NumPy & Pandas](../../25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md)          |

---

---

## ✅ You Know Arrays — Now Practice! (JIT Study Path)

**Follow this exact order. Don't skip steps.**

**Step 1 — Basic Problems (Warm Up):**

| Problem                     | LC #   | Pattern         | What to Learn                    |
| --------------------------- | ------ | --------------- | -------------------------------- |
| Two Sum                     | LC 1   | HashMap lookup  | O(n²) → O(n) with complement map |
| Best Time to Buy/Sell Stock | LC 121 | Min-so-far scan | Single pass tracking             |
| Contains Duplicate          | LC 217 | HashSet         | O(n) existence check             |
| Missing Number              | LC 268 | Math / XOR      | n\*(n+1)/2 or XOR trick          |
| Maximum Subarray            | LC 53  | Kadane's algo   | dp[i] = max(num, dp[i-1]+num)    |

**Step 2 — Hit a wall? Learn these patterns:**

- Contiguous subarray → **[Sliding Window Template](../../04_Patterns_Templates/01_Sliding_Window.md)**
- In-place operations → **[Two Pointers Template](../../04_Patterns_Templates/07_Two_Pointers_Complete.md)**
- "Sum equals K" → **[Prefix Sum Guide](../../03_Algorithms/19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md)**

**Step 3 — Apply patterns on harder problems:**
👉 **[Go to Arrays Problem Solving File →](../../05_Problem_Solving/04_Arrays.md)**

**Step 4 — Competitive Practice:**

| CF Problem                                                                        | Topic              | Difficulty  |
| --------------------------------------------------------------------------------- | ------------------ | ----------- |
| [CF 1A — Theatre Square](https://codeforces.com/problemset/problem/1/A)           | Math on arrays     | ⭐ Easy     |
| [CF 158B — Taxi](https://codeforces.com/problemset/problem/158/B)                 | Array grouping     | ⭐ Easy     |
| [CF 1515C — Phoenix and Towers](https://codeforces.com/problemset/problem/1515/C) | Array construction | ⭐⭐ Medium |

🌍 **Real-World Connections:**

- **Netflix** stores your watch history as an array, uses sliding window to compute "trending in last 7 days"
- **Stock price APIs** return arrays; max profit = max(price[i] - min(price[0..i-1]))
- **Sensor data** (IoT, medical devices) uses circular arrays / ring buffers
- **Git diff** (add/remove lines) uses LCS algorithm on arrays of lines

---

[← Sorting Algorithms — All 5](05_sorting_algorithms_all_5.md) | [Chapter overview](../01b_Arrays.md) | [University-Level Addendum — Arrays as… →](07_university_level_addendum_arrays_as_formal.md)
