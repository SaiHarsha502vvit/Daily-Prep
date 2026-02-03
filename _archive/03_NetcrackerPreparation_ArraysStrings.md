# 🎯 NETCRACKER ARRAYS & STRINGS CRASH PREPARATION

## Senior Engineer's Step-by-Step Guide for 60%+ Success

**Target:** Netcracker Coding Round (Arrays & Strings Focus)  
**Timeline:** 1-2 Days  
**Goal:** Fix boundary conditions, master sliding window, achieve 60%+ score

---

## 📋 TABLE OF CONTENTS

1. [Master Pattern Library - How to Think](#master-pattern-library)
2. [Question 1: Prime Position - CORRECTED](#q1-prime-position)
3. [Question 2: First Negative in Window - COMPLETE SOLUTION](#q2-sliding-window)
4. [Question 3: Digit Sum Divisibility - CORRECTED](#q3-digit-sum)
5. [Question 4: Triangle Pattern - CORRECTED](#q4-triangle-pattern)
6. [Question 5: Subset Sum - COMPLETE SOLUTION](#q5-subset-sum)
7. [Core Concepts & Templates](#core-concepts)
8. [Technical MCQs](#technical-mcqs)
9. [2-Day Learning Roadmap](#learning-roadmap)

---

# 🧠 MASTER PATTERN LIBRARY - HOW TO THINK

## 🎯 The Thought Process Framework

### Before Writing ANY Code, Ask These 5 Questions:

1. **What is the INPUT format?** (Single number? Array? String? Multiple inputs?)
2. **What is the OUTPUT format?** (Print all? Print first? Count? True/False?)
3. **What are the CONSTRAINTS?** (Size limits? Value ranges? Special cases like ZERO/negative?)
4. **What OPERATION am I performing?** (Search? Count? Generate? Transform?)
5. **What PATTERN does this match?** (See pattern recognition table below)

---

## 🔍 PATTERN RECOGNITION TABLE

| Keywords in Problem                 | Pattern Name              | Time Complexity | When to Use                    |
| ----------------------------------- | ------------------------- | --------------- | ------------------------------ |
| "window of size K", "K consecutive" | Sliding Window            | O(N×K) or O(N)  | Fixed-size subarray operations |
| "all pairs", "find pair"            | Two Pointers              | O(N²) or O(N)   | Pair sum, sorted arrays        |
| "subarray sum equals", "range sum"  | Prefix Sum                | O(N)            | Cumulative sum queries         |
| "count frequency", "most common"    | Frequency Count (HashMap) | O(N)            | Element occurrence tracking    |
| "all subsets", "all combinations"   | Backtracking              | O(2^N)          | Generate all possibilities     |
| "in range [a,b]", "between X and Y" | Range Iteration           | O(N×D)          | Process all numbers in range   |
| "is prime", "divisible by"          | Number Theory             | O(√N)           | Mathematical properties        |
| "pattern", "triangle", "rows/cols"  | Nested Loops              | O(N²)           | 2D output generation           |
| "reverse", "rotate", "shift"        | Array Manipulation        | O(N)            | Element rearrangement          |
| "longest", "shortest"               | Greedy/DP                 | Varies          | Optimization problems          |

---

## 📚 PATTERN 1: SLIDING WINDOW (Fixed Size)

### 🧠 How to Recognize:

- Problem mentions "window of size K"
- Need to find something in "K consecutive elements"
- Keywords: "each window", "every K elements", "first in each K"

### 💭 Thought Process:

```
Step 1: Visualize the window sliding
        [1, 2, 3, 4, 5], K=3

        Window 1: [1, 2, 3]
        Window 2:    [2, 3, 4]
        Window 3:       [3, 4, 5]

Step 2: Count windows
        Formula: N - K + 1 = 5 - 3 + 1 = 3 windows

Step 3: Determine loop boundary
        First window starts at index 0
        Last window starts at index N-K = 2
        Loop: i from 0 to N-K (inclusive)

Step 4: Process each window
        For each i, process elements from i to i+K-1
```

### 🎨 Visual Diagram:

```
Array:  [1  2  3  4  5]
Index:   0  1  2  3  4

K = 3 (window size)

Window 1:  [1  2  3]  ←  i=0, elements: arr[0], arr[1], arr[2]
            ↑     ↑
          start  end

Window 2:     [2  3  4]  ←  i=1, elements: arr[1], arr[2], arr[3]
               ↑     ↑

Window 3:        [3  4  5]  ←  i=2, elements: arr[2], arr[3], arr[4]
                  ↑     ↑

Loop stops at i=2 because i+K-1 = 2+3-1 = 4 (last valid index)
```

### � THE CRITICAL CONFUSION: `j < i + k` vs `j - i + 1 == k`

**THIS IS WHERE 90% OF STUDENTS GET STUCK!**

Let me clear this confusion forever with the right way to think:

#### ❌ WRONG WAY TO THINK (Index Gymnastics):

"Should I use `j < i + k` or `j <= i + k`? What about `i + k - 1`?"

#### ✅ RIGHT WAY TO THINK (Count Elements):

"**How many elements are currently in my window?**"

### 🧠 THE BREAKTHROUGH UNDERSTANDING:

```
The ONLY thing that matters:
"Does my window contain exactly K elements?"

Count of elements = j - i + 1

When j - i + 1 == k → Window is ready!
```

### 📊 Visual Proof (This Will Make It Click):

```
Array: [2, 1, 5, 1, 3, 2]
Index:  0  1  2  3  4  5

Let K = 3 (window size)

Window 1: i=0, j=2
          ↓     ↓
         [2, 1, 5]

Count = j - i + 1 = 2 - 0 + 1 = 3 ✅ (exactly K elements!)

Window 2: i=1, j=3
             ↓     ↓
            [1, 5, 1]

Count = j - i + 1 = 3 - 1 + 1 = 3 ✅

Window 3: i=2, j=4
                ↓     ↓
               [5, 1, 3]

Count = j - i + 1 = 4 - 2 + 1 = 3 ✅
```

### 🔗 THE EQUIVALENCE (Memorize This Chain):

```
j - i + 1 = k     ← "Window has K elements" (BEST WAY TO THINK)
      ⇕
j = i + k - 1     ← "j is at the last valid position"
      ⇕
j < i + k         ← "j hasn't crossed the window boundary"
```

**All three mean the same thing, but thinking in counts is safest!**

### 🧪 WHY `j < i + k` CAN CONFUSE YOU:

```
Example: i=0, k=3

If j < i + k:
   j < 0 + 3
   j < 3

Valid values: j = 0, 1, 2  ✅ (3 elements)

If j <= i + k:  ❌ WRONG!
   j <= 3

Valid values: j = 0, 1, 2, 3  ❌ (4 elements! Too many!)

If j < k:  ❌ WRONG for i > 0!
   After i moves to 1, j < 3 means j = 0, 1, 2
   But we need j = 1, 2, 3!  ❌
```

### ✅ THE EXAM-SAFE PATTERN (Use This Always):

```java
// APPROACH 1: Count-Based Sliding Window (CLEAREST)
// Time: O(N), Space: O(1)

int i = 0;  // Window start

for (int j = 0; j < n; j++) {  // j is the expanding pointer

    // Include arr[j] in window

    // Check if window is ready
    if (j - i + 1 == k) {
        // Process window
        // ... do your work here ...

        // Slide window: remove arr[i]
        i++;
    }
}
```

**Why This Pattern Is Perfect:**

1. ✅ You're counting elements (`j - i + 1`), not doing index math
2. ✅ Works for any K
3. ✅ No confusion about `<` vs `<=`
4. ✅ Window automatically slides when size reaches K

### 🎨 Dry Run (Do This On Paper):

```
Array: [1, 2, 3, 4, 5], K=3

j=0: window=[1], size=0-0+1=1, not ready yet
j=1: window=[1,2], size=1-0+1=2, not ready yet
j=2: window=[1,2,3], size=2-0+1=3 ✅ PROCESS! Then i++

j=3: i=1, window=[2,3,4], size=3-1+1=3 ✅ PROCESS! Then i++
j=4: i=2, window=[3,4,5], size=4-2+1=3 ✅ PROCESS! Then i++

Done!
```

### 🔧 Alternative Patterns (Once You Understand):

```java
// APPROACH 2: Index-Based (Works but harder to reason)
// Time: O(N × K), Space: O(1)

for (int i = 0; i <= n - k; i++) {

    // Process window from i to i+k-1
    for (int j = i; j < i + k; j++) {  // Note: j < i + k
        // Do something with arr[j]
    }
}
```

```java
// APPROACH 3: Pre-calculate First Window, Then Slide
// Time: O(N), Space: O(1)

// First window
for (int i = 0; i < k; i++) {
    // Process arr[i]
}

// Remaining windows
for (int i = k; i < n; i++) {
    // Remove arr[i-k]
    // Add arr[i]
}
```

### 🧠 FINAL RULE (THIS WILL STICK):

**Never think `j < i + k` first.**
**Always think: "How many elements are in my window right now?"**

```
Count = j - i + 1

When count == k → process window
```

### 🔧 Brute Force Approach:

```java
// APPROACH 4: Nested Loop (Brute Force - Traditional)
// Time: O(N × K), Space: O(1)

public static void bruteForceWindow(int[] arr, int k) {
    int n = arr.length;

    // Outer loop: Iterate through all window starting positions
    for (int i = 0; i <= n - k; i++) {

        // Inner loop: Process current window
        for (int j = i; j < i + k; j++) {
            // Do something with arr[j]
            System.out.print(arr[j] + " ");
        }
        System.out.println();
    }
}
```

**Why This Works:**

- Simple and intuitive
- Recalculates everything for each window
- Good for small K or when optimization not needed
- But use count-based thinking (`j - i + 1`) for clearer reasoning

### ⚡ Optimized Approach:

```java
// APPROACH 2: Sliding Window Optimization
// Time: O(N), Space: O(1)

public static void optimizedWindow(int[] arr, int k) {
    int n = arr.length;

    // Calculate first window
    int sum = 0;
    for (int i = 0; i < k; i++) {
        sum += arr[i];
    }
    System.out.println("Window 1 sum: " + sum);

    // Slide window: Remove leftmost, add rightmost
    for (int i = k; i < n; i++) {
        sum = sum - arr[i - k] + arr[i];  // Slide!
        System.out.println("Window sum: " + sum);
    }
}
```

**How We Got This Logic:**

1. First window: Compute normally (can't optimize)
2. Second window: Only 1 element differs from first window!
    - Remove arr[0], add arr[k]
    - No need to recalculate entire sum
3. Pattern: Each new window = old window - left element + right element

### 🎨 Sliding Optimization Visual:

```
Array: [1  2  3  4  5], K=3

Window 1:  [1  2  3]      sum = 6
            ↓
Window 2:  -1 [2  3  4]   sum = 6 - 1 + 4 = 9
               ↑     ↑
            keep  add new

Window 3:     -2 [3  4  5]   sum = 9 - 2 + 5 = 12
                  ↑     ↑
               keep  add new

Pattern: new_sum = old_sum - arr[i-k] + arr[i]
```

### 📝 Common Logic Blocks:

```java
// BLOCK 1: Find first occurrence in each window
for (int i = 0; i <= n - k; i++) {
    boolean found = false;
    for (int j = i; j < i + k; j++) {
        if (condition(arr[j])) {
            System.out.println(arr[j]);
            found = true;
            break;  // Exit inner loop only
        }
    }
    if (!found) {
        System.out.println("Not found");
    }
}

// BLOCK 2: Count occurrences in each window
for (int i = 0; i <= n - k; i++) {
    int count = 0;
    for (int j = i; j < i + k; j++) {
        if (condition(arr[j])) {
            count++;
        }
    }
    System.out.println(count);
}

// BLOCK 3: Find max/min in each window
for (int i = 0; i <= n - k; i++) {
    int max = Integer.MIN_VALUE;
    for (int j = i; j < i + k; j++) {
        max = Math.max(max, arr[j]);
    }
    System.out.println(max);
}

// BLOCK 4: Calculate aggregate (sum/average) in each window
for (int i = 0; i <= n - k; i++) {
    int sum = 0;
    for (int j = i; j < i + k; j++) {
        sum += arr[j];
    }
    System.out.println(sum / k);  // Average
}
```

---

## 📚 PATTERN 2: TWO POINTERS

### 🧠 How to Recognize:

- Need to find "pair" of elements
- Problem mentions "two elements that..."
- Array is sorted OR can be sorted
- Keywords: "pair sum", "two elements", "closest pair"

### 💭 Thought Process:

```
Step 1: Sort array (if not sorted)
        [3, 1, 4, 2, 5] → [1, 2, 3, 4, 5]

Step 2: Place pointers
        Left pointer at start (0)
        Right pointer at end (n-1)

Step 3: Check sum/difference
        If sum < target: Move left++ (increase sum)
        If sum > target: Move right-- (decrease sum)
        If sum == target: Found!

Step 4: Stop when pointers meet
```

### 🎨 Visual Diagram:

```
Find pair with sum = 7 in sorted array [1, 2, 3, 4, 5]

Step 1: Initialize pointers
        [1   2   3   4   5]
         ↑               ↑
        left           right
        sum = 1+5 = 6 < 7 → move left++

Step 2:
        [1   2   3   4   5]
             ↑           ↑
            left       right
        sum = 2+5 = 7 → FOUND! Answer: (2,5)

Visual Pattern:
┌─────────────────┐
│  L moves right  │  when sum too small (need bigger number)
│  R moves left   │  when sum too large (need smaller number)
└─────────────────┘
```

### 🔧 Brute Force Approach:

```java
// APPROACH 1: Nested Loop (Check All Pairs)
// Time: O(N²), Space: O(1)

public static void bruteForcePairs(int[] arr, int target) {
    int n = arr.length;

    // Try all possible pairs
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {  // j starts from i+1 to avoid duplicates
            if (arr[i] + arr[j] == target) {
                System.out.println("Pair: (" + arr[i] + ", " + arr[j] + ")");
            }
        }
    }
}
```

**How We Think About This:**

1. Need to check every possible pair
2. Pair (i,j) where i < j
3. Total pairs = N×(N-1)/2 ≈ N²

### ⚡ Optimized Approach:

```java
// APPROACH 2: Two Pointers (For Sorted Array)
// Time: O(N log N) for sorting + O(N) for search = O(N log N)
// Space: O(1)

public static void twoPointersPairs(int[] arr, int target) {
    Arrays.sort(arr);  // Sort first if not sorted

    int left = 0;
    int right = arr.length - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];

        if (sum == target) {
            System.out.println("Pair: (" + arr[left] + ", " + arr[right] + ")");
            left++;
            right--;
        } else if (sum < target) {
            left++;  // Need larger sum
        } else {
            right--;  // Need smaller sum
        }
    }
}
```

**How We Got This Logic:**

1. Observation: In sorted array, smallest at start, largest at end
2. If sum too small → need bigger number → move left forward
3. If sum too large → need smaller number → move right backward
4. Reduces N² comparisons to N comparisons!

### 🎨 Decision Tree Visual:

```
                    Check sum = arr[L] + arr[R]
                              |
                 ┌────────────┼────────────┐
                 |            |            |
            sum < target  sum == target  sum > target
                 |            |            |
              Move L++    Found pair!   Move R--
              (need bigger)  Print it   (need smaller)
```

### 📝 Common Logic Blocks:

```java
// BLOCK 1: Find any pair with given sum
int left = 0, right = n - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) {
        System.out.println(arr[left] + " " + arr[right]);
        return;  // Found
    }
    if (sum < target) left++;
    else right--;
}

// BLOCK 2: Find all pairs with given sum
int left = 0, right = n - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) {
        System.out.println(arr[left] + " " + arr[right]);
        left++;
        right--;  // Continue searching
    } else if (sum < target) {
        left++;
    } else {
        right--;
    }
}

// BLOCK 3: Count pairs with given sum
int left = 0, right = n - 1;
int count = 0;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) {
        count++;
        left++;
        right--;
    } else if (sum < target) {
        left++;
    } else {
        right--;
    }
}
System.out.println(count);

// BLOCK 4: Find closest pair to target
int left = 0, right = n - 1;
int closestSum = Integer.MAX_VALUE;
int bestLeft = 0, bestRight = 0;

while (left < right) {
    int sum = arr[left] + arr[right];

    if (Math.abs(sum - target) < Math.abs(closestSum - target)) {
        closestSum = sum;
        bestLeft = left;
        bestRight = right;
    }

    if (sum < target) left++;
    else right--;
}
```

---

## 📚 PATTERN 3: FREQUENCY COUNTING (HashMap)

### 🧠 How to Recognize:

- Need to count "how many times" something appears
- Find "most/least frequent" element
- Check if element "exists" or "appears K times"
- Keywords: "frequency", "count", "most common", "duplicate"

### 💭 Thought Process:

```
Step 1: Create storage for counts
        HashMap<Element, Count>

Step 2: Iterate through array
        For each element, increment its count

Step 3: Query the map
        Get count, find max, check existence, etc.
```

### 🎨 Visual Diagram:

```
Array: [1, 2, 2, 3, 1, 2, 4]

Building frequency map:

Index 0: arr[0]=1  →  map = {1:1}
Index 1: arr[1]=2  →  map = {1:1, 2:1}
Index 2: arr[2]=2  →  map = {1:1, 2:2}
Index 3: arr[3]=3  →  map = {1:1, 2:2, 3:1}
Index 4: arr[4]=1  →  map = {1:2, 2:2, 3:1}
Index 5: arr[5]=2  →  map = {1:2, 2:3, 3:1}
Index 6: arr[6]=4  →  map = {1:2, 2:3, 3:1, 4:1}

Final map visualization:
┌───┬───┐
│ 1 │ 2 │  ← Element 1 appears 2 times
├───┼───┤
│ 2 │ 3 │  ← Element 2 appears 3 times (most frequent!)
├───┼───┤
│ 3 │ 1 │  ← Element 3 appears 1 time
├───┼───┤
│ 4 │ 1 │  ← Element 4 appears 1 time
└───┴───┘
```

### 🔧 Brute Force Approach:

```java
// APPROACH 1: Nested Loop (Count Each Element)
// Time: O(N²), Space: O(1)

public static void bruteForceFrequency(int[] arr) {
    int n = arr.length;
    boolean[] counted = new boolean[n];  // Track already counted

    for (int i = 0; i < n; i++) {
        if (counted[i]) continue;  // Already counted

        int count = 1;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] == arr[i]) {
                count++;
                counted[j] = true;
            }
        }
        System.out.println(arr[i] + " appears " + count + " times");
    }
}
```

**Why This is Slow:**

- For each element, scan entire array
- Lots of repeated work

### ⚡ Optimized Approach:

```java
// APPROACH 2: HashMap (One Pass)
// Time: O(N), Space: O(N)

public static void hashMapFrequency(int[] arr) {
    HashMap<Integer, Integer> freq = new HashMap<>();

    // Build frequency map (one pass)
    for (int num : arr) {
        freq.put(num, freq.getOrDefault(num, 0) + 1);
    }

    // Print frequencies
    for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
        System.out.println(entry.getKey() + " appears " + entry.getValue() + " times");
    }
}
```

**How We Got This Logic:**

1. Need fast lookup → use HashMap
2. Key = element, Value = count
3. `getOrDefault(num, 0)` handles first occurrence gracefully
4. Single pass through array = O(N)

### 📝 Common Logic Blocks:

```java
// BLOCK 1: Build frequency map
HashMap<Integer, Integer> freq = new HashMap<>();
for (int num : arr) {
    freq.put(num, freq.getOrDefault(num, 0) + 1);
}

// BLOCK 2: Find most frequent element
int maxFreq = 0;
int mostFrequent = -1;
for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
    if (entry.getValue() > maxFreq) {
        maxFreq = entry.getValue();
        mostFrequent = entry.getKey();
    }
}

// BLOCK 3: Find elements appearing exactly K times
for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
    if (entry.getValue() == k) {
        System.out.println(entry.getKey());
    }
}

// BLOCK 4: Check if all elements unique
boolean allUnique = true;
for (int count : freq.values()) {
    if (count > 1) {
        allUnique = false;
        break;
    }
}

// BLOCK 5: Remove duplicates using HashMap
HashMap<Integer, Boolean> seen = new HashMap<>();
ArrayList<Integer> unique = new ArrayList<>();
for (int num : arr) {
    if (!seen.containsKey(num)) {
        unique.add(num);
        seen.put(num, true);
    }
}
```

---

## 📚 PATTERN 4: PREFIX SUM

### 🧠 How to Recognize:

- Multiple queries about "sum in range [L, R]"
- Need "cumulative sum up to index i"
- Keywords: "range sum", "subarray sum", "sum from L to R"

### 💭 Thought Process:

```
Step 1: Understand the problem
        Instead of calculating sum each time: O(N) per query
        Precompute all cumulative sums: O(N) once, O(1) per query

Step 2: Build prefix sum array
        prefix[i] = sum of arr[0] to arr[i]

Step 3: Use formula
        sum(L to R) = prefix[R] - prefix[L-1]
```

### 🎨 Visual Diagram:

```
Array:     [2   4   1   3   5]
Index:      0   1   2   3   4

Prefix:    [2   6   7  10  15]
            ↑   ↑   ↑   ↑   ↑
            2  2+4 6+1 7+3 10+5

Query: Sum from index 1 to 3 (elements 4,1,3)

Method 1 (Brute Force):
    sum = arr[1] + arr[2] + arr[3]
        = 4 + 1 + 3 = 8

Method 2 (Prefix Sum):
    sum = prefix[3] - prefix[0]
        = 10 - 2 = 8

Visual:
prefix[3] = [2 + 4 + 1 + 3] = 10
prefix[0] = [2] = 2
Difference = [4 + 1 + 3] = 8  ← This is what we want!

┌────────────────────────────┐
│ prefix[R] - prefix[L-1]    │
│ = sum from index L to R    │
└────────────────────────────┘
```

### 🔧 Brute Force Approach:

```java
// APPROACH 1: Recalculate Every Query
// Time: O(Q × N) where Q=queries, Space: O(1)

public static int bruteForceSingle query(int[] arr, int L, int R) {
    int sum = 0;
    for (int i = L; i <= R; i++) {
        sum += arr[i];
    }
    return sum;
}

// For Q queries: O(Q × N) total time
```

### ⚡ Optimized Approach:

```java
// APPROACH 2: Prefix Sum Array
// Time: O(N) preprocessing + O(Q) queries = O(N+Q), Space: O(N)

public static void prefixSumApproach(int[] arr, int[][] queries) {
    int n = arr.length;

    // Build prefix sum array
    int[] prefix = new int[n];
    prefix[0] = arr[0];
    for (int i = 1; i < n; i++) {
        prefix[i] = prefix[i-1] + arr[i];
    }

    // Answer queries in O(1) each
    for (int[] query : queries) {
        int L = query[0];
        int R = query[1];

        int sum;
        if (L == 0) {
            sum = prefix[R];
        } else {
            sum = prefix[R] - prefix[L-1];
        }
        System.out.println("Sum from " + L + " to " + R + " = " + sum);
    }
}
```

**How We Got This Logic:**

1. prefix[i] = sum from 0 to i
2. To get sum from L to R:
    - We need: arr[L] + arr[L+1] + ... + arr[R]
    - We have: prefix[R] = arr[0] + ... + arr[R]
    - We have: prefix[L-1] = arr[0] + ... + arr[L-1]
    - Subtract: prefix[R] - prefix[L-1] = arr[L] + ... + arr[R] ✓

### 📝 Common Logic Blocks:

```java
// BLOCK 1: Build prefix sum array
int[] prefix = new int[n];
prefix[0] = arr[0];
for (int i = 1; i < n; i++) {
    prefix[i] = prefix[i-1] + arr[i];
}

// BLOCK 2: Query range sum
public static int rangeSum(int[] prefix, int L, int R) {
    if (L == 0) return prefix[R];
    return prefix[R] - prefix[L-1];
}

// BLOCK 3: Find subarray with sum K (using HashMap)
HashMap<Integer, Integer> map = new HashMap<>();
map.put(0, -1);  // Handle sum from index 0
int sum = 0;

for (int i = 0; i < n; i++) {
    sum += arr[i];

    if (map.containsKey(sum - k)) {
        int start = map.get(sum - k) + 1;
        System.out.println("Subarray from " + start + " to " + i);
    }

    map.put(sum, i);
}

// BLOCK 4: Count subarrays with sum K
HashMap<Integer, Integer> map = new HashMap<>();
map.put(0, 1);
int sum = 0;
int count = 0;

for (int i = 0; i < n; i++) {
    sum += arr[i];
    count += map.getOrDefault(sum - k, 0);
    map.put(sum, map.getOrDefault(sum, 0) + 1);
}
```

---

## 📚 PATTERN 5: STRING MANIPULATION (StringBuilder)

### 🧠 How to Recognize:

- Need to build/modify string character by character
- Reverse string, remove characters, insert characters
- Keywords: "build string", "reverse", "modify", "concatenate in loop"

### 💭 Thought Process:

```
Step 1: Understand String immutability
        String s = "abc";
        s = s + "d";  // Creates NEW string object! Old "abc" discarded

Step 2: Problem with loop concatenation
        for (int i = 0; i < n; i++) {
            s = s + i;  // O(N) operation EACH time → O(N²) total!
        }

Step 3: Solution: StringBuilder
        Mutable, efficient append/insert/delete operations
```

### 🎨 Visual Diagram:

```
String Concatenation (BAD):
────────────────────────────
Iteration 1: "" + "a" = "a"          (1 char copied)
Iteration 2: "a" + "b" = "ab"        (2 chars copied)
Iteration 3: "ab" + "c" = "abc"      (3 chars copied)
Iteration 4: "abc" + "d" = "abcd"    (4 chars copied)

Total copies: 1+2+3+4 = 10 = O(N²)


StringBuilder (GOOD):
─────────────────────
Internal buffer: [      ]  (dynamic array)

Append "a": [a     ]  ← O(1)
Append "b": [ab    ]  ← O(1)
Append "c": [abc   ]  ← O(1)
Append "d": [abcd  ]  ← O(1)

Total: O(N)
```

### 🔧 Brute Force Approach:

```java
// APPROACH 1: String Concatenation
// Time: O(N²), Space: O(N²) due to temp strings

public static String bruteForceConcat(int n) {
    String result = "";

    for (int i = 0; i < n; i++) {
        result = result + i;  // Creates new string each time!
    }

    return result;
}
```

### ⚡ Optimized Approach:

```java
// APPROACH 2: StringBuilder
// Time: O(N), Space: O(N)

public static String optimizedConcat(int n) {
    StringBuilder sb = new StringBuilder();

    for (int i = 0; i < n; i++) {
        sb.append(i);  // Efficient append
    }

    return sb.toString();
}
```

### 📝 Common Logic Blocks:

```java
// BLOCK 1: Build string from array
StringBuilder sb = new StringBuilder();
for (int num : arr) {
    sb.append(num).append(" ");
}
String result = sb.toString().trim();

// BLOCK 2: Reverse string
StringBuilder sb = new StringBuilder(str);
sb.reverse();
String reversed = sb.toString();

// BLOCK 3: Remove characters at positions
StringBuilder sb = new StringBuilder(str);
for (int i = positions.length - 1; i >= 0; i--) {
    sb.deleteCharAt(positions[i]);  // Delete from end to avoid index shift
}

// BLOCK 4: Insert characters
StringBuilder sb = new StringBuilder(str);
sb.insert(position, character);

// BLOCK 5: Replace range
StringBuilder sb = new StringBuilder(str);
sb.replace(start, end, replacement);

// BLOCK 6: Build string with specific pattern
StringBuilder sb = new StringBuilder();
for (int i = 0; i < n; i++) {
    for (int j = 0; j <= i; j++) {
        sb.append(char).append(" ");
    }
    sb.append("\n");
}
```

---

# Q1: PRIME POSITION - CORRECTED

## 🎯 Problem

Check if a number is prime. If yes, print its position among all primes.

**Your Failed Test Cases:** TC 1, TC 5, TC 6 (50% failure)

---

## 1️⃣ CORRECTED SOLUTION (Interview-Ready)

### ✅ WITHOUT Collection Framework

```java
import java.util.*;

public class PositionOfPrime {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int gpn = sc.nextInt();

        // CONSTRAINT: Must be greater than zero
        if (gpn <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        // Check if gpn itself is prime
        if (!isPrime(gpn)) {
            System.out.println("Not a Prime");
            return;
        }

        // Count position: how many primes exist from 2 to gpn
        int position = 0;
        for (int i = 2; i <= gpn; i++) {
            if (isPrime(i)) {
                position++;
            }
        }

        System.out.println("Prime, Position = " + position + ".");
    }

    public static boolean isPrime(int num) {
        if (num <= 1) return false;
        if (num == 2) return true;
        if (num % 2 == 0) return false;

        // FIXED: Check up to sqrt(num), inclusive
        for (int i = 3; i * i <= num; i += 2) {
            if (num % i == 0) {
                return false;
            }
        }
        return true;
    }
}
```

### ✅ WITH Collection Framework

```java
import java.util.*;

public class PositionOfPrimeWithCollections {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int gpn = sc.nextInt();

        if (gpn <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        if (!isPrime(gpn)) {
            System.out.println("Not a Prime");
            return;
        }

        // Using ArrayList to store primes (optional approach)
        ArrayList<Integer> primes = new ArrayList<>();
        for (int i = 2; i <= gpn; i++) {
            if (isPrime(i)) {
                primes.add(i);
            }
        }

        int position = primes.size();
        System.out.println("Prime, Position = " + position + ".");
    }

    public static boolean isPrime(int num) {
        if (num <= 1) return false;
        if (num == 2) return true;
        if (num % 2 == 0) return false;

        for (int i = 3; i * i <= num; i += 2) {
            if (num % i == 0) {
                return false;
            }
        }
        return true;
    }
}
```

---

## 2️⃣ MISTAKE ANALYSIS (Your Code)

### ❌ **CRITICAL BUG #1: Incorrect isPrime Loop Boundary**

```java
// YOUR CODE (WRONG):
for(int i=2; i<(num/2); i++) {  // Excludes i = num/2
    if(num%i==0) return false;
}
```

**Why This Fails:**

- For `num = 4`: Loop checks `i = 2`, but condition `2 < 4/2` → `2 < 2` is FALSE
- Loop never enters → returns `true` for 4 (which is NOT prime)
- **Result:** TC 5, TC 6 failures (composite numbers marked as prime)

**Interviewer Perspective:**

> "Candidate doesn't understand factor boundaries. This is a fundamental mathematical error that causes wrong classifications for perfect squares and even numbers."

**Expected Instead:**

```java
for(int i=2; i*i<=num; i++)  // Optimal: check up to √num
```

---

### ❌ **CRITICAL BUG #2: Position Count Timing**

```java
// YOUR CODE (WRONG):
if(num==gpn){
    System.out.println("Prime, Position = "+count+".");  // Uses OLD count
    flag=false;
}
count=count+1;  // Increments AFTER printing
```

**Why This Fails:**

- Example: For input `7` (4th prime):
    - Primes found: 2 (count=1), 3 (count=2), 5 (count=3), 7 (count=3 when printed)
    - Output: "Prime, Position = 3" ❌ (Should be 4)
- Off-by-one error: increment happens too late

**Interviewer Perspective:**

> "Classic off-by-one error. Candidate doesn't trace through their own logic. This would fail in production."

**Expected Instead:**

```java
if(isPrime(i)) {
    count++;  // Increment FIRST
    if(i == gpn) {
        System.out.println("Prime, Position = " + count + ".");
    }
}
```

---

### ❌ **CRITICAL BUG #3: Missing Input Validation**

```java
// YOUR CODE: No validation at all
int gpn = sc.nextInt();
// Immediately starts processing
```

**Why This Fails:**

- Constraint states: "Must be Greater than Zero or else Print 'Invalid Input'"
- For `gpn = 0` or `gpn = -5`: Code runs infinite loop or wrong logic
- **Result:** TC 1 failure (invalid input test)

**Interviewer Perspective:**

> "Candidate ignores constraints. Automated systems always test edge cases first. This shows lack of attention to requirements."

**Expected Instead:**

```java
if (gpn <= 0) {
    System.out.println("Invalid Input");
    return;
}
```

---

### ❌ **INEFFICIENCY: Unnecessary Loop Structure**

```java
// YOUR CODE: Runs loop gpn times regardless
int i = 1;
while(i<=gpn){
    num++;
    if(isPrime(num)){ /* check */ }
    i++;
}
```

**Why Interviewers Reject:**

- Complexity: O(N²) where N is input value
- For `gpn = 10000`: Checks all numbers 2 to 10000
- Should first check if `gpn` is prime (O(√N)), then count (O(N√N))

**Better Approach:**

```java
if (!isPrime(gpn)) {
    System.out.println("Not a Prime");
    return;
}
// Only count if we know it's prime
```

---

## 3️⃣ CONCEPT BREAKDOWN

### Core DSA Concept: **Prime Number Theory + Counting**

**Mental Model:**

1. **Prime Definition:** A number > 1 divisible only by 1 and itself
2. **Efficient Check:** Only test divisors up to √N (mathematical proof: if N = a×b and a > √N, then b < √N)
3. **Position Counting:** Enumerate primes in order: 2, 3, 5, 7, 11, 13...

**Step-by-Step Reasoning:**

```
Input: 7
Step 1: Validate (7 > 0) ✓
Step 2: Check if 7 is prime
        - 7 % 2 = 1 (not divisible)
        - 7 % 3 = 1 (not divisible)
        - Stop at √7 ≈ 2.6
        - Result: 7 IS PRIME ✓
Step 3: Count primes from 2 to 7
        - 2 → prime (position 1)
        - 3 → prime (position 2)
        - 4 → not prime
        - 5 → prime (position 3)
        - 6 → not prime
        - 7 → prime (position 4) ✓
Output: "Prime, Position = 4."
```

**When NOT to Use This Approach:**

- Sieve of Eratosthenes is better for finding ALL primes up to N
- This approach is for single-number prime checking with position

---

## 4️⃣ COMMON LOGIC BLOCKS (Reusable Templates)

### 🔹 Template 1: Input Validation Guard

```java
// ALWAYS START WITH THIS
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();

if (n <= 0) {
    System.out.println("Invalid Input");
    return;
}
// Continue with logic...
```

### 🔹 Template 2: Efficient isPrime Check

```java
public static boolean isPrime(int num) {
    if (num <= 1) return false;           // Edge case
    if (num == 2) return true;            // Only even prime
    if (num % 2 == 0) return false;       // Eliminate evens

    // Check odd divisors up to √num
    for (int i = 3; i * i <= num; i += 2) {
        if (num % i == 0) {
            return false;
        }
    }
    return true;
}
```

**Why `i * i <= num` instead of `i < num/2`:**

- Mathematical: If N has a divisor > √N, it must also have one < √N
- Example: 36 = 6×6, factors are (1,36), (2,18), (3,12), (4,9), (6,6)
- Only need to check up to 6 = √36

### 🔹 Template 3: Counting with Early Exit

```java
// Check first, then count
if (!conditionMet(input)) {
    System.out.println("Not Found");
    return;
}

// Now count
int count = 0;
for (int i = start; i <= end; i++) {
    if (conditionMet(i)) {
        count++;
    }
}
System.out.println("Found, Position = " + count);
```

---

## 5️⃣ JAVA COLLECTIONS MASTERY

### When to Use Array vs ArrayList

| Scenario                                 | Use Array                     | Use ArrayList                                    |
| ---------------------------------------- | ----------------------------- | ------------------------------------------------ |
| Size known at compile time               | ✅ `int[] arr = new int[100]` | ❌                                               |
| Need dynamic resizing                    | ❌                            | ✅ `ArrayList<Integer> list = new ArrayList<>()` |
| Primitive types (int, char)              | ✅                            | ❌ (needs Integer, Character)                    |
| Need Collections methods (sort, shuffle) | ❌                            | ✅                                               |
| This problem (Q1)                        | ✅ (fixed iteration)          | Optional (dynamic storage)                       |

### ArrayList Methods for This Problem

```java
ArrayList<Integer> primes = new ArrayList<>();
primes.add(2);                  // O(1) - add element
primes.get(0);                  // O(1) - access by index
primes.size();                  // O(1) - get count
primes.contains(7);             // O(n) - search
Collections.sort(primes);       // O(n log n) - sort
```

**Time Complexity Implications:**

- Array approach: O(N√N) - iterate N times, each isPrime is O(√N)
- ArrayList approach: Same complexity, but slightly more memory overhead

---

## 6️⃣ WHAT YOU MUST MEMORIZE

### 🔴 Rules

1. **Always validate constraints BEFORE any logic**
2. **Loop boundary: Use `i * i <= num` for divisor checks, NOT `i < num/2`**
3. **Increment counters BEFORE using them in output**
4. **Check condition first, then count (avoid unnecessary work)**

### 🚩 Red Flags (Junior Developer Traps)

- ❌ Using `i < num/2` instead of `i * i <= num`
- ❌ Printing `count` before incrementing it
- ❌ No input validation for n ≤ 0
- ❌ Checking every number up to N when you only need √N
- ❌ Using `count=count+1` AFTER the condition check

### ⚡ Patterns

- **Prime Problems:** Always optimize to √N
- **Position Problems:** Count from start to target, increment as you go
- **Validation:** First line after input should be constraint check

---

## 7️⃣ NETCRACKER-FOCUSED QUESTIONS

### Most Asked Prime-Related Questions

**Q1.1: Print all prime numbers in range [L, R]**

```java
// Core Logic Tested: Efficient iteration + isPrime
for (int i = L; i <= R; i++) {
    if (isPrime(i)) {
        System.out.print(i + " ");
    }
}
```

**Q1.2: Find the Nth prime number**

```java
// What Interviewers Look For: Counting logic without position parameter
int count = 0;
int num = 2;
while (true) {
    if (isPrime(num)) {
        count++;
        if (count == N) {
            System.out.println(num);
            break;
        }
    }
    num++;
}
```

**Q1.3: Sum of all primes up to N**

```java
// Algorithm: Sieve of Eratosthenes (advanced) or simple iteration
int sum = 0;
for (int i = 2; i <= N; i++) {
    if (isPrime(i)) sum += i;
}
```

---

## 8️⃣ TECHNICAL MCQs (Netcracker Style)

### MCQ 1: Time Complexity

**Q:** What is the time complexity of this isPrime function?

```java
for (int i = 2; i * i <= num; i++) {
    if (num % i == 0) return false;
}
```

**Options:**

- A) O(N)
- B) O(N²)
- C) O(√N)
- D) O(log N)

**✅ Correct Answer: C) O(√N)**

**Explanation:**

- Loop runs from 2 to √num
- If num = 100, loop runs ~10 times (√100)
- Each iteration is O(1) modulo operation
- Total: O(√N)

**Why Others Are Wrong:**

- A) O(N): This would be `for (int i = 2; i <= num; i++)`
- B) O(N²): This would need nested loops
- D) O(log N): This is for binary search patterns

---

### MCQ 2: Output Prediction

**Q:** What does this code print for input `4`?

```java
for (int i = 2; i < (4/2); i++) {
    if (4 % i == 0) return false;
}
return true;
```

**Options:**

- A) true
- B) false
- C) Compilation error
- D) Runtime error

