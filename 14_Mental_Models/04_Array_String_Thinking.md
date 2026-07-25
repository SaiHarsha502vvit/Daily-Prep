**Navigation**: [< Previous](03_Graph_Tree_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_Universal_Problem_Framework.md)

# 🔍 Array & String Problem Thinking — Mental Model

**The key insight**: Arrays and strings have a SMALL set of core techniques. The skill is recognizing WHICH technique applies based on problem constraints. This decision tree will guide you.

---

## Part 0: Constraint Overrides Before the Decision Tree

The same keyword can point to different patterns depending on constraints.

| If You See        | Check This                   | Choose                          |
| ----------------- | ---------------------------- | ------------------------------- |
| `subarray sum`    | all values positive?         | sliding window may work         |
| `subarray sum`    | negatives allowed?           | prefix sum + hashmap/tree/deque |
| `pair sum`        | sorted?                      | two pointers                    |
| `pair sum`        | unsorted and indices needed? | hashmap complement              |
| `range sum query` | no updates?                  | prefix sum                      |
| `range query`     | updates exist?               | Fenwick / segment tree          |
| `substring`       | contiguous char condition?   | sliding window                  |
| `subsequence`     | can skip characters?         | DP / greedy / binary search     |

Full map: [Constraint-Based Pattern Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md).

---

## NEW DIAGRAM — Two-Pointer & Sliding-Window Step-by-Step Annotations

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM A: Two Pointers (Opposite Ends) — Step-by-Step                     │
│             Example: sorted array [1, 2, 4, 7, 11, 15], target = 9          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PROBLEM: Find if any pair sums to target = 9 in SORTED array               │
│                                                                              │
│  INVARIANT: left + right vs target determines pointer movement              │
│  • left + right > target → move RIGHT inward (reduce sum)                   │
│  • left + right < target → move LEFT inward (increase sum)                  │
│  • left + right == target → FOUND!                                          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Step 1: Initialize pointers                    idx:  0  1  2  3  4  5 │    │
│  │    left = 0 (pointing to arr[0] = 1)              [ 1, 2, 4, 7, 11, 15]│    │
│  │    right = n-1 = 5 (pointing to arr[5] = 15)           L            R   │    │
│  │                                                                              │    │
│  │  Step 2: Check arr[left] + arr[right] = 1 + 15 = 16                     │    │
│  │    16 > 9 → Move right inward: right-- → right = 4                      │    │
│  │                                                    L          R          │    │
│  │    [ 1, 2, 4, 7, 11, 15]                                              │    │
│  │                                                                              │    │
│  │  Step 3: Check arr[left] + arr[right] = 1 + 11 = 12                     │    │
│  │    12 > 9 → Move right inward: right-- → right = 3                      │    │
│  │                                                    L      R              │    │
│  │    [ 1, 2, 4, 7, 11, 15]                                              │    │
│  │                                                                              │    │
│  │  Step 4: Check arr[left] + arr[right] = 1 + 7 = 8                       │    │
│  │    8 < 9 → Move left inward: left++ → left = 1                          │    │
│  │                L      R                                                  │    │
│  │    [ 1, 2, 4, 7, 11, 15]                                              │    │
│  │                                                                              │    │
│  │  Step 5: Check arr[left] + arr[right] = 2 + 7 = 9                       │    │
│  │    9 == 9 → FOUND! Return indices [left, right] = [1, 3] ✅            │    │
│  │                L      R                                                  │    │
│  │    [ 1, 2, 4, 7, 11, 15]                                              │    │
│  │                                                                              │    │
│  │  WHY IT WORKS: Both pointers only move inward. Discarded pairs CANNOT   │    │
│  │  become valid later:                                                    │    │
│  │    • (L=0,R=4) = 12 > 9 → if we move L inward, sum gets SMALLER, not   │    │
│  │      bigger → never reaches 9. We correctly DISCARD this branch.        │    │
│  │    • (L=1,R=3) = 9 → FOUND!                                            │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  DIAGRAM B: Sliding Window (Variable) — Longest subarray sum < 10      │    │
│  │             Example: arr = [2, 3, 1, 2, 4, 3], target = 10            │    │
│  │                                                                       │    │
│  │  IDEA: Expand right pointer, shrink left when condition violated       │    │
│  │  INVARIANT: Window [left..right] always satisfies sum < 10 (if valid) │    │
│  │                                                                       │    │
│  │  Initial: left=0, right=0, sum=0, maxLen=0                            │    │
│  │                                                                       │    │
│  │  [2, 3, 1, 2, 4, 3]                                                    │    │
│  │   LR                                                                   │    │
│  │  Step 1: Expand right (0), add 2 → sum=2, window=[2], maxLen=1        │    │
│  │                                                                       │    │
│  │  [2, 3, 1, 2, 4, 3]                                                    │    │
│  │   L   R                                                                 │    │
│  │  Step 2: Expand right (1), add 3 → sum=5, window=[2,3], maxLen=2      │    │
│  │                                                                       │    │
│  │  [2, 3, 1, 2, 4, 3]                                                    │    │
│  │   L      R                                                              │    │
│  │  Step 3: Expand right (2), add 1 → sum=6, window=[2,3,1], maxLen=3    │    │
│  │                                                                       │    │
│  │  [2, 3, 1, 2, 4, 3]                                                    │    │
│  │   L         R                                                           │    │
│  │  Step 4: Expand right (3), add 2 → sum=8, window=[2,3,1,2], maxLen=4  │    │
│  │                                                                       │    │
│  │  [2, 3, 1, 2, 4, 3]                                                    │    │
│  │   L            R                                                        │    │
│  │  Step 5: Expand right (4), add 4 → sum=12 > 10! VIOLATED               │    │
│  │          Now shrink from left: remove arr[left]=2 → sum=10, left=1     │    │
│  │          sum=10, window=[3,1,2,4], maxLen=4                            │    │
│  │          Still 10 NOT < 10, shrink again: remove arr[1]=3 → sum=7      │    │
│  │          left=2, window=[1,2,4], maxLen=4                              │    │
│  │                                                                       │    │
│  │  [2, 3, 1, 2, 4, 3]                                                    │    │
│  │            L      R                                                     │    │
│  │  Step 6: Expand right (5), add 3 → sum=10, window=[1,2,4,3]           │    │
│  │          10 NOT < 10 → shrink: remove arr[2]=1 → sum=9, left=3        │    │
│  │          window=[2,4,3], maxLen stays 4                               │    │
│  │                                                                       │    │
│  │  ANSWER: maxLen = 4 (window [3,1,2,4] or [1,2,4,3])                   │    │
│  │  TIME: O(n) — each pointer moves at most n times                      │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Part 1: The Master Decision Tree