**✅ Correct Answer: A) true**

**Explanation:**

- `4/2 = 2`, so loop condition is `i < 2`
- Loop starts at `i = 2`, but `2 < 2` is FALSE
- Loop never executes
- Returns `true` (WRONG for 4, which is not prime)
- **This is YOUR bug in the original code**

**Why Others Are Wrong:**

- B) Would be correct if loop executed
- C/D) Code is syntactically valid

---

### MCQ 3: Best Practice

**Q:** Which isPrime implementation is BEST for competitive exams?

```java
// Option A
for (int i = 2; i <= num; i++)
    if (num % i == 0) return false;

// Option B
for (int i = 2; i * i <= num; i++)
    if (num % i == 0) return false;

// Option C
for (int i = 2; i < num/2; i++)
    if (num % i == 0) return false;
```

**Options:**

- A) Option A
- B) Option B
- C) Option C
- D) All are equivalent

**✅ Correct Answer: B) Option B**

**Explanation:**

- **Option B:** O(√N) - mathematically optimal
- **Option A:** O(N) - checks all divisors (too slow)
- **Option C:** O(N/2) = O(N) - faster than A but BUGGY (misses i = num/2 exactly)
- Option C is YOUR original mistake

**Complexity Comparison:**

- For N = 1,000,000:
    - Option A: ~1,000,000 iterations
    - Option B: ~1,000 iterations ✅
    - Option C: ~500,000 iterations (buggy)

---

### MCQ 4: Off-by-One Error

**Q:** Given primes [2,3,5,7], what's the position of 7?

```java
int count = 0;
if (isPrime(num)) {
    if (num == 7) {
        System.out.println(count);
    }
    count++;
}
```

**Options:**

- A) 3
- B) 4
- C) 0
- D) Depends on loop structure

**✅ Correct Answer: D) Depends on loop structure**

**Explanation:**

- This code prints count BEFORE incrementing
- If we process 2,3,5,7: count would be 3 when we hit 7
- But if we increment first, it's 4
- The snippet is incomplete (needs loop context)
- **This demonstrates YOUR timing bug**

**Lesson:** Always increment BEFORE using the count

---

### MCQ 5: Input Validation

**Q:** For constraint "n > 0", which validation is correct?

```java
// Option A
if (n == 0) return;

// Option B
if (n <= 0) {
    System.out.println("Invalid Input");
    return;
}

// Option C
if (n < 0) {
    System.out.println("Invalid Input");
}
```

**Options:**

- A) Option A only
- B) Option B only
- C) Option C only
- D) Both A and C

**✅ Correct Answer: B) Option B only**

**Explanation:**

- Constraint says "greater than zero" → means n must be ≥ 1
- Must reject both n = 0 AND n < 0
- **Option B:** Handles both cases with `n <= 0` ✅
- **Option A:** Only handles zero, misses negatives ❌
- **Option C:** Only handles negatives, misses zero ❌

**This is YOUR missing validation**

---

# Q2: FIRST NEGATIVE IN WINDOW - COMPLETE SOLUTION

## 🎯 Problem

Print the first negative value in every window of size K.

**Your Status:** Not Attempted (0% score)

---

## 1️⃣ CORRECTED SOLUTION (Interview-Ready)

### ✅ WITHOUT Collection Framework (Optimal - Deque Concept)

```java
import java.util.*;

public class FirstNegativeInWindow {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Input
        int n = sc.nextInt();

        // Constraint: Array size must be > 0
        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int k = sc.nextInt();

        // Constraint: Key value validation
        if (k <= 0 || k > n) {
            System.out.println("Invalid Key Value");
            return;
        }

        // Sliding Window Approach
        ArrayList<Integer> result = new ArrayList<>();
        boolean hasNegative = false;

        // Process each window
        for (int i = 0; i <= n - k; i++) {
            int firstNeg = 0;  // Default: no negative found

            // Find first negative in current window [i, i+k-1]
            for (int j = i; j < i + k; j++) {
                if (arr[j] < 0) {
                    firstNeg = arr[j];
                    hasNegative = true;
                    break;  // Found first negative, exit inner loop
                }
            }

            if (firstNeg != 0) {
                result.add(firstNeg);
            }
        }

        // Output
        if (!hasNegative) {
            System.out.println("No Numbers");
        } else {
            for (int val : result) {
                System.out.print(val + " ");
            }
        }
    }
}
```

### ✅ WITH Collection Framework (Deque - Advanced)

```java
import java.util.*;

public class FirstNegativeDeque {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int k = sc.nextInt();
        if (k <= 0 || k > n) {
            System.out.println("Invalid Key Value");
            return;
        }

        // Deque stores INDICES of negative numbers
        Deque<Integer> deque = new LinkedList<>();
        ArrayList<Integer> result = new ArrayList<>();

        // First window
        for (int i = 0; i < k; i++) {
            if (arr[i] < 0) {
                deque.add(i);
            }
        }

        // Store first negative of first window
        if (!deque.isEmpty()) {
            result.add(arr[deque.peekFirst()]);
        }

        // Slide window
        for (int i = k; i < n; i++) {
            // Remove elements outside current window
            while (!deque.isEmpty() && deque.peekFirst() <= i - k) {
                deque.removeFirst();
            }

            // Add current element if negative
            if (arr[i] < 0) {
                deque.addLast(i);
            }

            // Store first negative of current window
            if (!deque.isEmpty()) {
                result.add(arr[deque.peekFirst()]);
            }
        }

        // Output
        if (result.isEmpty()) {
            System.out.println("No Numbers");
        } else {
            for (int val : result) {
                System.out.print(val + " ");
            }
        }
    }
}
```

---

## 2️⃣ MISTAKE ANALYSIS

### Why You Didn't Attempt This

**Pattern Not Recognized:** Sliding Window Technique

**What Interviewers Expect:**

- Recognize keywords: "every window of size K" → Sliding Window pattern
- Understand two approaches:
    1. **Brute Force:** Check each window separately O(N×K)
    2. **Optimized:** Use Deque to track negatives O(N)

**Why Junior Developers Skip:**

- Never learned the pattern
- Looks complex (Deque is unfamiliar)
- Brute force seems "too simple" to be right

**Truth:** Brute force IS acceptable for small inputs (N ≤ 10,000)

---

## 3️⃣ CONCEPT BREAKDOWN

### Core DSA Concept: **Sliding Window**

**Mental Model:**

```
Array: [-8, 2, -3, -6, 10], K=2

Window 1: [-8, 2]    → First negative: -8
Window 2: [2, -3]    → First negative: -3
Window 3: [-3, -6]   → First negative: -3
Window 4: [-6, 10]   → First negative: -6

Output: -8 -3 -3 -6
```

**Step-by-Step Reasoning:**

1. **Window Definition:** Subarray of size K that slides from left to right
2. **Number of Windows:** `N - K + 1` (for N=5, K=2: 5-2+1 = 4 windows)
3. **For Each Window:** Find first element < 0, or skip if none exist

**When NOT to Use:**

- When you need ALL elements in window (not just first)
- When window size is not fixed
- When you need non-contiguous elements

---

## 4️⃣ COMMON LOGIC BLOCKS (Reusable Templates)

### 🔹 Template 1: Fixed-Size Sliding Window (Brute Force)

```java
// For each window starting position
for (int i = 0; i <= n - k; i++) {
    // Process window [i, i+k-1]
    for (int j = i; j < i + k; j++) {
        // Check condition
        if (arr[j] meets condition) {
            // Store result and break (first occurrence)
            break;
        }
    }
}
```

**Time Complexity:** O(N×K)  
**Space Complexity:** O(1) excluding output

### 🔹 Template 2: Sliding Window with Deque (Optimal)

```java
Deque<Integer> deque = new LinkedList<>();

// First window
for (int i = 0; i < k; i++) {
    if (arr[i] meets condition) {
        deque.add(i);  // Store index
    }
}

// Slide window
for (int i = k; i < n; i++) {
    // Remove out-of-window elements
    while (!deque.isEmpty() && deque.peekFirst() <= i - k) {
        deque.removeFirst();
    }

    // Add new element
    if (arr[i] meets condition) {
        deque.addLast(i);
    }

    // Process current window
    if (!deque.isEmpty()) {
        // Use deque.peekFirst() for result
    }
}
```

**Time Complexity:** O(N) - each element added/removed once  
**Space Complexity:** O(K) - deque stores at most K elements

### 🔹 Template 3: Input Validation for Arrays

```java
int n = sc.nextInt();
if (n <= 0) {
    System.out.println("Invalid Input");
    return;
}

int[] arr = new int[n];
for (int i = 0; i < n; i++) {
    arr[i] = sc.nextInt();
}

int k = sc.nextInt();
if (k <= 0 || k > n) {
    System.out.println("Invalid Key Value");
    return;
}
```

---

## 5️⃣ JAVA COLLECTIONS MASTERY

### Deque Interface (Double-Ended Queue)

**When to Use Deque:**

- Sliding window problems
- Need to add/remove from both ends
- Track indices or values in specific order

**Key Methods:**

```java
Deque<Integer> deque = new LinkedList<>();

// Add operations
deque.addFirst(10);      // Add to front
deque.addLast(20);       // Add to end (same as add)

// Remove operations
deque.removeFirst();     // Remove from front
deque.removeLast();      // Remove from end

// Peek operations (no removal)
deque.peekFirst();       // View front element
deque.peekLast();        // View last element

// Check
deque.isEmpty();         // True if empty
deque.size();            // Number of elements
```

**Time Complexity:**
| Operation | Time |
|-----------|------|
| addFirst/addLast | O(1) |
| removeFirst/removeLast | O(1) |
| peekFirst/peekLast | O(1) |

**This Problem: Deque vs ArrayList**

- **Deque:** O(N) optimal solution - tracks indices
- **ArrayList:** O(N×K) brute force - stores results
- **Recommendation:** Use brute force for interviews (easier to code correctly under pressure)

---

## 6️⃣ WHAT YOU MUST MEMORIZE

### 🔴 Rules

1. **Sliding Window keyword:** "every window of size K"
2. **Number of windows:** `N - K + 1`
3. **Window range:** `[i, i+K-1]` where `i` goes from `0` to `N-K`
4. **Validate K:** Must be `0 < K <= N`

### 🚩 Red Flags

- ❌ Forgetting to validate `K > N` (can't have window larger than array)
- ❌ Off-by-one: using `i < n - k` instead of `i <= n - k`
- ❌ Not handling "No Numbers" case (all positive windows)
- ❌ Including window boundaries incorrectly

### ⚡ Patterns

- **Fixed Window:** Size is constant
- **Variable Window:** Size changes based on condition (not this problem)
- **First Element:** Break after finding first match
- **All Elements:** Continue processing entire window

---

## 7️⃣ NETCRACKER-FOCUSED QUESTIONS

### Most Asked Sliding Window Questions

**Q2.1: Maximum in every window of size K**

```java
// Core Logic: Track maximum in each window
for (int i = 0; i <= n - k; i++) {
    int max = Integer.MIN_VALUE;
    for (int j = i; j < i + k; j++) {
        max = Math.max(max, arr[j]);
    }
    System.out.print(max + " ");
}
```

**Q2.2: Sum of every window of size K**

```java
// Algorithm: Compute first window, then slide
int sum = 0;
for (int i = 0; i < k; i++) sum += arr[i];
System.out.print(sum + " ");

for (int i = k; i < n; i++) {
    sum = sum - arr[i - k] + arr[i];  // Remove left, add right
    System.out.print(sum + " ");
}
```

**Q2.3: Count of negatives in every window**

```java
// What Interviewers Look For: Counting vs finding first
int count = 0;
for (int j = i; j < i + k; j++) {
    if (arr[j] < 0) count++;
}
```

---

## 8️⃣ TECHNICAL MCQs

### MCQ 1: Window Count

**Q:** For array size N=8 and K=3, how many windows exist?

**Options:**

- A) 5
- B) 6
- C) 7
- D) 8

**✅ Correct Answer: B) 6**

**Explanation:**

- Formula: `N - K + 1 = 8 - 3 + 1 = 6`
- Windows: [0-2], [1-3], [2-4], [3-5], [4-6], [5-7]

---

### MCQ 2: Loop Boundary

**Q:** For N=5, K=2, what's the correct loop condition?

```java
for (int i = 0; ___; i++)
```

**Options:**

- A) `i < n - k`
- B) `i <= n - k`
- C) `i < n`
- D) `i <= n - k + 1`

**✅ Correct Answer: B) `i <= n - k`**

**Explanation:**

- Last window starts at `n - k = 5 - 2 = 3`
- Must include `i = 3` → need `<=`
- Option A (`i < 3`) would stop at `i = 2`, missing last window

---

### MCQ 3: Deque vs ArrayList

**Q:** Why use Deque for sliding window?

**Options:**

- A) Faster than arrays
- B) Can remove from both ends in O(1)
- C) Automatically sorts elements
- D) Required by Java syntax

**✅ Correct Answer: B)**

**Explanation:**

- Deque allows O(1) removal from front (out-of-window elements)
- ArrayList.remove(0) is O(N) - shifts all elements
- No sorting involved
- Arrays are valid but less efficient for this pattern

---

## 9️⃣ PRACTICE PROBLEMS (Level 4: Sliding Window Mastery)

### Practice Problem 4.1: Maximum Sum Window

**Problem:**
Given an array and window size K, find the maximum sum among all windows of size K.

**Example:**

```
Input:  N = 9
        arr = [1, 4, 2, 10, 23, 3, 1, 0, 20]
        K = 4
Output: 39
Explanation: Window [10, 23, 3, 1] has sum 39
```

**Test Cases to Try:**

```
TC1: arr = [1, 2, 3, 4, 5], K = 2 → Output: 9 (window [4,5])
TC2: arr = [-1, -2, -3, -4], K = 2 → Output: -3 (window [-1,-2])
TC3: arr = [10], K = 1 → Output: 10
```

**Your Solution Template:**

```java
import java.util.*;

public class MaxSumWindow {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int k = sc.nextInt();

        if (k <= 0 || k > n) {
            System.out.println("Invalid Key Value");
            return;
        }

        // YOUR CODE HERE
        // Hint 1: Use Integer.MIN_VALUE for maxSum initialization
        // Hint 2: Loop condition: i <= n - k
        // Hint 3: Inner loop: j from i to i+k-1

        int maxSum = Integer.MIN_VALUE;  // Handle negative arrays

        for (int i = 0; i <= n - k; i++) {
            int currentSum = 0;
            for (int j = i; j < i + k; j++) {
                currentSum += arr[j];
            }
            maxSum = Math.max(maxSum, currentSum);
        }

        System.out.println(maxSum);
    }
}
```

**Time Complexity:** O(N × K) - Brute force  
**Space Complexity:** O(1)

**Challenge (Optional):** Optimize to O(N) using sliding window technique (add rightmost, remove leftmost)

---

### Practice Problem 4.2: Count Negatives in Each Window

**Problem:**
For each window of size K, count how many negative numbers exist.

**Example:**

```
Input:  N = 5
        arr = [-1, 2, -3, 4, 5]
        K = 2
Output: 1 1 1 0
Explanation:
Window [- 1, 2]:     1 negative
Window [2, -3]:      1 negative
Window [-3, 4]:      1 negative
Window [4, 5]:       0 negatives
```

**Test Cases:**

```
TC1: arr = [1, 2, 3], K = 2 → Output: 0 0
TC2: arr = [-1, -2, -3], K = 2 → Output: 2 2
TC3: arr = [0, -5, 0], K = 1 → Output: 0 1 0
```

**Your Solution Template:**

```java
import java.util.*;

public class CountNegativesWindow {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int k = sc.nextInt();

        if (k <= 0 || k > n) {
            System.out.println("Invalid Key Value");
            return;
        }

        // YOUR CODE HERE
        for (int i = 0; i <= n - k; i++) {
            int count = 0;
            for (int j = i; j < i + k; j++) {
                if (arr[j] < 0) {
                    count++;
                }
            }
            System.out.print(count + " ");
        }
    }
}
```

---

### Practice Problem 4.3: First Positive in Each Window

**Problem:**
Similar to Q2 (first negative), but find the first positive number in each window.

**Example:**

```
Input:  N = 5
        arr = [1, -2, 3, -4, 5]
        K = 2
Output: 1 3 3 5
Explanation:
Window [1, -2]:      first positive = 1
Window [-2, 3]:      first positive = 3
Window [3, -4]:      first positive = 3
Window [-4, 5]:      first positive = 5
```

**Test Cases:**

```
TC1: arr = [-1, -2, -3], K = 2 → Output: No Numbers
TC2: arr = [0, 0, 5], K = 2 → Output: 0 5
TC3: arr = [10, 20], K = 1 → Output: 10 20
```

**Your Solution Template:**

```java
import java.util.*;

public class FirstPositiveWindow {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int k = sc.nextInt();

        if (k <= 0 || k > n) {
            System.out.println("Invalid Key Value");
            return;
        }

        // YOUR CODE HERE - Similar structure to Q2
        boolean hasPositive = false;

        for (int i = 0; i <= n - k; i++) {
            boolean foundInWindow = false;

            for (int j = i; j < i + k; j++) {
                if (arr[j] > 0) {  // CHANGE: Check for positive
                    System.out.print(arr[j] + " ");
                    hasPositive = true;
                    foundInWindow = true;
                    break;
                }
            }
        }

        if (!hasPositive) {
            System.out.println("No Numbers");
        }
    }
}
```

---

### Practice Problem 4.4: Average of Each Window

**Problem:**
Calculate the average (rounded down) of each window of size K.

**Example:**

```
Input:  N = 4
        arr = [10, 20, 30, 40]
        K = 2
Output: 15 25 35
Explanation:
Window [10, 20]: avg = 30/2 = 15
Window [20, 30]: avg = 50/2 = 25
Window [30, 40]: avg = 70/2 = 35
```

**Your Solution:**

```java
// Hint: sum / k gives average
// Use integer division automatically rounds down
for (int i = 0; i <= n - k; i++) {
    int sum = 0;
    for (int j = i; j < i + k; j++) {
        sum += arr[j];
    }
    System.out.print((sum / k) + " ");
}
```

---

### Practice Problem 4.5: All Subarrays with Sum K (ChatGPT's Question)

**Problem:**
Print all subarrays (continuous) whose sum equals K.

**Example:**

```
Input:  N = 5
        arr = [4, 5, 8, 2, 6]
        K = 8
Output: 8
        2 6
Explanation: [8] has sum 8, [2,6] has sum 8
```

**Test Cases:**

```
TC1: arr = [1, 1, 1], K = 2 → Output: 1 1 (appears twice)
                                        1 1
TC2: arr = [1, 2, 3], K = 7 → Output: No Possibilites Available.
TC3: arr = [5], K = 5 → Output: 5
```

**Your Complete Solution:**

```java
import java.util.*;

public class AllSubarraySum {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int key = sc.nextInt();
        boolean found = false;

        // Nested loops: Check all subarrays
        for (int i = 0; i < n; i++) {
            int sum = 0;

            for (int j = i; j < n; j++) {
                sum += arr[j];

                if (sum == key) {
                    // Print subarray [i, j]
                    for (int k = i; k <= j; k++) {
                        System.out.print(arr[k] + " ");
                    }
                    System.out.println();
                    found = true;
                }
            }
        }

        if (!found) {
            System.out.println("No Possibilites Available.");
        }
    }
}
```

**Time Complexity:** O(N²) for checking + O(N) for printing = O(N²)  
**Space Complexity:** O(1)

**Key Difference from Sliding Window:**

- Sliding window: FIXED size K
- Subarray sum: VARIABLE size, find all that match sum

---

## 💡 WHEN TO USE EACH PATTERN

| Problem Type                        | Pattern              | Fixed Window Size?   | Example      |
| ----------------------------------- | -------------------- | -------------------- | ------------ |
| First negative in K-size window     | Sliding Window       | ✅ Yes (K given)     | Q2           |
| Maximum sum in K-size window        | Sliding Window       | ✅ Yes (K given)     | Practice 4.1 |
| All subarrays with sum K            | Subarray Iteration   | ❌ No (variable)     | Practice 4.5 |
| Count of negatives in each K-window | Sliding Window       | ✅ Yes (K given)     | Practice 4.2 |
| Longest subarray with sum K         | Prefix Sum + HashMap | ❌ No (find longest) | Advanced     |

**Recognition Rule:**

- If problem says "window of size K" → **Sliding Window**
- If problem says "subarray with sum K" → **Subarray Iteration** or **Prefix Sum**

---

# Q3: DIGIT SUM DIVISIBILITY - CORRECTED

## 🎯 Problem

Print numbers in range [S, E] whose digit sum is divisible by K.

**Your Failed Test Cases:** TC 1, TC 2, TC 4, TC 6 (60% failure)

---

## 1️⃣ CORRECTED SOLUTION (Interview-Ready)

### ✅ WITHOUT Collection Framework

```java
import java.util.*;

public class DigitSumDivisibility {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int start = sc.nextInt();
        int end = sc.nextInt();
        int k = sc.nextInt();

        // CRITICAL FIX: Inclusive range [start, end]
        boolean found = false;
        for (int i = start; i <= end; i++) {  // CHANGED: start+1 → start, i<end → i<=end
            int sum = getDigitSum(i);

            if (sum % k == 0) {
                System.out.print(i + " ");
                found = true;
            }
        }

        if (!found) {
            System.out.println("No Numbers");
        }
    }

    // Extract digit sum
    public static int getDigitSum(int num) {
        int sum = 0;
        num = Math.abs(num);  // Handle negative numbers

        while (num > 0) {
            sum += num % 10;
            num /= 10;
        }

        return sum;
    }
}
```

### ✅ WITH Collection Framework

```java
import java.util.*;

public class DigitSumWithCollections {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int start = sc.nextInt();
        int end = sc.nextInt();
        int k = sc.nextInt();

        ArrayList<Integer> result = new ArrayList<>();

        for (int i = start; i <= end; i++) {
            int sum = getDigitSum(i);

            if (sum % k == 0) {
                result.add(i);
            }
        }

        // Output
        if (result.isEmpty()) {
            System.out.println("No Numbers");
        } else {
            for (int num : result) {
                System.out.print(num + " ");
            }
        }
    }

    public static int getDigitSum(int num) {
        int sum = 0;
        num = Math.abs(num);

        while (num > 0) {
            sum += num % 10;
            num /= 10;
        }

        return sum;
    }
}
```

---

## 2️⃣ MISTAKE ANALYSIS (Your Code)

### ❌ **CRITICAL BUG: Range Boundary Exclusion**

```java
// YOUR CODE (WRONG):
for(int i=start+1; i<end; i++)  // Excludes BOTH boundaries!
```

**Why This Fails:**

```
Example: start=4, end=35, k=5
Expected range: [4, 5, 6, ..., 35]  (32 numbers)
Your range:     [5, 6, 7, ..., 34]  (30 numbers)

Missing: 4 and 35
- 4 is excluded (start+1 begins at 5)
- 35 is excluded (i<end stops at 34)
```

**Test Case Analysis:**

- **Input 1:** [4, 35, 5]
    - Expected: `5 14 19 23 28 32`
    - Your output: `14 19 23 28` (missing 5 and 32)
    - Why: 5 is at boundary, 32 is near end
- Result: **TC 1, TC 2, TC 4, TC 6 all test boundary inclusion**

**Interviewer Perspective:**

> "Candidate doesn't understand inclusive ranges. This is a reading comprehension failure—the problem clearly states 'in the range [s, e]' using bracket notation, which mathematically means inclusive."

**Expected Instead:**

```java
for(int i=start; i<=end; i++)  // INCLUSIVE both ends
```

---

### ❌ **UNNECESSARY LOGIC: Negative Handling**

```java
// YOUR CODE: Not required by problem
if(end<0) { end*=(-1); }
if(start<0) { start*=(-1); }
if(start>end) { /* swap */ }
```

**Why Interviewers Reject:**

- Problem doesn't mention negative ranges in constraints
- Adds complexity without requirements
- If needed, problem would specify it

**Better Approach:**

- Only handle what's explicitly required
- If unsure, add validation with error message:

```java
if (start < 0 || end < 0 || start > end) {
    System.out.println("Invalid Input");
    return;
}
```

---

### ✅ **GOOD PARTS: Digit Extraction**

```java
// YOUR CODE (CORRECT):
int sum=0;
int temp=i;
while(temp>0){
    sum+=temp%10;
    temp=temp/10;
}
```

**This is correct!** Shows understanding of:

- Modulo to get last digit
- Integer division to remove last digit
- Loop until number becomes 0

---

## 3️⃣ CONCEPT BREAKDOWN

### Core DSA Concept: **Digit Manipulation + Range Iteration**

**Mental Model:**

```
Number: 124
Step 1: 124 % 10 = 4   → sum = 4,   num = 124/10 = 12
Step 2:  12 % 10 = 2   → sum = 6,   num = 12/10 = 1
Step 3:   1 % 10 = 1   → sum = 7,   num = 1/10 = 0
Result: 7 (divisible by 7 ✓)
```

**Step-by-Step Reasoning:**

```
Input: start=4, end=35, k=5
For i=4:  digit_sum(4) = 4   → 4%5 = 4 ✗
For i=5:  digit_sum(5) = 5   → 5%5 = 0 ✓ → Print 5
For i=14: digit_sum(14) = 1+4 = 5 → 5%5 = 0 ✓ → Print 14
...
For i=32: digit_sum(32) = 3+2 = 5 → 5%5 = 0 ✓ → Print 32
Output: 5 14 19 23 28 32
```

**When NOT to Use:**

- Problem requires specific digit (not sum)
- Need digit product instead of sum
- Performance critical (N > 10^9) → need mathematical optimization

---

## 4️⃣ COMMON LOGIC BLOCKS (Reusable Templates)

### 🔹 Template 1: Range Iteration (Inclusive)

```java
// ALWAYS use this for [start, end] notation
for (int i = start; i <= end; i++) {
    // Process i
}
```

**Common Mistakes:**

- ❌ `for (int i = start+1; ...)` → Excludes start
- ❌ `for (int i = start; i < end; ...)` → Excludes end
- ✅ `for (int i = start; i <= end; ...)` → CORRECT

### 🔹 Template 2: Digit Sum Extraction

```java
public static int getDigitSum(int num) {
    int sum = 0;
    num = Math.abs(num);  // Handle negatives (get absolute value)

    while (num > 0) {
        sum += num % 10;   // Add last digit
        num /= 10;         // Remove last digit
    }

    return sum;
}
```

**Time Complexity:** O(log₁₀N) - number of digits  
**Example:** For num=1234, runs 4 times

### 🔹 Template 3: Conditional Output

```java
boolean found = false;
for (int i = start; i <= end; i++) {
    if (condition) {
        System.out.print(i + " ");
        found = true;
    }
}

if (!found) {
    System.out.println("No Numbers");
}
```

---

## 5️⃣ JAVA COLLECTIONS MASTERY

### Array vs ArrayList for Range Problems

| Aspect                 | Array                 | ArrayList             |
| ---------------------- | --------------------- | --------------------- |
| Size known?            | ❌ (range is dynamic) | ✅                    |
| Need to store results? | ❌ (print directly)   | ✅ (store then print) |
| This problem           | Not needed            | Optional              |

**When ArrayList Helps:**

```java
ArrayList<Integer> result = new ArrayList<>();
// Collect results
for (...) {
    if (condition) result.add(i);
}

// Check and output
if (result.isEmpty()) {
    System.out.println("No Numbers");
} else {
    for (int num : result) {
        System.out.print(num + " ");
    }
}
```

**Benefits:**

- Cleaner separation of logic and output
- Can perform additional operations (sort, reverse)
- Easier to debug (inspect result list)

---

## 6️⃣ WHAT YOU MUST MEMORIZE

### 🔴 Rules

1. **Bracket notation [a, b] means INCLUSIVE both ends**
2. **Loop for inclusive range: `for (int i = start; i <= end; i++)`**
3. **Digit sum: `num % 10` gets last digit, `num / 10` removes it**
4. **Divisibility: `x % k == 0` means k divides x evenly**

### 🚩 Red Flags (YOUR mistakes)

- ❌ Using `start+1` → always start at `start` for inclusive ranges
- ❌ Using `i < end` → should be `i <= end` for inclusive
- ❌ Adding logic not in constraints (negative handling, swapping)
- ❌ Not extracting digit logic to separate function (makes testing harder)

### ⚡ Patterns

- **Range Problems:** Always clarify inclusive vs exclusive
- **Digit Manipulation:** Standard template with `% 10` and `/ 10`
- **Divisibility:** Direct modulo check, no complex logic needed

---

## 7️⃣ NETCRACKER-FOCUSED QUESTIONS

### Most Asked Digit/Range Questions

**Q3.1: Sum of digits equals N**

```java
// Find all numbers in range where digit sum == N
for (int i = start; i <= end; i++) {
    if (getDigitSum(i) == N) {
        System.out.print(i + " ");
    }
}
```

**Q3.2: Numbers with even digit sum**

```java
// Core Logic: digit_sum % 2 == 0
if (getDigitSum(i) % 2 == 0) {
    // Even digit sum
}
```

**Q3.3: Armstrong numbers in range**

```java
// Armstrong: sum of cubes of digits equals number
// Example: 153 = 1³ + 5³ + 3³
for (int i = start; i <= end; i++) {
    if (isArmstrong(i)) {
        System.out.print(i + " ");
    }
}
```

---

## 8️⃣ TECHNICAL MCQs

### MCQ 1: Range Inclusion

**Q:** Which loop correctly iterates [10, 20] inclusive?

**Options:**

- A) `for (int i = 10; i < 20; i++)`
- B) `for (int i = 10; i <= 20; i++)`
- C) `for (int i = 11; i <= 20; i++)`
- D) `for (int i = 10; i < 21; i++)`

**✅ Correct Answer: B)**

**Explanation:**

- [10, 20] means include both 10 and 20
- **B:** Starts at 10, ends at 20 (inclusive) ✓
- **A:** Excludes 20 (stops at 19)
- **C:** Excludes 10 (starts at 11)
- **D:** Works but uses `< 21` which is less clear than `<= 20`

---

### MCQ 2: Digit Sum

**Q:** What is the digit sum of 149?

**Options:**

- A) 13
- B) 14
- C) 15
- D) 149

**✅ Correct Answer: B) 14**

**Explanation:**

- 149 → 1 + 4 + 9 = 14
- Verify: 14 % 7 = 0 (divisible by 7, matching example)

---

### MCQ 3: Modulo Operation

**Q:** `28 % 5` equals?

**Options:**

- A) 0
- B) 3
- C) 5
- D) 28

**✅ Correct Answer: B) 3**

**Explanation:**

- 28 ÷ 5 = 5 remainder 3
- Modulo returns the remainder
- Check: 28 = 5×5 + 3

---

### MCQ 4: Time Complexity

**Q:** For range [1, N], checking digit divisibility has complexity?

**Options:**

- A) O(N)
- B) O(N log N)
- C) O(N × D) where D = digits
- D) O(N²)

**✅ Correct Answer: C) O(N × D)**

**Explanation:**

- Outer loop: N iterations
- Inner (digit extraction): D iterations where D = log₁₀(number)
- For N=1000: ~1000 × 3 = 3000 operations
- Practically close to O(N) since D is small (< 10 for most numbers)

---

# Q4: TRIANGLE PATTERN - CORRECTED

## 🎯 Problem

Print triangle pattern with alphabets, then asterisks after 'z'.

**Your Failed Test Cases:** TC 2, TC 3 (33% failure)

---

## 1️⃣ CORRECTED SOLUTION (Interview-Ready)

```java
import java.util.*;

public class TrianglePattern {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        // CONSTRAINT: Handle ZERO
        if (n == 0) {
            System.out.println("ZERO");
            return;
        }

        // CONSTRAINT: Handle negative
        if (n < 0) {
            System.out.println("Invalid Input");
            return;
        }

        // Pattern generation
        int charCode = 97;  // 'a' = 97

        for (int i = 1; i <= n; i++) {
            // Print leading spaces
            for (int j = 1; j < (n - i + 1); j++) {
                System.out.print(" ");
            }

            // Print characters or asterisks
            for (int k = 1; k <= i; k++) {
                if (charCode > 122) {  // 'z' = 122
                    System.out.print("* ");
                } else {
                    System.out.print((char) charCode + " ");
                    charCode++;
                }
            }

            System.out.println();
        }
    }
}
```

---

## 2️⃣ MISTAKE ANALYSIS (Your Code)

### ❌ **CRITICAL BUG #1: Missing ZERO Validation**

```java
// YOUR CODE: No check for n == 0
int n = sc.nextInt();
// Directly proceeds to pattern generation
```

**Why This Fails:**

- Constraint: "if Input is equal to zero then, print 'ZERO'"
- For n=0: Loop `for (int i=1; i<=0; i++)` never executes
- Output: Empty (nothing printed)
- Expected: "ZERO"
- **Result:** TC 2 failure

**Fix:**

```java
if (n == 0) {
    System.out.println("ZERO");
    return;
}
```

---

### ❌ **CRITICAL BUG #2: Missing Negative Validation**

```java
// YOUR CODE: No check for n < 0
```

**Why This Fails:**

- Constraint: "if Input is less than zero then, print 'Invalid Input'"
- For n=-5: Loop doesn't execute but also doesn't print error
- **Result:** TC 3 failure

**Fix:**

```java
if (n < 0) {
    System.out.println("Invalid Input");
    return;
}
```

---

### ✅ **GOOD PARTS: Pattern Logic**

```java
// YOUR CODE (CORRECT):
for(int i=1;i<=n;i++){
    // Spaces
    for(int j=1;j<(n-i+1);j++){
        System.out.print(" ");
    }

    // Characters
    for(int k=1;k<=i;k++){
        if(chara>=123){  // After 'z'
            System.out.print("* ");
        } else {
            System.out.print((char)(chara++)+" ");
        }
    }
    System.out.println();
}
```

**This is 90% correct!**

**Minor Note:**

- `chara>=123` works but magic number
- Better: `charCode > 'z'` or `charCode > 122`

---

## 3️⃣ CONCEPT BREAKDOWN

### Core DSA Concept: **Pattern Printing + ASCII Manipulation**

**Mental Model:**

```
n=5:
Row 1: 4 spaces + 1 char  →     a
Row 2: 3 spaces + 2 chars →    b c
Row 3: 2 spaces + 3 chars →   d e f
Row 4: 1 space  + 4 chars →  g h i j
Row 5: 0 spaces + 5 chars → k l m n o
```

**Formula:**

- Spaces in row i: `n - i`
- Characters in row i: `i`
- Total characters: 1+2+3+...+n = n(n+1)/2

**Step-by-Step Reasoning:**

```
For n=8:
Rows 1-6: Use a-z (26 letters)
Row 7: Needs 7 chars, only 26-21=5 letters left (v,w,x,y,z), then 2 asterisks
Row 8: Needs 8 chars, all asterisks

Character count check:
1+2+3+4+5+6 = 21 chars (row 1-6)
Row 7: 2 more letters (22,23,...26), then * * (need 7 total)
Row 8: All * * * * * * * * (26 letters exhausted)
```

---

## 4️⃣ COMMON LOGIC BLOCKS (Reusable Templates)

### 🔹 Template 1: Input Validation (ZERO + Negative)

```java
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();

if (n == 0) {
    System.out.println("ZERO");
    return;
}

if (n < 0) {
    System.out.println("Invalid Input");
    return;
}

// Continue with logic...
```

**MEMORIZE THIS:** Many Netcracker problems require this exact structure

### 🔹 Template 2: Triangle Pattern Structure

```java
for (int row = 1; row <= n; row++) {
    // Step 1: Leading spaces
    for (int s = 1; s <= (n - row); s++) {
        System.out.print(" ");
    }

    // Step 2: Content (numbers/chars/symbols)
    for (int col = 1; col <= row; col++) {
        // Print logic
    }

    // Step 3: Newline
    System.out.println();
}
```

### 🔹 Template 3: ASCII Character Handling

```java
int charCode = 97;  // Start at 'a'

for (...) {
    if (charCode > 122) {  // Exhausted a-z
        System.out.print("* ");
    } else {
        System.out.print((char) charCode + " ");
        charCode++;
    }
}
```

**ASCII Values:**

- 'a' = 97, 'z' = 122 (lowercase)
- 'A' = 65, 'Z' = 90 (uppercase)
- Total lowercase: 26 letters

---

## 5️⃣ JAVA COLLECTIONS MASTERY

### StringBuilder for Pattern Problems

**When to Use StringBuilder:**

- Building strings row-by-row
- Many concatenations (+ operator is slow)
- Need to modify before printing

**Example:**

```java
for (int row = 1; row <= n; row++) {
    StringBuilder line = new StringBuilder();

    // Add spaces
    for (int s = 1; s <= (n - row); s++) {
        line.append(" ");
    }

    // Add characters
    for (int col = 1; col <= row; col++) {
        if (charCode > 122) {
            line.append("* ");
        } else {
            line.append((char) charCode).append(" ");
            charCode++;
        }
    }

    System.out.println(line);
}
```

**Performance:**

- String concatenation (+): O(N²) for N operations
- StringBuilder: O(N) amortized

**For This Problem:** Direct `System.out.print()` is fine (small output)  
**Use StringBuilder when:** N > 1000 or complex string building

---

## 6️⃣ WHAT YOU MUST MEMORIZE

### 🔴 Rules

1. **ALWAYS validate ZERO and NEGATIVE before pattern logic**
2. **Triangle spaces formula: `n - row` leading spaces**
3. **ASCII: 'a'=97, 'z'=122 (26 letters)**
4. **Check `charCode > 122` to detect alphabet exhaustion**

### 🚩 Red Flags (YOUR mistakes)

- ❌ Skipping ZERO check → TC 2 failure
- ❌ Skipping negative check → TC 3 failure
- ❌ Not reading constraints carefully (both were explicitly stated)

### ⚡ Patterns

- **Pattern Problems:** Always validate input constraints first
- **Character Iteration:** Use ASCII codes for flexibility
- **Magic Numbers:** 97, 122 are standard (or use 'a', 'z')

---

## 7️⃣ NETCRACKER-FOCUSED QUESTIONS

### Most Asked Pattern Questions

**Q4.1: Number Triangle**

```java
// Print:
//     1
//    2 3
//   4 5 6
int num = 1;
for (int i = 1; i <= n; i++) {
    for (int s = 1; s <= n - i; s++) System.out.print(" ");
    for (int j = 1; j <= i; j++) System.out.print(num++ + " ");
    System.out.println();
}
```

**Q4.2: Reverse Triangle**

```java
// Print:
// a b c d
//  e f g
//   h i
//    j
for (int i = n; i >= 1; i--) {
    for (int s = 1; s <= n - i; s++) System.out.print(" ");
    for (int j = 1; j <= i; j++) System.out.print((char)charCode++ + " ");
    System.out.println();
}
```

**Q4.3: Diamond Pattern**

```java
// Combination of triangle + reverse triangle
// Upper half: spaces decrease
// Lower half: spaces increase
```

---

## 8️⃣ TECHNICAL MCQs

### MCQ 1: ASCII Values

**Q:** What is the ASCII value of 'z'?

**Options:**

- A) 90
- B) 97
- C) 122
- D) 123

**✅ Correct Answer: C) 122**

**Explanation:**

- Lowercase 'a' = 97
- Lowercase 'z' = 97 + 25 = 122
- Uppercase 'Z' = 90
- 123 is '{' (first character after 'z')

---

### MCQ 2: Character Count

**Q:** How many characters are needed for a triangle of size n=7?

**Options:**

- A) 7
- B) 21
- C) 28
- D) 49

**✅ Correct Answer: C) 28**

**Explanation:**

- Formula: 1+2+3+...+n = n(n+1)/2
- For n=7: 7×8/2 = 28
- Row 1: 1 char, Row 2: 2 chars, ..., Row 7: 7 chars
- Total: 28 characters

---

### MCQ 3: Space Formula

**Q:** In row 3 of a triangle (n=5), how many leading spaces?

**Options:**

- A) 1
- B) 2
- C) 3
- D) 4

**✅ Correct Answer: B) 2**

**Explanation:**

- Formula: `n - row = 5 - 3 = 2`
- Visual:

```
    a       (4 spaces, row 1)
   b c      (3 spaces, row 2)
  d e f     (2 spaces, row 3) ✓
 g h i j    (1 space, row 4)
k l m n o   (0 spaces, row 5)
```

---

### MCQ 4: Condition Check

**Q:** Which condition correctly checks if input is ZERO?

**Options:**

- A) `if (n <= 0)`
- B) `if (n == 0)`
- C) `if (n < 1)`
- D) Both B and C

**✅ Correct Answer: B) if (n == 0)**

**Explanation:**

- Constraint specifies ZERO separately from negative
- **A:** Includes negative numbers (wrong, separate error message)
- **B:** Only zero ✓
- **C:** Same as A (includes negatives)
- **D:** C is wrong

**Order of checks:**

```java
if (n == 0) → print "ZERO"
if (n < 0)  → print "Invalid Input"
// Continue with positive logic
```

---

# Q5: SUBSET SUM - COMPLETE SOLUTION

## 🎯 Problem

Print all subsets of an array whose sum equals a key value.

**Your Status:** Not Attempted (0% score)  
**Difficulty:** Hard (Recursion/Backtracking required)

---

## 1️⃣ CORRECTED SOLUTION (Interview-Ready)

### ✅ WITHOUT Collection Framework (Using Arrays)

```java
import java.util.*;

public class SubsetSum {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        // Constraint: Array size must be positive
        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int key = sc.nextInt();

        // Find all subsets with sum = key
        boolean[] found = {false};  // Use array to pass by reference
        int[] subset = new int[n];  // Temporary storage

        findSubsets(arr, key, 0, subset, 0, found);

        if (!found[0]) {
            System.out.println("No Possibilites Available.");
        }
    }

    // Recursive backtracking
    public static void findSubsets(int[] arr, int key, int index,
                                   int[] subset, int subsetSize, boolean[] found) {
        // Base case: Check if current subset sums to key
        int sum = 0;
        for (int i = 0; i < subsetSize; i++) {
            sum += subset[i];
        }

        if (sum == key && subsetSize > 0) {
            // Print this subset
            for (int i = 0; i < subsetSize; i++) {
                System.out.print(subset[i] + " ");
            }
            System.out.println();
            found[0] = true;
        }

        // Recursive case: Try including each remaining element
        for (int i = index; i < arr.length; i++) {
            // Include arr[i] in subset
            subset[subsetSize] = arr[i];

            // Recurse with next elements
            findSubsets(arr, key, i + 1, subset, subsetSize + 1, found);

            // Backtrack (subset[subsetSize] automatically overwritten in next iteration)
        }
    }
}
```

### ✅ WITH Collection Framework (Cleaner)

```java
import java.util.*;

public class SubsetSumWithCollections {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        ArrayList<Integer> arr = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            arr.add(sc.nextInt());
        }

        int key = sc.nextInt();

        // Find all subsets
        ArrayList<ArrayList<Integer>> allSubsets = new ArrayList<>();
        ArrayList<Integer> current = new ArrayList<>();

        findSubsets(arr, key, 0, current, allSubsets);

        // Output
        if (allSubsets.isEmpty()) {
            System.out.println("No Possibilites Available.");
        } else {
            for (ArrayList<Integer> subset : allSubsets) {
                for (int num : subset) {
                    System.out.print(num + " ");
                }
                System.out.println();
            }
        }
    }

    public static void findSubsets(ArrayList<Integer> arr, int key, int index,
                                   ArrayList<Integer> current,
                                   ArrayList<ArrayList<Integer>> result) {
        // Calculate current sum
        int sum = 0;
        for (int num : current) {
            sum += num;
        }

        // If sum matches, add to result
        if (sum == key && !current.isEmpty()) {
            result.add(new ArrayList<>(current));  // Deep copy
        }

        // Try including each remaining element
        for (int i = index; i < arr.size(); i++) {
            // Include arr[i]
            current.add(arr.get(i));

            // Recurse
            findSubsets(arr, key, i + 1, current, result);

            // Backtrack
            current.remove(current.size() - 1);
        }
    }
}
```

---

## 2️⃣ MISTAKE ANALYSIS

### Why You Didn't Attempt This

**Knowledge Gap:** Recursion and Backtracking

**What This Problem Tests:**

1. **Recursion:** Function calling itself with modified parameters
2. **Backtracking:** Exploring possibilities and undoing choices
3. **State Management:** Tracking current subset during exploration

**Why Junior Developers Skip:**

- Looks impossible without the pattern
- Don't recognize "all possibilities" → backtracking keyword
- Fear of infinite recursion

**Truth:** Once you learn the template, it's mechanical

---

## 3️⃣ CONCEPT BREAKDOWN

### Core DSA Concept: **Recursion + Backtracking**

**Mental Model - Decision Tree:**

```
Array: [4, 5, 8], Key: 8

                    []
          /         |         \
        [4]       [5]        [8] ← sum=8 ✓
       /   \       /  \
    [4,5] [4,8] [5,8]
     /
  [4,5,8]

For each element: INCLUDE or EXCLUDE
```

**Step-by-Step Reasoning:**

```
Input: [4, 5, 8, 2], Key = 8

Step 1: Try []
        sum = 0 ≠ 8

Step 2: Try [4]
        sum = 4 ≠ 8

Step 3: Try [4, 5]
        sum = 9 ≠ 8

Step 4: Try [4, 8]
        sum = 12 ≠ 8

Step 5: Try [4, 2]
        sum = 6 ≠ 8

Step 6: Try [8]
        sum = 8 = 8 ✓ → PRINT "8"

Step 7: Try [2]
        sum = 2 ≠ 8

... (continue exploring all combinations)
```

**When NOT to Use:**

- Need only ONE subset (use DP for 0/1 Knapsack)
- Array size > 20 (exponential time, too slow)
- Need count of subsets (use DP)

---

## 4️⃣ COMMON LOGIC BLOCKS (Reusable Templates)

### 🔹 Template 1: Recursive Backtracking Structure

```java
public static void backtrack(problem_state, choices, current_solution) {
    // BASE CASE: Check if current solution is valid
    if (isValid(current_solution)) {
        // Store or print solution
        storeSolution(current_solution);
    }

    // RECURSIVE CASE: Try all choices
    for (choice in choices) {
        // MAKE CHOICE
        current_solution.add(choice);

        // RECURSE with remaining choices
        backtrack(problem_state, remaining_choices, current_solution);

        // UNDO CHOICE (backtrack)
        current_solution.remove(choice);
    }
}
```

### 🔹 Template 2: Subset Generation Pattern

```java
public static void findSubsets(int[] arr, int index, ArrayList<Integer> current) {
    // Process current subset
    processCurrent(current);

    // Try including each element from index onwards
    for (int i = index; i < arr.length; i++) {
        current.add(arr[i]);           // Include
        findSubsets(arr, i + 1, current);  // Recurse
        current.remove(current.size() - 1);  // Backtrack
    }
}
```

**Why `i + 1` not `index + 1`:**

- Ensures we don't reuse the same element
- Avoids duplicates like [4,5] and [5,4]

### 🔹 Template 3: Sum Calculation

```java
// For ArrayList
int sum = 0;
for (int num : list) {
    sum += num;
}

// For array with size
int sum = 0;
for (int i = 0; i < size; i++) {
    sum += arr[i];
}
```

---

## 5️⃣ JAVA COLLECTIONS MASTERY

### ArrayList for Backtracking

**Why ArrayList > Array:**

1. **Dynamic size:** Don't know subset length in advance
2. **Easy add/remove:** `add()` and `remove()` for backtracking
3. **Deep copy:** `new ArrayList<>(current)` for storing results

**Key Methods:**

```java
ArrayList<Integer> list = new ArrayList<>();

// Add element (backtrack forward)
list.add(5);                    // O(1) amortized

// Remove last element (backtrack backward)
list.remove(list.size() - 1);   // O(1)

// Check empty
list.isEmpty();                 // O(1)

// Get sum (manual iteration)
int sum = 0;
for (int num : list) sum += num;

// Deep copy (for storing results)
ArrayList<Integer> copy = new ArrayList<>(list);
```

**ArrayList vs HashSet:**
| Need | Use |
|------|-----|
| Order matters | ArrayList ✅ |
| Duplicates allowed | ArrayList ✅ |
| Fast lookup | HashSet |
| This problem | ArrayList ✅ |

---

## 6️⃣ WHAT YOU MUST MEMORIZE

### 🔴 Rules

1. **Backtracking = Try → Recurse → Undo**
2. **Subset problems use for-loop starting at `index`**
3. **Always make deep copy when storing results: `new ArrayList<>(current)`**
4. **Base case checks condition and stores/prints**

### 🚩 Red Flags

- ❌ Forgetting to remove element after recursion (no backtracking)
- ❌ Using `index + 1` instead of `i + 1` (causes duplicates)
- ❌ Shallow copy: `result.add(current)` instead of `result.add(new ArrayList<>(current))`
- ❌ Not checking `!current.isEmpty()` (empty subset should be excluded)

### ⚡ Patterns

- **"All possibilities"** → Backtracking
- **"Combinations"** → Backtracking with for-loop
- **"Permutations"** → Backtracking with visited array
- **"Subsets"** → Generate 2^N combinations

---

## 7️⃣ NETCRACKER-FOCUSED QUESTIONS

### Most Asked Backtracking Questions

**Q5.1: Generate all subsets (Power Set)**

```java
// Output ALL subsets, not just those matching sum
public static void allSubsets(int[] arr, int index, ArrayList<Integer> current) {
    System.out.println(current);  // Print every subset

    for (int i = index; i < arr.length; i++) {
        current.add(arr[i]);
        allSubsets(arr, i + 1, current);
        current.remove(current.size() - 1);
    }
}
```

**Q5.2: Count subsets with given sum**

```java
// Return count instead of printing
public static int countSubsets(int[] arr, int key, int index, int currentSum) {
    if (currentSum == key) return 1;

    int count = 0;
    for (int i = index; i < arr.length; i++) {
        count += countSubsets(arr, key, i + 1, currentSum + arr[i]);
    }
    return count;
}
```

**Q5.3: Combination Sum (elements can repeat)**

```java
// Use i instead of i+1 to allow repetition
for (int i = index; i < arr.length; i++) {
    current.add(arr[i]);
    findCombinations(arr, key, i, current);  // i, not i+1
    current.remove(current.size() - 1);
}
```

---

## 8️⃣ TECHNICAL MCQs

### MCQ 1: Time Complexity

**Q:** What is the time complexity of generating all subsets of size N?

**Options:**

- A) O(N)
- B) O(N²)
- C) O(2^N)
- D) O(N!)

**✅ Correct Answer: C) O(2^N)**

**Explanation:**

- Each element has 2 choices: include or exclude
- Total subsets: 2^N
- Example: N=3 → 2³ = 8 subsets (including empty)
- This is why N > 20 is impractical

---

### MCQ 2: Backtracking Steps

**Q:** In backtracking, what does "undo" mean?

**Options:**

- A) Delete the entire array
- B) Remove last added element from current solution
- C) Reset all variables to zero
- D) Skip remaining elements

**✅ Correct Answer: B)**

**Explanation:**

- Backtrack = return to previous state
- In subset problems: `current.remove(current.size() - 1)`
- Allows exploring other branches of decision tree

---

### MCQ 3: Deep Copy

**Q:** Why is `new ArrayList<>(current)` needed when storing results?

**Options:**

- A) Faster than direct assignment
- B) Required by Java syntax
- C) Prevents modification of stored reference
- D) Reduces memory usage

**✅ Correct Answer: C)**

**Explanation:**

```java
// WRONG:
result.add(current);  // Stores reference

// After backtracking, current changes
// result[0] will also change!

// CORRECT:
result.add(new ArrayList<>(current));  // Stores copy
// result[0] is independent of current
```

---

### MCQ 4: Base Case

**Q:** In subset sum, when should we print the subset?

**Options:**

- A) After recursion ends
- B) When sum equals key AND subset not empty
- C) Before recursion starts
- D) Only if array is sorted

**✅ Correct Answer: B)**

**Explanation:**

- Check: `sum == key && !current.isEmpty()`
- Empty subset has sum 0, but shouldn't be printed unless key=0
- Print immediately when condition met (not after recursion)

---

## 9️⃣ PRACTICE PROBLEMS (Level 6: Recursion & Backtracking Mastery)

### Practice Problem 6.1: Count All Subsets

**Problem:**
Count how many subsets exist in an array (without printing them).

**Example:**

```
Input:  N = 3
        arr = [1, 2, 3]
Output: 8
Explanation: [], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]
```

**Test Cases:**

```
TC1: arr = [5] → Output: 2 (empty and [5])
TC2: arr = [1, 2] → Output: 4
TC3: arr = [] → Output: 1 (only empty subset)
```

**Your Solution Template:**

```java
import java.util.*;

public class CountSubsets {
    static int count = 0;

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n < 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        ArrayList<Integer> current = new ArrayList<>();
        countAllSubsets(arr, 0, current);

        System.out.println(count);
    }

    public static void countAllSubsets(int[] arr, int index, ArrayList<Integer> current) {
        // Every time this function is called, we have a valid subset
        count++;

        // Try adding each element from index onwards
        for (int i = index; i < arr.length; i++) {
            current.add(arr[i]);
            countAllSubsets(arr, i + 1, current);
            current.remove(current.size() - 1);  // Backtrack
        }
    }
}
```

**Mathematical Verification:** For N elements, answer = 2^N

---

### Practice Problem 6.2: Print All Subsets (Power Set)

**Problem:**
Print all possible subsets of an array, including the empty subset.

**Example:**

```
Input:  N = 3
        arr = [1, 2, 3]
Output: []
        [1]
        [1, 2]
        [1, 2, 3]
        [1, 3]
        [2]
        [2, 3]
        [3]
```

**Test Cases:**

```
TC1: arr = [5, 10] → Output: [], [5], [5,10], [10]
TC2: arr = [1] → Output: [], [1]
```

**Your Solution:**

```java
import java.util.*;

public class PowerSet {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n < 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        ArrayList<Integer> current = new ArrayList<>();
        printAllSubsets(arr, 0, current);
    }

    public static void printAllSubsets(int[] arr, int index, ArrayList<Integer> current) {
        // Print current subset (including empty)
        System.out.println(current);

        // Try adding each element from index onwards
        for (int i = index; i < arr.length; i++) {
            current.add(arr[i]);
            printAllSubsets(arr, i + 1, current);
            current.remove(current.size() - 1);
        }
    }
}
```

**Key Insight:** This is Q5 without the sum check - we print EVERY subset!

---

### Practice Problem 6.3: Subset with Maximum Sum

**Problem:**
Find the subset whose sum is maximum and print it.

**Example:**

```
Input:  N = 4
        arr = [1, 2, 3, 4]
Output: [1, 2, 3, 4]
        Sum = 10
```

**Test Cases:**

```
TC1: arr = [-5, 3, 2] → Output: [3, 2], Sum = 5
TC2: arr = [-1, -2, -3] → Output: [-1], Sum = -1
TC3: arr = [10] → Output: [10], Sum = 10
```

**Your Solution:**

```java
import java.util.*;

public class MaxSubsetSum {
    static ArrayList<Integer> maxSubset = new ArrayList<>();
    static int maxSum = Integer.MIN_VALUE;

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        ArrayList<Integer> current = new ArrayList<>();
        findMaxSubset(arr, 0, current);

        System.out.println(maxSubset);
        System.out.println("Sum = " + maxSum);
    }

    public static void findMaxSubset(int[] arr, int index, ArrayList<Integer> current) {
        // Calculate sum of current subset
        int sum = 0;
        for (int num : current) {
            sum += num;
        }

        // Update max if current is better
        if (sum > maxSum || (sum == maxSum && current.size() > maxSubset.size())) {
            maxSum = sum;
            maxSubset = new ArrayList<>(current);  // Deep copy!
        }

        // Try adding each element
        for (int i = index; i < arr.length; i++) {
            current.add(arr[i]);
            findMaxSubset(arr, i + 1, current);
            current.remove(current.size() - 1);
        }
    }
}
```

**Optimization Insight:** Maximum sum subset = all positive elements (if any exist)

---

### Practice Problem 6.4: Combination Sum (Elements Can Repeat)

**Problem:**
Find all subsets whose sum equals K, but elements can be used multiple times.

**Example:**

```
Input:  N = 2
        arr = [2, 3]
        K = 7
Output: [2, 2, 3]
        [2, 3, 2]  (Note: Duplicates may appear)
```

**Test Cases:**

```
TC1: arr = [5], K = 10 → Output: [5, 5]
TC2: arr = [2, 3], K = 1 → Output: No Possibilites Available.
```

**Your Solution:**

```java
import java.util.*;

public class CombinationSumRepeat {
    static boolean found = false;

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int key = sc.nextInt();

        ArrayList<Integer> current = new ArrayList<>();
        findCombinations(arr, key, 0, current);

        if (!found) {
            System.out.println("No Possibilites Available.");
        }
    }

    public static void findCombinations(int[] arr, int key, int index, ArrayList<Integer> current) {
        // Calculate current sum
        int sum = 0;
        for (int num : current) {
            sum += num;
        }

        // Base case: Found a match
        if (sum == key && !current.isEmpty()) {
            for (int num : current) {
                System.out.print(num + " ");
            }
            System.out.println();
            found = true;
            return;  // Stop exploring this branch
        }

        // Prune: If sum exceeds key, no point continuing
        if (sum >= key) {
            return;
        }

        // KEY DIFFERENCE: Use 'i' instead of 'i+1' to allow repetition
        for (int i = index; i < arr.length; i++) {
            current.add(arr[i]);
            findCombinations(arr, key, i, current);  // i, not i+1!
            current.remove(current.size() - 1);
        }
    }
}
```

**Key Difference from Q5:**

- Q5: `findSubsets(arr, i+1, ...)` → no repetition
- This: `findCombinations(arr, i, ...)` → allows repetition

---

### Practice Problem 6.5: Permutations of Array

**Problem:**
Print all permutations (arrangements) of an array.

**Example:**

```
Input:  N = 3
        arr = [1, 2, 3]
Output: [1, 2, 3]
        [1, 3, 2]
        [2, 1, 3]
        [2, 3, 1]
        [3, 1, 2]
        [3, 2, 1]
```

**Test Cases:**

```
TC1: arr = [5, 10] → Output: [5, 10] and [10, 5]
TC2: arr = [1] → Output: [1]
```

**Your Solution:**

```java
import java.util.*;

public class Permutations {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        ArrayList<Integer> current = new ArrayList<>();
        boolean[] used = new boolean[n];

        generatePermutations(arr, current, used);
    }

    public static void generatePermutations(int[] arr, ArrayList<Integer> current, boolean[] used) {
        // Base case: Permutation is complete
        if (current.size() == arr.length) {
            System.out.println(current);
            return;
        }

        // Try each unused element
        for (int i = 0; i < arr.length; i++) {
            if (!used[i]) {
                // Choose
                current.add(arr[i]);
                used[i] = true;

                // Explore
                generatePermutations(arr, current, used);

                // Unchoose (backtrack)
                current.remove(current.size() - 1);
                used[i] = false;
            }
        }
    }
}
```

**Time Complexity:** O(N!) - factorial growth  
**Example:** N=5 → 120 permutations, N=10 → 3,628,800 permutations

**Key Difference from Subsets:**

- Subsets: Start from `index`, use elements once
- Permutations: Try all elements, track `used[]` to avoid repetition

---

## 💡 RECURSION PATTERNS COMPARISON

| Problem Type          | Start Position    | Repetition Allowed?      | Size                 | Example              |
| --------------------- | ----------------- | ------------------------ | -------------------- | -------------------- |
| Subsets (Q5)          | `i+1`             | ❌ No                    | Variable             | [1,2] from [1,2,3]   |
| Power Set (6.2)       | `i+1`             | ❌ No                    | Variable (all sizes) | [], [1], [1,2], [2]  |
| Combination Sum (6.4) | `i`               | ✅ Yes                   | Variable             | [2,2,3] from [2,3]   |
| Permutations (6.5)    | `0` with `used[]` | ❌ No (but any position) | Fixed (N)            | [2,1,3] from [1,2,3] |

**Recognition Rules:**

- "Subsets with sum" → Start `i+1`, no repetition
- "Combinations with repetition" → Start `i`, allow same element
- "Arrangements/Permutations" → Try all positions, track used

---

## 📚 PATTERN 6: ARRAY ROTATION & REVERSAL

### 🧠 How to Recognize:

- "Rotate array left/right by K positions"
- "Reverse array/subarray"
- Keywords: "rotate", "shift", "circular", "reverse"

### 💭 Thought Process:

```
Step 1: Understand rotation
        [1, 2, 3, 4, 5] rotate right by 2
        → [4, 5, 1, 2, 3]

        Last 2 elements move to front

Step 2: Handle K > N
        K = K % N (effective rotation)
        Example: Rotate by 7 in array of size 5
        → 7 % 5 = 2 (equivalent to rotating by 2)

Step 3: Reversal algorithm
        Rotate right by K:
        1. Reverse entire array
        2. Reverse first K elements
        3. Reverse remaining elements
```

### 🎨 Visual Diagram:

```
Rotate RIGHT by 2 in [1, 2, 3, 4, 5]:

Step 1: Reverse entire array
        [1, 2, 3, 4, 5] → [5, 4, 3, 2, 1]

Step 2: Reverse first K=2 elements
        [5, 4, 3, 2, 1] → [4, 5, 3, 2, 1]
         ↑  ↑

Step 3: Reverse remaining elements
        [4, 5, 3, 2, 1] → [4, 5, 1, 2, 3] ✓
              ↑  ↑  ↑

Why it works:
Original:        [1  2  3  4  5]
                  ︸︸︸  ︸︸︸︸︸
                   A      B

After reverse:   [5  4  3  2  1]
                  ︸︸︸︸︸  ︸︸︸
                    B'     A'

Reverse B':      [4  5  3  2  1]
                  ︸︸︸  ︸︸︸︸︸
                   B      A'

Reverse A':      [4  5  1  2  3]
                  ︸︸︸  ︸︸︸︸︸
                   B      A    ✓
```

### 🔧 Brute Force Approach:

```java
// APPROACH 1: Create New Array
// Time: O(N), Space: O(N)

public static int[] bruteForceRotate(int[] arr, int k) {
    int n = arr.length;
    k = k % n;  // Handle k > n

    int[] result = new int[n];

    // Copy last k elements to front
    for (int i = 0; i < k; i++) {
        result[i] = arr[n - k + i];
    }

    // Copy remaining elements
    for (int i = k; i < n; i++) {
        result[i] = arr[i - k];
    }

    return result;
}
```

### ⚡ Optimized Approach:

```java
// APPROACH 2: Reversal Algorithm (In-place)
// Time: O(N), Space: O(1)

public static void optimizedRotate(int[] arr, int k) {
    int n = arr.length;
    k = k % n;

    // Reverse entire array
    reverse(arr, 0, n - 1);

    // Reverse first k elements
    reverse(arr, 0, k - 1);

    // Reverse remaining elements
    reverse(arr, k, n - 1);
}

public static void reverse(int[] arr, int start, int end) {
    while (start < end) {
        int temp = arr[start];
        arr[start] = arr[end];
        arr[end] = temp;
        start++;
        end--;
    }
}
```

### 📝 Common Logic Blocks:

```java
// BLOCK 1: Reverse entire array
public static void reverseArray(int[] arr) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

// BLOCK 2: Rotate left by K (opposite direction)
public static void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    k = k % n;

    reverse(arr, 0, k - 1);       // Reverse first k
    reverse(arr, k, n - 1);       // Reverse remaining
    reverse(arr, 0, n - 1);       // Reverse entire
}

// BLOCK 3: Rotate right by K (using reversal)
public static void rotateRight(int[] arr, int k) {
    int n = arr.length;
    k = k % n;

    reverse(arr, 0, n - 1);       // Reverse entire
    reverse(arr, 0, k - 1);       // Reverse first k
    reverse(arr, k, n - 1);       // Reverse remaining
}
```

---

## 📚 PATTERN 7: DUTCH NATIONAL FLAG (3-Way Partitioning)

### 🧠 How to Recognize:

- Sort array with only 3 distinct values (0, 1, 2)
- Separate elements into 3 categories
- Keywords: "sort 0s, 1s, 2s", "partition", "3 colors"

### 💭 Thought Process:

```
Step 1: Three regions
        [0s] [1s] [2s]

Step 2: Three pointers
        low: boundary of 0s
        mid: current element
        high: boundary of 2s

Step 3: Decision making
        arr[mid] == 0 → swap with low, move both
        arr[mid] == 1 → just move mid
        arr[mid] == 2 → swap with high, move only high
```

### 🎨 Visual Diagram:

```
Sort array: [1, 0, 2, 1, 0, 2, 1]

Initial state:
[1   0   2   1   0   2   1]
 ↑                       ↑
low                    high
 ↑
mid

Regions:
┌─────┬──────────┬─────┐
│ 0s  │   ?????  │ 2s  │
└─────┴──────────┴─────┘
  ↑       ↑         ↑
 low     mid      high

Step-by-step:
arr[mid]=1, keep: [1, 0, 2, 1, 0, 2, 1], mid++
arr[mid]=0, swap: [0, 1, 2, 1, 0, 2, 1], low++, mid++
arr[mid]=2, swap: [0, 1, 1, 1, 0, 2, 2], high--
arr[mid]=1, keep: [0, 1, 1, 1, 0, 2, 2], mid++
arr[mid]=1, keep: [0, 1, 1, 1, 0, 2, 2], mid++
arr[mid]=0, swap: [0, 0, 1, 1, 1, 2, 2], low++, mid++
Done! mid > high

Final: [0, 0, 1, 1, 1, 2, 2] ✓
```

### 🔧 Brute Force Approach:

```java
// APPROACH 1: Count and Rebuild
// Time: O(2N) = O(N), Space: O(1)

public static void bruteForceSort012(int[] arr) {
    int count0 = 0, count1 = 0, count2 = 0;

    // Count occurrences
    for (int num : arr) {
        if (num == 0) count0++;
        else if (num == 1) count1++;
        else count2++;
    }

    // Rebuild array
    int index = 0;
    while (count0-- > 0) arr[index++] = 0;
    while (count1-- > 0) arr[index++] = 1;
    while (count2-- > 0) arr[index++] = 2;
}
```

### ⚡ Optimized Approach:

```java
// APPROACH 2: Dutch National Flag (One Pass)
// Time: O(N), Space: O(1)

public static void dutchFlagSort(int[] arr) {
    int low = 0, mid = 0, high = arr.length - 1;

    while (mid <= high) {
        if (arr[mid] == 0) {
            // Swap with low region
            swap(arr, low, mid);
            low++;
            mid++;
        } else if (arr[mid] == 1) {
            // Already in correct region
            mid++;
        } else {  // arr[mid] == 2
            // Swap with high region
            swap(arr, mid, high);
            high--;
            // Don't increment mid (need to check swapped element)
        }
    }
}

public static void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
```

---

## 📚 PATTERN 8: KADANE'S ALGORITHM (Maximum Subarray Sum)

### 🧠 How to Recognize:

- Find "maximum sum" of contiguous subarray
- Can include negative numbers
- Keywords: "maximum subarray sum", "largest sum"

### 💭 Thought Process:

```
Step 1: At each position, decide:
        Continue current subarray OR start new subarray?

Step 2: If current sum < 0:
        Starting fresh is better

Step 3: Track maximum seen so far
```

### 🎨 Visual Diagram:

```
Array: [-2, 1, -3, 4, -1, 2, 1, -5, 4]

At each step: current_sum = max(arr[i], current_sum + arr[i])

Index 0: arr=-2
         current = -2, max = -2

Index 1: arr=1
         current = max(1, -2+1=-1) = 1
         max = max(-2, 1) = 1

Index 2: arr=-3
         current = max(-3, 1-3=-2) = -2
         max = 1

Index 3: arr=4
         current = max(4, -2+4=2) = 4
         max = max(1, 4) = 4

Index 4: arr=-1
         current = max(-1, 4-1=3) = 3
         max = 4

Index 5: arr=2
         current = max(2, 3+2=5) = 5
         max = max(4, 5) = 5

Index 6: arr=1
         current = max(1, 5+1=6) = 6
         max = max(5, 6) = 6 ✓

Best subarray: [4, -1, 2, 1] with sum = 6

Decision tree at each element:
        Current element
             |
    ┌────────┴────────┐
    |                 |
Start new        Continue old
subarray         subarray + current
```

### 🔧 Brute Force Approach:

```java
// APPROACH 1: Check All Subarrays
// Time: O(N²), Space: O(1)

public static int bruteForceMaxSum(int[] arr) {
    int n = arr.length;
    int maxSum = Integer.MIN_VALUE;

    for (int i = 0; i < n; i++) {
        int currentSum = 0;
        for (int j = i; j < n; j++) {
            currentSum += arr[j];
            maxSum = Math.max(maxSum, currentSum);
        }
    }

    return maxSum;
}
```

### ⚡ Optimized Approach:

```java
// APPROACH 2: Kadane's Algorithm
// Time: O(N), Space: O(1)

public static int kadaneMaxSum(int[] arr) {
    int currentSum = arr[0];
    int maxSum = arr[0];

    for (int i = 1; i < arr.length; i++) {
        // Either extend current subarray or start new
        currentSum = Math.max(arr[i], currentSum + arr[i]);

        // Update global maximum
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}

// Variant: Return the subarray itself
public static void kadaneWithIndices(int[] arr) {
    int currentSum = arr[0];
    int maxSum = arr[0];
    int start = 0, end = 0, tempStart = 0;

    for (int i = 1; i < arr.length; i++) {
        if (arr[i] > currentSum + arr[i]) {
            currentSum = arr[i];
            tempStart = i;  // New subarray starts here
        } else {
            currentSum = currentSum + arr[i];
        }

        if (currentSum > maxSum) {
            maxSum = currentSum;
            start = tempStart;
            end = i;
        }
    }

    System.out.println("Max sum: " + maxSum);
    System.out.println("Subarray: from index " + start + " to " + end);
}
```

---

## 📚 PATTERN 9: BINARY SEARCH ON ANSWER

### 🧠 How to Recognize:

- Answer lies in a range, need to find optimal value
- Can verify if a value works in O(N)
- Keywords: "minimum value such that", "maximum value such that"

### 💭 Thought Process:

```
Step 1: Define search space
        low = minimum possible answer
        high = maximum possible answer

Step 2: Binary search on answer space
        mid = candidate answer

Step 3: Check if mid works
        If yes: Try smaller (for minimum problems)
        If no: Try larger

Step 4: Converge to answer
```

### 🎨 Visual Diagram:

```
Problem: Find minimum capacity to ship packages in D days

Packages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], D = 5

Search space: [max(arr), sum(arr)] = [10, 55]

Step 1: mid = (10 + 55) / 2 = 32
        Can we ship in 5 days with capacity 32?
        Day 1: [1,2,3,4,5,6,7,8] = 36 > 32 → NO
        → Need larger capacity
        low = 33

Step 2: mid = (33 + 55) / 2 = 44
        Can we ship in 5 days with capacity 44?
        Yes! But can we do better?
        → Try smaller
        high = 44

... continue binary search ...

Visual:
[10 ......... 32 ......... 44 ......... 55]
 ↑           ↑             ↑             ↑
min     doesn't work    works!         max

Answer space:
[ Impossible | Possible Answer | Possible ]
             ↑
        Find leftmost possible
```

### 📝 Common Logic Block:

```java
// TEMPLATE: Binary Search on Answer
public static int binarySearchAnswer(int[] arr, int target) {
    int low = /* minimum possible answer */;
    int high = /* maximum possible answer */;
    int result = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (isPossible(arr, mid, target)) {
            result = mid;  // Found possible answer
            high = mid - 1;  // Try to minimize (for minimum problems)
        } else {
            low = mid + 1;  // Need larger value
        }
    }

    return result;
}

// Check if 'mid' is a valid answer
public static boolean isPossible(int[] arr, int capacity, int target) {
    // Problem-specific validation logic
    // Return true if this capacity works
    return true;
}
```

---

## 🎯 COMPREHENSIVE QUESTION BANK (50+ Problems)