```
Read the problem → Ask these questions IN ORDER:

Q1: Is the array SORTED (or can sorting help)?
├── YES → TWO POINTERS (from both ends or same direction)
│   Examples: Two Sum II, 3Sum, Container With Most Water
│   Also consider: Binary Search
└── NO → Continue...

Q2: Does the problem ask about CONTIGUOUS subarray?
├── YES → SLIDING WINDOW or PREFIX SUM
│   ├── "Maximum/minimum of fixed size window" → Fixed Sliding Window
│   ├── "Smallest subarray with sum ≥ k" → Variable Sliding Window
│   └── "Subarray sum equals k" → Prefix Sum + HashMap
└── NO → Continue...

Q3: Does the problem involve COUNTING or FREQUENCY?
├── YES → HASHMAP (frequency map)
│   Examples: Two Sum, Anagram check, Group Anagrams
└── NO → Continue...

Q4: Does the problem need specific ORDER (stack-like)?
├── YES → STACK (monotonic stack for Next Greater/Smaller)
│   Examples: Next Greater Element, Daily Temperatures, Largest Rectangle
└── NO → Continue...

Q5: Does the problem involve SUBSEQUENCE or SELECTION?
├── YES → Dynamic Programming or Greedy
│   ├── "Optimal" → DP (LIS, LCS)
│   └── "Greedy works (exchange argument)" → Greedy
└── NO → Continue...

Q6: Limitation says O(n) and array has range [0, n-1]?
├── YES → IN-PLACE MARKING (use indices as hash)
│   Examples: Find Missing Number, Find Duplicate, First Missing Positive
└── NO → Brute force, then optimize
```

---

## Part 2: Two Pointers — When and How

### Two Pointer Variants

```
Variant 1: OPPOSITE ends (sorted array)
┌─────────────────────────┐
│ L→               ←R     │  Move L or R based on comparison
└─────────────────────────┘
When: Sorted array, find pair with target sum, three sum, water container
Logic: If sum < target → move L right; if sum > target → move R left

Variant 2: SAME direction (fast/slow)
┌─────────────────────────┐
│ S→  F→                  │  Fast explores, Slow tracks "good" position
└─────────────────────────┘
When: Remove duplicates, partition array, merge sorted arrays
Logic: Fast scans every element; Slow marks where to write

Variant 3: MERGE (two arrays)
Array1: [1, 3, 5]    p1→
Array2: [2, 4, 6]    p2→
Result: [1, 2, 3, 4, 5, 6]
When: Merge two sorted arrays/lists, intersection of sorted arrays
```