### 🔷 LEVEL 1: BASIC ARRAY OPERATIONS (Foundation)

#### Q1.1: Find Second Largest Element

```
Input: [10, 20, 4, 45, 99]
Output: 45
Edge cases: All same, only one unique

Think: One pass, track max and secondMax
```

#### Q1.2: Remove Duplicates from Sorted Array

```
Input: [1, 1, 2, 2, 3, 4, 4]
Output: [1, 2, 3, 4]
Edge cases: All unique, all same

Think: Two pointers - slow and fast
```

#### Q1.3: Move Zeros to End

```
Input: [0, 1, 0, 3, 12]
Output: [1, 3, 12, 0, 0]
Edge cases: No zeros, all zeros

Think: Two pointers - swap non-zero with next zero position
```

#### Q1.4: Find Missing Number (1 to N)

```
Input: [1, 2, 4, 5, 6], N=6
Output: 3
Edge cases: Missing first, missing last

Think: Sum formula vs actual sum OR XOR trick
```

#### Q1.5: Check if Array is Sorted

```
Input: [1, 2, 3, 4, 5]
Output: true
Edge cases: Single element, all same

Think: One pass, compare adjacent elements
```

---

### 🔷 LEVEL 2: SLIDING WINDOW VARIATIONS

#### Q2.1: Maximum Sum of K Consecutive Elements

```
Input: [1, 4, 2, 10, 23, 3, 1, 0, 20], K=4
Output: 39
Think: Brute O(N×K) vs Sliding O(N)
```

#### Q2.2: Smallest Window with Sum >= S

```
Input: [2, 1, 5, 2, 3, 2], S=7
Output: 2 (subarray [5, 2])
Think: Variable size window, expand/contract
```

#### Q2.3: Longest Substring with K Unique Characters

```
Input: "aabacbebebe", K=3
Output: "cbebebe" (length 7)
Think: HashMap for frequency + sliding window
```

#### Q2.4: Count Subarrays with Sum K

```
Input: [1, 1, 1], K=2
Output: 2 (subarrays [1,1] and [1,1])
Think: Prefix sum + HashMap
```

#### Q2.5: First Negative in Every Window (Your Q2!)

```
Already solved! Practice variations:
- First positive
- Count negatives
- Last negative
```

---

### 🔷 LEVEL 3: TWO POINTERS MASTERY

#### Q3.1: Pair with Given Sum (Sorted Array)

```
Input: [1, 2, 3, 4, 6], target=6
Output: (2, 4)
Think: Left and right pointers
```

#### Q3.2: Three Sum Problem

```
Input: [-1, 0, 1, 2, -1, -4], target=0
Output: [[-1, -1, 2], [-1, 0, 1]]
Think: Fix one, use two pointers for remaining
```

#### Q3.3: Container with Most Water

```
Input: heights=[1,8,6,2,5,4,8,3,7]
Output: 49
Think: Two pointers, move shorter height
```

#### Q3.4: Remove Duplicates (Unsorted Array)

```
Input: [4, 2, 4, 1, 3, 2]
Output: [4, 2, 1, 3]
Think: HashSet for seen elements
```

#### Q3.5: Merge Two Sorted Arrays

```
Input: [1, 3, 5], [2, 4, 6]
Output: [1, 2, 3, 4, 5, 6]
Think: Two pointers, compare and copy
```

---

### 🔷 LEVEL 4: FREQUENCY & HASHING

#### Q4.1: First Non-Repeating Character

```
Input: "swiss"
Output: 'w'
Think: HashMap for frequency, then scan
```

#### Q4.2: Find All Pairs with Given Difference

```
Input: [1, 5, 3, 4, 2], diff=3
Output: [(1,4), (2,5)]
Think: HashSet for O(N) lookup
```

#### Q4.3: Longest Consecutive Sequence

```
Input: [100, 4, 200, 1, 3, 2]
Output: 4 (sequence [1, 2, 3, 4])
Think: HashSet + check start of sequence
```

#### Q4.4: Group Anagrams

```
Input: ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
Think: Sort each word as key, group in HashMap
```

#### Q4.5: Subarray with Zero Sum

```
Input: [4, 2, -3, 1, 6]
Output: true (subarray [2, -3, 1])
Think: Prefix sum + HashSet
```

---

### 🔷 LEVEL 5: PREFIX SUM & RANGE QUERIES

#### Q5.1: Range Sum Query (Multiple Queries)

```
Input: arr=[1, 3, 5, 7, 9], queries=[(0,2), (1,4)]
Output: [9, 24]
Think: Build prefix sum array once
```

#### Q5.2: Equilibrium Index (Sum left = Sum right)

```
Input: [-7, 1, 5, 2, -4, 3, 0]
Output: 3 (index 3)
Think: Total sum - left sum - arr[i] = left sum
```

#### Q5.3: Maximum Sum in Any Subarray (Kadane)

```
Input: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6 (subarray [4, -1, 2, 1])
Think: Kadane's algorithm
```

#### Q5.4: Product Array Except Self

```
Input: [1, 2, 3, 4]
Output: [24, 12, 8, 6]
Think: Prefix products × suffix products
```

#### Q5.5: Minimum Size Subarray with Sum >= K

```
Input: [2, 3, 1, 2, 4, 3], K=7
Output: 2 (subarray [4, 3])
Think: Sliding window with variable size
```

---

### 🔷 LEVEL 6: RECURSION & BACKTRACKING

#### Q6.1: Generate All Subsets (Power Set) - Solved!

```
Use your solution from Practice 6.2
```

#### Q6.2: N-Queens Problem

```
Input: N=4
Output: All valid board configurations
Think: Place queen, recurse, backtrack
```

#### Q6.3: Combination Sum (Target)

```
Input: arr=[2, 3, 6, 7], target=7
Output: [[2,2,3], [7]]
Think: Include current, recurse, backtrack
```

#### Q6.4: Permutations of String

```
Input: "ABC"
Output: ["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"]
Think: Fix first, permute rest
```

#### Q6.5: Sudoku Solver

```
Think: Try 1-9, check valid, recurse, backtrack
```

---

### 🔷 LEVEL 7: STRINGS & STRINGBUILDER

#### Q7.1: Reverse Words in String

```
Input: "the sky is blue"
Output: "blue is sky the"
Think: Split, reverse array, join
```

#### Q7.2: Longest Palindromic Substring

```
Input: "babad"
Output: "bab" or "aba"
Think: Expand around center
```

#### Q7.3: Check if Strings are Anagrams

```
Input: "listen", "silent"
Output: true
Think: Frequency count OR sort both
```

#### Q7.4: Remove Adjacent Duplicates

```
Input: "abbaca"
Output: "ca"
Think: Stack or StringBuilder
```

#### Q7.5: Longest Substring Without Repeating Characters

```
Input: "abcabcbb"
Output: 3 ("abc")
Think: Sliding window + HashSet
```

---

### 🔷 LEVEL 8: ADVANCED PATTERNS

#### Q8.1: Stock Buy and Sell (One Transaction)

```
Input: [7, 1, 5, 3, 6, 4]
Output: 5 (buy at 1, sell at 6)
Think: Track min price, max profit
```

#### Q8.2: Trapping Rain Water

```
Input: [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Think: For each position, min(leftMax, rightMax) - height
```

#### Q8.3: Longest Increasing Subsequence

```
Input: [10, 9, 2, 5, 3, 7, 101, 18]
Output: 4 ([2, 3, 7, 101])
Think: DP or Binary Search approach
```

#### Q8.4: Rotate Matrix 90 Degrees

```
Input: [[1,2,3],
        [4,5,6],
        [7,8,9]]
Output: [[7,4,1],
         [8,5,2],
         [9,6,3]]
Think: Transpose then reverse rows
```

#### Q8.5: Median of Two Sorted Arrays

```
Input: [1, 3], [2]
Output: 2.0
Think: Binary search on partition
```

---

## 🎯 HOW TO APPROACH ANY PROBLEM - THE FRAMEWORK

### Step 1: UNDERSTAND (2-3 minutes)

```
□ Read problem twice
□ Identify input format
□ Identify output format
□ List all constraints
□ Write down 2-3 examples
□ Identify edge cases
```

### Step 2: PATTERN MATCH (1-2 minutes)

```
□ Does it match sliding window?
□ Does it match two pointers?
□ Does it need frequency counting?
□ Does it involve recursion?
□ Check pattern recognition table
```

### Step 3: BRUTE FORCE FIRST (5-7 minutes)

```
□ Write simplest solution
□ Don't worry about optimization
□ Test with examples
□ Calculate time complexity
```

### Step 4: OPTIMIZE (3-5 minutes)

```
□ Can we eliminate inner loop?
□ Can we precompute something?
□ Can we use better data structure?
□ Can we reduce space?
```

### Step 5: CODE (10-15 minutes)

```
□ Write validation first
□ Use meaningful variable names
□ Add comments for tricky parts
□ Test with edge cases
```

### Step 6: VERIFY (2-3 minutes)

```
□ Dry run with example
□ Check boundary conditions
□ Verify time/space complexity
□ Test edge cases
```

---

## 🔄 PATTERN 10: RECURSION DEEP DIVE

### 🧠 What is Recursion?

**Definition:** A function that calls itself with a smaller/simpler problem until it reaches a base case.

**The Recursion Trinity:**

1. **Base Case** - When to stop (prevents infinite loop)
2. **Recursive Case** - How to break problem into smaller subproblem
3. **Assumption** - Trust that recursion solves smaller problem

### 🎨 Visual: Recursion Call Stack

```
Calculate factorial(5):

factorial(5)                    ← Initial call
    |
    ├─ 5 * factorial(4)
           |
           ├─ 4 * factorial(3)
                  |
                  ├─ 3 * factorial(2)
                         |
                         ├─ 2 * factorial(1)
                                |
                                └─ return 1  ← Base case

Unwinding (returning):
                                1
                         2 * 1 = 2
                  3 * 2 = 6
           4 * 6 = 24
    5 * 24 = 120

Answer: 120
```

### 📝 Recursion Template

```java
public static ReturnType recursiveFunction(parameters) {
    // BASE CASE(S) - When to stop
    if (/* base condition */) {
        return /* base value */;
    }

    // RECURSIVE CASE - Break into smaller problem
    // 1. Do some work (optional)
    // 2. Make recursive call with smaller input
    // 3. Do remaining work with result (optional)

    return recursiveFunction(/* smaller problem */);
}
```

---

## 📚 RECURSION PATTERN 1: LINEAR RECURSION (One Recursive Call)

### When to Use:

- Process array/list elements one by one
- Calculate sum, count, find element
- Single path of execution

### 🎨 Visual Pattern:

```
Array: [1, 2, 3, 4, 5]

process(arr, 0)
    ├─ process(arr, 1)
           ├─ process(arr, 2)
                  ├─ process(arr, 3)
                         ├─ process(arr, 4)
                                └─ BASE CASE

One path down, one path up
```

### Example 1: Sum of Array Elements

```java
// PROBLEM: Calculate sum of all elements in array

// APPROACH 1: Iterative (Brute Force)
// Time: O(N), Space: O(1)
public static int sumIterative(int[] arr) {
    int sum = 0;
    for (int num : arr) {
        sum += num;
    }
    return sum;
}

// APPROACH 2: Recursive (Linear Recursion)
// Time: O(N), Space: O(N) due to call stack
public static int sumRecursive(int[] arr, int index) {
    // BASE CASE: Reached end of array
    if (index == arr.length) {
        return 0;
    }

    // RECURSIVE CASE: Current element + sum of rest
    return arr[index] + sumRecursive(arr, index + 1);
}

// How it works:
// sum([1,2,3,4], 0) = 1 + sum([1,2,3,4], 1)
//                   = 1 + (2 + sum([1,2,3,4], 2))
//                   = 1 + (2 + (3 + sum([1,2,3,4], 3)))
//                   = 1 + (2 + (3 + (4 + sum([1,2,3,4], 4))))
//                   = 1 + (2 + (3 + (4 + 0)))
//                   = 10
```

### Example 2: Find Maximum in Array

```java
// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static int maxIterative(int[] arr) {
    int max = arr[0];
    for (int i = 1; i < arr.length; i++) {
        max = Math.max(max, arr[i]);
    }
    return max;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static int maxRecursive(int[] arr, int index) {
    // BASE CASE: Last element
    if (index == arr.length - 1) {
        return arr[index];
    }

    // RECURSIVE CASE: Max of current vs max of rest
    int maxOfRest = maxRecursive(arr, index + 1);
    return Math.max(arr[index], maxOfRest);
}

// Visual trace for [3, 1, 4, 1, 5]:
// max([3,1,4,1,5], 0) = max(3, max([3,1,4,1,5], 1))
//                     = max(3, max(1, max([3,1,4,1,5], 2)))
//                     = max(3, max(1, max(4, max([3,1,4,1,5], 3))))
//                     = max(3, max(1, max(4, max(1, 5))))
//                     = max(3, max(1, max(4, 5)))
//                     = max(3, max(1, 5))
//                     = max(3, 5)
//                     = 5
```

### Example 3: Check if Array is Sorted

```java
// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static boolean isSortedIterative(int[] arr) {
    for (int i = 0; i < arr.length - 1; i++) {
        if (arr[i] > arr[i + 1]) {
            return false;
        }
    }
    return true;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static boolean isSortedRecursive(int[] arr, int index) {
    // BASE CASE: Reached second-to-last element
    if (index == arr.length - 1) {
        return true;
    }

    // RECURSIVE CASE: Current pair sorted AND rest sorted
    if (arr[index] > arr[index + 1]) {
        return false;
    }

    return isSortedRecursive(arr, index + 1);
}
```

---

## 📚 RECURSION PATTERN 2: BINARY RECURSION (Two Recursive Calls)

### When to Use:

- Divide and conquer algorithms
- Binary tree traversals
- Merge sort, quick sort
- Two distinct subproblems

### 🎨 Visual Pattern:

```
                problem(arr, 0, 5)
                      /        \
          problem(0,2)          problem(3,5)
            /      \              /      \
       (0,1)      (2,2)       (3,4)    (5,5)
        / \                    / \
     (0,0)(1,1)             (3,3)(4,4)

Binary tree structure - two branches at each node
```

### Example 1: Merge Sort

```java
// PROBLEM: Sort array using merge sort

// APPROACH 1: Iterative (Complex, not recommended)
// Requires explicit stack management

// APPROACH 2: Recursive (Natural fit)
// Time: O(N log N), Space: O(N)

public static void mergeSort(int[] arr, int left, int right) {
    // BASE CASE: Single element (already sorted)
    if (left >= right) {
        return;
    }

    // RECURSIVE CASE:
    // 1. Divide array into two halves
    int mid = left + (right - left) / 2;

    // 2. Recursively sort both halves
    mergeSort(arr, left, mid);        // Left half
    mergeSort(arr, mid + 1, right);   // Right half

    // 3. Merge sorted halves
    merge(arr, left, mid, right);
}

public static void merge(int[] arr, int left, int mid, int right) {
    // Create temporary arrays
    int n1 = mid - left + 1;
    int n2 = right - mid;

    int[] leftArr = new int[n1];
    int[] rightArr = new int[n2];

    // Copy data
    for (int i = 0; i < n1; i++) {
        leftArr[i] = arr[left + i];
    }
    for (int j = 0; j < n2; j++) {
        rightArr[j] = arr[mid + 1 + j];
    }

    // Merge back
    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
        if (leftArr[i] <= rightArr[j]) {
            arr[k++] = leftArr[i++];
        } else {
            arr[k++] = rightArr[j++];
        }
    }

    // Copy remaining
    while (i < n1) arr[k++] = leftArr[i++];
    while (j < n2) arr[k++] = rightArr[j++];
}

// Visual trace for [3, 1, 4, 1, 5]:
//
//           [3, 1, 4, 1, 5]
//            /            \
//       [3, 1, 4]      [1, 5]
//        /     \         /   \
//     [3, 1]   [4]     [1]   [5]
//      /  \
//    [3]  [1]
//
// Merging:
//    [3]  [1] → [1, 3]
//  [1, 3] [4] → [1, 3, 4]
//    [1]  [5] → [1, 5]
// [1,3,4] [1,5] → [1, 1, 3, 4, 5]
```

### Example 2: Quick Sort

```java
// PROBLEM: Sort using quick sort (in-place)

// Time: O(N log N) average, O(N²) worst case
// Space: O(log N) for recursion stack

public static void quickSort(int[] arr, int low, int high) {
    // BASE CASE: Single element or invalid range
    if (low >= high) {
        return;
    }

    // RECURSIVE CASE:
    // 1. Partition array around pivot
    int pivotIndex = partition(arr, low, high);

    // 2. Recursively sort left and right partitions
    quickSort(arr, low, pivotIndex - 1);     // Left side
    quickSort(arr, pivotIndex + 1, high);    // Right side
}

public static int partition(int[] arr, int low, int high) {
    int pivot = arr[high];  // Choose last element as pivot
    int i = low - 1;        // Index of smaller element

    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            // Swap arr[i] and arr[j]
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

    // Place pivot in correct position
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    return i + 1;
}

// Visual for [3, 1, 4, 1, 5, 9, 2]:
// Pivot = 2 (last element)
// [1, 1, 2, 4, 5, 9, 3]
//        ↑ pivot now here
// Recurse left: [1, 1]
// Recurse right: [4, 5, 9, 3]
```

### Example 3: Binary Search (Recursive)

```java
// PROBLEM: Find element in sorted array

// APPROACH 1: Iterative
// Time: O(log N), Space: O(1)
public static int binarySearchIterative(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}

// APPROACH 2: Recursive
// Time: O(log N), Space: O(log N) for recursion stack
public static int binarySearchRecursive(int[] arr, int target, int left, int right) {
    // BASE CASE: Range invalid
    if (left > right) {
        return -1;
    }

    // Calculate middle
    int mid = left + (right - left) / 2;

    // BASE CASE: Found target
    if (arr[mid] == target) {
        return mid;
    }

    // RECURSIVE CASE: Search left or right half
    if (arr[mid] < target) {
        return binarySearchRecursive(arr, target, mid + 1, right);
    } else {
        return binarySearchRecursive(arr, target, left, mid - 1);
    }
}

// Visual for searching 7 in [1, 3, 5, 7, 9]:
//
// Call 1: search([1,3,5,7,9], 7, 0, 4)
//         mid=2, arr[2]=5 < 7, search right
//
// Call 2: search([1,3,5,7,9], 7, 3, 4)
//         mid=3, arr[3]=7 == 7, FOUND!
//         return 3
```

---

## 📚 RECURSION PATTERN 3: MULTIPLE RECURSION (Backtracking)

### When to Use:

- Generate all possibilities
- Combinatorial problems
- Decision tree exploration
- Include/exclude patterns

### 🎨 Visual Pattern:

```
Generate subsets of [1, 2, 3]:

                    []
                /        \
            [1]            []
           /   \          /   \
       [1,2]  [1]      [2]    []
        / \    / \     / \    / \
    [1,2,3][1,2][1,3][1][2,3][2][3][]

At each step: Include current OR Exclude current
```

### Example 1: Generate All Subsets

```java
// PROBLEM: Generate all subsets of array

// APPROACH 1: Iterative (Bit manipulation)
// Time: O(N × 2^N), Space: O(1) excluding output
public static void subsetsIterative(int[] arr) {
    int n = arr.length;
    int totalSubsets = 1 << n;  // 2^n

    for (int mask = 0; mask < totalSubsets; mask++) {
        System.out.print("[");
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) {
                System.out.print(arr[i] + " ");
            }
        }
        System.out.println("]");
    }
}

// APPROACH 2: Recursive (Backtracking)
// Time: O(N × 2^N), Space: O(N) for recursion
public static void subsetsRecursive(int[] arr, int index, ArrayList<Integer> current) {
    // BASE CASE: Processed all elements
    if (index == arr.length) {
        System.out.println(current);
        return;
    }

    // RECURSIVE CASE 1: Include current element
    current.add(arr[index]);
    subsetsRecursive(arr, index + 1, current);

    // BACKTRACK: Remove current element
    current.remove(current.size() - 1);

    // RECURSIVE CASE 2: Exclude current element
    subsetsRecursive(arr, index + 1, current);
}

// APPROACH 3: Recursive (Alternative style)
public static void subsetsAlternative(int[] arr, int index, ArrayList<Integer> current) {
    // Print current subset
    System.out.println(current);

    // Try adding each remaining element
    for (int i = index; i < arr.length; i++) {
        current.add(arr[i]);
        subsetsAlternative(arr, i + 1, current);
        current.remove(current.size() - 1);  // Backtrack
    }
}

// Trace for [1, 2]:
// subsetsRecursive([1,2], 0, [])
//   ├─ Include 1: subsetsRecursive([1,2], 1, [1])
//   │    ├─ Include 2: subsetsRecursive([1,2], 2, [1,2])
//   │    │                Print [1,2]
//   │    └─ Exclude 2: subsetsRecursive([1,2], 2, [1])
//   │                     Print [1]
//   └─ Exclude 1: subsetsRecursive([1,2], 1, [])
//        ├─ Include 2: subsetsRecursive([1,2], 2, [2])
//        │                Print [2]
//        └─ Exclude 2: subsetsRecursive([1,2], 2, [])
//                         Print []
```

### Example 2: Permutations

```java
// PROBLEM: Generate all permutations of array

// APPROACH 1: Recursive with swapping
// Time: O(N!), Space: O(N)
public static void permutations(int[] arr, int index) {
    // BASE CASE: Fixed all positions
    if (index == arr.length) {
        System.out.println(Arrays.toString(arr));
        return;
    }

    // Try each element in current position
    for (int i = index; i < arr.length; i++) {
        // Swap current with position
        swap(arr, index, i);

        // Recurse for next position
        permutations(arr, index + 1);

        // Backtrack
        swap(arr, index, i);
    }
}

// APPROACH 2: Recursive with boolean array
// Time: O(N!), Space: O(N)
public static void permutationsWithUsed(int[] arr, ArrayList<Integer> current, boolean[] used) {
    // BASE CASE: Used all elements
    if (current.size() == arr.length) {
        System.out.println(current);
        return;
    }

    // Try each unused element
    for (int i = 0; i < arr.length; i++) {
        if (!used[i]) {
            // Choose
            current.add(arr[i]);
            used[i] = true;

            // Explore
            permutationsWithUsed(arr, current, used);

            // Unchoose (backtrack)
            current.remove(current.size() - 1);
            used[i] = false;
        }
    }
}

// Trace for [1, 2, 3]:
// Level 0: Fix position 0
//   ├─ Choose 1: [1, _, _]
//   │    Level 1: Fix position 1
//   │    ├─ Choose 2: [1, 2, _]
//   │    │    Level 2: Choose 3: [1, 2, 3] ✓
//   │    └─ Choose 3: [1, 3, _]
//   │         Level 2: Choose 2: [1, 3, 2] ✓
//   ├─ Choose 2: [2, _, _]
//   │    ... (similar tree)
//   └─ Choose 3: [3, _, _]
//        ... (similar tree)
```

---

## 📚 RECURSION PATTERN 4: STRING RECURSION

### When to Use:

- String manipulation
- Subsequences, substrings
- Pattern matching

### Example 1: Reverse String

```java
// PROBLEM: Reverse a string

// APPROACH 1: Iterative (Two pointers)
// Time: O(N), Space: O(N) for char array
public static String reverseIterative(String str) {
    char[] chars = str.toCharArray();
    int left = 0, right = chars.length - 1;

    while (left < right) {
        char temp = chars[left];
        chars[left] = chars[right];
        chars[right] = temp;
        left++;
        right--;
    }

    return new String(chars);
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N) for recursion + new strings
public static String reverseRecursive(String str) {
    // BASE CASE: Empty or single character
    if (str.length() <= 1) {
        return str;
    }

    // RECURSIVE CASE: Last char + reverse of rest
    return str.charAt(str.length() - 1) + reverseRecursive(str.substring(0, str.length() - 1));
}

// Trace for "abc":
// reverseRecursive("abc") = 'c' + reverseRecursive("ab")
//                         = 'c' + ('b' + reverseRecursive("a"))
//                         = 'c' + ('b' + "a")
//                         = 'c' + "ba"
//                         = "cba"
```

### Example 2: Generate All Subsequences

```java
// PROBLEM: Print all subsequences of string

// APPROACH: Recursive (Include/Exclude)
// Time: O(2^N), Space: O(N)
public static void subsequences(String str, int index, String current) {
    // BASE CASE: Processed all characters
    if (index == str.length()) {
        System.out.println("\"" + current + "\"");
        return;
    }

    // RECURSIVE CASE 1: Include current character
    subsequences(str, index + 1, current + str.charAt(index));

    // RECURSIVE CASE 2: Exclude current character
    subsequences(str, index + 1, current);
}

// Trace for "abc":
//                      ""
//                  /        \
//              "a"            ""
//            /    \          /    \
//        "ab"    "a"      "b"     ""
//        / \     / \      / \     / \
//    "abc""ab""ac""a" "bc""b""c" ""

// Output: "abc", "ab", "ac", "a", "bc", "b", "c", ""
```

### Example 3: Check Palindrome

```java
// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static boolean isPalindromeIterative(String str) {
    int left = 0, right = str.length() - 1;

    while (left < right) {
        if (str.charAt(left) != str.charAt(right)) {
            return false;
        }
        left++;
        right--;
    }

    return true;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static boolean isPalindromeRecursive(String str, int left, int right) {
    // BASE CASE: Pointers crossed or met
    if (left >= right) {
        return true;
    }

    // RECURSIVE CASE: Check ends and middle
    if (str.charAt(left) != str.charAt(right)) {
        return false;
    }

    return isPalindromeRecursive(str, left + 1, right - 1);
}
```

---

## 🎯 50+ MORE PRACTICE PROBLEMS WITH MULTIPLE SOLUTIONS

### 🔷 LEVEL 9: RECURSION IN ARRAYS (10 Problems)

#### Problem 9.1: Count Occurrences of Element

```java
/**
 * Count how many times target appears in array
 * Input: [1, 2, 3, 2, 2, 5], target=2
 * Output: 3
 */

// APPROACH 1: Iterative (Brute Force)
// Time: O(N), Space: O(1)
public static int countIterative(int[] arr, int target) {
    int count = 0;
    for (int num : arr) {
        if (num == target) count++;
    }
    return count;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N) for recursion
public static int countRecursive(int[] arr, int target, int index) {
    if (index == arr.length) return 0;

    int currentCount = (arr[index] == target) ? 1 : 0;
    return currentCount + countRecursive(arr, target, index + 1);
}
```

#### Problem 9.2: First Index of Element

```java
/**
 * Find first occurrence of target
 * Input: [1, 2, 3, 2, 5], target=2
 * Output: 1
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static int firstIndexIterative(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static int firstIndexRecursive(int[] arr, int target, int index) {
    if (index == arr.length) return -1;
    if (arr[index] == target) return index;
    return firstIndexRecursive(arr, target, index + 1);
}
```

#### Problem 9.3: Last Index of Element

```java
/**
 * Find last occurrence of target
 * Input: [1, 2, 3, 2, 5], target=2
 * Output: 3
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static int lastIndexIterative(int[] arr, int target) {
    for (int i = arr.length - 1; i >= 0; i--) {
        if (arr[i] == target) return i;
    }
    return -1;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static int lastIndexRecursive(int[] arr, int target, int index) {
    if (index < 0) return -1;
    if (arr[index] == target) return index;
    return lastIndexRecursive(arr, target, index - 1);
}
```

#### Problem 9.4: All Indices of Element

```java
/**
 * Find all indices where target appears
 * Input: [1, 2, 3, 2, 5, 2], target=2
 * Output: [1, 3, 5]
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(K) where K=occurrences
public static ArrayList<Integer> allIndicesIterative(int[] arr, int target) {
    ArrayList<Integer> indices = new ArrayList<>();
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) {
            indices.add(i);
        }
    }
    return indices;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N + K)
public static void allIndicesRecursive(int[] arr, int target, int index, ArrayList<Integer> result) {
    if (index == arr.length) return;

    if (arr[index] == target) {
        result.add(index);
    }

    allIndicesRecursive(arr, target, index + 1, result);
}
```

#### Problem 9.5: Remove All Occurrences

```java
/**
 * Create new array without target element
 * Input: [1, 2, 3, 2, 5], target=2
 * Output: [1, 3, 5]
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(N)
public static int[] removeIterative(int[] arr, int target) {
    ArrayList<Integer> result = new ArrayList<>();
    for (int num : arr) {
        if (num != target) {
            result.add(num);
        }
    }

    int[] newArr = new int[result.size()];
    for (int i = 0; i < result.size(); i++) {
        newArr[i] = result.get(i);
    }
    return newArr;
}

// APPROACH 2: Recursive (Build new array)
// Time: O(N), Space: O(N)
public static void removeRecursive(int[] arr, int index, int target, ArrayList<Integer> result) {
    if (index == arr.length) return;

    if (arr[index] != target) {
        result.add(arr[index]);
    }

    removeRecursive(arr, index + 1, target, result);
}
```

#### Problem 9.6: Array Subset with Condition

```java
/**
 * Get all elements greater than X
 * Input: [1, 5, 3, 8, 2], X=3
 * Output: [5, 8]
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(K)
public static ArrayList<Integer> filterIterative(int[] arr, int threshold) {
    ArrayList<Integer> result = new ArrayList<>();
    for (int num : arr) {
        if (num > threshold) {
            result.add(num);
        }
    }
    return result;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N + K)
public static void filterRecursive(int[] arr, int index, int threshold, ArrayList<Integer> result) {
    if (index == arr.length) return;

    if (arr[index] > threshold) {
        result.add(arr[index]);
    }

    filterRecursive(arr, index + 1, threshold, result);
}
```

#### Problem 9.7: Product of Array Elements

```java
/**
 * Calculate product of all elements
 * Input: [1, 2, 3, 4]
 * Output: 24
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static long productIterative(int[] arr) {
    long product = 1;
    for (int num : arr) {
        product *= num;
    }
    return product;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static long productRecursive(int[] arr, int index) {
    if (index == arr.length) return 1;
    return arr[index] * productRecursive(arr, index + 1);
}
```

#### Problem 9.8: Check if All Elements Are Positive

```java
/**
 * Return true if all elements > 0
 * Input: [1, 2, 3, 4]
 * Output: true
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static boolean allPositiveIterative(int[] arr) {
    for (int num : arr) {
        if (num <= 0) return false;
    }
    return true;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static boolean allPositiveRecursive(int[] arr, int index) {
    if (index == arr.length) return true;
    if (arr[index] <= 0) return false;
    return allPositiveRecursive(arr, index + 1);
}
```

#### Problem 9.9: Find Minimum in Array

```java
/**
 * Find smallest element
 * Input: [3, 1, 4, 1, 5]
 * Output: 1
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static int minIterative(int[] arr) {
    int min = arr[0];
    for (int i = 1; i < arr.length; i++) {
        min = Math.min(min, arr[i]);
    }
    return min;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static int minRecursive(int[] arr, int index) {
    if (index == arr.length - 1) return arr[index];
    return Math.min(arr[index], minRecursive(arr, index + 1));
}
```

#### Problem 9.10: Pair Sum Recursively

```java
/**
 * Find if any two elements sum to target
 * Input: [2, 4, 1, 3], target=5
 * Output: true (2+3=5)
 */

// APPROACH 1: Iterative (Nested loop)
// Time: O(N²), Space: O(1)
public static boolean pairSumIterative(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        for (int j = i + 1; j < arr.length; j++) {
            if (arr[i] + arr[j] == target) {
                return true;
            }
        }
    }
    return false;
}

// APPROACH 2: Iterative (HashMap)
// Time: O(N), Space: O(N)
public static boolean pairSumOptimized(int[] arr, int target) {
    HashSet<Integer> seen = new HashSet<>();
    for (int num : arr) {
        if (seen.contains(target - num)) {
            return true;
        }
        seen.add(num);
    }
    return false;
}

// APPROACH 3: Recursive (Check all pairs)
// Time: O(N²), Space: O(N)
public static boolean pairSumRecursive(int[] arr, int i, int j, int target) {
    if (i >= arr.length - 1) return false;

    if (j >= arr.length) {
        return pairSumRecursive(arr, i + 1, i + 2, target);
    }

    if (arr[i] + arr[j] == target) return true;

    return pairSumRecursive(arr, i, j + 1, target);
}
```

---

### 🔷 LEVEL 10: RECURSION IN STRINGS (10 Problems)

#### Problem 10.1: Remove Character from String

```java
/**
 * Remove all occurrences of character
 * Input: "hello", ch='l'
 * Output: "heo"
 */

// APPROACH 1: Iterative (StringBuilder)
// Time: O(N), Space: O(N)
public static String removeCharIterative(String str, char ch) {
    StringBuilder sb = new StringBuilder();
    for (char c : str.toCharArray()) {
        if (c != ch) {
            sb.append(c);
        }
    }
    return sb.toString();
}

// APPROACH 2: Recursive
// Time: O(N²) due to string concatenation, Space: O(N)
public static String removeCharRecursive(String str, char ch) {
    if (str.isEmpty()) return "";

    char first = str.charAt(0);
    String rest = removeCharRecursive(str.substring(1), ch);

    if (first == ch) {
        return rest;
    } else {
        return first + rest;
    }
}

// APPROACH 3: Recursive (Optimized with StringBuilder)
// Time: O(N), Space: O(N)
public static void removeCharRecursiveOptimized(String str, int index, char ch, StringBuilder result) {
    if (index == str.length()) return;

    if (str.charAt(index) != ch) {
        result.append(str.charAt(index));
    }

    removeCharRecursiveOptimized(str, index + 1, ch, result);
}
```

#### Problem 10.2: Count Vowels

```java
/**
 * Count number of vowels in string
 * Input: "hello"
 * Output: 2 (e, o)
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static int countVowelsIterative(String str) {
    int count = 0;
    String vowels = "aeiouAEIOU";

    for (char c : str.toCharArray()) {
        if (vowels.indexOf(c) != -1) {
            count++;
        }
    }
    return count;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static int countVowelsRecursive(String str, int index) {
    if (index == str.length()) return 0;

    String vowels = "aeiouAEIOU";
    int current = (vowels.indexOf(str.charAt(index)) != -1) ? 1 : 0;

    return current + countVowelsRecursive(str, index + 1);
}
```

#### Problem 10.3: String Length (Without .length())

```java
/**
 * Calculate string length recursively
 * Input: "hello"
 * Output: 5
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static int lengthIterative(String str) {
    int count = 0;
    for (char c : str.toCharArray()) {
        count++;
    }
    return count;
}

// APPROACH 2: Recursive
// Time: O(N²) due to substring, Space: O(N)
public static int lengthRecursive(String str) {
    if (str.isEmpty()) return 0;
    return 1 + lengthRecursive(str.substring(1));
}
```

#### Problem 10.4: Replace Character

```java
/**
 * Replace all occurrences of char1 with char2
 * Input: "hello", 'l', 'x'
 * Output: "hexxo"
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(N)
public static String replaceIterative(String str, char from, char to) {
    StringBuilder sb = new StringBuilder();
    for (char c : str.toCharArray()) {
        if (c == from) {
            sb.append(to);
        } else {
            sb.append(c);
        }
    }
    return sb.toString();
}

// APPROACH 2: Recursive
// Time: O(N²), Space: O(N)
public static String replaceRecursive(String str, char from, char to) {
    if (str.isEmpty()) return "";

    char first = str.charAt(0);
    String rest = replaceRecursive(str.substring(1), from, to);

    if (first == from) {
        return to + rest;
    } else {
        return first + rest;
    }
}
```

#### Problem 10.5: Check if Substring Exists

```java
/**
 * Check if pattern exists in string
 * Input: "hello world", pattern="world"
 * Output: true
 */

// APPROACH 1: Built-in
// Time: O(N×M), Space: O(1)
public static boolean containsBuiltin(String str, String pattern) {
    return str.contains(pattern);
}

// APPROACH 2: Iterative
// Time: O(N×M), Space: O(1)
public static boolean containsIterative(String str, String pattern) {
    int n = str.length();
    int m = pattern.length();

    for (int i = 0; i <= n - m; i++) {
        boolean match = true;
        for (int j = 0; j < m; j++) {
            if (str.charAt(i + j) != pattern.charAt(j)) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }
    return false;
}

// APPROACH 3: Recursive
// Time: O(N×M), Space: O(N)
public static boolean containsRecursive(String str, String pattern, int index) {
    if (index > str.length() - pattern.length()) return false;

    // Check if pattern matches at current index
    boolean match = true;
    for (int i = 0; i < pattern.length(); i++) {
        if (str.charAt(index + i) != pattern.charAt(i)) {
            match = false;
            break;
        }
    }

    if (match) return true;
    return containsRecursive(str, pattern, index + 1);
}
```

#### Problem 10.6: Count Digits in String

```java
/**
 * Count number of digit characters
 * Input: "ab12c3"
 * Output: 3
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(1)
public static int countDigitsIterative(String str) {
    int count = 0;
    for (char c : str.toCharArray()) {
        if (Character.isDigit(c)) {
            count++;
        }
    }
    return count;
}

// APPROACH 2: Recursive
// Time: O(N), Space: O(N)
public static int countDigitsRecursive(String str, int index) {
    if (index == str.length()) return 0;

    int current = Character.isDigit(str.charAt(index)) ? 1 : 0;
    return current + countDigitsRecursive(str, index + 1);
}
```