### Template: Two Sum on Sorted Array

```java
int left = 0, right = arr.length - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) return new int[]{left, right};
    else if (sum < target) left++;
    else right--;
}
```

---

🔬 **Section Challenge — Part 2: Two Pointers — When and How**

**Challenge 1 (Reasoning):** In the classic "Two Sum II" (array is sorted), you start pointers at `left = 0` and `right = n - 1`. If `sum > target`, you do `right--`. A junior engineer asks, "How do we know we didn't just skip the correct answer by moving `right`? What if `arr[left+1] + arr[right]` was the target?" Provide the mathematical proof.

<details><summary>Answer</summary>

Because the array is sorted, `arr[left+1] >= arr[left]`. If `arr[left] + arr[right] > target`, then `arr[left+1] + arr[right]` must be EVEN GREATER than the target! The current `right` element is simply too large to pair with _any_ element equal to or larger than `arr[left]`. Therefore, the current `right` element cannot be part of any valid pair with elements to the right of `left`. We can safely discard it by doing `right--` without missing the answer. This is the core "search space reduction" proof for two pointers.

</details>

## Part 3: Sliding Window — When and How

### Fixed vs Variable Window

```
FIXED Window (size = k):
[a b c] d e f     → compute for window
 a [b c d] e f    → slide right, update
  a b [c d e] f   → slide right, update

When: "Maximum sum of k consecutive elements", "Average of subarrays of size k"
Template: Add right edge, remove left edge when window > k

VARIABLE Window (find smallest/largest valid window):
[a b c d] e f     → expand right until valid
 a [b c d e] f    → shrink left while still valid

When: "Smallest subarray with sum ≥ target", "Longest substring without repeating"
Template: Expand right always, shrink left while condition met
```

### Variable Window Template

```java
int left = 0;
int bestAnswer = initial;
// Whatever state you need (sum, HashMap, etc.)

for (int right = 0; right < n; right++) {
    // 1. ADD arr[right] to window state

    // 2. SHRINK from left while window is INVALID
    while (windowIsInvalid()) {
        // Remove arr[left] from window state
        left++;
    }

    // 3. UPDATE answer (window [left..right] is valid)
    bestAnswer = Math.max(bestAnswer, right - left + 1);
}
```

### Key Insight: "At Most K" Trick

```
"Exactly K distinct" = "At Most K distinct" − "At Most (K−1) distinct"

This converts a hard "exactly K" problem into two easier "at most K" problems.
Works for: Subarrays with Exactly K Distinct Integers (LC 992)
```

---

🔬 **Section Challenge — Part 3: Sliding Window — When and How**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## Part 4: Prefix Sum — When and How

### Mental Model: Running Total

```
Array:      [3,  1,  4,  1,  5,  9]
Prefix Sum: [0,  3,  4,  8,  9, 14, 23]
             ↑ sentinel

Sum of subarray [i..j] = prefix[j+1] - prefix[i]
Sum of [1..3] = prefix[4] - prefix[1] = 9 - 3 = 6  ✓ (1+4+1=6)
```

### Prefix Sum + HashMap Pattern

```
Problem: "How many subarrays have sum equal to k?"

Key insight: If prefix[j] - prefix[i] = k, then subarray [i+1..j] sums to k
→ Equivalent to: prefix[j] - k = prefix[i]
→ For each j, count how many previous prefix sums equal (prefix[j] - k)
→ Use HashMap to store frequency of prefix sums seen so far!
```

```java
int count = 0, sum = 0;
Map<Integer, Integer> map = new HashMap<>();
map.put(0, 1);  // Empty prefix

for (int num : arr) {
    sum += num;
    count += map.getOrDefault(sum - k, 0);
    map.merge(sum, 1, Integer::sum);
}
return count;
```

---

🔬 **Section Challenge — Part 4: Prefix Sum — When and How**

**Challenge 1 (Debug):** You are solving "Subarray Sum Equals K" using a HashMap. Your code loops through the array, updates the running `sum`, and checks `if (map.containsKey(sum - k)) count += map.get(sum - k);`. You test it with `arr = [3, 4, 7]`, `k = 7`. It returns `0` instead of `2` (the subarrays `[3, 4]` and `[7]`). What initialization step did you forget?