#### Problem 10.7: Toggle Case

```java
/**
 * Convert uppercase to lowercase and vice versa
 * Input: "HeLLo"
 * Output: "hEllO"
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(N)
public static String toggleCaseIterative(String str) {
    StringBuilder sb = new StringBuilder();
    for (char c : str.toCharArray()) {
        if (Character.isUpperCase(c)) {
            sb.append(Character.toLowerCase(c));
        } else if (Character.isLowerCase(c)) {
            sb.append(Character.toUpperCase(c));
        } else {
            sb.append(c);
        }
    }
    return sb.toString();
}

// APPROACH 2: Recursive
// Time: O(N²), Space: O(N)
public static String toggleCaseRecursive(String str) {
    if (str.isEmpty()) return "";

    char first = str.charAt(0);
    char toggled;

    if (Character.isUpperCase(first)) {
        toggled = Character.toLowerCase(first);
    } else if (Character.isLowerCase(first)) {
        toggled = Character.toUpperCase(first);
    } else {
        toggled = first;
    }

    return toggled + toggleCaseRecursive(str.substring(1));
}
```

#### Problem 10.8: Remove Consecutive Duplicates

```java
/**
 * Remove consecutive duplicate characters
 * Input: "aabbccba"
 * Output: "abcba"
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(N)
public static String removeDuplicatesIterative(String str) {
    if (str.isEmpty()) return str;

    StringBuilder sb = new StringBuilder();
    sb.append(str.charAt(0));

    for (int i = 1; i < str.length(); i++) {
        if (str.charAt(i) != str.charAt(i - 1)) {
            sb.append(str.charAt(i));
        }
    }

    return sb.toString();
}

// APPROACH 2: Recursive
// Time: O(N²), Space: O(N)
public static String removeDuplicatesRecursive(String str) {
    if (str.length() <= 1) return str;

    if (str.charAt(0) == str.charAt(1)) {
        return removeDuplicatesRecursive(str.substring(1));
    } else {
        return str.charAt(0) + removeDuplicatesRecursive(str.substring(1));
    }
}
```

#### Problem 10.9: Move All 'x' to End

```java
/**
 * Move all 'x' characters to end
 * Input: "xaxbxc"
 * Output: "abcxxx"
 */

// APPROACH 1: Iterative (Two pass)
// Time: O(N), Space: O(N)
public static String moveXIterative(String str) {
    StringBuilder nonX = new StringBuilder();
    int xCount = 0;

    for (char c : str.toCharArray()) {
        if (c == 'x') {
            xCount++;
        } else {
            nonX.append(c);
        }
    }

    for (int i = 0; i < xCount; i++) {
        nonX.append('x');
    }

    return nonX.toString();
}

// APPROACH 2: Recursive
// Time: O(N²), Space: O(N)
public static String moveXRecursive(String str) {
    if (str.isEmpty()) return "";

    char first = str.charAt(0);
    String rest = moveXRecursive(str.substring(1));

    if (first == 'x') {
        return rest + 'x';
    } else {
        return first + rest;
    }
}
```

#### Problem 10.10: String Compression

```java
/**
 * Compress consecutive characters with count
 * Input: "aaabbcccc"
 * Output: "a3b2c4"
 */

// APPROACH 1: Iterative
// Time: O(N), Space: O(N)
public static String compressIterative(String str) {
    if (str.isEmpty()) return str;

    StringBuilder sb = new StringBuilder();
    int count = 1;

    for (int i = 1; i < str.length(); i++) {
        if (str.charAt(i) == str.charAt(i - 1)) {
            count++;
        } else {
            sb.append(str.charAt(i - 1));
            if (count > 1) sb.append(count);
            count = 1;
        }
    }

    // Last group
    sb.append(str.charAt(str.length() - 1));
    if (count > 1) sb.append(count);

    return sb.toString();
}

// APPROACH 2: Recursive
// Time: O(N²), Space: O(N)
public static String compressRecursive(String str, int index, char lastChar, int count) {
    if (index == str.length()) {
        return count > 1 ? lastChar + String.valueOf(count) : String.valueOf(lastChar);
    }

    if (str.charAt(index) == lastChar) {
        return compressRecursive(str, index + 1, lastChar, count + 1);
    } else {
        String compressed = (count > 1) ? lastChar + String.valueOf(count) : String.valueOf(lastChar);
        return compressed + compressRecursive(str, index + 1, str.charAt(index), 1);
    }
}
```

---

### 🔷 LEVEL 11: BACKTRACKING PROBLEMS (10 Problems)

#### Problem 11.1: Generate All Binary Strings of Length N

```java
/**
 * Generate all binary strings of length N
 * Input: N=3
 * Output: "000", "001", "010", "011", "100", "101", "110", "111"
 */

// APPROACH 1: Iterative (Bit manipulation)
// Time: O(N × 2^N), Space: O(1) excluding output
public static void binaryStringsIterative(int n) {
    int total = 1 << n;  // 2^n
    for (int i = 0; i < total; i++) {
        for (int j = n - 1; j >= 0; j--) {
            System.out.print((i & (1 << j)) != 0 ? '1' : '0');
        }
        System.out.println();
    }
}

// APPROACH 2: Recursive (Backtracking)
// Time: O(N × 2^N), Space: O(N)
public static void binaryStringsRecursive(int n, String current) {
    // BASE CASE: Built string of length n
    if (current.length() == n) {
        System.out.println(current);
        return;
    }

    // RECURSIVE CASE: Try 0 and 1
    binaryStringsRecursive(n, current + "0");
    binaryStringsRecursive(n, current + "1");
}

// Visual trace for N=2:
//                    ""
//                 /      \
//              "0"        "1"
//             /   \       /   \
//          "00" "01"   "10" "11"
```

#### Problem 11.2: Generate Parentheses Combinations

```java
/**
 * Generate all valid combinations of N pairs of parentheses
 * Input: N=2
 * Output: "(())", "()()"
 */

// APPROACH: Backtracking with constraints
// Time: O(4^N / √N) - Catalan number, Space: O(N)
public static void generateParentheses(int n, String current, int open, int close) {
    // BASE CASE: Used all parentheses
    if (current.length() == 2 * n) {
        System.out.println(current);
        return;
    }

    // RECURSIVE CASE 1: Add open parenthesis (if available)
    if (open < n) {
        generateParentheses(n, current + "(", open + 1, close);
    }

    // RECURSIVE CASE 2: Add close parenthesis (if valid)
    if (close < open) {
        generateParentheses(n, current + ")", open, close + 1);
    }
}

// Visual trace for N=2:
//                      ("", 0, 0)
//                          |
//                      ("(", 1, 0)
//                      /         \
//              ("((", 2, 0)    ("()", 1, 1)
//                  |               |
//              ("(()", 2, 1)   ("()(", 2, 1)
//                  |               |
//              ("(())", 2, 2)  ("()()", 2, 2)
//              Output: "(())"  Output: "()()"
```

#### Problem 11.3: Letter Combinations of Phone Number

```java
/**
 * Generate all letter combinations for phone digits
 * Input: "23"
 * Output: "ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"
 *
 * Mapping: 2->abc, 3->def, 4->ghi, 5->jkl, 6->mno, 7->pqrs, 8->tuv, 9->wxyz
 */

// APPROACH 1: Iterative (Queue-based)
// Time: O(4^N), Space: O(4^N)
public static List<String> letterCombinationsIterative(String digits) {
    if (digits.isEmpty()) return new ArrayList<>();

    String[] mapping = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    Queue<String> queue = new LinkedList<>();
    queue.offer("");

    for (char digit : digits.toCharArray()) {
        String letters = mapping[digit - '0'];
        int size = queue.size();

        for (int i = 0; i < size; i++) {
            String current = queue.poll();
            for (char letter : letters.toCharArray()) {
                queue.offer(current + letter);
            }
        }
    }

    return new ArrayList<>(queue);
}

// APPROACH 2: Recursive (Backtracking)
// Time: O(4^N), Space: O(N)
public static void letterCombinationsRecursive(String digits, int index, String current,
                                               String[] mapping, List<String> result) {
    // BASE CASE: Processed all digits
    if (index == digits.length()) {
        result.add(current);
        return;
    }

    // Get letters for current digit
    String letters = mapping[digits.charAt(index) - '0'];

    // Try each letter
    for (char letter : letters.toCharArray()) {
        letterCombinationsRecursive(digits, index + 1, current + letter, mapping, result);
    }
}

// Visual for "23":
//                      ("", 0)
//                   /    |    \
//              ("a",1)("b",1)("c",1)
//              / | \   / | \   / | \
//           "ad""ae""af""bd""be""bf""cd""ce""cf"
```

#### Problem 11.4: Combination Sum

```java
/**
 * Find all combinations that sum to target (elements can be reused)
 * Input: [2, 3, 6, 7], target=7
 * Output: [[2,2,3], [7]]
 */

// APPROACH 1: Iterative (Complex with stack)
// APPROACH 2: Recursive (Backtracking) - Natural fit
// Time: O(N^(T/M)) where T=target, M=min element, Space: O(T/M)
public static void combinationSum(int[] candidates, int target, int index,
                                  List<Integer> current, List<List<Integer>> result) {
    // BASE CASE: Target reached
    if (target == 0) {
        result.add(new ArrayList<>(current));
        return;
    }

    // BASE CASE: Exceeded target or no more candidates
    if (target < 0 || index == candidates.length) {
        return;
    }

    // RECURSIVE CASE 1: Include current element (can use again)
    current.add(candidates[index]);
    combinationSum(candidates, target - candidates[index], index, current, result);
    current.remove(current.size() - 1);  // Backtrack

    // RECURSIVE CASE 2: Skip current element
    combinationSum(candidates, target, index + 1, current, result);
}

// APPROACH 3: Alternative (Try each element at each position)
public static void combinationSumAlt(int[] candidates, int target, int start,
                                     List<Integer> current, List<List<Integer>> result) {
    if (target == 0) {
        result.add(new ArrayList<>(current));
        return;
    }

    if (target < 0) return;

    for (int i = start; i < candidates.length; i++) {
        current.add(candidates[i]);
        // Same index 'i' allows reuse
        combinationSumAlt(candidates, target - candidates[i], i, current, result);
        current.remove(current.size() - 1);
    }
}
```

#### Problem 11.5: N-Queens Problem (Simplified: Count Solutions)

```java
/**
 * Count number of ways to place N queens on N×N board
 * Input: N=4
 * Output: 2
 */

// APPROACH: Backtracking with constraint checking
// Time: O(N!), Space: O(N)
public static int nQueens(int n) {
    boolean[] cols = new boolean[n];
    boolean[] diag1 = new boolean[2 * n - 1];  // r-c diagonal
    boolean[] diag2 = new boolean[2 * n - 1];  // r+c diagonal

    return solve(0, n, cols, diag1, diag2);
}

private static int solve(int row, int n, boolean[] cols, boolean[] diag1, boolean[] diag2) {
    // BASE CASE: Placed all queens
    if (row == n) {
        return 1;
    }

    int count = 0;

    // Try placing queen in each column
    for (int col = 0; col < n; col++) {
        int d1 = row - col + n - 1;
        int d2 = row + col;

        // Check if position is safe
        if (!cols[col] && !diag1[d1] && !diag2[d2]) {
            // Place queen
            cols[col] = true;
            diag1[d1] = true;
            diag2[d2] = true;

            // Recurse to next row
            count += solve(row + 1, n, cols, diag1, diag2);

            // Backtrack
            cols[col] = false;
            diag1[d1] = false;
            diag2[d2] = false;
        }
    }

    return count;
}

// Visual for N=4:
// Solution 1:    Solution 2:
// . Q . .        . . Q .
// . . . Q        Q . . .
// Q . . .        . . . Q
// . . Q .        . Q . .
```

#### Problem 11.6: Word Search in Grid

```java
/**
 * Check if word exists in 2D character grid (can move up/down/left/right)
 * Input:
 * board = [
 *   ['A','B','C','E'],
 *   ['S','F','C','S'],
 *   ['A','D','E','E']
 * ]
 * word = "ABCCED"
 * Output: true
 */

// APPROACH: Backtracking with DFS
// Time: O(N×M×4^L) where L=word length, Space: O(L)
public static boolean wordSearch(char[][] board, String word) {
    int rows = board.length;
    int cols = board[0].length;

    // Try starting from each cell
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (dfs(board, word, i, j, 0)) {
                return true;
            }
        }
    }

    return false;
}

private static boolean dfs(char[][] board, String word, int row, int col, int index) {
    // BASE CASE: Found all characters
    if (index == word.length()) {
        return true;
    }

    // Check boundaries and character match
    if (row < 0 || row >= board.length || col < 0 || col >= board[0].length ||
        board[row][col] != word.charAt(index)) {
        return false;
    }

    // Mark as visited
    char temp = board[row][col];
    board[row][col] = '#';

    // Try all 4 directions
    boolean found = dfs(board, word, row + 1, col, index + 1) ||
                    dfs(board, word, row - 1, col, index + 1) ||
                    dfs(board, word, row, col + 1, index + 1) ||
                    dfs(board, word, row, col - 1, index + 1);

    // Backtrack
    board[row][col] = temp;

    return found;
}
```

#### Problem 11.7: Rat in a Maze

```java
/**
 * Find path from (0,0) to (N-1,N-1) in maze
 * Input: maze = [
 *   [1, 0, 0, 0],
 *   [1, 1, 0, 1],
 *   [0, 1, 0, 0],
 *   [1, 1, 1, 1]
 * ]
 * (1 = path, 0 = wall)
 * Output: Path exists: Down, Down, Right, Right, Right
 */

// APPROACH: Backtracking
// Time: O(2^(N²)), Space: O(N²)
public static boolean ratInMaze(int[][] maze, int row, int col, boolean[][] visited, String path) {
    int n = maze.length;

    // BASE CASE: Reached destination
    if (row == n - 1 && col == n - 1) {
        System.out.println("Path: " + path);
        return true;
    }

    // Check boundaries and validity
    if (row < 0 || row >= n || col < 0 || col >= n ||
        maze[row][col] == 0 || visited[row][col]) {
        return false;
    }

    // Mark as visited
    visited[row][col] = true;

    // Try all 4 directions
    if (ratInMaze(maze, row + 1, col, visited, path + "Down ") ||
        ratInMaze(maze, row - 1, col, visited, path + "Up ") ||
        ratInMaze(maze, row, col + 1, visited, path + "Right ") ||
        ratInMaze(maze, row, col - 1, visited, path + "Left ")) {
        return true;
    }

    // Backtrack
    visited[row][col] = false;
    return false;
}
```

#### Problem 11.8: Sudoku Solver

```java
/**
 * Solve 9×9 Sudoku puzzle
 */

// APPROACH: Backtracking
// Time: O(9^(N²)) where N=empty cells, Space: O(N²)
public static boolean solveSudoku(int[][] board) {
    for (int row = 0; row < 9; row++) {
        for (int col = 0; col < 9; col++) {
            // Find empty cell
            if (board[row][col] == 0) {
                // Try digits 1-9
                for (int num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        // Place digit
                        board[row][col] = num;

                        // Recurse
                        if (solveSudoku(board)) {
                            return true;
                        }

                        // Backtrack
                        board[row][col] = 0;
                    }
                }

                // No valid digit found
                return false;
            }
        }
    }

    // All cells filled
    return true;
}

private static boolean isValid(int[][] board, int row, int col, int num) {
    // Check row
    for (int c = 0; c < 9; c++) {
        if (board[row][c] == num) return false;
    }

    // Check column
    for (int r = 0; r < 9; r++) {
        if (board[r][col] == num) return false;
    }

    // Check 3×3 box
    int boxRow = (row / 3) * 3;
    int boxCol = (col / 3) * 3;
    for (int r = boxRow; r < boxRow + 3; r++) {
        for (int c = boxCol; c < boxCol + 3; c++) {
            if (board[r][c] == num) return false;
        }
    }

    return true;
}
```

#### Problem 11.9: Subset Sum Problem

```java
/**
 * Check if subset with given sum exists
 * Input: [3, 34, 4, 12, 5, 2], sum=9
 * Output: true (4+5=9)
 */

// APPROACH 1: Recursive (Brute Force)
// Time: O(2^N), Space: O(N)
public static boolean subsetSumRecursive(int[] arr, int index, int targetSum) {
    // BASE CASE: Sum reached
    if (targetSum == 0) return true;

    // BASE CASE: Exceeded or no elements left
    if (index == arr.length || targetSum < 0) return false;

    // RECURSIVE CASE: Include or exclude current element
    return subsetSumRecursive(arr, index + 1, targetSum - arr[index]) ||
           subsetSumRecursive(arr, index + 1, targetSum);
}

// APPROACH 2: Dynamic Programming
// Time: O(N×Sum), Space: O(N×Sum)
public static boolean subsetSumDP(int[] arr, int targetSum) {
    int n = arr.length;
    boolean[][] dp = new boolean[n + 1][targetSum + 1];

    // Base case: sum 0 is always possible
    for (int i = 0; i <= n; i++) {
        dp[i][0] = true;
    }

    // Fill table
    for (int i = 1; i <= n; i++) {
        for (int sum = 1; sum <= targetSum; sum++) {
            // Exclude current element
            dp[i][sum] = dp[i - 1][sum];

            // Include if possible
            if (sum >= arr[i - 1]) {
                dp[i][sum] = dp[i][sum] || dp[i - 1][sum - arr[i - 1]];
            }
        }
    }

    return dp[n][targetSum];
}

// APPROACH 3: Dynamic Programming (Space Optimized)
// Time: O(N×Sum), Space: O(Sum)
public static boolean subsetSumOptimized(int[] arr, int targetSum) {
    boolean[] dp = new boolean[targetSum + 1];
    dp[0] = true;

    for (int num : arr) {
        // Traverse from right to left to avoid using same element twice
        for (int sum = targetSum; sum >= num; sum--) {
            dp[sum] = dp[sum] || dp[sum - num];
        }
    }

    return dp[targetSum];
}
```

#### Problem 11.10: Knight's Tour

```java
/**
 * Find if knight can visit all squares on N×N chessboard exactly once
 * Input: N=5, start=(0,0)
 * Output: Path exists (show board with move numbers)
 */

// APPROACH: Backtracking
// Time: O(8^(N²)), Space: O(N²)
public static boolean knightTour(int n, int row, int col, int[][] board, int moveCount) {
    // BASE CASE: Visited all squares
    if (moveCount == n * n) {
        return true;
    }

    // Knight moves: 8 possible directions
    int[] rowMoves = {-2, -2, -1, -1, 1, 1, 2, 2};
    int[] colMoves = {-1, 1, -2, 2, -2, 2, -1, 1};

    // Try all 8 moves
    for (int i = 0; i < 8; i++) {
        int newRow = row + rowMoves[i];
        int newCol = col + colMoves[i];

        // Check validity
        if (isValidMove(newRow, newCol, n, board)) {
            // Make move
            board[newRow][newCol] = moveCount;

            // Recurse
            if (knightTour(n, newRow, newCol, board, moveCount + 1)) {
                return true;
            }

            // Backtrack
            board[newRow][newCol] = -1;
        }
    }

    return false;
}

private static boolean isValidMove(int row, int col, int n, int[][] board) {
    return row >= 0 && row < n && col >= 0 && col < n && board[row][col] == -1;
}
```

---

### 🔷 LEVEL 12: DIVIDE AND CONQUER (10 Problems)

#### Problem 12.1: Find Peak Element

```java
/**
 * Find a peak element (element greater than neighbors)
 * Input: [1, 3, 20, 4, 1, 0]
 * Output: 20 (index 2)
 */

// APPROACH 1: Linear Scan (Brute Force)
// Time: O(N), Space: O(1)
public static int findPeakLinear(int[] arr) {
    int n = arr.length;

    // Check first element
    if (n == 1 || arr[0] > arr[1]) return 0;

    // Check last element
    if (arr[n - 1] > arr[n - 2]) return n - 1;

    // Check middle elements
    for (int i = 1; i < n - 1; i++) {
        if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1]) {
            return i;
        }
    }

    return -1;
}

// APPROACH 2: Binary Search (Divide and Conquer)
// Time: O(log N), Space: O(1)
public static int findPeakBinarySearch(int[] arr) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] < arr[mid + 1]) {
            // Peak is on right side
            left = mid + 1;
        } else {
            // Peak is on left side (or mid itself)
            right = mid;
        }
    }

    return left;
}

// APPROACH 3: Recursive (Divide and Conquer)
// Time: O(log N), Space: O(log N)
public static int findPeakRecursive(int[] arr, int left, int right) {
    if (left == right) return left;

    int mid = left + (right - left) / 2;

    if (arr[mid] < arr[mid + 1]) {
        return findPeakRecursive(arr, mid + 1, right);
    } else {
        return findPeakRecursive(arr, left, mid);
    }
}
```

#### Problem 12.2: Count Inversions

```java
/**
 * Count pairs (i, j) where i < j and arr[i] > arr[j]
 * Input: [2, 4, 1, 3, 5]
 * Output: 3 (pairs: (2,1), (4,1), (4,3))
 */

// APPROACH 1: Brute Force (Nested loops)
// Time: O(N²), Space: O(1)
public static int countInversionsBrute(int[] arr) {
    int count = 0;
    int n = arr.length;

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (arr[i] > arr[j]) {
                count++;
            }
        }
    }

    return count;
}

// APPROACH 2: Merge Sort (Divide and Conquer)
// Time: O(N log N), Space: O(N)
public static int countInversionsMergeSort(int[] arr) {
    int[] temp = new int[arr.length];
    return mergeSort(arr, temp, 0, arr.length - 1);
}

private static int mergeSort(int[] arr, int[] temp, int left, int right) {
    int count = 0;

    if (left < right) {
        int mid = left + (right - left) / 2;

        // Count inversions in left half
        count += mergeSort(arr, temp, left, mid);

        // Count inversions in right half
        count += mergeSort(arr, temp, mid + 1, right);

        // Count inversions during merge
        count += merge(arr, temp, left, mid, right);
    }

    return count;
}

private static int merge(int[] arr, int[] temp, int left, int mid, int right) {
    int i = left, j = mid + 1, k = left;
    int count = 0;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
            // All remaining elements in left half form inversions with arr[j-1]
            count += (mid - i + 1);
        }
    }

    // Copy remaining elements
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];

    // Copy back to original array
    for (i = left; i <= right; i++) {
        arr[i] = temp[i];
    }

    return count;
}
```

#### Problem 12.3: Majority Element (Boyer-Moore)

```java
/**
 * Find element that appears more than N/2 times
 * Input: [3, 3, 4, 2, 4, 4, 2, 4, 4]
 * Output: 4
 */

// APPROACH 1: Brute Force
// Time: O(N²), Space: O(1)
public static int majorityBrute(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n; i++) {
        int count = 0;
        for (int j = 0; j < n; j++) {
            if (arr[j] == arr[i]) {
                count++;
            }
        }
        if (count > n / 2) {
            return arr[i];
        }
    }

    return -1;
}

// APPROACH 2: HashMap
// Time: O(N), Space: O(N)
public static int majorityHashMap(int[] arr) {
    HashMap<Integer, Integer> map = new HashMap<>();
    int n = arr.length;

    for (int num : arr) {
        map.put(num, map.getOrDefault(num, 0) + 1);
        if (map.get(num) > n / 2) {
            return num;
        }
    }

    return -1;
}

// APPROACH 3: Boyer-Moore Voting Algorithm (Divide and Conquer idea)
// Time: O(N), Space: O(1)
public static int majorityBoyerMoore(int[] arr) {
    // Phase 1: Find candidate
    int candidate = arr[0];
    int count = 1;

    for (int i = 1; i < arr.length; i++) {
        if (count == 0) {
            candidate = arr[i];
            count = 1;
        } else if (arr[i] == candidate) {
            count++;
        } else {
            count--;
        }
    }

    // Phase 2: Verify candidate
    count = 0;
    for (int num : arr) {
        if (num == candidate) count++;
    }

    return (count > arr.length / 2) ? candidate : -1;
}

// Visual explanation for Boyer-Moore [3,3,4,2,4,4,2,4,4]:
// candidate=3, count=1
// candidate=3, count=2  (another 3)
// candidate=3, count=1  (4 cancels one 3)
// candidate=3, count=0  (2 cancels last 3)
// candidate=4, count=1  (new candidate)
// candidate=4, count=2  (another 4)
// candidate=4, count=1  (2 cancels one 4)
// candidate=4, count=2  (another 4)
// candidate=4, count=3  (another 4)
// Final candidate: 4, verify count: 5 > 9/2 ✓
```

#### Problem 12.4: Closest Pair of Points (1D)

```java
/**
 * Find two points with minimum distance
 * Input: [1, 3, 7, 10, 15, 20]
 * Output: (1, 3) with distance 2
 */

// APPROACH 1: Brute Force
// Time: O(N²), Space: O(1)
public static int[] closestPairBrute(int[] arr) {
    int minDist = Integer.MAX_VALUE;
    int[] result = new int[2];

    for (int i = 0; i < arr.length; i++) {
        for (int j = i + 1; j < arr.length; j++) {
            int dist = Math.abs(arr[i] - arr[j]);
            if (dist < minDist) {
                minDist = dist;
                result[0] = arr[i];
                result[1] = arr[j];
            }
        }
    }

    return result;
}

// APPROACH 2: Sorting (Semi-optimized)
// Time: O(N log N), Space: O(1)
public static int[] closestPairSorted(int[] arr) {
    Arrays.sort(arr);

    int minDist = Integer.MAX_VALUE;
    int[] result = new int[2];

    // Check adjacent elements only
    for (int i = 0; i < arr.length - 1; i++) {
        int dist = arr[i + 1] - arr[i];
        if (dist < minDist) {
            minDist = dist;
            result[0] = arr[i];
            result[1] = arr[i + 1];
        }
    }

    return result;
}

// Why sorting works: After sorting, closest points must be adjacent!
```

#### Problem 12.5: Maximum Subarray Sum (Kadane's Algorithm)

```java
/**
 * Find maximum sum of contiguous subarray
 * Input: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
 * Output: 6 (subarray [4, -1, 2, 1])
 */

// APPROACH 1: Brute Force
// Time: O(N³), Space: O(1)
public static int maxSubarrayBrute(int[] arr) {
    int maxSum = Integer.MIN_VALUE;
    int n = arr.length;

    for (int i = 0; i < n; i++) {
        for (int j = i; j < n; j++) {
            int sum = 0;
            for (int k = i; k <= j; k++) {
                sum += arr[k];
            }
            maxSum = Math.max(maxSum, sum);
        }
    }

    return maxSum;
}

// APPROACH 2: Semi-Optimized
// Time: O(N²), Space: O(1)
public static int maxSubarraySemiOpt(int[] arr) {
    int maxSum = Integer.MIN_VALUE;
    int n = arr.length;

    for (int i = 0; i < n; i++) {
        int sum = 0;
        for (int j = i; j < n; j++) {
            sum += arr[j];
            maxSum = Math.max(maxSum, sum);
        }
    }

    return maxSum;
}

// APPROACH 3: Kadane's Algorithm (Optimal)
// Time: O(N), Space: O(1)
public static int maxSubarrayKadane(int[] arr) {
    int maxSoFar = arr[0];
    int maxEndingHere = arr[0];

    for (int i = 1; i < arr.length; i++) {
        // Either extend existing subarray or start new one
        maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }

    return maxSoFar;
}

// Visual trace for [-2, 1, -3, 4, -1, 2, 1, -5, 4]:
// i=0: maxEndingHere=-2, maxSoFar=-2
// i=1: maxEndingHere=1 (start fresh), maxSoFar=1
// i=2: maxEndingHere=-2, maxSoFar=1
// i=3: maxEndingHere=4 (start fresh), maxSoFar=4
// i=4: maxEndingHere=3, maxSoFar=4
// i=5: maxEndingHere=5, maxSoFar=5
// i=6: maxEndingHere=6, maxSoFar=6
// i=7: maxEndingHere=1, maxSoFar=6
// i=8: maxEndingHere=5, maxSoFar=6
// Result: 6
```

#### Problem 12.6: Pow(x, n) - Fast Exponentiation

```java
/**
 * Calculate x^n efficiently
 * Input: x=2, n=10
 * Output: 1024
 */

// APPROACH 1: Iterative (Brute Force)
// Time: O(N), Space: O(1)
public static double powIterative(double x, int n) {
    long N = n;  // Handle negative n
    if (N < 0) {
        x = 1 / x;
        N = -N;
    }

    double result = 1;
    for (long i = 0; i < N; i++) {
        result *= x;
    }

    return result;
}

// APPROACH 2: Recursive (Divide and Conquer)
// Time: O(log N), Space: O(log N)
public static double powRecursive(double x, int n) {
    long N = n;
    if (N < 0) {
        x = 1 / x;
        N = -N;
    }

    return powerHelper(x, N);
}

private static double powerHelper(double x, long n) {
    // BASE CASE
    if (n == 0) return 1;

    // RECURSIVE CASE: Divide and conquer
    double half = powerHelper(x, n / 2);

    if (n % 2 == 0) {
        return half * half;
    } else {
        return half * half * x;
    }
}

// APPROACH 3: Iterative (Binary Exponentiation)
// Time: O(log N), Space: O(1)
public static double powBinaryExp(double x, int n) {
    long N = n;
    if (N < 0) {
        x = 1 / x;
        N = -N;
    }

    double result = 1;
    double currentProduct = x;

    while (N > 0) {
        if (N % 2 == 1) {
            result *= currentProduct;
        }
        currentProduct *= currentProduct;
        N /= 2;
    }

    return result;
}

// Visual for pow(2, 10):
// 2^10 = (2^5)^2
// 2^5 = 2 × (2^2)^2
// 2^2 = (2^1)^2
// 2^1 = 2 × (2^0)^2
// 2^0 = 1
//
// Build up:
// 2^1 = 2 × 1 = 2
// 2^2 = 2^2 = 4
// 2^5 = 2 × 4^2 = 2 × 16 = 32
// 2^10 = 32^2 = 1024
```

#### Problem 12.7: Median of Two Sorted Arrays

```java
/**
 * Find median of two sorted arrays
 * Input: [1, 3], [2]
 * Output: 2.0
 */

// APPROACH 1: Merge (Brute Force)
// Time: O(M + N), Space: O(M + N)
public static double medianMerge(int[] arr1, int[] arr2) {
    int m = arr1.length, n = arr2.length;
    int[] merged = new int[m + n];

    int i = 0, j = 0, k = 0;

    while (i < m && j < n) {
        if (arr1[i] < arr2[j]) {
            merged[k++] = arr1[i++];
        } else {
            merged[k++] = arr2[j++];
        }
    }

    while (i < m) merged[k++] = arr1[i++];
    while (j < n) merged[k++] = arr2[j++];

    int total = m + n;
    if (total % 2 == 1) {
        return merged[total / 2];
    } else {
        return (merged[total / 2 - 1] + merged[total / 2]) / 2.0;
    }
}

// APPROACH 2: Binary Search (Divide and Conquer)
// Time: O(log(min(M, N))), Space: O(1)
public static double medianBinarySearch(int[] arr1, int[] arr2) {
    // Ensure arr1 is smaller
    if (arr1.length > arr2.length) {
        return medianBinarySearch(arr2, arr1);
    }

    int m = arr1.length, n = arr2.length;
    int left = 0, right = m;

    while (left <= right) {
        int partition1 = left + (right - left) / 2;
        int partition2 = (m + n + 1) / 2 - partition1;

        int maxLeft1 = (partition1 == 0) ? Integer.MIN_VALUE : arr1[partition1 - 1];
        int minRight1 = (partition1 == m) ? Integer.MAX_VALUE : arr1[partition1];

        int maxLeft2 = (partition2 == 0) ? Integer.MIN_VALUE : arr2[partition2 - 1];
        int minRight2 = (partition2 == n) ? Integer.MAX_VALUE : arr2[partition2];

        if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            // Found correct partition
            if ((m + n) % 2 == 0) {
                return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2.0;
            } else {
                return Math.max(maxLeft1, maxLeft2);
            }
        } else if (maxLeft1 > minRight2) {
            right = partition1 - 1;
        } else {
            left = partition1 + 1;
        }
    }

    throw new IllegalArgumentException();
}
```

#### Problem 12.8: Matrix Multiplication (Strassen's Algorithm - Concept)

```java
/**
 * Multiply two N×N matrices
 */

// APPROACH 1: Naive (Brute Force)
// Time: O(N³), Space: O(N²)
public static int[][] multiplyNaive(int[][] A, int[][] B) {
    int n = A.length;
    int[][] C = new int[n][n];

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            for (int k = 0; k < n; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    return C;
}

// APPROACH 2: Divide and Conquer (Simplified concept)
// Strassen's algorithm: O(N^2.807) but complex implementation
// Concept: Divide matrices into 4 submatrices, use 7 multiplications instead of 8
//
// Standard D&C would still be O(N³):
// T(N) = 8T(N/2) + O(N²) = O(N³)
//
// Strassen uses only 7 multiplications:
// T(N) = 7T(N/2) + O(N²) = O(N^2.807)
```

#### Problem 12.9: Quick Select (Kth Smallest Element)

```java
/**
 * Find Kth smallest element in unsorted array
 * Input: [7, 10, 4, 3, 20, 15], K=3
 * Output: 7
 */

// APPROACH 1: Sorting (Semi-optimized)
// Time: O(N log N), Space: O(1) or O(N) depending on sort
public static int kthSmallestSort(int[] arr, int k) {
    Arrays.sort(arr);
    return arr[k - 1];
}

// APPROACH 2: Min Heap (Semi-optimized)
// Time: O(N log K), Space: O(K)
public static int kthSmallestHeap(int[] arr, int k) {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

    for (int num : arr) {
        maxHeap.offer(num);
        if (maxHeap.size() > k) {
            maxHeap.poll();
        }
    }

    return maxHeap.peek();
}

// APPROACH 3: Quick Select (Divide and Conquer)
// Time: O(N) average, O(N²) worst, Space: O(log N)
public static int kthSmallestQuickSelect(int[] arr, int k) {
    return quickSelect(arr, 0, arr.length - 1, k - 1);
}

private static int quickSelect(int[] arr, int left, int right, int k) {
    if (left == right) return arr[left];

    int pivotIndex = partition(arr, left, right);

    if (k == pivotIndex) {
        return arr[k];
    } else if (k < pivotIndex) {
        return quickSelect(arr, left, pivotIndex - 1, k);
    } else {
        return quickSelect(arr, pivotIndex + 1, right, k);
    }
}

private static int partition(int[] arr, int left, int right) {
    int pivot = arr[right];
    int i = left;

    for (int j = left; j < right; j++) {
        if (arr[j] <= pivot) {
            swap(arr, i, j);
            i++;
        }
    }

    swap(arr, i, right);
    return i;
}

private static void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

// Visual for [7,10,4,3,20,15], K=3:
// Partition around 15: [7,10,4,3,15,20]
//                        pivotIndex=4
// K=2 < 4, recurse left: [7,10,4,3]
// Partition around 3: [3,7,10,4]
//                      pivotIndex=0
// K=2 > 0, recurse right: [7,10,4]
// Partition around 4: [4,7,10]
//                      pivotIndex=0 (in subarray = index 1 in original context)
// K=2, found at position, but need to adjust...
// After proper partitioning: 3rd smallest = 7
```

#### Problem 12.10: Search in Rotated Sorted Array

```java
/**
 * Search in rotated sorted array
 * Input: [4, 5, 6, 7, 0, 1, 2], target=0
 * Output: 4
 */

// APPROACH 1: Linear Search (Brute Force)
// Time: O(N), Space: O(1)
public static int searchLinear(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

// APPROACH 2: Find pivot, then binary search (Semi-optimized)
// Time: O(log N), Space: O(1)
public static int searchWithPivot(int[] arr, int target) {
    int pivot = findPivot(arr);

    // Determine which half to search
    if (pivot == -1) {
        return binarySearch(arr, 0, arr.length - 1, target);
    }

    if (arr[pivot] == target) return pivot;

    if (arr[0] <= target) {
        return binarySearch(arr, 0, pivot - 1, target);
    } else {
        return binarySearch(arr, pivot + 1, arr.length - 1, target);
    }
}

private static int findPivot(int[] arr) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] > arr[right]) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return left;
}

// APPROACH 3: Modified Binary Search (Optimal - one pass)
// Time: O(log N), Space: O(1)
public static int searchRotatedOptimal(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;

        // Determine which half is sorted
        if (arr[left] <= arr[mid]) {
            // Left half is sorted
            if (arr[left] <= target && target < arr[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half is sorted
            if (arr[mid] < target && target <= arr[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }

    return -1;
}
```

---

## 📚 PATTERN 13: GREEDY ALGORITHMS

### 🧠 What is Greedy?

**Definition:** Make the locally optimal choice at each step, hoping to find a global optimum.

**When to Use:**

- Problem asks for maximum/minimum
- Choice doesn't depend on future choices
- Local optimum leads to global optimum
- Keywords: "maximize", "minimize", "optimal"

### 🎨 The Greedy Decision Process:

```
Step 1: Identify what to choose (locally optimal)
Step 2: Make that choice
Step 3: Move to next choice (don't reconsider previous)
Step 4: Repeat until done

Key: Once a choice is made, never go back!
```

### 📝 5-Step Translation for Greedy:

```
STEP 1: Pattern → "Greedy (local choices)"
STEP 2: Skeleton → for loop to iterate choices
STEP 3: Invariant → current choice is locally optimal
STEP 4: Layer logic → make choice, update result
STEP 5: Edge cases → empty input, single element
```

### Example 1: Activity Selection (Meeting Rooms)

```java
/**
 * Maximum number of non-overlapping activities
 * Input: [(1,3), (2,5), (4,6), (7,9)]
 * Output: 3 (activities 1, 3, 4)
 */

class Activity {
    int start, end;
    Activity(int s, int e) {
        start = s;
        end = e;
    }
}

// APPROACH 1: Brute Force (Try all combinations)
// Time: O(2^N), Space: O(N)
// Too slow - not recommended

// APPROACH 2: Greedy (Sort by end time)
// Time: O(N log N), Space: O(1)
public static int maxActivities(Activity[] activities) {
    // STEP 1: Pattern = Greedy
    // STEP 2: Skeleton
    int n = activities.length;
    if (n == 0) return 0;  // STEP 5: Edge case

    // STEP 3: Invariant - always pick activity ending earliest
    Arrays.sort(activities, (a, b) -> a.end - b.end);

    // STEP 4: Layer logic
    int count = 1;  // First activity always selected
    int lastEnd = activities[0].end;

    for (int i = 1; i < n; i++) {
        // Greedy choice: if current starts after last ends, pick it
        if (activities[i].start >= lastEnd) {
            count++;
            lastEnd = activities[i].end;
        }
    }

    return count;
}

// Why Greedy Works Here:
// - Picking earliest ending gives maximum room for future activities
// - Local optimal (earliest end) = Global optimal (max activities)
```

### Example 2: Fractional Knapsack

```java
/**
 * Maximize value with weight limit (can take fractions)
 * Input: values=[60,100,120], weights=[10,20,30], capacity=50
 * Output: 240 (all of item 1, all of item 2, 2/3 of item 3)
 */

class Item {
    int value, weight;
    Item(int v, int w) {
        value = v;
        weight = w;
    }
}

// APPROACH: Greedy (Sort by value/weight ratio)
// Time: O(N log N), Space: O(1)
public static double fractionalKnapsack(Item[] items, int capacity) {
    // STEP 1: Pattern = Greedy
    // STEP 2: Skeleton
    int n = items.length;
    if (n == 0 || capacity == 0) return 0;  // STEP 5

    // STEP 3: Invariant - always pick highest value/weight ratio
    Arrays.sort(items, (a, b) ->
        Double.compare((double)b.value/b.weight, (double)a.value/a.weight));

    // STEP 4: Layer logic
    double totalValue = 0;
    int remainingCapacity = capacity;

    for (int i = 0; i < n; i++) {
        if (remainingCapacity == 0) break;

        if (items[i].weight <= remainingCapacity) {
            // Take whole item
            totalValue += items[i].value;
            remainingCapacity -= items[i].weight;
        } else {
            // Take fraction
            totalValue += items[i].value * ((double)remainingCapacity / items[i].weight);
            remainingCapacity = 0;
        }
    }

    return totalValue;
}
```

### Example 3: Minimum Platforms Needed (Railway Station)

```java
/**
 * Find minimum platforms needed for trains
 * Input: arrivals=[900,940,950], departures=[910,1200,1120]
 * Output: 3
 */

// APPROACH 1: Brute Force
// Time: O(N²), Space: O(1)
public static int minPlatformsBrute(int[] arr, int[] dep) {
    int n = arr.length;
    int maxPlatforms = 1;

    for (int i = 0; i < n; i++) {
        int platforms = 1;

        for (int j = 0; j < n; j++) {
            if (i != j) {
                // Check if trains overlap
                if (arr[j] < dep[i] && dep[j] > arr[i]) {
                    platforms++;
                }
            }
        }

        maxPlatforms = Math.max(maxPlatforms, platforms);
    }

    return maxPlatforms;
}

// APPROACH 2: Greedy (Sort both arrays separately)
// Time: O(N log N), Space: O(1)
public static int minPlatformsGreedy(int[] arr, int[] dep) {
    // STEP 1: Pattern = Greedy
    int n = arr.length;
    if (n == 0) return 0;

    // STEP 2 & 3: Sort times, track platforms
    Arrays.sort(arr);
    Arrays.sort(dep);

    // STEP 4: Layer logic
    int platforms = 0;
    int maxPlatforms = 0;
    int i = 0, j = 0;

    while (i < n && j < n) {
        if (arr[i] < dep[j]) {
            // Train arrives, need platform
            platforms++;
            i++;
            maxPlatforms = Math.max(maxPlatforms, platforms);
        } else {
            // Train departs, free platform
            platforms--;
            j++;
        }
    }

    return maxPlatforms;
}

// Visual trace for arr=[900,940,950], dep=[910,1200,1120]:
// After sorting: arr=[900,940,950], dep=[910,1120,1200]
//
// i=0, j=0: 900 < 910 → platform++, platforms=1, max=1
// i=1, j=0: 940 > 910 → platform--, platforms=0
// i=1, j=1: 940 < 1120 → platform++, platforms=1, max=1
// i=2, j=1: 950 < 1120 → platform++, platforms=2, max=2
// i=3, done
// Answer: 2
```

---

## 📚 PATTERN 14: MATHEMATICAL PATTERNS

### When to Use:

- GCD, LCM problems
- Prime factors
- Digit manipulation
- Modular arithmetic
- Number theory

### 📝 5-Step for Math Problems:

```
STEP 1: Pattern → Identify math concept (GCD, prime, etc.)
STEP 2: Skeleton → Usually while/for loop
STEP 3: Invariant → Mathematical property maintained
STEP 4: Layer → Add one operation at a time
STEP 5: Edge cases → 0, 1, negative numbers
```

### Example 1: GCD (Greatest Common Divisor)

```java
/**
 * Find GCD of two numbers
 * Input: 48, 18
 * Output: 6
 */

// APPROACH 1: Brute Force
// Time: O(min(a,b)), Space: O(1)
public static int gcdBrute(int a, int b) {
    int gcd = 1;
    int smaller = Math.min(a, b);

    for (int i = 1; i <= smaller; i++) {
        if (a % i == 0 && b % i == 0) {
            gcd = i;
        }
    }

    return gcd;
}

// APPROACH 2: Euclidean Algorithm (Optimal)
// Time: O(log(min(a,b))), Space: O(1)
public static int gcdEuclidean(int a, int b) {
    // STEP 1: Pattern = Euclidean algorithm
    // STEP 5: Edge cases
    if (b == 0) return a;
    if (a == 0) return b;

    // STEP 2: Skeleton
    // STEP 3: Invariant - GCD(a,b) = GCD(b, a%b)
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }

    return a;
}

// APPROACH 3: Recursive
// Time: O(log(min(a,b))), Space: O(log(min(a,b)))
public static int gcdRecursive(int a, int b) {
    if (b == 0) return a;
    return gcdRecursive(b, a % b);
}

// Visual trace for gcd(48, 18):
// gcd(48, 18) → gcd(18, 48%18) → gcd(18, 12)
// gcd(18, 12) → gcd(12, 18%12) → gcd(12, 6)
// gcd(12, 6)  → gcd(6, 12%6)  → gcd(6, 0)
// Answer: 6
```

### Example 2: LCM (Least Common Multiple)

```java
/**
 * Find LCM of two numbers
 * Input: 12, 18
 * Output: 36
 */

// Formula: LCM(a, b) = (a * b) / GCD(a, b)

// APPROACH 1: Brute Force
// Time: O(max(a,b)), Space: O(1)
public static int lcmBrute(int a, int b) {
    int larger = Math.max(a, b);

    while (true) {
        if (larger % a == 0 && larger % b == 0) {
            return larger;
        }
        larger++;
    }
}

// APPROACH 2: Using GCD (Optimal)
// Time: O(log(min(a,b))), Space: O(1)
public static int lcmOptimal(int a, int b) {
    return (a * b) / gcdEuclidean(a, b);
}
```

### Example 3: Prime Factorization

```java
/**
 * Find all prime factors of a number
 * Input: 60
 * Output: [2, 2, 3, 5]
 */

// APPROACH 1: Check all numbers
// Time: O(N), Space: O(log N)
public static ArrayList<Integer> primeFactorsBrute(int n) {
    ArrayList<Integer> factors = new ArrayList<>();

    for (int i = 2; i <= n; i++) {
        while (n % i == 0) {
            factors.add(i);
            n /= i;
        }
    }

    return factors;
}

// APPROACH 2: Optimized (Check up to √N)
// Time: O(√N), Space: O(log N)
public static ArrayList<Integer> primeFactorsOptimized(int n) {
    // STEP 1: Pattern = Prime factorization
    ArrayList<Integer> factors = new ArrayList<>();

    // STEP 5: Edge case
    if (n <= 1) return factors;

    // STEP 2 & 3: Check factors up to √N
    // STEP 4: Layer logic

    // Check for 2s
    while (n % 2 == 0) {
        factors.add(2);
        n /= 2;
    }

    // Check odd numbers from 3 to √N
    for (int i = 3; i * i <= n; i += 2) {
        while (n % i == 0) {
            factors.add(i);
            n /= i;
        }
    }

    // If n is still > 1, it's a prime factor
    if (n > 1) {
        factors.add(n);
    }

    return factors;
}

// Visual for 60:
// 60 / 2 = 30 → add 2
// 30 / 2 = 15 → add 2
// 15 / 3 = 5  → add 3
// 5 is prime → add 5
// Result: [2, 2, 3, 5]
```

### Example 4: Check Perfect Number

```java
/**
 * Check if sum of divisors equals the number
 * Input: 28
 * Output: true (1+2+4+7+14=28)
 */

// APPROACH 1: Check all numbers
// Time: O(N), Space: O(1)
public static boolean isPerfectBrute(int n) {
    if (n <= 1) return false;

    int sum = 0;
    for (int i = 1; i < n; i++) {
        if (n % i == 0) {
            sum += i;
        }
    }

    return sum == n;
}

// APPROACH 2: Optimized (Check up to √N)
// Time: O(√N), Space: O(1)
public static boolean isPerfectOptimized(int n) {
    if (n <= 1) return false;

    int sum = 1;  // 1 is always a divisor

    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            sum += i;

            // Add the paired divisor (but not if it's the square root)
            if (i != n / i) {
                sum += n / i;
            }
        }
    }

    return sum == n;
}

// Visual for 28:
// i=2: 28%2==0 → sum += 2 + 14 = 17
// i=3: skip
// i=4: 28%4==0 → sum += 4 + 7 = 28
// i=5: 5*5 > 28, stop
// sum = 1 + 2 + 14 + 4 + 7 = 28 ✓
```

---

## 📚 PATTERN 15: BIT MANIPULATION

### When to Use:

- "XOR", "AND", "OR" operations
- Check if power of 2
- Count set bits
- Swap without temp variable
- Space optimization

### 📝 5-Step for Bit Problems:

```
STEP 1: Pattern → Identify bit operation
STEP 2: Skeleton → Usually bit operators in loop
STEP 3: Invariant → Bit property maintained
STEP 4: Layer → One bit operation at a time
STEP 5: Edge cases → 0, negative numbers
```

### Example 1: Count Set Bits (1s in binary)

```java
/**
 * Count number of 1s in binary representation
 * Input: 13 (binary: 1101)
 * Output: 3
 */

// APPROACH 1: Convert to binary string
// Time: O(log N), Space: O(log N)
public static int countSetBitsString(int n) {
    String binary = Integer.toBinaryString(n);
    int count = 0;

    for (char c : binary.toCharArray()) {
        if (c == '1') count++;
    }

    return count;
}

// APPROACH 2: Check each bit
// Time: O(log N), Space: O(1)
public static int countSetBitsLoop(int n) {
    int count = 0;

    while (n > 0) {
        if ((n & 1) == 1) {  // Check last bit
            count++;
        }
        n >>= 1;  // Right shift (divide by 2)
    }

    return count;
}

// APPROACH 3: Brian Kernighan's Algorithm (Optimal)
// Time: O(number of set bits), Space: O(1)
public static int countSetBitsOptimal(int n) {
    // STEP 1: Pattern = Bit manipulation
    int count = 0;

    // STEP 2 & 3: Each iteration removes rightmost set bit
    while (n > 0) {
        n = n & (n - 1);  // Clear rightmost set bit
        count++;
    }

    return count;
}

// Visual for 13 (1101):
// n = 1101, n-1 = 1100
// 1101 & 1100 = 1100, count=1
// n = 1100, n-1 = 1011
// 1100 & 1011 = 1000, count=2
// n = 1000, n-1 = 0111
// 1000 & 0111 = 0000, count=3
// Answer: 3
```

### Example 2: Check if Power of 2

```java
/**
 * Check if number is power of 2
 * Input: 16
 * Output: true
 */

// APPROACH 1: Keep dividing by 2
// Time: O(log N), Space: O(1)
public static boolean isPowerOf2Divide(int n) {
    if (n <= 0) return false;

    while (n > 1) {
        if (n % 2 != 0) {
            return false;
        }
        n /= 2;
    }

    return true;
}

// APPROACH 2: Bit manipulation (Optimal)
// Time: O(1), Space: O(1)
public static boolean isPowerOf2Bit(int n) {
    // Power of 2 has exactly one set bit
    // n & (n-1) removes rightmost set bit
    // If result is 0, there was only one set bit

    return n > 0 && (n & (n - 1)) == 0;
}

// Visual:
// 16 = 10000, 15 = 01111
// 16 & 15 = 00000 ✓
//
// 18 = 10010, 17 = 10001
// 18 & 17 = 10000 ≠ 0 ✗
```

### Example 3: Find Single Number (XOR trick)

```java
/**
 * All numbers appear twice except one, find it
 * Input: [2, 3, 5, 4, 5, 3, 4]
 * Output: 2
 */

// APPROACH 1: HashMap
// Time: O(N), Space: O(N)
public static int singleNumberHashMap(int[] arr) {
    HashMap<Integer, Integer> map = new HashMap<>();

    for (int num : arr) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }

    for (int num : map.keySet()) {
        if (map.get(num) == 1) {
            return num;
        }
    }

    return -1;
}

// APPROACH 2: XOR (Optimal)
// Time: O(N), Space: O(1)
public static int singleNumberXOR(int[] arr) {
    // STEP 1: Pattern = XOR property
    // Property: a ^ a = 0, a ^ 0 = a
    // All pairs cancel out, only single remains

    int result = 0;

    for (int num : arr) {
        result ^= num;
    }

    return result;
}

// Visual for [2,3,5,4,5,3,4]:
// result = 0
// 0 ^ 2 = 2
// 2 ^ 3 = 1 (binary: 10 ^ 11 = 01)
// ... (all pairs cancel)
// Final: 2
```

### Example 4: Swap Without Temp

```java
/**
 * Swap two numbers without temporary variable
 */

// APPROACH 1: Addition/Subtraction
public static void swapArithmetic(int a, int b) {
    System.out.println("Before: a=" + a + ", b=" + b);

    a = a + b;
    b = a - b;  // Now b = original a
    a = a - b;  // Now a = original b

    System.out.println("After: a=" + a + ", b=" + b);
}

// APPROACH 2: XOR (Works even with overflow)
public static void swapXOR(int a, int b) {
    System.out.println("Before: a=" + a + ", b=" + b);

    a = a ^ b;
    b = a ^ b;  // b = (a^b) ^ b = a
    a = a ^ b;  // a = (a^b) ^ a = b

    System.out.println("After: a=" + a + ", b=" + b);
}
```

---

## 📚 PATTERN 16: MATRIX/2D ARRAY PATTERNS

### When to Use:

- 2D array traversal
- Spiral traversal
- Diagonal traversal
- Matrix rotation/transpose
- Grid-based problems

### 📝 5-Step for Matrix Problems:

```
STEP 1: Pattern → Identify traversal type
STEP 2: Skeleton → Nested loops (usually)
STEP 3: Invariant → Row/column boundaries
STEP 4: Layer → Add one direction at a time
STEP 5: Edge cases → Empty matrix, single element
```

### Example 1: Spiral Traversal

```java
/**
 * Print matrix in spiral order
 * Input: [[1,2,3],
 *         [4,5,6],
 *         [7,8,9]]
 * Output: 1,2,3,6,9,8,7,4,5
 */

// APPROACH: Layer by layer
// Time: O(M×N), Space: O(1)
public static void spiralTraversal(int[][] matrix) {
    // STEP 1: Pattern = Spiral traversal
    if (matrix.length == 0) return;  // STEP 5

    // STEP 2 & 3: Define boundaries
    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;

    // STEP 4: Layer logic - one direction at a time
    while (top <= bottom && left <= right) {

        // Move right along top row
        for (int col = left; col <= right; col++) {
            System.out.print(matrix[top][col] + " ");
        }
        top++;

        // Move down along right column
        for (int row = top; row <= bottom; row++) {
            System.out.print(matrix[row][right] + " ");
        }
        right--;

        // Move left along bottom row (if exists)
        if (top <= bottom) {
            for (int col = right; col >= left; col--) {
                System.out.print(matrix[bottom][col] + " ");
            }
            bottom--;
        }

        // Move up along left column (if exists)
        if (left <= right) {
            for (int row = bottom; row >= top; row--) {
                System.out.print(matrix[row][left] + " ");
            }
            left++;
        }
    }
}

// Visual trace:
// [1, 2, 3]      top=0, right=2
//  →  →  →
// [4, 5, 6]      Print: 1,2,3 (top row), top++
//           ↓
// [7, 8, 9]      Print: 6,9 (right col), right--
//        ↓
//
// [1, 2, 3]      bottom=2, left=0
//
// [4, 5, 6]      Print: 8,7 (bottom row), bottom--
//  ←  ←  ←
// [7, 8, 9]
//  ↑
//               Print: 4 (left col), left++
//
// [1, 2, 3]      top=1, bottom=1
//               Print: 5 (center)
// [4, 5, 6]
//
// [7, 8, 9]
```

### Example 2: Rotate Matrix 90° Clockwise

```java
/**
 * Rotate N×N matrix 90° clockwise
 * Input: [[1,2,3],    Output: [[7,4,1],
 *         [4,5,6],              [8,5,2],
 *         [7,8,9]]              [9,6,3]]
 */

// APPROACH 1: Using extra space
// Time: O(N²), Space: O(N²)
public static int[][] rotateWithSpace(int[][] matrix) {
    int n = matrix.length;
    int[][] rotated = new int[n][n];

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            rotated[j][n - 1 - i] = matrix[i][j];
        }
    }

    return rotated;
}

// APPROACH 2: In-place (Transpose + Reverse)
// Time: O(N²), Space: O(1)
public static void rotateInPlace(int[][] matrix) {
    // STEP 1: Pattern = Transpose + Reverse
    int n = matrix.length;

    // STEP 2 & 4: Transpose matrix
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            // Swap matrix[i][j] with matrix[j][i]
            int temp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = temp;
        }
    }

    // STEP 4: Reverse each row
    for (int i = 0; i < n; i++) {
        int left = 0, right = n - 1;
        while (left < right) {
            int temp = matrix[i][left];
            matrix[i][left] = matrix[i][right];
            matrix[i][right] = temp;
            left++;
            right--;
        }
    }
}

// Visual:
// Original:     After Transpose:  After Reverse:
// [1, 2, 3]     [1, 4, 7]        [7, 4, 1]
// [4, 5, 6]  →  [2, 5, 8]    →   [8, 5, 2]
// [7, 8, 9]     [3, 6, 9]        [9, 6, 3]
```

### Example 3: Search in Row & Column Sorted Matrix

```java
/**
 * Search in matrix sorted row-wise and column-wise
 * Input: [[1,  4,  7, 11],
 *         [2,  5,  8, 12],
 *         [3,  6,  9, 16],
 *         [10,13,14, 17]], target=5
 * Output: true
 */

// APPROACH 1: Brute Force
// Time: O(M×N), Space: O(1)
public static boolean searchMatrixBrute(int[][] matrix, int target) {
    for (int i = 0; i < matrix.length; i++) {
        for (int j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] == target) {
                return true;
            }
        }
    }
    return false;
}

// APPROACH 2: Start from top-right (Optimal)
// Time: O(M + N), Space: O(1)
public static boolean searchMatrixOptimal(int[][] matrix, int target) {
    // STEP 1: Pattern = Staircase search
    if (matrix.length == 0) return false;

    // STEP 2: Start from top-right corner
    int row = 0;
    int col = matrix[0].length - 1;

    // STEP 3 & 4: Move left or down based on comparison
    while (row < matrix.length && col >= 0) {
        if (matrix[row][col] == target) {
            return true;
        } else if (matrix[row][col] > target) {
            col--;  // Move left
        } else {
            row++;  // Move down
        }
    }

    return false;
}

// Visual for searching 5:
// Start at top-right (11)
// [1,  4,  7, (11)]  ← 11 > 5, move left
// [2,  5,  8,  12]
// [3,  6,  9,  16]
// [10,13,14,  17]
//
// [1,  4, (7), 11]   ← 7 > 5, move left
// [2,  5,  8,  12]
// [3,  6,  9,  16]
// [10,13,14,  17]
//
// [1, (4),  7, 11]   ← 4 < 5, move down
// [2,  5,  8,  12]
// [3,  6,  9,  16]
// [10,13,14,  17]
//
// [1,  4,  7, 11]
// [2, (5),  8,  12]  ← Found!
// [3,  6,  9,  16]
// [10,13,14,  17]
```

---

## 📚 PATTERN 17: STACK-BASED PATTERNS

### When to Use:

- Balanced parentheses/brackets
- Next Greater Element
- Histogram problems
- Expression evaluation
- Undo operations

### 📝 5-Step for Stack Problems:

```
STEP 1: Pattern → Identify LIFO behavior
STEP 2: Skeleton → Loop + stack operations
STEP 3: Invariant → Stack maintains order/constraint
STEP 4: Layer → Push/pop based on condition
STEP 5: Edge cases → Empty stack, empty input
```

### Example 1: Balanced Parentheses

```java
/**
 * Check if brackets are balanced
 * Input: "{[()]}"
 * Output: true
 */

// APPROACH: Stack
// Time: O(N), Space: O(N)
public static boolean isBalanced(String s) {
    // STEP 1: Pattern = Stack (LIFO for matching)

    // STEP 5: Edge case
    if (s.length() == 0) return true;

    // STEP 2: Skeleton
    Stack<Character> stack = new Stack<>();

    // STEP 3 & 4: Push opening, pop for closing
    for (char ch : s.toCharArray()) {

        if (ch == '(' || ch == '{' || ch == '[') {
            // Opening bracket - push
            stack.push(ch);

        } else {
            // Closing bracket - check match
            if (stack.isEmpty()) return false;

            char top = stack.pop();

            if (ch == ')' && top != '(') return false;
            if (ch == '}' && top != '{') return false;
            if (ch == ']' && top != '[') return false;
        }
    }

    // All brackets must be matched
    return stack.isEmpty();
}

// Visual for "{[()]}":
// ch='{': stack = ['{']
// ch='[': stack = ['{', '[']
// ch='(': stack = ['{', '[', '(']
// ch=')': pop '(' ✓, stack = ['{', '[']
// ch=']': pop '[' ✓, stack = ['{']
// ch='}': pop '{' ✓, stack = []
// Result: true
```

### Example 2: Next Greater Element

```java
/**
 * For each element, find next greater element to the right
 * Input: [4, 5, 2, 10, 8]
 * Output: [5, 10, 10, -1, -1]
 */

// APPROACH 1: Brute Force
// Time: O(N²), Space: O(N)
public static int[] nextGreaterBrute(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];

    for (int i = 0; i < n; i++) {
        result[i] = -1;

        for (int j = i + 1; j < n; j++) {
            if (arr[j] > arr[i]) {
                result[i] = arr[j];
                break;
            }
        }
    }

    return result;
}

// APPROACH 2: Stack (Optimal)
// Time: O(N), Space: O(N)
public static int[] nextGreaterStack(int[] arr) {
    // STEP 1: Pattern = Monotonic stack
    int n = arr.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();  // Store indices

    // STEP 2: Traverse right to left
    for (int i = n - 1; i >= 0; i--) {

        // STEP 3 & 4: Pop smaller elements
        while (!stack.isEmpty() && arr[stack.peek()] <= arr[i]) {
            stack.pop();
        }

        // If stack empty, no greater element
        result[i] = stack.isEmpty() ? -1 : arr[stack.peek()];

        // Push current index
        stack.push(i);
    }

    return result;
}

// Visual for [4,5,2,10,8]:
// Start from right (i=4, val=8):
//   stack=[], result[4]=-1, push 8
//   stack=[8]
//
// i=3, val=10:
//   pop 8 (10 > 8)
//   stack=[], result[3]=-1, push 10
//   stack=[10]
//
// i=2, val=2:
//   10 > 2, keep
//   result[2]=10, push 2
//   stack=[10, 2]
//
// i=1, val=5:
//   pop 2 (5 > 2)
//   10 > 5, keep
//   result[1]=10, push 5
//   stack=[10, 5]
//
// i=0, val=4:
//   5 > 4, keep
//   result[0]=5, push 4
//   stack=[10, 5, 4]
//
// Result: [5, 10, 10, -1, -1]
```

### Example 3: Largest Rectangle in Histogram

```java
/**
 * Find largest rectangle area in histogram
 * Input: heights=[2,1,5,6,2,3]
 * Output: 10 (heights 5,6 with width 2)
 */

// APPROACH 1: Brute Force
// Time: O(N²), Space: O(1)
public static int largestRectangleBrute(int[] heights) {
    int maxArea = 0;
    int n = heights.length;

    for (int i = 0; i < n; i++) {
        int minHeight = heights[i];

        for (int j = i; j < n; j++) {
            minHeight = Math.min(minHeight, heights[j]);
            int width = j - i + 1;
            maxArea = Math.max(maxArea, minHeight * width);
        }
    }

    return maxArea;
}

// APPROACH 2: Stack (Optimal)
// Time: O(N), Space: O(N)
public static int largestRectangleStack(int[] heights) {
    // STEP 1: Pattern = Stack for nearest smaller
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;
    int n = heights.length;

    // STEP 2 & 3: Process each bar
    for (int i = 0; i < n; i++) {

        // STEP 4: Pop bars taller than current
        while (!stack.isEmpty() && heights[stack.peek()] > heights[i]) {
            int height = heights[stack.pop()];

            // Width = current index - left boundary - 1
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;

            maxArea = Math.max(maxArea, height * width);
        }

        stack.push(i);
    }

    // Process remaining bars
    while (!stack.isEmpty()) {
        int height = heights[stack.pop()];
        int width = stack.isEmpty() ? n : n - stack.peek() - 1;
        maxArea = Math.max(maxArea, height * width);
    }

    return maxArea;
}

// Visual for [2,1,5,6,2,3]:
// i=0(2): stack=[0]
// i=1(1): pop 0, area=2*1=2, stack=[1]
// i=2(5): stack=[1,2]
// i=3(6): stack=[1,2,3]
// i=4(2):
//   pop 3(6): width=4-2-1=1, area=6*1=6
//   pop 2(5): width=4-1-1=2, area=5*2=10 ← max
//   stack=[1,4]
// i=5(3): stack=[1,4,5]
// End: process remaining
// Answer: 10
```

---

## 📚 PATTERN 18: QUEUE & DEQUE PATTERNS

### When to Use:

- Sliding window maximum/minimum
- First non-repeating character
- Level order traversal
- BFS-related problems

### 📝 5-Step for Queue Problems:

```
STEP 1: Pattern → Identify FIFO or deque
STEP 2: Skeleton → While/for + queue operations
STEP 3: Invariant → Queue maintains order
STEP 4: Layer → Add/remove based on condition
STEP 5: Edge cases → Empty queue, single element
```

### Example 1: Sliding Window Maximum (using Deque)

```java
/**
 * Maximum in each sliding window
 * Input: arr=[1,3,-1,-3,5,3,6,7], k=3
 * Output: [3,3,5,5,6,7]
 */

// APPROACH 1: Brute Force
// Time: O(N*K), Space: O(1)
public static int[] maxSlidingWindowBrute(int[] arr, int k) {
    int n = arr.length;
    int[] result = new int[n - k + 1];

    for (int i = 0; i <= n - k; i++) {
        int max = arr[i];

        for (int j = i; j < i + k; j++) {
            max = Math.max(max, arr[j]);
        }

        result[i] = max;
    }

    return result;
}

// APPROACH 2: Deque (Optimal)
// Time: O(N), Space: O(K)
public static int[] maxSlidingWindowDeque(int[] arr, int k) {
    // STEP 1: Pattern = Deque (maintains max at front)
    if (arr.length == 0) return new int[0];

    int n = arr.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // Store indices

    // STEP 2 & 3: Process each element
    for (int i = 0; i < n; i++) {

        // STEP 4a: Remove indices outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // STEP 4b: Remove smaller elements from back
        while (!deque.isEmpty() && arr[deque.peekLast()] < arr[i]) {
            deque.pollLast();
        }

        // Add current element
        deque.offerLast(i);

        // Add to result if window complete
        if (i >= k - 1) {
            result[i - k + 1] = arr[deque.peekFirst()];
        }
    }

    return result;
}

// Visual for [1,3,-1,-3,5,3,6,7], k=3:
//
// i=0(1): deque=[0], window not complete
// i=1(3): remove 1 (smaller), deque=[1]
// i=2(-1): deque=[1,2], result[0]=3 ✓
//
// i=3(-3): deque=[1,2,3], result[1]=3 ✓
// i=4(5):
//   remove 1 (outside window)
//   remove -1,-3 (smaller)
//   deque=[4], result[2]=5 ✓
//
// i=5(3): deque=[4,5], result[3]=5 ✓
// i=6(6): remove 5,3 (smaller), deque=[6], result[4]=6 ✓
// i=7(7): remove 6 (smaller), deque=[7], result[5]=7 ✓
```

### Example 2: First Non-Repeating Character in Stream

```java
/**
 * Find first non-repeating character after each addition
 * Input: stream="aabcc"
 * Output: ['a', -1, 'b', 'b', -1]
 */

// APPROACH: Queue + HashMap
// Time: O(N), Space: O(N)
public static char[] firstNonRepeating(String stream) {
    // STEP 1: Pattern = Queue + frequency map
    int n = stream.length();
    char[] result = new char[n];

    HashMap<Character, Integer> freq = new HashMap<>();
    Queue<Character> queue = new LinkedList<>();

    // STEP 2 & 3: Process each character
    for (int i = 0; i < n; i++) {
        char ch = stream.charAt(i);

        // STEP 4: Update frequency and queue
        freq.put(ch, freq.getOrDefault(ch, 0) + 1);
        queue.offer(ch);

        // Remove repeating characters from front
        while (!queue.isEmpty() && freq.get(queue.peek()) > 1) {
            queue.poll();
        }

        // First in queue is non-repeating
        result[i] = queue.isEmpty() ? '#' : queue.peek();
    }

    return result;
}

// Visual for "aabcc":
// i=0('a'): freq={a:1}, queue=[a], result[0]='a'
// i=1('a'): freq={a:2}, queue=[a,a], remove 'a's
//           queue=[], result[1]='#'
// i=2('b'): freq={a:2,b:1}, queue=[b], result[2]='b'
// i=3('c'): freq={a:2,b:1,c:1}, queue=[b,c], result[3]='b'
// i=4('c'): freq={a:2,b:1,c:2}, queue=[b,c,c]
//           remove 'c's, queue=[b], result[4]='b'
```

---

## 📚 PATTERN 19: DYNAMIC PROGRAMMING BASICS

### When to Use:

- Overlapping subproblems
- Optimal substructure
- "Maximum/minimum" with choices
- Counting problems

### 📝 5-Step for DP Problems:

```
STEP 1: Pattern → Identify DP (recursion + memoization)
STEP 2: Skeleton → Array/table for storage
STEP 3: Invariant → DP[i] represents subproblem solution
STEP 4: Layer → Build from base cases
STEP 5: Edge cases → Empty input, n=0, n=1
```

### Example 1: Fibonacci (Introduction to DP)

```java
/**
 * Find nth Fibonacci number
 * Input: 5
 * Output: 5 (sequence: 0,1,1,2,3,5)
 */

// APPROACH 1: Recursion (Exponential)
// Time: O(2^N), Space: O(N) [call stack]
public static int fibRecursive(int n) {
    if (n <= 1) return n;
    return fibRecursive(n - 1) + fibRecursive(n - 2);
}

// APPROACH 2: DP with Array (Top-down)
// Time: O(N), Space: O(N)
public static int fibMemoization(int n) {
    int[] memo = new int[n + 1];
    Arrays.fill(memo, -1);
    return fibMemo(n, memo);
}

private static int fibMemo(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];

    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}

// APPROACH 3: DP Iterative (Bottom-up)
// Time: O(N), Space: O(N)
public static int fibDP(int n) {
    // STEP 1: Pattern = DP (overlapping subproblems)
    if (n <= 1) return n;  // STEP 5

    // STEP 2: Create DP array
    int[] dp = new int[n + 1];

    // STEP 3 & 4: Build from base cases
    dp[0] = 0;
    dp[1] = 1;

    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// APPROACH 4: Space Optimized
// Time: O(N), Space: O(1)
public static int fibOptimized(int n) {
    if (n <= 1) return n;

    int prev2 = 0, prev1 = 1;

    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}

// Visual for fib(5):
// Recursive tree (exponential):
//              fib(5)
//            /        \
//        fib(4)      fib(3)
//       /     \      /     \
//   fib(3)  fib(2) fib(2) fib(1)
//    ...      ...    ...
//
// DP approach:
// dp[0]=0, dp[1]=1
// dp[2]=dp[1]+dp[0]=1
// dp[3]=dp[2]+dp[1]=2
// dp[4]=dp[3]+dp[2]=3
// dp[5]=dp[4]+dp[3]=5
```

### Example 2: Climbing Stairs

```java
/**
 * Count ways to climb n stairs (1 or 2 steps at a time)
 * Input: 3
 * Output: 3 (ways: 1+1+1, 1+2, 2+1)
 */

// APPROACH 1: Recursion
// Time: O(2^N), Space: O(N)
public static int climbStairsRecursive(int n) {
    if (n <= 2) return n;
    return climbStairsRecursive(n - 1) + climbStairsRecursive(n - 2);
}

// APPROACH 2: DP Iterative (Same as Fibonacci!)
// Time: O(N), Space: O(N)
public static int climbStairsDP(int n) {
    // STEP 1: Pattern = DP (choices at each step)
    if (n <= 2) return n;

    // STEP 2: Create DP array
    int[] dp = new int[n + 1];

    // STEP 3: Base cases
    dp[1] = 1;  // 1 way to climb 1 stair
    dp[2] = 2;  // 2 ways to climb 2 stairs

    // STEP 4: Build solution
    for (int i = 3; i <= n; i++) {
        // Ways to reach step i = ways from (i-1) + ways from (i-2)
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// APPROACH 3: Space Optimized
// Time: O(N), Space: O(1)
public static int climbStairsOptimized(int n) {
    if (n <= 2) return n;

    int prev2 = 1, prev1 = 2;

    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}

// Visual for n=5:
// Stair 1: 1 way (1)
// Stair 2: 2 ways (1+1, 2)
// Stair 3: 3 ways (from stair 1 or 2)
// Stair 4: 5 ways (from stair 2 or 3)
// Stair 5: 8 ways (from stair 3 or 4)
```

### Example 3: Maximum Subarray Sum (Kadane's with DP view)

```java
/**
 * Find maximum sum of contiguous subarray
 * Input: [-2,1,-3,4,-1,2,1,-5,4]
 * Output: 6 ([4,-1,2,1])
 */

// DP Interpretation:
// dp[i] = max sum ending at index i

// APPROACH: Kadane's Algorithm (DP)
// Time: O(N), Space: O(1)
public static int maxSubarrayDP(int[] arr) {
    // STEP 1: Pattern = DP (optimal substructure)
    if (arr.length == 0) return 0;

    // STEP 2 & 3: Track max ending here and global max
    int maxEndingHere = arr[0];
    int maxSoFar = arr[0];

    // STEP 4: Build solution
    for (int i = 1; i < arr.length; i++) {
        // Either extend previous subarray or start new
        maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }

    return maxSoFar;
}

// With explicit DP array:
public static int maxSubarrayDPArray(int[] arr) {
    int n = arr.length;
    if (n == 0) return 0;

    int[] dp = new int[n];
    dp[0] = arr[0];
    int maxSum = dp[0];

    for (int i = 1; i < n; i++) {
        // dp[i] = max sum ending at i
        dp[i] = Math.max(arr[i], dp[i - 1] + arr[i]);
        maxSum = Math.max(maxSum, dp[i]);
    }

    return maxSum;
}

// Visual for [-2,1,-3,4,-1,2,1,-5,4]:
// i=0: dp[0]=-2, max=-2
// i=1: dp[1]=max(1, -2+1)=1, max=1
// i=2: dp[2]=max(-3, 1-3)=-2, max=1
// i=3: dp[3]=max(4, -2+4)=4, max=4
// i=4: dp[4]=max(-1, 4-1)=3, max=4
// i=5: dp[5]=max(2, 3+2)=5, max=5
// i=6: dp[6]=max(1, 5+1)=6, max=6 ← answer
// i=7: dp[7]=max(-5, 6-5)=1, max=6
// i=8: dp[8]=max(4, 1+4)=5, max=6
```