<details><summary>Answer</summary>

You forgot the sentinel value: `map.put(0, 1)`. When the loop reaches the `7` at index 2, the running `sum` is `14`. It checks for `14 - 7 = 7`. The prefix sum `7` exists in the map (from index 1, where `3+4=7`). So it correctly counts the `[7]` subarray. BUT, when the loop is at index 1 (`4`), the running sum is `7`. It checks for `7 - 7 = 0`. Since `0` is not in the map, it fails to count the valid subarray `[3, 4]`. The prefix `0` represents the "empty prefix" before the array starts, which is mathematically necessary to count subarrays that start at index 0.

</details>

## Part 5: String-Specific Patterns

### String Comparison Table

```
Problem Type:                         → Technique:
"Are two strings anagrams?"           → Sort both OR frequency count (int[26])
"Find all anagrams in string"         → Sliding window + frequency match
"Longest palindromic substring"       → Expand around center (O(n²)) or Manacher
"Pattern matching"                    → KMP for exact, Rabin-Karp for rolling hash
"All permutations of string"          → Backtracking with frequency tracking
"Edit distance between strings"       → DP (2D table)
"Longest common subsequence"          → DP (2D table)
"String to integer / parse"           → Manual parsing with edge cases
"Reverse words in string"             → Split → reverse array → join (or two passes)
```

### Character Frequency Trick (int[26])

```java
// Instead of HashMap<Character, Integer>, use:
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;

// Compare anagrams:
Arrays.equals(freq1, freq2);  // O(26) = O(1)

// WHY? Faster than HashMap, no boxing, cache-friendly
```

### StringBuilder vs String Concatenation

```
// WRONG (O(n²) — creates new string each time):
String result = "";
for (int i = 0; i < n; i++) result += "x";

// CORRECT (O(n) — mutable buffer):
StringBuilder sb = new StringBuilder();
for (int i = 0; i < n; i++) sb.append("x");
String result = sb.toString();
```

---

## Part 6: In-Place Array Techniques

### Index-as-Hash (O(1) space tricks)

```
When array has values in range [1, n] or [0, n-1]:

"Find missing number" → XOR all values with all indices
"Find duplicate" → Floyd's cycle detection on index chain
"First missing positive" → Mark presence by negating at index

Example: Find all duplicates (values 1 to n, some appear twice)
for (int num : nums) {
    int idx = Math.abs(num) - 1;
    if (nums[idx] < 0) result.add(idx + 1);  // Already seen!
    else nums[idx] = -nums[idx];              // Mark as seen
}
```

### Partition / Dutch National Flag

```
When: Separate elements into groups (0s, 1s, 2s)
Three pointers: low, mid, high
[0s | 1s | unsorted | 2s]
 ↑low  ↑mid         ↑high

- If arr[mid] == 0: swap with low, move both right
- If arr[mid] == 1: just move mid right
- If arr[mid] == 2: swap with high, move high left (don't move mid!)
```

---

## Part 7: Array & String Debugging Checklist

```
□ Off-by-one: Is my loop bound < n or <= n?
□ Empty array/string: Does my code handle length 0?
□ Single element: Does it work for length 1?
□ All same elements: [5,5,5,5] — does my logic handle this?
□ Integer overflow: Am I using long for sums?
□ Negative numbers: Does two-pointer still work?
□ Sliding window: Am I updating state when both adding AND removing?
□ Prefix sum: Did I include the sentinel prefix[0] = 0?
□ String immutability: Am I using StringBuilder for building?
□ Character encoding: 'a' to 'z' = 26 letters, '0' to '9' = 10 digits
```

---

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1977 | Boyer-Moore | BM algorithm — suffix-based pattern matching |
| 1970/1977 | Knuth-Morris-Pratt | KMP — prefix-function pattern matching |
| 1987 | Rabin-Karp | Rolling hash — probabilistic pattern matching |
| 1973 | Knuth | *TAOCP Vol 3* — two-pointer exposition and sorting |