---

## 📚 PATTERN 20: ADVANCED STRING ALGORITHMS

### When to Use:

- Pattern matching
- String searching
- Anagram problems
- Palindrome variations
- String hashing

### Example 1: Rabin-Karp (Pattern Matching with Rolling Hash)

```java
/**
 * Find all occurrences of pattern in text
 * Input: text="abcabcabc", pattern="abc"
 * Output: [0, 3, 6]
 */

// APPROACH 1: Brute Force
// Time: O(N*M), Space: O(1)
public static ArrayList<Integer> patternSearchBrute(String text, String pattern) {
    ArrayList<Integer> result = new ArrayList<>();
    int n = text.length();
    int m = pattern.length();

    for (int i = 0; i <= n - m; i++) {
        boolean found = true;

        for (int j = 0; j < m; j++) {
            if (text.charAt(i + j) != pattern.charAt(j)) {
                found = false;
                break;
            }
        }

        if (found) result.add(i);
    }

    return result;
}

// APPROACH 2: Rabin-Karp (Rolling Hash)
// Time: O(N + M) average, Space: O(1)
public static ArrayList<Integer> rabinKarp(String text, String pattern) {
    // STEP 1: Pattern = Rolling hash
    ArrayList<Integer> result = new ArrayList<>();
    int n = text.length();
    int m = pattern.length();

    if (m > n) return result;

    // STEP 2: Calculate hash
    int prime = 31;
    int mod = 1000000007;

    // Hash of pattern
    long patternHash = 0;
    long textHash = 0;
    long power = 1;

    // STEP 3: Initial hashes
    for (int i = 0; i < m; i++) {
        patternHash = (patternHash * prime + pattern.charAt(i)) % mod;
        textHash = (textHash * prime + text.charAt(i)) % mod;

        if (i < m - 1) {
            power = (power * prime) % mod;
        }
    }

    // STEP 4: Slide window
    for (int i = 0; i <= n - m; i++) {
        // If hash matches, verify character by character
        if (patternHash == textHash) {
            boolean found = true;

            for (int j = 0; j < m; j++) {
                if (text.charAt(i + j) != pattern.charAt(j)) {
                    found = false;
                    break;
                }
            }

            if (found) result.add(i);
        }

        // Calculate next hash (rolling hash)
        if (i < n - m) {
            textHash = (textHash - text.charAt(i) * power % mod + mod) % mod;
            textHash = (textHash * prime + text.charAt(i + m)) % mod;
        }
    }

    return result;
}

// Visual for text="abcabcabc", pattern="abc":
// patternHash = hash("abc")
//
// Window 1: "abc" → hash matches → verify → found at 0
// Window 2: "bca" → hash differs → skip
// Window 3: "cab" → hash differs → skip
// Window 4: "abc" → hash matches → verify → found at 3
// ...
// Result: [0, 3, 6]
```

### Example 2: Group Anagrams (Advanced)

```java
/**
 * Group strings that are anagrams
 * Input: ["eat","tea","tan","ate","nat","bat"]
 * Output: [["eat","tea","ate"],["tan","nat"],["bat"]]
 */

// APPROACH 1: Sort each string
// Time: O(N * M log M), Space: O(N*M)
public static List<List<String>> groupAnagramsSort(String[] strs) {
    HashMap<String, List<String>> map = new HashMap<>();

    for (String str : strs) {
        char[] chars = str.toCharArray();
        Arrays.sort(chars);
        String sorted = new String(chars);

        map.putIfAbsent(sorted, new ArrayList<>());
        map.get(sorted).add(str);
    }

    return new ArrayList<>(map.values());
}

// APPROACH 2: Frequency Count as Key
// Time: O(N * M), Space: O(N*M)
public static List<List<String>> groupAnagramsCount(String[] strs) {
    // STEP 1: Pattern = Frequency hashing
    HashMap<String, List<String>> map = new HashMap<>();

    for (String str : strs) {
        // STEP 2 & 3: Create frequency signature
        int[] count = new int[26];

        for (char ch : str.toCharArray()) {
            count[ch - 'a']++;
        }

        // STEP 4: Convert to string key
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 26; i++) {
            if (count[i] > 0) {
                sb.append((char)('a' + i));
                sb.append(count[i]);
            }
        }

        String key = sb.toString();
        map.putIfAbsent(key, new ArrayList<>());
        map.get(key).add(str);
    }

    return new ArrayList<>(map.values());
}

// Visual:
// "eat" → sort → "aet" → group 1
// "tea" → sort → "aet" → group 1
// "tan" → sort → "ant" → group 2
// "ate" → sort → "aet" → group 1
// "nat" → sort → "ant" → group 2
// "bat" → sort → "abt" → group 3
```

---

## 📚 PATTERN 21: SORTING ALGORITHMS (Deep Dive with Diagrams)

### 🎨 Visual Comparison of All Sorting Algorithms:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SORTING ALGORITHMS COMPARISON                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Algorithm      │ Best    │ Average │ Worst   │ Space  │ Stable │ Use When  ║
╠═════════════════╪═════════╪═════════╪═════════╪════════╪════════╪═══════════╣
║  Bubble Sort    │ O(N)    │ O(N²)   │ O(N²)   │ O(1)   │ Yes    │ Learning  ║
║  Selection Sort │ O(N²)   │ O(N²)   │ O(N²)   │ O(1)   │ No     │ Learning  ║
║  Insertion Sort │ O(N)    │ O(N²)   │ O(N²)   │ O(1)   │ Yes    │ Small/Near║
║  Merge Sort     │ O(NlogN)│ O(NlogN)│ O(NlogN)│ O(N)   │ Yes    │ Linked    ║
║  Quick Sort     │ O(NlogN)│ O(NlogN)│ O(N²)   │ O(logN)│ No     │ Arrays    ║
║  Heap Sort      │ O(NlogN)│ O(NlogN)│ O(NlogN)│ O(1)   │ No     │ Priority  ║
║  Counting Sort  │ O(N+K)  │ O(N+K)  │ O(N+K)  │ O(K)   │ Yes    │ Small K   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Example 1: Bubble Sort (With Step-by-Step Diagram)

```
╔═══════════════════════════════════════════════════════════════════╗
║                    BUBBLE SORT VISUALIZATION                      ║
╠═══════════════════════════════════════════════════════════════════╣
║  Initial Array: [5, 3, 8, 4, 2]                                   ║
║                                                                   ║
║  Pass 1: (Compare adjacent, bubble largest to end)                ║
║  ┌───┬───┬───┬───┬───┐                                           ║
║  │ 5 │ 3 │ 8 │ 4 │ 2 │  Compare 5,3 → Swap                       ║
║  └───┴───┴───┴───┴───┘                                           ║
║    ↑   ↑                                                          ║
║  ┌───┬───┬───┬───┬───┐                                           ║
║  │ 3 │ 5 │ 8 │ 4 │ 2 │  Compare 5,8 → No swap                    ║
║  └───┴───┴───┴───┴───┘                                           ║
║        ↑   ↑                                                      ║
║  ┌───┬───┬───┬───┬───┐                                           ║
║  │ 3 │ 5 │ 8 │ 4 │ 2 │  Compare 8,4 → Swap                       ║
║  └───┴───┴───┴───┴───┘                                           ║
║            ↑   ↑                                                  ║
║  ┌───┬───┬───┬───┬───┐                                           ║
║  │ 3 │ 5 │ 4 │ 8 │ 2 │  Compare 8,2 → Swap                       ║
║  └───┴───┴───┴───┴───┘                                           ║
║                ↑   ↑                                              ║
║  ┌───┬───┬───┬───┬───┐                                           ║
║  │ 3 │ 5 │ 4 │ 2 │ 8 │  Pass 1 complete! 8 is in place           ║
║  └───┴───┴───┴───┴───┘                                           ║
║                    ✓   (sorted portion)                           ║
║                                                                   ║
║  Pass 2: [3,5,4,2,│8] → [3,4,2,5,│8]                             ║
║  Pass 3: [3,4,2,│5,8] → [3,2,4,│5,8]                             ║
║  Pass 4: [3,2,│4,5,8] → [2,3,│4,5,8]                             ║
║  Pass 5: [2,│3,4,5,8] → [2,3,4,5,8] ✓                            ║
╚═══════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Bubble Sort - Simple but O(N²)
 * Best for: Learning, nearly sorted arrays (optimized version)
 */
public static void bubbleSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;  // Optimization flag

        // Last i elements are already sorted
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }

        // If no swapping in a pass, array is sorted
        if (!swapped) break;
    }
}
```

### Example 2: Selection Sort (With Diagram)

```
╔═══════════════════════════════════════════════════════════════════╗
║                  SELECTION SORT VISUALIZATION                     ║
╠═══════════════════════════════════════════════════════════════════╣
║  Initial: [64, 25, 12, 22, 11]                                    ║
║                                                                   ║
║  Pass 1: Find minimum in [64,25,12,22,11] → 11 at index 4        ║
║  ┌────┬────┬────┬────┬────┐                                      ║
║  │ 64 │ 25 │ 12 │ 22 │ 11 │                                      ║
║  └────┴────┴────┴────┴────┘                                      ║
║    ↑                   ↑                                          ║
║    └───── SWAP ────────┘                                          ║
║  Result: [11, 25, 12, 22, 64]                                     ║
║           ✓                                                       ║
║                                                                   ║
║  Pass 2: Find minimum in [25,12,22,64] → 12 at index 2           ║
║  ┌────┬────┬────┬────┬────┐                                      ║
║  │ 11 │ 25 │ 12 │ 22 │ 64 │                                      ║
║  └────┴────┴────┴────┴────┘                                      ║
║    ✓    ↑    ↑                                                    ║
║         └SWAP┘                                                    ║
║  Result: [11, 12, 25, 22, 64]                                     ║
║           ✓   ✓                                                   ║
║                                                                   ║
║  Pass 3: Find minimum in [25,22,64] → 22 at index 3              ║
║  Result: [11, 12, 22, 25, 64]                                     ║
║           ✓   ✓   ✓                                               ║
║                                                                   ║
║  Pass 4: Find minimum in [25,64] → 25 (already in place)         ║
║  Result: [11, 12, 22, 25, 64] ✓                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Selection Sort - O(N²) but minimal swaps
 * Best for: Small arrays, when write operations are expensive
 */
public static void selectionSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        // Find minimum element in unsorted portion
        int minIdx = i;

        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }

        // Swap minimum with first unsorted element
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}
```

### Example 3: Insertion Sort (With Diagram)

```
╔═══════════════════════════════════════════════════════════════════╗
║                  INSERTION SORT VISUALIZATION                     ║
╠═══════════════════════════════════════════════════════════════════╣
║  Think of sorting playing cards in your hand!                     ║
║                                                                   ║
║  Initial: [5, 2, 4, 6, 1, 3]                                      ║
║                                                                   ║
║  Step 1: [5] is sorted. Take 2, insert in correct position        ║
║  ┌───┐ ┌───┬───┬───┬───┬───┐                                     ║
║  │ 5 │ │ 2 │ 4 │ 6 │ 1 │ 3 │  key=2, shift 5 right               ║
║  └───┘ └───┴───┴───┴───┴───┘                                     ║
║  sorted   ↑                                                       ║
║           └── Insert here                                         ║
║  Result: [2, 5, 4, 6, 1, 3]                                       ║
║           ✓  ✓                                                    ║
║                                                                   ║
║  Step 2: [2,5] sorted. Take 4                                     ║
║  ┌───┬───┐ ┌───┬───┬───┬───┐                                     ║
║  │ 2 │ 5 │ │ 4 │ 6 │ 1 │ 3 │  key=4, 5>4 shift, 2<4 stop        ║
║  └───┴───┘ └───┴───┴───┴───┘                                     ║
║  sorted     ↑                                                     ║
║  Result: [2, 4, 5, 6, 1, 3]                                       ║
║           ✓  ✓  ✓                                                 ║
║                                                                   ║
║  Step 3: key=6, already in place → [2,4,5,6,1,3]                  ║
║  Step 4: key=1, shift all → [1,2,4,5,6,3]                         ║
║  Step 5: key=3, insert after 2 → [1,2,3,4,5,6] ✓                  ║
╚═══════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Insertion Sort - Best for nearly sorted or small arrays
 * Time: O(N) best, O(N²) worst
 */
public static void insertionSort(int[] arr) {
    int n = arr.length;

    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;

        // Shift elements greater than key to the right
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }

        // Insert key at correct position
        arr[j + 1] = key;
    }
}
```

### Example 4: Merge Sort (Divide & Conquer with Diagram)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                      MERGE SORT VISUALIZATION                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Original Array: [38, 27, 43, 3, 9, 82, 10]                               ║
║                                                                           ║
║                    ┌─────────────────────────────┐                        ║
║                    │ 38  27  43  3  9  82  10    │                        ║
║                    └─────────────────────────────┘                        ║
║                              DIVIDE                                       ║
║                    ┌────────────┴────────────┐                            ║
║                    ↓                         ↓                            ║
║           ┌───────────────┐         ┌───────────────┐                     ║
║           │ 38  27  43  3 │         │  9  82  10    │                     ║
║           └───────────────┘         └───────────────┘                     ║
║                DIVIDE                    DIVIDE                           ║
║           ┌─────┴─────┐             ┌─────┴─────┐                         ║
║           ↓           ↓             ↓           ↓                         ║
║      ┌─────────┐ ┌─────────┐   ┌─────────┐ ┌─────────┐                    ║
║      │ 38  27  │ │ 43  3   │   │  9  82  │ │   10    │                    ║
║      └─────────┘ └─────────┘   └─────────┘ └─────────┘                    ║
║         DIVIDE      DIVIDE        DIVIDE     (single)                     ║
║      ┌───┴───┐   ┌───┴───┐    ┌───┴───┐                                   ║
║      ↓       ↓   ↓       ↓    ↓       ↓                                   ║
║    ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                             ║
║    │38 │ │27 │ │43 │ │ 3 │ │ 9 │ │82 │ │10 │  ← ATOMIC (size 1)          ║
║    └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                             ║
║                                                                           ║
║    ═══════════════════ NOW MERGE (CONQUER) ═══════════════════           ║
║                                                                           ║
║    ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                             ║
║    │38 │ │27 │ │43 │ │ 3 │ │ 9 │ │82 │ │10 │                             ║
║    └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                             ║
║      └───┬───┘   └───┬───┘   └───┬───┘   │                               ║
║          ↓           ↓           ↓       ↓                               ║
║      ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───┐                           ║
║      │ 27  38  │ │  3  43  │ │  9  82  │ │10 │  ← MERGE pairs            ║
║      └─────────┘ └─────────┘ └─────────┘ └───┘                           ║
║          └─────────┬─────────┘     └─────────┬───────┘                    ║
║                    ↓                         ↓                            ║
║           ┌───────────────┐         ┌───────────────┐                     ║
║           │ 3  27  38  43 │         │  9  10  82    │  ← MERGE groups     ║
║           └───────────────┘         └───────────────┘                     ║
║                    └───────────┬───────────┘                              ║
║                                ↓                                          ║
║                    ┌─────────────────────────────┐                        ║
║                    │ 3  9  10  27  38  43  82    │  ← FINAL SORTED ✓      ║
║                    └─────────────────────────────┘                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Merge Sort - Guaranteed O(N log N), stable
 * Best for: Linked lists, external sorting, stable sort needed
 */
public static void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;  // Avoid overflow

        // Divide
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);

        // Conquer
        merge(arr, left, mid, right);
    }
}

private static void merge(int[] arr, int left, int mid, int right) {
    // Create temp arrays
    int n1 = mid - left + 1;
    int n2 = right - mid;

    int[] L = new int[n1];
    int[] R = new int[n2];

    // Copy data
    for (int i = 0; i < n1; i++) L[i] = arr[left + i];
    for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

    // Merge back
    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }

    // Copy remaining
    while (i < n1) { arr[k] = L[i]; i++; k++; }
    while (j < n2) { arr[k] = R[j]; j++; k++; }
}
```

### Example 5: Quick Sort (With Pivot Selection Diagram)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                      QUICK SORT VISUALIZATION                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array: [10, 80, 30, 90, 40, 50, 70]    Pivot = 70 (last element)         ║
║                                                                           ║
║  Partition Process (Lomuto scheme):                                       ║
║  ┌────┬────┬────┬────┬────┬────┬────┐                                    ║
║  │ 10 │ 80 │ 30 │ 90 │ 40 │ 50 │ 70 │  pivot=70                          ║
║  └────┴────┴────┴────┴────┴────┴────┘                                    ║
║    ↑                                ↑                                     ║
║    i=-1                           j=0 (scanning)                          ║
║                                                                           ║
║  j=0: arr[0]=10 < 70 → i++, swap arr[i] with arr[j]                      ║
║  ┌────┬────┬────┬────┬────┬────┬────┐                                    ║
║  │ 10 │ 80 │ 30 │ 90 │ 40 │ 50 │ 70 │  i=0, j=0, 10<70 ✓                 ║
║  └────┴────┴────┴────┴────┴────┴────┘                                    ║
║    ↑i                                                                     ║
║                                                                           ║
║  j=1: arr[1]=80 > 70 → no swap                                           ║
║  j=2: arr[2]=30 < 70 → i++, swap arr[1] with arr[2]                      ║
║  ┌────┬────┬────┬────┬────┬────┬────┐                                    ║
║  │ 10 │ 30 │ 80 │ 90 │ 40 │ 50 │ 70 │  swapped 80↔30                     ║
║  └────┴────┴────┴────┴────┴────┴────┘                                    ║
║    ✓    ↑i                                                                ║
║         (elements ≤ pivot)                                                ║
║                                                                           ║
║  j=3: arr[3]=90 > 70 → no swap                                           ║
║  j=4: arr[4]=40 < 70 → i++, swap arr[2] with arr[4]                      ║
║  ┌────┬────┬────┬────┬────┬────┬────┐                                    ║
║  │ 10 │ 30 │ 40 │ 90 │ 80 │ 50 │ 70 │  swapped 80↔40                     ║
║  └────┴────┴────┴────┴────┴────┴────┘                                    ║
║    ✓    ✓    ↑i                                                           ║
║                                                                           ║
║  j=5: arr[5]=50 < 70 → i++, swap arr[3] with arr[5]                      ║
║  ┌────┬────┬────┬────┬────┬────┬────┐                                    ║
║  │ 10 │ 30 │ 40 │ 50 │ 80 │ 90 │ 70 │  swapped 90↔50                     ║
║  └────┴────┴────┴────┴────┴────┴────┘                                    ║
║    ✓    ✓    ✓    ↑i                                                      ║
║                                                                           ║
║  Finally: swap pivot with arr[i+1]                                        ║
║  ┌────┬────┬────┬────┬────┬────┬────┐                                    ║
║  │ 10 │ 30 │ 40 │ 50 │ 70 │ 90 │ 80 │  pivot 70 in correct position!     ║
║  └────┴────┴────┴────┴────┴────┴────┘                                    ║
║    < pivot       ↑     > pivot                                            ║
║              pivot position                                               ║
║                                                                           ║
║  Now recursively sort [10,30,40,50] and [90,80]                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Quick Sort - Average O(N log N), in-place
 * Best for: Arrays (cache-friendly), general purpose
 */
public static void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivotIndex = partition(arr, low, high);

        quickSort(arr, low, pivotIndex - 1);   // Left of pivot
        quickSort(arr, pivotIndex + 1, high);  // Right of pivot
    }
}

private static int partition(int[] arr, int low, int high) {
    int pivot = arr[high];  // Choose last element as pivot
    int i = low - 1;        // Index of smaller element

    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            // Swap arr[i] and arr[j]
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

    // Swap pivot to correct position
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    return i + 1;  // Return pivot index
}
```

---

## 📚 PATTERN 22: SEARCHING ALGORITHMS (With Visual Proofs)

### 🎨 Binary Search Deep Dive:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                     BINARY SEARCH VISUALIZATION                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Sorted Array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]                      ║
║  Target: 23                                                               ║
║                                                                           ║
║  Iteration 1:                                                             ║
║  ┌───┬───┬───┬────┬────┬────┬────┬────┬────┬────┐                        ║
║  │ 2 │ 5 │ 8 │ 12 │ 16 │ 23 │ 38 │ 56 │ 72 │ 91 │                        ║
║  └───┴───┴───┴────┴────┴────┴────┴────┴────┴────┘                        ║
║    ↑                  ↑                       ↑                           ║
║   low               mid=4                   high                          ║
║              arr[4]=16 < 23                                               ║
║              → search RIGHT half                                          ║
║                                                                           ║
║  Iteration 2:                                                             ║
║  ┌───┬───┬───┬────┬────┬────┬────┬────┬────┬────┐                        ║
║  │ 2 │ 5 │ 8 │ 12 │ 16 │ 23 │ 38 │ 56 │ 72 │ 91 │                        ║
║  └───┴───┴───┴────┴────┴────┴────┴────┴────┴────┘                        ║
║                         ↑    ↑              ↑                             ║
║                        low mid=7          high                            ║
║                      arr[7]=56 > 23                                       ║
║                      → search LEFT half                                   ║
║                                                                           ║
║  Iteration 3:                                                             ║
║  ┌───┬───┬───┬────┬────┬────┬────┬────┬────┬────┐                        ║
║  │ 2 │ 5 │ 8 │ 12 │ 16 │ 23 │ 38 │ 56 │ 72 │ 91 │                        ║
║  └───┴───┴───┴────┴────┴────┴────┴────┴────┴────┘                        ║
║                         ↑    ↑    ↑                                       ║
║                        low mid=5 high                                     ║
║                      arr[5]=23 == 23 ✓                                    ║
║                      FOUND at index 5!                                    ║
║                                                                           ║
║  Total comparisons: 3 (vs 6 for linear search)                           ║
║  Time: O(log N) = log₂(10) ≈ 3.3                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Binary Search - All Variants:

```java
/**
 * VARIANT 1: Find exact element (returns index or -1)
 */
public static int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;  // Prevent overflow

        if (arr[mid] == target) {
            return mid;  // Found!
        } else if (arr[mid] < target) {
            low = mid + 1;  // Search right
        } else {
            high = mid - 1;  // Search left
        }
    }

    return -1;  // Not found
}

/**
 * VARIANT 2: Find FIRST occurrence of element
 */
public static int findFirst(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    int result = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (arr[mid] == target) {
            result = mid;     // Found one, but continue left
            high = mid - 1;   // Look for earlier occurrence
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return result;
}

/**
 * VARIANT 3: Find LAST occurrence of element
 */
public static int findLast(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    int result = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (arr[mid] == target) {
            result = mid;     // Found one, but continue right
            low = mid + 1;    // Look for later occurrence
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return result;
}

/**
 * VARIANT 4: Count occurrences using first & last
 */
public static int countOccurrences(int[] arr, int target) {
    int first = findFirst(arr, target);
    if (first == -1) return 0;

    int last = findLast(arr, target);
    return last - first + 1;
}
```

### Visual: First and Last Occurrence

```
╔═══════════════════════════════════════════════════════════════════╗
║           FINDING FIRST AND LAST OCCURRENCE                       ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  Array: [1, 2, 2, 2, 2, 3, 4, 5]    Target: 2                     ║
║  Index:  0  1  2  3  4  5  6  7                                   ║
║                                                                   ║
║  Find FIRST:                                                      ║
║  ┌───┬───┬───┬───┬───┬───┬───┬───┐                               ║
║  │ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │ 4 │ 5 │                               ║
║  └───┴───┴───┴───┴───┴───┴───┴───┘                               ║
║        ↑               ↑                                          ║
║      FIRST           LAST                                         ║
║                                                                   ║
║  Step 1: mid=3, arr[3]=2 == target → save result=3, go LEFT      ║
║  Step 2: mid=1, arr[1]=2 == target → save result=1, go LEFT      ║
║  Step 3: mid=0, arr[0]=1 < target → go RIGHT                     ║
║  Result: first occurrence at index 1                              ║
║                                                                   ║
║  Find LAST:                                                       ║
║  Step 1: mid=3, arr[3]=2 == target → save result=3, go RIGHT     ║
║  Step 2: mid=5, arr[5]=3 > target → go LEFT                      ║
║  Step 3: mid=4, arr[4]=2 == target → save result=4, go RIGHT     ║
║  Result: last occurrence at index 4                               ║
║                                                                   ║
║  Count = last - first + 1 = 4 - 1 + 1 = 4 occurrences            ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 📚 PATTERN 23: HASHING & COLLISION HANDLING

### 🎨 Hash Table Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    HASH TABLE WITH CHAINING                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Hash Function: h(key) = key % 7                                          ║
║                                                                           ║
║  Insert: 15, 11, 27, 8, 12, 22, 43                                        ║
║                                                                           ║
║  15 % 7 = 1                                                               ║
║  11 % 7 = 4                                                               ║
║  27 % 7 = 6                                                               ║
║   8 % 7 = 1  ← Collision with 15!                                         ║
║  12 % 7 = 5                                                               ║
║  22 % 7 = 1  ← Collision with 15, 8!                                      ║
║  43 % 7 = 1  ← Collision with 15, 8, 22!                                  ║
║                                                                           ║
║  Hash Table (Separate Chaining):                                          ║
║  ┌───────┬──────────────────────────────────┐                            ║
║  │ Index │ Linked List                       │                            ║
║  ├───────┼──────────────────────────────────┤                            ║
║  │   0   │ NULL                              │                            ║
║  │   1   │ [15]→[8]→[22]→[43]→NULL          │  ← Chain of collisions     ║
║  │   2   │ NULL                              │                            ║
║  │   3   │ NULL                              │                            ║
║  │   4   │ [11]→NULL                         │                            ║
║  │   5   │ [12]→NULL                         │                            ║
║  │   6   │ [27]→NULL                         │                            ║
║  └───────┴──────────────────────────────────┘                            ║
║                                                                           ║
║  Lookup "22":                                                             ║
║  1. Calculate hash: 22 % 7 = 1                                           ║
║  2. Go to index 1                                                        ║
║  3. Traverse chain: 15 ≠ 22, 8 ≠ 22, 22 == 22 ✓ FOUND!                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 🎨 Open Addressing (Linear Probing):

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    HASH TABLE - LINEAR PROBING                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Hash Function: h(key) = key % 7                                          ║
║  Collision Resolution: Check next slot (linear probing)                   ║
║                                                                           ║
║  Insert: 15, 11, 27, 8                                                    ║
║                                                                           ║
║  Insert 15: h(15) = 1, slot 1 empty → insert at 1                        ║
║  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐               ║
║  │       │  15   │       │       │       │       │       │               ║
║  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘               ║
║     0       1       2       3       4       5       6                     ║
║                                                                           ║
║  Insert 11: h(11) = 4, slot 4 empty → insert at 4                        ║
║  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐               ║
║  │       │  15   │       │       │  11   │       │       │               ║
║  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘               ║
║                                                                           ║
║  Insert 27: h(27) = 6, slot 6 empty → insert at 6                        ║
║  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐               ║
║  │       │  15   │       │       │  11   │       │  27   │               ║
║  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘               ║
║                                                                           ║
║  Insert 8: h(8) = 1, slot 1 OCCUPIED!                                    ║
║            → Probe next: slot 2 empty → insert at 2                      ║
║  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐               ║
║  │       │  15   │   8   │       │  11   │       │  27   │               ║
║  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘               ║
║                 ↑                                                         ║
║            Probed here!                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📚 PATTERN 24: LINKED LIST OPERATIONS (With Diagrams)

### 🎨 Linked List Structure:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    LINKED LIST VISUALIZATION                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Single Linked List:                                                      ║
║                                                                           ║
║  head                                                                     ║
║    │                                                                      ║
║    ↓                                                                      ║
║  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                ║
║  │ data │ next  │───→│ data │ next  │───→│ data │ next  │───→ NULL      ║
║  │  10  │   ●───┼────┤  20  │   ●───┼────┤  30  │   ●───┼────→          ║
║  └──────────────┘    └──────────────┘    └──────────────┘                ║
║       Node 1              Node 2              Node 3                      ║
║                                                                           ║
║  Double Linked List:                                                      ║
║                                                                           ║
║  head                                                                     ║
║    │                                                                      ║
║    ↓                                                                      ║
║  ┌────────────────────┐    ┌────────────────────┐    ┌────────────────┐  ║
║  │ prev │ data │ next │←──→│ prev │ data │ next │←──→│ prev │data│next│  ║
║  │ NULL │  10  │  ●───┼────┤  ●───│  20  │  ●───┼────┤  ●───│ 30│NULL│  ║
║  └────────────────────┘    └────────────────────┘    └────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Example 1: Reverse a Linked List

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                  REVERSE LINKED LIST - STEP BY STEP                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Original: 1 → 2 → 3 → NULL                                               ║
║                                                                           ║
║  Variables: prev = NULL, curr = head, next = NULL                         ║
║                                                                           ║
║  Step 1: Save next, reverse link                                          ║
║  ┌───┐    ┌───┐    ┌───┐                                                 ║
║  │ 1 │───→│ 2 │───→│ 3 │───→ NULL                                        ║
║  └───┘    └───┘    └───┘                                                 ║
║    ↑        ↑                                                             ║
║  curr     next                                                            ║
║    │                                                                      ║
║    └─────→ NULL (reverse link to prev)                                   ║
║                                                                           ║
║  After Step 1:                                                            ║
║  NULL ←───┌───┐    ┌───┐    ┌───┐                                        ║
║           │ 1 │    │ 2 │───→│ 3 │───→ NULL                               ║
║           └───┘    └───┘    └───┘                                        ║
║    ↑        ↑        ↑                                                    ║
║  prev     curr     next                                                   ║
║                                                                           ║
║  Move pointers: prev = curr, curr = next                                  ║
║                                                                           ║
║  Step 2:                                                                  ║
║  NULL ←───┌───┐←───┌───┐    ┌───┐                                        ║
║           │ 1 │    │ 2 │    │ 3 │───→ NULL                               ║
║           └───┘    └───┘    └───┘                                        ║
║            ↑         ↑        ↑                                           ║
║          prev      curr     next                                          ║
║                                                                           ║
║  Step 3:                                                                  ║
║  NULL ←───┌───┐←───┌───┐←───┌───┐                                        ║
║           │ 1 │    │ 2 │    │ 3 │    NULL                                ║
║           └───┘    └───┘    └───┘      ↑                                 ║
║                              ↑        curr                                ║
║                            prev                                           ║
║                                                                           ║
║  Result: 3 → 2 → 1 → NULL                                                 ║
║  New head = prev                                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Reverse Linked List - Iterative
 * Time: O(N), Space: O(1)
 */
public static ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;

    while (curr != null) {
        ListNode next = curr.next;  // Save next
        curr.next = prev;           // Reverse link
        prev = curr;                // Move prev forward
        curr = next;                // Move curr forward
    }

    return prev;  // New head
}

/**
 * Reverse Linked List - Recursive
 * Time: O(N), Space: O(N) due to stack
 */
public static ListNode reverseListRecursive(ListNode head) {
    // Base case
    if (head == null || head.next == null) {
        return head;
    }

    // Recursively reverse rest of list
    ListNode newHead = reverseListRecursive(head.next);

    // Reverse current link
    head.next.next = head;
    head.next = null;

    return newHead;
}
```

### Example 2: Detect Cycle in Linked List (Floyd's Algorithm)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                  FLOYD'S CYCLE DETECTION                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Linked List with Cycle:                                                  ║
║                                                                           ║
║       ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐                          ║
║       │ 1 │───→│ 2 │───→│ 3 │───→│ 4 │───→│ 5 │                          ║
║       └───┘    └───┘    └───┘    └───┘    └───┘                          ║
║                          ↑                   │                            ║
║                          └───────────────────┘                            ║
║                              (cycle!)                                     ║
║                                                                           ║
║  Slow pointer: moves 1 step at a time                                     ║
║  Fast pointer: moves 2 steps at a time                                    ║
║                                                                           ║
║  Step 1: slow=1, fast=2                                                   ║
║  Step 2: slow=2, fast=4                                                   ║
║  Step 3: slow=3, fast=3  ← MEET! Cycle detected                          ║
║                                                                           ║
║  Why this works:                                                          ║
║  ─────────────────────────────────────────────────────                   ║
║  If there's a cycle, fast will eventually catch up to slow.              ║
║  If no cycle, fast will reach NULL.                                      ║
║                                                                           ║
║  Mathematical Proof:                                                      ║
║  • Let cycle length = L                                                   ║
║  • Fast gains 1 node per step on slow                                    ║
║  • After at most L steps in cycle, they'll meet                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Detect Cycle - Floyd's Algorithm (Tortoise & Hare)
 * Time: O(N), Space: O(1)
 */
public static boolean hasCycle(ListNode head) {
    if (head == null || head.next == null) {
        return false;
    }

    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;         // Move 1 step
        fast = fast.next.next;    // Move 2 steps

        if (slow == fast) {
            return true;  // Cycle detected!
        }
    }

    return false;  // No cycle
}

/**
 * Find start of cycle
 * Time: O(N), Space: O(1)
 */
public static ListNode detectCycleStart(ListNode head) {
    if (head == null) return null;

    ListNode slow = head, fast = head;

    // Find meeting point
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow == fast) break;
    }

    // No cycle
    if (fast == null || fast.next == null) {
        return null;
    }

    // Find cycle start: move one pointer to head
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }

    return slow;  // Start of cycle
}
```

---

## 📚 PATTERN 25: TREE TRAVERSALS (With Visual Diagrams)

### 🎨 Binary Tree Structure:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    BINARY TREE VISUALIZATION                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Binary Tree:                                                             ║
║                                                                           ║
║                        ┌───────┐                                          ║
║                        │   1   │  ← Root                                  ║
║                        └───┬───┘                                          ║
║                ┌───────────┴───────────┐                                  ║
║                ↓                       ↓                                  ║
║           ┌───────┐               ┌───────┐                               ║
║           │   2   │               │   3   │                               ║
║           └───┬───┘               └───┬───┘                               ║
║        ┌──────┴──────┐         ┌──────┴──────┐                            ║
║        ↓             ↓         ↓             ↓                            ║
║   ┌───────┐     ┌───────┐ ┌───────┐     ┌───────┐                         ║
║   │   4   │     │   5   │ │   6   │     │   7   │                         ║
║   └───────┘     └───────┘ └───────┘     └───────┘                         ║
║                                                                           ║
║  Tree Terminology:                                                        ║
║  • Root: 1 (top node)                                                     ║
║  • Leaves: 4, 5, 6, 7 (no children)                                       ║
║  • Height: 2 (edges from root to deepest leaf)                            ║
║  • Depth of node 5: 2 (edges from root to node)                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 🎨 All Traversal Types:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    TREE TRAVERSALS COMPARISON                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Tree:                                                                    ║
║                    1                                                      ║
║                   / \                                                     ║
║                  2   3                                                    ║
║                 / \   \                                                   ║
║                4   5   6                                                  ║
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ Traversal      │ Order         │ Result        │ Use Case          │ ║
║  ├─────────────────────────────────────────────────────────────────────┤ ║
║  │ Preorder       │ Root-L-R      │ 1,2,4,5,3,6   │ Copy tree, prefix │ ║
║  │ Inorder        │ L-Root-R      │ 4,2,5,1,3,6   │ BST sorted order  │ ║
║  │ Postorder      │ L-R-Root      │ 4,5,2,6,3,1   │ Delete tree       │ ║
║  │ Level Order    │ Level by Level│ 1,2,3,4,5,6   │ BFS, level-wise   │ ║
║  └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                           ║
║  PREORDER (Root → Left → Right):                                          ║
║                    1 ─────→ START                                        ║
║                   / \                                                     ║
║                  2   3                                                    ║
║                 / \   \                                                   ║
║                4   5   6                                                  ║
║  Visit: 1 → go left → 2 → go left → 4 → back → 5 → back → 3 → 6          ║
║  Result: [1, 2, 4, 5, 3, 6]                                               ║
║                                                                           ║
║  INORDER (Left → Root → Right):                                           ║
║                    1                                                      ║
║                   / \                                                     ║
║                  2   3                                                    ║
║                 / \   \                                                   ║
║                4   5   6                                                  ║
║                ↑                                                          ║
║              START                                                        ║
║  Visit: go left until null → 4 → back → 2 → right → 5 → back → 1 → ...   ║
║  Result: [4, 2, 5, 1, 3, 6]                                               ║
║                                                                           ║
║  POSTORDER (Left → Right → Root):                                         ║
║                    1 ←───── LAST                                         ║
║                   / \                                                     ║
║                  2   3                                                    ║
║                 / \   \                                                   ║
║                4   5   6                                                  ║
║                ↑                                                          ║
║              START                                                        ║
║  Visit: go deepest left → 4 → 5 → 2 → 6 → 3 → 1                          ║
║  Result: [4, 5, 2, 6, 3, 1]                                               ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Tree Traversals - All Types
 */
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

// PREORDER: Root → Left → Right
public static void preorder(TreeNode root) {
    if (root == null) return;

    System.out.print(root.val + " ");  // Visit root
    preorder(root.left);               // Traverse left
    preorder(root.right);              // Traverse right
}

// INORDER: Left → Root → Right (gives sorted order for BST)
public static void inorder(TreeNode root) {
    if (root == null) return;

    inorder(root.left);                // Traverse left
    System.out.print(root.val + " ");  // Visit root
    inorder(root.right);               // Traverse right
}

// POSTORDER: Left → Right → Root
public static void postorder(TreeNode root) {
    if (root == null) return;

    postorder(root.left);              // Traverse left
    postorder(root.right);             // Traverse right
    System.out.print(root.val + " ");  // Visit root
}

// LEVEL ORDER (BFS): Level by level
public static void levelOrder(TreeNode root) {
    if (root == null) return;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        TreeNode node = queue.poll();
        System.out.print(node.val + " ");

        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
    }
}
```