**Evolution narrative**: Array and string algorithmic techniques crystallized in the 1970s as computer science matured as a discipline. The Knuth-Morris-Pratt algorithm (developed 1970, published 1977) revolutionized pattern matching by precomputing the longest proper prefix that is also a suffix — eliminating redundant comparisons that the naive approach suffers. Robert Boyer's 1977 Boyer-Moore algorithm took a complementary approach: match from right to left and skip sections based on suffix analysis, often running in sublinear time. Richard Karp and Michael Rabin combined both approaches with their 1987 rolling hash technique, translating string matching into arithmetic problem-solving. Donald Knuth's 1973 *Art of Computer Programming Volume 3* synthesized and formalized the sorting and searching techniques (including the two-pointer expositions) that became the canonical reference for array/string algorithms.

**Modern practice anchor**: Today's array/string pattern recognition (LeetCode Easy/Medium, competitive programming) builds directly on these four pillars: KMP for pattern matching, Boyer-Moore for right-to-left heuristics, Rabin-Karp for hash-based approaches, and the two-pointer techniques Knuth formalized — all now taught as the foundational vocabulary for linear-data problems.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Buffer Overflow in C/C++ String Operations (Heartbleed 2014)

**What goes wrong**: Array/string mental model in C/C++ requires manual bounds checking. Copying user input into a fixed-size buffer without checking length causes buffer overflow. Heartbleed (2014) was the canonical example: OpenSSL's TLS heartbeat extension copied `payload_length` bytes from a buffer without verifying `payload_length <= actual_payload_size`. Attackers read 64KB of adjacent memory per heartbeat — including private keys, passwords, and session tokens.

**Cost**: 66% of Fortune 500 used affected OpenSSL versions. Estimated 200+ million servers vulnerable. Stolen credentials from memory allowed impersonation and decryption of past sessions. Regulatory fines, incident response cost ~$1B+ across affected organizations.

**Debug workflow**:
1. Compile with `-fsanitize=address` (AddressSanitizer) to catch overflows in testing and staging.
2. Use `valgrind --tool=memcheck` for memory access validation in CI pipelines.
3. Replace `strcpy`/`sprintf`/`scanf` with bounded versions: `strncpy`, `snprintf`, `fgets`. Prefer `std::string` in C++ or validated string libraries.

### Failure Mode 2: Unicode Normalization Mismatch (NFC vs NFD)

**What goes wrong**: String comparison uses Unicode normalization forms. A search for "café" (NFC) fails to match "café" (NFD) stored in the database. Python's `==`, Java's `.equals()`, and most databases compare code points, not graphemes. The two forms have different byte sequences for the same visual text.

**Cost**: User search returns no results for queries that should match. In e-commerce, this means products with Unicode characters in names become unfindable. Silent data inconsistency where the same text appears as "different" in different systems.

**Debug workflow**:
1. Normalize all input/output to NFC (Canonical Decomposition followed by Canonical Composition) at system boundaries: Python `unicodedata.normalize('NFC', text)`, Java `Normalizer.normalize(text, Normalizer.Form.NFC)`.
2. Add normalization validation in data pipelines: detect NFD inputs and log alerts.
3. Use database-level normalization: PostgreSQL `unaccent` extension normalizes for comparison; MySQL `utf8mb4_unicode_ci` handles canonical equivalence.

### Failure Mode 3: Cache-Locality Penalty for Linked-List vs Array Iteration

**What goes wrong**: Array/string thinking assumes sequential memory access (cache-friendly). When code is refactored from array to linked list (e.g., for "easier" insertion), iteration becomes pointer-chasing across heap, causing L1/L2 cache misses on every node. A list iteration that should take 1ms takes 50ms.

**Cost**: 50x latency spike on list-heavy code paths. Often discovered in production under load when the hot code path switches from array to list behavior.

**Debug workflow**:
1. Profile with `perf stat -e cache-misses,cache-references ./binary` — high cache-miss rate on iteration code is the signal.
2. Use `hotspot` (Linux perf GUI) to identify cache-unfriendly code. Replace linked list with vector + index-based insertion.
3. Benchmark array vs list access patterns: `benchmark::DoNotOptimize(array[i])` vs `benchmark::DoNotOptimize(list->next->value)` with Google Benchmark.

### Modern Production Tools

- **AddressSanitizer (ASan)**: Memory sanitizer in GCC/Clang that detects buffer overflows, use-after-free, and double-free. Run in CI to catch overflows before production.
- **Unicode normalization libraries**: `icu4c` (C/C++), `normalizer` (JavaScript `Intl`), Python `unicodedata` — enforce NFC normalization at all system boundaries.
- **`perf` cache analysis**: `perf stat` shows L1/L2/LAST cache miss rates; `perf record` captures where cache misses occur, identifying linked-list vs array bottlenecks.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