---

## 📚 PATTERN 26: GRAPH BASICS (BFS & DFS with Diagrams)

### 🎨 Graph Representation:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    GRAPH REPRESENTATIONS                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Graph:                                                                   ║
║       0 ──── 1                                                            ║
║       │ \    │                                                            ║
║       │  \   │                                                            ║
║       │   \  │                                                            ║
║       2 ──── 3                                                            ║
║                                                                           ║
║  ADJACENCY MATRIX:                     ADJACENCY LIST:                    ║
║  ┌───┬───┬───┬───┬───┐                                                   ║
║  │   │ 0 │ 1 │ 2 │ 3 │                 0 → [1, 2, 3]                      ║
║  ├───┼───┼───┼───┼───┤                 1 → [0, 3]                         ║
║  │ 0 │ 0 │ 1 │ 1 │ 1 │                 2 → [0, 3]                         ║
║  │ 1 │ 1 │ 0 │ 0 │ 1 │                 3 → [0, 1, 2]                      ║
║  │ 2 │ 1 │ 0 │ 0 │ 1 │                                                   ║
║  │ 3 │ 1 │ 1 │ 1 │ 0 │                                                   ║
║  └───┴───┴───┴───┴───┘                                                   ║
║                                                                           ║
║  Matrix: O(V²) space, O(1) lookup                                        ║
║  List:   O(V+E) space, O(degree) lookup                                  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 🎨 BFS vs DFS Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         BFS vs DFS                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Graph:           Starting from node 0                                    ║
║       0                                                                   ║
║      /|\                                                                  ║
║     1 2 3                                                                 ║
║     |   |                                                                 ║
║     4   5                                                                 ║
║                                                                           ║
║  ┌─────────────────────────────┬─────────────────────────────┐           ║
║  │           BFS               │           DFS               │           ║
║  │    (Level by Level)         │    (Go Deep First)          │           ║
║  ├─────────────────────────────┼─────────────────────────────┤           ║
║  │  Uses: QUEUE                │  Uses: STACK (or recursion) │           ║
║  │                             │                             │           ║
║  │  Order: 0 → 1,2,3 → 4,5     │  Order: 0 → 1 → 4 → 2 → 3→5 │           ║
║  │                             │                             │           ║
║  │  Level 0:  [0]              │  Stack: [0]                 │           ║
║  │  Level 1:  [1, 2, 3]        │  Pop 0, push 3,2,1          │           ║
║  │  Level 2:  [4, 5]           │  Pop 1, push 4              │           ║
║  │                             │  Pop 4 (leaf)               │           ║
║  │  Result: 0,1,2,3,4,5        │  Pop 2 (leaf)               │           ║
║  │                             │  Pop 3, push 5              │           ║
║  │  Best for:                  │  Pop 5 (leaf)               │           ║
║  │  • Shortest path            │                             │           ║
║  │  • Level-order traversal    │  Result: 0,1,4,2,3,5        │           ║
║  │  • Finding neighbors        │                             │           ║
║  │                             │  Best for:                  │           ║
║  │                             │  • Cycle detection          │           ║
║  │                             │  • Path finding             │           ║
║  │                             │  • Topological sort         │           ║
║  └─────────────────────────────┴─────────────────────────────┘           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * BFS - Breadth First Search
 * Time: O(V + E), Space: O(V)
 */
public static void bfs(int start, List<List<Integer>> graph) {
    int n = graph.size();
    boolean[] visited = new boolean[n];
    Queue<Integer> queue = new LinkedList<>();

    visited[start] = true;
    queue.offer(start);

    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.print(node + " ");

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}

/**
 * DFS - Depth First Search (Iterative)
 * Time: O(V + E), Space: O(V)
 */
public static void dfsIterative(int start, List<List<Integer>> graph) {
    int n = graph.size();
    boolean[] visited = new boolean[n];
    Stack<Integer> stack = new Stack<>();

    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();

        if (!visited[node]) {
            visited[node] = true;
            System.out.print(node + " ");

            // Add neighbors (reverse for same order as recursive)
            for (int i = graph.get(node).size() - 1; i >= 0; i--) {
                int neighbor = graph.get(node).get(i);
                if (!visited[neighbor]) {
                    stack.push(neighbor);
                }
            }
        }
    }
}

/**
 * DFS - Recursive
 */
public static void dfsRecursive(int node, List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    System.out.print(node + " ");

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfsRecursive(neighbor, graph, visited);
        }
    }
}
```

---

## 📚 PATTERN 27: HEAP/PRIORITY QUEUE

### 🎨 Heap Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    MIN HEAP VISUALIZATION                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Heap Property: Parent ≤ Children (Min Heap)                              ║
║                 Parent ≥ Children (Max Heap)                              ║
║                                                                           ║
║  Min Heap Tree View:          Array View:                                 ║
║                                                                           ║
║           1                   Index: 0  1  2  3  4  5  6                  ║
║          / \                  Array: [1, 3, 6, 5, 9, 8, 10]               ║
║         3   6                                                             ║
║        / \ / \                Parent of i: (i-1)/2                        ║
║       5  9 8  10              Left child of i: 2*i + 1                    ║
║                               Right child of i: 2*i + 2                   ║
║                                                                           ║
║  INSERT Operation (Add 2):                                                ║
║  ─────────────────────────                                                ║
║  Step 1: Add at end                                                       ║
║           1                                                               ║
║          / \                                                              ║
║         3   6                                                             ║
║        / \ / \                                                            ║
║       5  9 8  10                                                          ║
║      /                                                                    ║
║     2  ← Added here                                                       ║
║                                                                           ║
║  Step 2: Bubble UP (2 < 5, swap)                                          ║
║           1                                                               ║
║          / \                                                              ║
║         3   6                                                             ║
║        / \ / \                                                            ║
║       2  9 8  10                                                          ║
║      /                                                                    ║
║     5                                                                     ║
║                                                                           ║
║  Step 3: Continue (2 < 3, swap)                                           ║
║           1                                                               ║
║          / \                                                              ║
║         2   6                                                             ║
║        / \ / \                                                            ║
║       3  9 8  10                                                          ║
║      /                                                                    ║
║     5  ← Done! Heap property restored                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Using PriorityQueue in Java
 */
public static void heapDemo() {
    // Min Heap (default)
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    // Max Heap
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

    // Operations
    minHeap.offer(5);      // Add element - O(log N)
    minHeap.offer(3);
    minHeap.offer(8);
    minHeap.offer(1);

    System.out.println(minHeap.peek());   // View top: 1 - O(1)
    System.out.println(minHeap.poll());   // Remove top: 1 - O(log N)
    System.out.println(minHeap.poll());   // Remove top: 3 - O(log N)
}

/**
 * Find K Largest Elements using Min Heap
 * Time: O(N log K), Space: O(K)
 */
public static int[] kLargest(int[] arr, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    for (int num : arr) {
        minHeap.offer(num);

        if (minHeap.size() > k) {
            minHeap.poll();  // Remove smallest
        }
    }

    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        result[i] = minHeap.poll();
    }

    return result;
}
```

---

## 📚 PATTERN 28: TRIE (Prefix Tree)

### 🎨 Trie Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                      TRIE (PREFIX TREE) VISUALIZATION                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Words: ["apple", "app", "apply", "bat", "ball"]                          ║
║                                                                           ║
║                         ROOT                                              ║
║                        /    \                                             ║
║                       a      b                                            ║
║                       |      |                                            ║
║                       p      a                                            ║
║                       |      |\                                           ║
║                       p      t l                                          ║
║                      /|      *  l                                         ║
║                     l *         *                                         ║
║                     |           (ball)                                    ║
║                     e                                                     ║
║                     *           * = end of word                           ║
║                    (apple)                                                ║
║                     |                                                     ║
║                     y                                                     ║
║                     *                                                     ║
║                   (apply)                                                 ║
║                                                                           ║
║  Detailed Node Structure:                                                 ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │                           ROOT                                      │ ║
║  │                      children[26]                                   │ ║
║  │                      isEndOfWord: false                             │ ║
║  └─────────────────────────────────────────────────────────────────────┘ ║
║                       /                  \                                ║
║  ┌─────────────────────────┐    ┌─────────────────────────┐              ║
║  │  Node 'a'               │    │  Node 'b'               │              ║
║  │  children[26]           │    │  children[26]           │              ║
║  │  isEndOfWord: false     │    │  isEndOfWord: false     │              ║
║  └─────────────────────────┘    └─────────────────────────┘              ║
║             |                              |                              ║
║            ...                            ...                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 🎨 Insert Operation Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                      TRIE INSERT: "CAT"                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Step 1: Start at ROOT, go to 'C'                                         ║
║                                                                           ║
║          ROOT                                                             ║
║           │                                                               ║
║           ↓                                                               ║
║          [C] ← Create node for 'C'                                        ║
║                                                                           ║
║  Step 2: From 'C', go to 'A'                                              ║
║                                                                           ║
║          ROOT                                                             ║
║           │                                                               ║
║          [C]                                                              ║
║           │                                                               ║
║           ↓                                                               ║
║          [A] ← Create node for 'A'                                        ║
║                                                                           ║
║  Step 3: From 'A', go to 'T', mark as END                                 ║
║                                                                           ║
║          ROOT                                                             ║
║           │                                                               ║
║          [C]                                                              ║
║           │                                                               ║
║          [A]                                                              ║
║           │                                                               ║
║          [T] ← Create node, mark isEndOfWord = true                       ║
║           *                                                               ║
║                                                                           ║
║  Now insert "CAR":                                                        ║
║                                                                           ║
║          ROOT                                                             ║
║           │                                                               ║
║          [C] ← Already exists, reuse                                      ║
║           │                                                               ║
║          [A] ← Already exists, reuse                                      ║
║          / \                                                              ║
║        [T]  [R] ← Create new branch                                       ║
║         *    *                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Trie Implementation
 * Insert, Search, StartsWith: O(word length)
 * Space: O(ALPHABET_SIZE * N * M) worst case
 */
class TrieNode {
    TrieNode[] children;
    boolean isEndOfWord;

    public TrieNode() {
        children = new TrieNode[26];  // a-z
        isEndOfWord = false;
    }
}

class Trie {
    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    // Insert word into Trie
    public void insert(String word) {
        TrieNode current = root;

        for (char c : word.toCharArray()) {
            int index = c - 'a';

            if (current.children[index] == null) {
                current.children[index] = new TrieNode();
            }

            current = current.children[index];
        }

        current.isEndOfWord = true;
    }

    // Search for exact word
    public boolean search(String word) {
        TrieNode node = findNode(word);
        return node != null && node.isEndOfWord;
    }

    // Check if any word starts with prefix
    public boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }

    // Helper: Find node for given string
    private TrieNode findNode(String str) {
        TrieNode current = root;

        for (char c : str.toCharArray()) {
            int index = c - 'a';

            if (current.children[index] == null) {
                return null;  // Path doesn't exist
            }

            current = current.children[index];
        }

        return current;
    }
}
```

---

## 📚 PATTERN 29: UNION-FIND (Disjoint Set)

### 🎨 Union-Find Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    UNION-FIND VISUALIZATION                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Initially: Each element is its own parent                                ║
║                                                                           ║
║  Elements: 0, 1, 2, 3, 4, 5                                               ║
║  Parent:   0  1  2  3  4  5                                               ║
║                                                                           ║
║  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                                     ║
║  │ 0 │ │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │  ← 6 separate components            ║
║  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                                     ║
║                                                                           ║
║  After Union(0, 1):                                                       ║
║  Parent: 0  0  2  3  4  5                                                 ║
║                                                                           ║
║     ┌───┐                                                                 ║
║     │ 0 │ ← Root                                                          ║
║     └─┬─┘                                                                 ║
║       │                                                                   ║
║     ┌─┴─┐                                                                 ║
║     │ 1 │ ← 1's parent is now 0                                           ║
║     └───┘                                                                 ║
║                                                                           ║
║  After Union(2, 3), Union(4, 5):                                          ║
║                                                                           ║
║     ┌───┐     ┌───┐     ┌───┐                                            ║
║     │ 0 │     │ 2 │     │ 4 │  ← 3 components                            ║
║     └─┬─┘     └─┬─┘     └─┬─┘                                            ║
║       │         │         │                                               ║
║     ┌─┴─┐     ┌─┴─┐     ┌─┴─┐                                            ║
║     │ 1 │     │ 3 │     │ 5 │                                            ║
║     └───┘     └───┘     └───┘                                            ║
║                                                                           ║
║  After Union(0, 2):                                                       ║
║                                                                           ║
║           ┌───┐                                                           ║
║           │ 0 │ ← Root of merged tree                                     ║
║           └─┬─┘                                                           ║
║        ┌────┴────┐                                                        ║
║      ┌─┴─┐     ┌─┴─┐                                                      ║
║      │ 1 │     │ 2 │                                                      ║
║      └───┘     └─┬─┘                                                      ║
║                  │                                                        ║
║                ┌─┴─┐                                                      ║
║                │ 3 │                                                      ║
║                └───┘                                                      ║
║                                                                           ║
║  Path Compression: When finding root, make all nodes point directly       ║
║  to root. find(3) → 3→2→0, then update: 3→0, 2→0                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Union-Find with Path Compression and Union by Rank
 * Operations: O(α(N)) ≈ O(1) amortized
 */
class UnionFind {
    private int[] parent;
    private int[] rank;
    private int componentCount;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        componentCount = n;

        // Initially, each element is its own parent
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 0;
        }
    }

    // Find root with path compression
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    // Union by rank
    public void union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        if (rootX == rootY) return;  // Already in same component

        // Attach smaller tree under larger tree
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }

        componentCount--;
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getComponentCount() {
        return componentCount;
    }
}

/**
 * Example: Number of Connected Components
 * Given n nodes and edges, find number of connected components
 */
public static int countComponents(int n, int[][] edges) {
    UnionFind uf = new UnionFind(n);

    for (int[] edge : edges) {
        uf.union(edge[0], edge[1]);
    }

    return uf.getComponentCount();
}
```

---

## 📚 PATTERN 30: INTERVAL PROBLEMS

### 🎨 Interval Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    INTERVAL PROBLEMS VISUALIZATION                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Intervals: [[1,3], [2,6], [8,10], [15,18]]                               ║
║                                                                           ║
║  Timeline:                                                                ║
║  0   1   2   3   4   5   6   7   8   9  10  11 ... 15  16  17  18        ║
║  │   │   │   │   │   │   │   │   │   │   │   │       │   │   │   │       ║
║      ├───────┤                           [1,3]                           ║
║          ├───────────────┤               [2,6] (overlaps with [1,3])     ║
║                              ├───────┤   [8,10]                          ║
║                                              ├───────────┤   [15,18]     ║
║                                                                           ║
║  After Merge: [[1,6], [8,10], [15,18]]                                   ║
║                                                                           ║
║      ├───────────────────┤               [1,6] (merged!)                 ║
║                              ├───────┤   [8,10]                          ║
║                                              ├───────────┤   [15,18]     ║
║                                                                           ║
║  Overlap Detection:                                                       ║
║  ──────────────────                                                       ║
║  Two intervals [a,b] and [c,d] overlap if:                               ║
║  • a ≤ d AND c ≤ b                                                       ║
║  • OR simply: max(a,c) ≤ min(b,d)                                        ║
║                                                                           ║
║  Example:                                                                 ║
║  [1,3] and [2,6]: max(1,2)=2 ≤ min(3,6)=3 ✓ OVERLAP                     ║
║  [1,3] and [8,10]: max(1,8)=8 > min(3,10)=3 ✗ NO OVERLAP                ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Merge Overlapping Intervals
 * Time: O(N log N), Space: O(N)
 */
public static int[][] mergeIntervals(int[][] intervals) {
    if (intervals.length <= 1) return intervals;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];
    result.add(current);

    for (int[] interval : intervals) {
        int currentEnd = current[1];
        int nextStart = interval[0];
        int nextEnd = interval[1];

        if (nextStart <= currentEnd) {
            // Overlap - merge
            current[1] = Math.max(currentEnd, nextEnd);
        } else {
            // No overlap - add new interval
            current = interval;
            result.add(current);
        }
    }

    return result.toArray(new int[result.size()][]);
}

/**
 * Insert Interval into sorted non-overlapping intervals
 * Time: O(N), Space: O(N)
 */
public static int[][] insertInterval(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0;
    int n = intervals.length;

    // Add all intervals ending before newInterval starts
    while (i < n && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i]);
        i++;
    }

    // Merge overlapping intervals
    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    result.add(newInterval);

    // Add remaining intervals
    while (i < n) {
        result.add(intervals[i]);
        i++;
    }

    return result.toArray(new int[result.size()][]);
}
```

---

## 📚 PATTERN 31: BACKTRACKING (Complete Guide)

### 🎨 Backtracking Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    BACKTRACKING VISUALIZATION                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Problem: Generate all permutations of [1, 2, 3]                          ║
║                                                                           ║
║                            []                                             ║
║                        /   |   \                                          ║
║                     [1]   [2]   [3]          ← Choose first element       ║
║                    / \    / \    / \                                      ║
║                [1,2] [1,3] [2,1] [2,3] [3,1] [3,2]   ← Choose second      ║
║                  |     |     |     |     |     |                          ║
║             [1,2,3][1,3,2][2,1,3][2,3,1][3,1,2][3,2,1] ← Choose third     ║
║                                                                           ║
║  Backtracking Framework:                                                  ║
║  ─────────────────────────                                                ║
║                                                                           ║
║  def backtrack(path, choices):                                            ║
║      if goal_reached:                                                     ║
║          add path to result                                               ║
║          return                                                           ║
║                                                                           ║
║      for choice in choices:                                               ║
║          if is_valid(choice):                                             ║
║              make_choice()        ← Add to path                           ║
║              backtrack(...)       ← Recurse                               ║
║              undo_choice()        ← BACKTRACK (remove from path)          ║
║                                                                           ║
║  Visual of one branch:                                                    ║
║                                                                           ║
║  Path: []                                                                 ║
║    │                                                                      ║
║    ├─ Choose 1 → Path: [1]                                               ║
║    │     │                                                                ║
║    │     ├─ Choose 2 → Path: [1,2]                                       ║
║    │     │     │                                                          ║
║    │     │     └─ Choose 3 → Path: [1,2,3] ✓ COMPLETE!                   ║
║    │     │           │                                                    ║
║    │     │           └─ Backtrack → Path: [1,2]                          ║
║    │     │                                                                ║
║    │     └─ Backtrack → Path: [1]                                        ║
║    │                                                                      ║
║    └─ ...continue with next choice                                       ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Generate All Permutations
 * Time: O(N! * N), Space: O(N)
 */
public static List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrackPermute(nums, new ArrayList<>(), used, result);
    return result;
}

private static void backtrackPermute(int[] nums, List<Integer> path,
                                      boolean[] used, List<List<Integer>> result) {
    // Base case: permutation complete
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));  // Add copy
        return;
    }

    // Try each unused number
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;  // Skip if already used

        // Make choice
        path.add(nums[i]);
        used[i] = true;

        // Recurse
        backtrackPermute(nums, path, used, result);

        // Backtrack (undo choice)
        path.remove(path.size() - 1);
        used[i] = false;
    }
}

/**
 * Generate All Subsets
 * Time: O(2^N * N), Space: O(N)
 */
public static List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrackSubsets(nums, 0, new ArrayList<>(), result);
    return result;
}

private static void backtrackSubsets(int[] nums, int start,
                                      List<Integer> path, List<List<Integer>> result) {
    result.add(new ArrayList<>(path));  // Every path is a valid subset

    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrackSubsets(nums, i + 1, path, result);  // i+1 to avoid duplicates
        path.remove(path.size() - 1);  // Backtrack
    }
}

/**
 * Combination Sum (can reuse elements)
 * Find all combinations that sum to target
 */
public static List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(candidates);  // Sort for pruning
    backtrackCombSum(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private static void backtrackCombSum(int[] candidates, int target, int start,
                                      List<Integer> path, List<List<Integer>> result) {
    if (target == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > target) break;  // Pruning

        path.add(candidates[i]);
        backtrackCombSum(candidates, target - candidates[i], i, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

## 📚 PATTERN 32: COMMON STRING PROBLEMS (Master Collection)

### 🎨 String Problem Patterns:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║               COMMON STRING PROBLEM PATTERNS                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Pattern                │ Technique          │ Time    │ Space            ║
║  ───────────────────────┼────────────────────┼─────────┼─────────         ║
║  Palindrome Check       │ Two Pointers       │ O(N)    │ O(1)             ║
║  Anagram Check          │ Frequency Count    │ O(N)    │ O(1)             ║
║  Longest Palindrome Sub │ Expand Around Ctr  │ O(N²)   │ O(1)             ║
║  Longest Common Prefix  │ Vertical Scan      │ O(N*M)  │ O(1)             ║
║  String Matching        │ KMP / Rabin-Karp   │ O(N+M)  │ O(M)             ║
║  Reverse Words          │ Two-pass reverse   │ O(N)    │ O(1)             ║
║  First Non-Repeating    │ Frequency + Scan   │ O(N)    │ O(1)             ║
║  Remove Duplicates      │ HashSet / Two Ptr  │ O(N)    │ O(N) / O(1)      ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 🎨 Palindrome Problems Visual:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    PALINDROME PROBLEMS                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  1. CHECK IF PALINDROME:                                                  ║
║                                                                           ║
║     s = "racecar"                                                         ║
║         ┌───┬───┬───┬───┬───┬───┬───┐                                    ║
║         │ r │ a │ c │ e │ c │ a │ r │                                    ║
║         └───┴───┴───┴───┴───┴───┴───┘                                    ║
║           ↑                       ↑                                       ║
║          left                   right                                     ║
║           ↓                       ↓                                       ║
║         r == r ✓  →  a == a ✓  →  c == c ✓  →  e (middle) ✓              ║
║                                                                           ║
║  2. LONGEST PALINDROMIC SUBSTRING (Expand Around Center):                 ║
║                                                                           ║
║     s = "babad"                                                           ║
║                                                                           ║
║     Center at index 0 ('b'):                                              ║
║         ┌───┬───┬───┬───┬───┐                                            ║
║         │ b │ a │ b │ a │ d │                                            ║
║         └───┴───┴───┴───┴───┘                                            ║
║           ↑                                                               ║
║         center                                                            ║
║         Expand: 'b' is palindrome length 1                               ║
║                                                                           ║
║     Center at index 1 ('a'):                                              ║
║         ┌───┬───┬───┬───┬───┐                                            ║
║         │ b │ a │ b │ a │ d │                                            ║
║         └───┴───┴───┴───┴───┘                                            ║
║           ↑   ↑   ↑                                                       ║
║           L   C   R                                                       ║
║         Expand: L='b', R='b' → equal! → "bab" length 3                   ║
║                                                                           ║
║     Center between 1-2 (even length):                                     ║
║         ┌───┬───┬───┬───┬───┐                                            ║
║         │ b │ a │ b │ a │ d │                                            ║
║         └───┴───┴───┴───┴───┘                                            ║
║               ↑   ↑                                                       ║
║               L   R                                                       ║
║         'a' ≠ 'b' → no even palindrome here                              ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Check if String is Palindrome
 * Time: O(N), Space: O(1)
 */
public static boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) {
            return false;
        }
        left++;
        right--;
    }

    return true;
}

/**
 * Check Palindrome (ignoring non-alphanumeric)
 */
public static boolean isPalindromeAlphanumeric(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        // Skip non-alphanumeric from left
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
            left++;
        }
        // Skip non-alphanumeric from right
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
            right--;
        }

        if (Character.toLowerCase(s.charAt(left)) !=
            Character.toLowerCase(s.charAt(right))) {
            return false;
        }

        left++;
        right--;
    }

    return true;
}

/**
 * Longest Palindromic Substring - Expand Around Center
 * Time: O(N²), Space: O(1)
 */
public static String longestPalindrome(String s) {
    if (s == null || s.length() < 1) return "";

    int start = 0, maxLen = 0;

    for (int i = 0; i < s.length(); i++) {
        // Odd length palindrome (center at i)
        int len1 = expandAroundCenter(s, i, i);

        // Even length palindrome (center between i and i+1)
        int len2 = expandAroundCenter(s, i, i + 1);

        int len = Math.max(len1, len2);

        if (len > maxLen) {
            maxLen = len;
            start = i - (len - 1) / 2;
        }
    }

    return s.substring(start, start + maxLen);
}

private static int expandAroundCenter(String s, int left, int right) {
    while (left >= 0 && right < s.length() &&
           s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return right - left - 1;
}

/**
 * Longest Common Prefix
 * Time: O(S) where S is sum of all characters
 */
public static String longestCommonPrefix(String[] strs) {
    if (strs == null || strs.length == 0) return "";

    for (int i = 0; i < strs[0].length(); i++) {
        char c = strs[0].charAt(i);

        for (int j = 1; j < strs.length; j++) {
            if (i >= strs[j].length() || strs[j].charAt(i) != c) {
                return strs[0].substring(0, i);
            }
        }
    }

    return strs[0];
}

/**
 * First Non-Repeating Character
 * Time: O(N), Space: O(1) - only 26 letters
 */
public static int firstUniqChar(String s) {
    int[] freq = new int[26];

    // Count frequencies
    for (char c : s.toCharArray()) {
        freq[c - 'a']++;
    }

    // Find first with frequency 1
    for (int i = 0; i < s.length(); i++) {
        if (freq[s.charAt(i) - 'a'] == 1) {
            return i;
        }
    }

    return -1;
}

/**
 * Reverse Words in a String
 * "the sky is blue" → "blue is sky the"
 * Time: O(N), Space: O(N)
 */
public static String reverseWords(String s) {
    String[] words = s.trim().split("\\s+");
    StringBuilder result = new StringBuilder();

    for (int i = words.length - 1; i >= 0; i--) {
        result.append(words[i]);
        if (i > 0) result.append(" ");
    }

    return result.toString();
}
```

---

## 📚 PATTERN 33: ARRAY ROTATION PROBLEMS

### 🎨 Array Rotation Visual:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    ARRAY ROTATION VISUALIZATION                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Original: [1, 2, 3, 4, 5, 6, 7]                                          ║
║                                                                           ║
║  ROTATE RIGHT by 3:                                                       ║
║  ┌───┬───┬───┬───┬───┬───┬───┐                                           ║
║  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │                                           ║
║  └───┴───┴───┴───┴───┴───┴───┘                                           ║
║                    ↓                                                      ║
║  ┌───┬───┬───┬───┬───┬───┬───┐                                           ║
║  │ 5 │ 6 │ 7 │ 1 │ 2 │ 3 │ 4 │  (last 3 come to front)                   ║
║  └───┴───┴───┴───┴───┴───┴───┘                                           ║
║                                                                           ║
║  ROTATE LEFT by 2:                                                        ║
║  ┌───┬───┬───┬───┬───┬───┬───┐                                           ║
║  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │                                           ║
║  └───┴───┴───┴───┴───┴───┴───┘                                           ║
║                    ↓                                                      ║
║  ┌───┬───┬───┬───┬───┬───┬───┐                                           ║
║  │ 3 │ 4 │ 5 │ 6 │ 7 │ 1 │ 2 │  (first 2 go to end)                      ║
║  └───┴───┴───┴───┴───┴───┴───┘                                           ║
║                                                                           ║
║  REVERSAL ALGORITHM (for right rotation by k):                            ║
║  ─────────────────────────────────────────────                            ║
║  Step 1: Reverse entire array                                             ║
║  [1,2,3,4,5,6,7] → [7,6,5,4,3,2,1]                                        ║
║                                                                           ║
║  Step 2: Reverse first k elements                                         ║
║  [7,6,5,4,3,2,1] → [5,6,7,4,3,2,1]                                        ║
║   ↑───↑                                                                   ║
║                                                                           ║
║  Step 3: Reverse remaining n-k elements                                   ║
║  [5,6,7,4,3,2,1] → [5,6,7,1,2,3,4] ✓                                      ║
║         ↑───────↑                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
/**
 * Rotate Array Right by K positions
 * Using Reversal Algorithm - Time: O(N), Space: O(1)
 */
public static void rotateRight(int[] nums, int k) {
    int n = nums.length;
    k = k % n;  // Handle k > n

    if (k == 0) return;

    // Step 1: Reverse entire array
    reverse(nums, 0, n - 1);

    // Step 2: Reverse first k elements
    reverse(nums, 0, k - 1);

    // Step 3: Reverse remaining elements
    reverse(nums, k, n - 1);
}

/**
 * Rotate Array Left by K positions
 */
public static void rotateLeft(int[] nums, int k) {
    int n = nums.length;
    k = k % n;

    // Left rotation by k = Right rotation by (n-k)
    rotateRight(nums, n - k);

    // OR use reversal directly:
    // reverse(nums, 0, k-1);
    // reverse(nums, k, n-1);
    // reverse(nums, 0, n-1);
}

private static void reverse(int[] arr, int start, int end) {
    while (start < end) {
        int temp = arr[start];
        arr[start] = arr[end];
        arr[end] = temp;
        start++;
        end--;
    }
}

/**
 * Search in Rotated Sorted Array
 * Time: O(log N)
 */
public static int searchRotated(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        }

        // Check which half is sorted
        if (nums[left] <= nums[mid]) {
            // Left half is sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;  // Target in left half
            } else {
                left = mid + 1;   // Target in right half
            }
        } else {
            // Right half is sorted
            if (target > nums[mid] && target <= nums[right]) {
                left = mid + 1;   // Target in right half
            } else {
                right = mid - 1;  // Target in left half
            }
        }
    }

    return -1;  // Not found
}
```

---

## 📚 MASTER COMPLEXITY CHEAT SHEET

### 🎨 Big-O Visualization:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    BIG-O COMPLEXITY VISUAL                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Time Growth with Input Size N:                                           ║
║                                                                           ║
║  │                                                                        ║
║  │                                                              O(N!)     ║
║  │                                                           ▲            ║
║  │                                                         ▲              ║
║  │                                                       ▲   O(2^N)       ║
║  │                                                     ▲                  ║
║  │                                                   ▲                    ║
║  │                                              ▲▲▲    O(N²)              ║
║  │                                          ▲▲▲                           ║
║  │                                      ▲▲▲                               ║
║  │                                  ▲▲▲     O(N log N)                    ║
║  │                              ▲▲▲                                       ║
║  │                          ▲▲▲                                           ║
║  │                      ▲▲▲         O(N)                                  ║
║  │                  ▲▲▲                                                   ║
║  │              ▲▲▲                                                       ║
║  │          ▲▲▲                     O(log N)                              ║
║  │      ▲▲▲                                                               ║
║  │──────────────────────────────────────────────────────────────  O(1)   ║
║  └──────────────────────────────────────────────────────────────→  N     ║
║          10         100        1000       10000                           ║
║                                                                           ║
║  Practical Reference (N = 1,000,000):                                     ║
║  ┌──────────────┬─────────────────┬───────────────────────────┐          ║
║  │ Complexity   │ Operations      │ Time @ 10^8 ops/sec       │          ║
║  ├──────────────┼─────────────────┼───────────────────────────┤          ║
║  │ O(1)         │ 1               │ 10 nanoseconds            │          ║
║  │ O(log N)     │ 20              │ 200 nanoseconds           │          ║
║  │ O(N)         │ 1,000,000       │ 10 milliseconds           │          ║
║  │ O(N log N)   │ 20,000,000      │ 200 milliseconds          │          ║
║  │ O(N²)        │ 10^12           │ 2.8 hours                 │          ║
║  │ O(2^N)       │ 10^301030       │ Heat death of universe    │          ║
║  └──────────────┴─────────────────┴───────────────────────────┘          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### 🎨 Data Structure Operations:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    DATA STRUCTURE OPERATIONS                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────┬─────────┬─────────┬─────────┬─────────┬──────────┐  ║
║  │ Data Structure  │ Access  │ Search  │ Insert  │ Delete  │ Space    │  ║
║  ├─────────────────┼─────────┼─────────┼─────────┼─────────┼──────────┤  ║
║  │ Array           │ O(1)    │ O(N)    │ O(N)    │ O(N)    │ O(N)     │  ║
║  │ Sorted Array    │ O(1)    │ O(logN) │ O(N)    │ O(N)    │ O(N)     │  ║
║  │ Linked List     │ O(N)    │ O(N)    │ O(1)*   │ O(1)*   │ O(N)     │  ║
║  │ Stack           │ O(N)    │ O(N)    │ O(1)    │ O(1)    │ O(N)     │  ║
║  │ Queue           │ O(N)    │ O(N)    │ O(1)    │ O(1)    │ O(N)     │  ║
║  │ HashMap         │ N/A     │ O(1)    │ O(1)    │ O(1)    │ O(N)     │  ║
║  │ HashSet         │ N/A     │ O(1)    │ O(1)    │ O(1)    │ O(N)     │  ║
║  │ TreeMap         │ N/A     │ O(logN) │ O(logN) │ O(logN) │ O(N)     │  ║
║  │ Heap            │ O(1)**  │ O(N)    │ O(logN) │ O(logN) │ O(N)     │  ║
║  │ BST (balanced)  │ O(logN) │ O(logN) │ O(logN) │ O(logN) │ O(N)     │  ║
║  │ Trie            │ O(M)    │ O(M)    │ O(M)    │ O(M)    │ O(26*M*N)│  ║
║  └─────────────────┴─────────┴─────────┴─────────┴─────────┴──────────┘  ║
║                                                                           ║
║  * = if position known    ** = peek only    M = key length               ║
║                                                                           ║
║  ALGORITHM COMPLEXITIES:                                                  ║
║  ┌─────────────────────────┬────────────┬────────────┬─────────────┐     ║
║  │ Algorithm               │ Best       │ Average    │ Worst       │     ║
║  ├─────────────────────────┼────────────┼────────────┼─────────────┤     ║
║  │ Binary Search           │ O(1)       │ O(log N)   │ O(log N)    │     ║
║  │ Quick Sort              │ O(N log N) │ O(N log N) │ O(N²)       │     ║
║  │ Merge Sort              │ O(N log N) │ O(N log N) │ O(N log N)  │     ║
║  │ BFS/DFS                 │ O(V+E)     │ O(V+E)     │ O(V+E)      │     ║
║  │ Dijkstra's              │ O(E log V) │ O(E log V) │ O(E log V)  │     ║
║  └─────────────────────────┴────────────┴────────────┴─────────────┘     ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📚 QUICK CODE TEMPLATES (COPY-PASTE READY)

### Template 1: HashMap Frequency Counter

```java
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) {
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}
```

### Template 2: Two Pointers (Opposite Direction)

```java
int left = 0, right = arr.length - 1;
while (left < right) {
    // Process arr[left] and arr[right]
    if (condition) {
        left++;
    } else {
        right--;
    }
}
```

### Template 3: Sliding Window (Fixed Size K)

```java
for (int i = 0; i < arr.length; i++) {
    // Add arr[i] to window

    if (i >= k - 1) {  // Window of size k
        // Process window
        // Remove arr[i - k + 1] from window
    }
}
```

### Template 4: Binary Search

```java
int lo = 0, hi = arr.length - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
}
return -1;
```

### Template 5: BFS (Level Order)

```java
Queue<Node> queue = new LinkedList<>();
queue.offer(start);
while (!queue.isEmpty()) {
    int size = queue.size();  // For level tracking
    for (int i = 0; i < size; i++) {
        Node curr = queue.poll();
        // Process curr
        // Add neighbors to queue
    }
}
```

### Template 6: DFS (Recursive)

```java
void dfs(Node node, Set<Node> visited) {
    if (node == null || visited.contains(node)) return;
    visited.add(node);
    // Process node
    for (Node neighbor : node.neighbors) {
        dfs(neighbor, visited);
    }
}
```

### Template 7: Backtracking

```java
void backtrack(List<Integer> path, int[] choices) {
    if (isComplete(path)) {
        result.add(new ArrayList<>(path));
        return;
    }
    for (int choice : choices) {
        if (!isValid(choice)) continue;
        path.add(choice);       // Make choice
        backtrack(path, ...);   // Recurse
        path.remove(path.size()-1);  // Undo choice
    }
}
```

---