Arrays provide contiguous memory + O(1) index arithmetic access. The invariant is that element access by index is a constant-time address calculation: `address(arr[i]) = base_address + i * element_size`. This property enables the two-pointer technique — two indices moving through the array in coordination can solve problems that appear to require nested loops. Strings are immutable arrays of characters in most languages, so the same contiguous-memory invariants apply, but immutability means creating new strings is O(n), not O(1). The internal mechanism is **pointer arithmetic**: knowing that `arr[left]` and `arr[right]` are adjacent in memory enables the sliding window (shrink when condition met), partition (swap based on pivot), and fast-slow (detect cycle, find middle) patterns. The trade-off is random access O(1) vs insertion/deletion O(n) — a linked list costs O(1) insertion but O(n) access by index.

### Variants Comparison

| Variant | Pointers | Use Case | Complexity |
| --- | --- | --- | --- |
| Left-right (two-pointer) | Start opposite ends, move inward | Sorted array pairs, palindrome | O(n) time, O(1) space |
| Fast-slow (tortoise-hare) | Move at 1x and 2x speed | Cycle detection, middle of list | O(n) time, O(1) space |
| Sliding window | Fixed/variable size subarray | Max subarray sum, longest substring | O(n) time, O(1) space |
| Read-write heads | Separate indices for read vs write | Remove elements in-place | O(n) time, O(1) space |
| Partition (Lomuto/Hoare) | Swap relative to pivot | QuickSort, partition-based selection | O(n) time, O(1) space |

### Decision Table

| Array Property | Default Pattern | When to Switch |
| --- | --- | --- |
| Sorted array | Two-pointer (left-right) | Unsorted array → hashmap |
| Subarray with window constraint | Sliding window | Fixed k → prefix sum with hashmap |
| Need cycle detection | Fast-slow pointer | Need start of cycle → Floyd + reset |
| Dutch national flag (0/1/2) | Three-way partition | General multi-key → comparator sort |
| Find median/ k-th largest | QuickSelect (partition) | Guaranteed pivot → median-of-medians |
| String vs array traversal | Two-pointer (strings) | Need character count → hashmap |


---

## Reality Check

**"Array thinking is index bookkeeping"** ? Array thinking is choosing among five REPRESENTATIONS of the same data: positions (raw indexes), prefixes (cumulative views turning ranges into differences), deltas (difference arrays turning range-updates into two writes), counts (value-space histograms), and sorted order (rank space). Most hard array problems are easy in exactly one representation � the skill is the five-way translation reflex, not tighter loop management. "Have I tried the prefix view? the count view?" is the unstick checklist.

**"Strings are character arrays with extra methods"** ? Strings carry three semantic layers arrays lack � equality up to canonical form (anagram signatures, case folding), STRUCTURE (prefixes, suffixes, borders � the KMP failure function is pure structure thinking), and language cost models (immutability making concatenation quadratic, slicing being copy vs view) � plus a bounded alphabet enabling count-array tricks. Thinking char[] plus helpers misses the layer where string problems actually live: choosing WHICH equivalence or structure the problem is really about.

**"Subarray, subsequence, substring � details of phrasing"** ? They select DIFFERENT ALGORITHM FAMILIES, full stop: contiguous (subarray/substring) unlocks windows, prefix sums, and Kadane; non-contiguous (subsequence) forbids all of those and routes to DP or greedy-with-structure (LIS tails); k-selection routes to sorting or heaps. Misreading this single word is the most common cause of confidently solving the wrong problem � the checklist item is boring and non-negotiable: circle the word, say the family aloud.

**"Thinking in-place is thinking about memory limits"** ? In-place is a THINKING TOOL beyond the constraint: asking "could I do this with write-pointers?" often reveals the one-pass structure a buffered solution obscured (dedup, compaction, partitioning all clarify under the reader/writer split), and value-range tricks (negation-as-seen-marker, index-as-hash for 1..n) expose hidden structure between values and positions. Even when you ultimately use O(n) space, the in-place analysis has already found the algorithm.

**"Off-by-one comfort comes with experience"** ? It comes from adopting CONVENTIONS and refusing to renegotiate them per problem: half-open ranges everywhere (length is hi minus lo, empty is lo equals hi, adjacent ranges concatenate cleanly), prefix arrays of length n+1 (prefix[i] covers the first i elements � the empty prefix exists), and inclusive-both-ends reserved for the rare problem that demands it, loudly commented. People with "experience" who still fight fenceposts never standardized; people who standardized stopped fighting within a week.
